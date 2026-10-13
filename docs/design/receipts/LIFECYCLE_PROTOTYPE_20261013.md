# Lifecycle / downstream prototype — 2026-10-13

**OBSERVED: candidate exact parity PASS; migration gate FAIL.**
These are separate claims. Production adoption is not approved.

The approved isolated prototype now runs the actual MovementEngine and
CompanionWalkExperience, not an imitation of those classes. It compiles the
actual Swift core with one checked temporary distance substitution and the
actual TypeScript core with the corresponding substitution. Experience
projections are copied mechanically from the existing Swift vector exporter.
No production sources or canonical vectors are edited.

## Exact candidate comparison

- 64 cases: all 12 pairs behind the earlier processor decision changes, plus
  four control pairs, each at 0.5, 1, 2 and 14 second intervals.
- 19,264 operation steps per build mode; **zero Swift/TypeScript mismatches**.
- 128 completed-session results per mode; Bond delta and memory text compared.
- Explicit start/pause/resume/end/restart, invalid transitions, paused/stopped
  rejection, fresh anchors, duplicate/stale/inaccurate samples, gaps and walks.
- Full experience state/history, generated events, companion commands, semantic
  audio cues, movement snapshots, diagnostics, session totals and counters are
  compared without epsilon or rounding. Full ended routes are also compared.
- Random identity UUIDs are excluded; event timestamps and semantic state are
  retained. This does not validate persistence or physical audio playback.
- Swift `-Onone` and `-O` outputs are byte-identical, including both the candidate
  and CoreLocation branches. Input, parity mismatch and migration mismatch files
  are also byte-identical between modes.

Six event kinds were observed: companionMovesAhead, bondMoment,
companionDrawsNear, companionObserves, distantPresence and quietInterval.
This corpus does not establish coverage of every pursuit event/transition.
Existing separate experience-vector coverage must not be conflated with an
end-to-end migration test for the unobserved branches.

## Migration result and intentionally failing assertion

The lifecycle corpus contains the original 16-step processor sequences before
each longer walk; direct resets become actual pause/resume calls. It asserts
that the original 264 decision-changing steps remain visible. **Zero did**, so
both runs exit 1 with the assertion failure. Reports and raw outputs are saved
before that assertion; the assertion was not removed or weakened.

Controlled investigation demonstrated that CoreLocation's distance output on
this host depends on preceding calls even for identical coordinate bits and
the same binary. See [CORELOCATION_HISTORY_20261013.md](CORELOCATION_HISTORY_20261013.md)
and [bug #27](https://github.com/Zero-State-LLC/Waykin/issues/27). Therefore the
original full replay's 264 count cannot be transplanted as a context-free
expectation. The test failure is preserved pending an explicitly history-aware
migration protocol, not interpreted as evidence of unchanged behavior.

Within this lifecycle run's actual history, 17,837 steps differ somewhere
between CoreLocation and the candidate. These include **66 steps with changed
generated narrative-event output**. There are no differences in final Bond/
memory results among the 128 finishes, active-time totals, isMoving snapshots,
or accumulated-distance decisions in this corpus. This neither cancels the
earlier counterexamples nor proves their absence in another history. Many
numeric state/history changes persist across subsequent steps; counts are
not independent events or estimates of real-world frequency.

## Evidence and checks

Full manifests, source hashes and paths:
[LIFECYCLE_PROTOTYPE_20261013.json](LIFECYCLE_PROTOTYPE_20261013.json).

Reproduction is documented in `scripts/research/distance-prototype/README.md`.
Raw local outputs:

- Debug: `/var/folders/5v/pc971cjj2g11dntwbdyhrg180000gn/T/waykin-lifecycle-J6eBLi`
- Optimized: `/var/folders/5v/pc971cjj2g11dntwbdyhrg180000gn/T/waykin-lifecycle-TTyIST`

Shared `swift.json` SHA256:
`2130c3b3185ea963d6b9e1d8a0762bbbc40ca138a75c74f64adf09ea291256fb`.
Input SHA256:
`ebd110fae0a704ff0ed19271eb271a1e2621e9700e42e5409f300b7ac529cc1c`.

`make build` PASS; `make test` PASS (134 XCTest tests); `make validate` PASS;
`git diff --check` PASS. The lifecycle commands themselves **FAIL** as described.
Production TS retains its separate frozen-distance speed-parity failure.

No Lens/device, persistence, full path/AR adapter or physical acceptance evidence
was collected. The overall port, #23 and T044 remain incomplete. Next research
must distinguish cold-process and controlled-prefix baseline histories while
keeping exact candidate parity and migration acceptance separate.
