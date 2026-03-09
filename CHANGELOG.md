# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **TypeScript migration**: entire codebase converted from JavaScript to TypeScript
- **Dependency fix**: replaced incorrect `sha512` package with `js-sha512` (matches actual import)
- **Removed unused dependency**: `@algorandfoundation/algokit-utils` was listed but never imported
- **Build pipeline**: added TypeScript compilation with declaration files and source maps
- **Test framework**: replaced Jest with Vitest for better ESM support; 56 real tests replace placeholder
- **Package metadata**: added description, author, keywords, exports field, files field
- **Version sync**: `version.ts` now matches `package.json` version
- **Simulation request**: `fixSigs` corrected to `fixSigners` per algosdk v3 API

### Added

- **`AtomicComposer`**: high-level multi-contract atomic group builder that eliminates
  manual `.obj` extraction, manual transaction arrays, and manual `setExtraTxns()` wiring.
  Supports `addMethodCall()`, `addPayment()`, `addAssetOptIn()`, `withResourceSharing()`,
  and terminal operations `build()`, `simulate()`, `execute(sk)`.
- Exported composer types: `ComposerOptions`, `StepOptions`, `StepSummary`,
  `BuildResult`, `ComposerSimulateResult`, `ExecuteResult`
- Full type definitions for all public APIs (`types.ts`)
- Exported types: `ABIContractSpec`, `ABIMethodSpec`, `ABIEventSpec`, `AlgodClient`,
  `IndexerClient`, `EventQuery`, `EventResult`, `ExtraTxn`, `MethodCallResult`, etc.
- `getAccountInfo`, `genericHash`, `getEventSignature`, `getEventSelector`, and `version`
  re-exported from package entry point
- Comprehensive README with usage examples, API reference, and migration notes
- `tsconfig.json` with strict settings
- `vitest.config.ts`
- Unit tests for utilities (string, account)
- Behavior tests for CONTRACT construction, configuration, event selectors, simulation decoding
- Composer tests: 32 tests covering step building, driver configuration, build/simulate/execute,
  edge cases, and before/after DorkFi-style pattern comparison

### Fixed

- Duplicate `accounts` key in unnamed resources object (line 1224-1228 of original contract.js)
- Unused variable `arg0` in `decodeEventArgs`
- Repository URL changed from SSH to HTTPS in package.json

## [2.10.6] - 2024-07-31

### Added

- Transaction fee override for extra transactions
