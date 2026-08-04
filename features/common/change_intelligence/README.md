# Change Intelligence

Change Intelligence는 새 보고서·시장 상태가 생성되어 commit되기 직전에 같은 작업이 이미 검토한 구조화 자료를 이전 committed artifact와 비교합니다. Markdown diff를 사용하지 않고, 변화 판정을 위해 별도 Agent job을 만들지 않습니다.

판정은 두 층으로 나뉩니다.

1. **규칙 비교기 (`comparator.py`)** — 어떤 단위가 생기고/사라지고/움직였는지, materiality와 증거 corroboration을 결정적으로 계산합니다. 브리핑 동인은 상한 없는 점수 합이 아니라 그날 전체 대비 순위·비중으로 비교합니다.
2. **의미 비교 (`semantic.py`)** — 순위·비중 이동은 보도량 구성의 함수라 내용 변화를 말하지 못합니다. 브리핑 LLM 생성 잡 안에서 시장당 1회, 변화 단위별 직전/현재 대표 기사 제목(`contextDocs`, hash 비교 밖)을 비교해 `semanticVerdict` enum(`new_information | trend_development | reversal | coverage_shift_only | no_new_information`)으로 분류합니다. 코드가 enum·인용 제목·길이를 검증합니다.

상태 게이트는 코드가 확정합니다: `new_information/reversal` + 증거 등급(tier-1 하나 또는 독립 tier-2 둘)만 `major_change`로 승격하고, `coverage_shift_only/no_new_information`은 물량 기반 major를 강등합니다. LLM이 없으면 `not_evaluated`로 표시하고 지표 급변 단독 케이스를 제외하면 major를 확정하지 않습니다(`uncertainties: semantic_not_evaluated`). 규칙 모드 생성은 LLM을 호출하지 않습니다.

## Authority

- Briefing, Company Analysis, Topic Report: 각 report JSON의 `changeBasis`, `changeSummary`
- Market Memory: `market_state_snapshots.payload_json`의 `changeBasis`, `changeSummary`
- `market-memory.sqlite3::change_event_index`: 두 authority를 조회하는 재구축 가능한 projection

입력이 없거나 Markdown뿐이면 `insufficient_basis`입니다. 확인 전 fast-origin lead 하나만으로 `major_change`를 만들 수 없습니다. `major_change`는 high materiality와 tier-1 하나 또는 독립 tier-2 둘 이상이 필요합니다.

## 데이터 경계

`changeUnits` 24개, `sourceRefs` 32개, 반대 신호·불확실성 각 12개로 제한합니다. 원문을 복제하지 않고 제목·URL·hash·tier·시각 metadata만 보존합니다. Personal Overlay와 상담은 comparator 입력이 아닙니다.
