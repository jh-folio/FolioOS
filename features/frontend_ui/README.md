# 프론트엔드 UI

이 기능은 로컬 웹 워크스페이스의 화면 구성, 내비게이션, Agent Dock, 보고서 리더, 렌더링, 반응형 대응을 담당합니다.

## 현재 프론트엔드 구조

**React SPA가 기본 프론트엔드다.** 기본 URL(`/`)에서 `web/`(Vite+React+TS, 빌드 산출물 `public/react/folio-react.js`)의 React shell이 렌더되고, route(home/dashboard/watchlist/briefing/rss/market-memory/analysis/deep-research/settings)는 React 네이티브다. 0.1 기본 nav에는 home/briefing/rss/market-memory/analysis/settings만 노출하고 dashboard/watchlist/deep-research는 딥링크 호환 route로 유지한다. `public/index.html`은 `#folioReactRoot`와 script/style 로딩만 갖는 최소 entrypoint이며, `public/app.js`는 React가 재사용하는 bridge-only 파일이다(`FolioBridge`: `renderMarkdown`, `splitReportTitle`, `briefingSourcePanelHtml`, `renderBriefingVisuals`, `updateAgentContext`, `openAgentDock` 등).

우측 전역 Action Panel은 제거되었다. 보고서 조작은 리더 내부 조작 레일과 노트 패널에서 처리한다.

## React SPA 전환 방향

`web/` React/TypeScript SPA가 routing, navigation, Agent Home, Dashboard, Report Reader, Notes, Settings를 소유한다. `public/app.js`는 더 이상 화면 상태나 view 전환을 관리하지 않고, 검증된 Markdown/visual/source 렌더러를 React에 제공하는 bridge-only 역할만 맡는다. React 전환 자체는 [REACT_SPA_REWRITE_PLAN.md](../../roadmap/completed/REACT_SPA_REWRITE_PLAN.md)에 완료 이력으로 남기고, 이후 제품 순서는 [0.1 Release Plan](../../roadmap/release/0.1_RELEASE_PLAN.md)과 [0.2+ Product Roadmap](../../roadmap/release/0.2_PLUS_PLAN.md)을 따른다.

`#/home`은 React가 직접 렌더하는 Agent Home이다. Home은 큰 `Folio OS` hero, 빠른 실행, 최근 보고서 칩 디자인을 유지하면서 hero와 빠른 실행 사이에 Codex/검색 메인 화면형 프롬프트 박스를 둔다. 프롬프트 전송은 `/api/agent/chat`으로 job을 만들고 `/api/jobs/{id}`를 polling하며, 수정 proposal은 `/api/agent/proposals/{id}` 승인/거절 API를 사용한다. 모델 선택은 `/api/agent-bridge/settings`의 현재 provider/adapter `modelChoices`를 따른다. 대화 로그는 보고서 evidence와 분리해 브라우저 localStorage에 저장하고, 사용자가 `새 대화`로 즉시 비울 수 있다. Home 하단에는 `/api/jobs` 기반 최근 Agent/빠른 실행 작업 목록을 표시한다. Home에서는 전역 Agent Dock을 표시하지 않는다.

`#/dashboard`는 React monitoring route지만 0.1 기본 사용자 nav에서는 숨긴다. `/api/dashboard`로 인덱스·최근 보고서 현황을, `/api/investment-review`로 투자 리뷰 요약·체크포인트·포트폴리오 영향을 읽고, `/api/market-widgets/settings`를 `FolioTradingViewWidgets.renderDashboardBoard()`에 넘겨 Current Market 위젯 보드를 렌더한다. 투자 리뷰 갱신은 `POST /api/investment-review/generate`를 사용한다. 위젯 추가/수정/초기화는 React route가 `/api/market-widgets/settings`에 저장한다.

