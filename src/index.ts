import Level from 'level-ts'
import { providers } from 'ethers'
import { FinalEntries, RpcUrls } from './interfaces'
import fetchExistingClaims from './seed/fetchExistingClaims'
import fetchHopTransfers from './seed/fetchHopTransfers'
import fetchOnChainData from './seed/fetchOnChainData'
import calculateFinalAmounts from './feeCalculations/calculateFinalAmounts'
import fetchTokenPrices from './feeCalculations/fetchTokenPrices'
import { tokenSymbols } from './constants'
const fs = require('fs')
const fse = require('fs-extra')

export type Config = {
  dbDir: string,
  rpcUrls: RpcUrls,
  merkleRewardsContractAddress: string,
  startTimestamp: number,
  refundPercentage: number,
  refundChain: string
}

export class FeeRefund {
  dbDir: string
  rpcUrls: RpcUrls
  merkleRewardsContractAddress: string
  startTimestamp: number
  refundPercentage: number
  refundChain: string
  refundTokenSymbol: string

  constructor (config: Config) {
    const { dbDir, rpcUrls, merkleRewardsContractAddress, startTimestamp, refundPercentage, refundChain } = config
    const uniqueId: string = refundChain + startTimestamp.toString()
    this.dbDir = dbDir + '/' + uniqueId
    this.rpcUrls = rpcUrls
    this.merkleRewardsContractAddress = merkleRewardsContractAddress
    this.startTimestamp = startTimestamp
    this.refundPercentage = refundPercentage
    this.refundChain = refundChain
    this.refundTokenSymbol = tokenSymbols[this.refundChain]
  }

  public async seed (): Promise<void> {
    const db = new Level(this.dbDir)

    console.log('fetching Hop transfers')
    await fetchHopTransfers(db, this.refundChain, this.startTimestamp)
    console.log('fetching on-chain data')
    await fetchOnChainData(db, this.rpcUrls)
    console.log('fetching existing claims')
    await fetchExistingClaims(db, this.refundChain, this.merkleRewardsContractAddress)
  }

  public async calculateFees (endTimestamp: number): Promise<FinalEntries> {
    const db = new Level(this.dbDir)

    console.log('fetching token prices')
    await fetchTokenPrices(db)
    console.log('done fetching token prices')
    console.log('calculating final amounts')
    const result = await calculateFinalAmounts(db, this.refundPercentage, this.refundTokenSymbol, endTimestamp)
    console.log('done calculating final amounts')
    return result
  }
}
