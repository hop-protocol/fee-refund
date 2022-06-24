import Level from 'level-ts'
import getLastTimestamp from '../utils/getLastTimestamp'
import getUrl from '../utils/getUrl'
import queryFetch from '../utils/queryFetch'
import {
  PAGE_SIZE,
  chainIds,
  chains,
  subgraphs,
  tokens
} from '../constants'
import { DbEntry } from '../interfaces'

async function main (db: Level, refundChain: string, startTimestamp: number) {
  const refundChainId = chainIds[refundChain]
  await Promise.all(tokens.map(async (token) => {
    for (const chain of chains) {
      const lastTimestamp = await getLastTimestamp(db, chain)
      if (lastTimestamp) {
        // Increment timestamp so there are no duplicates
        startTimestamp = lastTimestamp + 1
      }

      await fetchHopTransfers(db, token, chain, refundChainId, startTimestamp)
    }
  }))
}

async function fetchHopTransfers (
  db: any,
  token: string,
  chain: string,
  refundChainId: number,
  startTimestamp: number
): Promise<void> {
  let lastId = '0'
  let lastTimestamp = 0
  while (true) {
    const data: any[] = await fetchHopTransferBatch(token, chain, lastId, refundChainId, startTimestamp)

    if (!data || data.length === 0) break
    lastId = data[data.length - 1].id

    for (const entry of data) {
      const address = entry.from
      const key = `address::${address}`

      const dbEntry: DbEntry = await getDbEntry(db, key)
      dbEntry.address = address
      dbEntry.transfers.push({
        hash: entry.transactionHash,
        timestamp: entry.timestamp,
        amount: entry.amount,
        token: entry.token,
        bonderFee: entry.bonderFee || 0,
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
  token: string,
  chain: string,
  lastId: string,
  refundChainId: number,
  startTimestamp: number
) {
  let query

  if (chain === 'mainnet') {
    query = `
      query Transfers($pageSize: Int, $lastId: ID, $token: String, $startTimestamp: Int) {
        transfers: transferSentToL2S(
          first: $pageSize,
          where: {
            token: $token,
            destinationChainId: ${refundChainId}
            id_gt: $lastId,
            timestamp_gte: $startTimestamp
          },
          orderBy: id,
          orderDirection: asc
        ) {
          id
          transactionHash
          from
          timestamp
          amount
          token
        }
      }
    `
  } else {
    query = `
      query Transfers($pageSize: Int, $lastId: ID, $token: String, $startTimestamp: Int) {
        transfers: transferSents(
          first: $pageSize,
          where: {
            token: $token,
            destinationChainId: ${refundChainId}
            id_gt: $lastId,
            timestamp_gte: $startTimestamp
          },
          orderBy: id,
          orderDirection: asc
        ) {
          id
          transactionHash
          from
          timestamp
          amount
          token
          bonderFee
        }
      }
    `
  }

  const url = getUrl(chain, subgraphs.hopBridge)
  const data = await queryFetch(
    url,
    query,
    {
      pageSize: PAGE_SIZE,
      lastId,
      token,
      startTimestamp
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

export default main
