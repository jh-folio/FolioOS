"""Daily briefing generation service."""
import os
import re
from pathlib import Path

from features.common.dataframe_ops import top_records
from features.common.utils import normalize, kst_date
from features.common.market_calendar import briefing_market_windows, doc_market_bucket, doc_analysis_priority
from features.daily_briefing.issue_selection import (
    canonical_publisher,
    diversify_ranked_documents,
    documents_for_scope,
    select_diverse_documents,
    session_modes_from_windows,
)
from features.daily_briefing.schema import (
    briefing_file_name,
    briefing_link_file_name,
    briefing_scope_view,
    briefing_type_instruction,
    normalize_briefing_type,
    normalize_market_scope,
    visual_sidecar_file_name,
    visual_sidecar_gzip_file_name,
)
from features.daily_briefing.selection import (
    briefing_doc_excerpt,
    briefing_doc_score,
    derive_market_drivers,
    is_us_market_close_article,
    market_connection_score,
)
from features.llm_settings.client import (
    request_claude,
    request_gemini,
    request_openai,
    selected_llm_config,
    strip_llm_citation_markers,
    use_web_search_for_briefing,
)
from features.common.quality_generation.prompt_hints import render_prompt_hints
from features.common.quality_generation.preflight_enrichment import build_preflight_evidence_context
from features.common.quality_generation.quality_targets import render_quality_target_context
from features.common.quality_generation.telemetry import normalize_token_usage
from features.market_memory.snapshot import render_market_memory_context

ROOT = Path(__file__).resolve().parent.parent.parent
FEATURES_DIR = ROOT / "features"
BRIEFING_PROMPT_PATH = FEATURES_DIR / "daily_briefing" / "prompt.md"
BRIEFING_PROMPT_US_PATH = FEATURES_DIR / "daily_briefing" / "prompt_us.md"
BRIEFING_PROMPT_KR_PATH = FEATURES_DIR / "daily_briefing" / "prompt_kr.md"
BRIEFINGS_DIR = ROOT / "data" / "briefings"
MARKET_MEMORY_DB_PATH = ROOT / "data" / "market-memory.sqlite3"

NEWS_INBOX_PREFIXES = ("research-inbox/articles/", "research-inbox/rss/")


def briefing_prompt_paths(market_scope="both"):
    scope = normalize_market_scope(market_scope)
    if scope == "us":
        return [BRIEFING_PROMPT_US_PATH]
    if scope == "kr":
        return [BRIEFING_PROMPT_KR_PATH]
    return [BRIEFING_PROMPT_US_PATH, BRIEFING_PROMPT_KR_PATH]


def briefing_prompt_path_label(market_scope="both"):
    return ";".join(str(path) for path in briefing_prompt_paths(market_scope))


def read_briefing_prompt(market_scope="both"):
    paths = briefing_prompt_paths(market_scope)
    chunks = []
    for path in paths:
        try:
            chunks.append(path.read_text(encoding="utf-8").strip())
        except Exception:
            continue
    if chunks:
        return "\n\n---\n\n".join(chunks)
    try:
        return BRIEFING_PROMPT_PATH.read_text(encoding="utf-8")
    except Exception:
        return ""


def is_news_document(doc):
    rel = str(doc.get("path", "")).replace("\\", "/").lower()
    if rel.startswith("research-inbox/rss/"):
        return rel.endswith(".md")
    return rel.startswith("research-inbox/articles/")


def news_documents(index):
    return [d for d in index.get("documents", []) if is_news_document(d)]


def select_briefing_docs(documents, date, strict=False, today=None):
    today = today or kst_date()
    windows = briefing_market_windows(date)
    source_dates = set(windows["sourceDates"])
    # Check whether any articles fall within the market trading window
    dated = [d for d in documents if d.get("date") in source_dates]
    source_date = "/".join(windows["sourceDates"])
    if strict:
        # Strict mode: honour only articles from the exact market window dates
        return dated, source_date, windows
    if dated:
        # Non-strict: window articles exist — expand the pool from the earliest window
        # date up to today so retroactively-written analysis is included, but stale
        # articles from before this week's trading window are excluded.
        # (e.g. generating a 6/8 briefing on 6/8 uses 6/5–6/8, not 5/30 or 6/1)
        lower_bound = min(source_dates)
        all_recent = [d for d in documents if lower_bound <= d.get("date", "") <= today]
        return all_recent, source_date, windows
    # Fallback: no articles match the window dates; use the latest available up to today
    candidates = [d.get("date", "") for d in documents if d.get("date", "") <= today]
    latest = max(candidates) if candidates else ""
    if not latest:
        return [], date, windows
    return [d for d in documents if d.get("date") == latest], latest, windows


def _escape_md_link_text(text):
    # JS inline() regex [^\]]+ stops at the first ] character, so strip brackets
    # instead of escaping them. Korean titles like [뉴욕증시 브리핑] are common.
    return text.replace("[", "").replace("]", "")


def source_lines(docs, limit=8):
    lines = []
    for d in docs[:limit]:
        title = d.get("title", "Untitled")
        source = d.get("source", "Unknown")
        date = d.get("date", "")
        url = d.get("url", "")
        if url:
            lines.append(f"- [{_escape_md_link_text(title)}]({url}) — {source}, {date}")
        else:
            lines.append(f"- {title} — {source}, {date}")
    return "\n".join(lines)


def briefing_sources_from_headlines(headlines, limit=14):
    rows = []
    seen = set()
    for headline in headlines or []:
        for source in headline.get("sources", []):
            key = source.get("url") or source.get("path") or source.get("title")
            if not key or key in seen:
                continue
            seen.add(key)
            rows.append(source)
    rows.sort(key=lambda s: s.get("date", ""), reverse=True)
    return rows[:limit]


def markdown_has_sources(markdown):
    return bool(re.search(r"(?im)^#{1,3}\s*(참고\s*자료|참고자료|sources\s+used|sources)\s*$", str(markdown or "")))


def append_briefing_sources(markdown, sources, limit=14):
    markdown = str(markdown or "").strip()
    sources = source_refs(sources or [], limit=limit)
    if not markdown or markdown_has_sources(markdown) or not sources:
        return markdown
    return f"{markdown}\n\n---\n\n## 참고자료\n\n{source_lines(sources, limit=limit)}"


def source_refs(docs, limit=14):
    rows = []
    seen = set()
    for d in docs:
        key = d.get("url") or d.get("path") or d.get("title")
        if not key or key in seen:
            continue
        seen.add(key)
        rows.append(d)
        if len(rows) >= limit:
            break
    return rows


_REF_TIER_RANK = {
    "us_close": 7,
    "kr_current_flow": 6,
    "korea_market_data": 5,
    "semiconductor": 4,
    "macro_market": 3,
    "core_driver": 2,
    "leading_company": 2,
    "market_flow": 1,
    "support": 0,
}


def _ref_text(doc):
    companies = doc.get("companies") or []
    return normalize(" ".join([
        doc.get("title", "") or "",
        doc.get("summary", "") or "",
        (doc.get("content", "") or "")[:1200],
        " ".join(doc.get("sectors", []) or []),
        " ".join(doc.get("impactTags", []) or []),
        " ".join(c.get("name", "") for c in companies),
    ])).lower()


def _source_priority_tier(doc, market_windows, driver_keys=None, company_group_keys=None):
    driver_keys = driver_keys or set()
    company_group_keys = company_group_keys or set()
    key = _doc_key(doc)
    text = _ref_text(doc)
    market_session = doc.get("marketSessionDate") or doc.get("date", "")

    if market_session == market_windows.get("usRegularSessionDate") and is_us_market_close_article(doc):
        return "us_close"
    if doc_market_bucket(doc, market_windows) == "KR 당일 개장/장중":
        return "kr_current_flow"
    if any(t in text for t in ("kospi", "kosdaq", "코스피", "코스닥", "원달러", "원·달러", "외국인", "기관", "개인", "수급", "거래대금")):
        return "korea_market_data"
    if any(t in text for t in ("semiconductor", "chip", "hbm", "nvidia", "반도체", "엔비디아", "소부장", "전기전자")):
        return "semiconductor"
    if any(t in text for t in ("금리", "국채", "채권", "달러", "환율", "유가", "원유", "지정학", "중동", "fed", "treasury", "oil", "geopolitical")):
        return "macro_market"
    if key in driver_keys:
        return "core_driver"
    if key in company_group_keys:
        return "leading_company"
    if market_connection_score(doc) >= 20:
        return "market_flow"
    return "support"


def _reference_sort_key(doc, market_windows):
    score = doc.get("briefingDocScore")
    if score is None:
        score = briefing_doc_score(doc, market_windows)
    return (_REF_TIER_RANK.get(doc.get("refTier", "support"), 0), score, doc.get("date", ""))


def prioritized_source_refs(docs, market_windows, limit=14, issue_coverage=None):
    rows = []
    for d in docs or []:
        d["refTier"] = _source_priority_tier(d, market_windows)
        rows.append(d)
    ranked = sorted(rows, key=lambda x: _reference_sort_key(x, market_windows), reverse=True)
    if issue_coverage:
        issue_docs, _ = select_diverse_documents(
            issue_coverage, market_windows, limit=max(limit, 14), per_publisher=4, minimum_publishers=5,
        )
        issue_keys = {_doc_key(doc) for doc in issue_docs}
        ranked = issue_docs + [doc for doc in ranked if _doc_key(doc) not in issue_keys]
    diverse, _ = diversify_ranked_documents(
        ranked, limit=limit, per_publisher=4, minimum_publishers=5,
    )
    return source_refs(diverse, limit=limit)


def clean_brief_text(text, limit=420):
    text = normalize(text)
    text = re.sub(r"Original link:\s*https?://\S+", " ", text, flags=re.I)
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"(^|\s)#\s*", " ", text)
    text = re.sub(r"\s+-\s+Reuters\s*$", "", text, flags=re.I)
    text = re.sub(r"\s+", " ", text).strip(" -")
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0]
    return cut.rstrip(".,;:") + "..."


def _doc_key(doc):
    return doc.get("url") or doc.get("path")


