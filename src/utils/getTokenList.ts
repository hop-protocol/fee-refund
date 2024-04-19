import { addresses } from '@hop-protocol/sdk-core'

const { mainnet: mainnetAddresses, goerli: goerliAddresses } = addresses

const networks = {
  mainnet: mainnetAddresses,
  goerli: goerliAddresses
}

// for backwards compatibility
const tokensBeforeReadingFromCore = [
  'ETH',
  'MATIC',
  'USDC',
  'USDT',
  'DAI',
  'HOP',
  'SNX'
]

export function getTokenList (network: string, timestamp?: number) {
  if (timestamp && timestamp <= 1690297200) {
    return tokensBeforeReadingFromCore
  }

  const bridges = networks[network].bridges
  const set = new Set([])
  for (const tokenSymbol in bridges) {
    set.add(tokenSymbol)
  }
  return Array.from(set)
}
