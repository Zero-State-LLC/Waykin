# Presentation spec: Lira Walks With You (Spectacles)

> **Precedence:** This doc was drafted in parallel with its siblings. Where it conflicts with `decisions.md` § Conflicts (CF-01..CF-32), the CF resolution wins. Task T040 removes the superseded values from this doc.

| Field | Value |
|---|---|
| Spec set | `specs/001-spectacles-lira-walk` |
| Doc letter | P |
| Decision range | D-200..D-299 |
| NC range | NC-30..NC-49 |
| Governing docs | `spec.md`, `plan.md`, ADR-0004, `WAYKIN_SPEC.md`, `WAYKIN_UIUX_SPEC.md` |

**Scope.** This spec covers everything the Lens renders or plays. It does not decide gameplay. Gameplay truth comes from `packages/waykin-core-ts` (`spec.md:91-93`). Presentation adapters may realize semantic state but must not own it (`WAYKIN_SPEC.md:36`; `ARCHITECTURE.md:140`).

**Reading rules**
- `PRS-NNN` marks a binding requirement.
- `GAP-P-<AREA>-NN` marks the gap that a requirement closes.
- **DECISION (proposed) D-2NN** marks a product choice that no source makes.
- **NEEDS CLARIFICATION NC-NN** marks an unknowable device fact. Each one ships with a safe default.
- Lens Studio units are centimeters (platform knowledge, verify). This spec states every distance in **meters**. Implementers convert at ×100.

**Correction against iOS behavior.** Several iOS values assume a phone camera with a wide, hand-held view. Spectacles has a narrow 3:4 display (Snap design doc, *Introduction to Spatial Design*). Values that change for that reason are flagged **CORRECTION**, and each carries its reasoning. None of them changes Core behavior or ADR-0004.

---

## §1 Lira (LIRA)

### 1.1 Presentation states

**PRS-001** (GAP-P-LIRA-01). The Lens renders exactly five presentation states: `idle`, `follow`, `investigate`, `alert`, and `celebrate`. These match the iOS renderer vocabulary (`App/AR/Companion/CompanionPresentationState.swift:4-17`). The state string comes from the TS port of `CompanionPresentationMatrix.arBehaviorString` (`Sources/WaykinCore/Engines/CompanionPresentationMatrix.swift:43-90`).

Normalize state strings as follows (`CompanionPresentationState.swift:109-120`):

| Input string(s) | Normalized state |
|---|---|
| `follow`, `drawnear`, `approach` | `follow` |
| `investigate`, `observe`, `curious` | `investigate` |
| `alert`, `warn`, `threat` | `alert` |
| `celebrate`, `bondmoment`, `success` | `celebrate` |
| anything unrecognized | `idle` |

**PRS-002** (GAP-P-LIRA-02). FR-007 allows "3 to 4 behaviors" (`spec.md:95`). Interpret it this way:

**DECISION (proposed) D-200.** There are 4 looping behaviors: `idle`, `follow`, `investigate`, and `alert`. `celebrate` and `spawn` are one-shot clips that return to a loop. This preserves the iOS five-state vocabulary without contradicting FR-007.

**PRS-003** (GAP-P-LIRA-03). `celebrate` lasts 1.5 s. After that, it resolves to `idle` (`CompanionPresentationState.swift:39`, `:82-90`).

A repeated `celebrate` request while one is in progress does **not** restart the timer. The iOS test `testRepeatedCelebrateDoesNotRestartDeadlineOrDuplicateDiagnostics` (`AppTests/ARCompanionEmbodimentTests.swift:287`) covers this.

### 1.2 State → clip map

**PRS-004** (GAP-P-LIRA-04). Clip map. The clip IDs follow `LiraSkeletalAnimationLibrary.ClipID` (`App/AR/Companion/LiraSkeletalAnimationLibrary.swift:20-45`). The loop flags follow `:28-33`.

| State | Clip asset name (glTF animation) | Loop | Reference duration (s) | Source of duration |
|---|---|---|---|---|
| idle | `lira_idle` | yes | 1.8 | `LiraSkeletalAnimationLibrary.swift:249` |
| follow | `lira_follow` (walk cycle) | yes | 2.2 | `:273` |
| investigate | `lira_investigate` | yes | 2.0 | `:318` |
| alert | `lira_alert` | yes | 0.9 | `:341` |
| celebrate | `lira_celebrate` | no | 0.55 | `:378` |
| spawn | `lira_spawn` | no | 0.70 | `:400`; `App/AR/Companion/LiraARMotion.swift:210` |

**PRS-005** (GAP-P-LIRA-05). Clip fallback.

The packaged Ember Fox ships only one authored walk cycle. Per-state `Fox_*` clips are empty until someone authors them (`App/AR/Companion/LiraARAssetCatalog.swift:24-48`). The retired `Lira_*` sidecars share zero joints with the fox and must not be bound (`LiraARAssetCatalog.swift:26-28`).

**DECISION (proposed) D-201.** When a state clip is missing, use the following fallbacks:

| Missing clip | Fallback |
|---|---|
| `lira_follow` | the embedded walk |
| `lira_idle`, `lira_investigate` | the walk paused at frame 0, plus the procedural layers in 1.3 |
| `lira_alert` | the walk at speed 1.25× |
| `lira_celebrate`, `lira_spawn` | the procedural root scale only (1.3) |

This matches iOS, where missing states fall back to the embedded walk (`LiraARAssetCatalog.swift:31-32`). It also matches iOS pausing the walk when Lira is stationary (`App/AR/ARWorldCommandRenderer.swift:507-508`).

**PRS-006** (GAP-P-LIRA-06). Walk pause and resume while following. The walk clip plays only while Lira is closing distance. When she settles, it pauses (`ARWorldCommandRenderer.swift:505-508`).

### 1.3 Blends and procedural layers

**PRS-007** (GAP-P-LIRA-07). Crossfade timings.

| Transition | Crossfade |
|---|---|
| Between looping state clips | 0.22 s (`App/AR/Companion/LiraSkeletalPlayer.swift:40`) |
| Into an authored per-state clip | 0.25 s (`App/AR/Companion/LiraARAssetLoader.swift:550-554`) |
| Restart of the embedded walk | 0.20 s (`LiraARAssetLoader.swift:572-576`) |
| Watchdog replay of a looping clip | 0 s (`LiraSkeletalPlayer.swift:201-205`) |

