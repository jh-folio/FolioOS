from __future__ import annotations

from features.common.change_intelligence.basis import content_hash, normalize_basis, stable_id


def build_briefing_basis(report: dict, *, generation_docs: list[dict] | None = None) -> dict:
    report = report or {}
    docs = generation_docs or report.get("sources") or []
    refs = []
    for index, doc in enumerate(docs[:32], 1):
        if not isinstance(doc, dict):
            continue
        refs.append({
            "id": doc.get("id") or doc.get("sourceId") or stable_id("briefsrc", doc.get("url") or doc.get("path"), index),
            "title": doc.get("title"), "url": doc.get("url"), "path": doc.get("path"),
            "source": doc.get("source"), "sourceType": doc.get("sourceType") or doc.get("source_type") or "news",
            "reliabilityTier": doc.get("reliabilityTier") or doc.get("reliability_tier") or 2,
            "independentGroup": doc.get("publisherGroup") or doc.get("source"),
            "intakeStage": doc.get("intakeStage") or doc.get("intake_stage") or "evidence",
            "signalStatus": doc.get("signalStatus") or doc.get("signal_status"),
            "publishedAt": doc.get("publishedAt") or doc.get("date"),
            "contentHash": doc.get("contentHash") or content_hash({"title": doc.get("title"), "summary": doc.get("summary"), "url": doc.get("url")}),
        })
    ref_ids = [row["id"] for row in refs]
    units = []
    for index, driver in enumerate(report.get("marketDrivers") or [], 1):
        if not isinstance(driver, dict):
            continue
        subject = driver.get("driver") or driver.get("title")
        score = float(driver.get("score") or 0)
        units.append({
            "id": stable_id("driver", report.get("marketScope"), subject), "kind": "market_driver",
            "subject": subject, "currentValue": {"score": round(score, 2), "docCount": int(driver.get("docCount") or 0), "markets": driver.get("markets") or []},
            "direction": "active", "magnitude": min(1.0, abs(score) / 20 if score else 0.2),
            "horizon": "short_term", "sourceRefIds": ref_ids[:12],
        })
    for issue in (report.get("issueCoverage") or [])[:8]:
        if isinstance(issue, dict):
            units.append({
                "id": stable_id("issue", issue.get("market"), issue.get("issueId") or issue.get("title")),
                "kind": "issue_coverage", "subject": issue.get("title") or issue.get("issueId"),
                "currentValue": {"market": issue.get("market"), "impact": issue.get("marketImpactStatus")},
                "direction": "observed", "magnitude": 0.35, "horizon": "short_term", "sourceRefIds": ref_ids[:8],
            })
    metrics = []
    for item in (report.get("marketTape") or {}).get("items") or []:
        if not isinstance(item, dict):
            continue
        metric_id = item.get("id") or item.get("symbol") or item.get("label")
        value = item.get("value") if item.get("value") is not None else item.get("close")
        metrics.append({"id": metric_id, "value": value, "status": item.get("status"), "asOf": item.get("asOf")})
        if metric_id and value is not None:
            units.append({
                "id": stable_id("tape", metric_id), "kind": "market_metric", "subject": metric_id,
                "currentValue": value, "direction": "observed", "magnitude": min(1.0, abs(float(item.get("changePct") or 0)) / 5),
                "horizon": "short_term", "sourceRefIds": ref_ids[:4],
            })
    counter = [gap.get("message") or gap.get("title") for gap in report.get("dataGaps") or [] if isinstance(gap, dict)]
    return normalize_basis({
        "artifactKind": "briefing", "artifactId": report.get("id") or report.get("date"),
        "lineageId": f"briefing:{report.get('marketScope') or 'both'}", "scope": {"market": report.get("marketScope") or "both"},
        "asOf": report.get("generatedAt") or report.get("date"), "changeUnits": units,
        "sourceRefs": refs, "counterSignals": [], "uncertainties": counter, "metrics": metrics,
        "coverage": {"comparison": 1 if units else 0, "market": 1 if metrics else 0},
    })