def snapshot_staleness_note(market_snapshot, market_windows):
    """시장 가격 스냅샷의 미국 주가 데이터 기준일이 브리핑의 미국 정규장 기준일보다
    이전이면(=당일 EOD 일봉 미반영) 경고 문구를 만든다. 그렇지 않으면 빈 문자열.

    이렇게 하지 않으면 거래 캘린더상 '미국장 D-1'을 기준으로 쓰면서도, 스냅샷의
    1D 등락률은 그 전 거래일 결과를 가리켜 날짜와 숫자가 어긋난다.
    """
    if not (market_snapshot and market_snapshot.get("ok")):
        return ""
    snap_date = market_snapshot.get("latestUsEquityDate")
    us_date = (market_windows or {}).get("usRegularSessionDate")
    if not snap_date or not us_date or snap_date >= us_date:
        return ""
    return "\n".join([
        "## 시장 스냅샷 날짜 주의 (중요)",
        f"위 시장 가격 스냅샷의 미국 주가 데이터는 {snap_date} 종가까지만 반영돼 있고, 이번 브리핑의 미국 정규장 기준일({us_date}) 종가는 아직 포함되어 있지 않습니다.",
        f"- 따라서 스냅샷의 1D 등락률(지수·QQQ·VIX 등)은 {us_date}가 아니라 {snap_date} 장 결과입니다. 이 숫자를 {us_date} 정규장 결과처럼 제시하지 마세요.",
        f"- {us_date} 미국장 결과는 로컬 기사에서 확인되는 범위로만 서술하고, 스냅샷 수치를 인용할 때는 그 수치가 {snap_date} 종가 기준임을 명시하세요.",
        "- 스냅샷의 5D·기간 등락률도 같은 기준일 한도 안에서만 사용하세요.",
    ])


def _fmt_num(value, digits=2):
    if value is None:
        return "확인 안 됨"
    try:
        return f"{float(value):,.{digits}f}"
    except Exception:
        return "확인 안 됨"


def _fmt_pct(value):
    if value is None:
        return "등락률 확인 안 됨"
    try:
        return f"{float(value):+.2f}%"
    except Exception:
        return "등락률 확인 안 됨"


def _fmt_krw(value):
    if value is None:
        return "확인 안 됨"
    try:
        value = float(value)
    except Exception:
        return "확인 안 됨"
    sign = "-" if value < 0 else ""
    value = abs(value)
    if value >= 1_0000_0000_0000:
        return f"{sign}{value / 1_0000_0000_0000:.2f}조원"
    if value >= 1_0000_0000:
        return f"{sign}{value / 1_0000_0000:.0f}억원"
    return f"{sign}{value:,.0f}원"


def korea_market_data_to_markdown(korea_market_data):
    data = korea_market_data or {}
    provider = data.get("provider") or "미확인"
    warnings = data.get("warnings") or []
    if not data.get("ok"):
        lines = [
            f"한국장 시장 수치를 불러오지 못했습니다(provider={provider}).",
            "- 입력 자료에서 한국장 종가 등락률은 확인되지 않는다.",
        ]
        if warnings:
            lines.append(f"- provider 경고: {'; '.join(str(w) for w in warnings[:3])}")
        fx = (data.get("fx") or {}).get("USDKRW") if isinstance(data.get("fx"), dict) else None
        if fx:
            lines.append(f"- 원·달러 환율: {_fmt_num(fx.get('close'), 2)}원 / {_fmt_pct(fx.get('changePct'))} ({fx.get('asOfDate', '')}, {fx.get('source', '')})")
        return "\n".join(lines)

    lines = [f"provider: {provider} (date={data.get('date', '')})"]
    indices = data.get("indices") or {}
    for label in ("KOSPI", "KOSDAQ", "KOSPI200"):
        item = indices.get(label) or {}
        if not item:
            lines.append(f"- {label}: 입력 자료에서 종가/등락률 확인 안 됨")
            continue
        lines.append(
            f"- {label}: {_fmt_num(item.get('close'), 2)} / {_fmt_pct(item.get('changePct'))} / "
            f"거래대금 {_fmt_krw(item.get('tradingValue'))} ({item.get('asOfDate', '')})"
        )

    flows = data.get("investorFlows") or {}
    if flows:
        for market, item in flows.items():
            lines.append(
                f"- 투자자별 수급({market}): 외국인 {_fmt_krw(item.get('foreign'))} / "
                f"기관 {_fmt_krw(item.get('institution'))} / 개인 {_fmt_krw(item.get('individual'))}"
            )
    else:
        lines.append("- 투자자별 수급: 입력 자료에서 외국인/기관/개인 순매수 확인 안 됨")

    sectors = data.get("sectors") or []
    if sectors:
        top_up = [s for s in sectors if s.get("changePct") is not None][:3]
        top_down = sorted(
            [s for s in sectors if s.get("changePct") is not None],
            key=lambda s: s.get("changePct") or 0,
        )[:3]
        if top_up:
            lines.append("- 주요 업종 상승 상위: " + ", ".join(f"{s.get('label')} {_fmt_pct(s.get('changePct'))}" for s in top_up))
        if top_down:
            lines.append("- 주요 업종 하락 상위: " + ", ".join(f"{s.get('label')} {_fmt_pct(s.get('changePct'))}" for s in top_down))
    else:
        lines.append("- 주요 업종: 입력 자료에서 업종별 등락률 확인 안 됨")

    fx = (data.get("fx") or {}).get("USDKRW") if isinstance(data.get("fx"), dict) else None
    if fx:
        lines.append(f"- 원·달러 환율: {_fmt_num(fx.get('close'), 2)}원 / {_fmt_pct(fx.get('changePct'))} ({fx.get('asOfDate', '')}, {fx.get('source', '')})")
    else:
        lines.append("- 원·달러 환율: 확인 안 됨")
    if warnings:
        lines.append(f"- provider 경고: {'; '.join(str(w) for w in warnings[:3])}")
    return "\n".join(lines)


