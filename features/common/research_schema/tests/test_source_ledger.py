"""research_schema Source Ledger tests.

    py -3 features/common/research_schema/tests/test_source_ledger.py
"""
import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.common.research_schema.source_ledger import normalize_source_entry, source_ledger_from_items


def test_source_entry_normalizes_role_and_reliability():
    row = normalize_source_entry({
        "title": "A",
        "source": "SEC",
        "evidenceRole": "data_point",
        "reliability": "HIGH",
    }, artifact_type="company_analysis", artifact_id="nvda")
    assert row["evidenceRole"] == "data_point"
    assert row["reliability"] == "high"
    assert row["artifactId"] == "nvda"


def test_source_entry_accepts_source_reliability_alias():
    row = normalize_source_entry({
        "title": "A",
        "source": "SEC",
        "role": "supporting",
        "sourceReliability": "high",
    }, artifact_type="thesis_delta")
    assert row["evidenceRole"] == "supporting"
    assert row["reliability"] == "high"


def test_source_ledger_dedupes_by_url():
    rows = source_ledger_from_items([
        {"title": "A", "url": "https://x"},
        {"title": "A2", "url": "https://x"},
        {"title": "B", "path": "local.md"},
    ], artifact_type="topic_report")
    assert len(rows) == 2


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
