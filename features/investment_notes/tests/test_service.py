from pathlib import Path
from unittest.mock import patch

from features.investment_notes import service


def test_save_note_marks_user_text_as_hypothesis(tmp_path):
    notes_dir = tmp_path / "notes"
    db_path = tmp_path / "market-memory.sqlite3"
    with patch.object(service, "NOTES_DIR", notes_dir), patch.object(service, "MARKET_MEMORY_DB_PATH", db_path):
        note = service.save_note({
            "noteType": "company_thesis",
            "title": "NVDA thesis",
            "body": "AI capex 가설",
            "ticker": "nvda",
            "linkedReports": ["NVDA"],
            "tags": ["AI", "AI"],
        })

        assert note["ticker"] == "NVDA"
        assert note["layer"] == "hypothesis"
        assert note["sourceLayer"] == "user_synthesis"
        assert note["reuseAsHypothesis"] is True
        assert note["reuseAsEvidence"] is False
        assert note["tags"] == ["AI"]
        assert (notes_dir / f"{note['id']}.json").exists()


def test_list_notes_uses_native_note_index(tmp_path):
    notes_dir = tmp_path / "notes"
    db_path = tmp_path / "market-memory.sqlite3"
    with patch.object(service, "NOTES_DIR", notes_dir), patch.object(service, "MARKET_MEMORY_DB_PATH", db_path):
        service.save_note({"title": "달러 메모", "topic": "달러", "body": "강달러 부담"})
        service.save_note({"title": "NVDA", "ticker": "NVDA", "body": "마진 체크"})

        rows = service.list_notes(ticker="NVDA")

        assert len(rows) == 1
        assert rows[0]["title"] == "NVDA"
        assert "body" not in rows[0]
        assert rows[0]["summary"] == "마진 체크"


def test_update_note_preserves_created_at_and_updates_body(tmp_path):
    notes_dir = tmp_path / "notes"
    db_path = tmp_path / "market-memory.sqlite3"
    with patch.object(service, "NOTES_DIR", notes_dir), patch.object(service, "MARKET_MEMORY_DB_PATH", db_path):
        first = service.save_note({"title": "초안", "body": "old"})
        second = service.save_note({"id": first["id"], "title": "수정", "body": "new"})
        loaded = service.get_note(first["id"])

        assert second["createdAt"] == first["createdAt"]
        assert loaded["title"] == "수정"
        assert loaded["body"] == "new"


def test_save_note_preserves_user_thoughts_and_agent_interaction_log(tmp_path):
    notes_dir = tmp_path / "notes"
    db_path = tmp_path / "market-memory.sqlite3"
    with patch.object(service, "NOTES_DIR", notes_dir), patch.object(service, "MARKET_MEMORY_DB_PATH", db_path):
        note = service.save_note({
            "title": "NVDA 생각 정리",
            "body": "## 현재 관점\n\nAI 수혜는 유효하지만 가격 부담을 확인한다.",
            "rawThoughts": [
                {
                    "role": "user",
                    "body": "이 주식은 앞으로 받을 수혜가 커 보여서 관심 있음",
                    "createdAt": "2026-07-06T09:00:00+09:00",
                }
            ],
            "interactionLog": [
                {
                    "role": "agent",
                    "body": "수혜 가설, 반대 근거, 체크포인트로 나누어 정리했습니다.",
                    "createdAt": "2026-07-06T09:01:00+09:00",
                    "summary": "초안 정리",
                }
            ],
        })
        loaded = service.get_note(note["id"])

        assert loaded["body"].startswith("## 현재 관점")
        assert loaded["rawThoughts"][0]["body"] == "이 주식은 앞으로 받을 수혜가 커 보여서 관심 있음"
        assert loaded["interactionLog"][0]["role"] == "agent"
        assert loaded["interactionLog"][0]["summary"] == "초안 정리"


def test_linked_notes_payload_filters_by_ticker(tmp_path):
    notes_dir = tmp_path / "notes"
    db_path = tmp_path / "market-memory.sqlite3"
    with patch.object(service, "NOTES_DIR", notes_dir), patch.object(service, "MARKET_MEMORY_DB_PATH", db_path):
        service.save_note({"title": "AAPL", "ticker": "AAPL"})
        service.save_note({"title": "MSFT", "ticker": "MSFT"})

        payload = service.linked_notes_payload(ticker="AAPL")

        assert payload["ok"] is True
        assert payload["count"] == 1
        assert payload["notes"][0]["title"] == "AAPL"
