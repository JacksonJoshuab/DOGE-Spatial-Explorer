#!/usr/bin/env python3
"""Recover the exact Acidance API character and optionally render a proof.

This client is intended for a GitHub Actions job that obtains OPENAI_API_KEY from
Azure Key Vault through workload identity. It never prints or persists the key.
Only redacted status metadata and generated media are written to the output
folder.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Mapping

API_BASE = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
CHARACTER_RE = re.compile(r"\bchar_[A-Za-z0-9_-]+\b")
SECRET_RE = re.compile(r"\bsk-[A-Za-z0-9_-]{8,}\b")
QUERY_TERMS = ("acidance", "@acidance")


class RecoveryError(RuntimeError):
    pass


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def redact(value: Any, limit: int = 2000) -> str:
    text = str(value)
    key = os.getenv("OPENAI_API_KEY", "")
    if key:
        text = text.replace(key, "[REDACTED]")
    text = SECRET_RE.sub("[REDACTED_API_KEY]", text)
    return text[:limit]


def iter_strings(value: Any) -> Iterable[str]:
    if isinstance(value, str):
        yield value
    elif isinstance(value, Mapping):
        for key, item in value.items():
            yield str(key)
            yield from iter_strings(item)
    elif isinstance(value, list):
        for item in value:
            yield from iter_strings(item)


def contains_acidance(value: Any) -> bool:
    haystack = "\n".join(iter_strings(value)).lower()
    return any(term in haystack for term in QUERY_TERMS)


def character_ids(value: Any) -> set[str]:
    ids: set[str] = set()
    for text in iter_strings(value):
        ids.update(CHARACTER_RE.findall(text))
    return ids


def headers(*, json_mode: bool = False) -> dict[str, str]:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RecoveryError("OPENAI_API_KEY is unavailable after Azure Key Vault retrieval.")
    result = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "User-Agent": "DOGE-Spatial-Explorer/acidance-azure-recovery-1.0",
    }
    organization = os.getenv("OPENAI_ORGANIZATION", "").strip()
    project = os.getenv("OPENAI_PROJECT", "").strip()
    if organization:
        result["OpenAI-Organization"] = organization
    if project:
        result["OpenAI-Project"] = project
    if json_mode:
        result["Content-Type"] = "application/json"
    return result


def request(
    method: str,
    path: str,
    *,
    params: Mapping[str, Any] | None = None,
    payload: Any | None = None,
    timeout: int = 180,
) -> tuple[int, Mapping[str, str], bytes]:
    if not path.startswith("/"):
        path = "/" + path
    url = API_BASE + path
    if params:
        clean = {key: value for key, value in params.items() if value is not None}
        url += "?" + urllib.parse.urlencode(clean)
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        method=method,
        headers=headers(json_mode=payload is not None),
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return int(response.status), dict(response.headers.items()), response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RecoveryError(
            f"OpenAI API {method} {path} returned HTTP {exc.code}: {redact(detail)}"
        ) from exc
    except urllib.error.URLError as exc:
        raise RecoveryError(
            f"OpenAI API {method} {path} failed: {redact(exc.reason)}"
        ) from exc


def request_json(
    method: str,
    path: str,
    *,
    params: Mapping[str, Any] | None = None,
    payload: Any | None = None,
    timeout: int = 180,
) -> dict[str, Any]:
    _, _, raw = request(method, path, params=params, payload=payload, timeout=timeout)
    try:
        value = json.loads(raw.decode("utf-8")) if raw else {}
    except json.JSONDecodeError as exc:
        raise RecoveryError(f"OpenAI API {method} {path} returned invalid JSON.") from exc
    if not isinstance(value, dict):
        raise RecoveryError(f"OpenAI API {method} {path} returned a non-object response.")
    return value


def safe_video_metadata(video: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "id": video.get("id"),
        "created_at": video.get("created_at"),
        "completed_at": video.get("completed_at"),
        "status": video.get("status"),
        "model": video.get("model"),
        "size": video.get("size"),
        "seconds": video.get("seconds"),
        "character_ids": sorted(character_ids(video)),
        "acidance_match": contains_acidance(video),
    }


def list_videos(max_pages: int, page_size: int) -> tuple[list[dict[str, Any]], list[str]]:
    videos: list[dict[str, Any]] = []
    notes: list[str] = []
    after: str | None = None
    seen: set[str] = set()
    for page in range(1, max_pages + 1):
        result = request_json(
            "GET",
            "/videos",
            params={"limit": page_size, "order": "desc", "after": after},
        )
        data = result.get("data", [])
        if not isinstance(data, list):
            raise RecoveryError("GET /videos returned an invalid data field.")
        videos.extend(item for item in data if isinstance(item, dict))
        if not result.get("has_more") or not data:
            break
        cursor = result.get("last_id")
        if not isinstance(cursor, str) or not cursor:
            candidate = data[-1].get("id") if isinstance(data[-1], dict) else None
            cursor = candidate if isinstance(candidate, str) else None
        if not cursor:
            notes.append(f"Pagination stopped on page {page}: no cursor was returned.")
            break
        if cursor in seen:
            notes.append(f"Pagination stopped on page {page}: cursor repeated.")
            break
        seen.add(cursor)
        after = cursor
    else:
        notes.append(f"Pagination reached the configured {max_pages}-page limit.")
    return videos, notes


def verify_character(character_id: str) -> dict[str, Any]:
    if not CHARACTER_RE.fullmatch(character_id):
        raise RecoveryError(f"Invalid character identifier: {character_id}")
    result = request_json(
        "GET", f"/videos/characters/{urllib.parse.quote(character_id)}"
    )
    return {
        "id": result.get("id"),
        "name": result.get("name"),
        "created_at": result.get("created_at"),
    }


def select_character(
    videos: list[dict[str, Any]], verified: list[dict[str, Any]]
) -> tuple[dict[str, Any] | None, str | None]:
    by_id = {
        item.get("id"): item
        for item in verified
        if isinstance(item.get("id"), str)
    }
    for item in verified:
        name = str(item.get("name") or "").lower()
        if "acidance" in name:
            return item, "verified_character_name"
    for video in videos:
        if not contains_acidance(video):
            continue
        ids = sorted(character_ids(video))
        if len(ids) == 1 and ids[0] in by_id:
            return by_id[ids[0]], "single_character_on_acidance_video"
    return None, None


def render_proof(character: Mapping[str, Any], output: Path, timeout_minutes: int) -> dict[str, Any]:
    character_id = character.get("id")
    if not isinstance(character_id, str) or not CHARACTER_RE.fullmatch(character_id):
        raise RecoveryError("Selected character has no valid char_ identifier.")
    prompt = (
        "Photorealistic live-action luxury fashion film of Acidance, the exact established "
        "creator-owned AI-native fictional adult character, walking confidently down a polished "
        "runway in historic Quito, Ecuador at golden hour. Preserve the supplied character's "
        "identity, face geometry, complexion, eye shape, hair, apparent age, height, body "
        "proportions, gait, and screen presence. Natural skin texture and pores, realistic eyes "
        "and blinking, subtle breathing, anatomically coherent five-finger hands and stable feet, "
        "natural runway weight transfer, physically accurate fabric and hair motion, cinematic "
        "35 mm tracking camera, subtle audience bokeh. Contemporary refined travel fashion with "
        "subtle Ecuador-inspired textile detail. No animation, illustration, plastic skin, face "
        "morphing, identity drift, extra fingers, duplicate limbs, fused footwear, visible logos, "
        "dialogue, or on-screen text."
    )
    job = request_json(
        "POST",
        "/videos",
        payload={
            "model": "sora-2-pro",
            "prompt": prompt,
            "size": "1280x720",
            "seconds": "8",
            "characters": [{"id": character_id}],
        },
        timeout=300,
    )
    video_id = job.get("id")
    if not isinstance(video_id, str) or not video_id:
        raise RecoveryError("Proof request did not return a video identifier.")
    deadline = time.monotonic() + timeout_minutes * 60
    latest = job
    while time.monotonic() < deadline:
        status = str(latest.get("status") or "")
        if status == "completed":
            break
        if status == "failed":
            raise RecoveryError(
                f"Proof generation failed: {redact(json.dumps(latest.get('error')))}"
            )
        time.sleep(10)
        latest = request_json("GET", f"/videos/{urllib.parse.quote(video_id)}")
    if str(latest.get("status") or "") != "completed":
        raise RecoveryError(
            f"Proof generation did not complete within {timeout_minutes} minutes."
        )
    _, _, raw = request(
        "GET", f"/videos/{urllib.parse.quote(video_id)}/content", timeout=600
    )
    if len(raw) < 4096:
        raise RecoveryError("Downloaded proof media is unexpectedly small.")
    output.write_bytes(raw)
    return {
        "id": video_id,
        "status": latest.get("status"),
        "model": latest.get("model"),
        "size": latest.get("size"),
        "seconds": latest.get("seconds"),
        "file": output.name,
        "bytes": len(raw),
    }


def write_report(path: Path, report: Mapping[str, Any]) -> None:
    path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=Path("artifacts/acidance-azure-recovery"))
    parser.add_argument("--max-pages", type=int, default=20)
    parser.add_argument("--page-size", type=int, default=100)
    parser.add_argument("--render-proof", action="store_true")
    parser.add_argument("--proof-timeout-minutes", type=int, default=45)
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    report_path = args.output_dir / "acidance-azure-recovery.json"
    proof_path = args.output_dir / "acidance-human-proof.mp4"
    report: dict[str, Any] = {
        "schema_version": 1,
        "generated_at": utc_now(),
        "status": "started",
        "credential_source": "azure_key_vault_via_github_oidc",
        "api_base": API_BASE,
        "videos_scanned": 0,
        "acidance_video_candidates": [],
        "character_ids_discovered": [],
        "verified_characters": [],
        "selected_character": None,
        "selection_basis": None,
        "proof_video": None,
        "notes": [],
        "errors": [],
    }
    exit_code = 0
    try:
        videos, notes = list_videos(args.max_pages, args.page_size)
        report["videos_scanned"] = len(videos)
        report["notes"].extend(notes)
        candidates = [video for video in videos if contains_acidance(video)]
        report["acidance_video_candidates"] = [safe_video_metadata(video) for video in candidates]
        ids = sorted(character_ids(videos))
        report["character_ids_discovered"] = ids
        verified: list[dict[str, Any]] = []
        for character_id in ids:
            try:
                verified.append(verify_character(character_id))
            except RecoveryError as exc:
                report["notes"].append(
                    f"Character {character_id} could not be verified: {redact(exc)}"
                )
        report["verified_characters"] = verified
        selected, basis = select_character(videos, verified)
        if selected is None:
            report["status"] = "not_found"
            report["errors"].append(
                "No verified Acidance API character was found in the Azure-backed OpenAI project."
            )
            exit_code = 3
        else:
            report["selected_character"] = selected
            report["selection_basis"] = basis
            if args.render_proof:
                report["proof_video"] = render_proof(
                    selected, proof_path, args.proof_timeout_minutes
                )
            report["status"] = "recovered"
    except Exception as exc:  # report all operational failures without leaking a secret
        report["status"] = "blocked"
        report["errors"].append(redact(exc))
        exit_code = 4
    finally:
        report["generated_at"] = utc_now()
        write_report(report_path, report)
        summary = args.output_dir / "summary.md"
        summary.write_text(
            "# Acidance Azure recovery\n\n"
            f"- Status: `{report['status']}`\n"
            f"- Videos scanned: `{report['videos_scanned']}`\n"
            f"- Acidance candidates: `{len(report['acidance_video_candidates'])}`\n"
            f"- Verified characters: `{len(report['verified_characters'])}`\n"
            f"- Proof produced: `{'yes' if report['proof_video'] else 'no'}`\n"
            f"- Errors: `{len(report['errors'])}`\n",
            encoding="utf-8",
        )
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
