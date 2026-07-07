"""Immutable visual data snapshots for dated daily briefings.

Step 2 stores renderer-neutral price series inline and larger heatmap rows in
one dated sidecar.  Collection is best effort: visual failures never block the
Canonical briefing markdown.
"""

from __future__ import annotations

from copy import deepcopy
import datetime as dt
import gzip
import json
from pathlib import Path
import re
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from features.common.market_calendar import is_market_open, latest_trading_day_on_or_before, previous_trading_day
from features.common.market_data.market_universe import build_kospi_heatmap_snapshot, build_us_heatmap_snapshot
from features.common.market_data.price_history import INDEX_UNIVERSE, build_price_history
from features.common.company_lookup import find_companies
from features.common.utils import read_json, write_json
from features.daily_briefing.schema import (
    briefing_file_name,
    briefing_scope_view,
    normalize_market_scope,
    visual_sidecar_file_name,
    visual_sidecar_gzip_file_name,
)


ROOT = Path(__file__).resolve().parents[2]
COMPANY_MASTER_PATH = ROOT / "config" / "company_master.json"
MARKET_CACHE_DIR = ROOT / "data" / "market-cache"
MARKET_META = {
    "us": {"market": "US", "timezone": "America/New_York", "currency": "USD"},
    "kr": {"market": "KR", "timezone": "Asia/Seoul", "currency": "KRW"},
}
DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _safe_float(value):
    try:
        if value is None or value != value:
            return None
        return float(value)
    except Exception:
        return None


def _iso_date(value):
    try:
        return value.date().isoformat()
    except Exception:
        return str(value or "")[:10]


def _provider_symbol(ticker, market):
    ticker = str(ticker or "").strip().upper()
    if str(market).lower() == "kr" and ticker.isdigit() and len(ticker) == 6:
        return f"{ticker}.KS"
    return ticker


def _default_history_fetcher(symbol, start, end):
    import yfinance as yf

    hist = yf.Ticker(symbol).history(start=start, end=end, interval="1d", auto_adjust=False)
    if hist is None or hist.empty or "Close" not in hist:
        return []
    rows = []
    for index, row in hist.iterrows():
        close = _safe_float(row.get("Close"))
        if close is None:
            continue
        rows.append({
            "time": _iso_date(index),
            "open": _safe_float(row.get("Open")),
            "high": _safe_float(row.get("High")),
            "low": _safe_float(row.get("Low")),
            "close": close,
            "volume": _safe_float(row.get("Volume")),
        })
    return rows


def _company_master():
    payload = read_json(COMPANY_MASTER_PATH, {})
    return [row for row in payload.get("companies", []) if isinstance(row, dict)]


def _market_companies(market):
    target = str(market or "").upper()
    return [row for row in _company_master() if str(row.get("market") or "").upper() == target]


LEADING_COMPANY_HEADING_RE = re.compile(
    r"^#{1,6}\s+[34]\.\s*((?:미국장|한국장)(?:을|를)|시장(?:을|를)?)\s*주도한 기업\s*([①②])"
    r"\s*(?:[-—–:]\s*)?(.+?)\s*$",
    re.MULTILINE,
)


def leading_company_subjects_from_markdown(markdown):
    result = {"us": [], "kr": [], "warnings": []}
    seen = set()
    for match in LEADING_COMPANY_HEADING_RE.finditer(str(markdown or "")):
        heading_market = match.group(1)
        ordinal = 1 if match.group(2) == "①" else 2
        company_text = match.group(3).strip().strip("[]")
        market_key = None
        if heading_market.startswith("미국장"):
            market_key = "us"
        elif heading_market.startswith("한국장"):
            market_key = "kr"
        candidates = find_companies(company_text)
        if market_key:
            market = MARKET_META[market_key]["market"]
            candidates = [
                row for row in candidates
                if str(row.get("market") or "").upper() == market
            ]
        else:
            market_counts = {}
            for row in candidates:
                market_value = str(row.get("market") or "").upper()
                if market_value in {"US", "KR"}:
                    market_counts[market_value] = market_counts.get(market_value, 0) + 1
            if len(market_counts) == 1:
                market = next(iter(market_counts))
                market_key = "us" if market == "US" else "kr"
                candidates = [
                    row for row in candidates
                    if str(row.get("market") or "").upper() == market
                ]
            else:
                result["warnings"].append(
                    f"leading company {ordinal} market could not be inferred: {company_text}"
                )
                continue
        if not candidates:
            result["warnings"].append(
                f"{MARKET_META[market_key]['market'] if market_key else 'BOTH'} leading company {ordinal} could not be resolved: {company_text}"
            )
            continue
        company = candidates[0]
        ticker = str(company.get("ticker") or "").strip().upper()
        key = (market_key, ordinal)
        if not ticker or key in seen:
            continue
        seen.add(key)
        result[market_key].append({
            "ordinal": ordinal,
            "ticker": ticker,
            "label": company.get("name") or company_text or ticker,
            "sector": company.get("sector") or "Other",
            "market": market,
        })
    result["us"].sort(key=lambda row: row["ordinal"])
    result["kr"].sort(key=lambda row: row["ordinal"])
    return result


