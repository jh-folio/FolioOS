"""Step 1 scope-aware briefing builder tests."""

import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.daily_briefing import builder


def _doc(doc_id, title, source, date, market):
    return {
        "id": doc_id,
        "title": title,
        "summary": title,
        "content": (title + " ") * 80,
        "source": source,
        "sourceWeight": 9,
        "date": date,
        "path": f"research-inbox/rss/{doc_id}.md",
        "url": f"https://example.test/{doc_id}",
        "type": "rss",
        "companies": [{"name": doc_id, "ticker": doc_id.upper(), "market": market}],
        "sectors": ["Semiconductors"],
        "impactTags": ["금리" if market == "US" else "수급"],
        "marketRelevance": 70,
        "wordCount": 300,
        "collectionStatus": "summary_only",
    }


DOCS = [
    _doc("us-fed", "Fed rate decision moves Nasdaq and Treasury yields", "Reuters", "2026-06-09", "US"),
    _doc("us-wsj", "Federal Reserve pause lifts Nasdaq", "WSJ", "2026-06-09", "US"),
    _doc("kr-flow", "코스피 외국인 순매수와 반도체 강세", "연합인포맥스", "2026-06-10", "KR"),
    _doc("kr-yna", "한국 증시 외국인 수급 개선", "연합뉴스", "2026-06-10", "KR"),
]


def _visuals(_date, scope, _results, **_kwargs):
    markets = ["US", "KR"] if scope == "both" else [scope.upper()]
    snapshots = [{
        "id": f"visual-{market.lower()}", "type": "price_series", "market": market,
        "marketSessionDate": "2026-06-10", "asOf": "2026-06-10", "provider": "fixture",
        "freshness": "close_snapshot", "coverage": {"status": "complete"},
    } for market in markets]
    return {
        "visualRecommendations": [{"id": f"recommendation-{market.lower()}", "market": market} for market in markets],
        "visualSnapshots": snapshots,
        "sidecar": {"date": "2026-06-10", "snapshots": {}},
        "warnings": [],
    }


def _build(scope):
    with (
        patch.object(builder, "build_index", return_value={}),
        patch.object(builder, "load_index", return_value={"documents": DOCS}),
        patch.object(builder, "cached_market_snapshot", return_value={"ok": False, "error": "fixture"}),
        patch.object(builder, "cached_korea_market_data", return_value={"ok": False, "provider": "fixture", "warnings": []}),
        patch.object(builder, "list_briefing_memories", return_value=[]),
        patch.object(builder, "load_prev_briefing", return_value=None),
        patch.object(builder, "collect_briefing_visuals", side_effect=_visuals),
        patch.object(builder, "apply_quality_loop", side_effect=lambda _kind, artifact, **_kwargs: artifact),
    ):
        return builder.build_briefing(
            "2026-06-10",
            strict_date=True,
            llm_override=False,
            persist=False,
            market_scope=scope,
        )


def test_us_scope_is_complete_and_does_not_render_korea_report():
    report = _build("us")
    assert report["marketScope"] == "us"
    assert set(report["briefings"]) == {"us"}
    assert "# US Market Briefing" in report["markdown"]
    assert "# Korea Market Briefing" not in report["markdown"]
    assert report["briefings"]["us"]["sessionMode"] == "us_close"
    assert all(item["market"] == "US" for item in report["issueCoverage"])


def test_kr_scope_is_complete_and_does_not_render_us_report():
    report = _build("kr")
    assert report["marketScope"] == "kr"
    assert set(report["briefings"]) == {"kr"}
    assert "# Korea Market Briefing" in report["markdown"]
    assert "# US Market Briefing" not in report["markdown"]
    assert report["briefings"]["kr"]["sessionMode"] == "kr_intraday"
    assert all(item["market"] == "KR" for item in report["issueCoverage"])


