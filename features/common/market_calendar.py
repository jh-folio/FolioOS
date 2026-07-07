"""Market trading calendar and briefing date window helpers."""
import datetime as dt
import json
import re
from functools import lru_cache
from pathlib import Path

from features.common.utils import normalize

_COMPANY_MASTER_PATH = Path(__file__).resolve().parents[2] / "config" / "company_master.json"
# 한국 기사 관행: 종목명 뒤 6자리 종목코드 대괄호 표기(예: 셀트리온[068270]).
_KR_STOCK_CODE_RE = re.compile(r"\[\d{6}\]")


def previous_calendar_date(date):
    try:
        return (dt.datetime.strptime(date, "%Y-%m-%d").date() - dt.timedelta(days=1)).isoformat()
    except Exception:
        return date


def parse_iso_date(value):
    try:
        return dt.date.fromisoformat(str(value)[:10])
    except Exception:
        return dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).date()


def observed_date(day):
    if day.weekday() == 5:
        return day - dt.timedelta(days=1)
    if day.weekday() == 6:
        return day + dt.timedelta(days=1)
    return day


def nth_weekday(year, month, weekday, n):
    day = dt.date(year, month, 1)
    offset = (weekday - day.weekday()) % 7
    return day + dt.timedelta(days=offset + 7 * (n - 1))


def last_weekday(year, month, weekday):
    if month == 12:
        day = dt.date(year, 12, 31)
    else:
        day = dt.date(year, month + 1, 1) - dt.timedelta(days=1)
    return day - dt.timedelta(days=(day.weekday() - weekday) % 7)


def easter_date(year):
    a = year % 19
    b = year // 100
    c = year % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31
    day = ((h + l - 7 * m + 114) % 31) + 1
    return dt.date(year, month, day)


def us_market_holidays(year):
    fixed = [
        dt.date(year, 1, 1),
        observed_date(dt.date(year, 6, 19)),
        observed_date(dt.date(year, 7, 4)),
        dt.date(year, 12, 25),
    ]
    return set(fixed + [
        nth_weekday(year, 1, 0, 3),
        nth_weekday(year, 2, 0, 3),
        easter_date(year) - dt.timedelta(days=2),
        last_weekday(year, 5, 0),
        nth_weekday(year, 9, 0, 1),
        nth_weekday(year, 11, 3, 4),
    ])


KR_LUNAR_MARKET_HOLIDAYS = {
    2024: ["2024-02-09", "2024-02-12", "2024-04-10", "2024-05-15", "2024-09-16", "2024-09-17", "2024-09-18"],
    2025: ["2025-01-28", "2025-01-29", "2025-01-30", "2025-03-03", "2025-05-06", "2025-06-03", "2025-10-06", "2025-10-07", "2025-10-08"],
    2026: ["2026-02-16", "2026-02-17", "2026-02-18", "2026-03-02", "2026-05-25", "2026-08-17", "2026-09-24", "2026-09-25"],
    2027: ["2027-02-08", "2027-02-09", "2027-02-10", "2027-05-13", "2027-09-14", "2027-09-15", "2027-09-16"],
}


def kr_market_holidays(year):
    holidays = {
        dt.date(year, 1, 1),
        dt.date(year, 3, 1),
        dt.date(year, 5, 1),
        dt.date(year, 5, 5),
        dt.date(year, 6, 6),
        dt.date(year, 8, 15),
        dt.date(year, 10, 3),
        dt.date(year, 10, 9),
        dt.date(year, 12, 25),
    }
    for text in KR_LUNAR_MARKET_HOLIDAYS.get(year, []):
        holidays.add(dt.date.fromisoformat(text))
    last_day = dt.date(year, 12, 31)
    while last_day.weekday() >= 5:
        last_day -= dt.timedelta(days=1)
    holidays.add(last_day)
    return holidays


def is_market_open(day, market):
    if day.weekday() >= 5:
        return False
    if market == "US":
        return day not in us_market_holidays(day.year)
    if market == "KR":
        return day not in kr_market_holidays(day.year)
    return True


def previous_trading_day(day, market):
    cursor = day - dt.timedelta(days=1)
    for _ in range(14):
        if is_market_open(cursor, market):
            return cursor
        cursor -= dt.timedelta(days=1)
    return day - dt.timedelta(days=1)


