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
| `elevenlabs_music` | 1 | `lira_launch_theme.wav` (10 s) — **confirmed by owner 2026-08-11** |

**One Eleven Music asset is enough to constrain the entire app.** The Studio Games carve-out
attaches to the use of the output, not to how much of it there is, so a single 10-second theme
brings Waykin under the same single-platform limit as the games.

## Read in this order

| Order | Document |
| --- | --- |
| 1 | [`ELEVENLABS_LICENSE_DETERMINATION.md`](ELEVENLABS_LICENSE_DETERMINATION.md) |
| 2 | [`OWNER_EVIDENCE_PACKET.md`](OWNER_EVIDENCE_PACKET.md) |
| 3 | [`AUDIO_RIGHTS_POLICY.md`](AUDIO_RIGHTS_POLICY.md) |
| 4 | [`EVIDENCE_CHECKLIST.md`](EVIDENCE_CHECKLIST.md) |

## ⚠️ Standing condition — now active

Waykin is cleared for **iOS App Store only**. Because `lira_launch_theme.wav` is Eleven Music
output, shipping Waykin on a **second platform** while monetised makes it a "Studio Game" under
the Eleven Music terms and requires an **ElevenLabs Enterprise agreement first**.

The validator fails closed if `release_constraints.platforms_cleared` grows beyond one, so this
is enforced by the gate rather than remembered. Verified: adding a second platform blocks with a
message naming the cause.

If a future release must ship cross-platform, the cheapest fix is usually to **replace that one
track** with Sound Effects output or first-party music, rather than negotiating an Enterprise
agreement for a single 10-second cue.

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
