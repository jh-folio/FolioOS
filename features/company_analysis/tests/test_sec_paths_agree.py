"""SEC 두 경로는 같은 입력에서 같은 결론에 도달해야 한다.

companyfacts는 티커로 CIK를 스스로 찾는데 10-K 경로는 company["cik"]만 읽던 시절,
그 값을 못 채운 호출자에게는 **숫자는 오고 공시 서술만 빠지는** 보고서가 나갔다.
한쪽만 성공하는 상태가 조용한 열화의 형태였다.
"""
from __future__ import annotations

from pathlib import Path

from features.company_analysis import sec_companyfacts, sec_filings


TICKER_MAP = {"HWM": "0000004281", "MU": "0000723125"}


def test_both_sec_paths_resolve_a_cik_from_a_ticker_only_company(monkeypatch, tmp_path):
    monkeypatch.setattr(sec_companyfacts, "load_ticker_cik_map", lambda _cache: TICKER_MAP)
    company = {"ticker": "HWM", "name": "HWM", "sector": "Unclassified", "market": ""}

    facts_cik = sec_companyfacts.resolve_cik(company, tmp_path)

    seen: dict[str, str] = {}

    def capture(cik, _cache_dir, forms=None):
        seen["cik"] = cik
        return {"ok": False}  # 네트워크로 나가지 않는다. CIK 해결까지만 본다.

    monkeypatch.setattr(sec_filings, "latest_annual_report_metadata", capture)
    sec_filings.ranked_annual_report_paragraphs(company, tmp_path)

    assert facts_cik == "0000004281"
    assert seen["cik"] == facts_cik, "두 경로가 같은 CIK에 도달해야 한다"


def test_korean_tickers_do_not_reach_the_sec_filing_path(monkeypatch, tmp_path):
    """한국 종목은 DART 경로다. SEC에서 못 찾는 것이 정상이며 조용한 실패가 아니다."""
    monkeypatch.setattr(sec_companyfacts, "load_ticker_cik_map", lambda _cache: TICKER_MAP)
    result = sec_filings.ranked_annual_report_paragraphs(
        {"ticker": "005930", "name": "삼성전자", "market": "KR"}, Path(tmp_path)
    )
    assert result["reason"] == "no_cik"
