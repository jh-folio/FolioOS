from features.automation.schema import normalize_settings


def test_normalize_settings_defaults_to_disabled():
    settings = normalize_settings({})
    assert settings["rss"]["enabled"] is False
    assert settings["rss"]["saveFullText"] is True
    assert settings["marketMemory"]["enabled"] is False
    # 스케줄은 사용자가 만들 때까지 없다. 예전에는 꺼진 싱글톤이 하나 있었다.
    assert settings["briefingSchedules"] == []
    assert settings["missedRuns"] == {"catchUpHours": 3}


def test_normalize_settings_respects_save_full_text_opt_out():
    settings = normalize_settings({"rss": {"enabled": True, "saveFullText": False}})
    assert settings["rss"]["saveFullText"] is False


def test_normalize_settings_clamps_bad_values():
    settings = normalize_settings({
        "rss": {"enabled": True, "intervalMinutes": -5},
        "briefing": {"enabled": True, "time": "99:99", "marketScope": "bad", "generationMode": "bad"},
    })
    assert settings["rss"]["intervalMinutes"] == 60
    schedule = settings["briefingSchedules"][0]
    assert schedule["time"] == "08:00"
    # 네 시장이 기본이다. `both`는 시장이 둘이던 시절의 값이라, 유럽·일본만 보는
    # 사용자가 자동화를 켜면 안 보는 시장 둘이 나왔다.
    assert schedule["markets"] == ["us", "kr", "europe", "jp"]
    assert "generationMode" not in schedule


def test_saved_both_scope_is_left_alone():
    """기본값만 바꾼다. 이미 미국+한국으로 정해 둔 사용자의 설정은 그대로다."""
    settings = normalize_settings({"briefing": {"marketScope": "both"}})
    assert settings["briefingSchedules"][0]["markets"] == ["us", "kr"]


def test_catch_up_hours_migrates_the_old_two_state_setting():
    """`skip`은 10분 창, `catch_up`은 자정까지였다. 같은 동작으로 옮긴다.

    저장된 설정은 읽을 때만 옮기므로 기존 사용자의 동작이 바뀌지 않는다.
    기본 3시간은 새로 켜는 사람에게만 적용된다.
    """
    assert normalize_settings({"missedRuns": {"onStartup": "skip"}})["missedRuns"]["catchUpHours"] == 0
    assert normalize_settings({"missedRuns": {"onStartup": "catch_up"}})["missedRuns"]["catchUpHours"] == 24
    assert normalize_settings({"missedRuns": {"onStartup": "쓰레기"}})["missedRuns"]["catchUpHours"] == 3
    # 새 값이 있으면 그것을 쓰고, 목록에 없는 값은 기본으로 되돌린다.
    assert normalize_settings({"missedRuns": {"catchUpHours": 6}})["missedRuns"]["catchUpHours"] == 6
    assert normalize_settings({"missedRuns": {"catchUpHours": 7}})["missedRuns"]["catchUpHours"] == 3
    assert normalize_settings({"missedRuns": {"catchUpHours": "x"}})["missedRuns"]["catchUpHours"] == 3
    # 새 값이 있으면 옛 값은 보지 않는다.
    assert normalize_settings({"missedRuns": {"catchUpHours": 0, "onStartup": "catch_up"}})["missedRuns"]["catchUpHours"] == 0
