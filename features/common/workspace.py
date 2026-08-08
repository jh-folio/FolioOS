"""워크스페이스(사용자 자료)가 어디 있는지 한 곳에서 정한다.

배포 zip은 `FolioOS-v0.5.0/` 처럼 **버전이 박힌 폴더**로 풀리고 `data/`는 빈 채로
나온다. 그래서 새 버전을 받으면 새 폴더에 빈 워크스페이스가 생기고 이전 자료는 옛
폴더에 남는다 — 실측으로 파일 191개·913MB였고, 그 사실을 알려주는 안내가 문서
어디에도 없었다. 코드와 자료가 한 폴더에 섞여 있는 것이 원인이다.

**기본값은 바꾸지 않는다**(2026-08-08 사용자 결정). 지금 쓰는 사람은 아무것도
달라지지 않고 새 폴더도 생기지 않는다 — 홈 폴더에 앱이 폴더를 만드는 것을 싫어하는
사용자가 있다. 자료를 앱 폴더 밖으로 옮기는 것은 **선택**이고, 목적지는 사용자가
찾을 수 있는 문서 폴더다.

찾는 순서:

1. `FOLIO_HOME` 환경변수 — 직접 정하고 싶은 사람용. 화면에 노출하지 않는다.
2. 앱 폴더 `data/`에 파일이 있으면 앱 폴더 — 지금 쓰는 설치를 그대로 둔다.
3. `~/Documents/FolioOS`가 있으면 거기 — **옮긴 사용자가 새 버전을 풀었을 때
   자료를 자동으로 다시 찾는 지점이다.** 이 규칙이 없으면 옮겨도 업데이트 때
   빈 워크스페이스를 보게 되어 옮긴 의미가 없다.
4. 아니면 앱 폴더 — 기본값. 아무것도 새로 만들지 않는다.

2번이 3번보다 먼저인 이유: 옮기기는 원본을 지우지 않으므로 옛 앱 폴더에는 자료가
남아 있다. 그 폴더를 직접 실행하면 그 폴더의 자료를 쓰는 것이 맞다.
"""
from __future__ import annotations

import functools
import os
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parents[2]

WORKSPACE_DIR_NAMES = ("data", "research-inbox", "config")
DOCUMENTS_FOLDER_NAME = "FolioOS"


def app_root() -> Path:
    """코드가 있는 폴더. 버전마다 새로 받는 쪽이다."""
    return APP_ROOT


def documents_workspace() -> Path:
    """옮기기를 선택했을 때의 목적지."""
    return Path.home() / "Documents" / DOCUMENTS_FOLDER_NAME


def _has_content(directory: Path) -> bool:
    """빈 폴더 껍데기와 실제로 쓰던 워크스페이스를 가른다.

    배포 zip은 `data/`와 그 하위를 **빈 폴더로** 만들어 둔다. 그래서 폴더 존재만
    보면 새로 푼 설치도 "쓰던 워크스페이스"로 오인한다.
    """
    try:
        return any(item.is_file() for item in directory.rglob("*"))
    except OSError:
        return False


@functools.cache
def workspace_root() -> Path:
    """사용자 자료가 있는 폴더. 위 docstring의 순서를 따른다.

    한 프로세스에서 한 번만 정한다. 모듈 상수 수십 곳이 import 시점에 이 값을 읽으므로
    캐시가 없으면 그때마다 디렉터리를 훑고, 더 나쁘게는 import 도중 누군가 `data/`를
    만들면 앞뒤 모듈이 서로 다른 워크스페이스를 가리킬 수 있다. 옮기기는 재시작을
    요구하므로(설정 화면이 안내한다) 실행 중 값이 바뀔 일은 없다.
    """
    configured = str(os.environ.get("FOLIO_HOME", "") or "").strip()
    if configured:
        return Path(configured).expanduser()

    if _has_content(APP_ROOT / "data"):
        return APP_ROOT

    documents = documents_workspace()
    if _has_content(documents / "data"):
        return documents

    return APP_ROOT


def reset_cache() -> None:
    """테스트에서 환경을 바꾼 뒤 다시 판정하게 한다."""
    workspace_root.cache_clear()


def workspace_dir(name: str) -> Path:
    """`data` / `research-inbox` / `config` 중 하나의 실제 경로."""
    if name not in WORKSPACE_DIR_NAMES:
        raise ValueError(f"unknown workspace directory: {name!r}")
    return workspace_root() / name


def data_dir() -> Path:
    return workspace_dir("data")


def research_inbox_dir() -> Path:
    return workspace_dir("research-inbox")


def config_dir() -> Path:
    return workspace_dir("config")


def is_outside_app_folder() -> bool:
    """자료가 앱 폴더 밖에 있는가. 업데이트 안내가 갈리는 기준이다."""
    return workspace_root().resolve() != APP_ROOT.resolve()
