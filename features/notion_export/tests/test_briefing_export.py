import sys
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.notion_export.service import export_briefing


def _report(scope="both"):
    report = {
        "date": "2026-06-22", "marketScope": scope, "briefingType": "market_focused",
        "markdown": "# Combined\n\nFallback",
    }
    if scope == "both":
        report["briefings"] = {
            "us": {"markdown": "# US Market Briefing\n\nUS only"},
            "kr": {"markdown": "# Korea Market Briefing\n\nKR only"},
        }
    return report


def test_combined_briefing_creates_market_pages_with_matching_images():
    images = [
        {"dataUrl": "data:image/png;base64,US", "market": "US", "id": "us"},
        {"dataUrl": "data:image/png;base64,KR", "market": "KR", "id": "kr"},
    ]
    calls = []

    def fake_create(token, database_id, **kwargs):
        calls.append(kwargs)
        return {"id": f"page-{len(calls)}", "url": f"https://notion.test/{len(calls)}"}

    with patch("features.notion_export.service._require_config", return_value={"token": "t", "dbId": "d"}), \
         patch("features.notion_export.service._imgbb_key", return_value="key"), \
         patch("features.notion_export.service.upload_image_to_imgbb", side_effect=lambda image, key: f"https://img.test/{image[-2:]}.png"), \
         patch("features.notion_export.service.create_page", side_effect=fake_create):
        result = export_briefing("2026-06-22", _report(), images)

    assert len(result["exports"]) == 2
    assert result["notionUrl"] == "https://notion.test/1"
    assert [call["title"] for call in calls] == ["브리핑 2026-06-22 미국장", "브리핑 2026-06-22 한국장"]
    assert [call["page_type"] for call in calls] == ["미국장 · 시황중심", "한국장 · 시황중심"]
    assert "US only" in str(calls[0]["blocks"]) and "KR only" not in str(calls[0]["blocks"])
    assert "US.png" in str(calls[0]["blocks"]) and "KR.png" not in str(calls[0]["blocks"])
    assert "KR.png" in str(calls[1]["blocks"]) and "US.png" not in str(calls[1]["blocks"])


def test_image_upload_failure_keeps_text_page_and_single_scope_compatibility():
    calls = []
    with patch("features.notion_export.service._require_config", return_value={"token": "t", "dbId": "d"}), \
         patch("features.notion_export.service._imgbb_key", return_value="key"), \
         patch("features.notion_export.service.upload_image_to_imgbb", return_value=None), \
         patch("features.notion_export.service.create_page", side_effect=lambda *args, **kwargs: calls.append(kwargs) or {"id": "one", "url": "https://notion.test/one"}):
        result = export_briefing(
            "2026-06-22", _report("us"),
            [{"dataUrl": "data:image/png;base64,US", "market": "US"}],
        )

    assert len(result["exports"]) == 1
    assert result["pageId"] == "one"
    assert result["title"] == "브리핑 2026-06-22 미국장"
    assert "Fallback" in str(calls[0]["blocks"])
    assert all(block["type"] != "image" for block in calls[0]["blocks"])
