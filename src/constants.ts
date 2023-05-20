require('dotenv').config()

export const PAGE_SIZE = 1000
export const ONE_DAY_SEC = 24 * 60 * 60

export const chainSlugs: {[key: string]: string} = {
  mainnet: 'mainnet',
  arbitrum: 'arbitrum',
  optimism: 'optimism',
  polygon: 'polygon',
  gnosis: 'gnosis'
}

export const nativeTokens: {[key: string]: string} = {
  mainnet: 'ETH',
  arbitrum: 'ETH',
  optimism: 'ETH',
  polygon: 'MATIC',
  gnosis: 'DAI'
}

export const tokenSymbols: {[key: string]: string} = {
  ethereum: 'ETH',
  matic: 'MATIC',
  dai: 'DAI',
  optimism: 'OP'
}

export const tokenDecimals: {[key: string]: number} = {
  ETH: 18,
  USDC: 6,
  USDT: 6,
  DAI: 18,
  MATIC: 18,
  WBTC: 8,
  FRAX: 18,
  OP: 18
}

// the number value is the timestamp to start excluding from,
// in order to not exclude existing data from before when the mapping address was added.
// make sure to address keys are lowercased here.
export const aggregatorAddresses: Record<string, number> = {
  '0xc30141b657f4216252dc59af2e7cdb9d8792e1b0': 1641024000, // socket registry
  '0x8b14984de0ddd2e080d8679febe2f5c94b975af8': 1684627200, // socket registry
  '0xc9b6f5eeabb099bbbfb130b78249e81f70efc946': 1684627200, // socket registry
  '0x3a23F943181408EAC424116Af7b7790c94Cb97a5': 1684627200, // socket gateway
  '0x362fa9d0bca5d19f743db50738345ce2b40ec99f': 1641024000, // lifi
  '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae': 1680048000, // lifi
  '0x82e0b8cdd80af5930c4452c684e71c861148ec8a': 1680048000, // metamask
  '0xf26055894aeaae23d136defaa355a041a43d7dfd': 1680048000, // chainhop
  '0xf762c3fc745948ff49a3da00ccdc6b755e44305e': 1680048000, // chainhop
  '0xf80dd9cef747710b0bb6a113405eb6bc394ce050': 1680048000, // chainhop
  '0x696c91cdc3e79a74785c2cdd07ccc1bf0bc7b788': 1680048000, // chainhop
  '0x777777773491ff5cef6bb758f3baa9d70886909c': 1684627200 // via protocol
}

