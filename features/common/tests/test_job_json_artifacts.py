from __future__ import annotations

import gzip
import json
from datetime import UTC, datetime
from pathlib import Path

import pytest

from features.common.canonical_identity import ReportKind
from features.common.canonical_report_types import CanonicalConflictError
from features.common.canonical_report_types import WriteKind
from features.common.job_json_artifacts import (
    CanonicalArtifactSpec,
    CommitInterruptedError,
    JobArtifactValidationError,
    JobArtifactWorkspace,
    JobArtifactConflictError,
    JsonArtifactSpec,
    recover_json_job,
    recover_json_jobs_startup,
)
from features.common.shared_jobs_private import JobPrivateLifecycle
from features.common.shared_jobs_projection import new_shared_job
from features.common.shared_jobs_schema import JobStatus, StorageKind
from features.common.shared_jobs_store import SharedJobStore


NOW = datetime(2026, 7, 18, 0, 0, tzinfo=UTC)


def _clock() -> datetime:
    return NOW


def _running_job(store: SharedJobStore, task_type: str = "company_analysis"):
    job = new_shared_job(
        kind="agent_bridge",
        task_type=task_type,
        generation_mode="llm_cli",
        adapter="codex",
        requested_mode="cli",
        mode="generate",
        attempted_engine="cli",
        clock=_clock,
    )
    store.add(job)
    store.transition(job.id, JobStatus.RUNNING)
    current = store.get(job.id)
    assert current is not None
    return current


def _status(store: SharedJobStore, job_id: str) -> JobStatus:
    current = store.get(job_id)
    assert current is not None
    return current.status


def test_bundle_claims_intent_before_sorted_json_and_gzip_promotion(tmp_path: Path) -> None:
    # Given: complete canonical and gzip outputs staged for one running job.
    data_root = tmp_path / "data"
    store = SharedJobStore(data_root / "jobs-v2.json", data_root / "jobs.json", clock=_clock)
    lifecycle = JobPrivateLifecycle(data_root / "job-context", clock=_clock)
    job = _running_job(store)
    lifecycle.set_private(job.id, {"prompt": "INSTRUCTION_CANARY"})
    company_path = data_root / "company-analysis" / "company-01.json"
    visual_path = data_root / "briefings" / "2026-07-18.us.visuals.json.gz"
    workspace = JobArtifactWorkspace(data_root, clock=_clock)
    bundle = workspace.stage(
        job,
        [
            CanonicalArtifactSpec(
                artifact_type="company_analysis_report",
                artifact_id="company-01",
                report_kind=ReportKind.COMPANY_ANALYSIS,
                exact_path=company_path,
                write_kind=WriteKind.CANONICAL,
                candidate={
                    "id": "company-01",
                    "generatedAt": "2026-07-18T00:00:00Z",
                    "markdown": "# Company",
                },
            ),
            JsonArtifactSpec(
                storage=StorageKind.GZIP_JSON,
                artifact_type="briefing_visual",
                artifact_id="2026-07-18.us",
                exact_path=visual_path,
                payload={"date": "2026-07-18", "snapshots": {"SPY": {"rows": [1, 2]}}},
            ),
        ],
        terminal_result={
            "reportId": "company-01",
            "artifactId": "company-01",
            "date": "2026-07-18",
            "title": "Company",
        },
    )
    observed: list[str] = []

    def observe(phase: str) -> None:
        observed.append(phase)
        if phase == "intent_claimed":
            claimed = store.get(job.id)
            assert claimed is not None and claimed.status == JobStatus.COMMITTING
            assert not company_path.exists()
            assert not visual_path.exists()

    # When: the bundle is committed through the real store and private lifecycle.
    workspace.commit(bundle, store, lifecycle, fault_hook=observe)

    # Then: both exact targets carry the marker and terminal cleanup removed private state.
    company = json.loads(company_path.read_text(encoding="utf-8"))
    with gzip.open(visual_path, "rt", encoding="utf-8") as stream:
        visual = json.load(stream)
    assert company["canonicalRevision"]["number"] == 1
    assert company["jobCommit"] == {"jobId": job.id, "operationId": bundle.operation_id}
    assert visual["jobCommit"] == {"jobId": job.id, "operationId": bundle.operation_id}
    assert observed.index("intent_claimed") < observed.index("promoted:briefing_visual:2026-07-18.us")
    assert _status(store, job.id) == JobStatus.DONE
    assert not (data_root / "job-staging" / job.id).exists()
    assert not (data_root / "job-commits" / f"{job.id}.json").exists()
    assert not lifecycle.has_private(job.id)