def leading_company_subjects(scope_result, market, limit=2):
    """Pick chartable companies from the same ranked groups used by prose."""
    target = str(market or "").upper()
    selected = []
    seen = set()
    for group in (scope_result or {}).get("groups", []):
        for doc in group.get("docs", []):
            for company in doc.get("companies", []) or []:
                ticker = str(company.get("ticker") or "").strip().upper()
                company_market = str(company.get("market") or target).upper()
                if not ticker or company_market != target or ticker in seen:
                    continue
                seen.add(ticker)
                selected.append({
                    "ticker": ticker,
                    "label": company.get("name") or ticker,
                    "sector": company.get("sector") or group.get("sector") or "Other",
                })
                if len(selected) >= limit:
                    return selected
    return selected


def _session_date(scope_result, fallback_date):
    return str((scope_result or {}).get("marketSessionDate") or fallback_date or "")[:10]


def _date_window(session_date, lookback_days=45):
    target = dt.date.fromisoformat(session_date)
    return (target - dt.timedelta(days=lookback_days)).isoformat(), (target + dt.timedelta(days=1)).isoformat()


def _coverage(requested, returned, missing):
    requested_count = len(requested)
    return {
        "requested": requested_count,
        "returned": len(returned),
        "ratio": round(len(returned) / requested_count, 4) if requested_count else 0.0,
        "status": "complete" if requested_count and len(returned) == requested_count else "partial" if returned else "unavailable",
        "missingSymbols": list(missing),
    }


def _latest_series_time(series):
    values = []
    for row in series or []:
        for bucket in (row.get("intraday") or {}, row.get("daily") or {}):
            points = bucket.get("points") or []
            if points:
                values.append(str(points[-1].get("time") or ""))
    return max(values, default="")


def _series_provider(series):
    providers = []
    for row in series or []:
        provider = str(row.get("provider") or "").strip()
        if not provider:
            source_by_interval = row.get("sourceByInterval") or {}
            provider = "+".join(
                str(source_by_interval.get(key) or "").strip()
                for key in ("intraday", "daily")
                if str(source_by_interval.get(key) or "").strip()
            )
        for part in provider.split("+"):
            part = part.strip()
            if part and part not in providers:
                providers.append(part)
    return "+".join(providers) if providers else "market-data-v2"


def _price_snapshot(snapshot_id, market_key, role, session_date, requested, series, missing, subject=None):
    meta = MARKET_META[market_key]
    latest = _latest_series_time(series)
    as_of = latest or session_date
    exact = bool(latest and latest[:10] == session_date)
    freshness = "close_snapshot" if exact else "stale" if latest else "unavailable"
    warnings = []
    if not exact and series:
        warnings.append(f"latest series date {as_of} does not match marketSessionDate {session_date}")
    if missing:
        warnings.append(f"missing symbols: {', '.join(missing)}")
    point_counts = {
        row.get("ticker", ""): {
            "intraday": len(((row.get("intraday") or {}).get("points") or [])),
            "daily": len(((row.get("daily") or {}).get("points") or [])),
        }
        for row in series
    }
    sparse = [ticker for ticker, counts in point_counts.items() if counts["daily"] < 8]
    if sparse:
        warnings.append(f"fewer than 8 temporal points: {', '.join(sparse)}")
    return {
        "id": snapshot_id,
        "schemaVersion": 2,
        "type": "price_series",
        "role": role,
        "market": meta["market"],
        "marketSessionDate": session_date,
        "asOf": as_of,
        "provider": _series_provider(series),
        "freshness": freshness,
        "coverage": _coverage(requested, series, missing),
        "timezone": meta["timezone"],
        "currency": meta["currency"],
        "granularities": ["5m", "1d"],
        "dataSufficiency": {"minimumTrendPoints": 8, "pointCounts": point_counts, "status": "sparse" if sparse else "sufficient" if series else "unavailable"},
        "subject": subject or {},
        "series": series,
        "warnings": warnings,
    }


