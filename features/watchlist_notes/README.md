# 워치리스트/메모

이 기능은 사용자가 관심 기업/섹터를 저장하고, 관련 뉴스와 태그를 확인하며, 투자 아이디어 메모를 남기는 보조 기능입니다.

## 담당 범위

- 관심 기업/섹터 목록 저장
- 워치리스트 기반 관련 뉴스 표시 및 태그 집계
- 워치리스트 항목 상세 모달(TradingView 차트/심볼 정보 + 수집 뉴스)
- 투자 메모 추가
- 최근 메모 표시

## 저장 위치

```text
data/watchlist.json
data/notes/notes.json
```

## 태그 품질 설계

`watchlist_overview()`는 워치리스트 항목별 관련 기사를 검색해 태그를 집계합니다. 탭의 카드에는 요약만 표시하고, 사용자가 항목을 클릭하면 `watchlist_detail()` 결과를 팝업으로 열어 회사 정보, TradingView 위젯, 수집 뉴스를 함께 보여줍니다. 태그 노이즈를 줄이기 위해 여러 단계의 필터를 적용합니다.

관심 종목 관리는 카드 한 곳에서 한다. 키워드를 추가하면 즉시 저장되고 카드가 나타나며, 삭제는 카드 우상단의 삭제 버튼으로 한다(별도 키워드 칩 목록은 두지 않는다). 카드 좌측 강조색과 밝은 표면은 브리핑 목록 카드와 같은 시각 규격을 공유한다.

### 검색 관련성 필터 (Fix 5)
`search_documents()`로 `limit * 4`개의 후보를 뽑은 뒤, `companies` 필드에 해당 기업이 실제 등장하는 문서만 사용합니다. 예를 들어 "Visa Inc." 검색 시 일반 명사 "visa"가 등장하는 비자 정책 기사는 제외됩니다. 인덱스에 해당 기업이 전혀 없으면 원래 검색 결과를 그대로 사용합니다.

### 주요 기업 필터 (Fix 2)
문서의 `companies` 목록 상위 2개에 해당 기업이 있을 때만 태그를 수집합니다. 주변 언급 기업의 태그가 섞이는 것을 방지합니다.

### 동반 기업 섹터 오염 방지 (Fix 6)
같은 문서에서 다른 기업(예: 애널리스트 언급 투자은행)에 귀속된 섹터 태그는 제외합니다. Alphabet 기사에 Goldman Sachs가 언급돼도 "Financials" 태그가 붙지 않습니다. `impactTags`(규제, 금리 등)는 기업 귀속이 없으므로 필터 없이 수집합니다.

### 빈도 기반 필터 (Fix 3)
2회 이상 등장한 태그를 우선합니다. 미달 시 상위 4개로 fallback합니다.

### 기업 자체 섹터 고정 (Fix 4)
검색 결과에서 해당 기업의 `sector` 값을 기본 태그로 수집해 태그 목록에 없으면 맨 앞에 고정합니다. 관련 기사가 적어 빈도 기준에 미달해도 Lam Research → Semiconductors, Visa → Financials 같은 기본 태그가 항상 표시됩니다.

## 관련 코드

- `features/watchlist_notes/service.py`: `watchlist_overview()`, `watchlist_detail()`, `_item_matches_company()`, `normalize_watchlist_keyword()`
- `app.py`: 워치리스트/메모 API 엔드포인트
- `public/app.js`: `loadWatchlistNews()`, `openWatchlistDetail()`, `renderWatchlistDetailNews()`, `renderNotes()`
- `public/index.html`: `watchlist`, `notes` 탭

## 주의점

- 워치리스트 태그와 뉴스는 인덱스 기준이므로 인덱스를 새로 빌드하면 반영됩니다.
- 메모는 사용자의 직접 입력 데이터이므로 자동 삭제하지 마세요.

