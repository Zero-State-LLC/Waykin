# Isolated native/TypeScript distance experiment

Research only, approved 2026-10-13. No production adoption is authorized.
This first candidate is a Swift-facing adapter to GeographicLib C 2.2 and
an ES2019 TypeScript adapter to GeographicLib JavaScript 2.2.0. It is **not a
pure-Swift transcription**, a new package dependency, or a Lens runtime test.
Both implement Karney's documented geodesic algorithm; exact arithmetic
agreement is a hypothesis to measure, not an assumption.

The subsequently approved pure-Swift/deterministic-math extension starts with
`PortableMath.swift` and `portableMath.ts`. Its bounded numerical contract and
separate test command are in [PORTABLE_MATH_CONTRACT.md](PORTABLE_MATH_CONTRACT.md).
The extension now includes `PortableGeodesic.swift`, a pure-Swift, WGS84-only
inverse-distance transcription. `WAYKIN_DISTANCE_BACKEND=pure-swift` selects
it in `run.cjs`; the default retains the first native C candidate for comparison.
The matching JS backend runs the pinned library with explicitly replaced math
primitives in an isolated VM. It is not a self-contained production TS solver.

Official source/provenance:

- https://github.com/geographiclib/geographiclib-c/tree/v2.2
- https://geographiclib.sourceforge.io/html/C/index.html
- https://geographiclib.sourceforge.io/html/js/
- https://geographiclib.sourceforge.io/scripts/geographiclib-geodesic.min.js

C/JS are MIT/X11 licensed by Charles Karney. Keep upstream notices with the
external downloads. The Swift adaptation is derived third-party source;
its required notice is retained in `GEOGRAPHICLIB_LICENSE.txt`.
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

To reproduce the approved deterministic extension, retain the native replay
directory and the math-probe output directory printed by the commands above:

```sh
node scripts/research/distance-prototype/test_portable_math.cjs /path/to/math-probe-output
node scripts/research/distance-prototype/test_portable_geodesic.cjs "$research_dir/geographiclib-geodesic.min.js" /path/to/replay-output
WAYKIN_DISTANCE_BACKEND=pure-swift node scripts/research/distance-prototype/run.cjs "$research_dir" "$research_dir/geographiclib-geodesic.min.js" "$research_dir/broad.json" "$research_dir/threshold.json"
WAYKIN_DISTANCE_BACKEND=pure-swift WAYKIN_SWIFT_OPT=-O node scripts/research/distance-prototype/run.cjs "$research_dir" "$research_dir/geographiclib-geodesic.min.js" "$research_dir/broad.json" "$research_dir/threshold.json"
```

The distance gate adds 20,000 global and 20,000 near-antipodal seeded pairs,
plus angle/signed-zero cases. It compares binary64 outputs under both Swift
optimization modes, independently checks sampled deviation from unmodified
GeographicLib JS, and rejects out-of-domain portable trig arguments. These
accuracy sanity checks do not relax Waykin's exact output contract. The Swift
solver returns NaN on iteration exhaustion, never a spherical fallback.

## Lifecycle and downstream migration

Current status: exact candidate parity passes, but the migration retention
assertion **fails (exit 1)** because the original CoreLocation decision changes
depend on earlier calls. See bug #27 and `LIFECYCLE_PROTOTYPE_20261013.md`.
The harness saves its reports before raising this failure; do not delete or
relax the assertion to claim migration acceptance.

For the read-only isolation of Apple-only versus candidate-interleaved history:

```sh
node scripts/research/distance-prototype/history_isolation.cjs /path/to/processor/swift-input.json threshold-223
```

This runs 30 fresh processes across three modes, five histories and two Swift
optimization settings. It asserts exact input bits, identical debug/optimized
results, unchanged candidate results, matching Apple-only/mixed results and
the reproduced Apple-only prefix dependency. This diagnostic does not itself
grant migration acceptance.

```sh
WAYKIN_HISTORY_PROFILE=cold node scripts/research/distance-prototype/lifecycle.cjs "$research_dir/geographiclib-geodesic.min.js" /path/to/pure-swift-replay-output
WAYKIN_HISTORY_PROFILE=warm-original-pairs node scripts/research/distance-prototype/lifecycle.cjs "$research_dir/geographiclib-geodesic.min.js" /path/to/pure-swift-replay-output
# Repeat both commands with WAYKIN_SWIFT_OPT=-O for optimized Swift.
```

This separate harness selects every coordinate pair that changed a processor
decision, plus four control pairs, and replays each at four intervals. The
original processor sequences are retained as prefixes. Under the user-approved
#27 repair, the harness first re-executes the COMPLETE original processor input
with its original probe, checks byte-identical output and all 264 historical
decision-changing steps, and verifies original source/dependency hashes.
Keep the original replay directory intact (including probe, exact input, output,
report and migration mismatch files); regenerate it with the processor runner
if unavailable. Baseline drift fails closed and requires investigation.

