import { Level } from '../utils/Level.js'
import toSeconds from '../utils/toSeconds.js'
import { retry } from '../utils/retry.js'
import { DateTime } from 'luxon'
import { getCoingeckoId } from '../utils/getCoingeckoId.js'
import { coingeckoApiKey } from '../config/index.js'

const cache :Record<string, any> = {}
const cachedAt :Record<string, number> = {}

export const fetchAllTokenPrices = async (db: typeof Level, network: string, _tokenList: string[], refundTokenSymbol?: string) => {
  const tokenList = new Set(_tokenList)
  if (refundTokenSymbol) {
    tokenList.add(refundTokenSymbol)
  }
  const tokens = Array.from(tokenList)
  for (const token of tokens) {
    try {
      const res: any = await retry(fetchTokenPrices)(token)
      if (!res) {
        throw new Error('fetchAllTokenPrices: no response')
      }

      if (!res?.length) {
        throw new Error('fetchAllTokenPrices: expected array items')
      }

      let hasPriceForToday = false

      for (const data of res) {
        const timestamp = toSeconds(data[0])
        const price = data[1]

        const startUnix = DateTime.fromSeconds(timestamp).toUTC().startOf('day').toSeconds()
        const nowUnix = DateTime.now().toUTC().startOf('day').toSeconds()
        if (startUnix === nowUnix) {
          hasPriceForToday = true
        }
        const key = getKey(token, startUnix)
        // console.log('put price', key, startUnix, price)
        await db.put(key, { timestamp: startUnix, price })
      }

      try {
        if (!hasPriceForToday) {
          const startUnix = DateTime.now().toUTC().startOf('day').toSeconds()
          // console.log('NoTodayPrice:', token, startUnix)

          const yesterdayUnix = DateTime.now().toUTC().startOf('day').minus({ days: 1 }).toSeconds()
          const res = await db.get(getKey(token, yesterdayUnix))
          if (res?.price) {
            // console.log('setting today price as yesterday price until api returns today price')
            const key = getKey(token, startUnix)
            const price = res.price
            await db.put(key, { timestamp: startUnix, price })
          }
        }
      } catch (err) {
      }
    } catch (err) {
      console.error('fetchAllTokenPrices error:', err)
    }
  }
}

const fetchTokenPrices = async (tokenSymbol: string) => {
  const coinId = getCoingeckoId(tokenSymbol)
  const cached = cache[coinId]
  if (cached) {
    const timeLimitMs = 60 * 1000
    const isExpired = cachedAt[coinId] + timeLimitMs < Date.now()
    if (!isExpired) {
      return cached
    }
  }

  const days = 365
  let baseUrl = 'https://api.coingecko.com/api/v3'
  if (coingeckoApiKey) {
    baseUrl = 'https://pro-api.coingecko.com/api/v3'
  }
  const url = `${baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily${coingeckoApiKey ? `&x_cg_pro_api_key=${coingeckoApiKey}` : ''}`

  const res = await fetch(url)
  const json = await res.json()
  const { prices, status } = json
  if (status?.error_message) {
    throw new Error(status.error_message)
  }
  if (!prices) {
    console.error('fetch error:', json)
  }

  if (prices) {
    cache[coinId] = prices
    cachedAt[coinId] = Date.now()
  }

  return prices
}

export const getTokenPrice = async (db: typeof Level, tokenSymbol: string, timestamp: number): Promise<number> => {
  if (!timestamp) {
    throw new Error('getTokenPrice: expected timestamp')
  }

  const dt = DateTime.fromSeconds(timestamp).toUTC().startOf('day')
  const ts = dt.toSeconds()
  let key = getKey(tokenSymbol, ts)
  let price : any
  try {
    const res = await db.get(key)
    if (res) {
      price = res.price
    }
  } catch (err) {
    console.log('getTokenPrice error1:', tokenSymbol, err.message)
  }

  if (!price) {
    let days = 0
    while (!price && days < 15) {
      days++
      try {
        console.log('no price found for key ', key, ', getting price from 1 day ago')
        const ts = dt.minus({ days }).toSeconds()
        key = getKey(tokenSymbol, ts)
        const res = await db.get(key)
        if (res) {
          price = res.price
        }
      } catch (err) {
        console.log(`getTokenPrice error days -${days}:`, tokenSymbol, err.message)
      }
    }
  }

  if (!price) {
    throw new Error(`getTokenPrice: no price found for key ${key}`)
  }

  // to prevent breaking previous merkle rewards roots when verifying,
  // we only truncate decimals after a certain date.
  // the reason for truncating decimals is to keep the price simple
  // and avoid minor discrepancies in price when quering api on different days.
  const truncateAfterTimestamp = 1673049600 // 2023-01-07
  if (timestamp >= truncateAfterTimestamp) {
    price = Number(price.toFixed(2))
  }

  // console.log('price:', tokenSymbol, price, timestamp)

  return price
}

function getKey (tokenSymbol: string, timestamp: number) {
  return `price::${tokenSymbol}::${timestamp}`
}
