"""Agent 채팅 실연결 + Task Mode 수정 제안(diff)·승인 writeback.

- Companion 질문은 현재 화면 컨텍스트(보고서 본문 발췌·첨부·노력 단계)를 붙여
  실제 Agent CLI(Codex/Claude)로 답한다. CLI가 없으면 규칙 기반 안내로 fallback.
- Task 의도 + 저장 보고서 컨텍스트면 CLI에 전체 수정본을 받아 unified diff와 함께
  제안(proposal)으로 저장하고, 사용자가 승인해야만 Canonical markdown을 바꾼다.
- 첨부파일·사용자 메시지는 hypothesis 입력이다. evidence로 승격하지 않는다.
"""
from __future__ import annotations

import difflib
import hashlib
import json
import re
import uuid
from pathlib import Path

from features.agent_mode import bridge
from features.agent_mode.companion import (
    agent_companion_reply,
    classify_agent_intent,
    normalize_agent_context,
    normalize_agent_options,
)
from features.common.jobs import submit_job
from features.common.utils import now_iso, read_json, write_json
from features.market_memory.snapshot import render_market_memory_context

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
PROPOSALS_DIR = DATA_DIR / "agent-proposals"
BRIEFINGS_DIR = DATA_DIR / "briefings"
ANALYSIS_DIR = DATA_DIR / "company-analysis"
TOPIC_DIR = DATA_DIR / "topic-reports"
MARKET_MEMORY_DB_PATH = DATA_DIR / "market-memory.sqlite3"

REVISABLE_KINDS = {"briefing", "company_analysis", "topic_report"}
MAX_REPORT_PROMPT_CHARS = 24_000
MAX_DIFF_LINES = 400

EFFORT_HINTS = {
    "low": "간결하게 핵심만 3~5문장으로 답한다.",
    "medium": "핵심 근거와 함께 균형 있게 답한다.",
    "high": "근거·반론·확인 포인트까지 깊이 있게 답한다.",
    "max": "가능한 모든 관점(근거, 반론, 리스크, 체크포인트)을 검토해 답한다.",
}


def _markdown_hash(markdown: str) -> str:
    return hashlib.sha256(str(markdown or "").encode("utf-8")).hexdigest()[:16]


def _safe_report_id(report_id: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._:-]", "", str(report_id or ""))[:120]


def resolve_artifact_path(kind: str, report_id: str, market_scope: str = "") -> Path | None:
    """대화 컨텍스트의 보고서를 저장 파일로 매핑한다. 못 찾으면 None."""
    report_id = _safe_report_id(report_id)
    if not report_id:
        return None
    if kind == "briefing":
        scope = str(market_scope or "").strip().lower()
        candidates = []
        if scope in {"us", "kr"}:
            candidates.append(BRIEFINGS_DIR / f"{report_id}.{scope}.json")
        # 종합(both)·레거시는 단일 {date}.json만 수정 대상으로 삼는다.
        candidates.append(BRIEFINGS_DIR / f"{report_id}.json")
        for path in candidates:
            if path.exists():
                return path
        return None
    if kind == "company_analysis":
        path = ANALYSIS_DIR / f"{report_id}.json"
        return path if path.exists() else None
    if kind == "topic_report":
        path = TOPIC_DIR / f"{report_id}.json"
        if path.exists():
            return path
        try:
            for candidate in TOPIC_DIR.glob("*.json"):
                if report_id in candidate.stem:
                    return candidate
        except Exception:
            pass
        return None
    return None


def load_artifact(kind: str, report_id: str, market_scope: str = "") -> tuple[Path | None, dict | None]:
    path = resolve_artifact_path(kind, report_id, market_scope)
    if not path:
        return None, None
    data = read_json(path, None)
    if not isinstance(data, dict) or not str(data.get("markdown") or "").strip():
        return None, None
    return path, data


def _attachment_block(options: dict) -> str:
    parts = []
    for item in options.get("attachments") or []:
        name = item.get("name", "")
        content = str(item.get("content") or "").strip()
        if content:
            parts.append(f"[첨부: {name}]\n```\n{content}\n```")
        else:
            parts.append(f"[첨부: {name}] (본문 미포함)")
    return "\n\n".join(parts)


