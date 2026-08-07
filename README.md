# Folio OS

**A local-first investment research workspace for individual investors**

[한국어 README](README.ko.md)

Folio OS 0.5.0 helps you collect market news and research material on your own PC, then turn it into daily briefings, market context, company analysis, and auditable Deep Research with optional AI assistance. It covers four markets: the US, Korea, Europe, and Japan.

Your files and generated reports stay local by default. LLM/API integrations are optional and only used when you configure them.

---

## What You Can Do In 0.5.0

- Chat with the Folio OS AI Agent from the Home screen. Conversations are saved on your computer, so you can close the app, come back, and pick up where you left off — the Agent reads the earlier context.
- Follow four markets: the US, Korea, Europe, and Japan. Briefings, market state, the RSS feed, the calendar, and the charts all use the same four.
- Use the Research Cockpit Dashboard to see what actually changed in your latest reports, the market calendar, and native symbol/index charts, in that order. The chart symbol list is yours to edit and is separate from the Watchlist; it starts from the largest companies in each market.
- Read a story-share bar built from the day's collected news, with each story's share and the move against the previous trading day. Share moves reflect coverage volume, not a change in what the story says.
- Open a change card to see what moved: the verdict (new information, reversal, developing trend, coverage shift), a short reason, and the before/after side by side.
- Maintain a local company, sector, and theme Watchlist with a per-symbol chart and the news collected for it.
- Collect and search public RSS/news feeds from all four markets, in their own languages, and narrow by market, country, or language. The source filter lists only outlets still being collected, and corporate press-release wires stay out of the feed screen while remaining available to watchlist and company analysis.
- Generate daily market briefings for any set of the four markets at once, each stored as its own report. The date you pick is the market session the briefing covers, not the day it is filed; a Korean briefing for a past date is labelled closed rather than intraday. Daily automation can choose its briefing type.
- Read a simplified medium-term Market Memory view, with a separate reading per market when the evidence supports one.
- Generate company analysis reports from local evidence and official data where available. Type a ticker, a company name, or a Korean or Japanese spelling — the screen shows which company it read before generating, offers a choice when several fit, and says so plainly when it recognises none.
- See released figures on the market calendar, not just the schedule.
- Ask an investment question and approve the research plan before anything runs, then reopen the report with its sources, gaps, Smart Collection scope, and your own thinking kept as separate layers.
- Review rule-based change summaries produced together with each new Briefing, Company Analysis, Topic Report, and Market Memory update — without an extra Agent call.
- Manage your Portfolio holdings — type each position in, with company names resolved to tickers as you go, and a save made elsewhere is flagged before it gets overwritten.
- Carry on a conversation about a watchlist entry, a holding, or a report from the Agent dock, and come back to it later — the list of conversations lives there too. Conversation text is kept on your computer, separate from report sources, and only becomes an investment note when you explicitly choose “노트로 정리” (save as note).
- Keep your own notes beside a report and check how old they are, what argues against them, and what you said you would follow up on — no AI required.
- See the tickers you track quietly linked into related research screens, without exposing quantities, prices, weights, or note bodies.
- Read a work log that shows what the AI did without storing what it wrote, and approve or reject any change it proposes to a saved report.
- Write report-side Folio Notes.
- Export generated reports to Obsidian or Notion.
- Choose Light, Dark, or System appearance across the workspace.
- Configure LLM CLI/API, model choices, RSS, automation, appearance, and export settings.

Not included in the 0.5.0 user surface:

- Company analysis for companies listed only in Europe or Japan. 0.5.0 reads official filings through the SEC, so a European or Japanese company also registered there — ASML, Shell, SAP, Toyota, Sony and others — can be analysed by its US ticker. One listed only at home cannot yet, and the screen says so rather than producing a thin report. Home-market filings come in later releases.
- Installer/tray-app polish.

Fast-origin news is an early lead, not verified evidence. It is promoted from RSS items Folio OS already collected — no extra network call, credential, or provider setting. Folio OS does not scrape pages or bypass paywalls. External Vision import is off by default and requires consent for every cropped image request. Images, raw OCR text, and OCR bounding boxes are not retained by the import workflow.

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

Dashboard opens with "What changed". At its head is today's story share: a single bar showing how the day's collected news splits across stories, with each story's article count, share, and the move against the previous trading day. A share move means the coverage volume moved, not that the story itself changed — the screen says so.

Below the bar are the changes confirmed when your latest reports were generated. Each card carries a verdict — new information, reversal, developing trend, or coverage shift — a one-line reason, and an expandable before/after comparison with the articles behind it. You can open the report, open the baseline it was compared against, or ask the Agent about it.

Below that sits the market calendar — economic releases, central bank meetings, market holidays, earnings, filings, and dividends across the four markets, marked confirmed or estimated by where the date came from, and carrying the figure once a release has been published. Then the charts, drawn from Folio OS's own data rather than an embedded widget. The chart symbol list is yours: add, remove, and reorder it independently of the Watchlist. It starts from the largest companies in each market — twenty for the US, ten each for Korea, Europe, and Japan.