def latest_trading_day_on_or_before(day, market):
    cursor = day
    for _ in range(14):
        if is_market_open(cursor, market):
            return cursor
        cursor -= dt.timedelta(days=1)
    return previous_trading_day(day, market)


def _date_range(start_iso, end_iso):
    try:
        start = dt.date.fromisoformat(start_iso)
        end = dt.date.fromisoformat(end_iso)
    except Exception:
        return []
    out = []
    cursor = start
    while cursor <= end and len(out) < 31:
        out.append(cursor.isoformat())
        cursor += dt.timedelta(days=1)
    return out


# 분석 모드별 세션 역할(primary/secondary/background/off_session_news).
# doc_analysis_priority()가 자료의 세션 토큰을 이 표로 매핑한다.
_MODE_SESSION_ROLES = {
    "weekday_kr_open": {
        "US_PREV_REGULAR": "primary",
        "KR_CURRENT_INTRADAY": "primary",
        "KR_PREV_REGULAR": "background",
        "TODAY_LATEST_NEWS": "secondary",
        "GLOBAL_PREV": "background",
    },
    "us_holiday_kr_open": {
        "KR_CURRENT_INTRADAY": "primary",
        "US_PREV_REGULAR": "secondary",
        "KR_PREV_REGULAR": "background",
        "TODAY_LATEST_NEWS": "secondary",
        "GLOBAL_PREV": "background",
    },
    "kr_holiday": {
        "US_PREV_REGULAR": "primary",
        "KR_PREV_REGULAR": "background",
        "TODAY_LATEST_NEWS": "secondary",
        "GLOBAL_PREV": "background",
    },
    "weekend": {
        "US_PREV_REGULAR": "primary",
        "KR_PREV_REGULAR": "primary",
        "TODAY_LATEST_NEWS": "off_session_news",
        "GLOBAL_PREV": "background",
    },
    "both_holiday": {
        "US_PREV_REGULAR": "primary",
        "KR_PREV_REGULAR": "primary",
        "TODAY_LATEST_NEWS": "off_session_news",
        "GLOBAL_PREV": "background",
    },
}

_MODE_PRIORITY_RULE = {
    "weekday_kr_open": "평일/한국장 개장일: 주 분석축은 ①미국 전일 정규장 ②한국 당일 개장 후/장중 흐름입니다. 한국 전일 정규장은 배경 맥락으로만 쓰고, 시장 흐름 섹션의 중심을 차지하지 않게 합니다.",
    "us_holiday_kr_open": "미국 휴장일/한국 개장일: 한국 당일 장중·정규장을 우선 분석하고, 직전 미국 정규장은 보조로 둡니다. 미국 정규장 결과를 새로 만들지 말고, 미국 휴장 중 선물·환율·뉴스는 다음 미국 정규장 반응 후보로 분리합니다.",
    "kr_holiday": "한국 휴장일: 한국 당일 장중 시황을 만들지 않습니다. 최근 미국 정규장을 우선 분석하고, 휴장 전 한국 정규장과 휴장 중 한국 관련 뉴스가 다음 한국 거래일에 어떻게 반영될지 다음 거래일 확인 재료로 다룹니다.",
    "weekend": "주말: 정규장 가격 반응이 없으므로 최근 미국·한국 정규장을 간결히 복기하고, 주말 사이 나온 새 뉴스(정책·지정학·기업·중앙은행·원자재·환율·실적·M&A·규제)는 현재 가격 반응이 아니라 다음 거래일 반영 후보로 다룹니다. 장중 시황을 만들지 않습니다.",
    "both_holiday": "양시장 휴장일: 정규장 가격 반응이 없으므로 최근 미국·한국 정규장을 간결히 복기하고, 휴장 중 나온 새 뉴스는 다음 거래일 반영 후보로 다룹니다. 장중 시황을 만들지 않습니다.",
}


