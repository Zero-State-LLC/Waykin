# Core port receipt: path slice

- Date: 2026-10-13
- Issue: https://github.com/Zero-State-LLC/Waykin/issues/23
- Branch: `codex/23-specs27-core-port`
- Base SHA: `3de19ae4121095c5d4e52e36abe82e04343c930a`
- Status: local, uncommitted; full port and T044 incomplete.

## Changes

Added `path.ts`: Swift-source ports of PathProgressEngine, PathAudioCoupling
and WalkPathCopy. Added `audioCue.ts` for semantic cue values and initializer
clamps, without filenames or playback APIs. Both are exported from index.ts
and synced into the Lens using the existing generation script.

Path engine reads only `isMoving` and `distanceDelta` from caller-accepted
movement. It does not perform GPS acceptance or change movement authority.
Snapshot reads return copies to preserve Swift value semantics. Recovery,
stationary streak retention, rejection thresholds and strict audio cooldown
boundaries follow the Swift sources. Summary whitespace explicitly follows
Foundation, not JavaScript trim; a read-only standalone Swift probe confirmed
the whitespace scalar ranges, including U+0085/U+200B and excluding U+FEFF.
This probe did not generate parity fixtures or execute the Swift package.

## Verification (OBSERVED)

Same TypeScript 6.0.3 fallback compiler and typeRoots as the companion receipt:

```sh
node /Users/appliedalchemylabs/.local/lib/node_modules/openclaw/node_modules/typescript/lib/tsc.js -p tsconfig.build.json --typeRoots /Users/appliedalchemylabs/.local/lib/node_modules/openclaw/node_modules/@types
node --test --test-reporter=dot build/test/*.test.js
node /Users/appliedalchemylabs/.local/lib/node_modules/openclaw/node_modules/typescript/lib/tsc.js -p tsconfig.lens.json --ignoreDeprecations 6.0
node scripts/check-isolation.mjs
```

- Build/typecheck: PASS.
- Node tests: **54/54 PASS**, zero skipped; 8 new path/cue tests.
- ES2019 check and isolation: PASS.
- Root `bash scripts/sync_core_ts.sh --check`: PASS.
- Root `git diff --check`: PASS.
- Lens forced compilation: succeeded. Subsequent Preview refresh: no errors,
  SIK 0.18.0 startup print. No Waykin gameplay execution claimed.
- Root `make build`, `make test`, `make validate`: each exit **2**. SwiftPM
  manifest processing still reports `sandbox_apply: Operation not permitted`.
  Canonical validation also reports the missing issue templates tracked in #24
  and a native build failure. Logs: `/private/tmp/waykin-path-build.log`,
  `/private/tmp/waykin-path-test.log`, `/private/tmp/waykin-path-validate.log`.

## Remaining evidence and work

Tests are Swift-source mapping checks, not newly generated Swift parity
fixtures. Existing seed/event fixture tests remain green. No files under
Tests/Vectors were hand-authored or altered. Locked-dependency verification,
complete Swift-generated parity and canonical validation remain open.
Movement/integrity, full audio experience, walk experience/pursuit, demo and
Bond/memory exports remain to port. Physical evidence is NOT_COMPUTABLE.
