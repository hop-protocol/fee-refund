export * from './feeRefund.js'

import { goerli as goerliAddresses, mainnet as mainnetAddresses } from '@hop-protocol/sdk/addresses'

export const networks = {
  mainnet: mainnetAddresses,
  goerli: goerliAddresses
}

export const addresses = {
  goerli: goerliAddresses,
  mainnet: mainnetAddresses
}
