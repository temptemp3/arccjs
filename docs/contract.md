# CONTRACT — ABI Transaction Builder

The `CONTRACT` class is the core of arccjs. It takes an ABI spec and dynamically
creates callable methods that mirror your smart contract's interface. Every method
call goes through a simulation-first pipeline that catches errors early, resolves
resource references, and returns decoded results.

## Creating an Instance

```typescript
import CONTRACT from "arccjs";
import algosdk from "algosdk";

const algod = new algosdk.Algodv2("", "https://testnet-api.voi.nodly.io", "");
const indexer = new algosdk.Indexer("", "https://testnet-idx.voi.nodly.io", "");

const spec = {
  name: "my-contract",
  methods: [
    { name: "getValue", args: [], returns: { type: "uint64" }, readonly: true },
    {
      name: "setValue",
      args: [{ name: "val", type: "uint64" }],
      returns: { type: "void" },
    },
  ],
  events: [
    {
      name: "ValueChanged",
      args: [{ name: "oldVal", type: "uint64" }, { name: "newVal", type: "uint64" }],
    },
  ],
};

const ci = new CONTRACT(123456, algod, indexer, spec);
```

### Constructor Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `contractId` | `number` | — | Application ID on-chain |
| `algodClient` | `AlgodClient` | — | Algod v2 client |
| `indexerClient` | `IndexerClient` | — | Indexer v2 client |
| `spec` | `ABIContractSpec` | — | ABI JSON spec (methods + events) |
| `acc` | `AccountWithSk \| null` | `undefined` | Account with secret key for signing |
| `simulate` | `boolean` | `true` | Simulate before sending |
| `waitForConfirmation` | `boolean` | `false` | Wait for block confirmation after send |
| `objectOnly` | `boolean` | `false` | Return raw txn objects without simulating |

## Method Call Modes

The constructor signature controls how dynamically-generated methods behave:

### Readonly Methods

Methods with `readonly: true` in the spec are always simulated and never sent.
The decoded return value is available in `result.returnValue`.

```typescript
const ci = new CONTRACT(appId, algod, indexer, spec);
const result = await ci.getValue();
if (result.success) {
  console.log(result.returnValue); // decoded uint64
}
```

### Simulate Mode (default)

Non-readonly methods simulate first to validate. On success they also build
the full unsigned transaction group (base64-encoded), ready for wallet signing.

```typescript
const ci = new CONTRACT(appId, algod, indexer, spec);
const result = await ci.setValue(42n);
if (result.success) {
  // result.txns: string[] — base64 unsigned transactions
  // result.returnValue: decoded return (from simulation)
  // result.response: raw SimulateResponse
}
```

### ObjectOnly Mode

Returns the raw transaction object without simulating. Useful for building
multi-contract groups manually (though `AtomicComposer` is preferred).

```typescript
const ci = new CONTRACT(appId, algod, indexer, spec, null, true, false, true);
const result = await ci.setValue(42n);
// result.obj: { sender, appIndex, appArgs }
```

### Send Mode

When an account with a secret key is provided and `simulate` is `false`,
the method signs and submits the transaction directly.

```typescript
const acc = algosdk.mnemonicToSecretKey("your mnemonic ...");
const ci = new CONTRACT(appId, algod, indexer, spec, acc, false, true);
const result = await ci.setValue(42n);
// result.txId: transaction ID on success
```

## Configuration

All setters are chainable-friendly (though they return `void`). Each has a
corresponding getter.

### Transaction Fees

```typescript
ci.setFee(2000); // microALGOs, default is 1000
```

### Payments

Attach an ALGO payment to the contract's application address:

```typescript
ci.setPaymentAmount(1_000_000); // 1 ALGO
```

Attach payments to arbitrary addresses:

```typescript
ci.setTransfers([
  [500_000, "ADDR1..."],
  [200_000, "ADDR2..."],
]);
```

### Asset Transfers

Attach ASA transfers to the contract's application address:

```typescript
ci.setAssetTransfers([
  [100, 12345], // 100 units of ASA 12345
]);
```

### Extra Transactions

Compose additional app calls into the transaction group:

```typescript
ci.setExtraTxns([
  {
    appIndex: 67890,
    appArgs: [methodSelector, ...encodedArgs],
    payment: 100_000,
  },
]);
```

For multi-contract workflows, prefer `AtomicComposer` over manual `setExtraTxns`.

### Asset Opt-Ins

Append zero-amount self-transfers (opt-ins) to the group:

```typescript
ci.setOptins([12345, 67890]); // opt in to ASA 12345 and 67890
```

### OnComplete

```typescript
ci.setOnComplete(0); // NoOp (default)
ci.setOnComplete(5); // DeleteApplication
```

### Group Resource Sharing

