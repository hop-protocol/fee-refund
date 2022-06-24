import Level from 'level-ts'

async function getLastTimestamp (db: Level, chain: string): Promise<number> {
  const timestampKey = `timestamp::${chain}`
  try {
    const lastTimestamp = await db.get(timestampKey)
    if (lastTimestamp !== '0') {
      return Number(lastTimestamp)
    }
  } catch {
    return 0
  }
}

export default getLastTimestamp
