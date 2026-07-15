# Folio OS Agent Instructions

> **Folio OS** — A Local Investment Research Workspace for Individual Investors
>
> 이 문서는 Folio OS를 맡는 AI/LLM 에이전트가 **가장 먼저, 끝까지** 읽어야 하는 최상위 작업 지침이다.
> 사용자용 설명은 [README.md](README.md), 기능별 세부 규칙은 `features/*/README.md`를 본다.
> `roadmap/`은 개인 개발용 로컬 계획 폴더이며 공개 저장소와 릴리즈 패키지에는 포함하지 않는다. 사용자가 로컬 roadmap 문서를 제공한 경우에만 참고한다.
>
> **동기화 지침**: `AGENTS.md`와 `CLAUDE.md`는 항상 동일한 본문을 유지한다. 한 파일을 수정하면 반드시 다른 파일도 같은 내용으로 업데이트한다.
>
> **명칭 메모**: 표시명/문서상 명칭과 기본 로컬 폴더명은 **Folio OS**다. 로컬 경로에 공백이 포함될 수 있으므로 경로를 다루는 스크립트와 명령에서는 반드시 따옴표로 감싼다.

---

## 0. 30초 요약

Folio OS는 개인 투자자가 **자기 PC에서** 돌리는 로컬 투자 리서치 워크스페이스다.
RSS·기사·리포트·공시·PDF를 모아 인덱싱하고, 매일 시장 브리핑·기업분석을 만들며, 일부 테마/딥리서치 런타임은 저장 보고서 호환을 위해 유지한다.
여기에 더해, 사용자가 Obsidian에 적어둔 **자기 생각(투자 thesis·메모)을 다시 읽어 최신 자료로 검증**하는
양방향 피드백 루프를 지향한다. 단, 사용자 생각이 보편 보고서를 오염시키지 않도록 **2계층으로 분리**한다.

기술 스택: Python 3 + FastAPI 백엔드(`app.py`), React/TypeScript SPA(`web/` → `public/react/folio-react.js`), 정적 bridge/assets(`public/`), SQLite/JSON 저장소,
선택적 LLM(OpenAI/Gemini/Claude). LLM 없이도 규칙 기반 fallback으로 동작해야 한다.

---

## 1. Folio OS란 — 2계층 모델

모든 산출물은 두 계층으로 나뉜다. 이 분리가 프로젝트의 척추다.

```text
Canonical Report   = 외부 자료 기반의 보편 1차 가공 보고서 (브리핑/기업분석/테마분석)
Personal Overlay   = Canonical을 사용자의 Obsidian 노트·포트폴리오·thesis와 연결한 개인용 해석 (별도 레이어)
```

데이터는 3계층 위계를 가지며 **절대 섞지 않는다**.

```text
외부 기사/공시/실적/리포트   = evidence            (객관적 근거)
Folio OS가 만든 보고서        = source-grounded      (근거 기반 분석)
사용자 Obsidian 노트          = hypothesis           (가설 — 근거가 아님)
```

핵심 흐름:

```text
Raw Data → Folio OS 1차 가공(Canonical) → Obsidian 2차 사고 → Folio OS가 다시 검증·연결(Personal Overlay)
```

---

## 2. 아키텍처 한눈에

```text
research-inbox/ (원천 자료)
      │  common/research_library/indexing → research-index.sqlite3 (문서 + FTS5 + 해시 임베딩 + file_manifest)
      ▼
  hybrid_search ──┬─→ daily_briefing      ─┐
                  ├─→ company_analysis     ├─→ Canonical Report (data/<종류>/{id}.json)
                  └─→ topic_report         ─┘         │
                                                      │  ← personal_overlay: Obsidian hypothesis와 대조
  market-memory.sqlite3 (내러티브/taxonomy/      ─────┤
   story-links/thesis·Regime·note_index)            ▼
                              obsidian/export / notion_export (Canonical 내보내기)
                                     ▲
                              obsidian/importer ← 사용자 2차 사고 회수 (frontmatter 타입별)
```

---

## 3. 핵심 디렉터리와 파일

```text
app.py                         # FastAPI 조립, 라우팅, 요청/응답 변환, 얇은 orchestration만
features/                      # 기능별 문서, 프롬프트, Python 런타임 코드 (실제 로직은 전부 여기)
features/common/               # 기능 간 공통 Python 코드와 Polars 계산 유틸
web/                           # React/TypeScript SPA 소스(AppShell, routes, feature screens)
public/index.html              # React SPA를 로드하는 최소 HTML entrypoint
public/app.js                  # React가 재사용하는 bridge-only helpers(Markdown/visual/source/Agent context)
public/react/folio-react.js    # Vite 빌드 산출물. web/src 변경 후 갱신 필요
public/styles.css              # UI 스타일
research-inbox/                # 사용자가 넣는 원천 자료 (개인 데이터)
data/                          # 앱 생성물: DB, 캐시, 저장 보고서, 포트폴리오 (개인 데이터)
config/                        # 회사 마스터/별칭 설정
.env                           # 로컬 API Key와 설정. 절대 출력하지 말 것
start.sh / start.ps1           # macOS·Linux / Windows 실행 스크립트
```

폴더 역할:

```text
features/          # 기능별 README, prompt, Python 런타임 코드
features/common/   # 공통 유틸, 공통 시장 데이터, Polars 기반 계산 보조
web/               # React SPA 소스. 화면 routing/navigation/Agent/readers/settings 소유
public/            # 정적 entrypoint, bridge-only JS, CSS, third-party visual wrapper, React build output
research-inbox/    # 사용자가 직접 넣거나 RSS가 수집한 원천 자료
data/              # 앱이 생성한 DB, 캐시, 저장 보고서, 포트폴리오 입력값
config/            # 사용자가 직접 보정할 수 있는 마스터/별칭 설정
```

Python 패키지명에는 하이픈을 쓸 수 없으므로 런타임 코드는 underscore 폴더를 사용한다.
예: `features/company_analysis`, `features/common/research_library/rss`, `features/common/research_library/indexing`.
새 import와 새 코드는 `features/` 기준으로 작성한다.

---

## 4. 저장소 모델 (반드시 따른다)

데이터 형태로 저장소를 가른다. 단일 저장소로 강제하지 않는다.

| 데이터 형태 | 저장소 | 예 |
|---|---|---|
| 1:1 보고서(문서형) | **JSON-per-report** | `data/briefings/{date}.json`, `data/company-analysis/{id}.json`, `data/topic-reports/{id}.json` |
| 대량 문서 + 검색 인덱스 | **`research-index.sqlite3`** | documents, FTS5, 해시 임베딩, file_manifest |
| 지식그래프(관계형·누적·질의) | **`market-memory.sqlite3`** | 내러티브 상태, taxonomy, story-links, thesis·Regime·note_index |
| 작은 싱글톤/캐시 | **JSON 파일** | portfolio.json, watchlist.json, *-settings.json, *-cache |

