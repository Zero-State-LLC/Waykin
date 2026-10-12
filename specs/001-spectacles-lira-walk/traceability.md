# Traceability: Lira Walks With You (Spectacles Lens)

**Set**: `specs/001-spectacles-lira-walk/traceability.md`
**Status rule**: A row is *in scope* only when it has ≥1 requirement id, ≥1 task id, and ≥1 TST. Device-dependent tests report `NOT_COMPUTABLE` until a receipt exists (`WAYKIN_SPEC.md:39`).
**Doc keys**: B = `behavior-spec.md`, P = `presentation-spec.md`, L = `lens-studio-build.md`, GA = `gap-audit.md`, DEC = `decisions.md` (CF rows are binding).
**Requirement id rule**: Every row cites explicit `FR-`/`BEH-`/`PRS-`/`LSB-` ids plus the governing `D-`/`CF-`/`GAP-`/`NC-` ids. Ids are only used if they exist in the documents above.

---

## 1. Feature inventory and matrix

| # | Feature | Source | Requirements | Tasks | Tests | Status |
|---|---|---|---|---|---|---|
| 1 | Core RNG (SplitMix64), seed 0 → `0x9E3779B97F4A7C15`, uint64 arithmetic, BigInt/2×uint32 fallback | `Sources/WaykinCore/Engines/WorldEventGenerator.swift:95-109`; GA GAP-CONST-01; `contracts/core-parity.md:21-27` | FR-002, FR-004, BEH-001, GAP-CONST-01, GAP-CONST-04, NC-04, CF-15 | T006, T011, T012, T016, T044 | TST-001, TST-011, TST-040 | in scope |
| 2 | Event generator configuration: 10-rule table, thresholds, weights, cooldowns, eligibility, tie-break selection | `…/WorldEventGenerator.swift:65-92`; `contracts/core-parity.md:10-18`; GA GAP-CONST-02/03 | FR-002, FR-004, BEH-001, BEH-002, GAP-CONST-02, GAP-CONST-03, CF-15 | T007, T008, T009, T010, T011, T016 | TST-001, TST-002 | in scope |
| 3 | Generator lifetime: fresh constructor per tick, external `lastEventElapsed` history, elapsed clamp | `Experiences.swift:118-126`; GA C4; `contracts/core-parity.md:15-20,33-38` | BEH-002, BEH-001, GAP-CONST-05, D-103 | T012, T016, T044 | TST-002, TST-011 | in scope |
| 4 | Event seed 42 for every walk; iOS parity (D-311 rejected) | `ExperienceProtocol.swift:23`; `WaykinApp.swift:1001-1005`; DEC D-311/CF-15 | FR-004, GAP-CONST-04, CF-15, D-103 | T012, T016, T026, T021 | TST-001, TST-040 | in scope |
| 5 | World-state derivation: tickSeconds, energy (hint 0), familiarity, pressure, event intensity, bond progress, midday time context | `Experiences.swift:77-204`; B §1.2; GA GAP-CONST-06..11; DEC D-001, D-003, D-122 | BEH-001, GAP-CONST-06, GAP-CONST-07, GAP-CONST-08, GAP-CONST-09, GAP-CONST-10, GAP-CONST-11, D-001, D-003, D-122, D-100 | T013, T055 | TST-003 | in scope |
| 6 | Event history cap 32 and `debugLabel = kind` | `Experiences.swift:134-137`; GA GAP-CONST-17; `data-model.md` WorldEvent | BEH-001, GAP-CONST-17, GAP-SUMMARY-06, D-050 | T013, T061 | TST-002, TST-009, TST-018 | in scope |
| 7 | Path relation engine: establishing/onPath/strained/offPath/recovered, reject streaks, pressure boosts | `Sources/WaykinCore/Path/PathProgressEngine.swift:109-164`; B §1.4; GA GAP-EVT-14 | GAP-EVT-14, BEH-010, BEH-011, D-100 | T013, T014, T055 | TST-078, TST-003, TST-009 | in scope |
| 8 | Path → AR bias (strained→investigate, offPath→alert) and the 0.6 s discovery core pulse (reduceMotion-suppressed) | `CompanionPresentationMatrix.swift:71-78`; GA GAP-EVT-15; DEC D-012/CF-32 | GAP-EVT-15, D-012, CF-32, PRS-009, PRS-080 | T059, T019 | TST-016, TST-079 | in scope |
| 9 | Event catalog: per-kind behavior, relative distance, AR state mapping | `Experiences.swift:236-263`; `CompanionPresentationMatrix.swift:26-40`; B §2.1 | FR-008, GAP-EVT-03, GAP-EVT-06, BEH-003 (no pursuer) is separate — here: BEH-018 | T013, T014, T019, T028 | TST-002, TST-006 | in scope |
| 10 | Event → Lira verbatim line strings (10 strings + no-event lines) | `Experiences.swift:237-263`; GA GAP-EVT-03; DEC D-057, D-122 | GAP-EVT-03, D-057, D-122, FR-002 | T014, T060 | TST-006, TST-018 | in scope |
| 11 | Cue chain and single-tick precedence (event → behavior → AR presentation → path), incl. cooldowns 12/14/18 s | `AudioExperienceLayer.swift:57-127,215-255`; `PathAudioCoupling.swift:16-57`; B §1.5, B §2.6 | BEH-017, BEH-018, GAP-EVT-04, GAP-EVT-05, GAP-AUDIO-10, GAP-CONST-16, PRS-036 | T014, T020, T056 | TST-007, TST-013 | in scope |
| 12 | Pursuit state machine: inactive → noticed → approaching → close → fading; allowed kinds per state | `Experiences.swift:206-234`; B §2.2; GA GAP-EVT-01/02; GA C1 | BEH-003, GAP-EVT-01, GAP-EVT-02 | T014, T028 | TST-005 | in scope |
| 13 | Pursuit presentation: audio + Lira behavior only; hunter echo alert-only; user pause = no ticks (core values unchanged; non-moving samples follow Swift pause pressure); no pursuer entity | `spec.md:97`; `LiraARMotion.swift:185-201`; DEC D-123/CF-19 | FR-009, BEH-003, BEH-004, PRS-011, CF-19, D-123 | T028, T029, T050, T051 | TST-005, TST-032, TST-079 | in scope |
| 14 | Memory text selection (7-branch priority table) and path suffix substitution | `Experiences.swift:265-289`; `WalkPathCopy.swift:39-64`; B §2.4; GA GAP-EVT-07/08 | FR-013, BEH-010, BEH-011, GAP-EVT-07, GAP-EVT-08, GAP-SUMMARY-08 | T015, T030, T061 | TST-009 | in scope |
| 15 | Memory truncation at 280 chars + ellipsis, retention of newest 5, newest-first ordering | B §2.4; DEC D-113, D-030; GA GAP-PERSIST-03; `spec.md` FR-013 | BEH-012, FR-013, D-030, D-113, GAP-PERSIST-03 | T015, T030, T057 | TST-009, TST-035 | in scope |
| 16 | Bond rules: start 12, real walk +1, demo max(1, floor(progress)) = +2, early-end ≥60 s → +1, no cap, never decreases | `WaykinApp.swift:1097`; `Experiences.swift:183`; `PersistenceStore.swift:41`; B §2.3; DEC D-109/D-118/CF-33 | BEH-005, BEH-006, BEH-007, BEH-008, BEH-009, D-109, D-118, CF-33, GAP-EVT-09, GAP-EVT-10, GAP-EVT-11, GAP-EVT-12 | T015, T030, T032 | TST-008, TST-035, TST-053 | in scope |
| 17 | Bond milestone moment cue on summary when delta > 0 (once per summary) | `WaykinApp.swift:231-235`; B §2.6; DEC D-015 | BEH-021, GAP-AUDIO-06, D-015 | T020, T031, T056 | TST-013, TST-039, TST-034 | in scope |
| 18 | Session state machine T1–T21 (boot/onboarding/home/acquiring/walk/demo/ending/summary/recoveryOffer) | B §3.1; `WaykinApp.swift:21-29,919-1197`; GA GAP-SM-01 | BEH-022, GAP-SM-01, D-108, CF-13 | T026, T055, T070 | TST-012, TST-035 | in scope |
| 19 | Forbidden transitions, idempotent Stop, double-End ignored | B §3.1 BEH-023; `WaykinApp.swift:776-778`; GA GAP-LIFE-05 | BEH-022, BEH-023, FR-010, SC-007, GAP-LIFE-05 | T026, T055 | TST-012, TST-034 | in scope |
| 20 | Start ordering (first accepted or fresh-anchor sample), elapsed clock accounting, waiting copy | B §4 BEH-026/027; `WaykinApp.swift:1012,1324`; GA GAP-LIFE-01 | BEH-026, BEH-027, GAP-LIFE-01, D-103 | T026, T060, T064 | TST-012, TST-034, TST-038 | in scope |
| 21 | Pause/resume: stop polling, pause audio, reset anchor, no timeouts while paused, resume = fresh anchor | `WaykinApp.swift:1025-1042`; `MovementEngine.swift:71-90`; B §4 BEH-028 | BEH-004, BEH-028, GAP-SM-02, GAP-SM-03, GAP-SM-04 | T026, T029, T055, T058 | TST-012, TST-015, TST-033 | in scope |
| 22 | First-fix timeout 30 s → ERR-GPS-02 with "Try again" / "Demo Walk" | B §4, §7; DEC D-110/CF-06; GA GAP-LIFE-02 | BEH-039, GAP-LIFE-02, D-110, CF-06, ERR-GPS-02 | T025, T058 | TST-015, TST-036 | in scope |
| 23 | Checkpoint every 30 s with `startedAt` idempotency key | B §6 BEH-042; DEC D-108/CF-13; GA GAP-LIFE-03 | BEH-030, BEH-042, GAP-LIFE-03, D-108, CF-13 | T057, T030, T070 | TST-014, TST-035 | in scope |
| 24 | Crash recovery: RecoveryPanel ≤24 h, silent finalize >24 h, reasons `interrupted`/`closed` | B §3.1 T3/T3b/T20/T21, BEH-030; DEC D-108/CF-13 | BEH-030, GAP-LIFE-04, D-108, CF-13, BEH-008 | T070, T057, T032 | TST-014, TST-035 | in scope |
| 25 | Walk-length prompts at 15:00 / 20:00 and hard end at 30:00 rendered as HUD line 2 for 4000 ms | B §4 BEH-031; DEC D-107/CF-05, D-216; GA GAP-UI-16 | BEH-031, D-107, CF-05, D-216, GAP-UI-16 | T062, T064 | TST-019, TST-063, TST-077 | in scope |
| 26 | Battery handling: 30:00 hard end (D-107) within the documented 45-min runtime; battery API `deviceInfoSystem.getBatteryState()` exists (NC-03); low-battery guard D-061 (accepted) | B §4 BEH-033; DEC NC-03, D-061; GA GAP-LIFE-07 | BEH-033, GAP-LIFE-07, NC-03, NC-10, D-061 | T202 | TST-071 | in scope |
| 27 | Thermal/power degrade and end: enter >20 ms 10 s mean, exit <17 ms 30 s, end at 180 s with `reason = power` | B §4 BEH-032; P §6 PRS-093; DEC D-116/CF-08; GA GAP-LIFE-06 | FR-018, BEH-032, PRS-093, D-116, CF-08, ERR-PERF-01, NC-02 | T033, T062, T071 | TST-020, TST-060, TST-076 | in scope |
| 28 | Stale/lost location: degraded at 15 s or 3 errors, ERR-GPS-03 in HUD line 2, lost at 120 s → `locationLost`, no auto-pause | B §4/§5/§7; `SessionMapPresentation.swift:95-97`; DEC D-111/CF-09 | BEH-034, D-111, CF-09, GAP-LIFE-08, ERR-GPS-03, ERR-GPS-04 | T058, T025, T032, T064 | TST-015, TST-036, TST-077 | in scope |
| 29 | Lens OS pause / sleep → implicit pause, no auto-resume, ERR-LIFE-02 | B §4 BEH-029; DEC D-036/CF-30, NC-16; GA GAP-SM-07, GAP-LIFE-10 | BEH-029, GAP-SM-07, GAP-LIFE-10, D-036, CF-30, NC-16, ERR-LIFE-02 | T069, T026 | TST-054 | in scope |
| 30 | Error copy set for permission denied / services unavailable / lost mid-walk | `WaykinApp.swift:936,958,1413`; B §7 BEH-047; GA GAP-ERR-01..03 | BEH-047, GAP-ERR-01, GAP-ERR-02, GAP-ERR-03, ERR-GPS-01, ERR-GPS-02, ERR-GPS-04, PRS-072 | T025, T060 | TST-036, TST-051 | in scope |
| 31 | Persistence errors and silent audio: ERR-PERSIST-01..04, ERR-AUDIO-01, no raw strings or coordinates | B §6/§7; `AppAudioCuePlayer.swift:333-338`; GA GAP-ERR-05/06, GAP-PERSIST-05 | BEH-020, BEH-044, BEH-045, BEH-047, GAP-ERR-05, GAP-ERR-06, ERR-PERSIST-01, ERR-PERSIST-02, ERR-PERSIST-03, ERR-PERSIST-04, ERR-AUDIO-01 | T020, T030, T057, T060 | TST-014, TST-035, TST-039 | in scope |
| 32 | Core exception handling: try/catch per tick, end with `reason = error`, toast copy | DEC D-040; GA GAP-ERR-04; B §8 BEH-048 | D-040, GAP-ERR-04, BEH-048 | T026, T032 | TST-074 | in scope |
| 33 | Location adapter loop: `RawLocationModule`, `GeoLocationAccuracy.Navigation`, 1.0 s poll, timestamp dedupe, `reportedSpeed = NaN` | `spec.md` FR-006; B §5 BEH-034; DEC D-101/102/CF-28; GA GAP-GPS-01/02/07 | FR-006, BEH-034, D-101, D-102, CF-28, GAP-GPS-01, GAP-GPS-02, GAP-GPS-07 | T024, T058 | TST-015, TST-051 | in scope |
| 34 | Movement integrity gates in order with reject-reason enum | `MovementIntegrity.swift:135-234`; B §5 BEH-035; GA GAP-CONST-12, GAP-GPS-03 | BEH-035, GAP-CONST-12, GAP-GPS-03 | T013, T058 | TST-004 | in scope |
| 35 | Distance function: haversine R = 6 371 008.8 m with ±0.05 m movement tolerance | `MovementIntegrity.swift:291-294`; DEC D-100/CF-27; GA GAP-GPS-05 | BEH-036, D-100, CF-27, GAP-GPS-05 | T010, T013 | TST-004 | in scope |
| 36 | Accuracy gate 30 m retained; on-device accuracy distribution; night accuracy degradation (no special code) | B §5 BEH-038; DEC NC-01; GA GAP-GPS-06/09 | BEH-038, GAP-GPS-06, GAP-GPS-09, NC-01 | T024, T036, T063 | TST-061 | in scope (not computable until receipts) |
| 37 | Reject downstream effects (path.recordRejected, AR-only cues) and indoor/no-internet Demo offer | `WaykinApp.swift:1295-1320,934-940`; B §5 BEH-037/039; GA GAP-GPS-08 | BEH-037, BEH-039, GAP-GPS-08, FR-016, LSB-084 | T013, T025, T058 | TST-004, TST-036 | in scope |
| 38 | Privacy: coordinates never leave adapter/engine; storage and receipts contain no coordinates | `ARCHITECTURE.md:94`; B §5 BEH-040, §8 BEH-050; GA GAP-PERSIST-08 | FR-017, BEH-040, BEH-050, GAP-PERSIST-08, D-055, D-310 | T034, T057, T063 | TST-062, TST-011 | in scope |
| 39 | Lira presentation states (idle/follow/investigate/alert/celebrate), string normalization, 4 loops + 2 one-shots | `CompanionPresentationState.swift:4-17,109-120`; P §1.1 PRS-001..003; DEC D-106, D-200, CF-03 | FR-007, PRS-001, PRS-002, PRS-003, BEH-024, BEH-025, D-106, D-200, GAP-LIRA-01, CF-03 | T019, T051, T059 | TST-016, TST-006 | in scope |
| 40 | Clip map (6 `Lira_*` clips) and missing-clip fallback ladder | `LiraSkeletalAnimationLibrary.swift:20-45`; P PRS-004/005/006; DEC D-201, D-302; GA GAP-ASSET-04, GAP-LIRA-10, NC-33 | PRS-004, PRS-005, PRS-006, D-201, GAP-ASSET-04, GAP-LIRA-10, CF-03, NC-33 | T019, T045, T046 | TST-016, TST-037 | in scope |
| 41 | Crossfade timings and 400 ms loop watchdog | `LiraSkeletalPlayer.swift:40,201-205`; `ARWorldCommandRenderer.swift:343-344,401-409`; P PRS-007/008 | PRS-007, PRS-008, GAP-LIRA-07 | T019 | TST-016, TST-037 | in scope |
| 42 | Celebrate one-shot 1.5 s; re-request does not restart the deadline | `CompanionPresentationState.swift:39,82-89`; GA GAP-CONST-15; P PRS-003 | PRS-003, PRS-002, GAP-CONST-15, D-106 | T019, T059 | TST-016 | in scope |
| 43 | Walk clip plays only while closing distance; pauses when settled | `ARWorldCommandRenderer.swift:505-508`; P PRS-006, GA GAP-LIRA-10 | PRS-006, GAP-LIRA-10 | T019 | TST-016, TST-037 | in scope |
| 44 | Per-state root scale, status indicator, state colors, and discovery pulse interaction | `ARWorldCommandRenderer.swift:840-886`; P PRS-009; GA GAP-LIRA-13; DEC D-012/CF-32 | PRS-009, PRS-080, GAP-LIRA-13, D-012, CF-32 | T019, T050, T059 | TST-016, TST-079 | in scope |
| 45 | Spawn coalesce 0.92→1.0 over 0.70 s (0.12 s with reduce motion) and `Lira_Spawn` | `LiraARMotion.swift:210-223`; P PRS-010, PRS-081; GA GAP-LIRA-11 | PRS-010, PRS-081, GAP-LIRA-11, NC-30 | T019, T066 | TST-016, TST-073 | in scope |
| 46 | Hunter echo silhouette: alert state only, alpha 0.22, hidden while degraded | `LiraARMotion.swift:185-201`; P PRS-011; DEC CF-19; GA GAP-LIRA-12 | PRS-011, CF-19, GAP-LIRA-12, D-123 | T033, T050, T051 | TST-079, TST-076 | in scope |
| 47 | Follow placement: band table forward distance, +0.6 m lateral on Lira's current side, 0.45 m arrive deadband | P PRS-013/014; DEC D-202/D-203/CF-01; GA GAP-CONST-14, GAP-LIRA-03/04 | PRS-013, PRS-014, D-202, D-203, CF-01, GAP-CONST-14, GAP-LIRA-03, GAP-LIRA-04 | T019, T059 | TST-017, TST-052 | in scope |
| 48 | Ground height: hit test if available, else head y − 1.45 m | `ARPlacementResolver.swift:134-136`; P PRS-012; DEC NC-06/CF-02; GA GAP-LIRA-05 | PRS-012, NC-06, CF-02, GAP-LIRA-05 | T019, T059, T068 | TST-017, TST-052 | in scope |
| 49 | Follow speed matching, leash hysteresis (1.8 m start / 0.45 m settle), EMA α 0.08, ≥60 m gap abort | `ARWorldCommandRenderer.swift:357-419,464-483`; P PRS-015; DEC D-006; GA GAP-LIRA-02, GAP-SM-08 | PRS-015, D-006, GAP-LIRA-02, GAP-SM-08 | T019, T059 | TST-017, TST-052 | in scope |
| 50 | Look-at behaviour and yaw slew cap 180°/s | `ARWorldCommandRenderer.swift:510-538`; P PRS-016; DEC D-204; GA GAP-LIRA-09 | PRS-016, D-204, GAP-LIRA-09 | T019, T059 | TST-017 | in scope |
| 51 | No occlusion / no World Mesh, contact shadow disc retained | P PRS-017; DEC D-009/D-205; GA GAP-LIRA-08 | PRS-017, D-009, D-205, GAP-LIRA-08 | T049, T050 | TST-037, TST-079 | in scope |
| 52 | Continuity check every 1.0 s, replant conditions (>6 m and behind), replant target | `ARPlacementResolver.swift:9-10,175-179,294-311`; P PRS-018/019; DEC CF-18; GA GAP-LIRA-06/07 | PRS-018, PRS-019, GAP-LIRA-06, GAP-LIRA-07, D-008, CF-18 | T019, T068 | TST-017, TST-052 | in scope |
| 53 | Tracking loss: hide immediately, restore after 500 ms stable, NC-15 proxy | `ARWorldCommandRenderer.swift:690-698`; P PRS-020; DEC D-206/CF-17, NC-15 | PRS-020, D-206, CF-17, NC-15, ERR-TRK-01 | T068 | TST-052, TST-054 | in scope |
| 54 | Out-of-FOV replant: 8 s outside ±25° cone while moving | P PRS-021; DEC D-207/CF-18; GA GAP-LIRA-06 | PRS-021, D-207, CF-18 | T068 | TST-017, TST-052 | in scope |
| 55 | Heading never used for placement; Dawn-only skin set | `LiraSkin.swift:13`; P PRS-022/023; DEC D-011, D-208, D-304; GA GAP-GPS-04, GAP-LIRA-14 | PRS-022, PRS-023, D-011, D-208, D-304, GAP-GPS-04, GAP-LIRA-14 | T024, T050 | TST-079, TST-051 | in scope |
| 56 | Audio cue catalog: 9 cues with files, channels, priorities, catalog volumes | `AppAudioCuePlayer.swift:35-48`; B §2.6; P PRS-032; DEC D-303; GA GAP-AUDIO-01/06 | PRS-032, GAP-AUDIO-01, GAP-AUDIO-06, D-303, GAP-EVT-04 | T047, T053, T056 | TST-039, TST-013 | in scope |
| 57 | Gain formula `volume × max(0.25, intensity)` and cue cooldowns | `AppAudioCuePlayer.swift:352`; B §1.5; P PRS-031; GA GAP-AUDIO-03, GAP-CONST-16 | PRS-031, GAP-AUDIO-03, GAP-CONST-16 | T020, T056 | TST-013 | in scope |
| 58 | Audio planner: 3 channels, duplicate suppression, priority replacement, paused ignore, ≤3 concurrent, no ducking | `AppAudioCuePlayer.swift:13-20,77-97`; B §2.6 BEH-019; P PRS-034/035; DEC D-016, D-210; GA GAP-AUDIO-02/07 | BEH-019, PRS-034, PRS-035, GAP-AUDIO-02, GAP-AUDIO-07, D-016, D-210 | T020, T056 | TST-013, TST-039 | in scope |
| 59 | Spatial emitters (Lira chest +0.34 m, behind 2 m, head-locked) with D-306 fallback; LowPower playback mode | P PRS-033/038; DEC D-209/D-306/D-014/D-115, CF-07; GA GAP-AUDIO-04/05 | PRS-033, PRS-038, D-209, D-306, D-014, D-115, CF-07, GAP-AUDIO-04, GAP-AUDIO-05 | T020, T053 | TST-075, TST-039 | in scope |
| 60 | Stop fade 250 ms, pause/resume channel behaviour, fail-stop without fade, missing asset silent + single log | `AppAudioCuePlayer.swift:333-338,385-392,429-437`; B §7; P PRS-037/039; GA GAP-AUDIO-09/11 | BEH-020, PRS-037, PRS-039, GAP-AUDIO-09, GAP-AUDIO-11, ERR-AUDIO-01 | T020, T056 | TST-013, TST-039 | in scope |
| 61 | Audio format: 48 kHz/16-bit, mono for spatial, stereo for head-locked, ≤4 MB decoded | P PRS-103; DEC D-218/CF-20; GA GAP-AUDIO-08, GAP-PERF-08 | PRS-103, D-218, CF-20, GAP-AUDIO-08, GAP-PERF-08 | T047, T071 | TST-039, TST-037 | in scope |
| 62 | Panel inventory (union: Intro(Home), Permissions, Safety, HUD, Summary, Memories, Recovery, Error, Debug) | P PRS-055..059; DEC CF-24, D-055; GA GAP-UI-01 | GAP-UI-01, CF-24, D-055, PRS-055 | T051, T052 | TST-037 | in scope |
| 63 | Panel placement grammar: 1.1 m, −5° pitch, ≥0.8 m, lazy follow τ 0.35 s / 15° re-center | P PRS-050/051; DEC CF-23, D-211, D-212, D-305; GA GAP-UI-02 | PRS-050, PRS-051, CF-23, D-211, D-212, GAP-UI-02, D-305 | T051, T064 | TST-038, TST-030 | in scope |
| 64 | Intro/Home content: title, three lines, Begin Walk primary + Demo Walk secondary, Bond footer, Memories button | P PRS-055/059; `OnboardingFlowView.swift:55-57`; GA GAP-UI-03/04; DEC D-057/D-059 | PRS-055, PRS-059, GAP-UI-03, GAP-UI-04, D-057, D-059, FR-001 | T022, T060, T066 | TST-034, TST-030, TST-072 | in scope |
| 65 | Glance HUD: 3 lines (phrase / path-pressure / m:ss · N m), placement 1.1 m −8°/−11°, 18×10 cm, 1 Hz refresh, 4 s phrase dwell, no chip | P PRS-056/060; DEC D-060, D-212, D-215, D-216, CF-11, CF-21; GA GAP-UI-05/06/07/14 | PRS-056, PRS-060, D-060, D-212, D-215, D-216, CF-11, CF-21, GAP-UI-05, GAP-UI-06, GAP-UI-07, GAP-UI-14 | T022, T064 | TST-038, TST-077 | in scope |
| 66 | Phrase copy table and path/pressure label copy, used as audio captions | `CompanionPresenceView.swift:24-69,140-151`; P PRS-056; DEC D-042; GA GAP-UI-08/09, GAP-A11Y-02 | GAP-UI-08, GAP-UI-09, D-042, PRS-080, D-057 | T060, T064 | TST-038, TST-077 | in scope |
| 67 | Control row: Pause/Resume and End capsules 6×4 cm, labels, no Stop confirmation, one-interaction stop | P PRS-057; DEC D-021, CF-22; GA GAP-UI-10/11/12; `spec.md` FR-010, SC-007 | PRS-057, PRS-053, D-021, CF-22, GAP-UI-10, GAP-UI-11, GAP-UI-12, FR-010, SC-007 | T022, T026, T064 | TST-034, TST-055, TST-038 | in scope |
| 68 | Additive-display colors, typography minimums, SUIK components and two input modes, no voice input | P PRS-052/053/054; DEC D-022, D-213, CF-22, D-217; GA GAP-UI-13/17, GAP-A11Y-04 | PRS-052, PRS-053, PRS-054, PRS-083, D-022, D-213, CF-22, D-217, GAP-UI-13, GAP-UI-17, GAP-A11Y-04 | T051, T052, T060 | TST-038, TST-037 | in scope |
| 69 | Continuity hint copy, version label `v0.1.0`, startup log, hidden Debug panel (5-pinch/3000 ms, not during walk) | `ARContinuityHint.swift:18-27`; P PRS-060/061; DEC D-052, D-055; GA GAP-UI-15, GAP-PUB-07/08 | PRS-060, PRS-061, D-052, D-055, GAP-UI-15, GAP-PUB-07, GAP-PUB-08, LSB-093 | T060, T064, T067 | TST-072, TST-030 | in scope |
| 70 | Memories panel: last 5 lines newest-first plus empty-state copy | P PRS-059; `WaykinApp.swift:1925`; GA GAP-UI-04; DEC D-059; `spec.md` acceptance 2 (US4) | PRS-059, FR-013, GAP-UI-04, D-059 | T030, T066 | TST-031, TST-035 | in scope |
| 71 | Onboarding flow and verbatim copy (Intro → Permissions → Safety, 5 bullets) | P PRS-070; `OnboardingFlowView.swift:227-235`; DEC CF-14; GA GAP-ONB-01/02/03; `spec.md` FR-001 | PRS-070, GAP-ONB-01, GAP-ONB-02, GAP-ONB-03, CF-14, FR-001 | T051, T060, T065 | TST-031 | in scope |
| 72 | Permission prompt timing (first Begin Walk), RawLocation only, no Experimental API | P PRS-071; L LSB-014; DEC D-301/CF-29; GA GAP-ONB-04; `spec.md` FR-014 | FR-014, PRS-071, D-301, CF-29, GAP-ONB-04, LSB-014 | T003, T027 | TST-051, TST-070 | in scope |
| 73 | Denial / services-unavailable / lost-mid-walk copy with Demo Walk fallback | P PRS-072; `WaykinApp.swift:936,958,1413`; GA GAP-ONB-03, GAP-ERR-01..03 | PRS-072, GAP-ERR-01, GAP-ERR-02, GAP-ERR-03, ERR-GPS-01, ERR-GPS-02, ERR-GPS-04 | T025, T060 | TST-036, TST-051 | in scope |
| 74 | Persistence: store API, profile v1 + checkpoint v1 schema, key names, migration, corruption backup, 8 KB cap, store-full order, 60-day expiry, onboarding flag reset | B §6 BEH-041..046; L §6; DEC D-112/CF-10/CF-12, NC-08, NC-13; GA GAP-PERSIST-01..06, PERSIST-09 | BEH-041, BEH-042, BEH-043, BEH-044, BEH-045, BEH-046, GAP-PERSIST-01, GAP-PERSIST-02, GAP-PERSIST-03, GAP-PERSIST-04, GAP-PERSIST-05, GAP-PERSIST-06, PERSIST-09, D-112, CF-10, CF-12, NC-08, NC-13, LSB-075, LSB-076, LSB-077, LSB-078, LSB-083 | T030, T057, T065, T070 | TST-014, TST-031, TST-035 | in scope |
| 75 | Companion identity (Lira, fixed UUID) and default profile creation | `PersistenceStore.swift:39-49`; B §6; GA GAP-PERSIST-07 | GAP-PERSIST-07, BEH-041, BEH-043 | T030, T057 | TST-014 | in scope |
| 76 | Reduce Motion in-Lens toggle (persisted) and onboarding replay from Memories | P PRS-081/073; DEC D-041, NC-30; GA GAP-ONB-07, GAP-A11Y-03 | PRS-081, PRS-073, NC-30, D-041, GAP-ONB-07, GAP-A11Y-03 | T057, T066 | TST-073, TST-031 | in scope |
| 77 | Non-color redundancy: shape + text + audio per state; each cue coincides with a HUD phrase change | P PRS-080/082; DEC D-042; GA GAP-A11Y-01/02; GA GAP-UI-14 | PRS-080, PRS-082, D-042, GAP-A11Y-01, GAP-A11Y-02, GAP-UI-14 | T019, T050, T056, T064 | TST-016, TST-038, TST-079 | in scope |
| 78 | Motion comfort: Lira ≤5 m/s, yaw slew ≤180°/s, no flashes, HUD τ 0.35 s, reduced-motion variants | P PRS-082; DEC D-041, D-204, D-212; GA GAP-A11Y-03 | PRS-082, PRS-081, D-041, D-204, D-212, GAP-A11Y-03 | T019, T059, T064 | TST-016, TST-017, TST-073 | in scope |
| 79 | Volume cap (never exceeds catalog gains) and the safety volume bullet | P PRS-084/070; `OnboardingFlowView.swift:229` | PRS-084, PRS-070, PRS-031 | T020, T065 | TST-039, TST-031 | in scope |
| 80 | Hit targets ≥4×4 cm (6×4 cm controls) and text cap 1.2 / 2.0 cm | P PRS-053/057; DEC D-213, CF-22, NC-31; GA GAP-A11Y-04/05, GAP-UI-17 | PRS-053, PRS-057, D-213, CF-22, NC-31, GAP-A11Y-04, GAP-A11Y-05 | T051, T052 | TST-038 | in scope |
| 81 | Performance target: 60 FPS (≤16.67 ms), CPU/GPU <100 % budget, measurement method | P PRS-090/094; GA GAP-PERF-01/02; `spec.md` SC-002/003 | PRS-090, PRS-094, GAP-PERF-01, GAP-PERF-02, SC-002, SC-003, LSB-080, LSB-081 | T036, T071, T072 | TST-050, TST-060 | in scope (NOT_COMPUTABLE until receipts) |
| 82 | Content budgets: ≤15k Lira tris, ≤25k scene tris, ≤25 bones, 1 body material, ≤512² textures, no PBR | P PRS-091; DEC NC-07, NC-31, CF-31, D-302; GA GAP-PERF-03/04 | PRS-091, NC-07, NC-31, CF-31, GAP-PERF-03, GAP-PERF-04, LSB-020 | T045, T046, T050, T071 | TST-037, TST-079 | in scope |
| 83 | Draw calls ≤20; single UpdateEvent for presentation; core on 1 Hz DelayedCallback; no per-frame allocation | P PRS-092; DEC D-047, CF-31; GA GAP-PERF-06, GAP-PERF-05 | PRS-092, D-047, CF-31, GAP-PERF-05, GAP-PERF-06 | T019, T026, T071 | TST-037, TST-050 | in scope |
| 84 | Script budget ≤2.0 ms per frame | P PRS-091; DEC D-219 | PRS-091, D-219, LSB-030 | T071 | TST-037, TST-050 | in scope |
| 85 | Lens package size ≤25 MB (target ≤15 MB) | P PRS-091; L LSB-090; DEC D-314; GA GAP-PERF-07, GAP-PUB-03 | PRS-091, LSB-090, D-314, GAP-PERF-07, GAP-PUB-03 | T035, T071 | TST-037, TST-070 | in scope |
| 86 | Lira source rig (`.blend`, 25 bones, 6 actions) and license (NC-09 resolved: paid Meshy plan, no gate) | P PRS-100; L LSB-020; DEC D-302, CF-03, NC-09; GA GAP-ASSET-01 | PRS-100, D-302, CF-03, NC-09, GAP-ASSET-01, LSB-020 | T041, T045 | TST-037 | in scope (T073 gated by T041) |
| 87 | Export to glTF binary + Lens import options + prefab rename `Prefab_LiraModel` | P PRS-101; L LSB-021/022; DEC D-220; GA GAP-ASSET-02/03 | PRS-101, LSB-021, LSB-022, D-220, GAP-ASSET-02, GAP-ASSET-03 | T045, T046 | TST-037 | in scope |
| 88 | Clip action names `Lira_*` and asset naming conventions | P PRS-102/004; DEC D-221, D-302; GA GAP-ASSET-04/05, CF-03 | PRS-102, PRS-004, D-221, D-302, GAP-ASSET-04, GAP-ASSET-05, CF-03 | T045, T046, T047 | TST-037 | in scope |
| 89 | Audio asset list + conversion; glyph, icon, 3:4 preview; UI Kit default font | P PRS-103/104/105; L LSB-023/024/025; DEC D-222; GA GAP-ASSET-06/07/08, NC-33 | PRS-103, PRS-104, PRS-105, LSB-023, LSB-024, LSB-025, D-222, GAP-ASSET-06, GAP-ASSET-07, GAP-ASSET-08, NC-33 | T047, T048, T049, T051 | TST-039, TST-079 | in scope |
| 90 | Project setup: Base Template, Spectacles platform, Experimental OFF, SUIK install, DeviceTracking World, version pins, prerequisites | L LSB-001..007, LSB-010..013, LSB-015, LSB-070; GA GAP-SCENE-01/02/07, GAP-L-CONST-01; DEC NC-05, NC-50, NC-51 | LSB-001, LSB-002, LSB-003, LSB-004, LSB-005, LSB-006, LSB-007, LSB-010, LSB-011, LSB-012, LSB-013, LSB-015, LSB-070, GAP-SCENE-01, GAP-SCENE-02, GAP-SCENE-07, NC-05, NC-50, NC-51 | T003, T042 | TST-030, TST-037 | in scope |
| 91 | Scene hierarchy (L §5.1 + CF-24 additions), material assignment, input wiring, build order gates | L LSB-040..044, LSB-050, LSB-060..067; DEC D-046, D-047, D-304, CF-24; GA GAP-SCENE-03/04/05 | LSB-040, LSB-041, LSB-042, LSB-043, LSB-044, LSB-050, LSB-060, LSB-061, LSB-062, LSB-063, LSB-064, LSB-065, LSB-066, LSB-067, D-046, D-047, D-304, CF-24, GAP-SCENE-03, GAP-SCENE-04, GAP-SCENE-05 | T050, T051, T052, T054 | TST-037 | in scope |
| 92 | Core TS copy into the Lens, isolation check, CI parity job, Lens script file set | L LSB-030..032; DEC D-046; GA GAP-SCENE-06, GAP-TEST-01; `spec.md` FR-002/FR-003 | FR-002, FR-003, LSB-030, LSB-031, LSB-032, D-046, GAP-SCENE-06, GAP-TEST-01 | T004, T005, T017, T043, T044 | TST-011, TST-001 | in scope |
| 93 | Demo arc: 7 kinds in order, Δ40 s at 1.4 m/s, 392 m | `DemoSessionController.swift:6-14,40`; B §2.5 BEH-013/015; GA GAP-DEMO-01/02; DEC CF-04 | FR-016, BEH-013, BEH-015, GAP-DEMO-01, GAP-DEMO-02, CF-04, LSB-072 | T015, T021 | TST-010, TST-032 | in scope |
| 94 | Demo real-time pacing (5 s ticks, end at 40 s), pause semantics, demo state machine | DEC D-104/CF-04; B §2.5 BEH-014; GA GAP-SM-09, GAP-DEMO-03, LSB-073 | BEH-014, GAP-SM-09, GAP-DEMO-03, D-104, CF-04, LSB-073 | T021, T023, T055 | TST-032, TST-033 | in scope |
| 95 | Demo label prefix, demo Bond/memory persistence, demo summary note, no spawn theme in Demo | B §2.5 BEH-015/016, §8 BEH-049; DEC D-049, D-015, CF-16; GA GAP-DEMO-04/05/06 | BEH-015, BEH-016, BEH-049, GAP-DEMO-04, GAP-DEMO-05, GAP-DEMO-06, D-049, D-015, CF-16 | T021, T030, T056, T064 | TST-032, TST-018, TST-035 | in scope |
| 96 | End-of-walk summary: fields, computation, closing phrase, path line, moments + reason line, Done dismiss | B §8 BEH-048/049; P PRS-058, LSB-074; DEC D-050, CF-25, CF-26; GA GAP-SUMMARY-01..07 | FR-012, BEH-048, BEH-049, PRS-058, D-050, CF-25, CF-26, GAP-SUMMARY-01, GAP-SUMMARY-02, GAP-SUMMARY-03, GAP-SUMMARY-04, GAP-SUMMARY-05, GAP-SUMMARY-06, GAP-SUMMARY-07, LSB-074 | T031, T061 | TST-018, TST-034 | in scope |
| 97 | Field receipt contents and `WAYKIN_RECEIPT` Logger output channel | B §8 BEH-050; DEC D-310; GA GAP-L-TEST-01; `spec.md` FR-017 | FR-017, BEH-050, D-310, GAP-L-TEST-01 | T034, T063 | TST-062 | in scope |
| 98 | Publish checklist and acceptance gates: permissions, no Experimental API, size, metadata, capturability, review, and preview/device acceptance runs | L LSB-080..084, LSB-090..099; GA GAP-PUB-01..06, GAP-TEST-01..06; `spec.md` SC-001, SC-005..SC-007 | SC-001, SC-005, SC-006, SC-007, LSB-080, LSB-081, LSB-082, LSB-083, LSB-084, LSB-090, LSB-091, LSB-092, LSB-093, LSB-094, LSB-095, LSB-096, LSB-097, LSB-098, LSB-099, GAP-PUB-01, GAP-PUB-02, GAP-PUB-03, GAP-PUB-04, GAP-PUB-05, GAP-PUB-06, GAP-TEST-01, GAP-TEST-02, GAP-TEST-03, GAP-TEST-04, GAP-TEST-05, GAP-TEST-06 | T016, T023, T036, T067, T072, T073 | TST-001, TST-030, TST-032, TST-034, TST-035, TST-060, TST-070 | in scope |
| 99 | NC device measurements: GPS accuracy/cadence, power/thermal at 60 FPS, battery drain, toolchain pins, ground fit, rig license | DEC §Needs Clarification (NC-01..NC-09) | FR-018, BEH-032, BEH-033, PRS-091, LSB-001, NC-01, NC-02, NC-03, NC-05, NC-06, NC-07, NC-09 | T200, T201, T202, T203, T204, T205 | TST-052, TST-060, TST-061, TST-071 | in scope (hardware) |

