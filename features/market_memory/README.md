# 시장 내러티브 메모리

시장 내러티브 메모리는 일일 브리핑에서 반복적으로 등장하는 테마를 단기 기사와 분리해 누적하고, 현재 유효한 투자 내러티브 상태를 관리하는 기능입니다.

## 담당 기능

- 브리핑 생성 시 주요 이슈 묶음을 `data/market-memory.sqlite3`에 저장합니다.
- 기사 제목/요약을 그대로 이어 붙이지 않고, 한국어 내러티브 문장으로 압축합니다.
- 영문 기사 본문은 길게 노출하지 않고 출처, 태그, 이벤트 성격을 바탕으로 한국어 관찰 포인트로 정리합니다.
- `Original link`, URL, `#` 등 RSS 원문 노이즈와 중복 문장을 제거합니다.
- 각 메모리에 최소 온톨로지를 붙입니다.
  - `category`: `stock_bond`, `geopolitics`, `emerging`
  - `region`: `US`, `KR`, `GLOBAL`
  - `importance`: `high`, `medium`, `low`
  - `entry_mode`: `issue`, `brief`
  - `event_kind`: `earnings`, `policy`, `geopolitics`, `industry_trend`, `market_move`, `brief`
- `story`, `story_family`, `story_thesis`, `story_checkpoint`로 메모리를 맥락화합니다.
- `state_label`, `story_family`는 `nvidia`, `samsung_electro_mechanics` 같은 slug가 아니라 사람이 읽는 제목으로 저장합니다.
- `market_narrative_states` 테이블에 현재 상태를 저장합니다.
  - `status`: `active`, `watch`, `resolved`, `overridden`
  - `bias`: `bullish`, `bearish`, `neutral`, `mixed`
  - `net_effect`: 해당 내러티브가 어떤 방향의 시장 효과를 갖는지에 대한 짧은 키
- Regime 추적 v2 필드를 같은 상태 테이블에 저장합니다.
  - `momentum`: `strengthening`, `stable`, `fading`, `turning`, `conflicted`
  - `confidence`, `evidence_count_7d/30d/90d`, `last_confirmed_at`, `last_challenged_at`
  - `falsification_triggers_json`, `next_checkpoints_json`
- `market_regime_evidence`, `market_regime_changes`, `market_regime_thesis_links` 테이블에 상태별 근거, 변화 로그, thesis 연결을 저장합니다.
- `market_memory_taxonomy` 테이블에 story, story_family, tag, industry, ticker, subject, event_kind, state_key의 사용량을 누적합니다.
- `market_story_links` 테이블에 branch와 family의 관계를 저장합니다.
  - `branches_from`, `same_family`, `confirms`, `conflicts_with`, `replaces`, `evolves_from`
- `market_story_family_suggestions` 테이블에 새 스토리가 기존 패밀리와 연결될 가능성을 저장합니다.
- story router가 개별 기업/섹터 이슈를 더 큰 family에 연결합니다.
  - 예: NVIDIA, Dell, SK하이닉스, 삼성전자 관련 AI 서버/반도체 이슈 → `AI 반도체 공급망`
  - 예: AI 데이터센터와 전력/유틸리티/전선 이슈 → `AI 데이터센터 전력 병목`
  - 예: 국채, 금리, 달러, FX 이슈 → `금리·달러 유동성`
- state router는 canonical state alias를 적용해 비슷한 active/watch 내러티브가 여러 개 뜨지 않게 합니다.
  - 예: `AI 공급망 병목 수혜 재선별` → `AI 반도체 공급망`
  - 예: `한국 반도체의 해외 자본시장 접근성과 수급 민감도` → `한국 반도체 수출 수혜와 원화·수급 긴장`
  - 예: `energy_geopolitical_risk` → `중동 에너지 리스크`
