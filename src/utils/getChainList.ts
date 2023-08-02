import { mainnet as mainnetAddresses, goerli as goerliAddresses } from '@hop-protocol/core/addresses'

const networks = {
  mainnet: mainnetAddresses,
  goerli: goerliAddresses
}

export function getChainList (network: string) {
  const bridges = mainnetAddresses.bridges
  const set = new Set([])
  for (const tokenSymbol in bridges) {
    for (const chain in bridges[tokenSymbol]) {
      set.add(chain)
    }
  }
  return Array.from(set)
}