// the number value is the timestamp to start checking from,
// in order to not include data from before when the mapping address was added.
// make sure to address keys are lowercased here.
export const hopContracts: Record<string, Record<string, number>> = {
  USDC: {
    '0x3666f603cc164936c1b87e207f36beba4ac5f18a': 1684627200, // USDC ethereum l1Bridge
    '0xd0bf9465e71a9011ac5b12a4a8cafac491283874': 1684627200, // USDC gnosis l1MessengerWrapper
    '0x25d8039bb044dc227f741a9e381ca4ceae2e6ae8': 1684627200, // USDC gnosis l2Bridge, USDC polygon l2Bridge
    '0x76b22b8c1079a44f1211d867d68b1eda76a635a7': 1684627200, // USDC gnosis l2AmWrapper, USDC optimism l1MessengerWrapper
    '0x1e1607db33d38715544e595a5d8f94557c487dfa': 1684627200, // USDC polygon l1MessengerWrapper
    '0x6587a6164b091a058acba2e91f971454ec172940': 1684627200, // USDC optimism l1MessengerWrapper
    '0xa81d244a1814468c734e5b4101f7b9c0c577a8fc': 1684627200, // USDC optimism l2Bridge
    '0x2ad09850b0ca4c7c1b33f5acd6cbabcab5d6e796': 1684627200, // USDC optimism l2AmmWrapper
    '0x39bf4a32e689b6a79360854b7c901e991085d6a3': 1684627200, // USDC arbitrum l1MessengerWrapper
    '0x0e0e3d2c5c292161999474247956ef542cabf8dd': 1684627200, // USDC arbitrum l2Bridge
    '0xe22d2bedb3eca35e6397e0c6d62857094aa26f52': 1684627200 // USDC arbitrum l2AmmWrapper
  },
  USDT: {
    '0x3e4a3a4796d16c0cd582c382691998f7c06420b6': 1684627200, // USDT ethereum l1Bridge
    '0x8796860ca1677bf5d54ce5a348fe4b779a8212f3': 1684627200, // USDT gnosis l1MessengerWrapper
    '0xfd5a186a7e8453eb867a360526c5d987a00acac2': 1684627200, // USDT gnosis l2Bridge
    '0x49094a1b3463c4e2e82ca41b8e6a023bdd6e222f': 1684627200, // USDT gnosis l2AmmWrapper
    '0x1cd391bd1d915d189de162f0f1963c07e60e4cd6': 1684627200, // USDT polygon l1MessengerWrapper
    '0x6c9a1acf73bd85463a46b0afc076fbdf602b690b': 1684627200, // USDT polygon l2Bridge
    '0x8741ba6225a6bf91f9d73531a98a89807857a2b3': 1684627200, // USDT polygon l2AmmWrapper
    '0x9fc22e269c3752620eb281ce470855886b982501': 1684627200, // USDT optimism l1MessengerWrapper
    '0x46ae9bab8cea96610807a275ebd36f8e916b5c61': 1684627200, // USDT optimism l2Bridge
    '0x7d269d3e0d61a05a0ba976b7dbf8805bf844af3f': 1684627200, // USDT optimism l2AmmWrapper
    '0x967f8e2b66d624ad544cb59a230b867ac3dc60dc': 1684627200, // USDT arbitrum l1MessengerWrapper
    '0x72209fe68386b37a40d6bca04f78356fd342491f': 1684627200, // USDT arbitrum l2Bridge
    '0xcb0a4177e0a60247c0ad18be87f8edff6dd30283': 1684627200 // USDT arbitrum l2AmmWrapper
  },
  MATIC: {
    '0x22b1cbb8d98a01a3b71d034bb899775a76eb1cc2': 1684627200, // MATIC ethereum l1Bridge
    '0xcc0aceb13a902d0bfba37ad5d876320c7b590099': 1684627200, // MATIC gnosis l1MessengerWrapper
    '0x7ac71c29fedf94bac5a5c9ab76e1dd12ea885ccc': 1684627200, // MATIC gnosis l2Bridge
    '0x86ca30bef97fb651b8d866d45503684b90cb3312': 1684627200, // MATIC gnosis l2AmmWrapper
    '0x29d591ff46194ce3b0b813ce7940569fa06be7fa': 1684627200, // MATIC polygon l1MessengerWrapper
    '0x553bc791d746767166fa3888432038193ceed5e2': 1684627200, // MATIC polygon l2Bridge
    '0x884d1aa15f9957e1aeaa86a82a72e49bc2bfcbe3': 1684627200 // MATIC polygon l2AmmWrapper
  },
  DAI: {
    '0x3d4cc8a61c7528fd86c55cfe061a78dcba48edd1': 1684627200, // DAI ethereum l1Bridge
    '0xc3d56808907f6a45042c7e81a8a7db72c5f7f9f6': 1684627200, // DAI gnosis l1MessengerWrapper
    '0x0460352b91d7cf42b0e1c1c30f06b602d9ef2238': 1684627200, // DAI gnosis l2Bridge
    '0x6c928f435d1f3329babb42d69ccf043e3900ecf1': 1684627200, // DAI gnosis l2AmmWrapper
    '0x172cabe34c757472249ad4bd97560373fbbf0da3': 1684627200, // DAI polygon l1MessengerWrapper
    '0xecf268be00308980b5b3fcd0975d47c4c8e1382a': 1684627200, // DAI polygon l2Bridge
    '0x28529fec439cff6d7d1d5917e956dee62cd3be5c': 1684627200, // DAI polygon l2AmmWrapper
    '0x115f423b958a2847af0f5bf314db0f27c644c308': 1684627200, // DAI optimism l1MessengerWrapper
    '0x7191061d5d4c60f598214cc6913502184baddf18': 1684627200, // DAI optimism l2Bridge
    '0xb3c68a491608952cb1257fc9909a537a0173b63b': 1684627200, // DAI optimism l2AmmWrapper
    '0x2d6fd82c7f531328bcaca96ef985325c0894db62': 1684627200, // DAI arbitrum l1MessengerWrapper
    '0x7ac115536fe3a185100b2c4de4cb328bf3a58ba6': 1684627200, // DAI arbitrum l2Bridge
    '0xe7f40bf16ab09f4a6906ac2caa4094ad2da48cc2': 1684627200 // DAI arbitrum l2AmmWrapper
  },
  ETH: {
    '0xb8901acb165ed027e32754e0ffe830802919727f': 1684627200, // ETH ethereum l1Bridge
    '0x80466247e0e3d56f95a0910e52c82c374f7d65cd': 1684627200, // ETH gnosis l1MessengerWrapper
    '0xd8926c12c0b2e5cd40cfda49ecaff40252af491b': 1684627200, // ETH gnosis l2Bridge
    '0x03d7f750777ec48d39d080b020d83eb2cb4e3547': 1684627200, // ETH gnosis l2AmmWrapper
    '0x26a1fddacfb9f6f5072ee5636ed3429101e6c069': 1684627200, // ETH polygon l1MessengerWrapper
    '0xb98454270065a31d71bf635f6f7ee6a518dfb849': 1684627200, // ETH polygon l2Bridge
    '0xc315239cfb05f1e130e7e28e603cea4c014c57f0': 1684627200, // ETH polygon l2AmmWrapper
    '0xa45df1a388049fb8d76e72d350d24e2c3f7aebd1': 1684627200, // ETH optimism l1MessengerWrapper
    '0x83f6244bd87662118d96d9a6d44f09dfff14b30e': 1684627200, // ETH optimism l2Bridge
    '0x86ca30bef97fb651b8d866d45503684b90cb3312': 1684627200, // ETH optimism l2AmmWrapper
    '0xdd378a11475d588908001e0e99e4fd89abda5434': 1684627200, // ETH arbitrum l1MessengerWrapper
    '0x3749c4f034022c39ecaffaba182555d4508caccc': 1684627200, // ETH arbitrum l2Bridge
    '0x33ceb27b39d2bb7d2e61f7564d3df29344020417': 1684627200, // ETH arbitrum l2AmmWrapper
    '0x468f5e5a77c78275c3a6df6a59ff5dbed2559f74': 1684627200, // ETH nova l1MessengerWrapper
    '0x8796860ca1677bf5d54ce5a348fe4b779a8212f3': 1684627200, // ETH nova l2Bridge
    '0xd6bfb71b5ad5fd378cac15c72d8652e3b8d542c4': 1684627200 // ETH nova l2AmmWrapper
  },
  HOP: {
    '0x914f986a44acb623a277d6bd17368171fcbe4273': 1684627200, // HOP ethereum l1Bridge
    '0x53b94faf104a484ff4e7c66bfe311fd48ce3d887': 1684627200, // HOP gnosis l1MessengerWrapper
    '0x6f03052743cd99ce1b29265e377e320cd24eb632': 1684627200, // HOP gnosis l2Bridge
    '0xAa1603822b43e592e33b58d34B4423E1bcD8b4dC': 1684627200, // HOP polygon l1MessengerWrapper
    '0x58c61aee5ed3d748a1467085ed2650b697a66234': 1684627200, // HOP polygon l2Bridge
    '0x9d3a7fb18ca7f1237f977dc5572883f8b24f5638': 1684627200, // HOP optimism l1MessengerWrapper
    '0x03d7f750777ec48d39d080b020d83eb2cb4e3547': 1684627200, // HOP optimism l2Bridge
    '0x41bf5fd5d1c85f00fd1f23c77740f1a7eba6a35c': 1684627200, // HOP arbitrum l1MessengerWrapper
    '0x25fb92e505f752f730cad0bd4fa17ece4a384266': 1684627200 // HOP arbitrum l2Bridge
  },
  SNX: {
    '0x893246facf345c99e4235e5a7bbee7404c988b96': 1684627200, // SNX ethereum l1Bridge
    '0xf0727b1eb1a4c9319a5c34a68bcd5e6530850d47': 1684627200, // SNX optimism l1MessengerWrapper
    '0x16284c7323c35f4960540583998c98b1cfc581a7': 1684627200, // SNX optimism l2Bridge
    '0xf11ebb94ec986ea891aec29cff151345c83b33ec': 1684627200 // SNX optimism l2AmmWrapper
  },
  sUSD: {
    '0x36443fc70e073fe9d50425f82a3ee19fef697d62': 1684627200, // sUSD ethereum l1Bridge
    '0x4ef4c1208f7374d0252767e3992546d61dcf9848': 1684627200, // sUSD optimism l1MessengerWrapper
    '0x33fe5bb8da466da55a8a32d6ade2bb104e2c5201': 1684627200, // sUSD optimism l2Bridge
    '0x29fba7d2a6c95db162ee09c6250e912d6893dca6': 1684627200 // sUSD optimism l2AmmWrapper
  },
  rETH: {
    '0x87269b23e73305117d0404557badc459ced0dbec': 1684627200, // rETH ethereum l1Bridge
    '0xae26bbd1fa3083e1dae3aeaa2050b97c55886f5d': 1684627200, // rETH optimism l1MessengerWrapper
    '0xa0075e8ce43dcb9970cb7709b9526c1232cc39c2': 1684627200, // rETH optimism l2Bridge
    '0x19b2162ca4c2c6f08c6942bfb846ce5c396acb75': 1684627200, // rETH optimism l2AmmWrapper
    '0x7feb7af8d5b277e249868acf7644e7bb4a5937f8': 1684627200, // rETH arbitrum l1MessengerWrapper
    '0xc315239cfb05f1e130e7e28e603cea4c014c57f0': 1684627200, // rETH arbitrum l2Bridge
    '0x16e08c02e4b78b0a5b3a917ff5feaedd349a5a95': 1684627200 // rETH arbitrum l2AmmWrapper
  }
}

export const subgraphs: Record<string, string> = {
  hopBridge: 'hopBridge',
  merkleRewards: 'merkleRewards'
}
