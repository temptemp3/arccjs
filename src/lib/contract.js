import algosdk, { encodeAddress, bytesToBigInt } from "algosdk";
import { oneAddress } from "../utils/account.js";
import { Buffer } from "buffer";
import sha512 from "js-sha512";

const ctcInfoBc200 = 29096344; // beacon200
const selNop = "58759fa2"; // nop()void"

async function doWaitForConfirmation(algodClient, txId) {
  let status = await algodClient.status().do();
  let lastRound = status["last-round"];
  while (true) {
    const pendingInfo = await algodClient
      .pendingTransactionInformation(txId)
      .do();
    if (
      pendingInfo["confirmed-round"] !== null &&
      pendingInfo["confirmed-round"] > 0
    ) {
      // Confirmed transaction
      console.log(
        "Transaction confirmed in round",
        pendingInfo["confirmed-round"]
      );
      break;
    }
    lastRound++;
    await algodClient.statusAfterBlock(lastRound).do();
  }
}

export const genericHash = (arr) => {
  return sha512.sha512_256.array(arr);
};

export const getEventSignature = (event) => {
  const signature =
    event.name + "(" + event.args.map((a) => a.type).join(",") + ")";
  return signature;
};

export const getEventSelector = (event) => {
  return Buffer.from(
    genericHash(getEventSignature(event)).slice(0, 4)
  ).toString("hex");
};

const decodeEventArgs = (args, x) => {
  const argv = Buffer.from(x, "base64");
  const arg0 = argv.slice(0).toString("hex");
  let index = 4;
  const encoded = [];
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
        const b = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const c = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        encoded.push([a, [b, c]]);
        break;
      }
      case "(uint64,uint64,uint64,uint64,(uint64,uint64),uint64,(byte,byte[8]),byte[8],uint64,byte[8],uint64,byte[8],uint64,uint64,byte[8],uint64)": {
        const a = bytesToBigInt(argv.slice(index, index + 8)); // uint64 ctInfo
        index += 8;
        const b = bytesToBigInt(argv.slice(index, index + 8)); // uint64 startBlock
        index += 8;
        const c = bytesToBigInt(argv.slice(index, index + 8)); // uint64 endBlock
        index += 8;
        const d = bytesToBigInt(argv.slice(index, index + 8)); // uint64 rewardTokenId
        index += 8;
        const e = bytesToBigInt(argv.slice(index, index + 8)); // (uint64,uint64) rewardsPerBlock
        index += 8;
        const f = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const g = bytesToBigInt(argv.slice(index, index + 8)); // uint64 stakedTokenId
        index += 8;
        const h = argv.slice(index, index + 1).toString("hex"); // (byte,byte[8]) pairTokenAId
        index += 1;
        const i = argv.slice(index, index + 8).toString("hex");
        index += 8;
        const j = argv.slice(index, index + 8).toString("hex"); // byte[8] pairTokenASymbol
        index += 8;
        const k = bytesToBigInt(argv.slice(index, index + 8)); // uint64 pairTokenBId
        index += 8;
        const l = argv.slice(index, index + 8).toString("hex"); // byte[8] pairTokenBSymbol
        index += 8;
        const m = bytesToBigInt(argv.slice(index, index + 8)); // uint64 rewardTokenDecimals
        index += 8;
        const n = argv.slice(index, index + 8).toString("hex"); // byte[8] rewardTokenSymbol
        index += 8;
        const o = bytesToBigInt(argv.slice(index, index + 8)); // uint64 stakedTokenDecimals
        index += 8;
        const p = bytesToBigInt(argv.slice(index, index + 8)); // uint64 stakedTokenPoolId
        index += 8;
        const r = argv.slice(index, index + 8).toString("hex"); // byte[8] stakedTokenSymbol
        index += 8;
        const s = bytesToBigInt(argv.slice(index, index + 8)); // uint64 stakedTokenTotalSupply
        index += 8;
        encoded.push([
          a, // uint64 ctInfo
          b, // uint64 startBlock
          c, // uint64 endBlock
          d, // uint64 rewardTokenId
          [e, f], // (uint64,uint64) rewardsPerBlock
          g, // uint64 stakedTokenId
          [h, i], // (byte,byte[8]) pairTokenAId
          j, // byte[8] pairTokenASymbol
          k, // uint64 pairTokenBId
          l, // byte[8] pairTokenBSymbol
          m, // uint64 rewardTokenDecimals
          n, // byte[8] rewardTokenSymbol
          o, // uint64 stakedTokenDecimals
          p, // uint64 stakedTokenPoolId
          r, // byte[8] stakedTokenSymbol
          s, // uint64 stakedTokenTotalSupply
        ]);
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
      case "(uint64,uint64)": {
        const a = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        const b = bytesToBigInt(argv.slice(index, index + 8));
        index += 8;
        encoded.push([a, b]);
        break;
      }
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  });
  return encoded;
};

