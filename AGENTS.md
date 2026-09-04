# Waykin Agent Operating Contract

## Authority Before Action

Before editing, read:

1. `docs/SOLO_MVP_SCOPE.md`
2. `WAYKIN_SPEC.md`
3. `README.md`
4. `ARCHITECTURE.md`
5. The approved issue and relevant ADRs

When instructions conflict, follow `docs/governance/DOCUMENT_AUTHORITY.md`.

## Scope Rules

- Implement only approved issue acceptance criteria.
- Treat documents marked `FUTURE`, `REFERENCE_ONLY`, or `DEFERRED` as non-authorizing.
- Prefer the smallest coherent patch.
- Extend existing owners rather than creating parallel systems.
- Do not expand product scope incidentally while refactoring.
- Do not add Abraxas runtime dependencies or generalized symbolic infrastructure.

## Architecture Rules

- Keep `WaykinCore` free of ARKit, RealityKit, SwiftUI, MapKit, and audio filenames. Do not add new platform imports. Grandfathered baseline exceptions (see `scripts/core_isolation_baseline.txt` and `scripts/check_core_framework_isolation.sh`) are the only allowed CoreLocation/SwiftData seams until an issue removes them.
- Preserve deterministic behavior where it already exists.
- Preserve movement, Bond, persistence, field-receipt, safety, and semantic-audio ownership unless the issue explicitly authorizes a change.
- Presentation and device adapters consume semantic state; they do not own gameplay truth.

## Evidence Rules

Use only:

- `OBSERVED` for directly verified evidence.
- `INFERRED` for evidence-based conclusions.
- `NOT_COMPUTABLE` when evidence is missing.

Never claim physical GPS, device audio, AR tracking, interruption recovery, battery, thermal, or outdoor usability behavior without direct device evidence.

## Grok Build Skills (shared)

Repo-tracked skills live in `.grok/skills/waykin-*` and are available to **every collaborator** after `git pull` (no personal install required when CWD is Waykin). Source pack: `skills/`. Optional: `./skills/install.sh --user-only`.

Prefer slash skills for repeatable work: `/waykin-validate`, `/waykin-build`, `/waykin-pr-review`, `/waykin-ar-debug`, `/waykin-device-testing`, etc. Skills must not invent outdoor PASS or bypass issue scope.

## Required Validation

```bash
make build
make test
make validate
git diff --check
```

Also run:

- `make validate-simulator` for simulator-visible behavior.
- The relevant physical-device protocol for device-dependent behavior.

Report commands, results, changed files, assumptions, and unresolved evidence. Do not report completion while required checks are failing.

## GitHub Project Coordination

For issue-scoped work, read canonical coordination [Issue #47](https://github.com/scrimshawlife-ctrl/Waykin/issues/47) and verify the item in [Waykin — Agent Execution](https://github.com/users/scrimshawlife-ctrl/projects/1) before editing.

- Claim `Ready` work before editing; record the agent, lane, branch, exact base SHA, intended paths, frozen paths, and dependency state.
- Respect declared frozen paths and keep one implementation owner per issue. Review, test, and documentation work may overlap only when production paths do not.
- Record branch and base SHA at claim time, then provide the structured handoff defined in `docs/collaboration/GITHUB_PROJECT_COORDINATION.md`.
- When validation reveals a defect, open a separate bounded defect issue instead of expanding the validating task.
- Never convert physical-device assumptions into `OBSERVED`; use `NOT_COMPUTABLE` until the named device and build are directly exercised.

## Intent

Non-trivial changes start with an `intent.md` copied from [`intent/_TEMPLATE.md`](intent/_TEMPLATE.md). See [`intent/README.md`](intent/README.md). Next stage is `spec.md` / plan: the approved issue, and an ADR when ownership, persistence, determinism, or approved scope changes. Trivial docs and chore fixes do not need an intent file.

## Escalation

If CI, tests, or validators look wrong — broken coverage, silent skips, green-but-inert checks, or a suite that contradicts the spec:

1. Open a bounded defect issue labeled `bug`. Do not expand the current task to paper over it.
2. Do **not** weaken, skip, or rewrite assertions to obtain a passing result.
3. Reward-hacking is forbidden: no silent skips, no fixture forgery, no green-at-any-cost edits.

A red honest check is better than a green lie.

## Team context

Org and partner status is not this repo. When a task needs cross-repo or partner state, load [Zero-State-LLC/agent-context](https://github.com/Zero-State-LLC/agent-context):

1. `HANDOFF.md`
2. `STATUS.md`
3. `DECISIONS.md` only if a prior choice affects this task

Clone: `gh repo clone Zero-State-LLC/agent-context ~/agent-context`. Pull `--ff-only` before trusting a local copy.
