"""research_schema Data Gap tests.

    py -3 features/common/research_schema/tests/test_data_gaps.py
"""
import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.common.research_schema.data_gaps import data_gaps_from_messages, normalize_data_gap


def test_data_gap_from_string_has_action():
    gap = normalize_data_gap("한국 수급 데이터 부족", artifact_type="topic_report", category="market_data")
    assert gap["severity"] == "medium"
    assert "CSV" in gap["suggestedAction"]


def test_data_gaps_dedupe():
    rows = data_gaps_from_messages(["A", "A", "B"], artifact_type="briefing", artifact_id="2026-06-13")
    assert len(rows) == 2
    assert rows[0]["artifactId"] == "2026-06-13"


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