원칙: **문서 = JSON-per-report / 지식그래프 = SQLite.**
- Personal Overlay와 Topic Report v2 산출물(topicPlan·evidencePackSummary·sourceLedger·quality)은 해당 보고서 JSON 안의 필드로 넣는다.
- thesis·Regime·note 링크처럼 join·시계열·티커별 질의가 필요한 것은 새 SQLite 파일을 만들지 말고 **`market-memory.sqlite3`를 "knowledge graph DB"로 확장**한다(Regime↔thesis↔note를 한 DB에서 join).
- 반복적인 필터링/정렬/집계는 `features/common/dataframe_ops.py`의 Polars 유틸을 우선 사용한다.

---

## 5. 최상위 아키텍처 원칙 (절대 규칙과 동급)

1. **2계층 분리** — Canonical 보고서 본문(`markdown`)은 Personal Overlay 생성으로 **절대 바뀌지 않는다**. Overlay는 별도 필드/요청으로만 생성·저장한다.
2. **3계층 데이터 위계** — evidence / source-grounded / hypothesis를 섞지 않는다. 사용자 노트와 userContext는 근거가 아니라 가설·관심 방향이다.
3. **확증편향 방지** — Overlay·Thesis·Regime·Topic 산출물에는 `counterEvidence`/`contradictions`/`uncertainties`(또는 challenging evidence)를 항상 포함한다. 사용자 생각을 옹호하지 말고 검증한다.
4. **결론은 enum으로 통제** — verdict·momentum·report_type·evidenceRole 등 결론·분류는 코드에서 enum/길이/출처를 검증한다. LLM 자유 텍스트로 결론을 확정하지 않는다.
5. **자기참조 금지** — Folio OS가 Obsidian으로 내보낸 노트(`generated_by`, `source_layer: primary_processed`, `reuse_as_evidence: false`)를 다시 evidence로 쓰지 않는다.

---

## 6. 절대 규칙

1. `.env`의 실제 API Key를 출력, 요약, 문서화하지 않는다.
2. `data/`, `research-inbox/`, `config/`는 사용자 개인 자료와 생성물이 들어갈 수 있다. 명시 요청 없이 삭제, 초기화, 대량 이동하지 않는다.
3. RSS 저장 위치는 `research-inbox/rss/` 하나다. 예전 `archive/` 폴더를 다시 만들지 않는다.
4. WSJ, FT 등 유료 매체의 유료 본문 우회 수집을 구현하지 않는다. 공개 RSS, 공개 링크, 사용자가 직접 저장한 자료만 쓴다.
5. 브리핑은 `filings`와 `reports`를 직접 근거로 쓰지 않는다.
6. 기업 분석의 숫자는 SEC companyfacts를 최우선으로 한다.
7. 기업 분석의 공시 서술은 SEC 10-K HTML 문단 점수화 결과를 우선 사용하고, 실패 시 로컬 공식자료(10-K/10-Q/S-1/20-F/8-K/prospectus/proxy 등) 발췌를 보조 공식자료로 사용한다.
8. 보조 자료는 관련성 점수화 결과를 사용한다. 단순 검색 결과 앞부분을 LLM이나 규칙 엔진에 그대로 넣지 않는다.
9. 웹 검색은 로컬 자료를 대체하지 않는다. 부족한 지수/가격 반응/공식 자료를 보완하는 용도다.
10. 미국 상장사 식별은 SEC `company_tickers.json` 기반 CIK 조회를 우선하고, 수동 사전은 한국 종목/별칭/예외 보정에만 쓴다.
11. UI는 모바일 브라우저에서도 읽을 수 있어야 한다.
12. Markdown 렌더링 변경은 브리핑과 기업분석을 동시에 깨뜨릴 수 있으므로 React report reader가 호출하는 `public/app.js::renderMarkdown()` bridge 수정 시 주의한다.
13. `app.py`에 기능 로직을 추가하지 않는다. `app.py`에는 API endpoint, request body 정리, feature service 호출, HTTP 예외 변환만 둔다(§아래 app.py 경량화 규칙).

### app.py 경량화 규칙

`app.py`는 FastAPI 앱 조립, 라우팅, 요청/응답 변환, 아주 얇은 orchestration만 담당한다.

- 새 기능 코드는 반드시 `features/<feature_name>/` 또는 공통 코드인 경우 `features/common/` 아래에 둔다.
- 기능별 계산, 데이터 수집, 파일 파싱, LLM context 생성, 보고서 생성, 백테스트, 차트 데이터 생성 같은 로직은 feature service/module로 분리한다.
- 기존 `app.py`의 큰 함수나 긴 helper를 수정해야 한다면, 먼저 해당 기능 폴더로 옮긴 뒤 수정한다.
- 라우터가 필요하면 `features/<feature_name>/routes.py`, 서비스가 필요하면 `features/<feature_name>/service.py`를 만든다.
- 기능 간 공유 유틸은 특정 기능 폴더에 복사하지 말고 `features/common/`으로 올린다.
- 레거시 패키지를 되살리지 않는다. 새 런타임 코드는 `features/` 아래에 둔다.

---

## 7. 자료 폴더 계약

```text
research-inbox/articles/   # 직접 저장한 기사, 웹페이지, txt, md, html
research-inbox/rss/        # RSS 수집 결과. RSS 저장 위치는 오직 여기
research-inbox/reports/    # 기업분석용 증권사 리포트, IR 자료
research-inbox/filings/    # 기업분석용 SEC/DART 공시, 10-K/10-Q/S-1 등 로컬 공식자료
research-inbox/links/      # URL 목록
```

- 브리핑과 뉴스 검색 입력: `articles/rss`만 사용한다.
- 기업 분석 우선순위: `filings > reports > articles > rss > 기타`.

작업 상태/개인 데이터 저장 위치:

```text
data/jobs.json                 # 백그라운드 작업 상태 요약
data/portfolio.json            # 현재 보유 포지션
data/portfolio-presets.json    # 목표 포트폴리오 프리셋
data/portfolio-backtests/      # 저장된 백테스트 결과
data/briefings/                # 저장된 브리핑
data/company-analysis/         # 저장된 기업분석 보고서
data/topic-reports/            # 저장된 테마분석 보고서
data/obsidian-settings.json    # Obsidian Vault 경로
```

현재 active prompt 위치:

```text
features/daily_briefing/prompt.md
features/company_analysis/prompts/beginner.md
features/company_analysis/prompts/advanced.md
features/company_analysis/financial_quality_prompt.md
```

예전 최상위 `prompts/` 폴더는 사용하지 않는다. 새 프롬프트는 기능 폴더 아래에 둔다.
기업분석의 `features/company_analysis/prompt.md`는 legacy pointer이며 active prompt가 아니다.

---

## 8. 기능 카탈로그

### 구현됨 (runtime/API 또는 내부 기능)

