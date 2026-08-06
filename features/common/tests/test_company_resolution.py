"""입력 해석은 조용히 틀리지 않아야 한다.

여기 케이스는 전부 실제로 관찰된 오해석이다. 고정된 색인을 주입해 네트워크 없이 돈다.
"""
from __future__ import annotations

import features.common.company_resolution as resolution


EU_JP = [
    {"ticker": "ASML.AS", "name": "ASML Holding", "englishName": "", "market": "EUROPE", "cik": "", "exchange": "EURONEXT_AMSTERDAM", "source": "constituents"},
    {"ticker": "MC.PA", "name": "LVMH", "englishName": "", "market": "EUROPE", "cik": "", "exchange": "EURONEXT_PARIS", "source": "constituents"},
    {"ticker": "7203", "name": "トヨタ自動車", "englishName": "", "market": "JP", "cik": "", "exchange": "JPX", "source": "constituents"},
]
SEC = [
    {"ticker": "ASML", "name": "ASML HOLDING NV", "englishName": "ASML HOLDING NV", "market": "US", "cik": "0000937966", "exchange": "Nasdaq", "source": "sec"},
    {"ticker": "ASMLF", "name": "ASML HOLDING NV", "englishName": "ASML HOLDING NV", "market": "US", "cik": "0000937966", "exchange": "OTC", "source": "sec"},
    {"ticker": "MU", "name": "MICRON TECHNOLOGY INC", "englishName": "MICRON TECHNOLOGY INC", "market": "US", "cik": "0000723125", "source": "sec"},
    {"ticker": "MLI", "name": "MUELLER INDUSTRIES INC", "englishName": "MUELLER INDUSTRIES INC", "market": "US", "cik": "0000089439", "source": "sec"},
    {"ticker": "HWM", "name": "Howmet Aerospace Inc.", "englishName": "Howmet Aerospace Inc.", "market": "US", "cik": "0000004281", "source": "sec"},
    {"ticker": "BRK-B", "name": "BERKSHIRE HATHAWAY INC", "englishName": "BERKSHIRE HATHAWAY INC", "market": "US", "cik": "0001067983", "source": "sec"},
    {"ticker": "JNJ", "name": "JOHNSON & JOHNSON", "englishName": "JOHNSON & JOHNSON", "market": "US", "cik": "0000200406", "source": "sec"},
    {"ticker": "JOUT", "name": "JOHNSON OUTDOORS INC", "englishName": "JOHNSON OUTDOORS INC", "market": "US", "cik": "0000788329", "source": "sec"},
]
KR = [
    {"ticker": "016990", "name": "LG마이크론", "englishName": "LG Micron Ltd.", "market": "KR", "cik": "", "source": "dart"},
    {"ticker": "001190", "name": "마이크로닉스", "englishName": "MICRONIX CO", "market": "KR", "cik": "", "source": "dart"},
    {"ticker": "123840", "name": "이엔에프테크놀로지", "englishName": "ENF Technology", "market": "KR", "cik": "", "source": "dart"},
    {"ticker": "005930", "name": "Samsung Electronics", "englishName": "Samsung Electronics", "market": "KR", "cik": "", "aliases": ["삼성전자", "005930"], "source": "curated"},
]


def _resolve(monkeypatch, query, **kwargs):
    monkeypatch.setattr(resolution, "_index", lambda: {"entries": SEC + KR + EU_JP, "byTicker": {}})
    return resolution.resolve_company_query(query, **kwargs)


def test_unknown_input_is_reported_not_echoed(monkeypatch):
    """예전에는 입력 문자열이 그대로 티커가 되어 빈 보고서가 나왔다."""
    result = _resolve(monkeypatch, "없는회사이름123")
    assert result["status"] == "unknown"
    assert result["match"] is None
    assert result["candidates"] == []


def test_digits_inside_a_name_are_not_treated_as_a_ticker(monkeypatch):
    """문자를 걷어낸 "123"이 한국 코드 123840에 접두 일치하면 모르는 입력이 답을 얻는다."""
    result = _resolve(monkeypatch, "없는회사이름123")
    assert "123840" not in [row["ticker"] for row in result["candidates"]]


def test_exact_ticker_wins_over_a_name_prefix(monkeypatch):
    """MU를 MUELLER와 저울질하면 티커를 정확히 아는 사용자가 한 번 더 고르게 된다."""
    result = _resolve(monkeypatch, "MU")
    assert result["status"] == "confident"
    assert result["match"]["ticker"] == "MU"