def briefing_market_windows(date):
    briefing_day = parse_iso_date(date)
    # Always use the previous completed US session (D-1), never the briefing day itself.
    # On a Korean Monday morning the US briefing-day session hasn't opened yet.
    us_previous = previous_trading_day(briefing_day, "US")
    kr_current_open = is_market_open(briefing_day, "KR")
    us_open = is_market_open(briefing_day, "US")
    kr_previous = previous_trading_day(briefing_day, "KR") if kr_current_open else latest_trading_day_on_or_before(briefing_day, "KR")

    # 브리핑 대상일의 시장 개장 상태로 분석 모드를 정한다.
    if kr_current_open and us_open:
        analysis_mode = "weekday_kr_open"
    elif kr_current_open and not us_open:
        analysis_mode = "us_holiday_kr_open"
    elif not kr_current_open and us_open:
        analysis_mode = "kr_holiday"
    else:
        analysis_mode = "weekend" if briefing_day.weekday() >= 5 else "both_holiday"

    weekend_or_holiday_news = analysis_mode != "weekday_kr_open"
    # 휴장/주말 사이 새 뉴스 구간: 가장 최근 정규장 다음날부터 브리핑 대상일까지.
    last_regular = max(us_previous, kr_previous)
    if analysis_mode == "kr_holiday":
        off_start = kr_previous + dt.timedelta(days=1)
    elif analysis_mode == "us_holiday_kr_open":
        off_start = us_previous + dt.timedelta(days=1)
    else:
        off_start = last_regular + dt.timedelta(days=1)
    off_start = min(off_start, briefing_day)
    off_window = {"start": off_start.isoformat(), "end": briefing_day.isoformat()}

    session_roles = _MODE_SESSION_ROLES[analysis_mode]
    primary_sessions = [t for t, r in session_roles.items() if r == "primary"]
    secondary_sessions = [t for t, r in session_roles.items() if r == "secondary"]
    if weekend_or_holiday_news:
        secondary_sessions = secondary_sessions + ["OFF_SESSION_NEWS"]

    source_dates = {us_previous.isoformat(), kr_previous.isoformat()}
    if kr_current_open:
        source_dates.add(briefing_day.isoformat())
    if weekend_or_holiday_news:
        # 주말/휴장 사이 새 뉴스가 누락되지 않도록 off-session 구간 날짜를 명시 포함.
        source_dates.update(_date_range(off_window["start"], off_window["end"]))

    closed_notes = []
    if not kr_current_open:
        closed_notes.append(f"한국장 {briefing_day.isoformat()}은 주말/공휴일 가능성이 높아 당일 장중 시황으로 해석하지 않습니다.")
    if not us_open:
        closed_notes.append(f"미국장 {briefing_day.isoformat()}은 휴장일 가능성이 높아 당일 미국 정규장 결과를 새로 만들지 않습니다.")
    if briefing_day.weekday() >= 5:
        closed_notes.append(f"브리핑 대상일 {briefing_day.isoformat()}은 주말입니다.")

    kr_rule = (
        f"한국장은 직전 한국 거래일인 {kr_previous.isoformat()} 정규장 결과와 {briefing_day.isoformat()} 개장 후/장중 시황 자료를 구분해 해석합니다."
        if kr_current_open
        else f"한국장은 가장 최근 한국 거래일인 {kr_previous.isoformat()} 정규장 결과를 중심으로 해석합니다. 당일 한국장이 휴장일이면 장중 반영 여부를 단정하지 않습니다."
    )
    return {
        "briefingDate": date,
        "analysisMode": analysis_mode,
        "usRegularSessionDate": us_previous.isoformat(),
        "krPreviousSessionDate": kr_previous.isoformat(),
        "krCurrentSessionDate": briefing_day.isoformat() if kr_current_open else "",
        "krCurrentSessionOpen": kr_current_open,
        "usMarketOpenOnDate": us_open,
        "primarySessions": primary_sessions,
        "secondarySessions": secondary_sessions,
        "sessionRoles": session_roles,
        "weekendOrHolidayNewsMode": weekend_or_holiday_news,
        "offSessionNewsWindow": off_window,
        "sourceDates": sorted(source_dates),
        "closedNotes": closed_notes,
        "sessionPriorityRule": _MODE_PRIORITY_RULE[analysis_mode],
        "rule": f"한국시간 브리핑일 {date} 기준: 미국장은 최근 미국 거래일인 {us_previous.isoformat()} 정규장 마감 결과를 우선 해석하고, {kr_rule}",
    }


