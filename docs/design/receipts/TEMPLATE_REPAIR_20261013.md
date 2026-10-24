# Issue #24 template repair — 2026-10-13

Authority: user explicitly approved repairing the missing issue forms and PR
template while preserving local edits. Claim recorded on #24, comment
6154107088. Starting commit: `5e3e9f545773f53ad3fcff61727ed22ed5914ef7`.

OBSERVED:

- Three coordination forms were removed by an earlier template change. Restored
  `agent-task.yml`, `validation-task.yml` and `defect.yml` byte-for-byte from
  `5a939d4`, rather than rewriting or weakening validator requirements.
- Git tracked both `.github/PULL_REQUEST_TEMPLATE.md` and
  `.github/pull_request_template.md`; these collide on this macOS filesystem.
  Kept the lowercase canonical path required by the validator, restored its
  historical coordination metadata, and retained both current template bodies,
  including the local collaboration checklist. Removed only the duplicate
  uppercase index entry. Its original contents remain recoverable in Git and
  are also included in the consolidated template.
- Ruby verification confirms exact form restoration, preservation of both
  current template bodies, and no indexed `.github` case collisions.
- `python3 scripts/validate_collaboration_coordination.py`: PASS (8 files,
  11 documented fields). Validator source unchanged.
- `make build`: PASS.
- `make test`: PASS, 134 tests, zero failures.
- `make validate`: PASS, including coordination validation and native app build.
- `git diff --check`: PASS before this receipt; rerun at handoff.

Logs: `/private/tmp/waykin-template-{build,test,validate}.log`.

NOT_COMPUTABLE: legacy Project #1 sync; `gh project view` reports missing
`read:project` scope. No board mutation or verified board status is claimed.
No simulator-visible or runtime changes; no physical-device evidence supplied.

This is separate from #23's movement-parity failure. Passing repository
validation does not mean the TypeScript port passes parity. The distance
design is proposal-only; gameplay, fixtures, assertion tolerances and
production distance implementations are untouched. Remote CI for this repair
has not yet run, and #24 remains open pending review.
