# Folio OS Design System

This document records the frontend system that exists in the repository at
`af5780a2ec77621f8715a983deb886d1102fd621`. It is an extraction of the React
shell, the shared `public/styles.css` contract, report readers, and the
bridge/island surfaces; it is not a redesign brief. Values below are current
light-theme values unless explicitly labelled as a debt or an alias.

## 1. Atmosphere & Identity

Folio OS feels like a quiet investment workbench: dense information is held in
warm, cool-neutral cards against a pale gray page, while a deep-navy topbar and
report hero provide a stable frame. The recognizable signature is the
navy-and-gold reading hierarchy: gold uppercase kickers identify the current
workspace or report, navy carries primary action and canonical report surfaces,
and small purple (Personal Overlay) / teal (Thesis) accents keep user
hypotheses visually separate from source-grounded material. The UI stays
operational rather than decorative: floating navigation, a persistent Agent
Dock, readable report prose, and explicit source/status surfaces carry the
product's tone.

Sources: `public/styles.css` (`.react-shell-topbar`, `.react-route-hero-eyebrow`,
`.report-hero`, `--folio-gold`, `--folio-surface-dark`,
`--folio-purple`/`--folio-teal`); `features/frontend_ui/README.md` (React shell,
report hero, Personal Overlay and Thesis color separation).

## 2. Color

The source of truth is the `:root` block in `public/styles.css:13-110`. The
project currently declares `color-scheme: light`; there is no dark palette or
dark-mode media query. `--folio-surface-black` is intentionally an alias for
deep navy, not black.

### Palette

| Role | Existing token | Current value | Use in the UI | Source |
| --- | --- | --- | --- | --- |
| Page background | `--folio-bg` / `--bg-base` | `#f5f6f8` | App and route canvas | `public/styles.css:15,46` |
| Soft page background | `--folio-bg-soft` | `#f9fafb` | Legacy/secondary light background | `public/styles.css:16` |
| Panel surface | `--folio-surface` / `--color-panel-bg-warm` | `#f6f8fb` | Nav, Agent headers/forms, tonal cards | `public/styles.css:17,57` |
| Secondary surface | `--folio-surface-2` | `#eef1f5` | Secondary controls, tabs, chips | `public/styles.css:18` |
| Muted surface | `--folio-surface-muted` / `--surface-muted` | `#eef1f5` | User messages, muted chips | `public/styles.css:20,52` |
| Clean surface | `--folio-surface-clean` / `--card-bg` / `--color-panel-bg` | `#ffffff` | Cards, readers, inputs, popovers | `public/styles.css:19,51,56` |
| Dark report/nav surface | `--folio-surface-dark` / `--accent` / `--color-report-dark` | `#101829` | Topbar, report hero, primary controls | `public/styles.css:21,49,59` |
| Dark alias | `--folio-surface-black` / `--color-report-black` | `#101829` | Compatibility alias; never rendered as black | `public/styles.css:22,60` |
| Dark hover surface | `--folio-surface-dark-2` | `#1b2845` | Primary button hover | `public/styles.css:23` |
| Primary ink | `--folio-ink` / `--ink` | `#07111f` | Headings and body text | `public/styles.css:24,47` |
| Soft ink | `--folio-ink-soft` | `#213047` | Supporting text and links | `public/styles.css:25` |
| Muted ink | `--folio-ink-muted` / `--muted` | `#44505f` | Metadata, captions, secondary labels | `public/styles.css:26,48` |
| Inverse ink | `--folio-ink-inverse` | `#eef3f9` | Text on navy controls/topbar | `public/styles.css:27` |
| Brand accent | `--folio-gold` / `--color-brand-accent` | `#c79a45` | Eyebrows, kickers, Agent accent fallback | `public/styles.css:28,61` |
| Soft brand accent | `--folio-gold-soft` / `--color-brand-accent-soft` | `#efe0b8` | Warning/direction chips and soft gold fills | `public/styles.css:29,62` |
| Negative / performance | `--folio-burgundy` / `--color-negative` / `--color-performance` | `#8a1024` | Negative status and performance emphasis | `public/styles.css:30,63,66` |
| Soft negative | `--folio-red-soft` | `#f8e3e8` | Negative chips and soft error state | `public/styles.css:31` |
| Informational blue | `--folio-blue` / `--color-info` | `#185fa5` / `#213047` | Links, US market accents, chart/support info | `public/styles.css:32,67` |
| Soft informational blue | `--folio-blue-soft` | `#e6f1fb` | Focus outline and US market chips | `public/styles.css:33` |
| Positive green | `--folio-green` / `--color-positive` | `#3b6d11` | Done/positive state | `public/styles.css:34,65` |
| Soft positive green | `--folio-green-soft` | `#eaf3de` | Positive status chips | `public/styles.css:35` |
| Personal Overlay | `--folio-purple` / `--color-personal` | `#5b51a3` | Topic report and personal layer distinction | `public/styles.css:37,68` |
| Soft Personal Overlay | `--folio-purple-soft` | `#e9e6f6` | Personal layer chip/background | `public/styles.css:38` |
| Thesis | `--folio-teal` / `--color-thesis` | `#266c5b` | Thesis/KB market layer distinction | `public/styles.css:39,69` |
| Soft Thesis | `--folio-teal-soft` | `#e4f2ec` | KR market and thesis chip/background | `public/styles.css:40` |
| Default border | `--folio-border` / `--border` | `#dde2e9` | Card/input/divider outlines | `public/styles.css:41,53` |
| Strong border | `--folio-border-strong` | `#c4ccd6` | Hover/active separators and resize affordances | `public/styles.css:42` |
| Warning fill/text | `--color-warning-bg` / `--color-warning-text` | `#fff7df` / `#805300` | Stale market state and warnings | `public/styles.css:70-71` |
| Error fill/text | `--color-error-bg` / `--color-error-text` | `#fde8e8` / `#9f1d1d` | Destructive/error menus and notices | `public/styles.css:72-73` |
| Risk | `--color-risk` | `#b42318` | Risk-specific legacy status | `public/styles.css:64` |

