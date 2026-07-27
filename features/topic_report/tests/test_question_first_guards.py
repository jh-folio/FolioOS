from __future__ import annotations

import json
from pathlib import Path

import pytest

from features.common.jcs import JsonValue
from features.topic_report.approval_store import ApprovalStoreUnavailableError
from features.topic_report.routes import ApprovedRequestBoundary


def _json_response(response) -> dict[str, JsonValue]:
    payload = json.loads(response.body)
    assert isinstance(payload, dict)
    return payload


def _mutation_snapshot(root: Path) -> tuple[int, int, dict[str, bytes]]:
    files = {
        path.relative_to(root).as_posix(): path.read_bytes()
        for path in root.rglob("*")
        if path.is_file()
    }
    reports_dir = root / "topic-reports"
    report_count = len(tuple(reports_dir.glob("*.json"))) if reports_dir.exists() else 0
    job_count = 0
    for store_name in ("jobs-v2.json", "jobs.json"):
        store = root / store_name
        if not store.exists():
            continue
        payload = json.loads(store.read_text(encoding="utf-8"))
        jobs = payload.get("jobs", [])
        assert isinstance(jobs, list)
        job_count += len(jobs)
    return report_count, job_count, files


@pytest.mark.parametrize(
    "body",
    [
        {"question": ""},
        {"question": "   "},
        {"question": "valid question", "unknown": "rejected"},
    ],
    ids=["blank", "whitespace", "unknown-field"],
)
def test_plan_rejects_malformed_question_without_any_store_mutation(
    tmp_path: Path,
    body: dict[str, JsonValue],
) -> None:
    boundary = ApprovedRequestBoundary(tmp_path)
    before = _mutation_snapshot(tmp_path)

    response = boundary.plan(body)

    assert response.status_code == 422
    assert _json_response(response) == {"error": "validation_error"}
    assert _mutation_snapshot(tmp_path) == before
    assert not (tmp_path / "topic-plan-approvals.json").exists()


def test_injected_plan_service_failure_is_controlled_and_does_not_issue_approval(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    boundary = ApprovedRequestBoundary(tmp_path)
    before = _mutation_snapshot(tmp_path)

    def fail_plan(_body) -> None:
        raise ApprovalStoreUnavailableError

    monkeypatch.setattr(boundary._service, "plan", fail_plan)

    response = boundary.plan({"question": "controlled plan failure"})

    assert response.status_code == 503
    assert _json_response(response) == {"error": "approval_store_unavailable"}
    assert _mutation_snapshot(tmp_path) == before
    assert not (tmp_path / "topic-plan-approvals.json").exists()


def test_valid_plan_preview_issues_metadata_only_without_report_or_job(tmp_path: Path) -> None:
    boundary = ApprovedRequestBoundary(tmp_path)
    before = _mutation_snapshot(tmp_path)

    response = boundary.plan({"question": "AI power demand"})

    assert response.status_code == 200
    envelope = _json_response(response)
    assert set(envelope) == {"approvedRequest", "approval", "preview"}
    approval = envelope["approval"]
    assert isinstance(approval, dict)
    assert approval["id"].startswith("apr_")
    assert isinstance(approval["token"], str)
    assert (tmp_path / "topic-plan-approvals.json").exists()
    after = _mutation_snapshot(tmp_path)
    assert after[0:2] == before[0:2] == (0, 0)
    assert set(after[2]) == {"topic-plan-approvals.json"}
