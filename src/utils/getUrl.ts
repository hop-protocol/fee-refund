import { subgraphs } from '../constants'

function getUrl (chain: string, subgraph: string) {
  if (chain === 'gnosis') {
    chain = 'xdai'
  }

  if (subgraph === subgraphs.hopBridge) {
    return `https://api.thegraph.com/subgraphs/name/hop-protocol/hop-${chain}`
  } else if (subgraph === subgraphs.merkleRewards) {
    return 'https://api.thegraph.com/subgraphs/name/shanefontaine/merkle-rewards'
  } else {
    throw new Error('Unknown subgraph type')
  }
}

export default getUrl
