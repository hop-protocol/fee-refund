import { Level } from './Level'

async function getLastTimestamp (db: typeof Level, chain: string): Promise<number> {
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
