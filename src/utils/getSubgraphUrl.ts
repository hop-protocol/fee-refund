import { mainnet as mainnetAddresses, goerli as goerliAddresses } from '@hop-protocol/core/networks'

const networks = {
  mainnet: mainnetAddresses,
  goerli: goerliAddresses
}

export function getSubgraphUrl (network: string, chain: string) {
  const url = networks[network]?.[chain].subgraphUrl
  if (!url) {
    throw new Error(`subgraph url not found for chain ${chain}`)
  }

  return url
}
