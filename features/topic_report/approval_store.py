from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from threading import RLock
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, ValidationError

from features.topic_report.approved_schema import ApprovalGrant, validate_utc_z
from features.common.atomic_replace import replace_with_retry


_APPROVAL_ID = re.compile(
    r"apr_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"
)
_TOKEN = re.compile(r"[A-Za-z0-9_-]{43}")
_HASH = re.compile(r"[0-9a-f]{64}")
_DOMAIN = b"folio-plan-approval-v1"
_NUL = bytes([0])


@dataclass(frozen=True, slots=True)
class ApprovalStoreRuntime:
    path: Path
    clock: Callable[[], datetime]
    entropy: Callable[[int], bytes]
    uuidFactory: Callable[[], UUID]


@dataclass(frozen=True, slots=True)
class ApprovalProof:
    id: str
    token: str
    planHash: str


@dataclass(frozen=True, slots=True)
class ApprovalRecovery:
    id: str
    planHash: str
    jobId: str | None


@dataclass(frozen=True, slots=True)
class ApprovalStoreError(Exception):
    code: str

    def __str__(self) -> str:
        return self.code


class ApprovalMismatchError(ApprovalStoreError):
    def __init__(self) -> None:
        super().__init__(code="approval_mismatch")


class ApprovalExpiredError(ApprovalStoreError):
    def __init__(self) -> None:
        super().__init__(code="approval_expired")


class ApprovalSupersededError(ApprovalStoreError):
    def __init__(self) -> None:
        super().__init__(code="approval_superseded")


class ApprovalStoreUnavailableError(ApprovalStoreError):
    def __init__(self) -> None:
        super().__init__(code="approval_store_unavailable")


class ApprovalEntry(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, strict=True)

    id: str
    tokenHash: str
    planHash: str
    issuedAt: str
    expiresAt: str
    status: Literal["issued", "consumed", "superseded"]
    jobId: str | None


class ApprovalLedger(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, strict=True)

    schemaVersion: Literal[1]
    approvals: list[ApprovalEntry]


def utc_z(value: datetime) -> str:
    normalized = value.astimezone(UTC)
    return normalized.isoformat(timespec="microseconds").replace("+00:00", "Z")


def approval_token_hash(approval_id: str, plan_hash: str, raw_token: bytes) -> str:
    payload = _DOMAIN + _NUL + approval_id.encode() + _NUL + plan_hash.encode("ascii") + _NUL + raw_token
    return hashlib.sha256(payload).hexdigest()


def decode_token(token: str) -> bytes:
    if _TOKEN.fullmatch(token) is None:
        raise ApprovalMismatchError
    try:
        raw = base64.urlsafe_b64decode(token + "=")
    except (ValueError, TypeError) as exc:
        raise ApprovalMismatchError from exc
    if len(raw) != 32 or base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii") != token:
        raise ApprovalMismatchError
    return raw


