# 일일 브리핑

이 기능은 `research-inbox/articles`와 `research-inbox/rss`의 최신 뉴스 자료를 바탕으로 일일 시장 브리핑을 생성하고 날짜별로 저장합니다.

## 담당 범위

- 오늘 또는 선택 날짜의 브리핑 생성
- 과거 브리핑 조회
- 종합(both) 생성 시 한미 시장 연결 분석(`{date}.link.json`)을 별도 레이어로 생성
- LLM 브리핑과 규칙 기반 fallback
- 브리핑용 웹 검색 보완 ON/OFF
- 0.1 기본 시장 가격 스냅샷 보조(yfinance/pykrx fallback). Toss Open API 어댑터는 숨김 내부 경로로만 유지
- provider 기반 한국장 시장 수치 보조(`pykrx` 우선, 실패 시 yfinance fallback)
- 최근 반복된 시장 흐름 참고

## 시장 범위와 출력 계약

생성 API는 `marketScope: us | kr | both`를 받습니다. 각 시장은 기존 `0~6 + 오늘의 결론`, 주도 기업 2개, 참고자료 구성을 그대로 유지하며, 모든 주요 섹션은 `한 줄 결론 + 가운뎃점 3~4개 + 줄글` 순서로 생성됩니다. 저장 JSON의 `briefings.us`와 `briefings.kr`에는 시장별 markdown·세션·기준일·출처와 `marketScope`, `briefingType`, `generatedAt`, `sessionDate`, `title`, `summary`, `tags`가 따로 남고, 기존 소비자는 결합 `markdown`을 계속 읽을 수 있습니다.

부분 시장 재생성은 같은 날짜의 반대편 시장 결과를 보존합니다. Canonical 본문이 바뀌면 기존 `personalOverlay`도 삭제하지 않고 `stale: true`로 표시합니다. 시장 내러티브 누적은 중복을 막기 위해 `both` 생성에서만 수행합니다.

## 이슈·출처 선별

`issue_selection.py`는 기사를 먼저 보수적으로 사건 단위로 묶고, 같은 매체의 반복 기사와 재전송본을 한 표로 계산합니다. 미국장은 Reuters·WSJ·FT·Bloomberg 등 해외 핵심 매체와 미국 시장 반응을 우선하고, 한국장은 국내 수급·환율·업종 전문성을 유지하면서 해외 핵심 매체의 독립 보도를 `internationalSalience`로 반영합니다.

LLM 입력과 표시 참고자료에는 같은 evidence lane·cluster dedupe·매체별 soft cap을 적용합니다. 시장 반응 자료가 없으면 영향 0으로 간주하지 않고 `marketImpactStatus: unavailable`과 `dataGaps`를 남깁니다. 공개 RSS에는 연합뉴스와 매일경제 공식 피드가 추가되었으며 유료 본문 우회 수집은 하지 않습니다.

## 생성 당시 시각 스냅샷

브리핑 생성 시 `visualRecommendations`와 `visualSnapshots`를 함께 만듭니다. 선택 지수와 주도 기업은 무료·무키 경로로 생성 세션의 5분봉과 최대 1년 일봉을 저장하며 반드시 `marketSessionDate` 이후 행을 제거합니다. 1D는 5분봉, 1M·3M·YTD·1Y는 저장된 일봉에서 화면이 파생합니다. provider, 실제 `asOf`, freshness, coverage, timezone, currency를 저장하고 기준일보다 데이터가 오래됐거나 일부 종목이 누락되면 상태와 경고를 표시합니다. 시각자료 수집 실패는 Canonical markdown 생성을 막지 않습니다.

가격 series는 보고서 JSON에 inline 저장합니다. 히트맵 상세 rows는 compact gzip `data/briefings/{date}.visuals.json.gz` 사이드카에 저장하고 보고서는 `sidecarRef`만 가집니다. 기존 `.visuals.json`은 읽기 호환합니다. 일부 시장만 재생성하면 반대편 시장의 snapshot과 사이드카 rows를 보존합니다. 따라서 과거 브리핑은 provider를 다시 호출하지 않고 생성 당시 데이터를 재현할 수 있습니다.

| 위치 | 분석 질문 | 차트 계약 | 핵심 필드 |
| --- | --- | --- | --- |
| 시장 요약 | 주요 지수의 세션 전 움직임은 어땠는가 | Focus price / line·candle | `intraday(5m)`, `daily(1d)`, `ticker` |
| 주도 기업 ①·② | 주도주의 최근 가격 경로는 어땠는가 | Focus price / line·candle | `time`, OHLCV, `subject` |
| 시장 히트맵 | 전체 시장의 상승·하락과 시가총액 집중은 어디였는가 | Sector→industry→ticker treemap. 단, `sector`와 `industry`가 같은 KR 행은 중복 산업 단계를 생략해 Sector→ticker로 표시 | `sector`, `industry`, `changePct`, `marketCap` |

