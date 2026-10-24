# Contract: Swift ↔ TypeScript core parity

## Authority

- Swift `WaykinCore` is the source of truth. Only `Sources/WaykinVectorExport` writes files in `Tests/Vectors/**`.
- `packages/waykin-core-ts` reads vectors read-only. If a vector fails, fix the TypeScript code. Never edit the vector.
- To change behavior, change Swift, regenerate the vectors, and update TypeScript in the same PR or a linked PR.

## Generating vectors (Swift)

- `Sources/WaykinVectorExport` is a Swift executable that depends only on `WaykinCore`. It builds the scenarios in code and writes JSON. Each vector family has its own schema: `seed-event-vectors.schema.json` covers only `Tests/Vectors/seed-event/**`, and every other family needs a `contracts/<family>-vectors.schema.json` (see `tasks.md` T007–T010).
- Run it with `swift run waykin-vectors --out Tests/Vectors`, wrapped by `make vectors`. The exact target wiring depends on the existing package and XcodeGen layout (INFERRED).
- Output must be deterministic:
  - Sort keys.
  - Use no timestamps. Don't record the containing commit SHA: committing the vectors changes HEAD, so a regenerated `swiftCommit` could never match and `git diff --exit-code Tests/Vectors` would always fail. Instead, record `source.swiftTree` = `git rev-parse HEAD:Sources/WaykinCore`. This is the git tree hash of the Swift core's contents; it changes only when the Swift sources change, not when vectors are committed. The freshness check regenerates the vectors and requires `git diff --exit-code Tests/Vectors` to be clean.
  - Encode each `UInt64` as a decimal string.
  - Encode each double with Swift's shortest round-trip form.
  - Encode non-finite inputs as `"NaN"`, `"Infinity"`, or `"-Infinity"`.
- The exporter records each rule's post-clamp values.

## Consuming vectors (TypeScript)

- `test/parity.test.ts` reads the seed-event family. Separate read-only
  `companionParity`, `movementParity`, `experienceParity` and `demoParity`
  tests validate and replay their family schemas. `vectorInventory.test.ts`
  requires all six families; missing fixtures fail rather than skip.
- For each seed-event file, the test does the following:
  1. Constructs the configuration and generator from `seed`.
  2. Checks `rngStream` against a fresh RNG.
  3. Replays `steps` in order and asserts `expected` exactly.

Other families replay companion commands/presentations, sequential movement
integrity inputs, walk updates, finish/identity cases and demo control frames.
The demo projection excludes generated IDs and event wall-clock fields;
gameplay measurements and state decisions remain compared. Authored exporters
and replay readers alone do not establish parity: actual Swift generation,
freshness and successful replay are required. As of the live 2026-10-13
validation, all six families are generated deterministically, but movement
derived-speed parity fails. See `CORE_PORT_20261013_LIVE_PARITY.md`.

## Parity rules

1. **UInt64**: Arithmetic is bit-exact. Code that ships in the Lens MUST use the 2×uint32 implementation, because Lens TS targets es2019 and has no `BigInt` (NC-04). Node-side tests MAY use `BigInt` with `BigInt.asUintN(64, x)` as a reference. Shifts are logical. Never pass a UInt64 value through `Number`.
2. **Seed 0**: It maps to `0x9E3779B97F4A7C15`. Parse seeds from decimal strings and reject values above 2^64 − 1.
3. **Elapsed**: `elapsed = max(0, finiteOrZero(stepElapsed ?? state.activeTime))`.
4. **Tick spacing**: Take `lastGenerated` as the maximum of the internal and external values that are present. If `elapsed − lastGenerated < minimumTickSpacing`, return null. The RNG doesn't advance.
5. **Eligibility**: Filter rules in configuration order and preserve that order. Honor `allowedKinds` when it is set. Take each rule's last fire time as the maximum of the internal and external values. The cooldown comparison is strict (`<`). Movement state must be `moving` or `paused`.
6. **No eligible rules**: Return null. The RNG doesn't advance.
7. **Total weight**: Sum the weights as uint64. Swift traps on overflow. TypeScript throws, and vectors never overflow.
8. **Pick**: `pick = rng.next() % totalWeight` as unsigned 64-bit modulo. Draw exactly one value for each emitted event.
9. **Selection and tie-breaking**: Accumulate `cursor += weight` in configuration order. The first rule where `pick < cursor` wins, so a value on a boundary belongs to the next rule. Fall back to `eligible[0]`. The fallback is unreachable but must be mirrored.
10. **State update**: Update state only on emit: `lastGeneratedAtElapsed = elapsed` and `lastFiredAtElapsedByKind[kind] = elapsed`.
11. **Event**: `intensity = max(state.energy, state.pressure)` compares exactly as doubles. `debugLabel = kind`.
12. **Clamp**: `clamped01` maps non-finite values to 0 and then applies `min(1, max(0, x))`.
13. **Floating point**: Comparisons use IEEE 754 doubles in both languages. Don't apply epsilon or rounding, except the explicitly approved D-100 distance bound (±0.05 m). Derived speed and state decisions currently remain exact. The observed spherical/CoreLocation mismatch requires a decision; propagation of distance tolerance into speed has been recommended but not approved.

## Isolation

`scripts/check-isolation.mjs` fails if any file in `packages/waykin-core-ts/src` imports Lens Studio modules or `require`s assets. It also fails if any file references a global matching `global.`/`script.`/`*Module`.

## CI (`.github/workflows/ci.yml`, new `ts-core-parity` job)

1. Regenerate the vectors with Swift and run `git diff --exit-code Tests/Vectors`, so stale vectors fail the job. This step requires a macOS runner (INFERRED).
2. Run `npm ci` (with no runtime dependencies), then `tsc --noEmit`, `node scripts/check-isolation.mjs`, and `node --test`.
3. Check that the synced Lens copy matches the package: run `scripts/sync_core_ts.sh --check`.
