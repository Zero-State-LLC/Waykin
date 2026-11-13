# Intent: SPECS 27 core port

## Problem

Issue #23 tracks the missing TypeScript gameplay boundary required by the
standalone Lens. The existing seed/event subset is not a complete walk runtime.

## Proposed outcome

Port the missing L §3.1 exports from Swift, with Swift-generated fixture
families and read-only TypeScript parity tests. Work incrementally, beginning
with companion runtime and presentation mapping. Full T044 remains open until
all required exports and parity gates pass.

## Affected users / systems

Pure TypeScript core, Swift vector exporter, generated Lens core and tests.
The iOS runtime remains the behavioral reference. The sole approved exception
is #25: on 2026-10-13 the user authorized runToEnd() to return without advancing
while paused, with matching Swift and TypeScript regression tests.

## Constraints / non-goals

Authority: ADR-0004, issue #23, user-approved takeover and D-325 SPECS 27 target.
Branch: `codex/23-specs27-core-port`.
Base: `3de19ae4121095c5d4e52e36abe82e04343c930a`.
One implementation owner: Codex (/root). Issue-local claim is recorded on #23.
Preserve Swift gameplay, App/**, persistence semantics and unrelated edits.
Only Swift writes vector fixtures. Never hand-edit the generated Lens core.
No device, publishability or complete-gameplay claims from unit tests.

## Open questions

Full Swift parity execution is environment-blocked by the observed nested
sandbox rejection. An installed TypeScript compiler may provide a local
validation fallback; it does not replace lockfile/CI verification.

## Verified / assumed claims

| Claim | Label | Basis |
| --- | --- | --- |
| UInt64 already uses two uint32 words | OBSERVED | Existing source |
| Companion runtime and matrix have small explicit Swift mappings | OBSERVED | Graph-backed Swift source inspection |
| Complete export parity | NOT_COMPUTABLE | Remaining port and fixture families absent |
| SPECS 27 physical behavior | NOT_COMPUTABLE | No device receipt |

## Author / date

- Author: Codex (/root)
- Date: 2026-10-13
