"""Step 0 regression contracts for the briefing market/visuals upgrade."""

import json
import sys
from copy import deepcopy
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.common.market_calendar import briefing_market_windows
from features.daily_briefing.contracts import (
    issue_label_fixture_errors,
    prompt_contract_errors,
    report_contract_errors,
    source_distribution_metrics,
)
from features.daily_briefing.schema import (
    BODY_AVAILABILITY,
    BRIEFING_TYPES,
    FRESHNESS_STATUSES,
    KR_SESSION_MODES,
    LINK_STATUSES,
    MARKET_IMPACT_STATUSES,
    MARKET_SCOPES,
    US_SESSION_MODES,
    briefing_file_name,
    briefing_archive_items,
    briefing_export_units,
    briefing_scope_view,
    enrich_briefing_sections,
    briefing_type_instruction,
    normalize_body_availability,
    normalize_briefing_contract,
    normalize_briefing_type,
    normalize_freshness,
    normalize_kr_session_mode,
    normalize_link_status,
    normalize_market_impact_status,
    normalize_market_scope,
    normalize_us_session_mode,
    visual_sidecar_file_name,
    visual_sidecar_gzip_file_name,
    visual_snapshot_errors,
)
from features.daily_briefing.service import read_briefing_prompt, briefing_prompt_path_label


FIXTURES = Path(__file__).resolve().parent / "fixtures"
PROMPT_US_PATH = ROOT / "features" / "daily_briefing" / "prompt_us.md"
PROMPT_KR_PATH = ROOT / "features" / "daily_briefing" / "prompt_kr.md"


def _load(name):
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def test_active_prompt_preserves_legacy_rules_and_sections():
    us_prompt = PROMPT_US_PATH.read_text(encoding="utf-8")
    kr_prompt = PROMPT_KR_PATH.read_text(encoding="utf-8")
    assert prompt_contract_errors(us_prompt) == []
    assert prompt_contract_errors(kr_prompt) == []
    assert "# US Market Briefing — YYYY.MM.DD" in us_prompt
    assert "# Korea Market Briefing — YYYY.MM.DD" in kr_prompt


def test_prompt_limits_us_market_repetition_inside_kr_briefing():
    prompt = PROMPT_KR_PATH.read_text(encoding="utf-8")

    assert "KR 브리핑에서는 한국장 자체의 지수·수급·환율·업종 흐름을 중심축으로 둔다" in prompt
    assert "미국장 언급은 한국장과의 직접 연결성이 높을 때만" in prompt
    assert "주도 기업·체크포인트·결론마다 미국장 이야기를 반복하지 않는다" in prompt


def test_scope_prompt_loader_uses_separate_market_files():
    us_prompt = read_briefing_prompt("us")
    kr_prompt = read_briefing_prompt("kr")
    both_prompt = read_briefing_prompt("both")

    assert "# US Market Briefing — YYYY.MM.DD" in us_prompt
    assert "# Korea Market Briefing — YYYY.MM.DD" not in us_prompt
    assert "# Korea Market Briefing — YYYY.MM.DD" in kr_prompt
    assert "# US Market Briefing — YYYY.MM.DD" not in kr_prompt
    assert "# US Market Briefing — YYYY.MM.DD" in both_prompt
    assert "# Korea Market Briefing — YYYY.MM.DD" in both_prompt
    assert "prompt_us.md" in briefing_prompt_path_label("us")
    assert "prompt_kr.md" in briefing_prompt_path_label("kr")


def test_legacy_report_contract_and_v2_defaults_are_backward_compatible():
    legacy = _load("legacy_briefing.json")
    assert report_contract_errors(legacy) == []
    before_markdown = legacy["markdown"]
    before_overlay = json.loads(json.dumps(legacy["personalOverlay"], ensure_ascii=False))

    normalized = normalize_briefing_contract(legacy)

    assert normalized["markdown"] == before_markdown
    assert normalized["personalOverlay"] == before_overlay
    assert normalized["marketScope"] == "both"
    assert normalized["briefingType"] == "default"
    assert normalized["briefings"] == {}
    assert normalized["visualRecommendations"] == []
    assert normalized["visualSnapshots"] == []
    assert normalized["issueCoverage"] == []
    assert "marketScope" not in legacy  # input object is not mutated


def test_v2_enums_are_closed_and_normalized_in_code():
    assert MARKET_SCOPES == {"us", "kr", "both"}
    assert BRIEFING_TYPES == {"default", "market_focused", "concise"}
    assert normalize_market_scope("US") == "us"
    assert normalize_market_scope("invalid") == "both"
    assert normalize_briefing_type("market_focused") == "market_focused"
    assert normalize_us_session_mode("bad") == "us_off_session"
    assert normalize_kr_session_mode("bad") == "kr_off_session"
    assert normalize_link_status("bad") == "insufficient_evidence"
    assert normalize_freshness("bad") == "unavailable"
    assert normalize_body_availability("bad") == "headline_only"
    assert normalize_market_impact_status("bad") == "unavailable"
    assert "us_close" in US_SESSION_MODES and "kr_close" in KR_SESSION_MODES
    assert "selectively_connected" in LINK_STATUSES
    assert "partial_live" in FRESHNESS_STATUSES
    assert BODY_AVAILABILITY == {"full", "summary_only", "headline_only"}
    assert MARKET_IMPACT_STATUSES == {"measured", "partial", "unavailable"}


