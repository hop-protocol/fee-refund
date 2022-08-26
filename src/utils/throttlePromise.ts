import pThrottle from 'p-throttle'

const throttle = pThrottle({
  limit: 10,
  interval: 60 * 1000
})

export const throttlePromise = throttle
