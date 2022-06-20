export interface DbEntry {
  address: string
  hash: string
  timestamp: string
  amount: string
  token: string
  bonderFee: string
  chain: string
  gasUsed?: string
  gasPrice?: string
  isAggregator?: boolean
}
