import Level from 'level-ts'
import { providers } from 'ethers'
import {
  aggregatorAddresses,
  chains
} from '../constants'
import { DbEntry, RpcUrls, Transfer } from '../interfaces'

async function main (db: Level, rpcUrls: RpcUrls) {
  const initializedProviders = await getProviders(rpcUrls)
  const iterator = db.iterate({ all: 'address::', keys: true })
  for await (const { key, value } of iterator) {
    const allTransfers: Transfer[] = []

    const transfers: Transfer[] = value.transfers
    for (const transfer of transfers) {
      // Do not make on-chain calls if the data already exists
      const isTransferPopulated = getIsTransferPopulated(transfer)
      if (isTransferPopulated) {
        allTransfers.push(transfer)
        continue
      }

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

async function getProviders (rpcUrls: RpcUrls): Promise<Record<string, any>> {
  const initializedProviders: Record<string, any> = {}
  for (const chain of chains) {
    initializedProviders[chain] = new providers.JsonRpcProvider(rpcUrls[chain])
  }

  return initializedProviders
}

function getIsTransferPopulated (transfer: Transfer): boolean {
  return (
    typeof transfer.gasUsed !== 'undefined' &&
    typeof transfer.gasPrice !== 'undefined' &&
    typeof transfer.isAggregator !== 'undefined'
  )
}

export default main
