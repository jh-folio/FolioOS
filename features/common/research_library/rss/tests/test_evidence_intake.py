"""Evidence Intake RSS helper tests.

Run:
    py -3 features/common/research_library/rss/tests/test_evidence_intake.py
"""
from __future__ import annotations

import sys
import sqlite3
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.common.research_library.indexing.service import canonical_news_source, parse_rssarchive_markdown
from features.common.research_library.rss.service import (
    RSS_CACHE_TABLE,
    _dedupe_rss_rows,
    _repair_cached_media,
    archive_item,
    ensure_rss_cache,
)
from features.common.research_library.rss import rss_archive
from features.common.research_library.rss.collectors import (
    collect_official_items,
    load_simple_yaml,
)
from features.common.research_library.rss.feed_config import load_rss_feeds
from features.common.research_library.rss.article import collect_article_body
from features.common.research_library.rss.policy import calculate_relevance_score, looks_paywalled, normalize_url, should_retry_existing_item
from features.common.research_library.rss.parser import KST, parse_feed, parse_pub_date
from features.common.research_library.rss.normalizer import rss_item_to_evidence
from features.common.research_library.rss.store import save_evidence_item
from features.common.research_library.rss.writer import evidence_markdown, existing_file_needs_enrichment, load_archive_index
from features.common.market_calendar import infer_doc_markets


def test_naive_rfc822_pubdate_is_treated_as_kst_not_utc():
    import datetime as dt
    # mk.co.kr sends RFC822 pubDate without a timezone offset; the real time is KST.
    parsed = parse_pub_date("Tue, 23 Jun 2026 15:37:14")
    assert parsed is not None
    # 15:37 KST == 06:37 UTC (not 15:37 UTC, which would push it +9h to the next day)
    assert parsed == dt.datetime(2026, 6, 23, 6, 37, 14, tzinfo=dt.timezone.utc)
    # explicit offsets are still respected
    explicit = parse_pub_date("Tue, 23 Jun 2026 15:37:14 +0900")
    assert explicit == dt.datetime(2026, 6, 23, 6, 37, 14, tzinfo=dt.timezone.utc)


def test_future_published_at_is_capped_at_collection_time():
    import datetime as dt
    collected = dt.datetime(2026, 6, 23, 10, 17, 25, tzinfo=dt.timezone.utc)
    future = dt.datetime(2026, 6, 23, 15, 37, 0, tzinfo=dt.timezone.utc)  # after collection
    item = rss_item_to_evidence(
        item={"title": "t", "link": "https://mk.co.kr/news/1", "published_at_utc": future},
        source="매일경제",
        collected_at_utc=collected,
    )
    assert item["published_at_utc"] == collected


def test_normalize_url_removes_tracking_query():
    url = "HTTPS://www.Example.com/path/?utm_source=x&b=2&a=1&fbclid=zzz#frag"
    assert normalize_url(url) == "https://example.com/path?a=1&b=2"


def test_retry_policy_defaults_to_no_repeated_fetch():
    assert should_retry_existing_item("full_text") is False
    assert should_retry_existing_item("summary_only") is False
    assert should_retry_existing_item("needs_manual_save") is False
    assert should_retry_existing_item("legacy_rss") is False
    assert should_retry_existing_item("fetch_failed") is False
    assert should_retry_existing_item("fetch_failed", retry_failed=True) is True
    assert should_retry_existing_item("summary_only", retry_summary_only=True) is True


def test_relevance_score_accepts_market_items_and_penalizes_noise():
    market = {"title": "Nvidia earnings guidance lifts AI semiconductor shares"}
    noise = {"title": "여행 맛집 할인 세일"}
    assert calculate_relevance_score(market) >= 3
    assert calculate_relevance_score(noise) < 0


def test_paywall_detection():
    assert looks_paywalled("Subscribe to continue reading this article")
    assert looks_paywalled("이 기사는 구독 후 이용 가능합니다")
    assert looks_paywalled("로그인 후 이용 가능한 기사입니다")
    assert not looks_paywalled("Markets rose after earnings guidance improved")
    # 한국 뉴스 페이지 공통 푸터(뉴스레터 구독/로그인 버튼)는 유료벽이 아니다.
    assert not looks_paywalled("(서울=연합뉴스) 기사 본문 ... 뉴스레터 구독 신청 로그인 회원가입")


