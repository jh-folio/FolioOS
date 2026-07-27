# Smart Collections v2

Smart Collections는 0.2 Deep Research 안에서 로컬 Research Library의 외부 자료를 다시 찾기 위한 결정적 저장 필터입니다. 별도 기본 navigation 화면은 없으며 Deep Research plan과 Agent 요청에는 collection ID/revision만 전달합니다. 컬렉션 자체는 evidence가 아니며, 사용자 노트·첨부·생성 보고서·가설을 결과에 포함하지 않습니다.

## 저장과 동시성

- 저장 파일: `data/smart-collections.json`
- 스냅샷 원장: `data/smart-collection-state/{collection_id}.json`(최근 8개)
- 최초 명시적 생성 전에는 파일을 만들지 않습니다.
- 생성·수정·삭제는 store revision을 한 번씩 올리고, 수정은 해당 Collection revision도 올립니다.
- 수정·삭제·preview·resolve는 `expectedRevision`으로 낙관적 충돌을 검사합니다.
- 기존 primary를 `.bak`에 보존한 뒤 temp replace하며, 유효한 backup만 결정적으로 복구합니다.
- preview/resolve/명시적 refresh만 스냅샷을 기록합니다. workspace/change 조회와 Agent 설명은 read-only라 비교 기준을 바꾸지 않습니다.

## 필터와 해석

정의는 `query`, `market`, `sources`, `tickers`, `tags`로 구성됩니다. 외부 자료는 index와 RSS cache에서만 읽습니다. RSS 설명은 검색 결과 표시용일 뿐 Topic evidence로 승격되지 않으며, index에 정확히 매핑되지 않은 RSS 항목은 `unindexed_rss`로 남습니다.

검색어가 있으면 Collection의 비검색 필터로 허용 문서를 먼저 정한 뒤 FTS 후보를 뽑습니다. index와 RSS는 정규 URL, URL이 없으면 inbox-relative POSIX path의 byte-exact key로 합쳐집니다. resolve는 최대 120개 후보, 실제 실행 가능한 index document IDs, provider generation, input watermark를 반환합니다.

## 스냅샷, 변화, 상태

각 스냅샷은 정의 hash, revision, provider generation, input watermark, evidence identity, 결과/실행/사용 불가 개수만 저장합니다. 기사 본문·snippet·사용자 노트·Agent 응답은 스냅샷 파일에 저장하지 않습니다.

`change_detection.py`는 최신 저장 스냅샷과 현재 provider read를 stable evidence identity로 비교해 added/removed/unchanged를 계산합니다. 정의 변경, 빈 결과, 높은 사용 불가 비율, 높은 churn, 시계 오류, 만료, provider generation/watermark reset, 결과 truncation을 명명된 reason code로 반환합니다. 이 계산은 LLM 없이 결정적으로 동작합니다.

Deep Research 내부 상세 주소는 `#/deep-research/collections/{collection_id}`입니다. 상세 화면은 저장 필터 정의, 상태/reason, 마지막 refresh, 변화 수, 현재 외부 evidence 카드, Deep Research 시작을 보여줍니다. empty/stale/noisy/source unavailable/deleted 상태를 별도로 표시하며, hash 직접 열기와 back/forward를 지원합니다.

`Agent에게 변화 묻기`는 명시적으로 클릭해야만 실행됩니다. 서버는 ID/revision을 다시 확인하고 현재/이전 스냅샷 metadata와 현재 외부 evidence 카드 최대 12개만 구성합니다. 카드 문자열은 `external_evidence_untrusted`, Collection 정의는 `saved_filter_metadata_not_evidence`로 표시하며 응답은 대화형·비변경입니다. 상세 진입과 refresh는 Agent job을 만들지 않습니다.

## API

```text
GET    /api/smart-collections
POST   /api/smart-collections
GET    /api/smart-collections/{id}
PUT    /api/smart-collections/{id}
DELETE /api/smart-collections/{id}
POST   /api/smart-collections/{id}/preview
POST   /api/smart-collections/{id}/resolve
GET    /api/smart-collections/{id}/workspace
GET    /api/smart-collections/{id}/changes
POST   /api/smart-collections/{id}/refresh
```

서비스와 테스트는 `dataDir`과 clock을 주입받아 실제 사용자 `data/`, `research-inbox/`, `config/`를 사용하지 않고 검증할 수 있습니다.
