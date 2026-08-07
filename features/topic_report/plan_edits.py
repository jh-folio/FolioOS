"""승인 전 계획 수정.

화면은 "실행 전에 리서치 계획을 확인하세요"라고 말하면서 고칠 수단을 주지 않았다.
계획이 어긋났을 때 사용자가 할 수 있는 일은 질문을 다시 쓰는 것뿐이었다.

수정은 서버가 적용한다. 클라이언트가 만든 계획 전체를 그대로 받으면 승인 계약이
검증하는 것이 사라진다. 여기서는 `PlanEdits`에 적힌 항목만 반영하고, 서버가 소유하는
값(expectedSections, deepResearch의 고정 문구, 근거 없음 확인)은 건드리지 않는다.
"""
from __future__ import annotations

from features.topic_report.approved_plan_schema import TopicPlanV1
from features.topic_report.approved_schema import PlanEdits


class PlanEditError(ValueError):
    """수정 결과가 계획으로 성립하지 않을 때."""


def _clean(values: list[str] | None) -> list[str] | None:
    if values is None:
        return None
    out: list[str] = []
    for item in values:
        text = " ".join(str(item or "").split())
        if text and text not in out:
            out.append(text)
    return out


def apply_plan_edits(plan: TopicPlanV1, edits: PlanEdits) -> TopicPlanV1:
    """수정을 반영한 새 계획. 원래 계획은 바뀌지 않는다."""
    payload = plan.model_dump(mode="json")

    if edits.topicLabel is not None:
        label = " ".join(edits.topicLabel.split())
        if not label:
            raise PlanEditError("empty_topic_label")
        payload["topicLabel"] = label
    if edits.reportType is not None:
        payload["reportType"] = edits.reportType
    for field, value in (
        ("researchQuestions", _clean(edits.researchQuestions)),
        ("searchQueries", _clean(edits.searchQueries)),
    ):
        if value is not None:
            payload[field] = value

    if edits.axes:
        by_key = {edit.key: edit for edit in edits.axes}
        unknown = set(by_key) - {axis["key"] for axis in payload["analysisAxes"]}
        if unknown:
            # 새 축을 만드는 통로가 되면 안 된다. 축 목록은 보고서 유형이 정한다.
            raise PlanEditError("unknown_axis")
        axes = []
        for axis in payload["analysisAxes"]:
            edit = by_key.get(axis["key"])
            if edit is None:
                axes.append(axis)
                continue
            if edit.removed:
                continue
            if edit.label is not None:
                label = " ".join(edit.label.split())
                if not label:
                    raise PlanEditError("empty_axis_label")
                axis["label"] = label
            for field, value in (
                ("questions", _clean(edit.questions)),
                ("searchQueries", _clean(edit.searchQueries)),
            ):
                if value is not None:
                    axis[field] = value
            axes.append(axis)
        if not axes:
            raise PlanEditError("no_axis_left")
        payload["analysisAxes"] = axes

    # 지워진 축을 가리키던 하위 질문은 함께 지운다. 남겨두면 실행이 없는 축을 조사한다.
    live_keys = {axis["key"] for axis in payload["analysisAxes"]}
    deep = payload.get("deepResearch") or {}
    deep["subQuestions"] = [
        question for question in deep.get("subQuestions") or []
        if not question.get("axisKey") or question["axisKey"] in live_keys
    ]
    payload["deepResearch"] = deep

    # 사람이 손댄 계획은 그렇게 표시한다. 규칙/LLM 계획과 구분되어야 한다.
    payload["plannerMode"] = "edited"
    try:
        return TopicPlanV1.model_validate(payload)
    except Exception as exc:  # pydantic ValidationError 포함
        raise PlanEditError("invalid_plan") from exc
