# Fast-origin Signals

`signals/`는 Watchlist 범위에서 사건을 빨리 게시하는 출처의 제목·링크·시각 metadata를 다룹니다. Signal은 확인 전 `lead`이며 Canonical 보고서의 evidence나 source ledger가 아닙니다.

## 허용 출처

자격증명이 필요 없는 경로는 사용자 설정 없이 기본 동작합니다. 사용자에게 묻는 값은 사용자만 제공할 수 있는 것(API key 등)뿐입니다.

| 출처 | 기본 상태 | 비고 |
|---|---|---|
| 기존 연합인포맥스·연합뉴스 RSS | **켜짐** | `promote_kr_rss_leads()`가 이미 수집된 행을 다시 읽을 뿐 네트워크·자격증명 미사용. RSS 수집 작업에서도 함께 실행 |

**승인된 provider는 이것 하나뿐입니다.** 자격증명도 사용자 설정도 필요 없으므로 provider 켜고 끄는 설정 화면과 오버레이 파일(`signal-provider-settings.json`)이 없습니다. 매일경제는 fast-origin이 아니라 일반 RSS로 분류합니다.

lead끼리의 교차 확인(`corroborated`)은 독립 provider가 둘 이상일 때만 성립하므로 현재는 도달하지 않는 경로입니다. 확인은 공식 자료 경로(`confirm_signal`)가 담당합니다.

0.4.x에서 제외한 출처:

- **Benzinga** — 공개 피드 목록이 2026-08 기준 비어 있거나 404이고, 응답하는 `/feed`도 암호화폐 전망 기사뿐이라 시장 속보로 쓸 수 없었습니다. 어댑터·설정·env 키·UI를 모두 제거했습니다.
- **FinancialJuice** — 한 줄짜리 지표 속보라 브리핑(교차 보도량 기반 이슈 선별)에도 기업분석(기업별 뉴스)에도 쓰임이 없어 어댑터·설정·자격증명·WebSocket 런타임을 모두 제거했습니다.
- **Investing.com** — 공개 피드 주소가 없고 약관상 사전 승인이 필요합니다.

Wall St Engine, First Squawk, TradingView 뉴스, scraping, 제3자 RSS 변환기도 범위가 아닙니다. 새 provider를 다시 들이는 것은 계획 변경으로 다룹니다.

## 저장 경계

`data/research-index.sqlite3::evidence_items`에 `intake_stage=lead`로 metadata만 저장합니다. 기사 본문, HTML, 이미지, provider raw payload, 인증 URL·token은 저장하지 않습니다. 일반 lead는 72시간, Watchlist/Portfolio 관련 lead는 14일, 확인된 lead는 30일 보존합니다.

## API

- `GET /api/signals?scope=&ticker=&market=&status=&cursor=&limit=`
- `GET /api/signals/providers`

응답에는 cursor pagination과 provider health가 포함되며 본문/raw 필드는 없습니다. 수집만으로 Agent나 Change Intelligence를 실행하지 않습니다.
