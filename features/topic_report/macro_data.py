"""Fetch structured economic data from FRED (US) and BOK ECOS (Korea)."""
from __future__ import annotations

import datetime as dt
import json
import urllib.error
import urllib.parse
import urllib.request

FRED_BASE = "https://api.stlouisfed.org/fred/series/observations"
BOK_BASE = "https://ecos.bok.or.kr/api/StatisticSearch"

# FRED series definitions
FRED_SERIES_META: dict[str, str] = {
    "FEDFUNDS": "Fed Funds Rate (%)",
    "UNRATE": "미국 실업률 (%)",
    "CPIAUCSL": "미국 CPI (지수, 2022=100)",
    "PAYEMS": "비농업고용 (천명)",
    "DGS10": "미국 10년물 금리 (%)",
    "DGS2": "미국 2년물 금리 (%)",
    "T10Y2Y": "10Y-2Y 스프레드 (%p)",
    "INDPRO": "산업생산지수 (2017=100)",
    "PCEPI": "PCE 물가지수 (2017=100)",
}

# BOK ECOS series definitions
BOK_SERIES_META: dict[str, dict] = {
    "722Y001": {
        "label": "한국은행 기준금리 (%)",
        "cycle": "M",
        "item1": "0101000",
        "item2": "",
    },
    "731Y003": {
        "label": "소비자물가지수 (2020=100)",
        "cycle": "M",
        "item1": "0",
        "item2": "",
    },
    "301Y013": {
        "label": "경상수지 (백만달러)",
        "cycle": "M",
        "item1": "",
        "item2": "",
    },
    "732Y004": {
        "label": "외환보유액 (백만달러)",
        "cycle": "M",
        "item1": "",
        "item2": "",
    },
}


# ---------------------------------------------------------------------------
# FRED
# ---------------------------------------------------------------------------

def _fetch_fred_one(series_id: str, api_key: str, limit: int = 14) -> list[tuple[str, str]]:
    """Fetch up to `limit` most recent observations for a FRED series.
    Returns list of (date, value) tuples, newest first."""
    params = {
        "series_id": series_id,
        "api_key": api_key,
        "file_type": "json",
        "sort_order": "desc",
        "limit": str(limit),
    }
    url = FRED_BASE + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "MarketResearchArchive/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return [
        (o["date"], o["value"])
        for o in data.get("observations", [])
        if o.get("value") not in (".", "", None)
    ]


def fetch_fred_data(series_ids: list[str], api_key: str) -> dict:
    """Fetch multiple FRED series. Returns {series_id: {label, observations, latest, prev, change}}."""
    if not api_key or not series_ids:
        return {"ok": False, "reason": "no_api_key" if not api_key else "no_series", "series": {}}

    result: dict[str, dict] = {}
    errors: list[str] = []

    for sid in series_ids:
        try:
            obs = _fetch_fred_one(sid, api_key, limit=14)
        except urllib.error.HTTPError as exc:
            errors.append(f"{sid}: HTTP {exc.code}")
            continue
        except Exception as exc:
            errors.append(f"{sid}: {exc}")
            continue

        if not obs:
            errors.append(f"{sid}: no data")
            continue

        latest_date, latest_val = obs[0]
        prev_date, prev_val = obs[1] if len(obs) >= 2 else (None, None)
        yoy_date, yoy_val = obs[12] if len(obs) >= 13 else (None, None)

        def _f(v):
            try:
                return float(v)
            except Exception:
                return None

        latest = _f(latest_val)
        prev = _f(prev_val)
        yoy = _f(yoy_val)

        change_mom = round(latest - prev, 4) if latest is not None and prev is not None else None
        change_yoy = round(latest - yoy, 4) if latest is not None and yoy is not None else None

        result[sid] = {
            "label": FRED_SERIES_META.get(sid, sid),
            "latestDate": latest_date,
            "latest": latest,
            "prevDate": prev_date,
            "changeMoM": change_mom,
            "yoyDate": yoy_date,
            "changeYoY": change_yoy,
            "observations": obs[:6],
        }

    return {"ok": bool(result), "series": result, "errors": errors}


# ---------------------------------------------------------------------------
# BOK ECOS
# ---------------------------------------------------------------------------

def _bok_date_range(months_back: int = 18) -> tuple[str, str]:
    """Return (start_yyyyMM, end_yyyyMM) covering the last `months_back` months."""
    today = dt.date.today()
    end = today.strftime("%Y%m")
    # Subtract months
    year = today.year
    month = today.month - months_back
    while month <= 0:
        month += 12
        year -= 1
    start = f"{year}{month:02d}"
    return start, end


