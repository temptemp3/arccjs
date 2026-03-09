import algosdk, { encodeAddress, bytesToBigInt } from "algosdk";
import { oneAddress } from "../utils/account.js";
import { Buffer } from "buffer";
import { sha512_256 } from "js-sha512";
import { version } from "../version.js";
import type {
  ABIContractSpec,
  ABIEventSpec,
  AccountWithSk,
  AlgodClient,
  EventQuery,
  EventResult,
  ExtraTxn,
  GroupResourceSharingStrategy,
  IndexerClient,
  MethodCallResult,
  OnComplete,
  SendResult,
  SimulateResponse,
  SimulationResult,
  UnnamedResourcesAccessed,
} from "../types.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Beacon app ID (safe200 on Voimain) for group resource sharing */
const ctcInfoBc200 = 376092;

/** ABI method selector for nop()void */
const selNop = "58759fa2";

const noOpOC: OnComplete = 0;
const deleteApplicationOC: OnComplete = 5;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function extractAppCallTxnObjReferenced(txn: Record<string, unknown>) {
  return {
    accounts: (txn.accounts as string[]) || [],
    foreignApps: (txn.foreignApps as number[]) || [],
    foreignAssets: (txn.foreignAssets as number[]) || [],
    boxes:
      (txn.boxes as Array<{ appIndex: number; name: Uint8Array }>) || [],
  };
}

/**
 * Build an ARC-2 compliant note prefix.
 * Format: `{agent}:{dataFormat}`
 */
function makeARC2Prefix(
  agent: string,
  dataFormat: string = "u",
): string {
  const dataFormatInput = dataFormat[0];
  let dataFormatEnum: string;
  switch (dataFormatInput) {
    case "m":
    case "j":
    case "b":
    case "u":
      dataFormatEnum = dataFormatInput;
      break;
    default:
      dataFormatEnum = "u";
  }
  return `${agent}:${dataFormatEnum}`;
}

async function doWaitForConfirmation(
  algodClient: AlgodClient,
  txId: string,
): Promise<void> {
  const status = await algodClient.status().do();
  let lastRound = status["last-round"] as number;
  while (true) {
    const pendingInfo = await algodClient
      .pendingTransactionInformation(txId)
      .do();
    if (
      pendingInfo["confirmed-round"] !== null &&
      (pendingInfo["confirmed-round"] as number) > 0
    ) {
      break;
    }
    lastRound++;
    await algodClient.statusAfterBlock(lastRound).do();
  }
}

// ---------------------------------------------------------------------------
// Hashing / event helpers
// ---------------------------------------------------------------------------

/** SHA-512/256 hash as a number array. */
export const genericHash = (arr: string | Uint8Array): number[] => {
  return sha512_256.array(arr);
};

/** Build the canonical ABI event signature string. */
export const getEventSignature = (event: ABIEventSpec): string => {
  return (
    event.name + "(" + event.args.map((a) => a.type).join(",") + ")"
  );
};

/** First 4 bytes of the event signature hash, as a hex string. */
export const getEventSelector = (event: ABIEventSpec): string => {
  return Buffer.from(
    genericHash(getEventSignature(event)).slice(0, 4),
  ).toString("hex");
};

// ---------------------------------------------------------------------------
// Event decoding
// ---------------------------------------------------------------------------

