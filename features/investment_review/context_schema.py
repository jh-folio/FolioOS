"""Public-safe investment context projections.

Evidence, user hypothesis, portfolio, and watchlist inputs are deliberately
separate records so personal context cannot be promoted to evidence.
"""
from __future__ import annotations

from enum import StrEnum
from typing import Annotated, Literal, Self

from pydantic import BaseModel, ConfigDict, Field


UtcZ = Annotated[
    str,
    Field(pattern=r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$"),
]
Ticker = Annotated[str, Field(pattern=r"^[A-Z0-9-]{1,12}$")]
ReferenceId = Annotated[str, Field(pattern=r"^[A-Za-z0-9:._-]{1,200}$")]
NoteId = Annotated[str, Field(pattern=r"^[A-Za-z0-9_-]{1,96}$")]
ReasonCode = Annotated[str, Field(pattern=r"^[a-z][a-z0-9_]{0,79}$")]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class InvestmentStance(StrEnum):
    POSITIVE = "positive"
    WATCH = "watch"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    UNKNOWN = "unknown"


class EvidenceContext(StrictModel):
    evidenceId: ReferenceId
    source: Annotated[str, Field(min_length=1, max_length=120)]
    title: Annotated[str, Field(min_length=1, max_length=240)]


class HypothesisContext(StrictModel):
    noteIds: Annotated[tuple[NoteId, ...], Field(max_length=50)] = ()
    thesisTicker: Ticker | None = None


class PortfolioContext(StrictModel):
    held: bool = False
    weightPct: Annotated[float, Field(ge=-1_000, le=1_000)] | None = None
    quantity: Annotated[float, Field(ge=-1_000_000_000, le=1_000_000_000)] | None = None


class WatchlistContext(StrictModel):
    watched: bool = False
    listIds: Annotated[tuple[ReferenceId, ...], Field(max_length=20)] = ()


class TickerContextSource(StrEnum):
    PORTFOLIO = "portfolio"
    WATCHLIST = "watchlist"
    BOTH = "both"


class ThesisVerdict(StrEnum):
    STRENGTHENED = "strengthened"
    MAINTAINED = "maintained"
    WEAKENED = "weakened"
    AT_RISK = "at_risk"
    BROKEN = "broken"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
    UNKNOWN = "unknown"


class MarketDriverLink(StrictModel):
    stateId: ReferenceId
    label: Annotated[str, Field(min_length=1, max_length=160)]
    momentum: Literal[
        "strengthening",
        "stable",
        "fading",
        "turning",
        "conflicted",
        "unknown",
    ]


class DueCheckpointLink(StrictModel):
    id: ReferenceId
    label: Annotated[str, Field(min_length=1, max_length=240)]
    dueAt: UtcZ | None = None


class LinkedReport(StrictModel):
    id: ReferenceId
    title: Annotated[str, Field(min_length=1, max_length=240)]
    reportType: Literal["briefing", "analysis", "topic", "unknown"]


class CollectionContextLink(StrictModel):
    id: ReferenceId
    name: Annotated[str, Field(min_length=1, max_length=80)]
    revision: Annotated[int, Field(ge=1)]
    health: Literal["active", "stale", "empty", "noisy", "unknown", "unavailable"]
    matchSources: Annotated[
        tuple[Literal["saved_filter", "external_result"], ...],
        Field(min_length=1, max_length=2),
    ]


class TickerResearchContext(StrictModel):
    ticker: Ticker
    source: TickerContextSource
    stance: InvestmentStance
    observedAt: UtcZ | None
    reasonCodes: Annotated[tuple[ReasonCode, ...], Field(max_length=12)] = ()
    marketDrivers: Annotated[tuple[MarketDriverLink, ...], Field(max_length=6)] = ()
    latestThesisVerdict: ThesisVerdict = ThesisVerdict.UNKNOWN
    dueCheckpoints: Annotated[tuple[DueCheckpointLink, ...], Field(max_length=8)] = ()
    linkedReports: Annotated[tuple[LinkedReport, ...], Field(max_length=8)] = ()
    collections: Annotated[tuple[CollectionContextLink, ...], Field(max_length=8)] = ()


class InvestmentContext(StrictModel):
    ticker: Ticker
    stance: InvestmentStance
    observedAt: UtcZ | None
    reasonCodes: Annotated[tuple[ReasonCode, ...], Field(max_length=12)] = ()
    evidence: Annotated[tuple[EvidenceContext, ...], Field(max_length=50)] = ()
    hypothesis: HypothesisContext = HypothesisContext()
    portfolio: PortfolioContext = PortfolioContext()
    watchlist: WatchlistContext = WatchlistContext()

    @classmethod
    def from_legacy(cls, payload: dict | None) -> Self:
        legacy = payload if isinstance(payload, dict) else {}
        return cls.model_validate(
            {
                "ticker": legacy.get("ticker") or "",
                "stance": legacy.get("stance") or InvestmentStance.UNKNOWN,
                "observedAt": legacy.get("observedAt"),
                "reasonCodes": legacy.get("reasonCodes") or (),
                "evidence": legacy.get("evidence") or (),
                "hypothesis": legacy.get("hypothesis") or {},
                "portfolio": legacy.get("portfolio") or {},
                "watchlist": legacy.get("watchlist") or {},
            }
        )


__all__ = [
    "EvidenceContext",
    "CollectionContextLink",
    "DueCheckpointLink",
    "HypothesisContext",
    "InvestmentContext",
    "InvestmentStance",
    "LinkedReport",
    "MarketDriverLink",
    "PortfolioContext",
    "ThesisVerdict",
    "TickerContextSource",
    "TickerResearchContext",
    "WatchlistContext",
]
