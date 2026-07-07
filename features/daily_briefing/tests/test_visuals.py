import copy
import datetime as dt
import json
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.daily_briefing.schema import visual_recommendation_errors, visual_snapshot_errors
from features.daily_briefing.visuals import (
    _market_clock,
    collect_briefing_visuals,
    leading_company_subjects_from_markdown,
    load_current_visuals,
    load_visual_sidecar,
    merge_visual_sidecar,
    replace_leading_company_visuals,
    write_visual_sidecar,
)


def _bars(symbol, start, end):
    base = 100.0 + len(symbol)
    return [
        {"time": "2026-06-15", "open": base, "high": base + 2, "low": base - 1, "close": base + 1, "volume": 1000.0},
        {"time": "2026-06-16", "open": base + 1, "high": base + 3, "low": base, "close": base + 2, "volume": 1200.0},
        {"time": "2026-06-17", "open": base + 2, "high": base + 4, "low": base + 1, "close": base + 3, "volume": 1400.0},
        {"time": "2026-06-18", "open": base + 3, "high": base + 5, "low": base + 2, "close": base + 4, "volume": 1600.0},
        {"time": "2026-06-19", "open": base + 4, "high": base + 6, "low": base + 3, "close": base + 5, "volume": 1800.0},
    ]


def _scope_results():
    return {
        "us": {
            "marketSessionDate": "2026-06-18",
            "groups": [{"sector": "Semiconductors", "docs": [{"companies": [{"ticker": "NVDA", "name": "NVIDIA", "market": "US", "sector": "Semiconductors"}]}]}],
        },
        "kr": {
            "marketSessionDate": "2026-06-19",
            "groups": [{"sector": "Semiconductors", "docs": [{"companies": [{"ticker": "005930", "name": "Samsung Electronics", "market": "KR", "sector": "Semiconductors"}]}]}],
        },
    }


def _price_history(symbol, session_date):
    rows = [row for row in _bars(symbol, "", "") if row["time"] <= session_date]
    return {
        "provider": "toss_open_api",
        "sourceByInterval": {"intraday": "toss_open_api", "daily": "toss_open_api"},
        "intraday": {"interval": "5m", "points": []},
        "daily": {"interval": "1d", "points": rows},
    }


def _heatmap_payload(market, session_date):
    ticker = "NVDA" if market == "US" else "005930"
    return {
        "market": market,
        "asOf": session_date,
        "provider": "fixture",
        "freshness": "close_snapshot",
        "coverage": {"requested": 1, "returned": 1, "ratio": 1.0, "status": "complete"},
        "rows": [{
            "ticker": ticker,
            "label": ticker,
            "sector": "Semiconductors",
            "industry": "Semiconductors",
            "close": 100,
            "changePct": 1.0,
            "marketCap": 1_000_000,
            "asOf": session_date,
        }],
        "warnings": [],
    }


def _heatmap_fetchers():
    return {
        "us": lambda date: _heatmap_payload("US", date),
        "kr": lambda date: _heatmap_payload("KR", date),
    }


def test_leading_company_subjects_follow_final_markdown_headings():
    markdown = """
## 3. 미국장을 주도한 기업 ① - NVIDIA
## 4. 미국장을 주도한 기업 ② — Alphabet
## 3. 한국장을 주도한 기업 ① - SK하이닉스
## 4. 한국장을 주도한 기업 ② — Samsung Electronics
"""
    parsed = leading_company_subjects_from_markdown(markdown)
    assert [(row["ordinal"], row["ticker"]) for row in parsed["us"]] == [(1, "NVDA"), (2, "GOOGL")]
    assert [(row["ordinal"], row["ticker"]) for row in parsed["kr"]] == [(1, "000660"), (2, "005930")]
    assert parsed["warnings"] == []


def test_leading_company_subjects_infer_market_from_generic_headings():
    markdown = """
## 3. 시장을 주도한 기업 ① — SK하이닉스
## 4. 시장을 주도한 기업 ② — 삼성전자
"""
    parsed = leading_company_subjects_from_markdown(markdown)

    assert parsed["us"] == []
    assert [(row["ordinal"], row["ticker"]) for row in parsed["kr"]] == [(1, "000660"), (2, "005930")]
    assert parsed["warnings"] == []


def test_unknown_leading_company_is_not_replaced_with_another_ticker():
    parsed = leading_company_subjects_from_markdown(
        "## 3. 미국장을 주도한 기업 ① — Completely Unknown Holdings"
    )
    assert parsed["us"] == []
    assert parsed["warnings"]


