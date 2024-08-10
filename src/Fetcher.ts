import { promiseQueue } from './utils/promiseQueue.js'
import { retry } from './utils/retry.js'
import { wait } from './utils/wait.js'
import { promiseQueueConcurrency, config, aggregatorAddresses, etherscanApiKeys, coingeckoApiKey } from './config/index.js'
import { isHopContract } from './utils/isHopContract.js'
import { getSubgraphUrl } from './utils/getSubgraphUrl.js'
import { queryFetch } from './utils/queryFetch.js'
import { getChainIdMap } from './utils/getChainIdMap.js'
import { Hop as HopV2 } from '@hop-protocol/v2-sdk'
import { getBlockNumberFromDate } from '@hop-protocol/sdk'
import { getProvider } from './utils/getProvider.js'
import { BigNumber, utils, providers } from 'ethers'
import { DbEntry, FinalEntries, Transfer } from './types/interfaces.js'
import { getTokenDecimals } from './utils/getTokenDecimals.js'
import { getNativeTokenSymbol } from './utils/getNativeTokenSymbol.js'
import { toSeconds } from './utils/toSeconds.js'
import { DateTime } from 'luxon'
import { getCoingeckoId } from './utils/getCoingeckoId.js'

const { formatUnits, parseUnits } = utils
const cache :Record<string, any> = {}
const cachedAt :Record<string, number> = {}

const PAGE_SIZE = 1000

type Config = {
  db: any
  rpcUrls: any
  network: any
  refundTokenSymbol: string
  refundPercentage: number
  maxRefundAmount: number
}

export class Fetcher {
  db: any
  rpcUrls: any
  network: any
  refundTokenSymbol: string
  refundPercentage: number
  maxRefundAmount: number

  constructor (config: Config) {
    this.db = config.db
    this.rpcUrls = config.rpcUrls
    this.network = config.network
    this.refundTokenSymbol = config.refundTokenSymbol
    this.refundPercentage = config.refundPercentage
    this.maxRefundAmount = config.maxRefundAmount
  }

  public async fetchHopTransfers (refundChain: string, startTimestamp: number, chains: string[], chainIds: Record<string, number>, tokens: string[], endTimestamp?: number) {
    const refundChainId = chainIds[refundChain]
    const fetchPromises = tokens.flatMap(token =>
      chains.map(chain =>
        this.fetchHopTransfersForChain(token, chain, refundChainId, startTimestamp, endTimestamp)
      )
    )
    await Promise.all(fetchPromises)
  }

  private async fetchHopTransfersForChain (
    token: string,
    chain: string,
    refundChainId: number,
    startTimestamp: number,
    endTimestamp?: number
  ): Promise<void> {
    let lastId = '0'
    let lastTimestamp = 0

    let transferChain = chain
    if (transferChain === 'ethereum') {
      transferChain = 'mainnet' // backwards compatibility
    }

    while (true) {
      let data: any[] = []
      let cctpData: any[] = []

      const nonCctpData: any[] = await this.fetchHopTransferForChainBatch(token, chain, lastId, refundChainId, startTimestamp, endTimestamp)
      if (token === 'USDC') {
        cctpData = await this.fetchHopTransferBatchCctp(token, chain, lastId, refundChainId, startTimestamp, endTimestamp)
      }

      let v2Data : any[] = []
      const v2Chains: string[] = [] // TODO
      if (v2Chains.includes(chain)) {
        v2Data = await this.fetchHopTransfersV2({
          token,
          chain,
          lastId,
          refundChainId,
          startTimestamp,
          endTimestamp
        })
      }

      data = nonCctpData.concat(cctpData).concat(v2Data).sort((a, b) => a.timestamp - b.timestamp)

      if (!data || data.length === 0) break
      lastId = data[data.length - 1].id

      for (const entry of data) {
        const address = entry.from
        const key = this.getAddressKey(address)

        const dbEntry: DbEntry = await this.getDbEntry(key)

        const isSeen = this.isTransactionSeenInDb(dbEntry.transfers, entry.transactionHash)
        if (isSeen) continue

        dbEntry.address = address
        dbEntry.transfers.push({
          hash: entry.transactionHash,
          timestamp: Number(entry.timestamp),
          amount: entry.amount,
          token: entry.token,
          bonderFee: entry.bonderFee || 0,
          deadline: Number(entry.deadline || 0),
          amountOutMin: entry.amountOutMin || 0,
          chain
        })

        if (lastTimestamp < entry.timestamp) {
          lastTimestamp = entry.timestamp
        }
        await this.db.put(key, dbEntry)
      }
    }
  }

