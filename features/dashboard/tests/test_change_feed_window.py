"""The visible change feed shows current changes, not an unbounded history.

Two accumulation warts surfaced with real data. Rows older than the window kept
rendering as "changes" in quiet weeks, and the 0.4→0.5 id change left aggregate
rows (`2026-08-05`) sitting beside the per-market rows (`2026-08-05.us`) of the
same date forever — the same briefing looked duplicated. Authority stores and
the index itself keep every row; only the feed projection narrows.
"""
from __future__ import annotations

from features.dashboard.service import CHANGE_FEED_WINDOW_DAYS, _current_change_events

NOW = "2026-08-05T12:00:00+00:00"


def _event(artifact_id, generated_at, kind="briefing", status="developing_signal"):
    return {"artifactKind": kind, "artifactId": artifact_id, "generatedAt": generated_at, "status": status}


def test_events_older_than_the_window_leave_the_feed():
    events = [
        _event("2026-08-05.us", "2026-08-05T10:00:00+00:00"),
        _event("2026-07-01.us", "2026-07-01T10:00:00+00:00"),
    ]
    kept = _current_change_events(events, now=NOW)
    assert [row["artifactId"] for row in kept] == ["2026-08-05.us"]
    assert CHANGE_FEED_WINDOW_DAYS == 14


def test_a_superseded_aggregate_row_yields_to_the_per_market_rows():
    events = [
        _event("2026-08-05.us", "2026-08-05T11:00:00+00:00"),
        _event("2026-08-05.kr", "2026-08-05T11:00:00+00:00"),
        _event("2026-08-05", "2026-08-05T08:00:00+00:00"),
    ]
    kept = _current_change_events(events, now=NOW)
    assert sorted(row["artifactId"] for row in kept) == ["2026-08-05.kr", "2026-08-05.us"]


def test_an_aggregate_row_with_no_market_rows_still_shows():
    """Legacy `both` briefings only ever commit the aggregate id."""
    events = [_event("2026-08-04", "2026-08-04T08:00:00+00:00")]
    assert [row["artifactId"] for row in _current_change_events(events, now=NOW)] == ["2026-08-04"]


def test_another_dates_market_rows_do_not_suppress_this_dates_aggregate():
    events = [
        _event("2026-08-05.us", "2026-08-05T11:00:00+00:00"),
        _event("2026-08-04", "2026-08-04T08:00:00+00:00"),
    ]
    kept = _current_change_events(events, now=NOW)
    assert sorted(row["artifactId"] for row in kept) == ["2026-08-04", "2026-08-05.us"]


def test_non_briefing_artifacts_are_never_treated_as_aggregates():
    events = [
        _event("NVDA:2026-08-05", "2026-08-05T09:00:00+00:00", kind="company_analysis"),
        _event("2026-08-05.us", "2026-08-05T11:00:00+00:00"),
    ]
    assert len(_current_change_events(events, now=NOW)) == 2


def test_an_unreadable_timestamp_is_kept_rather_than_guessed_old():
    events = [_event("2026-08-05.us", "not-a-date")]
    assert len(_current_change_events(events, now=NOW)) == 1
