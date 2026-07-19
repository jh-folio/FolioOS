from __future__ import annotations

import base64
import hmac
import os
import secrets
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

from features.agent_mode.work_log_schema import (
    HiddenJob,
    MigrationJournal,
    PreviewTokenRecord,
    TokenPurpose,
    TokenScope,
    TokenStatus,
    WorkLogEntry,
    WorkLogFilter,
)
from features.agent_mode.work_log_store import WorkLogState, WorkLogStore
from features.agent_mode.work_log_migration import recover_migration_journals
from features.agent_mode.work_log_token import (
    WorkLogConflictError,
    WorkLogValidationError,
    decode_token,
    token_hash,
)
from features.agent_mode.work_log_view import WorkLogView
from features.common.jcs import JsonValue
from features.common.shared_jobs_projection import utc_z
from features.common.shared_jobs_store import JobsStoreUnavailableError, LegacyJobCollisionError, SharedJobStore


type JsonObject = dict[str, JsonValue]


class WorkLogService:
    def __init__(
        self,
        job_store: SharedJobStore,
        work_log_path: Path,
        proposals_dir: Path,
        *,
        clock: Callable[[], datetime],
        token_bytes: Callable[[], bytes] = lambda: secrets.token_bytes(32),
    ) -> None:
        self.job_store = job_store
        self.store = WorkLogStore(work_log_path, clock=clock)
        recover_migration_journals(job_store, self.store, clock)
        self.proposals_dir = proposals_dir
        self.clock = clock
        self.token_bytes = token_bytes
        self.view = WorkLogView(job_store, self.store, proposals_dir)

    def _visible(self, kind: WorkLogFilter) -> tuple[WorkLogEntry, ...]:
        return self.view.visible(kind)

    def list(self, *, limit: int, offset: int, kind: WorkLogFilter | str) -> JsonObject:
        return self.view.list(limit=limit, offset=offset, kind=WorkLogFilter(kind))

    def _pruned(self, state: WorkLogState) -> tuple[tuple[HiddenJob, ...], tuple[PreviewTokenRecord, ...]]:
        surviving = {job.id for job in self.job_store.merged().jobs}
        hidden = tuple(item for item in state.hidden_jobs if item.jobId in surviving)
        threshold = self.clock().astimezone(UTC) - timedelta(minutes=10)
        tokens = tuple(
            item
            for item in state.tokens
            if datetime.fromisoformat(item.expiresAt.replace("Z", "+00:00")) >= threshold
        )
        return hidden, tokens

    def _issue(self, purpose: TokenPurpose, scope: TokenScope, count: int) -> tuple[str, PreviewTokenRecord, WorkLogState]:
        raw = self.token_bytes()
        if len(raw) != 32:
            raise WorkLogValidationError("token_source_invalid")
        token = "wlt1_" + base64.urlsafe_b64encode(raw).decode().rstrip("=")
        jobs_revision = self.job_store.load().store_revision
        expires = utc_z(self.clock().astimezone(UTC) + timedelta(minutes=10))
        record = PreviewTokenRecord(
            nonceHash=token_hash(raw, purpose, scope, jobs_revision, count, expires),
            purpose=purpose,
            jobsStoreRevision=jobs_revision,
            count=count,
            scope=scope,
            expiresAt=expires,
            status=TokenStatus.ISSUED,
            operationId=None,
        )
        state = self.store.load()
        hidden, tokens = self._pruned(state)
        written = self.store.write(hidden, (*tokens, record), state.store_revision + 1)
        return token, record, written

    def clear_preview(self, scope: TokenScope | str) -> JsonObject:
        parsed_scope = TokenScope(scope)
        if parsed_scope == TokenScope.LEGACY_JOBS:
            raise WorkLogValidationError("clear_scope_invalid")
        count = len(self._visible(WorkLogFilter(parsed_scope.value)))
        token, record, _ = self._issue(TokenPurpose.CLEAR, parsed_scope, count)
        return {
            "previewToken": token,
            "scope": parsed_scope.value,
            "count": count,
            "jobsStoreRevision": record.jobsStoreRevision,
            "expiresAt": record.expiresAt,
        }

    def _validated_token(
        self,
        token: str,
        purpose: TokenPurpose,
        scope: TokenScope,
        current_count: int,
    ) -> tuple[PreviewTokenRecord, WorkLogState]:
        raw = decode_token(token)
        state = self.store.load()
        matched = None
        for record in state.tokens:
            candidate = token_hash(raw, record.purpose, record.scope, record.jobsStoreRevision, record.count, record.expiresAt)
            if hmac.compare_digest(candidate, record.nonceHash):
                matched = record
                break
        if matched is None:
            raise WorkLogConflictError("preview_token_invalid")
        if matched.purpose != purpose or matched.scope != scope:
            raise WorkLogConflictError("preview_token_mismatch")
        if matched.status != TokenStatus.ISSUED:
            raise WorkLogConflictError("preview_token_replayed")
        if self.clock().astimezone(UTC) >= datetime.fromisoformat(matched.expiresAt.replace("Z", "+00:00")):
            raise WorkLogConflictError("preview_token_expired")
        if matched.jobsStoreRevision != self.job_store.load().store_revision:
            raise WorkLogConflictError("jobs_revision_changed")
        if matched.count != current_count:
            raise WorkLogConflictError("preview_count_changed")
        return matched, state

    def clear(self, scope: TokenScope | str, preview_token: str) -> JsonObject:
        parsed_scope = TokenScope(scope)
        entries = self._visible(WorkLogFilter(parsed_scope.value))
        token, state = self._validated_token(preview_token, TokenPurpose.CLEAR, parsed_scope, len(entries))
        hidden, tokens = self._pruned(state)
        hidden_map = {item.jobId: item for item in hidden}
        now = utc_z(self.clock())
        for entry in entries:
            hidden_map[entry.jobId] = HiddenJob(jobId=entry.jobId, hiddenAt=now)
        consumed = token.model_copy(update={"status": TokenStatus.USED})
        tokens = tuple(consumed if item.nonceHash == token.nonceHash else item for item in tokens)
        written = self.store.write(tuple(hidden_map.values()), tokens, state.store_revision + 1)
        return {
            "scope": parsed_scope.value,
            "hiddenCount": len(entries),
            "jobsStoreRevision": token.jobsStoreRevision,
            "storeRevision": written.store_revision,
        }

    def migration_preview(self) -> JsonObject:
        preview = self.job_store.legacy_preview()
        token, record, _ = self._issue(TokenPurpose.MIGRATION, TokenScope.LEGACY_JOBS, preview.legacy_jobs)
        return {
            "previewToken": token,
            "legacyJobs": preview.legacy_jobs,
            "migratableJobs": preview.migratable_jobs,
            "collisions": [{"legacyId": item.legacy_id, "reason": item.reason} for item in preview.collisions],
            "jobsStoreRevision": record.jobsStoreRevision,
            "expiresAt": record.expiresAt,
        }

    def migration_confirm(self, preview_token: str, action: str) -> JsonObject:
        if action not in {"migrate_keep_original", "migrate_delete_original"}:
            raise WorkLogValidationError("migration_action_invalid")
        preview = self.job_store.legacy_preview()
        if preview.collisions:
            raise WorkLogConflictError("legacy_job_collision")
        token, state = self._validated_token(
            preview_token,
            TokenPurpose.MIGRATION,
            TokenScope.LEGACY_JOBS,
            preview.legacy_jobs,
        )
        operation_id = uuid4().hex
        claimed = token.model_copy(update={"status": TokenStatus.IN_PROGRESS, "operationId": operation_id})
        hidden, tokens = self._pruned(state)
        tokens = tuple(claimed if item.nonceHash == token.nonceHash else item for item in tokens)
        claimed_state = self.store.write(hidden, tokens, state.store_revision + 1)
        journal = self.job_store.path.parent / f"job-migration-{operation_id}.json"
        before = self.job_store.path.read_bytes() if self.job_store.path.exists() else None
        before_state = self.job_store.load()
        additions = self.job_store.migration_additions()
        journal_record = MigrationJournal(
            operationId=operation_id,
            action=action,
            tokenHash=token.nonceHash,
            beforeHash=self.job_store.content_hash(before_state.jobs),
            targetHash=self.job_store.content_hash((*before_state.jobs, *additions)),
            hadV2=self.job_store.path.exists(),
        )
        quarantine = self.job_store.legacy_path.with_name(self.job_store.legacy_path.name + f".quarantine.{operation_id}")
        journal.write_text(journal_record.model_dump_json(), encoding="utf-8")
        try:
            if action == "migrate_delete_original" and self.job_store.legacy_path.exists():
                os.replace(self.job_store.legacy_path, quarantine)
                source = quarantine
            else:
                source = self.job_store.legacy_path
            original_legacy = self.job_store.legacy_path
            self.job_store.legacy_path = source
            try:
                additions = self.job_store.migration_additions()
                self.job_store.write_migrated(additions)
            finally:
                self.job_store.legacy_path = original_legacy
            if quarantine.exists():
                quarantine.unlink()
        except (OSError, JobsStoreUnavailableError, LegacyJobCollisionError):
            if before is None:
                self.job_store.path.unlink(missing_ok=True)
            else:
                temporary = self.job_store.path.with_name(self.job_store.path.name + ".rollback.tmp")
                temporary.write_bytes(before)
                os.replace(temporary, self.job_store.path)
            if quarantine.exists() and not self.job_store.legacy_path.exists():
                os.replace(quarantine, self.job_store.legacy_path)
            journal.unlink(missing_ok=True)
            expires_at = datetime.fromisoformat(claimed.expiresAt.replace("Z", "+00:00"))
            replacement = (
                claimed.model_copy(update={"status": TokenStatus.ISSUED, "operationId": None})
                if self.clock().astimezone(expires_at.tzinfo) < expires_at
                else claimed
            )
            rollback_tokens = tuple(replacement if item.nonceHash == token.nonceHash else item for item in claimed_state.tokens)
            self.store.write(claimed_state.hidden_jobs, rollback_tokens, claimed_state.store_revision)
            raise
        used = claimed.model_copy(update={"status": TokenStatus.USED})
        final_tokens = tuple(used if item.nonceHash == token.nonceHash else item for item in claimed_state.tokens)
        final_state = self.store.write(claimed_state.hidden_jobs, final_tokens, claimed_state.store_revision)
        journal.unlink(missing_ok=True)
        visible = self.list(limit=200, offset=0, kind=WorkLogFilter.ALL)
        return {
            "migratedJobs": preview.migratable_jobs,
            "derivedVisibleEntries": visible["total"],
            "keptOriginal": action == "migrate_keep_original",
            "deletedOriginal": action == "migrate_delete_original",
            "jobsStoreRevision": self.job_store.load().store_revision,
            "storeRevision": final_state.store_revision,
        }
