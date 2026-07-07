# Market Widgets

This feature stores the user's current-market dashboard widget settings.

It does not store TradingView widget output, quotes, chart data, briefing evidence, visual snapshots, or market-memory evidence. TradingView widgets are UI-only current-market surfaces.

Settings live in `data/market-widget-settings.json`. If the file is missing or invalid, the app returns a safe default dashboard with a Market Overview widget, a focused NVIDIA chart, and a full-row Economic Calendar widget.

## UI Contract

- Dashboard home renders the settings through `public/tradingview-widgets.js`.
- The old Market Tape remains only as a local fallback if the widget settings or external script cannot render.
- Watchlist detail modal reuses the same renderer for company chart and symbol info widgets.
- The widget editor guides symbols as `거래소/데이터소스 + 심볼`: an exchange/datasource dropdown (NASDAQ, KRX, FX_IDC 등) is combined with a free symbol input (`NVDA`) instead of typing the full `NASDAQ:NVDA` prefix. `splitTradingViewSymbol`/`joinTradingViewSymbol` convert between the two forms.

## API

```text
GET  /api/market-widgets/settings
POST /api/market-widgets/settings
```

The service validates widget type, size, symbol, theme, and widget count before saving.
