# Core port receipt: movement, audio and walk experience

- Date: 2026-10-13
- Issue: https://github.com/Zero-State-LLC/Waykin/issues/23
- Branch: `codex/23-specs27-core-port`
- Base: `3de19ae4121095c5d4e52e36abe82e04343c930a`
- Status: local, uncommitted; full port and T044 incomplete.

## Changes

Added movementIntegrity.ts, movementEngine.ts, audioExperience.ts and
experience.ts, their tests and barrel exports. Regenerated the Lens core
through scripts/sync_core_ts.sh. Movement preserves rejection order, anchor
retention, speed smoothing and lifecycle guards; distance follows approved
D-100 Haversine. Clocks and session IDs are injected, separate from gameplay RNG.

Walk experience preserves fresh-per-tick RNG with external cooldown history,
pursuit predecessor checks, 32-event history, Bond accumulation, memory-text
precedence and event-first semantic audio. Copies preserve Swift value semantics.
The standalone Lens runtime union excludes deprecated non-walk experiences.
Timed event records omit platform UUIDs; adapter identity remains separate.
No Swift gameplay changes or hand-authored parity fixtures.

## Verification (OBSERVED)

Using the installed TypeScript 6.0.3 fallback (not locked dependency install):

```sh
node /Users/appliedalchemylabs/.local/lib/node_modules/openclaw/node_modules/typescript/lib/tsc.js -p tsconfig.build.json --typeRoots /Users/appliedalchemylabs/.local/lib/node_modules/openclaw/node_modules/@types
node --test --test-reporter=spec build/test/*.test.js
node /Users/appliedalchemylabs/.local/lib/node_modules/openclaw/node_modules/typescript/lib/tsc.js -p tsconfig.lens.json --ignoreDeprecations 6.0
node scripts/check-isolation.mjs
```

- TypeScript build, ES2019 check and isolation: PASS.
- Node tests: 69/69 PASS; no skipped tests. Includes 11 existing seed/event
  fixture files plus source-mapping/unit tests, not full new-family parity.
- Root sync --check and git diff --check: PASS.
- Lens forced compilation: succeeded. Subsequent Preview refresh: no errors,
  SIK 0.18.0 startup print. Gameplay scripts remain unattached: no playable
  Waykin execution or hardware evidence claimed.
- make build and make test: fail before Swift compilation, nested sandbox
  reports sandbox_apply: Operation not permitted. Canonical validation remains
  unresolved; see /private/tmp/waykin-experience-{build,test,validate}.log.

## Remaining

Demo controller, canonical identity, full Swift-generated movement/companion/
pursuit/bond-memory/demo families and their schemas/readers, T044 verification,
locked-dependency and canonical gates. Source review found the Swift demo
runToEnd loop cannot progress when paused; resolve as a bounded defect before
copying that unsafe behavior. Physical evidence remains NOT_COMPUTABLE.
