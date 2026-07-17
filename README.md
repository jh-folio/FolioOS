# Folio OS

**A local-first investment research workspace for individual investors**

[한국어 README](README.ko.md)

Folio OS helps you collect market news and research material on your own PC, then turn it into daily briefings, market context, and company analysis with optional AI assistance.

Your files and generated reports stay local by default. LLM/API integrations are optional and only used when you configure them.

---

## What You Can Do In 0.1

- Chat with the Folio OS AI Agent from the Home screen.
- Collect and search public RSS/news feeds.
- Generate US/KR daily market briefings.
- Read a simplified medium-term Market Memory view.
- Generate company analysis reports from local evidence and official data where available.
- Write report-side Folio Notes.
- Export generated reports to Obsidian or Notion.
- Configure LLM CLI/API, model choices, RSS, automation, and export settings.

Deferred from the 0.1 user surface:

- Deep Research as a full Agent workspace.
- Dashboard widgets and watchlist workflows.
- Advanced portfolio workflows.
- Advanced personal note analysis workflows.
- Dark mode and installer/tray-app polish.

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

Home is the main AI Agent entry point. Use it to ask Folio OS to summarize the current workspace, start common tasks, or reason over the current research context.

### Briefing

Create and read daily market briefings. Briefings use news/RSS-style inputs and stored market snapshots where available. If AI is configured, Folio OS can use it for richer writing; otherwise it falls back to rule-based generation.

### RSS Feed

Collect, filter, search, and merge public RSS/news items. Folio OS does not bypass paid article access. It uses public RSS/link metadata and material you save locally.

Freely accessible article bodies can also be stored for your local archive. Toggle this with the "save article full text" option under Settings > Automation > RSS collection (on by default); stored bodies improve briefing and search quality.

### Market Memory

Market Memory summarizes the medium-term market state as one current situation with a small set of key drivers. It is intended to answer: what kind of market are we in, why, and what should be watched next?

### Company Analysis

Generate company analysis reports from official data and local research material. For US companies, Folio OS prioritizes SEC ticker/CIK lookup, companyfacts, and 10-K/10-Q style evidence where available.

### Settings

Configure AI Agent mode, LLM CLI/API settings, cached model choices, RSS/automation options, Obsidian, and Notion.

---

## Exports

### Obsidian

You can export generated reports to a local Obsidian Vault. Obsidian is optional; Folio OS does not require it for normal use.

### Notion

You can export generated reports to a Notion database after configuring `NOTION_TOKEN` and `NOTION_DB_ID` in settings or `.env`.

---

## Privacy

Folio OS is local-first:

- Source files live under `research-inbox/`.
- Generated reports, notes, databases, and caches live under `data/`.
- API keys live in `.env`.
- Cloud storage is not required.


### Local network safety

Do not expose Folio OS directly to the public internet. Keep the default host as `127.0.0.1` unless you fully understand LAN security implications. If you set `FOLIO_HOST=0.0.0.0`, devices on the same network may be able to access local reports, settings, notes, portfolio data, automation endpoints, and Agent/CLI controls.

When Notion export with chart images is configured with `IMGBB_API_KEY`, chart images may be uploaded to a third-party image host.

When AI/LLM features are enabled, selected report context or summarized evidence may be sent to the configured provider or CLI tool. Disable AI features if you want rule-based local fallback only.

Never share `.env` or paste real API keys into documentation, issues, or chat logs.

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