def build_llm_context(
    date,
    source_date,
    docs,
    groups,
    market_drivers=None,
    market_snapshot=None,
    memories=None,
    market_windows=None,
    prev_checklist=None,
    korea_market_data=None,
    market_scope="both",
    briefing_type="default",
    issue_coverage=None,
    session_modes=None,
):
    market_windows = market_windows or briefing_market_windows(date)
    market_scope = normalize_market_scope(market_scope)
    briefing_type = normalize_briefing_type(briefing_type)
    docs = documents_for_scope(docs, market_scope)
    doc_keys = {_doc_key(doc) for doc in docs}
    groups = [
        {**group, "docs": [doc for doc in group.get("docs", []) if _doc_key(doc) in doc_keys]}
        for group in (groups or [])
    ]
    groups = [group for group in groups if group.get("docs")]
    market_drivers = [
        {**driver, "docs": [doc for doc in driver.get("docs", []) if _doc_key(doc) in doc_keys]}
        for driver in (market_drivers or [])
    ]
    market_drivers = [driver for driver in market_drivers if driver.get("docs")]
    issue_coverage = list(issue_coverage or [])
    session_modes = session_modes or session_modes_from_windows(market_windows)

    # 자료를 tier별로 선별한다.
    #   driver: 핵심 시장 동인 상위 자료 → 길게 제공
    #   group : 회사/섹터 묶음 상위 자료 → 중간
    #   support: 나머지 보조 자료 → 짧게
    selected = []
    seen = set()
    driver_keys = set()
    group_keys = set()
    company_group_keys = set()

    def _add(d, bucket_keys):
        key = _doc_key(d)
        if not key or key in seen:
            return
        seen.add(key)
        selected.append(d)
        if bucket_keys is not None:
            bucket_keys.add(key)

    diversity_warnings = []
    for driver in market_drivers:
        for d in driver.get("docs", [])[:3]:
            _add(d, driver_keys)
    # 미국 정규장 당일(usRegularSessionDate) 마감 시황 기사는 '시장 흐름' 섹션에서
    # 미국장 수치의 유일한 근거다(발행일 보정 후 marketSessionDate 기준). 24개 슬롯이
    # driver/group으로 다 차서 밀려나면 LLM이 미국장 결과를 못 쓰므로, 점수 상위 몇 건을
    # 반드시 컨텍스트에 포함시킨다.
    # usRegularSessionDate == krPreviousSessionDate(같은 날)일 때 doc_market_bucket이
    # 미국 기업을 언급한 한국 코스피 기사까지 'US 전일 정규장'으로 잡으므로, 버킷이 아니라
    # '한국 언론 뉴욕증시 마감 기사(is_us_market_close_article)'로 정확히 필터링한다.
    us_session_date = market_windows.get("usRegularSessionDate")
    if us_session_date:
        us_session_docs = sorted(
            (d for d in docs
             if (d.get("marketSessionDate") or d.get("date", "")) == us_session_date
             and is_us_market_close_article(d)),
            key=lambda d: briefing_doc_score(d, market_windows), reverse=True,
        )
        for d in us_session_docs[:3]:
            _add(d, group_keys)
    # weekday_kr_open: 한국 D 개장/장중 자료도 driver/group 경쟁에서 밀리지 않도록
    # 고정 슬롯을 준다. 이렇게 해야 시장 흐름 섹션의 한국 당일 주 분석축이 실제로 채워진다.
    kr_current_keys = set()
    kr_current_date = market_windows.get("krCurrentSessionDate")
    if market_windows.get("analysisMode") == "weekday_kr_open" and kr_current_date:
        kr_current_docs = sorted(
            (d for d in docs if doc_market_bucket(d, market_windows) == "KR 당일 개장/장중"),
            key=lambda d: briefing_doc_score(d, market_windows), reverse=True,
        )
        for d in kr_current_docs[:4]:
            _add(d, group_keys)
            kr_current_keys.add(_doc_key(d))
    if issue_coverage:
        issue_docs, diversity_warnings = select_diverse_documents(
            issue_coverage, market_windows, limit=18, per_publisher=4, minimum_publishers=5,
        )
        for d in issue_docs:
            _add(d, driver_keys)
    for group in groups[:6]:
        # 그룹 상위 자료도 sourceWeight가 아니라 브리핑 적합도(시장 반응 연결성 포함)로
        # 뽑는다 → 출처만 유명하고 본문은 시장과 무관한 기사가 상단에 끼는 것을 막는다.
        ranked = sorted(group.get("docs", []), key=lambda d: briefing_doc_score(d, market_windows), reverse=True)[:4]
        is_company_group = bool(group.get("company"))
        for d in ranked:
            _add(d, group_keys)
            if is_company_group:
                company_group_keys.add(_doc_key(d))
    if len(selected) < 18:
        # 패딩은 단순 최신순이 아니라 브리핑 적합도(시장 반응 연결성 포함)가 높은
        # 자료부터 채운다 → broad keyword만 걸린 단발 기사가 채워지는 것을 막는다.
        ranked_rest = sorted(docs, key=lambda d: briefing_doc_score(d, market_windows), reverse=True)
        for d in ranked_rest:
            if len(selected) >= 24:
                break
            _add(d, None)

    selected, cap_warnings = diversify_ranked_documents(
        selected, limit=24, per_publisher=4, minimum_publishers=5,
    )
    diversity_warnings.extend(warning for warning in cap_warnings if warning not in diversity_warnings)

    def _tier(doc):
        key = _doc_key(doc)
        if key in driver_keys:
            return "driver"
        if key in group_keys:
            return "group"
        return "support"

    from features.common.market_data.snapshot import snapshot_to_markdown
    market_memory_context = render_market_memory_context(MARKET_MEMORY_DB_PATH)
    lines = [
        f"브리핑 대상일: {date}",
        f"사용 자료 날짜: {source_date}",
        f"시장 범위(marketScope): {market_scope}",
        f"브리핑 유형(briefingType): {briefing_type}",
        f"미국장 세션 모드: {session_modes.get('us', '')}",
        f"한국장 세션 모드: {session_modes.get('kr', '')}",
        "",
        "## 브리핑 분석 모드",
        f"analysisMode: {market_windows.get('analysisMode', '')}",
        market_windows.get("sessionPriorityRule", ""),
        f"- 주요 분석축(primary): {', '.join(market_windows.get('primarySessions', [])) or '없음'}",
        f"- 보조 분석축(secondary/off_session_news): {', '.join(market_windows.get('secondarySessions', [])) or '없음'}",
        (
            f"- 주말/휴장 새 뉴스 구간: {market_windows.get('offSessionNewsWindow', {}).get('start', '')} ~ {market_windows.get('offSessionNewsWindow', {}).get('end', '')} "
            "(이 구간 뉴스는 현재 가격 반응이 아니라 다음 거래일 반영 후보로 다루세요)"
            if market_windows.get("weekendOrHolidayNewsMode")
            else "- 주말/휴장 새 뉴스 구간: 해당 없음(평일 정규장 모드)"
        ),
        "아래 '기사/자료 원문 요약'의 각 자료에는 분석우선순위(primary/secondary/background/off_session_news)가 표시됩니다. primary 자료를 시장 흐름·핵심 변수의 중심 근거로 쓰고, background는 배경 맥락으로만, off_session_news는 다음 거래일 반영 후보로 쓰세요.",
        (
            "주말/휴장 모드에서는 2번 '시장을 움직인 핵심 변수'와 3~4번 '시장을 주도한 기업' 섹션을 off_session_news(주말/휴장 사이 새 뉴스) 중심으로 구성하세요. 최근 정규장 자료는 1번 시장 흐름에서 간결히 복기하는 배경으로 쓰고, 핵심 변수/기업 섹션에서 새 뉴스의 다음 거래일 반영 가능성과 확인 조건을 우선 다루세요."
            if market_windows.get("weekendOrHolidayNewsMode")
            else ""
        ),
        (
            f"weekday_kr_open 모드: '시장 흐름' 섹션에 반드시 한국 {market_windows.get('krCurrentSessionDate', '')} 개장 후/장중 흐름을 별도 문단으로 작성하세요. 한국 전일({market_windows.get('krPreviousSessionDate', '')}) 정규장은 배경 맥락으로만 쓰고 한국 당일 장중 문단을 대체하지 않습니다. 한국 당일 장중 직접 지수·수급 수치가 자료에 없으면 '확인되지 않는다'고 명시하되, 한국 당일 장중 자료에서 확인되는 뉴스 흐름은 따로 다루세요."
            if market_windows.get("analysisMode") == "weekday_kr_open"
            else ""
        ),
        "",
        "## 한미 시장 시차 기준",
        market_windows.get("rule", ""),
        ("휴장/주말 메모: " + " ".join(market_windows.get("closedNotes", []))) if market_windows.get("closedNotes") else "휴장/주말 메모: 특이사항 없음",
        f"- 미국장 기준: {market_windows.get('usRegularSessionDate', '')} 정규장 마감 결과와 그 이후 확인된 미국 관련 뉴스",
        (
            f"- 한국장 기준: {market_windows.get('krPreviousSessionDate', '')} 정규장 결과 + {market_windows.get('krCurrentSessionDate', '')} 개장 후/장중 시황"
            if market_windows.get("krCurrentSessionOpen")
            else f"- 한국장 기준: {market_windows.get('krPreviousSessionDate', '')} 정규장 결과. 브리핑 대상일이 한국 휴장/주말이면 당일 장중 시황으로 쓰지 마세요."
        ),
        "- 미국장 마감 이후 나온 뉴스는 한국장에 이미 반영됐다고 단정하지 말고, 한국 당일 장중 자료가 있는 경우에만 반영 여부를 언급하세요.",
        "- 한국 당일 장중 자료는 전일 종가 결과와 구분해서 '개장 후/장중 흐름'으로 표현하세요.",
        "",
        market_memory_context,
        "",
        f"최신 자료 수: {len(docs)}",
        "",
        "아래 자료만 근거로 사용하세요. 본문에 없는 숫자나 시장 수치는 추정하지 마세요.",
        "자료에 지수/금리/환율/수급 숫자가 부족하면 그 한계를 명시하고, 기사에서 확인되는 시장 반응 중심으로 분석하세요.",
        "",
        "## 시장 가격 스냅샷",
        snapshot_to_markdown(market_snapshot or {"ok": False, "error": "snapshot not available"}),
        snapshot_staleness_note(market_snapshot, market_windows),
        "",
        "## 한국장 시장 수치",
        korea_market_data_to_markdown(korea_market_data),
        "",
        "## 시장 수치 사용 지침",
        "'시장 흐름' 섹션을 쓸 때는 위 시장 가격 스냅샷, 한국장 시장 수치, 입력 자료에서 확인되는 핵심 수치를 반드시 먼저 확인하세요.",
        "- **정규장 마감 결과 수치는 로컬 기사를 1순위로 확인하세요.** 미국장·한국장의 마감 지수·등락률은 로컬 기사(예: '뉴욕증시 브리핑', 증시 마감 시황 기사)에 그 거래일 기준으로 명시되는 경우가 많습니다. 이 마감 수치를 우선 근거로 쓰고, 시장 가격 스냅샷은 보조·교차검증용으로만 쓰세요. 스냅샷은 당일 EOD 일봉이 늦게 반영돼 기준일이 정규장 기준일보다 하루 이전일 수 있습니다(위 '기준일' 열과 날짜 주의 문구 확인).",
        "- 수치가 있으면: 미국 주요 지수와 핵심 ETF/자산가격(Dow, S&P500, Nasdaq, Russell, 반도체지수, QQQ/SPY/RSP, VIX, 10년물 금리, TLT, DXY, WTI, 금)으로 미국장 성격을, KOSPI·KOSDAQ·원달러 환율·외국인/기관/개인 수급으로 한국장 성격을 설명하세요.",
        "- 한국 D 장중/마감 흐름을 설명할 때 가능한 한 '한국장은 KOSPI가 전일 대비 X%, KOSDAQ이 Y%로 마감했다. 장 초반에는 ...였지만, 장 후반에는 ...로 회복했다.' 형식을 따르세요.",
        "- 한국장 수치 블록에 KOSPI/KOSDAQ 종가 등락률이 없으면 '입력 자료에서 한국장 종가 등락률은 확인되지 않는다'고 명시하고 수치를 추정하지 마세요.",
        "- 수치는 단순 나열하지 말고, 장의 강도와 성격을 해석하는 근거로 사용하세요(핵심 수치 → 장의 성격 → 미국·한국 연결/차별화 순).",
        "- 수치를 인용할 때는 그 수치가 어느 거래일 기준인지 명확히 하세요. 스냅샷 기준일과 정규장 기준일이 다르면 로컬 기사 수치를 우선하고, 스냅샷 숫자는 그 기준일을 밝혀서만 쓰세요.",
        f"- **미국장 결과 수치는 '시장기준일'이 미국 정규장 기준일({market_windows.get('usRegularSessionDate', '')})과 같은 자료만 사용하세요.** 아래 '기사/자료 원문 요약'의 각 자료에는 시장기준일이 표시됩니다. 시장기준일이 다른 자료(예: 발행일은 같아도 실제로는 전 거래일을 다룬 뉴욕증시 마감 기사)의 지수·등락률을 현재 미국장 결과처럼 쓰지 마세요.",
        f"- 시장 가격 스냅샷 수치는 스냅샷 미국 주가 기준일이 미국 정규장 기준일({market_windows.get('usRegularSessionDate', '')})과 같을 때만 해당 미국장 결과로 쓰세요.",
        f"- 위 두 가지가 모두 없으면 '입력 자료에서 해당 미국장({market_windows.get('usRegularSessionDate', '')}) 직접 수치는 확인되지 않는다'고 명시하세요.",
        "- 수치가 없으면: 입력 자료에서 직접 수치는 확인되지 않는다고 명시하고, 확인되지 않는 수치는 추정하지 마세요.",
        "",
        "## 미국장 거래일 혼동 방지 (중요)",
        "한국 언론의 뉴욕증시 마감/브리핑 기사는 발행일과 실제 미국 정규장 기준일이 하루 다를 수 있습니다.",
        "- 예: 한국시간 2026-06-09 오전 발행 뉴욕증시 브리핑은 보통 미국 2026-06-08 정규장 마감 기사입니다.",
        f"- 이번 브리핑에서 미국 {market_windows.get('usRegularSessionDate', '')} 정규장 결과를 설명할 때는 시장기준일이 {market_windows.get('usRegularSessionDate', '')}인 자료만 현재 미국장 결과로 사용하세요.",
        "- 기사 발행일만 보고 미국장 거래일을 단정하지 마세요. 아래 '기사/자료 원문 요약'에 표시된 '시장기준일(추정)'을 따르세요.",
        "",
        "## 시장 범위 출력 지침",
        (
            "미국장 브리핑만 작성하세요. 한국 자료는 미국 기업·섹터의 실제 파급을 설명하는 보조 근거로만 사용하고 한국장 일반 시황 섹션을 만들지 마세요."
            if market_scope == "us"
            else "한국장 브리핑만 작성하세요. 미국 자료는 한국장에 이미 반영됐는지 또는 다음 한국장 반영 후보인지 시간차를 구분하는 보조 근거로만 사용하세요."
            if market_scope == "kr"
            else "US Market Briefing과 Korea Market Briefing을 각각 완결형으로 작성하세요. 두 시장을 합치거나 별도의 한미 시장 연결 요약 섹션을 추가하지 말고, 연결 근거는 각 시장 본문 안에서만 짧게 설명하세요."
        ),
        "최종 Markdown은 시장별 제목(`# US Market Briefing — YYYY.MM.DD`, `# Korea Market Briefing — YYYY.MM.DD`) 다음에 바로 `## 0. 오늘의 ... 성격`으로 시작하세요. 제목과 0번 섹션 사이에 브리핑 대상, 시장 범위, 세션 모드, 자료 선별 방식, 날짜 해석 설명, blockquote를 넣지 마세요.",
        f"- 브리핑 유형 지침: {briefing_type_instruction(briefing_type)}",
        "각 주요 섹션은 '한 줄 결론 + 가운뎃점 3~4개 + 기존 줄글 해설' 순서로 쓰고, 요약이 줄글을 대체하지 않게 하세요.",
        "장중 모드는 종가처럼 단정하지 말고 '현재까지/장중 기준'으로, 휴장·off-session 모드는 다음 거래일 반영 후보로 표현하세요.",
        "",
        "## 이슈 선별·출처 다양성 지침",
        "기사 수가 많은 이슈를 중요하다고 간주하지 마세요. 아래 issueCoverage의 독립 매체 수, 출처 권위, 시장 반응, 재전송 제거 결과를 우선하세요.",
        "미국장은 Reuters·WSJ·Financial Times·Bloomberg 등 해외 핵심 매체와 미국 가격 반응을 우선하고, 국내 매체의 미국장 보도는 보조자료로 사용하세요.",
        "한국장은 국내 수급·환율·업종 자료를 중심으로 하되 해외 핵심 매체가 독립 보도한 한국 이슈는 국제적 중요도 신호로 반영하세요.",
        "재전송 기사와 같은 매체의 반복 기사는 독립 확인으로 세지 마세요.",
    ]
    if diversity_warnings:
        lines.append("출처 다양성 경고: " + " / ".join(diversity_warnings))
    if issue_coverage:
        lines += ["", "## issueCoverage (구조화 선별 근거)"]
        for issue in issue_coverage[:10]:
            representatives = ", ".join(
                canonical_publisher(doc) for doc in issue.get("representativeDocs", [])[:4]
            ) or "미상"
            lines.append(
                f"- issue={issue.get('issueId', '')} | market={issue.get('market', '')} "
                f"| score={issue.get('issueScore', 0)} | publishers={issue.get('publisherCount', 0)} "
                f"| breadth={issue.get('weightedPublisherBreadth', 0)} "
                f"| concentration={issue.get('sourceConcentration', 0)} "
                f"| crossRegion={issue.get('crossRegionStatus', '')} "
                f"| marketImpact={issue.get('marketImpactStatus', '')}/{issue.get('marketImpactScore')} "
                f"| representativeSources={representatives}"
            )
    lines += [
        "",
        "## 최근 반복된 시장 흐름 요약",
    ]
    for mem in (memories or [])[:8]:
        tags = ", ".join(mem.get("tags", [])[:8]) or "없음"
        ontology = " / ".join(
            item
            for item in [
                mem.get("category", ""),
                mem.get("region", ""),
                mem.get("importance", ""),
                mem.get("eventKind", ""),
            ]
            if item
        )
        lines.append(
            f"- {mem.get('date', '')} | {mem.get('title', '')} | story={mem.get('story', '')} "
            f"| family={mem.get('storyFamily', '')} | {ontology} | tags={tags}\n"
            f"  thesis: {mem.get('storyThesis', '')}\n"
            f"  summary: {mem.get('summary', '')}"
        )
    if not memories:
        lines.append("- 참고할 만한 누적 시장 흐름 요약 없음")
    if prev_checklist:
        lines += [
            "",
            "## 전일 브리핑 체크포인트",
            "아래는 전일 브리핑에서 '오늘 확인할 것'으로 남긴 항목입니다.",
            "오늘 자료에서 각 항목의 진행 상황을 확인하고, 브리핑 본문과 새 체크리스트에 반영하세요.",
            "결과가 확인된 항목은 '→ 결과: ...' 형태로 간단히 언급해도 됩니다.",
            "",
            prev_checklist,
        ]
    if market_drivers:
        lines += [
            "",
            "## 핵심 변수 후보",
            "",
            "아래는 브리핑 날짜의 미국장/한국장 시간창, 출처 신뢰도, 시장 관련성, 본문 품질, 영향 태그, 시장시간대, 중복 제거를 기준으로 선별한 핵심 변수 후보입니다.",
            "자료 수가 많은 변수가 반드시 가장 중요한 변수는 아닙니다. 가격 반응, 시장시간대, 출처 다양성, 금리·환율·수급·실적·정책 경로로 시장을 설명하는 힘이 큰 변수를 우선 분석하세요.",
            (
                "주말/휴장 모드에서는 off_session_news가 포함된 후보를 우선 분석하세요. 이 후보들은 현재 시장이 이미 반응한 재료가 아니라 다음 거래일 가격·수급 반응을 확인해야 할 재료입니다."
                if market_windows.get("weekendOrHolidayNewsMode")
                else ""
            ),
        ]
        for i, driver in enumerate(market_drivers, 1):
            markets = ", ".join(driver.get("markets", [])) or "미상"
            sources = ", ".join(driver.get("sources", [])) or "미상"
            tags = ", ".join(driver.get("impactTags", [])[:6]) or "없음"
            sectors = ", ".join(driver.get("sectors", [])[:6]) or "없음"
            lines.append(
                f"\n{i}. driver={driver.get('driver', '')} | score={driver.get('score', 0):.1f} "
                f"| markets={markets} | sources={sources} | tags={tags} | sectors={sectors}"
            )
            for dd in driver.get("docs", [])[:3]:
                dtitle = clean_brief_text(dd.get("title", ""), 160)
                dbrief = clean_brief_text(dd.get("summary") or dd.get("content") or "", 320)
                lines.append(
                    f"   - [{dd.get('source', '')}, {dd.get('date', '')}, {dd.get('marketBucket', '')}, "
                    f"score={dd.get('briefingDocScore', 0):.1f}] {dtitle}"
                )
                if dbrief and dbrief.lower() != dtitle.lower():
                    lines.append(f"     요약: {dbrief}")

    lines += [
        "",
        "## 후보 이슈 묶음",
    ]
    for i, group in enumerate(groups[:6], 1):
        subject = group.get("company") or group.get("sector") or "시장"
        tags = []
        for d in group.get("docs", []):
            for tag in d.get("impactTags", []) + d.get("sectors", []):
                if tag and tag not in tags:
                    tags.append(tag)
        lines.append(f"\n{i}. {subject} | 태그: {', '.join(tags[:6]) or '없음'} | 관련자료: {len(group.get('docs', []))}건")
        # sourceWeight가 아니라 브리핑 적합도(분석 우선순위 가중 포함)로 정렬해 KR D-1
        # 정규장 자료가 계속 상단에 노출되지 않게 한다.
        for gd in sorted(group.get("docs", []), key=lambda d: briefing_doc_score(d, market_windows), reverse=True)[:3]:
            gtitle = clean_brief_text(gd.get("title", ""), 160)
            gbrief = clean_brief_text(gd.get("summary") or gd.get("content") or "", 240)
            suffix = f" — {gbrief}" if gbrief and gbrief.lower() != gtitle.lower() else ""
            lines.append(f"   [{doc_analysis_priority(gd, market_windows)} | {doc_market_bucket(gd, market_windows)} | {gd.get('source', '')}] {gtitle}{suffix}")

    lines.append("")
    lines.append("## 기사/자료 원문 요약")
    lines.append("핵심 변수 자료는 길게, 주도 기업/섹터 자료는 중간, 보조 자료는 짧게 제공합니다.")
    tier_label = {"driver": "핵심 변수", "group": "주도 기업/섹터", "support": "보조"}
    for i, d in enumerate(selected, 1):
        tier = _tier(d)
        title = clean_brief_text(d.get("title", ""), 220)
        summary = briefing_doc_excerpt(d, clean_brief_text, tier)
        companies = ", ".join(c.get("name", "") for c in d.get("companies", [])) or "없음"
        tags = ", ".join((d.get("impactTags", []) + d.get("sectors", []))[:8]) or "없음"
        url = d.get("url", "")
        lines.append(
            f"[{i}] 자료등급: {tier_label[tier]} | 분석우선순위: {doc_analysis_priority(d, market_windows)} | 출처: {canonical_publisher(d)} | 본문가용성: {d.get('bodyAvailability', '미상')} | 발행일: {d.get('date', '')} | 시장기준일(추정): {d.get('marketSessionDate') or d.get('date', '')} | 시장시간대: {doc_market_bucket(d, market_windows)} | 기업: {companies} | 태그: {tags}\n"
            f"제목: {title}\n"
            f"요약: {summary}\n"
            f"URL: {url or '(local file: ' + d.get('path', '') + ')'}\n"
        )

    # 참고자료 우선순위 4단계: 핵심 동인(core_driver) → 주도 기업(leading_company)
    # → 시장 가격/수급 흐름 연결(market_flow) → 나머지(support).
    # 같은 등급 안에서는 단순 최신순이 아니라 브리핑 적합도(시장 반응 연결성 포함)가
    # 높은 자료를 우선해, driver 키워드만 스친 단발 기사가 상단에 올라오지 않게 한다.
    # (source_refs가 앞에서부터 N개를 취하므로 정렬 순서가 곧 참고자료 우선순위가 된다.)
    def _ref_tier(doc):
        return _source_priority_tier(doc, market_windows, driver_keys, company_group_keys)

    for d in selected:
        d["refTier"] = _ref_tier(d)
    selected_for_refs = sorted(selected, key=lambda d: _reference_sort_key(d, market_windows), reverse=True)
    selected_for_refs, final_warnings = diversify_ranked_documents(
        selected_for_refs, limit=24, per_publisher=4, minimum_publishers=5,
    )
    for warning in final_warnings:
        if warning not in diversity_warnings:
            diversity_warnings.append(warning)
    return "\n".join(lines), selected_for_refs


