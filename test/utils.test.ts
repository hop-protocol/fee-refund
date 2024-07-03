import { getTokenList } from '../src/utils/getTokenList'
import { getChainList } from '../src/utils/getChainList'
import { getCoingeckoId } from '../src/utils/getCoingeckoId'
import { getSubgraphUrl } from '../src/utils/getSubgraphUrl'
import { getChainIdMap } from '../src/utils/getChainIdMap'
import { getTokenDecimals } from '../src/utils/getTokenDecimals'
import { getNativeTokenSymbol } from '../src/utils/getNativeTokenSymbol'
import { isHopContract } from '../src/utils/isHopContract'

describe('utils', () => {
  test('getTokenList', () => {
    const tokenList = getTokenList('mainnet')
    console.log(tokenList)
    expect(tokenList.length > 0).toBe(true)
  })
  test('getChainList', () => {
    const list = getChainList('mainnet')
    console.log(list)
    expect(list.length > 0).toBe(true)
  })
  test('getCoingeckoId ', () => {
    expect(getCoingeckoId('ETH')).toBe('ethereum')
    expect(getCoingeckoId('USDT')).toBe('tether')
    expect(getCoingeckoId('rETH')).toBe('rocket-pool-eth')
  })
  test('getSubgraphUrl', () => {
    // expect(getSubgraphUrl('mainnet', 'polygon')).toBe('https://api.thegraph.com/subgraphs/name/hop-protocol/hop-polygon')
    expect(getSubgraphUrl('mainnet', 'polygon')).toBe('https://subgraph.hop.exchange/polygon')
  })
  test('getChainIdMap', () => {
    const map = getChainIdMap('mainnet')
    console.log(map)
    expect(map).toBeDefined()
  })
  it('getTokenDecimals', () => {
    expect(getTokenDecimals('rETH')).toBe(18)
    expect(getTokenDecimals('ETH')).toBe(18)
    expect(getTokenDecimals('MATIC')).toBe(18)
    expect(getTokenDecimals('DAI')).toBe(18)
    expect(getTokenDecimals('XDAI')).toBe(18)
  })
  it('getNativeTokenSymbol', () => {
    expect(getNativeTokenSymbol('polygon')).toBe('MATIC')
    expect(getNativeTokenSymbol('optimism')).toBe('ETH')
    expect(getNativeTokenSymbol('gnosis')).toBe('XDAI')
  })
  it('isHopContract', () => {
    expect(isHopContract('mainnet', '0xc30141b657f4216252dc59af2e7cdb9d8792e1b0')).toBe(false)
    expect(isHopContract('mainnet', '0xc315239cFb05F1E130E7E28E603CEa4C014c57f0')).toBe(true)
    expect(isHopContract('mainnet', '0x893246FACF345c99e4235E5A7bbEE7404c988b96')).toBe(true)
    expect(isHopContract('mainnet', '0xd6bFB71b5Ad5fD378CaC15C72D8652E3b8D542c4')).toBe(true)
    expect(isHopContract('mainnet', '0xe22d2bedb3eca35e6397e0c6d62857094aa26f52')).toBe(true)
    expect(isHopContract('mainnet', '0x1111111111111111111111111111111111111111')).toBe(false)
  })
})
