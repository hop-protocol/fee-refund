import Level from 'level-ts'
import { FinalEntries, RpcUrls } from './interfaces'
import fetchExistingClaims from './seed/fetchExistingClaims'
import fetchHopTransfers from './seed/fetchHopTransfers'
import fetchOnChainData from './seed/fetchOnChainData'
import calculateFinalAmounts from './feeCalculations/calculateFinalAmounts'
import fetchTokenPrices from './feeCalculations/fetchTokenPrices'
import {
  chainIds,
  tokenSymbols
} from './constants'
const fs = require('fs')
const fse = require('fs-extra')

export class FeeRefund {
  dbDir: string
  rpcUrls: RpcUrls
  startTimestamp: number
  refundPercentage: number
  refundChain: string
  refundTokenSymbol: string
  refundChainId: number

  constructor (
    _dbDir: string,
    _rpcUrls: RpcUrls,
    _startTimestamp: number,
    _refundPercentage: number,
    _refundChain: string
  ) {
    this.dbDir = _dbDir
    this.rpcUrls = _rpcUrls
    this.startTimestamp = _startTimestamp
    this.refundPercentage = _refundPercentage
    this.refundChain = _refundChain
    this.refundTokenSymbol = tokenSymbols[this.refundChain]
    this.refundChainId = chainIds[this.refundChain]
  }

  public async seed (): Promise<void> {
    await fse.remove(this.dbDir)
    fs.mkdirSync(this.dbDir)
    const db = new Level(this.dbDir)

    await fetchHopTransfers(db, this.refundChainId, this.startTimestamp)
    await fetchOnChainData(db, this.rpcUrls)
    await fetchExistingClaims(db, this.refundChain, this.startTimestamp)
  }

  public async calculateFees (): Promise<FinalEntries> {
    const db = new Level(this.dbDir)

    await fetchTokenPrices(db)
    return calculateFinalAmounts(db, this.refundPercentage, this.refundTokenSymbol)
  }
}
