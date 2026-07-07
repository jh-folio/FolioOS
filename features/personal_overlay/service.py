"""Personal Overlay 생성·저장 서비스.

Canonical 보고서(브리핑/기업분석)를 사용자 Obsidian hypothesis 노트와 대조한 개인 해석을 만든다.

엄격 규칙:
- Canonical `markdown`은 절대 수정하지 않는다. overlay는 `personalOverlay` 필드로만 붙인다.
- 사용자 노트는 evidence가 아니라 hypothesis(가설)다.
- LLM이 꺼져 있거나 실패하면 규칙 기반 fallback으로 구조를 채운다(서비스가 죽지 않는다).
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

from features.common.utils import read_json, write_json
from features.daily_briefing.schema import briefing_file_name, normalize_market_scope
from features.llm_settings.client import (
    request_llm_text,
    selected_llm_config,
    strip_llm_citation_markers,
)
from features.common.quality_generation.telemetry import normalize_token_usage
from features.obsidian.importer import parser as P
from features.obsidian.importer.service import list_hypotheses, scan_vault
from features.personal_overlay import schema as S

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
BRIEFINGS_DIR = DATA_DIR / "briefings"
ANALYSIS_REPORTS_DIR = DATA_DIR / "company-analysis"
PROMPT_PATH = Path(__file__).resolve().parent / "prompt.md"

DISCLAIMER = (
    "이 섹션은 사용자의 Obsidian 노트와 현재 자료를 비교한 개인용 해석입니다. "
    "기본 보고서의 근거에는 포함되지 않습니다."
)


def _now_iso() -> str:
    return dt.datetime.now().isoformat(timespec="seconds")


def read_prompt() -> str:
    try:
        return PROMPT_PATH.read_text(encoding="utf-8")
    except Exception:
        return ""


# ---------------------------------------------------------------------------
# hypothesis 수집
# ---------------------------------------------------------------------------

def _gather_hypotheses(kind: str, canonical: dict) -> list:
    """import 인덱스에서 연결할 hypothesis 노트를 모은다.

    Vault 미설정/미존재 등으로 실패하면 빈 리스트를 반환한다(서비스 계속 동작).
    """
    ticker = None
    if kind == "analysis":
        company = canonical.get("company") or {}
        if isinstance(company, dict):
            ticker = (company.get("ticker") or "").strip() or None
    # 최신 Vault 상태를 인덱스에 반영한 뒤 조회한다(노트를 만들면 어느 폴더든 즉시 반영).
    # Vault 미설정/미존재 등으로 스캔이 실패해도 기존 인덱스로 조회를 계속한다.
    try:
        scan_vault()
    except Exception:
        pass
    try:
        return list_hypotheses(ticker=ticker) if ticker else list_hypotheses()
    except Exception:
        return []


def _note_excerpt(note_row: dict, limit: int = 1200) -> str:
    if note_row.get("excerpt"):
        return str(note_row["excerpt"])[:limit]
    path = note_row.get("path")
    if not path:
        return ""
    try:
        text = Path(path).read_text(encoding="utf-8")
    except Exception:
        return ""
    return (P.parse_note(text).body or "").strip()[:limit]


def _linked_notes(hypotheses: list) -> list:
    return [
        {
            "noteId": h.get("note_id", ""),
            "title": h.get("title") or h.get("rel_path", ""),
            "type": h.get("note_type", ""),
            "ticker": h.get("ticker", ""),
        }
        for h in hypotheses
    ]


# ---------------------------------------------------------------------------
# 생성 (LLM + fallback)
# ---------------------------------------------------------------------------

def _build_context(canonical: dict, hypotheses: list, kind: str) -> str:
    parts = [f"# Canonical 보고서 ({kind})", (canonical.get("markdown") or "")[:6000]]
    parts.append("\n# 사용자 hypothesis 노트 (evidence 아님, 가설로만 취급)")
    if not hypotheses:
        parts.append("(연결된 노트 없음)")
    for h in hypotheses:
        head = f"\n## [{h.get('note_type', '')}] {h.get('title') or h.get('rel_path', '')}"
        if h.get("ticker"):
            head += f" (ticker={h['ticker']})"
        parts.append(head)
        parts.append(_note_excerpt(h))
    return "\n".join(parts)


def _fallback_overlay(hypotheses: list) -> dict:
    linked = _linked_notes(hypotheses)
    if hypotheses:
        uncertainties = [
            "LLM이 꺼져 있거나 호출에 실패해 자동 대조를 수행하지 못했습니다. 연결된 노트 목록만 표시합니다.",
        ]
        body = "\n".join(f"- {n['title']} ({n['type']})" for n in linked)
        markdown = f"## 내 노트와 연결\n\n{DISCLAIMER}\n\n연결된 노트:\n{body}"
    else:
        uncertainties = [
            "연결할 Obsidian hypothesis 노트가 없습니다. Vault에 company_thesis/market_memo 노트를 작성한 뒤 다시 시도하세요.",
        ]
        markdown = f"## 내 노트와 연결\n\n{DISCLAIMER}\n\n연결된 노트가 없습니다."
    return S.normalize_overlay(
        {"uncertainties": uncertainties, "stance": "insufficient"},
        linked_notes=linked,
        markdown=markdown,
    )


def generate_overlay(canonical: dict, hypotheses: list, *, kind="briefing", llm_override=None, web_search_override=None):
    """(overlay, status) 반환. canonical markdown은 읽기만 한다."""
    # 연결할 노트가 없으면 LLM을 호출하지 않는다(빈 비교는 의미가 없고 토큰만 낭비).
    if not hypotheses:
        return _fallback_overlay([]), "no_notes"
    cfg = selected_llm_config()
    llm_on = cfg["enabled"] if llm_override is None else bool(llm_override)
    if not llm_on:
        return _fallback_overlay(hypotheses), "disabled"
    if not cfg["apiKey"]:
        return _fallback_overlay(hypotheses), f"missing_{cfg['provider']}_api_key"
    prompt = read_prompt()
    if not prompt:
        return _fallback_overlay(hypotheses), "missing_prompt"
    context = _build_context(canonical, hypotheses, kind)
    web_search = bool(web_search_override) if web_search_override is not None else False
    try:
        text, _rid, usage = request_llm_text(cfg, prompt, context, web_search=web_search, json_mode=True, include_usage=True)
        if not text:
            return _fallback_overlay(hypotheses), "empty_response"
        raw = json.loads(text)
        markdown = strip_llm_citation_markers(str(raw.get("markdown", "") or ""))
        overlay = S.normalize_overlay(raw, linked_notes=_linked_notes(hypotheses), markdown=markdown)
        overlay["generation"] = {
            "mode": "llm",
            "provider": cfg.get("provider", ""),
            "model": cfg.get("model", ""),
            "responseId": _rid,
            "tokenUsage": normalize_token_usage(usage, prompt=prompt, context=context, output=text),
        }
        return overlay, "ok"
    except Exception as exc:
        return _fallback_overlay(hypotheses), f"error: {exc}"


# ---------------------------------------------------------------------------
# 저장/조회 (markdown 불변 보장)
# ---------------------------------------------------------------------------

def with_overlay(report: dict, overlay: dict, *, status="", generated_at=None) -> dict:
    """report에 personalOverlay를 붙인 새 dict 반환. 기본 `markdown`은 절대 수정하지 않는다."""
    out = dict(report or {})
    block = dict(overlay)
    block["enabled"] = True
    block["status"] = status
    block["generatedAt"] = generated_at or _now_iso()
    out["personalOverlay"] = block
    return out


def strip_overlay(report, include_personal: bool):
    """include_personal=False면 응답에서 personalOverlay를 제거한다(기본 보고서 응답 보호)."""
    if include_personal or not isinstance(report, dict) or "personalOverlay" not in report:
        return report
    out = dict(report)
    out.pop("personalOverlay", None)
    return out


def _briefing_overlay_path(date: str, market_scope: str = "both") -> Path:
    scope = normalize_market_scope(market_scope)
    if scope in {"us", "kr"}:
        scoped = BRIEFINGS_DIR / briefing_file_name(date, scope)
        if scoped.exists():
            return scoped
    return BRIEFINGS_DIR / briefing_file_name(date)


def attach_overlay_to_briefing(date: str, *, market_scope="both", llm_override=None, web_search_override=None) -> dict:
    path = _briefing_overlay_path(date, market_scope)
    canonical = read_json(path, None)
    if not canonical:
        raise FileNotFoundError(f"Briefing not found: {date}")
    hyps = _gather_hypotheses("briefing", canonical)
    overlay, status = generate_overlay(canonical, hyps, kind="briefing",
                                       llm_override=llm_override, web_search_override=web_search_override)
    updated = with_overlay(canonical, overlay, status=status)
    write_json(path, updated)
    return {"ok": True, "status": status, "personalOverlay": updated["personalOverlay"]}


def attach_overlay_to_report(report_id: str, *, llm_override=None, web_search_override=None) -> dict:
    from features.company_analysis.service import get_analysis_report
    canonical = get_analysis_report(report_id)
    if not canonical:
        raise FileNotFoundError(f"Analysis report not found: {report_id}")
    hyps = _gather_hypotheses("analysis", canonical)
    overlay, status = generate_overlay(canonical, hyps, kind="analysis",
                                       llm_override=llm_override, web_search_override=web_search_override)
    updated = with_overlay(canonical, overlay, status=status)
    write_json(ANALYSIS_REPORTS_DIR / f"{canonical.get('id') or report_id}.json", updated)
    return {"ok": True, "status": status, "personalOverlay": updated["personalOverlay"]}
