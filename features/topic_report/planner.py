"""Topic Planner — 자유 입력 주제를 해석해 TopicPlan을 만든다 (설계 04 §3~5).

규칙 기반 해석이 기본이고, LLM이 켜져 있으면 계획을 정제한다.
LLM 결과는 topic_schema의 enum/정규화를 통과해야 하며, 실패 시 규칙 계획을 쓴다.
userContext는 질문 의도 파악에만 쓰고 사실/근거로 다루지 않는다.
"""
from __future__ import annotations

import json
import re
from copy import deepcopy

from features.topic_report.topic_schema import (
    EXPECTED_SECTIONS_V2,
    LEGACY_REPORT_TYPE_MAP,
    REPORT_TYPE_LABELS,
    normalize_report_type,
    normalize_topic_plan,
)

# ---------------------------------------------------------------------------
# 규칙 기반 분류
# ---------------------------------------------------------------------------

# (report_type, 가중치, 키워드) — 라벨에서 매칭된 가중치 합이 가장 큰 유형 선택
_TYPE_RULES: list[tuple[str, int, tuple[str, ...]]] = [
    ("supply_chain_theme", 3, ("공급망", "병목", "밸류체인", "supply chain", "bottleneck", "hbm", "수직계열")),
    ("policy_regulation", 3, ("규제", "정책", "법안", "관세", "보조금", "regulation", "policy", "tariff", "subsidy", "ira", "chips act")),
    ("geopolitical_risk", 3, ("지정학", "전쟁", "분쟁", "제재", "중동", "대만 리스크", "미중", "geopolit", "sanction", "war")),
    ("earnings_theme", 3, ("실적", "어닝", "가이던스", "eps", "earnings", "guidance", "컨센서스")),
    ("factor_style", 3, ("성장주", "가치주", "퀄리티", "배당주", "소형주", "모멘텀", "팩터", "스타일", "factor", "value stock", "growth stock", "high roic", "고roic")),
    ("company_basket", 2, ("수혜주", "관련주", "비교", "승자", "패자", "기업군", "바스켓", "basket", "누가 가장", "어떤 기업")),
    ("cross_asset_analysis", 2, ("환율과", "금리가", "달러와", "원화와", "엔화와", "주식에 미치는", "증시에 미치는", "채권에 미치는", "미치는 영향")),
    ("macro_analysis", 2, ("금리", "물가", "인플레이션", "환율", "중앙은행", "연준", "한국은행", "boj", "fed", "fomc", "경기", "침체", "유동성")),
    ("industry_theme", 2, ("산업", "섹터", "업종", "테마", "반도체", "전력 인프라", "데이터센터", "방산", "헬스케어", "에너지", "조선", "이차전지", "로봇")),
    ("country_market", 1, ("일본 시장", "중국 시장", "인도 시장", "한국 시장", "신흥국", "국가 시장")),
]

_REGION_RULES: list[tuple[str, tuple[str, ...]]] = [
    ("Korea", ("한국", "korea", "원화", "krw", "코스피", "kospi", "한은", "삼성", "하이닉스", "국내")),
    ("US", ("미국", "us ", "u.s", "달러", "dollar", "연준", "fed", "nasdaq", "s&p", "장기금리")),
    ("Japan", ("일본", "japan", "엔화", "jpy", "boj", "닛케이", "nikkei", "종합상사")),
    ("China", ("중국", "china", "위안", "cny", "항셍")),
    ("Europe", ("유럽", "europe", "ecb", "유로", "euro")),
    ("Global", ("글로벌", "global", "세계")),
]

_ASSET_RULES: list[tuple[str, tuple[str, ...]]] = [
    ("FX", ("환율", "원화", "엔화", "달러", "위안", "fx", "krw", "jpy", "usd")),
    ("rates", ("금리", "국채", "채권", "수익률", "yield", "rates", "장기금리")),
    ("equities", ("주식", "증시", "수혜주", "성장주", "기업", "주가", "코스피", "나스닥", "금융주", "반도체주", "수출주")),
    ("commodities", ("유가", "원유", "구리", "금 가격", "원자재", "commodity", "wti", "천연가스")),
    ("credit", ("회사채", "크레딧", "신용", "스프레드", "credit")),
]

