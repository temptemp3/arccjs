import { describe, it, expect, vi, beforeEach } from "vitest";
import { Buffer } from "buffer";
import { AtomicComposer } from "./composer.js";
import CONTRACT from "./contract.js";
import type {
  ABIContractSpec,
  AlgodClient,
  IndexerClient,
} from "../types.js";

// ---------------------------------------------------------------------------
// Shared ABI specs
// ---------------------------------------------------------------------------

const arc200Spec: ABIContractSpec = {
  name: "arc200",
  methods: [
    {
      name: "arc200_approve",
      args: [
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      returns: { type: "bool" },
    },
    {
      name: "arc200_transfer",
      args: [
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      returns: { type: "bool" },
    },
  ],
  events: [],
};

const lendingSpec: ABIContractSpec = {
  name: "lending",
  methods: [
    {
      name: "liquidate",
      args: [
        { name: "marketId", type: "uint64" },
        { name: "user", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      returns: { type: "bool" },
    },
    {
      name: "borrow",
      args: [
        { name: "amount", type: "uint256" },
      ],
      returns: { type: "uint256" },
    },
  ],
  events: [],
};

// ---------------------------------------------------------------------------
// Mock algod client
// ---------------------------------------------------------------------------

const SENDER = "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ";
const SPENDER = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ";

function createMockAlgod(): AlgodClient {
  return {
    status: () => ({ do: async () => ({ "last-round": 1000 }) }),
    getTransactionParams: () => ({
      do: async () => ({
        flatFee: false,
        fee: BigInt(1000),
        firstValid: BigInt(1000),
        lastValid: BigInt(2000),
        genesisID: "testnet-v1.0",
        genesisHash: new Uint8Array(32),
      }),
    }),
    accountInformation: (_addr: string) => ({
      do: async () => ({ address: _addr, amount: 10_000_000 }),
    }),
    pendingTransactionInformation: () => ({
      do: async () => ({ "confirmed-round": 1001 }),
    }),
    statusAfterBlock: (_round: number) => ({
      do: async () => ({ "last-round": _round }),
    }),
    sendRawTransaction: (_stxns: Uint8Array[]) => ({
      do: async () => ({ txId: "MOCK_TX_ID_FROM_COMPOSER" }),
    }),
    simulateTransactions: () => ({
      do: async () => ({
        txnGroups: [
          {
            txnResults: [
              { txnResult: { logs: [] } },
              { txnResult: { logs: [] } },
            ],
          },
        ],
      }),
    }),
  } as unknown as AlgodClient;
}

function createMockIndexer(): IndexerClient {
  return {
    lookupApplicationLogs: () => {
      const q = {
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
    },
  } as unknown as IndexerClient;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTokenContract(algod: AlgodClient): CONTRACT {
  return new CONTRACT(
    6779767,
    algod,
    createMockIndexer(),
    arc200Spec,
  );
}

function makeLendingContract(algod: AlgodClient): CONTRACT {
  return new CONTRACT(
    9999999,
    algod,
    createMockIndexer(),
    lendingSpec,
  );
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe("AtomicComposer construction", () => {
  it("creates with minimal options", () => {
    const composer = new AtomicComposer({
      algod: createMockAlgod(),
      sender: SENDER,
    });
    expect(composer.length).toBe(0);
    expect(composer.getSteps()).toEqual([]);
  });

  it("accepts an optional indexer and agentName", () => {
    const composer = new AtomicComposer({
      algod: createMockAlgod(),
      indexer: createMockIndexer(),
      sender: SENDER,
      agentName: "test-agent",
    });
    expect(composer.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Step building
// ---------------------------------------------------------------------------

describe("addMethodCall", () => {
  it("adds a single method call step", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });

    composer.addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1000)]);

    expect(composer.length).toBe(1);
    const steps = composer.getSteps();
    expect(steps[0]).toEqual({
      kind: "methodCall",
      description: "arc200.arc200_approve",
      contractId: 6779767,
      methodName: "arc200_approve",
    });
  });

  it("is chainable", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const lending = makeLendingContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });

    const result = composer
      .addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1000)])
      .addMethodCall(lending, "liquidate", [BigInt(1), SENDER, BigInt(500)]);

    expect(result).toBe(composer);
    expect(composer.length).toBe(2);
  });

  it("throws for unknown method names", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });

    expect(() =>
      composer.addMethodCall(token, "nonexistent_method", []),
    ).toThrow();
  });

  it("uses custom note as step description", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });

    composer.addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1000)], {
      note: "approve debt token",
    });

    expect(composer.getSteps()[0].description).toBe("approve debt token");
  });
});

