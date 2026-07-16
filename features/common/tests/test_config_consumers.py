from __future__ import annotations

import json
import re
from pathlib import Path
from types import ModuleType
from typing import Callable, TypeAlias

import pytest

from features.common import company_lookup, market_calendar
from features.common.market_data import kospi200_universe, market_universe, sp500_universe
from features.common.research_library.rss import rss_archive
from features.daily_briefing import visuals
from features.obsidian.export import service as obsidian_export
from features.watchlist_notes import service as watchlist_service


ConsumerResult: TypeAlias = (
    list[dict[str, str]]
    | list[str]
    | dict[str, str]
    | tuple[tuple[re.Pattern[str], str], ...]
    | None
)


@pytest.fixture
def config_files(tmp_path: Path) -> dict[str, Path]:
    files = {
        "company_master.json": {"companies": [{"name": "Acme", "ticker": "ACME", "market": "US"}]},
        "company_aliases.json": {"companies": []},
        "sp500_constituents.json": {"companies": [{"ticker": "ACME", "label": "Acme"}]},
        "kospi200_constituents.json": {"companies": [{"ticker": "000001.KS", "label": "Acme KR"}]},
    }
    paths: dict[str, Path] = {}
    for name, payload in files.items():
        path = tmp_path / name
        path.write_text(json.dumps(payload), encoding="utf-8")
        paths[name] = path
    for name in ("rss_feeds.yaml", "evidence_sources.yaml"):
        path = tmp_path / name
        path.write_text("sources: []\n", encoding="utf-8")
        paths[name] = path
    return paths


def _install_resolver(
    monkeypatch: pytest.MonkeyPatch, module: ModuleType, paths: dict[str, Path]
) -> list[str]:
    calls: list[str] = []

    def fake_resolve(name: str) -> Path:
        calls.append(name)
        return paths[name]

    monkeypatch.setattr(module, "resolve_config", fake_resolve)
    return calls


def test_company_lookup_routes_both_files_through_bootstrap(
    monkeypatch: pytest.MonkeyPatch, config_files: dict[str, Path]
) -> None:
    calls = _install_resolver(monkeypatch, company_lookup, config_files)

    company_lookup.ensure_company_files()

    assert calls == ["company_master.json", "company_aliases.json"]


@pytest.mark.parametrize(
    ("module", "action", "expected"),
    [
        (market_calendar, lambda: market_calendar._company_market_matchers(), "company_master.json"),
        (visuals, lambda: visuals._company_master(), "company_master.json"),
        (sp500_universe, lambda: sp500_universe.load_sp500_constituents(), "sp500_constituents.json"),
        (kospi200_universe, lambda: kospi200_universe.load_kospi200_constituents(), "kospi200_constituents.json"),
        (watchlist_service, lambda: watchlist_service.watchlist_company_from_constituents("ACME"), "sp500_constituents.json"),
        (obsidian_export, lambda: obsidian_export._all_company_names(), "company_master.json"),
    ],
)
def test_config_consumer_routes_default_through_bootstrap(
    monkeypatch: pytest.MonkeyPatch,
    config_files: dict[str, Path],
    module: ModuleType,
    action: Callable[[], ConsumerResult],
    expected: str,
) -> None:
    calls = _install_resolver(monkeypatch, module, config_files)
    market_calendar._company_market_matchers.cache_clear()

    action()

    assert calls == [expected]


@pytest.mark.parametrize(
    ("argument", "expected"),
    [(None, "rss_feeds.yaml"), (None, "evidence_sources.yaml")],
)
def test_rss_default_yaml_paths_use_bootstrap(
    monkeypatch: pytest.MonkeyPatch,
    config_files: dict[str, Path],
    argument: str | None,
    expected: str,
) -> None:
    calls = _install_resolver(monkeypatch, rss_archive, config_files)

    resolved = rss_archive.resolve_cli_config(argument, expected)

    assert resolved == config_files[expected]
    assert calls == [expected]


def test_market_universe_us_loader_uses_bootstrapped_constituents(
    monkeypatch: pytest.MonkeyPatch, config_files: dict[str, Path]
) -> None:
    calls = _install_resolver(monkeypatch, sp500_universe, config_files)

    rows = market_universe._default_constituents_loader()

    assert rows[0]["ticker"] == "ACME"
    assert calls == ["sp500_constituents.json"]


def test_market_universe_kr_loader_uses_bootstrapped_constituents(
    monkeypatch: pytest.MonkeyPatch, config_files: dict[str, Path]
) -> None:
    calls = _install_resolver(monkeypatch, kospi200_universe, config_files)

    rows = market_universe._default_kospi200_constituents()

    assert rows[0]["ticker"] == "000001.KS"
    assert calls == ["kospi200_constituents.json"]
