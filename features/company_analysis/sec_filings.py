#!/usr/bin/env python3
from __future__ import annotations

import datetime as dt
import html
import json
import os
import re
import urllib.request
from pathlib import Path

from features.company_analysis.sec_companyfacts import normalize_cik, sec_user_agent

SEC_SUBMISSIONS_URL = "https://data.sec.gov/submissions/CIK{cik}.json"
SEC_ARCHIVES_BASE = "https://www.sec.gov/Archives/edgar/data"

SECTOR_KEYWORDS = {
    "Semiconductors": {
        "items": ["1", "1A", "7", "7A"],
        "keywords": ["data center", "gpu", "semiconductor", "ai", "accelerated computing", "supply", "inventory", "customer", "margin", "export control"],
    },
    "Internet": {
        "items": ["1", "1A", "7"],
        "keywords": ["advertising", "cloud", "ai", "users", "engagement", "traffic", "regulation", "privacy", "margin", "capex"],
    },
    "Software": {
        "items": ["1", "1A", "7"],
        "keywords": ["cloud", "subscription", "arr", "retention", "ai", "security", "enterprise", "margin", "revenue"],
    },
    "Mobility": {
        "items": ["1", "1A", "7", "7A"],
        "keywords": ["mobility", "delivery", "freight", "driver", "consumer", "marketplace", "gross bookings", "take rate", "insurance", "regulation"],
    },
    "Healthcare": {
        "items": ["1", "1A", "7"],
        "keywords": ["reimbursement", "pharmaceutical", "distribution", "customer", "margin", "regulation", "opioid", "working capital"],
    },
    "Industrials": {
        "items": ["1", "1A", "7", "7A"],
        "keywords": ["machinery", "equipment", "construction", "mining", "energy", "transportation", "dealer", "manufacturing", "backlog", "inventory", "services", "margin", "cyclical"],
    },
    "Machinery": {
        "items": ["1", "1A", "7", "7A"],
        "keywords": ["machinery", "equipment", "construction", "mining", "energy", "transportation", "dealer", "manufacturing", "backlog", "inventory", "services", "margin", "cyclical"],
    },
}

DEFAULT_PROFILE = {
    "items": ["1", "1A", "7", "7A", "8"],
    "keywords": ["revenue", "margin", "growth", "risk", "competition", "customer", "cash flow", "liquidity", "regulation", "strategy"],
}

VALUATION_KEYWORDS = [
    "free cash flow", "operating cash flow", "capital expenditures", "capex", "depreciation",
    "amortization", "working capital", "interest expense", "tax rate", "effective tax",
    "share repurchase", "repurchases", "dividend", "capital allocation", "debt", "liquidity",
    "segment", "backlog", "pricing", "guidance", "outlook", "demand", "inventory",
]


def read_json(path: Path, fallback=None):
    if not path.exists():
        return fallback
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def fetch_text(url: str, cache_path: Path, ttl_hours: int = 24) -> tuple[str, str]:
    cached = read_json(cache_path, None)
    if cached and cached.get("text") and cached.get("fetchedAt"):
        try:
            fetched = dt.datetime.fromisoformat(cached["fetchedAt"])
            if dt.datetime.now(dt.timezone.utc) - fetched < dt.timedelta(hours=ttl_hours):
                return cached["text"], cached.get("error", "")
        except Exception:
            pass
    req = urllib.request.Request(url, headers={"User-Agent": sec_user_agent(), "Accept": "text/html,application/json"})
    try:
        with urllib.request.urlopen(req, timeout=int(os.environ.get("SEC_TIMEOUT_SECONDS", "30"))) as resp:
            raw = resp.read()
        text = raw.decode("utf-8", errors="replace")
        write_json(cache_path, {"fetchedAt": dt.datetime.now(dt.timezone.utc).isoformat(), "url": url, "text": text, "error": ""})
        return text, ""
    except Exception as exc:
        if cached and cached.get("text"):
            return cached["text"], f"using cached SEC filing after fetch error: {exc}"
        write_json(cache_path, {"fetchedAt": dt.datetime.now(dt.timezone.utc).isoformat(), "url": url, "text": "", "error": str(exc)})
        return "", str(exc)


def get_company_submissions(cik: str, cache_dir: Path) -> tuple[dict, str]:
    cik = normalize_cik(cik)
    if not cik:
        return {}, "missing CIK"
    text, error = fetch_text(SEC_SUBMISSIONS_URL.format(cik=cik), cache_dir / "submissions" / f"CIK{cik}.json", ttl_hours=12)
    if not text:
        return {}, error
    try:
        return json.loads(text), error
    except Exception as exc:
        return {}, str(exc)


def latest_10k_metadata(cik: str, cache_dir: Path) -> dict:
    data, error = get_company_submissions(cik, cache_dir)
    recent = data.get("filings", {}).get("recent", {}) if data else {}
    forms = recent.get("form", []) or []
    accessions = recent.get("accessionNumber", []) or []
    docs = recent.get("primaryDocument", []) or []
    dates = recent.get("filingDate", []) or []
    reports = recent.get("reportDate", []) or []
    for idx, form in enumerate(forms):
        if form == "10-K" and idx < len(accessions) and idx < len(docs):
            accession = accessions[idx]
            accession_plain = accession.replace("-", "")
            cik_plain = str(int(cik))
            url = f"{SEC_ARCHIVES_BASE}/{cik_plain}/{accession_plain}/{docs[idx]}"
            return {
                "ok": True,
                "cik": cik,
                "entityName": data.get("name", ""),
                "sic": data.get("sic", ""),
                "sicDescription": data.get("sicDescription", ""),
                "form": form,
                "accession": accession,
                "filingDate": dates[idx] if idx < len(dates) else "",
                "reportDate": reports[idx] if idx < len(reports) else "",
                "primaryDocument": docs[idx],
                "url": url,
                "error": error,
            }
    return {"ok": False, "cik": cik, "error": error or "No recent 10-K found"}