---

## 2. New tasks added for coverage

| Task | Owner | Files | Acceptance |
|---|---|---|---|
| **T202** (defined in `tasks.md` Phase NC) | human | `docs/design/receipts/LENS_BUILD_<UTC>_<sha>.md` | Battery % is logged at the start and end of a 15-minute walk; drain ≤ 40 points. D-061 is implemented only once accepted. TST-071 PASS. |

All other task ids used above already exist in `tasks.md`.

---

## 3. Test catalog

**Environments**: Node = `node --test` (CI, `ts-core-parity` job); PV = Lens Studio Preview with Spectacles device override; DEV = device, indoors; FLD = outdoor field walk.
Existing TST ids and meanings are unchanged; new ids continue from TST-070.

| TST | Type | Requirement ids | Procedure | Numeric pass criteria | Environment |
|---|---|---|---|---|---|
| TST-001 | unit-vector | FR-004, BEH-001, GAP-CONST-01 | Replay `Tests/Vectors/seed-event` `rngStream` for every seed, including 0 and 42 | 100 % of `UInt64` values bit-exact; seed 0 → `0x9E3779B97F4A7C15`; 0 mismatches | Node |
| TST-002 | unit-vector | BEH-001, BEH-002, GAP-CONST-02/03/05 | Replay event vectors: cooldown, tick spacing, allowedKinds, selection, RNG non-advance on null | 100 % of ticks, kinds, weights, and null returns equal; RNG draw count exact | Node |
| TST-003 | unit-vector | BEH-001, GAP-CONST-06..11 | Replay world-state vectors | Every field identical after clamp (`===`); pressure/energy/familiarity within 0 | Node |
| TST-004 | unit-vector | BEH-035, BEH-036, BEH-037 | Replay movement-integrity vectors (all reject reasons) | Dispositions 100 % exact; distance within ±0.05 m; reject reason string exact | Node |
| TST-005 | unit-vector | BEH-003, GAP-EVT-01/02 | Replay pursuit vectors | Transitions 100 % exact; no `fading`→other; no `inactive`→`approaching` | Node |
| TST-006 | unit-vector | PRS-001/004, GAP-EVT-03/06 | Replay companion vectors | Behavior string, relative distance, and AR state exact for every event | Node |
| TST-007 | unit-vector | BEH-018, PRS-036 | Cue-chain vectors (event / behavior / AR / path) | Cue kind, intensity, and bias exact; first seed of a layer is silent; ≤1 cue per tick | Node |
| TST-008 | unit-vector | BEH-005..BEH-009, D-109 | Bond vectors plus early-end cases at 59 s and 60 s | Walk +1; demo +2; early end 0 / +1; never negative; no cap applied | Node |
| TST-009 | unit-vector | BEH-010..BEH-012, D-113 | Memory vectors, plus a 300-char case and 6 sequential inserts | Text exact; length ≤280 ending "…" when truncated; exactly 5 kept, newest first | Node |
| TST-010 | unit-vector | BEH-013, BEH-015 | Demo vector replay | 7 kinds in Demo order; cumulative distance 392 m; Bond +2; BEH-015 memory text exact | Node |
| TST-011 | unit | FR-003, LSB-032 | `node scripts/check-isolation.mjs`; `scripts/sync_core_ts.sh --check` | Both exit 0; 0 Lens/Audio/global references in `packages/waykin-core-ts/src` and `logic/` | Node |
| TST-012 | unit | BEH-022, BEH-023 | Drive `logic/sessionMachine.ts` through T1–T21 and every forbidden transition | All 21 allowed transitions reach their target; all forbidden ones are no-ops; second Stop ignored | Node |
| TST-013 | unit | BEH-019, PRS-034/035/037 | Audio planner table tests, incl. pause and stop fade | Duplicate ignored; lower priority ignored; ≥ equal replaces; paused ignores all; ≤3 concurrent; fade = 250 ms ±1 | Node |
| TST-014 | unit | BEH-041..BEH-046, CF-12/CF-13 | Storage codec with a fake store: missing, corrupt, schema 2, store-full, double finalize | Missing → Bond 12; corrupt → `waykin.profile.corrupt.v1` + ERR-PERSIST-01; schema 2 → read-only, 0 writes; double finalize writes once; CF-12 order exact | Node |
| TST-015 | unit | BEH-034, D-102, D-111, CF-06/CF-09 | Location loop with a fake clock | Same-timestamp fix → 0 core calls; degraded at 15 000 ms ±16 ms; 3 errors → degraded; lost at 120 000 ms; no-fix timeout at 30 000 ms ±16 ms; speed `NaN` | Node |
| TST-016 | unit | PRS-003/007/008/009/010, BEH-024 | Lira reducer + clip state | Celebrate → idle at 1500 ms ±16 ms; re-request does not extend; unknown → idle; spawn 700 ms ±16 ms (120 ms ±16 ms reduced); crossfades per PRS-007 | Node |
| TST-017 | unit | PRS-012..PRS-021, D-202..D-207 | Placement math with synthetic head poses | Band forward 1.3/1.6/2.0/3.0 m ±0.001; lateral +0.6 m ±0.001; ground = head y − 1.45 m ±0.001; replant only when >6 m and behind, or >8 s outside ±25°; yaw slew ≤180°/s | Node |
| TST-018 | unit | BEH-048, PRS-058, D-049 | Summary formatter | Every string equals `copy.ts` verbatim; 61 s → "1:01"; "Bond held" when delta = 0; demo note present only for `demoComplete` | Node |
| TST-019 | unit | BEH-031, D-107 | Time-limits controller with a fake clock | Prompts at 900 s and 1200 s ±16 ms; end at 1800 s ±16 ms; 0 prompts and 0 ends while paused | Node |
| TST-020 | unit | BEH-032, CF-08 | Degrade controller with synthetic frame deltas | Enter at 10 s rolling mean >20 ms; exit after 30 s <17 ms; end at 180 s continuous with `reason = power` | Node |
| TST-030 | lens-preview | LSB-070, D-052 | Launch Preview | Logger line `Lens Opened: v0.1.0`; IntroPanel at 110 ±2 cm, −5° ±0.5°; 0 Logger errors | PV |
| TST-031 | lens-preview | PRS-070, PRS-073 | First run, restart, then replay from Memories | Intro → Permissions → Safety → Intro in order; `profile.onboardingDone` true after restart; replay re-runs the flow and does not re-block | PV |
| TST-032 | lens-preview | BEH-013, BEH-014 | Demo Walk | Logged kinds in Demo order at 5 s ±0.1 s spacing; cues match TST-010; summary at 40 s ±0.2 s; no `spawnTheme` | PV |
| TST-033 | lens-preview | BEH-014, BEH-004 | Pause at 12 s for 10 s, then resume | 0 ticks while paused; next tick 5 s after resume; 0 duplicate events | PV |
| TST-034 | lens-preview | SC-007, PRS-057 | End from `acquiringFix`, `walkActive`, `walkPaused`, `demoActive`, `demoPaused` | 1 pinch → summary in <1000 ms from each state | PV |
| TST-035 | lens-preview | SC-006, BEH-046 | 6 demos, 3 restarts, then clear storage | Memories = 5; Bond = 12 + 2n stable across restarts; Bond = 12 after clear with no error copy | PV |
| TST-036 | lens-preview | CF-06, ERR-GPS-02 | Begin Walk in Preview with no GPS | ERR-GPS-02 at 30 000 ms ±1 s; "Demo Walk" starts the Demo; walk not recorded | PV |
| TST-037 | lens-preview | PRS-091, PRS-092, LSB-063/065/067 | Hierarchy diff, input audit, material audit, stats | Hierarchy diff empty; 0 empty inputs; 0 PBR materials; draw calls ≤20; Lira ≤15k tris; ≤25 bones; Lens ≤15 MB; script ≤2.0 ms | PV |
| TST-038 | lens-preview | PRS-053..PRS-057, D-060 | Measure HUD and panels | HUD at 1.1 m ±2 cm, −8°/−11° ±0.5°, ≤3 lines; controls 6×4 cm ±0.1 cm; text cap ≥1.2 cm; phrase dwell ≥4000 ms ±100 ms | PV |
| TST-039 | lens-preview | PRS-031..PRS-039 | Cue storm, missing track, channel audit | ≤3 concurrent; all cues LowPower; gain = `vol × max(.25,i)` ±0.001; missing track silent with exactly 1 log line | PV |
| TST-040 | lens-preview | LSB-071, GAP-CONST-01 | RNG self-test log | 4 logged `next()` values equal `rngStream[0..3]` for seed 42 | PV |
| TST-050 | on-device | SC-002, PRS-090 | Indoor Demo ×5 runs | FPS ≥58 sustained 120 s; CPU and GPU <100 % at every sample | DEV |
| TST-051 | on-device | FR-014, CF-29, D-301 | First Begin Walk; deny; then allow | Only the GPS-Precise prompt appears; ERR-GPS-01 copy exact on deny; first fix within 30 s outdoors when allowed | DEV |
| TST-052 | on-device | PRS-018..PRS-021 | Walk 50 m, turn 180°, cover cameras 3 s | Lira visible ≥80 % of moving time; 0 witnessed replants; hidden immediately on tracking loss; back 500 ms ±50 ms after stable tracking | DEV |
| TST-053 | on-device | SC-006, BEH-042 | Relaunch ×3 after one walk | Bond and memories byte-equal across relaunches; 1 write per finalized session | DEV |
| TST-054 | on-device | BEH-029, CF-30 | Sleep the device 10 s mid-walk | Implicit pause with ERR-LIFE-02; 0 additional distance; no auto-resume | DEV |
| TST-055 | on-device | SC-007, PRS-057 | End while walking at 1.4 m/s, 10 attempts | 1 pinch succeeds ≥9 of 10 | DEV |
| TST-060 | field-walk | SC-002, SC-003, SC-004, BEH-032 | 15-minute protocol per `quickstart.md` | Overlay at 0/5/10/15 min: FPS ≥58, CPU/GPU <100 %; 0 standby events; battery % logged at start and end | FLD |
| TST-061 | field-walk | NC-01, BEH-038 | 3 walks on a known 1 km loop | Accuracy buckets (≤10 / ≤30 / >30 m) logged; distance within ±15 % of loop; accepted ratio recorded | FLD |
| TST-062 | field-walk | FR-017, BEH-050 | Inspect the receipt (`WAYKIN_RECEIPT` line + stored key) | 0 coordinates or route points; timeline ≤200; every count field present | FLD |
| TST-063 | field-walk | BEH-031, D-107 | 30-minute walk (optional) | Prompts at 15:00 and 20:00 ±1 s; auto-end at 30:00 ±2 s with "Lira walked you home." | FLD |
| TST-070 | lens-preview + manual | SC-005, LSB-090..099 | Run the publish checklist | Every LSB-090..099 row PASS; no Experimental API; size ≤25 MB; icon + 3:4 preview set | PV + manual |
| **TST-071** | field-walk | BEH-033, GAP-LIFE-07, NC-03, NC-10 | Run a 15-minute walk on device and log `getBatteryState()` at start and end; in Preview with a fake clock, run the 30:00 hard end | Drain ≤ 40 percentage points; auto-end at 1800 s ±2 s; low-battery line at ≤ 15 %, end with `reason = power` at ≤ 8 % when not charging | FLD |
| **TST-072** | lens-preview | PRS-061, D-052, D-055, GAP-PUB-08 | Launch; confirm version label; 5 pinches within 3000 ms; retry while `walkActive` | Version string `v0.1.0` at 1.0 cm cap height; DebugPanel opens on 5 pinches within 3000 ms ±100 ms; DebugPanel not reachable during `walkActive`; debug text contains 0 coordinate pairs and ≤20 lines | PV |
| **TST-073** | lens-preview | PRS-081, NC-30, D-041 | Toggle "Reduce motion" on Memories; restart; replay spawn and celebrate | `profile.reduceMotion = true` persists across restart; spawn coalesce 120 ms ±16 ms; loop clips frozen at frame 0; HUD follow τ = 0 (no smoothing lag) | PV |
| **TST-074** | unit | D-040, GAP-ERR-04, BEH-048 | Inject a throwing core tick into the session logic; assert the end path | Walk ends with `endedReason = error`; summary is computed and saved; toast copy "Something went wrong. Your walk was saved." exact; 0 uncaught exceptions | Node |
| **TST-075** | lens-preview + on-device | PRS-033, D-209, D-306, CF-07 | Play each cue and inspect emitter transforms; verify the fallback path when spatial is unavailable | Lira-attached cue originates at Lira chest y = +0.34 m ±0.02 m; "behind" cue at 2.0 m head-relative ±0.05 m; either spatial confirmed on device, or exactly one D-306 fallback line exists in the build receipt | PV + DEV |
| **TST-076** | lens-preview | PRS-093, BEH-032, CF-08 | Force degrade with synthetic deltas; inspect Lira, echo, HUD follow and audio | Loop clips off (static pose) within 1 frame of entry; HunterEcho hidden; HUD follow frozen (Δ <0.01 cm/frame); at least one audio channel still plays; exit restores loops | PV |
| **TST-077** | lens-preview | PRS-060, D-216, ERR-GPS-03 | Trigger the weak-location line and a continuity-replant hint | HUD line 2 shows each string for 4000 ms ±100 ms; 0 toast panel objects exist; lines 1 and 3 unchanged during the 4 s | PV |
| **TST-078** | unit-vector | GAP-EVT-14, BEH-010, BEH-011 | Replay path-relation vectors for establishing/onPath/strained/offPath/recovered | Relation 100 % exact; reject streak 3 → strained and 8 → offPath; pressure boosts within 1e-9 | Node |
| **TST-079** | lens-preview | PRS-009, PRS-011, PRS-017, PRS-023, D-011, D-205, D-208, D-304, CF-19 | Inspect scene materials, Lira hierarchy and echo silhouette | Exactly 1 body material (Dawn) + 1 echo material at alpha 0.22 ±0.01; 0 PBR materials; 0 Veil/Rupture assets; contact shadow disc present; per-state scale/indicator matches the PRS-009 table ±0.01 | PV |

