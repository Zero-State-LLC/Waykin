# Feature specification: Lira Walks With You (Snap Spectacles)

**Feature branch**: `001-spectacles-lira-walk`
**Created**: 2026-10-11
**Status**: Draft
**Input**: Danny's approved decisions and ADR-0004. Retarget Waykin at Snap Spectacles with a standalone Lens MVP: a walk of about 15 minutes, Lira as an AR companion, seeded events, audio cues, pursuit through audio and Lira only, an end-of-walk summary, and local Bond and memories.

**Governance**: `WAYKIN_SPEC.md` and `docs/SOLO_MVP_SCOPE.md` serve as the constitution, as amended by `docs/decisions/ADR-0004-snap-spectacles-target.md`.

## User scenarios and testing

### User story 1: Demo Walk with Lira (priority: P1)

You open the Lens and choose Demo Walk. Lira appears beside you, and a deterministic arc of world events plays with semantic audio. No GPS is used.

**Why this priority**: It proves the TypeScript core, Lira presentation, and audio in Lens Studio Preview and indoors, with no device or location dependency. All other stories build on it.

**Independent test**: Run Demo Walk in Lens Studio Preview. The event sequence must match the Demo vector that Swift exported.

**Acceptance scenarios**:

1. **Given** the Lens is open, **when** you choose Demo Walk, **then** Lira appears at a relative distance beside you within the field of view.
2. **Given** a Demo Walk is running, **when** the scripted arc advances, **then** each event plays its semantic audio cue and a small visual effect, in the same order as the Swift Demo vector.
3. **Given** a Demo Walk is running, **when** you choose Stop, **then** the session ends and the summary appears.

---

### User story 2: Begin Walk outdoors with Lira following (priority: P2)

You choose Begin Walk. Lira follows or leads based on your real walking speed. The seeded event generator fires sparse world events.

**Why this priority**: This is the core product promise on glasses. It depends on device, location, and outdoor validation.

**Independent test**: Replay a recorded or synthetic movement-sample vector through the location adapter seam in Node and in Preview. The events must match the Swift vector. On a device, follow the 15-minute walk protocol in `quickstart.md`.

**Acceptance scenarios**:

1. **Given** location permission is granted and a location fix is available, **when** you choose Begin Walk, **then** the Lens samples location at Navigation accuracy and feeds movement samples that pass the integrity filter to the movement engine.
2. **Given** you are walking, **when** your speed changes, **then** Lira's behavior and relative distance change according to the companion matrix.
3. **Given** a walk session with seed S, **when** the same world states occur, **then** the Lens emits the same events as Swift `WaykinCore` with seed S.
4. **Given** location is denied or unavailable, **when** you choose Begin Walk, **then** the Lens explains why and offers Demo Walk.

### User story 3: Bounded pursuit through audio and Lira (priority: P3)

During a walk, pursuit pressure rises and fades. You perceive it only through audio cues and Lira's behavior. No pursuer is rendered.

**Why this priority**: Pursuit is part of the approved system set, but the walk is still complete without it.

**Independent test**: Use vectors that cover the `pursuitBegins`, `pursuitIntensifies`, and `pursuitFades` events. Check that each event maps to an audio cue and a Lira behavior, and to no pursuer visual.

**Acceptance scenarios**:

1. **Given** pressure reaches a pursuit rule's thresholds, **when** the generator selects `pursuitBegins`, **then** the Lens plays the pursuit cue and Lira shifts behavior, and it renders no enemy entity.
2. **Given** pursuit is active, **when** you pause or stop, **then** pursuit pressure is suppressed and safety feedback takes precedence.

---

### User story 4: Summary, Bond, and memories (priority: P4)

When you end a walk, a summary card shows the time, distance, events, and Bond change. Bond and the last five memories persist across Lens launches.

**Why this priority**: It completes the return loop ("go out again tomorrow"). It depends on stories 1 and 2.

**Independent test**: Complete a Demo Walk, close the Lens, and reopen it. Bond and memories persist. The Bond change matches the Swift Bond vectors.

**Acceptance scenarios**:

1. **Given** a walk ends, **when** the summary appears, **then** it shows active time, distance, event count, and Bond change.
2. **Given** six or more walks have completed, **when** you view memories, **then** the Lens shows only the five most recent.
3. **Given** you reopen the Lens, **when** Home loads, **then** the Bond level matches its value at the end of the prior session.

### Edge cases

- **No paired phone, no internet, or location denied:** Begin Walk is unavailable. The Lens offers Demo Walk.
- **GPS jitter or position jumps at about 1 Hz:** The integrity filter rejects the samples. Rejected samples don't advance distance.
- **Heading uncalibrated after an OS update:** Lira stays positioned relative to you and doesn't depend on heading.
- **You stand still for a long time:** Rules that require `moving` or `paused` gate events. No pursuit escalation occurs from standing still.
- **Power budget exceeds 100%, or thermal standby is imminent:** The walk must end safely and save a partial summary. The detection signal is [NEEDS CLARIFICATION: which Lens API exposes thermal or power state].
- **The Lens closes mid-walk:** Partial-session persistence behavior is [NEEDS CLARIFICATION].
- **Seed 0:** It maps to `0x9E3779B97F4A7C15`, as in Swift.
- **The walk passes 15 minutes:** The walk continues. The Lens shows a non-blocking suggestion to end the walk. The threshold value is [NEEDS CLARIFICATION].

## Requirements

### Functional requirements

