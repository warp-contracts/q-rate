import React, { useEffect, useState } from "react";
import { Button, Input } from "@geist-ui/react";
import {
  ContractDispute,
  Dispute,
  getVotesSum,
  VoteOption
} from "../background/fake_news";

interface Props {
  contractDisputes: ContractDispute;
  value: any;
  handler: any;
  divisibility: number;
  dsptTokenSymbol: string;
  currentBlockHeight: number;
  buttonClickedInVoteSection: any;
  buttonClickedInWithdrawRewardsSection: any;
  loading: any;
}

export default function FakeReportingList({
  contractDisputes,
  value,
  handler,
  divisibility,
  dsptTokenSymbol,
  currentBlockHeight,
  buttonClickedInVoteSection,
  buttonClickedInWithdrawRewardsSection,
  loading
}: Props) {
  const [contractDisputeSorted, setContractDisputeSorted] = useState<any[]>([]);
  useEffect(() => {
    let sortable = [];
    for (let dispute in contractDisputes) {
      sortable.push([dispute, contractDisputes[dispute]]);
    }

    sortable.sort(function (a, b) {
      return a[1].expirationBlock - currentBlockHeight <= 0
        ? a[0].localeCompare(b[0])
        : a[1].expirationBlock - b[1].expirationBlock;
    });

    setContractDisputeSorted(sortable);
  }, [contractDisputes]);
  return (
    <>
      {contractDisputeSorted &&
        contractDisputeSorted.map((dispute: any, disputeIdx: number) => (
          <div
            style={{
              padding: "10px",
              borderRadius: "5px",
              marginBottom: "10px",
              color: "gray",
              fontSize: "14px",
              border: "1px solid #a99eec",
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
              maxWidth: "100%"
            }}
          >
            <a href={dispute[0]} target="_blank" style={{ fontWeight: "bold" }}>
              {dispute[0]}
            </a>
            {dispute[1].votes.map((v: VoteOption, idx: number) => (
              <div>
                <hr />

                <div style={{ display: "flex" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                      marginRight: "0.5rem",
                      width: "30%"
                    }}
                  >
                    <span style={{ textTransform: "uppercase" }}>
                      {v.label}
                    </span>
                    :{" "}
                    <strong style={{ marginLeft: "0.25rem" }}>
                      {getVotesSum(v.votes, divisibility)}
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
                          disabled={
                            dispute[1].expirationBlock - currentBlockHeight <= 0
                          }
                        />
                      </div>
                    </>
                  }
                  <Button
                    style={{
                      minWidth: "auto",
                      width: "90px",
                      lineHeight: "inherit",
                      height: "calc(2.5 * 14px)",
                      marginBottom: "10px",
                      marginLeft: "0.5rem"
                    }}
                    type="success"
                    disabled={
                      dispute[1].expirationBlock - currentBlockHeight <= 0
                    }
                    loading={
                      loading.vote[2 * disputeIdx + idx]
                        ? loading.vote[2 * disputeIdx + idx]
                        : false
                    }
                    onClick={() =>
                      buttonClickedInVoteSection(
                        disputeIdx,
                        dispute[0],
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
                  {dispute[1].expirationBlock - currentBlockHeight < 0
                    ? 0
                    : dispute[1].expirationBlock - currentBlockHeight}
                </strong>
              </div>

              {
                <Button
                  style={{ minWidth: "auto", marginBottom: "10px" }}
                  type="success"
                  disabled={dispute[1].expirationBlock - currentBlockHeight > 0}
                  onClick={() =>
                    buttonClickedInWithdrawRewardsSection(
                      dispute[0],
                      disputeIdx
                    )
                  }
                  loading={
                    loading.withdraw[disputeIdx]
                      ? loading.withdraw[disputeIdx]
                      : false
                  }
                >
                  Withdraw
                </Button>
              }
            </div>
          </div>
        ))}
    </>
  );
}
