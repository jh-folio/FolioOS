# features/common

여러 화면과 기능이 공유하는 자료 기반, 품질/근거성 레이어, 시장 데이터, Python 유틸리티 모음입니다.

## 주요 모듈

| 파일 | 역할 |
| --- | --- |
| `taxonomy.py` | 태그 canonical 어휘 단일 정의 |
| `markets.py` | `US | KR | EUROPE | JP | GLOBAL | UNKNOWN` 시장·브리핑 scope 단일 계약 |
| `instruments/` | 거래소·suffix·공식 식별자를 보존하는 cross-market instrument identity 계약 |
| `company_lookup.py` | 기업명/티커 정규화, SEC CIK 조회, 마스터 데이터 |
| `utils.py` | 텍스트 정규화, JSON 읽기/쓰기, 날짜 유틸 |
| `dataframe_ops.py` | Polars 기반 필터링, 정렬, 집계 |
| `market_calendar.py` | 브리핑 날짜 계산, 시장별 세션 기술자(`marketSessions`) |
| `exchange_holidays.py` | LSE/Xetra/Euronext/Borsa Italiana/BME/JPX 연간 휴장일 표와 거래소별 개장 판정 |
| `market_data/providers.py` | provider 기반 시장 데이터 인터페이스와 한국장 수치 조회 |
| `market_data/europe_core_universe.py` | FTSE 100+DAX+CAC 40+AEX 합성 유럽 히트맵 universe와 EUR 환산 |
| `market_data/nikkei225_universe.py` | 닛케이 225 히트맵 universe |
| `research_library/` | 자료 폴더 계약, RSS 수집, 증분 인덱싱, 하이브리드 검색 |
| `research_schema/` | checkpoint/evidence/sourceLedger/dataGap 공통 스키마 |
| `research_quality/` | 저장 산출물의 source grounding, hallucination risk, personal bias risk 평가 |
| `quality_generation/` | 생성 전 품질 목표, preflight, 약한 섹션 1회 보강, telemetry |
| `data_reliability/` | 공식자료 우선순위, provider 상태, 한국 수동 데이터 보강 경로 |

## market_calendar.py / exchange_holidays.py

`briefing_market_windows()`는 기존 `us*`/`kr*` 키를 그대로 두고, 시장별 세션을 `marketSessions.{us,kr,europe,jp}`에 따로 담습니다. 기존 소비자가 읽는 모양을 바꾸지 않기 위해서입니다.

시장마다 한국시간 기준 성격이 달라 세션 기준일 규칙이 다릅니다.

- **미국·유럽**: 한국시간 자정 이후에 마감하므로 브리핑일 `D`의 세션은 `D` 아침에 아직 끝나지 않았습니다. 항상 직전 완료 세션을 씁니다.
- **한국·일본**: JST가 KST와 같은 시간대라 두 장이 나란히 흐릅니다. 생성 시각(`as_of`)으로 `pre_open | intraday | closed`를 가르고, 마감 후에만 브리핑일을 세션일로 씁니다.

`exchange_holidays.py`는 각 거래소가 공시한 연간 휴장일을 전사한 표입니다(NYSE·KRX·FOMC와 같은 방식).

- **유럽은 하나의 캘린더가 아닙니다.** 영국 은행휴일은 LSE만 닫고 Euronext·Xetra는 열립니다. 주현절은 반대로 마드리드만 닫습니다. 이런 날이 연 십여 일 있어 `divergent`/`openVenues`/`closedVenues`로 갈린 상태를 그대로 보고하고, 지역 `isOpen`은 한 곳이라도 열리면 참입니다.
- **표가 없는 연도는 추측하지 않습니다.** `coverage_expired`를 반환하고 개장으로 간주하지 않습니다. 새 연도 공시가 나오면 `EXCHANGE_HOLIDAYS` 표만 갱신합니다.

## 히트맵 universe (S&P 500 / KOSPI 200 / 유럽 / 닛케이 225)

네 시장 모두 같은 방식입니다. **구성종목 명단은 위키백과**에서 받아 `config/*_constituents.json`에 커밋하고, 런타임에는 일봉 시세만 조회합니다. 새 연도/분기 갱신은 각 모듈의 `__main__` 진입점으로 실행합니다.

```bash
py -3 -m features.common.market_data.europe_core_universe
py -3 -m features.common.market_data.nikkei225_universe
```

