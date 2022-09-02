# Fee Refund
A tool to calculate the amount of tokens to refund to users.

## Getting Started

Seed data and calculate rewards

## Development

```
const feeRefund = new FeeRefund({
  dbDir,
  rpcUrls,
  merkleRewardsContractAddress,
  startTimestamp,
  refundPercentage,
  refundChain,
  refundTokenSymbol
})

await feeRefund.seed()
await feeRefund.calculateFees()
```

Example output from `calculateFees()`:

```json
{
  "0x0000000000000000000000000000000000000000": "2235844954569473400",
  "0x0000000000000000000000000000000000000001": "1805976165462823000",
  "0x0000000000000000000000000000000000000002": "957778160370229000"
}
```

## Test

```shell
npm run test
```

## Lint

eslint
```shell
npm run eslint
```
