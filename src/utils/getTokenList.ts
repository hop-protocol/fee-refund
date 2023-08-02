import { mainnet as mainnetAddresses, goerli as goerliAddresses } from '@hop-protocol/core/addresses'

const networks = {
  mainnet: mainnetAddresses,
  goerli: goerliAddresses
}

export function getTokenList (network: string) {
  const bridges = networks[network].bridges
  const set = new Set([])
  for (const tokenSymbol in bridges) {
    set.add(tokenSymbol)
  }
  return Array.from(set)
}
