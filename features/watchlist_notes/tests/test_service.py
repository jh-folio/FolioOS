

def test_overview_count_is_total_matches_not_preview_length():
    """카드 건수가 미리보기 개수(limit_per_item)로 고정되면 모든 종목이 같은 숫자를 보인다."""
    import inspect

    from features.watchlist_notes import service

    assert service.WATCHLIST_MATCH_SCAN_LIMIT > 5
    source = inspect.getsource(service.watchlist_overview)
    assert '"count": match_count' in source
    assert '"count": len(hits)' not in source
