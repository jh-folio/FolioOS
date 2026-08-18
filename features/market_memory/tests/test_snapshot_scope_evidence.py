"""시장별 스냅샷의 근거 풀 — 그 시장 창을 따로 받고, 얇으면 그렇게 말한다.

시장 무관 최신 120건에서 뽑고 뒤에서 거르면 남는 것은 피드 분포다(JP 피드 3개).
EUROPE/JP는 GLOBAL만 남아 근거 없는 시장 판단이 조용히 나갔다.
"""
import features.common.research_library.rss.service as rss_service
from features.market_memory.snapshot import RSS_CANDIDATE_MIN, build_market_state_context


def _item(filename, title, markets, timestamp_sort, media="Reuters"):
    return {
        "filename": filename,
        "title": title,
        "media": media,
        "description": title,
        "timestamp": timestamp_sort,
        "timestampSort": timestamp_sort,
        "url": f"https://example.com/{filename}",
        "normalizedUrl": f"https://example.com/{filename}",
        "markets": markets,
    }


def _stub_payloads(monkeypatch, by_market):
    """market 파라미터별 응답을 돌려주는 stub. 실제 질의 인자를 기록한다."""
    calls = []

    def fake_payload(qs):
        market = (qs.get("market") or [""])[0]
        calls.append(qs)
        return {"items": list(by_market.get(market, []))}

    monkeypatch.setattr(rss_service, "rss_feed_payload", fake_payload)
    return calls


def test_europe_scope_queries_the_market_window_and_global(monkeypatch):
    calls = _stub_payloads(monkeypatch, {
        "EUROPE": [
            _item("eu-1.md", "DAX slips after ECB comments", ["EUROPE"], "2026-08-18T09:00:00"),
            _item("both-1.md", "Oil shock hits European refiners", ["EUROPE", "GLOBAL"], "2026-08-18T07:00:00"),
        ],
        "GLOBAL": [
            _item("both-1.md", "Oil shock hits European refiners", ["EUROPE", "GLOBAL"], "2026-08-18T07:00:00"),
            _item("g-1.md", "Oil and dollar shape global risk", ["GLOBAL"], "2026-08-18T08:00:00"),
        ],
        "": [_item("us-1.md", "S&P 500 futures rise", ["US"], "2026-08-18T10:00:00")],
    })

    context = build_market_state_context(
        market_scope="europe",
        market_tape={},
        macro_snapshot={},
        states=[],
    )

    assert [(call.get("market") or [""])[0] for call in calls] == ["EUROPE", "GLOBAL"]
    # 시장 무관 창은 부르지 않는다. 그 창이 곧 고갈의 원인이었다.
    assert all((call.get("market") or [""])[0] for call in calls)
    titles = [item["title"] for item in context["rssCandidates"]]
    # 중복 제거 후 최신순. 두 창을 이어 붙이면 GLOBAL이 통째로 뒤로 밀린다.
    assert titles == [
        "DAX slips after ECB comments",
        "Oil and dollar shape global risk",
        "Oil shock hits European refiners",
    ]


def test_jp_scope_keeps_japan_evidence_even_when_global_dominates(monkeypatch):
    global_items = [
        _item(f"g-{index}.md", f"Global story {index}", ["GLOBAL"], f"2026-08-18T{index:02d}:00:00")
        for index in range(1, 13)
    ]
    _stub_payloads(monkeypatch, {
        "JP": [_item("jp-1.md", "닛케이 반도체주 상승", ["JP"], "2026-08-18T23:00:00")],
        "GLOBAL": global_items,
    })

    context = build_market_state_context(
        market_scope="jp",
        market_tape={},
        macro_snapshot={},
        states=[],
    )

    assert context["rssCandidates"][0]["title"] == "닛케이 반도체주 상승"
    assert len(context["rssCandidates"]) == 13


def test_overall_scope_keeps_the_broad_window(monkeypatch):
    calls = _stub_payloads(monkeypatch, {
        "": [_item("us-1.md", "S&P 500 futures rise", ["US"], "2026-08-18T10:00:00")],
    })

    context = build_market_state_context(
        market_scope="overall",
        market_tape={},
        macro_snapshot={},
        states=[],
    )

    assert len(calls) == 1
    assert not (calls[0].get("market") or [""])[0]
    assert [item["title"] for item in context["rssCandidates"]] == ["S&P 500 futures rise"]


def test_thin_evidence_is_declared_in_the_context(monkeypatch):
    """근거가 없어도 모델은 그 사실을 모른 채 시장 판단을 쓴다."""
    _stub_payloads(monkeypatch, {
        "EUROPE": [],
        "GLOBAL": [_item("g-1.md", "Oil and dollar shape global risk", ["GLOBAL"], "2026-08-18T08:00:00")],
    })

    context = build_market_state_context(
        market_scope="europe",
        market_tape={},
        macro_snapshot={},
        states=[],
    )

    coverage = context["evidenceCoverage"]
    assert coverage["status"] == "sparse"
    assert coverage["rssCandidateCount"] == 1
    assert coverage["minimumExpected"] == RSS_CANDIDATE_MIN
    assert coverage["warnings"]
    # 경고는 컨텍스트 구석이 아니라 프롬프트가 먼저 읽는 instruction 안에 있어야 한다.
    assert "below 8" in context["instruction"]


def test_sufficient_evidence_leaves_no_warning(monkeypatch):
    _stub_payloads(monkeypatch, {
        "US": [
            _item(f"us-{index}.md", f"US story {index}", ["US"], f"2026-08-18T{index:02d}:00:00")
            for index in range(1, 10)
        ],
        "GLOBAL": [],
    })

    context = build_market_state_context(
        market_scope="us",
        market_tape={},
        macro_snapshot={},
        states=[],
    )

    assert context["evidenceCoverage"]["status"] == "sufficient"
    assert context["evidenceCoverage"]["warnings"] == []
    assert "below" not in context["instruction"]
