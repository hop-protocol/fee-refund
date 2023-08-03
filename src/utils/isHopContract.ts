import { mainnet as mainnetAddresses, goerli as goerliAddresses } from '@hop-protocol/core/addresses'

function getHopContracts (addresses: any) {
  const keys = new Set(['l1Bridge', 'l1MessengerWrapper', 'l2Bridge', 'l2AmmWrapper'])
  const set = new Set([])
  for (const tokenSymbol in addresses) {
    for (const chain in addresses[tokenSymbol]) {
      for (const contract in addresses[tokenSymbol][chain]) {
        if (keys.has(contract)) {
          set.add(addresses[tokenSymbol][chain][contract]?.toLowerCase())
        }
      }
    }
  }
  return set
}

const hopContracts :any = {
  mainnet: getHopContracts(mainnetAddresses.bridges),
  goerli: getHopContracts(goerliAddresses.bridges)
}

const hopContractsBeforeReadingFromCore = new Set([
  '0x3666f603cc164936c1b87e207f36beba4ac5f18a',
  '0xd0bf9465e71a9011ac5b12a4a8cafac491283874',
  '0x25d8039bb044dc227f741a9e381ca4ceae2e6ae8',
  '0x76b22b8c1079a44f1211d867d68b1eda76a635a7',
  '0x1e1607db33d38715544e595a5d8f94557c487dfa',
  '0x6587a6164b091a058acba2e91f971454ec172940',
  '0xa81d244a1814468c734e5b4101f7b9c0c577a8fc',
  '0x2ad09850b0ca4c7c1b33f5acd6cbabcab5d6e796',
  '0x39bf4a32e689b6a79360854b7c901e991085d6a3',
  '0x0e0e3d2c5c292161999474247956ef542cabf8dd',
  '0xe22d2bedb3eca35e6397e0c6d62857094aa26f52',
  '0x3e4a3a4796d16c0cd582c382691998f7c06420b6',
  '0x8796860ca1677bf5d54ce5a348fe4b779a8212f3',
  '0xfd5a186a7e8453eb867a360526c5d987a00acac2',
  '0x49094a1b3463c4e2e82ca41b8e6a023bdd6e222f',
  '0x1cd391bd1d915d189de162f0f1963c07e60e4cd6',
  '0x6c9a1acf73bd85463a46b0afc076fbdf602b690b',
  '0x8741ba6225a6bf91f9d73531a98a89807857a2b3',
  '0x9fc22e269c3752620eb281ce470855886b982501',
  '0x46ae9bab8cea96610807a275ebd36f8e916b5c61',
  '0x7d269d3e0d61a05a0ba976b7dbf8805bf844af3f',
  '0x967f8e2b66d624ad544cb59a230b867ac3dc60dc',
  '0x72209fe68386b37a40d6bca04f78356fd342491f',
  '0xcb0a4177e0a60247c0ad18be87f8edff6dd30283',
  '0x22b1cbb8d98a01a3b71d034bb899775a76eb1cc2',
  '0xcc0aceb13a902d0bfba37ad5d876320c7b590099',
  '0x7ac71c29fedf94bac5a5c9ab76e1dd12ea885ccc',
  '0x86ca30bef97fb651b8d866d45503684b90cb3312',
  '0x29d591ff46194ce3b0b813ce7940569fa06be7fa',
  '0x553bc791d746767166fa3888432038193ceed5e2',
  '0x884d1aa15f9957e1aeaa86a82a72e49bc2bfcbe3',
  '0x3d4cc8a61c7528fd86c55cfe061a78dcba48edd1',
  '0xc3d56808907f6a45042c7e81a8a7db72c5f7f9f6',
  '0x0460352b91d7cf42b0e1c1c30f06b602d9ef2238',
  '0x6c928f435d1f3329babb42d69ccf043e3900ecf1',
  '0x172cabe34c757472249ad4bd97560373fbbf0da3',
  '0xecf268be00308980b5b3fcd0975d47c4c8e1382a',
  '0x28529fec439cff6d7d1d5917e956dee62cd3be5c',
  '0x115f423b958a2847af0f5bf314db0f27c644c308',
  '0x7191061d5d4c60f598214cc6913502184baddf18',
  '0xb3c68a491608952cb1257fc9909a537a0173b63b',
  '0x2d6fd82c7f531328bcaca96ef985325c0894db62',
  '0x7ac115536fe3a185100b2c4de4cb328bf3a58ba6',
  '0xe7f40bf16ab09f4a6906ac2caa4094ad2da48cc2',
  '0xb8901acb165ed027e32754e0ffe830802919727f',
  '0x80466247e0e3d56f95a0910e52c82c374f7d65cd',
  '0xd8926c12c0b2e5cd40cfda49ecaff40252af491b',
  '0x03d7f750777ec48d39d080b020d83eb2cb4e3547',
  '0x26a1fddacfb9f6f5072ee5636ed3429101e6c069',
  '0xb98454270065a31d71bf635f6f7ee6a518dfb849',
  '0xc315239cfb05f1e130e7e28e603cea4c014c57f0',
  '0xa45df1a388049fb8d76e72d350d24e2c3f7aebd1',
  '0x83f6244bd87662118d96d9a6d44f09dfff14b30e',
  '0xdd378a11475d588908001e0e99e4fd89abda5434',
  '0x3749c4f034022c39ecaffaba182555d4508caccc',
  '0x33ceb27b39d2bb7d2e61f7564d3df29344020417',
  '0x468f5e5a77c78275c3a6df6a59ff5dbed2559f74',
  '0xd6bfb71b5ad5fd378cac15c72d8652e3b8d542c4',
  '0x914f986a44acb623a277d6bd17368171fcbe4273',
  '0x53b94faf104a484ff4e7c66bfe311fd48ce3d887',
  '0x6f03052743cd99ce1b29265e377e320cd24eb632',
  '0xAa1603822b43e592e33b58d34B4423E1bcD8b4dC',
  '0x58c61aee5ed3d748a1467085ed2650b697a66234',
  '0x9d3a7fb18ca7f1237f977dc5572883f8b24f5638',
  '0x41bf5fd5d1c85f00fd1f23c77740f1a7eba6a35c',
  '0x25fb92e505f752f730cad0bd4fa17ece4a384266',
  '0x893246facf345c99e4235e5a7bbee7404c988b96',
  '0xf0727b1eb1a4c9319a5c34a68bcd5e6530850d47',
  '0x16284c7323c35f4960540583998c98b1cfc581a7',
  '0xf11ebb94ec986ea891aec29cff151345c83b33ec',
  '0x36443fc70e073fe9d50425f82a3ee19fef697d62',
  '0x4ef4c1208f7374d0252767e3992546d61dcf9848',
  '0x33fe5bb8da466da55a8a32d6ade2bb104e2c5201',
  '0x29fba7d2a6c95db162ee09c6250e912d6893dca6',
  '0x87269b23e73305117d0404557badc459ced0dbec',
  '0xae26bbd1fa3083e1dae3aeaa2050b97c55886f5d',
  '0xa0075e8ce43dcb9970cb7709b9526c1232cc39c2',
  '0x19b2162ca4c2c6f08c6942bfb846ce5c396acb75',
  '0x7feb7af8d5b277e249868acf7644e7bb4a5937f8',
  '0x16e08c02e4b78b0a5b3a917ff5feaedd349a5a95'
])

export function isHopContract (network: string, address: string, timestamp?: number): boolean {
  address = address.toLowerCase()

  if (timestamp && timestamp < 1690297200) {
    return hopContractsBeforeReadingFromCore.has(address)
  }

  return hopContracts[network].has(address)
}