describe("addPayment", () => {
  it("adds a standalone payment step", () => {
    const composer = new AtomicComposer({
      algod: createMockAlgod(),
      sender: SENDER,
    });

    composer.addPayment(SPENDER, 1_000_000);

    expect(composer.length).toBe(1);
    const step = composer.getSteps()[0];
    expect(step.kind).toBe("payment");
    expect(step.description).toContain("1.000000 ALGO");
  });

  it("uses custom note as description", () => {
    const composer = new AtomicComposer({
      algod: createMockAlgod(),
      sender: SENDER,
    });

    composer.addPayment(SPENDER, 500_000, "fund account");

    expect(composer.getSteps()[0].description).toBe("fund account");
  });
});

describe("addAssetOptIn", () => {
  it("adds an asset opt-in step", () => {
    const composer = new AtomicComposer({
      algod: createMockAlgod(),
      sender: SENDER,
    });

    composer.addAssetOptIn(12345);

    expect(composer.length).toBe(1);
    expect(composer.getSteps()[0]).toEqual({
      kind: "assetOptIn",
      description: "Opt in to ASA 12345",
    });
  });
});

describe("withResourceSharing", () => {
  it("is chainable and sets default strategy", () => {
    const composer = new AtomicComposer({
      algod: createMockAlgod(),
      sender: SENDER,
    });

    const result = composer.withResourceSharing();
    expect(result).toBe(composer);
  });

  it("accepts a strategy parameter", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });

    composer
      .addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1000)])
      .withResourceSharing("merge");

    const driver = composer.createDriverContract();
    expect(driver.getEnableGroupResourceSharing()).toBe(true);
    expect(driver.getGroupResourceSharingStrategy()).toBe("merge");
  });
});

// ---------------------------------------------------------------------------
// Multi-step composition (the core use case)
// ---------------------------------------------------------------------------

describe("multi-contract composition", () => {
  it("composes approve + app call (the DorkFi pattern)", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const lending = makeLendingContract(algod);

    const composer = new AtomicComposer({ algod, sender: SENDER })
      .addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1000)], {
        note: "approve debt token",
      })
      .addMethodCall(
        lending,
        "liquidate",
        [BigInt(1), SENDER, BigInt(500)],
        { payment: 2_000_000, note: "liquidate cross market" },
      )
      .withResourceSharing();

    expect(composer.length).toBe(2);

    const steps = composer.getSteps();
    expect(steps[0].kind).toBe("methodCall");
    expect(steps[0].contractId).toBe(6779767);
    expect(steps[1].kind).toBe("methodCall");
    expect(steps[1].contractId).toBe(9999999);
  });

  it("composes payment + method call + opt-in", () => {
    const algod = createMockAlgod();
    const lending = makeLendingContract(algod);

    const composer = new AtomicComposer({ algod, sender: SENDER })
      .addPayment(SPENDER, 1_000_000, "fund receiver")
      .addMethodCall(lending, "borrow", [BigInt(5000)])
      .addAssetOptIn(42);

    expect(composer.length).toBe(3);
    const kinds = composer.getSteps().map((s) => s.kind);
    expect(kinds).toEqual(["payment", "methodCall", "assetOptIn"]);
  });
});

// ---------------------------------------------------------------------------
// Driver CONTRACT construction
// ---------------------------------------------------------------------------

