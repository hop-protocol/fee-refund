import wait from 'wait'

const rateLimitMaxRetries = 10
const rpcTimeoutSeconds = 300

export function retry<FN extends (...args: any[]) => Promise<any>> (fn: FN): (...args: Parameters<FN>) => Promise<Awaited<ReturnType<FN>>> {
  const id = `${Date.now()}`
  return async (...args: Parameters<FN>): Promise<Awaited<ReturnType<FN>>> => {
    let retries = 0
    const retry = () => promiseTimeout(fn(...args), rpcTimeoutSeconds * 1000) // eslint-disable-line
    while (true) {
      try {
        // the await here is intentional so it's caught in the try/catch below.
        const result = await retry()
        if (retries > 0) {
          console.debug(`rateLimitRetry attempt #${retries} successful`)
        }
        return result
      } catch (err: any) {
        const errMsg = err.message
        const rateLimitErrorRegex = /(rate limit|too many concurrent requests|exceeded|socket hang up)/i
        const timeoutErrorRegex = /(timeout|time-out|time out|timedout|timed out)/i
        const connectionErrorRegex = /(ETIMEDOUT|ENETUNREACH|ECONNRESET|ECONNREFUSED|SERVER_ERROR)/i
        const badResponseErrorRegex = /(bad response|response error|missing response|processing response error)/i
        const revertErrorRegex = /revert/i
        const ethersErrorRegex = /ethjs-query/i
        const nonceTooLow = /(nonce.*too low|same nonce|already been used|NONCE_EXPIRED|OldNonce|invalid transaction nonce)/i
        const estimateGasFailed = /eth_estimateGas/i
        const isAlreadyKnown = /(AlreadyKnown|already known)/i
        const isFeeTooLow = /FeeTooLowToCompete|transaction underpriced/i

        const isRateLimitError = rateLimitErrorRegex.test(errMsg)
        const isTimeoutError = timeoutErrorRegex.test(errMsg)
        const isConnectionError = connectionErrorRegex.test(errMsg)
        const isBadResponseError = badResponseErrorRegex.test(errMsg)
        const isEthersError = ethersErrorRegex.test(errMsg) || nonceTooLow.test(errMsg) || estimateGasFailed.test(errMsg) || isAlreadyKnown.test(errMsg) || isFeeTooLow.test(errMsg)

        // a connection error, such as 'ECONNREFUSED', will cause ethers to return a "missing revert data in call exception" error,
        // so we want to exclude server connection errors from actual contract call revert errors.
        const isRevertError = revertErrorRegex.test(errMsg) && !isConnectionError && !isTimeoutError

        const shouldRetry = (isRateLimitError || isTimeoutError || isConnectionError || isBadResponseError || isEthersError) && !isRevertError

        console.debug(`isRateLimitError: ${isRateLimitError}, isTimeoutError: ${isTimeoutError}, isConnectionError: ${isConnectionError}, isBadResponseError: ${isBadResponseError}, isRevertError: ${isRevertError}, shouldRetry: ${shouldRetry}`)

        // throw error as usual if it's not a rate limit error
        if (!shouldRetry) {
          console.error(errMsg)
          throw err
        }
        retries++
        // if it's a rate limit error, then throw error after max retries attempted.
        if (retries >= rateLimitMaxRetries) {
          console.error(`max retries (${rateLimitMaxRetries}) reached. Error: ${err}`)
          // this must be a regular console log to print original function name
          console.log(fn, id, ...args)
          throw err
        }

        const delayMs = (1 << retries) * 1000
        console.warn(
          `retry attempt #${retries} failed with error "${
            errMsg
          }". retrying again in ${delayMs / 1000} seconds.`
        )
        // this must be a regular console log to print original function name
        console.log(fn, id, ...args)
        // exponential backoff wait
        await wait(delayMs)
      }
    }
  }
}

class TimeoutError extends Error {}

async function promiseTimeout<T> (promise: Promise<T>, timeout: number): Promise<T> {
  return new Promise((resolve, reject) => {
    let timedout = false
    const t = setTimeout(() => {
      timedout = true
      reject(new TimeoutError('timedout'))
    }, timeout)

    // make it a promise if it's not one
    Promise.resolve(promise)
      .then((result: any) => {
        clearTimeout(t)
        if (!timedout) {
          resolve(result)
        }
      })
      .catch((err: any) => {
        clearTimeout(t)
        if (!timedout) {
          reject(err)
        }
      })
  })
}
