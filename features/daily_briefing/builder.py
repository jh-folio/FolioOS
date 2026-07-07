"""Daily briefing orchestration.

`app.py` only normalizes HTTP input and calls this module.  Selection,
generation, persistence and scope merging live here.
"""

from __future__ import annotations

from copy import deepcopy
import datetime as dt
from pathlib import Path

from features.common.dataframe_ops import top_records
from features.common.market_data.providers import fetch_korea_market_data
from features.common.market_data.snapshot import fetch_market_snapshot
from features.common.market_data.tape import build_market_tape
from features.common.quality_generation.loop import apply_quality_loop
from features.common.quality_generation.preflight import preflight_from_context
from features.common.quality_generation.schema import normalize_quality_mode
from features.common.research_library.indexing.service import IMPACT_TERMS, build_index, load_index
from features.common.research_library.search.service import group_docs
from features.common.research_schema.checkpoints import checkpoints_from_markdown
from features.common.research_schema.data_gaps import data_gaps_from_messages
from features.common.utils import kst_date, now_iso, read_json, write_json
from features.daily_briefing.issue_selection import (
    build_issue_coverage,
    derive_link_status,
    documents_for_scope,
    public_issue_coverage,
    session_modes_from_windows,
)
from features.daily_briefing.link_analysis import build_link_analysis
from features.daily_briefing.schema import (
    briefing_file_name,
    briefing_link_file_name,
    briefing_scope_view,
    enrich_briefing_sections,
    merge_briefing_report,
    normalize_briefing_contract,
    normalize_briefing_type,
    normalize_market_scope,
    visual_sidecar_gzip_file_name,
)
from features.daily_briefing.selection import (
    derive_market_drivers,
    infer_market_session_date,
    prioritize_briefing_groups,
    session_doc_counts,
)
from features.daily_briefing.service import (
    append_briefing_sources,
    briefing_sources_from_headlines,
    build_prompt_markdown,
    extract_prev_checklist,
    generate_llm_briefing,
    group_digest,
    llm_enhance_link_analysis,
    llm_status_message,
    load_prev_briefing,
    news_documents,
    prioritized_source_refs,
    briefing_prompt_path_label,
    read_briefing_prompt,
    select_briefing_docs,
    source_refs,
)
from features.daily_briefing.visuals import (
    collect_briefing_visuals,
    leading_company_subjects_from_markdown,
    write_visual_sidecar,
)
from features.llm_settings.client import selected_llm_config
from features.market_memory.memory import build_memory_from_briefing, list_briefing_memories, upsert_memory


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
BRIEFINGS_DIR = DATA_DIR / "briefings"
MARKET_MEMORY_DB_PATH = DATA_DIR / "market-memory.sqlite3"
BRIEFING_PROMPT_PATH = ROOT / "features" / "daily_briefing" / "prompt.md"


def _ensure_dirs():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    BRIEFINGS_DIR.mkdir(parents=True, exist_ok=True)


def cached_market_snapshot(ttl_minutes=20):
    _ensure_dirs()
    cache_path = DATA_DIR / "market-snapshot.json"
    cached = read_json(cache_path, None)
    if cached:
        try:
            fetched = dt.datetime.fromisoformat(cached.get("cachedAt", ""))
            if dt.datetime.now(dt.timezone.utc) - fetched < dt.timedelta(minutes=ttl_minutes):
                return cached.get("snapshot", cached)
        except Exception:
            pass
    snapshot = fetch_market_snapshot()
    write_json(cache_path, {"cachedAt": now_iso(), "snapshot": snapshot})
    return snapshot


def cached_korea_market_data(date, ttl_minutes=60):
    _ensure_dirs()
    cache_path = DATA_DIR / f"korea-market-data-{date}.json"
    cached = read_json(cache_path, None)
    if cached:
        try:
            fetched = dt.datetime.fromisoformat(cached.get("cachedAt", ""))
            if dt.datetime.now(dt.timezone.utc) - fetched < dt.timedelta(minutes=ttl_minutes):
                return cached.get("marketData", cached)
        except Exception:
            pass
    market_data = fetch_korea_market_data(date)
    write_json(cache_path, {"cachedAt": now_iso(), "marketData": market_data})
    return market_data


