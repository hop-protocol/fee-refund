import { Level } from '../utils/Level.js'
import { BigNumber, utils } from 'ethers'
import { DbEntry, FinalEntries, Transfer } from '../types/interfaces.js'
import { getTokenPrice } from './fetchTokenPrices.js'
import { getTokenDecimals } from '../utils/getTokenDecimals.js'
import { getNativeTokenSymbol } from '../utils/getNativeTokenSymbol.js'

const { formatUnits, parseUnits } = utils

export async function calculateFinalAmounts (
  db: typeof Level,
  refundPercentage: number,
  refundTokenSymbol: string,
  startTimestamp: number,
  endTimestamp: number,
  maxRefundAmount: number
): Promise<FinalEntries> {
  const finalEntries: FinalEntries = {}
  const iterator = db.iterate({ all: 'address::', keys: true })
  let count = 0
  const promises : any[] = []
  for await (const { key, value } of iterator) {
    promises.push(new Promise(async (resolve, reject) => {
      try {
        const dbEntry: DbEntry = value
        const address = dbEntry.address
        // console.log(`processing dbEntry ${address}`)
        const transfers: Transfer[] = dbEntry.transfers

        let amount: BigNumber = BigNumber.from(0)
        for (const transfer of transfers) {
          if (!transfer) {
            throw new Error('calculateFinalAmounts: expected transfer')
          }
          if (
            transfer.isAggregator ||
            transfer.timestamp > endTimestamp ||
            transfer.timestamp < startTimestamp
          ) {
            // console.log(transfer.chain, transfer.hash, transfer.timestamp, endTimestamp)
            resolve(null)
            continue
          }

          const { refundAmountAfterDiscountWei } = await getRefundAmount(db, transfer, refundTokenSymbol, refundPercentage, maxRefundAmount)

          amount = amount.add(refundAmountAfterDiscountWei)
          // console.log(`done processing dbEntry ${address}`)
          count++
        }

        if (amount.toString() !== '0') {
          amount = amount.sub(value.amountClaimed ?? 0)
          finalEntries[address] = amount.toString()
        }

        resolve(null)
      } catch (err) {
        console.error(`calculateFinalAmounts: error processing dbEntry ${key}: ${err.message}`)
        reject(err)
      }
    }))
  }

  await Promise.all(promises)

  console.log(`calculateFinalAmounts count: ${count}, endTimestamp: ${endTimestamp}`)

  return finalEntries
}

export async function getRefundAmount (db: typeof Level, transfer: Transfer, refundTokenSymbol: string, refundPercentage: number, maxRefundAmount: number): Promise<any> {
  // Calculate total amount
  const {
    sourceTxCostUsd,
    bonderFeeUsd,
    ammFeeUsd,
    totalUsdCost
  } = await getUsdCost(db, transfer)
  const price = await getTokenPrice(db, refundTokenSymbol, transfer.timestamp)
  const refundAmount = totalUsdCost / price

  // Apply refund discount
  const decimals = getTokenDecimals(refundTokenSymbol)
  let refundAmountAfterDiscount = Math.min(refundAmount * refundPercentage, maxRefundAmount)
  let refundAmountAfterDiscountWei = parseUnits(refundAmountAfterDiscount.toFixed(decimals), decimals)
  let refundAmountAfterDiscountUsd = refundAmountAfterDiscount * price

  // to prevent breaking previous merkle rewards roots when verifying,
  // we only truncate decimals after a certain date.
  // the reason for truncating decimals is to keep the price simple
  // and avoid minor discrepancies when rounding.
  const truncateAfterTimestamp = 1673049600 // 2023-01-07
  if (transfer.timestamp >= truncateAfterTimestamp) {
    refundAmountAfterDiscount = Number(Math.min(refundAmount * refundPercentage, maxRefundAmount).toFixed(2))
    refundAmountAfterDiscountWei = parseUnits(refundAmountAfterDiscount.toString(), decimals)
    refundAmountAfterDiscountUsd = Number((refundAmountAfterDiscount * price).toFixed(2))
  }

  return {
    totalUsdCost,
    price,
    refundAmount,
    refundAmountAfterDiscount,
    refundAmountAfterDiscountUsd,
    refundAmountAfterDiscountWei,
    refundTokenSymbol,
    sourceTxCostUsd,
    bonderFeeUsd,
    ammFeeUsd
  }
}

