import Level from 'level-ts'
import fs from 'fs'
import fse from 'fs-extra'
import fetchExistingClaims from './fetchExistingClaims'
import fetchHopTransfers from './fetchHopTransfers'
import fetchOnChainData from './fetchOnChainData'
import { seedDbDir } from '../constants'

async function seed () {
  await fse.remove(seedDbDir)
  fs.mkdirSync(seedDbDir)

  const db = new Level(seedDbDir)

  console.log('Fetching Hop transfers...')
  await fetchHopTransfers(db)
  console.log(' - Done')

  console.log('Fetching on-chain data...')
  await fetchOnChainData(db)
  console.log(' - Done')

  console.log('Fetching existing claims...')
  await fetchExistingClaims(db)
  console.log(' - Done')

  console.log('==== Successfully Seeded Db ====')
}

seed()
  .catch(err => console.error(err))
