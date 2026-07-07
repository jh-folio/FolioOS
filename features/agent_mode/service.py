from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path

from features.agent_mode import schema as A
from features.agent_mode.briefing_contract import (
    briefing_contract_violations,
    briefing_output_contract,
)
from features.common.utils import kst_date, now_iso, read_json, write_json
from features.common.dataframe_ops import top_records
from features.common.research_library.indexing.service import IMPACT_TERMS, build_index, load_index
from features.common.research_library.search.service import group_docs, search_documents
from features.common.market_data.snapshot import fetch_market_snapshot
from features.common.market_data.providers import fetch_korea_market_data
from features.common.market_data.tape import build_market_tape
from features.common.research_schema.checkpoints import checkpoints_from_markdown
from features.common.research_schema.data_gaps import data_gaps_from_messages
from features.common.research_schema.evidence import evidence_items_from_list
from features.common.research_schema.source_ledger import source_ledger_from_items
from features.common.company_lookup import infer_requested_company
from features.common.quality_generation.loop import apply_quality_loop
from features.common.quality_generation.preflight import preflight_from_context
from features.common.quality_generation.preflight_enrichment import build_preflight_evidence_context
from features.common.quality_generation.prompt_hints import render_prompt_hints
from features.common.quality_generation.quality_targets import render_quality_target_context
from features.common.quality_generation.schema import normalize_quality_mode
from features.daily_briefing.service import (
    append_briefing_sources,
    briefing_sources_from_headlines,
    build_llm_context,
    briefing_prompt_path_label,
    extract_prev_checklist,
    group_digest,
    load_prev_briefing,
    news_documents,
    prioritized_source_refs,
    read_briefing_prompt,
    select_briefing_docs,
    source_refs,
)
from features.daily_briefing.selection import (
    derive_market_drivers,
    infer_market_session_date,
    prioritize_briefing_groups,
    session_doc_counts,
)
from features.daily_briefing.issue_selection import (
    build_issue_coverage,
    documents_for_scope,
    public_issue_coverage,
    session_modes_from_windows,
)
from features.daily_briefing.schema import (
    briefing_file_name,
    briefing_scope_view,
    enrich_briefing_sections,
    merge_briefing_report,
    normalize_briefing_type,
    normalize_market_scope,
    split_market_markdown,
    visual_sidecar_gzip_file_name,
)
from features.daily_briefing.visuals import (
    collect_briefing_visuals,
    leading_company_subjects_from_markdown,
    replace_leading_company_visuals,
    write_visual_sidecar,
)
from features.market_memory.memory import build_memory_from_briefing, list_briefing_memories, upsert_memory
from features.market_memory.service import (
    build_memory_llm_context,
    normalize_llm_memory_entry,
    read_market_memory_prompt,
)
from features.market_memory.snapshot import (
    MARKET_STATE_SNAPSHOT_PROMPT,
    build_market_state_context,
    save_market_state_snapshot,
)
from features.company_analysis.service import (
    ANALYSIS_REPORTS_DIR,
    build_company_analysis_charts,
    build_company_analysis_materials,
    company_analysis_sources,
    company_external_search_context,
    get_analysis_report,
    read_company_analysis_prompt,
    save_analysis_report,
)
from features.company_analysis.data_gap_resolver import resolve_company_analysis_gaps
from features.company_analysis.style import analysis_prompt_path, normalize_analysis_style
from features.topic_report.data_fetcher import fetch_topic_market_data
from features.topic_report.evaluation import evaluate_report
from features.topic_report.evidence import build_evidence_pack, evidence_pack_summary
from features.topic_report.macro_data import fetch_macro_data
from features.topic_report.service import (
    _build_llm_context as build_topic_llm_context,
    _doc_sources as topic_doc_sources,
    _search_docs as topic_search_docs,
    _search_memories as topic_search_memories,
    _read_prompt as read_topic_prompt,
)
from features.topic_report.source_ledger import build_source_ledger
from features.topic_report.templates import compose_prompt
from features.topic_report.topic_config import get_topic_config
from features.topic_report.planner import build_topic_plan
from features.topic_report.service import save_topic_report
from features.llm_settings.client import bok_api_key, fred_api_key
from features.personal_overlay import schema as overlay_schema
from features.personal_overlay.service import (
    _build_context as overlay_build_context,
    _gather_hypotheses,
    read_prompt as read_overlay_prompt,
    with_overlay,
)
from features.thesis_tracking import delta as thesis_delta
from features.thesis_tracking import store as thesis_store
from features.thesis_tracking.service import get_thesis
from features.common.research_quality.evaluator import evaluate_artifact
from features.common.research_schema.service import load_artifact
from features.investment_review.service import REVIEW_DIR, build_review

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
BRIEFINGS_DIR = DATA_DIR / "briefings"
MARKET_MEMORY_DB_PATH = DATA_DIR / "market-memory.sqlite3"


def _items_for_market(items, scope):
    target = str(scope or "").upper()
    return [
        deepcopy(item) for item in (items or [])
        if str(item.get("market") or "").upper() in {target, "BOTH", ""}
    ]


def _sidecar_for_market(sidecar, scope):
    target = str(scope or "").upper()
    out = deepcopy(sidecar or {})
    out["marketScope"] = scope
    out["snapshots"] = {
        key: value for key, value in deepcopy((sidecar or {}).get("snapshots") or {}).items()
        if str(value.get("market") or "").upper() in {target, "BOTH"}
    }
    return out


def _single_market_briefing(briefing, scope):
    scoped = briefing_scope_view(briefing, scope)
    scoped["marketScope"] = scope
    scoped["briefings"] = {}
    scoped["visualRecommendations"] = _items_for_market(briefing.get("visualRecommendations"), scope)
    scoped["visualSnapshots"] = _items_for_market(briefing.get("visualSnapshots"), scope)
    scoped["marketDrivers"] = [
        deepcopy(item) for item in (briefing.get("marketDrivers") or [])
        if str(item.get("market") or "").lower() in {scope, "both", ""}
    ]
    scoped["issueCoverage"] = [
        deepcopy(item) for item in (briefing.get("issueCoverage") or [])
        if str(item.get("market") or "").lower() in {scope, "both", ""}
    ]
    stats = deepcopy(scoped.get("stats") or {})
    stats["marketScope"] = scope
    stats["visualSnapshotCount"] = len(scoped.get("visualSnapshots") or [])
    scoped["stats"] = stats
    return scoped


def _cache_json(path: Path, ttl_seconds: int, fetcher):
    cached = read_json(path, None)
    if cached:
        return cached.get("snapshot") or cached.get("marketData") or cached
    value = fetcher()
    path.parent.mkdir(parents=True, exist_ok=True)
    key = "marketData" if "korea-market-data" in path.name else "snapshot"
    write_json(path, {"cachedAt": now_iso(), key: value})
    return value