Each lifecycle case then runs in a fresh process. `cold` makes no prior Apple
distance calls; `warm-original-pairs` first runs every valid original pair in
original order. The profile and exact prefix hash are recorded, and warm-up
outputs are retained. This warm profile does not recreate all original processor
calls. Lifecycle decision counts are observed per profile, not asserted to equal
264. This replaces the disproved universal-history assertion, not the original
regression or exact candidate parity. Anchor reset becomes pause/resume calls, not access to private
processor state. Longer walks then exercise rejection, gaps, lifecycle errors,
session completion and restart. Only accepted snapshots feed the real companion
experience, following the App's downstream contract.

The harness compiles the actual core sources with a temporary single-distance
substitution, reuses the actual Swift exporter experience projections, and
compiles temporary TS copies. It compares state, events, commands, semantic
audio, diagnostics, session totals, and finish Bond/memory results exactly.
Random session/event UUIDs are excluded; full route values are compared at end.
It does not test persistence, path/AR presentation integration, physical audio,
or Lens runtime execution. JSON output and mismatch paths stay in the printed
temporary directory; `report.json` contains the source and input hashes.

Verify all four persisted runs with:

```sh
node scripts/research/distance-prototype/verify_lifecycle_profiles.cjs /path/to/cold-debug /path/to/warm-debug /path/to/cold-release /path/to/warm-release
```

This checks exact candidate outputs across profiles and optimization modes,
byte-identical artifacts within each profile across modes, and reports observed
Apple lifecycle differences between profiles. See
`docs/design/receipts/HISTORY_SCOPED_LIFECYCLE_20261013.md` for the scoped result.

## Instrumentation and boundaries

### Disposable fixture integration

```sh
node scripts/research/distance-prototype/test_fixture_integration.cjs
```

Copies actual package sources/tests/configuration into a fresh temporary project,
instruments only the approved research distance seams, and uses the real Swift
exporter with a real temporary Swift Git tree. It never writes canonical fixtures.
Checks all six families, repeated/debug/release export hashes, strict package
typechecks, Swift tests, and the full unchanged TS suite. A separate exact
movement check removes even the existing distance tolerance for this experiment.

Known result: family replay passes, but two spherical-metre unit assertions
fail under the candidate. The runner collects all three export/test results and
still exits 2; it must not be presented as a passing complete integration. See
`docs/design/receipts/ISOLATED_FIXTURE_INTEGRATION_20261013.md`. Existing fixtures
remain insufficient to represent the separately measured historical changes.

### Self-contained TypeScript research candidate

`portableGeodesic.ts` transcribes `PortableGeodesic.swift` with the same WGS84
constants, arithmetic order, signed-zero handling, and 84-iteration bound
(first 20 iterations permit Newton updates). Invalid/nonfinite coordinates,
out-of-range latitudes/longitudes, or iteration exhaustion return NaN. There
is no spherical fallback, rounding, epsilon adjustment, or BigInt. Its only
module dependency is `portableMath.ts`; Node/VM and the external GeographicLib
library are test/reference dependencies, not candidate dependencies.

`test_portable_geodesic.cjs` now also compares this module bit-for-bit with
the pinned matched-JS reference across the complete distance corpus. It retains
the Swift debug/optimized comparison and the unmodified-library accuracy check.
`test_selfcontained_processor.cjs` compiles the actual TypeScript processor in a
temporary directory with exactly one distance-call substitution and strict
ES2019/ES2019-library/empty ambient type roots. It compares all original 172,032
steps with exact-bit Swift evidence whose hash is verified against the #27
full-replay receipt. It does not rerun Swift itself or write canonical vectors.

```sh
node scripts/research/distance-prototype/test_selfcontained_processor.cjs /path/to/pure-swift-replay-output
WAYKIN_TS_BACKEND=self-contained WAYKIN_HISTORY_PROFILE=cold node scripts/research/distance-prototype/lifecycle.cjs "$research_dir/geographiclib-geodesic.min.js" /path/to/pure-swift-replay-output
# Repeat with warm-original-pairs and both Swift optimization modes, then run
# verify_lifecycle_profiles.cjs over the four resulting output directories.
```

The lifecycle harness defaults to the original `matched-library` backend.
Explicit `self-contained` selects the new module; unknown backend names fail.
The pinned library argument is still checked as provenance for the historical
baseline, but is not loaded as the candidate backend in self-contained mode.
Node/Swift parity and ES2019 compilation do not establish Lens runtime parity.

The runner copies the actual Swift and TS movement processors into its temp
directory. It replaces exactly one distance seam in each and fails if the seam
is missing/ambiguous. The Swift copy uses CoreLocation and the selected C or
pure-Swift candidate; TS uses the corresponding JS backend. Swift's real RoutePoint value type is extracted from
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

`run.cjs` is a MovementIntegrityProcessor migration comparison. It does not execute
MovementEngine pause/resume, experience/event/Bond/memory logic, full coordinate
domain proofs, or Lens/device behavior. Adversarial mismatch counts are not
real-world incidence estimates. If this first candidate fails numeric parity,
do not wire it into production or claim later acceptance gates passed.
