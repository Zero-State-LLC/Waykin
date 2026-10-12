# Traceability: Lira Walks With You

**Status rule**: A row is "in scope" only when it has at least one TST. Device-dependent TSTs report `NOT_COMPUTABLE` until a receipt exists (`WAYKIN_SPEC.md:39`). Conflict resolutions are in `decisions-tail.md` §Conflicts (CF-nn).

**Doc keys**: B = behavior-spec, P = presentation-spec, L = lens-studio-build, GA = gap-audit.

## Matrix

| Feature | Source | Requirements | Tasks | Tests | Status |
|---|---|---|---|---|---|
| RNG / generator | `WorldEventGenerator.swift:65-109` | FR-002, FR-004, BEH-001, BEH-002, GAP-CONST-01..05 | T006, T011, T012, T016 (core worker) | TST-001, TST-002, TST-040 | in scope |
| World state | `Experiences.swift:77-204` | BEH-001, GAP-CONST-06..11, D-001, D-003, D-122 | T013 | TST-003 | in scope |
| Lira companion: states | `CompanionPresentationMatrix.swift:43-90`; `CompanionPresentationState.swift` | FR-007, PRS-001..010, BEH-024, BEH-025, D-106, D-200, D-201, CF-03 | T014, T019, T059 | TST-006, TST-016, TST-032 | in scope |
| Lira companion: placement | `ARWorldCommandRenderer.swift:414-538`; `ARPlacementResolver.swift` | PRS-012..022, D-202..207, CF-01, CF-02, CF-17, CF-18, CF-19, CF-32 | T019, T059, T068 | TST-017, TST-052 | in scope |
| Lira skins | `LiraSkin.swift:13` | D-208, D-304 | T052 | TST-037 | in scope (Dawn only); Veil/Rupture deferred: invisible on additive display |
| Lead / escort mode | `WaykinApp.swift:182` | D-007 | — | — | deferred: covered by the forward target |
| Pursuit | `Experiences.swift:206-234` | FR-009, BEH-003, BEH-004, PRS-011, GA C1 | T014, T028, T029 | TST-005, TST-032, TST-033 | in scope |
| Memories | `Experiences.swift:265-289`; `WalkPathCopy.swift:39-64` | FR-013, BEH-010..012, PRS-059 | T015, T030, T066 | TST-009, TST-035 | in scope |
| Bond | `WaykinApp.swift:1097`; `PersistenceStore.swift:41` | BEH-005..009, D-109, D-118, CF-33 | T015, T030 | TST-008, TST-035, TST-053 | in scope |
| Experiences / events / path | `Experiences.swift:236-263`; `PathProgressEngine.swift` | FR-008, §2.1, §1.4, GAP-EVT-14 | T013, T014 | TST-002, TST-006, TST-007 | in scope |
| Movement integrity / GPS | `MovementIntegrity.swift:16-294`; SNAP location | FR-006, BEH-034..040, D-100..103, D-110, D-111, CF-06, CF-09, CF-27, CF-28 | T013, T024, T058 | TST-004, TST-015, TST-036, TST-061 | in scope |
| Session lifecycle | `WaykinApp.swift:919-1452` | BEH-022, BEH-023, BEH-026..033, T1–T21, D-107, D-108, CF-05, CF-08, CF-13, CF-30 | T026, T055, T062, T069, T070 | TST-012, TST-019, TST-020, TST-034, TST-054 | in scope |
| Persistence | SNAP persistent-storage | FR-013, BEH-041..046, D-112, CF-10, CF-12, CF-13 | T030, T057 | TST-014, TST-035, TST-053 | in scope |
| Audio cues | `AppAudioCuePlayer.swift:35-437`; `AudioExperienceLayer.swift` | FR-008, BEH-017..021, PRS-030..039, D-209, D-210, D-218, CF-07, CF-16, CF-20 | T014, T020, T047, T056 | TST-007, TST-013, TST-039 | in scope |
| Launch / reveal themes | `Audio/README.md` | D-124, D-303, CF-16 | — | — | deferred: no moment; size |
| HUD / glance HUD | `GlassesGlanceSnapshot.swift:19-32` | FR-010, FR-011, PRS-056, PRS-057, PRS-060, D-212, D-215, D-216, D-060, CF-11, CF-21, CF-22 | T022, T064 | TST-038, TST-034, TST-055 | in scope |
| Onboarding / permissions | `OnboardingFlowView.swift`; SNAP transparent-permission | FR-014, PRS-070..073, D-301, CF-14, CF-29 | T027, T065 | TST-031, TST-051 | in scope |
| Demo Mode | `DemoSessionController.swift:6-40` | FR-016, BEH-013..016, D-104, D-049, CF-04 | T015, T021, T023 | TST-010, TST-032, TST-033 | in scope |
| End-of-walk summary | `CompanionPresenceView.swift:71-124`; `WaykinApp.swift:2896-3034` | FR-012, BEH-048..050, PRS-058, D-050, CF-25, CF-26 | T031, T061 | TST-018, TST-034 | in scope |
| Field receipt | `ARCHITECTURE.md:94` | FR-017, BEH-050, D-310 | T034, T063 | TST-062 | in scope |
| Accessibility | `WAYKIN_UIUX_SPEC.md:194-209` | PRS-080..084, D-041, D-042, D-217, NC-30 | T066 | TST-038, TST-016 | in scope; voice input deferred: microphone permission |
| Performance / degrade | SNAP perf overlay | FR-018, SC-002, SC-003, PRS-090..094, D-116, D-219, CF-08, CF-31 | T033, T062, T071 | TST-020, TST-037, TST-050, TST-060 | in scope |
| Asset pipeline | `BUILD_MANIFEST.json`; SNAP glTF | PRS-100..105, LSB-020..025, D-302, D-218, CF-03, NC-09 | T018, T045..T049 | TST-037 | in scope |
| Lens Studio scene | SNAP SIK / UI Kit | LSB-010..067, D-046, D-047, CF-24 | T003, T050..T054 | TST-030, TST-037 | in scope |
| Error handling | `WaykinApp.swift:936,958,1413` | §7 ERR-*, BEH-047 | T025, T060 | TST-036, TST-051 | in scope |
| Publishing | SNAP publishing-lens | FR-014, SC-005, LSB-090..099, D-052, D-055, D-314 | T035, T067, T073 | TST-070 | in scope |
| Mobile Kit / cloud / Health | spec.md FR-015 | — | — | — | deferred: excluded by FR-015 |
| Night time context | `Experiences.swift:237` | D-001, D-122 | — | — | deferred: parity |