미국 지수 차트는 **S&P 500 → Nasdaq → Dow Jones** 순서로 표시합니다. `Nasdaq`은 뉴스에서 일반적으로 말하는 Nasdaq Composite(`^IXIC`) 기준이며, Nasdaq 100(`^NDX`)이 아닙니다. 한국 지수는 KOSPI·KOSPI 200을 사용합니다. 히트맵은 **미국은 S&P 500 구성종목, 한국은 KOSPI 200 구성종목**으로 한정하며 KOSDAQ은 제외합니다. 미국 히트맵의 종목·섹터·산업 분류는 `config/sp500_constituents.json`에 내장한 **GICS Sector / Sub-Industry**(finviz와 동일한 익숙한 분류)를 사용하고, 시가총액(박스 크기)도 이 파일의 스냅샷을 씁니다. 한국 히트맵도 `config/kospi200_constituents.json`의 KOSPI 200 구성종목과 시가총액 스냅샷을 기본 universe로 사용합니다. KR 행에서 산업명이 섹터명과 같거나 비어 있으면 화면에서는 산업 단계를 만들지 않고 종목을 섹터 바로 아래에 배치해 중복 라벨 공간을 줄입니다. 0.1 기본 실행에서는 yfinance 일봉과 pykrx를 사용하고, 전일가·미지원/누락 종목은 저장된 마지막 정상 snapshot으로 보완합니다. 두 universe 파일은 각각 `py -3 -m features.common.market_data.sp500_universe`, `py -3 -m features.common.market_data.kospi200_universe`로 주기적으로 갱신합니다. Toss Open API 가격 보강은 `FOLIO_ENABLE_TOSS_OPEN_API=1`을 켠 내부 검증 경로로만 남겨둡니다.
미국 히트맵은 `GOOGL/GOOG`, `FOXA/FOX`, `NWS/NWSA`, `BRK.A/BRK.B`처럼 같은 기업의 복수 종류주식이 universe에 함께 있으면 한 기업 타일로 합쳐 표시합니다. 타일 크기는 중복 합산하지 않고 대표 회사 시가총액(max)을 쓰며, 등락률은 종류주식별 시가총액 가중 평균으로 계산합니다.

히트맵 글자 크기는 박스 면적(시가총액)에 비례해 조정되어, 대형주는 티커가 크게 보이고 소형주도 작게나마 티커가 노출됩니다(finviz 스타일).

## 사용 자료

브리핑은 뉴스 자료만 사용합니다.

```text
research-inbox/articles/
research-inbox/rss/
```

`filings`와 `reports`는 브리핑에 직접 사용하지 않습니다.

## 한미 시장 시차 기준

한국시간 아침/오전 브리핑은 단일 날짜 기사만 보지 않습니다. 브리핑 대상일이 `D`이면 앱은 기본적으로 `D-1`과 `D` 자료를 함께 후보로 봅니다.

- 미국장: `D-1` 미국 정규장 마감 결과를 우선 사용
- 한국장: `D-1` 한국 정규장 결과와 `D` 한국장 개장 후/장중 시황을 구분해서 사용
- `D-1` 미국장 마감 이후 나온 뉴스는 `D-1` 한국장에 이미 반영됐다고 쓰지 않음
- `D` 한국장 장중 기사, 수급, 업종 반응이 있을 때만 한국장이 반영하기 시작했다고 표현

LLM 컨텍스트에는 각 자료의 `시장시간대`가 붙고, provider가 성공하면 `## 한국장 시장 수치` 블록이 추가됩니다.

```text
US 전일 정규장
KR 전일 정규장
KR 당일 개장/장중
전일 글로벌 자료
당일 최신 자료
```

### 기사 발행일 vs 시장 거래일(`marketSessionDate`)

한국 언론의 `뉴욕증시 마감/브리핑` 기사는 한국시간 D일에 발행돼도 보통 미국 **D-1** 정규장 결과를 다룹니다. 발행일(`date`)을 그대로 미국장 거래일로 쓰면 전 거래일 결과를 당일 결과로 오인합니다(예: 6/9 발행 "나스닥 0.9%↑"는 실제 미국 6/8 장).

- `selection.py::infer_market_session_date(doc, market_windows)`가 선별 단계에서 각 자료의 실제 시장 거래일을 추론합니다. 한국 언론 뉴욕증시 마감 기사(`is_us_market_close_article`)는 발행일 직전 미국 거래일로 보정하고, 그 외는 발행일을 그대로 씁니다. `app.py::build_briefing()`이 docs에 `marketSessionDate`를 주입합니다.
- `doc_market_bucket()`은 `date`보다 `marketSessionDate`를 우선 사용합니다.
- `build_llm_context`는 미국 정규장 당일(`usRegularSessionDate`) 마감 시황 기사(`is_us_market_close_article` 기준)를 컨텍스트에 반드시 시드로 포함하고, 각 자료 줄에 `시장기준일(추정)`을 표기합니다. 프롬프트/지침은 "미국장 결과 수치는 `marketSessionDate == usRegularSessionDate`인 자료 또는 스냅샷 기준일이 일치할 때만 사용, 둘 다 없으면 확인되지 않는다고 명시"하도록 강제합니다.

## 브리핑 대상일별 분석 우선순위

`briefing_market_windows(date)`는 브리핑 대상일의 시장 개장 상태로 `analysisMode`를 정하고, 분석축 우선순위(`primarySessions`/`secondarySessions`/`sessionRoles`), 주말·휴장 새 뉴스 구간(`offSessionNewsWindow`, `weekendOrHolidayNewsMode`), 사람이 읽는 `sessionPriorityRule`을 함께 반환합니다. "가장 최근 마감한 시장"만 기계적으로 요약하지 않고, 모드에 맞는 주 분석축을 먼저 정합니다.

| analysisMode | 주요 분석축(primary) | 보조/추가 | 비고 |
| --- | --- | --- | --- |
| `weekday_kr_open` | 미국 D-1 정규장 + 한국 D 장중 | 한국 D-1 정규장(배경), D 최신 뉴스 | 한국 D-1은 배경 맥락으로만 |
| `weekend` / `both_holiday` | 최근 미국 정규장 + 최근 한국 정규장 | 주말/휴장 사이 새 뉴스(off_session_news) | 장중 시황 안 만듦, 뉴스는 다음 거래일 반영 후보 |
| `kr_holiday` | 최근 미국 정규장 | 휴장 전 한국 정규장(배경), 휴장 중 한국 뉴스 | 한국 당일 장중 시황 안 만듦 |
| `us_holiday_kr_open` | 한국 D 장중/정규장 | 직전 미국 정규장, 미 휴장 중 선물·환율·뉴스 | 미국 정규장 결과 새로 만들지 않음 |

