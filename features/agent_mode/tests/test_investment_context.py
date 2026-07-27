from __future__ import annotations

import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from features.agent_mode import investment_context
from features.agent_mode import routes
from features.common.shared_jobs_compat import worker_projection


def _context(ticker: str = "NVDA") -> dict:
    return {
        "ticker": ticker,
        "source": "both",
        "stance": "watch",
        "observedAt": "2026-07-27T12:00:00Z",
        "reasonCodes": [],
        "marketDrivers": [
            {"stateId": "ai-capex", "label": "AI CAPEX", "momentum": "strengthening"}
        ],
        "latestThesisVerdict": "maintained",
        "dueCheckpoints": [
            {
                "id": "cp-nvda",
                "label": "데이터센터 성장률 확인",
                "dueAt": "2026-08-28T00:00:00Z",
            }
        ],
        "linkedReports": [
            {"id": "analysis-nvda", "title": "NVDA 기업 분석", "reportType": "analysis"}
        ],
        "collections": [
            {
                "id": "sc-ai",
                "name": "AI 공급망",
                "revision": 2,
                "health": "active",
                "matchSources": ["saved_filter"],
            }
        ],
    }


class FakeContextService:
    def detail(self, ticker: str) -> dict:
        payload = _context(ticker)
        payload["quantity"] = 999
        payload["noteBody"] = "PRIVATE_NOTE_CANARY"
        return payload


def test_request_normalizes_unique_bounded_tickers():
    request = investment_context.InvestmentExplanationRequest.model_validate(
        {"tickers": [" nvda ", "$MSFT", "NVDA"]}
    )
    assert request.tickers == ("NVDA", "MSFT")
    with pytest.raises(ValidationError):
        investment_context.InvestmentExplanationRequest.model_validate(
            {"tickers": ["A", "B", "C", "D", "E", "F"]}
        )


def test_prepare_pack_allowlists_personal_links_and_external_references():
    pack = investment_context.prepare_investment_context_pack(
        ("NVDA",),
        FakeContextService(),
        evidence_loader=lambda ticker: [
            {
                "doc_id": "doc-1",
                "title": "Datacenter demand",
                "source": "PUBLIC_SOURCE",
                "url": "https://example.com/article",
                "date": "2026-07-26",
                "snippet": "PUBLIC_EVIDENCE_CANARY",
                "body": "PRIVATE_BODY_CANARY",
            }
        ],
    )
    encoded = json.dumps(pack, ensure_ascii=False)
    assert pack["target"] == "investment_exposure_risk_explanation"
    assert pack["selectedTickers"] == ["NVDA"]
    assert pack["personalContext"][0]["exposureLink"]["source"] == "both"
    assert pack["externalEvidence"][0]["items"][0]["snippet"] == "PUBLIC_EVIDENCE_CANARY"
    assert "PRIVATE_NOTE_CANARY" not in encoded
    assert "PRIVATE_BODY_CANARY" not in encoded
    assert "quantity" not in encoded
    assert pack["boundary"] == {
        "personalLayer": "hypothesis",
        "externalLayer": "evidence",
        "reusePersonalAsEvidence": False,
    }


def test_prompt_and_output_contract_require_challenge_without_advice():
    pack = investment_context.prepare_investment_context_pack(
        ("NVDA",),
        FakeContextService(),
        evidence_loader=lambda _ticker: [],
    )
    prompt = investment_context.build_investment_context_prompt(pack)
    for phrase in (
        "challengingEvidence",
        "uncertainties",
        "monitoringQuestions",
        "buy/sell/hold",
        "target price",
        "position-size",
        "untrusted_external_evidence",
    ):
        assert phrase in prompt
    assert "PRIVATE_NOTE_CANARY" not in prompt

    parsed = investment_context.parse_controlled_explanation(
        json.dumps(
            {
                "interpretation": "AI 투자 흐름과 연결된 관찰 항목입니다.",
                "challengingEvidence": ["수출 규제의 영향 범위는 아직 불명확합니다."],
                "uncertainties": ["다음 실적 전까지 수요 지속성을 확인하기 어렵습니다."],
                "monitoringQuestions": ["데이터센터 성장률이 유지되는가?"],
                "limitations": ["제공된 자료 범위만 사용했습니다."],
            },
            ensure_ascii=False,
        )
    )
    assert parsed["monitoringQuestions"] == ["데이터센터 성장률이 유지되는가?"]
    with pytest.raises(investment_context.ControlledOutputError):
        investment_context.parse_controlled_explanation(
            json.dumps(
                {
                    "interpretation": "지금 매수해야 합니다.",
                    "challengingEvidence": ["없음"],
                    "uncertainties": ["없음"],
                    "monitoringQuestions": ["언제 살까?"],
                    "limitations": ["없음"],
                },
                ensure_ascii=False,
            )
        )


