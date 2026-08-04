"""Controlled market, region, and briefing-scope contracts.

The values in this module are storage/API contracts. Feature modules may expose a
smaller subset while they migrate, but they must not invent alternative spellings
or persist ``EU`` in place of ``EUROPE``.
"""
from __future__ import annotations

import unicodedata
from dataclasses import dataclass
from enum import StrEnum
from typing import Iterable


class MarketCode(StrEnum):
    US = "US"
    KR = "KR"
    EUROPE = "EUROPE"
    JP = "JP"
    GLOBAL = "GLOBAL"
    UNKNOWN = "UNKNOWN"


class BriefingRequestScope(StrEnum):
    US = "us"
    KR = "kr"
    EUROPE = "europe"
    JP = "jp"
    ALL = "all"


class SavedMarketScope(StrEnum):
    US = "us"
    KR = "kr"
    EUROPE = "europe"
    JP = "jp"
    ALL = "all"
    BOTH = "both"


class MarketContractError(ValueError):
    pass


@dataclass(frozen=True, slots=True)
class ExchangeAnchor:
    code: str
    timezone: str
    country: str


@dataclass(frozen=True, slots=True)
class MarketCapabilities:
    rss: bool
    briefing: bool
    chart: bool
    heatmap: bool
    calendar: bool
    official_filings: bool


@dataclass(frozen=True, slots=True)
class MarketDefinition:
    code: MarketCode
    label_ko: str
    label_en: str
    aliases: tuple[str, ...]
    countries: tuple[str, ...]
    exchanges: tuple[ExchangeAnchor, ...]
    timezone: str
    currencies: tuple[str, ...]
    representative_indices: tuple[str, ...]
    yfinance_suffixes: tuple[str, ...]
    order: int
    capabilities: MarketCapabilities


_ALL = MarketCapabilities(True, True, True, True, True, True)
_EUROPE = MarketCapabilities(True, True, True, False, True, True)
_JAPAN = MarketCapabilities(True, True, True, False, True, True)
_NON_PRODUCT = MarketCapabilities(True, False, False, False, False, False)
_UNKNOWN = MarketCapabilities(False, False, False, False, False, False)


MARKET_REGISTRY: dict[MarketCode, MarketDefinition] = {
    MarketCode.US: MarketDefinition(
        MarketCode.US, "미국", "United States",
        ("us", "usa", "united states", "america", "미국"),
        ("US",),
        (
            ExchangeAnchor("NYSE", "America/New_York", "US"),
            ExchangeAnchor("NASDAQ", "America/New_York", "US"),
        ),
        "America/New_York", ("USD",), ("^GSPC", "^IXIC", "^DJI"), (), 10, _ALL,
    ),
    MarketCode.KR: MarketDefinition(
        MarketCode.KR, "한국", "South Korea",
        ("kr", "kor", "korea", "south korea", "republic of korea", "한국", "대한민국"),
        ("KR",),
        (ExchangeAnchor("KRX", "Asia/Seoul", "KR"),),
        "Asia/Seoul", ("KRW",), ("^KS11", "^KQ11"), (".KS", ".KQ"), 20, _ALL,
    ),
    MarketCode.EUROPE: MarketDefinition(
        MarketCode.EUROPE, "유럽", "Europe",
        (
            "europe", "eu", "european", "유럽", "uk", "gb", "great britain", "united kingdom",
            "de", "germany", "fr", "france", "nl", "netherlands", "it", "italy", "es", "spain",
        ),
        ("GB", "DE", "FR", "NL", "IT", "ES"),
        (
            ExchangeAnchor("LSE", "Europe/London", "GB"),
            ExchangeAnchor("XETRA", "Europe/Berlin", "DE"),
            ExchangeAnchor("EURONEXT_PARIS", "Europe/Paris", "FR"),
            ExchangeAnchor("EURONEXT_AMSTERDAM", "Europe/Amsterdam", "NL"),
            ExchangeAnchor("EURONEXT_MILAN", "Europe/Rome", "IT"),
            ExchangeAnchor("BME_MADRID", "Europe/Madrid", "ES"),
        ),
        "Europe/London", ("GBP", "EUR"),
        ("^STOXX", "^FTSE", "^GDAXI", "^FCHI", "^AEX", "FTSEMIB.MI", "^IBEX"),
        (".L", ".DE", ".PA", ".AS", ".MI", ".MC"), 30, _EUROPE,
    ),
    MarketCode.JP: MarketDefinition(
        MarketCode.JP, "일본", "Japan",
        ("jp", "jpn", "japan", "日本", "일본"),
        ("JP",),
        (ExchangeAnchor("TSE", "Asia/Tokyo", "JP"),),
        "Asia/Tokyo", ("JPY",), ("^N225",), (".T",), 40, _JAPAN,
    ),
    MarketCode.GLOBAL: MarketDefinition(
        MarketCode.GLOBAL, "글로벌", "Global",
        ("global", "world", "worldwide", "글로벌", "세계"),
        (), (), "UTC", ("USD",), (), (), 90, _NON_PRODUCT,
    ),
    MarketCode.UNKNOWN: MarketDefinition(
        MarketCode.UNKNOWN, "미분류", "Unknown",
        ("unknown", "unclassified", "미분류"),
        (), (), "UTC", (), (), (), 99, _UNKNOWN,
    ),
}