def test_explicit_markdown_leaders_override_group_candidate_charts():
    parsed = leading_company_subjects_from_markdown("""
## 3. 미국장을 주도한 기업 ① — Alphabet
## 4. 미국장을 주도한 기업 ② — Microsoft
""")
    result = collect_briefing_visuals(
        "2026-06-19", "us", _scope_results(),
        price_history_fetcher=_price_history,
        heatmap_fetchers=_heatmap_fetchers(),
        leader_subjects=parsed,
    )
    leaders = [
        row for row in result["visualSnapshots"]
        if row.get("role") == "leading_company"
    ]
    assert [row["subject"]["ticker"] for row in leaders] == ["GOOGL", "MSFT"]
    recommendations = [
        row for row in result["visualRecommendations"]
        if row.get("role") == "leading_company"
    ]
    assert [row["placement"]["ordinal"] for row in recommendations] == [1, 2]


def test_price_series_snapshot_uses_actual_history_provider():
    result = collect_briefing_visuals(
        "2026-06-19", "kr", _scope_results(),
        price_history_fetcher=_price_history,
        heatmap_fetchers=_heatmap_fetchers(),
    )

    price_snapshots = [
        row for row in result["visualSnapshots"]
        if row.get("type") == "price_series"
    ]

    assert price_snapshots
    assert {row["provider"] for row in price_snapshots} == {"toss_open_api"}


def test_company_only_collection_and_replacement_remove_mismatched_candidates():
    parsed = leading_company_subjects_from_markdown(
        "## 3. 미국장을 주도한 기업 ① — NVIDIA"
    )
    aligned = collect_briefing_visuals(
        "2026-06-19", "us", _scope_results(),
        price_history_fetcher=_price_history,
        heatmap_fetchers=_heatmap_fetchers(),
        leader_subjects=parsed,
        include_market_visuals=False,
    )
    assert aligned["visualSnapshots"]
    assert all(row.get("role") == "leading_company" for row in aligned["visualSnapshots"])
    assert aligned["sidecar"]["snapshots"] == {}

    existing = {
        "visualSnapshots": [
            {"id": "indices", "role": "market_summary"},
            {"id": "old-msft", "role": "leading_company"},
        ],
        "visualRecommendations": [
            {"snapshotId": "indices", "role": "market_summary"},
            {"snapshotId": "old-msft", "role": "leading_company"},
        ],
    }
    replaced = replace_leading_company_visuals(existing, aligned)
    assert {row["id"] for row in replaced["visualSnapshots"]} == {
        "indices", "price-series:us:company:NVDA:2026-06-19",
    }
    assert all(row.get("snapshotId") != "old-msft" for row in replaced["visualRecommendations"])


def test_collect_visuals_v2_uses_exact_indices_dual_intervals_and_inline_placement():
    def price_fetcher(symbol, session_date):
        return {
            "intraday": {
                "interval": "5m",
                "points": [{
                    "time": f"{session_date}T15:55:00-04:00",
                    "open": 1, "high": 2, "low": 1, "close": 2, "volume": 10,
                }],
            },
            "daily": {
                "interval": "1d",
                "points": [{
                    "time": session_date,
                    "open": 1, "high": 2, "low": 1, "close": 2, "volume": 10,
                }],
            },
        }

    result = collect_briefing_visuals(
        "2026-06-19",
        "both",
        _scope_results(),
        price_history_fetcher=price_fetcher,
        heatmap_fetchers={
            "us": lambda date: {
                "market": "US", "asOf": date, "provider": "fixture",
                "freshness": "close_snapshot", "coverage": {"requested": 0, "returned": 0, "ratio": 0, "status": "unavailable"},
                "rows": [], "warnings": [],
            },
            "kr": lambda date: {
                "market": "KR", "asOf": date, "provider": "fixture",
                "freshness": "close_snapshot", "coverage": {"requested": 0, "returned": 0, "ratio": 0, "status": "unavailable"},
                "rows": [], "warnings": [],
            },
        },
    )

    us = next(row for row in result["visualSnapshots"] if row["id"].startswith("price-series:us:indices"))
    assert [row["ticker"] for row in us["series"]] == ["^GSPC", "^IXIC", "^DJI"]
    assert us["series"][0]["intraday"]["interval"] == "5m"
    assert us["series"][0]["daily"]["interval"] == "1d"
    market_rec = next(row for row in result["visualRecommendations"] if row["snapshotId"] == us["id"])
    assert market_rec["placement"] == {"market": "US", "sectionRole": "market_flow", "order": 1}


