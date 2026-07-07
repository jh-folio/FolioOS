# React SPA Rewrite Design

## Summary

Folio OS will move from a `public/index.html` + `public/app.js` owned frontend to a React/TypeScript SPA served by the existing FastAPI static server. The rewrite is intentionally broad: new Agent Home, Dashboard, Report Reader, Native Notes, and later feature screens should be implemented on React rather than extending the current vanilla shell.

The existing app remains operational during the transition. React first takes over shell responsibilities, then individual screens, then report readers, and only at the end removes legacy DOM and render functions.

## Current State

- `web/` builds a Vite bundle into `public/react/folio-react.js`.
- `web/src/main.tsx` is an island registry.
- The only React-owned surface is `MarketStateDashboard`.
- Routing, navigation, Agent Dock, report readers, forms, settings, and most state live in `public/app.js`.
- `public/index.html` still contains all view DOM.

## Design Direction

React becomes the default UI owner through a staged migration:

1. Inventory and freeze current frontend contracts.
2. Add a React app shell that can render navigation, top status, route hosts, and legacy view containers.
3. Build Agent Home as the first fully React screen.
4. Split Dashboard into its own React route.
5. Rewrite report readers with a shared React `ReportReaderShell`.
6. Migrate remaining feature screens.
7. Remove legacy view DOM and unused vanilla render code.

## Architecture

```text
FastAPI
  serves public/index.html
  serves /react/folio-react.js from Vite build
  exposes existing JSON APIs

React SPA
  AppShell
  route store
  API client
  job polling
  Agent Home
  Dashboard
  ReportReaderShell
  feature screens

Legacy Bridge
  typed window.FolioBridge
  route-to-legacy fallback
  markdown compatibility wrapper
  third-party widget wrappers
```

## Boundaries

- Backend feature logic stays in `features/`.
- `app.py` remains route/orchestration only.
- React does not change JSON/SQLite storage formats.
- Notes and attachments remain hypothesis, not evidence.
- Agent proposals require approval before saved report markdown changes.
- Canonical markdown and Personal Overlay/notes remain separate layers.

## Routing

Initial React routing should use a lightweight hash route store rather than adding React Router immediately. Folio OS is local, existing deep links already rely on hash state, and this avoids extra dependency churn in Phase 1. A later task can introduce React Router if nested routes become complex.

Target routes:

- `/home`
- `/dashboard`
- `/briefing`
- `/rss`
- `/market-memory`
- `/analysis`
- `/deep-research`
- `/watchlist`
- `/portfolio`
- `/notes`
- `/settings`

## Migration Strategy

The first implementation must not delete legacy UI. React renders a shell and can mount legacy view containers inside route slots. Each later screen migration removes one legacy responsibility only after browser verification shows parity.

## Testing

Each phase must run:

```powershell
npm run typecheck
npm run build
node --check public\app.js
```

Backend-touching phases also run focused `py -3 -m py_compile` and relevant pytest targets. Browser verification is required for desktop and mobile widths.

## Open Choices Resolved

- Full rewrite is chosen over island-only migration.
- Rewrite is staged, not a big-bang cutover.
- React Shell precedes Agent Home and Dashboard work.
- Existing API response shapes stay fixed during early migration.
