# Type Reference

All public types are exported from the package entry point:

```typescript
import type {
  AlgodClient,
  IndexerClient,
  ABIContractSpec,
  ABIMethodSpec,
  ABIEventSpec,
  // ... etc
} from "arccjs";
```

## SDK Client Interfaces

### `AlgodClient`

Structural interface matching the subset of `algosdk.Algodv2` that arccjs uses.
You can pass a real `Algodv2` instance anywhere this type is expected.

```typescript
interface AlgodClient {
  status(): { do(): Promise<Record<string, unknown>> };
  getTransactionParams(): { do(): Promise<algosdk.SuggestedParams> };
  accountInformation(addr: string): { do(): Promise<AccountInfoResponse> };
  pendingTransactionInformation(txId: string): { do(): Promise<Record<string, unknown>> };
  statusAfterBlock(round: number): { do(): Promise<Record<string, unknown>> };
  sendRawTransaction(stxns: Uint8Array[]): { do(): Promise<Record<string, unknown>> };
  simulateTransactions(request: SimulateRequest): { do(): Promise<SimulateResponse> };
}
```

### `IndexerClient`

Structural interface for `algosdk.Indexer`. Only used by event queries.

```typescript
interface IndexerClient {
  lookupApplicationLogs(appId: number): IndexerLogQuery;
}
```

### `IndexerLogQuery`

Chainable query builder returned by `lookupApplicationLogs`.

```typescript
interface IndexerLogQuery {
  nextToken(token: string | undefined): IndexerLogQuery;
  minRound(round: number): IndexerLogQuery;
  maxRound(round: number): IndexerLogQuery;
  sender(addr: string): IndexerLogQuery;
  round(round: number): IndexerLogQuery;
  txid(id: string): IndexerLogQuery;
  limit(n: number): IndexerLogQuery;
  do(): Promise<IndexerLogResponse>;
}
```

## ABI Spec Types

These mirror the JSON schema consumed by `algosdk.ABIContract`.

### `ABIContractSpec`

```typescript
interface ABIContractSpec {
  name: string;
  description?: string;
  methods: ABIMethodSpec[];
  events: ABIEventSpec[];
}
```

### `ABIMethodSpec`

```typescript
interface ABIMethodSpec {
  name: string;
  args: ABIMethodArgSpec[];
  returns: ABIMethodReturnSpec;
  readonly?: boolean;  // if true, method is simulated only
  desc?: string;
}
```

### `ABIMethodArgSpec`

```typescript
interface ABIMethodArgSpec {
  name: string;
  type: string;  // ABI type: "address", "uint256", "(uint64,bool)", etc.
  desc?: string;
}
```

### `ABIMethodReturnSpec`

```typescript
interface ABIMethodReturnSpec {
  type: string;  // "void" for no return
  desc?: string;
}
```

### `ABIEventSpec`

```typescript
interface ABIEventSpec {
  name: string;
  args: ABIEventArgSpec[];
}
```

### `ABIEventArgSpec`

```typescript
interface ABIEventArgSpec {
  name: string;
  type: string;
}
```

## Account Types

### `AccountWithSk`

```typescript
interface AccountWithSk {
  addr: string;       // base32 Algorand address
  sk: Uint8Array;     // 64-byte Ed25519 secret key
}
```

### `AccountInfoResponse`

```typescript
interface AccountInfoResponse {
  address: string;
  authAddr?: { publicKey: Uint8Array };  // present when rekeyed
  [key: string]: unknown;
}
```

## Event Types

### `EventQuery`

All fields are optional. Omit a field to skip that filter.

```typescript
interface EventQuery {
  minRound?: number;
  maxRound?: number;
  address?: string;
  round?: number;
  txid?: string;
  sender?: string;
  limit?: number;
}
```

### `EventResult`

```typescript
interface EventResult {
  name: string;       // event name from spec
  signature: string;  // e.g. "arc200_Transfer(address,address,uint256)"
  selector: string;   // first 4 bytes of signature hash, hex
  events: unknown[][]; // [txId, confirmedRound, roundTime, ...decodedArgs][]
}
```

## Transaction Types

### `ExtraTxn`

Represents an additional transaction in an atomic group. Used by
`CONTRACT.setExtraTxns()` and internally by `AtomicComposer`.

```typescript
interface ExtraTxn {
  appIndex: number;
  appArgs?: Uint8Array[];
  accounts?: string[];
  foreignApps?: number[];
  foreignAssets?: number[];
  boxes?: Array<{ appIndex: number; name: Uint8Array }>;
  approvalProgram?: Uint8Array;
  clearProgram?: Uint8Array;
  onComplete?: number;
  fee?: number;
  note?: Uint8Array;
  payment?: number;          // ALGO payment to app address
  paymentNote?: Uint8Array;
  sender?: string;
  ignore?: boolean;          // omit the app call, keep side-effect txns
  // Asset transfer shorthand:
  xaid?: number;    // asset ID
  snd?: string;     // sender
  arcv?: string;    // receiver
  xamt?: number;    // amount
  xano?: Uint8Array; // note
  aamt?: number;    // amount to app address
  [key: string]: unknown;
}
```