`#/briefing`은 React 저장 브리핑 route다. 목록 화면은 공통 `RouteHero`와 브리핑 생성 설정 패널, 저장 브리핑 검색 패널을 사용한다. 검색 패널은 `/api/briefings/index`의 `q`, `marketScope`, `briefingType`, `dateFrom`, `dateTo` 파라미터를 직접 사용한다. `#/briefing/{date}/{us|kr|both}` detail hash에서는 `/api/briefings/{date}?includePersonal=true&marketScope=...`를 호출해 `ReportReaderShell` 안에서 Canonical markdown을 표시한다. 브리핑 detail action rail은 AI/노트/내보내기 그룹으로 분류하고, Personal Overlay 생성, Agent 문의, Notion/Obsidian export를 직접 처리한다. note slot은 Native Notes API(`/api/investment-notes`)에 `market_memo`를 저장하고 linked notes를 조회한다. 리더 본문(`ReportBody`)은 별도 파서를 두지 않고 `FolioBridge`의 `renderMarkdown()`·`splitReportTitle()`·`briefingSourcePanelHtml()`·`renderBriefingVisuals()`를 재사용해 표·링크·리스트·가격 차트·히트맵·소스패널 parity를 확보한다.

`#/rss`는 React RSS route다. `/api/rss/items`로 20개 단위 feed를 읽고, 시작/종료/소스 필터와 페이지네이션을 관리한다. `POST /api/rssarchive/import` job polling으로 RSS 수집을 실행하고, `/api/rss/merge`를 통해 현재 필터 범위의 Markdown 병합 파일을 다운로드한다.

`#/market-memory`는 React Market Memory route다. `MarketStateDashboard` component가 `/api/memory/state-dashboard?limit=5`의 “현재 중기 시장 상황 + 핵심 드라이버” 구조를 표시한다. route 헤더의 `시장 메모리 업데이트` 버튼은 `/api/memory/llm` 누적 job을 먼저 실행하고 `/api/memory/state-snapshot`으로 현재 화면용 스냅샷을 이어 생성한다. 생성 방식은 설정 탭의 AI Agent 정책을 따른다.

`#/analysis`는 React Company Analysis route다. `/api/analysis-reports`로 저장 피드를 읽고, `/api/analyze?q=...&analysisStyle=beginner|advanced`로 기업 분석을 생성하며, Agent job 응답이면 `/api/jobs/{id}`를 polling한 뒤 저장 보고서를 다시 연다. 저장 카드 클릭은 `#/analysis/{reportId}` detail hash로 공통 `ReportReaderShell` 기반 reader를 열고, route 안에서 삭제와 목록 복귀를 처리한다. 저장 보고서의 `analysisCharts`는 reader 안에서 기업 분석 시각화 카드로 렌더한다.

React Shell은 레거시 shell과 같은 큰 구조를 직접 렌더한다: dark topbar, 접을 수 있는 floating 좌측 navigation rail, 가운데 scrollable route host, 우측 Agent Dock. 0.1 노출 화면인 브리핑·RSS 피드·시장 내러티브·기업분석·설정 목록 화면은 공통 `RouteHero`를 사용한다. 대시보드·딥리서치·워치리스트도 route 구현은 유지하지만 0.1 nav에는 노출하지 않는다. 레거시 기업분석 탭과 같은 흰색 hero 카드(골드 eyebrow, 제목, 설명, 우측 액션 슬롯)를 기준으로 맞추며, 브리핑 목록은 hero 아래에 레거시 브리핑 탭의 생성/검색 패널을 유지하고, 보고서 reader 내부의 dark report hero와 본문 레이아웃은 별도로 유지한다.

React Shell의 타이포그래피는 새 값을 만들지 않고 레거시 토큰을 따른다. 좌측 navigation title/item은 `--fs-base`, 그룹 라벨은 `--fs-xs`, route hero 제목은 `--fs-xl`, 설명은 `--fs-base`를 사용한다. 홈 화면의 큰 `Folio OS` title은 레거시 `.home-hero` display scale을 유지하되, React Home에서는 prompt 위치를 고정하고 hero만 위로 당겨 title과 prompt 사이 여백을 확보한다.

좌측 navigation 아이콘은 알파벳 배지가 아니라 탭 의미에 맞춘 outline SVG를 사용한다. 개별 아이콘 선택은 실제 UI 디자인에서 지정한 매핑을 따른다.

`#/deep-research`는 React Deep Research route다. 0.1 기본 사용자 표면에서는 좌측 nav/Home 빠른 실행/command palette에 노출하지 않지만, 저장 topic report 딥링크와 내부 artifact 라우팅 호환을 위해 route 자체는 유지한다. `/api/topic-reports`로 저장 피드를 읽고, `POST /api/topic-reports`로 주제 리서치를 생성하며, Agent job 응답이면 `/api/jobs/{id}`를 polling한 뒤 저장 보고서를 다시 연다. 저장 카드 클릭은 `#/deep-research/{reportId}` detail hash로 공통 `ReportReaderShell` 기반 reader를 열고, route 안에서 삭제와 목록 복귀를 처리한다. 폼과 저장 피드는 `topicrpt-*`, `report-feed-*`, `input-panel`, `filter-btn` 클래스를 재사용해 기존 디자인 언어를 유지한다.