  private async fetchHopTransferForChainBatch (
    token: string,
    chain: string,
    lastId: string,
    refundChainId: number,
    startTimestamp: number,
    endTimestamp: number = Math.floor((Date.now() / 1000))
  ) {
    let query : string

    if (chain === 'mainnet') {
      chain = 'ethereum'
    }

    if (chain === 'ethereum') {
      query = `
        query Transfers($pageSize: Int, $lastId: ID, $token: String, $startTimestamp: Int, $endTimestamp: Int) {
          transfers: transferSentToL2S(
            first: $pageSize,
            where: {
              token: $token,
              destinationChainId: ${refundChainId}
              id_gt: $lastId,
              timestamp_gte: $startTimestamp,
              timestamp_lte: $endTimestamp
            },
            orderBy: id,
            orderDirection: asc
          ) {
            id
            transactionHash
            from
            timestamp
            deadline
            amountOutMin
            amount
            token
          }
        }
      `
    } else {
      query = `
        query Transfers($pageSize: Int, $lastId: ID, $token: String, $startTimestamp: Int, $endTimestamp: Int) {
          transfers: transferSents(
            first: $pageSize,
            where: {
              token: $token,
              destinationChainId: ${refundChainId}
              id_gt: $lastId,
              timestamp_gte: $startTimestamp,
              timestamp_lte: $endTimestamp
            },
            orderBy: id,
            orderDirection: asc
          ) {
            id
            transactionHash
            from
            timestamp
            deadline
            amountOutMin
            amount
            token
            bonderFee
          }
        }
      `
    }

    const url = getSubgraphUrl(this.network, chain)
    const data = await queryFetch(
      url,
      query,
      {
        pageSize: PAGE_SIZE,
        lastId,
        token,
        startTimestamp,
        endTimestamp
      }
    )

    const result = data ? data.transfers : []
    return result
  }

  private async fetchHopTransferBatchCctp (
    token: string,
    chain: string,
    lastId: string,
    refundChainId: number,
    startTimestamp: number,
    endTimestamp: number = Math.floor((Date.now() / 1000))
  ) {
    try {
      if (chain === 'mainnet') {
        chain = 'ethereum'
      }

      if (token !== 'USDC') {
        return []
      }

      const supportedChains = ['ethereum', 'polygon', 'optimism', 'arbitrum', 'base']
      if (!supportedChains.includes(chain)) {
        return []
      }

      const query = `
        query Transfers($pageSize: Int, $lastId: ID, $token: String, $startTimestamp: Int, $endTimestamp: Int) {
          transfers: cctptransferSents(
            first: $pageSize,
            where: {
              chainId: ${refundChainId}
              id_gt: $lastId,
              block_: {
                timestamp_gte: $startTimestamp,
                timestamp_lte: $endTimestamp
              }
            },
            orderBy: id,
            orderDirection: asc
          ) {
            id
            cctpNonce
            chainId
            recipient
            amount
            bonderFee
            transaction {
              to
              hash
              from
            }
            block {
              timestamp
            }
          }
        }
      `

      const url = getSubgraphUrl(this.network, chain)
      const data = await queryFetch(
        url,
        query,
        {
          pageSize: PAGE_SIZE,
          lastId,
          token,
          startTimestamp,
          endTimestamp
        }
      )
      return (data ? data.transfers : []).map((transfer: any) => {
        return {
          ...transfer,
          transactionHash: transfer.transaction.hash,
          from: transfer.transaction.from,
          timestamp: transfer.block.timestamp,
          deadline: 0,
          amountOutMin: 0,
          token,
          amount: transfer.amount,
          bonderFee: transfer.bonderFee
        }
      })
    } catch (err: any) {
      console.error(`Failed to fetch cctp transfers for ${chain} ${token}`, err)
      return []
    }
  }