def _context_block(context: dict, markdown: str) -> str:
    lines = [
        f"- 화면: {context.get('surface') or context.get('viewId') or '알 수 없음'}",
    ]
    if context.get("reportKind"):
        lines.append(f"- 보고서: {context['reportKind']} / {context.get('reportId', '')} / {context.get('marketScope', '')}")
    if context.get("selectedText"):
        lines.append(f"- 사용자가 선택한 문구: {context['selectedText'][:500]}")
    block = "\n".join(lines)
    if markdown:
        clipped = markdown[:MAX_REPORT_PROMPT_CHARS]
        truncated = " (이하 생략)" if len(markdown) > MAX_REPORT_PROMPT_CHARS else ""
        block += f"\n\n현재 열린 보고서 본문{truncated}:\n<report>\n{clipped}\n</report>"
    return block


def build_chat_prompt(message: str, context: dict, options: dict, markdown: str = "") -> str:
    effort = EFFORT_HINTS.get(options.get("effort", "medium"), EFFORT_HINTS["medium"])
    attachments = _attachment_block(options)
    market_memory = render_market_memory_context(MARKET_MEMORY_DB_PATH)
    return "\n\n".join(filter(None, [
        "You are the Folio OS in-app research assistant. Folio OS is a local investment research workspace. Answer in Korean, in Markdown.",
        f"응답 지침: {effort}",
        "규칙: 제공된 자료(보고서 본문·첨부)에 없는 수치·출처를 만들어내지 않는다. 모르는 것은 data gap으로 명시한다. "
        "사용자 메모·첨부는 hypothesis(가설)이며 객관적 근거처럼 단정하지 않는다. 저장된 파일을 수정하라는 요청이라도 이 응답에서는 수정하지 말고 답변만 한다.",
        market_memory,
        f"현재 화면 컨텍스트:\n{_context_block(context, markdown)}",
        attachments,
        f"사용자 질문:\n{message}",
    ]))


def build_revision_prompt(message: str, context: dict, options: dict, markdown: str) -> str:
    effort = EFFORT_HINTS.get(options.get("effort", "medium"), EFFORT_HINTS["medium"])
    attachments = _attachment_block(options)
    return "\n\n".join(filter(None, [
        "You are the Folio OS report revision assistant. Revise the saved report markdown according to the user's request.",
        f"수정 강도 지침: {effort}",
        "Hard rules:",
        "- Return ONLY a JSON object: {\"summary\": \"한국어 한두 문장 변경 요약\", \"revisedMarkdown\": \"수정된 전체 markdown\"}.",
        "- revisedMarkdown must be the COMPLETE document (not a patch). Keep every existing section unless the request explicitly removes it.",
        "- Keep the document language, heading structure, and formatting conventions.",
        "- Do not invent new numbers, prices, or sources that are not in the provided material. Mark unknowns as data gaps.",
        "- User notes and attachments are hypothesis, not evidence.",
        f"사용자 수정 요청:\n{message}",
        attachments,
        f"현재 저장된 보고서 전체 markdown:\n<report>\n{markdown}\n</report>",
    ]))


def _unified_diff(before: str, after: str) -> str:
    lines = list(difflib.unified_diff(
        str(before or "").splitlines(),
        str(after or "").splitlines(),
        fromfile="현재 저장본",
        tofile="수정 제안",
        lineterm="",
        n=2,
    ))
    if len(lines) > MAX_DIFF_LINES:
        lines = lines[:MAX_DIFF_LINES] + [f"... (diff {len(lines) - MAX_DIFF_LINES}줄 생략)"]
    return "\n".join(lines)


def save_proposal(record: dict) -> dict:
    PROPOSALS_DIR.mkdir(parents=True, exist_ok=True)
    write_json(PROPOSALS_DIR / f"{record['id']}.json", record)
    return record


def get_proposal(proposal_id: str) -> dict | None:
    safe = re.sub(r"[^a-zA-Z0-9-]", "", str(proposal_id or ""))
    if not safe:
        return None
    return read_json(PROPOSALS_DIR / f"{safe}.json", None)


