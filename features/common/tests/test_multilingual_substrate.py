"""Task 1.3b — the multilingual substrate decided in Task 0.4.

The gate for this work is that Korean and English behaviour does not move. The
existing corpus is 62% Korean, and search ranking is what users already have.
"""
from __future__ import annotations

import pathlib
import re
import tempfile

from features.common.research_library.indexing.research_index import hybrid_search, sync_index
from features.common.text.tokenize import fold_accents, has_cjk, token_set, tokens, word_count

LEGACY_TOKEN_RE = re.compile(r"[A-Za-z0-9가-힣]{2,}")

KOREAN = [
    "삼성전자, 2분기 영업이익 10조원 돌파…반도체 회복 본격화",
    "코스피 2900선 회복…외국인 순매수 전환",
    "SK하이닉스 HBM 공급 확대, 엔비디아向 물량 두 배로",
    "한국은행 기준금리 동결…성장률 전망 하향",
    "원달러 환율 1370원대…수출기업 실적 개선 기대",
]
ENGLISH = [
    "Nvidia beats earnings estimates as data center revenue surges",
    "Fed holds rates steady, signals caution on inflation outlook",
    "S&P 500 closes at record high on tech rally",
]
JAPANESE = [
    "日経平均、半導体株高で反発　終値は3万9000円台",
    "トヨタ自動車の営業利益が過去最高を更新",
    "円安進行、1ドル155円台に　輸出企業に追い風",
]


def test_korean_and_english_tokens_are_byte_identical_to_the_legacy_regex():
    """The whole substrate change is only safe if these two do not move."""
    for text in KOREAN + ENGLISH:
        assert tokens(text) == LEGACY_TOKEN_RE.findall(text), text


def test_hangul_is_not_glued_to_an_adjacent_han_character():
    """Korean copy abbreviates with Han characters; `엔비디아向` must still split.

    Merging Hangul and CJK into one character class would make this one token and
    break a search for `엔비디아` on the existing corpus.
    """
    assert "엔비디아" in tokens("SK하이닉스 HBM 공급 확대, 엔비디아向 물량 두 배로")


def test_accent_folding_applies_to_latin_only():
    """NFD folding is destructive to the other two scripts if applied blindly."""
    # 유럽어: 악센트가 떨어져 단어가 온전히 남는다.
    assert "Telefonica" in tokens("Telefónica reduce su deuda")
    assert "erhalt" in tokens("Siemens erhält Großauftrag")
    assert "Grossauftrag" in tokens("Siemens erhält Großauftrag")

    # 한글: 자모로 분해되면 토큰이 사라진다.
    assert fold_accents("삼성전자") == "삼성전자"
    # 일본어 탁점은 악센트가 아니다. 떼면 `で`가 `て`라는 다른 글자가 된다.
    assert fold_accents("半導体株高で反発") == "半導体株高で反発"
    assert "が" in fold_accents("営業利益が過去最高を更新")


def test_japanese_produces_tokens_and_distinct_dedupe_keys():
    """15 of 20 Japanese headlines used to yield zero tokens, collapsing to 6 keys."""
    keys = set()
    for text in JAPANESE:
        assert tokens(text), text
        keys.add(tuple(sorted(token_set(text))))
    assert len(keys) == len(JAPANESE)


def test_has_cjk_excludes_hangul():
    """Korean must not be routed down the CJK search path; it already tokenizes."""
    assert has_cjk("日経平均")
    assert has_cjk("トヨタ")
    assert not has_cjk("삼성전자 영업이익")
    assert not has_cjk("Nvidia revenue")


def test_word_count_counts_all_three_scripts():
    assert word_count("Nvidia beats earnings") == 3
    assert word_count("삼성전자 영업이익 돌파") == 3
    assert word_count("日経平均") == 1


def _build_index(tmp_path: pathlib.Path):
    docs = []
    for group, items in (("ko", KOREAN), ("en", ENGLISH), ("ja", JAPANESE)):
        for idx, title in enumerate(items):
            docs.append({
                "id": f"{group}-{idx}", "path": f"/x/{group}-{idx}.md", "title": title,
                "source": group, "date": "2026-08-04", "type": "rss",
                "url": f"https://example.com/{group}/{idx}", "marketRelevance": 1.0, "content": title,
            })
    db = tmp_path / "index.sqlite3"
    sync_index(db, {"documents": docs})
    return db


def test_japanese_search_finds_substrings_including_one_and_two_character_queries():
    """unicode61 treats a Japanese clause as a single token, so partials missed.

    trigram alone cannot replace it — it matches nothing under three characters,
    which would kill Korean 2-character financial terms. The auxiliary index plus
    a LIKE path covers Japanese without touching the primary index.
    """
    with tempfile.TemporaryDirectory() as raw:
        db = _build_index(pathlib.Path(raw))
        for query in ("半導体", "営業利益", "円安", "株", "トヨタ"):
            assert hybrid_search(db, query, limit=50), query


def test_korean_and_english_search_is_unchanged_by_the_cjk_path():
    """Latin/Hangul queries must not enter the LIKE path — it has no word boundaries.

    `AI` would otherwise match inside `capital` and `chain`.
    """
    with tempfile.TemporaryDirectory() as raw:
        db = _build_index(pathlib.Path(raw))
        assert len(hybrid_search(db, "환율", limit=50)) == 1
        assert len(hybrid_search(db, "반도체", limit=50)) == 1
        assert len(hybrid_search(db, "revenue", limit=50)) == 1
        # 라틴 2자 질의가 부분문자열로 번지지 않는다.
        assert len(hybrid_search(db, "AI", limit=50)) <= 1
