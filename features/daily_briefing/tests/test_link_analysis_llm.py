import sys
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from features.daily_briefing import service


RULE_LINK = {
    "status": "connected",
    "sharedDrivers": ["AI 반도체 수요"],
    "usOnlyDrivers": ["장기금리 상승"],
    "krOnlyDrivers": ["원/달러 환율"],
    "markdown": "## 한미 시장 연결 분석\n\n공통 흐름: AI 반도체\n\n### 한계와 불확실성\n- 규칙 기반 추정",
}

ENHANCED = (
    "## 한미 시장 연결 분석\n\n두 시장은 AI 반도체 수요를 공통 축으로 움직였습니다...\n\n"
    "### 시나리오\n- 기본/낙관/비관\n\n### 한계와 불확실성\n- 인과를 단정하지 않습니다."
)


def _cfg(enabled=True, key="k", provider="openai"):
    return {"enabled": enabled, "apiKey": key, "provider": provider, "model": "test-model"}


def test_llm_enhance_returns_enhanced_markdown_when_valid():
    with patch.object(service, "selected_llm_config", return_value=_cfg()), \
            patch.object(service, "request_openai", return_value=(ENHANCED, "id", {})):
        out = service.llm_enhance_link_analysis(RULE_LINK, market_windows={}, llm_override=True)
    assert out == ENHANCED


def test_llm_enhance_falls_back_when_disabled_or_missing_key():
    with patch.object(service, "selected_llm_config", return_value=_cfg(enabled=False)):
        assert service.llm_enhance_link_analysis(RULE_LINK, llm_override=None) is None
    with patch.object(service, "selected_llm_config", return_value=_cfg(key="")):
        assert service.llm_enhance_link_analysis(RULE_LINK, llm_override=True) is None


def test_llm_enhance_rejects_output_without_header_or_uncertainty_guard():
    no_guard = "## 한미 시장 연결 분석\n\n" + ("심화 본문 " * 30)  # long but no 한계/불확실
    no_header = "연결 분석\n\n" + ("내용 " * 30) + "\n### 한계\n- x"
    with patch.object(service, "selected_llm_config", return_value=_cfg()):
        with patch.object(service, "request_openai", return_value=(no_guard, "id", {})):
            assert service.llm_enhance_link_analysis(RULE_LINK, llm_override=True) is None
        with patch.object(service, "request_openai", return_value=(no_header, "id", {})):
            assert service.llm_enhance_link_analysis(RULE_LINK, llm_override=True) is None


def test_llm_enhance_returns_none_on_exception():
    with patch.object(service, "selected_llm_config", return_value=_cfg()), \
            patch.object(service, "request_openai", side_effect=RuntimeError("boom")):
        assert service.llm_enhance_link_analysis(RULE_LINK, llm_override=True) is None