const getSelectors = (logs) =>
  logs.map((x) => Buffer.from(x, "base64").slice(0, 4).toString("hex"));

const isEvent = (selectors, x) => selectors.some((y) => x.includes(y));

const selectEvent = (selector, mSelectors) => {
  const index = mSelectors.indexOf(selector);
  return index;
};

const getEvents = (txn, selectors) => {
  const events = {};
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

const getEventsByNames = async (ci, names, query) => {
  const { minRound, maxRound, address, round, txid, sender } = query || {};
  const events = {};
  const selectorNameLookup = {};
  const selectorSignatureLookup = {};
  const selectors = names.map((x) => {
    const selector = getEventByName(ci.spec.events, x).getSelector();
    const signature = getEventSignature(
      ci.spec.events.find((y) => y.name === x)
    );
    selectorNameLookup[selector] = x;
    selectorSignatureLookup[selector] = signature;
    return selector;
  });
  selectors.forEach((x) => (events[x] = []));

  let next;

  // get txns

  const txns = [];
  next = undefined;
  do {
    const itxn = ci.indexerClient
      .searchForTransactions()
      .applicationID(ci.contractId)
      .limit(1000)
      .nextToken(next);
    if (minRound) itxn.minRound(minRound);
    if (maxRound) itxn.maxRound(maxRound);
    if (address) itxn.address(address);
    if (round) itxn.round(round);
    if (txid) itxn.txid(txid);
    const res = await itxn.do();
    for (const txn of res.transactions) {
      txns.push(txn);
    }
    next = res["next-token"];
  } while (next);

  // get logs

  const logs = [];
  const logS = new Set();
  next = undefined;
  do {
    const ilog = ci.indexerClient
      .lookupApplicationLogs(ci.contractId)
      .limit(1000)
      .nextToken(next);
    if (minRound) ilog.minRound(minRound);
    if (maxRound) ilog.maxRound(maxRound);
    if (sender) ilog.sender(sender);
    if (round) ilog.round(round);
    if (txid) ilog.txid(txid);
    const res = await ilog.do();
    if (next === res["next-token"]) break;
    const rLogData = res["log-data"];
    const logData =
      rLogData?.map((el) => ({
        applicationId: res["application-id"],
        round: res["current-round"],
        txid: el["txid"],
        logs: el["logs"],
      })) || [];
    for (const log of logData) {
      const key = log.txid + log.logs.join();
      if (logS.has(key)) continue;
      const txn = txns.find((x) => x.id === log.txid);
      if (!txn) {
        const { transaction: txn } = await ci.indexerClient
          .lookupTransactionByID(log.txid)
          .do();
        logs.push({
          ...log,
          round: txn["confirmed-round"],
          roundTime: txn["round-time"],
        });
      } else {
        logs.push({
          ...log,
          round: txn["confirmed-round"],
          roundTime: txn["round-time"],
        });
      }
      logS.add(key);
    }
    next = res["next-token"];
  } while (next);

  // merge txns and logs adding round-time and confirmed-round to logdata
  const merged = [];
  for (const log of logs) {
    const mergedLog = {
      applicationId: log.applicationId,
      id: log.txid,
      logs: log.logs,
      ["confirmed-round"]: log.round,
      ["round-time"]: log.roundTime,
    };
    merged.push(mergedLog);
  }

  // get events
  for (const txn of merged) {
    const evts = getEvents(txn, selectors);
    for (const [k, v] of Object.entries(evts)) {
      if (!v.length) continue;
      events[k].push(v);
    }
  }
  return (Object.entries(events) || []).map(([k, v]) => {
    const name = selectorNameLookup[k];
    const signature = selectorSignatureLookup[k];
    const selector = k;
    const events = v.map((el) => [
      ...el.slice(0, 3),
      ...el
        .slice(3)
        .map((el) =>
          decodeEventArgs(
            ci.spec.events.find((el) => el.name === name).args,
            el
          )
        )
        .flat(),
    ]);
    events.sort((a, b) => a[1] - b[1]); // sort by round
    return {
      name,
      signature,
      selector,
      events,
    };
  });
};

const getEventByName = (events, name) => {
  const event = events.find((event) => event.name === name);
  if (!event) {
    throw new Error(`Event ${name} not found`);
  }
  return {
    getSelector: () => getEventSelector(event),
    next: () => {}, //() => Promise<Event<T>>,
    nextUpToTime: () => {}, //(t: Time) => Promise<undefined | Event<T>>,
    nextUpToNow: () => {}, //() => Promise<undefined | Event<T>>,
    seek: () => {}, //(t: Time) => void,
    seekNow: () => {}, //() => Promise<void>,
    lastTime: () => {}, //() => Promise<Time>,
    monitor: () => {}, //((Event<T>) => void) => Promise<void>,
  };
};
export default class CONTRACT {
  constructor(
    contractId,
    algodClient,
    indexerClient,
    spec,
    acc,
    simulate = true,
    waitForConfirmation = false,
    objectOnly = false
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
    this.beaconId = ctcInfoBc200;
    this.beaconSel = selNop;
    this.optIns = [];
    for (const eventSpec of spec.events) {
      this[eventSpec.name] = async function (...args) {
        const response = await getEventsByNames(
          this,
          [eventSpec.name],
          ...args
        );
        return response[0]?.events ?? [];
      }.bind(this);
    }
    for (const methodSpec of spec.methods) {
      const abiMethod = this.contractABI.getMethodByName(methodSpec.name);
      this[methodSpec.name] = async function (...args) {
        if (methodSpec.readonly) {
          // If the method is readonly, we can just simulate it
          return await this.createAndSimulateTxn(abiMethod, args);
        } else {
          const obj = this.createAppCallTxnObject(abiMethod, args);
          if (this.objectOnly) {
            return { obj };
          }
          if (simulate) {
            const sim = await this.createAndSimulateTxn(abiMethod, args);
            if (sim.success) {
              const txns = await this.createUtxns(abiMethod, args);
              const res = { ...sim, txns };
              return res;
            }
            return sim;
          }
          const res = await this.createAndSendTxn(abiMethod, args);
          if (this.waitForConfirmation) {
            await doWaitForConfirmation(this.algodClient, res.txId);
          }
          return res;
        }
      }.bind(this);
    }
  }

  getOptIns() {
    return this.optIns;
  }

  getBeaconId() {
    return this.beaconId;
  }

  getBeaconSelector() {
    return this.beaconSel;
  }

  getEnableGroupResourceSharing() {
    return this.enableGroupResourceSharing;
  }

  getExtraTxns() {
    return this.extraTxns;
  }

  getContractId() {
    return this.contractId;
  }

  getSender() {
    return this.sender;
  }

  getSk() {
    return this.sk;
  }

  getSimulate() {
    return this.simulate;
  }

  setOptins(optIns) {
    this.optIns = optIns;
  }

  setBeaconSelector(beaconSel) {
    this.beaconSel = beaconSel;
  }

  setEnableGroupResourceSharing(enableGroupResourceSharing) {
    this.enableGroupResourceSharing = enableGroupResourceSharing;
  }

  setExtraTxns(extraTxns) {
    this.extraTxns = extraTxns;
  }

  setAccounts(accounts) {
    this.accounts = accounts;
  }

  setTransfers(transfers) {
    this.transfers = transfers;
  }

  setAssetTransfers(assetTransfers) {
    this.assetTransfers = assetTransfers;
  }

  setPaymentAmount(amount) {
    this.paymentAmount = amount;
  }

  setSimulate(simulate) {
    this.simulate = simulate;
  }

  setFee(fee) {
    this.fee = fee;
  }

  setBeaconId(beaconId) {
    this.beaconId = beaconId;
  }

  getAccounts() {
    return this.accounts;
  }

  getEventByName(event) {
    return getEventByName(this.spec.events, event);
  }

  getEvents(query) {
    return getEventsByNames(
      this,
      this.spec.events.map((x) => x.name),
      query
    );
  }

  async createAndSendTxn(abiMethod, args) {
    try {
      // logic to create and send a real transaction using simulationResult
      const utxns = await this.createUtxns(abiMethod, args);
      const stxns = await this.signTxns(utxns, this.sk);
      const res = await this.algodClient.sendRawTransaction(stxns).do();
      return { ...res, success: true };
    } catch (error) {
      console.error("Error in createAndSendTxn:", error);
      //throw error; // Re-throw the error after logging it
      return { success: false, error };
    }
  }

  async signTxns(utxnsB64, sk) {
    const txns = utxnsB64.map((utxn) =>
      algosdk.decodeUnsignedTransaction(Buffer.from(utxn, "base64"))
    );
    const stxns = txns.map((txn) => txn.signTxn(sk));
    return stxns;
  }

  async createAndSimulateTxn(abiMethod, args) {
    let response;
    try {
      response = await this.simulateTxn(abiMethod, args);
      return {
        success: true,
        returnValue: this.handleSimulationResponse(response, abiMethod),
        response,
      };
    } catch (error) {
      //console.error("Error in createAndSimulateTxn:", error);
      //throw error; // Re-throw the error after logging it
      return { success: false, error };
    }
  }

  createAppCallTxnObject(abiMethod, args) {
    const appArgs = args.map((arg, index) => {
      return abiMethod.args[index].type.encode(arg);
    });
    return {
      from: this.sender,
      appIndex: this.contractId,
      appArgs: [abiMethod.getSelector(), ...appArgs],
    };
  }

  async createUtxns(abiMethod, args) {
    try {
      const sRes = await this.simulateTxn(abiMethod, args);

      if (!sRes) return;

      // Get the suggested transaction parameters
      const params = await this.algodClient.getTransactionParams().do();

      // Encode arguments

      const encodedArgs = args.map((arg, index) => {
        return abiMethod.args[index].type.encode(arg);
      });

      const txns = [];

      // build group resource sharing txns in case of extra txns (only boxes)
      let grsOffset = 0;
      if (this.enableGroupResourceSharing && this.extraTxns.length > 0) {
        const ura = {
          accounts: [],
          appLocals: [],
          apps: [],
          assetHoldings: [],
          assets: [],
          boxes: [],
          extraBoxRefs: [],
        };
        const gurs = sRes.txnGroups[0]?.unnamedResourcesAccessed ?? ura;
        const boxApps = gurs.boxes.map((x) => x.app);
        const boxNames = new Map();
        for (const box of gurs.boxes) {
          if (!boxNames.has(box.app)) {
            boxNames.set(box.app, []);
          }
          boxNames.get(box.app).push(box.name);
        }
        grsOffset += boxApps.length;
        for (const app of boxNames.keys()) {
          // split box names into groups of 4
          const boxNamesGroups = [];
          for (let i = 0; i < boxNames.get(app).length; i += 4) {
            boxNamesGroups.push(boxNames.get(app).slice(i, i + 4));
          }
          for (const boxNamesGroup of boxNamesGroups) {
            const txn = algosdk.makeApplicationCallTxnFromObject({
              suggestedParams: {
                ...params,
                flatFee: true,
                fee: 1000,
              },
              from: this.sender,
              appIndex: this.beaconId,
              appArgs: [new Uint8Array(Buffer.from(this.beaconSel, "hex"))],
              accounts: [...this.getAccounts()],
              foreignApps: [app],
              boxes: boxNamesGroup.map((x) => ({ appIndex: app, name: x })),
            });
            txns.push(txn);
          }
        }
        // accounts
        //   if(gurs.accounts > 0) {
        //     // split accounts into groups of 4
        //     const accounts = gurs.accounts;
        //     const accountGroups = [];
        //     for (let i = 0; i < accounts.length; i += 4) {
        //       accountGroups.push(accounts.slice(i, i + 4));
        //     }
        //     for(const group of accountGroups) {
        //       const txn = algosdk.makeApplicationCallTxnFromObject({
        //         suggestedParams: {
        //           ...params,
        //           flatFee: true,
        //           fee: 1000,
        //         },
        //         from: this.sender,
        //         appIndex: this.contractId,
        //         appArgs: [new Uint8Array(Buffer.from("e33d8052", "hex"))],
        //         accounts: [...group],
        //       });
        //       txns.push(txn);
        //     }
        //   }
        // ---------------------------------------
        // appLocals
        // sample appLocals:
        //   {
        //     account:
        //       "GWV3Q335A5FLU7OEA7GSIOSCTWSRQ6BH2YARNO56O6TQ3K2MTELFNGBGVY",
        //     app: 6779767,
        //     attribute_map: {
        //       account: "account",
        //       app: "app",
        //     },
        //   },
        //if (gurs.appLocals.length > 0) {
        // not yet supported
        //}
        // ---------------------------------------
      }

      if (this.paymentAmount > 0) {
        const txn1 = algosdk.makePaymentTxnWithSuggestedParams(
          this.sender,
          algosdk.getApplicationAddress(this.contractId),
          this.paymentAmount,
          undefined,
          undefined,
          {
            ...params,
            flatFee: true,
            fee: 1000,
          }
        );
        txns.push(txn1);
      }

      this.transfers.forEach(([amount, addr]) => {
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          suggestedParams: {
            ...params,
            flatFee: true,
            fee: 1000,
          },
          from: this.sender,
          to: addr,
          amount,
        });
        txns.push(txn);
      });

      this.assetTransfers.forEach(([amount, token]) => {
        const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          suggestedParams: {
            ...params,
            flatFee: true,
            fee: 1000,
          },
          from: this.sender,
          to: algosdk.getApplicationAddress(this.contractId),
          amount,
          assetIndex: token,
        });
        txns.push(txn);
      });

      const appCallTxns = [];

      // Create the application call transaction object

      if (abiMethod.name !== "custom") {
        appCallTxns.push({
          suggestedParams: {
            ...params,
            flatFee: true,
            fee: this.fee,
          },
          from: this.sender,
          appIndex: this.contractId,
          appArgs: [abiMethod.getSelector(), ...encodedArgs], // Adjust appArgs based on methodSpec and args
        });
      }

      if (this.extraTxns.length > 0) {
        appCallTxns.push(
          ...this.extraTxns.map((txn) => ({
            ...txn,
            suggestedParams: {
              ...params,
              flatFee: true,
              fee: this.fee,
            },
          }))
        );
      }

      // Add the application call transactions to the list of transactions
      // with unnamed resources accessed added
      const offset = this.paymentAmount > 0 ? 1 : 0; // offset for payment transaction
      const index =
        grsOffset + offset + this.assetTransfers.length + this.transfers.length; // index for appCallTxns
      // unnamedResourcesAccessed fallback
      const ura = {
        accounts: [],
        appLocals: [],
        apps: [],
        assetHoldings: [],
        assets: [],
        boxes: [],
        extraBoxRefs: [],
      };
      // group unnamedResourcesAccessed
      const gurs = sRes.txnGroups[0]?.unnamedResourcesAccessed ?? ura;
      txns.push(
        ...appCallTxns.map((appCallTxn, j) =>
          algosdk.makeApplicationCallTxnFromObject(
            ((txn) => {
              const i = j + index;
              // transaction unnamedResourcesAccessed raw
              const turs =
                sRes.txnGroups[0]?.txnResults[i]?.unnamedResourcesAccessed ??
                ura;
              // transaction apps
              const tApps = Array.from(
                new Set([
                  txn.appIndex,
                  ...(gurs?.apps ?? []),
                  ...(turs?.apps ?? []),
                ])
              );
              // transaction boxes
              const tBoxes = this.enableGroupResourceSharing
                ? []
                : [...(gurs?.boxes ?? []), ...(turs?.boxes ?? [])]
                    .filter((x) => tApps.includes(x.app))
                    .map((x) => ({ appIndex: x.app, name: x.name }));
              // transaction accounts
              const tAccounts = Array.from(
                new Set([...(gurs?.accounts ?? []), ...(turs?.accounts ?? [])])
              );
              // transaction assets
              const tAssets = Array.from(
                new Set([...(gurs?.assets ?? []), ...(turs?.assets ?? [])])
              );
              // transaction unnamedResourcesAccessed prepared
              const unnamedResourcesAccessed = {
                accounts: tAccounts,
                boxes: tBoxes,
                accounts: tAccounts,
                foreignApps: tApps,
                foreignAssets: tAssets,
              };
              // final transaction
              const ftxn = {
                ...txn,
                ...unnamedResourcesAccessed,
              };
              return ftxn;
            })(appCallTxn)
          )
        )
      );

      if (this.optIns.length > 0) {
        const optInTxns = this.optIns.map((optIn) => {
          return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            suggestedParams: {
              ...params,
              flatFee: true,
              fee: 1000,
            },
            from: this.sender,
            to: this.sender,
            amount: 0,
            assetIndex: optIn,
          });
        });
        txns.push(...optInTxns);
      }

      const txngroup = algosdk.assignGroupID(txns);

      const utxns = txns.map((t) =>
        Buffer.from(algosdk.encodeUnsignedTransaction(t)).toString("base64")
      );

      return utxns;
    } catch (error) {
      // console.error('Error in createAndSimulateTxn:', error);
      throw error; // Re-throw the error after logging it
    }
  }

  getRIndex() {
    const offsets = [
      this.paymentAmount > 0 ? 1 : 0,
      this.assetTransfers.length,
      this.transfers.length,
    ];
    return offsets.reduce((a, b) => a + b, 0);
  }

  async simulateTxn(abiMethod, args) {
    try {
      // Get the suggested transaction parameters
      const params = await this.algodClient.getTransactionParams().do();

      // Encode arguments

      const encodedArgs = args.map((arg, index) => {
        return abiMethod.args[index].type.encode(arg);
      });

      const txns = [];

      if (this.paymentAmount > 0) {
        const txn1 = txns.push(
          algosdk.makePaymentTxnWithSuggestedParams(
            this.sender,
            algosdk.getApplicationAddress(this.contractId),
            this.paymentAmount,
            undefined,
            undefined,
            {
              ...params,
              flatFee: true,
              fee: 1000,
            }
          )
        );
      }

      this.transfers.forEach(([amount, addr]) => {
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          suggestedParams: {
            ...params,
            flatFee: true,
            fee: 1000,
          },
          from: this.sender,
          to: addr,
          amount,
        });
        txns.push(txn);
      });

      this.assetTransfers.forEach(([amount, token]) => {
        const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          suggestedParams: {
            ...params,
            flatFee: true,
            fee: 1000,
          },
          from: this.sender,
          to: algosdk.getApplicationAddress(this.contractId),
          amount,
          assetIndex: token,
        });
        txns.push(txn);
      });

      const appCallTxns = [];

      if (abiMethod.name !== "custom") {
        appCallTxns.push({
          suggestedParams: {
            ...params,
            flatFee: true,
            fee: this.fee,
          },
          from: this.sender,
          appIndex: this.contractId,
          appArgs: [abiMethod.getSelector(), ...encodedArgs], // Adjust appArgs based on methodSpec and args
        });
      }

      if (this.extraTxns.length > 0) {
        appCallTxns.push(
          ...this.extraTxns.map((txn) => ({
            ...txn,
            suggestedParams: {
              ...params,
              flatFee: true,
              fee: this.fee,
            },
          }))
        );
      }

      txns.push(
        ...appCallTxns.map((appCallTxn, i) =>
          algosdk.makeApplicationCallTxnFromObject(appCallTxn)
        )
      );

      const txngroup = algosdk.assignGroupID(txns);
      // Sign the transaction
      const stxns = txns.map(algosdk.encodeUnsignedSimulateTransaction);

      // Construct the simulation request
      const request = new algosdk.modelsv2.SimulateRequest({
        txnGroups: [
          new algosdk.modelsv2.SimulateRequestTransactionGroup({
            txns: stxns.map(algosdk.decodeObj),
          }),
        ],
        allowUnnamedResources: true,
        allowEmptySignatures: true,
      });

      // Simulate the transaction group
      const response = await this.algodClient
        .simulateTransactions(request)
        .do();
      return response;
    } catch (error) {
      // console.error('Error in createAndSimulateTxn:', error);
      throw error; // Re-throw the error after logging it
    }
  }

  handleSimulationResponse(response, abiMethod) {
    return this.simulationResultHandler(response, abiMethod);
  }

  decodeSimulationResponse(response, abiMethod) {
    try {
      // Handle the simulation results
      if (response.txnGroups[0].failureMessage) {
        throw response.txnGroups[0].failureMessage;
      }
      const index = this.getRIndex();
      const rlog = response.txnGroups[0].txnResults[index].txnResult.logs.pop();
      const rlog_ui = Uint8Array.from(Buffer.from(rlog, "base64"));
      const res_ui = rlog_ui.slice(4);

      // Decode the response based on the methodSpec
      let result;
      if (abiMethod.returns.type == "void") {
        result = null;
      }
      // decode method return type of bool
      else if (abiMethod.returns.type == "bool") {
        // HACK: Hacking this because some early arc72 forgot to cast to bool
        if (res_ui.length === 8) {
          const r = res_ui.slice(-1);
          switch (r[0]) {
            case 0:
              result = abiMethod.returns.type.decode(
                new Uint8Array(Buffer.from([0]))
              );
              break;
            case 1:
              result = abiMethod.returns.type.decode(
                new Uint8Array(Buffer.from([128]))
              );
              break;
          }
        } else {
          result = abiMethod.returns.type.decode(res_ui);
        }
      }
      //HACK: Hacking this because the decode function doesn't work on bytes
      else if (abiMethod.returns.type.childType == "byte") {
        result = new TextDecoder().decode(res_ui);
      } else {
        result = abiMethod.returns.type.decode(res_ui);
      }

      return result;
    } catch (error) {
      // console.error('Error in handleSimulationResponse:', error);
      throw error; // Re-throw the error after logging it
    }
  }
}
