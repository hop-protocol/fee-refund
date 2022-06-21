export interface Transfer {
  hash: string
  timestamp: string
  amount: string
  token: string
  bonderFee: string
  chain: string
  gasUsed?: string
  gasPrice?: string
  isAggregator?: boolean
  claimedAmount?: string
}

export interface DbEntry {
  address: string
  amountClaimed: string
  transfers: Transfer[]
}
