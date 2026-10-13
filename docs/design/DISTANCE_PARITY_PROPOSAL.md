# Distance parity proposal

Status: PROPOSED / SUPPORTING. Design and an isolated prototype/migration
comparison approved by the user on 2026-10-13. Production implementation is
NOT approved. This document changes no accepted decision,
Swift freeze, runtime behavior, fixture, or test tolerance.

## Problem and evidence

Swift remains the reference under ADR-0004. D-038/D-100 currently select
Haversine with radius 6,371,008.8 m for the port and allow ±0.05 m distance
error. The parity contract still requires exact derived speeds and decisions.
These requirements are not satisfied by the current implementation.

OBSERVED: movement replay step 11 produces 2.223901604670658 m/s in TypeScript
and 2.2263898158654714 m/s in Swift. The spherical/reference discrepancy also
exceeds the distance bound for a 10 m northbound equatorial probe.

OBSERVED: the isolated GeographicLib comparison meets the distance bound in
the sampled cases, but the targeted 1,344-case experiment has 144 disagreements
at the 0.55 m comparison and 168 at 1.5 m. These are adversarial arithmetic
comparisons, not full state replays or estimates of real-world frequency.
See [the experiment receipt](receipts/CORE_PORT_20261013_DISTANCE_EXPERIMENT.md).

INFERRED: propagating ±0.05 m into speed tolerance alone cannot establish
exact decisions. Adopting an ellipsoidal TypeScript calculation alone is also
insufficient. Neither is recommended as a route to declaring parity complete.

## Recommended direction for approval

Define one versioned, platform-independent distance calculation in Swift and
TypeScript. Swift remains the authoritative producer of expected vectors.
CoreLocation remains a location-sample adapter, but would no longer provide
the gameplay distance at the specifically approved movement calculation seam.

Prefer a WGS84 ellipsoidal candidate over changing Swift to the current sphere:
the sphere already violates the existing reference-comparison distance bound.
The research does not yet establish an implementation suitable for production.
A robust inverse-geodesic algorithm, including antipodal handling, must be
selected and evaluated before any runtime switch. A nonconverging Vincenty
implementation or an unannounced spherical fallback is not an acceptable
substitute. Third-party reuse requires recorded provenance/license review;
the downloaded research library is not a production dependency.

The numeric contract must specify identical constants, units, input handling,
longitude normalization, operation order, convergence/iteration bounds and
error handling in both languages. Same mathematical formula does NOT prove
bit-exact results across Swift libm, Node and Lens JavaScript. Prove the required
numeric outputs by replay; if elementary-function differences remain, stop
for an explicit design decision. Do not silently round, quantize, add epsilon,
relax assertions, or substitute fixture values.

## Behavioral and authority impact

This is a proposed reference behavior change, not a compatibility-only port
fix. Distances, derived speeds, moving classification, accepted displacement,
session totals and downstream world/events/Bond/memories may change near
boundaries compared with the old CoreLocation reference. Identical numeric
thresholds do not mean identical historical outcomes.

Before implementation, an accepted ADR must explicitly supersede the formula
portion of D-038/D-100 and grant a narrowly named Swift movement-distance
exception. Keep the ±0.05 m historical-reference comparison as a migration
measurement gate, with its input domain specified; it is not permission to
relax new Swift/TypeScript state parity. Retain exact non-distance assertions.
If any migration case exceeds that bound, report it and seek a separate
decision rather than changing the gate.

No change is proposed to thresholds, smoothing-window size, elapsed-time
rules, pause/resume/stop behavior, rejection policy, reported-speed preference,
storage schemas, location permissions, presentation, or persistence ownership.
Old persisted summaries are not recalculated. Review all distance call sites
before choosing the allowed paths; do not replace unrelated App/MapKit uses.

## Staged implementation plan — production remains unapproved

The user subsequently approved isolated prototype work only. The first
candidate lives in `scripts/research/distance-prototype/`; its Swift-facing
adapter calls native GeographicLib C, and its TypeScript adapter calls the
corresponding JS implementation. It is not a pure-Swift transcription or
authorization to adopt either dependency. Production gates below still apply.

The user also approved the deterministic-math and pure-Swift prototype
extension after native/JS differences were established. The primitive layer's
first gate is recorded in `receipts/PORTABLE_MATH_20261013.md`; successful
primitive tests do not establish a working geodesic port or approve production.

The integrated pure-Swift candidate now passes 42,864 exact distance cases and
172,032 processor steps against the matched JS backend in debug and optimized
builds. See `receipts/PORTABLE_GEODESIC_20261013.md`. CoreLocation migration
still changes 264 processor decision steps in the adversarial corpus;
MovementEngine/downstream, Lens execution and production approval remain open.

1. Open/approve a bounded reference-distance issue and ADR. Record the exact
   Swift/TypeScript paths and call-site inventory, original reference SHA,
   migration domain and algorithm/version; amend the freeze explicitly.
2. Implement an isolated two-language prototype without wiring production.
   Validate coincident points, zero/subnormal deltas, all longitude wrap cases,
   poles, antipodes, invalid/nonfinite inputs, and convergence limits. Confirm
   ES2019 compatibility, no BigInt, Lens imports or new platform dependencies.
3. Run old CoreLocation and the candidate against identical input sequences.
   Record numerical differences and every changed accept/reject/state/event
   decision; do not discard cases that changed behavior. Include the existing
   broad and adversarial probes, plus varying sample intervals and smoothing.
4. Review that migration report and approve the runtime switch separately.
   Implement Swift first; regenerate fixtures only through the Swift exporter;
   then port the same numeric contract to TypeScript and sync Lens core with
   `scripts/sync_core_ts.sh`. Never hand-edit expected fixtures.
5. Retain old/new comparison evidence in the receipt, run all acceptance gates,
   and require the project's ordinary review before merge. No auto-merge.

## Required acceptance evidence

- Unit tests for the complete numeric-domain contract in both languages.
- Sequential processor and MovementEngine replay on both sides of 0.55 m/s,
  1.5 m, configured maximum displacement/speed, accuracy and gap boundaries.
  Include intervals below/at/above one second, reported speed vs fallback,
  smoothing history, rejected samples, and pause/resume/fresh-anchor cases.
- Full experience replay to expose downstream event, Bond and memory changes;
  exact state assertions remain active. All six existing vector families pass,
  no missing-family skips, and two exporter runs are byte-identical.
- `make build`, `make test`, `make validate`, TypeScript typechecks (including
  ES2019), isolation, all parity tests, Lens sync check, and `git diff --check`.
  Confirm these results in CI on the actual proposed commit.
- Actual Lens-runtime execution for the numerical corpus; Node agreement does
  not establish Lens numerical compatibility. Device GPS/AR/audio/thermal
  validation remains NOT_COMPUTABLE until named-device receipts exist.

## Alternatives and rollback

Keep CoreLocation frozen: preserves iOS behavior but leaves the demonstrated
port contract conflict unresolved. Tolerate derived speed alone: rejected as
insufficient for exact decisions. Replace only TypeScript with GeographicLib:
rejected as a demonstrated non-drop-in solution. Use sphere in both cores:
not recommended under the current historical distance bound.

Rollback a future implementation as one reviewed change: restore the original
Swift calculation and TS model, regenerate vectors from restored Swift and
resync Lens core. Keep tests honest: rollback restores the known parity blocker,
not a green release. No persistence migration or historical rewrite is planned.

## Decision requested

Approve or revise this design before implementation. In particular, agree that
historical movement decisions may change, subject to an explicit migration
report and a separately approved runtime switch. Design approval alone must
not be interpreted as permission to ship a model or weaken parity.