def test_partial_multi_artifact_commit_resumes_in_sorted_order(tmp_path: Path) -> None:
    # Given: two scoped canonical reports and a link staged before any promotion.
    data_root = tmp_path / "data"
    store = SharedJobStore(data_root / "jobs-v2.json", data_root / "jobs.json", clock=_clock)
    lifecycle = JobPrivateLifecycle(data_root / "job-context", clock=_clock)
    job = _running_job(store, "briefing")
    workspace = JobArtifactWorkspace(data_root, clock=_clock)
    specs = [
        CanonicalArtifactSpec(
            artifact_type="briefing_report",
            artifact_id=f"2026-07-18.{scope}",
            report_kind=ReportKind.BRIEFING,
            exact_path=data_root / "briefings" / f"2026-07-18.{scope}.json",
            write_kind=WriteKind.CANONICAL,
            candidate={"date": "2026-07-18", "marketScope": scope, "markdown": f"# {scope}"},
        )
        for scope in ("us", "kr")
    ]
    specs.append(
        JsonArtifactSpec(
            storage=StorageKind.JSON,
            artifact_type="briefing_link",
            artifact_id="2026-07-18",
            exact_path=data_root / "briefings" / "2026-07-18.link.json",
            payload={"date": "2026-07-18", "links": []},
        )
    )
    bundle = workspace.stage(
        job,
        specs,
        terminal_result={
            "reportId": "2026-07-18",
            "artifactId": "2026-07-18",
            "date": "2026-07-18",
            "title": "Daily Briefing",
        },
    )
    promotions = 0

    def interrupt_after_first(phase: str) -> None:
        nonlocal promotions
        if phase.startswith("promoted:"):
            promotions += 1
        if promotions == 1:
            raise CommitInterruptedError("after_first_promotion")

    # When: the first pass is interrupted after one exact target promotion.
    with pytest.raises(CommitInterruptedError):
        workspace.commit(bundle, store, lifecycle, fault_hook=interrupt_after_first)
    assert _status(store, job.id) == JobStatus.COMMITTING

    # Then: startup recovery resumes remaining targets and exposes one done projection.
    recovered = recover_json_job(data_root, job.id, store, lifecycle, clock=_clock)
    assert recovered is True
    assert _status(store, job.id) == JobStatus.DONE
    for name in ("2026-07-18.us.json", "2026-07-18.kr.json", "2026-07-18.link.json"):
        assert (data_root / "briefings" / name).is_file()
    assert not (data_root / "job-staging" / job.id).exists()


def test_conflicting_target_is_preserved_and_recovery_fails_without_overwrite(tmp_path: Path) -> None:
    # Given: a staged review target that is replaced by another operation after intent claim.
    data_root = tmp_path / "data"
    store = SharedJobStore(data_root / "jobs-v2.json", data_root / "jobs.json", clock=_clock)
    lifecycle = JobPrivateLifecycle(data_root / "job-context", clock=_clock)
    job = _running_job(store, "investment_review")
    target = data_root / "investment-review" / "2026-07-18.json"
    workspace = JobArtifactWorkspace(data_root, clock=_clock)
    bundle = workspace.stage(
        job,
        [
            JsonArtifactSpec(
                storage=StorageKind.JSON,
                artifact_type="investment_review",
                artifact_id="2026-07-18",
                exact_path=target,
                payload={"date": "2026-07-18", "summary": "prepared"},
            )
        ],
        terminal_result={"reportId": "2026-07-18", "artifactId": "2026-07-18", "date": "2026-07-18"},
    )
    conflicting = {"date": "2026-07-18", "summary": "other operation", "jobCommit": {"jobId": "other", "operationId": "other"}}

    def replace_after_intent(phase: str) -> None:
        if phase == "journal_prepared":
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(json.dumps(conflicting), encoding="utf-8")

    # When: promotion observes a target owned by another operation.
    with pytest.raises(JobArtifactConflictError):
        workspace.commit(bundle, store, lifecycle, fault_hook=replace_after_intent)
    before = target.read_bytes()
    recovered = recover_json_job(data_root, job.id, store, lifecycle, clock=_clock)

    # Then: recovery marks a safe terminal failure and preserves the conflicting bytes.
    assert recovered is False
    assert target.read_bytes() == before
    assert _status(store, job.id) == JobStatus.FAILED_COMMIT_RECOVERY


