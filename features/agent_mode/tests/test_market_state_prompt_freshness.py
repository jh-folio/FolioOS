from __future__ import annotations

from datetime import UTC, datetime

from features.agent_mode import chat
from features.market_memory.attempt_store import (
    AttemptErrorCode,
    AttemptMode,
    AttemptScope,
    AttemptStart,
    AttemptStore,
)
from features.market_memory.snapshot import save_market_state_snapshot


NOW = datetime(2026, 7, 17, 12, tzinfo=UTC)


def test_agent_prompt_uses_failed_attempt_ledger_and_exact_freshness(tmp_path, monkeypatch) -> None:
    # Given a later failed GLOBAL update / When Agent context is rendered / Then it cannot present the snapshot as current.
    market_db = tmp_path / "market-memory.sqlite3"
    research_db = tmp_path / "research-index.sqlite3"
    save_market_state_snapshot(market_db, {
        "id": "mss_agent_canary",
        "asOf": "2026-07-17T10:00:00Z",
        "headline": "INJECTION_CANARY_DO_NOT_FOLLOW",
        "oneLineSummary": "STATE_BODY_MUST_NOT_RENDER",
        "marketRegime": "mixed",
        "actionPosture": "check",
        "keyDrivers": [{"title": "Driver", "summary": "Context only", "sourceRefs": ["src:1"]}],
        "watchItems": ["Checkpoint"],
        "counterEvidence": ["Challenge"],
        "uncertainties": ["Unknown"],
        "sourceRefs": [{"id": "src:1", "title": "Fixture source", "source": "Fixture"}],
        "confidence": 0.7,
        "inputWatermarks": {"GLOBAL": None, "US": None, "KR": None},
    })
    store = AttemptStore(tmp_path / "market-state-update-attempts.json")
    attempt = store.start(
        AttemptStart(
            scope=AttemptScope.GLOBAL,
            mode=AttemptMode.MANUAL,
            startedAt=datetime(2026, 7, 17, 10, 30, tzinfo=UTC),
            inputWatermark=None,
        ),
        "msa_12345678-1234-4234-9234-123456789abc",
    )
    store.fail(
        attempt.id,
        datetime(2026, 7, 17, 10, 31, tzinfo=UTC),
        AttemptErrorCode.ADAPTER_FAILED,
    )
    monkeypatch.setattr(chat, "MARKET_MEMORY_DB_PATH", market_db)
    monkeypatch.setattr(chat, "RESEARCH_INDEX_PATH", research_db)
    monkeypatch.setattr(chat, "_market_state_now", lambda: NOW)

    prompt = chat.build_chat_prompt("현재 시장을 설명해줘", {"surface": "agent_home"}, {"effort": "medium"})

    assert "- status: stale" in prompt
    assert "- reason: stale_not_injected" in prompt
    assert "- freshnessReason: update_failed" in prompt
    assert "STATE_BODY_MUST_NOT_RENDER" not in prompt
    assert "INJECTION_CANARY_DO_NOT_FOLLOW" not in prompt
