import algosdk from "algosdk";
import CONTRACT from "./contract.js";
import type {
  ABIContractSpec,
  AlgodClient,
  BuildResult,
  ComposerOptions,
  ComposerSimulateResult,
  ExecuteResult,
  ExtraTxn,
  GroupResourceSharingStrategy,
  IndexerClient,
  IndexerLogQuery,
  OnComplete,
  SimulateResponse,
  StepOptions,
  StepSummary,
} from "../types.js";
import { Buffer } from "buffer";

// ---------------------------------------------------------------------------
// Internal step types
// ---------------------------------------------------------------------------

interface MethodCallStep {
  kind: "methodCall";
  contract: CONTRACT;
  methodName: string;
  args: unknown[];
  options: StepOptions;
}

interface PaymentStep {
  kind: "payment";
  receiver: string;
  amount: number;
  note?: string;
}

interface AssetOptInStep {
  kind: "assetOptIn";
  assetId: number;
}

interface AssetTransferStep {
  kind: "assetTransfer";
  assetId: number;
  sender: string;
  receiver: string;
  amount: number;
  note?: string;
}

type InternalStep = MethodCallStep | PaymentStep | AssetOptInStep | AssetTransferStep;

// ---------------------------------------------------------------------------
// Null indexer (used when no indexer is provided to the composer)
// ---------------------------------------------------------------------------

function createNullIndexerQuery(): IndexerLogQuery {
  const q: IndexerLogQuery = {
    nextToken: () => q,
    minRound: () => q,
    maxRound: () => q,
    sender: () => q,
    round: () => q,
    txid: () => q,
    limit: () => q,
    do: async () => ({ logData: [] }),
  };
  return q;
}

const nullIndexer: IndexerClient = {
  lookupApplicationLogs: () => createNullIndexerQuery(),
};

// ---------------------------------------------------------------------------
// Driver spec — minimal ABI spec with just a `custom` method
// ---------------------------------------------------------------------------

const composerDriverSpec: ABIContractSpec = {
  name: "arccjs-composer",
  methods: [{ name: "custom", args: [], returns: { type: "void" } }],
  events: [],
};

// ---------------------------------------------------------------------------
// AtomicComposer
// ---------------------------------------------------------------------------

/**
 * High-level builder for multi-contract atomic transaction groups.
 *
 * Eliminates the need to manually extract `.obj`, maintain transaction
 * arrays, or create a glue CONTRACT instance. Internally delegates to
 * the existing CONTRACT simulation and transaction-building machinery.
 *
 * @example
 * ```ts
 * const composer = new AtomicComposer({ algod, sender: myAddress });
 *
 * const { txns } = await composer
 *   .addMethodCall(tokenContract, "arc200_approve", [spender, amount])
 *   .addMethodCall(lendingContract, "liquidate", [marketId, user, amount], {
 *     payment: 2_000_000,
 *   })
 *   .withResourceSharing()
 *   .build();
 * ```
 */
export class AtomicComposer {
  private algodClient: AlgodClient;
  private sender: string;
  private indexerClient: IndexerClient;
  private steps: InternalStep[] = [];
  private resourceSharingEnabled = false;
  private resourceSharingStrategy: GroupResourceSharingStrategy = "default";
  private agentName?: string;

  constructor(options: ComposerOptions) {
    this.algodClient = options.algod;
    this.sender = options.sender;
    this.indexerClient = options.indexer ?? nullIndexer;
    this.agentName = options.agentName;
  }

  // -----------------------------------------------------------------------
  // Step builders (chainable)
  // -----------------------------------------------------------------------

  /**
   * Add an ABI method call to the atomic group.
   *
   * The method is resolved from the contract's ABI spec at call time,
   * so invalid method names fail immediately.
   */
  addMethodCall(
    contract: CONTRACT,
    methodName: string,
    args: unknown[],
    options?: StepOptions,
  ): this {
    contract.contractABI.getMethodByName(methodName);
    this.steps.push({
      kind: "methodCall",
      contract,
      methodName,
      args,
      options: options ?? {},
    });
    return this;
  }

  /**
   * Add a standalone ALGO payment to any address.
   * Appears at the beginning of the group, before app calls.
   */
  addPayment(
    receiver: string,
    amount: number,
    note?: string,
  ): this {
    this.steps.push({ kind: "payment", receiver, amount, note });
    return this;
  }

  /**
   * Add an ASA opt-in (zero-amount self-transfer).
   * Appears at the end of the group, after app calls.
   */
  addAssetOptIn(assetId: number): this {
    this.steps.push({ kind: "assetOptIn", assetId });
    return this;
  }

