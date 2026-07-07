from features.company_analysis.data_gap_resolver import resolve_company_analysis_gaps


def test_resolver_marks_core_financials_resolved_from_official_facts():
    materials = {
        "secFacts": {"ok": True, "markdown": "| Revenue | 2025 |\n| Net Income | 10 |"},
        "rankedFiling": {"ok": True, "paragraphs": [{"text": "Business overview and risk factors"}]},
        "marketFinancialData": {"ok": True, "price": 100, "marketCap": 1_000_000},
        "supportDocs": [{"analysisReasons": ["IR/실적발표 자료"], "title": "Earnings release"}],
    }

    result = resolve_company_analysis_gaps(materials)

    by_field = {gap["field"]: gap for gap in result["gaps"]}
    assert by_field["official_financials"]["status"] == "resolved"
    assert by_field["official_financials"]["resolvedBy"] == "sec_companyfacts"
    assert by_field["filing_narrative"]["status"] == "resolved"
    assert by_field["market_data"]["status"] == "resolved"
    assert result["summary"]["unresolved"] == 0


def test_resolver_records_unresolved_filing_narrative_attempts():
    materials = {
        "secFacts": {"ok": True, "markdown": "| Revenue | 2025 |"},
        "rankedFiling": {"ok": False, "paragraphs": []},
        "filingDocs": [],
        "supportDocs": [],
        "marketFinancialData": {"available": False},
    }

    result = resolve_company_analysis_gaps(materials, web_search_allowed=False)

    by_field = {gap["field"]: gap for gap in result["gaps"]}
    assert by_field["filing_narrative"]["status"] == "unresolved"
    assert by_field["filing_narrative"]["severity"] == "high"
    assert by_field["filing_narrative"]["attempts"] == ["sec_10k_html", "local_filings"]
    assert by_field["market_data"]["status"] == "unresolved"
    assert "market_data" in by_field["market_data"]["attempts"]


def test_resolver_adds_official_web_search_attempt_when_allowed():
    materials = {
        "secFacts": {"ok": False},
        "dartFacts": {"ok": False},
        "rankedFiling": {"ok": False, "paragraphs": []},
        "filingDocs": [],
        "supportDocs": [],
        "marketFinancialData": {},
    }

    result = resolve_company_analysis_gaps(materials, web_search_allowed=True)

    for gap in result["gaps"]:
        assert "official_web_search" in gap["attempts"]
    assert result["summary"]["highSeverityUnresolved"] >= 1


def test_resolver_treats_local_ir_as_partial_recent_update():
    materials = {
        "secFacts": {"ok": True},
        "rankedFiling": {"ok": True, "paragraphs": [{"text": "Risk factor"}]},
        "marketFinancialData": {},
        "supportDocs": [{"analysisReasons": ["IR/실적발표 자료"], "title": "Investor day"}],
    }

    result = resolve_company_analysis_gaps(materials)

    recent_update = {gap["field"]: gap for gap in result["gaps"]}["recent_operating_update"]
    assert recent_update["status"] == "resolved"
    assert recent_update["resolvedBy"] == "local_ir"
