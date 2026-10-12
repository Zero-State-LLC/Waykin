# Tasks: Lira Walks With You

**Inputs**: `spec.md`, `plan.md`, `data-model.md`, `contracts/`, `research.md`, `gap-audit.md`, `decisions.md` + `decisions-tail.md` (Conflicts CF-nn), `behavior-spec.md` (B), `presentation-spec.md` (P), `lens-studio-build.md` (L), `traceability.md` (TST ids).

**Workflow**:

- Follow `anti-slop-code`, `production-systems`, and `google-developer-style`.
- Validate each PR with `/waykin-validate` and review it with `/waykin-pr-review`.
- CI runs only through `.github/workflows/ci.yml`.
- A conflict resolution (CF-nn) binds as proposed until Danny rules on it in T038.

**Owners**:

| Owner | Who |
|---|---|
| core-TS | Pure TypeScript, Node-testable |
| lens-MCP-agent | Lens Studio, through MCP |
| human | Blender, device, and docs work |
| Danny | Product decisions |

The **core port and vectors** (T002, T005–T017) belong to the core-port worker's PR stacked on `spec/spectacles-retarget`. This file references those tasks but does not redefine them. Lens tasks consume the `core/index.ts` surface (L §3.1).

**Markers**:

- `[=]`: unchanged from the previous tasks.md.
- `[~]`: same ID and meaning, with the acceptance or detail amended.
- `[+]`: new.
- `[P]`: can run in parallel.

## Phase 0: Spec closure

- [ ] T038 [+] Danny: Rule on CF-01..CF-33 and on D-041..D-060. Set each status in `decisions.md` / `decisions-tail.md`. Gates T040.
- [ ] T039 [+] human (SCRIBE): Amend `spec.md` and `data-model.md`.
  - FR-014 per D-301/CF-29. FR-007 per D-200. FR-018, SC-003, and SC-004 linked to D-116, NC-02, NC-03.
  - Edge cases linked to D-107 and D-108.
  - Data-model corrections C1, C2, and C4 (GA).
  - Acceptance: no `[NEEDS CLARIFICATION]` remains without an NC or D link.
- [ ] T040 [+] human (SCRIBE): Edit the losing values out of B, P, and L per the CF table (for example L §5.2/5.3/6/7, D-307, NC-55; P appLaunchTheme). Acceptance: a grep for each superseded value returns 0 hits outside `decisions*`. Depends on T038.
- [ ] T041 [+] Danny: Confirm the NC-09 asset rights for the Lira rig and textures. Gates T073.

## Phase 1: Setup

- [ ] T001 [=] Merge ADR-0004 and apply AMENDMENTS (SCRIBE). Gates everything.
- [ ] T002 [=] [P] Scaffold the core package (core-port worker).
- [ ] T003 [~] [P] lens-MCP-agent: Create `spectacles/WaykinLens/` per LSB-010..015 (Base Template, Spectacles platform, Experimental off, SUIK installed, DeviceTracking World, only GPS-Precise). Pin the Lens Studio, SIK, and SUIK versions (NC-05, NC-51) in `plan.md` and in `docs/design/receipts/LENS_BUILD_<UTC>_<sha>.md`. Acceptance: TST-030 (partial).
- [ ] T004 [=] [P] `scripts/sync_core_ts.sh --check`.
- [ ] T005 [=] [P] Isolation check (core-port worker).
- [ ] T042 [+] [P] human: Record the LSB-001..007 prerequisites in the build receipt (§12 template).
- [ ] T043 [+] [P] core-TS: Create `spectacles/WaykinLens/Assets/Scripts/logic/`. It holds pure TypeScript with no Lens APIs (imports only `../core/index`). Tests go in `spectacles/tests/*.test.ts` under `node --test`. Add the step to the `ts-core-parity` job in `ci.yml` (T017). Extend `check-isolation.mjs` to cover `logic/`. Acceptance: TST-011.

## Phase 2: Foundational (core-port worker; reference only)

- T006 BigInt spike (NC-04).
- T007–T010 Swift vector exporter and vectors. The movement vectors must include the D-100 ±0.05 m tolerance field.
- T011–T015 Core modules. T012 must keep a fresh generator per tick (GA C4).
- T016 Parity tests.
- T017 CI job.
- Acceptance owned by that PR: TST-001..TST-011.

