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
  separately (#24). Native best-effort build was still running when recorded.

Full port/T044 remain incomplete. The draft PR is for validation, not merge.
The approved ellipsoidal experiment remains isolated; adoption requires a
separate production decision. No physical Lens behavior is established.

Local logs: `/private/tmp/waykin-unblocked-{build,test,vectors,node,validate}.log`.
Earlier receipts are historical checkpoints, superseded by this evidence.