def test_collect_visuals_clips_future_rows_and_builds_renderer_neutral_contracts():
    result = collect_briefing_visuals(
        "2026-06-19", "both", _scope_results(),
        price_history_fetcher=_price_history,
        heatmap_fetchers=_heatmap_fetchers(),
    )
    assert result["visualSnapshots"]
    assert result["visualRecommendations"]
    assert result["sidecar"]["snapshots"]
    assert all(visual_snapshot_errors(row) == [] for row in result["visualSnapshots"])
    assert all(visual_recommendation_errors(row) == [] for row in result["visualRecommendations"])
    us_indices = next(row for row in result["visualSnapshots"] if row["id"].startswith("price-series:us:indices"))
    assert us_indices["marketSessionDate"] == "2026-06-18"
    assert max(point["time"] for series in us_indices["series"] for point in series["daily"]["points"]) == "2026-06-18"
    assert us_indices["freshness"] == "close_snapshot"


def test_heatmap_rows_live_only_in_sidecar_and_use_historical_session_values():
    result = collect_briefing_visuals(
        "2026-06-19", "kr", _scope_results(),
        price_history_fetcher=_price_history,
        heatmap_fetchers=_heatmap_fetchers(),
    )
    summary = next(row for row in result["visualSnapshots"] if row["type"] == "market_heatmap")
    assert "rows" not in summary
    assert summary["sidecarRef"]["snapshotId"] == summary["id"]
    stored = result["sidecar"]["snapshots"][summary["id"]]
    assert stored["rows"]
    assert all(row["asOf"] == "2026-06-19" for row in stored["rows"])
    assert stored["weightBasis"] == "market_cap"
    assert all(row["marketCap"] > 0 for row in stored["rows"])


def test_partial_sidecar_merge_preserves_sibling_market():
    existing = {"date": "2026-06-19", "snapshots": {"old-us": {"market": "US"}, "old-kr": {"market": "KR"}}}
    incoming = {"date": "2026-06-19", "snapshots": {"new-us": {"market": "US"}}}
    merged = merge_visual_sidecar(existing, incoming, "us")
    assert "old-us" not in merged["snapshots"]
    assert "new-us" in merged["snapshots"]
    assert "old-kr" in merged["snapshots"]

    with TemporaryDirectory() as tmp:
        path = Path(tmp) / "briefing.visuals.json"
        written = write_visual_sidecar(path, incoming, "us")
        assert path.exists()
        assert written["snapshots"]["new-us"]["market"] == "US"


def test_visual_failure_degrades_to_unavailable_without_raising():
    def broken(symbol, session_date):
        raise RuntimeError("provider offline")

    result = collect_briefing_visuals(
        "2026-06-19", "us", _scope_results(),
        price_history_fetcher=broken,
        heatmap_fetchers={"us": lambda date: (_ for _ in ()).throw(RuntimeError("provider offline"))},
    )
    assert result["visualSnapshots"]
    assert result["warnings"]
    assert all(row["freshness"] == "unavailable" for row in result["visualSnapshots"])
    assert all(row["coverage"]["status"] == "unavailable" for row in result["visualSnapshots"])


def test_load_visual_sidecar_accepts_only_dated_files():
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        write_visual_sidecar(
            root / "2026-06-19.visuals.json",
            {"date": "2026-06-19", "snapshots": {"heatmap": {"market": "US"}}},
            "both",
        )
        assert load_visual_sidecar("2026-06-19", root)["snapshots"]["heatmap"]["market"] == "US"
        assert load_visual_sidecar("../../secrets", root) is None
        assert load_visual_sidecar("2026-6-19", root) is None
        assert load_visual_sidecar("2026-06-18", root) is None


def test_load_visual_sidecar_prefers_market_file_when_scope_is_supplied():
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        legacy = {"date": "2026-06-19", "snapshots": {"heatmap": {"market": "BOTH"}}}
        us = {"date": "2026-06-19", "marketScope": "us", "snapshots": {"heatmap": {"market": "US"}}}
        write_visual_sidecar(root / "2026-06-19.visuals.json", legacy, "both")
        write_visual_sidecar(root / "2026-06-19.us.visuals.json.gz", us, "us")

        assert load_visual_sidecar("2026-06-19", root, market_scope="us")["snapshots"]["heatmap"]["market"] == "US"
        assert load_visual_sidecar("2026-06-19", root, market_scope="kr")["snapshots"]["heatmap"]["market"] == "BOTH"