### Rules observed

- Navy is the primary dark surface; a pure black theme is not part of the
  product contract (`features/frontend_ui/README.md`, “보고서 hero / 색상”).
- Gold is semantic chrome (eyebrow/kicker/status emphasis), not a decorative
  gradient. Purple and teal are reserved for the Personal Overlay and Thesis
  layers.
- New UI work must reuse the token or alias above. The existing stylesheet
  still contains a finite set of raw state/chart colors; those are recorded as
  accepted debt in Section 8 rather than silently promoted to new tokens.

### Compatibility aliases and geometry tokens

The same `:root` block also keeps legacy names in circulation. They resolve to
the palette above and are not additional colors: `--bg-base` → `--folio-bg`,
`--ink` → `--folio-ink`, `--muted` → `--folio-ink-muted`, `--accent` →
`--folio-surface-dark`, `--accent-strong` → `--folio-ink`, `--card-bg` →
`--folio-surface-clean`, `--surface-muted` → `--folio-surface-muted`,
`--border` → `--folio-border`, `--color-page-bg` → `--folio-bg`,
`--color-panel-bg` → `--folio-surface-clean`, `--color-panel-bg-warm` →
`--folio-surface`, `--color-panel-bg-muted` → `--folio-surface-muted`,
`--color-report-dark`/`--color-report-black` → the navy aliases, and
`--color-brand-accent`/`--color-brand-accent-soft` → the gold aliases. The
`--link` alias is the existing `#1b2845` navy link value. These aliases are
located in `public/styles.css:46-73` and should be preferred over adding a
second semantic color name.

Geometry tokens are likewise existing contracts, not visual suggestions:
`--react-nav-width: 280px`, `--react-nav-collapsed-width: 76px`,
`--react-agent-width: 384px` (`public/styles.css:167-169`), plus the legacy
`--workspace-left-width: 280px`, `--workspace-left-collapsed-width: 64px`,
`--workspace-right-width: 360px`, `--workspace-edge-gap: 60px`, and
`--left-nav-item-height: 38px` (`public/styles.css:3289-3293`). The legacy
`--agent-dock-width: 360px` is declared at `public/styles.css:9613-9615`.

### Dark-mode status

Dark mode is not implemented. `public/styles.css:14` sets `color-scheme: light`
and no `prefers-color-scheme: dark` block or alternate palette exists. The
public README lists dark mode as deferred; do not infer a dark column or add
dark tokens during Todo 8.

