# Data model: mirrored from WaykinCore

Swift core parity types mirror the Swift types field for field; Lens-only presentation and persistence records are separate. Evidence labels below distinguish source fields from not-yet-ported families:

- `OBSERVED`: Verified against the cited Swift source; does not imply the TypeScript family is implemented.
- `INFERRED`: A Lens-only shape or a projection pending a Swift vector; confirm before a parity claim.

Swift `Double` and `TimeInterval` map to TypeScript `number`, which is the same IEEE 754 binary64. Swift `UInt64` maps to `uint64` (see `contracts/core-parity.md`). Swift `Int` maps to a TypeScript integer `number`.

## WorldState (`Domain/Models.swift`)

| Field | Type | Label |
|---|---|---|
| `timeContext` | Swift `TimeContext` | OBSERVED (`Models.swift:42-114`); D-001 uses midday |
| `movementState` | `idle`, `moving`, `paused`, `stopped` | OBSERVED (`Models.swift:42-114`, `MovementEngine.swift:42-90`) |
| `currentSpeedMetersPerSecond` | number | OBSERVED (`Models.swift:42-114`); non-finite → 0 |
| `sessionDistanceMeters` | number ≥ 0 | OBSERVED (`Models.swift:42-114`) |
| `activeTime` | seconds ≥ 0 | OBSERVED (`Models.swift:42-114`) |
| `bondLevel` | integer ≥ 0 | OBSERVED (`Models.swift:42-114`) |
| `familiarity` | number in [0, 1] | OBSERVED (`Models.swift:42-114`) |
| `energy` | number in [0, 1] | OBSERVED (`Models.swift:42-114`) |
| `pressure` | number in [0, 1] | OBSERVED (`Models.swift:42-114`) |
| `lastEventAt` | Date or null | OBSERVED (`Models.swift:42-114`) |

## WorldEventKind

The kinds are `quietInterval`, `companionDrawsNear`, `companionMovesAhead`, `companionObserves`, `distantPresence`, `pursuitBegins`, `pursuitIntensifies`, `pursuitFades`, `familiarPlaceStirs`, and `bondMoment`. The raw values equal the case names (OBSERVED, through `debugLabel: kind.rawValue`, assuming default raw values).

## WorldEvent

| Field | Rule | Label |
|---|---|---|
| `kind` | — | OBSERVED |
| `occurredAt` | — | OBSERVED |
| `intensity` | `max(energy, pressure)` | OBSERVED |
| `debugLabel` | `kind.rawValue` | OBSERVED |

## WorldEventRule (OBSERVED)

| Field | Default | Validation on init |
|---|---|---|
| `kind` | — | — |
| `minimumEnergy` | 0 | clamp to [0, 1]; non-finite becomes 0 |
| `minimumPressure` | 0 | clamp to [0, 1] |
| `maximumPressure` | 1 | clamp to [0, 1] |
| `minimumFamiliarity` | 0 | clamp to [0, 1] |
| `minimumBondLevel` | 0 | `max(0, value)` |
| `weight` | 1 | `max(1, value)` (uint64) |
| `cooldown` | 20 | `max(0, value)` |

**Eligibility**: A rule is eligible when all of the following hold:

1. Every threshold passes:
   - `energy ≥ minimumEnergy`
   - `minimumPressure ≤ pressure ≤ maximumPressure`
   - `familiarity ≥ minimumFamiliarity`
   - `bondLevel ≥ minimumBondLevel`
2. The cooldown has elapsed. The rule is ineligible if `elapsed − lastFired < cooldown`, so the comparison is strict.
3. `movementState` is `moving` or `paused`.

## WorldEventGeneratorConfiguration (OBSERVED)

- `minimumTickSpacing`: defaults to 40 and is set to `max(0, value)`.
- `rules`: an ordered list. Order is significant for selection. The default is the 10 `defaultRules`, which you copy verbatim through the vectors, not by hand.

## SeededRandomNumberGenerator (OBSERVED)

- **State**: uint64. If the seed is 0, the state starts as `0x9E3779B97F4A7C15`. Otherwise, it starts as the seed.
- **`next()`**: Runs these steps with wrapping arithmetic modulo 2^64:
  1. `state += 0x9E3779B97F4A7C15`
  2. `z = state`
  3. `z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9`
  4. `z = (z ^ (z >> 27)) * 0x94D049BB133111EB`
  5. Return `z ^ (z >> 31)`.

## WorldEventGenerator state (OBSERVED)

The generator holds `rng`, `configuration`, `lastGeneratedAtElapsed` (optional), and `lastFiredAtElapsedByKind`.

**Transition**: When the generator emits an event, it sets `lastGeneratedAtElapsed = elapsed` and `lastFiredAtElapsedByKind[kind] = elapsed`. When it returns nil, no state changes and the RNG doesn't advance.

## Movement sample and integrity (`Location/MovementIntegrity.swift`, `Engines/MovementEngine.swift`)

