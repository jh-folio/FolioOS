"""Windows에서 원자적 교체가 거부될 때 잠깐 기다렸다 다시 시도한다.

`os.replace()`는 POSIX에서 대상 파일이 열려 있어도 성공하지만 Windows는 아니다.
다른 프로세스가 대상 핸들을 잡고 있으면 `WinError 5`(액세스 거부)나 `WinError 32`
(다른 프로세스가 사용 중)로 거부한다. 백신 실시간 검사, 검색 색인기, 탐색기
미리보기가 흔한 원인이며, 붙잡는 시간은 보통 수십 밀리초다.

한 번 거부됐다고 실패로 끝내면 사용자는 작업 상태나 보고서 저장을 잃는다.
짧게 다시 시도하면 대부분 그 사이에 풀린다. 그래도 안 되면 그때는 진짜 실패이므로
원래 예외를 그대로 올린다 — 삼키지 않는다.
"""
from __future__ import annotations

import os
import time
from collections.abc import Callable
from pathlib import Path

# 총 대기 시간은 0.31초다. 사용자가 멈춤을 느끼기에는 짧고, 파일 핸들이 풀리기에는
# 대체로 충분하다. 더 늘리면 정말 잠긴 파일에서 UI가 오래 멈춘다.
ATTEMPTS = 6
BASE_DELAY = 0.01


def replace_with_retry(
    source: str | os.PathLike[str],
    target: str | os.PathLike[str],
    *,
    attempts: int = ATTEMPTS,
    base_delay: float = BASE_DELAY,
    sleep: Callable[[float], None] = time.sleep,
) -> None:
    """`os.replace(source, target)`을 하되, 잠깐 잡혀 있으면 다시 시도한다.

    `PermissionError`만 재시도한다. 경로가 없거나 디렉터리가 읽기 전용인 경우처럼
    기다린다고 풀리지 않는 오류는 즉시 올린다.
    """
    for attempt in range(attempts):
        try:
            os.replace(source, target)
            return
        except PermissionError:
            if attempt == attempts - 1:
                raise
            sleep(base_delay * (2**attempt))


def write_bytes_atomic(
    path: Path,
    data: bytes,
    *,
    suffix: str = ".tmp",
    sleep: Callable[[float], None] = time.sleep,
) -> None:
    """임시 파일에 쓰고 제자리로 옮긴다. 실패하면 임시 파일을 남기지 않는다."""
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + suffix)
    try:
        temporary.write_bytes(data)
        replace_with_retry(temporary, path, sleep=sleep)
    except OSError:
        # 교체에 실패한 임시 파일은 쓰레기다. 지우다 또 실패해도 원래 오류를 가리지 않는다.
        try:
            temporary.unlink(missing_ok=True)
        except OSError:
            pass
        raise
