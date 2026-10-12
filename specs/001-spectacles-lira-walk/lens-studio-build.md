# Lens Studio build spec: Lira Walks With You

> **Precedence:** This doc was drafted in parallel with its siblings. Where it conflicts with `decisions.md` § Conflicts (CF-01..CF-32), the CF resolution wins. Task T040 removes the superseded values from this doc.

Doc letter **L**. This is an executable checklist. The primary executor is an agent that drives Lens Studio through its MCP server on Danny's Mac. A human can follow the "Human" path for every step.

Steps are numbered `LSB-NNN`. Run them in order. A step is done only when its **Verify** line passes. Every step ends in one of two ways: PASS, or STOP with a filed defect. Do not skip steps and do not reorder them.

This doc uses these labels:

- `(platform knowledge, verify)`: a Lens Studio fact that the provided Snap docs don't state.
- **DECISION (proposed) D-3NN**: a product choice the sources don't settle.
- **NEEDS CLARIFICATION NC-5N**: an unknowable hardware or platform fact, with a safe default.

MCP tool names are not documented in the provided sources. Every step therefore names the *operation* (create object, add component, set property). The agent maps each operation to its MCP tool `(platform knowledge, verify)`.

The authoritative inputs are `spec.md`, `plan.md`, `data-model.md`, and `contracts/core-parity.md`. `presentation-spec.md` and `behavior-spec.md` are produced in parallel. Where they define a value that this doc also sets (placement, copy, timings), **their value wins**. The rule in D-324 covers that case. This doc's values are the defaults when a sibling doc is silent.

---

## 0. Prerequisites

