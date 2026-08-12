"""종합 피드에서 투자와 무관한 면을 수집 단계에서 뺀다.

실측: Handelsblatt가 `feed/schlagzeilen`(전체 헤드라인)을 받고 있어서 1,260건 중
politik 421 · karriere 68 · video 31이 들어왔고 finanzen은 279건뿐이었다. 쾰른
아이스크림 창업자 기사와 우크라이나 전황이 브리핑 자료가 됐고, 그 기사들은 본문
장식에서 미국 대형주를 주워 `US` 시장으로까지 찍혔다.

키워드 표를 독일어·프랑스어·이탈리아어로 늘리는 길은 이 저장소가 이미 거부했다
(§`should_archive_item` — 읽을 수 없는 언어에서 관련성을 추측하는 것). 기사 URL의
섹션은 매체가 스스로 붙인 분류라 번역 없이 확인할 수 있다.
"""
from __future__ import annotations

import pytest

from features.common.config_bootstrap import resolve_config
from features.common.research_library.rss.feed_config import load_rss_feeds, normalize_feed
from features.common.research_library.rss.relevance import should_archive_item, url_section_allowed

ALLOW = {"url_sections": {"allow": ["finanzen", "unternehmen"]}}
# 언어를 함께 준다. 키워드 게이트는 한국어·영어로만 쓰여 있어 읽을 수 없는 언어의 피드는
# 건너뛰는데(§should_archive_item), 언어가 없으면 그 게이트가 적용돼 독일어 제목이
# 섹션과 무관하게 떨어진다 — 이 테스트가 보려는 것은 섹션 필터다.
DENY = {"language": "nl", "url_sections": {"deny": ["politiek", "samenleving", "opinie"]}}


def test_an_allowlist_keeps_only_those_sections():
    assert url_section_allowed("https://www.handelsblatt.com/finanzen/boerse/x", ALLOW) is True
    assert url_section_allowed("https://www.handelsblatt.com/unternehmen/industrie/x", ALLOW) is True
    assert url_section_allowed("https://www.handelsblatt.com/politik/international/x", ALLOW) is False
    assert url_section_allowed("https://www.handelsblatt.com/karriere/x", ALLOW) is False


def test_a_denylist_removes_only_those_sections():
    assert url_section_allowed("https://fd.nl/financiele-markten/1/aex", DENY) is True
    assert url_section_allowed("https://fd.nl/politiek/2/x", DENY) is False


def test_a_feed_without_rules_is_untouched():
    """규칙이 없는 피드는 이 필터가 아무것도 하지 않는다."""
    assert url_section_allowed("https://www.handelsblatt.com/politik/x", {}) is True
    assert url_section_allowed("https://www.handelsblatt.com/politik/x", None) is True


def test_a_link_without_a_section_is_kept():
    """구조 신호가 없다고 기사를 버리지 않는다.

    경로 형태를 바꾼 매체의 자료가 통째로 사라지는 쪽이 훨씬 나쁘다.
    """
    assert url_section_allowed("https://www.handelsblatt.com", ALLOW) is True
    assert url_section_allowed("", ALLOW) is True


def test_the_gate_runs_inside_the_collection_filter():
    """`should_archive_item`이 이 필터를 거쳐야 수집 단계에서 걸린다."""
    assert should_archive_item("Dax steigt", "", "https://fd.nl/financiele-markten/1/x", DENY) is True
    assert should_archive_item("Politiek nieuws", "", "https://fd.nl/politiek/2/x", DENY) is False


def test_the_shipped_config_subscribes_to_section_feeds_not_whole_outlets():
    """섹션 피드가 있으면 그쪽을 받는 것이 먼저다. 필터는 그다음 수단이다."""
    urls = {feed["url"] for feed in load_rss_feeds(resolve_config("rss_feeds.yaml"))}

    assert "https://www.handelsblatt.com/contentexport/feed/schlagzeilen" not in urls
    assert "https://www.manager-magazin.de/news/index.rss" not in urls
    assert "https://www.handelsblatt.com/contentexport/feed/finanzen" in urls
    assert "https://www.handelsblatt.com/contentexport/feed/unternehmen" in urls


def test_the_mixed_dutch_feed_carries_a_section_allowlist():
    """Het Financieele Dagblad는 섹션 피드를 제공하지 않아 필터가 유일한 수단이다."""
    feeds = {feed["media"]: feed for feed in load_rss_feeds(resolve_config("rss_feeds.yaml"))}
    rules = feeds["Het Financieele Dagblad"].get("url_sections") or {}

    assert "financiele-markten" in (rules.get("allow") or [])
    assert "samenleving" not in (rules.get("allow") or [])


@pytest.mark.parametrize("raw", [None, [], "finanzen", {"allow": "finanzen"}, {"other": ["x"]}])
def test_malformed_rules_are_ignored_rather_than_fatal(raw):
    feed = normalize_feed({
        "media": "X", "url": "https://x.example/rss", "default_market": "EUROPE", "language": "de",
        "freshness_checked_at": "2026-08-12T00:00:00Z",
        "freshness_latest_at": "2026-08-12T00:00:00Z",
        "freshness_item_count": 1,
        "url_sections": raw,
    })

    assert feed is not None
    assert feed["url_sections"] == {}


def test_rules_are_normalised_for_comparison():
    feed = normalize_feed({
        "media": "X", "url": "https://x.example/rss", "default_market": "EUROPE", "language": "de",
        "freshness_checked_at": "2026-08-12T00:00:00Z",
        "freshness_latest_at": "2026-08-12T00:00:00Z",
        "freshness_item_count": 1,
        "url_sections": {"allow": ["/Finanzen/", " Unternehmen ", ""]},
    })

    assert feed["url_sections"] == {"allow": ["finanzen", "unternehmen"]}
