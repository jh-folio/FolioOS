from __future__ import annotations

import json
import re
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import UUID

import pytest

from features.topic_report.approval_store import (
    ApprovalExpiredError,
    ApprovalMismatchError,
    ApprovalProof,
    ApprovalStore,
    ApprovalStoreRuntime,
    ApprovalSupersededError,
)
from features.topic_report.approved_request import (
    ApprovedRequestRuntime,
    ApprovedRequestService,
    IntegrityMismatchError,
)
from features.topic_report.approved_schema import (
    ConfirmDegradedRequest,
    GenerateApprovedRequest,
    PlanRequest,
)
from features.topic_report.resolution_schema import (
    ProviderGenerations,
    ResolutionSnapshotV1,
)


def missing_index_resolution() -> ResolutionSnapshotV1:
    return ResolutionSnapshotV1(
        schemaVersion=1,
        collectionId=None,
        collectionRevision=None,
        collectionDefinitionHash=None,
        eligibleTotal=None,
        candidateCap=None,
        truncated=False,
        resolvedCandidateIds=[],
        executionUniverseIds=[],
        unusableCandidates=[],
        selectedEvidenceIds=[],
        providerGenerations=ProviderGenerations(indexGeneration=None, rssGeneration=None),
        inputWatermark=None,
    )


def make_service(tmp_path: Path, now_box: list[datetime]) -> ApprovedRequestService:
    ids = iter(
        [
            UUID("12345678-1234-4567-9234-567812345678"),
            UUID("22345678-1234-4567-9234-567812345678"),
            UUID("32345678-1234-4567-9234-567812345678"),
        ]
    )
    runtime = ApprovedRequestRuntime(
        dataDir=tmp_path,
        clock=lambda: now_box[0],
        entropy=lambda size: bytes(range(size)),
        uuidFactory=lambda: next(ids),
        resolver=lambda _request: missing_index_resolution(),
    )
    return ApprovedRequestService(runtime)


def test_plan_preview_has_exact_wrapper_zero_evidence_and_hypothesis_layer(tmp_path: Path) -> None:
    given_now = [datetime(2026, 7, 16, 3, 4, 5, tzinfo=UTC)]
    given_service = make_service(tmp_path, given_now)
    given_request = PlanRequest(question="AI 전력 수요", userContext="private hypothesis")

    when_envelope = given_service.plan(given_request)
    when_payload = when_envelope.model_dump(mode="json")

    assert set(when_payload) == {"approvedRequest", "approval", "preview"}
    assert when_payload["approvedRequest"]["contextLayer"] == "hypothesis"
    assert when_payload["preview"]["zeroEvidence"]["required"] is True
    assert when_payload["preview"]["zeroEvidence"]["reasonCode"] == "no_index"
    assert re.fullmatch(r"rf1_[0-9a-f]{64}", when_payload["preview"]["zeroEvidence"]["resolutionFingerprint"])
    assert re.fullmatch(r"[A-Za-z0-9_-]{43}", when_payload["approval"]["token"])
    assert when_payload["preview"]["resolution"] == missing_index_resolution().model_dump(mode="json")


def test_approval_ledger_contains_only_metadata(tmp_path: Path) -> None:
    given_now = [datetime(2026, 7, 16, tzinfo=UTC)]
    given_service = make_service(tmp_path, given_now)

    when_envelope = given_service.plan(
        PlanRequest(question="PRIVATE_QUESTION_CANARY", userContext="PRIVATE_CONTEXT_CANARY")
    )
    when_store = (tmp_path / "topic-plan-approvals.json").read_text(encoding="utf-8")

    assert when_envelope.approvedRequest.planHash in when_store
    assert "PRIVATE_QUESTION_CANARY" not in when_store
    assert "PRIVATE_CONTEXT_CANARY" not in when_store
    assert when_envelope.approval.token not in when_store
    assert set(json.loads(when_store)["approvals"][0]) == {
        "id",
        "tokenHash",
        "planHash",
        "issuedAt",
        "expiresAt",
        "status",
        "jobId",
    }


