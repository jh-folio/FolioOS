# Folio OS React SPA (web/)

`web/` owns the Folio OS frontend. It is a Vite + React + TypeScript app that
builds into `public/react/folio-react.js`, which is loaded by the FastAPI static
entrypoint at `public/index.html`.

## How It Fits Together

```text
public/index.html      # minimal static entrypoint with #folioReactRoot
public/app.js          # bridge-only helpers used by React readers and Agent context
public/styles.css      # shared Folio OS design tokens and component styles
web/src/main.tsx       # mounts the React SPA
web/src/app/           # AppShell, routes, Agent Home, readers, feature screens
web/src/islands/       # reusable React surfaces consumed by routes
public/react/          # committed Vite build output
```

- React owns routing, navigation, Agent Home, Dashboard, report readers, RSS,
  Market Memory, Company Analysis, Watchlist, and Settings.
- Deep Research remains routable for saved topic-report/deeplink compatibility,
  but is hidden from the default 0.1 nav, Home quick actions, and command
  palette.
- `public/app.js` no longer owns view routing. It remains as a compatibility
  bridge for `FolioBridge` methods such as `renderMarkdown`,
  `briefingSourcePanelHtml`, `renderBriefingVisuals`, `updateAgentContext`, and
  `openAgentDock`.
- The built bundle in `public/react/` is committed so users can run Folio OS
  without a local Node build step.

## Build

```bash
cd web
npm install
npm run build      # -> ../public/react/folio-react.js
npm run typecheck  # tsc --noEmit
npm test           # source contract tests
```

Run `npm run build` after changing `web/src` so `public/react/folio-react.js`
matches the source.
