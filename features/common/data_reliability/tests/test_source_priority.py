"""data_reliability source priority tests.

    py -3 features/common/data_reliability/tests/test_source_priority.py
"""
import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.common.data_reliability.source_priority import annotate_source_priority, classify_source_kind, reliability_for_source


def test_official_sources_rank_before_news():
    rows = annotate_source_priority(
        [
            {"title": "뉴스", "type": "news", "source": "Reuters"},
            {"title": "10-K filing", "type": "filing", "source": "SEC"},
        ],
        artifact_type="thesis_delta",
    )
    assert rows[0]["type"] == "filing"
    assert rows[0]["sourceReliability"] == "high"


def test_user_note_stays_unknown_reliability():
    item = {"type": "user_note", "title": "내 생각"}
    assert classify_source_kind(item) == "user_note"
    assert reliability_for_source(item) == "unknown"


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
