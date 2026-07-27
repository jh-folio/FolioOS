from __future__ import annotations

from features.common.jcs import canonicalize, sha256_hex


def test_canonicalize_uses_utf16_key_order_and_minimal_json() -> None:
    given_value = {"😀": 4, "€": 3, "ö": 2, "a": 1}

    when_canonical = canonicalize(given_value)

    assert when_canonical == '{"a":1,"ö":2,"€":3,"😀":4}'.encode()


def test_sha256_hex_is_stable_across_mapping_insertion_order() -> None:
    given_left = {"schemaVersion": 1, "nested": {"b": True, "a": None}}
    given_right = {"nested": {"a": None, "b": True}, "schemaVersion": 1}

    when_left = sha256_hex(given_left)
    when_right = sha256_hex(given_right)

    assert when_left == when_right
    assert len(when_left) == 64
