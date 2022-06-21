import Level from 'level-ts'
import getUrl from '../utils/getUrl'
import queryFetch from '../utils/queryFetch'
import {
  PAGE_SIZE,
  chainIds,
  chains,
  tokens
} from '../constants'
import {
  refundChainId,
  startTimestamp
} from '../config'
import { DbEntry } from '../interfaces'

async function main (db: Level) {
  await Promise.all(tokens.map(async (token) => {
    for (const chain of chains) {
      await fetchHopTransfers(db, token, chain)
    }
  }))

  console.log('==== Successfully Fetched Hop Transfers ====')
}

async function fetchHopTransfers (db: any, token: string, chain: string) {
  let lastId = '0'
  while (true) {
    const data: any[] = await fetchHopTransferBatch(token, chain, lastId)

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

      await db.put(key, dbEntry)
    }
  }
}

async function fetchHopTransferBatch (token: string, chain: string, lastId: string) {
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

  const url = getUrl(chain)
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
      claimAmount: '0',
      transfers: []
    }
  }
}

export default main
