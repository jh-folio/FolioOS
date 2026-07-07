"""Shared low-level utilities used across feature modules."""
import datetime as dt
import html
import json
import re
from pathlib import Path


def normalize(text):
    text = html.unescape(str(text or ""))
    text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def now_iso():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def kst_date():
    return dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).strftime("%Y-%m-%d")


def read_json(path, fallback):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except Exception:
        return fallback


def write_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


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