## 3. Typography

Typography is role-based and CJK-aware. `public/styles.css:1-10` imports SUIT,
IBM Plex Sans, Inter, and Bricolage Grotesque. The `@font-face` at lines 4-10
maps SUIT Medium to Korean unicode ranges so mixed Korean/Latin headings retain
optical weight.

### Font roles

| Role | Existing token/stack | Current use | Source |
| --- | --- | --- | --- |
| English UI/body | `--font-en` = IBM Plex Sans, SUIT, system-ui, sans-serif | Shell, nav, route hero, labels | `public/styles.css:93` |
| Korean UI/input | `--font-kr` = SUIT, IBM Plex Sans, system-ui, sans-serif | Agent and note textareas | `public/styles.css:94`, `.react-agent-form textarea` |
| Numeric | `--font-num` = Inter, IBM Plex Sans, SUIT, system-ui, sans-serif | Market dates/metrics/status values | `public/styles.css:95`, Market State styles |
| Display | `--font-display` = Bricolage Grotesque, SUIT, sans-serif | Folio OS mark and report/dashboard titles | `public/styles.css:96`, `.react-shell-brand`, `.react-dashboard-head h1` |
| Markdown code (fallback only) | `--font-mono` is referenced but not declared; fallback is `ui-monospace, SFMono-Regular, Consolas, monospace` | Inline code in Agent/reader Markdown | `public/styles.css:872-873`; undefined-token debt in Section 8 |

### Scale and weights

| Existing token | Value | Observed purpose | Source |
| --- | --- | --- | --- |
| `--fs-xs` | `0.75rem` (12px) | Metadata, captions, chips, kickers | `public/styles.css:76` |
| `--fs-sm` | `0.9375rem` (15px) | Buttons, labels, secondary prose | `public/styles.css:77` |
| `--fs-base` | `1.0625rem` (17px) | General UI body and nav items | `public/styles.css:78` |
| `--fs-md` | `1.25rem` (20px) | Minor headings and dashboard labels | `public/styles.css:79` |
| `--fs-lg` | `1.5rem` (24px) | Section subtitles and Agent titles | `public/styles.css:80` |
| `--fs-xl` | `1.875rem` (30px) | Route/report titles | `public/styles.css:81` |
| `--fs-2xl` | `2.125rem` (34px) | Canonical report section heading | `public/styles.css:82` |
| `--fs-3xl` | `2.5rem` (40px) | Primary metric | `public/styles.css:83` |
| `--fs-report-body` | `1.125rem` (18px) | Canonical report prose | `public/styles.css:84` |
| `--weight-heading` | `800` | Optical heading weight for mixed SUIT/IBM Plex | `public/styles.css:85` |

The current UI also uses a bounded `clamp(1.7rem, 2.2vw, 2.35rem)` for the
legacy dashboard title and `clamp(1.625rem, 7vw, var(--fs-xl))` for mobile
report titles (`public/styles.css:1783`, `9259-9267`). These are layout
mechanics around the documented scale, not new semantic sizes. Body copy stays
at or above the 15px/17px UI roles; report prose is intentionally 18px.

## 4. Spacing & Layout

There is no declared custom-property spacing scale in the current CSS. The extracted
rhythm is therefore descriptive, not a new token contract: repeated gaps and
padding cluster around 6/8/10/12/14/16/18/20/22/24/26/30/32px, with 38px
controls and 54px shell chrome. Future consolidation must add a token only
after an existing repeated value has a named semantic need.

### Stable geometry

