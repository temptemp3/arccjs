# CLAUDE.md — Project Context for Claude Code

This file provides context for Claude Code and Claude-based agents
working in the arccjs repository.

The full agent reference lives at [docs/SKILL.md](docs/SKILL.md).
Read that file for complete architecture, conventions, and patterns.

## Quick Context

arccjs is an ABI-centric Atomic Transaction Composer for Algorand AVM.
It takes a JSON ABI spec and produces a callable object that handles
ABI encoding, simulation, resource resolution, signing, and submission.

TypeScript, ESM-only, Node >= 20.9. Dependencies: `algosdk` v3,
`js-sha512`, `buffer`.

## Commands

```bash
npm run build       # Compile TypeScript to dist/
npm test            # Run all tests (Vitest)
npm run typecheck   # Type-check without emitting
```

## Structure

```
src/
  index.ts              # Public exports
  types.ts              # All exported type definitions
  version.ts            # Version constant (sync with package.json)
  lib/
    contract.ts         # CONTRACT class — core transaction builder
    composer.ts         # AtomicComposer — multi-contract group builder
  utils/
    account.ts          # oneAddress, zeroAddress, getAccountInfo
    string.ts           # prepareString
```

## Key Rules

- **Preserve the external API** — CONTRACT's constructor, dynamic method
  binding, getter/setter pattern, and return shapes are the public contract.
- **All exported types go in `src/types.ts`** with JSDoc.
- **Use `js-sha512`** — never `sha512` (that was a past bug).
- **Keep `.js` extensions in imports** — required for Node ESM + TypeScript
  `Node16` module resolution.
- **No `console.log`/`console.error`** in library code.
- **Don't remove the `[key: string]: unknown` index signature** from
  CONTRACT — it enables dynamic ABI method attachment.
- **Don't add `@algorandfoundation/algokit-utils`** — it was removed as
  unused.
- **Test with Vitest**, not Jest. Mock algod/indexer clients structurally.
- **Keep `version.ts` in sync** with `package.json`.
- **Run `npm run build` after changes** to verify clean compilation.

## Architecture in Brief

**CONTRACT** dynamically creates callable methods from an ABI spec. Every
non-readonly call follows: encode → simulate → resolve resources →
build unsigned txns. The `custom()` method is reserved — it skips the
primary app call and assembles the group from `extraTxns`, `transfers`,
and `optIns` only.

**AtomicComposer** is a chainable builder that compiles steps into
`ExtraTxn[]` / transfers / optIns, creates an internal driver CONTRACT
with a `custom` spec, and delegates to CONTRACT's existing pipeline.
It never reimplements transaction logic.

**ExtraTxn** is the interchange format. Fields like `payment`, `xaid`,
`snd`, `arcv`, `xamt`, `aamt`, `ignore` control what side-effect
transactions are generated alongside the app call.

For detailed architecture, testing patterns, and step-by-step guides
for common tasks, see [docs/SKILL.md](docs/SKILL.md).
