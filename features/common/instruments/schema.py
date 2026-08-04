from __future__ import annotations

import re
import unicodedata

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from features.common.markets import COUNTRY_CODES, MARKET_REGISTRY, MarketCode, normalize_market_code


_TICKER = re.compile(r"\^?[A-Z0-9][A-Z0-9./^=-]{0,24}")
_EXCHANGE = re.compile(r"[A-Z][A-Z0-9_]{1,31}")
_ISIN = re.compile(r"[A-Z]{2}[A-Z0-9]{9}[0-9]")
_LEI = re.compile(r"[A-Z0-9]{18}[0-9]{2}")
_EDINET = re.compile(r"E[0-9]{5}")


def _text(value: object) -> str:
    return unicodedata.normalize("NFKC", str(value or "")).strip()


class InstrumentIdentity(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, use_enum_values=False)

    instrumentId: str = Field(min_length=3, max_length=160)
    name: str = Field(default="", max_length=240)
    ticker: str = Field(min_length=1, max_length=25)
    providerSymbol: str = Field(default="", max_length=25)
    exchange: str = Field(default="", max_length=32)
    market: MarketCode
    country: str = Field(default="", max_length=2)
    currency: str = Field(default="", max_length=3)
    isin: str = Field(default="", max_length=12)
    lei: str = Field(default="", max_length=20)
    edinetCode: str = Field(default="", max_length=6)
    cik: str = Field(default="", max_length=10)
    corpCode: str = Field(default="", max_length=8)
    aliases: tuple[str, ...] = Field(default=(), max_length=40)

    @field_validator("instrumentId", "name", mode="before")
    @classmethod
    def normalize_text(cls, value: object) -> str:
        return _text(value)

    @field_validator("ticker", "providerSymbol", "exchange", "country", "currency", "isin", "lei", "edinetCode", mode="before")
    @classmethod
    def normalize_upper(cls, value: object) -> str:
        return _text(value).upper()

    @field_validator("market", mode="before")
    @classmethod
    def normalize_market(cls, value: object) -> MarketCode:
        return normalize_market_code(value, strict=True)

    @field_validator("ticker")
    @classmethod
    def validate_ticker(cls, value: str) -> str:
        if not _TICKER.fullmatch(value):
            raise ValueError("invalid_ticker")
        return value

    @field_validator("providerSymbol")
    @classmethod
    def validate_provider_symbol(cls, value: str) -> str:
        if value and not _TICKER.fullmatch(value):
            raise ValueError("invalid_provider_symbol")
        return value

    @field_validator("exchange")
    @classmethod
    def validate_exchange(cls, value: str) -> str:
        if value and not _EXCHANGE.fullmatch(value):
            raise ValueError("invalid_exchange")
        return value

    @field_validator("country")
    @classmethod
    def validate_country(cls, value: str) -> str:
        if value and value not in COUNTRY_CODES:
            raise ValueError("invalid_country")
        return value

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, value: str) -> str:
        if value and not re.fullmatch(r"[A-Z]{3}", value):
            raise ValueError("invalid_currency")
        return value

    @field_validator("isin")
    @classmethod
    def validate_isin(cls, value: str) -> str:
        if value and not _ISIN.fullmatch(value):
            raise ValueError("invalid_isin")
        return value

    @field_validator("lei")
    @classmethod
    def validate_lei(cls, value: str) -> str:
        if value and not _LEI.fullmatch(value):
            raise ValueError("invalid_lei")
        return value

    @field_validator("edinetCode")
    @classmethod
    def validate_edinet(cls, value: str) -> str:
        if value and not _EDINET.fullmatch(value):
            raise ValueError("invalid_edinet_code")
        return value

    @field_validator("cik", mode="before")
    @classmethod
    def normalize_cik(cls, value: object) -> str:
        text = _text(value)
        if not text:
            return ""
        if not text.isdigit() or len(text) > 10:
            raise ValueError("invalid_cik")
        return text.zfill(10)

    @field_validator("corpCode", mode="before")
    @classmethod
    def normalize_corp_code(cls, value: object) -> str:
        text = _text(value)
        if text and (not text.isdigit() or len(text) != 8):
            raise ValueError("invalid_corp_code")
        return text

    @field_validator("aliases", mode="before")
    @classmethod
    def normalize_aliases(cls, value: object) -> tuple[str, ...]:
        values = value if isinstance(value, (list, tuple)) else ()
        normalized = {_text(item) for item in values if _text(item)}
        if any(len(item) > 240 for item in normalized):
            raise ValueError("invalid_alias")
        return tuple(sorted(normalized, key=lambda item: (item.casefold(), item)))

    @model_validator(mode="after")
    def validate_market_dimensions(self):
        definition = MARKET_REGISTRY[self.market]
        if self.country and definition.countries and self.country not in definition.countries:
            raise ValueError("instrument_country_market_conflict")
        if self.currency and definition.currencies and self.currency not in definition.currencies:
            raise ValueError("instrument_currency_market_conflict")
        return self