`#/watchlist`는 React Watchlist route지만 0.1 기본 사용자 nav에서는 숨긴다. `/api/watchlist`로 저장 목록을 읽고 저장하며, `/api/watchlist/resolve`로 티커/회사명을 정규화하고, `/api/watchlist/overview`로 카드용 태그·뉴스 카운트를 읽는다. 카드 클릭은 `#/watchlist/{item}` detail hash로 상세 화면을 열고, `/api/watchlist/detail` 결과를 `FolioTradingViewWidgets.renderWatchlistDetail()`에 넘겨 TradingView 위젯 parity를 유지한다. 카드와 상세 화면은 `watchlist-*`, `compact-item`, `input-panel`, `filter-btn` 클래스를 재사용한다.

`#/settings`는 React Settings route다. `/api/settings`, `/api/agent-bridge/settings`, `/api/obsidian/settings`, `/api/automation/settings`를 직접 소비하며, AI Agent/API/Notion/Obsidian/자동화 설정을 `settings-panel`, `input-panel`, `settings-grid`, `filter-btn` 클래스 위에 렌더한다. AI Agent 설정은 ON/OFF와 LLM CLI/API 모드 토글을 한 패널에서 관리한다. 모델 필드는 마지막으로 불러온 `modelChoices`를 select로 표시하며, 새로고침은 `/api/settings?refresh=true`와 `/api/agent-bridge/settings?refresh=true`로 model catalog를 강제 갱신한다.

포트폴리오와 standalone 투자 노트 탭은 프론트엔드에서 숨김/비활성화한다. 기존 `data/portfolio*.json`, portfolio API, native notes API/storage는 유지하며, 보고서 옆 투자 노트 패널도 계속 유지한다.

## 반응형 단계

| 폭 | 좌측 nav | Agent Dock | 상단 `.tabs` |
|---|---|---|---|
| ≥ 1200px | fixed rail | 우측 dock | 숨김 |
| < 1200px | 숨김 | 하단 sheet | 표시(스크롤 탭 fallback) |

- 가로 스크롤은 어떤 폭에서도 생기지 않아야 한다(`.tabs`만 내부 `overflow-x:auto`).
- 좌측 nav item은 펼침/접힘 모두 동일한 높이 토큰을 쓴다. 접힌 상태에서는 hover/focus 라벨 툴팁으로 아이콘의 의미를 드러낸다.

## 담당 범위

- 0.1 노출 범위: Home / 브리핑 / RSS 피드(뉴스 검색 포함) / 기업 분석 / 시장 내러티브 / 설정
- 브리핑 탭은 생성 컨트롤과 저장 보고서 피드가 **한 화면으로 통합**되어 있다(과거 `생성`/`목록` 하위 탭·사이드바 하위 탭 제거). 생성 박스는 단일 패널(`브리핑 설정`: 시장 범위 세그먼트·브리핑 유형)과 하단 액션 바(`새로고침` → `오늘 브리핑 생성` → 날짜 입력 → `이 날짜로 생성`)다. 저장 피드는 최신순 카드(제목·기준일·생성 시각)에 시장·유형·날짜·텍스트 필터와 `시장별/날짜별` 보기 모드를 제공하고, 카드별 휴지통으로 확인 후 삭제(`DELETE /api/briefings/{date}`)한다. 브리핑은 **생성 결과·카드 클릭 모두 React `ReportReaderShell`** 로 브리핑 탭 본문 자리에서 열린다(노션식). 리더가 열리면 목록/생성 패널은 숨고, 상단 브레드크럼(`브리핑 › {날짜}`)·브라우저 뒤로가기·좌측 nav의 브리핑 클릭으로 목록에 돌아온다. URL 해시 `#/briefing/{date}/{us|kr|both}`가 리더 상태의 source of truth라 새로고침·딥링크가 복원된다. 데스크톱 리더는 grid 2열: 본문이 좌측 사이드바 옆부터 우측 컬럼 앞까지 채우고, 우측 컬럼은 **조작 레일(위) + 투자 노트(아래, 상시 표시·저장 노트 자동 로드)** 다(책갈피 손잡이 제거). 기업분석·딥리서치도 React route에서는 공통 reader를 사용한다.
- 좌측 navigation, Agent Dock, 보고서 hero
- Markdown 렌더링, Notion/Obsidian/HTML 내보내기 버튼