- [ ] T044 [+] core-TS: Verify the published `core/index.ts` exports against L §3.1. File a mismatch note in the core PR. Do not edit the core. Depends on T016.

## Phase 2b: Lens logic (pure, Node-tested)

All Phase 2b tasks depend on T043 and T044.

- [ ] T055 [+] [P] core-TS: `logic/sessionMachine.ts` implements the B §3.1 states and T1–T21, the BEH-023 forbidden transitions, and idempotent stop. Acceptance: TST-012.
- [ ] T056 [+] [P] core-TS: `logic/audioPlanner.ts` covers BEH-019 and PRS-034/037: 3 channels, gain `vol×max(.25,i)`, the CF-16 exclusions, and the catalog in B §2.6. Acceptance: TST-013.
- [ ] T057 [+] [P] core-TS: `logic/storageCodec.ts` covers the profile v1 and checkpoint v1 schemas, CF-10 (`onboardingDone`, `reduceMotion`), BEH-042..046, the CF-12 order, and the CF-13 idempotency key. Acceptance: TST-014.
- [ ] T058 [+] [P] core-TS: `logic/locationLoop.ts` covers BEH-034, D-102, D-111/CF-09, NaN speed, and the 30 s first-fix timeout (CF-06). Acceptance: TST-015.
- [ ] T059 [+] [P] core-TS: `logic/liraReducer.ts` and `logic/placement.ts` cover B §3.2 and P §1.4–1.5. Includes CF-01, CF-02, CF-17, CF-18, the D-012 pulse, and the D-204 slew. Acceptance: TST-016, TST-017.
- [ ] T060 [+] [P] core-TS: `logic/copy.ts` holds every verbatim string from B §7, P §3–4 (minus CF-16), and BEH-031, plus `version.ts` (D-052). Acceptance: TST-018 uses only these constants.
- [ ] T061 [+] [P] core-TS: `logic/summary.ts` implements BEH-048 with the PRS-058 layout (CF-25, CF-26) and the D-049 demo note. Acceptance: TST-018.
- [ ] T062 [+] [P] core-TS: `logic/timeLimits.ts` (D-107/CF-05) and `logic/degrade.ts` (CF-08). Acceptance: TST-019, TST-020.
- [ ] T063 [+] [P] core-TS: `logic/receipt.ts` implements BEH-050 (no coordinates, timeline ≤ 200, accuracy buckets for NC-01). Acceptance: TST-062 (field), unit shape test.

## Phase 2c: Assets

- [ ] T045 [+] human: Run the Blender export per LSB-020 with the CF-03 action names, ≤ 15k tris, 25 bones, 512² textures, and a 0.72 m height. Output: `spectacles/WaykinLens/Assets/Lira/Lira_Spectacles.glb`, ≤ 4 MB. Depends on T041 (license note only, not a blocker for dev).
- [ ] T046 [+] lens-MCP-agent: Import per LSB-021 and rename to `Prefab_LiraModel` (LSB-022). Record any missing actions; the PRS-005 fallbacks cover them. Acceptance: TST-037 (assets).
- [ ] T047 [+] [P] human: Convert audio per D-218/CF-20 (PRS-104 mono/stereo column, −18 LUFS, ≤ −3 dBTP) into `Assets/Audio/`. Copy the 9 files and exclude launch and reveal (CF-16). Acceptance: TST-039.
- [ ] T048 [+] [P] human: Prepare the glyph 256², `Icon.png` 512², and `Preview_3x4.png` 1080×1440 (LSB-024/025).
- [ ] T049 [+] [P] human: Create `Assets/Lira/lira_shadow_256.png`, a radial alpha disc (PRS-104).

## Phase 2d: Scene

- [ ] T050 [+] lens-MCP-agent: Create the materials (LSB-040..043, Dawn, unlit) and the echo material at alpha 0.22 (PRS-011/CF-19). Acceptance: 0 PBR materials (TST-037).
- [ ] T051 [+] lens-MCP-agent: Build the L §5.1 tree with the CF-24 panels.
  - Replace NoticePanel with ErrorPanel.
  - Add PermissionsPanel, SafetyPanel, MemoriesPanel, RecoveryPanel, and DebugPanel. Each is off at start, at z −110 cm, −5° pitch.
  - Rebuild HudPanel per PRS-056/057: 18×10 cm; Pause and End 6×4 cm.
  - Add `HunterEcho` and `ContactShadow` under LiraAnchor.
