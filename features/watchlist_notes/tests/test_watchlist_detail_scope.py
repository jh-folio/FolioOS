import sys
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.watchlist_notes import service


def _patched(docs):
    """종목 매칭은 색인에서, 테마는 검색에서 온다. 같은 문서를 양쪽에 둔다.

    실제 뉴스 문서는 항상 inbox 경로를 갖는다(`is_news_document`가 그것으로 가린다).
    """
    indexed = [{"path": f"research-inbox/rss/{i}.md", **doc} for i, doc in enumerate(docs)]
    return (
        patch("features.common.research_library.indexing.service.load_index", return_value={"documents": indexed}),
        patch("features.common.research_library.search.service.search_documents", return_value=indexed),
    )


def test_company_item_drops_news_that_never_mentions_it():
    """종목 카드에 무관한 기업 기사가 실리던 원인은 매칭 실패 시의 fallback이었다.

    검색은 본문 유사도로 후보를 넓게 잡는다. 회사 매칭이 0건일 때 예전에는 그
    후보 앞부분을 그대로 종목 뉴스로 내보내, "NVDA" 카드에 다른 기업 기사가 실렸다.
    """
    unrelated = {
        "title": "Ford recalls trucks", "source": "Local", "date": "2026-06-24",
        "companies": [{"name": "Ford", "ticker": "F"}],
    }
    load_index, search = _patched([unrelated])
    with load_index, search:
        detail = service.watchlist_detail("NVDA", limit=5)

    assert detail["news"] == []
    assert detail["newsCount"] == 0
    assert "no_company_matched_news" in detail["warnings"]


def test_theme_item_keeps_search_results_because_it_has_no_company_to_match():
    """테마 항목은 매칭할 회사가 없으므로 검색 결과가 곧 답이다."""
    doc = {"title": "AI supply chain update", "source": "Local", "date": "2026-06-24", "companies": []}
    load_index, search = _patched([doc])
    with load_index, search:
        detail = service.watchlist_detail("AI", limit=5)

    assert detail["newsCount"] == 1
    assert "no_company_matched_news" not in detail["warnings"]


def test_company_item_keeps_news_that_does_mention_it():
    doc = {
        "title": "Nvidia raises guidance", "source": "Local", "date": "2026-06-24",
        "companies": [{"name": "NVIDIA", "ticker": "NVDA"}],
    }
    load_index, search = _patched([doc])
    with load_index, search:
        detail = service.watchlist_detail("NVDA", limit=5)

    assert detail["newsCount"] == 1
    assert "no_company_matched_news" not in detail["warnings"]
