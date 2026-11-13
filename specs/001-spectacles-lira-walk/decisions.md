# Decisions log: Lira Walks With You

Status values:

- **proposed**: The recommended default. Implementers use it until Danny decides.
- **accepted**: Danny approved it; it is binding for the spec set. On 2026-10-11 at 11:03 PM PT, Danny approved every decision not marked superseded, including the companion-doc decisions in the table below.
- **superseded by CF-xx**: Overruled by the Conflicts table, which links the winning value.

Each entry ends with a decision line for Danny. Gap IDs refer to `gap-audit.md`.

### D-325 SPECS 27 build target
- **Status**: accepted (user, 2026-10-13; selected “SPECS 27; update the build target” in the build session).
- **Decision**: This Lens build targets **SPECS 27**, not Spectacles (2024). Supersedes the 2024 hardware and toolchain pins in NC-05/NC-50/NC-51 and LSB-001/003/004 for this build.
- **Toolchain pin**: Lens Studio **5.24.1.26100516**; the checked-in SIK and SUIK package artifacts each have descriptor version **2.0.0**. SIK's observed runtime banner is **0.18.0**; do not equate descriptor versions with runtime/library release versions. SUIK's separate release identity remains `NOT_COMPUTABLE`.
- **Evidence boundary**: This authorizes the target change, not physical compatibility, package API compatibility, or completed gameplay. Revalidate location, permissions, battery APIs, tracking, performance and publishing on SPECS 27. The old 2024 OS minimum and 45-minute runtime claim do not establish SPECS 27 behavior. No safety, privacy, determinism or parity requirement is waived.
- **Scope**: No additional 2024-compatible artifact is required by this build. Gameplay core ownership and existing task dependencies remain unchanged.

### D-001 Time context fed to core
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Context**: iOS real walks pass `"day"`, which isn't a `TimeContext`, so the core falls back to `.midday` (`WaykinApp.swift:170`, `Experiences.swift:83`).
- **Recommended default**: Always pass `"day"`.
- **Alternatives**: Map the local hour to `"night"` for 20:00–05:59.
- **Why**: Keeps the Lens bit-identical to iOS behavior.
- **Affects**: GAP-EVT-13, FR-002.
- **Danny**: yes / no / change

### D-002 Core tick trigger
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Context**: iOS ticks on each sample. iOS uses a 2 m distance filter (`RealLocationProvider.swift:32`); the Lens has none.
- **Recommended default**: Tick once for each fix with a new timestamp (polled every 1 s). No distance filter.
- **Alternatives**: Add a 2 m software filter.
- **Why**: The integrity filter already drops jitter below 1.5 m.
- **Affects**: GAP-CONST-19, GPS-02.
- **Danny**: yes / no / change

### D-003 Activity energy hint
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Context**: The Lens has no HealthKit (FR-015).
- **Recommended default**: `activityEnergyHint = 0`.
- **Alternatives**: None.
- **Why**: Matches the Swift default (`ExperienceProtocol.swift:24`).
- **Affects**: GAP-CONST-09.
- **Danny**: yes / no / change

### D-004 Lira clip mapping
- **Status**: superseded by CF-03
- **Context**: FR-007 allows 3–4 behaviors. The source has 5 presentation states.
- **Recommended default**: Superseded: see CF-03 (winner: D-302 rig with `Lira_Idle`, `Lira_Follow`, `Lira_Investigate`, `Lira_Alert`, `Lira_Celebrate`, `Lira_Spawn`; PRS-004 IDs map to these; PRS-005 fallbacks for missing actions)
- **Why**: Smallest bone and animation budget.
- **Affects**: GAP-LIRA-01, ASSET-04, FR-007.
- **Danny**: yes / no / change

