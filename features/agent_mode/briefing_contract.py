"""Shared output contract for API-parity Agent CLI briefings."""

from __future__ import annotations

import re
from collections import OrderedDict


# 시장별 제목과 섹션 라벨. 네 시장이 같은 골격을 쓰므로 섹션은 라벨 하나로 만든다.
MARKET_LABELS = {"us": "미국장", "kr": "한국장", "europe": "유럽장", "jp": "일본장"}
TITLE_REQUIREMENTS = {
    "us": "US Market Briefing",
    "kr": "Korea Market Briefing",
    "europe": "Europe Market Briefing",
    "jp": "Japan Market Briefing",
}
SINGLE_MARKETS = tuple(TITLE_REQUIREMENTS)
AGGREGATE_MARKETS = {"both": ("us", "kr"), "all": SINGLE_MARKETS}


def required_sections(market: str) -> tuple[str, ...]:
    label = MARKET_LABELS[market]
    return (
        TITLE_REQUIREMENTS[market],
        f"0. 오늘의 {label} 성격",
        f"1. {label} 시장 흐름",
        f"2. {label}을 움직인 핵심 변수",
        f"3. {label}을 주도한 기업 ①",
        f"4. {label}을 주도한 기업 ②",
        "5. 일반 투자자 관점",
        f"6. 다음 {label} 체크포인트",
        "오늘의 결론",
    )


US_REQUIRED_SECTIONS = required_sections("us")
KR_REQUIRED_SECTIONS = required_sections("kr")


def briefing_output_contract(
    market_scope: str = "both",
    briefing_type: str = "default",
    *,
    expected_titles: dict | None = None,
) -> dict:
    scope = str(market_scope or "both").strip().lower()
    if scope not in {*SINGLE_MARKETS, *AGGREGATE_MARKETS}:
        scope = "both"
    normalized_type = str(briefing_type or "default").strip().lower()
    if normalized_type not in {"default", "market_focused", "concise"}:
        normalized_type = "default"
    markets = AGGREGATE_MARKETS.get(scope, (scope,))
    sections = [section for market in markets for section in required_sections(market)]
    market_count = len(markets)
    sections.append("Source & Data Notes")
    return {
        "format": "markdown",
        "marketScope": scope,
        "requiredMarketTitles": [TITLE_REQUIREMENTS[key] for key in markets],
        "expectedTitles": dict(expected_titles or {}),
        "titleDatePattern": "YYYY.MM.DD 마감|장중",
        "requireImmediateSectionZeroAfterTitle": True,
        "requireLeadingCompanyNames": True,
        "requiredSections": sections,
        "briefingType": normalized_type,
        "minimumCharacters": (2500 if normalized_type == "concise" else 5000) * market_count,
        "minimumOneLineConclusions": 7 * market_count,
        "minimumMiddleDotBullets": 18 * market_count,
        "retryOnViolation": 1,
    }


def _market_keys_from_contract(contract: dict) -> list[str]:
    scope = str(contract.get("marketScope") or "").strip().lower()
    if scope in SINGLE_MARKETS:
        return [scope]
    if scope in AGGREGATE_MARKETS:
        return list(AGGREGATE_MARKETS[scope])
    required = " ".join(str(section) for section in contract.get("requiredSections") or [])
    if not required:
        return []
    keys = [key for key, title in TITLE_REQUIREMENTS.items() if title in required]
    # 범위도 제목도 없으면 예전 두 시장 계약으로 본다. 네 시장으로 넓히면
    # 만든 적 없는 시장의 섹션까지 요구하게 된다.
    return keys or ["us", "kr"]


def _title_line_match(value: str, title: str, expected_title: str = ""):
    if expected_title:
        return re.search(
            rf"^#\s+{re.escape(expected_title)}\s*$",
            value,
            re.MULTILINE,
        )
    return re.search(
        rf"^#\s+{re.escape(title)}\s+[—-]\s+\d{{4}}\.\d{{2}}\.\d{{2}}(?:\s+(?:마감|장중))?\s*$",
        value,
        re.MULTILINE,
    )


