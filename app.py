#!/usr/bin/env python3
"""Personal Market Research Archive — FastAPI server.

Handles routing and thin orchestration only; feature logic lives in features/.
"""
import datetime as dt
import os
import sys
import threading
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Body, FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from features.common.utils import kst_date, now_iso, read_json, write_json
from features.common.jobs import (
    get_job,
    load_jobs,
    recent_jobs,
    submit_job,
)
from features.agent_mode.bridge import (
    agent_preflight,
    bridge_status,
    cancel_agent_task,
    submit_agent_task,
    submit_market_memory_update,
)
from features.agent_mode.chat import apply_proposal, reject_proposal, submit_agent_chat
from features.agent_mode.companion import agent_companion_reply
from features.agent_mode.generation_mode import (
    llm_override_for_mode,
)
from features.agent_mode.setup import (
    launch_login as launch_agent_cli_login,
    save_settings as save_agent_cli_settings,
    settings_payload as agent_cli_settings_payload,
    submit_install as submit_agent_cli_install,
)
from features.automation.service import (
    list_runs as list_automation_runs,
    read_settings as read_automation_settings,
    run_briefing_prerequisites,
    run_automation_once,
    schedule_automation_loop,
    save_settings as save_automation_settings,
)
from features.common.company_lookup import ensure_company_files
from features.common.dataframe_ops import top_records
from features.common.research_library.indexing.service import (
    IMPACT_TERMS,
    build_index,
    list_indexed_documents,
    load_index,
)
from features.common.research_library.rss.service import (
    import_rssarchive,
    rss_feed_payload,
    rss_merge_payload,
)
from features.common.research_library.search.service import (
    group_docs,
    index_from_documents,
    list_companies,
    search_documents,
)
from features.llm_settings.settings_service import public_settings, save_settings
from features.llm_settings.provider_status import check_provider as check_llm_api_provider
from features.company_analysis.cache_cleanup import cache_stats, cleanup_cache
from features.market_memory.service import run_llm_market_memory, run_llm_market_state_snapshot, schedule_startup_regime_refresh
from features.market_memory.digest import run_rss_market_memory_update
from features.market_memory.state_dashboard import market_state_dashboard_payload
from features.market_memory.snapshot import current_market_state_snapshot
from features.market_widgets.service import (
    get_market_widget_settings,
    save_market_widget_settings,
)
from features.investment_notes.service import (
    add_note as add_investment_note,
    get_note as get_investment_note,
    linked_notes_payload as native_linked_notes_payload,
    list_notes as list_investment_notes,
    save_note as save_investment_note,
)
from features.watchlist_notes.service import (
    get_watchlist,
    normalize_watchlist_keyword,
    save_watchlist,
    watchlist_detail,
    watchlist_overview,
)
from features.common.market_data.snapshot import fetch_market_snapshot
from features.common.market_data.providers import fetch_korea_market_data
from features.common.market_data.tape import build_market_tape
from features.common.research_schema.checkpoints import checkpoints_from_markdown
from features.common.research_schema.data_gaps import data_gaps_from_messages
from features.common.research_schema.service import (
    checkpoints_payload,
    data_gaps_payload,
    evidence_payload,
    market_tape_payload,
    source_ledger_payload,
)
from features.common.data_reliability.service import (
    market_data_files_payload,
    provider_status_payload,
    record_provider_status_payload,
)
from features.market_memory.memory import (
    audit_memory,
    build_memory_from_briefing,
    delete_memory,
    list_briefing_memories,
    list_family_suggestions,
    list_memory,
    list_states,
    list_story_links,
    list_taxonomy,
    memory_report,
    review_family_suggestion,
    story_map,
    update_state,
    upsert_memory,
)
from features.market_memory.regime_v2 import (
    list_regime_changes,
    list_regime_evidence,
    list_regime_thesis_links,
    refresh_all_regimes,
    refresh_regime_state,
    upsert_regime_thesis_link,
)
from features.llm_settings.client import bool_override, default_generation_mode, selected_llm_config
from features.daily_briefing.service import (
    NEWS_INBOX_PREFIXES,
    append_briefing_sources,
    briefing_sources_from_headlines,
    build_prompt_markdown,
    delete_briefing,
    extract_prev_checklist,
    generate_llm_briefing,
    group_digest,
    is_news_document,
    list_briefings,
    llm_status_message,
    load_prev_briefing,
    news_documents,
    prioritized_source_refs,
    read_briefing_prompt,
    resolve_briefing,
    select_briefing_docs,
    source_refs,
)
from features.daily_briefing.selection import derive_market_drivers, infer_market_session_date, prioritize_briefing_groups, session_doc_counts
from features.daily_briefing.builder import (
    build_briefing as build_daily_briefing,
    cached_korea_market_data as feature_cached_korea_market_data,
    cached_market_snapshot as feature_cached_market_snapshot,
)
from features.daily_briefing.archive import query_briefing_archive
from features.daily_briefing.schema import briefing_scope_view
from features.daily_briefing.visuals import load_current_visuals, load_visual_sidecar
from features.company_analysis.report_rules import build_rule_report
from features.company_analysis.data_gap_resolver import resolve_company_analysis_gaps
from features.company_analysis.style import analysis_prompt_path, normalize_analysis_style
from features.company_analysis.service import (
    analysis_status_message,
    build_company_analysis_charts,
    build_company_analysis_materials,
    company_analysis_sources,
    delete_analysis_report,
    generate_llm_company_analysis,
    get_analysis_report,
    list_analysis_reports,
    read_company_analysis_prompt,
    save_analysis_report,
)
from features.common.company_lookup import infer_requested_company
from features.notion_export.service import export_briefing, export_analysis, export_topic_report
from features.obsidian.export.service import (
    get_vault_settings,
    save_vault_settings,
    export_briefing_to_obsidian,
    export_analysis_to_obsidian,
    export_topic_report_to_obsidian,
    export_narratives_to_obsidian,
)
from features.obsidian.workflow.service import (
    create_workflow_note,
    linked_notes_payload,
    read_workflow_note,
    validate_workflow_notes,
)
from features.personal_overlay.service import (
    attach_overlay_to_briefing,
    attach_overlay_to_report,
    strip_overlay,
)
from features.thesis_tracking.service import (
    list_thesis_payload,
    run_thesis_delta,
    thesis_detail_payload,
)
from features.topic_report.service import (
    attach_overlay_to_topic_report,
    delete_topic_report,
    evaluate_topic_report,
    generate_topic_report,
    get_topic_report,
    list_topic_reports,
    preset_topics_list,
    save_topic_report,
)
from features.common.research_quality.service import (
    evaluate_payload as evaluate_research_quality_payload,
    get_quality as get_research_quality,
    recheck_quality as recheck_research_quality,
)
from features.common.quality_generation.loop import apply_quality_loop
from features.common.quality_generation.preflight import preflight_from_context
from features.common.quality_generation.service import (
    preflight_payload as quality_generation_preflight_payload,
    repair_payload as quality_generation_repair_payload,
    run_payload as quality_generation_run_payload,
)
from features.common.quality_generation.schema import normalize_quality_mode
from features.investment_review.service import (
    get_review as get_investment_review,
    generate_review as generate_investment_review,
)
from features.portfolio.service import (
    delete_portfolio_backtest,
    delete_portfolio_preset,
    get_portfolio,
    get_portfolio_backtest,
    get_portfolio_preset,
    list_portfolio_backtests,
    list_portfolio_presets,
    portfolio_analytics,
    portfolio_summary,
    preset_from_current_portfolio,
    resolve_portfolio_ticker,
    run_portfolio_backtest,
    run_portfolio_backtest_comparison,
    save_portfolio,
    save_portfolio_backtest_result,
    save_portfolio_preset,
    search_portfolio_tickers,
)

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
CONFIG_DIR = ROOT / "config"
INBOX_DIR = ROOT / "research-inbox"
RSS_INBOX_DIR = INBOX_DIR / "rss"
PUBLIC_DIR = ROOT / "public"
BRIEFINGS_DIR = DATA_DIR / "briefings"
NOTES_DIR = DATA_DIR / "notes"
ANALYSIS_REPORTS_DIR = DATA_DIR / "company-analysis"
TOPIC_REPORTS_DIR = DATA_DIR / "topic-reports"
SEC_CACHE_DIR = DATA_DIR / "sec-cache"
MARKET_MEMORY_DB_PATH = DATA_DIR / "market-memory.sqlite3"
FEATURES_DIR = ROOT / "features"
BRIEFING_PROMPT_PATH = FEATURES_DIR / "daily_briefing" / "prompt.md"
COMPANY_ANALYSIS_PROMPT_PATH = FEATURES_DIR / "company_analysis" / "prompt.md"


