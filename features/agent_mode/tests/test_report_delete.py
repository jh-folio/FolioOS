from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from features.agent_mode.report_delete import (
    DeleteRequest,
    execute_report_delete,
    recover_report_deletes,
)


def _write(path: Path, payload: dict[str, str] | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload or {"id": path.stem}), encoding="utf-8")


def test_delete_is_exact_and_removes_all_declared_sidecars(tmp_path: Path) -> None:
    # Given
    for name in ("2026-07-17.us.json", "2026-07-17.us.visuals.json", "2026-07-170.us.json"):
        _write(tmp_path / name)
    request = DeleteRequest(
        root=tmp_path,
        identity="briefing:2026-07-17:us",
        primary_names=("2026-07-17.us.json",),
        target_names=("2026-07-17.us.json", "2026-07-17.us.visuals.json"),
    )

    # When
    outcome = execute_report_delete(request)

    # Then
    assert outcome.deleted is True
    assert set(outcome.removed_names) == {"2026-07-17.us.json", "2026-07-17.us.visuals.json"}
    assert (tmp_path / "2026-07-170.us.json").exists()
    assert not list(tmp_path.glob(".report-delete-*"))


@pytest.mark.parametrize(
    "fault_stage",
    ["journaled", "renamed:0", "renamed", "deleting", "unlinked:0", "unlinked", "refreshed"],
)
def test_restart_forward_completes_every_journal_boundary(
    tmp_path: Path,
    fault_stage: str,
) -> None:
    # Given
    _write(tmp_path / "2026-07-17.us.json")
    _write(tmp_path / "2026-07-17.link.json")
    calls: list[str] = []
    request = DeleteRequest(
        root=tmp_path,
        identity="briefing:2026-07-17:us",
        primary_names=("2026-07-17.us.json",),
        target_names=("2026-07-17.us.json", "2026-07-17.link.json"),
        refresh=lambda: calls.append("refresh"),
        fault_stage=fault_stage,
    )

    # When
    with pytest.raises(RuntimeError, match=fault_stage):
        execute_report_delete(request)
    recovered = recover_report_deletes(tmp_path, refresh=lambda: calls.append("recover"))

    # Then
    assert recovered == ("briefing:2026-07-17:us",)
    assert not (tmp_path / "2026-07-17.us.json").exists()
    assert not (tmp_path / "2026-07-17.link.json").exists()
    assert not list(tmp_path.glob(".report-delete-*"))
    assert "recover" in calls


def test_missing_primary_does_not_delete_orphan_sidecar(tmp_path: Path) -> None:
    # Given
    _write(tmp_path / "2026-07-17.link.json")
    request = DeleteRequest(
        root=tmp_path,
        identity="briefing:2026-07-17:us",
        primary_names=("2026-07-17.us.json",),
        target_names=("2026-07-17.us.json", "2026-07-17.link.json"),
    )

    # When
    outcome = execute_report_delete(request)

    # Then
    assert outcome.deleted is False
    assert (tmp_path / "2026-07-17.link.json").exists()


def test_restart_retries_failed_cache_refresh(tmp_path: Path) -> None:
    # Given
    _write(tmp_path / "report.json")
    refresh_calls: list[str] = []

    def failing_refresh() -> None:
        refresh_calls.append("failed")
        raise OSError("cache unavailable")

    request = DeleteRequest(
        root=tmp_path,
        identity="company:report",
        primary_names=("report.json",),
        target_names=("report.json",),
        refresh=failing_refresh,
    )

    # When
    with pytest.raises(OSError, match="cache unavailable"):
        execute_report_delete(request)
    recovered = recover_report_deletes(tmp_path, refresh=lambda: refresh_calls.append("recovered"))

    # Then
    assert recovered == ("company:report",)
    assert refresh_calls == ["failed", "recovered"]
    assert not list(tmp_path.glob(".report-delete-*"))


def test_recovery_ignores_unrelated_malformed_journal(tmp_path: Path) -> None:
    # Given
    malformed = tmp_path / ".report-delete-unrelated.json"
    malformed.write_text("{broken", encoding="utf-8")

    # When
    recovered = recover_report_deletes(tmp_path)

    # Then
    assert recovered == ()
    assert malformed.exists()


def test_recovery_rejects_forged_journal_candidate(tmp_path: Path) -> None:
    # Given
    unrelated = tmp_path / "unrelated.json"
    _write(unrelated)
    forged = tmp_path / ".report-delete-forged.json"
    forged.write_text(json.dumps({
        "identity": "forged",
        "stage": "deleting",
        "entries": [{"original": "unrelated.json", "temporary": ".wrong.deleting"}],
    }), encoding="utf-8")

    # When
    recovered = recover_report_deletes(tmp_path)

    # Then
    assert recovered == ()
    assert unrelated.exists()
    assert forged.exists()


