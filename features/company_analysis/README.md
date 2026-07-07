# 기업 분석

이 기능은 특정 기업에 대해 공시, 리포트, 뉴스 자료를 종합해 기업 분석 리포트를 생성합니다.

## 담당 범위

- 기업명/티커 입력 분석
- SEC ticker registry 기반 미국 상장사 식별
- SEC companyfacts 기반 재무 숫자 수집
- SEC 10-K HTML 수집과 문단 점수화
- DART corpCode 기반 국내 상장사 식별
- DART Open API 기반 국내 기업 재무 숫자 수집
- 로컬 공식자료 발췌 fallback(10-K/10-Q/S-1/20-F/8-K/prospectus/proxy 등)
- 공식자료 우선 컨텍스트 구성
- Financial Summary 하위의 재무 품질 분석
- LLM 기업분석 리포트 생성
- `analysisStyle=beginner|advanced` 기반 초심자/숙련자 보고서 모드
- data-gap resolver 기반 자료 한계·확인 시도 기록
- Jinja2 템플릿 기반 규칙 엔진 리포트 생성
- 생성된 기업분석 보고서 자동 저장(같은 기업·같은 날 덮어쓰기)/다시 열기/삭제
- 참고자료 표시
- 웹 검색 보완 ON/OFF
- 자동 preflight, evidence coverage, 품질 평가 결과 저장

## 자료 우선순위

```text
research-inbox/filings
> research-inbox/reports
> research-inbox/articles
> research-inbox/rss
> 기타 research-inbox 자료
```

미국 상장사는 로컬 수동 사전보다 SEC `company_tickers.json`를 먼저 조회해 CIK를 찾습니다. 국내 상장사는 DART `corpCode.xml`을 캐시해 종목코드/회사명으로 `corp_code`를 찾습니다. 로컬 `config/company_master.json`, `config/company_aliases.json`는 사용자 별칭이나 애매하게 잡히는 회사 보정용입니다.

숫자 데이터는 미국 기업은 SEC companyfacts API, 국내 기업은 DART Open API를 최우선으로 사용합니다. 이후 공식 자료인 SEC 10-K HTML 또는 DART 사업보고서/분기보고서와 로컬 공시 자료를 사용하고, 증권사 리포트와 IR 자료, 마지막으로 기사/RSS를 참고합니다.

## 컨텍스트 구성 방식

기업분석은 전체 파일 본문을 LLM에 넣지 않습니다. 토큰 비용과 환각을 줄이기 위해 아래 순서로 입력을 축약합니다.

1. `공식 숫자 데이터`
   - 미국 기업은 SEC companyfacts API에서 CIK 기준으로 재무 항목을 불러옵니다.
   - 국내 기업은 DART Open API에서 corp_code 기준으로 최근 3개년 재무 항목을 불러옵니다.
   - 매출, 매출총이익, 영업이익, 순이익, EPS, 영업현금흐름, CapEx, 현금, 자산, 부채, 장기부채를 우선 정리합니다.
   - SEC/DART 접근 실패 시 캐시가 있으면 캐시를 사용하고, 없으면 로컬 자료와 웹 검색 보완으로 넘어갑니다.
2. `SEC 10-K HTML 상위 문단`
   - SEC submissions에서 최신 10-K HTML 원문 URL을 찾습니다.
   - 기업 섹터/GICS 성격에 따라 중요한 Item과 키워드 묶음을 선택합니다.
   - 문단 단위로 Item, 키워드, 숫자 포함 여부, 문단 길이를 점수화합니다.
   - 상위 문단, 점수, 키워드, filing metadata만 입력합니다.
3. `로컬 공식 공시 발췌 fallback`
   - SEC HTML 수집이 실패하거나 공식 문단이 부족하면 `research-inbox/filings`의 직접 관련 공식자료를 사용합니다.
   - 10-K/10-Q/20-F는 Item 구조를 우선 추출합니다.
   - S-1/F-1/prospectus/proxy/8-K처럼 Item 구조가 다르거나 저장 HTML이 깨진 자료는 사업·리스크·성장·재무·규제 키워드 기반 발췌를 보조 공식자료로 사용합니다.
   - 로컬 공시의 수치 정확성은 SEC/DART 구조화 데이터 또는 웹 검색 공식자료로 교차검증하는 것을 원칙으로 합니다.
