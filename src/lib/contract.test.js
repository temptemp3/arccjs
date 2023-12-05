import { it } from "node:test";
import CONTRACT, { genericHash, getEventSignature } from "./contract.js";

const abi = {
  name: "arc200",
  description: "arc200",
  methods: [],
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

const algodClient = {};

class AlgorandIndexerClient {
  constructor() {
    // ... (other methods and properties)

    this.MockedTransactionChain = class {
      constructor() {
        this.applicationIDVal = null;
        this.limitVal = null;
        this.nextTokenVal = null;
        this.minRoundVal = 0;
        this.maxRoundVal = -1;
        this.addressVal = null;
        this.roundVal = null;
        this.txidVal = null;
      }

      applicationID(applicationID) {
        this.applicationIDVal = applicationID;
        return this;
      }

      limit(limit) {
        this.limitVal = limit;
        return this;
      }

      nextToken(nextToken) {
        this.nextTokenVal = nextToken;
        return this;
      }

      minRound(minRound) {
        this.minRoundVal = minRound;
        return this;
      }

      maxRound(maxRound) {
        this.maxRoundVal = maxRound;
        return this;
      }

      address(address) {
        this.addressVal = address;
        return this;
      }

      round(round) {
        this.roundVal = round;
        return this;
      }

      txid(txid) {
        this.txidVal = txid;
        return this;
      }

      do() {
        // Mocked response data similar to actual Algorand Indexer Client response
        // Customize the response as needed for your tests
        const mockedResponse = {
          transactions: [
            {
              "application-transaction": {
                accounts: [],
                "application-args": [
                  "akO2BQ==",
                  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKoAYT6Lb4tJno18MjjBBwz+ilZ69wO7juvLb/dkSX+YAQAAAAAAAAAGVm9pIEluY2VudGl2ZSBBc3NldAAAAAAAAAAAAAAAAABWSUEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAjhvJvwQAA",
                ],
                "application-id": 6779767,
                "foreign-apps": [],
                "foreign-assets": [],
                "global-state-schema": {
                  "num-byte-slice": 0,
                  "num-uint": 0,
                },
                "local-state-schema": {
                  "num-byte-slice": 0,
                  "num-uint": 0,
                },
                "on-completion": "noop",
              },
              "close-rewards": 0,
              "closing-amount": 0,
              "confirmed-round": 1519106,
              fee: 2000,
              "first-valid": 1519103,
              "genesis-hash": "IXnoWtviVVJW5LGivNFc0Dq14V3kqaXuK2u5OQrdVZo=",
              "genesis-id": "voitest-v1",
              "global-state-delta": [
                {
                  key: "",
                  value: {
                    action: 1,
                    bytes: "AAAAAAAAAAMAAAAAABcuAg==",
                    uint: 0,
                  },
                },
                {
                  key: "AA==",
                  value: {
                    action: 1,
                    bytes:
                      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAZWb2kgSW5jZW50aXZlIEFzc2V0AAAAAAAAAAAAAAAAAFZJQQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACOG8m/BAAAAAAAAAAAAAAAAAAAAAA==",
                    uint: 0,
                  },
                },
                {
                  key: "AQ==",
                  value: {
                    action: 1,
                    bytes:
                      "AAAAAAAAAAAAAAAjhvJvwQAAAAAAAAAAAAYAAAAAAAAAAAYBqgBhPotvi0mejXwyOMEHDP6KVnr3A7uO68tv92RJf5hWb2kgSW5jZW50aXZlIEFzc2V0AAAAAAAAAAAAAAAAAFZJQQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
                    uint: 0,
                  },
                },
                {
                  key: "Ag==",
                  value: {
                    action: 1,
                    bytes:
                      "AAAAAAAAI4byb8EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
                    uint: 0,
                  },
                },
              ],
              group: "PyduFzQ+G00iPapo/EejsSccasZCip/FImErVevibBc=",
              id: "WR4C7PMYKZ45ZWFWHTQRWHL424VDYXKYH4X2BX4J6KZ7BD3IQD4Q",
              "intra-round-offset": 1,
              "last-valid": 1520103,
              logs: [
                "5Ep7MgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACqAGE+i2+LSZ6NfDI4wQcM/opWevcDu47ry2/3ZEl/mAEAAAAAAAAABlZvaSBJbmNlbnRpdmUgQXNzZXQAAAAAAAAAAAAAAAAAVklBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI4byb8EAAA==",
                "eYPDXAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAqgBhPotvi0mejXwyOMEHDP6KVnr3A7uO68tv92RJf5gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI4byb8EAAA==",
              ],
              note: "UmVhY2ggMC4xLjEz",
              "receiver-rewards": 0,
              "round-time": 1699029707,
              sender:
                "VIAGCPULN6FUTHUNPQZDRQIHBT7IUVT264B3XDXLZNX7OZCJP6MEF7JFQU",
              "sender-rewards": 0,
              signature: {
                sig: "Yk/oJcyxnJKEr+LU5DW1SogG/gS6SfhMDCtKk9vnKqLCTDMtb8SJXWWxNdP+pjdZGZ0Rr7fDF28dsJkOYBGTCw==",
              },
              "tx-type": "appl",
            },
            {
              "application-transaction": {
                accounts: [],
                "application-args": [
                  "2nAluQ==",
                  "Rflr2V4NfV/I4MQ03WflPW4TLYiTbw4JNQzvZg+qZmg=",
                  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPQkA=",
                ],
                "application-id": 6779767,
                "foreign-apps": [],
                "foreign-assets": [],
                "global-state-schema": {
                  "num-byte-slice": 0,
                  "num-uint": 0,
                },
                "local-state-schema": {
                  "num-byte-slice": 0,
                  "num-uint": 0,
                },
                "on-completion": "noop",
              },
              "close-rewards": 0,
              "closing-amount": 0,
              "confirmed-round": 1920785,
              fee: 1000,
              "first-valid": 1920783,
              "genesis-hash": "IXnoWtviVVJW5LGivNFc0Dq14V3kqaXuK2u5OQrdVZo=",
              "genesis-id": "voitest-v1",
              "global-state-delta": [
                {
                  key: "",
                  value: {
                    action: 1,
                    bytes: "AAAAAAAAAAMAAAAAAB1PEQ==",
                    uint: 0,
                  },
                },
              ],
              group: "j6bJzG1iMM71nurU5pS2NM0INIV0b68Lio8dk1Bsd8s=",
              id: "ZWUTU6XHFFEWSTH3EBGHSLNFNNIBVXZSFVKXOV4FDQ4DX4AB3BGA",
              "intra-round-offset": 0,
              "last-valid": 1921783,
              logs: [
                "2R5N2gAAAAAAAAAAAUX5a9leDX1fyODENN1n5T1uEy2Ik28OCTUM72YPqmZoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPQkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
                "eYPDXNQR21LoQz3kN98GeIe/qyXN+VbOJc/eDgjZqMgRXzCaRflr2V4NfV/I4MQ03WflPW4TLYiTbw4JNQzvZg+qZmgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9CQA==",
                "AAAAAAAACHYB",
                "FR98dYA=",
              ],
              "receiver-rewards": 0,
              "round-time": 1700425041,
              sender:
                "2QI5WUXIIM66IN67AZ4IPP5LEXG7SVWOEXH54DQI3GUMQEK7GCNGE4RBMU",
              "sender-rewards": 0,
              signature: {
                sig: "t5HCJR/Vch/4DPOWmj6GfP45zGfG2DwKjLPX2ixkRNpvp6T13Y7r0IbcMJLSn7XopJI0Kyyno51KBd+FeAOeCg==",
              },
              "tx-type": "appl",
            },
          ],
          nextToken: "nextTokenValue",
        };

        return Promise.resolve({
          ...mockedResponse,
          transactions: mockedResponse.transactions.filter(
            (tx) =>
              (this.minRoundVal === 0 ||
                tx["confirmed-round"] >= this.minRoundVal) &&
              (this.maxRoundVal === -1 ||
                tx["confirmed-round"] <= this.maxRoundVal) &&
              (this.addressVal === null || tx["sender"] === this.addressVal) &&
              (this.roundVal === null ||
                tx["confirmed-round"] === this.roundVal) &&
              (this.txidVal === null || tx["id"] === this.txidVal)
          ),
        });
      }
    };
  }

  // Other methods of the AlgorandIndexerClient...

  // Method to create a mocked transaction chain
  searchForTransactions() {
    return new this.MockedTransactionChain();
  }
}

const indexerClient = new AlgorandIndexerClient();

const ci = new CONTRACT(0, algodClient, indexerClient, abi, null, false, false);

test("genericHash", () => {
  expect(
    Buffer.from(
      genericHash("arc200_Transfer(address,address,uint256)")
    ).toString("base64")
  ).toBe("eYPDXE9BHdw1y+phqna8QMKDKxZtMEtj3ulg6bc/Xlk=");
});

test("getEventSignature", () => {
  expect(getEventSignature(abi.events[0])).toBe(
    "arc200_Transfer(address,address,uint256)"
  );
});

test("getEventByName", () => {
  expect(ci.getEventByName).toBeDefined();
  expect(ci.getEventByName("arc200_Transfer").getSelector).toBeDefined();
  expect(ci.getEventByName("arc200_Transfer").getSelector()).toBe("7983c35c");
});

it("arc200_Transfer", () => {
  expect(ci.arc200_Transfer).toBeDefined();
  (async () => {
    expect(await ci.arc200_Transfer()).toStrictEqual([
      [
        "WR4C7PMYKZ45ZWFWHTQRWHL424VDYXKYH4X2BX4J6KZ7BD3IQD4Q",
        1519106,
        1699029707,
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
        "VIAGCPULN6FUTHUNPQZDRQIHBT7IUVT264B3XDXLZNX7OZCJP6MEF7JFQU",
        10000000000000000n,
      ],
      [
        "ZWUTU6XHFFEWSTH3EBGHSLNFNNIBVXZSFVKXOV4FDQ4DX4AB3BGA",
        1920785,
        1700425041,
        "2QI5WUXIIM66IN67AZ4IPP5LEXG7SVWOEXH54DQI3GUMQEK7GCNGE4RBMU",
        "IX4WXWK6BV6V7SHAYQ2N2Z7FHVXBGLMISNXQ4CJVBTXWMD5KMZUOZSSQM4",
        1000000n,
      ],
    ]);
  })();
});

it("arc200_Transfer({minRound:1})", () => {
  (async () => {
    expect(await ci.arc200_Transfer({ minRound: 1920785 })).toStrictEqual([
      [
        "ZWUTU6XHFFEWSTH3EBGHSLNFNNIBVXZSFVKXOV4FDQ4DX4AB3BGA",
        1920785,
        1700425041,
        "2QI5WUXIIM66IN67AZ4IPP5LEXG7SVWOEXH54DQI3GUMQEK7GCNGE4RBMU",
        "IX4WXWK6BV6V7SHAYQ2N2Z7FHVXBGLMISNXQ4CJVBTXWMD5KMZUOZSSQM4",
        1000000n,
      ],
    ]);
  })();
});

it("arc200_Transfer({maxRound:1})", () => {
  (async () => {
    expect(await ci.arc200_Transfer({ maxRound: 1519106 })).toStrictEqual([
      [
        "WR4C7PMYKZ45ZWFWHTQRWHL424VDYXKYH4X2BX4J6KZ7BD3IQD4Q",
        1519106,
        1699029707,
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
        "VIAGCPULN6FUTHUNPQZDRQIHBT7IUVT264B3XDXLZNX7OZCJP6MEF7JFQU",
        10000000000000000n,
      ],
    ]);
  })();
});

it("arc200_Transfer({address:0x0})", async () => {
  expect(
    await ci.arc200_Transfer({
      address: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
    })
  ).toStrictEqual([]);
});

it("arc200_Transfer({address:0x1})", async () => {
  expect(
    await ci.arc200_Transfer({
      address: "VIAGCPULN6FUTHUNPQZDRQIHBT7IUVT264B3XDXLZNX7OZCJP6MEF7JFQU",
    })
  ).toStrictEqual([
    [
      "WR4C7PMYKZ45ZWFWHTQRWHL424VDYXKYH4X2BX4J6KZ7BD3IQD4Q",
      1519106,
      1699029707,
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
      "VIAGCPULN6FUTHUNPQZDRQIHBT7IUVT264B3XDXLZNX7OZCJP6MEF7JFQU",
      10000000000000000n,
    ],
  ]);
});

it("arc200_Transfer({address:0x2})", () => {
  (async () => {
    expect(
      await ci.arc200_Transfer({
        address: "2QI5WUXIIM66IN67AZ4IPP5LEXG7SVWOEXH54DQI3GUMQEK7GCNGE4RBMU",
      })
    ).toStrictEqual([
      [
        "ZWUTU6XHFFEWSTH3EBGHSLNFNNIBVXZSFVKXOV4FDQ4DX4AB3BGA",
        1920785,
        1700425041,
        "2QI5WUXIIM66IN67AZ4IPP5LEXG7SVWOEXH54DQI3GUMQEK7GCNGE4RBMU",
        "IX4WXWK6BV6V7SHAYQ2N2Z7FHVXBGLMISNXQ4CJVBTXWMD5KMZUOZSSQM4",
        1000000n,
      ],
    ]);
  })();
});

it("arc200_Transfer({round:0})", () => {
  (async () => {
    expect(
      await ci.arc200_Transfer({
        round: 1,
      })
    ).toStrictEqual([]);
  })();
});

it("arc200_Transfer({round:1})", () => {
  (async () => {
    expect(
      await ci.arc200_Transfer({
        round: 1920785,
      })
    ).toStrictEqual([
      [
        "ZWUTU6XHFFEWSTH3EBGHSLNFNNIBVXZSFVKXOV4FDQ4DX4AB3BGA",
        1920785,
        1700425041,
        "2QI5WUXIIM66IN67AZ4IPP5LEXG7SVWOEXH54DQI3GUMQEK7GCNGE4RBMU",
        "IX4WXWK6BV6V7SHAYQ2N2Z7FHVXBGLMISNXQ4CJVBTXWMD5KMZUOZSSQM4",
        1000000n,
      ],
    ]);
  })();
});

it("arc200_Transfer({txid:0})", () => {
  (async () => {
    expect(
      await ci.arc200_Transfer({
        txid: "_",
      })
    ).toStrictEqual([]);
  })();
});

it("arc200_Transfer({txid:1})", () => {
  (async () => {
    expect(
      await ci.arc200_Transfer({
        txid: "ZWUTU6XHFFEWSTH3EBGHSLNFNNIBVXZSFVKXOV4FDQ4DX4AB3BGA",
      })
    ).toStrictEqual([
      [
        "ZWUTU6XHFFEWSTH3EBGHSLNFNNIBVXZSFVKXOV4FDQ4DX4AB3BGA",
        1920785,
        1700425041,
        "2QI5WUXIIM66IN67AZ4IPP5LEXG7SVWOEXH54DQI3GUMQEK7GCNGE4RBMU",
        "IX4WXWK6BV6V7SHAYQ2N2Z7FHVXBGLMISNXQ4CJVBTXWMD5KMZUOZSSQM4",
        1000000n,
      ],
    ]);
  })();
});

it("arc200_Approval", () => {
  expect(ci.arc200_Approval).toBeDefined();
  (async () => {
    expect(await ci.arc200_Approval()).toStrictEqual([]);
  })();
});

it("getEvents()", () => {
  expect(ci.getEvents).toBeDefined();
  (async () => {
    expect(await ci.getEvents()).toStrictEqual([
      {
        events: [
          [
            "WR4C7PMYKZ45ZWFWHTQRWHL424VDYXKYH4X2BX4J6KZ7BD3IQD4Q",
            1519106,
            1699029707,
            "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
            "VIAGCPULN6FUTHUNPQZDRQIHBT7IUVT264B3XDXLZNX7OZCJP6MEF7JFQU",
            10000000000000000n,
          ],
          [
            "ZWUTU6XHFFEWSTH3EBGHSLNFNNIBVXZSFVKXOV4FDQ4DX4AB3BGA",
            1920785,
            1700425041,
            "2QI5WUXIIM66IN67AZ4IPP5LEXG7SVWOEXH54DQI3GUMQEK7GCNGE4RBMU",
            "IX4WXWK6BV6V7SHAYQ2N2Z7FHVXBGLMISNXQ4CJVBTXWMD5KMZUOZSSQM4",
            1000000n,
          ],
        ],
        name: "arc200_Transfer",
        selector: "7983c35c",
        signature: "arc200_Transfer(address,address,uint256)",
      },
      {
        events: [],
        name: "arc200_Approval",
        selector: "1969f865",
        signature: "arc200_Approval(address,address,uint256)",
      },
    ]);
  })();
});

it("getEvents({address:0})", () => {
  expect(ci.getEvents).toBeDefined();
  (async () => {
    expect(
      await ci.getEvents({
        address: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
      })
    ).toStrictEqual([
      {
        events: [],
        name: "arc200_Transfer",
        selector: "7983c35c",
        signature: "arc200_Transfer(address,address,uint256)",
      },
      {
        events: [],
        name: "arc200_Approval",
        selector: "1969f865",
        signature: "arc200_Approval(address,address,uint256)",
      },
    ]);
  })();
});
