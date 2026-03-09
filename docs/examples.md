# Examples & Recipes

Practical patterns for common Algorand workflows using arccjs.

## Table of Contents

- [Reading Contract State](#reading-contract-state)
- [Sending a Simple Transaction](#sending-a-simple-transaction)
- [Wallet-Based Signing Flow](#wallet-based-signing-flow)
- [ARC-200 Token Operations](#arc-200-token-operations)
- [Multi-Contract Atomic Swap](#multi-contract-atomic-swap)
- [DeFi Liquidation](#defi-liquidation)
- [Event Monitoring](#event-monitoring)
- [Group Resource Sharing](#group-resource-sharing)
- [Custom Simulation Handler](#custom-simulation-handler)

---

## Reading Contract State

Readonly methods are simulated and return decoded values directly.

```typescript
import CONTRACT from "arccjs";
import algosdk from "algosdk";

const algod = new algosdk.Algodv2("", "https://testnet-api.voi.nodly.io", "");
const indexer = new algosdk.Indexer("", "https://testnet-idx.voi.nodly.io", "");

const spec = {
  name: "arc200",
  methods: [
    { name: "arc200_name", args: [], returns: { type: "byte[32]" }, readonly: true },
    {
      name: "arc200_balanceOf",
      args: [{ name: "owner", type: "address" }],
      returns: { type: "uint256" },
      readonly: true,
    },
  ],
  events: [],
};

const token = new CONTRACT(6779767, algod, indexer, spec);

// Read the token name
const nameResult = await token.arc200_name();
if (nameResult.success) {
  console.log("Name:", nameResult.returnValue);
}

// Read a balance
const balResult = await token.arc200_balanceOf(
  "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ"
);
if (balResult.success) {
  console.log("Balance:", balResult.returnValue);
}
```

## Sending a Simple Transaction

Provide an account with a secret key and disable simulation to send directly.

```typescript
const acc = algosdk.mnemonicToSecretKey("your twenty five word mnemonic ...");

const token = new CONTRACT(6779767, algod, indexer, spec, acc, false, true);

const result = await token.arc200_transfer(recipientAddress, 1000000n);
if (result.success) {
  console.log("Sent! TxID:", result.txId);
} else {
  console.error("Failed:", result.error);
}
```

## Wallet-Based Signing Flow

The most common production pattern: simulate to get unsigned transactions,
then hand them to a wallet adapter.

```typescript
const token = new CONTRACT(6779767, algod, indexer, spec);

// Simulate mode (default) returns unsigned txns on success
const result = await token.arc200_transfer(recipientAddress, 1000000n);
if (result.success && result.txns) {
  // result.txns is string[] of base64-encoded unsigned transactions
  // Pass to your wallet:
  const signedTxns = await wallet.signTransactions(result.txns);
  await algod.sendRawTransaction(signedTxns).do();
}
```

## ARC-200 Token Operations

### Approve + TransferFrom (Two Contracts)

```typescript
import { AtomicComposer, CONTRACT } from "arccjs";

const arc200Spec = {
  name: "arc200",
  methods: [
    {
      name: "arc200_approve",
      args: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
      returns: { type: "bool" },
    },
    {
      name: "arc200_transferFrom",
      args: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      returns: { type: "bool" },
    },
  ],
  events: [],
};

const tokenA = new CONTRACT(tokenAId, algod, indexer, arc200Spec);
const tokenB = new CONTRACT(tokenBId, algod, indexer, arc200Spec);

const { txns } = await new AtomicComposer({ algod, sender: myAddress })
  .addMethodCall(tokenA, "arc200_approve", [dexAddress, amountA])
  .addMethodCall(tokenB, "arc200_approve", [dexAddress, amountB])
  .withResourceSharing()
  .build();

// Sign and submit txns via wallet
```

## Multi-Contract Atomic Swap

A DEX swap that approves two tokens and executes the swap atomically.

```typescript
const tokenIn = new CONTRACT(tokenInId, algod, indexer, arc200Spec);
const dex = new CONTRACT(dexId, algod, indexer, dexSpec);

const composer = new AtomicComposer({ algod, sender: myAddress })
  .addMethodCall(tokenIn, "arc200_approve", [dexAddress, swapAmount], {
    note: "approve input token",
  })
  .addMethodCall(dex, "swap_exact_in", [tokenInId, tokenOutId, swapAmount, minOut], {
    payment: 28_500,
    note: "swap",
  })
  .withResourceSharing();

// Inspect the plan
console.log(composer.getSteps());
// [
//   { kind: "methodCall", description: "approve input token", contractId: 123, methodName: "arc200_approve" },
//   { kind: "methodCall", description: "swap", contractId: 456, methodName: "swap_exact_in" },
// ]

const { txns } = await composer.build();
```

## DeFi Liquidation

A complex cross-market liquidation with token approval, asset opt-in, and
a payment for protocol fees.

```typescript
const debtToken = new CONTRACT(debtTokenId, algod, indexer, arc200Spec);
const lending = new CONTRACT(lendingId, algod, indexer, lendingSpec);

const composer = new AtomicComposer({ algod, sender: liquidatorAddress })
  .addMethodCall(debtToken, "arc200_approve", [lendingAddress, debtAmount], {
    note: "approve debt repayment",
  })
  .addAssetOptIn(collateralAsaId)
  .addMethodCall(
    lending,
    "liquidate_cross_market",
    [debtMarketId, collateralMarketId, borrower, debtAmount, minCollateral],
    { payment: 2_000_000, note: "liquidate" },
  )
  .withResourceSharing();

// Validate first
const sim = await composer.simulate();
if (!sim.success) {
  console.error("Would fail:", sim.failureMessage);
  process.exit(1);
}

// Build and sign
const { txns } = await composer.build();
const signedTxns = await wallet.signTransactions(txns);
await algod.sendRawTransaction(signedTxns).do();
```

## Event Monitoring

### Query Historical Events

```typescript
const spec = {
  name: "arc200",
  methods: [],
  events: [
    {
      name: "arc200_Transfer",
      args: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" },
      ],
    },
    {
      name: "arc200_Approval",
      args: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" },
      ],
    },
  ],
};

const token = new CONTRACT(6779767, algod, indexer, spec);

// Query a specific event
const transfers = await token.arc200_Transfer({ minRound: 5_000_000 });
for (const [txId, round, timestamp, from, to, amount] of transfers) {
  console.log(`${from} -> ${to}: ${amount} (round ${round})`);
}

// Query all events at once
const allEvents = await token.getEvents({ minRound: 5_000_000 });
for (const { name, events } of allEvents) {
  console.log(`${name}: ${events.length} events`);
}
```

### Filter by Sender

```typescript
const myTransfers = await token.arc200_Transfer({
  sender: myAddress,
  minRound: 5_000_000,
});
```

### Filter by Transaction ID

```typescript
const specificTransfer = await token.arc200_Transfer({
  txid: "TXID...",
});
```

## Group Resource Sharing

When a single transaction exceeds Algorand's per-transaction resource limits
(4 accounts, 8 foreign apps, 8 foreign assets, 8 boxes), arccjs can
automatically distribute references across beacon transactions.

### With CONTRACT Directly

```typescript
const ci = new CONTRACT(appId, algod, indexer, spec, acc, false, true);
ci.setEnableGroupResourceSharing(true);
ci.setExtraTxns([
  { appIndex: app1, appArgs: [...] },
  { appIndex: app2, appArgs: [...] },
  { appIndex: app3, appArgs: [...] },
]);

const result = await ci.custom();
```

### With AtomicComposer

```typescript
const { txns } = await new AtomicComposer({ algod, sender: myAddress })
  .addMethodCall(contract1, "method1", args1)
  .addMethodCall(contract2, "method2", args2)
  .addMethodCall(contract3, "method3", args3)
  .withResourceSharing()       // "default" strategy
  // .withResourceSharing("merge")  // merges refs into existing txns
  .build();
```

### Merge Strategy

The `"merge"` strategy folds resource references into existing extra
transactions instead of creating separate beacon transactions. This can
reduce group size when the extra transactions have spare reference slots.

```typescript
ci.setEnableGroupResourceSharing(true);
ci.setGroupResourceSharingStrategy("merge");
```

## Custom Simulation Handler

Override the default return-value decoder for specialized needs.

```typescript
const ci = new CONTRACT(appId, algod, indexer, spec);

ci.simulationResultHandler = (response, abiMethod) => {
  const group = response.txnGroups[0];

  if (group.failureMessage) {
    throw new Error(`Simulation failed: ${group.failureMessage}`);
  }

  // Custom logic: extract inner transaction logs
  const logs = group.txnResults.flatMap((r) => r.txnResult.logs);
  return { logs, raw: response };
};

const result = await ci.someMethod(arg1, arg2);
// result.returnValue is now { logs, raw }
```

## Utilities

### Address Constants

```typescript
import { zeroAddress, oneAddress } from "arccjs";

console.log(zeroAddress);
// "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ"

console.log(oneAddress);
// "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ"
// (well-known funded address, used as default simulation sender)
```

### String Helpers

```typescript
import { prepareString } from "arccjs";

// Strip trailing null bytes from ABI byte array strings
const clean = prepareString("hello\x00\x00\x00");
// "hello"
```

### Hashing and Event Selectors

```typescript
import { genericHash, getEventSignature, getEventSelector } from "arccjs";

const hash = genericHash("arc200_Transfer(address,address,uint256)");
// number[] — SHA-512/256 hash

const sig = getEventSignature({
  name: "arc200_Transfer",
  args: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "amount", type: "uint256" },
  ],
});
// "arc200_Transfer(address,address,uint256)"

const sel = getEventSelector({
  name: "arc200_Transfer",
  args: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "amount", type: "uint256" },
  ],
});
// "a1b2c3d4" (hex)
```
