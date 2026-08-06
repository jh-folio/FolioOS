"""입력 해석은 조용히 틀리지 않아야 한다.

여기 케이스는 전부 실제로 관찰된 오해석이다. 고정된 색인을 주입해 네트워크 없이 돈다.
"""
from __future__ import annotations

import features.common.company_resolution as resolution


SEC = [
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
    monkeypatch.setattr(resolution, "_index", lambda: {"entries": SEC + KR, "byTicker": {}})
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