**PRS-008** (GAP-P-LIRA-08). Loop watchdog. Every **400 ms**, check whether the active looping clip has stopped. If it has stopped and was not intentionally paused, restart it (`ARWorldCommandRenderer.swift:343-344`, `:401-409`).

**PRS-009** (GAP-P-LIRA-09). Per-state root scale, applied to the Lira root. Values come from `ARWorldCommandRenderer.swift:840-886`.

| State | Scale (x, y, z) | Status indicator visible | Indicator color |
|---|---|---|---|
| idle | 1, 1, 1 | no | `#F7F5F2` |
| follow | 1.02 ×3 | no | `#3F8F8A` |
| investigate | 1, 0.92, 1.08 | yes | `#E0B040` |
| alert | 1.05, 1.14, 0.96 | yes | `#D17A4A` |
| celebrate | 1.12 ×3 | yes | `#D4A45A` |

**PRS-010** (GAP-P-LIRA-10). Spawn coalesce. Scale the root by `0.92 + 0.08·(1−(1−p)³)` over 0.70 s (`LiraARMotion.swift:210-223`). With Reduce Motion on, run it over 0.12 s instead (`LiraARMotion.swift:211`).

**PRS-011** (GAP-P-LIRA-11). Hunter echo. A translucent duplicate silhouette, `HunterEcho`, renders **only** in `alert` (`LiraARMotion.swift:185-187`). It uses the body color at alpha 0.22 (`App/AR/Companion/CompanionEntityFactory.swift:237-245`). It drifts by `x = 0.04+0.01·sin(2.6t)` and `y = ground+0.28+0.01·sin(1.8t)` m (`LiraARMotion.swift:190-201`). This is the only visual expression of pursuit. No pursuer is ever rendered (`spec.md:97`).

### 1.4 Spatial placement

**PRS-012** (GAP-P-LIRA-12). Canonical height and ground.
- Lira's height is **0.72 m** (`App/AR/Companion/CompanionVisualConfiguration.swift:9`).
- Her lowest point rests on the ground. Ground y comes from a horizontal-surface hit test (platform knowledge, verify).
- If no surface is found, ground y = head y − **1.45 m** (`App/AR/ARPlacementResolver.swift:134-136`).

**PRS-013** (GAP-P-LIRA-13). **CORRECTION / DECISION (proposed) D-202.** Follow placement.

On iOS, a settled Lira sits **0.25 m behind and 0.8 m beside** the walker (`ARWorldCommandRenderer.swift:521-523`). On Spectacles that position falls outside the display's FOV. The full-overlap display region at 1.1 m is 53 cm × 77 cm (Snap design doc), which is about ±13.5° horizontal. A companion placed behind the walker would never be seen.

The Lens therefore uses a single **ahead-diagonal** target for both `follow` and `lead`:

| Parameter | Value | Source |
|---|---|---|
| Forward distance | 2.0 m | lead distance, `ARWorldCommandRenderer.swift:429-430` |
| Lateral offset | 0.6 m, on the side Lira already occupies (default right) | D-202 |
| Arrive deadband | 0.45 m | `ARWorldCommandRenderer.swift:431-432` |

At 2.0 m forward and 0.6 m lateral, Lira sits at about 16.7° yaw. That is just outside the full-overlap region but inside the monocular region (INFERRED). This keeps her peripheral, as FR-011 requires (`spec.md:99`).

**PRS-014** (GAP-P-LIRA-14). Distance band → forward-distance override. The band comes from `SpatialIntent.distanceBand` (`App/AR/CanonicalARWorldCommandMapper.swift:182-192`).

| Band | Forward distance (m) |
|---|---|
| immediate | 1.3 |
| near | 1.6 |
| medium | 2.0 |
| far | 3.0 |

Lateral offset is 0.6 m for all bands. **DECISION (proposed) D-203.** These are glasses-scaled equivalents of the iOS bands. The 1.3 m minimum stays near the 1 m focus plane (Snap design doc).

**PRS-015** (GAP-P-LIRA-15). Speed matching. Port the following unchanged from `ARWorldCommandRenderer.swift:357-367`, `:412-419`, and `:464-472`:

| Parameter | Value |
|---|---|
| Base follow speed | 1.35 m/s |
| Overtake factor | 1.35 × walker speed |
| Speed cap | 5.0 m/s |
| Walker speed estimate | EMA α = 0.08, computed from head-pose horizontal delta |
| Discard instantaneous speed | ≥ 12 m/s |
| Abort any step when target gap | ≥ 60 m (`:483`) |

Movement is horizontal only.

**PRS-016** (GAP-P-LIRA-16). Look-at.
- While moving, Lira's yaw faces her direction of travel.
- When settled, her yaw faces the walker's head position projected to the ground (`ARWorldCommandRenderer.swift:510-519`, `:534-538`).
- Yaw slews at most **180°/s**. **DECISION (proposed) D-204.** This prevents snap rotations at 60 FPS.

**PRS-017** (GAP-P-LIRA-17). Occlusion. **DECISION (proposed) D-205.** The MVP has no real-world occlusion and no World Mesh. World Mesh is a Supplementary Tracker permission (Snap *Permissions overview*), and it costs power. Lira always renders on top. A ground contact shadow disc stays, because it is the depth cue.

### 1.5 Continuity, tracking loss, out-of-FOV

**PRS-018** (GAP-P-LIRA-18). Continuity check. Run it once per **1.0 s** (`App/AR/CanonicalARSessionView.swift:30-31`). Replant Lira when either condition holds:
- She is missing or detached.
- She is more than **6.0 m** from the head **and** behind the head's forward vector, so the replant is never witnessed (`ARPlacementResolver.swift:9-10`, `:294-311`).

**PRS-019** (GAP-P-LIRA-19). Replant target. Use the ahead-diagonal target from PRS-013 at the current band distance. If no ground hit is available, use assumed ground at 1.8 m forward (`ARPlacementResolver.swift:175-179`). After placement, play `lira_spawn` and run the coalesce.

**PRS-020** (GAP-P-LIRA-20). Tracking loss. When device tracking reports limited or lost, hide Lira (`enabled=false`) immediately. Hiding suppresses smeared geometry (`ARWorldCommandRenderer.swift:690-698`).

