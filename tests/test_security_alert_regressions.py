from __future__ import annotations

import time
from pathlib import Path

import app
from features.common.quality_generation import report_format
from features.common.research_library.indexing.service import (
    canonical_news_source,
    rss_item_is_market_relevant,
)
from features.common.research_library.rss.relevance import (
    canonical_media,
    is_korean_media_link,
    should_archive_item,
)
from features.common.utils import normalize
from features.company_analysis.filing_items import readable_filing_text
from features.company_analysis.sec_filings import html_to_paragraphs
from features.llm_settings import model_catalog
from features.obsidian.workflow.note_factory import safe_filename
from features.portfolio import service as portfolio_service


def test_html_cleaners_remove_malformed_script_and_style_end_tags() -> None:
    markup = (
        "<p>Visible market text</p>"
        "<script>alert('private')</script >"
        "<style>body{display:none}</style >"
        "<p>Visible conclusion with enough words to remain a filing paragraph after parsing.</p>"
    )

    assert "alert" not in normalize(markup)
    assert "display:none" not in readable_filing_text(markup)
    assert all("alert" not in paragraph and "display:none" not in paragraph for paragraph in html_to_paragraphs(markup))


def test_media_classification_uses_parsed_hostname_not_arbitrary_substrings() -> None:
    spoofed_wsj = "https://wsj.com.attacker.invalid/markets/story"
    spoofed_kr = "https://mk.co.kr.attacker.invalid/news/story"
    spoofed_reuters = "https://reuters.com.attacker.invalid/markets/companies/NVDA.OQ"

    assert canonical_media("Unknown", spoofed_wsj, "") == "Unknown"
    assert canonical_news_source("User Archive", spoofed_wsj, "") == "User Archive"
    assert not is_korean_media_link(spoofed_kr)
    assert rss_item_is_market_relevant("Lifestyle shopping roundup", "", spoofed_kr)
    assert should_archive_item("Nvidia earnings guidance lifts shares", "", spoofed_reuters)


def test_model_parsers_reject_unbounded_adversarial_identifiers_quickly() -> None:
    oversized_openai = "gpt-" + ("-" * 20_000)
    oversized_claude = "claude-" + ("-" * 20_000)

    started = time.perf_counter()
    assert model_catalog._parse_cli_models(oversized_openai) == []
    assert model_catalog._parse_claude_help_models(oversized_claude) == []
    assert time.perf_counter() - started < 1.0


def test_report_heading_scan_is_linear_for_adversarial_whitespace() -> None:
    markdown = "## title" + (" " * 300_000) + "\nbody"
    started = time.perf_counter()
    sections = report_format._main_sections(markdown)
    assert len(sections) == 1
    assert time.perf_counter() - started < 1.0


def test_portfolio_backtest_ids_cannot_escape_storage_root(tmp_path: Path, monkeypatch) -> None:
    storage = tmp_path / "portfolio-backtests"
    storage.mkdir()
    outside = tmp_path / "outside.json"
    outside.write_text('{"id":"outside"}', encoding="utf-8")
    monkeypatch.setattr(portfolio_service, "BACKTESTS_DIR", storage)

    assert portfolio_service.get_portfolio_backtest("../outside") is None
    assert portfolio_service.delete_portfolio_backtest("../outside") == {
        "deleted": False,
        "id": "../outside",
    }
    assert outside.exists()


def test_obsidian_filename_rejects_dot_segments_and_control_characters() -> None:
    assert safe_filename(".") == "Untitled"
    assert safe_filename("..") == "Untitled"
    assert "\n" not in safe_filename("line\nbreak")


def test_quality_fallback_does_not_expose_internal_exception_text(monkeypatch) -> None:
    marker = "SYNTHETIC_PRIVATE_EXCEPTION_DETAIL"
    monkeypatch.setattr(app, "resolve_briefing", lambda *_args, **_kwargs: {"id": "2026-07-27"})
    monkeypatch.setattr(
        app,
        "evaluate_research_quality_payload",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError(marker)),
    )

    payload = app.api_get_briefing("2026-07-27")

    assert marker not in str(payload)
