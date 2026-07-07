# features/common

여러 화면과 기능이 공유하는 자료 기반, 품질/근거성 레이어, 시장 데이터, Python 유틸리티 모음입니다.

## 주요 모듈

| 파일 | 역할 |
| --- | --- |
| `taxonomy.py` | 태그 canonical 어휘 단일 정의 |
| `company_lookup.py` | 기업명/티커 정규화, SEC CIK 조회, 마스터 데이터 |
| `utils.py` | 텍스트 정규화, JSON 읽기/쓰기, 날짜 유틸 |
| `dataframe_ops.py` | Polars 기반 필터링, 정렬, 집계 |
| `market_calendar.py` | 브리핑 날짜 계산, 한미 시장 시간대 구분 |
| `market_data/providers.py` | provider 기반 시장 데이터 인터페이스와 한국장 수치 조회 |
| `research_library/` | 자료 폴더 계약, RSS 수집, 증분 인덱싱, 하이브리드 검색 |
| `research_schema/` | checkpoint/evidence/sourceLedger/dataGap 공통 스키마 |
| `research_quality/` | 저장 산출물의 source grounding, hallucination risk, personal bias risk 평가 |
| `quality_generation/` | 생성 전 품질 목표, preflight, 약한 섹션 1회 보강, telemetry |
| `data_reliability/` | 공식자료 우선순위, provider 상태, 한국 수동 데이터 보강 경로 |

## market_data/providers.py

브리핑이 기사 표현에만 의존하지 않도록 시장 데이터 provider 경계를 둡니다.

- `MarketDataProvider`: 날짜별 시장 수치를 가져오는 인터페이스입니다.
- `TossOpenApiKoreaMarketProvider`: 0.1 사용자 표면에서는 숨긴 내부 검증 adapter입니다. `FOLIO_ENABLE_TOSS_OPEN_API=1`이 켜진 경우에만 설정 상태를 확인하고, 공식 OpenAPI에서 KOSPI/KOSDAQ aggregate 지수·투자자 수급 endpoint가 확인되지 않으면 경고를 남기고 다음 provider로 넘깁니다.
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
