import Level from 'level-ts'
import { BigNumber } from 'ethers'
import getUrl from '../utils/getUrl'
import queryFetch from '../utils/queryFetch'
import {
  PAGE_SIZE,
  subgraphs
} from '../constants'
import { DbEntry } from '../types/interfaces'
import { retry } from '../utils/retry'

async function main (db: Level, refundChain: string, merkleRewardsContractAddress: string) {
  let lastId = '0'
  while (true) {
    const data: any[] = await fetchExistingClaimsBatch(lastId, refundChain, merkleRewardsContractAddress)

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
}

async function fetchExistingClaimsBatch (
  lastId: string,
  refundChain: string,
  merkleRewardsContractAddress: string
) {
  const query = `
    query ExistingClaims($pageSize: Int, $lastId: ID) {
      existingClaims: claimedEntities(
        first: $pageSize,
        where: {
          id_gt: $lastId,
          contractAddress: "${merkleRewardsContractAddress.toLowerCase()}"
        },
        orderBy: id,
        orderDirection: asc
      ) {
        amount
      }
    }
  `

  const chain = refundChain
  const url = getUrl(chain, subgraphs.merkleRewards)
  const data = await retry(queryFetch)(
    url,
    query,
    {
      pageSize: PAGE_SIZE,
      lastId
    }
  )
  return data ? data.existingClaims : []
}

export default main
