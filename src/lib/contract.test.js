import { it } from "node:test";
import CONTRACT, { genericHash, getEventSignature } from "./contract.js";

// const abi = {
//   name: "arc200",
//   description: "arc200",
//   methods: [],
//   events: [
//     {
//       name: "arc200_Transfer",
//       args: [
//         { name: "from", type: "address" },
//         { name: "to", type: "address" },
//         { name: "amount", type: "uint256" },
//       ],
//     },
//     {
//       name: "arc200_Approval",
//       args: [
//         { name: "owner", type: "address" },
//         { name: "spender", type: "address" },
//         { name: "amount", type: "uint256" },
//       ],
//     },
//   ],
// };

// const algodClient = {};

// class AlgorandIndexerClient {
//   constructor() {
//     // ... (other methods and properties)

//     this.MockedTransactionChain = class {
//       constructor() {
//         this.applicationIDVal = null;
//         this.limitVal = null;
//         this.nextTokenVal = null;
//         this.minRoundVal = 0;
//         this.maxRoundVal = -1;
//         this.addressVal = null;
//         this.roundVal = null;
//         this.txidVal = null;
//       }

//       applicationID(applicationID) {
//         this.applicationIDVal = applicationID;
//         return this;
//       }

//       limit(limit) {
//         this.limitVal = limit;
//         return this;
//       }

//       nextToken(nextToken) {
//         this.nextTokenVal = nextToken;
//         return this;
//       }

//       minRound(minRound) {
//         this.minRoundVal = minRound;
//         return this;
//       }

//       maxRound(maxRound) {
//         this.maxRoundVal = maxRound;
//         return this;
//       }

//       address(address) {
//         this.addressVal = address;
//         return this;
//       }

//       round(round) {
//         this.roundVal = round;
//         return this;
//       }

//       txid(txid) {
//         this.txidVal = txid;
//         return this;
//       }