EVIDENCE_MARKETS = tuple(MARKET_REGISTRY)
PRODUCT_MARKETS = (MarketCode.US, MarketCode.KR, MarketCode.EUROPE, MarketCode.JP)
LEGACY_PRODUCT_MARKETS = (MarketCode.US, MarketCode.KR)
MARKET_FILTER_VALUES = ("ALL", *(market.value for market in EVIDENCE_MARKETS))
COUNTRY_CODES = frozenset({"US", "KR", "GB", "DE", "FR", "NL", "IT", "ES", "JP"})


def _token(value: object) -> str:
    text = unicodedata.normalize("NFKC", str(value or "")).strip().casefold()
    return " ".join(text.replace("_", " ").replace("-", " ").split())


_MARKET_ALIASES = {
    _token(alias): code
    for code, definition in MARKET_REGISTRY.items()
    for alias in (code.value, *definition.aliases)
}


def normalize_market_code(
    value: object,
    *,
    default: MarketCode = MarketCode.UNKNOWN,
    strict: bool = False,
) -> MarketCode:
    if isinstance(value, MarketCode):
        return value
    normalized = _MARKET_ALIASES.get(_token(value))
    if normalized is not None:
        return normalized
    if strict:
        raise MarketContractError(f"invalid_market:{value}")
    return default


def normalize_market_codes(values: Iterable[object], *, include_unknown: bool = False) -> tuple[MarketCode, ...]:
    found = {normalize_market_code(value) for value in values}
    if not include_unknown:
        found.discard(MarketCode.UNKNOWN)
    return tuple(sorted(found, key=lambda code: MARKET_REGISTRY[code].order))


_REQUEST_SCOPE_ALIASES = {
    "us": BriefingRequestScope.US,
    "kr": BriefingRequestScope.KR,
    "europe": BriefingRequestScope.EUROPE,
    "eu": BriefingRequestScope.EUROPE,
    "jp": BriefingRequestScope.JP,
    "all": BriefingRequestScope.ALL,
    "global": BriefingRequestScope.ALL,
    "both": BriefingRequestScope.ALL,
}


def normalize_requested_market_scope(
    value: object,
    *,
    default: BriefingRequestScope = BriefingRequestScope.ALL,
    strict: bool = False,
) -> BriefingRequestScope:
    normalized = _REQUEST_SCOPE_ALIASES.get(_token(value))
    if normalized is not None:
        return normalized
    if strict:
        raise MarketContractError(f"invalid_requested_market_scope:{value}")
    return default


def normalize_saved_market_scope(
    value: object,
    *,
    default: SavedMarketScope | None = None,
    strict: bool = False,
) -> SavedMarketScope | None:
    token = _token(value)
    try:
        return SavedMarketScope(token)
    except ValueError:
        market = normalize_market_code(value)
        if market in PRODUCT_MARKETS:
            return SavedMarketScope(market.value.lower())
        if strict:
            raise MarketContractError(f"invalid_saved_market_scope:{value}") from None
        return default


def market_keys_for_scope(value: object, *, saved: bool = False) -> tuple[MarketCode, ...]:
    if saved:
        scope = normalize_saved_market_scope(value, strict=True)
        if scope is SavedMarketScope.BOTH:
            return LEGACY_PRODUCT_MARKETS
        if scope is SavedMarketScope.ALL:
            return PRODUCT_MARKETS
        return (MarketCode(scope.value.upper()),)
    scope = normalize_requested_market_scope(value, strict=True)
    if scope is BriefingRequestScope.ALL:
        return PRODUCT_MARKETS
    return (MarketCode(scope.value.upper()),)


def legacy_scope_compatibility(value: object) -> dict[str, object]:
    """Describe a stored scope without rewriting its historical meaning."""
    saved = normalize_saved_market_scope(value, strict=True)
    return {
        "savedScope": saved.value,
        "requestedScope": "all" if saved is SavedMarketScope.BOTH else saved.value,
        "marketKeys": tuple(code.value for code in market_keys_for_scope(saved, saved=True)),
        "legacyUsKrAggregate": saved is SavedMarketScope.BOTH,
    }


def market_definition(value: object) -> MarketDefinition:
    return MARKET_REGISTRY[normalize_market_code(value, strict=True)]
