//#region \0rolldown/runtime.js
var e = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), t = /* @__PURE__ */ e(((e) => {
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
})), a = "rules_on_engine_failure", o = /* @__PURE__ */ "id.jobId.category.kind.taskType.labelCode.status.progress.messageCode.createdAt.startedAt.updatedAt.finishedAt.errorCode.generationMode.adapter.requestedMode.mode.attemptedEngine.finalEngine.fallbackReason.artifactTypes.artifactCount.proposalId.proposalStatus.resultStatus".split("."), s = [
	"schemaVersion",
	"storeRevision",
	"jobsStoreRevision",
	"retention",
	"total",
	"entries"
], c = ["maxEntries", "maxDays"], l = /* @__PURE__ */ new Set(["companion", "task"]), u = /* @__PURE__ */ new Set([
	"index",
	"rss",
	"setup",
	"agent_bridge",
	"agent_cli_install",
	"briefing",
	"company_analysis",
	"topic_report",
	"market_state_snapshot"
]), d = /* @__PURE__ */ new Set([
	"index",
	"rss",
	"setup",
	"companion",
	"briefing",
	"company_analysis",
	"topic_report",
	"personal_overlay",
	"thesis_delta",
	"market_memory_llm",
	"market_state_snapshot",
	"market_memory_update",
	"quality_repair",
	"investment_review"
]), f = /* @__PURE__ */ new Set([
	"index_rebuild",
	"rss_import",
	"setup",
	"agent_chat",
	"agent_cli_install",
	"agent_task",
	"briefing",
	"company_analysis",
	"topic_report",
	"market_state"
]), p = /* @__PURE__ */ new Set([
	"queued",
	"running",
	"cancel_requested",
	"committing",
	"done",
	"cancelled",
	"failed",
	"failed_cancel",
	"failed_commit",
	"failed_restart",
	"failed_commit_recovery"
]), m = /* @__PURE__ */ new Set([
	"llm_api",
	"llm_cli",
	"rules",
	"none"
]), h = /* @__PURE__ */ new Set([
	"auto",
	"codex",
	"claude",
	"antigravity",
	"openai_api",
	"gemini_api",
	"claude_api",
	"rules",
	"none"
]), g = /* @__PURE__ */ new Set(["direct", "cli"]), _ = /* @__PURE__ */ new Set([
	"collect",
	"index",
	"install",
	"answer",
	"generate",
	"revise",
	"fallback"
]), v = /* @__PURE__ */ new Set([
	"api",
	"cli",
	"rules",
	"none"
]), y = /* @__PURE__ */ new Set([
	"engine_unavailable",
	"engine_failed",
	"confirmed_zero_evidence"
]), b = /* @__PURE__ */ new Set([
	"adapter_unavailable",
	"adapter_failed",
	"validation_failed",
	"save_failed",
	"cancel_failed",
	"restart_interrupted",
	"commit_recovery_failed",
	"private_cleanup_failed",
	"store_unavailable",
	"internal_error"
]), x = /* @__PURE__ */ new Set([
	"pending",
	"applying",
	"applied",
	"rejected",
	"stale",
	"conflict",
	"failed_apply",
	"unavailable"
]), S = /* @__PURE__ */ new Set([
	"done",
	"cancelled",
	"failed"
]), C = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/;
function w(e, t) {
	if (!k(e)) return !1;
	let n = Object.keys(e).sort(), r = [...t].sort();
	return n.length === r.length && n.every((e, t) => e === r[t]);
}
function T(e) {
	if (!w(e, o)) return !1;
	let t = (e, t) => e === null || t.has(e), n = (e) => e === null || typeof e == "string" && C.test(e);
	return typeof e.id == "string" && /^wl_[0-9a-f]{24}$/.test(e.id) && typeof e.jobId == "string" && l.has(e.category) && u.has(e.kind) && d.has(e.taskType) && f.has(e.labelCode) && p.has(e.status) && Number.isInteger(e.progress) && e.progress >= 0 && e.progress <= 100 && p.has(e.messageCode) && typeof e.createdAt == "string" && C.test(e.createdAt) && typeof e.updatedAt == "string" && C.test(e.updatedAt) && n(e.startedAt) && n(e.finishedAt) && t(e.errorCode, b) && m.has(e.generationMode) && h.has(e.adapter) && t(e.requestedMode, g) && _.has(e.mode) && t(e.attemptedEngine, v) && t(e.finalEngine, v) && t(e.fallbackReason, y) && Array.isArray(e.artifactTypes) && e.artifactTypes.every((e) => typeof e == "string") && Number.isInteger(e.artifactCount) && e.artifactCount >= 0 && (e.proposalId === null || typeof e.proposalId == "string") && t(e.proposalStatus, x) && t(e.resultStatus, S);
}
function E(e) {
	if (!w(e, s) || e.schemaVersion !== 1 || !Number.isInteger(e.storeRevision) || !Number.isInteger(e.jobsStoreRevision) || !Number.isInteger(e.total) || !Array.isArray(e.entries) || !e.entries.every(T) || !w(e.retention, c) || e.retention.maxEntries !== 200 || e.retention.maxDays !== 30) throw Error("work_log_contract_invalid");
	return e;
}
var D = class extends Error {
	path;
	status;
	code;
	payload;
	name = "ApiRequestError";
	constructor(e, t, n, r) {
		super(`${e} failed: ${t}${n ? ` (${n})` : ""}`), this.path = e, this.status = t, this.code = n, this.payload = r;
	}
};
function O(e) {
	return e === "queued" || e === "running" || e === "cancel_requested" || e === "committing";
}
function k(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
async function A(e) {
	try {
		return await e.json();
	} catch {
		return null;
	}
}
async function j(e, t) {
	let n = await fetch(e, t), r = await A(n);
	if (!n.ok) {
		let t = k(r) ? r : null, i = t?.error, a = typeof i == "string" ? i : "request_failed";
		throw new D(e, n.status, a, t);
	}
	if (r === null) throw Error(`${e} returned an empty response`);
	return r;
}
async function M(e, t = {}) {
	return j(e, {
		headers: { "Content-Type": "application/json" },
		signal: t.signal
	});
}
async function N(e, t, n = {}) {
	return j(e, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(t),
		signal: n.signal
	});
}
async function P(e, t = {}) {
	return M(`/api/investment-notes/${encodeURIComponent(e)}/intelligence`, t);
}
async function F(e, t, n = {}) {
	return N(`/api/theses/${encodeURIComponent(e)}/review/checkpoints`, t, n);
}
async function I(e, t = {}) {
	return N(`/api/theses/${encodeURIComponent(e)}/delta`, { period: "90d" }, t);
}
async function L(e, t, n = {}) {
	return j(e, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(t),
		signal: n.signal
	});
}
async function R(e, t, n = {}) {
	return j(e, {
		method: "DELETE",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(t),
		signal: n.signal
	});
}
//#endregion
//#region src/app/themePreference.ts
var z = n();
function B(e) {
	return e === "light" || e === "dark" || e === "system";
}
function V(e) {
	return e === "light" || e === "dark";
}
function H() {
	return {
		preference: B(window.FolioTheme?.preference) ? window.FolioTheme.preference : "system",
		resolved: V(window.FolioTheme?.resolved) ? window.FolioTheme.resolved : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
	};
}
function U() {
	let [e, t] = (0, z.useState)(H);
	return (0, z.useEffect)(() => {
		let e = (e) => {
			let n = e?.detail;
			if (n && B(n.preference) && V(n.resolved)) {
				t(n);
				return;
			}
			t(H());
		};
		return window.addEventListener("folio:theme-changed", e), e(), () => window.removeEventListener("folio:theme-changed", e);
	}, []), {
		...e,
		setPreference(e) {
			let n = window.FolioTheme?.setPreference(e);
			t(n || {
				preference: e,
				resolved: e === "system" ? H().resolved : e
			});
		}
	};
}
//#endregion
export { P as a, E as c, I as d, F as f, e as h, R as i, N as l, n as m, D as n, M as o, i as p, a as r, O as s, U as t, L as u };