def _recommendation(snapshot, family, variant, title, placement):
    return {
        "id": f"recommendation:{snapshot['id']}",
        "snapshotId": snapshot["id"],
        "market": snapshot["market"],
        "role": snapshot.get("role", ""),
        "family": family,
        "variant": variant,
        "title": title,
        "renderer": "lightweight_charts" if family == "trend" else "plotly",
        "placement": placement,
    }


def collect_briefing_visuals(
    date,
    market_scope,
    scope_results,
    history_fetcher=None,
    price_history_fetcher=None,
    heatmap_fetchers=None,
    leader_subjects=None,
    include_market_visuals=True,
):
    """Collect renderer-neutral snapshots and a heatmap sidecar payload."""
    if price_history_fetcher is not None:
        fetch_price = price_history_fetcher
    elif history_fetcher is not None:
        def fetch_price(symbol, session_date):
            start, end = _date_window(session_date, lookback_days=370)
            rows = [
                row for row in (history_fetcher(symbol, start, end) or [])
                if str(row.get("time") or "")[:10] <= session_date
            ]
            return {
                "intraday": {"interval": "5m", "points": []},
                "daily": {"interval": "1d", "points": rows},
            }
    else:
        fetch_price = build_price_history
    heatmap_fetchers = heatmap_fetchers or {
        "us": lambda session_date: build_us_heatmap_snapshot(session_date, cache_dir=MARKET_CACHE_DIR),
        "kr": lambda session_date: build_kospi_heatmap_snapshot(session_date, cache_dir=MARKET_CACHE_DIR),
    }
    scope = normalize_market_scope(market_scope)
    scopes = ["us", "kr"] if scope == "both" else [scope]
    snapshots = []
    recommendations = []
    sidecar_snapshots = {}
    warnings = []
    if isinstance(leader_subjects, dict):
        warnings.extend(str(row) for row in leader_subjects.get("warnings", []) if str(row))
    price_cache = {}

    def subject_history(symbol, session_date):
        key = (symbol, session_date)
        if key not in price_cache:
            try:
                value = fetch_price(symbol, session_date) or {}
                price_cache[key] = {
                    "provider": value.get("provider") or "market-data-v2",
                    "sourceByInterval": value.get("sourceByInterval") or {},
                    "intraday": value.get("intraday") or {"interval": "5m", "points": []},
                    "daily": value.get("daily") or {"interval": "1d", "points": []},
                }
            except Exception as exc:
                price_cache[key] = {
                    "provider": "unavailable",
                    "sourceByInterval": {},
                    "intraday": {"interval": "5m", "points": []},
                    "daily": {"interval": "1d", "points": []},
                }
                warnings.append(f"{symbol}: {str(exc)[:160]}")
        return deepcopy(price_cache[key])

    for market_key in scopes:
        result = (scope_results or {}).get(market_key) or {}
        session_date = _session_date(result, date)
        try:
            dt.date.fromisoformat(session_date)
        except ValueError:
            warnings.append(f"{market_key}: invalid marketSessionDate {session_date}")
            continue

        index_requested = list(INDEX_UNIVERSE[market_key]) if include_market_visuals else []
        index_series, index_missing = [], []
        for item in index_requested:
            history = subject_history(item["ticker"], session_date)
            if not (history["intraday"]["points"] or history["daily"]["points"]):
                index_missing.append(item["ticker"])
                continue
            index_series.append({"ticker": item["ticker"], "label": item["label"], **history})
        if include_market_visuals:
            index_snapshot = _price_snapshot(
                f"price-series:{market_key}:indices:{date}", market_key, "market_summary", session_date,
                index_requested, index_series, index_missing,
            )
            snapshots.append(index_snapshot)
            recommendations.append(_recommendation(
                index_snapshot,
                "trend",
                "focus_price_chart",
                f"{MARKET_META[market_key]['market']} 주요 지수",
                {"market": MARKET_META[market_key]["market"], "sectionRole": "market_flow", "order": 1},
            ))

        leaders = (
            list(leader_subjects.get(market_key, []))
            if isinstance(leader_subjects, dict)
            else leading_company_subjects(result, MARKET_META[market_key]["market"], limit=2)
        )
        for position, leader in enumerate(leaders, start=1):
            ordinal = int(leader.get("ordinal") or position)
            symbol = _provider_symbol(leader["ticker"], market_key)
            history = subject_history(symbol, session_date)
            available = bool(history["intraday"]["points"] or history["daily"]["points"])
            series = [{
                "ticker": leader["ticker"],
                "providerSymbol": symbol,
                "label": leader["label"],
                **history,
            }] if available else []
            snapshot = _price_snapshot(
                f"price-series:{market_key}:company:{leader['ticker']}:{date}", market_key, "leading_company",
                session_date, [leader], series, [] if available else [symbol], subject=leader,
            )
            snapshots.append(snapshot)
            recommendations.append(_recommendation(
                snapshot,
                "trend",
                "focus_price_chart",
                f"{leader['label']} 가격 추이",
                {
                    "market": MARKET_META[market_key]["market"],
                    "sectionRole": "leading_company",
                    "subjectTicker": leader["ticker"],
                    "ordinal": ordinal,
                    "order": 1,
                },
            ))

        if not include_market_visuals:
            continue

        try:
            heatmap_payload = heatmap_fetchers[market_key](session_date) or {}
        except Exception as exc:
            heatmap_payload = {
                "market": MARKET_META[market_key]["market"],
                "asOf": session_date,
                "provider": "unavailable",
                "freshness": "unavailable",
                "coverage": {"requested": 0, "returned": 0, "ratio": 0.0, "status": "unavailable"},
                "rows": [],
                "warnings": [str(exc)[:160]],
            }
            warnings.append(f"{market_key} heatmap: {str(exc)[:160]}")
        heatmap_id = f"market-heatmap:{market_key}:{date}"
        sidecar_snapshots[heatmap_id] = {
            "schemaVersion": 2,
            "id": heatmap_id,
            "type": "market_heatmap",
            "role": "market_summary",
            "market": MARKET_META[market_key]["market"],
            "marketSessionDate": session_date,
            "asOf": heatmap_payload.get("asOf") or session_date,
            "provider": heatmap_payload.get("provider") or "unavailable",
            "freshness": heatmap_payload.get("freshness") or "unavailable",
            "coverage": heatmap_payload.get("coverage") or {"requested": 0, "returned": 0, "ratio": 0.0, "status": "unavailable"},
            "timezone": MARKET_META[market_key]["timezone"],
            "currency": MARKET_META[market_key]["currency"],
            "weightBasis": "market_cap",
            "rows": heatmap_payload.get("rows") or [],
            "warnings": heatmap_payload.get("warnings") or [],
        }
        heatmap_snapshot = {
            key: value for key, value in sidecar_snapshots[heatmap_id].items()
            if key not in {"rows"}
        }
        heatmap_snapshot["sidecarRef"] = {
            "file": f"data/briefings/{visual_sidecar_gzip_file_name(date)}",
            "snapshotId": heatmap_id,
        }
        snapshots.append(heatmap_snapshot)
        recommendations.append(_recommendation(
            heatmap_snapshot,
            "composition",
            "treemap_heatmap",
            f"{MARKET_META[market_key]['market']} 전체 시장 히트맵",
            {"market": MARKET_META[market_key]["market"], "sectionRole": "market_flow", "order": 2},
        ))

    return {
        "visualRecommendations": recommendations,
        "visualSnapshots": snapshots,
        "sidecar": {
            "schemaVersion": 2,
            "date": str(date)[:10],
            "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
            "snapshots": sidecar_snapshots,
        },
        "warnings": warnings,
    }