def _scope_groups_and_drivers(docs, market_windows):
    groups = prioritize_briefing_groups(group_docs(docs), market_windows, limit=6)
    drivers = derive_market_drivers(docs, market_windows, limit=4)
    return groups, drivers


def _headlines(groups):
    rows = []
    for index, group in enumerate(groups[:4], 1):
        subject = group.get("company") or group.get("sector") or "시장"
        docs_sorted = top_records(group.get("docs", []), ["marketRelevance", "sourceWeight"], 6, descending=True)
        tags = sorted(set(sum([doc.get("sectors", []) + doc.get("impactTags", []) for doc in docs_sorted], [])))[:8]
        variable = ", ".join([tag for tag in tags if tag in IMPACT_TERMS][:3]) or "실적, 수급, 밸류에이션"
        rows.append({
            "id": f"h{index}",
            "title": f"{subject}, {variable} 변수가 시장 기대를 재조정",
            "body": (
                f"{subject} 관련 뉴스는 {', '.join(sorted(set(doc.get('source', '') for doc in docs_sorted))[:4])} 자료에서 확인됩니다. "
                f"{group_digest(group, 2)} 핵심은 {variable}이 투자자 기대를 움직일 수 있다는 점입니다."
            ),
            "tags": tags,
            "sources": [
                {
                    "title": doc.get("title", ""), "source": doc.get("source", ""),
                    "date": doc.get("date", ""), "url": doc.get("url", ""),
                    "path": doc.get("path", ""), "type": doc.get("type", ""),
                }
                for doc in docs_sorted
            ],
        })
    return rows


def _scope_result(
    scope,
    briefing_type,
    date,
    source_date,
    docs,
    market_windows,
    market_snapshot,
    korea_market_data,
    memories,
    prev_checklist,
    quality_preflight,
    web_search_override,
    llm_override,
):
    scoped_docs = documents_for_scope(docs, scope)
    groups, drivers = _scope_groups_and_drivers(scoped_docs, market_windows)
    issues = build_issue_coverage(scoped_docs, scope.upper(), market_windows, limit=10)
    headlines = _headlines(groups)
    session_modes = session_modes_from_windows(market_windows)
    llm_result, llm_status = generate_llm_briefing(
        date,
        source_date,
        scoped_docs,
        groups,
        market_drivers=drivers,
        web_search_override=web_search_override,
        llm_override=llm_override,
        market_snapshot=market_snapshot,
        korea_market_data=korea_market_data,
        memories=memories,
        market_windows=market_windows,
        prev_checklist=prev_checklist,
        quality_preflight=quality_preflight,
        market_scope=scope,
        briefing_type=briefing_type,
        issue_coverage=issues,
        session_modes=session_modes,
    )
    if llm_result:
        sources = source_refs(llm_result.get("usedDocs", []), limit=14)
        markdown = append_briefing_sources(llm_result["markdown"], sources, limit=14)
        generation = {
            "mode": "llm", "status": llm_status, "provider": llm_result.get("provider", ""),
            "model": llm_result.get("model", ""), "responseId": llm_result.get("responseId", ""),
            "sourceCount": len(llm_result.get("usedDocs", [])), "webSearch": bool(llm_result.get("webSearch")),
            "tokenUsage": llm_result.get("tokenUsage") or {},
        }
    else:
        sources = prioritized_source_refs(scoped_docs, market_windows, limit=14, issue_coverage=issues)
        if not sources:
            sources = briefing_sources_from_headlines(headlines, limit=14)
        markdown = build_prompt_markdown(
            date,
            source_date,
            scoped_docs,
            groups,
            headlines,
            market_drivers=drivers,
            market_windows=market_windows,
            market_snapshot=market_snapshot,
            korea_market_data=korea_market_data,
            market_scope=scope,
            briefing_type=briefing_type,
            issue_coverage=issues,
            session_modes=session_modes,
        )
        generation = {
            "mode": "rules", "status": llm_status, "provider": selected_llm_config().get("provider", ""),
            "model": "", "sourceCount": len(sources),
        }
    generation["message"] = llm_status_message(generation)
    return {
        "marketScope": scope,
        "markdown": markdown,
        "sessionMode": session_modes.get(scope, ""),
        "marketSessionDate": (
            market_windows.get("usRegularSessionDate") if scope == "us"
            else market_windows.get("krCurrentSessionDate") or market_windows.get("krPreviousSessionDate")
        ),
        "sources": sources,
        "generation": generation,
        "headlines": headlines,
        "marketDrivers": drivers,
        "issueCoverageRaw": issues,
        "issueCoverage": public_issue_coverage(issues),
        "groups": groups,
        "documents": scoped_docs,
    }


