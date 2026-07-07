"""research_schema Evidence Item tests.

    py -3 features/common/research_schema/tests/test_evidence_schema.py
"""
import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.common.research_schema.evidence import (
    evidence_items_from_list,
    is_countable_evidence,
    normalize_evidence_item,
)


def test_topic_evidence_adapter_normalizes_aliases():
    item = normalize_evidence_item({
        "title": "자료",
        "source": "Reuters",
        "evidenceRole": "supporting",
        "axisKey": "rates",
        "freshness": "current",
    }, artifact_type="topic_report", artifact_id="r1")
    assert item["role"] == "supporting"
    assert item["axis"] == "rates"
    assert item["freshness"] == "recent"


def test_user_note_is_not_countable_evidence():
    item = normalize_evidence_item({"type": "user_note", "title": "내 메모"}, artifact_type="personal_overlay")
    assert is_countable_evidence(item) is False


def test_evidence_list_dedupes():
    rows = evidence_items_from_list([
        {"title": "A", "url": "https://x", "role": "neutral"},
        {"title": "A duplicate", "url": "https://x", "role": "supporting"},
    ], artifact_type="topic_report")
    assert len(rows) == 1


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