  private async fetchHopTransfersV2 ({
    token,
    chain,
    lastId,
    refundChainId,
    startTimestamp,
    endTimestamp
  }: any) {
    if (lastId !== '0') {
      return []
    }

    console.log('fetchHopTransfersV2', this.network, token, chain, lastId, refundChainId, startTimestamp, endTimestamp)

    const sdk = new HopV2({
      network: this.network
    })

    const chainId = getChainIdMap(this.network)[chain]

    const etherscanApiKey = etherscanApiKeys[chain]
    const provider = getProvider(chain)
    const fromBlock = await getBlockNumberFromDate(provider, startTimestamp, etherscanApiKey)
    const toBlock = await getBlockNumberFromDate(provider, startTimestamp, etherscanApiKey)

    const events = await sdk.railsGateway.getTransferSentEvents({
      chainId,
      fromBlock,
      toBlock,
      fetchTxData: true
    })

    const transfers : any[] = []

    for (const event of events) {
      const {
        pathId,
        transferId,
        // to,
        amount
        // totalSent,
        // nonce,
        // previousTransferId,
        // attestedCheckpoint
      } = event.decoded
      const context = event.context

      const path = await sdk.railsGateway.getPathInfo({ chainId, pathId })
      const tokenInfo = await sdk.railsGateway.getTokenInfo({ chainId: path.chainId, address: path.token })

      console.log('event', event)
      console.log('path', path)
      console.log('tokenInfo', tokenInfo)

      if (tokenInfo.symbol !== token) {
        continue
      }
      if (path.counterpartChainId?.toString() !== refundChainId?.toString()) {
        continue
      }

      const transfer = {
        id: transferId,
        transactionHash: context.transactionHash,
        from: context.from,
        timestamp: context.blockTimestamp,
        deadline: 0,
        amountOutMin: 0,
        amount,
        token,
        bonderFee: 0
      }

      transfers.push(transfer)
    }

    return transfers
  }

