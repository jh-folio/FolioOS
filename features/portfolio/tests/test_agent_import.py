"""Agent CLI 사진 읽기 — 0.5.0.

로컬 OCR은 Tesseract 설치를, 외부 Vision은 API 키와 매 요청 동의를 요구한다.
이미 설정한 CLI는 둘 다 없이 사진을 읽으므로, 이 경로가 사진 스캔의 기본
진입 장벽을 없앤다. 대신 **바이트가 프롬프트에 실리면 안 되고**(경로만 넘긴다)
**읽기 실패와 빈 결과를 섞으면 안 된다**(빈 결과는 "종목이 없다"는 뜻이다).
"""
from __future__ import annotations

import pytest

from features.portfolio import agent_import, import_image


def test_positions_come_out_of_a_fenced_or_chatty_reply():
    fenced = '```json\n{"positions":[{"ticker":"NVDA","quantity":10}]}\n```'
    chatty = '읽었습니다.\n{"positions":[{"ticker":"005930","quantity":3}]}\n확인해 보세요.'
    assert agent_import._positions_from_output(fenced)[0]["ticker"] == "NVDA"
    assert agent_import._positions_from_output(chatty)[0]["ticker"] == "005930"
    assert agent_import._positions_from_output('{"positions":[]}') == []


def test_unreadable_and_unparsable_are_errors_not_empty_results():
    """빈 목록으로 떨어뜨리면 사용자가 읽기 실패를 사진 탓으로 오해한다."""
    with pytest.raises(ValueError, match="agent_import_image_unreadable"):
        agent_import._positions_from_output('{"positions":[],"error":"image_unreadable"}')
    with pytest.raises(ValueError, match="agent_import_not_json"):
        agent_import._positions_from_output("종목을 못 읽었습니다")
    with pytest.raises(ValueError, match="agent_import_empty_output"):
        agent_import._positions_from_output("")
    with pytest.raises(ValueError, match="agent_import_not_json"):
        agent_import._positions_from_output('{"rows":[]}')


def test_the_prompt_names_a_path_and_carries_no_image_bytes(tmp_path, monkeypatch):
    image = tmp_path / "shot.png"
    image.write_bytes(b"\x89PNG\r\n\x1a\n" + b"payload-bytes" * 40)
    seen = {}

    def fake_run(prompt, **kwargs):
        seen["prompt"] = prompt
        seen["timeout"] = kwargs.get("timeout")
        return {"output": '{"positions":[{"ticker":"AAPL","quantity":1}]}'}

    monkeypatch.setattr("features.agent_mode.bridge.run_agent_prompt", fake_run)
    rows = agent_import.extract_positions(image)
    assert rows == [{"ticker": "AAPL", "quantity": 1}]
    assert str(image) in seen["prompt"]
    assert "payload-bytes" not in seen["prompt"]
    assert seen["timeout"] >= 60


def test_agent_mode_cleans_the_temp_file_and_never_writes_portfolio(tmp_path, monkeypatch):
    observed = {}
    monkeypatch.setattr(import_image, "validate_image", lambda source, mime_type: None)

    def fake_agent(path):
        observed["directory"] = path.parent
        assert path.exists()
        return [{"ticker": "TSLA", "quantity": 4, "averagePrice": 210}]

    monkeypatch.setattr(import_image, "extract_agent", fake_agent)
    payload = import_image.preview_image(tmp_path, b"image", content_type="image/png", mode="agent")
    assert payload["engine"] == "agent_cli"
    assert payload["persisted"] is False
    assert payload["drafts"][0]["ticker"] == "TSLA"
    assert not (tmp_path / "portfolio.json").exists()
    assert not observed["directory"].exists()
    # 사진이 CLI 제공자에게 간다는 사실을 결과가 말한다.
    assert any("CLI" in notice for notice in payload["notices"])


def test_agent_mode_asks_for_no_consent_flag(tmp_path, monkeypatch):
    """Agent를 연결해 둔 것 자체가 허락이다(AGENTS.md §8 Agent 실행 경계).

    외부 Vision과 달리 `consent=False`로도 진행해야 한다 — 여기서 동의를 또
    받으면 설치 부담을 없앤 자리에 절차 부담을 넣는 셈이다.
    """
    monkeypatch.setattr(import_image, "validate_image", lambda source, mime_type: None)
    monkeypatch.setattr(import_image, "extract_agent", lambda path: [{"ticker": "MSFT", "quantity": 2}])
    payload = import_image.preview_image(tmp_path, b"image", content_type="image/png", mode="agent", consent=False)
    assert payload["drafts"][0]["ticker"] == "MSFT"


def test_preflight_reports_cli_availability_separately_from_tesseract(monkeypatch):
    """화면이 열기 전에 무엇을 고를 수 있는지 알아야 고르고 나서 막히지 않는다."""
    monkeypatch.setattr(import_image, "tesseract_preflight", lambda: {"available": False, "ready": False, "reason": "tesseract_not_installed"})
    monkeypatch.setattr(import_image, "cli_status", lambda: {"available": True, "reason": "", "message": "Claude Code CLI 사용 가능"})
    payload = import_image.preflight_payload()
    assert payload["ready"] is False
    assert payload["agent"]["available"] is True

    monkeypatch.setattr(import_image, "cli_status", lambda: {"available": False, "reason": "agent_cli_unavailable", "message": "로그인이 필요합니다."})
    agent = import_image.preflight_payload()["agent"]
    assert agent["reason"] == "agent_cli_unavailable"
    # 사유를 그대로 실어야 한다. `설치하라`와 `로그인하라`는 할 일이 다르다.
    assert agent["message"] == "로그인이 필요합니다."


def test_turning_the_agent_off_in_settings_disables_this_mode(monkeypatch):
    """설정의 `AI Agent 사용`은 사용자가 명시적으로 끈 스위치다.

    CLI가 깔려 있어도 꺼져 있으면 쓰지 않는다. 그리고 사유가 `CLI가 없다`가
    아니라 `꺼져 있다`여야 한다 — 안 그러면 깔려 있는 CLI 앞에서 설치 안내를 읽는다.
    """
    monkeypatch.setattr("features.llm_settings.client.ai_agent_enabled", lambda: False)
    monkeypatch.setattr("features.agent_mode.bridge.bridge_status", lambda **_kw: {"available": True, "message": "사용 가능"})
    status = agent_import.cli_status()
    assert status["available"] is False
    assert status["reason"] == "agent_disabled"


def test_a_broken_bridge_does_not_break_the_dialog(monkeypatch):
    """CLI 상태 조회가 터져도 다이얼로그는 열려야 한다 — 다른 두 경로가 남아 있다."""
    monkeypatch.setattr("features.llm_settings.client.ai_agent_enabled", lambda: True)

    def boom(**_kwargs):
        raise OSError("no bridge")

    monkeypatch.setattr("features.agent_mode.bridge.bridge_status", boom)
    assert agent_import.cli_available() is False
    assert agent_import.cli_status()["reason"] == "agent_status_unknown"
