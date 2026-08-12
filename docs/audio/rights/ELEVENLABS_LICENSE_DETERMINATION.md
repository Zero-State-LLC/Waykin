# ElevenLabs license determination — Zero State audio

```yaml
document_id: ZS-AUDIO-ELEVENLABS-DETERMINATION
version: 1.0
date: 2026-08-11
status: DRAFT_FOR_OWNER_CONFIRMATION
applies_to: [Hexwire, Surveillance Survivor, Waykin]
```

> **This is an operational compliance analysis, not legal advice.** It records what the
> provider's published terms say as of the date above, what that implies for Zero State's
> intended release, and which questions remain open. Qualified counsel should review the
> residual items before wide commercial release.

---

## 1. Why this document exists

Zero State generated the shipping audio for its iOS titles using **ElevenLabs**, on a **paid
account**. The intuitive conclusion — *"we paid for it, so we own it"* — is close to correct but
not precise enough to survive diligence, because **ElevenLabs does not grant one license.**
Different products carry different terms, and one of them contains a carve-out that directly
names video games.

The distinction that matters:

| Product | Governing terms | Games carve-out? |
| --- | --- | --- |
| Sound Effects / speech | ElevenLabs Terms of Service | **No** |
| **Eleven Music** | Eleven Music Model-Specific Terms | **Yes — see §3** |

Both products were used to produce Zero State's music beds. That means the music library is
**mixed-provenance** and must be resolved per track, not per app.

---

## 2. Sound Effects and speech output — low risk

Under the ElevenLabs Terms of Service, on **any paid plan** (Starter and above):

- output may be used commercially;
- the customer retains ownership of the generated output;
- commercial rights are **perpetual and survive cancellation** of the subscription;
- **no attribution is required** (attribution is a free-tier condition only).

**Determination:** assets generated from Sound Effects or speech models on a paid plan are
cleared for Zero State's intended use, subject only to evidencing that the account was on a
paid plan **on the generation date** (§5) and to the input-rights attestation (§6).

---

## 3. Eleven Music — the material open item

Eleven Music is governed by separate [Model-Specific Terms](https://elevenlabs.io/eleven-music-model-specific-terms)
(last updated **26 May 2026**, covering Music Models v1 and v2).

Self-serve plans permit online and offline commercial use **"except for film, TV, and Studio
Games."** "Studio Games" is defined verbatim as:

> "video games which are commercialised (either by sale, advertising or any other forms of
> monetisation) and made available for download or use through more than one platform."

### 3.1 The two-prong test

The definition is **conjunctive**. An asset falls into the excluded "Studio Games" category only
when **both** are true:

1. **Commercialised** — sold, ad-supported, or monetised in any other form; **and**
2. **Multi-platform** — made available for download or use through **more than one platform**.

### 3.2 Application to Zero State's titles

Zero State's confirmed release plan is **iOS App Store only** — a single distribution platform.
Prong 2 therefore fails, and the titles fall **outside** the Studio Games exclusion. On that
basis the paid self-serve commercial license plausibly covers the intended release.

**Determination:** *provisionally cleared for single-platform iOS release*, subject to written
provider confirmation (§4) — with one standing condition below.

### 3.3 ⚠️ Standing release condition — the multi-platform trigger

> **Shipping any Eleven Music-derived track on a second platform, while the title is
> monetised, converts that title into a "Studio Game" and takes it outside the self-serve
> license.** At that point an **ElevenLabs Enterprise agreement is required before release.**

Platforms that would trigger this include, non-exhaustively: a separate Mac App Store SKU,
Android/Google Play, Steam, itch.io, Epic, console storefronts, or any web/streaming build.

This is not a theoretical concern — it is a normal product decision that would silently
invalidate the license if made without re-running this analysis. It is recorded as a **hard
gate** in each title's rights ledger (`release_constraints.multi_platform_trigger`) so the
condition travels with the asset rather than living only in someone's memory.

### 3.4 Attribution

The Music terms require credit ("Created in collaboration with ElevenLabs") **only when the
Music Model is accessed free of charge**. On a paid plan no attribution is owed. Zero State may
still elect to credit voluntarily — but per policy §8, a courtesy credit must not be recorded in
the ledger as a legal requirement.

---

## 4. What the owner must obtain — the one item that cannot be automated

**Action: obtain written confirmation from ElevenLabs** (sales or support, email is sufficient)
covering:

1. that Zero State's plan tier covers a **monetised, single-platform iOS game**;
2. **explicit confirmation of the multi-platform trigger** — i.e. that adding a second
   storefront requires an Enterprise agreement — so the boundary is documented rather than
   inferred from a public webpage;
3. whether any track generated from **Music v1 vs v2** carries different grants, if both were
   used across the generation window.

File the reply as evidence (§5). An email thread is a cheap, durable, dated artifact and is
materially stronger than a screenshot of a terms page — public terms can change under you,
and a dated reply pins the provider's own reading at the time you relied on it.

---

## 5. Evidence that must be archived privately

Rights you cannot evidence are rights you cannot defend. For each generation batch:

