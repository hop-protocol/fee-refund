import { BigNumber } from 'ethers'
import { FeeRefund } from '../src/feeRefund'
import { chainSlugs } from '../src/constants'
import {
  RpcUrls
} from '../src/types/interfaces'
require('dotenv').config()
const path = require('path')

describe('Fee Refund', () => {
  const seedDbDir = path.resolve(__dirname, '../test-db')
  const dbDir = seedDbDir
  console.log('db', dbDir)
  const rpcUrls: RpcUrls = {
    mainnet: process.env.MAINNET_RPC_URL!,
    polygon: process.env.POLYGON_RPC_URL!,
    gnosis: process.env.GNOSIS_RPC_URL!,
    arbitrum: process.env.ARBITRUM_RPC_URL!,
    optimism: process.env.OPTIMISM_RPC_URL!
  }
  const merkleRewardsContractAddress = '0x45269F59aA76bB491D0Fc4c26F468D8E1EE26b73' // optimism
  // const merkleRewardsContractAddress = '0x9dC2d609487Be9F1dDc54b0C242847114f337501' // goerli
  const startTimestamp = 1663898400 // Math.floor(Date.now() / 1000) - (24 * 60 * 60)
  const endTimestamp = 1664478474 // startTimestamp + (60 * 60 * 24)
  console.log('startTimestamp:', startTimestamp)
  console.log('endTimestamp:', endTimestamp)
  const refundPercentage = 0.8
  const refundChain = chainSlugs.optimism
  const refundTokenSymbol = process.env.REFUND_TOKEN_SYMBOL
  const feeRefund = new FeeRefund({
    dbDir,
    rpcUrls,
    merkleRewardsContractAddress,
    startTimestamp,
    endTimestamp,
    refundPercentage,
    refundChain,
    refundTokenSymbol,
    maxRefundAmount: 20
  })

  test('Seed OP Data', async () => {
    await feeRefund.seed()
    expect(true)
  })

  test('Calculate Op rewards', async () => {
    const endTimestamp = 1664478474 // Math.floor(Date.now() / 1000)
    const refunds = await feeRefund.calculateFees(endTimestamp)
    console.log(refunds)
    expect(typeof refunds).toBe('object')

    let sum = BigNumber.from(0)
    for (const addr in refunds) {
      sum = sum.add(BigNumber.from(refunds[addr]))
    }

    console.log('sum:', sum.toString())
    expect(sum.toString()).toBe('4800952393681655324338')
  })

  test('fee refund amount', async () => {
    const transfer = {
      gasUsed: '144561',
      gasPrice: '9408027411',
      amount: '1000000000000000',
      token: 'ETH',
      bonderFee: '0',
      chain: 'mainnet',
      timestamp: 1662611436,
      hash: ''
    }

    const refund = await feeRefund.getRefundAmount(transfer)
    console.log(refund)
    expect(typeof refund).toBe('object')
    expect(refund.totalUsdCost).toBe(2.216696366845233)
  })

  test('getTokenPrice', async () => {
    const token = 'ETH'
    const timestamp = 1664478474
    const tokenPrice = await feeRefund.getTokenPrice(token, timestamp)
    console.log(tokenPrice)
    expect(typeof tokenPrice).toBe('number')
    expect(tokenPrice).toBeGreaterThan(0)
  })
})
