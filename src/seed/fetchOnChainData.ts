import Level from 'level-ts'
import { providers } from 'ethers'
import { DbEntry, Transfer } from '../types/interfaces'
import { promiseQueue } from '../utils/promiseQueue'
import { retry } from '../utils/retry'
import wait from 'wait'
import { promiseQueueConcurrency, config, aggregatorAddresses } from '../config'
import { isHopContract } from '../utils/isHopContract'

export async function fetchOnChainData (db: Level, rpcUrls: any, network: string, endTimestamp?: number) {
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

        let gasUsed : string
        let gasPrice : string
        let isAggregator = false
        let chain = transfer.chain
        if (config.useApiForOnChainData) {
          try {
            if (chain === 'ethereum') {
              chain = 'mainnet' // backwards compatibility
            }
            const url = `https://optimism-fee-refund-api.hop.exchange/v1/tx-info?chain=${chain}&hash=${transfer.hash}`
            const response = await fetch(url)
            const json = await response.json()
            const txInfo = json?.data
            if (txInfo) {
              if (txInfo) {
                gasUsed = txInfo.gasUsed
                gasPrice = txInfo.gasPrice
                isAggregator = txInfo.isAggregator
              }
            }
          } catch (err: any) {
            // console.error('api fetch error:', err)
          }
        }

        if (!gasUsed || !gasPrice) {
          let providerChain = transfer.chain
          if (providerChain === 'mainnet') {
            providerChain = 'ethereum'
          }
          const provider = initializedProviders[providerChain]
          if (!provider) {
            throw new Error(`no provider found for transfer chain "${transfer.chain}"`)
          }
          let tx = await retry(provider.getTransactionReceipt.bind(provider))(transfer.hash)
          if (!tx) {
            // retry
            await wait(2 * 1000)
            console.log('retrying request')
            tx = await retry(provider.getTransactionReceipt.bind(provider))(transfer.hash)
            if (!tx) {
              console.error('error provider:', provider)
              throw new Error(`expected tx on chain "${transfer.chain}" for hash "${transfer.hash}". Got ${tx}. This means that the rpc provider being used did not return a transaction. Please try again or use a different rpc provider.`)
            }
          }
          gasUsed = tx.gasUsed.toString()
          gasPrice = tx.effectiveGasPrice.toString()
          const aggregatorTimestamp = aggregatorAddresses[tx.to.toLowerCase()]
          if (aggregatorTimestamp && aggregatorTimestamp < transfer.timestamp) {
            isAggregator = true
          }

          // we started excluding any transfers that weren't made directly to the hop contracts
          // stating from this date
          const isHopContractTimestamp = 1684627200
          if (!isAggregator && transfer.timestamp > isHopContractTimestamp) {
            const isToHopDirectly = isHopContract(network, tx.to, transfer.timestamp)
            isAggregator = !isToHopDirectly
          }
        }

        const entry = Object.assign({ gasUsed, gasPrice, isAggregator }, transfer)

        const txKey = `tx::${transfer.chain}:${transfer.hash}`
        await db.put(txKey, entry)

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
  }, { concurrency: promiseQueueConcurrency })
}

async function getProviders (rpcUrls: any): Promise<Record<string, any>> {
  const initializedProviders: Record<string, any> = {}
  for (const chain in rpcUrls) {
    initializedProviders[chain] = new providers.JsonRpcProvider({ allowGzip: true, url: rpcUrls[chain] })
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
