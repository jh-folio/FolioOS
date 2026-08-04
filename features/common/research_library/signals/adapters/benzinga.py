"""Benzinga official public RSS adapter."""
from __future__ import annotations

from .generic_rss import fetch_feed


def fetch_benzinga(feed_url: str, *, previous: dict | None = None):
    return fetch_feed(
        feed_url,
        provider="benzinga",
        previous=previous,
        allowed_hosts=("benzinga.com",),
        reliability_tier=3,
        markets=["US"],
    )
