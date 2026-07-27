import json
import sys
from pathlib import Path

try:
    from pypdf import PdfReader
except Exception:
    print(json.dumps({"ok": False, "error": "pypdf_import_failed"}))
    sys.exit(0)


def extract(path):
    reader = PdfReader(path)
    pages = []
    for i, page in enumerate(reader.pages):
        try:
            text = page.extract_text() or ""
        except Exception:
            text = f"\n[Page {i + 1} extraction failed]\n"
        pages.append(text)
    return "\n\n".join(pages)


if len(sys.argv) < 2:
    print(json.dumps({"ok": False, "error": "Missing PDF path"}))
    sys.exit(0)

pdf_path = Path(sys.argv[1])
try:
    text = extract(str(pdf_path))
    print(json.dumps({
        "ok": True,
        "path": str(pdf_path),
        "pages": len(PdfReader(str(pdf_path)).pages),
        "text": text
    }, ensure_ascii=False))
except Exception:
    print(json.dumps({"ok": False, "error": "pdf_extraction_failed"}, ensure_ascii=False))

