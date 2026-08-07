"""긴 질문 하나가 계획 전체를 오염시켰다.

사용자는 질문칸에 배경까지 한 문단으로 적는다. 그 240자가 `주제 라벨`이 되면
축 질문 다섯 개가 전부 같은 문단이 되고, 검색어에는 질문 전문과 `반도체의`,
`피크` 같은 토막이 들어간다. 실제로 `피크`는 전력망 기사를 물어왔다.
"""
from __future__ import annotations

from features.topic_report.planner import build_rule_plan, topic_subject

LONG_QUESTION = (
    "메모리 반도체의 방향성: 피크 아웃인가, 공급 부족인가 - 상반기 내내 잘 오르던 "
    "메모리 반도체 기업들의 주가가 최근 7월부터 큰 하락을 맞으면서 반도체 피크 아웃에 "
    "대한 의심이 자라고 있음 - 반대로 이번 하락을 매수 기회로 바라보는 분석도 다수 존재함"
)


def test_the_subject_stops_at_the_first_clause():
    assert topic_subject(LONG_QUESTION) == "메모리 반도체의 방향성"


def test_a_short_question_is_its_own_subject():
    assert topic_subject("원/달러 환율 1500원 돌파 가능성") == "원/달러 환율 1500원 돌파 가능성"


def test_a_long_first_clause_falls_back_to_keywords():
    """콜론도 줄바꿈도 없이 길게 쓰는 사람이 있다."""
    text = "미국 장기금리 상승이 한국 수출주 밸류에이션과 외국인 수급에 미치는 영향을 자세히 알고 싶습니다"
    subject = topic_subject(text)
    assert 0 < len(subject) <= 40
    assert subject != text


def test_axis_questions_no_longer_repeat_the_whole_question():
    plan = build_rule_plan(LONG_QUESTION)
    for axis in plan["analysisAxes"]:
        for question in axis["questions"]:
            assert len(question) < 60, question
            assert "매수 기회로" not in question


def test_the_whole_question_never_becomes_a_search_query():
    plan = build_rule_plan(LONG_QUESTION)
    for query in plan["searchQueries"]:
        assert len(query) <= 40, query
        # 한 단어짜리는 주제를 벗어난 기사를 물어온다(`피크` → 송전망 기사).
        assert len(query.split()) >= 2, query


def test_the_particle_of_is_stripped_from_keywords():
    """조사 목록에 `의`가 없어 `반도체의`가 검색어로 살아남았다."""
    plan = build_rule_plan(LONG_QUESTION)
    assert "반도체의" not in plan["searchQueries"]
    assert "반도체의" not in plan["memoryQueries"]


def test_the_saved_title_is_the_subject_not_the_paragraph():
    plan = build_rule_plan(LONG_QUESTION)
    assert plan["topicLabel"] == "메모리 반도체의 방향성"
    # 원문 질문은 그대로 남는다. 짧은 이름은 표시용이지 기록의 대체가 아니다.
    assert plan["topic"] == LONG_QUESTION


def test_questions_pick_the_right_korean_particle():
    plan = build_rule_plan("전력 인프라 병목")
    joined = " ".join(plan["researchQuestions"]) + " ".join(
        q for axis in plan["analysisAxes"] for q in axis["questions"]
    )
    assert "은(는)" not in joined
    assert "이(가)" not in joined


def test_an_empty_question_does_not_crash():
    plan = build_rule_plan("")
    assert plan["reportType"]
    assert isinstance(plan["searchQueries"], list)