  /**
   * Add a standalone ASA transfer to an arbitrary address.
   * Implemented as an ExtraTxn with `ignore: true` (no app call),
   * preserving only the inner asset transfer side-effect.
   */
  addAssetTransfer(
    assetId: number,
    sender: string,
    receiver: string,
    amount: number,
    note?: string,
  ): this {
    this.steps.push({
      kind: "assetTransfer",
      assetId,
      sender,
      receiver,
      amount,
      note,
    });
    return this;
  }

  /**
   * Enable group resource sharing for the atomic group.
   * The AVM runtime will distribute account, asset, app, and box
   * references across beacon transactions when limits are exceeded.
   */
  withResourceSharing(
    strategy: GroupResourceSharingStrategy = "default",
  ): this {
    this.resourceSharingEnabled = true;
    this.resourceSharingStrategy = strategy;
    return this;
  }

  // -----------------------------------------------------------------------
  // Inspection
  // -----------------------------------------------------------------------

  /** Return a summary of all steps added so far. */
  getSteps(): StepSummary[] {
    return this.steps.map((step): StepSummary => {
      switch (step.kind) {
        case "methodCall":
          return {
            kind: "methodCall",
            description:
              step.options.note ??
              `${step.contract.spec.name}.${step.methodName}`,
            contractId: step.contract.contractId,
            methodName: step.methodName,
          };
        case "payment":
          return {
            kind: "payment",
            description:
              step.note ??
              `Pay ${(step.amount / 1e6).toFixed(6)} ALGO to ${step.receiver}`,
          };
        case "assetOptIn":
          return {
            kind: "assetOptIn",
            description: `Opt in to ASA ${step.assetId}`,
          };
        case "assetTransfer":
          return {
            kind: "assetTransfer",
            description:
              step.note ??
              `Transfer ${step.amount} of ASA ${step.assetId} to ${step.receiver}`,
          };
      }
    });
  }

  /** Number of steps currently in the plan. */
  get length(): number {
    return this.steps.length;
  }

  // -----------------------------------------------------------------------
  // Build / simulate / execute
  // -----------------------------------------------------------------------

  /**
   * Build the atomic group: simulates to resolve resource references,
   * then returns base64-encoded unsigned transactions with an assigned
   * group ID.
   *
   * The returned `txns` array is ready to be signed (e.g. by a wallet)
   * and submitted.
   */
  async build(): Promise<BuildResult> {
    this.assertNonEmpty();
    try {
      const driver = this.createDriverContract();
      const abiMethod = driver.contractABI.getMethodByName("custom");
      const utxns = await driver.createUtxns(abiMethod, []);
      if (!utxns) {
        return {
          success: false,
          txns: [],
          groupSize: 0,
          error: "Simulation failed — could not build transaction group",
        };
      }
      return { success: true, txns: utxns, groupSize: utxns.length };
    } catch (error) {
      return { success: false, txns: [], groupSize: 0, error };
    }
  }

