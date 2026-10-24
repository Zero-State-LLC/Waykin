# Implementation plan: Lira Walks With You (Snap Spectacles)

**Branch**: `001-spectacles-lira-walk` | **Date**: 2026-10-11 | **Spec**: `specs/001-spectacles-lira-walk/spec.md`
**Input**: The feature spec, ADR-0004, and PLAN.md research.

## Summary

You build a standalone Spectacles Lens in Lens Studio, scripted in TypeScript. The gameplay truth is a pure TypeScript port of `WaykinCore` (`packages/waykin-core-ts`). It is proven bit-exact against vectors that Swift exports. Thin Lens adapters connect location, audio, persistent storage, and Lira presentation. Demo Walk drives Preview and indoor tests.

## Technical context

- **Language and version**: TypeScript, at the version that Lens Studio bundles [NEEDS CLARIFICATION: pin the Lens Studio version]. Swift 6 for the vector exporter.
- **Primary dependencies**: Lens Studio, Spectacles Interaction Kit, and `RawLocationModule`/`LocationService`. The TypeScript core has zero runtime dependencies.
- **Storage**: Lens persistent storage, on the device only.
- **Testing**: Node `node:test` and `tsc` for the TypeScript core. Swift `make test` for the exporter. Lens Studio Preview for Demo Walk. Device receipts for outdoor behavior.
- **Target platform**: SPECS 27 (D-325, user-approved 2026-10-13). This build does not target Spectacles (2024).
- **Project type**: A Lens plus a pure-logic package alongside the existing iOS app.
- **Performance goals**: Sustained 60 FPS. Power below 100% of the CPU/GPU budget in the Performance Overlay.
- **Constraints**: GPS uses `Navigation` accuracy: up to 20 m, render-rate FUSED updates in good reception, otherwise one every 10 s (NC-01). Location requires a paired Snapchat account and an internet-connected device. Toolchain: Lens Studio 5.15.4, SIK 0.17.2, UI Kit 0.1.4 (NC-05). Developer units run about 45 minutes standalone, per Snap docs (`INFERRED`, not observed). The Lens uses no Experimental APIs.

**2026-10-13 target amendment (D-325):** The user selected SPECS 27. This supersedes the legacy toolchain pins and 2024 battery assumption in the Constraints paragraph above: pin Lens Studio **5.24.1.26100516** and the checked-in SIK/SUIK artifacts (both descriptor version **2.0.0**; SIK runtime banner **0.18.0**). SUIK's separate release identity and device OS are `NOT_COMPUTABLE`. Revalidate platform APIs and physical behavior for SPECS 27; do not infer them from 2024 documentation. T003 remains incomplete because permission wiring and device evidence are pending. See `docs/design/receipts/LENS_BUILD_20261013T064330Z_3de19ae.md`.
- **Scale and scope**: One walker, one session of up to 30 minutes, one companion.

## Constitution check

The gates check against the `WAYKIN_SPEC.md` invariants and the `SOLO_MVP_SCOPE.md` scope.

| Gate | Result | Note |
|---|---|---|
| Walking is the launch activity | PASS | Walk only. |
| Lira is the single companion; Bond is the single progression metric | PASS | One rig. Bond only. |
| Pursuit is bounded, not an enemy framework | PASS | Audio and Lira behavior only. No pursuer entity. |
| Seeded behavior is reproducible | PASS (by contract) | `contracts/core-parity.md`. CI enforces it. |
| Core isolation | PASS | The TypeScript core has no Lens imports. CI runs an import check. The Swift baseline is unchanged. |
| Adapters aren't gameplay authorities | PASS | Lens adapters map semantic state only. |
| Safe when AR or location is degraded | PASS | Demo Walk fallback. Audio-forward degrade. Stop is dominant. |
| Device behavior requires device evidence | PENDING | FPS, power, thermal, and GPS stay `NOT_COMPUTABLE` until receipts exist. |
| Exclusion: backend, accounts, cloud save | PASS | No Snap Cloud. Location uses RawLocationModule per D-301. |
| Exclusion: "Mandatory AR glasses or wearable dependency" | FAIL without ADR; PASS with ADR-0004 | Spectacles is an additional, non-mandatory target. |
| SOLO_MVP non-goals "AR glasses integration" and "Wearable integration" | FAIL without ADR; PASS with ADR-0004 | Scoped to this standalone Lens. |
| Exclusion: multiplayer, generative AI, analytics | PASS | Not used. |

**Gate result**: PASS, contingent on merging ADR-0004 and the spec amendments before any implementation PR.

## Project structure

### Documentation

```text
specs/001-spectacles-lira-walk/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── core-parity.md
│   └── seed-event-vectors.schema.json
└── tasks.md
```

### Source code

```text
Sources/WaykinCore/                    # unchanged; source of truth
Sources/WaykinVectorExport/            # new Swift executable: writes vectors
Tests/Vectors/
├── seed-event/*.json                  # generator + RNG vectors
├── movement/*.json                    # movement engine + integrity vectors
├── companion/*.json                   # Lira matrix vectors
├── bond-memory/*.json                 # Bond delta + memory rules
└── demo/*.json                        # Demo Walk arc
packages/waykin-core-ts/
├── package.json                       # no runtime deps
├── src/{uint64,rng,worldState,worldEventGenerator,movementEngine,
│        movementIntegrity,companionRuntime,pursuit,audioSemantics,
│        bond,memory,demoSession,index}.ts
├── test/parity.test.ts                # reads Tests/Vectors read-only
└── scripts/check-isolation.mjs        # rejects Lens imports
spectacles/WaykinLens/                 # Lens Studio project
├── Assets/Scripts/core/               # synced copy of waykin-core-ts (generated; do not edit)
├── Assets/Scripts/adapters/{LocationAdapter,AudioAdapter,StorageAdapter}.ts
├── Assets/Scripts/presentation/{LiraController,SummaryPanel,IntroPanel}.ts
├── Assets/Scripts/demo/DemoDriver.ts
└── Assets/{Lira,Audio}/
scripts/sync_core_ts.sh                # copies package src into Lens project
```

**Structure decision**: Keep the core in a Node-testable package and sync it into the Lens. This way, one TypeScript source serves both parity tests and the Lens.

## Complexity tracking

| Addition | Why it's needed | Simpler alternative rejected because |
|---|---|---|
| Second core (TypeScript) | Swift can't run in a Lens. | NDK (C++) still requires a rewrite and adds toolchain cost. |
| Swift vector exporter target | Swift must be the source of truth for vectors. | Hand-written fixtures drift and aren't authoritative. |
| `sync_core_ts.sh` copy step | Lens Studio needs scripts inside the project. | Symlinks are unverified in Lens Studio (INFERRED risk). |
| Custom UInt64 (2×uint32; no `BigInt` in Lens es2019, NC-04) | SplitMix64 needs exact 64-bit wrapping. | JavaScript numbers lose precision above 2^53. |

## Workflows

- **Governing skills**: `anti-slop-code`, `production-systems`, `google-developer-style`.
- **Owners**: FORGE decomposes the work, a cloud agent implements it, and SCRIBE files the artifacts.
- **CI**: Reuse `.github/workflows/ci.yml`. Add a TypeScript parity job there instead of creating a new CI path.
- **Repo skills**: `/waykin-validate`, `/waykin-pr-review`.
