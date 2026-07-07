# 딥 리서치 (Topic Research Agent v2)

화면 표시명은 **딥 리서치**입니다. 내부 폴더/API/저장 경로는 기존 호환을 위해 `topic_report` 이름을 유지합니다.

이 기능은 프리셋 테마(환율·금리·기업실적·주간시황·산업동향) 또는 **자유 투자 질문**에 대해 시장 데이터, 경제 지표, 시장 내러티브 기록, 로컬 뉴스를 종합하여 분석 보고서를 생성합니다. v2에서는 단순 "주제 보고서 생성기"를 넘어 **투자 질문 해결기**(주제 해석 → 리서치 계획 → 증거 묶음 → 유형별 분석 → 품질 평가 → 개인 해석 연결)로 동작합니다.

## 담당 범위

- 프리셋 테마 선택 또는 자유 입력으로 보고서 생성
- **Topic Planner**: 자유 주제를 해석해 보고서 유형·분석 축·검색어·후보 티커·데이터 갭을 만드는 리서치 계획(TopicPlan) 생성
- **심층 모드**: 사용자가 켜면 Planner가 하위 질문을 만들고, 질문별 근거 커버리지와 라운드(최대 2회)를 evidence/sourceLedger에 기록
- **Evidence Pack**: 분석 축별 자료 검색·근거 역할 분류(evidenceRole)·커버리지 계산, Source Ledger
- **report_type별 템플릿**: 12종 유형 enum에 맞춰 분석 강조점을 달리하는 지침 결합
- **Quality Gate / Quality Generation**: 생성 전 품질 목표와 자료 수집 루트, evidence coverage preflight를 컨텍스트에 주입하고, 생성된 보고서를 공통 `research_quality` 레이어로 평가하며, 선택한 `qualityMode`에 따라 weak section 탐지·LLM 섹션 개선·telemetry를 `qualityGeneration`에 저장
- **Personal Overlay**: 저장된 보고서를 사용자 Obsidian 노트와 대조한 개인 해석(Step 2 재사용, 기본 markdown 불변)
- yfinance 기반 관련 티커 시장 데이터 수집
- FRED(미국 경제 지표) 및 BOK ECOS(한국은행 경제통계시스템) 거시 데이터 수집
- 시장 내러티브 메모리에서 관련 항목 검색 및 참조
- RSS/research-inbox 뉴스·자료 검색 및 참조
- LLM 보고서 생성과 규칙 기반 fallback (LLM 없이도 전 과정 동작)
- 사용자 추가 컨텍스트(userContext) 주입 — **관심 방향이지 사실/근거가 아님**
- 보고서 자동 저장(같은 주제·같은 날 덮어쓰기), 목록 조회, 다시 열기, 삭제
- 웹 UI 딥 리서치 탭은 저장 보고서를 **카드 피드**로 보여주고, 카드를 누르면 **팝업 리더(모달)** 로 본문이 열린다(생성 결과도 동일 팝업). 카드별 휴지통으로 삭제하며 기존 드롭다운 선택 방식은 폐기. (기업분석과 같은 `report-reader`/`report-feed-card` 컴포넌트 공유)
- Notion / Obsidian 내보내기

## v2 파이프라인

```text
사용자 질문 → Topic Planner(주제 해석·리서치 계획) → Evidence Pack(축별 근거)
→ report_type 템플릿 결합 → LLM/규칙 보고서 → Quality Gate(자동 평가) → Quality Generation(선택 보강)
→ [선택] Personal Overlay(내 노트와 대조)
```

심층 모드를 켜면 Topic Planner 다음에 하위 질문 분해가 추가됩니다.

```text
TopicPlan → deepResearch.subQuestions → 질문별 근거 수집 → questionCoverage/sourceLedger 라운드 기록
```

설계 원칙 (CLAUDE.md §5와 동일):
- **2계층 분리**: 기본 보고서(Canonical)는 보편·자료 기반. 개인 해석은 `personalOverlay` 별도 필드에만. 기본 `markdown`은 overlay 생성으로 바뀌지 않는다.
- **enum 통제**: `reportType`(12종)·`evidenceRole`(5종)은 `topic_schema.py`에서 코드 검증. LLM 자유 텍스트 분류를 신뢰하지 않는다.
- **확증편향 방지**: 보고서에 반론/리스크 섹션 필수, Quality Gate가 counterargument/personal_bias_risk를 점검.
- **userContext ≠ evidence**: 관심 방향으로만 쓰고, 외부 자료와 충돌 시 충돌을 명시.

## report_type enum (12종)

`macro_analysis`, `cross_asset_analysis`, `industry_theme`, `supply_chain_theme`, `policy_regulation`, `geopolitical_risk`, `earnings_theme`, `factor_style`, `company_basket`, `country_market`, `portfolio_implication`, `custom_research`. 정의는 `topic_schema.py`, 유형별 지침은 `templates/<type>.md`(없는 유형은 `generic.md` 폴백).

## 프리셋 테마

