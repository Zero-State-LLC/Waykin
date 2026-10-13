# Distance prototype: native/JS candidate does not pass exact parity

Authority: user approved the isolated prototype and migration comparison on
2026-10-13. No production switch is authorized. Base is
`e280d6b5f913ab423d5c2fd4c6b6435098025889`.

## Candidate and scope

OBSERVED: a Swift-facing adapter calls GeographicLib C 2.2; a strict ES2019
TypeScript adapter calls GeographicLib JavaScript 2.2.0. Third-party code stays
outside the repository, pinned by SHA-256. This is a native/JS candidate
experiment, **not a pure-Swift transcription**. The matching documented
algorithm does not guarantee matching floating-point evaluation.

The runner mechanically copies the actual movement processors to temporary
files and changes only their distance-call seams. Source hashes are recorded.
Swift runs the unchanged surrounding processor twice: CoreLocation reference
and native candidate. TypeScript replays the same samples with its JS candidate.
No source in `Sources`, `packages`, `Tests/Vectors`, CI workflows or synced Lens
core changed; verified by `git diff --exit-code HEAD --` on those paths.

## Results

OBSERVED on Swift 6.3.2 / arm64 macOS and Node 22.23.1:

| Measurement | Result |
|---|---:|
| Coordinate pairs (broad + adversarial + edge) | 2,704 |
| Processor sequences | 10,752 |
| Replayed steps | 172,032 |
| Native/JS non-exact distance outputs | 869 |
| Maximum native/JS distance difference | 2.120827957696747e-9 m |
| Native/JS steps with numeric differences | 26,730 |
| Native/JS steps with decision differences | 0 in this corpus |
| CoreLocation/native steps with numeric differences | 88,467 |
| CoreLocation/native steps with decision differences | 264 |

The 264 changed decision steps comprise 252 changes to `accumulatedDistance`
and 12 changes to `isMoving`; no other projected decision field differs in
this corpus. Counts describe deliberately selected tests, not outdoor rates.

Example: `threshold-223-dt0.5`, step 1. CoreLocation accepts and accumulates
1.50000018271028 m at 3.00000036542056 m/s. The candidate accepts the sample
but accumulates zero because its distance is below 1.5 m; its speed is
2.999999295540483 m/s. Both classify moving. This is an actual processor
outcome, not just an isolated threshold comparison.

Native/JS example: `broad-9-dt0.5`, step 1 has native speed
1.1049455432148643 and JS speed 1.1049455432148645. No epsilon, rounding or
assertion relaxation is applied. The root cause of the native/JS numerical
divergence has not yet been isolated to specific arithmetic/transcendental
operations; do not attribute it solely to libm without further evidence.

All 2,688 broad/adversarial pair distances remain within ±0.05 m of freshly
measured CoreLocation on this host (maxima 0.039564363182307716 m and
0.006458268477203655 m respectively). Three global edge cases exceed that
bound: antipodal, near-antipodal and pole-to-pole. The largest reference
difference is 100,326.8979849033 m at the near-antipodal case. These are reported,
not hidden; they do not establish a global CoreLocation-compatibility bound.

Coincident points, signed zero, dateline aliases, both poles, invalid and
nonfinite input rejection, finite antipodal results, and the equatorial-degree
sanity check pass. Subnormal and dateline-crossing outputs are recorded. This
is sampled domain coverage, not proof of every input or convergence limit.

## Reproduction and repeatability

See [runner instructions](../../../scripts/research/distance-prototype/README.md)
and [machine-readable report](DISTANCE_PROTOTYPE_20261013.json). Report includes
source, harness, corpus and dependency hashes, compiler flags and toolchains.

Two runs produced byte-identical input and result files. SHA-256:

```text
input.json                8401fec0cfe322bc4d94ad7ec5a08d545f1979b7bcef71a4d1f69cc180530941
swift.json                b9708a9a2eefa506a415fb8810c910a9d4ef03bda71d9b0d08abe55ccbff9fd7
distance-results.json     c3e80a3c9c6e85c8419cb3d04bc1bf8864976d335b90b4eaef86e39989629abc
native-js-mismatches.json 5e7325056e79974a2e8d545c50d322d78485cb18e51ccabd36ad4cbb181ba198
migration-mismatches.json 7db4c60015d2bf6b437cd1b371185c0dd6954e99e09befdfd5c0e4125e377c54
```

Full local artifacts (not canonical fixtures):
`/var/folders/5v/pc971cjj2g11dntwbdyhrg180000gn/T/waykin-distance-replay-3uff9a/`.
The earlier run is `waykin-distance-replay-QI5IBg` under the same parent.
Temporary files may expire; the checked-in harness reproduces them.

## Validation and interpretation

- Prototype build, Swift execution, strict ES2019 compile and sanity assertions:
  PASS. Both runs intentionally exit 2 with `EXACT_PARITY_FAILED`.
- `make build`, `make test` (134 tests), `make validate` including native app
  build: PASS. Logs `/private/tmp/waykin-prototype-{build,test,validate}.log`.
- Existing `npm test`: unchanged FAIL, 84 pass / 1 fail. Its known movement
  speed mismatch is not resolved by research code.
- Production/fixture diff guard: PASS. `git diff --check`: required at handoff.

INFERRED recommendation: do not adopt this pair of library implementations.
The common-algorithm hypothesis did not satisfy exact numeric parity. The
next technical investigation is to localize the numeric divergence and assess
whether one explicitly specified evaluation sequence can be implemented in
Swift and ES2019 without rounding or tolerance changes. This result rejects
the tested candidate pair, not every possible shared-distance implementation.

NOT_COMPUTABLE: pure-Swift numeric compatibility; Lens runtime execution;
MovementEngine lifecycle and full experience/event/Bond/memory migration;
physical-device behavior. Processor `resetAnchor` tests do not prove pause/
resume integration. Downstream gates remain unrun because the first exact
numeric gate failed. Production adoption and the full port remain incomplete.
