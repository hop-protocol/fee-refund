import { networks } from '@hop-protocol/sdk-core'

const { mainnet: mainnetAddresses, goerli: goerliAddresses } = networks

const nets = {
  mainnet: mainnetAddresses,
  goerli: goerliAddresses
}

export function getChainIdMap (network: string) {
  const map = {}
  for (const chain in nets[network]) {
    map[chain] = nets[network][chain].networkId
  }
  return map
}