describe("createDriverContract (internal)", () => {
  it("creates a driver with custom spec", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });
    composer.addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1000)]);

    const driver = composer.createDriverContract();

    expect(driver.contractId).toBe(6779767);
    expect(driver.sender).toBe(SENDER);
    expect(driver.spec.name).toBe("arccjs-composer");
  });

  it("sets agentName on the driver when configured", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({
      algod,
      sender: SENDER,
      agentName: "my-app",
    });
    composer.addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1000)]);

    const driver = composer.createDriverContract();
    expect(driver.getAgentName()).toBe("my-app");
  });

  it("configures resource sharing on the driver", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });
    composer
      .addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1000)])
      .withResourceSharing();

    const driver = composer.createDriverContract();
    expect(driver.getEnableGroupResourceSharing()).toBe(true);
    expect(driver.getGroupResourceSharingStrategy()).toBe("default");
  });

  it("converts method call steps to ExtraTxns", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });
    composer.addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1000)], {
      payment: 500_000,
      fee: 2000,
      note: "test note",
    });

    const driver = composer.createDriverContract();
    const extraTxns = driver.getExtraTxns();

    expect(extraTxns).toHaveLength(1);
    expect(extraTxns[0].appIndex).toBe(6779767);
    expect(extraTxns[0].sender).toBe(SENDER);
    expect(extraTxns[0].payment).toBe(500_000);
    expect(extraTxns[0].fee).toBe(2000);
    expect(extraTxns[0].note).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(extraTxns[0].note!)).toBe("test note");
    expect(extraTxns[0].appArgs).toBeDefined();
    expect(Array.isArray(extraTxns[0].appArgs)).toBe(true);
  });

  it("converts asset transfer options to ExtraTxn fields", () => {
    const algod = createMockAlgod();
    const lending = makeLendingContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });
    composer.addMethodCall(lending, "borrow", [BigInt(100)], {
      assetTransfer: { assetId: 42, amount: 1000 },
    });

    const driver = composer.createDriverContract();
    const extraTxns = driver.getExtraTxns();

    expect(extraTxns[0].xaid).toBe(42);
    expect(extraTxns[0].aamt).toBe(1000);
  });

  it("converts payment steps to driver transfers", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });
    composer
      .addPayment(SPENDER, 1_000_000)
      .addPayment(SENDER, 500_000)
      .addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1000)]);

    const driver = composer.createDriverContract();

    expect(driver.transfers).toEqual([
      [1_000_000, SPENDER],
      [500_000, SENDER],
    ]);
  });

  it("converts asset opt-in steps to driver optIns", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });
    composer
      .addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1000)])
      .addAssetOptIn(100)
      .addAssetOptIn(200);

    const driver = composer.createDriverContract();
    expect(driver.getOptIns()).toEqual([100, 200]);
  });
});

// ---------------------------------------------------------------------------
// build / simulate / execute
// ---------------------------------------------------------------------------

describe("build", () => {
  it("throws when called with no steps", async () => {
    const composer = new AtomicComposer({
      algod: createMockAlgod(),
      sender: SENDER,
    });
    await expect(composer.build()).rejects.toThrow("no steps");
  });

  it("returns a BuildResult with unsigned txns", async () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });
    composer.addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1000)]);

    const result = await composer.build();

    expect(result.success).toBe(true);
    expect(result.txns.length).toBeGreaterThan(0);
    expect(result.groupSize).toBe(result.txns.length);
    for (const txn of result.txns) {
      expect(typeof txn).toBe("string");
      expect(() => Buffer.from(txn, "base64")).not.toThrow();
    }
  });

  it("builds a two-step group", async () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const lending = makeLendingContract(algod);

    const composer = new AtomicComposer({ algod, sender: SENDER })
      .addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1000)])
      .addMethodCall(lending, "borrow", [BigInt(5000)]);

    const result = await composer.build();
    expect(result.success).toBe(true);
    expect(result.groupSize).toBe(2);
  });
});

describe("simulate", () => {
  it("throws when called with no steps", async () => {
    const composer = new AtomicComposer({
      algod: createMockAlgod(),
      sender: SENDER,
    });
    await expect(composer.simulate()).rejects.toThrow("no steps");
  });

  it("returns a simulation result", async () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });
    composer.addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1000)]);

    const result = await composer.simulate();

    expect(result.success).toBe(true);
    expect(result.response).toBeDefined();
    expect(result.response!.txnGroups).toBeDefined();
  });

  it("reports simulation failure", async () => {
    const algod = {
      ...createMockAlgod(),
      simulateTransactions: () => ({
        do: async () => ({
          txnGroups: [
            {
              failureMessage: "logic eval error: assert failed",
              txnResults: [],
            },
          ],
        }),
      }),
    } as unknown as AlgodClient;

    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });
    composer.addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1000)]);

    const result = await composer.simulate();

    expect(result.success).toBe(false);
    expect(result.failureMessage).toBe("logic eval error: assert failed");
  });
});

