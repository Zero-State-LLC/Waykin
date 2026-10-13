# Isolated native/TypeScript distance experiment

Research only, approved 2026-10-13. No production adoption is authorized.
This first candidate is a Swift-facing adapter to GeographicLib C 2.2 and
an ES2019 TypeScript adapter to GeographicLib JavaScript 2.2.0. It is **not a
pure-Swift transcription**, a new package dependency, or a Lens runtime test.
Both implement Karney's documented geodesic algorithm; exact arithmetic
agreement is a hypothesis to measure, not an assumption.

Official source/provenance:

- https://github.com/geographiclib/geographiclib-c/tree/v2.2
- https://geographiclib.sourceforge.io/html/C/index.html
- https://geographiclib.sourceforge.io/html/js/
- https://geographiclib.sourceforge.io/scripts/geographiclib-geodesic.min.js

C/JS are MIT/X11 licensed by Charles Karney. Keep upstream notices with the
external downloads. No third-party source is redistributed in this directory.
The runner pins the C/header/JS file SHA-256 values; changed downloads fail
closed and require review. The mutable JS URL alone is not the identity pin.

## Reproduction on macOS

Requires Xcode command-line tools, Node, and the repository's installed
TypeScript compiler (`npm ci` in `packages/waykin-core-ts`). From repo root:

```sh
research_dir=$(mktemp -d /private/tmp/waykin-distance-prototype.XXXXXX)
curl --fail --location https://raw.githubusercontent.com/geographiclib/geographiclib-c/v2.2/src/geodesic.c -o "$research_dir/geodesic.c"
curl --fail --location https://raw.githubusercontent.com/geographiclib/geographiclib-c/v2.2/src/geodesic.h -o "$research_dir/geodesic.h"
curl --fail --location https://raw.githubusercontent.com/geographiclib/geographiclib-c/v2.2/LICENSE.txt -o "$research_dir/LICENSE.txt"
curl --fail --location https://geographiclib.sourceforge.io/scripts/geographiclib-geodesic.min.js -o "$research_dir/geographiclib-geodesic.min.js"
swift scripts/research/geodesic_reference_probe.swift > "$research_dir/broad.json"
swift scripts/research/geodesic_threshold_probe.swift "$research_dir/broad.json" > "$research_dir/threshold.json"
node scripts/research/distance-prototype/run.cjs "$research_dir" "$research_dir/geographiclib-geodesic.min.js" "$research_dir/broad.json" "$research_dir/threshold.json"
```

Exit 2 means the experiment completed but exact native/JS numeric parity
failed. Exit 0 means equality only for this corpus, NOT production acceptance.
Other errors abort on setup, seam drift, invalid output or sanity-test failures.

The runner prints a fresh temporary output directory. Keep `report.json`,
`input.json`, `distance-results.json`, `native-js-mismatches.json`,
`migration-mismatches.json`, and `swift.json` for full evidence. Report hashes
identify the source files, harness, dependencies and input corpora. Source
HEAD is recorded but uncommitted harness contents are identified by hash.
Swift recalculates CoreLocation distances on the current host rather than
trusting historical `appleMeters` fields. Corpus selection and numerical
results can depend on the host's CoreLocation version; preserve input hashes.

All numbers passed to Swift use `bits:<16 hex digits>` in `swift-input.json`.
Swift also emits numeric outputs as raw binary64 bit strings. This avoids the
observed rounding in Foundation JSONSerialization/NSNumber decimal decoding;
`input.json` remains the readable Node corpus, not the Swift transport. Earlier
results without this transport were confounded and are superseded.

To measure individual math primitives using those same inputs:

```sh
node scripts/research/distance-prototype/math_probe.cjs "$research_dir/geographiclib-geodesic.min.js" /path/to/replay-output
```

This traces GeographicLib JS without changing its results, deduplicates math
calls, and sends their argument bits to `MathProbe.swift`. Every returned input
bit pattern is checked before comparing result bits. It reports native/JS
differences, not proof that a particular primitive caused each geodesic error.

## Instrumentation and boundaries

The runner copies the actual Swift and TS movement processors into its temp
directory. It replaces exactly one distance seam in each and fails if the seam
is missing/ambiguous. The Swift copy uses either CoreLocation or the C candidate;
TS uses the JS candidate. Swift's real RoutePoint value type is extracted from
the existing source. No production source, manifest, lockfile, Lens core copy,
or canonical `Tests/Vectors` file is changed. Generated research JSON is NOT
an accepted replacement for Swift-exported parity fixtures.

All 1,344 broad and 1,344 adversarial coordinate pairs are retained, plus 16
numeric-domain edge cases (including antipodes, poles, invalid inputs and
subnormal coordinates). Each non-edge pair is replayed at 0.5, 1, 2 and 14
second intervals through a 16-step sequence: smoothing history, mixed reported
and fallback speeds, inaccurate and stale rejection, duplicate timestamp,
anchor reset, stationary samples and a 16-second gap. Long jumps are included
and must be handled by existing rejection rules. No epsilon or rounding is
applied to output comparisons. NaN is serialized explicitly for invalid inputs.

This is a MovementIntegrityProcessor migration comparison. It does not execute
MovementEngine pause/resume, experience/event/Bond/memory logic, full coordinate
domain proofs, or Lens/device behavior. Adversarial mismatch counts are not
real-world incidence estimates. If this first candidate fails numeric parity,
do not wire it into production or claim later acceptance gates passed.
