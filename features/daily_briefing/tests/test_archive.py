import json
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.daily_briefing.archive import BriefingArchiveIndex


def _write_report(path, date, us_text="semiconductor", kr_text="kr-only-term", report_scope="both", briefing_type="market_focused"):
    path.write_text(json.dumps({
        "date": date, "marketScope": report_scope, "briefingType": briefing_type,
        "generatedAt": f"{date}T08:00:00+09:00",
        "briefings": {
            "us": {"markdown": f"# US Market Briefing\n\n{us_text}", "marketSessionDate": date},
            "kr": {"markdown": f"# Korea Market Briefing\n\n{kr_text}", "marketSessionDate": date},
        },
    }, ensure_ascii=False), encoding="utf-8")


def _write_single_market_report(path, date, market_scope, text, briefing_type="market_focused"):
    path.write_text(json.dumps({
        "date": date,
        "marketScope": market_scope,
        "briefingType": briefing_type,
        "generatedAt": f"{date}T08:00:00+09:00",
        "markdown": f"# {'US' if market_scope == 'us' else 'Korea'} Market Briefing\n\n{text}",
    }, ensure_ascii=False), encoding="utf-8")


def _write_combined_market_report(path, date, market_scope, text, briefing_type="market_focused"):
    # A 종합(both) generation tags each per-market file with generationScope="both".
    path.write_text(json.dumps({
        "date": date,
        "marketScope": market_scope,
        "generationScope": "both",
        "briefingType": briefing_type,
        "generatedAt": f"{date}T08:00:00+09:00",
        "markdown": f"# {'US' if market_scope == 'us' else 'Korea'} Market Briefing\n\n{text}",
    }, ensure_ascii=False), encoding="utf-8")


def test_combined_generation_collapses_to_single_both_card():
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write_combined_market_report(root / "2026-06-22.us.json", "2026-06-22", "us", "combo-us")
        _write_combined_market_report(root / "2026-06-22.kr.json", "2026-06-22", "kr", "combo-kr")
        payload = BriefingArchiveIndex(root, ttl_seconds=0).query()
        assert payload["total"] == 1
        item = payload["items"][0]
        assert item["marketScope"] == "both"
        assert item["reportScope"] == "both"
        assert item["reportDate"] == "2026-06-22"
        assert item["id"] == "2026-06-22:both"
        # The collapsed card is searchable by either market's text.
        assert BriefingArchiveIndex(root, ttl_seconds=0).query(q="combo-us")["total"] == 1
        assert BriefingArchiveIndex(root, ttl_seconds=0).query(q="combo-kr")["total"] == 1


def test_cache_reloads_only_changed_reports():
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        path = root / "2026-06-21.json"
        _write_report(path, "2026-06-21", us_text="old")
        loads = []
        index = BriefingArchiveIndex(
            root, ttl_seconds=0,
            loader=lambda item: loads.append(item.name) or json.loads(item.read_text(encoding="utf-8")),
        )
        assert index.query()["total"] == 2
        assert loads == ["2026-06-21.json"]
        index.query()
        assert loads == ["2026-06-21.json"]
        _write_report(path, "2026-06-21", us_text="changed and longer")
        index.query(force_refresh=True)
        assert loads == ["2026-06-21.json", "2026-06-21.json"]


def test_query_composes_filters_search_sort_and_pagination():
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write_report(root / "2026-06-22.json", "2026-06-22")
        _write_report(root / "2026-06-21.json", "2026-06-21")
        index = BriefingArchiveIndex(root, ttl_seconds=0)
        payload = index.query(
            q="semiconductor", market_scope="us", briefing_type="market_focused",
            date_from="2026-06-01", date_to="2026-06-30", offset=0, limit=1,
        )
        assert payload["total"] == 2
        assert len(payload["items"]) == 1
        assert payload["items"][0]["id"] == "2026-06-22:us"
        both = index.query(market_scope="both")
        assert both["total"] == 4


def test_corrupt_json_warns_and_sidecars_are_ignored():
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write_report(root / "2026-06-22.json", "2026-06-22")
        (root / "2026-06-21.json").write_text("{broken", encoding="utf-8")
        (root / "2026-06-22.visuals.json").write_text("{}", encoding="utf-8")
        payload = BriefingArchiveIndex(root, ttl_seconds=0).query()
        assert payload["total"] == 2
        assert len(payload["warnings"]) == 1
        assert payload["cache"]["reportFiles"] == 2


