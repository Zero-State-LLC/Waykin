# Isolated D-100 distance experiment

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