- 웹 UI의 `시장 내러티브` 탭에서 현재 중기 시장 상황과 누적 메모리 기반 판단을 확인합니다.
- 상태 카드에서 추세(momentum), 확신도(confidence), 7/30/90일 근거 수, 연결 기업, 연결 thesis 수를 확인하고 `추세 갱신`/`변화 로그`를 실행합니다. (표시명 `추세`/`확신도`는 내부 코드·API·테이블의 `regime`/`momentum`/`confidence`에 대응합니다.)
- Step 6 Data Foundation Lite 이후 Regime 추세 갱신은 `next_checkpoints_json`과 `falsification_triggers_json`도 함께 채워, 대시보드가 markdown 파싱 없이 이번 주 확인 항목을 읽을 수 있게 합니다.
- 서버 시작 시 active/watch 상태의 Regime 추세를 백그라운드에서 자동 갱신합니다. 시작 시 갱신을 끄려면 `STARTUP_REGIME_REFRESH=0`을 사용합니다.
- 웹 UI에서 내러티브 리포트, 품질 점검, 스토리 맵, 패밀리 리뷰를 함께 확인합니다.
- `시장 메모리 업데이트` 버튼을 누르면, 최신 뉴스 기반 내러티브 row 누적과 현재 시장 상태 스냅샷 생성을 순서대로 실행합니다.
- 브리핑 생성 전 LLM 컨텍스트에 최근 내러티브 메모리를 넣어 단발성 기사 나열을 줄입니다.

## 태그 어휘

`TAG_ALIASES`, `INDUSTRY_ALIASES`, `canonical_tag()`, `canonical_industry()`는 `features/common/taxonomy.py`에서 가져옵니다. 태그 alias를 추가하거나 canonical label을 수정할 때는 `taxonomy.py`만 수정하면 market_memory와 research library indexing에 동시 반영됩니다.

## 주요 파일

- `features/market_memory/memory.py`: SQLite 저장, 조회, 온톨로지 추론, 상태 관리, 브리핑 기반 메모리 생성
- `features/market_memory/memory.py`: 감사 리포트, 스토리 맵, 패밀리 제안, 상태 수동 업데이트 로직
- `features/market_memory/service.py`: LLM 기반 내러티브 정리와 서버 시작 시 Regime 추세 자동 갱신 스케줄링
- `features/market_memory/regime_v2.py`: Regime 근거 분류, momentum/confidence 계산, 변화 로그, thesis 연결
- `features/market_memory/prompt.md`: LLM 기반 시장 내러티브 정리 프롬프트
- `app.py`: `/api/memory`, `/api/memory/states`, `/api/memory/regime/refresh`, `/api/memory/states/{state_id}/evidence|changes|thesis-links` API와 브리핑 생성 후 자동 저장
- `public/index.html`, `public/app.js`, `public/styles.css`: 시장 내러티브 탭 UI

## 설계 원칙

- 원문 전문을 다시 저장하는 기능이 아니라 summary-first memory입니다.
- UI에 표시되는 summary는 원문 인용 저장소가 아니라 “이 이슈가 왜 시장 상태로 남는지”를 설명하는 요약이어야 합니다.
- 원문 근거는 `research-inbox/rss`, `research-inbox/articles`, 브리핑 참고자료 링크를 우선합니다.
- 상태는 “현재 투자자가 기억해야 하는 흐름”만 담고, 개별 기사 목록은 메모리 로그에 남깁니다.
- 상태는 모든 엔트리에서 자동 생성하지 않습니다. 최소 반복 근거가 있거나, 중요도가 높고 복수 출처가 있을 때 active/watch로 올립니다.
- 기존 분류값을 우선 재사용하고, 새 키는 최소 단위로 추가합니다.
- `brief` 메모는 기본적으로 상태를 만들지 않고, `issue` 메모만 상태 후보가 됩니다.
- LLM은 버튼을 눌렀을 때만 실행합니다. 컨텍스트는 후보 이슈 4개, 각 이슈당 상위 자료 2개, 최근 메모리/상태/패밀리의 압축본으로 제한합니다.
- LLM 출력은 JSON으로 파싱하고 허용된 enum과 필드 길이를 코드에서 다시 정규화한 뒤 저장합니다.
- Regime v2의 최종 `momentum`과 evidence `role`은 코드 enum으로 검증합니다. LLM 자유 텍스트로 결론을 확정하지 않습니다.
- Thesis/Obsidian 노트는 hypothesis입니다. Regime v2는 `linked_regimes`, ticker overlap 등을 연결 정보로만 쓰며 외부 evidence처럼 취급하지 않습니다.
- 기본 브리핑 markdown은 추세 갱신으로 변경하지 않습니다.
- 기업 분석의 공식자료 우선순위와 섞지 않습니다.

