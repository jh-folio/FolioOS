"""LLM이 쓴 계획도 검색어 위생은 코드가 정한다.

프롬프트에 "짧은 구문으로 쓰세요"라고 적는 것은 부탁이지 제한이 아니다.
여기서 새는 질의는 그대로 근거 검색을 돌리므로 보고서 품질이 된다(§5 원칙 4).
"""
from __future__ import annotations

import json

from features.topic_report import planner


def _llm_returning(payload: dict, monkeypatch):
    monkeypatch.setattr(planner, "topic_subject", planner.topic_subject)
    import features.llm_settings.client as client

    monkeypatch.setattr(client, "use_llm_analysis", lambda: True)
    monkeypatch.setattr(client, "selected_llm_config", lambda: {"apiKey": "test-key", "provider": "test"})
    monkeypatch.setattr(client, "request_llm_text", lambda *a, **k: (json.dumps(payload, ensure_ascii=False), "rid"))
    monkeypatch.setattr(client, "extract_json_object", lambda text: json.loads(text))


LONG = "메모리 반도체의 방향성: 피크 아웃인가 - " + "배경 설명이 길게 이어집니다. " * 6


def test_a_full_question_returned_as_a_query_is_dropped(monkeypatch):
    _llm_returning({
        "topic": LONG,
        "reportType": "industry_theme",
        "searchQueries": [LONG, "메모리 반도체 가격", "피크"],
        "analysisAxes": [
            {"key": "demand", "label": "수요", "questions": ["수요는 어떤가?"], "searchQueries": [LONG]},
        ],
    }, monkeypatch)

    plan, mode = planner.refine_plan_with_llm(planner.build_rule_plan(LONG), LONG)

    assert mode == "llm"
    assert plan["searchQueries"] == ["메모리 반도체 가격"]
    for axis in plan["analysisAxes"]:
        for query in axis["searchQueries"]:
            assert len(query) <= 40


def test_an_llm_plan_with_no_usable_query_falls_back_to_the_rules(monkeypatch):
    rule_plan = planner.build_rule_plan(LONG)
    _llm_returning({
        "topic": LONG,
        "reportType": "industry_theme",
        "searchQueries": ["피크", "메모리"],
        "analysisAxes": [{"key": "demand", "label": "수요", "questions": ["수요는?"], "searchQueries": []}],
    }, monkeypatch)

    plan, _mode = planner.refine_plan_with_llm(rule_plan, LONG)

    assert plan["searchQueries"]
    assert plan["searchQueries"] == rule_plan["searchQueries"][:4]


def test_a_broken_llm_reply_keeps_the_rule_plan(monkeypatch):
    import features.llm_settings.client as client

    monkeypatch.setattr(client, "use_llm_analysis", lambda: True)
    monkeypatch.setattr(client, "selected_llm_config", lambda: {"apiKey": "k"})
    monkeypatch.setattr(client, "request_llm_text", lambda *a, **k: ("not json", "rid"))
    monkeypatch.setattr(client, "extract_json_object", lambda _text: None)

    rule_plan = planner.build_rule_plan(LONG)
    plan, mode = planner.refine_plan_with_llm(rule_plan, LONG)

    assert mode == "parse_failed"
    assert plan is rule_plan


def test_without_a_key_the_preview_still_gets_a_plan(monkeypatch):
    import features.llm_settings.client as client

    monkeypatch.setattr(client, "use_llm_analysis", lambda: True)
    monkeypatch.setattr(client, "selected_llm_config", lambda: {"apiKey": ""})

    plan = planner.build_topic_plan("custom", custom_label=LONG)

    assert plan["plannerMode"] == "rules"
    assert plan["analysisAxes"]