def ensure_dirs():
    for p in [
        DATA_DIR, CONFIG_DIR, INBOX_DIR, RSS_INBOX_DIR, BRIEFINGS_DIR,
        SEC_CACHE_DIR, NOTES_DIR, ANALYSIS_REPORTS_DIR, TOPIC_REPORTS_DIR,
        FEATURES_DIR / "daily_briefing", FEATURES_DIR / "company_analysis",
        INBOX_DIR / "filings", INBOX_DIR / "reports",
        INBOX_DIR / "articles", INBOX_DIR / "links",
    ]:
        p.mkdir(parents=True, exist_ok=True)
    ensure_company_files()


def cached_market_snapshot(ttl_minutes=20):
    return feature_cached_market_snapshot(ttl_minutes=ttl_minutes)


def cached_korea_market_data(date, ttl_minutes=60):
    return feature_cached_korea_market_data(date, ttl_minutes=ttl_minutes)


def build_briefing(
    date=None,
    strict_date=False,
    web_search_override=None,
    llm_override=None,
    persist=True,
    quality_mode="diagnose_only",
    market_scope="both",
    briefing_type="default",
):
    return build_daily_briefing(
        date=date,
        strict_date=strict_date,
        web_search_override=web_search_override,
        llm_override=llm_override,
        persist=persist,
        quality_mode=quality_mode,
        market_scope=market_scope,
        briefing_type=briefing_type,
    )


def analyze_company(q, web_search_override=None, llm_override=None, analysis_style="beginner"):
    analysis_style = normalize_analysis_style(analysis_style)
    index = load_index()
    docs = search_documents(index, query=q, company=q, limit=30)
    company = infer_requested_company(q, docs)
    materials = build_company_analysis_materials(q, docs, company)
    selected_for_metadata = materials.get("selectedDocs", [])
    tags = []
    for d in selected_for_metadata:
        tags += d.get("impactTags", [])
    top_tags = sorted(set(tags), key=tags.count, reverse=True)[:6]
    recent = " ".join([d.get("summary", "") for d in selected_for_metadata[:5]]) or "선별된 보조 뉴스/리포트 자료가 없습니다."
    analysis_charts = build_company_analysis_charts(materials)
    data_gaps = resolve_company_analysis_gaps(materials, web_search_allowed=bool(web_search_override))
    quality_preflight = preflight_from_context("company_analysis", {}, {
        "sourceCount": len(selected_for_metadata) or len(docs),
        "documentCount": len(docs),
        "analysisInputs": {
            "secFactsOk": bool(materials.get("secFacts", {}).get("ok")),
            "rankedFilingOk": bool(materials.get("rankedFiling", {}).get("ok")),
        },
    })
    llm_result, llm_status = generate_llm_company_analysis(q, docs, web_search_override=web_search_override, llm_override=llm_override, materials=materials, quality_preflight=quality_preflight, analysis_style=analysis_style)
    if llm_result:
        generation = {"mode": "llm", "status": llm_status, "provider": llm_result.get("provider", ""), "model": llm_result.get("model", ""), "responseId": llm_result.get("responseId", ""), "sourceCount": len(llm_result.get("usedDocs", [])), "webSearch": bool(llm_result.get("webSearch")), "tokenUsage": llm_result.get("tokenUsage") or {}}
        generation["message"] = analysis_status_message(generation)
        return {"saved": False, "generatedAt": now_iso(), "query": q, "company": company, "documentCount": len(docs), "headline": f"{company['name']} 기업 분석", "markdown": llm_result["markdown"], "analysisStyle": analysis_style, "dataGaps": data_gaps, "resolutionAttempts": data_gaps.get("gaps", []), "prompt": read_company_analysis_prompt(analysis_style), "promptPath": llm_result.get("promptPath") or str(analysis_prompt_path(analysis_style)), "generation": generation, "sources": company_analysis_sources(materials, llm_result.get("usedDocs", [])[:14]), "analysisCharts": analysis_charts, "analysisInputs": {"secFactsOk": bool(materials.get("secFacts", {}).get("ok")), "rankedFilingOk": bool(materials.get("rankedFiling", {}).get("ok")), "rankedParagraphs": len(materials.get("rankedFiling", {}).get("paragraphs", []))}, "qualityPreflight": quality_preflight}
    generation = {"mode": "rules", "status": llm_status, "provider": selected_llm_config().get("provider", ""), "model": "", "sourceCount": 0}
    generation["message"] = analysis_status_message(generation)
    rule_markdown = build_rule_report(materials, analysis_style=analysis_style)
    return {"saved": False, "generatedAt": now_iso(), "query": q, "company": company, "documentCount": len(docs), "headline": f"{company['name']} 규칙 기반 기업 분석", "markdown": rule_markdown, "analysisStyle": analysis_style, "dataGaps": data_gaps, "resolutionAttempts": data_gaps.get("gaps", []), "generation": generation, "sources": company_analysis_sources(materials, materials.get("selectedDocs", docs[:10])[:14]), "analysisCharts": analysis_charts, "analysisInputs": {"secFactsOk": bool(materials.get("secFacts", {}).get("ok")), "rankedFilingOk": bool(materials.get("rankedFiling", {}).get("ok")), "rankedParagraphs": len(materials.get("rankedFiling", {}).get("paragraphs", [])), "topTags": top_tags, "recent": recent}, "qualityPreflight": quality_preflight}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    ensure_dirs()
    schedule_startup_regime_refresh(MARKET_MEMORY_DB_PATH)
    schedule_automation_loop()
    yield


fastapi_app = FastAPI(title="Folio OS", version="0.1.0", lifespan=lifespan)


@fastapi_app.exception_handler(Exception)
def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse({"error": str(exc)}, status_code=500)


