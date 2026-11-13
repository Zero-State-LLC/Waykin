# Intent: self-contained TypeScript distance prototype

## Problem

The isolated TypeScript candidate currently relies on pinned GeographicLib JS
loaded through Node's VM. That does not establish a Lens-compatible module.

## Proposed outcome

Transcribe the tested distance-only Swift implementation into strict ES2019
TypeScript with only the existing portable-math module as a dependency.
Compare exact outputs with Swift and the pinned matched-JS research reference;
retain the unmodified geographic accuracy sanity check and all original cases.

## Affected users / systems

Research prototype and its receipts only, under the approved #23 prototype scope.

## Constraints / non-goals

No production adoption, new dependency, canonical fixture edits, relaxed parity,
Swift behavioral change, persistence change, or Lens gameplay wiring. Preserve
the upstream MIT/X11 attribution and explicitly bounded numeric contract.
Node agreement alone does not prove Lens agreement.

## Open questions

Exact distance/processor/lifecycle behavior and actual Lens numeric execution
must be established before separate runtime approval can be considered.

## Verified / assumed claims

| Claim | Label | Basis |
| --- | --- | --- |
| Pure Swift matches the matched-JS backend on 42,864 distances | OBSERVED | PORTABLE_GEODESIC_20261013 |
| A self-contained TS transcription preserves those results | NOT_COMPUTABLE | Requires the new comparison |
| Node numeric parity implies Lens parity | NOT_COMPUTABLE | Actual Lens execution required |

## Author / date

- Author: Codex (/root)
- Date: 2026-10-13