def generate_llm_briefing(date, source_date, docs, groups, market_drivers=None, web_search_override=None, llm_override=None, market_snapshot=None, memories=None, market_windows=None, prev_checklist=None, korea_market_data=None, quality_preflight=None, market_scope="both", briefing_type="default", issue_coverage=None, session_modes=None):
    cfg = selected_llm_config()
    llm_on = cfg["enabled"] if llm_override is None else bool(llm_override)
    if not llm_on:
        return None, "disabled"
    if not cfg["apiKey"]:
        return None, f"missing_{cfg['provider']}_api_key"
    prompt = read_briefing_prompt(market_scope)
    if not prompt:
        return None, "missing_prompt"
    context, used_docs = build_llm_context(
        date,
        source_date,
        docs,
        groups,
        market_drivers=market_drivers,
        market_snapshot=market_snapshot,
        memories=memories,
        market_windows=market_windows,
        prev_checklist=prev_checklist,
        korea_market_data=korea_market_data,
        market_scope=market_scope,
        briefing_type=briefing_type,
        issue_coverage=issue_coverage,
        session_modes=session_modes,
    )
    target_block = render_quality_target_context(
        "briefing",
        preflight=quality_preflight,
        context={"extraRoutes": [
            "브리핑 입력은 articles/rss만 사용한다. filings/reports는 브리핑 근거로 쓰지 않는다.",
            "한국장 종가·수급이 없으면 KRX/CSV/yfinance provider 한계를 Source & Data Notes에 남긴다.",
        ]},
    )
    context = "\n\n".join([context, target_block])
    context = "\n\n".join([
        context,
        build_preflight_evidence_context(
            "briefing",
            preflight=quality_preflight,
            artifact={
                "sources": used_docs,
                "stats": {"sourceCount": len(used_docs)},
                "dataGaps": [],
            },
        ),
    ])
    hint_block = render_prompt_hints(quality_preflight)
    if hint_block:
        context = "\n\n".join([context, hint_block])
    web_search = use_web_search_for_briefing() if web_search_override is None else bool(web_search_override)
    web_status = "web_search" if web_search else "local_only"
    try:
        max_tokens = int(os.environ.get("LLM_MAX_OUTPUT_TOKENS", os.environ.get("OPENAI_MAX_OUTPUT_TOKENS", "7000")))
        if cfg["provider"] == "gemini":
            text, response_id, usage = request_gemini(cfg, prompt, context, web_search=web_search, include_usage=True)
        elif cfg["provider"] == "claude":
            text, response_id, usage = request_claude(cfg, prompt, context, web_search=web_search, include_usage=True)
        else:
            text, response_id, usage = request_openai(cfg, prompt, context, web_search=web_search, include_usage=True)
        if not text:
            return None, "empty_response"
        text = strip_llm_citation_markers(text)
        return {
            "markdown": text,
            "provider": cfg["provider"],
            "model": cfg["model"],
            "usedDocs": used_docs,
            "responseId": response_id,
            "webSearch": web_search,
            "tokenUsage": normalize_token_usage(usage, prompt=prompt, context=context, output=text, max_output_tokens=max_tokens),
        }, f"ok_{web_status}"
    except Exception as exc:
        return None, f"error: {exc}"


