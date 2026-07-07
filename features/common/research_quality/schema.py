"""Shared quality schema helpers."""
from __future__ import annotations

CHECK_KEYS = (
    "topic_answered",
    "scope_defined",
    "data_coverage",
    "source_coverage",
    "numeric_support",
    "counterargument_present",
    "scenario_quality",
    "checkpoint_quality",
    "source_grounding",
    "hallucination_risk",
    "personal_bias_risk",
)


def grade_from_score(score: int) -> str:
    bands = [
        (90, "A"), (85, "A-"), (80, "B+"), (75, "B"), (70, "B-"),
        (65, "C+"), (60, "C"), (50, "C-"), (40, "D"),
    ]
    for threshold, label in bands:
        if score >= threshold:
            return label
    return "F"


def status_from_score(score: int) -> str:
    if score >= 70:
        return "pass"
    if score >= 50:
        return "warn"
    return "fail"


def level_from_ratio(ratio: float) -> str:
    if ratio >= 0.75:
        return "high"
    if ratio >= 0.4:
        return "medium"
    if ratio > 0:
        return "low"
    return "none"


def risk_level(score: float) -> str:
    """Risk item score is inverse risk: high score means low risk."""
    if score >= 0.8:
        return "low"
    if score >= 0.5:
        return "medium"
    return "high"