def test_runner_uses_rules_when_cli_missing_or_output_is_unsafe(monkeypatch):
    monkeypatch.setattr(
        investment_context.bridge,
        "bridge_status",
        lambda **_kwargs: {"available": False},
    )
    progress_rows = []
    rules = investment_context.run_investment_context_explanation(
        ("NVDA",),
        context_service=FakeContextService(),
        evidence_loader=lambda _ticker: [],
        progress=lambda message, progress=None, **metadata: progress_rows.append(
            (message, progress, metadata)
        ),
    )
    assert rules["engine"] == "rules"
    assert "확인할 연결" in rules["reply"]
    assert "데이터센터 성장률 확인" in rules["reply"]
    assert not investment_context.contains_prohibited_advice(rules["reply"])
    assert progress_rows[-1][2] == {
        "engine": "rules",
        "adapter": "rules",
        "finalEngine": "rules",
        "fallbackReason": "engine_unavailable",
    }

    monkeypatch.setattr(
        investment_context.bridge,
        "bridge_status",
        lambda **_kwargs: {"available": True},
    )
    monkeypatch.setattr(
        investment_context.bridge,
        "run_agent_prompt",
        lambda *_args, **_kwargs: {
            "adapter": "codex",
            "output": json.dumps(
                {
                    "interpretation": "목표주가는 200달러입니다.",
                    "challengingEvidence": ["없음"],
                    "uncertainties": ["없음"],
                    "monitoringQuestions": ["언제 진입할까?"],
                    "limitations": ["없음"],
                },
                ensure_ascii=False,
            ),
        },
    )
    rejected = investment_context.run_investment_context_explanation(
        ("NVDA",),
        context_service=FakeContextService(),
        evidence_loader=lambda _ticker: [],
    )
    assert rejected["engine"] == "rules"
    assert rejected["notice"] == "controlled_output_rejected"
    assert not investment_context.contains_prohibited_advice(rejected["reply"])


def test_submit_uses_existing_agent_bridge_job_lifecycle(monkeypatch):
    captured = {}

    def fake_submit(kind, label, runner, *args, **kwargs):
        captured.update(
            kind=kind,
            label=label,
            runner=runner,
            args=args,
            kwargs=kwargs,
        )
        return {"id": "job_test", "status": "queued"}

    monkeypatch.setattr(investment_context, "submit_job", fake_submit)
    result = investment_context.submit_investment_context_explanation(
        ("NVDA",),
        context_service=FakeContextService(),
        evidence_loader=lambda _ticker: [],
    )
    assert result["id"] == "job_test"
    assert captured["kind"] == "agent_bridge"
    assert captured["args"] == (("NVDA",),)
    assert captured["kwargs"]["pass_job_id"] is True
    assert captured["kwargs"]["dedicated_thread"] is True


def test_http_boundary_validates_then_submits_without_leaking_body(monkeypatch):
    submitted = {}

    def fake_submit(tickers, context_service, evidence_loader):
        submitted["tickers"] = tickers
        submitted["service"] = context_service
        submitted["loader"] = evidence_loader
        return {"id": "job_test", "status": "queued"}

    monkeypatch.setattr(routes, "submit_investment_explanation", fake_submit)
    boundary = routes.AgentCompanionBoundary(
        object(),
        investment_context_service=FakeContextService(),
        evidence_loader=lambda _ticker: [],
    )
    response = boundary.explain_investment_context({"tickers": ["nvda"]})
    assert response["id"] == "job_test"
    assert submitted["tickers"] == ("NVDA",)

    invalid = boundary.explain_investment_context(
        {"tickers": ["INVALID/TICKER"], "noteBody": "PRIVATE_CANARY"}
    )
    assert invalid.status_code == 422
    assert b"PRIVATE_CANARY" not in invalid.body
    assert worker_projection(
        {"reply": "PRIVATE_REPLY", "tickers": ["NVDA"], "ok": True}
    ) == {"ok": True}


def test_app_wires_data_root_without_feature_logic():
    source = Path("app.py").read_text(encoding="utf-8")
    assert "AgentCompanionBoundary(" in source
    assert "data_dir=DATA_DIR" in source
    assert "/api/agent/investment-context/explain" not in source
