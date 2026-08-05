# Market Calendar

경제지표·중앙은행·휴장일·실적·공시·배당 일정만 다룹니다. 개인 리서치 일정은 넣지 않습니다. `confirmed/actual`은 공식 발표·거래소·회사 IR·공시에서 확인된 경우에만 사용하며 yfinance 같은 제3자 예정치는 항상 `estimated`입니다.

정규화 이벤트는 `data/market-memory.sqlite3::market_calendar_events`에 저장하고 raw page/PDF는 보존하지 않습니다. 자동 refresh는 Agent를 호출하지 않습니다.

수집 구성(`refresh_calendar`):

- **휴장일**: 공식 발표 연간 일정을 전사해 등재합니다(confirmed + 공식 sourceUrl). 미국·한국은 `adapters/exchange.py`의 `NYSE_HOLIDAYS`/`KRX_HOLIDAYS`, 유럽·일본은 `features/common/exchange_holidays.py`의 거래소별 표를 읽습니다. 유럽·일본 표는 브리핑 세션 판정과 캘린더가 **같은 표 하나**를 씁니다 — 두 곳에 적으면 반드시 갈라집니다.
- **유럽 휴장일은 거래소 단위입니다.** 런던·프랑크푸르트·파리(암스테르담·브뤼셀 공통)·밀라노·마드리드가 각각 이벤트를 만듭니다. 영국 은행휴일은 런던만 닫고 대륙은 열리며, 크리스마스 이브·연말은 프랑크푸르트와 밀라노만 닫습니다. "유럽 휴장" 한 줄로 묶으면 그런 날에 사실이 아닌 정보를 표시하게 됩니다.
- **중앙은행**: `adapters/fed.py`(FOMC)와 `adapters/central_banks.py`(ECB·BoE·BOJ)가 각 은행이 공시한 연간 일정을 전사합니다. 키가 필요 없습니다. 표가 없는 연도는 아무것도 만들지 않습니다 — 회의를 지어내지 않습니다.
- **미국 지표 발표일**: `FRED_API_KEY`가 있으면 `adapters/fred.py`가 allowlist release(CPI·고용·JOLTS·GDP·PCE·PPI·소매판매·산업생산·무역수지)의 확정 발표일을 수집합니다. 키가 없으면 아래 yfinance 경로가 추정 일정으로 대신 채우고 provider 결과에 `us_macro_source: yfinance_fallback`을 남깁니다.
- **한국 지표**: `BOK_API_KEY`가 있으면 `adapters/bok.py`가 ECOS 관측 이력에서 다음 발표일을 투영합니다(estimated).
- **유럽·일본 지표(estimated)**: `adapters/yf_economic.py`가 yfinance 경제 캘린더에서 키 없이 수집합니다. 제3자 집계이므로 항상 `estimated`이며, 지역·이벤트·날짜로 접어 중복을 제거합니다.
- **실적·배당(estimated)**: 포트폴리오 + 워치리스트 티커를 대상으로 yfinance에서 수집합니다. 워치리스트의 회사 표시명은 `watchlist_notes.service.sec_ticker_for_name()`(SEC company_tickers 캐시, 절대 규칙 10)으로 티커를 해석합니다.
- **공시**: 로컬 filings의 실제 공시 이벤트.

화면(대시보드 캘린더 패널)은 주간 스트립/월간 그리드/날짜 드릴다운과 종류·시장(미국·한국·유럽·일본)·보유/관심 필터를 제공하고, 휴장 칩은 시장이 아니라 거래소를 표시하며(`휴장 · 런던`), 실적은 미 동부시간 기준 장전/장후/발표일 태그로 표시합니다. 보기/필터 상태는 `data/dashboard-settings.json`에 저장됩니다.

API: `GET /api/market-calendar`, `POST /api/market-calendar/refresh`.

브리핑의 거래 세션 기준일 판정은 저장된 이벤트 목록과 별도로 `features/common/market_calendar.py`가 담당합니다. 연결된 Toss Open API 거래소 캘린더 응답을 정적 NYSE/KRX 휴장일 표보다 우선하며, API를 사용할 수 없거나 응답 날짜·형식 검증에 실패하면 정적 표로 fallback합니다.