# 키워드 → (ticker, 표시명). 라벨에서 발견되면 candidateTickers에 추가
_TICKER_HINTS: list[tuple[tuple[str, ...], str, str]] = [
    (("원화", "krw", "환율", "한국"), "USDKRW=X", "USD/KRW"),
    (("엔화", "jpy", "일본 금리", "boj"), "USDJPY=X", "USD/JPY"),
    (("달러", "dxy", "dollar"), "DX-Y.NYB", "DXY"),
    (("금리", "장기금리", "국채", "10년"), "^TNX", "미국 10년물 금리"),
    (("코스피", "한국 주식", "한국 증시", "수출주", "한국 금융주"), "^KS11", "KOSPI"),
    (("나스닥", "성장주", "기술주"), "QQQ", "Nasdaq 100"),
    (("s&p", "미국 증시", "미국 주식"), "SPY", "S&P 500"),
    (("닛케이", "일본 주식", "일본 증시", "종합상사"), "^N225", "Nikkei 225"),
    (("반도체", "hbm", "메모리"), "SOXX", "반도체 ETF"),
    (("전력", "유틸리티", "데이터센터"), "XLU", "유틸리티 섹터"),
    (("유가", "원유", "wti", "에너지"), "CL=F", "WTI 원유"),
    (("구리", "전선", "copper"), "HG=F", "구리 선물"),
    (("금 ", "gold", "안전자산"), "GC=F", "금"),
    (("장기채", "tlt"), "TLT", "미 장기채 ETF"),
    (("변동성", "vix", "리스크"), "^VIX", "VIX"),
    (("중국", "항셍"), "^HSI", "항셍지수"),
]

# FRED 시리즈 힌트 (requiredMacroData)
_MACRO_HINTS: list[tuple[tuple[str, ...], tuple[str, ...]]] = [
    (("금리", "연준", "fed", "rates", "국채"), ("FEDFUNDS", "DGS10", "DGS2", "T10Y2Y")),
    (("물가", "인플레이션", "cpi"), ("CPIAUCSL",)),
    (("고용", "실업"), ("UNRATE", "PAYEMS")),
    (("경기", "침체", "산업생산"), ("INDPRO",)),
    (("환율", "원화", "달러"), ("DGS10", "FEDFUNDS")),
]

# report_type별 필수 분석 축 (설계 §8)
_TYPE_AXES: dict[str, list[tuple[str, str]]] = {
    "macro_analysis": [
        ("policy_path", "정책금리 경로와 중앙은행 커뮤니케이션"),
        ("inflation_real_rates", "인플레이션과 실질금리"),
        ("fx_flows", "환율과 자본흐름"),
        ("risk_appetite", "위험선호/위험회피 환경"),
    ],
    "cross_asset_analysis": [
        ("equity_reaction", "주식시장 반응"),
        ("rates_reaction", "채권금리 반응"),
        ("fx_reaction", "환율 반응"),
        ("flows_volatility", "자금흐름과 변동성"),
    ],
    "industry_theme": [
        ("demand_drivers", "수요 증가 요인"),
        ("supply_pricing", "공급 병목과 가격/마진 구조"),
        ("value_chain", "밸류체인과 수혜/피해 기업"),
        ("capex_policy", "capex 사이클과 정책/규제"),
        ("valuation", "밸류에이션 반영 정도"),
    ],
    "supply_chain_theme": [
        ("final_demand", "최종 수요"),
        ("bottleneck", "병목 구간과 공급 확대 가능성"),
        ("pricing_power", "가격 결정력과 대체 가능성"),
        ("beneficiaries", "수혜 기업군과 리스크 요인"),
    ],
    "policy_regulation": [
        ("policy_content", "정책 내용과 시행 가능성·시점"),
        ("direct_impact", "직접 수혜/피해 산업"),
        ("second_order", "2차 파급효과"),
        ("priced_in", "시장 반영 정도와 정치적 지속 가능성"),
    ],
    "geopolitical_risk": [
        ("supply_shock", "공급 충격과 원자재 가격"),
        ("logistics", "운송/물류 영향"),
        ("sector_impact", "방산/에너지/소재 영향과 안전자산 흐름"),
        ("tail_risk", "tail risk와 리스크 완화 조건"),
    ],
    "earnings_theme": [
        ("earnings_trend", "실적 추세와 컨센서스 대비"),
        ("guidance", "가이던스와 이익 추정 방향"),
        ("sector_dispersion", "업종별 차별화"),
        ("valuation", "밸류에이션 반영 정도"),
    ],
    "factor_style": [
        ("factor_performance", "팩터/스타일 성과와 금리 민감도"),
        ("regime_fit", "현재 거시 환경과의 적합성"),
        ("valuation_spread", "밸류에이션 스프레드"),
        ("rotation_signal", "로테이션 신호와 체크포인트"),
    ],
    "company_basket": [
        ("exposure", "관련 기업 목록과 기업별 노출도"),
        ("sensitivity", "실적 민감도"),
        ("quality_valuation", "밸류에이션 부담과 재무 체력"),
        ("winners_losers", "승자/패자 구분과 확인할 지표"),
    ],
    "country_market": [
        ("macro_backdrop", "거시 환경과 정책"),
        ("market_structure", "시장 구조와 주도 업종"),
        ("flows", "외국인/기관 자금흐름"),
        ("valuation_risk", "밸류에이션과 리스크"),
    ],
    "portfolio_implication": [
        ("exposure_map", "포트폴리오 노출도"),
        ("scenario_impact", "시나리오별 영향"),
    ],
    "custom_research": [
        ("current_state", "현재 상황과 주요 사실"),
        ("drivers", "핵심 동인과 작동 경로"),
        ("market_link", "시장(주식·금리·환율)과의 연결"),
        ("risks", "반론과 리스크"),
    ],
}

