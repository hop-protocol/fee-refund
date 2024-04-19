import { networks } from '@hop-protocol/sdk-core'

export function getSubgraphUrl (network: string, chain: string) {
  const url = networks[network]?.[chain].subgraphUrl
  if (!url) {
    throw new Error(`subgraph url not found for chain ${chain}`)
  }

  return url
}
