from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from threading import Lock
from typing import Final
from features.common.atomic_replace import replace_with_retry
from features.common.workspace import config_dir


DEFAULT_CONFIG_NAMES: Final = frozenset(
    {
        "company_aliases.json",
        "company_master.json",
        "europe_core_constituents.json",
        "evidence_sources.yaml",
        "foreign_company_aliases.json",
        "kospi200_constituents.json",
        "nikkei225_constituents.json",
        "rss_feeds.yaml",
        "sp500_constituents.json",
        "web_search_sources.yaml",
    }
)
_ROOT: Final = Path(__file__).resolve().parents[2]
_DEFAULTS_CONFIG_DIR = _ROOT / "defaults" / "config"
_LOCAL_CONFIG_DIR = config_dir()
_CONFIG_LOCKS: Final = {name: Lock() for name in DEFAULT_CONFIG_NAMES}


@dataclass(frozen=True, slots=True)
class ConfigNameError(Exception):
    name: str

    def __str__(self) -> str:
        return f"unsupported config name: {self.name!r}"


def _seed(target: Path, payload: bytes) -> None:
    """기본값을 원자적으로 심는다. 이미 있으면 그 파일이 정답이다.

    예전에는 `open("xb")`로 파일을 만든 뒤 내용을 채웠다. 만들기와 채우기 사이에 창이
    있어서, 같은 `config/`를 공유하는 두 인스턴스가 처음 동시에 뜨면 한쪽이 빈 파일이나
    잘린 YAML을 읽고 그대로 썼다. `_CONFIG_LOCKS`는 프로세스 안에서만 유효해 막지 못한다.

    임시 파일 이름에 pid를 넣는 이유도 같다 — 두 프로세스가 같은 임시 파일을 쓰면
    서로의 내용을 덮는다. 교체는 `replace_with_retry()`가 한다(§파일 저장).
    """
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_name(f"{target.name}.{os.getpid()}.tmp")
    try:
        temporary.write_bytes(payload)
        if target.exists():
            # 그 사이 다른 프로세스가 심었다. 사용자가 고친 파일일 수도 있으니 덮지 않는다.
            temporary.unlink(missing_ok=True)
            return
        replace_with_retry(temporary, target)
    except OSError:
        try:
            temporary.unlink(missing_ok=True)
        except OSError:
            pass
        raise


def resolve_config(name: str) -> Path:
    if name not in DEFAULT_CONFIG_NAMES:
        raise ConfigNameError(name=name)

    target = _LOCAL_CONFIG_DIR / name
    with _CONFIG_LOCKS[name]:
        if not target.exists():
            _seed(target, (_DEFAULTS_CONFIG_DIR / name).read_bytes())
        target.read_bytes()
    return target


def main() -> int:
    for name in sorted(DEFAULT_CONFIG_NAMES):
        resolve_config(name)
    print(f"Initialized {len(DEFAULT_CONFIG_NAMES)} local config files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
