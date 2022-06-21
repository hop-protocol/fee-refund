import { FeeRefund } from '../src/index'
import { chainSlugs } from '../src/constants'
import {
  RpcUrls
} from '../src/interfaces'
require('dotenv').config()
const path = require('path')

describe('Fee Refund', () => {
  const seedDbDir = path.resolve(__dirname, '../dbs/seedDb')
  const dbDir = seedDbDir
  const rpcUrls: RpcUrls = {
    mainnet: process.env.MAINNET_RPC_URL!,
    polygon: process.env.POLYGON_RPC_URL!,
    gnosis: process.env.GNOSIS_RPC_URL!,
    arbitrum: process.env.ARBITRUM_RPC_URL!,
    optimism: process.env.OPTIMISM_RPC_URL!
  }
  const startTimestamp = 1655853888
  const refundPercentage = 0.8
  const refundChain = chainSlugs.optimism
  const feeRefund = new FeeRefund(
    dbDir,
    rpcUrls,
    startTimestamp,
    refundPercentage,
    refundChain
  )

  test('Seed OP Data', async () => {
    await feeRefund.seed()
    expect(true)
  })

  test('Calculate Op rewards', async () => {
    const refunds = await feeRefund.calculateFees()
    expect(typeof refunds).toBe('object')
  })
})
