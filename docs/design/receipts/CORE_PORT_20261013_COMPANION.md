# Core port receipt: companion slice

- Date: 2026-10-13
- Issue: https://github.com/Zero-State-LLC/Waykin/issues/23
- Branch: `codex/23-specs27-core-port`
- Base SHA: `3de19ae4121095c5d4e52e36abe82e04343c930a`
- Working-tree changes are uncommitted; this is not a release receipt.

## Implemented

`packages/waykin-core-ts/src/companionRuntime.ts` ports Swift's
`CompanionRuntime` and `CompanionPresentationMatrix`, including null-event
behavior, invalid-command fallback, finite positive distances, event overlay
precedence, and exact path-pressure boundaries. Exported through `index.ts`.
Generated Lens copy updated only with the existing sync script.

The TypeScript API uses `applyCommand`, `applyEvent`, `resolveEventKind`, and
an object argument for `arBehaviorString` to express Swift's labeled overloads.
This is not a change to gameplay semantics. Future adapters should consume
these exports, not duplicate the mapping.

## Verification (OBSERVED)

Commands below ran in `packages/waykin-core-ts` unless otherwise stated.
The available fallback compiler is TypeScript **6.0.3**, not the lockfile
installation. No dependencies or lockfiles were changed to mask this difference.

```sh
node /Users/appliedalchemylabs/.local/lib/node_modules/openclaw/node_modules/typescript/lib/tsc.js -p tsconfig.build.json --typeRoots /Users/appliedalchemylabs/.local/lib/node_modules/openclaw/node_modules/@types
node --test build/test/*.test.js
node /Users/appliedalchemylabs/.local/lib/node_modules/openclaw/node_modules/typescript/lib/tsc.js -p tsconfig.lens.json --ignoreDeprecations 6.0
node scripts/check-isolation.mjs
```

- Build: PASS (exit 0).
- Tests: PASS, **46/46**, zero skipped. Includes 15 new companion mapping and
  edge-case tests plus existing seed-event parity and UInt64/generator tests.
- ES2019 typecheck: PASS. The CLI flag suppresses TS6's module-resolution
  deprecation diagnostic only; project type/target assertions are unchanged.
- Isolation: PASS.
- Repo root `bash scripts/sync_core_ts.sh --check`: PASS.
- Repo root `git diff --check`: PASS.
- Lens MCP forced compilation: succeeded.
- Subsequent Preview refresh: no reported errors; SIK 0.18.0 startup print.
  No Waykin gameplay script was attached, so this is not runtime gameplay proof.

## Canonical gates

- `make build`: FAIL before build, `sandbox_apply: Operation not permitted`.
- `make test`: FAIL before tests, same nested-sandbox restriction.
- `make validate`: FAIL. Version parity, Swift core isolation and Lira USDZ
  integrity pass. Collaboration validator reports missing agent-task,
  validation-task and defect issue templates. Swift fails as above; native
  xcodebuild also fails. No assertions or validators were modified.
- Simulator validation: SKIPPED (no iOS UI changes).
- Physical device evidence: NOT_COMPUTABLE.

## Remaining work

Companion tests are direct Swift-source mapping tests, not Swift-generated
companion fixture parity. No new `Tests/Vectors` data was fabricated. Complete
that fixture family through the Swift exporter once it can run, then continue
movement/integrity, experience/pursuit, semantic audio, path, bond/memory and
demo exports with their parity families. T044 and full Lens build acceptance
remain open. Locked dependency installation and canonical validation must pass
before merge readiness; this patch is not ready for release.
