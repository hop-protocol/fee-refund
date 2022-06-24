import Level from 'level-ts'

async function getLastTimestamp (db: Level, chain: string): Promise<number> {
  const timestampKey = `timestamp::${chain}`
  try {
    const lastTimestamp = Number(await db.get(timestampKey))
    if (lastTimestamp) {
      return lastTimestamp
    }
  } catch {
    return 0
  }
}

export default getLastTimestamp