| Id | Item | Value | Source |
|---|---|---|---|
| LSB-001 | Lens Studio | 5.x, **≥ 5.7.0**. Exact pin: NC-50 | location doc "Lens Studio v5.7.0 or later" (https://developers.snap.com/spectacles/about-spectacles-features/apis/location) |
| LSB-002 | Spectacles OS on the test device | **≥ v5.60.000** | same doc |
| LSB-003 | Spectacles Interaction Kit (SIK) | Latest in Asset Library at build time. Record the version in the build receipt (NC-51) | https://developers.snap.com/spectacles/spectacles-frameworks/spectacles-interaction-kit/get-started |
| LSB-004 | Spectacles UI Kit (SUIK) | Latest in Asset Library. Record the version (NC-51) | https://developers.snap.com/spectacles/spectacles-frameworks/spectacles-ui-kit/get-started |
| LSB-005 | Blender (for the Lira glTF export) | 4.x (NC-52) | `ArtSource/Companion/Lira/README.md:20-24` |
| LSB-006 | Node LTS + repo TS core built | `packages/waykin-core-ts` passes `node --test` | `specs/001-spectacles-lira-walk/quickstart.md:24-33` |
| LSB-007 | Device pairing | Paired Snapchat account, location permission on, internet on | location doc "Overview" |

**Verify LSB-001..007:**

- Lens Studio About dialog shows ≥ 5.7.0.
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
- Do not reference `InternetModule`, `RemoteServiceModule`, `ConnectedLensModule`, `CameraModule`, `AsrModule`, `MicrophoneAudioProvider`, `BluetoothCentralModule`, or `SupabaseModule`. This matches `spec.md` FR-015.
- **DECISION D-301:** Do **not** declare an Internet descriptor. This is a **flagged correction** of the `spec.md` FR-014 wording "RawLocation plus Internet".
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

Do **not** use the iOS Ember Fox USDZ for these reasons:
- It is a USDZ (Lens Studio imports FBX, glTF, and OBJ per the 3D import overview doc).
- It is ~20 MB (`App/Resources/Companion/Lira/README.md:6`), against a 25 MB Lens cap.
- It ships a single walk clip, with no state clips (`docs/design/CONTINUATION_PLAN.md` "Embedded animation" row).

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
- Actions must keep these names exactly: `Lira_Idle`, `Lira_Follow`, `Lira_Investigate`, `Lira_Alert`, `Lira_Celebrate`, `Lira_Spawn` (`BUILD_MANIFEST.json:40-47`).
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

**LSB-023 — Copy WAVs.** Copy these files from `App/Resources/Audio/` into `spectacles/WaykinLens/Assets/Audio/`, unchanged (48 kHz / 16-bit / stereo per `App/Resources/Audio/README.md:7-10`; the perf doc prefers WAV over mp3):

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
| `SessionController.ts` | `SessionController` | Owns the lifecycle state machine (§7). Runs the tick loop: movement → experience → runtime → audio → presentation. Owns the seed. The only writer to Storage. | `liraController: LiraController`, `audioAdapter: AudioAdapter`, `locationAdapter: LocationAdapter`, `storageAdapter: StorageAdapter`, `receiptAdapter: ReceiptAdapter`, `demoDriver: DemoDriver`, `introPanel: IntroPanel`, `hudPanel: HudPanel`, `summaryPanel: SummaryPanel`, `noticePanel: NoticePanel`, `versionLabel: Text` |
| `adapters/LocationAdapter.ts` | `LocationAdapter` | `require('LensStudio:RawLocationModule')`. Calls `GeoLocation.createLocationService()` with accuracy `GeoLocationAccuracy.Navigation`. Polls `getCurrentPosition` every 1.0 s through `DelayedCallbackEvent.reset(1.0)` (location doc example). Drops duplicate timestamps. Emits `LocationSample` with `horizontalAccuracy` and `reportedSpeedMetersPerSecond = -1` (unknown; the core falls back to distance/time per `MovementIntegrity.swift:186-194`). Counts consecutive errors. **Never** reads heading. | none |
| `adapters/AudioAdapter.ts` | `AudioAdapter` | Ports the App planner `AudioCuePlaybackPlanner` and the catalog (`App/AppAudioCuePlayer.swift:31-115`): three channels, priority, duplicate suppression, pause. Volume = `catalogVolume × max(0.25, intensity)` (`:352`). Ignores pan (D-306). | `foreground: AudioComponent`, `ambient: AudioComponent`, `moment: AudioComponent`, 9 tracks (`trackCompanionNear: AudioTrackAsset`, `trackCompanionAhead`, `trackDistantPresence`, `trackPursuitPressure`, `trackPursuitRelease`, `trackBondMotif`, `trackQuietShift`, `trackSpawnTheme`, `trackBondMilestone`) |
| `adapters/StorageAdapter.ts` | `StorageAdapter` | `global.persistentStorageSystem.store`. Keys are listed in §6. Handles `onStoreFull` (persistent storage doc). | none |
| `adapters/ReceiptAdapter.ts` | `ReceiptAdapter` | Builds the privacy-filtered receipt (counts and labels only, no coordinates; `ARCHITECTURE.md:94`). Prints it once to the Logger at session end as one line prefixed `WAYKIN_RECEIPT ` (D-310). | none |
| `presentation/LiraController.ts` | `LiraController` | Places and animates Lira (§5.2). Maps the AR behavior string to a clip. Runs the spawn coalesce. | `cameraObject: SceneObject`, `liraAnchor: SceneObject`, `liraModel: SceneObject`, `liraFallback: SceneObject`, `animationPlayer: AnimationPlayer` `(platform knowledge, verify component type name)` |
| `presentation/PresencePhrase.ts` | (module, no class) | A line-for-line port of `CompanionPresencePresentation.phrase` and `elapsedText` and `distanceText` (`App/CompanionPresenceView.swift:24-69,119-124`). It is pure, which makes it an App-copy port, not core. | n/a |
| `presentation/IntroPanel.ts` | `IntroPanel` | Shows the Begin Walk and Demo Walk buttons. Calls `SessionController.beginWalk()` and `beginDemo()`. | `root: SceneObject`, `beginButton: RectangleButton`, `demoButton: RectangleButton`, `title: Text`, `safetyLine: Text` |
| `presentation/HudPanel.ts` | `HudPanel` | Peripheral walk HUD: phrase, time, distance, Pause/Resume, End. Lazy-follows the head (§5.3). | `root: SceneObject`, `cameraObject: SceneObject`, `phraseText: Text`, `metricsText: Text`, `pauseButton: RectangleButton`, `pauseLabel: Text`, `endButton: RectangleButton` |
| `presentation/SummaryPanel.ts` | `SummaryPanel` | Shows the end-of-walk card. Done → idle. | `root: SceneObject`, `titleText: Text`, `bondText: Text`, `metricsText: Text`, `memoryText: Text`, `doneButton: RectangleButton` |
| `presentation/NoticePanel.ts` | `NoticePanel` | One-line modal notice with a "Demo Walk" button and a "Close" button. | `root: SceneObject`, `messageText: Text`, `demoButton: RectangleButton`, `closeButton: RectangleButton` |
| `demo/DemoDriver.ts` | `DemoDriver` | Wraps `DemoSessionController`. Advances one tick every **6.0 s** of real time (D-307). Logs the RNG self-test. | none |

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
   │  ├─ Intro_Safety                    on  pos(0,-1.5,0)[Text size 24]
   │  ├─ Btn_BeginWalk                   on  pos(0,-6,0)  [RectangleButton size(16,4,1) style=Primary]
   │  │  └─ Label                        on  [Text "Begin Walk" size 28]
   │  └─ Btn_DemoWalk                    on  pos(0,-11,0) [RectangleButton size(16,4,1) style=Secondary]
   │     └─ Label                        on  [Text "Demo Walk" size 28]
   ├─ HudPanel                           off pos(0,-30,-110) [HudPanel]
   │  ├─ Hud_Phrase                      on  pos(0,3,0)   [Text size 24]
   │  ├─ Hud_Metrics                     on  pos(0,0,0)   [Text size 20]
   │  ├─ Btn_Pause                       on  pos(-5,-4,0) [RectangleButton size(8,3.5,1) style=Secondary]
   │  │  └─ Label                        on  [Text "Pause" size 24]
   │  └─ Btn_End                         on  pos(5,-4,0)  [RectangleButton size(8,3.5,1) style=Secondary]
   │     └─ Label                        on  [Text "End" size 24]
   ├─ SummaryPanel                       off pos(0,-5,-110) [SummaryPanel]
   │  ├─ Sum_Title                       on  pos(0,10,0)  [Text "Session Summary" size 40]
   │  ├─ Sum_Bond                        on  pos(0,5,0)   [Text size 32 color #D4A45A]
   │  ├─ Sum_Metrics                     on  pos(0,1,0)   [Text size 26]
   │  ├─ Sum_Memory                      on  pos(0,-4,0)  [Text size 22 wrap width 30]
   │  └─ Btn_Done                        on  pos(0,-11,0) [RectangleButton size(14,4,1) style=Primary]
   │     └─ Label                        on  [Text "Done" size 28]
   ├─ NoticePanel                        off pos(0,-5,-100) [NoticePanel]
   │  ├─ Notice_Text                     on  pos(0,4,0)   [Text size 24 wrap 30, color #E0B040]
   │  ├─ Btn_NoticeDemo                  on  pos(-6,-3,0) [RectangleButton size(10,3.5,1)] └─ Label "Demo Walk"
   │  └─ Btn_NoticeClose                 on  pos(6,-3,0)  [RectangleButton size(10,3.5,1)] └─ Label "Close"
   └─ VersionLabel                       on  pos(0,-16,-110) [Text "v0.1.0" size 16 color #9AA3B0]
```

Rationale for the panel distance: the panels sit at z = −110 cm because the displays reach full binocular overlap at 1.1 m, and the visible area there is ~53×77 cm (https://developers.snap.com/spectacles/best-practices/design-for-spectacles/introduction-to-spatial-design). All panels fit inside a 34 × 24 cm box. **DECISION D-305.**

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
| | introPanel / hudPanel / summaryPanel / noticePanel | UI/IntroPanel, UI/HudPanel, UI/SummaryPanel, UI/NoticePanel |
| | versionLabel | UI/VersionLabel.Text |
| AudioAdapter | foreground / ambient / moment | Audio_Foreground / Audio_Ambient / Audio_Moment |
| | track* (9) | `Assets/Audio/<basename>.wav` matching name |
| LiraController | cameraObject | Camera |
| | liraAnchor / liraModel / liraFallback | LiraAnchor / LiraModel / LiraFallback |
| | animationPlayer | LiraModel.AnimationPlayer |
| IntroPanel | root, title, safetyLine, beginButton, demoButton | IntroPanel, Intro_Title, Intro_Safety, Btn_BeginWalk, Btn_DemoWalk |
| HudPanel | root, cameraObject, phraseText, metricsText, pauseButton, pauseLabel, endButton | HudPanel, Camera, Hud_Phrase, Hud_Metrics, Btn_Pause, Btn_Pause/Label, Btn_End |
| SummaryPanel | root, titleText, bondText, metricsText, memoryText, doneButton | SummaryPanel, Sum_Title, Sum_Bond, Sum_Metrics, Sum_Memory, Btn_Done |
| NoticePanel | root, messageText, demoButton, closeButton | NoticePanel, Notice_Text, Btn_NoticeDemo, Btn_NoticeClose |

- Verify: with WaykinRoot selected, the Inspector shows no empty input field. On Preview start, the Logger shows no "undefined input" errors.

### 5.2 Lira placement and animation (LiraController)

This section uses Lens Studio cm units and the Camera world transform. These defaults mirror the iOS follow constants. presentation-spec overrides them per D-324.

- **Ground height:** `anchor.y = camera.y − 145`. This is the assumed eye height of 1.45 m (`App/AR/ARPlacementResolver.swift:136`).
- **Target position** = `camera.flatPos + flatForward × fwd + flatRight × side`. The values come from bearing and distance:
  - `beside` (states idle, follow, celebrate, drawNear, rest; mapper `App/AR/CanonicalARWorldCommandMapper.swift:194-203`): fwd = `min(relativeDistance,2.0)×100×0.5`, side = **+80** (`App/AR/ARWorldCommandRenderer.swift:428`).
  - `ahead` (lead): fwd = **200** (`:430`), side = 0.
  - `contextual` (observe): fwd = 120, side = −60 (**D-308**).
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
- **Degrade (FR-018):** Set LiraModel and LiraFallback off, and keep audio running (§8).

### 5.3 HUD follow

On `UpdateEvent`, move HudPanel toward `camera.pos + flatForward×110 + (0,−30,0)`. Use a 0.1 lerp per frame, and only when the angle from the current position exceeds **20°** (**D-309**, lazy follow). HudPanel faces the camera. It stays at 34 × 12 cm, so it is never full-screen (FR-011).

---

## 6. Persistence (StorageAdapter)

The API is `global.persistentStorageSystem.store` with `getInt`/`putInt` and `onStoreFull` (https://developers.snap.com/lens-studio/features/persistent-cloud-storage/persistent-storage). The doc defers to the GeneralDataStore API for the full type list, so `getString`/`putString` are `(platform knowledge, verify)`.

| Key | Type | Default | Written when |
|---|---|---|---|
| `waykin.schema` | int | 1 | first launch |
| `waykin.bond.level` | int | **12** (`PersistenceStore.swift:41`) | session end |
| `waykin.memories.v1` | string (JSON array, max **5**, newest first; `data-model.md:138`) | `"[]"` | session end |
| `waykin.session.count` | int | 0 | session end (also the seed salt; D-311) |

- Memory JSON element: `{"endedAtSec":number,"activeTime":number,"distance":number,"eventKinds":[string],"bondDelta":int,"line":string}`. It contains **no coordinates**.
- `onStoreFull`: **do not** `clear()`. This is a deliberate deviation from the doc sample, because clearing would erase Bond. Instead, drop the oldest memory, retry once, and if the retry fails, write only `waykin.bond.level` (**D-312**).
- **Seed (D-311):** `seed = (sessionCount × 2654435761 + 42) mod 2^64`. The value is passed to the core as a decimal string and logged at start as `WAYKIN_SEED <n>`. Demo always uses the core Demo scenario (no seed dependence; `DemoSessionController.swift:34-43`).

---

## 7. Session state machine (SessionController)

The states are `idle → intro → (demo | walk) active ⇄ paused → ending → summary → idle` (`data-model.md:155`). Stop is legal from every non-idle state.

| From | Trigger | To | Actions |
|---|---|---|---|
| boot | OnStart | intro | Load storage. Print `Lens Opened: v0.1.0` (publish checklist). Show IntroPanel. |
| intro | Btn_BeginWalk | walk-acquiring | Start LocationAdapter. Start a 10 s first-fix timer (NC-55). |
| walk-acquiring | first accepted sample | walk-active | Call `MovementEngine.startSession` + `resumeSession`, then `CompanionWalkExperience.start`. Lira spawns and `spawnTheme` plays. HUD shows. |
| walk-acquiring | timeout or 3 consecutive errors | intro + notice | Notice: "Location access is required for a real walk. Demo Walk is still available." (`App/WaykinApp.swift:958`) |
| intro | Btn_DemoWalk / Btn_NoticeDemo | demo-active | Start DemoDriver. Lira spawns. No spawn theme (iOS parity, `App/WaykinApp.swift:643-645`). |
| *-active | Btn_Pause | paused | `pauseSession`. Audio pauses. Label → "Resume" (`App/AR/CanonicalARSessionView.swift:339`). |
| paused | Btn_Pause | *-active | `resumeSession`. Label → "Pause" (`:349`). |
| active/paused | Btn_End | ending | `endSession`, then `finish`, then bond update and storage write. Audio stops. Lira off. |
| walk-active | 5 consecutive location errors (5 s) | ending (reason locationLost) | Notice: "Location became unavailable. The walk was stopped safely." (`App/WaykinApp.swift:1413`). A partial summary persists (`tasks.md:61`). |
| active | degrade trigger (§8) held 30 s | active (degraded) | Lira hidden; the walk continues with audio. |
| ending | done | summary | Fill SummaryPanel. If `bondDelta > 0`, `bondMilestone` plays. |
| summary | Btn_Done | intro | |

Bond delta rules: a walk gives `+1` (iOS physical, `App/WaykinApp.swift:1097`). Demo uses `result.bondDelta` (`:817`). Behavior-spec overrides this per D-324.

At 15:00 of active time, the HUD phrase shows for 8 s: "Lira is ready to rest when you are." (**D-313**; `spec.md` edge-case threshold.) Walking continues.

Intro safety line: "Pause or end anytime. Stopping is never a failure." (`App/Onboarding/OnboardingFlowView.swift:230`).

Summary copy:
- Bond: `Bond +N` / `Bond N` / `Bond held` (`App/WaykinApp.swift:3017-3022`).
- Metrics: `M:SS · N m` (`:3024-3034`).
- Memory: `memoryText` with the `WalkPathCopy` suffix applied.

HUD metrics use the same `M:SS · N m` format through `PresencePhrase.elapsedText/distanceText`.

---

## 8. Performance guardrails

- Targets: 60 FPS and power < 100% (Lens Performance Overlay doc).
- **Degrade trigger (NC-56):** the mean `deltaTime` over a rolling 5 s window is > **20 ms** (< 50 FPS), sustained 30 s. The provided docs expose no thermal or power API to scripts. On trigger, hide Lira (§5.2) and stop HUD lerp updates (the panel is frozen in place). Recovery: mean < 17 ms sustained for 60 s.
- Simultaneous sounds ≤ 3 (one per channel; perf doc "limit the number of simultaneous sounds").
- AudioComponent `playbackMode` = `Audio.PlaybackMode.LowPower` on all three channels, set in `AudioAdapter.onAwake`. Spectacles defaults to LowPower, and the cues tolerate latency (https://developers.snap.com/spectacles/about-spectacles-features/audio). Button feedback uses the SUIK built-in audio. **D-306** also states that pan (±0.2 on iOS, `App/AppAudioCuePlayer.swift:536-541`) is dropped.

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
| LSB-066 | Enabled states per §5.1 | LiraAnchor, HudPanel, SummaryPanel, NoticePanel off at start |
| LSB-067 | Save; size check | Project Info Lens size ≤ **15 MB** (D-314; hard cap 25 MB per the publish doc) |

---

## 10. Preview tests (Lens Studio, Spectacles device override)

| Step | Test | Pass |
|---|---|---|
| LSB-070 | Launch | Logger: `Lens Opened: v0.1.0` and `WAYKIN_SEED`. IntroPanel visible at ~110 cm. |
| LSB-071 | RNG self-test | DemoDriver logs the first 4 `next()` values for the reference seed. They equal `rngStream[0..3]` in the reference vector under `Tests/Vectors/seed-event/` (`quickstart.md:48`). |
| LSB-072 | Demo Walk | Logger event order: `companionObserves, companionDrawsNear, distantPresence, pursuitBegins, pursuitIntensifies, pursuitFades, bondMoment` (`DemoSessionController.swift:6-14`), one every 6 s. Each logged cue matches `AudioExperienceLayer.map` (`AudioExperienceLayer.swift:110-127`). |
| LSB-073 | Pause mid-demo | Ticks stop. Label shows "Resume". After resume, no event is duplicated (`Tests/WaykinCoreTests/DemoAndPhysicsTests.swift:74-89`). |
| LSB-074 | End | SummaryPanel shows "Session Summary", a Bond line, metrics, and memory. Done returns to intro. |
| LSB-075 | Persistence | Preview `... → Print Persistent Storage` shows `waykin.bond.level` and `waykin.memories.v1` (storage doc). Restart Preview and the Bond value is unchanged. |
| LSB-076 | Six demos | `waykin.memories.v1` length = 5. |
| LSB-077 | Begin Walk in Preview | No fix arrives, so after 10 s the notice copy from §7 appears. Btn_NoticeDemo starts the demo. |
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
| LSB-084 | Location off | Notice shows. Demo works. |

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
| LSB-095 | Defined objective / onboarding | IntroPanel title + safety line |
| LSB-096 | Permissions publishable | Only GPS - Precise (LSB-014) |
| LSB-097 | Capturable | One capture taken; Lira visible in the capture |
| LSB-098 | Metadata | Description: "Walk with Lira, a companion who reacts to how you move." Release notes listing version and changes. Test steps = §10/§11 IDs. |
| LSB-099 | Submit | Moderation review takes 2–3 business days |

Receipt template (`docs/design/receipts/LENS_BUILD_<UTC>_<sha>.md`): YAML fields `git_sha`, `lens_studio_version`, `sik_version`, `suik_version`, `device_os`, `lens_size_mb`, `evidence_class`. Then a pass or fail line for each LSB-0NN.

---

## Appendix A: gaps closed

| Id | Gap | Resolution | Citation |
|---|---|---|---|
| GAP-L-CONST-01 | No Lens Studio minimum version | Source | location doc (≥ 5.7.0) |
| GAP-L-PUB-01 | Permission set ambiguous (FR-014 "plus Internet") | DECISION D-301 (flagged correction) | permission overview + Transparent Permission docs |
| GAP-L-ASSET-01 | iOS USDZ not importable; 20 MB | DECISION D-302 | glTF import doc; `BUILD_MANIFEST.json:40-53` |
| GAP-L-ASSET-02 | Import settings unspecified | Source + platform | glTF import doc |
| GAP-L-ASSET-03 | Texture size unspecified | Source | perf doc (≤ 512 px) |
| GAP-L-ASSET-04 | Poly budget unknown | NC-53 | `tasks.md:37` |
| GAP-L-AUDIO-01 | Which WAVs ship | DECISION D-303 | `App/Resources/Audio/README.md` |
| GAP-L-AUDIO-02 | Channel/volume model | Source port | `App/AppAudioCuePlayer.swift:13-115,352` |
| GAP-L-AUDIO-03 | Playback mode | Source | Spectacles audio doc |
| GAP-L-LIRA-01 | Skin set | DECISION D-304 | publish doc (black transparent) |
| GAP-L-LIRA-02 | Placement constants | Source mirror + D-308 | `ARWorldCommandRenderer.swift:414-432`, `ARPlacementResolver.swift:136` |
| GAP-L-LIRA-03 | Clip mapping | Source | `CompanionPresentationState.swift:39,109-120`; manifest clips |
| GAP-L-UI-01 | Panel distance/size | DECISION D-305 | spatial design doc |
| GAP-L-UI-02 | HUD follow behavior | DECISION D-309 | FR-011 |
| GAP-L-UI-03 | Copy strings | Source reuse + D-313 | `WaykinApp.swift:958,1413,2896,3017-3034` |
| GAP-L-SCENE-01 | Scene graph undefined | §5.1 | `plan.md:78-84` |
| GAP-L-PERSIST-01 | Keys/defaults | §6 | storage doc; `PersistenceStore.swift:41` |
| GAP-L-PERSIST-02 | Store-full policy | DECISION D-312 | storage doc |
| GAP-L-SM-01 | Session seed source | DECISION D-311 | `contracts/core-parity.md` |
| GAP-L-SM-02 | Lifecycle transitions | §7 | `data-model.md:155` |
| GAP-L-DEMO-01 | Demo real-time pacing | DECISION D-307 | `DemoSessionController.swift:40` |
| GAP-L-GPS-01 | Poll rate/accuracy | Source | location doc |
| GAP-L-GPS-02 | First-fix timeout | NC-55 | — |
| GAP-L-GPS-03 | GPS accuracy vs 30 m gate | NC-54 | `MovementIntegrity.swift:17` |
| GAP-L-ERR-01 | Location lost mid-walk | Source (partial summary) | `tasks.md:61` |
| GAP-L-PERF-01 | Thermal trigger | NC-56 | overlay doc |
| GAP-L-PERF-02 | Size target | DECISION D-314 | publish doc |
| GAP-L-TEST-01 | Receipt output channel | DECISION D-310 | `ARCHITECTURE.md:94` |
| GAP-L-PUB-02 | Version visibility | Source | publish checklist |
| GAP-L-CONST-02 | Sibling-doc precedence | DECISION D-324 | — |

## Appendix B: decisions and NCs

| Id | Title | Default | Alternatives | Why |
|---|---|---|---|---|
| D-301 | Permissions | RawLocationModule only; no Internet descriptor | Add InternetModule | No network I/O; avoids a needless prompt. Flagged correction of FR-014. |
| D-302 | Lira source rig | `Lira_AR_Base_with_clips.blend` → `.glb` | Ember Fox re-export; procedural | 6 state clips, ~5 MB vs 20 MB |
| D-303 | Audio set | 7 walk cues + spawn + bond milestone | All 11 | No launch/reveal moment in the Lens; size |
| D-304 | Skins | Dawn only | All 3 | Dark Veil is invisible on the additive display |
| D-305 | Panel placement | z = −110 cm, ≤ 34×24 cm | 100 cm, 150 cm | Full overlap at 1.1 m |
| D-306 | Audio pan | Ignored | Spatial audio | iOS pan only ±0.2; cost |
| D-307 | Demo pacing | 1 tick / 6 s | 3 s, 10 s | 42 s demo, readable |
| D-308 | Contextual bearing | fwd 120, side −60 cm | Same as beside | Distinguishes observe |
| D-309 | HUD follow | Lazy, 20° threshold, lerp 0.1 | Head-locked; world-fixed | Peripheral, not full-screen |
| D-310 | Receipt output | One Logger line `WAYKIN_RECEIPT` | File export | No file API in the excerpts |
| D-311 | Seed | `count×2654435761+42` mod 2^64 | Fixed 42; time | Deterministic, varies per walk |
| D-312 | Store full | Drop oldest memory, never clear Bond | `clear()` | Protects progression |
| D-313 | 15-min hint | Phrase "Lira is ready to rest when you are." for 8 s | Panel; none | Non-blocking per spec edge case |
| D-314 | Size target | ≤ 15 MB | ≤ 25 MB | Headroom under the cap |
| D-324 | Doc precedence | presentation-/behavior-spec values win | This doc wins | Single owner per domain |
| NC-50 | Lens Studio exact version | ≥ 5.7.0, record actual | — | Pin at first build |
| NC-51 | SIK/SUIK versions | Latest; record | — | Not in sources |
| NC-52 | Blender version | 4.x | — | Toolchain |
| NC-53 | Tri budget | 15,000 tris | — | Measure on device; reduce if > 100% GPU |
| NC-54 | Spectacles GPS accuracy | Keep the 30 m gate | — | Log the accepted/rejected ratio on a walk |
| NC-55 | Time to first fix | 10 s timeout | — | Measure cold-start fixes ×5 |
| NC-56 | Thermal signal | Frame-time proxy (>20 ms mean, 30 s) | — | No script thermal API in the docs |
