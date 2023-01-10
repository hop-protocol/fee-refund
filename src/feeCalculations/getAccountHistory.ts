import Level from 'level-ts'
import { getRefundAmount } from './calculateFinalAmounts'

export async function getAccountHistory (db: Level, account: string, refundTokenSymbol: string, refundPercentage: number, maxRefundAmount: number) {
  const address = account.toLowerCase()
  const entry = await db.get(`address::${address}`)

  const promises = entry?.transfers?.map(async (item: any) => {
    const transfer = {
      gasUsed: item.gasUsed,
      gasPrice: item.gasPrice,
      hash: item.hash,
      timestamp: item.timestamp,
      amount: item.amount,
      token: item.token,
      bonderFee: item.bonderFee,
      chain: item.chain
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
