"""dataGaps는 산출물마다 모양이 다르다. 병합이 그 모양을 부수면 안 된다."""
from __future__ import annotations

from features.common.quality_generation.loop import _merge_gaps
from features.common.research_schema.data_gaps import data_gap_rows


def test_merge_keeps_the_company_analysis_dict_shape():
    """기업분석은 {"gaps", "summary"} dict다. list()로 감싸면 키 이름만 남는다.

    실제로 저장된 보고서의 dataGaps가 ["gaps", "summary", {...}]였고,
    resolutionAttempts에 있던 진짜 gap 5개가 보고서에서 사라졌다.
    """
    artifact = {"dataGaps": {"gaps": [{"message": "공시 서술 없음"}], "summary": {"highSeverityUnresolved": 1}}}
    merged = _merge_gaps(artifact, {"derivedDataGaps": [{"message": "관련 자료가 적습니다(0건)."}]})

    gaps = merged["dataGaps"]
    assert isinstance(gaps, dict)
    assert gaps["summary"] == {"highSeverityUnresolved": 1}
    assert [g["message"] for g in gaps["gaps"]] == ["공시 서술 없음", "관련 자료가 적습니다(0건)."]
    assert "gaps" not in [g for g in gaps["gaps"] if not isinstance(g, dict)]


def test_merge_keeps_the_list_shape_used_by_every_other_artifact():
    artifact = {"dataGaps": [{"message": "a"}]}
    merged = _merge_gaps(artifact, {"derivedDataGaps": [{"message": "b"}]})
    assert [g["message"] for g in merged["dataGaps"]] == ["a", "b"]


def test_readers_see_gaps_in_both_shapes():
    assert [g["message"] for g in data_gap_rows({"gaps": [{"message": "x"}]})] == ["x"]
    assert [g["message"] for g in data_gap_rows([{"message": "y"}])] == ["y"]
    assert data_gap_rows(None) == []