### D-005 Follow target ahead of the walker (correction to iOS)
- **Status**: superseded by CF-01
- **Context**: iOS settles 0.25 m behind and 0.8 m right (`ARWorldCommandRenderer.swift:523`). On glasses, that spot is out of view.
- **Recommended default**: Superseded: see CF-01 (winner: D-202/D-203 band table forward distance, lateral +0.6 m on Lira's current side (default right))
- **Why**: Content is fully overlapped at ≥ 1.1 m (SNAP spatial-design).
- **Affects**: GAP-LIRA-03.
- **Danny**: yes / no / change

### D-006 Follow hysteresis for the ahead target
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**:
  - Start moving when the distance to the target is > 1.8 m.
  - Stop at ≤ 0.45 m.
  - Speed `clamp(walkerEMA×1.35, 1.35, 5.0)` m/s.
  - Ignore a gap > 60 m and re-plant instead.
- **Alternatives**: iOS 3.2 / 1.4 m.
- **Why**: A target ahead of the walker needs a tighter leash than one beside them.
- **Affects**: GAP-LIRA-04.
- **Danny**: yes / no / change

### D-007 Lead mode deferred
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**: Follow only. There is no escort toggle.
- **Alternatives**: Port lead mode (2.0 m, 0.45 m deadband).
- **Why**: D-005 already keeps Lira ahead of the walker.
- **Affects**: GAP-SM-06.
- **Danny**: yes / no / change

### D-008 Re-plant rule
- **Status**: superseded by CF-18
- **Recommended default**: Superseded: see CF-18 (winner: PRS-018 (> 6 m and behind, checked every 1 s) plus PRS-021 (8 s outside ±25°))
- **Why**: Avoids visible jumps (`ARPlacementResolver.swift:306-311`).
- **Affects**: GAP-LIRA-06, LIRA-07.
- **Danny**: yes / no / change

### D-009 No occlusion
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**: Use no world mesh and no depth occlusion.
- **Why**: Saves power (SNAP optimizing doc).
- **Affects**: GAP-LIRA-08.
- **Danny**: yes / no / change

### D-010 Omit hunter echo and status orb
- **Status**: superseded by CF-19
- **Recommended default**: Superseded: see CF-19 (winner: render hunter echo per PRS-011, alert state only, hidden while degraded)
- **Why**: Fewer draw calls.
- **Affects**: GAP-LIRA-12.
- **Danny**: yes / no / change

### D-011 Dawn skin only
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**: One material, using the Dawn palette (`CompanionEntityFactory.swift:43-50`).
- **Affects**: GAP-LIRA-14.
- **Danny**: yes / no / change

### D-012 Discovery and threat visuals
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**: No entities. On a discovery event (presence, familiar, observes), play a 0.6 s scale pulse of 1.0→1.08→1.0 on the Lira root. Threat is shown by the alert clip plus audio only.
- **Why**: FR-009.
- **Affects**: GAP-EVT-15, LIRA-16.
- **Danny**: yes / no / change

### D-013 Spatial audio sources
- **Status**: superseded by CF-07
- **Recommended default**: Superseded: see CF-07 (winner: D-209 spatial emitters; fallback D-306 all non-spatial if AudioComponent spatial unavailable)
- **Spatial audio support**: (PK, verify).
- **Affects**: GAP-AUDIO-04.
- **Danny**: yes / no / change

### D-014 Playback modes
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**: All cues use LowPower. UI clicks use LowLatency.
- **Why**: SNAP audio doc.
- **Affects**: GAP-AUDIO-05.
- **Danny**: yes / no / change

### D-015 Moment cues
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**:
  - `spawnTheme` at the first accepted real-walk start (not in Demo).
  - `bondMilestone` on the summary when delta > 0, once per sessionId.
  - No launch theme or companion reveal.
- **Note**: The files are silent placeholders (`Audio/README.md:17-24`).
- **Affects**: GAP-AUDIO-06.
- **Danny**: yes / no / change

### D-016 No ducking
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**: Three channels play concurrently: foreground, ambient, and moment. There is no ducking.
- **Affects**: GAP-AUDIO-07.
- **Danny**: yes / no / change

### D-017 Audio format
- **Status**: superseded by CF-20
- **Recommended default**: Superseded: see CF-20 (winner: D-218: 48 kHz/16-bit; mono for spatial, stereo for head-locked; ≤ 4 MB, per PRS-104 manifest)
- **Why**: Mono suits spatial sources and halves file size.
- **Affects**: GAP-AUDIO-08.
- **Danny**: yes / no / change

### D-018 Panels and placement
- **Status**: superseded by CF-23 and CF-24
- **Recommended default**: Superseded: see CF-23 (winner: 1.1 m, −5° pitch) and CF-24 (winner: union panel inventory: Intro(Home), Permissions, Safety, HUD, Summary, Memories, Recovery, Error (replaces Notice), Debug (D-055))
- **Affects**: GAP-UI-01, UI-02.
- **Danny**: yes / no / change

### D-019 Walk HUD placement
- **Status**: superseded by CF-11 and CF-21
- **Recommended default**: Superseded: see CF-11 (winner: PRS-056 with D-212 follow; 1.1 m, −8° yaw, −11° pitch, 18×10 cm) and CF-21 (winner: PRS-056 3 lines, no chip)
- **Why**: FR-011 requires glanceable, peripheral content.
- **Affects**: GAP-UI-06.
- **Danny**: yes / no / change

### D-020 Pause and End controls
- **Status**: superseded by CF-22
- **Recommended default**: Superseded: see CF-22 (winner: PRS-053 and PRS-057: 6×4 cm controls, 4×4 cm minimum)
- **Affects**: GAP-UI-10, SCENE-03, A11Y-05.
- **Danny**: yes / no / change

### D-021 No End confirmation
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**: End goes directly to the summary.
- **Why**: Satisfies SC-007 and matches iOS.
- **Affects**: GAP-UI-12, TEST-04.
- **Danny**: yes / no / change

### D-022 Additive-display colors
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**:
  - Text #E6EAF0 and accent #4A9E98.
  - Chip colors from GAP-LIRA-13.
  - No dark fills; use outline frames 2 mm wide.
- **Why**: Black renders transparent on the display.
- **Affects**: GAP-UI-13.
- **Danny**: yes / no / change

### D-023 Fifteen-minute suggestion
- **Status**: superseded by CF-05
- **Recommended default**: Superseded: see CF-05 (winner: D-107 timings (15:00, 20:00, 30:00 hard end), BEH-031 copy, rendered per D-216 as HUD line 2 for 4000 ms)
- **Affects**: GAP-UI-16.
- **Danny**: yes / no / change

### D-024 Typography
- **Status**: superseded by CF-22
- **Recommended default**: Superseded: see CF-22 (winner: PRS-053 and PRS-057: controls 6×4 cm, text 1.2 / 2.0 cm, 4×4 cm minimum)
- **Affects**: GAP-UI-17, A11Y-04.
- **Danny**: yes / no / change

### D-025 Onboarding flow
- **Status**: superseded by CF-14
- **Recommended default**: Superseded: see CF-14 (winner: PRS-070 flow and verbatim copy; PRS-073 replay from Memories)
- **Affects**: GAP-ONB-01.
- **Danny**: yes / no / change

### D-026 Safety bullets
- **Status**: superseded by CF-14
- **Recommended default**: Superseded: see CF-14 (winner: PRS-070 flow and verbatim copy)
- **Source**: Adapted from `OnboardingFlowView.swift:227-235`.
- **Affects**: GAP-ONB-03.
- **Danny**: yes / no / change

### D-027 Disclosure copy
- **Status**: superseded by CF-14
- **Recommended default**: Superseded: see CF-14 (winner: PRS-070 flow and verbatim copy)
- **Affects**: GAP-ONB-05.
- **Danny**: yes / no / change

### D-028 Onboarding flag and replay
- **Status**: superseded by CF-14
- **Recommended default**: Superseded: see CF-14 (winner: PRS-070 flow and verbatim copy; PRS-073 replay from Memories)
- **Affects**: GAP-ONB-06, ONB-07.
- **Danny**: yes / no / change

### D-029 Storage keys
- **Status**: superseded by CF-10
- **Recommended default**: Superseded: see CF-10 (winner: D-112 `waykin.profile.v1` JSON; onboarding key `profile.onboardingDone`; Reduce Motion `profile.reduceMotion` bool default false; LSB §6 keys and `waykin.session.count` removed)
- **Affects**: GAP-PERSIST-02.
- **Danny**: yes / no / change

### D-030 Memory format
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**: Each entry is `{id, endedAt(ms), mode, activeTime(s), distance(m, int), eventKinds[], bondDelta, line, endedReason}`. Keep the newest 5.
- **Affects**: GAP-PERSIST-03.
- **Danny**: yes / no / change

### D-031 Migration policy
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**: If the `waykin.profile.v1` version ≠ 1, keep Bond when it is an int ≥ 0, clear the other profile fields, and write version 1.
- **Affects**: GAP-PERSIST-04.
- **Danny**: yes / no / change

### D-032 Store-full and write-fail policy
- **Status**: superseded by CF-12
- **Recommended default**: Superseded: see CF-12 (winner: on write failure: (1) delete `waykin.receipt.last.v1` and retry; (2) drop the oldest memory and retry; (3) show ERR-PERSIST-04; never call `clear()`)
- **Affects**: GAP-PERSIST-05, ERR-05.
- **Danny**: yes / no / change

### D-033 Single idempotent write
- **Status**: superseded by CF-13
- **Recommended default**: Superseded: see CF-13 (winner: BEH-042 idempotency key = checkpoint `startedAt`; D-108 RecoveryPanel at ≤ 24 h, silent finalize at > 24 h)
- **Affects**: GAP-PERSIST-06.
- **Danny**: yes / no / change

### D-034 Checkpoint and crash recovery
- **Status**: superseded by CF-13
- **Recommended default**: Superseded: see CF-13 (winner: BEH-042 idempotency key = checkpoint `startedAt`; D-108 RecoveryPanel at ≤ 24 h, silent finalize at > 24 h)
- **Affects**: GAP-LIFE-03, LIFE-04, TEST-03.
- **Danny**: yes / no / change

### D-035 First-fix timeout
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**: If no accepted sample arrives within 30 s, show ERR-GPS-02 "No GPS fix yet. Try outside, or start Demo Walk." with the buttons "Try again" and "Demo Walk" on ErrorPanel. No session is recorded.
- **Affects**: GAP-LIFE-02.
- **Danny**: yes / no / change

### D-036 Lens OS pause
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**: On the Lens pause/blur event if T069 finds one (PK, verify the event name), call `pause()`. Otherwise use the BEH-029 > 5 s frame-gap proxy. Don't auto-resume. Both lead to an implicit pause and ERR-LIFE-02 with no auto-resume.
- **Why**: Mirrors iOS lifecycle suspend (`WaykinApp.swift:1434-1452`).
- **Affects**: GAP-SM-07, LIFE-10.
- **Danny**: yes / no / change

### D-037 Stale location
- **Status**: superseded by CF-09
- **Recommended default**: Superseded: see CF-09 (winner: D-111; degraded shows ERR-GPS-03 in HUD line 2; lost ends with reason `locationLost` and summary; no auto-pause)
- **Affects**: GAP-LIFE-08, ERR-03.
- **Danny**: yes / no / change

### D-038 Distance formula
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**: Haversine with R = 6 371 008.8 m. Movement vectors must match within ±0.05 m (D-100).
- **Affects**: GAP-GPS-05.
- **Danny**: yes / no / change

### D-039 Reported speed
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**: Pass `NaN`, which triggers the displacement/time fallback. Pass altitude through.
- **Affects**: GAP-GPS-07.
- **Danny**: yes / no / change

### D-040 Core exception handling
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**: Wrap each tick in try/catch. On error, end the walk with reason `error` and show the toast "Something went wrong. Your walk was saved."
- **Affects**: GAP-ERR-04.
- **Danny**: yes / no / change

### D-041 Motion comfort
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Context**: Walking while wearing additive displays creates vestibular risk (`App/Theme/WKTokens.swift:157-165`).
- **Recommended default**:
  - No camera shake, no full-view flashes, and no screen pulses.
  - Lira's speed is ≤ 5.0 m/s and her yaw slew is ≤ 180°/s (D-204).
  - HUD position smoothing uses τ 0.35 s (D-212).
  - The in-Lens "Reduce motion" toggle comes from NC-30 / PRS-081.
- **Alternatives**: No toggle.
- **Why**: There is no confirmed OS-level Reduce Motion setting on Spectacles.
- **Affects**: GAP-A11Y-03, PRS-081, PRS-082.
- **Danny**: yes / no / change

### D-042 Audio captions via HUD phrase
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**:
  - Every played cue coincides with an update to HUD line 1, the phrase (`CompanionPresenceView.swift:24-69`).
  - The cue and the phrase come from the same tick result.
  - If the phrase is unchanged, there is no extra text.
  - There are no separate caption strings.
- **Alternatives**: A caption line per cue.
- **Why**: Caption lines would add HUD text and break the ≤ 3-line rule (PRS-056).
- **Affects**: GAP-A11Y-02.
- **Danny**: yes / no / change

### D-043 Draw-call budget
- **Status**: superseded by CF-31
- **Recommended default**: Superseded: see CF-31 (winner: ≤ 20 draw calls; ≤ 25 bones (the `.blend` rig))
- **Affects**: GAP-PERF-05.
- **Danny**: yes / no / change

### D-044 Mesh conversion
- **Status**: rejected. Replaced by D-302 and LSB-020.
- **Recommended default**:
  - Source file: `ArtSource/Companion/Lira/Lira_AR_Base_with_clips.blend`, exported to `.glb` with Draco level 6 and 512² textures.
  - The Ember Fox USDZ is not the source (20 MB).
- **Affects**: GAP-ASSET-02.
- **Danny**: yes / no / change

### D-045 Asset naming
- **Status**: rejected. Replaced by D-221 and the LSB names.
- **Recommended default**:
  - Lens asset names: Blender action names are `Lira_Idle`, `Lira_Follow`, `Lira_Investigate`, `Lira_Alert`, `Lira_Celebrate`, and `Lira_Spawn`. The prefab is `Prefab_LiraModel`.
  - Spec IDs `lira_<clip>` map 1:1 to these names (CF-03).
  - Audio files keep their iOS basenames.
- **Affects**: GAP-ASSET-04, ASSET-05.
- **Danny**: yes / no / change

### D-046 Scene hierarchy and core copy
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**:
  - The hierarchy is exactly `lens-studio-build.md` §5.1, plus the CF-24 additions: `PermissionsPanel`, `SafetyPanel`, `MemoriesPanel`, `RecoveryPanel`, and `ErrorPanel`.
  - `Assets/Scripts/core/` is generated by `scripts/sync_core_ts.sh` and is read-only. CI fails on drift (`--check`).
- **Affects**: GAP-SCENE-04, SCENE-06.
- **Danny**: yes / no / change

### D-047 Script ownership and update loop
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**:
  - One `SessionController` owns the core instances and all storage writes.
  - The core advances only on an accepted location sample (D-103, 1 Hz poll) or on a Demo tick.
  - Exactly one `UpdateEvent` drives per-frame presentation: Lira follow, HUD lazy-follow, and the degrade monitor.
  - Allocate nothing per frame (PRS-092).
- **Affects**: GAP-PERF-06, SCENE-05.
- **Danny**: yes / no / change

### D-048 Demo pacing
- **Status**: superseded by CF-04
- **Recommended default**: Superseded: see CF-04 (winner: D-104: ticks at 5, 10, …, 35 s; end at 40 s)
- **Affects**: GAP-SM-09, DEMO-03, TEST-02.
- **Danny**: yes / no / change

### D-049 Demo label
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**:
  - During a Demo, HUD line 3 is prefixed with `Demo · `, for example `Demo · 1:20 · 112 m`.
  - The summary shows `Demo Walk — not saved to your walks count.` (BEH-049).
  - There is no chip, because the HUD has no chip (CF-21).
- **Affects**: GAP-DEMO-04.
- **Danny**: yes / no / change

### D-050 Summary moments and reason line
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT) (merged with PRS-058)
- **Recommended default**:
  - The metric reads `Moments` / `{n}`, where n is the eventHistory count (cap 32).
  - The end-reason line follows the BEH-048 table. It is placed under the path line and omitted for `userStop` and `demoComplete`.
