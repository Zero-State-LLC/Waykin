# Tasks: Lira Walks With You

**Input**: `spec.md`, `plan.md`, `data-model.md`, `contracts/`, `research.md`

**Workflow for every implementing task**:

- Follow the `anti-slop-code` and `production-systems` skills. Follow `google-developer-style` for any prose.
- FORGE decomposes the work, a cloud agent implements it, and SCRIBE files the artifacts.
- Validate each PR with `/waykin-validate` and review it with `/waykin-pr-review`.
- CI runs only through `.github/workflows/ci.yml`.

## Phase 1: Setup

- [ ] T001 Merge ADR-0004 and apply `AMENDMENTS.md` to `WAYKIN_SPEC.md`, `docs/SOLO_MVP_SCOPE.md`, `ROADMAP.md`, and `README.md` (SCRIBE; gates all later tasks).
- [ ] T002 [P] Scaffold `packages/waykin-core-ts/` with `package.json` (no runtime dependencies), `tsconfig.json` (strict), and `src/index.ts`.
- [ ] T003 [P] Create the Lens Studio project at `spectacles/WaykinLens/` with Spectacles Interaction Kit, and pin its version in `plan.md`.
- [ ] T004 [P] Add `scripts/sync_core_ts.sh` with a `--check` mode that copies files to `spectacles/WaykinLens/Assets/Scripts/core/`.
- [ ] T005 [P] Add `packages/waykin-core-ts/scripts/check-isolation.mjs` according to `contracts/core-parity.md`.

## Phase 2: Foundational (blocks all user stories)

- [ ] T006 Spike: Confirm whether the Lens Studio runtime supports `BigInt`. Record the result in `research.md` R3.
- [ ] T007 Add the Swift executable target `Sources/WaykinVectorExport/main.swift` and a `make vectors` rule in `Makefile`.
- [ ] T008 Export seed and event vectors to `Tests/Vectors/seed-event/`. Cover these cases: seed 0, the maximum UInt64, the default rules, cooldown boundaries (equal and one less), tick-spacing boundaries, `allowedKinds`, external last-fire maps, non-finite elapsed, and a weight-boundary pick.
- [ ] T009 [P] Export movement and integrity vectors to `Tests/Vectors/movement/`, using synthetic samples only.
- [ ] T010 [P] Export companion matrix, pursuit, Bond, memory, and Demo arc vectors to `Tests/Vectors/{companion,bond-memory,demo}/`.
- [ ] T011 Implement `packages/waykin-core-ts/src/uint64.ts` with `BigInt` or a 2×uint32 fallback, based on T006.
- [ ] T012 Implement `src/rng.ts` (SplitMix64) and `src/worldEventGenerator.ts` according to the parity rules.
- [ ] T013 [P] Implement `src/worldState.ts`, `src/movementIntegrity.ts`, and `src/movementEngine.ts`.
- [ ] T014 [P] Implement `src/companionRuntime.ts`, `src/pursuit.ts`, and `src/audioSemantics.ts` (seven semantic kinds, with no filenames).
- [ ] T015 [P] Implement `src/bond.ts`, `src/memory.ts` (last-five retention), and `src/demoSession.ts`.
- [ ] T016 Write `test/parity.test.ts`. It validates each vector against `contracts/seed-event-vectors.schema.json` and replays all vectors.
- [ ] T017 Add the `ts-core-parity` job to `.github/workflows/ci.yml`. The job checks vector freshness, runs `tsc`, runs the isolation check, runs `node --test`, and runs `sync_core_ts.sh --check`.

## Phase 3: User story 1, Demo Walk with Lira (P1)

