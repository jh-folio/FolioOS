"""Market-relevance gating for Evidence Intake RSS items.

A boolean gate that complements ``policy.calculate_relevance_score`` (numeric):
it drops vendor stock-quote pages, raw ticker-symbol headlines, and Korean
lifestyle/noise items that slip through generic feeds, so only market-relevant
news enters the archive. This is intentionally separate from the numeric score
so the threshold and the hard exclusions can evolve independently.
"""
from __future__ import annotations

import re

from features.common.research_library.rss.article import normalize_text

NOISY_TITLE_PATTERNS = [
    r"\bStock Price\s*&\s*Latest News\b",
    r"\bStock Analysis Prediction, Earnings, Dividend\b",
    r"^About .+\bETF\b",
    r"^[A-Z0-9.%-]{2,12}\s+-?\s*$",
    r"^\([A-Z0-9.%-]{2,12}\)\s+Stock Price",
    r"^\[포토\]",
    r"\b프라이스&\b",
    r"\b권 기자의 장바구니\b",
    r"\b바이어 생생노트\b",
]

MARKET_RELEVANCE_TERMS = [
    "주가", "증시", "코스피", "코스닥", "상장", "공시", "실적", "영업이익", "매출", "가이던스",
    "투자", "투자자", "외국인", "기관", "수급", "반도체", "ai", "인공지능", "데이터센터",
    "배터리", "2차전지", "자동차", "전기차", "방산", "금리", "환율", "유가", "관세", "규제",
    "정책", "정부", "국회", "산업", "공급망", "수출", "수입", "목표주가", "밸류에이션",
    "revenue", "earnings", "guidance", "shares", "stocks", "market", "semiconductor",
]

STRONG_MARKET_TERMS = [
    "주가", "증시", "코스피", "코스닥", "상장", "공시", "실적", "영업이익", "가이던스",
    "기관", "수급", "순매수", "순매도", "반도체", "배터리", "전기차", "방산", "금리",
    "환율", "유가", "관세", "규제", "정책", "목표주가", "밸류에이션",
]

MARKET_COMPANY_HINTS = [
    "삼성", "하이닉스", "현대차", "기아", "lg", "sk", "네이버", "카카오", "셀트리온",
    "두산", "한화", "포스코", "롯데", "cj", "hd현대", "엔비디아", "테슬라", "애플",
    "마이크로소프트", "구글", "메타", "아마존", "브로드컴", "델",
]

KOREAN_NOISE_TERMS = [
    "맛집", "외식", "랍스터", "홈다이닝", "여행", "여객", "패션", "뷰티", "화장품",
    "액세서리", "다이소", "빵덕후", "쇼핑백", "포토", "연예", "스포츠", "날씨",
    "할인", "세일", "가성비", "장바구니", "프라이스", "새벽배송", "선물세트",
]

_KOREAN_MEDIA_DOMAINS = ("hankyung.com", "mk.co.kr", "einfomax.co.kr")
_VENDOR_TICKER_RE = re.compile(r"\b[A-Z0-9]{2,8}\.(?:OQ|N|PK|HA|BO|NS|SG|TO|F|Z)\b")
_REUTERS_COMPANY_RE = re.compile(r"/markets/companies/[^/]+/?$", re.IGNORECASE)


def canonical_media(media: str, url: str = "", title: str = "") -> str:
    """Map known outlets to a stable display name from any URL/title hint."""
    hay = f"{url} {title}".lower()
    if "barrons.com" in hay or "barron's" in hay or "barrons" in hay:
        return "Barron's"
    if "wsj.com" in hay or "wall street journal" in hay:
        return "WSJ"
    if "marketwatch.com" in hay:
        return "MarketWatch"
    if "cnbc.com" in hay:
        return "CNBC"
    if "einfomax.co.kr" in hay:
        return "연합인포맥스"
    return media


def is_korean_media_link(link: str) -> bool:
    return any(domain in (link or "") for domain in _KOREAN_MEDIA_DOMAINS)


def is_market_relevant_item(title: str, description: str, link: str) -> bool:
    text = normalize_text(f"{title} {description} {link}").lower()
    relevant = sum(1 for term in MARKET_RELEVANCE_TERMS if term.lower() in text)
    strong = sum(1 for term in STRONG_MARKET_TERMS if term.lower() in text)
    company = any(term.lower() in text for term in MARKET_COMPANY_HINTS)
    noise = sum(1 for term in KOREAN_NOISE_TERMS if term.lower() in text)
    if is_korean_media_link(link):
        if re.search(r"^\s*\[포토\]", title or ""):
            return False
        if noise >= 2 and strong < 2:
            return False
        return relevant >= 1 or company
    return relevant >= 1 or company


def should_archive_item(title: str, description: str, link: str) -> bool:
    """Hard gate: reject vendor pages, raw ticker headlines, and off-topic noise."""
    for pattern in NOISY_TITLE_PATTERNS:
        if re.search(pattern, title or "", re.IGNORECASE):
            return False
    if "reuters.com" in (link or "") and _REUTERS_COMPANY_RE.search(link or ""):
        return False
    if _VENDOR_TICKER_RE.search(title or ""):
        return False
    return is_market_relevant_item(title, description, link)