def _next_non_empty_line(value: str, start: int) -> str:
    for line in value[start:].splitlines():
        stripped = line.strip()
        if stripped:
            return stripped
    return ""


def _has_named_leading_company_heading(value: str, fragment: str) -> bool:
    pattern = re.compile(
        rf"^#{{2,6}}\s+{re.escape(fragment)}\s*[—-]\s*(.+?)\s*$",
        re.MULTILINE,
    )
    for match in pattern.finditer(value):
        company = match.group(1).strip()
        placeholder = company.strip("[]").strip()
        if placeholder and placeholder != "기업명":
            return True
    return False


def briefing_contract_violations(markdown: str, contract: dict) -> list[str]:
    value = str(markdown or "").strip()
    headings = [
        match.group(1).strip()
        for match in re.finditer(r"^#{1,6}\s+(.+?)\s*$", value, re.MULTILINE)
    ]
    normalized_headings = [heading.casefold() for heading in headings]
    required_counts = OrderedDict()
    for required in contract.get("requiredSections") or []:
        key = str(required).casefold()
        required_counts.setdefault(key, {"label": str(required), "count": 0})
        required_counts[key]["count"] += 1
    missing = []
    for fragment, item in required_counts.items():
        actual = sum(fragment in heading for heading in normalized_headings)
        if actual < item["count"]:
            missing.append(f"{item['label']} ({actual}/{item['count']}회)")
    violations = []
    if missing:
        violations.append(f"필수 제목 누락: {', '.join(missing)}")

    for key in _market_keys_from_contract(contract):
        title = TITLE_REQUIREMENTS[key]
        expected_title = str((contract.get("expectedTitles") or {}).get(key) or "").strip()
        match = _title_line_match(value, title, expected_title)
        if not match:
            if expected_title:
                violations.append(f"시장별 제목 불일치: '# {expected_title}' 필요")
            else:
                violations.append(f"시장별 제목 날짜 누락: '# {title} — YYYY.MM.DD 마감|장중' 형식 필요")
            continue
        if contract.get("requireImmediateSectionZeroAfterTitle", True):
            next_line = _next_non_empty_line(value, match.end())
            expected = "## 0. 오늘의 미국장 성격" if key == "us" else "## 0. 오늘의 한국장 성격"
            if not next_line.startswith(expected):
                violations.append(f"제목 다음 프리앰블 금지: '# {title}' 다음은 바로 '{expected}'이어야 함")

    if contract.get("requireLeadingCompanyNames", True):
        for key in _market_keys_from_contract(contract):
            prefix = "미국장" if key == "us" else "한국장"
            for ordinal in ("①", "②"):
                fragment = f"{3 if ordinal == '①' else 4}. {prefix}을 주도한 기업 {ordinal}"
                if not _has_named_leading_company_heading(value, fragment):
                    violations.append(f"주도 기업명 누락: '## {fragment} — [실제 기업명]' 형식 필요")

    minimum_characters = int(contract.get("minimumCharacters") or 0)
    if len(value) < minimum_characters:
        violations.append(f"최소 분량 미달: {len(value)}자 / {minimum_characters}자")

    conclusion_count = len(re.findall(r"\*\*\s*한 줄 결론\s*:\s*\*\*", value))
    minimum_conclusions = int(contract.get("minimumOneLineConclusions") or 0)
    if conclusion_count < minimum_conclusions:
        violations.append(f"한 줄 결론 부족: {conclusion_count}개 / {minimum_conclusions}개")

    bullet_count = len(re.findall(r"^\s*·\s+\S", value, re.MULTILINE))
    minimum_bullets = int(contract.get("minimumMiddleDotBullets") or 0)
    if bullet_count < minimum_bullets:
        violations.append(f"가운뎃점 요약 부족: {bullet_count}개 / {minimum_bullets}개")
    return violations
