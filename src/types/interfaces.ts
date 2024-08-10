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
  transfers: Transfer[]
}

export type FinalEntries = Record<string, string>
