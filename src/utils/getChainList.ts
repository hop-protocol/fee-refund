import { goerli as goerliAddresses, mainnet as mainnetAddresses } from '@hop-protocol/sdk/addresses'

const networks = {
  mainnet: mainnetAddresses,
  goerli: goerliAddresses
}

// for backwards compatibility
const chainsBeforeReadingFromSdkCore = [
  'ethereum',
  'arbitrum',
  'optimism',
  'polygon',
  'gnosis'
]

export function getChainList (network: string, timestamp?: number) {
  if (timestamp && timestamp <= 1690297200) {
    return chainsBeforeReadingFromSdkCore
  }

  const bridges = networks[network].bridges
  const set = new Set([])
  for (const tokenSymbol in bridges) {
    for (const chain in bridges[tokenSymbol]) {
      set.add(chain)
    }
  }
  return Array.from(set)
}