| 기능 | 폴더 | 한 줄 | 계층 |
|---|---|---|---|
| 자료 라이브러리 | `common/research_library` | inbox 폴더 계약·RSS 수집·증분 인덱스·하이브리드 검색 토대 | — |
| 공통 Research Schema / Market Tape Lite | `common/research_schema`, `common/market_data/tape.py` | checkpoint/evidence/sourceLedger/dataGap/marketTape 공통 구조 | — |
| 일일 브리핑 | `daily_briefing` | 미/한 시장 일일 브리핑 | Canonical |
| 기업 분석 | `company_analysis` | SEC 숫자+10-K 기반 분석 | Canonical |
| 테마분석 (Topic Report v2) | `topic_report` | 투자 질문 해결기: Planner→Evidence Pack→유형별 템플릿→Quality Gate→Personal Overlay | Canonical + Personal Overlay |
| 포트폴리오 | `portfolio` | 보유·목표·백테스트 | — |
| 시장 내러티브 메모리 / Regime 추적 v2 | `market_memory` | 중기 내러티브 상태·taxonomy·momentum/confidence·thesis 연결 | source-grounded |
| 워치리스트 | `watchlist_notes` | 워치리스트·상세 모달(기업 정보/차트/수집 뉴스) | — |
| Native Investment Notes | `investment_notes` | Obsidian 없이 운용되는 Folio 로컬 투자 노트와 `native_note_index` | hypothesis 입력 |
| LLM/설정/웹검색 | `llm_settings` | API Key·웹검색 보완 | — |
| Notion 내보내기 | `notion_export` | 보고서 → Notion DB | — |
| Obsidian 연동 | `obsidian` | 보고서/내러티브 → Vault, 사용자 노트 회수, thesis/memo/review 템플릿·검사 | hypothesis 입력 |
| Personal Overlay | `personal_overlay` | Canonical을 사용자 노트와 대조한 개인 해석 (브리핑/기업분석) | Personal Overlay |
| Thesis Tracking | `thesis_tracking` | 기업 thesis의 강화/유지/약화/이탈 추적 | Personal Overlay |
| Research Quality | `common/research_quality` | 산출물 공통 품질 평가: sourceGrounding·risk·coverage | source-grounded |
| Quality Generation | `common/quality_generation` | 생성 품질 목표·자료 루트·preflight·evidence coverage·생성 후 평가·약한 섹션 LLM 개선·telemetry | source-grounded |
| AI Agent Mode | `agent_mode` | Codex/Claude/Antigravity CLI용 context pack·Direct Bridge·기존 저장소 writeback + 도크 Agent 채팅(`/api/agent/chat`)·수정 제안 diff 승인 writeback(`/api/agent/proposals/{id}`) | source-grounded + Personal Overlay |
| 투자 리뷰 | `investment_review` | regime/thesis/portfolio/checkpoints/obsidian을 묶은 투자 리뷰 홈 | Personal Overlay |
| 현재 시장 위젯 | `market_widgets` | TradingView 기반 대시보드 Current Market 위젯 설정·허용 카탈로그 | — |
| Data Source Reliability | `common/data_reliability` | 공식자료 우선순위·provider status·한국 데이터 보강 경로·Thesis evidence 확장 | source-grounded |
| 프론트엔드 UI | `frontend_ui` | React SPA(`web/`)가 기본 프론트엔드. `public/app.js`는 bridge-only, `public/index.html`은 최소 entrypoint | — |

0.1 기본 사용자 화면에서의 노출 상태:

- **보이는 핵심 화면**: Home/AI Agent, Briefing, RSS Feed, Market Memory, Company Analysis, Settings.
- **보이는 보조 기능**: 보고서 reader의 Folio Note, Obsidian/Notion 내보내기, Agent Dock/Ask Agent/제안 승인 흐름.
- **숨김/축소 유지**: Deep Research/Topic Report, Dashboard, Watchlist route와 저장소는 기존 저장 보고서·딥링크 호환을 위해 유지하지만 0.1 기본 nav/Home/command palette에는 노출하지 않는다. Portfolio, Thesis Tracking, Personal Overlay, Investment Review, 고급 Investment Notes는 런타임/API 또는 내부 기반은 남아 있으나 0.1 제품 표면에서는 전면 기능으로 설명하지 않는다.
- **문서 원칙**: 사용자용 README는 0.1에서 실제로 보이는 기능만 현재 기능으로 설명한다. 숨김/축소 기능은 개발자 문서나 0.2+ 로드맵에서 다룬다.

### 설계 확정·구현 예정

| 작업 | 계획 위치 | 범위 |
|---|---|---|
| 0.1 공개 릴리즈 | 로컬 `roadmap/` 문서가 있을 때만 참고 | Home/Agent, Briefing, RSS, Market Memory v3, Company Analysis v2, Agent-assisted Investment Notes v2, Settings/Automation 간소화, release QA |
| 0.2+ 제품 로드맵 | 로컬 `roadmap/` 문서가 있을 때만 참고 | Deep Research Agent workspace, Smart Collections, Agent work log, note/thesis intelligence, dark mode, portfolio/watchlist 재평가, Agent infrastructure hardening |
| AI Agent Mode hardening | 로컬 `roadmap/` 문서가 있을 때만 참고 | CLI/API bridge preflight, Direct Bridge 안정화, proposal writeback, job lifecycle, restart recovery, context/log retention |

> 개선안 01~04(Personal Overlay / Thesis Tracker / Regime 추적 v2 / Topic Report v2)와 post-v1 Step 6~11은 구현되어 위 표로 승격되었다.

---

## 9. 기능별 문서

작업 전에 [features 인덱스](features/README.md)를 보고, 관련 기능 README를 먼저 읽는다.

- [기능 폴더 인덱스](features/README.md)
- [자료 수집/RSS/인덱싱/검색](features/common/research_library/README.md)
- [일일 브리핑](features/daily_briefing/README.md)
- [기업 분석](features/company_analysis/README.md)
- [포트폴리오](features/portfolio/README.md)
- [LLM/설정/Web Search](features/llm_settings/README.md)
- [Notion 내보내기](features/notion_export/README.md)
- [Obsidian 연동](features/obsidian/README.md)
- [테마분석 보고서](features/topic_report/README.md)
- [프론트엔드 UI](features/frontend_ui/README.md)
- [워치리스트/메모](features/watchlist_notes/README.md)
- [Native Investment Notes](features/investment_notes/README.md)
- [시장 내러티브 메모리](features/market_memory/README.md)
- [Personal Overlay](features/personal_overlay/README.md)
- [Thesis Tracking](features/thesis_tracking/README.md)
- [Research Quality](features/common/research_quality/README.md)
- [Quality Generation](features/common/quality_generation/README.md)
- [AI Agent Mode](features/agent_mode/README.md)
- [투자 리뷰](features/investment_review/README.md)
- [Data Source Reliability](features/common/data_reliability/README.md)

---

## 10. 주요 기능 경계 (구현 디테일)

### 서버 재시작

