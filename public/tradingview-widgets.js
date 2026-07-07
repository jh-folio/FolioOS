(function () {
  "use strict";

  const ALLOWED_WIDGET_TYPES = new Set([
    "market_overview",
    "advanced_chart",
    "symbol_overview",
    "ticker_tape",
    "ticker_tag",
    "ticker",
    "single_ticker",
    "forex_cross_rates",
    "stock_heatmap",
    "economic_calendar",
    "symbol_info",
    "company_profile",
    "fundamental_data",
  ]);

  const SIZE_CLASSES = {
    wide: "tv-widget-size-wide",
    medium: "tv-widget-size-medium",
    compact: "tv-widget-size-compact",
  };

  const SCRIPT_BY_TYPE = {
    market_overview: "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js",
    advanced_chart: "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
    symbol_overview: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js",
    ticker_tape: "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js",
    ticker_tag: "https://s3.tradingview.com/external-embedding/embed-widget-ticker.js",
    ticker: "https://s3.tradingview.com/external-embedding/embed-widget-tickers.js",
    single_ticker: "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js",
    forex_cross_rates: "https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js",
    stock_heatmap: "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js",
    economic_calendar: "https://s3.tradingview.com/external-embedding/embed-widget-events.js",
    symbol_info: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
    company_profile: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js",
    fundamental_data: "https://s3.tradingview.com/external-embedding/embed-widget-financials.js",
  };

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;",
    }[char]));
  }

  function themeValue(theme) {
    if (theme === "dark" || theme === "light") return theme;
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  }

  function unavailable(container, message = "TradingView 위젯을 불러오지 못했습니다.") {
    container.innerHTML = `<div class="tradingview-widget-unavailable">${escapeHtml(message)}</div>`;
  }

  function widgetShell(widget, options = {}) {
    const size = SIZE_CLASSES[widget.size] || SIZE_CLASSES.wide;
    const shell = document.createElement("article");
    shell.className = `tv-widget-card ${size}`;
    shell.dataset.widgetId = widget.id || "";
    shell.dataset.widgetType = widget.type || "";
    if (Number.isFinite(Number(widget.height))) {
      const minHeight = widget.size === "compact" ? 88 : 240;
      const height = Math.max(minHeight, Math.min(1100, Number(widget.height)));
      shell.style.height = `${height}px`;
      shell.style.minHeight = `${height}px`;
    }
    if (Number.isFinite(Number(widget.columns))) {
      const columns = Math.max(3, Math.min(12, Math.round(Number(widget.columns))));
      shell.style.gridColumn = `span ${columns}`;
      shell.dataset.widgetColumns = String(columns);
    }

    const title = document.createElement("div");
    title.className = "tv-widget-card-head";
    title.setAttribute("data-tv-widget-drag-handle", "true");
    title.innerHTML = `<strong>${escapeHtml(widget.title || widget.type || "Market Widget")}</strong><span>TradingView</span>`;
    if (options.interactive) {
      const menuButton = document.createElement("button");
      menuButton.className = "tv-widget-menu-btn";
      menuButton.type = "button";
      menuButton.setAttribute("data-tv-widget-menu", "true");
      menuButton.setAttribute("aria-label", "위젯 메뉴");
      menuButton.textContent = "⋯";
      title.append(menuButton);
    }

    const body = document.createElement("div");
    body.className = "tradingview-widget-container tv-widget-body";
    if (options.interactive) {
      shell.setAttribute("aria-grabbed", "false");
      const handle = document.createElement("div");
      handle.className = "tv-widget-resize-handle";
      handle.setAttribute("data-tv-widget-resize", "true");
      handle.setAttribute("role", "separator");
      handle.setAttribute("aria-label", "위젯 크기 조절");
      shell.append(title, body, handle);
    } else {
      shell.append(title, body);
    }
    return { shell, body };
  }

  function marketOverviewConfig(widget, presets) {
    const preset = presets?.[widget.preset || "global_core"] || presets?.global_core || {};
    return {
      colorTheme: themeValue(widget.theme),
      dateRange: "12M",
      showChart: true,
      locale: "kr",
      width: "100%",
      height: "100%",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      tabs: preset.tabs || [],
    };
  }

  function advancedChartConfig(widget) {
    const styleByType = {
      candlesticks: "1",
      bars: "0",
      line: "2",
      area: "3",
    };
    return {
      autosize: true,
      symbol: widget.symbol || "FOREXCOM:SPXUSD",
      interval: widget.interval || "D",
      timezone: "Etc/UTC",
      theme: themeValue(widget.theme),
      style: styleByType[widget.chartType] || "1",
      locale: "kr",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    };
  }

  function simpleSymbolConfig(widget) {
    return {
      symbol: widget.symbol || "NASDAQ:NVDA",
      width: "100%",
      height: "100%",
      locale: "kr",
      colorTheme: themeValue(widget.theme),
      isTransparent: true,
    };
  }

  function symbolOverviewConfig(widget) {
    const symbol = widget.symbol || "NASDAQ:NVDA";
    const interval = widget.interval || "D";
    return {
      symbols: [[widget.title || symbol, `${symbol}|${interval}`]],
      chartOnly: false,
      width: "100%",
      height: "100%",
      locale: "kr",
      colorTheme: themeValue(widget.theme),
      autosize: true,
      showVolume: false,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      fontSize: "10",
      noTimeScale: false,
      valuesTracking: "1",
      changeMode: "price-and-percent",
      chartType: widget.chartType === "candlesticks" ? "candlesticks" : "line",
      lineWidth: 2,
      dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
    };
  }

  function stockHeatmapConfig(widget) {
    return {
      exchanges: [],
      dataSource: widget.symbol || "SPX500",
      grouping: "sector",
      blockSize: "market_cap_basic",
      blockColor: "change",
      locale: "kr",
      symbolUrl: "",
      colorTheme: themeValue(widget.theme),
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      width: "100%",
      height: "100%",
    };
  }

  function economicCalendarConfig(widget) {
    return {
      colorTheme: themeValue(widget.theme),
      isTransparent: true,
      width: "100%",
      height: "100%",
      locale: "kr",
      importanceFilter: "-1,0,1",
      countryFilter: "us,kr",
    };
  }

  function tickerSymbols(widget) {
    const raw = widget.symbols || widget.symbol || "FOREXCOM:SPXUSD";
    return String(raw).split(",").map((symbol) => symbol.trim()).filter(Boolean).slice(0, 16).map((symbol) => ({
      proName: symbol,
      title: symbol.split(":").pop() || symbol,
    }));
  }

  function configFor(widget, presets) {
    if (widget.type === "market_overview") return marketOverviewConfig(widget, presets);
    if (widget.type === "advanced_chart") return advancedChartConfig(widget);
    if (widget.type === "symbol_overview") return symbolOverviewConfig(widget);
    if (widget.type === "stock_heatmap") return stockHeatmapConfig(widget);
    if (widget.type === "economic_calendar") return economicCalendarConfig(widget);
    if (widget.type === "ticker_tape" || widget.type === "ticker") {
      return {
        symbols: tickerSymbols(widget),
        showSymbolLogo: true,
        colorTheme: themeValue(widget.theme),
        isTransparent: true,
        displayMode: "adaptive",
        locale: "kr",
      };
    }
    if (widget.type === "ticker_tag" || widget.type === "single_ticker") return simpleSymbolConfig(widget);
    return simpleSymbolConfig(widget);
  }

  function embed(body, widget, presets) {
    if (!ALLOWED_WIDGET_TYPES.has(widget.type)) {
      unavailable(body, "허용되지 않은 위젯입니다.");
      return;
    }
    const scriptUrl = SCRIPT_BY_TYPE[widget.type];
    if (!scriptUrl) {
      unavailable(body);
      return;
    }

    body.innerHTML = "";
    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.textContent = JSON.stringify(configFor(widget, presets));
    script.onerror = () => unavailable(body);
    body.append(inner, script);
  }

  function cleanup(root = document) {
    root.querySelectorAll(".tv-widget-body").forEach((node) => {
      node.innerHTML = "";
    });
  }

  function renderDashboardBoard(target, settings, options = {}) {
    if (!target) return;
    const widgets = settings?.dashboard?.widgets || [];
    const presets = settings?.catalog?.presets || {};
    target.innerHTML = "";
    if (!widgets.length) {
      target.innerHTML = '<div class="tradingview-widget-unavailable">표시할 시장 위젯이 없습니다.</div>';
      return;
    }
    widgets.forEach((widget) => {
      const { shell, body } = widgetShell(widget, { interactive: true });
      target.append(shell);
      embed(body, widget, presets);
    });
    if (options.fallbackHtml) {
      const fallback = document.createElement("div");
      fallback.className = "tv-widget-fallback";
      fallback.hidden = true;
      fallback.innerHTML = options.fallbackHtml;
      target.append(fallback);
    }
  }

  function renderWatchlistDetail(target, detail) {
    if (!target) return;
    const symbol = detail?.company?.tradingViewSymbol || "";
    target.innerHTML = "";
    if (!symbol) {
      target.innerHTML = '<div class="tradingview-widget-unavailable">기업/티커로 확인된 항목만 차트를 표시합니다.</div>';
      return;
    }

    target.classList.add("watchlist-detail-stack");
    [
      { id: "watch-info", type: "symbol_info", title: "Symbol Info", symbol, size: "wide", columns: 12, height: 260, theme: "auto" },
      { id: "watch-chart", type: "advanced_chart", title: "Chart", symbol, size: "wide", columns: 12, height: 520, theme: "auto", chartType: "line" },
      { id: "watch-fundamental", type: "fundamental_data", title: "Fundamental Data", symbol, size: "wide", columns: 12, height: 420, theme: "auto" },
    ].forEach((widget) => {
      const { shell, body } = widgetShell(widget);
      target.append(shell);
      embed(body, widget, {});
    });
  }

  window.FolioTradingViewWidgets = {
    ALLOWED_WIDGET_TYPES,
    renderDashboardBoard,
    renderWatchlistDetail,
    cleanup,
  };
})();
