# SKILL.md — Agent Reference for arccjs

This file is the **canonical source of truth** for AI coding agents
working in the arccjs codebase. It provides a complete, structured
reference to the project's architecture, conventions, and key
implementation details.

Multiple convention files at the repo root point here. If you are an
agent, you are in the right place.

## Convention File Index

This project maintains agent-assist files for multiple frameworks.
All point to this file as the canonical reference. When updating
project conventions, update this file first — the root-level files
are summaries.

| File | Convention | Audience |
|------|-----------|----------|
| `docs/SKILL.md` | Canonical reference | All agents (this file) |
| `CLAUDE.md` | Claude Code / Claude agents | Anthropic Claude |
| `.cursorrules` | Cursor IDE | Cursor AI |
| `AGENTS.md` | OpenClaw / Codex / Devin / SWE-agent | General agents |
| `CONTRIBUTING.md` | GitHub Copilot Workspace / human contributors | Copilot + humans |

When adding a new convention file for another agent framework, add it
to this table and ensure it references `docs/SKILL.md`.

## What This Project Is

arccjs is an ABI-centric Atomic Transaction Composer for Algorand AVM
workflows. It takes a JSON ABI spec describing a smart contract's methods
and events, and produces a callable object that handles encoding,
simulation, resource resolution, signing, and submission.

The library is used in production DeFi applications (lending, DEX, token
operations) and prioritizes developer ergonomics over internal purity.

## Tech Stack

- **Language**: TypeScript (strict), ESM-only
- **Runtime**: Node >= 20.9
- **Build**: `tsc` → `dist/` (JS + `.d.ts` + source maps)
- **Test**: Vitest
- **Dependencies**: `algosdk` (v3), `js-sha512`, `buffer`
- **No bundler** — ships compiled TypeScript directly

## Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm test` | Run all tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | Type-check without emitting |

## Project Structure

```
src/
  index.ts                 # Public exports
  version.ts               # Version constant (must match package.json)
  types.ts                 # All exported type definitions
  lib/
    contract.ts            # CONTRACT class (~1600 lines) — core of the library
    contract.test.ts       # CONTRACT tests
    composer.ts            # AtomicComposer — multi-contract group builder
    composer.test.ts       # Composer tests
  utils/
    account.ts             # oneAddress, zeroAddress, getAccountInfo
    account.test.ts        # Account utility tests
    string.ts              # prepareString (strip trailing nulls from ABI strings)
    string.test.ts         # String utility tests
docs/
  contract.md              # CONTRACT class deep dive
  composer.md              # AtomicComposer guide
  types.md                 # Type reference
  examples.md              # Practical usage recipes
  SKILL.md                 # This file
dist/                      # Build output (gitignored)
```

## Core Abstractions

### CONTRACT (src/lib/contract.ts)

The primary class. Given a JSON ABI spec, it dynamically attaches
callable methods and event query functions at construction time.

**Constructor**: `new CONTRACT(contractId, algod, indexer, spec, acc?, simulate?, waitForConfirmation?, objectOnly?)`

**Four operating modes** (determined by constructor flags and spec):

| Mode | Flags | Behavior |
|------|-------|----------|
| Readonly | `spec.methods[].readonly: true` | Simulate → decode return value |
| Simulate | `simulate: true` (default) | Simulate → build unsigned txns |
| ObjectOnly | `objectOnly: true` | Return raw txn object (`.obj`) without simulation |
| Send | `simulate: false`, `sk` provided | Sign + submit to network |

**Method call pipeline** (non-readonly, simulate mode):

```
ci.someMethod(arg1, arg2)
  → createAppCallTxnObject()    # ABI-encode args, build txn object
  → createAndSimulateTxn()      # Simulate to validate + get return value
  → createUtxns()               # Re-simulate to discover resources
    → simulateTxn()             # Build temp group, call algod simulate
    → read unnamedResourcesAccessed
    → build real group with resource refs injected
    → assignGroupID()
  → return { success, returnValue, txns }
```

