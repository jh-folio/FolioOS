"""Resolve a display name for a calendar ticker.

`8306.T 실적 발표 예정`만으로는 어느 회사인지 알 수 없다. 격자는 좁아 티커로
두더라도 아래 표에서는 이름을 펼쳐야 한다. 구성종목 파일이 이미 라벨을 갖고
있으므로 네트워크보다 그쪽을 먼저 본다.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_CONSTITUENT_FILES = (
    "sp500_constituents.json",
    "kospi200_constituents.json",
    "europe_core_constituents.json",
    "nikkei225_constituents.json",
)


@lru_cache(maxsize=1)
def _label_index() -> dict[str, str]:
    from features.common.config_bootstrap import resolve_config

    index: dict[str, str] = {}
    for name in _CONSTITUENT_FILES:
        try:
            payload = json.loads(Path(resolve_config(name)).read_text(encoding="utf-8"))
        except Exception:
            continue
        for row in payload.get("companies") or []:
            # 일본 구성종목의 라벨은 한자·가나다. 한국어 화면에서 `三井住友
            # フィナンシャルグループ`보다 `Sumitomo Mitsui Financial Group`이 읽힌다.
            label = str((row or {}).get("englishName") or "").strip() or str((row or {}).get("label") or "").strip()
            if not label:
                continue
            keys = [(row or {}).get("ticker"), (row or {}).get("providerSymbol")]
            for key in list(keys):
                symbol = str(key or "").strip().upper()
                if not symbol:
                    continue
                index.setdefault(symbol, label)
                # KOSPI 구성종목은 `373220`으로 저장되는데 캘린더가 받는 티커는
                # yfinance 표기라 `373220.KS`다. 접미사를 붙인 형태도 색인한다.
                if symbol.isdigit() and len(symbol) == 6:
                    index.setdefault(f"{symbol}.KS", label)
                    index.setdefault(f"{symbol}.KQ", label)
    return index


def company_name(ticker: str, fallback_lookup=None) -> str:
    """구성종목 라벨 → (선택) provider 조회 순. 못 찾으면 빈 문자열."""
    symbol = str(ticker or "").strip().upper()
    if not symbol:
        return ""
    known = _label_index().get(symbol)
    if known:
        return known
    if fallback_lookup is None:
        return ""
    try:
        return str(fallback_lookup(symbol) or "").strip()[:120]
    except Exception:
        return ""