- **Affects**: GAP-SUMMARY-06.
- **Danny**: yes / no / change

### D-051 Summary dismiss
- **Status**: superseded by CF-25
- **Recommended default**: Superseded: see CF-25 (winner: PRS-058 (iOS `3017-3022`) and the button `Done`)
- **Affects**: GAP-SUMMARY-07.
- **Danny**: yes / no / change

### D-052 Version visibility
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**:
  - The Intro footer shows `v0.1.0` (1.0 cm, `#9AA3B0`).
  - On start, the Lens logs `Lens Opened: v0.1.0`.
  - The version constant `LENS_VERSION` lives in `Assets/Scripts/logic/version.ts` and is bumped for each submission.
- **Affects**: GAP-PUB-07, TEST-06.
- **Danny**: yes / no / change

### D-053 (unused)
- **Status**: rejected. No audit row references it, and the ID is reserved.

### D-054 Minimum walk for Bond
- **Status**: superseded by CF-33
- **Recommended default**: Superseded: see CF-33 (winner: D-109 for non-user ends; userStop is always +1)
- **Affects**: GAP-LIFE-09.
- **Danny**: yes / no / change

### D-055 Hidden debug panel
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**:
  - Five pinches on the version label within 3000 ms toggle `DebugPanel`. It is a world panel at 1.1 m showing the last 20 log lines, the seed, the FPS EMA, and the last disposition.
  - The panel is not reachable during `walkActive`.
  - It ships in the published Lens. It contains no coordinates.
