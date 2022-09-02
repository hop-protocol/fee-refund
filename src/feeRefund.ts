import Level from 'level-ts'
import { FinalEntries, RpcUrls, Transfer } from './types/interfaces'
import fetchExistingClaims from './seed/fetchExistingClaims'
import { fetchHopTransfers } from './seed/fetchHopTransfers'
import fetchOnChainData from './seed/fetchOnChainData'
import { calculateFinalAmounts, getRefundAmount } from './feeCalculations/calculateFinalAmounts'
import { fetchAllTokenPrices } from './feeCalculations/fetchTokenPrices'
import { tokenSymbols } from './constants'

export type Config = {
  dbDir: string,
  rpcUrls: RpcUrls,
  merkleRewardsContractAddress: string,
  startTimestamp: number,
  refundPercentage: number,
  refundChain: string
  refundTokenSymbol: string
}

export class FeeRefund {
  dbDir: string
  rpcUrls: RpcUrls
  merkleRewardsContractAddress: string
  startTimestamp: number
  refundPercentage: number
  refundChain: string
  refundTokenSymbol: string
  db: any

  constructor (config: Config) {
    const { dbDir, rpcUrls, merkleRewardsContractAddress, startTimestamp, refundPercentage, refundChain, refundTokenSymbol } = config
    const uniqueId: string = refundChain + startTimestamp.toString()
    this.dbDir = dbDir + '/' + uniqueId
    this.rpcUrls = rpcUrls
    this.merkleRewardsContractAddress = merkleRewardsContractAddress
    this.startTimestamp = startTimestamp
    this.refundPercentage = refundPercentage
    this.refundChain = refundChain
    this.refundTokenSymbol = refundTokenSymbol
  }

  public async seed (): Promise<void> {
    if (!this.db) {
      this.db = new Level(this.dbDir)
    }

    console.log('fetching Hop transfers')
    await fetchHopTransfers(this.db, this.refundChain, this.startTimestamp)
    console.log('fetching on-chain data')
    await fetchOnChainData(this.db, this.rpcUrls)
    console.log('fetching existing claims')
    await fetchExistingClaims(this.db, this.refundChain, this.merkleRewardsContractAddress)
  }

  public async calculateFees (endTimestamp: number): Promise<FinalEntries> {
    if (!this.db) {
      this.db = new Level(this.dbDir)
    }

    console.log('fetching token prices')
    await fetchAllTokenPrices(this.db)
    console.log('done fetching token prices')
    console.log('calculating final amounts')
    const result = await calculateFinalAmounts(this.db, this.refundPercentage, this.refundTokenSymbol, endTimestamp)
    console.log('done calculating final amounts')
    return result
  }

  public async getRefundAmount (transfer: Transfer): Promise<any> {
    if (!this.db) {
      this.db = new Level(this.dbDir)
    }
    await fetchAllTokenPrices(this.db)
    return getRefundAmount(this.db, transfer, this.refundTokenSymbol, this.refundPercentage)
  }
}
