"""Company-analysis report style selection and prompt loading."""

from pathlib import Path


FEATURE_DIR = Path(__file__).resolve().parent
PROMPT_DIR = FEATURE_DIR / "prompts"

ANALYSIS_STYLES = {"beginner", "advanced"}

STYLE_ALIASES = {
    "beginner": "beginner",
    "basic": "beginner",
    "easy": "beginner",
    "starter": "beginner",
    "초심자": "beginner",
    "입문": "beginner",
    "쉬운": "beginner",
    "advanced": "advanced",
    "expert": "advanced",
    "pro": "advanced",
    "숙련자": "advanced",
    "심화": "advanced",
    "전문": "advanced",
}

STYLE_LABELS = {
    "beginner": "초심자",
    "advanced": "숙련자",
}

REQUIRED_SECTION_HEADINGS = [
    "핵심 판단",
    "기업 개요와 돈 버는 방식",
    "실적과 재무 품질",
    "밸류에이션",
    "경쟁우위",
    "리스크와 반증조건",
    "성장 전망과 체크포인트",
    "어떻게 접근할까",
    "자료 한계와 참고자료",
]


def normalize_analysis_style(value: str | None) -> str:
    key = str(value or "").strip().lower().replace("-", "_")
    return STYLE_ALIASES.get(key, "beginner")


def analysis_prompt_path(style: str | None) -> Path:
    return PROMPT_DIR / f"{normalize_analysis_style(style)}.md"


def read_analysis_prompt(style: str | None = None) -> str:
    path = analysis_prompt_path(style)
    return path.read_text(encoding="utf-8")


def analysis_style_label(style: str | None) -> str:
    return STYLE_LABELS[normalize_analysis_style(style)]


def validate_prompt_structure(prompt: str) -> list[str]:
    text = str(prompt or "")
    return [heading for heading in REQUIRED_SECTION_HEADINGS if heading not in text]