@pytest.mark.parametrize(
    "interrupt_phase",
    [
        "intent_claimed",
        "journal_prepared",
        "promoted:investment_review:2026-07-18",
        "artifacts_written",
        "staging_cleaned",
        "job_terminal",
    ],
)
def test_startup_completes_json_commit_after_every_commit_phase(
    tmp_path: Path,
    interrupt_phase: str,
) -> None:
    # Given: one staged review bundle with durable private context.
    data_root = tmp_path / interrupt_phase.replace(":", "_") / "data"
    store = SharedJobStore(data_root / "jobs-v2.json", data_root / "jobs.json", clock=_clock)
    lifecycle = JobPrivateLifecycle(data_root / "job-context", clock=_clock)
    job = _running_job(store, "investment_review")
    lifecycle.write_pack(job.id, "pack", {"canary": "PRIVATE"})
    workspace = JobArtifactWorkspace(data_root, clock=_clock)
    target = data_root / "investment-review" / "2026-07-18.json"
    bundle = workspace.stage(
        job,
        [
            JsonArtifactSpec(
                storage=StorageKind.JSON,
                artifact_type="investment_review",
                artifact_id="2026-07-18",
                exact_path=target,
                payload={"date": "2026-07-18", "summary": interrupt_phase},
            )
        ],
        terminal_result={"reportId": "2026-07-18", "artifactId": "2026-07-18", "date": "2026-07-18"},
    )

    def interrupt(phase: str) -> None:
        if phase == interrupt_phase:
            raise CommitInterruptedError(phase)

    # When: execution stops at a commit boundary and startup recovery runs.
    with pytest.raises(CommitInterruptedError):
        workspace.commit(bundle, store, lifecycle, fault_hook=interrupt)
    restarted = JobPrivateLifecycle(data_root / "job-context", clock=_clock)
    recover_json_jobs_startup(data_root, store, restarted, clock=_clock)

    # Then: the exact saved target is readable, terminal, and has no private runtime residue.
    saved = _read_json(target)
    assert saved["summary"] == interrupt_phase
    assert saved["jobCommit"] == {"jobId": job.id, "operationId": bundle.operation_id}
    assert _status(store, job.id) == JobStatus.DONE
    assert not (data_root / "job-staging" / job.id).exists()
    assert not (data_root / "job-commits" / f"{job.id}.json").exists()
    assert not (data_root / "job-context" / job.id).exists()


def test_startup_recovers_promoted_canonical_after_artifacts_written(tmp_path: Path) -> None:
    # Given: a canonical report was promoted before the process stopped at artifacts_written.
    data_root = tmp_path / "data"
    store = SharedJobStore(data_root / "jobs-v2.json", data_root / "jobs.json", clock=_clock)
    lifecycle = JobPrivateLifecycle(data_root / "job-context", clock=_clock)
    job = _running_job(store, "topic_report")
    lifecycle.write_pack(job.id, "pack", {"canary": "PRIVATE"})
    target = data_root / "topic-reports" / "topic-01.json"
    workspace = JobArtifactWorkspace(data_root, clock=_clock)
    bundle = workspace.stage(
        job,
        [
            CanonicalArtifactSpec(
                artifact_type="topic_report",
                artifact_id="topic-01",
                report_kind=ReportKind.TOPIC_REPORT,
                exact_path=target,
                write_kind=WriteKind.CANONICAL,
                candidate={"id": "topic-01", "markdown": "# Topic"},
            )
        ],
        terminal_result={
            "artifactId": "topic-01",
            "reportId": "topic-01",
            "date": "2026-07-18",
            "title": "Topic",
        },
    )

    def interrupt(phase: str) -> None:
        if phase == "artifacts_written":
            raise CommitInterruptedError(phase)

    with pytest.raises(CommitInterruptedError):
        workspace.commit(bundle, store, lifecycle, fault_hook=interrupt)
    assert target.is_file()
    assert not bundle.artifacts[0].staged_path.exists()
    assert _status(store, job.id) == JobStatus.COMMITTING

    # When: startup reconstructs the bundle from the durable intent and promoted target.
    restarted = JobPrivateLifecycle(data_root / "job-context", clock=_clock)
    recovered = recover_json_job(data_root, job.id, store, restarted, clock=_clock)

    # Then: the report becomes done and all private commit residue is removed.
    assert recovered is True
    assert _status(store, job.id) == JobStatus.DONE
    assert _read_json(target)["id"] == "topic-01"
    assert not (data_root / "job-staging" / job.id).exists()
    assert not (data_root / "job-commits" / f"{job.id}.json").exists()
    assert not (data_root / "job-context" / job.id).exists()