def test_raw_item_strips_embedded_html_from_description():
    from features.common.research_library.rss.parser import strip_markup

    google_desc = (
        '<a href="https://news.google.com/rss/articles/x?oc=5" target="_blank">'
        "Oil drifts down after OPEC+ agrees to raise output targets</a>"
        '&nbsp;<font color="#6f6f6f">Reuters</font>'
    )
    import html as html_mod
    cleaned = strip_markup(html_mod.unescape(google_desc))
    assert "<" not in cleaned and "href" not in cleaned
    assert cleaned.startswith("Oil drifts down after OPEC+")


def test_infer_doc_markets_word_boundaries_and_company_master():
    # substring 오탐 제거: "downgrade"의 dow, "turmoil"의 oil이 매칭되면 안 된다.
    assert infer_doc_markets({"title": "Analysts downgrade several names amid turmoil"}) == ["UNKNOWN"]
    # 단어 경계 매칭: Dow/Fed는 온전한 단어일 때만 US 신호다.
    assert "US" in infer_doc_markets({"title": "Dow rises 300 points as Fed signals pause"})
    assert infer_doc_markets({"title": "Downgrade wave hits industrials outside market turmoil"}) == ["UNKNOWN"]
    assert infer_doc_markets({"title": "FedEx expands parcel network"}) == ["UNKNOWN"]
    assert "US" in infer_doc_markets({"title": "Earnings season starts with banks in focus"})
    assert "KR" in infer_doc_markets({"title": "실적 시즌 앞두고 국내 증시 관심 확대"})
    # 회사 마스터(config/company_master.json) 기반 시장 신호
    assert "US" in infer_doc_markets({"title": "엔비디아 데이터센터 매출 신기록"})
    assert "KR" in infer_doc_markets({"title": "삼성전자 파운드리 수주 확대"})
    # 한국 기사 관행인 [6자리 종목코드] 표기는 KR 신호다.
    assert "KR" in infer_doc_markets({"title": "한투증권, 셀트리온[068270] 목표가 하향"})
    # 명시적 UNKNOWN 태그는 신호가 아니므로 본문 기준으로 재추론한다.
    assert infer_doc_markets({"market": "UNKNOWN", "title": "Nasdaq futures climb"}) == ["US"]


def test_rss_item_to_evidence_feed_default_market_is_fallback_only():
    import datetime as dt
    published = dt.datetime(2026, 7, 6, 1, 0, 0, tzinfo=dt.timezone.utc)
    feed = {"url": "https://example.com/feed", "default_market": "US", "reliability_tier": 2}
    # 아무 시장 신호가 없으면 feed 기본 시장을 쓴다.
    plain = rss_item_to_evidence(
        item={"title": "Weekly roundup of new gadgets", "link": "https://example.com/a", "published_at_utc": published},
        source="CNBC", feed=feed,
    )
    assert plain["markets"] == ["US"]
    # 본문에 실제 신호가 있으면 feed 힌트는 절대 이기지 못한다.
    kr_item = rss_item_to_evidence(
        item={"title": "코스피 외국인 순매수 확대", "link": "https://example.com/b", "published_at_utc": published},
        source="CNBC", feed=feed,
    )
    assert "KR" in kr_item["markets"] and "US" not in kr_item["markets"]


def test_rss_archive_skips_stale_dated_feed_items():
    import datetime as dt
    collected = dt.datetime(2026, 7, 6, 0, 0, 0, tzinfo=dt.timezone.utc)
    stale = {"title": "Old market story", "published_at_utc": dt.datetime(2025, 7, 6, 0, 0, 0, tzinfo=dt.timezone.utc)}
    recent = {"title": "Recent market story", "published_at_utc": dt.datetime(2026, 7, 1, 0, 0, 0, tzinfo=dt.timezone.utc)}
    undated = {"title": "No date market story"}
    assert rss_archive.item_within_recency_window(stale, collected_at_utc=collected, max_age_days=14) is False
    assert rss_archive.item_within_recency_window(recent, collected_at_utc=collected, max_age_days=14) is True
    assert rss_archive.item_within_recency_window(undated, collected_at_utc=collected, max_age_days=14) is True