@fastapi_app.middleware("http")
async def no_store_for_local_app(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    return response


def query_lists(request: Request):
    return {key: request.query_params.getlist(key) for key in request.query_params.keys()}


def request_generation_mode(_payload: dict | None) -> str:
    return default_generation_mode()


_RESTART_REQUESTED = False


def schedule_server_restart(delay: float = 0.5):
    """Exit with code 3 so start.ps1 / start.sh can restart the process.

    Exit code 3 is the restart signal agreed upon with the start scripts.
    A guard prevents multiple simultaneous restart requests.
    """
    global _RESTART_REQUESTED
    if _RESTART_REQUESTED:
        return
    _RESTART_REQUESTED = True

    def _exit():
        time.sleep(delay)
        os._exit(3)

    threading.Thread(target=_exit, daemon=True).start()


@fastapi_app.get("/api/rss/items")
def api_rss_items(request: Request):
    return rss_feed_payload(query_lists(request))


@fastapi_app.get("/api/rss/merge")
def api_rss_merge(request: Request):
    filename, merged = rss_merge_payload(query_lists(request))
    return Response(
        content=merged,
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@fastapi_app.post("/api/server/restart")
def api_restart_server():
    schedule_server_restart()
    return {"ok": True, "message": "서버 재시작을 시작했습니다. 잠시 후 페이지를 다시 불러오세요."}


@fastapi_app.get("/api/dashboard")
def api_dashboard():
    idx = load_index()
    news_docs = news_documents(idx)
    news_idx = index_from_documents(idx, news_docs)
    return {
        "index": {
            "generatedAt": idx["generatedAt"],
            "count": idx["count"],
            "newsCount": len(news_docs),
            "inbox": idx["inbox"],
        },
        "companies": list_companies(news_idx)[:20],
        "briefings": list_briefings()[:20],
        "watchlist": get_watchlist(),
        "notes": list_investment_notes(limit=10, include_body=True),
        "recent": news_docs[:12],
    }


@fastapi_app.get("/api/market-widgets/settings")
def api_get_market_widget_settings():
    return get_market_widget_settings()


@fastapi_app.post("/api/market-widgets/settings")
def api_save_market_widget_settings(body: dict | None = Body(default=None)):
    return save_market_widget_settings(body or {})


@fastapi_app.get("/api/search")
def api_search(request: Request):
    qs = query_lists(request)
    idx = load_index()
    return search_documents(
        idx,
        query=qs.get("query", [""])[0],
        company=qs.get("company", [""])[0],
        limit=int(qs.get("limit", [50])[0] or 50),
        scope=qs.get("scope", ["news"])[0],
    )


@fastapi_app.get("/api/briefings")
def api_list_briefings():
    return list_briefings()


@fastapi_app.get("/api/briefings/index")
def api_briefing_archive_index(
    q: str = "",
    marketScope: str = "all",
    briefingType: str = "all",
    dateFrom: str = "",
    dateTo: str = "",
    offset: int = 0,
    limit: int = 20,
):
    try:
        return query_briefing_archive(
            q=q,
            market_scope=marketScope,
            briefing_type=briefingType,
            date_from=dateFrom,
            date_to=dateTo,
            offset=offset,
            limit=limit,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@fastapi_app.post("/api/briefings")
def api_create_briefing(body: dict | None = Body(default=None)):
    body = body or {}
    automation_settings = read_automation_settings()
    prerequisites = {}
    if automation_settings.get("briefing", {}).get("runPrerequisites"):
        prerequisites = run_briefing_prerequisites()
    generation_mode = request_generation_mode(body)
    if generation_mode == "llm_cli":
        job = submit_agent_task("briefing", {
            "date": body.get("date") or kst_date(),
            "strict_date": body.get("strictDate", False),
            "quality_mode": body.get("qualityMode", "diagnose_only"),
            "market_scope": body.get("marketScope", "both"),
            "briefing_type": body.get("briefingType", "default"),
        }, adapter=body.get("agentAdapter", ""))
        if prerequisites and isinstance(job, dict):
            job["prerequisites"] = prerequisites
        return job
    result = build_briefing(
        body.get("date") or kst_date(),
        strict_date=body.get("strictDate", False),
        web_search_override=bool_override(body.get("webSearch")),
        llm_override=llm_override_for_mode(generation_mode),
        quality_mode=body.get("qualityMode", "diagnose_only"),
        market_scope=body.get("marketScope", "both"),
        briefing_type=body.get("briefingType", "default"),
    )
    if prerequisites and isinstance(result, dict):
        result["prerequisites"] = prerequisites
    return result


@fastapi_app.get("/api/briefings/{date}")
def api_get_briefing(date: str, includePersonal: bool = False, marketScope: str = "both"):
    try:
        briefing = resolve_briefing(date, marketScope)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    if not briefing.get("quality"):
        try:
            briefing["quality"] = evaluate_research_quality_payload({"artifactType": "briefing", "artifact": briefing})["quality"]
        except Exception as exc:
            briefing["quality"] = {"status": "warn", "warnings": [f"quality evaluation failed: {str(exc)[:120]}"]}
    return strip_overlay(briefing_scope_view(briefing, marketScope), includePersonal)


@fastapi_app.delete("/api/briefings/{date}")
def api_delete_briefing(date: str, market: str = ""):
    try:
        result = delete_briefing(date, market=market or None)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not result["deleted"]:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return result


@fastapi_app.get("/api/briefings/{date}/visuals")
def api_get_briefing_visuals(date: str, market: str = "", marketScope: str = ""):
    payload = load_visual_sidecar(date, BRIEFINGS_DIR, market_scope=market or marketScope)
    if payload is None:
        raise HTTPException(status_code=404, detail="Briefing visuals not found")
    return payload


@fastapi_app.get("/api/briefings/{date}/visuals/current")
def api_get_briefing_current_visuals(date: str, market: str = "", snapshotId: str = ""):
    payload = load_current_visuals(
        date,
        BRIEFINGS_DIR,
        market=market,
        snapshot_id=snapshotId,
    )
    if payload is None:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return payload


@fastapi_app.post("/api/briefings/{date}/personal-overlay")
def api_briefing_personal_overlay(date: str, marketScope: str = "both", body: dict | None = Body(default=None)):
    body = body or {}
    requested_scope = body.get("marketScope") or marketScope
    generation_mode = request_generation_mode(body)
    if generation_mode == "llm_cli":
        return submit_agent_task("personal_overlay", {
            "report_kind": "briefing",
            "report_id": date,
            "market_scope": requested_scope,
        }, adapter=body.get("agentAdapter", ""))
    try:
        return attach_overlay_to_briefing(
            date,
            market_scope=requested_scope,
            llm_override=llm_override_for_mode(generation_mode),
            web_search_override=bool_override(body.get("webSearch")),
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Briefing not found")


@fastapi_app.get("/api/analyze")
def api_analyze(request: Request):
    qs = query_lists(request)
    quality_mode = normalize_quality_mode(qs.get("qualityMode", ["diagnose_only"])[0])
    generation_mode = request_generation_mode(None)
    query = qs.get("q", [""])[0]
    analysis_style = normalize_analysis_style(qs.get("analysisStyle", qs.get("analysis_style", ["beginner"]))[0])
    if generation_mode == "llm_cli":
        return submit_agent_task("company_analysis", {
            "query": query,
            "quality_mode": quality_mode,
            "analysis_style": analysis_style,
            "web_search": bool_override(qs.get("webSearch", [None])[0]) is True,
        }, adapter=qs.get("agentAdapter", [""])[0])
    report = analyze_company(
        query,
        web_search_override=bool_override(qs.get("webSearch", [None])[0]),
        llm_override=llm_override_for_mode(generation_mode),
        analysis_style=analysis_style,
    )
    try:
        preflight = report.pop("qualityPreflight", None)
        report = apply_quality_loop("company_analysis", report, mode=quality_mode, preflight=preflight)
    except Exception as exc:
        report["quality"] = {"status": "warn", "warnings": [f"quality evaluation failed: {str(exc)[:120]}"]}
    # 생성한 보고서를 자동 저장한다(같은 기업·같은 날은 최신본으로 덮어씀).
    try:
        return save_analysis_report(report)
    except Exception:
        return report


@fastapi_app.get("/api/analysis-reports")
def api_list_analysis_reports():
    return list_analysis_reports()


@fastapi_app.post("/api/analysis-reports")
def api_save_analysis_report(body: dict | None = Body(default=None)):
    report = body or {}
    if not report.get("quality"):
        try:
            report["quality"] = evaluate_research_quality_payload({"artifactType": "company_analysis", "artifact": report})["quality"]
        except Exception:
            pass
    return save_analysis_report(report)


@fastapi_app.get("/api/analysis-reports/{report_id}")
def api_get_analysis_report(report_id: str, includePersonal: bool = False):
    report = get_analysis_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Analysis report not found")
    if not report.get("quality") or "sourceGrounding" not in report.get("quality", {}):
        try:
            result = recheck_research_quality("company_analysis", report_id)
            report["quality"] = result.get("quality")
        except Exception as exc:
            report["quality"] = {"status": "warn", "warnings": [f"quality evaluation failed: {str(exc)[:120]}"]}
    return strip_overlay(report, includePersonal)


@fastapi_app.post("/api/analysis-reports/{report_id}/personal-overlay")
def api_analysis_personal_overlay(report_id: str, body: dict | None = Body(default=None)):
    body = body or {}
    generation_mode = request_generation_mode(body)
    if generation_mode == "llm_cli":
        return submit_agent_task("personal_overlay", {
            "report_kind": "company_analysis",
            "report_id": report_id,
        }, adapter=body.get("agentAdapter", ""))
    try:
        return attach_overlay_to_report(
            report_id,
            llm_override=llm_override_for_mode(generation_mode),
            web_search_override=bool_override(body.get("webSearch")),
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Analysis report not found")


@fastapi_app.get("/api/theses")
def api_list_theses(status: str = ""):
    return list_thesis_payload(status=status or None)


@fastapi_app.get("/api/theses/{ticker}")
def api_get_thesis(ticker: str):
    return thesis_detail_payload(ticker)


@fastapi_app.post("/api/theses/{ticker}/delta")
def api_run_thesis_delta(ticker: str, body: dict | None = Body(default=None)):
    body = body or {}
    generation_mode = request_generation_mode(body)
    if generation_mode == "llm_cli":
        return submit_agent_task("thesis_delta", {
            "ticker": ticker,
            "period": body.get("period", "90d"),
            "limit": body.get("evidenceLimit", body.get("limit", 12)),
        }, adapter=body.get("agentAdapter", ""))
    body["useLlm"] = llm_override_for_mode(generation_mode)
    try:
        return run_thesis_delta(ticker, body)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@fastapi_app.delete("/api/analysis-reports/{report_id}")
def api_delete_analysis_report(report_id: str):
    result = delete_analysis_report(report_id)
    if not result.get("deleted"):
        raise HTTPException(status_code=404, detail="Analysis report not found")
    return result


@fastapi_app.post("/api/briefings/{date}/export-notion")
def api_export_briefing_notion(date: str, marketScope: str = "both", body: dict | None = Body(default=None)):
    body = body or {}
    requested_scope = body.get("marketScope") or marketScope
    try:
        briefing = resolve_briefing(date, requested_scope)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    chart_images = body.get("chartImages") or None
    try:
        return export_briefing(date, briefing_scope_view(briefing, requested_scope), chart_images=chart_images)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Notion 내보내기 실패: {e}")


@fastapi_app.post("/api/export-notion/analysis")
def api_export_analysis_notion(body: dict | None = Body(default=None)):
    body = body or {}
    report = {k: v for k, v in body.items() if k != "chartImages"}
    if not report.get("markdown") and not report.get("headline"):
        raise HTTPException(status_code=400, detail="분석 보고서 내용이 없습니다.")
    try:
        return export_analysis(report, chart_images=body.get("chartImages") or None)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Notion 내보내기 실패: {e}")


@fastapi_app.post("/api/export-notion/topic-report")
def api_export_topic_report_notion(body: dict | None = Body(default=None)):
    body = body or {}
    report = {k: v for k, v in body.items() if k != "chartImages"}
    if not report.get("markdown") and not report.get("topicLabel"):
        raise HTTPException(status_code=400, detail="테마분석 보고서 내용이 없습니다.")
    try:
        return export_topic_report(report, chart_images=body.get("chartImages") or None)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Notion 내보내기 실패: {e}")


@fastapi_app.get("/api/obsidian/settings")
def api_get_obsidian_settings():
    return get_vault_settings()


@fastapi_app.post("/api/obsidian/settings")
def api_save_obsidian_settings(body: dict | None = Body(default=None)):
    vault_path = (body or {}).get("vaultPath", "")
    return save_vault_settings(vault_path)


@fastapi_app.post("/api/obsidian-workflow/create-note")
def api_obsidian_workflow_create_note(body: dict | None = Body(default=None)):
    body = body or {}
    try:
        return create_workflow_note(
            str(body.get("templateType") or ""),
            body.get("context") if isinstance(body.get("context"), dict) else {},
            overwrite=bool(body.get("overwrite")),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Obsidian 노트 생성 실패: {e}")


@fastapi_app.get("/api/obsidian-workflow/note")
def api_obsidian_workflow_read_note(templateType: str = "", ticker: str = "", topic: str = "", label: str = ""):
    try:
        return read_workflow_note(templateType, {"ticker": ticker, "topic": topic, "label": label})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Obsidian 노트 조회 실패: {e}")


@fastapi_app.get("/api/obsidian-workflow/linked-notes")
def api_obsidian_workflow_linked_notes(ticker: str = "", topic: str = ""):
    try:
        return linked_notes_payload(ticker=ticker, topic=topic)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Obsidian 연결 노트 조회 실패: {e}")


@fastapi_app.get("/api/obsidian-workflow/validate")
def api_obsidian_workflow_validate():
    try:
        return validate_workflow_notes()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Obsidian frontmatter 검사 실패: {e}")


@fastapi_app.post("/api/briefings/{date}/export-obsidian")
def api_export_briefing_obsidian(date: str, marketScope: str = "both", body: dict | None = Body(default=None)):
    body = body or {}
    requested_scope = body.get("marketScope") or marketScope
    try:
        briefing = resolve_briefing(date, requested_scope)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    try:
        return export_briefing_to_obsidian(
            date,
            briefing_scope_view(briefing, requested_scope),
            chart_images=body.get("chartImages") or None,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Obsidian 내보내기 실패: {e}")


@fastapi_app.post("/api/export-obsidian/analysis")
def api_export_analysis_obsidian(body: dict | None = Body(default=None)):
    report = body or {}
    if not report.get("markdown") and not report.get("headline"):
        raise HTTPException(status_code=400, detail="분석 보고서 내용이 없습니다.")
    try:
        return export_analysis_to_obsidian(report)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Obsidian 내보내기 실패: {e}")


@fastapi_app.post("/api/export-obsidian/topic-report")
def api_export_topic_report_obsidian(body: dict | None = Body(default=None)):
    report = body or {}
    if not report.get("markdown"):
        raise HTTPException(status_code=400, detail="테마 보고서 내용이 없습니다.")
    try:
        return export_topic_report_to_obsidian(report)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Obsidian 내보내기 실패: {e}")


@fastapi_app.post("/api/export-obsidian/narratives")
def api_export_narratives_obsidian():
    try:
        return export_narratives_to_obsidian()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Obsidian 내보내기 실패: {e}")


@fastapi_app.get("/api/watchlist")
def api_get_watchlist():
    return get_watchlist()


@fastapi_app.post("/api/watchlist")
def api_save_watchlist(body: dict | None = Body(default=None)):
    body = body or {}
    return save_watchlist(body.get("items", []))


@fastapi_app.get("/api/watchlist/resolve")
def api_resolve_watchlist_keyword(request: Request):
    qs = query_lists(request)
    keyword = normalize_watchlist_keyword(qs.get("keyword", [""])[0])
    return {"keyword": keyword or ""}


@fastapi_app.get("/api/watchlist/overview")
def api_watchlist_overview():
    return watchlist_overview()


@fastapi_app.get("/api/watchlist/detail")
def api_watchlist_detail(request: Request):
    qs = query_lists(request)
    item = qs.get("item", [""])[0]
    limit = int(qs.get("limit", ["12"])[0] or 12)
    return watchlist_detail(item, limit=min(max(limit, 1), 50))


@fastapi_app.get("/api/portfolio")
def api_get_portfolio():
    return get_portfolio()


@fastapi_app.post("/api/portfolio")
def api_save_portfolio(body: dict | None = Body(default=None)):
    return save_portfolio(body or {})


@fastapi_app.get("/api/portfolio/summary")
def api_portfolio_summary():
    return portfolio_summary()


@fastapi_app.get("/api/portfolio/resolve")
def api_resolve_portfolio_ticker(request: Request):
    qs = query_lists(request)
    return resolve_portfolio_ticker(qs.get("ticker", [""])[0], qs.get("market", [""])[0])


@fastapi_app.get("/api/portfolio/suggest")
def api_suggest_portfolio_tickers(request: Request):
    qs = query_lists(request)
    limit = int(qs.get("limit", ["8"])[0] or 8)
    return search_portfolio_tickers(qs.get("q", [""])[0], limit)


@fastapi_app.get("/api/portfolio/analytics")
def api_portfolio_analytics():
    return portfolio_analytics()


@fastapi_app.get("/api/portfolio/presets")
def api_list_portfolio_presets():
    return list_portfolio_presets()


@fastapi_app.post("/api/portfolio/presets")
def api_save_portfolio_preset(body: dict | None = Body(default=None)):
    return save_portfolio_preset(body or {})


@fastapi_app.post("/api/portfolio/presets/from-current")
def api_save_portfolio_preset_from_current(body: dict | None = Body(default=None)):
    body = body or {}
    return preset_from_current_portfolio(body.get("name") or "현재 포트폴리오 목표 비중")


@fastapi_app.delete("/api/portfolio/presets/{preset_id}")
def api_delete_portfolio_preset(preset_id: str):
    result = delete_portfolio_preset(preset_id)
    if not result.get("deleted"):
        raise HTTPException(status_code=404, detail="Portfolio preset not found")
    return result


@fastapi_app.get("/api/portfolio/backtests")
def api_list_portfolio_backtests():
    return list_portfolio_backtests()


@fastapi_app.post("/api/portfolio/backtests")
def api_run_portfolio_backtest(body: dict | None = Body(default=None)):
    return run_portfolio_backtest(body or {}, save_result=False)


@fastapi_app.post("/api/portfolio/backtests/compare")
def api_run_portfolio_backtest_comparison(body: dict | None = Body(default=None)):
    return run_portfolio_backtest_comparison(body or {})


@fastapi_app.post("/api/portfolio/backtests/save")
def api_save_portfolio_backtest(body: dict | None = Body(default=None)):
    return save_portfolio_backtest_result(body or {})


@fastapi_app.get("/api/portfolio/backtests/{backtest_id}")
def api_get_portfolio_backtest(backtest_id: str):
    result = get_portfolio_backtest(backtest_id)
    if not result:
        raise HTTPException(status_code=404, detail="Portfolio backtest not found")
    return result


@fastapi_app.delete("/api/portfolio/backtests/{backtest_id}")
def api_delete_portfolio_backtest(backtest_id: str):
    result = delete_portfolio_backtest(backtest_id)
    if not result.get("deleted"):
        raise HTTPException(status_code=404, detail="Portfolio backtest not found")
    return result


@fastapi_app.get("/api/notes")
def api_get_notes():
    return list_investment_notes(limit=100, include_body=True)


@fastapi_app.post("/api/notes")
def api_add_note(body: dict | None = Body(default=None)):
    return add_investment_note(body or {})


@fastapi_app.get("/api/investment-notes")
def api_list_investment_notes(
    ticker: str = "",
    topic: str = "",
    noteType: str = "",
    q: str = "",
    limit: int = 50,
    includeBody: bool = False,
):
    return list_investment_notes(
        ticker=ticker,
        topic=topic,
        note_type=noteType,
        q=q,
        limit=limit,
        include_body=includeBody,
    )


@fastapi_app.get("/api/investment-notes/linked")
def api_linked_investment_notes(ticker: str = "", topic: str = "", reportId: str = ""):
    return native_linked_notes_payload(ticker=ticker, topic=topic, report_id=reportId)


@fastapi_app.get("/api/investment-notes/{note_id}")
def api_get_investment_note(note_id: str):
    note = get_investment_note(note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Investment note not found")
    return note


@fastapi_app.post("/api/investment-notes")
def api_save_investment_note(body: dict | None = Body(default=None)):
    return save_investment_note(body or {})


@fastapi_app.get("/api/settings")
def api_get_settings(refresh: bool = False):
    return public_settings(refresh=refresh)


@fastapi_app.post("/api/settings")
def api_save_settings(body: dict | None = Body(default=None)):
    return save_settings(body or {})


@fastapi_app.get("/api/automation/settings")
def api_automation_settings():
    return read_automation_settings()


@fastapi_app.post("/api/automation/settings")
def api_save_automation_settings(body: dict | None = Body(default=None)):
    return save_automation_settings(body or {})


@fastapi_app.get("/api/automation/runs")
def api_automation_runs(limit: int = 20):
    return {"items": list_automation_runs(limit)}


@fastapi_app.post("/api/automation/run/{kind}")
def api_run_automation(kind: str):
    return run_automation_once(kind)


@fastapi_app.post("/api/settings/llm/test/{provider}")
def api_test_llm_provider(provider: str):
    try:
        return check_llm_api_provider(provider)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@fastapi_app.get("/api/cache/stats")
def api_cache_stats():
    return cache_stats()


@fastapi_app.post("/api/cache/cleanup")
def api_cache_cleanup():
    return cleanup_cache()


@fastapi_app.get("/api/market/snapshot")
def api_market_snapshot():
    return fetch_market_snapshot()


@fastapi_app.get("/api/research-data/checkpoints")
def api_research_data_checkpoints(artifactType: str = "", artifactId: str = ""):
    return checkpoints_payload(artifactType, artifactId)


@fastapi_app.get("/api/research-data/evidence")
def api_research_data_evidence(artifactType: str = "", artifactId: str = ""):
    return evidence_payload(artifactType, artifactId)


@fastapi_app.get("/api/research-data/source-ledger")
def api_research_data_source_ledger(artifactType: str = "", artifactId: str = ""):
    return source_ledger_payload(artifactType, artifactId)


@fastapi_app.get("/api/research-data/data-gaps")
def api_research_data_data_gaps(artifactType: str = "", artifactId: str = ""):
    return data_gaps_payload(artifactType, artifactId)


@fastapi_app.get("/api/research-data/market-tape")
def api_research_data_market_tape(artifactType: str = "", artifactId: str = "", date: str = ""):
    if artifactType and artifactId:
        return market_tape_payload(artifactType, artifactId, date=date)
    target_date = date or kst_date()
    from features.common.market_calendar import briefing_market_windows
    return {
        "artifactType": artifactType,
        "artifactId": artifactId,
        "marketTape": build_market_tape(
            date=target_date,
            market_snapshot=cached_market_snapshot(),
            korea_market_data=cached_korea_market_data(target_date),
            market_windows=briefing_market_windows(target_date),
        ),
    }


@fastapi_app.get("/api/data-reliability/provider-status")
def api_data_reliability_provider_status():
    return provider_status_payload()


@fastapi_app.post("/api/data-reliability/provider-status")
def api_data_reliability_record_provider_status(body: dict | None = Body(default=None)):
    return record_provider_status_payload((body or {}).get("records") or [])


@fastapi_app.get("/api/data-reliability/market-data-files")
def api_data_reliability_market_data_files():
    return market_data_files_payload()


@fastapi_app.post("/api/research-quality/evaluate")
def api_research_quality_evaluate(body: dict | None = Body(default=None)):
    return evaluate_research_quality_payload(body or {})


@fastapi_app.get("/api/research-quality/{artifact_type}/{artifact_id}")
def api_research_quality_get(artifact_type: str, artifact_id: str):
    try:
        return get_research_quality(artifact_type, artifact_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Artifact not found")


@fastapi_app.post("/api/research-quality/recheck/{artifact_type}/{artifact_id}")
def api_research_quality_recheck(artifact_type: str, artifact_id: str):
    try:
        return recheck_research_quality(artifact_type, artifact_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Artifact not found")


@fastapi_app.post("/api/quality-generation/preflight")
def api_quality_generation_preflight(body: dict | None = Body(default=None)):
    return quality_generation_preflight_payload(body or {})


@fastapi_app.post("/api/quality-generation/repair")
def api_quality_generation_repair(body: dict | None = Body(default=None)):
    body = body or {}
    generation_mode = request_generation_mode(body)
    if generation_mode == "llm_cli":
        return submit_agent_task("quality_repair", {
            "artifact_type": body.get("artifactType") or body.get("artifact_type"),
            "artifact_id": body.get("artifactId") or body.get("artifact_id"),
        }, adapter=body.get("agentAdapter", ""))
    if generation_mode == "rules":
        return quality_generation_run_payload({**body, "qualityMode": "diagnose_only"})
    return quality_generation_repair_payload(body)


@fastapi_app.post("/api/quality-generation/run")
def api_quality_generation_run(body: dict | None = Body(default=None)):
    return quality_generation_run_payload(body or {})


@fastapi_app.get("/api/investment-review")
def api_investment_review():
    return get_investment_review()


@fastapi_app.post("/api/investment-review/generate")
def api_investment_review_generate(body: dict | None = Body(default=None)):
    body = body or {}
    generation_mode = request_generation_mode(body)
    if generation_mode == "llm_cli":
        return submit_agent_task("investment_review", {
            "date": body.get("date"),
            "include_portfolio": body.get("includePortfolio", True),
            "include_watchlist": body.get("includeWatchlist", True),
            "include_obsidian": body.get("includeObsidian", True),
        }, adapter=body.get("agentAdapter", ""))
    body["useLlm"] = llm_override_for_mode(generation_mode)
    return generate_investment_review(body)


@fastapi_app.get("/api/investment-review/{date}")
def api_investment_review_by_date(date: str):
    return get_investment_review(date)


@fastapi_app.get("/api/jobs")
def api_recent_jobs():
    return recent_jobs()


@fastapi_app.get("/api/agent-bridge/status")
def api_agent_bridge_status(refresh: bool = False):
    return bridge_status(refresh=refresh)


@fastapi_app.get("/api/agent-bridge/preflight")
def api_agent_bridge_preflight(adapter: str = ""):
    try:
        return agent_preflight(adapter=adapter)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@fastapi_app.post("/api/agent/companion")
def api_agent_companion(body: dict | None = Body(default=None)):
    body = body or {}
    return agent_companion_reply(body.get("message", ""), body.get("context") or {}, body.get("options") or {})


@fastapi_app.post("/api/agent/chat")
def api_agent_chat(body: dict | None = Body(default=None)):
    body = body or {}
    return submit_agent_chat(body.get("message", ""), body.get("context") or {}, body.get("options") or {})


@fastapi_app.post("/api/agent/proposals/{proposal_id}")
def api_agent_proposal_action(proposal_id: str, body: dict | None = Body(default=None)):
    action = str((body or {}).get("action") or "").strip()
    try:
        if action == "approve":
            return apply_proposal(proposal_id)
        if action == "reject":
            return reject_proposal(proposal_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    raise HTTPException(status_code=400, detail=f"Unsupported action: {action}")


@fastapi_app.get("/api/agent-bridge/settings")
def api_agent_bridge_settings(refresh: bool = False):
    return agent_cli_settings_payload(refresh=refresh)


@fastapi_app.post("/api/agent-bridge/settings")
def api_save_agent_bridge_settings(body: dict | None = Body(default=None)):
    try:
        return save_agent_cli_settings(body or {})
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@fastapi_app.post("/api/agent-bridge/install/{adapter}")
def api_install_agent_cli(adapter: str):
    try:
        return submit_agent_cli_install(adapter)
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@fastapi_app.post("/api/agent-bridge/login/{adapter}")
def api_login_agent_cli(adapter: str):
    try:
        return launch_agent_cli_login(adapter)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@fastapi_app.post("/api/agent-bridge/jobs/{job_id}/cancel")
def api_cancel_agent_bridge_job(job_id: str):
    result = cancel_agent_task(job_id)
    if not result.get("cancelled") and result.get("error") == "Job not found":
        raise HTTPException(status_code=404, detail="Job not found")
    return result


@fastapi_app.get("/api/jobs/{job_id}")
def api_get_job(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@fastapi_app.get("/api/index/documents")
def api_index_documents(company: str = "", limit: int = 50, offset: int = 0):
    return list_indexed_documents(company=company, limit=min(limit, 200), offset=offset)


@fastapi_app.post("/api/index")
def api_build_index(body: dict | None = Body(default=None)):
    body = body or {}
    return submit_job(
        "index",
        "자료 폴더 다시 읽기",
        build_index,
        incremental=body.get("incremental", True),
    )


@fastapi_app.post("/api/rssarchive/import")
def api_import_rssarchive():
    return submit_job(
        "rss",
        "RSS 수집/가져오기",
        import_rssarchive,
        run_collection=True,
    )


@fastapi_app.get("/api/memory")
def api_list_memory(request: Request):
    qs = query_lists(request)
    return list_memory(
        MARKET_MEMORY_DB_PATH,
        limit=int(qs.get("limit", [50])[0] or 50),
        story=qs.get("story", [""])[0],
    )


@fastapi_app.post("/api/memory")
def api_upsert_memory(body: dict | None = Body(default=None)):
    return upsert_memory(MARKET_MEMORY_DB_PATH, body or {})


@fastapi_app.delete("/api/memory/{memory_id}")
def api_delete_memory(memory_id: str):
    result = delete_memory(MARKET_MEMORY_DB_PATH, memory_id)
    if not result.get("deleted"):
        raise HTTPException(status_code=404, detail="Memory entry not found")
    return result


@fastapi_app.post("/api/memory/llm")
def api_run_llm_market_memory(body: dict | None = Body(default=None)):
    body = body or {}
    generation_mode = request_generation_mode(body)
    if generation_mode == "llm_cli":
        return submit_agent_task("market_memory_llm", {
            "date": body.get("date") or kst_date(),
        }, adapter=body.get("agentAdapter", ""))
    if generation_mode == "rules":
        return {
            "ok": True,
            "status": "rules",
            "saved": [],
            "message": "규칙 기반 내러티브 후보는 브리핑 생성 시 자동으로 누적됩니다.",
        }
    return run_llm_market_memory(body.get("date") or kst_date())


@fastapi_app.post("/api/memory/update")
def api_update_market_memory(body: dict | None = Body(default=None)):
    body = body or {}
    date = body.get("date") or kst_date()
    generation_mode = request_generation_mode(body)
    if generation_mode == "llm_cli":
        return submit_market_memory_update({
            "date": date,
        }, adapter=body.get("agentAdapter", ""))
    if generation_mode == "rules":
        return {
            "ok": False,
            "status": "rules_unavailable",
            "message": "시장 메모리 업데이트는 화면용 시장 상태 스냅샷 생성을 위해 AI Agent 또는 LLM API가 필요합니다.",
        }
    memory = run_llm_market_memory(date)
    snapshot = run_llm_market_state_snapshot(date)
    return {
        "ok": bool(memory.get("ok", True) and snapshot.get("ok", True)),
        "status": "ok",
        "message": "시장 메모리와 화면용 시장 상태 스냅샷을 모두 업데이트했습니다.",
        "memory": memory,
        "snapshot": snapshot,
        "savedCount": len(memory.get("saved") or []),
        "snapshotId": (snapshot.get("snapshot") or {}).get("id", ""),
        "title": (snapshot.get("snapshot") or {}).get("headline", ""),
        "date": date,
    }


@fastapi_app.post("/api/memory/rss-digest")
def api_memory_rss_digest(body: dict | None = Body(default=None)):
    body = body or {}
    return run_rss_market_memory_update(date=body.get("date", ""))


@fastapi_app.post("/api/memory/state-snapshot")
def api_run_market_state_snapshot(body: dict | None = Body(default=None)):
    body = body or {}
    generation_mode = request_generation_mode(body)
    if generation_mode == "llm_cli":
        return submit_agent_task("market_state_snapshot", {
            "date": body.get("date") or kst_date(),
        }, adapter=body.get("agentAdapter", ""))
    if generation_mode == "rules":
        return {
            "ok": False,
            "status": "rules_unavailable",
            "message": "시장 상태 스냅샷은 AI Agent 또는 LLM API가 활성화되어 있을 때 생성할 수 있습니다.",
        }
    return run_llm_market_state_snapshot(body.get("date") or kst_date())


@fastapi_app.get("/api/memory/state-snapshot")
def api_current_market_state_snapshot():
    snapshot = current_market_state_snapshot(MARKET_MEMORY_DB_PATH)
    return {"ok": bool(snapshot), "snapshot": snapshot}


@fastapi_app.get("/api/memory/state-dashboard")
def api_market_state_dashboard(limit: int = 5):
    return market_state_dashboard_payload(MARKET_MEMORY_DB_PATH, limit=limit)


@fastapi_app.get("/api/memory/states")
def api_list_memory_states(request: Request):
    qs = query_lists(request)
    return list_states(
        MARKET_MEMORY_DB_PATH,
        limit=int(qs.get("limit", [50])[0] or 50),
        status=qs.get("status", ["current"])[0],
    )


@fastapi_app.post("/api/memory/states/{state_id}")
def api_update_memory_state(state_id: str, body: dict | None = Body(default=None)):
    return update_state(MARKET_MEMORY_DB_PATH, state_id, body or {})


@fastapi_app.post("/api/memory/regime/refresh")
def api_refresh_memory_regimes(body: dict | None = Body(default=None)):
    body = body or {}
    state_id = body.get("stateId") or body.get("state_id") or ""
    days = int(body.get("days") or 90)
    if state_id:
        result = refresh_regime_state(MARKET_MEMORY_DB_PATH, state_id, days=days)
        if not result.get("ok"):
            raise HTTPException(status_code=404, detail=result.get("error") or "State not found")
        return result
    return refresh_all_regimes(
        MARKET_MEMORY_DB_PATH,
        status=body.get("status") or "current",
        limit=int(body.get("limit") or 30),
        days=days,
    )


@fastapi_app.get("/api/memory/states/{state_id}/evidence")
def api_memory_regime_evidence(state_id: str, limit: int = 50):
    return list_regime_evidence(MARKET_MEMORY_DB_PATH, state_id, limit=min(int(limit or 50), 200))


@fastapi_app.get("/api/memory/states/{state_id}/changes")
def api_memory_regime_changes(state_id: str, limit: int = 30):
    return list_regime_changes(MARKET_MEMORY_DB_PATH, state_id, limit=min(int(limit or 30), 100))


@fastapi_app.get("/api/memory/states/{state_id}/thesis-links")
def api_memory_regime_thesis_links(state_id: str):
    return list_regime_thesis_links(MARKET_MEMORY_DB_PATH, state_id)


@fastapi_app.post("/api/memory/states/{state_id}/thesis-links")
def api_upsert_memory_regime_thesis_link(state_id: str, body: dict | None = Body(default=None)):
    try:
        return upsert_regime_thesis_link(MARKET_MEMORY_DB_PATH, state_id, body or {})
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@fastapi_app.get("/api/memory/taxonomy")
def api_memory_taxonomy(request: Request):
    qs = query_lists(request)
    return list_taxonomy(
        MARKET_MEMORY_DB_PATH,
        term_type=qs.get("type", [""])[0],
        limit=int(qs.get("limit", [50])[0] or 50),
    )


@fastapi_app.get("/api/memory/story-links")
def api_memory_story_links(request: Request):
    qs = query_lists(request)
    return list_story_links(
        MARKET_MEMORY_DB_PATH,
        story=qs.get("story", [""])[0],
        limit=int(qs.get("limit", [50])[0] or 50),
    )


@fastapi_app.get("/api/memory/story-map")
def api_memory_story_map(request: Request):
    qs = query_lists(request)
    return story_map(MARKET_MEMORY_DB_PATH, limit=int(qs.get("limit", [80])[0] or 80))


@fastapi_app.get("/api/memory/suggestions")
def api_memory_suggestions(request: Request):
    qs = query_lists(request)
    return list_family_suggestions(
        MARKET_MEMORY_DB_PATH,
        status=qs.get("status", ["suggested"])[0],
        limit=int(qs.get("limit", [50])[0] or 50),
    )


@fastapi_app.post("/api/memory/suggestions/{suggestion_id}")
def api_review_memory_suggestion(suggestion_id: str, body: dict | None = Body(default=None)):
    body = body or {}
    return review_family_suggestion(
        MARKET_MEMORY_DB_PATH,
        suggestion_id,
        body.get("action", "reject"),
    )


@fastapi_app.get("/api/memory/audit")
def api_memory_audit(request: Request):
    qs = query_lists(request)
    return audit_memory(MARKET_MEMORY_DB_PATH, days=int(qs.get("days", [30])[0] or 30))


@fastapi_app.get("/api/memory/report")
def api_memory_report(request: Request):
    qs = query_lists(request)
    return memory_report(MARKET_MEMORY_DB_PATH, limit=int(qs.get("limit", [8])[0] or 8))


@fastapi_app.get("/api/topic-reports/presets")
def api_topic_report_presets():
    return preset_topics_list()


@fastapi_app.get("/api/topic-reports")
def api_list_topic_reports():
    return list_topic_reports()


@fastapi_app.post("/api/topic-reports/plan")
def api_topic_report_plan(body: dict | None = Body(default=None)):
    body = body or {}
    from features.topic_report.planner import build_topic_plan
    generation_mode = request_generation_mode(body)
    plan = build_topic_plan(
        body.get("topicKey", "custom"),
        custom_label=body.get("customLabel", ""),
        user_context=body.get("userContext", ""),
        llm_override=False if generation_mode == "llm_cli" else llm_override_for_mode(generation_mode),
    )
    return {"topicPlan": plan}


@fastapi_app.post("/api/topic-reports")
def api_generate_topic_report(body: dict | None = Body(default=None)):
    body = body or {}
    custom_tickers = body.get("customTickers")
    quality_mode = normalize_quality_mode(body.get("qualityMode", "diagnose_only"))
    generation_mode = request_generation_mode(body)
    if generation_mode == "llm_cli":
        return submit_agent_task("topic_report", {
            "topic_key": body.get("topicKey", "weekly_market"),
            "custom_label": body.get("customLabel", ""),
            "user_context": body.get("userContext", ""),
            "date": body.get("date", ""),
            "use_planner": body.get("usePlanner", True) is not False,
            "quality_mode": quality_mode,
            "deep_research": bool(body.get("deepResearch")),
        }, adapter=body.get("agentAdapter", ""))
    report = generate_topic_report(
        topic_key=body.get("topicKey", "weekly_market"),
        custom_label=body.get("customLabel", ""),
        user_context=body.get("userContext", ""),
        web_search_override=bool_override(body.get("webSearch")),
        llm_override=llm_override_for_mode(generation_mode),
        date=body.get("date", ""),
        use_planner=body.get("usePlanner", True) is not False,
        custom_tickers=custom_tickers if isinstance(custom_tickers, dict) else None,
        quality_mode=quality_mode,
        deep_research=bool(body.get("deepResearch")),
    )
    try:
        preflight = report.pop("qualityPreflight", None)
        report = apply_quality_loop("topic_report", report, mode=quality_mode, preflight=preflight)
    except Exception as exc:
        report["qualityGeneration"] = {"mode": quality_mode, "repairApplied": False, "repairCount": 0, "warnings": [f"quality generation failed: {str(exc)[:120]}"]}
    # 생성한 보고서를 자동 저장한다(같은 주제·같은 날은 최신본으로 덮어씀).
    try:
        return save_topic_report(report)
    except Exception:
        return report


@fastapi_app.post("/api/topic-reports/save")
def api_save_topic_report(body: dict | None = Body(default=None)):
    return save_topic_report(body or {})


@fastapi_app.get("/api/topic-reports/{report_id}")
def api_get_topic_report(report_id: str, includePersonal: bool = False):
    report = get_topic_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Topic report not found")
    if not report.get("quality") or "sourceGrounding" not in report.get("quality", {}):
        try:
            result = recheck_research_quality("topic_report", report_id)
            report["quality"] = result.get("quality")
        except Exception as exc:
            report["quality"] = {"status": "warn", "warnings": [f"quality evaluation failed: {str(exc)[:120]}"]}
    return strip_overlay(report, includePersonal)


@fastapi_app.post("/api/topic-reports/{report_id}/evaluate")
def api_evaluate_topic_report(report_id: str):
    try:
        return evaluate_topic_report(report_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Topic report not found")


@fastapi_app.post("/api/topic-reports/{report_id}/personal-overlay")
def api_topic_report_personal_overlay(report_id: str, body: dict | None = Body(default=None)):
    body = body or {}
    generation_mode = request_generation_mode(body)
    if generation_mode == "llm_cli":
        return submit_agent_task("personal_overlay", {
            "report_kind": "topic_report",
            "report_id": report_id,
        }, adapter=body.get("agentAdapter", ""))
    try:
        return attach_overlay_to_topic_report(
            report_id,
            llm_override=llm_override_for_mode(generation_mode),
            web_search_override=bool_override(body.get("webSearch")),
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Topic report not found")


@fastapi_app.delete("/api/topic-reports/{report_id}")
def api_delete_topic_report(report_id: str):
    result = delete_topic_report(report_id)
    if not result.get("deleted"):
        raise HTTPException(status_code=404, detail="Topic report not found")
    return result


fastapi_app.mount("/", StaticFiles(directory=PUBLIC_DIR, html=True), name="public")


def main():
    ensure_dirs()
    load_jobs()
    if os.environ.get("STARTUP_REINDEX", "0").strip().lower() in {"1", "true", "yes", "on"}:
        build_index()
    else:
        load_index()
    port = int(os.environ.get("PORT", "8787"))
    host = os.environ.get("FOLIO_HOST", "127.0.0.1").strip() or "127.0.0.1"

    print("Folio OS starting...")
    print(f"Open this address on this PC: http://localhost:{port}")

    if host == "0.0.0.0":
        print(f"LAN access enabled. Open from your phone: http://<PC_LOCAL_IP>:{port}")
    else:
        print("LAN access disabled. Set FOLIO_HOST=0.0.0.0 to access from another device.")

    print("RSS collection is embedded in this Python app.")

    import uvicorn
    uvicorn.run(fastapi_app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    main()
