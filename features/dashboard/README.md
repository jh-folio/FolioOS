# Research Cockpit

Dashboard의 기본 모드는 `cockpit`입니다. initial payload는 로컬 change projection, 시장 일정 ref, provider health, native symbol과 기존 로컬 투자 맥락만 집계하며 upstream network나 chart series를 포함하지 않습니다.

`legacy` 모드는 기존 TradingView widget board를 한 릴리즈 동안 보존하는 rollback 경로입니다. 기존 `data/market-widget-settings.json`은 삭제하지 않고 `features/market_widgets/service.py`를 통해서만 읽습니다. 설정/Watchlist가 없으면 미국 `SPY`, 한국 `^KS11`을 사용합니다.

cockpit payload의 변화 이벤트는 `major_change | developing_signal | conflicting_uncertain`만 `changes`로 노출하고, 나머지(기준선·근거부족·변화없음)는 `quietChanges`(최대 8건)와 `changeCounts.quiet`로 분리합니다. `changeCounts`는 요약 스트립용 상태별 카운트입니다. implications는 포트폴리오와 워치리스트 티커(`sec_ticker_for_name` 이름 해석 포함)를 모두 매칭하고 `source: portfolio|watchlist`를 표기합니다.

`POST /api/dashboard/settings`는 기존 저장값과 merge 후 정규화합니다(부분 갱신이 다른 키를 초기화하지 않음). 저장 키: `dashboardMode`, `calendarView`, `calendarKind`, `calendarMarket`, `calendarWatchlistOnly`, `chartRange`, `chartSymbol`.

API: `GET /api/dashboard/cockpit`, `GET|POST /api/dashboard/settings`. 기존 `GET /api/dashboard`는 그대로 유지합니다.
