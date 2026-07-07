import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.common.quality_generation.report_format import enforce_report_format, unwrap_markdown_payload


BRIEFING = """# Daily Market Briefing — 2026.06.14

## 0. 오늘의 시장 성격

원본 0.

## 1. 시장 흐름

원본 1.

## 2. 시장을 움직인 핵심 변수

원본 2.

## 3. 시장을 주도한 기업 ① — A

원본 3.

## 4. 시장을 주도한 기업 ② — B

원본 4.

## 5. 일반 투자자 관점

원본 5.

## 6. 내일 확인할 체크포인트

원본 6.

## 오늘의 결론

원본 결론.

## 참고자료

- 원본 자료

## Source & Data Notes

원본 노트.
"""


def test_unwraps_nested_json_markdown_payload():
    wrapped = json.dumps({"markdown": json.dumps({"markdown": BRIEFING}, ensure_ascii=False)}, ensure_ascii=False)
    assert unwrap_markdown_payload(wrapped).startswith("# Daily Market Briefing")


def test_unwraps_malformed_json_markdown_payload():
    wrapped = '{"markdown": "# Daily Market Briefing — 2026.06.14\\n\\n## 0. 오늘의 시장 성격\\n\\n본문'
    assert unwrap_markdown_payload(wrapped).startswith("# Daily Market Briefing")


def test_briefing_rejects_json_wrapper_without_losing_original():
    candidate = json.dumps({"markdown": "요약만 있는 잘못된 결과"}, ensure_ascii=False)
    result = enforce_report_format("briefing", BRIEFING, candidate)
    assert result.mode == "rejected"
    assert result.markdown == BRIEFING


def test_briefing_section_merge_preserves_required_headings():
    candidate = """## 2. 시장을 움직인 핵심 변수

개선된 핵심 변수.

## 6. 내일 확인할 체크포인트

개선된 체크포인트.
"""
    result = enforce_report_format("briefing", BRIEFING, candidate)
    assert result.mode == "section_merge"
    assert "개선된 핵심 변수" in result.markdown
    assert "## 참고자료" in result.markdown
    assert result.markdown.index("## 1. 시장 흐름") < result.markdown.index("## 2. 시장을 움직인 핵심 변수")


def test_topic_report_requires_late_sections():
    original = """# 주제 분석 리포트 — 2026-06-14

## Executive Summary
본문
## 질문 정의와 분석 범위
본문
## 핵심 데이터 대시보드
본문
## 현재 상황
본문
## 작동 경로
본문
## 수혜/피해 자산과 기업
본문
## 반론과 리스크
본문
## 시나리오
본문
## 앞으로 확인할 체크포인트
본문
## 결론
본문
## Source & Data Notes
본문
"""
    candidate = "# 주제 분석 리포트\n\n## Executive Summary\n요약만 있음"
    result = enforce_report_format("topic_report", original, candidate)
    assert result.mode == "section_merge"
    assert "요약만 있음" in result.markdown
    assert "## Source & Data Notes" in result.markdown


def test_company_analysis_preserves_section_skeleton():
    original = """# A 분석

## 섹션 0 — 핵심 판단
본문
## 섹션 1 — 기업 개요와 사업 구조
본문
## 섹션 2 — 실적 요약 (Financial Summary)
본문
## 섹션 3 — 밸류에이션
본문
## 섹션 4 — 경쟁우위 분석
본문
## 섹션 5 — 리스크 + 반증조건
본문
## 섹션 6 — 성장 전망 + 앞으로의 주요 이벤트
본문
## 섹션 7 — 어떻게 접근할까
본문
## 섹션 8 — 참고 자료
본문
"""
    candidate = """## 섹션 5 — 리스크 + 반증조건

개선된 리스크.
"""
    result = enforce_report_format("company_analysis", original, candidate)
    assert result.mode == "section_merge"
    assert "개선된 리스크" in result.markdown
    assert "## 섹션 8 — 참고 자료" in result.markdown


def _run_all():
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"\n{len(tests)}/{len(tests)} tests passed")
    return True


if __name__ == "__main__":
    sys.exit(0 if _run_all() else 1)
