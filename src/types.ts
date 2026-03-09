import type algosdk from "algosdk";

// ---------------------------------------------------------------------------
// Algorand SDK client types (structural, avoids coupling to exact SDK version)
// ---------------------------------------------------------------------------

/**
 * Minimal interface for an algod v2 client.
 *
 * Matches the subset of `algosdk.Algodv2` that arccjs actually uses.
 * You can pass a real `Algodv2` instance anywhere this type is expected.
 */
export interface AlgodClient {
  status(): { do(): Promise<Record<string, unknown>> };
  getTransactionParams(): { do(): Promise<algosdk.SuggestedParams> };
  accountInformation(addr: string): { do(): Promise<AccountInfoResponse> };
  pendingTransactionInformation(
    txId: string,
  ): { do(): Promise<Record<string, unknown>> };
  statusAfterBlock(round: number): { do(): Promise<Record<string, unknown>> };
  sendRawTransaction(
    stxns: Uint8Array[],
  ): { do(): Promise<Record<string, unknown>> };
  simulateTransactions(
    request: algosdk.modelsv2.SimulateRequest,
  ): { do(): Promise<SimulateResponse> };
}

/**
 * Minimal interface for an indexer v2 client.
 *
 * Matches the subset of `algosdk.Indexer` used by arccjs event queries.
 * Only required if you use event querying features.
 */
export interface IndexerClient {
  lookupApplicationLogs(appId: number): IndexerLogQuery;
}

/** Chainable indexer log query builder (mirrors algosdk's fluent API). */
export interface IndexerLogQuery {
  nextToken(token: string | undefined): IndexerLogQuery;
  minRound(round: number): IndexerLogQuery;
  maxRound(round: number): IndexerLogQuery;
  sender(addr: string): IndexerLogQuery;
  round(round: number): IndexerLogQuery;
  txid(id: string): IndexerLogQuery;
  limit(n: number): IndexerLogQuery;
  do(): Promise<IndexerLogResponse>;
}

// ---------------------------------------------------------------------------
// Account / key types
// ---------------------------------------------------------------------------

/** An Algorand account with its secret key, used for signing transactions. */
export interface AccountWithSk {
  /** Base32 Algorand address. */
  addr: string;
  /** 64-byte Ed25519 secret key. */
  sk: Uint8Array;
}

