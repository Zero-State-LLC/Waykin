# Behavior spec: Lira Walks With You (core logic)

**Spec set**: `specs/001-spectacles-lira-walk/` · **Status**: Draft for implementation · **Scope**: core logic in `packages/waykin-core-ts` plus the behavioral contract that Lens adapters must honor. Visual and audio rendering details belong to `presentation-spec.md`. Lens Studio wiring belongs to `lens-studio-build.md`.

**How to read this document**

- `BEH-NNN` marks a testable requirement.
- `GAP-B-<AREA>-NN` marks a gap that this document closes. The appendix lists every gap.
- `D-1NN` is a proposed product decision. `NC-NN` is an unknown hardware or platform fact with a safe default that the implementation uses until someone measures the real value. The appendix lists all of them.
- Citations use `path:line`. "Platform knowledge, verify" marks facts that don't appear in the provided Snap excerpts.
- The Swift sources are the source of truth (`docs/decisions/ADR-0004-snap-spectacles-target.md:37-38`). When this spec restates Swift behavior, Swift wins if the two disagree, and the vectors decide.

**Corrections to existing spec-set text.** These are flagged deliberately, and each one includes its reasoning.

1. `data-model.md:103-110` labels pursuit phases as "inactive → active → intensified → fading" (INFERRED). The OBSERVED Swift enum is `inactive, noticed, approaching, close, fading` (`Sources/WaykinCore/Domain/Models.swift:143-145`). This spec uses the Swift enum. (GAP-B-SM-03)
2. `contracts/core-parity.md:39-43` requires bit-exact parity everywhere. Movement distance in Swift comes from `CLLocation.distance` (`Sources/WaykinCore/Location/MovementIntegrity.swift:291-294`), which TypeScript can't reproduce bit-exactly. Seed and event vectors stay bit-exact. Movement vectors use a tolerance (D-100). (GAP-B-GPS-02)
3. iOS "follow" places Lira beside and slightly *behind* the walker (`App/AR/ARWorldCommandRenderer.swift:521-523`). Spectacles renders only content in front of the wearer within a portrait field of view (SNAP DOC introduction-to-spatial-design, "Unique to Spectacles"), so a position behind the walker is invisible. The Lens therefore keeps Lira forward (D-202/D-203). (GAP-B-LIRA-02)

---

## §1 Constants

All values are exact. **Port** means copy the value from Swift verbatim. The vectors carry the post-clamp values (`contracts/core-parity.md:15-18`).

### 1.1 RNG and event generator (GAP-B-CONST-01)

| Name | Value | Unit | Source |
|---|---|---|---|
| `RNG_GOLDEN` | `0x9E3779B97F4A7C15` (seed-0 substitute and increment) | uint64 | `Sources/WaykinCore/Engines/WorldEventGenerator.swift:99,103` |
| `RNG_MUL1` | `0xBF58476D1CE4E5B9` | uint64 | `…/WorldEventGenerator.swift:105` |
| `RNG_MUL2` | `0x94D049BB133111EB` | uint64 | `…/WorldEventGenerator.swift:106` |
| Shifts | 30, 27, 31 | bits | `…/WorldEventGenerator.swift:105-107` |
| `MIN_TICK_SPACING` | 40 | s of `movementSeconds` | `…/WorldEventGenerator.swift:65` |
| `EVENT_SEED_DEFAULT` | 42 | — | `Sources/WaykinCore/Experiences/ExperienceProtocol.swift:23`. The real walk passes no seed (`App/WaykinApp.swift:1001-1005`). |
| `EVENT_HISTORY_CAP` | 32 | events | `Sources/WaykinCore/Experiences/Experiences.swift:135-137` |
| Rule default cooldown | 20 | s | `…/WorldEventGenerator.swift:21` |

**Default rules** (port in order; order is significant). Source: `…/WorldEventGenerator.swift:81-92`. Blank threshold cells take the defaults: minimum energy 0, minimum pressure 0, maximum pressure 1, minimum familiarity 0, minimum bond 0.

| # | Kind | minE | minP | maxP | minFam | minBond | Weight | Cooldown (s) |
|---|---|---|---|---|---|---|---|---|
| 1 | quietInterval | 0 | | 0.25 | | | 3 | 28 |
| 2 | companionDrawsNear | 0.05 | | 0.48 | | | 7 | 24 |
| 3 | companionMovesAhead | 0.40 | | 0.62 | | | 4 | 30 |
| 4 | companionObserves | 0 | 0.04 | 0.55 | | | 4 | 22 |
| 5 | distantPresence | | 0.24 | 0.70 | | | 3 | 44 |
| 6 | pursuitBegins | 0.28 | 0.36 | 0.78 | | | 2 | 70 |
| 7 | pursuitIntensifies | | 0.55 | 1 | | | 3 | 48 |
| 8 | pursuitFades | 0.50 | 0.18 | 0.55 | | | 3 | 38 |
| 9 | familiarPlaceStirs | | | | 0.30 | | 3 | 50 |
| 10 | bondMoment | 0.20 | | | | 8 | 3 | 60 |

### 1.2 World state derivation inside the walk experience (GAP-B-CONST-02)

| Name | Value | Source |
|---|---|---|
| `tickSeconds` (moving) | `max(1, distanceDelta / max(speed, 0.5))` | `Experiences.swift:77` |
| `tickSeconds` (not moving) | 1, but `movementSeconds` doesn't advance | `Experiences.swift:77-81` |
| Bond progress per moving tick | `min(0.4, tickSeconds / 90)` | `Experiences.swift:80` |
| Energy | `max(min(1, max(0, speed) / 2.2), activityEnergyHint)`. The hint is always 0 on the Lens because there is no HealthKit (`spec.md` FR-015). | `Experiences.swift:87-89` |
| Familiarity | `min(1, sessionDistance / 1800)` | `Experiences.swift:97` |
| Pressure | `clamp01(prev + min(0.45, movementSeconds / 1800) + (moving ? -0.08 : +0.16) + (speed > 1.2 ? -0.06 : +0.04))` | `Experiences.swift:199-204` |
| Event intensity | `max(energy, pressure)` | `WorldEventGenerator.swift:169` |

### 1.3 Movement integrity (GAP-B-CONST-03). Port `conservativeWalking`.

Source: `Sources/WaykinCore/Location/MovementIntegrity.swift:17-26`.

| Name | Value | Unit |
|---|---|---|
| `MAX_H_ACCURACY` | 30 | m |
| `MAX_SAMPLE_AGE` | 15 | s |
| `MAX_FUTURE_SKEW` | 2 | s |
| `MIN_DISPLACEMENT` | 1.5 | m |
| `MAX_WALK_SPEED` | 4.5 | m/s |
| `MAX_SINGLE_DISPLACEMENT` | 60 | m |
| `STATIONARY_SPEED` | 0.25 | m/s |
| `MOVING_SPEED` | 0.55 | m/s |
| `ANCHOR_RESET_INTERVAL` | 15 | s |
| `SPEED_WINDOW` | 3 | samples |
| `PRECISE_ACCURACY_BUCKET` | ≤ 10 | m (`MovementIntegrity.swift:286`) |

