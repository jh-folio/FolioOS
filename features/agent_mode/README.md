# AI Agent Mode

AI Agent Mode는 OpenAI/Gemini/Claude API Key 없이도 Codex, Claude Code 같은 구독형 AI 에이전트를 Folio OS의 최종 작성자로 쓰기 위한 보조 기능입니다.

0.2에서는 Home과 Deep Research에서 Agent를 사용하고, 두 화면이 같은 metadata-only Work Log를 공유합니다. Work Log에는 prompt, reply transcript, Markdown, diff, attachment, 로컬 path, credential, raw stdout/stderr가 저장되지 않습니다. Canonical 보고서는 generate/regenerate 또는 명시적으로 승인된 proposal만 수정할 수 있습니다.

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

CLI 선택은 **범위가 둘**이다. 자리도 둘이고, 화면이 어느 쪽인지 말한다.

| 범위 | 어디서 | 무엇이 쓰나 |
| --- | --- | --- |
| 전역 기본 | 상단바 `Agent CLI` 메뉴, 설정 탭 | 예약 브리핑, 기업분석, 오버레이 등 도크 밖에서 도는 모든 작업 |
| 이 대화만 | Agent 도크의 `이 대화의 CLI` | 그 대화의 질문 하나뿐 |

- 상단바와 설정 탭은 **같은 값**을 본다. 한쪽에서 바꾸면 `folio:agent-settings-updated`로 다른 쪽도 즉시 따라온다.
- 도크 선택은 요청의 `options.adapter`로만 전달되며 전역 설정을 저장하지 않는다. 전역과 다를 때 도크가 `이 대화만 ...로 돕니다`라고 밝힌다. 새 대화는 다시 전역 기본에서 시작한다.
- 도크의 CLI·모델·노력은 **버튼 하나로 접어** 둔다. 도크는 384px이라 셋을 나란히 두면 폼이 461px로 벌어져 77px이 잘렸고, 줄바꿈을 허용해도 늘 두 줄이었다. 버튼에는 `Claude · Claude Opus 5 · 중간`처럼 요약을 그대로 적어 열지 않고도 무엇으로 도는지 읽힌다. 팝오버는 위로 열린다 — 도크 맨 아래라 아래로 열면 화면 밖이다.
- 도크에서 CLI를 바꾸면 모델 목록이 통째로 달라지므로 모델도 그 CLI의 것으로 옮긴다. 이때도 전역 모델은 저장하지 않는다 — 저장하면 `이 대화에만`이 거짓이 되고 예약 브리핑의 모델까지 조용히 바뀐다.

설정 탭의 `AI Agent 설정`에서는 Agent 생성 ON/OFF와 CLI/API 모드를 토글하고, CLI 모드에서는 Codex CLI, Claude Code CLI, Antigravity CLI 중 하나를 선택해 모델을 지정합니다. 모델 목록은 마지막으로 갱신한 캐시를 기본으로 사용하고, 사용자가 새로고침을 누를 때만 CLI 모델 조회 명령을 실행합니다. 설치 명령은 실행 전에 사용자 확인을 받습니다.

