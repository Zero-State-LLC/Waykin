# ElevenLabs license determination — Zero State audio

```yaml
document_id: ZS-AUDIO-ELEVENLABS-DETERMINATION
version: 1.2
date: 2026-08-11
status: REVISED_AGAINST_FULL_SERVICE_TERMS
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
cleared for Zero State's intended use, subject to evidencing paid status **on the generation
date** (§5) and the input-rights attestation (§6).

**But see §2A** — Sound Effects output is sublicensed to third parties by default. Zero State's
right to *use* its SFX is unaffected; its *exclusivity* is not what one might assume.

---

## 2A. ⚠️ Sound Effects are sublicensed to third parties **by default**

The Sound Effects Terms (last updated **12 February 2026**) §2 provides:

> "You may create Outputs using Sound Effects (the 'SFX Outputs'). You may opt out of the
> sublicensing of your SFX Outputs to third parties (including making SFX Outputs available to
> other ElevenLabs users) at any time by using the 'Disable' functionality on the Sound Effects
> product page. Upon processing of such request, your SFX Outputs will no longer be made
> available for new third-party use; however, **this will not affect any sublicenses or uses
> already granted or commenced prior to the effective date of your opt-out**."

Read carefully, this says: **sublicensing is the default state, and opting out is not
retroactive.**

### What this means for Zero State

- Every sound effect generated on the account **may already be available to other ElevenLabs
  users**, unless the "Disable" toggle was set before generation.
- Zero State's SFX are therefore **non-exclusive** — a competitor's game may lawfully ship the
  same effects.
- **Opting out now stops future sharing but cannot claw back sublicenses already granted.**
  Every day the toggle stays on, more irrevocable third-party rights may accrue.

### ✅ Owner action — time-sensitive

1. **Check the "Disable" toggle** on the ElevenLabs Sound Effects product page immediately.
2. **Record its current state and the date** as evidence. If it was already disabled, that is a
   materially better position and worth documenting. If it was not, document when it was changed.
3. Understand that this does **not** affect Zero State's own right to use its SFX. The grant to
   Zero State is unchanged — what is at stake is whether *others* also get to use them.

This is the one item in this analysis where **delay itself causes loss**. Everything else is
paperwork that can be filed later at the same cost.

### Effect on the apps

Zero State ships **139 sound effects** across the portfolio (Hexwire 84, Surveillance Survivor
29, Marigold Market 16, Waykin 10). None of this blocks release — Zero State's own licence to
use them is intact — but no app should market its audio as exclusive or bespoke, and the
non-exclusivity should be understood before anyone treats the sound design as a defensible asset.

### Precedence note

The Sound Effects Terms state they **prevail** over other agreed terms with respect to Sound
Effects. So for SFX assets, this document controls; the Music Service Terms and their Studio
Games carve-out do **not** apply to Sound Effects output.

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

## 3A. The three-layer structure — and which layer wins

Eleven Music is not governed by one document. Per the Music Service Terms, the order of
precedence is:

| Priority | Layer | What it carries |
| --- | --- | --- |
| 1 (highest) | **Model-Specific Terms** | The Music Commercial Rights table and the **"Studio Games"** carve-out (§3) |
| 2 | **Music Service Terms** (last updated 26 May 2026) | Prohibited industries, prohibited inputs, disclaimers |
| 3 | Underlying **ElevenLabs Terms of Service** | Base grant, Input/Output definitions |

The Studio Games restriction therefore sits in the **highest-priority layer** — it is not
softened by anything in the general terms.

Note also that the Service Terms define audio submitted to a Music Model as **"Input"**, and
model output as **"Output"**, importing the Underlying Agreement's meanings. That is what makes
§6 below a contractual obligation rather than good practice.

## 3B. No exclusivity — recorded, because it is easy to assume otherwise

Music Service Terms §3 states plainly:

> "You acknowledge that, due to the nature of machine learning, Output you generate using Music
> may not be unique and may be similar or identical to Output returned to other users.
> ElevenLabs does not guarantee the exclusivity of Output, and any responses generated for
> others shall not be considered your Output. You shall have no rights in or to such
> third-party output."

Two consequences:

1. **Zero State cannot claim exclusive rights in its music tracks.** Another ElevenLabs customer
   may hold audio that is similar or identical, lawfully. This is independent of the copyright
   analysis in §7 — even if the output *were* copyrightable, the provider has contractually
   declined to grant exclusivity.
2. **A third party using near-identical audio is not necessarily infringing.** Do not send a
   takedown on the assumption that similarity implies copying.

This is the contractual confirmation of the wording adopted in §7. "Zero State holds all rights
necessary to use and distribute" is accurate. "Zero State owns this music" is not.

## 3C. No warranty, no indemnity — the residual risk sits with Zero State

Music is provided **"as is" and "as available"**, with all warranties disclaimed **including
non-infringement**. There is no indemnity for Music Output in these terms.

Practical meaning: if a Music track is later alleged to infringe, ElevenLabs has warranted
nothing about it, and the exposure sits with Zero State. This is not a reason to avoid the
product — it is standard for generative audio — but it is a reason to (a) keep §6 input hygiene
strict, and (b) be able to prove which prompts produced which assets, which is what the
generation records in §5 are for.

Recorded as risk **R9** below.

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
**you supplied as input**, and the Music Service Terms §2(b) set out an explicit, contractual
list of prohibited inputs. Customer must not submit as part of the Input:

- any **artist's** real or stage name (living or deceased);
- any **songwriter's** real or stage name (living or deceased);
- any **song title**;
- any **album title**;
- any **music publisher** company name;
- any **music label** name;
- a substantial or distinct portion of any song's **lyrics**, such that a reasonable person
  would determine the prompt was intended to reference a particular song.

Separately, §2(c)–(d) prohibit prompting or inducing Output that is known or reasonably likely
to infringe, **deploying** such Output, and generating Output that replicates or mimics a
recording artist's voice, likeness, or identifiable characteristics in a misleading way.

Note that §2(c)(ii) is a **deployment** obligation, not just a generation one: shipping Output
you should have known was likely infringing is itself a breach, regardless of how it was
prompted.

Zero State must attest, per batch, that none of the above occurred. A violation here is not
cured by the paid plan.

### Prohibited industries (§2(a))

Music may not be used by customers operating in: firearms or weapons, tobacco, prescription
pharmaceuticals or controlled substances, adult entertainment, religious organisations, or
political advocacy or campaigning. **Zero State is a software company and none of these apply** —
recorded here so the check is documented rather than assumed.

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
| R10 | SFX Outputs sublicensed to third parties by default; opt-out is not retroactive | **High (time-sensitive)** | **Open** | Check the "Disable" toggle now (§2A); record its state and date |
| R9 | No warranty of non-infringement and no indemnity for Music Output; exclusivity expressly disclaimed | Medium | **Accepted** | Keep §6 input hygiene strict; retain generation records so prompt-to-asset lineage is provable |

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
