from __future__ import annotations

import base64
import hashlib
import re
from dataclasses import dataclass
from typing import Final

from features.agent_mode.work_log_schema import TokenPurpose, TokenScope


TOKEN_PATTERN: Final = re.compile(r"^wlt1_([A-Za-z0-9_-]{43})$")
NUL: Final = bytes([0])


@dataclass(frozen=True, slots=True)
class WorkLogConflictError(Exception):
    code: str

    def __str__(self) -> str:
        return self.code


@dataclass(frozen=True, slots=True)
class WorkLogValidationError(Exception):
    code: str

    def __str__(self) -> str:
        return self.code


def token_hash(
    raw: bytes,
    purpose: TokenPurpose,
    scope: TokenScope,
    jobs_revision: int,
    count: int,
    expires_at: str,
) -> str:
    payload = NUL.join(
        (
            b"folio-work-log-token-v1",
            raw,
            purpose.value.encode(),
            scope.value.encode(),
            str(jobs_revision).encode(),
            str(count).encode(),
            expires_at.encode(),
        )
    )
    return hashlib.sha256(payload).hexdigest()


def decode_token(token: str) -> bytes:
    matched = TOKEN_PATTERN.fullmatch(token)
    if matched is None:
        raise WorkLogConflictError("preview_token_invalid")
    encoded = matched.group(1)
    try:
        raw = base64.urlsafe_b64decode(encoded + "=")
    except ValueError as error:
        raise WorkLogConflictError("preview_token_invalid") from error
    if len(raw) != 32 or base64.urlsafe_b64encode(raw).decode().rstrip("=") != encoded:
        raise WorkLogConflictError("preview_token_invalid")
    return raw
