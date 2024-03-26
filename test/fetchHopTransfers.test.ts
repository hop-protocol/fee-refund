import Level from 'level-ts'
import fs from 'fs'
import { fetchHopTransfers } from '../src/seed/fetchHopTransfers'
import { getChainIdMap } from '../src/utils/getChainIdMap'
import { getChainList } from '../src/utils/getChainList'
import { getTokenList } from '../src/utils/getTokenList'

describe('fetchHopTransfers', () => {
  fs.rmdirSync('./test-db', { recursive: true })
  it('should fetch hop transfers', async () => {
    const network = 'mainnet'
    const db = new Level('./test-db')
    const refundChain = 'optimism'
    const startTimestamp = 1711238400
    const chains = getChainList(network, startTimestamp)
    const chainIds = getChainIdMap(network)
    const tokens = getTokenList(network, startTimestamp).filter(token => token === 'USDC')
    const endTimestamp = 1711411199
    await fetchHopTransfers(network, db, refundChain, startTimestamp, chains, chainIds, tokens, endTimestamp)

    const iterator = db.iterate({ all: 'address::', keys: true })
    let count = 0
    for await (const { key, value } of iterator) {
      console.log(key, value)
      count++
    }

    expect(count).toBe(28)
  }, 10 * 60 * 1000)
})
