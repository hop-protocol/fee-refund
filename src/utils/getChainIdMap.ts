import { mainnet as mainnetAddresses, goerli as goerliAddresses } from '@hop-protocol/core/networks'

const networks = {
  mainnet: mainnetAddresses,
  goerli: goerliAddresses
}

export function getChainIdMap (network: string) {
  const map = {}
  for (const chain in networks[network]) {
    map[chain] = networks[network][chain].networkId
  }
  return map
}
