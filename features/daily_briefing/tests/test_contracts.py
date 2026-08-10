"""Step 0 regression contracts for the briefing market/visuals upgrade."""

import datetime as dt
import json
import pytest
import sys
from copy import deepcopy
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.common.market_calendar import briefing_market_windows, is_market_open
from features.daily_briefing.contracts import (
    issue_label_fixture_errors,
    prompt_contract_errors,
    report_contract_errors,
    source_distribution_metrics,
)
from features.daily_briefing.schema import (
    BODY_AVAILABILITY,
    BRIEFING_TYPES,
    EUROPE_SESSION_MODES,
    FRESHNESS_STATUSES,
    JP_SESSION_MODES,
    KR_SESSION_MODES,
    MARKET_IMPACT_STATUSES,
    MARKET_SCOPES,
    US_SESSION_MODES,
    briefing_expected_titles,
    briefing_file_name,
    briefing_archive_items,
    briefing_market_metadata,
    briefing_export_units,
    briefing_scope_view,
    enrich_briefing_sections,
    normalize_briefing_markdown_titles,
    briefing_type_instruction,
    normalize_body_availability,
    normalize_briefing_contract,
    normalize_briefing_type,
    normalize_freshness,
    normalize_kr_session_mode,
    normalize_market_impact_status,
    normalize_market_scope,
    normalize_session_mode,
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
    assert "# US Market Briefing — YYYY.MM.DD 마감" in us_prompt
    assert "# Korea Market Briefing — YYYY.MM.DD 장중|마감" in kr_prompt


def test_prompt_limits_us_market_repetition_inside_kr_briefing():
    prompt = PROMPT_KR_PATH.read_text(encoding="utf-8")

    assert "KR 브리핑에서는 한국장 자체의 지수·수급·환율·업종 흐름을 중심축으로 둔다" in prompt
    assert "미국장 언급은 한국장과의 직접 연결성이 높을 때만" in prompt
    assert "주도 기업·체크포인트·결론마다 미국장 이야기를 반복하지 않는다" in prompt


def test_scope_prompt_loader_uses_separate_market_files():
    us_prompt = read_briefing_prompt("us")
    kr_prompt = read_briefing_prompt("kr")
    both_prompt = read_briefing_prompt("both")

    assert "# US Market Briefing — YYYY.MM.DD 마감" in us_prompt
    assert "# Korea Market Briefing — YYYY.MM.DD 장중|마감" not in us_prompt
    assert "# Korea Market Briefing — YYYY.MM.DD 장중|마감" in kr_prompt
    assert "# US Market Briefing — YYYY.MM.DD 마감" not in kr_prompt
    assert "# US Market Briefing — YYYY.MM.DD 마감" in both_prompt
    assert "# Korea Market Briefing — YYYY.MM.DD 장중|마감" in both_prompt
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
    assert MARKET_SCOPES == {"us", "kr", "europe", "jp", "all", "both", "multi"}
    assert BRIEFING_TYPES == {"default", "market_focused", "concise"}
    assert normalize_market_scope("US") == "us"
    assert normalize_market_scope("EUROPE") == "europe"
    assert normalize_market_scope("JP") == "jp"
    # 알 수 없는 값이 네 시장 생성으로 확대되면 안 된다.
    assert normalize_market_scope("invalid") == "both"
    assert normalize_briefing_type("market_focused") == "market_focused"
    assert normalize_us_session_mode("bad") == "us_off_session"
    assert normalize_kr_session_mode("bad") == "kr_off_session"
    assert normalize_freshness("bad") == "unavailable"
    assert normalize_body_availability("bad") == "headline_only"
    assert normalize_market_impact_status("bad") == "unavailable"
    assert "us_close" in US_SESSION_MODES and "kr_close" in KR_SESSION_MODES
    # 유럽은 한국시간 자정 이후 마감해 장중 모드가 없고, 일본은 한국처럼 있다.
    assert "europe_intraday" not in EUROPE_SESSION_MODES
    assert "jp_intraday" in JP_SESSION_MODES
    assert normalize_session_mode("europe", "bad") == "europe_off_session"
    assert normalize_session_mode("jp", "bad") == "jp_off_session"
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
    assert items[0]["title"] == "US Market Briefing — 2026.06.21 마감"
    assert items[0]["summary"] == "US summary"
    assert items[0]["tags"] == ["미국장", "시황중심"]
    assert items[1]["sessionDate"] == "2026-06-22"
    assert items[1]["title"] == "Korea Market Briefing — 2026.06.22 마감"
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
    assert enriched["us"]["title"] == "US Market Briefing — 2026.06.21 마감"
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
    assert units[0]["title"] == "US Market Briefing — 2026.06.21 마감"
    assert units[0]["tags"] == ["미국장", "시황중심"]
    assert units[1]["title"] == "Korea Market Briefing — 2026.06.22 마감"
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


def test_connected_exchange_calendar_overrides_static_kr_holiday():
    def exchange_calendar(day, market):
        if market == "KR" and day.isoformat() == "2026-08-17":
            return {
                "date": "2026-08-17",
                "isOpen": True,
                "provider": "exchange_fixture",
                "previousBusinessDay": "2026-08-14",
            }
        return None

    windows = briefing_market_windows("2026-08-17", exchange_calendar_fetcher=exchange_calendar)

    assert windows["krCurrentSessionOpen"] is True
    assert windows["krCurrentSessionDate"] == "2026-08-17"
    assert windows["calendarProviders"]["KR"] == "exchange_fixture"


def test_connected_exchange_calendar_can_close_static_weekday_and_supply_previous_day():
    def exchange_calendar(day, market):
        if market == "KR" and day.isoformat() == "2026-08-18":
            return {
                "date": "2026-08-18",
                "isOpen": False,
                "provider": "exchange_fixture",
                "previousBusinessDay": "2026-08-14",
            }
        return None

    windows = briefing_market_windows("2026-08-18", exchange_calendar_fetcher=exchange_calendar)

    assert windows["krCurrentSessionOpen"] is False
    assert windows["krPreviousSessionDate"] == "2026-08-14"
    assert windows["calendarProviders"]["KR"] == "exchange_fixture"


def test_exchange_calendar_failure_falls_back_to_static_calendar():
    def unavailable_exchange_calendar(day, market):
        raise RuntimeError("calendar unavailable")

    assert is_market_open(
        dt.date(2026, 8, 17),
        "KR",
        exchange_calendar_fetcher=unavailable_exchange_calendar,
    ) is False


def test_market_titles_use_session_date_while_publication_date_stays_separate():
    windows = briefing_market_windows("2026-08-04", exchange_calendar_fetcher=lambda _day, _market: None)
    titles = briefing_expected_titles(
        "2026-08-04",
        "both",
        market_windows=windows,
        session_modes={"us": "us_close", "kr": "kr_intraday"},
    )

    assert titles == {
        "us": "US Market Briefing — 2026.08.03 마감",
        "kr": "Korea Market Briefing — 2026.08.04 장중",
    }
    item = briefing_archive_items({
        "date": "2026-08-04",
        "marketScope": "us",
        "marketWindows": windows,
        "sessionMode": "us_close",
        "markdown": "# US Market Briefing — 2026.08.04\n\nBody",
    })[0]
    assert item["title"] == "US Market Briefing — 2026.08.03 마감"
    assert item["sessionDate"] == "2026-08-03"
    assert item["publicationDate"] == "2026-08-04"


def test_kr_title_uses_latest_completed_session_before_korea_market_opens():
    windows = briefing_market_windows(
        "2026-08-04",
        exchange_calendar_fetcher=lambda _day, _market: None,
        as_of="2026-08-03T23:02:40+00:00",  # 2026-08-04 08:02:40 KST
    )

    assert windows["analysisMode"] == "weekday_kr_preopen"
    assert windows["krSessionPhase"] == "pre_open"
    assert windows["krCurrentSessionDate"] == ""
    assert windows["krLatestCompletedSessionDate"] == "2026-08-03"
    assert briefing_expected_titles(
        "2026-08-04", "kr", market_windows=windows,
    )["kr"] == "Korea Market Briefing — 2026.08.03 마감"


def test_kr_title_distinguishes_intraday_and_after_close_on_same_trading_day():
    intraday = briefing_market_windows(
        "2026-08-04",
        exchange_calendar_fetcher=lambda _day, _market: None,
        as_of="2026-08-04T01:00:00+00:00",  # 10:00 KST
    )
    closed = briefing_market_windows(
        "2026-08-04",
        exchange_calendar_fetcher=lambda _day, _market: None,
        as_of="2026-08-04T07:00:00+00:00",  # 16:00 KST
    )

    assert intraday["krSessionPhase"] == "intraday"
    assert briefing_expected_titles("2026-08-04", "kr", market_windows=intraday)["kr"] == (
        "Korea Market Briefing — 2026.08.04 장중"
    )
    assert closed["krSessionPhase"] == "closed"
    assert briefing_expected_titles("2026-08-04", "kr", market_windows=closed)["kr"] == (
        "Korea Market Briefing — 2026.08.04 마감"
    )


def test_legacy_preopen_report_is_read_as_previous_korea_close_without_rewrite():
    legacy_windows = briefing_market_windows(
        "2026-08-04", exchange_calendar_fetcher=lambda _day, _market: None,
    )
    for field in (
        "krMarketOpenOnDate", "krCurrentSessionActive", "krSessionPhase",
        "krLatestCompletedSessionDate",
    ):
        legacy_windows.pop(field, None)
    report = {
        "date": "2026-08-04",
        "generatedAt": "2026-08-03T23:02:40+00:00",
        "marketScope": "kr",
        "marketWindows": legacy_windows,
        "markdown": "# Korea Market Briefing — 2026.08.04\n\nBody",
    }

    view = briefing_scope_view(report, "kr")

    assert view["title"] == "Korea Market Briefing — 2026.08.03 마감"
    assert view["sessionDate"] == "2026-08-03"
    assert view["sessionMode"] == "kr_close"
    assert view["markdown"].startswith("# Korea Market Briefing — 2026.08.03 마감\n")
    assert report["marketWindows"]["krCurrentSessionDate"] == "2026-08-04"


def test_market_title_normalization_corrects_llm_report_date_heading():
    windows = briefing_market_windows("2026-08-04", exchange_calendar_fetcher=lambda _day, _market: None)
    markdown = "# US Market Briefing — 2026.08.04\n\n## 0. 오늘의 미국장 성격\n본문"

    normalized = normalize_briefing_markdown_titles(
        markdown,
        "2026-08-04",
        "us",
        market_windows=windows,
        session_modes={"us": "us_close"},
    )

    assert normalized.startswith("# US Market Briefing — 2026.08.03 마감\n")


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


# 생성 시각(KST 08:00 / 11:15 / 22:00)과 그때 나와야 하는 제목. 창은 생성 시각 기준으로
# phase가 매겨지므로, 같은 날짜라도 언제 만들었느냐에 따라 답이 달라져야 한다.
SESSION_TITLE_CASES = [
    ("개장 전", "2026-08-06", "2026-08-05T23:00:00Z", "2026.08.05 마감", "2026.08.05 마감"),
    ("장중", "2026-08-06", "2026-08-06T02:15:00Z", "2026.08.06 장중", "2026.08.05 마감"),
    ("마감 후", "2026-08-06", "2026-08-06T13:00:00Z", "2026.08.06 마감", "2026.08.05 마감"),
    ("지난 날짜 재생성", "2026-08-04", "2026-08-05T13:05:00Z", "2026.08.04 마감", "2026.08.03 마감"),
    ("월요일 개장 전", "2026-08-10", "2026-08-09T23:00:00Z", "2026.08.07 마감", "2026.08.07 마감"),
]


@pytest.mark.parametrize("label, date, generated_at, kr_title, us_title", SESSION_TITLE_CASES)
def test_saved_titles_follow_the_session_windows(label, date, generated_at, kr_title, us_title):
    """저장되는 제목은 생성 시각이 만든 세션 창을 따라야 한다.

    창을 넘기지 않으면 `briefing_market_metadata`가 세션일을 발행일로 떨어뜨리고, KR은
    `krSessionPhase`가 없다는 이유로 세션 모드까지 버린다. 그래서 08:00에 만든 브리핑이
    아직 열지도 않은 그날 장을 "마감"이라 했고, 장중 생성은 "장중"이 아예 나오지 않았다.
    미국장은 항상 D-1이라 발행일 폴백이 전부 하루씩 틀렸다.
    """
    from features.common.market_calendar import briefing_market_windows

    windows = briefing_market_windows(date, as_of=generated_at)
    enriched = enrich_briefing_sections(
        {"kr": {"markdown": "# KR"}, "us": {"markdown": "# US"}},
        report_date=date, report_scope="both", briefing_type="default",
        generated_at=generated_at, market_windows=windows,
    )

    assert enriched["kr"]["title"] == f"Korea Market Briefing — {kr_title}", label
    assert enriched["us"]["title"] == f"US Market Briefing — {us_title}", label


def test_both_generation_paths_hand_over_the_windows():
    """계산이 맞아도 넘기지 않으면 저장되는 제목이 그 값을 못 받는다.

    Agent 경로가 0.4.8 이후 창을 넘기지 않고 있었고, 그래서 규칙 생성과 Agent 생성이
    같은 시각에 서로 다른 제목을 저장했다.
    """
    import inspect

    from features.agent_mode import service as agent_service
    from features.daily_briefing import builder

    def enrich_call(source):
        """호출 하나만 잘라낸다. 안쪽 호출이 있으므로 괄호를 맞춰 센다."""
        start = source.index("enrich_briefing_sections(")
        depth = 0
        for offset in range(start, len(source)):
            if source[offset] == "(":
                depth += 1
            elif source[offset] == ")":
                depth -= 1
                if depth == 0:
                    return source[start:offset + 1]
        raise AssertionError("호출이 닫히지 않았다")

    for source in (inspect.getsource(builder.build_briefing), inspect.getsource(agent_service.write_briefing_from_markdown)):
        assert "market_windows=" in enrich_call(source), "창을 넘기지 않으면 세션 판정이 버려진다"


def test_the_windows_outrank_a_session_date_saved_from_the_publication_day():
    """저장된 `sessionDate`는 원래 창에서 파생된 값이다. 둘이 어긋나면 창이 맞다.

    실제로 월요일 08:03에 만든 브리핑이 `sessionDate: 2026-08-10`을 달고 저장돼,
    아직 열지도 않은 그날 장을 `2026.08.10 마감`이라고 계속 말했다. 본문 제목은
    `2026.08.07 마감`으로 맞았는데 메타데이터만 틀린 상태였다. 창을 권위로 두면
    이미 저장된 보고서도 읽을 때 제자리를 찾는다.
    """
    from features.common.market_calendar import briefing_market_windows

    windows = briefing_market_windows("2026-08-10", as_of="2026-08-09T23:03:50Z")
    report = {
        "date": "2026-08-10", "marketScope": "us", "briefingType": "default",
        "generatedAt": "2026-08-09T23:03:50Z", "marketWindows": windows,
        # 창을 못 받고 만들어져 발행일이 박힌 값
        "sessionDate": "2026-08-10",
    }

    item = briefing_market_metadata(report, "us", {"markdown": "# US Market Briefing"})

    assert item["sessionDate"] == "2026-08-07"
    assert item["title"] == "US Market Briefing — 2026.08.07 마감"


def test_a_report_without_windows_keeps_its_saved_session_date():
    """창이 없는 옛 보고서까지 발행일로 되돌리면 맞던 것이 틀어진다."""
    report = {
        "date": "2026-06-22", "marketScope": "us", "briefingType": "default",
        "generatedAt": "2026-06-22T08:00:00+09:00",
    }

    item = briefing_market_metadata(report, "us", {"markdown": "# US", "marketSessionDate": "2026-06-19"})

    assert item["sessionDate"] == "2026-06-19"


@pytest.mark.parametrize("label, date, generated_at, kr_title, us_title", SESSION_TITLE_CASES)
def test_the_rule_path_and_the_agent_path_agree(label, date, generated_at, kr_title, us_title):
    """규칙 생성은 섹션에 `marketSessionDate`를 실어 보내고 Agent 생성은 markdown만 보낸다.
    두 경로가 같은 시각에 다른 제목을 저장하면 안 된다."""
    from features.common.market_calendar import briefing_market_windows
    from features.daily_briefing.builder import _scope_session_date
    from features.daily_briefing.service import session_modes_from_windows

    windows = briefing_market_windows(date, as_of=generated_at)
    modes = session_modes_from_windows(windows)
    common = dict(
        report_date=date, report_scope="both", briefing_type="default",
        generated_at=generated_at, market_windows=windows,
    )
    agent = enrich_briefing_sections({"kr": {"markdown": "# a"}, "us": {"markdown": "# b"}}, **common)
    rules = enrich_briefing_sections({
        scope: {
            "markdown": "# x",
            "marketSessionDate": _scope_session_date(scope, windows),
            "sessionMode": modes.get(scope, ""),
        }
        for scope in ("kr", "us")
    }, **common)

    for scope, expected in (("kr", kr_title), ("us", us_title)):
        assert agent[scope]["title"].endswith(expected), f"{label} agent {scope}"
        assert rules[scope]["title"] == agent[scope]["title"], f"{label} {scope}"