### 1.4 Path progress (GAP-B-CONST-04). Source: `Sources/WaykinCore/Path/PathProgressEngine.swift:109-164`.

| Name | Value |
|---|---|
| Accepted samples before leaving `establishing` | 2 |
| `onPath` → `strained` | 5 consecutive stationary accepts |
| Reject streak → `strained` | ≥ 3 |
| Reject streak → `offPath` | ≥ 8 |
| Recovery from `offPath` or `recovered` → `onPath` | 2 consecutive moving accepts |
| Base pressure by relation | establishing 0.05, onPath 0.0, recovered 0.15, strained 0.45, offPath 0.75 |
| Pressure boosts | reject boost `min(0.25, 0.03 × streak)`; stall boost `min(0.15, 0.03 × max(0, stationary − 3))` |

### 1.5 Audio (GAP-B-CONST-05)

| Name | Value | Source |
|---|---|---|
| Behavior-transition cue cooldown | 12 s of `movementSeconds` | `Sources/WaykinCore/Engines/AudioExperienceLayer.swift:17` |
| AR-presentation cue cooldown | 12 s | `AudioExperienceLayer.swift:19` |
| Path cue cooldown | 14 s | `Sources/WaykinCore/Path/PathAudioCoupling.swift:6` |
| Event-layer cooldown | 18 s. Not effective: a new layer is created on every tick (`Experiences.swift:146`). Port as is. | `AudioExperienceLayer.swift:32` |
| Moment cue priority and intensity | 6 and 0.9 | `AudioExperienceLayer.swift:194,205` |
| Per-cue gain | `volume × max(0.25, intensity)` | `App/AppAudioCuePlayer.swift:352` |
| Catalog volumes | see §2.6 | `App/AppAudioCuePlayer.swift:35-48` |

### 1.6 Lira presentation (GAP-B-CONST-06)

| Name | Value | Unit | Source |
|---|---|---|---|
| iOS relative distance by matrix (input to the D-203 band mapping) | drawNear and bondMoment 1.2; follow 1.8; rest 2.0; observe 2.5; lead 4.0 | m | `Sources/WaykinCore/Engines/CompanionPresentationMatrix.swift:17-40` |
| iOS distance bands (map iOS meters → band; the band → Lens meters per D-203) | immediate ≤ 0.75; near ≤ 1.25; medium ≤ 2.0; far > 2.0; invalid values → near | m | `App/AR/CanonicalARWorldCommandMapper.swift:182-192` |
| Forward distance | D-202/D-203 band table | m | D-202/D-203 |
| Lateral offset | +0.6 on Lira's current side (default right) | m | D-202/D-203 |
| Celebrate duration | 1500 | ms | `App/AR/Companion/CompanionPresentationState.swift:39` |
| Follow speed (base, max, overtake factor) | 1.35, 5.0, ×1.35 | m/s | `App/AR/ARWorldCommandRenderer.swift:414-419` |
| Arrive radius | 0.45 | m | `ARWorldCommandRenderer.swift:432` |
| Walker-speed smoothing | α = 0.08; reject instantaneous speed ≥ 12 m/s | — | `ARWorldCommandRenderer.swift:469-470` |
| Max gap before ignoring a frame | 60 | m | `ARWorldCommandRenderer.swift:483` |
| Replant distance | 6.0 | m | `App/AR/ARPlacementResolver.swift:10` |
| Continuity check interval | 1000 | ms | `App/AR/CanonicalARSessionView.swift:31` |
| Tracking hide delay / restore delay | 0 / 500 | ms | D-206 |

### 1.7 Session, location, and persistence (GAP-B-CONST-07)

| Name | Value | Unit | Source |
|---|---|---|---|
| Location poll interval | 1000 | ms | SNAP DOC location (`repeatUpdateUserLocation.reset(1.0)`); `spec.md` FR-006 |
| Location accuracy mode | `GeoLocationAccuracy.Navigation` | — | SNAP DOC location; `spec.md` FR-006 |
| No-first-fix timeout | 30 000 | ms | D-110 |
| Degraded signal | no accepted sample for 15 000 ms | ms | D-111 (aligned to `ANCHOR_RESET_INTERVAL`) |
| Location-lost auto-end | no position callback for 120 000 ms | ms | D-111 |
| Error callbacks before degraded | 3 consecutive | — | D-111 |
| Demo tick interval | 5000 real ms per simulated 40 s tick | ms | D-104 |
| Demo ticks | 7 × (40 s, 1.4 m/s) | — | `Sources/WaykinCore/Engines/DemoSessionController.swift:40` |
| Walk soft prompts (HUD line 2) | elapsed 15:00 and 20:00 | mm:ss | D-107, D-216 |
| Walk hard end | elapsed 30:00 | mm:ss | D-107, NC-10 |
| Checkpoint interval | 30 000 | ms | D-108 |
| Recovery window | 24 | h | D-108 |
| Minimum active time for early-end Bond | 60 | s | D-109 |
| Starting Bond | 12 | level | `Sources/WaykinCore/Persistence/PersistenceStore.swift:41` |
| Real-walk Bond delta | +1 | level | `App/WaykinApp.swift:1097` |
| Memory retention | 5 | records | `spec.md` FR-013 |
| Memory text max length | 280 | chars | D-113 |
| Storage schema version | 1 | — | D-112 |
| Field receipt timeline cap | 200 | entries | `skills/waykin-performance/SKILL.md:66` |
| Power budget target | < 100 | % | SNAP DOC lens-performance-overlay |
| Target frame rate | 60 | FPS | SNAP DOC publishing-lens |
| Degrade trigger | mean frame delta > 20 ms sustained 10 s | — | D-116, NC-11 |

- **BEH-001**: The core MUST expose every constant in §1.1–§1.4 as a named, exported `const` in TypeScript. Tests MUST compare those constants against the vectors' `config` (`contracts/seed-event-vectors.schema.json:72-79`).

---

## §2 Event tables

### 2.1 Event catalog (GAP-B-EVT-01)

On every tick, the experience creates a new `WorldEventGenerator(seed: eventSeed)` (`Experiences.swift:118-126`). Because of this, the same eligible set always yields the same first draw for a given seed.

- **BEH-002**: The TypeScript core MUST reproduce this behavior, including the fresh generator per tick. Spacing and cooldowns come only from the externally passed `lastEventElapsed` and `lastEventElapsedByKind`.

The behavior, distance, AR state, and cue columns resolve per `CompanionPresentationMatrix.swift:26-40` and `AudioExperienceLayer.swift:110-127`.

