import axios from "axios";
import { Contract } from "redstone-smartweave";
import { den, fakeNewsContractId } from "../utils/constants";

export interface ContractDispute {
  [id: string]: Dispute;
}
export interface ContractState {
  balances: Map<string, number>;
  divisibility: number;
  canEvolve: boolean;
  evolve: string | null;
  name: string;
  owner: string;
  ticker: string;
  disputes: Map<string, Dispute>;
}

export interface Dispute {
  id: string;
  title: string;
  description: string;
  options: string[];
  votes: VoteOption[];
  expirationBlock: number;
  withdrawableAmounts: any;
  calculated: boolean;
  winningOption: string;
}

export interface VoteOption {
  label: string;
  votes: Map<string, number>;
}

async function reportPageAsFake(
  url: string,
  contract: Contract,
  expBlock: number,
  dsptTokensAmount?: number
): Promise<void> {
  await contract.bundleInteraction({
    function: "createDispute",
    createDispute: {
      id: url,
      title: url,
      description: url,
      options: ["fake", "legit"],
      expirationBlocks: expBlock,
      ...(dsptTokensAmount
        ? {
            initialStakeAmount: {
              amount: dsptTokensAmount,
              optionIndex: 0
            }
          }
        : "")
    }
  });
}

async function vote(
  url: string,
  contract: Contract,
  dsptTokensAmount: number,
  selectedOptionIndex: number
): Promise<void> {
  await contract.bundleInteraction({
    function: "vote",
    vote: {
      id: url,
      selectedOptionIndex: selectedOptionIndex,
      stakeAmount: dsptTokensAmount
    }
  });
}

async function withdrawRewards(
  contract: Contract,
  dsptId: string
): Promise<void> {
  await contract.bundleInteraction({
    function: "withdrawReward",
    withdrawReward: {
      id: dsptId
    }
  });
}

export async function getState(address: string) {
  const { data }: any = await axios.get(
    `${den}/state?id=${fakeNewsContractId}`
  );
  const divisibility = data.state.divisibility;
  const disputes = data.state.disputes;
  let balance = data.state.balances[address];
  if (!balance) {
    balance = 0;
  } else {
    balance = getRoundedTokens(balance, divisibility);
  }
  return { divisibility, disputes, balance };
}

export function getRoundedTokens(amount: number, divisibility: number): number {
  return Math.round(amount / divisibility);
}

export function postMultipliedTokens(
  amount: number,
  divisibility: number
): number {
  return amount * divisibility;
}

export function getVotesSum(votes: object, divisibility: number): number {
  const sum = [...Object.values(votes)].reduce((a, b) => a + b, 0);
  return getRoundedTokens(sum, divisibility);
}

export const filterObject = (obj: any, predicate: any) =>
  Object.keys(obj)
    .filter((key) => predicate(obj[key]))
    .reduce((res: any, key) => ((res[key] = obj[key]), res), {});

export default {
  reportPageAsFake,
  vote,
  withdrawRewards,
  getRoundedTokens,
  postMultipliedTokens,
  getState,
  getVotesSum,
  filterObject
};
