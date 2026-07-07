# Quality Generation

Quality Generation은 보고서가 생성되기 전에 품질 목표와 자료 보강 경로를 알려주고, 생성된 뒤에는 `research_quality` 평가 결과를 바탕으로 약한 섹션만 제한적으로 보강하는 공통 레이어입니다.

## 흐름

```text
quality targets -> preflight -> evidence coverage block -> generation -> research_quality
  -> weak section detector -> optional LLM section rewrite -> qualityGeneration telemetry
```

`quality_targets.py`는 보고서 유형별로 필요한 evidence mix, 자료 수집 경로, 필수 출력 요소, source boundary를 정의합니다. 브리핑, 기업분석, 테마분석은 모두 이 블록을 LLM context에 받아 첫 초안부터 같은 기준으로 쓰이도록 합니다.

## 정책

- 기본 모드는 `diagnose_only`입니다. 기존 생성 결과를 바꾸지 않고 진단만 저장합니다.
- `llm_section_improve`는 약한 섹션이 있고 현재 품질 점수가 80 이하일 때만 최대 1회 LLM 재작성합니다.
- `strict`는 같은 보강 조건을 사용하되 A-/85점 기준의 엄격 경고를 남깁니다.
- 재작성은 기존 `sourceLedger`, `evidenceItems`, `dataGaps`, quality warnings, preflight risks 범위 안에서만 합니다.
- 새 숫자, 새 출처, 새 주장을 만들지 않습니다.
- 보강 후보가 quality score/status를 낮추거나 weak section을 늘리면 적용하지 않습니다.
- 사용자 노트는 항상 `hypothesis`이며 evidence가 아닙니다.
- `qualityGeneration`에는 token usage/estimate, evidence coverage, weak sections before/after, quality before/after를 남깁니다.

## API

```text
POST /api/quality-generation/preflight
POST /api/quality-generation/repair
POST /api/quality-generation/run
```

Existing report generation APIs accept:

```json
{"qualityMode": "diagnose_only | llm_section_improve | strict"}
```

Generated reports store:

```json
{
  "quality": {},
  "qualityGeneration": {
    "mode": "llm_section_improve",
    "preflight": {},
    "repairApplied": true,
    "repairCount": 1,
    "repairType": "llm_section_rewrite",
    "weakSectionsBefore": [],
    "weakSectionsAfter": [],
    "changedSections": [],
    "qualityBefore": {},
    "qualityAfter": {},
    "telemetry": {},
    "warnings": []
  }
}
```