## Test catalog

**Environments**: Node = `node --test` in CI; PV = Lens Studio Preview with the Spectacles override; DEV = device indoors; FLD = outdoor walk.

| TST | Type | Requirement | Procedure | Pass criteria |
|---|---|---|---|---|
| TST-001 | unit-vector | FR-004 RNG | Replay `Tests/Vectors/seed-event` rngStream | 100% of values bit-exact; seed 0 → 0x9E3779B97F4A7C15 |
| TST-002 | unit-vector | BEH-002 generator | Replay event vectors (cooldown, spacing, allowedKinds) | 100% of events, ticks, and kinds equal |
| TST-003 | unit-vector | §1.2 | Replay world-state vectors | Values identical after clamp (`===`) |
| TST-004 | unit-vector | BEH-035, BEH-036 | Replay movement vectors | Dispositions 100% exact; distance within ±0.05 m |
| TST-005 | unit-vector | §2.2 | Replay pursuit vectors | Transitions 100% exact; no fading→other |
| TST-006 | unit-vector | matrix | Replay companion vectors | Behavior, distance, and AR string exact |
| TST-007 | unit-vector | BEH-018 | Cue-chain vectors | Cue kind, intensity, and bias exact; first seed silent |
| TST-008 | unit-vector | §2.3 | Bond vectors plus early-end cases (59 s / 60 s) | walk +1; demo +2; early end 0 / +1 |
| TST-009 | unit-vector | BEH-010..012 | Memory vectors, plus a 300-character case and 6 inserts | Text exact; length ≤ 280 ending "…"; 5 kept, newest first |
| TST-010 | unit-vector | BEH-013..015 | Demo vector | 7 kinds in order; 392 m; +2; BEH-015 text exact |
| TST-011 | unit | FR-003 | `check-isolation.mjs`; `sync_core_ts.sh --check` | Both exit 0 |
| TST-012 | unit | §3.1 | Drive `logic/sessionMachine.ts` through all T1–T21 and every BEH-023 forbidden transition | All 21 allowed transitions reach their target; all forbidden ones are no-ops; second stop ignored |
| TST-013 | unit | BEH-019 | Audio planner tables | Duplicate ignored; lower priority ignored; equal or higher replaces; paused ignores all; ≤ 3 concurrent |
| TST-014 | unit | §6 | Storage codec with a fake store | Missing → Bond 12; corrupt → backup key + ERR-PERSIST-01; schema 2 → read-only; double finalize writes once; CF-12 order |
| TST-015 | unit | BEH-034 | Location loop with a fake clock | Same-timestamp fix → 0 core calls; degraded at 15 000 ms ±1 frame; 3 errors → degraded; lost at 120 000 ms; speed NaN |
| TST-016 | unit | §3.2 | Lira reducer | Celebrate → idle at 1500 ms ±16; re-request doesn't extend; unknown → idle; spawn 700 ms (120 ms reduced) |
| TST-017 | unit | PRS-013..021 | Placement math | Band forward 1.3/1.6/2.0/3.0 ±0.001 m; lateral 0.6; ground y−1.45; replant only if > 6 m and behind, or > 8 s outside ±25° |
| TST-018 | unit | BEH-048, PRS-058 | Summary formatter | All strings equal `copy.ts` verbatim; 61 s → "1:01"; "Bond held" when delta is 0 |
| TST-019 | unit | D-107 | Fake clock | Prompts at 900 s and 1200 s; end at 1800 s; none while paused |
| TST-020 | unit | CF-08 | Degrade controller with synthetic deltas | Enter at 10 s of mean > 20 ms; exit at 30 s < 17 ms; end at 180 s |
| TST-030 | lens-preview | LSB-070 | Launch | `Lens Opened: v0.1.0`; Intro at 110 ±2 cm; 0 Logger errors |
| TST-031 | lens-preview | PRS-070, PRS-073 | First run, then restart, then replay | Intro → Permissions → Safety → Intro; flag persists after restart; replay re-runs the flow |
| TST-032 | lens-preview | BEH-013 | Demo Walk | Logged kinds in Demo order at 5 s ±0.1 s spacing; cues match TST-010; summary at 40 s ±0.2 s; no spawnTheme |
| TST-033 | lens-preview | BEH-014 | Pause at 12 s for 10 s | No ticks while paused; next tick 5 s after resume; no duplicates |
| TST-034 | lens-preview | SC-007 | End from acquiringFix, walk, demo, and both paused states | 1 pinch → summary in < 1000 ms |
| TST-035 | lens-preview | SC-006 | 6 demos, 3 restarts, then clear storage | Memories = 5; Bond = 12 + 2n stable across restarts; Bond 12 after clear |
| TST-036 | lens-preview | CF-06 | Begin Walk in Preview (no GPS) | ERR-GPS-02 at 30 s ±1 s; "Demo Walk" starts the Demo |
| TST-037 | lens-preview | perf / scene | Hierarchy diff, inputs, materials, stats | Hierarchy diff empty; 0 empty inputs; 0 PBR materials; draw calls ≤ 20; Lira ≤ 15k tris; ≤ 25 bones; Lens ≤ 15 MB |
| TST-038 | lens-preview | PRS-053..057 | Measure the HUD and panels | HUD at 1.1 m, −8°/−11°, ≤ 3 lines; controls 6×4 cm; text cap ≥ 1.2 cm |
| TST-039 | lens-preview | PRS-034..039 | Cue storm and a missing track | ≤ 3 concurrent; LowPower; missing track silent with 1 log line |
| TST-040 | lens-preview | LSB-071 | RNG self-test | 4 logged values equal rngStream[0..3] |
| TST-050 | on-device | SC-002 | Indoor Demo ×5 | FPS ≥ 58 sustained for 2 min; CPU and GPU < 100% |
| TST-051 | on-device | FR-014, CF-29 | First Begin Walk, deny, then allow | Only GPS-Precise prompt; ERR-GPS-01 on deny; fix within 30 s outdoors when allowed |
| TST-052 | on-device | placement | Walk 50 m, turn 180°, cover cameras 3 s | Lira visible ≥ 80% of moving time; no replant witnessed; hidden on tracking loss, back 500 ms after |
| TST-053 | on-device | SC-006 | Relaunch ×3 | Bond and memories byte-equal |
| TST-054 | on-device | BEH-029 | Sleep for 10 s mid-walk | Implicit pause with ERR-LIFE-02; no distance added |
| TST-055 | on-device | SC-007 | End while walking at 1.4 m/s | 1 pinch succeeds ≥ 9 of 10 tries |
| TST-060 | field-walk | SC-002..004 | 15-minute protocol (`quickstart.md`) | Overlay at 0/5/10/15 min shows FPS ≥ 58 and CPU/GPU < 100%; no standby; battery % logged |
| TST-061 | field-walk | NC-01 | 3 walks on a known 1 km loop | Accuracy buckets logged; distance within ±15% of the loop; accepted ratio recorded |
| TST-062 | field-walk | FR-017 | Inspect the receipt | 0 coordinates; timeline ≤ 200; all count fields present |
| TST-063 | field-walk | D-107 | 30-minute walk (optional) | Prompts at 15:00 and 20:00; auto-end at 30:00 with "Lira walked you home." |
| TST-070 | lens-preview + manual | SC-005 | LSB-090..099 checklist | Every row PASS; no Experimental API; size ≤ 25 MB |
