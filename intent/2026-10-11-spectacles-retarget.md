# Intent

## Problem

Waykin runs only on iOS. The binding spec excludes AR glasses and wearable integration, so no work can begin on Snap Spectacles. The Swift `WaykinCore` can't run in a Lens.

## Proposed outcome

When this work is done, the following are true:

- ADR-0004 is accepted.
- The amendments to `WAYKIN_SPEC.md`, `SOLO_MVP_SCOPE.md`, `ROADMAP.md`, and `README.md` are merged.
- `specs/001-spectacles-lira-walk/` defines a standalone Lens, "Lira Walks With You." It covers a walk of about 15 minutes, a TypeScript `WaykinCore` port that is verified against Swift vectors, GPS, Lira in AR, seeded events and audio cues, pursuit through audio and Lira behavior only, a summary, and local Bond and memories.

Out of scope: HealthKit, the iPhone companion and Mobile Kit, the map, Snap Cloud, multiplayer, camera and ML, monetization, and any change to the iOS app.

## Affected users / systems

Walkers who own Spectacles. Also affected: Lira, the movement engine and movement integrity, the event generator, pursuit, semantic audio, Bond and memory persistence, AR presentation contracts, safety, field receipts, and CI (`.github/workflows/ci.yml`).

## Constraints / non-goals

- Solo MVP scope applies.
- Swift is the source of truth for vectors. The TypeScript core imports no Lens APIs.
- Seeded behavior must reproduce bit-exactly.
- Device behavior is never reported as `OBSERVED` without a device receipt.
- The Lens uses only publishable permissions.
- This work doesn't decide hardware spend, monetization, sync, or session lengths beyond about 15 minutes.

## Open questions

| Question | Decider |
|---|---|
| Does "iOS stays the reference" also mean iOS stays the primary shipped product? | Danny |
| What is the consumer Specs battery life? | `NOT_COMPUTABLE` until Snap documents it |
| What are the current Developer Program pricing and terms? | Danny |
| Is Mobile Kit combined with location publishable? (Deferred; not in the MVP.) | Snap docs and Danny |
| Who re-authors the Lira rig for Lens Studio, and what are the polygon and animation budgets? | Danny |
| Does the Lens Studio script runtime support `BigInt`? | Engineering spike (R3) |

## Verified / assumed claims

| Claim | Label | Basis |
|---|---|---|
| The RNG is SplitMix64. Seed 0 maps to `0x9E3779B97F4A7C15`. | `OBSERVED` | `WorldEventGenerator.swift` |
| The generator draws one RNG value only when at least one rule is eligible. | `OBSERVED` | `WorldEventGenerator.swift` |
| Publishing requires 60 FPS. | `INFERRED` | Snap publishing docs, cited in PLAN.md; not checked here |
| Developer Spectacles run about 45 minutes standalone. | `INFERRED` | Snap newsroom, cited in PLAN.md |
| Consumer Specs battery life | `NOT_COMPUTABLE` | Not documented in the sources found |
| A 15-minute outdoor walk completes without thermal standby. | `NOT_COMPUTABLE` | No device receipt |
| RawLocation plus Internet is publishable under Transparent Permission. | `INFERRED` | Snap Transparent Permission docs |

## Author / date

- Author: SCRIBE, for Danny (Zero State LLC)
- Date: 2026-10-11
