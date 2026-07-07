import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from features.common.quality_generation.quality_targets import render_quality_target_context


def test_quality_target_context_includes_collection_routes():
    text = render_quality_target_context(
        "company_analysis",
        preflight={"requiredInputs": {"sourceCount": 2}, "risks": ["수치 근거가 약합니다."]},
    )
    assert "자료 수집·보강 루트" in text
    assert "SEC companyfacts" in text or "DART" in text
    assert "수치 근거가 약합니다." in text


if __name__ == "__main__":
    tests = [test_quality_target_context_includes_collection_routes]
    passed = 0
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
        passed += 1
    print(f"\n{passed}/{len(tests)} tests passed")
