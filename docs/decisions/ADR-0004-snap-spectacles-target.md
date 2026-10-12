# ADR-0004: Add Snap Spectacles as an approved target

## Status

Accepted. Approved by Danny (Zero State LLC) on 2026-10-11.

## Context

`WAYKIN_SPEC.md` excludes "Mandatory AR glasses or wearable dependency." `docs/SOLO_MVP_SCOPE.md` lists "AR glasses integration" and "Wearable integration" as non-goals. `ROADMAP.md` lists "AR-glasses dependency" under non-authorizing future reference.

The research plan (`PLAN.md`, 2026-10-11) evaluated Snap Spectacles and consumer Specs. It found the following:

- Lenses run in Lens Studio and are scripted in TypeScript or JavaScript. Swift `WaykinCore` can't run inside a Lens.
- GPS is available through `RawLocationModule` and `GeoLocation.createLocationService()`. Location requires a paired Snapchat account, location permission, and internet.
- A published Lens can combine RawLocation and Internet under Transparent Permission. Lenses that use Experimental APIs can't be published.
- Publishing requires 60 FPS. Lenses that exceed 100% of the CPU/GPU power budget throttle, enter thermal standby, or shut down.
- Snap documents about 45 minutes of continuous standalone runtime for 2024 developer Spectacles. Snap doesn't document consumer Specs battery life.

## Decision

1. Snap Spectacles is an approved, non-mandatory target. The MVP is a standalone Lens named "Lira Walks With You": a walk of about 15 minutes.
2. The Lens is built with Lens Studio and TypeScript. It uses a TypeScript port of the `WaykinCore` gameplay logic (`packages/waykin-core-ts`). The Lens reads GPS through the Snap location API. Lira is an AR companion. The Lens uses seeded events and semantic audio cues, and it expresses pursuit only through audio and Lira behavior. Each walk ends with a summary. Bond and memories persist locally in the Lens.
3. The MVP excludes HealthKit, the iPhone companion and Spectacles Mobile Kit, the map, Snap Cloud, and multiplayer. Each of these requires its own ADR.
4. This ADR amends these exclusions:
   - `WAYKIN_SPEC.md` "Mandatory AR glasses or wearable dependency": a Spectacles Lens is permitted. A *mandatory* glasses or wearable dependency for the iOS product stays excluded.
   - `SOLO_MVP_SCOPE.md` "AR glasses integration" and "Wearable integration": permitted only for the standalone Spectacles Lens scoped by `specs/001-spectacles-lira-walk/`. Other glasses or wearable integrations stay non-goals.

## iOS app status

The iOS app stays the reference implementation. Swift `WaykinCore` remains the gameplay source of truth. The iOS roadmap and validation contract (`make build`, `make test`, `make validate`) don't change.

Open question: The governing docs don't say whether "reference implementation" also makes iOS the primary shipped product, or only the behavioral authority. Danny decides. `specs/001-spectacles-lira-walk/spec.md` tracks this question.

## Core isolation implications

- `packages/waykin-core-ts` is a parallel core. It must not import Lens Studio APIs, audio filenames, scene objects, or storage APIs. It mirrors the `WaykinCore` isolation invariant and runs in Node.
- Swift is the source of truth for test vectors. A Swift export target generates seed and event vectors. TypeScript consumes them read-only. TypeScript must never generate or edit vectors.
- A behavior change lands in Swift first. It then regenerates vectors, and TypeScript follows in the same PR or a linked PR. CI fails if the vectors are stale or if TypeScript parity fails.
- This ADR doesn't change the Swift isolation baseline (`scripts/check_core_framework_isolation.sh`).

## Consequences

- Two cores now exist. The project accepts the risk of drift. The parity contract and a CI job in `.github/workflows/ci.yml` mitigate it.
- Lens adapters (location, audio, storage, presentation) may realize semantic state. They may not become gameplay authorities.
- Location depends on a paired phone and internet. A walk must remain safe and completable when location is unavailable. Demo Walk is the fallback.
- The evidence rules apply unchanged. FPS, power, thermal, battery, and outdoor GPS behavior stay `NOT_COMPUTABLE` until device receipts exist.
- `App/Wearables/GlassesGlance*` (#115) is not the Spectacles path for the MVP, because the standalone Lens has no phone transport.

## Alternatives considered

- **iPhone companion through Mobile Kit:** Rejected for the MVP. Publishability with sensitive data is unverified, and it adds a sync surface.
- **Snap Cloud persistence:** Rejected. It is in alpha, needs an application, and introduces a backend that the spec excludes.
- **Native Development Kit (C++):** Deferred. TypeScript fits the Lens toolchain and the pure-logic port.
