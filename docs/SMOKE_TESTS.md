# Folio OS 0.2 Smoke Tests

Run these checks against a clean local workspace or a synthetic packaged fixture. Do not use real credentials, private notes, portfolio data, or provider transcripts as evidence.

## Startup and identity

1. Start Folio OS with `start.ps1`, `start.sh`, or `start-archive.cmd`.
2. Open `http://127.0.0.1:8787/api/health` and confirm `status=ok`, `version=0.2.0`, the expected commit, PID, and workspace identity.
3. Confirm Home, Briefing, RSS Feed, Market Memory, Company Analysis, Deep Research, and Settings are visible; Dashboard and Watchlist are absent from the default navigation.

## Deep Research exposure

At desktop, tablet, and mobile widths:

1. Select the left-nav `딥 리서치` item (`[data-qa=nav-deep-research]`) and confirm `#/deep-research`.
2. Return Home and select `[data-qa=home-deep-research]`; confirm the same route receives focus without horizontal overflow.
3. Open the command palette with Ctrl/Command+K, search for Deep Research, select `[data-qa=command-deep-research]`, and confirm the same route.
4. Check the browser console and failed network requests; both must be empty for the navigation flow.

## Question-first execution

1. Enter an investment question and optional hypothesis context.
2. Review the approved plan and evidence preview before generation.
3. If a Smart Collection is selected, confirm only its ID/revision is sent from the browser and the saved definition is resolved again by the server.
4. Execute once through Direct mode and once through a deterministic CLI fixture; both must use the same approved definition and resolved evidence.
5. If no usable external evidence exists, confirm generation is blocked until the evidence-limited fallback is explicitly approved.
6. Reopen the saved report and verify the approved plan, external evidence ledger, data gaps, quality, execution provenance, Market State, hypothesis context, and Personal Overlay are visibly separate.

## Agent lifecycle and privacy

1. Start an Agent task, poll the exact job ID, cancel it, and confirm the terminal state is `cancelled` with no report writeback.
2. Approve one revision proposal and confirm the Canonical revision increments exactly once; replay must not apply twice.
3. Reject another proposal and confirm the report hash is unchanged.
4. Inspect `/api/agent/work-log`: entries may contain only bounded task/status/timing/engine/artifact/proposal metadata. Prompts, replies, Markdown, diffs, attachments, paths, credentials, and raw provider output must be absent.
5. Restart the server and confirm the same saved report, proposal state, Smart Collection revision, and Work Log metadata reopen safely.

## Release checks

```powershell
py -3 -m pytest tests/test_version_contract.py web/tests/test_navigation_contract.py -q
npm --prefix web test
npm --prefix web run typecheck
npm --prefix web run build
git diff --exit-code -- public/react/folio-react.js
```

Before publishing, also run the package, extraction, Gitleaks `--redact=100`, privacy-canary, and full packaged Browser gates in `docs/PUBLIC_RELEASE_CHECKLIST.md`.
