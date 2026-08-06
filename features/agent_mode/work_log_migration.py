from __future__ import annotations

import os
from collections.abc import Callable
from datetime import datetime

from pydantic import ValidationError

from features.agent_mode.work_log_schema import MigrationJournal, TokenStatus
from features.agent_mode.work_log_store import WorkLogStore, WorkLogStoreUnavailableError
from features.common.shared_jobs_store import SharedJobStore
from features.common.atomic_replace import replace_with_retry


def recover_migration_journals(
    job_store: SharedJobStore,
    control_store: WorkLogStore,
    clock: Callable[[], datetime],
) -> None:
    for path in sorted(job_store.path.parent.glob("job-migration-*.json"), key=lambda item: item.name):
        try:
            journal = MigrationJournal.model_validate_json(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, ValidationError, ValueError) as error:
            raise WorkLogStoreUnavailableError() from error
        state = control_store.load()
        token = next(
            (
                item
                for item in state.tokens
                if item.nonceHash == journal.tokenHash
                and item.status == TokenStatus.IN_PROGRESS
                and item.operationId == journal.operationId
            ),
            None,
        )
        if token is None:
            raise WorkLogStoreUnavailableError()
        quarantine = job_store.legacy_path.with_name(
            job_store.legacy_path.name + f".quarantine.{journal.operationId}"
        )
        target_written = job_store.path.exists() and job_store.content_hash() == journal.targetHash
        if target_written:
            quarantine.unlink(missing_ok=True)
            replacement = token.model_copy(update={"status": TokenStatus.USED})
        else:
            job_store.rollback_migration(had_v2=journal.hadV2, before_hash=journal.beforeHash)
            if quarantine.exists() and not job_store.legacy_path.exists():
                replace_with_retry(quarantine, job_store.legacy_path)
            expires_at = datetime.fromisoformat(token.expiresAt.replace("Z", "+00:00"))
            replacement = (
                token.model_copy(update={"status": TokenStatus.ISSUED, "operationId": None})
                if clock().astimezone(expires_at.tzinfo) < expires_at
                else token
            )
        tokens = tuple(replacement if item.nonceHash == token.nonceHash else item for item in state.tokens)
        control_store.write(state.hidden_jobs, tokens, state.store_revision)
        path.unlink()
