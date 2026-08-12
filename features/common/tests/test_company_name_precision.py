"""흔한 명사 하나가 회사를 식별하면 안 된다.

실측: 색인 15,926건에서 `private`이 Private Bancorp of America를 2,620건(16.5%),
`research`가 Research Solutions를 1,002건(6.3%), `business`가 Business First Bancshares를
937건(5.9%), `innovation`이 Innovation Beverage Group을 889건(5.6%)에 붙였다.

독일어 기사의 "ein Business sind"와 내비게이션의 "Forschung + Innovation"이 종목이 됐고,
`infer_doc_markets`가 그 종목의 시장을 읽으므로 **독일어 기사 1,260건 중 1,247건이 `US`**로
찍혔다. 유럽·일본 브리핑이 자기 시장 자료를 못 찾은 뿌리가 이것이다.
"""
from __future__ import annotations

import pytest

from features.common.company_lookup import find_companies


def _tickers(text):
    return {row.get("ticker") for row in find_companies(text)}


@pytest.mark.parametrize(
    ("noun", "text"),
    [
        ("private", "The firm raised private capital for the fund"),
        ("research", "The Research Institute published its annual paper"),
        ("business", "Warum explizite Inhalte für Frauen ein Business sind"),
        ("innovation", "Forschung + Innovation Gadgets Medizin"),
        ("alternative", "Für Cafés gibt es kaum eine günstigere Alternative"),
    ],
)
def test_a_common_noun_alone_does_not_name_a_company(noun, text):
    """한 단어짜리 이름은 흔한 명사면 색인하지 않는다."""
    for ticker in _tickers(text):
        assert ticker not in {"PBAM", "RSSS", "RACC", "BFST", "IBG", "ALBC"}, noun


def test_a_two_word_name_still_matches_even_when_the_first_word_is_common():
    """흔한 명사 배제를 두 단어 이름에까지 적용하면 진짜 회사를 잃는다.

    구 자체가 이미 distinctive하다. 실제로 한 번 잃었다 — "Restaurant Brands"가 안 잡혔다.
    """
    assert "QSR" in _tickers("Restaurant Brands International said sales rose")


def test_the_second_word_is_required_not_just_the_first():
    """"Business First Bancshares"는 "Business"만으로 걸리면 안 된다."""
    assert "BFST" not in _tickers("ein Business sind America First")
    assert "BFST" in _tickers("Business First Bancshares reported quarterly results")


def test_a_genuine_single_word_name_still_matches():
    assert "SBUX" in _tickers("Starbucks reported record China sales")


def test_well_known_companies_are_unaffected():
    assert {"NVDA", "MSFT"} <= _tickers("Nvidia and Microsoft led the Nasdaq higher")
    assert {"005930", "000660"} <= _tickers("삼성전자와 SK하이닉스가 반도체 업황에 힘입어 상승")


def test_a_page_of_foreign_navigation_text_stays_almost_empty():
    """수집된 독일 기사 본문에서 실제로 걸렸던 문장들.

    9건이 붙던 것이 실제 언급 하나(Starbucks)만 남아야 한다.
    """
    junk = (
        "Warum explizite Inhalte für Frauen ein Business sind America First "
        "Forschung + Innovation Research Institute günstigere Alternative "
        "wie etwa Starbucks Politik Deutschland Konjunktur International"
    )

    tickers = _tickers(junk)

    assert tickers <= {"SBUX"}, f"오탐이 남았다: {sorted(tickers - {'SBUX'})}"