def _merge_sources(results):
    rows = []
    seen = set()
    for result in results:
        for source in result.get("sources", []):
            key = source.get("url") or source.get("path") or source.get("title")
            if key and key not in seen:
                seen.add(key)
                rows.append(source)
    return rows[:28]


def _merge_with_existing(briefing, existing, market_scope):
    return merge_briefing_report(briefing, existing, market_scope)


def _items_for_market(items, scope):
    target = str(scope or "").upper()
    return [
        deepcopy(item) for item in (items or [])
        if str(item.get("market") or "").upper() in {target, "BOTH"}
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
    # Record the original generation scope so the archive can collapse a 종합(both)
    # generation's per-market files into a single combined card. `briefing` still
    # carries the request-level marketScope here (scope_view returns a copy).
    scoped["generationScope"] = normalize_market_scope(briefing.get("marketScope"))
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
    today = kst_date()
    date = date or today
    market_scope = normalize_market_scope(market_scope)
    briefing_type = normalize_briefing_type(briefing_type)
    quality_mode = normalize_quality_mode(quality_mode)
    try:
        build_index(incremental=True)
    except Exception:
        pass
    index = load_index()
    docs, source_date, market_windows = select_briefing_docs(
        news_documents(index), date, strict=bool(strict_date), today=today,
    )
    for doc in docs:
        doc["marketSessionDate"] = infer_market_session_date(doc, market_windows)

    market_snapshot = cached_market_snapshot()
    korea_market_data = cached_korea_market_data(date)
    market_tape = build_market_tape(
        date=date, market_snapshot=market_snapshot, korea_market_data=korea_market_data,
        market_windows=market_windows,
    )
    quality_preflight = preflight_from_context("briefing", {}, {
        "artifactId": date, "sourceCount": len(docs), "marketTape": market_tape,
    })
    memories = list_briefing_memories(MARKET_MEMORY_DB_PATH, limit=12)
    prev_briefing = load_prev_briefing(date)
    prev_checklist = extract_prev_checklist((prev_briefing or {}).get("markdown", ""))

    requested_scopes = ["us", "kr"] if market_scope == "both" else [market_scope]
    results = {
        scope: _scope_result(
            scope, briefing_type, date, source_date, docs, market_windows, market_snapshot, korea_market_data,
            memories, prev_checklist, quality_preflight, web_search_override, llm_override,
        )
        for scope in requested_scopes
    }
    # 사용자 요청(2026-06): '한미 시장 연결 요약'은 사용자에게 보여줄 필요가 없으므로 Canonical
    # 본문에 추가하지 않는다. linkStatus는 디버깅/메타데이터로만 계속 계산해 저장한다.
    link_status = "insufficient_evidence"
    link_analysis = None
    if market_scope == "both":
        link_status = derive_link_status(results["us"]["issueCoverageRaw"], results["kr"]["issueCoverageRaw"])
        # 연결 분석은 각 시장 Canonical 본문을 바꾸지 않는 별도 레이어다(읽기 시 결합).
        link_analysis = build_link_analysis(
            results["us"], results["kr"],
            market_windows=market_windows, market_tape=market_tape, link_status=link_status,
        )
        # LLM이 켜져 있으면 규칙 초안을 심화한다. 실패/비활성/무효 출력이면 규칙 본문 유지.
        enhanced_link = llm_enhance_link_analysis(
            link_analysis, market_windows=market_windows,
            llm_override=llm_override, web_search_override=web_search_override,
        )
        link_analysis = {
            **link_analysis,
            "llmEnhanced": bool(enhanced_link),
            **({"markdown": enhanced_link} if enhanced_link else {}),
        }

    markdown_parts = [results[scope]["markdown"] for scope in requested_scopes]
    markdown = "\n\n---\n\n".join(part for part in markdown_parts if part)
    sources = _merge_sources(results.values())
    scope_drivers = []
    issue_coverage = []
    headlines = []
    all_groups = []
    for scope in requested_scopes:
        headlines.extend(results[scope]["headlines"])
        all_groups.extend(results[scope]["groups"])
        issue_coverage.extend(results[scope]["issueCoverage"])
        for driver in results[scope]["marketDrivers"]:
            scope_drivers.append({
                "scope": scope,
                "driver": driver.get("driver", ""),
                "score": round(float(driver.get("score", 0)), 1),
                "markets": driver.get("markets", []),
                "sources": driver.get("sources", []),
                "impactTags": driver.get("impactTags", []),
                "sectors": driver.get("sectors", []),
                "docCount": len(driver.get("docs", [])),
            })

    try:
        leader_subjects = leading_company_subjects_from_markdown(markdown)
        visual_result = collect_briefing_visuals(
            date, market_scope, results, leader_subjects=leader_subjects,
        )
    except Exception as exc:
        visual_result = {
            "visualRecommendations": [], "visualSnapshots": [], "sidecar": {},
            "warnings": [f"visual snapshot collection failed: {str(exc)[:160]}"],
        }

    session_counts = session_doc_counts(docs, market_windows)
    checkpoints = checkpoints_from_markdown(
        markdown,
        artifact_type="briefing",
        artifact_id=date,
        headings=["다음 미국장 체크포인트", "다음 한국장 체크포인트", "내일 확인할 체크포인트"],
        scope="market",
        topic="Daily Market Briefing",
    )
    gaps = []
    if not checkpoints:
        gaps.append("브리핑에서 구조화 가능한 체크포인트 섹션을 찾지 못했습니다.")
    if not docs:
        gaps.append("브리핑 입력 뉴스 자료가 없습니다.")
    if not (market_snapshot or {}).get("ok"):
        gaps.append("미국/글로벌 시장 스냅샷을 불러오지 못했습니다.")
    if not (korea_market_data or {}).get("ok"):
        gaps.append("한국장 시장 수치를 불러오지 못했습니다.")
    for issue in issue_coverage:
        if issue.get("marketImpactStatus") == "unavailable":
            gaps.append(f"{issue.get('market', '')} issue {issue.get('issueId', '')}: 시장 반응 데이터가 없습니다.")
    gaps.extend(f"시각자료: {warning}" for warning in visual_result.get("warnings", []))
    for snapshot in visual_result.get("visualSnapshots", []):
        gaps.extend(f"시각자료 {snapshot.get('id', '')}: {warning}" for warning in snapshot.get("warnings", []))
        if (snapshot.get("coverage") or {}).get("status") == "partial":
            gaps.append(f"시각자료 {snapshot.get('id', '')}: 일부 종목만 수집됐습니다.")
        if snapshot.get("freshness") in {"stale", "unavailable"}:
            gaps.append(
                f"시각자료 {snapshot.get('id', '')}: {snapshot.get('freshness')} "
                f"(session {snapshot.get('marketSessionDate', '')}, asOf {snapshot.get('asOf', '')})"
            )
    data_gaps = data_gaps_from_messages(gaps, artifact_type="briefing", artifact_id=date)
    generations = [results[scope]["generation"] for scope in requested_scopes]
    generation = {
        "mode": "llm" if any(item.get("mode") == "llm" for item in generations) else "rules",
        "status": ",".join(sorted({item.get("status", "") for item in generations if item.get("status")})),
        "provider": ",".join(sorted({item.get("provider", "") for item in generations if item.get("provider")})),
        "model": ",".join(sorted({item.get("model", "") for item in generations if item.get("model")})),
        "webSearch": any(bool(item.get("webSearch")) for item in generations),
        "sourceCount": len(sources),
        "byMarket": {scope: results[scope]["generation"] for scope in requested_scopes},
    }
    generation["message"] = llm_status_message(generation)
    generated_at = now_iso()
    report_summary = f"{source_date} 자료를 시장별 이슈 확산도와 가격 반응으로 선별한 브리핑입니다."
    raw_sections = {
        key: {field: value for field, value in result.items() if field in {
            "markdown", "sessionMode", "marketSessionDate", "sources", "generation", "status",
        }}
        for key, result in results.items()
    }
    briefing_sections = enrich_briefing_sections(
        raw_sections,
        report_date=date,
        report_scope=market_scope,
        briefing_type=briefing_type,
        generated_at=generated_at,
        report_summary=report_summary,
    )
    briefing = {
        "date": date,
        "generatedAt": generated_at,
        "title": f"Daily Market Briefing — {date.replace('-', '.')}",
        "summary": report_summary,
        "prompt": read_briefing_prompt(market_scope),
        "promptPath": briefing_prompt_path_label(market_scope),
        "marketScope": market_scope,
        "briefingType": briefing_type,
        "markdown": markdown,
        "briefings": briefing_sections,
        "headlines": headlines,
        "sources": sources,
        "generation": generation,
        "marketSnapshot": market_snapshot,
        "koreaMarketData": korea_market_data,
        "marketWindows": market_windows,
        "marketDrivers": scope_drivers,
        "issueCoverage": issue_coverage,
        "visualRecommendations": visual_result.get("visualRecommendations", []),
        "visualSnapshots": visual_result.get("visualSnapshots", []),
        "checkpoints": checkpoints,
        "dataGaps": data_gaps,
        "marketTape": market_tape,
        "stats": {
            "documents": len(docs), "sourceDate": source_date,
            "analysisMode": market_windows.get("analysisMode", ""),
            "marketScope": market_scope, "driverCount": len(scope_drivers),
            "topDrivers": [driver.get("driver", "") for driver in scope_drivers[:4]],
            "sourceCount": len(sources), "issueCount": len(issue_coverage),
            "visualSnapshotCount": len(visual_result.get("visualSnapshots", [])),
            "linkStatus": link_status,
            "koreaMarketDataOk": bool(korea_market_data.get("ok")) if isinstance(korea_market_data, dict) else False,
            **session_counts,
        },
    }
    try:
        briefing = apply_quality_loop("briefing", briefing, mode=quality_mode, preflight=quality_preflight)
    except Exception as exc:
        briefing["quality"] = {"status": "warn", "warnings": [f"quality evaluation failed: {str(exc)[:120]}"]}

    if persist:
        saved_reports = {}
        for scope in requested_scopes:
            scoped_briefing = _single_market_briefing(briefing, scope)
            existing = read_json(BRIEFINGS_DIR / briefing_file_name(date, scope), None)
            if existing is None:
                existing = read_json(BRIEFINGS_DIR / briefing_file_name(date), None)
                existing = briefing_scope_view(existing, scope) if isinstance(existing, dict) else None
            scoped_briefing = _merge_with_existing(scoped_briefing, existing, scope)
            write_json(BRIEFINGS_DIR / briefing_file_name(date, scope), scoped_briefing)
            saved_reports[scope] = scoped_briefing
            try:
                sidecar = _sidecar_for_market(visual_result.get("sidecar") or {}, scope)
                if sidecar.get("snapshots"):
                    write_visual_sidecar(
                        BRIEFINGS_DIR / visual_sidecar_gzip_file_name(date, scope),
                        sidecar,
                        scope,
                    )
            except Exception as exc:
                scoped_briefing.setdefault("warnings", []).append(f"visual sidecar write failed: {str(exc)[:160]}")
                write_json(BRIEFINGS_DIR / briefing_file_name(date, scope), scoped_briefing)
        if market_scope == "both" and link_analysis:
            write_json(
                BRIEFINGS_DIR / briefing_link_file_name(date),
                {"date": date, "generatedAt": generated_at, **link_analysis},
            )
        if market_scope == "both":
            for entry in build_memory_from_briefing(briefing, all_groups):
                upsert_memory(MARKET_MEMORY_DB_PATH, entry)
        if len(requested_scopes) == 1:
            briefing = saved_reports.get(requested_scopes[0], briefing)
        else:
            briefing["briefings"] = {
                scope: saved_reports[scope] for scope in requested_scopes if scope in saved_reports
            }
    return briefing_scope_view(briefing, market_scope)

