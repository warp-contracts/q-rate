import axios from 'axios';
import { Contract } from 'warp-contracts';
import { den, fakeNewsContractId } from '../utils/constants';

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
  addresses: string[];
}

export interface Dispute {
  id: string;
  title: string;
  description: string;
  options: string[];
  votes: VoteOption[];
  expirationTimestamp: number;
  withdrawableAmounts: any;
  calculated: boolean;
  winningOption: string;
}

export interface VoteOption {
  label: string;
  votes: Map<string, number>;
}

// aproximately one day
const EXPIRATION_BLOCK = 720;

async function reportPageAsFake(
  url: string,
  contract: Contract,
  dsptExpirationTimestamp: string,
  dsptTokensAmount?: number
): Promise<void> {
  await contract.writeInteraction({
    function: 'createDispute',
    createDispute: {
      id: url,
      title: url,
      description: url,
      options: ['fake', 'legit'],
      expirationTimestamp: dsptExpirationTimestamp,
      ...(dsptTokensAmount
        ? {
            initialStakeAmount: {
              amount: dsptTokensAmount.toString(),
              optionIndex: 0
            }
          }
        : '')
    }
  });
}

async function vote(
  url: string,
  contract: Contract,
  dsptTokensAmount: number,
  selectedOptionIndex: number
): Promise<void> {
  await contract.writeInteraction({
    function: 'vote',
    vote: {
      id: url,
      selectedOptionIndex: selectedOptionIndex,
      stakeAmount: dsptTokensAmount.toString()
    }
  });
}

async function withdrawRewards(
  contract: Contract,
  dsptId: string
): Promise<void> {
  await contract.writeInteraction({
    function: 'withdrawReward',
    withdrawReward: {
      id: dsptId
    }
  });
}

export async function getState(contract: Contract, address: string) {
  // const { data }: any = await axios.get(
  //   `${den}/state?id=${fakeNewsContractId}&snowball=false`
  // );

  const { cachedValue } = await contract.readState();
  const data = cachedValue;
  const addresses = data.state.addresses;
  const divisibility = data.state.divisibility;
  const disputes = data.state.disputes;
  let balance = data.state.balances[address];
  if (!balance) {
    balance = 0;
  } else {
    balance = getRoundedTokens(balance, divisibility);
  }
  return { divisibility, disputes, balance, addresses };
}

export function getRoundedTokens(amount: number, divisibility: number): number {
  return Math.round(amount / divisibility);
}

export async function mint(contract: Contract) {
  await contract.writeInteraction({
    function: 'mint',
    mint: { qty: '1000000' }
  });
}

export async function getBalance(
  contract: Contract,
  address: string,
  divisibility: number
) {
  const { result } = await contract.viewState({
    function: 'balance',
    balance: {
      target: address
    }
  });
  return getRoundedTokens(result.balance.balance, divisibility);
}

export function postMultipliedTokens(
  amount: number,
  divisibility: number
): number {
  return amount * divisibility;
}

export function getVotesSum(votes: object, divisibility: number): number {
  let votesList: any[] = [];

  for (const key in votes) {
    votesList.push(parseInt(votes[key].quadraticAmount));
  }
  const sum = [...votesList].reduce((a, b) => a + b, 0);
  return sum;
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
