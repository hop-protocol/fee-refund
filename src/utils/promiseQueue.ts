import PQueue_ from 'p-queue'

const PQueue = (PQueue_ as any).default || PQueue_

export type Options = {
  concurrency: number
}

export async function promiseQueue (items: any[], cb: any, options: Options) {
  const { concurrency } = options
  const queue = new PQueue({ concurrency })
  for (let i = 0; i < items.length; i++) {
    queue.add(async () => await cb(items[i], i))
  }
  await queue.onEmpty()
  await queue.onIdle()
}
