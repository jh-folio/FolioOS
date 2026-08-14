"""재태깅은 "못 읽었다"를 "아무 시장도 아니다"로 바꾸지 않는다.

`UNKNOWN`은 어느 브리핑 풀에도 들어가지 않으므로, 구체적인 시장 태그를 `UNKNOWN`으로
덮으면 그 기사가 모든 브리핑에서 사라진다. 표의 한계가 자료의 결론이 되면 안 된다.

실측(2026-08-13): Reuters `summary_only` 121건이 `US -> UNKNOWN`으로 걸렸다.
"American Airlines shakes up leadership", "Fitch keeps United States at 'AA+'" —
명백한 미국 기사인데 `company_master.json`에 American Airlines가 없고 `US_TOKENS`에
`united states`·`u.s.`가 없어 신호가 잡히지 않는다.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[5]
if str(ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(ROOT / "scripts"))

import retag_rss_markets as retag  # noqa: E402

# Reuters는 `default_market: GLOBAL`을 선언한다. 신호가 없으면 예전에는 GLOBAL이 됐다.
REUTERS = {"source": "Reuters", "title": "American Airlines shakes up leadership as CEO faces pressure"}


def _resolve(meta, body, stored):
    return retag.resolved_markets(meta, body, stored)


@pytest.mark.parametrize("stored", [["US"], ["KR"], ["EUROPE"], ["JP"], ["US", "KR", "GLOBAL"]])
def test_a_concrete_tag_survives_when_the_tables_cannot_read_the_article(stored):
    assert _resolve(REUTERS, "", stored) == stored


def test_a_feed_hint_global_is_the_one_case_that_drops_to_unknown():
    """신호가 하나도 없는데 GLOBAL이었던 유일한 이유가 피드 선언이다."""
    assert _resolve(REUTERS, "", ["GLOBAL"]) == ["UNKNOWN"]


def test_an_article_that_still_reads_as_global_keeps_global():
    """유가·중동 기사는 계속 GLOBAL이다. 막은 것은 fallback이지 추론이 아니다."""
    doc = {"source": "Reuters", "title": "Oil climbs as Middle East supply chain risks mount"}

    assert "GLOBAL" in _resolve(doc, "", ["GLOBAL"])


def test_a_readable_article_is_still_retagged():
    """읽히는 기사는 그대로 다시 계산한다 — 이 스크립트의 본래 목적이다."""
    doc = {"source": "Handelsblatt", "title": "Dax und Euro legen zu, EZB im Fokus"}

    assert _resolve(doc, "", ["US"]) != ["US"]


def test_a_file_with_no_stored_tag_is_not_forced_to_keep_nothing():
    """저장값이 없으면 지킬 것도 없다. 계산 결과를 그대로 쓴다."""
    assert _resolve(REUTERS, "", []) == ["UNKNOWN"]