When tracking returns:
1. Wait **500 ms** of stable tracking.
2. Replant per PRS-019.
3. Show Lira.

**DECISION (proposed) D-206.** The 500 ms value debounces relocalization flicker.

Audio continues the whole time. Tracking never changes gameplay (`ARCHITECTURE.md:156`).

**PRS-021** (GAP-P-LIRA-21). Out-of-FOV. Lira may sit outside the view, for example when the walker turns.
- There is no visual arrow.
- Her spatialized cues (§2) carry direction.
- If she has been outside a **±25° yaw cone** for **8 s** while the walker is moving, replant her ahead per PRS-019.

**DECISION (proposed) D-207.** This replaces the iOS "chase into view" behavior. On glasses, a long walk to the edge of the FOV would just read as an absent companion.

**PRS-022** (GAP-P-LIRA-22). Heading. Never use compass heading for placement. All placement is relative to head pose. Heading calibration is unreliable after OS updates (Snap *Location* doc, *Known Limitations*).

**PRS-023** (GAP-P-LIRA-23). Skins. The MVP ships the **Dawn** material only. **DECISION (proposed) D-208.** Veil and Rupture are cosmetic, and adding them costs texture memory. The Dawn default is set in `App/Theme/LiraSkin.swift:13`.

---

## §2 Audio (AUDIO)

**PRS-030** (GAP-P-AUDIO-01). Semantics stay in Core. The core emits cue kinds. The Lens adapter maps each kind to a file. No filename may appear in core code (`spec.md:93`).

**PRS-031** (GAP-P-AUDIO-02). Gain formula: `gain = catalogVolume × max(0.25, cue.intensity)` (`App/AppAudioCuePlayer.swift:352`). The dB column below is `20·log10(catalogVolume)`, the gain at intensity ≥ 1.

**PRS-032** (GAP-P-AUDIO-03). Cue table. The catalog comes from `AppAudioCuePlayer.swift:35-48`. Durations come from `docs/design/LIRA_AUDIO_CUE_FAMILY.md:43-51` and `App/Resources/Audio/README.md:24-29`.

The cooldown column has three sources:
- Event-cue groups: 18 s per group (`Sources/WaykinCore/Engines/AudioExperienceLayer.swift:32`).
- Behavior and AR-presentation transitions: 12 s (`AudioExperienceLayer.swift:17-19`).
- Path cues: 14 s (`Sources/WaykinCore/Path/PathAudioCoupling.swift:6`).

| Cue ID (kind) | File | Primary triggers | Linear | dB | Spatial | Channel | Prio | Cooldown |
|---|---|---|---|---|---|---|---|---|
| companionNear | `companion_near.wav` | event `companionDrawsNear`; behavior→drawNear | 0.40 | −7.96 | Lira-attached 3D | fg | 2 | 18 s group `companion` / 12 s transition |
| companionAhead | `companion_ahead.wav` | event `companionMovesAhead`; behavior→lead | 0.40 | −7.96 | Lira-attached 3D | fg | 2 | same |
| distantFootsteps | `distant_presence.wav` | `distantPresence`, `pursuitBegins` | 0.36 | −8.87 | head-relative, 2 m behind | fg | 3 | 18 s group `pursuit` |
| pursuitPressure | `pursuit_pressure.wav` | `pursuitIntensifies`; AR→alert | 0.45 | −6.94 | head-relative, 2 m behind | fg | 4 | 18 s / 12 s |
| pursuitRelease | `pursuit_release.wav` | `pursuitFades`; path→recovered | 0.36 | −8.87 | head-relative, 2 m behind | fg | 3 | 18 s / 14 s |
| bondMotif | `bond_motif.wav` | `bondMoment`; behavior/AR→celebrate | 0.42 | −7.54 | Lira-attached 3D | fg | 5 | 18 s group `bond` |
| quietShift | `quiet_shift.wav` | observe/quiet/familiar; AR→investigate; path strained/offPath | 0.30 | −10.46 | head-locked center | ambient | 1 | 18 s `ambient` / 12 s / 14 s |
| appLaunchTheme | `lira_launch_theme.wav` | first Lens open of the session | 0.50 | −6.02 | head-locked stereo | moment | 6 | once per Lens launch |
| companionReveal | `lira_companion_reveal.wav` | onboarding completed (§4) | 0.46 | −6.74 | head-locked stereo | moment | 6 | once per completion |
| spawnTheme | `lira_spawn_theme.wav` | Begin Walk spawn only, never Demo (`App/WaykinApp.swift:643-645`) | 0.48 | −6.38 | Lira-attached 3D | moment | 6 | once per walk |
| bondMilestone | `lira_bond_milestone.wav` | summary shown with bondDelta > 0 (`WaykinApp.swift:231-235`) | 0.46 | −6.74 | head-locked stereo | moment | 6 | once per summary |

Trigger mapping follows `AudioExperienceLayer.swift:110-127`, `:130-177`, `:194-211`, and `:215-255`, and `PathAudioCoupling.swift:24-57`.

**PRS-033** (GAP-P-AUDIO-04). Spatial positions. **DECISION (proposed) D-209.**
- **Lira-attached** cues come from a 3D audio emitter at Lira's chest (y = +0.34 m).
- **Head-relative "behind"** cues come from an emitter that follows the head, at 2.0 m behind and 0 m vertical. It reproduces the iOS `.behind` bias (`AudioExperienceLayer.swift:117-121`).
- **Head-locked** cues are non-spatial. The iOS stereo pan of ±0.2 (`AppAudioCuePlayer.swift:536-541`) is replaced by true spatial position.

Spatial audio component setup is platform knowledge, verify.

**PRS-034** (GAP-P-AUDIO-05). Concurrency and priority. The Lens has three channels: foreground, ambient, and moment (`AppAudioCuePlayer.swift:13-20`). At most one cue plays per channel, so at most **3** play at once. Snap advises limiting simultaneous sounds (Snap *Optimizing Lens Performance*). The per-channel rules come from `AppAudioCuePlayer.swift:77-97`:
- A cue of the same kind already playing is ignored.
- A lower-priority cue is ignored.
- An equal or higher priority cue replaces the playing cue. The replaced cue stops immediately.