**The `custom()` method**: Reserved method name. When a spec has
`{ name: "custom" }`, no primary app call is generated — the group is
assembled entirely from `extraTxns`, `transfers`, and `optIns`. This is
the mechanism AtomicComposer exploits internally.

**Key configuration setters** (all have corresponding getters):

| Setter | Purpose |
|--------|---------|
| `setExtraTxns(txns)` | Additional app calls in the group |
| `setTransfers([[amount, addr]])` | ALGO payments prepended to group |
| `setAssetTransfers([[amount, assetId]])` | ASA transfers to app addr |
| `setOptins([assetId])` | ASA opt-ins appended to group |
| `setEnableGroupResourceSharing(bool)` | Enable beacon txns for resource overflow |
| `setGroupResourceSharingStrategy("default" | "merge")` | How beacon txns are distributed |
| `setPaymentAmount(n)` | ALGO payment to app address |
| `setAccounts([addr])` | Extra account refs |
| `setFee(n)` | Fee override |
| `setOnComplete(0 | 5)` | NoOp or DeleteApplication |
| `setAgentName(name)` | ARC-2 note prefix |
| `setBeaconId(appId)` | Override beacon app (default: 376092) |
| `setSimulationResultHandler(fn)` | Custom decode for simulation results |

**Group resource sharing (GRS)**: Algorand limits per-txn resource refs
(4 accounts, 8 apps, 8 assets, 8 boxes). When exceeded, CONTRACT creates
beacon transactions — no-op calls to app 376092 (`nop()void`) whose only
purpose is carrying extra resource references. The AVM runtime shares
resources across all txns in a group.

- `"default"` strategy: separate beacon per resource type
- `"merge"` strategy: fold refs into existing extra txns

**Transaction group ordering**:
```
[ GRS beacons ] → [ asset transfers ] → [ ALGO transfers ] → [ payment ] → [ app calls / extra txns ] → [ opt-ins ]
```

**Event querying**: Events in the spec also get dynamic methods. Calling
`ci.arc200_Transfer({ minRound })` computes the event selector
(SHA-512/256 of signature, first 4 bytes), queries the indexer for
matching logs, decodes args, and returns `[txId, round, timestamp, ...decodedArgs][]`.

**ARC-2 notes**: Every transaction gets a note prefixed with
`{agentName}:u {method description}`. The `u` flag means unstructured
text per the ARC-2 spec.

### AtomicComposer (src/lib/composer.ts)

A chainable DX layer over CONTRACT for multi-contract atomic groups.
Does not reimplement transaction logic — translates steps into the data
structures CONTRACT already processes.

**How it works internally**:

1. Collects steps via chainable builders
2. On `build()` / `simulate()` / `execute()`:
   - Compiles `MethodCallStep` → `ExtraTxn[]` (ABI-encodes args, maps options)
   - Compiles `PaymentStep` → `transfers` tuples
   - Compiles `AssetOptInStep` → `optIns` array
   - Compiles `AssetTransferStep` → `ExtraTxn[]` with `ignore: true`
3. Creates an internal driver CONTRACT with spec `{ methods: [{ name: "custom" }] }`
4. Wires compiled data into driver via `setExtraTxns()`, `setTransfers()`, `setOptins()`
5. Calls `driver.createUtxns(customMethod, [])` which triggers CONTRACT's existing
   simulate → resolve resources → build group pipeline

**Step builders** (all return `this`):

| Method | Maps to |
|--------|---------|
| `addMethodCall(contract, method, args, options?)` | `ExtraTxn` with ABI-encoded args |
| `addPayment(receiver, amount, note?)` | `transfers` tuple |
| `addAssetOptIn(assetId)` | `optIns` entry |
| `addAssetTransfer(assetId, sender, receiver, amount, note?)` | `ExtraTxn` with `ignore: true` |
| `withResourceSharing(strategy?)` | Enables GRS on the driver |

