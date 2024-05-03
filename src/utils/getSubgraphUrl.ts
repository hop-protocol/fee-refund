import { type NetworkSlug, type ChainSlug, getChain } from '@hop-protocol/sdk'

export function getSubgraphUrl (network: string, chain: string) {
  return getChain(network as NetworkSlug, chain as ChainSlug).subgraphUrl
}