### 평일 / 한국장 개장일
- 주요 분석축: 미국 D-1 정규장 + 한국 D 장중 흐름
- 보조 맥락: 한국 D-1 정규장(시장 흐름 섹션의 중심을 차지하지 않게 함)

### 주말 / 양시장 휴장일
- 주요 분석축: 최근 미국 정규장 + 최근 한국 정규장(간결한 복기)
- 추가 분석축: 주말/휴장 사이 나온 새 뉴스와 다음 거래일 영향 후보
- 주말·휴장 뉴스는 현재 가격 반응으로 쓰지 않고 다음 거래일 확인점으로 다룸. `sourceDates`에 off-session 구간 날짜를 명시 포함해 주말 뉴스 누락을 막음

### 한국 휴장일
- 한국 당일 장중 시황은 만들지 않음
- 미국장 결과와 휴장 중 한국 관련 뉴스의 다음 한국 거래일 반영 여부를 다룸

### 미국 휴장일 / 한국 개장일
- 미국 정규장 결과를 새로 만들지 않음
- 한국장이 열렸다면 한국장 자체의 수급·업종·환율을 우선 분석

자료별 우선순위는 `doc_analysis_priority(doc, windows)`가 `primary / secondary / background / off_session_news`로 반환하고, `briefing_doc_score()`가 모드별 가중치(평일은 미국 전일/한국 당일 primary, 주말·휴장은 off_session_news 비중 ↑)를 적용합니다. LLM 컨텍스트에는 모드 요약과 각 자료의 `분석우선순위`가 표시됩니다. 위 "한미 시장 시차 기준"의 `시장시간대` 버킷은 이 분석 우선순위로 매핑됩니다.

`build_llm_context`는 미국 정규장 마감 시황 기사에 더해, **`weekday_kr_open` 모드에서 한국 D 개장/장중(`KR 당일 개장/장중`) 자료를 고정 슬롯으로 컨텍스트에 시드**합니다(driver/group 경쟁에서 밀려 한국 당일 분석축이 비는 것을 방지). 참고자료(`refTier`)에도 한국 D 장중 자료에 `kr_current_flow` 등급을 줘 상단 일부에 배치합니다. `후보 이슈 묶음`도 `briefing_doc_score` 기준으로 정렬해 KR D-1 정규장 자료가 계속 상단을 차지하지 않게 합니다.

`weekend` / `both_holiday` 모드에서는 `off_session_news` 자료를 핵심 변수와 주도 기업·섹터 후보에서 우선합니다. 직전 미국/한국 정규장 자료는 `시장 흐름` 섹션의 짧은 배경 복기에 쓰고, `시장을 움직인 핵심 변수`와 `시장을 주도한 기업` 섹션은 주말/휴장 사이 새로 나온 정책·지정학·기업 이벤트·실적/가이던스·M&A·규제·원자재/환율 뉴스를 다음 거래일 반영 후보로 다룹니다. 가격 반응은 단정하지 않고 다음 거래일 거래대금, 수급, 선물, 환율, 동종 기업 상대강도로 확인합니다.

한국장 시장 수치는 `features/common/market_data/providers.py`의 provider 체인에서 가져옵니다. 0.1 기본 체인은 `PyKrxKoreaMarketProvider` → `YFinanceKoreaMarketProvider` 순서입니다. `PyKrxKoreaMarketProvider`는 `pykrx`를 통해 KOSPI/KOSDAQ/KOSPI200, 거래대금, 투자자별 수급, 주요 업종 등락률을 조회하고, 실패하거나 미설치 상태면 `YFinanceKoreaMarketProvider`가 KOSPI/KOSDAQ 등 지수 종가·등락률을 가능한 범위에서 보완합니다. 원·달러 환율은 `USDKRW=X` fallback으로 붙입니다. Toss Open API provider와 `/exchange-rate` 보조 경로는 0.1 사용자 표면에서 제외되며 `FOLIO_ENABLE_TOSS_OPEN_API=1`을 켠 내부 검증에서만 실행됩니다. provider가 실패하면 “입력 자료에서 한국장 종가 등락률은 확인되지 않는다”고 명시하고 수치를 추정하지 않습니다.

저장된 브리핑 `stats`에는 자료 부족/코드 문제를 구분하기 위한 세션 카운트가 포함됩니다: `krCurrentIntradayDocCount`, `usPrevRegularDocCount`, `krPrevRegularDocCount`(+ `analysisMode`). 한국 D 장중이 약한데 `krCurrentIntradayDocCount`가 0이면 자료 부족, 충분한데도 약하면 프롬프트/선별 문제로 진단합니다.

## 자료 선별과 시장 동인 그룹화

브리핑 자료 선별 로직은 `features/daily_briefing/selection.py`에 분리되어 있습니다. 인덱싱용 `marketRelevance`와 회사/섹터 기준 `group_docs()`는 그대로 두고, 브리핑 전용 로직만 담습니다.

