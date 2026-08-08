# features/onboarding

첫 실행 여부를 판정하고, 안내를 끝냈다는 기록을 남깁니다.

## 담당 범위

- `service.py` — `onboarding_status()`, `complete_onboarding()`, `has_user_data()`
- 저장 위치 — `data/onboarding-state.json` (`completedAt`, `skipped`)
- 화면 — `web/src/app/WelcomeWizard.tsx` (`web/src/app/App.tsx`가 띄웁니다)

## 첫 실행 판정

**"안내 파일이 없다"를 첫 실행으로 보지 않습니다.** 그 파일은 배포 zip에 없으므로, 그렇게 잡으면 쓰던 사람이 새 버전으로 올릴 때마다 처음 쓰는 사람 취급을 받습니다 — 브리핑 50개와 기사 22,548개를 가진 사람에게 "환영합니다"를 띄우는 셈입니다.

그래서 **사용자가 만든 것이 하나라도 있으면 첫 실행이 아닙니다.**

```text
firstRun = 안내 기록 없음 AND 사용자 자료 없음
```

사용자 자료의 기준은 `USER_FILES`(portfolio·watchlist·market-scope·obsidian-settings), `USER_DIRS`(briefings·company-analysis·topic-reports·notes·agent-threads), `INBOX_DIRS`(rss·articles·reports·filings)입니다.

서버가 스스로 만드는 파일은 이 목록에 넣지 않습니다. 실측으로 빈 워크스페이스에서 서버를 처음 켜면 파일 10개(설정 기본값 6, 빈 DB 2, `index.json`, SEC 캐시)가 생기지만 그중 사용자 자료는 없습니다. 이 목록으로 갓 만든 워크스페이스와 쓰던 워크스페이스가 깨끗이 갈립니다.

- 상태 파일이 깨져 있으면 완료로 보지 않습니다. 안내를 한 번 더 보는 쪽이 앱이 안 켜지는 것보다 낫습니다.
- **건너뛰어도 기록합니다.** 다음 실행에 또 띄우면 건너뛰기가 아닙니다.

## 화면 계약

- 배경은 뒤에 떠 있는 앱을 블러 처리한 것입니다. 앱이 비쳐야 "건너뛰면 바로 이거"가 눈에 보입니다. 규칙은 [frontend_ui/DESIGN_SYSTEM.md](../frontend_ui/DESIGN_SYSTEM.md)의 "첫 실행 안내 화면"에 있습니다.
- 위저드는 라우트가 아니라 앱 위에 덮는 한 장짜리 카드입니다. 뒤에 실제 앱이 떠 있어야 건너뛴 순간 바로 쓸 수 있습니다.
- 4단계 — 환영·테마 / AI / 관심 시장 / 시작. **어느 단계에서든 건너뛸 수 있고**, 전부 건너뛰어도 앱은 규칙 기반으로 동작합니다.
- AI 단계는 "AI가 없어도 앱은 그대로 동작합니다"를 먼저 말합니다. 키를 넣어야 쓸 수 있는 도구로 보이면 안 됩니다.
- 관심 시장 단계는 기존 `/api/market-scope`를 그대로 씁니다. 저장하면 새로 켠 시장의 수집이 바로 시작됩니다.
- 성공 문구를 남기지 않습니다. 단계가 넘어가는 것이 이미 확인이고, 남기면 다음 단계 아래에 붙어 그 단계를 저장했다고 읽힙니다.
- `aria-modal="true"`를 선언하므로 포커스를 가둡니다(Tab 순환, 단계 전환 시 제목으로 이동, Escape는 건너뛰기).
- 판정을 못 읽으면 안내를 띄우지 않습니다. 쓰던 사람에게 뜨는 쪽이 더 나쁩니다.
- **다시 보기**는 설정 > 자료 위치의 `첫 실행 안내 다시 보기`입니다. 서버 판정을 건드리지 않고 `folio:show-welcome` 이벤트로 화면만 엽니다 — 이미 자료가 있는 사람은 기록을 지워도 `firstRun`이 false라 안내가 뜨지 않고 지웠다는 사실만 남습니다.

## API

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| GET | `/api/onboarding` | `firstRun`, `completed`, `reason`(`fresh`/`existing_workspace`/`completed`), `completedAt` |
| POST | `/api/onboarding/complete` | `{skipped?: bool}` — 기록 후 갱신된 상태 반환 |

## 주의점

- 저장 위치는 `data/`이므로 [워크스페이스 위치](../common/README.md#workspacepy--workspace_servicepy)를 따라갑니다. 자료를 옮기면 안내 기록도 함께 갑니다.
- 브라우저 저장소를 쓰지 않습니다. 브라우저를 바꾸거나 지웠을 때 쓰던 사람에게 다시 뜹니다.
