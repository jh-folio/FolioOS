"""Evidence intake policy helpers for RSS collection."""
from __future__ import annotations

from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


STRONG_MARKET_TERMS = {
    "주가",
    "증시",
    "코스피",
    "코스닥",
    "공시",
    "실적",
    "영업이익",
    "가이던스",
    "반도체",
    "전기차",
    "금리",
    "환율",
    "유가",
    "관세",
    "revenue",
    "earnings",
    "guidance",
}
GENERAL_MARKET_TERMS = {
    "market",
    "stock",
    "stocks",
    "shares",
    "demand",
    "supply",
    "sales",
    "investment",
    "ai",
    "semiconductor",
    "data center",
    "fed",
    "yield",
    "매출",
    "투자",
    "수급",
    "공급망",
    "수출",
    "정책",
}
COMPANY_HINTS = {
    "삼성",
    "하이닉스",
    "현대차",
    "기아",
    "lg",
    "sk",
    "네이버",
    "카카오",
    "엔비디아",
    "테슬라",
    "애플",
    "마이크로소프트",
    "브로드컴",
}
NOISE_TERMS = {
    "맛집",
    "여행",
    "패션",
    "뷰티",
    "스포츠",
    "연예",
    "날씨",
    "할인",
    "세일",
}
# Gate phrases only. Bare words like "구독"/"로그인" appear in the footer of
# virtually every Korean news page (newsletter buttons) and caused free
# articles (연합뉴스/매경/한경) to be misclassified as paywalled.
PAYWALL_TERMS = {
    "subscribe to continue",
    "sign in to continue",
    "register to continue",
    "already a subscriber",
    "subscription required",
    "this article is for subscribers",
    "구독 후 이용",
    "구독자 전용",
    "유료 회원 전용",
    "유료회원 전용",
    "로그인 후 이용",
    "로그인 후 계속",
}
TRACKING_QUERY_KEYS = {
    "fbclid",
    "gclid",
    "mc_cid",
    "mc_eid",
    "cmpid",
    "ref",
    "smid",
}


def normalize_url(url: str) -> str:
    """Return a stable URL key for dedupe without changing the original URL."""
    raw = str(url or "").strip()
    if not raw:
        return ""
    parts = urlsplit(raw)
    scheme = (parts.scheme or "https").lower()
    netloc = parts.netloc.lower()
    if netloc.startswith("www."):
        netloc = netloc[4:]
    path = parts.path.rstrip("/") or parts.path
    query_rows = []
    for key, value in parse_qsl(parts.query, keep_blank_values=True):
        low = key.lower()
        if low.startswith("utm_") or low in TRACKING_QUERY_KEYS:
            continue
        query_rows.append((key, value))
    query = urlencode(sorted(query_rows), doseq=True)
    return urlunsplit((scheme, netloc, path, query, ""))


def should_store_full_text(save_full_text: bool, public_mode: bool = False) -> bool:
    return bool(save_full_text) and not bool(public_mode)


def should_retry_existing_item(existing_status: str, *, retry_failed: bool = False, retry_summary_only: bool = False) -> bool:
    status = str(existing_status or "").strip().lower()
    if status == "fetch_failed":
        return bool(retry_failed)
    if status in {"summary_only", "needs_manual_save", "legacy_rss"}:
        return bool(retry_summary_only)
    return False


def calculate_relevance_score(item: dict) -> float:
    text = " ".join(str(item.get(key) or "") for key in ("title", "description", "summary", "url", "link")).lower()
    score = 0.0
    score += sum(2 for term in STRONG_MARKET_TERMS if term.lower() in text)
    score += sum(1 for term in GENERAL_MARKET_TERMS if term.lower() in text)
    if any(term.lower() in text for term in COMPANY_HINTS):
        score += 2
    score -= sum(2 for term in NOISE_TERMS if term.lower() in text)
    if str(item.get("source_type") or "").startswith("official"):
        score += 3
    return score


def looks_paywalled(text: str) -> bool:
    hay = str(text or "").lower()
    return any(term in hay for term in PAYWALL_TERMS)
