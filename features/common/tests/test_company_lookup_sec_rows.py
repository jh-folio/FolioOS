import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from features.common.company_lookup import _sec_company_rows


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


if __name__ == "__main__":
    tests = [
        test_sec_company_rows_skips_bad_values,
        test_sec_company_rows_accepts_single_row_dict,
    ]
    passed = 0
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
        passed += 1
    print(f"\n{passed}/{len(tests)} tests passed")