class ApprovalStore:
    def __init__(self, runtime: ApprovalStoreRuntime) -> None:
        self._runtime = runtime
        self._lock = RLock()

    def _parse(self, path: Path) -> ApprovalLedger:
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            return ApprovalLedger.model_validate(payload)
        except (OSError, UnicodeError, json.JSONDecodeError, ValidationError) as exc:
            raise ApprovalStoreUnavailableError from exc

    def _restore(self, backup: Path) -> ApprovalLedger:
        ledger = self._parse(backup)
        path = self._runtime.path
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_name(path.name + ".restore.tmp")
        temporary.write_text(ledger.model_dump_json(indent=2), encoding="utf-8")
        replace_with_retry(temporary, path)
        return self._parse(path)

    def _load(self) -> ApprovalLedger:
        path = self._runtime.path
        backup = path.with_name(path.name + ".bak")
        if path.exists():
            try:
                return self._parse(path)
            except ApprovalStoreUnavailableError:
                if backup.exists():
                    return self._restore(backup)
                raise
        if backup.exists():
            return self._restore(backup)
        return ApprovalLedger(schemaVersion=1, approvals=[])

    def _write(self, ledger: ApprovalLedger) -> ApprovalLedger:
        path = self._runtime.path
        backup = path.with_name(path.name + ".bak")
        path.parent.mkdir(parents=True, exist_ok=True)
        if path.exists():
            current = self._parse(path)
            backup_tmp = backup.with_name(backup.name + ".tmp")
            backup_tmp.write_text(current.model_dump_json(indent=2), encoding="utf-8")
            replace_with_retry(backup_tmp, backup)
            self._parse(backup)
        temporary = path.with_name(path.name + ".tmp")
        temporary.write_text(ledger.model_dump_json(indent=2), encoding="utf-8")
        replace_with_retry(temporary, path)
        return self._parse(path)

    def _new_entry(self, plan_hash: str) -> tuple[ApprovalEntry, str]:
        now = self._runtime.clock().astimezone(UTC)
        approval_id = f"apr_{self._runtime.uuidFactory()}"
        raw_token = self._runtime.entropy(32)
        if len(raw_token) != 32 or _HASH.fullmatch(plan_hash) is None:
            raise ApprovalMismatchError
        token = base64.urlsafe_b64encode(raw_token).rstrip(b"=").decode("ascii")
        entry = ApprovalEntry(
            id=approval_id,
            tokenHash=approval_token_hash(approval_id, plan_hash, raw_token),
            planHash=plan_hash,
            issuedAt=utc_z(now),
            expiresAt=utc_z(now + timedelta(minutes=30)),
            status="issued",
            jobId=None,
        )
        return entry, token

    def issue(self, plan_hash: str) -> ApprovalGrant:
        with self._lock:
            ledger = self._load()
            entry, token = self._new_entry(plan_hash)
            self._write(ledger.model_copy(update={"approvals": [*ledger.approvals, entry]}))
            return ApprovalGrant(id=entry.id, token=token, expiresAt=entry.expiresAt)

    def authorize(self, proof: ApprovalProof) -> ApprovalEntry:
        raw_token = decode_token(proof.token)
        if _APPROVAL_ID.fullmatch(proof.id) is None or _HASH.fullmatch(proof.planHash) is None:
            raise ApprovalMismatchError
        with self._lock:
            ledger = self._load()
            entry = next((item for item in ledger.approvals if item.id == proof.id), None)
            if entry is None:
                raise ApprovalMismatchError
            computed = approval_token_hash(proof.id, proof.planHash, raw_token)
            if not hmac.compare_digest(entry.tokenHash, computed) or entry.planHash != proof.planHash:
                raise ApprovalMismatchError
            match entry.status:
                case "consumed":
                    return entry
                case "superseded":
                    raise ApprovalSupersededError
                case "issued":
                    if self._runtime.clock().astimezone(UTC) >= validate_utc_z(entry.expiresAt):
                        raise ApprovalExpiredError
                    return entry
            raise ApprovalStoreUnavailableError

    def _replace_entry(self, updated: ApprovalEntry) -> None:
        ledger = self._load()
        approvals = [updated if item.id == updated.id else item for item in ledger.approvals]
        self._write(ledger.model_copy(update={"approvals": approvals}))

    def consume(self, proof: ApprovalProof, job_id: str) -> ApprovalEntry:
        with self._lock:
            entry = self.authorize(proof)
            if entry.status == "consumed":
                return entry
            updated = entry.model_copy(update={"status": "consumed", "jobId": job_id})
            self._replace_entry(updated)
            return updated

    def supersede(self, proof: ApprovalProof) -> ApprovalEntry:
        with self._lock:
            entry = self.authorize(proof)
            updated = entry.model_copy(update={"status": "superseded"})
            self._replace_entry(updated)
            return updated

    def replace(self, proof: ApprovalProof, new_plan_hash: str) -> ApprovalGrant:
        with self._lock:
            entry = self.authorize(proof)
            ledger = self._load()
            replacement, token = self._new_entry(new_plan_hash)
            approvals = [
                entry.model_copy(update={"status": "superseded"}) if item.id == entry.id else item
                for item in ledger.approvals
            ]
            self._write(ledger.model_copy(update={"approvals": [*approvals, replacement]}))
            return ApprovalGrant(id=replacement.id, token=token, expiresAt=replacement.expiresAt)

    def reconcile(self, recovery: ApprovalRecovery) -> ApprovalEntry:
        with self._lock:
            ledger = self._load()
            entry = next((item for item in ledger.approvals if item.id == recovery.id), None)
            if entry is None or entry.planHash != recovery.planHash or entry.status == "superseded":
                raise ApprovalStoreUnavailableError
            status = "consumed" if recovery.jobId is not None else "issued"
            updated = entry.model_copy(update={"status": status, "jobId": recovery.jobId})
            self._replace_entry(updated)
            return updated
