import type algosdk from "algosdk";

// ---------------------------------------------------------------------------
// Algorand SDK client types (structural, avoids coupling to exact SDK version)
// ---------------------------------------------------------------------------

/** Minimal interface for an algod v2 client. */
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

/** Minimal interface for an indexer v2 client. */
export interface IndexerClient {
  lookupApplicationLogs(
    appId: number,
  ): IndexerLogQuery;
}

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

export interface AccountWithSk {
  addr: string;
  sk: Uint8Array;
}

export interface AccountInfoResponse {
  address: string;
  authAddr?: { publicKey: Uint8Array };
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// ABI spec types (mirrors the JSON schema consumed by algosdk.ABIContract)
// ---------------------------------------------------------------------------

export interface ABIMethodArgSpec {
  name: string;
  type: string;
  desc?: string;
}

export interface ABIMethodReturnSpec {
  type: string;
  desc?: string;
}

export interface ABIMethodSpec {
  name: string;
  args: ABIMethodArgSpec[];
  returns: ABIMethodReturnSpec;
  readonly?: boolean;
  desc?: string;
}

export interface ABIEventArgSpec {
  name: string;
  type: string;
}

export interface ABIEventSpec {
  name: string;
  args: ABIEventArgSpec[];
}

export interface ABIContractSpec {
  name: string;
  description?: string;
  methods: ABIMethodSpec[];
  events: ABIEventSpec[];
}

// ---------------------------------------------------------------------------
// Event query / response types
// ---------------------------------------------------------------------------

export interface EventQuery {
  minRound?: number;
  maxRound?: number;
  address?: string;
  round?: number;
  txid?: string;
  sender?: string;
  limit?: number;
}

export interface EventResult {
  name: string;
  signature: string;
  selector: string;
  events: unknown[][];
}

// ---------------------------------------------------------------------------
// Simulation response types (from algod simulate endpoint)
// ---------------------------------------------------------------------------

export interface UnnamedResourcesAccessed {
  accounts: string[];
  appLocals: Array<{ app: number; account: string }>;
  apps: number[];
  assetHoldings: Array<{ asset: number; account: string }>;
  assets: number[];
  boxes: Array<{ app: number; name: Uint8Array }>;
  extraBoxRefs: unknown[];
}

export interface SimulateTxnResult {
  txnResult: {
    logs: string[];
    [key: string]: unknown;
  };
  unnamedResourcesAccessed?: UnnamedResourcesAccessed;
}

export interface SimulateTxnGroup {
  failureMessage?: string;
  unnamedResourcesAccessed?: UnnamedResourcesAccessed;
  txnResults: SimulateTxnResult[];
}

export interface SimulateResponse {
  txnGroups: SimulateTxnGroup[];
}

// ---------------------------------------------------------------------------
// Indexer response types
// ---------------------------------------------------------------------------

export interface IndexerLogEntry {
  txid: string;
  logs: string[];
  round?: number;
  roundTime?: number;
  applicationId?: number;
}

export interface IndexerLogResponse {
  logData?: IndexerLogEntry[];
  nextToken?: string;
}

// ---------------------------------------------------------------------------
// CONTRACT configuration types
// ---------------------------------------------------------------------------

export type OnComplete = 0 | 5;
export type GroupResourceSharingStrategy = "default" | "merge";

export interface ExtraTxn {
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
  payment?: number;
  paymentNote?: Uint8Array;
  sender?: string;
  ignore?: boolean;
  xaid?: number;
  snd?: string;
  arcv?: string;
  xamt?: number;
  xano?: Uint8Array;
  aamt?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Transaction building result types
// ---------------------------------------------------------------------------

export interface SimulationSuccess {
  success: true;
  returnValue: unknown;
  response: SimulateResponse;
}

export interface SimulationFailure {
  success: false;
  error: unknown;
}

export type SimulationResult = SimulationSuccess | SimulationFailure;

export interface SendResult {
  success: boolean;
  txId?: string;
  error?: unknown;
  [key: string]: unknown;
}

export interface MethodCallResult {
  success: boolean;
  returnValue?: unknown;
  response?: SimulateResponse;
  txns?: string[];
  obj?: Record<string, unknown>;
  error?: unknown;
}