def replace_leading_company_visuals(existing, aligned):
    result = deepcopy(existing or {})
    result["visualSnapshots"] = [
        row for row in result.get("visualSnapshots", [])
        if row.get("role") != "leading_company"
    ] + deepcopy((aligned or {}).get("visualSnapshots") or [])
    result["visualRecommendations"] = [
        row for row in result.get("visualRecommendations", [])
        if row.get("role") != "leading_company"
    ] + deepcopy((aligned or {}).get("visualRecommendations") or [])
    warnings = list(result.get("visualWarnings") or [])
    warnings.extend(str(row) for row in (aligned or {}).get("warnings", []) if str(row))
    result["visualWarnings"] = warnings
    return result


def merge_visual_sidecar(current, incoming, market_scope):
    merged = dict(current or {})
    merged.update({key: value for key, value in (incoming or {}).items() if key != "snapshots"})
    snapshots = dict((current or {}).get("snapshots") or {})
    scope = normalize_market_scope(market_scope)
    if scope == "both":
        snapshots = {}
    else:
        target = scope.upper()
        snapshots = {key: value for key, value in snapshots.items() if str(value.get("market") or "").upper() != target}
    snapshots.update((incoming or {}).get("snapshots") or {})
    merged["snapshots"] = snapshots
    return merged