_STOPWORDS = {
    "영향", "분석", "전망", "관련", "대한", "대해", "어떻게", "무엇", "정말", "주는", "미치는",
    "있는", "있나", "인가", "에서", "에게", "와", "과", "의", "이", "가", "은", "는", "을", "를",
    "the", "and", "for", "what", "how", "impact", "analysis",
}


def _label_keywords(label: str, limit: int = 8) -> list[str]:
    """라벨에서 의미 있는 키워드 추출 — 기존 label.split()의 개선판."""
    tokens = re.findall(r"[A-Za-z가-힣0-9&=^.\-]{2,}", str(label or ""))
    out: list[str] = []
    for token in tokens:
        clean = token.strip(".,?!")
        if len(clean) < 2 or clean.lower() in _STOPWORDS:
            continue
        # 조사 제거 (간단 규칙: ~이/가/은/는/을/를/와/과/에 로 끝나는 3자 이상)
        if len(clean) >= 3 and clean[-1] in "이가은는을를와과에":
            clean = clean[:-1]
        if clean and clean not in out:
            out.append(clean)
        if len(out) >= limit:
            break
    return out


def _detect_report_type(text: str) -> str:
    lower = text.lower()
    scores: dict[str, int] = {}
    for rtype, weight, keywords in _TYPE_RULES:
        hit = sum(1 for kw in keywords if kw in lower)
        if hit:
            scores[rtype] = scores.get(rtype, 0) + hit * weight
    if not scores:
        return "custom_research"
    # cross_asset은 "X가 Y에 미치는 영향" 패턴에서 macro와 경합 — 자산군 2개 이상이면 cross 우선
    best = max(scores.items(), key=lambda kv: kv[1])[0]
    if best == "macro_analysis" and scores.get("cross_asset_analysis"):
        asset_hits = sum(1 for _, kws in _ASSET_RULES if any(k in lower for k in kws))
        if asset_hits >= 2:
            return "cross_asset_analysis"
    return best


def _detect_listed(text: str, rules: list[tuple[str, tuple[str, ...]]]) -> list[str]:
    lower = text.lower()
    return [name for name, keywords in rules if any(kw in lower for kw in keywords)]


def _explicit_tickers(label: str) -> dict[str, str]:
    """라벨 안의 명시적 티커(GEV, ETN, VRT 같은 2~5자 대문자)를 추출.

    'VRT에'처럼 한글 조사가 붙으면 \\b 경계가 성립하지 않으므로
    라틴 문자 기준 경계((?<![A-Za-z]) ... (?![A-Za-z]))로 잡는다."""
    out: dict[str, str] = {}
    for token in re.findall(r"(?<![A-Za-z])[A-Z]{2,5}(?![A-Za-z])", str(label or "")):
        if token in {"AI", "US", "EU", "ETF", "IPO", "CEO", "GDP", "CPI", "PER", "ROE", "ROIC", "FED", "BOJ", "BOK", "KRW", "JPY", "USD", "CNY", "HBM"}:
            continue
        out[token] = token
    return out


def _candidate_tickers(text: str, label: str) -> dict[str, str]:
    lower = text.lower()
    out = _explicit_tickers(label)
    for keywords, ticker, name in _TICKER_HINTS:
        if any(kw in lower for kw in keywords) and ticker not in out:
            out[ticker] = name
        if len(out) >= 12:
            break
    return out


