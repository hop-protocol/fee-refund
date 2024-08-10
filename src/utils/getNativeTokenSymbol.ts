import { type ChainSlug, NetworkSlug, getChain } from '@hop-protocol/sdk'

export function getNativeTokenSymbol (chain: string): string {
  return getChain(NetworkSlug.Mainnet, chain as ChainSlug).nativeTokenSymbol
}