_LINK_LLM_SYSTEM_PROMPT = (
    "당신은 한미 시장 연결 분석가입니다. 주어진 '연결 분석 초안'과 구조화된 동인 목록만으로 "
    "미국장과 한국장의 연결을 더 깊고 읽기 쉽게 다듬으세요.\n"
    "규칙:\n"
    "- 제목은 정확히 `## 한미 시장 연결 분석` 으로 시작합니다.\n"
    "- 새로운 수치·출처·종목을 지어내지 않습니다(주어진 동인·상태 범위 안에서만 해석).\n"
    "- 구성: 공통 흐름, 시장별 고유 동인, 스필오버(미국 전일 마감 → 한국 당일 개장), "
    "시나리오(기본/낙관/비관), 반론·디버전스, 그리고 마지막 `### 한계와 불확실성`.\n"
    "- 인과를 단정하지 말고, 반드시 한계와 불확실성을 한국어로 명시합니다.\n"
    "- 한국어 Markdown만 출력합니다."
)


def _valid_link_markdown(text):
    if not text or "## 한미 시장 연결 분석" not in text:
        return False
    if not any(token in text for token in ("한계", "불확실")):
        return False
    return len(text.strip()) >= 80


def llm_enhance_link_analysis(link, *, market_windows=None, llm_override=None, web_search_override=None):
    """Deepen the rule-based US↔KR link analysis with the LLM.

    Returns enhanced Markdown, or None so the caller keeps the rule-based
    markdown (LLM off / no key / invalid or empty output / any error).
    Source-grounded: the prompt forbids inventing numbers, sources, or tickers
    beyond the supplied drivers, and requires an explicit uncertainty section.
    """
    cfg = selected_llm_config()
    llm_on = cfg["enabled"] if llm_override is None else bool(llm_override)
    if not llm_on or not cfg.get("apiKey"):
        return None
    link = link or {}
    windows = market_windows or {}

    def _names(values):
        return ", ".join(values) if values else "(없음)"

    context = "\n".join([
        f"연결 상태: {link.get('status', '')}",
        f"공통 동인: {_names(link.get('sharedDrivers') or [])}",
        f"미국장 고유 동인: {_names(link.get('usOnlyDrivers') or [])}",
        f"한국장 고유 동인: {_names(link.get('krOnlyDrivers') or [])}",
        f"미국 직전 정규장: {windows.get('usPreviousSessionDate', '')}",
        f"한국 당일 세션: {windows.get('krCurrentSessionDate') or windows.get('krPreviousSessionDate', '')}",
        "",
        "연결 분석 초안:",
        str(link.get("markdown") or ""),
    ])
    web_search = False if web_search_override is None else bool(web_search_override)
    try:
        if cfg["provider"] == "gemini":
            text, _, _ = request_gemini(cfg, _LINK_LLM_SYSTEM_PROMPT, context, web_search=web_search, include_usage=True)
        elif cfg["provider"] == "claude":
            text, _, _ = request_claude(cfg, _LINK_LLM_SYSTEM_PROMPT, context, web_search=web_search, include_usage=True)
        else:
            text, _, _ = request_openai(cfg, _LINK_LLM_SYSTEM_PROMPT, context, web_search=web_search, include_usage=True)
    except Exception:
        return None
    text = strip_llm_citation_markers(text or "").strip()
    return text if _valid_link_markdown(text) else None


def llm_status_message(generation):
    status = generation.get("status", "")
    provider = generation.get("provider", "")
    if generation.get("mode") == "llm":
        suffix = " · 웹 검색 보완 사용" if generation.get("webSearch") else " · 로컬 자료만 사용"
        return f"LLM API 브리핑 생성 완료: {provider} / {generation.get('model', '')}{suffix}"
    if generation.get("mode") == "agent":
        return generation.get("message") or "LLM CLI 브리핑 생성 완료: Agent CLI / context pack 기반"
    if status == "disabled":
        return "LLM 브리핑이 꺼져 있어 규칙 기반 브리핑으로 생성했습니다."
    if status.startswith("missing_"):
        return f"{provider} API 키가 없어 규칙 기반 브리핑으로 생성했습니다."
    if "429" in status or "Too Many Requests" in status:
        return f"{provider} API 사용량 제한 또는 요청 한도 때문에 규칙 기반 브리핑으로 대체했습니다. 잠시 후 다시 시도하거나 다른 Provider를 선택하세요."
    if status.startswith("error:"):
        return f"{provider} LLM 호출 실패로 규칙 기반 브리핑으로 대체했습니다. 상세: {status[7:240]}"
    return "규칙 기반 브리핑으로 생성했습니다."


def choose_leaders(groups):
    leaders = []
    for g in groups:
        company = g.get("company")
        if company and company not in leaders:
            leaders.append(company)
        if len(leaders) >= 2:
            break
    if len(leaders) < 2:
        for g in groups:
            sector = g.get("sector")
            if sector and sector not in leaders:
                leaders.append(sector)
            if len(leaders) >= 2:
                break
    while len(leaders) < 2:
        leaders.append("시장 주도주")
    return leaders[:2]


def doc_sentence(doc):
    title = clean_brief_text(doc.get("title", ""), 180)
    summary = clean_brief_text(doc.get("summary") or doc.get("content") or "", 280)
    if title and summary.lower().startswith(title.lower()):
        summary = summary[len(title):].strip(" .:-")
    source = doc.get("source", "자료")
    if summary and summary.lower() != title.lower():
        return f"{source}는 '{title}'에서 {summary}라고 전했습니다."
    return f"{source}는 '{title}' 이슈를 주요 재료로 다뤘습니다."


def group_digest(group, max_docs=3):
    docs = top_records(group.get("docs", []), ["sourceWeight", "marketRelevance"], max_docs, descending=True)
    return " ".join(doc_sentence(d) for d in docs)


def group_title(group):
    subject = group.get("company") or group.get("sector") or "시장"
    impact_tags = []
    sector_tags = []
    for d in group.get("docs", []):
        impact_tags += d.get("impactTags", [])
        sector_tags += d.get("sectors", [])
    tags = []
    for tag in impact_tags + sector_tags:
        if tag and tag != subject and tag not in tags:
            tags.append(tag)
    variable = ", ".join(tags[:2]) if tags else "실적과 수급"
    return f"{subject}: {variable}"