def test_archive_scans_per_market_files_and_dedupes_legacy_by_market():
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write_report(root / "2026-06-22.json", "2026-06-22", us_text="legacy-us", kr_text="legacy-kr")
        _write_single_market_report(root / "2026-06-22.us.json", "2026-06-22", "us", "new-us")
        _write_single_market_report(root / "2026-06-22.kr.json", "2026-06-22", "kr", "new-kr")
        payload = BriefingArchiveIndex(root, ttl_seconds=0).query()

        assert payload["total"] == 2
        assert [item["id"] for item in payload["items"]] == ["2026-06-22:us", "2026-06-22:kr"]
        assert BriefingArchiveIndex(root, ttl_seconds=0).query(q="legacy-us")["total"] == 0
        assert BriefingArchiveIndex(root, ttl_seconds=0).query(q="new-us", market_scope="us")["total"] == 1


def test_market_search_does_not_match_sibling_markdown():
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write_report(root / "2026-06-22.json", "2026-06-22")
        index = BriefingArchiveIndex(root, ttl_seconds=0)
        assert index.query(q="kr-only-term", market_scope="us")["total"] == 0
        assert index.query(q="kr-only-term", market_scope="kr")["total"] == 1


def test_query_validation_is_explicit():
    with TemporaryDirectory() as tmp:
        index = BriefingArchiveIndex(Path(tmp), ttl_seconds=0)
        cases = [
            ({"market_scope": "xx"}, "marketScope"),
            ({"briefing_type": "xx"}, "briefingType"),
            ({"date_from": "bad"}, "dateFrom"),
            ({"date_from": "2026-06-22", "date_to": "2026-06-01"}, "dateFrom"),
            ({"offset": -1}, "offset"),
            ({"limit": 101}, "limit"),
        ]
        for kwargs, message in cases:
            try:
                index.query(**kwargs)
                raise AssertionError(f"ValueError was not raised for {kwargs}")
            except ValueError as exc:
                assert message in str(exc)


def test_archive_route_translates_query_and_maps_value_error():
    import app
    with patch.object(app, "query_briefing_archive", return_value={"items": [], "total": 0}) as query:
        result = app.api_briefing_archive_index(
            q="chips", marketScope="us", briefingType="concise",
            dateFrom="2026-06-01", dateTo="2026-06-30", offset=2, limit=5,
        )
    assert result["total"] == 0
    query.assert_called_once_with(
        q="chips", market_scope="us", briefing_type="concise",
        date_from="2026-06-01", date_to="2026-06-30", offset=2, limit=5,
    )

    with patch.object(app, "query_briefing_archive", side_effect=ValueError("bad query")):
        try:
            app.api_briefing_archive_index()
            raise AssertionError("HTTPException was not raised")
        except app.HTTPException as exc:
            assert exc.status_code == 400


def test_delete_briefing_removes_report_and_sidecars():
    from features.daily_briefing import service

    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        (root / "2026-06-21.json").write_text("{}", encoding="utf-8")
        (root / "2026-06-21.visuals.json").write_text("{}", encoding="utf-8")
        (root / "2026-06-21.visuals.json.gz").write_bytes(b"\x1f\x8b")
        (root / "2026-06-21.link.json").write_text("{}", encoding="utf-8")
        (root / "2026-06-20.json").write_text("{}", encoding="utf-8")
        with patch.object(service, "BRIEFINGS_DIR", root), \
                patch("features.daily_briefing.archive.refresh_briefing_archive"):
            result = service.delete_briefing("2026-06-21")

        assert result["deleted"] is True
        assert set(result["removedFiles"]) == {
            "2026-06-21.json", "2026-06-21.visuals.json", "2026-06-21.visuals.json.gz",
            "2026-06-21.link.json",
        }
        assert not (root / "2026-06-21.json").exists()
        assert (root / "2026-06-20.json").exists()  # other dates untouched


