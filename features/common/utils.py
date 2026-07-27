"""Shared low-level utilities used across feature modules."""
import datetime as dt
import html
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

from bs4 import BeautifulSoup

from features.common.canonical_report_io import safe_child_path


def strip_html_text(value, *, separator=" "):
    """Return visible text without executable/style elements."""
    text = str(value or "")
    if "<" not in text:
        return html.unescape(text)
    soup = BeautifulSoup(text, "html.parser")
    for element in soup(["script", "style"]):
        element.decompose()
    return html.unescape(soup.get_text(separator=separator))


def url_hostname(value):
    text = str(value or "").strip()
    if not text:
        return ""
    candidate = text if "://" in text or text.startswith("//") else f"//{text}"
    try:
        return str(urlsplit(candidate).hostname or "").lower().rstrip(".")
    except ValueError:
        return ""


def url_host_matches(value, *domains):
    hostname = url_hostname(value)
    return bool(hostname) and any(
        hostname == domain.lower().rstrip(".")
        or hostname.endswith(f".{domain.lower().rstrip('.')}")
        for domain in domains
        if str(domain or "").strip()
    )


def normalize(text):
    text = strip_html_text(text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def now_iso():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def kst_date():
    return dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).strftime("%Y-%m-%d")


def _bounded_path(path, root):
    return safe_child_path(Path(root), Path(path).name)


def read_json(path, fallback, *, root=None):
    try:
        candidate = _bounded_path(path, root) if root is not None else Path(path)
        # Callers that accept external identifiers pass an explicit storage root.
        # codeql[py/path-injection]
        return json.loads(candidate.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def write_json(path, data, *, root=None):
    candidate = _bounded_path(path, root) if root is not None else Path(path)
    # Callers that accept external identifiers pass an explicit storage root.
    # codeql[py/path-injection]
    candidate.parent.mkdir(parents=True, exist_ok=True)
    # Sensitive feature payloads are redacted at their owning schema boundary.
    # codeql[py/path-injection]
    # codeql[py/clear-text-storage-sensitive-data]
    candidate.write_text(  # lgtm[py/clear-text-storage-sensitive-data]
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def clean_brief_text(text, limit=420):
    text = normalize(text)
    text = re.sub(r"Original link:\s*https?://\S+", " ", text, flags=re.I)
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"(^|\s)#\s*", " ", text)
    text = re.sub(r"\s+-\s+Reuters\s*$", "", text, flags=re.I)
    text = re.sub(r"\s+", " ", text).strip(" -")
    return text[:limit]


EMBEDDED_SECTION_RE = re.compile(r"#{1,6}\s*(Summary|Full Text|Collection Notes)\b[:\s]*", re.I)
FULL_TEXT_PLACEHOLDER = "full text is not saved by default"


def clean_embedded_sections(text):
    """단일 필드에 새 포맷 body 섹션(`## Summary`/`## Full Text`/`## Collection Notes`)이
    통째로 들어간 경우 Summary 본문만 추출한다. 섹션 마커가 없으면 원문을 그대로 돌려준다."""
    value = str(text or "").strip()
    if not value:
        return ""
    matches = list(EMBEDDED_SECTION_RE.finditer(value))
    if not matches:
        return value
    sections = {}
    for i, match in enumerate(matches):
        label = match.group(1).lower()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(value)
        segment = value[match.end():end].strip()
        if label not in sections:
            sections[label] = segment
    summary = sections.get("summary", "")
    full_text = sections.get("full text", "")
    if FULL_TEXT_PLACEHOLDER in full_text.lower():
        full_text = ""
    prefix = value[: matches[0].start()].strip()
    return summary or full_text or prefix


def summarize(text, sentences=3):
    parts = re.split(r"(?<=[.!?。！？])\s+|(?<=다\.)\s+", normalize(text))
    parts = [p.strip() for p in parts if len(p.strip()) > 25]
    return " ".join(parts[:sentences])[:900]
