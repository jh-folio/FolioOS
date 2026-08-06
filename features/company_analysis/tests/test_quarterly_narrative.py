"""연차보고서만 읽으면 회사 설명이 반년쯤 늦는다.

8월에 만든 NVDA 보고서의 공시 서술 출처가 1월에 끝난 회계연도 10-K였다.
그 사이 두 분기에 무슨 일이 있었는지는 10-Q의 MD&A에 있다.
"""
from __future__ import annotations

from features.company_analysis import sec_filings


def test_the_quarterly_form_has_its_own_item_numbering():
    """10-Q의 Item 2는 MD&A다. 10-K 번호를 그대로 대면 다른 구획을 읽는다."""
    assert "10-Q" in sec_filings._ITEM_PATTERNS
    assert sec_filings.FINANCIAL_DISCUSSION_ITEMS["10-Q"] == {"2", "3", "1"}


def test_sector_items_translate_into_quarterly_numbering():
    """섹터 프로필의 items는 10-K 번호로 쓰여 있다."""
    translated = sec_filings.equivalent_items(["1", "7", "7A"], "10-Q")
    # 10-Q에는 사업 개요가 없으므로 MD&A로 모인다.
    assert translated == {"2", "3"}


def test_the_quarterly_path_asks_for_10q_only(monkeypatch, tmp_path):
    asked = {}

    def fake_metadata(cik, cache_dir, forms=None):
        asked["forms"] = forms
        return {"ok": False}

    monkeypatch.setattr(sec_filings, "latest_annual_report_metadata", fake_metadata)
    monkeypatch.setattr(
        "features.company_analysis.sec_companyfacts.resolve_cik",
        lambda _company, _cache: "0000004281",
    )

    result = sec_filings.ranked_quarterly_report_paragraphs({"ticker": "HWM"}, tmp_path)

    assert asked["forms"] == ("10-Q",)
    assert result["reason"] == "no_quarterly_report"


def test_the_annual_path_still_accepts_both_annual_forms(monkeypatch, tmp_path):
    """20-F 제출사가 연차 경로에서 빠지면 안 된다."""
    asked = {}

    def fake_metadata(cik, cache_dir, forms=None):
        asked["forms"] = forms
        return {"ok": False}

    monkeypatch.setattr(sec_filings, "latest_annual_report_metadata", fake_metadata)
    monkeypatch.setattr(
        "features.company_analysis.sec_companyfacts.resolve_cik",
        lambda _company, _cache: "0000004281",
    )

    sec_filings.ranked_annual_report_paragraphs({"ticker": "ASML"}, tmp_path)

    assert asked["forms"] == sec_filings.ANNUAL_REPORT_FORMS


def test_a_missing_cik_is_reported_the_same_way_on_both_paths(monkeypatch, tmp_path):
    monkeypatch.setattr(
        "features.company_analysis.sec_companyfacts.resolve_cik",
        lambda _company, _cache: "",
    )
    assert sec_filings.ranked_quarterly_report_paragraphs({}, tmp_path)["reason"] == "no_cik"
    assert sec_filings.ranked_annual_report_paragraphs({}, tmp_path)["reason"] == "no_cik"