Antigravity CLI는 [공식 페이지](https://antigravity.google/product/antigravity-cli)의 `agy` 바이너리를 사용한다. 설치는 Windows `irm https://antigravity.google/cli/install.ps1 | iex`, 로그인은 인자 없이 `agy`(브라우저 OAuth)다. 실행은 `agy --model <model> --print <prompt>`로 단일 프롬프트를 비대화형 실행한다. 모델 이름에는 노력 단계가 함께 들어간다(`gemini-3.1-pro-high`, `gemini-3.6-flash-medium`, `claude-sonnet-4-6` 등). 단계 없는 예전 이름(`gemini-3.5-pro`)은 1.1.7이 `not recognized`로 거부하므로 기본 목록에서 뺐다 — 실시간 목록에 기본값이 덧붙는 구조라 선택지에 남아 있으면 고르는 순간 실행이 실패한다. 이 모델들로 브리핑·기업분석·테마분석 등 모든 Agent task를 작성할 수 있다.

**Antigravity Windows headless는 agy 1.1.7에서 해결됐다.** 1.0.10의 Windows `--print`(headless)는 모델 응답을 stdout으로 반환하지 못했다. auth·모델 호출(`streamGenerateContent`)·종료(exit 0)는 정상인데, 응답이 의존하는 `transcript.jsonl`을 `C:\Users\...`가 아닌 `/Users\...`(POSIX) 경로로 열려다 실패하는 **agy 업스트림 버그** 때문에 출력이 사라졌다. 기본 `--print-timeout`(5분)이 지난 뒤 빈 결과로 끝나 "최종 결과를 반환하지 않았습니다" 오류가 났다.

- 1.1.7에서 고쳐진 것을 직접 실행해 확인했다(`--print`가 stdout으로 정상 반환, exit 0, 13초). 브리지를 통한 실행도 확인했다.
- **확인한 버전부터만 연다**(`bridge.AGY_HEADLESS_FIXED = (1, 1, 7)`). 1.1.0~1.1.6은 확인하지 않았고, 못 미치는 버전을 열어 주면 사용자가 5분을 기다린 뒤 빈 결과를 받는다. 버전을 못 읽으면 지원하지 않는 것으로 본다 — 잘못 열어 주는 쪽이 더 나쁘다.
- 못 미치는 버전은 예전처럼 `bridgeSupported: false`로 표시하고, 실행 요청 시 5분 대기 없이 즉시 안내로 실패시킨다(`_invoke_agent_cli`의 사전 차단).
- macOS/Linux는 `/Users` 홈이 실제 경로라 이 버그가 없었으므로 버전 게이트는 **Windows에 한정**한다.

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

CLI 브리핑은 API 브리핑과 동일한 시장별 프롬프트(`features/daily_briefing/prompt_us.md`, `features/daily_briefing/prompt_kr.md`), 선별 context, evidence, quality preflight를 사용합니다. `outputContract`는 선택 시장별 `0~6 + 오늘의 결론 + Source & Data Notes`, 한 줄 결론, 가운뎃점 요약, 최소 분량과 코드가 계산한 정확한 `세션일 + 마감/장중` 제목을 요구합니다. 첫 CLI 결과가 이 계약을 충족하지 못하면 같은 context pack으로 한 번 자동 재작성하며, 두 번째 결과도 미달하면 writeback을 호출하지 않아 기존 저장 브리핑과 시각 snapshot을 덮어쓰지 않습니다.

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

## Persistent Investment Consultation (0.4)

- 상담은 `data/agent-consultations/{sessionId}.json`에 JSON-per-session으로 원자 저장한다.
- 상담 안에서는 bounded memory와 최근 turn으로 문맥을 이어가지만 `layer=hypothesis`, `sourceLayer=user_consultation`, `reuseAsEvidence=false`를 고정한다.
- research index, source ledger, Canonical 보고서, Market Memory, Change Intelligence에는 상담 transcript를 넣지 않는다.
- user turn을 Agent 실행 전에 먼저 저장하므로 재시작 뒤 `retryMessageId`로 이어갈 수 있다. 500-message/2-MiB 경계에서는 연결된 continuation session을 만든다.
- Agent job과 Work Log에는 transcript·memory·Portfolio 상세를 남기지 않고 session/message ID와 terminal status만 남긴다.
- 보고서 proposal/writeback을 사용하지 않는다. 별도 `노트로 정리` preview를 명시적으로 확정할 때만 Native Note snapshot을 만든다.

API: `POST/GET /api/agent/consultations`, `GET/POST/DELETE /api/agent/consultations/{id}`, `POST .../{id}/messages|archive|note`.

## Global Agent Companion

The global Agent starts in Companion Mode on every screen. Companion Mode can answer questions, summarize visible context, suggest next actions, and explain implications without mutating saved reports or Market Memory.

When the user explicitly asks to revise, create, update, schedule, or write back work, the Agent switches to Task Mode. Task Mode must show the intended operation and require approval before saved JSON, SQLite, or report markdown is changed.

`POST /api/agent/companion`은 `message`, `context` 외에 채팅 도구 옵션 `options{model, effort, attachments}`를 받는다. `companion.normalize_agent_options()`가 effort enum(`low/medium/high/max`), 모델 문자열 길이, 첨부(최대 5개, 이름 120자, 본문 4,000자)를 코드에서 정규화해 응답 `options` 필드로 되돌려준다. 첨부파일 본문은 사용자 참고 입력(hypothesis)일 뿐 evidence로 승격하지 않는다.

**이미지 첨부는 CLI가 파일을 직접 읽는다 (0.5).** 이미지는 본문 텍스트가 없어 예전에는 프롬프트에 파일명만 실렸고, 이미지를 읽을 수 있는 Agent CLI에 파일이 닿지 못했다. 이제 `features/agent_mode/attachment_files.py`가 바이트를 임시 파일로 내리고 프롬프트에는 **경로만** 싣는다(`bridge.py`가 Agent Context Pack 경로를 싣는 방식과 같다).

- 형식 판정은 파일 시그니처로 한다. 브라우저 MIME과 확장자는 사용자 입력이라 신뢰하지 않는다. PNG/JPEG/GIF/WebP/BMP만 기록하고 그 외는 이유와 함께 거절한다.
- 상한: 이미지 1건 12MB(`MAX_IMAGE_BYTES`), 한 요청 4건(`MAX_IMAGE_FILES`). 초과분은 조용히 버리지 않고 사유를 프롬프트에 남긴다.
- 임시 파일 수명은 `StagedImages` 컨텍스트가 CLI 호출 구간으로 한정한다. 성공·실패·취소 모두에서 삭제한다. 원본을 `data/`에 남기지 않는다(0.4 스크린샷 계약과 동일).
- **바이트는 프롬프트·잡 결과·Work Log 어디에도 남지 않는다.** 잡 결과는 `data/jobs.json`에 저장되므로 `companion.public_options()`가 `imageData`를 떼고 `hasImage: true` 플래그만 남긴다.
- CLI가 없으면 이미지를 읽을 주체가 없다. 조용히 무시하지 않고 "Agent CLI가 없어 이미지를 열 수 없습니다"를 알린다.
- 포트폴리오 사진 가져오기는 **0.5.0 화면에서 빠졌다**(`features/portfolio/README.md`). 로컬 OCR·외부 Vision 런타임은 코드로만 남아 있고 화면도 route도 없다 — 0.5.X에서 사진 인식을 이 도크 경로 하나로 옮길 때 재료로 쓴다. **막힌 지점**: 이 첨부 경로는 CLI 전용이라(`_run_with_images`) 도크가 API 모드일 때는 이미지를 못 읽는다.

Deep Research의 `Agent에게 변화 묻기`는 frontend가 `collectionId`와 strict 정수 `collectionRevision`만 전달하는 명시적 Companion action이다. 서버는 저장된 Collection을 다시 조회하고 revision을 검사한 뒤, 한 번의 read-only resolve로 현재/이전 스냅샷 metadata, change counts/reason, 현재 외부 evidence 카드 최대 12개를 구성한다. Collection 정의는 ID/revision/definition hash만 포함한 `saved_filter_metadata_not_evidence`, 외부 카드는 `external_evidence_untrusted`로 표시한다. 카드의 title/source/url/snippet은 인용 데이터일 뿐 prompt 지시가 아니며 별도 untrusted delimiter 안에 둔다. 사용자 note/context, frontend가 보낸 match/evidence body, 보고서, Agent 응답은 이 projection에 들어가지 않는다.

Collection change-summary 응답은 conversational/non-mutating이다. workspace open과 Collection refresh는 Agent job을 만들지 않으며, Agent 조회도 스냅샷을 append하지 않는다. Work Log에는 기존 SharedJob의 task/status/timing/engine/artifact metadata만 남고 질문·context·evidence·reply는 복사되지 않는다.

### 개인 투자 맥락 위험 설명

Home·Market Memory·Smart Collection·Deep Research의 개인 맥락 카드에서 사용자가 `Agent로 위험 설명`을 직접 눌렀을 때만 `POST /api/agent/investment-context/explain`이 실행된다. 요청은 선택 ticker 최대 5개만 받으며, 서버가 저장된 context를 다시 조회해 포트폴리오/워치리스트 연결 metadata, Market Memory driver, thesis verdict, checkpoint, 연결 보고서와 외부 evidence 참조를 bounded pack으로 만든다. 수량·비중·note body는 pack에 포함하지 않는다.

Agent 출력은 해석·도전 근거·불확실성·모니터링 질문·한계의 strict JSON 계약을 통과해야 한다. 매수/매도/보유, 목표주가, position size, 진입·청산·주문 지침이 감지되거나 출력 계약이 깨지면 결과를 렌더링하지 않고 추천 없는 규칙 설명으로 안전하게 전환한다. 이 작업은 기존 `agent_bridge` SharedJob을 사용하며, Work Log에는 selected ticker, prompt, evidence, reply가 아니라 실행 상태·engine·fallback reason 같은 metadata만 남는다.

## Agent Chat (실연결) + Task Mode Writeback

도크 채팅의 실제 실행 경로는 `features/agent_mode/chat.py`다.

- `POST /api/agent/chat` — `{message, context, options}`를 받아 `agent_bridge` job으로 제출한다(`submit_agent_chat`). CLI 실행이 오래 걸릴 수 있어 프론트는 `/api/jobs/{id}`를 폴링한다.
- **Companion 질문**: 현재 화면 컨텍스트 + 열린 보고서 markdown 발췌(최대 24,000자) + 첨부 + 노력 단계 힌트로 프롬프트를 구성해 `bridge.run_agent_prompt()`(pack/writeback 없는 read-only 원샷 실행, 모델 오버라이드 지원)로 답을 받는다.
- **Task 의도 + 저장 보고서 컨텍스트**(briefing/company_analysis/topic_report): CLI에 `{"summary", "revisedMarkdown"}` JSON으로 전체 수정본을 받아 unified diff와 함께 **제안(proposal)** 으로 `data/agent-proposals/{id}.json`에 저장한다. 이 시점에는 저장 보고서가 바뀌지 않는다.
- `GET /api/agent/proposals/{id}` — pending 제안의 bounded summary/diff/수정 본문을 승인 화면에서 다시 읽고, terminal 제안은 본문 필드가 제거된 상태/status projection으로 읽는다. 이 본문은 Work Log에 복사하지 않는다.
- `POST /api/agent/proposals/{id}` `{action: approve|reject}` — **승인 시에만** Canonical coordinator가 `markdown`, `checkpoints`, `quality`, `qualityGeneration`, `canonicalRevision`, `agentRevisions`를 함께 갱신한다. `personalOverlay` 본문은 보존하고 Canonical 변경 시 stale marker만 추가한다. 제안 생성 이후 저장본의 `canonicalRevision` number/hash가 달라졌으면 보고서를 쓰지 않고 `stale`로 terminalize한다. approve/reject 응답은 `proposalId/status/reportKind/reportId/marketScope/targetRevision` 여섯 필드만 반환한다.
- 제안 파일은 canonical revision과 정규화된 request/Markdown/diff hash를 묶고, apply journal로 prepared → applying → report_written → applied 순서를 복구한다. `applying` 상태의 외부 action은 409이며 startup recovery만 재개한다. 예상하지 못한 적용 오류는 private 예외 문자열을 노출하지 않고 safe error code로 응답한다.
- **CLI가 없으면** 규칙 기반 companion 응답으로 fallback한다(`engine: "rules"`) — LLM 없이도 동작 원칙 유지.
- 종합(`both`) 브리핑은 시장별 파일로 나뉘어 있어 단일 레거시 `{date}.json`이 있을 때만 수정 대상이 된다.

## Agent Work Log

Work Log는 SharedJob과 현재 proposal 파일에서 요청 시점에 파생되는 metadata-only 보기다. 별도 작업 본문을 복사해 저장하지 않으며, 각 entry는 엄격한 26개 필드만 반환한다. prompt/context, reply, Markdown, diff, 경로, traceback, operation/commit metadata와 report·artifact ID는 반환하지 않는다. Pending proposal의 본문이 필요하면 Work Log가 아니라 `GET /api/agent/proposals/{id}`로 다시 조회한다.

- `GET /api/agent/work-log` — `kind=all|companion|task`, `limit`, `offset`으로 파생 목록을 조회한다.
- `POST /api/agent/work-log/clear-preview` → `DELETE /api/agent/work-log` — preview token으로 현재 보이기만 숨긴다. SharedJob, 보고서, proposal 파일은 변경하거나 삭제하지 않는다.
- `POST /api/agent/work-log/migration-preview` → `POST /api/agent/work-log/migration-confirm` — legacy `jobs.json`을 명시적으로 preview한 뒤 v2 job store로 이동한다. 일회성 유지보수이므로 화면 진입점은 Work Log가 아니라 설정의 `이전 작업 기록` 패널이다.

보존 표시는 최대 30일/200건이며, companion만 `category=companion`, artifact-producing task는 `category=task`다. 동기 direct Briefing/Company, index/RSS/setup/install은 Work Log에 들어가지 않는다. Direct Topic과 CLI/Agent Briefing·Company는 SharedJob이므로 포함된다.

SharedJob/Work Log의 경로별 lock registry는 프로세스 수명 동안 항목을 퇴거하지 않는다. 실제 제품의 durable store 경로는 설정된 data root 아래의 유한한 집합이며, 오래 살아 있는 service와 새 service가 같은 경로에 서로 다른 lock을 받지 않도록 lock identity를 보존하는 것이 메모리 회수보다 우선한다.

실행 중인 CLI 작업을 취소할 때는 SharedJob을 먼저 `cancel_requested`로 기록한 뒤 등록된 child process를 종료한다. 이미 terminal이거나 `committing`인 작업은 취소와 process 종료를 모두 거부하며, 종료 경계에서 child가 먼저 끝나도 승인된 취소는 유지한다.

## 구현 위치

```text
features/agent_mode/schema.py   # context pack schema, secret scrubber, generation metadata
features/agent_mode/service.py  # prepare/writeback handlers
features/agent_mode/cli.py      # Phase 1 chat command entrypoint
features/agent_mode/bridge.py   # Phase 2 Direct Agent Bridge adapters/subprocess
features/agent_mode/collection_context.py # bounded Collection change-summary context
features/agent_mode/setup.py    # CLI 설치/로그인/제공자·모델 설정
features/agent_mode/generation_mode.py # rules/llm_api/llm_cli normalization
```

## Stage 0.2.3 Investment Context 통합

`GET /api/investment-context/summary`와 `GET /api/investment-context/{ticker}`가
Home, Market Memory, Smart Collection, Deep Research에 동일한 read-only projection을
제공한다. 카드 표시·새로고침·checkpoint 조회만으로 Agent job을 만들지 않으며,
`Agent로 위험 설명` 버튼만 명시적 실행 경계다.

Agent는 선택 ticker를 서버 저장소에서 다시 조회하고 추천 없는 controlled 설명만
반환한다. 결과는 저장 보고서, 포트폴리오, 워치리스트, checkpoint를 자동 변경하지
않으며 Work Log에도 ticker, context, prompt, reply를 남기지 않는다.

## Agent 대화 (스레드) — 0.5

**도크가 대화의 집이다.** 주제가 붙은 대화(워치리스트·포트폴리오·보고서)는 도크 아래 한 종류이며, 별도 상담 패널은 없다. 화면에서는 전부 **대화**라 부르고 주제는 칩으로 보여준다.

`상담`이라는 말은 화면에서 뺐다 — 전문가가 조언한다는 뜻을 담는데 §5 원칙 3은 "사용자 생각을 옹호하지 말고 검증한다"이고 Agent는 투자 조언을 하지 않는다. 내부 식별자(`sourceLayer: user_consultation`, `consultationRef`)는 저장된 데이터와의 계약이라 그대로 둔다.

| | 값 |
|---|---|
| 저장 | `data/agent-threads/{id}.json` (JSON-per-thread) |
| API | `/api/agent/threads*` |
| 이관 | `agent-consultations/` → `agent-threads/` 첫 사용 시 1회. 복사 후 삭제라 실패해도 원본이 남고, 이름이 겹치면 양쪽 다 보존한다 |
| 브라우저 대화 | 첫 실행 시 서버 스레드로 1회 이관(`importMessages`). 옛 질문을 Agent로 재실행하지 않고 기록만 옮긴다 |

### 왜 서버에 저장하나

도크 대화가 `localStorage`에만 있으면 **Agent가 읽을 방법이 없다.** 세션이 끊겼다 돌아왔을 때 앞 맥락을 쓰는 것이 요구인데, 서버에 기록이 없으면 원천적으로 불가능하다.

### 생성과 저장이 한 경로다

스레드 러너(`job_runtime.run_consultation_job`)는 **맥락 조립과 저장만** 하고 생성은 도크와 같은 `chat.run_agent_chat`에 맡긴다. 두 경로로 나누면 같은 대화가 갈라져, 제안을 만들거나 거절한 사실이 대화 기록에 남지 않고 다음 세션의 Agent가 같은 제안을 다시 한다.

- 모델 입력은 전체 transcript가 아니라 **상한 있는 pack**이다: rolling summary + 최근 turn + 서버가 **매번 다시 읽은** 리서치 자료(32,000자, 넘치면 4단계 축약). 저장된 옛 시세·옛 브리핑을 재생하면 오래 쉬었다 돌아온 사용자에게 낡은 사실로 답하게 된다.
- **답변 본문은 잡 결과가 아니라 스레드에서 읽는다.** 잡 결과는 `data/jobs.json`과 Work Log에 저장되므로 transcript를 담지 않는다.
- 대화는 계속 hypothesis다. `layer=hypothesis`, `sourceLayer=user_consultation`, `reuseAsEvidence=false`가 코드 상수로 강제되고 화면에도 그 경계를 표시한다.
- scope를 주지 않으면 `general`이다. 예전에는 알 수 없는 kind가 조용히 `portfolio`로 떨어져, 주제 없는 도크 대화가 포트폴리오 대화로 둔갑하며 무관한 맥락을 끌어왔다.

### 대화 관리

목록·전환·제목 수정·보관·삭제를 도크가 소유한다. 삭제는 되돌릴 수 없어 확인을 받으며, 저장소도 `delete_session(confirmed=True)` 없이는 지우지 않는다.
