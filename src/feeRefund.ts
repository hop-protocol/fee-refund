import Level from 'level-ts'
import { FinalEntries, RpcUrls, Transfer } from './types/interfaces'
import fetchExistingClaims from './seed/fetchExistingClaims'
import { fetchHopTransfers } from './seed/fetchHopTransfers'
import { fetchOnChainData } from './seed/fetchOnChainData'
import { calculateFinalAmounts, getRefundAmount } from './feeCalculations/calculateFinalAmounts'
import { fetchAllTokenPrices } from './feeCalculations/fetchTokenPrices'

export type Config = {
  network?: string,
  dbDir: string,
  rpcUrls: RpcUrls,
  merkleRewardsContractAddress: string,
  startTimestamp: number,
  endTimestamp?: number,
  refundPercentage: number,
  refundChain: string
  refundTokenSymbol: string
  maxRefundAmount: number
}

export class FeeRefund {
  dbDir: string
  rpcUrls: RpcUrls
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

  constructor (config: Config) {
    const { network = 'mainnet', dbDir, rpcUrls, merkleRewardsContractAddress, startTimestamp, endTimestamp, refundPercentage, refundChain, refundTokenSymbol, maxRefundAmount = 100 } = config
    const uniqueId: string = refundChain + startTimestamp.toString()
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

    if (!['mainnet', 'goerli'].includes(network)) {
      throw new Error(`invalid network "${network}"`)
    }

    this.chains = [
      'mainnet',
      'arbitrum',
      'optimism',
      'polygon',
      'gnosis'
    ]

    if (network === 'goerli') {
      this.chains = [
        'mainnet',
        'optimism',
        'polygon'
      ]
    }

    this.tokens = [
      'ETH',
      'MATIC',
      'USDC',
      'USDT',
      'DAI',
      'HOP',
      'SNX'
    ]

    if (network === 'goerli') {
      this.tokens = [
        'ETH',
        'USDC'
      ]
    }

    this.chainIds = {
      mainnet: 1,
      arbitrum: 42161,
      optimism: 10,
      polygon: 137,
      gnosis: 100
    }

    if (network === 'goerli') {
      this.chainIds = {
        mainnet: 5,
        optimism: 420,
        polygon: 80001
      }
    }
  }

  public async seed (): Promise<void> {
    if (!this.db) {
      this.db = new Level(this.dbDir)
    }

    const id = Date.now()
    console.log('fetching Hop transfers')
    console.time('fetchHopTransfers ' + id)
    await fetchHopTransfers(this.network, this.db, this.refundChain, this.startTimestamp, this.chains, this.chainIds, this.tokens, this.endTimestamp)
    console.timeEnd('fetchHopTransfers ' + id)
    console.log('fetching on-chain data')
    console.time('fetchOnChainData ' + id)
    await fetchOnChainData(this.db, this.rpcUrls, this.endTimestamp)
    console.timeEnd('fetchOnChainData ' + id)
    // console.log('fetching existing claims')
    // await fetchExistingClaims(this.db, this.refundChain, this.merkleRewardsContractAddress, this.network)
  }

  public async calculateFees (endTimestamp: number): Promise<FinalEntries> {
    if (!this.db) {
      this.db = new Level(this.dbDir)
    }

    console.log('fetching token prices')
    await fetchAllTokenPrices(this.db)
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
    await fetchAllTokenPrices(this.db)
    return getRefundAmount(this.db, transfer, this.refundTokenSymbol, this.refundPercentage, this.maxRefundAmount)
  }
}
