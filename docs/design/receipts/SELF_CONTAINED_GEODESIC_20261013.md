# Self-contained TypeScript distance prototype — 2026-10-13

**OBSERVED: the isolated ES2019 candidate matches the tested Swift/reference
outputs on the existing distance, processor and lifecycle corpora.** No
production switch, tolerance change, canonical fixture change or Lens gameplay
integration is part of this work.

## Implementation and provenance

`scripts/research/distance-prototype/portableGeodesic.ts` is a distance-only
transcription of the already-tested `PortableGeodesic.swift`, derived from
GeographicLib JS 2.2.0 with its MIT/X11 attribution retained. Its sole module
dependency is `portableMath.ts`. It does not load Node VM, external GeographicLib,
browser/Lens APIs, BigInt, or a platform distance provider.

Constants, operation order, signed-zero handling, bounded inverse iteration,
invalid-input behavior and explicit exhaustion-to-NaN follow the Swift
candidate. No spherical fallback or tolerance-based equivalence is introduced.
The unmodified library remains a test sanity reference, not an independent
implementation lineage or a proof over the entire numeric domain.

## Verification

| Check | Observed result |
| --- | --- |
| Complete distance corpus | 42,864 cases; 0 self-contained/reference differences |
| Swift distance comparison | 0 exact differences in both `-Onone` and `-O` |
| Unmodified-library sanity comparison | Maximum deviation 7.450580596923828e-9 m; existing 1e-6 m sanity gate retained |
| Actual temporary TS processor | 10,752 sequences / 172,032 steps; 0 exact differences against recorded Swift |
| Strict isolated compilation | ES2019 target + library, empty ambient type roots; PASS |
| Cold/warm × debug/optimized lifecycle | Each: 64 cases, 19,264 steps, 128 finishes; 0 exact mismatch steps |
| Historical regression within each lifecycle run | Entire original Swift output byte-identical; all 264 decision changes reproduced |
| Persisted cross-backend artifacts | All four input/Swift/parity/migration/historical artifact sets match the prior matched-library receipt |
| Invalid backend negative check | Rejected before compilation as intended |

The processor test uses exact-bit input and Swift baseline hashes pinned by
the independently rerun #27 receipt. It does not itself execute Swift. The
distance and lifecycle commands do execute Swift. Processor instrumentation
changes exactly one distance call in temporary copies of actual code.

All candidate lifecycle outputs are identical across profiles and optimization
modes. The two named profiles also produce identical Apple lifecycle outputs;
this does not establish arbitrary-history independence. Migration still changes
17,837 lifecycle steps and 66 narrative-output steps per run. The earlier
Apple-only dependency and three global distance-bound exceedances remain valid
research findings; this transcription does not resolve migration acceptance.

## Repository checks and unresolved acceptance

`make build`, `make test` (134 tests), `make validate`, production typecheck,
ES2019 Lens typecheck, isolation, source-sync check and `git diff --check` PASS.
Production `npm test` remains **84 pass / 1 fail / 0 skipped**, at movement
step 11 derived speed. No production changes are hidden behind research PASS.

**NOT_COMPUTABLE:** Lens numerical execution. The Lens Studio knowledge-base
tool returned a Snapchat-login requirement. Lens-side work stopped; no editor
execution, compile result or Node comparison is represented as Lens runtime
evidence. Sign in through **My Lenses → Login** to restore that tool access.
Device GPS/AR/audio, persistence, complete gameplay coverage and runtime
adoption remain separately unverified/unapproved. Full port is incomplete.

## Reproduction

```sh
node scripts/research/distance-prototype/test_portable_geodesic.cjs /path/to/pinned-js /path/to/original-replay
node scripts/research/distance-prototype/test_selfcontained_processor.cjs /path/to/original-replay
WAYKIN_TS_BACKEND=self-contained WAYKIN_HISTORY_PROFILE=cold node scripts/research/distance-prototype/lifecycle.cjs /path/to/pinned-js /path/to/original-replay
# Repeat lifecycle with warm-original-pairs; repeat both profiles with WAYKIN_SWIFT_OPT=-O.
node scripts/research/distance-prototype/verify_lifecycle_profiles.cjs /path/to/cold-debug /path/to/warm-debug /path/to/cold-release /path/to/warm-release
```

[Machine-readable evidence](SELF_CONTAINED_GEODESIC_20261013.json) includes all
reports, source/input/artifact hashes and local output directories. Base HEAD
`2071422baeee5cd8883592d42216cd670c901513`; source hashes identify the tested patch.
The candidate is self-contained; the research harness still requires Node,
Swift, TypeScript and historical reference files. Host: Apple Swift 6.3.2,
arm64 macOS, Node 22.23.1. This is corpus evidence, not a universal bit-exactness proof.