def create_revision_proposal(*, kind: str, report_id: str, market_scope: str, message: str,
                             summary: str, revised_markdown: str, current_markdown: str,
                             adapter: str = "", model: str = "") -> dict:
    diff = _unified_diff(current_markdown, revised_markdown)
    record = {
        "id": uuid.uuid4().hex[:12],
        "status": "pending",
        "createdAt": now_iso(),
        "artifactKind": kind,
        "artifactId": report_id,
        "marketScope": market_scope,
        "request": str(message or "")[:2000],
        "summary": str(summary or "")[:1000],
        "adapter": adapter,
        "model": model,
        # 승인 시점에 저장본이 그 사이 바뀌었으면 적용을 거부하기 위한 기준 해시
        "baseMarkdownHash": _markdown_hash(current_markdown),
        "revisedMarkdown": revised_markdown,
        "diff": diff,
    }
    return save_proposal(record)


def apply_proposal(proposal_id: str) -> dict:
    record = get_proposal(proposal_id)
    if not record:
        raise ValueError("제안을 찾을 수 없습니다.")
    if record.get("status") != "pending":
        raise ValueError(f"이미 처리된 제안입니다({record.get('status')}).")
    path, data = load_artifact(record.get("artifactKind", ""), record.get("artifactId", ""), record.get("marketScope", ""))
    if not path or not data:
        raise ValueError("대상 보고서를 찾을 수 없습니다. 삭제되었을 수 있습니다.")
    if _markdown_hash(data.get("markdown", "")) != record.get("baseMarkdownHash"):
        record["status"] = "stale"
        save_proposal(record)
        raise ValueError("제안 생성 이후 보고서가 변경되어 적용할 수 없습니다. 다시 요청해 주세요.")
    # Canonical markdown 교체는 사용자 승인 시점에만 일어난다. 다른 필드(personalOverlay 등)는 보존.
    data["markdown"] = record.get("revisedMarkdown", "")
    revisions = data.get("agentRevisions")
    if not isinstance(revisions, list):
        revisions = []
    revisions.append({
        "at": now_iso(),
        "proposalId": record["id"],
        "summary": record.get("summary", ""),
        "request": record.get("request", "")[:300],
        "adapter": record.get("adapter", ""),
        "model": record.get("model", ""),
    })
    data["agentRevisions"] = revisions
    write_json(path, data)
    record["status"] = "applied"
    record["appliedAt"] = now_iso()
    save_proposal(record)
    return {
        "ok": True,
        "status": "applied",
        "proposalId": record["id"],
        "artifactKind": record.get("artifactKind", ""),
        "artifactId": record.get("artifactId", ""),
        "marketScope": record.get("marketScope", ""),
        "summary": record.get("summary", ""),
    }


def reject_proposal(proposal_id: str) -> dict:
    record = get_proposal(proposal_id)
    if not record:
        raise ValueError("제안을 찾을 수 없습니다.")
    if record.get("status") == "pending":
        record["status"] = "rejected"
        record["rejectedAt"] = now_iso()
        save_proposal(record)
    return {"ok": True, "status": record.get("status"), "proposalId": record.get("id", "")}


_ANSI_RE = re.compile(r"\x1b\[[0-9;]*m")


def _clean_cli_error(error: Exception) -> str:
    text = _ANSI_RE.sub("", str(error))
    # CLI 배너/헤더를 걷어내고 실제 오류 줄을 우선 보여준다.
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for line in lines:
        if "ERROR:" in line:
            return line.replace("ERROR:", "").strip()[:400]
    return text[-400:]


def _revision_payload(output: str) -> dict:
    payload = bridge._json_payload(output)
    revised = str(payload.get("revisedMarkdown") or "").strip()
    if not revised:
        raise ValueError("Agent가 수정된 markdown을 반환하지 않았습니다.")
    return {"summary": str(payload.get("summary") or "").strip(), "revisedMarkdown": revised}


