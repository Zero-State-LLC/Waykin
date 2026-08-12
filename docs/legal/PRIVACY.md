# Waykin Privacy Notice

```yaml
document_id: WAYKIN-LEGAL-PRIVACY
version: 2.0
date: 2026-08-11
status: READY_FOR_RELEASE
supersedes: 1.0 (2026-07-20, DRAFT_FOR_PRODUCT_REVIEW)
```

**Last updated:** 11 August 2026

This notice describes how the **Waykin** iOS application handles information. It supplements the
[Zero State Privacy Policy](https://zer0state.com/privacy.html). Where this notice is more
specific about Waykin, this notice governs.

Waykin uses sensitive device data — location, camera, and optionally Health. **None of it is
transmitted to Zero State.** This notice explains exactly what is used, when, and where it goes.

---

## Summary

| Topic | Practice |
| --- | --- |
| Data transmitted to Zero State | **None** |
| Accounts or sign-in | **None** |
| Analytics or crash-reporting SDKs | **None** |
| Advertising or tracking identifiers | **None** |
| Third-party SDKs | **None** |
| Selling or sharing personal data | **No** |
| Location | Used **only during an active walk**, with permission, on-device |
| Camera | Used **only during an active AR session**; frames are never stored or uploaded |
| Health | **Optional**; read-only, on-device. Demo Mode never requires it |

Waykin has no remote analytics and no upload path. There is no Zero State server for your data
to go to.

---

## What Waykin uses, and why

### Location — only while you are walking

- **Purpose:** measure distance, pace, and route progress during an **active** movement session.
- **When:** only after you begin a walk and grant **"While Using the App"** permission. Waykin
  does not request Always-On location and does not track you in the background when you are not
  walking.
- **Where it goes:** stays on your device. A map breadcrumb may be shown for the current walk.
- **Not used for:** advertising, resale, profiling, or background tracking.

### Camera — only during AR

- **Purpose:** place the companion and session presentation in the real world (ARKit/RealityKit).
- **When:** only when you open AR during a session and grant camera access.
- **Where it goes:** frames are processed live for AR display. They are **not recorded, saved,
  or uploaded**, and Waykin has no photo export or social sharing feature.

### Health — entirely optional

- **Purpose:** optional enrichment during an active walk (recent steps, walking distance).
- **When:** only if you grant Health access. **Demo Mode never requires it**, and the app is
  fully usable without it.
- **Where it goes:** read-only, on-device. It is **never** used for advertising, never shared
  with third parties, and never used to build a medical or fitness profile.

> Apple prohibits using HealthKit data for advertising or sharing it with third parties for
> those purposes. Waykin does neither.

### Maps and search — handled by Apple

When you search for a place or request directions, Waykin uses **Apple's MapKit**. That query
goes to **Apple**, not to Zero State, and is governed by
[Apple's Privacy Policy](https://www.apple.com/legal/privacy/). Zero State never receives it.

### On-device storage

Waykin keeps the following locally (SwiftData and the standard preferences store):

- companion bond state and session **memories** you create
- appearance preference and cosmetic selection
- walk history for the sessions you complete

Deleting the app removes all of it.

## What Waykin does not do

- Send your location, camera frames, Health data, or walk history to Zero State or anyone else
- Require an account, social network, or multiplayer identity
- Collect advertising or tracking identifiers, or use AppTrackingTransparency
- Include analytics, attribution, advertising, or crash-reporting SDKs
- Sell, share, or broker personal information
- Claim to provide medical, fitness-coaching, navigation-safety, or emergency services

## Your choices

Every permission is optional and the app degrades gracefully:

- **Deny location** → use Demo Mode, which runs fully offline.
- **Deny camera** → skip AR; walks still work.
- **Deny Health** → walks and Demo Mode still work.
- **Revoke anything later** → iOS Settings → Privacy & Security, or Settings → Waykin.
- **Remove everything** → delete the app.

Because no data reaches Zero State, there is nothing for us to access, export, or delete on your
behalf. Statutory rights (EEA/UK GDPR, California CCPA/CPRA) are addressed in the
[Zero State Privacy Policy](https://zer0state.com/privacy.html); as to Waykin specifically, there
is no server-side data to which they would attach.

## Children

Waykin is not directed to children under 13. It involves walking in the physical world; adults
should judge whether it is appropriate for a young person and supervise accordingly.

## Safety

Waykin is a movement companion, not a navigation or safety system. Stay aware of traffic,
terrain, and surroundings. Do not use AR while crossing roads. See
[`SAFETY.md`](SAFETY.md).

## Apple's own collection

If you install through **TestFlight**, Apple may collect crash logs, device information, and any
feedback you submit, and may share it with us. That is Apple's collection under Apple's policy,
not ours.

## Changes

Material changes bump `version` and `date` above and are noted in release notes. If a future
version adds accounts, cloud sync, analytics, or any upload path, this notice and the App Store
privacy labels will be updated **before** that version ships.

## Contact

Zero State LLC — zer0state@zer0state.com