---

## 4. Coverage check

**Counts**

| Item | Count |
|---|---|
| Feature rows | 99 |
| Distinct `FR-` ids cited | 18 of 18 (FR-001..FR-018) |
| Distinct `BEH-` ids cited | 50 of 50 (BEH-001..BEH-050) |
| Distinct `PRS-` ids cited | 65 of 65 (PRS-001..023, 030..039, 050..061, 070..073, 080..084, 090..094, 100..105) |
| Distinct `LSB-` ids cited | 60 of 60 (LSB-001..007, 010..015, 020..025, 030..032, 040..044, 050, 060..067, 070..078, 080..084, 090..099) |
| Normative requirement ids cited (BEH + PRS + LSB) | 175 of 175 |
| `SC-` ids cited | SC-001..SC-007 (7 of 7) |
| Task ids used | T001–T073 + T200–T205 (Phase NC) |
| Test ids defined | 51 (TST-001..020, 030..040, 050..055, 060..063, 070, plus new TST-071..079) |

**Requirement ids from BEH/PRS/LSB not referenced by any row: none.**

Verification method and evidence:

- **BEH (50)** — covered as: BEH-001..005 row 1/2/3/5/12; BEH-006..012 rows 16, 14, 15; BEH-013..016 rows 93, 94, 95; BEH-017..021 rows 11, 57, 58, 60, 17; BEH-022..025 rows 18, 19, 39; BEH-026..033 rows 20, 21, 22, 23, 24, 25, 26, 27, 29; BEH-034..040 rows 33, 34, 35, 36, 37, 38; BEH-041..046 row 74; BEH-047 rows 30, 31; BEH-048..050 rows 96, 97.
- **PRS (65)** — covered as: PRS-001..010 rows 39, 40, 41, 42, 43, 44, 45; PRS-011 row 46; PRS-012..023 rows 47..55; PRS-030..039 rows 56..61; PRS-050..061 rows 62..69; PRS-070..073 rows 71, 72, 73, 76; PRS-080..084 rows 77, 78, 79, 68, 76; PRS-090..094 rows 81..85; PRS-100..105 rows 86..89.
- **LSB (60)** — covered as: LSB-001..007 and 010..015 rows 90, 72; LSB-020..025 rows 86, 87, 89; LSB-030..032 row 92; LSB-040..044 and 050 rows 91; LSB-060..067 row 91; LSB-070..078 rows 90, 1, 93, 94, 74, 96; LSB-080..084 rows 81, 91, 67, 74, 37, 98; LSB-090..099 rows 98, 85, 92.

**Rows added for coverage**

- Row 26 (battery handling) is covered by **T202** (Phase NC) and **TST-071**.
- Six new tests were added where no existing TST carried the criterion: TST-072 (Debug panel + version label), TST-073 (Reduce Motion persistence), TST-074 (core exception end path), TST-075 (spatial emitters / D-306 fallback), TST-076 (degrade visual effect), TST-077 (status line 2 / no-toast timing), TST-078 (path-relation vectors), TST-079 (materials, Dawn-only, echo silhouette).

**Open clarifications carried unchanged (no row owns them as a requirement)**

`spec.md` clarifications (consumer Specs battery life, Spectacles Developer Program pricing/terms, Mobile Kit publishability, iOS reference scope) remain open and are tracked by NC-03/NC-10, NC-05/NC-50/NC-51, CF-29, and D-324 respectively. Each is referenced by a row above (rows 26, 61, 72, 74, 90, 91) but is not itself a normative BEH/PRS/LSB id.