| Region | Existing geometry | Scroll owner / fixed behavior | Source |
| --- | --- | --- | --- |
| React application shell | CSS grid: `280px minmax(0, 1fr) 384px`, rows `54px minmax(0, 1fr)`; collapsed nav is `76px`, closed Agent column is `0` | `.react-shell` owns the bounded frame; topbar/nav are fixed grid regions | `public/styles.css:166-191` |
| Topbar | `min-height: 54px`, 18px horizontal padding, navy surface | Fixed by grid row; not a scroll owner | `.react-shell-topbar`, `public/styles.css:193-205` |
| Left navigation | 16px outer margin, 14px/18px internal padding, 8px radius, nav group stack | Fixed grid column on desktop; mobile becomes a horizontally scrollable nav item row | `.react-shell-nav`, `.react-left-nav`, `public/styles.css:208-341`, `2781-2829` |
| Route host | 32px desktop padding; `overflow: auto` | **Primary vertical scroll owner for React routes**; route pane restores `scrollTop` per `web/src/app/AppShell.tsx:159-172` | `public/styles.css:442-456`, `web/src/app/AppShell.tsx:159-172` |
| Agent Dock | 384px desktop grid column; header/form auto rows and body `minmax(0, 1fr)` | `.react-agent-dock-body` is the message scroll owner; closed state is a fixed bottom-right AI pill | `public/styles.css:600-744`, `web/src/app/ReactAgentDock.tsx` |
| Route hero | Two-column copy/actions grid, 26px/30px/28px padding, 8px radius | Participates in route host scroll; mobile stacks to one column | `.react-route-hero`, `web/src/app/RouteHero.tsx`, `public/styles.css:1080-1150`, `2781-2858` |
| Report reader stage | Desktop grid: report body plus 320–360px right column; rail is sticky/internal-scroll and note fills remaining column | Reader body is inside route host; rail `overflow:auto`; note panel is sticky on desktop and stacked/full-screen on mobile | `web/src/app/reportReader/ReportReaderShell.tsx`, `public/styles.css:9363-9580` |
| Input/form panels | 100% width, 12px radius, 24px base padding; fields use 48px minimum height | Form content follows route host scroll | `.input-panel`, `.input-panel-header`, `public/styles.css:7518-7549`, `8770-8799` |
| Report/card feeds | Single-column list with 10px item gap; card padding 16px and 12px radius | Feed follows route host scroll; empty feed uses dashed border frame | `.report-feed`, `.report-feed-card`, `.report-feed-empty`, `public/styles.css:8470-8564` |

### Responsive states

- `max-width: 760px`: React shell changes to one column; topbar and nav stack,
  nav items use an internal `overflow-x: auto` row, route host padding becomes
  14px and document flow scrolls, Agent Dock becomes a bottom sheet with a
  420px minimum. Home, dashboard grids, filters, and reader actions collapse
  to one readable column (`public/styles.css:2781-3035`).
- `761px–1199px`: the React shell remains the desktop grid, while legacy
  shell/layout rules hide fixed sidebar controls below 1200px. Reader-specific
  rules at `761px–1500px` stack report body, rail, and note when the Agent Dock
  is open (`public/styles.css:9543-9579`).
- `max-width: 1100px`, `900px`, `820px`, and `700px`: legacy filter grids and
  form controls progressively reduce columns; these are content breakpoints,
  not device labels (`public/styles.css:7359-7386`, `8750-8768`, `8961-8999`).
- `min-width: 1200px` and `1760px`: legacy shell reserves a fixed left rail
  and Agent Dock; the 1760px action-panel branch is intentionally empty because
  report actions moved into the reader rail (`public/styles.css:3283-3505`).

The current shell still uses `height: 100vh`/`min-height: 100vh` in several
places. The dynamic-viewport limitation is explicit debt in Section 8; it is
not a hidden layout assumption.

## 5. Components & Staged Workspace States

These are the reusable primitives that already occur across routes. New
components should compose these classes and components before introducing a
one-off visual pattern.

### `AppShell` / shell chrome

- **Structure**: `.react-shell` grid → `.react-shell-topbar` → `.react-shell-nav`
  and `.react-left-nav` → `.react-shell-main` / `.react-route-host` → optional
  `ReactAgentDock` and `CommandPalette`.
- **Variants**: `is-nav-collapsed`, `is-agent-open`, `is-agent-closed`, and
  `is-agent-suppressed` (Home hides the global Dock).
- **Spacing/surface**: 54px topbar, 280/76px nav, 384px Dock, 32px route host
  padding, 8px radius and `--elev-1` nav/card chrome.
- **States**: nav default/hover/active/focus-visible/collapsed; restart button
  default/disabled (`restarting`); Dock open/closed; status text is
  `aria-live="polite"`.
- **Accessibility**: labelled nav landmarks, button `aria-expanded` for the
  collapse toggle, SVG icons `aria-hidden`, keyboard-visible focus and
  tooltip-on-focus in collapsed navigation.