- `briefing_doc_score(doc, market_windows)`: "이 자료가 오늘 브리핑에서 얼마나 쓸 만한가" 전용 점수. 출처 신뢰도, 시장 시간창 적합성, 시장 관련성, 본문 품질, 영향/섹터/회사 태그, **시장 반응 연결성**, **broad keyword 단발 기사 감점**, RSS 헤드라인 감점을 합산합니다.
- `market_connection_score(doc)`: 자료가 실제 시장 가격/지수/수급 반응과 직접 연결되는지(지수명·등락·수급 신호·회사+섹터)를 점수화합니다. driver 키워드(금리·채권·달러 등)만 스친 단발 기사(개별 채권 발행·펀드·trivia·거시 단신)는 0에 가깝게 나와 참고자료 상단에서 밀려납니다.
- `effective_market_relevance(doc)`: 직접 저장 article이 인덱싱 단계에서 `marketRelevance=100`으로 고정되는 과대평가를, 시장 신호(회사/섹터/영향 태그)가 거의 없으면 브리핑 선별 단계에서만 보수적으로 낮춥니다. 인덱싱은 건드리지 않습니다.
- 미국장 브리핑에서는 Reuters/WSJ/Financial Times/Bloomberg 같은 foreign core source를 우선합니다. 한국 source의 미국장 기사도 사용할 수 있지만 `source_profile()`에서 미국장 전문성 점수를 낮게 두어, foreign/core source나 시장 데이터로 확인되지 않은 한국 source 기사가 미국장 결과물을 주도하지 않게 합니다.
- `infer_drivers(doc)` / `DRIVER_TERMS`: 문서를 금리, 환율/달러, 반도체/AI, 원자재/유가, 수급, 정책/규제, 실적/가이던스, 중국/글로벌 경기, 지정학 동인으로 추론합니다.
- `derive_market_drivers(docs, market_windows, limit=4)`: 문서를 시장 동인 기준으로 묶습니다. 출처 다양성과 미국·한국 양쪽 시간대에 걸친 동인 여부를 가산합니다. 자료 수가 많은 동인이 곧 중요한 동인은 아니라는 점을 점수 설계에 반영합니다.
- `prioritize_briefing_groups(groups, market_windows)`: 주도 기업/섹터 그룹을 브리핑 모드에 맞게 재정렬합니다. 주말/휴장 모드에서는 `off_session_news`를 가진 그룹이 먼저 오도록 보정합니다.
- `briefing_doc_excerpt(doc, clean_fn, tier)`: `driver`(1200자) / `group`(850자) / `support`(450자) tier로 발췌 길이를 차등합니다.

LLM 컨텍스트(`build_llm_context`)에는 `## 후보 이슈 묶음`보다 앞에 `## 핵심 변수 후보` 섹션이 추가되고(사용자 노출 용어 '핵심 변수' = 코드의 `market_drivers`), `## 기사/자료 원문 요약`의 각 자료에는 `자료등급`(핵심 변수 / 주도 기업·섹터 / 보조)이 붙어 tier별로 길이가 차등됩니다. 그룹 상위 자료와 패딩 자료 모두 `briefing_doc_score` 기준으로 뽑아, 출처만 유명하고 본문은 시장과 무관한 기사가 끼지 않게 합니다.

참고자료(`usedDocs`)는 각 자료에 **우선순위 라벨 `refTier`**를 부여해 정렬합니다.

```text
us_close          # 미국 D-1 정규장 마감 시황
kr_current_flow   # 한국 D 장중/마감 흐름
korea_market_data # KOSPI/KOSDAQ/수급/환율 직접 자료
semiconductor     # 반도체·소부장 흐름
macro_market      # 유가·지정학·금리·환율 자료
core_driver       # 핵심 변수에 쓰인 자료
leading_company   # 주도 기업 분석에 쓰인 자료
market_flow       # 지수·수급 등 시장 가격 반응과 연결된 자료
support           # 나머지 보조 자료
```

`(refTier, briefing_doc_score, date)` 순으로 정렬하므로, 미국 마감→한국 당일 흐름/시장 수치→반도체→유가·지정학·금리 순서의 자료가 상단에 오고, driver keyword만 스친 단발 기사는 뒤로 밀립니다. 저장된 브리핑의 `sources`에도 `refTier`가 남습니다.

저장된 브리핑 JSON의 `stats`에는 `driverCount`, `topDrivers`, `sourceCount`가 기록됩니다.
Step 6 Data Foundation Lite 이후 저장 JSON에는 공통 구조화 필드 `checkpoints`, `dataGaps`, `marketTape`도 포함됩니다. 이 필드는 대시보드/품질 평가가 markdown 파싱 없이 읽기 위한 별도 필드이며, 기본 브리핑 markdown은 변경하지 않습니다.
Step 7 Research Quality 이후 저장 JSON에는 규칙 기반 `quality` 필드도 포함됩니다. 기존 저장 브리핑은 조회 시 `quality`가 없으면 자동 평가해 백필합니다. 평가는 sourceLedger가 없는 브리핑의 한계를 warning으로 남기며, markdown 본문은 변경하지 않습니다.
Step 11 Quality Generation 이후 생성 API는 `qualityMode`(`diagnose_only` 기본, `llm_section_improve`, `strict`)를 받을 수 있습니다. 생성 전에는 브리핑용 품질 목표(articles/rss 우선, 미국장/한국장 기준일, marketTape, 반론, 체크포인트, Source & Data Notes)와 evidence coverage preflight를 LLM 컨텍스트에 주입합니다. `llm_section_improve`는 품질 평가에서 약한 섹션만 기존 근거 범위 안에서 LLM으로 최대 1회 재작성하고, `strict`는 A-/85점 기준의 엄격 검토 경고를 추가합니다. `qualityGeneration`에는 preflight, weakSections, token/evidence telemetry, 보강 전후 점수를 저장합니다.

## 프롬프트

```text
features/daily_briefing/prompt_us.md
features/daily_briefing/prompt_kr.md
```

