"""관심 시장 범위는 제품의 바깥 테두리다.

범위에서 꺼진 시장은 수집까지 멈춘다(2026-08-07 사용자 결정). GLOBAL과
UNKNOWN은 특정 시장 소유가 아니므로 어떤 범위에서도 숨지 않는다 — 이걸
어기면 유가·달러 뉴스가 통째로 사라진다.
"""
from __future__ import annotations

import json

from features.common.market_scope import (
    DEFAULT_SELECTED,
    feed_in_scope,
    load_market_scope,
    market_tags_visible,
    normalize_selected,
    save_market_scope,
)


def test_no_file_means_us_kr(tmp_path):
    scope = load_market_scope(tmp_path / "market-scope.json")
    assert scope["selected"] == list(DEFAULT_SELECTED)


def test_saving_records_when_a_market_was_enabled(tmp_path):
    path = tmp_path / "market-scope.json"
    _, first = save_market_scope(["US", "KR"], path)
    assert first == []

    scope, newly = save_market_scope(["US", "KR", "JP"], path)
    assert newly == ["JP"]
    assert scope["enabledAt"]["JP"]
    # 다시 저장해도 켠 시각은 그대로다.
    again, newly2 = save_market_scope(["US", "KR", "JP"], path)
    assert newly2 == []
    assert again["enabledAt"]["JP"] == scope["enabledAt"]["JP"]


def test_garbage_input_falls_back_to_the_default(tmp_path):
    path = tmp_path / "market-scope.json"
    scope, _ = save_market_scope(["MOON", "", None], path)
    assert scope["selected"] == list(DEFAULT_SELECTED)


def test_a_broken_file_does_not_crash(tmp_path):
    path = tmp_path / "market-scope.json"
    path.write_text("{not json", encoding="utf-8")
    assert load_market_scope(path)["selected"] == list(DEFAULT_SELECTED)


def test_eu_alias_maps_to_europe():
    assert normalize_selected(["EU", "US"]) == ["US", "EUROPE"]


def test_feeds_outside_the_scope_are_not_collected():
    selected = ["US", "KR"]
    assert feed_in_scope({"default_market": "US"}, selected)
    assert not feed_in_scope({"default_market": "JP"}, selected)
    assert not feed_in_scope({"default_market": "EUROPE"}, selected)
    # GLOBAL 피드는 어떤 범위에서도 수집한다.
    assert feed_in_scope({"default_market": "GLOBAL"}, selected)


def test_global_and_unknown_items_never_hide():
    selected = ["US"]
    assert market_tags_visible(["GLOBAL"], selected)
    assert market_tags_visible(["UNKNOWN"], selected)
    assert market_tags_visible([], selected)
    assert market_tags_visible(["JP", "GLOBAL"], selected)


def test_items_owned_only_by_unselected_markets_hide():
    selected = ["US", "KR"]
    assert not market_tags_visible(["JP"], selected)
    assert not market_tags_visible(["EUROPE", "JP"], selected)
    assert market_tags_visible(["US", "JP"], selected)


def test_the_saved_file_is_plain_json(tmp_path):
    path = tmp_path / "market-scope.json"
    save_market_scope(["US"], path)
    payload = json.loads(path.read_text(encoding="utf-8"))
    assert payload["selected"] == ["US"]