| # | Evidence | Why it matters |
| --- | --- | --- |
| 1 | Paid-plan invoice/receipt showing the account was **paid on the generation dates** | The commercial grant attaches to paid status *at generation time*. A current invoice does not prove past status. |
| 2 | Captured copy of the **ToS / Music terms version in force on those dates** | Terms change. §3 rests on the 26 May 2026 version; a later revision does not retroactively govern past generations, but you must be able to show which text applied. |
| 3 | **Product identification per batch** — Sound Effects vs Eleven Music | Determines whether §2 or §3 governs. Unidentified assets fail closed. |
| 4 | **Beta/preview status confirmation** | Beta products often ship under narrower or disclaimed grants. |
| 5 | **Generation/export records** (batch index, session or history IDs) | Ties a specific shipping file to a specific licensed generation event. |
| 6 | **Owner input-rights attestation** (§6) | The provider's grant does not cover inputs you had no right to upload. |
| 7 | **ElevenLabs written confirmation** from §4 | Converts a provisional reading into a documented one. |

Store all of this **outside the public repositories**. The committed ledger records only opaque
evidence IDs, SHA-256 digests, dates, non-sensitive locators, and review status — never
invoices, account identifiers, contracts, or payment details.

---

## 6. Input rights — the provider's grant has a floor

An ElevenLabs commercial grant covers *their* model output. It does not cure rights in material
**you supplied as input**. Zero State must attest, per batch, that no generation used:

- uploaded reference audio, stems, or melodies it did not own or have license to;
- a real person's voice, or a voice intended to imitate an identifiable person;
- copyrighted lyrics, or prompts naming a known artist to induce style imitation;
- branded sonic marks (startup chimes, sports/broadcast stings, franchise motifs).

The Music terms independently prohibit uploading known artist names or copyrighted lyrics.
A violation here is not cured by the paid plan.

---

## 7. Copyright posture — say the true thing

Under current U.S. law, output generated by an AI system without sufficient human authorship is
generally **not eligible for copyright protection** (U.S. Copyright Office guidance; *Thaler v.
Perlmutter*). Human-authored contributions — arrangement, editing, mixing, selection and
sequencing across a game score — may attract protection in that expression, but the raw
generated stems likely do not.

Practical consequences:

- **For the App Store this changes nothing.** Apple requires that you have the *rights to use
  and distribute* the content, not that you hold a registrable copyright.
- **A claim of copyright ownership over the raw audio would be an overclaim,** and it is the
  kind of statement that ages badly in a dispute or in diligence for a funding or acquisition
  event.
- **Zero State cannot rely on copyright to stop a third party** from generating or using
  similar or identical output.

**Adopted wording for all public-facing legal documents:**

> "Zero State holds all rights necessary to use and distribute the audio in this application."

This is accurate whether or not the underlying output is copyrightable, and it remains true
even if the Eleven Music question in §3 resolves unfavourably (in which case the remedy is an
Enterprise license, not a change to the ownership claim). Avoid "Zero State owns the copyright
in the audio" and "all audio is original work owned by Zero State."

---

## 8. Residual risk register

| # | Risk | Severity | Status | Owner action |
| --- | --- | --- | --- | --- |
| R1 | Eleven Music tracks shipped on a second platform without Enterprise license | **High** | Controlled by §3.3 gate | Re-run this analysis before any non-iOS release |
| R2 | Paid-plan status on generation dates not evidenced | **High** | Open | File invoices (§5.1) |
| R3 | Music vs SFX product not identified per track | Medium | Open | Identify per batch; unidentified fails closed |
| R4 | Terms version in force at generation not captured | Medium | Open | Archive captures (§5.2) |
| R5 | Beta/preview status unconfirmed | Medium | Open | Confirm in writing (§5.4) |
| R6 | Uploaded reference inputs unreviewed | Medium | Open | Owner attestation (§6) |
| R7 | Public legal text overclaims copyright | Low | **Resolved** | §7 wording adopted |
| R8 | Provider terms change post-release | Low | Accepted | Rights vest at generation; §5.2 captures preserve the record |

---

## 9. Bottom line

Paying for tokens **did** buy Zero State a commercial license, and for the Sound Effects
material that is effectively the end of the analysis. The exposure is narrower and more specific
than "do we own our audio":

1. **Evidence the paid status and the terms version** as of the generation dates — this is
   clerical work that gets materially harder the longer it is deferred.
2. **Identify which tracks came from Eleven Music**, because those carry a games carve-out the
   sound effects do not.
3. **Treat "ship on a second platform" as a licensing event**, not just a build target.

None of this blocks a TestFlight build or an iOS-only App Store release. All of it blocks
being able to *prove* the position later, which is when it will actually be asked.

---

## Sources

- [Eleven Music Model-Specific Terms](https://elevenlabs.io/eleven-music-model-specific-terms) — "Studio Games" definition, attribution, last updated 26 May 2026
- [ElevenLabs Terms of Service](https://elevenlabs.io/terms-of-use)
- [ElevenLabs Music Marketplace documentation](https://elevenlabs.io/docs/overview/capabilities/music/marketplace) — self-serve licensing tiers, enterprise escalation for studio games
- [ElevenLabs commercial rights and output ownership analysis](https://terms.law/ai-output-rights/elevenlabs/) — paid-plan ownership, perpetuity after cancellation
- [ElevenLabs licensing guide](https://www.licenseorg.com/blog/elevenlabs-licensing-guide-ai-voices) — plan-tier commercial rights, free-tier attribution