| Kind | Rule # | Core behavior / distance | AR state | Event cue (kind, bias, priority, group) | Lira line (verbatim, `Experiences.swift:241-262`) | Pursuit effect |
|---|---|---|---|---|---|---|
| companionDrawsNear | 2 | drawNear / band | follow | companionNear, left, 2, companion | "Lira draws near." | — |
| companionMovesAhead | 3 | lead / band | follow | companionAhead, center, 2, companion | "Lira moves a few steps ahead." | — |
| companionObserves | 4 | observe / band | investigate | quietShift, center, 1, ambient | "Lira pauses, listening." | — |
| distantPresence | 5 | observe / band | investigate | distantFootsteps, behind, 3, pursuit | "Something distant notices the walk." | inactive → noticed |
| pursuitBegins | 6 | follow / band | alert | distantFootsteps, behind, 3, pursuit | "A presence begins to follow." | → approaching |
| pursuitIntensifies | 7 | follow / band | alert | pursuitPressure, behind, 4, pursuit | "The pressure moves closer." | → close |
| pursuitFades | 8 | lead / band | follow | pursuitRelease, behind, 3, pursuit | "The pressure falls away." | → fading |
| familiarPlaceStirs | 9 | observe / band | investigate | quietShift, center, 1, ambient | "This place feels faintly remembered." | — |
| quietInterval | 1 | rest / band | idle | quietShift, center, 1, ambient | "The world settles into quiet." | — |
| bondMoment | 10 | drawNear / band | celebrate | bondMotif, center, 5, bond | "Lira answers with a familiar motif." | — |
| (no event, moving) | — | follow / band | follow | behavior cue only | night: "Lira keeps close in the dark."; otherwise: "Lira matches your pace." (`Experiences.swift:237-239`) | — |
| (no event, not moving) | — | observe / band | investigate | behavior cue only | same as the moving row | — |

The Lens time context is always `midday` because there is no clock-based variant in the MVP (D-122). The no-event line is therefore always "Lira matches your pace."

**AR-state overrides when there is no event** (`CompanionPresentationMatrix.swift:71-78`). These apply only when pursuit is `inactive` or `fading`:

- If path is `offPath` or path pressure ≥ 0.7, the AR state is `alert`.
- If path is `strained` or path pressure ≥ 0.4, the AR state is `investigate`.

### 2.2 Pursuit table (GAP-B-EVT-02)

Gating comes from `Experiences.swift:221-234`, and the transitions come from `Experiences.swift:206-219`.

| Current state | Allowed pursuit events | Next state |
|---|---|---|
| inactive | distantPresence | noticed |
| noticed | pursuitBegins | approaching |
| approaching | pursuitIntensifies, pursuitFades | close, fading |
| close | pursuitIntensifies, pursuitFades | close, fading |
| fading | none (no gated pursuit kind is allowed) | stays fading for the rest of the walk |

All non-pursuit kinds are allowed in every state.

- **BEH-003**: Pursuit MUST be expressed only through cues and Lira's AR state. No pursuer entity may appear (`spec.md` FR-009). Discovery and threat placeholder entities from the iOS mapper (`CanonicalARWorldCommandMapper.swift:39-56`) MUST NOT be rendered on the Lens (D-123). The hunter echo is Lira's own silhouette; it renders per PRS-011 in alert state only and is hidden while degraded.
- **BEH-004**: While the session is user-paused, the core MUST receive no ticks (iOS parity: `App/WaykinApp.swift:1434-1440` stops location updates). As a result, pressure, events, and pursuit don't advance. No adapter may change gameplay values. Non-moving samples during an active walk are ticked normally and follow Swift's pause pressure (`Experiences.swift:199-204`) and `.paused` eligibility (`WorldEventGenerator.swift:36,46`). The Lens MUST stop playing the foreground and ambient channels (`App/AppAudioCuePlayer.swift:385-391` parity).

### 2.3 Bond rules (GAP-B-EVT-03)

| ID | Rule | Source |
|---|---|---|
| BEH-005 | Bond starts at 12 when no profile exists. | `PersistenceStore.swift:41` |
| BEH-006 | A Begin Walk that ends by user Stop adds **+1** Bond. | `App/WaykinApp.swift:1097` |
| BEH-007 | A Demo Walk adds `max(1, floor(accumulatedBondProgress))`. The canonical demo yields **+2**. | `Experiences.swift:183`; computed from §1.2: 7 × 0.4 = 2.8 |
| BEH-008 | An early end (thermal, power, location lost, or recovered crash) adds +1 if `activeTime` ≥ 60 s. Otherwise it adds 0. | D-109 |
| BEH-009 | Bond has no cap and never decreases. | `Models.swift:72` clamps ≥ 0; D-118 |

### 2.4 Memories (GAP-B-EVT-04)

**BEH-010**: Choose the memory text by taking the first matching row. Event kinds come from `eventHistory`. Source: `Experiences.swift:265-289`.

| Condition | Text (verbatim; `{d}` = `Int(distance)`) |
|---|---|
| observes, drawsNear, distantPresence, and pursuitFades all present | "Lira watched the path, drew close when a distant presence appeared, and stayed beside you until it faded." |
| distantPresence and pursuitFades | "Lira noticed a distant presence and stayed beside you until it faded." |
| distantPresence | "Lira noticed a distant presence during a {d}m walk." |
| drawsNear | "Lira drew close during a {d}m walk." |
| observes | "Lira watched the path during a {d}m walk." |
| bondMoment | "Lira shared a familiar motif during a {d}m walk." |
| otherwise | "Lira stayed close during a quiet {d}m walk." |

**BEH-011**: Append the path suffix (`Sources/WaykinCore/Path/WalkPathCopy.swift:39-64`). Replace the trailing "." with "; {suffix}.". The suffixes are:

| Relation | Suffix |
|---|---|
| onPath | "the path held steady" |
| strained | "the path felt strained" |
| offPath | "the path slipped for a while" |
| recovered | "the path found you again" |
| establishing | none |

**BEH-012**: Truncate the final text to 280 characters and end it with "…" when truncated (D-113). Keep the 5 newest records and drop the oldest first (FR-013).

### 2.5 Demo Walk scripted arc (GAP-B-DEMO-01)

**BEH-013**: Demo uses `updateForDemo` with the scheduled kinds and with generation suppressed (`Experiences.swift:50-63,107-116`). Kind order comes from `DemoSessionController.swift:6-14`. Each tick simulates delta 40 s at speed 1.4 m/s, a distance of 56 m, with `tickSeconds = 40`. Tick *i* fires at real time 5000 × (i + 1) ms after Demo start (D-104).

| Tick | Kind | Behavior / distance | AR state | Cue | Pursuit after | Cumulative distance |
|---|---|---|---|---|---|---|
| 0 | companionObserves | observe / band | investigate | quietShift | inactive | 56 m |
| 1 | companionDrawsNear | drawNear / band | follow | companionNear | inactive | 112 m |
| 2 | distantPresence | observe / band | investigate | distantFootsteps | noticed | 168 m |
| 3 | pursuitBegins | follow / band | alert | distantFootsteps | approaching | 224 m |
| 4 | pursuitIntensifies | follow / band | alert | pursuitPressure | close | 280 m |
| 5 | pursuitFades | lead / band | follow | pursuitRelease | fading | 336 m |
| 6 | bondMoment | drawNear / band | celebrate | bondMotif | fading | 392 m |