def html_to_paragraphs(markup: str) -> list[str]:
    text = re.sub(r"(?is)<script[^>]*>.*?</script>|<style[^>]*>.*?</style>", " ", markup)
    text = re.sub(r"(?i)</(p|div|tr|li|h[1-6])>", "\n", text)
    text = re.sub(r"(?is)<[^>]+>", " ", text)
    text = html.unescape(text)
    text = re.sub(r"[ \t\xa0]+", " ", text)
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
    paragraphs = []
    for line in lines:
        if len(line) < 80:
            continue
        if re.fullmatch(r"[\d\s.,$%()/-]+", line):
            continue
        paragraphs.append(line)
    return paragraphs


def item_for_paragraph(paragraph: str, current_item: str) -> str:
    match = re.search(r"\bITEM\s+(1A|1B|1|7A|7|8|9A|9B|9)\b", paragraph, flags=re.I)
    if match:
        return match.group(1).upper()
    return current_item


def profile_for_sector(sector: str) -> dict:
    label = str(sector or "").strip()
    if label in SECTOR_KEYWORDS:
        return SECTOR_KEYWORDS[label]
    lower = label.lower()
    if any(token in lower for token in ["machinery", "construction", "industrial", "equipment", "manufacturing"]):
        return SECTOR_KEYWORDS["Machinery"]
    return DEFAULT_PROFILE


def score_paragraph(paragraph: str, *, sector: str, item: str) -> tuple[int, list[str]]:
    profile = profile_for_sector(sector)
    hay = paragraph.lower()
    hits = []
    score = 0
    if item in profile["items"]:
        score += 8
    for keyword in profile["keywords"]:
        if keyword.lower() in hay:
            hits.append(keyword)
            score += 5
    for keyword in ["revenue", "operating income", "cash flow", "margin", "risk", "competition", "regulation", "liquidity"]:
        if keyword in hay and keyword not in hits:
            hits.append(keyword)
            score += 2
    for keyword in VALUATION_KEYWORDS:
        if keyword in hay and keyword not in hits:
            hits.append(keyword)
            score += 3
    if item in {"7", "7A", "8"} and any(keyword in hay for keyword in VALUATION_KEYWORDS):
        score += 5
    if 180 <= len(paragraph) <= 1800:
        score += 2
    if len(paragraph) > 2600:
        score -= 3
    return score, hits


def ranked_10k_paragraphs(company: dict, cache_dir: Path, max_paragraphs: int = 14) -> dict:
    cik = normalize_cik(company.get("cik", ""))
    if not cik:
        return {"ok": False, "reason": "no_cik", "paragraphs": [], "metadata": {}}
    metadata = latest_10k_metadata(cik, cache_dir)
    if not metadata.get("ok"):
        return {"ok": False, "reason": "no_10k", "paragraphs": [], "metadata": metadata}
    html_text, error = fetch_text(metadata["url"], cache_dir / "html_10k" / f"{cik}_{metadata['accession']}.json", ttl_hours=24 * 30)
    if not html_text:
        metadata["error"] = error
        return {"ok": False, "reason": "fetch_failed", "paragraphs": [], "metadata": metadata}
    sector = company.get("sector", "")
    if not sector or sector == "Unclassified":
        sector = metadata.get("sicDescription", "")
    rows = []
    current_item = ""
    for para in html_to_paragraphs(html_text):
        current_item = item_for_paragraph(para, current_item)
        score, hits = score_paragraph(para, sector=sector, item=current_item)
        if score <= 0:
            continue
        rows.append(
            {
                "item": current_item or "Unknown",
                "score": score,
                "keywords": hits[:8],
                "text": para[:1800],
            }
        )
    rows.sort(key=lambda row: (row["score"], len(row["keywords"])), reverse=True)
    return {"ok": True, "metadata": metadata, "paragraphs": rows[:max_paragraphs], "count": len(rows)}


def ranked_paragraphs_to_markdown(result: dict) -> str:
    metadata = result.get("metadata", {}) or {}
    if not result.get("ok"):
        return f"SEC 10-K HTML paragraphs unavailable: {result.get('reason') or metadata.get('error') or 'unknown'}"
    lines = [
        "SEC 10-K HTML filing metadata",
        f"- Form: {metadata.get('form', '')}",
        f"- Filing date: {metadata.get('filingDate', '')}",
        f"- Report date: {metadata.get('reportDate', '')}",
        f"- Accession: {metadata.get('accession', '')}",
        f"- URL: {metadata.get('url', '')}",
        "",
        "Top scored 10-K paragraphs by sector/GICS profile",
    ]
    for idx, row in enumerate(result.get("paragraphs", []), 1):
        lines.append(
            f"[{idx}] Item {row.get('item')} | score={row.get('score')} | keywords={', '.join(row.get('keywords', []))}\n"
            f"{row.get('text', '')}\n"
        )
    return "\n".join(lines)

