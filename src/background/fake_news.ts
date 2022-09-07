import { Contract } from "redstone-smartweave";

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
  withdrawableAmounts: Map<string, number>;
  calculated: boolean;
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

async function getBalance(
  address: string,
  divisibility: number,
  contract: Contract
): Promise<number> {
  const { state }: any = await contract.readState();
  const balance = state.balances[address];
  if (!balance) {
    return 0;
  }
  return getRoundedTokens(balance, divisibility);
}

export async function getDisputes(contract: Contract) {
  const { state }: any = await contract.readState();
  const divisibility = state.divisibility;
  const disputes = new Map(Object.entries(state.disputes));
  return { divisibility, disputes };
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

export default {
  reportPageAsFake,
  getBalance,
  vote,
  withdrawRewards,
  getRoundedTokens,
  postMultipliedTokens,
  getDisputes
};