async function getUsdCost (db: typeof Level, transfer: Transfer): Promise<any> {
  if (!transfer) {
    throw new Error('gasUsdCost: expected transfer')
  }
  // Source tx fee
  let txCost = BigNumber.from(0)
  if (transfer.gasCost) {
    txCost = BigNumber.from(transfer.gasCost)
  } else {
    if (!transfer.gasUsed) {
      console.log(transfer)
      throw new Error('gasUsdCost: expected gasUsed')
    }
    if (!transfer.gasPrice) {
      console.log(transfer)
      throw new Error('gasUsdCost: expected gasPrice')
    }
    const gasUsed = BigNumber.from(transfer.gasUsed!)
    const gasPrice = BigNumber.from(transfer.gasPrice!)
    txCost = gasUsed.mul(gasPrice)
  }
  let chain = transfer.chain
  if (chain === 'mainnet') {
    chain = 'ethereum'
  }
  let nativeTokenSymbol = getNativeTokenSymbol(chain)
  if (nativeTokenSymbol === 'XDAI') {
    nativeTokenSymbol = 'DAI' // backwards compatibility
  }
  const nativeTokenDecimals = getTokenDecimals(nativeTokenSymbol)
  const sourceTxCostUsd = await getFeeInUsd(
    db,
    txCost,
    nativeTokenSymbol,
    nativeTokenDecimals,
    transfer.timestamp
  )

  // Bonder fee
  const bonderFee = BigNumber.from(transfer.bonderFee)
  const bonderFeeSymbol = transfer.token
  const bonderFeeTokenDecimals = getTokenDecimals(transfer.token)
  const bonderFeeUsd = await getFeeInUsd(
    db,
    bonderFee,
    bonderFeeSymbol,
    bonderFeeTokenDecimals,
    transfer.timestamp
  )

  // AMM fee
  let ammFeeUsd = 0
  const isSwap = transfer?.deadline > 0 || BigNumber.from(transfer?.amountOutMin ?? 0).gt(0)
  if (isSwap) {
    const swapFeeBps = '4'
    const ammFee = BigNumber.from(transfer.amount).mul(swapFeeBps).div('10000')
    const ammFeeSymbol = transfer.token
    const ammFeeTokenDecimals = getTokenDecimals(transfer.token)
    ammFeeUsd = await getFeeInUsd(
      db,
      ammFee,
      ammFeeSymbol,
      ammFeeTokenDecimals,
      transfer.timestamp
    )
  }

  const totalUsdCost = sourceTxCostUsd + bonderFeeUsd + ammFeeUsd

  return {
    sourceTxCostUsd,
    bonderFeeUsd,
    ammFeeUsd,
    totalUsdCost
  }
}

async function getFeeInUsd (
  db: typeof Level,
  costInAsset: BigNumber,
  symbol: string,
  decimals: number,
  timestamp: number
): Promise<number> {
  const price = await getTokenPrice(db, symbol, timestamp)
  const formattedCost = formatUnits(costInAsset, decimals)
  let result = Number(formattedCost) * price

  // to prevent breaking previous merkle rewards roots when verifying,
  // we only truncate decimals after a certain date.
  // the reason for truncating decimals is to keep the price simple
  // and avoid minor discrepancies when rounding.
  const truncateAfterTimestamp = 1673049600 // 2023-01-07
  if (timestamp >= truncateAfterTimestamp) {
    result = Number(result.toFixed(2))
  }

  return result
}
