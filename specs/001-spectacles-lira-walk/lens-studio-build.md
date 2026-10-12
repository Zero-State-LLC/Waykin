# Lens Studio build spec: Lira Walks With You

Doc letter **L**. This is an executable checklist. The primary executor is an agent that drives Lens Studio through its MCP server on Danny's Mac. A human can follow the "Human" path for every step.

Steps are numbered `LSB-NNN`. Run them in order. A step is done only when its **Verify** line passes. Every step ends in one of two ways: PASS, or STOP with a filed defect. Do not skip steps and do not reorder them.

This doc uses these labels:

- `(platform knowledge, verify)`: a Lens Studio fact that the provided Snap docs don't state.
- **DECISION (accepted) D-3NN**: a product choice the sources don't settle.
- **NEEDS CLARIFICATION NC-5N**: an unknowable hardware or platform fact, with a safe default.

MCP tool names are not documented in the provided sources. Every step therefore names the *operation* (create object, add component, set property). The agent maps each operation to its MCP tool `(platform knowledge, verify)`.

The authoritative inputs are `spec.md`, `plan.md`, `data-model.md`, and `contracts/core-parity.md`. `presentation-spec.md` and `behavior-spec.md` are produced in parallel. Where they define a value that this doc also sets (placement, copy, timings), **their value wins**. The rule in D-324 covers that case. This doc's values are the defaults when a sibling doc is silent.

---

## 0. Prerequisites

| Id | Item | Value | Source |
|---|---|---|---|
| LSB-001 | Lens Studio | **5.15.4** exactly. 5.15.x is the last series for Spectacles (2024); never use 5.2x, which is for SPECS 27 (NC-05) | https://ar.snap.com/spectacles; location doc minimum is v5.7.0 (https://developers.snap.com/spectacles/about-spectacles-features/apis/location) |
| LSB-002 | Spectacles OS on the test device | **≥ v5.60.000** | same doc |
| LSB-003 | Spectacles Interaction Kit (SIK) | **v0.17.2**. If the Asset Library offers a newer 0.17.x patch, use it and record it in the build receipt (NC-05) | https://developers.snap.com/spectacles/spectacles-frameworks/spectacles-interaction-kit/get-started |
| LSB-004 | Spectacles UI Kit (SUIK) | **v0.1.4**. If the Asset Library offers a newer 0.1.x patch, use it and record it in the build receipt (NC-05) | https://developers.snap.com/spectacles/spectacles-frameworks/spectacles-ui-kit/get-started |
| LSB-005 | Blender (for the Lira glTF export) | 4.x (NC-52) | `ArtSource/Companion/Lira/README.md:20-24` |
| LSB-006 | Node LTS + repo TS core built | `packages/waykin-core-ts` passes `node --test` | `specs/001-spectacles-lira-walk/quickstart.md:24-33` |
| LSB-007 | Device pairing | Paired Snapchat account, location permission on, internet on | location doc "Overview" |

**Verify LSB-001..007:**

- Lens Studio About dialog shows 5.15.4.
- The Spectacles app shows OS ≥ 5.60.000.
- `node --test` exits 0 in `packages/waykin-core-ts`.

Write all three into `docs/design/receipts/LENS_BUILD_<UTC>_<sha>.md`, using the template in §12.

---

## 1. Project creation and settings

**LSB-010 — Create the project.** Use Lens Studio Home → **Spectacles → Base Template** (SIK doc, "Starting a New Spectacles Project"). Save it to `spectacles/WaykinLens/` (`plan.md:78`).
- Verify: `spectacles/WaykinLens/` contains the `.esproj` `(platform knowledge, verify)` and an `Assets/` folder. The Asset Browser lists `SpectaclesInteractionKit`.

**LSB-011 — Platform target.** Set Project Settings → Platform Settings → *Lens Is Made For* = **Spectacles**. Set Preview → *Device Type Override* = **Spectacles** (SIK doc, steps 4–5).
- Verify: the Preview header reads Spectacles.