- 웹 UI 상단의 `서버 재시작` 버튼은 `POST /api/server/restart`를 호출한다.
- `schedule_server_restart()`는 0.5초 후 `os._exit(3)`으로 프로세스를 종료한다. **종료 코드 3이 재시작 신호**다.
- `start.ps1`과 `start.sh`는 종료 코드 3이면 루프를 돌며 `py -3 app.py`(또는 Python 경로)를 재실행한다. 다른 종료 코드면 루프가 끝난다.
- `start-archive.cmd`나 `start.ps1` / `start.sh`로 실행 중일 때만 재시작이 자동으로 동작한다. 터미널에서 `py -3 app.py`를 직접 실행 중이면 서버가 종료만 된다.
- `_RESTART_REQUESTED` 플래그로 동시에 여러 재시작 요청이 들어와도 한 번만 실행한다.
- 재시작 후 `load_jobs()`는 `data/jobs.json`에서 `queued`/`running` 상태인 작업을 `failed`로 변환한다(좀비 잡 방지).

### 백그라운드 작업과 증분 인덱싱

- `/api/index`와 `/api/rssarchive/import`는 오래 걸리는 작업을 직접 응답하지 않고 job을 생성한다.
- 작업 상태는 `/api/jobs/{job_id}`에서 조회한다.
- 프론트는 상단 `#status`와 진행률 바에 job 상태를 표시한다.
- `build_index(incremental=True)`는 `research-index.sqlite3`의 `file_manifest` 테이블을 사용해 파일 크기/수정시각이 변하지 않은 자료를 건너뛴다.
- market-relevant 문서는 SQLite `documents` 테이블에 저장하고, 관련 없는 파일도 `file_manifest`에 저장해 다음 인덱싱 때 재처리하지 않는다.
- `data/index.json`은 더 이상 문서 목록이나 파일 매니페스트를 포함하지 않으며, `generatedAt`, `count`, `incremental`, `sqlite` 같은 상태 요약만 저장한다.
- SQLite/FTS 동기화는 `contentHash`가 같은 문서의 chunk embedding 재생성을 건너뛴다.
- job 결과에는 전체 `documents`를 저장하지 않는다. `count`, `generatedAt`, `incremental`, `sqlite` 같은 요약만 저장한다.

### 하이브리드 검색

- 텍스트 쿼리가 있으면 `hybrid_search()`가 유일한 랭킹 경로다. in-memory 키워드 스캔은 사용하지 않는다.
- 2단계: FTS5 BM25로 최대 120개 청크 후보 추출 → 후보에 한해 해시 임베딩 코사인 유사도 계산 (전체 스캔 없음).
- RRF(k=60)로 FTS 랭크와 벡터 랭크를 합산하고, 토큰 겹침은 타이브레이커로만 쓴다.
- 문서 단위 중복 제거: 같은 문서의 여러 청크 중 점수가 가장 높은 청크를 대표 스니펫으로 반환한다.
- 쿼리 없는 회사/범위 필터는 in-memory 문서 목록을 그대로 사용한다.
- `sanitize_fts_query()`가 특수문자를 이스케이프하고 토큰을 OR로 연결해 FTS5 에러를 방지한다.

### RSS와 뉴스 검색 (Evidence Intake)

- 수집은 RSS 단독이 아니라 Folio OS Evidence Intake 경로다. 최종 단위는 `IntakeEvidenceItem`이고 RSS는 `collector=rss` 입력원 중 하나다.
- 모듈 경계(단방향 DAG): `rss_archive.py`(얇은 CLI/orchestration) → `fetch.py`(HTTP retry/backoff) → `parser.py`(RSS/Atom→raw item) → `article.py`(본문/요약 추출) → `relevance.py`(시장 관련성 게이트) → `normalizer.py`(raw→EvidenceItem) → `policy.py`(dedupe/retry/relevance score/full-text/paywall) → `collectors.py`(official adapter) → `writer.py`(YAML front matter Markdown 아카이브 IO + state) → `store.py`(`research-index.sqlite3::evidence_items`). `rss_archive.py`에는 run-level orchestration만 둔다(parse/fetch/write 로직 추가 금지).
- 설정 파일로 분리: `config/rss_feeds.yaml`, `config/evidence_sources.yaml`. 코드 수정 없이 feed enable/disable이 가능하다.
- 신규 Markdown은 YAML front matter(`collector`/`source_type`/`normalized_url`/`collection_status`/`reliability_tier`/`query` 등) + body section 포맷이다. legacy line-oriented Markdown은 읽기 호환을 유지한다.
- CLI 기본 실행은 기사 전문을 저장하지 않는다. `--save-full-text` 명시 시에만 `Full Text` 섹션에 전문을 쓴다. 웹 앱이 실행하는 수집(RSS 수집 버튼/자동화)은 설정 탭의 `rss.saveFullText`(automation-settings, 기본 켜짐)에 따라 이 플래그를 전달한다. 유료 본문 우회는 금지한다.
- paywall 판정은 게이트 문구("구독 후 이용", "subscribe to continue" 등) 기준이다. 한국 뉴스 푸터의 "구독"/"로그인" 단어만으로 유료벽 판정하지 않으며, 충분한 공개 본문이 추출되면 페이지 내 구독 배너가 full_text 판정을 막지 않는다. `news.google.com` 리다이렉트 링크는 기사 HTML을 가져오지 않고 RSS 요약을 유지한 `summary_only`로 저장한다(aggregator 페이지 요약으로 덮어쓰기 금지). 기사 페이지 요청은 표준 브라우저 UA를 사용한다.
- normalized URL 기준 dedupe를 사용한다. `summary_only`/`needs_manual_save`/`legacy_rss`/`fetch_failed`는 기본적으로 반복 재수집하지 않는다(`--retry-failed`/`--retry-summary-only`로만).
- 공식자료(SEC/OpenDART/FRED/BOK)는 `source_type=official_filing|macro_data|official_release`, `reliability_tier=1`로 구분한다. 현재 adapter는 fake data 없는 stub이며 브리핑 직접 근거로 쓰지 않는다.
- 외부 검색 API 기반 추가 수집은 사용하지 않는다. RSS 수집 버튼(`/api/rssarchive/import`)은 RSS collector만 실행한다.
- RSS API: `app.py::rss_feed_payload()`, `rss_merge_payload()`. import 경로는 `service.py::import_rssarchive()`.
- 화면: RSS 피드 탭. 한 페이지 20개 표시. 시간, 소스, 시장 필터를 제공한다.
- RSS 피드 목록은 Markdown 파일 전체를 매 요청마다 읽지 않고 `data/research-index.sqlite3`의 `rss_feed_items` 캐시 테이블에서 `LIMIT/OFFSET`으로 읽는다. 캐시는 파일 `mtime_ns`/크기 기준으로 증분 갱신하며 기본 TTL은 `RSS_CACHE_REFRESH_TTL_SECONDS=30`초다. RSS 수집 직후에는 강제 갱신한다. 캐시는 각 항목의 `markets` 태그를 `US`, `KR`, `GLOBAL`, `UNKNOWN` 중 하나 이상으로 저장하며, `/api/rss/items`와 `/api/rss/merge`는 `market=US|KR|GLOBAL|UNKNOWN` 필터를 지원한다.
- 인덱싱은 front matter metadata(`collector`/`sourceType`/`reliabilityTier`/`query`/`relatedTickers`/`narrativeIds` 등)를 문서/chunk metadata로 보존해 briefing/topic/market_memory 소비자가 읽을 수 있게 한다. 단, 브리핑 입력 범위는 계속 `articles/rss` 원칙을 지킨다.
- 별도 뉴스 검색 탭은 없다. RSS 피드 탭 안에서 `articles/rss` 자료를 검색한다.