/** Shape of the response from `algodClient.accountInformation()`. */
export interface AccountInfoResponse {
  address: string;
  /** Present when the account is rekeyed to another authority. */
  authAddr?: { publicKey: Uint8Array };
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// ABI spec types (mirrors the JSON schema consumed by algosdk.ABIContract)
// ---------------------------------------------------------------------------

/** A single argument in an ABI method specification. */
export interface ABIMethodArgSpec {
  /** Argument name (used for documentation, not on-chain). */
  name: string;
  /** ABI type string, e.g. `"address"`, `"uint256"`, `"(uint64,bool)"`. */
  type: string;
  desc?: string;
}

/** Return type declaration for an ABI method. */
export interface ABIMethodReturnSpec {
  /** ABI type string for the return value. Use `"void"` for no return. */
  type: string;
  desc?: string;
}

/**
 * An ABI method specification.
 *
 * When `readonly` is true, the method is always simulated (never sent)
 * and its decoded return value is returned directly.
 */
export interface ABIMethodSpec {
  name: string;
  args: ABIMethodArgSpec[];
  returns: ABIMethodReturnSpec;
  /** If true, the method is read-only and will only be simulated. */
  readonly?: boolean;
  desc?: string;
}

/** A single argument in an ABI event specification. */
export interface ABIEventArgSpec {
  name: string;
  /** ABI type string for the event argument. */
  type: string;
}

/** An ABI event specification, used for on-chain event querying and decoding. */
export interface ABIEventSpec {
  name: string;
  args: ABIEventArgSpec[];
}

/**
 * Complete ABI contract specification.
 *
 * This is the JSON structure you pass to `new CONTRACT(...)` or load
 * from an ARC-4 / ARC-32 JSON file. It defines the methods, events,
 * and metadata for a smart contract.
 */
export interface ABIContractSpec {
  name: string;
  description?: string;
  methods: ABIMethodSpec[];
  events: ABIEventSpec[];
}

// ---------------------------------------------------------------------------
// Event query / response types
// ---------------------------------------------------------------------------

/**
 * Filters for querying on-chain ABI events via the indexer.
 * All fields are optional; omit a field to skip that filter.
 */
export interface EventQuery {
  /** Only return events from rounds >= this value. */
  minRound?: number;
  /** Only return events from rounds <= this value. */
  maxRound?: number;
  /** Filter by sender/receiver address. */
  address?: string;
  /** Filter by exact round number. */
  round?: number;
  /** Filter by exact transaction ID. */
  txid?: string;
  /** Filter by sender address. */
  sender?: string;
  /** Maximum number of results to return. */
  limit?: number;
}

/** A decoded event result from an on-chain query. */
export interface EventResult {
  /** Event name from the ABI spec. */
  name: string;
  /** Canonical ABI signature, e.g. `"arc200_Transfer(address,address,uint256)"`. */
  signature: string;
  /** First 4 bytes of the signature hash, as hex. */
  selector: string;
  /** Decoded event instances: `[txId, confirmedRound, roundTime, ...decodedArgs][]`. */
  events: unknown[][];
}

// ---------------------------------------------------------------------------
// Simulation response types (from algod simulate endpoint)
// ---------------------------------------------------------------------------

/** Resources accessed by a transaction that were not explicitly referenced. */
export interface UnnamedResourcesAccessed {
  accounts: string[];
  appLocals: Array<{ app: number; account: string }>;
  apps: number[];
  assetHoldings: Array<{ asset: number; account: string }>;
  assets: number[];
  boxes: Array<{ app: number; name: Uint8Array }>;
  extraBoxRefs: unknown[];
}

/** Result for a single transaction within a simulated group. */
export interface SimulateTxnResult {
  txnResult: {
    logs: string[];
    [key: string]: unknown;
  };
  unnamedResourcesAccessed?: UnnamedResourcesAccessed;
}

/** Result for one transaction group in a simulation response. */
export interface SimulateTxnGroup {
  /** If present, the simulation failed with this message. */
  failureMessage?: string;
  /** Group-level unnamed resources accessed across all transactions. */
  unnamedResourcesAccessed?: UnnamedResourcesAccessed;
  txnResults: SimulateTxnResult[];
}

/** Top-level response from `algodClient.simulateTransactions()`. */
export interface SimulateResponse {
  txnGroups: SimulateTxnGroup[];
}

// ---------------------------------------------------------------------------
// Indexer response types
// ---------------------------------------------------------------------------

/** A single log entry returned by the indexer. */
export interface IndexerLogEntry {
  txid: string;
  logs: string[];
  round?: number;
  roundTime?: number;
  applicationId?: number;
}

/** Response shape from `indexerClient.lookupApplicationLogs()`. */
export interface IndexerLogResponse {
  logData?: IndexerLogEntry[];
  /** Pagination token for fetching the next page. */
  nextToken?: string;
}

// ---------------------------------------------------------------------------
// CONTRACT configuration types
// ---------------------------------------------------------------------------

/**
 * Algorand transaction OnComplete action.
 * - `0` = NoOp (default)
 * - `5` = DeleteApplication
 */
export type OnComplete = 0 | 5;

/**
 * Strategy for distributing resource references across group transactions.
 * - `"default"` — create separate beacon transactions for each resource type
 * - `"merge"` — merge resource references into existing extra transactions
 */
export type GroupResourceSharingStrategy = "default" | "merge";

/**
 * An extra transaction to include in an atomic group.
 *
 * Used by `CONTRACT.setExtraTxns()` and internally by `AtomicComposer`.
 * Fields like `xaid`, `snd`, `arcv`, `xamt`, `aamt` are shorthand for
 * attaching asset transfers or opt-ins alongside the app call.
 */
export interface ExtraTxn {
  /** Application ID to call. */
  appIndex: number;
  /** ABI-encoded application arguments (selector + encoded args). */
  appArgs?: Uint8Array[];
  /** Additional account references. */
  accounts?: string[];
  /** Additional application references. */
  foreignApps?: number[];
  /** Additional asset references. */
  foreignAssets?: number[];
  /** Box references for this transaction. */
  boxes?: Array<{ appIndex: number; name: Uint8Array }>;
  /** If set, creates an application instead of calling one. */
  approvalProgram?: Uint8Array;
  clearProgram?: Uint8Array;
  /** OnComplete action override. */
  onComplete?: number;
  /** Fee override for this transaction (microALGOs). */
  fee?: number;
  /** Transaction note (raw bytes). */
  note?: Uint8Array;
  /** Attach an ALGO payment (microALGOs) to this step's application address. */
  payment?: number;
  /** Note for the attached payment transaction. */
  paymentNote?: Uint8Array;
  /** Sender address override. */
  sender?: string;
  /** If true, the app call itself is omitted (only side-effect txns are included). */
  ignore?: boolean;
  /** Asset ID for an attached asset transfer. */
  xaid?: number;
  /** Sender for the attached asset transfer. */
  snd?: string;
  /** Receiver for the attached asset transfer. */
  arcv?: string;
  /** Amount for the attached asset transfer. */
  xamt?: number;
  /** Note for the attached asset transfer. */
  xano?: Uint8Array;
  /** Amount for an asset transfer to the application address. */
  aamt?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Transaction building result types
// ---------------------------------------------------------------------------

/** Successful simulation result from a single CONTRACT method call. */
export interface SimulationSuccess {
  success: true;
  returnValue: unknown;
  response: SimulateResponse;
}

/** Failed simulation result from a single CONTRACT method call. */
export interface SimulationFailure {
  success: false;
  error: unknown;
}

/** Discriminated union for CONTRACT simulation outcomes. */
export type SimulationResult = SimulationSuccess | SimulationFailure;

/** Result of `CONTRACT.createAndSendTxn()`. */
export interface SendResult {
  success: boolean;
  txId?: string;
  error?: unknown;
  [key: string]: unknown;
}

/**
 * Result returned by dynamically-generated ABI method calls on CONTRACT.
 *
 * Shape varies by mode:
 * - **readonly method**: `{ success, returnValue, response }`
 * - **simulate mode**: `{ success, returnValue, response, txns }` (unsigned txns included on success)
 * - **objectOnly mode**: `{ success, obj }` (raw transaction object)
 * - **send mode**: `{ success, txId }`
 * - **failure**: `{ success: false, error }`
 */
export interface MethodCallResult {
  success: boolean;
  /** Decoded ABI return value (for readonly or simulated calls). */
  returnValue?: unknown;
  /** Raw simulation response. */
  response?: SimulateResponse;
  /** Base64-encoded unsigned transactions (when simulate mode succeeds). */
  txns?: string[];
  /** Raw transaction object (when objectOnly mode is enabled). */
  obj?: Record<string, unknown>;
  error?: unknown;
}

// ---------------------------------------------------------------------------
// AtomicComposer types
// ---------------------------------------------------------------------------

/**
 * Options for constructing an `AtomicComposer`.
 *
 * @example
 * ```ts
 * const composer = new AtomicComposer({
 *   algod: new algosdk.Algodv2("", "https://testnet-api.voi.nodly.io", ""),
 *   sender: "G3MSA75OZEJTC...",
 *   agentName: "my-dapp",
 * });
 * ```
 */
export interface ComposerOptions {
  /** Algod v2 client for simulation and submission. */
  algod: AlgodClient;
  /** Indexer v2 client (optional, only needed if the driver uses event queries). */
  indexer?: IndexerClient;
  /** Sender address for all transactions in the group. */
  sender: string;
  /** Override the default ARC-2 agent name in transaction notes. */
  agentName?: string;
}

/**
 * Per-step options when adding a method call to an `AtomicComposer`.
 *
 * @example
 * ```ts
 * composer.addMethodCall(contract, "deposit", [amount], {
 *   payment: 1_000_000,
 *   note: "deposit collateral",
 *   fee: 2000,
 * });
 * ```
 */
export interface StepOptions {
  /** Human-readable note included in the ARC-2 transaction note. */
  note?: string;
  /** Override the transaction fee for this step (microALGOs). */
  fee?: number;
  /** Attach an ALGO payment (microALGOs) to this step's application address. */
  payment?: number;
  /**
   * Attach an ASA transfer to this step's application address.
   * Maps to `ExtraTxn.xaid` + `ExtraTxn.aamt`.
   */
  assetTransfer?: { assetId: number; amount: number };
  /**
   * Pair an inner asset transfer with this method call.
   *
   * The transfer transaction is inserted immediately before the app call
   * in the atomic group. Maps to `ExtraTxn.xaid/snd/arcv/xamt/xano`.
   *
   * - When `sender === receiver` and `amount` is 0 or omitted, this becomes
   *   a zero-amount self-transfer (ASA opt-in).
   * - When `sender !== receiver`, this is a standard asset transfer.
   *
   * @example Opt-in before a withdraw call:
   * ```ts
   * composer.addMethodCall(token, "withdraw", [amount], {
   *   innerTransfer: { assetId: 12345, sender: myAddr, receiver: myAddr },
   * });
   * ```
   *
   * @example Transfer ASA to another address before a call:
   * ```ts
   * composer.addMethodCall(contract, "redeem", [amount], {
   *   innerTransfer: { assetId: 12345, sender: myAddr, receiver: appAddr, amount: 100 },
   * });
   * ```
   */
  innerTransfer?: {
    assetId: number;
    sender: string;
    receiver: string;
    amount?: number;
    note?: Uint8Array;
  };
  /** OnComplete action for this step (0 = NoOp, 5 = DeleteApplication). */
  onComplete?: OnComplete;
  /** Additional account references for this step. */
  accounts?: string[];
  /** Additional application references for this step. */
  foreignApps?: number[];
  /** Additional asset references for this step. */
  foreignAssets?: number[];
  /** Box references for this step. */
  boxes?: Array<{ appIndex: number; name: Uint8Array }>;
}

/**
 * Summary of a single step in the composition plan.
 * Returned by `AtomicComposer.getSteps()` for inspection before building.
 */
export interface StepSummary {
  /** Step type. */
  kind: "methodCall" | "payment" | "assetOptIn" | "assetTransfer";
  /** Human-readable description (from `note` option, or auto-generated). */
  description: string;
  /** Application ID (only for methodCall steps). */
  contractId?: number;
  /** ABI method name (only for methodCall steps). */
  methodName?: string;
}

/**
 * Result of `AtomicComposer.build()`.
 *
 * On success, `txns` contains base64-encoded unsigned transactions
 * with an assigned group ID, ready for wallet signing.
 */
export interface BuildResult {
  success: boolean;
  /** Base64-encoded unsigned transactions with assigned group ID. */
  txns: string[];
  /** Number of transactions in the group. */
  groupSize: number;
  error?: unknown;
}

/**
 * Result of `AtomicComposer.simulate()`.
 *
 * Use this to validate a group and check for failures before
 * building the final unsigned transactions.
 */
export interface ComposerSimulateResult {
  success: boolean;
  /** Raw simulation response from algod. */
  response?: SimulateResponse;
  /** Failure message from the simulation, if any. */
  failureMessage?: string;
  error?: unknown;
}

/**
 * Result of `AtomicComposer.execute()`.
 *
 * Contains the transaction ID on success. For wallet-based flows,
 * use `build()` instead and sign externally.
 */
export interface ExecuteResult {
  success: boolean;
  /** Transaction ID of the submitted group. */
  txId?: string;
  error?: unknown;
}