| Field | Label |
|---|---|
| `timestamp` | OBSERVED: `LocationSample.timestamp` |
| `latitude` | OBSERVED: `LocationSample.latitude` |
| `longitude` | OBSERVED: `LocationSample.longitude` |
| `altitude` | OBSERVED: optional `LocationSample.altitude` |
| `horizontalAccuracy` | OBSERVED: `LocationSample.horizontalAccuracy` |
| `reportedSpeedMetersPerSecond` | OBSERVED: `LocationSample.reportedSpeedMetersPerSecond`; adapter passes NaN (D-101/CF-28) |

- **Integrity outcome**: accepted or rejected, with a reason (INFERRED).
- **Coordinates**: They never leave the location adapter and the movement engine. Receipts never contain them.

## Lira state (`Engines/CompanionRuntime.swift`, `CompanionPresentationMatrix.swift`; GA C2)

| Field | Label |
|---|---|
| `behavior`: core companion behavior, mapped to Lens presentation | OBSERVED: `CompanionRuntime.swift`; do not confuse core commands with the rendered state |
| `relativeDistance` | INFERRED Lens placement projection; D-202/D-203 band table governs it |

**Lens presentation**: Five states — `idle`, `follow`, `investigate`, `alert`, `celebrate` — use six clips: `Lira_Idle`, `Lira_Follow`, `Lira_Investigate`, `Lira_Alert` (loops), `Lira_Celebrate`, `Lira_Spawn` (one-shots; D-200/CF-03, `CompanionPresentationState.swift:4-10`). The companion matrix maps movement, events, and pursuit to presentation; Lens presentation is not another Swift `WorldState` field.

## Pursuit state (GA C1)

| Field | Label |
|---|---|
| `pressure` (bounded, [0, 1]) | OBSERVED: `WorldState.pressure` and `Experiences.swift` |
| `phase`: `inactive`, `noticed`, `approaching`, `close`, `fading` | OBSERVED: Swift `PursuitState`; see B §2.2 and TST-005 |

User pause stops core ticks, so pressure and pursuit state do not change merely because of pause. Standing still in an active walk is ticked and can increase pressure by `+0.16` for a non-moving sample (`Experiences.swift:199-204`); `.paused` movement state remains event-eligible (`WorldEventGenerator.swift:36,46`). Stop finalizes the session; adapters do not independently rewrite pursuit (T029).

## Generator lifetime (GA C4)

The generator module keeps its RNG state across `evaluate` calls (seed-event vectors). The Experience/runtime layer creates a **fresh** `WorldEventGenerator(seed: eventSeed)` per movement update (`Experiences.swift:118-126`); cooldown history is supplied by `lastEventElapsed` and `lastEventElapsedByKind`, not a persisted generator RNG. Require multi-tick Experience-level Swift vectors before claiming that layer's parity (T013–T015).

## Audio cue (`Engines/AudioExperienceLayer.swift`)

There are seven semantic cue kinds (OBSERVED count, from PLAN.md). The names are INFERRED; read them from Swift. The core emits only semantic kinds. The Lens audio adapter maps each kind to an asset.

## Bond

| Field | Label |
|---|---|
| `level` (integer ≥ 0) | INFERRED |
| `delta` per session | INFERRED |

Bond is the single persistent progression metric. The delta rules come from the Swift vectors.

## SessionMemory (Swift mirror: `Sources/WaykinCore/Domain/Models.swift:400-412`)

| Field | Type | Label |
|---|---|---|
| `id` | UUID string | OBSERVED |
| `sessionID` | UUID string | OBSERVED |
| `text` | string | OBSERVED: `"\(companion.name) remembers a \(dist)m walk. \(result.memoryText)"` (`Engines/MemoryEngine.swift:10-11`) |
| `timestamp` | date (ISO 8601) | OBSERVED |

The TS core and the vectors mirror exactly these four fields. Nothing else is part of `SessionMemory`.

## LensMemoryEntry (Lens persistence record; not a Swift type)

This is the persisted per-walk entry from D-030 (accepted), stored in `profile.memories` (behavior-spec §6). It is built at finalize (T18, BEH-048) from the Swift `SessionMemory` plus Lens session data:

| Field | Source |
|---|---|
| `id` | `SessionMemory.id` |
| `endedAt` (ms) | `SessionMemory.timestamp` |
| `line` | `SessionMemory.text` (truncated to 280 characters per D-113) |
| `mode`, `activeTime`, `distance`, `eventKinds[]`, `bondDelta`, `endedReason` | Lens session state at finalize (BEH-048); not exported by Swift |

Vectors cover `SessionMemory` only. `LensMemoryEntry` is tested by Lens unit tests (T015), not parity vectors.

**Retention**: The Lens keeps the last five memories and drops the oldest first.

## WalkSummary

| Field | Label |
|---|---|
| `mode` (demo or walk) | INFERRED |
| `activeTime` | INFERRED |
| `distance` | INFERRED |
| `eventCount` | INFERRED |
| `bondDelta` | INFERRED |
| `endedReason` (`userStop`, `demoComplete`, `power`, `locationLost`, `timeLimit`, `interrupted`, `closed`, `error`) | Lens-only summary reasons per B §8 and T032; not a Swift parity field |

**Lifecycle**: A summary is derived once at session end and is then immutable.

## Session lifecycle

`idle → intro → (demo | walk) active ⇄ paused → ending → summary → idle`. Stop is valid from any state.