**PRS-035** (GAP-P-AUDIO-06). Ducking. There is none. The moment channel layers over walk cues, matching iOS (`AppAudioCuePlayer.swift:16-19`). **DECISION (proposed) D-210:** no ducking in the MVP.

**PRS-036** (GAP-P-AUDIO-07). Cue precedence on a single tick. Evaluate in this order and play only the first that produces a cue:
1. The world-event cue.
2. The behavior-transition cue.
3. The AR-presentation-transition cue.
4. The path soft cue.

This follows `docs/AUDIO_ASSET_CONTRACT.md:7-10`. The first seed of a behavior or presentation is silent (`AudioExperienceLayer.swift:66-67`, `:90-91`). Path cues are suppressed while pursuit is `noticed`, `approaching`, or `close` (`PathAudioCoupling.swift:17-18`).

**PRS-037** (GAP-P-AUDIO-08). Pause, stop, and end behavior.

| Event | Behavior | Source |
|---|---|---|
| Pause | Pause all channels. Ignore new cues while paused. | `AppAudioCuePlayer.swift:385-392`, `:78` |
| Resume | Resume. | |
| Stop or session end | Fade to 0 over **250 ms**, then stop. | `AppAudioCuePlayer.swift:429-437` |
| Fail or permission loss | Stop with no fade. | `WaykinApp.swift:1474` |

**PRS-038** (GAP-P-AUDIO-09). Playback mode. Every AudioComponent uses `Audio.PlaybackMode.LowPower`, which is the Spectacles default (Snap *Audio in Spectacles*). No cue requires sub-frame latency.

**PRS-039** (GAP-P-AUDIO-10). Missing or silent asset. When an asset is missing or silent, play nothing, log once, and never crash (`App/Resources/Audio/README.md:31-32`). The four moment files are silent placeholders today (`README.md:17-22`).

---

## §3 UI (UI)

### 3.1 Placement grammar

**PRS-050** (GAP-P-UI-01). Comfort distance.
- Panels sit at **1.1 m**, the full binocular-overlap distance (Snap design doc).
- No UI element sits closer than **0.8 m**. **DECISION (proposed) D-211.**
- Angles in this section are measured from the head forward vector. Positive values are up or right.

**PRS-051** (GAP-P-UI-02). Follow modes.
- **World-panel** elements (intro, summary, error): placed once in front of the head at 1.1 m and −5° pitch, with yaw billboarding.
- **Glance HUD** elements: head-locked lazy follow. Position smoothing τ = **0.35 s**. Re-center when the head moves more than 15° from the anchor (SIK follow component, platform knowledge, verify). **DECISION (proposed) D-212.**

**PRS-052** (GAP-P-UI-03). Color and readability. Black renders as transparent (Snap *Publishing*). Rules:
- Text uses `#E6EAF0` (Night textPrimary, `App/Theme/WKTokens.swift:48`) on the UI Kit backplate.
- Accents use Night guide `#4A9E98` and bond `#B8894A` (`WKTokens.swift:51-54`).
- State is never conveyed by color alone (`docs/design/WAYKIN_UIUX_SPEC.md:202-209`).

**PRS-053** (GAP-P-UI-04). Targets and text sizes. **DECISION (proposed) D-213.**

| Item | Minimum |
|---|---|
| Pinchable or pokable target | **4.0 × 4.0 cm** at 1.1 m (~2.1°) |
| Spacing between targets | 1.0 cm |
| Body text cap height | 1.2 cm (~0.6°) |
| Title text cap height | 2.0 cm |

Exact Spectacles legibility thresholds are unknown, so these minimums are provisional (NC-31).

**PRS-054** (GAP-P-UI-05). Components. Use the Spectacles UI Kit `CapsuleButton` and `RectangleButton` (Snap *UI Kit Button*) with `Play Audio` on. Input comes from the SIK hand ray, pinch, and poke (Snap *SIK Get Started*). Every button has three interaction states:
- `default`
- `hover`: the UI Kit highlight
- `inactive`: the UI Kit `Inactive` flag, which renders it as non-interactive

### 3.2 Element inventory

All copy below is verbatim. Copy taken from iOS cites its source. New copy is part of D-214.

**PRS-055** (GAP-P-UI-06). Intro panel (world-panel, 30 × 22 cm).
- Title: `Waykin`
- Lines (`App/Onboarding/OnboardingFlowView.swift:55-57`):
  - `A companion bound to your movement.`
  - `Listen more than look.`
  - `You can stop anytime.`
- Buttons:
  - Primary `CapsuleButton`, 14 × 5 cm: `Begin Walk`
  - Secondary `RectangleButton`, 14 × 4.5 cm: `Demo Walk`
- Begin Walk is primary and Demo Walk is secondary, per the iOS product law (`WAYKIN_UIUX_SPEC.md:121-126`).
- Footer line, shown only when Bond > 0: `Lira · Bond {n}` (`App/CompanionPresenceView.swift:229`).

**PRS-056** (GAP-P-UI-07). Glance HUD, active walk only. This is the equivalent of iOS `GlassesGlanceSnapshot.hudLines` (`App/Wearables/GlassesGlanceSnapshot.swift:19-32`).
- Anchor: 1.1 m, −8° yaw, −11° pitch, which is the lower-left of the display.
- Size: 18 × 10 cm.
- Up to 3 text lines, plus the control row in PRS-057.

| Line | Content | Source |
|---|---|---|
| 1 | phrase | `CompanionPresenceView.swift:24-69` |
| 2 | path/pressure label | `CompanionPresenceView.swift:140-151` |
| 3 | `{m:ss} · {n} m` | `CompanionPresenceView.swift:119-124` |

- When paused, line 3 is followed by `Paused` (`GlassesGlanceSnapshot.swift:25-27`).
- Update text no faster than **1 Hz**, except for phrase changes. **DECISION (proposed) D-215.**
- There is no map (`spec.md:103`).

**PRS-057** (GAP-P-UI-08). Control row, attached under the HUD.
- `Pause` `CapsuleButton`, 6 × 4 cm. While paused, it is replaced by `Resume`.
- `End` `CapsuleButton`, 6 × 4 cm. End uses the neutral text color, never red (`WAYKIN_UIUX_SPEC.md:83-84`).
- Both are always visible and reachable in one interaction (`spec.md:98`, `:131`).
- Labels follow `App/AR/CanonicalARSessionView.swift:338-374`.

