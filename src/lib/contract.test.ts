import { describe, it, expect, vi, beforeEach } from "vitest";
import { Buffer } from "buffer";
import CONTRACT, {
  genericHash,
  getEventSignature,
  getEventSelector,
} from "./contract.js";
import type {
  ABIContractSpec,
  AlgodClient,
  IndexerClient,
} from "../types.js";

// ---------------------------------------------------------------------------
// Test ABI spec (minimal arc200 token)
// ---------------------------------------------------------------------------

const arc200Spec: ABIContractSpec = {
  name: "arc200",
  description: "ARC-200 token",
  methods: [
    {
      name: "arc200_name",
      args: [],
      returns: { type: "byte[32]" },
      readonly: true,
    },
    {
      name: "arc200_symbol",
      args: [],
      returns: { type: "byte[8]" },
      readonly: true,
    },
    {
      name: "arc200_decimals",
      args: [],
      returns: { type: "uint8" },
      readonly: true,
    },
    {
      name: "arc200_totalSupply",
      args: [],
      returns: { type: "uint256" },
      readonly: true,
    },
    {
      name: "arc200_balanceOf",
      args: [{ name: "owner", type: "address" }],
      returns: { type: "uint256" },
      readonly: true,
    },
    {
      name: "arc200_transfer",
      args: [
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      returns: { type: "bool" },
    },
    {
      name: "arc200_approve",
      args: [
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      returns: { type: "bool" },
    },
  ],
  events: [
    {
      name: "arc200_Transfer",
      args: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" },
      ],
    },
    {
      name: "arc200_Approval",
      args: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Mock clients
// ---------------------------------------------------------------------------

function createMockAlgodClient(): AlgodClient {
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
      do: async () => ({
        address: _addr,
        amount: 1000000,
      }),
    }),
    pendingTransactionInformation: (_txId: string) => ({
      do: async () => ({ "confirmed-round": 1001 }),
    }),
    statusAfterBlock: (_round: number) => ({
      do: async () => ({ "last-round": _round }),
    }),
    sendRawTransaction: (_stxns: Uint8Array[]) => ({
      do: async () => ({ txId: "MOCK_TX_ID" }),
    }),
    simulateTransactions: (_request: unknown) => ({
      do: async () => ({
        txnGroups: [
          {
            txnResults: [
              {
                txnResult: {
                  logs: [
                    Buffer.from(
                      new Uint8Array([0x15, 0x1f, 0x7c, 0x75, 0x80]),
                    ).toString("base64"),
                  ],
                },
              },
            ],
          },
        ],
      }),
    }),
  } as unknown as AlgodClient;
}

function createMockIndexerClient(): IndexerClient {
  return {
    lookupApplicationLogs: () => ({
      nextToken: () => ({
        minRound: () => ({
          maxRound: () => ({
            sender: () => ({
              round: () => ({
                txid: () => ({
                  limit: () => ({
                    do: async () => ({ logData: [] }),
                  }),
                  do: async () => ({ logData: [] }),
                }),
                do: async () => ({ logData: [] }),
              }),
              do: async () => ({ logData: [] }),
            }),
            do: async () => ({ logData: [] }),
          }),
          do: async () => ({ logData: [] }),
        }),
        do: async () => ({ logData: [] }),
      }),
      do: async () => ({ logData: [] }),
    }),
  } as unknown as IndexerClient;
}

// ---------------------------------------------------------------------------
// Hash / event signature tests
// ---------------------------------------------------------------------------

describe("genericHash", () => {
  it("produces correct SHA-512/256 for arc200_Transfer signature", () => {
    const hash = genericHash("arc200_Transfer(address,address,uint256)");
    const b64 = Buffer.from(hash).toString("base64");
    expect(b64).toBe("eYPDXE9BHdw1y+phqna8QMKDKxZtMEtj3ulg6bc/Xlk=");
  });

  it("returns a 32-byte (256-bit) array", () => {
    const hash = genericHash("test");
    expect(hash).toHaveLength(32);
  });

  it("is deterministic", () => {
    const a = genericHash("same input");
    const b = genericHash("same input");
    expect(a).toEqual(b);
  });

  it("produces different hashes for different inputs", () => {
    const a = genericHash("input_a");
    const b = genericHash("input_b");
    expect(a).not.toEqual(b);
  });
});

describe("getEventSignature", () => {
  it("builds the correct signature for arc200_Transfer", () => {
    expect(getEventSignature(arc200Spec.events[0])).toBe(
      "arc200_Transfer(address,address,uint256)",
    );
  });

  it("builds the correct signature for arc200_Approval", () => {
    expect(getEventSignature(arc200Spec.events[1])).toBe(
      "arc200_Approval(address,address,uint256)",
    );
  });

  it("handles events with no args", () => {
    expect(getEventSignature({ name: "Ping", args: [] })).toBe("Ping()");
  });
});

describe("getEventSelector", () => {
  it("returns first 4 bytes of hash as hex for arc200_Transfer", () => {
    expect(getEventSelector(arc200Spec.events[0])).toBe("7983c35c");
  });

  it("returns first 4 bytes of hash as hex for arc200_Approval", () => {
    expect(getEventSelector(arc200Spec.events[1])).toBe("1969f865");
  });

  it("returns an 8-character hex string", () => {
    const sel = getEventSelector({ name: "Test", args: [] });
    expect(sel).toHaveLength(8);
    expect(sel).toMatch(/^[0-9a-f]{8}$/);
  });
});

// ---------------------------------------------------------------------------
// CONTRACT construction tests
// ---------------------------------------------------------------------------

describe("CONTRACT construction", () => {
  let ci: CONTRACT;

  beforeEach(() => {
    ci = new CONTRACT(
      12345,
      createMockAlgodClient(),
      createMockIndexerClient(),
      arc200Spec,
    );
  });

  it("sets default values correctly", () => {
    expect(ci.getContractId()).toBe(12345);
    expect(ci.getSender()).toBe(
      "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
    );
    expect(ci.getSimulate()).toBe(true);
    expect(ci.getOnComplete()).toBe(0);
    expect(ci.getDebug()).toBe(false);
    expect(ci.getEnableRawBytes()).toBe(false);
    expect(ci.getEnableGroupResourceSharing()).toBe(false);
    expect(ci.getGroupResourceSharingStrategy()).toBe("default");
    expect(ci.getStep()).toBe(2);
    expect(ci.getBeaconId()).toBe(376092);
    expect(ci.getBeaconSelector()).toBe("58759fa2");
  });

  it("dynamically creates methods from the ABI spec", () => {
    expect(typeof ci.arc200_name).toBe("function");
    expect(typeof ci.arc200_symbol).toBe("function");
    expect(typeof ci.arc200_decimals).toBe("function");
    expect(typeof ci.arc200_totalSupply).toBe("function");
    expect(typeof ci.arc200_balanceOf).toBe("function");
    expect(typeof ci.arc200_transfer).toBe("function");
    expect(typeof ci.arc200_approve).toBe("function");
  });

  it("dynamically creates event accessors from the ABI spec", () => {
    expect(typeof ci.arc200_Transfer).toBe("function");
    expect(typeof ci.arc200_Approval).toBe("function");
  });

  it("uses custom sender when account is provided", () => {
    const ci2 = new CONTRACT(
      12345,
      createMockAlgodClient(),
      createMockIndexerClient(),
      arc200Spec,
      { addr: "CUSTOM_ADDR", sk: new Uint8Array(64) },
    );
    expect(ci2.getSender()).toBe("CUSTOM_ADDR");
    expect(ci2.getSk()).toBeInstanceOf(Uint8Array);
  });
});

// ---------------------------------------------------------------------------
// Getter / setter tests
// ---------------------------------------------------------------------------

describe("CONTRACT getters and setters", () => {
  let ci: CONTRACT;

  beforeEach(() => {
    ci = new CONTRACT(
      100,
      createMockAlgodClient(),
      createMockIndexerClient(),
      arc200Spec,
    );
  });

  it("setFee / getFee round-trips", () => {
    ci.setFee(2000);
    expect(ci.fee).toBe(2000);
  });

  it("setPaymentAmount persists", () => {
    ci.setPaymentAmount(500000);
    expect(ci.paymentAmount).toBe(500000);
  });

  it("setSimulate toggles simulation mode", () => {
    ci.setSimulate(false);
    expect(ci.getSimulate()).toBe(false);
    ci.setSimulate(true);
    expect(ci.getSimulate()).toBe(true);
  });

  it("setAccounts persists", () => {
    ci.setAccounts(["ADDR1", "ADDR2"]);
    expect(ci.getAccounts()).toEqual(["ADDR1", "ADDR2"]);
  });

  it("setTransfers persists", () => {
    ci.setTransfers([[1000000, "ADDR1"]]);
    expect(ci.transfers).toEqual([[1000000, "ADDR1"]]);
  });

  it("setAssetTransfers persists", () => {
    ci.setAssetTransfers([[100, 456]]);
    expect(ci.assetTransfers).toEqual([[100, 456]]);
  });

  it("setOnComplete only accepts valid values", () => {
    ci.setOnComplete(5);
    expect(ci.getOnComplete()).toBe(5);
    ci.setOnComplete(0);
    expect(ci.getOnComplete()).toBe(0);
    ci.setOnComplete(99 as unknown as 0);
    expect(ci.getOnComplete()).toBe(0);
  });

  it("setGroupResourceSharingStrategy validates input", () => {
    ci.setGroupResourceSharingStrategy("merge");
    expect(ci.getGroupResourceSharingStrategy()).toBe("merge");
    ci.setGroupResourceSharingStrategy("default");
    expect(ci.getGroupResourceSharingStrategy()).toBe("default");
    expect(() =>
      ci.setGroupResourceSharingStrategy(
        "invalid" as unknown as "default",
      ),
    ).toThrow("Invalid group resource sharing strategy");
  });

  it("setOptins persists", () => {
    ci.setOptins([100, 200, 300]);
    expect(ci.getOptIns()).toEqual([100, 200, 300]);
  });

  it("setExtraTxns persists", () => {
    const txns = [{ appIndex: 999, appArgs: [] }];
    ci.setExtraTxns(txns as any);
    expect(ci.getExtraTxns()).toEqual(txns);
  });

  it("setBeaconId / getBeaconId round-trips", () => {
    ci.setBeaconId(999999);
    expect(ci.getBeaconId()).toBe(999999);
  });

  it("setBeaconSelector / getBeaconSelector round-trips", () => {
    ci.setBeaconSelector("aabbccdd");
    expect(ci.getBeaconSelector()).toBe("aabbccdd");
  });

  it("setDebug / getDebug round-trips", () => {
    ci.setDebug(true);
    expect(ci.getDebug()).toBe(true);
  });

  it("setEnableRawBytes / getEnableRawBytes round-trips", () => {
    ci.setEnableRawBytes(true);
    expect(ci.getEnableRawBytes()).toBe(true);
  });

  it("setStep / getStep round-trips", () => {
    ci.setStep(5);
    expect(ci.getStep()).toBe(5);
  });

  it("setAgentName / getAgentName round-trips", () => {
    ci.setAgentName("my-agent-v1");
    expect(ci.getAgentName()).toBe("my-agent-v1");
  });

  it("setEnableParamsLastRoundMod / getEnableParamsLastRoundMod round-trips", () => {
    ci.setEnableParamsLastRoundMod(true);
    expect(ci.getEnableParamsLastRoundMod()).toBe(true);
  });

  it("setEnableGroupResourceSharing / getEnableGroupResourceSharing round-trips", () => {
    ci.setEnableGroupResourceSharing(true);
    expect(ci.getEnableGroupResourceSharing()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Transaction object building
// ---------------------------------------------------------------------------

describe("createAppCallTxnObject", () => {
  it("produces an object with sender, appIndex, and appArgs", () => {
    const ci = new CONTRACT(
      42,
      createMockAlgodClient(),
      createMockIndexerClient(),
      arc200Spec,
    );
    const abiMethod = ci.contractABI.getMethodByName("arc200_name");
    const obj = ci.createAppCallTxnObject(abiMethod, []);
    expect(obj.sender).toBe(
      "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
    );
    expect(obj.appIndex).toBe(42);
    expect(Array.isArray(obj.appArgs)).toBe(true);
    expect((obj.appArgs as Uint8Array[]).length).toBe(1);
  });
});

describe("getRIndex", () => {
  it("returns 0 when no prepended transactions", () => {
    const ci = new CONTRACT(
      1,
      createMockAlgodClient(),
      createMockIndexerClient(),
      arc200Spec,
    );
    expect(ci.getRIndex()).toBe(0);
  });

  it("accounts for payment amount", () => {
    const ci = new CONTRACT(
      1,
      createMockAlgodClient(),
      createMockIndexerClient(),
      arc200Spec,
    );
    ci.setPaymentAmount(100000);
    expect(ci.getRIndex()).toBe(1);
  });

  it("accounts for asset transfers", () => {
    const ci = new CONTRACT(
      1,
      createMockAlgodClient(),
      createMockIndexerClient(),
      arc200Spec,
    );
    ci.setAssetTransfers([
      [100, 456],
      [200, 789],
    ]);
    expect(ci.getRIndex()).toBe(2);
  });

  it("accounts for algo transfers", () => {
    const ci = new CONTRACT(
      1,
      createMockAlgodClient(),
      createMockIndexerClient(),
      arc200Spec,
    );
    ci.setTransfers([[1000000, "ADDR"]]);
    expect(ci.getRIndex()).toBe(1);
  });

  it("sums all offsets", () => {
    const ci = new CONTRACT(
      1,
      createMockAlgodClient(),
      createMockIndexerClient(),
      arc200Spec,
    );
    ci.setPaymentAmount(100000);
    ci.setAssetTransfers([[100, 456]]);
    ci.setTransfers([[1000000, "ADDR"]]);
    expect(ci.getRIndex()).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// makeUNote
// ---------------------------------------------------------------------------

describe("makeUNote", () => {
  it("produces a Uint8Array with ARC-2 prefix", () => {
    const ci = new CONTRACT(
      1,
      createMockAlgodClient(),
      createMockIndexerClient(),
      arc200Spec,
    );
    const note = ci.makeUNote("test message");
    const decoded = new TextDecoder().decode(note);
    expect(decoded).toContain("arccjs-v");
    expect(decoded).toContain(":u");
    expect(decoded).toContain("test message");
  });

  it("uses the configured agent name", () => {
    const ci = new CONTRACT(
      1,
      createMockAlgodClient(),
      createMockIndexerClient(),
      arc200Spec,
    );
    ci.setAgentName("custom-agent");
    const note = ci.makeUNote("hello");
    const decoded = new TextDecoder().decode(note);
    expect(decoded).toMatch(/^custom-agent:u hello$/);
  });
});

// ---------------------------------------------------------------------------
// getEventByName
// ---------------------------------------------------------------------------

describe("getEventByName", () => {
  it("returns an object with getSelector for known events", () => {
    const ci = new CONTRACT(
      1,
      createMockAlgodClient(),
      createMockIndexerClient(),
      arc200Spec,
    );
    const evt = ci.getEventByName("arc200_Transfer");
    expect(evt.getSelector()).toBe("7983c35c");
  });

  it("throws for unknown event names", () => {
    const ci = new CONTRACT(
      1,
      createMockAlgodClient(),
      createMockIndexerClient(),
      arc200Spec,
    );
    expect(() => ci.getEventByName("nonexistent")).toThrow(
      "Event nonexistent not found",
    );
  });
});

// ---------------------------------------------------------------------------
// Simulation response decoding
// ---------------------------------------------------------------------------

describe("decodeSimulationResponse", () => {
  it("returns null for void return type", () => {
    const spec: ABIContractSpec = {
      name: "test",
      methods: [
        {
          name: "doSomething",
          args: [],
          returns: { type: "void" },
        },
      ],
      events: [],
    };
    const ci = new CONTRACT(
      1,
      createMockAlgodClient(),
      createMockIndexerClient(),
      spec,
    );
    const abiMethod = ci.contractABI.getMethodByName("doSomething");
    const response = {
      txnGroups: [
        {
          txnResults: [
            {
              txnResult: {
                logs: [
                  Buffer.from(
                    new Uint8Array([0x15, 0x1f, 0x7c, 0x75]),
                  ).toString("base64"),
                ],
              },
            },
          ],
        },
      ],
    };
    const result = ci.decodeSimulationResponse(response, abiMethod);
    expect(result).toBeNull();
  });

  it("throws when simulation has a failure message", () => {
    const spec: ABIContractSpec = {
      name: "test",
      methods: [
        {
          name: "doSomething",
          args: [],
          returns: { type: "uint64" },
        },
      ],
      events: [],
    };
    const ci = new CONTRACT(
      1,
      createMockAlgodClient(),
      createMockIndexerClient(),
      spec,
    );
    const abiMethod = ci.contractABI.getMethodByName("doSomething");
    const response = {
      txnGroups: [
        {
          failureMessage: "logic eval error",
          txnResults: [],
        },
      ],
    };
    expect(() =>
      ci.decodeSimulationResponse(response, abiMethod),
    ).toThrow("logic eval error");
  });

  it("decodes a uint64 return value from simulation logs", () => {
    const spec: ABIContractSpec = {
      name: "test",
      methods: [
        {
          name: "getValue",
          args: [],
          returns: { type: "uint64" },
        },
      ],
      events: [],
    };
    const ci = new CONTRACT(
      1,
      createMockAlgodClient(),
      createMockIndexerClient(),
      spec,
    );
    const abiMethod = ci.contractABI.getMethodByName("getValue");

    // ABI return prefix (0x151f7c75) + uint64 value 42 (8 bytes big-endian)
    const prefix = new Uint8Array([0x15, 0x1f, 0x7c, 0x75]);
    const value = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 42]);
    const log = new Uint8Array([...prefix, ...value]);

    const response = {
      txnGroups: [
        {
          txnResults: [
            {
              txnResult: {
                logs: [Buffer.from(log).toString("base64")],
              },
            },
          ],
        },
      ],
    };

    const result = ci.decodeSimulationResponse(response, abiMethod);
    expect(result).toBe(BigInt(42));
  });
});

// ---------------------------------------------------------------------------
// objectOnly mode
// ---------------------------------------------------------------------------

describe("objectOnly mode", () => {
  it("returns obj for non-readonly methods when objectOnly is true", async () => {
    const spec: ABIContractSpec = {
      name: "test",
      methods: [
        {
          name: "doWrite",
          args: [],
          returns: { type: "void" },
        },
      ],
      events: [],
    };
    const ci = new CONTRACT(
      99,
      createMockAlgodClient(),
      createMockIndexerClient(),
      spec,
      null,
      true,
      false,
      true,
    );
    const result = await (ci.doWrite as Function)();
    expect(result).toBeDefined();
    expect(result.obj).toBeDefined();
    expect(result.obj.sender).toBe(
      "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
    );
    expect(result.obj.appIndex).toBe(99);
  });
});
