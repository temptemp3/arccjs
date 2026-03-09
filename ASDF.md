---
asdf_version: 1
project: arccjs
languages: [typescript]
runtime: node
module_system: esm
skills:
  - asdf://arccjs/contract/call
  - asdf://arccjs/contract/simulate
  - asdf://arccjs/contract/events
  - asdf://arccjs/composer/build
  - asdf://arccjs/composer/simulate
  - asdf://arccjs/composer/execute
capabilities:
  - network
  - broadcast
---

# ASDF.md — arccjs Agent Discovery

This file follows the [Agent Skill Discovery Format (ASDF)](https://github.com/MaidToShelly/asdf)
specification (ASDF-0001).

The full agent reference lives at [docs/SKILL.md](docs/SKILL.md).

## Project

arccjs is an ABI-centric Atomic Transaction Composer for Algorand AVM
workflows. It takes a JSON ABI spec describing a smart contract's methods
and events, and produces callable objects that handle ABI encoding,
simulation, resource resolution, signing, and submission.

## Commands

```bash
npm run build       # Compile TypeScript to dist/
npm test            # Run all tests (Vitest)
npm run typecheck   # Type-check without emitting
```

## Skills

### `asdf://arccjs/contract/call`

Build and submit a single ABI method call to an Algorand smart contract.

```
inputs:
  contractId: number
  method: string
  args: unknown[]
  spec: ABIContractSpec
outputs:
  txId: string
capabilities:
  - network
  - broadcast
```

### `asdf://arccjs/contract/simulate`

Simulate a single ABI method call without submitting. Returns decoded
return value and unsigned transactions.

```
inputs:
  contractId: number
  method: string
  args: unknown[]
  spec: ABIContractSpec
outputs:
  returnValue: unknown
  txns: string[]
capabilities:
  - network
```

### `asdf://arccjs/contract/events`

Query on-chain events emitted by a smart contract via the indexer.

```
inputs:
  contractId: number
  eventName: string
  query: { minRound?, maxRound?, sender?, limit? }
  spec: ABIContractSpec
outputs:
  events: [txId, round, timestamp, ...decodedArgs][]
capabilities:
  - network
```

### `asdf://arccjs/composer/build`

Compose a multi-contract atomic transaction group and return unsigned
transactions ready for wallet signing.

```
inputs:
  steps: Array<{ contract, method, args, options? }>
  payments?: Array<{ receiver, amount }>
  optIns?: number[]
  resourceSharing?: boolean
outputs:
  txns: string[]
  groupSize: number
capabilities:
  - network
```

### `asdf://arccjs/composer/simulate`

Simulate a composed multi-contract atomic group without building final
transactions. Used for validation and fee estimation.

```
inputs:
  steps: Array<{ contract, method, args, options? }>
  resourceSharing?: boolean
outputs:
  success: boolean
  failureMessage?: string
  response: SimulateResponse
capabilities:
  - network
```

### `asdf://arccjs/composer/execute`

Build, sign, and submit a composed multi-contract atomic group.
For server-side and testing workflows.

```
inputs:
  steps: Array<{ contract, method, args, options? }>
  sk: Uint8Array
  resourceSharing?: boolean
outputs:
  txId: string
capabilities:
  - network
  - broadcast
  - wallet
```

## Key Rules

- Preserve the external API — CONTRACT's constructor, dynamic method
  binding, and return shapes are the public contract.
- All exported types go in `src/types.ts` with JSDoc.
- Use `js-sha512` for hashing — never `sha512`.
- Keep `.js` extensions in imports (Node ESM requirement).
- No `console.log`/`console.error` in library code.
- Test with Vitest. Mock algod/indexer clients.
- Run `npm run build` after changes.

## Do Not

- Store secrets in skill definitions or test fixtures
- Remove the `[key: string]: unknown` index signature from CONTRACT
- Add `@algorandfoundation/algokit-utils` (removed as unused)
- Use Jest (project uses Vitest)
- Remove `.js` import extensions

## Discovery Files

Agents should search for context in this order per ASDF-0001:

| Priority | File | Status |
|----------|------|--------|
| 1 | `ASDF.md` | This file |
| 2 | `AGENTS.md` | Present |
| 3 | `CLAUDE.md` | Present |
| 4 | `.cursorrules` | Present |
| 5 | `CONTRIBUTING.md` | Present |

All files reference [docs/SKILL.md](docs/SKILL.md) as the canonical
detailed reference.
