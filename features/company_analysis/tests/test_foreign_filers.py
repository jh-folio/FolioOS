"""Task 4.5 — Tier 0: foreign private issuers that file 20-F with the SEC.

The automatic path was closed in three places at once, so a 20-F filer produced
neither financials nor narrative. Fixtures here are shaped from live
companyfacts responses (ASML, SAP, Toyota, Apple; measured 2026-08-06).
"""
from __future__ import annotations

import pytest

from features.company_analysis.sec_companyfacts import (
    ANNUAL_FORMS,
    IFRS_METRIC_CANDIDATES,
    METRIC_CANDIDATES,
    _best_rows,
    _facts_for_metric,
    currency_prefix,
    format_value,
    reporting_currency,
    select_taxonomy,
)
from features.company_analysis.sec_filings import (
    ANNUAL_REPORT_FORMS,
    item_for_paragraph,
    latest_annual_report_metadata,
    paragraphs_with_items,
    score_paragraph,
)


def _units(currency, rows):
    return {"units": {currency: rows}}


def _row(end, val, form="20-F", start=None):
    row = {"end": end, "val": val, "form": form, "filed": end}
    if start:
        row["start"] = start
    return row


# --- taxonomy selection -------------------------------------------------


def test_a_filer_reporting_only_ifrs_uses_the_ifrs_table():
    data = {"facts": {"ifrs-full": {"Revenue": _units("EUR", [_row("2025-12-31", 1)])}}}
    name, concepts, table = select_taxonomy(data)
    assert name == "ifrs-full"
    assert table is IFRS_METRIC_CANDIDATES
    assert "Revenue" in concepts


def test_a_filer_reporting_only_us_gaap_is_unchanged():
    data = {"facts": {"us-gaap": {"Revenues": _units("USD", [_row("2025-12-31", 1, "10-K")])}}}
    name, _, table = select_taxonomy(data)
    assert name == "us-gaap"
    assert table is METRIC_CANDIDATES


def test_a_filer_holding_both_taxonomies_follows_the_newer_one():
    """Toyota kept a larger frozen us-gaap history after moving to IFRS.

    Counting concepts would serve five-year-old financials as current.
    """
    data = {"facts": {
        "us-gaap": {f"Legacy{i}": _units("JPY", [_row("2020-03-31", i, "20-F")]) for i in range(50)},
        "ifrs-full": {"Revenue": _units("JPY", [_row("2025-03-31", 1, "20-F")])},
    }}
    name, _, table = select_taxonomy(data)
    assert name == "ifrs-full"
    assert table is IFRS_METRIC_CANDIDATES


def test_no_taxonomy_at_all_returns_empty_rather_than_guessing():
    assert select_taxonomy({"facts": {}}) == ("", {}, METRIC_CANDIDATES)


# --- reporting currency -------------------------------------------------


def test_the_reporting_currency_is_the_one_the_filer_actually_uses():
    """A 20-F filer publishes a few USD convenience figures alongside its own."""
    concepts = {
        "Revenue": {"units": {"JPY": [_row("2025-03-31", 1)] * 20, "USD": [_row("2025-03-31", 2)]}},
        "Assets": {"units": {"JPY": [_row("2025-03-31", 3)] * 10}},
    }
    assert reporting_currency(concepts) == "JPY"


def test_share_and_ratio_units_do_not_count_as_currency():
    concepts = {"Shares": {"units": {"shares": [_row("2025-03-31", 1)] * 99, "EUR": [_row("2025-03-31", 2)]}}}
    assert reporting_currency(concepts) == "EUR"


def test_a_metric_without_rows_in_the_reporting_currency_is_left_missing():
    """Borrowing another currency's rows would mix two currencies in one table."""
    concepts = {"Revenue": {"units": {"USD": [_row("2025-03-31", 5)]}}}
    concept, facts = _facts_for_metric(concepts, "Revenue", currency="JPY", table=IFRS_METRIC_CANDIDATES)
    assert (concept, facts) == ("", [])


@pytest.mark.parametrize("currency,expected", [
    ("USD", "$1.50B"), ("EUR", "€1.50B"), ("JPY", "¥1.50B"), ("CHF", "CHF 1.50B"),
])
def test_values_render_in_the_reporting_currency(currency, expected):
    assert format_value(1_500_000_000, "Revenue", currency) == expected


def test_large_currencies_get_a_trillion_unit():
    # ¥48조를 "48000.00B"로 쓰면 읽을 수 없다.
    assert format_value(48_036_704_000_000, "Revenue", "JPY") == "¥48.04T"


def test_an_unknown_currency_prints_its_code_rather_than_a_wrong_symbol():
    assert currency_prefix("SEK") == "SEK "
    assert currency_prefix("") == "$"