4. `보조 자료`
   - reports, articles/rss, 기타 자료를 그대로 앞에서부터 넣지 않고 기업분석 전용 점수로 재정렬합니다.
   - 점수는 회사 직접 관련성, 자료 유형, 본문 길이, 출처 신뢰도, 재무/사업/성장/리스크/밸류에이션 키워드, 본문 정제 상태를 함께 봅니다.
   - 보조 자료는 `financial`, `business`, `growth`, `risk`, `valuation`, `general` 버킷으로 나누어 한쪽 주제만 과도하게 들어가지 않게 제한합니다.
   - 기사/RSS는 최근 이슈, 촉매, 시장 반응 보완용이며 회사 직접성이 낮거나 본문이 빈약한 자료는 제외합니다.

## LLM 버전

LLM에는 전체 10-K나 전체 PDF를 넣지 않습니다. 입력은 `공식 숫자 데이터 + 공식 공시 상위 문단 + filing metadata + 점수화된 보조 자료 일부`로 제한합니다. 웹 검색은 로컬/SEC/DART 자료로 설명이 부족한 부분을 공식 SEC/DART/IR/회사 홈페이지/실적발표 자료로 보완할 때만 사용합니다.

생성 모드는 `analysisStyle`로 선택합니다.

- `beginner`: 큰 틀은 기존 기업분석 구조를 유지하되, 어려운 용어를 풀어 쓰고 숫자의 의미를 줄글로 설명하는 초심자 친화 보고서입니다.
- `advanced`: 같은 9개 섹션 골격을 유지하되, 경쟁우위·재무품질·밸류에이션·반증조건을 더 압축적이고 깊게 다루는 숙련자용 보고서입니다.

두 모드는 공통 base prompt를 조합하지 않고 완전히 분리된 prompt 파일을 사용합니다. 다만 두 prompt는 같은 9개 섹션 순서, 자료 우선순위, 조작 금지, data gap 처리 규칙을 반드시 공유해야 합니다.

자료가 부족할 때는 곧바로 "확인 불가"로 끝내지 않고 `features/company_analysis/data_gap_resolver.py`의 data-gap resolver가 먼저 SEC companyfacts/DART, SEC 10-K HTML, 로컬 공식자료, 시장 데이터, 로컬 IR·기사·RSS, 웹 검색 허용 여부를 기준으로 어떤 확인 경로를 시도했는지 구조화합니다. 보고서 JSON에는 `dataGaps`와 `resolutionAttempts`가 저장되고, Reader는 해결되지 않은 항목을 "자료 한계"로 보여줍니다.

## 규칙 기반 버전

LLM이 꺼져 있거나 API Key가 없거나 호출에 실패하면 `features/company_analysis/report_rules.py`가 섹션별 규칙 엔진으로 보고서를 만듭니다.

- 재무 섹션: SEC companyfacts 또는 DART 재무제표의 핵심 항목을 표로 구성
- 사업/경쟁우위: SEC 10-K 상위 문단 또는 로컬 공식자료 발췌 중 product, platform, customer, segment, network 등 키워드가 강한 문단 사용
- 리스크: SEC 10-K Item 1A 또는 로컬 공식자료의 risk, regulation, competition, supply, margin 등 리스크 문단 사용
- 성장/전략: AI, data center, expansion, international, automation, partnership 등 성장 문단 사용
- 종합평가: 숫자 데이터와 공시 문단의 충실도를 기준으로 보수적으로 작성

보고서 렌더링은 Jinja2 템플릿을 사용합니다. 의존성은 `requirements.txt`의 `jinja2`입니다.

규칙 기반 버전도 LLM 버전과 동일한 자료 선별 결과를 사용합니다. 따라서 규칙 엔진은 단순 검색 결과 앞부분이 아니라 점수화된 공시, 리포트, 뉴스 자료와 SEC/DART 숫자 데이터를 기준으로 보고서를 구성합니다.

## 국내 기업 DART 설정

국내 기업 분석에서 DART 재무 데이터를 사용하려면 설정 탭에서 `DART API Key`를 저장하거나 `.env`에 아래 값을 넣습니다.

```text
DART_API_KEY=your-opendart-api-key-here
DART_TIMEOUT_SECONDS=30
```

DART 키가 없으면 국내 기업 분석은 로컬 자료와 뉴스/웹 검색 보완 중심으로 동작하며, 공식 재무 숫자 섹션에는 API 키가 없다는 안내가 표시됩니다.

