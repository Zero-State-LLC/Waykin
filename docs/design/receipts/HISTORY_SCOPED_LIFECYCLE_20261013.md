# History-scoped lifecycle research repair (#27) — 2026-10-13

**OBSERVED: the approved research-only repair passes its scoped checks.**
Production and exact-parity requirements are unchanged. This supersedes the
universal-history assertion in the original lifecycle harness, not its evidence
or the full historical processor regression. No runtime adoption is approved.

## Preserved regression and explicit histories

Each invocation verifies the original research source/dependency hashes and
re-executes the complete original processor input with its original probe.
The entire output must remain byte-identical to the recorded original output;
the actual replay must still contain 264 decision-changing steps. All four
invocations passed both assertions. The original 172,032-step replay is not
replaced by a selected subset.

The lifecycle harness separately runs 64 cases in 64 fresh processes per run:

- `cold`: no Apple distance calls before the case.
- `warm-original-pairs`: 2,699 valid original pairs, in original order, before
  each case. Exact prefix bits/hash and all warm-up outputs are retained.

The warm profile is not claimed to reconstruct the original processor's entire
call history. Original sequence inputs and smoothing order remain embedded in
each lifecycle case. Their decision-change count is now a profile-specific
measurement rather than an assumption that all histories must reproduce 264.

## Results

| Profile / Swift mode | Exact mismatch steps | Historical decision changes | Lifecycle old/new changed steps | Narrative-output changed steps |
| --- | ---: | ---: | ---: | ---: |
| Cold / `-Onone` | 0 | 264 | 17,837 | 66 |
| Warm / `-Onone` | 0 | 264 | 17,837 | 66 |
| Cold / `-O` | 0 | 264 | 17,837 | 66 |
| Warm / `-O` | 0 | 264 | 17,837 | 66 |

Each run compares the same 19,264 lifecycle steps and 128 finish results.
The verifier checks persisted exact-bit candidate outputs across all four
runs, and byte-identical input/Swift/parity/migration/historical outputs
between optimization modes within each profile. All checks pass.

**OBSERVED:** Apple lifecycle outputs are also identical between these two
profiles. The transplanted original prefixes have zero decision-changing
steps in both. This does not disprove the separate Apple-only target/history
counterexample or establish independence under arbitrary call histories.
No internal Apple mechanism is inferred from this result.

The full lifecycle migration still changes numeric and narrative outputs.
Final Bond/memory differences were not observed in this corpus. These are
synthetic stress cases, not field incidence or production compatibility.

## Validation and remaining gates

- Four lifecycle runs and `verify_lifecycle_profiles.cjs`: PASS.
- Unknown history profile negative check: rejected before compilation, as intended.
- Apple-only isolation: 30 fresh-process checks, PASS (separate receipt).
- `make build`, `make test` (134 tests), `make validate`, `git diff --check`: PASS.
- Production `npm test`: **84 pass, 1 fail**, no skips. Existing movement parity
  step 11 speed remains 2.223901604670658 vs 2.2263898158654714. Not repaired here.

Lens execution, physical-device evidence, persistence integration and complete
gameplay coverage remain unverified. The research TypeScript solver still uses
the pinned external JS backend with matched primitives. A self-contained Lens
solver and separately approved runtime migration remain outstanding.

## Reproduction and provenance

Use the two profile commands in `scripts/research/distance-prototype/README.md`,
each with `WAYKIN_SWIFT_OPT=-Onone` and `WAYKIN_SWIFT_OPT=-O`. Retain the complete
original processor directory as the second argument. Then run:

```sh
node scripts/research/distance-prototype/verify_lifecycle_profiles.cjs \
  /path/to/cold-debug /path/to/warm-debug /path/to/cold-release /path/to/warm-release
```

[Machine-readable evidence](HISTORY_SCOPED_LIFECYCLE_20261013.json) records
source, input, original probe, baseline output, profile and artifact hashes,
the exact local replay directories, and complete per-run reports. Base HEAD is
`c353b7f9d6ac7f36e7b9ba1a13633155c0413ba7`; source hashes identify the tested patch.
Host: Apple Swift 6.3.2, arm64 macOS, Node 22.23.1. No Lens/device execution.

The user approved #27 research repair and issue-local coordination. #27 can
move to Review for this bounded patch; #23 and draft PR #26 remain incomplete.
Legacy-board synchronization remains NOT_COMPUTABLE, not silently updated.
