# AtomicComposer — Multi-Contract Atomic Groups

The `AtomicComposer` provides a high-level, chainable API for building atomic
transaction groups that span multiple smart contracts. It eliminates the manual
boilerplate of extracting `.obj` from method calls, maintaining transaction
arrays, and wiring up a glue `CONTRACT` instance.

## Motivation

Real DeFi workflows rarely involve a single contract call. A typical flow
might require:

1. Approve a token spend (ARC-200 `arc200_approve`)
2. Opt into a new asset
3. Call a lending protocol (`liquidate`, `borrow`, `repay`)
4. Attach ALGO payments as collateral

Without the composer, you'd create separate `CONTRACT` instances in `objectOnly`
mode, extract `.obj` from each, build a manual array, wire it into a runner
contract via `setExtraTxns`, and call `custom()`. The composer handles all of
this internally.

## Quick Start

```typescript
import { AtomicComposer, CONTRACT } from "arccjs";

const token = new CONTRACT(tokenId, algod, indexer, arc200Spec);
const lending = new CONTRACT(lendingId, algod, indexer, lendingSpec);

const { txns } = await new AtomicComposer({ algod, sender: myAddress })
  .addMethodCall(token, "arc200_approve", [spender, amount])
  .addMethodCall(lending, "borrow", [marketId, amount], {
    payment: 2_000_000,
  })
  .withResourceSharing()
  .build();

// txns: string[] of base64 unsigned transactions, ready for wallet signing
```

## Constructor

```typescript
new AtomicComposer(options: ComposerOptions)
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `algod` | `AlgodClient` | yes | Algod v2 client for simulation/submission |
| `sender` | `string` | yes | Sender address for all transactions |
| `indexer` | `IndexerClient` | no | Indexer client (a no-op stub is used if omitted) |
| `agentName` | `string` | no | Override the ARC-2 agent prefix in notes |

## Step Builders

All step builders are chainable (`return this`). Call them in the order you
want transactions to appear in the group.

### `addMethodCall(contract, methodName, args, options?)`

Add an ABI method call from any `CONTRACT` instance. The method name is
validated against the contract's ABI spec immediately — typos fail fast.

```typescript
composer.addMethodCall(token, "arc200_transfer", [recipient, amount], {
  note: "transfer tokens",
  fee: 2000,
});
```

**StepOptions:**

| Field | Type | Description |
|-------|------|-------------|
| `note` | `string` | Human-readable note for the ARC-2 transaction note |
| `fee` | `number` | Fee override in microALGOs |
| `payment` | `number` | ALGO payment (microALGOs) to the step's app address |
| `assetTransfer` | `{ assetId, amount }` | ASA transfer to the step's app address (ExtraTxn.xaid + aamt) |
| `innerTransfer` | `{ assetId, sender, receiver, amount?, note? }` | Paired ASA transfer or opt-in inserted immediately before the app call (ExtraTxn.xaid/snd/arcv/xamt/xano) |
| `onComplete` | `0 \| 5` | OnComplete override (NoOp or DeleteApplication) |
| `accounts` | `string[]` | Additional account references for this step |
| `foreignApps` | `number[]` | Additional application references |
| `foreignAssets` | `number[]` | Additional asset references |
| `boxes` | `Array<{ appIndex, name }>` | Box references |

### `addPayment(receiver, amount, note?)`

Add a standalone ALGO payment. Payments appear at the beginning of the group
(before app calls), as the underlying `CONTRACT` driver prepends transfers.

```typescript
composer.addPayment("RECEIVER_ADDR...", 1_000_000, "reward payout");
```

### `addAssetOptIn(assetId)`

Add an ASA opt-in (zero-amount self-transfer). Opt-ins appear at the end of
the group (after app calls).

```typescript
composer.addAssetOptIn(12345);
```

### `addAssetTransfer(assetId, sender, receiver, amount, note?)`

Add a standalone ASA transfer to an arbitrary address. Implemented as an
`ExtraTxn` with `ignore: true` (no app call), preserving only the inner
asset transfer side-effect.

```typescript
composer.addAssetTransfer(42, myAddress, receiverAddress, 100, "send tokens");
```

### `withResourceSharing(strategy?)`

Enable group resource sharing. When enabled, the driver `CONTRACT` will create
beacon transactions to carry resource references that exceed single-transaction
limits.

```typescript
composer.withResourceSharing();          // "default" strategy
composer.withResourceSharing("merge");   // merge into existing extra txns
```

## Inspection

Before building, you can inspect the planned steps:

```typescript
const steps = composer.getSteps();
// StepSummary[] — [{kind, description, contractId?, methodName?}, ...]

