# Research: Lira Walks With You

Sources come from PLAN.md (2026-10-11). This file doesn't verify device behavior.

## R1: Tooling — Lens Studio with TypeScript

- **Decision**: Build with Lens Studio and TypeScript.
- **Rationale**: TypeScript is the native Lens scripting path, and the pure core ports cleanly to it.
- **Alternatives**: The Native Development Kit (C++) has a higher toolchain cost. The Unity Migration Agent doesn't apply, because there is no Unity source.
- **Sources**: https://developers.snap.com/spectacles/home · https://newsroom.snap.com/snap-launches-new-tools-for-specs-developers

## R2: Core port with Swift golden vectors

- **Decision**: Re-implement `WaykinCore` in `packages/waykin-core-ts`. Prove parity against vectors that Swift exports.
- **Rationale**: The core is pure and deterministic, so fixtures detect drift between the two cores.
- **Alternatives**: Hand-authored TypeScript fixtures aren't authoritative. Running Swift on a device isn't possible.

## R3: 64-bit RNG arithmetic

- **Decision**: Implement SplitMix64 with `BigInt` and `BigInt.asUintN(64, …)` after each wrapping add and multiply. If Lens Studio lacks `BigInt`, use two 32-bit halves behind the same `uint64.ts` interface.
- **Rationale**: Swift's `&+` and `&*` wrap at 2^64. JavaScript numbers are exact only to 2^53.
- **Open**: Lens Studio `BigInt` support is `NOT_COMPUTABLE`. A spike task (T006) resolves it. An in-Lens self-test checks the first RNG outputs.

## R4: Location

- **Decision**: Use `RawLocationModule` and `GeoLocation.createLocationService()` with `GeoLocationAccuracy.Navigation`. Poll `getCurrentPosition` at about 1 s. Don't use heading for Lira placement.
- **Rationale**: This is the documented GPS path. Heading needs calibration after OS updates.
- **Constraint**: Location requires a paired Snapchat account, location permission, and internet.
- **Sources**: https://developers.snap.com/spectacles/about-spectacles-features/apis/location · https://developers.snap.com/lens-studio/api/lens-scripting/classes/Built-In.LocationService.html

## R5: Permissions and publishability

- **Decision**: Request RawLocation plus Internet under Transparent Permission. Use no Experimental APIs and no direct HTTP or WebSocket calls.
- **Rationale**: Lenses that use Experimental APIs can't be published.
- **Sources**: https://developers.snap.com/spectacles/permission-privacy/transparent-permission · https://developers.snap.com/spectacles/about-spectacles-features/apis/internet-access · https://developers.snap.com/spectacles/about-spectacles-features/apis/web-socket · https://developers.snap.com/spectacles/get-started/start-building/publishing-lens

## R6: Persistence is local only

- **Decision**: Store Bond and the last five memories in Lens persistent storage.
- **Rationale**: This matches ADR-0003's local-first approach and the spec's exclusion of backends.
- **Alternatives**: Snap Cloud is in alpha, needs an application, and is a backend. Mobile Kit sync has unverified publishability.
- **Sources**: https://developers.snap.com/spectacles/about-spectacles-features/snap-cloud/overview · https://developers.snap.com/spectacles/spectacles-frameworks/spectacles-mobile-kit/getting-started · https://developers.snap.com/lens-studio/api/lens-scripting/classes/Built-In.SpectaclesMobileKitModule

## R7: Performance and thermal

- **Decision**: Target sessions of about 15 minutes. Hold 60 FPS. Stay below 100% of the power budget. Use an audio-forward degrade path.
- **Rationale**: Snap documents about 45 minutes of runtime on developer units, reduced by heat, sunlight, and SLAM. Consumer Specs battery life is undocumented.
- **Sources**: https://newsroom.snap.com/sps-2024-spectacles-snapos · https://developers.snap.com/spectacles/best-practices/profiling/lens-performance-overlay · https://developers.snap.com/spectacles/best-practices/performance-optimization/environment-setup-guidance

## R8: Interaction and UI

- **Decision**: Use Spectacles Interaction Kit (SIK) for the intro and summary panels and the Stop and Pause controls. Show no map.
- **Rationale**: This keeps content glanceable and safe while you walk. Navigation Kit is deferred along with the map.
- **Source**: https://developers.snap.com/spectacles/spectacles-frameworks/spectacles-navigation-kit/getting-started

## R9: Hardware and cost

- **Finding**: Consumer Specs cost $2,195 and are expected to ship in fall 2026. Developer Program terms are [NEEDS CLARIFICATION].
- **Sources**: https://newsroom.snap.com/introducing-specs-augmented-reality-glasses · https://www.wired.com/story/snaps-new-ar-specs-cost-2195/
