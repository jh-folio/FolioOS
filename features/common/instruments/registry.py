from __future__ import annotations

import re
import unicodedata

from features.common.instruments.schema import InstrumentIdentity
from features.common.markets import MARKET_REGISTRY, MarketCode, normalize_market_code


class InstrumentRegistryError(ValueError):
    pass


_EXCHANGE_ALIASES = {
    "NYSE": "NYSE", "NASDAQ": "NASDAQ", "AMEX": "AMEX", "NYSEARCA": "NYSEARCA", "OTC": "OTC",
    "KRX": "KRX", "KOSPI": "KOSPI", "KOSDAQ": "KOSDAQ",
    "LSE": "LSE", "XLON": "LSE",
    "XETRA": "XETRA", "XFRA": "XETRA", "FWB": "XETRA",
    "EPA": "EURONEXT_PARIS", "XPAR": "EURONEXT_PARIS", "EURONEXT_PARIS": "EURONEXT_PARIS",
    "AMS": "EURONEXT_AMSTERDAM", "XAMS": "EURONEXT_AMSTERDAM", "EURONEXT_AMSTERDAM": "EURONEXT_AMSTERDAM",
    "BIT": "EURONEXT_MILAN", "XMIL": "EURONEXT_MILAN", "EURONEXT_MILAN": "EURONEXT_MILAN",
    "BME": "BME_MADRID", "XMAD": "BME_MADRID", "BME_MADRID": "BME_MADRID",
    "TSE": "TSE", "JPX": "TSE", "XTKS": "TSE",
}

_EXCHANGE_MARKETS = {
    **{code: MarketCode.US for code in ("NYSE", "NASDAQ", "AMEX", "NYSEARCA", "OTC")},
    **{code: MarketCode.KR for code in ("KRX", "KOSPI", "KOSDAQ")},
    **{code: MarketCode.EUROPE for code in ("LSE", "XETRA", "EURONEXT_PARIS", "EURONEXT_AMSTERDAM", "EURONEXT_MILAN", "BME_MADRID")},
    "TSE": MarketCode.JP,
}

_EXCHANGE_SUFFIXES = {
    "KRX": ".KS", "KOSPI": ".KS", "KOSDAQ": ".KQ",
    "LSE": ".L", "XETRA": ".DE", "EURONEXT_PARIS": ".PA",
    "EURONEXT_AMSTERDAM": ".AS", "EURONEXT_MILAN": ".MI", "BME_MADRID": ".MC",
    "TSE": ".T",
}

_SUFFIX_MARKETS = tuple(
    sorted(
        (
            (suffix, definition.code)
            for definition in MARKET_REGISTRY.values()
            for suffix in definition.yfinance_suffixes
        ),
        key=lambda row: len(row[0]),
        reverse=True,
    )
)


_SUFFIX_CURRENCIES = {
    ".KS": "KRW", ".KQ": "KRW",
    ".L": "GBP", ".DE": "EUR", ".PA": "EUR", ".AS": "EUR", ".MI": "EUR", ".MC": "EUR",
    ".T": "JPY",
}

# Yahoo quotes some venues in a minor unit. London prints pence, not pounds, so a
# 3280.5 GBp Shell quote is £32.805 — reading it as GBP overstates the position by
# 100x once it is converted. The scale belongs with the quote, never with the FX rate.
_MINOR_UNITS = {"GBP": ("GBP", 0.01), "ILA": ("ILS", 0.01), "ZAC": ("ZAR", 0.01)}


def _upper(value: object) -> str:
    return unicodedata.normalize("NFKC", str(value or "")).strip().upper()


def quote_currency(value: object) -> tuple[str, float]:
    """Return the ISO currency a provider quote is in and the scale to reach it.

    ``("GBp", ...)`` is pence: the code is GBP and the scale is 0.01. Case matters
    on the way in — "GBP" and "GBp" are different units — so this does not upper
    the input before testing it.
    """
    raw = unicodedata.normalize("NFKC", str(value or "")).strip()
    if not raw:
        return "", 1.0
    if raw.isupper():
        return raw, 1.0
    minor = _MINOR_UNITS.get(raw.upper())
    if minor and raw != raw.upper():
        return minor
    return raw.upper(), 1.0