**PRS-058** (GAP-P-UI-09). Summary panel (world-panel, 30 × 26 cm).

| Element | Copy | Source |
|---|---|---|
| Title | `Session Summary` | `WaykinApp.swift:2896` |
| Closing phrase | closing phrase | `CompanionPresenceView.swift:71-77` |
| Memory line | memory line | `Sources/WaykinCore/Experiences/Experiences.swift:265-289` |
| Metric: time | `Time` / `m:ss` | |
| Metric: distance | `Distance` / `{n} m` | |
| Metric: events | `Moments` / `{count}` | D-214 |
| Bond change | `Bond +{d}` / `Bond {d}` / `Bond held` | `WaykinApp.swift:3017-3022` |
| Path line | path line | `Sources/WaykinCore/Path/WalkPathCopy.swift:7-22` |
| Button | `Done` | returns to Intro |

**PRS-059** (GAP-P-UI-10). Memories list. It is reached from Intro through a `RectangleButton` labeled `Memories`. It lists the last 5 memory lines, newest first (`spec.md:101`). When empty, it shows `Walk with Lira to write your first memory.` (`WaykinApp.swift:1925`).

**PRS-060** (GAP-P-UI-11). Status toasts. **DECISION (proposed) D-216.** The Lens shows no toasts. Status appears in HUD line 2 for 4 s, using this verbatim copy:
- `Location signal is temporarily weak.` (`WaykinApp.swift:1427`)
- `Looking for Lira again` (`App/AR/ARContinuityHint.swift:18-20`), shown on replant after tracking loss.

**PRS-061** (GAP-P-UI-12). Version label. The Intro footer shows `v{x.y.z}` in tertiary text at 1.0 cm. The Lens logs `Lens Opened: v{x.y.z}` at startup (Snap *Publishing* checklist).

---

## §4 Onboarding and permissions (ONB)

**PRS-070** (GAP-P-ONB-01). The flow runs on first launch only. The Lens stores `onboardingCompletedV1 = true` in persistent storage (Snap *Persistent Storage*).

1. **Intro panel**, the PRS-055 content with a `Continue` button.
2. **Permissions panel.** Title `What we ask for`.
   - Body: `Calm, non-coercive. Deny anything and Demo Mode still works.` (`OnboardingFlowView.swift:78`)
   - Row: `Location` — `During a real walk only — distance, pace, and path progress. Not for ads.` (`OnboardingFlowView.swift:84-85`)
   - Note: `Spectacles will ask before using location.` (D-214)
   - Buttons: `Continue`, and `Not now — use Demo Mode` (`OnboardingFlowView.swift:107`). Both go to step 3.
3. **Safety panel.** Title `Safety`, followed by these bullets verbatim (`OnboardingFlowView.swift:228-232`):
   - `Stay aware of traffic, terrain, weather, and other people.`
   - `Use a safe volume — leave room to hear the world.`
   - `Pause or end anytime. Stopping is never a failure.`
   - `Hunt pressure is controlled fiction — not real danger.`
   - `Do not use while driving or operating machinery.`
   - Button: `I understand`. It sets the flag, plays `companionReveal`, and opens Intro.

**CORRECTION.** The iOS bullets "AR is optional…" and "Health readings…" (`OnboardingFlowView.swift:233-234`) are dropped. On Spectacles, AR is the medium, and the Lens has no Health data (`spec.md:103`).

**PRS-071** (GAP-P-ONB-02). The system permission prompt appears at the first `Begin Walk`, not at launch. The prompt itself and the LED are system-owned under Transparent Permission (Snap *Transparent Permission*). The Lens requests only RawLocation and Internet (`spec.md:102`).

**PRS-072** (GAP-P-ONB-03). Denial and failure handling. Each case shows a world error panel with the copy below and two buttons, `Demo Walk` and `Back`:

| Case | Copy | Source |
|---|---|---|
| Denied | `Location access is required for a real walk. Demo Walk is still available.` | `WaykinApp.swift:958` |
| Services or phone unavailable | `Location Services are unavailable. Demo Walk is still available.` | `WaykinApp.swift:936` |
| Lost mid-walk | `Location became unavailable. The walk was stopped safely.` | `WaykinApp.swift:1413` |

After a mid-walk loss, the Lens shows the summary (`spec.md:79`).

**PRS-073** (GAP-P-ONB-04). The Settings path `Replay safety & onboarding` (`WaykinApp.swift:2178`) is available as a `RectangleButton` on the Memories panel. It clears the flag and runs PRS-070.

---

## §5 Accessibility (A11Y)

**PRS-080** (GAP-P-A11Y-01). Non-color redundancy. Every Lira state has a shape cue (the PRS-009 scale and indicator, plus the alert echo) **and** an audio cue (§2). Every HUD state has a text label (`WAYKIN_UIUX_SPEC.md:202-209`).

**PRS-081** (GAP-P-A11Y-02). Reduce Motion. **NEEDS CLARIFICATION NC-30.** No source confirms that Spectacles exposes an OS Reduce Motion setting.

Safe default: provide an in-Lens toggle, `Reduce motion`, on the Memories panel, persisted. When it is on:
- Looping clips freeze at frame 0.
- Spawn coalesce takes 0.12 s.
- Panel transitions are ≤ 120 ms (`App/Theme/WKTokens.swift:164`).
- HUD lazy-follow τ = 0.

This follows the iOS motion law (`WAYKIN_UIUX_SPEC.md:194-200`). To measure: check the Lens Studio API docs for an accessibility flag.

**PRS-082** (GAP-P-A11Y-03). Audio carries meaning. Every event has a cue, so a walker who doesn't look still gets presence. This is the pocket-first principle (`WAYKIN_UIUX_SPEC.md:79-81`). The Lens has no flashing and no full-screen pulse (`WAYKIN_UIUX_SPEC.md:197-200`).

**PRS-083** (GAP-P-A11Y-04). Input. Every action works with both pinch-ray and poke. Every target meets PRS-053. The Lens uses no gesture-only actions. **DECISION (proposed) D-217:** voice input is excluded. ASR adds microphone permission (Snap *Permissions overview*).