### 일일 브리핑

- 브리핑 입력은 `articles/rss`만 사용한다.
- 저장 JSON에는 Step 6 공통 구조 필드 `checkpoints`, `dataGaps`, `marketTape`를 포함한다. 이 필드는 대시보드/품질 평가용이며 기본 `markdown`을 바꾸지 않는다.
- 생성 당시 가격 시계열은 보고서 JSON `visualSnapshots`, 히트맵 상세 rows는 `data/briefings/{date}.visuals.json`에 저장한다. 화면은 Lightweight Charts 5.2.0(가격)과 Plotly(히트맵)로 이 immutable snapshot을 렌더링한다. `GET /api/briefings/{date}/visuals`는 사이드카 조회만 하며 현재 데이터를 섞지 않는다.
- Lightweight Charts의 `layout.attributionLogo`와 사용자 화면의 TradingView 링크·copyright, `THIRD_PARTY_NOTICES.md`를 제거하지 않는다.
- `GET /api/briefings/{date}/visuals/current`는 저장 snapshot의 종목 universe만 최신 일봉으로 재조회하는 read-only 경로다. current payload를 보고서 JSON이나 `.visuals.json`에 merge/write하지 않는다. yfinance 일봉은 실시간 체결가가 아니므로 `snapshot/delayed/stale/unavailable`과 장 상태를 명시한다.
- 한국시간 기준 날짜 `D` 브리핑은 미국장 `D-1` 마감과 한국장 `D-1` 결과 및 `D` 개장/장중을 구분해야 한다.
- 한국장 핵심 수치는 `features/common/market_data/providers.py`의 provider 체인을 사용한다. `pykrx` 기반 KRX 수치를 우선하고 실패하면 yfinance/기사 기반 fallback을 사용하되, KOSPI/KOSDAQ 종가 등락률이 없으면 추정하지 말고 한계를 명시한다.
- LLM 실패 시 규칙 기반 브리핑이 필요하다. 참고자료 섹션은 유지한다.
- `select_briefing_docs()`의 fallback 경로에서 `market_windows`는 브리핑 날짜 기준 원본을 유지한다. 문서 날짜로 재계산하면 공휴일/주말에 `krPreviousSessionDate`가 틀린 날짜를 가리키는 버그가 발생한다.

### 기업 분석

- 입력은 `build_company_analysis_materials()`에서 구성한다.
- SEC companyfacts, SEC 10-K HTML 상위 문단, 로컬 공식자료 fallback, 점수화된 보조 자료 순서다.
- LLM 버전과 규칙 기반 버전 모두 같은 선별 결과를 사용해야 한다.
- 기업분석은 `analysisStyle=beginner|advanced`를 지원한다. 두 모드는 서로 다른 완전한 prompt 파일을 사용하지만 같은 9개 섹션 골격, 자료 우선순위, no-fabrication, data gap 규칙을 유지해야 한다.
- 제공 자료가 부족하면 먼저 `features/company_analysis/data_gap_resolver.py`로 확인 경로와 미해결 항목을 구조화하고, 보고서 JSON에는 `dataGaps`와 `resolutionAttempts`를 보존한다.
- 보고서는 생성 시 `data/company-analysis/`에 **자동 저장**된다(`api_analyze`가 `save_analysis_report` 호출). 보고서 id는 `ticker:날짜` 기준이라 같은 기업을 같은 날 재분석하면 최신본으로 덮어쓴다(파일 무한 누적 방지). 덮어쓸 때 기존 `personalOverlay`는 보존한다.
- 영어 10-K 원문은 규칙 기반 보고서에서 그대로 나올 수 있다. 번역은 브라우저 번역이나 LLM 버전에 맡긴다.

### 테마분석 (Topic Report v2)

- 파이프라인: Topic Planner → Evidence Pack → report_type 템플릿 결합 → LLM/규칙 보고서 → Quality Gate → (선택) Personal Overlay.
- 저장 JSON에는 `checkpoints`, `evidenceItems`, `sourceLedger`, `dataGaps`, `marketTape`를 공통 schema 형태로 포함한다. 구조화 필드 생성은 기본 `markdown`을 수정하지 않는다.
- `reportType`(12종)·`evidenceRole`(5종)은 `topic_schema.py`에서 enum 검증한다. LLM 자유 텍스트 분류를 그대로 신뢰하지 않는다.
- custom 주제는 planner가 `searchQueries`/분석 축/후보 티커를 만든다. 기존 `label.split()` 검색은 폐기. 프리셋은 `plan_from_preset`으로 backward compatible.
- `userContext`는 관심 방향이지 evidence가 아니다. 외부 자료와 충돌하면 충돌을 명시하고 반대 근거를 함께 제시한다.
- Quality Gate(`evaluation.py`)는 규칙 기반이다. markdown 섹션 존재 + Evidence Pack 커버리지로 점수/등급/경고를 만든다. LLM 없이 동작한다.
- Personal Overlay와 Quality 재평가는 **저장된 보고서에만** 동작한다(파일 기준). overlay 생성은 기본 `markdown`을 수정하지 않는다(Step 2 `with_overlay` 재사용).
- 보고서는 생성 시 `data/topic-reports/`에 **자동 저장**된다(`api_generate_topic_report`가 `save_topic_report` 호출). id는 `날짜:topicKey:라벨` 기준이라 같은 주제를 같은 날 재생성하면 최신본으로 덮어쓴다. 덮어쓸 때 기존 `personalOverlay`는 보존한다. 저장 JSON에 `topicPlan`/`evidencePackSummary`/`sourceLedger`/`quality`/`personalOverlay`를 함께 둔다.
- LLM이 없어도 규칙 fallback이 리서치 계획 요약·데이터 부족 경고·체크포인트·Source & Data Notes를 포함한 보고서를 만든다.

### 포트폴리오

- 현재 범위는 사용자가 직접 입력한 보유 포지션 분석, 목표 프리셋, 리서치용 백테스트다.
- 저장 위치는 `data/portfolio.json`이다. 개인 입력 데이터이므로 명시 요청 없이 삭제하거나 초기화하지 않는다.
- 목표 프리셋은 `data/portfolio-presets.json`, 백테스트 결과는 `data/portfolio-backtests/`에 저장한다.
- 현재가, 종목명, 섹터, 자산군, 시장, 통화는 `yfinance` 조회 결과를 우선 사용한다. `quoteError`가 있어도 화면이 깨지지 않아야 한다.
- KRW 자산과 USD 자산이 섞이면 USD 기준 비중 계산을 위해 환율을 반영한다.
- 목표 포트폴리오 비교는 현재 비중, 목표 비중, 비중 차이, 금액 차이, 매수/매도 필요 수량을 보여준다.
- 백테스트는 리서치용이다. yfinance 과거 가격과 일자별 환율을 사용하며, 실제 세금/수수료/체결오차/배당 처리에는 한계가 있다.
- 백테스트 실행 결과는 자동 저장하지 않는다. 사용자가 결과 카드의 저장 버튼을 눌렀을 때만 저장한다.
- 거래 내역 기반 원가 계산, 배당 현금흐름, 자동 리밸런싱 제안은 아직 범위 밖이다.

