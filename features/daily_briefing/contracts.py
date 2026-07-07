"""Regression-contract helpers for the daily briefing upgrade."""

from __future__ import annotations

from collections import Counter


LEGACY_OUTPUT_SECTIONS = (
    "## 0. 오늘의 시장 성격",
    "## 1. 시장 흐름",
    "## 2. 시장을 움직인 핵심 변수",
    "## 3. 시장을 주도한 기업 ①",
    "## 4. 시장을 주도한 기업 ②",
    "## 5. 일반 투자자 관점",
    "## 6. 내일 확인할 체크포인트",
    "## 오늘의 결론",
)

US_OUTPUT_SECTIONS = (
    "# US Market Briefing — YYYY.MM.DD",
    "## 0. 오늘의 미국장 성격",
    "## 1. 미국장 시장 흐름",
    "## 2. 미국장을 움직인 핵심 변수",
    "## 3. 미국장을 주도한 기업 ①",
    "## 4. 미국장을 주도한 기업 ②",
    "## 5. 일반 투자자 관점",
    "## 6. 다음 미국장 체크포인트",
    "## 오늘의 결론",
)

KR_OUTPUT_SECTIONS = (
    "# Korea Market Briefing — YYYY.MM.DD",
    "## 0. 오늘의 한국장 성격",
    "## 1. 한국장 시장 흐름",
    "## 2. 한국장을 움직인 핵심 변수",
    "## 3. 한국장을 주도한 기업 ①",
    "## 4. 한국장을 주도한 기업 ②",
    "## 5. 일반 투자자 관점",
    "## 6. 다음 한국장 체크포인트",
    "## 오늘의 결론",
)

PROMPT_REQUIRED_RULES = (
    "하루를 하나의 이야기로 엮어라",
    "자료 사용 우선순위와 웹 검색 보완",
    "품질 기준을 먼저 만족시키며 작성하라",
    "날짜와 시장 기준을 먼저 명확히 하라",
    "기사 발행일과 시장 거래일을 구분하라",
    "브리핑 대상일별 분석 우선순위",
    "미국장과 한국장의 관계를 먼저 판단하라",
    "입력 자료에 없는 숫자를 추정하지 않는다",
    "특정 종목 매수·매도 조언처럼 쓰지 않는다",
)

LEGACY_REPORT_FIELDS = (
    "date",
    "generatedAt",
    "title",
    "summary",
    "prompt",
    "promptPath",
    "markdown",
    "headlines",
    "sources",
    "generation",
    "marketSnapshot",
    "koreaMarketData",
    "marketWindows",
    "marketDrivers",
    "checkpoints",
    "dataGaps",
    "marketTape",
    "stats",
)


def prompt_contract_errors(prompt_text):
    text = str(prompt_text or "")
    errors = [f"missing rule: {rule}" for rule in PROMPT_REQUIRED_RULES if rule not in text]
    if "# US Market Briefing" in text and "# Korea Market Briefing" not in text:
        sections = US_OUTPUT_SECTIONS
    elif "# Korea Market Briefing" in text and "# US Market Briefing" not in text:
        sections = KR_OUTPUT_SECTIONS
    else:
        sections = LEGACY_OUTPUT_SECTIONS
    errors += [f"missing section: {section}" for section in sections if section not in text]
    return errors


def report_contract_errors(report):
    if not isinstance(report, dict):
        return ["report must be an object"]
    return [f"missing field: {field}" for field in LEGACY_REPORT_FIELDS if field not in report]


def source_distribution_metrics(sources):
    """Compute concentration metrics without retaining article-level data."""
    names = []
    for item in sources or []:
        if isinstance(item, dict):
            name = str(item.get("source") or item.get("publisher") or "Unknown")
        else:
            name = str(item or "Unknown")
        names.append(name)
    counts = Counter(names)
    total = sum(counts.values())
    if not total:
        return {
            "total": 0,
            "publisherCount": 0,
            "maxPublisherShare": 0.0,
            "topTwoShare": 0.0,
            "sourceConcentration": 0.0,
            "counts": {},
        }
    shares = sorted((count / total for count in counts.values()), reverse=True)
    return {
        "total": total,
        "publisherCount": len(counts),
        "maxPublisherShare": round(shares[0], 6),
        "topTwoShare": round(sum(shares[:2]), 6),
        "sourceConcentration": round(sum(share * share for share in shares), 6),
        "counts": dict(counts),
    }


def issue_label_fixture_errors(items, minimum_items=50):
    if not isinstance(items, list):
        return ["fixture must be an array"]
    errors = []
    if len(items) < minimum_items:
        errors.append(f"fixture requires at least {minimum_items} items")
    required = ("id", "title", "publisher", "expectedCluster")
    seen = set()
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            errors.append(f"item {index} must be an object")
            continue
        for field in required:
            if not item.get(field):
                errors.append(f"item {index} missing {field}")
        item_id = item.get("id")
        if item_id in seen:
            errors.append(f"duplicate id: {item_id}")
        seen.add(item_id)
        if item.get("path") or item.get("url"):
            errors.append(f"item {index} must not contain local paths or URLs")
    return errors

