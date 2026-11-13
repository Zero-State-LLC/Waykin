# Apple-only vs candidate-interleaved history — 2026-10-13

**OBSERVED: the target's call-history dependency reproduces with Apple-only
calls.** Candidate-only warm-up does not change Apple's target result in this
experiment. The prototype is therefore not the demonstrated cause here.
Apple's internal mechanism and other platforms remain unproven.

This is read-only diagnostic work under the approved isolated prototype. It
does not repair or relax #27's failing migration gate, approve adoption, amend
the Swift production freeze, or claim that the overall port is complete.

## Method and results

`HistoryIsolationProbe.swift` receives the same exact coordinate bits as the
original experiment and runs one mode in each fresh process:

- `apple`: only CLLocation distance calls, never candidate calls.
- `mixed`: Apple then candidate for each pair, matching the prior pair probe.
- `candidatePrefix`: candidate calls for other pairs; Apple only for the target.

Five histories (target alone, original prefix, all pairs, reversed pairs,
repeated target) run under each mode and both Swift `-Onone` and `-O`: 30 fresh
process runs. All returned target input bits are checked. Optimization-mode
outputs are identical. Regression assertions verify the relationships below.

| History | Apple-only distance bits | Mixed distance bits | Candidate-prefix Apple bits |
| --- | --- | --- | --- |
| Alone / repeated target | `3ff7ffffa1695452` | same | `3ff7ffffa1695452` |
| Original prefix / all pairs | `3ff80000310bc13d` | same | `3ff7ffffa1695452` |
| Reversed pairs | `3ff800005e95150d` | same | `3ff7ffffa1695452` |

All candidate distances remain `3ff7ffffa1790730`, independent of history.
The first two Apple values are 1.4999996476301658 m and 1.50000018271028 m,
straddling the 1.5 m accumulation boundary. Earlier processor reproduction
also demonstrated an isMoving change for these histories (see prior receipt).
This new probe isolates distance calls; it does not itself replay MovementEngine.

## Implication for migration

The previous uncertainty about candidate-call side effects is resolved for
this target and host: Apple-only history is sufficient. The original 264
decision changes remain valid for their demonstrated full history, not every
transplant of those coordinate sequences.

Recommended research repair, **user-approved after this diagnostic**:
retain the original full-replay regression and test separate explicitly pinned
cold/warm lifecycle histories. Do not require unrelated histories to reproduce
the same 264 count. Keep exact candidate parity, historical migration behavior
and production acceptance as separate gates. Production remains unchanged.

## Reproduction and evidence

```sh
node scripts/research/distance-prototype/history_isolation.cjs /path/to/processor/swift-input.json threshold-223
```

[Machine-readable report](CORELOCATION_ISOLATION_20261013.json) includes source
and input hashes, all result bits, toolchain and local output directory.
Host: Apple Swift 6.3.2, arm64 macOS, Node 22.23.1. No Lens/device execution.
Research command PASS; original lifecycle migration assertion remains FAIL.
The original failing receipt is retained. The subsequent #27 research-only
repair separates full historical regression from cold/warm lifecycle profiles;
it does not reinterpret this diagnostic as production acceptance.
See [the completed scoped repair receipt](HISTORY_SCOPED_LIFECYCLE_20261013.md).

Local `make build`, `make test` (134 tests), `make validate`, and diff check are
recorded separately from the research failure; no production/canonical files
are part of this patch. No new production TS pass is claimed.
