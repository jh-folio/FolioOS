"""Templates for Obsidian user-synthesis notes."""
from __future__ import annotations

from features.obsidian.export.formatter import build_frontmatter


def _wikilink(value: str) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    if text.startswith("[[") and text.endswith("]]"):
        return text
    return f"[[{text}]]"


def company_thesis_template(*, ticker: str = "", company: str = "", linked_reports: list[str] | None = None) -> str:
    ticker = str(ticker or "").strip().upper()
    company = str(company or ticker or "Company").strip()
    title = f"{ticker} Company Thesis" if ticker else f"{company} Company Thesis"
    meta = {
        "type": "company_thesis",
        "ticker": ticker,
        "company": company,
        "status": "active",
        "review_cycle": "quarterly",
        "conviction": "medium",
        "source_layer": "user_synthesis",
        "reuse_as_hypothesis": True,
        "linked_regimes": [],
        "key_metrics": [],
        "linked_reports": linked_reports or [],
    }
    return "\n\n".join([
        build_frontmatter(meta),
        f"# {title}",
        "## 핵심 Thesis\n",
        "## 핵심 가정\n",
        "## 강화 신호\n",
        "## 약화 신호\n",
        "## 이탈 조건\n",
        "## 다음 리뷰 체크포인트\n",
        "## 관련 보고서",
        "\n".join(f"- {_wikilink(x)}" for x in linked_reports or []) or "- ",
        "## 사용자 메모\n",
    ]).strip() + "\n"


def market_memo_template(*, topic: str = "", linked_tickers: list[str] | None = None, linked_regimes: list[str] | None = None, linked_reports: list[str] | None = None) -> str:
    topic = str(topic or "Market Memo").strip()
    linked_tickers = [str(x).strip().upper() for x in linked_tickers or [] if str(x).strip()]
    linked_regimes = [str(x).strip() for x in linked_regimes or [topic] if str(x).strip()]
    meta = {
        "type": "market_memo",
        "topic": topic,
        "status": "active",
        "source_layer": "user_synthesis",
        "reuse_as_hypothesis": True,
        "linked_regimes": linked_regimes,
        "linked_tickers": linked_tickers,
        "linked_reports": linked_reports or [],
    }
    return "\n\n".join([
        build_frontmatter(meta),
        f"# {topic} 메모",
        "## 내 생각\n",
        "## 강화 근거\n",
        "## 반대 근거\n",
        "## 확인할 지표\n",
        "## 관련 기업",
        "\n".join(f"- {_wikilink(x)}" for x in linked_tickers) or "- ",
        "## 관련 보고서",
        "\n".join(f"- {_wikilink(x)}" for x in linked_reports or []) or "- ",
    ]).strip() + "\n"


def topic_review_template(*, topic: str = "", linked_reports: list[str] | None = None, linked_tickers: list[str] | None = None) -> str:
    topic = str(topic or "Topic Review").strip()
    linked_reports = [str(x).strip() for x in linked_reports or [] if str(x).strip()]
    linked_tickers = [str(x).strip().upper() for x in linked_tickers or [] if str(x).strip()]
    meta = {
        "type": "topic_review",
        "topic": topic,
        "status": "active",
        "source_layer": "user_synthesis",
        "reuse_as_hypothesis": True,
        "linked_reports": linked_reports,
        "linked_tickers": linked_tickers,
    }
    return "\n\n".join([
        build_frontmatter(meta),
        f"# {topic} — 내 생각",
        "## 보고서 요약\n",
        "## 내가 동의하는 부분\n",
        "## 내가 의심하는 부분\n",
        "## 추가로 확인할 것\n",
        "## 투자 판단에 주는 영향\n",
        "## 관련 보고서",
        "\n".join(f"- {_wikilink(x)}" for x in linked_reports) or "- ",
    ]).strip() + "\n"


def investment_note_template(*, label: str = "", ticker: str = "", topic: str = "", body: str = "", linked_reports: list[str] | None = None) -> str:
    ticker = str(ticker or "").strip().upper()
    topic = str(topic or "").strip()
    label = str(label or ticker or topic or "투자").strip()
    meta = {
        "type": "investment_note",
        "status": "active",
        "source_layer": "user_synthesis",
        "reuse_as_hypothesis": True,
        "linked_reports": linked_reports or [],
    }
    if ticker:
        meta["ticker"] = ticker
    if topic:
        meta["topic"] = topic
    return "\n\n".join([
        build_frontmatter(meta),
        f"# {label} 투자 노트",
        "## 메모",
        str(body or "").strip(),
    ]).strip() + "\n"


def build_template(template_type: str, context: dict | None = None) -> str:
    context = context or {}
    if template_type == "company_thesis":
        return company_thesis_template(
            ticker=context.get("ticker", ""),
            company=context.get("company", ""),
            linked_reports=context.get("linkedReports") or context.get("linked_reports") or [],
        )
    if template_type == "market_memo":
        return market_memo_template(
            topic=context.get("topic", ""),
            linked_tickers=context.get("linkedTickers") or context.get("linked_tickers") or [],
            linked_regimes=context.get("linkedRegimes") or context.get("linked_regimes") or [],
            linked_reports=context.get("linkedReports") or context.get("linked_reports") or [],
        )
    if template_type == "topic_review":
        return topic_review_template(
            topic=context.get("topic", ""),
            linked_reports=context.get("linkedReports") or context.get("linked_reports") or [],
            linked_tickers=context.get("linkedTickers") or context.get("linked_tickers") or [],
        )
    if template_type == "investment_note":
        return investment_note_template(
            label=context.get("label", ""),
            ticker=context.get("ticker", ""),
            topic=context.get("topic", ""),
            body=context.get("body", ""),
            linked_reports=context.get("linkedReports") or context.get("linked_reports") or [],
        )
    raise ValueError(f"지원하지 않는 Obsidian 노트 템플릿입니다: {template_type}")
