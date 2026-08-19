"""PyYAML 없이 도는 fallback 파서가 실제 설정을 그대로 읽는가.

`requirements.txt`가 PyYAML을 요구하지만 `_load_yaml()`은 import 실패뿐 아니라
`safe_load`의 모든 예외를 삼키고 이 경로로 내려간다. 파서가 필터를 잃어도 유효 피드
수는 그대로라 겉으로는 아무 신호가 없다 — 그래서 실제 설정 파일로 대조한다.
"""
from pathlib import Path

import pytest

from features.common.research_library.rss.feed_config import _fallback_yaml_feeds, normalize_feed
from features.common.research_library.rss.relevance import url_section_allowed
from features.common.research_library.rss.rss_archive import feed_item_allowed

ROOT = Path(__file__).resolve().parents[5]


@pytest.mark.parametrize("relative", ["config/rss_feeds.yaml", "defaults/config/rss_feeds.yaml"])
def test_the_fallback_reads_the_shipped_config_exactly_like_pyyaml(relative):
    yaml = pytest.importorskip("yaml")
    path = ROOT / relative
    if not path.exists():
        pytest.skip(f"{relative} 없음")
    text = path.read_text(encoding="utf-8")

    assert _fallback_yaml_feeds(text) == yaml.safe_load(text)["feeds"]


def test_block_and_inline_sequences_survive_the_fallback():
    """예전 파서는 `- `로 시작하면 무조건 새 피드로 봤다.

    그래서 `only_publishers:` 아래의 `- "Reuters"`가 피드 경계가 되고 그 키는 빈
    문자열로 남았다. 두 소비자 모두 빈 값에서 통과시키므로(fail-open) 필터가 통째로
    사라진 채 수집이 계속된다.
    """
    text = "\n".join([
        "feeds:",
        '  - media: "Yahoo Finance"',
        '    url: "https://example.test/yahoo"',
        '    default_market: "US"',
        '    language: "en"',
        "    # 개인재테크 콘텐츠가 60% 이상이라 원 발행처만 남긴다.",
        "    only_publishers:",
        '      - "Reuters"',
        '      - "Bloomberg"',
        '  - media: "Handelsblatt"',
        '    url: "https://example.test/hb"',
        "    url_sections:",
        '      allow: ["finanzen", "unternehmen"]',
        '    default_market: "EUROPE"',
        '    language: "de"',
        '    freshness_checked_at: "2026-08-12T15:00:00Z"',
        '    freshness_latest_at: "2026-08-12T14:00:00Z"',
        "    freshness_item_count: 20",
    ])

    rows = _fallback_yaml_feeds(text)

    assert [row["media"] for row in rows] == ["Yahoo Finance", "Handelsblatt"]
    assert rows[0]["only_publishers"] == ["Reuters", "Bloomberg"]
    assert rows[1]["url_sections"] == {"allow": ["finanzen", "unternehmen"]}

    yahoo = normalize_feed(rows[0])
    handelsblatt = normalize_feed(rows[1])
    assert yahoo["only_publishers"] == ["Reuters", "Bloomberg"]
    assert handelsblatt["url_sections"] == {"allow": ["finanzen", "unternehmen"]}

    # 필터가 살아 있으면 게이트가 실제로 닫힌다.
    assert feed_item_allowed(yahoo, {"publisher": "Reuters"}) is True
    assert feed_item_allowed(yahoo, {"publisher": "Yahoo Personal Finance"}) is False
    assert url_section_allowed("https://example.test/finanzen/a.html", handelsblatt) is True
    assert url_section_allowed("https://example.test/politik/b.html", handelsblatt) is False


def test_a_key_with_nothing_under_it_still_reads_as_empty():
    """중첩을 읽게 됐다고 값 없는 키가 사라지면 안 된다 — `_required_text`가 본다."""
    text = "\n".join([
        "feeds:",
        '  - media: "Solo"',
        '    url: "https://example.test/solo"',
        "    category:",
        '    default_market: "US"',
    ])

    assert _fallback_yaml_feeds(text) == [
        {"media": "Solo", "url": "https://example.test/solo", "category": "", "default_market": "US"}
    ]
