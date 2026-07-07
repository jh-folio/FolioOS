import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.common.quality_generation.prompt_hints import render_prompt_hints


def test_render_prompt_hints_includes_risks_and_hints():
    text = render_prompt_hints({"risks": ["자료 부족"], "promptHints": ["추정 금지"]})
    assert "자료 부족" in text
    assert "추정 금지" in text


def _run_all():
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"\n{len(tests)}/{len(tests)} tests passed")
    return True


if __name__ == "__main__":
    sys.exit(0 if _run_all() else 1)
