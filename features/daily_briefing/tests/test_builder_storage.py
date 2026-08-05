import json
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.daily_briefing import builder


def _scope_result(scope):
    market = scope.upper()
    return {
        "markdown": f"# {'US' if scope == 'us' else 'Korea'} Market Briefing\n\n{scope} body",
        "sessionMode": f"{scope}_close",
        "marketSessionDate": "2026-06-19",
        "sources": [],
        "generation": {"mode": "rules", "status": "ok", "provider": "fixture"},
        "status": "ok",
        "headlines": [],
        "groups": [],
        "issueCoverageRaw": [],
        "issueCoverage": [],
        "marketDrivers": [{"market": scope, "driver": f"{scope} driver", "score": 1, "docs": []}],
        "documents": [],
    }


def _build_patches(visuals):
    return [
        patch.object(builder, "build_index"),
        patch.object(builder, "load_index", return_value={"documents": []}),
        patch.object(builder, "select_briefing_docs", return_value=([], "2026-06-19", {"sourceDates": ["2026-06-19"]})),
        patch.object(builder, "cached_market_snapshot", return_value={"ok": True}),
        patch.object(builder, "cached_korea_market_data", return_value={"ok": True}),
        patch.object(builder, "build_market_tape", return_value={}),
        patch.object(builder, "preflight_from_context", return_value={}),
        patch.object(builder, "list_briefing_memories", return_value=[]),
        patch.object(builder, "load_prev_briefing", return_value=None),
        patch.object(builder, "_scope_result", side_effect=lambda scope, *args, **kwargs: _scope_result(scope)),
        patch.object(builder, "leading_company_subjects_from_markdown", return_value=[]),
        patch.object(builder, "collect_briefing_visuals", return_value=visuals),
        patch.object(builder, "session_doc_counts", return_value={}),
        patch.object(builder, "checkpoints_from_markdown", return_value=[]),
        patch.object(builder, "data_gaps_from_messages", return_value=[]),
        patch.object(builder, "read_briefing_prompt", return_value="prompt"),
        patch.object(builder, "apply_quality_loop", side_effect=lambda kind, payload, **kwargs: payload),
        patch.object(builder, "build_memory_from_briefing", return_value=[]),
    ]


def test_single_market_briefing_tags_generation_scope():
    combined = {
        "marketScope": "both",
        "markdown": "# US Market Briefing\n\nbody\n\n---\n\n# Korea Market Briefing\n\nbody",
        "briefings": {
            "us": {"markdown": "# US Market Briefing\n\nbody"},
            "kr": {"markdown": "# Korea Market Briefing\n\nbody"},
        },
    }
    us = builder._single_market_briefing(combined, "us")
    assert us["marketScope"] == "us"
    assert us.get("generationScope") == "both"

    single = {"marketScope": "us", "markdown": "# US Market Briefing\n\nbody"}
    solo = builder._single_market_briefing(single, "us")
    assert solo.get("generationScope") == "us"


