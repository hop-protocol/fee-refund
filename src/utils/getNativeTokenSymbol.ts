import { chains } from '@hop-protocol/core/metadata'

export function getNativeTokenSymbol (chain: string) {
  const nativeTokenSymbol = chains[chain]?.nativeTokenSymbol
  if (!nativeTokenSymbol) {
    throw new Error(`native token symbol not found for chain ${chain}`)
  }

  return nativeTokenSymbol
}
