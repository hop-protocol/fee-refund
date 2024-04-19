import { Level } from '../utils/Level.js'
import { getRefundAmount } from './calculateFinalAmounts.js'

export async function getAccountHistory (db: typeof Level, account: string, refundTokenSymbol: string, refundPercentage: number, maxRefundAmount: number) {
  const address = account.toLowerCase()
  const entry = await db.get(`address::${address}`)

  const promises = entry?.transfers?.map(async (item: any) => {
    let chain = item.chain
    if (chain === 'ethereum') {
      chain = 'mainnet' // backwards compatibility
    }
    const transfer = {
      gasUsed: item.gasUsed,
      gasPrice: item.gasPrice,
      hash: item.hash,
      timestamp: item.timestamp,
      amount: item.amount,
      token: item.token,
      bonderFee: item.bonderFee,
      chain: chain
    }
    const refundAmount = await getRefundAmount(db, transfer, refundTokenSymbol, refundPercentage, maxRefundAmount)

    return {
      ...transfer,
      refund: {
        totalCostInUsd: refundAmount.totalUsdCost,
        refundTokenPrice: refundAmount.price,
        refundAmountInToken: refundAmount.refundAmountAfterDiscount,
        refundAmountInUsd: refundAmount.refundAmountAfterDiscountUsd,
        refundTokenSymbol: refundAmount.refundTokenSymbol
      }
    }
  })

  return Promise.all(promises)
}
