import Level from 'level-ts'
import { BigNumber, utils } from 'ethers'
import { DbEntry } from '../interfaces'
import { getTokenPrice } from './fetchTokenPrices'
const { ShardedMerkleTree } = require('../merkle')
import { nativeTokens, tokenDecimals } from '../constants'

const { formatUnits, parseUnits } = utils


async function main (db: Level) {
  const merkleEntries: Record<string, BigNumber> = {}

  const iterator = db.iterate({ all: 'address::', keys: true })
  for await (const { key, value } of iterator) {
    const address = key.slice(9)
    const transfers: DbEntry[] = value
    for (const transfer of transfers) {
      if (transfer.isAggregator) continue

      // USD value
      const totalUsdCost = await getUsdCost(db, transfer)

      // OP value
      const symbol = 'OP'
      const price = await getTokenPrice(db, symbol, Number(transfer.timestamp))
      const refundAmount = totalUsdCost / price

      const decimals = tokenDecimals[symbol]
      const discount = 0.8
      const refundAmountAfterDiscount = refundAmount * discount
      const refundAmountAfterDiscountWei = parseUnits(refundAmountAfterDiscount.toString(), decimals)

      if (!merkleEntries[address]) {
        merkleEntries[address] = BigNumber.from('0')
      }
      merkleEntries[address] = merkleEntries[address].add(refundAmountAfterDiscountWei)
    }
  }

  makeTree(merkleEntries)
}

async function getUsdCost(db: Level, transfer: DbEntry): Promise<number> {
  // Source tx fee
  const gasUsed = BigNumber.from(transfer.gasUsed!)
  const gasPrice = BigNumber.from(transfer.gasPrice!)
  const txCost = gasUsed.mul(gasPrice)
  const nativeTokenSymbol = nativeTokens[transfer.chain]
  const nativeTokenDecimals = 18
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
  const bonderFeeTokenDecimals = tokenDecimals[transfer.token]
  const bonderFeeUsd = await getFeeInUsd(
    db,
    bonderFee,
    bonderFeeSymbol,
    bonderFeeTokenDecimals,
    transfer.timestamp
  )

  // AMM fee
  const swapFeeBps = '4'
  const ammFee = BigNumber.from(transfer.amount).mul(swapFeeBps).div('10000')
  const ammFeeSymbol = transfer.token
  const ammFeeTokenDecimals = tokenDecimals[transfer.token]
  const ammFeeUsd = await getFeeInUsd(
    db,
    ammFee,
    ammFeeSymbol,
    ammFeeTokenDecimals,
    transfer.timestamp
  )

  return sourceTxCostUsd + bonderFeeUsd + ammFeeUsd
}

async function getFeeInUsd (
  db: Level,
  costInAsset: BigNumber,
  symbol: string,
  decimals: number,
  timestamp: string
): Promise<number> {
  const price = await getTokenPrice(db, symbol, Number(timestamp))
  const formattedCost = formatUnits(costInAsset, decimals)
  return parseFloat(formattedCost) * price
}

function makeTree (merkleEntries: Record<string, BigNumber>) {
  let entries: any[] = []

  for (const address in merkleEntries) {
    const amount = merkleEntries[address].toString()
    const entry = [address, { balance: amount }]
    entries.push(entry)
  }

  const shardNybbles = 2
  ShardedMerkleTree.build(entries, shardNybbles, `tree/`)
}

export default main