//       do() {
//         // Mocked response data similar to actual Algorand Indexer Client response
//         // Customize the response as needed for your tests
//         const mockedResponse = {
//           transactions: [
//             {
//               "application-transaction": {
//                 accounts: [],
//                 "application-args": [
//                   "akO2BQ==",
//                   "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKoAYT6Lb4tJno18MjjBBwz+ilZ69wO7juvLb/dkSX+YAQAAAAAAAAAGVm9pIEluY2VudGl2ZSBBc3NldAAAAAAAAAAAAAAAAABWSUEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAjhvJvwQAA",
//                 ],
//                 "application-id": 6779767,
//                 "foreign-apps": [],
//                 "foreign-assets": [],
//                 "global-state-schema": {
//                   "num-byte-slice": 0,
//                   "num-uint": 0,
//                 },
//                 "local-state-schema": {
//                   "num-byte-slice": 0,
//                   "num-uint": 0,
//                 },
//                 "on-completion": "noop",
//               },
//               "close-rewards": 0,
//               "closing-amount": 0,
//               "confirmed-round": 1519106,
//               fee: 2000,
//               "first-valid": 1519103,
//               "genesis-hash": "IXnoWtviVVJW5LGivNFc0Dq14V3kqaXuK2u5OQrdVZo=",
//               "genesis-id": "voitest-v1",
//               "global-state-delta": [
//                 {
//                   key: "",
//                   value: {
//                     action: 1,
//                     bytes: "AAAAAAAAAAMAAAAAABcuAg==",
//                     uint: 0,
//                   },
//                 },
//                 {
//                   key: "AA==",
//                   value: {
//                     action: 1,
//                     bytes:
//                       "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAZWb2kgSW5jZW50aXZlIEFzc2V0AAAAAAAAAAAAAAAAAFZJQQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACOG8m/BAAAAAAAAAAAAAAAAAAAAAA==",
//                     uint: 0,
//                   },
//                 },
//                 {
//                   key: "AQ==",
//                   value: {
//                     action: 1,
//                     bytes:
//                       "AAAAAAAAAAAAAAAjhvJvwQAAAAAAAAAAAAYAAAAAAAAAAAYBqgBhPotvi0mejXwyOMEHDP6KVnr3A7uO68tv92RJf5hWb2kgSW5jZW50aXZlIEFzc2V0AAAAAAAAAAAAAAAAAFZJQQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
//                     uint: 0,
//                   },
//                 },
//                 {
//                   key: "Ag==",
//                   value: {
//                     action: 1,
//                     bytes:
//                       "AAAAAAAAI4byb8EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
//                     uint: 0,
//                   },
//                 },
//               ],
//               group: "PyduFzQ+G00iPapo/EejsSccasZCip/FImErVevibBc=",
//               id: "WR4C7PMYKZ45ZWFWHTQRWHL424VDYXKYH4X2BX4J6KZ7BD3IQD4Q",
//               "intra-round-offset": 1,
//               "last-valid": 1520103,
//               logs: [
//                 "5Ep7MgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACqAGE+i2+LSZ6NfDI4wQcM/opWevcDu47ry2/3ZEl/mAEAAAAAAAAABlZvaSBJbmNlbnRpdmUgQXNzZXQAAAAAAAAAAAAAAAAAVklBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI4byb8EAAA==",
//                 "eYPDXAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAqgBhPotvi0mejXwyOMEHDP6KVnr3A7uO68tv92RJf5gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI4byb8EAAA==",
//               ],
//               note: "UmVhY2ggMC4xLjEz",
//               "receiver-rewards": 0,
//               "round-time": 1699029707,
//               sender:
//                 "VIAGCPULN6FUTHUNPQZDRQIHBT7IUVT264B3XDXLZNX7OZCJP6MEF7JFQU",
//               "sender-rewards": 0,
//               signature: {
//                 sig: "Yk/oJcyxnJKEr+LU5DW1SogG/gS6SfhMDCtKk9vnKqLCTDMtb8SJXWWxNdP+pjdZGZ0Rr7fDF28dsJkOYBGTCw==",
//               },
//               "tx-type": "appl",
//             },
//             {
//               "application-transaction": {
//                 accounts: [],
//                 "application-args": [
//                   "2nAluQ==",
//                   "Rflr2V4NfV/I4MQ03WflPW4TLYiTbw4JNQzvZg+qZmg=",
//                   "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPQkA=",
//                 ],
//                 "application-id": 6779767,
//                 "foreign-apps": [],
//                 "foreign-assets": [],
//                 "global-state-schema": {
//                   "num-byte-slice": 0,
//                   "num-uint": 0,
//                 },
//                 "local-state-schema": {
//                   "num-byte-slice": 0,
//                   "num-uint": 0,
//                 },
//                 "on-completion": "noop",
//               },
//               "close-rewards": 0,
//               "closing-amount": 0,
//               "confirmed-round": 1920785,
//               fee: 1000,
//               "first-valid": 1920783,
//               "genesis-hash": "IXnoWtviVVJW5LGivNFc0Dq14V3kqaXuK2u5OQrdVZo=",
//               "genesis-id": "voitest-v1",
//               "global-state-delta": [
//                 {
//                   key: "",
//                   value: {
//                     action: 1,
//                     bytes: "AAAAAAAAAAMAAAAAAB1PEQ==",
//                     uint: 0,
//                   },
//                 },
//               ],
//               group: "j6bJzG1iMM71nurU5pS2NM0INIV0b68Lio8dk1Bsd8s=",
//               id: "ZWUTU6XHFFEWSTH3EBGHSLNFNNIBVXZSFVKXOV4FDQ4DX4AB3BGA",
//               "intra-round-offset": 0,
//               "last-valid": 1921783,
//               logs: [
//                 "2R5N2gAAAAAAAAAAAUX5a9leDX1fyODENN1n5T1uEy2Ik28OCTUM72YPqmZoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPQkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
//                 "eYPDXNQR21LoQz3kN98GeIe/qyXN+VbOJc/eDgjZqMgRXzCaRflr2V4NfV/I4MQ03WflPW4TLYiTbw4JNQzvZg+qZmgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9CQA==",
//                 "AAAAAAAACHYB",
//                 "FR98dYA=",
//               ],
//               "receiver-rewards": 0,
//               "round-time": 1700425041,
//               sender:
//                 "2QI5WUXIIM66IN67AZ4IPP5LEXG7SVWOEXH54DQI3GUMQEK7GCNGE4RBMU",
//               "sender-rewards": 0,
//               signature: {
//                 sig: "t5HCJR/Vch/4DPOWmj6GfP45zGfG2DwKjLPX2ixkRNpvp6T13Y7r0IbcMJLSn7XopJI0Kyyno51KBd+FeAOeCg==",
//               },
//               "tx-type": "appl",
//             },
//             {
//               "application-transaction": {
//                 accounts: [],
//                 "application-args": [
//                   "to7/MA==",
//                   "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPQkA=",
//                 ],
//                 "application-id": 21682819,
//                 "foreign-apps": [6778021, 21682819, 6778021, 6778021],
//                 "foreign-assets": [],
//                 "global-state-schema": {
//                   "num-byte-slice": 0,
//                   "num-uint": 0,
//                 },
//                 "local-state-schema": {
//                   "num-byte-slice": 0,
//                   "num-uint": 0,
//                 },
//                 "on-completion": "noop",
//               },
//               "close-rewards": 0,
//               "closing-amount": 0,
//               "confirmed-round": 2396240,
//               fee: 2000,
//               "first-valid": 2396238,
//               "genesis-hash": "IXnoWtviVVJW5LGivNFc0Dq14V3kqaXuK2u5OQrdVZo=",
//               "genesis-id": "voitest-v1",
//               group: "d2QLyW16pJeWNv3MnUpt5rtJ70+qk9ISXu1k6dDiB70=",
//               id: "JBSX23KJ7CA63QWN5A25V7CKZ5MKYYD3VJDYFPJCGJULFDCVZ3IQ",
//               "inner-txns": [
//                 {
//                   "application-transaction": {
//                     accounts: [
//                       "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//                       "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//                     ],
//                     "application-args": [
//                       "SpaPjw==",
//                       "Ntkgf67JEzEIjXJGsaVfoP5NK6NovlqcTXV+TaODneY=",
//                       "A/5CyAOjTv89qHvmwM6PFqQFnA5WQCzLcVh/3qN2WH0=",
//                       "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPQkA=",
//                     ],
//                     "application-id": 6778021,
//                     "foreign-apps": [6778021],
//                     "foreign-assets": [],
//                     "global-state-schema": {
//                       "num-byte-slice": 0,
//                       "num-uint": 0,
//                     },
//                     "local-state-schema": {
//                       "num-byte-slice": 0,
//                       "num-uint": 0,
//                     },
//                     "on-completion": "noop",
//                   },
//                   "close-rewards": 0,
//                   "closing-amount": 0,
//                   "confirmed-round": 2396240,
//                   fee: 0,
//                   "first-valid": 2396238,
//                   "global-state-delta": [
//                     {
//                       key: "",
//                       value: {
//                         action: 1,
//                         bytes: "AAAAAAAAAAMAAAAAACSQUA==",
//                         uint: 0,
//                       },
//                     },
//                   ],
//                   "intra-round-offset": 2,
//                   "last-valid": 2397238,
//                   logs: [
//                     "2R5N2gAAAAAAAAAAAjbZIH+uyRMxCI1yRrGlX6D+TSujaL5anE11fk2jg53mA/5CyAOjTv89qHvmwM6PFqQFnA5WQCzLcVh/3qN2WH0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9CQA==",
//                     "eYPDXDbZIH+uyRMxCI1yRrGlX6D+TSujaL5anE11fk2jg53mA/5CyAOjTv89qHvmwM6PFqQFnA5WQCzLcVh/3qN2WH0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9CQA==",
//                     "GWn4ZTbZIH+uyRMxCI1yRrGlX6D+TSujaL5anE11fk2jg53mA/5CyAOjTv89qHvmwM6PFqQFnA5WQCzLcVh/3qN2WH0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA41+pIl2/g==",
//                     "AAAAAAAACXgB",
//                     "FR98dYA=",
//                   ],
//                   "receiver-rewards": 0,
//                   "round-time": 1701994772,
//                   sender:
//                     "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//                   "sender-rewards": 0,
//                   "tx-type": "appl",
//                 },
//                 {
//                   "application-transaction": {
//                     accounts: [
//                       "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//                       "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//                     ],
//                     "application-args": [
//                       "SpaPjw==",
//                       "Ntkgf67JEzEIjXJGsaVfoP5NK6NovlqcTXV+TaODneY=",
//                       "A/5CyAOjTv89qHvmwM6PFqQFnA5WQCzLcVh/3qN2WH0=",
//                       "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPQkA=",
//                     ],
//                     "application-id": 6778021,
//                     "foreign-apps": [6778021],
//                     "foreign-assets": [],
//                     "global-state-schema": {
//                       "num-byte-slice": 0,
//                       "num-uint": 0,
//                     },
//                     "local-state-schema": {
//                       "num-byte-slice": 0,
//                       "num-uint": 0,
//                     },
//                     "on-completion": "noop",
//                   },
//                   "close-rewards": 0,
//                   "closing-amount": 0,
//                   "confirmed-round": 2396240,
//                   fee: 0,
//                   "first-valid": 2396238,
//                   "global-state-delta": [
//                     {
//                       key: "",
//                       value: {
//                         action: 1,
//                         bytes: "AAAAAAAAAAMAAAAAACSQUA==",
//                         uint: 0,
//                       },
//                     },
//                   ],
//                   "intra-round-offset": 2,
//                   "last-valid": 2397238,
//                   logs: [
//                     "2R5N2gAAAAAAAAAAAjbZIH+uyRMxCI1yRrGlX6D+TSujaL5anE11fk2jg53mA/5CyAOjTv89qHvmwM6PFqQFnA5WQCzLcVh/3qN2WH0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9CQA==",
//                     "eYPDXDbZIH+uyRMxCI1yRrGlX6D+TSujaL5anE11fk2jg53mA/5CyAOjTv89qHvmwM6PFqQFnA5WQCzLcVh/3qN2WH0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9CQA==",
//                     "GWn4ZTbZIH+uyRMxCI1yRrGlX6D+TSujaL5anE11fk2jg53mA/5CyAOjTv89qHvmwM6PFqQFnA5WQCzLcVh/3qN2WH0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA41+pIl2/g==",
//                     "AAAAAAAACXgB",
//                     "FR98dYA=",
//                   ],
//                   "receiver-rewards": 0,
//                   "round-time": 1701994772,
//                   sender:
//                     "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//                   "sender-rewards": 0,
//                   "tx-type": "appl",
//                 },
//               ],
//               "intra-round-offset": 2,
//               "last-valid": 2397238,
//               logs: [
//                 "rQu+RAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD0JAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
//                 "AAAAAAAARUoAAAAAAAAAAIA=",
//                 "AAAAAAAARVYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD0JAg==",
//                 "FR98dQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPQkC",
//               ],
//               "receiver-rewards": 0,
//               "round-time": 1701994772,
//               sender:
//                 "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//               "sender-rewards": 0,
//               signature: {
//                 sig: "UeS4vj+oEWIYGwz3gr/nh63xjcjTdu9PROLQZArZfFITsuMFPcQzh3A1rPc0MIilJ8QuipJe7ORZ+JcJVrrtDA==",
//               },
//               "tx-type": "appl",
//             },
//             {
//               "application-transaction": {
//                 accounts: [
//                   "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//                 ],
//                 "application-args": [
//                   "ZuR8pg==",
//                   "AAAAAAAAAAABAAAAAAAAAAAAAAAAAAFK2oMD/kLIA6NO/z2oe+bAzo8WpAWcDlZALMtxWH/eo3ZYfQAAAAAAZ3N3AAAAAABnbKU22SB/rskTMQiNckaxpV+g/k0ro2i+WpxNdX5No4Od5gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
//                 ],
//                 "application-id": 21682569,
//                 "foreign-apps": [21682819, 6779767, 6778021],
//                 "foreign-assets": [],
//                 "global-state-schema": {
//                   "num-byte-slice": 0,
//                   "num-uint": 0,
//                 },
//                 "local-state-schema": {
//                   "num-byte-slice": 0,
//                   "num-uint": 0,
//                 },
//                 "on-completion": "noop",
//               },
//               "close-rewards": 0,
//               "closing-amount": 0,
//               "confirmed-round": 2446920,
//               fee: 5000,
//               "first-valid": 2446917,
//               "genesis-hash": "IXnoWtviVVJW5LGivNFc0Dq14V3kqaXuK2u5OQrdVZo=",
//               "genesis-id": "voitest-v1",
//               "global-state-delta": [
//                 {
//                   key: "",
//                   value: {
//                     action: 1,
//                     bytes: "AAAAAAAAAAMAAAAAACVWSA==",
//                     uint: 0,
//                   },
//                 },
//                 {
//                   key: "AQ==",
//                   value: {
//                     action: 1,
//                     bytes:
//                       "AAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
//                     uint: 0,
//                   },
//                 },
//               ],
//               group: "dkyphXzn8ue116bS7ltYEdG0TvCqGFtpEJQ5K1wzdJs=",
//               id: "BQ6ZBXOKFEAVEE4BHCXBUYRFFG3LQLXIG6E3ELBCF6Z3VQ2USTJQ",
//               "inner-txns": [
//                 {
//                   "application-transaction": {
//                     accounts: [
//                       "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//                     ],
//                     "application-args": [
//                       "4NlbtQ==",
//                       "Ntkgf67JEzEIjXJGsaVfoP5NK6NovlqcTXV+TaODneY=",
//                       "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAecyfX9VzAZvERp1/WkYnPxTkg1NJFNKnXS05akjO06DQA",
//                     ],
//                     "application-id": 21682819,
//                     "foreign-apps": [21682819, 6779767, 6778021],
//                     "foreign-assets": [],
//                     "global-state-schema": {
//                       "num-byte-slice": 0,
//                       "num-uint": 0,
//                     },
//                     "local-state-schema": {
//                       "num-byte-slice": 0,
//                       "num-uint": 0,
//                     },
//                     "on-completion": "noop",
//                   },
//                   "close-rewards": 0,
//                   "closing-amount": 0,
//                   "confirmed-round": 2446920,
//                   fee: 0,
//                   "first-valid": 2446917,
//                   "global-state-delta": [
//                     {
//                       key: "",
//                       value: {
//                         action: 1,
//                         bytes: "AAAAAAAAAAQAAAAAACVWSAAAAAABStqG",
//                         uint: 0,
//                       },
//                     },
//                   ],
//                   "inner-txns": [
//                     {
//                       "close-rewards": 0,
//                       "closing-amount": 0,
//                       "confirmed-round": 2446920,
//                       fee: 0,
//                       "first-valid": 2446917,
//                       "intra-round-offset": 0,
//                       "last-valid": 2447917,
//                       "payment-transaction": {
//                         amount: 0,
//                         "close-amount": 0,
//                         receiver:
//                           "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//                       },
//                       "receiver-rewards": 0,
//                       "round-time": 1702161998,
//                       sender:
//                         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//                       "sender-rewards": 0,
//                       "tx-type": "pay",
//                     },
//                     {
//                       "application-transaction": {
//                         accounts: [
//                           "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//                         ],
//                         "application-args": [
//                           "2nAluQ==",
//                           "Ntkgf67JEzEIjXJGsaVfoP5NK6NovlqcTXV+TaODneY=",
//                           "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
//                         ],
//                         "application-id": 6779767,
//                         "foreign-apps": [6779767],
//                         "foreign-assets": [],
//                         "global-state-schema": {
//                           "num-byte-slice": 0,
//                           "num-uint": 0,
//                         },
//                         "local-state-schema": {
//                           "num-byte-slice": 0,
//                           "num-uint": 0,
//                         },
//                         "on-completion": "noop",
//                       },
//                       "close-rewards": 0,
//                       "closing-amount": 0,
//                       "confirmed-round": 2446920,
//                       fee: 0,
//                       "first-valid": 2446917,
//                       "global-state-delta": [
//                         {
//                           key: "",
//                           value: {
//                             action: 1,
//                             bytes: "AAAAAAAAAAMAAAAAACVWSA==",
//                             uint: 0,
//                           },
//                         },
//                       ],
//                       "intra-round-offset": 0,
//                       "last-valid": 2447917,
//                       logs: [
//                         "2R5N2gAAAAAAAAAAATbZIH+uyRMxCI1yRrGlX6D+TSujaL5anE11fk2jg53mAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
//                         "eYPDXAP+QsgDo07/Pah75sDOjxakBZwOVkAsy3FYf96jdlh9Ntkgf67JEzEIjXJGsaVfoP5NK6NovlqcTXV+TaODneYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
//                         "AAAAAAAACHYB",
//                         "FR98dYA=",
//                       ],
//                       "receiver-rewards": 0,
//                       "round-time": 1702161998,
//                       sender:
//                         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//                       "sender-rewards": 0,
//                       "tx-type": "appl",
//                     },
//                     {
//                       "application-transaction": {
//                         accounts: [
//                           "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//                         ],
//                         "application-args": [
//                           "2nAluQ==",
//                           "Ntkgf67JEzEIjXJGsaVfoP5NK6NovlqcTXV+TaODneY=",
//                           "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
//                         ],
//                         "application-id": 6778021,
//                         "foreign-apps": [6778021],
//                         "foreign-assets": [],
//                         "global-state-schema": {
//                           "num-byte-slice": 0,
//                           "num-uint": 0,
//                         },
//                         "local-state-schema": {
//                           "num-byte-slice": 0,
//                           "num-uint": 0,
//                         },
//                         "on-completion": "noop",
//                       },
//                       "close-rewards": 0,
//                       "closing-amount": 0,
//                       "confirmed-round": 2446920,
//                       fee: 0,
//                       "first-valid": 2446917,
//                       "global-state-delta": [
//                         {
//                           key: "",
//                           value: {
//                             action: 1,
//                             bytes: "AAAAAAAAAAMAAAAAACVWSA==",
//                             uint: 0,
//                           },
//                         },
//                       ],
//                       "intra-round-offset": 0,
//                       "last-valid": 2447917,
//                       logs: [
//                         "2R5N2gAAAAAAAAAAATbZIH+uyRMxCI1yRrGlX6D+TSujaL5anE11fk2jg53mAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
//                         "eYPDXAP+QsgDo07/Pah75sDOjxakBZwOVkAsy3FYf96jdlh9Ntkgf67JEzEIjXJGsaVfoP5NK6NovlqcTXV+TaODneYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
//                         "AAAAAAAACHYB",
//                         "FR98dYA=",
//                       ],
//                       "receiver-rewards": 0,
//                       "round-time": 1702161998,
//                       sender:
//                         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//                       "sender-rewards": 0,
//                       "tx-type": "appl",
//                     },
//                   ],
//                   "intra-round-offset": 0,
//                   "last-valid": 2447917,
//                   logs: [
//                     "rQu+RAAAAAAAAAAAADbZIH+uyRMxCI1yRrGlX6D+TSujaL5anE11fk2jg53mAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAecyfX9VzAZvERp1/WkYnPxTkg1NJFNKnXS05akjO06DQA",
//                     "AAAAAAAAOJMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
//                     "AAAAAAAAOLYAAAAAAAAAAIA=",
//                     "AAAAAAAAOMoAAAAAAAAAAIA=",
//                     "0+zjAgEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB5zJ9f1XMBm8RGnX9aRic/FOSDU0kU0qddLTlqSM7ToNAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
//                     "FR98dQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
//                   ],
//                   "receiver-rewards": 0,
//                   "round-time": 1702161998,
//                   sender:
//                     "OMT5P5K4YBTPCENHL7LJDCOPYU4SBVGSIU2KTV2LJZNJEM5U5A2P5M6TLY",
//                   "sender-rewards": 0,
//                   "tx-type": "appl",
//                 },
//               ],
//               "intra-round-offset": 0,
//               "last-valid": 2447917,
//               logs: [
//                 "2rZtjAAAAAAAAAAAAQAAAAAAAAAAAAAAAAABStqDA/5CyAOjTv89qHvmwM6PFqQFnA5WQCzLcVh/3qN2WH0AAAAAAGdzdwAAAAAAZ2ylNtkgf67JEzEIjXJGsaVfoP5NK6NovlqcTXV+TaODneYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
//                 "AAAAAAAACucB",
//                 "AAAAAAAACyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
//               ],
//               note: "UmVhY2ggMC4xLjEz",
//               "receiver-rewards": 0,
//               "round-time": 1702161998,
//               sender:
//                 "RTKWX3FTDNNIHMAWHK5SDPKH3VRPPW7OS5ZLWN6RFZODF7E22YOBK2OGPE",
//               "sender-rewards": 0,
//               signature: {
//                 sig: "pAenJeieQnmY967Dp4dutRSWZYXnYODYAmbK0OBLPFm5yTl83HVhHcmwCcuaOMizVg3F8/2Xcv4GXhUj5GA9DA==",
//               },
//               "tx-type": "appl",
//             },
//             {
//               "application-transaction": {
//                 accounts: [
//                   "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//                 ],
//                 "application-args": [
//                   "ZuR8pg==",
//                   "AAAAAAAAAAABAAAAAAAAAAAAAAAAAAFK2oMD/kLIA6NO/z2oe+bAzo8WpAWcDlZALMtxWH/eo3ZYfQAAAAAAZ3N3AAAAAABnbKU22SB/rskTMQiNckaxpV+g/k0ro2i+WpxNdX5No4Od5gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
//                 ],
//                 "application-id": 21682569,
//                 "foreign-apps": [21682819, 6779767, 6778021],
//                 "foreign-assets": [],
//                 "global-state-schema": {
//                   "num-byte-slice": 0,
//                   "num-uint": 0,
//                 },
//                 "local-state-schema": {
//                   "num-byte-slice": 0,
//                   "num-uint": 0,
//                 },
//                 "on-completion": "noop",
//               },
//               "close-rewards": 0,
//               "closing-amount": 0,
//               "confirmed-round": 2447339,
//               fee: 5000,
//               "first-valid": 2447337,
//               "genesis-hash": "IXnoWtviVVJW5LGivNFc0Dq14V3kqaXuK2u5OQrdVZo=",
//               "genesis-id": "voitest-v1",
//               "global-state-delta": [
//                 {
//                   key: "",
//                   value: {
//                     action: 1,
//                     bytes: "AAAAAAAAAAMAAAAAACVX6w==",
//                     uint: 0,
//                   },
//                 },
//                 {
//                   key: "AQ==",
//                   value: {
//                     action: 1,
//                     bytes:
//                       "AAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
//                     uint: 0,
//                   },
//                 },
//               ],
//               group: "VL7NVgVPERlYni9nm/BxgYEV9Ih4PJIEIpQPAfJmhGs=",
//               id: "LA2FPO5LWI3OVDY36J3W4RMSYDD344VBNXIV5H5ANMWOQQOOXBTQ",
//               "inner-txns": [
//                 {
//                   "application-transaction": {
//                     accounts: [
//                       "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//                     ],
//                     "application-args": [
//                       "4NlbtQ==",
//                       "Ntkgf67JEzEIjXJGsaVfoP5NK6NovlqcTXV+TaODneY=",
//                       "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAecyfX9VzAZvERp1/WkYnPxTkg1NJFNKnXS05akjO06DQA",
//                     ],
//                     "application-id": 21682819,
//                     "foreign-apps": [21682819, 6779767, 6778021],
//                     "foreign-assets": [],
//                     "global-state-schema": {
//                       "num-byte-slice": 0,
//                       "num-uint": 0,
//                     },
//                     "local-state-schema": {
//                       "num-byte-slice": 0,
//                       "num-uint": 0,
//                     },
//                     "on-completion": "noop",
//                   },
//                   "close-rewards": 0,
//                   "closing-amount": 0,
//                   "confirmed-round": 2447339,
//                   fee: 0,
//                   "first-valid": 2447337,
//                   "global-state-delta": [
//                     {
//                       key: "",
//                       value: {
//                         action: 1,
//                         bytes: "AAAAAAAAAAQAAAAAACVX6wAAAAABStqG",
//                         uint: 0,
//                       },
//                     },
//                     {
//                       key: "Aw==",
//                       value: {
//                         action: 1,
//                         bytes:
//                           "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABkAAAAAAAAAAAAAAA==",
//                         uint: 0,
//                       },
//                     },
//                   ],
//                   "inner-txns": [
//                     {
//                       "close-rewards": 0,
//                       "closing-amount": 0,
//                       "confirmed-round": 2447339,
//                       fee: 0,
//                       "first-valid": 2447337,
//                       "intra-round-offset": 0,
//                       "last-valid": 2448337,
//                       "payment-transaction": {
//                         amount: 0,
//                         "close-amount": 0,
//                         receiver:
//                           "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//                       },
//                       "receiver-rewards": 0,
//                       "round-time": 1702163379,
//                       sender:
//                         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//                       "sender-rewards": 0,
//                       "tx-type": "pay",
//                     },
//                     {
//                       "application-transaction": {
//                         accounts: [
//                           "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//                         ],
//                         "application-args": [
//                           "2nAluQ==",
//                           "Ntkgf67JEzEIjXJGsaVfoP5NK6NovlqcTXV+TaODneY=",
//                           "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOpg=",
//                         ],
//                         "application-id": 6779767,
//                         "foreign-apps": [6779767],
//                         "foreign-assets": [],
//                         "global-state-schema": {
//                           "num-byte-slice": 0,
//                           "num-uint": 0,
//                         },
//                         "local-state-schema": {
//                           "num-byte-slice": 0,
//                           "num-uint": 0,
//                         },
//                         "on-completion": "noop",
//                       },
//                       "close-rewards": 0,
//                       "closing-amount": 0,
//                       "confirmed-round": 2447339,
//                       fee: 0,
//                       "first-valid": 2447337,
//                       "global-state-delta": [
//                         {
//                           key: "",
//                           value: {
//                             action: 1,
//                             bytes: "AAAAAAAAAAMAAAAAACVX6w==",
//                             uint: 0,
//                           },
//                         },
//                       ],
//                       "intra-round-offset": 0,
//                       "last-valid": 2448337,
//                       logs: [
//                         "2R5N2gAAAAAAAAAAATbZIH+uyRMxCI1yRrGlX6D+TSujaL5anE11fk2jg53mAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOpgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
//                         "eYPDXAP+QsgDo07/Pah75sDOjxakBZwOVkAsy3FYf96jdlh9Ntkgf67JEzEIjXJGsaVfoP5NK6NovlqcTXV+TaODneYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6mA==",
//                         "AAAAAAAACHYB",
//                         "FR98dYA=",
//                       ],
//                       "receiver-rewards": 0,
//                       "round-time": 1702163379,
//                       sender:
//                         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//                       "sender-rewards": 0,
//                       "tx-type": "appl",
//                     },
//                     {
//                       "application-transaction": {
//                         accounts: [
//                           "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//                         ],
//                         "application-args": [
//                           "2nAluQ==",
//                           "Ntkgf67JEzEIjXJGsaVfoP5NK6NovlqcTXV+TaODneY=",
//                           "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
//                         ],
//                         "application-id": 6778021,
//                         "foreign-apps": [6778021],
//                         "foreign-assets": [],
//                         "global-state-schema": {
//                           "num-byte-slice": 0,
//                           "num-uint": 0,
//                         },
//                         "local-state-schema": {
//                           "num-byte-slice": 0,
//                           "num-uint": 0,
//                         },
//                         "on-completion": "noop",
//                       },
//                       "close-rewards": 0,
//                       "closing-amount": 0,
//                       "confirmed-round": 2447339,
//                       fee: 0,
//                       "first-valid": 2447337,
//                       "global-state-delta": [
//                         {
//                           key: "",
//                           value: {
//                             action: 1,
//                             bytes: "AAAAAAAAAAMAAAAAACVX6w==",
//                             uint: 0,
//                           },
//                         },
//                       ],
//                       "intra-round-offset": 0,
//                       "last-valid": 2448337,
//                       logs: [
//                         "2R5N2gAAAAAAAAAAATbZIH+uyRMxCI1yRrGlX6D+TSujaL5anE11fk2jg53mAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
//                         "eYPDXAP+QsgDo07/Pah75sDOjxakBZwOVkAsy3FYf96jdlh9Ntkgf67JEzEIjXJGsaVfoP5NK6NovlqcTXV+TaODneYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
//                         "AAAAAAAACHYB",
//                         "FR98dYA=",
//                       ],
//                       "receiver-rewards": 0,
//                       "round-time": 1702163379,
//                       sender:
//                         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//                       "sender-rewards": 0,
//                       "tx-type": "appl",
//                     },
//                   ],
//                   "intra-round-offset": 0,
//                   "last-valid": 2448337,
//                   logs: [
//                     "rQu+RAAAAAAAAAAAADbZIH+uyRMxCI1yRrGlX6D+TSujaL5anE11fk2jg53mAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAecyfX9VzAZvERp1/WkYnPxTkg1NJFNKnXS05akjO06DQA",
//                     "AAAAAAAAOJMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6mAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
//                     "AAAAAAAAOLYAAAAAAAAAAIA=",
//                     "AAAAAAAAOMoAAAAAAAAAAIA=",
//                     "0+zjAgEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB5zJ9f1XMBm8RGnX9aRic/FOSDU0kU0qddLTlqSM7ToNAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
//                     "FR98dQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADqYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
//                   ],
//                   "receiver-rewards": 0,
//                   "round-time": 1702163379,
//                   sender:
//                     "OMT5P5K4YBTPCENHL7LJDCOPYU4SBVGSIU2KTV2LJZNJEM5U5A2P5M6TLY",
//                   "sender-rewards": 0,
//                   "tx-type": "appl",
//                 },
//               ],
//               "intra-round-offset": 0,
//               "last-valid": 2448337,
//               logs: [
//                 "2rZtjAAAAAAAAAAAAQAAAAAAAAAAAAAAAAABStqDA/5CyAOjTv89qHvmwM6PFqQFnA5WQCzLcVh/3qN2WH0AAAAAAGdzdwAAAAAAZ2ylNtkgf67JEzEIjXJGsaVfoP5NK6NovlqcTXV+TaODneYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
//                 "AAAAAAAACucB",
//                 "AAAAAAAACyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADqYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
//               ],
//               note: "UmVhY2ggMC4xLjEz",
//               "receiver-rewards": 0,
//               "round-time": 1702163379,
//               sender:
//                 "RTKWX3FTDNNIHMAWHK5SDPKH3VRPPW7OS5ZLWN6RFZODF7E22YOBK2OGPE",
//               "sender-rewards": 0,
//               signature: {
//                 sig: "JNCxNljMzDe8bAAXtjt+Id6mLbELf9MF6wI+WzKP8LHvK90KUrZ8Yb1ks4oESRHYFNlFr4Bp1BfIaVwRmjBWCw==",
//               },
//               "tx-type": "appl",
//             },
//           ],
//           nextToken: "nextTokenValue",
//         };

