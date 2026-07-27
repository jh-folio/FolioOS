from __future__ import annotations

import json
import os
import re
import shutil
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Final

from pydantic import BaseModel, ConfigDict, Field

from features.common.jcs import JsonValue
from features.common.shared_jobs_completion import ArtifactCompletionProof
from features.common.shared_jobs_projection import utc_z
from features.common.shared_jobs_schema import ErrorCode, JOB_ID_PATTERN, JobStatus, TERMINAL_STATUSES
from features.common.shared_jobs_store import JobsStoreUnavailableError, SharedJobStore


PACK_ID_PATTERN: Final = re.compile(r"^[A-Za-z0-9_.-]{1,120}$")


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class RunningLiveDetail(StrictModel):
    noticeCode: str | None
    optionCodes: list[str] = Field(max_length=8)
    reply: None = None
    proposalId: str | None


class TerminalLiveDetail(StrictModel):
    noticeCode: str | None
    optionCodes: list[str] = Field(max_length=8)
    reply: str | None = Field(max_length=12_000)
    proposalId: str | None


@dataclass(frozen=True, slots=True)
class PrivateCleanupError(Exception):
    job_id: str

    def __str__(self) -> str:
        return f"private_cleanup_failed:{self.job_id}"


@dataclass(frozen=True, slots=True)
class OwnedPackIdentityError(Exception):
    job_id: str
    pack_id: str

    def __str__(self) -> str:
        return "invalid owned pack identity"


@dataclass(frozen=True, slots=True)
class TerminalStatusError(Exception):
    status: JobStatus

    def __str__(self) -> str:
        return f"terminal status required: {self.status}"


@dataclass(frozen=True, slots=True)
class LiveRecord:
    detail: TerminalLiveDetail
    terminal_at: datetime


