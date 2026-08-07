# Portfolio

포트폴리오 기능은 현재 보유 포지션을 입력해 평가 손익과 비중을 확인하고, 목표 포트폴리오 프리셋과 리서치용 백테스트를 관리한다.

## 담당 기능

- 현재 보유 포지션 입력
- `revision`/`expectedRevision` 기반 동시 편집 충돌 방지(불일치 시 409와 최신본 반환)
- 증권사 화면 이미지의 local-first OCR preview/import (원본·raw OCR 비보관)
- 티커 기반 종목명, 시장, 통화, 섹터, 자산군 자동 매칭
- `yfinance` 현재가 기반 평가금액, 손익, 비중 계산
- 여러 통화(USD/KRW/EUR/GBP/JPY)가 섞인 포트폴리오의 USD 기준 환산 비중 계산
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

유럽·일본 상장 종목은 거래소 접미사를 붙여 입력한다(`7203.T`, `ASML.AS`, `SAP.DE`, `SHEL.L`, `ENI.MI`, `SAN.MC`). 시장과 통화는 접미사에서 정하고 평가금액은 USD로 환산한다.

접미사가 붙은 티커와 미국 종류주(`BRK.B`)는 표기가 같아 보이지만 다르게 다룬다. 종류주는 `BRK-B`로 바꿔 조회하고, 접미사는 점을 그대로 둔다. `.L`, `.T`처럼 양쪽으로 읽힐 수 있는 경우는 두 형태를 모두 시도한다.

런던 시세는 파운드가 아니라 펜스(`GBp`)로 들어온다. 100으로 나눠 파운드로 저장하므로 화면 금액은 파운드 기준이다.

### 프리셋 · 백테스트

프리셋은 티커와 목표 비중만 입력해 저장한다. 저장 시 각 티커를 자동 매칭하고, 비중 합계가 100%에 가까운지 확인한다.

`현재 포트폴리오 불러오기`를 누르면 현재 평가 비중을 기준으로 프리셋 초안이 채워진다. 이후 사용자가 종목을 삭제하거나 비중을 수정한 뒤 새 프리셋으로 저장할 수 있다.

저장한 프리셋은 다음 용도로 쓴다.

- 현재 포트폴리오와 목표 비중 비교
- 매수/매도 필요 수량 계산
- 백테스트 입력 포트폴리오

백테스트는 과거 가격과 일자별 환율을 사용해 리서치용 성과를 계산한다. 기준 통화는 USD 또는 KRW이며, 그 외 통화 종목은 일자별 USD 환율을 거쳐 기준 통화로 환산한다. 환율을 못 가져온 통화는 환산하지 않은 값을 쓰는 대신 해당 종목 계산을 중단한다. 실행 결과는 자동 저장하지 않는다. 화면에 표시된 결과가 보관할 만하다고 판단될 때 `결과 저장` 버튼을 눌러 저장한다. 비교 초안을 2개 이상 만든 경우에도 같은 방식으로 사용자가 선택한 비교 결과만 저장한다.

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
POST   /api/portfolio/import-image/preview?mode=local|vision&consent=false|true
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

`POST /api/portfolio`는 선택적으로 `expectedRevision`을 받는다. 현재 revision과 다르면 저장하지 않고 409를 반환한다. 과거 `portfolio.json`은 revision 0으로 읽고 첫 저장부터 additive schema v2로 승격한다.

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
- 달러가 아닌 자산은 환율을 반영해 USD 기준 평가금액과 비중을 계산한다. 환율은 Yahoo `XXX=X`(달러당 해당 통화)를 쓴다.
- 목표 포트폴리오 비교의 매매 수량은 `목표금액 - 현재금액`을 현재가로 나누어 추정한다.
- 백테스트는 리서치용이며 실제 세금, 수수료, 슬리피지, 체결오차를 반영하지 않는다.
- 변동성 기여도는 일별 수익률 공분산을 활용한 대략적인 리스크 기여도이며, 베타 기여도는 벤치마크와의 일별 수익률 공분산을 기준으로 계산한다.

## Investment Context 연결 (0.2.3)

현재 포트폴리오의 ticker는 읽기 전용 Investment Context에서 Market Memory,
thesis, checkpoint, 보고서, Smart Collection과 연결할 수 있다. 연결 projection에는
`source=portfolio|watchlist|both`와 정규화된 stance만 들어가며 수량, 평균단가,
평가금액, 손익, 비중은 포함하지 않는다.

이 projection은 Home, Market Memory, Smart Collection, Deep Research의 개인 맥락
카드와 0.4.3의 Portfolio route에서 사용한다. 연결 결과는 리서치 점검을 돕는
hypothesis metadata일 뿐 자동 리밸런싱·매수/매도/보유 권고가 아니다.