**PRS-084** (GAP-P-A11Y-05). Volume. The Lens never exceeds the PRS-032 gains. The system volume is the only master control. The Safety panel reminds the walker about volume (PRS-070).

---

## §6 Performance budgets (PERF)

**PRS-090** (GAP-P-PERF-01). Frame rate and power.
- The Lens sustains **60 FPS**, which means a frame time of **≤ 16.67 ms** (Snap *Lens Performance Overlay*).
- Lens CPU and GPU stay **< 100%** of the budget. The 100-125% band counts as a failure for publish (`spec.md:127`).

**PRS-091** (GAP-P-PERF-02). Content budgets. **NEEDS CLARIFICATION NC-31.** Snap publishes no numeric triangle or draw-call caps in the excerpts. The values below are safe defaults, measured against PRS-090.

| Budget | Default | Basis |
|---|---|---|
| Lira triangles | ≤ 15,000 | NC-31 |
| Whole-scene triangles | ≤ 25,000 | NC-31 |
| Lira skeleton joints | ≤ 24 (current fox rig) | `LiraARAssetCatalog.swift:27-29` |
| Skin influences per vertex | ≤ 4 | `ArtSource/Companion/Lira/BUILD_MANIFEST.json:29-30` |
| Draw calls, whole Lens | ≤ 20 | NC-31 |
| Lira materials | 1 body + 1 FX (shadow/echo) | Snap optimization guide: reduce materials |
| Textures | ≤ 512×512 each (body albedo may be 1024×1024 with justification), compressed | Snap: 512px or smaller |
| PBR | none; unlit or simple lit | Snap: avoid PBR |
| Shadows / reflections / env maps | none | Snap |
| Audio memory | ≤ 4 MB total decoded | D-218 |
| Script per-frame | ≤ 2.0 ms main-thread JS/TS | D-219 |
| Lens package size | ≤ 25 MB (target ≤ 15 MB) | Snap *Publishing* |

**PRS-092** (GAP-P-PERF-03). Script rules. Run at most one `UpdateEvent` for presentation (follow, layers, HUD). Run the 1 Hz location poll and the 1 s continuity check on `DelayedCallbackEvent` (Snap *Location* doc). Allocate no objects inside the update loop (Snap *Optimizing Lens Performance*).

**PRS-093** (GAP-P-PERF-04). Degrade path (FR-018). **NEEDS CLARIFICATION NC-32.** No source identifies a script-readable thermal or power signal.

Safe default: if the measured FPS, computed as an EMA of `getDeltaTime`, stays below **50 for 5 s**, then:
1. Disable Lira's looping clips.
2. Show a static pose.
3. Hide the hunter echo.
4. Keep all audio.

Restore only when FPS stays above 58 for 30 s. To measure: run the overlay across the 15-minute protocol (`quickstart.md:55-60`).

**PRS-094** (GAP-P-PERF-05). How to measure.
- Use the on-device Performance Overlay, or the Spectacles Monitor with the overlay off, for precise values (Snap overlay doc).
- Use Perfetto for CPU hotspots (Snap optimization guide).
- Record measurements at 0, 5, 10, and 15 minutes (`quickstart.md:59`).
- Results stay `NOT_COMPUTABLE` until a device receipt exists.

---

## §7 Asset pipeline (ASSET)

**PRS-100** (GAP-P-ASSET-01). Model source. The authoritative mesh is the Ember Fox USDZ, `App/Resources/Lira_AR_Base.usdz` (evidence class `MESHY_EMBER_FOX_WALK_V1`; `App/Resources/Companion/Lira/README.md:1-16`). Do not modify it in place. All derived work goes under `ArtSource/Companion/Lira/spectacles/`.

**PRS-101** (GAP-P-ASSET-02). Export steps. **DECISION (proposed) D-220:** use the glTF binary (`.glb`) path. Lens Studio imports glTF with Draco compression (Snap *glTF Import*).

1. Import the USDZ into Blender with File › Import › USD (platform knowledge, verify).
2. Set scale so the companion stands 0.72 m tall. Apply transforms. Place the origin at the ground center.
3. Decimate to the PRS-091 triangle budget. Keep the skeleton and weights. Cap influences at 4.
4. Bake textures to the PRS-091 resolutions: albedo PNG, plus optional normal at 512.
5. Name animation actions per PRS-102. Push each action to the NLA.
6. Export glTF 2.0 Binary: `+Y up`, animations on, Draco compression on, and "Convert meters to centimeters" checked on Lens Studio import (Snap glTF import options).
7. Verify in the Lens Studio Preview that height is 72 cm and that the walk drives the skeleton.

**PRS-102** (GAP-P-ASSET-03). Naming conventions.
- Models: `lira_<part>.glb`
- Animation actions: `lira_<clipid>` in lower snake case, matching PRS-004
- Textures: `lira_<map>_<res>.png`
- Audio: the iOS basenames, unchanged, as `.wav`

Reuse is a decision: **DECISION (proposed) D-221** keeps one name per semantic cue across platforms.

**PRS-103** (GAP-P-ASSET-04). Audio conversion. **DECISION (proposed) D-218.**
- Lira-attached and "behind" cues: WAV, 48 kHz, 16-bit, **mono**. Spatial emitters need mono.
- Head-locked moment cues and `quiet_shift`: 48 kHz, 16-bit, stereo.
- Loudness: −18 LUFS, true peak ≤ −3 dBTP (`docs/design/LIRA_AUDIO_CUE_FAMILY.md:53-55`).
- Format: WAV, not MP3 (Snap optimization guide).

**PRS-104** (GAP-P-ASSET-05). Full manifest (Lens project paths). In the `Exists?` column, **TODO** means the item must be authored. Until it is, the PRS-005 fallback applies.

