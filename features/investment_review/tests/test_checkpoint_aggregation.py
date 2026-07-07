"""체크포인트 집계(thesis_delta + regime, dedup/limit) 테스트.

    py -3 features/investment_review/tests/test_checkpoint_aggregation.py
"""
import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.investment_review import service as S


def test_aggregate_from_thesis_and_regime():
    deltas = [{"ticker": "NVDA", "company": "NVIDIA", "nextCheckpoints": ["고객 집중 리스크 확인", "데이터센터 매출 추이"]}]
    states = [{"id": "s1", "stateLabel": "금리·달러", "nextCheckpoints": ["10년물 금리 재상승 확인"]}]
    cps = S.aggregate_checkpoints(deltas, states)
    texts = [c["checkpoint"] for c in cps]
    assert "고객 집중 리스크 확인" in texts
    assert "10년물 금리 재상승 확인" in texts
    assert len(cps) == 3


def test_dedup_same_checkpoint_text():
    deltas = [{"ticker": "NVDA", "nextCheckpoints": ["같은 체크포인트"]}]
    states = [{"id": "s1", "stateLabel": "x", "nextCheckpoints": ["같은 체크포인트"]}]
    cps = S.aggregate_checkpoints(deltas, states)
    assert len(cps) == 1


def test_limit_applied():
    deltas = [{"ticker": "T", "nextCheckpoints": [f"체크포인트 {i}" for i in range(30)]}]
    cps = S.aggregate_checkpoints(deltas, [], limit=5)
    assert len(cps) == 5


def test_empty_when_no_checkpoints():
    cps = S.aggregate_checkpoints([{"ticker": "T"}], [{"id": "s"}])
    assert cps == []


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
