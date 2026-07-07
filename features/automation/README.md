# Automation

Automation stores local settings for RSS collection, Market Memory digest updates, briefing prerequisites, and scheduled briefing generation.

Automation is local-only: it runs while the Folio OS server is running. If the PC is asleep, shut down, or the server is stopped, scheduled work may be skipped according to the missed-run setting.

Settings live in `data/automation-settings.json`. Recent run summaries live in `data/automation-runs.json`.

The service exposes manual run endpoints and a single scheduler loop. `app.py` only starts that loop during FastAPI lifespan startup; all timing, due checks, and run dispatch stay in `features/automation/service.py`.

Run kinds:

- `rss`: collect RSS evidence into `research-inbox/rss/`.
- `marketMemory`: summarize RSS short-term memory into Market Memory, then run the rules-based regime trend refresh (`refresh_all_regimes`) for active/watch states. 화면의 수동 `추세 갱신` 버튼을 없앤 대신 이 경로가 momentum/confidence/근거 카운트를 자동으로 갱신한다.
- `briefingPrerequisites`: run RSS and Market Memory together.
- `briefing`: optionally run prerequisites, then generate a saved daily briefing using the selected generation mode.