def _driver_path_words(driver):
    tags = list(dict.fromkeys((driver.get("impactTags") or []) + (driver.get("sectors") or [])))
    return ", ".join(tags[:3]) if tags else "수급과 실적"


def _rule_driver_blocks(market_drivers, top_groups, market_windows=None):
    """규칙 기반 '핵심 시장 동인' 블록. market_drivers가 있으면 우선 사용하고,
    없으면 회사/섹터 그룹을 동인 자리에 대체한다. 굵은 라벨 없이 한 문단의
    자연스러운 해설로 쓰고, 기본 3개로 제한한다."""
    weekend_mode = bool((market_windows or {}).get("weekendOrHolidayNewsMode"))
    blocks = []
    if market_drivers:
        for idx, drv in enumerate(market_drivers[:3], 1):
            name = drv.get("driver", "시장 전반")
            top = drv.get("docs", [])[:2]
            sources = ", ".join(drv.get("sources", [])[:3]) or "수집 자료"
            markets = ", ".join(drv.get("markets", [])[:2]) or "해당 시장"
            digest = " ".join(doc_sentence(d) for d in top) or f"{sources} 자료에서 {name} 관련 보도가 확인됩니다."
            if weekend_mode:
                blocks.append(
                    f"### {idx}. {name}\n\n"
                    f"{digest} 이 흐름은 주말/휴장 사이 새로 들어온 재료로, 아직 정규장 가격 반응이 확인된 것은 아닙니다. "
                    f"{sources} 등에서 반복 확인되며, {_driver_path_words(drv)} 경로로 다음 거래일 {markets}의 가격·수급에 반영되는지 확인해야 합니다."
                )
            else:
                blocks.append(
                    f"### {idx}. {name}\n\n"
                    f"{digest} 이 흐름은 {sources} 등에서 반복 확인되며, {_driver_path_words(drv)} 경로로 {markets}에 주로 반영됐습니다. "
                    f"다음 거래일에는 {name} 관련 가격·수급 반응과 거래대금이 이어지는지 확인해야 합니다."
                )
    else:
        for idx, group in enumerate(top_groups[:3], 1):
            subject = group.get("company") or group.get("sector") or "시장"
            tags = []
            for d in group.get("docs", []):
                for tag in d.get("impactTags", []) + d.get("sectors", []):
                    if tag and tag != subject and tag not in tags:
                        tags.append(tag)
            path_word = ", ".join(tags[:3]) if tags else "실적과 수급"
            if weekend_mode:
                blocks.append(
                    f"### {idx}. {group_title(group)}\n\n"
                    f"{group_digest(group)} 주말/휴장 사이 나온 이 재료는 {path_word} 경로로 다음 거래일 투자자 기대를 조정할 수 있습니다. "
                    f"정규장 반응은 아직 확인되지 않았으므로 {subject} 관련 후속 공시와 거래대금, 동종 기업의 상대강도를 확인해야 합니다."
                )
            else:
                blocks.append(
                    f"### {idx}. {group_title(group)}\n\n"
                    f"{group_digest(group)} 이 흐름은 {path_word} 경로로 투자자 기대를 다시 조정할 수 있습니다. "
                    f"다음 거래일에는 {subject} 관련 후속 공시와 거래대금, 동종 기업의 상대강도가 이어지는지 확인해야 합니다."
                )
    return "\n\n".join(blocks) if blocks else "최신 자료만으로는 핵심 시장 동인을 충분히 분리하기 어렵습니다."


def _rule_checkpoints(market_drivers, leaders):
    points = []
    for drv in (market_drivers or [])[:3]:
        name = drv.get("driver", "")
        if name and name != "시장 전반":
            points.append(f"{name} 관련 가격·수급 흐름이 다음 거래일에도 이어지는지, 거래대금 증가와 외국인·기관 순매수가 동반되는지 확인")
    for leader in leaders[:2]:
        points.append(f"{leader} 관련 후속 공시·실적과 동종 기업의 상대강도가 오늘 움직임을 강화하는지 확인")
    if not points:
        points = ["주요 지수의 방향과 거래대금이 오늘 흐름을 이어가는지 확인", "외국인·기관 수급이 특정 업종에 집중되는지 확인"]
    return "\n".join(f"- {p}" for p in points[:6])


