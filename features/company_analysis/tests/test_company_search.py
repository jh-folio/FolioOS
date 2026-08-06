"""회사 자료는 그 회사의 모든 표기로 찾아야 한다.

원문 문자열 하나로 찾던 시절 `NVDA` 검색 30건 중 회사가 실제로 언급된 것은 5건이었고,
나머지 25칸은 Caterpillar·Spotify 같은 무관한 기사였다. 그 안에서 근거를 골라
NVDA 보고서에 LATAM 항공 실적이 올라왔다.
"""
from __future__ import annotations

from features.company_analysis.company_search import company_search_terms, search_company_documents


NVDA = {"ticker": "NVDA", "name": "NVIDIA CORP", "market": "US"}


def test_terms_include_the_ticker_the_name_and_korean_spellings():
    terms = company_search_terms(NVDA, "NVDA")
    lowered = {t.lower() for t in terms}
    assert "nvda" in lowered
    assert "nvidia corp" in lowered
    # 수동 사전의 별칭이 한국 사용자가 실제로 치는 표기를 담는다.
    assert "엔비디아" in terms


def test_a_single_letter_is_not_used_as_a_term():
    """한 글자짜리 표기는 아무 문서에나 걸린다."""
    assert "A" not in company_search_terms({"ticker": "A", "name": "Agilent"}, "A")


def test_documents_matched_by_more_terms_rank_higher():
    """여러 표기에서 나온 문서일수록 이 회사와 가깝다."""
    pages = {
        "NVDA": [{"path": "both.md"}, {"path": "only-ticker.md"}],
        "NVIDIA CORP": [{"path": "only-name.md"}, {"path": "both.md"}],
    }

    def fake_search(_index, query="", company="", limit=30):
        return pages.get(query, [])

    docs = search_company_documents(None, fake_search, {"ticker": "NVDA", "name": "NVIDIA CORP"}, "NVDA", limit=10)
    assert [d["path"] for d in docs][0] == "both.md"
    assert {d["path"] for d in docs} == {"both.md", "only-ticker.md", "only-name.md"}


def test_the_same_document_is_never_returned_twice():
    def fake_search(_index, query="", company="", limit=30):
        return [{"path": "same.md"}]

    docs = search_company_documents(None, fake_search, NVDA, "NVDA", limit=10)
    assert [d["path"] for d in docs] == ["same.md"]


def test_no_terms_means_no_search():
    calls = []

    def fake_search(_index, query="", company="", limit=30):
        calls.append(query)
        return []

    assert search_company_documents(None, fake_search, {}, "", limit=10) == []
    assert calls == []


def test_the_limit_is_respected_after_merging():
    def fake_search(_index, query="", company="", limit=30):
        return [{"path": f"{query}-{i}.md"} for i in range(20)]

    docs = search_company_documents(None, fake_search, NVDA, "NVDA", limit=5)
    assert len(docs) == 5
