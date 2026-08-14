"""가장 약한 신호가 가장 센 라벨을 받으면 안 된다.

`GLOBAL`은 시장이 아니라 통행권이다 — `documents_for_scope`가 모든 scope에 GLOBAL을
허용하므로, 그 태그가 붙은 자료는 미국·한국·유럽·일본 브리핑이 **모두** 근거로 쓴다.

`markets_with_feed_fallback`은 본문·제목에서 아무 신호도 못 찾았을 때만 도는 마지막
단계다. 거기서 `GLOBAL`을 내주면 "분류 못 하겠음"이 "어디에나 해당"이 된다.

실측(2026-08-13, 최근 24세션): GLOBAL 단독 문서 1,149건이 네 브리핑의 공용 근거였고
일본장은 그것이 풀의 73.5%였다. 그중 148건이 이 경로였으며 145건이 `default_market:
GLOBAL`을 선언한 피드(Financial Times 4 · Reuters 2 · 연합인포맥스)에서 왔다 —
Aston Martin, Wizz Air 같은 유럽 종목 기사가 일본장 브리핑 근거로 올라왔다.
"""
from __future__ import annotations

import pytest

from features.common.market_scope import feed_in_scope, market_tags_visible
from features.common.research_library.rss.normalizer import markets_with_feed_fallback


def test_a_global_feed_no_longer_labels_an_unreadable_article_as_global():
    assert markets_with_feed_fallback(["UNKNOWN"], "GLOBAL") == ["UNKNOWN"]


@pytest.mark.parametrize("market", ["US", "KR", "EUROPE", "JP"])
def test_a_real_market_hint_still_fills_in(market):
    """이 fallback의 본래 목적은 그대로다."""
    assert markets_with_feed_fallback(["UNKNOWN"], market) == [market]


@pytest.mark.parametrize("stored", [["US"], ["EUROPE"], ["US", "KR", "GLOBAL"], ["GLOBAL"]])
def test_a_real_signal_always_beats_the_feed_hint(stored):
    """발행사=시장 신호 금지. 본문이 말했으면 피드는 끼어들지 않는다."""
    assert markets_with_feed_fallback(stored, "GLOBAL") == stored


def test_an_article_can_still_be_global_when_its_own_text_says_so():
    """유가·달러·공급망 기사는 계속 GLOBAL이다. 막은 것은 추론이 아니라 fallback이다."""
    from features.common.market_calendar import infer_doc_markets

    markets = infer_doc_markets({"title": "Oil prices climb as Middle East supply chain tightens"})

    assert "GLOBAL" in markets
    assert markets_with_feed_fallback(markets, "GLOBAL") == markets


def test_the_declaration_still_governs_collection_scope():
    """선언을 지우지 않은 이유. 지웠다면 유럽을 끈 사용자에게서 FT가 사라진다."""
    assert feed_in_scope({"default_market": "GLOBAL"}, ["US"]) is True
    assert feed_in_scope({"default_market": "EUROPE"}, ["US"]) is False


def test_the_article_does_not_vanish_from_the_rss_screen():
    """브리핑 근거에서만 빠진다. 목록에서 사라지면 자료를 잃은 것처럼 보인다."""
    assert market_tags_visible(["UNKNOWN"], ["US"]) is True
    assert market_tags_visible(["UNKNOWN"], ["JP"]) is True


def test_an_unknown_article_is_not_evidence_for_any_market():
    """이 변경의 실제 효과. UNKNOWN은 어느 풀에도 들어가지 않는다."""
    from features.daily_briefing.issue_selection import documents_for_scope

    doc = {"markets": ["UNKNOWN"], "title": "Paroles de patrons"}

    for scope in ("us", "kr", "europe", "jp"):
        assert documents_for_scope([doc], scope) == []