- **Affects**: GAP-PUB-08.
- **Danny**: yes / no / change

### D-056 Spawn location
- **Status**: rejected. Replaced by D-202 and PRS-019.
- **Recommended default**:
  - The spawn location is the ahead-diagonal target: forward at the current band distance (far → 3.0 m), 0.6 m to the right.
  - Ground: hit test, else head y − 1.45 m.
- **Affects**: GAP-LIRA-15.
- **Danny**: yes / no / change

### D-057 Language
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**:
  - English only.
  - Every string lives in `Assets/Scripts/logic/copy.ts` as a verbatim constant.
  - No string is concatenated except the `{n}` / `{d}` / `m:ss` templates.
- **Affects**: GAP-UI-18.
- **Danny**: yes / no / change

### D-058 (unused)
- **Status**: rejected. The ID is reserved.

### D-059 Home content
- **Status**: rejected. Merged into PRS-055 and PRS-059.
- **Recommended default**:
  - Home is the Intro panel (PRS-055), with an extra `Memories` button.
  - The footer reads `Lira · Bond {n}`.
  - When there are no memories, the Memories panel shows `Walk with Lira to write your first memory.`
- **Affects**: GAP-UI-04.
- **Danny**: yes / no / change

### D-060 Phrase dwell
- **Status**: accepted (Danny, 2026-10-11 11:03 PM PT)
- **Recommended default**:
  - HUD line 1 changes at most once every 4000 ms.
  - A newer phrase replaces a queued one; the queue depth is 1.
  - Lines 2 and 3 refresh at 1 Hz (D-215).
  - Status lines (D-216) take over line 2 for 4000 ms.
- **Affects**: GAP-UI-07.
- **Danny**: yes / no / change

## Needs Clarification: research results (2026-10-11)

Each NC was researched in Snap docs, forums, and published specs. **Resolved** means a source answers the question and the spec uses the sourced value. **Default + device test** means no published source exists; the conservative default ships, and the listed task measures the real value on hardware. Duplicate companion NCs (NC-10..NC-56) follow the NC they duplicate.

