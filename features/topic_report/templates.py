"""report_type별 보고서 지침 템플릿 로더 (설계 04 §8~9).

prompt.md는 공통 원칙만 담고, 유형별 강조점은 templates/<type>.md에서 조합한다.
파일이 없는 유형은 generic.md로 폴백한다.
"""
from __future__ import annotations

from pathlib import Path

from features.topic_report.topic_schema import normalize_report_type

TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"

# enum → 템플릿 파일. 없는 유형은 generic 폴백.
_TEMPLATE_FILES = {
    "macro_analysis": "macro_analysis.md",
    "cross_asset_analysis": "cross_asset_analysis.md",
    "industry_theme": "industry_theme.md",
    "supply_chain_theme": "supply_chain_theme.md",
    "policy_regulation": "policy_regulation.md",
    "geopolitical_risk": "geopolitical_risk.md",
    "factor_style": "factor_style.md",
    "company_basket": "company_basket.md",
    "earnings_theme": "generic.md",
    "country_market": "generic.md",
    "portfolio_implication": "generic.md",
    "custom_research": "generic.md",
}


def load_type_template(report_type: str) -> str:
    rtype = normalize_report_type(report_type)
    filename = _TEMPLATE_FILES.get(rtype, "generic.md")
    path = TEMPLATES_DIR / filename
    try:
        text = path.read_text(encoding="utf-8").strip()
    except Exception:
        text = ""
    if not text and filename != "generic.md":
        try:
            text = (TEMPLATES_DIR / "generic.md").read_text(encoding="utf-8").strip()
        except Exception:
            text = ""
    return text


def compose_prompt(base_prompt: str, report_type: str) -> str:
    """공통 prompt + 유형별 지침 결합."""
    template = load_type_template(report_type)
    if not template:
        return base_prompt
    return f"{base_prompt}\n\n---\n\n{template}"
