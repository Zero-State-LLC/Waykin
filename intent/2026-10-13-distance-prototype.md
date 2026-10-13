# Intent: isolated distance-parity prototype

## Problem

The port's exact derived-speed assertions fail against CoreLocation. An
ellipsoidal distance bound alone did not establish exact threshold decisions.

## Proposed outcome

User approved an isolated Swift/TypeScript prototype and migration comparison
on 2026-10-13. Measure native/JS agreement and old/new processor behavior on
identical inputs. Preserve a reproducible harness and all mismatch counts.

## Affected users / systems

Research only. Temporary copies of the existing movement processor are used
to compare candidates; the repository's production processor is not edited.

## Constraints / non-goals

No production switch, tolerance relaxation, canonical vector edits, dependency
manifest changes, or merge. Candidate phase one uses Swift-to-C GeographicLib
2.2 and TypeScript-to-JS GeographicLib 2.2.0. This is not a pure-Swift port or
a claim of Lens compatibility. Native/JS mismatch is a valid negative result.
Vendor downloads stay outside the repository and are checked by SHA-256.

## Open questions

Does a common algorithm agree exactly across runtimes? Which historical
movement decisions change? A pure-Swift transcription, Lens execution,
MovementEngine/experience migration and any runtime switch remain separate
evidence gates. User approval is required before production adoption.

## Verified / assumed claims

| Claim | Label | Basis |
|---|---|---|
| Current movement speed parity fails | OBSERVED | CI 38460523367, 84 pass / 1 fail |
| Ellipsoidal tolerance alone preserves decisions | Not assumed | Prior threshold experiment contradicts it |
| Native and JS GeographicLib implement the documented geodesic algorithm | OBSERVED | Official C/JS documentation |
| Candidate exact cross-runtime parity | NOT_COMPUTABLE | This experiment measures it |
| Physical behavior or Lens numeric agreement | NOT_COMPUTABLE | No device/runtime execution |

## Author / date

- Author: Codex (/root)
- Date: 2026-10-13
