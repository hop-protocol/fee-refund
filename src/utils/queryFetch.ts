import fetch, { Response } from 'node-fetch'
import wait from './wait'

async function queryFetch (url: string, query: any, variables?: any) {
  const getRes = () => fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      query,
      variables: variables || {}
    })
  })

  let res: Response | undefined
  while (!res || res.status === 504) {
    res = await getRes()

    if (res.status === 504) {
      console.log('backing off...')
      await wait(1e3)
    }
  }

  const jsonRes: any = await res.json()

  if (jsonRes?.errors) {
    throw new Error(`Erroneous TheGraph response: ${JSON.stringify(jsonRes.errors)}`)
  }
  return jsonRes.data
}

export default queryFetch
