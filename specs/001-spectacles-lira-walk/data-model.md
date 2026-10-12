# Data model: mirrored from WaykinCore

The TypeScript types mirror the Swift types field for field. Each field carries an evidence label:

- `OBSERVED`: The field appears in the `WorldEventGenerator.swift` excerpt.
- `INFERRED`: The field is assumed from usage or the directory layout. Confirm it against the Swift source before you port it.

Swift `Double` and `TimeInterval` map to TypeScript `number`, which is the same IEEE 754 binary64. Swift `UInt64` maps to `uint64` (see `contracts/core-parity.md`). Swift `Int` maps to a TypeScript integer `number`.

## WorldState (`Domain/Models.swift`)

| Field | Type | Label |
|---|---|---|
| `energy` | number, in [0, 1] | OBSERVED (usage) |
| `pressure` | number, in [0, 1] | OBSERVED (usage) |
| `familiarity` | number, in [0, 1] | OBSERVED (usage) |
| `bondLevel` | integer ≥ 0 | OBSERVED (usage) |
| `movementState` | enum; includes `moving` and `paused` | OBSERVED (the other cases are INFERRED) |
| `activeTime` | seconds | OBSERVED (usage) |
| `lastEventAt` | Date or null | OBSERVED (usage) |

The `[0, 1]` range for energy, pressure, and familiarity is INFERRED.

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
| `timestamp` | INFERRED |
| `latitude` | INFERRED |
| `longitude` | INFERRED |
| `horizontalAccuracy` | INFERRED |
| `speed` | INFERRED |

- **Integrity outcome**: accepted or rejected, with a reason (INFERRED).
- **Coordinates**: They never leave the location adapter and the movement engine. Receipts never contain them.

## Lira state (`Engines/CompanionRuntime.swift`, `CompanionPresentationMatrix.swift`)

| Field | Label |
|---|---|
| `behavior`: follow, drawNear, moveAhead, observe (3–4 for the MVP) | INFERRED |
| `relativeDistance` | OBSERVED as a concept in the spec; the type is INFERRED |

**Transitions**: The companion matrix drives transitions from movement state, speed, and events (INFERRED).

## Pursuit state

| Field | Label |
|---|---|
| `pressure` (bounded, [0, 1]) | INFERRED |
| `phase`: inactive → active → intensified → fading → inactive | INFERRED; follows the `pursuitBegins`/`pursuitIntensifies`/`pursuitFades` events |

Pause and Stop force the phase toward inactive (INFERRED). Safety precedence is a spec invariant.

## Audio cue (`Engines/AudioExperienceLayer.swift`)

There are seven semantic cue kinds (OBSERVED count, from PLAN.md). The names are INFERRED; read them from Swift. The core emits only semantic kinds. The Lens audio adapter maps each kind to an asset.

## Bond

| Field | Label |
|---|---|
| `level` (integer ≥ 0) | INFERRED |
| `delta` per session | INFERRED |

Bond is the single persistent progression metric. The delta rules come from the Swift vectors.

## SessionMemory (`Engines/MemoryEngine.swift`)

| Field | Label |
|---|---|
| `id` | INFERRED |
| `endedAt` | INFERRED |
| `seed` | INFERRED |
| `activeTime` | INFERRED |
| `distance` | INFERRED |
| `eventKinds[]` | INFERRED |
| `bondDelta` | INFERRED |
| `line` (concise text) | INFERRED |

**Retention**: The Lens keeps the last five memories and drops the oldest first.

## WalkSummary

| Field | Label |
|---|---|
| `mode` (demo or walk) | INFERRED |
| `activeTime` | INFERRED |
| `distance` | INFERRED |
| `eventCount` | INFERRED |
| `bondDelta` | INFERRED |
| `endedReason` (user stop, thermal/power, location lost) | INFERRED |

**Lifecycle**: A summary is derived once at session end and is then immutable.

## Session lifecycle

`idle → intro → (demo | walk) active ⇄ paused → ending → summary → idle`. Stop is valid from any state.
