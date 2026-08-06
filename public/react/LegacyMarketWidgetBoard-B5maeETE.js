import { c as e, d as t, g as n, h as r, t as i } from "./themePreference-yEs7yaHz.js";
//#region src/app/dashboard/LegacyMarketWidgetBoard.tsx
var a = n(), o = r();
function s() {
	let { resolved: n } = i(), r = (0, a.useRef)(null), [s, c] = (0, a.useState)(null), [l, u] = (0, a.useState)(""), [d, f] = (0, a.useState)(""), [p, m] = (0, a.useState)(null), h = (0, a.useCallback)(async () => {
		try {
			let t = await e("/api/market-widgets/settings");
			c(t), u("");
		} catch (e) {
			u(e instanceof Error ? e.message : "시장 위젯 설정을 불러오지 못했습니다.");
		}
	}, []);
	(0, a.useEffect)(() => {
		let t = !0;
		return e("/api/market-widgets/settings").then((e) => {
			t && (c(e), u(""));
		}).catch((e) => {
			t && u(e instanceof Error ? e.message : "시장 위젯 설정을 불러오지 못했습니다.");
		}), () => {
			t = !1;
		};
	}, []), (0, a.useEffect)(() => {
		let e = (e) => {
			let t = e.detail;
			t ? (c(t), u("")) : h();
		};
		return document.addEventListener("folio:market-widgets-updated", e), () => document.removeEventListener("folio:market-widgets-updated", e);
	}, [h]), (0, a.useEffect)(() => {
		let e = r.current;
		if (e) {
			if (window.FolioTradingViewWidgets?.cleanup?.(e), !s) {
				e.innerHTML = "<div class=\"tradingview-widget-unavailable\">시장 위젯 설정을 불러오는 중입니다.</div>";
				return;
			}
			return window.FolioTradingViewWidgets?.renderDashboardBoard ? window.FolioTradingViewWidgets.renderDashboardBoard(e, s, { fallbackHtml: "<div class=\"tradingview-widget-unavailable\">시장 위젯을 표시할 수 없습니다.</div>" }) : e.innerHTML = "<div class=\"tradingview-widget-unavailable\">시장 위젯 렌더러를 찾을 수 없습니다.</div>", () => {
				window.FolioTradingViewWidgets?.cleanup?.(e);
			};
		}
	}, [n, s]);
	async function g(e) {
		let n = await t("/api/market-widgets/settings", e);
		return c(n), document.dispatchEvent(new CustomEvent("folio:market-widgets-updated", { detail: n })), n;
	}
	function _() {
		return s?.dashboard?.widgets ? [...s.dashboard.widgets] : [];
	}
	function v(e) {
		return {
			...s,
			dashboard: {
				...s?.dashboard || {},
				widgets: e
			},
			presetOverrides: s?.presetOverrides || {}
		};
	}
	async function y(e, t) {
		let n = _(), r = n.findIndex((t) => t.id === e);
		if (r < 0) return;
		let i = Math.max(0, Math.min(n.length - 1, t));
		if (r === i) return;
		let [a] = n.splice(r, 1);
		n.splice(i, 0, a);
		try {
			await g(v(n)), u("");
		} catch (e) {
			u(e instanceof Error ? e.message : "시장 위젯 위치 저장에 실패했습니다.");
		}
	}
	async function b(e, t, n) {
		let r = _(), i = r.findIndex((t) => t.id === e);
		if (i < 0) return;
		let a = Math.max(240, Math.min(1100, Math.round(t))), o = Math.max(3, Math.min(12, Math.round(n))), s = Math.round(Number(r[i].height || 0)), c = Math.round(Number(r[i].columns || 0));
		if (s !== a || c !== o) {
			r[i] = {
				...r[i],
				height: a,
				columns: o
			};
			try {
				await g(v(r)), u("");
			} catch (e) {
				u(e instanceof Error ? e.message : "시장 위젯 크기 저장에 실패했습니다.");
			}
		}
	}
	async function x(e) {
		f(e);
		try {
			let t = _(), n = `${e}-${Date.now().toString(36)}`, r = e === "overview" ? {
				id: n,
				type: "market_overview",
				title: "Global Markets",
				size: "wide",
				columns: 8,
				preset: "global_core",
				theme: "auto"
			} : {
				id: n,
				type: "advanced_chart",
				title: "S&P 500",
				size: "wide",
				columns: 4,
				symbol: "FOREXCOM:SPXUSD",
				interval: "D",
				chartType: "candlesticks",
				theme: "auto"
			};
			await g(v([...t, r])), u("");
		} catch (e) {
			u(e instanceof Error ? e.message : "시장 위젯 추가에 실패했습니다.");
		} finally {
			f("");
		}
	}
	async function S() {
		f("reset");
		try {
			await g({ dashboard: { widgets: [] } }), u("");
		} catch (e) {
			u(e instanceof Error ? e.message : "시장 위젯 기본값 복원에 실패했습니다.");
		} finally {
			f("");
		}
	}
	async function C(e) {
		m(null);
		let t = _(), n = t.findIndex((t) => t.id === e);
		if (n < 0) return;
		let r = t[n], i = window.prompt("위젯 제목", r.title || "");
		if (i === null) return;
		let a = r.symbol || "";
		if ([
			"advanced_chart",
			"symbol_overview",
			"ticker_tag",
			"single_ticker",
			"stock_heatmap"
		].includes(String(r.type || ""))) {
			let e = window.prompt("TradingView 심볼", a || "FOREXCOM:SPXUSD");
			if (e === null) return;
			a = e.trim().toUpperCase();
		}
		t[n] = {
			...r,
			title: String(i || r.title || "").trim(),
			symbol: a
		}, f("editor");
		try {
			await g(v(t)), u("");
		} catch (e) {
			u(e instanceof Error ? e.message : "시장 위젯 수정에 실패했습니다.");
		} finally {
			f("");
		}
	}
	async function w(e) {
		m(null);
		let t = _(), n = t.find((t) => t.id === e);
		if (!n) return;
		let r = n.title || n.symbol || n.type || "위젯";
		if (window.confirm(`${r} 위젯을 삭제할까요?`)) {
			f("delete");
			try {
				await g(v(t.filter((t) => t.id !== e))), u("");
			} catch (e) {
				u(e instanceof Error ? e.message : "시장 위젯 삭제에 실패했습니다.");
			} finally {
				f("");
			}
		}
	}
	return (0, a.useEffect)(() => {
		let e = r.current;
		if (!e) return;
		let t = (e) => {
			let t = e.target?.closest("[data-tv-widget-menu]");
			if (!t) return;
			e.preventDefault(), e.stopPropagation();
			let n = t.closest(".tv-widget-card")?.dataset.widgetId || "";
			if (!n) return;
			let r = t.getBoundingClientRect();
			m({
				widgetId: n,
				x: r.right,
				y: r.bottom + 6
			});
		};
		return e.addEventListener("click", t), () => e.removeEventListener("click", t);
	}, [s]), (0, a.useEffect)(() => {
		let e = r.current;
		if (!e || !s) return;
		let t = null, n = null, i = () => Array.from(e.querySelectorAll(".tv-widget-card[data-widget-id]")), a = (t) => {
			let n = e.getBoundingClientRect(), r = window.getComputedStyle(e), i = Number.parseFloat(r.columnGap || r.gap || "0") || 0, a = (n.width - i * 11) / 12;
			return !Number.isFinite(a) || a <= 0 ? 12 : Math.max(3, Math.min(12, Math.round((t + i) / (a + i))));
		}, o = (e, t) => {
			let n = i().map((e, t) => ({
				index: t,
				rect: e.getBoundingClientRect()
			})).filter(({ rect: e }) => e.width > 0 && e.height > 0).sort((e, t) => e.rect.top - t.rect.top || e.rect.left - t.rect.left);
			if (!n.length) return 0;
			let r = n[0], a = Infinity;
			for (let i of n) {
				let n = i.rect.left + i.rect.width / 2, o = i.rect.top + i.rect.height / 2, s = Math.hypot(e - n, t - o);
				s < a && (r = i, a = s);
			}
			return t < r.rect.top + r.rect.height / 2 || t <= r.rect.bottom && e < r.rect.left + r.rect.width / 2 ? r.index : Math.min(r.index + 1, n.length - 1);
		}, c = (e) => {
			let r = e.target, i = r?.closest("[data-tv-widget-resize]"), o = r?.closest("[data-tv-widget-drag-handle]"), s = r?.closest(".tv-widget-card[data-widget-id]"), c = s?.dataset.widgetId || "";
			if (!(!s || !c)) {
				if (i) {
					e.preventDefault();
					let n = s.getBoundingClientRect();
					t = {
						widgetId: c,
						startX: e.clientX,
						startY: e.clientY,
						startWidth: n.width,
						startHeight: n.height,
						startColumns: Math.max(3, Math.min(12, Number(s.dataset.widgetColumns || a(n.width)) || 6)),
						card: s
					}, s.classList.add("tv-widget-resizing");
					return;
				}
				o && !r?.closest("[data-tv-widget-menu]") && (e.preventDefault(), n = {
					widgetId: c,
					card: s
				}, s.classList.add("tv-widget-dragging"));
			}
		}, l = (e) => {
			if (!t) return;
			let n = Math.max(240, Math.min(1100, t.startHeight + e.clientY - t.startY)), r = a(t.startWidth + e.clientX - t.startX);
			t.card.style.height = `${n}px`, t.card.style.minHeight = `${n}px`, t.card.style.gridColumn = `span ${r}`, t.card.dataset.widgetColumns = String(r);
		}, u = (e) => {
			if (t) {
				let { widgetId: e, card: n, startColumns: r } = t;
				n.classList.remove("tv-widget-resizing");
				let i = n.getBoundingClientRect().height, a = Number(n.dataset.widgetColumns || r) || r;
				t = null, b(e, i, a);
			}
			if (n) {
				let { widgetId: t, card: r } = n;
				r.classList.remove("tv-widget-dragging"), n = null, y(t, o(e.clientX, e.clientY));
			}
		};
		return e.addEventListener("pointerdown", c), window.addEventListener("pointermove", l), window.addEventListener("pointerup", u), () => {
			e.removeEventListener("pointerdown", c), window.removeEventListener("pointermove", l), window.removeEventListener("pointerup", u);
		};
	}, [s]), /* @__PURE__ */ (0, o.jsxs)("article", {
		className: "market-widget-panel react-dashboard-market-widget",
		"data-current-market": !0,
		children: [
			/* @__PURE__ */ (0, o.jsxs)("div", {
				className: "market-widget-head",
				children: [/* @__PURE__ */ (0, o.jsxs)("div", { children: [/* @__PURE__ */ (0, o.jsx)("p", {
					className: "section-kicker",
					children: "Current Market"
				}), /* @__PURE__ */ (0, o.jsx)("h2", {
					id: "marketWidgetTitle",
					children: "Current Market"
				})] }), /* @__PURE__ */ (0, o.jsxs)("div", {
					className: "market-widget-actions",
					children: [
						/* @__PURE__ */ (0, o.jsx)("button", {
							id: "editGlobalMarketsBtn",
							className: "btn",
							type: "button",
							disabled: d === "overview",
							onClick: (e) => {
								e.stopPropagation(), x("overview");
							},
							children: d === "overview" ? "추가 중" : "위젯 추가"
						}),
						/* @__PURE__ */ (0, o.jsx)("button", {
							id: "addMarketChartBtn",
							className: "btn",
							type: "button",
							disabled: d === "chart",
							onClick: (e) => {
								e.stopPropagation(), x("chart");
							},
							children: d === "chart" ? "추가 중" : "빠른 차트 추가"
						}),
						/* @__PURE__ */ (0, o.jsx)("button", {
							id: "resetMarketWidgetsBtn",
							className: "btn",
							type: "button",
							disabled: d === "reset",
							onClick: (e) => {
								e.stopPropagation(), S();
							},
							children: d === "reset" ? "복원 중" : "기본값"
						})
					]
				})]
			}),
			l && /* @__PURE__ */ (0, o.jsx)("p", {
				className: "react-dashboard-error",
				children: l
			}),
			p && /* @__PURE__ */ (0, o.jsxs)("div", {
				className: "market-widget-context-menu is-open",
				style: {
					left: p.x,
					top: p.y
				},
				role: "menu",
				children: [/* @__PURE__ */ (0, o.jsx)("button", {
					type: "button",
					role: "menuitem",
					onClick: () => void C(p.widgetId),
					children: "수정"
				}), /* @__PURE__ */ (0, o.jsx)("button", {
					type: "button",
					role: "menuitem",
					"data-market-widget-action": "delete",
					onClick: () => void w(p.widgetId),
					children: "삭제"
				})]
			}),
			/* @__PURE__ */ (0, o.jsx)("div", {
				id: "marketWidgetBoard",
				ref: r,
				className: "market-widget-board",
				"data-fallback": "<div class=\"tradingview-widget-unavailable\">시장 위젯을 표시할 수 없습니다.</div>"
			})
		]
	});
}
//#endregion
export { s as default };
