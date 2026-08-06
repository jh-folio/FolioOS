"""회사의 여러 표기로 자료를 찾아 하나로 합친다.

예전에는 사용자가 친 원문 문자열 하나로 검색했다. `NVDA`로 찾으면 기사가
"엔비디아"·"NVIDIA"라고 써도 안 걸려서, 30칸 중 25칸이 Caterpillar·Spotify 같은
무관한 기사로 채워지고 그 안에서 근거를 골랐다(실제로 NVDA 보고서에 LATAM 항공
실적이 올라왔다).

표기를 이어 붙여 한 번에 검색해도 안 된다. 실측에서 "Micron Technology MU 마이크론"은
1건으로 무너졌다 — 토큰이 많을수록 질의가 좁아진다. **표기마다 따로 찾아 문서 단위로
합치고, 몇 개 표기가 걸렸는지로 순위를 매긴다.**
"""
from __future__ import annotations

from features.common.company_lookup import company_universe

# 한 표기가 너무 짧으면 아무 문서에나 걸린다. "MU"처럼 티커는 예외로 둔다.
MIN_TERM_LENGTH = 2


def company_search_terms(company: dict | None, query: str = "") -> list[str]:
    """검색에 쓸 회사 표기들. 티커·정식명·별칭(한글·일본어 포함)."""
    company = company or {}
    terms: list[str] = []

    def add(value) -> None:
        text = str(value or "").strip()
        if len(text) >= MIN_TERM_LENGTH and text.lower() not in {t.lower() for t in terms}:
            terms.append(text)

    add(company.get("ticker"))
    add(company.get("name"))
    add(query)
    # 수동 사전의 별칭은 한국 사용자가 실제로 치는 표기를 담고 있다.
    ticker = str(company.get("ticker") or "").upper()
    if ticker:
        for row in company_universe():
            if str(row.get("ticker") or "").upper() == ticker:
                for alias in row.get("aliases") or []:
                    add(alias)
    return terms


def search_company_documents(index, search_fn, company: dict | None, query: str = "", limit: int = 30) -> list[dict]:
    """표기마다 검색하고 문서 단위로 합친다.

    같은 문서가 여러 표기에서 나오면 그만큼 이 회사와 가깝다는 뜻이므로 위로 올린다.
    각 표기의 원래 순위는 동점을 가르는 데만 쓴다.
    """
    terms = company_search_terms(company, query)
    if not terms:
        return []

    merged: dict[str, dict] = {}
    for term in terms:
        for rank, doc in enumerate(search_fn(index, query=term, company=term, limit=limit) or []):
            key = str(doc.get("path") or doc.get("id") or doc.get("title") or "")
            if not key:
                continue
            row = merged.get(key)
            if row is None:
                merged[key] = {"doc": doc, "hits": 1, "best": rank}
            else:
                row["hits"] += 1
                row["best"] = min(row["best"], rank)

    ranked = sorted(merged.values(), key=lambda row: (-row["hits"], row["best"]))
    return [row["doc"] for row in ranked[:limit]]
