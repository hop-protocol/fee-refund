import Level from 'level-ts'
import { providers } from 'ethers'
import {
  aggregatorAddresses
} from '../constants'
import { DbEntry, RpcUrls, Transfer } from '../types/interfaces'
import { promiseQueue } from '../utils/promiseQueue'
import { retry } from '../utils/retry'
import wait from 'wait'

export async function fetchOnChainData (db: Level, rpcUrls: RpcUrls, endTimestamp?: number) {
  const initializedProviders = await getProviders(rpcUrls)
  const iterator = db.iterate({ all: 'address::', keys: true })
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
        const isTransferPopulated = getIsTransferPopulated(transfer)
        if (isTransferPopulated) {
          allTransfers.push(transfer)
          continue
        }

        const provider = initializedProviders[transfer.chain]
        let tx = await retry(provider.getTransactionReceipt.bind(provider))(transfer.hash)
        if (!tx) {
          // retry
          await wait(2 * 1000)
          console.log('retrying request')
          tx = await retry(provider.getTransactionReceipt.bind(provider))(transfer.hash)
          if (!tx) {
            console.error('error provider:', provider)
            throw new Error(`expected tx on chain "${transfer.chain}" for hash "${transfer.hash}". Got ${tx}`)
          }
        }
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

      // console.log(`done processing ${value.address}`)
      await db.put(key, dbEntry)
    })
  }

  await promiseQueue(fns, async (fn: any) => {
    await fn()
  }, { concurrency: 100 })
}

async function getProviders (rpcUrls: RpcUrls): Promise<Record<string, any>> {
  const initializedProviders: Record<string, any> = {}
  for (const chain in rpcUrls) {
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
