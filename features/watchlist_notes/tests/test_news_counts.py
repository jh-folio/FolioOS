"""워치리스트 카드의 `N건`이 무엇을 세는가."""
import features.watchlist_notes.service as svc


def doc(path, title, companies, date="2026-08-09"):
    return {
        "path": path, "title": title, "date": date, "source": "BBC", "type": "news",
        "url": "", "companies": companies, "sectors": [], "impactTags": [],
    }


def index(docs):
    return {"documents": docs}


AMD = {"name": "AMD", "ticker": "AMD"}
NVDA = {"name": "Nvidia", "ticker": "NVDA"}


def test_the_count_is_every_document_not_just_the_search_window(monkeypatch):
    """검색 상위 200건 안에서만 세어 AMD가 실제 295건인데 카드에 69건으로 나왔다."""
    docs = [doc(f"research-inbox/rss/{i}.md", f"AMD story {i}", [AMD]) for i in range(250)]

    hits, total, empty = svc.watchlist_news(index(docs), "AMD", 5)

    assert total == 250, "목록에 5개만 실어도 건수는 전체다"
    assert len(hits) == 5
    assert empty is False


def test_a_company_with_no_news_says_zero(monkeypatch):
    """Howmet Aerospace는 색인에 한 건도 없는데 카드가 107건이라고 했다.

    매칭이 0건이면 검색 결과 개수를 그대로 건수로 썼기 때문이다. 같은 항목의 상세
    화면은 0건이라고 해서, 두 화면이 같은 항목을 두고 다른 말을 했다.
    """
    called = []
    monkeypatch.setattr(
        "features.common.research_library.search.service.search_documents",
        lambda *a, **k: called.append(1) or [doc("p", "unrelated", [NVDA])] * 107,
    )
    docs = [doc(f"research-inbox/rss/{i}.md", f"Nvidia story {i}", [NVDA]) for i in range(107)]

    hits, total, empty = svc.watchlist_news(index(docs), "Howmet Aerospace", 5)

    assert (total, hits, empty) == (0, [], True)
    assert not called, "종목은 검색 결과로 건수를 채우지 않는다"


def test_a_theme_keyword_still_uses_search(monkeypatch):
    """테마("AI", "ETF")는 매칭할 회사가 없으므로 검색 결과가 곧 답이다."""
    found = [doc(f"research-inbox/rss/{i}.md", f"AI story {i}", []) for i in range(9)]
    monkeypatch.setattr(
        "features.common.research_library.search.service.search_documents",
        lambda *a, **k: found,
    )

    hits, total, empty = svc.watchlist_news(index([]), "AI", 5)

    assert (total, len(hits), empty) == (9, 5, False)


def test_the_newest_story_comes_first():
    """카드가 보여줄 것은 관련도 순위가 아니라 최신 소식이다."""
    docs = [
        doc("research-inbox/rss/a.md", "old", [AMD], date="2026-06-01"),
        doc("research-inbox/rss/b.md", "new", [AMD], date="2026-08-09"),
        doc("research-inbox/rss/c.md", "mid", [AMD], date="2026-07-01"),
    ]

    hits, _total, _empty = svc.watchlist_news(index(docs), "AMD", 3)

    assert [h["title"] for h in hits] == ["new", "mid", "old"]


def test_press_releases_are_not_watchlist_news():
    """보도자료는 뉴스 경로에서 빠진다(§10 RSS). 건수도 같은 기준이어야 한다."""
    docs = [
        doc("research-inbox/rss/a.md", "real", [AMD]),
        {**doc("research-inbox/rss/b.md", "wire", [AMD]), "sourceType": "press_release"},
    ]

    _hits, total, _empty = svc.watchlist_news(index(docs), "AMD", 5)

    assert total == 1


def test_the_card_and_the_detail_agree(monkeypatch):
    """같은 항목을 두 화면에서 보는 사용자가 어느 쪽을 믿을지 알 수 없으면 안 된다."""
    docs = [doc(f"research-inbox/rss/{i}.md", f"AMD story {i}", [AMD]) for i in range(40)]
    monkeypatch.setattr(svc, "get_watchlist", lambda *a, **k: ["AMD"])
    monkeypatch.setattr(
        "features.common.research_library.indexing.service.load_index", lambda: index(docs)
    )

    card = svc.watchlist_overview()["items"][0]
    detail = svc.watchlist_detail("AMD", limit=12)

    assert card["count"] == detail["newsCount"] == 40
    assert detail["shownCount"] == 12


def test_the_ticker_links_a_legal_name_to_its_articles():
    """워치리스트는 해석된 정식명을 저장하는데 기사에 붙은 회사는 짧은 이름이다.

    `ADVANCED MICRO DEVICES INC`와 `AMD`는 이름끼리 한 글자도 겹치지 않아, 이름만으로
    이으면 295건이 0건이 된다. 종목 코드가 가장 확실한 연결이다.
    """
    docs = [doc(f"research-inbox/rss/{i}.md", f"AMD story {i}", [AMD]) for i in range(12)]

    without = svc.watchlist_news(index(docs), "ADVANCED MICRO DEVICES INC", 5)[1]
    with_ticker = svc.watchlist_news(index(docs), "ADVANCED MICRO DEVICES INC", 5, ticker="AMD")[1]

    assert (without, with_ticker) == (0, 12)


def test_a_different_listing_of_the_same_company_still_matches_by_name():
    """도쿄 `6501.T`로 해석돼도 기사에는 미국 ADR `HTHIY`가 붙어 있다.

    코드가 다르면 이름이 받아야 한다 — 코드만 보면 히타치 기사가 사라진다.
    """
    adr = {"name": "HITACHI LTD", "ticker": "HTHIY"}
    docs = [doc("research-inbox/rss/a.md", "Hitachi results", [adr])]

    _hits, total, _empty = svc.watchlist_news(index(docs), "Hitachi, Ltd.", 5, ticker="6501.T")

    assert total == 1


def test_the_ticker_never_drags_in_a_company_that_is_not_there():
    docs = [doc("research-inbox/rss/a.md", "Nvidia story", [NVDA])]

    _hits, total, _empty = svc.watchlist_news(index(docs), "Howmet Aerospace", 5, ticker="HWM")

    assert total == 0
