# Companion parity infrastructure checkpoint

2026-10-13 — #23 — codex/23-specs27-core-port, uncommitted.

Added Sources/WaykinVectorExport/CompanionVectors.swift and wired it into the
existing exporter. Swift computes expected values through actual WaykinCore
runtime and presentation APIs: 22 event/movement cases, 1,295 AR overlay cases
(behavior × pursuit × path × pressure boundaries, plus event precedence), and
18 sequential commands including invalid distances and ignored commands.

Added contracts/companion-vectors.schema.json, a strict test-side interpreter
for the schema vocabulary, and a read-only replay test. The test requires the
family rather than skipping missing vectors. No Tests/Vectors files were
created or changed by TypeScript or by hand.

OBSERVED checks:
- Swift frontend syntax parsing of both exporter files passes. This is not
  Swift typechecking, executable generation, or actual fixture generation.
- Fallback TypeScript 6.0.3 package build passes.
- Node suite: 77 total, 76 pass, 1 fail, zero skips. The failure is explicitly
  missing Tests/Vectors/companion; it must be resolved by the Swift exporter.
- Existing seed/event fixtures still pass, but are not fresh full-core evidence
  after the approved #25 Swift guard edit.

Remaining: execute and typecheck exporter, generate companion fixtures from
Swift, run exact replay, and implement movement/pursuit/bond-memory/demo
exporters with per-family schemas and readers. Full parity/T044 not complete.
Canonical build/test/validate remain blocked as documented in the demo receipt.
