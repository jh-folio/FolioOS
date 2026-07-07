"""Research quality service: load, evaluate, and persist quality fields."""
from __future__ import annotations

import json
from pathlib import Path

from features.common.research_schema.service import load_artifact
from features.common.utils import kst_date
from features.common.research_quality.evaluator import evaluate_artifact, evaluate_report

ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = ROOT / "data"


def _find_json_path(folder: Path, artifact_id: str) -> Path | None:
    artifact_id = str(artifact_id or "")
    direct = folder / f"{artifact_id}.json"
    if direct.exists():
        return direct
    for path in folder.glob("*.json"):
        if artifact_id in path.stem:
            return path
    return None


def _artifact_json_path(artifact_type: str, artifact_id: str) -> Path | None:
    if artifact_type == "briefing":
        return _find_json_path(DATA_DIR / "briefings", artifact_id)
    if artifact_type == "topic_report":
        return _find_json_path(DATA_DIR / "topic-reports", artifact_id)
    if artifact_type == "company_analysis":
        return _find_json_path(DATA_DIR / "company-analysis", artifact_id)
    return None


def evaluate_payload(body: dict | None = None) -> dict:
    body = body or {}
    artifact_type = str(body.get("artifactType") or body.get("artifact_type") or "topic_report")
    artifact = body.get("artifact") if isinstance(body.get("artifact"), dict) else body
    quality = evaluate_artifact(artifact_type, artifact)
    return {"ok": True, "artifactType": artifact_type, "artifactId": body.get("artifactId") or "", "quality": quality}


def get_quality(artifact_type: str, artifact_id: str) -> dict:
    artifact = load_artifact(artifact_type, artifact_id)
    if not artifact:
        raise FileNotFoundError(f"Artifact not found: {artifact_type}/{artifact_id}")
    quality = artifact.get("quality")
    if not quality:
        quality = evaluate_artifact(artifact_type, artifact)
    return {"ok": True, "artifactType": artifact_type, "artifactId": artifact_id, "quality": quality}


def recheck_quality(artifact_type: str, artifact_id: str) -> dict:
    artifact = load_artifact(artifact_type, artifact_id)
    if not artifact:
        raise FileNotFoundError(f"Artifact not found: {artifact_type}/{artifact_id}")
    quality = evaluate_artifact(artifact_type, artifact)
    path = _artifact_json_path(artifact_type, artifact_id)
    if path:
        data = json.loads(path.read_text(encoding="utf-8"))
        data["quality"] = quality
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"ok": True, "artifactType": artifact_type, "artifactId": artifact_id, "quality": quality, "saved": bool(path)}


def evaluate_markdown(markdown: str, **kwargs) -> dict:
    return evaluate_report(markdown, **kwargs)
