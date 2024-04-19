import { Level } from '../dist/utils/Level.js'
import fs from 'fs'
import { fetchHopTransfers } from '../dist/seed/fetchHopTransfers.js'
import { getChainIdMap } from '../src/utils/getChainIdMap'
import { getChainList } from '../src/utils/getChainList'
import { getTokenList } from '../src/utils/getTokenList'

describe('fetchHopTransfers', () => {
  try {
    fs.rmdirSync('./test-db', { recursive: true })
  } catch (err) {
    // console.error(err)
  }
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

    expect(count).toBe(29)
  }, 10 * 60 * 1000)
})