def _required_macro(text: str) -> list[str]:
    lower = text.lower()
    out: list[str] = []
    for keywords, series in _MACRO_HINTS:
        if any(kw in lower for kw in keywords):
            for s in series:
                if s not in out:
                    out.append(s)
    return out


def _axis_queries(axis_label: str, keywords: list[str]) -> list[str]:
    base = keywords[:3]
    axis_terms = [w for w in re.findall(r"[A-Za-z가-힣]{2,}", axis_label) if w not in _STOPWORDS][:2]
    queries = []
    if base:
        queries.append(" ".join(base))
    if base and axis_terms:
        queries.append(" ".join(base[:2] + axis_terms[:1]))
    return queries[:3]


def _data_gaps(report_type: str, regions: list[str]) -> list[str]:
    gaps = []
    if report_type in {"company_basket", "earnings_theme"}:
        gaps.append("개별 기업 컨센서스/이익 추정치는 로컬 자료에 없을 수 있어 웹 검색 보완이 필요합니다.")
    if report_type in {"macro_analysis", "cross_asset_analysis"}:
        gaps.append("외국인/기관 수급 상세 데이터는 제공되지 않아 가격·뉴스 기반 추정에 의존합니다.")
    if report_type in {"policy_regulation", "geopolitical_risk"}:
        gaps.append("최신 정책 발표/사건 전개는 로컬 자료 시차가 있어 웹 검색 보완이 필요할 수 있습니다.")
    if "Korea" in regions:
        gaps.append("한국 종목 단위 재무 상세는 SEC 기반 파이프라인 범위 밖일 수 있습니다.")
    if not gaps:
        gaps.append("주제 특화 데이터가 부족하면 보고서에 데이터 한계를 명시합니다.")
    return gaps


def build_rule_plan(topic: str, *, user_context: str = "") -> dict:
    """규칙 기반 TopicPlan. LLM 없이 항상 동작해야 한다 (절대 규칙 4)."""
    label = str(topic or "").strip()
    # userContext는 의도 파악 보조로만 — 분류 텍스트에 합치되 근거로는 쓰지 않음
    intent_text = f"{label} {str(user_context or '')[:300]}"
    report_type = _detect_report_type(intent_text)
    keywords = _label_keywords(label)
    regions = _detect_listed(intent_text, _REGION_RULES)
    assets = _detect_listed(intent_text, _ASSET_RULES)
    tickers = _candidate_tickers(intent_text, label)

    axes = []
    for i, (key, axis_label) in enumerate(_TYPE_AXES.get(report_type, _TYPE_AXES["custom_research"])):
        axes.append({
            "key": key,
            "label": axis_label,
            "questions": [f"{label} 관점에서 {axis_label}은(는) 어떤 상태인가?"],
            "requiredData": list(tickers.keys())[:4],
            "searchQueries": _axis_queries(axis_label, keywords),
        })
        if i >= 5:
            break

    search_queries = []
    if label:
        search_queries.append(label)
    if keywords:
        search_queries.append(" ".join(keywords[:4]))
        for kw in keywords[:4]:
            if kw not in search_queries:
                search_queries.append(kw)
    for axis in axes:
        for q in axis["searchQueries"]:
            if q not in search_queries:
                search_queries.append(q)

    plan = {
        "topic": label,
        "topicLabel": label,
        "reportType": report_type,
        "regions": regions,
        "assetClasses": assets,
        "userIntent": "investment implication",
        "researchQuestions": [
            f"{label}의 현재 상황과 핵심 동인은 무엇인가?",
            f"{label}이(가) 시장 가격·실적·수급에 어떤 경로로 작동하는가?",
            "이 판단이 틀릴 수 있는 반대 근거는 무엇인가?",
        ],
        "analysisAxes": axes,
        "requiredMarketData": list(tickers.keys()),
        "requiredMacroData": _required_macro(intent_text),
        "searchQueries": search_queries,
        "memoryQueries": [k.lower() for k in keywords],
        "candidateTickers": tickers,
        "expectedSections": list(EXPECTED_SECTIONS_V2),
        "dataGapsLikely": _data_gaps(report_type, regions),
    }
    return normalize_topic_plan(plan, topic=label, topic_label=label)


