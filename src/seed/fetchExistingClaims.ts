import Level from 'level-ts'
import { BigNumber } from 'ethers'
import getUrl from '../utils/getUrl'
import queryFetch from '../utils/queryFetch'
import {
  PAGE_SIZE
} from '../constants'
import {
  refundChain,
  refundChainId,
  startTimestamp
} from '../config'
import { DbEntry } from '../interfaces'

async function main (db: Level) {
  let lastId = '0'
  while (true) {
    const data: any[] = await fetchExistingClaimsBatch(lastId)

    if (!data || data.length === 0) break
    lastId = data[data.length - 1].id

    for (const entry of data) {
      const address: string = entry.from
      const key = `address::${address}`
      const dbEntry: DbEntry = await await db.get(key)

      const totalAmountClaimed = BigNumber.from(dbEntry.amountClaimed).add(entry.amount)
      dbEntry.amountClaimed = totalAmountClaimed.toString()
      await db.put(key, dbEntry)
    }
  }

  console.log('==== Successfully Fetched Existing Claims ====')
}

async function fetchExistingClaimsBatch (lastId: string) {
  // TODO
  const query = `
  `

  const chain = refundChain
  const url = getUrl(chain)
  const data = await queryFetch(
    url,
    query,
    {
      pageSize: PAGE_SIZE,
      lastId,
      startTimestamp
    }
  )
  // TODO: update key name
  return data ? data.transfers : []
}

export default main