## Global Agent Dock

The Agent Dock is a persistent global layer for non-Home routes. It opens as a right dock on desktop by default unless the user previously closed it, and becomes a bottom sheet on narrow mobile layouts. Home uses its own Agent prompt and does not render the dock. In the React Shell, closing the dock removes the right grid column and leaves only the bottom-right `AI` pill so the main route can use the freed width. Report reader modals should update `FolioAgent.currentContext` so Agent requests know the active report without changing Canonical markdown.

- **Push 레이아웃**: 도크가 열리면 `body.agent-dock-open` 클래스가 붙고, 본문(`main.page`)과 고정 리더 모달(`report-reader-modal`/`watchlist-detail-modal`/`market-widget-editor-modal`)이 `--agent-dock-width`(384px)만큼 오른쪽 여백을 확보한다. 도크는 어떤 탭·팝업에서도 같은 위치에 있으면서 내용을 가리지 않는다. (브리핑 리더는 인라인이라 본문 push로 함께 밀린다)
- **상단 고정 바 침범 금지**: 데스크톱(≥1200px)에서 도크는 `top: 54px`(고정 hero 아래, z-index 55 < hero 60)에서 시작한다. 재시작 버튼 등 상단 바 요소를 가리지 않는다.
- 리더 모달 본문 폭은 뷰포트(`50vw`)가 아니라 **모달 컨테이너 기준(`50%`)** 으로 캡한다. 도크가 열려 모달이 줄어도 우측 노트 패널이 도크 아래로 들어가지 않는다.
- 모바일(≤760px)에서는 push 대신 하단 바텀시트(최대 72vh)로 전환한다.
- 도크·카드·버튼은 folio 디자인 토큰(`--folio-*`, `--fs-*`, `--elev-*`, `--radius-pill`)만 사용한다. 임의 색상 하드코딩을 추가하지 않는다(단, provider 브랜드 색은 예외적으로 React Agent Dock provider metadata에만 둔다).
- **Provider 브랜딩**: React Agent Dock이 Agent Bridge 설정(`/api/agent-bridge/settings`)의 provider(codex/claude/antigravity)에 따라 도크 헤더 로고·타이틀, 메시지 영역 워터마크, FAB 점 색, `Agent에게 묻기` 아이콘 버튼(`.agent-logo-slot`)에 `--agent-accent`와 인라인 SVG 로고를 적용한다. Codex/Claude는 LobeHub 아이콘 페이지의 color/mono 변형을 기준으로, Antigravity는 공식 press 로고 형태를 기준으로 임베드한다. 헤더와 액션 버튼은 색상 로고(`logo`), 채팅 영역 배경 워터마크는 무채색 로고(`monoLogo`)를 쓰며 위치는 입력창 바로 위 우하단이다. 매핑은 `web/src/app/ReactAgentDock.tsx::PROVIDER_META`에 있다.
- **기본 열림**: 데스크톱(≥1200px)에서 도크는 페이지 로드 시 기본으로 열린다. 사용자가 닫으면 `localStorage.folioAgentDockClosed`로 기억해 다음 로드에도 닫힌 상태를 유지하고, 다시 열면 해제된다.
- **채팅 도구 툴바**: 입력창 아래에 파일 첨부(`+`, 텍스트 파일은 4,000자까지 본문 포함·최대 3개·200KB 제한), 모델 버전 선택(현재 provider의 CLI `modelChoices`), 노력 단계(낮음/중간/높음/최대) 컨트롤이 있다. 첨부파일은 참고 입력(hypothesis)이지 evidence가 아니다.
- **채팅 실연결**: 전송은 `POST /api/agent/chat`(job) → `/api/jobs/{id}` 폴링으로 실제 Agent CLI 응답을 받는다(어시스턴트 메시지는 `renderMarkdown()`으로 렌더). CLI가 없으면 규칙 기반 응답(`engine: "rules"`)으로 fallback. Task 의도 + 보고서 컨텍스트면 응답에 **수정 제안 카드**(요약 + diff 접기 + 승인/거절 버튼)가 붙고, `POST /api/agent/proposals/{id}` 승인 시에만 보고서가 바뀐다. 브리핑 리더가 열려 있으면 승인 직후 자동으로 다시 불러온다.
- 본문(`.main-content`)은 데스크톱에서 가운데 정렬이 아니라 좌측 사이드바 바로 옆(`margin-left: 0`)에서 시작한다.