미국장과 한국장 프롬프트는 물리적으로 분리되어 있다. `marketScope=us`는 `prompt_us.md`, `marketScope=kr`는 `prompt_kr.md`만 사용한다. `marketScope=both`는 두 시장을 각각 생성/검증하기 위해 두 프롬프트를 구분해 함께 전달한다. 기존 `prompt.md`는 legacy/fallback 호환용이다.

프롬프트 원칙:

- 특정 개인 포트폴리오 대응이 아니라 일반 투자자용 공개형 시장 해설을 지향
- **하루를 하나의 이야기로 엮는 서술이 최우선.** 섹션 구조는 뼈대일 뿐 채워야 할 양식이 아니며, "무슨 일이 있었나/왜 중요했나/..." 같은 내부 점검 항목을 출력에 굵은 라벨로 반복 노출하지 않는다.
- 핵심 동인은 기본 3개(정말 중요한 독립 동인이 있을 때만 4개), 약한 변수는 보조 변수로 시장 흐름·체크포인트에서만 언급
- 결론의 핵심 변수는 핵심 1개 + 보조 1~2개로 압축
- 출력 구조: 0. 오늘의 시장 성격 / 1. 시장 흐름 / 2. 시장을 움직인 핵심 변수 / 3~4. 주도 기업 / 5. 일반 투자자 관점 / 6. 내일 확인할 체크포인트 / 오늘의 결론
- **시장 흐름 섹션은 핵심 수치 앵커(지수·ETF·금리·환율·유가 등)를 먼저 제시한 뒤 그 수치로 장의 성격을 해석한다.** 숫자 나열이 아니라 "핵심 수치 → 장의 성격 → 미국·한국 연결/차별화" 순서. 수치가 없으면 추정하지 말고 명시. `build_llm_context`의 `## 시장 수치 사용 지침`이 이를 유도하고, 규칙 fallback은 `market_snapshot`과 `korea_market_data`를 받아 수치 표를 직접 넣는다.
- `## 한국장 시장 수치`에는 가능한 경우 KOSPI/KOSDAQ/KOSPI200 종가·등락률·거래대금, 투자자별 수급, 주요 업종, 원·달러 환율이 들어간다. `weekday_kr_open` 모드에서 KOSPI/KOSDAQ 종가 등락률이 확인되면 시장 흐름은 가능한 한 “한국장은 KOSPI가 전일 대비 X%, KOSDAQ이 Y%로 마감했다...” 형식을 따른다.
- **시장 스냅샷 날짜 정합성**: yfinance 일봉은 당일 EOD가 늦게 반영돼, 거래 캘린더상 미국 정규장 기준일(`usRegularSessionDate`)보다 스냅샷 데이터가 하루 이전일 수 있다(예: 6/10 브리핑인데 스냅샷 미국 주가가 6/8 종가). `snapshot.py`는 각 종목의 실제 일봉 날짜 `asOfDate`와 미국 주식 기준 `latestUsEquityDate`를 저장하고, `snapshot_staleness_note()`가 스냅샷 기준일이 정규장 기준일보다 이전이면 "이 수치는 N일 종가이니 정규장 결과로 제시하지 말라"는 경고를 LLM 컨텍스트(와 규칙 fallback)에 넣는다. 마감 수치는 로컬 기사를 1순위로 쓰고 스냅샷은 보조·교차검증용.
- 로컬 자료 우선, 웹 검색은 부족한 시장 데이터나 가격 반응 해석 보완에만 사용
- 시장 가격 스냅샷은 지수/금리/유가/달러/크레딧 해석 보조로만 사용
- (참고: `Market Tape`는 한국어 독자에게 어색해 `시장 흐름`으로 변경. 코드 내부 변수명은 유지)
- 누적된 시장 흐름 요약은 오늘 뉴스가 기존 흐름의 연장인지 판단하는 배경으로 사용
- 미국장과 한국장의 시간차를 명시적으로 고려
- 단순 링크/뉴스 나열이 아니라 시장 성격·핵심 동인·작동 경로·다음 확인점 중심
- "확인할 필요가 있다" 류 표현은 구체적 확인 대상을 붙여서만 사용

## 규칙 기반 fallback

LLM 키가 없거나 호출이 실패하면 `build_prompt_markdown()`이 규칙 기반 브리핑을 생성한다. fallback도 LLM 브리핑과 동일한 출력 구조(0. 오늘의 시장 성격 / 1. 시장 흐름 / 2. 시장을 움직인 핵심 변수 / 3~4. 주도 기업 / 5. 일반 투자자 관점 / 6. 내일 확인할 체크포인트 / 오늘의 결론)를 따른다. 단 LLM 수준의 긴 분석이 아니라 간결한 규칙 기반 요약이다. `market_drivers`가 있으면 '시장을 움직인 핵심 변수' 섹션에 우선 사용하고, 없으면 회사/섹터 그룹으로 대체한다. `market_snapshot`과 `korea_market_data`가 있으면 시장 흐름 섹션에 수치 표를 직접 넣는다.

## 조립식 브리핑

브리핑 작업 화면은 `시장 범위(종합/미국장/한국장)`와 `브리핑 유형(기본/시황 중심/간단 요약)`만 노출한다. 세부 섹션은 모든 유형에서 고정하며 기본값은 `종합 + 기본`이다. 선택값은 API Key 설정과 분리된 브라우저 `localStorage`에 저장되고 오늘 생성과 날짜 지정 생성에 동일하게 적용된다.

- `기본`: 현재 전체 구성과 분량을 유지한다.
- `시황 중심`: 기존 섹션을 유지하면서 지수·금리·환율·수급·시장 폭·섹터 내부 흐름의 해석 비중을 높인다.
- `간단 요약`: 기존 섹션과 한 줄 결론·가운뎃점 요약을 유지하되 줄글을 압축한다.

