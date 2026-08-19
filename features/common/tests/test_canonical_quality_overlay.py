"""품질 재평가는 Personal Overlay를 낡았다고 말하지 않는다(§5 원칙 1).

`quality`는 canonicalRevision 지문에 포함되는 필드라 재평가 커밋이 리비전 번호·해시를
반드시 올린다. 예전에는 그 변화만으로 overlay에 stale=True가 찍혀, Canonical 본문이
한 글자도 안 바뀌었는데 화면이 "본문이 바뀌어 개인 해석이 낡았다"고 말했다.

    py -3 -m pytest features/common/tests/test_canonical_quality_overlay.py -q
"""
from __future__ import annotations

import json
import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.common.canonical_identity import ReportKind
from features.common.canonical_report_state import canonical_content_hash, revision
from features.common.canonical_report_types import WriteKind
from features.common.canonical_reports import commit_sync, prepare
from features.personal_overlay import schema as PS
from features.personal_overlay import service as PSvc

BASE = {"date": "2099-01-05", "marketScope": "us", "markdown": "# 본문"}


def _commit(path, candidate, write_kind=WriteKind.CANONICAL):
    commit_sync(prepare(
        report_kind=ReportKind.BRIEFING,
        exact_path=path,
        write_kind=write_kind,
        candidate=candidate,
    ))
    return json.loads(path.read_text(encoding="utf-8"))


def _report_with_overlay(tmp_path):
    briefings = tmp_path / "briefings"
    briefings.mkdir()
    path = briefings / "2099-01-05.us.json"
    saved = _commit(path, dict(BASE))
    overlay = PSvc.with_overlay(saved, PS.normalize_overlay({"supportingEvidence": ["x"]}), status="ok")
    saved = _commit(path, {"personalOverlay": overlay["personalOverlay"]}, WriteKind.OVERLAY)
    return path, saved


def _projection(report):
    return PS.public_projection(report.get("personalOverlay"), canonical_revision=report.get("canonicalRevision"))


def test_quality_recheck_keeps_the_overlay_current(tmp_path):
    path, saved = _report_with_overlay(tmp_path)
    assert _projection(saved)["revisionState"] == "current"
    before = revision(saved)

    after = _commit(path, {**saved, "quality": {"status": "pass", "score": 82}})

    assert after["markdown"] == saved["markdown"]
    # 지문에 quality가 들어가므로 리비전은 올라간다(빼면 기존 저장물이 전부 깨진다).
    assert after["canonicalRevision"]["number"] == before[0] + 1
    assert after["canonicalRevision"]["hash"] == canonical_content_hash(after)
    # 그러나 overlay는 낡지 않았다 — 포인터만 새 리비전으로 따라 올라간다.
    assert after["personalOverlay"]["stale"] is False
    assert after["personalOverlay"]["canonicalRevision"] == {
        "number": after["canonicalRevision"]["number"],
        "hash": after["canonicalRevision"]["hash"],
    }
    projection = _projection(after)
    assert projection["stale"] is False
    assert projection["revisionState"] == "current"


def test_markdown_change_still_marks_the_overlay_stale(tmp_path):
    path, saved = _report_with_overlay(tmp_path)

    after = _commit(path, {**saved, "markdown": "# 본문 v2"})

    assert after["personalOverlay"]["stale"] is True
    assert after["personalOverlay"]["staleReason"] == "canonical_revision_changed"
    assert _projection(after)["revisionState"] == "stale"


def test_quality_recheck_does_not_revive_an_already_stale_overlay(tmp_path):
    """이미 낡은 overlay를 품질 재평가가 되살리면 안 된다."""
    path, saved = _report_with_overlay(tmp_path)
    stale = _commit(path, {**saved, "markdown": "# 본문 v2"})

    after = _commit(path, {**stale, "quality": {"status": "warn"}})

    assert after["personalOverlay"]["stale"] is True
    assert _projection(after)["revisionState"] == "stale"


def test_quality_recheck_on_a_report_without_overlay_is_unchanged(tmp_path):
    briefings = tmp_path / "briefings"
    briefings.mkdir()
    path = briefings / "2099-01-06.us.json"
    saved = _commit(path, {**BASE, "date": "2099-01-06"})

    after = _commit(path, {**saved, "quality": {"status": "pass"}})

    assert "personalOverlay" not in after
    assert after["canonicalRevision"]["number"] == 2
    assert revision(after) is not None


def test_recheck_quality_service_keeps_the_overlay_current(tmp_path, monkeypatch):
    """서비스 경로(POST /api/research-quality/recheck)도 같은 계약을 지킨다."""
    from features.common.research_quality import service as svc

    path, saved = _report_with_overlay(tmp_path)
    monkeypatch.setattr(svc, "DATA_DIR", tmp_path)
    monkeypatch.setattr(svc, "load_artifact", lambda _t, _i: json.loads(path.read_text(encoding="utf-8")))

    result = svc.recheck_quality("briefing", "2099-01-05.us")
    after = json.loads(path.read_text(encoding="utf-8"))

    assert result["saved"] is True
    assert after["markdown"] == saved["markdown"]
    assert _projection(after)["stale"] is False
    assert _projection(after)["revisionState"] == "current"