| NC | Question | Finding (source) | Outcome | Spec value now | Device test |
|---|---|---|---|---|---|
| NC-01 (dup NC-12, NC-54) | GPS accuracy on Spectacles | On Spectacles, `GeoLocationAccuracy.Navigation` is "generally accurate up to 20 meters". It uses `FUSED_LOCATION` at rendering rate when reception is good; otherwise one update every 10 s. `High` is ≤ 30 m at 1 Hz; `GNSS_RECEIVER` is "not expected to work indoors"; `WIFI_POSITIONING_SYSTEM` gives rough indoor location ([GeoLocationAccuracy](https://developers.snap.com/lens-studio/api/lens-scripting/enums/Built-In.GeoLocationAccuracy.html), [GeoPosition](https://developers.snap.com/lens-studio/api/lens-scripting/classes/Built-In.GeoPosition)). Location requires a paired Snapchat account, location permission, and an internet-connected device. The first fix can be slow without internet ([Location](https://developers.snap.com/spectacles/about-spectacles-features/apis/location)). A developer report says FUSED can take "a few minutes" to activate ([SnapOSLocationTools](https://github.com/siekermantechnology/SnapOSLocationTools/)). | Partly resolved: the published bound is known; the real distribution needs hardware | Use `Navigation` accuracy; keep the 30 m gate; keep the 30 s no-fix timeout (CF-06). The 10 s fallback cadence fits D-111 (degraded at 15 s). | **T200** (on-device): log `horizontalAccuracy`, `locationSource`, and the update interval for 3 outdoor walks and 1 indoor walk. Pass: p50 ≤ 20 m outdoors; record time to first FUSED fix. Feeds TST-061. |
| NC-02 (dup NC-11, NC-32, NC-56) | Can a Lens read thermal or power state? | No Lens Scripting API for device temperature or thermal state is documented. Thermal state appears only in the Performance Overlay and Spectacles Monitor. Over 100% CPU/GPU, a Lens is "thermally runtime constrained"; over 125%, thermal standby or shutdown is very likely ([Performance Overlay](https://developers.snap.com/spectacles/best-practices/profiling/lens-performance-overlay); [DeviceInfoSystem](https://developers.snap.com/lens-studio/api/lens-scripting/classes/Built-In.DeviceInfoSystem) lists no thermal member). | **Resolved**: no API | Keep the FPS proxy D-116 (> 20 ms mean for 10 s → degrade; 180 s → end with reason `power`). | T201 (on-device): over a 15-minute walk, Overlay CPU/GPU stays ≤ 100% (publishing target) and the proxy fires 0 times. Feeds TST-060. |
| NC-03 (dup NC-10) | Battery life and battery API | Snap documents "up to 45 minutes of continuous standalone runtime" ([Snap newsroom](https://newsroom.snap.com/sps-2024-spectacles-snapos)). A battery API exists: `global.deviceInfoSystem.getBatteryState()` returns `batteryLevel` (0–100) and `isCharging`, and `onBatteryStateChanged` fires on change. The doc has a Snap OS example ([DeviceInfoSystem](https://developers.snap.com/lens-studio/api/lens-scripting/classes/Built-In.DeviceInfoSystem)). | **Resolved** | The 30:00 hard end (D-107) fits within 45 min. New **D-061 (proposed)**: battery guard (below). | T202 (on-device): log battery % at start and end of a 15-minute walk. Pass: drain ≤ 40 percentage points. |
| NC-04 (dup NC-14) | `BigInt` in the Lens runtime | Lens Studio's TypeScript config is fixed at `"target": "es2019"` and `"lib": ["es2019"]`; the template must not be modified, only extended ([Custom TypeScript Configuration](https://developers.snap.com/lens-studio/features/scripting/custom-typescript-config)). `BigInt` is ES2020, so it isn't typed for Lens code. | **Resolved**: don't use BigInt | The core TS port uses the 2×uint32 RNG implementation as the **only** implementation (no BigInt path). The parity vectors are the acceptance check. | None (resolved by the vectors). |
| NC-05 (dup NC-50, NC-51) | Tool versions to pin | Spectacles (2024) uses **Lens Studio 5.15.x**. 5.15.4 (released 2026-02-24) is "the last anticipated Lens Studio update series for Spectacles (2024)" ([ar.snap.com/spectacles](https://ar.snap.com/spectacles)). 5.24.x targets SPECS 27, and current Spectacles firmware doesn't support it ([v5.24.1](https://ar.snap.com/download/v5-24-1)). Latest SIK: **v0.17.2** ([SIK release notes](https://developers.snap.com/spectacles/spectacles-frameworks/spectacles-interaction-kit/release-notes)). UI Kit **v0.1.4** is the latest cited by Snap engineering ([eng.snap.com](https://eng.snap.com/spatial_interaction)). | **Resolved** | Pin Lens Studio **5.15.4**, SIK **0.17.2**, and Spectacles UI Kit **0.1.4**. If the MCP agent's Asset Library shows a newer 0.x patch, record it in the build receipt. Never install 5.2x for this Lens. | T203 (lens-MCP-agent): the build receipt records the About-dialog version and the package versions. |
| NC-52 | Blender version | No Snap requirement found. | Default | Blender 4.x; record the version in the asset receipt. | Recorded in T042. |
| NC-06 | Eye height above the ground | No published figure. Snap advises accounting for "head heights" varying per user. Ground detection exists via `WorldQueryModule` hit test with `SurfaceClassification.Ground` ([World Query](https://developers.snap.com/spectacles/about-spectacles-features/apis/world-query)), but semantic classification needs **Experimental APIs**, and "Lenses that use Experimental APIs still cannot be published" ([Experimental APIs](https://developers.snap.com/spectacles/permission-privacy/experimental-apis)). | Default + device test | Use an unclassified hit test (no Experimental API) straight down when available. Otherwise use head y − **1.45 m** (CF-02). Never enable Experimental APIs. | T204 (on-device): 3 wearers; Lira's feet are within ±10 cm of the visible ground at 2 m. Feeds TST-052. |
| NC-07 (dup NC-31, NC-53) | Triangle and bone budget | Snap: keep 3D models under **100,000 triangles** total and **60,000** for skinned meshes; keep rigs under **100 joints**. Textures are recommended at **512×512 or smaller** on Spectacles ([Performance guide](https://developers.snap.com/lens-studio/publishing/optimization/performance-optimization-guide), [Optimizing Lens Performance](https://developers.snap.com/spectacles/best-practices/performance-optimization/optimizing-lens-performance)). Publishing requires 60 FPS ([Publishing](https://developers.snap.com/spectacles/get-started/start-building/publishing-lens)). | **Resolved** (spec is well inside the Snap limits) | Keep Lira ≤ 15k tris, scene ≤ 25k, ≤ 25 bones, ≤ 20 draw calls, and textures ≤ 512² unless PRS lists a larger atlas. | T201 confirms 60 FPS on device. |
| NC-08 (dup NC-13) | Can the platform clear saved data? | Yes, in three ways: Snapchat "will clear the Lens' persistent storage 60 days after the user does not touch the Lens"; the user can run Settings > Clear Lens Data; and `onStoreFull` fires when capacity is reached ([Persistent Storage](https://developers.snap.com/lens-studio/features/persistent-cloud-storage/persistent-storage)). The persistent storage limit on Spectacles is **125 MB** ([Spectacles FAQ: Scripting](https://developers.snap.com/spectacles/support/spectacles-faq/scripting)). | **Resolved** | Keep BEH-046: missing data resets to defaults silently. The 8 KB profile cap stays far below 125 MB. CF-12 still handles store-full; never call `clear()`. | None. |
| NC-09 | Lira model license | Meshy-derived, generated on a paid plan (Danny, 2026-10-11 11:27 PM PT); owned outright ([Meshy: ownership](https://help.meshy.ai/en/articles/10137554-what-is-the-ownership-of-the-generated-models)) | **Resolved** | No credit line; no publish block. Provenance recorded (T205 done). | — |

### D-061 Battery guard
- **Status**: accepted (Danny, 2026-10-11 11:26 PM PT)
- **Recommended default**: Read `deviceInfoSystem.getBatteryState()` at walk start and subscribe to `onBatteryStateChanged`. When the battery is ≤ 15% and not charging, show HUD line 2 "Battery low. Your walk will end soon." for 4000 ms (D-216). When it is ≤ 8% and not charging, end the walk with reason `power` and show the summary. Skip this in the editor (`isEditor()`).
- **Why**: The API exists (NC-03), and ending cleanly saves the memory before the OS shuts down.
- **Danny**: yes / no / change

### Lira / Ember Fox license (NC-09)

- **Repo evidence**:
  - The Spectacles rig is `ArtSource/Companion/Lira/lira.blend` (D-302). Its receipt calls it a hand-sculpted artist blend (`ArtSource/Companion/Lira/SOURCE_RECEIPT.md`, evidence class `ARTIST_BLEND_HERO_DCC_MID_LOD`), committed by Daniel Meyer in #162.
  - The iOS runtime "Ember Fox" (`MESHY_EMBER_FOX_WALK_V1`, `App/Resources/Companion/Lira/README.md:4`) and `ArtSource/Companion/Lira/meshy/SOURCE_RECEIPT.md` come from Meshy AI image-to-3D.
  - No file in the repo records the Meshy plan, the attribution, or the rights to the source image. `LICENSE_POLICY.md` says third-party components keep their own licenses.
- **Meshy terms**: Free-plan generations are licensed **CC BY 4.0**, with attribution required (e.g. "Model created with Meshy – CC BY 4.0"). Paid-plan generations are owned by the user, with no attribution required. Rights follow the plan active at generation time ([Meshy: ownership](https://help.meshy.ai/en/articles/10137554-what-is-the-ownership-of-the-generated-models), [Meshy: commercial use](https://help.meshy.ai/en/articles/16102098-can-i-use-meshy-assets-commercially)).
- **Danny (2026-10-11 11:26 PM PT)**: Lira **is derived from Meshy**.
- **Danny (2026-10-11 11:27 PM PT)**: Lira was generated on a **paid Meshy plan**. Zero State owns the generated asset outright, and **no credit line is needed** in the Lens description. The license no longer blocks publishing (T073).
- **Provenance** (Danny, 2026-10-11 11:30 PM PT):
  - Generation date: about two months before 2026-10-11 (approx. Aug 2026, per Danny)
  - Input-image rights: owned by Zer0 State LLC (per Danny, 2026-10-11 11:30 PM PT)
- Record the answer in `ArtSource/Companion/Lira/README.md`.

## Decisions and NCs from companion docs

Doc keys: B = behavior-spec, P = presentation-spec, L = lens-studio-build. A "CF" reference means a Conflicts row modifies that item.

| ID | Title | Recommended default | Doc |
|---|---|---|---|
| D-100 | Distance function | Haversine, R = 6 371 008.8 m; movement vectors ±0.05 m | B |
| D-101 | No GPS speed | `reportedSpeed = NaN` | B |
| D-102 | Duplicate fixes | Dropped in the adapter | B |
| D-103 | Tick cadence | One core update per accepted sample | B |
| D-104 | Demo pacing | Ticks at 5, 10, …, 35 s; end at 40 s | B |
| D-105 | Lira placement | superseded (CF-01) | B |
| D-106 | Lira states | 5 AR strings; celebrate is a 1500 ms one-shot | B |
| D-107 | Walk length | Prompts at 15:00 and 20:00; hard end at 30:00 | B |
| D-108 | Crash recovery | 30 s checkpoint; offer within 24 h | B |
| D-109 | Early-end outcome | Memory saved; +1 if active ≥ 60 s | B |
| D-110 | No-fix timeout | 30 s, then offer Demo | B |
| D-111 | Signal thresholds | Degraded at 15 s or 3 errors; end at 120 s | B |
| D-112 | Storage layout | `waykin.profile.v1` JSON plus checkpoint and receipt keys | B |
| D-113 | Memory length | 280 characters, then "…" | B |
| D-115 | Playback mode | LowPower | B |
| D-116 | Degrade trigger | > 20 ms mean for 10 s; exit < 17 ms for 30 s; end at 180 s | B |
| D-118 | Bond bounds | Start 12, no cap, never decreases | B |
| D-120 | Onboarding replay | superseded (CF-14) | B |
| D-121 | Tracking hysteresis | superseded (CF-17) | B |
| D-122 | Time context | Always midday | B |
| D-123 | Discovery and threat entities | Not rendered | B |
| D-124 | Launch and reveal cues | Excluded | B |
| D-125 | Lens copy | superseded (CF-14) | B |
| D-126 | Events label | superseded (CF-26) | B |
| D-200 | Behavior count | 4 loops + 2 one-shots | P |
| D-201 | Missing-clip fallback | Walk, paused walk, or walk at 1.25× | P |
| D-202 | Follow target | 2.0 m ahead, 0.6 m lateral | P |
| D-203 | Band distances | 1.3 / 1.6 / 2.0 / 3.0 m | P |
| D-204 | Yaw slew | 180°/s | P |
| D-205 | Occlusion | None; contact shadow disc | P |
| D-206 | Re-show debounce | Hide immediately; show after 500 ms stable | P |
| D-207 | Out-of-FOV replant | 8 s outside ±25° while moving | P |
| D-208 | Skins | Dawn only | P |
| D-209 | Spatial emitters | Lira-attached, 2 m behind, or head-locked | P |
| D-210 | Ducking | None | P |
| D-211 | Minimum UI distance | 0.8 m | P |
| D-212 | HUD follow | Lazy, τ 0.35 s, 15° re-center | P |
| D-213 | Targets and text | 4×4 cm targets; text 1.2 / 2.0 cm | P |
| D-214 | New copy | Strings marked D-214 | P |
| D-215 | HUD refresh | 1 Hz | P |
| D-216 | No toasts | HUD line 2 for 4 s | P |
| D-217 | No voice input | Off | P |
| D-218 | Audio format | 48 kHz/16-bit; mono for spatial, stereo for head-locked; ≤ 4 MB | P |
| D-219 | Script budget | ≤ 2.0 ms per frame | P |
| D-220 | Export format | glTF binary + Draco | P |
| D-221 | Audio names | iOS basenames | P |
| D-222 | Font | UI Kit default | P |
| D-301 | Permissions | RawLocationModule only, no Internet descriptor (flagged FR-014 correction) | L |
| D-302 | Source rig | `.blend` with 25 bones and 6 actions → `.glb` | L |
| D-303 | Audio set | 9 files; launch and reveal excluded | L |
| D-304 | Skins | Dawn only | L |
| D-305 | Panel placement | z −110 cm, ≤ 34×24 cm | L |
| D-306 | Audio pan | superseded (CF-07) | L |
| D-307 | Demo pacing | superseded (CF-04) | L |
| D-308 | Contextual bearing | superseded (CF-01) | L |
| D-309 | HUD follow | superseded (CF-11) | L |
| D-310 | Receipt output | One `WAYKIN_RECEIPT` Logger line, plus the stored key (BEH-050) | L |
| D-311 | Seed | superseded (CF-15) | L |
| D-312 | Store full | superseded (CF-12) | L |
| D-313 | 15-minute hint | superseded (CF-05) | L |
| D-314 | Size target | ≤ 15 MB | L |
| D-324 | Precedence | B and P win over L | L |
| NC-10 | Battery life | Hard end at 30:00 | B |
| NC-11 | Thermal API | FPS proxy | B |
| NC-12 | Accuracy distribution | 30 m gate | B |
| NC-13 | Storage capacity | 8 KB profile cap | B |
| NC-14 | BigInt | Resolved: 2×uint32 only (NC-04) | B |
| NC-15 | Tracking API | Non-finite pose or > 2 m jump proxy | B |
| NC-16 | Sleep and focus events | > 5 s frame gap means implicit pause | B |
| NC-17 | Internet-loss signal | Covered by the GPS rows | B |
| NC-30 | Reduce Motion OS setting | In-Lens toggle | P |
| NC-31 | Tris, draw calls, legibility | 15k/25k tris, 20 draw calls, 4 cm targets | P |
| NC-32 | Thermal signal | superseded (CF-08) | P |
| NC-33 | Fox clip author | Ship with fallbacks | P |
| NC-50 | Lens Studio version | Resolved: 5.15.4 (NC-05) | L |
| NC-51 | SIK and SUIK versions | Resolved: SIK 0.17.2, UI Kit 0.1.4 (NC-05) | L |
| NC-52 | Blender version | 4.x | L |
| NC-53 | Tri budget | 15k | L |
| NC-54 | GPS accuracy | 30 m gate | L |
| NC-55 | First-fix timeout | superseded (CF-06) | L |
| NC-56 | Thermal signal | superseded (CF-08) | L |

## Conflicts

Each resolution is binding as **proposed** until Danny accepts or changes it (task T038). The losing value must be edited out of its doc (task T040).

| CF | Topic | Conflicting values | Resolution |
|---|---|---|---|
| CF-01 | Lira follow target | D-005: 1.8 ahead / 0.6 R. D-105: 1.1–3.0 / 0.5 R. D-202/203: band 1.3/1.6/2.0/3.0, lateral 0.6. LSB §5.2: iOS beside/ahead/contextual | Use **D-202/D-203** (P owns rendering). Forward distance = band table, lateral +0.6 m on Lira's current side (default right). The "lead" behavior also uses the band distance. D-005, D-105 (offset), D-308, and the LSB §5.2 bearings are rejected. |
| CF-02 | Ground height | NC-06 1.60 m; B, P, and L all 1.45 m | Hit test if available, else head y − **1.45 m** (`ARPlacementResolver.swift:136`). |
| CF-03 | Rig source and clip names | PRS-100 Ember Fox USDZ with `lira_*`, mostly TODO; D-302 `.blend` with 25 bones and 6 `Lira_*` actions; D-004 4 clips | Use **D-302** (size and available clips). The PRS-004 clip IDs map to `Lira_Idle`, `Lira_Follow`, `Lira_Investigate`, `Lira_Alert`, `Lira_Celebrate`, `Lira_Spawn`. The PRS-005 fallbacks apply to any action that is missing after import. D-004's "investigate = alert at 0.6×" is rejected because a real clip exists. NC-09 is resolved: paid Meshy plan, owned outright, no publish gate. |
| CF-04 | Demo pacing | D-048 8 s / +3 s; D-104 5 s / +5 s; D-307 6 s | **D-104**: ticks at 5, 10, …, 35 s; end at 40 s. LSB-072 is updated to "every 5 s". |
| CF-05 | Walk-length prompts | D-023 one toast at 15:00; D-107 15:00, 20:00, and a 30:00 hard end; D-313 8 s phrase; D-216 no toasts | Use the **D-107** timings and the BEH-031 copy, rendered per **D-216** as HUD line 2 for 4000 ms. The 30:00 auto-end leads to the summary. |
| CF-06 | First-fix timeout | D-035 30 s; D-110 30 s; NC-55 10 s; LSB uses the denial copy | **30 s**. Copy is ERR-GPS-02 "No GPS fix yet. Try outside, or start Demo Walk." with the buttons "Try again" and "Demo Walk" on ErrorPanel. |
| CF-07 | Spatial audio | D-013 and D-209 spatial; D-306 pan ignored, no spatial | Use **D-209**. If the spatial AudioComponent setting is unavailable (verify in T047/T050), fall back to D-306 (all non-spatial) and log it in the build receipt. |
| CF-08 | Degrade trigger | NC-02 FPS < 45 for 10 s; D-116 > 20 ms for 10 s, end at 180 s; NC-32 < 50 FPS for 5 s, restore > 58 for 30 s; NC-56 > 20 ms for 30 s, restore 60 s; LSB hides Lira | Thresholds follow **D-116**: enter at a 10 s rolling mean frame delta > 20 ms; exit at < 17 ms for 30 s; end with reason `power` after 180 s continuous. The effect follows **PRS-093**: loop clips off (static pose), hunter echo hidden, HUD lazy-follow frozen, audio kept. |
| CF-09 | Stale or lost location | D-037 20 s weak, 60 s auto-pause; D-111 15 s / 3 errors degraded, 120 s end; LSB 5 errors → end | **D-111**. Degraded shows the ERR-GPS-03 line in HUD line 2. Lost leads to ending with reason `locationLost` and the summary. There is no auto-pause. |
| CF-10 | Storage keys | D-029 `wk.*`; D-112 `waykin.profile.v1` JSON; LSB `waykin.bond.level` and others; P `onboardingCompletedV1` | Use **D-112**. Onboarding is `profile.onboardingDone`; Reduce Motion is `profile.reduceMotion` (bool, added to profile v1, default false). The LSB §6 keys and `waykin.session.count` are removed. |
| CF-11 | HUD placement | D-019 −20° pitch / +12° yaw, 1.0 m; PRS-056 1.1 m, −8° yaw, −11° pitch, 18×10 cm; LSB −30 cm, 20° threshold | Use **PRS-056** with **D-212** follow. LSB §5.3 is rewritten. |
| CF-12 | Store full | D-032 drop receipt + oldest memory; BEH-045 drop receipt, retry, ERR-PERSIST-04; D-312 drop memory, else Bond-only | On a write failure: (1) delete `waykin.receipt.last.v1` and retry; (2) drop the oldest memory and retry; (3) show ERR-PERSIST-04. Never call `clear()`. |
| CF-13 | Write idempotency and recovery | D-033 `wk.lastSession`; D-034 silent finalize at launch; D-108 offer within 24 h | Use **BEH-042** (idempotency key = checkpoint `startedAt`) and **D-108** (RecoveryPanel at ≤ 24 h, silent finalize at > 24 h). |
| CF-14 | Onboarding flow and copy | D-025 Intro → Safety; B §3.5 4 bullets plus D-125; PRS-070 Intro → Permissions → Safety, 5 bullets; D-026 different bullets; replay D-028 / D-120 / PRS-073 | Use **PRS-070** (flow and verbatim copy) and **PRS-073** (replay from Memories). D-025, D-026, D-027, D-028, D-120, and the B §3.5 bullets are rejected. The D-125 location line is dropped in favor of the PRS-070 Location row. |
| CF-15 | Event seed | GAP-CONST-04: 42, iOS parity; D-311: salted per session | Seed **42** for every walk (parity; the vectors are authoritative). D-311 is rejected. |
| CF-16 | Launch and reveal cues | PRS-032 and PRS-070 play `appLaunchTheme` and `companionReveal`; D-015, D-124, and D-303 exclude them | **Exclude** both. Onboarding "I understand" is silent. The PRS-032 rows are struck. |
| CF-17 | Tracking hide and restore | D-121 hide at 500 ms, restore at 1000 ms; D-206 hide immediately, show after 500 ms | Use **D-206**. The NC-15 proxy still defines "limited". |
| CF-18 | Out-of-FOV replant | D-008 out of FOV > 5 s and > 6 m; PRS-021 outside ±25° for 8 s while moving | **PRS-018** (> 6 m and behind, checked every 1 s) **plus PRS-021** (8 s outside ±25°). |
| CF-19 | Hunter echo | D-010 omit; PRS-011 render in alert | **Render** per PRS-011: one extra draw call, alert state only. It is hidden while degraded. This is still FR-009-safe because it is Lira's own silhouette. |
| CF-20 | Audio format | D-017 mono for all; D-218 mono/stereo split; LSB-023 copy unchanged | **D-218**, per the PRS-104 manifest. |
| CF-21 | HUD content | GAP-UI-14 state chip, D-019 4 lines; PRS-056 3 lines, no chip | **PRS-056**: 3 lines, no chip. A11Y is met by the phrase text plus the shape and audio cues (PRS-080). |
| CF-22 | Targets and text | D-020 4×2.5 cm; D-024 2.0 / 3.0 cm; PRS 4×4 cm, 1.2 / 2.0 cm, controls 6×4; LSB 8×3.5 | Use **PRS-053 and PRS-057** (6×4 cm controls, 4×4 minimum). NC-31 re-measure is in TST-038. |
| CF-23 | Panel distance | D-018 1.0 m; PRS 1.1 m; LSB 110 cm | **1.1 m**, −5° pitch. |
| CF-24 | Panel inventory | LSB: Intro, HUD, Summary, Notice; P adds Permissions, Safety, Memories, error; B adds Recovery | Use the union: Intro(Home), Permissions, Safety, HUD, Summary, Memories, Recovery, Error (replaces Notice), Debug (D-055). |
| CF-25 | Summary copy | B "Bond deepened +d"; P `Bond +d / Bond d / Bond held`; D-051 "Back to Home" | Use **PRS-058** (iOS `3017-3022`) and the button `Done`. |
| CF-26 | Events label | D-050 / D-126 "{n} moments"; P `Moments / {n}` | Use the P metric layout. |
| CF-27 | Movement distance tolerance | D-038 1e-6 m; D-100 ±0.05 m | **D-100**. |
| CF-28 | Reported speed | D-039 NaN; LSB −1 | **NaN**. Both hit the fallback; NaN is canonical. |
| CF-29 | Permissions | GAP-PUB-01 / FR-014 RawLocation + Internet; D-301 RawLocation only | **D-301**, but verify it in TST-051 and at publish (T073). If GPS fails without Internet, add `InternetModule` and amend D-301. |
| CF-30 | Lens OS pause | D-036 platform event; BEH-029 > 5 s frame-gap proxy | Use the event if T069 finds one; otherwise use the proxy. Both lead to an implicit pause and ERR-LIFE-02 with no auto-resume. |
| CF-31 | Draw calls and bones | D-043 ≤ 40; NC-07 40 bones; PRS ≤ 20 draws, ≤ 24 joints; D-302 25 bones | ≤ 20 draw calls; ≤ 25 bones (the `.blend` rig). |
| CF-32 | Discovery pulse | D-012 0.6 s scale pulse; P silent | **Keep D-012**. The pulse multiplies the PRS-009 state scale and is suppressed when reduceMotion is on. |
| CF-33 | Early-end Bond | D-054 +1 always; D-109 ≥ 60 s | **D-109** for non-user ends; userStop is always +1. |
