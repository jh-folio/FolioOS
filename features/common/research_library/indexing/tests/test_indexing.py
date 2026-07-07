"""Research Library indexing regression tests.

Run:
    py -3 -m features.common.research_library.indexing.tests.test_indexing
"""
import os
import sys
from pathlib import Path

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from features.common.research_library.indexing import service as svc


def test_should_index_file_skips_rss_state_file():
    assert svc.should_index_file(Path(svc.ROOT / "research-inbox" / "rss" / ".state.json")) is False
    assert svc.should_index_file(Path(svc.ROOT / "research-inbox" / "rss" / "reuters.md")) is True
    assert svc.should_index_file(Path(svc.ROOT / "research-inbox" / "articles" / "note.json")) is True


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