API, Agent CLI, 규칙 기반 fallback은 같은 `briefingType` 계약을 사용한다. CLI의 `concise` 최소 분량은 시장당 2,500자이고 다른 유형은 시장당 5,000자다.

## 저장 위치

```text
data/briefings/YYYY-MM-DD.json
data/briefings/YYYY-MM-DD.visuals.json
data/briefings/YYYY-MM-DD.visuals.json.gz
```

신규 가격 시계열은 보고서 JSON의 `visualSnapshots`에 저장하고, 종목 수가 많은 시장 히트맵 rows는 날짜별 `.visuals.json.gz` 사이드카에 저장한다. `.visuals.json`은 legacy 읽기 전용으로 유지한다. 브리핑 화면은 과거 보고서를 열 때 이 저장 데이터만 사용하므로 이후 시세가 바뀌어도 생성 당시 차트가 달라지지 않는다.

## 생성 당시 시장 시각자료

- Lightweight Charts 5.2.0: 지수·기업 이름과 가격·등락폭을 크게 표시하고 한 번에 한 대상만 전체 너비로 그린다. 기본은 `1D + 라인`이며 `1D·1M·3M·YTD·1Y`와 라인·캔들을 전환한다.
- Plotly: 섹터→산업→종목 계층의 전체 시장 treemap을 그린다. KR처럼 산업명이 섹터명과 같은 경우는 중복 단계를 생략해 섹터→종목으로 표시한다. 면적은 시가총액, 색은 일간 등락률이다. viewport에 가까워질 때 lazy render하고 export 직전에는 렌더를 보장한다.
- 1D 5분봉이 없으면 일봉으로 가짜 1D를 만들지 않고 데이터 없음 상태를 표시한다.
- 차트 카드에는 기준일, provider, freshness, coverage를 함께 표시한다.
- 주도 기업 차트는 기사 그룹의 사전 후보가 아니라 최종 Markdown의 `주도한 기업 ①·② — 기업명` 제목을 company master·aliases로 해석해 수집한다. 기업 해석이나 시세 수집에 실패하면 다른 기업 차트를 대신 표시하지 않는다.
- 시장 흐름 섹션 제목 직후에는 해당 시장 지수 차트와 전체 히트맵을, 주도 기업 ①·② 섹션 제목 직후에는 해당 기업 차트를 삽입한다. 삽입은 렌더링된 DOM에서만 수행하며 Canonical Markdown은 바뀌지 않는다.
- HTML은 inline PNG, Obsidian은 Vault의 `Briefings/assets/`, Notion은 기존 imgbb 설정이 있을 때 PNG 이미지로 내보낸다. 이미지 경로가 없어도 Canonical Markdown은 그대로 내보낸다.
- 브라우저 캡처 이미지는 `market` 메타데이터를 함께 전달한다. `both` 브리핑을 Obsidian/Notion으로 내보낼 때는 미국장/한국장 단위로 분리하고, 각 노트·페이지에는 해당 시장 차트만 포함한다. HTML 복사는 단일 문서를 유지하되 차트 이미지를 inline PNG로 바꿔 붙여넣기 가능하게 만든다.
- Lightweight Charts의 Apache 2.0·TradingView attribution은 `THIRD_PARTY_NOTICES.md`와 사용자 화면에 유지한다.

### 생성 당시 / 현재 시장

브리핑 화면의 시각자료는 **생성 당시 immutable snapshot만** 보여준다. 과거 화면에 있던 `현재 시장` 토글은 제거했다. `현재 시장`은 저장 universe 전체(미국 수백 종목 + 한국 KOSPI 200)를 매번 라이브로 재조회해야 해서 토글을 누를 때마다 수십 초가 걸렸기 때문이다. 이는 캐싱으로 줄일 수 없는 구조적 비용이라, 인라인 브리핑은 빠른 저장 snapshot 전용으로 두고 현재 시장은 추후 별도 대시보드 위젯에서 제공한다.

- 생성 당시 보기는 보고서 JSON과 날짜별 시각 sidecar만 읽는다.
- 현재 시장 조회용 백엔드(`GET /api/briefings/{date}/visuals/current`)와 비교 로직(`load_current_visuals`)은 그대로 보존한다. 향후 대시보드 위젯이 read-only로 재사용한다. yfinance는 실시간 체결가가 아니므로 `snapshot`, `delayed`, `stale`, `unavailable`과 장 상태를 구분한다.
- 이 경로는 보고서 JSON과 `.visuals.json(.gz)`을 쓰지 않는 read-only 경로이며, 종목은 생성 당시 종가 대비 변화율, 히트맵은 섹터 성과 순위 변화를 비교로 제공한다.

저장된 JSON에는 디버깅용 `marketDrivers`(driver/score/markets/sources/tags/sectors/docCount), `koreaMarketData`, 그리고 `stats.driverCount`, `stats.topDrivers`, `stats.sourceCount`, `stats.koreaMarketDataOk`가 포함된다.

## 테스트와 검증

```powershell
# 단위 테스트(자료 선별/동인 그룹화/LLM context/참고자료 정렬/fallback 안전성)
py -3 -m features.daily_briefing.tests.test_briefing

# 브리핑 시황·시각화 고도화 Step 0 계약 테스트
py -3 -m features.daily_briefing.tests.test_contracts

# 실제 인덱스로 생성 경로 검증(기본 dry-run: data/ 와 메모리 DB 미변경)
py -3 -m features.daily_briefing.tests.verify_briefing            # 규칙 fallback
py -3 -m features.daily_briefing.tests.verify_briefing --llm      # LLM 경로(키/네트워크 필요)
py -3 -m features.daily_briefing.tests.verify_briefing --llm --persist  # 실제 저장까지
```

