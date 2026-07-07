"""Investment Review service — Step 8.

기존 산출물(regime_v2 / thesis_tracking / Step6 checkpoints)과 사용자 데이터
(portfolio / watchlist / obsidian note_index)를 하나의 투자 리뷰로 집계한다.

- LLM 없이 규칙 기반으로 동작한다(원칙: LLM-free fallback).
- 집계는 주입식 순수 함수로 분리해 테스트가 DB 없이 가능하게 한다.
- 일 1회 생성 후 data/investment-review/{date}.json 캐시. 실패/미존재 시 최신 저장본 + stale.
- Canonical 보고서를 수정하지 않는다(Personal Overlay 계층).
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

from features.investment_review.schema import normalize_review

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
REVIEW_DIR = DATA_DIR / "investment-review"
MEMORY_DB = DATA_DIR / "market-memory.sqlite3"


def _today() -> str:
    return dt.date.today().isoformat()


def _now_iso() -> str:
    return dt.datetime.now().isoformat(timespec="seconds")


# ---------------------------------------------------------------------------
# 순수 집계 함수 (데이터 주입 — 테스트 용이)
# ---------------------------------------------------------------------------

def build_market_state(regime_states: list) -> list:
    out = []
    for s in regime_states or []:
        label = s.get("stateLabel") or s.get("storyFamily") or s.get("story") or s.get("stateKey") or ""
        if not label:
            continue
        out.append({
            "stateId": s.get("id") or s.get("stateId") or s.get("stateKey") or "",
            "label": label,
            "momentum": s.get("momentum") or "stable",
            "confidence": s.get("confidence"),
            "bias": s.get("bias") or "",
            "status": s.get("status") or "",
            "linkedCompanies": [str(t).upper() for t in (s.get("linkedCompanies") or [])][:6],
        })
    return out


def build_thesis_changes(theses: list, deltas_by_ticker: dict) -> list:
    out = []
    for t in theses or []:
        ticker = str(t.get("ticker") or "").upper()
        if not ticker:
            continue
        delta = (deltas_by_ticker or {}).get(ticker) or {}
        out.append({
            "ticker": ticker,
            "company": t.get("company") or "",
            "conviction": t.get("conviction") or "",
            "status": t.get("status") or "",
            "verdict": delta.get("verdict") or "insufficient_evidence",
            "deltaGeneratedAt": delta.get("generatedAt") or "",
        })
    return out


def _ticker_to_regimes(regime_states: list) -> dict:
    idx: dict[str, list] = {}
    for s in regime_states or []:
        label = s.get("stateLabel") or s.get("storyFamily") or s.get("story") or ""
        for tk in (s.get("linkedCompanies") or []):
            idx.setdefault(str(tk).upper(), []).append(
                {"label": label, "momentum": s.get("momentum") or "stable", "bias": s.get("bias") or ""}
            )
    return idx


_POSITIVE_MOMENTUM = {"strengthening"}
_NEGATIVE_MOMENTUM = {"fading", "turning"}
_AT_RISK_VERDICTS = {"weakened", "at_risk", "broken"}
_POSITIVE_VERDICTS = {"strengthened"}


def _impact_for(regimes: list, verdict: str) -> str:
    v = str(verdict or "").lower()
    moms = {r.get("momentum") for r in regimes}
    if v in _AT_RISK_VERDICTS:
        return "watch"
    if moms & _NEGATIVE_MOMENTUM:
        return "watch"
    if v in _POSITIVE_VERDICTS or (moms & _POSITIVE_MOMENTUM):
        return "positive"
    return "neutral"


def build_portfolio_impacts(positions: list, watchlist: list, regime_states: list, thesis_changes: list) -> list:
    reg_idx = _ticker_to_regimes(regime_states)
    verdict_idx = {c.get("ticker"): c.get("verdict") for c in (thesis_changes or [])}
    out = []
    seen: set[str] = set()

    def add(ticker, name, source):
        ticker = str(ticker or "").upper()
        if not ticker or ticker in seen:
            return
        seen.add(ticker)
        regimes = reg_idx.get(ticker, [])
        verdict = verdict_idx.get(ticker, "")
        out.append({
            "ticker": ticker,
            "name": name or ticker,
            "source": source,
            "impact": _impact_for(regimes, verdict),
            "verdict": verdict or "",
            "linkedNarratives": [r["label"] for r in regimes if r.get("label")][:4],
        })

    for p in positions or []:
        add(p.get("ticker"), p.get("name"), "portfolio")
    for w in watchlist or []:
        if isinstance(w, dict):
            add(w.get("ticker") or w.get("symbol") or w.get("keyword"), w.get("name") or w.get("company"), "watchlist")
        else:
            add(w, w, "watchlist")
    return out


def aggregate_checkpoints(thesis_deltas: list, regime_states: list, *, limit: int = 12) -> list:
    from features.common.research_schema.checkpoints import (
        checkpoints_from_regime_state,
        checkpoints_from_thesis_delta,
    )
    collected = []
    for d in thesis_deltas or []:
        collected.extend(checkpoints_from_thesis_delta(d, artifact_id=str(d.get("ticker") or d.get("deltaId") or "")) or [])
    for s in regime_states or []:
        collected.extend(checkpoints_from_regime_state(s, artifact_id=str(s.get("id") or s.get("stateKey") or "")) or [])
    seen: set[str] = set()
    out = []
    for c in collected:
        text = str(c.get("checkpoint") or "").strip()
        if not text or text in seen:
            continue
        seen.add(text)
        out.append(c)
        if len(out) >= limit:
            break
    return out


def build_linked_notes(notes: list, *, limit: int = 12) -> list:
    out = []
    for n in notes or []:
        out.append({
            "title": n.get("title") or n.get("rel_path") or n.get("relPath") or "",
            "noteType": n.get("note_type") or n.get("noteType") or "",
            "ticker": str(n.get("ticker") or "").upper(),
            "relPath": n.get("rel_path") or n.get("relPath") or "",
        })
        if len(out) >= limit:
            break
    return out


def _count_by(rows: list, key: str) -> dict:
    counts: dict[str, int] = {}
    for r in rows or []:
        v = str(r.get(key) or "")
        if v:
            counts[v] = counts.get(v, 0) + 1
    return counts


_WEAK_VERDICTS = {"weakened", "at_risk", "broken"}


def build_stats(market_state: list, thesis_changes: list, portfolio_impacts: list, key_checkpoints: list) -> dict:
    return {
        "marketStrengthening": sum(1 for s in market_state or [] if s.get("momentum") == "strengthening"),
        "marketTotal": len(market_state or []),
        "thesisStrengthened": sum(1 for c in thesis_changes or [] if c.get("verdict") == "strengthened"),
        "thesisWeakened": sum(1 for c in thesis_changes or [] if c.get("verdict") in _WEAK_VERDICTS),
        "positionsPositive": sum(1 for p in portfolio_impacts or [] if p.get("impact") == "positive"),
        "positionsWatch": sum(1 for p in portfolio_impacts or [] if p.get("impact") == "watch"),
        "checkpointCount": len(key_checkpoints or []),
        "thesisDistribution": _count_by(thesis_changes, "verdict"),
        "impactDistribution": _count_by(portfolio_impacts, "impact"),
    }


def build_exposure(portfolio_impacts: list, *, limit: int = 8) -> list:
    counts: dict[str, int] = {}
    for p in portfolio_impacts or []:
        for nar in p.get("linkedNarratives") or []:
            if nar:
                counts[nar] = counts.get(nar, 0) + 1
    ranked = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    return [{"narrative": k, "count": v} for k, v in ranked[:limit]]


def build_summary(market_state: list) -> str:
    strong = [s.get("label") for s in market_state or [] if s.get("momentum") == "strengthening" and s.get("label")][:3]
    soft = [s.get("label") for s in market_state or [] if s.get("momentum") in ("fading", "turning", "conflicted") and s.get("label")][:2]
    parts = []
    if strong:
        parts.append("·".join(strong) + " 강화")
    if soft:
        parts.append("·".join(soft) + " 주의")
    return " / ".join(parts) or "아직 누적된 시장 내러티브가 없습니다. 브리핑·내러티브를 먼저 생성하세요."


_VERDICT_LABELS = {
    "strengthened": "강화", "maintained": "유지", "weakened": "약화",
    "at_risk": "이탈 주의", "broken": "이탈", "insufficient_evidence": "근거 부족",
}
_IMPACT_LABELS = {"positive": "긍정", "watch": "주의", "negative": "부정", "neutral": "중립"}
_MOMENTUM_LABELS = {
    "strengthening": "강화", "stable": "유지", "fading": "약화", "turning": "전환", "conflicted": "혼재",
}


def render_markdown(review: dict) -> str:
    lines = [f"# 투자 리뷰 — {review.get('date', '')}", ""]

    ms = review.get("marketState") or []
    lines.append("## 오늘의 시장 상태")
    if ms:
        for s in ms[:8]:
            mom = _MOMENTUM_LABELS.get(s.get("momentum"), s.get("momentum") or "")
            lines.append(f"- **{s.get('label')}**: {mom}")
    else:
        lines.append("- 누적된 시장 내러티브가 없습니다.")
    lines.append("")

    tc = review.get("thesisChanges") or []
    lines.append("## 내 Thesis 변화")
    if tc:
        for c in tc[:12]:
            verdict = _VERDICT_LABELS.get(c.get("verdict"), c.get("verdict") or "")
            lines.append(f"- **{c.get('ticker')}**: {verdict}")
    else:
        lines.append("- 등록된 thesis가 없습니다.")
    lines.append("")

    pi = review.get("portfolioImpacts") or []
    lines.append("## 포트폴리오 영향")
    if pi:
        for p in pi[:20]:
            impact = _IMPACT_LABELS.get(p.get("impact"), p.get("impact") or "")
            nar = ", ".join(p.get("linkedNarratives") or [])
            tail = f" · {nar}" if nar else ""
            lines.append(f"- **{p.get('ticker')}** ({impact}){tail}")
    else:
        lines.append("- 연결할 포트폴리오/워치리스트 종목이 없습니다.")
    lines.append("")

    kc = review.get("keyCheckpoints") or []
    lines.append("## 이번 주 체크포인트")
    if kc:
        for c in kc[:12]:
            lines.append(f"- {c.get('checkpoint')}")
    else:
        lines.append("- 구조화된 체크포인트가 없습니다.")
    lines.append("")

    ln = review.get("linkedNotes") or []
    if ln:
        lines.append("## 연결된 내 노트")
        for n in ln[:12]:
            lines.append(f"- {n.get('title')}")
        lines.append("")

    if review.get("warnings"):
        lines.append("## 참고")
        for w in review["warnings"]:
            lines.append(f"- {w}")
        lines.append("")

    lines.append("> 투자 리뷰는 개인 해석 보조입니다. 매수/매도 지시가 아닙니다.")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# 실데이터 로더 (방어적 — 실패 시 warnings에 남기고 빈 데이터)
# ---------------------------------------------------------------------------

def _load_regime_states(warnings: list) -> list:
    try:
        from features.market_memory.memory import list_states
        return list_states(MEMORY_DB, status="current", limit=40)
    except Exception as exc:
        warnings.append(f"시장 내러티브를 불러오지 못했습니다: {exc}")
        return []


def _load_theses_with_deltas(warnings: list):
    try:
        from features.thesis_tracking.service import list_theses
        from features.thesis_tracking.store import connect, latest_delta
        theses = list_theses(db_path=str(MEMORY_DB), status=None)
        deltas: dict[str, dict] = {}
        conn = connect(str(MEMORY_DB))
        try:
            for t in theses:
                tk = str(t.get("ticker") or "").upper()
                if not tk:
                    continue
                d = latest_delta(conn, tk)
                if d:
                    deltas[tk] = d
        finally:
            conn.close()
        return theses, deltas
    except Exception as exc:
        warnings.append(f"Thesis 데이터를 불러오지 못했습니다: {exc}")
        return [], {}


def _load_positions(warnings: list) -> list:
    try:
        from features.portfolio.service import get_portfolio
        return get_portfolio().get("positions", [])
    except Exception as exc:
        warnings.append(f"포트폴리오를 불러오지 못했습니다: {exc}")
        return []


def _load_watchlist(warnings: list) -> list:
    try:
        from features.watchlist_notes.service import get_watchlist
        return get_watchlist() or []
    except Exception as exc:
        warnings.append(f"워치리스트를 불러오지 못했습니다: {exc}")
        return []


def _load_notes(warnings: list) -> list:
    notes = []
    try:
        from features.investment_notes.service import list_notes as list_native_notes
        notes.extend(list_native_notes(limit=40))
    except Exception as exc:
        warnings.append(f"Folio 투자 노트를 불러오지 못했습니다: {exc}")
    try:
        from features.obsidian.importer.note_index import connect, list_notes
        conn = connect(str(MEMORY_DB))
        try:
            notes.extend(list_notes(conn, importable=True))
        finally:
            conn.close()
    except Exception as exc:
        warnings.append(f"Obsidian 노트를 불러오지 못했습니다: {exc}")
    return notes


def _read_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


# 대시보드 마켓 탭.
# US 지수는 ETF가 아닌 지수 레벨(^GSPC/^NDX)을 쓰고, 한국 수치는 providers 체인
# (pykrx 우선 → yfinance)으로 KOSPI·USD/KRW를 가져온다(CLAUDE.md 한국장 규칙).
# size: 중요도 표시용("lg" 핵심 지표 → 큰 카드, "sm" 보조 지표 → 작은 카드).
def _tape_item(label: str, value, change_pct, size: str = "sm") -> dict:
    has = isinstance(value, (int, float))
    return {
        "label": label,
        "value": value if has else None,
        "changePct": change_pct if isinstance(change_pct, (int, float)) else None,
        "status": "fresh" if has else "missing",
        "size": "lg" if size == "lg" else "sm",
    }


def _fetch_us_levels(symbols: dict, warnings: list) -> dict:
    """{yf_symbol: label} → {yf_symbol: {value, changePct}}. 마지막 두 종가로 1D 변화율 계산."""
    out: dict = {}
    try:
        import yfinance as yf
    except Exception as exc:
        warnings.append(f"미국 지수 데이터를 불러오지 못했습니다(yfinance 없음): {exc}")
        return out
    for sym in symbols:
        try:
            hist = yf.Ticker(sym).history(period="7d", interval="1d", auto_adjust=False)
            if hist is None or hist.empty or "Close" not in hist:
                continue
            closes = [float(x) for x in hist["Close"].tolist() if x == x]
            if not closes:
                continue
            last = closes[-1]
            prev = closes[-2] if len(closes) >= 2 else None
            chg = (last / prev - 1.0) * 100.0 if prev else None
            out[sym] = {"value": last, "changePct": chg}
        except Exception as exc:
            warnings.append(f"{symbols[sym]} 시세를 불러오지 못했습니다: {exc}")
    return out


def build_dashboard_tape(date: str, warnings: list) -> dict:
    us_syms = {
        "^GSPC": "S&P 500", "^NDX": "Nasdaq 100", "^DJI": "Dow Jones",
        "^RUT": "Russell 2000", "^TNX": "美 국채 10Y", "^VIX": "VIX",
        "DX-Y.NYB": "달러 인덱스", "GC=F": "금", "CL=F": "WTI 원유",
    }
    us = _fetch_us_levels(us_syms, warnings)

    kospi, kosdaq, fx = {}, {}, {}
    try:
        from features.common.market_data.providers import fetch_korea_market_data
        kr = fetch_korea_market_data(date)
        indices = kr.get("indices") or {}
        kospi = indices.get("KOSPI") or {}
        kosdaq = indices.get("KOSDAQ") or {}
        fx = (kr.get("fx") or {}).get("USDKRW") or {}
    except Exception as exc:
        warnings.append(f"한국 시장 데이터를 불러오지 못했습니다: {exc}")

    def us_item(label, sym, size="sm"):
        d = us.get(sym) or {}
        return _tape_item(label, d.get("value"), d.get("changePct"), size)

    # 프론트는 8칸 그리드에 lg=2칸/sm=1칸으로 배치한다. 아래 순서가 곧 2행 레이아웃이다.
    # 1행: 미국 핵심(S&P·Nasdaq, lg) + 미국 보조(Dow·Russell·국채·VIX, sm)
    # 2행: 한국 핵심(KOSPI·KOSDAQ, lg) + 환율·원자재(USD/KRW·달러인덱스·금·원유, sm)
    items = [
        us_item("S&P 500", "^GSPC", "lg"),
        us_item("Nasdaq 100", "^NDX", "lg"),
        us_item("Dow Jones", "^DJI", "sm"),
        us_item("Russell 2000", "^RUT", "sm"),
        us_item("美 국채 10Y", "^TNX", "sm"),
        us_item("VIX", "^VIX", "sm"),
        _tape_item("KOSPI", kospi.get("close"), kospi.get("changePct"), "lg"),
        _tape_item("KOSDAQ", kosdaq.get("close"), kosdaq.get("changePct"), "lg"),
        _tape_item("USD/KRW", fx.get("close"), fx.get("changePct"), "sm"),
        us_item("달러 인덱스", "DX-Y.NYB", "sm"),
        us_item("금", "GC=F", "sm"),
        us_item("WTI 원유", "CL=F", "sm"),
    ]
    return {"items": items, "asOf": _now_iso()}


def _latest_report_file(folder: Path):
    if not folder.exists():
        return None, None
    files = sorted(folder.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    for path in files:
        data = _read_json(path)
        if data:
            return path, data
    return None, None


def _load_recent_reports(warnings: list) -> list:
    out = []
    try:
        path, data = _latest_report_file(DATA_DIR / "briefings")
        if data:
            d = str(data.get("date") or path.stem)[:10]
            out.append({"type": "briefing", "id": path.stem, "title": f"{d} 시장 브리핑", "date": d, "view": "briefing"})
        path, data = _latest_report_file(DATA_DIR / "company-analysis")
        if data:
            company = data.get("company") if isinstance(data.get("company"), dict) else {}
            name = company.get("ticker") or company.get("name") or data.get("query") or path.stem
            out.append({"type": "analysis", "id": path.stem, "title": f"{name} 기업 분석", "date": str(data.get("date") or "")[:10], "view": "analysis"})
        path, data = _latest_report_file(DATA_DIR / "topic-reports")
        if data:
            label = data.get("topicLabel") or data.get("topicKey") or path.stem
            out.append({"type": "topic", "id": path.stem, "title": str(label), "date": str(data.get("date") or "")[:10], "view": "topicrpt"})
    except Exception as exc:
        warnings.append(f"최근 보고서를 불러오지 못했습니다: {exc}")
    return out


# ---------------------------------------------------------------------------
# 캐싱
# ---------------------------------------------------------------------------

def _cache_path(date: str) -> Path:
    return REVIEW_DIR / f"{date}.json"


def _load_cached(date: str) -> dict | None:
    path = _cache_path(date)
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def _load_latest() -> dict | None:
    if not REVIEW_DIR.exists():
        return None
    files = sorted(REVIEW_DIR.glob("*.json"), reverse=True)
    for path in files:
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
    return None


def _save_cache(date: str, review: dict) -> None:
    try:
        REVIEW_DIR.mkdir(parents=True, exist_ok=True)
        _cache_path(date).write_text(json.dumps(review, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass


# ---------------------------------------------------------------------------
# 공개 진입점
# ---------------------------------------------------------------------------

def build_review(
    *,
    date: str | None = None,
    include_portfolio: bool = True,
    include_watchlist: bool = True,
    include_obsidian: bool = True,
    use_llm: bool = False,
    force_refresh: bool = False,
) -> dict:
    date = str(date or _today())
    if not force_refresh:
        cached = _load_cached(date)
        if cached:
            return normalize_review(cached, date=date)

    warnings: list = []
    regime_states = _load_regime_states(warnings)
    theses, deltas = _load_theses_with_deltas(warnings)
    positions = _load_positions(warnings) if include_portfolio else []
    watchlist = _load_watchlist(warnings) if include_watchlist else []
    notes = _load_notes(warnings) if include_obsidian else []

    market_state = build_market_state(regime_states)
    thesis_changes = build_thesis_changes(theses, deltas)
    portfolio_impacts = build_portfolio_impacts(positions, watchlist, regime_states, thesis_changes)
    key_checkpoints = aggregate_checkpoints(list(deltas.values()), regime_states)
    linked_notes = build_linked_notes(notes)
    stats = build_stats(market_state, thesis_changes, portfolio_impacts, key_checkpoints)
    exposure = build_exposure(portfolio_impacts)
    summary = build_summary(market_state)
    market_tape = build_dashboard_tape(date, warnings)
    recent_reports = _load_recent_reports(warnings)

    if not market_state and not thesis_changes:
        warnings.append("집계할 시장 내러티브/Thesis 데이터가 없습니다. 브리핑·기업분석·내러티브를 먼저 생성하세요.")

    review = {
        "date": date,
        "generatedAt": _now_iso(),
        "mode": "rule",  # LLM 보강은 후속 (현재 규칙 기반)
        "summary": summary,
        "marketTape": market_tape,
        "stats": stats,
        "exposure": exposure,
        "recentReports": recent_reports,
        "marketState": market_state,
        "thesisChanges": thesis_changes,
        "portfolioImpacts": portfolio_impacts,
        "keyCheckpoints": key_checkpoints,
        "linkedNotes": linked_notes,
        "qualitySummary": {},
        "warnings": warnings,
        "stale": False,
    }
    review["markdown"] = render_markdown(review)
    review = normalize_review(review, date=date)
    _save_cache(date, review)
    return review


def get_review(date: str | None = None) -> dict:
    date = str(date or _today())
    cached = _load_cached(date)
    if cached:
        return normalize_review(cached, date=date)
    if date == _today():
        return build_review(date=date)
    latest = _load_latest()
    if latest:
        latest = normalize_review(latest)
        latest["stale"] = True
        latest.setdefault("warnings", []).append(
            f"{date} 리뷰 저장본이 없어 최신 저장본({latest.get('date')})을 표시합니다."
        )
        return latest
    return build_review(date=date)


def generate_review(body: dict | None = None) -> dict:
    body = body or {}
    return build_review(
        date=body.get("date"),
        include_portfolio=body.get("includePortfolio", True),
        include_watchlist=body.get("includeWatchlist", True),
        include_obsidian=body.get("includeObsidian", True),
        use_llm=body.get("useLlm", False),
        force_refresh=body.get("forceRefresh", True),
    )
