from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import assert_never


type JsonValue = None | bool | int | str | list[JsonValue] | dict[str, JsonValue]


@dataclass(frozen=True, slots=True)
class CanonicalizationError(Exception):
    reason: str

    def __str__(self) -> str:
        return self.reason


def _string(value: str) -> bytes:
    try:
        return json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    except UnicodeEncodeError as exc:
        raise CanonicalizationError(reason="invalid_unicode") from exc


def _canonicalize(value: JsonValue) -> bytes:
    match value:
        case None:
            return b"null"
        case bool() as boolean:
            return b"true" if boolean else b"false"
        case int() as integer:
            return str(integer).encode("ascii")
        case str() as string:
            return _string(string)
        case list() as values:
            return b"[" + b",".join(_canonicalize(item) for item in values) + b"]"
        case dict() as mapping:
            if not all(isinstance(key, str) for key in mapping):
                raise CanonicalizationError(reason="non_string_key")
            keys = sorted(mapping, key=lambda key: key.encode("utf-16-be", "surrogatepass"))
            pairs = (_string(key) + b":" + _canonicalize(mapping[key]) for key in keys)
            return b"{" + b",".join(pairs) + b"}"
        case unreachable:
            assert_never(unreachable)


def canonicalize(value: JsonValue) -> bytes:
    return _canonicalize(value)


def sha256_hex(value: JsonValue) -> str:
    return hashlib.sha256(canonicalize(value)).hexdigest()
