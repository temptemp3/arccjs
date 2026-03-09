# arccjs

ABI-centric Atomic Transaction Composer for Algorand AVM workflows.

## What is arccjs?

arccjs is a TypeScript library that wraps the Algorand SDK to provide a
higher-level, ABI-driven interface for building, simulating, and sending
smart contract transactions. Rather than manually constructing transaction
objects and managing group composition, you supply an ABI spec and arccjs
gives you callable methods that mirror your contract's interface.

## Why use arccjs over raw Algorand SDK?

- **ABI-first**: pass a contract spec and get typed methods instantly
- **Simulation-first workflow**: every call is simulated before signing,
  catching errors early and automatically resolving unnamed resource references
- **Group resource sharing**: automatically distributes accounts, assets, apps,
  and boxes across beacon transactions when resource limits are exceeded
- **ARC-2 note prefixing**: all transaction notes are automatically tagged
  with a standard agent prefix
- **Event querying**: built-in indexer integration for querying and decoding
  on-chain ABI events
- **Composable**: configure payments, asset transfers, extra app calls, and
  opt-ins declaratively before executing

## Installation

```bash
npm install arccjs
```

Requires Node.js >= 20.9.0.

## Quick Start

```typescript
import CONTRACT from "arccjs";
import algosdk from "algosdk";

// 1. Set up clients
const algod = new algosdk.Algodv2("", "https://testnet-api.voi.nodly.io", "");
const indexer = new algosdk.Indexer("", "https://testnet-idx.voi.nodly.io", "");

// 2. Define or import your contract's ABI spec
const spec = {
  name: "arc200",
  methods: [
    { name: "arc200_name", args: [], returns: { type: "byte[32]" }, readonly: true },
    { name: "arc200_balanceOf", args: [{ name: "owner", type: "address" }], returns: { type: "uint256" }, readonly: true },
    { name: "arc200_transfer", args: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], returns: { type: "bool" } },
  ],
  events: [
    { name: "arc200_Transfer", args: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint256" }] },
  ],
};

// 3. Create the contract instance
const ci = new CONTRACT(6779767, algod, indexer, spec);

// 4. Call readonly methods (simulated, no signing needed)
const nameResult = await ci.arc200_name();
if (nameResult.success) {
  console.log("Token name:", nameResult.returnValue);
}

// 5. Query events
const transfers = await ci.arc200_Transfer({ minRound: 1000000 });
console.log("Transfer events:", transfers);
```

## Core Concepts

### Contract Instance

The `CONTRACT` class is the central object. Create one per contract you
interact with:

```typescript
const ci = new CONTRACT(
  contractId,     // application ID
  algodClient,    // algod v2 client
  indexerClient,  // indexer v2 client
  spec,           // ABI contract spec (JSON)
  account?,       // { addr, sk } for signing (optional)
  simulate?,      // default true — simulate before sending
  waitForConfirmation?, // default false
  objectOnly?,    // default false — return raw txn objects only
);
```

### Dynamic Methods

Every method in the ABI spec becomes a callable function on the instance.
Readonly methods are simulated and return decoded values. Non-readonly
methods either simulate + return unsigned transactions, or sign + send,
depending on configuration.

### Simulation-First

By default, all calls are simulated. Simulation:
- Validates the transaction against the AVM
- Resolves unnamed resource references (accounts, assets, apps, boxes)
- Returns decoded return values for readonly methods
- Returns unsigned transaction groups for non-readonly methods

### Group Resource Sharing

When an AVM call requires more resources than a single transaction allows,
arccjs can automatically distribute references across "beacon" transactions
in the group:

```typescript
ci.setEnableGroupResourceSharing(true);
ci.setGroupResourceSharingStrategy("default"); // or "merge"
```

### Payments and Transfers

Attach payments or asset transfers to a method call:

```typescript
ci.setPaymentAmount(1_000_000);           // 1 ALGO to contract
ci.setTransfers([[500_000, "ADDR..."]]);   // 0.5 ALGO to address
ci.setAssetTransfers([[100, 12345]]);      // 100 units of ASA 12345
```

### Extra Transactions

Compose additional app calls into the group:

```typescript
ci.setExtraTxns([
  { appIndex: 67890, appArgs: [...], payment: 100_000 },
]);
```

### Events

Query on-chain events by name, with optional filters:

```typescript
const events = await ci.arc200_Transfer({ minRound: 5000000 });
const allEvents = await ci.getEvents({ sender: "ADDR..." });
```

