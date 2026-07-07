# Portfolio

포트폴리오 기능은 현재 보유 포지션을 입력해 평가 손익과 비중을 확인하고, 목표 포트폴리오 프리셋과 리서치용 백테스트를 관리한다.

## 담당 기능

- 현재 보유 포지션 입력
- 티커 기반 종목명, 시장, 통화, 섹터, 자산군 자동 매칭
- `yfinance` 현재가 기반 평가금액, 손익, 비중 계산
- KRW/USD가 섞인 포트폴리오의 USD 기준 환산 비중 계산
- 종목, 섹터, 시장/통화, 자산군, 손익 기여도 Plotly 시각화
- 목표 포트폴리오 프리셋 생성, 저장, 삭제
- 현재 포트폴리오를 프리셋 초안으로 불러와 비중/종목 수정
- 현재 포트폴리오와 목표 프리셋 비교
- 목표 대비 비중 차이, 금액 차이, 매수/매도 필요 수량 표시
- 프리셋 기반 리서치용 백테스트 실행, 선택 저장, 열기, 삭제
- 여러 포트폴리오 초안 간 비교 백테스트
- 백테스트 결과의 수익률, 위험/변동성, 위험조정 성과, 시장 민감도 지표 분류 표시
- 수익률 기여도, 변동성 기여도, 베타 기여도 분석
- 누적 성과, Drawdown, Rolling 12M Return, Rolling Volatility, Rolling Beta 시각화

Plotly 차트는 포트폴리오 뷰 또는 하위 탭이 활성화된 뒤 `public/app.js::schedulePortfolioChartResize()`로 다시 치수를 계산한다. 숨겨진 탭에서 먼저 렌더된 차트는 폭을 잘못 잡을 수 있으므로, 새 차트 추가 시 렌더 직후와 탭 전환 후 resize 경로를 유지한다.

## 화면 구조

포트폴리오 탭은 두 개의 하위 탭으로 나뉜다.

```text
현재 포트폴리오
프리셋 · 백테스트
```

### 현재 포트폴리오

티커, 수량, 평균단가만 입력한다. 종목명, 시장, 통화, 섹터, 자산군은 가능한 경우 `yfinance`에서 자동 조회한다.

한국 상장 종목은 `005930`, `442580`처럼 6자리 숫자를 입력하면 `.KS` 또는 `.KQ` 후보를 자동으로 시도한다. ETF나 일부 종목은 거래소 구분에 따라 조회 실패가 날 수 있다.

### 프리셋 · 백테스트

프리셋은 티커와 목표 비중만 입력해 저장한다. 저장 시 각 티커를 자동 매칭하고, 비중 합계가 100%에 가까운지 확인한다.

`현재 포트폴리오 불러오기`를 누르면 현재 평가 비중을 기준으로 프리셋 초안이 채워진다. 이후 사용자가 종목을 삭제하거나 비중을 수정한 뒤 새 프리셋으로 저장할 수 있다.

저장한 프리셋은 다음 용도로 쓴다.

- 현재 포트폴리오와 목표 비중 비교
- 매수/매도 필요 수량 계산
- 백테스트 입력 포트폴리오

백테스트는 과거 가격과 일자별 환율을 사용해 리서치용 성과를 계산한다. 실행 결과는 자동 저장하지 않는다. 화면에 표시된 결과가 보관할 만하다고 판단될 때 `결과 저장` 버튼을 눌러 저장한다. 비교 초안을 2개 이상 만든 경우에도 같은 방식으로 사용자가 선택한 비교 결과만 저장한다.

## 데이터 저장 위치

```text
data/portfolio.json
data/portfolio-presets.json
data/portfolio-backtests/
data/portfolio-price-cache/
data/portfolio-fx-cache.json
```

이 경로들은 사용자의 직접 입력값, 저장 결과, 가격 캐시를 포함한다. 명시 요청 없이 삭제하거나 초기화하지 않는다.

## API

```text
GET    /api/portfolio
POST   /api/portfolio
GET    /api/portfolio/summary
GET    /api/portfolio/analytics
GET    /api/portfolio/resolve?ticker=...

GET    /api/portfolio/presets
POST   /api/portfolio/presets
POST   /api/portfolio/presets/from-current
DELETE /api/portfolio/presets/{preset_id}

GET    /api/portfolio/backtests
POST   /api/portfolio/backtests          # 실행만 수행, 자동 저장하지 않음
POST   /api/portfolio/backtests/compare  # 비교 실행만 수행, 자동 저장하지 않음
POST   /api/portfolio/backtests/save     # 화면에 표시된 결과를 사용자가 선택 저장
GET    /api/portfolio/backtests/{backtest_id}
DELETE /api/portfolio/backtests/{backtest_id}
```

## ETF 섹터 분류

ETF는 `yfinance`가 종목 유형을 정확히 반환하지 못하는 경우가 많아 별도 분류 테이블을 사용합니다.

- `ETF_SECTOR_MAP`: 티커 → ETF 섹터 레이블 매핑. 주식(ETF), 채권(ETF), 금/원자재(ETF), 배당(ETF), 부동산(ETF), 레버리지/인버스(ETF), 통화(ETF) 분류를 사용합니다.
- `_ETF_NAME_KEYWORDS`: `yfinance` 종목명 기반 fallback 분류.
- 분류 우선순위: `ETF_SECTOR_MAP` → `yfinance` quoteType → 종목명 키워드 → 기존 저장값.
- 한국 숫자코드 ETF(예: 442580, 161510)는 `yfinance`가 `EQUITY`로 잘못 반환하는 경우가 있어 `ETF_SECTOR_MAP` 조회가 반드시 `infer_portfolio_asset_class()` 이전에 실행됩니다.
- 새 ETF를 추가하려면 `features/portfolio/service.py`의 `ETF_SECTOR_MAP`에 티커를 추가하세요.

## 계산 기준

- 현재가와 과거 가격은 `yfinance`를 사용한다.
- 가격 조회 실패 시 해당 행은 `확인 필요`로 표시하고 전체 화면은 계속 렌더링되어야 한다.
- KRW 자산은 환율을 반영해 USD 기준 평가금액과 비중을 계산한다.
- 목표 포트폴리오 비교의 매매 수량은 `목표금액 - 현재금액`을 현재가로 나누어 추정한다.
- 백테스트는 리서치용이며 실제 세금, 수수료, 슬리피지, 체결오차를 반영하지 않는다.
- 변동성 기여도는 일별 수익률 공분산을 활용한 대략적인 리스크 기여도이며, 베타 기여도는 벤치마크와의 일별 수익률 공분산을 기준으로 계산한다.

## 아직 범위 밖인 기능

- 거래 내역 기반 평균단가 자동 계산
- 배당과 현금흐름 반영
- 세금, 수수료, 슬리피지 반영
- 자동 리밸런싱 제안
- 실제 주문/자동매매

현재 앱은 투자 실행 도구가 아니라 리서치와 점검용 도구다.
