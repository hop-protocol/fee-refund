import type { Level } from '../utils/Level.js'
import { getSubgraphUrl } from '../utils/getSubgraphUrl.js'
import queryFetch from '../utils/queryFetch.js'
import { getChainIdMap } from '../utils/getChainIdMap.js'
import { PAGE_SIZE } from '../constants.js'
import { DbEntry, Transfer } from '../types/interfaces.js'
import { Hop as HopV2 } from '@hop-protocol/v2-sdk'
import { getBlockNumberFromDate } from '@hop-protocol/sdk'
import { etherscanApiKeys } from '../config/index.js'
import { getProvider } from '../utils/getProvider.js'

export async function fetchHopTransfers (network: string, db: typeof Level, refundChain: string, startTimestamp: number, chains: string[], chainIds: Record<string, number>, tokens: string[], endTimestamp?: number) {
  const refundChainId = chainIds[refundChain]
  for (const token of tokens) {
    for (const chain of chains) {
      // console.log('fetch from the graph', chain, token)
      await fetchHopTransfersDb(network, db, token, chain, refundChainId, startTimestamp, endTimestamp)
    }
  }
}

export async function fetchHopTransfersDb (
  network: any,
  db: any,
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
    let v2Data: any[] = []

    const nonCctpData: any[] = await fetchHopTransferBatch(network, token, chain, lastId, refundChainId, startTimestamp, endTimestamp)
    if (token === 'USDC') {
      cctpData = await fetchHopTransferBatchCctp(network, token, chain, lastId, refundChainId, startTimestamp, endTimestamp)
    }

    v2Data = await fetchHopTransfersV2({
      network,
      token,
      chain,
      lastId,
      refundChainId,
      startTimestamp,
      endTimestamp
    })

    data = nonCctpData.concat(cctpData).sort((a, b) => a.timestamp - b.timestamp)

    if (!data || data.length === 0) break
    lastId = data[data.length - 1].id

    for (const entry of data) {
      const address = entry.from
      const key = `address::${address}`

      const dbEntry: DbEntry = await getDbEntry(db, key)

      // Do not write to DB if transfer already exists
      const isSeen = isTransactionSeen(dbEntry.transfers, entry.transactionHash)
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
      await db.put(key, dbEntry)
    }
  }

  if (lastTimestamp) {
    const lastTimestampKey = `timestamp::${transferChain}`
    await db.put(lastTimestampKey, lastTimestamp)
  }
}

async function fetchHopTransferBatch (
  network: string,
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

  const url = getSubgraphUrl(network, chain)
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

async function fetchHopTransferBatchCctp (
  network: string,
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

    const url = getSubgraphUrl(network, chain)
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

async function getDbEntry (db: typeof Level, index: string): Promise<DbEntry> {
  try {
    return await db.get(index)
  } catch {
    return {
      address: '',
      amountClaimed: '0',
      transfers: []
    }
  }
}

function isTransactionSeen (transfers: Transfer[], transactionHash: string): boolean {
  for (const transfer of transfers) {
    if (transfer.hash === transactionHash) {
      return true
    }
  }

  return false
}

async function fetchHopTransfersV2 ({
  network,
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

  console.log('fetchHopTransfersV2', network, token, chain, lastId, refundChainId, startTimestamp, endTimestamp)

  const sdk = new HopV2({
    network
  })

  const chainId = getChainIdMap(network)[chain]

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
      to,
      amount,
      totalSent,
      nonce,
      previousTransferId,
      attestedCheckpoint
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
