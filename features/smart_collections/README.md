# Smart Collections v0

Smart Collections는 로컬 Research Library의 외부 자료를 다시 찾기 위한 결정적 저장 필터입니다. 컬렉션 자체는 evidence가 아니며, 사용자 노트·첨부·생성 보고서·가설을 결과에 포함하지 않습니다.

## 저장과 동시성

- 저장 파일: `data/smart-collections.json`
- 최초 명시적 생성 전에는 파일을 만들지 않습니다.
- 생성·수정·삭제는 store revision을 한 번씩 올리고, 수정은 해당 Collection revision도 올립니다.
- 수정·삭제·preview·resolve는 `expectedRevision`으로 낙관적 충돌을 검사합니다.
- 기존 primary를 `.bak`에 보존한 뒤 temp replace하며, 유효한 backup만 결정적으로 복구합니다.

## 필터와 해석

정의는 `query`, `market`, `sources`, `tickers`, `tags`로 구성됩니다. 외부 자료는 index와 RSS cache에서만 읽습니다. RSS 설명은 검색 결과 표시용일 뿐 Topic evidence로 승격되지 않으며, index에 정확히 매핑되지 않은 RSS 항목은 `unindexed_rss`로 남습니다.

검색어가 있으면 Collection의 비검색 필터로 허용 문서를 먼저 정한 뒤 FTS 후보를 뽑습니다. index와 RSS는 정규 URL, URL이 없으면 inbox-relative POSIX path의 byte-exact key로 합쳐집니다. resolve는 최대 120개 후보, 실제 실행 가능한 index document IDs, provider generation, input watermark를 반환합니다.

## API

```text
GET    /api/smart-collections
POST   /api/smart-collections
GET    /api/smart-collections/{id}
PUT    /api/smart-collections/{id}
DELETE /api/smart-collections/{id}
POST   /api/smart-collections/{id}/preview
POST   /api/smart-collections/{id}/resolve
```

서비스와 테스트는 `dataDir`과 clock을 주입받아 실제 사용자 `data/`, `research-inbox/`, `config/`를 사용하지 않고 검증할 수 있습니다.
