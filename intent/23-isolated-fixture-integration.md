# Intent: isolated fixture integration

## Problem

The distance candidate passes dedicated numerical and lifecycle research, but
the complete existing fixture suite and package compiler settings have not been
tested against a disposable candidate integration.

## Proposed outcome

Copy actual Swift/TS sources and tests into a fresh temporary directory. Replace
only the two movement-distance seams with approved research candidates. Run
unchanged Swift tests, export all six fixture families with the real Swift
exporter, repeat generation, and run unchanged TS tests and typechecks. Record
all failures and fixture payload changes; preserve real temporary Swift tree
provenance instead of pretending the candidate is the frozen reference.

## Affected users / systems

Research harness and evidence under #23 only. Temporary package copies are not
a runtime switch. Canonical source/fixtures must remain byte-identical.

## Constraints / non-goals

No test weakening, fixture fabrication, production edits, dependency changes,
Lens scene edits, persistence changes or runtime adoption. Prototype fixes may
address integration problems without modifying production behavior.

## Open questions

Will the complete package compile and pass the existing suite? Is Swift export
byte-identical across repeated runs and optimization modes? Lens/device evidence
and production migration still need their separate gates.

## Verified / assumed claims

| Claim | Label | Basis |
| --- | --- | --- |
| Dedicated candidate numerical research passes | OBSERVED | SELF_CONTAINED_GEODESIC_20261013 |
| All package tests pass with candidate integration | NOT_COMPUTABLE | This experiment will measure it |
| Isolated suite success approves migration | Not assumed | User retained separate runtime approval |

## Author / date

- Author: Codex (/root)
- Date: 2026-10-13