**StepOptions** (on `addMethodCall`):

| Field | Maps to on ExtraTxn |
|-------|---------------------|
| `payment` | `.payment` — ALGO to app address |
| `fee` | `.fee` — fee override |
| `note` | `.note` — encoded as Uint8Array |
| `assetTransfer: { assetId, amount }` | `.xaid` + `.aamt` — ASA to app address |
| `innerTransfer: { assetId, sender, receiver, amount?, note? }` | `.xaid/.snd/.arcv/.xamt/.xano` — paired transfer or opt-in |
| `onComplete` | `.onComplete` |
| `accounts` | `.accounts` — extra account refs |
| `foreignApps` | `.foreignApps` — extra app refs |
| `foreignAssets` | `.foreignAssets` — extra asset refs |
| `boxes` | `.boxes` — box refs |

**Terminal operations**:

| Method | Returns | Description |
|--------|---------|-------------|
| `build()` | `BuildResult` | Simulate + build unsigned txn group (for wallets) |
| `simulate()` | `ComposerSimulateResult` | Simulate only (validation/fee check) |
| `execute(sk)` | `ExecuteResult` | Build + sign + send (server-side/testing) |

### ExtraTxn (src/types.ts)

The interchange format between all composition mechanisms. An `ExtraTxn`
is a plain object describing an app call plus optional side-effect
transactions (payment, asset transfer, opt-in).

Key fields and their effects in CONTRACT's transaction builder:

| Field | Effect |
|-------|--------|
| `appIndex` + `appArgs` | Generates an app call transaction |
| `payment` | Prepends an ALGO payment to the app's address |
| `xaid` + `aamt` | Prepends an ASA transfer to the app's address |
| `xaid` + `snd` + `arcv` (snd === arcv) | Prepends an ASA opt-in (zero-amount self-transfer) |
| `xaid` + `snd` + `arcv` + `xamt` | Prepends an ASA transfer between arbitrary addresses |
| `ignore: true` | Suppresses the app call, only side-effect txns are emitted |
| `accounts`, `foreignApps`, `foreignAssets`, `boxes` | Manual resource references |

## Exported API Surface

```typescript
// Classes
export { CONTRACT, AtomicComposer }

// Utilities
export { oneAddress, zeroAddress, getAccountInfo }
export { prepareString }
export { genericHash, getEventSignature, getEventSelector }
export { version }

// Types (re-exported from types.ts)
export type {
  ABIContractSpec, ABIMethodSpec, ABIEventSpec, ABIMethodArgSpec,
  ABIMethodReturnSpec, ABIEventArgSpec, AccountWithSk, AlgodClient,
  IndexerClient, EventQuery, EventResult, ExtraTxn,
  GroupResourceSharingStrategy, OnComplete, MethodCallResult,
  SendResult, SimulationResult, SimulateResponse, ComposerOptions,
  StepOptions, StepSummary, BuildResult, ComposerSimulateResult,
  ExecuteResult,
}
```

## Conventions

### Do

- Preserve the existing external API — CONTRACT's constructor signature,
  dynamic method binding, getter/setter pattern, and return shapes are
  the public contract.
- Keep types in `src/types.ts` — all exported interfaces live there.
- Use `js-sha512` for hashing (not `sha512` — that was a past bug).
- Test with Vitest. Mock `algodClient` and `indexerClient` — the test
  files have established mock patterns to follow.
- Use `Buffer` from the `buffer` package (not Node built-in) for
  base64/hex encoding.
- Keep ESM — the project uses `"type": "module"` and `.js` extensions
  in import paths (required for Node ESM + TypeScript).
- Run `npm run build` after changes to verify clean compilation.
- Keep `version.ts` in sync with `package.json` version.

### Don't