이미지 가져오기는 세 경로다. **설정한 Agent CLI가 있으면 그쪽이 기본**이고(0.5.0),
없으면 로컬 Tesseract `kor+eng`, 그것도 없으면 외부 Vision이다. 각 경로의 준비 여부는
다이얼로그가 열릴 때 `preflight`로 먼저 표시한다. 원본 이미지, crop 이미지, raw OCR text와 bbox는 저장하지 않는다. 외부 Vision은
매 요청의 명시적 동의가 있을 때만 crop/redaction 미리보기를 전송하며 결과를 즉시 저장하지
않고 사용자가 편집표를 확인한 뒤 revision-safe 저장을 별도로 실행한다.

## 아직 범위 밖인 기능

- 거래 내역 기반 평균단가 자동 계산
- 배당과 현금흐름 반영
- 세금, 수수료, 슬리피지 반영
- 자동 리밸런싱 제안
- 실제 주문/자동매매

현재 앱은 투자 실행 도구가 아니라 리서치와 점검용 도구다.

## 종목 입력 — 0.5

보유 표의 종목 칸은 이름으로 적어도 된다. 입력을 벗어날 때 `features/common/company_resolution.py`가 한 번 해석해 티커로 바꾸고, **비어 있을 때만** 시장 칸을 채운다. 사용자가 적어 둔 값은 덮지 않는다.

- 표 안이라 글자마다 부르지 않는다. 행이 여럿일 때 호출이 곱절로 늘어난다.
- 해석된 회사명은 화면 확인용이며 저장 payload에 넣지 않는다.
- 행을 지우면 아래 행 번호가 당겨지므로 표시용 이름도 함께 옮긴다.

## 사진 가져오기 — Agent CLI 경로 (0.5.0)

기존 두 경로는 둘 다 사용자에게 무언가를 먼저 시킨다 — 로컬 OCR은 Tesseract(kor+eng) 설치, 외부 Vision은 OpenAI 키 저장과 매 요청 동의다. 이미 CLI 경로를 설정한 사용자에게 그 CLI는 아무것도 더 깔지 않고 이미지를 읽는다. 그래서 사진 스캔의 진입 장벽을 없애는 경로는 이쪽 하나뿐이다.

런타임은 `agent_import.py`이고 `/api/portfolio/import-image/preview?mode=agent`로 부른다.

- **바이트는 프롬프트에 넣지 않는다.** Agent 도크 첨부(`agent_mode/attachment_files.py`)와 같은 방식으로 파일 경로만 알려주고 CLI가 그 파일을 직접 연다. 임시 파일은 `preview_image`의 `TemporaryDirectory`가 성공·실패·취소 어느 쪽이든 지운다. `run_agent_prompt()`는 job을 만들지 않으므로 `data/jobs.json`과 Work Log에도 남지 않는다.
- **동의 체크박스가 없다.** 설정에서 CLI 경로를 넣은 순간부터 그 프로젝트의 모든 동작에 Agent 사용을 허락한 것으로 본다(AGENTS.md §8 Agent 실행 경계). 여기서 동의를 또 받으면 설치 부담을 없앤 자리에 절차 부담을 넣는 셈이다. 다만 **사진이 그 CLI 제공자에게 전달된다는 사실은 화면이 먼저 말한다** — 허락과 고지는 다른 문제다. 다이얼로그 상단 표기가 `LOCAL-FIRST IMPORT`에서 `PREVIEW ONLY IMPORT`로 바뀐 것도 같은 이유다.
- **읽기 실패와 빈 결과를 섞지 않는다.** 파싱 실패(`agent_import_not_json`)와 이미지 열기 실패(`agent_import_image_unreadable`)는 오류로 올린다. 빈 목록은 "사진에 종목이 없다"는 뜻이고, 둘을 섞으면 사용자가 읽기 실패를 사진 탓으로 오해한다.
- 프롬프트가 추정을 막는다. 안 보이는 값은 `null`이며 평가금액을 수량으로 나누는 역산을 금지한다. 합계·총자산·예수금 행은 종목이 아니므로 뺀다.
- 한 번에 수십 초다(`PORTFOLIO_IMPORT_AGENT_TIMEOUT_SECONDS`, 기본 180초). 화면이 그 사실을 먼저 말한다. 실측(2026-08-07): 4종목 한국·미국 혼합 캡처를 11.9초에 4/4 정확히 읽었다.

## 아직 미뤄 둔 것 — 화면 재연결 (0.5.X)

백엔드 API는 18개가 등록돼 있는데 화면이 쓰는 것은 3개다(`/api/portfolio` 읽기·쓰기, 사진 가져오기). `/summary`·`/analytics`·`/resolve`·`/suggest`, `/presets` 4개, `/backtests` 6개가 끊겨 있다. `portfolio-backtest-form`·`backtest-metrics`·`backtest-compare-table`·`portfolio-donut-grid`·`portfolio-analysis-grid` 같은 CSS가 남아 있는데 이를 참조하는 컴포넌트는 0개다 — React 전환 때 화면만 안 옮겨왔다. **새로 만드는 게 아니라 다시 붙이는 작업**이며 사용자 결정으로 0.5.X에서 진행한다(2026-08-07).
