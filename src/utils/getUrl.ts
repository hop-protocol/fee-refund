function getUrl (chain: string) {
  if (chain === 'gnosis') {
    chain = 'xdai'
  }

  return `https://api.thegraph.com/subgraphs/name/hop-protocol/hop-${chain}`
}

export default getUrl
