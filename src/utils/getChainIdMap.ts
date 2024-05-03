import { goerli as goerliAddresses, mainnet as mainnetAddresses } from '@hop-protocol/sdk/addresses'

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
