# Research Cockpit

Dashboard의 기본 모드는 `cockpit`입니다. initial payload는 로컬 change projection, 시장 일정 ref, provider health, native symbol과 기존 로컬 투자 맥락만 집계하며 upstream network나 chart series를 포함하지 않습니다.

`legacy` 모드는 기존 TradingView widget board를 한 릴리즈 동안 보존하는 rollback 경로입니다. 기존 `data/market-widget-settings.json`은 삭제하지 않고 `features/market_widgets/service.py`를 통해서만 읽습니다. 설정/Watchlist가 없으면 미국 `SPY`, 한국 `^KS11`을 사용합니다.

cockpit payload의 변화 이벤트는 `major_change | developing_signal | conflicting_uncertain`만 `changes`로 노출하고, 나머지(기준선·근거부족·변화없음)는 `quietChanges`(최대 8건)와 `changeCounts.quiet`로 분리합니다. `changeCounts`는 요약 스트립용 상태별 카운트입니다. implications는 포트폴리오와 워치리스트 티커(`sec_ticker_for_name` 이름 해석 포함)를 모두 매칭하고 `source: portfolio|watchlist`를 표기합니다.

`POST /api/dashboard/settings`는 기존 저장값과 merge 후 정규화합니다(부분 갱신이 다른 키를 초기화하지 않음). 저장 키: `dashboardMode`, `calendarView`, `calendarKind`, `calendarMarket`, `calendarWatchlistOnly`, `chartRange`, `chartSymbol`.

API: `GET /api/dashboard/cockpit`, `GET|POST /api/dashboard/settings`, `GET /api/dashboard/story-share?market=us|kr`. 기존 `GET /api/dashboard`는 그대로 유지합니다.

## 오늘의 이야기 비중 (story_share.py)

"무엇이 달라졌나" 패널 상단의 얇은 누적 막대와 범례입니다. 그날 수집된 articles/rss 시장 관련 문서 전체를 `infer_drivers()`로 묶어 상위 4개 + "그 외 이야기"의 언급 비중을 계산하고, 직전 거래일과의 %p 델타(`▲ +13%p`)를 붙입니다. 규칙 계산 전용이며 LLM을 호출하지 않습니다.

- 브리핑과 독립: 브리핑을 생성하지 않아도 계산되고, 브리핑용 상한 잘린 선별본이 아니라 그날 문서 전체(`select_briefing_docs(strict=True)`)를 씁니다. strict를 쓰는 이유는 두 날짜를 같은 잣대로 비교하기 위해서입니다(비-strict는 pool을 오늘까지 확장해 직전 거래일 계산을 오염시킴).
- 비중 이동은 보도량 변화일 뿐 내용 변화가 아니라는 경고 문장을 UI에 고정합니다. 내용 판정은 Change Intelligence의 의미 비교가 담당합니다.
- 응답은 (date, market) 키로 10분 캐시하고 RSS 수집 완료 시 `invalidate_story_share_cache()`로 비웁니다.

## 내용의 변화 카드

변화 피드는 `semanticVerdict` 칩(새 정보/방향 전환/흐름 진전/보도량 이동/변화 없음/내용 미평가)이 붙은 카드로 렌더링합니다. 카드 본문의 `펼치기`는 항목별 직전/현재 대조(순위·비중, 대표 기사 제목 양쪽)를 인라인으로 보여주고, `Agent에게 묻기`는 카드가 아는 사실(전/후 값·분류·근거 제목·기준 id)을 질문으로 만들어 우측 Agent dock을 엽니다(`openReactAgentDock`, 자동 제출 없음). 상세 데이터는 change 이벤트 payload(`changedItems[].contextDocs/previousContextDocs/semanticNote`)에 이미 실려 있어 별도 상세 API가 없습니다.
