import { getNetwork, NetworkSlug } from '@hop-protocol/sdk'

export function getChainIdMap (network: string) {
  const map = {}
  const chains = getNetwork(network as NetworkSlug).chains
  for (const chain in chains) {
    map[chains[chain].slug] = chains[chain].chainId
  }
  return map
}
