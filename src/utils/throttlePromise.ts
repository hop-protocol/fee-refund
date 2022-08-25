import pThrottle from 'p-throttle'

const throttle = pThrottle({
  limit: 1,
  interval: 2 * 1000
})

export const throttlePromise = throttle