def exchange_suffix(ticker: object) -> str:
    """Return the exchange suffix a provider symbol carries, else ""."""
    symbol = _upper(ticker)
    for suffix, _market in _SUFFIX_MARKETS:
        if symbol.endswith(suffix) and len(symbol) > len(suffix):
            return suffix
    return ""


def suffix_currency(ticker: object) -> str:
    """Return the currency implied by a provider symbol's exchange suffix, else ""."""
    symbol = _upper(ticker)
    for suffix, currency in sorted(_SUFFIX_CURRENCIES.items(), key=lambda row: len(row[0]), reverse=True):
        if symbol.endswith(suffix):
            return currency
    return ""


def normalize_exchange(value: object) -> str:
    raw = _upper(value).replace(" ", "_")
    return _EXCHANGE_ALIASES.get(raw, "")


def infer_market(ticker: object, exchange: object = "") -> MarketCode:
    normalized_exchange = normalize_exchange(exchange)
    if normalized_exchange:
        return _EXCHANGE_MARKETS[normalized_exchange]
    symbol = _upper(ticker)
    for suffix, market in _SUFFIX_MARKETS:
        if symbol.endswith(suffix):
            return market
    if re.fullmatch(r"[0-9]{6}", symbol):
        return MarketCode.KR
    return MarketCode.UNKNOWN


def provider_symbol(ticker: object, exchange: object = "") -> str:
    symbol = _upper(ticker).lstrip("$")
    normalized_exchange = normalize_exchange(exchange)
    if _EXCHANGE_MARKETS.get(normalized_exchange) is MarketCode.US:
        return symbol.replace(".", "-")
    suffix = _EXCHANGE_SUFFIXES.get(normalized_exchange, "")
    if suffix and not symbol.endswith(suffix):
        return f"{symbol}{suffix}"
    return symbol


def _canonical_id(
    market: MarketCode,
    ticker: str,
    exchange: str,
    *,
    isin: str,
    edinet_code: str,
    cik: str,
    corp_code: str,
) -> str:
    if cik:
        return f"SEC:CIK:{cik.zfill(10)}"
    if edinet_code:
        return f"JP:EDINET:{edinet_code}"
    if corp_code:
        return f"KR:DART:{corp_code}"
    if isin:
        return f"ISIN:{isin}"
    if market is MarketCode.UNKNOWN:
        raise InstrumentRegistryError("instrument_market_unknown")
    venue = exchange or "UNSPECIFIED"
    return f"{market.value}:{venue}:{ticker}"


def build_instrument_identity(
    *,
    ticker: object,
    name: object = "",
    exchange: object = "",
    market: object = "",
    country: object = "",
    currency: object = "",
    isin: object = "",
    lei: object = "",
    edinet_code: object = "",
    cik: object = "",
    corp_code: object = "",
    aliases: object = (),
) -> InstrumentIdentity:
    symbol = _upper(ticker).lstrip("$")
    venue = normalize_exchange(exchange)
    if str(exchange or "").strip() and not venue:
        raise InstrumentRegistryError("instrument_exchange_unknown")
    inferred = infer_market(symbol, venue)
    explicit = normalize_market_code(market) if str(market or "").strip() else MarketCode.UNKNOWN
    if explicit is not MarketCode.UNKNOWN and inferred is not MarketCode.UNKNOWN and explicit is not inferred:
        raise InstrumentRegistryError("instrument_market_conflict")
    resolved = explicit if explicit is not MarketCode.UNKNOWN else inferred
    normalized_isin = _upper(isin)
    normalized_edinet = _upper(edinet_code)
    normalized_cik = str(cik or "").strip()
    normalized_corp = str(corp_code or "").strip()
    return InstrumentIdentity(
        instrumentId=_canonical_id(
            resolved, symbol, venue,
            isin=normalized_isin,
            edinet_code=normalized_edinet,
            cik=normalized_cik,
            corp_code=normalized_corp,
        ),
        name=str(name or "").strip(),
        ticker=symbol,
        providerSymbol=provider_symbol(symbol, venue),
        exchange=venue,
        market=resolved,
        country=country,
        currency=currency,
        isin=normalized_isin,
        lei=lei,
        edinetCode=normalized_edinet,
        cik=normalized_cik,
        corpCode=normalized_corp,
        aliases=aliases,
    )
