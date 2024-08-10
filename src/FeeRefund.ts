import { Level } from './utils/Level.js'
import { FinalEntries, Transfer } from './types/interfaces.js'
import { config as globalConfig } from './config/index.js'
import { getTokenList } from './utils/getTokenList.js'
import { getChainList } from './utils/getChainList.js'
import { getChainIdMap } from './utils/getChainIdMap.js'
import { setRpcUrls } from './utils/getProvider.js'
import { Fetcher } from './Fetcher.js'

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
  fetcher: Fetcher

  constructor (config: Config) {
    const { network = 'mainnet', dbDir, rpcUrls, merkleRewardsContractAddress, startTimestamp, endTimestamp, refundPercentage, refundChain, refundTokenSymbol, maxRefundAmount = 100, useApiForOnChainData } = config
    const uniqueId: string = refundChain + startTimestamp?.toString()
    this.network = network
    this.dbDir = dbDir + '/' + uniqueId
    this.rpcUrls = rpcUrls
    setRpcUrls(rpcUrls)
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

    this.chains = getChainList(network, this.endTimestamp)
    this.tokens = getTokenList(network, this.endTimestamp)
    this.chainIds = getChainIdMap(network)

    this.fetcher = new Fetcher({
      network: this.network,
      db: this.db,
      rpcUrls: this.rpcUrls,
      refundTokenSymbol: this.refundTokenSymbol,
      refundPercentage: this.refundPercentage,
      maxRefundAmount: this.maxRefundAmount
    })
  }

  private initializeDb (): void {
    if (!this.db) {
      this.db = new Level(this.dbDir)
    }
  }

  public async seed (options: SeedOptions = {}): Promise<void> {
    this.initializeDb()

    const hopTransfersStartTime = options?.hopTransfersStartTime ?? this.startTimestamp

    const id = Date.now()
    console.log('fetching Hop transfers')
    console.time('fetchHopTransfers ' + id)
    await this.fetcher.fetchHopTransfers(this.refundChain, hopTransfersStartTime, this.chains, this.chainIds, this.tokens, this.endTimestamp)
    console.timeEnd('fetchHopTransfers ' + id)
    console.log('fetching on-chain data')
    console.time('populateTransfersWithOnChainData ' + id)
    await this.fetcher.populateTransfersWithOnChainData(this.endTimestamp)
    console.timeEnd('populateTransfersWithOnChainData ' + id)
  }

  public async calculateFees (endTimestamp: number): Promise<FinalEntries> {
    this.initializeDb()

    console.log('fetching token prices')
    await this.fetcher.fetchPricesForAllTokens(this.tokens, this.refundTokenSymbol)
    console.log('done fetching token prices')
    console.log('calculating final amounts')
    const result = await this.fetcher.calculateFinalAmounts(this.startTimestamp, endTimestamp)
    console.log('done calculating final amounts')
    return result
  }

  public async getRefundAmount (transfer: Transfer): Promise<any> {
    this.initializeDb()

    return this.fetcher.getRefundAmount(transfer)
  }

  public async getTokenPrice (tokenSymbol: string, timestamp: number): Promise<any> {
    this.initializeDb()

    return this.fetcher.getTokenPrice(tokenSymbol, timestamp)
  }

  public async getAccountHistory (account: string): Promise<any> {
    this.initializeDb()

    return this.fetcher.getAccountHistory(account)
  }

  async getTxInfo (chain: string, hash: string): Promise<any> {
    this.initializeDb()

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

  private async migrate (): Promise<void> {
    this.initializeDb()

    if (this.migrated) {
      return
    }

    const iterator = this.db.iterate({ all: 'address::', keys: true })
    for await (const { value } of iterator) {
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
