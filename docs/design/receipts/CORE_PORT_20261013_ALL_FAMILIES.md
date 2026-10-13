# All-family parity infrastructure and distance research

2026-10-13 — #23 — codex/23-specs27-core-port, uncommitted.

## Implemented infrastructure

Added Swift movement, pursuit/walk-experience, Bond/memory and demo exporters,
their per-family JSON schemas, and read-only TypeScript replay tests. These
join the companion exporter and existing seed/event family. Inventory checks
require all six families and reject unregistered directories. CI now requires
vectors unconditionally rather than allowing seed fixtures to disappear.

Movement: 31 ordered integrity inputs covering validation order, stale/future
boundaries, anchors, duplicates, resets, smoothing and fallback speed. Distance
uses approved D-100 0.05 m bound; speed remains exact pending a decision.
Pursuit: five initial pursuit states, 96 sequential ticks each, with full
semantic outputs and retained state. Bond/memory: 42 finish cases plus canonical
identity. Demo: 18 control frames, every tick, paused runToEnd, resume, summary
and repeated end. Demo projections omit real UUIDs and event wall-clock fields,
not gameplay measurements or decisions.

The exporter refuses default HEAD-tree provenance when Swift core is dirty.
The approved #25 reference change must be recorded before normal regeneration.

OBSERVED: all exporter sources parse with Swift frontend; this is not a
successful typecheck or execution. TypeScript fallback build passes. Node suite
has 85 tests: 79 pass, 6 fail, zero skipped. Failures are the five missing new
Swift fixture families and the complete-family inventory. No fixtures forged.

Remaining coverage/audit: actual Swift typecheck and generation; exact replay;
broader movement engine lifecycle/path/audio fixture coverage; complete
consumed-export T044 audit; canonical/locked CI verification. Schema negative
tests now cover unused invalid branches, unresolved references and inherited
property names; both validator regression tests pass.

OBSERVED: `publicSurface.test.ts` imports only the public `src/index.ts` barrel
and exercises injected clock/IDs, start, paused no-op, resume, seven ticks,
summary consumption and session cleanup. It passes; this is a consumer smoke
test, not complete T044 or Swift parity evidence. Fallback TS build, ES2019
Lens typecheck, isolation and `git diff --check` pass. Full Node output:
`/private/tmp/waykin-public-surface-tests.log`.

A second public-entry-point integration test covers every remaining L §3.1
export: LocationSample ingestion/anchor, movement pause/resume/simulation,
experience start/update/finish, companion commands/event mapping, AR behavior,
audio map/transition/moment, path acceptance/rejection/coupling and summary
copy. Both consumer tests pass. Exact current signatures are documented in
`lens-studio-build.md`; no production API was renamed for the Lens.

## Distance research requested by user (not an approved spec change)

Apple documents CLLocation.distance(from:) as an Earth-curvature arc distance
that ignores altitude. It does not promise equality with the mean-radius
Haversine formula. Source:
https://developer.apple.com/documentation/corelocation/cllocation/distance(from:)

A standalone Swift probe importing Foundation and CoreLocation succeeds even
though full WaykinCore macro compilation is blocked. The probe places the
second point at latitude delta = sphereMeters / 6371008.8 * 180 / pi, longitude
zero, starting at (0,0), then calls CLLocation.distance(from:).

| Haversine northbound distance | CLLocation distance | Absolute difference |
| --- | --- | --- |
| 2 m | 1.988833959 m | 0.011166041 m |
| 10 m | 9.944169795 m | 0.055830205 m |
| 60 m | 59.665018770 m | 0.334981230 m |

OBSERVED arithmetic boundary examples from the same probe:
- 0.551 m Haversine is 0.547923756 m CLLocation. For a one-second sample,
  comparisons against movingSpeedThreshold=0.55 differ.
- 1.502 m Haversine is 1.493614303 m CLLocation. Comparisons against
  minimumDisplacementMeters=1.5 differ.

INFERRED: the approved spherical model and a universal 0.05 m agreement with
the Swift reference are incompatible over supported movement samples. Speed
tolerance propagation alone cannot repair state-transition divergence.

Recommendation (approval pending): amend D-100 to evaluate an ellipsoidal
WGS-84 geodesic implementation against the actual CLLocation reference, rather
than widen tolerances to accept changed decisions. GeographicLib provides a
maintained JS implementation under MIT/X11, but Lens compatibility, size and
measured agreement must be verified before adoption:
https://geographiclib.sourceforge.io/html/js/

After the distance model agrees, propagate only the measured/approved distance
bound through fallback speed: epsilon_v = epsilon_d / delta_t; a mean of N
samples uses sum(epsilon_v_i)/N, with zero contribution from valid reported
speeds. Keep acceptance decisions, pursuit, event selection and Bond exact.
No distance-model change, new runtime dependency or widened speed bound has
been made. Device behavior remains NOT_COMPUTABLE.