`build_briefing(..., persist=False)`는 결과만 반환하고 `data/briefings/`와 시장 메모리 DB에 쓰지 않으므로, 실제 서버에 저장하지 않고 출력 품질을 확인할 때 사용한다.

### 브리핑 고도화 Step 0 계약

`schema.py`는 향후 시장 범위·브리핑 유형·세션·freshness·본문 가용성·시장 반응 상태 enum과 시각 스냅샷 최소 메타데이터를 코드에서 고정한다. `normalize_briefing_contract()`는 기존 저장 브리핑의 Canonical `markdown`과 `personalOverlay`를 바꾸지 않고 신규 구조화 필드의 빈 기본값만 제공한다.

`contracts.py`와 `tests/fixtures/`는 현재 active prompt 섹션·규칙, 기존 JSON 필드, 시장 캘린더 모드, 출처 편중 baseline, issue clustering 평가용 50건 synthetic label을 고정한다. 편중 baseline에는 집계 수치만 있고 기사 제목·URL·로컬 파일 경로는 저장하지 않는다. 실제 시장 분리·출처 편향 개선은 Step 1에서 구현한다.

## 참고자료 링크 주의사항

브리핑 참고자료의 링크 텍스트(기사 제목)에 `[`나 `]` 문자가 포함된 경우 Markdown 링크 구문이 깨질 수 있습니다. `[외신 에스프레소]` 형태의 한국경제 등 매체 제목이 이에 해당합니다. `_escape_md_link_text()`는 링크 텍스트의 대괄호를 제거해 클릭 가능한 Markdown 링크 형태를 유지합니다. 프론트엔드는 `## 참고자료` 섹션 안에 실제 Markdown 링크가 없으면 저장 JSON의 `sources`/`headlines.sources`로 참고자료 패널을 보강합니다.

## 브리핑 회귀 체크리스트

차트·참고자료·시장별 저장/목록을 수정한 뒤에는 아래를 고정 회귀로 확인합니다.

- 저장본 열기: 기존 `{date}.json`과 신규 `{date}.us.json`/`{date}.kr.json` 모두 브리핑 본문이 열린다.
- 미국 시장 차트: 선택 strip이 `S&P 500 → Nasdaq → Dow Jones` 순서이며, `Nasdaq`은 `^IXIC` Nasdaq Composite 값을 표시한다.
- 차트 기준일: 저장 snapshot의 `marketSessionDate`와 hover 날짜가 4자리 연도(`YYYY-MM-DD HH:mm`)로 표시된다.
- 1D 수치: 헤더의 등락률은 5분봉 첫/마지막 값이 아니라 일봉 전일 종가 대비로 계산된다.
- Hover tooltip: 가격 차트에 마우스를 올리면 날짜, 가격, 등락폭/등락률이 함께 표시되고 카드 밖으로 크게 벗어나지 않는다.
- 주도 기업 차트: `시장을 주도한 기업 ①·②`처럼 시장명이 빠진 제목도 company master 기준으로 해당 기업 차트를 표시한다.
- 히트맵: 미국은 S&P 500, 한국은 KOSPI 200 구성종목 중심으로 보이며 KR 중복 sector/industry 라벨은 한 단계로 접힌다.
- 참고자료 링크: `## 참고자료` 섹션의 Markdown 링크가 클릭 가능하고, 링크 없는 섹션이면 저장 JSON sources 패널이 보강된다.
- 목록 피드: 카드 클릭 시 브리핑 보기(본문·차트·히트맵·참고자료)가 브리핑 탭 본문 자리의 인라인 리더로 열린다.
- 내보내기: Obsidian/Notion/HTML 내보내기가 시각자료 부재에도 본문을 실패 없이 내보낸다.
- 모바일: 390px 안팎 폭에서 차트 controls, tooltip, 히트맵, 참고자료, 목록 필터가 가로 overflow 없이 조작된다.

## 날짜 계산 주의사항

- `select_briefing_docs()`는 먼저 `briefing_market_windows(date)`로 source_dates를 계산한다.
- 인덱스에 source_dates 해당 문서가 없으면 가장 최근 문서로 fallback하지만, `market_windows`는 원래 브리핑 날짜 기준으로 유지한다.
- **공휴일/주말 fallback 버그**: fallback 시 문서 날짜로 `market_windows`를 재계산하면 `krPreviousSessionDate`가 잘못된 날짜를 가리키는 문제가 있었다. 수정됨.

## 관련 코드

- `features/daily_briefing/service.py`: `select_briefing_docs()`, `build_llm_context()`, `generate_llm_briefing()`, `build_prompt_markdown()`
- `features/daily_briefing/selection.py`: `briefing_doc_score()`, `derive_market_drivers()`, `infer_drivers()`, `briefing_doc_excerpt()`
- `features/common/market_calendar.py`: `briefing_market_windows()`, `doc_market_bucket()`
- `features/common/market_data/providers.py`: `MarketDataProvider`, `fetch_korea_market_data()`
- `app.py`: `build_briefing()` (orchestration — `derive_market_drivers()` 호출 후 `generate_llm_briefing()`에 전달)
- `public/app.js`: `renderBriefing()`, `openBriefingReader()`/`closeBriefingReader()`(인라인 리더), `applyBriefingReaderHash()`(해시 라우팅), `refreshActiveBriefingVisuals()`
- `public/briefing-visuals.js`: `renderInline()`, `relayout()`(리더 폭 확정 후 차트/히트맵 리사이즈)

