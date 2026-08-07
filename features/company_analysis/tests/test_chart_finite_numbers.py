"""NaN 하나가 100초짜리 CLI 결과를 통째로 버렸다.

yfinance는 결측 행을 NaN으로 준다. 수익률 계산의 `if start_price` 가드는 0만
걸러내고 NaN은 참이라 통과시켰고, `round(nan, 2)`도 NaN이다. `is not None` 검사도
NaN을 값으로 본다. 그렇게 만들어진 `series.HWM[2] = nan`이 보고서 저장 단계의
canonical JSON에서 막혀 기업 분석이 85%에서 실패했다.
"""
from __future__ import annotations

import math

import pytest

from features.company_analysis import service


def test_a_nan_price_does_not_become_a_return(monkeypatch):
    class FakeClose:
        def __init__(self, values):
            self._values = values

        @property
        def iloc(self):
            return self._values

    class FakeHist:
        empty = False

        def __init__(self, values):
            self._values = values

        def __len__(self):
            return len(self._values)

        def __getitem__(self, _key):
            return FakeClose(self._values)

    class FakeTicker:
        def __init__(self, _symbol):
            pass

        def history(self, period=""):
            # 6개월 구간만 결측이다. 실제로 이렇게 한 칸만 비어 온다.
            return FakeHist([float("nan"), float("nan")] if period == "6mo" else [100.0, 120.0])

    monkeypatch.setitem(__import__("sys").modules, "yfinance", type("M", (), {"Ticker": FakeTicker}))

    result = service._compute_price_returns("HWM")

    assert result is not None
    for symbol, values in result["series"].items():
        for value in values:
            assert value is None or math.isfinite(value), (symbol, values)
    # 결측 구간은 값이 없는 것이지 0이 아니다.
    assert result["series"]["HWM"][2] is None


def test_the_chart_payload_never_carries_non_finite_numbers():
    """차트 숫자는 전부 외부 provider에서 온다. 마지막에 한 번 더 훑는다."""
    dirty = {
        "charts": [
            {"kind": "price_return", "series": {"HWM": [1.0, float("nan"), float("inf")]}},
            {"kind": "performance", "revenue": [float("-inf"), 2.0]},
        ]
    }

    clean = service._finite_series(dirty)

    assert clean["charts"][0]["series"]["HWM"] == [1.0, None, None]
    assert clean["charts"][1]["revenue"] == [None, 2.0]


def test_the_report_payload_survives_canonical_json():
    from features.common.canonical_json import canonical_json_bytes

    payload = service._finite_series({"charts": [{"series": {"X": [float("nan")]}}]})

    # 예전에는 여기서 ValueError로 저장이 통째로 실패했다.
    assert canonical_json_bytes(payload)