def run_agent_chat(message: str, context: dict | None = None, options: dict | None = None,
                   *, progress=None, job_id: str = "") -> dict:
    progress = progress or (lambda *args, **kwargs: None)
    normalized = normalize_agent_context(context)
    normalized_options = normalize_agent_options(options)
    intent = classify_agent_intent(message)

    # CLI가 없으면 기존 규칙 기반 companion 응답으로 fallback(LLM 없이도 동작 원칙).
    status = bridge.bridge_status()
    if not status.get("available"):
        fallback = agent_companion_reply(message, normalized, normalized_options)
        fallback["engine"] = "rules"
        fallback["reply"] = fallback.pop("message", "")
        fallback["notice"] = status.get("message") or "Agent CLI를 사용할 수 없어 규칙 기반으로 답합니다."
        return fallback

    kind = normalized.get("reportKind", "")
    path, artifact = (None, None)
    if kind in REVISABLE_KINDS:
        path, artifact = load_artifact(kind, normalized.get("reportId", ""), normalized.get("marketScope", ""))
    markdown = (artifact or {}).get("markdown", "")

    adapter = ""
    if intent == "task" and artifact is not None:
        progress("보고서 수정안을 작성하고 있습니다.", 20)
        prompt = build_revision_prompt(message, normalized, normalized_options, markdown)
        try:
            result = bridge.run_agent_prompt(prompt, model=normalized_options.get("model", ""), job_id=job_id)
        except Exception as exc:
            # 수정안 생성 실패는 사용자가 알아야 하므로 정리된 메시지로 실패시킨다.
            raise RuntimeError(f"Agent 수정안 생성 실패: {_clean_cli_error(exc)}") from exc
        adapter = result["adapter"]
        payload = _revision_payload(result["output"])
        if payload["revisedMarkdown"].strip() == str(markdown or "").strip():
            return {
                "ok": True,
                "mode": "companion",
                "engine": "cli",
                "adapter": adapter,
                "reply": "요청을 검토했지만 실제로 바꿀 내용이 없다고 판단했습니다. 더 구체적으로 요청해 주세요.",
                "context": normalized,
                "options": normalized_options,
            }
        progress("수정 제안 diff를 준비하고 있습니다.", 80)
        proposal = create_revision_proposal(
            kind=kind,
            report_id=normalized.get("reportId", ""),
            market_scope=normalized.get("marketScope", ""),
            message=message,
            summary=payload["summary"],
            revised_markdown=payload["revisedMarkdown"],
            current_markdown=markdown,
            adapter=adapter,
            model=normalized_options.get("model", ""),
        )
        return {
            "ok": True,
            "mode": "task",
            "engine": "cli",
            "adapter": adapter,
            "reply": payload["summary"] or "보고서 수정안을 준비했습니다. diff를 확인하고 승인해 주세요.",
            "proposal": {
                "id": proposal["id"],
                "summary": proposal["summary"],
                "diff": proposal["diff"],
                "artifactKind": proposal["artifactKind"],
                "artifactId": proposal["artifactId"],
                "marketScope": proposal["marketScope"],
            },
            "context": normalized,
            "options": normalized_options,
        }

    progress("Agent가 답변을 작성하고 있습니다.", 30)
    prompt = build_chat_prompt(message, normalized, normalized_options, markdown)
    try:
        result = bridge.run_agent_prompt(prompt, model=normalized_options.get("model", ""), job_id=job_id)
    except Exception as exc:
        # 질문형은 규칙 기반으로 답을 이어가고, CLI 실패 사유는 정리해서 알려준다.
        fallback = agent_companion_reply(message, normalized, normalized_options)
        fallback["engine"] = "rules"
        fallback["reply"] = fallback.pop("message", "")
        fallback["notice"] = f"Agent CLI 실행 실패로 규칙 기반으로 답합니다: {_clean_cli_error(exc)}"
        return fallback
    reply = result["output"]
    notice = ""
    if intent == "task" and artifact is None and kind in REVISABLE_KINDS:
        notice = "저장된 보고서를 찾지 못해 수정 대신 답변만 제공합니다. 보고서를 연 상태에서 다시 요청해 주세요."
    elif intent == "task":
        notice = "보고서를 연 상태에서 요청하면 수정안(diff)을 만들어 승인 후 반영할 수 있습니다."
    return {
        "ok": True,
        "mode": "companion",
        "engine": "cli",
        "adapter": result["adapter"],
        "reply": reply,
        "notice": notice,
        "context": normalized,
        "options": normalized_options,
    }


def submit_agent_chat(message: str, context: dict | None = None, options: dict | None = None) -> dict:
    job = submit_job(
        "agent_bridge",
        "Agent 채팅",
        run_agent_chat,
        message,
        context or {},
        options or {},
        pass_job_id=True,
        dedicated_thread=True,
    )
    job["generationMode"] = "llm_cli"
    return job
