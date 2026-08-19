import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.market_memory.snapshot import scrub_inline_refs

LOOKUP = {
    "rss:item:13": {"id": "rss:item:13", "source": "Bloomberg"},
    "rss:item:76": {"id": "rss:item:76", "source": "Reuters"},
    "rss:item:104": {"id": "rss:item:104", "source": "Reuters"},
}


def test_known_reference_becomes_the_publisher_name():
    text = "샌디스크 등 후속 실적 발표 종목의 주가 방향 (rss:item:13)"
    assert scrub_inline_refs(text, LOOKUP) == "샌디스크 등 후속 실적 발표 종목의 주가 방향 (Bloomberg)"


def test_repeated_publisher_is_named_once():
    text = "지멘스에너지 이익 3배·수주 사상 최대(rss:item:76, rss:item:104)."
    assert scrub_inline_refs(text, LOOKUP) == "지멘스에너지 이익 3배·수주 사상 최대 (Reuters)."


def test_unknown_reference_is_removed_not_shown():
    """rss:item:23은 사용자에게 출처가 아니라 새는 내부 구현이다."""
    text = "미 10년물이 4.6%대를 유지하는지 (rss:item:23)"
    assert scrub_inline_refs(text, LOOKUP) == "미 10년물이 4.6%대를 유지하는지"


def test_structured_ids_are_left_alone():
    payload = {
        "id": "rss:item:1",
        "sourceRefs": [{"id": "rss:item:13", "source": "Bloomberg"}],
        "summary": "가격이 올랐다 (rss:item:13).",
    }
    out = scrub_inline_refs(payload, LOOKUP)
    assert out["id"] == "rss:item:1"
    assert out["sourceRefs"] == [{"id": "rss:item:13", "source": "Bloomberg"}]
    assert out["summary"] == "가격이 올랐다 (Bloomberg)."


def test_punctuation_after_a_removed_reference_survives():
    """참조를 걷어낸 자리의 문장부호는 붙여서 남긴다 — 지우면 문장이 무너진다."""
    text = "미국 지수는 강세 (rss:item:23) , 한국은 약세다. 물가는 2.5 % 수준."
    assert scrub_inline_refs(text, LOOKUP) == "미국 지수는 강세, 한국은 약세다. 물가는 2.5% 수준."


def test_punctuation_after_a_named_reference_survives():
    text = "유동성은 완화적이다 (rss:item:76) ."
    assert scrub_inline_refs(text, LOOKUP) == "유동성은 완화적이다 (Reuters)."


def test_scrubbed_text_never_carries_control_characters():
    """치환 문자열이 역참조가 아니라 제어문자였던 적이 있다. 화면에 그대로 나갔다."""
    payload = {"summary": "판단 : 강세다 (rss:item:23) ."}
    out = scrub_inline_refs(payload, LOOKUP)
    assert out["summary"] == "판단: 강세다."
    assert not any(ord(char) < 32 for char in out["summary"])


def test_decimals_and_percentages_survive():
    text = "미 10년물이 4.627%로 내렸고 WTI는 -9.79%다."
    assert scrub_inline_refs(text, LOOKUP) == text
