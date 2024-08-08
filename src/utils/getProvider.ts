import { getChain } from '@hop-protocol/sdk'
import { providers } from 'ethers'

let rpcUrls: any = {}

export function setRpcUrls (newRpcUrls: any) {
  rpcUrls = newRpcUrls
}

export function getProvider (chainSlug: string) {
  let rpcUrl = rpcUrls[chainSlug]
  if (!rpcUrl) {
    const chain = getChain(chainSlug)
    if (!chain) {
      throw new Error(`Chain not found for chainSlug: ${chainSlug}`)
    }
    rpcUrl = chain.publicRpcUrl
  }

  return new providers.JsonRpcProvider({ allowGzip: true, url: rpcUrl })
}
