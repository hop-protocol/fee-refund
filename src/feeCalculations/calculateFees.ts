import Level from 'level-ts'
import calculateFinalAmounts from './calculateFinalAmounts'
import fetchTokenPrices from './fetchTokenPrices'
import { seedDbDir } from '../constants'
import { FinalEntires } from '../interfaces'

async function calculateFees () {
  const db = new Level(seedDbDir)

  console.log('Fetching token prices...')
  await fetchTokenPrices(db)
  console.log(' - Done')

  console.log('Calculating  final amounts...')
  const finalEntries: FinalEntires = await calculateFinalAmounts(db)
  console.log(' - Done')

  console.log('==== Successfully Calculated Fees ====')
  return finalEntries
}

calculateFees()
  .catch(err => console.error(err))