def test_recovery_rejects_valid_shape_forged_original(tmp_path: Path) -> None:
    # Given
    unrelated = tmp_path / "unrelated.json"
    _write(unrelated)
    identity = "company:forged"
    digest = hashlib.sha256(identity.encode("utf-8")).hexdigest()[:16]
    forged = tmp_path / f".report-delete-{digest}.json"
    forged.write_text(json.dumps({
        "identity": identity,
        "stage": "deleting",
        "entries": [{
            "original": "unrelated.json",
            "temporary": f".report-delete-{digest}.0.deleting",
        }],
    }), encoding="utf-8")

    # When
    recovered = recover_report_deletes(tmp_path)

    # Then
    assert recovered == ()
    assert unrelated.exists()
    assert forged.exists()


def test_recovery_cleans_orphan_journal_staging_file(tmp_path: Path) -> None:
    # Given
    staging = tmp_path / ".report-delete-orphan.tmp"
    staging.write_text("partial", encoding="utf-8")

    # When
    recovered = recover_report_deletes(tmp_path)

    # Then
    assert recovered == ()
    assert not staging.exists()


def test_briefing_scoped_delete_invalidates_link_and_preserves_sibling(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Given
    from features.daily_briefing import archive, service

    for name in (
        "2026-07-17.us.json",
        "2026-07-17.kr.json",
        "2026-07-17.us.visuals.json",
        "2026-07-17.link.json",
    ):
        _write(tmp_path / name)
    index = archive.BriefingArchiveIndex(tmp_path, ttl_seconds=3600)
    index.query()
    monkeypatch.setattr(service, "BRIEFINGS_DIR", tmp_path)
    monkeypatch.setattr(archive, "_ARCHIVE_INDEX", index)

    # When
    result = service.delete_briefing("2026-07-17", market="us")

    # Then
    assert result["deleted"] is True
    assert (tmp_path / "2026-07-17.kr.json").exists()
    assert not (tmp_path / "2026-07-17.link.json").exists()
    assert index.query()["total"] == 1


def test_company_delete_rejects_mutated_id_and_preserves_collision(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Given
    from features.company_analysis import service

    reports_dir = tmp_path / "company-analysis"
    _write(reports_dir / "alpha.json", {"id": "alpha"})
    _write(reports_dir / "alpha-extra.json", {"id": "alpha-extra"})
    monkeypatch.setattr(service, "ANALYSIS_REPORTS_DIR", reports_dir)

    # When / Then
    with pytest.raises(ValueError):
        service.delete_analysis_report("alpha/../extra")
    result = service.delete_analysis_report("alpha")
    assert result["deleted"] is True
    assert (reports_dir / "alpha-extra.json").exists()


def test_topic_delete_resolves_payload_id_exactly(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Given
    from features.topic_report import service

    reports_dir = tmp_path / "topic-reports"
    reports_dir.mkdir()
    exact = reports_dir / "2026-07-17_topic_deadbeef.json"
    collision = reports_dir / "000_deadbeef00.json"
    _write(collision, {"id": "deadbeef00"})
    _write(exact, {"id": "deadbeef"})
    monkeypatch.setattr(service, "REPORTS_DIR", reports_dir)

    # When
    result = service.delete_topic_report("deadbeef")

    # Then
    assert result["deleted"] is True
    assert not exact.exists()
    assert collision.exists()


def test_app_startup_recovers_briefing_journal_and_refreshes_cache(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Given
    import app

    briefing_root = tmp_path / "briefings"
    company_root = tmp_path / "company-analysis"
    topic_root = tmp_path / "topic-reports"
    _write(briefing_root / "2026-07-17.us.json")
    with pytest.raises(RuntimeError, match="renamed"):
        execute_report_delete(DeleteRequest(
            root=briefing_root,
            identity="briefing:2026-07-17:us",
            primary_names=("2026-07-17.us.json",),
            target_names=("2026-07-17.us.json",),
            fault_stage="renamed",
        ))
    refreshes: list[str] = []
    monkeypatch.setattr(app, "BRIEFINGS_DIR", briefing_root)
    monkeypatch.setattr(app, "ANALYSIS_REPORTS_DIR", company_root)
    monkeypatch.setattr(app, "TOPIC_REPORTS_DIR", topic_root)
    monkeypatch.setattr(app, "refresh_briefing_archive", lambda: refreshes.append("refreshed"))
    monkeypatch.setattr(app, "ensure_company_files", lambda: None)

    # When
    app.ensure_dirs()

    # Then
    assert refreshes == ["refreshed"]
    assert not list(briefing_root.glob(".report-delete-*"))


def test_delete_routes_map_invalid_and_missing_ids(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Given
    import app
    from features.company_analysis import service as company_service
    from features.topic_report import service as topic_service

    company_root = tmp_path / "company-analysis"
    topic_root = tmp_path / "topic-reports"
    company_root.mkdir()
    topic_root.mkdir()
    monkeypatch.setattr(company_service, "ANALYSIS_REPORTS_DIR", company_root)
    monkeypatch.setattr(topic_service, "REPORTS_DIR", topic_root)

    # When / Then
    with pytest.raises(app.HTTPException) as invalid:
        app.api_delete_analysis_report("bad/id")
    assert invalid.value.status_code == 400
    with pytest.raises(app.HTTPException) as missing:
        app.api_delete_topic_report("missing")
    assert missing.value.status_code == 404
