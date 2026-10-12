# Quickstart: Validate Lira Walks With You

This guide shows you how to validate the Lens, from vector generation through a 15-minute outdoor walk.

## Before you begin

Make sure you have the following:

- macOS with the repository toolchain (`make build` passes).
- Node LTS [NEEDS CLARIFICATION: pin the version].
- Lens Studio [NEEDS CLARIFICATION: pin the version].
- A Spectacles device paired with a Snapchat account, with RawLocation permission granted.

## Step 1: Generate the Swift vectors

```bash
make vectors            # swift run waykin-vectors --out Tests/Vectors
git diff --exit-code Tests/Vectors
```

A non-empty diff means the vectors changed. Commit the changes with the Swift change that caused them.

## Step 2: Run the TypeScript parity tests

```bash
cd packages/waykin-core-ts
npm ci
npx tsc --noEmit
node scripts/check-isolation.mjs
node --test
```

All vectors must pass, which is success criterion SC-001.

## Step 3: Sync the core and open the Lens

```bash
scripts/sync_core_ts.sh
```

1. Open `spectacles/WaykinLens/` in Lens Studio.
2. In **Preview**, start **Demo Walk**.
3. Confirm the following:
   - Lira appears at the D-202/D-203 band distance (1.3/1.6/2.0/3.0 m) with +0.6 m lateral offset on her current side (default right).
   - The events match the order in the `demo/*.json` vector.
   - Each event plays its audio cue.
   - **Stop** opens the summary.
   - The in-Lens RNG self-test log matches `rngStream` for the reference seed.

## Step 4: Push the Lens to Spectacles

Use Lens Studio's device push. Then run Demo Walk indoors and enable the Performance Overlay.

## Step 5: Run the 15-minute outdoor walk protocol

1. Charge the device fully. Record the ambient conditions: sun or shade, and the approximate temperature.
2. Enable the Performance Overlay. Choose **Begin Walk**.
3. Walk for 15 minutes on a safe, low-traffic path. At least once, pause, resume, and use Stop near the end.
4. Record FPS, CPU/GPU power percentage, and any throttle or thermal warnings at 0, 5, 10, and 15 minutes.
5. Close and reopen the Lens. Confirm that Bond and memories persist.

## Receipt template

Each value is `NOT_COMPUTABLE` until you record it from a device. Change a label to `OBSERVED` only for values that you saw directly. Don't record coordinates or routes.

```text
Device: <dev Spectacles 2024 | consumer Specs>  OS: <ver>  Lens commit: <sha>
Conditions: <sun/shade>, <temp>
| Claim                                   | Value | Label           |
|-----------------------------------------|-------|-----------------|
| Parity suite green                      |       | NOT_COMPUTABLE  |
| Sustained 60 FPS for 15 min             |       | NOT_COMPUTABLE  |
| Power < 100% budget throughout          |       | NOT_COMPUTABLE  |
| No thermal standby/shutdown in 15 min   |       | NOT_COMPUTABLE  |
| Battery % start / end                   |       | NOT_COMPUTABLE  |
| GPS samples accepted / rejected         |       | NOT_COMPUTABLE  |
| Events fired (kinds only)               |       | NOT_COMPUTABLE  |
| Stop reachable in one interaction       |       | NOT_COMPUTABLE  |
| Bond/memories persisted after relaunch  |       | NOT_COMPUTABLE  |
| Permissions: RawLocation only           |       | NOT_COMPUTABLE  |
```

A Lens Studio Preview run doesn't count as evidence of device behavior.