def _read_sidecar_file(path):
    path = Path(path)
    try:
        if path.suffix == ".gz":
            with gzip.open(path, "rt", encoding="utf-8") as stream:
                return json.load(stream)
        return read_json(path, None)
    except (OSError, ValueError, json.JSONDecodeError):
        return None


def _write_gzip_json(path, payload):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    with gzip.open(temporary, "wt", encoding="utf-8", compresslevel=6) as stream:
        json.dump(payload, stream, ensure_ascii=False, separators=(",", ":"))
    temporary.replace(path)


def write_visual_sidecar(path, payload, market_scope):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    merged = merge_visual_sidecar(_read_sidecar_file(path) or {}, payload, market_scope)
    if path.suffix == ".gz":
        _write_gzip_json(path, merged)
    else:
        write_json(path, merged)
    return merged


def load_visual_sidecar(date, base_dir=None, market_scope=None):
    """Load one immutable dated sidecar without allowing path traversal."""
    date_text = str(date or "").strip()
    if not DATE_PATTERN.fullmatch(date_text):
        return None
    try:
        dt.date.fromisoformat(date_text)
    except ValueError:
        return None
    root = Path(base_dir) if base_dir is not None else ROOT / "data" / "briefings"
    scope = str(market_scope or "").strip().lower()
    file_names = []
    if scope in {"us", "kr"}:
        file_names.extend((
            visual_sidecar_gzip_file_name(date_text, scope),
            visual_sidecar_file_name(date_text, scope),
        ))
    file_names.extend((visual_sidecar_gzip_file_name(date_text), visual_sidecar_file_name(date_text)))
    for file_name in file_names:
        payload = _read_sidecar_file(root / file_name)
        if isinstance(payload, dict) and str(payload.get("date") or "") == date_text:
            return payload
    return None


def _load_visual_report(root, date_text, market_scope=""):
    scope = str(market_scope or "").strip().lower()
    if scope in {"us", "kr"}:
        scoped = read_json(root / briefing_file_name(date_text, scope), None)
        if isinstance(scoped, dict):
            return briefing_scope_view(scoped, scope)
        legacy = read_json(root / briefing_file_name(date_text), None)
        if isinstance(legacy, dict):
            return briefing_scope_view(legacy, scope)
        return None

    legacy = read_json(root / briefing_file_name(date_text), None)
    if isinstance(legacy, dict):
        return legacy
    scoped_reports = {
        key: read_json(root / briefing_file_name(date_text, key), None)
        for key in ("us", "kr")
    }
    if not any(isinstance(value, dict) for value in scoped_reports.values()):
        return None
    return {
        "date": date_text,
        "marketScope": "both",
        "visualSnapshots": [
            item for key in ("us", "kr")
            for item in ((scoped_reports.get(key) or {}).get("visualSnapshots") or [])
        ],
        "visualRecommendations": [
            item for key in ("us", "kr")
            for item in ((scoped_reports.get(key) or {}).get("visualRecommendations") or [])
        ],
    }


def _market_clock(market, now=None):
    market_key = "us" if str(market or "").upper() == "US" else "kr"
    meta = MARKET_META[market_key]
    current = now or dt.datetime.now(dt.timezone.utc)
    if current.tzinfo is None:
        current = current.replace(tzinfo=dt.timezone.utc)
    try:
        timezone = ZoneInfo(meta["timezone"])
    except ZoneInfoNotFoundError:
        if market_key == "kr":
            timezone = dt.timezone(dt.timedelta(hours=9), name="KST")
        else:
            year = current.year
            march = dt.date(year, 3, 1)
            second_sunday_march = march + dt.timedelta(days=(6 - march.weekday()) % 7 + 7)
            november = dt.date(year, 11, 1)
            first_sunday_november = november + dt.timedelta(days=(6 - november.weekday()) % 7)
            eastern_date = current.date()
            offset = -4 if second_sunday_march <= eastern_date < first_sunday_november else -5
            timezone = dt.timezone(dt.timedelta(hours=offset), name="EDT" if offset == -4 else "EST")
    local = current.astimezone(timezone)
    trading_day = is_market_open(local.date(), meta["market"])
    opens, closes = ((dt.time(9, 30), dt.time(16, 0)) if market_key == "us" else (dt.time(9, 0), dt.time(15, 30)))
    state = "open" if trading_day and opens <= local.time() < closes else "closed"
    if trading_day and local.time() < opens:
        reason = "before_regular_session"
        target = previous_trading_day(local.date(), meta["market"])
    else:
        reason = "regular_session" if state == "open" else "outside_regular_session" if trading_day else "non_trading_day"
        target = latest_trading_day_on_or_before(local.date(), meta["market"])
    return {
        "market": meta["market"],
        "state": state,
        "reason": reason,
        "timezone": meta["timezone"],
        "localTime": local.isoformat(),
        "latestSessionDate": target.isoformat(),
    }