- **Motion/scroll**: column transition uses `--dur`; `.react-route-host` owns
  route scroll; route scroll positions are restored on hash navigation.
- **Source**: `web/src/app/AppShell.tsx`, `public/styles.css:166-552`.

### `RouteHero`

- **Structure**: `<header class="react-route-hero">` with eyebrow, `h1`,
  description, and optional action cluster.
- **Variants**: action slot present/absent; one-column mobile reflow.
- **States**: action buttons default/hover/focus/disabled; copy remains
  readable for long descriptions.
- **Accessibility**: semantic header/heading; action controls are native
  buttons; no decorative icon is required.
- **Source**: `web/src/app/RouteHero.tsx`, `.react-route-hero*` in
  `public/styles.css:1080-1150`.

### `input-panel` + `input-panel-header`

- **Structure**: panel container, heading/description row, `.field` labels,
  native input/select/textarea, and an action row.
- **Variants**: briefing generation/archive, company analysis query, topic
  report (`topicrpt-form`), settings panel, watchlist editor, RSS filter/search.
- **States**: default, hover elevation on hover-capable devices, focus-visible
  fields, disabled buttons, form loading labels (`불러오는 중`, `생성 중`),
  validation/error messages beside the panel, and empty feed below it.
- **Accessibility**: labels wrap native controls; fields retain the global
  focus-visible rule; 48px minimum field height supports touch and zoom.
 - **Source**: `web/src/app/BriefingRoute.tsx`, `web/src/app/CompanyAnalysisRoute.tsx`,
   `web/src/app/DeepResearchRoute.tsx`, `web/src/app/SettingsRoute.tsx`, `web/src/app/WatchlistRoute.tsx`,
  `public/styles.css:7518-7650`, `8770-8799`.

### `filter-btn` family

- **Structure**: native button/link with shared 38px minimum height, 8px
  padding, border, and radius.
- **Variants**: `.apply` (navy primary), `.clear`/`.action-link`/`.toggle`
  (secondary), `.download`, `.notion`, `.obsidian`, and route-specific
  `.topicrpt-preset`/`.active`.
- **States**: default, hover lift/border change, active navy fill, focus-visible,
  disabled (opacity/cursor/background reset), and busy copy supplied by the
  route (for example `생성 중`, `내보내는 중`).
- **Accessibility**: native button semantics; icon+label action buttons keep a
  visible text span; disabled controls are not clickable.
- **Source**: `public/styles.css:4052-4102`, `web/src/app/reportReader/ReaderActions.tsx`.

### `ReportReaderShell` / reader rail / note panel

- **Structure**: breadcrumb → `report-reader-stage` → report dialog (dark
  `.report-hero` + light `.headline`/`ReportBody`) + optional action rail +
  `FolioNotePanel`.
- **Variants**: `no-side`, `no-rail`, `no-note`; briefing/company/topic readers
  share the shell; desktop two-column, medium stacked, mobile vertical/full-
  screen note panel.
- **States**: reader closed/list, loading/error while detail loads, report body
  with or without sources/charts, rail action default/hover/focus/disabled,
  note empty/loading/saved/agent-busy, linked-notes empty/list, overlay present
  or absent.
- **Accessibility**: report main is labelled, breadcrumb buttons are native,
  report source links open safely with `rel`, note panel is an explicit labelled
  aside, and charts expose `role="img"` plus focusable points.
- **Motion/scroll**: rail is sticky with its own bounded overflow on desktop;
  note panel is the second sticky column; route hash is the reader source of
  truth (`features/frontend_ui/README.md`).
- **Source**: `web/src/app/reportReader/ReportReaderShell.tsx`,
   `web/src/app/reportReader/ReaderActions.tsx`, `web/src/app/reportReader/ReportBody.tsx`, `web/src/app/reportReader/MarkdownRenderer.tsx`,
   `web/src/app/reportReader/FolioNotePanel.tsx`; `public/styles.css:2538-2780`, `9363-9580`.

### `report-feed-card` / `briefing-archive-card`

- **Structure**: grouped feed header → full-width card button → optional delete
  button; metadata chips/title/date footer.
- **Variants**: analysis/topic cards and US/KR/both briefing cards use their
  existing blue/purple/teal soft ramps and leading 4px accent stripe.