When a call exceeds single-transaction resource limits, arccjs creates
beacon transactions that carry the extra references:

```typescript
ci.setEnableGroupResourceSharing(true);
ci.setGroupResourceSharingStrategy("default"); // or "merge"
```

| Strategy | Behavior |
|----------|----------|
| `"default"` | Creates separate beacon transactions for each resource type |
| `"merge"` | Merges resource references into existing extra transactions |

You can customize the beacon app and selector:

```typescript
ci.setBeaconId(376092);        // default: safe200 on Voimain
ci.setBeaconSelector("58759fa2"); // default: nop()void
```

### Other Settings

```typescript
ci.setAgentName("my-dapp-v1");    // ARC-2 note prefix
ci.setDebug(true);                // debug logging
ci.setEnableRawBytes(true);       // return raw bytes instead of UTF-8 text
ci.setEnableParamsLastRoundMod(true); // constrain lastValid to firstValid + 50
ci.setAccounts(["ADDR1..."]);     // additional account references
ci.setStep(2);                    // step value for internal offset calculation
```

## Events

### Querying Events by Name

Every event in the spec becomes a callable function on the instance:

```typescript
const transfers = await ci.ValueChanged({ minRound: 5_000_000 });
// transfers: [txId, confirmedRound, roundTime, ...decodedArgs][]
```

### Querying All Events

```typescript
const allEvents = await ci.getEvents({ minRound: 5_000_000, limit: 100 });
// allEvents: EventResult[] — one entry per event name
```

### Event Query Filters

| Filter | Type | Description |
|--------|------|-------------|
| `minRound` | `number` | Only events from rounds >= value |
| `maxRound` | `number` | Only events from rounds <= value |
| `address` | `string` | Filter by address |
| `round` | `number` | Exact round |
| `txid` | `string` | Exact transaction ID |
| `sender` | `string` | Filter by sender |
| `limit` | `number` | Max results per page |

### Event Helpers

```typescript
import { getEventSignature, getEventSelector } from "arccjs";

const sig = getEventSignature(eventSpec);
// "ValueChanged(uint64,uint64)"

const sel = getEventSelector(eventSpec);
// "a1b2c3d4" (first 4 bytes of SHA-512/256 hash, hex)
```

## Core Methods

### `createAppCallTxnObject(method, args)`

Build a raw transaction object (without simulation):

```typescript
const abiMethod = ci.contractABI.getMethodByName("setValue");
const obj = ci.createAppCallTxnObject(abiMethod, [42n]);
// { sender, appIndex, appArgs: [selector, ...encoded] }
```

### `createUtxns(method, args)`

Simulate, resolve resources, and build the full unsigned transaction group:

```typescript
const abiMethod = ci.contractABI.getMethodByName("setValue");
const utxns = await ci.createUtxns(abiMethod, [42n]);
// string[] — base64-encoded unsigned transactions with group ID
```

### `simulateTxn(method, args)`

Simulate and return the raw algod response:

```typescript
const abiMethod = ci.contractABI.getMethodByName("setValue");
const response = await ci.simulateTxn(abiMethod, [42n]);
// SimulateResponse — check response.txnGroups[0].failureMessage
```

### `signTxns(utxns, sk)`

Sign an array of base64 unsigned transactions:

```typescript
const stxns = await ci.signTxns(utxns, account.sk);
// Uint8Array[] — signed transactions ready for sendRawTransaction
```

### `makeUNote(msg)`

Create an ARC-2 prefixed note:

```typescript
const note = ci.makeUNote("transfer tokens");
// Uint8Array: "arccjs-v3.0.4:u transfer tokens"
```

### `getRIndex()`

Compute the result index offset. Useful when prepended payments or transfers
shift the position of the main app call in the group:

```typescript
const offset = ci.getRIndex();
// number — 0 if no prepended txns, otherwise the count of prepended txns
```

## The `custom()` Method

`custom` is a reserved method name. When invoked, the CONTRACT assembles a
group solely from its `extraTxns`, `transfers`, and `optIns` — omitting
any primary app call. This is the mechanism `AtomicComposer` uses internally.

```typescript
ci.setExtraTxns([...]);
ci.setTransfers([...]);
const result = await ci.custom();
```

## Simulation Response Decoding

The default `decodeSimulationResponse` handles:

- **void returns**: returns `null`
- **bool returns**: includes a workaround for early ARC-72 contracts that
  return `uint64` instead of `bool`
- **byte array returns**: decoded as UTF-8 text by default
  (set `enableRawBytes` for raw bytes)
- **all other types**: decoded via `algosdk.ABIType.decode()`

You can replace the handler:

```typescript
ci.simulationResultHandler = (response, abiMethod) => {
  // custom decoding logic
};
```