def _current_freshness(as_of, target_date, market_state, market):
    if not as_of:
        return "unavailable"
    if as_of == target_date:
        return "delayed" if market_state == "open" else "snapshot"
    try:
        target = dt.date.fromisoformat(target_date)
        if dt.date.fromisoformat(as_of) == previous_trading_day(target, market):
            return "delayed"
    except ValueError:
        pass
    return "stale"


def _latest_close(series):
    points = ((series or {}).get("daily") or {}).get("points") or (series or {}).get("points") or []
    if not points:
        return None
    return _safe_float(points[-1].get("close"))


def _price_comparison(saved, current):
    saved_by_ticker = {str(row.get("ticker") or ""): row for row in saved.get("series") or []}
    changes = []
    for row in current.get("series") or []:
        ticker = str(row.get("ticker") or "")
        generated_close = _latest_close(saved_by_ticker.get(ticker) or {})
        current_close = _latest_close(row)
        change_pct = None
        if generated_close not in {None, 0} and current_close is not None:
            change_pct = (current_close / generated_close - 1.0) * 100.0
        changes.append({
            "ticker": ticker,
            "label": row.get("label") or ticker,
            "generatedClose": generated_close,
            "currentClose": current_close,
            "changePct": round(change_pct, 4) if change_pct is not None else None,
        })
    return {"priceChanges": changes, "sectorRankChanges": []}


def _sector_ranking(rows):
    sectors = {}
    for row in rows or []:
        change = _safe_float(row.get("changePct"))
        weight = _safe_float(row.get("weight"))
        if change is None or weight is None or weight <= 0:
            continue
        sector = row.get("sector") or "Other"
        bucket = sectors.setdefault(sector, {"weighted": 0.0, "weight": 0.0})
        bucket["weighted"] += change * weight
        bucket["weight"] += weight
    ranked = sorted(
        ((sector, values["weighted"] / values["weight"]) for sector, values in sectors.items() if values["weight"]),
        key=lambda item: item[1],
        reverse=True,
    )
    return {sector: {"rank": index + 1, "changePct": change} for index, (sector, change) in enumerate(ranked)}


def _heatmap_comparison(saved, current):
    old_ranks = _sector_ranking(saved.get("rows") or [])
    new_ranks = _sector_ranking(current.get("rows") or [])
    rows = []
    for sector in sorted(set(old_ranks) | set(new_ranks)):
        old = old_ranks.get(sector) or {}
        new = new_ranks.get(sector) or {}
        old_rank, new_rank = old.get("rank"), new.get("rank")
        rows.append({
            "sector": sector,
            "generatedRank": old_rank,
            "currentRank": new_rank,
            "rankChange": old_rank - new_rank if old_rank and new_rank else None,
            "generatedChangePct": round(old["changePct"], 4) if old.get("changePct") is not None else None,
            "currentChangePct": round(new["changePct"], 4) if new.get("changePct") is not None else None,
        })
    rows.sort(key=lambda row: row.get("currentRank") or 10_000)
    return {"priceChanges": [], "sectorRankChanges": rows}


def _current_price_snapshot(saved, fetch_price, clock, warnings, retrieved_at):
    market_key = str(saved.get("market") or "").lower()
    target = clock["latestSessionDate"]
    requested, series, missing = [], [], []
    for saved_series in saved.get("series") or []:
        ticker = str(saved_series.get("ticker") or "").strip().upper()
        symbol = saved_series.get("providerSymbol") or _provider_symbol(ticker, market_key)
        requested.append({"ticker": ticker, "providerSymbol": symbol})
        try:
            history = fetch_price(symbol, target) or {}
        except Exception as exc:
            history = {}
            warnings.append(f"{symbol}: {str(exc)[:160]}")
        intraday = history.get("intraday") or {"interval": "5m", "points": []}
        daily = history.get("daily") or {"interval": "1d", "points": []}
        if not (intraday.get("points") or daily.get("points")):
            missing.append(symbol)
            continue
        series.append({
            "ticker": ticker,
            "providerSymbol": symbol,
            "label": saved_series.get("label") or ticker,
            "intraday": intraday,
            "daily": daily,
        })
    current = _price_snapshot(saved.get("id"), market_key, saved.get("role"), target, requested, series, missing, subject=deepcopy(saved.get("subject") or {}))
    current.update({
        "mode": "current",
        "sourceSnapshotAsOf": saved.get("asOf"),
        "retrievedAt": retrieved_at,
        "marketStatus": deepcopy(clock),
    })
    current["freshness"] = _current_freshness(str(current.get("asOf") or "")[:10] if series else "", target, clock["state"], saved.get("market"))
    return current