def apply_deep_research_plan(plan: dict, *, max_rounds: int = 2, max_questions: int = 8) -> dict:
    """Attach bounded deep-research subquestions to a normalized TopicPlan.

    The base TopicPlan remains compatible with existing consumers. Deep metadata
    is opt-in and keeps the loop finite: round 1 covers core/axis questions,
    round 2 only probes gaps and falsification.
    """
    out = deepcopy(plan if isinstance(plan, dict) else {})
    max_rounds = max(1, min(2, int(max_rounds or 2)))
    max_questions = max(3, min(8, int(max_questions or 8)))
    axes = out.get("analysisAxes") or []
    base_queries = list(out.get("searchQueries") or [])[:3]

    subquestions: list[dict] = []

    def add_question(question: str, *, axis_key: str = "", round_no: int = 1, queries: list[str] | None = None) -> None:
        text = str(question or "").strip()
        if not text or len(subquestions) >= max_questions:
            return
        if any(q["question"] == text for q in subquestions):
            return
        qid = f"dq_{len(subquestions) + 1:02d}"
        search_queries = [q for q in (queries or []) if str(q or "").strip()]
        if not search_queries:
            search_queries = base_queries[:2]
        subquestions.append({
            "id": qid,
            "question": text[:240],
            "axisKey": axis_key,
            "round": max(1, min(max_rounds, int(round_no or 1))),
            "searchQueries": search_queries[:4],
        })

    for question in out.get("researchQuestions") or []:
        add_question(question, round_no=1, queries=base_queries)

    for axis in axes:
        axis_key = axis.get("key", "")
        queries = list(axis.get("searchQueries") or []) or base_queries
        questions = axis.get("questions") or [f"{axis.get('label', '')}에 대한 핵심 근거는 무엇인가?"]
        for question in questions[:2]:
            add_question(question, axis_key=axis_key, round_no=1, queries=queries)

    if max_rounds >= 2:
        topic = out.get("topicLabel") or out.get("topic") or "이 주제"
        add_question(
            f"{topic}에 대한 현재 결론을 약화시키는 반대 근거는 무엇인가?",
            round_no=2,
            queries=(base_queries + ["리스크 반론 downside risk"])[:4],
        )
        add_question(
            f"{topic} 판단을 바꿔야 하는 정량 조건은 무엇인가?",
            round_no=2,
            queries=(base_queries + ["falsification trigger data"])[:4],
        )

    if len(subquestions) < 3:
        topic = out.get("topicLabel") or out.get("topic") or "이 주제"
        add_question(f"{topic}의 현재 상황을 보여주는 가장 중요한 데이터는 무엇인가?", round_no=1, queries=base_queries)
        add_question(f"{topic}이 시장 가격에 작동하는 경로는 무엇인가?", round_no=1, queries=base_queries)
        add_question(f"{topic} 분석이 틀릴 수 있는 조건은 무엇인가?", round_no=min(2, max_rounds), queries=base_queries)

    out["deepResearch"] = {
        "enabled": True,
        "maxRounds": max_rounds,
        "subQuestions": subquestions[:max_questions],
        "falsificationTriggers": [
            "핵심 가격·지표가 보고서의 기본 시나리오와 반대로 2회 이상 확인된다.",
            "주요 수혜/피해 기업의 실적·가이던스가 예상 작동 경로와 반대로 나온다.",
            "정책·금리·환율 전제가 바뀌어 기존 인과 경로가 더 이상 성립하지 않는다.",
        ],
        "requiredOutputs": [
            "scenario_table",
            "counter_arguments",
            "falsification_triggers",
            "quantitative_evidence_table",
        ],
    }
    return out


def plan_from_preset(config: dict) -> dict:
    """기존 프리셋 설정 → TopicPlan (backward compatible 경로)."""
    label = config.get("label", "")
    axes = []
    for i, axis_label in enumerate(config.get("theme_axes", [])):
        axes.append({
            "key": f"axis_{i + 1}",
            "label": axis_label,
            "questions": [],
            "requiredData": list(config.get("tickers", {}).keys())[:4],
            "searchQueries": [" ".join(config.get("search_keywords", [])[:3])],
        })
    plan = {
        "topic": label,
        "topicLabel": label,
        "reportType": LEGACY_REPORT_TYPE_MAP.get(config.get("report_type", ""), "custom_research"),
        "regions": [],
        "assetClasses": [],
        "researchQuestions": [],
        "analysisAxes": axes,
        "requiredMarketData": list(config.get("tickers", {}).keys()),
        "requiredMacroData": list(config.get("fred_series", [])),
        "searchQueries": config.get("search_keywords", [])[:12],
        "memoryQueries": config.get("memory_keywords", [])[:10],
        "candidateTickers": dict(config.get("tickers", {})),
        "expectedSections": config.get("report_sections", []) or list(EXPECTED_SECTIONS_V2),
        "dataGapsLikely": [],
    }
    return normalize_topic_plan(plan, topic=label, topic_label=label)


