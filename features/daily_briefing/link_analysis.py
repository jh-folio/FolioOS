"""US↔KR cross-market connection analysis for 종합(both) briefings.

Rule-based by default (works with no LLM). Reuses the existing market drivers
and `derive_link_status` so the analysis stays source-grounded: it contrasts the
two markets' drivers and always states limits/uncertainty (confirmation-bias
guard). The output is a separate layer — it never mutates either market's
Canonical markdown.
"""
from __future__ import annotations

from features.daily_briefing.issue_selection import derive_link_status


STATUS_LABEL = {
    "connected": "강하게 연결됨",
    "selectively_connected": "부분적으로 연결됨",
    "independent": "독립적으로 움직임",
    "insufficient_evidence": "연결 근거 부족",
}


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


def _bullets(names, empty):
    if not names:
        return f"- {empty}"
    return "\n".join(f"- {name}" for name in names)


def build_link_analysis(us_result, kr_result, *, market_windows=None, market_tape=None, link_status=None):
    market_windows = market_windows or {}
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

    us_prev = str(market_windows.get("usPreviousSessionDate") or "").strip()
    kr_cur = str(
        market_windows.get("krCurrentSessionDate")
        or market_windows.get("krPreviousSessionDate")
        or ""
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