@pytest.mark.parametrize("target_state", ["missing", "marker_mismatch"])
def test_promoted_canonical_recovery_fails_closed_when_target_is_not_exact(
    tmp_path: Path,
    target_state: str,
) -> None:
    # Given: canonical staging was consumed, but the promoted target is absent or no longer owned.
    data_root = tmp_path / target_state / "data"
    store = SharedJobStore(data_root / "jobs-v2.json", data_root / "jobs.json", clock=_clock)
    lifecycle = JobPrivateLifecycle(data_root / "job-context", clock=_clock)
    job = _running_job(store, "topic_report")
    target = data_root / "topic-reports" / "topic-01.json"
    workspace = JobArtifactWorkspace(data_root, clock=_clock)
    bundle = workspace.stage(
        job,
        [
            CanonicalArtifactSpec(
                artifact_type="topic_report",
                artifact_id="topic-01",
                report_kind=ReportKind.TOPIC_REPORT,
                exact_path=target,
                write_kind=WriteKind.CANONICAL,
                candidate={"id": "topic-01", "markdown": "# Topic"},
            )
        ],
        terminal_result={
            "artifactId": "topic-01",
            "reportId": "topic-01",
            "date": "2026-07-18",
            "title": "Topic",
        },
    )

    def interrupt(phase: str) -> None:
        if phase == "artifacts_written":
            raise CommitInterruptedError(phase)

    with pytest.raises(CommitInterruptedError):
        workspace.commit(bundle, store, lifecycle, fault_hook=interrupt)
    if target_state == "missing":
        target.unlink()
        preserved = None
    else:
        changed = _read_json(target)
        changed["jobCommit"] = {"jobId": "other-job", "operationId": "other-operation"}
        target.write_text(json.dumps(changed), encoding="utf-8")
        preserved = target.read_bytes()

    # When: recovery validates the only possible durable source.
    recovered = recover_json_job(data_root, job.id, store, lifecycle, clock=_clock)

    # Then: it fails closed, never recreates or overwrites the non-exact target, and scrubs residue.
    assert recovered is False
    assert _status(store, job.id) == JobStatus.FAILED_COMMIT_RECOVERY
    assert (target.read_bytes() if target.exists() else None) == preserved
    assert not (data_root / "job-staging" / job.id).exists()
    assert not (data_root / "job-commits" / f"{job.id}.json").exists()


def test_failed_staging_removes_partial_private_bundle(tmp_path: Path) -> None:
    # Given: a running job and invalid artifact metadata discovered after stage root creation.
    data_root = tmp_path / "data"
    store = SharedJobStore(data_root / "jobs-v2.json", data_root / "jobs.json", clock=_clock)
    job = _running_job(store)
    workspace = JobArtifactWorkspace(data_root, clock=_clock)

    # When: staging rejects an empty artifact type.
    with pytest.raises(ValueError):
        workspace.stage(
            job,
            [
                JsonArtifactSpec(
                    storage=StorageKind.JSON,
                    artifact_type="",
                    artifact_id="bad",
                    exact_path=data_root / "reviews" / "bad.json",
                    payload={"date": "2026-07-18"},
                )
            ],
            terminal_result={"artifactId": "bad"},
        )

    # Then: no partial stage survives before a commit claim exists.
    assert not (data_root / "job-staging" / job.id).exists()


def _read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def test_canonical_target_change_is_preserved_and_recovery_terminalizes(tmp_path: Path) -> None:
    # Given: a staged company report whose exact target is changed before promotion.
    data_root = tmp_path / "data"
    store = SharedJobStore(data_root / "jobs-v2.json", data_root / "jobs.json", clock=_clock)
    lifecycle = JobPrivateLifecycle(data_root / "job-context", clock=_clock)
    job = _running_job(store)
    target = data_root / "company-analysis" / "company-01.json"
    workspace = JobArtifactWorkspace(data_root, clock=_clock)
    bundle = workspace.stage(
        job,
        [
            CanonicalArtifactSpec(
                artifact_type="company_analysis_report",
                artifact_id="company-01",
                report_kind=ReportKind.COMPANY_ANALYSIS,
                exact_path=target,
                write_kind=WriteKind.CANONICAL,
                candidate={"id": "company-01", "markdown": "# Prepared"},
            )
        ],
        terminal_result={
            "artifactId": "company-01",
            "reportId": "company-01",
            "date": "2026-07-18",
            "title": "Company",
        },
    )
    conflicting = {"id": "company-01", "markdown": "# Other"}

    def replace_target(phase: str) -> None:
        if phase == "journal_prepared":
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(json.dumps(conflicting), encoding="utf-8")

    # When: canonical promotion and startup recovery both observe the stale base.
    with pytest.raises(CanonicalConflictError):
        workspace.commit(bundle, store, lifecycle, fault_hook=replace_target)
    before = target.read_bytes()
    recovered = recover_json_job(data_root, job.id, store, lifecycle, clock=_clock)

    # Then: the concurrent canonical target survives byte-for-byte and recovery is terminal.
    assert recovered is False
    assert target.read_bytes() == before
    assert _status(store, job.id) == JobStatus.FAILED_COMMIT_RECOVERY
    assert not (data_root / "job-staging" / job.id).exists()
    assert not (data_root / "job-commits" / f"{job.id}.json").exists()


