import { TokenSymbol, getTokens } from '@hop-protocol/sdk'

export function getTokenDecimals (tokenSymbol: string) {
  return getTokens(tokenSymbol as TokenSymbol).decimals
}
