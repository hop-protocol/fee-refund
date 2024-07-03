import fetch, { Response } from 'node-fetch'
import { wait } from './wait.js'
import { promiseTimeout } from './promiseTimeout.js'

async function queryFetch (url: string, query: any, variables?: any) {
  const timeoutMs = 1 * 60 * 1000
  return promiseTimeout(_queryFetch(url, query, variables), timeoutMs)
}

export async function _queryFetch (url: string, query: any, variables?: any) {
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
  while (!res || (res?.status === 504 || res?.status === 502)) {
    // console.log('queryFetch:', res?.status, url)
    res = await getRes()

    if (res.status === 504 || res.status === 502) {
      console.log('backing off...')
      await wait(1e3)
    }
  }
  const text = await res.text()
  let jsonRes: any
  try {
    jsonRes = JSON.parse(text)
  } catch (err: any) {
    console.error('queryFetch error:', url, query, variables, text)
    throw new Error(`Failed to parse JSON response: ${err.message}`)
  }

  if (jsonRes?.errors) {
    console.error('queryFetch error:', url, query, variables)
    throw new Error(`Erroneous TheGraph response: ${JSON.stringify(jsonRes.errors)}`)
  }
  return jsonRes.data
}

export default queryFetch