def _fetch_bok_one(stat_code: str, meta: dict, api_key: str) -> list[tuple[str, str]]:
    """Fetch BOK ECOS series. Returns list of (period_yyyyMM, value) newest first."""
    start, end = _bok_date_range(18)
    cycle = meta.get("cycle", "M")
    item1 = meta.get("item1", "")
    item2 = meta.get("item2", "")

    # Build path: /{api_key}/json/kr/1/20/{stat_code}/{cycle}/{start}/{end}/{item1}/{item2}
    parts = [BOK_BASE, api_key, "json", "kr", "1", "20", stat_code, cycle, start, end]
    if item1:
        parts.append(item1)
    if item2:
        parts.append(item2)
    url = "/".join(parts)

    req = urllib.request.Request(url, headers={"User-Agent": "MarketResearchArchive/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    rows = data.get("StatisticSearch", {}).get("row", [])
    if not rows:
        # BOK returns error in a different key when it fails
        err = data.get("RESULT", {})
        code = err.get("CODE", "")
        msg = err.get("MESSAGE", "")
        raise ValueError(f"BOK API error {code}: {msg}")

    # Sort newest first by TIME (yyyyMM)
    pairs = [(r["TIME"], r["DATA_VALUE"]) for r in rows if r.get("DATA_VALUE") not in (None, "", " ")]
    pairs.sort(key=lambda x: x[0], reverse=True)
    return pairs


def fetch_bok_data(series_ids: list[str], api_key: str) -> dict:
    """Fetch multiple BOK ECOS series."""
    if not api_key or not series_ids:
        return {"ok": False, "reason": "no_api_key" if not api_key else "no_series", "series": {}}

    result: dict[str, dict] = {}
    errors: list[str] = []

    for sid in series_ids:
        meta = BOK_SERIES_META.get(sid)
        if not meta:
            errors.append(f"{sid}: unknown stat code")
            continue
        try:
            obs = _fetch_bok_one(sid, meta, api_key)
        except Exception as exc:
            errors.append(f"{sid}: {exc}")
            continue

        if not obs:
            errors.append(f"{sid}: no data")
            continue

        latest_period, latest_val = obs[0]
        prev_period, prev_val = obs[1] if len(obs) >= 2 else (None, None)
        yoy_period, yoy_val = obs[12] if len(obs) >= 13 else (None, None)

        def _f(v):
            try:
                return float(v.replace(",", "")) if v else None
            except Exception:
                return None

        latest = _f(latest_val)
        prev = _f(prev_val)
        yoy = _f(yoy_val)
        change_mom = round(latest - prev, 4) if latest is not None and prev is not None else None
        change_yoy = round(latest - yoy, 4) if latest is not None and yoy is not None else None

        result[sid] = {
            "label": meta["label"],
            "latestPeriod": latest_period,
            "latest": latest,
            "prevPeriod": prev_period,
            "changeMoM": change_mom,
            "yoyPeriod": yoy_period,
            "changeYoY": change_yoy,
            "observations": obs[:6],
        }

    return {"ok": bool(result), "series": result, "errors": errors}


# ---------------------------------------------------------------------------
# Combined fetch
# ---------------------------------------------------------------------------

def fetch_macro_data(
    fred_series: list[str],
    bok_series: list[str],
    fred_key: str,
    bok_key: str,
) -> dict:
    fred = fetch_fred_data(fred_series, fred_key) if fred_series and fred_key else {"ok": False, "reason": "skipped", "series": {}}
    bok = fetch_bok_data(bok_series, bok_key) if bok_series and bok_key else {"ok": False, "reason": "skipped", "series": {}}
    return {
        "ok": fred.get("ok") or bok.get("ok"),
        "fred": fred,
        "bok": bok,
    }


# ---------------------------------------------------------------------------
# Markdown formatter
# ---------------------------------------------------------------------------

def _fmt(v, digits=2):
    if v is None:
        return "-"
    return f"{v:.{digits}f}"


def _chg(v, unit=""):
    if v is None:
        return "-"
    sign = "+" if v >= 0 else ""
    return f"{sign}{v:.2f}{unit}"


def macro_data_to_markdown(macro: dict) -> str:
    if not macro.get("ok"):
        return "경제 지표 데이터 없음 (FRED_API_KEY / BOK_API_KEY를 설정에서 입력하세요)"

    lines: list[str] = []

    fred = macro.get("fred", {})
    if fred.get("ok") and fred.get("series"):
        lines += [
            "### 미국 경제 지표 (FRED)",
            "",
            "| 지표 | 최근값 | 기준일 | 전기 대비 | 전년 대비 |",
            "| --- | ---: | --- | ---: | ---: |",
        ]
        for sid, d in fred["series"].items():
            lines.append(
                f"| {d['label']} | {_fmt(d.get('latest'))} | {d.get('latestDate', '-')} "
                f"| {_chg(d.get('changeMoM'))} | {_chg(d.get('changeYoY'))} |"
            )
        if fred.get("errors"):
            lines.append(f"\n> FRED 조회 실패: {', '.join(fred['errors'][:3])}")
        lines.append("")

    bok = macro.get("bok", {})
    if bok.get("ok") and bok.get("series"):
        lines += [
            "### 한국 경제 지표 (BOK ECOS)",
            "",
            "| 지표 | 최근값 | 기준월 | 전기 대비 | 전년 대비 |",
            "| --- | ---: | --- | ---: | ---: |",
        ]
        for sid, d in bok["series"].items():
            lines.append(
                f"| {d['label']} | {_fmt(d.get('latest'))} | {d.get('latestPeriod', '-')} "
                f"| {_chg(d.get('changeMoM'))} | {_chg(d.get('changeYoY'))} |"
            )
        if bok.get("errors"):
            lines.append(f"\n> BOK 조회 실패: {', '.join(bok['errors'][:3])}")
        lines.append("")

    return "\n".join(lines) if lines else "경제 지표 데이터 없음"
