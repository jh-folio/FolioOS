# Folio OS Installation and Launch Guide

Folio OS is a local-first investment research workspace. The easiest 0.1 setup path assumes you already use an AI coding agent such as Codex, Claude Code, or another LLM assistant that can operate on your local machine.

Korean users can also read [README.ko.md](README.ko.md).

There are two supported setup paths:

1. **AI Agent-assisted setup**: recommended for most 0.1 users.
2. **Manual setup**: use when you prefer to run commands yourself or need to troubleshoot.

---

## Method 1. AI Agent-Assisted Setup

Give your AI Agent the repository link and the prompt below.

```text
Install and run Folio OS on my local PC.

Repository:
https://github.com/jh-folio/FolioOS

Please:
1. Clone the repository.
2. Install the Python dependencies from requirements.txt.
3. Copy .env.example to .env if .env does not already exist.
4. Do not delete or overwrite data/, research-inbox/, config/, or any existing user files.
5. If an API key or local path is needed, ask me before editing .env.
6. Start Folio OS using the provided Windows or shell startup script.
7. Open the local app URL in my browser.
8. If startup fails, show me the relevant error and log location.
```

Recommended follow-up prompt after the first launch:

```text
Check whether Folio OS started correctly.
If it did not, diagnose the startup error without deleting any personal data.
```

### What The Agent Should Preserve

The Agent must not delete, reset, or overwrite:

- `.env`
- `data/`
- `research-inbox/`
- user-edited files in `config/`

These locations can contain personal API keys, generated reports, RSS archives, notes, and local research material.

---

## Method 2. Manual Setup

### Requirements

- Python 3
- Git, if installing from the GitHub repository
- A modern browser

Optional but recommended:

- OpenAI, Claude, Gemini, or CLI-based LLM access for higher-quality generation
- `yfinance` and `polars` dependencies from `requirements.txt` for market data and dataframe operations

### Clone The Repository

```powershell
git clone https://github.com/jh-folio/FolioOS.git
cd FolioOS
```

If you downloaded a ZIP release instead, extract it and open a terminal in the extracted folder.

### Install Python Dependencies

Windows:

```powershell
py -3 -m pip install -r requirements.txt
```

macOS / Linux:

```bash
python3 -m pip install -r requirements.txt
```

### Create Local Settings

If `.env` does not exist, copy the template:

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS / Linux:

```bash
cp .env.example .env
```

Then edit `.env` only for the services you actually use. API keys are optional, but LLM features need either configured API keys or a supported local CLI bridge.

Do not commit or share `.env`.

---

## Launch Folio OS

### Windows

Current launch path:

```text
start-archive.cmd
```

You can double-click this file from File Explorer.

PowerShell alternative:

```powershell
.\start.ps1
```

### macOS / Linux

```bash
bash start.sh
```

Direct Python fallback:

```bash
python3 app.py
```

### Open The App

After the server starts, open:

```text
http://localhost:8787
```

Keep the server process running while using the app.

---

## 0.1 Launcher Notes

For 0.1, the current startup scripts are the supported launch path. They may show server logs in the terminal, which is normal and useful for troubleshooting.

A quieter Windows launcher or tray-style app is planned as later polish, not required for the first 0.1 release.

---

## Important Folders

Do not delete these unless you intentionally want to remove local data:

- `data/`: generated reports, caches, databases, notes, jobs
- `research-inbox/`: articles, RSS items, reports, filings, links
- `config/`: user-adjustable company/ticker/source settings
- `.env`: local API keys and settings

Development-only folders such as `web/`, `docs/`, and `roadmap/` are needed for source development, but are not required in a normal user runtime package if the built frontend under `public/` is current. Source/developer archives can still include them.

Maintainers can create a clean 0.1 user package with:

```powershell
py -3 scripts\package_release.py --version vX.Y.Z --force
```

---

## Troubleshooting

### The Browser Does Not Open

Open the local URL manually:

```text
http://localhost:8787
```

### Python Command Not Found

On Windows, try:

```powershell
py -3 --version
```

On macOS / Linux, try:

```bash
python3 --version
```

### Dependencies Are Missing

Run the dependency install command again:

```powershell
py -3 -m pip install -r requirements.txt
```

or:

```bash
python3 -m pip install -r requirements.txt
```

### AI Features Do Not Work

Check:

- `.env` has the API keys you intend to use, or
- the selected LLM CLI is installed and authenticated, and
- AI Agent settings are enabled inside Folio OS.

Folio OS should still run with rule-based fallback behavior even when LLM features are unavailable.
