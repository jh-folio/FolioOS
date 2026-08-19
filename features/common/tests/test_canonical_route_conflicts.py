"""Canonical 커밋 충돌은 500이 아니라 409로 나간다.

동시 커밋(제안 승인·예약 생성)이나 정체성 불일치는 서버 고장이 아니다. 500으로 나가면
화면이 "다시 시도"밖에 말할 수 없고, 사용자는 무엇이 어긋났는지 알 수 없다.

    py -3 -m pytest features/common/tests/test_canonical_route_conflicts.py -q
"""
from __future__ import annotations

import os
import sys

import pytest
from fastapi import HTTPException

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

import app as A
from features.common.canonical_identity import CanonicalIdentityError
from features.common.canonical_reports import CanonicalConflictError, CanonicalValidationError

CASES = [
    CanonicalConflictError("canonical_base_changed", "canonical report changed after prepare"),
    CanonicalValidationError("canonical_revision_hash_invalid", "canonicalRevision hash does not match content"),
    CanonicalIdentityError("canonical_path_invalid", "canonical path must end in .json"),
]


def _raise(exc):
    def boom(*_args, **_kwargs):
        raise exc

    return boom


@pytest.fixture(autouse=True)
def _direct_generation(monkeypatch):
    # llm_cli 모드는 라우트가 잡을 제출하고 바로 반환한다. 여기서 보려는 것은
    # 서비스를 직접 부르는 경로의 예외 매핑이다.
    monkeypatch.setattr(A, "request_generation_mode", lambda _body: "rules")


@pytest.mark.parametrize("exc", CASES)
def test_briefing_overlay_route_maps_canonical_errors_to_409(monkeypatch, exc):
    monkeypatch.setattr(A, "attach_overlay_to_briefing", _raise(exc))

    with pytest.raises(HTTPException) as caught:
        A.api_briefing_personal_overlay("2099-01-05", marketScope="us", body={})

    assert caught.value.status_code == 409
    assert caught.value.detail["code"] == exc.code


@pytest.mark.parametrize("exc", CASES)
def test_analysis_overlay_route_maps_canonical_errors_to_409(monkeypatch, exc):
    monkeypatch.setattr(A, "attach_overlay_to_report", _raise(exc))

    with pytest.raises(HTTPException) as caught:
        A.api_analysis_personal_overlay("NVDA:2099-01-05", body={})

    assert caught.value.status_code == 409
    assert caught.value.detail["code"] == exc.code


@pytest.mark.parametrize("exc", CASES)
def test_quality_recheck_route_maps_canonical_errors_to_409(monkeypatch, exc):
    monkeypatch.setattr(A, "recheck_research_quality", _raise(exc))

    with pytest.raises(HTTPException) as caught:
        A.api_research_quality_recheck("briefing", "2099-01-05.us")

    assert caught.value.status_code == 409
    assert caught.value.detail["code"] == exc.code


def test_missing_report_still_maps_to_404(monkeypatch):
    monkeypatch.setattr(A, "recheck_research_quality", _raise(FileNotFoundError("gone")))

    with pytest.raises(HTTPException) as caught:
        A.api_research_quality_recheck("briefing", "2099-01-05.us")

    assert caught.value.status_code == 404
