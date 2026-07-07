# Research Library

Research Library는 Folio OS가 자료를 읽고 찾는 공통 기반입니다. 사용자가 넣은 기사·RSS·리포트·공시·PDF를 스캔해 `research-index.sqlite3`에 저장하고, 브리핑·RSS 피드·뉴스 검색·기업분석·테마분석·Thesis Delta가 같은 자료 기반을 읽도록 해줍니다.

## 사용 흐름

```text
research-inbox/에 자료 저장
→ RSS 수집/가져오기 또는 자료 폴더 다시 읽기
→ 증분 인덱싱으로 SQLite/FTS/청크 갱신
→ 브리핑, 검색, 기업분석, 테마분석, 워치리스트에서 재사용
```

## 폴더 역할

| 하위 폴더 | 역할 |
| --- | --- |
| `ingestion/` | `research-inbox` 폴더 계약과 PDF 추출 보조 코드 |
| `rss/` | 공개 RSS 수집, RSSArchive Markdown 저장, RSS 피드 캐시/API payload |
| `indexing/` | 파일 스캔, PDF 본문 추출, 태깅, `research-index.sqlite3` 동기화 |
| `search/` | RSS/기사 검색, 워치리스트 관련 뉴스 검색, hybrid search 호출 |

## 자료를 넣는 곳

```text
research-inbox/
  articles/   # 직접 저장한 기사, 웹페이지, txt, md, html
  rss/        # RSS 수집 결과. RSS 저장 위치는 오직 여기
  reports/    # 기업분석용 증권사 리포트, IR 자료
  filings/    # 기업분석용 SEC/DART 공시, 10-K/10-Q PDF
  links/      # URL 목록 txt/md/csv/json
```

지원 형식은 `.txt`, `.md`, `.html`, `.htm`, `.json`, `.csv`, `.pdf`입니다. PDF는 인덱싱 중 본문 추출을 시도하고 결과를 `data/pdf-cache/`에 저장합니다. 이미지 스캔 PDF는 OCR을 하지 않아 추출이 제한될 수 있습니다.

## 기능별 자료 범위

| 기능 | 사용하는 자료 |
| --- | --- |
| 브리핑 | `articles`, `rss`만 사용 |
| RSS 피드 | `rss` 파일과 `rss_feed_items` 캐시 |
| 뉴스 검색 | 기본 `articles`, `rss`; `scope=all`일 때 전체 검색 |
| 기업 분석 | `filings > reports > articles > rss > 기타` 순서 |
| 테마 분석 | RSS/기사 하이브리드 검색 + 시장 데이터 + 내러티브 |
| Thesis Delta | 로컬 뉴스 검색 + 공식자료 보강 |

## Evidence Intake / RSS 수집

RSS 피드 탭의 `RSS 수집/가져오기`는 공개 RSS를 읽어 `research-inbox/rss/`에 Markdown으로 저장합니다.
내부 수집기는 Folio OS Evidence Intake 경로를 사용하며, RSS는 `collector=rss`인 입력원입니다.
신규 Markdown은 YAML front matter에 `collector`, `source_type`, `normalized_url`, `collection_status`,
`query_source`, `reliability_tier`를 저장하고, 기존 list-style RSSArchive Markdown은 계속 읽기 호환합니다.

기본 소스:

- 미국: Bloomberg, Dow Jones, Reuters, WSJ, Financial Times
- 한국: 한국경제, 연합인포맥스(증권, IB/기업, 채권/외환, 해외주식, 국제뉴스), 연합뉴스(경제, 산업/마켓), 매일경제(경제, 증권)

유료 본문 우회 수집은 하지 않습니다. 공개 RSS의 제목·요약·링크·발행일을 사용하고, 접근 가능한 공개 본문만 추출을 시도합니다. 수집 파일에는 `Collection Status`가 남아 `full_text`, `summary_only`, `fetch_failed`, `needs_manual_save` 상태를 구분합니다.

본문/요약 추출 규칙:

- 기사 페이지 요청은 표준 브라우저 User-Agent를 사용합니다(일부 무료 매체가 도구 UA에 403을 반환). 유료벽 감지는 그대로 유지되며 우회하지 않습니다.
- paywall 판정은 "구독 후 이용", "subscribe to continue" 같은 게이트 문구 기준입니다. 한국 뉴스 페이지 공통 푸터의 "구독"/"로그인" 단어만으로는 유료벽으로 판정하지 않으며, 충분한 길이의 공개 본문이 추출되면 페이지 다른 곳의 구독 배너가 `full_text` 판정을 막지 않습니다.
- `news.google.com` 리다이렉트 링크(Google News 검색 RSS)는 기사 HTML이 아니므로 페이지를 가져와 요약을 덮어쓰지 않고, RSS 요약을 유지한 `summary_only`로 저장합니다.

브리핑의 한국장 출처 다양성을 위해 `config/rss_feeds.yaml`에는 연합뉴스 경제·산업/마켓과 매일경제 경제·증권의 공식 공개 RSS가 포함됩니다. 포털 aggregator는 사용하지 않으며, 같은 매체의 여러 feed는 브리핑 이슈 확산도에서 하나의 publisher vote로 정규화됩니다.
CLI 기본 실행에서는 기사 전문을 Markdown에 저장하지 않습니다. 로컬/비공개 archive에 전문을 저장하려면 CLI에서 `--save-full-text`를 명시해야 하며, `--public-mode`에서는 전문 저장이 비활성화됩니다.
웹 앱에서 실행되는 수집(RSS 수집 버튼, 자동화 루틴)은 설정 탭 자동화 > RSS 수집의 `기사 전문 저장` 옵션(`automation-settings.json`의 `rss.saveFullText`, 기본 켜짐)에 따라 `--save-full-text`를 전달합니다. 저장된 전문은 인덱싱을 거쳐 하이브리드 검색과 브리핑 근거로 사용됩니다.
동일 기사 중복 제거는 원본 URL이 아니라 tracking query를 제거한 `normalized_url` 기준입니다.

