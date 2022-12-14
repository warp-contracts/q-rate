import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../stores/reducers';
import {
  Button,
  Input,
  Loading,
  Radio,
  Spacer,
  Tabs,
  useInput,
  useToasts
} from '@geist-ui/react';
import { JWKInterface } from 'arweave/node/lib/wallet';
import { VerifiedIcon } from '@primer/octicons-react';
import Arweave from 'arweave';
import WalletManager from '../../../components/WalletManager';
import styles from '../../../styles/views/Popup/send.module.sass';
import fakeNews, {
  ContractDispute,
  ContractState,
  Dispute,
  getBalance,
  getState,
  mint,
  VoteOption
} from '../../../background/fake_news';
import { getActiveTab } from '../../../utils/background';
import { Warp, Contract } from 'warp-contracts';
import FakeReportingList from '../../../components/FakeReportingList';
import { fakeNewsContractId } from '../../../utils/constants';

export interface FakeReporting {
  arweave: Arweave;
  smartweave: Warp;
  fakeContractTxId: string;
  addressKey: JWKInterface;
}

export default function FakeReporting({
  arweave,
  smartweave,
  fakeContractTxId,
  addressKey
}: FakeReporting) {
  const dsptTokenSymbol = 'QRT',
    dsptTokensAmount = useInput(''),
    // dsptExpirationTimestamp = useInput(
    //   (Math.trunc(+Date.now() / 1000) + 86400).toString()
    // ),
    [dsptExpirationTimestamp, setDsptExpirationTimestamp] = useState('600'),
    [waitingForConfirmation, setWaitingForConfirmation] = useState(false),
    profile = useSelector((state: RootState) => state.profile),
    wallets = useSelector((state: RootState) => state.wallets),
    currentWallet = wallets.find(({ address }) => address === profile),
    [tabUrl, setTabUrl] = useState<string | undefined>('https://google.com'),
    [dsptBalance, setDsptBalance] = useState(0),
    [loading, setLoading] = useState({
      mint: false,
      disputes: true,
      balance: true,
      report: false,
      vote: [],
      withdraw: []
    }),
    [, setToast] = useToasts(),
    [verified] = useState<{
      verified: boolean;
      icon: string;
      percentage: number;
    }>(),
    contract: Contract<ContractState> = smartweave
      .contract<ContractState>(fakeContractTxId)
      .connect(addressKey),
    [contractDisputes, setContractDisputes] = useState<ContractDispute>({}),
    [addresses, setAddresses] = useState<string[]>([]),
    [pageAlreadyReported, setPageAlreadyReported] = useState<boolean>(false),
    [divisibility, setDivisibility] = useState<number>(0),
    [value, setValue] = useState<any>({}),
    handler = (e: any, dsptIdx: number, idx: number) => {
      setValue({
        ...value,
        [2 * dsptIdx + idx]: e.target.value
      });
    },
    [currentTimestamp, setCurrentTimestamp] = useState<number>(0);

  useEffect(() => {
    fetchContractDisputes();
    setCurrentTimestamp(Math.trunc(+Date.now() / 1000));
    loadActiveTab();
    // eslint-disable-next-line
  }, [profile]);

  useEffect(() => {
    if (contractDisputes) {
      setPageAlreadyReported(
        Object.keys(contractDisputes).some(
          (r: string) => contractDisputes[r].id === tabUrl
        )
      );
    }
  }, [tabUrl, contractDisputes]);

  async function loadActiveTab() {
    const currentTab = await getActiveTab();
    const shortUrl = currentTab.url
      ? currentTab.url.split('?')[0]
      : currentTab.url;
    setTabUrl(shortUrl);
  }

  async function fetchContractDisputes() {
    if (!currentWallet) {
      setToast({
        type: 'error',
        text: 'No address specified.'
      });
      return;
    } else {
      const { divisibility, disputes, balance, addresses } = await getState(
        contract,
        currentWallet.address
      );
      setAddresses(addresses);
      setDivisibility(divisibility);
      setContractDisputes(disputes);
      setLoading((val) => ({ ...val, disputes: false }));
      setDsptBalance(balance);
      setLoading((val) => ({ ...val, balance: false }));
    }
  }

  async function buttonClickedInMintSection() {
    if (addresses.includes(currentWallet?.address)) {
      setToast({
        type: 'error',
        text: 'Caller has already minted QRT tokens.'
      });
      return;
    }

    setLoading((val) => ({ ...val, mint: true }));

    await mint(contract);
    const updatedBalance = await getBalance(
      contract,
      currentWallet?.address,
      divisibility
    );
    setLoading((val) => ({ ...val, mint: false }));

    setDsptBalance(updatedBalance);
  }

  async function buttonClickedInFakeReportSection(
    dsptTokensAmount: number,
    dsptExpirationTimestamp: string
  ) {
    const parsedExpiration = (
      Math.trunc(+Date.now() / 1000) + parseInt(dsptExpirationTimestamp)
    ).toString();
    if (parsedExpiration.length < 10 || parsedExpiration.length > 13) {
      setToast({
        type: 'error',
        text: 'Incorrect timestamp.'
      });
      return;
    }
    let parsedExpirationTimestamp;

    if (parsedExpiration.length === 13) {
      parsedExpirationTimestamp = Math.trunc(
        parseInt(parsedExpiration) / 1000
      ).toString();
    } else {
      parsedExpirationTimestamp = parsedExpiration;
    }
    if (waitingForConfirmation) {
      if (dsptBalance < dsptTokensAmount) {
        setToast({
          type: 'error',
          text: 'You need to mint some tokens first!'
        });
        return;
      }
      if (
        parseInt(parsedExpirationTimestamp) <= Math.trunc(+Date.now() / 1000)
      ) {
        setToast({
          type: 'error',
          text: 'Expiration timestamp should be set to future!'
        });
        return;
      }
      if (!tabUrl) {
        setToast({
          type: 'error',
          text: 'No url available.'
        });
        return;
      }

      setLoading((val) => ({ ...val, report: true }));
      await fakeNews.reportPageAsFake(
        tabUrl,
        contract,
        parsedExpirationTimestamp,
        fakeNews.postMultipliedTokens(dsptTokensAmount, divisibility)
      );

      await fetchContractDisputes();
      setWaitingForConfirmation(false);
      setLoading((val) => ({ ...val, report: false }));
    } else {
      setWaitingForConfirmation(true);
    }
  }

  async function buttonClickedInVoteSection(
    disputeIdx: number,
    dispute: string,
    dsptStakeAmountState: number,
    selectedOptionIndex: number
  ) {
    let voted: boolean = false;
    contractDisputes[dispute].votes.forEach((v: VoteOption) => {
      if (Object.keys(v.votes).includes(profile)) {
        setToast({
          type: 'error',
          text: "You've already voted for this dispute!"
        });
        voted = true;
        return;
      }
    });
    if (voted) {
      setValue({
        ...value,
        [2 * disputeIdx + selectedOptionIndex]: ''
      });
      return;
    }
    if (!dsptStakeAmountState) {
      setToast({
        type: 'error',
        text: 'You need to enter stake amount.'
      });
      return;
    }

    if (dsptBalance < dsptStakeAmountState) {
      setToast({ type: 'error', text: 'You need to mint some tokens first!' });
      setValue({
        ...value,
        [2 * disputeIdx + selectedOptionIndex]: ''
      });
      return;
    }
    setLoading((val) => ({
      ...val,
      vote: {
        ...value,
        [2 * disputeIdx + selectedOptionIndex]: true
      }
    }));
    const url = contractDisputes[dispute].id;
    await fakeNews.vote(
      url,
      contract,
      fakeNews.postMultipliedTokens(dsptStakeAmountState, divisibility),
      selectedOptionIndex
    );

    await fetchContractDisputes();
    setValue({
      ...value,
      [2 * disputeIdx + selectedOptionIndex]: ''
    });
    setLoading((val) => ({
      ...val,
      vote: {
        ...value,
        [2 * disputeIdx + selectedOptionIndex]: false
      }
    }));
  }

  async function buttonClickedInWithdrawRewardsSection(
    dispute: string,
    disputeIdx: number
  ) {
    let voted: number = 0;
    contractDisputes[dispute].votes.forEach((v: VoteOption) => {
      if (Object.keys(v.votes).includes(profile)) {
        voted++;
        return;
      }
    });
    if (!voted) {
      setToast({
        type: 'error',
        text: 'You are not authorized to withdraw reward.'
      });
      return;
    }

    if (
      contractDisputes[dispute].calculated &&
      !contractDisputes[dispute].withdrawableAmounts.hasOwnProperty(profile)
    ) {
      setToast({
        type: 'error',
        text: "You've lost the dispute."
      });
      return;
    }
    if (
      contractDisputes[dispute].withdrawableAmounts.hasOwnProperty(profile) &&
      contractDisputes[dispute].withdrawableAmounts[profile] == 0
    ) {
      setToast({
        type: 'error',
        text: "You've already withdrawn your reward."
      });
      return;
    }
    setLoading((val) => ({
      ...val,
      withdraw: {
        ...value,
        [disputeIdx]: true
      }
    }));
    const disputeId = contractDisputes[dispute].id;
    await fakeNews.withdrawRewards(contract, disputeId);

    await fetchContractDisputes();
    setToast({
      type: 'success',
      text: `Your reward has been withdrawn.`
    });

    setLoading((val) => ({
      ...val,
      withdraw: {
        ...value,
        [disputeIdx]: false
      }
    }));
  }

  const countVotesSumForLabel = (dispute: Dispute, label: string) => {
    return fakeNews.getVotesSum(
      dispute.votes.find((v: VoteOption) => v.label == label)!.votes,
      divisibility
    );
  };
  const subSectionStyles = {
    borderBottom: '1px solid #ddd',
    marginBottom: '10px'
  };

  const expirationTimestampHandler = (val: string | number) => {
    // const time = (
    //   Math.trunc(+Date.now() / 1000) + typeof val === "string"
    //     ? parseInt(val)
    //     : val
    // ).toString();
    setDsptExpirationTimestamp(val);
  };

  return (
    <>
      <WalletManager />
      <div className={styles.View}>
        <div
          className={
            verified && verified.verified
              ? styles.Amount + ' ' + styles.Target
              : ''
          }
        >
          <div
            className="dspt-balance"
            style={{ textAlign: 'center', ...subSectionStyles }}
          >
            <h2 style={{ marginBottom: '0px' }}>
              {loading.balance && <Loading />}
              {!loading.balance && (
                <>
                  <span>{dsptBalance}</span> <span>{dsptTokenSymbol}</span>
                  <span
                    style={{
                      position: 'relative',
                      left: '5px',
                      bottom: '8px'
                    }}
                  >
                    <VerifiedIcon size={26} />
                  </span>
                </>
              )}
            </h2>
            <Button
              style={{ width: '20%', marginBottom: '10px' }}
              type="success"
              ghost
              loading={loading.mint}
              onClick={() => buttonClickedInMintSection()}
            >
              {'Mint'}
            </Button>
            {/* <div
              style={{
                textAlign: "center",
                color: "#777",
                marginBottom: "20px",
                fontSize: "14px",
                paddingRight: "30px",
                paddingLeft: "30px"
              }}
            >
              If you'd like to mint some tokens, please contact us on{" "}
              <a href="https://discord.com/invite/PVxBZKFr46">discord.</a>
            </div> */}
            <div
              style={{
                fontSize: '14px',
                marginBottom: '10px',
                textAlign: 'center',
                color: 'gray'
              }}
            >
              Verify contract in
              <a
                style={{ paddingLeft: '0.25rem' }}
                href={`https://sonar.redstone.tools/#/app/contract/${fakeNewsContractId}`}
                target="_blank"
              >
                SonAR.
              </a>
            </div>
          </div>

          {pageAlreadyReported && (
            <div
              className="report-page-as-fake"
              style={{ ...subSectionStyles, color: 'gray' }}
            >
              <div
                style={{
                  fontSize: '14px',
                  marginBottom: '10px',
                  textAlign: 'center',
                  color: 'grey',
                  fontWeight: 'bold'
                }}
              >
                Page already reported, please join in the dispute below.
              </div>
              <div
                style={{
                  fontSize: '14px',
                  marginBottom: '10px',
                  textAlign: 'center',
                  color: 'grey',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                  fontWeight: 'bold'
                }}
              >
                <a href={tabUrl} target="_blank">
                  {tabUrl}
                </a>
              </div>
            </div>
          )}
          {!pageAlreadyReported && (
            <div
              className="report-page-as-fake"
              style={{ ...subSectionStyles, color: 'gray' }}
            >
              <div
                style={{
                  fontSize: '14px',
                  textAlign: 'center',
                  color: 'grey',
                  fontWeight: 'bold'
                }}
              >
                Do you want to report this page as fake?
              </div>
              <div
                style={{
                  fontSize: '14px',
                  marginBottom: '10px',
                  textAlign: 'center',
                  color: 'grey',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                  fontWeight: 'bold'
                }}
              >
                <a href={tabUrl} target="_blank">
                  {tabUrl}
                </a>
              </div>
              {waitingForConfirmation && (
                <>
                  {' '}
                  <div style={{ marginBottom: '10px' }}>
                    <Input
                      {...dsptTokensAmount.bindings}
                      placeholder={`Initial stake amount`}
                      labelRight={dsptTokenSymbol}
                      htmlType="number"
                      min="0"
                    />
                  </div>
                  <div
                    style={{
                      marginBottom: '20px',
                      marginTop: '20px',
                      display: 'flex'
                    }}
                  >
                    <div style={{ width: '22%', alignSelf: 'center' }}>
                      Expiry:
                    </div>
                    <Radio.Group
                      value={dsptExpirationTimestamp}
                      onChange={expirationTimestampHandler}
                      useRow
                    >
                      <Radio value="600">10 minutes</Radio>
                      <Radio value="86400">1 day</Radio>
                      <Radio value="604800">7 days</Radio>
                    </Radio.Group>
                  </div>
                </>
              )}

              <Button
                style={{ width: '100%', marginBottom: '10px' }}
                type="success"
                loading={loading.report}
                onClick={() =>
                  buttonClickedInFakeReportSection(
                    parseInt(dsptTokensAmount.state),
                    dsptExpirationTimestamp
                  )
                }
              >
                {waitingForConfirmation ? 'Confirm fake report' : 'Report fake'}
              </Button>
            </div>
          )}

          {/* Reports list */}
          <div className="fake-reports-list" style={{ ...subSectionStyles }}>
            <h4 style={{ textAlign: 'center' }}>Fake reports</h4>
            {loading.disputes && (
              <>
                <Spacer h={0.5} />
                <Loading />
                <Spacer h={1.25} />
              </>
            )}
            {!loading.disputes && (
              <Tabs initialValue="1">
                <Tabs.Item label="pending" value="1">
                  <FakeReportingList
                    contractDisputes={fakeNews.filterObject(
                      contractDisputes,
                      (dispute: Dispute) =>
                        dispute.expirationTimestamp - currentTimestamp > 0 &&
                        dispute.description !=
                          'https://www.nts.live/shows/moxie'
                    )}
                    value={value}
                    handler={handler}
                    divisibility={divisibility}
                    currentTimestamp={currentTimestamp}
                    dsptTokenSymbol={dsptTokenSymbol}
                    buttonClickedInVoteSection={buttonClickedInVoteSection}
                    buttonClickedInWithdrawRewardsSection={
                      buttonClickedInWithdrawRewardsSection
                    }
                    loading={loading}
                  />
                </Tabs.Item>
                <Tabs.Item label="fake" value="2">
                  <FakeReportingList
                    contractDisputes={fakeNews.filterObject(
                      contractDisputes,
                      (dispute: Dispute) =>
                        dispute.expirationTimestamp - currentTimestamp <= 0 &&
                        countVotesSumForLabel(dispute, 'fake') >
                          countVotesSumForLabel(dispute, 'legit')
                    )}
                    value={value}
                    handler={handler}
                    divisibility={divisibility}
                    currentTimestamp={currentTimestamp}
                    dsptTokenSymbol={dsptTokenSymbol}
                    buttonClickedInVoteSection={buttonClickedInVoteSection}
                    buttonClickedInWithdrawRewardsSection={
                      buttonClickedInWithdrawRewardsSection
                    }
                    loading={loading}
                  />
                </Tabs.Item>
                <Tabs.Item label="legit" value="3">
                  <FakeReportingList
                    contractDisputes={fakeNews.filterObject(
                      contractDisputes,
                      (dispute: Dispute) =>
                        dispute.expirationTimestamp - currentTimestamp <= 0 &&
                        countVotesSumForLabel(dispute, 'fake') <=
                          countVotesSumForLabel(dispute, 'legit')
                    )}
                    value={value}
                    handler={handler}
                    divisibility={divisibility}
                    currentTimestamp={currentTimestamp}
                    dsptTokenSymbol={dsptTokenSymbol}
                    buttonClickedInVoteSection={buttonClickedInVoteSection}
                    buttonClickedInWithdrawRewardsSection={
                      buttonClickedInWithdrawRewardsSection
                    }
                    loading={loading}
                  />
                </Tabs.Item>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