  public async populateTransfersWithOnChainData (endTimestamp?: number) {
    const initializedProviders = await this.getProviders(this.rpcUrls)
    const iterator = this.db.iterate({ all: 'address::', keys: true })
    const fns : any[] = []
    for await (const { key, value } of iterator) {
      fns.push(async () => {
        const allTransfers: Transfer[] = []

        const transfers: Transfer[] = value.transfers
        for (const transfer of transfers) {
          if (endTimestamp) {
            if (transfer.timestamp > endTimestamp) {
              continue
            }
          }

          // Do not make on-chain calls if the data already exists
          const isTransferPopulated = this.getIsTransferPopulated(transfer)
          if (isTransferPopulated) {
            allTransfers.push(transfer)
            continue
          }

          let gasUsed : string
          let gasPrice : string
          let isAggregator = false
          let chain = transfer.chain
          if (config.useApiForOnChainData) {
            try {
              if (chain === 'ethereum') {
                chain = 'mainnet' // backwards compatibility
              }
              const url = `https://optimism-fee-refund-api.hop.exchange/v1/tx-info?chain=${chain}&hash=${transfer.hash}`
              const response = await fetch(url)
              const json = await response.json()
              const txInfo = json?.data
              if (txInfo) {
                if (txInfo) {
                  gasUsed = txInfo.gasUsed
                  gasPrice = txInfo.gasPrice
                  isAggregator = txInfo.isAggregator
                }
              }
            } catch (err: any) {
              // console.error('api fetch error:', err)
            }
          }

          if (!gasUsed || !gasPrice) {
            let providerChain = transfer.chain
            if (providerChain === 'mainnet') {
              providerChain = 'ethereum'
            }
            const provider = initializedProviders[providerChain]
            if (!provider) {
              throw new Error(`no provider found for transfer chain "${transfer.chain}"`)
            }
            let tx = await retry(provider.getTransactionReceipt.bind(provider))(transfer.hash)
            if (!tx) {
              // retry
              await wait(2 * 1000)
              console.log('retrying request')
              tx = await retry(provider.getTransactionReceipt.bind(provider))(transfer.hash)
              if (!tx) {
                console.error('error provider:', provider)
                console.error(`expected tx on chain "${transfer.chain}" for hash "${transfer.hash}". Got ${tx}. This means that the rpc provider being used did not return a transaction. Please try again or use a different rpc provider.`)
                continue
              }
            }
            gasUsed = tx.gasUsed.toString()
            gasPrice = tx.effectiveGasPrice.toString()
            const aggregatorTimestamp = aggregatorAddresses[tx.to.toLowerCase()]
            if (aggregatorTimestamp && aggregatorTimestamp < transfer.timestamp) {
              isAggregator = true
            }

            // we started excluding any transfers that weren't made directly to the hop contracts
            // stating from this date
            const isHopContractTimestamp = 1684627200
            if (!isAggregator && transfer.timestamp > isHopContractTimestamp) {
              const isToHopDirectly = isHopContract(this.network, tx.to, transfer.timestamp)
              isAggregator = !isToHopDirectly
            }
          }

          const entry = Object.assign({ gasUsed, gasPrice, isAggregator }, transfer)

          const txKey = this.getTxKey(transfer.chain, transfer.hash)
          await this.db.put(txKey, entry)

          allTransfers.push(entry)
        }

        const dbEntry: DbEntry = {
          address: value.address,
          transfers: allTransfers
        }

        // console.log(`done processing ${value.address}`)
        await this.db.put(key, dbEntry)
      })
    }

    await promiseQueue(fns, async (fn: any) => {
      await fn()
    }, { concurrency: promiseQueueConcurrency })
  }

  private async getDbEntry (index: string): Promise<DbEntry> {
    try {
      return await this.db.get(index)
    } catch {
      return {
        address: '',
        transfers: []
      }
    }
  }

  private isTransactionSeenInDb (transfers: Transfer[], transactionHash: string): boolean {
    return transfers.some(transfer => transfer.hash === transactionHash)
  }

  private getIsTransferPopulated (transfer: Transfer): boolean {
    return transfer.gasUsed !== undefined && transfer.gasPrice !== undefined && transfer.isAggregator !== undefined
  }

  public async calculateFinalAmounts (
    startTimestamp: number,
    endTimestamp: number
  ): Promise<FinalEntries> {
    const finalEntries: FinalEntries = {}
    const iterator = this.db.iterate({ all: 'address::', keys: true })
    let count = 0
    const promises : any[] = []
    for await (const { key, value } of iterator) {
      promises.push(new Promise(async (resolve, reject) => {
        try {
          const dbEntry: DbEntry = value
          const address = dbEntry.address
          // console.log(`processing dbEntry ${address}`)
          const transfers: Transfer[] = dbEntry.transfers

          let amount: BigNumber = BigNumber.from(0)
          for (const transfer of transfers) {
            if (!transfer) {
              throw new Error('calculateFinalAmounts: expected transfer')
            }
            if (
              transfer.isAggregator ||
              transfer.timestamp > endTimestamp ||
              transfer.timestamp < startTimestamp
            ) {
              // console.log(transfer.chain, transfer.hash, transfer.timestamp, endTimestamp)
              resolve(null)
              continue
            }

            const { refundAmountAfterDiscountWei } = await this.getRefundAmount(transfer)

            amount = amount.add(refundAmountAfterDiscountWei)
            // console.log(`done processing dbEntry ${address}`)
            count++
          }

          if (amount.toString() !== '0') {
            finalEntries[address] = amount.toString()
          }

          resolve(null)
        } catch (err) {
          console.error(`calculateFinalAmounts: error processing dbEntry ${key}: ${err.message}`)
          reject(err)
        }
      }))
    }

    await Promise.all(promises)

    console.log(`calculateFinalAmounts count: ${count}, endTimestamp: ${endTimestamp}`)

    return finalEntries
  }

