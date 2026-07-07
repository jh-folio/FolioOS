# Investment Review — 투자 리뷰 대시보드 (Step 8)

여러 기능을 하나의 **투자 리뷰 홈**으로 집계한다.

> 최근 시장 변화가 내 투자 논리를 강화했나 약화했나? 이번 주 무엇을 확인해야 하나?

설계: [roadmap/completed/folio_os_roadmap_post_v1.md](../../roadmap/completed/folio_os_roadmap_post_v1.md) §8 ·
추적: [roadmap/completed/IMPLEMENTATION_PLAN_POSTV1.md](../../roadmap/completed/IMPLEMENTATION_PLAN_POSTV1.md)

## 계층

**Personal Overlay 계층**이다. Canonical 보고서(브리핑/기업분석/테마)를 **수정하지 않고**,
사용자 데이터·기존 산출물을 연결한 개인용 리뷰를 별도 객체/화면으로만 만든다.
포트폴리오 영향은 투자 판단 보조이며 **매수/매도 지시가 아니다**.

## 집계 소스

| 섹션 | 소스 |
|---|---|
| 오늘의 시장 상태 | `market_memory.list_states`(regime_v2 momentum/confidence) |
| 내 Thesis 변화 | `thesis_tracking`(thesis + 최신 thesis_delta verdict) |
| 포트폴리오 영향 | `portfolio` + `watchlist_notes` ↔ regime/thesis 연결 |
| 이번 주 체크포인트 | Step 6 `research_schema.checkpoints`(thesis_delta + regime nextCheckpoints) |
| 연결된 내 노트 | `features/obsidian/importer/note_index.py`(importable hypothesis 노트) |

## 동작

- **LLM 없이 규칙 기반**으로 생성한다. 데이터가 없으면 빈 섹션 + warning(원문 불변).
- 집계는 주입식 순수 함수(`build_market_state`, `build_thesis_changes`,
  `build_portfolio_impacts`, `aggregate_checkpoints`, `build_linked_notes`)로 분리 — DB 없이 테스트 가능.
- **캐싱**: 일 1회 생성 후 `data/investment-review/{date}.json`. 저장본이 있으면 재사용,
  강제 재생성(`forceRefresh`) 가능, 해당 날짜 저장본이 없으면 최신 저장본 + `stale` 표시.

## 홈 대시보드 구성 (UI)

투자 리뷰 뷰는 **대시보드 화면**으로 구성한다(위→아래). 별도 "오늘의 투자 리뷰" hero 카드는 두지 않고, 대시보드 본문은 현재 시장·리뷰 지표부터 바로 시작한다.

1. **바로가기 타일** — 브리핑 생성(primary)·기업분석·테마분석·RSS (각 view로 이동/실행)
2. **최근 보고서** — 최신 브리핑/기업분석/테마 카드(클릭 시 해당 탭 이동)
3. **Current Market 위젯 보드** — TradingView Market Overview/Advanced Chart 기반 사용자 위젯. 저장 브리핑 snapshot과 분리된 현재 시장 화면이며, 위젯 로드 실패 시 기존 `marketTape`를 fallback으로 표시
4. **요약 스탯 카드** — 시장 강화중·Thesis 강화/약화·포지션 긍정/주의·체크포인트 수 (`stats`)
5. **차트** — Thesis 분포·포지션 영향 도넛(SVG) + 내러티브 노출 막대 (`stats`/`exposure`)
6. **상세 카드(메인 3개만)** — 시장 상태(confidence 미터)·포트폴리오 영향·이번 주 체크포인트. 도넛과 중복되는 Thesis 변화/연결 노트는 홈에서 생략하고, 경고(`warnings`)는 있을 때만 노출.

> 차트는 외부 라이브러리 없이 인라인 SVG/CSS로 그리며 색은 팔레트 토큰(`--folio-green/gold/burgundy/ink-muted` 등)을 쓴다.
> `marketTape`는 `build_dashboard_tape()`가 계속 채운다 — US 지수/원자재는 yfinance 레벨(`^GSPC/^NDX/^DJI/^RUT/^TNX/^VIX/DX-Y.NYB/GC=F/CL=F`), 한국 수치(KOSPI·KOSDAQ·USD/KRW)는 `providers` 체인(pykrx 우선→yfinance). 현재 UI에서는 TradingView 위젯의 fallback으로만 사용하며, 위젯 데이터는 보고서 evidence나 snapshot에 저장하지 않는다.
> 포트폴리오 영향에서 한국 종목(6자리 코드)은 코드 대신 종목명으로 표시한다.
> 전역 hero(`header.hero`)는 기본 컴팩트 브랜드 바이며, 홈(대시보드)에서만 `.page.home-active`로 크게 키운다. 다른 화면은 섹션 제목이 소형 hero 역할을 한다.

## impact enum

`positive` / `watch` / `negative` / `neutral` — thesis verdict(at_risk/broken→watch,
strengthened→positive)와 regime momentum(strengthening→positive, fading/turning→watch)로 판정.

## API

```text
GET  /api/investment-review            # 오늘(또는 최신) 리뷰
POST /api/investment-review/generate   # 강제 재생성 (body: date, includePortfolio/Watchlist/Obsidian, useLlm, forceRefresh)
GET  /api/investment-review/{date}     # 특정 날짜 리뷰(없으면 최신 + stale)
```

## 테스트

```powershell
py -3 features\investment_review\tests\test_review_summary.py
py -3 features\investment_review\tests\test_portfolio_links.py
py -3 features\investment_review\tests\test_checkpoint_aggregation.py
```
