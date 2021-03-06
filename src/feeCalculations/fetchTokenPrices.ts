import Level from 'level-ts'
import fetch from 'node-fetch'
import toSeconds from '../utils/toSeconds'

const coinIds: { [key: string]: string } = {
  USDC: 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
  ETH: 'ethereum',
  MATIC: 'matic-network',
  WBTC: 'wrapped-bitcoin',
  OP: 'optimism'
}

const oneDay = 86400

const fetchAllTokenPrices = async (db: Level) => {
  const tokens = Object.keys(coinIds)
  await Promise.all(tokens.map(async (token) => {
    const res = await fetchTokenPrices(token)

    for (const data of res) {
      const timestamp = toSeconds(data[0])
      const price = data[1]

      const key = getKey(token, timestamp)
      await db.put(key, { timestamp, price })
    }
  }))
}

const fetchTokenPrices = async (tokenSymbol: string) => {
  const coinId = coinIds[tokenSymbol]
  const days = 365
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`

  const prices = await fetch(url)
    .then(res => res.json())
    .then(res => res.prices)

  return prices
}

export const getTokenPrice = async (db: Level, tokenSymbol: string, timestamp: number): Promise<number> => {
  const lowerBoundTimestamp = timestamp - oneDay
  const upperBoundTimestamp = timestamp + oneDay

  const lowerBoundKey = getKey(tokenSymbol, lowerBoundTimestamp)
  const upperBoundKey = getKey(tokenSymbol, upperBoundTimestamp)

  const results = await db.stream({
    gte: lowerBoundKey,
    lte: upperBoundKey
  })

  let lowestDiff: number = Number.MAX_SAFE_INTEGER
  let price
  for (const i in results) {
    const res = results[i].value

    const diff = Math.abs(res.timestamp - timestamp)
    if (diff < lowestDiff) {
      lowestDiff = diff
      price = res.price
    }
  }

  return price
}

const getKey = (tokenSymbol: string, timestamp: number) => {
  return `price::${tokenSymbol}::${timestamp}`
}

export default fetchAllTokenPrices
