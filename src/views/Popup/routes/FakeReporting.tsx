import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../stores/reducers";
import {
  Button,
  Input,
  Loading,
  Spacer,
  useInput,
  useToasts
} from "@geist-ui/react";
import { JWKInterface } from "arweave/node/lib/wallet";
import { VerifiedIcon } from "@primer/octicons-react";
import Arweave from "arweave";
import axios from "axios";
import WalletManager from "../../../components/WalletManager";
import styles from "../../../styles/views/Popup/send.module.sass";
import fakeNews, {
  ContractState,
  VoteOption
} from "../../../background/fake_news";
import { getActiveTab } from "../../../utils/background";
import { Contract, SmartWeave } from "redstone-smartweave";
import { redstoneCache, fakeNewsContractId } from "../../../utils/constants";

export interface FakeReporting {
  arweave: Arweave;
  smartweave: SmartWeave;
  fakeContractTxId: string;
  contract: Contract;
  addressKey: JWKInterface;
}

export default function FakeReporting({
  arweave,
  smartweave,
  fakeContractTxId,
  addressKey
}: FakeReporting) {
  const dsptTokenSymbol = "TRUTH",
    dsptTokensAmount = useInput(""),
    expirationBlock = useInput(""),
    dsptStakeAmount = useInput(""),
    [waitingForConfirmation, setWaitingForConfirmation] = useState(false),
    profile = useSelector((state: RootState) => state.profile),
    wallets = useSelector((state: RootState) => state.wallets),
    currentWallet = wallets.find(({ address }) => address === profile),
    [tabUrl, setTabUrl] = useState<string | undefined>("https://google.com"),
    [dsptBalance, setDsptBalance] = useState(0),
    [loading, setLoading] = useState({ disputes: true, balance: true }),
    [, setToast] = useToasts(),
    [verified] = useState<{
      verified: boolean;
      icon: string;
      percentage: number;
    }>(),
    contract: Contract<ContractState> = smartweave
      .contract<ContractState>(fakeContractTxId)
      .connect(addressKey),
    [contractDisputes, setContractDisputes] = useState<
      { key: string; value: any }[]
    >([]),
    [pageAlreadyReported, setPageAlreadyReported] = useState<boolean>(false),
    [divisibility, setDivisibility] = useState<number>(0),
    [value, setValue] = useState<any>({}),
    handler = (e: any, dsptIdx: number, idx: number) => {
      setValue({
        ...value,
        [2 * dsptIdx + idx]: e.target.value
      });
    },
    [currentBlockHeight, setCurrentBlockHeight] = useState<number>(0);

  useEffect(() => {
    fetchContractDisputes();
    loadBlockHeight();
    loadActiveTab();
    // eslint-disable-next-line
  }, [profile]);

  useEffect(() => {
    setPageAlreadyReported(
      contractDisputes.some(
        (r: { key: string; value: object }) => r.key === tabUrl
      )
    );
  }, [tabUrl, contractDisputes]);

  async function loadActiveTab() {
    const currentTab = await getActiveTab();
    const shortUrl = currentTab.url
      ? currentTab.url.split("?")[0]
      : currentTab.url;
    setTabUrl(shortUrl);
  }

  async function loadBlockHeight() {
    const info = await arweave.network.getInfo();
    const currentHeight = info.height;
    setCurrentBlockHeight(currentHeight);
  }

  async function fetchContractDisputes() {
    const { data }: any = await axios.get(
      `${redstoneCache}/cache/state/${fakeNewsContractId}`
    );
    const divisibility = data.state.divisibility;
    const disputes = new Map(Object.entries(data.state.disputes));

    setDivisibility(divisibility);

    setContractDisputes(
      Array.from(disputes, ([key, value]) => ({ key, value }))
    );
    setLoading((val) => ({ ...val, disputes: false }));
    await loadDsptBalance(divisibility);
  }

  async function loadDsptBalance(divisibility: number) {
    if (!currentWallet) {
      setToast({
        type: "error",
        text: "No address specified."
      });
      return;
    } else {
      const loadedDsptBalance = await fakeNews.getBalance(
        currentWallet.address,
        divisibility
      );
      setDsptBalance(loadedDsptBalance);
      setLoading((val) => ({ ...val, balance: false }));
    }
  }

  async function buttonClickedInFakeReportSection(
    dsptTokensAmount: number,
    expirationBlock: number
  ) {
    if (waitingForConfirmation) {
      if (dsptBalance < dsptTokensAmount) {
        setToast({
          type: "error",
          text: "You need to mint some tokens first!"
        });
        return;
      }
      if (!expirationBlock) {
        setToast({
          type: "error",
          text: "You need to type in expiration block"
        });
        return;
      }
      if (!tabUrl) {
        setToast({
          type: "error",
          text: "No url available."
        });
        return;
      }

      await fakeNews.reportPageAsFake(
        tabUrl,
        contract,
        expirationBlock,
        fakeNews.postMultipliedTokens(dsptTokensAmount, divisibility)
      );

      await fetchContractDisputes();
      setWaitingForConfirmation(false);
    } else {
      setWaitingForConfirmation(true);
    }
  }

  async function buttonClickedInVoteSection(
    disputeIdx: number,
    dsptStakeAmountState: number,
    selectedOptionIndex: number
  ) {
    let voted: boolean = false;
    contractDisputes[disputeIdx].value.votes.forEach((v: VoteOption) => {
      if (Object.keys(v.votes).includes(profile)) {
        setToast({
          type: "error",
          text: "You've already voted for this dispute!"
        });
        voted = true;
        return;
      }
    });
    if (voted) {
      return;
    }
    if (!dsptStakeAmount || !expirationBlock) {
      setToast({
        type: "error",
        text: "You need to enter all required values"
      });
      return;
    }

    if (dsptBalance < dsptStakeAmountState) {
      setToast({ type: "error", text: "You need to mint some tokens first!" });
      return;
    }
    const url = contractDisputes[disputeIdx].key;
    await fakeNews.vote(
      url,
      contract,
      fakeNews.postMultipliedTokens(dsptStakeAmountState, divisibility),
      selectedOptionIndex
    );

    await fetchContractDisputes();
    dsptStakeAmount.reset();
  }

  async function buttonClickedInWithdrawRewardsSection(disputeIdx: number) {
    let voted: number = 0;
    contractDisputes[disputeIdx].value.votes.forEach((v: VoteOption) => {
      if (Object.keys(v.votes).includes(profile)) {
        voted++;
        return;
      }
    });
    if (!voted) {
      setToast({
        type: "error",
        text: "You are not authorized to withdraw reward."
      });
      return;
    }

    if (
      contractDisputes[disputeIdx].value.calculated &&
      !contractDisputes[disputeIdx].value.withdrawableAmounts.hasOwnProperty(
        profile
      )
    ) {
      setToast({
        type: "error",
        text: "You've lost the dispute."
      });
      return;
    }
    if (
      contractDisputes[disputeIdx].value.withdrawableAmounts.hasOwnProperty(
        profile
      ) &&
      contractDisputes[disputeIdx].value.withdrawableAmounts[profile] == 0
    ) {
      setToast({
        type: "error",
        text: "You've already withdrawn your reward."
      });
      return;
    }
    const disputeId = contractDisputes[disputeIdx].key;
    await fakeNews.withdrawRewards(contract, disputeId);

    await fetchContractDisputes();
    await loadDsptBalance(divisibility);
    setToast({
      type: "success",
      text: `Your reward is: ${contractDisputes[disputeIdx].value.withdrawableAmounts[profile]}`
    });
  }

  const subSectionStyles = {
    borderBottom: "1px solid #ddd",
    marginBottom: "10px"
  };

  const getVotesSum = (votes: object): number => {
    const sum = Object.values(votes).reduce(
      (a, c) =>
        fakeNews.getRoundedTokens(a, divisibility) +
        fakeNews.getRoundedTokens(c, divisibility),
      0
    );
    return sum;
  };

  return (
    <>
      <WalletManager />
      <div className={styles.View}>
        <div
          className={
            verified && verified.verified
              ? styles.Amount + " " + styles.Target
              : ""
          }
        >
          <div
            className="dspt-balance"
            style={{ textAlign: "center", ...subSectionStyles }}
          >
            <h2 style={{ marginBottom: "0px" }}>
              {loading.balance && <Loading />}
              {!loading.balance && (
                <>
                  <span>{dsptBalance}</span> <span>{dsptTokenSymbol}</span>
                  <span
                    style={{
                      position: "relative",
                      left: "5px",
                      bottom: "8px"
                    }}
                  >
                    <VerifiedIcon size={26} />
                  </span>
                </>
              )}
            </h2>
            <div
              style={{
                textAlign: "center",
                color: "#777",
                marginBottom: "20px",
                fontSize: "14px"
              }}
            >
              Balance for fake reports
            </div>
          </div>

          {pageAlreadyReported && (
            <div
              style={{
                fontSize: "14px",
                marginBottom: "10px",
                textAlign: "center",
                color: "grey"
              }}
            >
              Page already reported, please join in the dispute below.
              <br />
              <div
                style={{
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                  fontWeight: "bold"
                }}
              >
                {tabUrl}
              </div>
            </div>
          )}
          {!pageAlreadyReported && (
            <div
              className="report-page-as-fake"
              style={{ ...subSectionStyles, color: "gray" }}
            >
              <div
                style={{
                  fontSize: "14px",
                  marginBottom: "10px",
                  textAlign: "center"
                }}
              >
                Do you want to report this page as fake?
                <br />
                <div
                  style={{
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                    fontWeight: "bold"
                  }}
                >
                  {tabUrl}
                </div>
              </div>
              {waitingForConfirmation && (
                <>
                  {" "}
                  <div style={{ marginBottom: "10px" }}>
                    <Input
                      {...dsptTokensAmount.bindings}
                      placeholder={`Initial stake amount`}
                      labelRight={dsptTokenSymbol}
                      htmlType="number"
                      min="0"
                    />
                  </div>
                  <div style={{ marginBottom: "10px" }}>
                    <Input
                      {...expirationBlock.bindings}
                      placeholder={`Expiration blocks`}
                      htmlType="number"
                      min="0"
                    />
                  </div>
                </>
              )}

              <Button
                style={{ width: "100%", marginBottom: "10px" }}
                type="success"
                onClick={() =>
                  buttonClickedInFakeReportSection(
                    parseInt(dsptTokensAmount.state),
                    parseInt(expirationBlock.state)
                  )
                }
              >
                {waitingForConfirmation ? "Confirm fake report" : "Report fake"}
              </Button>
            </div>
          )}

          {/* Reports list */}
          <div className="fake-reports-list" style={{ ...subSectionStyles }}>
            <h4 style={{ textAlign: "center" }}>Fake reports</h4>
            {loading.disputes && (
              <>
                <Spacer h={0.5} />
                <Loading />
                <Spacer h={1.25} />
              </>
            )}
            {contractDisputes &&
              contractDisputes.map(
                (dispute: { key: string; value: any }, disputeIdx: number) => (
                  <div
                    style={{
                      padding: "10px",
                      borderRadius: "5px",
                      marginBottom: "10px",
                      color: "gray",
                      fontSize: "14px",
                      border: "1px solid #a99eec"
                    }}
                  >
                    <div
                      style={{
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        maxWidth: "100%",
                        fontWeight: "bold"
                      }}
                    >
                      {dispute.key}
                    </div>
                    {dispute.value.votes.map((v: VoteOption, idx: number) => (
                      <div>
                        <hr />

                        <div style={{ display: "flex" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              marginBottom: "10px",
                              marginRight: "0.5rem",
                              width: "20%"
                            }}
                          >
                            <span style={{ textTransform: "uppercase" }}>
                              {v.label}
                            </span>
                            :{" "}
                            <strong style={{ marginLeft: "0.25rem" }}>
                              {getVotesSum(v.votes)}
                            </strong>
                            <br />
                          </div>
                          {
                            <>
                              <div style={{ marginBottom: "10px" }}>
                                <Input
                                  value={
                                    value[2 * disputeIdx + idx]
                                      ? value[2 * disputeIdx + idx]
                                      : ""
                                  }
                                  onChange={(e) => handler(e, disputeIdx, idx)}
                                  placeholder={`Amount`}
                                  labelRight={dsptTokenSymbol}
                                  htmlType="number"
                                  min="0"
                                />
                              </div>
                            </>
                          }
                          <Button
                            style={{
                              minWidth: "auto",
                              lineHeight: "inherit",
                              height: "calc(2.5 * 14px)",
                              marginBottom: "10px",
                              marginLeft: "0.5rem"
                            }}
                            type="success"
                            disabled={
                              dispute.value.expirationBlock -
                                currentBlockHeight <=
                              0
                            }
                            onClick={() =>
                              buttonClickedInVoteSection(
                                disputeIdx,
                                parseInt(value[2 * disputeIdx + idx]),
                                idx
                              )
                            }
                          >
                            Vote
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between"
                      }}
                    >
                      <div style={{ alignItems: "center", display: "flex" }}>
                        <span>Blocks till withdraw: </span>
                        <strong style={{ marginLeft: "0.25rem" }}>
                          {dispute.value.expirationBlock - currentBlockHeight <
                          0
                            ? 0
                            : dispute.value.expirationBlock -
                              currentBlockHeight}
                        </strong>
                      </div>

                      {
                        <Button
                          style={{ minWidth: "auto", marginBottom: "10px" }}
                          type="success"
                          disabled={
                            dispute.value.expirationBlock - currentBlockHeight >
                            0
                          }
                          onClick={() =>
                            buttonClickedInWithdrawRewardsSection(disputeIdx)
                          }
                        >
                          Withdraw
                        </Button>
                      }
                    </div>
                  </div>
                )
              )}
          </div>
        </div>
      </div>
    </>
  );
}