### Obsidian 내보내기

- 브리핑, 기업분석, 테마분석(Topic Report), 시장 내러티브(active/watch)를 로컬 Obsidian Vault의 Markdown 노트로 내보낸다.
- 테마분석은 `Topic Reports/` 폴더로 내보내며 frontmatter에 `report_type`, `quality_score`, 그리고 자기참조 방지 마커(`generated_by`/`source_layer: primary_processed`/`reuse_as_evidence: false`)를 붙인다.
- Vault 경로는 `data/obsidian-settings.json`에 저장한다. 사용자 설정 파일이므로 명시 요청 없이 삭제하지 않는다.
- 내보내기 로직은 `features/obsidian/export/`에 있다. `app.py`에는 엔드포인트만 둔다.
- 태그는 Obsidian이 공백을 허용하지 않으므로 `normalize_tag()` 후 공백을 언더스코어(`_`)로 변환한다.
- `config/company_master.json`은 최상위가 배열이 아니라 `{"companies": [...]}` 구조다. 직접 iterate하지 말고 `.get("companies", [])`로 접근한다.
- `## 사용자 메모` 구분자 이하 내용은 재내보내기 시 보존한다.
- 회사명·별칭을 `[[wikilink]]`로 자동 변환한다. 길이 역순으로 처리해 부분 매칭을 방지한다.
- **자기참조 주의(Folio OS 원칙 5)**: 내보내는 노트에는 `generated_by`, `source_layer: primary_processed`, `reuse_as_evidence: false`를 붙여, 향후 Obsidian importer가 이를 evidence로 재사용하지 않도록 한다.

### Notion 내보내기

- 브리핑, 기업분석, 테마분석 보고서를 Notion 데이터베이스 페이지로 내보낸다.
- `NOTION_TOKEN`과 `NOTION_DB_ID`는 `.env`에 저장하고, 설정 탭 UI에서 입력할 수 있다.
- Notion 데이터베이스는 이름(title), 날짜(date), 유형(select), 주제(rich_text) 속성으로 구성한다.
- 내보내기 로직은 `features/notion_export/`에 있다. `app.py`에는 엔드포인트만 둔다.
- Markdown → Notion 블록 변환은 `features/notion_export/client.py::markdown_to_blocks()`가 담당한다.
- 100개 초과 블록은 PATCH로 분할 추가한다.
- 인라인 데이터베이스를 사용하는 경우 데이터베이스가 있는 상위 페이지에 통합을 공유해야 한다.
- `NOTION_TOKEN` 실제 값을 로그, 응답, 문서에 출력하지 않는다.

### 시장 내러티브 메모리

- 브리핑 생성 시 주요 흐름을 중기 내러티브로 누적한다.
- 최소 온톨로지와 상태(`active/watch/resolved/overridden`)를 유지한다.
- taxonomy 테이블로 category, region, importance, entry_mode, story, family, relation, tag, industry, ticker, subject, subject_type, event_kind, state_key, net_effect 사용량을 추적한다.
- story link graph로 개별 branch가 어떤 큰 family에서 분기되는지 기록한다.
- `AI 반도체 공급망`, `AI 데이터센터 전력 병목`, `금리·달러 유동성`, `중동 에너지 리스크`처럼 큰 story family를 우선 재사용한다.
- 모든 이슈를 바로 현재 상태로 올리지 않는다. `issue` 메모 중 반복 근거가 있거나, 중요도가 높고 복수 출처가 있을 때만 active/watch 상태 후보가 된다.
- 시장 내러티브 탭의 기본 UI는 Market State Dashboard v3(`GET /api/memory/state-dashboard`) 하나다. 상단은 `시장 해석`과 `판단 및 투자 행동` 두 개의 큰 본문으로 보여주고, 스냅샷에 `marketViews.overall/us/kr`가 있으면 `종합 / 미국장 / 한국장` 세그먼트로 전환한다. 드라이버 카드는 짧은 판단 요약과 방향 칩만 먼저 보여준다. 세부 근거는 카드 안 `근거 보기` 접기에 `근거 요약`, `시장 영향`, `다음 확인`만 간결하게 표시한다. taxonomy·story map·audit·패밀리 제안·개별 기록 목록 UI는 제거되었고 API로만 접근한다.
- Market State Snapshot context는 `rssCandidates`, `shortTermDigest`, `existingStates`에 더해 yfinance 기반 `marketTape`와 FRED/BOK ECOS 기반 `macroSnapshot`을 포함할 수 있다. 이 값은 LLM이 시장 판단을 작성하기 위한 structured evidence이며, 코드는 provider/freshness/결측을 정리할 뿐 시장 결론을 규칙으로 확정하지 않는다.
- audit, story-map, family-review, narrative-report는 API로 유지되므로 품질 저하나 잘못 묶인 패밀리는 API 응답으로 점검한다.
- active/watch 상태의 추세·근거 카운트 갱신은 `run_rss_market_memory_update()`가 규칙 기반 `refresh_all_regimes`로 자동 수행한다(RSS/Market Memory 자동화 실행 시 포함). 화면에는 상태별 수동 갱신 버튼이 없다.
- LLM 기반 정리는 사용자가 `시장 메모리 업데이트` 버튼을 눌렀을 때만 실행한다. 이 버튼은 `/api/memory/llm`으로 기존 중기 내러티브 row를 누적한 뒤 `/api/memory/state-snapshot`으로 화면용 현재 시장 상태 스냅샷을 이어 생성한다. 자동 브리핑 생성 과정에서는 규칙 기반 후보 저장을 유지한다.
- LLM에는 전체 원문을 보내지 말고 후보 이슈, 상위 자료 요약, 기존 memory/state/taxonomy/story-links의 압축본만 보낸다.
- LLM 결과는 JSON으로 받고, 코드에서 enum/길이/출처를 검증한 뒤 `upsert_memory()`로 저장한다.
- 기사 링크 나열이 아니라 요약, 중요성, 포트폴리오 연결, 체크포인트 중심이어야 한다.
- Regime 추적 v2는 위 상태에 momentum/confidence/evidence window/thesis 연결을 더한다.
- Regime 추세 갱신은 `next_checkpoints_json`과 `falsification_triggers_json`을 채워 Step 8 대시보드가 구조화 checkpoint를 읽을 수 있게 한다.
- `momentum` enum은 `strengthening/stable/fading/turning/conflicted`, evidence role은 `supporting/challenging/neutral`만 허용한다.
- Regime 근거는 기존 `market_memory` 엔트리를 상태별로 분류해 `market_regime_evidence`에 저장하고, 변화는 `market_regime_changes`에 남긴다.
- Thesis/Obsidian 노트는 hypothesis다. `linked_regimes`, ticker overlap 등은 `market_regime_thesis_links` 연결 정보로만 쓰며 evidence로 승격하지 않는다.
- 기존 active/watch/resolved 호환성과 기본 브리핑 markdown 불변을 최우선으로 유지한다.