class JobPrivateLifecycle:
    def __init__(self, context_root: Path, *, clock: Callable[[], datetime]) -> None:
        self.context_root = context_root
        self.clock = clock
        self.worker_private: dict[str, dict[str, JsonValue]] = {}
        self.live_running: dict[str, RunningLiveDetail] = {}
        self.live_terminal: dict[str, LiveRecord] = {}
        self.cleanup_blocked: set[str] = set()
        self.repair_required = False

    def set_repair_required(self, required: bool) -> None:
        self.repair_required = required

    def set_private(self, job_id: str, value: dict[str, JsonValue]) -> None:
        self.worker_private[job_id] = value

    def has_private(self, job_id: str) -> bool:
        return job_id in self.worker_private

    def write_pack(self, job_id: str, pack_id: str, pack: dict[str, JsonValue]) -> Path:
        if JOB_ID_PATTERN.fullmatch(job_id) is None or PACK_ID_PATTERN.fullmatch(pack_id) is None:
            raise OwnedPackIdentityError(job_id, pack_id)
        owner = (self.context_root / job_id).resolve()
        owner.relative_to(self.context_root.resolve())
        owner.mkdir(parents=True, exist_ok=True)
        target = (owner / f"{pack_id}.json").resolve()
        target.relative_to(owner)
        temporary = target.with_name(target.name + ".tmp")
        payload = {**pack, "ownerJobId": job_id}
        temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(temporary, target)
        return target

    def cleanup_owner(self, job_id: str) -> bool:
        owner = (self.context_root / job_id).resolve()
        try:
            owner.relative_to(self.context_root.resolve())
            if owner.exists():
                shutil.rmtree(owner)
            return not owner.exists()
        except OSError:
            return False

    def _prune_live(self) -> None:
        cutoff = self.clock().astimezone(UTC) - timedelta(minutes=30)
        ordered = sorted(
            self.live_terminal.items(),
            key=lambda item: (item[1].terminal_at, item[0]),
            reverse=True,
        )
        self.live_terminal = {
            job_id: record
            for index, (job_id, record) in enumerate(ordered)
            if index < 50 and record.terminal_at >= cutoff
        }

    def _persist_terminal(
        self,
        store: SharedJobStore,
        job_id: str,
        *,
        live_detail: Mapping[str, str | list[str] | None] | None = None,
        persist: Callable[[], object],
    ) -> None:
        if not self.cleanup_owner(job_id):
            self.cleanup_blocked.add(job_id)
            store.mark_private_cleanup_failed(job_id)
            raise PrivateCleanupError(job_id)
        self.worker_private.pop(job_id, None)
        self.live_running.pop(job_id, None)
        detail = TerminalLiveDetail.model_validate(
            live_detail or {"noticeCode": None, "optionCodes": [], "reply": None, "proposalId": None}
        )
        self.live_terminal[job_id] = LiveRecord(detail, self.clock().astimezone(UTC))
        try:
            persist()
        except Exception:  # noqa: BROAD_EXCEPT_OK
            self.live_terminal.pop(job_id, None)
            self.cleanup_blocked.add(job_id)
            raise
        self.cleanup_blocked.discard(job_id)
        self._prune_live()

    def terminalize(
        self,
        store: SharedJobStore,
        job_id: str,
        target: JobStatus,
        *,
        result: Mapping[str, str | int | bool | None] | None = None,
        error_code: ErrorCode | str | None = None,
        live_detail: Mapping[str, str | list[str] | None] | None = None,
    ) -> None:
        if target not in TERMINAL_STATUSES:
            raise TerminalStatusError(target)
        self._persist_terminal(
            store,
            job_id,
            live_detail=live_detail,
            persist=lambda: store.transition(
                job_id,
                target,
                result=result,
                error_code=error_code,
            ),
        )

    def terminalize_recovery(
        self,
        store: SharedJobStore,
        job_id: str,
        target: JobStatus,
        *,
        live_detail: Mapping[str, str | list[str] | None] | None = None,
    ) -> None:
        if target not in TERMINAL_STATUSES:
            raise TerminalStatusError(target)
        self._persist_terminal(
            store,
            job_id,
            live_detail=live_detail,
            persist=lambda: store.transition_recovery(
                job_id,
                target,
            ),
        )

    def complete_artifact(
        self,
        store: SharedJobStore,
        job_id: str,
        proof: ArtifactCompletionProof,
        *,
        live_detail: Mapping[str, str | list[str] | None] | None = None,
    ) -> None:
        self._persist_terminal(
            store,
            job_id,
            live_detail=live_detail,
            persist=lambda: store.complete_artifact(job_id, proof),
        )

    def assert_readable(self) -> None:
        if self.cleanup_blocked or self.repair_required:
            raise JobsStoreUnavailableError()

    def recover_startup(self, store: SharedJobStore) -> None:
        state = store.load()
        for job in state.jobs:
            if job.status not in {JobStatus.QUEUED, JobStatus.RUNNING, JobStatus.CANCEL_REQUESTED}:
                continue
            if not self.cleanup_owner(job.id):
                self.cleanup_blocked.add(job.id)
                store.mark_private_cleanup_failed(job.id)
                raise PrivateCleanupError(job.id)
            self.worker_private.pop(job.id, None)
            store.transition_recovery(
                job.id,
                JobStatus.FAILED_RESTART,
            )
        active = {job.id for job in store.load().jobs if job.status not in TERMINAL_STATUSES}
        self.cleanup_orphans(active)

    def cleanup_orphans(self, nonterminal_job_ids: set[str]) -> list[str]:
        if not self.context_root.exists():
            return []
        cutoff = self.clock().astimezone(UTC) - timedelta(hours=24)
        removed = []
        for path in sorted(self.context_root.iterdir(), key=lambda item: item.name):
            if not path.is_dir() or JOB_ID_PATTERN.fullmatch(path.name) is None:
                continue
            modified = datetime.fromtimestamp(path.stat().st_mtime, tz=UTC)
            if path.name in nonterminal_job_ids or modified > cutoff:
                continue
            shutil.rmtree(path)
            removed.append(path.name)
        return removed
