"""data_reliability provider status tests.

    py -3 features/common/data_reliability/tests/test_provider_status.py
"""
import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.common.data_reliability.provider_status import provider_status_from_market_tape, provider_status_from_result


def test_provider_status_from_failed_result():
    status = provider_status_from_result("pykrx", {"ok": False, "warnings": ["holiday"]})
    assert status["status"] == "failed"
    assert status["lastFailure"]


def test_market_tape_provider_status_degraded():
    rows = provider_status_from_market_tape({
        "items": [
            {"source": "yfinance", "status": "fresh"},
            {"source": "yfinance", "status": "stale"},
        ]
    })
    assert rows[0]["provider"] == "yfinance"
    assert rows[0]["status"] == "degraded"


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