describe("execute", () => {
  it("throws when called with no steps", async () => {
    const composer = new AtomicComposer({
      algod: createMockAlgod(),
      sender: SENDER,
    });
    await expect(composer.execute(new Uint8Array(64))).rejects.toThrow(
      "no steps",
    );
  });

  it("builds, signs, and sends the group", async () => {
    const sendSpy = vi.fn(async () => ({ txId: "EXECUTED_TX_ID" }));
    const algod = {
      ...createMockAlgod(),
      sendRawTransaction: () => ({ do: sendSpy }),
    } as unknown as AlgodClient;

    const token = new CONTRACT(
      6779767,
      algod,
      createMockIndexer(),
      arc200Spec,
    );
    const composer = new AtomicComposer({ algod, sender: SENDER });
    composer.addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1000)]);

    const sk = new Uint8Array(64);
    const result = await composer.execute(sk);

    expect(result.success).toBe(true);
    expect(result.txId).toBe("EXECUTED_TX_ID");
    expect(sendSpy).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("edge cases", () => {
  it("handles a single payment-only composition", async () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });

    // A payment alone needs at least one app call to create a group
    // via the custom method. The driver CONTRACT with custom method
    // handles this, but the group will just be the payment + beacon.
    composer
      .addPayment(SPENDER, 1_000_000)
      .addMethodCall(token, "arc200_approve", [SPENDER, BigInt(0)]);

    const result = await composer.build();
    expect(result.success).toBe(true);
    expect(result.groupSize).toBeGreaterThanOrEqual(2);
  });

  it("preserves step order across mixed types", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const lending = makeLendingContract(algod);

    const composer = new AtomicComposer({ algod, sender: SENDER })
      .addPayment(SPENDER, 100_000)
      .addMethodCall(token, "arc200_approve", [SPENDER, BigInt(100)])
      .addMethodCall(lending, "borrow", [BigInt(200)])
      .addAssetOptIn(42);

    const steps = composer.getSteps();
    expect(steps).toHaveLength(4);
    expect(steps.map((s) => s.kind)).toEqual([
      "payment",
      "methodCall",
      "methodCall",
      "assetOptIn",
    ]);
  });

  it("supports onComplete override per step", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });
    composer.addMethodCall(token, "arc200_approve", [SPENDER, BigInt(0)], {
      onComplete: 5,
    });

    const driver = composer.createDriverContract();
    expect(driver.getExtraTxns()[0].onComplete).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Before / after comparison
// ---------------------------------------------------------------------------

describe("before/after: DorkFi-style composition", () => {
  it("new API eliminates manual .obj extraction and array management", () => {
    const algod = createMockAlgod();
    const indexer = createMockIndexer();

    // Contracts used by both old and new patterns
    const debtToken = new CONTRACT(6779767, algod, indexer, arc200Spec);
    const lending = new CONTRACT(9999999, algod, indexer, lendingSpec);

    // --- NEW PATTERN (AtomicComposer) ---
    const composer = new AtomicComposer({ algod, sender: SENDER })
      .addMethodCall(debtToken, "arc200_approve", [SPENDER, BigInt(1000)], {
        note: "approve debt token",
      })
      .addMethodCall(lending, "liquidate", [BigInt(1), SENDER, BigInt(500)], {
        payment: 2_000_000,
        note: "liquidate cross market",
      })
      .withResourceSharing();

    // Verify the composition
    expect(composer.length).toBe(2);
    expect(composer.getSteps()[0].description).toBe("approve debt token");
    expect(composer.getSteps()[1].description).toBe("liquidate cross market");

    // Verify the driver is correctly configured
    const driver = composer.createDriverContract();
    expect(driver.getEnableGroupResourceSharing()).toBe(true);
    expect(driver.getExtraTxns()).toHaveLength(2);
    expect(driver.getExtraTxns()[0].appIndex).toBe(6779767);
    expect(driver.getExtraTxns()[1].appIndex).toBe(9999999);
    expect(driver.getExtraTxns()[1].payment).toBe(2_000_000);
  });
});

