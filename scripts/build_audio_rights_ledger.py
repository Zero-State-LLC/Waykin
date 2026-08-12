#!/usr/bin/env python3
"""Scaffold an audio rights ledger from the audio actually present in a repo.

Scans a sound root, hashes every shipping audio file, and emits ledger rows that
FAIL CLOSED: every asset starts at rights_status=pending_evidence with unknown
provider metadata. Nothing here is clearance. The owner must file private
evidence and flip statuses by hand.

Product inference is deliberately weak: directory layout is a *hint* used to
pre-sort music vs sound effects for the owner's review, never a determination.
Anything not confidently sorted is left as `unidentified`, which the validator
treats as a blocker.

Usage:
    python3 build_audio_rights_ledger.py --root . --project Hexwire \
        --prefix HXW --out docs/audio/rights/AUDIO_RIGHTS_LEDGER.json
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

AUDIO_SUFFIXES = {".mp3", ".wav", ".m4a", ".caf", ".aiff", ".aif", ".ogg"}

# Directory-name hints. These pre-sort for human review; they do not decide rights.
MUSIC_HINTS = {"music", "bgm", "songs", "score", "tracks"}
SFX_HINTS = {"sfx", "sound", "sounds", "fx", "effects", "ui"}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def infer_category(relative: Path) -> str:
    parts = {part.lower() for part in relative.parts[:-1]}
    if parts & MUSIC_HINTS:
        return "music"
    if parts & SFX_HINTS:
        return "sound_effects"
    return "unidentified"


def asset_id_for(relative: Path) -> str:
    stem = relative.with_suffix("")
    return ".".join(part.lower().replace(" ", "_") for part in stem.parts)


def build(root: Path, sound_root: Path, project: str, prefix: str,
          source_class: str, provider: str) -> dict:
    files = sorted(
        path for path in sound_root.rglob("*")
        if path.is_file() and path.suffix.lower() in AUDIO_SUFFIXES
    )
    if not files:
        raise SystemExit(f"ERROR no audio found under {sound_root}")

    assets = []
    counts = {"music": 0, "sound_effects": 0, "unidentified": 0}
    for path in files:
        relative = path.relative_to(root)
        category = infer_category(path.relative_to(sound_root))
        counts[category] += 1
        assets.append({
            "asset_id": asset_id_for(path.relative_to(sound_root)),
            "path": str(relative),
            "master_sha256": sha256_file(path),
            "bytes": path.stat().st_size,
            "source_class": source_class,
            "provider_or_creator": provider,
            # Directory hint only. Owner must confirm the actual product per batch,
            # because Sound Effects and Eleven Music carry different grants.
            "category_hint": category,
            "product_or_model": None,
            "creation_or_acquisition_date": None,
            "plan_or_license": None,
            "terms_version": None,
            "beta_status": "unknown",
            "commercial_use": "unknown",
            "modification": "unknown",
            "sublicensing": "unknown",
            "attribution": None,
            "evidence_ids": [],
            "third_party_ip_review": "unknown",
            "rights_status": "pending_evidence",
            "reviewer": None,
            "review_date": None,
        })

    return {
        "schema_version": 2,
        "project": project,
        "policy": "docs/audio/rights/AUDIO_RIGHTS_POLICY.md",
        "determination": "docs/audio/rights/ELEVENLABS_LICENSE_DETERMINATION.md",
        "generated_by": "scripts/build_audio_rights_ledger.py",
        "release_intent": {
            "commercial": True,
            "media": ["interactive_game", "storefront", "trailers", "social_marketing"],
            "territory": "worldwide",
            "term": "project_distribution_lifetime",
        },
        "release_constraints": {
            "platforms_cleared": ["ios_app_store"],
            "multi_platform_trigger": (
                "Eleven Music output is excluded from self-serve commercial use for "
                "'Studio Games': commercialised games distributed on MORE THAN ONE platform. "
                "Shipping any Eleven Music-derived asset on a second platform while monetised "
                "requires an ElevenLabs Enterprise agreement BEFORE release. Re-run the "
                "determination doc before approving any non-iOS build."
            ),
            "attribution_required": False,
            "attribution_note": (
                "Attribution is an Eleven Music free-tier condition only. Not owed on a paid "
                "plan. Any voluntary credit must not be recorded as a legal requirement."
            ),
        },
        "evidence_archive": {
            "public_repository_contains_private_evidence": False,
            "id_format": f"{prefix}-AUD-EV-YYYY-NNNN",
            "required_digest": "sha256",
        },
        "counts": {
            "total": len(assets),
            "by_category_hint": counts,
        },
        "evidence": [],
        "assets": assets,
        "migration": {
            "status": "scaffold_pending_evidence",
            "instruction": (
                "Scaffold only. Every asset is pending_evidence with no linked evidence. "
                "Owner must archive private evidence, create evidence records, confirm the "
                "ElevenLabs product per batch (Sound Effects vs Eleven Music), then set "
                "rights_status=cleared. Agents must never set cleared or invent digests."
            ),
            "owner_packet": "docs/audio/rights/OWNER_EVIDENCE_PACKET.md",
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".", help="repository root")
    parser.add_argument("--sounds", default=None, help="audio root (default: auto-detect)")
    parser.add_argument("--project", required=True)
    parser.add_argument("--prefix", required=True, help="evidence ID prefix, e.g. HXW")
    parser.add_argument("--source-class", required=True,
                        choices=["original_human", "commissioned", "ai_generated",
                                 "licensed_library", "field_recording", "public_domain",
                                 "open_license", "third_party_custom"],
                        help="REQUIRED. Provenance is never inherited between projects.")
    parser.add_argument("--provider", required=True,
                        help="REQUIRED. Creator, provider, or account custodian.")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    root = Path(args.root).resolve()
    if args.sounds:
        sound_root = (root / args.sounds).resolve()
    else:
        candidates = [p for p in (root / "Sounds", root / "Audio", root / "Resources") if p.is_dir()]
        if not candidates:
            raise SystemExit("ERROR could not auto-detect an audio root; pass --sounds")
        sound_root = candidates[0]

    ledger = build(root, sound_root, args.project, args.prefix,
                   args.source_class, args.provider)
    out = (root / args.out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(ledger, indent=2) + "\n", encoding="utf-8")

    counts = ledger["counts"]
    print(f"wrote {out.relative_to(root)}")
    print(f"  {counts['total']} assets — all pending_evidence (fail closed)")
    for key, value in counts["by_category_hint"].items():
        print(f"    {key}: {value}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
