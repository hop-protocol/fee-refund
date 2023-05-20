import { hopContracts } from '../constants'

export function isHopContract (address: string): boolean {
  address = address.toLowerCase()
  for (const token in hopContracts) {
    for (const addr in hopContracts[token]) {
      if (address === addr) {
        return true
      }
    }
  }
  return false
}