# 자료의 세션 버킷 → 분석 우선순위(primary/secondary/background/off_session_news).
_BUCKET_SESSION_TOKEN = {
    "US 전일 정규장": "US_PREV_REGULAR",
    "KR 전일 정규장": "KR_PREV_REGULAR",
    "KR 당일 개장/장중": "KR_CURRENT_INTRADAY",
    "당일 최신 자료": "TODAY_LATEST_NEWS",
    "전일 글로벌 자료": "GLOBAL_PREV",
}


def doc_analysis_priority(doc, windows):
    """브리핑 분석 모드 기준으로 자료의 우선순위를 반환한다.

    primary / secondary / background / off_session_news 중 하나.
    """
    roles = windows.get("sessionRoles", {})
    token = _BUCKET_SESSION_TOKEN.get(doc_market_bucket(doc, windows))
    if token and token in roles:
        return roles[token]
    # 정규장 버킷이 아니면 주말/휴장 사이 새 뉴스인지 확인한다.
    if windows.get("weekendOrHolidayNewsMode"):
        win = windows.get("offSessionNewsWindow") or {}
        session = doc.get("marketSessionDate") or doc.get("date", "")
        if win.get("start") and win.get("end") and win["start"] <= session <= win["end"]:
            return "off_session_news"
    return "background"


@lru_cache(maxsize=1)
def _company_market_matchers():
    """Compile (matcher, market) pairs from ``config/company_master.json``.

    회사명/별칭/티커가 기사 텍스트에 등장하면 그 회사의 시장을 시장 태그 신호로
    쓴다. ASCII 별칭은 단어 경계로, 한글 별칭은 부분 문자열로 매칭한다.
    """
    try:
        data = json.loads(_COMPANY_MASTER_PATH.read_text(encoding="utf-8"))
    except Exception:
        return ()
    matchers = []
    for company in data.get("companies", []) or []:
        market = str(company.get("market") or "").strip().upper()
        if market not in {"US", "KR"}:
            continue
        names = [company.get("name", ""), company.get("ticker", "")] + list(company.get("aliases", []) or [])
        for name in names:
            token = str(name or "").strip().lower()
            if len(token) < 2:
                continue
            if re.fullmatch(r"[\x00-\x7f]+", token):
                if len(token) < 3:
                    # 두 글자 ASCII 티커(GM 등)는 일반 단어와 충돌 위험이 커서 제외.
                    continue
                pattern = re.compile(rf"(?<![a-z0-9]){re.escape(token)}(?![a-z0-9])")
                matchers.append((pattern.search, market))
            else:
                matchers.append((lambda text, _t=token: _t in text, market))
    return tuple(matchers)


def _text_has_token(text, token):
    """Substring for Korean/symbol tokens, word-boundary for ASCII words.

    단순 부분 문자열 매칭은 "dow"→"downgrade", "oil"→"turmoil" 같은 오탐으로
    잘못된 시장 태그를 만들었다. ASCII 단어 토큰은 앞뒤 영숫자를 차단하되
    복수형(s)과 뒤따르는 숫자(S&P500, Dow30)는 허용한다.
    """
    if not token.isascii() or not token[0].isalnum():
        return token in text
    return re.search(rf"(?<![a-z0-9]){re.escape(token)}s?(?![a-z])", text) is not None


