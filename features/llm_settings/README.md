# LLM/설정/Web Search

이 기능은 AI Agent 생성 정책, LLM CLI/API Provider, 모델, 인증 및 웹 검색 보완 설정을 관리합니다.

## 담당 범위

- Codex CLI, Claude Code CLI, Antigravity CLI(`agy`, Gemini) 설치·로그인·Provider·Model 선택
- Antigravity는 `agy -p`로 Gemini 모델 비대화형 실행을 지원해 브리핑·보고서 생성 Direct Bridge에 연결
- OpenAI/GPT, Gemini, Claude API Provider 선택
- Provider별 API Key/Model 저장
- Provider별 공식 API Key 발급 페이지 연결
- 저장된 API Key와 선택 모델의 read-only 연결 확인
- AI Agent 생성 정책: ON/OFF와 LLM CLI / LLM API 실행 방식 선택
- 브리핑 웹 검색 보완 ON/OFF
- 기업분석 웹 검색 보완 ON/OFF
- Notion 연동 토큰(NOTION_TOKEN)과 데이터베이스 ID(NOTION_DB_ID) 저장

## 설정 위치

웹 UI:

```text
설정 탭
```

`AI Agent 설정`은 ON/OFF와 실행 방식 토글을 한 화면에서 관리합니다. CLI 모드는 구독 계정으로 인증된 로컬 Codex/Claude/Antigravity CLI를 사용하고 API Key를 요구하지 않습니다. API 모드는 기존 Provider API Key 경로를 사용합니다.

LLM API 연결 확인은 생성 요청을 보내지 않고 Provider의 모델 조회 endpoint를 사용합니다. 키가 없거나, 인증이 실패하거나, 선택 모델에 접근할 수 없거나, 사용량 제한에 도달한 상태를 구분해 표시합니다.

브리핑·기업분석·테마분석·시장 내러티브·투자 리뷰 화면은 더 이상 생성 방식 드롭다운을 노출하지 않습니다. 생성 시점에는 전역 `AI_AGENT_ENABLED`와 `AI_AGENT_MODE`만 읽습니다. Agent가 꺼져 있으면 규칙 기반, 켜져 있으면 선택된 CLI/API 모드로 생성합니다.

파일:

```text
.env
.env.example
```

## 주요 환경 변수

```text
LLM_PROVIDER=openai
AI_AGENT_ENABLED=1
AI_AGENT_MODE=cli
USE_LLM_BRIEFING=1
USE_LLM_ANALYSIS=1
USE_WEB_SEARCH_FOR_BRIEFING=1
USE_WEB_SEARCH_FOR_ANALYSIS=1

OPENAI_MODEL=gpt-5.5
OPENAI_API_KEY=...

GEMINI_MODEL=gemini-3.5-flash
GEMINI_API_KEY=...

ANTHROPIC_MODEL=claude-sonnet-5
ANTHROPIC_API_KEY=...

NOTION_TOKEN=secret_xxx
NOTION_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

AGENT_CLI_PROVIDER=codex
FOLIO_AGENT_CODEX_MODEL=gpt-5.5
FOLIO_AGENT_CLAUDE_MODEL=claude-sonnet-5
```

설정 화면의 모델 목록은 고정 목록이 아니라 `features/llm_settings/model_catalog.py`가 만든 동적 catalog를 사용한다. 기본 로딩은 `data/llm-model-cache.json`에 저장된 마지막 모델 목록을 계속 재사용하며, 오래된 캐시라도 자동으로 다시 조회하지 않는다. 사용자가 설정 화면에서 모델/상태 새로고침을 눌러 `refresh=true` 요청을 보낼 때만 API Provider의 read-only model list endpoint 또는 CLI의 `models`/`model list` 계열 명령을 실행해 캐시를 갱신한다. 수동 새로고침이 실패하면 마지막 캐시를 유지하고, 저장된 캐시가 없거나 키 없음·CLI 미지원이면 아래 fallback 목록을 즉시 사용한다.

fallback 모델 목록:

```text
Codex/OpenAI: GPT-5.5, GPT-5.4, GPT-5.4-mini
Claude: Claude Fable 5, Claude Sonnet 5, Claude Opus 4.8, Claude Sonnet 4.6, Claude Haiku 4.5
Gemini: Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.5 Flash-Lite
```

## 관련 코드

- `features/llm_settings/settings_service.py`: `public_settings()`, `save_settings()` (Notion 설정 포함)
- `features/llm_settings/provider_status.py`: 공식 Key 발급 URL과 Provider 연결 확인
- `features/llm_settings/model_catalog.py`: API/CLI 모델 목록 수동 조회, fallback 병합, 캐시 우선 로딩
- `features/agent_mode/setup.py`: CLI 설치, 로그인 실행, Provider/Model 설정
- `features/agent_mode/bridge.py`: CLI 인증 상태 확인과 최종 생성 실행
- `app.py`: `selected_llm_config()`
- `app.py`: `request_openai()`, `request_gemini()`, `request_claude()`
- `public/app.js`: `renderSettings()`, 설정 저장 이벤트

## 보안 규칙

- 실제 API Key를 문서, 로그, 최종 답변에 출력하지 마세요.
- `.env`는 gitignore 대상입니다.
- 설정 API는 키 전체가 아니라 masking된 값만 프론트에 내려야 합니다.
