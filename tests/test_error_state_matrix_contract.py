from __future__ import annotations

import importlib.util
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "qa_error_state_sweep.py"
REQUIRED_STATES = {
    "no_rss_index",
    "no_note_thesis",
    "no_evidence_thesis_review",
    "agent_missing_disabled",
    "agent_timeout_cancel_restart",
    "malformed_inputs",
    "stale_collection_revision",
    "collection_empty_noisy_stale",
    "corrupt_sidecar_recovery",
    "empty_portfolio_watchlist",
    "missing_market_memory",
    "stale_personal_overlay",
    "dirty_source_package",
    "misleading_provider_success",
}


def test_error_state_sweep_pins_every_required_state_and_cleanup_contract() -> None:
    assert SCRIPT.is_file(), "TASK42_MISSING_ERROR_SWEEP"
    spec = importlib.util.spec_from_file_location("qa_error_state_sweep_contract", SCRIPT)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    assert set(module.REQUIRED_STATES) == REQUIRED_STATES
    assert all(module.REQUIRED_STATES[state] for state in REQUIRED_STATES)
    assert module.WEB_COMMAND == ("npm", "--prefix", "web", "test")
    source = SCRIPT.read_text(encoding="utf-8")
    for field in (
        "runtimeRemoved",
        "serverStopped",
        "portsReleased",
        "browserClosed",
        "partialWritesAbsent",
    ):
        assert field in source
