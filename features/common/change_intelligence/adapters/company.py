from __future__ import annotations

from features.common.change_intelligence.basis import content_hash, normalize_basis, stable_id
from features.common.research_schema.data_gaps import data_gap_rows


def _latest_value(row: dict):
    for bucket in (row.get("annual") or [], row.get("quarterly") or [], row.get("recent") or []):
        for item in bucket if isinstance(bucket, list) else []:
            if isinstance(item, dict) and item.get("val") is not None:
                return {"value": item.get("val"), "end": item.get("end"), "filed": item.get("filed")}
    return None


def build_company_basis(report: dict, *, materials: dict | None = None) -> dict:
    report = report or {}
    materials = materials or report.get("analysisMaterials") or {}
    company = report.get("company") or materials.get("company") or {}
    ticker = str(company.get("ticker") or report.get("ticker") or report.get("query") or "").upper()
    selected_docs = materials.get("selectedDocs") or report.get("sources") or []
    refs = []
    for index, doc in enumerate(selected_docs[:32], 1):
        if not isinstance(doc, dict):
            continue
        refs.append({
            "id": doc.get("id") or doc.get("sourceId") or stable_id("cosrc", doc.get("url") or doc.get("path"), index),
            "title": doc.get("title"), "url": doc.get("url"), "path": doc.get("path"), "source": doc.get("source"),
            "sourceType": doc.get("sourceType") or doc.get("type") or "document",
            "reliabilityTier": doc.get("reliabilityTier") or doc.get("sourcePriority") or (1 if str(doc.get("source", "")).lower() in {"sec", "dart", "opendart"} else 2),
            "independentGroup": doc.get("source") or doc.get("path"), "intakeStage": doc.get("intakeStage") or "evidence",
            "publishedAt": doc.get("date"), "contentHash": doc.get("contentHash") or content_hash({"title": doc.get("title"), "summary": doc.get("summary"), "url": doc.get("url")}),
        })
    units = []
    sec = materials.get("secFacts") or {}
    for metric in sec.get("rows") or []:
        if isinstance(metric, dict) and (latest := _latest_value(metric)) is not None:
            units.append({
                "id": stable_id("metric", ticker, metric.get("metric")), "kind": "official_financial_metric",
                "subject": metric.get("metric"), "currentValue": latest, "direction": "reported",
                "magnitude": 0.7, "horizon": "long_term", "sourceRefIds": [row["id"] for row in refs if row.get("reliabilityTier") == 1][:4],
            })
    filing = materials.get("rankedFiling") or {}
    metadata = filing.get("metadata") or {}
    if metadata.get("accession") or metadata.get("reportDate"):
        units.append({
            "id": stable_id("filing", ticker, metadata.get("form") or "filing"), "kind": "official_filing",
            "subject": f"{ticker} {metadata.get('form') or 'filing'}", "currentValue": {"accession": metadata.get("accession"), "reportDate": metadata.get("reportDate"), "filingDate": metadata.get("filingDate")},
            "direction": "filed", "magnitude": 0.65, "horizon": "long_term", "sourceRefIds": [row["id"] for row in refs][:4],
        })
    inputs = report.get("analysisInputs") or {}
    for key in ("secFactsOk", "rankedFilingOk", "rankedParagraphs"):
        if key in inputs:
            units.append({"id": stable_id("input", ticker, key), "kind": "analysis_input", "subject": key, "currentValue": inputs.get(key), "direction": "observed", "magnitude": 0.2, "horizon": "medium_term", "sourceRefIds": []})
    uncertainties = [str(gap.get("message") or gap.get("title") or gap.get("id")) for gap in data_gap_rows(report.get("dataGaps"))]
    return normalize_basis({
        "artifactKind": "company_analysis", "artifactId": report.get("id") or f"{ticker}:{str(report.get('generatedAt') or '')[:10]}",
        "lineageId": f"company:{ticker}", "scope": {"ticker": ticker}, "asOf": report.get("generatedAt"),
        "changeUnits": units, "sourceRefs": refs, "counterSignals": report.get("counterEvidence") or [],
        "uncertainties": uncertainties, "metrics": [row for row in units if row.get("kind") == "official_financial_metric"],
        "coverage": {"comparison": 1 if units else 0, "market": 0},
    })
