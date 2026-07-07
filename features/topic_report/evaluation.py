"""Topic Report Quality Gate compatibility wrapper.

Step 7 moved the implementation to ``features.common.research_quality``. Keep this
module so existing Topic Report imports/tests continue to work.
"""
from __future__ import annotations

from features.common.research_quality.evaluator import evaluate_report

__all__ = ["evaluate_report"]