def _current_heatmap_snapshot_v2(saved, payload, clock, retrieved_at):
    current = deepcopy(saved)
    current.update({
        "rows": deepcopy(payload.get("rows") or []),
        "marketSessionDate": clock["latestSessionDate"],
        "asOf": payload.get("asOf") or clock["latestSessionDate"],
        "provider": payload.get("provider") or "unavailable",
        "freshness": payload.get("freshness") or "unavailable",
        "coverage": deepcopy(payload.get("coverage") or {"requested": 0, "returned": 0, "ratio": 0.0, "status": "unavailable"}),
        "weightBasis": "market_cap",
        "mode": "current",
        "sourceSnapshotAsOf": saved.get("asOf"),
        "retrievedAt": retrieved_at,
        "marketStatus": deepcopy(clock),
        "warnings": deepcopy(payload.get("warnings") or []),
    })
    current.pop("sidecarRef", None)
    return current


def _current_heatmap_snapshot(saved, saved_detail, fetch, clock, cache, warnings, retrieved_at):
    market_key = str(saved.get("market") or "").lower()
    target = clock["latestSessionDate"]
    start, end = _date_window(target)
    requested = saved_detail.get("rows") or []
    rows, missing = [], []
    for saved_row in requested:
        ticker = str(saved_row.get("ticker") or "").strip().upper()
        symbol = saved_row.get("providerSymbol") or _provider_symbol(ticker, market_key)
        if symbol not in cache:
            try:
                cache[symbol] = [row for row in (fetch(symbol, start, end) or []) if str(row.get("time") or "")[:10] <= target]
            except Exception as exc:
                cache[symbol] = []
                warnings.append(f"{symbol}: {str(exc)[:160]}")
        points = cache[symbol]
        if not points:
            missing.append(symbol)
            continue
        latest = points[-1]
        previous = points[-2] if len(points) >= 2 else None
        close = _safe_float(latest.get("close"))
        previous_close = _safe_float((previous or {}).get("close"))
        change_pct = (close / previous_close - 1.0) * 100.0 if close is not None and previous_close not in {None, 0} else None
        volume = _safe_float(latest.get("volume"))
        rows.append({
            "ticker": ticker,
            "providerSymbol": symbol,
            "label": saved_row.get("label") or ticker,
            "sector": saved_row.get("sector") or "Other",
            "close": close,
            "changePct": change_pct,
            "weight": close * volume if close is not None and volume is not None else close,
            "weightBasis": "session_trading_value" if volume is not None else "close_price_fallback",
            "asOf": latest.get("time"),
        })
    as_of = max((str(row.get("asOf") or "") for row in rows), default="")
    current = deepcopy(saved)
    current.update({
        "rows": rows,
        "marketSessionDate": target,
        "asOf": as_of or target,
        "provider": "yfinance",
        "freshness": _current_freshness(as_of, target, clock["state"], saved.get("market")),
        "coverage": _coverage(requested, rows, missing),
        "mode": "current",
        "sourceSnapshotAsOf": saved.get("asOf"),
        "retrievedAt": retrieved_at,
        "marketStatus": deepcopy(clock),
        "warnings": ([f"missing symbols: {', '.join(missing)}"] if missing else []),
    })
    current.pop("sidecarRef", None)
    return current