## 보고서 저장

기업분석을 생성하면 자동으로 아래 폴더에 저장됩니다. 보고서 id는 `ticker:날짜` 기준이라, 같은 기업을 같은 날 다시 분석하면 새 파일을 쌓지 않고 최신본으로 덮어씁니다(덮어쓸 때 기존 Personal Overlay는 보존). 수동 `이 보고서 저장` 버튼도 그대로 동작합니다.

```text
data/company-analysis/
```

웹 UI의 기업 분석 탭은 저장된 보고서를 **카드 피드**로 보여주며, 카드를 누르면 보고서가 React report reader로 열립니다. 각 카드의 휴지통 버튼으로 삭제합니다(이전 드롭다운 선택 방식은 폐기). Reader 안에서 Agent 문의, 노트 연결, Notion/Obsidian 내보내기, Folio Note 작성, 기업 분석 시각화가 동작합니다.

## 프롬프트

```text
features/company_analysis/prompts/beginner.md
features/company_analysis/prompts/advanced.md
```

`features/company_analysis/prompt.md`는 legacy pointer이며 active prompt가 아닙니다.

두 프롬프트는 서로 다른 문체와 깊이를 가지지만 같은 9개 섹션 구조를 따릅니다.

1. 핵심 판단
2. 기업 개요와 사업 구조
3. 실적 요약
4. 밸류에이션
5. 경쟁우위 분석
6. 리스크 + 반증조건
7. 성장 전망 + 앞으로의 주요 이벤트
8. 어떻게 접근할까
9. 참고 자료

## 관련 코드

- `app.py`: `analyze_company()`
- `app.py`: `build_company_analysis_context()`
- `app.py`: `generate_llm_company_analysis()`
- `app.py`: `infer_requested_company()`
- `features/company_analysis/sec_companyfacts.py`: SEC companyfacts API 조회와 재무 테이블 구성
- `features/company_analysis/sec_filings.py`: SEC 10-K HTML 수집, 문단 분리, 섹터별 점수화
- `features/company_analysis/filing_items.py`: 10-K/10-Q Item 분리와 S-1/prospectus 등 로컬 공식자료 키워드 발췌
- `features/company_analysis/report_rules.py`: 규칙 기반 섹션별 보고서 생성
- `public/app.js`: `renderAnalysis()`

## 보조 프롬프트

```text
features/company_analysis/financial_quality_prompt.md
```

이 보조 프롬프트는 기업분석 프롬프트에 자동으로 덧붙어 `Financial Summary` 아래의 `재무 품질 분석` 작성 기준을 제공합니다. 보고서에는 별도 점수 체계 이름을 쓰지 않고, 자본효율성·현금전환·성장 품질·재무 안정성·자본배분을 해석합니다.

## API

```text
GET  /api/analyze?q=UBER&webSearch=1
GET  /api/analyze?q=UBER&webSearch=0
GET  /api/analyze?q=UBER&analysisStyle=beginner
GET  /api/analyze?q=UBER&analysisStyle=advanced
GET  /api/analysis-reports
GET  /api/analysis-reports/<report_id>
POST /api/analysis-reports
DELETE /api/analysis-reports/<report_id>
POST /api/export-notion/analysis
```

`analysisStyle` query parameter는 보고서 모드를 고릅니다. 기본값은 `beginner`입니다.

품질 관련 preflight와 evidence coverage 평가는 내부적으로 자동 수행됩니다. 0.1 UI에서는 사용자가 품질 모드를 직접 선택하지 않습니다.

`POST /api/export-notion/analysis`는 요청 본문으로 저장된 보고서 JSON을 받아 Notion 데이터베이스 페이지로 내보냅니다. `NOTION_TOKEN`과 `NOTION_DB_ID`가 설정되어 있어야 합니다.

## 주의점

- 웹 검색은 로컬 자료가 부족한 경우 보완용으로만 사용합니다.
- SEC API는 `SEC_USER_AGENT` 환경변수를 사용할 수 있습니다. 지정하지 않으면 기본 User-Agent를 사용하지만, 안정적인 사용을 위해 개인 연락처가 포함된 값을 권장합니다.
- 웹 검색 OFF 상태에서는 현재 요청에 `webSearch=0`이 전달되어야 합니다.
- LLM 결과 안의 `Sources Used` 섹션은 UI에서 제거하고, 앱이 별도 참고자료 박스를 표시합니다.

