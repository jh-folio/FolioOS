from __future__ import annotations

import json
from pathlib import Path

import pytest

from features.company_analysis import service as company_service
from features.topic_report import service as topic_service


def test_company_save_uses_canonical_revision_and_stales_overlay(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    root = tmp_path / "company-analysis"
    monkeypatch.setattr(company_service, "ANALYSIS_REPORTS_DIR", root)
    first = company_service.save_analysis_report({
        "generatedAt": "2026-07-17T00:00:00Z",
        "company": {"ticker": "TEST", "name": "Test"},
        "markdown": "# Company\n\n## Risk\n\nInitial",
        "personalOverlay": {"stale": False, "markdown": "private"},
    })

    second = company_service.save_analysis_report({
        **first,
        "markdown": "# Company\n\n## Risk\n\nChanged",
    })

    path = root / f"{first['id']}.json"
    saved = json.loads(path.read_text(encoding="utf-8"))
    assert first["canonicalRevision"]["number"] == 1
    assert second["canonicalRevision"]["number"] == 2
    assert saved["personalOverlay"]["stale"] is True
    assert saved["personalOverlay"]["staleReason"] == "canonical_revision_changed"
    assert "jobCommit" not in saved


def test_topic_save_and_exact_lookup_use_canonical_coordinator(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    root = tmp_path / "topic-reports"
    monkeypatch.setattr(topic_service, "REPORTS_DIR", root)
    first = topic_service.save_topic_report({
        "date": "2026-07-17",
        "topicKey": "custom",
        "topicLabel": "Alpha",
        "markdown": "# Topic\n\n## Source & Data Notes\n\nInitial",
    })
    topic_service.save_topic_report({
        "date": "2026-07-17",
        "topicKey": "custom",
        "topicLabel": "Alpha Long",
        "id": f"{first['id']}-long",
        "markdown": "# Neighbor\n\n## Source & Data Notes\n\nOther",
    })

    exact = topic_service.get_topic_report(first["id"])

    assert exact is not None and exact["id"] == first["id"]
    assert exact["canonicalRevision"]["number"] == 1
