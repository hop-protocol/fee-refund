export interface Transfer {
  hash: string
  timestamp: number
  amount: string
  token: string
  bonderFee: string
  chain: string
  gasUsed?: string
  gasPrice?: string
  isAggregator?: boolean
  claimedAmount?: string
  deadline?: number
  amountOutMin?: string
  gasCost?: string
}

export interface DbEntry {
  address: string
  amountClaimed: string
  transfers: Transfer[]
}

export interface RpcUrls {
  mainnet: string
  polygon: string
  gnosis: string
  arbitrum: string
  optimism: string
}

export type FinalEntries = Record<string, string>
