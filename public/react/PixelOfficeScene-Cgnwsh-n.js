import { t as e } from "./rolldown-runtime-DtPi1Y-2.js";
//#region node_modules/react/cjs/react.production.min.js
var t = /* @__PURE__ */ e(((e) => {
	var t = Symbol.for("react.element"), n = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.provider"), s = Symbol.for("react.context"), c = Symbol.for("react.forward_ref"), l = Symbol.for("react.suspense"), u = Symbol.for("react.memo"), d = Symbol.for("react.lazy"), f = Symbol.iterator;
	function p(e) {
		return typeof e != "object" || !e ? null : (e = f && e[f] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var m = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, h = Object.assign, g = {};
	function _(e, t, n) {
		this.props = e, this.context = t, this.refs = g, this.updater = n || m;
	}
	_.prototype.isReactComponent = {}, _.prototype.setState = function(e, t) {
		if (typeof e != "object" && typeof e != "function" && e != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, e, t, "setState");
	}, _.prototype.forceUpdate = function(e) {
		this.updater.enqueueForceUpdate(this, e, "forceUpdate");
	};
	function v() {}
	v.prototype = _.prototype;
	function y(e, t, n) {
		this.props = e, this.context = t, this.refs = g, this.updater = n || m;
	}
	var b = y.prototype = new v();
	b.constructor = y, h(b, _.prototype), b.isPureReactComponent = !0;
	var x = Array.isArray, S = Object.prototype.hasOwnProperty, C = { current: null }, w = {
		key: !0,
		ref: !0,
		__self: !0,
		__source: !0
	};
	function T(e, n, r) {
		var i, a = {}, o = null, s = null;
		if (n != null) for (i in n.ref !== void 0 && (s = n.ref), n.key !== void 0 && (o = "" + n.key), n) S.call(n, i) && !w.hasOwnProperty(i) && (a[i] = n[i]);
		var c = arguments.length - 2;
		if (c === 1) a.children = r;
		else if (1 < c) {
			for (var l = Array(c), u = 0; u < c; u++) l[u] = arguments[u + 2];
			a.children = l;
		}
		if (e && e.defaultProps) for (i in c = e.defaultProps, c) a[i] === void 0 && (a[i] = c[i]);
		return {
			$$typeof: t,
			type: e,
			key: o,
			ref: s,
			props: a,
			_owner: C.current
		};
	}
	function E(e, n) {
		return {
			$$typeof: t,
			type: e.type,
			key: n,
			ref: e.ref,
			props: e.props,
			_owner: e._owner
		};
	}
	function D(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function O(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var k = /\/+/g;
	function A(e, t) {
		return typeof e == "object" && e && e.key != null ? O("" + e.key) : t.toString(36);
	}
	function j(e, r, i, a, o) {
		var s = typeof e;
		(s === "undefined" || s === "boolean") && (e = null);
		var c = !1;
		if (e === null) c = !0;
		else switch (s) {
			case "string":
			case "number":
				c = !0;
				break;
			case "object": switch (e.$$typeof) {
				case t:
				case n: c = !0;
			}
		}
		if (c) return c = e, o = o(c), e = a === "" ? "." + A(c, 0) : a, x(o) ? (i = "", e != null && (i = e.replace(k, "$&/") + "/"), j(o, r, i, "", function(e) {
			return e;
		})) : o != null && (D(o) && (o = E(o, i + (!o.key || c && c.key === o.key ? "" : ("" + o.key).replace(k, "$&/") + "/") + e)), r.push(o)), 1;
		if (c = 0, a = a === "" ? "." : a + ":", x(e)) for (var l = 0; l < e.length; l++) {
			s = e[l];
			var u = a + A(s, l);
			c += j(s, r, i, u, o);
		}
		else if (u = p(e), typeof u == "function") for (e = u.call(e), l = 0; !(s = e.next()).done;) s = s.value, u = a + A(s, l++), c += j(s, r, i, u, o);
		else if (s === "object") throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		return c;
	}
	function M(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return j(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function N(e) {
		if (e._status === -1) {
			var t = e._result;
			t = t(), t.then(function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 1, e._result = t);
			}, function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 2, e._result = t);
			}), e._status === -1 && (e._status = 0, e._result = t);
		}
		if (e._status === 1) return e._result.default;
		throw e._result;
	}
	var P = { current: null }, F = { transition: null }, I = {
		ReactCurrentDispatcher: P,
		ReactCurrentBatchConfig: F,
		ReactCurrentOwner: C
	};
	function L() {
		throw Error("act(...) is not supported in production builds of React.");
	}
	e.Children = {
		map: M,
		forEach: function(e, t, n) {
			M(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return M(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return M(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!D(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	}, e.Component = _, e.Fragment = r, e.Profiler = a, e.PureComponent = y, e.StrictMode = i, e.Suspense = l, e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = I, e.act = L, e.cloneElement = function(e, n, r) {
		if (e == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + e + ".");
		var i = h({}, e.props), a = e.key, o = e.ref, s = e._owner;
		if (n != null) {
			if (n.ref !== void 0 && (o = n.ref, s = C.current), n.key !== void 0 && (a = "" + n.key), e.type && e.type.defaultProps) var c = e.type.defaultProps;
			for (l in n) S.call(n, l) && !w.hasOwnProperty(l) && (i[l] = n[l] === void 0 && c !== void 0 ? c[l] : n[l]);
		}
		var l = arguments.length - 2;
		if (l === 1) i.children = r;
		else if (1 < l) {
			c = Array(l);
			for (var u = 0; u < l; u++) c[u] = arguments[u + 2];
			i.children = c;
		}
		return {
			$$typeof: t,
			type: e.type,
			key: a,
			ref: o,
			props: i,
			_owner: s
		};
	}, e.createContext = function(e) {
		return e = {
			$$typeof: s,
			_currentValue: e,
			_currentValue2: e,
			_threadCount: 0,
			Provider: null,
			Consumer: null,
			_defaultValue: null,
			_globalName: null
		}, e.Provider = {
			$$typeof: o,
			_context: e
		}, e.Consumer = e;
	}, e.createElement = T, e.createFactory = function(e) {
		var t = T.bind(null, e);
		return t.type = e, t;
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = D, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: N
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = function(e) {
		var t = F.transition;
		F.transition = {};
		try {
			e();
		} finally {
			F.transition = t;
		}
	}, e.unstable_act = L, e.useCallback = function(e, t) {
		return P.current.useCallback(e, t);
	}, e.useContext = function(e) {
		return P.current.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e) {
		return P.current.useDeferredValue(e);
	}, e.useEffect = function(e, t) {
		return P.current.useEffect(e, t);
	}, e.useId = function() {
		return P.current.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return P.current.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return P.current.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return P.current.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return P.current.useMemo(e, t);
	}, e.useReducer = function(e, t, n) {
		return P.current.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return P.current.useRef(e);
	}, e.useState = function(e) {
		return P.current.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return P.current.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return P.current.useTransition();
	}, e.version = "18.3.1";
})), n = /* @__PURE__ */ e(((e, n) => {
	n.exports = t();
})), r = /* @__PURE__ */ e(((e) => {
	var t = n(), r = Symbol.for("react.element"), i = Symbol.for("react.fragment"), a = Object.prototype.hasOwnProperty, o = t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, s = {
		key: !0,
		ref: !0,
		__self: !0,
		__source: !0
	};
	function c(e, t, n) {
		var i, c = {}, l = null, u = null;
		for (i in n !== void 0 && (l = "" + n), t.key !== void 0 && (l = "" + t.key), t.ref !== void 0 && (u = t.ref), t) a.call(t, i) && !s.hasOwnProperty(i) && (c[i] = t[i]);
		if (e && e.defaultProps) for (i in t = e.defaultProps, t) c[i] === void 0 && (c[i] = t[i]);
		return {
			$$typeof: r,
			type: e,
			key: l,
			ref: u,
			props: c,
			_owner: o.current
		};
	}
	e.Fragment = i, e.jsx = c, e.jsxs = c;
})), i = /* @__PURE__ */ e(((e, t) => {
	t.exports = r();
})), a = [
	{
		id: "news_desk",
		label: "뉴스 데스크",
		shortLabel: "Evidence",
		description: "RSS와 research inbox의 최신 수집 상태를 확인합니다.",
		source: "Research Index · RSS",
		route: "#/rss",
		panel: "status",
		zone: "news",
		symbol: "N"
	},
	{
		id: "market_board",
		label: "시장 상황판",
		shortLabel: "Market",
		description: "Market Memory가 정리한 중기 시장 판단과 freshness를 확인합니다.",
		source: "Market Memory",
		route: "#/market-memory",
		panel: "status",
		zone: "market",
		symbol: "M"
	},
	{
		id: "research_desk",
		label: "리서치 책상",
		shortLabel: "Research",
		description: "기업 분석과 딥 리서치 작업 상태를 확인합니다.",
		source: "Company Analysis · Topic Report",
		route: "#/deep-research",
		panel: "status",
		zone: "research",
		symbol: "R"
	},
	{
		id: "report_shelf",
		label: "보고서 서가",
		shortLabel: "Reports",
		description: "최근 브리핑과 기업 분석 보고서를 다시 엽니다.",
		source: "Saved Reports",
		route: "#/briefing",
		panel: "reports",
		zone: "reports",
		symbol: "S"
	},
	{
		id: "memo_board",
		label: "메모 보드",
		shortLabel: "Notes",
		description: "Folio 투자 메모의 개수와 최근 변경 시각을 확인합니다.",
		source: "Native Investment Notes",
		route: "#/briefing",
		panel: "status",
		zone: "memo",
		symbol: "T"
	},
	{
		id: "portfolio_monitor",
		label: "포트폴리오 모니터",
		shortLabel: "Personal",
		description: "보유·관심 항목의 존재 여부만 compact 상태로 확인합니다.",
		source: "Local Portfolio · Watchlist",
		route: "#/watchlist",
		panel: "status",
		zone: "portfolio",
		symbol: "P"
	},
	{
		id: "agent_seat",
		label: "Agent 자리",
		shortLabel: "Agent",
		description: "같은 Agent 대화, 제안과 최근 작업을 이어서 사용합니다.",
		source: "Agent Jobs",
		route: "#/home",
		panel: "agent",
		zone: "agent",
		symbol: "A"
	}
], o = a.map((e) => e.id);
function s(e) {
	return a.find((t) => t.id === e) || a[0];
}
function c(e = "unavailable") {
	return a.map((t) => ({
		id: t.id,
		state: e,
		summary: e === "loading" ? "상태를 불러오는 중입니다." : "현재 상태를 불러오지 못했습니다.",
		count: 0,
		asOf: "",
		stale: !1,
		notice: e === "loading" ? "" : "직접 화면은 계속 사용할 수 있습니다."
	}));
}
//#endregion
//#region src/app/pixelOffice/OfficeObject.tsx
var l = i(), u = {
	loading: "불러오는 중",
	ready: "준비됨",
	busy: "작업 중",
	attention: "확인 필요",
	empty: "비어 있음",
	stale: "업데이트 필요",
	unavailable: "사용 불가",
	error: "오류"
};
function d({ definition: e, status: t, selected: n, onSelect: r }) {
	let i = u[t.state];
	return /* @__PURE__ */ (0, l.jsxs)("button", {
		type: "button",
		className: `office-object office-object-${e.zone}${n ? " is-selected" : ""}`,
		"data-object-id": e.id,
		"data-state": t.state,
		"aria-pressed": n,
		"aria-label": `${e.label}: ${i}. ${t.summary}`,
		onClick: r,
		children: [/* @__PURE__ */ (0, l.jsx)("span", {
			className: "office-object-instrument",
			"aria-hidden": "true",
			children: /* @__PURE__ */ (0, l.jsx)("span", { children: e.symbol })
		}), /* @__PURE__ */ (0, l.jsxs)("span", {
			className: "office-object-copy",
			children: [
				/* @__PURE__ */ (0, l.jsx)("small", { children: e.shortLabel }),
				/* @__PURE__ */ (0, l.jsx)("strong", { children: e.label }),
				/* @__PURE__ */ (0, l.jsxs)("span", {
					className: "office-object-status",
					children: [/* @__PURE__ */ (0, l.jsx)("i", { "aria-hidden": "true" }), i]
				})
			]
		})]
	});
}
//#endregion
//#region src/app/pixelOffice/PixelOfficeScene.tsx
function f({ objects: e, selectedId: t, onSelect: n, character: r, characterAnchor: i = "agent_seat" }) {
	let o = new Map(e.map((e) => [e.id, e]));
	return /* @__PURE__ */ (0, l.jsxs)("section", {
		className: "pixel-office-scene",
		"aria-label": "Pixel Office 업무 공간",
		children: [
			/* @__PURE__ */ (0, l.jsxs)("div", {
				className: "office-window",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, l.jsx)("span", {}),
					/* @__PURE__ */ (0, l.jsx)("span", {}),
					/* @__PURE__ */ (0, l.jsx)("span", {})
				]
			}),
			/* @__PURE__ */ (0, l.jsx)("div", {
				className: "office-rug",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, l.jsx)("div", {
				className: "office-character-stage",
				"data-anchor": i,
				"aria-label": "현재 Agent 상태",
				children: r
			}),
			a.map((e) => /* @__PURE__ */ (0, l.jsx)(d, {
				definition: e,
				status: o.get(e.id),
				selected: t === e.id,
				onSelect: () => n(e.id)
			}, e.id))
		]
	});
}
//#endregion
export { s as a, c as i, a as n, i as o, o as r, n as s, f as t };