- [ ] T018 [US1] Import the re-authored Lira glTF into `spectacles/WaykinLens/Assets/Lira/`. The rig needs 3 to 4 behavior animations. The polygon budget is [NEEDS CLARIFICATION].
- [ ] T019 [US1] Implement `Assets/Scripts/presentation/LiraController.ts`, which maps companion state and `SpatialIntent` to a world-locked relative pose.
- [ ] T020 [P] [US1] Implement `Assets/Scripts/adapters/AudioAdapter.ts`, which maps semantic cue kinds to Lens audio assets in `Assets/Audio/`.
- [ ] T021 [US1] Implement `Assets/Scripts/demo/DemoDriver.ts` with deterministic ticks, and add an in-Lens RNG self-test log.
- [ ] T022 [US1] Implement `Assets/Scripts/presentation/IntroPanel.ts` with Begin Walk and Demo Walk options, plus the always-on Stop and Pause controls.
- [ ] T023 [US1] Confirm in Preview that the event order matches `Tests/Vectors/demo/*.json`. Record the result in the PR.

## Phase 4: User story 2, Begin Walk outdoors (P2)

- [ ] T024 [US2] Implement `Assets/Scripts/adapters/LocationAdapter.ts`. It uses `GeoLocationAccuracy.Navigation` and polls about every 1 s, then passes samples to the TypeScript movement integrity filter.
- [ ] T025 [US2] Handle denied or unavailable location in `IntroPanel.ts` by offering Demo Walk.
- [ ] T026 [US2] Wire the session loop in `Assets/Scripts/SessionController.ts`. The loop runs movement, then world state, then the generator, then Lira and audio, with the seed taken from the session.
- [ ] T027 [US2] Set the permission manifest to RawLocation plus Internet under Transparent Permission, with no Experimental APIs. Record the setting in `quickstart.md`.

## Phase 5: User story 3, bounded pursuit (P3)

- [ ] T028 [US3] Map the pursuit events to audio cues and Lira behavior in `LiraController.ts` and `AudioAdapter.ts`. Render no pursuer.
- [ ] T029 [US3] Suppress pressure on Pause and Stop in `SessionController.ts`, and test it with the pursuit vectors.

## Phase 6: User story 4, summary, Bond, and memories (P4)

- [ ] T030 [US4] Implement `Assets/Scripts/adapters/StorageAdapter.ts`, which stores Bond and the last five memories in Lens persistent storage.
- [ ] T031 [US4] Implement `Assets/Scripts/presentation/SummaryPanel.ts`, which shows active time, distance, event count, and Bond change.
- [ ] T032 [US4] Persist a partial summary when the walk ends early for thermal, power, or location reasons. The trigger is [NEEDS CLARIFICATION].

## Phase 7: Polish

- [ ] T033 [P] Implement the audio-forward degrade path in `SessionController.ts` (FR-018).
- [ ] T034 [P] Add a privacy-filtered field receipt export (no coordinates) in `Assets/Scripts/adapters/ReceiptAdapter.ts`.
- [ ] T035 Run the Lens Studio publishing checklist. Record the result in the PR.
- [ ] T036 Run the 15-minute outdoor protocol from `quickstart.md`. Attach the receipt to issue #41 or a linked issue, with `OBSERVED` and `NOT_COMPUTABLE` labels only as the evidence supports.
- [ ] T037 [P] SCRIBE: Update `README.md` and `docs/` pointers, and update the open questions in `spec.md`.

## Dependencies and parallel execution

- T001 gates everything.
- T006 must finish before T011.
- T007 must finish before T008, T009, and T010.
- T011 must finish before T012, and T012 through T015 must finish before T016. T016 must finish before T017.
- Phase 2 must finish before every user story.
- US1 must finish before US2, and US2 must finish before US3. US4 depends on US1 and can run in parallel with US2 after T026's interfaces are stable.
- The following tasks can run in parallel:
  - T002 through T005.
  - T009 and T010 (after T007).
  - T013 through T015 (after T011).
  - T020 alongside T018 and T019.
  - T033, T034, and T037.
- T036 requires hardware. Until it runs, every device claim remains `NOT_COMPUTABLE`.
