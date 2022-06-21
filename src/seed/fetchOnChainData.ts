import Level from 'level-ts'
import { providers } from 'ethers'
import {
  aggregatorAddresses,
  chains,
  rpcUrls
} from '../constants'
import { DbEntry, Transfer } from '../interfaces'

async function main (db: Level) {
  const initializedProviders = await getProviders()
  const iterator = db.iterate({ all: 'address::', keys: true })
  for await (const { key, value } of iterator) {
    const allTransfers: Transfer[] = []

    const transfers: Transfer[] = value.transfers
    for (const transfer of transfers) {
      const tx = await initializedProviders[transfer.chain].getTransactionReceipt(transfer.hash)
      const gasUsed = tx.gasUsed.toString()
      const gasPrice = tx.effectiveGasPrice.toString()
      const isAggregator = aggregatorAddresses[tx.to.toLowerCase()] || false

      const entry = Object.assign({ gasUsed, gasPrice, isAggregator }, transfer)
      allTransfers.push(entry)
    }

    const dbEntry: DbEntry = {
      address: value.address,
      amountClaimed: value.amountClaimed,
      transfers: allTransfers
    }

    await db.put(key, dbEntry)
  }
}

async function getProviders (): Promise<Record<string, any>> {
  const initializedProviders: Record<string, any> = {}
  for (const chain of chains) {
    initializedProviders[chain] = new providers.JsonRpcProvider(rpcUrls[chain])
  }

  return initializedProviders
}

export default main