- Don't rewrite CONTRACT internals just to make them "cleaner" — the
  dynamic method binding, simulation-first pipeline, and `custom()`
  mechanism are the core design and are intentional.
- Don't add `@algorandfoundation/algokit-utils` — it was removed as an
  unused dependency.
- Don't use Jest — the project uses Vitest for ESM compatibility.
- Don't import from `sha512` — always use `js-sha512`.
- Don't remove the `[key: string]: unknown` index signature from
  CONTRACT — it enables dynamic ABI method attachment.
- Don't change import extensions from `.js` — they are required for
  Node ESM resolution with TypeScript's `Node16` module mode.
- Don't add `console.log` or `console.error` in library code — this
  is a published package.

## Testing Patterns

Tests mock the Algorand clients structurally. The existing test files
contain reusable mock factories:

- **Mock algodClient**: Returns canned `getTransactionParams`,
  `accountInformation`, and `simulateTransactions` responses
- **Mock indexerClient**: Returns canned `lookupApplicationLogs` with
  chainable query builder
- **Mock specs**: Minimal ABI specs with known method/event signatures

Test categories:
- **Utility tests** (`account.test.ts`, `string.test.ts`): Pure function
  tests, no mocks needed
- **Contract tests** (`contract.test.ts`): Construction, configuration
  round-trips, hashing, event selectors, simulation decoding, objectOnly
  mode
- **Composer tests** (`composer.test.ts`): Step building, driver
  configuration verification, build/simulate/execute flows, inner
  transfers, resource references

When adding tests, prefer testing the library's DX contract (what a
consumer sees) over internal implementation details.

## Common Tasks

### Adding a new setter/getter to CONTRACT

1. Add the property to the class declaration
2. Initialize in constructor
3. Add getter and setter methods
4. Add round-trip test in `contract.test.ts`
5. Document in `docs/contract.md`

### Adding a new StepOption to AtomicComposer

1. Add the field to `StepOptions` in `src/types.ts` with JSDoc
2. Handle it in `methodCallToExtraTxn()` in `composer.ts`
3. Add test in `composer.test.ts`
4. Update `docs/composer.md` StepOptions table
5. Update README StepOptions table

### Adding a new step builder to AtomicComposer

1. Define the internal step interface in `composer.ts`
2. Add to the `InternalStep` union type
3. Add the chainable builder method
4. Handle in `compileSteps()` and `getSteps()`
5. Update `StepSummary.kind` union in `src/types.ts`
6. Add tests and update docs

### Supporting a new ABI event type in decoding

The `decodeEventArgs` function in `contract.ts` uses a switch on ABI
type strings. To support a new type:

1. Add a `case` branch in `decodeEventArgs`
2. Parse the correct number of bytes from the buffer
3. Advance the `index` by the byte width
4. Add a test verifying round-trip encoding/decoding

## Known Design Decisions

- **Simulation-first**: Every transaction is simulated before building.
  This is required because Algorand needs resource declarations
  (accounts, apps, assets, boxes) upfront, and simulation reveals what
  was accessed via `unnamedResourcesAccessed`.

- **Dynamic method binding**: ABI methods become real callable functions
  on the CONTRACT instance at construction time. This is the core DX
  feature — `ci.arc200_transfer(to, amount)` instead of
  `ci.call("arc200_transfer", [to, amount])`.

- **`custom()` as group assembler**: The reserved method name `custom`
  skips generating a primary app call and assembles the group purely
  from side data (extraTxns, transfers, optIns). AtomicComposer depends
  on this mechanism.

- **Beacon app 376092**: A deployed `nop()void` contract on Voimain used
  solely for carrying resource references in group resource sharing.
  Configurable via `setBeaconId()`.

- **`objectOnly` mode**: Returns raw transaction objects without
  simulation. Used when building multi-contract groups manually — you
  extract `.obj` from each call and pass them as `ExtraTxn[]`. The
  AtomicComposer eliminates the need for this pattern.
