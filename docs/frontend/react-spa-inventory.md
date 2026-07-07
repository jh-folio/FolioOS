# React SPA Inventory

## Legacy Owners

| Area | Current owner | React target | Notes |
| --- | --- | --- | --- |
| Routing/navigation | `public/app.js::switchViewById`, `renderLeftNavigation` | `web/src/app/routes.ts`, `AppShell` | Hash compatibility must be preserved during migration. |
| Top status/jobs | `#status`, `#jobProgress`, `pollJob` | `statusStore`, `TopStatusBar` | Existing job APIs stay unchanged. |
| Agent chat/dock | `public/app.js` Agent functions | `AgentHome`, later shared Agent components | Proposal approval contract stays backend-owned. |
| Market state dashboard | `web/src/islands/MarketStateDashboard.tsx` | Dashboard route component | Existing island becomes normal component. |
| Report readers | `openBriefingReader`, `openAnalysisReader`, `openTopicReader` | `ReportReaderShell` | Canonical markdown remains separate from notes/overlay. |
| Native notes | note panel in `public/app.js`, `/api/investment-notes` | React note panel | Notes are hypothesis, not evidence. |
| Settings | `renderSettings`, setup handlers | React settings route | No secret values rendered. |

## API Contracts To Preserve

| Feature | Endpoints | Migration rule |
| --- | --- | --- |
| Dashboard | `GET /api/dashboard` | Keep response shape in Phase 1. |
| Market State | `GET /api/memory/state-dashboard?limit=5` | Existing component can consume unchanged. |
| Agent Chat | `POST /api/agent/chat`, `GET /api/jobs/{id}` | React uses same job polling. |
| Agent Proposals | `POST /api/agent/proposals/{id}` | Approval required before writeback. |
| Briefings | `GET /api/briefings/index`, `GET /api/briefings/{date}`, `POST /api/briefings` | `/api/briefings/index` is the cached archive/feed contract; reader migration must preserve per-market/deeplink behavior. |
| Investment Notes | `GET /api/investment-notes`, `GET /api/investment-notes/{note_id}`, `GET /api/investment-notes/linked`, `POST /api/investment-notes` | Notes remain hypothesis; linked-note loading must remain available for report note panels. |

## Migration Guardrails

- React shell may wrap legacy views, but must not delete them in Phase 1.
- `renderMarkdown()` parity is required before React reader migration.
- Browser verification must check console errors and mobile overflow.