### `OnComplete`

```typescript
type OnComplete = 0 | 5;  // 0 = NoOp, 5 = DeleteApplication
```

### `GroupResourceSharingStrategy`

```typescript
type GroupResourceSharingStrategy = "default" | "merge";
```

## Result Types

### `MethodCallResult`

Returned by dynamically-generated ABI methods on `CONTRACT`.

```typescript
interface MethodCallResult {
  success: boolean;
  returnValue?: unknown;         // decoded ABI return (readonly/simulate)
  response?: SimulateResponse;   // raw simulation response
  txns?: string[];               // base64 unsigned txns (simulate mode)
  obj?: Record<string, unknown>; // raw txn object (objectOnly mode)
  error?: unknown;
}
```

### `SendResult`

Returned by `CONTRACT.createAndSendTxn()`.

```typescript
interface SendResult {
  success: boolean;
  txId?: string;
  error?: unknown;
  [key: string]: unknown;
}
```

### `SimulationResult`

Discriminated union for simulation outcomes.

```typescript
type SimulationResult = SimulationSuccess | SimulationFailure;

interface SimulationSuccess {
  success: true;
  returnValue: unknown;
  response: SimulateResponse;
}

interface SimulationFailure {
  success: false;
  error: unknown;
}
```

## Simulation Response Types

### `SimulateResponse`

```typescript
interface SimulateResponse {
  txnGroups: SimulateTxnGroup[];
}
```

### `SimulateTxnGroup`

```typescript
interface SimulateTxnGroup {
  failureMessage?: string;
  unnamedResourcesAccessed?: UnnamedResourcesAccessed;
  txnResults: SimulateTxnResult[];
}
```

### `SimulateTxnResult`

```typescript
interface SimulateTxnResult {
  txnResult: {
    logs: string[];
    [key: string]: unknown;
  };
  unnamedResourcesAccessed?: UnnamedResourcesAccessed;
}
```

### `UnnamedResourcesAccessed`

Resources accessed by a transaction that were not explicitly referenced.
Used by group resource sharing to distribute references across beacon transactions.

```typescript
interface UnnamedResourcesAccessed {
  accounts: string[];
  appLocals: Array<{ app: number; account: string }>;
  apps: number[];
  assetHoldings: Array<{ asset: number; account: string }>;
  assets: number[];
  boxes: Array<{ app: number; name: Uint8Array }>;
  extraBoxRefs: unknown[];
}
```

## Indexer Response Types

### `IndexerLogResponse`

```typescript
interface IndexerLogResponse {
  logData?: IndexerLogEntry[];
  nextToken?: string;  // pagination
}
```

### `IndexerLogEntry`

```typescript
interface IndexerLogEntry {
  txid: string;
  logs: string[];
  round?: number;
  roundTime?: number;
  applicationId?: number;
}
```

## AtomicComposer Types

### `ComposerOptions`

```typescript
interface ComposerOptions {
  algod: AlgodClient;
  indexer?: IndexerClient;
  sender: string;
  agentName?: string;
}
```

### `StepOptions`

```typescript
interface StepOptions {
  note?: string;
  fee?: number;
  payment?: number;
  assetTransfer?: { assetId: number; amount: number };
  innerTransfer?: {
    assetId: number;
    sender: string;
    receiver: string;
    amount?: number;      // omit or 0 for opt-in (self-transfer)
    note?: Uint8Array;
  };
  onComplete?: 0 | 5;
  accounts?: string[];
  foreignApps?: number[];
  foreignAssets?: number[];
  boxes?: Array<{ appIndex: number; name: Uint8Array }>;
}
```

### `StepSummary`

```typescript
interface StepSummary {
  kind: "methodCall" | "payment" | "assetOptIn" | "assetTransfer";
  description: string;
  contractId?: number;
  methodName?: string;
}
```

### `BuildResult`

```typescript
interface BuildResult {
  success: boolean;
  txns: string[];       // base64 unsigned transactions
  groupSize: number;
  error?: unknown;
}
```

### `ComposerSimulateResult`

```typescript
interface ComposerSimulateResult {
  success: boolean;
  response?: SimulateResponse;
  failureMessage?: string;
  error?: unknown;
}
```

### `ExecuteResult`

```typescript
interface ExecuteResult {
  success: boolean;
  txId?: string;
  error?: unknown;
}
```