def test_valid_schema_rehashed_tamper_is_rejected_by_opaque_authorization(tmp_path: Path) -> None:
    given_now = [datetime(2026, 7, 16, tzinfo=UTC)]
    given_service = make_service(tmp_path, given_now)
    given_envelope = given_service.plan(PlanRequest(question="원래 질문"))
    given_payload = given_envelope.approvedRequest.model_dump(mode="json")
    given_payload["question"] = "변조된 질문"
    given_payload["planHash"] = given_service.hash_approved_payload(given_payload)
    given_generate = GenerateApprovedRequest.model_validate(
        {
            "approvedRequest": given_payload,
            "approval": {
                "id": given_envelope.approval.id,
                "token": given_envelope.approval.token,
            },
            "execution": {
                "mode": "direct",
                "adapter": "auto",
                "fallbackPolicy": "rules_on_engine_failure",
            },
        }
    )

    with pytest.raises(ApprovalMismatchError):
        given_service.preflight(given_generate)


def test_stale_plan_hash_is_rejected_before_authorization(tmp_path: Path) -> None:
    given_now = [datetime(2026, 7, 16, tzinfo=UTC)]
    given_service = make_service(tmp_path, given_now)
    given_envelope = given_service.plan(PlanRequest(question="원래 질문"))
    given_payload = given_envelope.approvedRequest.model_dump(mode="json")
    given_payload["question"] = "변조된 질문"
    given_generate = GenerateApprovedRequest.model_validate(
        {
            "approvedRequest": given_payload,
            "approval": {"id": given_envelope.approval.id, "token": given_envelope.approval.token},
            "execution": {
                "mode": "direct",
                "adapter": "auto",
                "fallbackPolicy": "rules_on_engine_failure",
            },
        }
    )

    with pytest.raises(IntegrityMismatchError):
        given_service.preflight(given_generate)


def test_confirm_degraded_uses_preview_directly_and_supersedes_old_approval(tmp_path: Path) -> None:
    given_now = [datetime(2026, 7, 16, tzinfo=UTC)]
    given_service = make_service(tmp_path, given_now)
    given_envelope = given_service.plan(PlanRequest(question="근거 없는 질문"))
    given_zero = given_envelope.preview.zeroEvidence
    given_confirm = ConfirmDegradedRequest.model_validate(
        {
            "approvedRequest": given_envelope.approvedRequest.model_dump(mode="json"),
            "approval": {"id": given_envelope.approval.id, "token": given_envelope.approval.token},
            "reasonCode": given_zero.reasonCode,
            "resolutionFingerprint": given_zero.resolutionFingerprint,
            "confirmed": True,
        }
    )

    when_replacement = given_service.confirm(given_confirm)
    when_definition_hash = given_service.definition_plan_hash(when_replacement.approvedRequest)

    assert when_replacement.approvedRequest.degradedConfirmation is not None
    assert when_replacement.approvedRequest.planHash != given_envelope.approvedRequest.planHash
    assert when_definition_hash == given_envelope.approvedRequest.planHash
    assert when_replacement.preview.zeroEvidence == given_envelope.preview.zeroEvidence
    with pytest.raises(ApprovalSupersededError):
        given_service.confirm(given_confirm)


def test_approval_ttl_equality_and_consumed_replay_survive_restart(tmp_path: Path) -> None:
    given_now = [datetime(2026, 7, 16, tzinfo=UTC)]
    given_ids = iter(
        [
            UUID("42345678-1234-4567-9234-567812345678"),
            UUID("52345678-1234-4567-9234-567812345678"),
        ]
    )
    given_runtime = ApprovalStoreRuntime(
        path=tmp_path / "topic-plan-approvals.json",
        clock=lambda: given_now[0],
        entropy=lambda size: b"a" * size,
        uuidFactory=lambda: next(given_ids),
    )
    given_store = ApprovalStore(given_runtime)
    given_first = given_store.issue("a" * 64)
    given_now[0] += timedelta(minutes=30)

    with pytest.raises(ApprovalExpiredError):
        given_store.authorize(ApprovalProof(id=given_first.id, token=given_first.token, planHash="a" * 64))

    given_now[0] -= timedelta(minutes=30)
    given_second = given_store.issue("b" * 64)
    given_proof = ApprovalProof(id=given_second.id, token=given_second.token, planHash="b" * 64)
    given_store.consume(given_proof, "job_example")
    given_now[0] += timedelta(days=1)
    when_restarted = ApprovalStore(given_runtime).authorize(given_proof)

    assert when_restarted.status == "consumed"
    assert when_restarted.jobId == "job_example"