- **BEH-014**: After tick 6, Demo auto-ends 5000 ms later and opens the summary. The end reason is `demoComplete`. Stop works at any time. Pause stops the tick timer, and resume restarts the remaining interval from 5000 ms.
- **BEH-015**: The Demo memory is the 4-kind text plus the onPath suffix: "Lira watched the path, drew close when a distant presence appeared, and stayed beside you until it faded; the path held steady." Path relation reaches `onPath` at the second accept (§1.4). The Demo distance is 392 m and the Bond change is +2.
- **BEH-016**: Demo never touches GPS. Demo plays no spawn moment cue (`App/WaykinApp.swift:643-645` parity).

### 2.6 Audio cue catalog and planner (GAP-B-AUDIO-01)

Source: `App/AppAudioCuePlayer.swift:35-48`.

| Cue kind | Asset basename | Channel | Priority | Volume |
|---|---|---|---|---|
| companionNear | companion_near | foreground | 2 | 0.40 |
| companionAhead | companion_ahead | foreground | 2 | 0.40 |
| distantFootsteps | distant_presence | foreground | 3 | 0.36 |
| pursuitPressure | pursuit_pressure | foreground | 4 | 0.45 |
| pursuitRelease | pursuit_release | foreground | 3 | 0.36 |
| bondMotif | bond_motif | foreground | 5 | 0.42 |
| quietShift | quiet_shift | ambient | 1 | 0.30 |
| spawnTheme | lira_spawn_theme | moment | 6 | 0.48 |
| bondMilestone | lira_bond_milestone | moment | 6 | 0.46 |

- **BEH-017**: The Lens excludes `appLaunchTheme` and `companionReveal` (D-124).
- **BEH-018**: Each tick selects cues in priority order (`App/WaykinApp.swift:1346-1376` parity):
  1. The event cue, if any.
  2. Otherwise, the behavior-transition cue (`AudioExperienceLayer.swift:57-75,130-177`): drawNear → companionNear; lead → companionAhead; rest and observe → quietShift (intensity ≤ 0.4); celebrate → bondMotif; follow and idle → none. The first seed in a session is silent.
  3. Otherwise, the AR-presentation transition cue (`AudioExperienceLayer.swift:80-99,215-255`): celebrate → bondMotif; alert → pursuitPressure (intensity ≤ 0.7); investigate → quietShift (≤ 0.4); follow and idle → none. The first seed is silent.
  4. Otherwise, the path cue (`PathAudioCoupling.swift:16-57`), only when pursuit is inactive or fading: strained → quietShift 0.35 center; offPath → quietShift 0.5 behind; recovered → pursuitRelease 0.4 center.
- **BEH-019**: The planner (`App/AppAudioCuePlayer.swift:77-97`) applies these rules:
  - It allows one active cue per channel.
  - It ignores a cue whose kind is already active on the channel.
  - It ignores a cue whose effective priority is lower than the active cue's priority, where effective priority is `max(cue.priority, catalog priority)`.
  - Otherwise, the new cue replaces the active cue.
  - It ignores all cues while paused.
  - A channel frees when its clip finishes.
- **BEH-020**: A missing asset fails to silence and logs `ERR-AUDIO-01` once per basename (`App/AppAudioCuePlayer.swift:333-338`). Every cue uses `Audio.PlaybackMode.LowPower` (SNAP DOC audio; D-115).
- **BEH-021**: `spawnTheme` plays once when Begin Walk enters `active` (`App/WaykinApp.swift:1010`). `bondMilestone` plays once on the summary when the Bond change is > 0 (`App/WaykinApp.swift:231-235`).

---

## §3 State machines

### 3.1 Session (GAP-B-SM-01)

**States**: `boot`, `onboarding`, `home`, `requestingLocation`, `acquiringFix`, `walkActive`, `walkPaused`, `demoActive`, `demoPaused`, `ending`, `summary`, `recoveryOffer`.

| ID | From | Event | Guard | To | Action |
|---|---|---|---|---|---|
| T1 | boot | storageLoaded | `onboardingDone == false` | onboarding | — |
| T2 | boot | storageLoaded | onboarding done, no checkpoint | home | — |
| T3 | boot | storageLoaded | checkpoint ≤ 24 h old | recoveryOffer | — |
| T3b | boot | storageLoaded | checkpoint > 24 h old | home | Finalize the checkpoint silently with BEH-008, then delete it (D-108). |
| T4 | onboarding | acknowledged | — | home | Set `profile.onboardingDone = true` and persist. |
| T5 | home | beginWalk | — | requestingLocation | Create the location service. |
| T6 | requestingLocation | firstCallback | position returned | acquiringFix | — |
| T7 | requestingLocation | error | permission denied | home | Show ERR-GPS-01. |
| T8 | acquiringFix | sampleAccepted | `awaitingFreshAnchor` or `accepted` | walkActive | Start the movement session (`resumeSession`), spawn Lira, play spawnTheme. |
| T9 | acquiringFix | timeout | 30 s elapsed | home | Show ERR-GPS-02 on ErrorPanel and offer Demo. |
| T10 | home | beginDemo | — | demoActive | Reset the path engine (demo mode) and start the tick timer. |
| T11 | walkActive | pause | — | walkPaused | `pauseSession`, stop polling, pause audio. |
| T12 | walkPaused | resume | — | walkActive | `resumeSession` (fresh anchor), restart polling, resume audio. |
| T13 | demoActive ↔ demoPaused | pause / resume | — | — | BEH-014 |
| T14 | walkActive, walkPaused, demoActive, demoPaused | stop | — | ending | `reason = userStop` |
| T15 | walkActive | locationLost | 120 s without any position | ending | `reason = locationLost` |
| T16 | walkActive, demoActive | powerHardEnd | elapsed ≥ 30:00, or a sustained power trigger (§4) | ending | `reason = timeLimit` or `power` |
| T17 | demoActive | arcComplete | 5 s after tick 6 | ending | `reason = demoComplete` |
| T18 | ending | finalized | — | summary | Compute §8, persist profile and memory, delete the checkpoint, play bondMilestone if the delta is > 0. |
| T19 | summary | done | — | home | — |
| T20 | recoveryOffer | showSummary | — | summary | Finalize the checkpoint with BEH-008 and `reason = interrupted`. |
| T21 | recoveryOffer | discard | — | home | Delete the checkpoint. No Bond change, no memory. |

