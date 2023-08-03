export const promiseQueueConcurrency = Number(process.env.PROMISE_QUEUE_CONCURRENCY || 1000)
export const config = {
  useApiForOnChainData: false
}

// NOTE: there's no need to update this list anymore because we're using hop contracts
// as whitelist instead of using an aggregator blacklist. This is kept for backwards compatibility.
//
// The number value is the timestamp to start excluding from,
// in order to not exclude existing data from before when the mapping address was added.
// make sure address keys are lowercased here because of map lookups.
export const aggregatorAddresses: Record<string, number> = {
  '0xc30141b657f4216252dc59af2e7cdb9d8792e1b0': 1641024000, // socket registry
  '0x8b14984de0ddd2e080d8679febe2f5c94b975af8': 1684627200, // socket registry
  '0xc9b6f5eeabb099bbbfb130b78249e81f70efc946': 1684627200, // socket registry
  '0x3a23f943181408eac424116af7b7790c94cb97a5': 1691107200, // socket gateway
  '0x362fa9d0bca5d19f743db50738345ce2b40ec99f': 1641024000, // lifi
  '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae': 1680048000, // lifi
  '0x82e0b8cdd80af5930c4452c684e71c861148ec8a': 1680048000, // metamask
  '0xf26055894aeaae23d136defaa355a041a43d7dfd': 1680048000, // chainhop
  '0xf762c3fc745948ff49a3da00ccdc6b755e44305e': 1680048000, // chainhop
  '0xf80dd9cef747710b0bb6a113405eb6bc394ce050': 1680048000, // chainhop
  '0x696c91cdc3e79a74785c2cdd07ccc1bf0bc7b788': 1680048000, // chainhop
  '0x777777773491ff5cef6bb758f3baa9d70886909c': 1684627200 // via protocol
}