def cached_market_snapshot():
    return _cache_json(DATA_DIR / "market-snapshot.json", 1200, fetch_market_snapshot)


def cached_korea_market_data(date: str):
    return _cache_json(DATA_DIR / f"korea-market-data-{date}.json", 3600, lambda: fetch_korea_market_data(date))


def _briefing_headlines(groups):
    headlines = []
    for i, g in enumerate(groups[:4], 1):
        subject = g["company"] or g["sector"]
        docs_sorted = top_records(g["docs"], ["marketRelevance", "sourceWeight"], 6, descending=True)
        tags = sorted(set(sum([d.get("sectors", []) + d.get("impactTags", []) for d in docs_sorted], [])))[:8]
        variable = ", ".join([t for t in tags if t in IMPACT_TERMS][:3]) or "실적, 수급, 밸류에이션"
        title = f"{subject}, {variable} 변수가 시장 기대를 재조정"
        body = (
            f"{subject} 관련 뉴스는 {', '.join(sorted(set(d['source'] for d in docs_sorted))[:4])} 자료에서 확인됩니다. "
            f"{group_digest(g, 2)} 핵심은 {variable}이 투자자 기대를 움직일 수 있다는 점입니다. "
            "후속 공시, 컨퍼런스콜 발언, 거래대금, 외국인·기관 수급이 함께 따라오는지 확인해야 합니다."
        )
        headlines.append({
            "id": f"h{i}",
            "title": title,
            "body": body,
            "tags": tags,
            "sources": [
                {
                    "title": d["title"],
                    "source": d["source"],
                    "date": d["date"],
                    "url": d.get("url", ""),
                    "path": d["path"],
                    "type": d["type"],
                }
                for d in docs_sorted
            ],
        })
    return headlines