| 키 | 라벨 | 설명 |
| --- | --- | --- |
| `exchange_rate` | 환율 | USD/KRW 환율 전망 및 주요 통화 분석 |
| `interest_rate` | 금리 | 미국·한국 금리 환경 및 수익률 곡선 분석 |
| `earnings` | 기업실적 | 어닝시즌 동향 및 섹터별 실적 분석 |
| `weekly_market` | 주간 시황 | 주간 시장 흐름 요약 및 다음 주 주목 이벤트 |
| `industry_trend` | 산업 동향 | 주요 산업·섹터별 흐름 및 테마 분석 |
| `custom` | 직접 입력 | 사용자가 입력한 주제로 자유 생성 |

각 프리셋은 연관 티커, FRED 시리즈, BOK 시리즈, 검색 키워드, 분석 축을 정의합니다. 설정은 `features/topic_report/topic_config.py`에 있습니다.

## 데이터 소스

- **yfinance**: 관련 주가·지수·ETF·환율·원자재 데이터
- **FRED**: Fed Funds Rate, CPI, 10년물 금리, 실업률, 수익률 스프레드 등 미국 거시 지표
- **BOK ECOS**: 한국은행 기준금리, 콜금리, 원/달러 환율 등 한국 경제 지표
- **시장 내러티브 메모리**: 과거에 기록한 시장 흐름 메모 (스토리 패밀리 기반 필터링)
- **뉴스/로컬 자료**: research-inbox/rss + articles 하이브리드 검색

FRED와 BOK ECOS를 사용하려면 `.env`에 API 키를 설정합니다.

```text
FRED_API_KEY=...
BOK_API_KEY=...
```

두 키 모두 없어도 yfinance 데이터와 로컬 자료만으로 보고서를 생성할 수 있습니다.

## 보고서 구조 (v2, 11섹션)

LLM 보고서는 아래 구조를 따릅니다. report_type별 템플릿이 특정 섹션의 비중을 조절합니다.

```text
1. Executive Summary           7. 반론과 리스크
2. 질문 정의와 분석 범위        8. 시나리오
3. 핵심 데이터 대시보드         9. 앞으로 확인할 체크포인트
4. 현재 상황 (분석 축 순서)    10. 결론
5. 작동 경로                   11. Source & Data Notes
6. 수혜/피해 자산과 기업
```

반론과 리스크 / 수혜·피해 / 시나리오 / 체크포인트 / Source & Data Notes는 필수입니다. 규칙 기반 fallback도 리서치 계획 요약·데이터 부족 경고·체크포인트·Source & Data Notes를 포함합니다.

## LLM 버전

LLM에는 다음 내용을 축약해서 전달합니다.

1. 테마 정의 + 분석 축 목록
2. 사용자 추가 컨텍스트 (입력한 경우 최우선 참조)
3. yfinance 시장 데이터 (Markdown 표)
4. FRED + BOK 거시 데이터 (있는 경우)
5. 관련 시장 내러티브 기록 (스토리 패밀리 다양성 유지, 최대 20건)
6. 관련 뉴스·자료 (최대 12건, RSS + research-inbox)

전체 원문을 그대로 넣지 않습니다. 자료가 없는 수치나 사실은 LLM이 추정임을 명시해야 합니다.

LLM 출력은 11개 필수 섹션을 끝까지 생성하도록 `TOPIC_REPORT_MAX_OUTPUT_TOKENS`(기본 9000)를 사용합니다. 생성 결과에 `앞으로 확인할 체크포인트` / `결론` / `Source & Data Notes` 후반 섹션이 없으면, 1회 continuation 요청을 보내 끊긴 지점부터 이어 붙입니다. continuation이 실행되면 저장 JSON의 `generation.continued`에 횟수가 기록됩니다.

## 규칙 기반 버전

LLM이 꺼져 있거나 호출에 실패하면 `features/topic_report/report_rules.py`가 보고서를 만듭니다. 시장 데이터 표, 거시 지표, 관련 뉴스 헤드라인, 시장 내러티브 요약을 섹션별로 조립합니다.

## 프롬프트

```text
features/topic_report/prompt.md
```

## 저장 위치

보고서는 생성 시 자동 저장됩니다. id는 `날짜:topicKey:라벨` 기준이라, 같은 주제를 같은 날 다시 생성하면 새 파일을 쌓지 않고 최신본으로 덮어씁니다(덮어쓸 때 기존 Personal Overlay는 보존). 자동 저장되므로 생성 직후 Personal Overlay·품질 재평가를 바로 쓸 수 있습니다.

```text
data/topic-reports/YYYY-MM-DD_<topic_key>_<id>.json
```

## 관련 코드