설정 파일:

```text
config/rss_feeds.yaml          # RSS/Atom feed 목록, enabled/priority/reliability_tier
config/evidence_sources.yaml   # 공식자료 adapter 설정
```

CLI 예시:

```bash
python -m features.common.research_library.rss.rss_archive --collectors rss --dry-run
python -m features.common.research_library.rss.rss_archive --collectors rss --save-full-text
```

공식자료 collector는 fake data를 만들지 않는 adapter stub으로 시작하며, 기존 공식자료 모듈 output을 EvidenceItem으로 연결하는 확장 지점입니다.
수집된 EvidenceItem metadata는 Markdown과 함께 `data/research-index.sqlite3`의 `evidence_items` 테이블에도 저장됩니다.

RSS 피드 화면은 Markdown 파일 전체를 매번 읽지 않고 `data/research-index.sqlite3`의 `rss_feed_items` 캐시에서 `LIMIT/OFFSET`으로 읽습니다. 캐시는 파일 크기와 `mtime_ns` 기준으로 증분 갱신하며 기본 TTL은 `RSS_CACHE_REFRESH_TTL_SECONDS=30`초입니다.
각 RSS 항목은 `markets` 태그를 함께 저장합니다. 값은 `US`, `KR`, `GLOBAL`, `UNKNOWN`이며, `US,KR,GLOBAL`처럼 복수 태그가 가능합니다. RSS 목록과 병합 다운로드는 `market=US|KR|GLOBAL|UNKNOWN` 필터를 지원합니다.

## 인덱싱과 검색

핵심 산출물:

```text
data/research-index.sqlite3   # documents, file_manifest, chunks, chunks_fts, rss_feed_items
data/index.json               # generatedAt/count/incremental/sqlite 등 상태 요약
data/pdf-cache/               # PDF 본문 추출 캐시
```

`build_index(incremental=True)`는 `file_manifest`의 파일 크기/수정시각을 보고 바뀌지 않은 파일을 건너뜁니다. 시장 관련 없는 파일도 manifest에 기록해 다음 실행 때 재처리하지 않습니다.

텍스트 쿼리가 있으면 검색은 항상 hybrid search 경로를 탑니다.

1. FTS5 BM25로 최대 120개 청크 후보 추출
2. 후보에 한해 해시 임베딩 코사인 유사도 계산
3. RRF(k=60)로 FTS 랭크와 벡터 랭크 통합
4. 같은 문서의 여러 청크는 최고 점수 청크로 중복 제거
5. 기업/범위 필터는 결과에 post-filter 적용

쿼리 없이 회사/범위 필터만 있을 때는 인메모리 문서 목록을 필터링합니다.

## 태깅

기업 태깅 우선순위:

1. `config/company_master.json`
2. `config/company_aliases.json`
3. `features/common/company_lookup.py`의 seed
4. 문서 안의 패턴(`NASDAQ:NVDA`, `005930.KS`, `Uber Technologies, Inc. (UBER)` 등)

섹터/영향 태그는 `indexing/service.py`의 `SECTOR_TERMS`, `IMPACT_TERMS`로 찾고 `features/common/taxonomy.py`의 `normalize_tag()`로 정규화합니다. 새 태그를 추가할 때는 taxonomy와 indexing 키워드가 함께 맞아야 합니다.

## API

```text
POST /api/index
GET  /api/index/documents
POST /api/rssarchive/import
GET  /api/rss/items
GET  /api/rss/merge
GET  /api/search?query=NVDA&limit=30
```

`/api/index`와 `/api/rssarchive/import`는 오래 걸릴 수 있어 job을 만들고 `/api/jobs/{job_id}`로 진행 상황을 조회합니다.

## 관련 코드

- `ingestion/extract_pdf.py`: PDF 추출 보조
- `rss/rss_archive.py`: Evidence Intake CLI entrypoint과 얇은 orchestration
- `rss/fetch.py`: feed/article HTTP 수집(retry/backoff)
- `rss/parser.py`: RSS/Atom XML → raw item 파싱
- `rss/article.py`: 공개 기사 본문/요약 추출, paywall 감지
- `rss/relevance.py`: 시장 관련성 게이트(NOISY/term 필터, `should_archive_item`, `canonical_media`)
- `rss/normalizer.py`: raw item → `IntakeEvidenceItem`
- `rss/policy.py`: normalized URL dedupe/retry/relevance score/full-text/paywall 정책
- `rss/collectors.py`: official collector adapter
- `rss/writer.py`: YAML front matter Markdown 아카이브 IO, legacy 업그레이드, `.state.json`
- `rss/store.py`: `research-index.sqlite3::evidence_items` 저장
- `rss/service.py`: RSS import/feed/merge/cache payload
- `indexing/service.py`: `build_index()`, `load_index()`, `build_document()`, `market_relevance()`
- `indexing/research_index.py`: SQLite schema, FTS, manifest, `hybrid_search()`
- `search/service.py`: `search_documents()`, `group_docs()`, `list_companies()`

## 주의점

- `research-inbox/rss/` 외의 예전 `archive/` 폴더를 다시 만들지 않습니다.
- `data/`, `research-inbox/`, `config/`는 사용자 개인 자료가 들어갈 수 있으므로 명시 요청 없이 삭제하거나 초기화하지 않습니다.
- 검색/태깅 변경은 브리핑, 워치리스트, 기업분석, 테마분석, thesis tracking에 함께 영향을 줍니다.
