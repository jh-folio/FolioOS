from features.market_memory.digest import build_rss_digest, promote_digest_items


def test_build_rss_digest_clusters_ai_semiconductor_items():
    items = [
        {"title": "Nvidia suppliers rise on AI server demand", "description": "HBM and GPU supply chain", "media": "Reuters", "timestamp": "2026-07-02 08:00:00", "url": "https://a.example/1"},
        {"title": "SK hynix HBM demand strengthens", "description": "AI chips and memory", "media": "Bloomberg", "timestamp": "2026-07-02 08:10:00", "url": "https://a.example/2"},
        {"title": "Oil edges lower", "description": "crude market waits", "media": "Reuters", "timestamp": "2026-07-02 08:20:00", "url": "https://a.example/3"},
    ]
    digest = build_rss_digest(items)
    ai = [item for item in digest if item["stateKey"] == "ai_semiconductor_supply_chain"][0]
    assert ai["sourceCount"] == 2
    assert sorted(ai["publishers"]) == ["Bloomberg", "Reuters"]
    assert ai["promotionCandidate"] is True


def test_promote_digest_items_requires_repeated_signal():
    digest = [
        {
            "stateKey": "ai_semiconductor_supply_chain",
            "stateLabel": "AI 반도체 공급망",
            "summary": "AI 반도체 공급망 관련 신호가 복수 출처에서 반복됐다.",
            "sourceCount": 2,
            "publishers": ["Reuters", "Bloomberg"],
            "sources": [{"title": "A", "source": "Reuters"}, {"title": "B", "source": "Bloomberg"}],
            "promotionCandidate": True,
        },
        {
            "stateKey": "middle_east_energy_risk",
            "stateLabel": "중동 에너지 리스크",
            "summary": "단일 기사성 유가 움직임.",
            "sourceCount": 1,
            "publishers": ["Reuters"],
            "sources": [{"title": "C", "source": "Reuters"}],
            "promotionCandidate": False,
        },
    ]
    promoted = promote_digest_items(digest, date="2026-07-02")
    assert len(promoted) == 1
    assert promoted[0]["stateKey"] == "ai_semiconductor_supply_chain"
    assert promoted[0]["entryMode"] == "issue"
