# Isolated D-100 distance experiment

## Threshold-focused follow-up — do not infer state parity

OBSERVED: `geodesic_threshold_probe.swift` uses binary search to select
endpoint pairs near actual CoreLocation distances of 0.55 m and 1.5 m,
with target offsets ±1e-8 and ±1e-6 m. It measures and emits actual distances
after coordinate rounding, rather than assuming the search hit its target.
From the expanded probe's 168 rays it produces 1,344 deliberately adversarial
cases. The same GeographicLib 2.2.0 comparator found:

- Maximum distance error 0.021574641696457286 m; zero above 0.05 m.
- 144 disagreements on the `distance >= 0.55` comparison (one-second speed).
- 168 disagreements on `distance >= 1.5`.
- At each of ±37.7749 degrees: 18 disagreements on each comparison among 192
  cases. Thus disagreement is not confined to polar endpoints.

These counts are arithmetic threshold comparisons, not full processor state
replays or real-world incidence estimates. Samples were selected specifically
to expose boundaries; smoothing and prior state are not modeled here.
Nevertheless, satisfying distance tolerance does not imply exact decisions.
The recommendation is now to retain the production model until a reference-
compatible distance strategy and full threshold replay can be established.
Do not adopt GeographicLib or relax state assertions merely from the broader
grid's zero threshold mismatches. No production change has been made.

Reproduce after the expanded probe:

```sh
swift scripts/research/geodesic_threshold_probe.swift /private/tmp/waykin-geodesic-reference.json > /private/tmp/waykin-geodesic-thresholds.json
node scripts/research/compare_geodesic.cjs /private/tmp/waykin-geodesic-thresholds.json /private/tmp/waykin-geographiclib-geodesic.min.js
```

## Expanded JavaScript evaluation (after access restoration)

OBSERVED: `geodesic_reference_probe.swift` writes 1,344 CoreLocation distances
to stdout, using seven latitudes (including ±89.999 degrees), three longitudes
(including ±179.999), eight bearings and eight displacements. Spherical
forward construction chooses identical endpoints for both implementations;
it is not used as expected distance. `compare_geodesic.cjs` compares the
result with GeographicLib geodesic JavaScript 2.2.0, downloaded for research
only from https://geographiclib.sourceforge.io/scripts/geographiclib-geodesic.min.js.
Downloaded SHA-256: `06e3512904b346575f475f14d0b27ea0979dbcd2b0eddebf5f1eeefd234395b5`.

Across 1,344 cases: maximum absolute error 0.039564362828173216 m;
zero errors above 0.05 m. For the 1,038 cases whose CoreLocation distance is
at most 60 m, maximum error is 0.005547896386421947 m. Arithmetic comparisons
at 0.55 m (one-second speed) and 1.5 m (displacement) had zero disagreements
in this sample. These endpoints are not an exhaustive threshold-neighborhood
search. No claim of exact state parity, speed averaging parity or Lens runtime
compatibility follows. The third-party file is not added to production or
the package lockfile.

Reproduce on macOS after separately obtaining the named library:

```sh
swift scripts/research/geodesic_reference_probe.swift > /private/tmp/waykin-geodesic-reference.json
node scripts/research/compare_geodesic.cjs /private/tmp/waykin-geodesic-reference.json /private/tmp/waykin-geographiclib-geodesic.min.js
```

PR #26 CI independently passes Swift vector freshness and all 134 Swift
tests. TypeScript fails the known exact derived-speed comparison. The new
repository validation job stops because XcodeGen is not installed on its
runner; installing that prerequisite is the proposed CI fix, pending approval.
This is separate from local template-validation failures (#24).

User approved evaluation and draft-PR validation, not a production distance
change or merge. The Haversine implementation and parity tolerances remain
unchanged.

## Reproduction

On macOS, run `swift scripts/research/wgs84_meridian_probe.swift` from the repo.
In this session a writable module cache was supplied with
`-module-cache-path /private/tmp/waykin-swift-module-cache`.

The probe numerically integrates the WGS84 meridional radius of curvature
using 64-interval Simpson quadrature. It compares this independent calculation
to actual CoreLocation calls for 30 cases: five latitudes (-80, -37.7749, 0,
37.7749, 80 degrees), six signed spherical displacements (-60, 0.551, 1.502,
10, 60, 500 meters). Both points have longitude zero. This standalone script
does not import WaykinCore, write Tests/Vectors, or supply parity expectations.

OBSERVED maximum absolute error: 0.00021382789918789058 m, below 0.05 m for
these cases only. The baseline sphere/CoreLocation discrepancy had already
exceeded 0.05 m at 10 m northbound on the equator.

INFERRED: an ellipsoidal approach is promising. This is not validation of a
general inverse-geodesic implementation, GeographicLib JavaScript, Lens
compatibility, arbitrary bearings, antimeridian/polar behavior, or exact
movement-state parity. Even errors smaller than 0.05 m can cross a threshold.
The next experiment needs arbitrary bearings, near-threshold samples and
actual derived-speed/state comparisons before any production recommendation.

## Validation delivery

The draft workflow now includes a separate macOS job for `make build`,
`make test` and `make validate`; vector generation alone was insufficient to
exercise the approved paused-demo Swift regression. This job is authored,
not yet run. Local SwiftPM remains blocked by nested sandbox restrictions.

Publishing remains blocked: `gh api user` cannot connect, and an unauthenticated
curl probe fails DNS resolution for api.github.com. Thus the CLI's invalid-token
message does not prove the user's repaired credentials are invalid. No secret
was inspected. No commit, push or PR has been made for this validation attempt.
