# Audio rights package — Waykin

**Release-critical authority.** Technical acceptance is not rights clearance.

## Current status

> **GATE: BLOCKED** — 11 shipping cues, all `pending_evidence`, no evidence filed.

```bash
python3 scripts/validate_audio_rights.py
```

## Waykin's audio is first-party — not AI-generated

`docs/AUDIO_ASSET_CONTRACT.md` records the production cues as **owner-rendered sound design
(2026-07-19), first-party licensing**. They are recorded as `source_class: original_human` with
Zero State as creator.

**The ElevenLabs licence determination does not apply to this project.** There is no provider
grant to evidence, no plan or terms version, and no Eleven Music "Studio Games" platform
constraint. Waykin is therefore *not* subject to the single-platform restriction that binds
Hexwire and Marigold Market.

What is required instead is an **authorship and assignment record**: proof that Zero State
created the cues, or that whoever did assigned the rights. If any cue was produced by a
contractor without a signed assignment, that is a real gap — flag it rather than clearing it.

## What the gate enforces

The validator walks `App/Resources/Audio/` and compares it against the ledger. It blocks on:

- a cue with **no ledger record**, or a **hash mismatch** (file changed after clearance);
- `rights_status` other than `cleared`;
- a missing creator for first-party or commissioned work;
- missing creation date, or `commercial_use` not `allowed`;
- evidence missing, unverified, or still a `private://pending/` placeholder;
- clearance recorded without a **named reviewer and date**.

Provenance selects the checks — AI-generated assets are additionally required to identify the
provider product, plan, terms version, and beta status. Waykin's are not AI-generated, so those
do not apply.

## Rules for agents

- **Never** set `rights_status: cleared`. Only a named human may.
- **Never** invent an evidence digest or locator.
- **Never** assume a provider. Waykin's cues are first-party; do not record ElevenLabs or any
  other vendor without evidence in this repository. The audio skill file explicitly warns:
  *"do not invent cloud voice unless present."*

## Regenerating the scaffold

Resets records to `pending_evidence` — do not run after clearance without re-merging.

```bash
python3 scripts/build_audio_rights_ledger.py \
  --root . --sounds App/Resources/Audio --project Waykin --prefix WYK \
  --source-class original_human \
  --provider "Zero State LLC (owner-rendered sound design, 2026-07-19)" \
  --out docs/audio/rights/AUDIO_RIGHTS_LEDGER.json
```
