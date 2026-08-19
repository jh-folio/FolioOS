"""분기 차트가 전년 동기와 비교하려면 전년 동기가 수집되어 있어야 한다.

실측: HWM 저장 보고서의 분기 라벨이 4개뿐이라 비교 라벨이 한 번도 뜨지 않았다.
10-Q에는 Q4가 없어 4개는 1년치도 못 채운다.
"""
from __future__ import annotations

from features.company_analysis.sec_companyfacts import (
    ANNUAL_FORMS,
    QUARTERLY_FORMS,
    _best_rows,
)
from features.company_analysis.sec_filings import ranked_paragraphs_to_markdown


def _quarter_row(end: str, start: str, val: float) -> dict:
    return {"form": "10-Q", "start": start, "end": end, "val": val, "filed": end}


QUARTER_ENDS = [
    ("2024-03-31", "2024-01-01"),
    ("2024-06-30", "2024-04-01"),
    ("2024-09-30", "2024-07-01"),
    ("2025-03-31", "2025-01-01"),
    ("2025-06-30", "2025-04-01"),
    ("2025-09-30", "2025-07-01"),
    ("2026-03-31", "2026-01-01"),
    ("2026-06-30", "2026-04-01"),
    ("2026-09-30", "2026-07-01"),
]


def test_quarterly_rows_reach_back_a_full_year():
    rows = [_quarter_row(end, start, idx) for idx, (end, start) in enumerate(QUARTER_ENDS)]
    picked = _best_rows(rows, QUARTERLY_FORMS, False)
    assert len(picked) == 8
    # 최신 8개다. 전년 같은 분기가 실제로 들어 있어야 비교가 가능하다.
    ends = [row["end"] for row in picked]
    assert "2026-06-30" in ends and "2025-06-30" in ends


def test_the_annual_slot_still_stops_at_four():
    rows = [
        {"form": "10-K", "start": f"{year}-01-01", "end": f"{year}-12-31", "val": year, "filed": f"{year + 1}-02-01"}
        for year in range(2019, 2026)
    ]
    assert len(_best_rows(rows, ANNUAL_FORMS, False)) == 4


def test_a_quarterly_excerpt_is_not_labelled_as_the_annual_report():
    """10-Q MD&A 발췌가 '10-K'로 소개되면 모델과 독자가 연차 서술로 읽는다."""
    result = {
        "ok": True,
        "form": "10-Q",
        "metadata": {"form": "10-Q", "filingDate": "2026-08-01", "url": "https://sec.gov/x"},
        "paragraphs": [{"item": "2", "score": 9, "keywords": ["margin"], "text": "MD&A body"}],
    }
    markdown = ranked_paragraphs_to_markdown(result)
    assert "10-K" not in markdown
    assert "SEC 10-Q HTML filing metadata" in markdown


def test_the_annual_excerpt_keeps_naming_its_own_form():
    for form in ("10-K", "20-F"):
        markdown = ranked_paragraphs_to_markdown(
            {"ok": True, "form": form, "metadata": {"form": form}, "paragraphs": []}
        )
        assert f"SEC {form} HTML filing metadata" in markdown


def test_an_unavailable_result_does_not_invent_a_form():
    markdown = ranked_paragraphs_to_markdown({"ok": False, "reason": "no_cik"})
    assert markdown.startswith("SEC filing HTML paragraphs unavailable")