- **BEH-022**: Stop MUST be accepted from every walk or demo state in one interaction (`spec.md` FR-010, SC-007).
- **BEH-023**: These transitions are forbidden:
  - Any state to `walkActive` except T8 and T12.
  - `walkPaused` to `ending` by timeout. A paused walk never auto-ends from time limits. Locationlost doesn't apply because polling is stopped while paused.
  - `demo*` to `walk*` and the reverse.
  - Any second `ending` while already in `ending`. Stop is idempotent (`App/WaykinApp.swift:776-778` parity).
  - `summary` to `walk*` without passing through `home`.

### 3.2 Lira presentation state (GAP-B-SM-02, GAP-B-LIRA-01)

**States** (D-106): `hidden`, `spawning`, `idle`, `follow`, `investigate`, `alert`, `celebrate`. The value comes from `arBehaviorString(state, event, pursuit, pathRelation, pathPressure)` (`CompanionPresentationMatrix.swift:43-90`).

| From | Event | Guard | To | Action |
|---|---|---|---|---|
| hidden | spawn (T8 or T10) | — | spawning | Coalesce scale 0.92 → 1 over 700 ms; 120 ms when reduce motion is on (`App/AR/Companion/LiraARMotion.swift:210-222`). |
| spawning | coalesceDone | — | resolved state | — |
| any visible state | tick | resolved ≠ current, and current ≠ celebrate | resolved | — |
| any visible state | tick | resolved = celebrate | celebrate | Start the 1500 ms timer. |
| celebrate | tick | resolved = celebrate and timer not done | celebrate | Don't restart the timer (`CompanionPresentationState.swift:82-89`). |
| celebrate | timer ≥ 1500 ms | — | idle | — |
| celebrate | tick | resolved ≠ celebrate | resolved | Cancel the timer. |
| any | trackingLimited | — | hidden | Keep the logical state; the renderer hides Lira immediately. |
| hidden (tracking) | trackingNormal | ≥ 500 ms stable | last logical state | Replant forward (§3.4). |
| any | sessionEnd | — | hidden | Clear the entity. |

- **BEH-024**: An unknown behavior string maps to `idle` (`CompanionPresentationState.swift:109-119`).
- **BEH-025**: Lira's state MUST NOT feed back into gameplay (`WAYKIN_SPEC.md:36`).

### 3.3 Pursuit

§2.2 is the complete state machine. Forbidden transitions: any jump not listed there. In particular, `inactive` → `approaching`, and `fading` → any other state.

### 3.4 Tracking and anchoring (GAP-B-SM-04, GAP-B-LIRA-02)

**States**: `notReady`, `tracking`, `limited`. The tracking API that exposes these states is NC-15. The default proxy treats the device as `limited` when the camera world transform has any non-finite component, or jumps more than 2 m in one frame.

| From | Event | To | Action |
|---|---|---|---|
| notReady | first finite camera pose | tracking | Place Lira at the forward target. |
| tracking | proxy trips | limited | Hide Lira. |
| limited | stable for ≥ 500 ms | tracking | Re-place Lira at the forward target. Log `continuityReplant`. |
| tracking | distance(Lira, camera) > 6 m and Lira behind, checked every 1 s (PRS-018), or outside ±25° for 8 s while moving (PRS-021) | tracking | Replant forward. Never replant in view (`App/AR/ARPlacementResolver.swift:306-311` parity). |

**Forward target** (D-202/D-203). This applies every frame while the session is active:

- `forward =` the D-202/D-203 band table distance along the flattened camera forward vector.
- Offset by +0.6 m along the flattened right vector on Lira's current side (default right).
- Floor height comes from the world plane if Spectacles world tracking provides one (platform knowledge, verify). Otherwise, the floor is camera Y − 1.45 m (`ARPlacementResolver.swift:136`).
- Lira moves toward the target at `currentFollowSpeed` (§1.6). She doesn't move while inside the 0.45 m arrive radius, and she faces her direction of travel.

### 3.5 Onboarding (GAP-B-SM-05, GAP-B-ONB-01)

**States**: `intro` → `permissions` → `safety` → `done`.

- intro, on Continue → permissions.
- permissions, on completion → safety.
- safety, on "I understand" → done. This persists the flag. This step is silent.
- `done` is terminal. Replay is from Memories per PRS-073, and that path never re-blocks.

**Copy**: Verbatim per PRS-070, including its Location row.

---

## §4 Session lifecycle (GAP-B-LIFE-01..05)

- **BEH-026 Start**: Begin Walk follows T5 → T8. The movement session starts only after the first accepted or fresh-anchor sample, never before (`App/AppTests/RealMovementSessionTests.swift` intent; `App/WaykinApp.swift:983-1013`). The walk clock starts at T8.
- **BEH-027 Elapsed**: The displayed elapsed time is `now − startedAt − Σpauses`, from the Lens clock (`App/WaykinApp.swift:338-354`). Gameplay time is `movementSeconds` (§1.2). The two clocks are never mixed.
- **BEH-028 Pause and resume**: See T11 and T12. Resume always establishes a fresh anchor, so the first post-resume sample adds no distance (`MovementEngine.swift:81-90`, `MovementIntegrity.swift:236-261`).
- **BEH-029 Lens lose-focus or sleep**: The lifecycle events are NC-16. If T069 finds an OS pause event, use it; otherwise the default proxy is: if the update loop doesn't run for > 5000 ms (measured by delta time on the next frame), treat it as an implicit pause (T11) on return. Both paths show ERR-LIFE-02. The user must press resume (`App/WaykinApp.swift:1199-1221` parity: suspend, then resume only if auto-suspended; the Lens requires an explicit resume).
- **BEH-030 Close or crash recovery (D-108)**: During walk and demo states, write the checkpoint (§6) every 30 s and on every transition. On next boot, follow T3, T20, and T21. Recovery copy:
  - Title: "Your last walk ended unexpectedly."
  - Buttons: "Show summary" / "Discard".
- **BEH-031 Time limits (D-107)**:
  - At elapsed 15:00, show HUD line 2 for 4000 ms: "Fifteen minutes with Lira. End whenever you're ready."
  - At 20:00, show "Twenty minutes. Lira is happy to head home."
  - At 30:00, auto-end (T16) with copy "Lira walked you home." No auto-end happens while paused.
- **BEH-032 Power and thermal (D-116, NC-11, PRS-093)**:
  - If the rolling 10 s mean frame delta exceeds 20 ms, enter the degrade state. The effect follows PRS-093: loop clips off (static pose), hunter echo hidden, HUD lazy-follow frozen, audio kept. All core logic continues.
  - Exit the degrade state after 30 s with a mean frame delta under 17 ms.
  - If the degrade state persists for 180 s continuously, end the walk (T16, `reason = power`) with ERR-PERF-01 copy.
- **BEH-033 Battery (NC-10)**: There is no battery API in the provided excerpts. The 30-minute hard end is the safe default.

---

## §5 Location (GAP-B-GPS-01..06)

**BEH-034 Adapter loop** (SNAP DOC location; FR-006). The pseudo-code shows the polling, timestamp dedupe, and position-to-sample mapping.

