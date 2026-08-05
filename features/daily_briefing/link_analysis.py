"""Cross-market connection analysis for aggregate briefings.

Rule-based by default (works with no LLM). It contrasts the markets' drivers and
always states limits, so it stays source-grounded and never argues the reader
into a connection the evidence does not support. The output is a separate layer:
it never mutates any market's Canonical markdown.

Four markets make six pairs, and a report that walks all six is noise rather
than analysis. So the default narrative follows the **session chain** — the
order the sessions actually closed — and pairwise metadata is kept only for
pairs that share at least one driver.
"""
from __future__ import annotations

import datetime as dt

from features.daily_briefing.issue_selection import derive_link_status
from features.daily_briefing.schema import (
    MARKET_TAGS,
    SINGLE_MARKET_SCOPES,
    market_keys_for_briefing_scope,
)

STATUS_LABEL = {
    "connected": "강하게 연결됨",
    "selectively_connected": "부분적으로 연결됨",
    "independent": "독립적으로 움직임",
    "insufficient_evidence": "연결 근거 부족",
}

# 전 세계 시장이 같은 값을 놓고 반응하는 채널. 한 시장의 고유 재료가 아니라
# 어느 시장에서 나오든 같은 값을 가리키므로, 여러 시장에 동시에 잡히면
# 우연한 겹침이 아니라 실제 공통 채널로 볼 근거가 된다.
GLOBAL_CHANNEL_DRIVERS = ("금리", "환율/달러", "원자재/유가")

# 세션 마감 시각을 한국시간 기준 (세션일로부터의 일수, 시, 분)으로 근사한 값.
# 서머타임에 따라 한 시간 움직이지만 시장 간 순서를 바꾸지는 않으므로,
# 전달 경로를 정렬하는 목적에는 이 근사로 충분하다.
_SESSION_CLOSE_KST = {
    "europe": (1, 0, 30),   # 런던 16:30 → KST 익일 00:30
    "us": (1, 5, 0),        # 뉴욕 16:00 ET → KST 익일 05:00~06:00
    "jp": (0, 15, 30),      # 도쿄 15:30 = KST 15:30
    "kr": (0, 15, 30),      # 서울 15:30
}


def _market_label(scope):
    return MARKET_TAGS.get(str(scope or "").lower(), str(scope or "").upper())


def _driver_names(result):
    drivers = (result or {}).get("marketDrivers") or []
    ordered = sorted(drivers, key=lambda d: float(d.get("score") or 0), reverse=True)
    names, seen = [], set()
    for driver in ordered:
        name = str(driver.get("driver") or "").strip()
        key = name.casefold()
        if name and key not in seen:
            seen.add(key)
            names.append(name)
    return names


def _bullets(lines, empty):
    if not lines:
        return f"- {empty}"
    return "\n".join(f"- {line}" for line in lines)


def _session_date(market_windows, scope):
    windows = market_windows or {}
    session = (windows.get("marketSessions") or {}).get(scope) or {}
    explicit = str(session.get("sessionDate") or "").strip()
    if explicit:
        return explicit
    if scope == "us":
        return str(windows.get("usRegularSessionDate") or "").strip()
    if scope == "kr":
        return str(
            windows.get("krCurrentSessionDate") or windows.get("krPreviousSessionDate") or ""
        ).strip()
    return ""


def _close_moment(scope, session_date):
    """When this session closed, in Korean time, for ordering the chain.

    Pre-open Japan and Korea describe the *previous* day's session, which closed
    before Europe's and America's overnight sessions. Ordering on a fixed market
    list would then state a transmission path that runs backwards in time.
    """
    offset = _SESSION_CLOSE_KST.get(scope)
    if not offset or not session_date:
        return None
    try:
        day = dt.date.fromisoformat(str(session_date)[:10])
    except ValueError:
        return None
    days, hour, minute = offset
    return dt.datetime.combine(day + dt.timedelta(days=days), dt.time(hour, minute))


def _ordered_markets(scopes, market_windows):
    dated = []
    for scope in scopes:
        session_date = _session_date(market_windows, scope)
        dated.append((_close_moment(scope, session_date), scope, session_date))
    known = sorted(
        (row for row in dated if row[0] is not None),
        key=lambda row: (row[0], SINGLE_MARKET_SCOPES.index(row[1])),
    )
    unknown = [row for row in dated if row[0] is None]
    return [(scope, session_date) for _, scope, session_date in (*known, *unknown)]


def _driver_market_map(driver_sets):
    """driver -> markets that surfaced it, preserving the given market order."""
    mapping = {}
    for scope, names in driver_sets.items():
        for name in names:
            mapping.setdefault(name, []).append(scope)
    return mapping


def _shared(driver_sets, left, right):
    right_set = set(driver_sets.get(right, []))
    return [name for name in driver_sets.get(left, []) if name in right_set]


