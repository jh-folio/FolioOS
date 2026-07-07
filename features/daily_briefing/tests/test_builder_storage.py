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
        patches = [
            patch.object(builder, "BRIEFINGS_DIR", root),
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
            patch.object(builder, "derive_link_status", return_value="insufficient_evidence"),
            patch.object(builder, "leading_company_subjects_from_markdown", return_value=[]),
            patch.object(builder, "collect_briefing_visuals", return_value=visuals),
            patch.object(builder, "session_doc_counts", return_value={}),
            patch.object(builder, "checkpoints_from_markdown", return_value=[]),
            patch.object(builder, "data_gaps_from_messages", return_value=[]),
            patch.object(builder, "read_briefing_prompt", return_value="prompt"),
            patch.object(builder, "apply_quality_loop", side_effect=lambda kind, payload, **kwargs: payload),
            patch.object(builder, "build_memory_from_briefing", return_value=[]),
        ]
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

        # 종합(both) generation writes a separate cross-market link analysis sidecar.
        assert (root / "2026-06-20.link.json").exists()
        link = json.loads((root / "2026-06-20.link.json").read_text(encoding="utf-8"))
        assert link["markdown"].lstrip().startswith("## 한미 시장 연결 분석")
        assert link["date"] == "2026-06-20"