def test_briefing_type_instruction_keeps_sections_but_changes_editorial_priority():
    default = briefing_type_instruction("default")
    market_focused = briefing_type_instruction("market_focused")
    concise = briefing_type_instruction("concise")

    assert "현재 전체 구성과 분량" in default
    assert "기존 섹션을 삭제하지" in market_focused
    assert "시장 흐름" in market_focused and "수급" in market_focused
    assert "기존 섹션을 모두 유지" in concise
    assert "짧게" in concise
    assert briefing_type_instruction("invalid") == default


def test_market_metadata_is_structured_and_does_not_mutate_report():
    report = {
        "date": "2026-06-22", "marketScope": "both", "briefingType": "market_focused",
        "generatedAt": "2026-06-22T08:30:00+09:00", "summary": "report fallback",
        "briefings": {
            "us": {"markdown": "# US Market Briefing\n\nUS body", "marketSessionDate": "2026-06-21", "summary": "US summary"},
            "kr": {"markdown": "# Korea Market Briefing\n\nKR body", "marketSessionDate": "2026-06-22"},
        },
    }
    original = deepcopy(report)
    items = briefing_archive_items(report)
    assert report == original
    assert [row["id"] for row in items] == ["2026-06-22:us", "2026-06-22:kr"]
    assert items[0]["title"] == "US Market Briefing — 2026-06-22"
    assert items[0]["summary"] == "US summary"
    assert items[0]["tags"] == ["미국장", "시황중심"]
    assert items[1]["sessionDate"] == "2026-06-22"
    assert items[1]["reportScope"] == "both"


def test_enrichment_adds_metadata_without_changing_markdown():
    sections = {"us": {"markdown": "# US Market Briefing\n\nBody", "marketSessionDate": "2026-06-21"}}
    enriched = enrich_briefing_sections(
        sections, report_date="2026-06-22", report_scope="us", briefing_type="concise",
        generated_at="2026-06-22T09:00:00+09:00", report_summary="fallback",
    )
    assert enriched["us"]["markdown"] == sections["us"]["markdown"]
    assert enriched["us"]["marketScope"] == "us"
    assert enriched["us"]["briefingType"] == "concise"
    assert enriched["us"]["sessionDate"] == "2026-06-21"
    assert enriched["us"]["tags"] == ["미국장", "요약"]


def test_legacy_report_gets_one_safe_archive_item():
    report = {"date": "2026-06-20", "markdown": "# Legacy\n\n" + "A" * 400}
    items = briefing_archive_items(report)
    assert len(items) == 1
    assert items[0]["id"] == "2026-06-20:both"
    assert len(items[0]["summary"]) == 240


def test_export_units_split_combined_report_without_mutation():
    report = {
        "date": "2026-06-22", "marketScope": "both", "briefingType": "market_focused",
        "generatedAt": "2026-06-22T08:30:00+09:00",
        "briefings": {
            "us": {"markdown": "# US Market Briefing\n\nUS only", "marketSessionDate": "2026-06-21"},
            "kr": {"markdown": "# Korea Market Briefing\n\nKR only", "marketSessionDate": "2026-06-22"},
        },
    }
    original = deepcopy(report)

    units = briefing_export_units(report)

    assert report == original
    assert [unit["marketScope"] for unit in units] == ["us", "kr"]
    assert units[0]["markdown"].endswith("US only")
    assert "KR only" not in units[0]["markdown"]
    assert units[0]["title"] == "US Market Briefing — 2026-06-22"
    assert units[0]["tags"] == ["미국장", "시황중심"]
    assert units[1]["title"] == "KR Market Briefing — 2026-06-22"
    assert units[1]["tags"] == ["한국장", "시황중심"]
    assert all(unit["reportScope"] == "both" for unit in units)


def test_export_units_respect_scoped_view_even_when_legacy_sections_remain():
    report = {
        "date": "2026-06-22", "marketScope": "both", "briefingType": "market_focused",
        "briefings": {
            "us": {"markdown": "# US Market Briefing\n\nUS only"},
            "kr": {"markdown": "# Korea Market Briefing\n\nKR only"},
        },
    }

    units = briefing_export_units(briefing_scope_view(report, "us"))

    assert len(units) == 1
    assert units[0]["marketScope"] == "us"
    assert units[0]["markdown"].endswith("US only")
    assert "KR only" not in units[0]["markdown"]


