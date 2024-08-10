import { type NetworkSlug, type ChainSlug, getChain } from '@hop-protocol/sdk'

export function getDefaultRpcUrl (network: string, chain: string): string {
  return getChain(network as NetworkSlug, chain as ChainSlug).publicRpcUrl
}