def load_current_visuals(
    date,
    base_dir=None,
    history_fetcher=None,
    now=None,
    price_history_fetcher=None,
    heatmap_fetchers=None,
    market="",
    snapshot_id="",
):
    """Build an ephemeral latest REST view from a saved briefing universe.

    This function is deliberately read-only: neither the Canonical report nor
    its immutable visual sidecar is written or merged with current data.
    """
    date_text = str(date or "").strip()
    if not DATE_PATTERN.fullmatch(date_text):
        return None
    root = Path(base_dir) if base_dir is not None else ROOT / "data" / "briefings"
    market_scope = str(market or "").strip().lower()
    report = _load_visual_report(root, date_text, market_scope)
    if not isinstance(report, dict):
        return None
    sidecar = load_visual_sidecar(date_text, root, market_scope=market_scope) or {"snapshots": {}}
    saved_details = sidecar.get("snapshots") or {}
    target_market = str(market or "").strip().upper()
    selected_snapshots = deepcopy(report.get("visualSnapshots") or [])
    if target_market in {"US", "KR"}:
        selected_snapshots = [
            row for row in selected_snapshots
            if str(row.get("market") or "").upper() == target_market
        ]
    if snapshot_id:
        selected_snapshots = [row for row in selected_snapshots if row.get("id") == snapshot_id]
    if price_history_fetcher is not None:
        fetch_price = price_history_fetcher
    elif history_fetcher is not None:
        def fetch_price(symbol, session_date):
            start, end = _date_window(session_date, lookback_days=370)
            rows = [
                row for row in (history_fetcher(symbol, start, end) or [])
                if str(row.get("time") or "")[:10] <= session_date
            ]
            return {
                "intraday": {"interval": "5m", "points": []},
                "daily": {"interval": "1d", "points": rows},
            }
    else:
        fetch_price = build_price_history
    batch_heatmaps = heatmap_fetchers or {
        "us": lambda session_date: build_us_heatmap_snapshot(session_date, cache_dir=MARKET_CACHE_DIR),
        "kr": lambda session_date: build_kospi_heatmap_snapshot(session_date, cache_dir=MARKET_CACHE_DIR),
    }
    current_time = now or dt.datetime.now(dt.timezone.utc)
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=dt.timezone.utc)
    retrieved_at = current_time.astimezone(dt.timezone.utc).isoformat()
    markets = {str(row.get("market") or "").upper() for row in selected_snapshots if row.get("market")}
    clocks = {market: _market_clock(market, current_time) for market in markets}
    snapshots, comparisons, warnings, legacy_cache, heatmap_cache = [], {}, [], {}, {}
    for saved in selected_snapshots:
        market = str(saved.get("market") or "").upper()
        clock = clocks.get(market) or _market_clock(market, current_time)
        if saved.get("type") == "price_series":
            current = _current_price_snapshot(saved, fetch_price, clock, warnings, retrieved_at)
            comparisons[current["id"]] = _price_comparison(saved, current)
        elif saved.get("type") == "market_heatmap":
            detail = deepcopy(saved_details.get(saved.get("id")) or {})
            if history_fetcher is not None and heatmap_fetchers is None:
                current = _current_heatmap_snapshot(
                    saved, detail, history_fetcher, clock, legacy_cache, warnings, retrieved_at,
                )
            else:
                market_key = market.lower()
                if market_key not in heatmap_cache:
                    try:
                        heatmap_cache[market_key] = batch_heatmaps[market_key](clock["latestSessionDate"]) or {}
                    except Exception as exc:
                        heatmap_cache[market_key] = {
                            "asOf": clock["latestSessionDate"],
                            "provider": "unavailable",
                            "freshness": "unavailable",
                            "coverage": {"requested": 0, "returned": 0, "ratio": 0.0, "status": "unavailable"},
                            "rows": [],
                            "warnings": [str(exc)[:160]],
                        }
                        warnings.append(f"{market} heatmap: {str(exc)[:160]}")
                current = _current_heatmap_snapshot_v2(saved, heatmap_cache[market_key], clock, retrieved_at)
            comparisons[current["id"]] = _heatmap_comparison(detail, current)
        else:
            continue
        snapshots.append(current)
    available = sum(1 for row in snapshots if row.get("freshness") != "unavailable")
    status = "ok" if snapshots and available == len(snapshots) else "partial" if available else "unavailable"
    if status == "unavailable":
        warnings.append("current market snapshot is unavailable; saved briefing snapshot remains unchanged")
    return {
        "mode": "current",
        "status": status,
        "sourceReportDate": date_text,
        "retrievedAt": retrieved_at,
        "provider": "yfinance" if history_fetcher is not None and price_history_fetcher is None else "market-data-v2",
        "marketStatus": clocks,
        "visualRecommendations": [
            deepcopy(row) for row in report.get("visualRecommendations") or []
            if any(snapshot.get("id") == row.get("snapshotId") for snapshot in selected_snapshots)
        ],
        "visualSnapshots": snapshots,
        "comparisons": comparisons,
        "warnings": warnings,
    }