## API Overview

### Exports

| Export | Description |
|--------|-------------|
| `default` / `CONTRACT` | Main contract builder class |
| `oneAddress` | Well-known funded address for simulation |
| `zeroAddress` | Zero address constant |
| `prepareString` | Strip trailing null bytes from ABI strings |
| `genericHash` | SHA-512/256 hash utility |
| `getEventSignature` | Build canonical ABI event signature |
| `getEventSelector` | First 4 bytes of event signature hash |
| `getAccountInfo` | Fetch account info from algod |
| `version` | Library version string |

### Types

All public types are exported for consumers:

```typescript
import type {
  ABIContractSpec,
  ABIMethodSpec,
  ABIEventSpec,
  AlgodClient,
  IndexerClient,
  EventQuery,
  EventResult,
  ExtraTxn,
  GroupResourceSharingStrategy,
  OnComplete,
  MethodCallResult,
  SendResult,
} from "arccjs";
```

### CONTRACT Methods

**Configuration** (all have corresponding getters):

| Method | Description |
|--------|-------------|
| `setFee(fee)` | Transaction fee (default 1000) |
| `setPaymentAmount(amount)` | Attach ALGO payment to app address |
| `setTransfers(transfers)` | Attach ALGO transfers to addresses |
| `setAssetTransfers(transfers)` | Attach ASA transfers to app address |
| `setExtraTxns(txns)` | Extra app calls in the group |
| `setAccounts(accounts)` | Additional account references |
| `setOptins(assetIds)` | ASA opt-in transactions to append |
| `setOnComplete(oc)` | OnComplete action (0=NoOp, 5=DeleteApplication) |
| `setSimulate(bool)` | Toggle simulation mode |
| `setEnableGroupResourceSharing(bool)` | Toggle GRS |
| `setGroupResourceSharingStrategy(s)` | "default" or "merge" |
| `setBeaconId(id)` | Beacon app ID for GRS |
| `setBeaconSelector(sel)` | Beacon method selector |
| `setAgentName(name)` | ARC-2 agent name |
| `setDebug(bool)` | Debug mode |
| `setEnableRawBytes(bool)` | Return raw bytes instead of text |
| `setEnableParamsLastRoundMod(bool)` | Constrain lastValid round |
| `setStep(step)` | Step value |

**Core**:

| Method | Description |
|--------|-------------|
| `getEvents(query?)` | Query all events defined in spec |
| `getEventByName(name)` | Get event helper by name |
| `createAppCallTxnObject(method, args)` | Build raw txn object |
| `createUtxns(method, args)` | Build unsigned txn group (base64) |
| `simulateTxn(method, args)` | Simulate and return raw response |
| `signTxns(utxns, sk)` | Sign unsigned txn group |
| `makeUNote(msg)` | Create ARC-2 prefixed note |
| `getRIndex()` | Get result index offset |

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type-check without emitting
npm run typecheck

# Build
npm run build
```

### Project Structure

```
src/
  index.ts              # Public entry point and re-exports
  types.ts              # All public type definitions
  version.ts            # Version constant
  lib/
    contract.ts         # CONTRACT class and helpers
    contract.test.ts    # Contract builder tests
  utils/
    account.ts          # Address constants and account helpers
    account.test.ts     # Account utility tests
    string.ts           # String utilities
    string.test.ts      # String utility tests
```

## Migration Notes (v2.x / pre-TS to v3.x)

### Breaking Changes

- **Dependency fix**: the `sha512` dependency was incorrect. The library
  actually uses `js-sha512`. If you were depending on `sha512` being in
  your `node_modules`, it is no longer there.

- **Import path**: the package entry point is now `dist/index.js` (compiled
  from TypeScript). If you were importing from internal paths like
  `arccjs/src/lib/contract.js`, update to import from `arccjs` directly.

- **`@algorandfoundation/algokit-utils` removed**: this dependency was
  listed but never imported. It has been removed. If your project depends
  on it, add it to your own dependencies.

- **`fixSigs` renamed to `fixSigners`**: the simulate request now uses the
  correct property name from algosdk v3.

### Non-Breaking Changes

- All public API methods, constructor signature, and behavior are preserved.
- `getAccountInfo` and `genericHash`/`getEventSignature`/`getEventSelector`
  are now re-exported from the package entry point.
- Full TypeScript type definitions are emitted with the package.
- Version constant (`version.ts`) is now synced with `package.json`.

## License

MIT — Nicholas Shellabarger