def test_gzip_sidecar_is_preferred_and_legacy_json_is_readable():
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        payload = {
            "date": "2026-06-19",
            "schemaVersion": 2,
            "snapshots": {"heatmap": {"market": "US"}},
        }
        gzip_path = root / "2026-06-19.visuals.json.gz"
        write_visual_sidecar(gzip_path, payload, "both")
        assert load_visual_sidecar("2026-06-19", root) == payload

        gzip_path.unlink()
        (root / "2026-06-19.visuals.json").write_text(json.dumps(payload), encoding="utf-8")
        assert load_visual_sidecar("2026-06-19", root) == payload


def _current_bars(symbol, start, end):
    rows = _bars(symbol, start, end)
    base = rows[-1]["close"]
    rows.extend([
        {"time": "2026-06-19", "open": base, "high": base + 2, "low": base - 1, "close": base + 1, "volume": 2000.0},
        {"time": "2026-06-22", "open": base + 1, "high": base + 4, "low": base, "close": base + 3, "volume": 2400.0},
    ])
    return rows


def _current_price_history(symbol, session_date):
    return {
        "intraday": {
            "interval": "5m",
            "points": [{
                "time": f"{session_date}T15:55:00-04:00",
                "open": 109, "high": 112, "low": 108, "close": 111, "volume": 2200,
            }],
        },
        "daily": {
            "interval": "1d",
            "points": [{"time": session_date, "open": 109, "high": 112, "low": 108, "close": 111, "volume": 2200}],
        },
    }


def test_current_visuals_keep_v2_series_and_use_batch_heatmap_without_writes():
    generated = collect_briefing_visuals(
        "2026-06-19", "us", _scope_results(),
        price_history_fetcher=_price_history,
        heatmap_fetchers=_heatmap_fetchers(),
    )
    report = {
        "date": "2026-06-19",
        "markdown": "# immutable canonical",
        "visualRecommendations": generated["visualRecommendations"],
        "visualSnapshots": generated["visualSnapshots"],
    }
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        report_path = root / "2026-06-19.json"
        sidecar_path = root / "2026-06-19.visuals.json.gz"
        report_path.write_text(json.dumps(report), encoding="utf-8")
        write_visual_sidecar(sidecar_path, generated["sidecar"], "both")
        report_bytes = report_path.read_bytes()
        sidecar_bytes = sidecar_path.read_bytes()

        payload = load_current_visuals(
            "2026-06-19",
            root,
            price_history_fetcher=_current_price_history,
            heatmap_fetchers={"us": lambda date: _heatmap_payload("US", date)},
            now=dt.datetime(2026, 6, 22, 22, 30, tzinfo=dt.timezone.utc),
        )

        price = next(row for row in payload["visualSnapshots"] if row["type"] == "price_series")
        heatmap = next(row for row in payload["visualSnapshots"] if row["type"] == "market_heatmap")
        assert price["series"][0]["intraday"]["interval"] == "5m"
        assert price["series"][0]["daily"]["points"][-1]["close"] == 111
        assert heatmap["weightBasis"] == "market_cap"
        assert report_path.read_bytes() == report_bytes
        assert sidecar_path.read_bytes() == sidecar_bytes


def test_current_visuals_can_filter_one_saved_snapshot():
    generated = collect_briefing_visuals(
        "2026-06-19", "us", _scope_results(),
        price_history_fetcher=_price_history,
        heatmap_fetchers=_heatmap_fetchers(),
    )
    snapshot_id = next(
        row["id"] for row in generated["visualSnapshots"]
        if row["type"] == "price_series" and row["role"] == "market_summary"
    )
    report = {
        "date": "2026-06-19", "markdown": "# immutable",
        "visualRecommendations": generated["visualRecommendations"],
        "visualSnapshots": generated["visualSnapshots"],
    }
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        (root / "2026-06-19.json").write_text(json.dumps(report), encoding="utf-8")
        write_visual_sidecar(root / "2026-06-19.visuals.json.gz", generated["sidecar"], "both")
        payload = load_current_visuals(
            "2026-06-19", root,
            market="US", snapshot_id=snapshot_id,
            price_history_fetcher=_current_price_history,
            heatmap_fetchers={"us": lambda date: _heatmap_payload("US", date)},
            now=dt.datetime(2026, 6, 22, 22, 30, tzinfo=dt.timezone.utc),
        )

    assert [row["id"] for row in payload["visualSnapshots"]] == [snapshot_id]
    assert [row["snapshotId"] for row in payload["visualRecommendations"]] == [snapshot_id]


