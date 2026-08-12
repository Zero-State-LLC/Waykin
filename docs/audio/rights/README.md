# Audio rights package — Waykin

**Release-critical authority.** Technical acceptance is not rights clearance.

## Current status

> **GATE: BLOCKED** — 11 shipping cues, all `pending_evidence`, no evidence filed.

```bash
python3 scripts/validate_audio_rights.py
```

## Provenance correction (2026-08-11)

`docs/AUDIO_ASSET_CONTRACT.md` previously described these cues as *"owner-rendered …
first-party licensing."* **That was inaccurate.** The cues were **generated with ElevenLabs**
under a paid commercial licence held by Zero State. The contract has been corrected.

This matters because it changes the obligations entirely. First-party work needs an authorship
record and carries no provider constraint. AI-generated work needs provider evidence — plan,
terms version, beta status, generation records — and may carry the Eleven Music **"Studio Games"**
restriction limiting release to a single platform.

The repo's own generation briefs in `docs/design/LIRA_AUDIO_CUE_FAMILY.md` are the giveaway:
each cue has a generator prompt. Documentation asserting first-party authorship sat alongside
prompts proving generation.

## Product identification

| Product | Count | Basis |
| --- | --- | --- |
| `elevenlabs_sound_effects` | 10 | Short descriptive sound-design prompts; every cue ≤ 3 s |
| **unidentified** | 1 | `lira_launch_theme.wav` — **10 s**, far longer than any other cue |

`lira_launch_theme.wav` is deliberately left unidentified and **fails closed**. It is the only
cue long enough to plausibly be an Eleven Music generation, and only Eleven Music carries the
Studio Games restriction. Guessing it as Sound Effects would understate the constraint; the
owner must confirm.

## Read in this order

| Order | Document |
| --- | --- |
| 1 | [`ELEVENLABS_LICENSE_DETERMINATION.md`](ELEVENLABS_LICENSE_DETERMINATION.md) |
| 2 | [`OWNER_EVIDENCE_PACKET.md`](OWNER_EVIDENCE_PACKET.md) |
| 3 | [`AUDIO_RIGHTS_POLICY.md`](AUDIO_RIGHTS_POLICY.md) |
| 4 | [`EVIDENCE_CHECKLIST.md`](EVIDENCE_CHECKLIST.md) |

## ⚠️ Standing condition

If `lira_launch_theme.wav` turns out to be Eleven Music, Waykin becomes subject to the
**single-platform** restriction: shipping on a second platform while monetised would require an
ElevenLabs Enterprise agreement. If it is Sound Effects, Waykin is unconstrained on platforms.
Resolve this before planning any non-iOS release.

## Rules for agents

- **Never** set `rights_status: cleared`. Only a named human may.
- **Never** invent an evidence digest or locator.
- **Never** trust a provenance claim in prose over evidence in the repository. That is exactly
  what went wrong here.

## Regenerating the scaffold

```bash
python3 scripts/build_audio_rights_ledger.py \
  --root . --sounds App/Resources/Audio --project Waykin --prefix WYK \
  --source-class ai_generated --provider "ElevenLabs (Zero State owner account)" \
  --out docs/audio/rights/AUDIO_RIGHTS_LEDGER.json
```
