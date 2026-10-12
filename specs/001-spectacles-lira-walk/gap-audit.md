# Gap audit: Lira Walks With You (Spectacles)

## Method

1. I read the full concept source: `WAYKIN_SPEC.md`, `docs/**`, ADR-0004, `Sources/WaykinCore/**` with its tests, and `App/**`. I also read every file in `specs/001-spectacles-lira-walk/`.
2. For each subsystem, I listed every point where a Lens implementer would otherwise have to invent behavior.
3. I resolved each gap in priority order:
   - **SOURCE**: iOS code or docs, cited as `path:line`.
   - **SNAP**: a doc URL from the provided excerpts.
   - **DECISION**: a proposed default, logged as `D-NNN` in `decisions.md`.
   - **NC**: needs clarification. The entry gives a safe default and a way to measure it (`NC-NN`).
4. Every gap is closed. NC rows are closed with a default and are also listed separately below.

Citation rules:

- `(PK, verify)` marks platform knowledge that the Snap excerpts don't contain.
- Line numbers refer to the repository corpus as provided.

### Corrections to existing spec docs (flagged, not silent)

| # | Doc | Correction | Reason |
|---|---|---|---|
| C1 | `data-model.md` "Pursuit state" | Phase enum is `inactive, noticed, approaching, close, fading`, not `inactive→active→intensified→fading`. | `Sources/WaykinCore/Domain/Models.swift:143-145`; transitions `Experiences.swift:206-219` |
| C2 | `data-model.md` "Lira state" | Lens uses the 5 presentation states `idle, follow, investigate, alert, celebrate`, rendered with 6 clips: `Lira_Idle`, `Lira_Follow`, `Lira_Investigate`, `Lira_Alert`, `Lira_Celebrate`, `Lira_Spawn`. | `App/AR/Companion/CompanionPresentationState.swift:4-10`; D-302 |
| C3 | iOS follow target (behind and right of the walker) | The Lens places Lira per D-202/D-203: forward distance = band table, lateral +0.6 m on Lira's current side (default right). | The 2024 FOV is a 3:4 forward window; behind-walker placement is never visible. SNAP spatial-design. |
| C4 | `contracts/core-parity.md` | Swift creates a **new** `WorldEventGenerator(seed:)` on every update. The RNG restarts each tick, and history passes in through external maps. TS must mirror this **at the Experience/runtime layer**. The `WorldEventGenerator` module itself is stateful across `evaluate` calls, and generator-level vectors (PR #17) correctly test it that way. | `Sources/WaykinCore/Experiences/Experiences.swift:118-126` |

### Counts

| Area | Gaps | SOURCE | SNAP | DECISION | NC |
|---|---|---|---|---|---|
| CONST | 19 | 17 | 1 | 1 | 0 |
| EVT | 15 | 13 | 0 | 2 | 0 |
| SM | 9 | 6 | 0 | 3 | 0 |
| LIRA | 16 | 6 | 0 | 9 | 1 |
| AUDIO | 11 | 6 | 1 | 4 | 0 |
| UI | 18 | 8 | 1 | 9 | 0 |
| ONB | 7 | 1 | 1 | 5 | 0 |
| PERSIST | 9 | 3 | 1 | 4 | 1 |
| LIFE | 10 | 3 | 0 | 5 | 2 |
| GPS | 9 | 3 | 3 | 2 | 1 |
| ERR | 6 | 3 | 0 | 3 | 0 |
| A11Y | 5 | 2 | 0 | 3 | 0 |
| PERF | 8 | 0 | 5 | 2 | 1 |
| ASSET | 8 | 2 | 2 | 3 | 1 |
| SCENE | 7 | 0 | 2 | 4 | 1 |
| DEMO | 6 | 3 | 0 | 3 | 0 |
| SUMMARY | 8 | 5 | 0 | 3 | 0 |
| TEST | 6 | 1 | 1 | 4 | 0 |
| PUB | 8 | 0 | 6 | 2 | 0 |
| **Total** | **185** | **82** | **24** | **71** | **8** |

Notes on the counts:

- DECISION rows reference 60 distinct decisions (D-001..D-060). Some decisions close several gaps.
- The NC column counts 8 gap rows. Those rows reference NC-01..NC-04, NC-06, NC-07, and NC-08. NC-09 (Meshy rights) is cited in the ASSET table as a constraint but isn't the primary resolution of any row. NC-05 isn't the primary resolution of any row.
- Each spec.md open clarification (pricing, iOS reference scope, Mobile Kit) is carried unchanged under its own question.

### NC rows (closed with default)

| Gap | NC | Default |
|---|---|---|
| LIRA-05 | NC-06 | Hit test if available, else head y − 1.45 m |
| PERSIST-09 | NC-08 | Storage may be cleared; recover with Bond 12 |
| LIFE-06 | NC-02 | No thermal API; D-116 frame-delta watchdog |
| LIFE-07 | NC-03 | 15 min target; battery 15% soft stop if exposed |
| GPS-06 | NC-01 | Keep the 30 m accuracy gate |
| PERF-04 | NC-07 | 15k tris / 25 bones |
| ASSET-08 | NC-04 | 2×uint32 fallback until the spike passes |
| SCENE-07 | NC-05 | Resolved: Lens Studio 5.15.4, SIK 0.17.2, UI Kit 0.1.4 |

---

## CONST — numeric constants

| ID | Gap | Res | Resolved value | Citation | Closed in |
|---|---|---|---|---|---|
| GAP-CONST-01 | RNG algorithm and constants | SOURCE | SplitMix64; seed 0 → 0x9E3779B97F4A7C15; mults BF58476D1CE4E5B9, 94D049BB133111EB; shifts 30/27/31 | `Sources/WaykinCore/Engines/WorldEventGenerator.swift:95-109` | behavior-spec §Core |
| GAP-CONST-02 | Global event spacing | SOURCE | `minimumTickSpacing = 40` s of movementSeconds | `WorldEventGenerator.swift:65` | behavior-spec §Events |
| GAP-CONST-03 | Rule thresholds, weights, cooldowns | SOURCE | 10-row table verbatim (quiet w3 cd28 maxP .25 … bond w3 cd60 minBond 8) | `WorldEventGenerator.swift:81-92` | behavior-spec §Events |
| GAP-CONST-04 | Session event seed | SOURCE | `eventSeed = 42` for every walk (parity; vectors authoritative) | `Sources/WaykinCore/Experiences/ExperienceProtocol.swift:23`; `App/WaykinApp.swift:1001-1005` | behavior-spec §Core |
| GAP-CONST-05 | Generator lifetime | SOURCE | A new generator is built with the seed on every update. History passes through `lastEventElapsed`/`lastEventElapsedByKind`. | `Experiences.swift:118-126` | behavior-spec §Core; core-parity |
| GAP-CONST-06 | Seconds credited per tick | SOURCE | moving: `max(1, delta/max(speed,0.5))`; else 1 (not added to movementSeconds) | `Experiences.swift:77-81` | behavior-spec §Core |
| GAP-CONST-07 | Bond progress accrual | SOURCE | `+= min(0.4, tick/90)` while moving | `Experiences.swift:80` | behavior-spec §Bond |
| GAP-CONST-08 | Pressure update | SOURCE | `clamp01(prev + min(.45, t/1800) + (moving ? -.08 : +.16) + (speed>1.2 ? -.06 : +.04))` | `Experiences.swift:199-204` | behavior-spec §Core |
| GAP-CONST-09 | Energy | SOURCE | `max(min(1, speed/2.2), activityEnergyHint)`; hint = 0 on Lens (D-003) | `Experiences.swift:87-89` | behavior-spec §Core |
| GAP-CONST-10 | Familiarity | SOURCE | `min(1, distance/1800)` | `Experiences.swift:97` | behavior-spec §Core |
| GAP-CONST-11 | Event intensity | SOURCE | `max(energy, pressure)` | `WorldEventGenerator.swift:169` | behavior-spec §Events |
| GAP-CONST-12 | Movement integrity thresholds | SOURCE | acc ≤30 m; age ≤15 s; skew 2 s; min disp 1.5 m; max 4.5 m/s; max seg 60 m; stop .25; move .55; anchor reset 15 s; window 3 | `Sources/WaykinCore/Location/MovementIntegrity.swift:16-38` | behavior-spec §Movement |
| GAP-CONST-13 | Distance bands | SOURCE | ≤.75 immediate; ≤1.25 near; ≤2.0 medium; else far; invalid → near | `App/AR/CanonicalARWorldCommandMapper.swift:182-192` | presentation-spec §Lira |
| GAP-CONST-14 | Relative distance per behavior | SOURCE | Forward distance = band table (D-202/D-203); lateral +0.6 m on Lira's current side (default right); lead also uses the band distance | `CompanionPresentationMatrix.swift:17-40` → D-202/D-203 | behavior-spec §Lira |
| GAP-CONST-15 | Celebrate duration | SOURCE | 1.5 s, then back to idle | `App/AR/Companion/CompanionPresentationState.swift:39,82-89` | presentation-spec §Lira |
| GAP-CONST-16 | Audio cooldowns | SOURCE | event layer 18 s; behavior 12 s; AR-presentation 12 s; path 14 s | `AudioExperienceLayer.swift:17,19,32`; `PathAudioCoupling.swift:6` | behavior-spec §Audio |
| GAP-CONST-17 | Event history cap | SOURCE | 32 most recent | `Experiences.swift:134-137` | behavior-spec §Events |
| GAP-CONST-18 | Lira canonical height | SOURCE | 0.72 m | `App/AR/Companion/CompanionVisualConfiguration.swift:9` | presentation-spec §Lira |
| GAP-CONST-19 | Location poll rate | SNAP | `getCurrentPosition` every 1.0 s, Navigation accuracy | developers.snap.com/spectacles/about-spectacles-features/apis/location | behavior-spec §GPS |

## EVT — event tables

| ID | Gap | Res | Resolved value | Citation | Closed in |
|---|---|---|---|---|---|
| GAP-EVT-01 | Pursuit transitions | SOURCE | distantPresence: inactive→noticed; begins→approaching; intensifies→close; fades→fading | `Experiences.swift:206-219` | behavior-spec §Pursuit |
| GAP-EVT-02 | Allowed kinds per pursuit state | SOURCE | presence only if inactive; begins only if noticed; intensify/fade only if approaching/close; others always | `Experiences.swift:221-234` | behavior-spec §Pursuit |
| GAP-EVT-03 | Event → Lira tone strings | SOURCE | 10 strings, e.g. "Lira draws near." / night idle "Lira keeps close in the dark." | `Experiences.swift:236-263` | behavior-spec §Events |
| GAP-EVT-04 | Event → audio cue | SOURCE | drawsNear→companionNear L; movesAhead→companionAhead C; presence/begins→distantFootsteps behind; intensifies→pursuitPressure; fades→pursuitRelease; bond→bondMotif; observe/familiar/quiet→quietShift | `AudioExperienceLayer.swift:110-127` | behavior-spec §Audio |
| GAP-EVT-05 | Behavior transition → cue | SOURCE | drawNear→near; lead→ahead; rest/observe→quietShift; celebrate→bondMotif; follow/idle silent; first seed silent | `AudioExperienceLayer.swift:57-75,130-177` | behavior-spec §Audio |
| GAP-EVT-06 | AR presentation string | SOURCE | Overlay order: bond→celebrate; begins/intensifies→alert; quiet→idle; observe/presence/familiar→investigate; then path bias; then behavior | `CompanionPresentationMatrix.swift:43-90` | behavior-spec §Lira |
| GAP-EVT-07 | Memory text rules | SOURCE | 7-branch priority table | `Experiences.swift:265-289` | behavior-spec §Memory |
| GAP-EVT-08 | Path suffix on memory | SOURCE | `"; the path held steady."` etc. Establishing → no suffix. | `Sources/WaykinCore/Path/WalkPathCopy.swift:39-64` | behavior-spec §Memory |
| GAP-EVT-09 | Bond delta, real walk | SOURCE | Exactly +1 | `App/WaykinApp.swift:1097` | behavior-spec §Bond |
| GAP-EVT-10 | Bond delta, demo | SOURCE | `max(1, floor(accumulatedBondProgress))` | `Experiences.swift:183`; `WaykinApp.swift:815-817` | behavior-spec §Bond |
| GAP-EVT-11 | Starting Bond, first run | SOURCE | 12 | `Sources/WaykinCore/Persistence/PersistenceStore.swift:41` | behavior-spec §Bond |
| GAP-EVT-12 | Bond floor/clamp | SOURCE | Non-negative ints | `Domain/Models.swift:463-464` | behavior-spec §Bond |
| GAP-EVT-13 | Time context fed to core | DECISION | Always `"day"`, which becomes `.midday` (parity) | `Experiences.swift:83`; `WaykinApp.swift:170` → D-001 | decisions.md |
| GAP-EVT-14 | Path relation engine | SOURCE | establishing/onPath/strained/offPath/recovered; reject streak 3→strained, 8→offPath; pressure table | `Sources/WaykinCore/Path/PathProgressEngine.swift:109-164` | behavior-spec §Path |
| GAP-EVT-15 | Path→AR bias, discovery/threat visuals | DECISION | Path bias kept (strained→investigate, offPath→alert). Discovery/threat entities are not rendered; a 0.6 s core pulse instead (D-012) that multiplies the PRS-009 state scale and is suppressed when reduceMotion is on. | `CompanionPresentationMatrix.swift:71-78` → D-012 | presentation-spec §Lira |

## SM — state machines

| ID | Gap | Res | Resolved value | Citation | Closed in |
|---|---|---|---|---|---|
| GAP-SM-01 | Walk session states | SOURCE | idle, requestingPermission, active, paused, ending, completed, failed. Lens adds `intro`, `summary`. | `App/WaykinApp.swift:21-29`; data-model.md | behavior-spec §Lifecycle |
| GAP-SM-02 | Pause effects | SOURCE | Stop location, pause audio, reset anchor, speed 0 | `WaykinApp.swift:1025-1042`; `Engines/MovementEngine.swift:71-79` | behavior-spec §Lifecycle |
| GAP-SM-03 | Resume effects | SOURCE | Restart location; first sample = fresh anchor (no distance) | `MovementEngine.swift:81-90`; `MovementIntegrity.swift:160-171` | behavior-spec §Lifecycle |
| GAP-SM-04 | Moving/stationary hysteresis | SOURCE | Enter moving ≥.55, exit ≤.25 stabilized speed | `MovementIntegrity.swift:202-208` | behavior-spec §Movement |
| GAP-SM-05 | Presentation reducer | SOURCE | Unknown → idle; celebrate re-request holds until 1.5 s | `CompanionPresentationState.swift:45-120` | presentation-spec §Lira |
| GAP-SM-06 | Escort mode | DECISION | Follow only; lead deferred | `WaykinApp.swift:182` → D-007 | decisions.md |
| GAP-SM-07 | Lens system pause (OS) during walk | DECISION | Use platform event if T069 finds one; otherwise BEH-029 > 5 s frame-gap proxy. Both lead to implicit pause and ERR-LIFE-02 with no auto-resume. | → BEH-029/T069 | behavior-spec §Lifecycle |
| GAP-SM-08 | Follow closing hysteresis | SOURCE | Close when gap > 3.2 m, settle at ≤ 1.4 m | `App/AR/ARWorldCommandRenderer.swift:423-426,505-506` | presentation-spec §Lira |
| GAP-SM-09 | Demo state machine | DECISION | 7 ticks at 5 s; end at 40 s (ticks at 5, 10, …, 35 s) | → D-104 | behavior-spec §Demo |

## LIRA — behaviors, animation, placement

| ID | Gap | Res | Resolved value | Citation | Closed in |
|---|---|---|---|---|---|
| GAP-LIRA-01 | Behavior set vs FR-007 "3–4" | DECISION | 5 states → 6 clips: `Lira_Idle`, `Lira_Follow`, `Lira_Investigate`, `Lira_Alert`, `Lira_Celebrate`, `Lira_Spawn`. | `CompanionPresentationState.swift:4-10` → D-302 | presentation-spec §Lira |
| GAP-LIRA-02 | Follow speeds | SOURCE | Base 1.35 m/s; max 5.0; overtake 1.35× walker; walker speed EMA α .08, ignore >12 m/s | `ARWorldCommandRenderer.swift:359-367,464-473,414-419` | presentation-spec §Lira |
| GAP-LIRA-03 | Follow target position | DECISION (correction C3) | Forward distance = band table, lateral +0.6 m on Lira's current side (default right), on ground | → D-202/D-203 | presentation-spec §Lira |
| GAP-LIRA-04 | Leash/settle for target | DECISION | Close when target-gap > 1.8 m; settle ≤ 0.45 m | → D-006 | presentation-spec §Lira |
| GAP-LIRA-05 | Ground height | NC | Hit test if available, else head.y − 1.45 m | `App/AR/ARPlacementResolver.swift:136` | presentation-spec §Lira |
| GAP-LIRA-06 | Re-plant rule | SOURCE+DECISION | > 6 m and behind the view → teleport to target (PRS-018, checked every 1 s). Also PRS-021: 8 s outside ±25°. | `ARPlacementResolver.swift:10,306-311` → PRS-018/PRS-021 | presentation-spec §Lira |
| GAP-LIRA-07 | Continuity check rate | SOURCE | Every 1.0 s | `App/AR/CanonicalARSessionView.swift:31` | presentation-spec §Lira |
| GAP-LIRA-08 | Occlusion | DECISION | None (no world mesh) | → D-009 | presentation-spec §Lira |
| GAP-LIRA-09 | Facing | SOURCE | Moving: face travel direction. Settled: face walker (gap > 0.05 m). | `ARWorldCommandRenderer.swift:510-538` | presentation-spec §Lira |
| GAP-LIRA-10 | Walk clip pause | SOURCE | Walk clip plays only while closing distance | `ARWorldCommandRenderer.swift:507-508` | presentation-spec §Lira |
| GAP-LIRA-11 | Spawn appearance | SOURCE | Scale 0.92→1.0 over 0.70 s, cubic ease-out | `App/AR/Companion/LiraARMotion.swift:210-223` | presentation-spec §Lira |
| GAP-LIRA-12 | Hunter echo / status orb | DECISION | Render per PRS-011: one extra draw call, alert state only. Hidden while degraded. FR-009-safe because it is Lira's own silhouette. | PRS-011 | presentation-spec §Lira |
| GAP-LIRA-13 | State colors | SOURCE | idle F7F5F2; follow 3F8F8A; investigate E0B040; alert D17A4A; celebrate D4A45A | `ARWorldCommandRenderer.swift:840-886` | presentation-spec §UI |
| GAP-LIRA-14 | Skins | DECISION | Dawn only | → D-011 | presentation-spec §Lira |
| GAP-LIRA-15 | Spawn location at walk start | DECISION | Forward distance = band table, lateral +0.6 m on Lira's current side (default right), ground | → D-202/D-203 | presentation-spec §Lira |
| GAP-LIRA-16 | Discovery/threat entities | DECISION | Not rendered (FR-009); 0.6 s core pulse per D-012 that multiplies the PRS-009 state scale and is suppressed when reduceMotion is on. | → D-012 | presentation-spec §Lira |

## AUDIO

| ID | Gap | Res | Resolved value | Citation | Closed in |
|---|---|---|---|---|---|
| GAP-AUDIO-01 | Cue → file → volume | SOURCE | near .40, ahead .40, distant .36, pressure .45, release .36, bond .42, quiet .30, spawn .48, bondMilestone .46 | `App/AppAudioCuePlayer.swift:35-48` | presentation-spec §Audio |
| GAP-AUDIO-02 | Planner | SOURCE | One active cue per channel; duplicate ignored; lower priority ignored; ignored while paused | `AppAudioCuePlayer.swift:77-97` | behavior-spec §Audio |
| GAP-AUDIO-03 | Gain formula | SOURCE | `volume × max(.25, intensity)` | `AppAudioCuePlayer.swift:352` | presentation-spec §Audio |
| GAP-AUDIO-04 | Spatialization | DECISION | Use D-209. If the spatial AudioComponent setting is unavailable, fall back to D-306 (all non-spatial) and log it in the build receipt. | → D-209 | presentation-spec §Audio |
| GAP-AUDIO-05 | Playback mode | SNAP+DECISION | Cues LowPower; UI clicks LowLatency | developers.snap.com/spectacles/about-spectacles-features/audio → D-014 | lens-studio-build §Audio |
| GAP-AUDIO-06 | Moment cues | SOURCE+DECISION | Spawn theme on real start only (none in Demo). Bond milestone on summary if delta > 0. No launch/reveal cues (`appLaunchTheme`, `companionReveal`) per D-015. | `WaykinApp.swift:643-645,1010,231-235` → D-015 | behavior-spec §Audio |
| GAP-AUDIO-07 | Ducking | DECISION | None; max 3 concurrent (fg, ambient, moment) | → D-016 | presentation-spec §Audio |
| GAP-AUDIO-08 | File format | DECISION | D-218, per the PRS-104 manifest (mono/stereo split) | PRS-104 | lens-studio-build §Assets |
| GAP-AUDIO-09 | Stop fade | SOURCE | 0.25 s fade to 0 | `AppAudioCuePlayer.swift:431-433` | presentation-spec §Audio |
| GAP-AUDIO-10 | Cue fallback order | SOURCE | Experience cue → AR-presentation cue → path cue; one per tick | `WaykinApp.swift:723-755,1346-1370` | behavior-spec §Audio |
| GAP-AUDIO-11 | Missing/silent asset | SOURCE | Play nothing, log once, never crash | `AppAudioCuePlayer.swift:333-338` | behavior-spec §Errors |

## UI — panels, HUD, glance

| ID | Gap | Res | Resolved value | Citation | Closed in |
|---|---|---|---|---|---|
| GAP-UI-01 | Panel inventory | DECISION | Intro(Home), Permissions, Safety, HUD, Summary, Memories, Recovery, Error (replaces Notice), Debug (D-055) | → D-055 | presentation-spec §UI |
| GAP-UI-02 | Panel placement/size | SNAP+DECISION | World-placed at 1.1 m, eye level −5°, 40×30 cm; summoned in front of gaze at open | spatial-design (focus 1 m, overlap 1.1 m, 53×77 cm) → PRS | presentation-spec §UI |
| GAP-UI-03 | Home buttons copy | SOURCE | "Begin Walk", "Demo Walk" | `WaykinApp.swift:1969,2061` | presentation-spec §Copy |
| GAP-UI-04 | Home content | DECISION | "Lira", "Bond N", latest memory line or "Walk with Lira to write your first memory." | `WaykinApp.swift:1855-1925` → D-059 | presentation-spec §UI |
| GAP-UI-05 | Walk HUD (glance) lines | SOURCE | phrase / pressureLabel / "m:ss · N m" (3 lines) | PRS-056 | presentation-spec §HUD |
| GAP-UI-06 | HUD placement | DECISION | PRS-056: 1.1 m, −8° yaw, −11° pitch, 18×10 cm, with D-212 follow; 3 lines | → PRS-056 | presentation-spec §HUD |
| GAP-UI-07 | HUD refresh | SOURCE+DECISION | 1 Hz; phrase min dwell 4 s | `WaykinApp.swift:2305-2307` → D-060 | presentation-spec §HUD |
| GAP-UI-08 | Phrase copy | SOURCE | Phrase table (opening "Lira is listening." …) | `App/CompanionPresenceView.swift:24-69` | presentation-spec §Copy |
| GAP-UI-09 | Pressure label copy | SOURCE | "Pressure <state>" or "Path steady/strained/slipped/recovering/quiet" | `CompanionPresenceView.swift:140-151` | presentation-spec §Copy |
| GAP-UI-10 | Pause/Stop controls | DECISION | Two capsule buttons under the HUD, 6×4 cm controls (4×4 cm minimum), pinch | → PRS-053/PRS-057 | presentation-spec §HUD |
| GAP-UI-11 | Control labels | SOURCE | "Pause" / "Resume" / "End" | `WaykinApp.swift:2392-2418` | presentation-spec §Copy |
| GAP-UI-12 | Stop confirmation | DECISION | None (SC-007) | → D-021 | presentation-spec §HUD |
| GAP-UI-13 | Color on additive display | DECISION | Text E6EAF0; accent 4A9E98; no black backplates | `App/Theme/WKTokens.swift:43-65`; SNAP publishing ("black appears transparent") → D-022 | presentation-spec §UI |
| GAP-UI-14 | State chip | SOURCE | No state chip; HUD has 3 lines (PRS-056). A11Y is met by the phrase text plus the shape and audio cues (PRS-080). | PRS-056/PRS-080 | presentation-spec §HUD |
| GAP-UI-15 | Continuity hint copy | SOURCE | "Looking for Lira again" / "Lira was far — re-planting ahead" | `App/AR/ARContinuityHint.swift:18-27` | presentation-spec §Copy |
| GAP-UI-16 | 15-min suggestion | DECISION | D-107 timings: 15:00, 20:00, and 30:00 hard end; BEH-031 copy rendered per D-216 as HUD line 2 for 4000 ms; the 30:00 auto-end leads to the summary. | → D-107/D-216 | presentation-spec §Copy |
| GAP-UI-17 | Typography | DECISION | Body 1.2 cm cap height at 1 m minimum; title 2.0 cm; display font title only | → PRS-053/PRS-057 | presentation-spec §UI |
| GAP-UI-18 | Strings language | DECISION | English only | → D-057 | presentation-spec §Copy |

## ONB — onboarding and permissions

| ID | Gap | Res | Resolved value | Citation | Closed in |
|---|---|---|---|---|---|
| GAP-ONB-01 | Flow | DECISION | First run: Intro → Permissions → Safety (5 bullets) → Home; PRS-070 flow and verbatim copy | → PRS-070 | presentation-spec §Onboarding |
| GAP-ONB-02 | Intro copy | SOURCE | PRS-070 Intro copy (verbatim) | PRS-070 | presentation-spec §Copy |
| GAP-ONB-03 | Safety bullets | DECISION | PRS-070 5 bullets | → PRS-070 | presentation-spec §Copy |
| GAP-ONB-04 | Permission prompt | SNAP | System Transparent Permission prompt + LED; no custom prompt | developers.snap.com/spectacles/permission-privacy/transparent-permission | lens-studio-build §Permissions |
| GAP-ONB-05 | Disclosure copy on Intro | DECISION | PRS-070 Location row | → PRS-070 | presentation-spec §Copy |
| GAP-ONB-06 | Onboarding flag | DECISION | Key `profile.onboardingDone` (in `waykin.profile.v1`) = true | → D-112/PRS-070 | behavior-spec §Persist |
| GAP-ONB-07 | Replay | DECISION | Replay from Memories (PRS-073) | → PRS-073 | presentation-spec §UI |

## PERSIST

| ID | Gap | Res | Resolved value | Citation | Closed in |
|---|---|---|---|---|---|
| GAP-PERSIST-01 | Store API | SNAP | `global.persistentStorageSystem.store` getInt/putInt/getString/putString | developers.snap.com/lens-studio/features/persistent-cloud-storage/persistent-storage | lens-studio-build §Storage |
| GAP-PERSIST-02 | Key schema | DECISION | D-112: `waykin.profile.v1` JSON; onboarding `profile.onboardingDone`; Reduce Motion `profile.reduceMotion` (bool, added to profile v1, default false) | → D-112 | behavior-spec §Persist |
| GAP-PERSIST-03 | Memory format | DECISION | JSON array, newest first, ≤ 5 | spec.md FR-013 → D-030 | behavior-spec §Persist |
| GAP-PERSIST-04 | Migration | DECISION | Unknown schema → keep `waykin.profile.v1` if valid, clear the rest, write profile v1 | → D-112 | behavior-spec §Persist |
| GAP-PERSIST-05 | Store full | DECISION | On write failure: (1) delete `waykin.receipt.last.v1` and retry; (2) drop the oldest memory and retry; (3) show ERR-PERSIST-04. Never call `clear()`. | SNAP persistent-storage → BEH-045 | behavior-spec §Persist |
| GAP-PERSIST-06 | Write timing/idempotency | SOURCE+DECISION | Use BEH-042 (idempotency key = checkpoint `startedAt`) and D-108 (RecoveryPanel at ≤ 24 h, silent finalize at > 24 h). | BEH-042; D-108 | behavior-spec §Persist |
| GAP-PERSIST-07 | Companion identity | SOURCE | Name "Lira"; id 6C697261-0001-4000-8000-000000000001 | `PersistenceStore.swift:39-49` | behavior-spec §Persist |
| GAP-PERSIST-08 | No coordinates stored | SOURCE | Memories/receipts contain no lat/lon/route | `ARCHITECTURE.md:94` | behavior-spec §Persist |
| GAP-PERSIST-09 | OS clears storage | NC | If missing: Bond 12, onboarding shown again (`profile.onboardingDone` false) | NC-08 | behavior-spec §Persist |

## LIFE — session lifecycle

| ID | Gap | Res | Resolved value | Citation | Closed in |
|---|---|---|---|---|---|
| GAP-LIFE-01 | Waiting copy | SOURCE | "Waiting for a reliable location fix..." until first accepted moving sample; then "Walking with Lira..." | `WaykinApp.swift:1012,1324` | presentation-spec §Copy |
| GAP-LIFE-02 | First-fix timeout | DECISION | 30 s → ErrorPanel ERR-GPS-02 "No GPS fix yet. Try outside, or start Demo Walk." with buttons "Try again" and "Demo Walk"; walk not started | ERR-GPS-02 | behavior-spec §Lifecycle |
| GAP-LIFE-03 | Checkpoint | DECISION | Every 30 s write checkpoint (summary fields only); idempotency key = checkpoint `startedAt` (BEH-042) | BEH-042 | behavior-spec §Lifecycle |
| GAP-LIFE-04 | Close mid-walk | DECISION | Next launch with checkpoint: if ≤ 24 h show RecoveryPanel; if > 24 h silent finalize. Finalize writes memory + Bond +1 once, endedReason `closed`, clear checkpoint. | BEH-042/D-108 | behavior-spec §Lifecycle |
| GAP-LIFE-05 | Double End | SOURCE | Second End ignored | `WaykinApp.swift:777-778` | behavior-spec §Lifecycle |
| GAP-LIFE-06 | Thermal/power end | NC | D-116 thresholds: enter at 10 s rolling mean frame delta > 20 ms; exit at < 17 ms for 30 s; end with reason `power` after 180 s continuous. Effect per PRS-093: loop clips off (static pose), hunter echo hidden, HUD lazy-follow frozen, audio kept. | → D-116/PRS-093 | behavior-spec §Lifecycle |
| GAP-LIFE-07 | Battery end | NC | Soft stop at 15% if a battery API exists; else none | NC-03 | behavior-spec §Lifecycle |
| GAP-LIFE-08 | Location stale | DECISION | D-111: 15 s / 3 errors degraded; degraded shows ERR-GPS-03 line in HUD line 2. Lost leads to ending with reason `locationLost` and the summary. There is no auto-pause. | → D-111 | behavior-spec §Lifecycle |
| GAP-LIFE-09 | Minimum walk for Bond | DECISION | D-109 for non-user ends; userStop is always +1. | → D-109 | behavior-spec §Bond |
| GAP-LIFE-10 | Lens OS pause | DECISION | Auto-pause (see SM-07); use platform event if T069 finds one, otherwise BEH-029 > 5 s frame-gap proxy; ERR-LIFE-02 with no auto-resume. | → BEH-029/T069 | behavior-spec §Lifecycle |

## GPS — accuracy, jitter, indoor

| ID | Gap | Res | Resolved value | Citation | Closed in |
|---|---|---|---|---|---|
| GAP-GPS-01 | Accuracy level | SNAP | `GeoLocationAccuracy.Navigation` | location doc | lens-studio-build §Location |
| GAP-GPS-02 | Duplicate fixes | SNAP | Ignore if timestamp == last | location doc example | behavior-spec §GPS |
| GAP-GPS-03 | Integrity gates | SOURCE | All CONST-12 gates; reject reasons as enum | `MovementIntegrity.swift:135-234` | behavior-spec §Movement |
| GAP-GPS-04 | Heading | SNAP | Not used (calibration lag after OS update) | location doc "Known Limitations" | behavior-spec §GPS |
| GAP-GPS-05 | Distance formula | DECISION | Haversine, R = 6 371 008.8 m; tolerance ±0.05 m | `MovementIntegrity.swift:291-294` → D-100 | behavior-spec §GPS |
| GAP-GPS-06 | On-device accuracy distribution | NC | Keep the 30 m gate | NC-01 | decisions.md |
| GAP-GPS-07 | Reported speed | DECISION | Pass NaN → distance/time fallback | `MovementIntegrity.swift:186-194` → D-039 | behavior-spec §GPS |
| GAP-GPS-08 | Indoor/no internet | SOURCE | Demo Walk offered | spec.md edge cases; `WaykinApp.swift:934-940` | behavior-spec §GPS |
| GAP-GPS-09 | Night degradation | SNAP | Expect worse accuracy at night; no special code | location doc "Known Limitations" | behavior-spec §GPS |

## ERR

| ID | Gap | Res | Resolved value | Citation | Closed in |
|---|---|---|---|---|---|
| GAP-ERR-01 | Permission denied copy | SOURCE | "Location access is required for a real walk. Demo Walk is still available." | `WaykinApp.swift:958` | presentation-spec §Copy |
| GAP-ERR-02 | Service unavailable copy | SOURCE | "Location Services are unavailable. Demo Walk is still available." | `WaykinApp.swift:936` | presentation-spec §Copy |
| GAP-ERR-03 | Location failed mid-walk | SOURCE | Copy "Location became unavailable. The walk was stopped safely." → summary, reason `locationLost` | `WaykinApp.swift:1413` | behavior-spec §Errors |
| GAP-ERR-04 | Core exception | DECISION | Catch at SessionController; end walk, save summary, reason `error`, toast "Something went wrong. Your walk was saved." | → D-040 | behavior-spec §Errors |
| GAP-ERR-05 | Storage write fail | DECISION | Summary still shows; show ERR-PERSIST-04 | `WaykinApp.swift:1180` → BEH-045 | behavior-spec §Errors |
| GAP-ERR-06 | Missing audio | SOURCE | Silent | `AppAudioCuePlayer.swift:333-338` | behavior-spec §Errors |

## A11Y

| ID | Gap | Res | Resolved value | Citation | Closed in |
|---|---|---|---|---|---|
| GAP-A11Y-01 | Color not alone | SOURCE | Every state = phrase text + shape + audio cues (PRS-080); no chip | `docs/assets/BRAND_GUIDE.md:96` → PRS-080 | presentation-spec §A11y |
| GAP-A11Y-02 | Audio captions | DECISION | Each cue coincides with a HUD phrase change | → D-042 | presentation-spec §A11y |
| GAP-A11Y-03 | Motion comfort | DECISION | Reduce Motion setting `profile.reduceMotion`; Lira speed ≤ 5 m/s, no screen flashes | `WKTokens.swift:157-165` → D-112 | presentation-spec §A11y |
| GAP-A11Y-04 | Text minimum | DECISION | PRS-053/PRS-057 sizes (1.2/2.0 cm) | → PRS-053/PRS-057 | presentation-spec §A11y |
| GAP-A11Y-05 | Hit targets | SOURCE+DECISION | ≥ 6×4 cm controls, 4×4 cm minimum | `WKTokens.swift:79` → PRS-053/PRS-057 | presentation-spec §A11y |

## PERF

| ID | Gap | Res | Resolved value | Citation | Closed in |
|---|---|---|---|---|---|
| GAP-PERF-01 | FPS target | SNAP | 60 FPS; frame ≤ 16.67 ms | developers.snap.com/spectacles/best-practices/profiling/lens-performance-overlay | lens-studio-build §Perf |
| GAP-PERF-02 | Power budget | SNAP | CPU/GPU < 100%; 100–125% throttle; > 125% standby risk | perf overlay doc | lens-studio-build §Perf |
| GAP-PERF-03 | Textures | SNAP | ≤ 512×512, no PBR | developers.snap.com/spectacles/best-practices/performance-optimization/optimizing-lens-performance | lens-studio-build §Perf |
| GAP-PERF-04 | Tris/bones | NC | ≤ 15k tris, ≤ 25 bones, 1 material | NC-07 | lens-studio-build §Perf |
| GAP-PERF-05 | Draw calls | DECISION | ≤ 20 draw calls total scene | → PRS | lens-studio-build §Perf |
| GAP-PERF-06 | Update loop | DECISION | Core runs only on the 1 s DelayedCallback; per-frame only Lira follow | → D-047 | lens-studio-build §Scripts |
| GAP-PERF-07 | Lens size | SNAP | ≤ 25 MB | developers.snap.com/spectacles/get-started/start-building/publishing-lens | lens-studio-build §Pub |
| GAP-PERF-08 | Audio format | SNAP | D-218, per the PRS-104 manifest | PRS-104 | lens-studio-build §Assets |

## ASSET

| ID | Gap | Res | Resolved value | Citation | Closed in |
|---|---|---|---|---|---|
| GAP-ASSET-01 | Source mesh | SOURCE | Lira rig `.blend` with 25 bones and 6 `Lira_*` actions (D-302) | → D-302 | lens-studio-build §Assets |
| GAP-ASSET-02 | Conversion | DECISION | Blender: use `.blend` rig (D-302) → decimate → bake 512 albedo → export glTF 2.0 (.glb), no Draco | SNAP gltf-import → D-044 | lens-studio-build §Assets |
| GAP-ASSET-03 | Import options | SNAP | Materials on; meters→cm on; no vertex color | developers.snap.com/lens-studio/assets-pipeline/3d/importing-content/gltf-import | lens-studio-build §Assets |
| GAP-ASSET-04 | Clips needed | DECISION | `Lira_Idle`, `Lira_Follow`, `Lira_Investigate`, `Lira_Alert`, `Lira_Celebrate`, `Lira_Spawn` | `LiraARAssetCatalog.swift:33-40` → D-302/D-045 | lens-studio-build §Assets |
| GAP-ASSET-05 | Naming | DECISION | `WK_<Type>_<Name>`; see D-045 | → D-045 | lens-studio-build §Assets |
| GAP-ASSET-06 | Audio list | SOURCE | 7 walk WAVs + spawn + bond milestone | `App/Resources/Audio/README.md:12-29` | lens-studio-build §Assets |
| GAP-ASSET-07 | Icon/preview | SNAP | Custom icon + 3:4 preview, no text, bright, simple background | publishing doc | lens-studio-build §Pub |
| GAP-ASSET-08 | uint64 strategy | NC | 2×uint32 fallback | NC-04 | lens-studio-build §Core |

## SCENE

| ID | Gap | Res | Resolved value | Citation | Closed in |
|---|---|---|---|---|---|
| GAP-SCENE-01 | SIK setup | SNAP | Spectacles Base Template; SIK prefab | developers.snap.com/spectacles/spectacles-frameworks/spectacles-interaction-kit/get-started | lens-studio-build §Scene |
| GAP-SCENE-02 | Device tracking | SNAP | Camera Device Tracking = World | SIK get-started | lens-studio-build §Scene |
| GAP-SCENE-03 | Buttons | DECISION | UI Kit `CapsuleButton`, 6×4 cm controls (PRS-057) | developers.snap.com/spectacles/spectacles-frameworks/spectacles-ui-kit/components/Button → PRS-057 | lens-studio-build §Scene |
| GAP-SCENE-04 | Hierarchy | DECISION | D-046 tree | → D-046 | lens-studio-build §Scene |
| GAP-SCENE-05 | Script wiring | DECISION | Single SessionController owns core; adapters injected | → D-047 | lens-studio-build §Scripts |
| GAP-SCENE-06 | Core copy | DECISION | `scripts/sync_core_ts.sh` (plan.md); generated files read-only | → D-046 | lens-studio-build §Scripts |
| GAP-SCENE-07 | LS version | SNAP | 5.15.4 (last series for Spectacles 2024), SIK 0.17.2, UI Kit 0.1.4 | NC-05, https://ar.snap.com/spectacles | lens-studio-build §Setup |

## DEMO

| ID | Gap | Res | Resolved value | Citation | Closed in |
|---|---|---|---|---|---|
| GAP-DEMO-01 | Event sequence | SOURCE | observes, drawsNear, presence, begins, intensifies, fades, bondMoment | `Sources/WaykinCore/Engines/DemoSessionController.swift:6-14` | behavior-spec §Demo |
| GAP-DEMO-02 | Tick values | SOURCE | Δ 40 s, speed 1.4, ×7 | `DemoSessionController.swift:40` | behavior-spec §Demo |
| GAP-DEMO-03 | Real-time pacing | DECISION | One tick per 5 s wall time; end at 40 s (ticks at 5, 10, …, 35 s) | → D-104 | behavior-spec §Demo |
| GAP-DEMO-04 | Demo label | DECISION | HUD line prefix "DEMO" text (no chip; 3 lines per PRS-056) | → PRS-056 | presentation-spec §HUD |
| GAP-DEMO-05 | Demo Bond/memory | SOURCE | Persisted like iOS (finish bondDelta) | `WaykinApp.swift:815-855` | behavior-spec §Demo |
| GAP-DEMO-06 | Demo audio | SOURCE | Event cues; no spawn theme | `WaykinApp.swift:643-645` | behavior-spec §Demo |

## SUMMARY

| ID | Gap | Res | Resolved value | Citation | Closed in |
|---|---|---|---|---|---|
| GAP-SUMMARY-01 | Title | SOURCE | "Session Summary" | `WaykinApp.swift:2896` | presentation-spec §Summary |
| GAP-SUMMARY-02 | Bond line | SOURCE | PRS-058 (iOS `3017-3022`): "Bond +N" / "Bond N" / "Bond held" | PRS-058 | presentation-spec §Summary |
| GAP-SUMMARY-03 | Time/distance format | SOURCE | "m:ss"; "N m" | `WaykinApp.swift:3024-3034` | presentation-spec §Summary |
| GAP-SUMMARY-04 | Closing phrase | SOURCE | "The presence faded." / "Lira stayed with you." / "The path remembers." | `CompanionPresenceView.swift:71-77` | presentation-spec §Summary |
| GAP-SUMMARY-05 | Path line | SOURCE | `WalkPathCopy.pathLine` | `WalkPathCopy.swift:7-21` | presentation-spec §Summary |
| GAP-SUMMARY-06 | Event count + ended reason line | DECISION | `Moments / {n}` + reason line | → P metric layout | presentation-spec §Summary |
| GAP-SUMMARY-07 | Dismiss | DECISION | `Done` button → Home | `WaykinApp.swift:3002` → PRS-058 | presentation-spec §Summary |
| GAP-SUMMARY-08 | Real-walk memory fallback | SOURCE | "Lira stayed close during a quiet Nm walk." + suffix | `WaykinApp.swift:1099-1104` | behavior-spec §Memory |

## TEST

| ID | Gap | Res | Resolved value | Citation | Closed in |
|---|---|---|---|---|---|
| GAP-TEST-01 | Parity acceptance | SOURCE | 100% vectors bit-exact | `contracts/core-parity.md` | traceability.md |
| GAP-TEST-02 | Preview Demo acceptance | DECISION | Event log order == demo vector; Stop → summary < 1 s | → D-104 | traceability.md |
| GAP-TEST-03 | Persistence acceptance | DECISION | 3 relaunches; Bond/memories equal; recovery once per D-108 | → BEH-042/D-108 | traceability.md |
| GAP-TEST-04 | Stop one interaction | DECISION | From active/paused/waiting: 1 pinch → summary | → D-021 | traceability.md |
| GAP-TEST-05 | Device 15-min | SNAP | Overlay FPS/power at 0/5/10/15 min | perf overlay doc | traceability.md |
| GAP-TEST-06 | Version log | DECISION | Log "Lens Opened: vX.Y.Z" | publishing doc → D-052 | traceability.md |

## PUB

| ID | Gap | Res | Resolved value | Citation | Closed in |
|---|---|---|---|---|---|
| GAP-PUB-01 | Permissions | SNAP | RawLocation only (D-301), verify in TST-051 and at publish (T073); if GPS fails without Internet, add `InternetModule` and amend D-301. | transparent-permission; permission-privacy/overview | lens-studio-build §Pub |
| GAP-PUB-02 | Experimental | SNAP | "Allow Experimental API" off | developers.snap.com/spectacles/permission-privacy/experimental-apis | lens-studio-build §Pub |
| GAP-PUB-03 | Size ≤ 25 MB | SNAP | Checklist gate | publishing doc | lens-studio-build §Pub |
| GAP-PUB-04 | Metadata | SNAP | Icon, 3:4 preview, description, release notes | publishing doc | lens-studio-build §Pub |
| GAP-PUB-05 | Capturability | SNAP | Default components only | publishing doc | lens-studio-build §Pub |
| GAP-PUB-06 | Review time | SNAP | Plan 2–3 business days | publishing doc | lens-studio-build §Pub |
| GAP-PUB-07 | Version visible | DECISION | Version on Home footer `v0.1.0` | → D-052 | presentation-spec §UI |
| GAP-PUB-08 | Debug/test mode | DECISION | Hidden: 5-pinch on Home footer opens Debug panel (D-055) | → D-055 | lens-studio-build §Pub |

## Area → doc section index

```
CONST   -> behavior-spec.md §Core, §Events, §Movement
EVT     -> behavior-spec.md §Events, §Pursuit, §Bond, §Memory, §Path
SM      -> behavior-spec.md §Lifecycle ; presentation-spec.md §Lira
LIRA    -> presentation-spec.md §Lira
AUDIO   -> behavior-spec.md §Audio ; presentation-spec.md §Audio
UI      -> presentation-spec.md §UI, §HUD, §Copy
ONB     -> presentation-spec.md §Onboarding, §Copy ; lens-studio-build.md §Permissions
PERSIST -> behavior-spec.md §Persist ; lens-studio-build.md §Storage
LIFE    -> behavior-spec.md §Lifecycle
GPS     -> behavior-spec.md §GPS, §Movement ; lens-studio-build.md §Location
ERR     -> behavior-spec.md §Errors ; presentation-spec.md §Copy
A11Y    -> presentation-spec.md §A11y
PERF    -> lens-studio-build.md §Perf
ASSET   -> lens-studio-build.md §Assets
SCENE   -> lens-studio-build.md §Scene, §Scripts
DEMO    -> behavior-spec.md §Demo
SUMMARY -> presentation-spec.md §Summary ; behavior-spec.md §Memory
TEST    -> traceability.md
PUB     -> lens-studio-build.md §Pub
```