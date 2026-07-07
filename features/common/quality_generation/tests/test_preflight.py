import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.common.quality_generation.preflight import preflight_from_context


def test_preflight_warns_on_missing_inputs():
    pf = preflight_from_context("briefing", {"markdown": "# Brief\n\n숫자 없음"})
    assert pf["status"] == "warn"
    assert pf["requiredInputs"]["sourceCount"] == 0
    assert pf["risks"]


def test_preflight_detects_company_numeric_support():
    pf = preflight_from_context("company_analysis", {
        "markdown": "# A\n\n## 재무\nRevenue 10%",
        "analysisInputs": {"secFactsOk": True},
        "sources": [{"title": "SEC", "source": "SEC"}],
    })
    assert pf["requiredInputs"]["numericSupport"] == "available"


def _run_all():
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"\n{len(tests)}/{len(tests)} tests passed")
    return True


if __name__ == "__main__":
    sys.exit(0 if _run_all() else 1)
