"""브리지 자체를 검사하는 테스트는 루트 가드를 끈다.

루트 `conftest.py`는 테스트가 Agent CLI 프로세스를 띄우지 못하도록 `_invoke_agent_cli`를
막는다. 그런데 이 폴더의 테스트는 **바로 그 함수가 검사 대상**이라, 막아 두면 확인해야 할
동작(프롬프트를 stdin으로 보내는가, 거부당하면 즉시 실패하는가)을 볼 수 없다.

여기 테스트는 대신 `subprocess.Popen`을 자기 손으로 stub해서 실제 프로세스를 띄우지
않는다. 같은 이름의 fixture로 덮어 쓰는 것이 pytest가 정한 방식이다.
"""
from __future__ import annotations

import pytest


@pytest.fixture(autouse=True)
def no_agent_cli_process():
    return None
