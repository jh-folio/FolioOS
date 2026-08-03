# Change Intelligence

Change Intelligence는 새 보고서·시장 상태가 생성되어 commit되기 직전에 같은 작업이 이미 검토한 구조화 자료를 이전 committed artifact와 비교합니다. 별도 Agent/LLM 호출이나 Markdown diff를 사용하지 않습니다.

## Authority

- Briefing, Company Analysis, Topic Report: 각 report JSON의 `changeBasis`, `changeSummary`
- Market Memory: `market_state_snapshots.payload_json`의 `changeBasis`, `changeSummary`
- `market-memory.sqlite3::change_event_index`: 두 authority를 조회하는 재구축 가능한 projection

입력이 없거나 Markdown뿐이면 `insufficient_basis`입니다. 확인 전 fast-origin lead 하나만으로 `major_change`를 만들 수 없습니다. `major_change`는 high materiality와 tier-1 하나 또는 독립 tier-2 둘 이상이 필요합니다.

## 데이터 경계

`changeUnits` 24개, `sourceRefs` 32개, 반대 신호·불확실성 각 12개로 제한합니다. 원문을 복제하지 않고 제목·URL·hash·tier·시각 metadata만 보존합니다. Personal Overlay와 상담은 comparator 입력이 아닙니다.