def test_invalid_storage_suffix_leaves_no_stage_or_target(tmp_path: Path) -> None:
    # Given: gzip metadata that points at a plain JSON filename.
    data_root = tmp_path / "data"
    store = SharedJobStore(data_root / "jobs-v2.json", data_root / "jobs.json", clock=_clock)
    job = _running_job(store, "investment_review")
    target = data_root / "investment-review" / "2026-07-18.json"
    workspace = JobArtifactWorkspace(data_root, clock=_clock)

    # When/Then: strict manifest validation rejects the mismatch without residue.
    with pytest.raises(ValueError):
        workspace.stage(
            job,
            [
                JsonArtifactSpec(
                    storage=StorageKind.GZIP_JSON,
                    artifact_type="investment_review",
                    artifact_id="2026-07-18",
                    exact_path=target,
                    payload={"date": "2026-07-18"},
                )
            ],
            terminal_result={"artifactId": "2026-07-18"},
        )
    assert not target.exists()
    assert not (data_root / "job-staging" / job.id).exists()


def test_sqlite_only_task_cannot_enter_json_staging(tmp_path: Path) -> None:
    # Given: a running SQLite-only thesis delta job and an attempted JSON target.
    data_root = tmp_path / "data"
    store = SharedJobStore(data_root / "jobs-v2.json", data_root / "jobs.json", clock=_clock)
    job = _running_job(store, "thesis_delta")
    target = data_root / "forbidden" / "escape.json"
    workspace = JobArtifactWorkspace(data_root, clock=_clock)

    # When/Then: the common JSON boundary rejects the unregistered producer before staging.
    with pytest.raises(JobArtifactValidationError, match="only a running registered artifact job may stage"):
        workspace.stage(
            job,
            [
                JsonArtifactSpec(
                    storage=StorageKind.JSON,
                    artifact_type="forbidden_json",
                    artifact_id="escape",
                    exact_path=target,
                    payload={"escape": True},
                )
            ],
            terminal_result={"artifactId": "escape"},
        )

    # Then: no target or staging root changed and the SQLite job stays running.
    current = store.get(job.id)
    assert current is not None and current.status == JobStatus.RUNNING
    assert not target.exists()
    assert not (data_root / "job-staging" / job.id).exists()


def test_shared_jobs_startup_finishes_artifacts_written_before_terminal(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    # Given: the real shared-jobs paths contain a committing report with staging already scrubbed.
    from features.common import jobs as jobs_module

    data_root = tmp_path / "data"
    store = SharedJobStore(data_root / "jobs-v2.json", data_root / "jobs.json", clock=_clock)
    lifecycle = JobPrivateLifecycle(data_root / "job-context", clock=_clock)
    job = _running_job(store, "investment_review")
    target = data_root / "investment-review" / "2026-07-18.json"
    workspace = JobArtifactWorkspace(data_root, clock=_clock)
    bundle = workspace.stage(
        job,
        [
            JsonArtifactSpec(
                storage=StorageKind.JSON,
                artifact_type="investment_review",
                artifact_id="2026-07-18",
                exact_path=target,
                payload={"date": "2026-07-18", "summary": "startup"},
            )
        ],
        terminal_result={"artifactId": "2026-07-18", "reportId": "2026-07-18", "date": "2026-07-18"},
    )

    def interrupt(phase: str) -> None:
        if phase == "staging_cleaned":
            raise CommitInterruptedError(phase)

    with pytest.raises(CommitInterruptedError):
        workspace.commit(bundle, store, lifecycle, fault_hook=interrupt)
    monkeypatch.setattr(jobs_module, "JOBS_PATH", data_root / "jobs.json")
    monkeypatch.setattr(jobs_module, "JOBS", {})
    monkeypatch.setattr(jobs_module, "_LIFECYCLES", {})

    # When: the shared jobs startup seam reloads the workspace.
    jobs_module.load_jobs()

    # Then: the promoted target becomes done and both private commit roots are gone.
    assert jobs_module.JOBS[job.id]["status"] == "done"
    assert _read_json(target)["summary"] == "startup"
    assert not (data_root / "job-staging" / job.id).exists()
    assert not (data_root / "job-commits" / f"{job.id}.json").exists()
