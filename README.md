# Folio OS

**A local-first investment research workspace for individual investors**

[한국어 README](README.ko.md)

Folio OS 0.3.0 helps you collect market news and research material on your own PC, then turn it into daily briefings, market context, company analysis, and auditable Deep Research with optional AI assistance.

Your files and generated reports stay local by default. LLM/API integrations are optional and only used when you configure them.

---

## What You Can Do In 0.3.0

- Chat with the Folio OS AI Agent from the Home screen.
- Review market, report, checkpoint, and portfolio context from the Dashboard.
- Maintain a local company, sector, and theme Watchlist with related news.
- Collect and search public RSS/news feeds.
- Generate US/KR daily market briefings.
- Read a simplified medium-term Market Memory view.
- Generate company analysis reports from local evidence and official data where available.
- Run question-first Deep Research: review an evidence plan before execution, reuse Smart Collections, inspect deterministic collection health and bounded changes, and reopen reports with provenance, gaps, quality, and Market State shown as separate layers.
- Save report-side thoughts as hypotheses, review note/thesis freshness and challenging evidence, and track revision-safe checkpoints without requiring an Agent.
- See bounded, read-only Investment Context from portfolio/watchlist ticker links on existing research screens without exposing quantities, prices, weights, or note bodies.
- Review a metadata-only Agent Work Log and explicitly approve or reject report revision proposals.
- Write report-side Folio Notes.
- Export generated reports to Obsidian or Notion.
- Choose Light, Dark, or System appearance across the workspace.
- Configure LLM CLI/API, model choices, RSS, automation, appearance, and export settings.

Not included in the 0.3.0 user surface:

- Advanced portfolio management and standalone note-management workflows.
- Installer/tray-app polish.

---

## Install And Run

See [installation.md](installation.md) for full setup instructions.

Recommended paths:

- **AI Agent-assisted setup**: give the GitHub link to Codex, Claude Code, or another local coding agent and ask it to install and run Folio OS.
- **Manual setup**: install Python dependencies, copy `.env.example` to `.env`, and run the startup script.

Quick Windows launch after setup:

```text
start-archive.cmd
```

Quick macOS / Linux launch after setup:

```bash
bash start.sh
```

Then open:

```text
http://localhost:8787
```

Keep the server process running while using Folio OS.

---

## Where To Put Research Material

Put user-provided research inputs under `research-inbox/`:

```text
research-inbox/
  articles/   # saved articles, web pages, text/markdown/html files
  rss/        # RSS collection output
  reports/    # broker reports, IR material, research PDFs
  filings/    # SEC/DART filings and official documents
  links/      # URL lists
```

Folio OS stores generated data under `data/`:

```text
data/
  briefings/
  company-analysis/
  topic-reports/
  investment-notes/
  caches and local databases
```

Do not delete `data/`, `research-inbox/`, `config/`, or `.env` unless you intentionally want to remove local settings and generated data.

---

## Main Screens

### Home

Home is where you ask the AI Agent for research. Type a question or ask it to revise a saved report, and start a briefing, an RSS collection, a company analysis, or deep research from the quick actions.

The Agent work log below shows only the latest status as a single line; expand it for the full history. It never shows the body of a task or your private research material.

### Dashboard

Dashboard brings current-market widgets, recent reports, checkpoints, and bounded portfolio context into one review screen. Market widgets use TradingView and retain their source attribution.

### Watchlist

Track companies, sectors, and themes in a local Watchlist, then inspect the related news cards and market response. Watchlist data stays in the local workspace.

### Briefing

Create and read daily market briefings. Briefings use news/RSS-style inputs and stored market snapshots where available. If AI is configured, Folio OS can use it for richer writing; otherwise it falls back to rule-based generation.

### RSS Feed

Collect, filter, search, and merge public RSS/news items. Folio OS does not bypass paid article access. It uses public RSS/link metadata and material you save locally.

Freely accessible article bodies can also be stored for your local archive. Toggle this with the "save article full text" option under Settings > Automation > RSS collection (on by default); stored bodies improve briefing and search quality.

### Market Memory

Market Memory summarizes the medium-term market state as one current situation with a small set of key drivers. It is intended to answer: what kind of market are we in, why, and what should be watched next?

