from __future__ import annotations

import json
import math
from decimal import Decimal
from typing import TypeAlias, assert_never

JsonScalar: TypeAlias = str | int | float | bool | None
JsonValue: TypeAlias = JsonScalar | list["JsonValue"] | dict[str, "JsonValue"]


def _utf16_sort_key(value: str) -> bytes:
    return value.encode("utf-16be", errors="surrogatepass")


def _serialize_float(value: float) -> str:
    if not math.isfinite(value):
        msg = "canonical JSON rejects non-finite numbers"
        raise ValueError(msg)
    if value == 0:
        return "0"
    magnitude = abs(value)
    raw = repr(value).lower()
    if 1e-6 <= magnitude < 1e21:
        fixed = format(Decimal(raw), "f")
        return fixed.rstrip("0").rstrip(".") if "." in fixed else fixed
    if "e" not in raw:
        return raw
    mantissa, exponent_text = raw.split("e", maxsplit=1)
    exponent = int(exponent_text)
    normalized_mantissa = mantissa.rstrip("0").rstrip(".")
    sign = "+" if exponent >= 0 else "-"
    return f"{normalized_mantissa}e{sign}{abs(exponent)}"


def _serialize(value: JsonValue) -> str:
    match value:
        case None:
            return "null"
        case bool() as boolean:
            return "true" if boolean else "false"
        case int() as integer:
            return str(integer)
        case float() as number:
            return _serialize_float(number)
        case str() as text:
            return json.dumps(text, ensure_ascii=False, separators=(",", ":"))
        case list() as items:
            return "[" + ",".join(_serialize(item) for item in items) + "]"
        case dict() as mapping:
            if not all(isinstance(key, str) for key in mapping):
                msg = "canonical JSON object keys must be strings"
                raise TypeError(msg)
            pairs = (
                json.dumps(key, ensure_ascii=False, separators=(",", ":"))
                + ":"
                + _serialize(mapping[key])
                for key in sorted(mapping, key=_utf16_sort_key)
            )
            return "{" + ",".join(pairs) + "}"
        case unreachable:
            assert_never(unreachable)


def canonical_json_bytes(value: JsonValue) -> bytes:
    return _serialize(value).encode("utf-8")
