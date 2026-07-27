from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest
from pydantic import ValidationError

from features.market_memory.attempt_store import (
    AttemptErrorCode,
    AttemptMode,
    AttemptScope,
    AttemptStart,
    AttemptStatus,
    AttemptStore,
    AttemptStoreUnavailableError,
    AttemptTransitionError,
    MarketStateAttempt,
)


NOW = datetime(2026, 7, 17, 3, 0, tzinfo=UTC)


def instant(offset: int = 0) -> datetime:
    return NOW + timedelta(seconds=offset)


def start(scope: AttemptScope = AttemptScope.GLOBAL, offset: int = 0) -> AttemptStart:
    return AttemptStart(
        scope=scope,
        mode=AttemptMode.MANUAL,
        startedAt=instant(offset),
        inputWatermark="2026-07-17T02:00:00Z",
    )


def test_running_to_success_persists_exact_strict_fields(tmp_path: Path) -> None:
    store = AttemptStore(tmp_path / "attempts.json")

    running = store.start(start(), attempt_id="msa_12345678-1234-4234-8234-123456789abc")
    success = store.succeed(running.id, instant(1), "mss_one")

    payload = json.loads(store.path.read_text(encoding="utf-8"))
    assert set(payload) == {"schemaVersion", "attempts"}
    assert payload["attempts"] == [success.model_dump(mode="json")]
    assert success.status == "success"
    assert success.finishedAt == instant(1)
    assert success.snapshotId == "mss_one"
    assert success.errorCode is None
    backup = json.loads(store.backup.read_text(encoding="utf-8"))
    assert backup["attempts"] == [running.model_dump(mode="json")]


def test_failed_transition_records_only_safe_error_code(tmp_path: Path) -> None:
    store = AttemptStore(tmp_path / "attempts.json")
    running = store.start(start())

    failed = store.fail(running.id, instant(2), AttemptErrorCode.ADAPTER_FAILED)

    assert failed.status == "failed"
    assert failed.finishedAt == instant(2)
    assert failed.snapshotId is None
    assert failed.errorCode == AttemptErrorCode.ADAPTER_FAILED
    with pytest.raises(AttemptTransitionError):
        store.succeed(running.id, instant(3), "mss_late")


def test_model_rejects_unknown_fields_and_incoherent_status() -> None:
    raw = {
        "id": "msa_12345678-1234-4234-8234-123456789abc",
        "scope": "US",
        "mode": "manual",
        "jobId": None,
        "operationId": None,
        "startedAt": "2026-07-17T03:00:00Z",
        "finishedAt": None,
        "status": "success",
        "inputWatermark": None,
        "snapshotId": None,
        "errorCode": None,
        "rawError": "secret",
    }

    with pytest.raises(ValidationError):
        MarketStateAttempt.model_validate(raw)


def test_store_rejects_non_z_utc_timestamp(tmp_path: Path) -> None:
    store = AttemptStore(tmp_path / "attempts.json")
    running = store.start(start())
    payload = json.loads(store.path.read_text(encoding="utf-8"))
    payload["attempts"][0]["startedAt"] = "2026-07-17T03:00:00+00:00"
    store.path.write_text(json.dumps(payload), encoding="utf-8")

    with pytest.raises(AttemptStoreUnavailableError):
        store.load()


@pytest.mark.parametrize(
    "watermark",
    [
        "2026-07-17T02:00:00+00:00",
        "2026-99-99T99:99:99Z",
        "2026-02-29T03:00:00Z",
    ],
)
def test_attempt_start_rejects_invalid_input_watermark(watermark: str) -> None:
    with pytest.raises(ValidationError):
        AttemptStart(
            scope=AttemptScope.US,
            mode=AttemptMode.MANUAL,
            startedAt=NOW,
            inputWatermark=watermark,
        )


def test_store_rejects_impossible_z_input_watermark(tmp_path: Path) -> None:
    store = AttemptStore(tmp_path / "attempts.json")
    store.start(start())
    payload = json.loads(store.path.read_text(encoding="utf-8"))
    payload["attempts"][0]["inputWatermark"] = "2026-99-99T99:99:99Z"
    store.path.write_text(json.dumps(payload), encoding="utf-8")

    with pytest.raises(AttemptStoreUnavailableError):
        store.load()


def test_attempt_start_accepts_real_leap_day_watermark() -> None:
    attempt = AttemptStart(
        scope=AttemptScope.US,
        mode=AttemptMode.MANUAL,
        startedAt=NOW,
        inputWatermark="2028-02-29T03:00:00Z",
    )

    assert attempt.inputWatermark == "2028-02-29T03:00:00Z"


def test_corrupt_primary_restores_backup_and_double_corruption_fails_closed(tmp_path: Path) -> None:
    store = AttemptStore(tmp_path / "attempts.json")
    first = store.start(start())
    store.fail(first.id, instant(1), AttemptErrorCode.INTERRUPTED)
    store.start(start(offset=2))
    store.path.write_text("{broken", encoding="utf-8")

    recovered = store.load()

    assert recovered.recovered is True
    assert recovered.attempts == (store.load().attempts[0],)
    store.path.write_text("{broken-primary", encoding="utf-8")
    store.backup.write_text("{broken-backup", encoding="utf-8")
    before = (store.path.read_bytes(), store.backup.read_bytes())
    with pytest.raises(AttemptStoreUnavailableError):
        store.load()
    assert (store.path.read_bytes(), store.backup.read_bytes()) == before


def test_prune_keeps_references_latest_failure_and_deterministic_tie(tmp_path: Path) -> None:
    store = AttemptStore(tmp_path / "attempts.json")
    referenced = store.start(start(offset=-20), attempt_id="msa_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
    store.succeed(referenced.id, instant(-19), "mss_old")
    tied_b = store.start(start(AttemptScope.US, -10), attempt_id="msa_bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")
    store.fail(tied_b.id, instant(-9), AttemptErrorCode.ADAPTER_FAILED)
    tied_a = store.start(start(AttemptScope.US, -10), attempt_id="msa_aaaaaaaa-bbbb-4bbb-8bbb-bbbbbbbbbbbb")
    store.fail(tied_a.id, instant(-9), AttemptErrorCode.SAVE_FAILED)

    pruned = store.prune(instant(181 * 86400), frozenset({referenced.id}))

    ids = {attempt.id for attempt in pruned.attempts}
    assert referenced.id in ids
    assert tied_a.id in ids
    assert tied_b.id not in ids


def test_more_than_500_later_kr_attempts_preserve_us_latest_failure(tmp_path: Path) -> None:
    store = AttemptStore(tmp_path / "attempts.json")
    us = MarketStateAttempt(
        id="msa_00000000-0000-4000-8000-000000000000",
        **start(AttemptScope.US, -10).model_dump(mode="python"),
        finishedAt=instant(-9),
        status=AttemptStatus.FAILED,
        snapshotId=None,
        errorCode=AttemptErrorCode.ADAPTER_FAILED,
    )
    kr_rows = tuple(
        MarketStateAttempt(
            id=f"msa_{index:08x}-0000-4000-8000-{index:012x}",
            **start(AttemptScope.KR, index).model_dump(mode="python"),
            finishedAt=instant(index + 1),
            status=AttemptStatus.SUCCESS,
            snapshotId=f"mss_kr_{index}",
            errorCode=None,
        )
        for index in range(1, 502)
    )
    store.replace_all((us, *kr_rows))

    retained = store.prune(instant(502), frozenset())

    ids = {attempt.id for attempt in retained.attempts}
    assert us.id in ids
    assert len(retained.attempts) == 501
