import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from features.common.company_lookup import _sec_company_rows, normalize_company_entry


def test_sec_company_rows_skips_bad_values():
    payload = {
        "0": {"ticker": "NVDA", "title": "NVIDIA CORP", "cik_str": 1045810},
        "bad": "not-a-row",
    }
    rows = list(_sec_company_rows(payload))
    assert len(rows) == 1
    assert rows[0]["ticker"] == "NVDA"


def test_sec_company_rows_accepts_single_row_dict():
    rows = list(_sec_company_rows({"ticker": "AAPL", "title": "Apple Inc.", "cik_str": 320193}))
    assert len(rows) == 1
    assert rows[0]["title"] == "Apple Inc."


def test_company_rows_use_canonical_cross_market_codes():
    assert normalize_company_entry({"ticker": "7203.T"})["market"] == "JP"
    assert normalize_company_entry({"ticker": "SAP", "market": "EU"})["market"] == "EUROPE"
    assert normalize_company_entry({"ticker": "UNKNOWN"})["market"] == ""


if __name__ == "__main__":
    tests = [
        test_sec_company_rows_skips_bad_values,
        test_sec_company_rows_accepts_single_row_dict,
        test_company_rows_use_canonical_cross_market_codes,
    ]
    passed = 0
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
        passed += 1
    print(f"\n{passed}/{len(tests)} tests passed")


def test_sec_company_rows_unwraps_the_fetch_json_envelope():
    """sec_companyfacts와 company_lookup이 같은 캐시 파일을 다른 형식으로 쓴다.

    봉투를 못 벗기면 values()가 문자열 두 개와 dict 하나를 내놓아 "행 1개"가 되고,
    재조회 조건이 `행이 없을 때`뿐이라 못 쓰는 캐시가 영구히 남는다. 그 상태에서
    미국 상장사는 20개짜리 수동 사전에 있는 종목만 CIK를 얻어, 나머지는 10-K 서술
    없이 숫자만으로 분석된다.
    """
    envelope = {
        "fetchedAt": "2026-08-04T05:39:40+00:00",
        "error": "",
        "data": {
            "0": {"cik_str": 4281, "ticker": "HWM", "title": "Howmet Aerospace Inc."},
            "1": {"cik_str": 723125, "ticker": "MU", "title": "MICRON TECHNOLOGY INC"},
        },
    }
    rows = list(_sec_company_rows(envelope))
    assert [r["ticker"] for r in rows] == ["HWM", "MU"]


def test_sec_company_rows_still_reads_the_raw_sec_shape():
    raw = {"0": {"cik_str": 320193, "ticker": "AAPL", "title": "Apple Inc."}}
    assert [r["ticker"] for r in _sec_company_rows(raw)] == ["AAPL"]