def test_export_units_keep_single_and_legacy_reports_as_one_unit():
    single = briefing_export_units({
        "date": "2026-06-22", "marketScope": "us", "briefingType": "concise",
        "markdown": "# US Market Briefing\n\nShort",
    })
    legacy = briefing_export_units({"date": "2026-06-20", "markdown": "# Legacy\n\nBody"})

    assert len(single) == 1
    assert single[0]["marketScope"] == "us"
    assert single[0]["tags"] == ["미국장", "요약"]
    assert len(legacy) == 1
    assert legacy[0]["marketScope"] == "both"
    assert legacy[0]["tags"] == ["종합", "기본"]


def test_visual_snapshot_contract_requires_reproducibility_metadata():
    valid = {
        "id": "us-market-chart",
        "type": "index_chart",
        "market": "US",
        "asOf": "2026-06-18T16:00:00-04:00",
        "provider": "fixture",
        "freshness": "close_snapshot",
        "coverage": "sp500",
    }
    assert visual_snapshot_errors(valid) == []
    errors = visual_snapshot_errors({"id": "broken", "market": "XX", "freshness": "now"})
    assert "missing provider" in errors
    assert "invalid market" in errors
    assert "invalid freshness" in errors


def test_dated_storage_contract_supports_per_market_report_and_visual_sidecars():
    assert briefing_file_name("2026-06-19") == "2026-06-19.json"
    assert briefing_file_name("2026-06-19", "us") == "2026-06-19.us.json"
    assert briefing_file_name("2026-06-19", "kr") == "2026-06-19.kr.json"
    assert visual_sidecar_file_name("2026-06-19") == "2026-06-19.visuals.json"
    assert visual_sidecar_file_name("2026-06-19", "us") == "2026-06-19.us.visuals.json"
    assert visual_sidecar_gzip_file_name("2026-06-19") == "2026-06-19.visuals.json.gz"
    assert visual_sidecar_gzip_file_name("2026-06-19", "kr") == "2026-06-19.kr.visuals.json.gz"


def test_single_market_scope_view_does_not_expand_to_legacy_both():
    report = {
        "date": "2026-06-19",
        "marketScope": "us",
        "briefingType": "concise",
        "markdown": "# US Market Briefing\n\nOnly US",
        "briefings": {},
        "visualSnapshots": [{"id": "us-heat", "market": "US"}],
    }
    view = briefing_scope_view(report, "kr")
    assert view["marketScope"] == "us"
    assert view["markdown"] == report["markdown"]
    assert briefing_archive_items(report)[0]["marketScope"] == "us"


def test_visual_schema_v2_accepts_dual_interval_price_series():
    snapshot = {
        "schemaVersion": 2,
        "id": "price-series:us:indices:2026-06-19",
        "type": "price_series",
        "role": "market_summary",
        "market": "US",
        "marketSessionDate": "2026-06-19",
        "asOf": "2026-06-19T16:00:00-04:00",
        "provider": "yfinance",
        "freshness": "close_snapshot",
        "coverage": {"status": "complete", "requested": 3, "returned": 3, "ratio": 1.0},
        "timezone": "America/New_York",
        "currency": "USD",
        "series": [{
            "ticker": "^GSPC",
            "label": "S&P 500",
            "intraday": {"interval": "5m", "points": []},
            "daily": {"interval": "1d", "points": []},
        }],
    }
    assert visual_snapshot_errors(snapshot) == []


def test_market_calendar_session_fixtures_are_stable():
    for case in _load("session_cases.json"):
        windows = briefing_market_windows(case["date"])
        assert windows["analysisMode"] == case["analysisMode"], case
        assert bool(windows["weekendOrHolidayNewsMode"]) is case["weekendOrHolidayNewsMode"], case


def test_source_bias_baseline_is_aggregate_only_and_reproducible():
    baseline = _load("source_bias_baseline.json")
    sources = [
        publisher
        for publisher, count in baseline["publishers"].items()
        for _ in range(count)
    ]
    metrics = source_distribution_metrics(sources)
    assert metrics["total"] == baseline["totalReferences"]
    for field, expected in baseline["expected"].items():
        assert metrics[field] == expected
    assert metrics["topTwoShare"] > 0.9  # fixed pre-Step-1 diagnosis
    assert "path" not in baseline and "url" not in baseline
    assert all(isinstance(value, int) for value in baseline["publishers"].values())


def test_manual_issue_cluster_fixture_is_ready_for_step1_regression():
    items = _load("issue_cluster_labels.json")
    assert issue_label_fixture_errors(items) == []
    assert len(items) == 50
    assert len({item["expectedCluster"] for item in items}) == 10
    assert len({item["publisher"] for item in items}) >= 5


def _run_all():
    tests = [value for name, value in sorted(globals().items()) if name.startswith("test_") and callable(value)]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"\n{len(tests)}/{len(tests)} tests passed")
    return True


if __name__ == "__main__":
    sys.exit(0 if _run_all() else 1)
