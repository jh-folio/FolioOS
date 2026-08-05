"""A briefing that discusses leading companies must not lose their charts.

The chart subjects come from parsing the LLM's own section headings. When the
LLM drifted from the "① / ②" convention the regex matched nothing, and because
a parsed-but-empty dict skipped the ranked-group fallback, the company charts
vanished with only a warning string buried in the JSON — the reader saw
nothing and had no way to know why.
"""
from __future__ import annotations

from features.daily_briefing.visuals import (
    collect_briefing_visuals,
    leading_company_subjects_from_markdown,
)

STANDARD = "## 3. 한국장을 주도한 기업 ① — 삼성전자\n## 4. 한국장을 주도한 기업 ② — SK하이닉스"
NUMERIC = "## 3. 한국장을 주도한 기업 1 - 삼성전자\n## 4. 한국장을 주도한 기업 2 - SK하이닉스"
UNPARSEABLE = "### 주도한 기업: 삼성전자와 SK하이닉스가 이끌었다"
NO_SECTION = "## 3. 시장 흐름 요약"


def test_the_standard_heading_still_parses():
    parsed = leading_company_subjects_from_markdown(STANDARD)
    assert [row["ticker"] for row in parsed["kr"]] == ["005930", "000660"]


def test_a_numeric_ordinal_parses_like_the_circled_one():
    parsed = leading_company_subjects_from_markdown(NUMERIC)
    assert [(row["ordinal"], row["ticker"]) for row in parsed["kr"]] == [(1, "005930"), (2, "000660")]


def test_heading_mentions_expose_a_failed_parse():
    assert leading_company_subjects_from_markdown(UNPARSEABLE)["headingMentions"] == 1
    assert leading_company_subjects_from_markdown(UNPARSEABLE)["kr"] == []
    assert leading_company_subjects_from_markdown(NO_SECTION)["headingMentions"] == 0


def _scope_results():
    return {
        "kr": {
            "marketSessionDate": "2026-08-04",
            "groups": [{
                "sector": "반도체",
                "docs": [{
                    "companies": [
                        {"ticker": "005930", "name": "삼성전자", "market": "KR", "sector": "반도체"},
                        {"ticker": "000660", "name": "SK하이닉스", "market": "KR", "sector": "반도체"},
                    ],
                }],
            }],
        },
    }


def _history(symbol, session_date):
    return {
        "provider": "test",
        "sourceByInterval": {},
        "intraday": {"interval": "5m", "points": []},
        "daily": {"interval": "1d", "points": [{"date": session_date, "close": 1.0}] * 9},
    }


def _collect(subjects):
    return collect_briefing_visuals(
        "2026-08-04", "kr", _scope_results(),
        leader_subjects=subjects,
        price_history_fetcher=_history,
        include_market_visuals=False,
    )


def test_a_failed_parse_falls_back_to_ranked_groups_with_a_warning():
    result = _collect(leading_company_subjects_from_markdown(UNPARSEABLE))
    companies = [s for s in result["visualSnapshots"] if (s.get("subject") or {}).get("ticker")]
    assert [s["subject"]["ticker"] for s in companies] == ["005930", "000660"]
    assert any("could not be parsed" in str(w) for w in result["warnings"])


def test_a_briefing_without_a_company_section_charts_no_companies():
    """요약형처럼 주도 기업 절이 아예 없는 본문에 차트를 붙이면 본문과 어긋난다."""
    result = _collect(leading_company_subjects_from_markdown(NO_SECTION))
    companies = [s for s in result["visualSnapshots"] if (s.get("subject") or {}).get("ticker")]
    assert companies == []