console.log(composer.length); // number of steps
```

Each `StepSummary` has:

| Field | Type | Present When |
|-------|------|-------------|
| `kind` | `"methodCall" \| "payment" \| "assetOptIn"` | always |
| `description` | `string` | always |
| `contractId` | `number` | methodCall steps |
| `methodName` | `string` | methodCall steps |

## Terminal Operations

### `build()`

Simulates the group to resolve resource references, then returns base64-encoded
unsigned transactions with an assigned group ID. This is the primary workflow
for wallet-based signing.

```typescript
const result = await composer.build();
if (result.success) {
  // result.txns: string[] — base64 unsigned transactions
  // result.groupSize: number
} else {
  console.error(result.error);
}
```

### `simulate()`

Simulate without building final transactions. Useful for validation and fee
estimation before committing.

```typescript
const result = await composer.simulate();
if (result.success) {
  // result.response: SimulateResponse
} else {
  console.error(result.failureMessage);
}
```

### `execute(sk)`

Build, sign with the provided secret key, and submit. Convenience for
server-side scripts and testing — not for production wallet flows.

```typescript
const result = await composer.execute(account.sk);
if (result.success) {
  console.log("Submitted:", result.txId);
}
```

For wallet-based signing, use `build()` and pass the unsigned transactions to
your wallet adapter (PeraConnect, Defly, Kibisis, etc.).

## How It Works Internally

The composer does not reimplement transaction building. Instead it:

1. Translates each step into `ExtraTxn` objects (for method calls), transfer
   tuples (for payments), and opt-in IDs.
2. Creates an internal "driver" `CONTRACT` instance with a minimal
   `{ name: "arccjs-composer", methods: [{ name: "custom", ... }] }` spec.
3. Wires `extraTxns`, `transfers`, and `optIns` into the driver.
4. Calls the driver's `custom()` pipeline, which assembles and simulates
   the full group using `CONTRACT`'s existing machinery.

This design means the composer inherits all of `CONTRACT`'s resource resolution,
group resource sharing, ARC-2 note formatting, and simulation logic for free.

## Patterns

### ulujs-style DEX Swap (Deposit + Approve + Swap + Withdraw)

This mirrors the complex swap pattern from ulujs, where VSA tokens require
deposit, approval, swap, and withdrawal with asset opt-in — all atomic.

```typescript
const tokA = new CONTRACT(tokenAId, algod, indexer, nt200Spec);
const tokB = new CONTRACT(tokenBId, algod, indexer, nt200Spec);
const tokenA = new CONTRACT(tokenAId, algod, indexer, arc200Spec);
const pool = new CONTRACT(poolId, algod, indexer, swapSpec);

const { txns } = await new AtomicComposer({ algod, sender: myAddress })
  // 1. Deposit VSA: ASA transfer to app + payment for box creation + app call
  .addMethodCall(tokA, "deposit", [amountIn], {
    assetTransfer: { assetId: vsaTokenId, amount: Number(amountIn) },
    payment: 28_500,
    note: "Deposit VSA token A",
  })
  // 2. Approve spending by the pool
  .addMethodCall(tokenA, "arc200_approve", [poolAddress, amountIn], {
    payment: 28_502,
    note: "Approve token A for pool",
  })
  // 3. Swap
  .addMethodCall(pool, "Trader_swapAForB", [0n, amountIn, minAmountOut], {
    note: "Swap A for B",
  })
  // 4. Withdraw with asset opt-in before the call
  .addMethodCall(tokB, "withdraw", [withdrawAmount], {
    innerTransfer: {
      assetId: vsaTokenBId,
      sender: myAddress,
      receiver: myAddress,  // self-transfer = opt-in
    },
    note: "Withdraw token B",
  })
  .withResourceSharing("merge")
  .build();
```

### Deposit with Explicit Resource References

When the AVM needs to access accounts or apps that aren't automatically
resolved by simulation, you can specify them explicitly:

```typescript
composer.addMethodCall(token, "deposit", [amount], {
  assetTransfer: { assetId: 42, amount: 1000 },
  payment: 28_503,
  accounts: [algosdk.getApplicationAddress(poolId)],
  foreignApps: [tokenContractId],
  note: "Deposit with explicit refs",
});
```

### Multi-Token Approval + DeFi Action

```typescript
const composer = new AtomicComposer({ algod, sender })
  .addMethodCall(tokenA, "arc200_approve", [protocolAddr, amountA])
  .addMethodCall(tokenB, "arc200_approve", [protocolAddr, amountB])
  .addMethodCall(dex, "swap", [tokenAId, tokenBId, amountA, minOut], {
    payment: 28_500,
    note: "swap A for B",
  })
  .withResourceSharing();

const { txns } = await composer.build();
```

### Opt-In + Claim

```typescript
const { txns } = await new AtomicComposer({ algod, sender })
  .addAssetOptIn(rewardAsaId)
  .addMethodCall(staking, "claim_rewards", [poolId])
  .withResourceSharing()
  .build();
```

### Simulate-Then-Build Guard

```typescript
const composer = new AtomicComposer({ algod, sender })
  .addMethodCall(lending, "repay", [marketId, amount], { payment: 100_000 })
  .withResourceSharing();

const sim = await composer.simulate();
if (!sim.success) {
  throw new Error(`Simulation failed: ${sim.failureMessage}`);
}

const { txns } = await composer.build();
```

### Server-Side Execution

```typescript
const result = await new AtomicComposer({ algod, sender: acc.addr })
  .addMethodCall(oracle, "push_price", [feedId, price])
  .execute(acc.sk);

if (!result.success) {
  console.error("Failed:", result.error);
}
```
