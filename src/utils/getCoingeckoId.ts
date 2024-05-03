import { type TokenSymbol, getToken } from '@hop-protocol/sdk'

export function getCoingeckoId (tokenSymbol: string) {
  return getToken(tokenSymbol as TokenSymbol).coingeckoId
}
