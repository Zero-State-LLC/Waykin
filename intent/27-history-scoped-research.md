# Intent: history-scoped migration research (#27)

## Problem

The lifecycle harness assumes that transplanting selected coordinate sequences
must retain all 264 decision differences from a different CoreLocation call
history. Apple-only isolation disproves that assumption on this host.

## Proposed outcome

Re-execute and verify the complete historical processor baseline, including its
264 decision-changing steps. Run each lifecycle case in a fresh process under
explicit cold and original-pair warm-up histories. Keep exact Swift/JS candidate
comparison, lifecycle coverage assertions, and evidence of all migration changes.

## Affected users / systems

Research harness and evidence only; no walker-facing change.

## Constraints / non-goals

User approved research-only repair and #27 issue-local coordination on 2026-10-13.
Production Swift/TS/Lens, canonical vectors, persistence and tolerances stay frozen.
No runtime adoption, merge, issue closure, or device acceptance is authorized.

## Open questions

Apple's internal mechanism and Lens behavior remain unproven. Runtime adoption
requires separate user approval after migration results are reviewed.

## Verified / assumed claims

| Claim | Label | Basis |
| --- | --- | --- |
| Apple-only history changes the threshold target | OBSERVED | CORELOCATION_ISOLATION_20261013 receipt |
| 264 is specific to the original full replay history | OBSERVED | Original replay and lifecycle receipts |
| Cold/warm profiles cover field histories exhaustively | NOT_COMPUTABLE | Synthetic research only |

## Author / date

- Author: Codex (/root)
- Date: 2026-10-13
