from unittest.mock import patch

from features.watchlist_notes import service


def _doc(title="NVIDIA expands AI server platform"):
    return {
        "title": title,
        "source": "Reuters",
        "date": "2026-06-24",
        "url": "https://example.test/nvda",
        "summary": "NVIDIA news",
        "sectors": ["Semiconductors"],
        "impactTags": ["AI"],
        "companies": [{"name": "NVIDIA Corporation", "ticker": "NVDA", "sector": "Semiconductors", "market": "US"}],
    }


def test_tradingview_symbol_for_us_and_kr_companies():
    assert service.tradingview_symbol_for_company({"ticker": "NVDA", "market": "US"}) == "NASDAQ:NVDA"
    assert service.tradingview_symbol_for_company({"ticker": "005930", "market": "KR"}) == "KRX:005930"
    assert service.tradingview_symbol_for_company({}) == ""


def test_tradingview_symbol_for_query_falls_back_for_tickers_and_indexes():
    assert service.tradingview_symbol_for_query("PLTR") == "NASDAQ:PLTR"
    assert service.tradingview_symbol_for_query("QQQ") == "NASDAQ:QQQ"
    assert service.tradingview_symbol_for_query("GEV") == "NYSE:GEV"
    assert service.tradingview_symbol_for_query("HWM") == "NYSE:HWM"
    assert service.tradingview_symbol_for_query("SPCX") == "NASDAQ:SPCX"
    assert service.tradingview_symbol_for_query("Russell 2000") == "AMEX:IWM"
    assert service.tradingview_symbol_for_query("Dollar Index") == "AMEX:UUP"
    assert service.tradingview_symbol_for_query("US10Y") == "NASDAQ:TLT"
    assert service.tradingview_symbol_for_query("WTI Crude") == "AMEX:USO"
    assert service.tradingview_symbol_for_query("005930") == "KRX:005930"
    assert service.tradingview_symbol_for_query("KOSPI") == "INDEX:KSIC"


def test_watchlist_company_from_constituents_prefers_company_name_over_short_ticker_overlap():
    gev = service.watchlist_company_from_constituents("GE Vernova Inc.")
    hwm = service.watchlist_company_from_constituents("Howmet Aerospace Inc.")

    assert gev["ticker"] == "GEV"
    assert gev["name"] == "GE Vernova"
    assert hwm["ticker"] == "HWM"


def test_watchlist_detail_returns_single_item_news_and_company_metadata():
    doc = _doc()
    with (
        patch("features.common.research_library.indexing.service.load_index", return_value={"documents": []}),
        patch("features.common.research_library.search.service.search_documents", return_value=[doc]),
    ):
        detail = service.watchlist_detail("NVIDIA", limit=5)

    assert detail["item"] == "NVIDIA"
    assert detail["company"]["ticker"] == "NVDA"
    assert detail["company"]["tradingViewSymbol"] == "NASDAQ:NVDA"
    assert detail["newsCount"] == 1
    assert detail["news"][0]["title"] == doc["title"]
    assert detail["tags"] == ["Semiconductors", "AI"]


def test_watchlist_detail_unresolved_item_keeps_local_news_without_widget_symbol():
    doc = {"title": "AI supply chain update", "source": "Local", "date": "2026-06-24", "companies": []}
    with (
        patch("features.common.research_library.indexing.service.load_index", return_value={"documents": []}),
        patch("features.common.research_library.search.service.search_documents", return_value=[doc]),
    ):
        detail = service.watchlist_detail("AI", limit=5)

    assert detail["item"] == "AI"
    assert detail["company"]["tradingViewSymbol"] == ""
    assert detail["newsCount"] == 1


def test_watchlist_detail_resolves_known_company_without_matching_news():
    with (
        patch("features.common.research_library.indexing.service.load_index", return_value={"documents": []}),
        patch("features.common.research_library.search.service.search_documents", return_value=[]),
    ):
        detail = service.watchlist_detail("Apple", limit=5)

    assert detail["company"]["ticker"] == "AAPL"
    assert detail["company"]["tradingViewSymbol"] == "NASDAQ:AAPL"
    assert detail["newsCount"] == 0


def test_watchlist_detail_uses_query_symbol_for_bare_ticker_without_news():
    with (
        patch("features.common.research_library.indexing.service.load_index", return_value={"documents": []}),
        patch("features.common.research_library.search.service.search_documents", return_value=[]),
    ):
        detail = service.watchlist_detail("PLTR", limit=5)

    assert detail["company"]["tradingViewSymbol"] == "NASDAQ:PLTR"


def test_watchlist_overview_resolves_card_company_from_watchlist_item_not_unrelated_news_company():
    doc = {
        "title": "Alphabet and GE Vernova power story",
        "source": "Reuters",
        "date": "2026-06-24",
        "url": "https://example.test/gev",
        "summary": "GE Vernova news",
        "sectors": ["Industrials"],
        "impactTags": ["Power"],
        "companies": [
            {"name": "Alphabet", "ticker": "GOOGL", "sector": "Internet", "market": "US"},
            {"name": "GE Vernova Inc.", "ticker": "GEV", "sector": "Industrials", "market": "US"},
        ],
    }
    with (
        patch("features.watchlist_notes.service.get_watchlist", return_value=["GE Vernova Inc."]),
        patch("features.common.research_library.indexing.service.load_index", return_value={"documents": []}),
        patch("features.common.research_library.search.service.search_documents", return_value=[doc]),
    ):
        overview = service.watchlist_overview(limit_per_item=5)

    card = overview["items"][0]
    assert card["item"] == "GE Vernova Inc."
    assert card["ticker"] == "GEV"
    assert "GE Vernova" in card["companyName"]
    assert card["tradingViewSymbol"] == "NYSE:GEV"
    assert card["tags"]
