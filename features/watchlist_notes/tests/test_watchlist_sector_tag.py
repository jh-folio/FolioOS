"""카드가 `Unclassified`를 분류인 것처럼 달지 않는다."""
from features.watchlist_notes import service


def test_the_unknown_placeholder_never_becomes_a_tag():
    """SEC `company_tickers.json`과 일본·유럽 구성종목 파일은 섹터를 담지 않는다.

    그 출처로 해석된 회사는 전부 `Unclassified`를 받는데, 그대로 태그로 올리면 카드가
    회사를 그렇게 분류한 것처럼 보인다. 실제로 종목 넷 중 셋이 그랬다.
    """
    assert service._real_sector("Unclassified") == ""
    assert service._real_sector("") == ""
    assert service._real_sector(None) == ""
    assert service._real_sector("  Technology  ") == "Technology"


def test_a_missing_sector_is_filled_from_the_cache_and_leads_the_tags(monkeypatch):
    monkeypatch.setattr(
        service, "resolve_sectors",
        lambda entries: {"LRCX": "Technology", "6501.T": "Industrials"},
    )
    cards = [
        {"item": "LAM RESEARCH CORP", "ticker": "LRCX", "market": "US", "sector": "", "tags": []},
        {"item": "Hitachi, Ltd.", "ticker": "6501.T", "market": "JP", "sector": "", "tags": ["매출 성장", "AI"]},
    ]

    service._fill_missing_sectors(cards)

    assert cards[0]["tags"] == ["Technology"]
    assert cards[1]["tags"] == ["Industrials", "매출 성장", "AI"]


def test_a_curated_sector_wins_over_the_quote_provider(monkeypatch):
    """수동 사전의 `Aerospace`가 yfinance의 `Industrials`보다 종목을 잘 설명한다."""
    asked = []
    monkeypatch.setattr(service, "resolve_sectors", lambda entries: asked.extend(entries) or {})
    cards = [{"item": "Howmet Aerospace", "ticker": "HWM", "market": "US", "sector": "Aerospace", "tags": ["Aerospace"]}]

    service._fill_missing_sectors(cards)

    assert asked == []
    assert cards[0]["tags"] == ["Aerospace"]


def test_a_theme_keyword_is_left_alone(monkeypatch):
    """티커가 없는 관심 주제는 물어볼 대상이 아니다."""
    asked = []
    monkeypatch.setattr(service, "resolve_sectors", lambda entries: asked.extend(entries) or {})
    cards = [{"item": "AI 반도체", "ticker": "", "market": "", "sector": "", "tags": ["반도체"]}]

    service._fill_missing_sectors(cards)

    assert asked == []
    assert cards[0]["tags"] == ["반도체"]


def test_a_broken_lookup_leaves_the_card_as_it_was(monkeypatch):
    """섹터 하나 때문에 워치리스트가 통째로 비면 안 된다."""
    def boom(entries):
        raise RuntimeError("network down")

    monkeypatch.setattr(service, "resolve_sectors", boom)
    cards = [{"item": "LAM RESEARCH CORP", "ticker": "LRCX", "market": "US", "sector": "", "tags": ["반도체"]}]

    service._fill_missing_sectors(cards)

    assert cards[0]["tags"] == ["반도체"]