// ---------------------------------------------------------------------------
// innerTransfer — paired asset opt-in / transfer with a method call
// ---------------------------------------------------------------------------

describe("innerTransfer (paired asset operations)", () => {
  it("pairs an asset opt-in with a method call (snd === arcv)", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });

    composer.addMethodCall(token, "arc200_transfer", [SPENDER, BigInt(100)], {
      innerTransfer: {
        assetId: 12345,
        sender: SENDER,
        receiver: SENDER,
      },
    });

    const driver = composer.createDriverContract();
    const txn = driver.getExtraTxns()[0];

    expect(txn.xaid).toBe(12345);
    expect(txn.snd).toBe(SENDER);
    expect(txn.arcv).toBe(SENDER);
    expect(txn.xamt).toBeUndefined();
  });

  it("pairs an asset transfer with a method call (snd !== arcv)", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const APP_ADDR = "XYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZ";
    const composer = new AtomicComposer({ algod, sender: SENDER });

    composer.addMethodCall(token, "arc200_transfer", [SPENDER, BigInt(100)], {
      innerTransfer: {
        assetId: 42,
        sender: SENDER,
        receiver: APP_ADDR,
        amount: 500,
      },
    });

    const driver = composer.createDriverContract();
    const txn = driver.getExtraTxns()[0];

    expect(txn.xaid).toBe(42);
    expect(txn.snd).toBe(SENDER);
    expect(txn.arcv).toBe(APP_ADDR);
    expect(txn.xamt).toBe(500);
  });

  it("includes xano when note is provided on innerTransfer", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const noteBytes = new TextEncoder().encode("deposit ASA");
    const composer = new AtomicComposer({ algod, sender: SENDER });

    composer.addMethodCall(token, "arc200_transfer", [SPENDER, BigInt(1)], {
      innerTransfer: {
        assetId: 99,
        sender: SENDER,
        receiver: SPENDER,
        amount: 10,
        note: noteBytes,
      },
    });

    const driver = composer.createDriverContract();
    const txn = driver.getExtraTxns()[0];

    expect(txn.xano).toBe(noteBytes);
  });

  it("can combine innerTransfer with payment on the same step", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });

    composer.addMethodCall(token, "arc200_transfer", [SPENDER, BigInt(1)], {
      innerTransfer: {
        assetId: 42,
        sender: SENDER,
        receiver: SENDER,
      },
      payment: 28_500,
      note: "opt-in + payment",
    });

    const driver = composer.createDriverContract();
    const txn = driver.getExtraTxns()[0];

    expect(txn.xaid).toBe(42);
    expect(txn.snd).toBe(SENDER);
    expect(txn.arcv).toBe(SENDER);
    expect(txn.payment).toBe(28_500);
  });
});

// ---------------------------------------------------------------------------
// Explicit resource references per step
// ---------------------------------------------------------------------------

describe("per-step resource references", () => {
  it("passes accounts to ExtraTxn", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });

    composer.addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1)], {
      accounts: [SPENDER, SENDER],
    });

    const driver = composer.createDriverContract();
    const txn = driver.getExtraTxns()[0];
    expect(txn.accounts).toEqual([SPENDER, SENDER]);
  });

  it("passes foreignApps to ExtraTxn", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });

    composer.addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1)], {
      foreignApps: [111, 222],
    });

    const driver = composer.createDriverContract();
    const txn = driver.getExtraTxns()[0];
    expect(txn.foreignApps).toEqual([111, 222]);
  });

  it("passes foreignAssets to ExtraTxn", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });

    composer.addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1)], {
      foreignAssets: [42, 99],
    });

    const driver = composer.createDriverContract();
    const txn = driver.getExtraTxns()[0];
    expect(txn.foreignAssets).toEqual([42, 99]);
  });

  it("passes boxes to ExtraTxn", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const boxName = new Uint8Array([0, 1, 2, 3]);
    const composer = new AtomicComposer({ algod, sender: SENDER });

    composer.addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1)], {
      boxes: [{ appIndex: 6779767, name: boxName }],
    });

    const driver = composer.createDriverContract();
    const txn = driver.getExtraTxns()[0];
    expect(txn.boxes).toEqual([{ appIndex: 6779767, name: boxName }]);
  });

  it("does not set empty arrays on ExtraTxn when omitted", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });

    composer.addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1)]);

    const driver = composer.createDriverContract();
    const txn = driver.getExtraTxns()[0];
    expect(txn.accounts).toBeUndefined();
    expect(txn.foreignApps).toBeUndefined();
    expect(txn.foreignAssets).toBeUndefined();
    expect(txn.boxes).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// addAssetTransfer — standalone ASA transfer
