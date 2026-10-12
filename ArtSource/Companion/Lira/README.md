# Lira hand-sculpted AR mid-LOD source

Status: **ARTIST_BLEND_HERO_DCC_MID_LOD** (v1.2 — armature + auto-weight heat-map).  
Fallback generator remains GENERATED_MID_LOD via `./scripts/build_lira_usdz.sh`.

## Runtime contract

- Runtime filename: `Lira_AR_Base.usdz`
- Root entity: `LiraRoot`
- Armature: `LiraArmature` (25 bones)
- Skin: automatic heat-map on Body/Head/ears/legs; FX rigid
- Canonical height: `0.72 m`
- Required semantic nodes:
  - `Body`, `Head`, `LeftEar`, `RightEar`, `Tail`
  - `Filament`, `CoreGlow`, `GroundShadow`, `StatusIndicator`
- Joint extras: `FilamentBase`, `FilamentMid`, `FilamentTip`, `CoreHalo`

## Export (preferred)

```bash
./scripts/export_lira_blend_to_usdz.sh ArtSource/Companion/Lira/lira.blend
# or
./scripts/export_lira_blend_to_usdz.sh ~/Desktop/lira.blend
```

Pipeline: rename → armature → scale → auto-skin → **hero paint** → **DCC clips** → USD (+ clip USDs) → usdzip.

| Script | Role |
| ------ | ---- |
| `scripts/build_lira_armature.py` | Bone tree + initial rigid bind |
| `scripts/skin_lira_armature.py` | Merge Body/Head shells + ARMATURE_AUTO + influence cap |
| `scripts/author_lira_armature_clips.py` | Optional DCC Idle/Follow/Alert actions |
| `scripts/check_lira_usdz_integrity.sh` | Dual package size + evidence check |
| `scripts/export_lira_blend_to_usdz.py` | Full Blender prep + USD |
| `scripts/export_lira_blend_to_usdz.sh` | Blender + usdzip → App Resources |

## Scope boundary

- Evidence: **ARTIST_BLEND_HERO_DCC_MID_LOD**
- Auto-weight heat-map: **shipped**
- Hand-painted weights / outdoor AR: **not shipped**
- Procedural RealityKit factory remains permanent fallback


### Hero weights + DCC

- `scripts/paint_lira_hero_weights.py` — region distance paint
- `scripts/author_lira_armature_clips.py` — 6 presentation actions
- Clips dir: `App/Resources/Companion/Lira/Clips/`
- Runtime: DCC overlay + puppet fill (`LiraSkeletalPlayer`)

## License (Meshy-derived)

- Origin: derived from a Meshy AI generation (confirmed by Danny, 2026-10-11).
- Meshy plan: **paid**. Zero State owns the generated asset outright, so no attribution or credit line is required ([Meshy: ownership](https://help.meshy.ai/en/articles/10137554-what-is-the-ownership-of-the-generated-models)).
- Generation date: about two months before 2026-10-11 (approx. Aug 2026, per Danny)
- Input-image rights: owned by Zer0 State LLC (per Danny, 2026-10-11 11:30 PM PT)
