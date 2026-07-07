"""Thesis 모델·파싱·레지스트리 단위 테스트.

    py -3 features/thesis_tracking/tests/test_thesis_model.py
"""
import os
import sys
import tempfile

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.thesis_tracking import delta as D
from features.thesis_tracking import model as M
from features.thesis_tracking import service as S
from features.thesis_tracking import store as ST


THESIS_NOTE = """---
type: company_thesis
ticker: lrcx
company: Lam Research
status: active
review_cycle: quarterly
conviction: medium_high
created: 2026-06-10
last_reviewed: 2026-06-10
source_layer: user_synthesis
reuse_as_hypothesis: true
linked_regimes:
  - AI 반도체 공급망
  - 메모리 capex 회복
key_metrics:
  - WFE outlook
  - gross margin
---

# LRCX 투자 Thesis

## 핵심 Thesis
HBM과 메모리 capex 회복이 Lam Research의 중기 성장 동력이다.

## 핵심 가정
- 메모리 업체의 capex가 회복된다.
- HBM 투자 확대가 장비 수요로 연결된다.

## 강화 신호
- 메모리 업체 capex 가이던스 상향
- WFE 전망 개선

## 약화 신호
- 중국향 매출 급감

## 이탈 조건
- 2개 분기 연속 수주/가이던스 하향

## 다음 리뷰 체크포인트
- 다음 실적의 WFE 전망
- 중국 매출 비중 변화
"""


# --- enum normalize -----------------------------------------------------

def test_conviction_normalize():
    assert M.normalize_conviction("medium_high") == "medium_high"
    assert M.normalize_conviction("아무거나") == M.CONVICTION_DEFAULT


def test_verdict_normalize():
    assert M.normalize_verdict("strengthened") == "strengthened"
    assert M.normalize_verdict("강화") == M.VERDICT_DEFAULT  # 한국어 라벨은 enum 아님
    assert M.normalize_verdict("") == "insufficient_evidence"


def test_review_cycle_default():
    assert M.normalize_review_cycle("quarterly") == "quarterly"
    assert M.normalize_review_cycle(None) == "quarterly"


# --- 노트 파싱 ----------------------------------------------------------

def test_parse_company_thesis_fields():
    t = M.parse_thesis_text(THESIS_NOTE, note_path="Theses/LRCX.md")
    assert t.ticker == "LRCX"            # 대문자 정규화
    assert t.company == "Lam Research"
    assert t.conviction == "medium_high"
    assert t.review_cycle == "quarterly"
    assert "메모리 capex 회복" in t.core_thesis
    assert len(t.key_assumptions) == 2
    assert "메모리 업체 capex 가이던스 상향" in t.supporting_signals
    assert "중국향 매출 급감" in t.weakening_signals
    assert "2개 분기 연속 수주/가이던스 하향" in t.falsification_triggers
    assert len(t.next_checkpoints) == 2
    assert "WFE outlook" in t.key_metrics
    assert "AI 반도체 공급망" in t.linked_regimes
    assert t.note_path == "Theses/LRCX.md"


def test_parse_handles_missing_sections():
    t = M.parse_thesis_text("---\ntype: company_thesis\nticker: NVDA\n---\n# NVDA\n자유 메모.")
    assert t.ticker == "NVDA"
    assert t.key_assumptions == [] and t.supporting_signals == []
    assert t.conviction == M.CONVICTION_DEFAULT


# --- 레지스트리 store ---------------------------------------------------

def test_store_upsert_and_get():
    conn = ST.connect(":memory:")
    try:
        t = M.parse_thesis_text(THESIS_NOTE, note_path="Theses/LRCX.md")
        ST.upsert_thesis(conn, t)
        got = ST.get_thesis(conn, "lrcx")        # 대소문자 무관
        assert got["ticker"] == "LRCX"
        assert got["supporting_signals"] == t.supporting_signals  # JSON 라운드트립
        assert got["conviction"] == "medium_high"
        assert isinstance(got["key_metrics"], list)
    finally:
        conn.close()


def test_store_upsert_idempotent():
    conn = ST.connect(":memory:")
    try:
        t = M.parse_thesis_text(THESIS_NOTE)
        ST.upsert_thesis(conn, t)
        ST.upsert_thesis(conn, t)
        assert len(ST.list_theses(conn)) == 1   # ticker PK → 중복 없음
    finally:
        conn.close()


