"""Task 1.3 — market inference for Europe and Japan.

The gate is that Europe does not become "UK news plus incidental euro keywords",
Japan does not swallow generic Asia news, and the existing US/KR/GLOBAL/UNKNOWN
behaviour is untouched.
"""
from __future__ import annotations

import pytest

from features.common.market_calendar import infer_doc_market, infer_doc_markets


@pytest.mark.parametrize("title", [
    "日経平均、半導体株高で反発　終値は3万9000円台",
    "日銀、政策金利を据え置き　物価見通しを上方修正",
    "東証プライム市場で値上がり銘柄が優勢",
    "닛케이225 사상 최고치…엔화 약세 지속",
    "Nikkei 225 rises as BOJ holds rates",
])
def test_japanese_market_signals(title):
    assert infer_doc_markets({"title": title}) == ["JP"]


@pytest.mark.parametrize("title", [
    "DAX schließt fester, Halbleiterwerte im Fokus",
    "Le CAC 40 termine en hausse porté par le luxe",
    "El Ibex 35 cierra al alza impulsado por la banca",
    "De AEX sluit hoger dankzij chipaandelen",
    "Il FTSE MIB chiude in rialzo trainato dalle banche",
    "FTSE 100 closes higher as the Bank of England holds",
    "ECB holds rates, signals caution on inflation",
])
def test_european_market_signals_across_all_six_countries(title):
    assert infer_doc_markets({"title": title}) == ["EUROPE"]


@pytest.mark.parametrize("title", [
    "Sara Duterte impeachment trial drags on, but time may be on her side",
    "Taiwan braces for annual Han Kuang anti-invasion drills",
    "이탈리아 총선 결과 발표",
    "손흥민 결승골로 팀 승리",
])
def test_country_and_region_names_alone_are_not_market_signals(title):
    """Only exchanges, indices, currencies and central banks count.

    Nikkei Asia's feed is 60% Taiwan drills and Philippine politics; admitting a
    bare country name would pull that straight into the Japan briefing.
    """
    assert infer_doc_markets({"title": title}) == ["UNKNOWN"]


def test_existing_us_kr_global_behaviour_is_unchanged():
    assert infer_doc_markets({"title": "Fed holds rates steady on inflation outlook"}) == ["US"]
    assert infer_doc_markets({"title": "코스피 2900선 회복…외국인 순매수 전환"}) == ["KR"]
    assert infer_doc_markets({"title": "미국 연준 결정에 코스피 반응"}) == ["US", "KR", "GLOBAL"]
    assert infer_doc_market({"title": "미국 연준 결정에 코스피 반응"}) == "BOTH"


def test_feed_declared_market_outranks_keyword_inference():
    """Local-language items whose text carries no Korean/English market keyword.

    The keyword lists cannot judge them, so the feed's own declaration decides.
    """
    assert infer_doc_markets({"title": "アニメ映画が興行収入首位", "defaultMarket": "JP"}) == ["JP"]
    assert infer_doc_markets({"title": "Lufthansa kämpft mit gestiegenen Kosten", "defaultMarket": "EUROPE"}) == ["EUROPE"]


def test_eu_is_accepted_at_the_boundary_but_stored_as_europe():
    assert infer_doc_markets({"title": "무관한 제목", "market": "EU"}) == ["EUROPE"]
    assert infer_doc_markets({"title": "무관한 제목", "markets": ["EU"]}) == ["EUROPE"]


def test_cross_region_documents_carry_global():
    markets = infer_doc_markets({"title": "일본은행 결정에 유럽증시와 뉴욕증시가 동반 반응"})
    assert "GLOBAL" in markets
    assert {"US", "EUROPE", "JP"} <= set(markets)


def test_single_label_fallback_covers_the_new_markets():
    assert infer_doc_market({"title": "日経平均が反発"}) == "JP"
    assert infer_doc_market({"title": "DAX schließt fester"}) == "EUROPE"


def test_exchange_suffixes_only_count_as_part_of_a_ticker():
    """Bare `.t` as a text token tagged US and KR articles as Japanese.

    The inference text includes the URL, so a path segment like `a.com/b.t`
    looked exactly like a Tokyo ticker. Suffixes are now matched only with a
    ticker in front and never straight after a slash.
    """
    from features.common.market_calendar import _exchange_suffix_markets

    assert _exchange_suffix_markets("toyota 7203.t 주가 상승") == {"JP"}
    assert _exchange_suffix_markets("asml.as 실적 발표") == {"EUROPE"}
    assert _exchange_suffix_markets("sap.de 가이던스 상향") == {"EUROPE"}

    assert _exchange_suffix_markets("뉴욕증시 나스닥 https://a.com/b.t") == set()
    assert _exchange_suffix_markets("turmoil as oil rises") == set()
    assert _exchange_suffix_markets("wsj.com/markets") == set()


def test_wall_street_article_with_a_url_stays_us_only():
    """Regression: the bare-suffix bug turned this exact shape into US+JP+GLOBAL."""
    doc = {
        "title": "뉴욕증시 나스닥 하락, 연준 금리 경로 주목",
        "url": "https://example.com/news/b.t",
    }
    assert infer_doc_markets(doc) == ["US"]