def _transmission_paths(ordered, driver_sets):
    """Adjacent links along the session chain, only where a driver is shared.

    Adjacency is what makes a claim of transmission plausible at all: a driver
    shared by two sessions that never ran consecutively says less than one
    carried between neighbouring closes.
    """
    paths = []
    for (from_scope, from_date), (to_scope, to_date) in zip(ordered, ordered[1:]):
        shared = _shared(driver_sets, from_scope, to_scope)
        if not shared:
            continue
        paths.append({
            "from": from_scope.upper(),
            "to": to_scope.upper(),
            "fromSessionDate": from_date,
            "toSessionDate": to_date,
            "sharedDrivers": shared,
        })
    return paths


def _pairwise(scopes, driver_sets):
    """Pairs that share a driver. Pairs with nothing in common are not recorded.

    Emitting all six pairs of four markets would bury the two or three carrying
    evidence under the three or four carrying none.
    """
    pairs = []
    for index, left in enumerate(scopes):
        for right in scopes[index + 1:]:
            shared = _shared(driver_sets, left, right)
            if shared:
                pairs.append({"markets": [left.upper(), right.upper()], "sharedDrivers": shared})
    return pairs


def _global_channels(driver_map):
    return [
        {"channel": driver, "markets": [scope.upper() for scope in driver_map[driver]]}
        for driver in GLOBAL_CHANNEL_DRIVERS
        if len(driver_map.get(driver) or []) >= 2
    ]


def _cross_market_status(scopes, driver_sets, results):
    """Overall status across every market, not just the first pair.

    A market with no issues at all makes the whole picture insufficient rather
    than independent — absence of evidence is not evidence of decoupling.
    """
    if len(scopes) < 2:
        return "insufficient_evidence"
    if any(not (results.get(scope) or {}).get("issueCoverageRaw") for scope in scopes):
        return "insufficient_evidence"
    shared_pairs = strong_pairs = total = 0
    for index, left in enumerate(scopes):
        for right in scopes[index + 1:]:
            total += 1
            shared = _shared(driver_sets, left, right)
            if shared:
                shared_pairs += 1
            if len(shared) >= 2:
                strong_pairs += 1
    if not total:
        return "insufficient_evidence"
    if strong_pairs * 2 >= total:
        return "connected"
    if shared_pairs:
        return "selectively_connected"
    return "independent"


def build_cross_market_analysis(
    results,
    *,
    market_windows=None,
    market_tape=None,
    aggregate_scope="all",
    link_status=None,
):
    """One global analysis over whichever markets actually generated.

    A market missing from ``results`` drops out of the chain instead of blocking
    the analysis: three markets still explain more than nothing.
    """
    market_windows = market_windows or {}
    expected = market_keys_for_briefing_scope(aggregate_scope)
    available = [scope for scope in expected if isinstance((results or {}).get(scope), dict)]
    if not available:
        return None

    ordered = _ordered_markets(available, market_windows)
    scopes = [scope for scope, _ in ordered]
    session_dates = dict(ordered)
    driver_sets = {scope: _driver_names(results[scope]) for scope in scopes}
    driver_map = _driver_market_map({scope: driver_sets[scope] for scope in scopes})

    common = [
        {"driver": name, "markets": [scope.upper() for scope in markets]}
        for name, markets in driver_map.items()
        if len(markets) >= 2
    ]
    specific = {
        scope: [name for name in driver_sets[scope] if len(driver_map.get(name, [])) == 1]
        for scope in scopes
    }
    # 다른 어느 시장과도 동인을 공유하지 않는 시장. "연결이 약하다"가 아니라
    # "이 자료에서는 따로 움직였다"는 관찰이다.
    decoupled = [
        scope.upper() for scope in scopes
        if not any(len(driver_map.get(name) or []) >= 2 for name in driver_sets[scope])
    ]

    status = link_status or _cross_market_status(scopes, driver_sets, results)
    paths = _transmission_paths(ordered, driver_sets)
    pairs = _pairwise(scopes, driver_sets)
    channels = _global_channels(driver_map)

    chain_line = " → ".join(
        f"{_market_label(scope)}({session_dates.get(scope) or '기준일 미상'})" for scope in scopes
    )
    path_lines = [
        f"{_market_label(row['from'])} → {_market_label(row['to'])}: {', '.join(row['sharedDrivers'])}"
        for row in paths
    ]

    limitations = [
        "이 연결 분석은 각 시장 본문의 동인을 규칙 기반으로 대조한 추정이며, 인과를 단정하지 않습니다.",
        "공통 동인이라도 시장별 반응 방향과 강도는 다를 수 있으므로 각 시장 본문과 함께 읽어야 합니다.",
    ]
    missing = [scope for scope in expected if scope not in scopes]
    if missing:
        limitations.append(
            f"{', '.join(_market_label(scope) for scope in missing)} 브리핑이 없어 "
            "해당 시장은 이 분석에서 빠져 있습니다."
        )
    if decoupled:
        limitations.append(
            f"{', '.join(_market_label(scope) for scope in decoupled)}는 이번 자료에서 "
            "다른 시장과 공유하는 동인이 확인되지 않았습니다."
        )

    markdown = "\n".join([
        "## 시장 간 연결 요약",
        "",
        f"**연결 상태:** {STATUS_LABEL.get(status, status)}",
        "",
        f"**세션 순서(한국시간 마감 기준):** {chain_line}",
        "",
        "### 공통 흐름",
        _bullets(
            [f"{row['driver']} — {', '.join(_market_label(m) for m in row['markets'])}" for row in common],
            "여러 시장에서 공통으로 잡힌 동인이 뚜렷하지 않습니다.",
        ),
        "",
        "### 전달 경로",
        _bullets(path_lines, "인접한 세션 사이에서 이어지는 동인이 확인되지 않았습니다."),
        "",
        "### 글로벌 채널",
        _bullets(
            [f"{row['channel']} — {', '.join(_market_label(m) for m in row['markets'])}" for row in channels],
            "금리·환율·원자재에서 여러 시장에 동시에 걸친 채널이 확인되지 않았습니다.",
        ),
        "",
        "### 시장별 고유 동인",
        _bullets(
            [f"{_market_label(scope)}: {', '.join(specific[scope])}" for scope in scopes if specific[scope]],
            "시장별 고유 동인이 충분히 식별되지 않았습니다.",
        ),
        "",
        "### 한계와 불확실성",
        _bullets(limitations, "추가로 밝힐 한계가 없습니다."),
    ])

    return {
        "schemaVersion": 2,
        "status": status,
        "includedMarkets": [scope.upper() for scope in scopes],
        "expectedMarkets": [scope.upper() for scope in expected],
        "sessionDates": {scope.upper(): session_dates.get(scope, "") for scope in scopes},
        "sessionChain": [scope.upper() for scope in scopes],
        "commonDrivers": common,
        "marketSpecificDrivers": {scope.upper(): specific[scope] for scope in scopes},
        "transmissionPaths": paths,
        "globalChannels": channels,
        "decoupledMarkets": decoupled,
        "pairs": pairs,
        "limitations": limitations,
        "markdown": markdown,
    }