### 공통 Research Schema / Market Tape Lite

- 공통 구조는 `features/common/research_schema/`에 둔다: `checkpoints.py`, `evidence.py`, `source_ledger.py`, `data_gaps.py`, `service.py`.
- 시장 수치 freshness/status 정규화는 `features/common/market_data/tape.py`에 둔다. Step 6에서는 새 provider를 추가하지 않고 기존 snapshot/provider 산출물을 감싼다.
- read API는 `/api/research-data/checkpoints|evidence|source-ledger|data-gaps|market-tape`를 사용한다.
- `user_note` evidence type은 hypothesis 연결용일 뿐 evidence 집계에서 제외한다.
- 구조화 필드는 항상 보고서 JSON의 별도 필드로 저장하고 Canonical markdown은 바꾸지 않는다.

### Research Quality

- 공통 품질 평가는 `features/common/research_quality/`에 둔다. `features/topic_report/evaluation.py`는 호환 wrapper로 유지한다.
- 평가 입력은 Step 6의 `checkpoints`, `evidenceItems`, `sourceLedger`, `dataGaps`, `marketTape`를 우선 읽는다.
- `sourceGrounding`, `hallucinationRisk`, `personalBiasRisk`는 규칙 기반으로 계산하고 LLM 자유 텍스트를 신뢰하지 않는다.
- `user_note`는 hypothesis이며 source grounding의 evidence count에 포함하지 않는다.
- 평가 결과는 artifact의 별도 `quality` 필드에 저장한다. Canonical markdown은 품질 평가로 수정하지 않는다.
- API는 `/api/research-quality/evaluate`, `/api/research-quality/{artifact_type}/{artifact_id}`, `/api/research-quality/recheck/{artifact_type}/{artifact_id}`를 사용한다.

### Quality Generation

- 로직은 `features/common/quality_generation/`에 둔다. 생성 품질 목표/자료 수집 루트, 생성 전 preflight, prompt/rule hints, 생성 후 `research_quality` 평가, 제한적 repair loop를 담당한다.
- 브리핑/기업분석/테마보고서 생성 컨텍스트에는 보고서 유형별 품질 목표(`quality_targets.py`)를 먼저 주입한다. 최소 근거, 필요한 evidence mix, 자료 보강 루트, 필수 산출 요소가 생성 전부터 반영되어야 한다.
- 내부 `qualityMode` 호환 값은 `diagnose_only`(기본), `llm_section_improve`, `strict`만 허용한다. 레거시 `improve_once` 요청은 `llm_section_improve`로 매핑한다. 기존 생성 API는 기본값이 `diagnose_only`라 기존 동작을 깨지 않는다.
- 0.1 웹 UI에서는 품질 모드를 사용자 선택 항목으로 노출하지 않는다. 기본 생성은 자동 품질 진단(`diagnose_only`)으로 처리하고, 섹션 개선 모드는 내부/API 호환 경로로만 남긴다.
- `llm_section_improve`와 `strict`는 약한 섹션 LLM 개선을 최대 1회로 제한한다. 반복 재작성 루프를 만들지 않는다.
- 섹션 개선은 현재 artifact의 `sourceLedger`, `evidenceItems`, `checkpoints`, `dataGaps`, `marketTape` 범위 안에서만 한계·반론·확인 경로·Source & Data Notes를 보강한다. 새 수치나 새 출처를 만들어내지 않는다.
- 결과는 보고서 JSON의 별도 `qualityGeneration` 필드에 저장한다. `qualityBefore`/`qualityAfter`/`repairApplied`/`repairCount`/`repairType`/`weakSectionsBefore`/`weakSectionsAfter`/`telemetry`/`preflight`/`warnings`를 포함하며, Canonical markdown은 품질 진단만으로 바꾸지 않는다.
- 사용자 Obsidian 노트는 계속 hypothesis다. preflight나 repair에서 evidence count/source grounding으로 승격하지 않는다.
- API는 `/api/quality-generation/preflight`, `/api/quality-generation/repair`, `/api/quality-generation/run`을 사용한다.

### 투자 리뷰 (Investment Review)

- 로직은 `features/investment_review/`에 둔다. **Personal Overlay 계층**이다 — Canonical 보고서를 수정하지 않고 별도 리뷰 객체/캐시로만 만든다.
- regime_v2(`list_states`)·thesis(`list_theses`+`latest_delta`)·portfolio·watchlist·Step 6 checkpoints(`checkpoints_from_*`)·obsidian `note_index`를 한 리뷰로 집계한다. 집계는 주입식 순수 함수로 분리해 DB 없이 테스트한다.
- **LLM 없이 규칙 기반**으로 생성한다. 데이터가 없으면 빈 섹션 + warning(원문 불변).
- 일 1회 생성 후 `data/investment-review/{date}.json`에 캐시한다. 해당 날짜 저장본이 없으면 최신 저장본 + `stale` 표시. `forceRefresh`로 재생성한다.
- 포트폴리오 영향(impact: positive/watch/neutral)은 투자 판단 보조이며 **매수/매도 지시가 아니다**. keyCheckpoints는 Step 6 구조화 checkpoint를 쓴다.
- API는 `/api/investment-review`, `/api/investment-review/generate`, `/api/investment-review/{date}`를 사용한다.

### Data Source Reliability

- 로직은 `features/common/data_reliability/`에 둔다. 공식자료 우선순위, source reliability, provider status, 한국 market-data CSV 보강 경로를 담당한다.
- 기업분석/Thesis Delta source priority는 `SEC/DART filings > companyfacts/XBRL > 10-K/10-Q 문단 > IR/실적자료 > 리포트 > 기사 > RSS` 순서를 따른다.
- Thesis Delta는 기존 로컬 뉴스 evidence에 `company_analysis materials` 기반 SEC companyfacts/DART, SEC 10-K/10-Q 상위 문단, 로컬 filings/reports evidence를 보강한다.
- 한국 데이터 보강 MVP 경로는 `research-inbox/market-data/krx_foreign_flows.csv`, `sector_performance.csv`, `bok_macro.csv`다. 자동 연동이 부족하면 `dataGaps.suggestedAction`으로 이 경로를 안내한다.
- provider status는 `ok/degraded/failed/unknown`으로 기록하며, Market Tape에는 `providerStatus` 요약이 포함된다. API는 `/api/data-reliability/provider-status`, `/api/data-reliability/market-data-files`를 사용한다.
- 사용자 노트는 계속 hypothesis이며 source reliability나 evidence count에 포함하지 않는다.