  public async getRefundAmount (transfer: Transfer): Promise<any> {
    // Calculate total amount
    const {
      sourceTxCostUsd,
      bonderFeeUsd,
      ammFeeUsd,
      totalUsdCost
    } = await this.getUsdCost(transfer)
    const price = await this.getTokenPrice(this.refundTokenSymbol, transfer.timestamp)
    const refundAmount = totalUsdCost / price

    // Apply refund discount
    const decimals = getTokenDecimals(this.refundTokenSymbol)
    let refundAmountAfterDiscount = Math.min(refundAmount * this.refundPercentage, this.maxRefundAmount)
    let refundAmountAfterDiscountWei = parseUnits(refundAmountAfterDiscount.toFixed(decimals), decimals)
    let refundAmountAfterDiscountUsd = refundAmountAfterDiscount * price

    // to prevent breaking previous merkle rewards roots when verifying,
    // we only truncate decimals after a certain date.
    // the reason for truncating decimals is to keep the price simple
    // and avoid minor discrepancies when rounding.
    const truncateAfterTimestamp = 1673049600 // 2023-01-07
    if (transfer.timestamp >= truncateAfterTimestamp) {
      refundAmountAfterDiscount = Number(Math.min(refundAmount * this.refundPercentage, this.maxRefundAmount).toFixed(2))
      refundAmountAfterDiscountWei = parseUnits(refundAmountAfterDiscount.toString(), decimals)
      refundAmountAfterDiscountUsd = Number((refundAmountAfterDiscount * price).toFixed(2))
    }

    return {
      totalUsdCost,
      price,
      refundAmount,
      refundAmountAfterDiscount,
      refundAmountAfterDiscountUsd,
      refundAmountAfterDiscountWei,
      refundTokenSymbol: this.refundTokenSymbol,
      sourceTxCostUsd,
      bonderFeeUsd,
      ammFeeUsd
    }
  }

  private async getUsdCost (transfer: Transfer): Promise<any> {
    if (!transfer) {
      throw new Error('gasUsdCost: expected transfer')
    }
    // Source tx fee
    let txCost = BigNumber.from(0)
    if (transfer.gasCost) {
      txCost = BigNumber.from(transfer.gasCost)
    } else {
      if (!transfer.gasUsed) {
        console.log(transfer)
        throw new Error('gasUsdCost: expected gasUsed')
      }
      if (!transfer.gasPrice) {
        console.log(transfer)
        throw new Error('gasUsdCost: expected gasPrice')
      }
      const gasUsed = BigNumber.from(transfer.gasUsed!)
      const gasPrice = BigNumber.from(transfer.gasPrice!)
      txCost = gasUsed.mul(gasPrice)
    }
    let chain = transfer.chain
    if (chain === 'mainnet') {
      chain = 'ethereum'
    }
    let nativeTokenSymbol: string = getNativeTokenSymbol(chain)
    if (nativeTokenSymbol === 'XDAI') {
      nativeTokenSymbol = 'DAI' // backwards compatibility
    }
    const nativeTokenDecimals = getTokenDecimals(nativeTokenSymbol)
    const sourceTxCostUsd = await this.getValueInUsd(
      txCost,
      nativeTokenSymbol,
      nativeTokenDecimals,
      transfer.timestamp
    )

    // Bonder fee
    const bonderFee = BigNumber.from(transfer.bonderFee)
    const bonderFeeSymbol = transfer.token
    const bonderFeeTokenDecimals = getTokenDecimals(transfer.token)
    const bonderFeeUsd = await this.getValueInUsd(
      bonderFee,
      bonderFeeSymbol,
      bonderFeeTokenDecimals,
      transfer.timestamp
    )

    // AMM fee
    let ammFeeUsd = 0
    const isSwap = transfer?.deadline > 0 || BigNumber.from(transfer?.amountOutMin ?? 0).gt(0)
    if (isSwap) {
      const swapFeeBps = '4'
      const ammFee = BigNumber.from(transfer.amount).mul(swapFeeBps).div('10000')
      const ammFeeSymbol = transfer.token
      const ammFeeTokenDecimals = getTokenDecimals(transfer.token)
      ammFeeUsd = await this.getValueInUsd(
        ammFee,
        ammFeeSymbol,
        ammFeeTokenDecimals,
        transfer.timestamp
      )
    }

    const totalUsdCost = sourceTxCostUsd + bonderFeeUsd + ammFeeUsd

    return {
      sourceTxCostUsd,
      bonderFeeUsd,
      ammFeeUsd,
      totalUsdCost
    }
  }