- [ ] T052 [+] lens-MCP-agent: Wire inputs per LSB-050 for the new panels. Acceptance: 0 empty inputs (TST-037).
- [ ] T053 [+] lens-MCP-agent: Configure the 3 AudioComponents: LowPower; spatial per D-209 with the CF-07 fallback recorded; Lira emitter at y +34 cm; Behind emitter at z +200 cm head-relative.
- [ ] T054 [+] [P] core-TS: `scripts/lens_hierarchy_diff.mjs` diffs the MCP hierarchy dump against `specs/.../expected-hierarchy.txt`, which is generated from L §5.1 plus CF-24. Acceptance: TST-037 diff empty.

## Phase 3: US1, Demo Walk (P1)

- [ ] T018 [~] [US1] Lira glTF import is now T045/T046 (D-302, CF-03). The budget is NC-07 (15k / 25 bones).
- [ ] T019 [~] [US1] lens-MCP-agent: Write `presentation/LiraController.ts`. It applies `liraReducer` and `placement` per frame (one UpdateEvent, D-047), maps clips per CF-03 with the PRS-005 fallback, and implements crossfades (PRS-007), the watchdog (PRS-008), scale (PRS-009), and spawn (PRS-010). Acceptance: TST-016, TST-017, TST-032.
- [ ] T020 [~] [P] [US1] lens-MCP-agent: Write `adapters/AudioAdapter.ts` as a wrapper around `audioPlanner`, with the 250 ms stop fade. Acceptance: TST-039.
- [ ] T021 [~] [US1] lens-MCP-agent: Write `demo/DemoDriver.ts` at 5000 ms ticks with the +5 s auto-end (D-104/CF-04) and the RNG self-test log. Acceptance: TST-032, TST-040.
- [ ] T022 [~] [US1] lens-MCP-agent: Write `presentation/IntroPanel.ts` (PRS-055: Begin, Demo, Memories, footer) and `HudPanel.ts` (Pause/Resume and End always reachable). Acceptance: TST-034.
- [ ] T023 [~] [US1] human: In Preview, check that the Demo order equals `Tests/Vectors/demo/*.json`. Acceptance: TST-032, TST-033, recorded in the PR.
- [ ] T064 [+] [US1] lens-MCP-agent: HUD behavior covers PRS-056, D-212 lazy-follow, D-215 1 Hz updates, the D-060 dwell, the D-216 status line, and the D-049 demo prefix. Acceptance: TST-038.
- [ ] T065 [+] [US1] lens-MCP-agent: Build the onboarding panels with the PRS-070 flow and copy and CF-14 (silent, no reveal cue). Acceptance: TST-031.
- [ ] T066 [+] [US1] lens-MCP-agent: Build the MemoriesPanel (PRS-059), the replay button (PRS-073), and the Reduce motion toggle (NC-30, persisted as `reduceMotion`). Acceptance: TST-031, TST-016.
- [ ] T067 [+] [P] [US1] lens-MCP-agent: Add the version label and log (D-052) and the DebugPanel 5-pinch toggle (D-055). Acceptance: TST-030.

## Phase 4: US2, Begin Walk outdoors (P2)

- [ ] T024 [~] [US2] lens-MCP-agent: Write `adapters/LocationAdapter.ts` (RawLocationModule, Navigation accuracy, 1 s DelayedCallback) feeding `locationLoop`. Acceptance: TST-015, TST-036.
- [ ] T025 [~] [US2] lens-MCP-agent: Route ERR-GPS-01/02/04 to the ErrorPanel with the "Demo Walk" and "Back" / "Try again" buttons. Acceptance: TST-036, TST-051.
- [ ] T026 [~] [US2] lens-MCP-agent: Write `SessionController.ts`. It drives `sessionMachine` and runs movement → experience → runtime → audio chain → presentation. It uses seed 42 (CF-15) and is the only writer to storage. Acceptance: TST-012 logic, TST-034.
- [ ] T027 [~] [US2] lens-MCP-agent: Set permissions per D-301/CF-29: RawLocation only, no Experimental API. Record the result in `quickstart.md`. Acceptance: TST-051.
- [ ] T068 [+] [US2] lens-MCP-agent: Implement tracking and continuity. Use the NC-15 proxy or the DeviceTracking API (record which), the 1 s continuity check, the CF-17 hide and show, and the CF-18 replant. Acceptance: TST-052.
- [ ] T069 [+] [US2] lens-MCP-agent: Implement the lifecycle. Look for an OS pause or focus event; otherwise use the > 5 s frame-gap proxy (CF-30, NC-16). Acceptance: TST-054.

