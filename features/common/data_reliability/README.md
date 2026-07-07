# Data Source Reliability

Data Source Reliability는 보고서와 Thesis Delta가 어떤 자료를 더 신뢰해야 하는지 판단하도록 돕는 공통 레이어입니다. 공식자료 우선순위, provider 상태, 한국 데이터 수동 보강 경로를 관리합니다.

## 범위

- `source_priority.py`: 보고서 유형별 source priority와 reliability 라벨
- `official_materials.py`: `company_analysis` materials를 재사용해 SEC companyfacts/DART/10-K/10-Q/filings/reports를 evidence item으로 변환
- `provider_status.py`: market data provider 상태(`ok/degraded/failed/unknown`) 저장 모델
- `kr_data_import.py`: `research-inbox/market-data/*.csv` 수동 보강 파일 탐색과 dataGap 생성

## 원칙

- 공식자료는 뉴스/RSS보다 우선한다.
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