//         return Promise.resolve({
//           ...mockedResponse,
//           transactions: mockedResponse.transactions.filter(
//             (tx) =>
//               (this.minRoundVal === 0 ||
//                 tx["confirmed-round"] >= this.minRoundVal) &&
//               (this.maxRoundVal === -1 ||
//                 tx["confirmed-round"] <= this.maxRoundVal) &&
//               (this.addressVal === null || tx["sender"] === this.addressVal) &&
//               (this.roundVal === null ||
//                 tx["confirmed-round"] === this.roundVal) &&
//               (this.txidVal === null || tx["id"] === this.txidVal)
//           ),
//         });
//       }
//     };
//   }

//   // Other methods of the AlgorandIndexerClient...

//   // Method to create a mocked transaction chain
//   lookupApplicationLogs() {}

//   // Method to create a mocked transaction chain
//   searchForTransactions() {
//     return new this.MockedTransactionChain();
//   }
// }

// const indexerClient = new AlgorandIndexerClient();

// const ci = new CONTRACT(0, algodClient, indexerClient, abi, null, false, false);

test("genericHash", () => {
  expect(
    Buffer.from(
      genericHash("arc200_Transfer(address,address,uint256)")
    ).toString("base64")
  ).toBe("eYPDXE9BHdw1y+phqna8QMKDKxZtMEtj3ulg6bc/Xlk=");
});