### Company Analysis

Generate company analysis reports from official data and local research material. For US companies, Folio OS prioritizes SEC ticker/CIK lookup, companyfacts, and 10-K/10-Q style evidence where available.

### Deep Research

Start with an investment question, inspect the proposed research plan and live evidence preview, then approve execution. Smart Collections are reusable local filters stored in `data/smart-collections.json`; they are metadata, not evidence. Their nested workspace shows deterministic health/reason badges, bounded snapshot changes, and current resolved evidence. Opening or refreshing it never starts an Agent automatically. Saved reports live under `data/topic-reports/` and record the approved plan, resolved external evidence, execution provenance, data gaps, quality, and a separate Market State reference. User context and report-side notes remain hypotheses and never become citations or evidence counts.

Direct API and selected CLI execution use the same approved request. If an engine is unavailable, Folio OS may fall back to a rules-based report and records that fallback. A report with no usable external evidence requires explicit confirmation and is clearly labelled as evidence-limited. Existing Canonical Markdown changes only through an explicit revision proposal approval.

### Agent Work Log

Home and Deep Research share a bounded, metadata-only Work Log. It stores task type, status, timing, engine/fallback metadata, artifact counts, and proposal state—not prompts, chat transcripts, report Markdown, diffs, attachments, local paths, credentials, or raw provider output.

### Research Intelligence Boundaries

Briefing, Company Analysis, and Deep Research can show rule-calculated note/thesis freshness, contradictions, uncertainties, counter-evidence, and checkpoints without an API key or CLI. Home, Market Memory, Smart Collections, and Deep Research can also show a bounded Investment Context assembled from ticker links in local portfolio/watchlist data. These automatic views are read-only metadata and never alter Canonical reports.

Agent synthesis runs only after an explicit action such as `Review with latest evidence`, `Ask Agent what changed`, or `Explain risk with Agent`. Dashboard and Watchlist are visible in the 0.3.0 navigation, while portfolio context remains bounded and read-only outside its dedicated runtime. These views do not provide trading advice.

### Settings

Configure appearance and motion, AI Agent mode, LLM CLI/API settings, cached model choices, RSS/automation options, Obsidian, and Notion.

---

## Exports

### Obsidian

You can export generated reports to a local Obsidian Vault. Obsidian is optional; Folio OS does not require it for normal use.

### Notion

You can export generated reports to a Notion database after configuring `NOTION_TOKEN` and `NOTION_DB_ID` in settings. The token is stored in the operating system credential store.

---

## Privacy

Folio OS is local-first:

- Source files live under `research-inbox/`.
- Generated reports, notes, databases, and caches live under `data/`.
- API keys and tokens live in the operating system credential store; `.env` retains non-secret settings.
- Cloud storage is not required.


### Local network safety

Do not expose Folio OS directly to the public internet. Keep the default host as `127.0.0.1` unless you fully understand LAN security implications. If you set `FOLIO_HOST=0.0.0.0`, devices on the same network may be able to access local reports, settings, notes, portfolio data, automation endpoints, and Agent/CLI controls.

When Notion export with chart images is configured with `IMGBB_API_KEY`, chart images may be uploaded to a third-party image host.

When AI/LLM features are enabled, selected report context or summarized evidence may be sent to the configured provider or CLI tool. Disable AI features if you want rule-based local fallback only.

Legacy `.env` secrets are removed only after a successful credential-store migration. Never share `.env` or paste real API keys into documentation, issues, or chat logs.

---

## For Developers And AI Agents

Before modifying the project, read [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md), and the relevant feature README files under `features/`.

---

## License

Folio OS is released under the [BSD 3-Clause License](LICENSE).

---

## Troubleshooting

If the browser does not open, visit:

```text
http://localhost:8787
```

If dependencies are missing:

```powershell
py -3 -m pip install -r requirements.txt
```

or:

```bash
python3 -m pip install -r requirements.txt
```

If AI features do not work, check that:

- AI Agent is enabled in Settings.
- The selected LLM CLI is installed and authenticated, or API keys are configured.
- Model choices have been refreshed if you recently changed provider settings.

Folio OS should still run with local/rule-based fallback behavior when LLM features are unavailable.