def test_both_scope_stores_two_complete_reports_and_structured_fields():
    report = _build("both")
    assert report["marketScope"] == "both"
    assert {"us", "kr"} <= set(report["briefings"])
    assert "# US Market Briefing" in report["markdown"]
    assert "# Korea Market Briefing" in report["markdown"]
    assert isinstance(report["issueCoverage"], list) and report["issueCoverage"]
    assert {row["market"] for row in report["visualRecommendations"]} == {"US", "KR"}
    assert {row["market"] for row in report["visualSnapshots"]} == {"US", "KR"}
    assert all("docs" not in issue and "representativeDocs" not in issue for issue in report["issueCoverage"])
    for scope in ("us", "kr"):
        section = report["briefings"][scope]
        assert section["marketScope"] == scope
        assert section["briefingType"] == "default"
        assert section["generatedAt"] == report["generatedAt"]
        assert section["sessionDate"] == section["marketSessionDate"]
        assert section["title"] and section["summary"]
        assert len(section["tags"]) == 2


def test_builder_passes_briefing_type_to_every_generation_path():
    with (
        patch.object(builder, "build_index", return_value={}),
        patch.object(builder, "load_index", return_value={"documents": DOCS}),
        patch.object(builder, "cached_market_snapshot", return_value={"ok": False, "error": "fixture"}),
        patch.object(builder, "cached_korea_market_data", return_value={"ok": False, "provider": "fixture", "warnings": []}),
        patch.object(builder, "list_briefing_memories", return_value=[]),
        patch.object(builder, "load_prev_briefing", return_value=None),
        patch.object(builder, "generate_llm_briefing", return_value=(None, "disabled")) as generate,
        patch.object(builder, "build_prompt_markdown", return_value="# US Market Briefing") as fallback,
        patch.object(builder, "collect_briefing_visuals", side_effect=_visuals),
        patch.object(builder, "apply_quality_loop", side_effect=lambda _kind, artifact, **_kwargs: artifact),
    ):
        report = builder.build_briefing(
            "2026-06-10",
            strict_date=True,
            llm_override=False,
            persist=False,
            market_scope="us",
            briefing_type="concise",
        )

    assert generate.call_args.kwargs["briefing_type"] == "concise"
    assert fallback.call_args.kwargs["briefing_type"] == "concise"
    assert report["briefingType"] == "concise"


def test_builder_collects_company_charts_from_final_markdown_leaders():
    leaders = {"us": [{"ticker": "NVDA", "ordinal": 1}], "kr": [], "warnings": []}
    with (
        patch.object(builder, "build_index", return_value={}),
        patch.object(builder, "load_index", return_value={"documents": DOCS}),
        patch.object(builder, "cached_market_snapshot", return_value={"ok": False, "error": "fixture"}),
        patch.object(builder, "cached_korea_market_data", return_value={"ok": False, "provider": "fixture", "warnings": []}),
        patch.object(builder, "list_briefing_memories", return_value=[]),
        patch.object(builder, "load_prev_briefing", return_value=None),
        patch.object(builder, "leading_company_subjects_from_markdown", return_value=leaders) as parse_leaders,
        patch.object(builder, "collect_briefing_visuals", side_effect=_visuals) as collect,
        patch.object(builder, "apply_quality_loop", side_effect=lambda _kind, artifact, **_kwargs: artifact),
    ):
        report = builder.build_briefing(
            "2026-06-10", strict_date=True, llm_override=False,
            persist=False, market_scope="us",
        )
    parse_leaders.assert_called_once_with(report["markdown"])
    assert collect.call_args.kwargs["leader_subjects"] is leaders


def test_partial_scope_merge_preserves_other_market_and_marks_overlay_stale():
    existing = {
        "markdown": "old combined",
        "briefings": {"kr": {"markdown": "old kr"}, "us": {"markdown": "old us"}},
        "visualSnapshots": [{"id": "old-us", "market": "US"}, {"id": "old-kr", "market": "KR"}],
        "personalOverlay": {"enabled": True, "stale": False},
    }
    fresh = {
        "markdown": "new us", "briefings": {"us": {"markdown": "new us"}},
        "visualSnapshots": [{"id": "new-us", "market": "US"}],
    }
    merged = builder._merge_with_existing(fresh, existing, "us")
    assert merged["briefings"]["kr"]["markdown"] == "old kr"
    assert merged["briefings"]["us"]["markdown"] == "new us"
    assert {row["id"] for row in merged["visualSnapshots"]} == {"new-us", "old-kr"}
    assert merged["personalOverlay"]["stale"] is True