- **States**: default, hover lift/elevation, focus-visible outline, delete
  hover/focus/disabled, and dashed empty state.
- **Accessibility**: card is a button with text; delete has an explicit label
  and confirmation; metadata wraps rather than forcing a horizontal layout.
 - **Source**: `public/styles.css:8470-8775`,
   `web/src/app/BriefingRoute.tsx`, `web/src/app/CompanyAnalysisRoute.tsx`,
   `web/src/app/DeepResearchRoute.tsx`.

### `ReactAgentDock` / Agent message states

- **Structure**: labelled header/logo and actions → scrollable message body →
  optional preflight/notice/error/run card → composer with textarea, attachments,
  model/effort controls, and submit button.
- **Variants**: open right dock, closed bottom-right pill, mobile bottom sheet;
   provider accent/logo is selected by `PROVIDER_META` in `web/src/app/ReactAgentDock.tsx`.
- **States**: assistant/user/pending messages; run card `pending` (spinner),
  `done` (check), `error` (exclamation); preflight, notice, error; composer
  disabled/busy; attachment chip list empty/non-empty.
- **Accessibility**: labelled dock/form, live status/error text, native controls,
  and keyboard-accessible close/new-chat/actions.
- **Motion/scroll**: body `.react-agent-dock-body` owns message scroll;
  pending spinner uses `agent-spin`; reduced-motion disables animation.
- **Source**: `web/src/app/ReactAgentDock.tsx`,
  `web/src/app/AgentMessageContent.tsx`, `public/styles.css:600-1100`.

### `MarketStateDashboard`

- **Structure**: head/as-of → summary and scope tabs → interpretation/posture
  overview → driver cards/details → checkpoints and collapsible sources.
- **Variants**: scope `overall/us/kr`; driver direction and momentum chips;
  stale as-of/warning presentation; action/update control.
- **States**: current snapshot, stale snapshot, empty/absent data (route error
  or dashboard fallback), loading/error messaging, collapsed/expanded driver
  details and source disclosure.
- **Accessibility**: scope buttons are native controls, driver details use
  `<details>`, source list links are explicit, and status/error text remains
  textual rather than color-only.
- **Source**: `web/src/islands/MarketStateDashboard.tsx`,
  `web/src/app/MarketMemoryRoute.tsx`, `public/styles.css:9990-10630`.

### Deep Research staged-workspace anatomy (Todo 8)

The existing route is already built from the primitives above, although its
state is currently represented by booleans/strings rather than a phase enum.
Todo 8 names the typed phase contract; the following table records the visual
anatomy that must remain grounded in existing components when that refactor is
made.

| Phase | Existing state/source | Existing visual primitive and recovery rule |
| --- | --- | --- |
| `readiness` | `loading`, initial `/api/topic-reports` load, `reports` list | `RouteHero` + `input-panel topicrpt-form`; show readiness/status copy in the existing status/error slots; do not submit until prerequisites are known |
| `draft` | `topicKey`, `customLabel`, `userContext`, `deepResearch` form state | `topicrpt-preset`, `.field`, `.topicrpt-context-field`, `.topicrpt-action-row`; retain values on failed requests |
| `plan-loading` | Todo 8 adds `/api/topic-reports/plan`; current analogue is `generating`/`status` | Keep the input panel and use the existing `react-reader-status`/warning treatment; no silent bypass |
| `plan-review` | Todo 8 plan contract (report type, axes, queries, bounds, gaps, collection/Market State policy) | Reuse `input-panel-header`, `section-kicker`, chips, and `filter-btn apply` for an explicit Continue action; plan data is review metadata, not evidence |
| `generation` | current `generating`, Agent job polling via `pollJob` | Existing busy button copy and `react-reader-status`; Agent run card/pending state when the job is visible; preserve draft and surface recoverable errors |
| `report` | `selected` report + `detailId` hash | `ReportReaderShell` with report hero, `ReportBody`, sources, rail, and note panel; hash remains the source of truth |
| recoverable error | `error`, `status`, failed detail/generation/load | `.react-dashboard-error` for blocking errors, `.react-dashboard-warning` for non-blocking/status notices, and unchanged form state; do not erase input or report count |

This table is a state contract, not a new visual direction. It is anchored to
`web/src/app/DeepResearchRoute.tsx:136-238,350-530`, the Todo 8 plan, and the
existing CSS selectors named in each row.

