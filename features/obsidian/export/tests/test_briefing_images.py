import base64
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[4]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.obsidian.export.service import _write_briefing_chart_images, export_briefing_to_obsidian


PNG_1X1 = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


def test_briefing_chart_images_write_valid_png_and_safe_svg_assets():
    valid = "data:image/png;base64," + base64.b64encode(PNG_1X1).decode("ascii")
    svg = {
        "mimeType": "image/svg+xml",
        "svgText": '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>',
        "id": "heatmap",
    }
    with TemporaryDirectory() as tmp:
        folder = Path(tmp) / "Briefings"
        folder.mkdir()
        links = _write_briefing_chart_images(folder, "2026-06-20", [valid, svg, {"mimeType": "image/svg+xml", "svgText": "<svg onload='x'></svg>"}])
        assert links == [
            "![[assets/briefing-2026-06-20-visual-1.png]]",
            "![[assets/briefing-2026-06-20-visual-2.svg]]",
        ]
        assert (folder / "assets" / "briefing-2026-06-20-visual-1.png").read_bytes() == PNG_1X1
        assert "<rect" in (folder / "assets" / "briefing-2026-06-20-visual-2.svg").read_text(encoding="utf-8")


def test_combined_briefing_writes_market_notes_tags_and_matching_images():
    valid = "data:image/png;base64," + base64.b64encode(PNG_1X1).decode("ascii")
    report = {
        "date": "2026-06-22", "marketScope": "both", "briefingType": "market_focused",
        "briefings": {
            "us": {"markdown": "# US Market Briefing\n\nUS only"},
            "kr": {"markdown": "# Korea Market Briefing\n\nKR only"},
        },
    }
    images = [
        {"dataUrl": valid, "market": "US", "id": "us-chart", "title": "US chart"},
        {"dataUrl": valid, "market": "KR", "id": "kr-chart", "title": "KR chart"},
        {"dataUrl": "data:image/png;base64,bad", "market": "US", "id": "bad"},
    ]
    with TemporaryDirectory() as tmp, patch(
        "features.obsidian.export.service.get_vault_settings", return_value={"vaultPath": tmp}
    ):
        result = export_briefing_to_obsidian("2026-06-22", report, images)
        folder = Path(tmp) / "Briefings"
        us_note = (folder / "브리핑 2026-06-22 미국장.md").read_text(encoding="utf-8")
        kr_note = (folder / "브리핑 2026-06-22 한국장.md").read_text(encoding="utf-8")

        assert len(result["exports"]) == 2
        assert result["filename"] == "브리핑 2026-06-22 미국장.md"
        assert "market: us" in us_note and "briefing_type: market_focused" in us_note
        assert "  - 미국장" in us_note and "  - 시황중심" in us_note
        assert "US only" in us_note and "KR only" not in us_note
        assert "briefing-2026-06-22-us-visual-1.png" in us_note
        assert "briefing-2026-06-22-kr-visual-1.png" not in us_note
        assert "market: kr" in kr_note and "  - 한국장" in kr_note
        assert "briefing-2026-06-22-kr-visual-1.png" in kr_note
        assert result["exports"][0]["chartImageCount"] == 1
        assert result["exports"][1]["chartImageCount"] == 1


def test_single_scope_export_preserves_existing_user_notes_and_legacy_image_input():
    valid = "data:image/png;base64," + base64.b64encode(PNG_1X1).decode("ascii")
    report = {
        "date": "2026-06-22", "marketScope": "us", "briefingType": "concise",
        "markdown": "# US Market Briefing\n\nUpdated",
    }
    with TemporaryDirectory() as tmp, patch(
        "features.obsidian.export.service.get_vault_settings", return_value={"vaultPath": tmp}
    ):
        folder = Path(tmp) / "Briefings"
        folder.mkdir(parents=True)
        note = folder / "브리핑 2026-06-22 미국장.md"
        note.write_text("old\n\n---\n## 사용자 메모\nkeep me", encoding="utf-8")

        result = export_briefing_to_obsidian("2026-06-22", report, [valid])
        content = note.read_text(encoding="utf-8")

        assert len(result["exports"]) == 1
        assert "Updated" in content and "keep me" in content
        assert "briefing-2026-06-22-us-visual-1.png" in content
