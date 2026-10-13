# Portable math v0 — research contract

User approved the deterministic-math / pure-Swift prototype extension on
2026-10-13. This layer is isolated under `scripts/research`; it is neither a
production library nor a completed inverse-geodesic implementation.

## Arithmetic contract

- IEEE binary64 operations in the written order, round after each operation.
  No fused multiply-add. Swift add/multiply/divide helpers are never-inline;
  parity is tested under `-Onone` and `-O`, not assumed from source similarity.
- Pi is the binary64 value of `3.141592653589793`; half/quarter/two-pi are the
  written division/multiplication of that value, not separate rounded literals.
- Sin/cos accept finite radian arguments in [-2pi, 2pi]. Other inputs return
  NaN, never an inaccurate large-angle remainder fallback. Reduce to [-pi,pi],
  then reflect into [-pi/2,pi/2]; preserve cosine sign and sine signed zero.
- Sin/cos evaluate their Maclaurin recurrences in ascending order with 15
  updates after the initial term. Each term and sum operation is explicit.
- Atan2 handles quadrants, signed zeros, infinities and NaN explicitly. Reduce
  the magnitude ratio to [0,1]. Ratios above `0.41421356237309503` use
  atan(r) = pi/4 + atan((r-1)/(r+1)); then 32 updates after the initial term of
  the alternating odd-power series. No host atan2/sin/cos calls.
- Sqrt uses Swift `Double.squareRoot()` and JS `Math.sqrt()`. Sampled bit
  agreement is verified, not proof for every runtime/input. A Lens discrepancy
  must fail the gate and be investigated rather than tolerated.
- Cross-language parity compares every finite result and signed zero by bits.
  NaN is a semantic invalid result; NaN payload bits are not a contract.
- Exact-bit hex transport is mandatory for research inputs and outputs.

Mathematical basis: [NIST DLMF trigonometric series](https://dlmf.nist.gov/4.19),
[inverse-trigonometric series](https://dlmf.nist.gov/4.24), and
[argument reduction](https://dlmf.nist.gov/4.45). This is an authored bounded
research evaluator, not a copied or certified correctly-rounded libm.

## Evidence gate

```sh
node scripts/research/distance-prototype/test_portable_math.cjs /path/to/math-probe-output
```

The prior traced primitive inputs are combined with a seeded 20,000-iteration
corpus and explicit edge cases. Tests cover zero signs, nonfinite inputs,
subnormals, extreme atan2 ratios, quadrant boundaries, the atan reduction
boundary and explicit out-of-domain trigonometric rejection. Duplicate cases
are deduplicated by function and input bits, not by approximate value.

The independent accuracy sanity gate compares the research results with both
host baselines (maximum allowed sampled absolute error 2e-15 for trig). This
is **not a change to Waykin's parity tolerance**, does not permit output
rounding, and is not a proven global mathematical error bound. A matching pair
of wrong implementations would not suffice; domain and accuracy checks remain
separate from exact cross-language assertions.

## Integration not yet established

Keep this layer out of production until a pure-Swift inverse-geodesic prototype
uses the same evaluation sequence as TypeScript and passes distance, processor,
MovementEngine and downstream migration gates. Verify all trigonometric call
arguments stay within this layer's documented domain. Do not silently fall
back to host trig or sphere outside that domain. GeographicLib's native/JS
normalization and angle-special-case differences still need reconciliation.
Lens-runtime evidence and performance are separate gates. Exact agreement on
the primitive corpus is not proof of full port completion.