```text
on walkActive or acquiringFix: every 1000 ms:
  locationService.getCurrentPosition(ok, err)
ok(p):
  lastCallbackAt = now; errStreak = 0
  if p.timestamp.ms == lastTimestampMs: return            # D-102 dedupe; no core call
  lastTimestampMs = p.timestamp.ms
  sample = { timestamp: p.timestamp.s, lat: p.latitude, lon: p.longitude,
             altitude: p.altitude != 0 ? p.altitude : null,
             horizontalAccuracy: p.horizontalAccuracy,
             reportedSpeed: NaN }                          # D-101: no speed field
  result = core.ingest(sample, receivedAt = now)
err(e): errStreak += 1; if errStreak >= 3: signal = degraded
watchdog each frame:
  if now - lastAcceptedAt > 15 s: signal = degraded (show ERR-GPS-03 in HUD line 2)
  if now - lastCallbackAt > 120 s: emit locationLost (T15)
```

**BEH-035 Integrity** (port `MovementIntegrity.swift:135-234` exactly). The processor applies these checks in order:

1. `rejectedInvalid` for a non-finite or out-of-range latitude, longitude, or accuracy.
2. `rejectedNegativeAccuracy` for accuracy < 0.
3. `rejectedAccuracy` for accuracy > 30.
4. `rejectedStale` for age > 15 s.
5. `rejectedInvalid` for future skew > 2 s.
6. With no anchor: establish an anchor (`awaitingFreshAnchor`).
7. Interval checks: interval = 0 → `rejectedDuplicate`; interval < 0 → `rejectedOutOfOrder`; interval > 15 s → re-anchor.
8. Distance checks: distance > 60 m, or distance divided by interval > 4.5 m/s → `rejectedImplausibleDisplacement`.
9. Speed: use the reported speed only if it is finite and in [0, 4.5]. Otherwise, use distance divided by interval. Because of D-101, the Lens always takes the distance-over-interval path.
10. Smooth speed with a 3-sample mean, then apply hysteresis: start moving at ≥ 0.55 m/s and stop at ≤ 0.25 m/s.
11. Add distance only while moving and only when distance ≥ 1.5 m.

**BEH-036 Distance function (D-100)**: Use haversine with R = 6 371 008.8 m. Movement vectors assert distances within ±0.05 m and dispositions exactly. RNG and event vectors stay bit-exact.

**BEH-037 Downstream**: Only `accepted` snapshots advance the experience (`App/WaykinApp.swift:1295-1331`).

- A rejected sample (except `awaitingFreshAnchor`) calls `path.recordRejected()`.
- A rejected sample may emit only AR-presentation or path cues, and passes event = nil (`App/WaykinApp.swift:1296-1320`).

**BEH-038 Accuracy reality (NC-12)**: If device `horizontalAccuracy` routinely exceeds 30 m, every sample is rejected and the walk shows degraded. The gate stays at 30 m. Do not loosen it without device receipts (`docs/MOVEMENT_INTEGRITY_CONTRACT.md:28`).

**BEH-039 Indoor or no fix**: ERR-GPS-02 after 30 s, with the Demo offer. Heading is never used (`research.md` R4).

**BEH-040 Privacy**: Coordinates never leave the adapter or the movement engine. Storage and receipts contain no coordinates (FR-017).

---

## §6 Persistence (GAP-B-PERSIST-01..05)

- **BEH-041 API**: Use `global.persistentStorageSystem.store` (SNAP DOC persistent-storage). The schema uses one string key per document, through `putString`/`getString` on GeneralDataStore (platform knowledge, verify).

| Key | Content |
|---|---|
| `waykin.profile.v1` | Profile JSON |
| `waykin.checkpoint.v1` | Checkpoint JSON, present only during or after an interrupted walk |
| `waykin.receipt.last.v1` | Last field receipt JSON |

**Profile v1**

```json
{"schemaVersion":1,"companionId":"6C697261-0001-4000-8000-000000000001",
 "bondLevel":12,"onboardingDone":false,"reduceMotion":false,
 "memories":[{"id":"<uuid>","endedAt":"<ISO8601>","mode":"walk|demo",
   "activeTime":0,"distanceMeters":0,"eventKinds":["quietInterval"],
   "bondDelta":1,"endedReason":"userStop","text":"..."}],
 "totals":{"walks":0,"demos":0}}
```

- The companion ID comes from `PersistenceStore.swift:39`.
- `memories` holds at most 5 entries, newest first.

**Checkpoint v1**

```json
{"schemaVersion":1,"mode":"walk|demo","startedAt":"<ISO>","pausedSeconds":0,
 "movementSeconds":0,"distanceMeters":0,"accumulatedBondProgress":0,
 "eventKinds":[],"pathRelation":"establishing","writtenAt":"<ISO>"}
```

- **BEH-042 Atomicity**: Write the new value first, then read it back and compare. If the comparison fails, keep the previous in-memory profile and log ERR-PERSIST-02. Bond is written exactly once per finalized session. The finalize step is guarded by the checkpoint's `startedAt`, which serves as the idempotency key (`ARCHITECTURE.md:73` parity).
- **BEH-043 Migration**:
  - Missing key → defaults (Bond 12).
  - `schemaVersion` < 1 or missing → treat as corrupt.
  - `schemaVersion` > 1 → read-only. Don't write, show ERR-PERSIST-03, and keep play possible in memory only.
  - Future versions MUST add a `vN → vN+1` function and a vector test.
- **BEH-044 Corruption**: If JSON parsing or validation fails, copy the raw string to `waykin.profile.corrupt.v1` (overwriting any earlier copy) and start fresh with defaults. Show ERR-PERSIST-01. Never silently discard (`docs/design/PERSISTENCE_RECOVERY.md:12-15` parity).
- **BEH-045 Size**: Cap the profile at 8 KB serialized. Memory text is ≤ 280 characters, so 5 memories stay under about 3 KB. Capacity is NC-13. On `onStoreFull` (SNAP DOC persistent-storage): (1) delete `waykin.receipt.last.v1` and retry; (2) drop the oldest memory and retry; (3) show ERR-PERSIST-04. Never call `clear()`.
- **BEH-046 Expiry**: Snapchat clears Lens storage after 60 days without use (SNAP DOC persistent-storage). After a clear, the profile resets to defaults with no error copy, because this is expected behavior.

---

## §7 Error catalog (GAP-B-ERR-01)

