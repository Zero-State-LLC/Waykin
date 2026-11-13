# Corrected distance experiment: exact-bit transport and primitive diagnosis

Status: OBSERVED research results; production remains unchanged and unapproved.
This supersedes the numeric counts in `DISTANCE_PROTOTYPE_20261013.md`.

## Harness defect and correction

The initial research harness decoded JSON numbers through Foundation
JSONSerialization/NSNumber. A diagnostic probe discovered that this path did
not preserve every binary64 input exactly. Of 14,075 distinct recorded math
calls, 1,589 initially reached Swift with different argument bits. Example:
`0.00001745329252002663` had Node bits `3ef24d1521199488` but decoded to
`3ef24d1521199489` in Swift. This invalidated the original same-input premise;
repeatability alone did not prove transport fidelity.

The corrected harness transports **all Swift input/output numbers as binary64
hex strings**, constructing Swift Double values from UInt64 bit patterns and
decoding outputs with Node Buffer. No numerical rounding or tolerance is added.
Canonical fixtures/exporters and production APIs are untouched.

The math probe independently echoes and verifies all argument bit patterns;
the corrected run has zero transport mismatches. It also verifies that adding
JS tracing changes none of the 2,699 valid-domain distance outputs.

## Corrected candidate results

Same corpus: 2,704 coordinate pairs, 10,752 processor sequences, 172,032 steps.
Same third-party versions and compiler configuration as the original receipt.

| Measurement | Exact-bit result |
|---|---:|
| Native/JS non-exact distance outputs | 787 |
| Maximum native/JS distance difference | 2.120827957696747e-9 m |
| Native/JS steps with numeric differences | 24,136 |
| Native/JS steps with decision differences | 0 in this corpus |
| CoreLocation/native steps with numeric differences | 88,472 |
| CoreLocation/native steps with decision differences | 264 |

Broad/adversarial distances still remain within ±0.05 m of CoreLocation on
this host; the same three global edge cases exceed it. Global compatibility
is not established. Exact numeric parity still FAILS, so a production switch
is not recommended. The native candidate remains Swift calling GeographicLib
C, not a pure-Swift implementation.

Both corrected runs deliberately exit 2 (`EXACT_PARITY_FAILED`). Their six
input/result artifacts are byte-identical: readable input, exact-bit Swift
input, Swift output, distances, native/JS mismatches and migration mismatches.

## Actual primitive differences

Using identical, verified binary64 arguments and reading result bits:

| Function | Unique inputs | Different results |
|---|---:|---:|
| sin | 2,473 | 11 |
| cos | 2,418 | 11 |
| atan2 | 5,249 | 782 |
| sqrt | 3,933 | 0 |
| pow | 1 | 0 |
| atanh | 1 | 0 |

Example: `sin(0.6503402317857296)` produces `0.6054572237157015` in Node
and `0.6054572237157017` in Swift's native math. An earlier apparent sqrt
discrepancy disappears after correcting argument transport.

OBSERVED source differences also prevent assuming identical evaluation:
native `norm2` uses `hypot`; GeographicLib JS's `Math.hypot` helper explicitly
uses `sqrt(x*x + y*y)`. JS `sincosd` has special 30/45-degree handling absent
from the inspected native C `sincosdx`. Matching the documented mathematical
algorithm is therefore weaker than matching its exact numerical execution.

These observations identify genuine divergence mechanisms, not a causal
attribution of each of the 787 distance differences. Full tracing or controlled
substitutions would be needed for that attribution. No mixed-runtime lookup
table or per-fixture patch is proposed as a production solution.

## Evidence and next step

- [Distance report and hashes](DISTANCE_PROTOTYPE_20261013_CORRECTED.json).
- [Primitive report, examples and hashes](DISTANCE_MATH_PRIMITIVES_20261013.json).
- Reproduction: `scripts/research/distance-prototype/README.md`.
- Corrected full artifacts: `/var/folders/5v/pc971cjj2g11dntwbdyhrg180000gn/T/waykin-distance-replay-AmPWxk/`
  and repeat `waykin-distance-replay-7Huh5Z` under the same parent.
- Primitive artifacts: `/var/folders/5v/pc971cjj2g11dntwbdyhrg180000gn/T/waykin-math-probe-u3NPGT/`.
- Diff guard confirms no changes under production Sources/packages, canonical
  vectors, workflows or synced Lens core. No new dependency manifests.
- `make build`, `make test` (134 tests) and `make validate` including native
  WaykinApp build: PASS after the correction. `git diff --check`: PASS.
  Logs: `/private/tmp/waykin-bittransport-{build,test,validate}.log`.
  These checks do not turn the separately failing TypeScript parity gate green.

INFERRED next technical step: assess one explicitly specified evaluation
sequence and portable elementary operations, rather than merely choosing two
libraries with the same algorithm name. A pure-Swift transcription using
uncontrolled native sin/cos/atan2 would still face demonstrated differences.
No rounding, tolerance relaxation or production switch is authorized by this
finding. Lens, full MovementEngine/experience migration and device evidence
remain NOT_COMPUTABLE. The port remains incomplete.