- **FR-001**: The Lens MUST offer Begin Walk and Demo Walk from a short spatial intro.
- **FR-002**: `packages/waykin-core-ts` MUST port the RNG, event generator, world state, movement engine, movement integrity, companion runtime and matrix, pursuit, audio layer semantics, Bond, and memory rules from Swift `WaykinCore`.
- **FR-003**: The TypeScript core MUST NOT import Lens Studio APIs, scene objects, storage APIs, or audio filenames.
- **FR-004**: The TypeScript core MUST reproduce Swift RNG outputs and emitted events bit-exactly for every vector in `Tests/Vectors/`.
- **FR-005**: Swift MUST generate the vectors. TypeScript MUST consume them read-only.
- **FR-006**: The location adapter MUST use `GeoLocation.createLocationService()` with `GeoLocationAccuracy.Navigation` and poll `getCurrentPosition` at about 1 s.
- **FR-007**: Lira MUST render as a single world-locked character, positioned relative to you, with 3 to 4 behaviors.
- **FR-008**: Each emitted event MUST map to one of the seven semantic audio cue kinds and MAY add a small visual effect.
- **FR-009**: The Lens MUST express pursuit only through audio and Lira behavior. It MUST NOT render any pursuer.
- **FR-010**: Pause and Stop MUST be reachable at all times and MUST override pursuit pressure.
- **FR-011**: AR content MUST stay peripheral and glanceable while you walk. The Lens MUST NOT show a full-screen panel during an active walk.
- **FR-012**: The Lens MUST show a summary card at the end of each walk with active time, distance, event count, and Bond change.
- **FR-013**: The Lens MUST persist Bond and the last five memories in Lens persistent storage, on the device only.
- **FR-014**: The Lens MUST request only publishable permissions: RawLocation under Transparent Permission. It MUST NOT use Experimental APIs.
- **FR-015**: The Lens MUST NOT use HealthKit, Mobile Kit, Snap Cloud, Sync Kit, camera or ML, the map, or the network beyond what location requires.
- **FR-016**: Demo Walk MUST be deterministic and runnable in Lens Studio Preview.
- **FR-017**: The Lens MUST support a privacy-filtered local field receipt. The receipt contains no coordinates and no route history.
- **FR-018**: The Lens MUST degrade to audio-forward presence when the power budget forces reduced rendering. The trigger is [NEEDS CLARIFICATION].

### Key entities

- **WorldState:** Energy, pressure, familiarity, Bond level, movement state, and active time.
- **WorldEventRule / generator configuration:** Eligibility thresholds, weight, and cooldown. Also the global minimum tick spacing.
- **SeededRandomNumberGenerator:** A SplitMix64 UInt64 stream.
- **Lira state:** Current behavior and relative distance.
- **Pursuit state:** Bounded pressure and phase.
- **Bond:** The single persistent progression level.
- **SessionMemory:** A concise record of a past walk.
- **WalkSummary:** The end-of-walk card data.

See `data-model.md`.

## Success criteria

### Measurable outcomes

- **SC-001**: 100% of Swift-exported vectors pass in the TypeScript parity job. RNG outputs and event sequences match exactly.
- **SC-002**: The Lens sustains 60 FPS during a 15-minute outdoor walk, as shown in the Lens Performance Overlay.
- **SC-003**: CPU and GPU power stay below 100% of the Lens power budget for the full walk. Any tighter numeric margin is [NEEDS CLARIFICATION].
- **SC-004**: A 15-minute outdoor walk completes without throttling-induced shutdown, thermal standby, or shutdown, as documented by a device receipt. Battery headroom on consumer Specs is [NEEDS CLARIFICATION: consumer Specs battery life is undocumented].
- **SC-005**: The Lens uses only publishable permissions and passes the Lens Studio publishing checklist with no Experimental APIs.
- **SC-006**: Bond and the last five memories survive 3 consecutive Lens relaunches unchanged.
- **SC-007**: Stop is reachable from any walk state in one interaction.

### Clarifications needed

- [NEEDS CLARIFICATION: battery life of consumer Specs (not documented by Snap; `NOT_COMPUTABLE`).]
- [NEEDS CLARIFICATION: current Spectacles Developer Program pricing and terms (previously $99/mo with a 12-month commitment).]
- [NEEDS CLARIFICATION: publishability of Mobile Kit combined with location or sensitive data. Not used in the MVP, but it gates any phase-2 sync.]
- [NEEDS CLARIFICATION: iOS reference scope. The iOS app is the reference implementation, but the docs don't state whether it also stays the primary shipped product, or whether Spectacles-only tuning may diverge from iOS defaults.]

## Workflows

- **Governing skills**: `anti-slop-code`, `production-systems`, `google-developer-style`.
- **Owners**: FORGE decomposes the work, a cloud agent implements it, and SCRIBE files the artifacts.
- **CI**: Reuse `.github/workflows/ci.yml`. Add a TypeScript parity job there instead of creating a new CI path.
- **Repo skills**: `/waykin-validate`, `/waykin-pr-review`.

## Implementation-depth companion docs

- [gap-audit.md](gap-audit.md) lists 185 gaps; each one is closed by a source citation, a Snap doc, a proposed DECISION, or an NC with a safe default.
- [decisions.md](decisions.md) is the decisions log for Danny (D-/NC- entries). § Conflicts is binding.
- [behavior-spec.md](behavior-spec.md) covers constants, event tables, state machines, lifecycle, GPS, persistence, errors, and summary (BEH-).
- [presentation-spec.md](presentation-spec.md) covers Lira placement and animation, audio, UI and copy, onboarding, a11y, performance, and the asset pipeline (PRS-).
- [lens-studio-build.md](lens-studio-build.md) is the executable checklist for the Lens Studio MCP agent (LSB-).
- [traceability.md](traceability.md) maps each feature to its requirement, task, and test.