# Live Swift parity validation — 2026-10-13

Network access and Swift execution were restored by a user-side permission
change. GitHub CLI authentication now succeeds; the prior invalid-token
message was not reliable while DNS was unavailable.

OBSERVED:
- `make build` passes after correcting exporter entry-file naming and optional
  JSON typing. Entry point is now `Sources/WaykinVectorExport/WaykinVectorExport.swift`.
- `make test` passes all 134 Swift tests, including #25 paused runToEnd.
- #25 reference fix recorded in commit `9f2b6b1`; no other Swift runtime change.
- `make vectors` generates all six families from actual Swift. A second run
  produces identical SHA-256 hashes for all 16 JSON files.
- `npm ci` succeeds using the lockfile; typecheck, ES2019 typecheck and isolation
  pass. `npm test`: 85 tests, 84 pass, one fails, zero skipped.
- Companion, pursuit, Bond/memory, demo and seed-event replays pass.
- Movement replay fails at step 11: fallback speed is 2.223901604670658 in TS
  versus 2.2263898158654714 in Swift. Existing exact speed assertions remain
  intact; production Haversine and D-100 remain unchanged.
- Repository validation reports collaboration-template failures already tracked
  separately (#24). Native best-effort WaykinApp xcodebuild finished PASS.

Draft PR: https://github.com/Zero-State-LLC/Waykin/pull/26.
GitHub run 38456456558 independently passes Swift vector freshness and all
134 Swift tests. Its repository-validation step fails earlier than local
validation because XcodeGen is absent on the runner. Installing that CI
prerequisite was subsequently approved and added in commit `5e3e9f5`.
Follow-up run [38458584302](https://github.com/Zero-State-LLC/Waykin/actions/runs/38458584302)
is complete: XcodeGen installation and generation pass, as do Swift package
build/tests and vector freshness. Repository validation now reaches the
separate #24 collaboration-template failure: three required issue templates
are absent and the PR template lacks required metadata and sections.
TypeScript CI still reproduces the same movement step-11 mismatch
(84 pass, one fail). Full acceptance remains red; no parity assertions were
relaxed and no production distance model changed.

Full port/T044 remain incomplete. The draft PR is for validation, not merge.
The approved ellipsoidal experiment remains isolated; adoption requires a
separate production decision. No physical Lens behavior is established.

Local logs: `/private/tmp/waykin-unblocked-{build,test,vectors,node,validate}.log`.
Earlier receipts are historical checkpoints, superseded by this evidence.