def test_build_briefing_persists_per_market_reports_and_sidecars():
    sidecar = {
        "date": "2026-06-20",
        "snapshots": {
            "us-heat": {"id": "us-heat", "market": "US", "rows": [{"ticker": "NVDA", "marketCap": 1}]},
            "kr-heat": {"id": "kr-heat", "market": "KR", "rows": [{"ticker": "005930", "marketCap": 1}]},
        },
    }
    visuals = {
        "visualRecommendations": [
            {"id": "us-rec", "snapshotId": "us-heat", "market": "US"},
            {"id": "kr-rec", "snapshotId": "kr-heat", "market": "KR"},
        ],
        "visualSnapshots": [
            {"id": "us-heat", "type": "market_heatmap", "market": "US"},
            {"id": "kr-heat", "type": "market_heatmap", "market": "KR"},
        ],
        "sidecar": sidecar,
        "warnings": [],
    }
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        patches = [patch.object(builder, "BRIEFINGS_DIR", root), *_build_patches(visuals)]
        for item in patches:
            item.start()
        try:
            result = builder.build_briefing("2026-06-20", persist=True, market_scope="both", llm_override=False)
        finally:
            for item in reversed(patches):
                item.stop()

        assert result["marketScope"] == "both"
        assert (root / "2026-06-20.us.json").exists()
        assert (root / "2026-06-20.kr.json").exists()
        assert not (root / "2026-06-20.json").exists()

        us = json.loads((root / "2026-06-20.us.json").read_text(encoding="utf-8"))
        kr = json.loads((root / "2026-06-20.kr.json").read_text(encoding="utf-8"))
        assert us["marketScope"] == "us" and "us body" in us["markdown"]
        assert kr["marketScope"] == "kr" and "kr body" in kr["markdown"]
        assert [row["market"] for row in us["visualSnapshots"]] == ["US"]
        assert [row["market"] for row in kr["visualSnapshots"]] == ["KR"]
        assert (root / "2026-06-20.us.visuals.json.gz").exists()
        assert (root / "2026-06-20.kr.visuals.json.gz").exists()

        # 연결 분석은 제거됐다. 통합 생성이 더 이상 사이드카를 만들지 않는다.
        assert not (root / "2026-06-20.link.json").exists()


def test_single_market_regeneration_preserves_sibling_and_marks_overlay_stale():
    date = "2026-06-21"
    visuals = {
        "visualRecommendations": [{"id": "us-rec", "snapshotId": "us-heat", "market": "US"}],
        "visualSnapshots": [{"id": "us-heat", "type": "market_heatmap", "market": "US"}],
        "sidecar": {
            "date": date,
            "snapshots": {
                "us-heat": {"id": "us-heat", "market": "US", "rows": [{"ticker": "NVDA"}]},
            },
        },
        "warnings": [],
    }
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        us_path = root / f"{date}.us.json"
        kr_path = root / f"{date}.kr.json"
        us_path.write_text(json.dumps({
            "date": date,
            "marketScope": "us",
            "markdown": "old us",
            "personalOverlay": {"enabled": True, "stale": False},
        }), encoding="utf-8")
        kr_path.write_text(json.dumps({
            "date": date,
            "marketScope": "kr",
            "markdown": "old kr sibling",
        }), encoding="utf-8")
        sibling_before = kr_path.read_bytes()

        patches = [patch.object(builder, "BRIEFINGS_DIR", root), *_build_patches(visuals)]
        for item in patches:
            item.start()
        try:
            result = builder.build_briefing(date, persist=True, market_scope="us", llm_override=False)
        finally:
            for item in reversed(patches):
                item.stop()

        saved = json.loads(us_path.read_text(encoding="utf-8"))
        assert result["marketScope"] == "us"
        assert saved["markdown"].startswith("# US Market Briefing")
        assert saved["personalOverlay"]["stale"] is True
        assert kr_path.read_bytes() == sibling_before
        assert not (root / f"{date}.kr.visuals.json.gz").exists()


def test_projection_follows_the_report_store_not_the_real_data_dir(tmp_path):
    """테스트 픽스처가 사용자 DB에 변화 이벤트를 남기면 대시보드에 가짜 알림이 뜬다."""
    from features.common.change_intelligence.service import projection_db_for_report
    from features.daily_briefing import builder

    default_db = builder.MARKET_MEMORY_DB_PATH
    # 임시 저장소로 커밋하면 projection도 그 안에 머문다.
    temp_report = tmp_path / "briefings" / "2026-06-10.us.json"
    assert projection_db_for_report(temp_report, default_db) == tmp_path / default_db.name
    # 실제 경로에서는 기존 DB를 그대로 쓴다.
    real_report = builder.BRIEFINGS_DIR / "2026-08-01.us.json"
    assert projection_db_for_report(real_report, default_db) == default_db
