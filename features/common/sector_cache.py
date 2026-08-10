"""회사 섹터 캐시.

**회사를 알아낸 출처가 섹터를 갖고 있지 않을 때가 많다.** SEC `company_tickers.json`은
`cik`/`ticker`/`title` 셋뿐이고, 일본·유럽 구성종목 파일도 섹터를 담지 않는다. 섹터를
들고 있는 것은 수동 사전(`curated`)뿐이라, 워치리스트 카드가 종목 넷 중 셋에
`Unclassified`를 달았다 — 회사를 못 찾은 것이 아니라 티커는 아는데 섹터만 없는 상태다.

yfinance는 그 티커로 섹터를 준다(실측 종목당 0.5초, 첫 조회 1.3초). 카드를 그릴 때마다
치를 수 없는 값이라 여기서 캐시한다. 섹터는 거의 바뀌지 않으므로 오래 들고 있는다.

실패도 캐시한다. 안 그러면 상장폐지 종목이나 티커가 아닌 관심 주제가 화면을 열 때마다
네트워크를 한 번씩 태운다. 대신 짧게 잡아 일시적 실패가 눌러앉지 않게 한다.
"""
from __future__ import annotations

import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor, wait

from features.common.instruments.registry import exchange_suffix
from features.common.workspace import data_dir
from features.common.utils import read_json, write_json

CACHE_PATH = data_dir() / "sector-cache.json"

HIT_TTL_SECONDS = 90 * 24 * 3600
MISS_TTL_SECONDS = 7 * 24 * 3600

# 한 번에 물어보는 수를 묶는다. 처음 여는 큰 워치리스트가 화면을 몇 초씩 잡으면 안 된다.
# 남은 것은 다음 조회에서 채워진다.
MAX_LOOKUPS_PER_CALL = 12
MAX_WORKERS = 8
LOOKUP_DEADLINE_SECONDS = 6.0

UNKNOWN_SECTOR = "Unclassified"

_LOCK = threading.Lock()
_MEMO: dict | None = None


def _now() -> float:
    return time.time()


def _load() -> dict:
    global _MEMO
    if _MEMO is None:
        raw = read_json(CACHE_PATH, {}) or {}
        _MEMO = raw.get("tickers", {}) if isinstance(raw, dict) else {}
    return _MEMO


def _save() -> None:
    write_json(CACHE_PATH, {"tickers": _load()})


def _fresh(row: object) -> bool:
    if not isinstance(row, dict):
        return False
    at = row.get("at")
    if not isinstance(at, (int, float)):
        return False
    ttl = HIT_TTL_SECONDS if row.get("sector") else MISS_TTL_SECONDS
    return _now() - at < ttl


def quote_symbols(ticker: str, market: str = "") -> list[str]:
    """yfinance가 아는 표기 후보.

    끝의 점은 두 가지를 뜻한다. `BRK.B`는 미국 클래스 구분이라 Yahoo가 `BRK-B`로 쓰고,
    `7203.T`는 도쿄 상장이라 점을 그대로 둔다. 뒤엣것을 앞엣것처럼 고치면 `7203-T`를
    묻게 되고, 없는 심볼이라 조회가 통째로 빈다.
    """
    raw = str(ticker or "").strip().upper()
    market = str(market or "").strip().upper()
    if not raw:
        return []
    if re.fullmatch(r"\d{6}", raw):
        return [f"{raw}.KQ", f"{raw}.KS"] if market == "KQ" else [f"{raw}.KS", f"{raw}.KQ"]
    if exchange_suffix(raw):
        return [raw]
    if not re.fullmatch(r"[A-Z]{1,6}(?:[.-][A-Z]{1,3})?", raw):
        return []
    return [raw.replace(".", "-")]


def _lookup(ticker: str, market: str) -> str:
    try:
        import yfinance as yf
    except Exception:
        return ""
    for symbol in quote_symbols(ticker, market):
        try:
            info = yf.Ticker(symbol).get_info() or {}
        except Exception:
            continue
        sector = str(info.get("sector") or info.get("industry") or "").strip()
        if sector and sector != UNKNOWN_SECTOR:
            return sector
    return ""


def cached_sector(ticker: str) -> str:
    """네트워크를 쓰지 않고 아는 값만 돌려준다."""
    key = str(ticker or "").strip().upper()
    if not key:
        return ""
    with _LOCK:
        row = _load().get(key)
        return str(row.get("sector") or "") if _fresh(row) else ""


def resolve_sectors(entries) -> dict[str, str]:
    """`(ticker, market)` 목록의 섹터를 돌려준다. 없는 것만 조회하고 캐시한다.

    yfinance가 없거나 전부 실패해도 빈 값으로 답할 뿐 예외를 올리지 않는다 — 섹터 하나
    때문에 워치리스트가 통째로 비면 안 된다.
    """
    wanted: dict[str, str] = {}
    for ticker, market in entries or []:
        key = str(ticker or "").strip().upper()
        if key and key not in wanted:
            wanted[key] = str(market or "").strip().upper()

    found: dict[str, str] = {}
    missing: list[tuple[str, str]] = []
    with _LOCK:
        cache = _load()
        for key, market in wanted.items():
            row = cache.get(key)
            if _fresh(row):
                found[key] = str(row.get("sector") or "")
            elif quote_symbols(key, market):
                missing.append((key, market))

    if not missing:
        return found

    batch = missing[:MAX_LOOKUPS_PER_CALL]
    # 마감 시각을 둔다. 네트워크가 죽어 있으면 yfinance 요청 하나가 오래 매달리는데,
    # 그동안 워치리스트 화면 전체가 섹터 한 줄을 기다린다. 못 받은 것은 캐시에 적지 않고
    # 다음 조회에서 다시 물어본다 — 죽은 네트워크를 "섹터 없음"으로 굳히면 안 된다.
    pool = ThreadPoolExecutor(max_workers=min(MAX_WORKERS, len(batch)))
    try:
        futures = {pool.submit(_lookup, key, market): key for key, market in batch}
        done, _pending = wait(futures, timeout=LOOKUP_DEADLINE_SECONDS)
    finally:
        pool.shutdown(wait=False, cancel_futures=True)

    stamped = _now()
    with _LOCK:
        cache = _load()
        for future in done:
            key = futures[future]
            try:
                sector = future.result()
            except Exception:
                continue
            cache[key] = {"sector": sector, "at": stamped}
            found[key] = sector
        try:
            _save()
        except Exception:
            # 캐시를 못 써도 이번 화면은 값을 갖고 있다. 다음에 다시 물어볼 뿐이다.
            pass
    return found


def reset_cache_for_tests() -> None:
    global _MEMO
    with _LOCK:
        _MEMO = None
