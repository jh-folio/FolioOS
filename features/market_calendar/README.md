# Market Calendar

경제지표·중앙은행·휴장일·실적·공시·배당 일정만 다룹니다. 개인 리서치 일정은 넣지 않습니다. `confirmed/actual`은 공식 발표·거래소·회사 IR·공시에서 확인된 경우에만 사용하며 yfinance 같은 제3자 예정치는 항상 `estimated`입니다.

정규화 이벤트는 `data/market-memory.sqlite3::market_calendar_events`에 저장하고 raw page/PDF는 보존하지 않습니다. 자동 refresh는 Agent를 호출하지 않습니다.

수집 구성(`refresh_calendar`):

- **휴장일·FOMC**: 공식 발표 연간 일정을 `adapters/exchange.py`(NYSE/KRX)와 `adapters/fed.py`(FOMC)에 전사해 등재합니다(confirmed + 공식 sourceUrl). 새 연도 일정이 공시되면 두 파일의 연도 표만 갱신합니다.
- **미국 지표 발표일**: `FRED_API_KEY`가 설정된 경우에만 `adapters/fred.py`가 allowlist release(CPI·고용·GDP·PCE·PPI·소매판매)의 발표 예정일을 수집합니다. 키가 없으면 provider 결과에 `fred_key_required`를 남기고 추정치를 만들지 않습니다.
- **실적·배당(estimated)**: 포트폴리오 + 워치리스트 티커를 대상으로 yfinance에서 수집합니다. 워치리스트의 회사 표시명은 `watchlist_notes.service.sec_ticker_for_name()`(SEC company_tickers 캐시, 절대 규칙 10)으로 티커를 해석합니다.
- **공시**: 로컬 filings의 실제 공시 이벤트.

화면(대시보드 캘린더 패널)은 주간 스트립/월간 그리드/날짜 드릴다운과 종류·시장·보유/관심 필터를 제공하고, 실적은 미 동부시간 기준 장전/장후/발표일 태그로 표시합니다. 보기/필터 상태는 `data/dashboard-settings.json`에 저장됩니다.

API: `GET /api/market-calendar`, `POST /api/market-calendar/refresh`.
