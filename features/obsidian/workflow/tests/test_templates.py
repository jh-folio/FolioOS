"""Obsidian workflow template tests.

    py -3 features/obsidian/workflow/tests/test_templates.py
"""
import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from unittest.mock import patch

from features.obsidian.importer import parser as P
from features.obsidian.workflow import note_factory as nf
from features.obsidian.workflow.templates import (
    company_thesis_template,
    investment_note_template,
    market_memo_template,
    topic_review_template,
)


def test_company_thesis_template_is_importable_hypothesis():
    note = P.parse_note(company_thesis_template(ticker="NVDA", company="NVIDIA"))
    assert note.note_type == "company_thesis"
    assert note.importable is True
    assert note.ticker == "NVDA"


def test_market_memo_template_uses_wikilinks():
    text = market_memo_template(topic="AI 데이터센터 전력 병목", linked_tickers=["GEV"])
    assert "[[GEV]]" in text
    note = P.parse_note(text)
    assert note.note_type == "market_memo"
    assert note.importable is True


def test_topic_review_template_is_hypothesis():
    note = P.parse_note(topic_review_template(topic="환율", linked_reports=["환율 보고서"]))
    assert note.note_type == "topic_review"
    assert note.importable is True


def test_investment_note_template_is_importable_and_keeps_body():
    text = investment_note_template(ticker="SPCX", label="SPCX", body="내 투자 메모")
    assert "## 메모" in text and "내 투자 메모" in text
    note = P.parse_note(text)
    assert note.importable is True  # source_layer: user_synthesis → hypothesis


def test_investment_note_create_and_read_round_trips(tmp_path):
    with patch.object(nf, "get_vault_settings", return_value={"vaultPath": str(tmp_path)}):
        created = nf.create_note("investment_note", {"ticker": "SPCX", "label": "SPCX", "body": "첫 메모"}, overwrite=True)
        assert created["created"] is True
        read = nf.read_note("investment_note", {"ticker": "SPCX", "label": "SPCX"})
        assert read["exists"] is True and read["body"] == "첫 메모"
        # overwrite updates the editable body
        nf.create_note("investment_note", {"ticker": "SPCX", "label": "SPCX", "body": "수정된 메모"}, overwrite=True)
        assert nf.read_note("investment_note", {"ticker": "SPCX", "label": "SPCX"})["body"] == "수정된 메모"


def test_read_missing_investment_note_returns_empty(tmp_path):
    with patch.object(nf, "get_vault_settings", return_value={"vaultPath": str(tmp_path)}):
        read = nf.read_note("investment_note", {"ticker": "NONE", "label": "NONE"})
        assert read["exists"] is False and read["body"] == ""


def _run_all():
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    passed = 0
    for t in tests:
        t()
        passed += 1
        print(f"PASS {t.__name__}")
    print(f"\n{passed}/{len(tests)} tests passed")
    return passed == len(tests)


if __name__ == "__main__":
    sys.exit(0 if _run_all() else 1)
