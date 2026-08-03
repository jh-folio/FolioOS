"""Local Tesseract adapter. Raw text and word boxes never leave this module."""
from __future__ import annotations

import csv
import io
import shutil
import subprocess
from pathlib import Path

MAX_IMAGE_PIXELS = 40_000_000


def validate_image(image_path: Path, *, mime_type: str) -> None:
    try:
        from PIL import Image, UnidentifiedImageError
    except ImportError as exc:
        raise RuntimeError("pillow_not_installed") from exc
    expected = {"image/png": {"PNG"}, "image/jpeg": {"JPEG"}, "image/webp": {"WEBP"}}.get(mime_type, set())
    try:
        with Image.open(image_path) as image:
            width, height = image.size
            if width <= 0 or height <= 0 or width * height > MAX_IMAGE_PIXELS:
                raise ValueError("portfolio_image_dimensions_invalid")
            if expected and str(image.format or "").upper() not in expected:
                raise ValueError("portfolio_image_content_mismatch")
            image.verify()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise ValueError("portfolio_image_invalid") from exc


def tesseract_preflight() -> dict:
    executable = shutil.which("tesseract")
    if not executable:
        return {"available": False, "languages": [], "ready": False, "reason": "tesseract_not_installed"}
    try:
        result = subprocess.run([executable, "--list-langs"], capture_output=True, text=True, timeout=5, check=False)
        languages = [line.strip() for line in result.stdout.splitlines()[1:] if line.strip()]
    except (OSError, subprocess.TimeoutExpired):
        return {"available": True, "languages": [], "ready": False, "reason": "tesseract_preflight_failed"}
    ready = "kor" in languages and "eng" in languages
    return {"available": True, "languages": languages, "ready": ready, "reason": "" if ready else "kor_eng_language_missing"}


def preprocess_image(source: Path, target: Path) -> None:
    try:
        from PIL import Image, ImageEnhance, ImageFilter, ImageOps
    except ImportError as exc:
        raise RuntimeError("pillow_not_installed") from exc
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert("L")
        image = ImageOps.autocontrast(image)
        image = ImageEnhance.Contrast(image).enhance(1.6)
        image = image.filter(ImageFilter.SHARPEN)
        image.save(target, format="PNG")


def _rows_from_tsv(raw_tsv: str) -> list[dict]:
    groups: dict[tuple[str, str, str], list[tuple[int, str]]] = {}
    for row in csv.DictReader(io.StringIO(raw_tsv), delimiter="\t"):
        text = str(row.get("text") or "").strip()
        if not text:
            continue
        key = (str(row.get("block_num") or ""), str(row.get("par_num") or ""), str(row.get("line_num") or ""))
        try:
            left = int(row.get("left") or 0)
        except ValueError:
            left = 0
        groups.setdefault(key, []).append((left, text))
    lines = [[text for _, text in sorted(words)] for words in groups.values()]
    parsed = []
    for words in lines:
        ticker = next((word for word in words if _looks_like_ticker(word)), "")
        if not ticker:
            continue
        ticker_index = words.index(ticker)
        numeric = [word for word in words[ticker_index + 1:] if any(ch.isdigit() for ch in word)]
        parsed.append({
            "ticker": ticker,
            "name": " ".join(words[:ticker_index])[:120],
            "quantity": numeric[0] if numeric else None,
            "averagePrice": numeric[1] if len(numeric) > 1 else None,
        })
    return parsed


def _looks_like_ticker(value: str) -> bool:
    from features.portfolio.import_schema import ticker

    return bool(ticker(value))


def extract_positions(image_path: Path) -> tuple[list[dict], dict]:
    preflight = tesseract_preflight()
    if not preflight["ready"]:
        return [], preflight
    executable = shutil.which("tesseract")
    try:
        result = subprocess.run(
            [str(executable), str(image_path), "stdout", "-l", "kor+eng", "tsv"],
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError("tesseract_timeout") from exc
    if result.returncode != 0:
        raise RuntimeError("tesseract_failed")
    return _rows_from_tsv(result.stdout), preflight
