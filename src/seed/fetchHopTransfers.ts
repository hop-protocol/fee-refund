import Level from 'level-ts'
import getLastTimestamp from '../utils/getLastTimestamp'
import getUrl from '../utils/getUrl'
import queryFetch from '../utils/queryFetch'
import {
  PAGE_SIZE,
  subgraphs
} from '../constants'
import { DbEntry, Transfer } from '../types/interfaces'

export async function fetchHopTransfers (network: string, db: Level, refundChain: string, startTimestamp: number, chains: string[], chainIds: Record<string, number>, tokens: string[], endTimestamp?: number) {
  const refundChainId = chainIds[refundChain]
  for (const token of tokens) {
    for (const chain of chains) {
      /*
      const lastTimestamp = await getLastTimestamp(db, chain)
      if (lastTimestamp) {
        // Resync one day in order to catch any missed events
        const oneDayBeforeLastTimestamp = lastTimestamp - ONE_DAY_SEC
        if (oneDayBeforeLastTimestamp > startTimestamp) {
          startTimestamp = oneDayBeforeLastTimestamp
        }
      }
      */

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
  while (true) {
    const data: any[] = await fetchHopTransferBatch(network, token, chain, lastId, refundChainId, startTimestamp, endTimestamp)

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
    const lastTimestampKey = `timestamp::${chain}`
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

  const url = getUrl(network, chain, subgraphs.hopBridge)
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
  return data ? data.transfers : []
}

async function getDbEntry (db: Level, index: string): Promise<DbEntry> {
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
