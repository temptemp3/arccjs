export { oneAddress, zeroAddress, getAccountInfo } from "./utils/account.js";
export { prepareString } from "./utils/string.js";
export { genericHash, getEventSignature, getEventSelector } from "./lib/contract.js";
export { default as CONTRACT, default } from "./lib/contract.js";
export { version } from "./version.js";

export type {
  ABIContractSpec,
  ABIMethodSpec,
  ABIEventSpec,
  ABIMethodArgSpec,
  ABIMethodReturnSpec,
  ABIEventArgSpec,
  AccountWithSk,
  AlgodClient,
  IndexerClient,
  EventQuery,
  EventResult,
  ExtraTxn,
  GroupResourceSharingStrategy,
  OnComplete,
  MethodCallResult,
  SendResult,
  SimulationResult,
  SimulateResponse,
} from "./types.js";
