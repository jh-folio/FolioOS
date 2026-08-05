"""A single-market briefing must not cite another market's own coverage.

Every Korean market wrap opens with the overnight New York close, so body-based
inference labels "코스피 1.6% 반등 마감" as BOTH and it sailed through the US
scope filter into the 참고자료 — a US-briefing reader met a KOSPI headline and
trusted the report less. The headline is the article's own statement of what it
covers, so it decides which single-market pools the document may enter.
"""
from __future__ import annotations

import pytest

from features.daily_briefing.issue_selection import documents_for_scope, title_claims_other_market

KR_WRAP = {
    "title": "코스피, 1.6% 반등 6,300대 마감…코스닥 5.9% 급등(종합)",
    "content": "밤사이 뉴욕증시가 나스닥 중심으로 상승한 영향으로 반등 출발했다.",
}
KR_SIDECAR = {"title": "코스닥, 사상 첫 사흘 연속 매수 사이드카", "content": "뉴욕증시 훈풍에 급등했다."}
KR_STOCK = {"title": "SK하이닉스, 17년 만에 상한가", "content": "나스닥 반도체 급등 영향."}
KO_ABOUT_US = {"title": "뉴욕증시, 중동 갈등 완화 기대감에 상승 출발", "content": ""}
CROSS = {"title": "[마켓뷰] 美증시 훈풍·유가하락…코스피 다시 반등 시도하나", "content": ""}
GLOBAL_DOC = {"title": "Oil prices slide as Middle East tensions ease", "content": ""}
NO_SIGNAL = {"title": "Nvidia's next act", "content": "Wall Street awaits earnings."}
JP_WRAP = {"title": "도쿄증시 닛케이, 사상 최고치 경신", "content": "뉴욕 훈풍."}

DOCS = [KR_WRAP, KR_SIDECAR, KR_STOCK, KO_ABOUT_US, CROSS, GLOBAL_DOC, NO_SIGNAL, JP_WRAP]


def _titles(docs):
    return [doc["title"] for doc in docs]


def test_a_korean_market_wrap_stays_out_of_the_us_pool():
    kept = _titles(documents_for_scope(DOCS, "us"))
    assert KR_WRAP["title"] not in kept
    assert KR_SIDECAR["title"] not in kept
    assert KR_STOCK["title"] not in kept
    assert JP_WRAP["title"] not in kept


def test_a_korean_article_about_the_us_market_is_us_evidence():
    """Language is not market: Yonhap covering the NY close belongs in the US pool."""
    kept = _titles(documents_for_scope(DOCS, "us"))
    assert KO_ABOUT_US["title"] in kept
    assert NO_SIGNAL["title"] in kept


def test_global_evidence_enters_every_market():
    for scope in ("us", "kr", "europe", "jp"):
        assert GLOBAL_DOC["title"] in _titles(documents_for_scope(DOCS, scope))


def test_a_cross_market_headline_stays_where_its_focus_is():
    """"美증시 훈풍…코스피 반등 시도하나" is a KOSPI outlook piece: KR, not US."""
    assert CROSS["title"] in _titles(documents_for_scope(DOCS, "kr"))
    assert CROSS["title"] not in _titles(documents_for_scope(DOCS, "us"))


def test_the_kr_pool_is_unchanged_for_kr_coverage():
    kept = _titles(documents_for_scope(DOCS, "kr"))
    for doc in (KR_WRAP, KR_SIDECAR, KR_STOCK):
        assert doc["title"] in kept


def test_aggregate_scopes_keep_everything():
    """Each market leg narrows again on its own; the shared pool must not drop docs."""
    for scope in ("all", "both", "multi"):
        assert len(documents_for_scope(DOCS, scope)) == len(DOCS)


@pytest.mark.parametrize("doc,target,expected", [
    (KR_WRAP, "US", True),
    (KR_WRAP, "KR", False),
    (KO_ABOUT_US, "US", False),
    # "중동"이 GLOBAL 토큰이라 이 제목은 어느 시장도 배제하지 않는다. KR 풀 제외는
    # 주시장(US) 판정이 이미 담당하므로 title 게이트까지 막을 필요가 없다.
    (KO_ABOUT_US, "KR", False),
    (GLOBAL_DOC, "US", False),
    ({"title": ""}, "US", False),
    # 제목이 미국 기업 하나만 내세우면 그 기사는 미국 커버리지다.
    (NO_SIGNAL, "KR", True),
])
def test_title_claims_are_judged_from_the_headline_alone(doc, target, expected):
    assert title_claims_other_market(doc, target) is expected
