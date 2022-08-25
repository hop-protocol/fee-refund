import { FeeRefund } from '../src/index'
import { chainSlugs } from '../src/constants'
import {
  RpcUrls
} from '../src/interfaces'
require('dotenv').config()
const path = require('path')

describe('Fee Refund', () => {
  const seedDbDir = path.resolve(__dirname, '../dbs')
  const dbDir = seedDbDir
  console.log('db', dbDir)
  const rpcUrls: RpcUrls = {
    mainnet: process.env.MAINNET_RPC_URL!,
    polygon: process.env.POLYGON_RPC_URL!,
    gnosis: process.env.GNOSIS_RPC_URL!,
    arbitrum: process.env.ARBITRUM_RPC_URL!,
    optimism: process.env.OPTIMISM_RPC_URL!
  }
  const merkleRewardsContractAddress = '0xa0B798BcAf87E033e2E6b6C1fd073203F314475a'
  const startTimestamp = Math.floor(Date.now() / 1000)
  const refundPercentage = 0.8
  const refundChain = chainSlugs.optimism
  const feeRefund = new FeeRefund({
    dbDir,
    rpcUrls,
    merkleRewardsContractAddress,
    startTimestamp,
    refundPercentage,
    refundChain
  })

  test('Seed OP Data', async () => {
    await feeRefund.seed()
    expect(true)
  })

  test('Calculate Op rewards', async () => {
    const endTimestamp = 1656113602
    const refunds = await feeRefund.calculateFees(endTimestamp)
    expect(typeof refunds).toBe('object')
  })
})
