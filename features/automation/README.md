# Automation

Automation stores local settings for RSS collection, Market Memory digest updates, briefing prerequisites, and scheduled briefing generation.

0.2에서 Automation은 Deep Research 계획 승인이나 실행을 자동으로 시작하지 않으며 Smart Collection을 materialize하지 않습니다. Deep Research는 사용자가 화면에서 질문·계획·자료 부족 경고를 확인하고 명시적으로 승인하는 흐름입니다.

Automation is local-only: it runs while the Folio OS server is running. If the PC is asleep, shut down, or the server is stopped, scheduled work may be skipped according to the missed-run setting.

Settings live in `data/automation-settings.json`. Recent run summaries live in `data/automation-runs.json`.

The service exposes manual run endpoints and a single scheduler loop. `app.py` only starts that loop during FastAPI lifespan startup; all timing, due checks, and run dispatch stay in `features/automation/service.py`.

Run kinds:

- `rss`: collect RSS evidence into `research-inbox/rss/`.
- `marketMemory`: summarize RSS short-term memory into Market Memory, then run the rules-based regime trend refresh (`refresh_all_regimes`) for active/watch states. 화면의 수동 `추세 갱신` 버튼을 없앤 대신 이 경로가 momentum/confidence/근거 카운트를 자동으로 갱신한다.
- `briefingPrerequisites`: run RSS and Market Memory together.
- `briefing`: optionally run prerequisites, then generate a saved daily briefing using the selected generation mode. 예약마다 독립된 job이며 실행 기록에 `scheduleId`가 붙는다.

## 브리핑 예약 (0.5.2)

`briefingSchedules`는 목록이다. 예전에는 **하나만** 등록할 수 있었는데, 시장이 넷이 되면서
마감 시각이 전부 달라져(유럽 01:30 · 미국 05~06 · 일본 15:00 · 한국 15:30 KST) 시각 하나로는
구조적으로 안 된다 — 08:00 한 번이면 미국 마감은 담지만 한국·일본은 개장 전이다.

```json
{ "id": "…", "enabled": true, "time": "18:00", "markets": ["kr", "jp"],
  "briefingType": "concise", "qualityMode": "diagnose_only", "runPrerequisites": false }
```

- **상한 5개.** 없으면 24개를 만들어 하루 종일 LLM을 돌릴 수 있다. 화면과 서버가 같은 값으로 자른다.
- `markets`는 `build_briefing(markets=[...])`에 그대로 넘어간다. 엔진은 이미 시장 집합을 받고 있었고 자동화만 옛 단일 문자열에 갇혀 있었다.
- **관심 시장과는 실행 시점에 교집합**을 낸다(`markets_in_scope`). 선택 자체를 막지 않는 이유는 시장을 잠깐 껐다 켜는 동안 예약이 파괴되면 안 되기 때문이다. 전부 꺼져 있으면 건너뛰고 `markets_out_of_scope`를 실행 기록에 남긴다. 범위를 못 읽으면 요청대로 돌린다 — 설정 파일 하나 때문에 브리핑이 멈추는 쪽이 더 나쁘다.
- 같은 주기에 같은 시장 집합이 두 번 만들어지지 않는다(시각이 가까운 예약 둘이 같은 시장을 볼 때).
- 저장된 `briefing` 싱글톤은 읽을 때 예약 하나로 승격한다. `marketScope: both` → `markets: ["us","kr"]`.
- 손으로 만드는 브리핑은 어느 예약에도 속하지 않으므로, 켜 둔 예약 중 하나라도 원하면 사전 수집을 한다(`wants_prerequisites`).

## 놓친 실행과 재시도

- `missedRuns.catchUpHours` (0·1·3·6·24, 기본 3). 예전 `onStartup`은 `skip`/`catch_up` 둘뿐이었고 둘 다 나빴다 — 앞의 것은 10분 창이 전부라 08:15에 PC를 켜면 그날 브리핑이 없었고, 뒤의 것은 상한이 없어 23:50에 켜도 아침 브리핑을 만들었다. 저장된 값은 읽을 때 옮긴다(`skip`→0, `catch_up`→24)므로 기존 사용자의 동작은 바뀌지 않는다.
- 0시간을 골라도 스케줄러가 1분마다 도므로 10분 창은 바닥으로 남는다.
- **성공한 실행만 "오늘 했다"로 친다.** 예전에는 상태를 보지 않아 LLM이 한 번 타임아웃 나면 그날 브리핑이 아예 없었다. 실패하면 30분 뒤 재시도하고 하루 3회에서 멈춘다. 상한은 **예약별**이라 아침이 세 번 실패해도 저녁은 돈다.

## 실패 기록

실패한 실행은 `errorType`(예외 클래스 이름)과 `errorReason`(분류된 한국어 원인)을 남긴다.
**예외 원문은 담지 않는다** — 반환값과 실행 기록이 모두 HTTP로 나가고 메시지에는 요청 URL,
헤더, 프롬프트 조각이 실릴 수 있다. 키 패턴만 지우는 방식으로는 모르는 형태를 막지 못한다.
`tests/test_security_alert_regressions.py`가 이 경계를 지킨다.
