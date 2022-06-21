import {
  chainIds,
  chainSlugs,
  tokenSymbols
} from './constants'

export const startTimestamp = 1655761679
export const refundPercentage = 0.8
export const refundChain = chainSlugs.optimism
export const refundTokenSymbol = tokenSymbols[refundChain]
export const refundChainId = chainIds[refundChain]