- `features/topic_report/service.py`: 보고서 생성·저장·목록·조회·삭제 + 재평가/overlay attach
- `features/topic_report/topic_schema.py`: report_type/evidenceRole enum, TopicPlan 정규화
- `features/topic_report/planner.py`: Topic Planner (규칙 해석 + 선택적 LLM 정제)
- `features/topic_report/evidence.py`: Evidence Pack (축별 검색, 역할 분류, 커버리지)
- `features/topic_report/source_ledger.py`: Source Ledger (출처 원장)
- `features/topic_report/templates.py` + `templates/*.md`: report_type별 지침 결합
- `features/topic_report/evaluation.py`: Quality Gate 호환 wrapper (`features/common/research_quality/evaluator.py` 호출)
- `features/common/research_quality/`: 공통 품질 평가 레이어
- `features/common/quality_generation/`: 생성 품질 목표/자료 루트, preflight, prompt hints, 최대 1회 repair, `qualityGeneration` 저장
- `features/topic_report/topic_config.py`: 프리셋 테마 정의 (`PRESET_TOPICS`, `get_topic_config()`)
- `features/topic_report/data_fetcher.py`: yfinance 시장 데이터 수집
- `features/topic_report/macro_data.py`: FRED + BOK ECOS 거시 지표 수집
- `features/topic_report/report_rules.py`: 규칙 기반 보고서 생성 (v2 섹션 포함)
- `features/personal_overlay/service.py`: overlay 생성 재사용 (`generate_overlay`/`with_overlay`)
- `features/obsidian/export/service.py`: `export_topic_report_to_obsidian()` (자기참조 마커 포함)
- `features/notion_export/service.py`: `export_topic_report()` — Notion 내보내기
- `app.py`: 테마분석 API 라우팅
- `public/app.js`: `renderTopicReport()`, `renderTopicPlanPanel()`, `renderTopicQualityPanel()`

## API

```text
GET    /api/topic-reports/presets
GET    /api/topic-reports
POST   /api/topic-reports/plan                       # TopicPlan만 생성 (보고서 X)
POST   /api/topic-reports                             # 보고서 생성 (usePlanner/customTickers/qualityMode 지원)
POST   /api/topic-reports/save
GET    /api/topic-reports/{report_id}?includePersonal # personalOverlay 포함 조회
POST   /api/topic-reports/{report_id}/evaluate         # Quality Gate 재평가
POST   /api/topic-reports/{report_id}/personal-overlay # 개인 해석 생성
DELETE /api/topic-reports/{report_id}
POST   /api/export-notion/topic-report
POST   /api/export-obsidian/topic-report
```

`POST /api/topic-reports` 요청 본문:

```json
{
  "topicKey": "custom",
  "customLabel": "일본 금리 인상이 원화와 한국 금융주에 미치는 영향",
  "userContext": "관심 방향 (사실 아님)",
  "webSearch": true,
  "usePlanner": true,
  "customTickers": {"USDJPY=X": "USD/JPY"},
  "date": "2026-06-12",
  "qualityMode": "diagnose_only",
  "deepResearch": true
}
```

## 저장 JSON 주요 필드 (v2)

`markdown`, `topicPlan`, `evidencePackSummary`, `evidenceItems`, `sourceLedger`, `checkpoints`, `dataGaps`, `marketTape`, `quality`, `qualityGeneration`, `personalOverlay`(기본 null), `generation`, `marketData`, `sources`, `deepResearch`.

Step 6 Data Foundation Lite 이후 `checkpoints`/`evidenceItems`/`sourceLedger`/`dataGaps`/`marketTape`는 `features/common/research_schema/`와 `features/common/market_data/tape.py`의 공통 스키마를 사용한다. 기본 `markdown`은 구조화 필드 생성으로 바뀌지 않는다.
Step 7 Research Quality 이후 기존 저장 보고서의 `quality`가 없거나 구버전이면 조회 시 공통 evaluator로 재평가해 최신 `sourceGrounding` 필드를 포함한다.
Step 11 Quality Generation 이후 새 생성 보고서는 `qualityGeneration.mode/preflight/repairApplied/repairCount/repairType/weakSectionsBefore/weakSectionsAfter/qualityBefore/qualityAfter/telemetry/warnings`를 저장한다. 생성 전에는 Evidence Pack 축별 커버리지, challenging evidence, marketData/FRED/BOK 한계, Source & Data Notes를 품질 목표와 evidence coverage preflight로 주입한다. `llm_section_improve`는 sourceLedger/evidence/dataGaps 범위 안에서 약한 섹션만 LLM으로 최대 1회 재작성한다.

심층 모드 보고서는 `topicPlan.deepResearch`, `evidencePackSummary.questionCoverage`, `evidencePackSummary.deepResearch`, `sourceLedger[].researchQuestionId`, `sourceLedger[].researchRound`를 함께 저장한다. 품질 평가는 `deep_question_coverage`와 `source_diversity` check를 추가로 계산한다.

## 주의점

- yfinance 조회 실패 시 해당 티커 데이터는 생략되며 보고서 생성은 계속됩니다.
- FRED/BOK API 키가 없어도 yfinance 데이터와 로컬 자료로 fallback합니다.
- 로컬 자료가 없으면 시장 데이터만으로 분석합니다. LLM은 자료가 없는 수치를 추정임으로 표시해야 합니다.
- **Personal Overlay·재평가는 저장된 보고서에만** 동작합니다(파일 기준). overlay 생성은 기본 `markdown`을 수정하지 않습니다.
- Obsidian export 노트에는 `source_layer: primary_processed`, `reuse_as_evidence: false`가 붙어 Obsidian importer가 다시 evidence로 쓰지 않습니다(원칙 5).
