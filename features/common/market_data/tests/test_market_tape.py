"""Market Tape Lite tests.

    py -3 features/common/market_data/tests/test_market_tape.py
"""
import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.common.market_data.tape import build_market_tape


def test_market_tape_wraps_snapshot_and_korea_data():
    tape = build_market_tape(
        date="2026-06-13",
        market_snapshot={
            "ok": True,
            "latestUsEquityDate": "2026-06-12",
            "tickers": {
                "SPY": {"label": "S&P 500 ETF", "last": 6100, "oneDayPct": 0.4, "asOfDate": "2026-06-12"},
            },
        },
        korea_market_data={
            "ok": True,
            "provider": "pykrx",
            "indices": {
                "KOSPI": {"label": "KOSPI", "close": 3000, "changePct": 1.2, "asOfDate": "2026-06-13"},
            },
            "fx": {"USDKRW": {"label": "원달러", "close": 1350, "changePct": -0.2, "asOfDate": "2026-06-13"}},
        },
        market_windows={"usRegularSessionDate": "2026-06-12", "krCurrentSessionDate": "2026-06-13"},
    )
    assert tape["items"][0]["status"] == "fresh"
    assert {item["symbol"] for item in tape["items"]} >= {"SPY", "KOSPI", "USDKRW"}
    assert any(row["provider"] == "yfinance" for row in tape["providerStatus"])


def test_market_tape_missing_when_empty():
    tape = build_market_tape(date="2026-06-13")
    assert tape["items"] == []
    assert tape["warnings"]


def _run_all():
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    passed = 0
    for t in tests:
        t()
        passed += 1
        print(f"PASS {t.__name__}")
    print(f"\n{passed}/{len(tests)} tests passed")
    return passed == len(tests)


if __name__ == "__main__":
    sys.exit(0 if _run_all() else 1)
