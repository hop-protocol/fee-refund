import { metadata } from '@hop-protocol/sdk-core'

const { tokens } = metadata

export function getTokenDecimals (tokenSymbol: string) {
  const decimals = tokens[tokenSymbol]?.decimals
  if (!decimals) {
    throw new Error(`decimals not found for token "${tokenSymbol}"`)
  }

  return decimals
}
