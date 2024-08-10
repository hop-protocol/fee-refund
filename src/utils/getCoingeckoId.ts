import { type TokenSymbol, getToken } from '@hop-protocol/sdk'

export function getCoingeckoId (tokenSymbol: string): string {
  return getToken(tokenSymbol as TokenSymbol).coingeckoId
}
