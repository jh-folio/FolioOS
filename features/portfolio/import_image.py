"""Privacy-bounded screenshot preview orchestration."""
from __future__ import annotations

import tempfile
from pathlib import Path

from features.portfolio.import_schema import import_preview
from features.portfolio.local_ocr import extract_positions as extract_local, preprocess_image, tesseract_preflight, validate_image
from features.portfolio.vision_import import extract_positions as extract_vision

MAX_IMAGE_BYTES = 10 * 1024 * 1024
ALLOWED_MIME = {"image/png", "image/jpeg", "image/webp"}


def preview_image(data_dir: Path, image_bytes: bytes, *, content_type: str, mode: str = "local", consent: bool = False) -> dict:
    if content_type not in ALLOWED_MIME:
        raise ValueError("portfolio_image_type_invalid")
    if not image_bytes or len(image_bytes) > MAX_IMAGE_BYTES:
        raise ValueError("portfolio_image_size_invalid")
    suffix = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp"}[content_type]
    with tempfile.TemporaryDirectory(prefix="folio-portfolio-import-") as directory:
        source = Path(directory) / f"source{suffix}"
        processed = Path(directory) / "processed.png"
        source.write_bytes(image_bytes)
        validate_image(source, mime_type=content_type)
        if mode == "vision":
            rows = extract_vision(source, consent=consent, mime_type=content_type)
            engine = "external_vision"
            notices = ["선택한 crop만 외부 Vision provider에 전송했고 Folio OS에는 이미지를 보관하지 않았습니다."]
        else:
            preprocess_image(source, processed)
            rows, preflight = extract_local(processed)
            engine = "tesseract_local"
            notices = [] if preflight.get("ready") else [str(preflight.get("reason") or "tesseract_unavailable")]
        from features.portfolio.service import get_portfolio

        return import_preview(rows, get_portfolio(data_dir).get("positions") or [], engine=engine, notices=notices)


def preflight_payload() -> dict:
    return {**tesseract_preflight(), "autoInstall": False, "languagesRequired": ["kor", "eng"]}