def build_link_analysis(us_result, kr_result, *, market_windows=None, market_tape=None, link_status=None):
    """Legacy two-market adapter.

    Saved `both` briefings and their readers use `usOnlyDrivers`/`krOnlyDrivers`
    and the old heading, so the two-market path keeps those keys rather than
    renaming them under existing consumers.
    """
    us_names = _driver_names(us_result)
    kr_names = _driver_names(kr_result)
    us_keys = {name.casefold() for name in us_names}
    kr_keys = {name.casefold() for name in kr_names}
    shared = [name for name in us_names if name.casefold() in kr_keys]
    us_only = [name for name in us_names if name.casefold() not in kr_keys]
    kr_only = [name for name in kr_names if name.casefold() not in us_keys]

    status = link_status or derive_link_status(
        (us_result or {}).get("issueCoverageRaw") or [],
        (kr_result or {}).get("issueCoverageRaw") or [],
    )

    windows = market_windows or {}
    us_prev = str(windows.get("usPreviousSessionDate") or "").strip()
    kr_cur = str(
        windows.get("krCurrentSessionDate") or windows.get("krPreviousSessionDate") or ""
    ).strip()
    if us_prev or kr_cur:
        spillover = (
            f"미국장 {us_prev or '직전 정규장'} 마감 흐름이 한국장 {kr_cur or '당일'} "
            "개장·장중에 어떻게 반영되는지를 함께 봅니다."
        )
    else:
        spillover = "두 시장의 세션 시차(미국 전일 마감 → 한국 당일 개장)를 기준으로 흐름을 함께 봅니다."

    markdown = "\n".join([
        "## 한미 시장 연결 분석",
        "",
        f"**연결 상태:** {STATUS_LABEL.get(status, status)}",
        "",
        "### 공통 흐름",
        _bullets(shared, "두 시장에서 공통으로 잡힌 동인이 뚜렷하지 않습니다."),
        "",
        "### 미국장 고유 동인",
        _bullets(us_only, "미국장 고유 동인이 충분히 식별되지 않았습니다."),
        "",
        "### 한국장 고유 동인",
        _bullets(kr_only, "한국장 고유 동인이 충분히 식별되지 않았습니다."),
        "",
        "### 스필오버",
        spillover,
        "",
        "### 한계와 불확실성",
        "- 이 연결 분석은 두 시장 본문의 동인·이슈를 규칙 기반으로 대조한 추정이며, 인과를 단정하지 않습니다.",
        "- 공통 동인이라도 시장별 반응 방향·강도는 다를 수 있으므로 각 시장 본문과 함께 읽어야 합니다.",
    ])

    return {
        "status": status,
        "sharedDrivers": shared,
        "usOnlyDrivers": us_only,
        "krOnlyDrivers": kr_only,
        "spillover": spillover,
        "markdown": markdown,
    }