def test_partial_scope_merge_keeps_single_market_markdown_on_regeneration():
    existing = {
        "marketScope": "us",
        "markdown": "# US Market Briefing\n\nold us",
        "briefings": {},
        "visualSnapshots": [{"id": "old-us", "market": "US"}],
    }
    fresh = {
        "marketScope": "us",
        "markdown": "# US Market Briefing\n\nnew us",
        "briefings": {},
        "visualSnapshots": [{"id": "new-us", "market": "US"}],
    }

    merged = builder._merge_with_existing(fresh, existing, "us")

    assert "new us" in merged["markdown"]
    assert merged["briefings"] == {}
    assert [row["id"] for row in merged["visualSnapshots"]] == ["new-us"]


def test_persisted_us_generation_returns_us_view_while_storage_preserves_kr():
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        builder.write_json(root / "2026-06-10.json", {
            "date": "2026-06-10", "marketScope": "both", "markdown": "old combined",
            "briefings": {"kr": {"markdown": "# Korea Market Briefing\n\nOLD KR"}},
        })
        with (
            patch.object(builder, "BRIEFINGS_DIR", root),
            patch.object(builder, "build_index", return_value={}),
            patch.object(builder, "load_index", return_value={"documents": DOCS}),
            patch.object(builder, "cached_market_snapshot", return_value={"ok": False, "error": "fixture"}),
            patch.object(builder, "cached_korea_market_data", return_value={"ok": False, "provider": "fixture", "warnings": []}),
            patch.object(builder, "list_briefing_memories", return_value=[]),
            patch.object(builder, "load_prev_briefing", return_value=None),
            patch.object(builder, "collect_briefing_visuals", side_effect=_visuals),
            patch.object(builder, "apply_quality_loop", side_effect=lambda _kind, artifact, **_kwargs: artifact),
        ):
            response = builder.build_briefing(
                "2026-06-10", strict_date=True, llm_override=False,
                persist=True, market_scope="us",
            )
        legacy = builder.read_json(root / "2026-06-10.json", {})
        saved_us = builder.read_json(root / "2026-06-10.us.json", {})
        assert "# Korea Market Briefing" in legacy["briefings"]["kr"]["markdown"]
        assert "# US Market Briefing" in saved_us["markdown"]
        assert "# Korea Market Briefing" not in saved_us["markdown"]
        assert "# US Market Briefing" in response["markdown"]
        assert "# Korea Market Briefing" not in response["markdown"]
        assert response["marketScope"] == "us"


def test_persisted_visual_sidecar_uses_gzip_filename():
    visual_payload = _visuals("2026-06-10", "us", {})
    visual_payload["sidecar"]["snapshots"] = {"heatmap": {"market": "US"}}
    with TemporaryDirectory() as tmp:
        with (
            patch.object(builder, "BRIEFINGS_DIR", Path(tmp)),
            patch.object(builder, "build_index", return_value={}),
            patch.object(builder, "load_index", return_value={"documents": DOCS}),
            patch.object(builder, "cached_market_snapshot", return_value={"ok": False, "error": "fixture"}),
            patch.object(builder, "cached_korea_market_data", return_value={"ok": False, "provider": "fixture", "warnings": []}),
            patch.object(builder, "list_briefing_memories", return_value=[]),
            patch.object(builder, "load_prev_briefing", return_value=None),
            patch.object(builder, "collect_briefing_visuals", return_value=visual_payload),
            patch.object(builder, "write_visual_sidecar") as write_sidecar,
            patch.object(builder, "apply_quality_loop", side_effect=lambda _kind, artifact, **_kwargs: artifact),
        ):
            builder.build_briefing(
                "2026-06-10",
                strict_date=True,
                llm_override=False,
                persist=True,
                market_scope="us",
            )

    assert write_sidecar.call_args.args[0].name == "2026-06-10.us.visuals.json.gz"


def _run_all():
    tests = [value for name, value in sorted(globals().items()) if name.startswith("test_") and callable(value)]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"\n{len(tests)}/{len(tests)} tests passed")
    return True


if __name__ == "__main__":
    sys.exit(0 if _run_all() else 1)