## 6. Motion & Interaction

### Existing motion tokens

| Token | Value | Current use | Source |
| --- | --- | --- | --- |
| `--dur-fast` | `0.12s` | Nav/tooltips and compact control transitions | `public/styles.css:105` |
| `--dur` | `0.2s` | Shell/grid, disclosure, panel/control transitions | `public/styles.css:106` |
| `--ease` | `ease` | Shared timing function | `public/styles.css:107` |
| `--elev-1`/`--elev-2`/`--elev-overlay` | Rest/hover/overlay shadows | Cards, rails, nav, modal/sheet surfaces | `public/styles.css:99-101` |

Observed interaction behavior:

- Nav items, filter buttons, cards, and Agent FABs use small hover lift
  (`translateY(-1px)`; input/filter panels may lift `-2px`) and border/surface
  changes. Disabled controls remove the lift and reduce opacity.
- Report reader cards and feed cards use 150ms border/transform/shadow
  transitions; market scope tabs use an 180ms indicator transform; some legacy
  controls use 250ms or 600ms transitions.
- Agent jobs use a 0.9s linear spinner and done/error icon states. Legacy hero
  `fadeUp` uses a 0.6s ease animation. These are existing values, not new
  timing tokens.
 - Keyboard interactions are explicit in `web/src/app/CommandPalette.tsx`: Ctrl/⌘K opens,
  Escape closes, ArrowUp/ArrowDown changes the active option, Enter executes;
  the input receives focus on open. Native buttons, links, form controls, and
  chart points remain keyboard reachable.
- `@media (prefers-reduced-motion: reduce)` disables animation, transitions,
  and smooth scrolling, and removes hover transforms (`public/styles.css:9284-9300`).

The current CSS also transitions `grid-template-columns`, `box-shadow`,
`background`, and `border-color` in a few places. This is a located motion
consistency debt (Section 8), not a reason to change the current look while
Todo 8 stages the workspace.

## 7. Depth & Surface

Folio OS uses a **mixed** strategy: thin cool-gray borders define boundaries,
tonal surface shifts establish hierarchy, and a restrained two-level shadow
system raises interactive chrome. Report prose and visual cards intentionally
stay flatter than controls.

### Elevation

| Level | Existing token/value | Usage | Source |
| --- | --- | --- | --- |
| Resting chrome | `--elev-1`: `0 4px 12px rgba(7,17,31,.045), 0 0 8px rgba(7,17,31,.02)` | Nav, cards, route hero, Agent FAB, reader rail | `public/styles.css:99`, `--elev-1` consumers |
| Hover/raised | `--elev-2`: `0 8px 20px rgba(7,17,31,.075), 0 0 10px rgba(7,17,31,.025)` | Hovered panels/buttons and raised chrome | `public/styles.css:100`, `@media (hover:hover)` |
| Overlay | `--elev-overlay`: `0 18px 44px rgba(7,17,31,.16), 0 0 18px rgba(7,17,31,.04)` | Mobile Agent sheet and overlays | `public/styles.css:101`, `.react-agent-dock` mobile |
| Legacy alias | `--folio-shadow` | `0 6px 14px rgba(7,17,31,.045), 0 0 10px rgba(7,17,31,.025)` | Legacy/report feed compatibility | `public/styles.css:43` |

### Surface rules

- Cards and panels use `--folio-surface-clean` or `--folio-surface`; secondary
  controls use `--folio-surface-2`/`--folio-surface-muted`.
- The route/report hero uses deep navy plus a gold kicker; reader body and
  Markdown remain clean/light and do not receive hover lift.
- Borders are normally `1px solid var(--folio-border)`; stronger separators use
  `--folio-border-strong`. Some legacy cards use 12px/14px radii while shared
  shell chrome uses `--folio-radius: 8px`; this radius spread is recorded as
  debt rather than flattened here.
- Pills/chips and compact Agent controls use `--radius-pill: 999px`; ordinary
  cards/controls use their existing 8/9/10/12/14/18px values.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- **WCAG**: Treat WCAG 2.2 AA as the target for new UI work: 4.5:1 minimum
  contrast for normal body text, 3:1 for large text and UI graphics, visible
  focus for every interactive control, keyboard reachability, and no content
  or task loss at 200% text/zoom. This is the acceptance bar; the repository
  does not claim a completed audit.
