from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from features.common.canonical_identity import ReportKind
from features.common.canonical_json import JsonValue


type TerminalResult = dict[str, str | int | bool | None]


@dataclass(frozen=True, slots=True)
class BriefingJobRequest:
    date: str
    scopes: tuple[Literal["us", "kr", "europe", "jp"], ...]
    reports: dict[str, dict[str, JsonValue]]
    visuals: dict[str, dict[str, JsonValue]]
    terminal_result: TerminalResult


@dataclass(frozen=True, slots=True)
class ReportJobRequest:
    report: dict[str, JsonValue]
    terminal_result: TerminalResult


@dataclass(frozen=True, slots=True)
class OverlayJobRequest:
    report_kind: ReportKind
    report_id: str
    market_scope: Literal["us", "kr"] | None
    personal_overlay: dict[str, JsonValue]
    terminal_result: TerminalResult


@dataclass(frozen=True, slots=True)
class QualityRepairJobRequest:
    report_kind: ReportKind
    report_id: str
    market_scope: Literal["us", "kr"] | None
    candidate: dict[str, JsonValue]
    terminal_result: TerminalResult


@dataclass(frozen=True, slots=True)
class InvestmentReviewJobRequest:
    body: dict[str, JsonValue]
    terminal_result: TerminalResult