def build_prompt_markdown(date, source_date, docs, groups, headlines, market_drivers=None, market_windows=None, market_snapshot=None, korea_market_data=None, market_scope="both", briefing_type="default", issue_coverage=None, session_modes=None):
    market_windows = market_windows or briefing_market_windows(date)
    market_scope = normalize_market_scope(market_scope)
    briefing_type = normalize_briefing_type(briefing_type)
    docs = documents_for_scope(docs, market_scope)
    doc_keys = {_doc_key(doc) for doc in docs}
    groups = [{**group, "docs": [doc for doc in group.get("docs", []) if _doc_key(doc) in doc_keys]} for group in (groups or [])]
    groups = [group for group in groups if group.get("docs")]
    market_drivers = [{**driver, "docs": [doc for doc in driver.get("docs", []) if _doc_key(doc) in doc_keys]} for driver in (market_drivers or [])]
    market_drivers = [driver for driver in market_drivers if driver.get("docs")]
    session_modes = session_modes or session_modes_from_windows(market_windows)
    market_label = "미국장" if market_scope == "us" else "한국장" if market_scope == "kr" else "시장"
    report_title = "US Market Briefing" if market_scope == "us" else "Korea Market Briefing" if market_scope == "kr" else "Daily Market Briefing"
    weekend_mode = bool(market_windows.get("weekendOrHolidayNewsMode"))
    leaders = choose_leaders(groups)
    top_groups = groups[:4]

    # 시장 흐름 섹션 수치 앵커: 스냅샷이 있으면 실제 지수/자산가격 수치를 제시한다.
    if market_snapshot and market_snapshot.get("ok"):
        from features.common.market_data.snapshot import snapshot_to_markdown
        stale_note = snapshot_staleness_note(market_snapshot, market_windows)
        snapshot_block = (
            "오늘 장의 강도를 잡을 수 있는 주요 자산가격 수치는 다음과 같습니다.\n\n"
            + snapshot_to_markdown(market_snapshot)
            + (f"\n\n{stale_note.replace('## 시장 스냅샷 날짜 주의 (중요)', '**시장 스냅샷 날짜 주의(중요):**')}" if stale_note else "")
        )
    else:
        snapshot_block = "입력 자료와 스냅샷에서 미국·한국 주요 지수의 직접 등락률은 확인되지 않습니다. 수치를 추정하지 않고, 기사에서 확인되는 가격 반응과 업종·수급 흐름을 중심으로 해석합니다."
    korea_block = korea_market_data_to_markdown(korea_market_data) if market_scope in {"kr", "both"} else "미국장 단독 범위에서는 한국장 수치를 본문 시황으로 사용하지 않습니다."
    if market_scope == "kr":
        snapshot_block = "한국장 단독 범위에서는 미국 시장 스냅샷을 한국장 반영 여부의 보조 근거로만 사용합니다."

    # 참고자료: 미국 D-1 마감 → 한국 D 흐름/수치 → 반도체 → 유가/지정학/금리
    # 순서가 상단에 오도록 전체 후보에서 정렬한다.
    source_docs = []
    seen = set()

    def _push(d):
        item = {"title": d.get("title", ""), "source": d.get("source", ""), "date": d.get("date", ""), "url": d.get("url", ""), "path": d.get("path", ""), "type": d.get("type", "")}
        key = item["url"] or item["path"] or item["title"]
        if key and key not in seen:
            seen.add(key)
            source_docs.append(item)

    for d in prioritized_source_refs(docs, market_windows, limit=14, issue_coverage=issue_coverage):
        _push(d)

    # 오늘의 시장 성격을 설명할 핵심 축 (기본 3개)
    driver_names = [d.get("driver", "") for d in market_drivers if d.get("driver") and d.get("driver") != "시장 전반"][:3]
    if not driver_names:
        driver_names = [(g.get("company") or g.get("sector") or "시장") for g in top_groups][:3]
    market_subjects = ", ".join(driver_names) if driver_names else "뚜렷한 주도 동인이 제한적"
    # 핵심 변수는 압축한다: 핵심 1개 + 보조 1개까지만
    core_var = driver_names[0] if driver_names else (", ".join(sorted(set(sum([h.get('tags', []) for h in headlines], [])))[:1]) or "실적·수급")
    second_var = driver_names[1] if len(driver_names) > 1 else ""
    key_vars = core_var + (f", {second_var}" if second_var else "")

    leader_groups = []
    for leader in leaders:
        matched = next((g for g in groups if (g.get("company") or g.get("sector")) == leader), None)
        leader_groups.append(matched or (top_groups[0] if top_groups else {"docs": [], "company": leader, "sector": leader}))

    market_character_sentence = (
        f"오늘 수집된 자료({source_date}, {len(docs)}건)에서는 주말/휴장 사이 새로 나온 {market_subjects} 재료가 다음 거래일 확인할 핵심 축으로 나타났습니다. 최근 정규장 흐름은 배경으로만 간결히 복기하고, 아래에서는 새 뉴스가 어느 시장과 업종에 반영될 수 있는지 구분해 살펴봅니다."
        if weekend_mode
        else f"오늘 수집된 자료({source_date}, {len(docs)}건)에서는 {market_subjects} 흐름이 가장 두드러졌습니다. 미국장과 한국장의 연결성은 자료만으로 단정하기 어려워, 아래에서 각 동인이 어느 시장에 반영됐는지 구분해 살펴봅니다."
    )
    flow_insight = (
        f"**시장 흐름 인사이트:** 주말/휴장 브리핑에서는 직전 정규장 지수 방향보다, 새로 나온 {key_vars} 재료가 다음 거래일 가격과 수급에 실제로 반영되는지가 더 중요한 관찰 포인트입니다."
        if weekend_mode
        else f"**시장 흐름 인사이트:** 지수 방향 자체보다, 오늘 자료에서 {key_vars} 변수가 실제 가격과 수급에 어떻게 반영됐는지가 더 중요한 관찰 포인트입니다."
    )
    driver_insight = (
        f"**핵심 변수 인사이트:** 이번 주말/휴장 뉴스에서 가장 먼저 확인할 변수는 {key_vars}입니다. 현재 반응을 단정하기보다 다음 거래일 거래대금, 선물, 환율, 동종 기업 상대강도로 반영 여부를 확인해야 합니다."
        if weekend_mode
        else f"**핵심 변수 인사이트:** 오늘 시장이 가장 민감하게 반응한 변수는 {key_vars}입니다. 뉴스량이 많았던 분야보다, 가격 반응과 수급이 함께 확인되는 변수를 우선 추적해야 합니다."
    )
    company_reaction_note = (
        "주말/휴장 사이 나온 이 뉴스는 아직 정규장 가격 반응이 확인되지 않았습니다. 다음 거래일에는 관련 기업의 거래대금, 동종 기업의 상대강도, 후속 공시/실적 업데이트로 반영 여부를 확인해야 합니다."
        if weekend_mode
        else "관련 뉴스가 실적 기대, 밸류체인 파급력, 업종 내 상대강도 중 어디로 연결되는지 확인해야 합니다. 영향이 한 시장에만 머물렀다면 수급·정책·실적 중 어느 요인이 더 컸는지 구분해야 합니다."
    )
    conclusion_character = (
        f"주말/휴장 사이 새 뉴스에서는 {market_subjects} 재료가 다음 거래일 확인할 핵심 축이었습니다."
        if weekend_mode
        else f"오늘 자료에서는 {market_subjects} 흐름이 시장을 설명하는 핵심 축이었습니다."
    )

    session_mode = session_modes.get(market_scope, "") if market_scope in {"us", "kr"} else ""
    return f"""# {report_title} — {date.replace('-', '.')}

## 0. 오늘의 {market_label} 성격

**한 줄 결론:** {market_character_sentence}

· 핵심 변수: {core_var}
· 보조 변수: {second_var or '독립적인 보조 변수는 제한적'}
· 시장 반응: 확인된 가격·수급 근거를 우선

{market_character_sentence}

## 1. {market_label} 시장 흐름

**한 줄 결론:** {market_label}의 핵심 수치와 시장 내부 구조를 먼저 확인합니다.

· 지수·시장 폭 또는 수급
· 금리·환율·변동성
· 주도·소외 업종
· 세션 기준: {session_mode or market_windows.get('analysisMode', '')}

### 한국장 시장 수치

{korea_block}

한국장 수치 블록에 KOSPI/KOSDAQ 종가 등락률이 없으면 “입력 자료에서 한국장 종가 등락률은 확인되지 않는다”고 명시하고, 수치를 추정하지 않습니다.

### 글로벌 시장 가격 스냅샷

{snapshot_block}

{market_windows.get('rule', '')} {' '.join(market_windows.get('closedNotes', []))} 미국장 마감 이후의 뉴스가 한국장에 이미 반영됐다고 단정하지 말고, 당일 한국장 장중 기사와 수급 자료가 있을 때만 반영 여부를 언급합니다.

{flow_insight}

## 2. {market_label}을 움직인 핵심 변수

**한 줄 결론:** 기사 수보다 독립 매체 확산도와 실제 시장 반응이 큰 {key_vars}를 우선합니다.

· 핵심 변수 1: {core_var}
· 핵심 변수 2: {second_var or '자료에서 독립 변수 확인 제한'}
· 시장 반응 결손은 영향 0이 아니라 데이터 한계로 처리

{_rule_driver_blocks(market_drivers, top_groups, market_windows)}

{driver_insight}

## 3. {market_label}을 주도한 기업 ① — {leaders[0]}

**한 줄 결론:** {leaders[0]} 관련 반응이 섹터와 밸류체인으로 확산됐는지 확인합니다.

· 주가·수급 반응
· 핵심 촉매
· 섹터·밸류체인 파급

{group_digest(leader_groups[0])}

{leaders[0]}은 오늘 수집 자료에서 시장의 반복된 관심을 설명하는 핵심 축으로 나타났습니다. {company_reaction_note}

**기업 ① 인사이트:** {leaders[0]}을 볼 때 핵심은 단기 주가 반응보다 이 뉴스가 관련 업종의 이익 추정치와 투자자 포지셔닝을 바꾸는지입니다. 후속 기사, 거래대금, 동종 기업의 상대강도가 함께 따라오는지가 지속성 판단의 기준입니다.

## 4. {market_label}을 주도한 기업 ② — {leaders[1]}

**한 줄 결론:** {leaders[1]}이 첫 번째 기업과 같은 메시지인지 차별화를 보여주는지 판단합니다.

· 주가·수급 반응
· 첫 번째 기업과의 공통점 또는 차이
· 후속 확인 조건

{group_digest(leader_groups[1])}

{leaders[1]}은 첫 번째 주도 기업과 같은 테마를 강화하거나, 반대로 시장 내부의 차별화를 보여주는 대상으로 볼 수 있습니다. {company_reaction_note}

**기업 ② 인사이트:** {leaders[1]}은 오늘 시장이 한 방향으로만 움직이지 않았을 가능성을 보여줍니다. 첫 번째 기업과 같은 메시지를 준다면 테마 확산을, 다른 메시지를 준다면 시장 내부의 선별 장세를 의심해야 합니다.

## 5. 일반 투자자 관점

**한 줄 결론:** 지수 방향보다 시장 폭·수급·주도주의 지속성을 함께 봐야 합니다.

· 가격 반응의 확산 범위
· 추세 강화와 단기 반응 구분
· 과잉 해석하면 안 되는 부분

개별 종목 대응보다, 오늘 시장에서 {key_vars} 변수가 가격과 수급에 어떻게 반영됐는지가 더 중요합니다. 상승·하락이 넓게 확산됐는지 일부 대형주에 집중됐는지, 오늘 움직임이 추세 강화인지 단기 반응인지는 다음 거래일의 거래대금과 외국인·기관 수급으로 확인해야 합니다. 자료가 제한적인 부분은 무리하게 해석하지 않습니다. (이 항목은 특정 종목 매수·매도 조언이 아닙니다.)

## 6. 다음 {market_label} 체크포인트

**한 줄 결론:** {key_vars}가 다음 거래일 가격·수급으로 확인되는지가 핵심입니다.

{_rule_checkpoints(market_drivers, leaders)}

## 반론과 데이터 한계

- 오늘 해석이 틀릴 수 있는 첫 번째 조건은 {key_vars} 관련 가격 반응이 다음 거래일 거래대금과 수급으로 이어지지 않는 경우입니다.
- 미국장과 한국장의 반영 시차가 엇갈린 자료는 같은 원인으로 묶어 단정하지 않고, 다음 한국장 장중 반응으로 확인해야 합니다.
- 입력 자료에서 확인되지 않는 지수·금리·환율·수급 수치는 추정하지 않았습니다.

## 오늘의 결론

**오늘의 시장 성격:** {conclusion_character}

**핵심 변수:** {key_vars}.

**시장 해석:** 미국장과 한국장의 연결성은 자료만으로 단정하기 어렵고, 미국 뉴스가 한국장 마감 이후 나온 경우에는 다음 한국장에서 실제 수급과 가격 반응을 확인해야 합니다.

**다음 확인점:** 주요 기업의 후속 공시와 실적, 외국인·기관 수급, 금리·환율의 동시 움직임, 그리고 {market_subjects} 관련 거래대금을 함께 점검합니다.

## 참고자료

{source_lines(source_docs)}

## Source & Data Notes

- 로컬 articles/rss 자료 {len(docs)}건을 기준으로 작성했습니다.
- 브리핑은 filings/reports를 직접 근거로 사용하지 않습니다.
- 한국장·미국장 수치가 입력 자료나 marketTape에서 확인되지 않는 경우에는 수치를 추정하지 않고 한계로 남겼습니다.
- 참고자료의 발행일과 실제 시장 기준일이 다를 수 있어, 본문에서는 입력 컨텍스트의 시장기준일을 우선했습니다.
"""


def extract_prev_checklist(markdown):
    """브리핑 Markdown에서 다음 거래일 확인 항목 섹션을 추출한다.

    개선된 브리핑은 '내일 확인할 체크포인트'를, 기존 브리핑은 '오늘의 투자
    체크리스트'를 사용하므로 두 제목을 모두 인식한다. 섹션 번호(예: '6. ')가
    붙어도 매칭되고, 다음 H1~H3 제목 직전까지 본문을 가져온다.
    """
    m = re.search(
        r"#{1,3}\s*(?:\d+\.\s*)?(?:내일 확인할 체크포인트|다음 (?:미국장|한국장|시장) 체크포인트|오늘의 투자 체크리스트)\s*\n([\s\S]*?)(?=\n#{1,3}\s|\Z)",
        str(markdown or ""),
        re.IGNORECASE,
    )
    return m.group(1).strip() if m else ""


BRIEFING_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
BRIEFING_REPORT_FILE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}(?:\.(?:us|kr))?\.json$")


def _briefing_report_paths():
    BRIEFINGS_DIR.mkdir(parents=True, exist_ok=True)
    return sorted(
        (path for path in BRIEFINGS_DIR.iterdir() if BRIEFING_REPORT_FILE_RE.fullmatch(path.name)),
        reverse=True,
    )


def _valid_briefing_date(date):
    date_text = str(date or "").strip()
    if not BRIEFING_DATE_RE.fullmatch(date_text):
        raise ValueError("date must be YYYY-MM-DD")
    return date_text


def _read_briefing_json(path):
    import json

    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except Exception:
        return None


