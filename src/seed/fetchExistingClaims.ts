import Level from 'level-ts'
import { BigNumber } from 'ethers'
import getUrl from '../utils/getUrl'
import queryFetch from '../utils/queryFetch'
import {
  PAGE_SIZE
} from '../constants'
import { DbEntry } from '../interfaces'

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
    query ExistingClaims($pageSize: Int) {
      existingClaims: claimedEntities(
        first: $pageSize,
        where: {
          id_gt: $lastId,
          contractAddress: ${merkleRewardsContractAddress}
        },
        orderBy: id,
        orderDirection: asc
      ) {
        from
        amount
      }
    }
  `

  const chain = refundChain
  const url = getUrl(chain)
  const data = await queryFetch(
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
