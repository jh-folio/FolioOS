"""사용자가 입력한 문자열이 어느 기업인지 판단한다.

기존 `infer_requested_company()`는 첫 매치에서 멈추고, 아무것도 못 찾으면 입력
문자열을 그대로 티커로 돌려준다. 그래서 "하우멧"이나 "없는회사"를 넣어도 분석이
그대로 진행되어 빈 보고서가 나왔다. 순서도 DART 우선이라 118,664개(비상장 포함)
안에서 부분일치가 먼저 걸려 "마이크론"이 LG마이크론이 되고 "델타"가 신성델타테크가
됐다.

여기서는 한 곳에서 멈추지 않고 **모든 출처를 같은 기준으로 채점해 비교**하고,
확신할 수 없으면 후보를 돌려준다. LLM을 쓰지 않는다 — 전부 규칙과 로컬 색인이다.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from features.common.company_lookup import (
    DATA_DIR,
    SEC_TICKER_CACHE_PATH,
    _sec_company_rows,
    company_universe,
    normalize,
    read_json,
)

DART_CORP_CODES_PATH = DATA_DIR / "dart-cache" / "corp_codes.json"

# 점수. 정확 일치와 부분 일치 사이를 크게 벌려, 부분 일치가 정확 일치를 이기지 못하게 한다.
EXACT_TICKER = 100
EXACT_NAME = 96
PREFIX_NAME = 88
PREFIX_TICKER = 78
CONTAINS_NAME = 62
CURATED_BONUS = 2
# 질의 문자와 시장이 맞으면 가산한다. "Micron"은 MICRONIX(001190)와 접두 일치가
# 같지만 라틴 문자로 물었으니 미국장이 먼저다. 한글로 물으면 반대로 간다.
SCRIPT_BONUS = 8

CONFIDENT_FLOOR = 88
CONFIDENT_GAP = 8
CANDIDATE_FLOOR = CONTAINS_NAME

_KR_CODE = re.compile(r"^\d{6}$")
_SUFFIXES = re.compile(
    r"\b(inc|corp|corporation|co|ltd|limited|plc|holdings|group|company|the)\b\.?",
    re.I,
)

_INDEX_CACHE: dict | None = None
_INDEX_STAMP: tuple | None = None


def _key(value) -> str:
    """비교용 정규화. 접미사와 구두점을 걷어낸다."""
    text = normalize(str(value or "")).lower().strip()
    text = _SUFFIXES.sub(" ", text)
    return re.sub(r"[^a-z0-9가-힣 ]+", " ", text).strip()


def _ticker_key(value) -> str:
    """SEC는 우선주·클래스 구분에 하이픈을 쓴다(BRK.B가 아니라 BRK-B)."""
    return re.sub(r"[^A-Z0-9\-]", "", str(value or "").upper().replace(".", "-").lstrip("$"))


_TICKER_SHAPED = re.compile(r"^\$?[A-Za-z0-9][A-Za-z0-9.\-]{0,6}$")


def _query_ticker(raw: str) -> str:
    """질의 전체가 티커 모양일 때만 티커로 본다.

    문자를 걷어내고 남는 것을 티커로 쓰면 "없는회사이름123"이 "123"이 되어
    123840, 123550 같은 한국 코드에 접두 일치한다. 모르는 입력이 그럴듯한
    후보를 얻는 것이 조용히 틀리는 것보다 나쁘다.
    """
    text = str(raw or "").strip()
    return _ticker_key(text) if _TICKER_SHAPED.match(text) else ""


def _query_script(raw: str) -> str:
    if re.search(r"[가-힣]", str(raw or "")):
        return "KR"
    if re.search(r"[A-Za-z]", str(raw or "")):
        return "US"
    return ""


def _stamp(path: Path) -> tuple:
    try:
        stat = path.stat()
        return (stat.st_mtime_ns, stat.st_size)
    except OSError:
        return (0, 0)


def _dart_listed_rows() -> list[dict]:
    """상장 종목만 남긴다.

    비상장 법인 11만여 개는 분석할 시장 데이터가 없는데도 부분일치로 먼저 걸려
    엉뚱한 회사를 답으로 만든다.
    """
    payload = read_json(DART_CORP_CODES_PATH, None)
    rows = payload.get("data") if isinstance(payload, dict) and "data" in payload else payload
    if not isinstance(rows, list):
        return []
    listed = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        code = str(row.get("stock_code") or "").strip()
        if not _KR_CODE.match(code):
            continue
        listed.append(
            {
                "ticker": code,
                "name": str(row.get("corp_name") or "").strip(),
                "englishName": str(row.get("corp_eng_name") or "").strip(),
                "market": "KR",
                "cik": "",
                "source": "dart",
            }
        )
    return listed


def _sec_entries() -> list[dict]:
    rows = _sec_company_rows(read_json(SEC_TICKER_CACHE_PATH, None))
    entries = []
    for row in rows:
        ticker = _ticker_key(row.get("ticker"))
        title = str(row.get("title") or "").strip()
        if not ticker or not title:
            continue
        entries.append(
            {
                "ticker": ticker,
                "name": title,
                "englishName": title,
                "market": "US",
                "cik": str(row.get("cik_str") or "").strip().zfill(10),
                "source": "sec",
            }
        )
    return entries


def _curated_entries() -> list[dict]:
    entries = []
    for company in company_universe():
        ticker = str(company.get("ticker") or "").strip()
        if not ticker:
            continue
        entries.append(
            {
                "ticker": ticker.upper() if not _KR_CODE.match(ticker) else ticker,
                "name": str(company.get("name") or "").strip(),
                "englishName": str(company.get("name") or "").strip(),
                "market": str(company.get("market") or ""),
                "cik": str(company.get("cik") or ""),
                "sector": str(company.get("sector") or ""),
                "aliases": [str(a) for a in (company.get("aliases") or [])],
                "source": "curated",
            }
        )
    return entries


def _build_index() -> dict:
    entries = _curated_entries() + _sec_entries() + _dart_listed_rows()
    by_ticker: dict[str, list[dict]] = {}
    for entry in entries:
        by_ticker.setdefault(_ticker_key(entry["ticker"]) or entry["ticker"], []).append(entry)
    return {"entries": entries, "byTicker": by_ticker}


def _index() -> dict:
    global _INDEX_CACHE, _INDEX_STAMP
    stamp = (_stamp(SEC_TICKER_CACHE_PATH), _stamp(DART_CORP_CODES_PATH))
    if _INDEX_CACHE is None or _INDEX_STAMP != stamp:
        _INDEX_CACHE = _build_index()
        _INDEX_STAMP = stamp
    return _INDEX_CACHE


def _names(entry: dict) -> list[str]:
    values = [entry.get("name"), entry.get("englishName"), *(entry.get("aliases") or [])]
    return [v for v in (str(x or "").strip() for x in values) if v]


def _score(entry: dict, query_key: str, query_ticker: str, script: str) -> int:
    best = 0
    if query_ticker and _ticker_key(entry.get("ticker")) == query_ticker:
        best = EXACT_TICKER
    for name in _names(entry):
        name_key = _key(name)
        if not name_key:
            continue
        if name_key == query_key:
            best = max(best, EXACT_NAME)
        elif query_key and name_key.startswith(query_key):
            best = max(best, PREFIX_NAME)
        elif query_key and query_key in name_key:
            best = max(best, CONTAINS_NAME)
    if best < PREFIX_TICKER and query_ticker and len(query_ticker) >= 2:
        if _ticker_key(entry.get("ticker")).startswith(query_ticker):
            best = max(best, PREFIX_TICKER)
    if best and entry.get("source") == "curated":
        best += CURATED_BONUS
    if best and best < EXACT_TICKER and script and entry.get("market") == script:
        best += SCRIPT_BONUS
    return best


def _public(entry: dict, score: int) -> dict:
    return {
        # 이름 일부만 겹친 약한 후보인지 알려준다. "반도체"에는 한미반도체 같은
        # 회사가 걸리지만 그건 대개 주제어이며, 화면이 후보 목록을 띄울 자리는 아니다.
        "strong": score >= PREFIX_NAME,
        "ticker": entry.get("ticker", ""),
        "name": entry.get("name", ""),
        "market": entry.get("market", ""),
        "cik": entry.get("cik", ""),
        "sector": entry.get("sector", ""),
        "source": entry.get("source", ""),
        "score": score,
    }


def _dedupe(rows: list[tuple[dict, int]]) -> list[tuple[dict, int]]:
    """같은 회사가 출처마다 한 번씩 나온다. 점수가 높은 쪽만 남긴다."""
    best: dict[str, tuple[dict, int]] = {}
    for entry, score in rows:
        key = f"{entry.get('market','')}:{_ticker_key(entry.get('ticker'))}"
        if key not in best or score > best[key][1]:
            best[key] = (entry, score)
    return sorted(best.values(), key=lambda row: (-row[1], row[0].get("name", "")))


def resolve_company_query(query: str, *, limit: int = 6) -> dict:
    """입력이 어느 기업인지 판단한다. 확신할 수 없으면 후보를 돌려준다.

    status는 셋이다.
      confident  하나로 좁혀졌다. 바로 분석해도 된다.
      ambiguous  후보는 있는데 하나로 못 좁혔다. 사용자가 고른다.
      unknown    아는 기업이 없다. 조용히 진행하지 않는다.
    """
    raw = str(query or "").strip()
    if not raw:
        return {"query": "", "status": "unknown", "match": None, "candidates": [], "reason": "empty_query"}

    query_key = _key(raw)
    query_ticker = _query_ticker(raw)
    script = _query_script(raw)
    scored = []
    for entry in _index()["entries"]:
        score = _score(entry, query_key, query_ticker, script)
        if score >= CANDIDATE_FLOOR:
            scored.append((entry, score))

    ranked = _dedupe(scored)[: max(limit, 1) * 3]
    if not ranked:
        return {"query": raw, "status": "unknown", "match": None, "candidates": [], "reason": "no_match"}

    top_entry, top_score = ranked[0]
    runner_score = ranked[1][1] if len(ranked) > 1 else 0
    candidates = [_public(entry, score) for entry, score in ranked[:limit]]

    # 정확한 티커를 넣었으면 그게 답이다. "MU"를 MUELLER INDUSTRIES(이름 접두 일치)와
    # 저울질하면 티커를 정확히 아는 사용자가 오히려 한 번 더 고르게 된다.
    exact_ticker_hits = sum(1 for _, score in ranked if score >= EXACT_TICKER)
    if top_score >= EXACT_TICKER and exact_ticker_hits == 1:
        return {
            "query": raw,
            "status": "confident",
            "match": _public(top_entry, top_score),
            "candidates": candidates,
            "reason": "exact_ticker",
        }

    if top_score >= CONFIDENT_FLOOR and (len(ranked) == 1 or top_score - runner_score >= CONFIDENT_GAP):
        return {
            "query": raw,
            "status": "confident",
            "match": _public(top_entry, top_score),
            "candidates": candidates,
            "reason": "single_strong_match",
        }
    return {
        "query": raw,
        "status": "ambiguous",
        "match": None,
        "candidates": candidates,
        "reason": "multiple_close_matches",
    }
