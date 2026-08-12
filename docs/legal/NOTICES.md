# Notices and attribution

```yaml
document_id: WAYKIN-LEGAL-NOTICES
version: 3.0
date: 2026-08-11
```

## Waykin source (Zero State)

Copyright (c) 2024–2026 **Zero State**.  
All rights reserved.

Waykin is **proprietary software**. Full terms: [LICENSE](../../LICENSE).  
No Proprietary, MIT, or other open-source license is granted for the current tree.

## Platform frameworks (runtime)

Builds may link Apple frameworks including but not limited to:

- SwiftUI, UIKit, Foundation  
- CoreLocation  
- MapKit  
- ARKit, RealityKit  
- HealthKit (optional)  
- AVFoundation  

Those frameworks remain subject to Apple’s software license agreements and App Store Review Guidelines. Trademarks remain with their owners.

## Design package assets

Visual candidate packages under `Waykin-Design` (when used) may include brand, icon, and companion materials with their own stage status. Integration into the app does not change third-party font licensing (e.g. if DM Sans or other OFL fonts are bundled later — document the license file beside the font).

Current app typography uses **system fonts** unless otherwise noted.

## Audio cues

The 11 production cues under `App/Resources/Audio/` were **generated with ElevenLabs** under a
paid commercial licence held by Zero State LLC. They ship as static files; the app performs no
AI processing at runtime and contacts no AI service.

**Zero State holds all rights necessary to use and distribute this audio.** Chain-of-title
records are maintained in [`../audio/rights/`](../audio/rights/) and validated by
`scripts/validate_audio_rights.py` as a release gate.

Attribution to ElevenLabs is **not** required under a paid plan — the credit requirement in the
Eleven Music terms applies to free-tier access only.

> **Open item.** Ten cues are identified as ElevenLabs Sound Effects. `lira_launch_theme.wav`
> (10 s) is unidentified and fails the gate closed: if it came from Eleven Music, Waykin becomes
> subject to the "Studio Games" single-platform restriction. See
> [`../audio/rights/README.md`](../audio/rights/README.md).

## Generated and artist assets

- Procedural / generated mid-LOD assets are Zero State work product.  
- Artist blend sources under `ArtSource/` retain provenance receipts; redistribution is governed by the project proprietary LICENSE unless a file states a separate third-party license.

## No endorsement

Names of tools (Xcode, Blender, GitHub, etc.) are used for interoperability description only and do not imply endorsement.