# ---------------------------------------------------------------------------
# LLM 정제 (선택)
# ---------------------------------------------------------------------------

_PLANNER_PROMPT = """당신은 투자 리서치 플래너입니다. 사용자의 리서치 주제를 해석해 아래 JSON 스키마의 TopicPlan을 작성하세요.

규칙:
- reportType은 다음 중 하나만: {report_types}
- 사용자 컨텍스트는 관심 방향 파악에만 쓰고, 그 전제를 사실로 간주하지 마세요.
- analysisAxes는 3~5개. 각 축에 key(영문 snake_case), label(한국어), questions(1~2개), searchQueries(1~3개, 한국어+영어 혼합)를 넣으세요.
- searchQueries는 로컬 뉴스 검색용 짧은 구문으로. candidateTickers는 yfinance 형식 심볼로.
- dataGapsLikely에는 로컬 자료만으로 부족할 법한 데이터를 적으세요.
- JSON 객체 하나만 출력하세요. 다른 텍스트 금지.

스키마 키: topic, topicLabel, reportType, regions, assetClasses, timeHorizon, userIntent,
researchQuestions, analysisAxes, requiredMarketData, requiredMacroData, searchQueries,
memoryQueries, candidateTickers, dataGapsLikely"""


def refine_plan_with_llm(rule_plan: dict, topic: str, user_context: str = "") -> tuple[dict, str]:
    """LLM으로 규칙 계획을 정제. 실패하면 (rule_plan, 사유) 반환."""
    try:
        from features.llm_settings.client import (
            extract_json_object,
            request_llm_text,
            selected_llm_config,
            use_llm_analysis,
        )
    except Exception:
        return rule_plan, "llm_unavailable"
    if not use_llm_analysis():
        return rule_plan, "llm_disabled"
    cfg = selected_llm_config()
    if not cfg.get("apiKey"):
        return rule_plan, "no_api_key"
    prompt = _PLANNER_PROMPT.format(report_types=", ".join(sorted(REPORT_TYPE_LABELS)))
    context_lines = [f"리서치 주제: {topic}"]
    if user_context.strip():
        context_lines.append(f"사용자 컨텍스트(관심 방향, 사실 아님): {user_context.strip()[:500]}")
    context_lines.append(f"규칙 기반 1차 계획(참고/수정 대상):\n{json.dumps(rule_plan, ensure_ascii=False, indent=1)[:3000]}")
    try:
        text, _rid = request_llm_text(cfg, prompt, "\n\n".join(context_lines), json_mode=True, max_output_tokens=2500)
        raw = extract_json_object(text)
        if not isinstance(raw, dict):
            return rule_plan, "parse_failed"
        refined = normalize_topic_plan(raw, topic=topic, topic_label=topic)
        # LLM이 비워버린 핵심 필드는 규칙 계획으로 보강 (계획이 후퇴하지 않게)
        for key in ("searchQueries", "memoryQueries", "candidateTickers", "analysisAxes", "dataGapsLikely"):
            if not refined.get(key):
                refined[key] = rule_plan.get(key, refined.get(key))
        return refined, "llm"
    except Exception as exc:
        return rule_plan, f"llm_error:{str(exc)[:120]}"


def build_topic_plan(
    topic_key: str,
    custom_label: str = "",
    user_context: str = "",
    *,
    llm_override=None,
    preset_config: dict | None = None,
) -> dict:
    """진입점. 프리셋이면 설정 기반 plan, custom이면 규칙 해석(+선택 LLM 정제)."""
    if topic_key != "custom":
        if preset_config is None:
            from features.topic_report.topic_config import get_topic_config
            preset_config = get_topic_config(topic_key)
        plan = plan_from_preset(preset_config)
        plan["plannerMode"] = "preset"
        return plan
    label = (custom_label or "커스텀 주제").strip()
    rule_plan = build_rule_plan(label, user_context=user_context)
    use_llm = True if llm_override is None else bool(llm_override)
    if use_llm:
        plan, mode = refine_plan_with_llm(rule_plan, label, user_context)
    else:
        plan, mode = rule_plan, "rules"
    plan["plannerMode"] = "llm" if mode == "llm" else "rules"
    return plan
