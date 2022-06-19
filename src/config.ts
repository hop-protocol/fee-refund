require('dotenv').config()

export const startTimestamp = 1655630195

export const rpcUrls: Record<string, string> = {
  mainnet: process.env.MAINNET_RPC_URL!,
  polygon: process.env.POLYGON_RPC_URL!,
  gnosis: process.env.GNOSIS_RPC_URL!,
  arbitrum: process.env.ARBITRUM_RPC_URL!,
  optimism: process.env.OPTIMISM_RPC_URL!
}