## RSS Short-Term Memory Intake

Market Memory can be updated from RSS/evidence before a briefing is generated. RSS items are first grouped into short-term digest items. Only repeated, source-diverse, market-relevant digest items are promoted into medium-term Market Memory entries.

This keeps the hierarchy explicit: RSS/evidence is short-term memory, Market Memory is medium-term memory, and reports consume both.

`run_rss_market_memory_update()`는 digest 반영 후 active/watch 상태의 규칙 기반 추세 갱신(`refresh_all_regimes`)까지 함께 실행한다. RSS 수집·Market Memory 자동화가 돌 때마다 momentum/confidence/근거 카운트가 자동으로 갱신되며, 화면에서 상태별 수동 갱신 버튼은 제공하지 않는다.

Market State Snapshot 생성 시에는 코드가 축별 점수로 강하게 선별하지 않는다. `build_market_state_context()`는 최신 RSS 후보를 넓게 압축한 `rssCandidates`(기본 최대 120개)를 LLM에 넘기고, 기존 축별 `shortTermDigest`는 탐색 보조 인덱스로만 제공한다. 중요한 드라이버 선택, 방향성 판단, 행동 가이드 작성은 LLM이 수행한다.

기존 Market Memory 상태(`existingStates`)는 보존해야 할 결론이 아니라 재검증할 중기 가설이다. LLM은 최신 `rssCandidates`가 기존 상태를 지지하는지, 약화시키는지, 변화시키는지, 또는 무효화하는지를 판단해야 하며 기존 요약을 재귀적으로 반복하지 않는다.

Market/macro context extension:

- `marketTape`: yfinance 기반 가격 흐름. 미국장은 S&P 500, Nasdaq, Dow, VIX, 10Y proxy, WTI, 달러 proxy를 우선하고, 한국장은 KOSPI, KOSDAQ, USD/KRW, MSCI Korea ETF를 우선한다.
- `macroSnapshot`: 공식 거시 데이터. 미국장은 FRED, 한국장은 BOK/ECOS를 주요 입력원으로 삼아 금리, 물가, 환율, 수출, 경기 흐름을 구조화한다. API key가 없거나 조회 실패 시에는 결측 사유를 context에 남긴다.
- yfinance/FRED/BOK 값은 LLM이 시장 판단을 작성하기 위한 structured evidence다. 코드는 freshness/staleness, provider, window, 단위, 결측 여부를 정리하고 검증하지만 시장 결론을 규칙으로 확정하지 않는다.
- `build_market_state_context()`는 `rssCandidates`, `shortTermDigest`, `existingStates`와 함께 `marketTape`, `macroSnapshot`을 LLM에 넘긴다. LLM은 이 값을 뉴스 기반 내러티브를 확인하거나 약화시키는 보조 근거로 사용한다.

## Market State Dashboard v3 (기본 화면)

시장 내러티브 탭의 기본 화면은 `GET /api/memory/state-dashboard`가 반환하는 **현재 중기 시장 상황** 하나다.

