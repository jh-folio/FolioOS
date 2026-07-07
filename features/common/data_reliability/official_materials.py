"""Official-material evidence adapters for reports and Thesis Delta."""
from __future__ import annotations

from features.common.research_schema.data_gaps import normalize_data_gap
from features.common.research_schema.evidence import evidence_items_from_list
from features.company_analysis.service import build_company_analysis_materials
from features.common.data_reliability.source_priority import annotate_source_priority


def company_from_thesis(thesis: dict) -> dict:
    return {
        "ticker": str(thesis.get("ticker") or "").strip().upper(),
        "name": str(thesis.get("company") or thesis.get("company_name") or "").strip(),
        "market": str(thesis.get("market") or "").strip().upper(),
        "sector": str(thesis.get("sector") or "").strip(),
        "cik": str(thesis.get("cik") or "").strip(),
        "corpCode": str(thesis.get("corpCode") or thesis.get("corp_code") or "").strip(),
    }


def _doc_to_evidence(doc: dict, *, default_type: str, role: str = "background") -> dict:
    return {
        "title": doc.get("title", ""),
        "source": doc.get("source", ""),
        "date": str(doc.get("date", ""))[:10],
        "type": default_type,
        "url": doc.get("url", ""),
        "path": doc.get("path", ""),
        "role": role,
        "axis": doc.get("analysisBucket") or "company_materials",
        "confidence": "high" if default_type == "filing" else "medium",
        "freshness": "recent",
        "reason": ", ".join(doc.get("analysisReasons", [])[:4]),
    }


def official_evidence_from_materials(materials: dict, *, artifact_type: str = "thesis_delta", artifact_id: str = "", limit: int = 12) -> tuple[list[dict], list[dict]]:
    """Return (evidenceItems, dataGaps) extracted from company-analysis materials."""
    rows: list[dict] = []
    gaps: list[dict] = []
    company = materials.get("company") or {}
    ticker = company.get("ticker") or company.get("name") or artifact_id
    sec_facts = materials.get("secFacts") or {}
    ranked = materials.get("rankedFiling") or {}

    if sec_facts and (sec_facts.get("ok") or sec_facts.get("markdown")):
        rows.append({
            "title": f"{ticker} companyfacts/DART structured financials",
            "source": "SEC companyfacts" if sec_facts.get("cik") else "DART financial statements",
            "date": "",
            "type": "filing",
            "role": "data_point",
            "axis": "official_financials",
            "confidence": "high",
            "freshness": "recent",
        })
    else:
        gaps.append(normalize_data_gap(
            {
                "category": "official_materials",
                "message": f"{ticker} 공식 구조화 재무 데이터(SEC companyfacts/DART)를 확보하지 못했습니다.",
                "severity": "high",
                "suggestedAction": "SEC_USER_AGENT/DART_API_KEY 설정과 ticker/CIK/corp_code 매핑을 확인하고, 필요하면 research-inbox/filings/에 공식 공시 원문을 추가하세요.",
            },
            artifact_type=artifact_type,
            artifact_id=artifact_id,
        ))

    if ranked.get("ok") and ranked.get("paragraphs"):
        meta = ranked.get("metadata") or {}
        form = meta.get("form") or "10-K"
        filing_date = str(meta.get("filingDate") or "")[:10]
        for paragraph in ranked.get("paragraphs", [])[:4]:
            text = paragraph.get("paragraph") or paragraph.get("text") or ""
            rows.append({
                "title": f"{ticker} {form} ranked paragraph",
                "source": f"SEC {form}",
                "date": filing_date,
                "type": "filing",
                "role": "background",
                "axis": f"ranked_filing_paragraph:{paragraph.get('item') or ''}",
                "confidence": "high",
                "freshness": "recent",
                "snippet": text[:500],
            })
    else:
        gaps.append(normalize_data_gap(
            {
                "category": "official_materials",
                "message": f"{ticker} SEC 10-K/10-Q 상위 문단을 확보하지 못했습니다.",
                "severity": "medium",
                "suggestedAction": "SEC 접근 설정을 확인하거나 research-inbox/filings/에 10-K/10-Q 원문 또는 PDF를 추가한 뒤 인덱스를 갱신하세요.",
            },
            artifact_type=artifact_type,
            artifact_id=artifact_id,
        ))

    for doc in materials.get("filingDocs") or []:
        rows.append(_doc_to_evidence(doc, default_type="filing", role="background"))
    for doc in materials.get("supportDocs") or []:
        default_type = "report" if (doc.get("analysisBucket") == "report" or doc.get("type") == "report") else "news"
        rows.append(_doc_to_evidence(doc, default_type=default_type, role="neutral"))

    evidence = evidence_items_from_list(rows, artifact_type=artifact_type, artifact_id=artifact_id, default_type="filing", limit=limit)
    return annotate_source_priority(evidence, artifact_type=artifact_type), gaps


def gather_company_material_evidence(thesis: dict, docs: list[dict], *, artifact_id: str = "", limit: int = 12) -> tuple[list[dict], list[dict], dict]:
    query = " ".join(x for x in [thesis.get("ticker", ""), thesis.get("company", ""), thesis.get("core_thesis", "")] if x).strip()
    company = company_from_thesis(thesis)
    try:
        materials = build_company_analysis_materials(query or company.get("ticker") or company.get("name"), docs, company)
        evidence, gaps = official_evidence_from_materials(materials, artifact_type="thesis_delta", artifact_id=artifact_id, limit=limit)
        meta = {
            "source": "company_analysis_materials",
            "counts": materials.get("counts", {}),
            "officialEvidenceCount": len(evidence),
        }
        return evidence, gaps, meta
    except Exception as exc:
        gap = normalize_data_gap(
            {
                "category": "official_materials",
                "message": f"company_analysis materials 재사용 중 오류가 발생했습니다: {str(exc)[:160]}",
                "severity": "medium",
                "suggestedAction": "기업 ticker/CIK 매핑과 SEC/DART 설정을 확인하고, 공식 공시 파일을 research-inbox/filings/에 추가하세요.",
            },
            artifact_type="thesis_delta",
            artifact_id=artifact_id,
        )
        return [], [gap], {"source": "company_analysis_materials", "error": str(exc)[:200], "officialEvidenceCount": 0}
