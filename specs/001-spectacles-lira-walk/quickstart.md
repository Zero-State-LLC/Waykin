# Quickstart: Validate Lira Walks With You

This guide separates what the current checkout can validate (seed-event Swift/Node parity and sync), what still requires an openable Lens Studio project, and what requires physical Spectacles. Do not mark Preview or device steps PASS from Node output.

## Before you begin

Make sure you have the following:

- macOS with Swift 6 and the repository toolchain for `make vectors`; CI uses `macos-26` for Swift vector generation.
- Node **22** (the `.github/workflows/ci.yml` `ts-core-parity` pin), npm, and a network connection for `npm ci`.
- For later editor work, Lens Studio **5.15.4** (Spectacles 2024), SIK **0.17.2**, and Spectacles UI Kit **0.1.4** (NC-05); record installed versions in the build receipt. These pins are not evidence that the editor was run.
- For physical validation only, a paired Spectacles device and Snapchat account with location available. The project declares **RawLocation only** under D-301/CF-29, not an Internet permission descriptor. If location fails, investigate and amend the decision before changing permissions.

## Step 1: Generate the Swift vectors

```bash
make vectors
git diff --exit-code -- Tests/Vectors
```

A non-empty diff means the vectors changed; investigate before committing with the corresponding Swift change. At the present baseline `Tests/Vectors/seed-event/` exists; movement, companion, bond-memory, and demo families are **not yet implemented**. `make vectors` does not prove their parity.

## Step 2: Run the TypeScript parity tests

```bash
cd packages/waykin-core-ts
npm ci
npm run typecheck
npm run isolation
WAYKIN_REQUIRE_VECTORS=1 npm test
cd ../..
bash scripts/sync_core_ts.sh --check
```

Expect exit 0 for the current seed-event test set and zero sync drift. `npm test` builds first; bare `node --test` does not compile TypeScript tests. The environment flag forbids silently skipping missing seed-event vectors. This is **only seed-event parity**, not SC-001 across all planned families; Lens runtime ES2019 safety requires the open 2×uint32 port (NC-04).

## Step 3: Sync the core and open the Lens

```bash
bash scripts/sync_core_ts.sh --check  # read-only drift check
```

**STOP: the current `spectacles/WaykinLens/` is a text-only skeleton without `WaykinLens.esproj`. It cannot be opened or run in Lens Studio Preview yet.** After T003 creates the editor project and T011/NC-04 makes the synced core ES2019-safe, use `bash scripts/sync_core_ts.sh` to refresh the generated copy, and re-run `--check` before the following manual Preview checks:

1. Open `spectacles/WaykinLens/WaykinLens.esproj` in Lens Studio 5.15.4.
2. In **Preview**, start **Demo Walk**.
3. Confirm the following:
   - Lira appears at the D-202/D-203 band distance (1.3/1.6/2.0/3.0 m) with +0.6 m lateral offset on her current side (default right).
   - The events match the order in the Swift-exported `Tests/Vectors/demo/*.json` vector **after that family exists**.
   - Each event plays its audio cue.
   - **Stop** opens the summary.
   - The in-Lens RNG self-test log matches `rngStream` for the reference seed. Save a Preview receipt; do not infer this from the Node run.

## Step 4: Push the Lens to Spectacles

After the editor project and Preview gate exist, use Lens Studio's device push. Run Demo Walk indoors and enable the Performance Overlay. Record device/OS, build SHA and Lens Studio/SIK/UI Kit versions. None of this is yet verified at the seed-event-only baseline.

## Step 5: Run the 15-minute outdoor walk protocol

1. Charge the device fully. Record the ambient conditions: sun or shade, and the approximate temperature.
2. Enable the Performance Overlay. Choose **Begin Walk**.
3. Walk for 15 minutes on a safe, low-traffic path. At least once, pause, resume, and use Stop near the end.
4. Record FPS, CPU/GPU power percentage, battery percentage via `getBatteryState()`, and any throttle or thermal warnings at 0, 5, 10, and 15 minutes. T206 must implement the D-061 guard before T202 measures drain; log start/end battery, charging state, and whether guard warnings/end occurred. TST-071 drain gate is ≤40 percentage points over 15 minutes.
5. Close and reopen the Lens. Confirm that Bond and memories persist. Attach privacy-filtered physical receipts to [`Zero-State-LLC/Waykin#13`](https://github.com/Zero-State-LLC/Waykin/issues/13), **not** the unrelated `scrimshawlife-ctrl/Waykin#41`.

## Receipt template

Each value is `NOT_COMPUTABLE` until you record it from a device. Change a label to `OBSERVED` only for values that you saw directly. Don't record coordinates or routes.

```text
Device: <dev Spectacles 2024 | consumer Specs>  OS: <ver>  Lens commit: <sha>
Lens Studio: <ver>  SIK: <ver>  UI Kit: <ver>  Evidence issue: Zero-State-LLC/Waykin#13
Conditions: <sun/shade>, <temp>
| Claim                                   | Value | Label           |
|-----------------------------------------|-------|-----------------|
| Parity suite green                      |       | NOT_COMPUTABLE  |
| Sustained 60 FPS for 15 min             |       | NOT_COMPUTABLE  |
| Power < 100% budget throughout          |       | NOT_COMPUTABLE  |
| No thermal standby/shutdown in 15 min   |       | NOT_COMPUTABLE  |
| Battery % start / end                   |       | NOT_COMPUTABLE  |
| Battery drain (percentage points)      |       | NOT_COMPUTABLE  |
| D-061 guard: warning / power end       |       | NOT_COMPUTABLE  |
| GPS samples accepted / rejected         |       | NOT_COMPUTABLE  |
| Events fired (kinds only)               |       | NOT_COMPUTABLE  |
| Stop reachable in one interaction       |       | NOT_COMPUTABLE  |
| Bond/memories persisted after relaunch  |       | NOT_COMPUTABLE  |
| Permissions: RawLocation only           |       | NOT_COMPUTABLE  |
```

A Lens Studio Preview run doesn't count as evidence of device behavior.