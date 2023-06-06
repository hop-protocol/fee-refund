import { subgraphs } from '../constants'

function getUrl (network: string, chain: string, subgraph: string) {
  if (chain === 'gnosis') {
    chain = 'xdai'
  }
  if (chain === 'ethereum') {
    chain = 'mainnet'
  }

  if (subgraph === subgraphs.hopBridge) {
    if (network === 'goerli') {
      if (chain === 'mainnet') {
        chain = 'goerli'
      }
      if (chain === 'polygon') {
        chain = 'mumbai'
      }
      if (chain === 'optimism') {
        chain = 'optimism-goerli'
      }
      if (chain === 'arbitrum') {
        throw new Error(`chain "${chain}" is not supported on goerli subgraphs`)
      }
      if (chain === 'xdai') {
        throw new Error(`chain "${chain}" is not supported on goerli subgraphs`)
      }
    }
    return `https://api.thegraph.com/subgraphs/name/hop-protocol/hop-${chain}`
  } else {
    throw new Error('Unknown subgraph type')
  }
}

export default getUrl
