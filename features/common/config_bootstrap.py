from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from threading import Lock
from typing import Final


DEFAULT_CONFIG_NAMES: Final = frozenset(
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
_ROOT: Final = Path(__file__).resolve().parents[2]
_DEFAULTS_CONFIG_DIR = _ROOT / "defaults" / "config"
_LOCAL_CONFIG_DIR = _ROOT / "config"
_CONFIG_LOCKS: Final = {name: Lock() for name in DEFAULT_CONFIG_NAMES}


@dataclass(frozen=True, slots=True)
class ConfigNameError(Exception):
    name: str

    def __str__(self) -> str:
        return f"unsupported config name: {self.name!r}"


def resolve_config(name: str) -> Path:
    if name not in DEFAULT_CONFIG_NAMES:
        raise ConfigNameError(name=name)

    target = _LOCAL_CONFIG_DIR / name
    with _CONFIG_LOCKS[name]:
        if not target.exists():
            payload = (_DEFAULTS_CONFIG_DIR / name).read_bytes()
            target.parent.mkdir(parents=True, exist_ok=True)
            try:
                with target.open("xb") as stream:
                    stream.write(payload)
            except FileExistsError:
                target.read_bytes()
                return target
        target.read_bytes()
    return target


def main() -> int:
    for name in sorted(DEFAULT_CONFIG_NAMES):
        resolve_config(name)
    print(f"Initialized {len(DEFAULT_CONFIG_NAMES)} local config files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
