import pytest

from features.pixel_office.schema import OBJECT_ORDER, validate_pixel_office_payload


def _payload():
    return {
        "version": 1,
        "generatedAt": "2026-07-28T12:00:00+09:00",
        "objects": [
            {
                "id": object_id,
                "state": "empty",
                "summary": "",
                "count": 0,
                "asOf": "",
                "stale": False,
                "notice": "",
            }
            for object_id in OBJECT_ORDER
        ],
        "agent": {
            "attentionCount": 0,
            "latestJobId": "",
            "latestJobStatus": "",
        },
    }


def test_schema_accepts_complete_allowlisted_payload():
    assert validate_pixel_office_payload(_payload())["version"] == 1


def test_schema_rejects_unknown_object_fields():
    payload = _payload()
    payload["objects"][0]["traceback"] = "private stack"
    with pytest.raises(ValueError):
        validate_pixel_office_payload(payload)


def test_schema_rejects_inconsistent_stale_state():
    payload = _payload()
    payload["objects"][0]["state"] = "stale"
    with pytest.raises(ValueError):
        validate_pixel_office_payload(payload)