### Obsidian Workflow

- 로직은 `features/obsidian/workflow/`에 둔다. 기존 `features/obsidian/export/`의 Vault 설정을 재사용하고 새 설정 파일을 만들지 않는다.
- UI/API는 `company_thesis`, `market_memo`, `topic_review` 템플릿 노트를 생성할 수 있다. 이미 같은 파일이 있으면 기본적으로 덮어쓰지 않고 기존 경로를 안내한다.
- 생성 노트는 `source_layer: user_synthesis`, `reuse_as_hypothesis: true`를 가진다. `topic_review`도 Obsidian Import에서 hypothesis로 인식한다.
- Folio OS가 내보내는 1차 보고서/내러티브는 `generated_by: Folio OS`, `source_layer: primary_processed`, `reuse_as_evidence: false`를 가진다.
- frontmatter validator는 type/ticker/topic/source_layer/reuse_as_hypothesis 누락과 `generated_by`·`user_synthesis` 충돌을 감지한다.
- API는 `/api/obsidian-workflow/create-note`, `/api/obsidian-workflow/linked-notes`, `/api/obsidian-workflow/validate`를 사용한다.

---

## 11. 실행에 필요한 것

- Windows와 macOS 모두 지원한다.
- Python 3가 필요하다. Windows는 `py -3`, macOS/Linux는 `python3`을 사용한다.
- 필수 Python 패키지는 [requirements.txt](requirements.txt)에 있다.
- 시장 가격 스냅샷은 `yfinance`가 있으면 활성화된다. 한국장 KRX 기반 수치는 `pykrx`가 있으면 우선 활성화되고, 실패 시 yfinance fallback을 사용한다.
- `polars`는 대량 문서 필터링, 점수 정렬, 재무/포트폴리오 집계 계산 엔진으로 사용한다.
- Jinja2는 규칙 기반 기업분석 보고서에 필요하다.
- Node.js는 React SPA 개발, typecheck/test/build, 그리고 bridge JS 문법 검사에 필요하다. 일반 0.1 사용자 패키지는 최신 `public/react/folio-react.js`가 포함되어 있으면 Node.js 없이 실행할 수 있다.
- LLM 기능은 선택 사항이다. API Key가 없으면 규칙 기반 fallback이 동작해야 한다.
- SEC API 안정 사용을 위해 `.env`에 `SEC_USER_AGENT`를 둘 수 있다.

```text
# Windows
start-archive.cmd
# macOS / Linux
bash start.sh
```

접속 주소: `http://localhost:8787`

---

## 12. 검증 명령

코드 수정 후 가능한 범위에서 최소 검증을 실행한다.

```powershell
py -3 -m py_compile app.py
py -3 -m py_compile features\common\research_library\rss\rss_archive.py
node --check public\app.js
```

서버가 켜져 있다면 API 확인:

```powershell
Invoke-RestMethod -Uri http://localhost:8787/api/dashboard
Invoke-RestMethod -Uri "http://localhost:8787/api/rss/items?offset=0&limit=20"
```

---

## 13. 개발 메모

- `app.py`가 커져 있지만 새 기능의 실제 로직은 가능하면 `features/<feature_code>/` 아래로 분리한다.
- SQLite/JSON은 저장소와 검색 인덱스 역할을 유지하고, 반복적인 필터링/정렬/집계는 `features/common/dataframe_ops.py`의 Polars 유틸을 우선 사용한다.
- 여러 기능이 공유하는 코드는 `features/common/`에 둔다.
- `data/index.json`은 상태 요약 파일로, 문서/파일 매니페스트는 `research-index.sqlite3`에 있다. 인덱싱 관련 로직을 변경하면 브리핑, 검색, 기업분석이 동시에 영향받는다.
- 문서 수정 시 AGENTS/CLAUDE는 AI 작업자 관점, README/README.ko는 일반 사용자 관점으로 유지한다. README.dev는 예전 상세 사용자/개발 문서 백업이며 일반 0.1 릴리즈 패키지에는 포함하지 않는다.
- README는 프로젝트를 처음 사용하는 사람이 읽는 문서다. 0.1에서 실제로 보이는 기능의 목적, 화면에서 하는 일, 필요한 입력 자료, 저장 위치, 주의점을 쉬운 말로 설명한다. 내부 구현 추적, Step 번호 중심 설명, 0.2+ 아이디어, 숨김/비활성 기능을 현재 기능처럼 서술하지 않는다.
- README는 기본적으로 화면 탭 단위로 정리한다. 여러 탭에서 함께 쓰는 자료·품질·연동 기능은 `features/common/` 또는 명확한 통합 폴더(예: `features/obsidian/`)의 상위 README에서 관리하고, 하위 README를 불필요하게 늘리지 않는다.
- `roadmap/`은 개인 개발용 로컬 계획 폴더이며 GitHub/source archive/릴리즈 패키지에는 포함하지 않는다. 새 대형 작업은 `master`에서 독립 브랜치를 따고, 사용자가 로컬 roadmap 문서를 유지하는 경우에만 그 문서에 제품 순서와 진행 상태를 반영한다.
- 앞으로 계획 관리는 GitHub Issues와 로컬 계획문서를 함께 사용한다. 공개적으로 추적할 작업은 GitHub Issue를 기준으로 삼고, 세부 실행 메모·개인 맥락·agent handoff는 `roadmap/` 또는 공개-safe한 `docs/superpowers/` 계획문서에 둔다. 자세한 규칙은 `docs/PLANNING_WORKFLOW.md`를 따른다.

---

## 14. 문서 관리 규칙

기능을 추가하거나 수정할 때 문서를 함께 갱신한다.

- **새 기능 폴더 생성 시**: 반드시 `features/<feature_name>/README.md`를 함께 만든다. 담당 범위, 관련 코드, API, 주의점을 포함한다.
- **기존 기능 수정 시**: 해당 기능의 README를 수정 내용에 맞게 업데이트한다. API 추가/변경, 동작 변경, 환경 변수 추가가 있으면 반드시 반영한다.
- **`features/README.md` 테이블**: 새 기능 폴더를 만들면 폴더 역할 테이블에 한 줄 추가한다.
- **`AGENTS.md`와 `CLAUDE.md`**: 본문을 항상 동일하게 유지한다. 기능 카탈로그(§8)·링크 목록(§9)·기능 경계(§10)에 새 기능을 두 파일 모두 반영한다.
- **`README.md` / `README.ko.md`(최상위 사용자 문서)**: 사용자가 직접 쓰는 0.1 기능만 현재 기능으로 설명한다. 두 문서는 같은 제품 범위를 유지한다.
- **`README.dev.md`**: 이전 장문 README 백업이다. 일반 사용자 릴리즈 문서로 링크하거나 포함하지 않는다.
- **신규 기능 표기 규칙**: §8에서 "구현됨 / 구현 예정"을 분리해 유지한다. 예정 기능은 구현 완료(해당 Step의 Acceptance Criteria 충족) 전까지 "있는 기능"으로 서술하지 않는다.