def prepare_briefing_pack(date: str | None = None, *, strict_date=False, quality_mode="diagnose_only", market_scope="both", briefing_type="default") -> tuple[dict, Path]:
    date = date or kst_date()
    quality_mode = normalize_quality_mode(quality_mode)
    market_scope = normalize_market_scope(market_scope)
    briefing_type = normalize_briefing_type(briefing_type)
    try:
        build_index(incremental=True)
    except Exception:
        pass
    today = kst_date()
    index = load_index()
    docs, source_date, market_windows = select_briefing_docs(news_documents(index), date, strict=bool(strict_date), today=today)
    for doc in docs:
        doc["marketSessionDate"] = infer_market_session_date(doc, market_windows)
    scoped_docs = documents_for_scope(docs, market_scope)
    groups = prioritize_briefing_groups(group_docs(scoped_docs), market_windows, limit=6)
    market_drivers = derive_market_drivers(scoped_docs, market_windows, limit=4)
    session_modes = session_modes_from_windows(market_windows)
    issue_coverage_raw = []
    for target in (["US", "KR"] if market_scope == "both" else [market_scope.upper()]):
        issue_coverage_raw.extend(build_issue_coverage(scoped_docs, target, market_windows, limit=10))
    visual_scope_results = {}
    for target in (["us", "kr"] if market_scope == "both" else [market_scope]):
        target_docs = documents_for_scope(docs, target)
        visual_scope_results[target] = {
            "marketSessionDate": (
                market_windows.get("usRegularSessionDate") if target == "us"
                else market_windows.get("krCurrentSessionDate") or market_windows.get("krPreviousSessionDate")
            ),
            "groups": prioritize_briefing_groups(group_docs(target_docs), market_windows, limit=6),
        }
    try:
        visual_result = collect_briefing_visuals(date, market_scope, visual_scope_results)
    except Exception as exc:
        visual_result = {
            "visualRecommendations": [], "visualSnapshots": [], "sidecar": {},
            "warnings": [f"visual snapshot collection failed: {str(exc)[:160]}"],
        }
    market_snapshot = cached_market_snapshot()
    korea_market_data = cached_korea_market_data(date)
    market_tape = build_market_tape(
        date=date,
        market_snapshot=market_snapshot,
        korea_market_data=korea_market_data,
        market_windows=market_windows,
    )
    quality_preflight = preflight_from_context("briefing", {}, {
        "artifactId": date,
        "sourceCount": len(docs),
        "marketTape": market_tape,
    })
    memories = list_briefing_memories(MARKET_MEMORY_DB_PATH, limit=12)
    prev_briefing = load_prev_briefing(date)
    prev_checklist = extract_prev_checklist((prev_briefing or {}).get("markdown", ""))
    context, used_docs = build_llm_context(
        date,
        source_date,
        scoped_docs,
        groups,
        market_drivers=market_drivers,
        market_snapshot=market_snapshot,
        memories=memories,
        market_windows=market_windows,
        prev_checklist=prev_checklist,
        korea_market_data=korea_market_data,
        market_scope=market_scope,
        briefing_type=briefing_type,
        issue_coverage=issue_coverage_raw,
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
    context = "\n\n".join([context, build_preflight_evidence_context(
        "briefing",
        preflight=quality_preflight,
        artifact={"sources": used_docs, "stats": {"sourceCount": len(used_docs)}, "dataGaps": []},
    )])
    hint_block = render_prompt_hints(quality_preflight)
    if hint_block:
        context = "\n\n".join([context, hint_block])
    sources = prioritized_source_refs(scoped_docs, market_windows, limit=14, issue_coverage=issue_coverage_raw) or briefing_sources_from_headlines(_briefing_headlines(groups), limit=14)
    session_counts = session_doc_counts(scoped_docs, market_windows)
    draft = {
        "date": date,
        "generatedAt": now_iso(),
        "title": f"Daily Market Briefing — {date.replace('-', '.')}",
        "summary": f"{source_date}에 수집된 최신 자료를 바탕으로 미국장과 한국장의 시장 반응, 핵심 이슈, 주도 기업을 정리했습니다.",
        "marketScope": market_scope,
        "briefingType": briefing_type,
        "prompt": read_briefing_prompt(market_scope),
        "promptPath": briefing_prompt_path_label(market_scope),
        "headlines": _briefing_headlines(groups),
        "sources": source_refs(sources, limit=14),
        "marketSnapshot": market_snapshot,
        "koreaMarketData": korea_market_data,
        "marketWindows": market_windows,
        "marketDrivers": [
            {
                "driver": d.get("driver", ""),
                "score": round(float(d.get("score", 0)), 1),
                "markets": d.get("markets", []),
                "sources": d.get("sources", []),
                "impactTags": d.get("impactTags", []),
                "sectors": d.get("sectors", []),
                "docCount": len(d.get("docs", [])),
            }
            for d in market_drivers
        ],
        "issueCoverage": public_issue_coverage(issue_coverage_raw),
        "briefings": {},
        "visualRecommendations": visual_result.get("visualRecommendations", []),
        "visualSnapshots": visual_result.get("visualSnapshots", []),
        "visualWarnings": visual_result.get("warnings", []),
        "stats": {
            "documents": len(scoped_docs),
            "sourceDate": source_date,
            "analysisMode": market_windows.get("analysisMode", ""),
            "driverCount": len(market_drivers),
            "topDrivers": [d.get("driver", "") for d in market_drivers],
            "sourceCount": len(sources),
            "marketScope": market_scope,
            "issueCount": len(issue_coverage_raw),
            "koreaMarketDataOk": bool(korea_market_data.get("ok")) if isinstance(korea_market_data, dict) else False,
            **session_counts,
        },
    }
    pack = A.build_pack(
        task_type="briefing",
        artifact_type="briefing",
        artifact_id=date,
        title=draft["title"],
        prompt=read_briefing_prompt(market_scope),
        context=context,
        output_contract=briefing_output_contract(market_scope, briefing_type),
        write_back_contract={"method": "write_markdown", "target": str(BRIEFINGS_DIR / f"{date}.json")},
        save_target=str(BRIEFINGS_DIR / f"{date}.json"),
        draft_artifact=draft,
        sources=sources,
        market_tape=market_tape,
        internal={
            "groups": groups, "qualityMode": quality_mode, "qualityPreflight": quality_preflight,
            "marketScope": market_scope, "visualSidecar": visual_result.get("sidecar", {}),
            "visualScopeResults": visual_scope_results,
        },
    )
    return pack, A.write_pack(pack)


def write_briefing_from_markdown(pack: dict, markdown: str) -> dict:
    draft = dict(pack.get("draftArtifact") or {})
    date = draft.get("date") or pack.get("artifactId") or kst_date()
    market_scope = normalize_market_scope(draft.get("marketScope", "both"))
    draft["marketScope"] = market_scope
    contract = pack.get("outputContract") or briefing_output_contract(
        market_scope, draft.get("briefingType", "default")
    )
    violations = briefing_contract_violations(markdown, contract)
    if violations:
        raise ValueError(f"CLI 브리핑 출력 계약 위반: {'; '.join(violations)}")
    leader_subjects = leading_company_subjects_from_markdown(markdown)
    visual_scope_results = (pack.get("internal") or {}).get("visualScopeResults") or {}
    aligned_visuals = {
        "visualRecommendations": [],
        "visualSnapshots": [],
        "warnings": list(leader_subjects.get("warnings") or []),
    }
    if visual_scope_results:
        try:
            aligned_visuals = collect_briefing_visuals(
                date,
                market_scope,
                visual_scope_results,
                leader_subjects=leader_subjects,
                include_market_visuals=False,
            )
        except Exception as exc:
            aligned_visuals["warnings"].append(
                f"leading company visual alignment failed: {str(exc)[:160]}"
            )
    draft = replace_leading_company_visuals(draft, aligned_visuals)
    sources = source_refs(pack.get("sources") or draft.get("sources") or [], limit=14)
    markdown = append_briefing_sources(str(markdown or "").strip(), sources, limit=14)
    generation = A.agent_generation(
        len(sources),
        message="LLM CLI 브리핑 생성 완료: Agent CLI / context pack 기반",
    )
    checkpoints = checkpoints_from_markdown(
        markdown,
        artifact_type="briefing",
        artifact_id=date,
        headings=["내일 확인할 체크포인트", "오늘의 투자 체크리스트", "다음 체크포인트"],
        scope="market",
        topic="Daily Market Briefing",
    )
    gaps = []
    if not checkpoints:
        gaps.append("브리핑에서 구조화 가능한 체크포인트 섹션을 찾지 못했습니다.")
    if not draft.get("stats", {}).get("documents"):
        gaps.append("브리핑 입력 뉴스 자료가 없습니다.")
    if not (draft.get("marketSnapshot") or {}).get("ok"):
        gaps.append("미국/글로벌 시장 스냅샷을 불러오지 못했습니다.")
    if not (draft.get("koreaMarketData") or {}).get("ok"):
        gaps.append("한국장 시장 수치를 불러오지 못했습니다.")
    gaps.extend(f"시각자료: {warning}" for warning in draft.get("visualWarnings", []))
    for snapshot in draft.get("visualSnapshots", []):
        gaps.extend(f"시각자료 {snapshot.get('id', '')}: {warning}" for warning in snapshot.get("warnings", []))
        if (snapshot.get("coverage") or {}).get("status") == "partial":
            gaps.append(f"시각자료 {snapshot.get('id', '')}: 일부 종목만 수집됐습니다.")
        if snapshot.get("freshness") in {"stale", "unavailable"}:
            gaps.append(
                f"시각자료 {snapshot.get('id', '')}: {snapshot.get('freshness')} "
                f"(session {snapshot.get('marketSessionDate', '')}, asOf {snapshot.get('asOf', '')})"
            )
    sections = enrich_briefing_sections(
        split_market_markdown(markdown, market_scope),
        report_date=date,
        report_scope=market_scope,
        briefing_type=draft.get("briefingType", "default"),
        generated_at=draft.get("generatedAt", ""),
        report_summary=draft.get("summary", ""),
    )
    briefing = {
        **draft,
        "markdown": markdown,
        "briefings": sections,
        "sources": sources,
        "generation": generation,
        "checkpoints": checkpoints,
        "dataGaps": data_gaps_from_messages(gaps, artifact_type="briefing", artifact_id=date),
        "marketTape": pack.get("marketTape") or {},
    }
    try:
        briefing = apply_quality_loop(
            "briefing",
            briefing,
            mode=(pack.get("internal") or {}).get("qualityMode", "diagnose_only"),
            preflight=(pack.get("internal") or {}).get("qualityPreflight"),
        )
    except Exception as exc:
        briefing["quality"] = {"status": "warn", "warnings": [f"quality evaluation failed: {str(exc)[:120]}"]}
    if market_scope == "both":
        try:
            for entry in build_memory_from_briefing(briefing, (pack.get("internal") or {}).get("groups") or []):
                upsert_memory(MARKET_MEMORY_DB_PATH, entry)
        except Exception:
            briefing.setdefault("warnings", []).append("agent writeback skipped market memory update")

    BRIEFINGS_DIR.mkdir(parents=True, exist_ok=True)
    requested_scopes = ["us", "kr"] if market_scope == "both" else [market_scope]
    saved_reports = {}
    sidecar = (pack.get("internal") or {}).get("visualSidecar") or {}
    for scope in requested_scopes:
        scoped_briefing = _single_market_briefing(briefing, scope)
        save_path = BRIEFINGS_DIR / briefing_file_name(date, scope)
        existing = read_json(save_path, None)
        if existing is None:
            legacy = read_json(BRIEFINGS_DIR / briefing_file_name(date), None)
            existing = briefing_scope_view(legacy, scope) if isinstance(legacy, dict) else None
        scoped_briefing = merge_briefing_report(scoped_briefing, existing, scope)
        write_json(save_path, scoped_briefing)
        saved_reports[scope] = scoped_briefing
        try:
            scoped_sidecar = _sidecar_for_market(sidecar, scope)
            if scoped_sidecar.get("snapshots"):
                write_visual_sidecar(
                    BRIEFINGS_DIR / visual_sidecar_gzip_file_name(date, scope),
                    scoped_sidecar,
                    scope,
                )
        except Exception as exc:
            scoped_briefing.setdefault("warnings", []).append(f"visual sidecar write failed: {str(exc)[:160]}")
            write_json(save_path, scoped_briefing)

    if len(requested_scopes) == 1:
        return saved_reports.get(requested_scopes[0], briefing)
    briefing["briefings"] = {
        scope: saved_reports[scope] for scope in requested_scopes if scope in saved_reports
    }
    return briefing_scope_view(briefing, market_scope)


def prepare_company_analysis_pack(query: str, *, quality_mode="diagnose_only", web_search=False, analysis_style="beginner") -> tuple[dict, Path]:
    analysis_style = normalize_analysis_style(analysis_style)
    index = load_index()
    docs = search_documents(index, query=query, company=query, limit=30)
    company = infer_requested_company(query, docs)
    materials = build_company_analysis_materials(query, docs, company)
    selected = materials.get("selectedDocs", [])
    quality_preflight = preflight_from_context("company_analysis", {}, {
        "sourceCount": len(selected) or len(docs),
        "documentCount": len(docs),
        "analysisInputs": {
            "secFactsOk": bool(materials.get("secFacts", {}).get("ok")),
            "rankedFilingOk": bool(materials.get("rankedFiling", {}).get("ok")),
        },
    })
    context = materials["context"]
    context = "\n\n".join([context, render_quality_target_context(
        "company_analysis",
        preflight=quality_preflight,
        context={"extraRoutes": [
            f"현재 로컬 filings/reports/articles/rss 개수: {materials.get('counts', {})}",
            f"로컬 IR/실적발표 감지 수: {materials.get('localIrEarningsCount', 0)}",
            "공식 숫자가 없으면 dataGap으로 남기고, 웹 검색 사용 시 공식 IR·SEC·DART를 우선한다.",
        ]},
    )])
    context = "\n\n".join([context, build_preflight_evidence_context(
        "company_analysis",
        preflight=quality_preflight,
        artifact={
            "sources": selected,
            "analysisInputs": {
                "secFactsOk": bool((materials.get("secFacts") or {}).get("ok")),
                "rankedFilingOk": bool((materials.get("rankedFiling") or {}).get("ok")),
            },
            "dataGaps": [],
        },
    )])
    hint_block = render_prompt_hints(quality_preflight)
    if hint_block:
        context = "\n\n".join([context, hint_block])
    if web_search:
        context = "\n\n".join([context, company_external_search_context(materials)])
    charts = build_company_analysis_charts(materials)
    data_gaps = resolve_company_analysis_gaps(materials, web_search_allowed=bool(web_search))
    prompt = read_company_analysis_prompt(analysis_style)
    draft = {
        "saved": False,
        "generatedAt": now_iso(),
        "query": query,
        "company": materials.get("company") or company,
        "documentCount": len(docs),
        "headline": f"{(materials.get('company') or company).get('name', query)} 기업 분석",
        "analysisStyle": analysis_style,
        "dataGaps": data_gaps,
        "resolutionAttempts": data_gaps.get("gaps", []),
        "prompt": prompt,
        "promptPath": str(analysis_prompt_path(analysis_style)),
        "sources": company_analysis_sources(materials, selected[:14]),
        "analysisCharts": charts,
        "analysisInputs": {
            "secFactsOk": bool(materials.get("secFacts", {}).get("ok")),
            "rankedFilingOk": bool(materials.get("rankedFiling", {}).get("ok")),
            "rankedParagraphs": len(materials.get("rankedFiling", {}).get("paragraphs", [])),
        },
    }
    pack = A.build_pack(
        task_type="company_analysis",
        artifact_type="company_analysis",
        artifact_id=f"{(draft['company'].get('ticker') or query)}_{str(draft['generatedAt'])[:10]}",
        title=draft["headline"],
        prompt=prompt,
        context=context,
        output_contract={"format": "markdown", "analysisStyle": analysis_style, "requiredSections": ["핵심 판단", "기업 개요와 돈 버는 방식", "실적과 재무 품질", "밸류에이션", "리스크와 반증조건", "자료 한계와 참고자료"]},
        write_back_contract={"method": "write_markdown", "target": "data/company-analysis/{stable-id}.json"},
        save_target=str(ANALYSIS_REPORTS_DIR),
        metadata={"analysisStyle": analysis_style},
        draft_artifact=draft,
        sources=draft["sources"],
        data_gaps=data_gaps.get("gaps", []),
        internal={"qualityMode": normalize_quality_mode(quality_mode), "qualityPreflight": quality_preflight, "analysisStyle": analysis_style},
    )
    return pack, A.write_pack(pack)


def write_company_analysis_from_markdown(pack: dict, markdown: str) -> dict:
    report = dict(pack.get("draftArtifact") or {})
    report["markdown"] = str(markdown or "").strip()
    report["generation"] = A.agent_generation(len(report.get("sources") or []))
    try:
        report = apply_quality_loop(
            "company_analysis",
            report,
            mode=(pack.get("internal") or {}).get("qualityMode", "diagnose_only"),
            preflight=(pack.get("internal") or {}).get("qualityPreflight"),
        )
    except Exception as exc:
        report["quality"] = {"status": "warn", "warnings": [f"quality evaluation failed: {str(exc)[:120]}"]}
    return save_analysis_report(report)


def prepare_topic_report_pack(
    topic_key: str,
    *,
    custom_label: str = "",
    user_context: str = "",
    date: str | None = None,
    use_planner: bool = True,
    custom_tickers: dict | None = None,
    quality_mode: str = "diagnose_only",
) -> tuple[dict, Path]:
    date = date or kst_date()
    topic = get_topic_config(topic_key, custom_label=custom_label or None, custom_tickers=custom_tickers)
    topic_plan = None
    if use_planner:
        try:
            topic_plan = build_topic_plan(
                topic_key,
                custom_label=custom_label,
                user_context=user_context,
                llm_override=False,
                preset_config=topic if topic_key != "custom" else None,
            )
        except Exception:
            topic_plan = None
    if topic_plan and topic_key == "custom":
        if topic_plan.get("searchQueries"):
            topic["search_keywords"] = topic_plan["searchQueries"]
        if topic_plan.get("memoryQueries"):
            topic["memory_keywords"] = topic_plan["memoryQueries"]
        if topic_plan.get("analysisAxes"):
            topic["theme_axes"] = [axis["label"] for axis in topic_plan["analysisAxes"]]
        if topic_plan.get("reportType"):
            topic["report_type"] = topic_plan["reportType"]
        if not custom_tickers and topic_plan.get("candidateTickers"):
            merged = dict(topic_plan["candidateTickers"])
            for ticker, name in topic["tickers"].items():
                if ticker not in merged and len(merged) < 12:
                    merged[ticker] = name
            topic["tickers"] = merged
    market_data = fetch_topic_market_data(topic["tickers"], history_period=topic.get("history_period", "1y"))
    macro_data = fetch_macro_data(
        fred_series=topic.get("fred_series", []),
        bok_series=topic.get("bok_series", []),
        fred_key=fred_api_key(),
        bok_key=bok_api_key(),
    )
    evidence_pack = None
    source_ledger = []
    if topic_plan:
        evidence_pack = build_evidence_pack(
            topic_plan,
            search_docs=lambda queries, limit=12: topic_search_docs(list(queries), limit=limit),
            search_memories=lambda keywords, limit=20: topic_search_memories(list(keywords), limit=limit),
            date=date,
        )
        docs = evidence_pack["items"]
        memories = evidence_pack["marketMemory"]
        source_ledger = build_source_ledger(docs)
    else:
        docs = topic_search_docs(topic["search_keywords"])
        memories = topic_search_memories(topic["memory_keywords"])
    quality_preflight = preflight_from_context("topic_report", {}, {
        "artifactId": f"{date}:{topic['key']}",
        "sourceCount": len(docs),
        "sourceLedger": source_ledger,
        "evidenceItems": docs,
        "dataGaps": (evidence_pack or {}).get("dataGaps") or [],
    })
    prompt = read_topic_prompt()
    report_type = (topic_plan or {}).get("reportType") or topic.get("report_type", "")
    if prompt:
        prompt = compose_prompt(prompt, report_type)
    context = build_topic_llm_context(
        topic,
        market_data,
        macro_data,
        docs,
        memories,
        user_context,
        date,
        data_gaps=evidence_pack["dataGaps"] if evidence_pack else None,
    )
    context = "\n\n".join([context, render_quality_target_context(
        "topic_report",
        preflight=quality_preflight,
        context={"extraRoutes": [
            "Evidence Pack의 analysisAxes별 빈 축은 dataGap으로 처리하고 본문에서 한계로 명시한다.",
            "marketData/FRED/BOK가 없으면 해당 수치를 만들지 말고 Source & Data Notes에 남긴다.",
        ]},
    )])
    context = "\n\n".join([context, build_preflight_evidence_context(
        "topic_report",
        preflight=quality_preflight,
        artifact={
            "sourceLedger": source_ledger,
            "evidenceItems": docs,
            "dataGaps": (evidence_pack or {}).get("dataGaps") or [],
        },
    )])
    hint_block = render_prompt_hints(quality_preflight)
    if hint_block:
        context = "\n\n".join([context, hint_block])
    draft = {
        "saved": False,
        "generatedAt": now_iso(),
        "date": date,
        "topicKey": topic["key"],
        "topicLabel": topic["label"],
        "title": f"{topic['label']} 분석 리포트 — {date}",
        "topicPlan": topic_plan,
        "marketData": market_data,
        "macroAvailable": macro_data.get("ok", False),
        "sources": topic_doc_sources(docs),
        "memoryCount": len(memories),
        "docCount": len(docs),
        "userContext": bool(user_context and user_context.strip()),
        "personalOverlay": None,
    }
    pack = A.build_pack(
        task_type="topic_report",
        artifact_type="topic_report",
        artifact_id=f"{date}_{topic['key']}_{topic['label']}",
        title=draft["title"],
        prompt=prompt,
        context=context,
        output_contract={"format": "markdown", "requiredSections": ["Executive Summary", "반론과 리스크", "앞으로 확인할 체크포인트", "결론", "Source & Data Notes"]},
        write_back_contract={"method": "write_markdown", "target": "data/topic-reports/{stable-id}.json"},
        save_target=str(DATA_DIR / "topic-reports"),
        draft_artifact=draft,
        sources=draft["sources"],
        source_ledger=source_ledger,
        data_gaps=(evidence_pack or {}).get("dataGaps") or [],
        market_tape=build_market_tape(date=date, topic_market_data=market_data),
        internal={
            "topic": topic,
            "docs": docs,
            "memories": memories,
            "evidencePack": evidence_pack,
            "macroData": macro_data,
            "qualityMode": normalize_quality_mode(quality_mode),
            "qualityPreflight": quality_preflight,
        },
    )
    return pack, A.write_pack(pack)


def write_topic_report_from_markdown(pack: dict, markdown: str) -> dict:
    draft = dict(pack.get("draftArtifact") or {})
    internal = pack.get("internal") or {}
    docs = internal.get("docs") or []
    evidence_pack = internal.get("evidencePack")
    evidence_summary = evidence_pack_summary(evidence_pack) if evidence_pack else None
    data_gaps = data_gaps_from_messages(
        (evidence_pack or {}).get("dataGaps") or [],
        artifact_type="topic_report",
        category="evidence",
        source_section="Evidence Pack",
    )
    evidence_items = evidence_items_from_list(docs, artifact_type="topic_report", default_type="news")
    source_ledger = source_ledger_from_items(pack.get("sourceLedger") or docs, artifact_type="topic_report")
    checkpoints = checkpoints_from_markdown(
        markdown,
        artifact_type="topic_report",
        scope="market",
        topic=draft.get("topicLabel", ""),
        headings=["앞으로 확인할 체크포인트", "체크포인트", "다음 체크포인트"],
    )
    market_tape = pack.get("marketTape") or {}
    quality = evaluate_report(
        markdown,
        evidence_summary=evidence_summary,
        topic_plan=draft.get("topicPlan"),
        user_context_present=bool(draft.get("userContext")),
        checkpoints=checkpoints,
        source_ledger=source_ledger,
        evidence_items=evidence_items,
        data_gaps=data_gaps,
        market_tape=market_tape,
        artifact_type="topic_report",
    )
    report = {
        **draft,
        "markdown": str(markdown or "").strip(),
        "evidencePackSummary": evidence_summary,
        "evidenceItems": evidence_items,
        "sourceLedger": source_ledger,
        "checkpoints": checkpoints,
        "dataGaps": data_gaps,
        "marketTape": market_tape,
        "quality": quality,
        "qualityPreflight": internal.get("qualityPreflight"),
        "generation": A.agent_generation(len(docs)),
    }
    try:
        report = apply_quality_loop(
            "topic_report",
            report,
            mode=internal.get("qualityMode", "diagnose_only"),
            preflight=internal.get("qualityPreflight"),
        )
    except Exception:
        pass
    return save_topic_report(report)


def _load_canonical_for_overlay(report_kind: str, report_id: str) -> tuple[dict, Path, str]:
    kind = str(report_kind or "").strip().lower()
    if kind == "briefing":
        path = BRIEFINGS_DIR / f"{report_id}.json"
        canonical = read_json(path, None)
        return canonical, path, "briefing"
    if kind in {"analysis", "company_analysis"}:
        canonical = get_analysis_report(report_id)
        path = ANALYSIS_REPORTS_DIR / f"{(canonical or {}).get('id') or report_id}.json"
        return canonical, path, "analysis"
    if kind == "topic_report":
        from features.topic_report.service import get_topic_report
        canonical = get_topic_report(report_id)
        filename = (canonical or {}).get("filename") or f"{report_id}.json"
        path = DATA_DIR / "topic-reports" / filename
        return canonical, path, "topic_report"
    raise ValueError("report_kind must be briefing, analysis, or topic_report")


def prepare_personal_overlay_pack(report_kind: str, report_id: str) -> tuple[dict, Path]:
    canonical, path, kind = _load_canonical_for_overlay(report_kind, report_id)
    if not canonical:
        raise FileNotFoundError(f"Report not found: {report_kind}/{report_id}")
    hypotheses = _gather_hypotheses(kind, canonical)
    context = overlay_build_context(canonical, hypotheses, kind)
    pack = A.build_pack(
        task_type="personal_overlay",
        artifact_type=f"{kind}_personal_overlay",
        artifact_id=f"{kind}_{report_id}",
        title=f"Personal Overlay — {canonical.get('title') or canonical.get('headline') or report_id}",
        prompt=read_overlay_prompt(),
        context=context,
        output_contract={
            "format": "json",
            "requiredFields": ["linkedNotes", "supportingEvidence", "counterEvidence", "contradictions", "uncertainties", "personalQuestions", "stance", "markdown"],
            "stanceEnum": ["supportive", "mixed", "contradictory", "insufficient"],
        },
        write_back_contract={"method": "write_json", "target": str(path), "field": "personalOverlay"},
        save_target=str(path),
        draft_artifact={"canonical": {"id": report_id, "kind": kind, "title": canonical.get("title") or canonical.get("headline", "")}},
        internal={"reportKind": kind, "reportPath": str(path), "hypotheses": hypotheses},
    )
    return pack, A.write_pack(pack)


def write_personal_overlay_from_json(pack: dict, overlay_payload: dict) -> dict:
    if not isinstance(overlay_payload, dict):
        raise ValueError("personal_overlay writeback payload must be a JSON object")
    path = Path((pack.get("internal") or {}).get("reportPath") or pack.get("saveTarget"))
    if not path.is_absolute():
        path = ROOT / path
    canonical = read_json(path, None)
    if not canonical:
        raise FileNotFoundError(f"Report not found: {path}")
    hypotheses = (pack.get("internal") or {}).get("hypotheses") or []
    linked_notes = [
        {"noteId": h.get("note_id", ""), "title": h.get("title") or h.get("rel_path", ""), "type": h.get("note_type", ""), "ticker": h.get("ticker", "")}
        for h in hypotheses
    ]
    overlay = overlay_schema.normalize_overlay(overlay_payload, linked_notes=linked_notes, markdown=str(overlay_payload.get("markdown") or ""))
    overlay["generation"] = A.agent_generation(len(pack.get("sources") or []))
    updated = with_overlay(canonical, overlay, status="ok_agent_authored")
    write_json(path, updated)
    return {"ok": True, "personalOverlay": updated["personalOverlay"], "path": str(path)}


def prepare_thesis_delta_pack(ticker: str, *, period="90d", evidence_limit=12) -> tuple[dict, Path]:
    thesis = get_thesis(ticker)
    if not thesis:
        raise FileNotFoundError(f"Thesis not found: {ticker}")
    period = thesis_delta.normalize_period(period)
    evidence, meta = thesis_delta.gather_local_evidence(thesis, period=period, limit=int(evidence_limit or 12))
    context = thesis_delta.build_context(thesis, evidence, meta)
    pack = A.build_pack(
        task_type="thesis_delta",
        artifact_type="thesis_delta",
        artifact_id=f"{thesis.get('ticker')}_{period}",
        title=f"Thesis Delta — {thesis.get('ticker')}",
        prompt=thesis_delta.read_prompt(),
        context=context,
        output_contract={
            "format": "json",
            "requiredFields": ["verdict", "summary", "supportingEvidence", "counterEvidence", "contradictions", "uncertainties", "nextCheckpoints", "markdown"],
            "verdictEnum": ["strengthened", "maintained", "weakened", "at_risk", "broken", "insufficient_evidence"],
        },
        write_back_contract={"method": "write_json", "target": "market-memory.sqlite3::thesis_delta"},
        save_target=str(MARKET_MEMORY_DB_PATH),
        draft_artifact={"thesis": thesis, "meta": meta},
        sources=evidence,
        internal={"thesis": thesis, "meta": meta, "evidence": evidence},
    )
    return pack, A.write_pack(pack)


def write_thesis_delta_from_json(pack: dict, delta_payload: dict) -> dict:
    if not isinstance(delta_payload, dict):
        raise ValueError("thesis_delta writeback payload must be a JSON object")
    thesis = (pack.get("internal") or {}).get("thesis") or (pack.get("draftArtifact") or {}).get("thesis")
    meta = (pack.get("internal") or {}).get("meta") or (pack.get("draftArtifact") or {}).get("meta") or {}
    evidence = (pack.get("internal") or {}).get("evidence") or pack.get("sources") or []
    if not thesis:
        raise ValueError("Pack does not contain thesis data")
    delta = thesis_delta.normalize_delta(delta_payload, thesis=thesis, evidence=evidence, meta=meta)
    delta["generation"] = A.agent_generation(len(evidence))
    delta["company"] = thesis.get("company", "")
    conn = thesis_store.connect()
    try:
        saved = thesis_store.save_delta(conn, thesis.get("ticker"), delta)
    finally:
        conn.close()
    return {"ok": True, "delta": saved}


def prepare_market_memory_pack(date: str | None = None) -> tuple[dict, Path]:
    date = date or kst_date()
    context, used_docs, source_date = build_memory_llm_context(date)
    pack = A.build_pack(
        task_type="market_memory_llm",
        artifact_type="market_memory",
        artifact_id=date,
        title=f"Market Memory Update — {date}",
        prompt=read_market_memory_prompt(),
        context=context,
        output_contract={
            "format": "json",
            "requiredFields": ["entries"],
            "maxEntries": 3,
        },
        write_back_contract={"method": "write_json", "target": "market-memory.sqlite3::market_memory"},
        save_target=str(MARKET_MEMORY_DB_PATH),
        sources=source_refs(used_docs, limit=12),
        internal={"date": date, "sourceDate": source_date, "usedDocs": used_docs},
    )
    return pack, A.write_pack(pack)


def write_market_memory_from_json(pack: dict, payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ValueError("market_memory_llm writeback payload must be a JSON object")
    internal = pack.get("internal") or {}
    date = internal.get("date") or pack.get("artifactId") or kst_date()
    used_docs = internal.get("usedDocs") or []
    entries = payload.get("entries") or []
    if not isinstance(entries, list):
        raise ValueError("market_memory_llm entries must be a list")
    saved = []
    dropped = []
    for raw_entry in entries[:3]:
        entry, reason = normalize_llm_memory_entry(raw_entry, date, used_docs)
        if not entry:
            dropped.append(reason or "invalid_entry")
            continue
        entry["sourceKind"] = "agent"
        entry["generation"] = A.agent_generation(len(entry.get("sources") or []))
        saved.append(upsert_memory(MARKET_MEMORY_DB_PATH, entry))
    return {
        "ok": True,
        "status": "ok_agent_authored",
        "sourceDate": internal.get("sourceDate", ""),
        "rawEntryCount": len(entries),
        "droppedCount": len(dropped),
        "droppedReasons": dropped,
        "saved": saved,
        "message": f"AI 에이전트 시장 내러티브 {len(saved)}건을 저장했습니다.",
        "generation": A.agent_generation(len(used_docs)),
    }


def prepare_market_state_snapshot_pack(date: str | None = None) -> tuple[dict, Path]:
    date = date or kst_date()
    context_payload = build_market_state_context(db_path=MARKET_MEMORY_DB_PATH)
    context = json.dumps(context_payload, ensure_ascii=False, indent=2)
    pack = A.build_pack(
        task_type="market_state_snapshot",
        artifact_type="market_state_snapshot",
        artifact_id=date,
        title=f"Market State Snapshot — {date}",
        prompt=MARKET_STATE_SNAPSHOT_PROMPT,
        context=context,
        output_contract={
            "format": "json",
            "requiredFields": [
                "headline",
                "oneLineSummary",
                "beginnerSummary",
                "marketRegime",
                "actionPosture",
                "actionGuide",
                "keyDrivers",
                "watchItems",
                "counterEvidence",
                "sourceRefs",
                "confidence",
            ],
        },
        write_back_contract={"method": "write_json", "target": "market-memory.sqlite3::market_state_snapshots"},
        save_target=str(MARKET_MEMORY_DB_PATH),
        sources=context_payload.get("sourceRefs") or [],
        internal={"date": date, "sourceRefs": context_payload.get("sourceRefs") or []},
    )
    return pack, A.write_pack(pack)


def write_market_state_snapshot_from_json(pack: dict, payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ValueError("market_state_snapshot writeback payload must be a JSON object")
    snapshot_payload = dict(payload)
    try:
        context_payload = json.loads(pack.get("context") or "{}")
    except Exception:
        context_payload = {"sourceRefs": (pack.get("internal") or {}).get("sourceRefs") or []}
    snapshot = save_market_state_snapshot(MARKET_MEMORY_DB_PATH, snapshot_payload, context=context_payload)
    generation = A.agent_generation(len((pack.get("internal") or {}).get("sourceRefs") or snapshot.get("sourceRefs") or []))
    return {
        "ok": True,
        "status": "ok_agent_authored",
        "snapshot": snapshot,
        "generation": generation,
        "message": "AI Agent 시장 상태 스냅샷을 저장했습니다.",
    }


def prepare_quality_repair_pack(artifact_type: str, artifact_id: str) -> tuple[dict, Path]:
    artifact_type = str(artifact_type or "").strip()
    artifact_id = str(artifact_id or "").strip()
    if artifact_type not in {"briefing", "company_analysis", "topic_report"}:
        raise ValueError("quality_repair supports briefing, company_analysis, and topic_report")
    artifact = load_artifact(artifact_type, artifact_id)
    if not artifact:
        raise FileNotFoundError(f"Artifact not found: {artifact_type}/{artifact_id}")
    context = json.dumps({
        "artifactType": artifact_type,
        "artifactId": artifact_id,
        "instruction": "Repair weak sections using only the existing evidence. Preserve correct sections and the report's overall structure.",
        "quality": artifact.get("quality") or {},
        "qualityGeneration": artifact.get("qualityGeneration") or {},
        "sourceLedger": artifact.get("sourceLedger") or [],
        "evidenceItems": artifact.get("evidenceItems") or [],
        "dataGaps": artifact.get("dataGaps") or [],
        "markdown": artifact.get("markdown") or "",
    }, ensure_ascii=False, indent=2)
    prompt = """Improve only weak sections of the stored Folio OS report. Use no facts outside the supplied evidence and source ledger. Preserve the report type, headings, supported numbers, counter-evidence, uncertainties, checkpoints, and Source & Data Notes. Return the complete repaired Markdown only."""
    pack = A.build_pack(
        task_type="quality_repair",
        artifact_type="quality_repair",
        artifact_id=f"{artifact_type}_{artifact_id}",
        title=f"Quality Repair — {artifact.get('title') or artifact.get('headline') or artifact_id}",
        prompt=prompt,
        context=context,
        output_contract={"format": "markdown", "preserveCanonicalStructure": True},
        write_back_contract={"method": "write_markdown", "targetArtifactType": artifact_type, "targetArtifactId": artifact_id},
        save_target=f"{artifact_type}:{artifact_id}",
        draft_artifact=artifact,
        sources=artifact.get("sources") or [],
        source_ledger=artifact.get("sourceLedger") or [],
        evidence_items=artifact.get("evidenceItems") or [],
        data_gaps=artifact.get("dataGaps") or [],
        market_tape=artifact.get("marketTape") or {},
        internal={"targetArtifactType": artifact_type, "targetArtifactId": artifact_id},
    )
    return pack, A.write_pack(pack)


def write_quality_repair_from_markdown(pack: dict, markdown: str) -> dict:
    internal = pack.get("internal") or {}
    artifact_type = internal.get("targetArtifactType")
    artifact_id = internal.get("targetArtifactId")
    artifact = dict(pack.get("draftArtifact") or {})
    if not artifact or not artifact_type or not artifact_id:
        raise ValueError("quality_repair pack is missing target artifact data")
    previous_quality = artifact.get("quality") or {}
    artifact["markdown"] = str(markdown or "").strip()
    artifact["quality"] = evaluate_artifact(artifact_type, artifact)
    artifact["qualityGeneration"] = {
        **(artifact.get("qualityGeneration") or {}),
        "mode": "agent_cli_repair",
        "repairApplied": True,
        "repairCount": 1,
        "repairType": "agent",
        "qualityBefore": previous_quality,
        "qualityAfter": artifact["quality"],
        "generation": A.agent_generation(len(artifact.get("sources") or [])),
    }
    if artifact_type == "briefing":
        write_json(BRIEFINGS_DIR / f"{artifact_id}.json", artifact)
        return artifact
    if artifact_type == "company_analysis":
        return save_analysis_report(artifact)
    return save_topic_report(artifact)


def prepare_investment_review_pack(
    date: str | None = None,
    *,
    include_portfolio: bool = True,
    include_watchlist: bool = True,
    include_obsidian: bool = True,
) -> tuple[dict, Path]:
    review = build_review(
        date=date,
        include_portfolio=include_portfolio,
        include_watchlist=include_watchlist,
        include_obsidian=include_obsidian,
        use_llm=False,
        force_refresh=True,
    )
    date = review.get("date") or date or kst_date()
    context = json.dumps({
        "layer": "Personal Overlay",
        "instruction": "Synthesize the structured review without turning hypotheses into evidence or giving trade instructions.",
        "review": review,
    }, ensure_ascii=False, indent=2)
    prompt = """Write a concise Korean investment review Markdown from the supplied structured review. Separate source-grounded market state from user thesis and notes. Include challenging evidence, uncertainties, portfolio/watchlist implications, and concrete checkpoints. Do not add buy/sell instructions or unsupported facts."""
    pack = A.build_pack(
        task_type="investment_review",
        artifact_type="investment_review",
        artifact_id=date,
        title=f"Investment Review — {date}",
        prompt=prompt,
        context=context,
        output_contract={"format": "markdown", "layer": "personal_overlay"},
        write_back_contract={"method": "write_markdown", "target": str(REVIEW_DIR / f"{date}.json")},
        save_target=str(REVIEW_DIR / f"{date}.json"),
        draft_artifact=review,
        checkpoints=review.get("keyCheckpoints") or [],
        market_tape=review.get("marketTape") or {},
    )
    return pack, A.write_pack(pack)


def write_investment_review_from_markdown(pack: dict, markdown: str) -> dict:
    review = dict(pack.get("draftArtifact") or {})
    date = review.get("date") or pack.get("artifactId") or kst_date()
    review["markdown"] = str(markdown or "").strip()
    review["mode"] = "agent"
    review["generation"] = A.agent_generation(0)
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    write_json(REVIEW_DIR / f"{date}.json", review)
    return review


def prepare_pack(task_type: str, **kwargs) -> tuple[dict, Path]:
    task_type = A.normalize_task_type(task_type)
    if task_type == "briefing":
        return prepare_briefing_pack(
            kwargs.get("date"),
            strict_date=kwargs.get("strict_date", False),
            quality_mode=kwargs.get("quality_mode", "diagnose_only"),
            market_scope=kwargs.get("market_scope", "both"),
            briefing_type=kwargs.get("briefing_type", "default"),
        )
    if task_type == "company_analysis":
        return prepare_company_analysis_pack(
            kwargs.get("query") or "",
            quality_mode=kwargs.get("quality_mode", "diagnose_only"),
            web_search=bool(kwargs.get("web_search")),
            analysis_style=kwargs.get("analysis_style", "beginner"),
        )
    if task_type == "topic_report":
        return prepare_topic_report_pack(
            kwargs.get("topic_key") or "custom",
            custom_label=kwargs.get("custom_label") or "",
            user_context=kwargs.get("user_context") or "",
            date=kwargs.get("date"),
            use_planner=kwargs.get("use_planner", True),
            quality_mode=kwargs.get("quality_mode", "diagnose_only"),
        )
    if task_type == "personal_overlay":
        return prepare_personal_overlay_pack(kwargs.get("report_kind") or "", kwargs.get("report_id") or "")
    if task_type == "thesis_delta":
        return prepare_thesis_delta_pack(kwargs.get("ticker") or "", period=kwargs.get("period") or "90d", evidence_limit=kwargs.get("limit") or 12)
    if task_type == "market_memory_llm":
        return prepare_market_memory_pack(kwargs.get("date"))
    if task_type == "market_state_snapshot":
        return prepare_market_state_snapshot_pack(kwargs.get("date"))
    if task_type == "quality_repair":
        return prepare_quality_repair_pack(kwargs.get("artifact_type") or "", kwargs.get("artifact_id") or "")
    if task_type == "investment_review":
        return prepare_investment_review_pack(
            kwargs.get("date"),
            include_portfolio=kwargs.get("include_portfolio", True),
            include_watchlist=kwargs.get("include_watchlist", True),
            include_obsidian=kwargs.get("include_obsidian", True),
        )
    raise NotImplementedError(f"Prepare is not implemented for task type: {task_type}")


def writeback_pack(pack: dict, *, markdown: str | None = None, payload: dict | None = None) -> dict:
    task_type = A.normalize_task_type(pack.get("taskType"))
    if task_type == "briefing":
        return write_briefing_from_markdown(pack, markdown or "")
    if task_type == "company_analysis":
        return write_company_analysis_from_markdown(pack, markdown or "")
    if task_type == "topic_report":
        return write_topic_report_from_markdown(pack, markdown or "")
    if task_type == "personal_overlay":
        return write_personal_overlay_from_json(pack, payload or {})
    if task_type == "thesis_delta":
        return write_thesis_delta_from_json(pack, payload or {})
    if task_type == "market_memory_llm":
        return write_market_memory_from_json(pack, payload or {})
    if task_type == "market_state_snapshot":
        return write_market_state_snapshot_from_json(pack, payload or {})
    if task_type == "quality_repair":
        return write_quality_repair_from_markdown(pack, markdown or "")
    if task_type == "investment_review":
        return write_investment_review_from_markdown(pack, markdown or "")
    raise NotImplementedError(f"Writeback is not implemented for task type: {task_type}")
