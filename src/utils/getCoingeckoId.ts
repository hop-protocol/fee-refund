import { tokens } from '@hop-protocol/core/metadata'

export function getCoingeckoId (tokenSymbol: string) {
  return tokens[tokenSymbol]?.coingeckoId
}
