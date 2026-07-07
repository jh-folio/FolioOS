"""data_reliability official material adapter tests.

    py -3 features/common/data_reliability/tests/test_official_materials.py
"""
import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.common.data_reliability.official_materials import official_evidence_from_materials


def test_official_materials_emit_companyfacts_and_10k_evidence():
    evidence, gaps = official_evidence_from_materials(
        {
            "company": {"ticker": "NVDA"},
            "secFacts": {"ok": True, "cik": "0001045810", "markdown": "Revenue..."},
            "rankedFiling": {
                "ok": True,
                "metadata": {"form": "10-K", "filingDate": "2026-03-01"},
                "paragraphs": [{"item": "1A", "paragraph": "Risk factors"}],
            },
            "filingDocs": [],
            "supportDocs": [],
        },
        artifact_id="NVDA",
    )
    assert len(evidence) >= 2
    assert any(x["axis"] == "official_financials" for x in evidence)
    assert not gaps


def test_missing_official_materials_emit_actionable_gaps():
    evidence, gaps = official_evidence_from_materials({"company": {"ticker": "ABC"}}, artifact_id="ABC")
    assert not evidence
    assert gaps
    assert all(g.get("suggestedAction") for g in gaps)


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