def test_rss_feed_config_includes_cnbc_business_economy_finance_channels():
    feeds = load_rss_feeds(ROOT / "config" / "rss_feeds.yaml")
    cnbc_feeds = {
        feed.get("category"): feed
        for feed in feeds
        if feed.get("media") == "CNBC"
    }
    assert "100003114" in cnbc_feeds["top"].get("url", "")
    assert "10001147" in cnbc_feeds["business"].get("url", "")
    assert "10000664" in cnbc_feeds["finance"].get("url", "")
    assert "20910258" in cnbc_feeds["economy"].get("url", "")
    assert any(
        feed.get("media") == "CNBC"
        and feed.get("category") == "investing"
        and "15839069" in feed.get("url", "")
        for feed in feeds
    )


def test_load_archive_index_reads_new_format_front_matter_urls():
    # 신규 front matter 포맷 파일이 dedupe 인덱스에서 누락되면 매 수집마다
    # 같은 기사가 " (2)", " (3)" 파일로 복제된다.
    content = "\n".join([
        "---",
        'id: "rss_dedupe_test"',
        'title: "테스트 기사"',
        'source: "연합뉴스"',
        'url: "https://www.yna.co.kr/view/AKR_TEST_001"',
        'normalized_url: "https://yna.co.kr/view/AKR_TEST_001"',
        'collection_status: "needs_manual_save"',
        "---",
        "",
        "# 테스트 기사",
        "",
        "## Full Text",
        "",
        "Full text is not saved by default.",
        "",
        "## Collection Notes",
        "",
        "- Status: needs_manual_save",
    ])
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "2026-07-06 08-00-00 - 연합뉴스 - 테스트 기사.md"
        path.write_text(content, encoding="utf-8")
        links, names, link_paths = load_archive_index(Path(tmp))
        assert "https://yna.co.kr/view/AKR_TEST_001" in links
        assert link_paths["https://yna.co.kr/view/AKR_TEST_001"] == path
        # 신규 포맷의 collection_status를 읽어야 매 실행 재수집(refetch)을 막는다.
        assert existing_file_needs_enrichment(path) is False
        assert existing_file_needs_enrichment(path, retry_summary_only=True) is True


def test_collect_article_body_skips_aggregator_redirect_urls():
    # Google News 링크는 JS 리다이렉트 stub이라 기사 HTML이 아니다.
    # RSS 요약을 유지해야 하며 Google 페이지의 meta description으로 덮어쓰면 안 된다.
    body = collect_article_body(
        "https://news.google.com/rss/articles/CBMiAbc?oc=5",
        "Prosecutor charges refiners with price collusion",
    )
    assert body["status"] == "summary_only"
    assert body["summary"] == "Prosecutor charges refiners with price collusion"
    assert body["full_text"] == ""
    empty = collect_article_body("https://news.google.com/rss/articles/CBMiAbc?oc=5", "")
    assert empty["status"] == "needs_manual_save"


def test_collect_article_body_trusts_long_public_body_over_footer_banner():
    import features.common.research_library.rss.article as article_mod

    paragraph = "<p>" + "시장 분석 본문 문단입니다. 지수와 수급 흐름을 설명합니다. " * 30 + "</p>"
    markup = (
        "<html><head><meta name=\"description\" content=\"기사 요약\"></head>"
        f"<body><article>{paragraph}</article>"
        "<footer>구독 후 이용 가능한 프리미엄 뉴스레터도 있습니다</footer></body></html>"
    )
    original = article_mod.fetch_url_text
    article_mod.fetch_url_text = lambda url, **kwargs: markup
    try:
        body = article_mod.collect_article_body("https://example.com/news/1", "rss desc")
    finally:
        article_mod.fetch_url_text = original
    # 본문이 충분히 추출됐으면 페이지 다른 곳의 구독 배너가 full_text를 막지 않는다.
    assert body["status"] == "full_text"
    assert len(body["full_text"]) >= 700


def test_frontmatter_markdown_parses_for_indexing():
    md = evidence_markdown(
        {
            "id": "rss_test",
            "collector": "rss",
            "source_type": "news",
            "source": "Reuters",
            "title": "AI grid bottleneck",
            "url": "https://example.com/a?utm_source=x",
            "normalized_url": "https://example.com/a",
            "published_at_utc": None,
            "collected_at_utc": None,
            "query": "https://feed.example/rss",
            "query_source": "rss_feed",
            "description": "Grid demand rises.",
            "summary": "Grid demand rises.",
            "full_text": "Longer body",
            "collection_status": "summary_only",
            "error": "",
            "relevance_score": 3,
            "search_score": None,
            "related_tickers": [],
            "related_themes": [],
            "markets": ["US", "GLOBAL"],
            "event_id": None,
            "narrative_ids": [],
            "reliability_tier": 2,
        }
    )
    meta, body = parse_rssarchive_markdown(md)
    assert meta["title"] == "AI grid bottleneck"
    assert meta["url"] == "https://example.com/a?utm_source=x"
    assert meta["normalizedUrl"] == "https://example.com/a"
    assert meta["collectionStatus"] == "summary_only"
    assert meta["markets"] == ["US", "GLOBAL"]
    assert "Grid demand rises" in body