**LSB-012 — Experimental APIs OFF.** In Project Settings, leave **Allow Experimental API** unchecked (https://developers.snap.com/spectacles/permission-privacy/experimental-apis).
- Verify: the checkbox is unchecked. A capture shows no "Experimental Mode" watermark.

**LSB-013 — Install packages.**
1. Asset Library → Spectacles → **SpectaclesUIKit** → Install (UI Kit doc, "Install the UI Kit Package").
2. Confirm that SIK is installed and that the `SpectaclesInteractionKit` prefab is in the scene (the template adds it).
3. Do **not** instantiate any prefab until the TypeScript Status panel shows compile complete (SIK doc warning).
- Verify: Window → TypeScript Status shows 0 errors. The Asset Browser lists `SpectaclesUIKit.lspkg`.

**LSB-014 — Permissions (declared through modules).**
- Use exactly one sensitive module: `require('LensStudio:RawLocationModule')` in `LocationAdapter.ts` (location doc, "Setup Instructions").
- Do not reference `RemoteServiceModule`, `ConnectedLensModule`, `CameraModule`, `AsrModule`, `MicrophoneAudioProvider`, `BluetoothCentralModule`, or `SupabaseModule`. This matches `spec.md` FR-015. Do not reference `InternetModule` unless the D-301 fallback below is triggered.
- **DECISION D-301:** Do **not** declare an Internet descriptor. Verify in TST-051 and at publish (T073). If GPS fails without Internet, add `InternetModule` and amend D-301. This is a **flagged correction** of the `spec.md` FR-014 wording "RawLocation plus Internet".
  - The location doc requires internet *connectivity* at the system level, but the Lens never performs network I/O.
  - The permission docs list Internet as a module-declared descriptor (`InternetModule` → Internet).
  - A Lens that declares only RawLocation is not an unsupported combination, because the unsupported combination is "Connectivity type + Sensitive Sensor" (Transparent Permission doc).
  - Declaring an unused Internet module would only add a prompt and an LED blink.
- Verify: Project Settings → Spectacles section lists **GPS - Precise** and no other sensitive or connectivity permission (https://developers.snap.com/spectacles/permission-privacy/overview).

**LSB-015 — Camera tracking.** On the template `Camera` object, confirm a **Device Tracking** component with Tracking Mode = **World** (SIK doc, step 3).
- Verify: Inspector → Device Tracking → Mode = World.

---

## 2. Asset preparation (outside Lens Studio) and import

### 2.1 Lira 3D model

**DECISION D-302 — Source rig.** The source is `ArtSource/Companion/Lira/Lira_AR_Base_with_clips.blend`. It is the artist mid-LOD with a 25-bone `LiraArmature` and 6 DCC actions (`ArtSource/Companion/Lira/BUILD_MANIFEST.json:7-13,40-47`, ~5 MB package `:53`).

**LSB-020 — Export the glTF.** In Blender, open the blend file. Use File → Export → glTF 2.0 (.glb) with these settings:

| Setting | Value |
|---|---|
| Format | glTF Binary (`.glb`) |
| Include | Selected = off, Visible = on |
| Transform | +Y Up = **on** |
| Mesh | Apply Modifiers = on, UVs = on, Normals = on, Tangents = off, Vertex Colors = off |
| Material | Export, Images = **JPEG** (albedo), quality 90 |
| Compression | Draco = **on**, level 6 (Lens supports `KHR_draco_mesh_compression` per the glTF import doc) |
| Animation | on. Export all actions as separate clips. NLA strips = on. Sampling = 30 fps |
| Skinning | on. Bone influences = 4 |
| Output | `spectacles/WaykinLens/Assets/Lira/Lira_Spectacles.glb` |

Before you export, apply these prep rules:
- Downscale every image texture to **512×512**. The perf doc recommends "512px x 512px or smaller" (https://developers.snap.com/spectacles/best-practices/performance-optimization/optimizing-lens-performance).
- Decimate meshes to ≤ the triangle budget in NC-53 (default **15,000 tris total**).
- Actions must keep these names exactly: `Lira_Idle`, `Lira_Follow`, `Lira_Investigate`, `Lira_Alert`, `Lira_Celebrate`, `Lira_Spawn` (`BUILD_MANIFEST.json:40-47`). The PRS-005 fallbacks apply to any action that is missing after import. NC-09 is resolved (paid Meshy plan; no credit line, no publish gate).
- Verify:
  - `.glb` size ≤ **4 MB**.
  - Blender Info shows 6 actions exported.
  - The scene's tallest point measures **0.72 m** (`App/AR/Companion/CompanionVisualConfiguration.swift:9`). Scale the armature root if it doesn't.

**LSB-021 — Import into Lens Studio.** Drag the `.glb` into the Asset Browser (not the Hierarchy). Set these import options (glTF import doc):

| Option | Value |
|---|---|
| Use Legacy Importer | off |
| With Materials | **off** (replaced in §4; avoids PBR per the perf doc) |
| Animation Curve Optimization | on |
| Custom animation sampling interval | 30 |
| Import vertex color | off |
| Import tangents | off |
| Import morph targets animation | off |
| Convert meters to centimeters | **on** (glTF meters → Lens Studio centimeters) |
| Regenerate Tangents | off |

- Resulting assets live in folder `Assets/Lira/Lira_Spectacles/`. They contain the prefab `Lira_Spectacles`, a skinned mesh, 6 animation assets named by action, and textures.
- Verify:
  - The Logger shows no import error.
  - The Asset Browser shows 6 animation assets.
  - The prefab bounds height is **72 cm ± 2 cm** (Inspector → mesh bounds, `(platform knowledge, verify)`).

**LSB-022 — Rename the prefab.** Rename `Lira_Spectacles` to **`Prefab_LiraModel`**.
- Verify: the Asset Browser shows `Assets/Lira/Lira_Spectacles/Prefab_LiraModel.prefab`.

### 2.2 Audio

**LSB-023 — Copy WAVs.** Copy these files from `App/Resources/Audio/` into `spectacles/WaykinLens/Assets/Audio/`, unchanged, with formats per D-218 and the PRS-104 manifest (`App/Resources/Audio/README.md:7-10`; the perf doc prefers WAV over mp3):

`companion_near.wav, companion_ahead.wav, distant_presence.wav, pursuit_pressure.wav, pursuit_release.wav, bond_motif.wav, quiet_shift.wav, lira_spawn_theme.wav, lira_bond_milestone.wav`

**DECISION D-303:** Exclude `lira_launch_theme.wav` (9.0 s, the largest file, `App/Resources/Audio/README.md:26`) and `lira_companion_reveal.wav`. The Lens has no onboarding-reveal or cold-launch theme moment, which keeps the Lens small.

- Verify: the Asset Browser lists 9 Audio Track assets with the same basenames.

### 2.3 UI textures

**LSB-024 — Glyph.** Copy `App/Resources/Assets.xcassets/LiraGlyph/Lira_Glyph_Dawn.imageset/Lira_Glyph_Dawn.png` to `Assets/UI/Lira_Glyph_Dawn.png`. Downscale it to 256×256.
- Verify: Inspector shows 256×256.

**LSB-025 — Lens icon and preview.** Create `Assets/Publish/Icon.png` (512×512, from the glyph) and `Assets/Publish/Preview_3x4.png` (1080×1440). The publish doc requires a custom icon and a 3:4 preview, and says to avoid text, keep the background simple, use bright colors, and remember that black appears transparent.
- Verify: both files exist with those exact dimensions.

---

## 3. Script files (TypeScript)

**LSB-030 — Sync the core.** Run `scripts/sync_core_ts.sh` (`plan.md:84`). It copies `packages/waykin-core-ts/src/*.ts` into `spectacles/WaykinLens/Assets/Scripts/core/`. Never edit files in `core/`.
- Verify:
  - `scripts/sync_core_ts.sh --check` exits 0.
  - TypeScript Status shows 0 errors.

### 3.1 Consumed core boundary

The core module is `Assets/Scripts/core/index.ts`. Lens scripts import only from `./core/index`. The names below mirror Swift `WaykinCore`, which is the source of truth (`contracts/core-parity.md:3-7`). The porting worker owns the exact signatures. If a name differs, this doc's adapter code changes; the core never changes for the Lens.

| Export (mirrors Swift) | Swift source | Used by |
|---|---|---|
| `MovementEngine` (`startSession`, `pauseSession`, `resumeSession`, `endSession`, `ingestRealLocationSample`, `simulate`, `currentSession`) | `Sources/WaykinCore/Engines/MovementEngine.swift:42-204` | SessionController |
| `LocationSample` | `Sources/WaykinCore/Location/MovementIntegrity.swift:43-66` | LocationAdapter |
| `CompanionWalkExperience` (`start`, `update`, `finish`) | `Sources/WaykinCore/Experiences/Experiences.swift:4-197` | SessionController |
| `CompanionRuntime` (`apply(command)`, `apply(event)`, `state`, `relativeDistance`) | `Sources/WaykinCore/Engines/CompanionRuntime.swift:7-30` | SessionController, LiraController |
| `CompanionPresentationMatrix.arBehaviorString` | `Sources/WaykinCore/Engines/CompanionPresentationMatrix.swift:43-90` | LiraController, AudioAdapter |
| `AudioExperienceLayer` (`map`, `cueForARPresentationTransition`, `momentCue`) | `Sources/WaykinCore/Engines/AudioExperienceLayer.swift:15-260` | SessionController |
| `PathProgressEngine` / `PathAudioCoupling` | `Sources/WaykinCore/Path/*.swift` | SessionController |
| `DemoSessionController` | `Sources/WaykinCore/Engines/DemoSessionController.swift:5-187` | DemoDriver |
| `WalkPathCopy` | `Sources/WaykinCore/Path/WalkPathCopy.swift:5-65` | SummaryPanel |
| `CanonicalCompanionIdentity.defaultCompanion` (bond 12) | `Sources/WaykinCore/Persistence/PersistenceStore.swift:37-51` | StorageAdapter |

### 3.2 Lens script files

All files live under `spectacles/WaykinLens/Assets/Scripts/`. Each is a `@component export class <Name> extends BaseScriptComponent`, as in the SIK and location doc examples.

| Path | Class | Responsibility | `@input` declarations |
|---|---|---|---|
| `SessionController.ts` | `SessionController` | Owns the lifecycle state machine (§7). Runs the tick loop: movement → experience → runtime → audio → presentation. Owns the seed. The only writer to Storage. | `liraController: LiraController`, `audioAdapter: AudioAdapter`, `locationAdapter: LocationAdapter`, `storageAdapter: StorageAdapter`, `receiptAdapter: ReceiptAdapter`, `demoDriver: DemoDriver`, `introPanel: IntroPanel`, `permissionsPanel: PermissionsPanel`, `safetyPanel: SafetyPanel`, `hudPanel: HudPanel`, `summaryPanel: SummaryPanel`, `memoriesPanel: MemoriesPanel`, `recoveryPanel: RecoveryPanel`, `errorPanel: ErrorPanel`, `debugPanel: DebugPanel`, `versionLabel: Text` |
| `adapters/LocationAdapter.ts` | `LocationAdapter` | `require('LensStudio:RawLocationModule')`. Calls `GeoLocation.createLocationService()` with accuracy `GeoLocationAccuracy.Navigation`. Polls `getCurrentPosition` every 1.0 s through `DelayedCallbackEvent.reset(1.0)` (location doc example). Drops duplicate timestamps. Emits `LocationSample` with `horizontalAccuracy` and `reportedSpeedMetersPerSecond = NaN` (unknown; the core falls back to distance/time per `MovementIntegrity.swift:186-194`). Counts consecutive errors. **Never** reads heading. | none |
| `adapters/AudioAdapter.ts` | `AudioAdapter` | Ports the App planner `AudioCuePlaybackPlanner` and the catalog (`App/AppAudioCuePlayer.swift:31-115`): three channels, priority, duplicate suppression, pause. Volume = `catalogVolume × max(0.25, intensity)` (`:352`). Uses spatial audio per D-209; if the spatial AudioComponent setting is unavailable (verify in T047/T050), falls back to non-spatial D-306 and logs it in the build receipt. | `foreground: AudioComponent`, `ambient: AudioComponent`, `moment: AudioComponent`, 9 tracks (`trackCompanionNear: AudioTrackAsset`, `trackCompanionAhead`, `trackDistantPresence`, `trackPursuitPressure`, `trackPursuitRelease`, `trackBondMotif`, `trackQuietShift`, `trackSpawnTheme`, `trackBondMilestone`) |
| `adapters/StorageAdapter.ts` | `StorageAdapter` | `global.persistentStorageSystem.store`. Keys are listed in §6. Handles `onStoreFull` (persistent storage doc). | none |
| `adapters/ReceiptAdapter.ts` | `ReceiptAdapter` | Builds the privacy-filtered receipt (counts and labels only, no coordinates; `ARCHITECTURE.md:94`). Prints it once to the Logger at session end as one line prefixed `WAYKIN_RECEIPT ` (D-310). | none |
| `presentation/LiraController.ts` | `LiraController` | Places and animates Lira (§5.2). Maps the AR behavior string to a clip. Runs the spawn coalesce. | `cameraObject: SceneObject`, `liraAnchor: SceneObject`, `liraModel: SceneObject`, `liraFallback: SceneObject`, `animationPlayer: AnimationPlayer` `(platform knowledge, verify component type name)` |
| `presentation/PresencePhrase.ts` | (module, no class) | A line-for-line port of `CompanionPresencePresentation.phrase` and `elapsedText` and `distanceText` (`App/CompanionPresenceView.swift:24-69,119-124`). It is pure, which makes it an App-copy port, not core. | n/a |
| `presentation/IntroPanel.ts` | `IntroPanel` | Shows the PRS-070 Intro step. Calls `SessionController.showPermissions()`. | `root: SceneObject`, `title: Text`, `introText: Text`, `understandButton: RectangleButton` |
| `presentation/PermissionsPanel.ts` | `PermissionsPanel` | Shows the PRS-070 Permissions step. Calls `SessionController.showSafety()`. | `root: SceneObject`, `title: Text`, `bodyText: Text`, `continueButton: RectangleButton` |
| `presentation/SafetyPanel.ts` | `SafetyPanel` | Shows the PRS-070 Safety step with the 5 bullets. Calls `SessionController.beginWalk()` and `beginDemo()`. | `root: SceneObject`, `title: Text`, `safetyText: Text`, `beginButton: RectangleButton`, `demoButton: RectangleButton` |
| `presentation/HudPanel.ts` | `HudPanel` | Peripheral walk HUD: 3 lines, no chip (PRS-056); phrase, prompt, metrics, Pause/Resume, End. Follows PRS-056 with D-212 follow. | `root: SceneObject`, `cameraObject: SceneObject`, `phraseText: Text`, `promptText: Text`, `metricsText: Text`, `pauseButton: RectangleButton`, `pauseLabel: Text`, `endButton: RectangleButton` |
| `presentation/SummaryPanel.ts` | `SummaryPanel` | Shows the end-of-walk card per PRS-058. Done → idle. | `root: SceneObject`, `titleText: Text`, `bondText: Text`, `metricsText: Text`, `memoryText: Text`, `doneButton: RectangleButton` |
| `presentation/MemoriesPanel.ts` | `MemoriesPanel` | Shows memories and replays from Memories per PRS-073. | `root: SceneObject`, `listText: Text`, `replayButton: RectangleButton`, `closeButton: RectangleButton` |
| `presentation/RecoveryPanel.ts` | `RecoveryPanel` | Offers recovery at ≤ 24 h (D-108, BEH-042). | `root: SceneObject`, `messageText: Text`, `resumeButton: RectangleButton`, `discardButton: RectangleButton` |
| `presentation/ErrorPanel.ts` | `ErrorPanel` | Shows ERR-GPS-02 with "Try again" and "Demo Walk" (D-110). | `root: SceneObject`, `messageText: Text`, `tryAgainButton: RectangleButton`, `demoButton: RectangleButton` |
| `presentation/DebugPanel.ts` | `DebugPanel` | Debug panel (D-055). | `root: SceneObject`, `debugText: Text`, `closeButton: RectangleButton` |
| `demo/DemoDriver.ts` | `DemoDriver` | Wraps `DemoSessionController`. Advances one tick every **5.0 s** of real time (D-104); ends at 40 s. Logs the RNG self-test. | none |

`RectangleButton` is imported from `'SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton'`. Subscribe with `onTriggerUp.add(...)` (UI Kit Button doc, "Code Example").

- **LSB-031:** Create every file above with its class skeleton and its `@input` list exactly as shown.
  - Verify: TypeScript Status shows 0 errors. Each file appears in Add Component → Script lists.
- **LSB-032:** Run the isolation check: `node packages/waykin-core-ts/scripts/check-isolation.mjs` (`contracts/core-parity.md:47`).
  - Verify: exit 0.

---

## 4. Materials

Lens Studio "Unlit" material graph `(platform knowledge, verify name)`. There is no PBR (perf doc).

| Id | Material asset | Base | Color / texture | Blend | Used on |
|---|---|---|---|---|---|
| LSB-040 | `Mat_Lira_Body_Dawn` | Unlit | Imported albedo (512²) × tint `#E8D9C4` (`App/AR/Companion/CompanionEntityFactory.swift:44`) | Normal | Lira body meshes |
| LSB-041 | `Mat_Lira_Core` | Unlit | `#D4A45A` (`:47`), no texture | Additive | CoreGlow node mesh |
| LSB-042 | `Mat_Lira_Filament` | Unlit | `#7A9E99` (`:48`), alpha 0.9 | Normal | Filament segments |
| LSB-043 | `Mat_Fallback` | Unlit | `#E8D9C4` | Normal | LiraFallback sphere |

**DECISION D-304:** The MVP ships the **Dawn** skin only. `LiraSkin` has three skins (`App/Theme/LiraSkin.swift:6-9`), but Veil uses a dark body `#2A2E38`. On the additive display, near-black reads as transparent (publish doc: "black appears transparent").

- Verify: assign `Mat_Lira_Body_Dawn` to every MeshVisual under `Prefab_LiraModel` (LSB-044). Preview Inspector then shows no material named `*PBR*` in the prefab.

UI panels use the SUIK default styles. Set the panel background color to `#1E2430`, alpha 0.85 (Night surface, `App/Theme/WKTokens.swift:46`), primary text to `#E6EAF0` (`:48`), and accent to `#4A9E98` (`:54`).

---

## 5. Scene graph

### 5.1 Tree

Units are cm. "pos" is the local position. Every object's rotation is (0,0,0) and scale (1,1,1) unless stated. "on" means enabled at start.

```
Camera                                   on  [Camera, DeviceTracking(World)]        (template)
SpectaclesInteractionKit                 on  [prefab from SIK]                      (template)
WaykinRoot                               on  pos(0,0,0)  [SessionController]
├─ Adapters                              on
│  ├─ LocationAdapter                    on  [LocationAdapter]
│  ├─ StorageAdapter                     on  [StorageAdapter]
│  ├─ ReceiptAdapter                     on  [ReceiptAdapter]
│  ├─ DemoDriver                         on  [DemoDriver]
│  └─ AudioAdapter                       on  [AudioAdapter]
│     ├─ Audio_Foreground                on  [AudioComponent  track=none volume=1 loops=0]
│     ├─ Audio_Ambient                   on  [AudioComponent  track=none volume=1 loops=0]
│     └─ Audio_Moment                    on  [AudioComponent  track=none volume=1 loops=0]
├─ LiraAnchor                            off pos(0,-145,-180)  [LiraController]
│  ├─ LiraModel                          on  [instance of Prefab_LiraModel; AnimationPlayer]
│  └─ LiraFallback                       off [RenderMeshVisual sphere r=12, Mat_Fallback]
└─ UI
   ├─ IntroPanel                         on  pos(0,-5,-110)  [IntroPanel]
   │  ├─ Intro_Title                     on  pos(0,9,0)   [Text "Lira Walks With You" size 48]
   │  ├─ Intro_Glyph                     on  pos(0,3,0)   [Image Lira_Glyph_Dawn 6x6]
   │  ├─ Intro_Text                      on  pos(0,-1.5,0)[Text size 24]
   │  └─ Btn_Understand                  on  pos(0,-6,0)  [RectangleButton size(6,4,1) style=Primary]
   │     └─ Label                        on  [Text "I understand" size 24]
   ├─ PermissionsPanel                   off pos(0,-5,-110)  [PermissionsPanel]
   │  ├─ Perm_Title                      on  pos(0,8,0)   [Text size 40]
   │  ├─ Perm_Body                       on  pos(0,0,0)   [Text size 24 wrap 30]
   │  └─ Btn_PermContinue                on  pos(0,-8,0)  [RectangleButton size(6,4,1) style=Primary]
   │     └─ Label                        on  [Text "Continue" size 24]
   ├─ SafetyPanel                        off pos(0,-5,-110)  [SafetyPanel]
   │  ├─ Safety_Title                    on  pos(0,9,0)   [Text size 40]
   │  ├─ Safety_Body                     on  pos(0,0,0)   [Text size 24 wrap 30]
   │  ├─ Btn_BeginWalk                   on  pos(0,-8,0)  [RectangleButton size(6,4,1) style=Primary]
   │  │  └─ Label                        on  [Text "Begin Walk" size 24]
   │  └─ Btn_DemoWalk                    on  pos(0,-13,0) [RectangleButton size(6,4,1) style=Secondary]
   │     └─ Label                        on  [Text "Demo Walk" size 24]
   ├─ HudPanel                           off pos(0,-30,-110) rot(-11,-8,0) [HudPanel]
   │  ├─ Hud_Phrase                      on  pos(0,4,0)   [Text size 24]
   │  ├─ Hud_Prompt                      on  pos(0,1,0)   [Text size 20]
   │  ├─ Hud_Metrics                     on  pos(0,-2,0)  [Text size 20]
   │  ├─ Btn_Pause                       on  pos(-4,-6,0) [RectangleButton size(6,4,1) style=Secondary]
   │  │  └─ Label                        on  [Text "Pause" size 24]
   │  └─ Btn_End                         on  pos(4,-6,0)  [RectangleButton size(6,4,1) style=Secondary]
   │     └─ Label                        on  [Text "End" size 24]
   ├─ SummaryPanel                       off pos(0,-5,-110) [SummaryPanel]
   │  ├─ Sum_Title                       on  pos(0,10,0)  [Text "Session Summary" size 40]
   │  ├─ Sum_Bond                        on  pos(0,5,0)   [Text size 32 color #D4A45A]
   │  ├─ Sum_Metrics                     on  pos(0,1,0)   [Text size 26]
   │  ├─ Sum_Memory                      on  pos(0,-4,0)  [Text size 22 wrap width 30]
   │  └─ Btn_Done                        on  pos(0,-11,0) [RectangleButton size(6,4,1) style=Primary]
   │     └─ Label                        on  [Text "Done" size 24]
   ├─ MemoriesPanel                      off pos(0,-5,-110) [MemoriesPanel]
   │  ├─ Mem_Title                       on  pos(0,8,0)   [Text size 40]
   │  ├─ Mem_List                        on  pos(0,0,0)   [Text size 24 wrap 30]
   │  ├─ Btn_Replay                      on  pos(-4,-8,0) [RectangleButton size(6,4,1) style=Primary]
   │  │  └─ Label                        on  [Text "Replay" size 24]
   │  └─ Btn_MemClose                    on  pos(4,-8,0)  [RectangleButton size(6,4,1) style=Secondary]
   │     └─ Label                        on  [Text "Close" size 24]
   ├─ RecoveryPanel                      off pos(0,-5,-110) [RecoveryPanel]
   │  ├─ Rec_Title                       on  pos(0,8,0)   [Text size 40]
   │  ├─ Rec_Message                     on  pos(0,0,0)   [Text size 24 wrap 30]
   │  ├─ Btn_Resume                      on  pos(-4,-8,0) [RectangleButton size(6,4,1) style=Primary]
   │  │  └─ Label                        on  [Text "Resume" size 24]
   │  └─ Btn_Discard                     on  pos(4,-8,0)  [RectangleButton size(6,4,1) style=Secondary]
   │     └─ Label                        on  [Text "Discard" size 24]
   ├─ ErrorPanel                         off pos(0,-5,-100) [ErrorPanel]
   │  ├─ Error_Text                      on  pos(0,4,0)   [Text size 24 wrap 30, color #E0B040]
   │  ├─ Btn_TryAgain                    on  pos(-4,-3,0) [RectangleButton size(6,4,1) style=Secondary]
   │  │  └─ Label                        on  [Text "Try again" size 24]
   │  └─ Btn_ErrorDemo                   on  pos(4,-3,0)  [RectangleButton size(6,4,1) style=Primary]
   │     └─ Label                        on  [Text "Demo Walk" size 24]
   ├─ DebugPanel                         off pos(0,-5,-110) [DebugPanel]
   │  ├─ Debug_Text                      on  pos(0,0,0)   [Text size 24]
   │  └─ Btn_DebugClose                  on  pos(0,-8,0)  [RectangleButton size(6,4,1) style=Secondary]
   │     └─ Label                        on  [Text "Close" size 24]
   └─ VersionLabel                       on  pos(0,-16,-110) [Text "v0.1.0" size 16 color #9AA3B0]
```

Rationale for the panel distance: the panels sit at z = −110 cm because the displays reach full binocular overlap at 1.1 m, and the visible area there is ~53×77 cm (https://developers.snap.com/spectacles/best-practices/design-for-spectacles/introduction-to-spatial-design). All panels fit inside a 34 × 24 cm box. Panels use pitch −5°, except HudPanel, which uses PRS-056 rot(-11,-8,0). **DECISION D-305.**

All SUIK buttons use these settings: Has Shadow = off, Toggleable = off, Play Audio = **on**, Add Callbacks = off (the script subscribes instead).

**Input wiring (LSB-050):**

| Component on | Input | → Target |
|---|---|---|
| WaykinRoot.SessionController | liraController | LiraAnchor.LiraController |
| | audioAdapter | Adapters/AudioAdapter.AudioAdapter |
| | locationAdapter | Adapters/LocationAdapter |
| | storageAdapter | Adapters/StorageAdapter |
| | receiptAdapter | Adapters/ReceiptAdapter |
| | demoDriver | Adapters/DemoDriver |
| | introPanel / permissionsPanel / safetyPanel / hudPanel / summaryPanel / memoriesPanel / recoveryPanel / errorPanel / debugPanel | UI/IntroPanel, UI/PermissionsPanel, UI/SafetyPanel, UI/HudPanel, UI/SummaryPanel, UI/MemoriesPanel, UI/RecoveryPanel, UI/ErrorPanel, UI/DebugPanel |
| | versionLabel | UI/VersionLabel.Text |
| AudioAdapter | foreground / ambient / moment | Audio_Foreground / Audio_Ambient / Audio_Moment |
| | track* (9) | `Assets/Audio/<basename>.wav` matching name |
| LiraController | cameraObject | Camera |
| | liraAnchor / liraModel / liraFallback | LiraAnchor / LiraModel / LiraFallback |
| | animationPlayer | LiraModel.AnimationPlayer |
| IntroPanel | root, title, introText, understandButton | IntroPanel, Intro_Title, Intro_Text, Btn_Understand |
| PermissionsPanel | root, title, bodyText, continueButton | PermissionsPanel, Perm_Title, Perm_Body, Btn_PermContinue |
| SafetyPanel | root, title, safetyText, beginButton, demoButton | SafetyPanel, Safety_Title, Safety_Body, Btn_BeginWalk, Btn_DemoWalk |
| HudPanel | root, cameraObject, phraseText, promptText, metricsText, pauseButton, pauseLabel, endButton | HudPanel, Camera, Hud_Phrase, Hud_Prompt, Hud_Metrics, Btn_Pause, Btn_Pause/Label, Btn_End |
| SummaryPanel | root, titleText, bondText, metricsText, memoryText, doneButton | SummaryPanel, Sum_Title, Sum_Bond, Sum_Metrics, Sum_Memory, Btn_Done |
| MemoriesPanel | root, listText, replayButton, closeButton | MemoriesPanel, Mem_List, Btn_Replay, Btn_MemClose |
| RecoveryPanel | root, messageText, resumeButton, discardButton | RecoveryPanel, Rec_Message, Btn_Resume, Btn_Discard |
| ErrorPanel | root, messageText, tryAgainButton, demoButton | ErrorPanel, Error_Text, Btn_TryAgain, Btn_ErrorDemo |
| DebugPanel | root, debugText, closeButton | DebugPanel, Debug_Text, Btn_DebugClose |

- Verify: with WaykinRoot selected, the Inspector shows no empty input field. On Preview start, the Logger shows no "undefined input" errors.

### 5.2 Lira placement and animation (LiraController)

This section uses Lens Studio cm units and the Camera world transform. presentation-spec overrides them per D-324.

- **Ground height:** hit test if available, else `anchor.y = camera.y − 145` (head y − 1.45 m; `App/AR/ARPlacementResolver.swift:136`).
- **Target position** = `camera.flatPos + flatForward × fwd + flatRight × side`. `fwd` comes from the D-202/D-203 band table (1.3/1.6/2.0/3.0 m); `side` = +60 cm on Lira's current side (default right). The "lead" behavior also uses the band distance.
- **Motion:** Move toward the target at speed `min(500, max(135, walkerSpeed×1.35))` cm/s (`:414-419`). Stop when within **45 cm** (`:432`). Yaw faces the direction of travel. When stopped, yaw faces the camera.
- **Clip map:** the behavior string comes from `arBehaviorString`, then the clip plays. Loops use `repeat`. The one-shot clips are Celebrate and Spawn.

| AR string | Clip | Loop |
|---|---|---|
| idle | Lira_Idle | yes |
| follow | Lira_Follow | yes |
| investigate | Lira_Investigate | yes |
| alert | Lira_Alert | yes |
| celebrate | Lira_Celebrate | no. After 1.5 s, revert to Lira_Idle (`App/AR/Companion/CompanionPresentationState.swift:39`) |
| unknown | Lira_Idle | yes (`:109-120`) |

- **Spawn:** On session start, enable LiraAnchor, play `Lira_Spawn` once, and scale from 0.92 to 1.0 over **700 ms** with ease-out. The scale factor follows `0.92 + 0.08·(1−(1−p)^3)` (`App/AR/Companion/LiraARMotion.swift:210-223`).
- **Fallback:** If `Prefab_LiraModel` failed to instantiate or `animationPlayer` is null, set LiraModel off and LiraFallback on.
- **Degrade (PRS-093):** loop clips off (static pose), hunter echo hidden, HUD lazy-follow frozen, audio kept (§8).

### 5.3 HUD follow

HUD placement follows PRS-056: 1.1 m, −8° yaw, −11° pitch, 18×10 cm. Follow uses D-212. It is never full-screen (FR-011).

---

## 6. Persistence (StorageAdapter)

The API is `global.persistentStorageSystem.store` with `getInt`/`putInt` and `onStoreFull` (https://developers.snap.com/lens-studio/features/persistent-cloud-storage/persistent-storage). The doc defers to the GeneralDataStore API for the full type list, so `getString`/`putString` are `(platform knowledge, verify)`. Use D-112.

| Key | Type | Default | Written when |
|---|---|---|---|
| `waykin.profile.v1` | string (JSON) | `{}` | first launch, session end, setting change |
| `profile.bondLevel` | int | **12** (`PersistenceStore.swift:41`) | session end |
| `profile.memories` | array (max **5**, newest first; `data-model.md:138`) | `[]` | session end |
| `profile.onboardingDone` | bool | false | onboarding complete |
| `profile.reduceMotion` | bool | false | Reduce Motion setting change |
| `waykin.receipt.last.v1` | string | none | session end |

- Memory JSON element: `{"endedAtSec":number,"activeTime":number,"distance":number,"eventKinds":[string],"bondDelta":int,"line":string}`. It contains **no coordinates**.
- On a write failure: (1) delete `waykin.receipt.last.v1` and retry; (2) drop the oldest memory and retry; (3) show ERR-PERSIST-04. Never call `clear()`.
- **Seed (GAP-CONST-04):** 42 for every walk (iOS parity; the vectors are authoritative). Logged at start as `WAYKIN_SEED 42`. Demo always uses the core Demo scenario (no seed dependence; `DemoSessionController.swift:34-43`).

---

## 7. Session state machine (SessionController)

The states are `idle → intro → permissions → safety → (demo | walk) active ⇄ paused → ending → summary → idle` (`data-model.md:155`). Stop is legal from every non-idle state.

| From | Trigger | To | Actions |
|---|---|---|---|
| boot | OnStart | intro | Load storage. If a checkpoint exists, show RecoveryPanel at ≤ 24 h, else silent finalize (D-108). Print `Lens Opened: v0.1.0` (publish checklist). Show IntroPanel. |
| intro | Btn_Understand | permissions | Show PermissionsPanel (PRS-070). |
| permissions | Btn_PermContinue | safety | Show SafetyPanel (PRS-070). |
| safety | Btn_BeginWalk | walk-acquiring | Start LocationAdapter. Start a 30 s first-fix timer (D-110). |
| safety | Btn_DemoWalk | demo-active | Start DemoDriver. Lira spawns. No spawn theme (iOS parity, `App/WaykinApp.swift:643-645`). |
| walk-acquiring | first accepted sample | walk-active | Call `MovementEngine.startSession` + `resumeSession`, then `CompanionWalkExperience.start`. Lira spawns and `spawnTheme` plays. HUD shows. |
| walk-acquiring | timeout or 3 consecutive errors | error | Show ErrorPanel with ERR-GPS-02 "No GPS fix yet. Try outside, or start Demo Walk." and buttons "Try again" and "Demo Walk". |
| *-active | Btn_Pause | paused | `pauseSession`. Audio pauses. Label → "Resume" (`App/AR/CanonicalARSessionView.swift:339`). |
| paused | Btn_Pause | *-active | `resumeSession`. Label → "Pause" (`:349`). |
| active/paused | Btn_End | ending | `endSession`, then `finish`, then bond update and storage write. Audio stops. Lira off. |
| walk-active | 3 consecutive location errors (15 s) | active (degraded) | HUD line 2 shows ERR-GPS-03. No auto-pause (D-111). |
| walk-active | lost location for 120 s | ending (reason locationLost) | Summary (D-111). |
| active | degrade trigger per D-116 | active (degraded) | PRS-093: loop clips off (static pose), hunter echo hidden, HUD lazy-follow frozen, audio kept. |
| ending | done | summary | Fill SummaryPanel. If `bondDelta > 0`, `bondMilestone` plays. |
| summary | Btn_Done | intro | |
| summary | Btn_Replay | memories | Show MemoriesPanel; replay from Memories (PRS-073). |

Bond delta rules: userStop always gives `+1`; non-user ends follow D-109 (≥ 60 s). Demo uses `result.bondDelta` (`:817`). Behavior-spec overrides this per D-324.

At 15:00 and 20:00 of active time, HUD line 2 shows the BEH-031 copy for 4000 ms (D-107; rendered per D-216). At 30:00 the walk auto-ends and leads to the summary.

Onboarding copy follows PRS-070 verbatim.

Summary copy per PRS-058 (`3017-3022`), with the `Done` button.
- Bond: `Bond +N` / `Bond N` / `Bond held`.
- Metrics: `M:SS · N m` (`:3024-3034`).
- Memory: `memoryText` with the `WalkPathCopy` suffix applied.

HUD metrics use the same `M:SS · N m` format through `PresencePhrase.elapsedText/distanceText`.

---

## 8. Performance guardrails

- Targets: 60 FPS and power < 100% (Lens Performance Overlay doc).
- **Degrade trigger (D-116):** enter at a 10 s rolling mean frame delta > **20 ms**; exit at < **17 ms** for 30 s; end with reason `power` after 180 s continuous. The provided docs expose no thermal or power API to scripts. The effect follows **PRS-093**: loop clips off (static pose), hunter echo hidden, HUD lazy-follow frozen, audio kept.
- Simultaneous sounds ≤ 3 (one per channel; perf doc "limit the number of simultaneous sounds").
- Draw calls ≤ 20; bones ≤ 25 (the `.blend` rig).
- AudioComponent `playbackMode` = `Audio.PlaybackMode.LowPower` on all three channels, set in `AudioAdapter.onAwake`. Spectacles defaults to LowPower, and the cues tolerate latency (https://developers.snap.com/spectacles/about-spectacles-features/audio). Button feedback uses the SUIK built-in audio. Spatial audio follows D-209; if the spatial AudioComponent setting is unavailable (verify in T047/T050), fall back to non-spatial D-306 and log it in the build receipt.

---

## 9. Build order

| Step | Action | Verify |
|---|---|---|
| LSB-060 | §1 complete | All §1 verify lines PASS |
| LSB-061 | §2 assets imported | 1 prefab, 6 anims, 9 audio tracks, 1 glyph |
| LSB-062 | LSB-030..032 scripts | TypeScript Status 0 errors; isolation exit 0 |
| LSB-063 | Build tree §5.1 (top-down creation order) | Hierarchy names match §5.1 character-for-character (agent: dump the hierarchy and diff it against §5.1) |
| LSB-064 | Materials LSB-040..044 | No PBR material in the scene |
| LSB-065 | Wiring LSB-050 | No empty inputs |
| LSB-066 | Enabled states per §5.1 | LiraAnchor, HudPanel, SummaryPanel, MemoriesPanel, RecoveryPanel, ErrorPanel, DebugPanel off at start |
| LSB-067 | Save; size check | Project Info Lens size ≤ **15 MB** (D-314; hard cap 25 MB per the publish doc) |

---

## 10. Preview tests (Lens Studio, Spectacles device override)

| Step | Test | Pass |
|---|---|---|
| LSB-070 | Launch | Logger: `Lens Opened: v0.1.0` and `WAYKIN_SEED`. IntroPanel visible at 1.1 m, −5° pitch. |
| LSB-071 | RNG self-test | DemoDriver logs the first 4 `next()` values for seed 42. They equal `rngStream[0..3]` in the reference vector under `Tests/Vectors/seed-event/` (`quickstart.md:48`). |
| LSB-072 | Demo Walk | Logger event order: `companionObserves, companionDrawsNear, distantPresence, pursuitBegins, pursuitIntensifies, pursuitFades, bondMoment` (`DemoSessionController.swift:6-14`), one every 5 s; end at 40 s. Each logged cue matches `AudioExperienceLayer.map` (`AudioExperienceLayer.swift:110-127`). |
| LSB-073 | Pause mid-demo | Ticks stop. Label shows "Resume". After resume, no event is duplicated (`Tests/WaykinCoreTests/DemoAndPhysicsTests.swift:74-89`). |
| LSB-074 | End | SummaryPanel shows "Session Summary", a Bond line, metrics, and memory. Done returns to intro. |
| LSB-075 | Persistence | Preview `... → Print Persistent Storage` shows `waykin.profile.v1` (storage doc). Restart Preview and the Bond value is unchanged. |
| LSB-076 | Six demos | memories in `waykin.profile.v1` length = 5. |
| LSB-077 | Begin Walk in Preview | No fix arrives, so after 30 s the ERR-GPS-02 copy from §7 appears. Btn_ErrorDemo starts the demo. |
| LSB-078 | Clear storage | Preview `... → Clear Persistent Storage`. Restart and Bond = 12. |

## 11. On-device tests

1. Push the Lens to the device through Lens Studio device push `(platform knowledge, verify)`.
2. Enable the Lens Performance Overlay in the Spectacles app → Developer Settings (overlay doc).
3. Run the device protocol in `quickstart.md:52-61`.

| Step | Test | Pass |
|---|---|---|
| LSB-080 | Indoor demo | FPS ≥ 58 sustained 2 min. CPU/GPU < 100%. |
| LSB-081 | Outdoor 15 min walk | Record FPS, CPU%, and GPU% at 0, 5, 10, and 15 min. No thermal standby. |
| LSB-082 | Stop reachability | Btn_End works within 1 pinch from active and from paused (SC-007). |
| LSB-083 | Relaunch × 3 | Bond and memories unchanged (SC-006). |
| LSB-084 | Location off | ErrorPanel shows. Demo works. |

Every device row stays `NOT_COMPUTABLE` until you observe it (`WAYKIN_SPEC.md:39`).

## 12. Publish checklist

Source for every row: https://developers.snap.com/spectacles/get-started/start-building/publishing-lens

| Step | Requirement | Check |
|---|---|---|
| LSB-090 | ≤ 25 MB | Project Info size |
| LSB-091 | 60 FPS, performant | LSB-080/081 receipts |
| LSB-092 | No experimental API | LSB-012 |
| LSB-093 | Version visible + logged | VersionLabel + `Lens Opened: v0.1.0` |
| LSB-094 | Custom icon + 3:4 preview | LSB-025 assets set in the publish dialog |
| LSB-095 | Defined objective / onboarding | PRS-070 Intro/Permissions/Safety |
| LSB-096 | Permissions publishable | Only GPS - Precise (LSB-014); verified in TST-051 and T073 |
| LSB-097 | Capturable | One capture taken; Lira visible in the capture |
| LSB-098 | Metadata | Description: "Walk with Lira, a companion who reacts to how you move." Release notes listing version and changes. Test steps = §10/§11 IDs. |
| LSB-099 | Submit | Moderation review takes 2–3 business days |

Receipt template (`docs/design/receipts/LENS_BUILD_<UTC>_<sha>.md`): YAML fields `git_sha`, `lens_studio_version`, `sik_version`, `suik_version`, `device_os`, `lens_size_mb`, `evidence_class`. Then a pass or fail line for each LSB-0NN.

---

## Appendix A: gaps closed

| Id | Gap | Resolution | Citation |
|---|---|---|---|
| GAP-L-CONST-01 | No Lens Studio minimum version | Source | 5.15.4 pin (NC-05, https://ar.snap.com/spectacles) |
| GAP-L-PUB-01 | Permission set ambiguous (FR-014 "plus Internet") | DECISION D-301 (verify TST-051/T073) | permission overview + Transparent Permission docs |
| GAP-L-ASSET-01 | Lira source rig and size | DECISION D-302 | glTF import doc; `BUILD_MANIFEST.json:40-53` |
| GAP-L-ASSET-02 | Import settings unspecified | Source + platform | glTF import doc |
| GAP-L-ASSET-03 | Texture size unspecified | Source | perf doc (≤ 512 px) |
| GAP-L-ASSET-04 | Poly budget unknown | NC-53 | `tasks.md:37` |
| GAP-L-AUDIO-01 | Which WAVs ship | DECISION D-303 | `App/Resources/Audio/README.md` |
| GAP-L-AUDIO-02 | Channel/volume model | Source port | `App/AppAudioCuePlayer.swift:13-115,352` |
| GAP-L-AUDIO-03 | Playback mode | Source | Spectacles audio doc |
| GAP-L-LIRA-01 | Skin set | DECISION D-304 | publish doc (black transparent) |
| GAP-L-LIRA-02 | Placement constants | D-202/D-203 | `ARPlacementResolver.swift:136` |
| GAP-L-LIRA-03 | Clip mapping | Source | `CompanionPresentationState.swift:39,109-120`; manifest clips |
| GAP-L-UI-01 | Panel distance/size | DECISION D-305 (1.1 m, −5° pitch) | spatial design doc |
| GAP-L-UI-02 | HUD follow behavior | DECISION D-212 / PRS-056 | FR-011 |
| GAP-L-UI-03 | Copy strings | Source reuse + D-107/D-216 | `WaykinApp.swift:958,1413,2896,3017-3034` |
| GAP-L-SCENE-01 | Scene graph undefined | §5.1 | `plan.md:78-84` |
| GAP-L-PERSIST-01 | Keys/defaults | §6 | storage doc; `PersistenceStore.swift:41` |
| GAP-L-PERSIST-02 | Store-full policy | BEH-045 | storage doc |
| GAP-L-SM-01 | Session seed source | GAP-CONST-04 (42) | `contracts/core-parity.md` |
| GAP-L-SM-02 | Lifecycle transitions | §7 | `data-model.md:155` |
| GAP-L-DEMO-01 | Demo real-time pacing | DECISION D-104 | `DemoSessionController.swift:40` |
| GAP-L-GPS-01 | Poll rate/accuracy | Source | location doc |
| GAP-L-GPS-02 | First-fix timeout | D-110 (30 s) | — |
| GAP-L-GPS-03 | GPS accuracy vs 30 m gate | NC-54 | `MovementIntegrity.swift:17` |
| GAP-L-ERR-01 | Location lost mid-walk | Source (partial summary) | `tasks.md:61` |
| GAP-L-PERF-01 | Thermal trigger | D-116 | overlay doc |
| GAP-L-PERF-02 | Size target | DECISION D-314 | publish doc |
| GAP-L-TEST-01 | Receipt output channel | DECISION D-310 | `ARCHITECTURE.md:94` |
| GAP-L-PUB-02 | Version visibility | Source | publish checklist |
| GAP-L-CONST-02 | Sibling-doc precedence | DECISION D-324 | — |

## Appendix B: decisions and NCs

| Id | Title | Default | Alternatives | Why |
|---|---|---|---|---|
| D-301 | Permissions | RawLocationModule only; no Internet descriptor | Add InternetModule if GPS fails without Internet | Verify in TST-051 and at publish (T073); amend D-301 if fallback triggered. |
| D-302 | Lira source rig | `Lira_AR_Base_with_clips.blend` → `.glb` | — | 6 state clips, ~5 MB vs 20 MB |
| D-303 | Audio set | 7 walk cues + spawn + bond milestone | — | No launch/reveal moment in the Lens; size |
| D-304 | Skins | Dawn only | — | Dark Veil is invisible on the additive display |
| D-305 | Panel placement | z = −110 cm, pitch −5°, ≤ 34×24 cm | — | Full overlap at 1.1 m |
| D-306 | Audio pan fallback | Non-spatial fallback if D-209 unavailable | — | CF-07 fallback; log in build receipt |
| D-310 | Receipt output | One Logger line `WAYKIN_RECEIPT` | — | No file API in the excerpts |
| D-314 | Size target | ≤ 15 MB | — | Headroom under the cap |
| D-324 | Doc precedence | presentation-/behavior-spec values win | — | Single owner per domain |
| NC-50 | Lens Studio exact version | Resolved: 5.15.4 (NC-05) | https://ar.snap.com/spectacles | — |
| NC-51 | SIK/SUIK versions | Resolved: SIK 0.17.2, UI Kit 0.1.4 (NC-05) | SIK release notes; eng.snap.com/spatial_interaction | — |
| NC-52 | Blender version | 4.x | — | Toolchain |
| NC-53 | Tri budget | 15,000 tris | — | Measure on device; reduce if > 100% GPU |
| NC-54 | Spectacles GPS accuracy | Keep the 30 m gate | — | Log the accepted/rejected ratio on a walk |
| NC-55 | Time to first fix | 30 s timeout | — | Measure cold-start fixes ×5 |