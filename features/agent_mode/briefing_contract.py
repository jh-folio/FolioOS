"""Shared output contract for API-parity Agent CLI briefings."""

from __future__ import annotations

import re
from collections import OrderedDict


TITLE_REQUIREMENTS = {
    "us": "US Market Briefing",
    "kr": "Korea Market Briefing",
}

US_REQUIRED_SECTIONS = (
    "US Market Briefing",
    "0. 오늘의 미국장 성격",
    "1. 미국장 시장 흐름",
    "2. 미국장을 움직인 핵심 변수",
    "3. 미국장을 주도한 기업 ①",
    "4. 미국장을 주도한 기업 ②",
    "5. 일반 투자자 관점",
    "6. 다음 미국장 체크포인트",
    "오늘의 결론",
)

KR_REQUIRED_SECTIONS = (
    "Korea Market Briefing",
    "0. 오늘의 한국장 성격",
    "1. 한국장 시장 흐름",
    "2. 한국장을 움직인 핵심 변수",
    "3. 한국장을 주도한 기업 ①",
    "4. 한국장을 주도한 기업 ②",
    "5. 일반 투자자 관점",
    "6. 다음 한국장 체크포인트",
    "오늘의 결론",
)


def briefing_output_contract(market_scope: str = "both", briefing_type: str = "default") -> dict:
    scope = str(market_scope or "both").strip().lower()
    if scope not in {"us", "kr", "both"}:
        scope = "both"
    normalized_type = str(briefing_type or "default").strip().lower()
    if normalized_type not in {"default", "market_focused", "concise"}:
        normalized_type = "default"
    sections = []
    market_count = 0
    if scope in {"us", "both"}:
        sections.extend(US_REQUIRED_SECTIONS)
        market_count += 1
    if scope in {"kr", "both"}:
        sections.extend(KR_REQUIRED_SECTIONS)
        market_count += 1
    sections.append("Source & Data Notes")
    return {
        "format": "markdown",
        "marketScope": scope,
        "requiredMarketTitles": [
            TITLE_REQUIREMENTS[key]
            for key in (("us", "kr") if scope == "both" else (scope,))
        ],
        "titleDatePattern": "YYYY.MM.DD",
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
    if scope in {"us", "kr"}:
        return [scope]
    if scope == "both":
        return ["us", "kr"]
    required = " ".join(str(section) for section in contract.get("requiredSections") or [])
    if not required:
        return []
    keys = []
    if "US Market Briefing" in required:
        keys.append("us")
    if "Korea Market Briefing" in required:
        keys.append("kr")
    return keys or ["us", "kr"]


def _title_line_match(value: str, title: str):
    return re.search(
        rf"^#\s+{re.escape(title)}\s+[—-]\s+\d{{4}}\.\d{{2}}\.\d{{2}}\s*$",
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
        match = _title_line_match(value, title)
        if not match:
            violations.append(f"시장별 제목 날짜 누락: '# {title} — YYYY.MM.DD' 형식 필요")
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
