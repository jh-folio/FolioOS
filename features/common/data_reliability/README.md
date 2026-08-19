# Data Source Reliability

Data Source Reliability는 보고서와 Thesis Delta가 어떤 자료를 더 신뢰해야 하는지 판단하도록 돕는 공통 레이어입니다. 공식자료 우선순위, provider 상태, 한국 데이터 수동 보강 경로를 관리합니다.

## Shared fetch/cache runtime

`cache.py`, `fetch_runtime.py`, `macro_fetch.py`는 FRED/BOK와 공식자료 adapter가 함께 쓰는 semantic cache와 last-known-good 경계를 제공합니다. fresh cache hit는 upstream network를 호출하지 않습니다. 만료된 값은 제한된 stale-while-revalidate로 반환할 수 있고, 연속 실패 provider는 circuit breaker로 격리합니다. 반환에는 `asOf`, `fetchedAt`, `status`, `provider`, `fallbackReason`이 붙습니다. background refresh는 이미 commit된 보고서를 다시 쓰지 않습니다.

## 범위

- `source_priority.py`: 보고서 유형별 source priority와 reliability 라벨
- `official_materials.py`: `company_analysis` materials를 재사용해 SEC companyfacts/DART/10-K/10-Q/filings/reports를 evidence item으로 변환
- `provider_status.py`: market data provider 상태(`ok/degraded/failed/unknown`) 저장 모델
- `kr_data_import.py`: `research-inbox/market-data/*.csv` 수동 보강 파일 탐색과 dataGap 생성
- `cache.py`, `fetch_runtime.py`: semantic cache, timeout, circuit breaker, stale-while-revalidate
- `macro_fetch.py`: FRED/BOK bounded parallel fetch compatibility facade
- `international_market_capability_matrix.md`: 0.5 유럽 핵심 6개국·일본의 공식자료, 시장 피드, 캘린더, 대표지수, 접근·라이선스 판정

## 원칙

- 공식자료는 뉴스/RSS보다 우선한다.
- 같은 우선순위 그룹 안에서는 최신 자료가 앞에 온다(날짜 없는 항목은 그룹 뒤). 호출자가 앞에서부터 잘라 쓰기 때문이다.
- 점수화된 공시 문단은 문단마다 고유한 제목을 갖는다. 제목이 같으면 evidence 중복 제거에서 한 건으로 합쳐진다.
- 사용자 노트는 계속 hypothesis이며 evidence로 집계하지 않는다.
- 한국 데이터 자동 연동이 부족한 경우에는 `research-inbox/market-data/` 수동 CSV 경로와 `suggestedAction`을 제시한다.
- provider 실패는 보고서 생성을 막기보다 `dataGaps`와 quality warning으로 드러낸다.

## 수동 한국 데이터 경로

```text
research-inbox/market-data/
  krx_foreign_flows.csv
  sector_performance.csv
  bok_macro.csv
```

CSV 스키마는 엄격히 고정하지 않는다. Step 9 MVP는 파일 존재, 컬럼, 행 수를 감지해 향후 보고서 생성과 dataGap 보완 흐름에서 사용할 수 있게 한다.
