import path from 'path'

export const seedDbDir = path.resolve(__dirname, '../dbs/seedDb')

export const PAGE_SIZE = 1000

export const chains: string[] = [
  'mainnet',
  'arbitrum',
  'optimism',
  'polygon',
  'gnosis'
]

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

export const tokens: string[] = [
  'ETH',
  'MATIC',
  'USDC',
  'USDT',
  'DAI'
]

export const chainIds: Record<string, number> = {
  optimism: 10
}

export const aggregatorAddresses: Record<string, boolean> = {
  '0xc30141b657f4216252dc59af2e7cdb9d8792e1b0': true, // socket registry
  '0x362fa9d0bca5d19f743db50738345ce2b40ec99f': true // li fi
}