def test_delete_briefing_market_removes_only_that_market_files():
    from features.daily_briefing import service

    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        for name in (
            "2026-06-21.us.json", "2026-06-21.kr.json",
            "2026-06-21.us.visuals.json", "2026-06-21.us.visuals.json.gz",
            "2026-06-21.kr.visuals.json.gz",
        ):
            (root / name).write_text("{}", encoding="utf-8")
        with patch.object(service, "BRIEFINGS_DIR", root), \
                patch("features.daily_briefing.archive.refresh_briefing_archive"):
            result = service.delete_briefing("2026-06-21", market="us")

        assert result["deleted"] is True
        assert result["market"] == "us"
        assert set(result["removedFiles"]) == {
            "2026-06-21.us.json", "2026-06-21.us.visuals.json", "2026-06-21.us.visuals.json.gz",
        }
        assert not (root / "2026-06-21.us.json").exists()
        assert (root / "2026-06-21.kr.json").exists()
        assert (root / "2026-06-21.kr.visuals.json.gz").exists()


def test_resolve_briefing_prefers_per_market_file_then_legacy_scope():
    from features.daily_briefing import service

    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write_report(root / "2026-06-21.json", "2026-06-21", us_text="legacy-us", kr_text="legacy-kr")
        _write_single_market_report(root / "2026-06-21.us.json", "2026-06-21", "us", "new-us")
        with patch.object(service, "BRIEFINGS_DIR", root):
            us = service.resolve_briefing("2026-06-21", "us")
            kr = service.resolve_briefing("2026-06-21", "kr")

        assert us["marketScope"] == "us"
        assert "new-us" in us["markdown"]
        assert kr["marketScope"] == "kr"
        assert "legacy-kr" in kr["markdown"]


def test_resolve_briefing_injects_combined_link_analysis():
    from features.daily_briefing import service

    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write_single_market_report(root / "2026-06-22.us.json", "2026-06-22", "us", "us-body")
        _write_single_market_report(root / "2026-06-22.kr.json", "2026-06-22", "kr", "kr-body")
        (root / "2026-06-22.link.json").write_text(json.dumps({
            "date": "2026-06-22",
            "status": "connected",
            "markdown": "## 한미 시장 연결 분석\n\n공통 흐름: AI 반도체",
        }, ensure_ascii=False), encoding="utf-8")
        with patch.object(service, "BRIEFINGS_DIR", root):
            combined = service.resolve_briefing("2026-06-22", "both")

        assert combined["marketScope"] == "both"
        assert combined["linkAnalysis"]["status"] == "connected"
        # Link analysis leads the combined view; both market bodies follow.
        assert combined["markdown"].lstrip().startswith("## 한미 시장 연결 분석")
        assert "us-body" in combined["markdown"]
        assert "kr-body" in combined["markdown"]


def test_resolve_briefing_without_link_file_has_no_link_analysis():
    from features.daily_briefing import service

    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write_single_market_report(root / "2026-06-22.us.json", "2026-06-22", "us", "us-body")
        _write_single_market_report(root / "2026-06-22.kr.json", "2026-06-22", "kr", "kr-body")
        with patch.object(service, "BRIEFINGS_DIR", root):
            combined = service.resolve_briefing("2026-06-22", "both")

        assert combined.get("linkAnalysis") is None
        assert "한미 시장 연결 분석" not in combined["markdown"]


def test_resolve_briefing_backfills_missing_leading_company_visuals():
    from features.daily_briefing import service

    aligned = {
        "visualSnapshots": [{
            "id": "company-KR-000660",
            "role": "leading_company",
            "market": "KR",
            "symbol": "000660.KS",
        }],
        "visualRecommendations": [{
            "role": "leading_company",
            "market": "KR",
            "symbol": "000660.KS",
        }],
        "warnings": [],
    }

    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write_single_market_report(
            root / "2026-06-21.kr.json",
            "2026-06-21",
            "kr",
            "## 3. 시장을 주도한 기업 ① — SK하이닉스\n\nHBM 수급이 부각됐다.",
        )
        with patch.object(service, "BRIEFINGS_DIR", root), \
                patch("features.daily_briefing.visuals.collect_briefing_visuals", return_value=aligned) as collect:
            report = service.resolve_briefing("2026-06-21", "kr")

    assert report["visualSnapshots"][0]["role"] == "leading_company"
    assert report["visualRecommendations"][0]["symbol"] == "000660.KS"
    collect.assert_called_once()