# --- annual form selection ----------------------------------------------


def test_20f_counts_as_an_annual_report():
    assert "20-F" in ANNUAL_FORMS and "20-F" in ANNUAL_REPORT_FORMS


def test_annual_rows_accept_either_annual_form():
    rows = [
        _row("2025-12-31", 10, "20-F", start="2025-01-01"),
        _row("2024-12-31", 9, "10-K", start="2024-01-01"),
        _row("2025-06-30", 5, "10-Q", start="2025-04-01"),
    ]
    picked = _best_rows(rows, ANNUAL_FORMS, False)
    assert [row["form"] for row in picked] == ["20-F", "10-K"]


def test_a_quarterly_row_is_not_promoted_into_the_annual_slot():
    rows = [_row("2025-06-30", 5, "10-Q", start="2025-04-01")]
    assert _best_rows(rows, ANNUAL_FORMS, False) == []


def test_the_10k_only_metadata_alias_keeps_its_narrow_behaviour(monkeypatch):
    from features.company_analysis import sec_filings

    submissions = {"filings": {"recent": {
        "form": ["20-F"], "accessionNumber": ["0000-00-000000"],
        "primaryDocument": ["a.htm"], "filingDate": ["2026-01-01"], "reportDate": ["2025-12-31"],
    }}}
    monkeypatch.setattr(sec_filings, "get_company_submissions", lambda *a, **k: (submissions, ""))
    assert sec_filings.latest_10k_metadata("0000000001", None)["ok"] is False
    assert latest_annual_report_metadata("0000000001", None)["form"] == "20-F"


# --- 20-F narrative sections --------------------------------------------


@pytest.mark.parametrize("heading,expected", [
    ("ITEM 5. OPERATING AND FINANCIAL REVIEW AND PROSPECTS", "5"),
    ("ITEM 3.D RISK FACTORS", "3D"),
    ("ITEM 4. INFORMATION ON THE COMPANY", "4"),
    ("ITEM 18. FINANCIAL STATEMENTS", "18"),
])
def test_20f_item_numbering_is_read_with_its_own_scheme(heading, expected):
    assert item_for_paragraph(heading, "", "20-F") == expected


def test_10k_item_numbering_is_untouched():
    assert item_for_paragraph("ITEM 7. MANAGEMENT'S DISCUSSION", "", "10-K") == "7"
    assert item_for_paragraph("ITEM 1A. RISK FACTORS", "", "10-K") == "1A"


def test_a_heading_on_its_own_line_still_labels_the_paragraphs_under_it():
    """ASML's 20-F puts each heading on a short line the paragraph filter drops."""
    body = "This section discusses revenue growth and operating margin at length. " * 3
    markup = f"<p>ITEM 5. OPERATING AND FINANCIAL REVIEW</p><p>{body}</p>"
    pairs = list(paragraphs_with_items(markup, "20-F"))
    assert pairs and all(item == "5" for item, _ in pairs)


def test_the_financial_discussion_bonus_follows_the_forms_own_items():
    text = "Operating cash flow and capital expenditures rose while working capital fell. " * 3
    on_20f, _ = score_paragraph(text, sector="", item="5", form="20-F")
    off_20f, _ = score_paragraph(text, sector="", item="1", form="20-F")
    assert on_20f > off_20f
    # 10-K에서는 여전히 7/7A/8이 그 자리다.
    on_10k, _ = score_paragraph(text, sector="", item="7", form="10-K")
    off_10k, _ = score_paragraph(text, sector="", item="5", form="10-K")
    assert on_10k > off_10k


# --- IFRS concept coverage ----------------------------------------------


@pytest.mark.parametrize("metric,concept", [
    ("Revenue", "Revenue"),
    ("Operating Income", "ProfitLossFromOperatingActivities"),
    ("Net Income", "ProfitLoss"),
    ("Total Assets", "Assets"),
    ("Operating Cash Flow", "CashFlowsFromUsedInOperatingActivities"),
    ("Inventory", "Inventories"),
    ("EPS Diluted", "DilutedEarningsLossPerShare"),
])
def test_measured_ifrs_concepts_are_mapped(metric, concept):
    """These names were read off SAP's and Toyota's live companyfacts."""
    assert concept in IFRS_METRIC_CANDIDATES[metric]


def test_the_ifrs_table_is_not_a_copy_of_the_us_gaap_one():
    # IFRS는 concept 이름 체계가 달라 기존 표를 재사용할 수 없다.
    assert IFRS_METRIC_CANDIDATES["Revenue"] != METRIC_CANDIDATES["Revenue"]
    assert IFRS_METRIC_CANDIDATES["Total Assets"] == METRIC_CANDIDATES["Total Assets"]  # 겹치는 것도 있다