## Native Investment Notes

보고서 옆 투자 노트 패널과 메모 탭의 기본 저장 경로는 Obsidian이 아니라 Folio native note API(`/api/investment-notes`)다. 브리핑은 `market_memo`, 기업분석은 `company_thesis`, 딥 리서치는 `topic_review`, 일반 메모 탭은 `investment_note`로 저장한다. 모든 노트는 hypothesis이며 evidence로 사용하지 않는다.

투자 노트 패널은 Markdown 초안 양식을 먼저 보여주지 않고, 생각 한 줄을 적는 자유 작성 칸과 단일 `Agent와 투자 노트 정리하기` 버튼으로 시작한다. 사용자의 원문 생각은 `rawThoughts`, Agent와의 정리 과정은 `interactionLog`, 사용자가 편집하는 최종 투자 노트는 `body`로 분리 저장한다. Agent 결과가 사용자 원문을 덮어쓰면 안 되며, 패널에는 `기록` 탭을 두어 나중에 노트를 열어도 생각 흐름을 다시 볼 수 있게 한다.

## Market State Dashboard v2

시장 내러티브 탭은 `현재 중기 시장 상황` 대시보드 하나만 노출한다. 드라이버 카드는 판단(conclusion) 헤드라인 + 추세 칩(momentum별 soft 팔레트) + `자세히` 접기(근거/부연/체크포인트/근거 카운트/연결기업) + `Agent에게 묻기` 버튼으로 구성된다. taxonomy·story map·audit·패밀리 제안 UI는 제거되었으며 백엔드 API로만 접근한다.

## 주요 파일

```text
web/src/app/
web/src/islands/
public/index.html
public/app.js
public/styles.css
public/react/folio-react.js
```

## 중요한 렌더러

- `renderMarkdown()`: 제목, 문단, 링크, 리스트, 표 렌더링. React report reader가 `FolioBridge`를 통해 호출한다.
- `splitReportTitle()`: 보고서 본문의 선행 H1을 dark report hero(골드 kicker + 제목)로 올리고 본문에서 제거한다. 저장된 markdown은 바꾸지 않으며 표시 시점에만 전처리한다.
- `FolioTradingViewWidgets`(`public/tradingview-widgets.js`): TradingView widget script를 허용 타입으로만 삽입한다. 대시보드 Current Market 보드와 워치리스트 상세 모달에서 사용하며, widget output은 저장하지 않는다.

## 보고서 hero / 색상

- `.report-hero`: 딥 네이비 배경 + `.report-kicker`(골드, 대문자). 브리핑/기업분석/테마분석 상단 공통.
- Dark surface는 black을 쓰지 않고 `--folio-surface-dark` 딥 네이비로 통일한다. `--folio-surface-black`도 네이비 alias로 흡수한다.
- 회색 계열 surface는 cool gray가 아니라 가독성을 해치지 않는 warm white/soft cream/taupe neutral 토큰(`--folio-surface-clean`, `--folio-surface-2`, `--folio-surface-muted`, `--folio-ink-muted`)을 사용한다.
- 본문 `.markdown-brief`/표는 밝은 surface를 유지한다. Executive Summary dark 테이블은 후속(자동 판별 보류).
- Personal Overlay는 purple 계열, Thesis Delta는 teal 계열로 Canonical 보고서와 시각적으로 분리한다.
- 보고서 생성 상태(`.generation-status.report-status`)는 hero와 본문 사이에 끼우지 않고 본문 아래 보조 상태로 표시한다. 색상은 green/amber/blue를 저채도 톤으로 낮춰 보고서 본문보다 덜 튀게 한다.

## 상단바(hero) 구성

상단바는 성격별 3그룹으로 분리한다. JS는 ID만 참조하므로 그룹 컨테이너는 위치/스타일 전용이다.

