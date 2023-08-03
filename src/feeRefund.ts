import Level from 'level-ts'
import { FinalEntries, Transfer } from './types/interfaces'
import { fetchHopTransfers } from './seed/fetchHopTransfers'
import { fetchOnChainData } from './seed/fetchOnChainData'
import { calculateFinalAmounts, getRefundAmount } from './feeCalculations/calculateFinalAmounts'
import { fetchAllTokenPrices, getTokenPrice } from './feeCalculations/fetchTokenPrices'
import { getAccountHistory } from './feeCalculations/getAccountHistory'
import { config as globalConfig } from './config'
import { getTokenList } from './utils/getTokenList'
import { getChainList } from './utils/getChainList'
import { getChainIdMap } from './utils/getChainIdMap'

export type Config = {
  network?: string,
  dbDir: string,
  rpcUrls: any,
  merkleRewardsContractAddress: string,
  startTimestamp: number,
  endTimestamp?: number,
  refundPercentage: number,
  refundChain: string
  refundTokenSymbol: string
  maxRefundAmount: number
  useApiForOnChainData?: boolean
}

export type SeedOptions = {
  hopTransfersStartTime?: number
}

export class FeeRefund {
  dbDir: string
  rpcUrls: any
  merkleRewardsContractAddress: string
  startTimestamp: number
  endTimestamp: number | undefined
  refundPercentage: number
  refundChain: string
  refundTokenSymbol: string
  db: any
  network: string
  maxRefundAmount: number
  chains: string[]
  tokens: string[]
  chainIds: Record<string, number>
  migrated: boolean = false
  useApiForOnChainData: boolean = false

  constructor (config: Config) {
    const { network = 'mainnet', dbDir, rpcUrls, merkleRewardsContractAddress, startTimestamp, endTimestamp, refundPercentage, refundChain, refundTokenSymbol, maxRefundAmount = 100, useApiForOnChainData } = config
    if (!startTimestamp) {
      // throw new Error('startTimestamp is required')
    }
    const uniqueId: string = refundChain + startTimestamp?.toString()
    this.network = network
    this.dbDir = dbDir + '/' + uniqueId
    this.rpcUrls = rpcUrls
    this.merkleRewardsContractAddress = merkleRewardsContractAddress
    this.startTimestamp = startTimestamp
    this.endTimestamp = endTimestamp
    this.refundPercentage = refundPercentage
    this.refundChain = refundChain
    this.refundTokenSymbol = refundTokenSymbol
    this.maxRefundAmount = maxRefundAmount
    this.useApiForOnChainData = useApiForOnChainData
    if (this.useApiForOnChainData) {
      globalConfig.useApiForOnChainData = this.useApiForOnChainData
      console.log('useApiForOnChainData:', this.useApiForOnChainData)
    }

    if (!['mainnet', 'goerli'].includes(network)) {
      throw new Error(`invalid network "${network}"`)
    }

    this.chains = getChainList(network)
    this.tokens = getTokenList(network)
    this.chainIds = getChainIdMap(network)
  }

  public async seed (options: SeedOptions = {}): Promise<void> {
    if (!this.db) {
      this.db = new Level(this.dbDir)
    }

    const hopTransfersStartTime = options?.hopTransfersStartTime ?? this.startTimestamp

    const id = Date.now()
    console.log('fetching Hop transfers')
    console.time('fetchHopTransfers ' + id)
    await fetchHopTransfers(this.network, this.db, this.refundChain, hopTransfersStartTime, this.chains, this.chainIds, this.tokens, this.endTimestamp)
    console.timeEnd('fetchHopTransfers ' + id)
    console.log('fetching on-chain data')
    console.time('fetchOnChainData ' + id)
    await fetchOnChainData(this.db, this.rpcUrls, this.network, this.endTimestamp)
    console.timeEnd('fetchOnChainData ' + id)
  }

  public async calculateFees (endTimestamp: number): Promise<FinalEntries> {
    if (!this.db) {
      this.db = new Level(this.dbDir)
    }

    console.log('fetching token prices')
    await fetchAllTokenPrices(this.db, this.network, this.refundTokenSymbol)
    console.log('done fetching token prices')
    console.log('calculating final amounts')
    const result = await calculateFinalAmounts(this.db, this.refundPercentage, this.refundTokenSymbol, this.startTimestamp, endTimestamp, this.maxRefundAmount)
    console.log('done calculating final amounts')
    return result
  }

  public async getRefundAmount (transfer: Transfer): Promise<any> {
    if (!this.db) {
      this.db = new Level(this.dbDir)
    }

    return getRefundAmount(this.db, transfer, this.refundTokenSymbol, this.refundPercentage, this.maxRefundAmount)
  }

  public async getTokenPrice (tokenSymbol: string, timestamp: number): Promise<any> {
    if (!this.db) {
      this.db = new Level(this.dbDir)
    }

    return getTokenPrice(this.db, tokenSymbol, timestamp)
  }

  public async getAccountHistory (account: string): Promise<any> {
    if (!this.db) {
      this.db = new Level(this.dbDir)
    }

    return getAccountHistory(this.db, account, this.refundTokenSymbol, this.refundPercentage, this.maxRefundAmount)
  }

  public getDb () {
    if (!this.db) {
      this.db = new Level(this.dbDir)
    }

    return this.db
  }

  async getTxInfo (chain: string, hash: string) {
    if (!this.db) {
      this.db = new Level(this.dbDir)
    }

    const key = `tx::${chain}:${hash}`
    try {
      const result = await this.db.get(key)
      return result
    } catch (err) {
      if (!/Key not found/gi.test(err.message)) {
        throw err
      }
    }
    return null
  }

  async migrate () {
    if (!this.db) {
      this.db = new Level(this.dbDir)
    }

    if (this.migrated) {
      return
    }

    const iterator = this.db.iterate({ all: 'address::', keys: true })
    for await (const { key, value } of iterator) {
      if (value) {
        if (Array.isArray(value.transfers)) {
          for (const transfer of value.transfers) {
            const { chain, hash } = transfer
            const txKey = `tx::${chain}:${hash}`
            await this.db.put(txKey, transfer)
          }
        }
      }
    }

    this.migrated = true
    console.log('done running migration')
  }
}
