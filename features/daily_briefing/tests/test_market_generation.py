"""Tasks 3.2/3.3 — per-market selection, prompts, and rule-path text.

The gate here is that a market's briefing never carries another market's
sections or caveats, and that the session date follows the market rather than
falling through to Korea's.
"""
from __future__ import annotations

import pytest

from features.common.market_calendar import briefing_market_windows
from features.daily_briefing.builder import _scope_session_date
from features.daily_briefing.issue_selection import documents_for_scope, session_modes_from_windows
from features.daily_briefing.schema import SINGLE_MARKET_SCOPES
from features.daily_briefing.service import (
    MARKET_LABELS,
    _cross_market_caveat,
    _market_reading,
    _scope_output_instruction,
    briefing_prompt_paths,
    read_briefing_prompt,
)

DATE = "2026-08-05"
AS_OF = f"{DATE}T18:00:00+09:00"


@pytest.fixture(scope="module")
def windows():
    return briefing_market_windows(DATE, as_of=AS_OF)


# --- prompts ------------------------------------------------------------


@pytest.mark.parametrize("scope", SINGLE_MARKET_SCOPES)
def test_each_market_has_its_own_prompt_file(scope):
    paths = briefing_prompt_paths(scope)
    assert [path.name for path in paths] == [f"prompt_{scope}.md"]
    assert paths[0].exists()


def test_an_aggregate_prompt_concatenates_only_its_markets():
    assert [p.name for p in briefing_prompt_paths("both")] == ["prompt_us.md", "prompt_kr.md"]
    assert [p.name for p in briefing_prompt_paths("all")] == [
        "prompt_us.md", "prompt_kr.md", "prompt_europe.md", "prompt_jp.md",
    ]


@pytest.mark.parametrize("scope,heading", [
    ("us", "US Market Briefing"), ("kr", "Korea Market Briefing"),
    ("europe", "Europe Market Briefing"), ("jp", "Japan Market Briefing"),
])
def test_every_prompt_pins_its_own_title_and_the_shared_section_skeleton(scope, heading):
    text = read_briefing_prompt(scope)
    assert heading in text
    for section in ("## 0.", "## 1.", "## 2.", "## 5.", "## 6.", "## 오늘의 결론", "## Source & Data Notes"):
        assert section in text, f"{scope} missing {section}"


def test_the_europe_prompt_names_the_two_currencies_and_two_central_banks():
    """Without this the briefing quietly becomes UK news with euro words."""
    text = read_briefing_prompt("europe")
    assert "GBP" in text and "EUR" in text
    assert "ECB" in text and "BoE" in text
    assert "영국 자료만으로" in text


def test_the_japan_prompt_separates_japan_from_generic_asia_coverage():
    text = read_briefing_prompt("jp")
    assert "아시아 증시" in text
    assert "엔화" in text


@pytest.mark.parametrize("scope", ("europe", "jp"))
def test_translation_stays_derived_text_not_a_new_source(scope):
    """A claim resting on translation must carry the sentence it rests on."""
    text = read_briefing_prompt(scope)
    assert "원문 문장을 그대로" in text
    assert "새로운 출처가 아니다" in text


# --- scope instructions and rule-path sentences -------------------------


@pytest.mark.parametrize("scope", SINGLE_MARKET_SCOPES)
def test_a_single_market_instruction_names_only_its_own_market(scope):
    instruction = _scope_output_instruction(scope)
    assert f"{MARKET_LABELS[scope]} 브리핑만 작성하세요" in instruction
    # 다른 시장 자료는 보조 근거로만 쓰라는 계약이 있어야 한다.
    assert "보조 근거" in instruction or "필요한 만큼만" in instruction


def test_an_aggregate_instruction_lists_exactly_its_markets():
    assert "Europe Market Briefing" not in _scope_output_instruction("both")
    assert "Europe Market Briefing" in _scope_output_instruction("all")
    assert "Japan Market Briefing" in _scope_output_instruction("all")


@pytest.mark.parametrize("scope", ("europe", "jp"))
def test_a_briefing_never_hedges_about_markets_it_does_not_cover(scope):
    """"미국장과 한국장의 연결성" in a Europe report qualifies two absent markets."""
    assert "미국장과 한국장" not in _cross_market_caveat(scope)
    assert "미국장과 한국장" not in _market_reading(scope)
    assert MARKET_LABELS[scope][:2] in _market_reading(scope) or "유럽" in _market_reading(scope)


def test_korea_keeps_its_original_cross_market_wording():
    assert "미국장과 한국장의 연결성" in _market_reading("kr")


# --- selection ----------------------------------------------------------


@pytest.mark.parametrize("scope,expected", [
    ("us", "Nasdaq rallies"), ("kr", "코스피 상승"),
    ("europe", "FTSE 100 climbs as BoE holds"), ("jp", "日経平均が続伸"),
])
def test_each_scope_keeps_its_own_market_and_the_global_evidence(scope, expected):
    docs = [
        {"title": "Nasdaq rallies"}, {"title": "코스피 상승"},
        {"title": "FTSE 100 climbs as BoE holds"}, {"title": "日経平均が続伸"},
        {"title": "Oil prices climb on supply concerns"},
    ]
    titles = [doc["title"] for doc in documents_for_scope(docs, scope)]
    assert expected in titles
    # 유가·달러·공급망은 어느 시장 소유도 아니므로 모든 범위에 남는다.
    assert "Oil prices climb on supply concerns" in titles
    assert len(titles) == 2


@pytest.mark.parametrize("scope", ("all", "both"))
def test_aggregate_scopes_keep_everything_for_the_legs_to_narrow(scope):
    docs = [{"title": "Nasdaq rallies"}, {"title": "日経平均が続伸"}]
    assert len(documents_for_scope(docs, scope)) == 2


# --- session dates ------------------------------------------------------


def test_session_modes_cover_all_four_markets(windows):
    modes = session_modes_from_windows(windows)
    assert set(modes) == {"us", "kr", "europe", "jp"}
    assert modes["europe"].startswith("europe_")
    assert modes["jp"].startswith("jp_")


def test_europe_uses_its_own_session_date_not_koreas(windows):
    """Europe closes after KST midnight, so it describes D-1 like the US does."""
    assert _scope_session_date("europe", windows) == _scope_session_date("us", windows)
    assert _scope_session_date("europe", windows) != _scope_session_date("kr", windows)


def test_japan_tracks_korea_because_they_share_a_timezone(windows):
    assert _scope_session_date("jp", windows) == _scope_session_date("kr", windows)


def test_us_and_kr_session_dates_still_come_from_their_original_keys(windows):
    assert _scope_session_date("us", windows) == windows["usRegularSessionDate"]
    assert _scope_session_date("kr", windows) == (
        windows.get("krCurrentSessionDate") or windows["krPreviousSessionDate"]
    )
