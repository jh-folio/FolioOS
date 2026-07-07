"""Obsidian workflow validator tests.

    py -3 features/obsidian/workflow/tests/test_validator.py
"""
import os
import sys
import tempfile
from pathlib import Path

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.obsidian.workflow.templates import company_thesis_template
from features.obsidian.workflow.validator import validate_note


def test_validator_accepts_company_thesis_template():
    with tempfile.TemporaryDirectory() as tmp:
        vault = Path(tmp)
        path = vault / "NVDA.md"
        path.write_text(company_thesis_template(ticker="NVDA", company="NVIDIA"), encoding="utf-8")
        result = validate_note(path, vault)
        assert result["status"] == "ok"
        assert not result["issues"]


def test_validator_flags_generated_user_synthesis_conflict():
    with tempfile.TemporaryDirectory() as tmp:
        vault = Path(tmp)
        path = vault / "bad.md"
        path.write_text("---\ntype: company_thesis\ngenerated_by: Folio OS\nsource_layer: user_synthesis\nreuse_as_hypothesis: true\n---\n# Bad\n", encoding="utf-8")
        result = validate_note(path, vault)
        assert result["status"] == "needs_fix"
        assert any("generated_by" in issue["message"] for issue in result["issues"])


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
