from __future__ import annotations

import sqlite3

from features.common.canonical_json import JsonValue
from features.market_memory.attempt_store import AttemptMode, AttemptScope, UpdateAttemptRef
from features.market_memory.memory import init_db
from features.thesis_tracking.store import init_db as init_thesis_db


NOW = "2026-07-17T03:04:05Z"


def projection(artifact_type: str, artifact_id: str) -> dict[str, JsonValue]:
    return {
        "status": "done",
        "artifactType": artifact_type,
        "artifactId": artifact_id,
        "reportId": None,
        "date": None,
        "title": None,
        "savedCount": 1 if artifact_type in {"market_memory_llm", "market_memory_update"} else None,
        "snapshotId": "snapshot-1"
        if artifact_type in {"market_state_snapshot", "market_memory_update"}
        else None,
        "proposalId": None,
        "requestedMode": None,
        "attemptedEngine": "cli",
        "finalEngine": "cli",
        "fallbackReason": None,
        "adapter": "codex",
        "mode": "generate",
    }


def connection() -> sqlite3.Connection:
    result = sqlite3.connect(":memory:")
    result.row_factory = sqlite3.Row
    init_db(result)
    init_thesis_db(result)
    return result


def attempt() -> UpdateAttemptRef:
    return UpdateAttemptRef.model_validate(
        {
            "id": "msa_01234567-89ab-4cde-8fab-0123456789ab",
            "scope": AttemptScope.GLOBAL,
            "mode": AttemptMode.COMBINED_JOB,
            "jobId": "job_01234567-89ab-4cde-8fab-0123456789ab",
            "operationId": "op_market_1",
            "startedAt": NOW,
            "inputWatermark": NOW,
        }
    )


def entry() -> dict[str, JsonValue]:
    return {
        "id": "memory-1",
        "date": "2026-07-17",
        "asOf": NOW,
        "title": "AI 전력 인프라 투자 확대",
        "summary": "서로 다른 공식 자료가 전력 인프라 투자 확대를 확인했다.",
        "story": "ai_power_branch",
        "storyFamily": "ai_power_family",
        "parentStory": "ai_power_family",
        "storyRelation": "branches_from",
        "stateKey": "ai_power_branch",
        "stateStatus": "active",
        "importance": "high",
        "tags": ["AI", "Energy"],
        "industries": ["Energy"],
        "tickers": ["ETN"],
        "sources": [
            {"source": "official-a", "title": "Grid A", "url": "https://a.invalid"},
            {"source": "official-b", "title": "Grid B", "url": "https://b.invalid"},
        ],
    }


def snapshot_payload() -> dict[str, JsonValue]:
    return {
        "id": "snapshot-1",
        "asOf": NOW,
        "horizon": "medium_term",
        "status": "current",
        "headline": "전력 인프라 투자 확대",
        "oneLineSummary": "AI 전력 수요가 인프라 투자를 지지한다.",
        "beginnerSummary": "전력 설비 투자 흐름을 확인한다.",
        "actionPosture": "투자 집행을 확인하며 분할 접근한다.",
        "actionGuide": {"summary": "확인 후 분할 접근"},
        "keyDrivers": [
            {
                "id": "driver-1",
                "title": "전력 투자",
                "summary": "AI 전력 수요가 설비 투자를 늘린다.",
                "sourceRefs": ["source-1"],
            }
        ],
        "watchItems": ["설비 투자 집행률"],
        "counterEvidence": ["금리 상승"],
        "uncertainties": ["투자 집행 속도"],
        "sourceRefs": [
            {
                "id": "source-1",
                "title": "Grid investment",
                "source": "official",
                "date": "2026-07-17",
                "url": "https://source.invalid",
            }
        ],
        "confidence": 0.6,
    }