- **COGA/cognitive accessibility**: Keep route titles/eyebrows predictable,
  plain-language action labels, one primary action per panel, explicit loading/
  empty/error copy, recoverable errors that preserve typed input, and a stable
  Home → route → reader mental model. Do not use color alone for market state,
  direction, or job status; retain text labels/chips and disclosure summaries.
- **Keyboard**: Native buttons/links/inputs are the baseline. Preserve
  Command Palette Ctrl/⌘K, Escape, ArrowUp/ArrowDown, Enter behavior; preserve
  visible `:focus-visible` outlines on inputs, nav, cards, controls, chart
  points, and disclosure triggers. Do not add pointer-only actions.
- **CJK/localization**: Keep `lang="ko"`, SUIT unicode-range weight correction,
  Korean-first `--font-kr` inputs, and `word-break: keep-all` with
  `overflow-wrap: anywhere` in reader/Agent prose. Labels and status messages
  may remain Korean; do not force Latin-only truncation or fixed-width copy.
- **Reduced motion**: Honor `prefers-reduced-motion: reduce` exactly as the
  existing media query does—disable non-essential animation/transitions and
  smooth scrolling; never make task completion depend on motion.
- **Responsive/content stress**: At 375px the primary route is one readable
  column with no horizontal primary-content scrollbar; long labels wrap or
  ellipsize, unbroken URLs/tokens wrap anywhere, and only explicitly scoped
  navigation/selector rows may scroll horizontally. Scroll ownership remains
  named in Section 4.

### Accepted debt

| Item | Located source | Why it is accepted now | Owner / exit condition |
| --- | --- | --- | --- |
| No dark mode or dark token column | `public/styles.css:14`; `README.md` deferred-feature list | Dark mode is explicitly deferred from the current product surface; inventing a dark palette would change the existing look | Frontend/product owner; revisit only when dark mode is scheduled and visual QA covers both schemes |
| `100vh` rather than dynamic viewport units in shell/sheets | `public/styles.css:171`, `2783`, `9675` and related rules | Existing shell geometry is stable on current desktop/mobile layouts; changing it is a cross-surface layout task outside Todo 8 | Frontend owner; migrate to `100dvh`/`100dvb` with iOS address-bar QA |
| Undefined compatibility tokens have fallbacks | `--font-mono`, `--folio-ink-subtle`, `--folio-muted`, `--folio-radius-sm`, `--folio-surface-soft`, `--fs-2xs` are referenced but not declared in `public/styles.css` | Legacy/bridge CSS still renders through fallback values; adding tokens without a consolidation pass risks visual drift | Frontend owner; define or replace each token after a selector-by-selector audit |
| Raw chart/state colors bypass the root palette | `web/src/app/reportReader/AnalysisCharts.tsx:29` (`COLORS`), plus literal warning/error/rgba values in `public/styles.css` | Existing charts and status treatments are stable and their colors are visible in the current UI; no new raw colors may be added | Frontend owner; map every literal to a documented semantic token and rerun contrast QA |
| Mixed duration and non-compositor transitions | `public/styles.css` includes 120/150/180/200/250/600/900ms values and transitions on grid/background/box-shadow | Existing micro-interactions are small and reduced-motion is covered; a timing cleanup would touch many legacy surfaces | Frontend owner; consolidate to named timing tokens and transform/opacity where feasible |
| Command Palette focus restoration/trap is not explicit | `web/src/app/CommandPalette.tsx:82-176` focuses the input and handles keys but does not restore focus or set `aria-activedescendant` | Current keyboard path is usable and the palette is a short-lived overlay; no Todo 8 change should regress it | Frontend owner; add focus return/trap and option announcement, then keyboard/screen-reader QA |
| Radius and spacing values are not fully tokenized | Repeated 8/9/10/12/14/18px radii and 6–32px gaps in `public/styles.css`; no `--space-*` scale | The extracted system must preserve current look; mass tokenization is a separate consolidation change | Frontend owner; promote only repeated semantic values after inventory and visual diff |

Accepted debt is explicit and located. It must not be removed from this record
by a passing typecheck or by a Todo 8 UI refactor.