```text
.hero
 ├─ .hero-brand          좌: 브랜드(Folio OS)
 ├─ .hero-status-group   중앙: 상태 텍스트(#status) + 진행바(#jobProgress) + 작업 취소(#cancelAgentJobBtn)
 └─ .hero-meta-group     우: 마지막 인덱싱 시각 + 서버 재시작(#restartServerBtn)
```

- 상태 그룹은 평소엔 텍스트만 보이고, 작업 진행 중(`.job-progress`가 보일 때)에만 `:has()`로 알약 배경이 떠 강조된다.
- 작업 취소(`.agent-job-cancel`)는 `.icon-btn`의 `display:grid`가 기본 `[hidden]`을 덮어쓰지 않도록 `.agent-job-cancel[hidden]{display:none}`로 명시한다(작업 없을 때 ×가 상시 노출되던 버그 방지).

## UI 규칙

### 타이포와 elevation 계약

- 일반 UI 본문은 17px, 버튼·탭·선택 라벨은 15px을 기본으로 한다. 입력 패널 안내문은 확대 전 16px을 유지한다.
- Canonical 보고서 본문은 18px이다. 보고서 제목은 30px, Markdown 섹션은 34/24/20px 계층을 사용한다. 모바일 보고서 제목은 `clamp()`로 26~30px 범위를 유지한다.
- 제목은 `--weight-heading: 800`을 사용한다. IBM Plex Sans 영문은 로드된 700으로 매칭되고, 한글 SUIT는 800으로 렌더돼 혼용 제목의 광학 두께를 맞춘다.
- RSS 뉴스 카드 제목은 22px/800이다. 품질 패널 제목과 대시보드 하단 카드·지표는 확대 전 20px 및 14/16/18/24/28/36px 계층을 유지한다.
- 브리핑 차트 제목은 20px, 기간·라인/캔들 컨트롤은 15px, 가격은 최대 44.8px이다. 히트맵 종목 글자는 박스 크기에 비례하고, 섹터·산업 라벨은 종목 가독성을 해치지 않도록 6~8px 수준의 보조 라벨로 유지한다.
- TradingView 위젯 카드는 고정 min-height를 사용해 외부 스크립트 로딩 전후 레이아웃 점프를 막는다. 대시보드 위젯 보드는 데스크톱 2열, 모바일 1열이다.
- 입력·필터 패널과 좌우 레일만 `--elev-1/--elev-2`를 사용한다. `.markdown-brief`와 `.briefing-visual-card`에는 shadow나 hover lift를 적용하지 않는다.
- `prefers-reduced-motion: reduce`에서는 animation과 transition을 제거한다.

- 히어로 영역은 브랜드와 상태 표시 중심으로 둡니다.
- 실행 버튼은 각 기능 탭 안에 둡니다.
- RSS 수집 버튼은 RSS 피드 탭에 둡니다.
- 뉴스 검색은 별도 탭이 아니라 RSS 피드 탭 아래에 둡니다.
- 브리핑 생성/자료 다시 읽기 버튼은 브리핑 탭 패널 안(`.brief-action-row`)에 둡니다. Notion 내보내기 버튼도 이 행에 나란히 배치합니다.
- RSS 피드는 한 페이지에 20개씩 보여주고 페이지 번호로 이동합니다.
- RSS 필터는 시간과 소스 조건을 함께 제공합니다.
- 모바일에서 버튼과 카드가 넘치지 않아야 합니다.
- Notion 내보내기 버튼은 `.filter-btn.notion` 클래스를 사용합니다. (어두운 배경, Notion N 로고 SVG 포함)
- 내보내기 성공 후 버튼은 Notion 페이지 링크(`filter-btn notion` 스타일의 `<a>`)로 교체됩니다.

## 주의점

- `renderMarkdown()` 변경은 브리핑과 기업분석 모두에 영향을 줍니다.
- 표 렌더링은 `<div class="table-wrap"><table>...</table></div>` 구조입니다.
- Plotly 차트는 layout마다 글꼴을 지정하지 않아도 되도록, `Plotly.react`/`newPlot`를 한 번 감싸 `layout.font.family`(`PLOTLY_FONT_FAMILY`, UI 본문 글꼴)를 일괄 주입합니다. 새 차트도 자동 적용되며, 차트 글꼴이 본문과 달라지면 이 래퍼를 먼저 확인합니다.
- 기업분석 본문 폭은 기본적으로 `markdown-brief`의 제한 폭을 따릅니다.
