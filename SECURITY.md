# Security Policy

## Reporting a Vulnerability

Please report security issues privately to the maintainer.

Do not open a public GitHub issue for vulnerabilities, exposed credentials, personal data leakage, or local file exposure.

## Supported Versions

Folio OS is currently in early public release.

| Version | Supported |
|---|---|
| 0.1.x | Yes |

## Local-First Security Model

Folio OS is designed as a local-first investment research workspace.

Do not expose Folio OS directly to the public internet.

By default, Folio OS should run on:

```text
127.0.0.1
```

Only use LAN binding such as:

```text
FOLIO_HOST=0.0.0.0
```

when you fully understand the security implications. Devices on the same network may be able to access local reports, settings, notes, portfolio data, automation endpoints, and Agent/CLI controls.

## Sensitive Data

Never commit or share:

- `.env`
- `data/`
- `research-inbox/`
- local logs
- generated reports containing personal notes or portfolio data
- API keys
- provider tokens
- Notion tokens
- local CLI authentication files

## Third-Party Services

Folio OS can optionally integrate with LLM providers, Notion, market data providers, and image hosting services.

When AI/LLM features are enabled, selected report context or summarized evidence may be sent to the configured provider.

When Notion export with chart images is configured with `IMGBB_API_KEY`, chart images may be uploaded to a third-party image host.

## Credential Exposure

If a credential is accidentally committed or shared:

1. Revoke or rotate the credential immediately.
2. Remove the credential from local files.
3. Check Git history and release artifacts.
4. Run secret scanning before publishing again.