// ---------------------------------------------------------------------------

describe("addAssetTransfer", () => {
  it("adds a standalone asset transfer step", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });

    composer
      .addAssetTransfer(42, SENDER, SPENDER, 100, "send ASA")
      .addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1)]);

    expect(composer.length).toBe(2);
    const steps = composer.getSteps();
    expect(steps[0].kind).toBe("assetTransfer");
    expect(steps[0].description).toBe("send ASA");
  });

  it("creates an ExtraTxn with ignore: true", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });

    composer
      .addAssetTransfer(42, SENDER, SPENDER, 100)
      .addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1)]);

    const driver = composer.createDriverContract();
    const extraTxns = driver.getExtraTxns();

    expect(extraTxns).toHaveLength(2);
    expect(extraTxns[0].ignore).toBe(true);
    expect(extraTxns[0].xaid).toBe(42);
    expect(extraTxns[0].snd).toBe(SENDER);
    expect(extraTxns[0].arcv).toBe(SPENDER);
    expect(extraTxns[0].xamt).toBe(100);
  });

  it("is chainable", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });

    const result = composer
      .addAssetTransfer(42, SENDER, SPENDER, 100)
      .addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1)]);

    expect(result).toBe(composer);
  });

  it("generates default description when no note", () => {
    const algod = createMockAlgod();
    const token = makeTokenContract(algod);
    const composer = new AtomicComposer({ algod, sender: SENDER });

    composer
      .addAssetTransfer(42, SENDER, SPENDER, 100)
      .addMethodCall(token, "arc200_approve", [SPENDER, BigInt(1)]);

    const step = composer.getSteps()[0];
    expect(step.description).toContain("ASA 42");
    expect(step.description).toContain(SPENDER);
  });
});

// ---------------------------------------------------------------------------
// ulujs swap pattern: full composition
// ---------------------------------------------------------------------------

