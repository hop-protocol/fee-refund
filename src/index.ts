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

export class FeeRefund {
  dbDir: string
  rpcUrls: RpcUrls
  merkleRewardsContractAddress: string
  startTimestamp: number
  refundPercentage: number
  refundChain: string
  refundTokenSymbol: string

  constructor (
    _dbDir: string,
    _rpcUrls: RpcUrls,
    _merkleRewardsContractAddress: string,
    _startTimestamp: number,
    _refundPercentage: number,
    _refundChain: string
  ) {
    const uniqueId: string = _refundChain + _startTimestamp.toString()
    this.dbDir = _dbDir + '_' + uniqueId
    this.rpcUrls = _rpcUrls
    this.merkleRewardsContractAddress = _merkleRewardsContractAddress
    this.startTimestamp = _startTimestamp
    this.refundPercentage = _refundPercentage
    this.refundChain = _refundChain
    this.refundTokenSymbol = tokenSymbols[this.refundChain]
  }

  public async seed (): Promise<void> {
    const db = new Level(this.dbDir)

    await fetchHopTransfers(db, this.refundChain, this.startTimestamp)
    await fetchOnChainData(db, this.rpcUrls)
    await fetchExistingClaims(db, this.refundChain, this.merkleRewardsContractAddress)
  }

  public async calculateFees (): Promise<FinalEntries> {
    const db = new Level(this.dbDir)

    await fetchTokenPrices(db)
    return calculateFinalAmounts(db, this.refundPercentage, this.refundTokenSymbol)
  }
}
