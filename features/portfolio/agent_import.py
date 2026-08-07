"""Read a position screenshot with the Agent CLI already configured for the app.

기존 두 경로는 둘 다 사용자에게 무언가를 더 시킨다 — 로컬 OCR은 Tesseract(kor+eng)
설치, 외부 Vision은 OpenAI 키 저장과 매 요청 동의다. 사용자가 이미 Agent CLI를
쓰고 있다면 그 CLI는 아무것도 더 깔지 않고 이미지를 읽는다. 그래서 사진 스캔의
기본 진입 장벽을 없애는 경로는 이쪽이다.

**바이트는 프롬프트에 넣지 않는다.** Agent 도크 첨부(`agent_mode/attachment_files.py`)와
같은 방식으로 파일 경로만 알려주고 CLI가 그 파일을 직접 연다. 이미지는 호출자의
임시 폴더에서 살고 블록이 끝나면 사라지며 `data/`에도 job 결과에도 남지 않는다.

**동의 체크박스를 두지 않는다.** 설정에서 Agent를 연결한 순간부터 그 프로젝트의
모든 동작에 Agent 사용을 허락한 것으로 본다(AGENTS.md §8 Agent 실행 경계). 다만
사진이 그 CLI 제공자에게 전달된다는 사실은 화면이 먼저 말한다 — 허락과 고지는
다른 문제다.
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

# CLI 한 번 호출이 수십 초다. 사진 여러 장이면 장마다 한 번씩이라 넉넉히 준다.
DEFAULT_TIMEOUT_SECONDS = 180

_PROMPT = """아래 경로의 이미지는 증권사 보유 종목 화면을 캡처한 것이다. 파일을 직접 열어 읽어라.

파일 경로: {path}

읽은 표를 JSON 하나로만 답하라. 설명·인사·코드펜스 밖 텍스트를 붙이지 마라.

{{"positions":[{{"ticker":"","name":"","quantity":null,"averagePrice":null,"currency":""}}]}}

규칙:
- `ticker`는 화면에 보이는 종목 코드나 티커다. 한국 종목은 6자리 숫자(예: 005930), 미국 종목은 영문 티커(예: NVDA)다. 코드가 안 보이고 이름만 있으면 `ticker`는 빈 문자열로 두고 `name`에 이름을 적어라.
- 보이지 않는 값은 `null`로 두어라. **추정하거나 계산해서 채우지 마라.** 평가금액을 수량으로 나누는 식의 역산도 하지 마라.
- 수량과 평균단가는 숫자만 적는다(쉼표·통화기호 없이).
- 합계·총자산·예수금 행은 종목이 아니다. 빼라.
- 종목이 하나도 안 보이면 {{"positions":[]}}로 답하라.
- 이미지를 열 수 없으면 추측하지 말고 {{"positions":[],"error":"image_unreadable"}}로 답하라.
"""


def _positions_from_output(text: str) -> list[dict]:
    """CLI 자유 텍스트에서 positions 배열만 꺼낸다.

    CLI는 코드펜스를 두르거나 앞뒤로 한두 문장을 붙인다. 파싱에 실패하면 빈
    목록이 아니라 오류다 — 빈 목록은 "사진에 종목이 없다"는 뜻이고, 그 둘을
    섞으면 읽기에 실패한 것을 사용자가 사진 탓으로 오해한다.
    """
    raw = str(text or "").strip()
    if not raw:
        raise ValueError("agent_import_empty_output")
    body = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.I | re.S).strip()
    payload = None
    for candidate in (body, raw):
        try:
            payload = json.loads(candidate)
            break
        except ValueError:
            start, end = candidate.find("{"), candidate.rfind("}")
            if start >= 0 and end > start:
                try:
                    payload = json.loads(candidate[start:end + 1])
                    break
                except ValueError:
                    continue
    if not isinstance(payload, dict):
        raise ValueError("agent_import_not_json")
    if str(payload.get("error") or "").strip() == "image_unreadable":
        raise ValueError("agent_import_image_unreadable")
    rows = payload.get("positions")
    if not isinstance(rows, list):
        raise ValueError("agent_import_not_json")
    return [row for row in rows if isinstance(row, dict)]


def cli_status() -> dict:
    """이 방식을 쓸 수 있는지와, 못 쓴다면 무엇을 하면 되는지.

    두 가지를 함께 본다. 설정의 `AI Agent 사용` 토글이 꺼져 있으면 CLI가 깔려
    있어도 쓰지 않는다 — 사용자가 명시적으로 끈 스위치다. 켜져 있으면 브리지가
    실제로 실행 가능한 어댑터를 찾았는지 본다.

    사유는 브리지가 쓰는 문장을 그대로 옮긴다. 설정 화면에 **CLI 경로를 넣는
    칸은 없다** — 경로는 PATH에서 자동으로 찾고, `.env`의
    `FOLIO_AGENT_<이름>_COMMAND`는 PATH 밖에 있을 때 쓰는 예외 통로다. 그러니
    "설정에서 경로를 지정하라"고 안내하면 없는 칸을 찾게 만든다.
    """
    try:
        from features.agent_mode import bridge
        from features.llm_settings.client import ai_agent_enabled

        if not ai_agent_enabled():
            return {"available": False, "reason": "agent_disabled", "message": "설정에서 AI Agent가 꺼져 있습니다."}
        status = bridge.bridge_status()
        if status.get("available"):
            return {"available": True, "reason": "", "message": str(status.get("message") or "")}
        return {"available": False, "reason": "agent_cli_unavailable", "message": str(status.get("message") or "")}
    except Exception:
        # 상태 조회가 터져도 다이얼로그는 열려야 한다. 다른 두 경로가 남아 있다.
        return {"available": False, "reason": "agent_status_unknown", "message": "Agent CLI 상태를 확인하지 못했습니다."}


def cli_available() -> bool:
    return bool(cli_status().get("available"))


def extract_positions(image_path: Path, *, timeout: int = 0) -> list[dict]:
    from features.agent_mode.bridge import run_agent_prompt

    effective = timeout or max(60, int(os.environ.get("PORTFOLIO_IMPORT_AGENT_TIMEOUT_SECONDS", DEFAULT_TIMEOUT_SECONDS)))
    try:
        result = run_agent_prompt(_PROMPT.format(path=Path(image_path)), timeout=effective)
    except RuntimeError:
        # 어댑터를 못 고른 경우다. 호출자가 503으로 옮긴다.
        raise
    except Exception as error:  # CLI 실행 실패·타임아웃
        raise RuntimeError("agent_import_cli_failed") from error
    return _positions_from_output(result.get("output"))
