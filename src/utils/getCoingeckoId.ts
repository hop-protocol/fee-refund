import { metadata } from '@hop-protocol/sdk-core'

const { tokens } = metadata

export function getCoingeckoId (tokenSymbol: string) {
  return tokens[tokenSymbol]?.coingeckoId
}