## API

```text
GET  /api/briefings
GET  /api/briefings/index
GET  /api/briefings/YYYY-MM-DD
GET  /api/briefings/YYYY-MM-DD/visuals
GET  /api/briefings/YYYY-MM-DD/visuals/current
POST /api/briefings
POST /api/briefings/{date}/export-notion
```

`POST /api/briefings`는 `date`, `strictDate`, `webSearch` 값을 받을 수 있습니다.

`GET /api/briefings/index`는 시장별 아카이브 메타 목록을 `{items,total,offset,limit,warnings,cache}` 형태로 반환합니다. `q`, `marketScope`, `briefingType`, `dateFrom`, `dateTo`, `offset`, `limit` 필터를 지원합니다. 메모리 캐시는 30초 TTL과 파일 `mtime_ns`·크기를 사용해 변경된 날짜 JSON만 다시 읽으며, 조회 과정에서 보고서 JSON을 쓰거나 별도 영구 인덱스를 만들지 않습니다.

`DELETE /api/briefings/{date}?market=us|kr`는 신규 시장별 저장 파일(`{date}.us.json`/`{date}.kr.json`)과 해당 시장 시각자료 사이드카만 삭제하고 아카이브 캐시를 즉시 갱신합니다. `market`을 생략하면 날짜 전체 삭제로 동작해 레거시 `{date}.json`과 양쪽 시장 파일·사이드카를 함께 삭제합니다. 기존 레거시 `{date}.json`만 있는 날짜는 시장 단위로 분리 삭제할 수 없으므로 날짜 전체 삭제 안내를 표시합니다. 잘못된 날짜/시장 형식은 400, 없는 파일은 404를 반환합니다.

프론트엔드 브리핑 탭은 **하나의 화면으로 통합**되어 있습니다(과거의 `생성`/`목록` 하위 탭과 좌측 사이드바 하위 탭은 제거). 위쪽에 생성 컨트롤, 아래쪽에 저장된 브리핑 피드가 함께 있습니다.

생성 박스는 단일 패널 `브리핑 설정`(시장 범위 세그먼트 + 브리핑 유형·품질 모드)과 하단 액션 바(`자료 다시 읽기` → `오늘 브리핑 생성` → 날짜 입력 → `이 날짜로 생성`)로 구성됩니다. 생성 방식은 설정 탭의 AI Agent 정책을 따릅니다. 저장된 브리핑 피드는 `/api/briefings/index`를 사용해 최신순 카드, 시장·유형·날짜·텍스트 필터, 페이지네이션, `시장별/날짜별` 보기 모드를 제공합니다. 카드는 제목·기준일·생성 시각만 노출하며, 각 카드의 휴지통 버튼으로 해당 날짜 브리핑을 삭제할 수 있습니다. 종합(`both`) 브리핑은 카드 1개로 표시되는 것을 목표로 합니다(연결 분석은 별도 추적 계획 참조).

종합(both) 브리핑은 미국장·한국장 본문을 그대로 두고, 두 시장을 잇는 **한미 시장 연결 분석**(공통 흐름·시장별 고유 동인·스필오버·한계)을 별도 사이드카 `data/briefings/{date}.link.json`에 저장합니다(`features/daily_briefing/link_analysis.py`, LLM 없이 규칙 기반으로 동작). LLM이 켜져 있으면 `service.llm_enhance_link_analysis()`가 규칙 초안을 시나리오·반론까지 심화하되, 새 수치·출처를 만들지 않고 `### 한계와 불확실성`을 강제하며, 실패·무효 출력이면 규칙 본문으로 안전하게 되돌립니다(`llmEnhanced` 플래그로 표시). 결합 뷰를 읽을 때(`resolve_briefing(..., "both")`) 이 연결 분석이 본문 최상단에 결합되며, per-market 저장 파일과 각 시장 Canonical 본문은 변경되지 않습니다. 날짜 전체 삭제 시 `{date}.link.json`도 함께 삭제됩니다.

브리핑은 **생성 결과든 카드 클릭이든 모두 인라인 리더**로 브리핑 탭 본문 자리에서 열립니다(팝업 아님). 리더가 열리면 목록/생성 패널은 숨고, 상단 브레드크럼(`브리핑 › {날짜} {시장} 브리핑`)·Escape·브라우저 뒤로가기로 목록에 돌아옵니다. URL 해시 `#briefing/{date}/{us|kr|both}`로 새로고침·딥링크가 복원됩니다. 리더가 보여 폭이 잡힌 뒤 차트(Lightweight Charts)·히트맵(Plotly)을 렌더·리사이즈해 숨김 컨테이너 0폭 문제를 방지합니다. Personal Overlay와 내보내기(Obsidian/Notion/HTML) 액션은 리더 좌측 레일에서 동작하며, 우측 투자 노트 패널·AI 도크와 한 화면에 나란히 배치됩니다.

`POST /api/briefings/{date}/export-notion`은 저장된 브리핑을 Notion 데이터베이스 페이지로 내보냅니다. `NOTION_TOKEN`과 `NOTION_DB_ID`가 설정되어 있어야 합니다.

`GET /api/briefings/{date}/visuals`는 저장된 과거 히트맵 sidecar만 반환하며 현재 시세를 다시 조회하거나 보고서 JSON을 수정하지 않습니다.

`GET /api/briefings/{date}/visuals/current`는 저장된 종목 universe를 최신 무료 일봉으로 조회한 임시 응답을 반환합니다. 저장 보고서와 sidecar에는 쓰지 않으며, yfinance가 설치되지 않았거나 조회에 실패하면 `unavailable`과 warning을 반환합니다.