def test_current_visuals_reads_per_market_report_and_sidecar():
    generated = collect_briefing_visuals(
        "2026-06-19", "us", _scope_results(),
        price_history_fetcher=_price_history,
        heatmap_fetchers=_heatmap_fetchers(),
    )
    report = {
        "date": "2026-06-19",
        "marketScope": "us",
        "markdown": "# US Market Briefing\n\nimmutable",
        "visualRecommendations": generated["visualRecommendations"],
        "visualSnapshots": generated["visualSnapshots"],
    }
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        (root / "2026-06-19.us.json").write_text(json.dumps(report), encoding="utf-8")
        write_visual_sidecar(root / "2026-06-19.us.visuals.json.gz", generated["sidecar"], "us")
        payload = load_current_visuals(
            "2026-06-19", root,
            market="US",
            price_history_fetcher=_current_price_history,
            heatmap_fetchers={"us": lambda date: _heatmap_payload("US", date)},
            now=dt.datetime(2026, 6, 22, 22, 30, tzinfo=dt.timezone.utc),
        )

    assert payload["sourceReportDate"] == "2026-06-19"
    assert {row["market"] for row in payload["visualSnapshots"]} == {"US"}


def test_current_visuals_use_saved_universe_without_mutating_canonical_files():
    generated = collect_briefing_visuals(
        "2026-06-19", "us", _scope_results(),
        price_history_fetcher=_price_history,
        heatmap_fetchers=_heatmap_fetchers(),
    )
    report = {
        "date": "2026-06-19",
        "markdown": "# immutable canonical",
        "visualRecommendations": generated["visualRecommendations"],
        "visualSnapshots": generated["visualSnapshots"],
    }
    original_report = copy.deepcopy(report)
    original_sidecar = copy.deepcopy(generated["sidecar"])

    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        (root / "2026-06-19.json").write_text(json.dumps(report), encoding="utf-8")
        (root / "2026-06-19.visuals.json").write_text(json.dumps(generated["sidecar"]), encoding="utf-8")
        report_bytes = (root / "2026-06-19.json").read_bytes()
        sidecar_bytes = (root / "2026-06-19.visuals.json").read_bytes()

        payload = load_current_visuals(
            "2026-06-19",
            root,
            history_fetcher=_current_bars,
            now=dt.datetime(2026, 6, 22, 22, 30, tzinfo=dt.timezone.utc),
        )

        assert payload["mode"] == "current"
        assert payload["sourceReportDate"] == "2026-06-19"
        assert payload["provider"] == "yfinance"
        assert payload["marketStatus"]["US"]["state"] == "closed"
        current_index = next(row for row in payload["visualSnapshots"] if row["role"] == "market_summary" and row["type"] == "price_series")
        assert current_index["asOf"] == "2026-06-22"
        assert current_index["freshness"] == "snapshot"
        assert current_index["mode"] == "current"
        assert payload["comparisons"][current_index["id"]]["priceChanges"]
        current_heatmap = next(row for row in payload["visualSnapshots"] if row["type"] == "market_heatmap")
        assert current_heatmap["rows"]
        assert payload["comparisons"][current_heatmap["id"]]["sectorRankChanges"]
        assert report == original_report
        assert generated["sidecar"] == original_sidecar
        assert (root / "2026-06-19.json").read_bytes() == report_bytes
        assert (root / "2026-06-19.visuals.json").read_bytes() == sidecar_bytes


def test_current_visuals_report_unavailable_without_replacing_saved_snapshot():
    generated = collect_briefing_visuals(
        "2026-06-19", "us", _scope_results(),
        price_history_fetcher=_price_history,
        heatmap_fetchers=_heatmap_fetchers(),
    )
    report = {
        "date": "2026-06-19",
        "markdown": "# immutable canonical",
        "visualRecommendations": generated["visualRecommendations"],
        "visualSnapshots": generated["visualSnapshots"],
    }
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        (root / "2026-06-19.json").write_text(json.dumps(report), encoding="utf-8")
        (root / "2026-06-19.visuals.json").write_text(json.dumps(generated["sidecar"]), encoding="utf-8")
        payload = load_current_visuals(
            "2026-06-19",
            root,
            history_fetcher=lambda *_: [],
            now=dt.datetime(2026, 6, 22, 15, 0, tzinfo=dt.timezone.utc),
        )
        assert payload["status"] == "unavailable"
        assert payload["warnings"]
        assert all(row["freshness"] == "unavailable" for row in payload["visualSnapshots"])
        assert report["visualSnapshots"] == generated["visualSnapshots"]


def test_current_market_clock_uses_previous_completed_session_before_open():
    clock = _market_clock(
        "US",
        dt.datetime(2026, 6, 22, 12, 0, tzinfo=dt.timezone.utc),
    )
    assert clock["state"] == "closed"
    assert clock["reason"] == "before_regular_session"
    assert clock["latestSessionDate"] == "2026-06-18"
