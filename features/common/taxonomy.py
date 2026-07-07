"""Canonical tag vocabulary — single source of truth for all tag labels.

All features that generate or consume tags should use normalize_tag() to
ensure consistent labels. When adding a new canonical tag, add it to
CANONICAL_TAGS and extend TAG_ALIASES with its common aliases.
"""

# ---------------------------------------------------------------------------
# Canonical tag labels
# ---------------------------------------------------------------------------

CANONICAL_SECTOR_TAGS: list[str] = [
    "Semiconductors", "AI", "Data Centers", "Battery",
    "Energy", "Defense", "Financials", "Automobiles",
]

CANONICAL_IMPACT_TAGS: list[str] = [
    "규제", "금리", "환율", "공급망", "수급", "매출 성장", "마진",
]

CANONICAL_TAGS: list[str] = CANONICAL_SECTOR_TAGS + CANONICAL_IMPACT_TAGS

# ---------------------------------------------------------------------------
# Alias → canonical label
# Keys use lowercase with underscores for spaces.
# ---------------------------------------------------------------------------

TAG_ALIASES: dict[str, str] = {
    # AI
    "ai": "AI",
    "artificial_intelligence": "AI",
    "machine_learning": "AI",
    "llm": "AI",
    "large_language_model": "AI",
    "인공지능": "AI",
    "생성형_ai": "AI",
    # Semiconductors
    "semiconductor": "Semiconductors",
    "semiconductors": "Semiconductors",
    "chip": "Semiconductors",
    "chips": "Semiconductors",
    "반도체": "Semiconductors",
    # Data Centers
    "data_center": "Data Centers",
    "data_centers": "Data Centers",
    "hyperscaler": "Data Centers",
    "데이터센터": "Data Centers",
    # Battery
    "battery": "Battery",
    "배터리": "Battery",
    "2차전지": "Battery",
    "리튬": "Battery",
    # Energy
    "energy": "Energy",
    "에너지주": "Energy",
    "에너지섹터": "Energy",
    "crude_oil": "Energy",
    "oil_price": "Energy",
    "원유": "Energy",
    "유가": "Energy",
    "원전": "Energy",
    "정유": "Energy",
    # Defense
    "defense": "Defense",
    "방산": "Defense",
    "군수": "Defense",
    # Financials
    "financials": "Financials",
    "financial": "Financials",
    "financial_services": "Financials",
    "financial services": "Financials",
    "금융": "Financials",
    "금융주": "Financials",
    # Automobiles
    "automobiles": "Automobiles",
    "automotive": "Automobiles",
    "automaker": "Automobiles",
    "자동차": "Automobiles",
    "전기차": "Automobiles",
    "완성차": "Automobiles",
    # Impact: 규제
    "tariff": "규제",
    "tariffs": "규제",
    "regulation": "규제",
    "sanction": "규제",
    "규제": "규제",
    "관세": "규제",
    "제재": "규제",
    # Impact: 금리
    "rate": "금리",
    "rates": "금리",
    "yield": "금리",
    "fed": "금리",
    "fomc": "금리",
    "금리": "금리",
    "연준": "금리",
    # Impact: 환율
    "fx": "환율",
    "foreign_exchange": "환율",
    "currency": "환율",
    "dollar": "환율",
    "환율": "환율",
    "원달러": "환율",
    # Impact: 공급망
    "supply_chain": "공급망",
    "inventory": "공급망",
    "공급망": "공급망",
    "재고": "공급망",
    # Impact: 수급
    "foreign_flow": "수급",
    "foreign_flows": "수급",
    "수급": "수급",
    # Impact: 매출 성장
    "revenue": "매출 성장",
    "sales": "매출 성장",
    "매출": "매출 성장",
    "매출_성장": "매출 성장",
    # Impact: 마진
    "margin": "마진",
    "마진": "마진",
    "원가": "마진",
}

INDUSTRY_ALIASES: dict[str, str] = {
    "ai": "AI",
    "artificial_intelligence": "AI",
    "semiconductor": "Semiconductors",
    "semiconductors": "Semiconductors",
    "hardware": "Hardware",
    "internet": "Internet",
}


def normalize_tag(tag: str) -> str:
    """Return the canonical form of a tag string.

    Tries TAG_ALIASES by: exact match → lowercase → lowercase+underscore.
    Falls back to the stripped original if no alias is found.
    """
    t = str(tag or "").strip()
    return (
        TAG_ALIASES.get(t)
        or TAG_ALIASES.get(t.lower())
        or TAG_ALIASES.get(t.lower().replace(" ", "_"))
        or t
    )


def canonical_tag(tag: str) -> str:
    """normalize_tag alias — kept for backward compatibility with market_memory."""
    return normalize_tag(tag)


def canonical_industry(ind: str) -> str:
    """Return canonical industry label via INDUSTRY_ALIASES."""
    t = str(ind or "").strip()
    return (
        INDUSTRY_ALIASES.get(t)
        or INDUSTRY_ALIASES.get(t.lower())
        or INDUSTRY_ALIASES.get(t.lower().replace(" ", "_"))
        or t
    )
