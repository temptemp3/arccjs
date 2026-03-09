# Contributing to arccjs

## Quick Start

```bash
git clone https://github.com/temptemp3/arccjs.git
cd arccjs
npm install
npm run build
npm test
```

## Development

| Command | Purpose |
|---------|---------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm test` | Run all tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | Type-check without emitting |

## Project Structure

```
src/
  index.ts              # Public exports
  types.ts              # All exported type definitions
  version.ts            # Version constant (sync with package.json)
  lib/
    contract.ts         # CONTRACT class — core transaction builder
    contract.test.ts    # CONTRACT tests
    composer.ts         # AtomicComposer — multi-contract group builder
    composer.test.ts    # Composer tests
  utils/
    account.ts          # Address constants and account helpers
    account.test.ts     # Account utility tests
    string.ts           # ABI string utilities
    string.test.ts      # String utility tests
docs/
  SKILL.md              # Agent-friendly architecture reference
  contract.md           # CONTRACT deep dive
  composer.md           # AtomicComposer guide
  types.md              # Type reference
  examples.md           # Usage recipes
```

## Guidelines

### Code Style

- TypeScript with strict settings
- ESM-only (`"type": "module"`)
- Use `.js` extensions in import paths (required for Node ESM + TS)
- All exported types belong in `src/types.ts` with JSDoc comments
- No `console.log` or `console.error` in library source

### Architecture

The library has two main abstractions:

- **CONTRACT** — Takes a JSON ABI spec, dynamically creates callable
  methods that handle ABI encoding, simulation, resource resolution,
  and submission. This is the core of the library and its external API
  should be preserved.

- **AtomicComposer** — Chainable builder for multi-contract atomic
  groups. Delegates to CONTRACT internally via the `custom()` mechanism.

For detailed architecture documentation, see [docs/SKILL.md](docs/SKILL.md).

### Testing

- Use Vitest (not Jest)
- Mock `algodClient` and `indexerClient` — follow existing mock
  patterns in test files
- Test the library's DX contract (what consumers see), not internal
  implementation details
- Run `npm test` before submitting changes

### Adding Features

**New StepOption on AtomicComposer:**
1. Add field to `StepOptions` in `src/types.ts`
2. Handle in `methodCallToExtraTxn()` in `composer.ts`
3. Add test in `composer.test.ts`
4. Update `docs/composer.md` and `README.md`

**New setter/getter on CONTRACT:**
1. Add property to class, initialize in constructor
2. Add getter and setter methods
3. Add round-trip test in `contract.test.ts`
4. Document in `docs/contract.md`

**New ABI event type:**
1. Add `case` branch in `decodeEventArgs` in `contract.ts`
2. Parse correct byte width, advance index
3. Add test verifying decoding

### Dependencies

- Use `js-sha512` for hashing (not `sha512`)
- Use `buffer` package (not Node built-in)
- `algosdk` v3 is the Algorand SDK
- Don't add `@algorandfoundation/algokit-utils` (removed as unused)

### Versioning

Keep `src/version.ts` in sync with `package.json` version.

## Documentation

- [CONTRACT Deep Dive](docs/contract.md)
- [AtomicComposer Guide](docs/composer.md)
- [Type Reference](docs/types.md)
- [Examples & Recipes](docs/examples.md)
- [Agent Reference](docs/SKILL.md)