| ID | Detection | User-visible copy (verbatim) | Recovery |
|---|---|---|---|
| ERR-GPS-01 | Error callback indicating permission denied, or a location module failure at start | "Location access is required for a real walk. Demo Walk is still available." (`App/WaykinApp.swift:958`) | Return to home with the Demo button focused. |
| ERR-GPS-02 | No fix for 30 s | "Searching GPS" while waiting (`App/SessionMapPresentation.swift:84`); on timeout: "No GPS fix yet. Try outside, or start Demo Walk." | Buttons on ErrorPanel: "Try again" (T5) or "Demo Walk" (T10). |
| ERR-GPS-03 | Degraded per §5 | "GPS weak" — "GPS signal is weak; distance may update slowly." (`App/SessionMapPresentation.swift:95-97`). Shown in HUD line 2. | Clears automatically on the next accepted sample. |
| ERR-GPS-04 | locationLost (T15) | "Location became unavailable. The walk was stopped safely." (`App/WaykinApp.swift:1414`) | Show the summary with `reason = locationLost`. |
| ERR-NET-01 | Internet loss (platform signal NC-17); manifests as GPS-03 or GPS-04 | No extra copy; the GPS rows cover it. | — |
| ERR-TRK-01 | Tracking `limited` | "Looking for the ground" (`App/AR/ARContinuityHint.swift:16`) | Restores automatically (§3.4). |
| ERR-PERF-01 | Power end (BEH-032) | "Spectacles needed to cool down. Your walk is saved." | Summary. |
| ERR-LIFE-02 | Implicit pause after a gap (OS event if T069 finds one; otherwise > 5 s frame-gap proxy) | "Walk paused while the Lens was away." | Resume button. |
| ERR-PERSIST-01 | Corrupt profile | "Saved progress couldn't be read. Starting fresh." | Defaults; the raw copy is preserved. |
| ERR-PERSIST-02 | Write verify failed | "This walk couldn't be saved." | Show the summary; Bond is kept in memory for this run. |
| ERR-PERSIST-03 | Newer schema | "Saved data is from a newer version. Progress won't save." | Memory-only play. |
| ERR-PERSIST-04 | Store full after retry | "Storage is full. This walk couldn't be saved." | Same as ERR-PERSIST-02. |
| ERR-AUDIO-01 | Missing or invalid audio asset | No copy; silence. | Logged once per basename. |

- **BEH-047**: No error copy may contain raw error strings or coordinates (`App/SessionMapPresentation.swift:67-69` parity).

---

## §8 End-of-walk summary (GAP-B-SUMMARY-01)

**BEH-048 Computation at T18**. Each field is frozen and immutable after this step.

| Field | Rule | Source |
|---|---|---|
| Time | Elapsed per BEH-027, formatted `%d:%02d` | `App/CompanionPresenceView.swift:119-122` |
| Distance | `"{Int(distance)} m"`. Demo distance is 392 m. | `CompanionPresenceView.swift:124` |
| Events | Count of `eventHistory` (cap 32), shown in the P metric layout | P metric layout |
| Bond change | §2.3 | — |
| Bond headline | PRS-058 (iOS `3017-3022`) | PRS-058 |
| Closing phrase | fading → "The presence faded."; noticed, approaching, or close → "Lira stayed with you."; inactive with no last event → "Lira stayed with you."; inactive with a last event → "The path remembers." | `CompanionPresenceView.swift:71-77` |
| Path line | onPath: "Path held steady · {m} m along the path"; strained: "Path felt strained · …"; offPath: "Path slipped · …"; recovered: "Path found again · …"; establishing: "Path establishing" (meters omitted when 0) | `WalkPathCopy.swift:7-22` |
| Memory | §2.4 | — |
| End-reason line | userStop and demoComplete: none; timeLimit: "Lira walked you home."; power: ERR-PERF-01 copy; locationLost: ERR-GPS-04 copy; interrupted: "Your last walk ended unexpectedly." | D-109 |

- **BEH-049**: The summary has one button: "Done" → T19. The Demo summary also shows "Demo Walk — not saved to your walks count." Demo still adds Bond per BEH-007. `totals.demos` increments, and `totals.walks` does not.
- **BEH-050**: The field receipt contains: schema 1, mode, end reason, durations, distance, accepted and rejected counts, disposition counts, event-kind counts, cue counts, path relation, Bond before and after, FPS degrade count, and replant count. It contains no coordinates. The timeline is capped at 200 entries. The receipt is stored at `waykin.receipt.last.v1` (FR-017).

---

## Appendix A: Gaps closed

| Gap ID | Gap | Resolution | Citation |
|---|---|---|---|
| GAP-B-CONST-01 | RNG and rule constants unenumerated | Source port | `WorldEventGenerator.swift:65-109` |
| GAP-B-CONST-02 | World-state formulas | Source port | `Experiences.swift:77-204` |
| GAP-B-CONST-03 | Integrity thresholds | Source port | `MovementIntegrity.swift:17-26` |
| GAP-B-CONST-04 | Path relation constants | Source port | `PathProgressEngine.swift:109-164` |
| GAP-B-CONST-05 | Audio cooldowns and gain | Source port | `AudioExperienceLayer.swift:17-32`; `AppAudioCuePlayer.swift:352` |
| GAP-B-CONST-06 | Lira distances and follow constants | Source plus D-202/D-203, D-206 | `CompanionPresentationMatrix.swift:17-40`; `ARWorldCommandRenderer.swift:414-432` |
| GAP-B-CONST-07 | Session, location, and persistence numbers | Source plus D-104, D-107..D-113, D-116 | SNAP DOC location; `WaykinApp.swift:1097` |
| GAP-B-EVT-01 | Event catalog with copy | Source port | `Experiences.swift:236-263` |
| GAP-B-EVT-02 | Pursuit table | Source; corrects `data-model.md` | `Experiences.swift:206-234`; `Models.swift:143-145` |
| GAP-B-EVT-03 | Bond rules | Source plus D-109, D-118 | `WaykinApp.swift:1097`; `Experiences.swift:183` |
| GAP-B-EVT-04 | Memory text and retention | Source plus D-113 | `Experiences.swift:265-289`; `WalkPathCopy.swift:39-64` |
| GAP-B-DEMO-01 | Demo arc, timing, outcome | Source plus D-104 | `DemoSessionController.swift:6-14,40` |
| GAP-B-AUDIO-01 | Cue catalog, priority chain, planner | Source plus D-115, D-124 | `AppAudioCuePlayer.swift:35-97`; `WaykinApp.swift:1346-1376` |
| GAP-B-SM-01 | Session state machine | Decision, composed from source | `WaykinApp.swift:919-1197` |
| GAP-B-SM-02 | Lira state machine | Source plus D-106 | `CompanionPresentationState.swift:39-119` |
| GAP-B-SM-03 | Pursuit phase names wrong in the data model | Correction | `Models.swift:143-145` |
| GAP-B-SM-04 | Tracking and anchoring | Source plus D-202/D-203, D-206, NC-15 | `ARPlacementResolver.swift:10,136,306-311` |
| GAP-B-SM-05 / GAP-B-ONB-01 | Onboarding flow and copy | Source plus PRS-070, PRS-073 | PRS-070; PRS-073 |
| GAP-B-LIRA-01 | 3–4 behaviors versus 5 states | D-106 | `spec.md` FR-007 |
| GAP-B-LIRA-02 | Behind-walker follow invisible on glasses | Correction, D-202/D-203 | SNAP DOC spatial design |
| GAP-B-LIFE-01 | Start ordering | Source | `WaykinApp.swift:983-1013` |
| GAP-B-LIFE-02 | Pause and resume, fresh anchor | Source | `MovementEngine.swift:70-90` |
| GAP-B-LIFE-03 | Lens close or crash recovery | D-108 | `spec.md` edge cases |
| GAP-B-LIFE-04 | Thermal and power end | D-116, NC-11 | SNAP DOC lens-performance-overlay |
| GAP-B-LIFE-05 | Length prompts and timeout | D-107, NC-10 | `spec.md` edge cases |
| GAP-B-GPS-01 | Poll and dedupe loop | Source plus D-102 | SNAP DOC location |
| GAP-B-GPS-02 | Distance parity impossible bit-exact | Correction, D-100 | `MovementIntegrity.swift:291-294` |
| GAP-B-GPS-03 | No speed field | D-101 | SNAP DOC location (GeoPosition fields) |
| GAP-B-GPS-04 | Accuracy gating on device | NC-12 | `MovementIntegrity.swift:148` |
| GAP-B-GPS-05 | No-fix and lost timeouts | D-110, D-111 | — |
| GAP-B-GPS-06 | Reject-path downstream effects | Source | `WaykinApp.swift:1295-1320` |
| GAP-B-PERSIST-01 | Keys and schema | D-112 | SNAP DOC persistent-storage |
| GAP-B-PERSIST-02 | Atomicity and idempotency | Decision, iOS parity | `ARCHITECTURE.md:73` |
| GAP-B-PERSIST-03 | Migration | Decision | — |
| GAP-B-PERSIST-04 | Corruption | Decision, iOS parity | `docs/design/PERSISTENCE_RECOVERY.md:12-15` |
| GAP-B-PERSIST-05 | Size and full store | NC-13 | SNAP DOC persistent-storage `onStoreFull` |
| GAP-B-ERR-01 | Error catalog | Source copy plus D-125 | `WaykinApp.swift:958,1414`; `SessionMapPresentation.swift:84-97` |
| GAP-B-SUMMARY-01 | Summary fields and copy | Source plus PRS-058, P metric layout | `CompanionPresenceView.swift:71-124`; `WaykinApp.swift:2878-2883` |