| Target path | Type | Source | Exists? |
|---|---|---|---|
| `Assets/Lira/lira_fox.glb` | mesh + skeleton + embedded walk → `lira_follow` | `App/Resources/Lira_AR_Base.usdz` | derive |
| `Assets/Lira/lira_albedo_1024.png` | texture | baked from USDZ | derive |
| `Assets/Lira/lira_shadow_256.png` | contact shadow disc | new (radial alpha) | TODO |
| action `lira_idle` | clip, loop | new | TODO (NC-33) |
| action `lira_investigate` | clip, loop | new | TODO (NC-33) |
| action `lira_alert` | clip, loop | new | TODO (NC-33) |
| action `lira_celebrate` | clip, one-shot 0.55 s | new | TODO (NC-33) |
| action `lira_spawn` | clip, one-shot 0.70 s | new | TODO (NC-33) |
| `Assets/Audio/companion_near.wav` | mono | `App/Resources/Audio/companion_near.wav` | convert |
| `Assets/Audio/companion_ahead.wav` | mono | same dir | convert |
| `Assets/Audio/distant_presence.wav` | mono | same dir | convert |
| `Assets/Audio/pursuit_pressure.wav` | mono | same dir | convert |
| `Assets/Audio/pursuit_release.wav` | mono | same dir | convert |
| `Assets/Audio/bond_motif.wav` | mono | same dir | convert |
| `Assets/Audio/quiet_shift.wav` | stereo | same dir | copy |
| `Assets/Audio/lira_launch_theme.wav` | stereo | same dir (silent placeholder) | copy |
| `Assets/Audio/lira_companion_reveal.wav` | stereo | same (placeholder) | copy |
| `Assets/Audio/lira_spawn_theme.wav` | mono | same (placeholder) | convert |
| `Assets/Audio/lira_bond_milestone.wav` | stereo | same (placeholder) | copy |
| `Assets/UI/lira_glyph_dawn_256.png` | intro icon / Lens icon source | `docs/assets/companion/generated/glyphs/Lira_Glyph_Dawn.png` | resize |
| Lens preview image, 3:4 | publish | capture | TODO (Snap *Publishing*) |

**NEEDS CLARIFICATION NC-33.** The source doesn't say who authors the fox-rig per-state clips, or when (`intent/2026-10-11-spectacles-retarget.md:38`). Safe default: ship with the PRS-005 fallbacks.

**PRS-105** (GAP-P-ASSET-06). Fonts. The Lens uses the UI Kit default font. **DECISION (proposed) D-222:** do not import `WaykinDisplay`. It is uppercase-only (`App/Branding/WaykinTypography.swift:41-44`).

---

## Appendix A — Gaps closed

| Gap ID | Gap | Resolution | Citation |
|---|---|---|---|
| GAP-P-LIRA-01 | State vocabulary | source | `CompanionPresentationState.swift:4-17` |
| GAP-P-LIRA-02 | 3-4 behaviors vs 5 states | decision D-200 | `spec.md:95` |
| GAP-P-LIRA-03 | Celebrate duration | source | `CompanionPresentationState.swift:39` |
| GAP-P-LIRA-04 | Clip names and durations | source | `LiraSkeletalAnimationLibrary.swift:20-45` |
| GAP-P-LIRA-05 | Missing state clips | decision D-201 | `LiraARAssetCatalog.swift:24-48` |
| GAP-P-LIRA-06 | Walk pause when settled | source | `ARWorldCommandRenderer.swift:505-508` |
| GAP-P-LIRA-07 | Crossfade times | source | `LiraSkeletalPlayer.swift:40` |
| GAP-P-LIRA-08 | Loop watchdog | source | `ARWorldCommandRenderer.swift:344` |
| GAP-P-LIRA-09 | Per-state scale and indicator | source | `ARWorldCommandRenderer.swift:840-886` |
| GAP-P-LIRA-10 | Spawn coalesce | source | `LiraARMotion.swift:210-223` |
| GAP-P-LIRA-11 | Pursuit visual | source | `LiraARMotion.swift:185-201`; `spec.md:97` |
| GAP-P-LIRA-12 | Height and ground | source | `CompanionVisualConfiguration.swift:9`; `ARPlacementResolver.swift:136` |
| GAP-P-LIRA-13 | Follow target out of FOV | correction D-202 | `ARWorldCommandRenderer.swift:521-523` |
| GAP-P-LIRA-14 | Band distances | decision D-203 | `CanonicalARWorldCommandMapper.swift:182-192` |
| GAP-P-LIRA-15 | Speed matching | source | `ARWorldCommandRenderer.swift:412-419` |
| GAP-P-LIRA-16 | Look-at | source + D-204 | `ARWorldCommandRenderer.swift:510-538` |
| GAP-P-LIRA-17 | Occlusion | decision D-205 | Snap *Permissions* |
| GAP-P-LIRA-18 | Continuity | source | `ARPlacementResolver.swift:9-10` |
| GAP-P-LIRA-19 | Replant target | source + D-202 | `ARPlacementResolver.swift:175-179` |
| GAP-P-LIRA-20 | Tracking loss | source + D-206 | `ARWorldCommandRenderer.swift:690-698` |
| GAP-P-LIRA-21 | Out-of-FOV | decision D-207 | Snap design doc |
| GAP-P-LIRA-22 | Heading | platform | Snap *Location* |
| GAP-P-LIRA-23 | Skins | decision D-208 | `LiraSkin.swift:13` |
| GAP-P-AUDIO-01 | Semantics in core | source | `spec.md:93` |
| GAP-P-AUDIO-02 | Gain formula | source | `AppAudioCuePlayer.swift:352` |
| GAP-P-AUDIO-03 | Cue table | source | `AppAudioCuePlayer.swift:35-48` |
| GAP-P-AUDIO-04 | Spatialization | decision D-209 | `AudioExperienceLayer.swift:110-127` |
| GAP-P-AUDIO-05 | Concurrency | source | `AppAudioCuePlayer.swift:77-97` |
| GAP-P-AUDIO-06 | Ducking | decision D-210 | `AppAudioCuePlayer.swift:16-19` |
| GAP-P-AUDIO-07 | Precedence | source | `AUDIO_ASSET_CONTRACT.md:7-10` |
| GAP-P-AUDIO-08 | Pause, stop, fade | source | `AppAudioCuePlayer.swift:429-437` |
| GAP-P-AUDIO-09 | Playback mode | platform | Snap *Audio* |
| GAP-P-AUDIO-10 | Missing asset | source | `Audio/README.md:31-32` |
| GAP-P-UI-01 | Distance | platform + D-211 | Snap design doc |
| GAP-P-UI-02 | Follow behavior | decision D-212 | — |
| GAP-P-UI-03 | Colors on additive display | source + platform | `WKTokens.swift:48-54`; Snap *Publishing* |
| GAP-P-UI-04 | Target sizes | decision D-213, NC-31 | — |
| GAP-P-UI-05 | Components | platform | Snap *UI Kit Button* |
| GAP-P-UI-06 | Intro panel | source + D-214 | `OnboardingFlowView.swift:55-57` |
| GAP-P-UI-07 | Glance HUD | source + D-215 | `GlassesGlanceSnapshot.swift:19-32` |
| GAP-P-UI-08 | Controls | source | `CanonicalARSessionView.swift:338-374` |
| GAP-P-UI-09 | Summary panel | source | `WaykinApp.swift:3017-3022` |
| GAP-P-UI-10 | Memories list | source | `spec.md:101` |
| GAP-P-UI-11 | Status messages | decision D-216 | `WaykinApp.swift:1427` |
| GAP-P-UI-12 | Version label | platform | Snap *Publishing* |
| GAP-P-ONB-01 | Flow | source + correction | `OnboardingFlowView.swift:227-235` |
| GAP-P-ONB-02 | Prompt timing | platform | Snap *Transparent Permission* |
| GAP-P-ONB-03 | Denial handling | source | `WaykinApp.swift:936`, `:958`, `:1413` |
| GAP-P-ONB-04 | Replay onboarding | source | `WaykinApp.swift:2178` |
| GAP-P-A11Y-01 | Non-color redundancy | source | `WAYKIN_UIUX_SPEC.md:202-209` |
| GAP-P-A11Y-02 | Reduce Motion | NC-30 | `WAYKIN_UIUX_SPEC.md:194-200` |
| GAP-P-A11Y-03 | Audio meaning | source | `WAYKIN_UIUX_SPEC.md:79-81` |
| GAP-P-A11Y-04 | Input modes | decision D-217 | Snap *Permissions* |
| GAP-P-A11Y-05 | Volume | source | `OnboardingFlowView.swift:229` |
| GAP-P-PERF-01 | FPS and power | platform | Snap overlay doc |
| GAP-P-PERF-02 | Content budgets | NC-31, D-218, D-219 | Snap optimization guide |
| GAP-P-PERF-03 | Script rules | platform | Snap optimization guide |
| GAP-P-PERF-04 | Degrade trigger | NC-32 | `spec.md:106` |
| GAP-P-PERF-05 | Measurement | platform | Snap overlay doc |
| GAP-P-ASSET-01 | Source mesh | source | `Companion/Lira/README.md:1-16` |
| GAP-P-ASSET-02 | Export steps | decision D-220 | Snap *glTF Import* |
| GAP-P-ASSET-03 | Naming | decision D-221 | — |
| GAP-P-ASSET-04 | Audio conversion | source + D-218 | `LIRA_AUDIO_CUE_FAMILY.md:53-55` |
| GAP-P-ASSET-05 | Manifest | source + NC-33 | `LiraARAssetCatalog.swift:33-40` |
| GAP-P-ASSET-06 | Fonts | decision D-222 | `WaykinTypography.swift:41-44` |