def test_latin_query_prefers_the_us_listing(monkeypatch):
    """MICRONIX(001190)도 "Micron"에 접두 일치한다. 라틴 문자로 물었으면 미국장이 먼저다."""
    result = _resolve(monkeypatch, "Micron")
    assert result["status"] == "confident"
    assert result["match"]["ticker"] == "MU"


def test_hangul_query_prefers_the_korean_listing(monkeypatch):
    result = _resolve(monkeypatch, "삼성전자")
    assert result["status"] == "confident"
    assert result["match"]["ticker"] == "005930"


def test_share_class_dot_maps_to_the_sec_dash(monkeypatch):
    """SEC 파일은 BRK.B가 아니라 BRK-B로 적는다."""
    result = _resolve(monkeypatch, "BRK.B")
    assert result["status"] == "confident"
    assert result["match"]["ticker"] == "BRK-B"


def test_genuinely_ambiguous_input_offers_candidates_instead_of_guessing(monkeypatch):
    result = _resolve(monkeypatch, "Johnson")
    assert result["status"] == "ambiguous"
    assert result["match"] is None
    assert {"JNJ", "JOUT"} <= {row["ticker"] for row in result["candidates"]}


def test_empty_query_is_unknown(monkeypatch):
    assert _resolve(monkeypatch, "   ")["status"] == "unknown"


def test_unlisted_korean_corporations_never_become_candidates():
    """DART 캐시 118,664건 중 상장은 3,981건뿐이다. 나머지는 분석할 시장 데이터가 없다."""
    rows = [
        {"corp_name": "다코", "corp_eng_name": "Daco corporation", "stock_code": "", "corp_code": "00434003"},
        {"corp_name": "삼성전자", "corp_eng_name": "SAMSUNG ELECTRONICS CO,.LTD", "stock_code": "005930", "corp_code": "00126380"},
    ]
    import features.common.company_resolution as module

    original = module.read_json
    module.read_json = lambda *_args, **_kwargs: rows
    try:
        listed = module._dart_listed_rows()
    finally:
        module.read_json = original
    assert [row["ticker"] for row in listed] == ["005930"]


def test_weak_contains_matches_are_marked_so_screens_can_ignore_them(monkeypatch):
    """워치리스트는 주제어도 받는다. "반도체"에 한미반도체가 걸린다고 후보를 띄우면 안 된다."""
    result = _resolve(monkeypatch, "Johnson")
    strong = [row for row in result["candidates"] if row["strong"]]
    assert strong, "이름 접두 일치는 강한 후보다"

    weak = _resolve(monkeypatch, "on")
    assert all(not row["strong"] for row in weak["candidates"]), weak["candidates"]


def test_the_otc_ordinary_line_never_outranks_the_listed_one(monkeypatch):
    """유럽·일본 기업은 상장 라인과 원주 OTC 라인 두 줄로 SEC에 올라 있다.

    동점이면 dual-listed 기업이 전부 "애매"로 떨어진다 — 0.5가 다루는 바로 그 집합이다.
    """
    result = _resolve(monkeypatch, "ASML Holding")
    assert result["status"] == "confident"
    assert result["match"]["ticker"] == "ASML"
    assert result["match"]["exchange"] != "OTC"


def test_one_company_on_two_exchanges_is_one_answer(monkeypatch):
    """ASML은 SEC와 암스테르담 양쪽에 있다. 사용자에게는 고를 의미가 없는 갈림길이다."""
    result = _resolve(monkeypatch, "ASML Holding")
    assert [row["ticker"] for row in result["candidates"]] == ["ASML"]


def test_a_local_only_listing_resolves_but_carries_no_sec_route(monkeypatch):
    """자국에만 상장된 기업도 찾아는 준다 — 워치리스트·차트에는 쓸 수 있다.

    CIK가 없다는 사실이 화면에 남아야 기업분석이 "왜 안 되는지" 말할 수 있다.
    """
    for query, ticker in (("LVMH", "MC.PA"), ("トヨタ自動車", "7203")):
        result = _resolve(monkeypatch, query)
        assert result["status"] == "confident", query
        assert result["match"]["ticker"] == ticker
        assert not result["match"]["cik"]