def _combine_market_reports(date_text, scoped_reports):
    reports = {scope: report for scope, report in scoped_reports.items() if isinstance(report, dict)}
    if not reports:
        return None
    first = reports.get("us") or reports.get("kr") or {}
    sections = {}
    for scope in ("us", "kr"):
        report = reports.get(scope)
        if not isinstance(report, dict):
            continue
        section = dict(report)
        section["marketScope"] = scope
        sections[scope] = section
    markdown = "\n\n---\n\n".join(
        section.get("markdown", "") for section in (sections.get("us"), sections.get("kr"))
        if isinstance(section, dict) and section.get("markdown")
    )
    combined = {
        **first,
        "date": date_text,
        "marketScope": "both",
        "title": first.get("title") or f"시장 브리핑 — {date_text}",
        "markdown": markdown,
        "briefings": sections,
        "visualRecommendations": [
            item for scope in ("us", "kr") for item in ((reports.get(scope) or {}).get("visualRecommendations") or [])
        ],
        "visualSnapshots": [
            item for scope in ("us", "kr") for item in ((reports.get(scope) or {}).get("visualSnapshots") or [])
        ],
    }
    return combined


def _has_leading_company_visuals(report):
    if not isinstance(report, dict):
        return False
    return any(
        row.get("role") == "leading_company"
        for row in (report.get("visualSnapshots") or []) + (report.get("visualRecommendations") or [])
        if isinstance(row, dict)
    )


def _with_nasdaq_composite_index_visuals(report):
    """Read-time compatibility for saved reports that used Nasdaq 100 as 'Nasdaq'."""
    if not isinstance(report, dict):
        return report
    snapshots = report.get("visualSnapshots") or []
    needs_fix = any(
        isinstance(row, dict)
        and row.get("type") == "price_series"
        and row.get("role") == "market_summary"
        and str(row.get("market") or "").upper() == "US"
        and (
            (
                any((series or {}).get("ticker") == "^NDX" for series in (row.get("series") or []))
                and not any((series or {}).get("ticker") == "^IXIC" for series in (row.get("series") or []))
            )
            or any((series or {}).get("ticker") == "^IXIC" and (series or {}).get("label") != "Nasdaq" for series in (row.get("series") or []))
        )
        for row in snapshots
    )
    if not needs_fix:
        return report
    out = dict(report)
    fixed_snapshots = []
    try:
        from features.common.market_data.price_history import build_price_history

        for snapshot in snapshots:
            if not (
                isinstance(snapshot, dict)
                and snapshot.get("type") == "price_series"
                and snapshot.get("role") == "market_summary"
                and str(snapshot.get("market") or "").upper() == "US"
            ):
                fixed_snapshots.append(snapshot)
                continue
            series = snapshot.get("series") or []
            has_ndx = any((row or {}).get("ticker") == "^NDX" for row in series)
            has_ixic = any((row or {}).get("ticker") == "^IXIC" for row in series)
            if has_ixic:
                migrated = dict(snapshot)
                migrated["series"] = [
                    {**row, "label": "Nasdaq"} if isinstance(row, dict) and row.get("ticker") == "^IXIC" else row
                    for row in series
                ]
                fixed_snapshots.append(migrated)
                continue
            if not has_ndx:
                fixed_snapshots.append(snapshot)
                continue
            session_date = str(snapshot.get("marketSessionDate") or snapshot.get("asOf") or report.get("date") or "")[:10]
            history = build_price_history("^IXIC", session_date) if session_date else {}
            composite = {
                "ticker": "^IXIC",
                "label": "Nasdaq",
                "intraday": history.get("intraday") or {"interval": "5m", "points": []},
                "daily": history.get("daily") or {"interval": "1d", "points": []},
            }
            if history.get("provider"):
                composite["provider"] = history.get("provider")
            migrated = dict(snapshot)
            migrated["series"] = [composite if (row or {}).get("ticker") == "^NDX" else row for row in series]
            fixed_snapshots.append(migrated)
        out["visualSnapshots"] = fixed_snapshots
        return out
    except Exception as exc:
        warnings = list(out.get("visualWarnings") or [])
        warnings.append(f"nasdaq composite visual backfill failed: {str(exc)[:160]}")
        out["visualWarnings"] = warnings
        return out


def _with_leading_company_visuals(report):
    """Best-effort backfill for reports saved before final-heading chart alignment."""
    if not isinstance(report, dict) or _has_leading_company_visuals(report) or not report.get("markdown"):
        return report
    try:
        from features.daily_briefing.visuals import (
            collect_briefing_visuals,
            leading_company_subjects_from_markdown,
            replace_leading_company_visuals,
        )

        subjects = leading_company_subjects_from_markdown(report.get("markdown", ""))
        scoped_keys = [key for key in ("us", "kr") if subjects.get(key)]
        if not scoped_keys:
            return report
        report_scope = normalize_market_scope(report.get("marketScope"))
        collect_scope = report_scope if report_scope in {"us", "kr"} else ("both" if len(scoped_keys) > 1 else scoped_keys[0])
        sections = report.get("briefings") or {}
        scope_results = {}
        for key in scoped_keys:
            source = sections.get(key) if isinstance(sections.get(key), dict) else report
            scope_result = dict(source)
            scope_result.setdefault("marketSessionDate", source.get("sessionDate") or report.get("marketSessionDate") or report.get("date"))
            scope_results[key] = scope_result
        aligned = collect_briefing_visuals(
            report.get("date"),
            collect_scope,
            scope_results,
            leader_subjects=subjects,
            include_market_visuals=False,
        )
        if not aligned.get("visualSnapshots"):
            return report
        return replace_leading_company_visuals(report, aligned)
    except Exception as exc:
        out = dict(report)
        warnings = list(out.get("visualWarnings") or [])
        warnings.append(f"leading company visual backfill failed: {str(exc)[:160]}")
        out["visualWarnings"] = warnings
        return out


def _with_visual_compatibility(report):
    return _with_leading_company_visuals(_with_nasdaq_composite_index_visuals(report))


def resolve_briefing(date, market_scope="both"):
    """Load a market-scoped briefing, preferring new per-market files.

    Legacy `{date}.json` files remain readable and are scoped through
    `briefing_scope_view` when a per-market file is not present.
    """
    date_text = _valid_briefing_date(date)
    scope = normalize_market_scope(market_scope)
    if scope in {"us", "kr"}:
        scoped = _read_briefing_json(BRIEFINGS_DIR / briefing_file_name(date_text, scope))
        if isinstance(scoped, dict):
            return _with_visual_compatibility(briefing_scope_view(scoped, scope))
        legacy = _read_briefing_json(BRIEFINGS_DIR / briefing_file_name(date_text))
        if isinstance(legacy, dict):
            return _with_visual_compatibility(briefing_scope_view(legacy, scope))
        return None

    scoped_reports = {
        scope_key: _read_briefing_json(BRIEFINGS_DIR / briefing_file_name(date_text, scope_key))
        for scope_key in ("us", "kr")
    }
    combined = _combine_market_reports(date_text, scoped_reports)
    if combined:
        link = _read_briefing_json(BRIEFINGS_DIR / briefing_link_file_name(date_text))
        if isinstance(link, dict) and str(link.get("markdown") or "").strip():
            # 연결 분석을 결합 뷰 본문 상단에 얹는다. per-market 저장 파일은 불변.
            combined["linkAnalysis"] = link
            combined["markdown"] = (
                f"{link['markdown'].rstrip()}\n\n---\n\n{combined.get('markdown', '')}"
            )
        return _with_visual_compatibility(combined)
    legacy = _read_briefing_json(BRIEFINGS_DIR / briefing_file_name(date_text))
    return _with_visual_compatibility(legacy) if isinstance(legacy, dict) else None


def delete_briefing(date, market=None):
    """Delete a saved briefing report and its immutable visual sidecars.

    With new per-market storage, a market argument removes only that market's
    report and sidecars.  Without market, the endpoint keeps legacy date-wide
    behavior and removes all reports/sidecars for the date.
    """
    from features.daily_briefing.archive import refresh_briefing_archive

    date_text = _valid_briefing_date(date)
    market_text = str(market or "").strip().lower()
    if market_text and market_text not in {"us", "kr"}:
        raise ValueError("market must be us or kr")
    removed = []
    if market_text:
        targets = (
            BRIEFINGS_DIR / briefing_file_name(date_text, market_text),
            BRIEFINGS_DIR / visual_sidecar_file_name(date_text, market_text),
            BRIEFINGS_DIR / visual_sidecar_gzip_file_name(date_text, market_text),
        )
    else:
        targets = (
            BRIEFINGS_DIR / briefing_file_name(date_text),
            BRIEFINGS_DIR / briefing_file_name(date_text, "us"),
            BRIEFINGS_DIR / briefing_file_name(date_text, "kr"),
            BRIEFINGS_DIR / briefing_link_file_name(date_text),
            BRIEFINGS_DIR / visual_sidecar_file_name(date_text),
            BRIEFINGS_DIR / visual_sidecar_gzip_file_name(date_text),
            BRIEFINGS_DIR / visual_sidecar_file_name(date_text, "us"),
            BRIEFINGS_DIR / visual_sidecar_gzip_file_name(date_text, "us"),
            BRIEFINGS_DIR / visual_sidecar_file_name(date_text, "kr"),
            BRIEFINGS_DIR / visual_sidecar_gzip_file_name(date_text, "kr"),
        )
    for path in targets:
        if path.exists():
            path.unlink()
            removed.append(path.name)
    if not removed:
        result = {"deleted": False, "date": date_text, "removedFiles": []}
        if market_text:
            result["market"] = market_text
        return result
    refresh_briefing_archive()
    result = {"deleted": True, "date": date_text, "removedFiles": removed}
    if market_text:
        result["market"] = market_text
    return result


def load_prev_briefing(current_date):
    """current_date 이전에 저장된 가장 최근 브리핑을 반환한다."""
    import json

    for path in _briefing_report_paths():
        if path.stem < current_date:
            try:
                return json.loads(path.read_text(encoding="utf-8"))
            except Exception:
                continue
    return None


def list_briefings():
    from features.common.dataframe_ops import sort_records  # noqa: F401 - avoids circular import at module load
    import json

    def _read_json(path):
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return None

    rows = [_read_json(p) for p in _briefing_report_paths()]
    out = [r for r in rows if r]
    for row in out:
        if row.get("quality") or not row.get("markdown"):
            continue
        try:
            from features.common.research_quality.evaluator import evaluate_artifact
            row["quality"] = evaluate_artifact("briefing", row)
        except Exception:
            pass
    return out
