require('dotenv').config()

export const PAGE_SIZE = 1000
export const ONE_DAY_SEC = 24 * 60 * 60

export const chainSlugs: {[key: string]: string} = {
  mainnet: 'mainnet',
  arbitrum: 'arbitrum',
  optimism: 'optimism',
  polygon: 'polygon',
  gnosis: 'gnosis'
}

export const nativeTokens: {[key: string]: string} = {
  mainnet: 'ETH',
  arbitrum: 'ETH',
  optimism: 'ETH',
  polygon: 'MATIC',
  gnosis: 'DAI'
}

export const tokenSymbols: {[key: string]: string} = {
  ethereum: 'ETH',
  matic: 'MATIC',
  dai: 'DAI',
  optimism: 'OP'
}

export const tokenDecimals: {[key: string]: number} = {
  ETH: 18,
  USDC: 6,
  USDT: 6,
  DAI: 18,
  MATIC: 18,
  WBTC: 8,
  FRAX: 18,
  OP: 18
}

// the number value is the timestamp to start excluding from,
// in order to not exclude existing data from before when the mapping address was added.
// make sure to key address keys lowercased here.
export const aggregatorAddresses: Record<string, number> = {
  '0xc30141b657f4216252dc59af2e7cdb9d8792e1b0': 1641024000, // socket registry
  '0x362fa9d0bca5d19f743db50738345ce2b40ec99f': 1641024000, // lifi
  '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae': 1680048000, // lifi
  '0x82e0b8cdd80af5930c4452c684e71c861148ec8a': 1680048000, // metamask
  '0xf26055894aeaae23d136defaa355a041a43d7dfd': 1680048000, // chainhop
  '0xf762c3fc745948ff49a3da00ccdc6b755e44305e': 1680048000, // chainhop
  '0xf80dd9cef747710b0bb6a113405eb6bc394ce050': 1680048000, // chainhop
  '0x696c91cdc3e79a74785c2cdd07ccc1bf0bc7b788': 1680048000 // chainhop
}

export const subgraphs: Record<string, string> = {
  hopBridge: 'hopBridge',
  merkleRewards: 'merkleRewards'
}
