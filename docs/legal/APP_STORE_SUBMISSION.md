# Waykin — App Store Connect submission answers

```yaml
document_id: WAYKIN-LEGAL-APPSTORE
version: 1.0
date: 2026-08-11
status: READY_FOR_SUBMISSION_PENDING_AUDIO_GATE
target: TestFlight → App Store, iOS
```

Waykin is the most permission-heavy app in the portfolio — location, camera/AR, and optional
HealthKit. That means more review scrutiny than the games, and several answers that must be
given deliberately rather than by pattern-matching the other apps.

---

## 1. App Privacy — nutrition labels

**Answer: "Data Not Collected"** — but give this one deliberately, because it is counter-intuitive
for an app that reads location and Health.

Apple defines *collect* as transmitting data off the device in a way that lets you or your
partners access it for longer than needed to service a real-time request. Waykin:

- has **no Zero State server** and no upload path;
- has **no analytics, attribution, advertising, or crash-reporting SDK**;
- processes location, camera frames, and Health data **entirely on-device**;
- sends map search and directions queries to **Apple's MapKit**, which services them in real
  time under Apple's own policies.

None of that meets Apple's definition of collection by the developer. Verified by source
inspection: no `URLSession`, no `URLRequest`, no networking stack of any kind.

| Prompt | Answer |
| --- | --- |
| Do you or your third-party partners collect data from this app? | **No** |

> **Re-check trigger.** Adding cloud save, accounts, leaderboards, crash reporting, or any
> upload of walk history makes this false immediately. Location and Health are exactly the
> categories Apple scrutinises hardest, so this answer must be re-derived — not carried forward —
> on any release that adds a network path.

---

## 2. Privacy manifest

Already present at `App/Resources/PrivacyInfo.xcprivacy`, declaring `NSPrivacyTracking = false`,
empty collected-data types, and `NSPrivacyAccessedAPICategoryUserDefaults` with reason `CA92.1`.

Confirm it is in the app target's **Copy Bundle Resources**.

---

## 3. HealthKit — the highest-scrutiny item

Waykin requests `com.apple.developer.healthkit` and reads step and walking-distance data.

Apple's HealthKit rules (Guideline 5.1.3) are strict and are enforced in review:

| Requirement | Waykin's position |
| --- | --- |
| Must have a privacy policy | ✅ `zer0state.com/privacy.html` + [`PRIVACY.md`](PRIVACY.md) |
| Must not use Health data for advertising or marketing | ✅ No advertising of any kind |
| Must not disclose Health data to third parties without consent | ✅ Never leaves the device |
| Must not write false or inaccurate data | ✅ Read-only; Waykin writes nothing |
| Purpose strings must be clear | ✅ `NSHealthShareUsageDescription` present |
| Must function if permission is denied | ✅ Optional; Demo Mode never requests it |

**Review notes should state plainly that Health access is optional and read-only.** Reviewers
routinely test denial paths on HealthKit apps.

⚠️ **Do not add a HealthKit *write* capability** without revisiting this section — writing
health data raises a materially different set of obligations.

---

## 4. Location

- Requests **When In Use** only, not Always. No background location mode.
- `NSLocationWhenInUseUsageDescription` present and specific.
- Used only during an active walk; app is fully usable in Demo Mode without it.

If a background or Always-On mode is ever added, Apple requires a much stronger justification
and the privacy label answer in §1 must be revisited.

## 5. Camera / ARKit

- `NSCameraUsageDescription` present.
- Frames are used live for AR only — never recorded, saved, or uploaded.
- No photo library access, no export or sharing feature.

---

## 6. Suggested App Review notes

> Waykin is a solo walking companion. It requires no account and has no server — all data stays
> on the device, and the app contains no analytics, advertising, or third-party SDKs.
>
> Permissions are all optional and the app degrades gracefully:
> • **Location (When In Use)** — measures distance and pace during an active walk only.
> • **Camera** — AR placement during a session; frames are never stored or uploaded.
> • **Health (optional, read-only)** — reads recent steps/walking distance to enrich a walk.
>   Waykin writes no health data and never uses it for advertising. **Demo Mode requires no
>   permissions at all** and is the fastest way to review the experience.
>
> Map search and directions use Apple MapKit; those queries go to Apple, not to us.
>
> Audio cues were generated with ElevenLabs during development under a paid commercial licence
> held by Zero State. They are static files bundled with the app; it performs no AI processing
> at runtime and transmits no data to any third-party service.

---

## 7. Content rights — Guideline 5.2.1

| Asset class | Basis | Evidence |
| --- | --- | --- |
| Audio (11 cues) | ElevenLabs paid commercial licence, Zero State account | `docs/audio/rights/AUDIO_RIGHTS_LEDGER.json` — gate must PASS |
| Companion art / models | Zero State work product | Record in a visual-rights ledger |
| Code | Zero State, ZSPL-1.0 | `LICENSE` |
| Third-party code | None bundled | `docs/legal/NOTICES.md` |

**Provenance correction (2026-08-11).** `docs/AUDIO_ASSET_CONTRACT.md` previously described these
cues as owner-rendered with first-party licensing. That was inaccurate — they were **generated
with ElevenLabs**, and the contract has been corrected. The
[ElevenLabs determination](../audio/rights/ELEVENLABS_LICENSE_DETERMINATION.md) applies to Waykin
after all.

Ten cues are ElevenLabs Sound Effects, which carry no games carve-out. `lira_launch_theme.wav`
is **Eleven Music** (confirmed by owner 2026-08-11), which does.

⚠️ **Waykin is therefore cleared for iOS App Store only.** One Eleven Music asset is enough —
the carve-out attaches to the use of the output, not to how much of it there is. Shipping on a
second platform while monetised requires an **ElevenLabs Enterprise agreement first**. If a
cross-platform release is ever planned, replacing that single 10-second track is likely cheaper
than negotiating an Enterprise licence for it.

> **Blocking dependency.** `python3 scripts/validate_audio_rights.py` returns **BLOCKED** until
> that record is filed. Internal TestFlight can proceed; external distribution should not.

---

## 8. Export compliance

Waykin makes no network calls of its own and implements no custom cryptography. MapKit traffic
is Apple's. Add to `App/Info.plist`:

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

## 9. Age rating

Waykin has no violence, no user-generated content, and no chat. Expect a low rating (4+ or 9+).
Answer honestly on any real-world-location prompts.

Because the app encourages walking outdoors, keep the safety framing in the description and
ensure [`SAFETY.md`](SAFETY.md) content is reflected in-app.

## 10. Required URLs

| Field | Value |
| --- | --- |
| Privacy Policy URL | `https://zer0state.com/privacy.html` — **mandatory for HealthKit apps** |
| Support URL | Required — a real page with a contact route |
| Marketing URL | `https://zer0state.com/products/waykin.html` (optional) |

## 11. Account deletion — not applicable

No accounts. Becomes mandatory if sign-in is ever added.

## 12. Pre-submission checklist

- [ ] `PrivacyInfo.xcprivacy` confirmed in Copy Bundle Resources
- [ ] `ITSAppUsesNonExemptEncryption` set
- [ ] Privacy policy URL live (**required** for HealthKit)
- [ ] Support URL live
- [ ] Review notes pasted (§6), including the Demo Mode hint
- [ ] Permission denial paths tested — location denied, camera denied, Health denied
- [ ] **`validate_audio_rights.py` returns PASS** (§7)
- [ ] Age rating questionnaire completed
- [ ] Screenshots for all required device sizes
