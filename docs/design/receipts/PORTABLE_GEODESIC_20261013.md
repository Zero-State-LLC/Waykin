# Pure-Swift deterministic distance prototype — 2026-10-13

Evidence class: **OBSERVED**, limited to the local research corpus and host.
User approved deterministic math and a pure-Swift prototype, **not production
adoption**. Full reports, source hashes, toolchain and local evidence paths are
in [PORTABLE_GEODESIC_20261013.json](PORTABLE_GEODESIC_20261013.json).

## Result

| Gate | Cases per Swift build mode | Result |
| --- | ---: | --- |
| Matched primitives, including cube root | 114,579 | Zero bit mismatches |
| Pure-Swift inverse distance vs matched JS | 42,864 | Zero bit mismatches |
| Existing coordinate corpus | 2,704 | Zero distance mismatches |
| Actual movement-processor replay | 10,752 sequences / 172,032 steps | Zero numeric or decision mismatches |

All gates pass under `-Onone` and `-O` with Node 22.23.1 and Apple Swift 6.3.2,
arm64 macOS. Signed zeros compare by bits; NaN payloads are outside the contract.
Swift receives exact binary64 hex strings, never Foundation-decoded decimals.
The complete processor output, distance output and mismatch files are
byte-identical across the two optimization modes, including CoreLocation
migration results. No expected fixtures were changed to achieve this result.

The expanded distance corpus includes 20,000 seeded global pairs, 20,000
near-antipodal pairs, the prior broad/threshold corpus and explicit poles,
dateline aliases, angle boundaries, signed zeros, subnormal and invalid inputs.
All valid inputs returned finite nonnegative results; invalid inputs were
rejected. The largest sampled deviation from **unmodified** GeographicLib JS
was 7.450580596923828e-9 m. This independent algorithm baseline checks for a
shared implementation error; it is not a universal error proof. The separate
1e-6 m accuracy sanity gate does not relax exact cross-language parity.

The integrated distance run recorded 415 cube-root calls. Its maximum sin/cos
argument magnitude was 3.1415926536060934, within the documented ±2π domain.
The harness throws if that domain is exceeded. Primitive cube-root tests
include extreme finite magnitudes; maximum relative deviation from the JS
host baseline was 2.219670822985405e-16. Large absolute errors at enormous
magnitudes must be interpreted using this relative bound, not as trig errors.

## What changed

- Research-only `PortableGeodesic.swift`: WGS84 inverse-distance adaptation of
  pinned GeographicLib JS 2.2.0, including short lines, meridians, equator,
  antipodal astroid initialization, Newton steps and bracket fallback. No C,
  CoreLocation or embedded JS runtime is used by this solver.
- Matched Swift/ES2019 cube root joins the existing sin/cos/atan2/sqrt layer.
- `portable_backend.cjs` runs the pinned JS implementation with matched math
  in an isolated VM. This is a research comparison adapter, not a production
  TypeScript dependency or completed Lens packaging.
- `run.cjs` can select the pure-Swift backend and either Swift optimization
  mode. It still instruments temporary copies of the real processors at one
  checked distance seam each; the original C experiment remains available.
- Upstream MIT attribution is retained with the derived Swift source.

The solver intentionally implements only WGS84 inverse **distance**. Direct
geodesics, prolate ellipsoids, areas and output azimuths are not product needs
and are not exposed. Angle normalization and special cases follow the JS
source instead of the differing native C helpers. Iteration exhaustion returns
NaN explicitly; there is no silently accepted spherical or approximate fallback.

## CoreLocation migration remains material

**Call-history qualification:** subsequent lifecycle work reproduced different
CoreLocation boundary distances for identical input bits under different prior
calls. The counts below are valid for this receipt's complete original call
order, not a context-independent application migration result. See
[CORELOCATION_HISTORY_20261013.md](CORELOCATION_HISTORY_20261013.md) and bug #27.

Against the unchanged Swift/CoreLocation processor, the same stress corpus
produced 88,472 numeric-mismatch steps and **264 decision-mismatch steps**:

| Changed field | Steps |
| --- | ---: |
| Derived speed | 88,472 |
| Distance delta | 15,552 |
| Accumulated-distance decision | 252 |
| Is-moving decision | 12 |

Field counts overlap numeric-step counts. The two decision-field counts sum
to 264 for this corpus. These adversarial counts are not field incidence rates.
No broad or threshold pair exceeded the approved 0.05 m distance bound;
maximum differences were 0.039564363093859356 m and 0.006458268477203433 m.
Three global edge cases did exceed it: antipodal, near-antipodal and pole-to-pole.
Maximum CoreLocation/candidate edge difference was 100326.8979849033 m.
These large reference-model differences are preserved, not hidden by the
excellent cross-language agreement of the candidate.

## Validation

Reproduction commands are in `scripts/research/distance-prototype/README.md`.
Local full evidence directories are recorded in the JSON receipt; large replay
outputs remain local and can be regenerated from the pinned sources/corpora.

- `test_portable_math.cjs`: PASS, both Swift optimization modes.
- `test_portable_geodesic.cjs`: PASS, both modes.
- `WAYKIN_DISTANCE_BACKEND=pure-swift .../run.cjs`: PASS.
- Same replay with `WAYKIN_SWIFT_OPT=-O`: PASS; output comparison PASS.
- `make build`: PASS.
- `make test`: PASS, 134 XCTest tests, zero failures.
- `make validate`: PASS (package + generation).
- Production `packages/waykin-core-ts` `npm test`: **84 pass / 1 fail**, zero
  skips. The unchanged frozen-distance movement-speed mismatch remains.
- `git diff --check`: PASS.

No simulator-visible code changed. No physical or Lens-runtime evidence was
collected; GPS/audio/tracking/battery/publishing behavior is NOT_COMPUTABLE.

## Recommendation and remaining gates

Proceed with isolated MovementEngine and downstream experience/event/Bond/memory
replay under the already-approved prototype scope. Do **not** switch production
yet. Processor anchor reset is not evidence of full pause/resume lifecycle
parity, and sampled Swift/Node agreement is not Lens runtime agreement.

The eventual runtime switch still needs migration review, a named Swift freeze
exception/accepted ADR, a self-contained TS/Lens implementation, platform
verification, Swift-exported canonical fixtures and the normal acceptance
checks. This receipt is a passed research milestone, not completion of #23,
T044, the Lens build or the overall port.
