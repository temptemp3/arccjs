---
asdf_version: 1
project: arccjs
languages: [typescript]
---

# AGENTS.md — Agent Instructions for arccjs

This file provides instructions for AI coding agents (OpenClaw, Codex,
Devin, SWE-agent, etc.) working in the arccjs repository.

Read [ASDF.md](ASDF.md) for canonical project context.
Read [docs/SKILL.md](docs/SKILL.md) for full architecture, conventions,
and patterns.

## Overview

arccjs is an ABI-centric Atomic Transaction Composer for Algorand AVM
smart contracts. It is a TypeScript library (ESM-only, Node >= 20.9)
with two main abstractions:

1. **CONTRACT** — Takes a JSON ABI spec, dynamically creates callable
   methods that handle ABI encoding, transaction simulation, resource
   resolution, and submission.

2. **AtomicComposer** — Chainable builder for multi-contract atomic
   transaction groups. Delegates to CONTRACT internally.

## Getting Started

```bash
npm install         # Install dependencies
npm run build       # Compile TypeScript to dist/
npm test            # Run all tests (Vitest, 105 tests)
npm run typecheck   # Type-check without emitting
```

## File Map

| File | Role |
|------|------|
| `src/index.ts` | Public exports |
| `src/types.ts` | All exported type definitions (add new types here) |
| `src/version.ts` | Version constant (must match package.json) |
| `src/lib/contract.ts` | CONTRACT class — core transaction builder (~1600 lines) |
| `src/lib/composer.ts` | AtomicComposer — multi-contract group builder |
| `src/utils/account.ts` | Address constants and account helpers |
| `src/utils/string.ts` | ABI string utilities |
| `docs/SKILL.md` | Full agent reference (architecture, conventions, patterns) |
| `docs/contract.md` | CONTRACT deep dive |
| `docs/composer.md` | AtomicComposer guide |
| `docs/types.md` | Type reference |
| `docs/examples.md` | Usage recipes |

## Critical Constraints

1. **Preserve the external API** — Do not change CONTRACT's constructor
   signature, dynamic method binding, getter/setter patterns, or return
   shapes without explicit instruction.

2. **Use `js-sha512`** for hashing — the `sha512` npm package is a
   different, wrong package.

3. **Keep `.js` extensions in imports** — Required for Node ESM with
   TypeScript's `Node16` module resolution.

4. **All exported types in `src/types.ts`** — With JSDoc comments.

5. **No `console.log`/`console.error`** in library code — This is a
   published npm package.

6. **Don't remove `[key: string]: unknown`** from CONTRACT — It enables
   dynamic ABI method attachment at construction time.

7. **Test with Vitest** — Not Jest. Mock algod and indexer clients
   following existing patterns in test files.

8. **Run `npm run build` after changes** — Verify clean TypeScript
   compilation before finishing.

## Architecture Summary

**CONTRACT method call pipeline:**
```
ci.someMethod(args)
  → ABI-encode args
  → simulate transaction
  → read unnamedResourcesAccessed (discover needed resources)
  → build real transaction group with resource refs
  → assign group ID
  → return unsigned transactions
```

**`custom()` is reserved** — When a spec method is named `custom`, no
primary app call is generated. The group is assembled entirely from
`extraTxns`, `transfers`, and `optIns`. AtomicComposer exploits this.

**AtomicComposer** compiles chainable steps into `ExtraTxn[]`, creates
a driver CONTRACT with a `custom` spec, and delegates to CONTRACT's
existing pipeline. It never reimplements transaction logic.

**ExtraTxn** is the interchange format. Key fields:
- `appIndex` + `appArgs` → app call
- `payment` → ALGO payment to app address
- `xaid` + `aamt` → ASA transfer to app address
- `xaid` + `snd` + `arcv` → ASA transfer/opt-in between addresses
- `ignore: true` → suppress app call, emit only side-effect txns

## Detailed Reference

For complete architecture, testing patterns, common task checklists,
and design decision rationale, read [docs/SKILL.md](docs/SKILL.md).