## Phase 5: US3, bounded pursuit (P3)

- [ ] T028 [~] [US3] lens-MCP-agent: Map pursuit events to cues, Lira alert, and the HunterEcho in alert only (CF-19). Render no pursuer entity. Acceptance: TST-005, TST-032.
- [ ] T029 [~] [US3] lens-MCP-agent: While paused, send no ticks, freeze pursuit, and pause audio (BEH-004). Acceptance: TST-033.

## Phase 6: US4, summary, Bond, memories (P4)

- [ ] T030 [~] [US4] lens-MCP-agent: Write `adapters/StorageAdapter.ts` as a thin wrapper around `storageCodec`. It uses string keys (verify `putString`) and handles `onStoreFull` per CF-12. Acceptance: TST-014, TST-035, TST-053.
- [ ] T031 [~] [US4] lens-MCP-agent: Write `presentation/SummaryPanel.ts` (PRS-058 via `summary.ts`, Done button, bondMilestone once). Acceptance: TST-018, TST-034.
- [ ] T032 [~] [US4] lens-MCP-agent: Implement early-end persistence, now specified: reasons `power`, `locationLost`, `timeLimit`, and `interrupted`, with the D-109 Bond rule. Acceptance: TST-008, TST-063.
- [ ] T070 [+] [US4] lens-MCP-agent: Build the RecoveryPanel (BEH-030, D-108/CF-13: offer ≤ 24 h, silent finalize after). Acceptance: TST-014, TST-035.

## Phase 7: Polish and release

- [ ] T033 [~] [P] lens-MCP-agent: Implement the degrade path per CF-08 (static pose, echo hidden, audio kept, end at 180 s). Acceptance: TST-020, TST-060.
- [ ] T034 [~] [P] lens-MCP-agent: Write `adapters/ReceiptAdapter.ts` using `receipt.ts`. Output goes to the `WAYKIN_RECEIPT` Logger line and the stored key. Acceptance: TST-062.
- [ ] T035 [~] human + lens-MCP-agent: Run the publishing checklist LSB-090..099. Acceptance: TST-070.
- [ ] T036 [~] human: Run the 15-minute protocol and the TST-061 GPS walks. Attach the receipts to issue #41. Results stay `NOT_COMPUTABLE` until observed. Acceptance: TST-060, TST-061.
- [ ] T037 [=] [P] SCRIBE: Update the README and docs pointers.
- [ ] T071 [+] lens-MCP-agent: Run the perf audit: draw calls ≤ 20, tris, bones, size ≤ 15 MB, script ≤ 2.0 ms per frame (Perfetto). Acceptance: TST-037, TST-050.
- [ ] T072 [+] human: Run the device suite TST-050..055 and record the results in the receipt.
- [ ] T073 [+] Danny + human: Submit with metadata (LSB-098). Gated by T041, TST-070, and TST-060 PASS.

## Dependencies

- T001 gates everything.
- T038 gates T040. T040 must finish before Phase 2b is merged; work may start on the proposed defaults.
- The core PR (T006–T017) must land before T044. T044 gates Phase 2b.
- T043 gates Phase 2b.
- T003 gates T046 and T050–T053.
- T045 must finish before T046, and T046 before T019.
- T047 must finish before T053, and T053 before T020.
- T051 gates T052, and T052 gates every Phase 3+ lens task.
- Phase 3 must finish before Phase 4, and Phase 4 before Phase 5. Phase 6 needs T026's interface (it can run alongside Phase 4 after T055).
- T071 and T072 must finish before T035. T035 and T036 must finish before T073.

**Parallel sets**:

- T055–T063
- T047–T049
- T020 alongside T019
- T033, T034, T037, T067
- T054 alongside T051

**Hardware**: T036, T072, and T073 require hardware. Every device claim stays `NOT_COMPUTABLE` until those receipts exist.
