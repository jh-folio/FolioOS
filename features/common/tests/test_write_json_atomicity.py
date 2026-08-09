"""`write_json`은 제자리에 바로 쓰지 않는다.

읽는 쪽은 항상 옛 내용 아니면 새 내용을 본다. 그 사이의 반쪽짜리 파일을 보지 않는다.
저장 도중 크래시나 디스크 부족이면 `portfolio.json`이나 보고서가 잘린 채 남고,
`content_revision`이 mtime을 초 단위로 폴링해 화면이 곧바로 다시 읽으므로 한 프로세스
안에서도 읽기가 쓰기 중간에 걸린다.

교체는 `atomic_replace`에 맡긴다 — 이 파일이 검사하는 것도 "직접 쓰지 않는가"이지
"어떤 syscall을 부르는가"가 아니다.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from features.common.utils import read_json, write_json


def test_the_target_never_holds_partial_content_while_being_written(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """교체 직전에 들여다봐도 대상은 여전히 옛 내용이다."""
    target = tmp_path / "portfolio.json"
    write_json(target, {"positions": ["old"]})

    seen: list[object] = []
    import features.common.utils as utils

    original = utils.write_bytes_atomic

    def watched(path: Path, data: bytes) -> None:
        # 임시 파일에 쓰는 동안 대상을 읽는 소비자를 흉내낸다.
        seen.append(read_json(target, None))
        original(path, data)

    monkeypatch.setattr(utils, "write_bytes_atomic", watched)
    write_json(target, {"positions": ["new"] * 500})

    assert seen == [{"positions": ["old"]}]
    assert read_json(target, None) == {"positions": ["new"] * 500}


def test_a_failed_write_leaves_the_previous_file_intact(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """교체가 끝내 실패해도 옛 내용이 남고 임시 파일이 쌓이지 않는다."""
    target = tmp_path / "watchlist.json"
    write_json(target, {"rows": ["keep"]})

    import features.common.utils as utils

    def failing(path: Path, data: bytes) -> None:
        raise PermissionError("[WinError 5] 액세스가 거부되었습니다")

    monkeypatch.setattr(utils, "write_bytes_atomic", failing)
    with pytest.raises(PermissionError):
        write_json(target, {"rows": ["lost"]})

    assert read_json(target, None) == {"rows": ["keep"]}
    assert [path.name for path in tmp_path.iterdir()] == ["watchlist.json"]


def test_no_temporary_file_survives_a_successful_write(tmp_path: Path) -> None:
    target = tmp_path / "settings.json"
    for revision in range(3):
        write_json(target, {"revision": revision})

    assert [path.name for path in tmp_path.iterdir()] == ["settings.json"]
    assert json.loads(target.read_text(encoding="utf-8")) == {"revision": 2}


def test_the_bounded_root_contract_still_confines_the_write(tmp_path: Path) -> None:
    """원자화가 `root=` 경로 검증을 우회하지 않는다.

    `root=`는 넘어온 경로를 파일명 하나로 줄여 그 폴더 안에 가둔다. 임시 파일도 같은
    폴더에 만들어지므로 교체 전후 어느 순간에도 밖으로 새지 않는다.
    """
    root = tmp_path / "storage"
    root.mkdir()

    write_json("../../escaped.json", {"x": 1}, root=root)

    assert (root / "escaped.json").exists()
    assert not (tmp_path / "escaped.json").exists()
    assert not (tmp_path.parent / "escaped.json").exists()
    assert [path.name for path in root.iterdir()] == ["escaped.json"]


def test_write_json_writes_through_the_shared_atomic_helper(tmp_path: Path) -> None:
    """`os.replace()`를 직접 부르지 않고 공용 helper를 거친다(§파일 저장).

    helper에는 Windows에서 백신·색인기가 핸들을 잡을 때 나는 `WinError 5/32` 재시도가
    들어 있다. 손으로 교체하면 그 재시도를 잃는다.
    """
    import features.common.utils as utils

    from features.common.atomic_replace import write_bytes_atomic

    assert utils.write_bytes_atomic is write_bytes_atomic