const decodeEventArgs = (
  args: Array<{ type: string }>,
  x: string,
): unknown[] => {
  const argv = Buffer.from(x, "base64");
  let index = 4;
  const encoded: unknown[] = [];
  args.forEach(({ type }) => {
    switch (type) {
      case "address":
        encoded.push(encodeAddress(argv.slice(index, index + 32)));
        index += 32;
        break;
      case "(uint64)":
        encoded.push([bytesToBigInt(argv.slice(index, index + 8))]);
        index += 8;
        break;
      case "uint64":
        encoded.push(bytesToBigInt(argv.slice(index, index + 8)));
        index += 8;
        break;
      case "(uint256)":
        encoded.push([bytesToBigInt(argv.slice(index, index + 32))]);
        index += 32;
        break;
      case "uint256":
        encoded.push(bytesToBigInt(argv.slice(index, index + 32)));
        index += 32;
        break;
      case "byte":
        encoded.push(argv.slice(index, index + 1).toString("hex"));
        index += 1;
        break;
      case "byte[8]":
        encoded.push(argv.slice(index, index + 8).toString("hex"));
        index += 8;
        break;
      case "byte[32]":
        encoded.push(argv.slice(index, index + 32).toString("hex"));
        index += 32;
        break;
      case "byte[64]":
        encoded.push(argv.slice(index, index + 64).toString("hex"));
        index += 64;
        break;
      case "byte[96]":
        encoded.push(argv.slice(index, index + 96).toString("hex"));
        index += 96;
        break;
      case "(uint64,uint64,uint64)": {
        const a = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const b = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const c = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        encoded.push([a, b, c]);
        break;
      }
      case "(byte,byte[256])": {
        const a = argv.slice(index, index + 1).toString("hex");
        index += 1;
        const b = argv.slice(index, index + 256).toString("hex");
        index += 256;
        encoded.push([a, b]);
        break;
      }
      case "(address,(uint256,uint256))": {
        const a = encodeAddress(argv.slice(index, index + 32));
        index += 32;
        const b = bytesToBigInt(argv.slice(index, index + 32));
        index += 32;
        const c = bytesToBigInt(argv.slice(index, index + 32));
        index += 32;
        encoded.push([a, [b, c]]);
        break;
      }
      case "(uint64,uint64,uint64,uint64,(uint64,uint64),uint64,(byte,byte[8]),byte[8],uint64,byte[8],uint64,byte[8],uint64,uint64,byte[8],uint64)": {
        const a = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const b = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const c = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const d = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const e = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const f = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const g = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const h = argv.slice(index, index + 1).toString("hex");
        index += 1;
        const i = argv.slice(index, index + 8).toString("hex");
        index += 8;
        const j = argv.slice(index, index + 8).toString("hex");
        index += 8;
        const k = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const l = argv.slice(index, index + 8).toString("hex");
        index += 8;
        const m = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const n = argv.slice(index, index + 8).toString("hex");
        index += 8;
        const o = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const p = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const r = argv.slice(index, index + 8).toString("hex");
        index += 8;
        const s = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        encoded.push([a, b, c, d, [e, f], g, [h, i], j, k, l, m, n, o, p, r, s]);
        break;
      }
      case "byte[0]": {
        encoded.push([]);
        break;
      }
      case "bool": {
        encoded.push(bytesToBigInt(argv.slice(0, 1)));
        break;
      }
      case "(byte,byte[40])": {
        const a = argv.slice(index, index + 1).toString("hex");
        index += 1;
        if (a === "00") {
          const b = bytesToBigInt(argv.slice(index, index + 8));
          encoded.push([a, b]);
        } else {
          const b = argv.slice(index, index + 8).toString("hex");
          const c = argv.slice(index + 8, index + 40).toString("hex");
          encoded.push([a, b, c]);
        }
        index += 40;
        break;
      }
      case "uint64,(byte,byte[8]),uint64": {
        const a = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const b = argv.slice(index, index + 1).toString("hex");
        index += 1;
        const c = argv.slice(index, index + 8).toString("hex");
        index += 8;
        encoded.push([a, [b, c], bytesToBigInt(argv.slice(index, index + 8))]);
        break;
      }
      case "(uint256,uint256)": {
        const a = bytesToBigInt(argv.slice(index, index + 32));
        index += 32;
        const b = bytesToBigInt(argv.slice(index, index + 32));
        index += 32;
        encoded.push([a, b]);
        break;
      }
      case "(uint64,uint64)": {
        const a = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const b = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        encoded.push([a, b]);
        break;
      }
      case "((uint256),(uint256))": {
        const a = bytesToBigInt(argv.slice(index, index + 32));
        index += 32;
        const b = bytesToBigInt(argv.slice(index, index + 32));
        index += 32;
        encoded.push([[a], [b]]);
        break;
      }
      case "(uint256,uint256,uint256,address,byte)": {
        const a = bytesToBigInt(argv.slice(index, index + 32));
        index += 32;
        const b = bytesToBigInt(argv.slice(index, index + 32));
        index += 32;
        const c = bytesToBigInt(argv.slice(index, index + 32));
        index += 32;
        const d = encodeAddress(argv.slice(index, index + 32));
        index += 32;
        const e = argv.slice(index, index + 1).toString("hex");
        index += 1;
        encoded.push([a, b, c, d, e]);
        break;
      }
      case "(uint64,uint256,uint64,address,uint256,uint64,uint64)": {
        const a = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const b = bytesToBigInt(argv.slice(index, index + 32));
        index += 32;
        const c = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const d = encodeAddress(argv.slice(index, index + 32));
        index += 32;
        const e = bytesToBigInt(argv.slice(index, index + 32));
        index += 32;
        const f = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const g = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        encoded.push([a, b, c, d, e, f, g]);
        break;
      }
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  });
  return encoded;
};

// ---------------------------------------------------------------------------
// Event log helpers
// ---------------------------------------------------------------------------

const getSelectors = (logs: string[]): string[] =>
  logs.map((x) => Buffer.from(x, "base64").slice(0, 4).toString("hex"));

const isEvent = (selectors: string[], x: string[]): boolean =>
  selectors.some((y) => x.includes(y));

const selectEvent = (selector: string, mSelectors: string[]): number =>
  mSelectors.indexOf(selector);

interface MergedLogEntry {
  applicationId?: number;
  id: string;
  logs: string[];
  "confirmed-round"?: number;
  "round-time"?: number;
}

const getEvents = (
  txn: MergedLogEntry,
  selectors: string[],
): Record<string, unknown[]> => {
  const events: Record<string, unknown[]> = {};
  selectors.forEach((x) => (events[x] = []));
  if (!txn.logs) return {};
  const mSelectors = getSelectors(txn.logs);
  if (!isEvent(selectors, mSelectors)) return {};
  selectors.forEach((x) => {
    const index = selectEvent(x, mSelectors);
    if (index === -1) return;
    events[x] = [
      txn.id,
      txn["confirmed-round"],
      txn["round-time"],
      txn.logs[index],
    ];
  });
  return events;
};

interface ContractLike {
  spec: ABIContractSpec;
  contractId: number;
  indexerClient: IndexerClient;
}

const getEventByName = (events: ABIEventSpec[], name: string) => {
  const event = events.find((event) => event.name === name);
  if (!event) {
    throw new Error(`Event ${name} not found`);
  }
  return {
    getSelector: () => getEventSelector(event),
    next: () => {},
    nextUpToTime: () => {},
    nextUpToNow: () => {},
    seek: () => {},
    seekNow: () => {},
    lastTime: () => {},
    monitor: () => {},
  };
};

const getEventsByNames = async (
  ci: ContractLike,
  names: string[],
  query?: EventQuery,
): Promise<EventResult[]> => {
  const { minRound, maxRound, address, round, txid, sender, limit } =
    query || {};
  const events: Record<string, unknown[][]> = {};
  const selectorNameLookup: Record<string, string> = {};
  const selectorSignatureLookup: Record<string, string> = {};
  const selectors = names.map((x) => {
    const selector = getEventByName(ci.spec.events, x).getSelector();
    const signature = getEventSignature(
      ci.spec.events.find((y) => y.name === x)!,
    );
    selectorNameLookup[selector] = x;
    selectorSignatureLookup[selector] = signature;
    return selector;
  });
  selectors.forEach((x) => (events[x] = []));

  let next: string | undefined;

  const logs: Array<{ txid: string; logs: string[] }> = [];
  const logS = new Set<string>();
  next = undefined;
  do {
    const ilog = ci.indexerClient
      .lookupApplicationLogs(ci.contractId)
      .nextToken(next);
    if (minRound) ilog.minRound(minRound);
    if (maxRound) ilog.maxRound(maxRound);
    if (sender) ilog.sender(sender);
    if (round) ilog.round(round);
    if (txid) ilog.txid(txid);
    if (limit) ilog.limit(limit);
    const res = await ilog.do();
    if (next === res.nextToken) break;
    for (const log of res?.logData || []) {
      const key = log.txid + Buffer.from(log.logs as unknown as string).toString("base64");
      if (logS.has(key)) {
        continue;
      }
      logs.push({
        txid: log.txid,
        logs: log.logs,
      });
      logS.add(key);
    }
    next = res.nextToken;
  } while (next);

  const merged: MergedLogEntry[] = [];
  for (const log of logs) {
    const mergedLog: MergedLogEntry = {
      id: log.txid,
      logs: log.logs,
      "confirmed-round": undefined,
      "round-time": undefined,
    };
    merged.push(mergedLog);
  }

  for (const txn of merged) {
    const evts = getEvents(txn, selectors);
    for (const [k, v] of Object.entries(evts)) {
      if (!(v as unknown[]).length) continue;
      events[k].push(v as unknown[]);
    }
  }
  return (Object.entries(events) || []).map(([k, v]) => {
    const name = selectorNameLookup[k];
    const signature = selectorSignatureLookup[k];
    const selector = k;
    const evts = v.map((el) => [
      ...el.slice(0, 3),
      ...el
        .slice(3)
        .map((innerEl) =>
          decodeEventArgs(
            ci.spec.events.find((e) => e.name === name)!.args,
            innerEl as string,
          ),
        )
        .flat(),
    ]);
    evts.sort((a, b) => (a[1] as number) - (b[1] as number));
    return {
      name,
      signature,
      selector,
      events: evts,
    };
  });
};

// ---------------------------------------------------------------------------
// CONTRACT class
// ---------------------------------------------------------------------------

/**
 * ABI-centric transaction builder for Algorand smart contracts.
 *
 * Dynamically creates methods on the instance for each ABI method and event
 * defined in the supplied spec. Supports simulation-first workflows,
 * group resource sharing, extra transaction composition, and event querying.
 */
export default class CONTRACT {
  contractId: number;
  algodClient: AlgodClient;
  indexerClient: IndexerClient;
  spec: ABIContractSpec;
  contractABI: algosdk.ABIContract;
  sk: Uint8Array | undefined;
  simulate: boolean;
  paymentAmount: number;
  transfers: Array<[number, string]>;
  assetTransfers: Array<[number, number]>;
  accounts: string[];
  fee: number;
  simulationResultHandler: (
    response: SimulateResponse,
    abiMethod: algosdk.ABIMethod,
  ) => unknown;
  sender: string;
  waitForConfirmation: boolean;
  extraTxns: ExtraTxn[];
  objectOnly: boolean;
  enableGroupResourceSharing: boolean;
  groupResourceSharingStrategy: GroupResourceSharingStrategy;
  beaconId: number;
  beaconSel: string;
  optIns: number[];
  onComplete: OnComplete;
  agentName: string;
  step: number;
  debug: boolean;
  enableRawBytes: boolean;
  enableParamsLastRoundMod: boolean;

  /** Dynamic ABI method / event accessors (added at construction time). */
  [key: string]: unknown;

  constructor(
    contractId: number,
    algodClient: AlgodClient,
    indexerClient: IndexerClient,
    spec: ABIContractSpec,
    acc?: AccountWithSk | null,
    simulate: boolean = true,
    waitForConfirmation: boolean = false,
    objectOnly: boolean = false,
  ) {
    this.contractId = contractId;
    this.algodClient = algodClient;
    this.indexerClient = indexerClient;
    this.spec = spec;
    this.contractABI = new algosdk.ABIContract(spec);
    this.sk = acc?.sk;
    this.simulate = simulate;
    this.paymentAmount = 0;
    this.transfers = [];
    this.assetTransfers = [];
    this.accounts = [];
    this.fee = 1000;
    this.simulationResultHandler = this.decodeSimulationResponse;
    this.sender = acc?.addr ?? oneAddress;
    this.waitForConfirmation = waitForConfirmation;
    this.extraTxns = [];
    this.objectOnly = objectOnly;
    this.enableGroupResourceSharing = false;
    this.groupResourceSharingStrategy = "default";
    this.beaconId = ctcInfoBc200;
    this.beaconSel = selNop;
    this.optIns = [];
    this.onComplete = noOpOC;
    this.agentName = `arccjs-v${version}`;
    this.step = 2;
    this.debug = false;
    this.enableRawBytes = false;
    this.enableParamsLastRoundMod = false;

    for (const eventSpec of spec.events) {
      (this as Record<string, unknown>)[eventSpec.name] = async (
        ...args: unknown[]
      ): Promise<unknown[]> => {
        const response = await getEventsByNames(
          this,
          [eventSpec.name],
          ...(args as [EventQuery]),
        );
        return response[0]?.events ?? [];
      };
    }

    for (const methodSpec of spec.methods) {
      const abiMethod = this.contractABI.getMethodByName(methodSpec.name);
      (this as Record<string, unknown>)[methodSpec.name] = async (
        ...args: unknown[]
      ): Promise<MethodCallResult> => {
        if (methodSpec.readonly) {
          return await this.createAndSimulateTxn(abiMethod, args);
        } else {
          const obj = this.createAppCallTxnObject(abiMethod, args);
          if (this.objectOnly) {
            return { success: true, obj };
          }
          if (this.simulate) {
            const sim = await this.createAndSimulateTxn(abiMethod, args);
            if (sim.success) {
              const txns = await this.createUtxns(abiMethod, args);
              return { ...sim, txns };
            }
            return sim;
          }
          const res = await this.createAndSendTxn(abiMethod, args);
          if (this.waitForConfirmation && res.txId) {
            await doWaitForConfirmation(
              this.algodClient,
              res.txId as string,
            );
          }
          return res;
        }
      };
    }
  }

  // -----------------------------------------------------------------------
  // Getters
  // -----------------------------------------------------------------------

  getGroupResourceSharingStrategy(): GroupResourceSharingStrategy {
    return this.groupResourceSharingStrategy;
  }

  getOptIns(): number[] {
    return this.optIns;
  }

  getBeaconId(): number {
    return this.beaconId;
  }

  getBeaconSelector(): string {
    return this.beaconSel;
  }

  getEnableGroupResourceSharing(): boolean {
    return this.enableGroupResourceSharing;
  }

  getExtraTxns(): ExtraTxn[] {
    return this.extraTxns;
  }

  getContractId(): number {
    return this.contractId;
  }

  getSender(): string {
    return this.sender;
  }

  getSk(): Uint8Array | undefined {
    return this.sk;
  }

  getSimulate(): boolean {
    return this.simulate;
  }

  getOnComplete(): OnComplete {
    return this.onComplete;
  }

  getAgentName(): string {
    return this.agentName;
  }

  getStep(): number {
    return this.step;
  }

  getDebug(): boolean {
    return this.debug;
  }

  getEnableRawBytes(): boolean {
    return this.enableRawBytes;
  }

  getEnableParamsLastRoundMod(): boolean {
    return this.enableParamsLastRoundMod;
  }

  getAccounts(): string[] {
    return this.accounts;
  }

  // -----------------------------------------------------------------------
  // Setters
  // -----------------------------------------------------------------------

  setGroupResourceSharingStrategy(
    strategy: GroupResourceSharingStrategy,
  ): void {
    if ((["default", "merge"] as string[]).includes(strategy)) {
      this.groupResourceSharingStrategy = strategy;
    } else {
      throw new Error("Invalid group resource sharing strategy");
    }
  }

  setEnableParamsLastRoundMod(val: boolean): void {
    this.enableParamsLastRoundMod = val;
  }

  setEnableRawBytes(val: boolean): void {
    this.enableRawBytes = val;
  }

  setDebug(val: boolean): void {
    this.debug = val;
  }

  setStep(step: number): void {
    this.step = step;
  }

  setAgentName(name: string): void {
    this.agentName = name;
  }

  setOnComplete(oc: OnComplete): void {
    if ([noOpOC, deleteApplicationOC].includes(oc)) {
      this.onComplete = oc;
    }
  }

  setOptins(optIns: number[]): void {
    this.optIns = optIns;
  }

  setBeaconSelector(sel: string): void {
    this.beaconSel = sel;
  }

  setEnableGroupResourceSharing(val: boolean): void {
    this.enableGroupResourceSharing = val;
  }

  setExtraTxns(txns: ExtraTxn[]): void {
    this.extraTxns = txns;
  }

  setAccounts(accounts: string[]): void {
    this.accounts = accounts;
  }

  setTransfers(transfers: Array<[number, string]>): void {
    this.transfers = transfers;
  }

  setAssetTransfers(assetTransfers: Array<[number, number]>): void {
    this.assetTransfers = assetTransfers;
  }

  setPaymentAmount(amount: number): void {
    this.paymentAmount = amount;
  }

  setSimulate(val: boolean): void {
    this.simulate = val;
  }

  setFee(fee: number): void {
    this.fee = fee;
  }

  setBeaconId(id: number): void {
    this.beaconId = id;
  }

  // -----------------------------------------------------------------------
  // Event helpers
  // -----------------------------------------------------------------------

  getEventByName(event: string) {
    return getEventByName(this.spec.events, event);
  }

  getEvents(query?: EventQuery): Promise<EventResult[]> {
    return getEventsByNames(
      this,
      this.spec.events.map((x) => x.name),
      query,
    );
  }

  // -----------------------------------------------------------------------
  // Transaction building
  // -----------------------------------------------------------------------

  async createAndSendTxn(
    abiMethod: algosdk.ABIMethod,
    args: unknown[],
  ): Promise<SendResult> {
    try {
      const utxns = await this.createUtxns(abiMethod, args);
      if (!utxns) return { success: false, error: "Failed to create utxns" };
      const stxns = await this.signTxns(utxns, this.sk!);
      const res = await this.algodClient.sendRawTransaction(stxns).do();
      return { ...res, success: true } as SendResult;
    } catch (error) {
      return { success: false, error };
    }
  }

  async signTxns(
    utxnsB64: string[],
    sk: Uint8Array,
  ): Promise<Uint8Array[]> {
    const txns = utxnsB64.map((utxn) =>
      algosdk.decodeUnsignedTransaction(Buffer.from(utxn, "base64")),
    );
    const stxns = txns.map((txn) => txn.signTxn(sk));
    return stxns;
  }

  async createAndSimulateTxn(
    abiMethod: algosdk.ABIMethod,
    args: unknown[],
  ): Promise<MethodCallResult> {
    let response: SimulateResponse;
    try {
      response = await this.simulateTxn(abiMethod, args);
      return {
        success: true,
        returnValue: this.handleSimulationResponse(response, abiMethod),
        response,
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  createAppCallTxnObject(
    abiMethod: algosdk.ABIMethod,
    args: unknown[],
  ): Record<string, unknown> {
    const appArgs = args.map((arg, index) => {
      return (abiMethod.args[index].type as algosdk.ABIType).encode(
        arg as algosdk.ABIValue,
      );
    });
    return {
      sender: this.sender,
      appIndex: this.contractId,
      appArgs: [abiMethod.getSelector(), ...appArgs],
    };
  }

  async createUtxns(
    abiMethod: algosdk.ABIMethod,
    args: unknown[],
  ): Promise<string[] | undefined> {
    try {
      const sRes = await this.simulateTxn(abiMethod, args);
      if (!sRes) return;

      const params = await this.algodClient.getTransactionParams().do();
      if (this.enableParamsLastRoundMod) {
        params.lastValid = BigInt(params.firstValid) + BigInt(50);
      }

      const encodedArgs = args.map((arg, index) => {
        return (abiMethod.args[index].type as algosdk.ABIType).encode(
          arg as algosdk.ABIValue,
        );
      });

      const txns: algosdk.Transaction[] = [];

      const assetHoldingTxnObjs: Record<string, unknown>[] = [];
      const appLocalTxnObjs: Record<string, unknown>[] = [];
      const accountTxnObjs: Record<string, unknown>[] = [];
      const appBoxTxnObjs: Record<string, unknown>[] = [];

      let grsOffset = 0;
      if (this.enableGroupResourceSharing && this.extraTxns.length > 0) {
        const ura: UnnamedResourcesAccessed = {
          accounts: [],
          appLocals: [],
          apps: [],
          assetHoldings: [],
          assets: [],
          boxes: [],
          extraBoxRefs: [],
        };
        const gurs = sRes.txnGroups[0]?.unnamedResourcesAccessed ?? ura;

        const accounts = gurs?.accounts || [];

        const accountS = new Set(accounts);
        for (const account of this.getAccounts()) {
          accountS.add(account);
        }

        const apps = gurs?.apps || [];
        const appS = new Set(apps);

        const assets = gurs?.assets || [];
        const assetS = new Set(assets);

        const assetHoldings = gurs?.assetHoldings || [];
        for (const assetHolding of assetHoldings) {
          assetS.add(assetHolding.asset);
        }

        const assetHoldingStep = 4;
        const assetHoldingGroups: typeof assetHoldings[] = [];
        for (let i = 0; i < assetHoldings.length; i += assetHoldingStep) {
          assetHoldingGroups.push(
            assetHoldings.slice(i, i + assetHoldingStep),
          );
        }

        for (const assetHoldingGroup of assetHoldingGroups) {
          const groupAssetS = new Set<number>();
          const groupAccountS = new Set<string>();
          for (const assetHolding of assetHoldingGroup) {
            groupAssetS.add(assetHolding.asset);
            groupAccountS.add(assetHolding.account);
          }

          assetHoldingTxnObjs.push({
            suggestedParams: { ...params, flatFee: true, fee: 1000 },
            sender: this.sender,
            appIndex: this.beaconId,
            appArgs: [new Uint8Array(Buffer.from(this.beaconSel, "hex"))],
            accounts: Array.from(groupAccountS),
            foreignApps: [],
            foreignAssets: Array.from(groupAssetS),
            boxes: [],
            note: this.makeUNote(
              `AssetHoldings Group resource sharing transaction. AssetHoldings: ${assetHoldingGroup.length}`,
            ),
          });
        }

        const boxApps = (gurs?.boxes || []).map((x) => x.app);
        const boxNames = new Map<number, Uint8Array[]>();
        for (const box of gurs?.boxes || []) {
          if (!boxNames.has(box.app)) {
            boxNames.set(box.app, []);
          }
          boxNames.get(box.app)!.push(box.name);
        }
        grsOffset += boxApps.length;

        const appLocals = gurs?.appLocals || [];
        const appLocalStep = 4;
        const appLocalGroups: typeof appLocals[] = [];
        for (let i = 0; i < appLocals.length; i += appLocalStep) {
          appLocalGroups.push(appLocals.slice(i, i + appLocalStep));
        }
        for (const appLocalGroup of appLocalGroups) {
          const groupAppS = new Set<number>();
          const groupAccountS = new Set<string>();
          for (const appLocal of appLocalGroup) {
            groupAppS.add(appLocal.app);
            groupAccountS.add(appLocal.account);
          }

          appLocalTxnObjs.push({
            suggestedParams: { ...params, flatFee: true, fee: 1000 },
            sender: this.sender,
            appIndex: this.beaconId,
            appArgs: [new Uint8Array(Buffer.from(this.beaconSel, "hex"))],
            accounts: Array.from(groupAccountS),
            foreignApps: Array.from(groupAppS),
            foreignAssets: [],
            boxes: [],
            note: this.makeUNote(
              `${abiMethod.name} Group resource sharing transaction. AppLocals: ${appLocalGroup.length} Accounts: ${Array.from(groupAccountS).join(",")} Apps: ${Array.from(groupAppS).join(",")}`,
            ),
          });
        }

        const accountsGroups: string[][] = [];
        for (let i = 0; i < accounts.length; i += 4) {
          accountsGroups.push(accounts.slice(i, i + 4));
        }
        for (const accountsGroup of accountsGroups) {
          const foreignApps = Array.from(appS);
          const foreignAssets = Array.from(assetS);
          accountTxnObjs.push({
            suggestedParams: { ...params, flatFee: true, fee: 1000 },
            sender: this.sender,
            appIndex: this.beaconId,
            appArgs: [new Uint8Array(Buffer.from(this.beaconSel, "hex"))],
            accounts: accountsGroup,
            foreignApps,
            foreignAssets,
            boxes: [],
            note: this.makeUNote(
              `${abiMethod.name} Group resource sharing transaction. Accounts: ${accountsGroup.length} Assets: ${foreignAssets.length} Apps: ${foreignApps.length}`,
            ),
          });
        }

        for (const app of boxNames.keys()) {
          const names = boxNames.get(app)!;
          const boxNamesGroups: Uint8Array[][] = [];
          for (let i = 0; i < names.length; i += 7) {
            boxNamesGroups.push(names.slice(i, i + 7));
          }
          for (const boxNamesGroup of boxNamesGroups) {
            appBoxTxnObjs.push({
              suggestedParams: { ...params, flatFee: true, fee: 1000 },
              sender: this.sender,
              appIndex: this.beaconId,
              appArgs: [new Uint8Array(Buffer.from(this.beaconSel, "hex"))],
              accounts: [],
              foreignApps: [app],
              foreignAssets: [],
              boxes: boxNamesGroup.map((x) => ({
                appIndex: app,
                name: x,
              })),
              note: this.makeUNote(
                `${abiMethod.name} Group resource sharing transaction. Boxes: ${boxNamesGroup.length} Apps: 1 (${app})`,
              ),
            });
          }
        }
      }

      const groupResourceSharingTxns = [
        ...assetHoldingTxnObjs,
        ...appLocalTxnObjs,
        ...accountTxnObjs,
        ...appBoxTxnObjs,
      ];

      if (this.groupResourceSharingStrategy === "default") {
        txns.push(
          ...groupResourceSharingTxns.map((txnObj) =>
            algosdk.makeApplicationCallTxnFromObject({
              ...(txnObj as unknown as Parameters<
                typeof algosdk.makeApplicationCallTxnFromObject
              >[0]),
              onComplete: noOpOC,
            }),
          ),
        );
      }

      this.assetTransfers.forEach(([amount, token]) => {
        txns.push(
          algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            suggestedParams: { ...params, flatFee: true, fee: 1000 },
            sender: this.sender,
            receiver: algosdk.getApplicationAddress(this.contractId),
            amount,
            assetIndex: token,
          }),
        );
      });

      this.transfers.forEach(([amount, addr]) => {
        txns.push(
          algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            suggestedParams: { ...params, flatFee: true, fee: 1000 },
            sender: this.sender,
            receiver: addr,
            amount,
            note: this.makeUNote(
              `${abiMethod.name} Payment of ${(amount / 1e6).toLocaleString()} from ${this.sender} to ${addr}`,
            ),
          }),
        );
      });

      if (this.paymentAmount > 0) {
        txns.push(
          algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            sender: this.sender,
            receiver: algosdk.getApplicationAddress(this.contractId),
            amount: this.paymentAmount,
            suggestedParams: { ...params, flatFee: true, fee: 1000 },
            note: this.makeUNote(
              `${abiMethod.name} Payment to application`,
            ),
          }),
        );
      }

      const appCallTxns: Record<string, unknown>[] = [];

      if (abiMethod.name !== "custom") {
        appCallTxns.push({
          suggestedParams: { ...params, flatFee: true, fee: this.fee },
          sender: this.sender,
          appIndex: this.contractId,
          appArgs: [abiMethod.getSelector(), ...encodedArgs],
          note: this.makeUNote(`${abiMethod.name} transaction`),
        });
      }

      if (this.extraTxns.length > 0) {
        this.extraTxns.forEach((txn) => {
          const customNote = !txn.note
            ? `extra transaction`
            : new TextDecoder().decode(txn.note);
          const txnObj = {
            ...txn,
            suggestedParams: {
              ...params,
              flatFee: true,
              fee: txn.fee || this.fee,
            },
            note: this.makeUNote(`${abiMethod.name} ${customNote}`),
          };
          const srcTxn = txn.approvalProgram
            ? algosdk.makeApplicationCreateTxnFromObject(
                txnObj as Parameters<
                  typeof algosdk.makeApplicationCreateTxnFromObject
                >[0],
              )
            : algosdk.makeApplicationCallTxnFromObject({
                ...(txnObj as Parameters<
                  typeof algosdk.makeApplicationCallTxnFromObject
                >[0]),
                ...(this.groupResourceSharingStrategy === "merge"
                  ? extractAppCallTxnObjReferenced(
                      groupResourceSharingTxns.pop() || {},
                    )
                  : {}),
                onComplete: (txnObj.onComplete ??
                  this.getOnComplete()) as number,
              });

          if (
            txn.xaid &&
            txn.snd &&
            txn.arcv &&
            txn.snd !== txn.arcv &&
            txn.xamt
          ) {
            txns.push(
              algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
                suggestedParams: { ...params, flatFee: true, fee: 1000 },
                sender: txn.snd,
                receiver: txn.arcv,
                amount: txn.xamt,
                assetIndex: txn.xaid,
                note: txn.xano,
              }),
            );
          }
          if (
            txn.xaid &&
            txn.snd &&
            txn.arcv &&
            txn.snd === txn.arcv &&
            !txn.xamt
          ) {
            txns.push(
              algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
                suggestedParams: { ...params, flatFee: true, fee: 1000 },
                sender: txn.snd,
                receiver: txn.arcv,
                amount: 0,
                assetIndex: txn.xaid,
                note: this.makeUNote(
                  `${abiMethod.name} Asset optin for following transaction`,
                ),
              }),
            );
          }
          if (txn.payment) {
            txns.push(
              algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                suggestedParams: { ...params, flatFee: true, fee: 1000 },
                sender: this.sender,
                receiver: algosdk.getApplicationAddress(txn.appIndex),
                amount: txn.payment,
                note:
                  txn.paymentNote ||
                  this.makeUNote(
                    `${abiMethod.name} Payment to application`,
                  ),
              }),
            );
          }
          if (txn.xaid && txn.aamt) {
            txns.push(
              algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
                suggestedParams: { ...params, flatFee: true, fee: 1000 },
                sender: this.sender,
                receiver: algosdk.getApplicationAddress(txn.appIndex),
                amount: txn.aamt,
                assetIndex: txn.xaid,
                note: this.makeUNote(
                  `${abiMethod.name} Asset transfer to application`,
                ),
              }),
            );
          }
          if (!txn.ignore) {
            txns.push(srcTxn);
          }
        });
      } else {
        const offset = this.paymentAmount > 0 ? 1 : 0;
        const index =
          grsOffset +
          offset +
          this.assetTransfers.length +
          this.transfers.length;

        const ura: UnnamedResourcesAccessed = {
          accounts: [],
          appLocals: [],
          apps: [],
          assetHoldings: [],
          assets: [],
          boxes: [],
          extraBoxRefs: [],
        };
        const gurs = sRes.txnGroups[0]?.unnamedResourcesAccessed ?? ura;

        txns.push(
          ...appCallTxns.map((appCallTxn, j) =>
            algosdk.makeApplicationCallTxnFromObject(
              ((txn: Record<string, unknown>) => {
                const i = j + index;
                const turs =
                  sRes.txnGroups[0]?.txnResults[i]
                    ?.unnamedResourcesAccessed ?? ura;

                const tApps = Array.from(
                  new Set([
                    txn.appIndex as number,
                    ...(gurs?.apps ?? []),
                    ...(turs?.apps ?? []),
                  ]),
                );

                const tBoxes = [
                  ...(gurs?.boxes ?? []),
                  ...(turs?.boxes ?? []),
                ].map((x) => ({
                  appIndex: Number(x.app),
                  name: x.name,
                }));

                const tAccounts = Array.from(
                  new Set([
                    ...(gurs?.accounts ?? []),
                    ...(turs?.accounts ?? []),
                  ]),
                );

                const tAssets = Array.from(
                  new Set([
                    ...(gurs?.assets ?? []),
                    ...(turs?.assets ?? []),
                  ]),
                );

                const unnamedResourcesAccessed = {
                  accounts: tAccounts,
                  boxes: tBoxes,
                  foreignApps: tApps,
                  foreignAssets: tAssets,
                };

                return {
                  ...txn,
                  ...unnamedResourcesAccessed,
                  onComplete: this.getOnComplete(),
                  note: this.makeUNote(`${abiMethod.name} transaction`),
                } as Parameters<
                  typeof algosdk.makeApplicationCallTxnFromObject
                >[0];
              })(appCallTxn),
            ),
          ),
        );
      }

      if (this.optIns.length > 0) {
        const optInTxns = this.optIns.map((optIn) =>
          algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            suggestedParams: { ...params, flatFee: true, fee: 1000 },
            sender: this.sender,
            receiver: this.sender,
            amount: 0,
            assetIndex: optIn,
            note: this.makeUNote(
              `${abiMethod.name} Asset optin for asset ${optIn}`,
            ),
          }),
        );
        txns.push(...optInTxns);
      }

      const utxns = algosdk
        .assignGroupID(txns)
        .map((t) =>
          Buffer.from(algosdk.encodeUnsignedTransaction(t)).toString(
            "base64",
          ),
        );

      return utxns;
    } catch (error) {
      throw error;
    }
  }

  /** Build an ARC-2 prefixed note as a Uint8Array. */
  makeUNote(msg: string): Uint8Array {
    return new TextEncoder().encode(
      `${makeARC2Prefix(this.getAgentName())} ${msg}`,
    );
  }

  /** Compute the result index offset from prepended transactions. */
  getRIndex(): number {
    const offsets = [
      this.paymentAmount > 0 ? 1 : 0,
      this.assetTransfers.length,
      this.transfers.length,
    ];
    return offsets.reduce((a, b) => a + b, 0);
  }

  /**
   * Simulate an ABI method call and return the raw simulation response.
   */
  async simulateTxn(
    abiMethod: algosdk.ABIMethod,
    args: unknown[],
  ): Promise<SimulateResponse> {
    try {
      const params = await this.algodClient.getTransactionParams().do();
      if (this.enableParamsLastRoundMod) {
        params.lastValid = BigInt(params.firstValid) + BigInt(50);
      }

      const acctInfo = await this.algodClient
        .accountInformation(this.sender)
        .do();

      const authAddr = acctInfo?.authAddr
        ? algosdk.encodeAddress(acctInfo.authAddr.publicKey)
        : acctInfo.address;

      const encodedArgs = args.map((arg, index) => {
        return (abiMethod.args[index].type as algosdk.ABIType).encode(
          arg as algosdk.ABIValue,
        );
      });

      const txns: algosdk.Transaction[] = [];

      this.assetTransfers.forEach(([amount, token]) => {
        txns.push(
          algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            suggestedParams: { ...params, flatFee: true, fee: 1000 },
            sender: this.sender,
            receiver: algosdk.getApplicationAddress(this.contractId),
            amount,
            assetIndex: token,
          }),
        );
      });

      this.transfers.forEach(([amount, addr]) => {
        txns.push(
          algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            suggestedParams: { ...params, flatFee: true, fee: 1000 },
            sender: this.sender,
            receiver: addr,
            amount,
          }),
        );
      });

      if (this.paymentAmount > 0) {
        const toAddress = algosdk
          .getApplicationAddress(this.contractId)
          .toString();
        txns.push(
          algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            sender: this.sender,
            receiver: toAddress,
            amount: this.paymentAmount,
            suggestedParams: { ...params, flatFee: true, fee: 1000 },
          }),
        );
      }

      const appCallTxns: Record<string, unknown>[] = [];

      if (abiMethod.name !== "custom") {
        appCallTxns.push({
          suggestedParams: { ...params, flatFee: true, fee: this.fee },
          sender: this.sender,
          appIndex: this.contractId,
          appArgs: [abiMethod.getSelector(), ...encodedArgs],
          onComplete: this.getOnComplete(),
        });
      }

      if (this.extraTxns.length > 0) {
        this.extraTxns.forEach((txn) => {
          if (
            txn.xaid &&
            txn.snd &&
            txn.arcv &&
            txn.snd !== txn.arcv &&
            txn.xamt
          ) {
            txns.push(
              algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
                suggestedParams: {
                  ...params,
                  flatFee: true,
                  fee: 1000,
                },
                sender: txn.snd,
                receiver: txn.arcv,
                amount: txn.xamt,
                assetIndex: txn.xaid,
                note: txn.xano,
              }),
            );
          }
          if (
            txn.xaid &&
            txn.snd &&
            txn.arcv &&
            txn.snd === txn.arcv &&
            !txn.xamt
          ) {
            txns.push(
              algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
                suggestedParams: {
                  ...params,
                  flatFee: true,
                  fee: 1000,
                },
                sender: txn.snd,
                receiver: txn.arcv,
                amount: 0,
                assetIndex: txn.xaid,
              }),
            );
          }
          if (txn.payment) {
            txns.push(
              algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                suggestedParams: {
                  ...params,
                  flatFee: true,
                  fee: 1000,
                },
                sender: this.sender,
                receiver: algosdk.getApplicationAddress(txn.appIndex),
                amount: txn.payment,
              }),
            );
          }
          if (txn.xaid && txn.aamt) {
            txns.push(
              algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
                suggestedParams: {
                  ...params,
                  flatFee: true,
                  fee: 1000,
                },
                sender: this.sender,
                receiver: algosdk.getApplicationAddress(txn.appIndex),
                amount: txn.aamt,
                assetIndex: txn.xaid,
              }),
            );
          }
          txns.push(
            algosdk.makeApplicationCallTxnFromObject({
              ...(txn as unknown as Parameters<
                typeof algosdk.makeApplicationCallTxnFromObject
              >[0]),
              suggestedParams: {
                ...params,
                flatFee: true,
                fee: txn.fee || this.fee,
              },
              onComplete: (txn.onComplete ??
                this.getOnComplete()) as number,
            }),
          );
        });
      } else {
        txns.push(
          ...appCallTxns.map((appCallTxn) =>
            algosdk.makeApplicationCallTxnFromObject(
              appCallTxn as unknown as Parameters<
                typeof algosdk.makeApplicationCallTxnFromObject
              >[0],
            ),
          ),
        );
      }

      const txnGroup =
        new algosdk.modelsv2.SimulateRequestTransactionGroup({
          txns: algosdk.assignGroupID(txns).map((value) => {
            const encodedTxn =
              algosdk.encodeUnsignedSimulateTransaction(value);
            const signedTxn = algosdk.decodeSignedTransaction(encodedTxn);

            if (authAddr) {
              return new algosdk.SignedTransaction({
                txn: signedTxn.txn,
                sgnr: algosdk.decodeAddress(authAddr),
              });
            }

            return signedTxn;
          }),
        });

      const request = new algosdk.modelsv2.SimulateRequest({
        txnGroups: [txnGroup],
        allowUnnamedResources: true,
        allowEmptySignatures: true,
        fixSigners: true,
      });

      const response = await this.algodClient
        .simulateTransactions(request)
        .do();

      return response as unknown as SimulateResponse;
    } catch (error) {
      throw error;
    }
  }

  handleSimulationResponse(
    response: SimulateResponse,
    abiMethod: algosdk.ABIMethod,
  ): unknown {
    return this.simulationResultHandler(response, abiMethod);
  }

  decodeSimulationResponse(
    response: SimulateResponse,
    abiMethod: algosdk.ABIMethod,
  ): unknown {
    try {
      if (response.txnGroups[0].failureMessage) {
        throw response.txnGroups[0].failureMessage;
      }

      if (abiMethod.returns.type.toString() === "void") {
        return null;
      }

      const index = this.getRIndex();
      const rlog =
        response.txnGroups[0].txnResults[index].txnResult.logs.pop()!;
      const rlog_ui = Uint8Array.from(Buffer.from(rlog, "base64"));
      const res_ui = rlog_ui.slice(4);

      let result: unknown;

      const returnType = abiMethod.returns.type as algosdk.ABIType;

      if (abiMethod.returns.type.toString() === "bool") {
        // HACK: Some early arc72 contracts forgot to cast to bool
        if (res_ui.length === 8) {
          const r = res_ui.slice(-1);
          switch (r[0]) {
            case 0:
              result = returnType.decode(
                new Uint8Array(Buffer.from([0])),
              );
              break;
            case 1:
              result = returnType.decode(
                new Uint8Array(Buffer.from([128])),
              );
              break;
          }
        } else {
          result = returnType.decode(res_ui);
        }
      } else if (
        (returnType as unknown as { childType: string }).childType ===
          "byte" &&
        !this.enableRawBytes
      ) {
        // HACK: decode doesn't work well on byte arrays, decode as UTF-8 text
        result = new TextDecoder().decode(res_ui);
      } else {
        result = returnType.decode(res_ui);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }
}
