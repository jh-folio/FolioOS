"""research_schema 공통 enum/normalize 테스트.

    py -3 features/common/research_schema/tests/test_enums.py
"""
import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.common.research_schema import enums


def test_evidence_role_valid_and_fallback():
    assert enums.normalize_evidence_role("supporting") == "supporting"
    assert enums.normalize_evidence_role("CHALLENGING") == "challenging"
    assert enums.normalize_evidence_role("garbage") == "neutral"
    assert enums.normalize_evidence_role(None) == "neutral"
    assert enums.normalize_evidence_role("", default="background") == "background"


def test_evidence_type_valid_and_fallback():
    assert enums.normalize_evidence_type(" Filing ") == "filing"
    assert enums.normalize_evidence_type("user_note") == "user_note"
    assert enums.normalize_evidence_type("nope") == "news"


def test_user_note_is_hypothesis_not_evidence():
    # 원칙 2: 사용자 노트는 evidence가 아니라 hypothesis
    assert enums.is_hypothesis_evidence_type("user_note") is True
    assert enums.is_hypothesis_evidence_type("filing") is False
    assert enums.is_hypothesis_evidence_type("garbage") is False  # → news, not hypothesis


def test_checkpoint_enums():
    assert enums.normalize_checkpoint_confidence("HIGH") == "high"
    assert enums.normalize_checkpoint_confidence("x") == "medium"
    assert enums.normalize_checkpoint_scope("company") == "company"
    assert enums.normalize_checkpoint_scope("") == "market"


def test_data_gap_severity():
    assert enums.normalize_data_gap_severity("blocking") == "blocking"
    assert enums.normalize_data_gap_severity("???") == "medium"


def test_market_tape_status():
    for s in ("fresh", "stale", "missing", "conflicting", "estimated"):
        assert enums.normalize_market_tape_status(s) == s
    assert enums.normalize_market_tape_status("weird") == "missing"


def test_artifact_type_and_reliability():
    assert enums.normalize_artifact_type("Briefing") == "briefing"
    assert enums.normalize_artifact_type("bogus") == "topic_report"
    assert enums.normalize_reliability("LOW") == "low"
    assert enums.normalize_reliability("") == "medium"


def test_evidence_role_matches_topic_report():
    # topic_report와 동일 집합이어야 일반화 시 호환된다.
    from features.topic_report.topic_schema import EVIDENCE_ROLE_CHOICES as TR
    assert enums.EVIDENCE_ROLE_CHOICES == TR


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
