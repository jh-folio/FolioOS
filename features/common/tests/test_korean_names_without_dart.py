"""한국 기업 정식명은 DART 캐시 없이도 풀려야 한다.

`company_resolution`의 한국 종목 후보는 DART 상장 목록에서 대부분 온다. 그런데 그
목록(`data/dart-cache/corp_codes.json`, 21.6MB)은 **배포에 없고** `DART_API_KEY`가 있어야
받아진다. 게다가 받아오는 경로는 기업분석에만 있어서, 브리핑만 만드는 워크스페이스에는
영원히 생기지 않는다 — `_dart_listed_rows()`는 읽기만 하고 없으면 조용히 0건이 된다.

그래서 키 없이 새로 설치한 사용자는 한국 기업이 수동 사전 8곳으로만 풀렸다. 실측:
2026-08-14 세션 한국장 브리핑이 `현대자동차`·`LG전자`를 주도 기업으로 꼽았는데 둘 다
`unknown`으로 끝나 차트가 빈자리로 나갔다(`unresolved-1`, `unresolved-2`).

해결은 이미 배포에 있는 `config/kospi200_constituents.json`(199곳)에 한글 정식명을
별칭으로 넣는 것이다. `_constituent_entries()`가 행의 `aliases`를 이미 읽으므로 런타임
코드는 바뀌지 않는다.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from features.common import company_resolution as cr
from features.common.config_bootstrap import resolve_config

ROOT = Path(__file__).resolve().parents[3]


@pytest.fixture
def without_dart(monkeypatch, tmp_path):
    """DART 캐시가 없는 워크스페이스. 키 없이 새로 설치한 상태다."""
    monkeypatch.setattr(cr, "DART_CORP_CODES_PATH", tmp_path / "없는파일.json")
    for name in dir(cr):
        fn = getattr(cr, name)
        if hasattr(fn, "cache_clear"):
            fn.cache_clear()
    assert cr._dart_listed_rows() == [], "이 테스트의 전제는 DART가 비어 있다는 것이다"
    yield
    for name in dir(cr):
        fn = getattr(cr, name)
        if hasattr(fn, "cache_clear"):
            fn.cache_clear()


@pytest.mark.parametrize(
    ("query", "ticker"),
    [
        ("현대자동차", "005380"),
        ("LG전자", "066570"),
        ("카카오", "035720"),
        ("현대모비스", "012330"),
        ("셀트리온", "068270"),
        ("삼성바이오로직스", "207940"),
        ("삼성전자", "005930"),
        ("SK하이닉스", "000660"),
    ],
)
def test_a_korean_formal_name_resolves_without_the_dart_cache(without_dart, query, ticker):
    resolution = cr.resolve_company_query(query, prefer_home=True)

    assert resolution.get("status") == "confident", query
    assert (resolution.get("match") or {}).get("ticker") == ticker


def test_the_english_name_still_resolves(without_dart):
    """영문 표기는 원래 되던 길이다. 한글을 채우면서 깨뜨리지 않는다."""
    for query, ticker in (("Hyundai Motor", "005380"), ("Samsung Electronics", "005930")):
        resolution = cr.resolve_company_query(query, prefer_home=True)
        assert (resolution.get("match") or {}).get("ticker") == ticker, query


def test_the_briefing_chart_path_resolves_the_same_names(without_dart):
    """실제로 깨졌던 경로. 여기서 실패하면 차트가 빈자리로 나간다."""
    from features.daily_briefing.visuals import leading_company_subjects_from_markdown

    markdown = (
        "# Korea Market Briefing — 2026.08.14 마감\n"
        "## 3. 한국장을 주도한 기업 ① — 현대자동차\n"
        "## 4. 한국장을 주도한 기업 ② — LG전자\n"
    )

    result = leading_company_subjects_from_markdown(markdown)

    assert [row["ticker"] for row in result["kr"]] == ["005380", "066570"]
    assert result["unresolvedByMarket"]["kr"] == []


def test_the_shipped_constituents_carry_korean_names():
    """배포본에 실려야 새로 설치한 사용자가 쓴다."""
    payload = json.loads((ROOT / "defaults" / "config" / "kospi200_constituents.json").read_text(encoding="utf-8"))
    rows = payload["companies"]

    assert len(rows) >= 199
    assert all(row.get("aliases") for row in rows), "한글 별칭이 없는 행이 있다"

    by_ticker = {row["ticker"]: row for row in rows}
    assert "LG전자" in by_ticker["066570"]["aliases"]
    assert "현대자동차" in by_ticker["005380"]["aliases"]


def test_the_display_name_stays_readable():
    """한글은 검색어로만 붙는다. 표시 이름까지 바꾸면 워치리스트 표기가 흔들린다."""
    payload = json.loads(resolve_config("kospi200_constituents.json").read_text(encoding="utf-8"))
    by_ticker = {row["ticker"]: row for row in payload["companies"]}

    assert by_ticker["066570"]["label"] == "LG Electronics"
    assert by_ticker["005380"]["label"] == "Hyundai Motor"


def test_the_manual_master_carries_the_formal_hyundai_name():
    """사전에는 `현대차`만 있었다. 본문이 정식명을 쓰면 그대로 실패했다."""
    payload = json.loads((ROOT / "defaults" / "config" / "company_master.json").read_text(encoding="utf-8"))
    entry = next(c for c in payload["companies"] if c["ticker"] == "005380")

    assert {"현대차", "현대자동차"} <= set(entry["aliases"])
