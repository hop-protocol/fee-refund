# Fee Refund
A tool to calculate the amount of tokens to refund to users.

## Getting Started

Seed data and calculate rewards

## Development

Running the entire
```
const feeRefund = new FeeRefund(
  dbDir,
  rpcUrls,
  startTimestamp,
  refundPercentage,
  refundChain
)

await feeRefund.seed()
await feeRefund.calculateFees()
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
