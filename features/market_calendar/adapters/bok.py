from features.market_calendar.schema import normalize_event


def normalize_bok_events(rows: list[dict]) -> list[dict]:
    return [normalize_event({**row, "kind": "central_bank", "provider": "bok", "source": row.get("source") or "Bank of Korea", "status": row.get("status") or "confirmed"}) for row in rows if isinstance(row, dict)]