def test_resolve_briefing_replaces_legacy_nasdaq_100_index_snapshot():
    from features.daily_briefing import service

    def composite_history(symbol, session_date):
        assert symbol == "^IXIC"
        return {
            "provider": "fixture",
            "intraday": {"interval": "5m", "points": [{"time": f"{session_date}T15:55:00-04:00", "close": 25587.0}]},
            "daily": {"interval": "1d", "points": [
                {"time": "2026-06-20", "close": 26000.0},
                {"time": session_date, "close": 25587.0},
            ]},
        }

    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write_single_market_report(root / "2026-06-21.us.json", "2026-06-21", "us", "market")
        payload = json.loads((root / "2026-06-21.us.json").read_text(encoding="utf-8"))
        payload["visualSnapshots"] = [{
            "id": "price-series:us:indices:2026-06-21",
            "type": "price_series",
            "role": "market_summary",
            "market": "US",
            "marketSessionDate": "2026-06-20",
            "series": [
                {"ticker": "^GSPC", "label": "S&P 500", "daily": {"points": [{"time": "2026-06-20", "close": 1}]}},
                {"ticker": "^NDX", "label": "Nasdaq 100", "daily": {"points": [{"time": "2026-06-20", "close": 29347}]}},
                {"ticker": "^DJI", "label": "Dow Jones", "daily": {"points": [{"time": "2026-06-20", "close": 2}]}},
            ],
        }]
        (root / "2026-06-21.us.json").write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        with patch.object(service, "BRIEFINGS_DIR", root), \
                patch("features.common.market_data.price_history.build_price_history", side_effect=composite_history) as build:
            report = service.resolve_briefing("2026-06-21", "us")

    series = report["visualSnapshots"][0]["series"]
    assert [row["ticker"] for row in series] == ["^GSPC", "^IXIC", "^DJI"]
    assert series[1]["label"] == "Nasdaq"
    assert series[1]["daily"]["points"][-1]["close"] == 25587.0
    build.assert_called_once_with("^IXIC", "2026-06-20")


def test_resolve_briefing_normalizes_existing_nasdaq_composite_label():
    from features.daily_briefing import service

    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write_single_market_report(root / "2026-06-21.us.json", "2026-06-21", "us", "market")
        payload = json.loads((root / "2026-06-21.us.json").read_text(encoding="utf-8"))
        payload["visualSnapshots"] = [{
            "id": "price-series:us:indices:2026-06-21",
            "type": "price_series",
            "role": "market_summary",
            "market": "US",
            "marketSessionDate": "2026-06-20",
            "series": [
                {"ticker": "^GSPC", "label": "S&P 500"},
                {"ticker": "^IXIC", "label": "Nasdaq Composite"},
                {"ticker": "^DJI", "label": "Dow Jones"},
            ],
        }]
        (root / "2026-06-21.us.json").write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        with patch.object(service, "BRIEFINGS_DIR", root):
            report = service.resolve_briefing("2026-06-21", "us")

    series = report["visualSnapshots"][0]["series"]
    assert [row["label"] for row in series] == ["S&P 500", "Nasdaq", "Dow Jones"]


def test_delete_briefing_missing_returns_not_deleted():
    from features.daily_briefing import service

    with TemporaryDirectory() as tmp:
        with patch.object(service, "BRIEFINGS_DIR", Path(tmp)):
            result = service.delete_briefing("2026-06-21")
        assert result == {"deleted": False, "date": "2026-06-21", "removedFiles": []}


def test_delete_briefing_rejects_bad_date():
    from features.daily_briefing import service

    for bad in ("../2026-06-21", "2026-6-1", "not-a-date", ""):
        try:
            service.delete_briefing(bad)
            raise AssertionError(f"expected ValueError for {bad!r}")
        except ValueError:
            pass


def _run_all():
    tests = [value for name, value in sorted(globals().items()) if name.startswith("test_") and callable(value)]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"\n{len(tests)}/{len(tests)} tests passed")
    return True


if __name__ == "__main__":
    sys.exit(0 if _run_all() else 1)