### Watchlist

Track companies, sectors, and themes in a local Watchlist, then inspect the related news cards and market response. Type a company by name and it is stored under that company's full name, so the same company does not end up as two entries; a subject that is not a company stays exactly as you typed it. Watchlist data stays in the local workspace.

### Briefing

Create and read daily market briefings for the US, Korea, Europe, and Japan. Pick one market or several; each becomes its own report, and you can regenerate, export, or delete one without touching the others. Briefings use news/RSS-style inputs and stored market snapshots where available. If AI is configured, Folio OS can use it for richer writing; otherwise the briefing is written with built-in rules.

Each market is read on its own session clock. A briefing filed on a Korean morning covers the US session that closed overnight and the Korean session of that same day, and it says which is which.

### RSS Feed

Collect, filter, search, and merge public RSS/news items across the four markets. European and Japanese items are kept in their original language and shown with market, country, and language labels, so you can read the German or Japanese coverage as published or narrow to one country. Folio OS does not bypass paid article access. It uses public RSS/link metadata and material you save locally.

Freely accessible article bodies can also be stored for your local archive. Toggle this with the "save article full text" option under Settings > Automation > RSS collection (on by default); stored bodies improve briefing and search quality.

### Market Memory

Market Memory summarizes the medium-term market state as one current situation with a small set of key drivers. It is intended to answer: what kind of market are we in, why, and what should be watched next?

When the evidence supports a separate reading for a single market, tabs appear for the overall view and for each market that has one.

### Company Analysis

Generate company analysis reports from official data and local research material. Folio OS prioritizes SEC ticker/CIK lookup, companyfacts, and 10-K/20-F filing text where available.

Write the target however you think of it — a ticker, a company name, a Korean or Japanese spelling. The screen tells you which company it read before it generates anything, offers a short list when more than one company fits, and says it recognises none rather than guessing.

**What 0.5.0 can analyse.** Official filings are read through the SEC. A European or Japanese company that also registers there — ASML, Shell, SAP, TotalEnergies, Toyota, Sony and others — can be analysed by its US ticker. A company listed only on its home exchange cannot yet: the screen names the market it is listed on and suggests a US ticker if one exists, instead of generating a report with almost nothing behind it. Korean companies use DART.

### Deep Research

Ask an investment question and Folio OS shows you the research plan and the material it can actually use before anything runs. You approve, then it generates.

The plan itself is written by AI by default — it takes around 40 seconds to shape axes and search phrases that fit your question, and you can pick the instant rule-based plan when you are in a hurry. If the plan misses the point, describe the change in plain words ("drop the valuation axis and go deeper on supply") and only that part is rewritten; there is also a button to start the plan over.

You can add your own context — holdings you care about, a period to check — under the optional analysis conditions. That text is carried as **your own thinking and is never counted as a source**. You can also narrow the search with a saved collection of material; those are search rules stored in `data/smart-collections.json`, not evidence themselves. The detail view shows how many items currently match and what changed since last time. Opening or refreshing it never starts the AI on its own.

Reports are saved under `data/topic-reports/` with the plan you approved, the sources used, the gaps that remain, a quality assessment, and the market state at the time. Inside a report, external sources and your own thinking are always shown as separate layers.

If the AI is unavailable, Folio OS writes a rules-based report and says so. When no external material is available at all, it generates only after you confirm, and the report states that its evidence is thin. An already-saved report changes **only when you approve a revision proposal**.

### Agent Work Log

A line per task showing what the AI did and how it ended: the kind of work, its current state, and what was saved.

**The content of the work is never stored.** Not the question you typed, the conversation, the report body, the diff, attachments, local paths, API keys, or the AI tool's raw output.

### Research Intelligence Boundaries

Briefing, Company Analysis, and Deep Research show what plain rules can determine without any AI configured: how old your notes are, where recent material contradicts them, and which follow-ups have come due.

If you track tickers, related research screens quietly link to them. Quantities, prices, weights, and note bodies are never shown there.

**These automatic views are read-only and never change a report.** The AI interprets something only when you ask it to — `Review with latest evidence`, `Ask Agent what changed`, `Explain risk with Agent`.

None of these screens tell you what to buy or sell.

### Settings

Configure appearance and motion, interest markets, AI Agent mode, LLM CLI/API settings, cached model choices, RSS/automation options, Obsidian, and Notion.

**Interest markets** picks which of the four markets (US, Korea, Europe, Japan) Folio OS collects and shows — the default is US and Korea. A market you turn off stops being collected and disappears from the RSS list, briefing generation choices, the market calendar, and the market narrative. Global material such as oil and dollar news always stays visible. Turning a market back on starts collecting it immediately, but articles from the time it was off only come back as far as the feeds still publish them.

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

When AI/LLM features are enabled, selected report context or summarized evidence may be sent to the configured provider or CLI tool. Disable AI features if you want rule-based local behavior only.

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

Folio OS should still run with local rule-based behavior when LLM features are unavailable.
