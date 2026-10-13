# Isolated fixture integration — 2026-10-13

**OBSERVED: all six fixture families pass with the shared candidate, but the
unchanged full TypeScript suite fails two sphere-specific unit assertions.**
The research runner exits 2 (`FAILED_EXISTING_UNIT_TESTS`), not success.
Production adoption is still unapproved; no canonical fixtures were changed.

## Method and provenance

`test_fixture_integration.cjs` copies actual Swift/TS sources, tests, compiler
configuration and schemas into a fresh temporary project. It changes exactly
the Swift movement-distance implementation and the TS processor's distance-call
seam to use the isolated candidates. It adds their helper modules only there.
The separately exported TS `movementDistanceMeters` helper remains the frozen
sphere implementation in this experiment; this is not a final public-API design.

Existing tests, typechecks and schemas are unchanged. Shared installed Node
dependencies are linked read-only by usage; output goes into the temporary
project. A local-only Git commit records the temporary Swift core, yielding
real tree `ac745215859cc8284f0d9ee4151c042f598d904e`. The actual Swift exporter
writes all fixtures with that provenance. No fixture values are fabricated.

The runner verifies original source/canonical-fixture hashes before and after,
and copied test/config/exporter hashes. All remain unchanged. The temporary
Swift source tree also remains unchanged through compilation and export.

## Results

| Check | OBSERVED result |
| --- | --- |
| Candidate Swift tests | 134 pass, 0 fail |
| Candidate TS package typecheck, ES2019 Lens typecheck, isolation | PASS; original compiler settings retained |
| Swift export: debug, repeated debug, release | 16 JSON files across all six families; byte-identical across all three runs |
| Unchanged family replay tests | 17 pass, 0 fail, 0 skipped in each run |
| Additional exact movement assertion | All 31 fixture steps match, including distance; no ±0.05 m allowance used |
| Full unchanged TS suite | 83 pass, 2 fail, 0 skipped in each of three runs |
| Fixture payload comparison with canonical files | No changes after excluding only `source.swiftTree` provenance |
| Frozen original files | Byte-identical after experiment |

The candidate matches the existing movement fixture's equatorial fallback
speed (step 11: 2.2263898158654714 m/s). Existing fixtures therefore do not
expose the historical decision changes found by the larger adversarial corpus.
Fixture-family PASS is not proof of historical behavior compatibility, full
numeric-domain parity, complete gameplay coverage, or Lens execution.

## Two preserved unit failures

`movement.test.ts` builds northbound coordinates from nominal metres using the
old spherical radius. Under the WGS84 candidate, its nominal 4 m sample is
3.9776679180178767 m. These unchanged tests fail their existing 1e-9 checks:

1. `rejected points do not replace anchor; NaN speed derives from distance`
2. `session lifecycle rejects invalid transitions and retains diagnostics after end`

This is a model-dependent test-input conflict in the isolated integration,
not permission to change a valid frozen-sphere assertion. No tests were skipped,
expected values rewritten, or tolerances relaxed. The first diagnostic run
stopped at these failures; the final runner retains a failing overall gate
while collecting repeat/export/release and family-specific evidence separately.

If production migration is approved, its plan must explicitly address these
test inputs and the public distance helper. Prefer independently specified
geometry under the approved model, not expected values computed by the same
function under test. Historical threshold changes and the previously observed
global ±0.05 m exceedances still require the separate migration decision.

## Strict typing correction

The new candidate initially failed the package's `noUncheckedIndexedAccess`
setting at private, bounded coefficient-array accesses. Non-null type assertions
now document those accesses. A transpilation comparison proves emitted JS is
identical to commit `6b83cd5` with comments removed; no numerical operations
changed. Both dedicated numerical runners now enable this compiler setting.
Reruns: 42,864 distance cases and 172,032 processor steps, zero exact mismatches;
Swift distance checks pass in both optimization modes.

## Remaining gates and reproduction

Actual Lens numeric execution is still NOT_COMPUTABLE: a fresh documentation
tool call again required Snapchat login through **My Lenses → Login**. Lens-side
work stopped. Runtime approval, device evidence and complete port acceptance
remain outstanding. Repository `make build`, 134 Swift tests, `make validate`
and diff checks pass. A fresh production TS run remains 84 pass / 1 fail / 0
skipped. The candidate's 83/2 result is a separate experiment.

```sh
node scripts/research/distance-prototype/test_fixture_integration.cjs
# Expected current exit: 2; inspect report.json and stage logs in printed directory.
```

[Machine-readable evidence](ISOLATED_FIXTURE_INTEGRATION_20261013.json) records
commands, statuses, stage-log hashes, source/fixture hashes, all three suite
results, type-only emission proof and dedicated numerical reruns. Base HEAD:
`6b83cd55f482e53445547999dc2cf78a255850b8`; research source hashes identify the patch.
