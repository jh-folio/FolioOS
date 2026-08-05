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
class IndexDescriptor:
    """A representative index, carrying what a price chart needs to label it.

    Currency and timezone belong here rather than on the market because Europe
    has neither one of. The FTSE 100 prints in GBP on London time while the DAX
    prints in EUR on Berlin time, and a chart that labels both "Europe, EUR"
    would be stating something false about the numbers on the axis.

    ``proxy_for`` is set when the provider has no symbol for the index itself and
    a tracking fund stands in — the series is then honestly the fund, not the
    index, and callers must not present it as the index.
    """
    ticker: str
    label: str
    currency: str
    timezone: str
    country: str
    in_default_chart: bool = True
    proxy_for: str = ""


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
    representative_indices: tuple[IndexDescriptor, ...]
    yfinance_suffixes: tuple[str, ...]
    order: int
    capabilities: MarketCapabilities


_US_INDICES = (
    IndexDescriptor("^GSPC", "S&P 500", "USD", "America/New_York", "US"),
    IndexDescriptor("^IXIC", "Nasdaq", "USD", "America/New_York", "US"),
    IndexDescriptor("^DJI", "Dow Jones", "USD", "America/New_York", "US"),
)
_KR_INDICES = (
    IndexDescriptor("^KS11", "KOSPI", "KRW", "Asia/Seoul", "KR"),
    IndexDescriptor("^KS200", "KOSPI 200", "KRW", "Asia/Seoul", "KR"),
)
# 유럽은 광역 지수 하나로 대표되지 않는다. STOXX 600이 광역 흐름을 주고, 국가 지수가
# 갈리는 날의 차이를 보여준다. 기본 차트는 광역 + 영국·독일·프랑스·네덜란드로 묶는다.
# 이탈리아·스페인은 계약상 대표 지수로 남기되 기본 선 차트에서는 뺀다 — 7개 선은 읽히지 않고,
# 이 워크스페이스에서 실제로 추적되는 유럽 기업은 앞의 네 나라에 몰려 있다.
_EUROPE_INDICES = (
    IndexDescriptor("^STOXX", "STOXX Europe 600", "EUR", "Europe/Zurich", "EU"),
    IndexDescriptor("^FTSE", "FTSE 100", "GBP", "Europe/London", "GB"),
    IndexDescriptor("^GDAXI", "DAX", "EUR", "Europe/Berlin", "DE"),
    IndexDescriptor("^FCHI", "CAC 40", "EUR", "Europe/Paris", "FR"),
    IndexDescriptor("^AEX", "AEX", "EUR", "Europe/Amsterdam", "NL"),
    IndexDescriptor("FTSEMIB.MI", "FTSE MIB", "EUR", "Europe/Rome", "IT", in_default_chart=False),
    IndexDescriptor("^IBEX", "IBEX 35", "EUR", "Europe/Madrid", "ES", in_default_chart=False),
)
# TOPIX 지수 자체는 yfinance에 심볼이 없다(^TPX·^TOPX 모두 빈 응답). 추종 ETF로 대신
# 그리되 라벨과 proxy_for로 ETF임을 밝힌다 — 지수라고 표기하면 사실이 아니다.
_JP_INDICES = (
    IndexDescriptor("^N225", "Nikkei 225", "JPY", "Asia/Tokyo", "JP"),
    IndexDescriptor("1475.T", "TOPIX 추종 ETF (1475)", "JPY", "Asia/Tokyo", "JP", proxy_for="TOPIX"),
)

_ALL = MarketCapabilities(True, True, True, True, True, True)
# 유럽·일본 히트맵은 재배포 가능한 구성종목 파일(FTSE100+DAX+CAC40+AEX 합성,
# 닛케이 225)이 들어오면서 켜졌다.
_EUROPE = MarketCapabilities(True, True, True, True, True, True)
_JAPAN = MarketCapabilities(True, True, True, True, True, True)
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
        "America/New_York", ("USD",), _US_INDICES, (), 10, _ALL,
    ),
    MarketCode.KR: MarketDefinition(
        MarketCode.KR, "한국", "South Korea",
        ("kr", "kor", "korea", "south korea", "republic of korea", "한국", "대한민국"),
        ("KR",),
        (ExchangeAnchor("KRX", "Asia/Seoul", "KR"),),
        "Asia/Seoul", ("KRW",), _KR_INDICES, (".KS", ".KQ"), 20, _ALL,
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
        "Europe/London", ("GBP", "EUR"), _EUROPE_INDICES,
        (".L", ".DE", ".PA", ".AS", ".MI", ".MC"), 30, _EUROPE,
    ),
    MarketCode.JP: MarketDefinition(
        MarketCode.JP, "일본", "Japan",
        ("jp", "jpn", "japan", "日本", "일본"),
        ("JP",),
        (ExchangeAnchor("TSE", "Asia/Tokyo", "JP"),),
        "Asia/Tokyo", ("JPY",), _JP_INDICES, (".T",), 40, _JAPAN,
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
