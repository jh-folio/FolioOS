"""Service facade for Step 9 data reliability."""
from __future__ import annotations

from features.common.data_reliability.kr_data_import import discover_market_data_files, korea_market_data_gaps
from features.common.data_reliability.provider_status import load_provider_status, save_provider_status


def provider_status_payload() -> dict:
    return load_provider_status()


def record_provider_status_payload(records: list[dict]) -> dict:
    return save_provider_status(records)


def market_data_files_payload() -> dict:
    summary = discover_market_data_files()
    summary["dataGaps"] = korea_market_data_gaps(artifact_type="briefing")
    return summary