describe("ulujs swap patterns", () => {
  const swapSpec: ABIContractSpec = {
    name: "swap",
    methods: [
      {
        name: "Trader_swapAForB",
        args: [
          { name: "unused", type: "uint64" },
          { name: "amtIn", type: "uint256" },
          { name: "minOut", type: "uint256" },
        ],
        returns: { type: "(uint256,uint256)" },
      },
    ],
    events: [],
  };

  const nt200Spec: ABIContractSpec = {
    name: "nt200",
    methods: [
      {
        name: "deposit",
        args: [{ name: "amount", type: "uint256" }],
        returns: { type: "void" },
      },
      {
        name: "withdraw",
        args: [{ name: "amount", type: "uint256" }],
        returns: { type: "void" },
      },
    ],
    events: [],
  };

  it("VSA deposit: app call + ASA to app + payment (xaid+aamt+payment)", () => {
    const algod = createMockAlgod();
    const indexer = createMockIndexer();
    const tokA = new CONTRACT(111, algod, indexer, nt200Spec);

    const composer = new AtomicComposer({ algod, sender: SENDER })
      .addMethodCall(tokA, "deposit", [BigInt(1000)], {
        assetTransfer: { assetId: 42, amount: 1000 },
        payment: 28_500,
        note: "Deposit VSA",
      });

    const driver = composer.createDriverContract();
    const txn = driver.getExtraTxns()[0];

    expect(txn.appIndex).toBe(111);
    expect(txn.xaid).toBe(42);
    expect(txn.aamt).toBe(1000);
    expect(txn.payment).toBe(28_500);
  });

  it("withdraw with opt-in: app call + asset self-transfer before call", () => {
    const algod = createMockAlgod();
    const indexer = createMockIndexer();
    const tokB = new CONTRACT(222, algod, indexer, nt200Spec);

    const composer = new AtomicComposer({ algod, sender: SENDER })
      .addMethodCall(tokB, "withdraw", [BigInt(500)], {
        innerTransfer: {
          assetId: 99,
          sender: SENDER,
          receiver: SENDER,
        },
        note: "Withdraw with opt-in",
      });

    const driver = composer.createDriverContract();
    const txn = driver.getExtraTxns()[0];

    expect(txn.xaid).toBe(99);
    expect(txn.snd).toBe(SENDER);
    expect(txn.arcv).toBe(SENDER);
    expect(txn.xamt).toBeUndefined();
  });

  it("full swap flow: deposit + approve + swap + withdraw with opt-in", () => {
    const algod = createMockAlgod();
    const indexer = createMockIndexer();
    const tokA = new CONTRACT(111, algod, indexer, nt200Spec);
    const tokB = new CONTRACT(222, algod, indexer, nt200Spec);
    const pool = new CONTRACT(333, algod, indexer, swapSpec);
    const tokenA = new CONTRACT(111, algod, indexer, arc200Spec);

    const composer = new AtomicComposer({ algod, sender: SENDER })
      .addMethodCall(tokA, "deposit", [BigInt(1000)], {
        assetTransfer: { assetId: 42, amount: 1000 },
        payment: 28_500,
        note: "Deposit token A",
      })
      .addMethodCall(tokenA, "arc200_approve", [SPENDER, BigInt(1000)], {
        payment: 28_502,
        note: "Approve token A",
      })
      .addMethodCall(
        pool,
        "Trader_swapAForB",
        [BigInt(0), BigInt(1000), BigInt(900)],
        { note: "Swap A for B" },
      )
      .addMethodCall(tokB, "withdraw", [BigInt(900)], {
        innerTransfer: {
          assetId: 99,
          sender: SENDER,
          receiver: SENDER,
        },
        note: "Withdraw with opt-in",
      })
      .withResourceSharing("merge");

    expect(composer.length).toBe(4);

    const steps = composer.getSteps();
    expect(steps.map((s) => s.description)).toEqual([
      "Deposit token A",
      "Approve token A",
      "Swap A for B",
      "Withdraw with opt-in",
    ]);

    const driver = composer.createDriverContract();
    expect(driver.getEnableGroupResourceSharing()).toBe(true);
    expect(driver.getGroupResourceSharingStrategy()).toBe("merge");

    const extraTxns = driver.getExtraTxns();
    expect(extraTxns).toHaveLength(4);

    // Deposit: xaid + aamt + payment
    expect(extraTxns[0].xaid).toBe(42);
    expect(extraTxns[0].aamt).toBe(1000);
    expect(extraTxns[0].payment).toBe(28_500);

    // Approve: payment only
    expect(extraTxns[1].payment).toBe(28_502);

    // Swap: plain app call
    expect(extraTxns[2].appIndex).toBe(333);

    // Withdraw: opt-in paired
    expect(extraTxns[3].xaid).toBe(99);
    expect(extraTxns[3].snd).toBe(SENDER);
    expect(extraTxns[3].arcv).toBe(SENDER);
  });

  it("deposit with explicit resource references", () => {
    const algod = createMockAlgod();
    const indexer = createMockIndexer();
    const tokA = new CONTRACT(111, algod, indexer, nt200Spec);
    const POOL_APP_ADDR = "XYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZXYZ";

    const composer = new AtomicComposer({ algod, sender: SENDER })
      .addMethodCall(tokA, "deposit", [BigInt(1000)], {
        assetTransfer: { assetId: 42, amount: 1000 },
        payment: 28_503,
        accounts: [POOL_APP_ADDR],
        foreignApps: [111],
      });

    const driver = composer.createDriverContract();
    const txn = driver.getExtraTxns()[0];

    expect(txn.accounts).toEqual([POOL_APP_ADDR]);
    expect(txn.foreignApps).toEqual([111]);
    expect(txn.xaid).toBe(42);
    expect(txn.aamt).toBe(1000);
    expect(txn.payment).toBe(28_503);
  });
});