def test_yonhap_rss_item_keeps_yonhap_source_in_feed():
    md = evidence_markdown({
        "id": "rss_yonhap",
        "collector": "rss",
        "source_type": "news",
        "source": "연합뉴스",
        "title": "코스피 외국인 순매수 확대",
        "url": "https://www.yna.co.kr/view/AKR20260623000100002",
        "normalized_url": "https://www.yna.co.kr/view/AKR20260623000100002",
        "published_at_utc": None,
        "collected_at_utc": None,
        "query": "https://www.yna.co.kr/rss/market.xml",
        "query_source": "rss_feed",
        "summary": "외국인 순매수가 확대됐다.",
        "collection_status": "summary_only",
        "error": "",
        "relevance_score": 4,
        "search_score": None,
        "related_tickers": [],
        "related_themes": [],
        "event_id": None,
        "narrative_ids": [],
        "reliability_tier": 2,
    })
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "2026-06-23 09-00-00 - 연합뉴스 - 코스피.md"
        path.write_text(md, encoding="utf-8")
        assert archive_item(path)["media"] == "연합뉴스"
    assert canonical_news_source("연합뉴스", "", "") == "연합뉴스"


def test_archive_item_exposes_multi_market_tags():
    md = evidence_markdown({
        "id": "rss_cross_market",
        "collector": "rss",
        "source_type": "news",
        "source": "Reuters",
        "title": "Nasdaq rally lifts Korean chip exporters as KOSPI opens higher",
        "url": "https://example.com/cross",
        "normalized_url": "https://example.com/cross",
        "published_at_utc": None,
        "collected_at_utc": None,
        "query": "feed",
        "query_source": "rss_feed",
        "summary": "US AI chip gains and KOSPI semiconductor names move with global dollar and supply-chain signals.",
        "collection_status": "summary_only",
        "error": "",
        "relevance_score": 4,
        "search_score": None,
        "related_tickers": [],
        "related_themes": [],
        "event_id": None,
        "narrative_ids": [],
        "reliability_tier": 2,
    })
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "2026-06-23 09-00-00 - Reuters - cross.md"
        path.write_text(md, encoding="utf-8")
        item = archive_item(path)
    assert item["markets"] == ["US", "KR", "GLOBAL"]
    assert item["market"] == "US,KR,GLOBAL"


def test_archive_item_prefers_frontmatter_market_tags():
    md = evidence_markdown({
        "id": "rss_tagged_market",
        "collector": "rss",
        "source_type": "news",
        "source": "Reuters",
        "title": "Chip supply chain update",
        "url": "https://example.com/tagged",
        "normalized_url": "https://example.com/tagged",
        "published_at_utc": None,
        "collected_at_utc": None,
        "query": "feed",
        "query_source": "rss_feed",
        "summary": "A short market update.",
        "collection_status": "summary_only",
        "error": "",
        "relevance_score": 4,
        "search_score": None,
        "related_tickers": [],
        "related_themes": [],
        "markets": ["KR", "GLOBAL"],
        "event_id": None,
        "narrative_ids": [],
        "reliability_tier": 2,
    })
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "2026-06-23 09-00-00 - Reuters - tagged.md"
        path.write_text(md, encoding="utf-8")
        item = archive_item(path)
    assert item["markets"] == ["KR", "GLOBAL"]
    assert infer_doc_markets({"market": "US,KR,GLOBAL"}) == ["US", "KR", "GLOBAL"]


def test_rss_cache_schema_includes_markets_column():
    with sqlite3.connect(":memory:") as conn:
        ensure_rss_cache(conn)
        cols = {row[1] for row in conn.execute(f"PRAGMA table_info({RSS_CACHE_TABLE})").fetchall()}
    assert "markets" in cols