- **유럽에는 재배포 가능한 광역 구성종목 명단이 없습니다.** 그래서 계획이 허용한 국가지수 합성으로 만듭니다: FTSE 100 + DAX + CAC 40 + AEX(총 203종목, 에어버스·아르셀로미탈은 두 지수에 중복 등재되어 한 번만 남습니다). 유럽 선 차트와 같은 네 지수입니다.
- **시가총액을 통화 섞어 더하지 않습니다.** 런던 종목은 GBP, 나머지는 EUR로 오므로 빌드 시점에 EUR로 환산하고 사용한 환율을 파일에 기록합니다(`fxRates`). 환율을 모르면 1.0으로 가정하지 않고 그 종목을 뺍니다(`missingFx`). 산출물은 `weightBasis: market_cap_eur`를 달고 다니며, 히트맵 스냅샷도 이 값을 그대로 들고 갑니다.
- **섹터는 지수별 분류 대신 시세 provider의 분류를 씁니다.** 네 유럽 지수가 ICB·Prime Standard·GICS 하위산업을 제각각 쓰기 때문입니다. 네 어휘로 동시에 묶은 히트맵은 묶음이 아닙니다.
- **일본 증권코드는 영숫자입니다.** 2024년부터 `285A`(키오시아) 같은 코드가 쓰여 숫자 4자리만 받으면 신규 편입 종목이 조용히 빠집니다.
- provider 실패는 마지막 정상 스냅샷으로 되돌아가고 `stale`로 표시합니다. 캐시도 없으면 `unavailable`입니다 — 빈 히트맵과 무변동 장세는 화면에서 구분되지 않기 때문입니다.

## market_data/providers.py

브리핑이 기사 표현에만 의존하지 않도록 시장 데이터 provider 경계를 둡니다.

- `MarketDataProvider`: 날짜별 시장 수치를 가져오는 인터페이스입니다.
- `TossOpenApiKoreaMarketProvider`: 0.2 사용자 표면에서는 숨긴 내부 검증 adapter입니다. `FOLIO_ENABLE_TOSS_OPEN_API=1`이 켜진 경우에만 설정 상태를 확인하고, 공식 OpenAPI에서 KOSPI/KOSDAQ aggregate 지수·투자자 수급 endpoint가 확인되지 않으면 경고를 남기고 다음 provider로 넘깁니다.
- `PyKrxKoreaMarketProvider`: `pykrx`가 설치되어 있으면 KOSPI/KOSDAQ/KOSPI200, 거래대금, 투자자별 수급, 주요 업종 등락률을 조회합니다.
- `YFinanceKoreaMarketProvider`: pykrx 미지원·실패 시 KOSPI/KOSDAQ 등 지수 종가·등락률을 가능한 범위에서 보완합니다.
- `fetch_korea_market_data(date)`: provider chain을 실행하고, 별도 FX 보조 경로로 원·달러 환율(`USDKRW=X`)을 붙입니다.

provider가 실패해도 호출자는 빈 payload와 warning을 받아야 하며, 보고서 생성 경로는 수치를 추정하지 않고 한계를 명시해야 합니다.

## taxonomy.py

모든 태그 어휘의 단일 출처(single source of truth)입니다.

```python
from features.common.taxonomy import normalize_tag, canonical_tag, canonical_industry
from features.common.taxonomy import TAG_ALIASES, CANONICAL_TAGS
```

### CANONICAL_TAGS

섹터 태그와 영향 태그 두 그룹으로 구성됩니다.

```python
CANONICAL_SECTOR_TAGS = [
    "Semiconductors", "AI", "Data Centers", "Battery",
    "Energy", "Defense", "Financials", "Automobiles",
]
CANONICAL_IMPACT_TAGS = [
    "규제", "금리", "환율", "공급망", "수급", "매출 성장", "마진",
]
```

### TAG_ALIASES

alias → canonical label 매핑입니다. 키는 소문자+언더스코어 형식을 권장합니다.

```python
TAG_ALIASES = {
    "semiconductor": "Semiconductors",
    "반도체": "Semiconductors",
    "tariff": "규제",
    "rate": "금리",
    ...
}
```

### normalize_tag()

태그 문자열을 canonical label로 정규화합니다. exact match → lowercase → lowercase+underscore 순으로 시도하고, 매칭되지 않으면 원래 값을 반환합니다.

```python
normalize_tag("semiconductor")  # → "Semiconductors"
normalize_tag("tariffs")        # → "규제"
normalize_tag("unknown")        # → "unknown"
```

### 태그 어휘 수정 규칙

- 새 canonical 태그: `CANONICAL_TAGS` 리스트에 추가
- 새 alias: `TAG_ALIASES`에 추가
- `research_library/indexing/service.py`의 `SECTOR_TERMS`/`IMPACT_TERMS` 키워드와 taxonomy canonical label이 일치하도록 유지할 것
