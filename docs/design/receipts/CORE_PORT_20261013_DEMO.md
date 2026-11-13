# Core port receipt: demo and canonical identity

- Date: 2026-10-13
- Issues: Zero-State-LLC/Waykin#23, #25
- Branch: codex/23-specs27-core-port
- Base: 3de19ae4121095c5d4e52e36abe82e04343c930a
- State: uncommitted; full parity and T044 incomplete.

## Implementation

Added companionIdentity.ts and demoSession.ts, exported and generated into the
Lens. Canonical Lira UUID, default Bond 12 and independent memory arrays match
Swift. Demo preserves seven 40-second simulated ticks, scheduled event order,
semantic cues, pursuit progression, summary and teardown. Clock/UUID creation
is injected; the Lens driver owns real-time pacing. Getters copy Swift value
types. Existing Swift restart-while-active throwing order is preserved.

User explicitly approved #25: runToEnd returns without advancing while paused.
Added the guard to Swift and TypeScript, plus regression tests in each. This is
the sole exception to frozen Swift behavior. No App or persistence changes.

## Verification

OBSERVED:
- TypeScript 6.0.3 fallback build passes; 75/75 Node tests pass, no skips.
- ES2019 typecheck and isolation pass.
- Generated Lens sync check and git diff --check pass.
- Lens forced TypeScript compile succeeds; subsequent Preview refresh reports
  no errors and SIK 0.18.0 startup. No attached Waykin gameplay execution claimed.
- swift test --filter DemoAndPhysicsTests fails before compilation because
  SwiftPM sandbox_apply is not permitted.
- A normal direct swiftc full-core compile also fails: SwiftData/Observation
  macro subprocesses hit the same sandbox restriction. No sandbox protections
  disabled, macros removed, or fixtures fabricated.
- Required make build, make test and make validate each exit 2. Logs are
  /private/tmp/waykin-demo-build.log, /private/tmp/waykin-demo-test.log and
  /private/tmp/waykin-demo-validate.log. These gates are not passed.

These source-mapping tests do not replace full Swift-generated parity. The
Swift regression is authored but not executed successfully. #25 stays open.

## Remaining gates

Swift-generated movement, companion, pursuit, bond-memory and demo families,
their schemas and read-only TS readers; consumed-export audit T044; locked
dependency verification; canonical validation. Since #25 changes Swift core,
all generated fixtures must be refreshed with the correct Swift tree hash after
the reference change is recorded. Existing fixture tests remain historical
seed/event evidence, not proof of freshness against this dirty Swift tree.

Physical GPS/audio/AR/device behavior remains NOT_COMPUTABLE. Full Lens build
and playable Demo remain incomplete until downstream wiring and acceptance.
