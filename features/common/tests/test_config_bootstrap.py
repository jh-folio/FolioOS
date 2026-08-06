from __future__ import annotations

import importlib
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from types import ModuleType

import pytest


EXPECTED_NAMES = frozenset(
    {
        "company_aliases.json",
        "company_master.json",
        "europe_core_constituents.json",
        "evidence_sources.yaml",
        "kospi200_constituents.json",
        "nikkei225_constituents.json",
        "rss_feeds.yaml",
        "sp500_constituents.json",
        "web_search_sources.yaml",
    }
)


def _load_bootstrap() -> ModuleType:
    try:
        return importlib.import_module("features.common.config_bootstrap")
    except ModuleNotFoundError:
        pytest.fail("config bootstrap contract is missing", pytrace=False)


@pytest.fixture
def isolated_bootstrap(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> tuple[ModuleType, Path, Path]:
    module = _load_bootstrap()
    defaults = tmp_path / "defaults" / "config"
    local = tmp_path / "config"
    defaults.mkdir(parents=True)
    for name in EXPECTED_NAMES:
        (defaults / name).write_bytes(f"default:{name}\n".encode())
    monkeypatch.setattr(module, "_DEFAULTS_CONFIG_DIR", defaults)
    monkeypatch.setattr(module, "_LOCAL_CONFIG_DIR", local)
    return module, defaults, local


@pytest.mark.parametrize("name", sorted(EXPECTED_NAMES))
def test_resolve_config_copies_each_missing_default(
    isolated_bootstrap: tuple[ModuleType, Path, Path], name: str
) -> None:
    module, defaults, local = isolated_bootstrap

    resolved = module.resolve_config(name)

    assert resolved == local / name
    assert resolved.read_bytes() == (defaults / name).read_bytes()


def test_resolve_config_never_overwrites_existing_file(
    isolated_bootstrap: tuple[ModuleType, Path, Path]
) -> None:
    module, _, local = isolated_bootstrap
    local.mkdir()
    sentinel = b"existing-user-config\x00\xff"
    target = local / "company_master.json"
    target.write_bytes(sentinel)

    resolved = module.resolve_config("company_master.json")

    assert resolved.read_bytes() == sentinel


def test_resolve_config_bootstraps_only_missing_file_in_partial_config(
    isolated_bootstrap: tuple[ModuleType, Path, Path]
) -> None:
    module, defaults, local = isolated_bootstrap
    local.mkdir()
    existing = local / "company_aliases.json"
    existing.write_bytes(b"sentinel")

    created = module.resolve_config("company_master.json")

    assert existing.read_bytes() == b"sentinel"
    assert created.read_bytes() == (defaults / "company_master.json").read_bytes()


def test_resolve_config_is_safe_under_concurrent_first_use(
    isolated_bootstrap: tuple[ModuleType, Path, Path]
) -> None:
    module, defaults, _ = isolated_bootstrap
    name = "rss_feeds.yaml"

    with ThreadPoolExecutor(max_workers=12) as executor:
        paths = list(executor.map(module.resolve_config, [name] * 48))

    assert len(set(paths)) == 1
    assert paths[0].read_bytes() == (defaults / name).read_bytes()


def test_bootstrap_cli_creates_every_missing_config(
    isolated_bootstrap: tuple[ModuleType, Path, Path]
) -> None:
    module, defaults, local = isolated_bootstrap

    result = module.main()

    assert result == 0
    assert {path.name for path in local.iterdir()} == EXPECTED_NAMES
    assert all((local / name).read_bytes() == (defaults / name).read_bytes() for name in EXPECTED_NAMES)


@pytest.mark.parametrize("name", ["../company_master.json", "missing.json", "", "config/rss_feeds.yaml"])
def test_resolve_config_rejects_unapproved_names(
    isolated_bootstrap: tuple[ModuleType, Path, Path], name: str
) -> None:
    module, _, local = isolated_bootstrap

    with pytest.raises(module.ConfigNameError):
        module.resolve_config(name)

    assert not local.exists()
