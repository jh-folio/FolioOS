"""Windows의 원자적 교체 거부는 실패가 아니라 잠깐 기다릴 일이다.

전체 스위트를 반복 실행해 잡은 실제 오류가 근거다:

    os.replace(temporary, path)
    PermissionError: [WinError 5] 액세스가 거부되었습니다
      jobs-v2.json.tmp -> jobs-v2.json

파일을 쓰는 테스트라면 어느 것이든 걸렸고 단독 실행 시에는 통과했다. 운영 경로도
같은 코드를 쓰므로, 백신이 파일을 잡고 있으면 사용자가 작업 상태 저장을 잃는다.
"""
from __future__ import annotations

import os
from pathlib import Path

import pytest

from features.common.atomic_replace import replace_with_retry, write_bytes_atomic


def _sleeper(record: list[float]):
    def sleep(seconds: float) -> None:
        record.append(seconds)

    return sleep


def test_a_transient_denial_is_retried_until_it_clears(tmp_path: Path, monkeypatch) -> None:
    target = tmp_path / "store.json"
    source = tmp_path / "store.json.tmp"
    source.write_bytes(b"payload")
    real_replace = os.replace
    calls = {"n": 0}

    def flaky(src, dst):
        calls["n"] += 1
        if calls["n"] < 3:
            raise PermissionError(5, "Access is denied")
        return real_replace(src, dst)

    monkeypatch.setattr(os, "replace", flaky)
    waited: list[float] = []

    replace_with_retry(source, target, sleep=_sleeper(waited))

    assert target.read_bytes() == b"payload"
    assert calls["n"] == 3
    assert waited == [0.01, 0.02], "물러나는 간격이 늘어야 한다"


def test_a_permanent_denial_still_raises(tmp_path: Path, monkeypatch) -> None:
    """계속 잡혀 있으면 진짜 실패다. 삼키면 저장한 줄 알고 넘어간다."""
    source = tmp_path / "a.tmp"
    source.write_bytes(b"x")

    def always_denied(_src, _dst):
        raise PermissionError(5, "Access is denied")

    monkeypatch.setattr(os, "replace", always_denied)
    with pytest.raises(PermissionError):
        replace_with_retry(source, tmp_path / "a", attempts=3, sleep=lambda _seconds: None)


def test_errors_that_waiting_cannot_fix_are_raised_at_once(tmp_path: Path, monkeypatch) -> None:
    """경로가 없는 것은 기다린다고 생기지 않는다. 재시도하면 시간만 버린다."""
    calls = {"n": 0}

    def missing(_src, _dst):
        calls["n"] += 1
        raise FileNotFoundError(2, "No such file")

    monkeypatch.setattr(os, "replace", missing)
    with pytest.raises(FileNotFoundError):
        replace_with_retry(tmp_path / "nope", tmp_path / "target", sleep=lambda _seconds: None)
    assert calls["n"] == 1


def test_a_failed_write_leaves_no_stray_temporary(tmp_path: Path, monkeypatch) -> None:
    target = tmp_path / "nested" / "store.json"

    def always_denied(_src, _dst):
        raise PermissionError(5, "Access is denied")

    monkeypatch.setattr(os, "replace", always_denied)
    with pytest.raises(PermissionError):
        write_bytes_atomic(target, b"payload", sleep=lambda _seconds: None)

    assert not (target.parent / "store.json.tmp").exists()
    assert not target.exists()


def test_the_happy_path_writes_through(tmp_path: Path) -> None:
    target = tmp_path / "deep" / "store.json"
    write_bytes_atomic(target, b'{"ok": true}')
    assert target.read_bytes() == b'{"ok": true}'


def test_no_runtime_code_calls_os_replace_directly() -> None:
    """durable write는 전부 재시도 헬퍼를 거쳐야 한다.

    한 곳만 고치면 나머지가 남는다. 이 결함을 찾았을 때 같은 호출이 15개 파일에
    21곳 있었고, 전부 같은 방식으로 사용자 데이터를 잃을 수 있었다.
    """
    root = Path(__file__).resolve().parents[3] / "features"
    offenders = []
    for path in root.rglob("*.py"):
        parts = set(path.parts)
        if "tests" in parts or "__pycache__" in parts or path.name == "atomic_replace.py":
            continue
        if "os.replace(" in path.read_text(encoding="utf-8"):
            offenders.append(path.relative_to(root).as_posix())
    assert offenders == [], f"features/common/atomic_replace.py를 쓰세요: {offenders}"
