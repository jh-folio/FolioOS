"""Explicit-consent OpenAI Vision adapter for position screenshots."""
from __future__ import annotations

import base64
import json
import urllib.request
from pathlib import Path

from features.llm_settings.client import openai_config


def _extract_output(payload: dict) -> str:
    if isinstance(payload.get("output_text"), str):
        return payload["output_text"]
    parts = []
    for item in payload.get("output") or []:
        for content in item.get("content") or [] if isinstance(item, dict) else []:
            if isinstance(content, dict) and isinstance(content.get("text"), str):
                parts.append(content["text"])
    return "\n".join(parts)


def extract_positions(image_path: Path, *, consent: bool, mime_type: str = "image/png") -> list[dict]:
    if not consent:
        raise PermissionError("vision_consent_required")
    cfg = openai_config()
    api_key = str(cfg.get("apiKey") or "").strip()
    if not api_key:
        raise RuntimeError("vision_provider_not_configured")
    encoded = base64.b64encode(Path(image_path).read_bytes()).decode("ascii")
    body = {
        "model": cfg.get("model") or "gpt-5-mini",
        "input": [{"role": "user", "content": [
            {"type": "input_text", "text": "Extract portfolio positions from this cropped broker screenshot. Return only JSON: {\"positions\":[{\"ticker\":string,\"name\":string,\"quantity\":number|null,\"averagePrice\":number|null,\"currency\":string}]}. Do not infer missing values."},
            {"type": "input_image", "image_url": f"data:{mime_type};base64,{encoded}"},
        ]}],
        "text": {"format": {"type": "json_object"}},
        "store": False,
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(body).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        payload = json.loads(response.read().decode("utf-8"))
    result = json.loads(_extract_output(payload) or "{}")
    rows = result.get("positions") if isinstance(result, dict) else []
    return rows if isinstance(rows, list) else []