def infer_doc_markets(doc):
    """Infer all markets discussed by an article.

    Returns one or more of US, KR, GLOBAL, UNKNOWN. US/KR/GLOBAL can overlap.
    UNKNOWN is only used when no useful market signal is present; an explicit
    UNKNOWN tag is treated as "no signal" and re-inferred, not echoed back.
    """
    explicit = doc.get("markets")
    if isinstance(explicit, list):
        values = []
        for item in explicit:
            token = str(item or "").strip().upper()
            if token in {"US", "KR", "GLOBAL"} and token not in values:
                values.append(token)
        if values:
            return values
    explicit_text = str(doc.get("market") or "").strip().upper()
    if "," in explicit_text:
        values = []
        for item in explicit_text.split(","):
            token = item.strip()
            if token in {"US", "KR", "GLOBAL"} and token not in values:
                values.append(token)
        if values:
            return values
    if explicit_text in {"US", "KR", "GLOBAL"}:
        return [explicit_text]
    if explicit_text == "BOTH":
        return ["US", "KR"]

    """Infer the market discussed by an article without using publisher name.

    A Korean publisher can cover Wall Street and a foreign wire can cover Seoul.
    Treating the publisher itself as a market signal caused those articles to be
    promoted into the wrong session lane.
    """
    companies = doc.get("companies", []) or []
    company_markets = {str(c.get("market") or "").upper() for c in companies}
    text = normalize(" ".join([
        doc.get("title", "") or "",
        doc.get("summary", "") or "",
        (doc.get("content", "") or "")[:1600],
        doc.get("url", "") or "",
        " ".join(doc.get("sectors", []) or []),
        " ".join(doc.get("impactTags", []) or []),
    ])).lower()
    for matcher, market in _company_market_matchers():
        if market not in company_markets and matcher(text):
            company_markets.add(market)
    if _KR_STOCK_CODE_RE.search(text):
        company_markets.add("KR")
    kr_tokens = (
        "한국", "서울증시", "코스피", "코스닥", "kospi", "kosdaq", "krx",
        "원달러", "원·달러", "원화", "외국인 순매", "기관 순매", ".ks", ".kq",
        "korea chip", "korean semiconductor", "korean exporter", "korean chip",
        "국내 증시", "국내증시", "유가증권시장", "한국은행", "금융감독원",
        "실적 시즌", "실적발표", "잠정실적",
    )
    us_tokens = (
        "미국", "뉴욕증시", "뉴욕 증시", "월스트리트", "나스닥", "nasdaq", "s&p", "dow",
        "다우", "nyse", "wall street", "federal reserve", "연준", "treasury",
        "fed", "fomc", "earnings", "earnings season", "월가", "미 증시", "미국채", "russell", "잭슨홀",
    )
    global_tokens = (
        "global", "international", "middle east", "oil", "crude", "dollar", "supply chain",
        "원자재", "국제", "중동", "유가", "달러", "공급망", "관세", "지정학",
    )
    is_kr = "KR" in company_markets or any(_text_has_token(text, token) for token in kr_tokens)
    is_us = "US" in company_markets or any(_text_has_token(text, token) for token in us_tokens)
    is_global = any(_text_has_token(text, token) for token in global_tokens)
    markets = []
    if is_us:
        markets.append("US")
    if is_kr:
        markets.append("KR")
    if is_global or (is_us and is_kr):
        markets.append("GLOBAL")
    return markets or ["UNKNOWN"]


def infer_doc_market(doc):
    """Backward-compatible primary market label for existing callers."""
    markets = infer_doc_markets(doc)
    if "US" in markets and "KR" in markets:
        return "BOTH"
    if "KR" in markets:
        return "KR"
    if "US" in markets:
        return "US"
    if "GLOBAL" in markets:
        return "GLOBAL"
    return "UNKNOWN"


def doc_market_bucket(doc, windows):
    # 자료가 실제로 다루는 시장 거래일(marketSessionDate)을 발행일(date)보다 우선한다.
    # 한국 언론의 뉴욕증시 마감 기사는 발행일이 미국 정규장 거래일보다 하루 앞설 수
    # 있어, 발행일로 분류하면 전 거래일 결과를 당일 결과로 오인한다.
    date = doc.get("marketSessionDate") or doc.get("date", "")
    markets = set(infer_doc_markets(doc))
    is_kr = "KR" in markets
    is_us = "US" in markets
    if date == windows["usRegularSessionDate"] and is_us:
        return "US 전일 정규장"
    if date == windows["krPreviousSessionDate"] and is_kr:
        return "KR 전일 정규장"
    if windows.get("krCurrentSessionDate") and date == windows["krCurrentSessionDate"] and is_kr:
        return "KR 당일 개장/장중"
    if date == windows["usRegularSessionDate"]:
        return "전일 글로벌 자료"
    if windows.get("krCurrentSessionDate") and date == windows["krCurrentSessionDate"]:
        return "당일 최신 자료"
    return "보조 자료"