## Appendix B: Decisions and NEEDS CLARIFICATION items

| ID | Title | Recommended default | Alternatives | Why |
|---|---|---|---|---|
| D-100 | Movement distance function | Haversine, R = 6 371 008.8 m; movement vectors ±0.05 m | Vincenty; export Swift distances in vectors | CLLocation's algorithm isn't portable; event parity stays exact. |
| D-101 | Missing GPS speed | `reportedSpeed = NaN`, so distance-over-time fallback | Derive from the platform if a field appears | GeoPosition exposes no speed. |
| D-102 | Duplicate positions | Drop same-timestamp positions in the adapter | Feed to core (`rejectedDuplicate`) | Avoids false reject streaks that push the path to `strained`. |
| D-103 | Real-walk tick cadence | One core update per accepted sample | Fixed timer | iOS parity (`WaykinApp.swift:1254-1331`). |
| D-104 | Demo pacing | 5000 ms per tick, 7 ticks, auto-end at +5 s | Manual "next" button | Short and Preview-friendly. |
| D-106 | Lira states | 5 AR strings; celebrate is a 1500 ms one-shot | 4 states, dropping celebrate | Mirrors the matrix vocabulary exactly. |
| D-107 | Walk length | Prompts at 15:00 and 20:00; hard end at 30:00 | No hard end | Battery and thermal headroom are unknown (NC-10). |
| D-108 | Crash recovery | 30 s checkpoint; offer within 24 h | No recovery | Spec edge case; FR-013 durability. |
| D-109 | Early-end outcome | Save memory and summary; +1 Bond if active ≥ 60 s | iOS fail (no memory) | Safety ends shouldn't feel like failure (`docs/legal/SAFETY.md` intent). |
| D-110 | No-fix timeout | 30 s, then offer Demo | 60 s | Fast fallback indoors. |
| D-111 | Signal thresholds | Degraded after 15 s or 3 errors; end after 120 s | Fail immediately | Tolerates brief internet or GPS loss. |
| D-112 | Storage layout | Versioned JSON string keys, v1 | Many scalar keys | Atomic, migratable. |
| D-113 | Memory length | 280 characters | Unbounded | Bounds storage. |
| D-115 | Audio playback mode | LowPower for all cues | LowLatency for pursuit cues | Cues are ambient; saves power. |
| D-116 | Degrade trigger | Frame delta > 20 ms over 10 s; end after 180 s | Power HUD value | No in-Lens power API in the excerpts. |
| D-118 | Bond bounds | Start 12, no cap, never decreases | Cap 99 | iOS parity. |
| D-122 | Time context | Always midday | Clock-based variants | Keeps vectors simple; variants aren't in the MVP. |
| D-123 | Discovery and threat entities | Not rendered | Placeholder spheres | FR-009 forbids pursuer visuals. |
| D-124 | Launch and reveal cues | Excluded on the Lens | Include | Keeps launch silent and short. |
| D-125 | Lens-specific copy | Strings in §7 | iOS text verbatim | The iOS text references AR and the camera; Health is not present on the Lens. |
| NC-10 | Consumer Specs battery life | Hard end at 30:00 | — | Measure: run the 15-minute protocol and log battery % at start and end (`quickstart.md`). |
| NC-11 | Thermal or power API in a Lens | FPS proxy (D-116) | — | Measure: compare the overlay CPU/GPU % with the proxy trips on device. |
| NC-12 | On-device horizontalAccuracy distribution | 30 m gate unchanged | — | Measure: log accuracy buckets in the receipt over 3 walks. |
| NC-13 | Persistent storage capacity | 8 KB profile cap | — | Measure: fill the store in a test Lens until `onStoreFull` fires. |
| NC-14 | `BigInt` in the Lens runtime | Resolved (NC-04): Lens TS targets es2019, so there is no BigInt; use 2×uint32 only | https://developers.snap.com/lens-studio/features/scripting/custom-typescript-config | — |
| NC-15 | Tracking-state API | Pose-finite and jump proxy | — | Check the Spectacles DeviceTracking API; test indoors by covering the cameras. |
| NC-16 | Lens sleep and focus events | Use the OS event if T069 finds one; otherwise > 5 s frame gap means implicit pause | — | Measure: put the device to sleep mid-walk and log frame deltas. |
| NC-17 | Internet-loss signal | Covered by GPS degraded and lost | — | Measure: toggle phone connectivity during a walk. |

**NEW**: none. All IDs fall within the reserved ranges D-100..D-199 and NC-10..NC-29. D-114, D-117, D-119 are intentionally unused, and NC-10..NC-17 are used.