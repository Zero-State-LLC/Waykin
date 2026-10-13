# CoreLocation call-history dependency — 2026-10-13

**OBSERVED; migration gate FAIL.** Tracked by
[bug #27](https://github.com/Zero-State-LLC/Waykin/issues/27).
No production change, tolerance change or vector rewrite was made.

The approved lifecycle prototype found that transplanting the same coordinate
sequences into a different call history did not reproduce the earlier 264
CoreLocation/candidate decision differences. The harness deliberately fails
its retention assertion rather than silently claiming that migration passed.

## Controlled reproduction

Using the **same previously compiled processor binary**, exact binary64 inputs,
and the same target `threshold-223`, five input orders were evaluated. The
target-alone case and the case with its original preceding coordinate pairs
produce different CoreLocation results:

| Prior calls | CoreLocation distance | Step 12 isMoving | Candidate distance bits |
| --- | ---: | --- | --- |
| Target alone | 1.4999996476301658 m | false | `3ff7ffffa1790730` |
| Original coordinate prefix | 1.50000018271028 m | true | `3ff7ffffa1790730` |

The candidate distance stays identical in all five tested orders. Original
complete input replay in the original binary reproduced its entire prior
output byte-for-byte. This establishes a call-history dependency in this host
experiment, not random drift or a claim about Apple's internal implementation.

A possible framework-link explanation was checked: recompiling the small
probe with explicit `-framework CoreLocation` still produced the same result
for the target-alone case. The demonstrated distinction is prior calls; the
internal cause remains unproven.

The reused processor probe evaluates both Apple and candidate distances while
iterating its pair list. This experiment therefore does **not** yet isolate
Apple-only history from candidate-call side effects (for example, floating-point
environment effects). The dependency is observed in the research process;
claiming the same mechanism in the production app would be premature.

See [raw bit evidence](CORELOCATION_HISTORY_20261013.json), which records the
probe/input hashes and each order. Reproduce using:

```sh
node scripts/research/distance-prototype/corelocation_history.cjs /path/to/processor/probe /path/to/processor/swift-input.json threshold-223
```

Host: Apple Swift 6.3.2, arm64 macOS, Node 22.23.1. No Lens or physical-device
execution. Results must not be generalized to every CoreLocation runtime.

## Effect on earlier receipts

The 264 changes in `PORTABLE_GEODESIC_20261013.md` and earlier processor
receipts remain reproducible **for their full original call order**. They are
not a context-independent count for those coordinate pairs, an application
migration total, or an estimate of real-world incidence. Individual threshold
cases must retain process/call-history provenance. Candidate Swift/JS parity
results are separate and are not invalidated by this CoreLocation dependency.

## Next evidence required

Follow-up: [CORELOCATION_ISOLATION_20261013.md](CORELOCATION_ISOLATION_20261013.md)
now demonstrates the dependency with Apple-only calls, while candidate-only
prefixes do not affect the target result. This resolves the candidate-side-effect
question for the tested target/host, not the internal mechanism or other runtimes.

- Preserve the failing lifecycle retention gate and its captured reports.
- Record both cold-process and controlled-prefix histories explicitly.
- Separate Apple-only and candidate-interleaved prefixes to isolate any
  research-harness side effect before interpreting application behavior.
- Retain original counterexamples in their demonstrated history rather than
  moving them into another sequence and assuming CoreLocation is stateless.
- Complete lifecycle/downstream migration review before any runtime switch.
- Keep production frozen and obtain separate adoption approval/ADR as planned.

The GitHub skill was used to file the bounded defect, following the repository
rule for validation defects. The port, #23, T044 and draft PR #26 remain open.