def test_existing_yonhap_cache_row_is_repaired_without_file_change():
    with sqlite3.connect(":memory:") as conn:
        ensure_rss_cache(conn)
        conn.execute(
            f"""INSERT INTO {RSS_CACHE_TABLE}
                (filename, path, size, mtime_ns, title, timestamp, timestamp_sort, url, description, media,
                 normalized_url, collector, source_type, collection_status, reliability_tier, visible, parsed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                "2026-06-23 09-00-00 - 연합뉴스 - 코스피.md", "x.md", 1, 1,
                "코스피 외국인 순매수", "2026-06-23 09:00:00", "2026-06-23T09:00:00",
                "https://www.yna.co.kr/view/AKR1", "summary", "User Archive",
                "", "rss", "news", "summary_only", "2", 1, "2026-06-23T09:00:00",
            ),
        )
        assert _repair_cached_media(conn) == 1
        media = conn.execute(f"SELECT media FROM {RSS_CACHE_TABLE}").fetchone()[0]
        assert media == "연합뉴스"


def test_rss_feed_rows_are_deduped_by_normalized_url():
    with sqlite3.connect(":memory:") as conn:
        conn.row_factory = sqlite3.Row
        ensure_rss_cache(conn)
        for filename, title, url, normalized_url in [
            ("a.md", "AI chip rally", "https://example.com/a?utm_source=x", "https://example.com/a"),
            ("b.md", "AI chip rally duplicate", "https://example.com/a?utm_source=y", "https://example.com/a"),
            ("c.md", "Different article", "https://example.com/c", "https://example.com/c"),
        ]:
            conn.execute(
                f"""INSERT INTO {RSS_CACHE_TABLE}
                    (filename, path, size, mtime_ns, title, timestamp, timestamp_sort, url, description, media,
                     normalized_url, collector, source_type, collection_status, reliability_tier, markets, visible, parsed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    filename, filename, 1, 1, title, "2026-06-23 09:00:00", "2026-06-23T09:00:00",
                    url, "summary", "Reuters", normalized_url, "rss", "news", "summary_only", "2",
                    "US,GLOBAL", 1, "2026-06-23T09:00:00",
                ),
            )
        rows = conn.execute(f"SELECT * FROM {RSS_CACHE_TABLE} ORDER BY filename").fetchall()

    deduped = _dedupe_rss_rows(rows)
    assert [row["filename"] for row in deduped] == ["a.md", "c.md"]


def test_rss_feed_config_loads_default_feeds():
    feeds = load_rss_feeds(ROOT / "config" / "rss_feeds.yaml")
    assert feeds
    assert all(feed["url"] and feed["media"] for feed in feeds)


def test_rss_sample_parse():
    xml = b"""<?xml version="1.0"?>
    <rss version="2.0">
      <channel>
        <title>Sample Feed</title>
        <item>
          <title>Semiconductor exports rise</title>
          <link>https://example.com/chips</link>
          <description>Korean chip exports rebounded in May.</description>
          <pubDate>Sat, 14 Jun 2026 01:02:03 GMT</pubDate>
        </item>
      </channel>
    </rss>
    """
    items = parse_feed(xml)
    assert len(items) == 1
    assert items[0]["title"] == "Semiconductor exports rise"
    assert items[0]["link"] == "https://example.com/chips"
    assert "exports" in items[0]["description"]


def test_legacy_markdown_parse_still_works():
    legacy = (
        "- Title: Old style RSS item\n"
        "- Source: Reuters\n"
        "- URL: https://example.com/legacy\n"
        "- Timestamp (UTC+9): 2026-06-14 10:00:00\n"
        "- Collection Status: legacy_rss\n"
        "- Summary: Legacy summary body text.\n"
    )
    meta, body = parse_rssarchive_markdown(legacy)
    assert meta is not None
    assert meta["title"] == "Old style RSS item"
    assert meta["url"] == "https://example.com/legacy"
    assert meta["date"] == "2026-06-14"
    assert "Legacy summary body text" in body


def test_public_mode_does_not_store_full_text():
    evidence = {
        "id": "rss_public",
        "collector": "rss",
        "source_type": "news",
        "source": "Reuters",
        "title": "AI capex",
        "url": "https://example.com/p",
        "normalized_url": "https://example.com/p",
        "published_at_utc": None,
        "collected_at_utc": None,
        "query": "feed",
        "query_source": "rss_feed",
        "summary": "Short summary.",
        "full_text": "SECRET FULL ARTICLE BODY that must not be saved by default.",
        "collection_status": "summary_only",
        "error": "",
        "relevance_score": 3,
        "search_score": None,
        "related_tickers": [],
        "related_themes": [],
        "event_id": None,
        "narrative_ids": [],
        "reliability_tier": 2,
    }
    md = evidence_markdown(evidence, store_full_text=False)
    assert "SECRET FULL ARTICLE BODY" not in md
    assert "Full text is not saved by default" in md
    # With explicit opt-in the full text is written.
    md_full = evidence_markdown(evidence, store_full_text=True)
    assert "SECRET FULL ARTICLE BODY" in md_full


