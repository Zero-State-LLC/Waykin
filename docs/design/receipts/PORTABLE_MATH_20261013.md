# Deterministic math prototype — first gate

OBSERVED: 94,559 unique function/input cases pass exact Swift/TypeScript
comparison in both Swift `-Onone` and `-O`. Optimized and debug Swift result
bits also agree. Finite results and signed zeros compare by bits; invalid NaN
payloads are explicitly outside the numeric contract.

| Primitive | Cases per build | Exact mismatches |
|---|---:|---:|
| sin | 22,508 | 0 |
| cos | 22,453 | 0 |
| atan2 | 25,646 | 0 |
| sqrt | 23,952 | 0 |

Maximum sampled absolute deviation against native Swift and JS baselines is
5.551115123125783e-16 (cosine); sine and atan2 maxima are
4.440892098500626e-16. Sqrt matches both baselines in this corpus. This is not
a proof of correct rounding or a change to production tolerances.

The implementation is pure Swift plus matching ES2019 TypeScript. It replaces
host sin/cos/atan2 with a documented bounded evaluator; sqrt still relies on
host square root and must also be verified on Lens. See the
[numeric contract](../../../scripts/research/distance-prototype/PORTABLE_MATH_CONTRACT.md)
and [machine-readable report with source/input hashes](PORTABLE_MATH_20261013.json).

Command:

```sh
node scripts/research/distance-prototype/test_portable_math.cjs /var/folders/5v/pc971cjj2g11dntwbdyhrg180000gn/T/waykin-math-probe-u3NPGT
```

Full output: `/var/folders/5v/pc971cjj2g11dntwbdyhrg180000gn/T/waykin-portable-math-RXggCM/`.
The input contains earlier geodesic math traces, seeded samples and explicit
edge cases, all transmitted with exact binary64 bits.

`make build`, `make test` (134 tests), `make validate` including native app
build pass. Logs: `/private/tmp/waykin-portable-{build,test,validate}.log`.
Production sources, canonical fixtures and parity tests remain unchanged.

INFERRED: this removes a demonstrated obstacle at the elementary-function
level on the tested host. It does not establish a distance implementation.
Next: integrate the same evaluation sequence into the pure-Swift/TS geodesic
prototype, reconcile native/JS normalization differences, then repeat the
exact distance and movement migration comparisons.

NOT_COMPUTABLE: geodesic parity with this layer, full MovementEngine/experience
migration, Lens performance/numerics, and physical-device behavior. Runtime
adoption remains separately approval-gated; the full port is not complete.