- 우선순위는 `market_state_snapshots`의 최신 LLM-authored `MarketStateSnapshot`이다. 스냅샷이 없거나 구버전 스냅샷이면 기존 `market_narrative_states` 기반 fallback을 쓰되, 이는 표시 호환용이며 시장 판단의 주 경로가 아니다.
- `POST /api/memory/state-snapshot`은 RSS 단기 digest와 기존 중기 상태를 Agent/LLM context pack으로 묶어 현재 시장 전체판단 스냅샷을 생성한다.
- `GET /api/memory/state-snapshot`은 최신 스냅샷을 반환한다.
- 화면용 판단은 LLM이 snapshot 안에 쓰는 `beginnerSummary`, `actionGuide`, 그리고 드라이버별 `directionLabel`/`marketImpact`/`nextMemoryCheck`를 우선 사용한다. 코드는 이 값을 검증하고 렌더링할 뿐, 정상 경로에서 시장 판단을 규칙으로 새로 만들지 않는다.
- Snapshot은 선택적으로 `marketViews.overall/us/kr`를 포함한다. 화면은 스냅샷에 시장별 view가 있으면 `종합 / 미국장 / 한국장` 세그먼트로 같은 `시장 해석`과 `판단 및 투자 행동` 구조를 전환한다.
- 상단은 요인 나열이 아니라 `시장 해석`과 `판단 및 투자 행동` 두 개의 큰 본문으로 구성한다. `시장 해석`에는 기존 source-grounded 요약을 보존하고, `판단 및 투자 행동`에는 결론, 행동 가이드, 다음 확인 항목을 묶어 보여준다.
- 드라이버 카드는 `도움/부담/변동성/중립` 같은 방향 칩과 짧은 판단 요약을 먼저 보여준다. 세부 근거는 카드 안 `근거 보기` 접기에 `근거 요약`, `시장 영향`, `다음 확인`만 간결하게 표시한다.
- Agent-authored 스냅샷에서는 반대 근거(`counterEvidence`), 불확실성(`uncertainties`), 사용 출처(`sourceRefs`)를 기본 화면 하단에 노출한다.
- `render_market_memory_context()`는 기존 context block을 유지한다. Agent Dock/Home 채팅, 브리핑 생성, 기업분석 생성은 이 block을 중기 시장 배경으로 읽으며, 화면 표시용 `beginnerSummary/actionGuide`와 혼동하지 않는다.
- 기업분석에서는 이 block을 회사 고유 사실의 evidence로 쓰지 않고, 시장 프레이밍/context로만 사용한다.
- 보고서 Reader의 Folio Note `AI 정리`는 `/api/agent/chat`을 통해 동작하므로 같은 Market Memory context block을 읽는다. Agent가 만든 초안은 바로 저장하지 않고 노트 본문에만 반영되며, 사용자가 확인 후 저장한다.
- taxonomy, story map, 패밀리 제안, audit, 내러티브 리포트, 개별 메모리 기록 목록은 기본 UI에서 제거되었고 API로만 접근한다(아래 API 목록 유지). 데이터 파이프라인과 유지보수 로직은 그대로 백엔드에서 동작한다.
- `시장 메모리 업데이트` 버튼은 기존 중기 내러티브 row 누적(`/api/memory/llm`)을 먼저 실행한 뒤 MarketStateSnapshot 생성(`/api/memory/state-snapshot`)을 이어서 실행한다. 생성 방식은 설정 탭의 AI Agent 정책을 따르며, 실행은 계속 사용자 트리거만 사용한다.

## FinancialTransactionAssistantAgent 월드 메모리와의 관계

이 기능은 FinancialTransactionAssistantAgent의 `world_memory_cli.py`에서 쓰는 철학을 참고·확장한 기능입니다.
원본 프로젝트의 전체 CLI를 복제하지는 않았지만, 현재 웹앱에는 다음 계층을 반영했습니다.

1. append-only 성격의 내러티브 메모리 로그
2. 현재 유효한 상태를 별도로 읽는 state 테이블
3. 기본 온톨로지와 dedupe key
4. taxonomy 사용량 추적
5. story link graph
6. family review suggestion
7. audit harness
8. narrative report view

## API

```text
GET /api/memory?limit=50
GET /api/memory/states?status=current&limit=20
GET /api/memory/taxonomy?type=story_family&limit=20
GET /api/memory/story-links?story=ai_semiconductor_supply_chain&limit=20
GET /api/memory/story-map?limit=80
GET /api/memory/suggestions?status=suggested&limit=20
GET /api/memory/audit?days=30
GET /api/memory/report?limit=8
GET /api/memory/state-dashboard?limit=5
GET /api/memory/state-snapshot
POST /api/memory
POST /api/memory/llm
POST /api/memory/state-snapshot
POST /api/memory/states/{state_id}
POST /api/memory/regime/refresh
GET /api/memory/states/{state_id}/evidence
GET /api/memory/states/{state_id}/changes
GET /api/memory/states/{state_id}/thesis-links
POST /api/memory/states/{state_id}/thesis-links
POST /api/memory/suggestions/{suggestion_id}
```