def test_frontmatter_round_trips_intake_metadata():
    md = evidence_markdown(
        {
            "id": "rss_meta",
            "collector": "rss",
            "source_type": "news",
            "source": "Bloomberg",
            "title": "Grid power demand",
            "url": "https://example.com/grid",
            "normalized_url": "https://example.com/grid",
            "published_at_utc": None,
            "collected_at_utc": None,
            "query": "AI data center power demand",
            "query_source": "news_query",
            "summary": "Power demand rises.",
            "collection_status": "summary_only",
            "error": "",
            "relevance_score": 4,
            "search_score": 0.8,
            "related_tickers": ["NVDA"],
            "related_themes": ["ai_power"],
            "event_id": "evt_1",
            "narrative_ids": ["nar_power"],
            "reliability_tier": 2,
        }
    )
    meta, _ = parse_rssarchive_markdown(md)
    assert meta["collector"] == "rss"
    assert meta["sourceType"] == "news"
    assert meta["query"] == "AI data center power demand"
    assert meta["querySource"] == "news_query"
    assert str(meta["reliabilityTier"]) == "2"


def test_atom_sample_parse():
    xml = b"""<?xml version="1.0"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <entry>
        <title>AI capex rises</title>
        <link href="https://example.com/ai-capex"/>
        <summary>Companies increase AI infrastructure spending.</summary>
        <updated>2026-06-14T01:02:03Z</updated>
      </entry>
    </feed>
    """
    items = parse_feed(xml)
    assert len(items) == 1
    assert items[0]["title"] == "AI capex rises"
    assert items[0]["link"] == "https://example.com/ai-capex"


def test_official_collector_stub_does_not_make_fake_data():
    items, usage = collect_official_items(load_simple_yaml(ROOT / "config" / "evidence_sources.yaml"))
    assert items == []
    assert usage["items"] == 0
    assert "stub" in usage["warning"]


def test_evidence_store_upserts_item():
    item = {
        "id": "rss_store_test",
        "collector": "rss",
        "source_type": "news",
        "source": "Reuters",
        "title": "AI infrastructure earnings",
        "url": "https://example.com/store",
        "normalized_url": "https://example.com/store",
        "published_at_utc": None,
        "collected_at_utc": None,
        "query": "feed",
        "query_source": "rss_feed",
        "summary": "AI infrastructure earnings improved.",
        "collection_status": "summary_only",
        "relevance_score": 3,
        "search_score": None,
        "related_tickers": [],
        "related_themes": [],
        "event_id": None,
        "narrative_ids": [],
        "reliability_tier": 2,
    }
    with tempfile.TemporaryDirectory() as tmp:
        db_path = Path(tmp) / "evidence.sqlite3"
        save_evidence_item(db_path, item, "research-inbox/rss/x.md")
        assert db_path.exists()


if __name__ == "__main__":
    test_normalize_url_removes_tracking_query()
    test_retry_policy_defaults_to_no_repeated_fetch()
    test_relevance_score_accepts_market_items_and_penalizes_noise()
    test_paywall_detection()
    test_raw_item_strips_embedded_html_from_description()
    test_infer_doc_markets_word_boundaries_and_company_master()
    test_rss_item_to_evidence_feed_default_market_is_fallback_only()
    test_load_archive_index_reads_new_format_front_matter_urls()
    test_collect_article_body_skips_aggregator_redirect_urls()
    test_collect_article_body_trusts_long_public_body_over_footer_banner()
    test_frontmatter_markdown_parses_for_indexing()
    test_rss_feed_config_loads_default_feeds()
    test_rss_sample_parse()
    test_legacy_markdown_parse_still_works()
    test_public_mode_does_not_store_full_text()
    test_frontmatter_round_trips_intake_metadata()
    test_atom_sample_parse()
    test_official_collector_stub_does_not_make_fake_data()
    test_evidence_store_upserts_item()
    print("ok")