  private async getValueInUsd (
    costInAsset: BigNumber,
    symbol: string,
    decimals: number,
    timestamp: number
  ): Promise<number> {
    const price = await this.getTokenPrice(symbol, timestamp)
    const formattedCost = formatUnits(costInAsset, decimals)
    let result = Number(formattedCost) * price

    // to prevent breaking previous merkle rewards roots when verifying,
    // we only truncate decimals after a certain date.
    // the reason for truncating decimals is to keep the price simple
    // and avoid minor discrepancies when rounding.
    const truncateAfterTimestamp = 1673049600 // 2023-01-07
    if (timestamp >= truncateAfterTimestamp) {
      result = Number(result.toFixed(2))
    }

    return result
  }

  public async fetchPricesForAllTokens (_tokenList: string[], refundTokenSymbol?: string) {
    const tokenList = new Set(_tokenList)
    if (refundTokenSymbol) {
      tokenList.add(refundTokenSymbol)
    }
    const tokens = Array.from(tokenList)
    for (const token of tokens) {
      try {
        const res: any = await retry(this.fetchPricesForToken)(token)
        if (!res) {
          throw new Error('fetchPricesForAllTokens: no response')
        }

        if (!res?.length) {
          throw new Error('fetchPricesForAllTokens: expected array items')
        }

        let hasPriceForToday = false

        for (const data of res) {
          const timestamp = toSeconds(data[0])
          const price = data[1]

          const startUnix = DateTime.fromSeconds(timestamp).toUTC().startOf('day').toSeconds()
          const nowUnix = DateTime.now().toUTC().startOf('day').toSeconds()
          if (startUnix === nowUnix) {
            hasPriceForToday = true
          }
          const key = this.getPriceKey(token, startUnix)
          // console.log('put price', key, startUnix, price)
          await this.db.put(key, { timestamp: startUnix, price })
        }

        try {
          if (!hasPriceForToday) {
            const startUnix = DateTime.now().toUTC().startOf('day').toSeconds()
            // console.log('NoTodayPrice:', token, startUnix)

            const yesterdayUnix = DateTime.now().toUTC().startOf('day').minus({ days: 1 }).toSeconds()
            const res = await this.db.get(this.getPriceKey(token, yesterdayUnix))
            if (res?.price) {
              // console.log('setting today price as yesterday price until api returns today price')
              const key = this.getPriceKey(token, startUnix)
              const price = res.price
              await this.db.put(key, { timestamp: startUnix, price })
            }
          }
        } catch (err) {
        }
      } catch (err) {
        console.error('fetchPricesForAllTokens error:', err)
      }
    }
  }

