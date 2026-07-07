# Investment Review — LLM 보강 프롬프트 (선택)

투자 리뷰는 **규칙 기반으로 먼저 완성**된다(LLM 없이 동작). LLM은 집계된 구조화 데이터를
사람이 읽기 좋은 요약 markdown으로 다듬는 **선택적 보강**에만 쓴다.

규칙:

- 집계된 `marketState`/`thesisChanges`/`portfolioImpacts`/`keyCheckpoints`만 근거로 쓴다.
  새로운 사실을 만들지 않는다(hallucination 금지).
- 사용자 노트/포트폴리오는 hypothesis·관심 방향이며 evidence가 아니다.
- 매수/매도 지시를 하지 않는다. "확인할 것"과 "강화/약화" 해석까지만.
- 확증편향 방지: 포지션에 유리한 해석만 하지 말고, 약화/주의 신호를 함께 제시한다.
- 출력은 기존 규칙 기반 섹션 구조(오늘의 시장 상태 / 내 Thesis 변화 / 포트폴리오 영향 /
  이번 주 체크포인트 / 연결된 내 노트)를 따른다.
