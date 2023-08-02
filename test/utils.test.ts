import { getTokenList } from '../src/utils/getTokenList'
import { getChainList } from '../src/utils/getChainList'
import { getCoingeckoId } from '../src/utils/getCoingeckoId'
import { getSubgraphUrl } from '../src/utils/getSubgraphUrl'
import { getChainIdMap } from '../src/utils/getChainIdMap'
import { getTokenDecimals } from '../src/utils/getTokenDecimals'
import { getNativeTokenSymbol } from '../src/utils/getNativeTokenSymbol'

describe('utils', () => {
  test('getTokenList', () => {
    const tokenList = getTokenList('mainnet')
    console.log(tokenList)
    expect(tokenList.length > 0).toBe(true)
  })
  test.only('getChainList', () => {
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
    expect(getSubgraphUrl('mainnet', 'polygon')).toBe('https://api.thegraph.com/subgraphs/name/hop-protocol/hop-polygon')
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
})
