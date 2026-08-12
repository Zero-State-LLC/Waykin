#!/usr/bin/env python3
"""Fail closed when shipping audio lacks verified chain-of-title.

Release gate. Compares the audio actually present on disk against the rights
ledger and blocks unless every shipping file is evidenced and cleared.

Differs from a manifest-driven gate: the filesystem is the authority on what
ships, so an asset added without a ledger row is a blocker rather than an
invisible omission.

Exit codes: 0 PASS, 1 BLOCKED, 2 usage/structural error.

Usage:
    python3 scripts/validate_audio_rights.py
    python3 scripts/validate_audio_rights.py --json   # machine-readable, for CI
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any

AUDIO_SUFFIXES = {".mp3", ".wav", ".m4a", ".caf", ".aiff", ".aif", ".ogg"}
SHA256 = re.compile(r"^[a-f0-9]{64}$")

VALID_PRODUCTS = {
    "elevenlabs_sound_effects",
    "elevenlabs_music_v1",
    "elevenlabs_music_v2",
    "elevenlabs_speech",
}
# Products carrying the Eleven Music "Studio Games" carve-out. Cleared for a
# single monetised platform; a second platform requires an Enterprise agreement.
MUSIC_PRODUCTS = {"elevenlabs_music_v1", "elevenlabs_music_v2"}

BETA_OK = {"confirmed_not_beta", "beta_separately_cleared"}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load(path: Path, root: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise SystemExit(f"ERROR missing required file: {path.relative_to(root)}")
    except json.JSONDecodeError as exc:
        raise SystemExit(f"ERROR invalid JSON in {path.relative_to(root)}: {exc}")
    if not isinstance(value, dict):
        raise SystemExit(f"ERROR ledger root must be an object: {path.relative_to(root)}")
    return value


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=None)
    parser.add_argument("--sounds", default="App/Resources/Audio")
    parser.add_argument("--ledger", default="docs/audio/rights/AUDIO_RIGHTS_LEDGER.json")
    parser.add_argument("--json", action="store_true", dest="as_json")
    args = parser.parse_args()

    root = Path(args.root).resolve() if args.root else Path(__file__).resolve().parents[1]
    sound_root = root / args.sounds
    ledger = load(root / args.ledger, root)

    errors: list[str] = []
    warnings: list[str] = []

    evidence = {
        item.get("evidence_id"): item
        for item in ledger.get("evidence", [])
        if isinstance(item, dict) and item.get("evidence_id")
    }
    for ev_id, item in evidence.items():
        digest = item.get("sha256")
        if not isinstance(digest, str) or not SHA256.fullmatch(digest):
            errors.append(f"evidence {ev_id}: sha256 missing or malformed")
        locator = str(item.get("storage_locator") or "")
        if locator.startswith("private://pending/"):
            errors.append(f"evidence {ev_id}: still a pending placeholder slot")

    records = {
        item.get("path"): item
        for item in ledger.get("assets", [])
        if isinstance(item, dict) and item.get("path")
    }

    if not sound_root.is_dir():
        raise SystemExit(f"ERROR audio root not found: {sound_root}")

    on_disk = sorted(
        path for path in sound_root.rglob("*")
        if path.is_file() and path.suffix.lower() in AUDIO_SUFFIXES
    )

    music_cleared = 0
    for path in on_disk:
        relative = str(path.relative_to(root))
        record = records.get(relative)
        if record is None:
            errors.append(f"{relative}: ships but has no rights ledger record")
            continue

        actual = sha256_file(path)
        if record.get("master_sha256") != actual:
            errors.append(f"{relative}: file changed since clearance (hash mismatch)")

        # Provenance drives which fields are meaningful. AI-generated assets need
        # the provider product identified, because different products carry
        # different grants. First-party and commissioned work needs an authorship
        # or assignment record instead.
        source_class = record.get("source_class")
        if source_class == "ai_generated":
            product = record.get("product_or_model")
            if product not in VALID_PRODUCTS:
                errors.append(
                    f"{relative}: product_or_model {product!r} not identified "
                    f"(must be one of {sorted(VALID_PRODUCTS)})"
                )
            elif product in MUSIC_PRODUCTS:
                music_cleared += 1
        elif source_class in ("original_human", "commissioned", "field_recording"):
            if not record.get("provider_or_creator"):
                errors.append(f"{relative}: no creator recorded for {source_class} asset")
        elif source_class in ("licensed_library", "open_license", "third_party_custom",
                              "public_domain"):
            if not record.get("plan_or_license"):
                errors.append(f"{relative}: {source_class} asset needs a named licence")
        else:
            errors.append(f"{relative}: source_class {source_class!r} not recognised")

        if record.get("rights_status") != "cleared":
            errors.append(f"{relative}: rights_status is {record.get('rights_status')!r}, not cleared")
        if record.get("third_party_ip_review") != "passed":
            errors.append(f"{relative}: third_party_ip_review not passed")
        if record.get("commercial_use") != "allowed":
            errors.append(f"{relative}: commercial_use not allowed")
        if source_class == "ai_generated" and record.get("beta_status") not in BETA_OK:
            errors.append(f"{relative}: beta_status is {record.get('beta_status')!r}")
        required = ["creation_or_acquisition_date"]
        if source_class == "ai_generated":
            required += ["plan_or_license", "terms_version"]
        for field in required:
            if not record.get(field):
                errors.append(f"{relative}: missing {field}")
        if not record.get("reviewer") or not record.get("review_date"):
            errors.append(f"{relative}: cleared without a named reviewer and date")

        ev_ids = record.get("evidence_ids")
        if not isinstance(ev_ids, list) or not ev_ids:
            errors.append(f"{relative}: no evidence_ids")
        else:
            for ev_id in ev_ids:
                ev = evidence.get(ev_id)
                if ev is None:
                    errors.append(f"{relative}: unknown evidence_id {ev_id}")
                elif ev.get("verification_status") != "verified":
                    errors.append(f"{relative}: evidence {ev_id} is not verified")

    disk_paths = {str(p.relative_to(root)) for p in on_disk}
    for orphan in sorted(set(records) - disk_paths):
        warnings.append(f"{orphan}: ledger record has no file on disk (stale row)")

    # Standing licence condition, surfaced whenever Eleven Music output ships.
    constraints = ledger.get("release_constraints", {})
    platforms = constraints.get("platforms_cleared", [])
    if music_cleared and len(platforms) > 1:
        errors.append(
            f"release_constraints.platforms_cleared lists {len(platforms)} platforms while "
            f"{music_cleared} Eleven Music asset(s) ship: this is a 'Studio Game' under the "
            f"Eleven Music terms and requires an Enterprise agreement."
        )

    result = {
        "gate": "BLOCKED" if errors else "PASS",
        "files_on_disk": len(on_disk),
        "ledger_records": len(records),
        "eleven_music_assets": music_cleared,
        "platforms_cleared": platforms,
        "errors": sorted(errors),
        "warnings": sorted(warnings),
    }

    if args.as_json:
        print(json.dumps(result, indent=2))
        return 1 if errors else 0

    if errors:
        print("AUDIO RIGHTS GATE: BLOCKED")
        for error in sorted(errors)[:60]:
            print(f"- {error}")
        if len(errors) > 60:
            print(f"... and {len(errors) - 60} more")
        print(f"\n{len(errors)} blocker(s); {len(on_disk)} shipping file(s) inspected.")
        return 1

    for warning in sorted(warnings):
        print(f"warning: {warning}")
    print(f"AUDIO RIGHTS GATE: PASS — {len(on_disk)} shipping file(s) cleared.")
    if music_cleared:
        print(
            f"note: {music_cleared} Eleven Music asset(s) cleared for "
            f"{platforms}. Adding a platform requires an Enterprise agreement."
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