  /**
   * Simulate the atomic group without building final unsigned
   * transactions. Useful for validation and fee estimation.
   */
  async simulate(): Promise<ComposerSimulateResult> {
    this.assertNonEmpty();
    try {
      const driver = this.createDriverContract();
      const abiMethod = driver.contractABI.getMethodByName("custom");
      const response: SimulateResponse = await driver.simulateTxn(
        abiMethod,
        [],
      );
      const failureMessage =
        response.txnGroups[0]?.failureMessage ?? undefined;
      return {
        success: !failureMessage,
        response,
        failureMessage,
      };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Build, sign with the provided secret key, and submit the atomic
   * group. Convenience for server-side or testing workflows.
   *
   * For wallet-based signing, use `build()` instead and pass the
   * unsigned transactions to your wallet adapter.
   */
  async execute(sk: Uint8Array): Promise<ExecuteResult> {
    const buildResult = await this.build();
    if (!buildResult.success) {
      return { success: false, error: buildResult.error };
    }
    try {
      const txns = buildResult.txns.map((utxn) =>
        algosdk.decodeUnsignedTransaction(Buffer.from(utxn, "base64")),
      );
      const stxns = txns.map((txn) => txn.signTxn(sk));
      const res = await this.algodClient.sendRawTransaction(stxns).do();
      return { success: true, txId: (res as Record<string, unknown>).txId as string };
    } catch (error) {
      return { success: false, error };
    }
  }

  // -----------------------------------------------------------------------
  // Internal: driver CONTRACT construction
  // -----------------------------------------------------------------------

  /** @internal visible for testing */
  createDriverContract(): CONTRACT {
    const firstAppStep = this.steps.find(
      (s): s is MethodCallStep => s.kind === "methodCall",
    );
    const contractId = firstAppStep?.contract.contractId ?? 0;

    const driver = new CONTRACT(
      contractId,
      this.algodClient,
      this.indexerClient,
      composerDriverSpec,
    );

    driver.sender = this.sender;

    if (this.agentName) {
      driver.setAgentName(this.agentName);
    }

    if (this.resourceSharingEnabled) {
      driver.setEnableGroupResourceSharing(true);
      driver.setGroupResourceSharingStrategy(this.resourceSharingStrategy);
    }

    const { extraTxns, transfers, optIns } = this.compileSteps();
    driver.setExtraTxns(extraTxns);
    driver.setTransfers(transfers);
    driver.setOptins(optIns);

    return driver;
  }

  // -----------------------------------------------------------------------
  // Internal: step compilation
  // -----------------------------------------------------------------------

  private compileSteps(): {
    extraTxns: ExtraTxn[];
    transfers: Array<[number, string]>;
    optIns: number[];
  } {
    const extraTxns: ExtraTxn[] = [];
    const transfers: Array<[number, string]> = [];
    const optIns: number[] = [];

    for (const step of this.steps) {
      switch (step.kind) {
        case "methodCall": {
          extraTxns.push(this.methodCallToExtraTxn(step));
          break;
        }
        case "payment": {
          transfers.push([step.amount, step.receiver]);
          break;
        }
        case "assetOptIn": {
          optIns.push(step.assetId);
          break;
        }
        case "assetTransfer": {
          extraTxns.push(this.assetTransferToExtraTxn(step));
          break;
        }
      }
    }

    return { extraTxns, transfers, optIns };
  }

  private methodCallToExtraTxn(step: MethodCallStep): ExtraTxn {
    const abiMethod = step.contract.contractABI.getMethodByName(
      step.methodName,
    );
    const appArgs = step.args.map((arg, i) =>
      (abiMethod.args[i].type as algosdk.ABIType).encode(
        arg as algosdk.ABIValue,
      ),
    );

    const extraTxn: ExtraTxn = {
      appIndex: step.contract.contractId,
      sender: this.sender,
      appArgs: [abiMethod.getSelector(), ...appArgs],
    };

    if (step.options.payment !== undefined) {
      extraTxn.payment = step.options.payment;
    }
    if (step.options.fee !== undefined) {
      extraTxn.fee = step.options.fee;
    }
    if (step.options.note !== undefined) {
      extraTxn.note = new TextEncoder().encode(step.options.note);
    }
    if (step.options.onComplete !== undefined) {
      extraTxn.onComplete = step.options.onComplete;
    }
    if (step.options.assetTransfer) {
      extraTxn.xaid = step.options.assetTransfer.assetId;
      extraTxn.aamt = step.options.assetTransfer.amount;
    }
    if (step.options.innerTransfer) {
      const it = step.options.innerTransfer;
      extraTxn.xaid = it.assetId;
      extraTxn.snd = it.sender;
      extraTxn.arcv = it.receiver;
      if (it.amount !== undefined && it.amount > 0) {
        extraTxn.xamt = it.amount;
      }
      if (it.note) {
        extraTxn.xano = it.note;
      }
    }
    if (step.options.accounts?.length) {
      extraTxn.accounts = step.options.accounts;
    }
    if (step.options.foreignApps?.length) {
      extraTxn.foreignApps = step.options.foreignApps;
    }
    if (step.options.foreignAssets?.length) {
      extraTxn.foreignAssets = step.options.foreignAssets;
    }
    if (step.options.boxes?.length) {
      extraTxn.boxes = step.options.boxes;
    }

    return extraTxn;
  }

  private assetTransferToExtraTxn(step: AssetTransferStep): ExtraTxn {
    const firstAppStep = this.steps.find(
      (s): s is MethodCallStep => s.kind === "methodCall",
    );
    return {
      appIndex: firstAppStep?.contract.contractId ?? 0,
      sender: this.sender,
      appArgs: [],
      ignore: true,
      xaid: step.assetId,
      snd: step.sender,
      arcv: step.receiver,
      xamt: step.amount,
      ...(step.note
        ? { xano: new TextEncoder().encode(step.note) }
        : {}),
    };
  }

  private assertNonEmpty(): void {
    if (this.steps.length === 0) {
      throw new Error("AtomicComposer has no steps — add at least one before building");
    }
  }
}
