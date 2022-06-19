import Level from 'level-ts'
import calculateMerkleTree from './calculateMerkleTree'
import fetchTokenPrices from './fetchTokenPrices'
import { seedDbDir } from '../constants'

async function calculateFees () {
  const db = new Level(seedDbDir)

  console.log('Fetching token prices...')
  await fetchTokenPrices(db)
  console.log(' - Done')

  console.log('Calculating merkle tree...')
  await calculateMerkleTree(db)
  console.log(' - Done')

  console.log('==== Successfully Calculated Fees ====')
}

calculateFees()
  .catch(err => console.error(err))
