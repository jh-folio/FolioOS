# AI Agent Mode

AI Agent Mode는 OpenAI/Gemini/Claude API Key 없이도 Codex, Claude Code 같은 구독형 AI 에이전트를 Folio OS의 최종 작성자로 쓰기 위한 보조 기능입니다.

Folio OS는 자료 선별, context pack 생성, 저장 포맷, 품질 metadata를 맡고, 현재 채팅 중인 AI 에이전트가 context pack을 읽어 보고서/overlay/delta를 작성합니다. 앱 내부 LLM API를 호출하지 않는 경로입니다.

## Phase 1 흐름

```text
CLI로 context pack 생성
  -> 에이전트가 pack의 prompt/context를 읽고 Markdown 또는 JSON 작성
  -> CLI writeback으로 기존 data/* 저장소에 저장
  -> 웹앱은 기존 저장 보고서처럼 읽음
```

Context pack 저장 위치:

```text
data/agent-context/
```

최종 산출물은 기존 저장 위치를 그대로 씁니다.

```text
data/briefings/{date}.json
data/company-analysis/{id}.json
data/topic-reports/{file}.json
market-memory.sqlite3
```

## 지원 작업

| taskType | Prepare | Writeback | 산출물 |
| --- | --- | --- | --- |
| `briefing` | 지원 | Markdown | 일일 브리핑 JSON |
| `company_analysis` | 지원 | Markdown | 기업분석 JSON |
| `topic_report` | 지원 | Markdown | 테마분석 JSON |
| `personal_overlay` | 지원 | JSON | 기존 보고서의 `personalOverlay` |
| `thesis_delta` | 지원 | JSON | thesis delta SQLite row |
| `market_memory_llm` | 지원 | JSON | market memory SQLite row |
| `quality_repair` | 지원 | Markdown | 기존 보고서 markdown/quality metadata |
| `investment_review` | 지원 | Markdown | 투자 리뷰 JSON |

## Phase 2 Direct Agent Bridge

웹앱의 생성 화면은 더 이상 생성 방식 enum을 직접 노출하지 않습니다. 설정 탭의 `AI Agent 설정`이 전역 정책을 결정합니다.

```text
AI_AGENT_ENABLED=0      -> 규칙 기반
AI_AGENT_ENABLED=1
AI_AGENT_MODE=api       -> 앱 내부 LLM API
AI_AGENT_MODE=cli       -> 로컬 Codex/Claude Code/Antigravity CLI
```

CLI 모드가 활성화되어 있으면 기존 생성 API가 background job을 만들고 다음 순서로 실행합니다.

```text
context pack 생성
  -> 허용된 CLI adapter를 read-only/non-interactive로 실행
  -> stdout의 최종 Markdown/JSON 수집
  -> 코드에서 normalize/enum/quality 검증
  -> 기존 JSON/SQLite 저장소에 writeback
```

설정 탭의 `AI Agent 설정`에서는 Agent 생성 ON/OFF와 CLI/API 모드를 토글하고, CLI 모드에서는 Codex CLI, Claude Code CLI, Antigravity CLI 중 하나를 선택해 모델을 지정합니다. 모델 목록은 마지막으로 갱신한 캐시를 기본으로 사용하고, 사용자가 새로고침을 누를 때만 CLI 모델 조회 명령을 실행합니다. 설치 명령은 실행 전에 사용자 확인을 받습니다.

