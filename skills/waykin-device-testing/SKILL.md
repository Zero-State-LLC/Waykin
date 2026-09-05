---
name: waykin-device-testing
description: >
  Prepare and run Waykin physical-device / outdoor field testing with privacy-safe
  receipts and checklists. Use when /waykin-device-testing, outdoor QA, device
  walk, field receipt, or issue #41.
metadata:
  short-description: "Device & outdoor field testing"
  pack: waykin-skill-pack
  version: "1.0.0"
---

# waykin-device-testing

Automate **readiness and evidence**, not fake outdoor PASS. Human must hold the phone for true device rows.

## 0. Authority docs

- `docs/FIELD_TEST_PROTOCOL.md`
- `docs/PHYSICAL_DEVICE_WALK_VALIDATION.md`
- `docs/design/OUTDOOR_QA_CHECKLIST.md`
- `docs/design/OUTDOOR_QA_RECEIPT_TEMPLATE.md`
- `docs/design/OUTDOOR_SESSION_PACKET.md`
- `docs/design/DEFERRED_RECOMMENDATIONS.md` (outdoor packet)
- Issue **#41** for outdoor AR readability

## 1. Build tip for device

```bash
cd "$(git rev-parse --show-toplevel)"
SHA=$(git rev-parse --short HEAD)
make generate
# Build Debug only (build-only; does not install or launch)
xcodebuild -scheme Waykin -destination 'platform=iOS,id=<DEVICE_ID>' \
  -derivedDataPath /tmp/waykin-dd-device build
```

Record **exact SHA** on every receipt. Prerequisites: macOS, full Xcode,
XcodeGen, a paired/unlocked Developer Mode iPhone, and valid user-owned signing.
Missing prerequisites/signing are NOT_COMPUTABLE; do not invent profiles.
Record the build command exit status immediately, and stop if nonzero.

Installation and launch are separate user-approved steps. Use Xcode's Run action
on the selected device after the build, or the installed Xcode's `xcrun devicectl`
CLI after checking its `device install app --help` and `device process launch --help`.
Select the actual built `.app` and read its bundle identifier from Info.plist;
do not guess either. This build-only recipe does not perform those operations.
Record `build_exit`, `install_exit`, and `launch_exit` separately (NOT_RUN until
attempted), the exact device/build identity, command or Xcode action, and evidence
path. On install failure, launch stays NOT_RUN. On launch failure, field testing
stops. A successful build cannot supply either install_exit or launch_exit.


## 2. Preflight (sim first)

```bash
./scripts/sim_walk_preflight.sh
./scripts/outdoor_qa_prep.sh   # scaffolds receipt under docs/design/receipts/
WAYKIN_CAPTURE_FULL=1 ./scripts/capture_sim_screenshots.sh  # SIMULATOR class only
```

## 3. Operator flags on device

- Debug build: operator strip ON
- Release field: launch with `-WAYKIN_OPERATOR_DEBUG`
- Settings → Field-test receipts → Share latest JSON (schema 5)
- Console: subsystem `life.scrimshaw.waykin`

## 4. Checklists to generate for the human

### Indoor smoke (when outdoor blocked)

- [ ] Cold launch / splash / Home Begin Walk
- [ ] Demo complete → Summary → Memory
- [ ] Real walk permission path (When-In-Use only)
- [ ] AR open: plant, continuity hint, Pause/End mirrored
- [ ] Reduce Motion stills
- [ ] Share receipt JSON; confirm `arPresentation` / `mapPresentation` / `persistenceOperator`

### Outdoor COH (#41) — daylight

Use outdoor packet from `DEFERRED_RECOMMENDATIONS.md`:

1. World plant + re-plant / tracking loss  
2. A1 head · A2 core · A3 filament in sun  
3. Hero mesh + hybrid motion legible  
4. Reduce Motion + skin swap  
5. Route create + map chrome sane  
6. Fill COH with **OBSERVED** only  

## 5. Evidence rules

| Claim | Allowed from |
|-------|----------------|
| Sim UI layout | sim screenshots `docs/assets/screenshots/` |
| Software AR LOD labels | receipt `arPresentation` |
| Outdoor readability | device outdoor receipt only |
| Battery / thermal | device stopwatch notes; never invent |

Battery/thermal: instruct human to note % start/end, thermal state subjective; mark `NOT_COMPUTABLE` if not recorded.

## 6. Receipt output

Write or fill under `docs/design/receipts/`:

```text
OUTDOOR_QA_RECEIPT_<UTC>_<sha>.md
```

YAML header must include: `evidence_class`, `git_sha`, `device_model`, `ios_version`, `operator`.

## 7. Report

```markdown
## Device testing readiness
- Tip SHA:
- Sim preflight: PASS/FAIL
- Outdoor scaffold path:
- Human checklist: indoor | outdoor
- Receipts expected:
- Explicit non-claims:
```

Never mark #41 PASS without a human-filled outdoor receipt on that tip.