import { mainnet as mainnetAddresses, goerli as goerliAddresses } from '@hop-protocol/core/addresses'

function getHopContracts (addresses: any) {
  const keys = new Set(['l1Bridge', 'l1MessengerWrapper', 'l2Bridge', 'l2AmmWrapper'])
  const set = new Set([])
  for (const tokenSymbol in addresses) {
    for (const chain in addresses[tokenSymbol]) {
      for (const contract in addresses[tokenSymbol][chain]) {
        if (keys.has(contract)) {
          set.add(addresses[tokenSymbol][chain][contract]?.toLowerCase())
        }
      }
    }
  }
  return set
}

const hopContracts :any = {
  mainnet: getHopContracts(mainnetAddresses.bridges),
  goerli: getHopContracts(goerliAddresses.bridges)
}

export function isHopContract (network: string, address: string): boolean {
  address = address.toLowerCase()

  return hopContracts[network].has(address)
}
