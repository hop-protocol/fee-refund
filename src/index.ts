import { getNetwork } from '@hop-protocol/sdk'
import { goerli as goerliAddresses, mainnet as mainnetAddresses } from '@hop-protocol/sdk/addresses'

export * from './feeRefund.js'

export const networks = {
  mainnet: mainnetAddresses,
  goerli: goerliAddresses
}

export const addresses = {
  goerli: goerliAddresses,
  mainnet: mainnetAddresses
}

export { getNetwork }