// test("getEventSignature", () => {
//   expect(getEventSignature(abi.events[0])).toBe(
//     "arc200_Transfer(address,address,uint256)"
//   );
// });

// test("getEventByName", () => {
//   expect(ci.getEventByName).toBeDefined();
//   expect(ci.getEventByName("arc200_Transfer").getSelector).toBeDefined();
//   expect(ci.getEventByName("arc200_Transfer").getSelector()).toBe("7983c35c");
// });

// it("arc200_Transfer", () => {
//   expect(ci.arc200_Transfer).toBeDefined();
//   (async () => {
//     expect(await ci.arc200_Transfer()).toStrictEqual([
//       [
//         "WR4C7PMYKZ45ZWFWHTQRWHL424VDYXKYH4X2BX4J6KZ7BD3IQD4Q",
//         1519106,
//         1699029707,
//         "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
//         "VIAGCPULN6FUTHUNPQZDRQIHBT7IUVT264B3XDXLZNX7OZCJP6MEF7JFQU",
//         10000000000000000n,
//       ],
//       [
//         "ZWUTU6XHFFEWSTH3EBGHSLNFNNIBVXZSFVKXOV4FDQ4DX4AB3BGA",
//         1920785,
//         1700425041,
//         "2QI5WUXIIM66IN67AZ4IPP5LEXG7SVWOEXH54DQI3GUMQEK7GCNGE4RBMU",
//         "IX4WXWK6BV6V7SHAYQ2N2Z7FHVXBGLMISNXQ4CJVBTXWMD5KMZUOZSSQM4",
//         1000000n,
//       ],
//       [
//         "JBSX23KJ7CA63QWN5A25V7CKZ5MKYYD3VJDYFPJCGJULFDCVZ3IQ",
//         2396240,
//         1701994772,
//         "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//         1000000n,
//       ],
//       [
//         "JBSX23KJ7CA63QWN5A25V7CKZ5MKYYD3VJDYFPJCGJULFDCVZ3IQ",
//         2396240,
//         1701994772,
//         "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//         1000000n,
//       ],
//       [
//         "BQ6ZBXOKFEAVEE4BHCXBUYRFFG3LQLXIG6E3ELBCF6Z3VQ2USTJQ",
//         2446920,
//         1702161998,
//         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//         "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//         0n,
//       ],
//       [
//         "BQ6ZBXOKFEAVEE4BHCXBUYRFFG3LQLXIG6E3ELBCF6Z3VQ2USTJQ",
//         2446920,
//         1702161998,
//         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//         "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//         0n,
//       ],
//       [
//         "LA2FPO5LWI3OVDY36J3W4RMSYDD344VBNXIV5H5ANMWOQQOOXBTQ",
//         2447339,
//         1702163379,
//         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//         "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//         15000n,
//       ],
//       [
//         "LA2FPO5LWI3OVDY36J3W4RMSYDD344VBNXIV5H5ANMWOQQOOXBTQ",
//         2447339,
//         1702163379,
//         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//         "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//         0n,
//       ],
//     ]);
//   })();
// });
// it("arc200_Transfer({minRound:1})", () => {
//   (async () => {
//     expect(await ci.arc200_Transfer({ minRound: 1920785 })).toStrictEqual([
//       [
//         "ZWUTU6XHFFEWSTH3EBGHSLNFNNIBVXZSFVKXOV4FDQ4DX4AB3BGA",
//         1920785,
//         1700425041,
//         "2QI5WUXIIM66IN67AZ4IPP5LEXG7SVWOEXH54DQI3GUMQEK7GCNGE4RBMU",
//         "IX4WXWK6BV6V7SHAYQ2N2Z7FHVXBGLMISNXQ4CJVBTXWMD5KMZUOZSSQM4",
//         1000000n,
//       ],
//       [
//         "JBSX23KJ7CA63QWN5A25V7CKZ5MKYYD3VJDYFPJCGJULFDCVZ3IQ",
//         2396240,
//         1701994772,
//         "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//         1000000n,
//       ],
//       [
//         "JBSX23KJ7CA63QWN5A25V7CKZ5MKYYD3VJDYFPJCGJULFDCVZ3IQ",
//         2396240,
//         1701994772,
//         "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//         1000000n,
//       ],
//       [
//         "BQ6ZBXOKFEAVEE4BHCXBUYRFFG3LQLXIG6E3ELBCF6Z3VQ2USTJQ",
//         2446920,
//         1702161998,
//         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//         "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//         0n,
//       ],
//       [
//         "BQ6ZBXOKFEAVEE4BHCXBUYRFFG3LQLXIG6E3ELBCF6Z3VQ2USTJQ",
//         2446920,
//         1702161998,
//         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//         "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//         0n,
//       ],
//       [
//         "LA2FPO5LWI3OVDY36J3W4RMSYDD344VBNXIV5H5ANMWOQQOOXBTQ",
//         2447339,
//         1702163379,
//         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//         "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//         15000n,
//       ],
//       [
//         "LA2FPO5LWI3OVDY36J3W4RMSYDD344VBNXIV5H5ANMWOQQOOXBTQ",
//         2447339,
//         1702163379,
//         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//         "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//         0n,
//       ],
//     ]);
//   })();
// });
// it("arc200_Transfer({maxRound:1})", () => {
//   (async () => {
//     expect(await ci.arc200_Transfer({ maxRound: 1519106 })).toStrictEqual([
//       [
//         "WR4C7PMYKZ45ZWFWHTQRWHL424VDYXKYH4X2BX4J6KZ7BD3IQD4Q",
//         1519106,
//         1699029707,
//         "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
//         "VIAGCPULN6FUTHUNPQZDRQIHBT7IUVT264B3XDXLZNX7OZCJP6MEF7JFQU",
//         10000000000000000n,
//       ],
//     ]);
//   })();
// });
// it("arc200_Transfer({address:0x0})", async () => {
//   expect(
//     await ci.arc200_Transfer({
//       address: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
//     })
//   ).toStrictEqual([]);
// });
// it("arc200_Transfer({address:0x1})", async () => {
//   expect(
//     await ci.arc200_Transfer({
//       address: "VIAGCPULN6FUTHUNPQZDRQIHBT7IUVT264B3XDXLZNX7OZCJP6MEF7JFQU",
//     })
//   ).toStrictEqual([
//     [
//       "WR4C7PMYKZ45ZWFWHTQRWHL424VDYXKYH4X2BX4J6KZ7BD3IQD4Q",
//       1519106,
//       1699029707,
//       "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
//       "VIAGCPULN6FUTHUNPQZDRQIHBT7IUVT264B3XDXLZNX7OZCJP6MEF7JFQU",
//       10000000000000000n,
//     ],
//   ]);
// });
// it("arc200_Transfer({address:0x2})", () => {
//   (async () => {
//     expect(
//       await ci.arc200_Transfer({
//         address: "2QI5WUXIIM66IN67AZ4IPP5LEXG7SVWOEXH54DQI3GUMQEK7GCNGE4RBMU",
//       })
//     ).toStrictEqual([
//       [
//         "ZWUTU6XHFFEWSTH3EBGHSLNFNNIBVXZSFVKXOV4FDQ4DX4AB3BGA",
//         1920785,
//         1700425041,
//         "2QI5WUXIIM66IN67AZ4IPP5LEXG7SVWOEXH54DQI3GUMQEK7GCNGE4RBMU",
//         "IX4WXWK6BV6V7SHAYQ2N2Z7FHVXBGLMISNXQ4CJVBTXWMD5KMZUOZSSQM4",
//         1000000n,
//       ],
//     ]);
//   })();
// });
// it("arc200_Transfer({round:0})", () => {
//   (async () => {
//     expect(
//       await ci.arc200_Transfer({
//         round: 1,
//       })
//     ).toStrictEqual([]);
//   })();
// });
// it("arc200_Transfer({round:1})", () => {
//   (async () => {
//     expect(
//       await ci.arc200_Transfer({
//         round: 1920785,
//       })
//     ).toStrictEqual([
//       [
//         "ZWUTU6XHFFEWSTH3EBGHSLNFNNIBVXZSFVKXOV4FDQ4DX4AB3BGA",
//         1920785,
//         1700425041,
//         "2QI5WUXIIM66IN67AZ4IPP5LEXG7SVWOEXH54DQI3GUMQEK7GCNGE4RBMU",
//         "IX4WXWK6BV6V7SHAYQ2N2Z7FHVXBGLMISNXQ4CJVBTXWMD5KMZUOZSSQM4",
//         1000000n,
//       ],
//     ]);
//   })();
// });
// it("arc200_Transfer({txid:0})", () => {
//   (async () => {
//     expect(
//       await ci.arc200_Transfer({
//         txid: "_",
//       })
//     ).toStrictEqual([]);
//   })();
// });
// it("arc200_Transfer({txid:2})", () => {
//   (async () => {
//     expect(
//       await ci.arc200_Transfer({
//         txid: "JBSX23KJ7CA63QWN5A25V7CKZ5MKYYD3VJDYFPJCGJULFDCVZ3IQ",
//       })
//     ).toStrictEqual([
//       [
//         "JBSX23KJ7CA63QWN5A25V7CKZ5MKYYD3VJDYFPJCGJULFDCVZ3IQ",
//         2396240,
//         1701994772,
//         "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//         1000000n,
//       ],
//       [
//         "JBSX23KJ7CA63QWN5A25V7CKZ5MKYYD3VJDYFPJCGJULFDCVZ3IQ",
//         2396240,
//         1701994772,
//         "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//         1000000n,
//       ],
//     ]);
//   })();
// });
// it("arc200_Approval", () => {
//   expect(ci.arc200_Approval).toBeDefined();
//   (async () => {
//     expect(await ci.arc200_Approval()).toStrictEqual([
//       [
//         "JBSX23KJ7CA63QWN5A25V7CKZ5MKYYD3VJDYFPJCGJULFDCVZ3IQ",
//         2396240,
//         1701994772,
//         "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//         999999995999998n,
//       ],
//       [
//         "JBSX23KJ7CA63QWN5A25V7CKZ5MKYYD3VJDYFPJCGJULFDCVZ3IQ",
//         2396240,
//         1701994772,
//         "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//         "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//         999999995999998n,
//       ],
//     ]);
//   })();
// });
// it("getEvents()", () => {
//   expect(ci.getEvents).toBeDefined();
//   (async () => {
//     expect(await ci.getEvents()).toStrictEqual([
//       {
//         events: [
//           [
//             "WR4C7PMYKZ45ZWFWHTQRWHL424VDYXKYH4X2BX4J6KZ7BD3IQD4Q",
//             1519106,
//             1699029707,
//             "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
//             "VIAGCPULN6FUTHUNPQZDRQIHBT7IUVT264B3XDXLZNX7OZCJP6MEF7JFQU",
//             10000000000000000n,
//           ],
//           [
//             "ZWUTU6XHFFEWSTH3EBGHSLNFNNIBVXZSFVKXOV4FDQ4DX4AB3BGA",
//             1920785,
//             1700425041,
//             "2QI5WUXIIM66IN67AZ4IPP5LEXG7SVWOEXH54DQI3GUMQEK7GCNGE4RBMU",
//             "IX4WXWK6BV6V7SHAYQ2N2Z7FHVXBGLMISNXQ4CJVBTXWMD5KMZUOZSSQM4",
//             1000000n,
//           ],
//           [
//             "JBSX23KJ7CA63QWN5A25V7CKZ5MKYYD3VJDYFPJCGJULFDCVZ3IQ",
//             2396240,
//             1701994772,
//             "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//             "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//             1000000n,
//           ],
//           [
//             "JBSX23KJ7CA63QWN5A25V7CKZ5MKYYD3VJDYFPJCGJULFDCVZ3IQ",
//             2396240,
//             1701994772,
//             "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//             "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//             1000000n,
//           ],
//           [
//             "BQ6ZBXOKFEAVEE4BHCXBUYRFFG3LQLXIG6E3ELBCF6Z3VQ2USTJQ",
//             2446920,
//             1702161998,
//             "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//             "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//             0n,
//           ],
//           [
//             "BQ6ZBXOKFEAVEE4BHCXBUYRFFG3LQLXIG6E3ELBCF6Z3VQ2USTJQ",
//             2446920,
//             1702161998,
//             "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//             "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//             0n,
//           ],
//           [
//             "LA2FPO5LWI3OVDY36J3W4RMSYDD344VBNXIV5H5ANMWOQQOOXBTQ",
//             2447339,
//             1702163379,
//             "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//             "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//             15000n,
//           ],
//           [
//             "LA2FPO5LWI3OVDY36J3W4RMSYDD344VBNXIV5H5ANMWOQQOOXBTQ",
//             2447339,
//             1702163379,
//             "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//             "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//             0n,
//           ],
//         ],
//         name: "arc200_Transfer",
//         selector: "7983c35c",
//         signature: "arc200_Transfer(address,address,uint256)",
//       },
//       {
//         events: [
//           [
//             "JBSX23KJ7CA63QWN5A25V7CKZ5MKYYD3VJDYFPJCGJULFDCVZ3IQ",
//             2396240,
//             1701994772,
//             "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//             "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//             999999995999998n,
//           ],
//           [
//             "JBSX23KJ7CA63QWN5A25V7CKZ5MKYYD3VJDYFPJCGJULFDCVZ3IQ",
//             2396240,
//             1701994772,
//             "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//             "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//             999999995999998n,
//           ],
//         ],
//         name: "arc200_Approval",
//         selector: "1969f865",
//         signature: "arc200_Approval(address,address,uint256)",
//       },
//     ]);
//   })();
// });
// it("getEvents({address:0})", () => {
//   (async () => {
//     expect(
//       await ci.getEvents({
//         address: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
//       })
//     ).toStrictEqual([
//       {
//         events: [],
//         name: "arc200_Transfer",
//         selector: "7983c35c",
//         signature: "arc200_Transfer(address,address,uint256)",
//       },
//       {
//         events: [],
//         name: "arc200_Approval",
//         selector: "1969f865",
//         signature: "arc200_Approval(address,address,uint256)",
//       },
//     ]);
//   })();
// });
// it("getEvents({minRound:1})", () => {
//   (async () => {
//     expect(
//       await ci.getEvents({
//         minRound: 2396240,
//       })
//     ).toStrictEqual([
//       {
//         events: [
//           [
//             "JBSX23KJ7CA63QWN5A25V7CKZ5MKYYD3VJDYFPJCGJULFDCVZ3IQ",
//             2396240,
//             1701994772,
//             "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//             "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//             1000000n,
//           ],
//           [
//             "JBSX23KJ7CA63QWN5A25V7CKZ5MKYYD3VJDYFPJCGJULFDCVZ3IQ",
//             2396240,
//             1701994772,
//             "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//             "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//             1000000n,
//           ],
//           [
//             "BQ6ZBXOKFEAVEE4BHCXBUYRFFG3LQLXIG6E3ELBCF6Z3VQ2USTJQ",
//             2446920,
//             1702161998,
//             "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//             "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//             0n,
//           ],
//           [
//             "BQ6ZBXOKFEAVEE4BHCXBUYRFFG3LQLXIG6E3ELBCF6Z3VQ2USTJQ",
//             2446920,
//             1702161998,
//             "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//             "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//             0n,
//           ],
//           [
//             "LA2FPO5LWI3OVDY36J3W4RMSYDD344VBNXIV5H5ANMWOQQOOXBTQ",
//             2447339,
//             1702163379,
//             "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//             "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//             15000n,
//           ],
//           [
//             "LA2FPO5LWI3OVDY36J3W4RMSYDD344VBNXIV5H5ANMWOQQOOXBTQ",
//             2447339,
//             1702163379,
//             "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//             "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//             0n,
//           ],
//         ],
//         name: "arc200_Transfer",
//         selector: "7983c35c",
//         signature: "arc200_Transfer(address,address,uint256)",
//       },
//       {
//         events: [
//           [
//             "JBSX23KJ7CA63QWN5A25V7CKZ5MKYYD3VJDYFPJCGJULFDCVZ3IQ",
//             2396240,
//             1701994772,
//             "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//             "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//             999999995999998n,
//           ],
//           [
//             "JBSX23KJ7CA63QWN5A25V7CKZ5MKYYD3VJDYFPJCGJULFDCVZ3IQ",
//             2396240,
//             1701994772,
//             "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
//             "AP7EFSADUNHP6PNIPPTMBTUPC2SALHAOKZACZS3RLB755I3WLB67PPCJTY",
//             999999995999998n,
//           ],
//         ],
//         name: "arc200_Approval",
//         selector: "1969f865",
//         signature: "arc200_Approval(address,address,uint256)",
//       },
//     ]);
//   })();
// });

// it("getEvents({minRound:2})", () => {
//   (async () => {
//     expect(
//       await ci.getEvents({
//         minRound: 2447340,
//       })
//     ).toStrictEqual([
//       {
//         events: [],
//         name: "arc200_Transfer",
//         selector: "7983c35c",
//         signature: "arc200_Transfer(address,address,uint256)",
//       },
//       {
//         events: [],
//         name: "arc200_Approval",
//         selector: "1969f865",
//         signature: "arc200_Approval(address,address,uint256)",
//       },
//     ]);
//   })();
// });
// // TODO: decode method return type of bool with res_ui [0] is false
// // TODO: decode method return type of bool with res_ui [128] is true
// // TODO: decode method return type of bool with res_ui [0,0,0,0,0,0,0,0] is false
// // TODO: decode method return type of bool with res_ui [0,0,0,0,0,0,0,1] is true
