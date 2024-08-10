import { TokenSymbol, getToken } from '@hop-protocol/sdk'

export function getTokenDecimals (tokenSymbol: string): number {
  return getToken(tokenSymbol as TokenSymbol).decimals
}
