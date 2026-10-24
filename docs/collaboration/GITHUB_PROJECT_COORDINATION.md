# GitHub Project Coordination

[Waykin — Agent Execution](https://github.com/users/scrimshawlife-ctrl/projects/1) is Project #1 and the sole live workflow-state authority. [Issue #47](https://github.com/scrimshawlife-ctrl/Waykin/issues/47) defines the coordination contract. This document and `ACTIVE_WORK.md` are repository-readable protocol and snapshot surfaces; repository product and architecture documents retain their precedence.

## Scoped issue-local coordination — 2026-10-13

The user authorized Codex to take over the missing SPECS 27 TypeScript core
port and update Kanban/repository docs. For
[`Zero-State-LLC/Waykin#23`](https://github.com/Zero-State-LLC/Waykin/issues/23)
only, the issue's execution table and structured claim replace the legacy
board as live workflow authority while that board is inaccessible. This is
an explicit exception to the board prerequisite, not a claim that Project #1
was updated or that the port is complete.

Current status: **In Progress**, owner **Codex (/root)**, lane **IMPLEMENT**.
The structured claim on #23 records branch `codex/23-specs27-core-port`, base
SHA and intended/frozen paths. The companion slice is implemented locally;
complete port and parity acceptance remain open.
`ACTIVE_WORK.md` is the repository-readable Kanban snapshot. Legacy board sync
is **PENDING / NOT_COMPUTABLE** until a live read-back confirms it. Reconcile
only this item when access returns; preserve unrelated board values.

Parity, validation, one-owner and physical-evidence rules are unchanged.
Missing compiler dependencies and the Swift sandbox restriction block test
execution, not ownership authorization. They must remain visible and must
not be converted into passing evidence. All other items retain the existing
Project #1 protocol below.

## Fields

User-approved extension (2026-10-13): #27 also uses issue-local coordination
for the bounded research-harness repair. Owner Codex (/root), lane IMPLEMENT,
branch `codex/23-specs27-core-port`, base
`c353b7f9d6ac7f36e7b9ba1a13633155c0413ba7`. Preserve the full historical replay;
separate cold/warm lifecycle histories. Production stays frozen. Legacy board
sync is pending for both #23 and #27; all other items retain Project #1 authority.

| Field | Meaning |
|---|---|
| Execution Status | Intake, Ready, Claimed, In Progress, Review, Validation, Blocked, or Done |
| Workstream | Bounded product or governance ownership area |
| Agent | Exact identity or `UNASSIGNED` |
| Agent Lane | IMPLEMENT, REVIEW, TEST, DOCS, DEVICE, or GOVERNANCE |
| Priority | P0 through P3 |
| Risk | Low, Medium, or High |
| Dependency | Resolved or unresolved issue/PR references, or `NONE` |
| Base SHA | Exact starting `main` commit once claimed; blank while unclaimed |
| Head SHA | Current branch or completed receipt commit; blank before a branch/build exists |
| Handoff State | NONE, REQUESTED, READY, ACCEPTED, or REJECTED |
| Evidence | NOT_STARTED, PARTIAL, PASS, FAIL, or NOT_COMPUTABLE |

`Execution Status` is distinct from GitHub's built-in `Status`. Allowed forward transitions are `Intake -> Ready -> Claimed -> In Progress -> Review -> Validation -> Done`. Move any state to `Blocked` when a declared dependency prevents progress; after resolution return it to the prior actionable state. Reopened work returns to `Ready`. Review may return to `In Progress`, and failed validation opens a bounded defect rather than silently expanding the original task.

## Claim Protocol

Claim only a `Ready` item whose dependencies are resolved and whose implementation surface has no other owner. Add this Issue #47 schema before editing:

```yaml
agent_claim:
  agent: <exact identity>
  lane: IMPLEMENT|REVIEW|TEST|DOCS|DEVICE|GOVERNANCE
  issue: <number>
  branch: <branch>
  base_sha: <40-character sha>
  intended_paths:
    - <path or glob>
  frozen_paths_acknowledged: true
  dependency_state: RESOLVED|BLOCKED
  status: CLAIMED
```

One issue has one implementation owner. Review, test, docs, device, and governance lanes may run concurrently only when their writable paths do not overlap production work. Blocked items may not begin speculatively. Dependencies must name the issue or PR and be resolved before status advances.

## Handoff Protocol

```yaml
agent_handoff:
  issue: <number>
  agent: <exact identity>
  branch: <branch>
  base_sha: <40-character sha>
  head_sha: <40-character sha>
  files_changed: [<path>]
  acceptance_criteria:
    passed: [<criterion>]
    pending: [<criterion>]
  validation:
    commands: [<exact command>]
    result: PASS|FAIL|PARTIAL|NOT_RUN
    test_totals: <exact totals or NOT_COMPUTABLE>
  observed: [<direct evidence>]
  inferred: [<supported conclusion>]
  blockers: [<blocker or NONE>]
  handoff_state: READY
```

The accepting agent verifies the SHA, dependencies, paths, and evidence before setting `ACCEPTED`. A rejected handoff records the bounded reason.

## Evidence and Scope

- `OBSERVED` is directly verified command, repository, API, simulator, or named-device evidence.
- `INFERRED` is an evidence-supported conclusion.
- `NOT_COMPUTABLE` means the required interface or evidence is unavailable.

Physical GPS, device audio, AR tracking, interruption recovery, battery, thermal, and outdoor usability remain `NOT_COMPUTABLE` without direct evidence from the named device and exact build. The board is governance infrastructure only: it does not authorize multiplayer, a marketplace, creator tooling, backend/accounts, narrative or AI gameplay runtimes, additional companions, or any other solo-MVP expansion.

## Automation Limits and Manual Setup

The synchronization script owns fields, initial items, and their values. GitHub CLI and the documented public GraphQL mutation surface do not provide verified creation or editing for Project v2 saved views or built-in workflows; those remain `NOT_COMPUTABLE` to automation.

In Project #1, manually create these views: **Execution Board** (board by Execution Status, exclude Done), **Dependency Queue** (table by Dependency), **Agent Lanes** (board by Agent Lane), **Validation Gate** (Review or Validation), **Solo MVP Guard** (table by Workstream), and **Completed Receipts** (Done). In project Settings, configure supported built-in workflows for new items to Intake, assignment to Claimed, linked active PR to In Progress, review to Review, merge with pending validation to Validation, close to Done, reopen to Ready, and unresolved dependencies to Blocked. Verify every setting in the UI; unsupported conditional behavior remains manual.

## Drift Recovery

Run `./scripts/sync_github_project.sh --check`. It reports missing bootstrap data, duplicate or foreign item identity, truncated API results, and schema drift without mutating Project #1. Populated values are live Project state, not bootstrap drift. Review every mismatch and confirm Project #1 and Issue #47 before mutation. Run `--apply` to create missing fields, add missing initial items, and fill blank bootstrap values without overwriting populated live workflow state, deleting unrelated data, or blanking SHAs. Schema and item-inventory drift fail closed before item mutation. Audit current workflow values directly in Project #1, then run `--check` again and attach its dated receipt to Issue #47. If select options drift, do not create a duplicate field: repair options manually in Project settings, then rerun check.