def test_store_requires_ticker():
    conn = ST.connect(":memory:")
    try:
        raised = False
        try:
            ST.upsert_thesis(conn, M.Thesis(ticker=""))
        except ValueError:
            raised = True
        assert raised
    finally:
        conn.close()


def test_list_filter_by_status():
    conn = ST.connect(":memory:")
    try:
        ST.upsert_thesis(conn, M.Thesis(ticker="AAA", status="active"))
        ST.upsert_thesis(conn, M.Thesis(ticker="BBB", status="closed"))
        assert len(ST.list_theses(conn, status="active")) == 1
        assert len(ST.list_theses(conn)) == 2
    finally:
        conn.close()


# --- Thesis Delta -------------------------------------------------------

def test_delta_normalize_forces_bias_controls():
    thesis = M.parse_thesis_text(THESIS_NOTE).to_row()
    out = D.normalize_delta({"verdict": "강화"}, thesis=thesis, evidence=[], meta={"periodDays": 90})
    assert out["verdict"] == "insufficient_evidence"  # 한국어 라벨은 enum 아님
    assert out["counterEvidence"]
    assert out["uncertainties"]
    assert out["nextCheckpoints"]


def test_delta_fallback_classifies_challenging_evidence():
    thesis = M.parse_thesis_text(THESIS_NOTE).to_row()
    evidence = [
        {"role": "challenging", "title": "가이던스 하향", "source": "Local", "date": "2026-06-10", "reason": "하향"},
        {"role": "challenging", "title": "수요 둔화", "source": "Local", "date": "2026-06-09", "reason": "둔화"},
        {"role": "challenging", "title": "마진 압박", "source": "Local", "date": "2026-06-08", "reason": "압박"},
    ]
    out = D.fallback_delta(thesis, evidence, {"period": "90d", "periodDays": 90, "cutoff": "2026-03-12"})
    assert out["verdict"] == "at_risk"
    assert out["counterEvidence"]
    assert "Canonical" in out["markdown"]


def test_store_delta_roundtrip():
    conn = ST.connect(":memory:")
    try:
        thesis = M.parse_thesis_text(THESIS_NOTE)
        ST.upsert_thesis(conn, thesis)
        delta = D.fallback_delta(thesis.to_row(), [], {"period": "90d", "periodDays": 90, "cutoff": "2026-03-12"})
        saved = ST.save_delta(conn, thesis.ticker, delta)
        assert saved["deltaId"]
        assert saved["ticker"] == "LRCX"
        assert ST.latest_delta(conn, "lrcx")["deltaId"] == saved["deltaId"]
        assert len(ST.list_deltas(conn, "LRCX")) == 1
    finally:
        conn.close()


def test_service_run_delta_saves_row_with_stubbed_engine():
    original = S.D.generate_delta
    with tempfile.TemporaryDirectory() as tmp:
        db_path = os.path.join(tmp, "memory.sqlite3")
        conn = ST.connect(db_path)
        try:
            thesis = M.parse_thesis_text(THESIS_NOTE)
            ST.upsert_thesis(conn, thesis)
        finally:
            conn.close()

        def fake_generate(thesis_row, **_kwargs):
            return {
                "verdict": "maintained",
                "verdictLabel": "유지",
                "summary": "stub",
                "supportingEvidence": [],
                "counterEvidence": [{"title": "반대 점검", "source": "test", "date": "", "reason": "필드 보장"}],
                "contradictions": [],
                "uncertainties": ["stub uncertainty"],
                "nextCheckpoints": ["next"],
                "markdown": "## stub",
                "evidence": [],
                "period": "90d",
                "periodDays": 90,
                "evidenceSource": "test",
                "generatedAt": "2026-06-11T00:00:00",
            }, "ok"

        S.D.generate_delta = fake_generate
        try:
            result = S.run_thesis_delta("LRCX", {"useLlm": False}, db_path=db_path)
            assert result["ok"] is True
            assert result["delta"]["verdict"] == "maintained"
            assert result["delta"]["deltaId"]
        finally:
            S.D.generate_delta = original


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