## Appendix B — Decisions and NCs (all NEW)

| ID | Title | Recommended default | Alternatives | Why |
|---|---|---|---|---|
| D-200 | Behavior count | 4 loops + 2 one-shots | Merge investigate into idle | Satisfies FR-007 and keeps the iOS vocabulary |
| D-201 | Missing-clip fallback | Walk, paused walk, or sped-up walk | Block on authored clips | The Lens can ship before the art exists |
| D-202 | Follow target (CORRECTION) | 2.0 m ahead, 0.6 m lateral | iOS beside/behind | Behind the walker is out of FOV on glasses |
| D-203 | Band distances | 1.3 / 1.6 / 2.0 / 3.0 m | iOS meters as-is | Stays near the focus plane, peripheral |
| D-204 | Yaw slew | 180°/s | Instant | Avoids snapping |
| D-205 | Occlusion | none | World Mesh | Power and permission cost |
| D-206 | Re-show debounce | 500 ms | 0 ms | Relocalization flicker |
| D-207 | Out-of-FOV replant | 8 s outside ±25° | Edge arrow | Keeps presence without chrome |
| D-208 | Skins | Dawn only | 3 skins | Texture budget |
| D-209 | Spatial emitters | Lira / behind / head-locked | All head-locked | Direction is carried by sound |
| D-210 | Ducking | none | Duck fg −6 dB under moment | Matches iOS |
| D-211 | Minimum UI distance | 0.8 m | 0.5 m | Comfort |
| D-212 | HUD follow | lazy, τ 0.35 s, 15° | Rigid headlock | Less nausea |
| D-213 | Target and text sizes | 4 cm targets, 1.2 cm text | 3 cm | Walking-motion precision |
| D-214 | New copy | Strings marked D-214 | — | No iOS equivalent exists |
| D-215 | HUD refresh | 1 Hz | 60 Hz | Power and glanceability |
| D-216 | No toasts | HUD line 2 for 4 s | Toasts | Matches iOS (`WAYKIN_UIUX_SPEC.md:189-193`) |
| D-217 | No voice input | Off | ASR | Avoids microphone permission |
| D-218 | Audio format and memory | Mono/stereo 48k WAV, ≤ 4 MB | 24 kHz | Spatial audio needs mono |
| D-219 | Script per-frame budget | ≤ 2.0 ms | ≤ 4 ms | Headroom in a 16.67 ms frame |
| D-220 | Export format | glTF binary + Draco | FBX | Supported and compact |
| D-221 | Audio names | Keep iOS basenames | Rename | One name across platforms |
| D-222 | Font | UI Kit default | WaykinDisplay | The subset is uppercase only |
| NC-30 | OS Reduce Motion on Spectacles | In-Lens toggle | — | Unknown platform API |
| NC-31 | Tris, draw calls, legibility sizes | 15k / 25k tris, 20 draw calls, 4 cm targets | — | Snap gives no numbers; measure with the overlay |
| NC-32 | Thermal or power signal | FPS < 50 for 5 s triggers degrade | — | No documented script API |
| NC-33 | Who authors the fox clips | Ship with fallbacks | — | No owner named in the source |
