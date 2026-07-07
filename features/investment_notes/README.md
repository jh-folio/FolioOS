# Investment Notes

Folio OS 내부에서 운용하는 Agent-assisted 투자 생각 정리 레이어입니다. Obsidian이 없어도 보고서 옆 노트 패널에서 브리핑, Market Memory, 기업분석 보고서를 참고해 사용자의 판단을 정리하고 다시 불러올 수 있게 합니다.

0.1 화면에서는 "Thesis", "Note Link", "Personal Overlay" 같은 내부 용어를 전면에 내세우지 않습니다. 노트 패널은 두 개의 탭으로 구성합니다.

- **작성 탭 = 채팅**: 사용자가 떠오르는 생각 한 줄을 보내면 Agent가 `현재 관점`, `왜 중요한가`, `근거`, `반대 근거`, `다음 체크포인트`, `결정/업데이트 로그` 구조의 완성 노트를 채팅 메시지로 돌려줍니다. 사용자는 Agent 답변이나 완성본의 문장을 드래그해 인용한 뒤 이어서 질문하거나 첨삭을 요청할 수 있습니다. `생각만 기록` 버튼은 Agent 호출 없이 생각을 기록만 하므로 LLM/Agent가 꺼져 있어도 동작합니다.
- **연결 자료 탭 = 완성본(읽기 전용)**: 최신 완성 투자 노트를 읽기 전용으로 보여줍니다. 본문 직접 편집 UI는 없으며, 수정은 작성 탭에서 Agent와 대화(첨삭 요청)로만 진행합니다. 연결된 다른 Folio 노트 목록과 참고 해석(Personal Overlay)도 이 탭에 함께 표시합니다.

보고서 옆 패널은 Markdown 양식 초안을 먼저 보여주지 않습니다. 자유 작성 칸에는 아래 placeholder만 표시합니다.

```text
떠오르는 생각을 자유롭게 정리해보세요. 막연한 느낌이나 궁금증 한 줄만 작성해도 됩니다.

예시: "이 주식은 앞으로 받을 수혜가 커 보여서 관심 있음"
예시: "가격이 너무 오른 것 같은데 그래도 들고 갈 만한가?"
```

Agent 응답은 `[대화]`(짧은 대화 답변)와 `[투자 노트]`(완성 노트 전체 Markdown) 두 부분으로 구성된 고정 형식을 사용합니다. `[투자 노트]` 부분이 있으면 노트 `body`를 교체하고, 없으면(단순 질문 답변) 기존 `body`를 유지합니다. Agent 호출이 실패해도 사용자가 보낸 생각은 `rawThoughts`에 저장합니다.

사용자가 작성한 원문은 Agent가 만든 정리본으로 덮어쓰지 않습니다. 원문 생각은 `rawThoughts`, Agent 응답(대화+노트 원문)은 `interactionLog`, 최신 완성 투자 노트는 `body`에 저장합니다.

## 저장 원칙

- 노트 본문은 `data/investment-notes/{id}.json`에 저장합니다.
- 검색·연결용 인덱스는 `data/market-memory.sqlite3`의 `native_note_index` 테이블에 저장합니다.
- `body`는 정리된 투자 노트 본문입니다.
- `rawThoughts`는 사용자가 자유 작성 칸에 남긴 원문 생각 기록입니다.
- `interactionLog`는 Agent가 어떤 정리를 했는지 남기는 상호작용 기록입니다.
- 모든 native note는 `layer=hypothesis`, `sourceLayer=user_synthesis`, `reuseAsHypothesis=true`, `reuseAsEvidence=false`입니다.
- 사용자 노트는 근거(evidence)가 아니며 Canonical 보고서 본문을 수정하지 않습니다.
- Agent가 정리한 노트는 `agent_assisted` 태그와 `interactionLog`로 사용자 작성 판단과 구분합니다.

## API

```text
GET  /api/investment-notes
GET  /api/investment-notes/{note_id}
GET  /api/investment-notes/linked
POST /api/investment-notes
```

기존 `/api/notes`는 호환 경로로 유지하지만 같은 native note 저장소를 사용합니다.

## 연결

- 브리핑 reader 노트: `market_memo`
- 기업 분석 reader 노트: `company_thesis`
- 딥 리서치 reader 노트: `topic_review`
- 과거 일반 메모/호환 경로: `investment_note`

Obsidian workflow는 계속 유지하되, 기본 저장 경로는 Folio native note입니다.
