import { networks } from '@hop-protocol/sdk-core'

export function getDefaultRpcUrl (network: string, chain: string) {
  return networks[network]?.[chain]?.publicRpcUrl
}
