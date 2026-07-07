"""Investment Review schema — 투자 리뷰 객체 정규화 (Step 8).

Personal Overlay 계층이다. Canonical 보고서를 수정하지 않고, 사용자 포트폴리오/노트와
기존 산출물(regime/thesis/checkpoint)을 연결한 개인용 리뷰를 별도 객체로만 만든다.
포트폴리오 영향은 투자 판단 보조이며 매수/매도 지시가 아니다.
"""
from __future__ import annotations

# 종목/내러티브가 내 포지션에 주는 방향
IMPACT_CHOICES = {"positive", "watch", "negative", "neutral"}
IMPACT_DEFAULT = "neutral"


def normalize_impact(value, default: str = IMPACT_DEFAULT) -> str:
    v = str(value or "").strip().lower()
    return v if v in IMPACT_CHOICES else default


def empty_review(date: str = "") -> dict:
    """집계 실패/빈 데이터에서도 화면이 깨지지 않도록 하는 최소 구조."""
    return {
        "date": date,
        "generatedAt": "",
        "mode": "rule",
        "summary": "",
        "marketTape": {},
        "stats": {},
        "exposure": [],
        "recentReports": [],
        "marketState": [],
        "thesisChanges": [],
        "portfolioImpacts": [],
        "keyCheckpoints": [],
        "linkedNotes": [],
        "qualitySummary": {},
        "warnings": [],
        "markdown": "",
        "stale": False,
    }


def normalize_review(review: dict | None, *, date: str = "") -> dict:
    base = empty_review(date)
    if not isinstance(review, dict):
        return base
    out = {**base, **review}
    out["date"] = str(out.get("date") or date or "")
    out["mode"] = "llm" if str(out.get("mode")) == "llm" else "rule"
    out["summary"] = str(out.get("summary") or "")
    for key in ("marketState", "thesisChanges", "portfolioImpacts", "keyCheckpoints", "linkedNotes", "warnings", "exposure", "recentReports"):
        if not isinstance(out.get(key), list):
            out[key] = []
    for key in ("qualitySummary", "stats", "marketTape"):
        if not isinstance(out.get(key), dict):
            out[key] = {}
    out["stale"] = bool(out.get("stale"))
    out["markdown"] = str(out.get("markdown") or "")
    return out
