"""워치리스트 항목이 어떤 회사를 가리키는지 판정하는 규칙."""
import pytest

from features.watchlist_notes.service import _item_matches_company


def company(name: str, ticker: str = "", **extra) -> dict:
    return {"name": name, "ticker": ticker, **extra}


@pytest.mark.parametrize(
    "query, entry",
    [
        ("Hitachi, Ltd.", company("Hitachi, Ltd.", "6501.T")),
        ("Nintendo Co., Ltd.", company("Nintendo Co., Ltd.", "7974.T")),
        ("Nintendo", company("Nintendo Co., Ltd.", "7974.T")),
        ("Sony Group Corporation", company("Sony", "6758.T")),
        ("Micron Technology", company("Micron Technology, Inc.", "MU")),
        ("三菱UFJフィナンシャル・グループ", company("三菱UFJフィナンシャル・グループ", "8306.T")),
        ("AMD", company("Advanced Micro Devices", "AMD")),
        ("TEN", company("TEN", "TEN")),
        # 인덱스에는 줄인 표기가 들어 있는 경우가 많다.
        ("Howmet Aerospace", company("Howmet", "HWM")),
    ],
)
def test_the_company_it_actually_names(query, entry):
    assert _item_matches_company(query, entry) is True


@pytest.mark.parametrize(
    "query, entry, why",
    [
        ("Nintendo Co., Ltd.", company("TEN", "TEN"), "ni**nten**do 안에 우연히 들어간 이름"),
        ("Ltd.", company("Micware Co., Ltd.", "MWC"), "법인 형태만 남은 항목은 회사가 아니다"),
        ("Co., Ltd.", company("Sony", "6758.T"), "형태 표기끼리는 서로를 가리키지 않는다"),
        ("Sony Group Corporation", company("SO", "SO"), "두 글자 이름이 긴 이름 안에 들어간 경우"),
        ("Advanced Micro Devices", company("Vance", "VNC"), "ad**vance**d 안에 들어간 낱말 조각"),
    ],
)
def test_names_that_only_look_alike(query, entry, why):
    assert _item_matches_company(query, entry) is False, why


def test_an_exact_ticker_still_wins():
    """티커를 그대로 적었으면 이름이 달라도 그 회사다."""
    assert _item_matches_company("6501.T", company("Hitachi, Ltd.", "6501.T")) is True


def test_a_legal_form_alone_names_no_company():
    """`Ltd.`에 아무 회사나 붙이지 않는다 — 실제로 Nvidia가 붙었다."""
    from features.watchlist_notes.service import resolve_watchlist_company

    assert resolve_watchlist_company("Ltd.") == {}
    assert resolve_watchlist_company("Co., Ltd.") == {}
