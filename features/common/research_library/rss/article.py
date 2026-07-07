"""Public article body and summary extraction for Evidence Intake.

Fetches only public article HTML and derives a summary + (optionally usable)
full text. Paywall/login gates are detected and reported as
``needs_manual_save`` rather than bypassed. The orchestrator decides whether
the extracted full text is persisted (``--save-full-text``).
"""
from __future__ import annotations

import html
import re
from urllib.parse import urlsplit

from features.common.research_library.rss.fetch import fetch_url_text
from features.common.research_library.rss.policy import looks_paywalled

MIN_FULL_TEXT_CHARS = 700
MAX_FULL_TEXT_CHARS = 12000

# Aggregator hosts whose item links are JS redirect stubs, not article pages.
# Fetching them returns the aggregator's own boilerplate (e.g. Google News
# "Comprehensive up-to-date news coverage...") which must never replace the
# feed-provided description.
AGGREGATOR_REDIRECT_HOSTS = {"news.google.com"}

_META_DESC_PATTERNS = (
    r'<meta[^>]+(?:name|property)=["\'](?:description|og:description|twitter:description)["\'][^>]+content=["\']([^"\']+)["\']',
    r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:name|property)=["\'](?:description|og:description|twitter:description)["\']',
)
_BODY_BLOCK_PATTERNS = (
    r"<article[^>]*>([\s\S]*?)</article>",
    r"<main[^>]*>([\s\S]*?)</main>",
    r'<div[^>]+(?:class|id)=["\'][^"\']*(?:article|story|content|body)[^"\']*["\'][^>]*>([\s\S]*?)</div>',
)
_BOILERPLATE_PATTERNS = (
    r"Subscribe to continue.*",
    r"Sign in to continue.*",
    r"Advertisement\s+",
    r"Skip to main content\s+",
)


def normalize_text(text) -> str:
    """Strip scripts/styles/markup and collapse whitespace to plain text."""
    text = html.unescape(str(text or ""))
    for tag in ("script", "style", "noscript"):
        text = re.sub(rf"<{tag}[\s\S]*?</{tag}>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def extract_meta_description(markup: str) -> str:
    for pattern in _META_DESC_PATTERNS:
        match = re.search(pattern, markup, re.I)
        if match:
            return normalize_text(match.group(1))
    return ""


def extract_article_text(markup: str) -> str:
    candidates = []
    for pattern in _BODY_BLOCK_PATTERNS:
        for match in re.finditer(pattern, markup, re.I):
            text = normalize_text(match.group(1))
            if len(text) > 300:
                candidates.append(text)
    paragraph_text = normalize_text(
        " ".join(re.findall(r"<p[^>]*>([\s\S]*?)</p>", markup, re.I))
    )
    if len(paragraph_text) > 300:
        candidates.append(paragraph_text)
    if not candidates:
        fallback = normalize_text(markup)
        if len(fallback) > 300:
            candidates.append(fallback)
    if not candidates:
        return ""
    candidates.sort(key=len, reverse=True)
    text = candidates[0]
    for pattern in _BOILERPLATE_PATTERNS:
        text = re.sub(pattern, " ", text, flags=re.I)
    return normalize_text(text)[:MAX_FULL_TEXT_CHARS]


def collect_article_body(url: str, rss_description: str) -> dict:
    """Resolve a status + summary + full text for one article URL.

    Status is one of ``rss_only``/``fetch_failed``/``needs_manual_save``/
    ``full_text``/``summary_only`` and drives downstream retry policy.
    """
    if not url:
        return {"status": "rss_only", "summary": rss_description, "full_text": "", "error": "missing url"}
    host = urlsplit(url).netloc.lower()
    host = host[4:] if host.startswith("www.") else host
    if host in AGGREGATOR_REDIRECT_HOSTS:
        status = "summary_only" if rss_description else "needs_manual_save"
        return {"status": status, "summary": rss_description, "full_text": "", "error": "aggregator redirect url; source article html not fetched"}
    try:
        markup = fetch_url_text(url)
    except Exception as exc:  # noqa: BLE001 - network errors are broad
        return {"status": "fetch_failed", "summary": rss_description, "full_text": "", "error": str(exc)}
    summary = extract_meta_description(markup) or rss_description
    full_text = extract_article_text(markup)
    # A sufficiently long extracted body without a gate phrase inside it means
    # the article itself was publicly served; subscribe banners elsewhere in
    # the page markup must not veto it.
    if len(full_text) >= MIN_FULL_TEXT_CHARS and not looks_paywalled(full_text):
        return {"status": "full_text", "summary": summary, "full_text": full_text, "error": ""}
    if looks_paywalled(markup):
        return {"status": "needs_manual_save", "summary": summary or rss_description, "full_text": "", "error": "paywall or login gate detected"}
    if summary:
        return {"status": "summary_only", "summary": summary, "full_text": "", "error": "full text too short or unavailable"}
    return {"status": "needs_manual_save", "summary": rss_description, "full_text": "", "error": "no usable summary or full text"}
