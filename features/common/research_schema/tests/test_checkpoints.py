"""research_schema Checkpoint tests.

    py -3 features/common/research_schema/tests/test_checkpoints.py
"""
import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.common.research_schema.checkpoints import (
    checkpoints_from_list,
    checkpoints_from_markdown,
    checkpoints_from_thesis_delta,
    extract_section,
    extract_sections,
)


_US_SECTION = "# US Market Briefing\n\n## 6. 다음 미국장 체크포인트\n- 미국 10년물 금리 4.5% 재돌파\n"
_KR_SECTION = "# Korea Market Briefing\n\n## 6. 다음 한국장 체크포인트\n- 원/달러 환율과 외국인 수급\n"
_MERGED = "\n\n---\n\n".join([_US_SECTION, _KR_SECTION])
_BOTH_HEADINGS = ["다음 미국장 체크포인트", "다음 한국장 체크포인트"]


def test_checkpoint_normalizes_string_list():
    rows = checkpoints_from_list(["금리 확인"], artifact_type="briefing", artifact_id="2026-06-13")
    assert rows[0]["artifactType"] == "briefing"
    assert rows[0]["artifactId"] == "2026-06-13"
    assert rows[0]["scope"] == "market"
    assert rows[0]["confidence"] == "medium"


def test_markdown_heading_extractor():
    md = """# Report

## 9. 앞으로 확인할 체크포인트
- 미국 10년물 금리 4.5% 재돌파 여부
- 원/달러 환율과 외국인 수급

## 결론
끝.
"""
    rows = checkpoints_from_markdown(md, artifact_type="topic_report", artifact_id="abc", topic="금리")
    assert len(rows) == 2
    assert rows[0]["topic"] == "금리"
    assert "10년물" in rows[0]["checkpoint"]


def test_every_matching_section_is_kept_not_just_the_last():
    """브리핑은 시장별 markdown을 하나로 이어 붙인다.

    한 섹션만 고르던 동안 미국장 체크포인트는 어디에도 저장되지 않았고, 남은
    한국장 섹션이 미국 보고서의 `checkpoints`로 들어갔다.
    """
    rows = checkpoints_from_markdown(
        _MERGED, artifact_type="briefing", artifact_id="2026-08-14", headings=_BOTH_HEADINGS,
    )

    assert [row["sourceSection"] for row in rows] == [
        "6. 다음 미국장 체크포인트",
        "6. 다음 한국장 체크포인트",
    ]
    assert "10년물" in rows[0]["checkpoint"]


def test_extract_sections_returns_all_and_extract_section_returns_the_first():
    md = "## 체크포인트\n- 하나\n\n## 체크포인트\n- 둘\n"

    assert [body for _heading, body in extract_sections(md, ["체크포인트"])] == ["- 하나", "- 둘"]
    assert extract_section(md, ["체크포인트"])[1] == "- 하나"
    assert extract_sections("", ["체크포인트"]) == []


def test_the_limit_counts_across_sections():
    rows = checkpoints_from_markdown(
        _MERGED, artifact_type="briefing", artifact_id="2026-08-14",
        headings=_BOTH_HEADINGS, limit=1,
    )

    assert [row["sourceSection"] for row in rows] == ["6. 다음 미국장 체크포인트"]


def test_thesis_delta_checkpoint_adapter():
    rows = checkpoints_from_thesis_delta({
        "deltaId": "d1",
        "ticker": "NVDA",
        "company": "NVIDIA",
        "nextCheckpoints": ["데이터센터 매출 성장률"],
    })
    assert rows[0]["artifactType"] == "thesis_delta"
    assert rows[0]["scope"] == "company"
    assert rows[0]["ticker"] == "NVDA"


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
