"""저장이 CLI 상태를 어떻게 보고하는가, 그리고 agy를 언제 여는가."""
import features.agent_mode.bridge as bridge
import features.agent_mode.setup as setup


def test_saving_reports_the_measured_status_not_a_placeholder(monkeypatch):
    """예전에는 탐지 비용을 아끼려고 모든 어댑터를 `installed: False`로 채운 자리표시자를
    돌려줬다. 화면은 그것을 그대로 "미설치"로 그려서, 설정을 저장할 때마다 설치돼 있는
    CLI가 사라졌다 나타났다.
    """
    monkeypatch.setattr(setup, "write_env_values", lambda updates: None)
    monkeypatch.setattr(setup, "invalidate_bridge_status", lambda: None, raising=False)
    seen = {}

    def fake_payload(*, refresh=False):
        seen["refresh"] = refresh
        return {"adapters": [{"id": "claude", "installed": True, "authenticated": True}], "provider": "claude"}

    monkeypatch.setattr(setup, "settings_payload", fake_payload)

    result = setup.save_settings({"provider": "claude", "models": {}})

    assert result["adapters"][0]["installed"] is True
    # 모델 목록까지 다시 물으면 CLI마다 조회가 붙어 저장이 20초 걸린다.
    assert seen["refresh"] is False


def test_the_placeholder_payload_is_gone():
    assert not hasattr(setup, "_saved_settings_payload")


def test_agy_opens_only_from_the_version_that_was_verified():
    """Windows headless(`--print`)가 결과를 돌려주는 것을 확인한 버전부터만 연다.

    못 미치는 버전을 열어 주면 사용자가 기본 `--print-timeout` 5분을 기다린 뒤 빈 결과를
    받는다. 막아 두면 다른 CLI를 쓰라는 안내를 즉시 본다.
    """
    assert bridge.AGY_HEADLESS_FIXED == (1, 1, 7)
    assert bridge._agy_headless_works("1.1.7") is True
    assert bridge._agy_headless_works("1.2.0") is True
    assert bridge._agy_headless_works("2.0.0") is True
    assert bridge._agy_headless_works("1.1.6") is False
    assert bridge._agy_headless_works("1.0.10") is False


def test_an_unreadable_agy_version_stays_blocked():
    """버전을 모르면 지원하지 않는 것으로 본다. 잘못 열어 주는 쪽이 더 나쁘다."""
    for text in ("", "알 수 없음", None, "agy"):
        assert bridge._agy_headless_works(text) is False


def test_the_offered_agy_models_carry_an_effort_step():
    """agy는 모델 이름에 노력 단계를 함께 담는다(`...-high`).

    단계 없는 예전 이름(`gemini-3.5-pro`)은 1.1.7이 "not recognized"로 거부하는데,
    실시간 목록에 기본값이 덧붙어 선택지에 남아 있었다 — 고르면 실행 시점에 실패한다.
    """
    from features.llm_settings.model_catalog import CLI_MODEL_FALLBACKS

    values = [choice["value"] for choice in CLI_MODEL_FALLBACKS["antigravity"]]

    assert "gemini-3.5-pro" not in values
    assert all(value.count("-") >= 2 for value in values), values


def test_a_conversation_can_pick_its_own_cli_without_touching_the_default():
    """도크의 선택은 그 대화에만 적용된다.

    전역 기본(설정 탭·상단바)은 예약 브리핑과 기업분석이 쓴다. 도크에서 한 번 다른
    CLI로 물어봤다고 내일 아침 예약이 그 CLI로 돌면 안 된다.
    """
    from features.agent_mode.companion import normalize_agent_options

    assert normalize_agent_options({"adapter": "codex"})["adapter"] == "codex"
    assert normalize_agent_options({"adapter": "CLAUDE"})["adapter"] == "claude"
    # 비어 있으면 전역 기본을 따른다.
    assert normalize_agent_options({})["adapter"] == ""
    # 아는 어댑터가 아니면 무시한다 — 틀린 이름 때문에 전역 기본까지 못 쓰면 안 된다.
    assert normalize_agent_options({"adapter": "nope"})["adapter"] == ""


def test_the_chat_run_hands_the_conversation_adapter_to_the_cli():
    """옵션에만 담기고 실행에 안 넘어가면 화면은 고른 척만 한다."""
    import inspect

    from features.agent_mode import chat

    source = inspect.getsource(chat._run_with_images)

    assert 'adapter=options.get("adapter", "")' in source


def test_the_dock_never_saves_a_conversation_choice_as_the_default():
    """도크가 override 중에 전역 설정을 저장하면 `이 대화에만`이 거짓이 된다."""
    from pathlib import Path

    source = Path(__file__).resolve().parents[3].joinpath(
        "web", "src", "app", "ReactAgentDock.tsx"
    ).read_text(encoding="utf-8")

    assert "if (providerOverride || !adapter?.id || !nextModel) return;" in source
    assert "options: { model, effort, adapter: providerOverride }" in source