Antigravity CLI는 [공식 페이지](https://antigravity.google/product/antigravity-cli)의 `agy` 바이너리를 사용한다. 설치는 Windows `irm https://antigravity.google/cli/install.ps1 | iex`, 로그인은 인자 없이 `agy`(브라우저 OAuth)다. 실행은 `agy --model <model> --print <prompt>`로 단일 프롬프트를 비대화형 실행한다. 모델은 Gemini(`gemini-3.5-pro`/`gemini-3.5-flash`/`gemini-3.1-pro`)를 사용해 브리핑·기업분석·테마분석 등 모든 Agent task를 작성할 수 있다.

**⚠️ Antigravity는 Windows headless에서 미지원**: `agy` 1.0.10의 Windows `--print`(headless) 모드는 모델 응답을 stdout으로 반환하지 못한다. 진단 결과 auth·모델 호출(`streamGenerateContent`)·종료(exit 0)는 정상이지만, 응답이 의존하는 `transcript.jsonl`을 `C:\Users\...`가 아닌 `/Users\...`(POSIX) 경로로 열려다 실패하는 **agy 업스트림 버그** 때문에 출력이 사라진다. 기본 `--print-timeout`(5분) 경과 후 빈 결과로 끝나 "최종 결과를 반환하지 않았습니다" 오류가 난다.

- 따라서 Folio OS는 **Windows에서 Antigravity 어댑터를 미지원(`available: false`, `bridgeSupported: false`)으로 표시**하고, 실행 요청 시 5분 대기 없이 즉시 명확한 안내로 실패시킨다(`_invoke_agent_cli`의 사전 차단). Codex 또는 Claude CLI를 사용하면 된다.
- macOS/Linux는 `/Users` 홈이 실제 경로라 이 버그가 없어 정상 동작할 것으로 보므로, 미지원 처리는 **Windows에 한정**한다.
- agy가 차기 버전에서 경로 버그를 고치면 이 Windows 제한(`_probe_adapter`/`_invoke_agent_cli`의 `os.name == "nt"` 분기)을 제거한다.

Codex/Claude는 stdout으로 결과를 정상 반환하므로 영향이 없다.

Bridge 상태는 `GET /api/agent-bridge/status`에서 확인합니다. Codex/Claude는 버전 확인과 로그인 상태 확인이 모두 성공해야 사용 가능으로 처리하고, Antigravity는 `agy --version` 성공 시 사용 가능으로 처리합니다.
릴리즈 진단용 `GET /api/agent-bridge/preflight?adapter=codex|claude|antigravity`는 workspace, data directory, CLI 설치, 버전, 인증, Direct Bridge 지원 여부를 구조화된 check 목록으로 반환합니다. UI는 이 값을 그대로 사용해 "설치 필요", "로그인 필요", "현재 Windows 미지원" 같은 실패 상태를 명확히 표시할 수 있습니다.

```text
GET  /api/agent-bridge/settings
GET  /api/agent-bridge/preflight
POST /api/agent-bridge/settings
POST /api/agent-bridge/install/{codex|claude}
POST /api/agent-bridge/login/{codex|claude}
```

Codex는 `codex login status`, Claude Code는 `claude auth status`로 인증 상태를 확인합니다. 로그인 버튼은 별도 터미널에서 각 CLI의 대화형 인증을 시작합니다.

기본 탐색 명령은 `codex`, `claude`입니다. 별도 실행 파일을 사용할 때는 경로만 지정합니다.

```text
FOLIO_AGENT_CODEX_COMMAND=C:\path\to\codex.exe
FOLIO_AGENT_CLAUDE_COMMAND=C:\path\to\claude.exe
AGENT_CLI_PROVIDER=auto|codex|claude
FOLIO_AGENT_CODEX_MODEL=gpt-5.5
FOLIO_AGENT_CLAUDE_MODEL=claude-sonnet-5
AGENT_CLI_TIMEOUT_SECONDS=1800
```

Bridge는 shell 문자열을 실행하지 않고 adapter별 고정 argument list만 사용합니다. Provider API Key 환경 변수는 child process에서 제거하며 저장된 CLI 인증을 사용합니다.

## 사용 예시

브리핑 context pack 생성:

브리핑 task는 `marketScope: us | kr | both`와 `briefingType: default | market_focused | concise`를 전달할 수 있습니다. context pack과 writeback 모두 시장별 자료·이슈·세션 계약을 유지하며, 부분 시장 writeback은 저장된 반대편 시장을 보존하고 기존 Personal Overlay를 stale 처리합니다. 시장 내러티브는 `both` 결과에서만 누적합니다. `concise`도 섹션을 삭제하지 않고 시장당 최소 분량만 2,500자로 낮추며, 나머지 유형은 시장당 5,000자 계약을 유지합니다.

브리핑 context pack을 준비할 때 생성 당시 가격 series와 히트맵 사이드카 payload도 고정합니다. Agent가 Markdown 작성을 마친 뒤 writeback하면 같은 snapshot을 보고서와 `{date}.visuals.json`에 저장하므로 작성 시간 동안 시장 데이터가 바뀌어도 과거 보기가 흔들리지 않습니다.

CLI 브리핑은 API 브리핑과 동일한 시장별 프롬프트(`features/daily_briefing/prompt_us.md`, `features/daily_briefing/prompt_kr.md`), 선별 context, evidence, quality preflight를 사용합니다. `outputContract`는 선택 시장별 `0~6 + 오늘의 결론 + Source & Data Notes`, 한 줄 결론, 가운뎃점 요약, 최소 분량을 요구합니다. 첫 CLI 결과가 이 계약을 충족하지 못하면 같은 context pack으로 한 번 자동 재작성하며, 두 번째 결과도 미달하면 writeback을 호출하지 않아 기존 저장 브리핑과 시각 snapshot을 덮어쓰지 않습니다.

CLI writeback은 최종 Markdown의 주도 기업 ①·② 제목을 다시 해석해 사전 후보 회사 차트를 제거하고 해당 ticker의 생성 당시 차트로 교체합니다. 기업명을 해석할 수 없거나 가격 수집에 실패하면 다른 기업 차트를 순번만 맞춰 붙이지 않고 해당 차트를 생략하며 warning을 남깁니다. 지수와 히트맵 snapshot은 이 과정에서 다시 수집하거나 변경하지 않습니다.

```powershell
py -3 -m features.agent_mode.cli briefing --prepare --date 2026-06-15
```

생성 결과의 `packPath`를 열어 `agentInstructions`, `prompt`, `context`, `outputContract`를 읽고, 에이전트가 브리핑 Markdown을 작성합니다. 작성한 Markdown 파일을 저장한 뒤 writeback합니다.

```powershell
py -3 -m features.agent_mode.cli briefing --pack data\agent-context\briefing\2026-06-15_<packId>.json --write-markdown output.md
```

기업분석 context pack 생성:

```powershell
py -3 -m features.agent_mode.cli company_analysis --prepare --query SPCX
```

테마분석 context pack 생성:

```powershell
py -3 -m features.agent_mode.cli topic_report --prepare --topic-key custom --custom-label "AI 데이터센터 전력 병목" --user-context "전력 인프라와 반도체 공급망 연결 중심"
```

Personal Overlay context pack 생성:

```powershell
py -3 -m features.agent_mode.cli personal_overlay --prepare --report-kind company_analysis --report-id <report-id>
```

Overlay writeback은 JSON 객체를 받습니다.

```powershell
py -3 -m features.agent_mode.cli personal_overlay --pack data\agent-context\personal-overlay\<pack>.json --write-json overlay.json
```

## 안전 규칙

- `.env`, API Key, token, password는 context pack에 넣지 않습니다.
- Canonical 보고서 본문과 Personal Overlay는 분리합니다. Overlay writeback은 `personalOverlay` 필드만 갱신합니다.
- 사용자 Obsidian 노트와 thesis는 hypothesis이며, evidence로 승격하지 않습니다.
- 수치가 pack이나 직접 확인한 출처에 없으면 추정하지 않고 data gap으로 남깁니다.
- `generation.mode = "agent"`를 저장해 agent-authored 산출물임을 표시합니다.

## Global Agent Companion

The global Agent starts in Companion Mode on every screen. Companion Mode can answer questions, summarize visible context, suggest next actions, and explain implications without mutating saved reports or Market Memory.

When the user explicitly asks to revise, create, update, schedule, or write back work, the Agent switches to Task Mode. Task Mode must show the intended operation and require approval before saved JSON, SQLite, or report markdown is changed.

`POST /api/agent/companion`은 `message`, `context` 외에 채팅 도구 옵션 `options{model, effort, attachments}`를 받는다. `companion.normalize_agent_options()`가 effort enum(`low/medium/high/max`), 모델 문자열 길이, 첨부(최대 5개, 이름 120자, 본문 4,000자)를 코드에서 정규화해 응답 `options` 필드로 되돌려준다. 첨부파일 본문은 사용자 참고 입력(hypothesis)일 뿐 evidence로 승격하지 않는다.

## Agent Chat (실연결) + Task Mode Writeback

도크 채팅의 실제 실행 경로는 `features/agent_mode/chat.py`다.

- `POST /api/agent/chat` — `{message, context, options}`를 받아 `agent_bridge` job으로 제출한다(`submit_agent_chat`). CLI 실행이 오래 걸릴 수 있어 프론트는 `/api/jobs/{id}`를 폴링한다.
- **Companion 질문**: 현재 화면 컨텍스트 + 열린 보고서 markdown 발췌(최대 24,000자) + 첨부 + 노력 단계 힌트로 프롬프트를 구성해 `bridge.run_agent_prompt()`(pack/writeback 없는 read-only 원샷 실행, 모델 오버라이드 지원)로 답을 받는다.
- **Task 의도 + 저장 보고서 컨텍스트**(briefing/company_analysis/topic_report): CLI에 `{"summary", "revisedMarkdown"}` JSON으로 전체 수정본을 받아 unified diff와 함께 **제안(proposal)** 으로 `data/agent-proposals/{id}.json`에 저장한다. 이 시점에는 저장 보고서가 바뀌지 않는다.
- `POST /api/agent/proposals/{id}` `{action: approve|reject}` — **승인 시에만** 해당 보고서 JSON의 `markdown`을 교체하고 `agentRevisions` 이력을 남긴다(personalOverlay 등 다른 필드 보존). 제안 생성 이후 저장본이 바뀌었으면(`baseMarkdownHash` 불일치) 적용을 거부하고 `stale`로 표시한다.
- **CLI가 없으면** 규칙 기반 companion 응답으로 fallback한다(`engine: "rules"`) — LLM 없이도 동작 원칙 유지.
- 종합(`both`) 브리핑은 시장별 파일로 나뉘어 있어 단일 레거시 `{date}.json`이 있을 때만 수정 대상이 된다.

## 구현 위치

```text
features/agent_mode/schema.py   # context pack schema, secret scrubber, generation metadata
features/agent_mode/service.py  # prepare/writeback handlers
features/agent_mode/cli.py      # Phase 1 chat command entrypoint
features/agent_mode/bridge.py   # Phase 2 Direct Agent Bridge adapters/subprocess
features/agent_mode/setup.py    # CLI 설치/로그인/제공자·모델 설정
features/agent_mode/generation_mode.py # rules/llm_api/llm_cli normalization
```
