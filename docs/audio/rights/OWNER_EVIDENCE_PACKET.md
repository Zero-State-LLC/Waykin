# Owner evidence packet — audio rights clearance

```yaml
document_id: ZS-AUDIO-OWNER-PACKET
version: 1.0
date: 2026-08-11
status: ACTION_REQUIRED
```

**This is the only part of the audio compliance kit that a person has to do.** Everything else
is scaffolded, validated, and gated automatically. The gate stays **BLOCKED** until the items
below are filed.

Read [`ELEVENLABS_LICENSE_DETERMINATION.md`](ELEVENLABS_LICENSE_DETERMINATION.md) first — it
explains *why* each item matters. This page is the checklist.

---

## Ground rules

- **Nothing on this page goes in git.** Invoices, account IDs, contracts, payment screenshots,
  and personal email stay in a private archive. The ledger records only opaque evidence IDs,
  SHA-256 digests, dates, and review status.
- **An agent may never set `rights_status: cleared`.** Only the owner or a named rights
  reviewer may, and only after the evidence exists.
- **A paid receipt alone is not clearance.** It is one of seven inputs.

---

## Step 1 — Collect (about an hour, mostly downloads)

Create a private folder, e.g. `~/ZeroState-Private/audio-rights/`. Do not put it in a repo.

| # | File | Where to get it | Covers |
| --- | --- | --- | --- |
| 1 | **Paid-plan invoices** spanning every generation date | ElevenLabs → Billing → invoice history. Download PDFs for the whole generation window, not just the current month. | Proves the commercial grant was active *when the audio was made* |
| 2 | **Terms captures** — ToS + Eleven Music Model-Specific Terms | Print-to-PDF from the live pages. If generations predate 26 May 2026, retrieve the prior version from the Internet Archive and capture that too. | Pins which text governed |
| 3 | **Generation/export records** | ElevenLabs → History / usage export. A CSV or batch index is fine. | Ties a shipping file to a licensed generation event |
| 4 | **Beta status confirmation** | Support reply, or a dated screenshot of the product surface showing no beta label | Beta products often carry narrower grants |
| 5 | **Written provider confirmation** — see Step 2 | Email thread | Converts a provisional reading into a documented one |
| 6 | **Input-rights attestation** | You write it — template below | Covers material *you* supplied |
| 7 | **Product identification per batch** | Your own records: which tracks came from Eleven Music vs Sound Effects | Decides which licence governs each file |

> **Item 7 is the one that needs your memory while you still have it.** You confirmed both
> products were used for the music. Nobody else can reconstruct which is which, and it stops
> being recoverable as time passes. If a track's origin is genuinely unknown, mark it
> `unidentified` — the validator blocks on it, which is the correct outcome.

---

## Step 2 — Ask ElevenLabs (send today, it may take days to come back)

The only item with an external dependency. Send it first so it resolves while you do the rest.

**To:** ElevenLabs sales or support
**Subject:** Commercial licence scope — monetised single-platform iOS game

> Hello,
>
> We are a paid ElevenLabs customer and have used both Sound Effects and Eleven Music to
> produce audio for iOS games we are releasing commercially. Before we ship, we would like to
> confirm our licence scope in writing.
>
> 1. Does our current plan cover use of this audio in a **commercially monetised video game
>    distributed solely through the Apple App Store** (a single platform)?
> 2. We understand the Eleven Music Model-Specific Terms exclude "Studio Games," defined as
>    commercialised games "made available for download or use through more than one platform."
>    Can you confirm that a **single-platform** release falls outside that exclusion, and that
>    adding a second storefront later would require an Enterprise agreement?
> 3. Do Music v1 and v2 outputs carry the same commercial grant, where both were used?
>
> Thank you,
> Zero State LLC

File the reply as evidence item 5. A dated reply is materially stronger than a screenshot of a
terms page, because public terms change and a reply pins the provider's own reading at the time
you relied on it.

---

## Step 3 — Input-rights attestation (you write this, five minutes)

Save as `input-rights-attestation.pdf` in the private archive, signed and dated:

> **Zero State LLC — audio input rights attestation**
>
> I attest that for all ElevenLabs audio generations used in Waykin, between [START] and
> [END], no generation used as input: (a) reference audio, stems, or melodies Zero State did
> not own or hold a licence to; (b) any real person's voice, or a voice intended to imitate an
> identifiable person; (c) copyrighted lyrics or prompts naming a known recording artist to
> induce style imitation; or (d) branded sonic marks belonging to a third party.
>
> Signed: ______________________  Date: __________  Title: __________

If any of these *did* occur, do not sign around it — flag the affected assets and route them
through §12 of the rights policy instead. A false attestation is worse than an open item.

---

## Step 4 — File the evidence into the ledger

For each artifact, compute a digest and add an evidence record:

```bash
shasum -a 256 ~/ZeroState-Private/audio-rights/invoice-2026-07.pdf
```

```json
{
  "evidence_id": "WYK-AUD-EV-2026-0001",
  "document_type": "account_plan_or_license",
  "issuer": "ElevenLabs",
  "effective_date": "2026-07-26",
  "captured_date": "2026-08-11",
  "sha256": "<real digest — never invent one>",
  "storage_locator": "private-archive://audio-rights/invoice-2026-07.pdf",
  "verification_status": "verified",
  "reviewer": "<your name>",
  "notes": "Paid plan active across the generation window."
}
```

`storage_locator` must **not** start with `private://pending/` — the validator treats that as an
unfilled placeholder and blocks.

---

## Step 5 — Set the per-asset fields

Batch updates are fine where a group shares identical grants. Per asset:

| Field | Cleared value |
| --- | --- |
| `product_or_model` | `elevenlabs_sound_effects`, `elevenlabs_music_v1`, `elevenlabs_music_v2`, or `elevenlabs_speech` |
| `creation_or_acquisition_date` | ISO date of generation |
| `plan_or_license` | Exact plan name (e.g. `Creator`) |
| `terms_version` | Version or effective date of the governing terms |
| `beta_status` | `confirmed_not_beta` or `beta_separately_cleared` |
| `commercial_use` | `allowed` |
| `modification` | `allowed` (needed — the game mixes, loops, and compresses) |
| `sublicensing` | `allowed` (needed — Apple distributes on your behalf) |
| `third_party_ip_review` | `passed` |
| `evidence_ids` | The records from Step 4 |
| `reviewer` / `review_date` | Named human + ISO date |
| `rights_status` | `cleared` — **set this last** |

---

## Step 6 — Run the gate

```bash
python3 scripts/validate_audio_rights.py
```

Expected: `AUDIO RIGHTS GATE: PASS — N shipping file(s) cleared.`

If Eleven Music assets ship, the gate also prints the platforms they are cleared for. That note
is the standing reminder described below.

---

## ⚠️ The condition that outlives this checklist

Clearance here is scoped to **iOS App Store only**.

> Shipping any Eleven Music-derived track on a **second platform** while the title is monetised
> makes it a "Studio Game" under the Eleven Music terms and requires an **ElevenLabs Enterprise
> agreement before release.**

Mac App Store as a separate SKU, Android, Steam, itch, console, or web all trigger it. The
validator fails closed if `platforms_cleared` grows beyond one while Eleven Music assets ship,
so the trigger is enforced by the gate rather than by anyone remembering it.

---

## Explicit non-claims

- Scaffold ≠ clearance.
- A paid receipt ≠ a commercial grant covering games.
- Filename or folder ≠ product identification.
- Absence of a complaint ≠ permission.