  private fetchPricesForToken = async (tokenSymbol: string) => {
    const coinId = getCoingeckoId(tokenSymbol)
    const cached = cache[coinId]
    const timeLimitMs = 60 * 1000

    if (cached && cachedAt[coinId] + timeLimitMs >= Date.now()) {
      return cached
    }

    const baseUrl = coingeckoApiKey ? 'https://pro-api.coingecko.com/api/v3' : 'https://api.coingecko.com/api/v3'
    const url = `${baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=365&interval=daily${coingeckoApiKey ? `&x_cg_pro_api_key=${coingeckoApiKey}` : ''}`

    const res = await fetch(url)
    const json = await res.json()
    const { prices, status } = json

    if (status?.error_message) {
      throw new Error(status.error_message)
    }

    if (!prices) {
      console.error('fetch error:', json)
      return null
    }

    cache[coinId] = prices
    cachedAt[coinId] = Date.now()

    return prices
  }

  async getTokenPrice (tokenSymbol: string, timestamp: number): Promise<number> {
    if (!timestamp) {
      throw new Error('getTokenPrice: expected timestamp')
    }

    const dt = DateTime.fromSeconds(timestamp).toUTC().startOf('day')
    const ts = dt.toSeconds()
    let key = this.getPriceKey(tokenSymbol, ts)
    let price : any
    try {
      const res = await this.db.get(key)
      if (res) {
        price = res.price
      }
    } catch (err) {
      console.log('getTokenPrice error1:', tokenSymbol, err.message)
    }

    if (!price) {
      let days = 0
      while (!price && days < 15) {
        days++
        try {
          console.log('no price found for key ', key, ', getting price from 1 day ago')
          const ts = dt.minus({ days }).toSeconds()
          key = this.getPriceKey(tokenSymbol, ts)
          const res = await this.db.get(key)
          if (res) {
            price = res.price
          }
        } catch (err) {
          console.log(`getTokenPrice error days -${days}:`, tokenSymbol, err.message)
        }
      }
    }

    if (!price) {
      throw new Error(`getTokenPrice: no price found for key ${key}`)
    }

    // to prevent breaking previous merkle rewards roots when verifying,
    // we only truncate decimals after a certain date.
    // the reason for truncating decimals is to keep the price simple
    // and avoid minor discrepancies in price when quering api on different days.
    const truncateAfterTimestamp = 1673049600 // 2023-01-07
    if (timestamp >= truncateAfterTimestamp) {
      price = Number(price.toFixed(2))
    }

    // console.log('price:', tokenSymbol, price, timestamp)

    return price
  }

  public getAddressKey (address: string): string {
    return `address::${address?.toLowerCase()}`
  }

  public getTxKey (chainSlug: string, txHash: string): string {
    return `tx::${chainSlug}:${txHash}`
  }

  public getPriceKey (tokenSymbol: string, timestamp: number): string {
    return `price::${tokenSymbol}::${timestamp}`
  }

  public async getAccountHistory (account: string): Promise<any> {
    const address = account.toLowerCase()
    const entry = await this.db.get(this.getAddressKey(address))

    const promises = entry?.transfers?.map(async (item: any) => {
      let chain = item.chain
      if (chain === 'ethereum') {
        chain = 'mainnet' // backwards compatibility
      }

      const transfer = {
        gasUsed: item.gasUsed,
        gasPrice: item.gasPrice,
        hash: item.hash,
        timestamp: item.timestamp,
        amount: item.amount,
        token: item.token,
        bonderFee: item.bonderFee,
        chain: chain
      }
      const refundAmount = await this.getRefundAmount(transfer)

      return {
        ...transfer,
        refund: {
          totalCostInUsd: refundAmount.totalUsdCost,
          refundTokenPrice: refundAmount.price,
          refundAmountInToken: refundAmount.refundAmountAfterDiscount,
          refundAmountInUsd: refundAmount.refundAmountAfterDiscountUsd,
          refundTokenSymbol: refundAmount.refundTokenSymbol
        }
      }
    })

    return Promise.all(promises)
  }

  private async getProviders (rpcUrls: any): Promise<Record<string, any>> {
    const initializedProviders: Record<string, any> = {}
    for (const chain in rpcUrls) {
      initializedProviders[chain] = new providers.JsonRpcProvider({ allowGzip: true, url: rpcUrls[chain] })
    }

    return initializedProviders
  }
}
