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
	function t(e, t) {
		var n = e.length;
		e.push(t);
		a: for (; 0 < n;) {
			var r = n - 1 >>> 1, a = e[r];
			if (0 < i(a, t)) e[r] = t, e[n] = a, n = r;
			else break a;
		}
	}
	function n(e) {
		return e.length === 0 ? null : e[0];
	}
	function r(e) {
		if (e.length === 0) return null;
		var t = e[0], n = e.pop();
		if (n !== t) {
			e[0] = n;
			a: for (var r = 0, a = e.length, o = a >>> 1; r < o;) {
				var s = 2 * (r + 1) - 1, c = e[s], l = s + 1, u = e[l];
				if (0 > i(c, n)) l < a && 0 > i(u, c) ? (e[r] = u, e[l] = n, r = l) : (e[r] = c, e[s] = n, r = s);
				else if (l < a && 0 > i(u, n)) e[r] = u, e[l] = n, r = l;
				else break a;
			}
		}
		return t;
	}
	function i(e, t) {
		var n = e.sortIndex - t.sortIndex;
		return n === 0 ? e.id - t.id : n;
	}
	if (typeof performance == "object" && typeof performance.now == "function") {
		var a = performance;
		e.unstable_now = function() {
			return a.now();
		};
	} else {
		var o = Date, s = o.now();
		e.unstable_now = function() {
			return o.now() - s;
		};
	}
	var c = [], l = [], u = 1, d = null, f = 3, p = !1, m = !1, h = !1, g = typeof setTimeout == "function" ? setTimeout : null, _ = typeof clearTimeout == "function" ? clearTimeout : null, v = typeof setImmediate < "u" ? setImmediate : null;
	typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
	function y(e) {
		for (var i = n(l); i !== null;) {
			if (i.callback === null) r(l);
			else if (i.startTime <= e) r(l), i.sortIndex = i.expirationTime, t(c, i);
			else break;
			i = n(l);
		}
	}
	function b(e) {
		if (h = !1, y(e), !m) if (n(c) !== null) m = !0, M(x);
		else {
			var t = n(l);
			t !== null && N(b, t.startTime - e);
		}
	}
	function x(t, i) {
		m = !1, h && (h = !1, _(w), w = -1), p = !0;
		var a = f;
		try {
			for (y(i), d = n(c); d !== null && (!(d.expirationTime > i) || t && !D());) {
				var o = d.callback;
				if (typeof o == "function") {
					d.callback = null, f = d.priorityLevel;
					var s = o(d.expirationTime <= i);
					i = e.unstable_now(), typeof s == "function" ? d.callback = s : d === n(c) && r(c), y(i);
				} else r(c);
				d = n(c);
			}
			if (d !== null) var u = !0;
			else {
				var g = n(l);
				g !== null && N(b, g.startTime - i), u = !1;
			}
			return u;
		} finally {
			d = null, f = a, p = !1;
		}
	}
	var S = !1, C = null, w = -1, T = 5, E = -1;
	function D() {
		return !(e.unstable_now() - E < T);
	}
	function O() {
		if (C !== null) {
			var t = e.unstable_now();
			E = t;
			var n = !0;
			try {
				n = C(!0, t);
			} finally {
				n ? k() : (S = !1, C = null);
			}
		} else S = !1;
	}
	var k;
	if (typeof v == "function") k = function() {
		v(O);
	};
	else if (typeof MessageChannel < "u") {
		var A = new MessageChannel(), j = A.port2;
		A.port1.onmessage = O, k = function() {
			j.postMessage(null);
		};
	} else k = function() {
		g(O, 0);
	};
	function M(e) {
		C = e, S || (S = !0, k());
	}
	function N(t, n) {
		w = g(function() {
			t(e.unstable_now());
		}, n);
	}
	e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
		e.callback = null;
	}, e.unstable_continueExecution = function() {
		m || p || (m = !0, M(x));
	}, e.unstable_forceFrameRate = function(e) {
		0 > e || 125 < e ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : T = 0 < e ? Math.floor(1e3 / e) : 5;
	}, e.unstable_getCurrentPriorityLevel = function() {
		return f;
	}, e.unstable_getFirstCallbackNode = function() {
		return n(c);
	}, e.unstable_next = function(e) {
		switch (f) {
			case 1:
			case 2:
			case 3:
				var t = 3;
				break;
			default: t = f;
		}
		var n = f;
		f = t;
		try {
			return e();
		} finally {
			f = n;
		}
	}, e.unstable_pauseExecution = function() {}, e.unstable_requestPaint = function() {}, e.unstable_runWithPriority = function(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 3:
			case 4:
			case 5: break;
			default: e = 3;
		}
		var n = f;
		f = e;
		try {
			return t();
		} finally {
			f = n;
		}
	}, e.unstable_scheduleCallback = function(r, i, a) {
		var o = e.unstable_now();
		switch (typeof a == "object" && a ? (a = a.delay, a = typeof a == "number" && 0 < a ? o + a : o) : a = o, r) {
			case 1:
				var s = -1;
				break;
			case 2:
				s = 250;
				break;
			case 5:
				s = 1073741823;
				break;
			case 4:
				s = 1e4;
				break;
			default: s = 5e3;
		}
		return s = a + s, r = {
			id: u++,
			callback: i,
			priorityLevel: r,
			startTime: a,
			expirationTime: s,
			sortIndex: -1
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (_(w), w = -1) : h = !0, N(b, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, M(x))), r;
	}, e.unstable_shouldYield = D, e.unstable_wrapCallback = function(e) {
		var t = f;
		return function() {
			var n = f;
			f = t;
			try {
				return e.apply(this, arguments);
			} finally {
				f = n;
			}
		};
	};
})), i = /* @__PURE__ */ e(((e, t) => {
	t.exports = r();
})), a = /* @__PURE__ */ e(((e) => {
	var t = n(), r = i();
	function a(e) {
		for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	var o = /* @__PURE__ */ new Set(), s = {};
	function c(e, t) {
		l(e, t), l(e + "Capture", t);
	}
	function l(e, t) {
		for (s[e] = t, e = 0; e < t.length; e++) o.add(t[e]);
	}
	var u = !(typeof window > "u" || window.document === void 0 || window.document.createElement === void 0), d = Object.prototype.hasOwnProperty, f = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, p = {}, m = {};
	function h(e) {
		return d.call(m, e) ? !0 : d.call(p, e) ? !1 : f.test(e) ? m[e] = !0 : (p[e] = !0, !1);
	}
	function g(e, t, n, r) {
		if (n !== null && n.type === 0) return !1;
		switch (typeof t) {
			case "function":
			case "symbol": return !0;
			case "boolean": return r ? !1 : n === null ? (e = e.toLowerCase().slice(0, 5), e !== "data-" && e !== "aria-") : !n.acceptsBooleans;
			default: return !1;
		}
	}
	function _(e, t, n, r) {
		if (t == null || g(e, t, n, r)) return !0;
		if (r) return !1;
		if (n !== null) switch (n.type) {
			case 3: return !t;
			case 4: return !1 === t;
			case 5: return isNaN(t);
			case 6: return isNaN(t) || 1 > t;
		}
		return !1;
	}
	function v(e, t, n, r, i, a, o) {
		this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = r, this.attributeNamespace = i, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = a, this.removeEmptyString = o;
	}
	var y = {};
	"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
		y[e] = new v(e, 0, !1, e, null, !1, !1);
	}), [
		["acceptCharset", "accept-charset"],
		["className", "class"],
		["htmlFor", "for"],
		["httpEquiv", "http-equiv"]
	].forEach(function(e) {
		var t = e[0];
		y[t] = new v(t, 1, !1, e[1], null, !1, !1);
	}), [
		"contentEditable",
		"draggable",
		"spellCheck",
		"value"
	].forEach(function(e) {
		y[e] = new v(e, 2, !1, e.toLowerCase(), null, !1, !1);
	}), [
		"autoReverse",
		"externalResourcesRequired",
		"focusable",
		"preserveAlpha"
	].forEach(function(e) {
		y[e] = new v(e, 2, !1, e, null, !1, !1);
	}), "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
		y[e] = new v(e, 3, !1, e.toLowerCase(), null, !1, !1);
	}), [
		"checked",
		"multiple",
		"muted",
		"selected"
	].forEach(function(e) {
		y[e] = new v(e, 3, !0, e, null, !1, !1);
	}), ["capture", "download"].forEach(function(e) {
		y[e] = new v(e, 4, !1, e, null, !1, !1);
	}), [
		"cols",
		"rows",
		"size",
		"span"
	].forEach(function(e) {
		y[e] = new v(e, 6, !1, e, null, !1, !1);
	}), ["rowSpan", "start"].forEach(function(e) {
		y[e] = new v(e, 5, !1, e.toLowerCase(), null, !1, !1);
	});
	var b = /[\-:]([a-z])/g;
	function x(e) {
		return e[1].toUpperCase();
	}
	"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
		var t = e.replace(b, x);
		y[t] = new v(t, 1, !1, e, null, !1, !1);
	}), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
		var t = e.replace(b, x);
		y[t] = new v(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
	}), [
		"xml:base",
		"xml:lang",
		"xml:space"
	].forEach(function(e) {
		var t = e.replace(b, x);
		y[t] = new v(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
	}), ["tabIndex", "crossOrigin"].forEach(function(e) {
		y[e] = new v(e, 1, !1, e.toLowerCase(), null, !1, !1);
	}), y.xlinkHref = new v("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1), [
		"src",
		"href",
		"action",
		"formAction"
	].forEach(function(e) {
		y[e] = new v(e, 1, !1, e.toLowerCase(), null, !0, !0);
	});
	function S(e, t, n, r) {
		var i = y.hasOwnProperty(t) ? y[t] : null;
		(i === null ? r || !(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N" : i.type !== 0) && (_(t, n, i, r) && (n = null), r || i === null ? h(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : i.mustUseProperty ? e[i.propertyName] = n === null ? i.type !== 3 && "" : n : (t = i.attributeName, r = i.attributeNamespace, n === null ? e.removeAttribute(t) : (i = i.type, n = i === 3 || i === 4 && !0 === n ? "" : "" + n, r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
	}
	var C = t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, w = Symbol.for("react.element"), T = Symbol.for("react.portal"), E = Symbol.for("react.fragment"), D = Symbol.for("react.strict_mode"), O = Symbol.for("react.profiler"), k = Symbol.for("react.provider"), A = Symbol.for("react.context"), j = Symbol.for("react.forward_ref"), M = Symbol.for("react.suspense"), N = Symbol.for("react.suspense_list"), P = Symbol.for("react.memo"), F = Symbol.for("react.lazy"), I = Symbol.for("react.offscreen"), L = Symbol.iterator;
	function R(e) {
		return typeof e != "object" || !e ? null : (e = L && e[L] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var z = Object.assign, B;
	function V(e) {
		if (B === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			B = t && t[1] || "";
		}
		return "\n" + B + e;
	}
	var ee = !1;
	function H(e, t) {
		if (!e || ee) return "";
		ee = !0;
		var n = Error.prepareStackTrace;
		Error.prepareStackTrace = void 0;
		try {
			if (t) if (t = function() {
				throw Error();
			}, Object.defineProperty(t.prototype, "props", { set: function() {
				throw Error();
			} }), typeof Reflect == "object" && Reflect.construct) {
				try {
					Reflect.construct(t, []);
				} catch (e) {
					var r = e;
				}
				Reflect.construct(e, [], t);
			} else {
				try {
					t.call();
				} catch (e) {
					r = e;
				}
				e.call(t.prototype);
			}
			else {
				try {
					throw Error();
				} catch (e) {
					r = e;
				}
				e();
			}
		} catch (t) {
			if (t && r && typeof t.stack == "string") {
				for (var i = t.stack.split("\n"), a = r.stack.split("\n"), o = i.length - 1, s = a.length - 1; 1 <= o && 0 <= s && i[o] !== a[s];) s--;
				for (; 1 <= o && 0 <= s; o--, s--) if (i[o] !== a[s]) {
					if (o !== 1 || s !== 1) do
						if (o--, s--, 0 > s || i[o] !== a[s]) {
							var c = "\n" + i[o].replace(" at new ", " at ");
							return e.displayName && c.includes("<anonymous>") && (c = c.replace("<anonymous>", e.displayName)), c;
						}
					while (1 <= o && 0 <= s);
					break;
				}
			}
		} finally {
			ee = !1, Error.prepareStackTrace = n;
		}
		return (e = e ? e.displayName || e.name : "") ? V(e) : "";
	}
	function U(e) {
		switch (e.tag) {
			case 5: return V(e.type);
			case 16: return V("Lazy");
			case 13: return V("Suspense");
			case 19: return V("SuspenseList");
			case 0:
			case 2:
			case 15: return e = H(e.type, !1), e;
			case 11: return e = H(e.type.render, !1), e;
			case 1: return e = H(e.type, !0), e;
			default: return "";
		}
	}
	function W(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case E: return "Fragment";
			case T: return "Portal";
			case O: return "Profiler";
			case D: return "StrictMode";
			case M: return "Suspense";
			case N: return "SuspenseList";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case A: return (e.displayName || "Context") + ".Consumer";
			case k: return (e._context.displayName || "Context") + ".Provider";
			case j:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case P: return t = e.displayName || null, t === null ? W(e.type) || "Memo" : t;
			case F:
				t = e._payload, e = e._init;
				try {
					return W(e(t));
				} catch {}
		}
		return null;
	}
	function te(e) {
		var t = e.type;
		switch (e.tag) {
			case 24: return "Cache";
			case 9: return (t.displayName || "Context") + ".Consumer";
			case 10: return (t._context.displayName || "Context") + ".Provider";
			case 18: return "DehydratedFragment";
			case 11: return e = t.render, e = e.displayName || e.name || "", t.displayName || (e === "" ? "ForwardRef" : "ForwardRef(" + e + ")");
			case 7: return "Fragment";
			case 5: return t;
			case 4: return "Portal";
			case 3: return "Root";
			case 6: return "Text";
			case 16: return W(t);
			case 8: return t === D ? "StrictMode" : "Mode";
			case 22: return "Offscreen";
			case 12: return "Profiler";
			case 21: return "Scope";
			case 13: return "Suspense";
			case 19: return "SuspenseList";
			case 25: return "TracingMarker";
			case 1:
			case 0:
			case 17:
			case 2:
			case 14:
			case 15:
				if (typeof t == "function") return t.displayName || t.name || null;
				if (typeof t == "string") return t;
		}
		return null;
	}
	function ne(e) {
		switch (typeof e) {
			case "boolean":
			case "number":
			case "string":
			case "undefined": return e;
			case "object": return e;
			default: return "";
		}
	}
	function G(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function K(e) {
		var t = G(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), r = "" + e[t];
		if (!e.hasOwnProperty(t) && n !== void 0 && typeof n.get == "function" && typeof n.set == "function") {
			var i = n.get, a = n.set;
			return Object.defineProperty(e, t, {
				configurable: !0,
				get: function() {
					return i.call(this);
				},
				set: function(e) {
					r = "" + e, a.call(this, e);
				}
			}), Object.defineProperty(e, t, { enumerable: n.enumerable }), {
				getValue: function() {
					return r;
				},
				setValue: function(e) {
					r = "" + e;
				},
				stopTracking: function() {
					e._valueTracker = null, delete e[t];
				}
			};
		}
	}
	function re(e) {
		e._valueTracker ||= K(e);
	}
	function ie(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = G(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
	}
	function ae(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	function oe(e, t) {
		var n = t.checked;
		return z({}, t, {
			defaultChecked: void 0,
			defaultValue: void 0,
			value: void 0,
			checked: n ?? e._wrapperState.initialChecked
		});
	}
	function se(e, t) {
		var n = t.defaultValue == null ? "" : t.defaultValue, r = t.checked == null ? t.defaultChecked : t.checked;
		n = ne(t.value == null ? n : t.value), e._wrapperState = {
			initialChecked: r,
			initialValue: n,
			controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null
		};
	}
	function ce(e, t) {
		t = t.checked, t != null && S(e, "checked", t, !1);
	}
	function le(e, t) {
		ce(e, t);
		var n = ne(t.value), r = t.type;
		if (n != null) r === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
		else if (r === "submit" || r === "reset") {
			e.removeAttribute("value");
			return;
		}
		t.hasOwnProperty("value") ? de(e, t.type, n) : t.hasOwnProperty("defaultValue") && de(e, t.type, ne(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
	}
	function ue(e, t, n) {
		if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
			var r = t.type;
			if (!(r !== "submit" && r !== "reset" || t.value !== void 0 && t.value !== null)) return;
			t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
		}
		n = e.name, n !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
	}
	function de(e, t, n) {
		(t !== "number" || ae(e.ownerDocument) !== e) && (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
	}
	var fe = Array.isArray;
	function pe(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + ne(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function me(e, t) {
		if (t.dangerouslySetInnerHTML != null) throw Error(a(91));
		return z({}, t, {
			value: void 0,
			defaultValue: void 0,
			children: "" + e._wrapperState.initialValue
		});
	}
	function he(e, t) {
		var n = t.value;
		if (n == null) {
			if (n = t.children, t = t.defaultValue, n != null) {
				if (t != null) throw Error(a(92));
				if (fe(n)) {
					if (1 < n.length) throw Error(a(93));
					n = n[0];
				}
				t = n;
			}
			t ??= "", n = t;
		}
		e._wrapperState = { initialValue: ne(n) };
	}
	function ge(e, t) {
		var n = ne(t.value), r = ne(t.defaultValue);
		n != null && (n = "" + n, n !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), r != null && (e.defaultValue = "" + r);
	}
	function _e(e) {
		var t = e.textContent;
		t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
	}
	function ve(e) {
		switch (e) {
			case "svg": return "http://www.w3.org/2000/svg";
			case "math": return "http://www.w3.org/1998/Math/MathML";
			default: return "http://www.w3.org/1999/xhtml";
		}
	}
	function ye(e, t) {
		return e == null || e === "http://www.w3.org/1999/xhtml" ? ve(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
	}
	var be, xe = function(e) {
		return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, r, i) {
			MSApp.execUnsafeLocalFunction(function() {
				return e(t, n, r, i);
			});
		} : e;
	}(function(e, t) {
		if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e) e.innerHTML = t;
		else {
			for (be ||= document.createElement("div"), be.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = be.firstChild; e.firstChild;) e.removeChild(e.firstChild);
			for (; t.firstChild;) e.appendChild(t.firstChild);
		}
	});
	function Se(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var Ce = {
		animationIterationCount: !0,
		aspectRatio: !0,
		borderImageOutset: !0,
		borderImageSlice: !0,
		borderImageWidth: !0,
		boxFlex: !0,
		boxFlexGroup: !0,
		boxOrdinalGroup: !0,
		columnCount: !0,
		columns: !0,
		flex: !0,
		flexGrow: !0,
		flexPositive: !0,
		flexShrink: !0,
		flexNegative: !0,
		flexOrder: !0,
		gridArea: !0,
		gridRow: !0,
		gridRowEnd: !0,
		gridRowSpan: !0,
		gridRowStart: !0,
		gridColumn: !0,
		gridColumnEnd: !0,
		gridColumnSpan: !0,
		gridColumnStart: !0,
		fontWeight: !0,
		lineClamp: !0,
		lineHeight: !0,
		opacity: !0,
		order: !0,
		orphans: !0,
		tabSize: !0,
		widows: !0,
		zIndex: !0,
		zoom: !0,
		fillOpacity: !0,
		floodOpacity: !0,
		stopOpacity: !0,
		strokeDasharray: !0,
		strokeDashoffset: !0,
		strokeMiterlimit: !0,
		strokeOpacity: !0,
		strokeWidth: !0
	}, we = [
		"Webkit",
		"ms",
		"Moz",
		"O"
	];
	Object.keys(Ce).forEach(function(e) {
		we.forEach(function(t) {
			t = t + e.charAt(0).toUpperCase() + e.substring(1), Ce[t] = Ce[e];
		});
	});
	function Te(e, t, n) {
		return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || Ce.hasOwnProperty(e) && Ce[e] ? ("" + t).trim() : t + "px";
	}
	function Ee(e, t) {
		for (var n in e = e.style, t) if (t.hasOwnProperty(n)) {
			var r = n.indexOf("--") === 0, i = Te(n, t[n], r);
			n === "float" && (n = "cssFloat"), r ? e.setProperty(n, i) : e[n] = i;
		}
	}
	var De = z({ menuitem: !0 }, {
		area: !0,
		base: !0,
		br: !0,
		col: !0,
		embed: !0,
		hr: !0,
		img: !0,
		input: !0,
		keygen: !0,
		link: !0,
		meta: !0,
		param: !0,
		source: !0,
		track: !0,
		wbr: !0
	});
	function Oe(e, t) {
		if (t) {
			if (De[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(a(137, e));
			if (t.dangerouslySetInnerHTML != null) {
				if (t.children != null) throw Error(a(60));
				if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(a(61));
			}
			if (t.style != null && typeof t.style != "object") throw Error(a(62));
		}
	}
	function ke(e, t) {
		if (e.indexOf("-") === -1) return typeof t.is == "string";
		switch (e) {
			case "annotation-xml":
			case "color-profile":
			case "font-face":
			case "font-face-src":
			case "font-face-uri":
			case "font-face-format":
			case "font-face-name":
			case "missing-glyph": return !1;
			default: return !0;
		}
	}
	var Ae = null;
	function je(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var Me = null, Ne = null, Pe = null;
	function Fe(e) {
		if (e = Mi(e)) {
			if (typeof Me != "function") throw Error(a(280));
			var t = e.stateNode;
			t && (t = Pi(t), Me(e.stateNode, e.type, t));
		}
	}
	function Ie(e) {
		Ne ? Pe ? Pe.push(e) : Pe = [e] : Ne = e;
	}
	function Le() {
		if (Ne) {
			var e = Ne, t = Pe;
			if (Pe = Ne = null, Fe(e), t) for (e = 0; e < t.length; e++) Fe(t[e]);
		}
	}
	function Re(e, t) {
		return e(t);
	}
	function ze() {}
	var Be = !1;
	function Ve(e, t, n) {
		if (Be) return e(t, n);
		Be = !0;
		try {
			return Re(e, t, n);
		} finally {
			Be = !1, (Ne !== null || Pe !== null) && (ze(), Le());
		}
	}
	function He(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = Pi(n);
		if (r === null) return null;
		n = r[t];
		a: switch (t) {
			case "onClick":
			case "onClickCapture":
			case "onDoubleClick":
			case "onDoubleClickCapture":
			case "onMouseDown":
			case "onMouseDownCapture":
			case "onMouseMove":
			case "onMouseMoveCapture":
			case "onMouseUp":
			case "onMouseUpCapture":
			case "onMouseEnter":
				(r = !r.disabled) || (e = e.type, r = e !== "button" && e !== "input" && e !== "select" && e !== "textarea"), e = !r;
				break a;
			default: e = !1;
		}
		if (e) return null;
		if (n && typeof n != "function") throw Error(a(231, t, typeof n));
		return n;
	}
	var Ue = !1;
	if (u) try {
		var We = {};
		Object.defineProperty(We, "passive", { get: function() {
			Ue = !0;
		} }), window.addEventListener("test", We, We), window.removeEventListener("test", We, We);
	} catch {
		Ue = !1;
	}
	function Ge(e, t, n, r, i, a, o, s, c) {
		var l = Array.prototype.slice.call(arguments, 3);
		try {
			t.apply(n, l);
		} catch (e) {
			this.onError(e);
		}
	}
	var Ke = !1, qe = null, Je = !1, Ye = null, Xe = { onError: function(e) {
		Ke = !0, qe = e;
	} };
	function Ze(e, t, n, r, i, a, o, s, c) {
		Ke = !1, qe = null, Ge.apply(Xe, arguments);
	}
	function Qe(e, t, n, r, i, o, s, c, l) {
		if (Ze.apply(this, arguments), Ke) {
			if (Ke) {
				var u = qe;
				Ke = !1, qe = null;
			} else throw Error(a(198));
			Je || (Je = !0, Ye = u);
		}
	}
	function q(e) {
		var t = e, n = e;
		if (e.alternate) for (; t.return;) t = t.return;
		else {
			e = t;
			do
				t = e, t.flags & 4098 && (n = t.return), e = t.return;
			while (e);
		}
		return t.tag === 3 ? n : null;
	}
	function $e(e) {
		if (e.tag === 13) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function et(e) {
		if (q(e) !== e) throw Error(a(188));
	}
	function tt(e) {
		var t = e.alternate;
		if (!t) {
			if (t = q(e), t === null) throw Error(a(188));
			return t === e ? e : null;
		}
		for (var n = e, r = t;;) {
			var i = n.return;
			if (i === null) break;
			var o = i.alternate;
			if (o === null) {
				if (r = i.return, r !== null) {
					n = r;
					continue;
				}
				break;
			}
			if (i.child === o.child) {
				for (o = i.child; o;) {
					if (o === n) return et(i), e;
					if (o === r) return et(i), t;
					o = o.sibling;
				}
				throw Error(a(188));
			}
			if (n.return !== r.return) n = i, r = o;
			else {
				for (var s = !1, c = i.child; c;) {
					if (c === n) {
						s = !0, n = i, r = o;
						break;
					}
					if (c === r) {
						s = !0, r = i, n = o;
						break;
					}
					c = c.sibling;
				}
				if (!s) {
					for (c = o.child; c;) {
						if (c === n) {
							s = !0, n = o, r = i;
							break;
						}
						if (c === r) {
							s = !0, r = o, n = i;
							break;
						}
						c = c.sibling;
					}
					if (!s) throw Error(a(189));
				}
			}
			if (n.alternate !== r) throw Error(a(190));
		}
		if (n.tag !== 3) throw Error(a(188));
		return n.stateNode.current === n ? e : t;
	}
	function nt(e) {
		return e = tt(e), e === null ? null : rt(e);
	}
	function rt(e) {
		if (e.tag === 5 || e.tag === 6) return e;
		for (e = e.child; e !== null;) {
			var t = rt(e);
			if (t !== null) return t;
			e = e.sibling;
		}
		return null;
	}
	var it = r.unstable_scheduleCallback, at = r.unstable_cancelCallback, ot = r.unstable_shouldYield, st = r.unstable_requestPaint, ct = r.unstable_now, lt = r.unstable_getCurrentPriorityLevel, ut = r.unstable_ImmediatePriority, dt = r.unstable_UserBlockingPriority, ft = r.unstable_NormalPriority, pt = r.unstable_LowPriority, mt = r.unstable_IdlePriority, ht = null, gt = null;
	function _t(e) {
		if (gt && typeof gt.onCommitFiberRoot == "function") try {
			gt.onCommitFiberRoot(ht, e, void 0, (e.current.flags & 128) == 128);
		} catch {}
	}
	var vt = Math.clz32 ? Math.clz32 : xt, yt = Math.log, bt = Math.LN2;
	function xt(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (yt(e) / bt | 0) | 0;
	}
	var St = 64, Ct = 4194304;
	function wt(e) {
		switch (e & -e) {
			case 1: return 1;
			case 2: return 2;
			case 4: return 4;
			case 8: return 8;
			case 16: return 16;
			case 32: return 32;
			case 64:
			case 128:
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return e & 4194240;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432:
			case 67108864: return e & 130023424;
			case 134217728: return 134217728;
			case 268435456: return 268435456;
			case 536870912: return 536870912;
			case 1073741824: return 1073741824;
			default: return e;
		}
	}
	function Tt(e, t) {
		var n = e.pendingLanes;
		if (n === 0) return 0;
		var r = 0, i = e.suspendedLanes, a = e.pingedLanes, o = n & 268435455;
		if (o !== 0) {
			var s = o & ~i;
			s === 0 ? (a &= o, a !== 0 && (r = wt(a))) : r = wt(s);
		} else o = n & ~i, o === 0 ? a !== 0 && (r = wt(a)) : r = wt(o);
		if (r === 0) return 0;
		if (t !== 0 && t !== r && (t & i) === 0 && (i = r & -r, a = t & -t, i >= a || i === 16 && a & 4194240)) return t;
		if (r & 4 && (r |= n & 16), t = e.entangledLanes, t !== 0) for (e = e.entanglements, t &= r; 0 < t;) n = 31 - vt(t), i = 1 << n, r |= e[n], t &= ~i;
		return r;
	}
	function Et(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 4: return t + 250;
			case 8:
			case 16:
			case 32:
			case 64:
			case 128:
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return t + 5e3;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432:
			case 67108864: return -1;
			case 134217728:
			case 268435456:
			case 536870912:
			case 1073741824: return -1;
			default: return -1;
		}
	}
	function Dt(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes; 0 < a;) {
			var o = 31 - vt(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = Et(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
	}
	function Ot(e) {
		return e = e.pendingLanes & -1073741825, e === 0 ? e & 1073741824 ? 1073741824 : 0 : e;
	}
	function kt() {
		var e = St;
		return St <<= 1, !(St & 4194240) && (St = 64), e;
	}
	function At(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function jt(e, t, n) {
		e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - vt(t), e[t] = n;
	}
	function Mt(e, t) {
		var n = e.pendingLanes & ~t;
		e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
		var r = e.eventTimes;
		for (e = e.expirationTimes; 0 < n;) {
			var i = 31 - vt(n), a = 1 << i;
			t[i] = 0, r[i] = -1, e[i] = -1, n &= ~a;
		}
	}
	function Nt(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - vt(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	var J = 0;
	function Pt(e) {
		return e &= -e, 1 < e ? 4 < e ? e & 268435455 ? 16 : 536870912 : 4 : 1;
	}
	var Ft, It, Lt, Rt, zt, Bt = !1, Vt = [], Ht = null, Ut = null, Wt = null, Gt = /* @__PURE__ */ new Map(), Kt = /* @__PURE__ */ new Map(), qt = [], Jt = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
	function Yt(e, t) {
		switch (e) {
			case "focusin":
			case "focusout":
				Ht = null;
				break;
			case "dragenter":
			case "dragleave":
				Ut = null;
				break;
			case "mouseover":
			case "mouseout":
				Wt = null;
				break;
			case "pointerover":
			case "pointerout":
				Gt.delete(t.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": Kt.delete(t.pointerId);
		}
	}
	function Xt(e, t, n, r, i, a) {
		return e === null || e.nativeEvent !== a ? (e = {
			blockedOn: t,
			domEventName: n,
			eventSystemFlags: r,
			nativeEvent: a,
			targetContainers: [i]
		}, t !== null && (t = Mi(t), t !== null && It(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
	}
	function Zt(e, t, n, r, i) {
		switch (t) {
			case "focusin": return Ht = Xt(Ht, e, t, n, r, i), !0;
			case "dragenter": return Ut = Xt(Ut, e, t, n, r, i), !0;
			case "mouseover": return Wt = Xt(Wt, e, t, n, r, i), !0;
			case "pointerover":
				var a = i.pointerId;
				return Gt.set(a, Xt(Gt.get(a) || null, e, t, n, r, i)), !0;
			case "gotpointercapture": return a = i.pointerId, Kt.set(a, Xt(Kt.get(a) || null, e, t, n, r, i)), !0;
		}
		return !1;
	}
	function Qt(e) {
		var t = ji(e.target);
		if (t !== null) {
			var n = q(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = $e(n), t !== null) {
						e.blockedOn = t, zt(e.priority, function() {
							Lt(n);
						});
						return;
					}
				} else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
					e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
					return;
				}
			}
		}
		e.blockedOn = null;
	}
	function $t(e) {
		if (e.blockedOn !== null) return !1;
		for (var t = e.targetContainers; 0 < t.length;) {
			var n = dn(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
			if (n === null) {
				n = e.nativeEvent;
				var r = new n.constructor(n.type, n);
				Ae = r, n.target.dispatchEvent(r), Ae = null;
			} else return t = Mi(n), t !== null && It(t), e.blockedOn = n, !1;
			t.shift();
		}
		return !0;
	}
	function en(e, t, n) {
		$t(e) && n.delete(t);
	}
	function tn() {
		Bt = !1, Ht !== null && $t(Ht) && (Ht = null), Ut !== null && $t(Ut) && (Ut = null), Wt !== null && $t(Wt) && (Wt = null), Gt.forEach(en), Kt.forEach(en);
	}
	function nn(e, t) {
		e.blockedOn === t && (e.blockedOn = null, Bt || (Bt = !0, r.unstable_scheduleCallback(r.unstable_NormalPriority, tn)));
	}
	function rn(e) {
		function t(t) {
			return nn(t, e);
		}
		if (0 < Vt.length) {
			nn(Vt[0], e);
			for (var n = 1; n < Vt.length; n++) {
				var r = Vt[n];
				r.blockedOn === e && (r.blockedOn = null);
			}
		}
		for (Ht !== null && nn(Ht, e), Ut !== null && nn(Ut, e), Wt !== null && nn(Wt, e), Gt.forEach(t), Kt.forEach(t), n = 0; n < qt.length; n++) r = qt[n], r.blockedOn === e && (r.blockedOn = null);
		for (; 0 < qt.length && (n = qt[0], n.blockedOn === null);) Qt(n), n.blockedOn === null && qt.shift();
	}
	var an = C.ReactCurrentBatchConfig, on = !0;
	function sn(e, t, n, r) {
		var i = J, a = an.transition;
		an.transition = null;
		try {
			J = 1, ln(e, t, n, r);
		} finally {
			J = i, an.transition = a;
		}
	}
	function cn(e, t, n, r) {
		var i = J, a = an.transition;
		an.transition = null;
		try {
			J = 4, ln(e, t, n, r);
		} finally {
			J = i, an.transition = a;
		}
	}
	function ln(e, t, n, r) {
		if (on) {
			var i = dn(e, t, n, r);
			if (i === null) ri(e, t, r, un, n), Yt(e, r);
			else if (Zt(i, e, t, n, r)) r.stopPropagation();
			else if (Yt(e, r), t & 4 && -1 < Jt.indexOf(e)) {
				for (; i !== null;) {
					var a = Mi(i);
					if (a !== null && Ft(a), a = dn(e, t, n, r), a === null && ri(e, t, r, un, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else ri(e, t, r, null, n);
		}
	}
	var un = null;
	function dn(e, t, n, r) {
		if (un = null, e = je(r), e = ji(e), e !== null) if (t = q(e), t === null) e = null;
		else if (n = t.tag, n === 13) {
			if (e = $e(t), e !== null) return e;
			e = null;
		} else if (n === 3) {
			if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
			e = null;
		} else t !== e && (e = null);
		return un = e, null;
	}
	function fn(e) {
		switch (e) {
			case "cancel":
			case "click":
			case "close":
			case "contextmenu":
			case "copy":
			case "cut":
			case "auxclick":
			case "dblclick":
			case "dragend":
			case "dragstart":
			case "drop":
			case "focusin":
			case "focusout":
			case "input":
			case "invalid":
			case "keydown":
			case "keypress":
			case "keyup":
			case "mousedown":
			case "mouseup":
			case "paste":
			case "pause":
			case "play":
			case "pointercancel":
			case "pointerdown":
			case "pointerup":
			case "ratechange":
			case "reset":
			case "resize":
			case "seeked":
			case "submit":
			case "touchcancel":
			case "touchend":
			case "touchstart":
			case "volumechange":
			case "change":
			case "selectionchange":
			case "textInput":
			case "compositionstart":
			case "compositionend":
			case "compositionupdate":
			case "beforeblur":
			case "afterblur":
			case "beforeinput":
			case "blur":
			case "fullscreenchange":
			case "focus":
			case "hashchange":
			case "popstate":
			case "select":
			case "selectstart": return 1;
			case "drag":
			case "dragenter":
			case "dragexit":
			case "dragleave":
			case "dragover":
			case "mousemove":
			case "mouseout":
			case "mouseover":
			case "pointermove":
			case "pointerout":
			case "pointerover":
			case "scroll":
			case "toggle":
			case "touchmove":
			case "wheel":
			case "mouseenter":
			case "mouseleave":
			case "pointerenter":
			case "pointerleave": return 4;
			case "message": switch (lt()) {
				case ut: return 1;
				case dt: return 4;
				case ft:
				case pt: return 16;
				case mt: return 536870912;
				default: return 16;
			}
			default: return 16;
		}
	}
	var pn = null, mn = null, hn = null;
	function gn() {
		if (hn) return hn;
		var e, t = mn, n = t.length, r, i = "value" in pn ? pn.value : pn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return hn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function _n(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function vn() {
		return !0;
	}
	function yn() {
		return !1;
	}
	function bn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? vn : yn, this.isPropagationStopped = yn, this;
		}
		return z(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = vn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = vn);
			},
			persist: function() {},
			isPersistent: vn
		}), t;
	}
	var xn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, Sn = bn(xn), Cn = z({}, xn, {
		view: 0,
		detail: 0
	}), wn = bn(Cn), Tn, En, Dn, On = z({}, Cn, {
		screenX: 0,
		screenY: 0,
		clientX: 0,
		clientY: 0,
		pageX: 0,
		pageY: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		getModifierState: zn,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== Dn && (Dn && e.type === "mousemove" ? (Tn = e.screenX - Dn.screenX, En = e.screenY - Dn.screenY) : En = Tn = 0, Dn = e), Tn);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : En;
		}
	}), kn = bn(On), An = bn(z({}, On, { dataTransfer: 0 })), jn = bn(z({}, Cn, { relatedTarget: 0 })), Mn = bn(z({}, xn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Nn = bn(z({}, xn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), Pn = bn(z({}, xn, { data: 0 })), Fn = {
		Esc: "Escape",
		Spacebar: " ",
		Left: "ArrowLeft",
		Up: "ArrowUp",
		Right: "ArrowRight",
		Down: "ArrowDown",
		Del: "Delete",
		Win: "OS",
		Menu: "ContextMenu",
		Apps: "ContextMenu",
		Scroll: "ScrollLock",
		MozPrintableKey: "Unidentified"
	}, In = {
		8: "Backspace",
		9: "Tab",
		12: "Clear",
		13: "Enter",
		16: "Shift",
		17: "Control",
		18: "Alt",
		19: "Pause",
		20: "CapsLock",
		27: "Escape",
		32: " ",
		33: "PageUp",
		34: "PageDown",
		35: "End",
		36: "Home",
		37: "ArrowLeft",
		38: "ArrowUp",
		39: "ArrowRight",
		40: "ArrowDown",
		45: "Insert",
		46: "Delete",
		112: "F1",
		113: "F2",
		114: "F3",
		115: "F4",
		116: "F5",
		117: "F6",
		118: "F7",
		119: "F8",
		120: "F9",
		121: "F10",
		122: "F11",
		123: "F12",
		144: "NumLock",
		145: "ScrollLock",
		224: "Meta"
	}, Ln = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function Rn(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = Ln[e]) ? !!t[e] : !1;
	}
	function zn() {
		return Rn;
	}
	var Bn = bn(z({}, Cn, {
		key: function(e) {
			if (e.key) {
				var t = Fn[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = _n(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? In[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: zn,
		charCode: function(e) {
			return e.type === "keypress" ? _n(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? _n(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), Vn = bn(z({}, On, {
		pointerId: 0,
		width: 0,
		height: 0,
		pressure: 0,
		tangentialPressure: 0,
		tiltX: 0,
		tiltY: 0,
		twist: 0,
		pointerType: 0,
		isPrimary: 0
	})), Hn = bn(z({}, Cn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: zn
	})), Un = bn(z({}, xn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Wn = bn(z({}, On, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), Gn = [
		9,
		13,
		27,
		32
	], Kn = u && "CompositionEvent" in window, qn = null;
	u && "documentMode" in document && (qn = document.documentMode);
	var Jn = u && "TextEvent" in window && !qn, Yn = u && (!Kn || qn && 8 < qn && 11 >= qn), Xn = " ", Zn = !1;
	function Y(e, t) {
		switch (e) {
			case "keyup": return Gn.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function X(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var Qn = !1;
	function $n(e, t) {
		switch (e) {
			case "compositionend": return X(t);
			case "keypress": return t.which === 32 ? (Zn = !0, Xn) : null;
			case "textInput": return e = t.data, e === Xn && Zn ? null : e;
			default: return null;
		}
	}
	function er(e, t) {
		if (Qn) return e === "compositionend" || !Kn && Y(e, t) ? (e = gn(), hn = mn = pn = null, Qn = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return Yn && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var tr = {
		color: !0,
		date: !0,
		datetime: !0,
		"datetime-local": !0,
		email: !0,
		month: !0,
		number: !0,
		password: !0,
		range: !0,
		search: !0,
		tel: !0,
		text: !0,
		time: !0,
		url: !0,
		week: !0
	};
	function nr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!tr[e.type] : t === "textarea";
	}
	function rr(e, t, n, r) {
		Ie(r), t = ai(t, "onChange"), 0 < t.length && (n = new Sn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var ir = null, ar = null;
	function or(e) {
		Zr(e, 0);
	}
	function sr(e) {
		if (ie(Ni(e))) return e;
	}
	function cr(e, t) {
		if (e === "change") return t;
	}
	var lr = !1;
	if (u) {
		var ur;
		if (u) {
			var dr = "oninput" in document;
			if (!dr) {
				var fr = document.createElement("div");
				fr.setAttribute("oninput", "return;"), dr = typeof fr.oninput == "function";
			}
			ur = dr;
		} else ur = !1;
		lr = ur && (!document.documentMode || 9 < document.documentMode);
	}
	function pr() {
		ir && (ir.detachEvent("onpropertychange", mr), ar = ir = null);
	}
	function mr(e) {
		if (e.propertyName === "value" && sr(ar)) {
			var t = [];
			rr(t, ar, e, je(e)), Ve(or, t);
		}
	}
	function hr(e, t, n) {
		e === "focusin" ? (pr(), ir = t, ar = n, ir.attachEvent("onpropertychange", mr)) : e === "focusout" && pr();
	}
	function gr(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return sr(ar);
	}
	function _r(e, t) {
		if (e === "click") return sr(t);
	}
	function vr(e, t) {
		if (e === "input" || e === "change") return sr(t);
	}
	function yr(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var br = typeof Object.is == "function" ? Object.is : yr;
	function xr(e, t) {
		if (br(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!d.call(t, i) || !br(e[i], t[i])) return !1;
		}
		return !0;
	}
	function Sr(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function Cr(e, t) {
		var n = Sr(e);
		e = 0;
		for (var r; n;) {
			if (n.nodeType === 3) {
				if (r = e + n.textContent.length, e <= t && r >= t) return {
					node: n,
					offset: t - e
				};
				e = r;
			}
			a: {
				for (; n;) {
					if (n.nextSibling) {
						n = n.nextSibling;
						break a;
					}
					n = n.parentNode;
				}
				n = void 0;
			}
			n = Sr(n);
		}
	}
	function wr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? wr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function Tr() {
		for (var e = window, t = ae(); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = ae(e.document);
		}
		return t;
	}
	function Er(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	function Dr(e) {
		var t = Tr(), n = e.focusedElem, r = e.selectionRange;
		if (t !== n && n && n.ownerDocument && wr(n.ownerDocument.documentElement, n)) {
			if (r !== null && Er(n)) {
				if (t = r.start, e = r.end, e === void 0 && (e = t), "selectionStart" in n) n.selectionStart = t, n.selectionEnd = Math.min(e, n.value.length);
				else if (e = (t = n.ownerDocument || document) && t.defaultView || window, e.getSelection) {
					e = e.getSelection();
					var i = n.textContent.length, a = Math.min(r.start, i);
					r = r.end === void 0 ? a : Math.min(r.end, i), !e.extend && a > r && (i = r, r = a, a = i), i = Cr(n, a);
					var o = Cr(n, r);
					i && o && (e.rangeCount !== 1 || e.anchorNode !== i.node || e.anchorOffset !== i.offset || e.focusNode !== o.node || e.focusOffset !== o.offset) && (t = t.createRange(), t.setStart(i.node, i.offset), e.removeAllRanges(), a > r ? (e.addRange(t), e.extend(o.node, o.offset)) : (t.setEnd(o.node, o.offset), e.addRange(t)));
				}
			}
			for (t = [], e = n; e = e.parentNode;) e.nodeType === 1 && t.push({
				element: e,
				left: e.scrollLeft,
				top: e.scrollTop
			});
			for (typeof n.focus == "function" && n.focus(), n = 0; n < t.length; n++) e = t[n], e.element.scrollLeft = e.left, e.element.scrollTop = e.top;
		}
	}
	var Or = u && "documentMode" in document && 11 >= document.documentMode, kr = null, Ar = null, jr = null, Mr = !1;
	function Nr(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		Mr || kr == null || kr !== ae(r) || (r = kr, "selectionStart" in r && Er(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), jr && xr(jr, r) || (jr = r, r = ai(Ar, "onSelect"), 0 < r.length && (t = new Sn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = kr)));
	}
	function Pr(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var Fr = {
		animationend: Pr("Animation", "AnimationEnd"),
		animationiteration: Pr("Animation", "AnimationIteration"),
		animationstart: Pr("Animation", "AnimationStart"),
		transitionend: Pr("Transition", "TransitionEnd")
	}, Ir = {}, Lr = {};
	u && (Lr = document.createElement("div").style, "AnimationEvent" in window || (delete Fr.animationend.animation, delete Fr.animationiteration.animation, delete Fr.animationstart.animation), "TransitionEvent" in window || delete Fr.transitionend.transition);
	function Rr(e) {
		if (Ir[e]) return Ir[e];
		if (!Fr[e]) return e;
		var t = Fr[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in Lr) return Ir[e] = t[n];
		return e;
	}
	var zr = Rr("animationend"), Br = Rr("animationiteration"), Vr = Rr("animationstart"), Hr = Rr("transitionend"), Ur = /* @__PURE__ */ new Map(), Wr = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	function Gr(e, t) {
		Ur.set(e, t), c(t, [e]);
	}
	for (var Kr = 0; Kr < Wr.length; Kr++) {
		var qr = Wr[Kr];
		Gr(qr.toLowerCase(), "on" + (qr[0].toUpperCase() + qr.slice(1)));
	}
	Gr(zr, "onAnimationEnd"), Gr(Br, "onAnimationIteration"), Gr(Vr, "onAnimationStart"), Gr("dblclick", "onDoubleClick"), Gr("focusin", "onFocus"), Gr("focusout", "onBlur"), Gr(Hr, "onTransitionEnd"), l("onMouseEnter", ["mouseout", "mouseover"]), l("onMouseLeave", ["mouseout", "mouseover"]), l("onPointerEnter", ["pointerout", "pointerover"]), l("onPointerLeave", ["pointerout", "pointerover"]), c("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), c("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), c("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), c("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), c("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), c("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
	var Jr = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Yr = new Set("cancel close invalid load scroll toggle".split(" ").concat(Jr));
	function Xr(e, t, n) {
		var r = e.type || "unknown-event";
		e.currentTarget = n, Qe(r, t, void 0, e), e.currentTarget = null;
	}
	function Zr(e, t) {
		t = !!(t & 4);
		for (var n = 0; n < e.length; n++) {
			var r = e[n], i = r.event;
			r = r.listeners;
			a: {
				var a = void 0;
				if (t) for (var o = r.length - 1; 0 <= o; o--) {
					var s = r[o], c = s.instance, l = s.currentTarget;
					if (s = s.listener, c !== a && i.isPropagationStopped()) break a;
					Xr(i, s, l), a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					Xr(i, s, l), a = c;
				}
			}
		}
		if (Je) throw e = Ye, Je = !1, Ye = null, e;
	}
	function Qr(e, t) {
		var n = t[Oi];
		n === void 0 && (n = t[Oi] = /* @__PURE__ */ new Set());
		var r = e + "__bubble";
		n.has(r) || (ni(t, e, 2, !1), n.add(r));
	}
	function $r(e, t, n) {
		var r = 0;
		t && (r |= 4), ni(n, e, r, t);
	}
	var ei = "_reactListening" + Math.random().toString(36).slice(2);
	function ti(e) {
		if (!e[ei]) {
			e[ei] = !0, o.forEach(function(t) {
				t !== "selectionchange" && (Yr.has(t) || $r(t, !1, e), $r(t, !0, e));
			});
			var t = e.nodeType === 9 ? e : e.ownerDocument;
			t === null || t[ei] || (t[ei] = !0, $r("selectionchange", !1, t));
		}
	}
	function ni(e, t, n, r) {
		switch (fn(t)) {
			case 1:
				var i = sn;
				break;
			case 4:
				i = cn;
				break;
			default: i = ln;
		}
		n = i.bind(null, t, n, e), i = void 0, !Ue || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
			capture: !0,
			passive: i
		}) : i === void 0 ? e.addEventListener(t, n, !1) : e.addEventListener(t, n, { passive: i });
	}
	function ri(e, t, n, r, i) {
		var a = r;
		if (!(t & 1) && !(t & 2) && r !== null) a: for (;;) {
			if (r === null) return;
			var o = r.tag;
			if (o === 3 || o === 4) {
				var s = r.stateNode.containerInfo;
				if (s === i || s.nodeType === 8 && s.parentNode === i) break;
				if (o === 4) for (o = r.return; o !== null;) {
					var c = o.tag;
					if ((c === 3 || c === 4) && (c = o.stateNode.containerInfo, c === i || c.nodeType === 8 && c.parentNode === i)) return;
					o = o.return;
				}
				for (; s !== null;) {
					if (o = ji(s), o === null) return;
					if (c = o.tag, c === 5 || c === 6) {
						r = a = o;
						continue a;
					}
					s = s.parentNode;
				}
			}
			r = r.return;
		}
		Ve(function() {
			var r = a, i = je(n), o = [];
			a: {
				var s = Ur.get(e);
				if (s !== void 0) {
					var c = Sn, l = e;
					switch (e) {
						case "keypress": if (_n(n) === 0) break a;
						case "keydown":
						case "keyup":
							c = Bn;
							break;
						case "focusin":
							l = "focus", c = jn;
							break;
						case "focusout":
							l = "blur", c = jn;
							break;
						case "beforeblur":
						case "afterblur":
							c = jn;
							break;
						case "click": if (n.button === 2) break a;
						case "auxclick":
						case "dblclick":
						case "mousedown":
						case "mousemove":
						case "mouseup":
						case "mouseout":
						case "mouseover":
						case "contextmenu":
							c = kn;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							c = An;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							c = Hn;
							break;
						case zr:
						case Br:
						case Vr:
							c = Mn;
							break;
						case Hr:
							c = Un;
							break;
						case "scroll":
							c = wn;
							break;
						case "wheel":
							c = Wn;
							break;
						case "copy":
						case "cut":
						case "paste":
							c = Nn;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup": c = Vn;
					}
					var u = !!(t & 4), d = !u && e === "scroll", f = u ? s === null ? null : s + "Capture" : s;
					u = [];
					for (var p = r, m; p !== null;) {
						m = p;
						var h = m.stateNode;
						if (m.tag === 5 && h !== null && (m = h, f !== null && (h = He(p, f), h != null && u.push(ii(p, h, m)))), d) break;
						p = p.return;
					}
					0 < u.length && (s = new c(s, l, null, n, i), o.push({
						event: s,
						listeners: u
					}));
				}
			}
			if (!(t & 7)) {
				a: {
					if (s = e === "mouseover" || e === "pointerover", c = e === "mouseout" || e === "pointerout", s && n !== Ae && (l = n.relatedTarget || n.fromElement) && (ji(l) || l[Di])) break a;
					if ((c || s) && (s = i.window === i ? i : (s = i.ownerDocument) ? s.defaultView || s.parentWindow : window, c ? (l = n.relatedTarget || n.toElement, c = r, l = l ? ji(l) : null, l !== null && (d = q(l), l !== d || l.tag !== 5 && l.tag !== 6) && (l = null)) : (c = null, l = r), c !== l)) {
						if (u = kn, h = "onMouseLeave", f = "onMouseEnter", p = "mouse", (e === "pointerout" || e === "pointerover") && (u = Vn, h = "onPointerLeave", f = "onPointerEnter", p = "pointer"), d = c == null ? s : Ni(c), m = l == null ? s : Ni(l), s = new u(h, p + "leave", c, n, i), s.target = d, s.relatedTarget = m, h = null, ji(i) === r && (u = new u(f, p + "enter", l, n, i), u.target = m, u.relatedTarget = d, h = u), d = h, c && l) b: {
							for (u = c, f = l, p = 0, m = u; m; m = oi(m)) p++;
							for (m = 0, h = f; h; h = oi(h)) m++;
							for (; 0 < p - m;) u = oi(u), p--;
							for (; 0 < m - p;) f = oi(f), m--;
							for (; p--;) {
								if (u === f || f !== null && u === f.alternate) break b;
								u = oi(u), f = oi(f);
							}
							u = null;
						}
						else u = null;
						c !== null && si(o, s, c, u, !1), l !== null && d !== null && si(o, d, l, u, !0);
					}
				}
				a: {
					if (s = r ? Ni(r) : window, c = s.nodeName && s.nodeName.toLowerCase(), c === "select" || c === "input" && s.type === "file") var g = cr;
					else if (nr(s)) if (lr) g = vr;
					else {
						g = gr;
						var _ = hr;
					}
					else (c = s.nodeName) && c.toLowerCase() === "input" && (s.type === "checkbox" || s.type === "radio") && (g = _r);
					if (g &&= g(e, r)) {
						rr(o, g, n, i);
						break a;
					}
					_ && _(e, s, r), e === "focusout" && (_ = s._wrapperState) && _.controlled && s.type === "number" && de(s, "number", s.value);
				}
				switch (_ = r ? Ni(r) : window, e) {
					case "focusin":
						(nr(_) || _.contentEditable === "true") && (kr = _, Ar = r, jr = null);
						break;
					case "focusout":
						jr = Ar = kr = null;
						break;
					case "mousedown":
						Mr = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						Mr = !1, Nr(o, n, i);
						break;
					case "selectionchange": if (Or) break;
					case "keydown":
					case "keyup": Nr(o, n, i);
				}
				var v;
				if (Kn) b: {
					switch (e) {
						case "compositionstart":
							var y = "onCompositionStart";
							break b;
						case "compositionend":
							y = "onCompositionEnd";
							break b;
						case "compositionupdate":
							y = "onCompositionUpdate";
							break b;
					}
					y = void 0;
				}
				else Qn ? Y(e, n) && (y = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (y = "onCompositionStart");
				y && (Yn && n.locale !== "ko" && (Qn || y !== "onCompositionStart" ? y === "onCompositionEnd" && Qn && (v = gn()) : (pn = i, mn = "value" in pn ? pn.value : pn.textContent, Qn = !0)), _ = ai(r, y), 0 < _.length && (y = new Pn(y, e, null, n, i), o.push({
					event: y,
					listeners: _
				}), v ? y.data = v : (v = X(n), v !== null && (y.data = v)))), (v = Jn ? $n(e, n) : er(e, n)) && (r = ai(r, "onBeforeInput"), 0 < r.length && (i = new Pn("onBeforeInput", "beforeinput", null, n, i), o.push({
					event: i,
					listeners: r
				}), i.data = v));
			}
			Zr(o, t);
		});
	}
	function ii(e, t, n) {
		return {
			instance: e,
			listener: t,
			currentTarget: n
		};
	}
	function ai(e, t) {
		for (var n = t + "Capture", r = []; e !== null;) {
			var i = e, a = i.stateNode;
			i.tag === 5 && a !== null && (i = a, a = He(e, n), a != null && r.unshift(ii(e, a, i)), a = He(e, t), a != null && r.push(ii(e, a, i))), e = e.return;
		}
		return r;
	}
	function oi(e) {
		if (e === null) return null;
		do
			e = e.return;
		while (e && e.tag !== 5);
		return e || null;
	}
	function si(e, t, n, r, i) {
		for (var a = t._reactName, o = []; n !== null && n !== r;) {
			var s = n, c = s.alternate, l = s.stateNode;
			if (c !== null && c === r) break;
			s.tag === 5 && l !== null && (s = l, i ? (c = He(n, a), c != null && o.unshift(ii(n, c, s))) : i || (c = He(n, a), c != null && o.push(ii(n, c, s)))), n = n.return;
		}
		o.length !== 0 && e.push({
			event: t,
			listeners: o
		});
	}
	var ci = /\r\n?/g, li = /\u0000|\uFFFD/g;
	function ui(e) {
		return (typeof e == "string" ? e : "" + e).replace(ci, "\n").replace(li, "");
	}
	function di(e, t, n) {
		if (t = ui(t), ui(e) !== t && n) throw Error(a(425));
	}
	function fi() {}
	var pi = null, mi = null;
	function hi(e, t) {
		return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
	}
	var gi = typeof setTimeout == "function" ? setTimeout : void 0, _i = typeof clearTimeout == "function" ? clearTimeout : void 0, vi = typeof Promise == "function" ? Promise : void 0, yi = typeof queueMicrotask == "function" ? queueMicrotask : vi === void 0 ? gi : function(e) {
		return vi.resolve(null).then(e).catch(bi);
	};
	function bi(e) {
		setTimeout(function() {
			throw e;
		});
	}
	function xi(e, t) {
		var n = t, r = 0;
		do {
			var i = n.nextSibling;
			if (e.removeChild(n), i && i.nodeType === 8) if (n = i.data, n === "/$") {
				if (r === 0) {
					e.removeChild(i), rn(t);
					return;
				}
				r--;
			} else n !== "$" && n !== "$?" && n !== "$!" || r++;
			n = i;
		} while (n);
		rn(t);
	}
	function Si(e) {
		for (; e != null; e = e.nextSibling) {
			var t = e.nodeType;
			if (t === 1 || t === 3) break;
			if (t === 8) {
				if (t = e.data, t === "$" || t === "$!" || t === "$?") break;
				if (t === "/$") return null;
			}
		}
		return e;
	}
	function Ci(e) {
		e = e.previousSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "$" || n === "$!" || n === "$?") {
					if (t === 0) return e;
					t--;
				} else n === "/$" && t++;
			}
			e = e.previousSibling;
		}
		return null;
	}
	var wi = Math.random().toString(36).slice(2), Ti = "__reactFiber$" + wi, Ei = "__reactProps$" + wi, Di = "__reactContainer$" + wi, Oi = "__reactEvents$" + wi, ki = "__reactListeners$" + wi, Ai = "__reactHandles$" + wi;
	function ji(e) {
		var t = e[Ti];
		if (t) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[Di] || n[Ti]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = Ci(e); e !== null;) {
					if (n = e[Ti]) return n;
					e = Ci(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function Mi(e) {
		return e = e[Ti] || e[Di], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
	}
	function Ni(e) {
		if (e.tag === 5 || e.tag === 6) return e.stateNode;
		throw Error(a(33));
	}
	function Pi(e) {
		return e[Ei] || null;
	}
	var Fi = [], Ii = -1;
	function Li(e) {
		return { current: e };
	}
	function Z(e) {
		0 > Ii || (e.current = Fi[Ii], Fi[Ii] = null, Ii--);
	}
	function Ri(e, t) {
		Ii++, Fi[Ii] = e.current, e.current = t;
	}
	var zi = {}, Bi = Li(zi), Vi = Li(!1), Hi = zi;
	function Ui(e, t) {
		var n = e.type.contextTypes;
		if (!n) return zi;
		var r = e.stateNode;
		if (r && r.__reactInternalMemoizedUnmaskedChildContext === t) return r.__reactInternalMemoizedMaskedChildContext;
		var i = {}, a;
		for (a in n) i[a] = t[a];
		return r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = i), i;
	}
	function Wi(e) {
		return e = e.childContextTypes, e != null;
	}
	function Gi() {
		Z(Vi), Z(Bi);
	}
	function Ki(e, t, n) {
		if (Bi.current !== zi) throw Error(a(168));
		Ri(Bi, t), Ri(Vi, n);
	}
	function qi(e, t, n) {
		var r = e.stateNode;
		if (t = t.childContextTypes, typeof r.getChildContext != "function") return n;
		for (var i in r = r.getChildContext(), r) if (!(i in t)) throw Error(a(108, te(e) || "Unknown", i));
		return z({}, n, r);
	}
	function Ji(e) {
		return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || zi, Hi = Bi.current, Ri(Bi, e), Ri(Vi, Vi.current), !0;
	}
	function Yi(e, t, n) {
		var r = e.stateNode;
		if (!r) throw Error(a(169));
		n ? (e = qi(e, t, Hi), r.__reactInternalMemoizedMergedChildContext = e, Z(Vi), Z(Bi), Ri(Bi, e)) : Z(Vi), Ri(Vi, n);
	}
	var Xi = null, Zi = !1, Qi = !1;
	function $i(e) {
		Xi === null ? Xi = [e] : Xi.push(e);
	}
	function ea(e) {
		Zi = !0, $i(e);
	}
	function ta() {
		if (!Qi && Xi !== null) {
			Qi = !0;
			var e = 0, t = J;
			try {
				var n = Xi;
				for (J = 1; e < n.length; e++) {
					var r = n[e];
					do
						r = r(!0);
					while (r !== null);
				}
				Xi = null, Zi = !1;
			} catch (t) {
				throw Xi !== null && (Xi = Xi.slice(e + 1)), it(ut, ta), t;
			} finally {
				J = t, Qi = !1;
			}
		}
		return null;
	}
	var na = [], ra = 0, ia = null, aa = 0, oa = [], sa = 0, ca = null, la = 1, ua = "";
	function da(e, t) {
		na[ra++] = aa, na[ra++] = ia, ia = e, aa = t;
	}
	function fa(e, t, n) {
		oa[sa++] = la, oa[sa++] = ua, oa[sa++] = ca, ca = e;
		var r = la;
		e = ua;
		var i = 32 - vt(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - vt(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, la = 1 << 32 - vt(t) + i | n << i | r, ua = a + e;
		} else la = 1 << a | n << i | r, ua = e;
	}
	function pa(e) {
		e.return !== null && (da(e, 1), fa(e, 1, 0));
	}
	function ma(e) {
		for (; e === ia;) ia = na[--ra], na[ra] = null, aa = na[--ra], na[ra] = null;
		for (; e === ca;) ca = oa[--sa], oa[sa] = null, ua = oa[--sa], oa[sa] = null, la = oa[--sa], oa[sa] = null;
	}
	var ha = null, ga = null, _a = !1, va = null;
	function ya(e, t) {
		var n = Kl(5, null, null, 0);
		n.elementType = "DELETED", n.stateNode = t, n.return = e, t = e.deletions, t === null ? (e.deletions = [n], e.flags |= 16) : t.push(n);
	}
	function ba(e, t) {
		switch (e.tag) {
			case 5:
				var n = e.type;
				return t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t !== null && (e.stateNode = t, ha = e, ga = Si(t.firstChild), !0);
			case 6: return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t !== null && (e.stateNode = t, ha = e, ga = null, !0);
			case 13: return t = t.nodeType === 8 ? t : null, t !== null && (n = ca === null ? null : {
				id: la,
				overflow: ua
			}, e.memoizedState = {
				dehydrated: t,
				treeContext: n,
				retryLane: 1073741824
			}, n = Kl(18, null, null, 0), n.stateNode = t, n.return = e, e.child = n, ha = e, ga = null, !0);
			default: return !1;
		}
	}
	function xa(e) {
		return !!(e.mode & 1) && !(e.flags & 128);
	}
	function Sa(e) {
		if (_a) {
			var t = ga;
			if (t) {
				var n = t;
				if (!ba(e, t)) {
					if (xa(e)) throw Error(a(418));
					t = Si(n.nextSibling);
					var r = ha;
					t && ba(e, t) ? ya(r, n) : (e.flags = e.flags & -4097 | 2, _a = !1, ha = e);
				}
			} else {
				if (xa(e)) throw Error(a(418));
				e.flags = e.flags & -4097 | 2, _a = !1, ha = e;
			}
		}
	}
	function Ca(e) {
		for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13;) e = e.return;
		ha = e;
	}
	function wa(e) {
		if (e !== ha) return !1;
		if (!_a) return Ca(e), _a = !0, !1;
		var t;
		if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !hi(e.type, e.memoizedProps)), t &&= ga) {
			if (xa(e)) throw Ta(), Error(a(418));
			for (; t;) ya(e, t), t = Si(t.nextSibling);
		}
		if (Ca(e), e.tag === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(a(317));
			a: {
				for (e = e.nextSibling, t = 0; e;) {
					if (e.nodeType === 8) {
						var n = e.data;
						if (n === "/$") {
							if (t === 0) {
								ga = Si(e.nextSibling);
								break a;
							}
							t--;
						} else n !== "$" && n !== "$!" && n !== "$?" || t++;
					}
					e = e.nextSibling;
				}
				ga = null;
			}
		} else ga = ha ? Si(e.stateNode.nextSibling) : null;
		return !0;
	}
	function Ta() {
		for (var e = ga; e;) e = Si(e.nextSibling);
	}
	function Ea() {
		ga = ha = null, _a = !1;
	}
	function Da(e) {
		va === null ? va = [e] : va.push(e);
	}
	var Oa = C.ReactCurrentBatchConfig;
	function ka(e, t, n) {
		if (e = n.ref, e !== null && typeof e != "function" && typeof e != "object") {
			if (n._owner) {
				if (n = n._owner, n) {
					if (n.tag !== 1) throw Error(a(309));
					var r = n.stateNode;
				}
				if (!r) throw Error(a(147, e));
				var i = r, o = "" + e;
				return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === o ? t.ref : (t = function(e) {
					var t = i.refs;
					e === null ? delete t[o] : t[o] = e;
				}, t._stringRef = o, t);
			}
			if (typeof e != "string") throw Error(a(284));
			if (!n._owner) throw Error(a(290, e));
		}
		return e;
	}
	function Aa(e, t) {
		throw e = Object.prototype.toString.call(t), Error(a(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
	}
	function ja(e) {
		var t = e._init;
		return t(e._payload);
	}
	function Ma(e) {
		function t(t, n) {
			if (e) {
				var r = t.deletions;
				r === null ? (t.deletions = [n], t.flags |= 16) : r.push(n);
			}
		}
		function n(n, r) {
			if (!e) return null;
			for (; r !== null;) t(n, r), r = r.sibling;
			return null;
		}
		function r(e, t) {
			for (e = /* @__PURE__ */ new Map(); t !== null;) t.key === null ? e.set(t.index, t) : e.set(t.key, t), t = t.sibling;
			return e;
		}
		function i(e, t) {
			return e = Yl(e, t), e.index = 0, e.sibling = null, e;
		}
		function o(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 2, n) : (r = r.index, r < n ? (t.flags |= 2, n) : r)) : (t.flags |= 1048576, n);
		}
		function s(t) {
			return e && t.alternate === null && (t.flags |= 2), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = $l(n, e.mode, r), t.return = e, t) : (t = i(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var a = n.type;
			return a === E ? d(e, t, n.props.children, r, n.key) : t !== null && (t.elementType === a || typeof a == "object" && a && a.$$typeof === F && ja(a) === t.type) ? (r = i(t, n.props), r.ref = ka(e, t, n), r.return = e, r) : (r = Xl(n.type, n.key, n.props, null, e.mode, r), r.ref = ka(e, t, n), r.return = e, r);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = eu(n, e.mode, r), t.return = e, t) : (t = i(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, a) {
			return t === null || t.tag !== 7 ? (t = Zl(n, e.mode, r, a), t.return = e, t) : (t = i(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number") return t = $l("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case w: return n = Xl(t.type, t.key, t.props, null, e.mode, n), n.ref = ka(e, null, t), n.return = e, n;
					case T: return t = eu(t, e.mode, n), t.return = e, t;
					case F:
						var r = t._init;
						return f(e, r(t._payload), n);
				}
				if (fe(t) || R(t)) return t = Zl(t, e.mode, n, null), t.return = e, t;
				Aa(e, t);
			}
			return null;
		}
		function p(e, t, n, r) {
			var i = t === null ? null : t.key;
			if (typeof n == "string" && n !== "" || typeof n == "number") return i === null ? c(e, t, "" + n, r) : null;
			if (typeof n == "object" && n) {
				switch (n.$$typeof) {
					case w: return n.key === i ? l(e, t, n, r) : null;
					case T: return n.key === i ? u(e, t, n, r) : null;
					case F: return i = n._init, p(e, t, i(n._payload), r);
				}
				if (fe(n) || R(n)) return i === null ? d(e, t, n, r, null) : null;
				Aa(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case w: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case T: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case F:
						var a = r._init;
						return m(e, t, n, a(r._payload), i);
				}
				if (fe(r) || R(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				Aa(t, r);
			}
			return null;
		}
		function h(i, a, s, c) {
			for (var l = null, u = null, d = a, h = a = 0, g = null; d !== null && h < s.length; h++) {
				d.index > h ? (g = d, d = null) : g = d.sibling;
				var _ = p(i, d, s[h], c);
				if (_ === null) {
					d === null && (d = g);
					break;
				}
				e && d && _.alternate === null && t(i, d), a = o(_, a, h), u === null ? l = _ : u.sibling = _, u = _, d = g;
			}
			if (h === s.length) return n(i, d), _a && da(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
				return _a && da(i, h), l;
			}
			for (d = r(i, d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && g.alternate !== null && d.delete(g.key === null ? h : g.key), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), _a && da(i, h), l;
		}
		function g(i, s, c, l) {
			var u = R(c);
			if (typeof u != "function") throw Error(a(150));
			if (c = u.call(c), c == null) throw Error(a(151));
			for (var d = u = null, h = s, g = s = 0, _ = null, v = c.next(); h !== null && !v.done; g++, v = c.next()) {
				h.index > g ? (_ = h, h = null) : _ = h.sibling;
				var y = p(i, h, v.value, l);
				if (y === null) {
					h === null && (h = _);
					break;
				}
				e && h && y.alternate === null && t(i, h), s = o(y, s, g), d === null ? u = y : d.sibling = y, d = y, h = _;
			}
			if (v.done) return n(i, h), _a && da(i, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(i, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
				return _a && da(i, g), u;
			}
			for (h = r(i, h); !v.done; g++, v = c.next()) v = m(h, i, g, v.value, l), v !== null && (e && v.alternate !== null && h.delete(v.key === null ? g : v.key), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(i, e);
			}), _a && da(i, g), u;
		}
		function _(e, r, a, o) {
			if (typeof a == "object" && a && a.type === E && a.key === null && (a = a.props.children), typeof a == "object" && a) {
				switch (a.$$typeof) {
					case w:
						a: {
							for (var c = a.key, l = r; l !== null;) {
								if (l.key === c) {
									if (c = a.type, c === E) {
										if (l.tag === 7) {
											n(e, l.sibling), r = i(l, a.props.children), r.return = e, e = r;
											break a;
										}
									} else if (l.elementType === c || typeof c == "object" && c && c.$$typeof === F && ja(c) === l.type) {
										n(e, l.sibling), r = i(l, a.props), r.ref = ka(e, l, a), r.return = e, e = r;
										break a;
									}
									n(e, l);
									break;
								}
								t(e, l), l = l.sibling;
							}
							a.type === E ? (r = Zl(a.props.children, e.mode, o, a.key), r.return = e, e = r) : (o = Xl(a.type, a.key, a.props, null, e.mode, o), o.ref = ka(e, r, a), o.return = e, e = o);
						}
						return s(e);
					case T:
						a: {
							for (l = a.key; r !== null;) {
								if (r.key === l) if (r.tag === 4 && r.stateNode.containerInfo === a.containerInfo && r.stateNode.implementation === a.implementation) {
									n(e, r.sibling), r = i(r, a.children || []), r.return = e, e = r;
									break a;
								} else {
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							r = eu(a, e.mode, o), r.return = e, e = r;
						}
						return s(e);
					case F: return l = a._init, _(e, r, l(a._payload), o);
				}
				if (fe(a)) return h(e, r, a, o);
				if (R(a)) return g(e, r, a, o);
				Aa(e, a);
			}
			return typeof a == "string" && a !== "" || typeof a == "number" ? (a = "" + a, r !== null && r.tag === 6 ? (n(e, r.sibling), r = i(r, a), r.return = e, e = r) : (n(e, r), r = $l(a, e.mode, o), r.return = e, e = r), s(e)) : n(e, r);
		}
		return _;
	}
	var Na = Ma(!0), Pa = Ma(!1), Fa = Li(null), Ia = null, La = null, Ra = null;
	function za() {
		Ra = La = Ia = null;
	}
	function Ba(e) {
		var t = Fa.current;
		Z(Fa), e._currentValue = t;
	}
	function Va(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function Ha(e, t) {
		Ia = e, Ra = La = null, e = e.dependencies, e !== null && e.firstContext !== null && ((e.lanes & t) !== 0 && (Ms = !0), e.firstContext = null);
	}
	function Ua(e) {
		var t = e._currentValue;
		if (Ra !== e) if (e = {
			context: e,
			memoizedValue: t,
			next: null
		}, La === null) {
			if (Ia === null) throw Error(a(308));
			La = e, Ia.dependencies = {
				lanes: 0,
				firstContext: e
			};
		} else La = La.next = e;
		return t;
	}
	var Wa = null;
	function Ga(e) {
		Wa === null ? Wa = [e] : Wa.push(e);
	}
	function Ka(e, t, n, r) {
		var i = t.interleaved;
		return i === null ? (n.next = n, Ga(t)) : (n.next = i.next, i.next = n), t.interleaved = n, qa(e, r);
	}
	function qa(e, t) {
		e.lanes |= t;
		var n = e.alternate;
		for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null;) e.childLanes |= t, n = e.alternate, n !== null && (n.childLanes |= t), n = e, e = e.return;
		return n.tag === 3 ? n.stateNode : null;
	}
	var Ja = !1;
	function Ya(e) {
		e.updateQueue = {
			baseState: e.memoizedState,
			firstBaseUpdate: null,
			lastBaseUpdate: null,
			shared: {
				pending: null,
				interleaved: null,
				lanes: 0
			},
			effects: null
		};
	}
	function Xa(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			effects: e.effects
		});
	}
	function Za(e, t) {
		return {
			eventTime: e,
			lane: t,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function Qa(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, $ & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, qa(e, n);
		}
		return i = r.interleaved, i === null ? (t.next = t, Ga(r)) : (t.next = i.next, i.next = t), r.interleaved = t, qa(e, n);
	}
	function $a(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194240)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, Nt(e, n);
		}
	}
	function eo(e, t) {
		var n = e.updateQueue, r = e.alternate;
		if (r !== null && (r = r.updateQueue, n === r)) {
			var i = null, a = null;
			if (n = n.firstBaseUpdate, n !== null) {
				do {
					var o = {
						eventTime: n.eventTime,
						lane: n.lane,
						tag: n.tag,
						payload: n.payload,
						callback: n.callback,
						next: null
					};
					a === null ? i = a = o : a = a.next = o, n = n.next;
				} while (n !== null);
				a === null ? i = a = t : a = a.next = t;
			} else i = a = t;
			n = {
				baseState: r.baseState,
				firstBaseUpdate: i,
				lastBaseUpdate: a,
				shared: r.shared,
				effects: r.effects
			}, e.updateQueue = n;
			return;
		}
		e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
	}
	function to(e, t, n, r) {
		var i = e.updateQueue;
		Ja = !1;
		var a = i.firstBaseUpdate, o = i.lastBaseUpdate, s = i.shared.pending;
		if (s !== null) {
			i.shared.pending = null;
			var c = s, l = c.next;
			c.next = null, o === null ? a = l : o.next = l, o = c;
			var u = e.alternate;
			u !== null && (u = u.updateQueue, s = u.lastBaseUpdate, s !== o && (s === null ? u.firstBaseUpdate = l : s.next = l, u.lastBaseUpdate = c));
		}
		if (a !== null) {
			var d = i.baseState;
			o = 0, u = l = c = null, s = a;
			do {
				var f = s.lane, p = s.eventTime;
				if ((r & f) === f) {
					u !== null && (u = u.next = {
						eventTime: p,
						lane: 0,
						tag: s.tag,
						payload: s.payload,
						callback: s.callback,
						next: null
					});
					a: {
						var m = e, h = s;
						switch (f = t, p = n, h.tag) {
							case 1:
								if (m = h.payload, typeof m == "function") {
									d = m.call(p, d, f);
									break a;
								}
								d = m;
								break a;
							case 3: m.flags = m.flags & -65537 | 128;
							case 0:
								if (m = h.payload, f = typeof m == "function" ? m.call(p, d, f) : m, f == null) break a;
								d = z({}, d, f);
								break a;
							case 2: Ja = !0;
						}
					}
					s.callback !== null && s.lane !== 0 && (e.flags |= 64, f = i.effects, f === null ? i.effects = [s] : f.push(s));
				} else p = {
					eventTime: p,
					lane: f,
					tag: s.tag,
					payload: s.payload,
					callback: s.callback,
					next: null
				}, u === null ? (l = u = p, c = d) : u = u.next = p, o |= f;
				if (s = s.next, s === null) {
					if (s = i.shared.pending, s === null) break;
					f = s, s = f.next, f.next = null, i.lastBaseUpdate = f, i.shared.pending = null;
				}
			} while (1);
			if (u === null && (c = d), i.baseState = c, i.firstBaseUpdate = l, i.lastBaseUpdate = u, t = i.shared.interleaved, t !== null) {
				i = t;
				do
					o |= i.lane, i = i.next;
				while (i !== t);
			} else a === null && (i.shared.lanes = 0);
			Jc |= o, e.lanes = o, e.memoizedState = d;
		}
	}
	function no(e, t, n) {
		if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
			var r = e[t], i = r.callback;
			if (i !== null) {
				if (r.callback = null, r = n, typeof i != "function") throw Error(a(191, i));
				i.call(r);
			}
		}
	}
	var ro = {}, io = Li(ro), ao = Li(ro), oo = Li(ro);
	function so(e) {
		if (e === ro) throw Error(a(174));
		return e;
	}
	function co(e, t) {
		switch (Ri(oo, t), Ri(ao, e), Ri(io, ro), e = t.nodeType, e) {
			case 9:
			case 11:
				t = (t = t.documentElement) ? t.namespaceURI : ye(null, "");
				break;
			default: e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = ye(t, e);
		}
		Z(io), Ri(io, t);
	}
	function lo() {
		Z(io), Z(ao), Z(oo);
	}
	function uo(e) {
		so(oo.current);
		var t = so(io.current), n = ye(t, e.type);
		t !== n && (Ri(ao, e), Ri(io, n));
	}
	function fo(e) {
		ao.current === e && (Z(io), Z(ao));
	}
	var po = Li(0);
	function mo(e) {
		for (var t = e; t !== null;) {
			if (t.tag === 13) {
				var n = t.memoizedState;
				if (n !== null && (n = n.dehydrated, n === null || n.data === "$?" || n.data === "$!")) return t;
			} else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
				if (t.flags & 128) return t;
			} else if (t.child !== null) {
				t.child.return = t, t = t.child;
				continue;
			}
			if (t === e) break;
			for (; t.sibling === null;) {
				if (t.return === null || t.return === e) return null;
				t = t.return;
			}
			t.sibling.return = t.return, t = t.sibling;
		}
		return null;
	}
	var ho = [];
	function go() {
		for (var e = 0; e < ho.length; e++) ho[e]._workInProgressVersionPrimary = null;
		ho.length = 0;
	}
	var _o = C.ReactCurrentDispatcher, vo = C.ReactCurrentBatchConfig, yo = 0, bo = null, xo = null, So = null, Co = !1, wo = !1, To = 0, Eo = 0;
	function Do() {
		throw Error(a(321));
	}
	function Oo(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!br(e[n], t[n])) return !1;
		return !0;
	}
	function ko(e, t, n, r, i, o) {
		if (yo = o, bo = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, _o.current = e === null || e.memoizedState === null ? fs : ps, e = n(r, i), wo) {
			o = 0;
			do {
				if (wo = !1, To = 0, 25 <= o) throw Error(a(301));
				o += 1, So = xo = null, t.updateQueue = null, _o.current = ms, e = n(r, i);
			} while (wo);
		}
		if (_o.current = ds, t = xo !== null && xo.next !== null, yo = 0, So = xo = bo = null, Co = !1, t) throw Error(a(300));
		return e;
	}
	function Ao() {
		var e = To !== 0;
		return To = 0, e;
	}
	function jo() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return So === null ? bo.memoizedState = So = e : So = So.next = e, So;
	}
	function Mo() {
		if (xo === null) {
			var e = bo.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = xo.next;
		var t = So === null ? bo.memoizedState : So.next;
		if (t !== null) So = t, xo = e;
		else {
			if (e === null) throw Error(a(310));
			xo = e, e = {
				memoizedState: xo.memoizedState,
				baseState: xo.baseState,
				baseQueue: xo.baseQueue,
				queue: xo.queue,
				next: null
			}, So === null ? bo.memoizedState = So = e : So = So.next = e;
		}
		return So;
	}
	function No(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function Po(e) {
		var t = Mo(), n = t.queue;
		if (n === null) throw Error(a(311));
		n.lastRenderedReducer = e;
		var r = xo, i = r.baseQueue, o = n.pending;
		if (o !== null) {
			if (i !== null) {
				var s = i.next;
				i.next = o.next, o.next = s;
			}
			r.baseQueue = i = o, n.pending = null;
		}
		if (i !== null) {
			o = i.next, r = r.baseState;
			var c = s = null, l = null, u = o;
			do {
				var d = u.lane;
				if ((yo & d) === d) l !== null && (l = l.next = {
					lane: 0,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}), r = u.hasEagerState ? u.eagerState : e(r, u.action);
				else {
					var f = {
						lane: d,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					};
					l === null ? (c = l = f, s = r) : l = l.next = f, bo.lanes |= d, Jc |= d;
				}
				u = u.next;
			} while (u !== null && u !== o);
			l === null ? s = r : l.next = c, br(r, t.memoizedState) || (Ms = !0), t.memoizedState = r, t.baseState = s, t.baseQueue = l, n.lastRenderedState = r;
		}
		if (e = n.interleaved, e !== null) {
			i = e;
			do
				o = i.lane, bo.lanes |= o, Jc |= o, i = i.next;
			while (i !== e);
		} else i === null && (n.lanes = 0);
		return [t.memoizedState, n.dispatch];
	}
	function Fo(e) {
		var t = Mo(), n = t.queue;
		if (n === null) throw Error(a(311));
		n.lastRenderedReducer = e;
		var r = n.dispatch, i = n.pending, o = t.memoizedState;
		if (i !== null) {
			n.pending = null;
			var s = i = i.next;
			do
				o = e(o, s.action), s = s.next;
			while (s !== i);
			br(o, t.memoizedState) || (Ms = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function Io() {}
	function Lo(e, t) {
		var n = bo, r = Mo(), i = t(), o = !br(r.memoizedState, i);
		if (o && (r.memoizedState = i, Ms = !0), r = r.queue, Yo(Bo.bind(null, n, r, e), [e]), r.getSnapshot !== t || o || So !== null && So.memoizedState.tag & 1) {
			if (n.flags |= 2048, Wo(9, zo.bind(null, n, r, i, t), void 0, null), Vc === null) throw Error(a(349));
			yo & 30 || Ro(n, t, i);
		}
		return i;
	}
	function Ro(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = bo.updateQueue, t === null ? (t = {
			lastEffect: null,
			stores: null
		}, bo.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function zo(e, t, n, r) {
		t.value = n, t.getSnapshot = r, Vo(t) && Ho(e);
	}
	function Bo(e, t, n) {
		return n(function() {
			Vo(t) && Ho(e);
		});
	}
	function Vo(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !br(e, n);
		} catch {
			return !0;
		}
	}
	function Ho(e) {
		var t = qa(e, 1);
		t !== null && ml(t, e, 1, -1);
	}
	function Uo(e) {
		var t = jo();
		return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = {
			pending: null,
			interleaved: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: No,
			lastRenderedState: e
		}, t.queue = e, e = e.dispatch = ss.bind(null, bo, e), [t.memoizedState, e];
	}
	function Wo(e, t, n, r) {
		return e = {
			tag: e,
			create: t,
			destroy: n,
			deps: r,
			next: null
		}, t = bo.updateQueue, t === null ? (t = {
			lastEffect: null,
			stores: null
		}, bo.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e)), e;
	}
	function Go() {
		return Mo().memoizedState;
	}
	function Ko(e, t, n, r) {
		var i = jo();
		bo.flags |= e, i.memoizedState = Wo(1 | t, n, void 0, r === void 0 ? null : r);
	}
	function qo(e, t, n, r) {
		var i = Mo();
		r = r === void 0 ? null : r;
		var a = void 0;
		if (xo !== null) {
			var o = xo.memoizedState;
			if (a = o.destroy, r !== null && Oo(r, o.deps)) {
				i.memoizedState = Wo(t, n, a, r);
				return;
			}
		}
		bo.flags |= e, i.memoizedState = Wo(1 | t, n, a, r);
	}
	function Jo(e, t) {
		return Ko(8390656, 8, e, t);
	}
	function Yo(e, t) {
		return qo(2048, 8, e, t);
	}
	function Xo(e, t) {
		return qo(4, 2, e, t);
	}
	function Zo(e, t) {
		return qo(4, 4, e, t);
	}
	function Qo(e, t) {
		if (typeof t == "function") return e = e(), t(e), function() {
			t(null);
		};
		if (t != null) return e = e(), t.current = e, function() {
			t.current = null;
		};
	}
	function $o(e, t, n) {
		return n = n == null ? null : n.concat([e]), qo(4, 4, Qo.bind(null, t, e), n);
	}
	function es() {}
	function ts(e, t) {
		var n = Mo();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return r !== null && t !== null && Oo(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function ns(e, t) {
		var n = Mo();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return r !== null && t !== null && Oo(t, r[1]) ? r[0] : (e = e(), n.memoizedState = [e, t], e);
	}
	function rs(e, t, n) {
		return yo & 21 ? (br(n, t) || (n = kt(), bo.lanes |= n, Jc |= n, e.baseState = !0), t) : (e.baseState && (e.baseState = !1, Ms = !0), e.memoizedState = n);
	}
	function is(e, t) {
		var n = J;
		J = n !== 0 && 4 > n ? n : 4, e(!0);
		var r = vo.transition;
		vo.transition = {};
		try {
			e(!1), t();
		} finally {
			J = n, vo.transition = r;
		}
	}
	function as() {
		return Mo().memoizedState;
	}
	function os(e, t, n) {
		var r = pl(e);
		if (n = {
			lane: r,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, cs(e)) ls(t, n);
		else if (n = Ka(e, t, n, r), n !== null) {
			var i = fl();
			ml(n, e, r, i), us(n, t, r);
		}
	}
	function ss(e, t, n) {
		var r = pl(e), i = {
			lane: r,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (cs(e)) ls(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, br(s, o)) {
					var c = t.interleaved;
					c === null ? (i.next = i, Ga(t)) : (i.next = c.next, c.next = i), t.interleaved = i;
					return;
				}
			} catch {}
			n = Ka(e, t, i, r), n !== null && (i = fl(), ml(n, e, r, i), us(n, t, r));
		}
	}
	function cs(e) {
		var t = e.alternate;
		return e === bo || t !== null && t === bo;
	}
	function ls(e, t) {
		wo = Co = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function us(e, t, n) {
		if (n & 4194240) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, Nt(e, n);
		}
	}
	var ds = {
		readContext: Ua,
		useCallback: Do,
		useContext: Do,
		useEffect: Do,
		useImperativeHandle: Do,
		useInsertionEffect: Do,
		useLayoutEffect: Do,
		useMemo: Do,
		useReducer: Do,
		useRef: Do,
		useState: Do,
		useDebugValue: Do,
		useDeferredValue: Do,
		useTransition: Do,
		useMutableSource: Do,
		useSyncExternalStore: Do,
		useId: Do,
		unstable_isNewReconciler: !1
	}, fs = {
		readContext: Ua,
		useCallback: function(e, t) {
			return jo().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: Ua,
		useEffect: Jo,
		useImperativeHandle: function(e, t, n) {
			return n = n == null ? null : n.concat([e]), Ko(4194308, 4, Qo.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return Ko(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			return Ko(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = jo();
			return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
		},
		useReducer: function(e, t, n) {
			var r = jo();
			return t = n === void 0 ? t : n(t), r.memoizedState = r.baseState = t, e = {
				pending: null,
				interleaved: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: t
			}, r.queue = e, e = e.dispatch = os.bind(null, bo, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = jo();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: Uo,
		useDebugValue: es,
		useDeferredValue: function(e) {
			return jo().memoizedState = e;
		},
		useTransition: function() {
			var e = Uo(!1), t = e[0];
			return e = is.bind(null, e[1]), jo().memoizedState = e, [t, e];
		},
		useMutableSource: function() {},
		useSyncExternalStore: function(e, t, n) {
			var r = bo, i = jo();
			if (_a) {
				if (n === void 0) throw Error(a(407));
				n = n();
			} else {
				if (n = t(), Vc === null) throw Error(a(349));
				yo & 30 || Ro(r, t, n);
			}
			i.memoizedState = n;
			var o = {
				value: n,
				getSnapshot: t
			};
			return i.queue = o, Jo(Bo.bind(null, r, o, e), [e]), r.flags |= 2048, Wo(9, zo.bind(null, r, o, n, t), void 0, null), n;
		},
		useId: function() {
			var e = jo(), t = Vc.identifierPrefix;
			if (_a) {
				var n = ua, r = la;
				n = (r & ~(1 << 32 - vt(r) - 1)).toString(32) + n, t = ":" + t + "R" + n, n = To++, 0 < n && (t += "H" + n.toString(32)), t += ":";
			} else n = Eo++, t = ":" + t + "r" + n.toString(32) + ":";
			return e.memoizedState = t;
		},
		unstable_isNewReconciler: !1
	}, ps = {
		readContext: Ua,
		useCallback: ts,
		useContext: Ua,
		useEffect: Yo,
		useImperativeHandle: $o,
		useInsertionEffect: Xo,
		useLayoutEffect: Zo,
		useMemo: ns,
		useReducer: Po,
		useRef: Go,
		useState: function() {
			return Po(No);
		},
		useDebugValue: es,
		useDeferredValue: function(e) {
			return rs(Mo(), xo.memoizedState, e);
		},
		useTransition: function() {
			return [Po(No)[0], Mo().memoizedState];
		},
		useMutableSource: Io,
		useSyncExternalStore: Lo,
		useId: as,
		unstable_isNewReconciler: !1
	}, ms = {
		readContext: Ua,
		useCallback: ts,
		useContext: Ua,
		useEffect: Yo,
		useImperativeHandle: $o,
		useInsertionEffect: Xo,
		useLayoutEffect: Zo,
		useMemo: ns,
		useReducer: Fo,
		useRef: Go,
		useState: function() {
			return Fo(No);
		},
		useDebugValue: es,
		useDeferredValue: function(e) {
			var t = Mo();
			return xo === null ? t.memoizedState = e : rs(t, xo.memoizedState, e);
		},
		useTransition: function() {
			return [Fo(No)[0], Mo().memoizedState];
		},
		useMutableSource: Io,
		useSyncExternalStore: Lo,
		useId: as,
		unstable_isNewReconciler: !1
	};
	function hs(e, t) {
		if (e && e.defaultProps) {
			for (var n in t = z({}, t), e = e.defaultProps, e) t[n] === void 0 && (t[n] = e[n]);
			return t;
		}
		return t;
	}
	function gs(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : z({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var _s = {
		isMounted: function(e) {
			return (e = e._reactInternals) ? q(e) === e : !1;
		},
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = fl(), i = pl(e), a = Za(r, i);
			a.payload = t, n != null && (a.callback = n), t = Qa(e, a, i), t !== null && (ml(t, e, i, r), $a(t, e, i));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = fl(), i = pl(e), a = Za(r, i);
			a.tag = 1, a.payload = t, n != null && (a.callback = n), t = Qa(e, a, i), t !== null && (ml(t, e, i, r), $a(t, e, i));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = fl(), r = pl(e), i = Za(n, r);
			i.tag = 2, t != null && (i.callback = t), t = Qa(e, i, r), t !== null && (ml(t, e, r, n), $a(t, e, r));
		}
	};
	function vs(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !xr(n, r) || !xr(i, a) : !0;
	}
	function ys(e, t, n) {
		var r = !1, i = zi, a = t.contextType;
		return typeof a == "object" && a ? a = Ua(a) : (i = Wi(t) ? Hi : Bi.current, r = t.contextTypes, a = (r = r != null) ? Ui(e, i) : zi), t = new t(n, a), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = _s, e.stateNode = t, t._reactInternals = e, r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = i, e.__reactInternalMemoizedMaskedChildContext = a), t;
	}
	function bs(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && _s.enqueueReplaceState(t, t.state, null);
	}
	function xs(e, t, n, r) {
		var i = e.stateNode;
		i.props = n, i.state = e.memoizedState, i.refs = {}, Ya(e);
		var a = t.contextType;
		typeof a == "object" && a ? i.context = Ua(a) : (a = Wi(t) ? Hi : Bi.current, i.context = Ui(e, a)), i.state = e.memoizedState, a = t.getDerivedStateFromProps, typeof a == "function" && (gs(e, t, a, n), i.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof i.getSnapshotBeforeUpdate == "function" || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (t = i.state, typeof i.componentWillMount == "function" && i.componentWillMount(), typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount(), t !== i.state && _s.enqueueReplaceState(i, i.state, null), to(e, n, i, r), i.state = e.memoizedState), typeof i.componentDidMount == "function" && (e.flags |= 4194308);
	}
	function Ss(e, t) {
		try {
			var n = "", r = t;
			do
				n += U(r), r = r.return;
			while (r);
			var i = n;
		} catch (e) {
			i = "\nError generating stack: " + e.message + "\n" + e.stack;
		}
		return {
			value: e,
			source: t,
			stack: i,
			digest: null
		};
	}
	function Cs(e, t, n) {
		return {
			value: e,
			source: null,
			stack: n ?? null,
			digest: t ?? null
		};
	}
	function ws(e, t) {
		try {
			console.error(t.value);
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	var Ts = typeof WeakMap == "function" ? WeakMap : Map;
	function Es(e, t, n) {
		n = Za(-1, n), n.tag = 3, n.payload = { element: null };
		var r = t.value;
		return n.callback = function() {
			nl || (nl = !0, rl = r), ws(e, t);
		}, n;
	}
	function Ds(e, t, n) {
		n = Za(-1, n), n.tag = 3;
		var r = e.type.getDerivedStateFromError;
		if (typeof r == "function") {
			var i = t.value;
			n.payload = function() {
				return r(i);
			}, n.callback = function() {
				ws(e, t);
			};
		}
		var a = e.stateNode;
		return a !== null && typeof a.componentDidCatch == "function" && (n.callback = function() {
			ws(e, t), typeof r != "function" && (il === null ? il = /* @__PURE__ */ new Set([this]) : il.add(this));
			var n = t.stack;
			this.componentDidCatch(t.value, { componentStack: n === null ? "" : n });
		}), n;
	}
	function Os(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new Ts();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (i.add(n), e = zl.bind(null, e, t, n), t.then(e, e));
	}
	function ks(e) {
		do {
			var t;
			if ((t = e.tag === 13) && (t = e.memoizedState, t = t === null || t.dehydrated !== null), t) return e;
			e = e.return;
		} while (e !== null);
		return null;
	}
	function As(e, t, n, r, i) {
		return e.mode & 1 ? (e.flags |= 65536, e.lanes = i, e) : (e === t ? e.flags |= 65536 : (e.flags |= 128, n.flags |= 131072, n.flags &= -52805, n.tag === 1 && (n.alternate === null ? n.tag = 17 : (t = Za(-1, 1), t.tag = 2, Qa(n, t, 1))), n.lanes |= 1), e);
	}
	var js = C.ReactCurrentOwner, Ms = !1;
	function Ns(e, t, n, r) {
		t.child = e === null ? Pa(t, null, n, r) : Na(t, e.child, n, r);
	}
	function Ps(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		return Ha(t, i), r = ko(e, t, n, r, a, i), n = Ao(), e !== null && !Ms ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~i, ec(e, t, i)) : (_a && n && pa(t), t.flags |= 1, Ns(e, t, r, i), t.child);
	}
	function Fs(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !ql(a) && a.defaultProps === void 0 && n.compare === null && n.defaultProps === void 0 ? (t.tag = 15, t.type = a, Is(e, t, a, r, i)) : (e = Xl(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, (e.lanes & i) === 0) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? xr : n, n(o, r) && e.ref === t.ref) return ec(e, t, i);
		}
		return t.flags |= 1, e = Yl(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function Is(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (xr(a, r) && e.ref === t.ref) if (Ms = !1, t.pendingProps = r = a, (e.lanes & i) !== 0) e.flags & 131072 && (Ms = !0);
			else return t.lanes = e.lanes, ec(e, t, i);
		}
		return zs(e, t, n, r, i);
	}
	function Ls(e, t, n) {
		var r = t.pendingProps, i = r.children, a = e === null ? null : e.memoizedState;
		if (r.mode === "hidden") if (!(t.mode & 1)) t.memoizedState = {
			baseLanes: 0,
			cachePool: null,
			transitions: null
		}, Ri(Gc, Wc), Wc |= n;
		else {
			if (!(n & 1073741824)) return e = a === null ? n : a.baseLanes | n, t.lanes = t.childLanes = 1073741824, t.memoizedState = {
				baseLanes: e,
				cachePool: null,
				transitions: null
			}, t.updateQueue = null, Ri(Gc, Wc), Wc |= e, null;
			t.memoizedState = {
				baseLanes: 0,
				cachePool: null,
				transitions: null
			}, r = a === null ? n : a.baseLanes, Ri(Gc, Wc), Wc |= r;
		}
		else a === null ? r = n : (r = a.baseLanes | n, t.memoizedState = null), Ri(Gc, Wc), Wc |= r;
		return Ns(e, t, i, n), t.child;
	}
	function Rs(e, t) {
		var n = t.ref;
		(e === null && n !== null || e !== null && e.ref !== n) && (t.flags |= 512, t.flags |= 2097152);
	}
	function zs(e, t, n, r, i) {
		var a = Wi(n) ? Hi : Bi.current;
		return a = Ui(t, a), Ha(t, i), n = ko(e, t, n, r, a, i), r = Ao(), e !== null && !Ms ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~i, ec(e, t, i)) : (_a && r && pa(t), t.flags |= 1, Ns(e, t, n, i), t.child);
	}
	function Bs(e, t, n, r, i) {
		if (Wi(n)) {
			var a = !0;
			Ji(t);
		} else a = !1;
		if (Ha(t, i), t.stateNode === null) $s(e, t), ys(t, n, r), xs(t, n, r, i), r = !0;
		else if (e === null) {
			var o = t.stateNode, s = t.memoizedProps;
			o.props = s;
			var c = o.context, l = n.contextType;
			typeof l == "object" && l ? l = Ua(l) : (l = Wi(n) ? Hi : Bi.current, l = Ui(t, l));
			var u = n.getDerivedStateFromProps, d = typeof u == "function" || typeof o.getSnapshotBeforeUpdate == "function";
			d || typeof o.UNSAFE_componentWillReceiveProps != "function" && typeof o.componentWillReceiveProps != "function" || (s !== r || c !== l) && bs(t, o, r, l), Ja = !1;
			var f = t.memoizedState;
			o.state = f, to(t, r, o, i), c = t.memoizedState, s !== r || f !== c || Vi.current || Ja ? (typeof u == "function" && (gs(t, n, u, r), c = t.memoizedState), (s = Ja || vs(t, n, s, r, f, c, l)) ? (d || typeof o.UNSAFE_componentWillMount != "function" && typeof o.componentWillMount != "function" || (typeof o.componentWillMount == "function" && o.componentWillMount(), typeof o.UNSAFE_componentWillMount == "function" && o.UNSAFE_componentWillMount()), typeof o.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof o.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = c), o.props = r, o.state = c, o.context = l, r = s) : (typeof o.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			o = t.stateNode, Xa(e, t), s = t.memoizedProps, l = t.type === t.elementType ? s : hs(t.type, s), o.props = l, d = t.pendingProps, f = o.context, c = n.contextType, typeof c == "object" && c ? c = Ua(c) : (c = Wi(n) ? Hi : Bi.current, c = Ui(t, c));
			var p = n.getDerivedStateFromProps;
			(u = typeof p == "function" || typeof o.getSnapshotBeforeUpdate == "function") || typeof o.UNSAFE_componentWillReceiveProps != "function" && typeof o.componentWillReceiveProps != "function" || (s !== d || f !== c) && bs(t, o, r, c), Ja = !1, f = t.memoizedState, o.state = f, to(t, r, o, i);
			var m = t.memoizedState;
			s !== d || f !== m || Vi.current || Ja ? (typeof p == "function" && (gs(t, n, p, r), m = t.memoizedState), (l = Ja || vs(t, n, l, r, f, m, c) || !1) ? (u || typeof o.UNSAFE_componentWillUpdate != "function" && typeof o.componentWillUpdate != "function" || (typeof o.componentWillUpdate == "function" && o.componentWillUpdate(r, m, c), typeof o.UNSAFE_componentWillUpdate == "function" && o.UNSAFE_componentWillUpdate(r, m, c)), typeof o.componentDidUpdate == "function" && (t.flags |= 4), typeof o.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof o.componentDidUpdate != "function" || s === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof o.getSnapshotBeforeUpdate != "function" || s === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = m), o.props = r, o.state = m, o.context = c, r = l) : (typeof o.componentDidUpdate != "function" || s === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof o.getSnapshotBeforeUpdate != "function" || s === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return Vs(e, t, n, r, a, i);
	}
	function Vs(e, t, n, r, i, a) {
		Rs(e, t);
		var o = !!(t.flags & 128);
		if (!r && !o) return i && Yi(t, n, !1), ec(e, t, a);
		r = t.stateNode, js.current = t;
		var s = o && typeof n.getDerivedStateFromError != "function" ? null : r.render();
		return t.flags |= 1, e !== null && o ? (t.child = Na(t, e.child, null, a), t.child = Na(t, null, s, a)) : Ns(e, t, s, a), t.memoizedState = r.state, i && Yi(t, n, !0), t.child;
	}
	function Hs(e) {
		var t = e.stateNode;
		t.pendingContext ? Ki(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Ki(e, t.context, !1), co(e, t.containerInfo);
	}
	function Us(e, t, n, r, i) {
		return Ea(), Da(i), t.flags |= 256, Ns(e, t, n, r), t.child;
	}
	var Ws = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0
	};
	function Gs(e) {
		return {
			baseLanes: e,
			cachePool: null,
			transitions: null
		};
	}
	function Ks(e, t, n) {
		var r = t.pendingProps, i = po.current, a = !1, o = !!(t.flags & 128), s;
		if ((s = o) || (s = e !== null && e.memoizedState === null ? !1 : !!(i & 2)), s ? (a = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (i |= 1), Ri(po, i & 1), e === null) return Sa(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? (t.lanes = t.mode & 1 ? e.data === "$!" ? 8 : 1073741824 : 1, null) : (o = r.children, e = r.fallback, a ? (r = t.mode, a = t.child, o = {
			mode: "hidden",
			children: o
		}, !(r & 1) && a !== null ? (a.childLanes = 0, a.pendingProps = o) : a = Ql(o, r, 0, null), e = Zl(e, r, n, null), a.return = t, e.return = t, a.sibling = e, t.child = a, t.child.memoizedState = Gs(n), t.memoizedState = Ws, e) : qs(t, o));
		if (i = e.memoizedState, i !== null && (s = i.dehydrated, s !== null)) return Ys(e, t, o, r, s, i, n);
		if (a) {
			a = r.fallback, o = t.mode, i = e.child, s = i.sibling;
			var c = {
				mode: "hidden",
				children: r.children
			};
			return !(o & 1) && t.child !== i ? (r = t.child, r.childLanes = 0, r.pendingProps = c, t.deletions = null) : (r = Yl(i, c), r.subtreeFlags = i.subtreeFlags & 14680064), s === null ? (a = Zl(a, o, n, null), a.flags |= 2) : a = Yl(s, a), a.return = t, r.return = t, r.sibling = a, t.child = r, r = a, a = t.child, o = e.child.memoizedState, o = o === null ? Gs(n) : {
				baseLanes: o.baseLanes | n,
				cachePool: null,
				transitions: o.transitions
			}, a.memoizedState = o, a.childLanes = e.childLanes & ~n, t.memoizedState = Ws, r;
		}
		return a = e.child, e = a.sibling, r = Yl(a, {
			mode: "visible",
			children: r.children
		}), !(t.mode & 1) && (r.lanes = n), r.return = t, r.sibling = null, e !== null && (n = t.deletions, n === null ? (t.deletions = [e], t.flags |= 16) : n.push(e)), t.child = r, t.memoizedState = null, r;
	}
	function qs(e, t) {
		return t = Ql({
			mode: "visible",
			children: t
		}, e.mode, 0, null), t.return = e, e.child = t;
	}
	function Js(e, t, n, r) {
		return r !== null && Da(r), Na(t, e.child, null, n), e = qs(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function Ys(e, t, n, r, i, o, s) {
		if (n) return t.flags & 256 ? (t.flags &= -257, r = Cs(Error(a(422))), Js(e, t, s, r)) : t.memoizedState === null ? (o = r.fallback, i = t.mode, r = Ql({
			mode: "visible",
			children: r.children
		}, i, 0, null), o = Zl(o, i, s, null), o.flags |= 2, r.return = t, o.return = t, r.sibling = o, t.child = r, t.mode & 1 && Na(t, e.child, null, s), t.child.memoizedState = Gs(s), t.memoizedState = Ws, o) : (t.child = e.child, t.flags |= 128, null);
		if (!(t.mode & 1)) return Js(e, t, s, null);
		if (i.data === "$!") {
			if (r = i.nextSibling && i.nextSibling.dataset, r) var c = r.dgst;
			return r = c, o = Error(a(419)), r = Cs(o, r, void 0), Js(e, t, s, r);
		}
		if (c = (s & e.childLanes) !== 0, Ms || c) {
			if (r = Vc, r !== null) {
				switch (s & -s) {
					case 4:
						i = 2;
						break;
					case 16:
						i = 8;
						break;
					case 64:
					case 128:
					case 256:
					case 512:
					case 1024:
					case 2048:
					case 4096:
					case 8192:
					case 16384:
					case 32768:
					case 65536:
					case 131072:
					case 262144:
					case 524288:
					case 1048576:
					case 2097152:
					case 4194304:
					case 8388608:
					case 16777216:
					case 33554432:
					case 67108864:
						i = 32;
						break;
					case 536870912:
						i = 268435456;
						break;
					default: i = 0;
				}
				i = (i & (r.suspendedLanes | s)) === 0 ? i : 0, i !== 0 && i !== o.retryLane && (o.retryLane = i, qa(e, i), ml(r, e, i, -1));
			}
			return Ol(), r = Cs(Error(a(421))), Js(e, t, s, r);
		}
		return i.data === "$?" ? (t.flags |= 128, t.child = e.child, t = Vl.bind(null, e), i._reactRetry = t, null) : (e = o.treeContext, ga = Si(i.nextSibling), ha = t, _a = !0, va = null, e !== null && (oa[sa++] = la, oa[sa++] = ua, oa[sa++] = ca, la = e.id, ua = e.overflow, ca = t), t = qs(t, r.children), t.flags |= 4096, t);
	}
	function Xs(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), Va(e.return, t, n);
	}
	function Zs(e, t, n, r, i) {
		var a = e.memoizedState;
		a === null ? e.memoizedState = {
			isBackwards: t,
			rendering: null,
			renderingStartTime: 0,
			last: r,
			tail: n,
			tailMode: i
		} : (a.isBackwards = t, a.rendering = null, a.renderingStartTime = 0, a.last = r, a.tail = n, a.tailMode = i);
	}
	function Qs(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		if (Ns(e, t, r.children, n), r = po.current, r & 2) r = r & 1 | 2, t.flags |= 128;
		else {
			if (e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
				if (e.tag === 13) e.memoizedState !== null && Xs(e, n, t);
				else if (e.tag === 19) Xs(e, n, t);
				else if (e.child !== null) {
					e.child.return = e, e = e.child;
					continue;
				}
				if (e === t) break a;
				for (; e.sibling === null;) {
					if (e.return === null || e.return === t) break a;
					e = e.return;
				}
				e.sibling.return = e.return, e = e.sibling;
			}
			r &= 1;
		}
		if (Ri(po, r), !(t.mode & 1)) t.memoizedState = null;
		else switch (i) {
			case "forwards":
				for (n = t.child, i = null; n !== null;) e = n.alternate, e !== null && mo(e) === null && (i = n), n = n.sibling;
				n = i, n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), Zs(t, !1, i, n, a);
				break;
			case "backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && mo(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				Zs(t, !0, n, null, a);
				break;
			case "together":
				Zs(t, !1, null, null, void 0);
				break;
			default: t.memoizedState = null;
		}
		return t.child;
	}
	function $s(e, t) {
		!(t.mode & 1) && e !== null && (e.alternate = null, t.alternate = null, t.flags |= 2);
	}
	function ec(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), Jc |= t.lanes, (n & t.childLanes) === 0) return null;
		if (e !== null && t.child !== e.child) throw Error(a(153));
		if (t.child !== null) {
			for (e = t.child, n = Yl(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = Yl(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function tc(e, t, n) {
		switch (t.tag) {
			case 3:
				Hs(t), Ea();
				break;
			case 5:
				uo(t);
				break;
			case 1:
				Wi(t.type) && Ji(t);
				break;
			case 4:
				co(t, t.stateNode.containerInfo);
				break;
			case 10:
				var r = t.type._context, i = t.memoizedProps.value;
				Ri(Fa, r._currentValue), r._currentValue = i;
				break;
			case 13:
				if (r = t.memoizedState, r !== null) return r.dehydrated === null ? (n & t.child.childLanes) === 0 ? (Ri(po, po.current & 1), e = ec(e, t, n), e === null ? null : e.sibling) : Ks(e, t, n) : (Ri(po, po.current & 1), t.flags |= 128, null);
				Ri(po, po.current & 1);
				break;
			case 19:
				if (r = (n & t.childLanes) !== 0, e.flags & 128) {
					if (r) return Qs(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), Ri(po, po.current), r) break;
				return null;
			case 22:
			case 23: return t.lanes = 0, Ls(e, t, n);
		}
		return ec(e, t, n);
	}
	var nc = function(e, t) {
		for (var n = t.child; n !== null;) {
			if (n.tag === 5 || n.tag === 6) e.appendChild(n.stateNode);
			else if (n.tag !== 4 && n.child !== null) {
				n.child.return = n, n = n.child;
				continue;
			}
			if (n === t) break;
			for (; n.sibling === null;) {
				if (n.return === null || n.return === t) return;
				n = n.return;
			}
			n.sibling.return = n.return, n = n.sibling;
		}
	}, rc = function(e, t, n, r) {
		var i = e.memoizedProps;
		if (i !== r) {
			e = t.stateNode, so(io.current);
			var a = null;
			switch (n) {
				case "input":
					i = oe(e, i), r = oe(e, r), a = [];
					break;
				case "select":
					i = z({}, i, { value: void 0 }), r = z({}, r, { value: void 0 }), a = [];
					break;
				case "textarea":
					i = me(e, i), r = me(e, r), a = [];
					break;
				default: typeof i.onClick != "function" && typeof r.onClick == "function" && (e.onclick = fi);
			}
			Oe(n, r);
			var o;
			for (u in n = null, i) if (!r.hasOwnProperty(u) && i.hasOwnProperty(u) && i[u] != null) if (u === "style") {
				var c = i[u];
				for (o in c) c.hasOwnProperty(o) && (n ||= {}, n[o] = "");
			} else u !== "dangerouslySetInnerHTML" && u !== "children" && u !== "suppressContentEditableWarning" && u !== "suppressHydrationWarning" && u !== "autoFocus" && (s.hasOwnProperty(u) ? a ||= [] : (a ||= []).push(u, null));
			for (u in r) {
				var l = r[u];
				if (c = i?.[u], r.hasOwnProperty(u) && l !== c && (l != null || c != null)) if (u === "style") if (c) {
					for (o in c) !c.hasOwnProperty(o) || l && l.hasOwnProperty(o) || (n ||= {}, n[o] = "");
					for (o in l) l.hasOwnProperty(o) && c[o] !== l[o] && (n ||= {}, n[o] = l[o]);
				} else n || (a ||= [], a.push(u, n)), n = l;
				else u === "dangerouslySetInnerHTML" ? (l = l ? l.__html : void 0, c = c ? c.__html : void 0, l != null && c !== l && (a ||= []).push(u, l)) : u === "children" ? typeof l != "string" && typeof l != "number" || (a ||= []).push(u, "" + l) : u !== "suppressContentEditableWarning" && u !== "suppressHydrationWarning" && (s.hasOwnProperty(u) ? (l != null && u === "onScroll" && Qr("scroll", e), a || c === l || (a = [])) : (a ||= []).push(u, l));
			}
			n && (a ||= []).push("style", n);
			var u = a;
			(t.updateQueue = u) && (t.flags |= 4);
		}
	}, ic = function(e, t, n, r) {
		n !== r && (t.flags |= 4);
	};
	function ac(e, t) {
		if (!_a) switch (e.tailMode) {
			case "hidden":
				t = e.tail;
				for (var n = null; t !== null;) t.alternate !== null && (n = t), t = t.sibling;
				n === null ? e.tail = null : n.sibling = null;
				break;
			case "collapsed":
				n = e.tail;
				for (var r = null; n !== null;) n.alternate !== null && (r = n), n = n.sibling;
				r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
		}
	}
	function oc(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 14680064, r |= i.flags & 14680064, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function sc(e, t, n) {
		var r = t.pendingProps;
		switch (ma(t), t.tag) {
			case 2:
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return oc(t), null;
			case 1: return Wi(t.type) && Gi(), oc(t), null;
			case 3: return r = t.stateNode, lo(), Z(Vi), Z(Bi), go(), r.pendingContext && (r.context = r.pendingContext, r.pendingContext = null), (e === null || e.child === null) && (wa(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, va !== null && (vl(va), va = null))), oc(t), null;
			case 5:
				fo(t);
				var i = so(oo.current);
				if (n = t.type, e !== null && t.stateNode != null) rc(e, t, n, r, i), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(a(166));
						return oc(t), null;
					}
					if (e = so(io.current), wa(t)) {
						r = t.stateNode, n = t.type;
						var o = t.memoizedProps;
						switch (r[Ti] = t, r[Ei] = o, e = !!(t.mode & 1), n) {
							case "dialog":
								Qr("cancel", r), Qr("close", r);
								break;
							case "iframe":
							case "object":
							case "embed":
								Qr("load", r);
								break;
							case "video":
							case "audio":
								for (i = 0; i < Jr.length; i++) Qr(Jr[i], r);
								break;
							case "source":
								Qr("error", r);
								break;
							case "img":
							case "image":
							case "link":
								Qr("error", r), Qr("load", r);
								break;
							case "details":
								Qr("toggle", r);
								break;
							case "input":
								se(r, o), Qr("invalid", r);
								break;
							case "select":
								r._wrapperState = { wasMultiple: !!o.multiple }, Qr("invalid", r);
								break;
							case "textarea": he(r, o), Qr("invalid", r);
						}
						for (var c in Oe(n, o), i = null, o) if (o.hasOwnProperty(c)) {
							var l = o[c];
							c === "children" ? typeof l == "string" ? r.textContent !== l && (!0 !== o.suppressHydrationWarning && di(r.textContent, l, e), i = ["children", l]) : typeof l == "number" && r.textContent !== "" + l && (!0 !== o.suppressHydrationWarning && di(r.textContent, l, e), i = ["children", "" + l]) : s.hasOwnProperty(c) && l != null && c === "onScroll" && Qr("scroll", r);
						}
						switch (n) {
							case "input":
								re(r), ue(r, o, !0);
								break;
							case "textarea":
								re(r), _e(r);
								break;
							case "select":
							case "option": break;
							default: typeof o.onClick == "function" && (r.onclick = fi);
						}
						r = i, t.updateQueue = r, r !== null && (t.flags |= 4);
					} else {
						c = i.nodeType === 9 ? i : i.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = ve(n)), e === "http://www.w3.org/1999/xhtml" ? n === "script" ? (e = c.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof r.is == "string" ? e = c.createElement(n, { is: r.is }) : (e = c.createElement(n), n === "select" && (c = e, r.multiple ? c.multiple = !0 : r.size && (c.size = r.size))) : e = c.createElementNS(e, n), e[Ti] = t, e[Ei] = r, nc(e, t, !1, !1), t.stateNode = e;
						a: {
							switch (c = ke(n, r), n) {
								case "dialog":
									Qr("cancel", e), Qr("close", e), i = r;
									break;
								case "iframe":
								case "object":
								case "embed":
									Qr("load", e), i = r;
									break;
								case "video":
								case "audio":
									for (i = 0; i < Jr.length; i++) Qr(Jr[i], e);
									i = r;
									break;
								case "source":
									Qr("error", e), i = r;
									break;
								case "img":
								case "image":
								case "link":
									Qr("error", e), Qr("load", e), i = r;
									break;
								case "details":
									Qr("toggle", e), i = r;
									break;
								case "input":
									se(e, r), i = oe(e, r), Qr("invalid", e);
									break;
								case "option":
									i = r;
									break;
								case "select":
									e._wrapperState = { wasMultiple: !!r.multiple }, i = z({}, r, { value: void 0 }), Qr("invalid", e);
									break;
								case "textarea":
									he(e, r), i = me(e, r), Qr("invalid", e);
									break;
								default: i = r;
							}
							for (o in Oe(n, i), l = i, l) if (l.hasOwnProperty(o)) {
								var u = l[o];
								o === "style" ? Ee(e, u) : o === "dangerouslySetInnerHTML" ? (u = u ? u.__html : void 0, u != null && xe(e, u)) : o === "children" ? typeof u == "string" ? (n !== "textarea" || u !== "") && Se(e, u) : typeof u == "number" && Se(e, "" + u) : o !== "suppressContentEditableWarning" && o !== "suppressHydrationWarning" && o !== "autoFocus" && (s.hasOwnProperty(o) ? u != null && o === "onScroll" && Qr("scroll", e) : u != null && S(e, o, u, c));
							}
							switch (n) {
								case "input":
									re(e), ue(e, r, !1);
									break;
								case "textarea":
									re(e), _e(e);
									break;
								case "option":
									r.value != null && e.setAttribute("value", "" + ne(r.value));
									break;
								case "select":
									e.multiple = !!r.multiple, o = r.value, o == null ? r.defaultValue != null && pe(e, !!r.multiple, r.defaultValue, !0) : pe(e, !!r.multiple, o, !1);
									break;
								default: typeof i.onClick == "function" && (e.onclick = fi);
							}
							switch (n) {
								case "button":
								case "input":
								case "select":
								case "textarea":
									r = !!r.autoFocus;
									break a;
								case "img":
									r = !0;
									break a;
								default: r = !1;
							}
						}
						r && (t.flags |= 4);
					}
					t.ref !== null && (t.flags |= 512, t.flags |= 2097152);
				}
				return oc(t), null;
			case 6:
				if (e && t.stateNode != null) ic(e, t, e.memoizedProps, r);
				else {
					if (typeof r != "string" && t.stateNode === null) throw Error(a(166));
					if (n = so(oo.current), so(io.current), wa(t)) {
						if (r = t.stateNode, n = t.memoizedProps, r[Ti] = t, (o = r.nodeValue !== n) && (e = ha, e !== null)) switch (e.tag) {
							case 3:
								di(r.nodeValue, n, !!(e.mode & 1));
								break;
							case 5: !0 !== e.memoizedProps.suppressHydrationWarning && di(r.nodeValue, n, !!(e.mode & 1));
						}
						o && (t.flags |= 4);
					} else r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r), r[Ti] = t, t.stateNode = r;
				}
				return oc(t), null;
			case 13:
				if (Z(po), r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (_a && ga !== null && t.mode & 1 && !(t.flags & 128)) Ta(), Ea(), t.flags |= 98560, o = !1;
					else if (o = wa(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!o) throw Error(a(318));
							if (o = t.memoizedState, o = o === null ? null : o.dehydrated, !o) throw Error(a(317));
							o[Ti] = t;
						} else Ea(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						oc(t), o = !1;
					} else va !== null && (vl(va), va = null), o = !0;
					if (!o) return t.flags & 65536 ? t : null;
				}
				return t.flags & 128 ? (t.lanes = n, t) : (r = r !== null, r !== (e !== null && e.memoizedState !== null) && r && (t.child.flags |= 8192, t.mode & 1 && (e === null || po.current & 1 ? Kc === 0 && (Kc = 3) : Ol())), t.updateQueue !== null && (t.flags |= 4), oc(t), null);
			case 4: return lo(), e === null && ti(t.stateNode.containerInfo), oc(t), null;
			case 10: return Ba(t.type._context), oc(t), null;
			case 17: return Wi(t.type) && Gi(), oc(t), null;
			case 19:
				if (Z(po), o = t.memoizedState, o === null) return oc(t), null;
				if (r = !!(t.flags & 128), c = o.rendering, c === null) if (r) ac(o, !1);
				else {
					if (Kc !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
						if (c = mo(e), c !== null) {
							for (t.flags |= 128, ac(o, !1), r = c.updateQueue, r !== null && (t.updateQueue = r, t.flags |= 4), t.subtreeFlags = 0, r = n, n = t.child; n !== null;) o = n, e = r, o.flags &= 14680066, c = o.alternate, c === null ? (o.childLanes = 0, o.lanes = e, o.child = null, o.subtreeFlags = 0, o.memoizedProps = null, o.memoizedState = null, o.updateQueue = null, o.dependencies = null, o.stateNode = null) : (o.childLanes = c.childLanes, o.lanes = c.lanes, o.child = c.child, o.subtreeFlags = 0, o.deletions = null, o.memoizedProps = c.memoizedProps, o.memoizedState = c.memoizedState, o.updateQueue = c.updateQueue, o.type = c.type, e = c.dependencies, o.dependencies = e === null ? null : {
								lanes: e.lanes,
								firstContext: e.firstContext
							}), n = n.sibling;
							return Ri(po, po.current & 1 | 2), t.child;
						}
						e = e.sibling;
					}
					o.tail !== null && ct() > el && (t.flags |= 128, r = !0, ac(o, !1), t.lanes = 4194304);
				}
				else {
					if (!r) if (e = mo(c), e !== null) {
						if (t.flags |= 128, r = !0, n = e.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), ac(o, !0), o.tail === null && o.tailMode === "hidden" && !c.alternate && !_a) return oc(t), null;
					} else 2 * ct() - o.renderingStartTime > el && n !== 1073741824 && (t.flags |= 128, r = !0, ac(o, !1), t.lanes = 4194304);
					o.isBackwards ? (c.sibling = t.child, t.child = c) : (n = o.last, n === null ? t.child = c : n.sibling = c, o.last = c);
				}
				return o.tail === null ? (oc(t), null) : (t = o.tail, o.rendering = t, o.tail = t.sibling, o.renderingStartTime = ct(), t.sibling = null, n = po.current, Ri(po, r ? n & 1 | 2 : n & 1), t);
			case 22:
			case 23: return wl(), r = t.memoizedState !== null, e !== null && e.memoizedState !== null !== r && (t.flags |= 8192), r && t.mode & 1 ? Wc & 1073741824 && (oc(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : oc(t), null;
			case 24: return null;
			case 25: return null;
		}
		throw Error(a(156, t.tag));
	}
	function cc(e, t) {
		switch (ma(t), t.tag) {
			case 1: return Wi(t.type) && Gi(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return lo(), Z(Vi), Z(Bi), go(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 5: return fo(t), null;
			case 13:
				if (Z(po), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(a(340));
					Ea();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return Z(po), null;
			case 4: return lo(), null;
			case 10: return Ba(t.type._context), null;
			case 22:
			case 23: return wl(), null;
			case 24: return null;
			default: return null;
		}
	}
	var lc = !1, uc = !1, dc = typeof WeakSet == "function" ? WeakSet : Set, Q = null;
	function fc(e, t) {
		var n = e.ref;
		if (n !== null) if (typeof n == "function") try {
			n(null);
		} catch (n) {
			Rl(e, t, n);
		}
		else n.current = null;
	}
	function pc(e, t, n) {
		try {
			n();
		} catch (n) {
			Rl(e, t, n);
		}
	}
	var mc = !1;
	function hc(e, t) {
		if (pi = on, e = Tr(), Er(e)) {
			if ("selectionStart" in e) var n = {
				start: e.selectionStart,
				end: e.selectionEnd
			};
			else a: {
				n = (n = e.ownerDocument) && n.defaultView || window;
				var r = n.getSelection && n.getSelection();
				if (r && r.rangeCount !== 0) {
					n = r.anchorNode;
					var i = r.anchorOffset, o = r.focusNode;
					r = r.focusOffset;
					try {
						n.nodeType, o.nodeType;
					} catch {
						n = null;
						break a;
					}
					var s = 0, c = -1, l = -1, u = 0, d = 0, f = e, p = null;
					b: for (;;) {
						for (var m; f !== n || i !== 0 && f.nodeType !== 3 || (c = s + i), f !== o || r !== 0 && f.nodeType !== 3 || (l = s + r), f.nodeType === 3 && (s += f.nodeValue.length), (m = f.firstChild) !== null;) p = f, f = m;
						for (;;) {
							if (f === e) break b;
							if (p === n && ++u === i && (c = s), p === o && ++d === r && (l = s), (m = f.nextSibling) !== null) break;
							f = p, p = f.parentNode;
						}
						f = m;
					}
					n = c === -1 || l === -1 ? null : {
						start: c,
						end: l
					};
				} else n = null;
			}
			n ||= {
				start: 0,
				end: 0
			};
		} else n = null;
		for (mi = {
			focusedElem: e,
			selectionRange: n
		}, on = !1, Q = t; Q !== null;) if (t = Q, e = t.child, t.subtreeFlags & 1028 && e !== null) e.return = t, Q = e;
		else for (; Q !== null;) {
			t = Q;
			try {
				var h = t.alternate;
				if (t.flags & 1024) switch (t.tag) {
					case 0:
					case 11:
					case 15: break;
					case 1:
						if (h !== null) {
							var g = h.memoizedProps, _ = h.memoizedState, v = t.stateNode;
							v.__reactInternalSnapshotBeforeUpdate = v.getSnapshotBeforeUpdate(t.elementType === t.type ? g : hs(t.type, g), _);
						}
						break;
					case 3:
						var y = t.stateNode.containerInfo;
						y.nodeType === 1 ? y.textContent = "" : y.nodeType === 9 && y.documentElement && y.removeChild(y.documentElement);
						break;
					case 5:
					case 6:
					case 4:
					case 17: break;
					default: throw Error(a(163));
				}
			} catch (e) {
				Rl(t, t.return, e);
			}
			if (e = t.sibling, e !== null) {
				e.return = t.return, Q = e;
				break;
			}
			Q = t.return;
		}
		return h = mc, mc = !1, h;
	}
	function gc(e, t, n) {
		var r = t.updateQueue;
		if (r = r === null ? null : r.lastEffect, r !== null) {
			var i = r = r.next;
			do {
				if ((i.tag & e) === e) {
					var a = i.destroy;
					i.destroy = void 0, a !== void 0 && pc(t, n, a);
				}
				i = i.next;
			} while (i !== r);
		}
	}
	function _c(e, t) {
		if (t = t.updateQueue, t = t === null ? null : t.lastEffect, t !== null) {
			var n = t = t.next;
			do {
				if ((n.tag & e) === e) {
					var r = n.create;
					n.destroy = r();
				}
				n = n.next;
			} while (n !== t);
		}
	}
	function vc(e) {
		var t = e.ref;
		if (t !== null) {
			var n = e.stateNode;
			switch (e.tag) {
				case 5:
					e = n;
					break;
				default: e = n;
			}
			typeof t == "function" ? t(e) : t.current = e;
		}
	}
	function yc(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, yc(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[Ti], delete t[Ei], delete t[Oi], delete t[ki], delete t[Ai])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	function bc(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 4;
	}
	function xc(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || bc(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function Sc(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? n.nodeType === 8 ? n.parentNode.insertBefore(e, t) : n.insertBefore(e, t) : (n.nodeType === 8 ? (t = n.parentNode, t.insertBefore(e, n)) : (t = n, t.appendChild(e)), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = fi));
		else if (r !== 4 && (e = e.child, e !== null)) for (Sc(e, t, n), e = e.sibling; e !== null;) Sc(e, t, n), e = e.sibling;
	}
	function Cc(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
		else if (r !== 4 && (e = e.child, e !== null)) for (Cc(e, t, n), e = e.sibling; e !== null;) Cc(e, t, n), e = e.sibling;
	}
	var wc = null, Tc = !1;
	function Ec(e, t, n) {
		for (n = n.child; n !== null;) Dc(e, t, n), n = n.sibling;
	}
	function Dc(e, t, n) {
		if (gt && typeof gt.onCommitFiberUnmount == "function") try {
			gt.onCommitFiberUnmount(ht, n);
		} catch {}
		switch (n.tag) {
			case 5: uc || fc(n, t);
			case 6:
				var r = wc, i = Tc;
				wc = null, Ec(e, t, n), wc = r, Tc = i, wc !== null && (Tc ? (e = wc, n = n.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n)) : wc.removeChild(n.stateNode));
				break;
			case 18:
				wc !== null && (Tc ? (e = wc, n = n.stateNode, e.nodeType === 8 ? xi(e.parentNode, n) : e.nodeType === 1 && xi(e, n), rn(e)) : xi(wc, n.stateNode));
				break;
			case 4:
				r = wc, i = Tc, wc = n.stateNode.containerInfo, Tc = !0, Ec(e, t, n), wc = r, Tc = i;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				if (!uc && (r = n.updateQueue, r !== null && (r = r.lastEffect, r !== null))) {
					i = r = r.next;
					do {
						var a = i, o = a.destroy;
						a = a.tag, o !== void 0 && (a & 2 || a & 4) && pc(n, t, o), i = i.next;
					} while (i !== r);
				}
				Ec(e, t, n);
				break;
			case 1:
				if (!uc && (fc(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function")) try {
					r.props = n.memoizedProps, r.state = n.memoizedState, r.componentWillUnmount();
				} catch (e) {
					Rl(n, t, e);
				}
				Ec(e, t, n);
				break;
			case 21:
				Ec(e, t, n);
				break;
			case 22:
				n.mode & 1 ? (uc = (r = uc) || n.memoizedState !== null, Ec(e, t, n), uc = r) : Ec(e, t, n);
				break;
			default: Ec(e, t, n);
		}
	}
	function Oc(e) {
		var t = e.updateQueue;
		if (t !== null) {
			e.updateQueue = null;
			var n = e.stateNode;
			n === null && (n = e.stateNode = new dc()), t.forEach(function(t) {
				var r = Hl.bind(null, e, t);
				n.has(t) || (n.add(t), t.then(r, r));
			});
		}
	}
	function kc(e, t) {
		var n = t.deletions;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var i = n[r];
			try {
				var o = e, s = t, c = s;
				a: for (; c !== null;) {
					switch (c.tag) {
						case 5:
							wc = c.stateNode, Tc = !1;
							break a;
						case 3:
							wc = c.stateNode.containerInfo, Tc = !0;
							break a;
						case 4:
							wc = c.stateNode.containerInfo, Tc = !0;
							break a;
					}
					c = c.return;
				}
				if (wc === null) throw Error(a(160));
				Dc(o, s, i), wc = null, Tc = !1;
				var l = i.alternate;
				l !== null && (l.return = null), i.return = null;
			} catch (e) {
				Rl(i, t, e);
			}
		}
		if (t.subtreeFlags & 12854) for (t = t.child; t !== null;) Ac(t, e), t = t.sibling;
	}
	function Ac(e, t) {
		var n = e.alternate, r = e.flags;
		switch (e.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				if (kc(t, e), jc(e), r & 4) {
					try {
						gc(3, e, e.return), _c(3, e);
					} catch (t) {
						Rl(e, e.return, t);
					}
					try {
						gc(5, e, e.return);
					} catch (t) {
						Rl(e, e.return, t);
					}
				}
				break;
			case 1:
				kc(t, e), jc(e), r & 512 && n !== null && fc(n, n.return);
				break;
			case 5:
				if (kc(t, e), jc(e), r & 512 && n !== null && fc(n, n.return), e.flags & 32) {
					var i = e.stateNode;
					try {
						Se(i, "");
					} catch (t) {
						Rl(e, e.return, t);
					}
				}
				if (r & 4 && (i = e.stateNode, i != null)) {
					var o = e.memoizedProps, s = n === null ? o : n.memoizedProps, c = e.type, l = e.updateQueue;
					if (e.updateQueue = null, l !== null) try {
						c === "input" && o.type === "radio" && o.name != null && ce(i, o), ke(c, s);
						var u = ke(c, o);
						for (s = 0; s < l.length; s += 2) {
							var d = l[s], f = l[s + 1];
							d === "style" ? Ee(i, f) : d === "dangerouslySetInnerHTML" ? xe(i, f) : d === "children" ? Se(i, f) : S(i, d, f, u);
						}
						switch (c) {
							case "input":
								le(i, o);
								break;
							case "textarea":
								ge(i, o);
								break;
							case "select":
								var p = i._wrapperState.wasMultiple;
								i._wrapperState.wasMultiple = !!o.multiple;
								var m = o.value;
								m == null ? p !== !!o.multiple && (o.defaultValue == null ? pe(i, !!o.multiple, o.multiple ? [] : "", !1) : pe(i, !!o.multiple, o.defaultValue, !0)) : pe(i, !!o.multiple, m, !1);
						}
						i[Ei] = o;
					} catch (t) {
						Rl(e, e.return, t);
					}
				}
				break;
			case 6:
				if (kc(t, e), jc(e), r & 4) {
					if (e.stateNode === null) throw Error(a(162));
					i = e.stateNode, o = e.memoizedProps;
					try {
						i.nodeValue = o;
					} catch (t) {
						Rl(e, e.return, t);
					}
				}
				break;
			case 3:
				if (kc(t, e), jc(e), r & 4 && n !== null && n.memoizedState.isDehydrated) try {
					rn(t.containerInfo);
				} catch (t) {
					Rl(e, e.return, t);
				}
				break;
			case 4:
				kc(t, e), jc(e);
				break;
			case 13:
				kc(t, e), jc(e), i = e.child, i.flags & 8192 && (o = i.memoizedState !== null, i.stateNode.isHidden = o, !o || i.alternate !== null && i.alternate.memoizedState !== null || ($c = ct())), r & 4 && Oc(e);
				break;
			case 22:
				if (d = n !== null && n.memoizedState !== null, e.mode & 1 ? (uc = (u = uc) || d, kc(t, e), uc = u) : kc(t, e), jc(e), r & 8192) {
					if (u = e.memoizedState !== null, (e.stateNode.isHidden = u) && !d && e.mode & 1) for (Q = e, d = e.child; d !== null;) {
						for (f = Q = d; Q !== null;) {
							switch (p = Q, m = p.child, p.tag) {
								case 0:
								case 11:
								case 14:
								case 15:
									gc(4, p, p.return);
									break;
								case 1:
									fc(p, p.return);
									var h = p.stateNode;
									if (typeof h.componentWillUnmount == "function") {
										r = p, n = p.return;
										try {
											t = r, h.props = t.memoizedProps, h.state = t.memoizedState, h.componentWillUnmount();
										} catch (e) {
											Rl(r, n, e);
										}
									}
									break;
								case 5:
									fc(p, p.return);
									break;
								case 22: if (p.memoizedState !== null) {
									Fc(f);
									continue;
								}
							}
							m === null ? Fc(f) : (m.return = p, Q = m);
						}
						d = d.sibling;
					}
					a: for (d = null, f = e;;) {
						if (f.tag === 5) {
							if (d === null) {
								d = f;
								try {
									i = f.stateNode, u ? (o = i.style, typeof o.setProperty == "function" ? o.setProperty("display", "none", "important") : o.display = "none") : (c = f.stateNode, l = f.memoizedProps.style, s = l != null && l.hasOwnProperty("display") ? l.display : null, c.style.display = Te("display", s));
								} catch (t) {
									Rl(e, e.return, t);
								}
							}
						} else if (f.tag === 6) {
							if (d === null) try {
								f.stateNode.nodeValue = u ? "" : f.memoizedProps;
							} catch (t) {
								Rl(e, e.return, t);
							}
						} else if ((f.tag !== 22 && f.tag !== 23 || f.memoizedState === null || f === e) && f.child !== null) {
							f.child.return = f, f = f.child;
							continue;
						}
						if (f === e) break a;
						for (; f.sibling === null;) {
							if (f.return === null || f.return === e) break a;
							d === f && (d = null), f = f.return;
						}
						d === f && (d = null), f.sibling.return = f.return, f = f.sibling;
					}
				}
				break;
			case 19:
				kc(t, e), jc(e), r & 4 && Oc(e);
				break;
			case 21: break;
			default: kc(t, e), jc(e);
		}
	}
	function jc(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				a: {
					for (var n = e.return; n !== null;) {
						if (bc(n)) {
							var r = n;
							break a;
						}
						n = n.return;
					}
					throw Error(a(160));
				}
				switch (r.tag) {
					case 5:
						var i = r.stateNode;
						r.flags & 32 && (Se(i, ""), r.flags &= -33), Cc(e, xc(e), i);
						break;
					case 3:
					case 4:
						var o = r.stateNode.containerInfo;
						Sc(e, xc(e), o);
						break;
					default: throw Error(a(161));
				}
			} catch (t) {
				Rl(e, e.return, t);
			}
			e.flags &= -3;
		}
		t & 4096 && (e.flags &= -4097);
	}
	function Mc(e, t, n) {
		Q = e, Nc(e, t, n);
	}
	function Nc(e, t, n) {
		for (var r = !!(e.mode & 1); Q !== null;) {
			var i = Q, a = i.child;
			if (i.tag === 22 && r) {
				var o = i.memoizedState !== null || lc;
				if (!o) {
					var s = i.alternate, c = s !== null && s.memoizedState !== null || uc;
					s = lc;
					var l = uc;
					if (lc = o, (uc = c) && !l) for (Q = i; Q !== null;) o = Q, c = o.child, o.tag === 22 && o.memoizedState !== null || c === null ? Ic(i) : (c.return = o, Q = c);
					for (; a !== null;) Q = a, Nc(a, t, n), a = a.sibling;
					Q = i, lc = s, uc = l;
				}
				Pc(e, t, n);
			} else i.subtreeFlags & 8772 && a !== null ? (a.return = i, Q = a) : Pc(e, t, n);
		}
	}
	function Pc(e) {
		for (; Q !== null;) {
			var t = Q;
			if (t.flags & 8772) {
				var n = t.alternate;
				try {
					if (t.flags & 8772) switch (t.tag) {
						case 0:
						case 11:
						case 15:
							uc || _c(5, t);
							break;
						case 1:
							var r = t.stateNode;
							if (t.flags & 4 && !uc) if (n === null) r.componentDidMount();
							else {
								var i = t.elementType === t.type ? n.memoizedProps : hs(t.type, n.memoizedProps);
								r.componentDidUpdate(i, n.memoizedState, r.__reactInternalSnapshotBeforeUpdate);
							}
							var o = t.updateQueue;
							o !== null && no(t, o, r);
							break;
						case 3:
							var s = t.updateQueue;
							if (s !== null) {
								if (n = null, t.child !== null) switch (t.child.tag) {
									case 5:
										n = t.child.stateNode;
										break;
									case 1: n = t.child.stateNode;
								}
								no(t, s, n);
							}
							break;
						case 5:
							var c = t.stateNode;
							if (n === null && t.flags & 4) {
								n = c;
								var l = t.memoizedProps;
								switch (t.type) {
									case "button":
									case "input":
									case "select":
									case "textarea":
										l.autoFocus && n.focus();
										break;
									case "img": l.src && (n.src = l.src);
								}
							}
							break;
						case 6: break;
						case 4: break;
						case 12: break;
						case 13:
							if (t.memoizedState === null) {
								var u = t.alternate;
								if (u !== null) {
									var d = u.memoizedState;
									if (d !== null) {
										var f = d.dehydrated;
										f !== null && rn(f);
									}
								}
							}
							break;
						case 19:
						case 17:
						case 21:
						case 22:
						case 23:
						case 25: break;
						default: throw Error(a(163));
					}
					uc || t.flags & 512 && vc(t);
				} catch (e) {
					Rl(t, t.return, e);
				}
			}
			if (t === e) {
				Q = null;
				break;
			}
			if (n = t.sibling, n !== null) {
				n.return = t.return, Q = n;
				break;
			}
			Q = t.return;
		}
	}
	function Fc(e) {
		for (; Q !== null;) {
			var t = Q;
			if (t === e) {
				Q = null;
				break;
			}
			var n = t.sibling;
			if (n !== null) {
				n.return = t.return, Q = n;
				break;
			}
			Q = t.return;
		}
	}
	function Ic(e) {
		for (; Q !== null;) {
			var t = Q;
			try {
				switch (t.tag) {
					case 0:
					case 11:
					case 15:
						var n = t.return;
						try {
							_c(4, t);
						} catch (e) {
							Rl(t, n, e);
						}
						break;
					case 1:
						var r = t.stateNode;
						if (typeof r.componentDidMount == "function") {
							var i = t.return;
							try {
								r.componentDidMount();
							} catch (e) {
								Rl(t, i, e);
							}
						}
						var a = t.return;
						try {
							vc(t);
						} catch (e) {
							Rl(t, a, e);
						}
						break;
					case 5:
						var o = t.return;
						try {
							vc(t);
						} catch (e) {
							Rl(t, o, e);
						}
				}
			} catch (e) {
				Rl(t, t.return, e);
			}
			if (t === e) {
				Q = null;
				break;
			}
			var s = t.sibling;
			if (s !== null) {
				s.return = t.return, Q = s;
				break;
			}
			Q = t.return;
		}
	}
	var Lc = Math.ceil, Rc = C.ReactCurrentDispatcher, zc = C.ReactCurrentOwner, Bc = C.ReactCurrentBatchConfig, $ = 0, Vc = null, Hc = null, Uc = 0, Wc = 0, Gc = Li(0), Kc = 0, qc = null, Jc = 0, Yc = 0, Xc = 0, Zc = null, Qc = null, $c = 0, el = Infinity, tl = null, nl = !1, rl = null, il = null, al = !1, ol = null, sl = 0, cl = 0, ll = null, ul = -1, dl = 0;
	function fl() {
		return $ & 6 ? ct() : ul === -1 ? ul = ct() : ul;
	}
	function pl(e) {
		return e.mode & 1 ? $ & 2 && Uc !== 0 ? Uc & -Uc : Oa.transition === null ? (e = J, e === 0 ? (e = window.event, e = e === void 0 ? 16 : fn(e.type), e) : e) : (dl === 0 && (dl = kt()), dl) : 1;
	}
	function ml(e, t, n, r) {
		if (50 < cl) throw cl = 0, ll = null, Error(a(185));
		jt(e, n, r), (!($ & 2) || e !== Vc) && (e === Vc && (!($ & 2) && (Yc |= n), Kc === 4 && bl(e, Uc)), hl(e, r), n === 1 && $ === 0 && !(t.mode & 1) && (el = ct() + 500, Zi && ta()));
	}
	function hl(e, t) {
		var n = e.callbackNode;
		Dt(e, t);
		var r = Tt(e, e === Vc ? Uc : 0);
		if (r === 0) n !== null && at(n), e.callbackNode = null, e.callbackPriority = 0;
		else if (t = r & -r, e.callbackPriority !== t) {
			if (n != null && at(n), t === 1) e.tag === 0 ? ea(xl.bind(null, e)) : $i(xl.bind(null, e)), yi(function() {
				!($ & 6) && ta();
			}), n = null;
			else {
				switch (Pt(r)) {
					case 1:
						n = ut;
						break;
					case 4:
						n = dt;
						break;
					case 16:
						n = ft;
						break;
					case 536870912:
						n = mt;
						break;
					default: n = ft;
				}
				n = Wl(n, gl.bind(null, e));
			}
			e.callbackPriority = t, e.callbackNode = n;
		}
	}
	function gl(e, t) {
		if (ul = -1, dl = 0, $ & 6) throw Error(a(327));
		var n = e.callbackNode;
		if (Il() && e.callbackNode !== n) return null;
		var r = Tt(e, e === Vc ? Uc : 0);
		if (r === 0) return null;
		if (r & 30 || (r & e.expiredLanes) !== 0 || t) t = kl(e, r);
		else {
			t = r;
			var i = $;
			$ |= 2;
			var o = Dl();
			(Vc !== e || Uc !== t) && (tl = null, el = ct() + 500, Tl(e, t));
			do
				try {
					jl();
					break;
				} catch (t) {
					El(e, t);
				}
			while (1);
			za(), Rc.current = o, $ = i, Hc === null ? (Vc = null, Uc = 0, t = Kc) : t = 0;
		}
		if (t !== 0) {
			if (t === 2 && (i = Ot(e), i !== 0 && (r = i, t = _l(e, i))), t === 1) throw n = qc, Tl(e, 0), bl(e, r), hl(e, ct()), n;
			if (t === 6) bl(e, r);
			else {
				if (i = e.current.alternate, !(r & 30) && !yl(i) && (t = kl(e, r), t === 2 && (o = Ot(e), o !== 0 && (r = o, t = _l(e, o))), t === 1)) throw n = qc, Tl(e, 0), bl(e, r), hl(e, ct()), n;
				switch (e.finishedWork = i, e.finishedLanes = r, t) {
					case 0:
					case 1: throw Error(a(345));
					case 2:
						Pl(e, Qc, tl);
						break;
					case 3:
						if (bl(e, r), (r & 130023424) === r && (t = $c + 500 - ct(), 10 < t)) {
							if (Tt(e, 0) !== 0) break;
							if (i = e.suspendedLanes, (i & r) !== r) {
								fl(), e.pingedLanes |= e.suspendedLanes & i;
								break;
							}
							e.timeoutHandle = gi(Pl.bind(null, e, Qc, tl), t);
							break;
						}
						Pl(e, Qc, tl);
						break;
					case 4:
						if (bl(e, r), (r & 4194240) === r) break;
						for (t = e.eventTimes, i = -1; 0 < r;) {
							var s = 31 - vt(r);
							o = 1 << s, s = t[s], s > i && (i = s), r &= ~o;
						}
						if (r = i, r = ct() - r, r = (120 > r ? 120 : 480 > r ? 480 : 1080 > r ? 1080 : 1920 > r ? 1920 : 3e3 > r ? 3e3 : 4320 > r ? 4320 : 1960 * Lc(r / 1960)) - r, 10 < r) {
							e.timeoutHandle = gi(Pl.bind(null, e, Qc, tl), r);
							break;
						}
						Pl(e, Qc, tl);
						break;
					case 5:
						Pl(e, Qc, tl);
						break;
					default: throw Error(a(329));
				}
			}
		}
		return hl(e, ct()), e.callbackNode === n ? gl.bind(null, e) : null;
	}
	function _l(e, t) {
		var n = Zc;
		return e.current.memoizedState.isDehydrated && (Tl(e, t).flags |= 256), e = kl(e, t), e !== 2 && (t = Qc, Qc = n, t !== null && vl(t)), e;
	}
	function vl(e) {
		Qc === null ? Qc = e : Qc.push.apply(Qc, e);
	}
	function yl(e) {
		for (var t = e;;) {
			if (t.flags & 16384) {
				var n = t.updateQueue;
				if (n !== null && (n = n.stores, n !== null)) for (var r = 0; r < n.length; r++) {
					var i = n[r], a = i.getSnapshot;
					i = i.value;
					try {
						if (!br(a(), i)) return !1;
					} catch {
						return !1;
					}
				}
			}
			if (n = t.child, t.subtreeFlags & 16384 && n !== null) n.return = t, t = n;
			else {
				if (t === e) break;
				for (; t.sibling === null;) {
					if (t.return === null || t.return === e) return !0;
					t = t.return;
				}
				t.sibling.return = t.return, t = t.sibling;
			}
		}
		return !0;
	}
	function bl(e, t) {
		for (t &= ~Xc, t &= ~Yc, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t;) {
			var n = 31 - vt(t), r = 1 << n;
			e[n] = -1, t &= ~r;
		}
	}
	function xl(e) {
		if ($ & 6) throw Error(a(327));
		Il();
		var t = Tt(e, 0);
		if (!(t & 1)) return hl(e, ct()), null;
		var n = kl(e, t);
		if (e.tag !== 0 && n === 2) {
			var r = Ot(e);
			r !== 0 && (t = r, n = _l(e, r));
		}
		if (n === 1) throw n = qc, Tl(e, 0), bl(e, t), hl(e, ct()), n;
		if (n === 6) throw Error(a(345));
		return e.finishedWork = e.current.alternate, e.finishedLanes = t, Pl(e, Qc, tl), hl(e, ct()), null;
	}
	function Sl(e, t) {
		var n = $;
		$ |= 1;
		try {
			return e(t);
		} finally {
			$ = n, $ === 0 && (el = ct() + 500, Zi && ta());
		}
	}
	function Cl(e) {
		ol !== null && ol.tag === 0 && !($ & 6) && Il();
		var t = $;
		$ |= 1;
		var n = Bc.transition, r = J;
		try {
			if (Bc.transition = null, J = 1, e) return e();
		} finally {
			J = r, Bc.transition = n, $ = t, !($ & 6) && ta();
		}
	}
	function wl() {
		Wc = Gc.current, Z(Gc);
	}
	function Tl(e, t) {
		e.finishedWork = null, e.finishedLanes = 0;
		var n = e.timeoutHandle;
		if (n !== -1 && (e.timeoutHandle = -1, _i(n)), Hc !== null) for (n = Hc.return; n !== null;) {
			var r = n;
			switch (ma(r), r.tag) {
				case 1:
					r = r.type.childContextTypes, r != null && Gi();
					break;
				case 3:
					lo(), Z(Vi), Z(Bi), go();
					break;
				case 5:
					fo(r);
					break;
				case 4:
					lo();
					break;
				case 13:
					Z(po);
					break;
				case 19:
					Z(po);
					break;
				case 10:
					Ba(r.type._context);
					break;
				case 22:
				case 23: wl();
			}
			n = n.return;
		}
		if (Vc = e, Hc = e = Yl(e.current, null), Uc = Wc = t, Kc = 0, qc = null, Xc = Yc = Jc = 0, Qc = Zc = null, Wa !== null) {
			for (t = 0; t < Wa.length; t++) if (n = Wa[t], r = n.interleaved, r !== null) {
				n.interleaved = null;
				var i = r.next, a = n.pending;
				if (a !== null) {
					var o = a.next;
					a.next = i, r.next = o;
				}
				n.pending = r;
			}
			Wa = null;
		}
		return e;
	}
	function El(e, t) {
		do {
			var n = Hc;
			try {
				if (za(), _o.current = ds, Co) {
					for (var r = bo.memoizedState; r !== null;) {
						var i = r.queue;
						i !== null && (i.pending = null), r = r.next;
					}
					Co = !1;
				}
				if (yo = 0, So = xo = bo = null, wo = !1, To = 0, zc.current = null, n === null || n.return === null) {
					Kc = 1, qc = t, Hc = null;
					break;
				}
				a: {
					var o = e, s = n.return, c = n, l = t;
					if (t = Uc, c.flags |= 32768, typeof l == "object" && l && typeof l.then == "function") {
						var u = l, d = c, f = d.tag;
						if (!(d.mode & 1) && (f === 0 || f === 11 || f === 15)) {
							var p = d.alternate;
							p ? (d.updateQueue = p.updateQueue, d.memoizedState = p.memoizedState, d.lanes = p.lanes) : (d.updateQueue = null, d.memoizedState = null);
						}
						var m = ks(s);
						if (m !== null) {
							m.flags &= -257, As(m, s, c, o, t), m.mode & 1 && Os(o, u, t), t = m, l = u;
							var h = t.updateQueue;
							if (h === null) {
								var g = /* @__PURE__ */ new Set();
								g.add(l), t.updateQueue = g;
							} else h.add(l);
							break a;
						}
						if (!(t & 1)) {
							Os(o, u, t), Ol();
							break a;
						}
						l = Error(a(426));
					} else if (_a && c.mode & 1) {
						var _ = ks(s);
						if (_ !== null) {
							!(_.flags & 65536) && (_.flags |= 256), As(_, s, c, o, t), Da(Ss(l, c));
							break a;
						}
					}
					o = l = Ss(l, c), Kc !== 4 && (Kc = 2), Zc === null ? Zc = [o] : Zc.push(o), o = s;
					do {
						switch (o.tag) {
							case 3:
								o.flags |= 65536, t &= -t, o.lanes |= t;
								var v = Es(o, l, t);
								eo(o, v);
								break a;
							case 1:
								c = l;
								var y = o.type, b = o.stateNode;
								if (!(o.flags & 128) && (typeof y.getDerivedStateFromError == "function" || b !== null && typeof b.componentDidCatch == "function" && (il === null || !il.has(b)))) {
									o.flags |= 65536, t &= -t, o.lanes |= t;
									var x = Ds(o, c, t);
									eo(o, x);
									break a;
								}
						}
						o = o.return;
					} while (o !== null);
				}
				Nl(n);
			} catch (e) {
				t = e, Hc === n && n !== null && (Hc = n = n.return);
				continue;
			}
			break;
		} while (1);
	}
	function Dl() {
		var e = Rc.current;
		return Rc.current = ds, e === null ? ds : e;
	}
	function Ol() {
		(Kc === 0 || Kc === 3 || Kc === 2) && (Kc = 4), Vc === null || !(Jc & 268435455) && !(Yc & 268435455) || bl(Vc, Uc);
	}
	function kl(e, t) {
		var n = $;
		$ |= 2;
		var r = Dl();
		(Vc !== e || Uc !== t) && (tl = null, Tl(e, t));
		do
			try {
				Al();
				break;
			} catch (t) {
				El(e, t);
			}
		while (1);
		if (za(), $ = n, Rc.current = r, Hc !== null) throw Error(a(261));
		return Vc = null, Uc = 0, Kc;
	}
	function Al() {
		for (; Hc !== null;) Ml(Hc);
	}
	function jl() {
		for (; Hc !== null && !ot();) Ml(Hc);
	}
	function Ml(e) {
		var t = Ul(e.alternate, e, Wc);
		e.memoizedProps = e.pendingProps, t === null ? Nl(e) : Hc = t, zc.current = null;
	}
	function Nl(e) {
		var t = e;
		do {
			var n = t.alternate;
			if (e = t.return, t.flags & 32768) {
				if (n = cc(n, t), n !== null) {
					n.flags &= 32767, Hc = n;
					return;
				}
				if (e !== null) e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null;
				else {
					Kc = 6, Hc = null;
					return;
				}
			} else if (n = sc(n, t, Wc), n !== null) {
				Hc = n;
				return;
			}
			if (t = t.sibling, t !== null) {
				Hc = t;
				return;
			}
			Hc = t = e;
		} while (t !== null);
		Kc === 0 && (Kc = 5);
	}
	function Pl(e, t, n) {
		var r = J, i = Bc.transition;
		try {
			Bc.transition = null, J = 1, Fl(e, t, n, r);
		} finally {
			Bc.transition = i, J = r;
		}
		return null;
	}
	function Fl(e, t, n, r) {
		do
			Il();
		while (ol !== null);
		if ($ & 6) throw Error(a(327));
		n = e.finishedWork;
		var i = e.finishedLanes;
		if (n === null) return null;
		if (e.finishedWork = null, e.finishedLanes = 0, n === e.current) throw Error(a(177));
		e.callbackNode = null, e.callbackPriority = 0;
		var o = n.lanes | n.childLanes;
		if (Mt(e, o), e === Vc && (Hc = Vc = null, Uc = 0), !(n.subtreeFlags & 2064) && !(n.flags & 2064) || al || (al = !0, Wl(ft, function() {
			return Il(), null;
		})), o = !!(n.flags & 15990), n.subtreeFlags & 15990 || o) {
			o = Bc.transition, Bc.transition = null;
			var s = J;
			J = 1;
			var c = $;
			$ |= 4, zc.current = null, hc(e, n), Ac(n, e), Dr(mi), on = !!pi, mi = pi = null, e.current = n, Mc(n, e, i), st(), $ = c, J = s, Bc.transition = o;
		} else e.current = n;
		if (al && (al = !1, ol = e, sl = i), o = e.pendingLanes, o === 0 && (il = null), _t(n.stateNode, r), hl(e, ct()), t !== null) for (r = e.onRecoverableError, n = 0; n < t.length; n++) i = t[n], r(i.value, {
			componentStack: i.stack,
			digest: i.digest
		});
		if (nl) throw nl = !1, e = rl, rl = null, e;
		return sl & 1 && e.tag !== 0 && Il(), o = e.pendingLanes, o & 1 ? e === ll ? cl++ : (cl = 0, ll = e) : cl = 0, ta(), null;
	}
	function Il() {
		if (ol !== null) {
			var e = Pt(sl), t = Bc.transition, n = J;
			try {
				if (Bc.transition = null, J = 16 > e ? 16 : e, ol === null) var r = !1;
				else {
					if (e = ol, ol = null, sl = 0, $ & 6) throw Error(a(331));
					var i = $;
					for ($ |= 4, Q = e.current; Q !== null;) {
						var o = Q, s = o.child;
						if (Q.flags & 16) {
							var c = o.deletions;
							if (c !== null) {
								for (var l = 0; l < c.length; l++) {
									var u = c[l];
									for (Q = u; Q !== null;) {
										var d = Q;
										switch (d.tag) {
											case 0:
											case 11:
											case 15: gc(8, d, o);
										}
										var f = d.child;
										if (f !== null) f.return = d, Q = f;
										else for (; Q !== null;) {
											d = Q;
											var p = d.sibling, m = d.return;
											if (yc(d), d === u) {
												Q = null;
												break;
											}
											if (p !== null) {
												p.return = m, Q = p;
												break;
											}
											Q = m;
										}
									}
								}
								var h = o.alternate;
								if (h !== null) {
									var g = h.child;
									if (g !== null) {
										h.child = null;
										do {
											var _ = g.sibling;
											g.sibling = null, g = _;
										} while (g !== null);
									}
								}
								Q = o;
							}
						}
						if (o.subtreeFlags & 2064 && s !== null) s.return = o, Q = s;
						else b: for (; Q !== null;) {
							if (o = Q, o.flags & 2048) switch (o.tag) {
								case 0:
								case 11:
								case 15: gc(9, o, o.return);
							}
							var v = o.sibling;
							if (v !== null) {
								v.return = o.return, Q = v;
								break b;
							}
							Q = o.return;
						}
					}
					var y = e.current;
					for (Q = y; Q !== null;) {
						s = Q;
						var b = s.child;
						if (s.subtreeFlags & 2064 && b !== null) b.return = s, Q = b;
						else b: for (s = y; Q !== null;) {
							if (c = Q, c.flags & 2048) try {
								switch (c.tag) {
									case 0:
									case 11:
									case 15: _c(9, c);
								}
							} catch (e) {
								Rl(c, c.return, e);
							}
							if (c === s) {
								Q = null;
								break b;
							}
							var x = c.sibling;
							if (x !== null) {
								x.return = c.return, Q = x;
								break b;
							}
							Q = c.return;
						}
					}
					if ($ = i, ta(), gt && typeof gt.onPostCommitFiberRoot == "function") try {
						gt.onPostCommitFiberRoot(ht, e);
					} catch {}
					r = !0;
				}
				return r;
			} finally {
				J = n, Bc.transition = t;
			}
		}
		return !1;
	}
	function Ll(e, t, n) {
		t = Ss(n, t), t = Es(e, t, 1), e = Qa(e, t, 1), t = fl(), e !== null && (jt(e, 1, t), hl(e, t));
	}
	function Rl(e, t, n) {
		if (e.tag === 3) Ll(e, e, n);
		else for (; t !== null;) {
			if (t.tag === 3) {
				Ll(t, e, n);
				break;
			}
			if (t.tag === 1) {
				var r = t.stateNode;
				if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (il === null || !il.has(r))) {
					e = Ss(n, e), e = Ds(t, e, 1), t = Qa(t, e, 1), e = fl(), t !== null && (jt(t, 1, e), hl(t, e));
					break;
				}
			}
			t = t.return;
		}
	}
	function zl(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), t = fl(), e.pingedLanes |= e.suspendedLanes & n, Vc === e && (Uc & n) === n && (Kc === 4 || Kc === 3 && (Uc & 130023424) === Uc && 500 > ct() - $c ? Tl(e, 0) : Xc |= n), hl(e, t);
	}
	function Bl(e, t) {
		t === 0 && (e.mode & 1 ? (t = Ct, Ct <<= 1, !(Ct & 130023424) && (Ct = 4194304)) : t = 1);
		var n = fl();
		e = qa(e, t), e !== null && (jt(e, t, n), hl(e, n));
	}
	function Vl(e) {
		var t = e.memoizedState, n = 0;
		t !== null && (n = t.retryLane), Bl(e, n);
	}
	function Hl(e, t) {
		var n = 0;
		switch (e.tag) {
			case 13:
				var r = e.stateNode, i = e.memoizedState;
				i !== null && (n = i.retryLane);
				break;
			case 19:
				r = e.stateNode;
				break;
			default: throw Error(a(314));
		}
		r !== null && r.delete(t), Bl(e, n);
	}
	var Ul = function(e, t, n) {
		if (e !== null) if (e.memoizedProps !== t.pendingProps || Vi.current) Ms = !0;
		else {
			if ((e.lanes & n) === 0 && !(t.flags & 128)) return Ms = !1, tc(e, t, n);
			Ms = !!(e.flags & 131072);
		}
		else Ms = !1, _a && t.flags & 1048576 && fa(t, aa, t.index);
		switch (t.lanes = 0, t.tag) {
			case 2:
				var r = t.type;
				$s(e, t), e = t.pendingProps;
				var i = Ui(t, Bi.current);
				Ha(t, n), i = ko(null, t, r, e, i, n);
				var o = Ao();
				return t.flags |= 1, typeof i == "object" && i && typeof i.render == "function" && i.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, Wi(r) ? (o = !0, Ji(t)) : o = !1, t.memoizedState = i.state !== null && i.state !== void 0 ? i.state : null, Ya(t), i.updater = _s, t.stateNode = i, i._reactInternals = t, xs(t, r, e, n), t = Vs(null, t, r, !0, o, n)) : (t.tag = 0, _a && o && pa(t), Ns(null, t, i, n), t = t.child), t;
			case 16:
				r = t.elementType;
				a: {
					switch ($s(e, t), e = t.pendingProps, i = r._init, r = i(r._payload), t.type = r, i = t.tag = Jl(r), e = hs(r, e), i) {
						case 0:
							t = zs(null, t, r, e, n);
							break a;
						case 1:
							t = Bs(null, t, r, e, n);
							break a;
						case 11:
							t = Ps(null, t, r, e, n);
							break a;
						case 14:
							t = Fs(null, t, r, hs(r.type, e), n);
							break a;
					}
					throw Error(a(306, r, ""));
				}
				return t;
			case 0: return r = t.type, i = t.pendingProps, i = t.elementType === r ? i : hs(r, i), zs(e, t, r, i, n);
			case 1: return r = t.type, i = t.pendingProps, i = t.elementType === r ? i : hs(r, i), Bs(e, t, r, i, n);
			case 3:
				a: {
					if (Hs(t), e === null) throw Error(a(387));
					r = t.pendingProps, o = t.memoizedState, i = o.element, Xa(e, t), to(t, r, null, n);
					var s = t.memoizedState;
					if (r = s.element, o.isDehydrated) if (o = {
						element: r,
						isDehydrated: !1,
						cache: s.cache,
						pendingSuspenseBoundaries: s.pendingSuspenseBoundaries,
						transitions: s.transitions
					}, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
						i = Ss(Error(a(423)), t), t = Us(e, t, r, n, i);
						break a;
					} else if (r !== i) {
						i = Ss(Error(a(424)), t), t = Us(e, t, r, n, i);
						break a;
					} else for (ga = Si(t.stateNode.containerInfo.firstChild), ha = t, _a = !0, va = null, n = Pa(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 4096, n = n.sibling;
					else {
						if (Ea(), r === i) {
							t = ec(e, t, n);
							break a;
						}
						Ns(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 5: return uo(t), e === null && Sa(t), r = t.type, i = t.pendingProps, o = e === null ? null : e.memoizedProps, s = i.children, hi(r, i) ? s = null : o !== null && hi(r, o) && (t.flags |= 32), Rs(e, t), Ns(e, t, s, n), t.child;
			case 6: return e === null && Sa(t), null;
			case 13: return Ks(e, t, n);
			case 4: return co(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Na(t, null, r, n) : Ns(e, t, r, n), t.child;
			case 11: return r = t.type, i = t.pendingProps, i = t.elementType === r ? i : hs(r, i), Ps(e, t, r, i, n);
			case 7: return Ns(e, t, t.pendingProps, n), t.child;
			case 8: return Ns(e, t, t.pendingProps.children, n), t.child;
			case 12: return Ns(e, t, t.pendingProps.children, n), t.child;
			case 10:
				a: {
					if (r = t.type._context, i = t.pendingProps, o = t.memoizedProps, s = i.value, Ri(Fa, r._currentValue), r._currentValue = s, o !== null) if (br(o.value, s)) {
						if (o.children === i.children && !Vi.current) {
							t = ec(e, t, n);
							break a;
						}
					} else for (o = t.child, o !== null && (o.return = t); o !== null;) {
						var c = o.dependencies;
						if (c !== null) {
							s = o.child;
							for (var l = c.firstContext; l !== null;) {
								if (l.context === r) {
									if (o.tag === 1) {
										l = Za(-1, n & -n), l.tag = 2;
										var u = o.updateQueue;
										if (u !== null) {
											u = u.shared;
											var d = u.pending;
											d === null ? l.next = l : (l.next = d.next, d.next = l), u.pending = l;
										}
									}
									o.lanes |= n, l = o.alternate, l !== null && (l.lanes |= n), Va(o.return, n, t), c.lanes |= n;
									break;
								}
								l = l.next;
							}
						} else if (o.tag === 10) s = o.type === t.type ? null : o.child;
						else if (o.tag === 18) {
							if (s = o.return, s === null) throw Error(a(341));
							s.lanes |= n, c = s.alternate, c !== null && (c.lanes |= n), Va(s, n, t), s = o.sibling;
						} else s = o.child;
						if (s !== null) s.return = o;
						else for (s = o; s !== null;) {
							if (s === t) {
								s = null;
								break;
							}
							if (o = s.sibling, o !== null) {
								o.return = s.return, s = o;
								break;
							}
							s = s.return;
						}
						o = s;
					}
					Ns(e, t, i.children, n), t = t.child;
				}
				return t;
			case 9: return i = t.type, r = t.pendingProps.children, Ha(t, n), i = Ua(i), r = r(i), t.flags |= 1, Ns(e, t, r, n), t.child;
			case 14: return r = t.type, i = hs(r, t.pendingProps), i = hs(r.type, i), Fs(e, t, r, i, n);
			case 15: return Is(e, t, t.type, t.pendingProps, n);
			case 17: return r = t.type, i = t.pendingProps, i = t.elementType === r ? i : hs(r, i), $s(e, t), t.tag = 1, Wi(r) ? (e = !0, Ji(t)) : e = !1, Ha(t, n), ys(t, r, i), xs(t, r, i, n), Vs(null, t, r, !0, e, n);
			case 19: return Qs(e, t, n);
			case 22: return Ls(e, t, n);
		}
		throw Error(a(156, t.tag));
	};
	function Wl(e, t) {
		return it(e, t);
	}
	function Gl(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function Kl(e, t, n, r) {
		return new Gl(e, t, n, r);
	}
	function ql(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function Jl(e) {
		if (typeof e == "function") return +!!ql(e);
		if (e != null) {
			if (e = e.$$typeof, e === j) return 11;
			if (e === P) return 14;
		}
		return 2;
	}
	function Yl(e, t) {
		var n = e.alternate;
		return n === null ? (n = Kl(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 14680064, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
	}
	function Xl(e, t, n, r, i, o) {
		var s = 2;
		if (r = e, typeof e == "function") ql(e) && (s = 1);
		else if (typeof e == "string") s = 5;
		else a: switch (e) {
			case E: return Zl(n.children, i, o, t);
			case D:
				s = 8, i |= 8;
				break;
			case O: return e = Kl(12, n, t, i | 2), e.elementType = O, e.lanes = o, e;
			case M: return e = Kl(13, n, t, i), e.elementType = M, e.lanes = o, e;
			case N: return e = Kl(19, n, t, i), e.elementType = N, e.lanes = o, e;
			case I: return Ql(n, i, o, t);
			default:
				if (typeof e == "object" && e) switch (e.$$typeof) {
					case k:
						s = 10;
						break a;
					case A:
						s = 9;
						break a;
					case j:
						s = 11;
						break a;
					case P:
						s = 14;
						break a;
					case F:
						s = 16, r = null;
						break a;
				}
				throw Error(a(130, e == null ? e : typeof e, ""));
		}
		return t = Kl(s, n, t, i), t.elementType = e, t.type = r, t.lanes = o, t;
	}
	function Zl(e, t, n, r) {
		return e = Kl(7, e, r, t), e.lanes = n, e;
	}
	function Ql(e, t, n, r) {
		return e = Kl(22, e, r, t), e.elementType = I, e.lanes = n, e.stateNode = { isHidden: !1 }, e;
	}
	function $l(e, t, n) {
		return e = Kl(6, e, null, t), e.lanes = n, e;
	}
	function eu(e, t, n) {
		return t = Kl(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	function tu(e, t, n, r, i) {
		this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = At(0), this.expirationTimes = At(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = At(0), this.identifierPrefix = r, this.onRecoverableError = i, this.mutableSourceEagerHydrationData = null;
	}
	function nu(e, t, n, r, i, a, o, s, c) {
		return e = new tu(e, t, n, s, c), t === 1 ? (t = 1, !0 === a && (t |= 8)) : t = 0, a = Kl(3, null, null, t), e.current = a, a.stateNode = e, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: null,
			transitions: null,
			pendingSuspenseBoundaries: null
		}, Ya(a), e;
	}
	function ru(e, t, n) {
		var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
		return {
			$$typeof: T,
			key: r == null ? null : "" + r,
			children: e,
			containerInfo: t,
			implementation: n
		};
	}
	function iu(e) {
		if (!e) return zi;
		e = e._reactInternals;
		a: {
			if (q(e) !== e || e.tag !== 1) throw Error(a(170));
			var t = e;
			do {
				switch (t.tag) {
					case 3:
						t = t.stateNode.context;
						break a;
					case 1: if (Wi(t.type)) {
						t = t.stateNode.__reactInternalMemoizedMergedChildContext;
						break a;
					}
				}
				t = t.return;
			} while (t !== null);
			throw Error(a(171));
		}
		if (e.tag === 1) {
			var n = e.type;
			if (Wi(n)) return qi(e, n, t);
		}
		return t;
	}
	function au(e, t, n, r, i, a, o, s, c) {
		return e = nu(n, r, !0, e, i, a, o, s, c), e.context = iu(null), n = e.current, r = fl(), i = pl(n), a = Za(r, i), a.callback = t ?? null, Qa(n, a, i), e.current.lanes = i, jt(e, i, r), hl(e, r), e;
	}
	function ou(e, t, n, r) {
		var i = t.current, a = fl(), o = pl(i);
		return n = iu(n), t.context === null ? t.context = n : t.pendingContext = n, t = Za(a, o), t.payload = { element: e }, r = r === void 0 ? null : r, r !== null && (t.callback = r), e = Qa(i, t, o), e !== null && (ml(e, i, o, a), $a(e, i, o)), o;
	}
	function su(e) {
		if (e = e.current, !e.child) return null;
		switch (e.child.tag) {
			case 5: return e.child.stateNode;
			default: return e.child.stateNode;
		}
	}
	function cu(e, t) {
		if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
			var n = e.retryLane;
			e.retryLane = n !== 0 && n < t ? n : t;
		}
	}
	function lu(e, t) {
		cu(e, t), (e = e.alternate) && cu(e, t);
	}
	function uu() {
		return null;
	}
	var du = typeof reportError == "function" ? reportError : function(e) {
		console.error(e);
	};
	function fu(e) {
		this._internalRoot = e;
	}
	pu.prototype.render = fu.prototype.render = function(e) {
		var t = this._internalRoot;
		if (t === null) throw Error(a(409));
		ou(e, t, null, null);
	}, pu.prototype.unmount = fu.prototype.unmount = function() {
		var e = this._internalRoot;
		if (e !== null) {
			this._internalRoot = null;
			var t = e.containerInfo;
			Cl(function() {
				ou(null, e, null, null);
			}), t[Di] = null;
		}
	};
	function pu(e) {
		this._internalRoot = e;
	}
	pu.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = Rt();
			e = {
				blockedOn: null,
				target: e,
				priority: t
			};
			for (var n = 0; n < qt.length && t !== 0 && t < qt[n].priority; n++);
			qt.splice(n, 0, e), n === 0 && Qt(e);
		}
	};
	function mu(e) {
		return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
	}
	function hu(e) {
		return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
	}
	function gu() {}
	function _u(e, t, n, r, i) {
		if (i) {
			if (typeof r == "function") {
				var a = r;
				r = function() {
					var e = su(o);
					a.call(e);
				};
			}
			var o = au(t, r, e, 0, null, !1, !1, "", gu);
			return e._reactRootContainer = o, e[Di] = o.current, ti(e.nodeType === 8 ? e.parentNode : e), Cl(), o;
		}
		for (; i = e.lastChild;) e.removeChild(i);
		if (typeof r == "function") {
			var s = r;
			r = function() {
				var e = su(c);
				s.call(e);
			};
		}
		var c = nu(e, 0, !1, null, null, !1, !1, "", gu);
		return e._reactRootContainer = c, e[Di] = c.current, ti(e.nodeType === 8 ? e.parentNode : e), Cl(function() {
			ou(t, c, n, r);
		}), c;
	}
	function vu(e, t, n, r, i) {
		var a = n._reactRootContainer;
		if (a) {
			var o = a;
			if (typeof i == "function") {
				var s = i;
				i = function() {
					var e = su(o);
					s.call(e);
				};
			}
			ou(t, o, e, i);
		} else o = _u(n, t, e, i, r);
		return su(o);
	}
	Ft = function(e) {
		switch (e.tag) {
			case 3:
				var t = e.stateNode;
				if (t.current.memoizedState.isDehydrated) {
					var n = wt(t.pendingLanes);
					n !== 0 && (Nt(t, n | 1), hl(t, ct()), !($ & 6) && (el = ct() + 500, ta()));
				}
				break;
			case 13: Cl(function() {
				var t = qa(e, 1);
				t !== null && ml(t, e, 1, fl());
			}), lu(e, 1);
		}
	}, It = function(e) {
		if (e.tag === 13) {
			var t = qa(e, 134217728);
			t !== null && ml(t, e, 134217728, fl()), lu(e, 134217728);
		}
	}, Lt = function(e) {
		if (e.tag === 13) {
			var t = pl(e), n = qa(e, t);
			n !== null && ml(n, e, t, fl()), lu(e, t);
		}
	}, Rt = function() {
		return J;
	}, zt = function(e, t) {
		var n = J;
		try {
			return J = e, t();
		} finally {
			J = n;
		}
	}, Me = function(e, t, n) {
		switch (t) {
			case "input":
				if (le(e, n), t = n.name, n.type === "radio" && t != null) {
					for (n = e; n.parentNode;) n = n.parentNode;
					for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + "][type=\"radio\"]"), t = 0; t < n.length; t++) {
						var r = n[t];
						if (r !== e && r.form === e.form) {
							var i = Pi(r);
							if (!i) throw Error(a(90));
							ie(r), le(r, i);
						}
					}
				}
				break;
			case "textarea":
				ge(e, n);
				break;
			case "select": t = n.value, t != null && pe(e, !!n.multiple, t, !1);
		}
	}, Re = Sl, ze = Cl;
	var yu = {
		usingClientEntryPoint: !1,
		Events: [
			Mi,
			Ni,
			Pi,
			Ie,
			Le,
			Sl
		]
	}, bu = {
		findFiberByHostInstance: ji,
		bundleType: 0,
		version: "18.3.1",
		rendererPackageName: "react-dom"
	}, xu = {
		bundleType: bu.bundleType,
		version: bu.version,
		rendererPackageName: bu.rendererPackageName,
		rendererConfig: bu.rendererConfig,
		overrideHookState: null,
		overrideHookStateDeletePath: null,
		overrideHookStateRenamePath: null,
		overrideProps: null,
		overridePropsDeletePath: null,
		overridePropsRenamePath: null,
		setErrorHandler: null,
		setSuspenseHandler: null,
		scheduleUpdate: null,
		currentDispatcherRef: C.ReactCurrentDispatcher,
		findHostInstanceByFiber: function(e) {
			return e = nt(e), e === null ? null : e.stateNode;
		},
		findFiberByHostInstance: bu.findFiberByHostInstance || uu,
		findHostInstancesForRefresh: null,
		scheduleRefresh: null,
		scheduleRoot: null,
		setRefreshHandler: null,
		getCurrentFiber: null,
		reconcilerVersion: "18.3.1-next-f1338f8080-20240426"
	};
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
		var Su = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!Su.isDisabled && Su.supportsFiber) try {
			ht = Su.inject(xu), gt = Su;
		} catch {}
	}
	e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = yu, e.createPortal = function(e, t) {
		var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
		if (!mu(t)) throw Error(a(200));
		return ru(e, t, null, n);
	}, e.createRoot = function(e, t) {
		if (!mu(e)) throw Error(a(299));
		var n = !1, r = "", i = du;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onRecoverableError !== void 0 && (i = t.onRecoverableError)), t = nu(e, 1, !1, null, null, n, !1, r, i), e[Di] = t.current, ti(e.nodeType === 8 ? e.parentNode : e), new fu(t);
	}, e.findDOMNode = function(e) {
		if (e == null) return null;
		if (e.nodeType === 1) return e;
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(a(188)) : (e = Object.keys(e).join(","), Error(a(268, e)));
		return e = nt(t), e = e === null ? null : e.stateNode, e;
	}, e.flushSync = function(e) {
		return Cl(e);
	}, e.hydrate = function(e, t, n) {
		if (!hu(t)) throw Error(a(200));
		return vu(null, e, t, !0, n);
	}, e.hydrateRoot = function(e, t, n) {
		if (!mu(e)) throw Error(a(405));
		var r = n != null && n.hydratedSources || null, i = !1, o = "", s = du;
		if (n != null && (!0 === n.unstable_strictMode && (i = !0), n.identifierPrefix !== void 0 && (o = n.identifierPrefix), n.onRecoverableError !== void 0 && (s = n.onRecoverableError)), t = au(t, null, e, 1, n ?? null, i, !1, o, s), e[Di] = t.current, ti(e), r) for (e = 0; e < r.length; e++) n = r[e], i = n._getVersion, i = i(n._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [n, i] : t.mutableSourceEagerHydrationData.push(n, i);
		return new pu(t);
	}, e.render = function(e, t, n) {
		if (!hu(t)) throw Error(a(200));
		return vu(null, e, t, !1, n);
	}, e.unmountComponentAtNode = function(e) {
		if (!hu(e)) throw Error(a(40));
		return e._reactRootContainer ? (Cl(function() {
			vu(null, null, e, !1, function() {
				e._reactRootContainer = null, e[Di] = null;
			});
		}), !0) : !1;
	}, e.unstable_batchedUpdates = Sl, e.unstable_renderSubtreeIntoContainer = function(e, t, n, r) {
		if (!hu(n)) throw Error(a(200));
		if (e == null || e._reactInternals === void 0) throw Error(a(38));
		return vu(e, t, n, !1, r);
	}, e.version = "18.3.1-next-f1338f8080-20240426";
})), o = /* @__PURE__ */ e(((e, t) => {
	function n() {
		if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = a();
})), s = /* @__PURE__ */ e(((e) => {
	var t = o();
	e.createRoot = t.createRoot, e.hydrateRoot = t.hydrateRoot;
})), c = /* @__PURE__ */ e(((e) => {
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
})), l = /* @__PURE__ */ e(((e, t) => {
	t.exports = c();
})), u = s(), d = n(), f = l();
function p({ workspace: e }) {
	let t = (0, d.useRef)(null), [n, r] = (0, d.useState)(!1);
	return /* @__PURE__ */ (0, f.jsxs)("form", {
		className: "agent-home-prompt",
		onSubmit: e.handleSubmit,
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "agent-home-prompt-shell",
				children: [/* @__PURE__ */ (0, f.jsx)("textarea", {
					value: e.input,
					onChange: (t) => e.setInput(t.target.value),
					onKeyDown: (e) => {
						e.key === "Enter" && !e.shiftKey && (e.preventDefault(), e.currentTarget.form?.requestSubmit());
					},
					placeholder: "오늘 어떤 투자 리서치를 도와드릴까요?",
					rows: 3
				}), /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "agent-home-toolbar",
					children: [
						/* @__PURE__ */ (0, f.jsx)("input", {
							ref: t,
							type: "file",
							multiple: !0,
							hidden: !0,
							onChange: (n) => {
								e.handleFiles(n.currentTarget.files).finally(() => {
									t.current && (t.current.value = "");
								});
							}
						}),
						/* @__PURE__ */ (0, f.jsxs)("div", {
							className: "agent-home-toolbar-left",
							children: [/* @__PURE__ */ (0, f.jsx)("button", {
								type: "button",
								className: "agent-home-icon-btn",
								onClick: () => t.current?.click(),
								"aria-label": "파일 첨부",
								"data-tooltip": "파일 첨부",
								children: "+"
							}), /* @__PURE__ */ (0, f.jsx)("span", {
								className: "agent-home-provider",
								children: e.adapter?.label || e.adapter?.id || "Folio OS"
							})]
						}),
						/* @__PURE__ */ (0, f.jsxs)("div", {
							className: "agent-home-toolbar-right",
							children: [
								/* @__PURE__ */ (0, f.jsx)("button", {
									type: "button",
									className: "agent-home-icon-btn agent-home-advanced-toggle",
									"aria-expanded": n,
									onClick: () => r((e) => !e),
									children: "상세 설정"
								}),
								n && /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [/* @__PURE__ */ (0, f.jsx)("select", {
									"aria-label": "모델",
									value: e.model,
									onChange: (t) => e.persistModel(t.target.value),
									children: e.modelChoices.length > 0 ? e.modelChoices.map((e) => /* @__PURE__ */ (0, f.jsx)("option", {
										value: e.value,
										children: e.label
									}, e.value)) : /* @__PURE__ */ (0, f.jsx)("option", {
										value: "",
										children: "모델 목록 없음"
									})
								}), /* @__PURE__ */ (0, f.jsxs)("select", {
									"aria-label": "노력 단계",
									value: e.effort,
									onChange: (t) => e.setEffort(t.target.value),
									children: [
										/* @__PURE__ */ (0, f.jsx)("option", {
											value: "low",
											children: "낮음"
										}),
										/* @__PURE__ */ (0, f.jsx)("option", {
											value: "medium",
											children: "중간"
										}),
										/* @__PURE__ */ (0, f.jsx)("option", {
											value: "high",
											children: "높음"
										}),
										/* @__PURE__ */ (0, f.jsx)("option", {
											value: "max",
											children: "최대"
										})
									]
								})] }),
								/* @__PURE__ */ (0, f.jsx)("button", {
									className: "agent-home-send",
									type: "submit",
									disabled: e.busy || !e.input.trim(),
									"aria-label": "전송",
									"data-tooltip": "전송",
									children: e.busy ? "..." : "↑"
								})
							]
						})
					]
				})]
			}),
			e.settingsMessage && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "agent-home-notice",
				children: e.settingsMessage
			}),
			e.attachments.length > 0 && /* @__PURE__ */ (0, f.jsx)("div", {
				className: "agent-home-attachments",
				children: e.attachments.map((t) => /* @__PURE__ */ (0, f.jsxs)("span", { children: [
					t.name,
					t.imageData ? /* @__PURE__ */ (0, f.jsx)("em", {
						className: "agent-attachment-note",
						children: "이미지 · Agent가 직접 읽음"
					}) : null,
					!t.imageData && !t.content ? /* @__PURE__ */ (0, f.jsx)("em", {
						className: "agent-attachment-note",
						children: "본문 미포함"
					}) : null,
					/* @__PURE__ */ (0, f.jsx)("button", {
						type: "button",
						"aria-label": `${t.name} 첨부 제거`,
						onClick: () => e.setAttachments((e) => e.filter((e) => e.name !== t.name)),
						children: "×"
					})
				] }, t.name))
			}),
			e.quickStatus && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "agent-home-notice",
				children: e.quickStatus
			}),
			e.error && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "agent-home-error",
				children: e.error
			})
		]
	});
}
//#endregion
//#region src/app/AgentMessageContent.tsx
function m(e) {
	let t = [], n = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g, r = 0;
	for (let i of e.matchAll(n)) i.index !== void 0 && (i.index > r && t.push({
		type: "text",
		value: e.slice(r, i.index)
	}), i[2] ? t.push({
		type: "strong",
		value: i[2]
	}) : i[3] ? t.push({
		type: "code",
		value: i[3]
	}) : i[4] && i[5] && t.push({
		type: "link",
		label: i[4],
		href: i[5]
	}), r = i.index + i[0].length);
	return r < e.length && t.push({
		type: "text",
		value: e.slice(r)
	}), t;
}
function h(e) {
	return m(e).map((e, t) => e.type === "strong" ? /* @__PURE__ */ (0, f.jsx)("strong", { children: e.value }, t) : e.type === "code" ? /* @__PURE__ */ (0, f.jsx)("code", { children: e.value }, t) : e.type === "link" ? /^https?:\/\//i.test(e.href) ? /* @__PURE__ */ (0, f.jsx)("a", {
		href: e.href,
		target: "_blank",
		rel: "noreferrer",
		children: e.label
	}, t) : /* @__PURE__ */ (0, f.jsx)("code", {
		title: e.href,
		children: e.label
	}, t) : /* @__PURE__ */ (0, f.jsx)("span", { children: e.value }, t));
}
function g(e, t) {
	e.length &&= (t.push(/* @__PURE__ */ (0, f.jsx)("p", { children: h(e.join(" ")) }, `p-${t.length}`)), 0);
}
function _({ text: e = "" }) {
	let t = [], n = [], r = [], i = "";
	function a() {
		if (!r.length) return;
		let e = r.map((e, t) => /* @__PURE__ */ (0, f.jsx)("li", { children: h(e) }, t));
		t.push(i === "ol" ? /* @__PURE__ */ (0, f.jsx)("ol", { children: e }, `ol-${t.length}`) : /* @__PURE__ */ (0, f.jsx)("ul", { children: e }, `ul-${t.length}`)), r = [], i = "";
	}
	for (let o of e.replace(/\r\n/g, "\n").split("\n")) {
		let e = o.trim();
		if (!e) {
			g(n, t), a();
			continue;
		}
		let s = e.match(/^(#{2,4})\s+(.+)$/);
		if (s) {
			g(n, t), a(), t.push(/* @__PURE__ */ (0, f.jsx)("h4", { children: h(s[2]) }, `h-${t.length}`));
			continue;
		}
		let c = e.match(/^\d+[.)]\s+(.+)$/);
		if (c) {
			g(n, t), i && i !== "ol" && a(), i = "ol", r.push(c[1]);
			continue;
		}
		let l = e.match(/^[-*•]\s+(.+)$/);
		if (l) {
			g(n, t), i && i !== "ul" && a(), i = "ul", r.push(l[1]);
			continue;
		}
		if (r.length) {
			r[r.length - 1] = `${r[r.length - 1]} ${e}`;
			continue;
		}
		n.push(e);
	}
	return g(n, t), a(), /* @__PURE__ */ (0, f.jsx)("div", {
		className: "agent-chat-markdown",
		children: t
	});
}
function v({ state: e = "pending", title: t, meta: n }) {
	return /* @__PURE__ */ (0, f.jsxs)("div", {
		className: `agent-run-card ${e}`,
		children: [/* @__PURE__ */ (0, f.jsx)("span", {
			className: "agent-run-icon",
			"aria-hidden": "true"
		}), /* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: t }), n && /* @__PURE__ */ (0, f.jsx)("span", { children: n })] })]
	});
}
//#endregion
//#region src/api.ts
var y = {
	us: "US",
	kr: "KR",
	europe: "EU",
	jp: "JP",
	US: "US",
	KR: "KR",
	EUROPE: "EU",
	JP: "JP"
}, b = {
	us: "미국",
	kr: "한국",
	europe: "유럽",
	jp: "일본",
	US: "미국",
	KR: "한국",
	EUROPE: "유럽",
	JP: "일본"
}, x = "rules_on_engine_failure", S = /* @__PURE__ */ "id.jobId.category.kind.taskType.labelCode.status.progress.messageCode.createdAt.startedAt.updatedAt.finishedAt.errorCode.generationMode.adapter.requestedMode.mode.attemptedEngine.finalEngine.fallbackReason.artifactTypes.artifactCount.proposalId.proposalStatus.resultStatus".split("."), C = [
	"schemaVersion",
	"storeRevision",
	"jobsStoreRevision",
	"retention",
	"total",
	"entries"
], w = ["maxEntries", "maxDays"], T = /* @__PURE__ */ new Set(["companion", "task"]), E = /* @__PURE__ */ new Set([
	"index",
	"rss",
	"setup",
	"agent_bridge",
	"agent_cli_install",
	"briefing",
	"company_analysis",
	"topic_report",
	"market_state_snapshot"
]), D = /* @__PURE__ */ new Set([
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
]), O = /* @__PURE__ */ new Set([
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
]), k = /* @__PURE__ */ new Set([
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
]), A = /* @__PURE__ */ new Set([
	"llm_api",
	"llm_cli",
	"rules",
	"none"
]), j = /* @__PURE__ */ new Set([
	"auto",
	"codex",
	"claude",
	"antigravity",
	"openai_api",
	"gemini_api",
	"claude_api",
	"rules",
	"none"
]), M = /* @__PURE__ */ new Set(["direct", "cli"]), N = /* @__PURE__ */ new Set([
	"collect",
	"index",
	"install",
	"answer",
	"generate",
	"revise",
	"fallback"
]), P = /* @__PURE__ */ new Set([
	"api",
	"cli",
	"rules",
	"none"
]), F = /* @__PURE__ */ new Set([
	"engine_unavailable",
	"engine_failed",
	"confirmed_zero_evidence"
]), I = /* @__PURE__ */ new Set([
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
]), L = /* @__PURE__ */ new Set([
	"pending",
	"applying",
	"applied",
	"rejected",
	"stale",
	"conflict",
	"failed_apply",
	"unavailable"
]), R = /* @__PURE__ */ new Set([
	"done",
	"cancelled",
	"failed"
]), z = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/;
function B(e, t) {
	if (!W(e)) return !1;
	let n = Object.keys(e).sort(), r = [...t].sort();
	return n.length === r.length && n.every((e, t) => e === r[t]);
}
function V(e) {
	if (!B(e, S)) return !1;
	let t = (e, t) => e === null || t.has(e), n = (e) => e === null || typeof e == "string" && z.test(e);
	return typeof e.id == "string" && /^wl_[0-9a-f]{24}$/.test(e.id) && typeof e.jobId == "string" && T.has(e.category) && E.has(e.kind) && D.has(e.taskType) && O.has(e.labelCode) && k.has(e.status) && Number.isInteger(e.progress) && e.progress >= 0 && e.progress <= 100 && k.has(e.messageCode) && typeof e.createdAt == "string" && z.test(e.createdAt) && typeof e.updatedAt == "string" && z.test(e.updatedAt) && n(e.startedAt) && n(e.finishedAt) && t(e.errorCode, I) && A.has(e.generationMode) && j.has(e.adapter) && t(e.requestedMode, M) && N.has(e.mode) && t(e.attemptedEngine, P) && t(e.finalEngine, P) && t(e.fallbackReason, F) && Array.isArray(e.artifactTypes) && e.artifactTypes.every((e) => typeof e == "string") && Number.isInteger(e.artifactCount) && e.artifactCount >= 0 && (e.proposalId === null || typeof e.proposalId == "string") && t(e.proposalStatus, L) && t(e.resultStatus, R);
}
function ee(e) {
	if (!B(e, C) || e.schemaVersion !== 1 || !Number.isInteger(e.storeRevision) || !Number.isInteger(e.jobsStoreRevision) || !Number.isInteger(e.total) || !Array.isArray(e.entries) || !e.entries.every(V) || !B(e.retention, w) || e.retention.maxEntries !== 200 || e.retention.maxDays !== 30) throw Error("work_log_contract_invalid");
	return e;
}
var H = class extends Error {
	path;
	status;
	code;
	payload;
	name = "ApiRequestError";
	constructor(e, t, n, r) {
		super(`${e} failed: ${t}${n ? ` (${n})` : ""}`), this.path = e, this.status = t, this.code = n, this.payload = r;
	}
};
function U(e) {
	return e === "queued" || e === "running" || e === "cancel_requested" || e === "committing";
}
function W(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
async function te(e) {
	try {
		return await e.json();
	} catch {
		return null;
	}
}
async function ne(e, t) {
	let n = await fetch(e, t), r = await te(n);
	if (!n.ok) {
		let t = W(r) ? r : null, i = t?.error, a = typeof i == "string" ? i : "request_failed";
		throw new H(e, n.status, a, t);
	}
	if (r === null) throw Error(`${e} returned an empty response`);
	return r;
}
async function G(e, t = {}) {
	return ne(e, {
		headers: { "Content-Type": "application/json" },
		signal: t.signal
	});
}
async function K(e, t, n = {}) {
	return ne(e, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(t),
		signal: n.signal
	});
}
async function re(e, t = {}) {
	return G(`/api/investment-notes/${encodeURIComponent(e)}/intelligence`, t);
}
async function ie(e, t, n = {}) {
	return K(`/api/theses/${encodeURIComponent(e)}/review/checkpoints`, t, n);
}
async function ae(e, t = {}) {
	return K(`/api/theses/${encodeURIComponent(e)}/delta`, { period: "90d" }, t);
}
async function oe(e, t, n = {}) {
	return ne(e, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(t),
		signal: n.signal
	});
}
async function se(e, t, n = {}) {
	return ne(e, {
		method: "DELETE",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(t),
		signal: n.signal
	});
}
//#endregion
//#region src/app/agentProposalLifecycle.ts
var ce = "folio:proposal-lifecycle", le = 1e3, ue = 12e3, de = "수정 제안을 불러오지 못했습니다. Agent 작업 기록에서 다시 확인해 주세요.", fe = /* @__PURE__ */ new Set([
	"applied",
	"rejected",
	"stale",
	"conflict",
	"failed_apply"
]), pe = /* @__PURE__ */ new Set([
	"pending",
	"applying",
	...fe
]), me = /* @__PURE__ */ new Set([
	"briefing",
	"company_analysis",
	"topic_report"
]), he = /* @__PURE__ */ new Set([
	"both",
	"us",
	"kr",
	"none"
]), ge = [
	"marketScope",
	"proposalId",
	"reportId",
	"reportKind",
	"status",
	"targetRevision"
].sort(), _e = ["hash", "number"].sort(), ve = /^[0-9a-f]{64}$/, ye = /^(?:[0-9a-f]{12}|[0-9a-f]{32})$/, be = {
	proposal: null,
	proposalStatus: "",
	notice: ""
};
function xe(e) {
	return String(e || "").slice(0, le);
}
function Se(e) {
	return String(e || "").slice(0, ue);
}
function Ce() {
	throw Error("proposal_contract_invalid");
}
function we(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function Te(e, t) {
	if (!we(e)) return !1;
	let n = Object.keys(e).sort();
	return n.length === t.length && n.every((e, n) => e === t[n]);
}
function Ee(e) {
	return typeof e == "string" && e.trim().length > 0;
}
function De(e) {
	return typeof e == "string" && pe.has(e);
}
function Oe(e) {
	return typeof e == "string" && me.has(e);
}
function ke(e) {
	return typeof e == "string" && he.has(e);
}
function Ae() {
	return {
		proposal: null,
		proposalStatus: "",
		notice: de
	};
}
function je(e, t) {
	return (!we(e) || e.schemaVersion !== 2 || e.id !== t || !ye.test(t) || e.status !== "pending" && e.status !== "applying" || !Oe(e.reportKind) || !Ee(e.reportId) || !ke(e.marketScope) || typeof e.summary != "string" || typeof e.diff != "string") && Ce(), {
		proposal: {
			id: t,
			summary: e.summary,
			diff: e.diff,
			artifactKind: e.reportKind,
			artifactId: e.reportId,
			marketScope: e.marketScope
		},
		proposalStatus: e.status,
		notice: ""
	};
}
async function Me(e, t = { get: (e) => G(e) }) {
	if (!we(e) || !("proposalId" in e) || e.proposalId === null || e.proposalId === "") return be;
	if (typeof e.proposalId != "string" || !ye.test(e.proposalId)) return Ae();
	let n = e.proposalId;
	try {
		return je(await t.get(`/api/agent/proposals/${encodeURIComponent(n)}`), n);
	} catch {
		return Ae();
	}
}
function Ne(e) {
	return e === null ? null : ((!Te(e, _e) || typeof e.number != "number" || !Number.isInteger(e.number) || e.number < 1 || typeof e.hash != "string" || !ve.test(e.hash)) && Ce(), {
		number: e.number,
		hash: e.hash
	});
}
function Pe(e, t) {
	(!we(e) || !De(e.status) || !Oe(e.reportKind) || !ke(e.marketScope)) && Ce();
	let n = Ee(e.proposalId) ? e.proposalId : t && Ee(e.id) ? e.id : Ce();
	return Ee(e.reportId) || Ce(), {
		proposalId: n,
		status: e.status,
		reportKind: e.reportKind,
		reportId: e.reportId,
		marketScope: e.marketScope,
		targetRevision: Ne(e.targetRevision)
	};
}
function Fe(e, t) {
	Te(e, ge) || Ce();
	let n = Pe(e, !1), r = t === "approve" ? "applied" : t === "reject" ? "rejected" : Ce();
	return n.status !== r && Ce(), n;
}
async function Ie(e, t, n) {
	(!Ee(e) || t !== "approve" && t !== "reject") && Ce();
	let r = `/api/agent/proposals/${encodeURIComponent(e)}`;
	try {
		return Fe(await n.post(r, { action: t }), t);
	} catch (e) {
		if (!(e instanceof H) || e.status >= 200 && e.status < 300) throw e;
		let t;
		try {
			t = Pe(await n.get(r), !0);
		} catch {
			throw e;
		}
		if (!fe.has(t.status)) throw e;
		return t;
	}
}
function Le(e, t) {
	return Ie(e, t, {
		post: (e, t) => K(e, t),
		get: (e) => G(e)
	});
}
function Re(e) {
	window.dispatchEvent(new CustomEvent(ce, { detail: e }));
}
function ze(e, t) {
	return e.status !== "applied" || !t || t.reportKind !== e.reportKind || String(t.reportId || "") !== e.reportId ? !1 : e.reportKind !== "briefing" || String(t.marketScope || "") === e.marketScope;
}
//#endregion
//#region src/app/agentWorkspace/AgentThread.tsx
function Be({ workspace: e }) {
	return e.hasConversation ? /* @__PURE__ */ (0, f.jsxs)("section", {
		className: "agent-home-thread agent-home-right",
		"aria-label": "AI Agent 대화",
		children: [/* @__PURE__ */ (0, f.jsxs)("div", {
			className: "agent-home-section-head",
			children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("p", {
				className: "section-kicker",
				children: "Agent Thread"
			}), /* @__PURE__ */ (0, f.jsx)("h2", { children: "현재 대화" })] }), /* @__PURE__ */ (0, f.jsx)("button", {
				type: "button",
				onClick: e.startNewConversation,
				children: "새 대화"
			})]
		}), /* @__PURE__ */ (0, f.jsx)("div", {
			className: "agent-home-log",
			"aria-live": "polite",
			children: e.messages.map((t) => /* @__PURE__ */ (0, f.jsxs)("article", {
				className: `agent-home-message ${t.role}${t.pending ? " pending" : ""}`,
				children: [/* @__PURE__ */ (0, f.jsxs)("div", {
					className: "agent-home-message-body",
					children: [
						t.runTitle && /* @__PURE__ */ (0, f.jsx)(v, {
							state: t.runState === "still-running" ? "pending" : t.runState,
							title: t.runTitle,
							meta: t.runMeta
						}),
						t.runState === "still-running" && t.jobId && /* @__PURE__ */ (0, f.jsx)("div", {
							"data-qa": "agent-job-still-running",
							children: /* @__PURE__ */ (0, f.jsx)("button", {
								type: "button",
								"data-qa": "agent-job-resume",
								onClick: () => void e.resumeAgentJob(t.id, t.jobId),
								children: "상태 다시 확인"
							})
						}),
						t.text && /* @__PURE__ */ (0, f.jsx)(_, { text: t.text }),
						t.notice && /* @__PURE__ */ (0, f.jsx)("p", {
							className: "agent-home-notice",
							children: t.notice
						}),
						(t.attachments || []).length > 0 && /* @__PURE__ */ (0, f.jsx)("div", {
							className: "agent-home-attachments",
							children: t.attachments?.map((e) => /* @__PURE__ */ (0, f.jsx)("span", { children: e }, e))
						})
					]
				}), t.proposal && /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "agent-home-proposal",
					children: [
						/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: "수정 제안" }), /* @__PURE__ */ (0, f.jsxs)("span", { children: [
							t.proposal.artifactKind,
							" ",
							t.proposal.artifactId
						] })] }),
						t.proposalStatus === "pending" && t.proposal.summary && /* @__PURE__ */ (0, f.jsx)("p", {
							"data-qa": "proposal-summary",
							children: xe(t.proposal.summary)
						}),
						t.proposalStatus === "pending" && t.proposal.diff && /* @__PURE__ */ (0, f.jsxs)("details", { children: [/* @__PURE__ */ (0, f.jsx)("summary", { children: "diff 보기" }), /* @__PURE__ */ (0, f.jsx)("pre", {
							"data-qa": "proposal-diff",
							children: Se(t.proposal.diff)
						})] }),
						t.proposalStatus === "pending" ? /* @__PURE__ */ (0, f.jsxs)("div", {
							className: "agent-home-proposal-actions",
							children: [/* @__PURE__ */ (0, f.jsx)("button", {
								type: "button",
								"data-qa": "proposal-approve",
								onClick: () => e.handleProposalAction(t.id, t.proposal.id, "approve"),
								children: "승인"
							}), /* @__PURE__ */ (0, f.jsx)("button", {
								type: "button",
								"data-qa": "proposal-reject",
								onClick: () => e.handleProposalAction(t.id, t.proposal.id, "reject"),
								children: "거절"
							})]
						}) : /* @__PURE__ */ (0, f.jsxs)("p", {
							className: "agent-home-notice",
							"data-qa": t.proposalStatus === "applied" ? "wb-happy-applied" : t.proposalStatus === "rejected" ? "wb-f1-terminal-rejected" : t.proposalStatus === "stale" ? "wb-f1-terminal-stale" : "proposal-terminal",
							children: ["상태: ", t.proposalStatus]
						})
					]
				})]
			}, t.id))
		})]
	}) : null;
}
//#endregion
//#region src/app/agentWorkspace/presenters.ts
var Ve = /* @__PURE__ */ new Set([
	"codex",
	"claude",
	"antigravity"
]);
function He(e) {
	return e === "high" ? "높음" : e === "low" ? "낮음" : e === "max" ? "최대" : "중간";
}
function Ue(e) {
	return `${Math.max(1, Math.round((Date.now() - e) / 1e3))}초`;
}
function We(e) {
	let t = e?.provider && Ve.has(e.provider) ? e.provider : e?.selectedAdapter || "";
	return e?.adapters?.find((e) => e.id === t) || null;
}
function Ge(e) {
	return e?.modelChoices || [];
}
function Ke(e) {
	let t = Ge(e);
	return t.length ? t.some((t) => t.value === e?.model) ? String(e?.model || "") : t[0].value : "";
}
function qe(e) {
	let t = e;
	return !!(t?.id && ["queued", "running"].includes(t.status));
}
function Je(e) {
	let t = String(e.view || "").trim(), n = e.marketScope === "us" || e.marketScope === "kr" || e.marketScope === "both" ? e.marketScope : e.scope === "us" || e.scope === "kr" || e.scope === "both" ? e.scope : "both";
	return t === "briefing" && /^\d{4}-\d{2}-\d{2}$/.test(String(e.date || "")) ? `#/briefing/${e.date}/${n}` : `#/${{
		review: "dashboard",
		dashboard: "dashboard",
		briefing: "briefing",
		rssfeed: "rss",
		memory: "market-memory",
		analysis: "analysis",
		topicrpt: "deep-research",
		watchlist: "watchlist",
		settings: "settings"
	}[t] || "dashboard"}`;
}
function Ye(e, t) {
	return `${e.view || "report"}-${e.date || ""}-${e.title || t}`;
}
//#endregion
//#region src/app/agentContext.ts
var Xe = /* @__PURE__ */ new Map(), Ze = "";
function Qe(e) {
	let t = { ...e };
	return window.FolioAgent = {
		...window.FolioAgent || {},
		currentContext: t
	}, t;
}
function q(e, t = {}) {
	let n = { ...t };
	return Xe.set(e, n), Ze === e ? Qe(n) : n;
}
function $e(e, t = {}) {
	return q(e, {
		...Xe.get(e) || {},
		...t
	});
}
function et(e) {
	Xe.delete(e), Ze === e && Qe({});
}
function tt(e, t = {}) {
	Ze = e, Xe.has(e) || Xe.set(e, { ...t });
	let n = { ...Xe.get(e) || {} };
	return delete n.selectedText, delete n.visibleSection, Xe.set(e, n), Qe(n);
}
function nt(e = {}) {
	Ze ? $e(Ze, e) : Qe(e), window.FolioBridge?.openAgentDock?.(e);
}
//#endregion
//#region src/app/agentPolling.ts
var rt = 1e3, it = 12e4, at = class extends Error {
	job;
	name = "AgentPollTimeout";
	constructor(e) {
		super("작업이 아직 실행 중입니다. 서버 작업은 계속되며 나중에 상태를 다시 확인할 수 있습니다."), this.job = e;
	}
}, ot = class extends Error {
	job;
	name = "AgentJobTerminalError";
	constructor(e) {
		super(e.message || e.error || `Agent 작업이 ${e.status} 상태로 종료되었습니다.`), this.job = e;
	}
};
function st(e, t, n) {
	let r = e.get(t);
	r !== n && r?.abort(), e.set(t, n);
}
function ct(e, t, n) {
	return e.get(t) === n && (e.delete(t), !0);
}
function lt(e, t) {
	return new Promise((n, r) => {
		if (t?.aborted) {
			r(new DOMException("Polling aborted", "AbortError"));
			return;
		}
		let i = window.setTimeout(() => {
			t?.removeEventListener("abort", a), n();
		}, e), a = () => {
			window.clearTimeout(i), r(new DOMException("Polling aborted", "AbortError"));
		};
		t?.addEventListener("abort", a, { once: !0 });
	});
}
async function ut(e, t = {}) {
	let { signal: n, timeoutMs: r = it, intervalMs: i = rt } = t, a = Date.now() + r, o = e;
	for (; U(o.status);) {
		if (Date.now() >= a) throw new at(o);
		await lt(i, n), o = await G(`/api/jobs/${encodeURIComponent(o.id)}`, { signal: n });
	}
	if (o.status !== "done") throw new ot(o);
	return o;
}
function dt(e, t = {}) {
	return ut(e, {
		...t,
		timeoutMs: Infinity
	});
}
//#endregion
//#region src/app/agentWorkspace/storage.ts
var ft = "folio.agentHome.thread.v1", pt = {
	id: "welcome",
	role: "assistant",
	text: "무엇을 조사하거나 정리할까요? 질문으로 시작해도 되고, 보고서 수정 작업을 지시해도 됩니다.",
	notice: "저장 변경은 proposal 승인 전에는 반영되지 않습니다."
};
function mt(e) {
	return e.id === "welcome" || e.variant === "welcome";
}
function ht(e) {
	return e.filter((e) => !mt(e)).map((e) => ({
		...e,
		pending: !1,
		text: e.pending ? `${e.text}\n\n이전 세션에서 완료 여부를 확인하지 못했습니다.` : e.text
	})).slice(-80);
}
function gt() {
	if (typeof window > "u") return [pt];
	try {
		let e = window.localStorage.getItem(ft);
		if (!e) return [pt];
		let t = JSON.parse(e), n = Array.isArray(t?.messages) ? t.messages.filter((e) => e?.role === "user" || e?.role === "assistant") : [];
		return n.length ? [pt, ...n] : [pt];
	} catch {
		return [pt];
	}
}
var _t = gt(), vt = JSON.stringify(ht(_t)), yt = /* @__PURE__ */ new Set();
function bt() {
	let e = [..._t];
	yt.forEach((t) => t(e));
}
function xt() {
	return [..._t];
}
function St(e) {
	let t = ht(e), n = JSON.stringify(t);
	if (n !== vt) {
		if (_t = e.length ? [...e] : [pt], vt = n, typeof window < "u") try {
			t.length ? window.localStorage.setItem(ft, JSON.stringify({
				version: 1,
				updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
				messages: t
			})) : window.localStorage.removeItem(ft);
		} catch {}
		bt();
	}
}
function Ct() {
	if (_t = [pt], vt = "[]", typeof window < "u") try {
		window.localStorage.removeItem(ft);
	} catch {}
	bt();
}
function wt(e) {
	return yt.add(e), () => {
		yt.delete(e);
	};
}
function Tt() {
	return typeof window > "u" ? !1 : !!window.localStorage.getItem("folio.agentHome.thread.v1") && !window.localStorage.getItem("folio.consultation.legacyNotice.v1");
}
typeof window < "u" && window.addEventListener("storage", (e) => {
	e.key === "folio.agentHome.thread.v1" && (_t = gt(), vt = JSON.stringify(ht(_t)), bt());
});
//#endregion
//#region src/app/agentWorkspace/useAgentWorkspace.ts
var Et = 3, Dt = 2e5, Ot = 4e3, kt = 12582912;
function At() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
async function jt(e) {
	return ut(e);
}
async function Mt(e) {
	let t = new Uint8Array(await e.arrayBuffer()), n = "";
	for (let e = 0; e < t.length; e += 32768) n += String.fromCharCode(...t.subarray(e, e + 32768));
	return btoa(n);
}
async function Nt(e) {
	if (e.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp)$/i.test(e.name)) return {
		name: e.name.slice(0, 120),
		size: e.size,
		content: "",
		imageData: e.size <= kt ? await Mt(e) : ""
	};
	let t = e.type.startsWith("text/") || /\.(md|txt|csv|json)$/i.test(e.name) ? await e.text() : "";
	return {
		name: e.name.slice(0, 120),
		size: e.size,
		content: t.slice(0, Ot)
	};
}
function J(e = "agent_home") {
	let [t, n] = (0, d.useState)(() => xt()), [r, i] = (0, d.useState)(""), [a, o] = (0, d.useState)(""), [s, c] = (0, d.useState)(null), [l, u] = (0, d.useState)(""), [f, p] = (0, d.useState)("medium"), [m, h] = (0, d.useState)([]), [g, _] = (0, d.useState)([]), [v, y] = (0, d.useState)(0), b = (0, d.useRef)(/* @__PURE__ */ new Map()), [x, S] = (0, d.useState)(""), [C, w] = (0, d.useState)(""), [T, E] = (0, d.useState)(!1), [D, O] = (0, d.useState)(""), k = Tt();
	(0, d.useEffect)(() => {
		let t = e === "agent_home" ? "home" : "office";
		return q(t, {
			surface: e,
			viewId: t
		}), () => et(t);
	}, [e]), (0, d.useEffect)(() => wt(n), []), (0, d.useEffect)(() => {
		St(t);
	}, [t]);
	let A = (0, d.useCallback)((e, t = !1) => {
		let n = We(e);
		c(e), u(e.message || ""), o((e) => {
			let r = Ke(n);
			return t && Ge(n).some((t) => t.value === e) ? e : r;
		});
	}, []), j = (0, d.useCallback)(async (e = !1) => {
		let t = await G(`/api/agent-bridge/settings${e ? "?refresh=true" : ""}`);
		A(t, !0);
	}, [A]);
	(0, d.useEffect)(() => {
		let e = !0;
		return G("/api/agent-bridge/settings").then((t) => {
			e && A(t);
		}).catch((t) => {
			e && u(t instanceof Error ? t.message : "Agent 설정을 불러오지 못했습니다.");
		}), () => {
			e = !1;
		};
	}, [A]), (0, d.useEffect)(() => {
		let e = (e) => {
			let t = e.detail;
			t ? A(t) : j().catch((e) => {
				u(e instanceof Error ? e.message : "Agent 설정을 불러오지 못했습니다.");
			});
		};
		return window.addEventListener("folio:agent-settings-updated", e), () => window.removeEventListener("folio:agent-settings-updated", e);
	}, [A, j]), (0, d.useEffect)(() => {
		let e = !0;
		return Promise.allSettled([G("/api/dashboard"), G("/api/investment-review")]).then((t) => {
			if (!e) return;
			let n = t[0].status === "fulfilled" ? t[0].value : null, r = [...(t[1].status === "fulfilled" ? t[1].value : null)?.recentReports || [], ...n?.briefings || []], i = /* @__PURE__ */ new Set();
			_(r.filter((e, t) => {
				let n = `${e.view || ""}:${e.date || ""}:${e.title || t}`;
				return !i.has(n) && (i.add(n), !0);
			}).slice(0, 3));
		}), () => {
			e = !1;
		};
	}, []);
	let M = (0, d.useCallback)(() => y((e) => e + 1), []);
	function N() {
		Ct(), n(xt()), i(""), h([]), O(""), w("");
	}
	async function P(t) {
		t.preventDefault();
		let o = r.trim();
		if (!o || T) return;
		let c = {
			id: At(),
			role: "user",
			text: o,
			attachments: m.map((e) => e.name),
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		}, l = At(), u = Date.now(), d = We(s), p = d?.label || "Agent", g = a || d?.model || "model";
		n((e) => [
			...e,
			c,
			{
				id: l,
				role: "assistant",
				text: "",
				pending: !0,
				runState: "pending",
				runTitle: `${p} 세션 시작`,
				runMeta: `${g} · ${He(f)} · on-request`,
				createdAt: new Date(u).toISOString()
			}
		]), i(""), O(""), E(!0);
		let _ = null;
		try {
			let t = await K("/api/agent/chat", {
				message: o,
				context: { surface: e },
				options: {
					model: a,
					effort: f,
					attachments: m
				}
			});
			_ = new AbortController(), st(b.current, l, _);
			let r = await ut(t, { signal: _.signal });
			ct(b.current, l, _);
			let i = r.result || {}, s = await Me(i);
			M(), n((e) => e.map((e) => e.id === l ? {
				...e,
				text: i.reply || r.message || "Agent가 응답을 반환하지 않았습니다.",
				notice: [i.notice, s.notice].filter(Boolean).join(" "),
				pending: !1,
				proposal: s.proposal,
				proposalStatus: s.proposalStatus,
				runState: "done",
				runTitle: `${p} 응답`,
				runMeta: `${g} · ${He(f)} · ${Ue(u)}`
			} : e)), h([]);
		} catch (e) {
			if (_ && ct(b.current, l, _), e instanceof at) {
				n((t) => t.map((t) => t.id === l ? {
					...t,
					text: e.message,
					pending: !1,
					runState: "still-running",
					runTitle: `${p} 계속 실행 중`,
					runMeta: `${g} · ${He(f)} · ${Ue(u)}`,
					jobId: e.job.id
				} : t));
				return;
			}
			let t = e instanceof Error ? e.message : "Agent 요청에 실패했습니다.";
			O(t), n((e) => e.map((e) => e.id === l ? {
				...e,
				text: t,
				pending: !1,
				runState: "error",
				runTitle: `${p} 오류`,
				runMeta: `${g} · ${He(f)}`
			} : e));
		} finally {
			E(!1);
		}
	}
	async function F(e) {
		if (O(""), w(""), e === "analysis" || e === "deep-research") {
			window.location.hash = e === "analysis" ? "#/analysis" : "#/deep-research";
			return;
		}
		S(e);
		try {
			if (e === "rss") {
				w("RSS 수집을 시작했습니다.");
				let e = await K("/api/rssarchive/import", {});
				qe(e) && await jt(e), M(), w("RSS 수집이 끝났습니다."), window.location.hash = "#/rss";
				return;
			}
			w("오늘 브리핑을 생성하는 중입니다.");
			let t = await K("/api/briefings", {
				marketScope: "both",
				briefingType: "default"
			}), n = "";
			if (qe(t)) {
				let e = await jt(t);
				n = e.result?.date || e.result?.artifactId || "";
			} else n = t.date || "";
			M(), w(n ? "오늘 브리핑을 생성했습니다." : "브리핑 생성이 끝났습니다."), window.location.hash = n ? `#/briefing/${n}/both` : "#/briefing";
		} catch (e) {
			let t = e instanceof Error ? e.message : "빠른 실행에 실패했습니다.";
			O(t), w(t);
		} finally {
			S("");
		}
	}
	async function I(e) {
		if (!e) return;
		O("");
		let t = [...m];
		for (let n of Array.from(e)) {
			if (t.length >= Et) {
				O(`첨부는 최대 ${Et}개까지 가능합니다.`);
				break;
			}
			if (n.size > Dt) {
				O(`${n.name}은 200KB를 초과해 제외했습니다.`);
				continue;
			}
			t.push(await Nt(n));
		}
		h(t);
	}
	async function L(e, t) {
		let r = new AbortController();
		st(b.current, e, r), n((t) => t.map((t) => t.id === e ? {
			...t,
			pending: !0,
			runState: "pending",
			runTitle: "Agent 상태 다시 확인 중"
		} : t));
		try {
			let i = await ut(await G(`/api/jobs/${encodeURIComponent(t)}`, { signal: r.signal }), { signal: r.signal }), a = i.result || {}, o = await Me(a);
			M(), n((t) => t.map((t) => t.id === e ? {
				...t,
				text: a.reply || i.message || "Agent가 응답을 반환하지 않았습니다.",
				notice: [a.notice, o.notice].filter(Boolean).join(" "),
				proposal: o.proposal,
				proposalStatus: o.proposalStatus,
				pending: !1,
				runState: "done",
				runTitle: "Agent 응답",
				jobId: void 0
			} : t));
		} catch (t) {
			t instanceof at ? n((n) => n.map((n) => n.id === e ? {
				...n,
				text: t.message,
				pending: !1,
				runState: "still-running",
				runTitle: "Agent 계속 실행 중",
				jobId: t.job.id
			} : n)) : t instanceof DOMException && t.name === "AbortError" || n((n) => n.map((n) => n.id === e ? {
				...n,
				text: t instanceof Error ? t.message : "Agent 상태 확인에 실패했습니다.",
				pending: !1,
				runState: "error",
				runTitle: "Agent 오류"
			} : n));
		} finally {
			ct(b.current, e, r);
		}
	}
	async function R(e, t, r) {
		O("");
		try {
			let i = await Le(t, r);
			n((t) => t.map((t) => t.id === e ? {
				...t,
				proposalStatus: i.status
			} : t)), Re(i), M();
		} catch (e) {
			O(e instanceof Error ? e.message : "제안 처리에 실패했습니다.");
		}
	}
	let z = We(s), B = Ge(z), V = t.some((e) => e.id !== "welcome");
	async function ee(e) {
		if (o(e), !(!z?.id || !e)) try {
			let t = Object.fromEntries((s?.adapters || []).map((e) => [e.id, e.model || ""]));
			t[z.id] = e;
			let n = await K("/api/agent-bridge/settings", {
				provider: z.id,
				models: t
			});
			A(n, !0), window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: n }));
		} catch (e) {
			O(e instanceof Error ? e.message : "모델 설정 저장에 실패했습니다.");
		}
	}
	return {
		messages: t,
		input: r,
		setInput: i,
		model: a,
		effort: f,
		setEffort: p,
		attachments: m,
		setAttachments: h,
		recentReports: g || [],
		workLogRefreshKey: v,
		quickBusy: x,
		quickStatus: C,
		busy: T,
		error: D,
		settingsMessage: l,
		adapter: z,
		modelChoices: B,
		hasConversation: V,
		legacyConsultationImportAvailable: k,
		handleSubmit: P,
		handleFiles: I,
		handleProposalAction: R,
		resumeAgentJob: L,
		persistModel: ee,
		runQuickAction: F,
		startNewConversation: N
	};
}
//#endregion
//#region src/app/workLogCopy.ts
var Pt = {
	companion: "Agent와 대화",
	briefing: "일일 브리핑 생성",
	company_analysis: "기업 분석 생성",
	topic_report: "딥 리서치 생성",
	personal_overlay: "내 노트와 연결",
	thesis_delta: "투자 논거 변화 점검",
	market_memory_llm: "시장 메모리 정리",
	market_state_snapshot: "시장 상태 정리",
	market_memory_update: "시장 메모리 갱신",
	quality_repair: "보고서 품질 보완",
	investment_review: "투자 리뷰 생성",
	index: "자료 인덱스 갱신",
	rss: "RSS 수집",
	setup: "초기 설정"
}, Ft = {
	queued: "대기 중",
	running: "진행 중",
	committing: "저장 중",
	cancel_requested: "취소 요청됨",
	done: "완료",
	cancelled: "취소됨",
	failed: "실패",
	failed_cancel: "취소 중 실패",
	failed_commit: "저장 실패",
	failed_restart: "재시작 중 중단",
	failed_commit_recovery: "저장 복구 실패"
}, It = {
	queued: "waiting",
	running: "running",
	committing: "running",
	cancel_requested: "waiting",
	done: "done",
	cancelled: "cancelled"
}, Lt = {
	llm_api: "AI 직접 호출",
	llm_cli: "AI CLI",
	rules: "규칙 기반",
	none: "실행 없음"
}, Rt = {
	auto: "자동 선택",
	codex: "Codex",
	claude: "Claude",
	antigravity: "Antigravity",
	openai_api: "OpenAI",
	gemini_api: "Gemini",
	claude_api: "Claude API",
	rules: "규칙 기반",
	none: "없음"
}, zt = {
	briefing: "브리핑",
	company_analysis: "기업 분석",
	topic_report: "딥 리서치",
	personal_overlay: "개인 해석",
	market_state: "시장 상태",
	investment_review: "투자 리뷰",
	thesis_delta: "투자 논거 변화"
}, Bt = {
	engine_unavailable: "선택한 AI를 쓸 수 없어 다른 방법으로 실행했습니다.",
	engine_failed: "AI 실행이 실패해 다른 방법으로 대체했습니다.",
	confirmed_zero_evidence: "근거가 없는 상태를 확인하고 규칙 기반으로 실행했습니다."
}, Vt = {
	adapter_unavailable: "연결된 AI 도구를 찾지 못했습니다.",
	adapter_failed: "AI 도구 실행이 실패했습니다.",
	validation_failed: "요청 값이 올바르지 않아 중단했습니다.",
	save_failed: "결과를 저장하지 못했습니다.",
	cancel_failed: "취소 처리를 끝내지 못했습니다.",
	restart_interrupted: "서버 재시작으로 작업이 끊겼습니다.",
	commit_recovery_failed: "저장 복구에 실패했습니다.",
	private_cleanup_failed: "임시 파일 정리에 실패했습니다.",
	store_unavailable: "작업 저장소를 읽지 못했습니다.",
	internal_error: "예기치 못한 오류가 발생했습니다."
}, Ht = {
	pending: "승인 대기 중인 수정 제안이 있습니다.",
	applying: "수정 제안을 반영하는 중입니다.",
	applied: "수정 제안을 반영했습니다.",
	rejected: "수정 제안을 거절했습니다.",
	stale: "수정 제안이 만료되었습니다.",
	conflict: "수정 제안이 최신 보고서와 충돌합니다.",
	failed_apply: "수정 제안 반영에 실패했습니다.",
	unavailable: "수정 제안을 열 수 없습니다."
};
function Ut(e) {
	return e ? e.split("_").join(" ") : "";
}
function Wt(e) {
	return It[e.status] || (e.status.startsWith("failed") ? "failed" : "running");
}
function Gt(e) {
	if (!e.artifactCount) return "";
	let t = e.artifactTypes.map((e) => zt[e] || Ut(e)).filter(Boolean);
	return t.length ? `${t.join(", ")} ${e.artifactCount}건 저장` : `산출물 ${e.artifactCount}건 저장`;
}
function Kt(e) {
	let t = Pt[e.taskType] || Ut(e.taskType) || "Agent 작업", n = Ft[e.status] || Ut(e.status), r = Wt(e), i = Gt(e), a = r === "running" || r === "waiting" ? e.progress > 0 ? `${e.progress}% 진행` : "시작을 기다리는 중" : r === "cancelled" ? "사용자가 중단했습니다." : r === "failed" ? Vt[e.errorCode || ""] || "작업을 끝내지 못했습니다." : i || (e.taskType === "companion" ? "답변을 마쳤습니다." : "저장한 산출물 없이 끝났습니다."), o = [], s = Lt[e.generationMode], c = Rt[e.adapter];
	return s && e.generationMode !== "none" && o.push(c && e.adapter !== "none" ? `${s} · ${c}` : s), e.fallbackReason && o.push(Bt[e.fallbackReason] || Ut(e.fallbackReason)), r === "done" && i && a !== i && o.push(i), {
		title: t,
		statusLabel: n,
		tone: r,
		outcome: a,
		details: o,
		attention: e.proposalStatus ? Ht[e.proposalStatus] || Ut(e.proposalStatus) : ""
	};
}
function qt(e, t) {
	if (t && !e) return "확인 중";
	if (!e) return "최근 작업 없음";
	let n = Kt(e);
	return `최근: ${n.title} · ${n.statusLabel}`;
}
//#endregion
//#region src/app/AgentWorkLog.tsx
function Jt(e) {
	return e instanceof H ? e.code || `http_${e.status}` : e instanceof Error && /^[a-z0-9_]+$/.test(e.message) ? e.message : "request_failed";
}
function Yt(e) {
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? "시간 확인 불가" : new Intl.DateTimeFormat("ko-KR", {
		dateStyle: "short",
		timeStyle: "short"
	}).format(t);
}
function Xt({ surface: e, pageSize: t = 20, defaultFilter: n = "all", refreshKey: r = 0, collapsible: i = !1 }) {
	let [a, o] = (0, d.useState)(n), [s, c] = (0, d.useState)(0), [l, u] = (0, d.useState)(null), [p, m] = (0, d.useState)(!0), [h, g] = (0, d.useState)(""), [_, v] = (0, d.useState)(null), [y, b] = (0, d.useState)(null), [x, S] = (0, d.useState)(!1), [C, w] = (0, d.useState)(""), [T, E] = (0, d.useState)(""), [D, O] = (0, d.useState)(null), [k, A] = (0, d.useState)(""), [j, M] = (0, d.useState)(""), N = (0, d.useRef)(0), P = (0, d.useRef)(null), F = (0, d.useRef)(!1), I = (0, d.useRef)(!1), L = (0, d.useRef)(null), R = (0, d.useRef)(null), z = (0, d.useCallback)(async () => {
		let e = ++N.current;
		P.current?.abort();
		let n = new AbortController();
		P.current = n, m(!0), g("");
		try {
			let r = ee(await G(`/api/agent/work-log?kind=${a}&limit=${t}&offset=${s}`, { signal: n.signal }));
			if (e !== N.current) return;
			u(r);
		} catch (t) {
			if (n.signal.aborted || e !== N.current) return;
			g(Jt(t));
		} finally {
			e === N.current && m(!1);
		}
	}, [
		a,
		s,
		t
	]);
	(0, d.useEffect)(() => (z(), () => P.current?.abort()), [z, r]), (0, d.useEffect)(() => {
		let e = () => {
			O(null), z();
		};
		return window.addEventListener(ce, e), () => window.removeEventListener(ce, e);
	}, [z]), (0, d.useEffect)(() => {
		if (!_) return;
		L.current?.querySelector("button:not([disabled]), input:not([disabled])")?.focus();
		let e = (e) => {
			if (e.key === "Escape" && B(), e.key !== "Tab" || !L.current) return;
			let t = Array.from(L.current.querySelectorAll("button:not([disabled]), input:not([disabled])"));
			if (!t.length) return;
			let n = t[0], r = t[t.length - 1];
			e.shiftKey && document.activeElement === n ? (e.preventDefault(), r.focus()) : !e.shiftKey && document.activeElement === r && (e.preventDefault(), n.focus());
		};
		return document.addEventListener("keydown", e), () => document.removeEventListener("keydown", e);
	}, [_]);
	function B() {
		v(null), b(null), w(""), window.setTimeout(() => R.current?.focus(), 0);
	}
	function V(e) {
		o(e), c(0), O(null), M("");
	}
	async function H(e) {
		if (!F.current) {
			F.current = !0, R.current = e, S(!0), w(""), E("");
			try {
				let e = await K("/api/agent/work-log/clear-preview", { scope: a });
				b(e), v("clear");
			} catch (e) {
				w(Jt(e));
			} finally {
				F.current = !1, S(!1);
			}
		}
	}
	async function U() {
		if (!(!y || F.current)) {
			F.current = !0, S(!0), w("");
			try {
				let e = await se("/api/agent/work-log", {
					scope: y.scope,
					previewToken: y.previewToken
				});
				E(`${e.hiddenCount}건을 목록에서 숨겼습니다.`), B(), c(0), await z();
			} catch (e) {
				b(null), w(Jt(e));
			} finally {
				F.current = !1, S(!1);
			}
		}
	}
	async function W(e) {
		if (!(!e.proposalId || I.current)) {
			I.current = !0, A(e.proposalId), M(""), O(null);
			try {
				let t = await G(`/api/agent/proposals/${encodeURIComponent(e.proposalId)}`);
				if (t.id !== e.proposalId) throw Error("proposal_identity_mismatch");
				if (t.status !== "pending" && t.status !== "applying") throw Error("proposal_not_active");
				O(t);
			} catch (e) {
				M(Jt(e)), await z();
			} finally {
				I.current = !1, A("");
			}
		}
	}
	let te = l?.entries || [], ne = !!(l && s + t < l.total), re = qt(te[0], p && !l), ie = a !== "all" || (l?.total ?? 0) > 1, ae = !!(l && l.total > t), oe = /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [
		!i && /* @__PURE__ */ (0, f.jsx)("header", {
			className: "work-log-head",
			children: /* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("p", {
				className: "section-kicker",
				children: "Agent Work Log"
			}), /* @__PURE__ */ (0, f.jsx)("h2", { children: "Agent 작업 기록" })] })
		}),
		/* @__PURE__ */ (0, f.jsxs)("div", {
			className: "work-log-toolbar",
			children: [ie ? /* @__PURE__ */ (0, f.jsx)("div", {
				className: "work-log-filters",
				"data-qa": "work-log-filter",
				"aria-label": "작업 범주",
				children: [
					"all",
					"companion",
					"task"
				].map((e) => /* @__PURE__ */ (0, f.jsx)("button", {
					type: "button",
					className: `btn${a === e ? " active" : ""}`,
					"data-qa": `work-log-filter-${e}`,
					"aria-pressed": a === e,
					onClick: () => V(e),
					children: e === "all" ? "전체" : e === "companion" ? "대화" : "작업"
				}, e))
			}) : /* @__PURE__ */ (0, f.jsx)("span", {}), /* @__PURE__ */ (0, f.jsx)("button", {
				className: "btn btn--icon",
				type: "button",
				"data-qa": "work-log-refresh",
				disabled: p,
				onClick: () => void z(),
				"aria-label": "작업 기록 새로고침",
				"data-tooltip": "새로고침",
				children: /* @__PURE__ */ (0, f.jsxs)("svg", {
					width: "15",
					height: "15",
					viewBox: "0 0 16 16",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.5",
					strokeLinecap: "round",
					strokeLinejoin: "round",
					"aria-hidden": "true",
					children: [/* @__PURE__ */ (0, f.jsx)("path", { d: "M13.5 8a5.5 5.5 0 1 1-1.6-3.9" }), /* @__PURE__ */ (0, f.jsx)("path", { d: "M13.5 2.5V6H10" })]
				})
			})]
		}),
		p && !l && /* @__PURE__ */ (0, f.jsx)("p", {
			"data-qa": "work-log-loading",
			role: "status",
			children: "작업 기록을 불러오는 중입니다."
		}),
		h && /* @__PURE__ */ (0, f.jsxs)("p", {
			className: "react-dashboard-error",
			"data-qa": "work-log-error",
			"data-error-code": h,
			role: "alert",
			children: [
				"작업 기록을 불러오지 못했습니다. (",
				h,
				")"
			]
		}),
		C && /* @__PURE__ */ (0, f.jsxs)("p", {
			className: "react-dashboard-error",
			"data-qa": "work-log-clear-error",
			"data-error-code": C,
			children: [
				"숨기기 미리보기가 만료되었거나 실패했습니다. 다시 미리보세요. (",
				C,
				")"
			]
		}),
		T && /* @__PURE__ */ (0, f.jsx)("p", {
			className: "react-dashboard-warning",
			"data-qa": "work-log-clear-success",
			role: "status",
			children: T
		}),
		j && /* @__PURE__ */ (0, f.jsxs)("p", {
			className: "react-dashboard-error",
			"data-qa": "work-log-proposal-error",
			"data-error-code": j,
			children: [
				"제안이 만료되었거나 현재 열 수 없습니다. (",
				j,
				")"
			]
		}),
		!p && !h && te.length === 0 && /* @__PURE__ */ (0, f.jsx)("p", {
			className: "work-log-empty",
			"data-qa": "work-log-empty",
			children: "표시할 Agent 작업 기록이 없습니다."
		}),
		te.length > 0 && /* @__PURE__ */ (0, f.jsx)("div", {
			className: "work-log-list",
			"data-qa": "work-log-list",
			children: te.map((e) => {
				let t = Kt(e);
				return /* @__PURE__ */ (0, f.jsxs)("article", {
					className: `work-log-item status-${e.status} tone-${t.tone}`,
					"data-qa": "work-log-item",
					"data-tone": t.tone,
					children: [/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "work-log-item-main",
						children: [
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "work-log-item-title",
								children: [/* @__PURE__ */ (0, f.jsx)("strong", {
									"data-qa": "work-log-task-type",
									children: t.title
								}), /* @__PURE__ */ (0, f.jsx)("span", {
									className: "work-log-badge",
									"data-qa": "work-log-status",
									"data-tone": t.tone,
									children: t.statusLabel
								})]
							}),
							/* @__PURE__ */ (0, f.jsx)("p", {
								className: "work-log-outcome",
								"data-qa": "work-log-outcome",
								children: t.outcome
							}),
							t.details.length > 0 && /* @__PURE__ */ (0, f.jsx)("p", {
								className: "work-log-detail",
								"data-qa": "work-log-execution",
								children: t.details.join(" · ")
							}),
							t.attention && /* @__PURE__ */ (0, f.jsx)("p", {
								className: "work-log-attention",
								"data-qa": "work-log-proposal-status",
								children: t.attention
							})
						]
					}), /* @__PURE__ */ (0, f.jsxs)("div", {
						className: "work-log-item-side",
						children: [/* @__PURE__ */ (0, f.jsx)("time", {
							"data-qa": "work-log-time",
							dateTime: e.updatedAt,
							children: Yt(e.finishedAt || e.updatedAt)
						}), e.proposalId && (e.proposalStatus === "pending" || e.proposalStatus === "applying") && /* @__PURE__ */ (0, f.jsx)("button", {
							type: "button",
							className: "btn",
							"data-qa": "work-log-proposal-open",
							disabled: k === e.proposalId,
							onClick: () => void W(e),
							children: k === e.proposalId ? /* @__PURE__ */ (0, f.jsx)("span", {
								"data-qa": "work-log-proposal-loading",
								children: "불러오는 중"
							}) : "승인 검토"
						})]
					})]
				}, e.id);
			})
		}),
		l && /* @__PURE__ */ (0, f.jsxs)("footer", {
			className: "work-log-footer",
			children: [/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "work-log-footer-note",
				children: [/* @__PURE__ */ (0, f.jsxs)("p", {
					"data-qa": "work-log-retention",
					children: [
						"최근 ",
						l.retention.maxDays,
						"일, 최대 ",
						l.retention.maxEntries,
						"건을 표시합니다."
					]
				}), /* @__PURE__ */ (0, f.jsx)("p", { children: "작업 내용 원문이나 개인 자료 없이 진행 상태 요약만 표시합니다." })]
			}), /* @__PURE__ */ (0, f.jsxs)("div", {
				className: "work-log-footer-actions",
				children: [ae && /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "work-log-pagination",
					children: [
						/* @__PURE__ */ (0, f.jsx)("span", {
							"data-qa": "work-log-page-summary",
							children: l.total ? `${s + 1}–${Math.min(s + t, l.total)} / ${l.total}` : "0 / 0"
						}),
						/* @__PURE__ */ (0, f.jsx)("button", {
							type: "button",
							"data-qa": "work-log-page-prev",
							disabled: s === 0 || p,
							onClick: () => c(Math.max(0, s - t)),
							children: "이전"
						}),
						/* @__PURE__ */ (0, f.jsx)("button", {
							type: "button",
							"data-qa": "work-log-page-next",
							disabled: !ne || p,
							onClick: () => c(s + t),
							children: "다음"
						})
					]
				}), te.length > 0 && /* @__PURE__ */ (0, f.jsx)("button", {
					className: "work-log-quiet-btn",
					type: "button",
					"data-qa": "work-log-clear-preview",
					disabled: x,
					onClick: (e) => void H(e.currentTarget),
					children: "기록 숨기기"
				})]
			})]
		}),
		_ === "clear" && y && /* @__PURE__ */ (0, f.jsx)("div", {
			className: "work-log-dialog-backdrop",
			children: /* @__PURE__ */ (0, f.jsxs)("div", {
				className: "work-log-dialog",
				ref: L,
				role: "dialog",
				"aria-modal": "true",
				"aria-labelledby": "work-log-clear-title",
				"data-qa": "work-log-clear-dialog",
				children: [
					/* @__PURE__ */ (0, f.jsx)("h3", {
						id: "work-log-clear-title",
						children: "작업 기록 숨기기"
					}),
					/* @__PURE__ */ (0, f.jsxs)("p", {
						"data-qa": "work-log-clear-count",
						children: [
							"현재 범위 ",
							y.count,
							"건"
						]
					}),
					/* @__PURE__ */ (0, f.jsx)("p", { children: "목록에서만 숨깁니다. 공유 작업, 보고서, 제안, 레거시 파일은 삭제하지 않습니다." }),
					/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "work-log-dialog-actions",
						children: [/* @__PURE__ */ (0, f.jsx)("button", {
							type: "button",
							"data-qa": "work-log-clear-confirm",
							disabled: x,
							onClick: () => void U(),
							children: "숨기기 확인"
						}), /* @__PURE__ */ (0, f.jsx)("button", {
							type: "button",
							"data-qa": "work-log-clear-cancel",
							onClick: B,
							children: "취소"
						})]
					})
				]
			})
		}),
		D && /* @__PURE__ */ (0, f.jsxs)("aside", {
			className: "work-log-proposal-surface",
			"data-qa": "proposal-approval-surface",
			"aria-label": "활성 제안 승인 검토",
			children: [
				/* @__PURE__ */ (0, f.jsxs)("div", { children: [
					/* @__PURE__ */ (0, f.jsx)("p", {
						className: "section-kicker",
						children: "승인 필요"
					}),
					/* @__PURE__ */ (0, f.jsx)("h3", { children: xe(D.summary) || "저장 변경 제안" }),
					/* @__PURE__ */ (0, f.jsx)("p", { children: "이 내용은 작업 기록이 아니라 요청 시 별도로 불러온 승인 제안입니다." })
				] }),
				D.diff && /* @__PURE__ */ (0, f.jsx)("pre", { children: Se(D.diff) }),
				/* @__PURE__ */ (0, f.jsx)("button", {
					type: "button",
					className: "btn",
					onClick: () => O(null),
					children: "닫기"
				})
			]
		})
	] });
	return /* @__PURE__ */ (0, f.jsx)("section", {
		className: `work-log work-log-${e}${i ? " work-log-collapsible" : ""}`,
		"data-qa": "work-log",
		"aria-busy": p,
		children: i ? /* @__PURE__ */ (0, f.jsxs)("details", {
			className: "work-log-collapse",
			children: [/* @__PURE__ */ (0, f.jsxs)("summary", { children: [
				/* @__PURE__ */ (0, f.jsx)("span", {
					className: "section-kicker",
					children: "Agent Work Log"
				}),
				/* @__PURE__ */ (0, f.jsx)("strong", { children: "Agent 작업 기록" }),
				/* @__PURE__ */ (0, f.jsx)("span", {
					className: "work-log-latest",
					"data-qa": "work-log-latest",
					children: re
				})
			] }), oe]
		}) : oe
	});
}
//#endregion
//#region src/app/FolioWordmark.tsx
function Zt({ variant: e = "chrome" }) {
	return /* @__PURE__ */ (0, f.jsxs)("span", {
		className: "folio-wordmark",
		"data-variant": e,
		children: [
			/* @__PURE__ */ (0, f.jsx)("span", {
				className: "sr-only",
				children: "Folio OS"
			}),
			/* @__PURE__ */ (0, f.jsx)("span", {
				className: "folio-wordmark__word",
				"aria-hidden": "true",
				children: "folio"
			}),
			/* @__PURE__ */ (0, f.jsx)("span", {
				className: "folio-wordmark__bar",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, f.jsx)("span", {
				className: "folio-wordmark__word",
				"aria-hidden": "true",
				children: "os"
			})
		]
	});
}
//#endregion
//#region src/app/InvestmentContextCard.tsx
var Qt = "folio.investmentContext.dismissed.v1", $t = {
	layer: "hypothesis",
	reuseAsEvidence: !1
}, en = {
	home: {
		title: "내 리서치 연결",
		description: "관심 종목과 확인 일정을 현재 리서치 화면에만 연결합니다."
	},
	"market-memory": {
		title: "이 흐름과 연결된 종목",
		description: "시장 드라이버가 개인 포트폴리오·워치리스트와 만나는 지점입니다."
	},
	collection: {
		title: "이 Collection과 연결된 개인 맥락",
		description: "저장 필터와 겹치는 종목만 표시하며 외부 근거에는 포함하지 않습니다."
	},
	"deep-research": {
		title: "질문에 참고할 개인 맥락",
		description: "선택한 종목만 추가 컨텍스트에 hypothesis로 복사할 수 있습니다."
	}
};
function tn(e) {
	return e === "both" ? "포트폴리오 · 워치리스트" : e === "portfolio" ? "포트폴리오" : "워치리스트";
}
function nn(e, t, n) {
	return t === "collection" ? e.watchContexts.filter((e) => e.collections.some((e) => e.id === n)) : e.watchContexts;
}
function rn(e) {
	let t = e.marketDrivers.map((e) => e.label).slice(0, 2);
	return [
		tn(e.source),
		...t,
		e.dueCheckpoints.length ? `확인 예정 ${e.dueCheckpoints.length}` : ""
	].filter(Boolean).join(" · ");
}
function an({ reply: e }) {
	let t = e.split(/\r?\n/).map((e) => e.trim()).filter(Boolean);
	return /* @__PURE__ */ (0, f.jsx)("div", {
		className: "investment-context-explanation-body",
		children: t.map((e, t) => e.startsWith("### ") ? /* @__PURE__ */ (0, f.jsx)("h3", { children: e.slice(4) }, `${t}:${e}`) : e.startsWith("- ") ? /* @__PURE__ */ (0, f.jsx)("p", {
			className: "is-bullet",
			children: e.slice(2)
		}, `${t}:${e}`) : /* @__PURE__ */ (0, f.jsx)("p", { children: e }, `${t}:${e}`))
	});
}
function on({ mode: e, summary: t, collectionId: n, dismissible: r = !1, onDismiss: i, onReference: a, onExplain: o, explainingTicker: s = "", explanation: c = null, explanationError: l = "" }) {
	let u = (0, d.useMemo)(() => t ? nn(t, e, n).slice(0, e === "home" ? 4 : 3) : [], [
		n,
		e,
		t
	]), p = en[e];
	if (!t || !u.length) return null;
	let m = u.reduce((e, t) => e + t.dueCheckpoints.length, 0);
	return /* @__PURE__ */ (0, f.jsxs)("aside", {
		className: `investment-context-card mode-${e}`,
		"data-qa": `investment-context-${e}`,
		"data-layer": $t.layer,
		"data-reuse-as-evidence": String($t.reuseAsEvidence),
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "investment-context-head",
				children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [
					/* @__PURE__ */ (0, f.jsx)("p", { children: "내 투자 맥락 · 가설 (근거 아님)" }),
					/* @__PURE__ */ (0, f.jsx)("h2", { children: p.title }),
					/* @__PURE__ */ (0, f.jsx)("span", { children: p.description })
				] }), r && i ? /* @__PURE__ */ (0, f.jsx)("button", {
					type: "button",
					className: "investment-context-dismiss",
					"aria-label": "개인 맥락 카드 닫기",
					onClick: i,
					children: "×"
				}) : null]
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "investment-context-summary",
				"aria-label": "개인 맥락 요약",
				children: [/* @__PURE__ */ (0, f.jsxs)("span", { children: ["연결 ", u.length] }), /* @__PURE__ */ (0, f.jsxs)("span", { children: ["확인 예정 ", m] })]
			}),
			/* @__PURE__ */ (0, f.jsx)("ul", {
				className: "investment-context-ledger",
				children: u.map((t) => /* @__PURE__ */ (0, f.jsxs)("li", { children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: t.ticker }), /* @__PURE__ */ (0, f.jsx)("small", { children: rn(t) })] }), /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "investment-context-row-actions",
					children: [e === "deep-research" && a ? /* @__PURE__ */ (0, f.jsx)("button", {
						type: "button",
						onClick: () => a(t),
						children: "질문에 참고"
					}) : /* @__PURE__ */ (0, f.jsx)("a", {
						href: t.source === "watchlist" || t.source === "both" ? "#/watchlist" : "#/market-memory",
						children: "연결 보기"
					}), o ? /* @__PURE__ */ (0, f.jsx)("button", {
						type: "button",
						disabled: !!s,
						onClick: () => o(t),
						children: s === t.ticker ? "설명 중…" : "Agent로 위험 설명"
					}) : null]
				})] }, t.ticker))
			}),
			c ? /* @__PURE__ */ (0, f.jsxs)("section", {
				className: "investment-context-explanation",
				"aria-live": "polite",
				children: [/* @__PURE__ */ (0, f.jsxs)("strong", { children: [c.ticker, " · Agent 설명"] }), /* @__PURE__ */ (0, f.jsx)(an, { reply: c.reply })]
			}) : null,
			l ? /* @__PURE__ */ (0, f.jsx)("p", {
				className: "investment-context-error",
				role: "status",
				children: l
			}) : null,
			e === "home" ? /* @__PURE__ */ (0, f.jsxs)("nav", {
				className: "investment-context-links",
				"aria-label": "연결된 리서치 화면",
				children: [/* @__PURE__ */ (0, f.jsx)("a", {
					href: "#/market-memory",
					children: "시장 내러티브"
				}), /* @__PURE__ */ (0, f.jsx)("a", {
					href: "#/deep-research",
					children: "딥 리서치"
				})]
			}) : null,
			/* @__PURE__ */ (0, f.jsx)("small", {
				className: "investment-context-boundary",
				children: "개인 가설 레이어 · 외부 evidence 및 Canonical 본문과 분리"
			})
		]
	});
}
function sn(e) {
	let [t, n] = (0, d.useState)(null), [r, i] = (0, d.useState)(() => {
		try {
			return window.localStorage.getItem(Qt) === "1";
		} catch {
			return !1;
		}
	}), [a, o] = (0, d.useState)(""), [s, c] = (0, d.useState)(null), [l, u] = (0, d.useState)(""), p = (0, d.useRef)(null);
	(0, d.useEffect)(() => {
		let e = new AbortController();
		return G("/api/investment-context/summary", { signal: e.signal }).then(n).catch(() => {}), () => e.abort();
	}, []), (0, d.useEffect)(() => () => p.current?.abort(), []);
	async function m(e) {
		p.current?.abort();
		let t = new AbortController();
		p.current = t, o(e.ticker), c(null), u("");
		try {
			let n = (await ut(await K("/api/agent/investment-context/explain", { tickers: [e.ticker] }, { signal: t.signal }), { signal: t.signal })).result?.reply?.trim() || "";
			if (!n) throw Error("설명 결과가 비어 있습니다.");
			c({
				ticker: e.ticker,
				reply: n
			});
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError") return;
			u(e instanceof Error ? e.message : "Agent 설명을 완료하지 못했습니다.");
		} finally {
			p.current === t && (p.current = null, o(""));
		}
	}
	return r ? null : /* @__PURE__ */ (0, f.jsx)(on, {
		...e,
		summary: t,
		onDismiss: e.dismissible ? () => {
			i(!0);
			try {
				window.localStorage.setItem(Qt, "1");
			} catch {}
		} : void 0,
		onExplain: m,
		explainingTicker: a,
		explanation: s,
		explanationError: l
	});
}
//#endregion
//#region src/app/AgentHome.tsx
function cn() {
	let e = J("agent_home");
	return /* @__PURE__ */ (0, f.jsx)("div", {
		className: "react-home-route",
		"data-agent-home": !0,
		children: /* @__PURE__ */ (0, f.jsxs)("div", {
			className: `agent-home ${e.hasConversation ? "has-conversation" : "is-empty"}`,
			children: [
				/* @__PURE__ */ (0, f.jsxs)("div", {
					className: "agent-home-left",
					children: [
						/* @__PURE__ */ (0, f.jsxs)("header", {
							className: "home-hero agent-home-hero",
							children: [/* @__PURE__ */ (0, f.jsx)("p", {
								className: "eyebrow",
								children: "Local Investment Research Workspace"
							}), /* @__PURE__ */ (0, f.jsx)("h1", { children: /* @__PURE__ */ (0, f.jsx)(Zt, { variant: "hero" }) })]
						}),
						/* @__PURE__ */ (0, f.jsx)(p, { workspace: e }),
						/* @__PURE__ */ (0, f.jsxs)("div", {
							className: "home-launcher agent-home-launcher",
							role: "group",
							"aria-label": "빠른 실행",
							children: [
								/* @__PURE__ */ (0, f.jsx)("button", {
									className: "launch-tile",
									type: "button",
									onClick: () => e.runQuickAction("briefing"),
									disabled: e.quickBusy === "briefing",
									children: e.quickBusy === "briefing" ? "생성 중" : "오늘 브리핑 생성"
								}),
								/* @__PURE__ */ (0, f.jsx)("button", {
									className: "launch-tile",
									type: "button",
									onClick: () => e.runQuickAction("rss"),
									disabled: e.quickBusy === "rss",
									children: e.quickBusy === "rss" ? "수집 중" : "RSS 수집"
								}),
								/* @__PURE__ */ (0, f.jsx)("button", {
									className: "launch-tile",
									type: "button",
									onClick: () => e.runQuickAction("analysis"),
									children: "기업 분석"
								}),
								/* @__PURE__ */ (0, f.jsx)("button", {
									className: "launch-tile",
									"data-qa": "home-deep-research",
									type: "button",
									onClick: () => e.runQuickAction("deep-research"),
									children: "딥 리서치"
								})
							]
						}),
						/* @__PURE__ */ (0, f.jsx)(sn, {
							mode: "home",
							dismissible: !0
						}),
						e.recentReports.length > 0 && /* @__PURE__ */ (0, f.jsxs)("div", {
							className: "review-recent-wrap agent-home-recent",
							children: [/* @__PURE__ */ (0, f.jsx)("span", {
								className: "rv-recent-cap",
								children: "최근 보고서"
							}), /* @__PURE__ */ (0, f.jsx)("div", {
								className: "rv-recent",
								children: e.recentReports.map((e, t) => /* @__PURE__ */ (0, f.jsxs)("button", {
									className: "rv-rc",
									type: "button",
									"data-tooltip": `${e.title || "보고서"}${e.date ? ` · ${e.date}` : ""}`,
									onClick: () => {
										window.location.hash = Je(e);
									},
									children: [/* @__PURE__ */ (0, f.jsx)("span", {
										className: "rv-rc-k",
										children: String(e.type || e.view || "REPORT").toUpperCase()
									}), /* @__PURE__ */ (0, f.jsx)("span", {
										className: "rv-rc-t",
										children: e.title || "제목 없음"
									})]
								}, Ye(e, t)))
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, f.jsx)(Be, { workspace: e }),
				/* @__PURE__ */ (0, f.jsx)(Xt, {
					surface: "home",
					pageSize: 20,
					refreshKey: e.workLogRefreshKey,
					collapsible: !0
				})
			]
		})
	});
}
//#endregion
//#region src/app/useContentRevision.ts
var ln = 5e3;
function un(e) {
	let [t, n] = (0, d.useState)(0), r = (0, d.useRef)(null);
	return (0, d.useEffect)(() => {
		let t = !0, i = 0;
		async function a() {
			if (!(!t || document.hidden)) try {
				let i = await G("/api/content-revisions"), a = Number(i.revisions?.[e] ?? 0);
				if (!t) return;
				r.current === null ? r.current = a : a !== r.current && (r.current = a, n((e) => e + 1));
			} catch {}
		}
		function o() {
			i = window.setTimeout(async () => {
				await a(), t && o();
			}, ln);
		}
		function s() {
			document.hidden || a();
		}
		return a(), o(), document.addEventListener("visibilitychange", s), () => {
			t = !1, window.clearTimeout(i), document.removeEventListener("visibilitychange", s);
		};
	}, [e]), t;
}
//#endregion
//#region src/app/savedListFormat.ts
function dn(e) {
	let t = String(e || "").trim();
	if (!t) return "";
	let n = t.slice(0, 10), r = /^(\d{4})[-.](\d{2})[-.](\d{2})$/.exec(n);
	if (r) return `${r[1]}.${r[2]}.${r[3]}`;
	let i = new Date(t);
	if (Number.isNaN(i.getTime())) return t;
	let a = (e) => String(e).padStart(2, "0");
	return `${i.getFullYear()}.${a(i.getMonth() + 1)}.${a(i.getDate())}`;
}
function fn(e, t) {
	let n = dn(t);
	return n ? `${e}건 · 최근 ${n}` : `${e}건`;
}
function pn(e, t) {
	let n = String(e || "").trim(), r = String(t || "").trim();
	return !n || !r || r === n ? "" : r;
}
//#endregion
//#region src/app/useMarketScope.ts
var mn = {
	selected: [
		"US",
		"KR",
		"EUROPE",
		"JP"
	],
	enabledAt: {},
	updatedAt: "",
	markets: [
		{
			id: "US",
			label: "미국"
		},
		{
			id: "KR",
			label: "한국"
		},
		{
			id: "EUROPE",
			label: "유럽"
		},
		{
			id: "JP",
			label: "일본"
		}
	]
};
function hn() {
	let [e, t] = (0, d.useState)(mn), [n, r] = (0, d.useState)(!1), i = (0, d.useCallback)(async () => {
		try {
			let e = await G("/api/market-scope");
			t({
				...mn,
				...e
			});
		} catch {
			t(mn);
		} finally {
			r(!0);
		}
	}, []);
	return (0, d.useEffect)(() => {
		i();
	}, [i]), {
		scope: e,
		loaded: n,
		reload: i,
		isSelected: (0, d.useCallback)((t) => {
			let n = String(t || "").toUpperCase();
			if (!n || n === "GLOBAL" || n === "UNKNOWN") return !0;
			let r = n === "EU" ? "EUROPE" : n;
			return e.selected.includes(r);
		}, [e.selected])
	};
}
//#endregion
//#region src/app/legacyBridge.ts
function gn() {
	return window.FolioBridge ?? {};
}
//#endregion
//#region src/app/reportReader/ReaderActions.tsx
function _n({ title: e, children: t }) {
	return /* @__PURE__ */ (0, f.jsxs)("section", {
		className: "report-reader-rail-group",
		"aria-label": e,
		children: [/* @__PURE__ */ (0, f.jsx)("p", {
			className: "section-kicker",
			children: e
		}), /* @__PURE__ */ (0, f.jsx)("div", {
			className: "report-reader-rail-actions",
			children: t
		})]
	});
}
function vn({ icon: e, children: t, ...n }) {
	return /* @__PURE__ */ (0, f.jsxs)("button", {
		className: "btn report-action-btn",
		type: "button",
		...n,
		children: [/* @__PURE__ */ (0, f.jsx)(yn, { name: e }), /* @__PURE__ */ (0, f.jsx)("span", { children: t })]
	});
}
function yn({ name: e }) {
	return e === "agent" ? /* @__PURE__ */ (0, f.jsx)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, f.jsx)("path", { d: "m4 17 6-6-6-6m8 14h8" })
	}) : e === "link" ? /* @__PURE__ */ (0, f.jsxs)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, f.jsx)("path", {
				fill: "currentColor",
				stroke: "none",
				fillRule: "evenodd",
				clipRule: "evenodd",
				d: "M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h6.4a6 6 0 0 1 8.6-8.4V5a3 3 0 0 0-3-3H5Zm2 4a1 1 0 0 0 0 2h10a1 1 0 1 0 0-2H7Zm0 4a1 1 0 1 0 0 2h5a1 1 0 1 0 0-2H7Z"
			}),
			/* @__PURE__ */ (0, f.jsx)("path", { d: "M20.5 17.4a3 3 0 1 1-.9-2.1" }),
			/* @__PURE__ */ (0, f.jsx)("path", { d: "M20.9 14.1v2.3h-2.3" })
		]
	}) : e === "notion" ? /* @__PURE__ */ (0, f.jsx)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, f.jsx)("path", {
			fill: "currentColor",
			stroke: "none",
			d: "M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"
		})
	}) : e === "obsidian" ? /* @__PURE__ */ (0, f.jsx)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, f.jsx)("path", {
			fill: "currentColor",
			stroke: "none",
			d: "M19.355 18.538a68.967 68.959 0 0 0 1.858-2.954.81.81 0 0 0-.062-.9c-.516-.685-1.504-2.075-2.042-3.362-.553-1.321-.636-3.375-.64-4.377a1.707 1.707 0 0 0-.358-1.05l-3.198-4.064a3.744 3.744 0 0 1-.076.543c-.106.503-.307 1.004-.536 1.5-.134.29-.29.6-.446.914l-.31.626c-.516 1.068-.997 2.227-1.132 3.59-.124 1.26.046 2.73.815 4.481.128.011.257.025.386.044a6.363 6.363 0 0 1 3.326 1.505c.916.79 1.744 1.922 2.415 3.5zM8.199 22.569c.073.012.146.02.22.02.78.024 2.095.092 3.16.29.87.16 2.593.64 4.01 1.055 1.083.316 2.198-.548 2.355-1.664.114-.814.33-1.735.725-2.58l-.01.005c-.67-1.87-1.522-3.078-2.416-3.849a5.295 5.295 0 0 0-2.778-1.257c-1.54-.216-2.952.19-3.84.45.532 2.218.368 4.829-1.425 7.531zM5.533 9.938c-.023.1-.056.197-.098.29L2.82 16.059a1.602 1.602 0 0 0 .313 1.772l4.116 4.24c2.103-3.101 1.796-6.02.836-8.3-.728-1.73-1.832-3.081-2.55-3.831zM9.32 14.01c.615-.183 1.606-.465 2.745-.534-.683-1.725-.848-3.233-.716-4.577.154-1.552.7-2.847 1.235-3.95.113-.235.223-.454.328-.664.149-.297.288-.577.419-.86.217-.47.379-.885.46-1.27.08-.38.08-.72-.014-1.043-.095-.325-.297-.675-.68-1.06a1.6 1.6 0 0 0-1.475.36l-4.95 4.452a1.602 1.602 0 0 0-.513.952l-.427 2.83c.672.59 2.328 2.316 3.335 4.711.09.21.175.43.253.653z"
		})
	}) : /* @__PURE__ */ (0, f.jsxs)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, f.jsx)("path", { d: "m4 12 15-7-7 15-2-6z" }), /* @__PURE__ */ (0, f.jsx)("path", { d: "m10 14 4-4" })]
	});
}
//#endregion
//#region src/app/reportReader/MarkdownRenderer.tsx
function bn(e) {
	let t = [], n = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))/g, r = 0;
	for (let i of e.matchAll(n)) i.index !== void 0 && (i.index > r && t.push({
		type: "text",
		value: e.slice(r, i.index)
	}), i[2] ? t.push({
		type: "strong",
		value: i[2]
	}) : i[3] ? t.push({
		type: "code",
		value: i[3]
	}) : i[4] && i[5] && t.push({
		type: "link",
		label: i[4],
		href: i[5]
	}), r = i.index + i[0].length);
	return r < e.length && t.push({
		type: "text",
		value: e.slice(r)
	}), t;
}
function xn(e) {
	return bn(e).map((e, t) => e.type === "strong" ? /* @__PURE__ */ (0, f.jsx)("strong", { children: e.value }, t) : e.type === "code" ? /* @__PURE__ */ (0, f.jsx)("code", { children: e.value }, t) : e.type === "link" ? /* @__PURE__ */ (0, f.jsx)("a", {
		href: e.href,
		target: "_blank",
		rel: "noreferrer",
		children: e.label
	}, t) : /* @__PURE__ */ (0, f.jsx)("span", { children: e.value }, t));
}
function Sn(e, t) {
	e.length &&= (t.push(/* @__PURE__ */ (0, f.jsx)("p", { children: xn(e.join(" ")) }, `p-${t.length}`)), 0);
}
function Cn({ markdown: e = "" }) {
	let t = [], n = [], r = e.replace(/\r\n/g, "\n").split("\n"), i = [];
	function a() {
		i.length && (t.push(/* @__PURE__ */ (0, f.jsx)("ul", { children: i.map((e, t) => /* @__PURE__ */ (0, f.jsx)("li", { children: xn(e) }, t)) }, `ul-${t.length}`)), i = []);
	}
	for (let e of r) {
		let r = e.trimEnd().trim();
		if (!r) {
			Sn(n, t), a();
			continue;
		}
		let o = r.match(/^(#{2,4})\s+(.+)$/);
		if (o) {
			Sn(n, t), a();
			let e = o[1].length, r = xn(o[2]);
			e === 2 ? t.push(/* @__PURE__ */ (0, f.jsx)("h2", { children: r }, `h-${t.length}`)) : e === 3 ? t.push(/* @__PURE__ */ (0, f.jsx)("h3", { children: r }, `h-${t.length}`)) : t.push(/* @__PURE__ */ (0, f.jsx)("h4", { children: r }, `h-${t.length}`));
			continue;
		}
		let s = r.match(/^[-*]\s+(.+)$/);
		if (s) {
			Sn(n, t), i.push(s[1]);
			continue;
		}
		n.push(r);
	}
	return Sn(n, t), a(), /* @__PURE__ */ (0, f.jsx)("div", {
		className: "react-markdown markdown-brief report-body",
		children: t
	});
}
//#endregion
//#region src/app/reportReader/ReportBody.tsx
function wn(e = "") {
	let t = e.replace(/\r\n/g, "\n"), n = /^#{1,3}\s*(?:참고\s*자료|참고자료|Sources Used|Sources)\s*$/gim.exec(t);
	return !n || n.index === void 0 ? e : t.slice(0, n.index).trim();
}
function Tn({ markdown: e = "", marketScope: t = "both", briefing: n, sourcePanelHtml: r = "" }) {
	let i = (0, d.useRef)(null), a = gn(), o = wn(e), s = a.renderMarkdown?.(o);
	return (0, d.useEffect)(() => {
		let e = i.current;
		if (!(!e || !n || !a.renderBriefingVisuals)) return a.renderBriefingVisuals(e, n), () => a.cleanupBriefingVisuals?.();
	}, [o, n]), s === void 0 ? /* @__PURE__ */ (0, f.jsx)(Cn, { markdown: o }) : /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [/* @__PURE__ */ (0, f.jsx)("article", {
		ref: i,
		className: "markdown-brief report-body",
		"data-market-scope": t,
		dangerouslySetInnerHTML: { __html: s }
	}), r && /* @__PURE__ */ (0, f.jsx)("div", { dangerouslySetInnerHTML: { __html: r } })] });
}
//#endregion
//#region src/app/reportReader/HypothesisReviewCard.tsx
var En = {
	fresh: "최신",
	due: "검토 예정",
	stale: "검토 지연",
	unknown: "검토 이력 없음"
};
function Dn(e) {
	return e ? e.slice(0, 10) : "—";
}
function On(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function kn(e) {
	return "id" in e && "status" in e;
}
async function An(e) {
	let t = e;
	for (; U(t.status);) await On(1e3), t = await G(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "가설 검토 작업에 실패했습니다.");
	return t;
}
function jn({ identity: e, noteExists: t, refreshKey: n, agentAvailable: r = !0, onRequestAgent: i }) {
	let [a, o] = (0, d.useState)(null), [s, c] = (0, d.useState)(""), [l, u] = (0, d.useState)(!1);
	(0, d.useEffect)(() => {
		if (o(null), !t || !e.ticker) return;
		let n = new AbortController();
		return c("검토 상태를 불러오는 중..."), re(e.id, { signal: n.signal }).then((e) => {
			o(e), c("");
		}).catch((e) => {
			n.signal.aborted || c(e instanceof Error ? e.message : "검토 상태를 불러오지 못했습니다.");
		}), () => n.abort();
	}, [
		e.id,
		e.ticker,
		t,
		n
	]);
	let p = (0, d.useMemo)(() => a?.reviewState.checkpoints.find((e) => e.state === "due" || e.state === "open") || null, [a]);
	async function m(t) {
		if (!(!a || !e.ticker || l)) {
			u(!0), c("체크포인트를 확인하는 중...");
			try {
				let n = await ie(e.ticker, {
					noteId: e.id,
					checkpointId: t.id,
					state: "checked",
					expectedRevision: a.reviewState.revision
				});
				o(n), c("체크포인트를 확인했습니다.");
			} catch (e) {
				c(e instanceof Error ? e.message : "체크포인트 확인에 실패했습니다.");
			} finally {
				u(!1);
			}
		}
	}
	async function h() {
		if (!(!a?.thesis || !e.ticker || l)) {
			u(!0), c("최신 외부 근거로 가설을 검토하는 중...");
			try {
				let t = await ae(e.ticker);
				kn(t) && await An(t);
				let n = await re(e.id);
				o(n), c("최신 근거 검토를 완료했습니다.");
			} catch (e) {
				c(e instanceof Error ? e.message : "최신 근거 검토에 실패했습니다.");
			} finally {
				u(!1);
			}
		}
	}
	let g = "";
	return t === null ? g = "노트 상태를 확인하는 중..." : t ? e.ticker || (g = "티커가 없어 Thesis와 연결할 수 없습니다.") : g = "아직 저장된 노트가 없습니다.", /* @__PURE__ */ (0, f.jsxs)("section", {
		className: "hypothesis-review-card",
		"aria-label": "가설 검토 상태",
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "hypothesis-review-head",
				children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("p", {
					className: "section-kicker",
					children: "Hypothesis Review"
				}), /* @__PURE__ */ (0, f.jsx)("strong", { children: "가설 검토 상태" })] }), a && /* @__PURE__ */ (0, f.jsx)("span", {
					className: `hypothesis-freshness is-${a.reviewState.freshness}`,
					children: En[a.reviewState.freshness]
				})]
			}),
			g ? /* @__PURE__ */ (0, f.jsx)("p", {
				className: "hypothesis-review-empty",
				children: g
			}) : a ? /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [
				!a.thesis && /* @__PURE__ */ (0, f.jsx)("p", {
					className: "hypothesis-review-empty",
					children: "연결된 Thesis가 없습니다."
				}),
				!a.latestDelta && /* @__PURE__ */ (0, f.jsx)("p", {
					className: "hypothesis-review-empty",
					children: "최신 Delta가 없습니다. 최신 근거 검토를 명시적으로 실행하세요."
				}),
				/* @__PURE__ */ (0, f.jsxs)("dl", {
					className: "hypothesis-review-metrics",
					children: [
						/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "최근 검토" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: Dn(a.reviewState.lastReviewedAt) })] }),
						/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "다음 검토" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: Dn(a.reviewState.nextReviewAt) })] }),
						/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "반대 근거" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: a.latestDelta?.counterEvidenceCount ?? 0 })] }),
						/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "예정 체크" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: a.checkpointCounts.due + a.checkpointCounts.open })] })
					]
				}),
				/* @__PURE__ */ (0, f.jsxs)("div", {
					className: "hypothesis-review-actions",
					children: [
						/* @__PURE__ */ (0, f.jsx)("button", {
							type: "button",
							onClick: h,
							disabled: !a.thesis || l,
							children: l ? "검토 중..." : "최신 근거로 검토"
						}),
						/* @__PURE__ */ (0, f.jsx)("button", {
							type: "button",
							onClick: () => p && m(p),
							disabled: !p || l,
							children: l ? "확인 중..." : "체크포인트 확인"
						}),
						/* @__PURE__ */ (0, f.jsx)("button", {
							type: "button",
							onClick: i,
							disabled: !r,
							children: "Agent에게 설명 요청"
						})
					]
				}),
				!r && /* @__PURE__ */ (0, f.jsx)("p", {
					className: "hypothesis-review-empty",
					children: "Agent를 사용할 수 없습니다. 규칙 기반 상태는 계속 확인할 수 있습니다."
				})
			] }) : /* @__PURE__ */ (0, f.jsx)("p", {
				className: "hypothesis-review-empty",
				children: s || "검토 상태를 준비하고 있습니다."
			}),
			s && a && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "hypothesis-review-status",
				children: s
			}),
			/* @__PURE__ */ (0, f.jsx)("p", {
				className: "hypothesis-layer-notice",
				children: "사용자 노트는 hypothesis이며 evidence가 아닙니다. Canonical 보고서는 변경되지 않습니다."
			})
		]
	});
}
//#endregion
//#region src/app/reportReader/PersonalOverlayView.tsx
function Mn(e) {
	return e.length ? /* @__PURE__ */ (0, f.jsx)("ul", { children: e.map((e, t) => /* @__PURE__ */ (0, f.jsx)("li", { children: e }, `${e}-${t}`)) }) : /* @__PURE__ */ (0, f.jsx)("p", { children: "기록 없음" });
}
function Nn({ overlay: e, staleQa: t }) {
	return e ? /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "react-personal-overlay",
		"data-personal-overlay-state": e.revisionState,
		children: [
			e.revisionState === "stale" && /* @__PURE__ */ (0, f.jsxs)("div", {
				className: "topicrpt-overlay-stale",
				"data-qa": t,
				role: "status",
				children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: "이 Overlay는 오래된 Canonical 기준입니다." }), /* @__PURE__ */ (0, f.jsx)("span", { children: "현재 보고서 revision과 생성 당시 revision이 다르므로 다시 연결해 확인하세요." })]
			}),
			e.revisionState === "legacy_unknown" && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "topicrpt-layer-note",
				children: "생성 기준 revision을 확인할 수 없는 레거시 Overlay입니다."
			}),
			e.markdown ? /* @__PURE__ */ (0, f.jsx)(Tn, { markdown: e.markdown }) : /* @__PURE__ */ (0, f.jsx)("p", {
				className: "report-note-empty",
				children: "저장된 개인 해석 본문이 없습니다."
			}),
			/* @__PURE__ */ (0, f.jsx)("h4", { children: "반대 근거와 충돌" }),
			Mn([...e.counterEvidence, ...e.contradictions]),
			/* @__PURE__ */ (0, f.jsx)("h4", { children: "불확실성과 다음 질문" }),
			Mn([...e.uncertainties, ...e.personalQuestions])
		]
	}) : /* @__PURE__ */ (0, f.jsx)("p", {
		className: "report-note-empty",
		children: "생성된 Personal Overlay가 없습니다."
	});
}
//#endregion
//#region src/app/reportReader/FolioNotePanel.tsx
var Pn = [
	"## 현재 관점",
	"",
	"## 왜 중요한가",
	"",
	"## 근거",
	"",
	"## 반대 근거",
	"",
	"## 다음 체크포인트",
	"",
	"## 결정/업데이트 로그",
	""
].join("\n"), Fn = [
	"떠오르는 생각을 자유롭게 정리해보세요. 막연한 느낌이나 궁금증 한 줄만 작성해도 됩니다.",
	"",
	"예시: \"이 주식은 앞으로 받을 수혜가 커 보여서 관심 있음\"",
	"예시: \"가격이 너무 오른 것 같은데 그래도 들고 갈 만한가?\""
].join("\n"), In = "[대화]", Ln = "[투자 노트]";
function Rn(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
async function zn(e) {
	let t = e;
	for (; U(t.status);) await Rn(1e3), t = await G(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "Agent 작업에 실패했습니다.");
	return t;
}
function Bn(e) {
	let t = String(e || ""), n = t.indexOf(Ln), r = (e) => e.replace(/^\s*\[대화\]\s*/, "").trim();
	return n < 0 ? {
		message: r(t),
		note: ""
	} : {
		message: r(t.slice(0, n)),
		note: t.slice(n + 7).trim()
	};
}
function Vn(e, t) {
	let n = t.trim();
	if (!n) return e;
	let r = e[e.length - 1];
	return r?.role === "user" && r.body.trim() === n ? e : [...e, {
		role: "user",
		body: n,
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	}];
}
function Hn(e, t, n = "") {
	return [...e, {
		role: "agent",
		body: t,
		summary: n || "Agent 답변",
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	}];
}
function Un(e, t, n, r, i = [], a = []) {
	let o = i.slice(-8).map((e, t) => `${t + 1}. ${e.body}`).join("\n"), s = a.slice(-8).map((e, t) => {
		let { message: n, note: r } = Bn(e.body);
		return `${t + 1}. ${e.summary || "Agent"}: ${n || (r ? "(투자 노트 전체를 업데이트함)" : "")}`;
	}).join("\n\n");
	return [
		"현재 열린 보고서와 Folio OS Market Memory를 함께 참고해, 사용자와 대화하면서 투자 노트를 완성해줘.",
		"사용자가 적은 생각은 근거가 아니라 hypothesis다. 옹호하지 말고 검증 가능한 투자 노트로 다듬어줘.",
		"없는 사실은 지어내지 말고, 추가 확인 필요로 표시해줘.",
		"사용자 판단과 Agent가 제안하는 해석을 구분하고, 반대 근거와 다음 체크포인트를 포함해줘.",
		"사용자가 `>`로 인용한 문장이 있으면 그 문장에 대한 질문/첨삭 요청으로 이해하고 해당 부분을 중심으로 답해줘.",
		"응답 형식을 반드시 지켜줘:",
		`1) ${In} 아래에 사용자에게 하는 짧은 대화 답변(무엇을 반영/수정했는지, 확인하고 싶은 점)을 2~5문장으로 써줘.`,
		`2) 노트를 새로 만들거나 수정할 내용이 있으면 ${Ln} 아래에 투자 노트 전체 Markdown을 써줘. 단순 질문에 답만 하는 경우에는 ${Ln} 부분을 생략하고 기존 노트를 유지해줘.`,
		"기존 정리본이 있으면 전체를 갈아엎기보다 필요한 부분을 업데이트하고, 결정/업데이트 로그에 변경 이유를 남겨줘.",
		"투자 노트는 아래 큰 구조를 유지하되, 각 섹션은 초보 투자자가 바로 이해할 수 있게 짧고 명확하게 작성해줘.",
		Pn,
		`노트 제목: ${e.title}`,
		`연결 문서: ${r || e.linkedReports?.[0] || e.title}`,
		`보고서 종류: ${e.reportKind || e.noteType || "report"}`,
		`보고서 ID: ${e.reportId || e.id}`,
		e.ticker ? `티커: ${e.ticker}` : "",
		e.topic ? `주제: ${e.topic}` : "",
		n.trim() ? `이번 사용자 메시지:\n${n.trim()}` : "",
		o ? `이전 사용자 메시지 기록:\n${o}` : "",
		s ? `이전 Agent 대화 기록:\n${s}` : "",
		t.trim() ? `현재 정리된 투자 노트:\n${t.trim()}` : ""
	].filter(Boolean).join("\n\n");
}
function Wn(e, t) {
	let n = String(t || e || "note"), r = 2166136261;
	for (let e = 0; e < n.length; e += 1) r ^= n.charCodeAt(e), r = Math.imul(r, 16777619) >>> 0;
	return `${e}-${r.toString(36)}`;
}
function Gn({ identity: e, linkedTitle: t, overlay: n = null }) {
	let [r, i] = (0, d.useState)(""), [a, o] = (0, d.useState)(""), [s, c] = (0, d.useState)(""), [l, u] = (0, d.useState)([]), [p, m] = (0, d.useState)([]), [h, g] = (0, d.useState)(""), [_, v] = (0, d.useState)("chat"), [y, b] = (0, d.useState)([]), [x, S] = (0, d.useState)(!1), [C, w] = (0, d.useState)([]), [T, E] = (0, d.useState)(null), [D, O] = (0, d.useState)(0), k = (0, d.useRef)(null), A = C.includes("agent_assisted"), j = (0, d.useMemo)(() => [...l, ...p].sort((e, t) => String(e.createdAt || "").localeCompare(String(t.createdAt || ""))), [l, p]);
	(0, d.useEffect)(() => {
		let t = !0;
		async function n() {
			g("불러오는 중..."), b([]), i(""), o(""), c(""), u([]), m([]), E(null);
			try {
				let n = await G(`/api/investment-notes/${encodeURIComponent(e.id)}`);
				if (!t) return;
				i(n.body || ""), u(n.rawThoughts || []), m(n.interactionLog || []), w(n.tags || []), E(!0), g(n.updatedAt ? `저장됨: ${n.updatedAt}` : "Folio 로컬 노트를 불러왔습니다.");
			} catch {
				if (!t) return;
				w([]), E(!1), g("생각 한 줄에서 시작하세요.");
			}
			try {
				let n = await G(`/api/investment-notes/linked?${new URLSearchParams({
					ticker: e.ticker || "",
					topic: e.topic || "",
					reportId: e.reportId || ""
				})}`);
				if (!t) return;
				b(n.notes || []);
			} catch {
				if (!t) return;
				b([]);
			}
		}
		return n(), () => {
			t = !1;
		};
	}, [
		e.id,
		e.reportId,
		e.ticker,
		e.topic
	]), (0, d.useEffect)(() => {
		let e = k.current;
		e && (e.scrollTop = e.scrollHeight);
	}, [j.length, _]);
	async function M(t, n, r, i = C) {
		let a = await K("/api/investment-notes", {
			...e,
			body: t,
			rawThoughts: n,
			interactionLog: r,
			tags: i
		});
		return w(a.tags || []), E(!0), O((e) => e + 1), a;
	}
	function N() {
		let e = a.trim(), t = s.trim();
		return t && e ? `> ${t}\n\n${e}` : t ? `> ${t}` : e;
	}
	function P() {
		let e = window.getSelection()?.toString().replace(/\s+/g, " ").trim() || "";
		e.length >= 2 && c(e.slice(0, 400));
	}
	async function F() {
		let e = N();
		if (e) {
			g("저장 중...");
			try {
				let t = Vn(l, e), n = await M(r, t, p);
				u(n.rawThoughts || t), m(n.interactionLog || p), o(""), c(""), g("생각을 기록했습니다. Agent 정리는 나중에 요청할 수 있습니다.");
			} catch (e) {
				g(e instanceof Error ? `저장 실패: ${e.message}` : "저장 실패");
			}
		}
	}
	async function I() {
		let n = N();
		if (!n || x) return;
		S(!0), g("Agent가 응답을 준비하는 중...");
		let a = Vn(l, n);
		u(a), o(""), c("");
		try {
			let o = await zn(await K("/api/agent/chat", {
				message: Un(e, r, n, t, a, p),
				context: {
					surface: "folio_note",
					viewId: "investment_note",
					reportKind: e.reportKind || e.noteType || "",
					reportId: e.reportId || e.id || "",
					ticker: e.ticker || "",
					topic: e.topic || "",
					noteId: e.id
				},
				options: { effort: "high" }
			})), s = o.result || {}, c = String(s.reply || "").trim();
			if (!c) throw Error(o.message || "Agent가 응답을 반환하지 않았습니다.");
			let { note: l } = Bn(c), d = Hn(p, c, s.notice || (l ? "투자 노트 업데이트" : "Agent 답변")), f = l || r, h = await M(f, a, d, l ? Array.from(/* @__PURE__ */ new Set([...C, "agent_assisted"])) : C);
			i(h.body || f), u(h.rawThoughts || a), m(h.interactionLog || d), g(l ? "Agent가 투자 노트를 업데이트했습니다. 완성본은 연결 자료 탭에서 확인하세요." : "Agent가 답변했습니다. 노트 본문은 그대로 유지했습니다.");
		} catch (e) {
			try {
				await M(r, a, p);
			} catch {}
			g(e instanceof Error ? `AI 정리 실패: ${e.message}` : "AI 정리 실패");
		} finally {
			S(!1);
		}
	}
	function L() {
		v("chat"), o("현재 freshness, 최신 verdict, 반대 근거, 체크포인트 상태가 무엇을 의미하는지 설명해줘."), g("설명 요청을 준비했습니다. 내용을 확인한 뒤 Agent 버튼을 눌러 실행하세요.");
	}
	return /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "react-note-panel",
		"data-report-note-panel": !0,
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "report-note-head react-note-panel-head",
				children: [/* @__PURE__ */ (0, f.jsx)("p", {
					className: "section-kicker",
					children: "투자 생각 정리"
				}), /* @__PURE__ */ (0, f.jsx)("div", {
					className: "report-note-tabs",
					role: "tablist",
					"aria-label": "투자 노트 모드",
					children: [["chat", "작성"], ["links", "연결 자료"]].map(([e, t]) => /* @__PURE__ */ (0, f.jsx)("button", {
						className: "report-note-tab",
						type: "button",
						"aria-pressed": _ === e,
						onClick: () => v(e),
						children: t
					}, e))
				})]
			}),
			/* @__PURE__ */ (0, f.jsx)(jn, {
				identity: e,
				noteExists: T,
				refreshKey: D,
				onRequestAgent: L
			}),
			_ === "chat" && /* @__PURE__ */ (0, f.jsxs)("div", {
				className: "report-note-chat",
				children: [j.length === 0 ? /* @__PURE__ */ (0, f.jsx)("p", {
					className: "report-note-empty report-note-chat-empty",
					children: "먼저 떠오르는 생각 한 줄을 남겨보세요. Agent가 열린 보고서와 Market Memory를 참고해 투자 노트로 정리해줍니다."
				}) : /* @__PURE__ */ (0, f.jsx)("ol", {
					className: "report-note-chat-list",
					ref: k,
					onMouseUp: P,
					children: j.map((e, t) => {
						let n = e.role === "agent", { message: r, note: i } = n ? Bn(e.body) : {
							message: e.body,
							note: ""
						};
						return /* @__PURE__ */ (0, f.jsxs)("li", {
							className: `report-note-chat-item ${n ? "is-agent" : "is-user"}`,
							children: [
								/* @__PURE__ */ (0, f.jsxs)("span", {
									className: "report-note-history-meta",
									children: [
										n ? "Agent" : "사용자",
										" ",
										e.createdAt || ""
									]
								}),
								r && /* @__PURE__ */ (0, f.jsx)("p", {
									className: "report-note-chat-text",
									children: r
								}),
								i && /* @__PURE__ */ (0, f.jsxs)("div", {
									className: "report-note-chat-note",
									children: [/* @__PURE__ */ (0, f.jsx)("span", {
										className: "report-note-chat-note-label",
										children: "완성된 투자 노트"
									}), /* @__PURE__ */ (0, f.jsx)(Tn, { markdown: i })]
								})
							]
						}, `${e.role}-${e.createdAt || t}-${t}`);
					})
				}), /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "report-note-composer",
					children: [
						s && /* @__PURE__ */ (0, f.jsxs)("div", {
							className: "report-note-quote-bar",
							children: [
								/* @__PURE__ */ (0, f.jsx)("span", {
									className: "report-note-quote-label",
									children: "인용"
								}),
								/* @__PURE__ */ (0, f.jsx)("p", { children: s }),
								/* @__PURE__ */ (0, f.jsx)("button", {
									type: "button",
									onClick: () => c(""),
									"aria-label": "인용 지우기",
									children: "×"
								})
							]
						}),
						/* @__PURE__ */ (0, f.jsx)("textarea", {
							className: "report-note-thought-editor",
							value: a,
							onChange: (e) => o(e.currentTarget.value),
							rows: 3,
							placeholder: Fn,
							"aria-label": `${e.title} 사용자의 생각`
						}),
						/* @__PURE__ */ (0, f.jsxs)("div", {
							className: "report-note-composer-actions",
							children: [/* @__PURE__ */ (0, f.jsx)("button", {
								className: "report-note-secondary-action",
								type: "button",
								onClick: F,
								disabled: x || !N(),
								children: "생각만 기록"
							}), /* @__PURE__ */ (0, f.jsx)("button", {
								className: "report-note-primary-action",
								type: "button",
								onClick: I,
								disabled: x || !N(),
								children: x ? "Agent가 정리 중" : "Agent와 투자 노트 정리하기"
							})]
						}),
						/* @__PURE__ */ (0, f.jsx)("p", {
							className: "report-note-composer-hint",
							children: "Agent 답변이나 완성본에서 문장을 드래그하면 인용해서 이어서 물어볼 수 있습니다."
						})
					]
				})]
			}),
			_ === "links" && /* @__PURE__ */ (0, f.jsxs)("div", {
				className: "report-note-links",
				children: [
					/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "report-note-final",
						children: [/* @__PURE__ */ (0, f.jsxs)("div", {
							className: "report-note-section-label",
							children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: "정리된 투자 노트" }), /* @__PURE__ */ (0, f.jsx)("span", { children: r.trim() ? `읽기 전용 완성본입니다. 수정은 작성 탭에서 Agent와 대화로 진행하세요.${A ? " (Agent 정리본)" : ""}` : "작성 탭에서 Agent와 정리하면 여기에 완성본이 표시됩니다." })]
						}), r.trim() ? /* @__PURE__ */ (0, f.jsx)("div", {
							className: "report-note-final-body",
							children: /* @__PURE__ */ (0, f.jsx)(Tn, { markdown: r })
						}) : /* @__PURE__ */ (0, f.jsx)("p", {
							className: "report-note-empty",
							children: "아직 완성된 투자 노트가 없습니다."
						})]
					}),
					/* @__PURE__ */ (0, f.jsxs)("p", {
						className: "report-note-link-head",
						children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: t || e.linkedReports?.[0] || e.title }), "에 연결된 Folio 노트와 참고 정보입니다."]
					}),
					y.length > 0 ? /* @__PURE__ */ (0, f.jsx)("ul", {
						className: "report-note-link-list",
						children: y.slice(0, 8).map((e) => /* @__PURE__ */ (0, f.jsxs)("li", { children: [/* @__PURE__ */ (0, f.jsx)("span", {
							className: "report-note-link-title",
							children: e.title || "투자 노트"
						}), /* @__PURE__ */ (0, f.jsx)("span", {
							className: "report-note-link-meta",
							children: e.ticker || e.noteType || "note"
						})] }, e.id || e.title))
					}) : /* @__PURE__ */ (0, f.jsx)("p", {
						className: "report-note-empty",
						children: "아직 연결된 노트가 없습니다."
					}),
					/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "report-note-layer",
						children: [/* @__PURE__ */ (0, f.jsx)("p", {
							className: "section-kicker",
							children: "참고 해석"
						}), /* @__PURE__ */ (0, f.jsx)(Nn, { overlay: n })]
					})
				]
			}),
			/* @__PURE__ */ (0, f.jsx)("div", {
				className: "report-note-foot",
				children: h && /* @__PURE__ */ (0, f.jsx)("p", {
					className: "report-note-status",
					children: h
				})
			})
		]
	});
}
//#endregion
//#region src/app/reportReader/ReportReaderShell.tsx
function Kn({ eyebrow: e, title: t, meta: n, breadcrumb: r, actionSlot: i, noteSlot: a, noteIdentity: o, noteLinkedTitle: s, noteOverlay: c, agentContext: l, onClose: u, children: p }) {
	let [m, h] = (0, d.useState)(!1), g = (0, d.useRef)(null), _ = (0, d.useRef)(null), v = (0, d.useRef)(null), y = (0, d.useRef)(null), b = (0, d.useId)(), x = a ?? (o ? /* @__PURE__ */ (0, f.jsx)(Gn, {
		identity: o,
		linkedTitle: s || t,
		overlay: c || null
	}) : null), S = l ? JSON.stringify(l) : "", C = [
		"report-reader-stage",
		!i && !x ? "no-side" : "",
		i ? "" : "no-rail",
		x ? "" : "no-note"
	].filter(Boolean).join(" ");
	(0, d.useEffect)(() => {
		if (!S || !l) return;
		let e = String(l.viewId || ""), t = e === "topicrpt" ? "deep-research" : e;
		t && q(t, l);
	}, [l, S]), (0, d.useEffect)(() => {
		g.current?.focus({ preventScroll: !0 });
	}, [t]);
	let w = (0, d.useCallback)(() => {
		h(!1), window.requestAnimationFrame(() => _.current?.focus({ preventScroll: !0 }));
	}, []);
	return (0, d.useEffect)(() => {
		if (!m) return;
		y.current?.focus({ preventScroll: !0 });
		let e = v.current, t = (t) => {
			if (t.key === "Escape") {
				t.preventDefault(), t.stopPropagation(), w();
				return;
			}
			if (t.key !== "Tab" || !e) return;
			let n = Array.from(e.querySelectorAll("button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex=\"-1\"])")).filter((e) => e.getClientRects().length > 0);
			if (!n.length) return;
			let r = n[0], i = n[n.length - 1];
			t.shiftKey && document.activeElement === r ? (t.preventDefault(), i.focus()) : !t.shiftKey && document.activeElement === i && (t.preventDefault(), r.focus());
		};
		return document.addEventListener("keydown", t, !0), () => document.removeEventListener("keydown", t, !0);
	}, [w, m]), (0, d.useEffect)(() => {
		let e = (e) => {
			e.key !== "Escape" || m || !u || (e.target instanceof Element ? e.target : null)?.closest("[role=\"dialog\"][aria-modal=\"true\"]") || (e.preventDefault(), u());
		};
		return document.addEventListener("keydown", e), () => document.removeEventListener("keydown", e);
	}, [m, u]), /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "report-reader-shell report-reader-inline",
		"data-report-reader-shell": !0,
		children: [/* @__PURE__ */ (0, f.jsx)("div", {
			className: "reader-breadcrumb report-reader-breadcrumb",
			children: r
		}), /* @__PURE__ */ (0, f.jsxs)("div", {
			className: C,
			children: [
				/* @__PURE__ */ (0, f.jsxs)("section", {
					ref: g,
					className: "report-reader-dialog report-reader-main",
					"aria-labelledby": b,
					tabIndex: -1,
					children: [/* @__PURE__ */ (0, f.jsx)("div", {
						className: "report-reader-head",
						children: u && /* @__PURE__ */ (0, f.jsx)("button", {
							className: "icon-btn",
							type: "button",
							onClick: u,
							"aria-label": "리더 닫기",
							"data-qa": "dr-report-close",
							"data-tooltip": "닫기",
							"data-tooltip-pos": "left",
							children: "×"
						})
					}), /* @__PURE__ */ (0, f.jsxs)("div", {
						className: "report-reader-body",
						children: [/* @__PURE__ */ (0, f.jsxs)("section", {
							className: "report-hero react-report-hero",
							children: [
								e && /* @__PURE__ */ (0, f.jsx)("p", {
									className: "report-kicker",
									children: e
								}),
								/* @__PURE__ */ (0, f.jsx)("h1", {
									id: b,
									children: t
								}),
								n && /* @__PURE__ */ (0, f.jsx)("p", {
									className: "report-hero-meta",
									children: n
								})
							]
						}), /* @__PURE__ */ (0, f.jsx)("div", {
							className: "headline react-report-card",
							children: p
						})]
					})]
				}),
				i && /* @__PURE__ */ (0, f.jsx)("aside", {
					className: "report-reader-rail",
					"aria-label": "보고서 조작 패널",
					children: i
				}),
				x && /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [/* @__PURE__ */ (0, f.jsx)("button", {
					ref: _,
					className: m ? "report-note-grip is-open" : "report-note-grip",
					type: "button",
					"aria-label": "투자 노트 열기",
					"aria-controls": "report-reader-note-panel",
					"aria-expanded": m,
					"data-qa": "reader-note-open",
					onClick: () => h(!0)
				}), /* @__PURE__ */ (0, f.jsx)("aside", {
					ref: v,
					id: "report-reader-note-panel",
					className: m ? "report-note-panel is-open" : "report-note-panel",
					"aria-label": "투자 노트",
					role: m ? "dialog" : void 0,
					"aria-modal": m ? !0 : void 0,
					children: /* @__PURE__ */ (0, f.jsxs)("div", {
						className: "report-note-inner",
						children: [/* @__PURE__ */ (0, f.jsx)("button", {
							ref: y,
							className: "report-note-mobile-close",
							type: "button",
							"aria-label": "투자 노트 닫기",
							"data-qa": "reader-note-close",
							onClick: w,
							children: "×"
						}), x]
					})
				})] })
			]
		})]
	});
}
//#endregion
//#region src/app/RouteHero.tsx
function qn({ eyebrow: e, title: t, description: n, actions: r }) {
	return /* @__PURE__ */ (0, f.jsxs)("header", {
		className: "react-route-hero",
		children: [/* @__PURE__ */ (0, f.jsxs)("div", {
			className: "react-route-hero-copy",
			children: [
				/* @__PURE__ */ (0, f.jsx)("p", {
					className: "react-route-hero-eyebrow",
					children: e
				}),
				/* @__PURE__ */ (0, f.jsx)("h1", { children: t }),
				/* @__PURE__ */ (0, f.jsx)("p", {
					className: "react-route-hero-description",
					children: n
				})
			]
		}), r && /* @__PURE__ */ (0, f.jsx)("div", {
			className: "react-route-hero-actions",
			children: r
		})]
	});
}
//#endregion
//#region src/app/deepResearchPayload.ts
var Jn = /^sc_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function Yn(e) {
	return `#/deep-research/collections/${encodeURIComponent(e)}`;
}
function Xn(e) {
	return `#/deep-research/${encodeURIComponent(e)}`;
}
function Zn(e) {
	let t = e.replace(/^#\/?/, "");
	if (t === "deep-research" || t === "deep-research/") return {
		kind: "list",
		id: "",
		malformed: !1
	};
	let n = t.match(/^deep-research\/collections\/(.+)$/);
	if (n) try {
		let e = decodeURIComponent(n[1]);
		return Jn.test(e) ? {
			kind: "collection",
			id: e,
			malformed: !1
		} : {
			kind: "collection",
			id: "",
			malformed: !0
		};
	} catch {
		return {
			kind: "collection",
			id: "",
			malformed: !0
		};
	}
	let r = t.match(/^deep-research\/(.+)$/);
	if (!r) return {
		kind: "list",
		id: "",
		malformed: !1
	};
	try {
		let e = decodeURIComponent(r[1]);
		return e ? {
			kind: "report",
			id: e,
			malformed: !1
		} : {
			kind: "report",
			id: "",
			malformed: !0
		};
	} catch {
		return {
			kind: "report",
			id: "",
			malformed: !0
		};
	}
}
function Y(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function X(e) {
	return typeof e == "string" ? e : "";
}
function Qn(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function $n(e) {
	return Array.isArray(e) ? e.filter((e) => typeof e == "string") : [];
}
function er(e) {
	if (typeof e != "string" || !e.trim()) return "";
	try {
		let t = new URL(e);
		return t.protocol === "http:" || t.protocol === "https:" ? t.href : "";
	} catch {
		return "";
	}
}
function tr(e) {
	return X(e).trim().toLowerCase().replace(/[\s_-]+/g, "");
}
function nr(e) {
	if (!Y(e)) return null;
	let t = Qn(e.number), n = X(e.hash);
	return t !== null || n ? {
		number: t,
		hash: n
	} : null;
}
function rr(e) {
	return Y(e) ? Object.fromEntries(Object.entries(e).filter((e) => typeof e[1] == "number" && Number.isFinite(e[1]))) : {};
}
function ir(e, t = !1) {
	if (!Y(e)) return {};
	let n = {};
	for (let [r, i] of Object.entries(e)) Y(i) && (n[r] = {
		label: X(i.label),
		question: t ? X(i.question) : "",
		count: Qn(i.count) ?? 0,
		level: X(i.level)
	});
	return n;
}
function ar(e) {
	if (!Y(e)) return null;
	let t = Y(e.deepResearch) ? e.deepResearch : {}, n = Array.isArray(e.analysisAxes) ? e.analysisAxes.filter(Y).map((e) => ({
		key: X(e.key),
		label: X(e.label),
		questions: $n(e.questions)
	})).filter((e) => e.key || e.label) : [];
	return {
		topic: X(e.topic),
		reportType: X(e.reportType),
		userIntent: X(e.userIntent),
		researchQuestions: $n(e.researchQuestions),
		analysisAxes: n,
		searchQueries: $n(e.searchQueries),
		expectedSections: $n(e.expectedSections),
		dataGapsLikely: $n(e.dataGapsLikely),
		falsificationTriggers: $n(t.falsificationTriggers)
	};
}
function or(e) {
	if (!Y(e)) return null;
	let t = ir(e.axisCoverage), n = ir(e.questionCoverage, !0);
	return {
		totalDocs: Qn(e.totalDocs) ?? 0,
		roleCounts: rr(e.roleCounts),
		axisCoverage: Object.fromEntries(Object.entries(t).map(([e, t]) => [e, {
			label: t.label,
			count: t.count,
			level: t.level
		}])),
		questionCoverage: Object.fromEntries(Object.entries(n).map(([e, t]) => [e, {
			question: t.question,
			count: t.count,
			level: t.level
		}])),
		dataGaps: $n(e.dataGaps),
		memoryCount: Qn(e.memoryCount) ?? 0
	};
}
function sr(e) {
	return Array.isArray(e) ? e.filter(Y).map((e) => ({
		id: X(e.id),
		title: X(e.title),
		source: X(e.source),
		date: X(e.date),
		role: X(e.role),
		axis: X(e.axis),
		confidence: X(e.confidence),
		url: er(e.url)
	})).filter((e) => !!(e.id && (e.title || e.source))) : [];
}
function cr(e) {
	return Array.isArray(e) ? e.filter(Y).filter((e) => {
		let t = X(e.artifactType).toLowerCase(), n = X(e.type).toLowerCase(), r = X(e.evidenceRole).toLowerCase(), i = X(e.sourceLayer ?? e.source_layer).toLowerCase(), a = tr(e.generatedBy ?? e.generated_by);
		return t !== "user_note" && n !== "user_note" && r !== "hypothesis" && i !== "hypothesis" && i !== "primary_processed" && a !== "folioos";
	}).map((e) => ({
		sourceId: X(e.sourceId),
		title: X(e.title),
		source: X(e.source),
		date: X(e.date),
		evidenceRole: X(e.evidenceRole),
		reliability: X(e.reliability),
		usedInSections: $n(e.usedInSections),
		url: er(e.url),
		artifactType: X(e.artifactType),
		artifactId: X(e.artifactId),
		path: X(e.path),
		axisKey: X(e.axisKey),
		researchQuestionId: X(e.researchQuestionId),
		researchRound: Qn(e.researchRound)
	})).filter((e) => !!(e.sourceId && (e.title || e.source))) : [];
}
function lr(e) {
	return Array.isArray(e) ? e.filter(Y).map((e) => ({
		id: X(e.id),
		severity: X(e.severity),
		description: X(e.description),
		suggestedAction: X(e.suggestedAction),
		resolved: e.resolved === !0
	})).filter((e) => !!(e.id && e.description)) : [];
}
function ur(e) {
	return !Y(e) || ![
		"score",
		"grade",
		"status",
		"warnings",
		"suggestedFixes"
	].some((t) => t in e) ? null : {
		score: Qn(e.score),
		grade: X(e.grade),
		status: X(e.status),
		warnings: $n(e.warnings),
		suggestedFixes: $n(e.suggestedFixes)
	};
}
function dr(e) {
	if (!Y(e) || !Y(e.resolution)) return null;
	let t = e.resolution, n = Y(e.zeroEvidence) ? e.zeroEvidence : {}, r = Y(t.providerGenerations) ? t.providerGenerations : {}, i = Array.isArray(t.unusableCandidates) ? t.unusableCandidates.filter(Y).map((e) => ({
		candidateId: X(e.candidateId),
		reason: X(e.reason)
	})).filter((e) => e.candidateId) : [];
	return {
		schemaVersion: Qn(t.schemaVersion),
		collectionId: X(t.collectionId),
		collectionRevision: Qn(t.collectionRevision),
		collectionDefinitionHash: X(t.collectionDefinitionHash),
		eligibleTotal: Qn(t.eligibleTotal),
		candidateCap: Qn(t.candidateCap),
		resolvedCandidateIds: $n(t.resolvedCandidateIds),
		executionUniverseIds: $n(t.executionUniverseIds),
		selectedEvidenceIds: $n(t.selectedEvidenceIds),
		unusableCandidates: i,
		truncated: t.truncated === !0,
		resolvedAt: X(e.resolvedAt),
		zeroEvidenceRequired: n.required === !0,
		zeroEvidenceReason: X(n.reasonCode),
		resolutionFingerprint: X(n.resolutionFingerprint),
		providerGenerations: {
			indexGeneration: typeof r.indexGeneration == "string" ? r.indexGeneration : null,
			rssGeneration: typeof r.rssGeneration == "string" ? r.rssGeneration : null
		},
		inputWatermark: typeof t.inputWatermark == "string" ? t.inputWatermark : null
	};
}
function fr(e) {
	return e === null ? null : typeof e == "string" ? e : void 0;
}
function pr(e) {
	if (!Y(e) || typeof e.reason != "string" || typeof e.injected != "boolean") return;
	let t = {
		policy: X(e.policy),
		requestedScope: X(e.requestedScope),
		resolvedScope: X(e.resolvedScope),
		injected: e.injected,
		reason: e.reason
	};
	if (!Y(e.ref)) return e.injected ? void 0 : t;
	let n = e.ref, r = fr(n.snapshotId), i = fr(n.asOf), a = fr(n.inputWatermark), o = fr(n.relevantEvidenceWatermark);
	if (!(r === void 0 || i === void 0 || a === void 0 || o === void 0 || typeof n.sourceKind != "string" || typeof n.scope != "string" || typeof n.status != "string" || typeof n.freshnessReason != "string" || typeof n.invalidWatermarkRows != "number" || !Number.isFinite(n.invalidWatermarkRows) || typeof n.resolvedAt != "string" || n.layer !== "source-grounded")) return {
		...t,
		ref: {
			snapshotId: r,
			sourceKind: n.sourceKind,
			scope: n.scope,
			asOf: i,
			status: n.status,
			freshnessReason: n.freshnessReason,
			inputWatermark: a,
			relevantEvidenceWatermark: o,
			invalidWatermarkRows: n.invalidWatermarkRows,
			resolvedAt: n.resolvedAt,
			layer: "source-grounded"
		}
	};
}
function mr(e) {
	return !Y(e) || typeof e.approvalId != "string" || typeof e.executedAt != "string" ? null : {
		schemaVersion: Qn(e.schemaVersion),
		approvalId: e.approvalId,
		planHash: X(e.planHash),
		requestedMode: X(e.requestedMode),
		attemptedEngine: X(e.attemptedEngine),
		finalEngine: X(e.finalEngine),
		fallbackReason: e.fallbackReason === null ? null : X(e.fallbackReason),
		adapter: X(e.adapter),
		executedAt: e.executedAt
	};
}
function hr(e, t) {
	if (!Y(e)) return null;
	let n = nr(t);
	if (![
		"markdown",
		"stale",
		"staleReason",
		"canonicalRevision",
		"linkedNotes",
		"counterEvidence",
		"contradictions",
		"uncertainties",
		"personalQuestions"
	].some((t) => t in e)) return null;
	let r = nr(e.canonicalRevision), i = !!(n && r && (n.number !== null && r.number !== null && n.number !== r.number || n.hash && r.hash && n.hash !== r.hash)), a = Array.isArray(e.linkedNotes) ? e.linkedNotes.filter(Y).map((e) => ({
		title: X(e.title),
		type: X(e.type),
		ticker: X(e.ticker)
	})).filter((e) => e.title) : [], o = e.stale === !0 || e.staleReason === "canonical_revision_changed" || i;
	return {
		markdown: X(e.markdown),
		stale: o,
		staleReason: X(e.staleReason),
		canonicalRevision: r,
		linkedNotes: a,
		counterEvidence: $n(e.counterEvidence),
		contradictions: $n(e.contradictions),
		uncertainties: $n(e.uncertainties),
		personalQuestions: $n(e.personalQuestions),
		revisionState: o ? "stale" : r && n ? "current" : "legacy_unknown"
	};
}
function gr(e, t, n) {
	return !(t in e) || e[t] === void 0 ? !1 : n === "array" ? !Array.isArray(e[t]) : !Y(e[t]);
}
function _r(e) {
	if (!Y(e) || typeof e.id != "string" || !e.id.trim() || typeof e.markdown != "string") throw Error("topic_report_contract_invalid");
	let t = [];
	for (let n of [
		"evidenceItems",
		"sourceLedger",
		"dataGaps",
		"checkpoints"
	]) gr(e, n, "array") && t.push(n + "_invalid");
	for (let n of [
		"topicPlan",
		"evidencePackSummary",
		"quality",
		"researchResolution",
		"personalOverlay",
		"qualityPreflight",
		"executionProvenance",
		"marketTape",
		"marketStateResolution"
	]) gr(e, n, "record") && t.push(n + "_invalid");
	let n = sr(e.evidenceItems), r = cr(e.sourceLedger), i = lr(e.dataGaps), a = ar(e.topicPlan), o = or(e.evidencePackSummary), s = ur(e.quality), c = dr(e.researchResolution), l = pr(e.marketStateResolution), u = mr(e.executionProvenance);
	Array.isArray(e.evidenceItems) && n.length < e.evidenceItems.length && t.push("evidenceItems_rows_invalid"), Array.isArray(e.sourceLedger) && r.length < e.sourceLedger.length && t.push("sourceLedger_rows_invalid"), Array.isArray(e.dataGaps) && i.length < e.dataGaps.length && t.push("dataGaps_rows_invalid"), e.marketStateResolution !== void 0 && !l && !t.includes("marketStateResolution_invalid") && t.push("marketStateResolution_invalid"), e.executionProvenance !== void 0 && !u && !t.includes("executionProvenance_invalid") && t.push("executionProvenance_invalid");
	let d = nr(e.canonicalRevision), f = hr(e.personalOverlay, d);
	for (let [n, r] of [
		["topicPlan", a],
		["evidencePackSummary", o],
		["quality", s],
		["researchResolution", c],
		["personalOverlay", f]
	]) n in e && e[n] !== void 0 && r === null && !t.includes(n + "_invalid") && t.push(n + "_invalid");
	let p = Y(e.generation) ? {
		message: X(e.generation.message),
		mode: X(e.generation.mode),
		generatedAt: X(e.generation.generatedAt)
	} : null, m = Array.isArray(e.sources) ? e.sources.filter(Y).map((e) => ({
		source: X(e.source),
		date: X(e.date),
		title: X(e.title),
		url: er(e.url),
		path: X(e.path)
	})).filter((e) => e.title || e.source || e.url || e.path) : [];
	return {
		id: e.id,
		topicKey: X(e.topicKey),
		topicLabel: X(e.topicLabel),
		date: X(e.date),
		generatedAt: X(e.generatedAt),
		mode: X(e.mode),
		saved: e.saved === !0,
		markdown: e.markdown,
		docCount: Qn(e.docCount) ?? 0,
		memoryCount: Qn(e.memoryCount) ?? 0,
		userContext: typeof e.userContext == "string" || typeof e.userContext == "boolean" ? e.userContext : !1,
		generation: p,
		sources: m,
		topicPlan: a,
		evidencePackSummary: o,
		evidenceItems: n,
		sourceLedger: r,
		dataGaps: i,
		quality: s,
		researchResolution: c,
		marketStateResolution: l,
		qualityPreflight: Y(e.qualityPreflight) ? e.qualityPreflight : null,
		executionProvenance: u,
		checkpoints: Array.isArray(e.checkpoints) ? e.checkpoints.filter(Y) : [],
		marketTape: Y(e.marketTape) ? e.marketTape : null,
		canonicalRevision: d,
		personalOverlay: f,
		contractWarnings: t
	};
}
function vr(e) {
	return Array.isArray(e) ? e.filter(Y).map((e) => ({
		id: X(e.id),
		topicKey: X(e.topicKey),
		topicLabel: X(e.topicLabel),
		date: X(e.date),
		generatedAt: X(e.generatedAt),
		mode: X(e.mode),
		saved: e.saved === !0,
		engine: X(e.engine),
		engineDetail: X(e.engineDetail)
	})).filter((e) => !!e.id) : [];
}
var yr = {
	macro_analysis: "거시 분석",
	cross_asset_analysis: "크로스에셋 분석",
	industry_theme: "산업 테마",
	supply_chain_theme: "공급망 테마",
	policy_regulation: "정책·규제",
	geopolitical_risk: "지정학 리스크",
	earnings_theme: "실적 테마",
	factor_style: "팩터·스타일",
	company_basket: "기업군 비교",
	country_market: "국가 시장",
	portfolio_implication: "포트폴리오 영향",
	custom_research: "자유 리서치"
};
function br(e) {
	let t = String(e || "");
	return yr[t] || t || "유형 미상";
}
function xr(e) {
	switch (e) {
		case "llm": return "LLM이 작성";
		case "edited": return "직접 수정함";
		case "preset": return "저장된 주제";
		default: return "규칙으로 작성";
	}
}
//#endregion
//#region src/app/changeEvents.ts
var Sr = {
	added: "새로 등장",
	removed: "사라짐",
	changed: "내용 변화"
}, Cr = {
	market_driver: "시장 동인",
	issue_coverage: "이슈 보도",
	market_metric: "지표"
};
function wr(e) {
	let t = Number(e);
	return Number.isFinite(t) ? t.toLocaleString(void 0, { maximumFractionDigits: 2 }) : String(e ?? "");
}
function Tr(e) {
	let t = e || {}, n = Number(t.rank), r = Number(t.share), i = [];
	return Number.isFinite(n) && n > 0 && i.push(`${n}순위`), Number.isFinite(r) && r > 0 && i.push(`비중 ${Math.round(r * 100)}%`), i.join(" · ");
}
function Er(e, t) {
	if (t == null) return "";
	if (e.kind === "market_metric" || typeof t != "object") return wr(t);
	let n = Tr(t);
	if (n) return n;
	let r = t, i = [];
	return r.market && i.push(String(r.market)), r.impact && i.push(String(r.impact)), !i.length && Number(r.docCount) > 0 && i.push(`기사 ${Number(r.docCount)}건`), i.join(" · ");
}
function Dr(e) {
	let t = e.currentValue || {}, n = e.previousValue || {}, r = Number(t.rank), i = Number(n.rank), a = Number(t.share), o = [];
	return Number.isFinite(r) && r > 0 && o.push(Number.isFinite(i) && i > 0 && i !== r ? `${i}순위 → ${r}순위` : `${r}순위`), Number.isFinite(a) && a > 0 && o.push(`비중 ${Math.round(a * 100)}%`), o.join(" · ");
}
function Or(e) {
	let t = e.currentValue;
	if (e.kind === "market_metric") return e.previousValue != null && t != null ? `${wr(e.previousValue)} → ${wr(t)}` : t == null ? "" : wr(t);
	if (e.kind === "market_driver") return Dr(e);
	if (t && typeof t == "object") {
		let e = t, n = [];
		return Array.isArray(e.markets) && e.markets.length ? n.push(e.markets.join(", ")) : e.market && n.push(String(e.market)), Number(e.docCount) > 0 && n.push(`기사 ${Number(e.docCount)}건`), e.impact && n.push(String(e.impact)), n.join(" · ");
	}
	return "";
}
function kr(e) {
	let t = e.changedItems || [];
	if (!t.length) return "";
	let n = t[0], r = Sr[String(n.change || "")] || "변화", i = Cr[String(n.kind || "")], a = i ? `${i} ${r}` : r, o = t.length > 1 ? `외 ${t.length - 1}건` : "";
	return [
		a,
		Or(n),
		o
	].filter(Boolean).join(" · ");
}
var Ar = {
	briefing: "브리핑",
	company_analysis: "기업 분석",
	topic_report: "딥 리서치",
	market_memory: "시장 내러티브"
}, jr = [
	"us",
	"kr",
	"europe",
	"jp"
];
b.us, b.kr, b.europe, b.jp;
var Mr = [
	"blue",
	"teal",
	"gold",
	"purple"
];
function Nr(e, t) {
	return e.isOther ? "other" : Mr[t] || "other";
}
function Pr(e) {
	let t = e.deltaPp;
	return t == null || !Number.isFinite(t) ? {
		text: "",
		tone: "flat"
	} : Math.abs(t) < 1 ? {
		text: "─",
		tone: "flat"
	} : t > 0 ? {
		text: `▲ +${Math.round(t)}%p`,
		tone: "up"
	} : {
		text: `▼ ${Math.round(t)}%p`,
		tone: "down"
	};
}
function Fr({ market: e }) {
	let [t, n] = (0, d.useState)(null), [r, i] = (0, d.useState)("");
	if ((0, d.useEffect)(() => {
		let t = !0;
		return i(""), G(`/api/dashboard/story-share?market=${e}`).then((e) => {
			t && n(e);
		}).catch((e) => {
			t && i(e instanceof Error ? e.message : "이야기 비중을 불러오지 못했습니다.");
		}), () => {
			t = !1;
		};
	}, [e]), r) return /* @__PURE__ */ (0, f.jsx)("p", {
		className: "story-share__note",
		children: r
	});
	if (!t) return /* @__PURE__ */ (0, f.jsx)("p", {
		className: "story-share__note",
		children: "이야기 비중을 계산하는 중입니다."
	});
	let a = t.items || [];
	return a.length ? /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "story-share",
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "story-share__head",
				children: [/* @__PURE__ */ (0, f.jsx)("span", {
					className: "story-share__title",
					children: "오늘의 이야기 비중"
				}), /* @__PURE__ */ (0, f.jsxs)("span", {
					className: "story-share__meta",
					children: [
						"수집 기사 ",
						t.collectedCount || 0,
						"건 · 직전 거래일 대비"
					]
				})]
			}),
			t.smallSample && /* @__PURE__ */ (0, f.jsxs)("p", {
				className: "story-share__note",
				children: [
					"수집량이 적어(",
					t.collectedCount || 0,
					"건) 비중과 증감이 크게 흔들릴 수 있습니다."
				]
			}),
			/* @__PURE__ */ (0, f.jsx)("div", {
				className: "story-share__bar",
				role: "img",
				"aria-label": `이야기 비중: ${a.map((e) => `${e.label} ${Math.round(e.share * 100)}%`).join(", ")}`,
				children: a.map((e, t) => /* @__PURE__ */ (0, f.jsx)("span", {
					"data-tone": Nr(e, t),
					style: { width: `${Math.max(e.share * 100, 1)}%` }
				}, e.label))
			}),
			/* @__PURE__ */ (0, f.jsx)("ul", {
				className: "story-share__legend",
				children: a.map((e, t) => {
					let n = Pr(e);
					return /* @__PURE__ */ (0, f.jsxs)("li", {
						"data-other": e.isOther ? "true" : void 0,
						children: [
							/* @__PURE__ */ (0, f.jsx)("span", {
								className: "story-share__dot",
								"data-tone": Nr(e, t),
								"aria-hidden": "true"
							}),
							/* @__PURE__ */ (0, f.jsx)("span", {
								className: "story-share__label",
								children: e.label
							}),
							/* @__PURE__ */ (0, f.jsxs)("span", {
								className: "story-share__count",
								children: [e.count, "건"]
							}),
							/* @__PURE__ */ (0, f.jsxs)("span", {
								className: "story-share__share",
								children: [Math.round(e.share * 100), "%"]
							}),
							/* @__PURE__ */ (0, f.jsx)("span", {
								className: "story-share__delta",
								"data-tone": n.tone,
								children: e.isOther ? "" : n.text
							})
						]
					}, e.label);
				})
			}),
			/* @__PURE__ */ (0, f.jsx)("p", {
				className: "story-share__note",
				children: "수집된 뉴스 기준 규칙 계산 · 브리핑과 독립 · 비중 이동은 보도량 변화일 뿐 내용 변화가 아닙니다"
			})
		]
	}) : /* @__PURE__ */ (0, f.jsx)("p", {
		className: "story-share__note",
		children: "이 날짜에 수집된 시장 뉴스가 없습니다. RSS 수집 후 다시 확인해 주세요."
	});
}
//#endregion
//#region src/app/dashboard/ChangeFeed.tsx
var Ir = {
	major_change: "중대한 변화",
	developing_signal: "발전 중",
	conflicting_uncertain: "충돌·불확실",
	no_material_change: "중대한 변화 없음",
	baseline_created: "기준선 생성",
	insufficient_basis: "근거 부족"
}, Lr = {
	new_information: {
		label: "새 정보",
		tone: "burgundy"
	},
	reversal: {
		label: "방향 전환",
		tone: "gold"
	},
	trend_development: {
		label: "흐름 진전",
		tone: "blue"
	},
	coverage_shift_only: {
		label: "보도량 이동",
		tone: "muted"
	},
	no_new_information: {
		label: "변화 없음",
		tone: "muted"
	},
	not_evaluated: {
		label: "내용 미평가",
		tone: "muted"
	}
}, Rr = [
	"new_information",
	"reversal",
	"trend_development",
	"coverage_shift_only",
	"no_new_information",
	"not_evaluated"
];
function zr(e) {
	let t = String(e.artifactKind || ""), n = String(e.artifactId || "");
	if (t === "briefing") {
		let t = n.slice(0, 10);
		return /^\d{4}-\d{2}-\d{2}$/.test(t) ? `#/briefing/${t}/${Vr(n, e.lineageId)}` : "#/briefing";
	}
	return t === "company_analysis" ? "#/analysis" : t === "topic_report" ? "#/deep-research" : t === "market_memory" ? "#/market-memory" : "#/dashboard";
}
var Br = [
	"us",
	"kr",
	"europe",
	"jp"
];
function Vr(e, t) {
	return Br.find((t) => e.endsWith(`.${t}`)) || RegExp(`^briefing:(${Br.join("|")})$`).exec(String(t || ""))?.[1] || "both";
}
function Hr(e) {
	let t = e.changedItems || [];
	for (let e of Rr) {
		let n = t.find((t) => t.semanticVerdict === e);
		if (n) return n;
	}
	return t[0];
}
function Ur(e) {
	let t = Hr(e), n = [`${Ar[e.artifactKind || ""] || "보고서"} 변화에 대해 물어볼게. 주제: ${t?.subject || "변화 항목"}`], r = t ? Er(t, t.previousValue) : "", i = t ? Er(t, t.currentValue) : "";
	(r || i) && n.push(`변화: ${r || "기준 없음"} → ${i || "현재 없음"}`);
	let a = Lr[String(t?.semanticVerdict || "")];
	a && n.push(`의미 분류: ${a.label}`), t?.semanticNote && n.push(`분류 근거: ${t.semanticNote}`);
	let o = [...(t?.previousContextDocs || []).map((e) => `직전: ${e}`), ...(t?.contextDocs || []).map((e) => `현재: ${e}`)];
	return o.length && n.push(`대표 기사:\n${o.map((e) => `- ${e}`).join("\n")}`), e.baselineRef?.id && n.push(`비교 기준: ${e.baselineRef.id}`), n.push("이 변화가 실제로 얼마나 중요한지, 투자 관점에서 무엇을 확인해야 하는지 설명해줘."), n.join("\n");
}
function Wr(e) {
	return Ar[e.artifactKind || ""] || e.artifactKind || "보고서";
}
function Gr(e) {
	return `${e.artifactKind}-${e.artifactId}-${e.generatedAt}`;
}
function Kr({ event: e }) {
	(0, d.useEffect)(() => {
		gn().applyAgentBranding?.();
	}, []);
	let t = Hr(e), n = Lr[String(t?.semanticVerdict || "")], r = t?.semanticNote || kr(e);
	return /* @__PURE__ */ (0, f.jsx)("li", {
		"data-status": e.status,
		"data-tone": n?.tone || "",
		children: /* @__PURE__ */ (0, f.jsxs)("div", {
			className: "cockpit-change-card",
			children: [
				/* @__PURE__ */ (0, f.jsxs)("div", {
					className: "cockpit-change-card__meta",
					children: [
						/* @__PURE__ */ (0, f.jsx)("span", {
							className: "chip status-chip",
							children: Ir[e.status || ""] || e.status
						}),
						n ? /* @__PURE__ */ (0, f.jsx)("span", {
							className: "chip change-verdict-chip",
							"data-tone": n.tone,
							children: n.label
						}) : null,
						/* @__PURE__ */ (0, f.jsx)("time", { children: e.generatedAt ? new Date(e.generatedAt).toLocaleString("ko-KR") : "" })
					]
				}),
				/* @__PURE__ */ (0, f.jsx)("strong", { children: t?.subject || Wr(e) }),
				r ? /* @__PURE__ */ (0, f.jsx)("em", {
					className: "cockpit-change-reason",
					children: r
				}) : null,
				/* @__PURE__ */ (0, f.jsxs)("div", {
					className: "cockpit-change-card__actions",
					children: [/* @__PURE__ */ (0, f.jsx)("button", {
						type: "button",
						className: "btn btn--sm",
						onClick: () => {
							window.location.hash = zr(e);
						},
						children: "보고서 열기"
					}), /* @__PURE__ */ (0, f.jsx)("button", {
						type: "button",
						className: "btn btn--icon agent-action agent-ask-btn",
						"data-tooltip": "Agent에게 묻기",
						"data-tooltip-pos": "left",
						"aria-label": "Agent에게 묻기",
						onClick: () => nt({ message: Ur(e) }),
						children: /* @__PURE__ */ (0, f.jsx)("span", {
							className: "agent-logo-slot",
							"aria-hidden": "true"
						})
					})]
				})
			]
		})
	});
}
function qr({ events: e }) {
	let [t, n] = (0, d.useState)("us"), r = e.filter((e) => {
		let t = String(Hr(e)?.semanticVerdict || "");
		return t === "new_information" || t === "reversal" || t === "trend_development";
	}), i = e.length - r.length;
	return /* @__PURE__ */ (0, f.jsxs)("section", {
		className: "cockpit-panel cockpit-change-feed",
		"aria-labelledby": "cockpit-change-title",
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "cockpit-panel__head",
				children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "CHANGE INTELLIGENCE" }), /* @__PURE__ */ (0, f.jsx)("h2", {
					id: "cockpit-change-title",
					children: "무엇이 달라졌나"
				})] }), /* @__PURE__ */ (0, f.jsx)("div", {
					className: "segment story-share__toggle",
					role: "group",
					"aria-label": "이야기 비중 시장",
					children: jr.map((e) => /* @__PURE__ */ (0, f.jsx)("button", {
						type: "button",
						"aria-pressed": t === e,
						onClick: () => n(e),
						children: y[e]
					}, e))
				})]
			}),
			/* @__PURE__ */ (0, f.jsx)(Fr, { market: t }),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "cockpit-change-feed__subhead",
				children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "내용의 변화" }), /* @__PURE__ */ (0, f.jsxs)("b", { children: [r.length, "건"] })]
			}),
			r.length ? /* @__PURE__ */ (0, f.jsx)("ol", { children: r.map((e) => /* @__PURE__ */ (0, f.jsx)(Kr, { event: e }, Gr(e))) }) : /* @__PURE__ */ (0, f.jsx)("p", {
				className: "cockpit-empty",
				children: i > 0 ? `내용 변화를 판정하지 못한 기록이 ${i}건 있습니다. 설정에서 AI Agent를 연결하면 무엇이 달라졌는지 읽어 줍니다.` : "아직 확인된 내용 변화가 없습니다."
			})
		]
	});
}
//#endregion
//#region src/app/briefing/BriefingChangeStrip.tsx
function Jr({ summary: e }) {
	if (!e || !e.status) return null;
	let t = (e.changedItems || []).filter((e) => e.semanticVerdict || e.semanticNote || e.subject);
	if (!t.length || ["baseline_created", "insufficient_basis"].includes(String(e.status))) return null;
	let n = t.filter((e) => [
		"new_information",
		"reversal",
		"trend_development"
	].includes(String(e.semanticVerdict || ""))).slice(0, 3), r = n.length ? n : t.slice(0, 1), i = e.baselineRef?.id ? `${e.baselineRef.id} 대비` : "";
	return /* @__PURE__ */ (0, f.jsxs)("aside", {
		className: "briefing-change-strip",
		"data-status": e.status,
		"aria-label": "이 브리핑에서 달라진 것",
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "briefing-change-strip__head",
				children: [
					/* @__PURE__ */ (0, f.jsx)("span", {
						className: "chip status-chip",
						children: Ir[e.status] || e.status
					}),
					/* @__PURE__ */ (0, f.jsx)("strong", { children: "이 브리핑에서 달라진 것" }),
					i ? /* @__PURE__ */ (0, f.jsx)("em", { children: i }) : null
				]
			}),
			/* @__PURE__ */ (0, f.jsx)("ul", { children: r.map((e) => {
				let t = Lr[String(e.semanticVerdict || "")];
				return /* @__PURE__ */ (0, f.jsxs)("li", { children: [
					/* @__PURE__ */ (0, f.jsx)("span", {
						className: "briefing-change-strip__subject",
						children: e.subject
					}),
					t ? /* @__PURE__ */ (0, f.jsx)("span", {
						className: "chip change-verdict-chip",
						"data-tone": t.tone,
						children: t.label
					}) : null,
					e.semanticNote ? /* @__PURE__ */ (0, f.jsx)("span", {
						className: "briefing-change-strip__note",
						children: e.semanticNote
					}) : null
				] }, e.id || e.subject);
			}) }),
			n.length ? null : /* @__PURE__ */ (0, f.jsx)("p", {
				className: "briefing-change-strip__fallback",
				children: kr(e)
			})
		]
	});
}
//#endregion
//#region src/app/BriefingRoute.tsx
var Yr = [
	"us",
	"kr",
	"europe",
	"jp"
], Xr = {
	us: y.us,
	kr: y.kr,
	europe: y.europe,
	jp: y.jp
};
function Zr(e) {
	return e.length === 1 ? e[0] : e.length === Yr.length ? "all" : e.length === 2 && e.includes("us") && e.includes("kr") ? "both" : "multi";
}
var Qr = [
	...Yr,
	"all",
	"both",
	"multi"
], $r = {
	us: "미국",
	kr: "한국",
	europe: "유럽",
	jp: "일본",
	all: "통합",
	both: "통합",
	multi: "선택 시장"
}, ei = {
	us: "US",
	kr: "KR",
	europe: "EU",
	jp: "JP",
	all: "ALL",
	both: "US/KR",
	multi: "MULTI"
}, ti = /* @__PURE__ */ new Set([
	"미국장",
	"한국장",
	"유럽장",
	"일본장",
	"종합",
	"선택 시장"
]), ni = {
	default: "기본",
	market_focused: "시황 중심",
	concise: "요약"
}, ri = 20;
function ii(e) {
	return String(e || "").replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1.$2.$3");
}
function ai(e) {
	let t = String(e || "").match(/^(\d{4})-(\d{2})/);
	return t ? `${t[1]}.${t[2]}` : "월 미상";
}
function oi() {
	let e = /* @__PURE__ */ new Date(), t = e.getTimezoneOffset() * 6e4;
	return new Date(e.getTime() - t).toISOString().slice(0, 10);
}
function si(e) {
	return String(e || "").replace(/\s+[—–-]\s+\d{4}[.-]\d{2}[.-]\d{2}\s*$/, "").trim();
}
function ci(e) {
	let t = hi(e), n = gi(e), r = n === "us" ? "US Market Briefing" : n === "kr" ? "KR Market Briefing" : si(e.title || "Daily Market Briefing"), i = ii(t), a = e.title || (i ? `${r} — ${i}` : r), o = (e.tags || []).filter((e) => !ti.has(String(e || "").trim())), s = i ? `${dn(e.reportDate || e.date)} KST 발행` : "발행일 미상";
	return {
		date: t,
		scope: n,
		title: a,
		chips: o,
		engine: e.engine || "",
		engineDetail: e.engineDetail || "",
		foot: s
	};
}
function li(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function ui(e) {
	return Qr.includes(e) ? e : "both";
}
function di() {
	let e = window.location.hash.match(/^#\/?briefing\/(\d{4}-\d{2}-\d{2})(?:\/(us|kr|europe|jp|all|both))?$/);
	return e ? {
		date: e[1],
		scope: ui(e[2])
	} : null;
}
function fi() {
	return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "briefing";
}
function pi(e, t = "both") {
	window.location.hash = e ? `#/briefing/${e}/${t}` : "#/briefing";
}
function mi(e = "", t = "시장 브리핑") {
	let n = e.replace(/\r\n/g, "\n").split("\n"), r = n.findIndex((e) => e.trim());
	if (r < 0) return {
		title: t,
		body: ""
	};
	let i = n[r].trim().match(/^#\s+(.+)$/);
	return i ? {
		title: i[1],
		body: n.slice(r + 1).join("\n").trim()
	} : {
		title: t,
		body: e
	};
}
function hi(e) {
	return e.reportDate || e.date || "";
}
function gi(e) {
	return ui(e.marketScope || e.scope);
}
function _i(e) {
	return String(e || "").trim().toLowerCase();
}
function vi(e, t) {
	let n = String(t || e || "note"), r = 2166136261;
	for (let e = 0; e < n.length; e += 1) r ^= n.charCodeAt(e), r = Math.imul(r, 16777619) >>> 0;
	return `${e}-${r.toString(36)}`;
}
function yi(e, t) {
	return {
		id: vi("brief", `${e}:${t}`),
		noteType: "market_memo",
		title: e ? `브리핑 ${e} 투자 노트` : "브리핑 투자 노트",
		label: e ? `브리핑 ${e}` : "브리핑",
		topic: t,
		reportKind: "briefing",
		reportId: e,
		linkedReports: [e ? `Daily Market Briefing — ${e}` : ""].filter(Boolean)
	};
}
function bi(e) {
	let t = e;
	return !!(t?.id && U(t.status));
}
async function xi(e) {
	let t = e;
	for (; U(t.status);) await li(1e3), t = await G(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "브리핑 생성에 실패했습니다.");
	return t;
}
function Si() {
	let e = un("briefing"), [t, n] = (0, d.useState)(null), [r, i] = (0, d.useState)(() => di()), [a, o] = (0, d.useState)(null), [s, c] = (0, d.useState)(!1), [l, u] = (0, d.useState)(!1), [p, m] = (0, d.useState)(""), [h, g] = (0, d.useState)(""), [_, v] = (0, d.useState)(""), [y, b] = (0, d.useState)(["us"]), { isSelected: x } = hn(), S = Yr.filter((e) => x(e)), C = Zr(y);
	function w(e) {
		b((t) => {
			let n = t.includes(e) ? t.filter((t) => t !== e) : [...t, e];
			return n.length ? Yr.filter((e) => n.includes(e)) : t;
		});
	}
	let [T, E] = (0, d.useState)("default"), [D, O] = (0, d.useState)(() => oi()), [k, A] = (0, d.useState)(""), [j, M] = (0, d.useState)("all"), [N, P] = (0, d.useState)("all"), [F, I] = (0, d.useState)(""), [L, R] = (0, d.useState)(""), [z, B] = (0, d.useState)("recent"), [V, ee] = (0, d.useState)(0), H = (0, d.useCallback)(async () => {
		c(!0), m("");
		try {
			let e = await G(`/api/briefings/index?${new URLSearchParams({
				offset: "0",
				limit: "100",
				q: k,
				marketScope: j,
				briefingType: N,
				dateFrom: F,
				dateTo: L
			})}`);
			n(e), q("briefing", {
				surface: "briefing",
				viewId: "briefing",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			m(e instanceof Error ? e.message : "브리핑 목록을 불러오지 못했습니다.");
		} finally {
			c(!1);
		}
	}, [
		L,
		j,
		k,
		F,
		N
	]);
	(0, d.useEffect)(() => {
		H();
	}, [H, e]), (0, d.useEffect)(() => {
		let e = () => {
			fi() && i(di());
		};
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []), (0, d.useEffect)(() => {
		let e = (e) => {
			let t = e.detail;
			ze(t, window.FolioAgent?.currentContext) && ee((e) => e + 1);
		};
		return window.addEventListener(ce, e), () => window.removeEventListener(ce, e);
	}, []), (0, d.useEffect)(() => {
		let e = !0;
		async function t(t, n) {
			c(!0), m("");
			try {
				let r = await G(`/api/briefings/${encodeURIComponent(t)}?includePersonal=true&marketScope=${encodeURIComponent(n)}`);
				if (!e) return;
				o(r), q("briefing", {
					surface: "briefing_reader",
					viewId: "briefing",
					reportKind: "briefing",
					reportId: t,
					marketScope: n
				});
			} catch (t) {
				if (!e) return;
				o(null), m(t instanceof Error ? t.message : "브리핑을 불러오지 못했습니다.");
			} finally {
				e && c(!1);
			}
		}
		return r ? t(r.date, r.scope) : (o(null), q("briefing", {
			surface: "briefing",
			viewId: "briefing",
			reportKind: "",
			reportId: ""
		})), () => {
			e = !1;
		};
	}, [r, V]);
	async function U(e) {
		let t = a?.date || r?.date || "", n = ui(a?.marketScope || r?.scope);
		if (t) {
			v(e), g(e === "notion" ? "Notion에 내보내는 중..." : "Obsidian에 내보내는 중...");
			try {
				let r = e === "notion" ? await K(`/api/briefings/${encodeURIComponent(t)}/export-notion?marketScope=${encodeURIComponent(n)}`, { marketScope: n }) : await K(`/api/briefings/${encodeURIComponent(t)}/export-obsidian?marketScope=${encodeURIComponent(n)}`, { marketScope: n });
				g(e === "notion" ? r.notionUrl ? `Notion 내보냄: ${r.title || r.notionUrl}` : "Notion에 내보냈습니다." : `Obsidian 내보냄: ${r.filename || t}`);
			} catch (e) {
				g(e instanceof Error ? e.message : "내보내기에 실패했습니다.");
			} finally {
				v("");
			}
		}
	}
	async function W() {
		let e = a?.date || r?.date || "", t = ui(a?.marketScope || r?.scope);
		if (e) {
			v("overlay"), g("개인 해석을 생성하는 중...");
			try {
				let n = await K(`/api/briefings/${encodeURIComponent(e)}/personal-overlay?marketScope=${encodeURIComponent(t)}`, { marketScope: t });
				bi(n) && await xi(n);
				let r = await G(`/api/briefings/${encodeURIComponent(e)}?includePersonal=true&marketScope=${encodeURIComponent(t)}`);
				o(r), g("개인 해석을 생성했습니다.");
			} catch (e) {
				g(e instanceof Error ? e.message : "개인 해석 생성에 실패했습니다.");
			} finally {
				v("");
			}
		}
	}
	async function te(e, t) {
		if (e && window.confirm(`${e} ${$r[t]} 브리핑을 삭제할까요?`)) {
			v(`delete-${e}-${t}`);
			try {
				let n = t === "both" || t === "all" ? "" : `?market=${encodeURIComponent(t)}`;
				await fetch(`/api/briefings/${encodeURIComponent(e)}${n}`, { method: "DELETE" }), await H();
			} catch (e) {
				m(e instanceof Error ? e.message : "브리핑 삭제에 실패했습니다.");
			} finally {
				v("");
			}
		}
	}
	async function ne(e) {
		u(!0), m("");
		try {
			let t = await K("/api/briefings", {
				date: e || void 0,
				strictDate: !!e,
				markets: y,
				briefingType: T
			});
			if (bi(t)) {
				let n = await xi(t), r = n.result?.date || n.result?.artifactId || e || "";
				await H(), r && pi(r, C);
				return;
			}
			let n = t.date || e || "";
			await H(), n && pi(n, ui(t.marketScope || C));
		} catch (e) {
			m(e instanceof Error ? e.message : "브리핑 생성에 실패했습니다.");
		} finally {
			u(!1);
		}
	}
	let re = t?.items || [], ie = (0, d.useMemo)(() => {
		let e = _i(k);
		return re.filter((t) => {
			let n = hi(t), r = gi(t), i = t.briefingType || "default";
			if (j === "aggregate") {
				if (r !== "all" && r !== "both") return !1;
			} else if (j !== "all" && r !== j) return !1;
			return N !== "all" && i !== N || F && n && n < F || L && n && n > L ? !1 : !e || _i([
				t.title,
				n,
				t.sessionDate,
				t.generatedAt,
				i,
				...t.tags || []
			].filter(Boolean).join(" ")).includes(e);
		});
	}, [
		L,
		j,
		k,
		F,
		N,
		re
	]), ae = (0, d.useMemo)(() => {
		let e = [...ie].sort((e, t) => String(hi(t) || t.generatedAt || "").localeCompare(String(hi(e) || e.generatedAt || "")));
		if (z === "recent") return e.length ? [{
			label: "최근 브리핑",
			rows: e.slice(0, ri)
		}] : [];
		if (z === "month") {
			let t = /* @__PURE__ */ new Map();
			for (let n of e) {
				let e = ai(hi(n));
				t.has(e) || t.set(e, []), t.get(e)?.push(n);
			}
			return Array.from(t.entries()).map(([e, t]) => ({
				label: e,
				rows: t
			}));
		}
		return [
			"us",
			"kr",
			"europe",
			"jp",
			"both"
		].map((t) => ({
			label: `${$r[t]} 시장`,
			rows: e.filter((e) => gi(e) === t)
		})).filter((e) => e.rows.length > 0);
	}, [z, ie]), oe = (0, d.useMemo)(() => mi(a?.markdown || "", a?.title || "시장 브리핑"), [a?.markdown, a?.title]), se = a?.title || oe.title, le = a?.publicationDate || a?.date || r?.date || "";
	return r && a ? /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "react-briefing-route",
		"data-briefing-route": !0,
		children: [p && /* @__PURE__ */ (0, f.jsx)("p", {
			className: "react-dashboard-error",
			children: p
		}), /* @__PURE__ */ (0, f.jsxs)(Kn, {
			eyebrow: "DAILY BRIEFING",
			title: se,
			meta: `${ii(le)} KST 발행`,
			agentContext: {
				surface: "briefing_reader",
				viewId: "briefing",
				reportKind: "briefing",
				reportId: a.date || r.date,
				marketScope: ui(a.marketScope || r.scope)
			},
			breadcrumb: /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [/* @__PURE__ */ (0, f.jsx)("button", {
				type: "button",
				onClick: () => pi(),
				children: "브리핑"
			}), /* @__PURE__ */ (0, f.jsx)("span", { children: se })] }),
			onClose: () => pi(),
			actionSlot: /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [
				/* @__PURE__ */ (0, f.jsx)(_n, {
					title: "AI",
					children: /* @__PURE__ */ (0, f.jsx)(vn, {
						icon: "agent",
						onClick: () => nt({
							surface: "briefing_reader",
							reportKind: "briefing",
							reportId: a.date || r.date,
							marketScope: ui(a.marketScope || r.scope),
							message: `${se}의 핵심과 투자 판단 체크포인트를 요약해줘.`,
							autoSubmit: !0
						}),
						children: "Agent에게 묻기"
					})
				}),
				/* @__PURE__ */ (0, f.jsx)(_n, {
					title: "노트",
					children: /* @__PURE__ */ (0, f.jsx)(vn, {
						icon: "link",
						disabled: _ === "overlay",
						onClick: W,
						children: _ === "overlay" ? "생성 중" : "내 노트와 연결"
					})
				}),
				/* @__PURE__ */ (0, f.jsxs)(_n, {
					title: "내보내기",
					children: [/* @__PURE__ */ (0, f.jsx)(vn, {
						icon: "notion",
						disabled: _ === "notion",
						onClick: () => U("notion"),
						children: _ === "notion" ? "내보내는 중" : "Notion으로 내보내기"
					}), /* @__PURE__ */ (0, f.jsx)(vn, {
						icon: "obsidian",
						disabled: _ === "obsidian",
						onClick: () => U("obsidian"),
						children: _ === "obsidian" ? "내보내는 중" : "Obsidian으로 내보내기"
					})]
				}),
				h && /* @__PURE__ */ (0, f.jsx)("p", {
					className: "react-reader-status",
					children: h
				})
			] }),
			noteIdentity: yi(a.date || r.date, ui(a.marketScope || r.scope)),
			noteLinkedTitle: se,
			noteOverlay: hr(a.personalOverlay, a.canonicalRevision),
			children: [/* @__PURE__ */ (0, f.jsx)(Jr, { summary: a.changeSummary }), /* @__PURE__ */ (0, f.jsx)(Tn, {
				markdown: oe.body || a.markdown || "",
				marketScope: ui(a.marketScope || r.scope),
				briefing: a,
				sourcePanelHtml: gn().briefingSourcePanelHtml?.(a) || ""
			})]
		})]
	}) : /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "react-briefing-route",
		"data-briefing-route": !0,
		children: [
			/* @__PURE__ */ (0, f.jsx)(qn, {
				eyebrow: "Briefing",
				title: "브리핑",
				description: "수집된 최신 뉴스와 시장 데이터로 미국·한국·유럽·일본장 흐름을 요약합니다.",
				actions: /* @__PURE__ */ (0, f.jsx)("button", {
					className: "btn",
					type: "button",
					onClick: H,
					disabled: s,
					children: s ? "불러오는 중" : "새로고침"
				})
			}),
			/* @__PURE__ */ (0, f.jsx)("section", {
				className: "brief-gen-box input-panel react-briefing-generation",
				"aria-label": "브리핑 생성",
				children: /* @__PURE__ */ (0, f.jsxs)("section", {
					className: "brief-gen-panel brief-gen-settings",
					children: [
						/* @__PURE__ */ (0, f.jsx)("div", {
							className: "brief-gen-panel-head",
							children: /* @__PURE__ */ (0, f.jsx)("h3", { children: "브리핑 설정" })
						}),
						/* @__PURE__ */ (0, f.jsxs)("div", {
							className: "brief-gen-settings-row",
							children: [/* @__PURE__ */ (0, f.jsx)("div", {
								className: "brief-gen-field brief-gen-market-field",
								children: /* @__PURE__ */ (0, f.jsxs)("div", {
									className: "brief-market-segment",
									role: "group",
									"aria-label": "생성할 시장",
									"data-scope": C,
									children: [/* @__PURE__ */ (0, f.jsx)("span", {
										className: "brief-market-segment-title",
										children: "시장"
									}), (S.length ? S : Yr).map((e) => /* @__PURE__ */ (0, f.jsxs)("label", { children: [/* @__PURE__ */ (0, f.jsx)("input", {
										type: "checkbox",
										name: "reactBriefingMarkets",
										value: e,
										checked: y.includes(e),
										onChange: () => w(e)
									}), /* @__PURE__ */ (0, f.jsx)("span", { children: Xr[e] })] }, e))]
								})
							}), /* @__PURE__ */ (0, f.jsxs)("label", {
								className: "gen-option quality-option",
								children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "유형" }), /* @__PURE__ */ (0, f.jsx)("select", {
									value: T,
									onChange: (e) => E(e.currentTarget.value),
									children: Object.entries(ni).map(([e, t]) => /* @__PURE__ */ (0, f.jsx)("option", {
										value: e,
										children: t
									}, e))
								})]
							})]
						}),
						/* @__PURE__ */ (0, f.jsxs)("div", {
							className: "brief-gen-actionbar",
							children: [
								/* @__PURE__ */ (0, f.jsx)("button", {
									className: "btn btn--primary",
									type: "button",
									onClick: () => ne(),
									disabled: l,
									children: l ? "생성 중" : "오늘 브리핑 생성"
								}),
								/* @__PURE__ */ (0, f.jsx)("span", {
									className: "brief-gen-alt",
									children: "또는"
								}),
								/* @__PURE__ */ (0, f.jsx)("input", {
									type: "date",
									value: D,
									onChange: (e) => O(e.currentTarget.value),
									"aria-label": `${$r[C]} 기준일`,
									title: `${$r[C]} 세션 기준일`
								}),
								/* @__PURE__ */ (0, f.jsx)("button", {
									className: "btn",
									type: "button",
									onClick: () => ne(D),
									disabled: l || !D,
									children: "이 기준일로 생성"
								})
							]
						})
					]
				})
			}),
			p && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-error",
				children: p
			}),
			/* @__PURE__ */ (0, f.jsxs)("section", {
				className: "find-bar",
				"aria-label": "저장 브리핑 검색",
				children: [
					/* @__PURE__ */ (0, f.jsx)("input", {
						className: "find-bar__search",
						type: "search",
						value: k,
						onChange: (e) => A(e.currentTarget.value),
						placeholder: "제목·요약·본문 검색",
						"aria-label": "저장 브리핑 검색"
					}),
					/* @__PURE__ */ (0, f.jsxs)("label", {
						className: "find-bar__field",
						children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "시장" }), /* @__PURE__ */ (0, f.jsxs)("select", {
							"aria-label": "브리핑 시장",
							value: j,
							onChange: (e) => M(e.currentTarget.value),
							children: [
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "all",
									children: "전체"
								}),
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "us",
									children: "미국장"
								}),
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "kr",
									children: "한국장"
								}),
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "europe",
									children: "유럽장"
								}),
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "jp",
									children: "일본장"
								}),
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "aggregate",
									children: "종합 보고서"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, f.jsxs)("label", {
						className: "find-bar__field",
						children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "유형" }), /* @__PURE__ */ (0, f.jsxs)("select", {
							"aria-label": "브리핑 유형",
							value: N,
							onChange: (e) => P(e.currentTarget.value),
							children: [/* @__PURE__ */ (0, f.jsx)("option", {
								value: "all",
								children: "전체"
							}), Object.entries(ni).map(([e, t]) => /* @__PURE__ */ (0, f.jsx)("option", {
								value: e,
								children: t
							}, e))]
						})]
					}),
					/* @__PURE__ */ (0, f.jsxs)("label", {
						className: "find-bar__field",
						children: [
							/* @__PURE__ */ (0, f.jsx)("span", { children: "기간" }),
							/* @__PURE__ */ (0, f.jsx)("input", {
								type: "date",
								"aria-label": "시작일",
								value: F,
								onChange: (e) => I(e.currentTarget.value)
							}),
							/* @__PURE__ */ (0, f.jsx)("input", {
								type: "date",
								"aria-label": "종료일",
								value: L,
								onChange: (e) => R(e.currentTarget.value)
							})
						]
					}),
					/* @__PURE__ */ (0, f.jsxs)("label", {
						className: "find-bar__field",
						children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "보기" }), /* @__PURE__ */ (0, f.jsxs)("select", {
							"aria-label": "브리핑 보기 방식",
							value: z,
							onChange: (e) => B(e.currentTarget.value),
							children: [
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "recent",
									children: "최근"
								}),
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "month",
									children: "월별"
								}),
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "market",
									children: "시장별"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, f.jsx)("button", {
						className: "btn btn--text find-bar__reset",
						type: "button",
						onClick: () => {
							A(""), M("all"), P("all"), I(""), R(""), B("recent");
						},
						children: "초기화"
					})
				]
			}),
			/* @__PURE__ */ (0, f.jsxs)("section", {
				className: "briefing-archive-feed",
				"aria-label": "저장 브리핑",
				children: [/* @__PURE__ */ (0, f.jsxs)("div", {
					className: "react-section-heading",
					children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("p", {
						className: "section-kicker",
						children: "Saved Briefings"
					}), /* @__PURE__ */ (0, f.jsx)("h2", { children: "저장된 브리핑" })] }), /* @__PURE__ */ (0, f.jsx)("span", {
						"aria-live": "polite",
						children: s ? "불러오는 중..." : `${ie.length}건${k ? " · 검색 결과" : ""}`
					})]
				}), ae.length ? ae.map((e) => /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "briefing-archive-date-group",
					children: [/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "report-feed-group-head",
						children: [/* @__PURE__ */ (0, f.jsx)("span", {
							className: "report-feed-group-name",
							children: e.label
						}), /* @__PURE__ */ (0, f.jsx)("span", {
							className: "report-feed-group-meta",
							children: fn(e.rows.length, e.rows[0]?.generatedAt)
						})]
					}), e.rows.map((e) => {
						let t = ci(e), n = _ === `delete-${t.date}-${t.scope}`;
						return /* @__PURE__ */ (0, f.jsxs)("div", {
							className: "briefing-archive-card-wrap",
							children: [/* @__PURE__ */ (0, f.jsxs)("button", {
								type: "button",
								className: `briefing-archive-card is-${t.scope}`,
								onClick: () => t.date && pi(t.date, t.scope),
								children: [
									/* @__PURE__ */ (0, f.jsxs)("span", {
										className: "briefing-archive-card-meta",
										children: [
											/* @__PURE__ */ (0, f.jsx)("span", {
												className: "briefing-archive-market",
												children: ei[t.scope]
											}),
											t.chips.map((e) => /* @__PURE__ */ (0, f.jsx)("span", {
												className: "chip briefing-archive-chip",
												children: e
											}, e)),
											t.engine && /* @__PURE__ */ (0, f.jsx)("span", {
												className: "chip briefing-archive-chip",
												children: t.engine
											})
										]
									}),
									/* @__PURE__ */ (0, f.jsx)("strong", { children: t.title }),
									/* @__PURE__ */ (0, f.jsx)("span", {
										className: "briefing-archive-card-foot",
										children: t.foot
									})
								]
							}), /* @__PURE__ */ (0, f.jsx)("button", {
								type: "button",
								className: "briefing-archive-card-delete",
								disabled: n,
								onClick: () => te(t.date, t.scope),
								"aria-label": `${t.date} 브리핑 삭제`,
								"data-tooltip": "삭제",
								"data-tooltip-pos": "bottom",
								children: /* @__PURE__ */ (0, f.jsx)("svg", {
									width: "14",
									height: "14",
									viewBox: "0 0 16 16",
									fill: "none",
									stroke: "currentColor",
									strokeWidth: "1.4",
									strokeLinecap: "round",
									strokeLinejoin: "round",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, f.jsx)("path", { d: "M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" })
								})
							})]
						}, e.id || `${t.date}-${t.scope}`);
					})]
				}, e.label)) : /* @__PURE__ */ (0, f.jsx)("div", {
					className: "briefing-archive-empty",
					children: "조건에 맞는 저장 브리핑이 없습니다."
				})]
			})
		]
	});
}
//#endregion
//#region src/app/routes.ts
var Ci = [
	{
		id: "home",
		label: "홈",
		group: "home"
	},
	{
		id: "dashboard",
		label: "대시보드",
		group: "home"
	},
	{
		id: "briefing",
		label: "브리핑",
		group: "research"
	},
	{
		id: "rss",
		label: "RSS 피드",
		group: "research"
	},
	{
		id: "market-memory",
		label: "시장 내러티브",
		group: "research"
	},
	{
		id: "analysis",
		label: "기업 분석",
		group: "research"
	},
	{
		id: "deep-research",
		label: "딥 리서치",
		group: "research"
	},
	{
		id: "watchlist",
		label: "워치리스트",
		group: "home"
	},
	{
		id: "portfolio",
		label: "포트폴리오",
		group: "portfolio"
	},
	{
		id: "settings",
		label: "설정",
		group: "system"
	}
], wi = Ci.filter((e) => e.visibleInNav !== !1), Ti = "home";
function Ei(e) {
	let t = e.replace(/^#\/?/, "").split("/")[0];
	return Ci.some((e) => e.id === t) ? t : Ti;
}
function Di(e) {
	return `#/${e}`;
}
function Oi(e) {
	return Ci.find((t) => t.id === e) ?? Ci[0];
}
//#endregion
//#region src/app/CommandPalette.tsx
function ki(e) {
	return e === "home" ? "Agent Home" : e === "dashboard" ? "위젯과 하단 대시보드" : e === "briefing" ? "저장 브리핑과 생성" : e === "rss" ? "RSS 수집 자료" : e === "market-memory" ? "중기 시장 내러티브" : e === "analysis" ? "기업 분석 보고서" : e === "deep-research" ? "딥 리서치 보고서" : e === "watchlist" ? "워치리스트" : "설정";
}
var Ai = [
	"us",
	"kr",
	"europe",
	"jp",
	"all",
	"both"
];
function ji(e) {
	return e && Ai.includes(e) ? e : "both";
}
function Mi(e) {
	return e.reportDate || e.date || "";
}
function Ni() {
	let [e, t] = (0, d.useState)(!1), [n, r] = (0, d.useState)(""), [i, a] = (0, d.useState)(0), [o, s] = (0, d.useState)(null), c = (0, d.useRef)(null), l = (0, d.useRef)(null), u = (0, d.useRef)(null);
	(0, d.useEffect)(() => {
		if (!e || o) return;
		let t = !0;
		return G("/api/dashboard").then((e) => {
			t && s(e);
		}).catch(() => {
			t && s({ briefings: [] });
		}), () => {
			t = !1;
		};
	}, [o, e]), (0, d.useEffect)(() => {
		if (document.body.classList.toggle("command-palette-open", e), !e) return;
		let t = window.requestAnimationFrame(() => c.current?.focus());
		return () => {
			window.cancelAnimationFrame(t), document.body.classList.remove("command-palette-open");
		};
	}, [e]);
	let p = (0, d.useMemo)(() => {
		let e = wi.map((e) => ({
			id: `route:${e.id}`,
			title: e.label,
			subtitle: ki(e.id),
			type: "화면",
			qa: e.id === "deep-research" ? "command-deep-research" : void 0,
			run: () => {
				window.location.hash = Di(e.id);
			}
		})), t = (o?.briefings || []).slice(0, 12).map((e) => {
			let t = Mi(e), n = ji(e.marketScope || e.scope);
			return {
				id: `briefing:${t}:${n}`,
				title: e.title || `${t} 시장 브리핑`,
				subtitle: [t, n.toUpperCase()].filter(Boolean).join(" · "),
				type: "브리핑",
				run: () => {
					t && (window.location.hash = `#/briefing/${t}/${n}`);
				}
			};
		});
		return [
			{
				id: "action:agent",
				title: "AI Agent 열기",
				subtitle: "현재 화면 컨텍스트로 Agent Dock을 엽니다.",
				type: "액션",
				run: () => nt({ surface: "command_palette" })
			},
			...e,
			...t
		];
	}, [o?.briefings]), m = (0, d.useMemo)(() => {
		let e = n.trim().toLowerCase();
		return (e ? p.filter((t) => `${t.title} ${t.subtitle} ${t.type}`.toLowerCase().includes(e)) : p).slice(0, 40);
	}, [p, n]);
	(0, d.useEffect)(() => {
		a((e) => Math.min(e, Math.max(0, m.length - 1)));
	}, [m.length]);
	function h(e = !0) {
		t(!1), r(""), a(0);
		let n = u.current;
		u.current = null, e && n && window.requestAnimationFrame(() => n.focus({ preventScroll: !0 }));
	}
	function g(e = i) {
		let t = m[e];
		t && (t.run(), h(!1));
	}
	return (0, d.useEffect)(() => {
		let n = (n) => {
			let r = n.key || "";
			if ((n.ctrlKey || n.metaKey) && r.toLowerCase() === "k") {
				n.preventDefault(), e ? h() : (u.current = document.activeElement instanceof HTMLElement ? document.activeElement : null, t(!0));
				return;
			}
			if (e) {
				if (r === "Escape") {
					n.preventDefault(), h();
					return;
				}
				if (r === "ArrowDown") {
					n.preventDefault(), a((e) => Math.min(Math.max(0, m.length - 1), e + 1));
					return;
				}
				if (r === "ArrowUp") {
					n.preventDefault(), a((e) => Math.max(0, e - 1));
					return;
				}
				if (r === "Enter") {
					n.preventDefault(), g();
					return;
				}
				if (r === "Tab") {
					let e = l.current, t = e ? Array.from(e.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex=\"-1\"])")).filter((e) => !e.hidden && e.getAttribute("aria-hidden") !== "true") : [];
					if (!t.length) {
						n.preventDefault(), e?.focus({ preventScroll: !0 });
						return;
					}
					let r = t[0], i = t[t.length - 1];
					n.shiftKey && document.activeElement === r ? (n.preventDefault(), i.focus()) : !n.shiftKey && document.activeElement === i && (n.preventDefault(), r.focus());
				}
			}
		};
		return document.addEventListener("keydown", n), () => document.removeEventListener("keydown", n);
	}, [
		i,
		m,
		e
	]), e ? /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "command-palette react-command-palette",
		"data-react-command-palette": !0,
		children: [/* @__PURE__ */ (0, f.jsx)("button", {
			className: "command-backdrop",
			type: "button",
			"aria-label": "명령 팔레트 닫기",
			onClick: () => h()
		}), /* @__PURE__ */ (0, f.jsxs)("section", {
			ref: l,
			className: "command-dialog",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "reactCommandPaletteTitle",
			tabIndex: -1,
			children: [
				/* @__PURE__ */ (0, f.jsxs)("div", {
					className: "command-input-row",
					children: [/* @__PURE__ */ (0, f.jsx)("span", {
						className: "command-mark",
						"aria-hidden": "true",
						children: "⌘K"
					}), /* @__PURE__ */ (0, f.jsx)("input", {
						ref: c,
						value: n,
						onChange: (e) => {
							r(e.currentTarget.value), a(0);
						},
						placeholder: "화면, 보고서, 액션 검색",
						"aria-label": "명령 검색"
					})]
				}),
				/* @__PURE__ */ (0, f.jsx)("h2", {
					id: "reactCommandPaletteTitle",
					children: "명령 팔레트"
				}),
				/* @__PURE__ */ (0, f.jsx)("div", {
					className: "command-list",
					role: "listbox",
					"aria-label": "명령 목록",
					children: m.length ? m.map((e, t) => /* @__PURE__ */ (0, f.jsxs)("button", {
						className: `command-item${t === i ? " active" : ""}`,
						type: "button",
						"data-qa": e.qa,
						role: "option",
						"aria-selected": t === i,
						onMouseEnter: () => a(t),
						onClick: () => g(t),
						children: [/* @__PURE__ */ (0, f.jsxs)("span", { children: [/* @__PURE__ */ (0, f.jsx)("span", {
							className: "command-item-title",
							children: e.title
						}), /* @__PURE__ */ (0, f.jsx)("span", {
							className: "command-item-subtitle",
							children: e.subtitle
						})] }), /* @__PURE__ */ (0, f.jsx)("span", {
							className: "command-item-type",
							children: e.type
						})]
					}, e.id)) : /* @__PURE__ */ (0, f.jsx)("div", {
						className: "command-empty",
						children: "검색 결과가 없습니다."
					})
				}),
				/* @__PURE__ */ (0, f.jsx)("div", {
					className: "command-footer",
					children: "Ctrl/⌘ K로 열고, Enter로 실행합니다."
				})
			]
		})]
	}) : null;
}
//#endregion
//#region src/app/companyAnalysis/useCompanyResolution.ts
var Pi = 250;
function Fi(e, t) {
	let n = t?.preferHome === !0, [r, i] = (0, d.useState)(null), [a, o] = (0, d.useState)(!1), [s, c] = (0, d.useState)(null), l = (0, d.useRef)(0);
	return (0, d.useEffect)(() => {
		let t = e.trim();
		if (t.length < 1) {
			i(null), o(!1);
			return;
		}
		let r = l.current + 1;
		l.current = r, o(!0);
		let a = window.setTimeout(() => {
			(async () => {
				try {
					let e = await G(`/api/company/resolve?q=${encodeURIComponent(t)}&limit=6${n ? "&prefer=home" : ""}`);
					if (l.current !== r) return;
					i(e);
				} catch {
					if (l.current !== r) return;
					i(null);
				} finally {
					l.current === r && o(!1);
				}
			})();
		}, Pi);
		return () => window.clearTimeout(a);
	}, [e, n]), (0, d.useEffect)(() => c(null), [e]), {
		resolution: r,
		pending: a,
		picked: s,
		setPicked: c,
		effective: s || (r?.status === "confident" ? r.match : null)
	};
}
//#endregion
//#region src/app/reportReader/AnalysisCharts.tsx
var Ii = [
	"var(--folio-chart-1)",
	"var(--folio-chart-2)",
	"var(--folio-chart-3)",
	"var(--folio-chart-4)",
	"var(--folio-chart-5)"
], Li = {
	revenue: "매출",
	grossProfit: "매출총이익",
	operatingIncome: "영업이익",
	netIncome: "순이익",
	operatingCashFlow: "영업활동 현금흐름",
	capitalExpenditure: "설비투자",
	freeCashFlow: "잉여현금흐름",
	grossMargin: "매출총이익률",
	operatingMargin: "영업이익률",
	netMargin: "순이익률",
	fcfMargin: "잉여현금흐름률"
};
function Z(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function Ri(e) {
	return Array.isArray(e) ? e.map(Z) : [];
}
function zi(e) {
	let t = String(e || "USD").toUpperCase();
	return t === "KRW" || t === "KRX" ? "₩" : t === "JPY" ? "¥" : t === "EUR" ? "€" : t === "GBP" ? "£" : "$";
}
function Bi(e, t = "plain", n) {
	if (e === null) return "-";
	if (t === "percent") return `${(e * 100).toFixed(1)}%`;
	if (t === "money") {
		let t = zi(n), r = Math.abs(e);
		return r >= 0xe8d4a51000 ? `${t}${(e / 0xe8d4a51000).toFixed(1)}T` : r >= 1e9 ? `${t}${(e / 1e9).toFixed(1)}B` : r >= 1e6 ? `${t}${(e / 1e6).toFixed(1)}M` : `${t}${e.toLocaleString(void 0, { maximumFractionDigits: 2 })}`;
	}
	return e.toFixed(Math.abs(e) >= 100 ? 0 : 1);
}
function Vi(e) {
	return ({
		performance: [
			["revenue", "money"],
			["operatingIncome", "money"],
			["netIncome", "money"],
			["netMargin", "percent"]
		],
		quarterly: [
			["revenue", "money"],
			["operatingIncome", "money"],
			["netIncome", "money"],
			["netMargin", "percent"]
		],
		cashflow: [
			["operatingCashFlow", "money"],
			["freeCashFlow", "money"],
			["capitalExpenditure", "money"]
		],
		margins: [
			["grossMargin", "percent"],
			["operatingMargin", "percent"],
			["netMargin", "percent"]
		]
	}[String(e.kind || e.id || "")] || []).map(([t, n]) => ({
		key: t,
		label: Li[t] || t,
		values: Ri(e[t]),
		kind: n
	})).filter((e) => e.values.some((e) => e !== null));
}
function Hi(e) {
	let t = e.filter((e) => e !== null);
	if (!t.length) return {
		min: 0,
		max: 1
	};
	let n = Math.min(0, ...t), r = Math.max(0, ...t);
	return n === r ? {
		min: n - 1,
		max: r + 1
	} : {
		min: n,
		max: r
	};
}
function Ui(e, t, n, r = 16, i = 150) {
	return r + (1 - (e - t) / (n - t)) * i;
}
var Wi = {
	height: 300,
	top: 20,
	plot: 212,
	left: 58,
	right: 50
}, Gi = 980, Ki = 200;
function qi() {
	let e = (0, d.useRef)(null), [t, n] = (0, d.useState)(520);
	(0, d.useLayoutEffect)(() => {
		let t = e.current;
		if (!t) return;
		let r = (e) => {
			e > 0 && n(Math.round(e));
		};
		r(t.getBoundingClientRect().width);
		let i = () => r(t.getBoundingClientRect().width);
		window.addEventListener("resize", i);
		let a = typeof ResizeObserver > "u" ? null : new ResizeObserver((e) => r(e[0]?.contentRect.width ?? 0));
		return a?.observe(t), () => {
			window.removeEventListener("resize", i), a?.disconnect();
		};
	}, []);
	let r = Math.max(Ki, Math.min(Gi, t));
	return {
		ref: e,
		width: r,
		offset: Math.max(0, Math.round((t - r) / 2))
	};
}
function Ji(e) {
	let t = 0;
	for (let n of e) t += /[ᄀ-ᇿ　-ヿ一-鿿가-힯＀-￯]/.test(n) ? 13 : 7.2;
	return t;
}
function Yi(e, t) {
	let n = e.reduce((e, t) => Math.max(e, Ji(t)), 0);
	return Math.max(1, Math.ceil((n + 6) / Math.max(1, t)));
}
function Xi(e, t, n = 4) {
	if (!Number.isFinite(e) || !Number.isFinite(t) || e === t) return [e, t];
	let r = (t - e) / n;
	return Array.from({ length: n + 1 }, (t, n) => e + r * n);
}
function Zi({ chart: e, series: t, activeIndex: n, onIndex: r, width: i }) {
	let a = Array.isArray(e.years) ? e.years : [], o = t.filter((e) => e.kind !== "percent"), s = t.filter((e) => e.kind === "percent"), { min: c, max: l } = Hi(o.flatMap((e) => e.values)), u = Hi(s.flatMap((e) => e.values)), { height: d, top: p, plot: m, left: h, right: g } = Wi, _ = (i - h - g) / Math.max(1, a.length), v = Math.max(6, Math.min(_ / (o.length + 1.6), (_ - 18) / Math.max(1, o.length))), y = Ui(0, c, l, p, m), b = (e) => h + e * _ + _ / 2, x = Yi(a, _);
	return /* @__PURE__ */ (0, f.jsxs)("svg", {
		className: "analysis-chart-svg",
		width: i,
		height: d,
		viewBox: `0 0 ${i} ${d}`,
		role: "img",
		"aria-label": e.title || "기업 분석 차트",
		children: [
			a.map((e, t) => /* @__PURE__ */ (0, f.jsx)("rect", {
				className: "analysis-chart-band",
				"data-active": t === n ? "true" : void 0,
				x: h + t * _,
				y: p - 4,
				width: _,
				height: m + 8
			}, `band-${e}`)),
			Xi(c, l).map((t) => {
				let n = Ui(t, c, l, p, m);
				return /* @__PURE__ */ (0, f.jsxs)("g", { children: [/* @__PURE__ */ (0, f.jsx)("line", {
					x1: h,
					y1: n,
					x2: i - g,
					y2: n,
					stroke: "var(--folio-border)",
					strokeWidth: "0.5"
				}), /* @__PURE__ */ (0, f.jsx)("text", {
					className: "analysis-chart-axis",
					x: h - 8,
					y: n + 4,
					textAnchor: "end",
					children: Bi(t, "money", e.currency)
				})] }, `tick-${t}`);
			}),
			s.length > 0 && Xi(u.min, u.max, 2).map((e) => /* @__PURE__ */ (0, f.jsx)("text", {
				className: "analysis-chart-axis",
				x: i - g + 8,
				y: Ui(e, u.min, u.max, p, m) + 4,
				children: Bi(e, "percent")
			}, `rate-${e}`)),
			a.map((e, t) => o.map((n, r) => {
				let i = n.values[t];
				if (i === null) return null;
				let a = Ui(i, c, l, p, m), s = b(t) - o.length * v / 2 + r * v;
				return /* @__PURE__ */ (0, f.jsx)("rect", {
					x: s,
					y: Math.min(a, y),
					width: Math.max(2, v - 3),
					height: Math.max(2, Math.abs(y - a)),
					rx: "3",
					fill: Ii[r % Ii.length]
				}, `${n.key}-${e}`);
			})),
			s.map((e, t) => {
				let n = a.map((t, n) => [b(n), e.values[n]]).filter((e) => e[1] !== null).map(([e, t]) => `${e},${Ui(t, u.min, u.max, p, m)}`).join(" ");
				return n ? /* @__PURE__ */ (0, f.jsx)("polyline", {
					points: n,
					fill: "none",
					strokeWidth: "2",
					stroke: Ii[(o.length + t) % Ii.length]
				}, e.key) : null;
			}),
			a.map((e, t) => t === n || (a.length - 1 - t) % x == 0 ? /* @__PURE__ */ (0, f.jsx)("text", {
				className: "analysis-chart-axis",
				"data-active": t === n ? "true" : void 0,
				x: b(t),
				y: d - 16,
				textAnchor: "middle",
				children: e
			}, `x-${e}`) : null),
			a.length > 0 && /* @__PURE__ */ (0, f.jsx)("rect", {
				className: "analysis-chart-marker",
				x: h + n * _ + _ * .2,
				y: p + m + 6,
				width: _ * .6,
				height: 2,
				rx: "1"
			}),
			a.map((e, t) => /* @__PURE__ */ (0, f.jsx)("rect", {
				className: "analysis-chart-hit",
				x: h + t * _,
				y: p - 4,
				width: _,
				height: m + 8,
				tabIndex: 0,
				role: "button",
				"aria-label": `${e} 수치 보기`,
				onMouseEnter: () => r(t, b(t)),
				onFocus: () => r(t, b(t))
			}, `hit-${e}`))
		]
	});
}
function Qi({ chart: e, series: t, activeIndex: n, onIndex: r, width: i }) {
	let a = Array.isArray(e.years) ? e.years : [], { min: o, max: s } = Hi(t.flatMap((e) => e.values)), { height: c, top: l, plot: u, left: d, right: p } = Wi, m = (i - d - p) / Math.max(1, a.length - 1), h = (e) => d + e * m, g = Yi(a, m);
	return /* @__PURE__ */ (0, f.jsxs)("svg", {
		className: "analysis-chart-svg",
		width: i,
		height: c,
		viewBox: `0 0 ${i} ${c}`,
		role: "img",
		"aria-label": e.title || "기업 분석 차트",
		children: [
			Xi(o, s).map((n) => {
				let r = Ui(n, o, s, l, u);
				return /* @__PURE__ */ (0, f.jsxs)("g", { children: [/* @__PURE__ */ (0, f.jsx)("line", {
					x1: d,
					y1: r,
					x2: i - p,
					y2: r,
					stroke: "var(--folio-border)",
					strokeWidth: "0.5"
				}), /* @__PURE__ */ (0, f.jsx)("text", {
					className: "analysis-chart-axis",
					x: d - 8,
					y: r + 4,
					textAnchor: "end",
					children: Bi(n, t[0]?.kind || "percent", e.currency)
				})] }, `tick-${n}`);
			}),
			a.length > 0 && /* @__PURE__ */ (0, f.jsx)("line", {
				className: "analysis-chart-rule",
				x1: h(n),
				y1: l - 4,
				x2: h(n),
				y2: l + u + 4
			}),
			t.map((e, t) => {
				let r = e.values.map((e, t) => e === null ? null : `${h(t)},${Ui(e, o, s, l, u)}`).filter(Boolean).join(" "), i = e.values[n];
				return /* @__PURE__ */ (0, f.jsxs)("g", { children: [/* @__PURE__ */ (0, f.jsx)("polyline", {
					points: r,
					fill: "none",
					stroke: Ii[t % Ii.length],
					strokeWidth: "2",
					strokeLinejoin: "round",
					strokeLinecap: "round"
				}), i != null && /* @__PURE__ */ (0, f.jsx)("circle", {
					cx: h(n),
					cy: Ui(i, o, s, l, u),
					r: "4",
					fill: Ii[t % Ii.length]
				})] }, e.key);
			}),
			a.map((e, t) => t === n || (a.length - 1 - t) % g == 0 ? /* @__PURE__ */ (0, f.jsx)("text", {
				className: "analysis-chart-axis",
				x: h(t),
				y: c - 16,
				textAnchor: "middle",
				children: e
			}, `x-${e}`) : null),
			a.map((e, t) => /* @__PURE__ */ (0, f.jsx)("rect", {
				className: "analysis-chart-hit",
				x: t === 0 ? d : h(t) - m / 2,
				y: l - 4,
				width: t === 0 || t === a.length - 1 ? m / 2 : m,
				height: u + 8,
				tabIndex: 0,
				role: "button",
				"aria-label": `${e} 수치 보기`,
				onMouseEnter: () => r(t, h(t)),
				onFocus: () => r(t, h(t))
			}, `hit-${e}`))
		]
	});
}
function $i({ chart: e, onPoint: t, onLeave: n }) {
	let r = Array.isArray(e.scenarios) ? e.scenarios : [], { max: i } = Hi(r.map((e) => Z(e.perShare ?? e.price))), a = Z(e.currentPrice);
	return /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "analysis-scenario-bars",
		children: [r.map((r, a) => {
			let o = Z(r.perShare ?? r.price), s = o === null || i <= 0 ? 0 : Math.max(4, Math.min(100, o / i * 100)), c = String(r.name || r.label || `Scenario ${a + 1}`), l = Bi(o, "money", e.currency);
			return /* @__PURE__ */ (0, f.jsxs)("div", {
				"aria-label": `${c} ${l}`,
				className: "analysis-scenario-row",
				onBlur: n,
				onFocus: () => t({
					label: c,
					value: l
				}),
				onMouseEnter: () => t({
					label: c,
					value: l
				}),
				onMouseLeave: n,
				tabIndex: 0,
				children: [
					/* @__PURE__ */ (0, f.jsx)("span", { children: c }),
					/* @__PURE__ */ (0, f.jsx)("div", { children: /* @__PURE__ */ (0, f.jsx)("i", { style: {
						width: `${s}%`,
						background: Ii[a % Ii.length]
					} }) }),
					/* @__PURE__ */ (0, f.jsx)("strong", { children: l })
				]
			}, c);
		}), a !== null && /* @__PURE__ */ (0, f.jsxs)("p", {
			className: "analysis-chart-note",
			children: ["현재가: ", Bi(a, "money", e.currency)]
		})]
	});
}
function ea(e) {
	let t = Array.isArray(e.labels) ? e.labels : [], n = Object.entries(e.series || {}).map(([e, t]) => ({
		key: e,
		label: e,
		values: Array.isArray(t) ? t.map((e) => typeof e == "number" ? e / 100 : null) : [],
		kind: "percent"
	}));
	return {
		chart: {
			...e,
			years: t
		},
		series: n
	};
}
function ta({ chart: e, series: t, index: n }) {
	let r = Array.isArray(e.years) ? e.years : [], i = n - (Number(e.compareOffset) > 0 ? Number(e.compareOffset) : 1), a = i >= 0 ? r[i] : "";
	return /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "analysis-chart-readout",
		children: [/* @__PURE__ */ (0, f.jsxs)("p", {
			className: "analysis-chart-readout-head",
			children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: r[n] || "" }), a && /* @__PURE__ */ (0, f.jsxs)("span", { children: [a, " 대비"] })]
		}), t.map((t, r) => {
			let a = t.values[n] ?? null, o = i >= 0 ? t.values[i] ?? null : null, s = "—", c = "flat";
			if (a !== null && o !== null && o !== 0) if (t.kind === "percent") {
				let e = (a - o) * 100;
				c = e >= 0 ? "up" : "down", s = `${e >= 0 ? "+" : ""}${e.toFixed(1)}%p`;
			} else {
				let e = (a - o) / Math.abs(o) * 100;
				c = e >= 0 ? "up" : "down", s = `${e >= 0 ? "+" : ""}${e.toFixed(1)}%`;
			}
			return /* @__PURE__ */ (0, f.jsxs)("p", {
				className: "analysis-chart-readout-row",
				children: [
					/* @__PURE__ */ (0, f.jsx)("span", {
						className: "analysis-chart-swatch",
						style: { background: Ii[r % Ii.length] }
					}),
					/* @__PURE__ */ (0, f.jsx)("span", { children: t.label }),
					/* @__PURE__ */ (0, f.jsx)("b", { children: Bi(a, t.kind, e.currency) }),
					/* @__PURE__ */ (0, f.jsx)("em", {
						"data-direction": c,
						children: s
					})
				]
			}, t.key);
		})]
	});
}
function na({ chart: e }) {
	let [t, n] = (0, d.useState)(null), r = String(e.kind || e.id || ""), i = r === "margins" ? {
		chart: e,
		series: Vi(e)
	} : r === "price_return" ? ea(e) : null, a = [
		"performance",
		"cashflow",
		"quarterly"
	].includes(r) ? {
		chart: e,
		series: Vi(e)
	} : null, o = i ?? a, s = o?.series ?? [], c = Array.isArray(o?.chart.years) ? o?.chart.years : [], [l, u] = (0, d.useState)(null), [p, m] = (0, d.useState)(null), h = qi(), g = (e, t) => {
		u(e), m(t);
	}, _ = Math.max(0, c.length - 1), v = Math.min(l ?? _, _), y = t?.x === void 0 ? void 0 : {
		left: `${Math.max(7, Math.min(93, t.x / h.width * 100))}%`,
		top: `${Math.max(10, t.y || 10)}px`
	};
	return /* @__PURE__ */ (0, f.jsxs)("article", {
		className: "analysis-chart-card",
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "analysis-chart-title",
				children: [/* @__PURE__ */ (0, f.jsx)("h4", { children: e.title || "기업 분석 차트" }), e.subtitle && /* @__PURE__ */ (0, f.jsx)("p", { children: e.subtitle })]
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "analysis-chart-plot",
				onBlur: () => m(null),
				onMouseLeave: () => m(null),
				ref: h.ref,
				children: [
					i && i.series.length ? /* @__PURE__ */ (0, f.jsx)(Qi, {
						chart: i.chart,
						series: i.series,
						activeIndex: v,
						onIndex: g,
						width: h.width
					}) : null,
					a && a.series.length ? /* @__PURE__ */ (0, f.jsx)(Zi, {
						chart: a.chart,
						series: a.series,
						activeIndex: v,
						onIndex: g,
						width: h.width
					}) : null,
					r === "dcf" || r === "scenario_price" ? /* @__PURE__ */ (0, f.jsx)($i, {
						chart: e,
						onPoint: n,
						onLeave: () => n(null)
					}) : null,
					!s.length && !["dcf", "scenario_price"].includes(r) && /* @__PURE__ */ (0, f.jsx)("p", {
						className: "analysis-chart-warning",
						children: "이 차트에 표시할 수치가 충분하지 않습니다."
					}),
					t && /* @__PURE__ */ (0, f.jsxs)("div", {
						className: "analysis-chart-tooltip",
						style: y,
						children: [
							t.series && /* @__PURE__ */ (0, f.jsx)("span", { children: t.series }),
							/* @__PURE__ */ (0, f.jsx)("strong", { children: t.value }),
							/* @__PURE__ */ (0, f.jsx)("em", { children: t.label })
						]
					}),
					p !== null && o && s.length > 0 && /* @__PURE__ */ (0, f.jsxs)("div", {
						className: "analysis-chart-hover",
						"data-side": p > h.width / 2 ? "left" : "right",
						style: p > h.width / 2 ? { right: `calc(100% - ${p + h.offset}px)` } : { left: `${p + h.offset}px` },
						children: [/* @__PURE__ */ (0, f.jsx)("b", { children: c[v] || "" }), s.map((e, t) => /* @__PURE__ */ (0, f.jsxs)("p", { children: [
							/* @__PURE__ */ (0, f.jsx)("span", {
								className: "analysis-chart-swatch",
								style: { background: Ii[t % Ii.length] }
							}),
							/* @__PURE__ */ (0, f.jsx)("span", { children: e.label }),
							/* @__PURE__ */ (0, f.jsx)("em", { children: Bi(e.values[v] ?? null, e.kind, o.chart.currency) })
						] }, e.key))]
					})
				]
			}),
			o && s.length > 0 ? /* @__PURE__ */ (0, f.jsx)(ta, {
				chart: o.chart,
				series: s,
				index: v
			}) : null
		]
	});
}
function ra({ payload: e, chartIds: t, heading: n = "기업 분석 시각화", intro: r = "저장된 공식 재무 데이터와 시장 데이터를 기반으로 생성된 참고 차트입니다.", compact: i = !1 }) {
	let a = t ? new Set(t) : null, o = (Array.isArray(e?.charts) ? e.charts : []).filter((e) => !a || a.has(String(e.id || e.kind || "")));
	return !e?.available || !o.length ? null : /* @__PURE__ */ (0, f.jsxs)("section", {
		className: `analysis-charts-panel analysis-charts-inline${i ? " compact" : ""}`,
		"aria-label": n,
		children: [/* @__PURE__ */ (0, f.jsx)("div", {
			className: "analysis-chart-head",
			children: /* @__PURE__ */ (0, f.jsxs)("div", { children: [
				/* @__PURE__ */ (0, f.jsx)("p", {
					className: "section-kicker",
					children: "Company Visuals"
				}),
				/* @__PURE__ */ (0, f.jsx)("h3", { children: n }),
				/* @__PURE__ */ (0, f.jsx)("p", { children: r })
			] })
		}), /* @__PURE__ */ (0, f.jsx)("div", {
			className: "analysis-chart-grid",
			children: o.map((e, t) => /* @__PURE__ */ (0, f.jsx)(na, { chart: e }, e.id || `${e.title || "chart"}-${t}`))
		})]
	});
}
//#endregion
//#region src/app/reportReader/CompanyAnalysisBody.tsx
var ia = [
	{
		ids: ["performance", "margins"],
		patterns: [/실적|재무|수익성|숫자|손익/i],
		fallbackIndex: 1
	},
	{
		ids: ["cashflow"],
		patterns: [/현금|cash|fcf|free cash|설비투자/i],
		fallbackIndex: 2
	},
	{
		ids: ["dcf", "scenario_price"],
		patterns: [/밸류에이션|가치|valuation|가격|적정가/i],
		fallbackIndex: 3
	},
	{
		ids: ["price_return"],
		patterns: [/주가|시장|접근|핵심 판단|수익률/i],
		fallbackIndex: 0
	}
];
function aa(e = "") {
	let t = e.replace(/\r\n/g, "\n").trim();
	if (!t) return [];
	let n = Array.from(t.matchAll(/^##\s+(.+)$/gm));
	if (!n.length) return [{
		key: "body",
		title: "",
		markdown: t
	}];
	let r = [], i = n[0].index || 0;
	if (i > 0) {
		let e = t.slice(0, i).trim();
		e && r.push({
			key: "intro",
			title: "",
			markdown: e
		});
	}
	return n.forEach((e, i) => {
		let a = e.index || 0, o = i + 1 < n.length && n[i + 1].index || t.length, s = t.slice(a, o).trim();
		r.push({
			key: `section-${i}`,
			title: e[1] || "",
			markdown: s
		});
	}), r;
}
function oa(e) {
	return new Set((Array.isArray(e?.charts) ? e.charts : []).map((e) => String(e?.id || e?.kind || "")).filter(Boolean));
}
function sa(e, t, n, r = /* @__PURE__ */ new Set()) {
	let i = oa(n), a = e.title, o = [];
	for (let e of ia) if (e.patterns.some((e) => e.test(a)) || e.fallbackIndex === t) for (let t of e.ids) i.has(t) && !r.has(t) && o.push(t);
	return o;
}
function ca(e, t = /* @__PURE__ */ new Set()) {
	return Array.from(oa(e)).filter((e) => !t.has(e));
}
function la({ markdown: e, charts: t }) {
	let n = aa(e), r = /* @__PURE__ */ new Set();
	return n.length ? /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [n.map((e, n) => {
		let i = sa(e, n, t, r);
		return i.forEach((e) => r.add(e)), /* @__PURE__ */ (0, f.jsxs)("div", {
			className: "company-analysis-section",
			children: [/* @__PURE__ */ (0, f.jsx)(Tn, { markdown: e.markdown }), i.length > 0 && /* @__PURE__ */ (0, f.jsx)(ra, {
				payload: t,
				chartIds: i,
				heading: "관련 시각화",
				intro: "이 섹션의 판단을 확인할 때 함께 볼 수 있는 수치입니다.",
				compact: !0
			})]
		}, e.key);
	}), ca(t, r).length > 0 && /* @__PURE__ */ (0, f.jsx)(ra, {
		payload: t,
		chartIds: ca(t, r),
		heading: "추가 시각화",
		intro: "본문 섹션에 직접 매칭되지 않은 보조 차트입니다.",
		compact: !0
	})] }) : /* @__PURE__ */ (0, f.jsx)(ra, { payload: t });
}
//#endregion
//#region src/app/CompanyAnalysisRoute.tsx
var ua = [{
	value: "beginner",
	label: "기본",
	description: "쉽게 설명"
}, {
	value: "advanced",
	label: "심화",
	description: "정밀 분석"
}], da = 20;
function fa(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function pa(e) {
	let t = e;
	return !!(t?.id && U(t.status));
}
async function ma(e) {
	let t = e;
	for (; U(t.status);) await fa(1e3), t = await G(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "기업 분석 생성에 실패했습니다.");
	return t;
}
function ha(e = "", t = "기업 분석") {
	let n = e.replace(/\r\n/g, "\n").split("\n"), r = n.findIndex((e) => e.trim());
	if (r < 0) return {
		title: t,
		body: ""
	};
	let i = n[r].trim().match(/^#\s+(.+)$/);
	return i ? {
		title: i[1],
		body: n.slice(r + 1).join("\n").trim()
	} : {
		title: t,
		body: e
	};
}
function ga(e) {
	return String(e.company?.ticker || e.query || e.company?.name || "").trim().toUpperCase();
}
function _a(e) {
	return String(e.company?.name || e.query || ga(e) || "").trim();
}
function va(e) {
	let t = ga(e), n = _a(e);
	return t && n && t !== n ? `${t} · ${n}` : n || t || "기업 분석";
}
function ya(e) {
	return ha(String(e.markdown || ""), "").title.trim() || String(e.headline || "").trim() || va(e);
}
function ba(e) {
	return dn(e) || "미상";
}
function xa(e) {
	return ua.find((t) => t.value === e)?.label || "";
}
function Sa(e) {
	return e === "high" ? "높음" : e === "medium" ? "중간" : e === "low" ? "낮음" : e || "확인 필요";
}
function Ca(e) {
	let t = e?.dataGaps;
	return t ? Array.isArray(t) ? t : Array.isArray(t.gaps) ? t.gaps : [] : [];
}
function wa(e) {
	let t = /* @__PURE__ */ new Set();
	return e.filter((e) => {
		let n = [
			Da(e.field),
			Da(e.label),
			Da(e.category),
			Da(e.message || e.suggestedAction)
		].join("|");
		return !t.has(n) && (t.add(n), !0);
	});
}
function Ta(e) {
	let t = {
		high: 0,
		medium: 1,
		low: 2
	};
	return wa(Ca(e).filter((e) => e.status !== "resolved").sort((e, n) => (t[e.severity || ""] ?? 9) - (t[n.severity || ""] ?? 9)));
}
function Ea(e) {
	if (!e) return "월 미상";
	let t = new Date(e);
	if (!Number.isNaN(t.getTime())) return `${t.getFullYear()}.${String(t.getMonth() + 1).padStart(2, "0")}`;
	let n = String(e).match(/^(\d{4})[-.](\d{1,2})/);
	return n ? `${n[1]}.${String(n[2]).padStart(2, "0")}` : "월 미상";
}
function Da(e) {
	return String(e || "").trim().toLowerCase();
}
function Oa(e) {
	return [
		e.source,
		e.date,
		e.type
	].filter(Boolean).join(" · ");
}
function ka(e) {
	return e.title || e.url || e.path || "자료";
}
function Aa(e) {
	let t = String(e.markdown || "");
	return e.generation?.webSearch ? t.trim() : t.split(/\n(?=#{1,3}\s*(?:8\.\s*)?(?:Sources Used|사용 자료)\b)/i)[0].trim();
}
function ja(e) {
	window.location.hash = e ? `#/analysis/${encodeURIComponent(e)}` : "#/analysis";
}
function Ma() {
	let e = window.location.hash.match(/^#\/?analysis\/(.+)$/);
	return e ? decodeURIComponent(e[1]) : "";
}
function Na() {
	return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "analysis";
}
function Pa() {
	let e = un("companyAnalysis"), [t, n] = (0, d.useState)([]), [r, i] = (0, d.useState)(null), [a, o] = (0, d.useState)(() => Ma()), [s, c] = (0, d.useState)(""), { resolution: l, pending: u, picked: p, setPicked: m, effective: h } = Fi(s), g = p || (l?.status === "confident" ? l.match : null), _ = !!(g && !g.cik && (g.market === "EUROPE" || g.market === "JP")), v = _ ? "out-of-scope" : p ? "picked" : u ? "pending" : l?.status || "idle", y = (() => {
		if (!s.trim()) return "티커, 회사명, 한글 표기 중 무엇으로 적어도 됩니다.";
		if (_ && g) {
			let e = g.market === "JP" ? "일본" : "유럽";
			return `${g.name}는 ${e} 거래소에만 상장되어 있어 아직 분석할 수 없습니다. 미국에도 상장된 기업은 그 티커로 적어 보세요.`;
		}
		return p ? `${p.name} (${p.ticker})으로 분석합니다.` : u ? "확인 중…" : l ? l.status === "confident" && l.match ? `${l.match.name} (${l.match.ticker})으로 분석합니다.` : l.status === "ambiguous" ? "여러 기업이 맞습니다. 아래에서 고르세요." : "아는 기업이 없습니다. 티커로 적어 보세요. 이대로 진행하면 자료가 거의 없는 보고서가 나옵니다." : "";
	})(), [b, x] = (0, d.useState)("beginner"), [S, C] = (0, d.useState)(""), [w, T] = (0, d.useState)("recent"), [E, D] = (0, d.useState)(!1), [O, k] = (0, d.useState)(!1), [A, j] = (0, d.useState)(""), [M, N] = (0, d.useState)(""), [P, F] = (0, d.useState)(""), [I, L] = (0, d.useState)(0), R = (0, d.useCallback)(async () => {
		D(!0), N("");
		try {
			let e = await G("/api/analysis-reports");
			n(Array.isArray(e) ? e : []), q("analysis", {
				surface: "analysis",
				viewId: "analysis",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			N(e instanceof Error ? e.message : "기업 분석 목록을 불러오지 못했습니다.");
		} finally {
			D(!1);
		}
	}, []);
	(0, d.useEffect)(() => {
		R();
	}, [R, e]), (0, d.useEffect)(() => {
		let e = () => {
			Na() && o(Ma());
		};
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []), (0, d.useEffect)(() => {
		let e = (e) => {
			let t = e.detail;
			ze(t, window.FolioAgent?.currentContext) && L((e) => e + 1);
		};
		return window.addEventListener(ce, e), () => window.removeEventListener(ce, e);
	}, []), (0, d.useEffect)(() => {
		let e = !0;
		async function t(t) {
			D(!0), N("");
			try {
				let n = await G(`/api/analysis-reports/${encodeURIComponent(t)}?includePersonal=true`);
				if (!e) return;
				i(n), q("analysis", {
					surface: "analysis_reader",
					viewId: "analysis",
					reportKind: "company_analysis",
					reportId: n.id || t,
					ticker: ga(n)
				});
			} catch (t) {
				if (!e) return;
				i(null), N(t instanceof Error ? t.message : "저장된 기업 분석 보고서를 열지 못했습니다.");
			} finally {
				e && D(!1);
			}
		}
		return a ? t(a) : (i(null), q("analysis", {
			surface: "analysis",
			viewId: "analysis",
			reportKind: "",
			reportId: ""
		})), () => {
			e = !1;
		};
	}, [a, I]);
	async function z(e) {
		e.preventDefault();
		let t = s.trim();
		if (t) {
			k(!0), N(""), F("기업 자료를 읽고 분석 보고서를 생성하는 중입니다.");
			try {
				let e = await G(`/api/analyze?${new URLSearchParams({
					q: h?.ticker || t,
					analysisStyle: b
				}).toString()}`), n;
				if (pa(e)) {
					let t = await ma(e), r = t.result?.reportId || t.result?.artifactId || "";
					if (!r) throw Error("생성된 보고서 ID를 확인하지 못했습니다.");
					n = await G(`/api/analysis-reports/${encodeURIComponent(r)}?includePersonal=true`);
				} else n = e;
				await R(), F("기업 분석 보고서를 생성하고 자동 저장했습니다."), i(n), n.id && ja(n.id);
			} catch (e) {
				N(e instanceof Error ? e.message : "기업 분석 생성에 실패했습니다."), F("");
			} finally {
				k(!1);
			}
		}
	}
	async function B(e) {
		e && ja(e);
	}
	async function V(e) {
		if (e.id && window.confirm(`${va(e)} 보고서를 삭제할까요?`)) {
			j(`delete-${e.id}`), N("");
			try {
				let t = await fetch(`/api/analysis-reports/${encodeURIComponent(e.id)}`, { method: "DELETE" });
				if (!t.ok) throw Error(`삭제 실패: ${t.status}`);
				r?.id === e.id && ja(), await R(), F("저장된 기업 분석 보고서를 삭제했습니다.");
			} catch (e) {
				N(e instanceof Error ? e.message : "보고서 삭제에 실패했습니다.");
			} finally {
				j("");
			}
		}
	}
	async function ee(e) {
		if (r) {
			j(e), F(e === "notion" ? "Notion으로 내보내는 중..." : "Obsidian으로 내보내는 중...");
			try {
				let t = e === "notion" ? await K("/api/export-notion/analysis", r) : await K("/api/export-obsidian/analysis", r);
				F(e === "notion" ? `Notion으로 내보냈습니다${t.title ? `: ${t.title}` : ""}` : `Obsidian으로 내보냈습니다${t.company || t.filename ? `: ${t.company || t.filename}` : ""}`);
			} catch (e) {
				F(e instanceof Error ? e.message : "내보내기에 실패했습니다.");
			} finally {
				j("");
			}
		}
	}
	async function H() {
		if (r?.id) {
			j("overlay"), F("내 노트와 연결하는 중...");
			try {
				let e = await K(`/api/analysis-reports/${encodeURIComponent(r.id)}/personal-overlay`, {});
				pa(e) && await ma(e);
				let t = await G(`/api/analysis-reports/${encodeURIComponent(r.id)}?includePersonal=true`);
				i(t), F("내 노트와 연결했습니다.");
			} catch (e) {
				F(e instanceof Error ? e.message : "내 노트 연결에 실패했습니다.");
			} finally {
				j("");
			}
		}
	}
	let U = (0, d.useMemo)(() => {
		let e = Da(S);
		return e ? t.filter((t) => Da([
			ga(t),
			_a(t),
			va(t),
			t.headline,
			t.mode,
			t.generatedAt,
			ba(t.generatedAt)
		].filter(Boolean).join(" ")).includes(e)) : t;
	}, [S, t]), W = (0, d.useMemo)(() => {
		let e = [...U].sort((e, t) => String(t.generatedAt || "").localeCompare(String(e.generatedAt || "")));
		if (w === "recent") return e.length ? [{
			key: "recent",
			label: `최근 보고서 ${Math.min(e.length, da)}건`,
			rows: e.slice(0, da)
		}] : [];
		if (w === "month") {
			let t = /* @__PURE__ */ new Map();
			for (let n of e) {
				let e = Ea(n.generatedAt);
				t.has(e) || t.set(e, []), t.get(e)?.push(n);
			}
			return Array.from(t.entries()).map(([e, t]) => ({
				key: e,
				label: e,
				rows: t
			}));
		}
		let t = /* @__PURE__ */ new Map();
		for (let n of e) {
			let e = ga(n) || ya(n);
			t.has(e) || t.set(e, []), t.get(e)?.push(n);
		}
		return Array.from(t.entries()).map(([e, t]) => ({
			key: e,
			label: ya(t[0] || {}),
			rows: t.sort((e, t) => String(t.generatedAt || "").localeCompare(String(e.generatedAt || "")))
		})).sort((e, t) => String(t.rows[0]?.generatedAt || "").localeCompare(String(e.rows[0]?.generatedAt || "")));
	}, [U, w]), te = Aa(r || {}), ne = ha(te, r?.headline || va(r || {})), re = r?.sources || [], ie = Ta(r);
	return r ? /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "react-company-analysis-route",
		"data-company-analysis-route": !0,
		children: [M && /* @__PURE__ */ (0, f.jsx)("p", {
			className: "react-dashboard-error",
			children: M
		}), /* @__PURE__ */ (0, f.jsxs)(Kn, {
			eyebrow: `COMPANY ANALYSIS${ga(r) ? ` · ${ga(r)}` : ""}`,
			title: ne.title,
			meta: [r.generatedAt ? `생성일 ${ba(r.generatedAt)}` : "", xa(r.analysisStyle)].filter(Boolean).join(" · "),
			agentContext: {
				surface: "analysis_reader",
				viewId: "analysis",
				reportKind: "company_analysis",
				reportId: r.id || "",
				ticker: ga(r)
			},
			breadcrumb: /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [/* @__PURE__ */ (0, f.jsx)("button", {
				type: "button",
				onClick: () => ja(),
				children: "기업 분석"
			}), /* @__PURE__ */ (0, f.jsx)("span", { children: ne.title })] }),
			onClose: () => ja(),
			actionSlot: /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [
				/* @__PURE__ */ (0, f.jsx)(_n, {
					title: "AI",
					children: /* @__PURE__ */ (0, f.jsx)(vn, {
						icon: "agent",
						onClick: () => nt({
							surface: "analysis_reader",
							reportKind: "company_analysis",
							reportId: r.id || "",
							ticker: ga(r),
							message: `${ne.title}에서 투자 판단에 중요한 핵심, 리스크, 추가 확인 질문을 정리해줘.`,
							autoSubmit: !0
						}),
						children: "Agent에게 묻기"
					})
				}),
				/* @__PURE__ */ (0, f.jsx)(_n, {
					title: "노트",
					children: /* @__PURE__ */ (0, f.jsx)(vn, {
						icon: "link",
						disabled: A === "overlay" || !r.id,
						onClick: H,
						children: A === "overlay" ? "연결 중" : "내 노트와 연결"
					})
				}),
				/* @__PURE__ */ (0, f.jsxs)(_n, {
					title: "내보내기",
					children: [/* @__PURE__ */ (0, f.jsx)(vn, {
						icon: "notion",
						disabled: A === "notion",
						onClick: () => ee("notion"),
						children: A === "notion" ? "내보내는 중" : "Notion으로 내보내기"
					}), /* @__PURE__ */ (0, f.jsx)(vn, {
						icon: "obsidian",
						disabled: A === "obsidian",
						onClick: () => ee("obsidian"),
						children: A === "obsidian" ? "내보내는 중" : "Obsidian으로 내보내기"
					})]
				}),
				ie.length > 0 && /* @__PURE__ */ (0, f.jsx)(_n, {
					title: "자료 한계",
					children: /* @__PURE__ */ (0, f.jsx)("div", {
						className: "react-reader-gap-list",
						children: ie.slice(0, 3).map((e, t) => /* @__PURE__ */ (0, f.jsxs)("div", {
							className: "react-reader-gap",
							children: [
								/* @__PURE__ */ (0, f.jsx)("span", { children: Sa(e.severity) }),
								/* @__PURE__ */ (0, f.jsx)("strong", { children: e.label || e.category || "추가 확인 필요" }),
								/* @__PURE__ */ (0, f.jsx)("p", { children: e.message || e.suggestedAction || "보고서 해석 시 확인이 필요한 자료 한계입니다." })
							]
						}, `${e.field || e.category || "gap"}-${t}`))
					})
				}),
				r.generation?.message && /* @__PURE__ */ (0, f.jsx)("p", {
					className: "react-reader-status",
					children: r.generation.message
				}),
				P && /* @__PURE__ */ (0, f.jsx)("p", {
					className: "react-reader-status",
					children: P
				})
			] }),
			noteIdentity: {
				id: Wn("company", ga(r) || r.headline || "company"),
				noteType: "company_thesis",
				title: ga(r) ? `${ga(r)} 투자 노트` : "기업 투자 노트",
				ticker: ga(r),
				company: r.company?.name || "",
				label: ga(r),
				reportKind: "company_analysis",
				reportId: ga(r),
				linkedReports: [ne.title].filter(Boolean)
			},
			noteLinkedTitle: ne.title,
			noteOverlay: hr(r.personalOverlay, r.canonicalRevision),
			children: [/* @__PURE__ */ (0, f.jsx)(la, {
				markdown: ne.body || te,
				charts: r.analysisCharts
			}), re.length > 0 && /* @__PURE__ */ (0, f.jsxs)("section", {
				className: "source-panel react-analysis-sources",
				children: [/* @__PURE__ */ (0, f.jsx)("h4", { children: "참고자료" }), /* @__PURE__ */ (0, f.jsx)("div", {
					className: "sources",
					children: re.map((e, t) => /* @__PURE__ */ (0, f.jsxs)("div", {
						className: "meta",
						children: [/* @__PURE__ */ (0, f.jsx)("span", { children: Oa(e) }), e.url ? /* @__PURE__ */ (0, f.jsx)("a", {
							href: e.url,
							target: "_blank",
							rel: "noopener noreferrer",
							children: ka(e)
						}) : /* @__PURE__ */ (0, f.jsx)("span", { children: ka(e) })]
					}, `${ka(e)}-${t}`))
				})]
			})]
		})]
	}) : /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "react-company-analysis-route",
		"data-company-analysis-route": !0,
		children: [
			/* @__PURE__ */ (0, f.jsx)(qn, {
				eyebrow: "Company Analysis",
				title: "기업 분석",
				description: "SEC, DART, 시장 데이터와 로컬 자료를 활용해 기업 분석 보고서를 생성합니다.",
				actions: /* @__PURE__ */ (0, f.jsx)("button", {
					className: "btn",
					type: "button",
					onClick: R,
					disabled: E,
					children: E ? "불러오는 중" : "새로고침"
				})
			}),
			/* @__PURE__ */ (0, f.jsxs)("form", {
				className: "react-analysis-form",
				onSubmit: z,
				children: [
					/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "react-analysis-api-note",
						role: "note",
						children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: "API 연동 안내" }), /* @__PURE__ */ (0, f.jsx)("span", { children: "미국 기업은 SEC 자료를 우선 사용하고, 한국 기업은 DART API Key를 설정하면 공시 확인 정확도가 높아집니다." })]
					}),
					/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "react-analysis-query",
						children: [/* @__PURE__ */ (0, f.jsxs)("label", {
							className: "portfolio-ticker-field",
							children: [
								/* @__PURE__ */ (0, f.jsx)("span", { children: "분석 대상" }),
								/* @__PURE__ */ (0, f.jsx)("input", {
									value: s,
									onChange: (e) => c(e.currentTarget.value),
									placeholder: "예: NVDA, 삼성전자, SK하이닉스",
									"aria-describedby": "analysis-resolution",
									autoComplete: "off"
								}),
								l?.status === "ambiguous" && l.candidates.length > 0 && !p && /* @__PURE__ */ (0, f.jsx)("div", {
									className: "ticker-suggest",
									role: "listbox",
									"aria-label": "후보 기업",
									children: l.candidates.map((e) => /* @__PURE__ */ (0, f.jsxs)("button", {
										type: "button",
										role: "option",
										"aria-selected": !1,
										onClick: () => m(e),
										children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: e.ticker }), /* @__PURE__ */ (0, f.jsx)("span", { children: e.name })]
									}, `${e.market}:${e.ticker}`))
								})
							]
						}), /* @__PURE__ */ (0, f.jsx)("p", {
							className: "analysis-resolution",
							id: "analysis-resolution",
							"data-status": v,
							children: y
						})]
					}),
					/* @__PURE__ */ (0, f.jsxs)("fieldset", {
						className: "react-analysis-style",
						"aria-label": "보고서 모드",
						children: [/* @__PURE__ */ (0, f.jsx)("legend", { children: "보고서 모드" }), /* @__PURE__ */ (0, f.jsx)("div", {
							className: "segment react-analysis-style-toggle",
							"data-style": b,
							children: ua.map((e) => /* @__PURE__ */ (0, f.jsx)("button", {
								type: "button",
								"aria-pressed": b === e.value,
								onClick: () => x(e.value),
								"data-tooltip": e.description,
								children: e.label
							}, e.value))
						})]
					}),
					/* @__PURE__ */ (0, f.jsx)("button", {
						className: "btn btn--primary",
						type: "submit",
						disabled: O || !s.trim(),
						children: O ? "분석 중" : "분석"
					})
				]
			}),
			M && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-error",
				children: M
			}),
			P && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-warning",
				children: P
			}),
			/* @__PURE__ */ (0, f.jsxs)("section", {
				className: "find-bar",
				"aria-label": "저장 기업 분석 검색",
				children: [
					/* @__PURE__ */ (0, f.jsx)("input", {
						className: "find-bar__search",
						type: "search",
						value: S,
						onChange: (e) => C(e.currentTarget.value),
						placeholder: "티커·회사명·보고서 검색",
						"aria-label": "저장 기업 분석 검색"
					}),
					/* @__PURE__ */ (0, f.jsxs)("label", {
						className: "find-bar__field",
						children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "보기" }), /* @__PURE__ */ (0, f.jsxs)("select", {
							"aria-label": "기업 분석 보기 방식",
							value: w,
							onChange: (e) => T(e.currentTarget.value),
							children: [
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "recent",
									children: "최근"
								}),
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "company",
									children: "기업별"
								}),
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "month",
									children: "월별"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, f.jsx)("button", {
						className: "btn btn--text find-bar__reset",
						type: "button",
						onClick: () => {
							C(""), T("recent");
						},
						children: "초기화"
					})
				]
			}),
			/* @__PURE__ */ (0, f.jsxs)("section", {
				className: "react-analysis-feed",
				"aria-label": "저장된 기업 분석",
				children: [/* @__PURE__ */ (0, f.jsxs)("div", {
					className: "react-section-heading",
					children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("p", {
						className: "section-kicker",
						children: "Saved Reports"
					}), /* @__PURE__ */ (0, f.jsx)("h2", { children: "저장된 기업 분석" })] }), /* @__PURE__ */ (0, f.jsx)("span", {
						"aria-live": "polite",
						children: E ? "불러오는 중..." : `${U.length}건${S ? " · 검색 결과" : ""}`
					})]
				}), W.length ? W.map((e) => /* @__PURE__ */ (0, f.jsxs)("section", {
					className: "report-feed-group",
					children: [/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "report-feed-group-head",
						children: [/* @__PURE__ */ (0, f.jsx)("span", {
							className: "report-feed-group-name",
							children: e.label
						}), /* @__PURE__ */ (0, f.jsx)("span", {
							className: "report-feed-group-meta",
							children: fn(e.rows.length, e.rows[0]?.generatedAt)
						})]
					}), /* @__PURE__ */ (0, f.jsx)("div", {
						className: "report-feed-group-cards",
						children: e.rows.map((e) => {
							let t = A === `delete-${e.id}`;
							return /* @__PURE__ */ (0, f.jsxs)("div", {
								className: "report-feed-card-wrap",
								children: [/* @__PURE__ */ (0, f.jsxs)("button", {
									className: "report-feed-card is-analysis",
									type: "button",
									onClick: () => B(e.id),
									children: [
										/* @__PURE__ */ (0, f.jsxs)("span", {
											className: "report-feed-card-meta",
											children: [(e.engine || e.mode) && /* @__PURE__ */ (0, f.jsxs)("span", {
												className: "report-feed-badge",
												children: [e.engine || String(e.mode).toUpperCase(), pn(e.engine, e.engineDetail) && /* @__PURE__ */ (0, f.jsx)("em", { children: pn(e.engine, e.engineDetail) })]
											}), e.analysisStyle && /* @__PURE__ */ (0, f.jsx)("span", {
												className: "report-feed-badge",
												children: xa(e.analysisStyle) || String(e.analysisStyle).toUpperCase()
											})]
										}),
										/* @__PURE__ */ (0, f.jsx)("strong", { children: ya(e) }),
										/* @__PURE__ */ (0, f.jsxs)("span", {
											className: "report-feed-card-foot",
											children: ["생성일 ", ba(e.generatedAt)]
										})
									]
								}), /* @__PURE__ */ (0, f.jsx)("button", {
									type: "button",
									className: "report-feed-card-delete",
									disabled: t,
									onClick: () => V(e),
									"aria-label": `${va(e)} 삭제`,
									"data-tooltip": "삭제",
									"data-tooltip-pos": "bottom",
									children: /* @__PURE__ */ (0, f.jsx)("svg", {
										width: "13",
										height: "13",
										viewBox: "0 0 16 16",
										fill: "none",
										stroke: "currentColor",
										strokeWidth: "1.4",
										strokeLinecap: "round",
										strokeLinejoin: "round",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, f.jsx)("path", { d: "M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" })
									})
								})]
							}, e.id || `${ya(e)}-${e.generatedAt}`);
						})
					})]
				}, e.key)) : /* @__PURE__ */ (0, f.jsxs)("article", {
					className: "react-dashboard-panel",
					children: [/* @__PURE__ */ (0, f.jsx)("h2", { children: "저장된 기업 분석 보고서가 없습니다." }), /* @__PURE__ */ (0, f.jsx)("p", { children: "분석 대상을 입력해 첫 보고서를 생성하세요." })]
				})]
			})
		]
	});
}
//#endregion
//#region src/app/dashboard/MarketCalendar.tsx
var Fa = {
	macro: "경제지표",
	central_bank: "중앙은행",
	holiday: "휴장",
	earnings: "실적",
	filing: "공시",
	dividend: "배당"
}, Ia = {
	confirmed: "확정",
	estimated: "추정",
	tentative: "미정",
	actual: "발표됨"
}, La = [
	{
		value: "earnings",
		label: "실적"
	},
	{
		value: "macro",
		label: "지표"
	},
	{
		value: "central_bank",
		label: "중앙은행"
	},
	{
		value: "holiday",
		label: "휴장"
	},
	{
		value: "filing",
		label: "공시"
	},
	{
		value: "dividend",
		label: "배당"
	}
], Ra = (e) => {
	let t = String(e ?? "").replace(/,/g, "").trim();
	if (!t) return null;
	let n = Number(t);
	return Number.isFinite(n) ? n : null;
};
function za(e) {
	let t = Ra(e.actualValue), n = Ra(e.forecastValue);
	if (t !== null && n !== null) {
		let r = t - n, i = r > 0 ? "+" : "";
		return `예상 ${e.forecastValue} 대비 ${i}${Number(r.toFixed(4))}`;
	}
	return e.previousValue ? `직전 ${e.previousValue}` : "";
}
function Ba(e) {
	let t = Ra(e.actualValue), n = Ra(e.forecastValue) ?? Ra(e.previousValue);
	return t === null || n === null || t === n ? "flat" : t > n ? "up" : "down";
}
function Va(e) {
	let t = (e.tickers || [])[0], n = String(e.companyName || "").trim();
	return !t || !n || e.title.includes(n) ? e.title : e.title.replace(t, `${n} (${t})`);
}
var Ha = b, Ua = [
	"US",
	"KR",
	"EUROPE",
	"JP"
], Wa = [
	{
		value: 3,
		label: "최상위",
		hint: "FOMC·금리 결정 같은 최상위 일정만"
	},
	{
		value: 2,
		label: "중간 이상",
		hint: "실적·주요 지표까지"
	},
	{
		value: 1,
		label: "전부",
		hint: "휴장일·배당까지 전부"
	}
], Ga = {
	nyse: "NYSE",
	krx: "KRX",
	lse: "런던",
	xetra: "프랑크푸르트",
	euronext: "파리·암스테르담",
	borsa_italiana: "밀라노",
	bme: "마드리드",
	jpx: "도쿄"
}, Ka = [
	"월",
	"화",
	"수",
	"목",
	"금",
	"토",
	"일"
], qa = 864e5;
function Ja(e) {
	return `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`;
}
function Ya(e) {
	if (e.allDay || /^\d{4}-\d{2}-\d{2}$/.test(e.startsAt)) return e.startsAt.slice(0, 10);
	let t = new Date(e.startsAt);
	return Number.isNaN(t.getTime()) ? e.startsAt.slice(0, 10) : new Intl.DateTimeFormat("sv-SE", {
		timeZone: "Asia/Seoul",
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(t);
}
function Xa(e) {
	if (e.allDay || /^\d{4}-\d{2}-\d{2}$/.test(e.startsAt)) return "종일";
	let t = new Date(e.startsAt);
	if (Number.isNaN(t.getTime())) return "—";
	if (e.kind === "earnings") {
		let e = new Intl.DateTimeFormat("en-GB", {
			timeZone: "America/New_York",
			hour: "2-digit",
			minute: "2-digit",
			hour12: !1
		}).format(t);
		if (e === "00:00") return "발표일";
		if (e < "09:30") return "장전";
		if (e >= "16:00") return "장후";
	}
	return new Intl.DateTimeFormat("ko-KR", {
		timeZone: "Asia/Seoul",
		hour: "2-digit",
		minute: "2-digit",
		hour12: !1
	}).format(t);
}
function Za(e) {
	let t = new Date(e.getFullYear(), e.getMonth(), e.getDate()), n = (t.getDay() + 6) % 7;
	return /* @__PURE__ */ new Date(t.getTime() - n * qa);
}
function Qa(e) {
	if (e.kind === "earnings" && e.tickers?.length) return `${e.tickers[0]} · ${Xa(e)}`;
	if (e.kind === "holiday") {
		let t = Ga[e.provider || ""];
		return t ? `휴장 · ${t}` : e.title.slice(0, 22);
	}
	return e.title.slice(0, 22);
}
function $a({ focusSymbols: e }) {
	let [t, n] = (0, d.useState)([]), [r, i] = (0, d.useState)("week"), [a, o] = (0, d.useState)([]), [s, c] = (0, d.useState)([]), [l, u] = (0, d.useState)(1), { isSelected: p } = hn(), [m, h] = (0, d.useState)(!1), [g, _] = (0, d.useState)(() => /* @__PURE__ */ new Date()), [v, b] = (0, d.useState)(() => Ja(/* @__PURE__ */ new Date())), [x, S] = (0, d.useState)(!1), [C, w] = (0, d.useState)(""), [T, E] = (0, d.useState)(""), D = (0, d.useCallback)(async () => {
		let e = /* @__PURE__ */ new Date(g.getTime() - 40 * qa), t = new Date(g.getTime() + 70 * qa);
		try {
			let r = await G(`/api/market-calendar?start=${encodeURIComponent(e.toISOString())}&end=${encodeURIComponent(t.toISOString())}&limit=500`);
			n(r.events || []), E("");
		} catch (e) {
			E(e instanceof Error ? e.message : "일정을 불러오지 못했습니다.");
		}
	}, [g]);
	(0, d.useEffect)(() => {
		D();
	}, [D]), (0, d.useEffect)(() => {
		G("/api/dashboard/settings").then((e) => {
			(e.calendarView === "week" || e.calendarView === "month") && i(e.calendarView), o(e.calendarKinds || (e.calendarKind && e.calendarKind !== "all" ? [e.calendarKind] : [])), c(e.calendarMarkets || (e.calendarMarket && e.calendarMarket !== "all" ? [e.calendarMarket] : [])), h(!!e.calendarWatchlistOnly), u(Math.min(Math.max(Number(e.calendarMinImportance) || 1, 1), 3));
		}).catch(() => void 0);
	}, []);
	function O(e) {
		K("/api/dashboard/settings", e).catch(() => void 0);
	}
	let k = (0, d.useMemo)(() => new Set(e.filter((e) => e.source !== "fallback").map((e) => e.symbol.toUpperCase())), [e]), A = (0, d.useMemo)(() => t.filter((e) => !(a.length && !a.includes(e.kind) || !p(e.market || "") || (e.importance || 1) < l || s.length && !s.includes((e.market || "").toUpperCase()) || m && !(e.tickers || []).some((e) => k.has(e.toUpperCase())))), [
		t,
		a,
		s,
		m,
		k,
		p,
		l
	]), j = (0, d.useMemo)(() => {
		let e = /* @__PURE__ */ new Map();
		for (let t of A) {
			let n = Ya(t);
			e.set(n, [...e.get(n) || [], t]);
		}
		for (let t of e.values()) t.sort((e, t) => (t.importance || 0) - (e.importance || 0) || e.startsAt.localeCompare(t.startsAt));
		return e;
	}, [A]), M = Za(g), N = Array.from({ length: 7 }, (e, t) => new Date(M.getTime() + t * qa)), P = new Date(g.getFullYear(), g.getMonth(), 1), F = (0, d.useMemo)(() => {
		let e = Za(P), t = [];
		for (let n = 0; n < 42; n += 1) t.push(new Date(e.getTime() + n * qa));
		for (; t.length > 7 && t[t.length - 7].getMonth() !== g.getMonth();) t.splice(-7, 7);
		return t;
	}, [g, P]), I = Ja(/* @__PURE__ */ new Date()), L = j.get(v) || [], R = (/* @__PURE__ */ new Date(`${v}T00:00:00`)).toLocaleDateString("ko-KR", {
		month: "long",
		day: "numeric",
		weekday: "long"
	}), z = (0, d.useMemo)(() => {
		let e = /* @__PURE__ */ new Map();
		for (let t of L) e.set(t.kind, (e.get(t.kind) || 0) + 1);
		return [...e.entries()].map(([e, t]) => `${Fa[e] || e} ${t}`).join(" · ");
	}, [L]);
	function B(e) {
		let t = r === "week" ? 7 * qa : 0;
		_(r === "week" ? (n) => new Date(n.getTime() + e * t) : (t) => new Date(t.getFullYear(), t.getMonth() + e, 1));
	}
	async function V() {
		S(!0), w(""), E("");
		try {
			let e = await K("/api/market-calendar/refresh", {}), t = e.providers?.fred_macro;
			w(`일정 ${e.stored ?? 0}건 수집${t === "fred_key_required" ? " · 미국 지표 일정은 설정에서 FRED API Key를 등록하면 함께 수집됩니다" : ""}`), await D();
		} catch (e) {
			E(e instanceof Error ? e.message : "일정 수집에 실패했습니다.");
		} finally {
			S(!1);
		}
	}
	return /* @__PURE__ */ (0, f.jsxs)("section", {
		className: "cockpit-panel cockpit-calendar",
		"aria-labelledby": "market-calendar-title",
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "cockpit-panel__head",
				children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "MARKET CALENDAR" }), /* @__PURE__ */ (0, f.jsx)("h2", {
					id: "market-calendar-title",
					children: "주요 실적·지표 일정"
				})] }), /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "cockpit-panel__actions",
					children: [
						/* @__PURE__ */ (0, f.jsx)("div", {
							className: "cockpit-chart-controls",
							children: /* @__PURE__ */ (0, f.jsxs)("div", {
								className: "segment",
								role: "group",
								"aria-label": "캘린더 보기",
								children: [/* @__PURE__ */ (0, f.jsx)("button", {
									type: "button",
									"aria-pressed": r === "week",
									onClick: () => {
										i("week"), O({ calendarView: "week" });
									},
									children: "주간"
								}), /* @__PURE__ */ (0, f.jsx)("button", {
									type: "button",
									"aria-pressed": r === "month",
									onClick: () => {
										i("month"), O({ calendarView: "month" });
									},
									children: "월간"
								})]
							})
						}),
						/* @__PURE__ */ (0, f.jsx)("button", {
							className: "btn",
							type: "button",
							"aria-label": r === "week" ? "이전 주" : "이전 달",
							onClick: () => B(-1),
							children: "◀"
						}),
						/* @__PURE__ */ (0, f.jsx)("button", {
							className: "btn",
							type: "button",
							onClick: () => {
								let e = /* @__PURE__ */ new Date();
								_(e), b(Ja(e));
							},
							children: "오늘"
						}),
						/* @__PURE__ */ (0, f.jsx)("button", {
							className: "btn",
							type: "button",
							"aria-label": r === "week" ? "다음 주" : "다음 달",
							onClick: () => B(1),
							children: "▶"
						}),
						/* @__PURE__ */ (0, f.jsx)("button", {
							className: "btn btn--primary",
							type: "button",
							onClick: V,
							disabled: x,
							children: x ? "수집 중" : "일정 수집"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "cal-filter-row",
				role: "group",
				"aria-label": "일정 유형 필터",
				children: [/* @__PURE__ */ (0, f.jsx)("span", {
					className: "cal-filter-label",
					children: "유형"
				}), La.map((e) => /* @__PURE__ */ (0, f.jsx)("button", {
					type: "button",
					className: "cal-filter",
					"aria-pressed": a.includes(e.value),
					onClick: () => {
						let t = a.includes(e.value) ? a.filter((t) => t !== e.value) : [...a, e.value];
						o(t), O({ calendarKinds: t });
					},
					children: e.label
				}, e.value))]
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "cal-filter-row",
				role: "group",
				"aria-label": "일정 시장 필터",
				children: [
					/* @__PURE__ */ (0, f.jsx)("span", {
						className: "cal-filter-label",
						children: "시장"
					}),
					Ua.filter((e) => p(e)).map((e) => /* @__PURE__ */ (0, f.jsx)("button", {
						type: "button",
						className: "cal-filter",
						"aria-pressed": s.includes(e),
						onClick: () => {
							let t = s.includes(e) ? s.filter((t) => t !== e) : [...s, e];
							c(t), O({ calendarMarkets: t });
						},
						children: y[e] || e
					}, e)),
					/* @__PURE__ */ (0, f.jsx)("button", {
						type: "button",
						className: "cal-filter cal-watch-toggle",
						"aria-pressed": m,
						onClick: () => {
							let e = !m;
							h(e), O({ calendarWatchlistOnly: e });
						},
						children: "보유·관심만"
					})
				]
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "cal-filter-row",
				role: "group",
				"aria-label": "일정 중요도 필터",
				children: [/* @__PURE__ */ (0, f.jsx)("span", {
					className: "cal-filter-label",
					children: "중요도"
				}), Wa.map((e) => /* @__PURE__ */ (0, f.jsxs)("button", {
					type: "button",
					className: "cal-filter cal-imp-filter",
					"aria-pressed": l === e.value,
					"data-tooltip": e.hint,
					onClick: () => {
						u(e.value), O({ calendarMinImportance: e.value });
					},
					children: [/* @__PURE__ */ (0, f.jsx)("span", {
						className: "imp",
						"aria-hidden": "true",
						children: [
							1,
							2,
							3
						].map((t) => /* @__PURE__ */ (0, f.jsx)("u", { className: t <= e.value ? "on" : "" }, t))
					}), e.label]
				}, e.value))]
			}),
			C && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-reader-status",
				children: C
			}),
			T && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-error",
				role: "alert",
				children: T
			}),
			r === "week" ? /* @__PURE__ */ (0, f.jsx)("div", {
				className: "cal-week-strip",
				role: "tablist",
				"aria-label": "이번 주",
				children: N.map((e, t) => {
					let n = Ja(e), r = j.get(n) || [], i = [...new Set(r.map((e) => e.kind))].slice(0, 3);
					return /* @__PURE__ */ (0, f.jsxs)("button", {
						type: "button",
						role: "tab",
						"aria-selected": n === v,
						className: `cal-day${n === v ? " cal-day--active" : ""}${t >= 5 ? " cal-day--dim" : ""}${n === I ? " cal-day--today" : ""}`,
						onClick: () => b(n),
						children: [
							/* @__PURE__ */ (0, f.jsxs)("span", { children: [Ka[t], n === I ? " · 오늘" : ""] }),
							/* @__PURE__ */ (0, f.jsxs)("b", { children: [
								e.getMonth() + 1,
								".",
								e.getDate()
							] }),
							/* @__PURE__ */ (0, f.jsx)("small", { children: r.length ? `${r.length}건` : "—" }),
							/* @__PURE__ */ (0, f.jsx)("i", { children: i.map((e) => /* @__PURE__ */ (0, f.jsx)("u", { "data-kind": e }, e)) })
						]
					}, n);
				})
			}) : /* @__PURE__ */ (0, f.jsxs)("div", {
				className: "cal-month-grid",
				"aria-label": `${g.getFullYear()}년 ${g.getMonth() + 1}월`,
				children: [Ka.map((e, t) => /* @__PURE__ */ (0, f.jsx)("span", {
					className: `cal-dow${t >= 5 ? " cal-dow--dim" : ""}`,
					children: e
				}, e)), F.map((e) => {
					let t = Ja(e), n = j.get(t) || [], r = e.getMonth() !== g.getMonth();
					return /* @__PURE__ */ (0, f.jsxs)("button", {
						type: "button",
						className: `cal-cell${t === I ? " cal-cell--today" : ""}${r ? " cal-cell--dim" : ""}${t === v ? " cal-cell--active" : ""}`,
						onClick: () => b(t),
						children: [
							/* @__PURE__ */ (0, f.jsxs)("header", { children: [
								e.getDate(),
								n.length ? /* @__PURE__ */ (0, f.jsxs)("b", { children: [n.length, "건"] }) : null,
								t === I ? /* @__PURE__ */ (0, f.jsx)("i", { children: "오늘" }) : null
							] }),
							n.slice(0, 3).map((e) => /* @__PURE__ */ (0, f.jsx)("span", {
								className: "ev",
								"data-kind": e.kind,
								children: Qa(e)
							}, e.id)),
							n.length > 3 ? /* @__PURE__ */ (0, f.jsxs)("em", { children: [
								"+",
								n.length - 3,
								"건"
							] }) : null
						]
					}, t);
				})]
			}),
			/* @__PURE__ */ (0, f.jsxs)("p", {
				className: "cal-day-head",
				children: [/* @__PURE__ */ (0, f.jsx)("b", { children: R }), L.length ? /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [
					" · ",
					L.length,
					"건 — ",
					z
				] }) : null]
			}),
			L.length ? /* @__PURE__ */ (0, f.jsx)("div", {
				className: "table-scroll",
				children: /* @__PURE__ */ (0, f.jsxs)("table", {
					className: "cal-table",
					children: [/* @__PURE__ */ (0, f.jsx)("thead", { children: /* @__PURE__ */ (0, f.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, f.jsx)("th", {
							scope: "col",
							children: "시간(KST)"
						}),
						/* @__PURE__ */ (0, f.jsx)("th", {
							scope: "col",
							children: "시장"
						}),
						/* @__PURE__ */ (0, f.jsx)("th", {
							scope: "col",
							children: "중요도"
						}),
						/* @__PURE__ */ (0, f.jsx)("th", {
							scope: "col",
							children: "이벤트"
						}),
						/* @__PURE__ */ (0, f.jsx)("th", {
							scope: "col",
							children: "결과"
						}),
						/* @__PURE__ */ (0, f.jsx)("th", {
							scope: "col",
							children: "확정도"
						})
					] }) }), /* @__PURE__ */ (0, f.jsx)("tbody", { children: L.map((e) => /* @__PURE__ */ (0, f.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, f.jsx)("td", { children: Xa(e) }),
						/* @__PURE__ */ (0, f.jsx)("td", { children: /* @__PURE__ */ (0, f.jsx)("span", {
							className: "chip mkt-chip",
							children: Ha[e.market || ""] || e.market || "—"
						}) }),
						/* @__PURE__ */ (0, f.jsx)("td", { children: /* @__PURE__ */ (0, f.jsx)("span", {
							className: "imp",
							"aria-label": `중요도 ${e.importance || 1}/3`,
							children: [
								1,
								2,
								3
							].map((t) => /* @__PURE__ */ (0, f.jsx)("u", { className: (e.importance || 1) >= t ? "on" : "" }, t))
						}) }),
						/* @__PURE__ */ (0, f.jsxs)("td", { children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: Va(e) }), /* @__PURE__ */ (0, f.jsxs)("small", { children: [
							Fa[e.kind] || e.kind,
							e.source ? ` · ${e.source}` : "",
							e.sourceUrl ? /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [" · ", /* @__PURE__ */ (0, f.jsx)("a", {
								href: e.sourceUrl,
								target: "_blank",
								rel: "noopener noreferrer",
								children: "원문"
							})] }) : null
						] })] }),
						/* @__PURE__ */ (0, f.jsx)("td", {
							className: "cal-actual",
							children: e.actualValue ? /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [
								/* @__PURE__ */ (0, f.jsxs)("b", { children: [e.actualValue, e.unit ? ` ${e.unit}` : ""] }),
								za(e) ? /* @__PURE__ */ (0, f.jsx)("small", {
									"data-direction": Ba(e),
									children: za(e)
								}) : null,
								e.observedAt ? /* @__PURE__ */ (0, f.jsxs)("small", { children: [e.observedAt, " 기준"] }) : null
							] }) : /* @__PURE__ */ (0, f.jsx)("span", {
								className: "cal-actual__pending",
								children: "—"
							})
						}),
						/* @__PURE__ */ (0, f.jsx)("td", { children: /* @__PURE__ */ (0, f.jsx)("span", {
							className: `chip certainty-badge--${e.status}`,
							children: Ia[e.status] || e.status
						}) })
					] }, e.id)) })]
				})
			}) : /* @__PURE__ */ (0, f.jsx)("p", {
				className: "cockpit-empty",
				children: t.length ? "이 날짜에는 표시할 일정이 없습니다." : "저장된 시장 일정이 없습니다. 위의 일정 수집을 실행하면 미국·한국·유럽·일본 휴장일, FOMC·ECB·BoE·BOJ 금리 결정, 보유/관심 종목 실적이 채워집니다."
			})
		]
	});
}
//#endregion
//#region src/app/dashboard/NativeMarketChart.tsx
var eo = {
	snapshot: "스냅샷",
	current: "최신",
	fresh: "최신",
	cached: "최근 조회",
	delayed: "지연",
	stale: "오래됨",
	unavailable: "불러올 수 없음"
}, to = [
	"1d",
	"1m",
	"3m",
	"1y",
	"5y"
], no = {
	"1d": "1D",
	"1m": "1M",
	"3m": "3M",
	"1y": "1Y",
	"5y": "5Y"
}, ro = (e) => e === "1d" ? "5m" : "1d";
function io(e) {
	let t = String(e || "").match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
	if (!t) return NaN;
	let n = Date.UTC(Number(t[1]), Number(t[2]) - 1, Number(t[3]), Number(t[4]), Number(t[5]), Number(t[6] || 0));
	return Number.isFinite(n) ? Math.floor(n / 1e3) : NaN;
}
function ao(e, t) {
	if (!t) return String(e || "");
	let n = io(e);
	return Number.isFinite(n) ? n : String(e || "");
}
var oo = [
	{
		symbol: "^GSPC",
		label: "S&P 500"
	},
	{
		symbol: "^IXIC",
		label: "NASDAQ"
	},
	{
		symbol: "^DJI",
		label: "DOW"
	},
	{
		symbol: "^KS11",
		label: "KOSPI"
	},
	{
		symbol: "^KQ11",
		label: "KOSDAQ"
	},
	{
		symbol: "KRW=X",
		label: "USD/KRW"
	}
];
function so(e) {
	return e.startsWith("^") || e.includes("=");
}
function co(e) {
	let t = new Date(e.startsAt), n = Number.isNaN(t.getTime()) ? e.startsAt.slice(0, 10) : t.toLocaleDateString("ko-KR", {
		timeZone: "Asia/Seoul",
		month: "numeric",
		day: "numeric",
		weekday: "short"
	}), r = Fa[e.kind] || e.kind, i = e.kind === "earnings" ? Xa(e) : "";
	return `${n} ${r} 예정${i && i !== "종일" ? ` · ${i}` : ""}`;
}
function lo({ symbols: e }) {
	let t = e.filter((e) => e.source !== "fallback" && !oo.some((t) => t.symbol === e.symbol)), [n, r] = (0, d.useState)(""), [i, a] = (0, d.useState)(""), [o, s] = (0, d.useState)(oo[0].symbol), [c, l] = (0, d.useState)("3m"), [u, p] = (0, d.useState)("line"), [m, h] = (0, d.useState)(null), [g, _] = (0, d.useState)(null), [v, y] = (0, d.useState)(""), b = (0, d.useRef)(null), x = (0, d.useRef)(!1);
	async function S(e) {
		await K("/api/watchlist", { items: e }), document.dispatchEvent(new CustomEvent("folio:generation-complete"));
	}
	async function C() {
		let e = n.trim().toUpperCase();
		if (e) {
			a("");
			try {
				let t = await G("/api/watchlist");
				if (t.some((t) => t.toUpperCase() === e)) {
					a("이미 관심 종목에 있습니다.");
					return;
				}
				await S([...t, e]), r("");
			} catch (e) {
				a(e instanceof Error ? e.message : "추가하지 못했습니다.");
			}
		}
	}
	async function w(t) {
		a("");
		try {
			let n = await G("/api/watchlist"), r = (e.find((e) => e.symbol === t)?.label || "").toLowerCase(), i = n.filter((e) => {
				let n = e.trim().toLowerCase();
				return n !== t.toLowerCase() && (!r || n !== r);
			});
			if (i.length === n.length) {
				a("워치리스트에서 해당 항목을 찾지 못했습니다.");
				return;
			}
			await S(i);
		} catch (e) {
			a(e instanceof Error ? e.message : "제거하지 못했습니다.");
		}
	}
	(0, d.useEffect)(() => {
		x.current || (x.current = !0, G("/api/dashboard/settings").then((e) => {
			e.chartRange && to.includes(e.chartRange) && l(e.chartRange), e.chartSymbol && s(e.chartSymbol), (e.chartStyle === "line" || e.chartStyle === "candle") && p(e.chartStyle);
		}).catch(() => void 0));
	}, []), (0, d.useEffect)(() => {
		oo.some((e) => e.symbol === o) || t.some((e) => e.symbol === o) || s(oo[0].symbol);
	}, [t, o]);
	function T(e) {
		s(e), K("/api/dashboard/settings", { chartSymbol: e }).catch(() => void 0);
	}
	function E(e) {
		l(e), K("/api/dashboard/settings", { chartRange: e }).catch(() => void 0);
	}
	function D(e) {
		p(e), K("/api/dashboard/settings", { chartStyle: e }).catch(() => void 0);
	}
	(0, d.useEffect)(() => {
		let e = !0;
		return y(""), G(`/api/market/chart?symbol=${encodeURIComponent(o)}&range=${c}&interval=${ro(c)}`).then((t) => {
			e && h(t);
		}).catch((t) => {
			e && y(t instanceof Error ? t.message : "차트를 불러오지 못했습니다.");
		}), () => {
			e = !1;
		};
	}, [o, c]), (0, d.useEffect)(() => {
		let e = !0;
		if (_(null), !o || so(o)) return;
		let t = /* @__PURE__ */ new Date(), n = new Date(t.getTime() + 7776e6);
		return G(`/api/market-calendar?start=${encodeURIComponent(t.toISOString())}&end=${encodeURIComponent(n.toISOString())}&ticker=${encodeURIComponent(o)}&limit=20`).then((t) => {
			if (!e) return;
			let n = (t.events || []).filter((e) => [
				"earnings",
				"dividend",
				"filing"
			].includes(e.kind)).sort((e, t) => e.startsAt.localeCompare(t.startsAt));
			_(n[0] || null);
		}).catch(() => void 0), () => {
			e = !1;
		};
	}, [o]);
	let [O, k] = (0, d.useState)(0);
	(0, d.useEffect)(() => {
		let e = new MutationObserver(() => k((e) => e + 1));
		return e.observe(document.documentElement, {
			attributes: !0,
			attributeFilter: ["data-theme"]
		}), () => e.disconnect();
	}, []), (0, d.useEffect)(() => {
		let e = b.current, t = window.LightweightCharts;
		if (!e || !t || !m?.series?.length) return;
		e.innerHTML = "";
		let n = getComputedStyle(document.documentElement), r = (e, t) => n.getPropertyValue(e).trim() || t, i = r("--folio-green", "#3b6d11"), a = r("--folio-burgundy", "#8a1024"), o = m.series, s = m.interval === "5m", c = !(o.length > 1) || o[o.length - 1].close >= o[0].close ? i : a, l = t.createChart(e, {
			autoSize: !0,
			height: 360,
			width: e.clientWidth || 0,
			layout: {
				background: {
					type: "solid",
					color: r("--folio-surface-clean", "#ffffff")
				},
				textColor: r("--folio-ink-muted", "#44505f"),
				attributionLogo: !0
			},
			grid: {
				vertLines: { visible: !1 },
				horzLines: {
					color: r("--folio-border", "#dde2e9"),
					style: t.LineStyle?.Dotted ?? 1
				}
			},
			rightPriceScale: {
				borderVisible: !1,
				scaleMargins: {
					top: .12,
					bottom: .08
				}
			},
			timeScale: {
				borderVisible: !1,
				rightOffset: 1,
				barSpacing: 8,
				minBarSpacing: 2,
				timeVisible: s,
				secondsVisible: !1
			},
			localization: {
				locale: "ko-KR",
				dateFormat: "yyyy-MM-dd"
			},
			crosshair: { mode: t.CrosshairMode?.Normal ?? 0 },
			handleScroll: {
				mouseWheel: !1,
				pressedMouseMove: !0,
				horzTouchDrag: !0,
				vertTouchDrag: !1
			},
			handleScale: {
				axisPressedMouseMove: !1,
				mouseWheel: !1,
				pinch: !0
			}
		}), d = o.filter((e) => e.open != null && e.high != null && e.low != null), f = u === "candle" && d.length > 0, p = f ? l.addSeries(t.CandlestickSeries, {
			upColor: i,
			downColor: a,
			wickUpColor: i,
			wickDownColor: a,
			borderVisible: !1
		}) : l.addSeries(t.AreaSeries, {
			lineColor: c,
			topColor: `${c}38`,
			bottomColor: `${c}05`,
			lineWidth: 3,
			priceLineVisible: !1,
			lastValueVisible: !0
		});
		p.setData(f ? d.map((e) => ({
			time: ao(e.time, s),
			open: e.open,
			high: e.high,
			low: e.low,
			close: e.close
		})) : o.map((e) => ({
			time: ao(e.time, s),
			value: e.close
		})));
		let h = new Map(o.map((e, t) => [String(ao(e.time, s)), {
			close: e.close,
			previous: t > 0 ? o[t - 1].close : null
		}])), g = document.createElement("div");
		return g.className = "market-chart-tooltip", g.hidden = !0, e.appendChild(g), l.subscribeCrosshairMove((t) => {
			let n = t?.point, r = t?.seriesData?.get(p), i = e.getBoundingClientRect();
			if (!n || !r || n.x < 0 || n.y < 0 || n.x > i.width || n.y > i.height) {
				g.hidden = !0;
				return;
			}
			let a = String(r.time), o = h.get(a), c = o?.close ?? r.close ?? r.value ?? null, l = o?.previous ?? null, u = c != null && l != null ? c - l : null, d = u != null && l ? u / l * 100 : null, f = u == null || u >= 0 ? "up" : "down", m = c == null ? "가격 없음" : c.toLocaleString(void 0, { maximumFractionDigits: 2 }), _ = u == null || d == null ? s ? "직전 봉 대비 없음" : "전일 대비 없음" : `${u >= 0 ? "+" : ""}${u.toLocaleString(void 0, { maximumFractionDigits: 2 })} (${d >= 0 ? "+" : ""}${d.toFixed(2)}%)`;
			g.innerHTML = "";
			let v = document.createElement("div");
			v.className = "market-chart-tooltip__date", v.textContent = s ? (/* @__PURE__ */ new Date(Number(a) * 1e3)).toISOString().slice(11, 16) : a;
			let y = document.createElement("div");
			y.className = "market-chart-tooltip__price", y.textContent = m;
			let b = document.createElement("div");
			b.className = "market-chart-tooltip__change", b.dataset.direction = f, b.textContent = _, g.append(v, y, b);
			let x = g.offsetWidth || 150, S = g.offsetHeight || 76, C = Math.min(Math.max(8, n.x + 14), Math.max(8, i.width - x - 8)), w = Math.min(Math.max(8, n.y - S - 12), Math.max(8, i.height - S - 8));
			g.style.transform = `translate(${C}px, ${w}px)`, g.hidden = !1;
		}), l.timeScale().fitContent(), () => l.remove();
	}, [
		m,
		O,
		u
	]);
	let A = m?.series || [], j = A.length ? A[A.length - 1].close : null, M = m?.interval === "5m", N = A.length > 1 ? M ? A[0].close : A[A.length - 2].close : null, P = j != null && N ? (j - N) / N * 100 : null, F = eo[m?.freshness || ""] || (m ? m.freshness : "불러오는 중");
	return /* @__PURE__ */ (0, f.jsxs)("section", {
		className: "cockpit-panel cockpit-chart",
		"aria-labelledby": "native-chart-title",
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "cockpit-panel__head",
				children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "MARKET CHART" }), /* @__PURE__ */ (0, f.jsx)("h2", {
					id: "native-chart-title",
					children: "시장 차트"
				})] }), /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "chart-pickers",
					children: [/* @__PURE__ */ (0, f.jsxs)("details", {
						className: "chart-picker",
						children: [/* @__PURE__ */ (0, f.jsx)("summary", { children: "지수" }), /* @__PURE__ */ (0, f.jsx)("div", {
							className: "chart-picker__list",
							children: oo.map((e) => /* @__PURE__ */ (0, f.jsx)("button", {
								type: "button",
								className: `sym-chip${e.symbol === o ? " sym-chip--active" : ""}`,
								"aria-pressed": e.symbol === o,
								onClick: () => T(e.symbol),
								children: e.label
							}, e.symbol))
						})]
					}), /* @__PURE__ */ (0, f.jsxs)("details", {
						className: "chart-picker",
						children: [/* @__PURE__ */ (0, f.jsxs)("summary", { children: ["관심 종목", t.length ? ` ${t.length}` : ""] }), /* @__PURE__ */ (0, f.jsxs)("div", {
							className: "chart-picker__list",
							children: [
								t.map((e) => /* @__PURE__ */ (0, f.jsxs)("span", {
									className: "chart-picker__row",
									children: [/* @__PURE__ */ (0, f.jsx)("button", {
										type: "button",
										title: e.label || e.symbol,
										className: `sym-chip${e.symbol === o ? " sym-chip--active" : ""}`,
										"aria-pressed": e.symbol === o,
										onClick: () => T(e.symbol),
										children: e.symbol
									}), /* @__PURE__ */ (0, f.jsx)("button", {
										type: "button",
										className: "btn btn--icon chart-picker__remove",
										"aria-label": `${e.label || e.symbol} 관심 종목에서 제거`,
										onClick: () => void w(e.symbol),
										children: "×"
									})]
								}, e.symbol)),
								/* @__PURE__ */ (0, f.jsxs)("form", {
									className: "chart-picker__add",
									onSubmit: (e) => {
										e.preventDefault(), C();
									},
									children: [/* @__PURE__ */ (0, f.jsx)("input", {
										value: n,
										onChange: (e) => r(e.currentTarget.value),
										placeholder: "티커 추가",
										"aria-label": "관심 종목 추가"
									}), /* @__PURE__ */ (0, f.jsx)("button", {
										className: "btn btn--sm",
										type: "submit",
										disabled: !n.trim(),
										children: "추가"
									})]
								}),
								i && /* @__PURE__ */ (0, f.jsx)("p", {
									className: "chart-picker__error",
									children: i
								})
							]
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "chart-headline",
				children: [/* @__PURE__ */ (0, f.jsxs)("div", {
					className: "chart-quote",
					children: [
						/* @__PURE__ */ (0, f.jsx)("span", {
							className: "chart-quote__name",
							children: oo.find((e) => e.symbol === o)?.label || o
						}),
						/* @__PURE__ */ (0, f.jsxs)("div", {
							className: "chart-quote__value",
							children: [j == null ? null : /* @__PURE__ */ (0, f.jsx)("b", { children: j.toLocaleString(void 0, { maximumFractionDigits: 2 }) }), P == null ? null : /* @__PURE__ */ (0, f.jsxs)("span", {
								className: P > 0 ? "up" : P < 0 ? "down" : "flat",
								children: [
									P > 0 ? "▲" : P < 0 ? "▼" : "—",
									" ",
									P > 0 ? "+" : "",
									P.toFixed(1),
									"%"
								]
							})]
						}),
						/* @__PURE__ */ (0, f.jsxs)("small", { children: [F, m?.asOf ? ` · ${m.asOf} 기준` : ""] })
					]
				}), /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "cockpit-chart-controls",
					children: [/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "segment",
						role: "group",
						"aria-label": "차트 유형",
						children: [/* @__PURE__ */ (0, f.jsx)("button", {
							type: "button",
							"aria-pressed": u === "line",
							onClick: () => D("line"),
							children: "라인"
						}), /* @__PURE__ */ (0, f.jsx)("button", {
							type: "button",
							"aria-pressed": u === "candle",
							onClick: () => D("candle"),
							children: "캔들"
						})]
					}), /* @__PURE__ */ (0, f.jsx)("div", {
						className: "segment",
						role: "group",
						"aria-label": "차트 기간",
						children: to.map((e) => /* @__PURE__ */ (0, f.jsx)("button", {
							type: "button",
							"aria-pressed": c === e,
							onClick: () => E(e),
							children: no[e] || e
						}, e))
					})]
				})]
			}),
			v && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-error",
				children: v
			}),
			/* @__PURE__ */ (0, f.jsx)("div", {
				className: "cockpit-chart-stage",
				ref: b,
				children: !window.LightweightCharts && /* @__PURE__ */ (0, f.jsx)("p", { children: "차트 라이브러리를 사용할 수 없습니다." })
			}),
			g && /* @__PURE__ */ (0, f.jsxs)("p", {
				className: "chart-next",
				children: [
					/* @__PURE__ */ (0, f.jsx)("span", {
						className: `chip certainty-badge--${g.status}`,
						children: Ia[g.status] || g.status
					}),
					"다음 일정 — ",
					/* @__PURE__ */ (0, f.jsx)("b", { children: co(g) }),
					/* @__PURE__ */ (0, f.jsx)("small", { children: "시장 캘린더 연동" })
				]
			}),
			m?.notice ? /* @__PURE__ */ (0, f.jsx)("div", {
				className: "cockpit-chart-foot",
				children: /* @__PURE__ */ (0, f.jsx)("small", { children: m.notice })
			}) : null
		]
	});
}
//#endregion
//#region src/app/dashboard/ResearchCockpit.tsx
function uo() {
	let [e, t] = (0, d.useState)(null), [n, r] = (0, d.useState)(""), i = (0, d.useCallback)(() => G("/api/dashboard/cockpit").then(t).catch((e) => r(e instanceof Error ? e.message : "대시보드를 불러오지 못했습니다.")), []);
	if ((0, d.useEffect)(() => {
		i();
		let e = () => i();
		return document.addEventListener("folio:generation-complete", e), () => document.removeEventListener("folio:generation-complete", e);
	}, [i]), n) return /* @__PURE__ */ (0, f.jsx)("p", {
		className: "react-dashboard-error",
		children: n
	});
	if (!e) return /* @__PURE__ */ (0, f.jsx)("p", {
		className: "section-subtitle",
		children: "대시보드를 불러오는 중입니다."
	});
	let a = e.changeCounts || {}, o = (e.providerHealth || []).filter((e) => ["stale", "unhealthy"].includes(String(e.sourceStatus || ""))), s = e.focusSymbols || [];
	return /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "research-cockpit",
		"data-invalidation-token": e.invalidationToken,
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "cockpit-summary",
				role: "status",
				"aria-label": "오늘의 변화 요약",
				children: [
					/* @__PURE__ */ (0, f.jsxs)("span", {
						className: "chip cockpit-summary__chip",
						"data-tone": "burgundy",
						children: ["중대한 변화 ", a.majorChange || 0]
					}),
					/* @__PURE__ */ (0, f.jsxs)("span", {
						className: "chip cockpit-summary__chip",
						"data-tone": "blue",
						children: ["발전 중 ", a.developingSignal || 0]
					}),
					/* @__PURE__ */ (0, f.jsxs)("span", {
						className: "chip cockpit-summary__chip",
						"data-tone": "gold",
						children: ["충돌·불확실 ", a.conflictingUncertain || 0]
					}),
					/* @__PURE__ */ (0, f.jsxs)("span", {
						className: "chip cockpit-summary__chip",
						"data-tone": "muted",
						children: ["그 외 평가 ", a.quiet || 0]
					}),
					o.map((e) => /* @__PURE__ */ (0, f.jsxs)("span", {
						className: "chip cockpit-summary__chip",
						"data-tone": "burgundy",
						children: [e.provider, " 수집 문제"]
					}, e.provider))
				]
			}),
			/* @__PURE__ */ (0, f.jsx)(qr, { events: e.changes || [] }),
			/* @__PURE__ */ (0, f.jsx)($a, { focusSymbols: s }),
			/* @__PURE__ */ (0, f.jsx)(lo, { symbols: s })
		]
	});
}
//#endregion
//#region src/app/Dashboard.tsx
function fo() {
	return (0, d.useEffect)(() => {
		q("dashboard", {
			surface: "dashboard",
			viewId: "dashboard",
			reportKind: "",
			reportId: ""
		});
	}, []), /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "react-dashboard",
		"data-react-dashboard": !0,
		"data-dashboard-mode": "cockpit",
		children: [/* @__PURE__ */ (0, f.jsx)(qn, {
			eyebrow: "Research Cockpit",
			title: "대시보드",
			description: "새 보고서에서 확인된 변화, 집중 차트, 시장 일정을 한 화면에서 점검합니다."
		}), /* @__PURE__ */ (0, f.jsx)(uo, {})]
	});
}
//#endregion
//#region src/app/marketStateContext.ts
var po = [
	"current",
	"stale",
	"empty",
	"fallback"
];
function mo(e) {
	return typeof e == "object" && e && !Array.isArray(e) ? e : null;
}
function ho(e, t) {
	return Object.prototype.hasOwnProperty.call(e, t);
}
function go(e) {
	return typeof e == "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(e) && Number.isFinite(new Date(e).getTime());
}
function _o(e) {
	return typeof e == "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(e) && Number.isFinite(new Date(e).getTime());
}
var vo = /* @__PURE__ */ new Set([
	"invalid_as_of",
	"future_as_of",
	"missing_input_watermark",
	"age_exceeded",
	"new_relevant_evidence",
	"update_failed"
]);
function yo(e) {
	let t = mo(e), n = mo(t?.marketStateRef) || mo(mo(t?.marketStateResolution)?.ref) || mo(t?.ref);
	if (!n || !po.includes(n.status) || [
		"snapshotId",
		"sourceKind",
		"scope",
		"asOf",
		"status",
		"freshnessReason",
		"inputWatermark",
		"relevantEvidenceWatermark",
		"invalidWatermarkRows",
		"resolvedAt",
		"layer"
	].some((e) => !ho(n, e))) return null;
	let r = n.sourceKind, i = n.scope;
	if (![
		"snapshot",
		"state_fallback",
		"none"
	].includes(r) || ![
		"GLOBAL",
		"US",
		"KR"
	].includes(i) || n.layer !== "source-grounded" || !go(n.resolvedAt) || !Number.isInteger(n.invalidWatermarkRows) || Number(n.invalidWatermarkRows) < 0 || n.inputWatermark !== null && typeof n.inputWatermark != "string" || n.relevantEvidenceWatermark !== null && typeof n.relevantEvidenceWatermark != "string" || n.relevantEvidenceWatermark !== null && !go(n.relevantEvidenceWatermark)) return null;
	let a = n.status, o = n.freshnessReason;
	return typeof o != "string" || a === "current" && (r !== "snapshot" || typeof n.snapshotId != "string" || !n.snapshotId || !_o(n.asOf) || o !== "within_window") || a === "current" && n.inputWatermark !== null && !go(n.inputWatermark) || a === "current" && n.inputWatermark === null != (n.relevantEvidenceWatermark === null) || a === "stale" && (r !== "snapshot" || typeof n.snapshotId != "string" || !n.snapshotId || !vo.has(o)) || a === "stale" && o !== "invalid_as_of" && !_o(n.asOf) || a === "fallback" && (r !== "state_fallback" || n.snapshotId !== null || n.asOf !== null && !_o(n.asOf) || o !== "state_fallback" || n.inputWatermark !== null) || a === "empty" && (r !== "none" || n.snapshotId !== null || n.asOf !== null || o !== "no_state" || n.inputWatermark !== null || n.relevantEvidenceWatermark !== null) ? null : {
		snapshotId: typeof n.snapshotId == "string" ? n.snapshotId : null,
		sourceKind: r,
		scope: i,
		asOf: typeof n.asOf == "string" ? n.asOf : null,
		status: a,
		freshnessReason: o,
		inputWatermark: typeof n.inputWatermark == "string" ? n.inputWatermark : null,
		relevantEvidenceWatermark: typeof n.relevantEvidenceWatermark == "string" ? n.relevantEvidenceWatermark : null,
		invalidWatermarkRows: Number.isFinite(Number(n.invalidWatermarkRows)) ? Number(n.invalidWatermarkRows) : 0,
		resolvedAt: n.resolvedAt,
		layer: "source-grounded"
	};
}
function bo(e) {
	let t = yo(e);
	return t ? {
		status: t.status,
		asOf: t.asOf,
		freshnessReason: t.freshnessReason,
		sourceKind: t.sourceKind,
		scope: t.scope,
		resolvedAt: t.resolvedAt
	} : null;
}
//#endregion
//#region src/app/SmartCollectionEditor.tsx
var xo = {
	name: "",
	query: "",
	market: "ALL",
	sources: "",
	tickers: "",
	tags: ""
};
function So(e, t = !1) {
	let n = e.split(",").map((e) => e.normalize("NFKC").trim()).filter(Boolean).map((e) => t ? e.toUpperCase() : e.toLowerCase());
	return Array.from(new Set(n)).sort();
}
function Co(e) {
	return {
		name: e.name.normalize("NFKC").trim(),
		query: e.query.normalize("NFKC").trim(),
		market: e.market,
		sources: So(e.sources),
		tickers: So(e.tickers, !0),
		tags: So(e.tags)
	};
}
function wo(e) {
	return {
		name: e.name,
		query: e.query,
		market: e.market,
		sources: e.sources.join(", "),
		tickers: e.tickers.join(", "),
		tags: e.tags.join(", ")
	};
}
function To({ mode: e, revision: t, draft: n, busy: r, onChange: i, onCancel: a, onSave: o }) {
	return /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "topicrpt-collection-editor",
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "topicrpt-collection-subhead",
				children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: e === "create" ? "새 검색 규칙" : "검색 규칙 편집" }), /* @__PURE__ */ (0, f.jsx)("span", { children: t ? `revision ${t}` : "새 정의" })]
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "topicrpt-collection-form-grid",
				children: [
					/* @__PURE__ */ (0, f.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "이름" }), /* @__PURE__ */ (0, f.jsx)("input", {
							"data-qa": "collection-name",
							value: n.name,
							maxLength: 80,
							onChange: (e) => i("name", e.currentTarget.value)
						})]
					}),
					/* @__PURE__ */ (0, f.jsxs)("label", {
						className: "field topicrpt-collection-query",
						children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "검색어" }), /* @__PURE__ */ (0, f.jsx)("textarea", {
							"data-qa": "collection-query",
							value: n.query,
							maxLength: 500,
							rows: 2,
							onChange: (e) => i("query", e.currentTarget.value)
						})]
					}),
					/* @__PURE__ */ (0, f.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "시장" }), /* @__PURE__ */ (0, f.jsxs)("select", {
							"data-qa": "collection-market",
							value: n.market,
							onChange: (e) => i("market", e.currentTarget.value),
							children: [
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "ALL",
									children: "전체"
								}),
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "US",
									children: "미국"
								}),
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "KR",
									children: "한국"
								}),
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "GLOBAL",
									children: "글로벌"
								}),
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "UNKNOWN",
									children: "미분류"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, f.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "출처 · 쉼표 구분" }), /* @__PURE__ */ (0, f.jsx)("input", {
							"data-qa": "collection-sources",
							value: n.sources,
							onChange: (e) => i("sources", e.currentTarget.value)
						})]
					}),
					/* @__PURE__ */ (0, f.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "티커 · 쉼표 구분" }), /* @__PURE__ */ (0, f.jsx)("input", {
							"data-qa": "collection-tickers",
							value: n.tickers,
							onChange: (e) => i("tickers", e.currentTarget.value)
						})]
					}),
					/* @__PURE__ */ (0, f.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "태그 · 쉼표 구분" }), /* @__PURE__ */ (0, f.jsx)("input", {
							"data-qa": "collection-tags",
							value: n.tags,
							onChange: (e) => i("tags", e.currentTarget.value)
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "topicrpt-collections-actions",
				children: [/* @__PURE__ */ (0, f.jsx)("button", {
					className: "btn",
					type: "button",
					"data-qa": "collection-cancel",
					disabled: r,
					onClick: a,
					children: "취소"
				}), /* @__PURE__ */ (0, f.jsx)("button", {
					className: "btn btn--primary",
					type: "button",
					"data-qa": "collection-save",
					disabled: r,
					onClick: o,
					children: r ? "저장 중" : e === "create" ? "컬렉션 저장" : "변경 저장"
				})]
			})
		]
	});
}
//#endregion
//#region src/app/SmartCollectionWorkspace.tsx
function Eo(e) {
	return [
		e.query && `query: ${e.query}`,
		e.market !== "ALL" && `market: ${e.market}`,
		e.sources.length && `sources: ${e.sources.join(", ")}`,
		e.tickers.length && `tickers: ${e.tickers.join(", ")}`,
		e.tags.length && `tags: ${e.tags.join(", ")}`
	].filter(Boolean).join(" · ") || "필터 없음";
}
function Do(e) {
	return e instanceof H ? e.code === "validation_error" ? "필터 형식을 확인하세요. 이름과 하나 이상의 검색 조건이 필요하며 각 목록은 최대 20개입니다." : e.code === "collection_store_unavailable" ? "저장된 컬렉션을 읽을 수 없습니다. 저장소 상태를 확인한 뒤 다시 불러오세요." : e.code === "collection_snapshot_unavailable" ? "최근 새로고침 기록을 읽을 수 없습니다. 저장 상태를 확인한 뒤 다시 시도하세요." : e.code === "collection_source_unavailable" ? "현재 외부 자료 인덱스를 읽을 수 없습니다. 자료 상태를 확인한 뒤 다시 시도하세요." : e.code === "collection_not_found" ? "컬렉션이 더 이상 존재하지 않습니다. 목록으로 돌아가세요." : `컬렉션 요청을 완료하지 못했습니다 (${e.code || "request_failed"}).` : "컬렉션 요청을 완료하지 못했습니다. 연결을 확인하고 다시 시도하세요.";
}
function Oo(e) {
	let t = e.payload?.currentRevision;
	return typeof t == "number" && Number.isInteger(t) && t >= 1 ? t : null;
}
function ko(e) {
	if (!e) return "아직 새로고침하지 않음";
	let t = e.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
	return t ? `${t[1]} ${t[2]} UTC` : e;
}
function Ao(e) {
	return {
		baseline_missing: "비교할 이전 스냅샷 없음",
		definition_changed: "필터 정의 변경",
		empty_index: "현재 일치 자료 없음",
		high_unusable_ratio: "사용 불가 자료 비율 높음",
		high_churn_ratio: "자료 교체 비율 높음",
		invalid_resolved_at: "새로고침 시각 확인 필요",
		clock_skew: "시스템 시각 불일치",
		snapshot_expired: "최근 스냅샷 만료",
		provider_generation_reset: "자료 제공자 세대 초기화",
		provider_watermark_reset: "자료 워터마크 초기화",
		result_truncated: "표시 상한 적용",
		healthy: "현재 입력 정상"
	}[e] || e;
}
function jo({ selectedRef: e, onSelectedRef: t, onBusyChange: n, onOpenDetail: r, disabled: i }) {
	let [a, o] = (0, d.useState)([]), [s, c] = (0, d.useState)(0), [l, u] = (0, d.useState)(!0), [p, m] = (0, d.useState)(null), [h, g] = (0, d.useState)(""), [_, v] = (0, d.useState)(null), [y, b] = (0, d.useState)(xo), [x, S] = (0, d.useState)(null), [C, w] = (0, d.useState)(!1), [T, E] = (0, d.useState)(!1), [D, O] = (0, d.useState)(""), [k, A] = (0, d.useState)(null), j = (0, d.useRef)(0), M = (0, d.useRef)(0), N = (0, d.useRef)(null), P = (0, d.useRef)(null);
	function F(e, t) {
		b((n) => ({
			...n,
			[e]: t
		}));
	}
	let I = (0, d.useMemo)(() => e && a.find((t) => t.id === e.id && t.revision === e.revision) || null, [a, e]);
	(0, d.useEffect)(() => {
		n(l || C || T);
	}, [
		T,
		l,
		n,
		C
	]);
	let L = (0, d.useCallback)(async (n = !1) => {
		N.current?.abort();
		let r = new AbortController();
		N.current = r;
		let i = j.current + 1;
		j.current = i, u(!0), O("");
		try {
			let a = await G("/api/smart-collections?limit=100&offset=0", { signal: r.signal });
			if (r.signal.aborted || i !== j.current) return;
			if (o(a.items), c(a.total), e) {
				let n = a.items.find((t) => t.id === e.id);
				(!n || n.revision !== e.revision) && (t(null), S(null), n && A({
					code: "revision_conflict",
					currentRevision: n.revision
				}));
			}
			if (n && h) {
				let e = a.items.find((e) => e.id === h);
				e && (v(e.revision), A(null));
			}
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError" || i !== j.current) return;
			O(Do(e));
		} finally {
			!r.signal.aborted && i === j.current && u(!1);
		}
	}, [
		h,
		t,
		e
	]), R = (0, d.useCallback)(async (e) => {
		P.current?.abort();
		let n = new AbortController();
		P.current = n;
		let r = M.current + 1;
		M.current = r, w(!0), S(null), t(null), O(""), A(null);
		let i = {
			expectedRevision: e.revision,
			limit: 10
		};
		try {
			let a = await K(`/api/smart-collections/${encodeURIComponent(e.id)}/preview`, i, { signal: n.signal });
			if (n.signal.aborted || r !== M.current) return;
			S(a), t({
				id: e.id,
				revision: e.revision
			});
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError" || r !== M.current) return;
			e instanceof H && e.status === 409 && (e.code === "revision_conflict" || e.code === "duplicate_name") ? (A({
				code: e.code,
				currentRevision: Oo(e)
			}), t(null)) : O(Do(e));
		} finally {
			!n.signal.aborted && r === M.current && w(!1);
		}
	}, [t]);
	(0, d.useEffect)(() => (L(), () => {
		N.current?.abort(), P.current?.abort();
	}), []);
	let z = () => {
		m("create"), g(""), v(null), b(xo), A(null), O("");
	}, B = () => {
		I && (m("edit"), g(I.id), v(I.revision), b(wo(I)), A(null), O(""));
	}, V = async () => {
		let e = Co(y);
		if (!e.name || !e.query && e.market === "ALL" && !e.sources.length && !e.tickers.length && !e.tags.length || e.sources.length > 20 || e.tickers.length > 20 || e.tags.length > 20) {
			O("이름과 하나 이상의 검색 조건을 입력하세요. 쉼표 목록은 각각 최대 20개입니다.");
			return;
		}
		E(!0), O(""), A(null);
		try {
			let t;
			if (p === "edit" && h && _) {
				let n = {
					...e,
					expectedRevision: _
				};
				t = await oe(`/api/smart-collections/${encodeURIComponent(h)}`, n);
			} else t = await K("/api/smart-collections", e);
			o((e) => [t.collection, ...e.filter((e) => e.id !== t.collection.id)]), c((e) => p === "create" ? e + 1 : e), m(null), g(""), v(null), await R(t.collection);
		} catch (e) {
			e instanceof H && e.status === 409 && (e.code === "revision_conflict" || e.code === "duplicate_name") ? (A({
				code: e.code,
				currentRevision: Oo(e)
			}), e.code === "revision_conflict" && t(null)) : O(Do(e));
		} finally {
			E(!1);
		}
	}, ee = async () => {
		if (!I || !window.confirm(`“${I.name}” 컬렉션을 삭제할까요?`)) return;
		E(!0), O(""), A(null);
		let e = { expectedRevision: I.revision };
		try {
			await se(`/api/smart-collections/${encodeURIComponent(I.id)}`, e), o((e) => e.filter((e) => e.id !== I.id)), c((e) => Math.max(0, e - 1)), S(null), t(null);
		} catch (e) {
			e instanceof H && e.status === 409 && (e.code === "revision_conflict" || e.code === "duplicate_name") ? (A({
				code: e.code,
				currentRevision: Oo(e)
			}), t(null)) : O(Do(e));
		} finally {
			E(!1);
		}
	};
	return /* @__PURE__ */ (0, f.jsxs)("section", {
		className: "topicrpt-collections-panel",
		"data-qa": "collection-panel",
		"aria-labelledby": "collection-heading",
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "topicrpt-collections-head",
				children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [
					/* @__PURE__ */ (0, f.jsx)("span", {
						className: "section-kicker",
						children: "Smart Collections"
					}),
					/* @__PURE__ */ (0, f.jsxs)("h3", {
						id: "collection-heading",
						children: ["저장한 자료 모음 사용 ", /* @__PURE__ */ (0, f.jsx)("em", { children: "(선택)" })]
					}),
					/* @__PURE__ */ (0, f.jsx)("p", { children: "미리 저장해 둔 검색 규칙으로 자료 범위를 좁힙니다. 근거 자체가 아니며, 계획 시점에 일치하는 자료를 다시 확인합니다." })
				] }), /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "topicrpt-collections-actions",
					children: [/* @__PURE__ */ (0, f.jsx)("button", {
						className: "btn",
						type: "button",
						"data-qa": "collection-reload",
						disabled: l || T || i,
						onClick: () => void L(),
						children: l ? "불러오는 중" : "다시 불러오기"
					}), /* @__PURE__ */ (0, f.jsx)("button", {
						className: "btn btn--primary",
						type: "button",
						"data-qa": "collection-new",
						disabled: T || i,
						onClick: z,
						children: "새 컬렉션"
					})]
				})]
			}),
			D && /* @__PURE__ */ (0, f.jsxs)("div", {
				className: "react-dashboard-error topicrpt-collection-alert",
				"data-qa": "collection-error",
				role: "alert",
				children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: "컬렉션을 확인하세요" }), /* @__PURE__ */ (0, f.jsx)("span", { children: D })]
			}),
			k && /* @__PURE__ */ (0, f.jsxs)("div", {
				className: "react-dashboard-warning topicrpt-collection-alert",
				"data-qa": "collection-conflict",
				role: "alert",
				children: [
					/* @__PURE__ */ (0, f.jsx)("strong", { children: k.code === "duplicate_name" ? "같은 이름이 이미 있습니다" : "다른 탭에서 정의가 변경되었습니다" }),
					/* @__PURE__ */ (0, f.jsxs)("span", { children: [k.currentRevision ? `현재 버전 ${k.currentRevision}. ` : "", "입력 내용은 유지했습니다. 최신 버전을 불러온 뒤 다시 저장하세요."] }),
					k.code === "duplicate_name" ? /* @__PURE__ */ (0, f.jsx)("button", {
						className: "btn",
						type: "button",
						onClick: () => A(null),
						children: "이름 수정"
					}) : /* @__PURE__ */ (0, f.jsx)("button", {
						className: "btn",
						type: "button",
						onClick: () => void L(!0),
						children: "최신 버전 불러오기"
					})
				]
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "topicrpt-collections-grid",
				children: [/* @__PURE__ */ (0, f.jsxs)("div", {
					className: "topicrpt-collection-browser",
					children: [
						/* @__PURE__ */ (0, f.jsxs)("div", {
							className: "topicrpt-collection-subhead",
							children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: "저장된 규칙" }), /* @__PURE__ */ (0, f.jsxs)("span", { children: [s, "개"] })]
						}),
						/* @__PURE__ */ (0, f.jsxs)("div", {
							className: "topicrpt-collection-list",
							"data-qa": "collection-list",
							"aria-busy": l,
							children: [!l && !D && !a.length && /* @__PURE__ */ (0, f.jsx)("div", {
								className: "topicrpt-collection-empty",
								"data-qa": "collection-empty",
								"data-empty-kind": "list",
								role: "status",
								children: "저장한 자료 모음이 없습니다. 새 컬렉션을 만들어 반복해 쓸 검색 범위를 저장하세요."
							}), a.map((t) => {
								let n = e?.id === t.id && e.revision === t.revision;
								return /* @__PURE__ */ (0, f.jsxs)("button", {
									className: `topicrpt-collection-item${n ? " is-selected" : ""}`,
									type: "button",
									"data-qa": "collection-item",
									"data-collection-id": t.id,
									"data-revision": t.revision,
									"aria-pressed": n,
									disabled: T || i,
									onClick: () => void R(t),
									children: [/* @__PURE__ */ (0, f.jsxs)("span", { children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: t.name }), /* @__PURE__ */ (0, f.jsxs)("small", { children: ["버전 ", t.revision] })] }), /* @__PURE__ */ (0, f.jsx)("small", { children: Eo(t) })]
								}, t.id);
							})]
						}),
						s > a.length && /* @__PURE__ */ (0, f.jsxs)("p", {
							className: "topicrpt-collection-disclosure",
							children: [
								"처음 ",
								a.length,
								"개를 표시합니다. 전체 ",
								s,
								"개 중 나머지는 API 페이지에서 확인할 수 있습니다."
							]
						}),
						I && /* @__PURE__ */ (0, f.jsxs)("div", {
							className: "topicrpt-collections-actions topicrpt-selection-actions",
							children: [
								/* @__PURE__ */ (0, f.jsx)("button", {
									className: "btn btn--primary",
									type: "button",
									"data-qa": "collection-open-workspace",
									disabled: T || i,
									onClick: () => r(I.id),
									children: "상세 워크스페이스"
								}),
								/* @__PURE__ */ (0, f.jsx)("button", {
									className: "btn",
									type: "button",
									"data-qa": "collection-edit",
									disabled: T || i,
									onClick: B,
									children: "선택 규칙 편집"
								}),
								/* @__PURE__ */ (0, f.jsx)("button", {
									className: "btn",
									type: "button",
									"data-qa": "collection-delete",
									disabled: T || i,
									onClick: () => void ee(),
									children: "삭제"
								}),
								/* @__PURE__ */ (0, f.jsx)("button", {
									className: "btn",
									type: "button",
									"data-qa": "collection-clear-selection",
									onClick: () => {
										P.current?.abort(), S(null), t(null);
									},
									children: "선택 해제"
								})
							]
						})
					]
				}), /* @__PURE__ */ (0, f.jsxs)("section", {
					className: "topicrpt-collection-results",
					"data-qa": "collection-results",
					"aria-busy": C,
					"aria-live": "polite",
					children: [
						/* @__PURE__ */ (0, f.jsxs)("div", {
							className: "topicrpt-collection-subhead",
							children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: "현재 일치 자료" }), /* @__PURE__ */ (0, f.jsx)("span", { children: C ? "확인 중" : x ? `${x.total}건` : "규칙 선택 전" })]
						}),
						x && x.total === 0 && /* @__PURE__ */ (0, f.jsx)("div", {
							className: "topicrpt-collection-empty",
							"data-qa": "collection-empty",
							"data-empty-kind": "matches",
							role: "status",
							children: "현재 일치 자료가 0건입니다. 계획은 근거 부족 확인을 거쳐야 하며, 이 컬렉션 자체가 근거로 사용되지는 않습니다."
						}),
						x && x.items.length > 0 && /* @__PURE__ */ (0, f.jsx)("ul", {
							className: "topicrpt-collection-samples",
							children: x.items.map((e) => /* @__PURE__ */ (0, f.jsxs)("li", { children: [
								/* @__PURE__ */ (0, f.jsxs)("span", { children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: e.title || "제목 없음" }), /* @__PURE__ */ (0, f.jsx)("em", {
									className: e.usability === "indexed" ? "is-indexed" : "is-unindexed",
									children: e.usability === "indexed" ? "사용 가능" : "인덱싱 필요"
								})] }),
								/* @__PURE__ */ (0, f.jsx)("small", { children: [e.source, e.publishedAt].filter(Boolean).join(" · ") || "출처 정보 없음" }),
								e.snippet && /* @__PURE__ */ (0, f.jsx)("p", { children: e.snippet })
							] }, e.id))
						}),
						!x && !C && /* @__PURE__ */ (0, f.jsx)("p", {
							className: "topicrpt-empty-value",
							children: "규칙을 선택하면 서버가 현재 자료의 개수와 표본을 확인합니다."
						}),
						x && x.total > x.items.length && /* @__PURE__ */ (0, f.jsxs)("p", {
							className: "topicrpt-collection-disclosure",
							children: [
								"상위 ",
								x.items.length,
								"건만 미리 표시합니다. 계획 실행 시 서버가 전체 범위를 다시 해석합니다."
							]
						})
					]
				})]
			}),
			p && /* @__PURE__ */ (0, f.jsx)(To, {
				mode: p,
				revision: _,
				draft: y,
				busy: T,
				onChange: F,
				onCancel: () => {
					m(null), A(null), O("");
				},
				onSave: () => void V()
			})
		]
	});
}
function Mo({ collectionId: e, onBack: t, onStartResearch: n }) {
	let [r, i] = (0, d.useState)(null), [a, o] = (0, d.useState)(null), [s, c] = (0, d.useState)(!0), [l, u] = (0, d.useState)(!1), [p, m] = (0, d.useState)(null), [h, g] = (0, d.useState)(""), _ = (0, d.useRef)(null), v = (0, d.useCallback)(async ({ preserveMessage: t = !1 } = {}) => {
		_.current?.abort();
		let n = new AbortController();
		_.current = n, c(!0), m(null), t || g("");
		try {
			let t = encodeURIComponent(e), [r, a] = await Promise.all([G(`/api/smart-collections/${t}/workspace`, { signal: n.signal }), G(`/api/smart-collections/${t}/changes`, { signal: n.signal })]);
			if (n.signal.aborted) return;
			i(r), o(a);
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError") return;
			e instanceof H && e.code === "collection_not_found" ? m("deleted") : e instanceof H && e.code === "collection_source_unavailable" ? m("source") : m("other"), g(Do(e));
		} finally {
			n.signal.aborted || c(!1);
		}
	}, [e]);
	(0, d.useEffect)(() => (v(), () => _.current?.abort()), [v]);
	let y = async () => {
		if (!r) return;
		u(!0), g("");
		let t = { expectedRevision: r.collection.revision };
		try {
			await K(`/api/smart-collections/${encodeURIComponent(e)}/refresh`, t), await v();
		} catch (e) {
			e instanceof H && e.status === 409 ? (g("다른 탭에서 정의가 변경되었습니다. 최신 revision을 다시 불러왔습니다."), await v({ preserveMessage: !0 })) : e instanceof H && e.code === "collection_not_found" ? (m("deleted"), g(Do(e))) : (e instanceof H && e.code === "collection_source_unavailable" && m("source"), g(Do(e)));
		} finally {
			u(!1);
		}
	}, b = () => {
		r && nt({
			surface: "smart_collection_workspace",
			viewId: "topicrpt",
			collectionId: r.collection.id,
			collectionRevision: r.collection.revision,
			message: "이 Smart Collection의 현재 스냅샷과 이전 스냅샷을 비교해 무엇이 바뀌었는지 설명해줘. 추가·제외된 외부 근거와 불확실성을 함께 정리해줘.",
			autoSubmit: !0
		});
	};
	if (s && !r) return /* @__PURE__ */ (0, f.jsx)("section", {
		className: "topicrpt-collection-workspace",
		"data-qa": "collection-workspace",
		"aria-busy": "true",
		children: /* @__PURE__ */ (0, f.jsx)("p", {
			className: "react-dashboard-warning",
			children: "컬렉션과 현재 외부 자료를 확인하는 중입니다."
		})
	});
	if (p === "deleted") return /* @__PURE__ */ (0, f.jsxs)("section", {
		className: "topicrpt-collection-workspace",
		"data-qa": "collection-workspace",
		children: [/* @__PURE__ */ (0, f.jsx)("button", {
			className: "btn",
			type: "button",
			"data-qa": "collection-workspace-back",
			onClick: t,
			children: "딥 리서치로 돌아가기"
		}), /* @__PURE__ */ (0, f.jsxs)("div", {
			className: "react-dashboard-warning",
			"data-qa": "collection-workspace-deleted",
			role: "status",
			children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: "이 컬렉션은 삭제되었습니다" }), /* @__PURE__ */ (0, f.jsx)("p", { children: "열려 있던 주소는 유지되지만 더 이상 새로고침하거나 리서치 범위로 사용할 수 없습니다." })]
		})]
	});
	if (p === "source") return /* @__PURE__ */ (0, f.jsxs)("section", {
		className: "topicrpt-collection-workspace",
		"data-qa": "collection-workspace",
		children: [/* @__PURE__ */ (0, f.jsx)("button", {
			className: "btn",
			type: "button",
			"data-qa": "collection-workspace-back",
			onClick: t,
			children: "딥 리서치로 돌아가기"
		}), /* @__PURE__ */ (0, f.jsxs)("div", {
			className: "react-dashboard-error",
			"data-qa": "collection-workspace-source-unavailable",
			role: "alert",
			children: [
				/* @__PURE__ */ (0, f.jsx)("strong", { children: "현재 외부 자료를 읽을 수 없습니다" }),
				/* @__PURE__ */ (0, f.jsx)("p", { children: h }),
				/* @__PURE__ */ (0, f.jsx)("button", {
					className: "btn",
					type: "button",
					onClick: () => void v(),
					children: "다시 확인"
				})
			]
		})]
	});
	if (!r) return /* @__PURE__ */ (0, f.jsxs)("section", {
		className: "topicrpt-collection-workspace",
		"data-qa": "collection-workspace",
		children: [/* @__PURE__ */ (0, f.jsx)("button", {
			className: "btn",
			type: "button",
			"data-qa": "collection-workspace-back",
			onClick: t,
			children: "딥 리서치로 돌아가기"
		}), /* @__PURE__ */ (0, f.jsxs)("div", {
			className: "react-dashboard-error",
			role: "alert",
			children: [
				/* @__PURE__ */ (0, f.jsx)("strong", { children: "컬렉션을 열지 못했습니다" }),
				/* @__PURE__ */ (0, f.jsx)("p", { children: h }),
				/* @__PURE__ */ (0, f.jsx)("button", {
					className: "btn",
					type: "button",
					onClick: () => void v(),
					children: "다시 확인"
				})
			]
		})]
	});
	let x = r.health;
	return /* @__PURE__ */ (0, f.jsxs)("section", {
		className: "topicrpt-collection-workspace",
		"data-qa": "collection-workspace",
		"data-health": x,
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "topicrpt-collection-workspace-head",
				children: [/* @__PURE__ */ (0, f.jsx)("button", {
					className: "btn",
					type: "button",
					"data-qa": "collection-workspace-back",
					onClick: t,
					children: "← 딥 리서치"
				}), /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "topicrpt-collections-actions",
					children: [
						/* @__PURE__ */ (0, f.jsx)("button", {
							className: "btn",
							type: "button",
							"data-qa": "collection-workspace-refresh",
							disabled: l,
							onClick: () => void y(),
							children: l ? "새로고침 중" : "현재 자료 새로고침"
						}),
						/* @__PURE__ */ (0, f.jsx)("button", {
							className: "btn",
							type: "button",
							"data-qa": "collection-workspace-ask-change",
							onClick: b,
							children: "Agent에게 변화 묻기"
						}),
						/* @__PURE__ */ (0, f.jsx)("button", {
							className: "btn btn--primary",
							type: "button",
							"data-qa": "collection-workspace-start",
							onClick: () => n({
								id: r.collection.id,
								revision: r.collection.revision
							}),
							children: "이 범위로 리서치 시작"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, f.jsxs)("header", {
				className: "topicrpt-collection-workspace-title",
				children: [
					/* @__PURE__ */ (0, f.jsx)("p", {
						className: "section-kicker",
						children: "저장한 자료 모음"
					}),
					/* @__PURE__ */ (0, f.jsx)("h1", { children: r.collection.name }),
					/* @__PURE__ */ (0, f.jsx)("p", { children: "저장된 검색 규칙이며 외부 근거 자체가 아닙니다. 새 리서치를 시작하면 이 규칙의 ID와 버전으로 자료를 다시 확인합니다." }),
					/* @__PURE__ */ (0, f.jsxs)("small", { children: [
						Eo(r.collection),
						" · 버전 ",
						r.collection.revision
					] })
				]
			}),
			h && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-warning",
				role: "status",
				children: h
			}),
			x === "empty" && /* @__PURE__ */ (0, f.jsx)("div", {
				className: "topicrpt-collection-empty",
				"data-qa": "collection-workspace-empty",
				role: "status",
				children: "현재 일치하는 외부 자료가 없습니다. 범위를 조정하거나 자료 인덱스를 갱신하세요."
			}),
			x === "stale" && /* @__PURE__ */ (0, f.jsx)("div", {
				className: "react-dashboard-warning",
				"data-qa": "collection-workspace-stale",
				role: "status",
				children: "최근 입력 상태가 오래되었거나 제공자 상태를 다시 확인해야 합니다."
			}),
			x === "noisy" && /* @__PURE__ */ (0, f.jsx)("div", {
				className: "react-dashboard-warning",
				"data-qa": "collection-workspace-noisy",
				role: "status",
				children: "자료 교체 또는 사용 불가 비율이 높습니다. 변경 내역을 확인한 뒤 리서치를 시작하세요."
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "topicrpt-collection-health-rail",
				"data-qa": "collection-workspace-health",
				children: [
					/* @__PURE__ */ (0, f.jsxs)("div", { children: [
						/* @__PURE__ */ (0, f.jsx)("span", { children: "상태" }),
						/* @__PURE__ */ (0, f.jsx)("strong", { children: x }),
						/* @__PURE__ */ (0, f.jsx)("small", { children: r.healthReasonCodes.map(Ao).join(" · ") })
					] }),
					/* @__PURE__ */ (0, f.jsxs)("div", { children: [
						/* @__PURE__ */ (0, f.jsx)("span", { children: "마지막 새로고침" }),
						/* @__PURE__ */ (0, f.jsx)("strong", { children: ko(r.lastRefresh) }),
						/* @__PURE__ */ (0, f.jsx)("small", { children: r.current.truncated ? "표시 상한 적용" : "현재 범위 확인" })
					] }),
					/* @__PURE__ */ (0, f.jsxs)("div", { children: [
						/* @__PURE__ */ (0, f.jsx)("span", { children: "변경" }),
						/* @__PURE__ */ (0, f.jsxs)("strong", { children: [
							"+",
							r.changeCounts.added,
							" / −",
							r.changeCounts.removed
						] }),
						/* @__PURE__ */ (0, f.jsxs)("small", { children: [
							"유지 ",
							r.changeCounts.unchanged,
							"건"
						] })
					] }),
					/* @__PURE__ */ (0, f.jsxs)("div", { children: [
						/* @__PURE__ */ (0, f.jsx)("span", { children: "현재 자료" }),
						/* @__PURE__ */ (0, f.jsxs)("strong", { children: [r.current.resolvedCount, "건"] }),
						/* @__PURE__ */ (0, f.jsxs)("small", { children: [
							"사용 제외 ",
							r.current.unusableCount,
							"건"
						] })
					] })
				]
			}),
			/* @__PURE__ */ (0, f.jsx)(sn, {
				mode: "collection",
				collectionId: r.collection.id
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "topicrpt-collection-workspace-grid",
				children: [/* @__PURE__ */ (0, f.jsxs)("section", {
					className: "topicrpt-collection-results",
					"data-qa": "collection-workspace-evidence",
					"aria-labelledby": "collection-current-evidence",
					children: [/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "topicrpt-collection-subhead",
						children: [/* @__PURE__ */ (0, f.jsx)("strong", {
							id: "collection-current-evidence",
							children: "현재 외부 자료"
						}), /* @__PURE__ */ (0, f.jsxs)("span", { children: [r.current.eligibleCount, "건 일치"] })]
					}), r.recentEvidence.length ? /* @__PURE__ */ (0, f.jsx)("ul", {
						className: "topicrpt-collection-samples",
						children: r.recentEvidence.map((e) => /* @__PURE__ */ (0, f.jsxs)("li", { children: [
							/* @__PURE__ */ (0, f.jsxs)("span", { children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: e.title || "제목 없음" }), /* @__PURE__ */ (0, f.jsx)("em", {
								className: e.usability === "indexed" ? "is-indexed" : "is-unindexed",
								children: e.usability === "indexed" ? "사용 가능" : "인덱싱 필요"
							})] }),
							/* @__PURE__ */ (0, f.jsx)("small", { children: [e.source, e.publishedAt].filter(Boolean).join(" · ") || "출처 정보 없음" }),
							e.snippet && /* @__PURE__ */ (0, f.jsx)("p", { children: e.snippet }),
							e.url && /* @__PURE__ */ (0, f.jsx)("a", {
								href: e.url,
								target: "_blank",
								rel: "noopener noreferrer",
								children: "원문 열기"
							})
						] }, e.id))
					}) : /* @__PURE__ */ (0, f.jsx)("p", {
						className: "topicrpt-empty-value",
						children: "표시할 현재 외부 자료가 없습니다."
					})]
				}), /* @__PURE__ */ (0, f.jsxs)("aside", {
					className: "topicrpt-collection-change-ledger",
					"aria-labelledby": "collection-change-heading",
					children: [
						/* @__PURE__ */ (0, f.jsxs)("div", {
							className: "topicrpt-collection-subhead",
							children: [/* @__PURE__ */ (0, f.jsx)("strong", {
								id: "collection-change-heading",
								children: "스냅샷 변경"
							}), /* @__PURE__ */ (0, f.jsx)("span", { children: a?.observedAt ? ko(a.observedAt) : "확인 전" })]
						}),
						/* @__PURE__ */ (0, f.jsxs)("dl", { children: [
							/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "추가" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: a?.counts.added ?? r.changeCounts.added })] }),
							/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "제외" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: a?.counts.removed ?? r.changeCounts.removed })] }),
							/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "유지" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: a?.counts.unchanged ?? r.changeCounts.unchanged })] }),
							/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "사용 불가" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: a?.counts.unusable ?? r.current.unusableCount })] })
						] }),
						a?.removedIds.length ? /* @__PURE__ */ (0, f.jsxs)("details", { children: [/* @__PURE__ */ (0, f.jsxs)("summary", { children: [
							"제외된 identity ",
							a.removedIds.length,
							"건"
						] }), /* @__PURE__ */ (0, f.jsx)("ul", { children: a.removedIds.map((e) => /* @__PURE__ */ (0, f.jsx)("li", { children: e }, e)) })] }) : null,
						/* @__PURE__ */ (0, f.jsx)("p", { children: "Collection 정의는 저장된 필터 메타데이터입니다. 위 자료 카드만 현재 외부 evidence 후보입니다." })
					]
				})]
			})
		]
	});
}
//#endregion
//#region src/app/DeepResearchRoute.tsx
var No = [{
	value: "auto",
	label: "AI",
	hint: "설정한 엔진이 이 질문에 맞는 축과 검색어를 씁니다. 40초쯤 걸립니다."
}, {
	value: "rules",
	label: "규칙",
	hint: "보고서 유형의 기본 축으로 즉시 만듭니다."
}];
function Po({ children: e = "저장된 구조화 정보가 없습니다." }) {
	return /* @__PURE__ */ (0, f.jsx)("p", {
		className: "topicrpt-provenance-empty",
		children: e
	});
}
function Fo({ report: e }) {
	let t = e.topicPlan, n = e.evidencePackSummary, r = e.researchResolution, i = hr(e.personalOverlay, e.canonicalRevision), a = typeof e.userContext == "string" ? e.userContext.trim() : e.userContext ? "생성 요청에 사용자 컨텍스트가 포함되었습니다." : "";
	return /* @__PURE__ */ (0, f.jsxs)("section", {
		className: "topicrpt-provenance",
		"aria-labelledby": "dr-provenance-heading",
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "topicrpt-provenance-heading",
				children: [
					/* @__PURE__ */ (0, f.jsx)("p", {
						className: "section-kicker",
						children: "사용한 자료와 생성 과정"
					}),
					/* @__PURE__ */ (0, f.jsx)("h2", {
						id: "dr-provenance-heading",
						children: "리서치 근거 추적"
					}),
					/* @__PURE__ */ (0, f.jsx)("p", { children: "승인한 계획, 외부 근거, 부족한 자료, 내 생각을 서로 구분해 보여줍니다." })
				]
			}),
			e.contractWarnings.length > 0 && /* @__PURE__ */ (0, f.jsx)("div", {
				className: "topicrpt-contract-warning",
				role: "status",
				children: "일부 구조화 필드가 올바르지 않아 안전한 빈 상태로 표시했습니다."
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "topicrpt-provenance-grid",
				children: [
					/* @__PURE__ */ (0, f.jsxs)("section", {
						className: "topicrpt-provenance-panel",
						"data-qa": "dr-approved-plan",
						"aria-labelledby": "dr-approved-plan-heading",
						children: [/* @__PURE__ */ (0, f.jsx)("h3", {
							id: "dr-approved-plan-heading",
							children: "승인된 계획"
						}), t ? /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [
							/* @__PURE__ */ (0, f.jsxs)("dl", {
								className: "topicrpt-provenance-facts",
								children: [
									/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "주제" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: t.topic || "미기록" })] }),
									/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "보고서 유형" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: t.reportType ? br(t.reportType) : "미기록" })] }),
									/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "사용자 의도" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: t.userIntent || "미기록" })] })
								]
							}),
							/* @__PURE__ */ (0, f.jsx)("h4", { children: "리서치 질문" }),
							as(t.researchQuestions),
							/* @__PURE__ */ (0, f.jsx)("h4", { children: "반증 조건" }),
							as(t.falsificationTriggers)
						] }) : /* @__PURE__ */ (0, f.jsx)(Po, {})]
					}),
					/* @__PURE__ */ (0, f.jsxs)("section", {
						className: "topicrpt-provenance-panel",
						"data-qa": "dr-evidence-coverage",
						"aria-labelledby": "dr-evidence-coverage-heading",
						children: [/* @__PURE__ */ (0, f.jsx)("h3", {
							id: "dr-evidence-coverage-heading",
							children: "근거 커버리지"
						}), n ? /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [
							/* @__PURE__ */ (0, f.jsxs)("dl", {
								className: "topicrpt-provenance-facts",
								children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "외부 문서" }), /* @__PURE__ */ (0, f.jsxs)("dd", { children: [n.totalDocs, "건"] })] }), /* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "메모리 참조" }), /* @__PURE__ */ (0, f.jsxs)("dd", { children: [n.memoryCount, "건"] })] })]
							}),
							Object.keys(n.roleCounts).length > 0 && /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [/* @__PURE__ */ (0, f.jsx)("h4", { children: "근거 역할" }), /* @__PURE__ */ (0, f.jsx)("ul", {
								className: "topicrpt-provenance-list",
								children: Object.entries(n.roleCounts).map(([e, t]) => /* @__PURE__ */ (0, f.jsxs)("li", { children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: e }), /* @__PURE__ */ (0, f.jsxs)("span", { children: [t, "건"] })] }, e))
							})] }),
							Object.keys(n.axisCoverage).length ? /* @__PURE__ */ (0, f.jsx)("ul", {
								className: "topicrpt-provenance-list",
								children: Object.entries(n.axisCoverage).map(([e, t]) => /* @__PURE__ */ (0, f.jsxs)("li", { children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: t.label || e }), /* @__PURE__ */ (0, f.jsxs)("span", { children: [
									t.count,
									"건 · ",
									t.level || "수준 미상"
								] })] }, e))
							}) : /* @__PURE__ */ (0, f.jsx)(Po, { children: "분석 축별 커버리지가 없습니다." }),
							Object.keys(n.questionCoverage).length > 0 && /* @__PURE__ */ (0, f.jsxs)("details", { children: [/* @__PURE__ */ (0, f.jsx)("summary", { children: "리서치 질문 커버리지" }), /* @__PURE__ */ (0, f.jsx)("ul", {
								className: "topicrpt-provenance-list",
								children: Object.entries(n.questionCoverage).map(([e, t]) => /* @__PURE__ */ (0, f.jsxs)("li", { children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: t.question || e }), /* @__PURE__ */ (0, f.jsxs)("span", { children: [
									t.count,
									"건 · ",
									t.level || "수준 미상"
								] })] }, e))
							})] }),
							e.evidenceItems.length > 0 && /* @__PURE__ */ (0, f.jsxs)("details", { children: [/* @__PURE__ */ (0, f.jsxs)("summary", { children: [
								"선별된 근거 ",
								e.evidenceItems.length,
								"건"
							] }), /* @__PURE__ */ (0, f.jsx)("ul", {
								className: "topicrpt-provenance-list",
								children: e.evidenceItems.map((e) => /* @__PURE__ */ (0, f.jsxs)("li", { children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: e.title }), /* @__PURE__ */ (0, f.jsx)("span", { children: [
									e.source,
									e.role,
									e.confidence
								].filter(Boolean).join(" · ") })] }, e.id))
							})] })
						] }) : /* @__PURE__ */ (0, f.jsx)(Po, {})]
					}),
					/* @__PURE__ */ (0, f.jsxs)("section", {
						className: "topicrpt-provenance-panel topicrpt-provenance-wide",
						"data-qa": "dr-source-ledger",
						"aria-labelledby": "dr-source-ledger-heading",
						children: [
							/* @__PURE__ */ (0, f.jsx)("h3", {
								id: "dr-source-ledger-heading",
								children: "외부 근거 원장"
							}),
							/* @__PURE__ */ (0, f.jsx)("p", {
								className: "topicrpt-layer-note",
								children: "이 목록만 보고서의 권위 있는 외부 출처 원장입니다."
							}),
							e.sourceLedger.length ? /* @__PURE__ */ (0, f.jsx)("ol", {
								className: "topicrpt-source-ledger",
								children: e.sourceLedger.map((e) => /* @__PURE__ */ (0, f.jsxs)("li", { children: [
									/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: e.title || "제목 미상" }), /* @__PURE__ */ (0, f.jsx)("span", { children: [
										e.source,
										e.date,
										e.evidenceRole,
										e.reliability,
										e.artifactType
									].filter(Boolean).join(" · ") })] }),
									e.usedInSections.length > 0 && /* @__PURE__ */ (0, f.jsxs)("small", { children: ["사용 섹션: ", e.usedInSections.join(", ")] }),
									(e.axisKey || e.researchQuestionId || e.researchRound !== null) && /* @__PURE__ */ (0, f.jsxs)("small", { children: ["추적: ", [
										e.axisKey,
										e.researchQuestionId,
										e.researchRound === null ? "" : `round ${e.researchRound}`
									].filter(Boolean).join(" · ")] }),
									e.url && /* @__PURE__ */ (0, f.jsx)("a", {
										href: e.url,
										target: "_blank",
										rel: "noopener noreferrer",
										children: "원문 열기"
									})
								] }, e.sourceId))
							}) : /* @__PURE__ */ (0, f.jsx)(Po, { children: "확인 가능한 외부 근거 원장이 없습니다." })
						]
					}),
					/* @__PURE__ */ (0, f.jsxs)("section", {
						className: "topicrpt-provenance-panel",
						"data-qa": "dr-data-gaps",
						"aria-labelledby": "dr-data-gaps-heading",
						children: [/* @__PURE__ */ (0, f.jsx)("h3", {
							id: "dr-data-gaps-heading",
							children: "자료 공백"
						}), e.dataGaps.length ? /* @__PURE__ */ (0, f.jsx)("ul", {
							className: "topicrpt-provenance-list",
							children: e.dataGaps.map((e) => /* @__PURE__ */ (0, f.jsxs)("li", {
								"data-severity": e.severity,
								children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: e.description }), /* @__PURE__ */ (0, f.jsx)("span", { children: e.resolved ? "해결됨" : e.suggestedAction || "추가 확인 필요" })]
							}, e.id))
						}) : /* @__PURE__ */ (0, f.jsx)(Po, { children: "기록된 자료 공백이 없습니다." })]
					}),
					/* @__PURE__ */ (0, f.jsxs)("section", {
						className: "topicrpt-provenance-panel",
						"data-qa": "dr-quality",
						"aria-labelledby": "dr-quality-heading",
						children: [/* @__PURE__ */ (0, f.jsx)("h3", {
							id: "dr-quality-heading",
							children: "품질과 경고"
						}), e.quality ? /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [
							/* @__PURE__ */ (0, f.jsxs)("dl", {
								className: "topicrpt-provenance-facts",
								children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "평가" }), /* @__PURE__ */ (0, f.jsxs)("dd", { children: [
									e.quality.score ?? "—",
									"점 · ",
									e.quality.grade || "등급 미상"
								] })] }), /* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "상태" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: e.quality.status || "미기록" })] })]
							}),
							/* @__PURE__ */ (0, f.jsx)("h4", { children: "경고" }),
							as(e.quality.warnings, "경고 없음"),
							/* @__PURE__ */ (0, f.jsx)("h4", { children: "보완 제안" }),
							as(e.quality.suggestedFixes, "제안 없음")
						] }) : /* @__PURE__ */ (0, f.jsx)(Po, {})]
					}),
					/* @__PURE__ */ (0, f.jsxs)("section", {
						className: "topicrpt-provenance-panel topicrpt-provenance-wide",
						"data-qa": "dr-collection-resolution",
						"aria-labelledby": "dr-collection-resolution-heading",
						children: [/* @__PURE__ */ (0, f.jsx)("h3", {
							id: "dr-collection-resolution-heading",
							children: "자료 모음 실행 기록"
						}), r ? /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [
							/* @__PURE__ */ (0, f.jsxs)("dl", {
								className: "topicrpt-provenance-facts topicrpt-provenance-facts-wide",
								children: [
									/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "자료 모음" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: r.collectionId || "직접 범위" })] }),
									/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "버전" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: r.collectionRevision ?? "—" })] }),
									/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "후보" }), /* @__PURE__ */ (0, f.jsxs)("dd", { children: [r.eligibleTotal ?? "—", "건"] })] }),
									/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "선택 근거" }), /* @__PURE__ */ (0, f.jsxs)("dd", { children: [r.selectedEvidenceIds.length, "건"] })] }),
									/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "후보 상한" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: r.candidateCap ?? "—" })] }),
									/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "해결 / 실행" }), /* @__PURE__ */ (0, f.jsxs)("dd", { children: [
										r.resolvedCandidateIds.length,
										" / ",
										r.executionUniverseIds.length,
										"건"
									] })] })
								]
							}),
							/* @__PURE__ */ (0, f.jsxs)("details", { children: [/* @__PURE__ */ (0, f.jsx)("summary", { children: "재현성 세부 정보" }), /* @__PURE__ */ (0, f.jsxs)("dl", {
								className: "topicrpt-provenance-facts topicrpt-provenance-facts-wide",
								children: [
									/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "Definition hash" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: r.collectionDefinitionHash || "—" })] }),
									/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "Input watermark" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: r.inputWatermark || "—" })] }),
									/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "Index generation" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: r.providerGenerations.indexGeneration || "—" })] }),
									/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "RSS generation" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: r.providerGenerations.rssGeneration || "—" })] }),
									/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "Fingerprint" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: r.resolutionFingerprint || "—" })] }),
									/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "Resolved at" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: r.resolvedAt || "—" })] })
								]
							})] }),
							r.unusableCandidates.length > 0 && /* @__PURE__ */ (0, f.jsxs)("p", {
								className: "topicrpt-layer-note",
								children: [
									"사용 제외 ",
									r.unusableCandidates.length,
									"건 · ",
									r.unusableCandidates.map((e) => e.reason).join(", ")
								]
							}),
							r.zeroEvidenceRequired && /* @__PURE__ */ (0, f.jsxs)("p", {
								className: "topicrpt-contract-warning",
								children: ["근거 부족 확인: ", r.zeroEvidenceReason || "사유 미기록"]
							})
						] }) : /* @__PURE__ */ (0, f.jsx)(Po, {})]
					}),
					/* @__PURE__ */ (0, f.jsxs)("aside", {
						className: "topicrpt-hypothesis-panel",
						"data-qa": "dr-user-context-hypothesis",
						"aria-labelledby": "dr-user-context-heading",
						children: [
							/* @__PURE__ */ (0, f.jsx)("p", {
								className: "section-kicker",
								children: "내 생각·가설 · 근거 아님"
							}),
							/* @__PURE__ */ (0, f.jsx)("h3", {
								id: "dr-user-context-heading",
								children: "사용자 컨텍스트"
							}),
							/* @__PURE__ */ (0, f.jsx)("p", { children: a || "이 보고서에는 사용자 컨텍스트가 기록되지 않았습니다." })
						]
					}),
					/* @__PURE__ */ (0, f.jsxs)("aside", {
						className: "topicrpt-hypothesis-panel topicrpt-provenance-wide",
						"data-qa": "dr-overlay-hypothesis",
						"aria-labelledby": "dr-overlay-heading",
						children: [
							/* @__PURE__ */ (0, f.jsx)("p", {
								className: "section-kicker",
								children: "내 투자 관점과 비교 · 가설"
							}),
							/* @__PURE__ */ (0, f.jsx)("h3", {
								id: "dr-overlay-heading",
								children: "개인 해석"
							}),
							/* @__PURE__ */ (0, f.jsx)(Nn, {
								overlay: i,
								staleQa: "dr-overlay-stale"
							})
						]
					})
				]
			})
		]
	});
}
function Io({ resolution: e }) {
	if (!e) return null;
	let t = yo(e), n = typeof e.reason == "string" ? e.reason : "", r = e.injected === !0, i = t?.status || (n === "policy_excluded" ? "excluded" : "unknown"), a = i === "current" && r ? "생성 시점의 현재 상태를 별도 시장 배경으로 포함했습니다." : i === "stale" ? "최신성이 만료되어 보고서 판단에는 주입하지 않았습니다." : i === "fallback" ? "참고용 대체 상태이며 현재 투자 자세로 사용하지 않았습니다." : i === "empty" ? "사용 가능한 시장 상태가 없어 보고서 판단에 포함하지 않았습니다." : i === "excluded" ? "요청 정책에 따라 시장 상태를 제외했습니다." : "시장 상태 참조를 확인할 수 없습니다.";
	return /* @__PURE__ */ (0, f.jsxs)("aside", {
		className: `topicrpt-market-state-context state-${i}`,
		"data-qa": "dr-market-state-context",
		"data-status": i,
		"aria-label": "별도 시장 상태 배경",
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "시장 상태 · 근거 기반 배경" }), /* @__PURE__ */ (0, f.jsx)("strong", { children: i })] }),
			/* @__PURE__ */ (0, f.jsx)("p", { children: a }),
			t ? /* @__PURE__ */ (0, f.jsxs)("dl", { children: [
				/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "기준 시각" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: t.asOf || "없음" })] }),
				/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "최신성" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: t.freshnessReason })] }),
				/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "출처" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: t.sourceKind })] }),
				/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "범위" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: t.scope })] })
			] }) : null,
			/* @__PURE__ */ (0, f.jsx)("small", { children: "이 컨텍스트는 외부 근거 목록·인용·가설에 포함되지 않습니다." })
		]
	});
}
var Lo = "custom", Ro = { custom: "직접 질문" }, zo = [
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
];
function Bo(e, t) {
	return new Promise((n, r) => {
		if (t.aborted) {
			r(new DOMException("Request cancelled", "AbortError"));
			return;
		}
		let i = window.setTimeout(() => {
			t.removeEventListener("abort", a), n();
		}, e), a = () => {
			window.clearTimeout(i), t.removeEventListener("abort", a), r(new DOMException("Request cancelled", "AbortError"));
		};
		t.addEventListener("abort", a, { once: !0 });
	});
}
function Vo(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function Ho(e) {
	return typeof e == "string" && zo.includes(e);
}
function Uo(e) {
	return Vo(e) ? typeof e.id == "string" && Ho(e.status) : !1;
}
function Wo(e) {
	return Vo(e) ? Uo(e.job) : !1;
}
var Go = class extends Error {
	job;
	name = "JobTerminalError";
	constructor(e) {
		super(e.message || e.error || `딥 리서치 작업이 ${e.status} 상태로 종료되었습니다.`), this.job = e;
	}
};
async function Ko(e, t) {
	let n = e, r = Date.now() + 12e4;
	for (; U(n.status);) {
		if (Date.now() >= r) throw Error("작업이 아직 실행 중입니다. 잠시 후 작업 목록에서 다시 확인하세요.");
		await Bo(1e3, t), n = await G(`/api/jobs/${encodeURIComponent(n.id)}`, { signal: t });
	}
	if (n.status !== "done") throw new Go(n);
	return n;
}
function qo(e = "", t = "딥 리서치") {
	let n = e.replace(/\r\n/g, "\n").split("\n"), r = n.findIndex((e) => e.trim());
	if (r < 0) return {
		title: t,
		body: ""
	};
	let i = n[r].trim().match(/^#\s+(.+)$/);
	return i ? {
		title: i[1],
		body: n.slice(r + 1).join("\n").trim()
	} : {
		title: t,
		body: e
	};
}
function Jo(e) {
	return e.topicLabel || e.topicKey || "딥 리서치";
}
function Yo(e) {
	let t = String(e.topicKey || "").trim();
	return Ro[t] ? Ro[t] : String(e.topicLabel || "").trim() || (t ? t.replace(/_/g, " ") : "기타");
}
function Xo(e) {
	return dn(e) || "날짜 미상";
}
function Zo(e) {
	if (!e) return "월 미상";
	let t = new Date(e);
	if (!Number.isNaN(t.getTime())) return `${t.getFullYear()}.${String(t.getMonth() + 1).padStart(2, "0")}`;
	let n = String(e).match(/^(\d{4})[-.](\d{1,2})/);
	return n ? `${n[1]}.${String(n[2]).padStart(2, "0")}` : "월 미상";
}
function Qo(e) {
	return String(e || "").trim().toLowerCase();
}
var $o = 8;
function es(e) {
	window.location.hash = e ? Xn(e) : "#/deep-research";
}
function ts() {
	return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "deep-research";
}
function ns(e) {
	return e instanceof H ? e.code : e instanceof Go ? e.job.errorCode || e.job.status : e instanceof Error ? e.name : "request_failed";
}
function rs(e, t) {
	let n = ns(t);
	return e === "validation" ? "투자 질문을 1~500자로 입력하세요." : n === "evidence_confirmation_required" || n === "resolution_changed" ? "자료 상태가 계획 미리보기와 달라졌습니다. 최신 계획을 다시 미리보고 확인하세요." : n === "no_index" || n === "index_unavailable" ? "연구 인덱스를 아직 읽을 수 없습니다. RSS 자료를 수집하고 인덱스를 만든 뒤 다시 시도하세요." : n === "rss_unavailable" ? "RSS 자료를 읽을 수 없습니다. RSS 수집 상태를 확인한 뒤 다시 시도하세요." : n === "cli_unavailable" ? "선택한 CLI 어댑터를 사용할 수 없습니다. 자동 어댑터를 선택하거나 설정을 확인하세요." : n === "approval_superseded" || n === "approval_expired" || n === "approval_mismatch" ? "이 계획의 승인이 더 이상 유효하지 않습니다. 계획을 다시 미리보고 진행하세요." : e === "degraded" ? "근거가 없는 규칙 기반 보고서를 실행하려면 근거 부족 확인이 필요합니다." : e === "generation" ? "생성 작업에 실패했습니다. 입력과 승인 계획은 유지되므로 다시 실행할 수 있습니다." : e === "report" ? "저장된 리서치를 열지 못했습니다. 목록으로 돌아가 다시 시도하세요." : t instanceof Error && t.message ? t.message : "요청을 처리하지 못했습니다. 입력을 확인하고 다시 시도하세요.";
}
function is(e) {
	return {
		id: e.approval.id,
		token: e.approval.token
	};
}
function as(e, t = "없음") {
	return e.length ? /* @__PURE__ */ (0, f.jsx)("ul", {
		className: "topicrpt-inline-list",
		children: e.map((e) => /* @__PURE__ */ (0, f.jsx)("li", { children: e }, e))
	}) : /* @__PURE__ */ (0, f.jsx)("span", {
		className: "topicrpt-empty-value",
		children: t
	});
}
var os = [
	"축 하나를 빼고 공급 쪽을 자세히 봐줘",
	"검색어에 영어 키워드를 더해줘",
	"한국 기업 중심으로 좁혀줘"
];
function ss({ busy: e, onSubmit: t, onCancel: n }) {
	let [r, i] = (0, d.useState)(""), a = r.trim().length > 0;
	return /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "topicrpt-plan-revision",
		"data-qa": "dr-plan-revision",
		children: [
			/* @__PURE__ */ (0, f.jsxs)("p", {
				className: "topicrpt-plan-revision-head",
				children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: "어떻게 고칠까요?" }), /* @__PURE__ */ (0, f.jsx)("span", { children: "요청한 부분만 바꾸고 나머지는 그대로 둡니다. 고친 계획으로 승인이 다시 발급됩니다." })]
			}),
			/* @__PURE__ */ (0, f.jsxs)("label", {
				className: "field",
				children: [/* @__PURE__ */ (0, f.jsx)("span", {
					className: "sr-only",
					children: "수정 요청"
				}), /* @__PURE__ */ (0, f.jsx)("textarea", {
					rows: 3,
					value: r,
					maxLength: 1e3,
					disabled: e,
					placeholder: "예: 밸류에이션 축은 빼고 공급 쪽을 자세히 봐줘",
					onChange: (e) => i(e.currentTarget.value)
				})]
			}),
			/* @__PURE__ */ (0, f.jsx)("div", {
				className: "topicrpt-plan-revision-examples",
				children: os.map((t) => /* @__PURE__ */ (0, f.jsx)("button", {
					className: "chip",
					type: "button",
					disabled: e,
					onClick: () => i(t),
					children: t
				}, t))
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "topicrpt-plan-revision-actions",
				children: [/* @__PURE__ */ (0, f.jsx)("button", {
					className: "btn btn--text",
					type: "button",
					onClick: n,
					disabled: e,
					children: "취소"
				}), /* @__PURE__ */ (0, f.jsx)("button", {
					className: "btn btn--primary",
					type: "button",
					"data-qa": "dr-plan-revision-submit",
					disabled: e || !a,
					onClick: () => t(r.trim()),
					children: e ? "고치는 중" : "이대로 고치기"
				})]
			})
		]
	});
}
function cs({ envelope: e, onContinue: t, onEdit: n, degradedConfirming: r, onConfirmDegraded: i, onCancelDegraded: a, editing: o, revising: s, replanning: c, onReplan: l, onEditPlan: u, onRevise: d, onCancelEdit: p }) {
	let { approvedRequest: m, preview: h } = e, g = m.topicPlan, _ = h.zeroEvidence, v = _.reasonCode;
	return /* @__PURE__ */ (0, f.jsxs)("section", {
		className: "input-panel topicrpt-plan-panel",
		"data-qa": "dr-plan",
		"aria-labelledby": "dr-plan-heading",
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "input-panel-header",
				children: [
					/* @__PURE__ */ (0, f.jsx)("span", {
						className: "section-kicker",
						children: "조사 계획 확인"
					}),
					/* @__PURE__ */ (0, f.jsx)("h2", {
						id: "dr-plan-heading",
						children: "실행 전에 리서치 계획을 확인하세요"
					}),
					/* @__PURE__ */ (0, f.jsx)("p", { children: "계획의 범위와 자료 상태를 확인한 뒤에만 생성 작업을 시작합니다. 이 계획은 승인한 요청의 일부로 기록됩니다." }),
					/* @__PURE__ */ (0, f.jsxs)("p", {
						className: "topicrpt-plan-origin",
						children: [/* @__PURE__ */ (0, f.jsx)("span", {
							className: "chip",
							children: xr(g.plannerMode)
						}), !o && /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [/* @__PURE__ */ (0, f.jsx)("button", {
							className: "btn",
							type: "button",
							"data-qa": "dr-plan-edit",
							onClick: u,
							disabled: c || s,
							children: "계획 고치기"
						}), /* @__PURE__ */ (0, f.jsx)("button", {
							className: "btn",
							type: "button",
							"data-qa": "dr-plan-replan",
							onClick: l,
							disabled: c || s,
							children: c ? "다시 쓰는 중" : "처음부터 다시"
						})] })]
					})
				]
			}),
			o && /* @__PURE__ */ (0, f.jsx)(ss, {
				busy: s,
				onSubmit: d,
				onCancel: p
			}),
			!o && /* @__PURE__ */ (0, f.jsxs)("div", {
				className: "topicrpt-plan-grid",
				children: [
					/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "topicrpt-plan-card",
						children: [
							/* @__PURE__ */ (0, f.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "보고서 유형"
							}),
							/* @__PURE__ */ (0, f.jsx)("strong", { children: br(g.reportType) }),
							/* @__PURE__ */ (0, f.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "분석 축"
							}),
							g.analysisAxes.length ? /* @__PURE__ */ (0, f.jsx)("ul", {
								className: "topicrpt-axis-list",
								children: g.analysisAxes.map((e) => /* @__PURE__ */ (0, f.jsxs)("li", { children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: e.label }), as(e.questions)] }, e.key))
							}) : /* @__PURE__ */ (0, f.jsx)("span", {
								className: "topicrpt-empty-value",
								children: "분석 축 없음"
							})
						]
					}),
					/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "topicrpt-plan-card",
						children: [
							/* @__PURE__ */ (0, f.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "검색 질의"
							}),
							as(g.searchQueries),
							/* @__PURE__ */ (0, f.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "심층 범위"
							}),
							/* @__PURE__ */ (0, f.jsxs)("p", { children: [
								"최대 ",
								g.deepResearch.maxRounds,
								"라운드 · 하위 질문 ",
								g.deepResearch.subQuestions.length,
								"개"
							] }),
							/* @__PURE__ */ (0, f.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "예상 공백"
							}),
							as(g.dataGapsLikely)
						]
					}),
					/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "topicrpt-plan-card",
						children: [
							/* @__PURE__ */ (0, f.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "저장한 자료 모음"
							}),
							m.collectionRef ? /* @__PURE__ */ (0, f.jsxs)("p", { children: [
								"저장한 자료 모음 사용 · ",
								m.collectionRef.id,
								" · 버전 ",
								m.collectionRef.revision,
								/* @__PURE__ */ (0, f.jsx)("br", {}),
								"후보 ",
								h.resolution.eligibleTotal ?? 0,
								"건 · 선택 ",
								h.resolution.selectedEvidenceIds.length,
								"건",
								/* @__PURE__ */ (0, f.jsx)("br", {}),
								/* @__PURE__ */ (0, f.jsx)("small", { children: "자료 모음은 근거 자체가 아니며, 일치하는 자료를 실행 시점에 다시 확인합니다." })
							] }) : /* @__PURE__ */ (0, f.jsx)("p", { children: "저장한 자료 모음 없이 전체 허용 자료에서 확인합니다." }),
							_.required && /* @__PURE__ */ (0, f.jsxs)("p", {
								className: "topicrpt-zero-evidence",
								"data-qa": `dr-readiness-${v === "no_index" ? "no-index" : v || "zero-evidence"}`,
								"data-reason-code": v || void 0,
								children: [v === "no_index" ? "인덱스 없음" : v === "filtered_empty" ? "필터 결과 없음" : "일치 자료 없음", " · 실행 전 확인 필요"]
							}),
							/* @__PURE__ */ (0, f.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "시장 상태 배경"
							}),
							/* @__PURE__ */ (0, f.jsxs)("p", { children: [
								m.marketStatePolicy === "exclude" ? "제외" : "현재 상태 포함",
								" · 범위 ",
								m.marketStateScope === "AUTO" ? "자동" : m.marketStateScope,
								/* @__PURE__ */ (0, f.jsx)("br", {}),
								/* @__PURE__ */ (0, f.jsx)("small", { children: "실행 시 상태, 기준 시각, 최신성, 출처를 별도 배경으로 기록합니다." })
							] })
						]
					})
				]
			}),
			_.required && v && _.resolutionFingerprint && /* @__PURE__ */ (0, f.jsxs)("div", {
				className: "topicrpt-degraded-panel",
				"data-qa": `dr-degraded-${v === "no_index" ? "no-index" : v}`,
				"data-reason-code": v,
				role: "alert",
				children: [
					/* @__PURE__ */ (0, f.jsx)("strong", { children: "근거 부족 상태를 확인해야 합니다" }),
					/* @__PURE__ */ (0, f.jsx)("p", { children: "현재 선택된 외부 근거가 0건입니다. 확인하면 규칙 기반 결과로 진행하며, 보고서에 근거 공백과 반대 근거를 표시합니다." }),
					r ? /* @__PURE__ */ (0, f.jsxs)("div", {
						className: "topicrpt-degraded-actions",
						children: [/* @__PURE__ */ (0, f.jsx)("button", {
							className: "btn btn--primary",
							type: "button",
							"data-qa": "dr-degraded-confirm",
							onClick: i,
							children: "근거 부족을 확인하고 계속"
						}), /* @__PURE__ */ (0, f.jsx)("button", {
							className: "btn",
							type: "button",
							onClick: a,
							children: "취소"
						})]
					}) : /* @__PURE__ */ (0, f.jsx)("p", { children: "계속하기를 누르면 확인 단계가 열립니다." })
				]
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "topicrpt-action-row",
				children: [/* @__PURE__ */ (0, f.jsx)("button", {
					className: "btn",
					type: "button",
					onClick: n,
					children: "질문 수정"
				}), /* @__PURE__ */ (0, f.jsx)("button", {
					className: "btn btn--primary",
					type: "button",
					"data-qa": "dr-continue",
					onClick: t,
					children: _.required ? "계속하기" : "이 계획으로 생성"
				})]
			})
		]
	});
}
function ls() {
	let e = un("topicReport"), [t, n] = (0, d.useState)([]), [r, i] = (0, d.useState)(null), a = (0, d.useMemo)(() => Zn(window.location.hash), []), [o, s] = (0, d.useState)(a.kind === "report" ? a.id : ""), [c, l] = (0, d.useState)(a.kind === "collection" ? a.id : ""), [u, p] = (0, d.useState)(a.malformed), [m, h] = (0, d.useState)(""), [g, _] = (0, d.useState)(""), [v, y] = (0, d.useState)("include_current"), [b, S] = (0, d.useState)("AUTO"), [C, w] = (0, d.useState)(null), [T, E] = (0, d.useState)(!1), [D, O] = (0, d.useState)("readiness"), [k, A] = (0, d.useState)(null), [j, M] = (0, d.useState)(!1), [N, P] = (0, d.useState)(!1), [F, I] = (0, d.useState)(""), [L, R] = (0, d.useState)(null), [z, B] = (0, d.useState)(""), [V, ee] = (0, d.useState)(null), [U, W] = (0, d.useState)(""), [te, ne] = (0, d.useState)(""), [re, ie] = (0, d.useState)(0), [ae, oe] = (0, d.useState)("auto"), [se, le] = (0, d.useState)(!1), [ue, de] = (0, d.useState)(!1), [fe, pe] = (0, d.useState)(!1), [me, he] = (0, d.useState)(""), [ge, _e] = (0, d.useState)("recent"), ve = (0, d.useRef)(0), ye = (0, d.useRef)(null), be = (0, d.useRef)(null), xe = (0, d.useRef)(""), Se = (0, d.useRef)(!1), Ce = Lo, we = m, Te = (0, d.useCallback)(() => {
		ye.current?.abort();
		let e = new AbortController();
		return ye.current = e, ve.current += 1, {
			id: ve.current,
			signal: e.signal
		};
	}, []), Ee = (0, d.useCallback)((e) => e === ve.current, []), De = (0, d.useCallback)(async (e) => {
		P(!0);
		try {
			let t = await G("/api/topic-reports", { signal: e });
			n(vr(t)), ee(null), O((e) => e === "readiness" ? "draft" : e), q("deep-research", {
				surface: "topic_report",
				viewId: "topicrpt",
				reportKind: "",
				reportId: "",
				collectionId: null,
				collectionRevision: null
			});
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError") return;
			I(rs("readiness", e)), R("readiness"), B(ns(e));
			let t = ns(e);
			ee(t === "no_index" || t === "index_unavailable" ? "no-index" : t === "rss_unavailable" ? "rss" : "api"), O("recoverable-error");
		} finally {
			P(!1);
		}
	}, []);
	(0, d.useEffect)(() => {
		let e = new AbortController();
		return De(e.signal), () => e.abort();
	}, [De, e]), (0, d.useEffect)(() => {
		let e = {
			collectionId: C?.id || null,
			collectionRevision: C?.revision || null
		};
		return $e("deep-research", e), () => {
			let t = window.FolioAgent?.currentContext;
			t?.collectionId === e.collectionId && t.collectionRevision === e.collectionRevision && $e("deep-research", {
				collectionId: null,
				collectionRevision: null
			});
		};
	}, [C]), (0, d.useEffect)(() => {
		let e = () => {
			if (!ts()) return;
			let e = Zn(window.location.hash);
			p(e.malformed), s(e.kind === "report" ? e.id : ""), l(e.kind === "collection" ? e.id : ""), e.malformed && (i(null), I(e.kind === "collection" ? "컬렉션 주소 형식이 올바르지 않습니다. 목록으로 돌아가 다시 여세요." : "보고서 주소 형식이 올바르지 않습니다. 목록으로 돌아가 다시 여세요."), R("report"), B(e.kind === "collection" ? "malformed_collection_id" : "malformed_report_id"), O("recoverable-error"));
		};
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []);
	let Oe = (0, d.useCallback)(() => {
		Se.current = !0, i(null), p(!1), I(""), R(null), B(""), es();
	}, []);
	(0, d.useEffect)(() => {
		o || u || !Se.current || (Se.current = !1, window.requestAnimationFrame(() => {
			let e = xe.current.replace(/["\\]/g, "");
			((e ? document.querySelector("[data-report-id=\"" + e + "\"]") : null) || be.current)?.focus({ preventScroll: !0 });
		}));
	}, [
		o,
		u,
		D
	]), (0, d.useEffect)(() => {
		let e = (e) => {
			let t = e.detail;
			ze(t, window.FolioAgent?.currentContext) && ie((e) => e + 1);
		};
		return window.addEventListener(ce, e), () => window.removeEventListener(ce, e);
	}, []), (0, d.useEffect)(() => {
		let e = new AbortController();
		ye.current?.abort();
		let t = ve.current + 1;
		ve.current = t;
		async function n(n) {
			P(!0), I(""), R(null), B("");
			try {
				let r = await G(`/api/topic-reports/${encodeURIComponent(n)}?includePersonal=true`, { signal: e.signal });
				if (e.signal.aborted || ve.current !== t) return;
				let a = _r(r);
				i(a), O("report"), q("deep-research", {
					surface: "topic_report_reader",
					viewId: "topicrpt",
					reportKind: "topic_report",
					reportId: a.id || n,
					collectionId: C?.id || null,
					collectionRevision: C?.revision || null
				});
			} catch (n) {
				if (n instanceof DOMException && n.name === "AbortError" || e.signal.aborted || ve.current !== t) return;
				i(null), I(rs("report", n)), R("report"), B(ns(n)), O("recoverable-error");
			} finally {
				!e.signal.aborted && ve.current === t && P(!1);
			}
		}
		return o && !u ? n(o) : !u && !c && (i(null), O((e) => e === "report" ? "draft" : e), q("deep-research", {
			surface: "topic_report",
			viewId: "topicrpt",
			reportKind: "",
			reportId: "",
			collectionId: C?.id || null,
			collectionRevision: C?.revision || null
		}), P(!1)), () => e.abort();
	}, [
		c,
		o,
		u,
		re
	]);
	let ke = async (e) => {
		e.preventDefault();
		let t = m.normalize("NFKC").trim();
		if (!t || t.length > 500) {
			I(rs("validation", /* @__PURE__ */ Error("question_invalid"))), R("validation"), B("question_invalid"), O("recoverable-error");
			return;
		}
		let n = Te();
		O("plan-loading"), A(null), M(!1), I(""), R(null), B(""), W(ae === "rules" ? "질문을 실행 계획으로 바꾸는 중입니다." : "AI가 리서치 계획을 쓰는 중입니다. 30초 이상 걸릴 수 있습니다.");
		let r = {
			question: t,
			userContext: g.normalize("NFKC").trim(),
			plannerEngine: ae,
			deepResearch: !0,
			customTickers: {},
			marketStatePolicy: v,
			marketStateScope: b,
			collectionRef: C
		};
		try {
			let e = await K("/api/topic-reports/plan", r, { signal: n.signal });
			if (!Ee(n.id)) return;
			A(e), O("plan-review"), W("실행 계획을 확인하세요.");
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError" || !Ee(n.id)) return;
			I(rs("plan", e)), R("plan"), B(ns(e)), ee(ns(e) === "no_index" || ns(e) === "index_unavailable" ? "no-index" : ns(e) === "rss_unavailable" ? "rss" : null), O("recoverable-error"), W("");
		}
	}, Ae = async (e) => {
		let t = Te();
		O("generation"), I(""), R(null), B(""), W("승인된 계획으로 리서치를 생성하는 중입니다.");
		let r = {
			mode: "auto",
			adapter: "auto",
			fallbackPolicy: x
		}, a = {
			approvedRequest: e.approvedRequest,
			approval: is(e),
			execution: r
		};
		try {
			let e = await K("/api/topic-reports", a, { signal: t.signal }), r = Wo(e) ? e.job : Uo(e) ? e : null;
			if (!r) throw Error("생성 작업 ID를 확인하지 못했습니다.");
			let o = await Ko(r, t.signal);
			if (!Ee(t.id)) return;
			let s = o.result?.reportId || o.result?.artifactId || "";
			if (!s) throw Error("생성된 보고서 ID를 확인하지 못했습니다.");
			let c = _r(await G(`/api/topic-reports/${encodeURIComponent(s)}?includePersonal=true`, { signal: t.signal }));
			if (!Ee(t.id)) return;
			n((e) => [c, ...e.filter((e) => e.id !== c.id)]), i(c), O("report"), W("딥 리서치를 생성하고 자동 저장했습니다."), es(c.id), q("deep-research", {
				surface: "topic_report_reader",
				viewId: "topicrpt",
				reportKind: "topic_report",
				reportId: c.id || "",
				collectionId: C?.id || null,
				collectionRevision: C?.revision || null
			});
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError" || !Ee(t.id)) return;
			I(rs("generation", e)), R(e instanceof H && (e.code === "evidence_confirmation_required" || e.code === "resolution_changed") ? "degraded" : "generation"), B(ns(e)), O("recoverable-error"), W("");
		}
	}, je = () => {
		if (k) {
			if (k.preview.zeroEvidence.required) {
				if (!k.preview.zeroEvidence.reasonCode || !k.preview.zeroEvidence.resolutionFingerprint) {
					I("근거 부족 확인 정보가 없어 실행을 중단했습니다. 계획을 다시 미리보세요."), R("degraded"), B("invalid_zero_evidence"), O("recoverable-error");
					return;
				}
				M(!0), W("근거 부족 확인을 검토하세요.");
				return;
			}
			Ae(k);
		}
	}, Me = async (e) => {
		if (!k) return;
		let t = Te(), n = e.length > 0;
		n ? de(!0) : pe(!0), I(""), R(null), B(""), W(n ? "요청하신 대로 계획을 고치는 중입니다. 30초 이상 걸릴 수 있습니다." : "AI가 리서치 계획을 다시 쓰는 중입니다. 30초 이상 걸릴 수 있습니다.");
		let r = {
			approvedRequest: k.approvedRequest,
			approval: is(k),
			instruction: e
		};
		try {
			let e = await K("/api/topic-reports/plan/replan", r, { signal: t.signal });
			if (!Ee(t.id)) return;
			A(e), le(!1), M(!1), W(e.approvedRequest.topicPlan.plannerMode === "llm" ? n ? "요청하신 대로 계획을 고쳤습니다." : "AI가 계획을 다시 썼습니다." : "AI 엔진을 쓸 수 없어 계획을 그대로 두었습니다.");
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError" || !Ee(t.id)) return;
			I(rs("plan", e)), R("plan"), B(ns(e)), O("recoverable-error"), W("");
		} finally {
			Ee(t.id) && (pe(!1), de(!1));
		}
	}, Ne = async (e) => {
		await Me(e);
	}, Pe = async () => {
		if (!k) return;
		let e = k.preview.zeroEvidence;
		if (!e.required || !e.reasonCode || !e.resolutionFingerprint) return;
		let t = Te();
		I(""), R(null), B(""), W("근거 부족 확인을 저장하는 중입니다.");
		let n = {
			approvedRequest: k.approvedRequest,
			approval: is(k),
			reasonCode: e.reasonCode,
			resolutionFingerprint: e.resolutionFingerprint,
			confirmed: !0
		};
		try {
			let e = await K("/api/topic-reports/confirm-degraded", n, { signal: t.signal });
			if (!Ee(t.id)) return;
			A(e), M(!1), await Ae(e);
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError" || !Ee(t.id)) return;
			I(rs("degraded", e)), R("degraded"), B(ns(e)), O("recoverable-error"), W("");
		}
	};
	async function Fe(e) {
		if (!(!e.id || !window.confirm(`${Jo(e)} 보고서를 삭제할까요?`))) {
			ne(`delete-${e.id}`), I("");
			try {
				let t = await fetch(`/api/topic-reports/${encodeURIComponent(e.id)}`, { method: "DELETE" });
				if (!t.ok) throw Error(`삭제 실패: ${t.status}`);
				r?.id === e.id && es(), n((t) => t.filter((t) => t.id !== e.id)), W("저장된 딥 리서치를 삭제했습니다.");
			} catch (e) {
				I(e instanceof Error ? e.message : "보고서 삭제에 실패했습니다."), R("report"), B(ns(e));
			} finally {
				ne("");
			}
		}
	}
	async function Ie(e) {
		if (r) {
			ne(e), W(e === "notion" ? "Notion으로 내보내는 중..." : "Obsidian으로 내보내는 중...");
			try {
				let t = e === "notion" ? await K("/api/export-notion/topic-report", r) : await K("/api/export-obsidian/topic-report", r);
				W(e === "notion" ? `Notion으로 내보냈습니다${t.title ? `: ${t.title}` : ""}` : `Obsidian으로 내보냈습니다${t.topic || t.filename ? `: ${t.topic || t.filename}` : ""}`);
			} catch (e) {
				W(e instanceof Error ? e.message : "내보내기에 실패했습니다.");
			} finally {
				ne("");
			}
		}
	}
	async function Le() {
		if (r?.id) {
			ne("overlay"), W("내 노트와 연결하는 중...");
			try {
				let e = await K(`/api/topic-reports/${encodeURIComponent(r.id)}/personal-overlay`, {});
				Uo(e) && await Ko(e, new AbortController().signal);
				let t = _r(await G(`/api/topic-reports/${encodeURIComponent(r.id)}?includePersonal=true`));
				i(t), W("내 노트와 연결했습니다.");
			} catch (e) {
				W(e instanceof Error ? e.message : "내 노트 연결에 실패했습니다.");
			} finally {
				ne("");
			}
		}
	}
	let Re = (0, d.useMemo)(() => {
		let e = Qo(me);
		return e ? t.filter((t) => Qo([
			Jo(t),
			Yo(t),
			t.topicKey,
			t.engine,
			t.engineDetail,
			Xo(t.generatedAt || t.date)
		].filter(Boolean).join(" ")).includes(e)) : t;
	}, [me, t]), Be = (0, d.useMemo)(() => {
		let e = (e) => String(e.generatedAt || e.date || ""), t = [...Re].sort((t, n) => e(n).localeCompare(e(t)));
		if (ge === "recent") return t.length ? [{
			key: `최근 리서치 ${Math.min(t.length, $o)}건`,
			rows: t.slice(0, $o)
		}] : [];
		let n = /* @__PURE__ */ new Map();
		for (let e of t) {
			let t = ge === "month" ? Zo(e.generatedAt || e.date) : Yo(e);
			n.has(t) || n.set(t, []), n.get(t)?.push(e);
		}
		return Array.from(n.entries()).map(([e, t]) => ({
			key: e,
			rows: t
		})).sort((t, n) => e(n.rows[0]).localeCompare(e(t.rows[0])));
	}, [Re, ge]), Ve = qo(r?.markdown || "", r ? Jo(r) : "딥 리서치"), He = bo(r?.marketStateResolution), Ue = (0, d.useCallback)((e) => {
		let t = e.source === "both" ? "포트폴리오·워치리스트" : e.source === "portfolio" ? "포트폴리오" : "워치리스트", n = `개인 맥락(hypothesis): ${e.ticker} · ${t}`;
		_((e) => {
			let t = e.split("\n").map((e) => e.trim()).filter(Boolean);
			return t.includes(n) ? e : [...t, n].join("\n").slice(0, 4e3);
		});
	}, []);
	if (c && !u) return /* @__PURE__ */ (0, f.jsx)("div", {
		className: "react-deep-research-route",
		"data-deep-research-route": !0,
		children: /* @__PURE__ */ (0, f.jsx)(Mo, {
			collectionId: c,
			onBack: () => es(),
			onStartResearch: (e) => {
				w(e), es();
			}
		})
	});
	if (o && !r && (D !== "recoverable-error" || L !== "report")) return /* @__PURE__ */ (0, f.jsx)("div", {
		className: "react-deep-research-route",
		"data-deep-research-route": !0,
		children: /* @__PURE__ */ (0, f.jsxs)("section", {
			className: "topicrpt-report-state",
			"data-qa": "dr-report-loading",
			role: "status",
			"aria-live": "polite",
			"aria-busy": "true",
			children: [
				/* @__PURE__ */ (0, f.jsx)("p", {
					className: "section-kicker",
					children: "DEEP RESEARCH"
				}),
				/* @__PURE__ */ (0, f.jsx)("h1", {
					tabIndex: -1,
					children: "저장된 리서치를 여는 중입니다"
				}),
				/* @__PURE__ */ (0, f.jsx)("p", { children: "보고서 본문과 함께 사용한 자료 목록을 불러오는 중입니다." })
			]
		})
	});
	if ((o || u) && !r && (u || D === "recoverable-error" && L === "report")) {
		let e = z === "topic_report_not_found" || z === "not_found";
		return /* @__PURE__ */ (0, f.jsx)("div", {
			className: "react-deep-research-route",
			"data-deep-research-route": !0,
			children: /* @__PURE__ */ (0, f.jsxs)("section", {
				className: "topicrpt-report-state is-error",
				"data-qa": e ? "dr-report-not-found" : "dr-report-error",
				role: "alert",
				"aria-live": "assertive",
				children: [
					/* @__PURE__ */ (0, f.jsx)("p", {
						className: "section-kicker",
						children: "DEEP RESEARCH"
					}),
					/* @__PURE__ */ (0, f.jsx)("h1", { children: e ? "저장된 리서치를 찾을 수 없습니다" : "리서치를 열 수 없습니다" }),
					/* @__PURE__ */ (0, f.jsx)("p", {
						"data-qa": e ? "dr-not-found" : void 0,
						children: F || "보고서 주소나 저장 데이터를 확인한 뒤 목록에서 다시 여세요."
					}),
					/* @__PURE__ */ (0, f.jsx)("button", {
						className: "btn",
						type: "button",
						"data-qa": "dr-report-return",
						onClick: Oe,
						children: "딥 리서치 목록으로 돌아가기"
					})
				]
			})
		});
	}
	if (r && D === "report") return /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "react-deep-research-route",
		"data-deep-research-route": !0,
		"data-qa": "dr-report",
		children: [
			F && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-error",
				"data-qa": "dr-error-report",
				children: F
			}),
			(r.mode === "fallback" || r.generation?.mode === "rules") && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-warning",
				"data-qa": "dr-degraded-rules",
				role: "status",
				children: "근거 부족을 확인한 규칙 기반 보고서입니다. 자료 공백과 반대 근거를 함께 확인하세요."
			}),
			/* @__PURE__ */ (0, f.jsxs)(Kn, {
				eyebrow: `DEEP RESEARCH${r.date ? ` · ${r.date}` : ""}`,
				title: Ve.title,
				meta: `${Jo(r)} · 뉴스 ${r.docCount || 0}건 · 내러티브 ${r.memoryCount || 0}건`,
				agentContext: {
					surface: "topic_report_reader",
					viewId: "topicrpt",
					reportKind: "topic_report",
					reportId: r.id || "",
					topic: Jo(r),
					marketState: He
				},
				breadcrumb: /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [/* @__PURE__ */ (0, f.jsx)("button", {
					type: "button",
					"data-qa": "dr-report-return",
					onClick: Oe,
					children: "딥 리서치"
				}), /* @__PURE__ */ (0, f.jsx)("span", { children: Ve.title })] }),
				onClose: Oe,
				actionSlot: /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [
					/* @__PURE__ */ (0, f.jsx)(_n, {
						title: "AI",
						children: /* @__PURE__ */ (0, f.jsx)(vn, {
							icon: "agent",
							onClick: () => nt({
								surface: "topic_report_reader",
								reportKind: "topic_report",
								reportId: r.id || "",
								topic: Jo(r),
								message: `${Ve.title}의 핵심 결론, 반대 근거, 더 발전시킬 분석 방향을 정리해줘.`,
								autoSubmit: !0
							}),
							children: "Agent에게 묻기"
						})
					}),
					/* @__PURE__ */ (0, f.jsx)(_n, {
						title: "노트",
						children: /* @__PURE__ */ (0, f.jsx)(vn, {
							icon: "link",
							"data-qa": "dr-overlay-generate",
							disabled: te === "overlay" || !r.id,
							onClick: Le,
							children: te === "overlay" ? "연결 중" : "내 노트와 연결"
						})
					}),
					/* @__PURE__ */ (0, f.jsxs)(_n, {
						title: "내보내기",
						children: [/* @__PURE__ */ (0, f.jsx)(vn, {
							icon: "notion",
							disabled: te === "notion",
							onClick: () => Ie("notion"),
							children: te === "notion" ? "내보내는 중" : "Notion으로 내보내기"
						}), /* @__PURE__ */ (0, f.jsx)(vn, {
							icon: "obsidian",
							disabled: te === "obsidian",
							onClick: () => Ie("obsidian"),
							children: te === "obsidian" ? "내보내는 중" : "Obsidian으로 내보내기"
						})]
					}),
					r.generation?.message && /* @__PURE__ */ (0, f.jsx)("p", {
						className: "react-reader-status",
						children: r.generation.message
					}),
					U && /* @__PURE__ */ (0, f.jsx)("p", {
						className: "react-reader-status",
						children: U
					})
				] }),
				noteIdentity: {
					id: Wn("topic", Jo(r)),
					noteType: "topic_review",
					title: Jo(r) ? `${Jo(r)} 리서치 노트` : "딥 리서치 노트",
					topic: Jo(r),
					label: Jo(r),
					reportKind: "topic_report",
					reportId: Jo(r),
					linkedReports: [Ve.title].filter(Boolean)
				},
				noteLinkedTitle: Ve.title,
				noteOverlay: hr(r.personalOverlay, r.canonicalRevision),
				children: [
					/* @__PURE__ */ (0, f.jsx)(Io, { resolution: r.marketStateResolution }),
					/* @__PURE__ */ (0, f.jsx)(Tn, { markdown: Ve.body || r.markdown || "" }),
					/* @__PURE__ */ (0, f.jsx)(Fo, { report: r })
				]
			})
		]
	});
	let We = D === "plan-loading" || D === "generation" || N || T, Ge = D === "recoverable-error" && F;
	return /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "react-deep-research-route",
		"data-deep-research-route": !0,
		children: [
			/* @__PURE__ */ (0, f.jsx)(qn, {
				eyebrow: "Deep Research",
				title: "딥 리서치",
				description: "투자 질문을 실행 계획으로 정리해 확인한 뒤, 정해진 자료 범위 안에서 근거를 구분한 보고서를 생성합니다.",
				actions: /* @__PURE__ */ (0, f.jsx)("button", {
					className: "btn",
					type: "button",
					onClick: () => void De(),
					disabled: N,
					children: N ? "불러오는 중" : "새로고침"
				})
			}),
			D === "readiness" && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-warning",
				"data-qa": "dr-readiness-loading",
				role: "status",
				children: "저장된 리서치와 자료 상태를 확인하는 중입니다."
			}),
			V && D === "recoverable-error" && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-error",
				"data-qa": `dr-readiness-${V}`,
				children: F
			}),
			Ge && /* @__PURE__ */ (0, f.jsxs)("div", {
				className: "react-dashboard-error topicrpt-recoverable-error",
				"data-qa": `dr-error-${L || "request"}`,
				role: "alert",
				children: [
					/* @__PURE__ */ (0, f.jsx)("strong", { children: "다시 시도할 수 있습니다" }),
					/* @__PURE__ */ (0, f.jsx)("span", {
						"data-qa": `dr-error-${(z || "request").replace(/_/g, "-")}`,
						"data-error-code": z || "request",
						children: F
					}),
					/* @__PURE__ */ (0, f.jsx)("p", { children: "입력한 질문과 컨텍스트, 마지막 계획은 유지됩니다." }),
					/* @__PURE__ */ (0, f.jsx)("button", {
						className: "btn",
						type: "button",
						onClick: () => {
							I(""), R(null), B(""), O(k ? "plan-review" : "draft");
						},
						children: "돌아가서 수정"
					})
				]
			}),
			D !== "plan-review" && D !== "generation" && /* @__PURE__ */ (0, f.jsxs)("form", {
				className: "input-panel topicrpt-form",
				onSubmit: ke,
				noValidate: !0,
				children: [
					/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "input-panel-header",
						children: [
							/* @__PURE__ */ (0, f.jsx)("span", {
								className: "section-kicker",
								children: "투자 질문"
							}),
							/* @__PURE__ */ (0, f.jsx)("h2", { children: "무엇을 투자 판단으로 확인하고 싶나요?" }),
							/* @__PURE__ */ (0, f.jsx)("p", { children: "질문은 1~500자로 입력하세요. 추가로 적는 조건은 내 생각(가설)로만 전달되며 외부 근거로 쓰이지 않습니다." })
						]
					}),
					/* @__PURE__ */ (0, f.jsxs)("label", {
						className: "field topicrpt-question-field",
						children: [
							/* @__PURE__ */ (0, f.jsx)("span", { children: "투자 질문" }),
							/* @__PURE__ */ (0, f.jsx)("textarea", {
								"data-qa": "dr-question",
								value: m,
								onChange: (e) => h(e.currentTarget.value),
								maxLength: 500,
								rows: 4,
								placeholder: "예: 미국 전력 수요 증가가 12개월 내 반도체 공급망과 관련 기업에 어떤 영향을 줄까?",
								required: !0,
								"aria-describedby": "dr-question-help"
							}),
							/* @__PURE__ */ (0, f.jsxs)("small", {
								id: "dr-question-help",
								children: [m.length, "/500"]
							})
						]
					}),
					/* @__PURE__ */ (0, f.jsxs)("details", {
						className: "topicrpt-advanced",
						"data-qa": "dr-advanced",
						open: !!(g.trim() || C),
						children: [
							/* @__PURE__ */ (0, f.jsxs)("summary", { children: ["분석 조건 추가 ", /* @__PURE__ */ (0, f.jsx)("em", { children: "(선택)" })] }),
							/* @__PURE__ */ (0, f.jsxs)("label", {
								className: "field topicrpt-context-field",
								children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "추가 조건" }), /* @__PURE__ */ (0, f.jsx)("textarea", {
									"data-qa": "dr-context",
									value: g,
									onChange: (e) => _(e.currentTarget.value),
									maxLength: 4e3,
									rows: 4,
									placeholder: "예: 보유 종목, 관심 지역, 확인할 기간 등. 이 내용은 내 생각(가설)로 표시됩니다."
								})]
							}),
							/* @__PURE__ */ (0, f.jsx)(sn, {
								mode: "deep-research",
								onReference: Ue
							}),
							/* @__PURE__ */ (0, f.jsx)(jo, {
								selectedRef: C,
								onSelectedRef: w,
								onBusyChange: E,
								onOpenDetail: (e) => {
									window.location.hash = Yn(e);
								},
								disabled: D === "plan-loading" || N
							}),
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "topicrpt-policy-row",
								children: [/* @__PURE__ */ (0, f.jsxs)("label", {
									className: "field topicrpt-policy-field",
									children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "시장 상태 배경" }), /* @__PURE__ */ (0, f.jsxs)("select", {
										value: v,
										onChange: (e) => y(e.currentTarget.value),
										children: [/* @__PURE__ */ (0, f.jsx)("option", {
											value: "include_current",
											children: "현재 상태 포함"
										}), /* @__PURE__ */ (0, f.jsx)("option", {
											value: "exclude",
											children: "제외"
										})]
									})]
								}), /* @__PURE__ */ (0, f.jsxs)("label", {
									className: "field topicrpt-policy-field",
									children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "시장 상태 범위" }), /* @__PURE__ */ (0, f.jsxs)("select", {
										value: b,
										onChange: (e) => S(e.currentTarget.value),
										children: [
											/* @__PURE__ */ (0, f.jsx)("option", {
												value: "AUTO",
												children: "자동"
											}),
											/* @__PURE__ */ (0, f.jsx)("option", {
												value: "GLOBAL",
												children: "글로벌"
											}),
											/* @__PURE__ */ (0, f.jsx)("option", {
												value: "US",
												children: "미국"
											}),
											/* @__PURE__ */ (0, f.jsx)("option", {
												value: "KR",
												children: "한국"
											})
										]
									})]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "topicrpt-action-row",
						children: [
							/* @__PURE__ */ (0, f.jsx)("span", {
								className: "topicrpt-policy-note",
								children: "심층 조사 · 최대 2라운드"
							}),
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "topicrpt-planner-choice",
								children: [/* @__PURE__ */ (0, f.jsx)("span", {
									id: "dr-planner-engine-label",
									children: "계획 작성"
								}), /* @__PURE__ */ (0, f.jsx)("div", {
									className: "segment",
									"data-qa": "dr-planner-engine",
									role: "group",
									"aria-labelledby": "dr-planner-engine-label",
									children: No.map((e) => /* @__PURE__ */ (0, f.jsx)("button", {
										type: "button",
										"aria-pressed": ae === e.value,
										disabled: We,
										"data-tooltip": e.hint,
										onClick: () => oe(e.value),
										children: e.label
									}, e.value))
								})]
							}),
							/* @__PURE__ */ (0, f.jsx)("button", {
								className: "btn btn--primary",
								type: "submit",
								"data-qa": "dr-preview",
								disabled: We,
								children: D === "plan-loading" ? ae === "rules" ? "계획 준비 중" : "AI가 계획을 쓰는 중" : "계획 미리보기"
							})
						]
					}),
					/* @__PURE__ */ (0, f.jsx)("input", {
						type: "hidden",
						value: we,
						"data-legacy-topic": Ce,
						readOnly: !0,
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ (0, f.jsx)("input", {
						type: "hidden",
						value: "true",
						readOnly: !0,
						"aria-hidden": "true"
					})
				]
			}),
			D === "plan-review" && k && /* @__PURE__ */ (0, f.jsx)(cs, {
				envelope: k,
				onContinue: je,
				onEdit: () => {
					O("draft"), le(!1), W("");
				},
				editing: se,
				revising: ue,
				replanning: fe,
				onReplan: () => void Me(""),
				onEditPlan: () => le(!0),
				onRevise: (e) => void Ne(e),
				onCancelEdit: () => le(!1),
				degradedConfirming: j,
				onConfirmDegraded: () => void Pe(),
				onCancelDegraded: () => M(!1)
			}),
			D === "generation" && /* @__PURE__ */ (0, f.jsxs)("section", {
				className: "input-panel topicrpt-generation-panel",
				"data-qa": "dr-generation",
				"aria-live": "polite",
				children: [
					/* @__PURE__ */ (0, f.jsx)("span", {
						className: "section-kicker",
						children: "생성 중"
					}),
					/* @__PURE__ */ (0, f.jsx)("h2", { children: "승인한 계획을 실행하는 중입니다" }),
					/* @__PURE__ */ (0, f.jsx)("p", {
						"data-qa": "dr-generation-status",
						children: U || "작업 상태를 확인하는 중입니다."
					})
				]
			}),
			U && D !== "generation" && D !== "report" && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-warning",
				"data-qa": "dr-status",
				role: "status",
				children: U
			}),
			/* @__PURE__ */ (0, f.jsxs)("section", {
				className: "find-bar",
				"aria-label": "저장된 리서치 검색",
				children: [
					/* @__PURE__ */ (0, f.jsx)("input", {
						className: "find-bar__search",
						type: "search",
						value: me,
						onChange: (e) => he(e.currentTarget.value),
						placeholder: "주제·질문·모델 검색",
						"aria-label": "저장된 리서치 검색"
					}),
					/* @__PURE__ */ (0, f.jsxs)("label", {
						className: "find-bar__field",
						children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "보기" }), /* @__PURE__ */ (0, f.jsxs)("select", {
							"aria-label": "저장된 리서치 보기 방식",
							value: ge,
							onChange: (e) => _e(e.currentTarget.value),
							children: [
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "recent",
									children: "최근"
								}),
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "topic",
									children: "주제별"
								}),
								/* @__PURE__ */ (0, f.jsx)("option", {
									value: "month",
									children: "월별"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, f.jsx)("button", {
						className: "btn btn--text find-bar__reset",
						type: "button",
						onClick: () => {
							he(""), _e("recent");
						},
						children: "초기화"
					})
				]
			}),
			/* @__PURE__ */ (0, f.jsxs)("section", {
				className: "react-analysis-feed",
				"aria-label": "저장된 리서치",
				children: [/* @__PURE__ */ (0, f.jsxs)("div", {
					className: "react-section-heading",
					children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("p", {
						className: "section-kicker",
						children: "Saved Research"
					}), /* @__PURE__ */ (0, f.jsx)("h2", {
						ref: be,
						tabIndex: -1,
						children: "저장된 리서치"
					})] }), /* @__PURE__ */ (0, f.jsx)("span", {
						"aria-live": "polite",
						children: `${Re.length}건${me ? " · 검색 결과" : ""}`
					})]
				}), Be.length ? Be.map((e) => /* @__PURE__ */ (0, f.jsxs)("section", {
					className: "report-feed-group",
					children: [/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "report-feed-group-head",
						children: [/* @__PURE__ */ (0, f.jsx)("span", {
							className: "report-feed-group-name",
							children: e.key
						}), /* @__PURE__ */ (0, f.jsx)("span", {
							className: "report-feed-group-meta",
							children: fn(e.rows.length, e.rows[0]?.generatedAt || e.rows[0]?.date)
						})]
					}), /* @__PURE__ */ (0, f.jsx)("div", {
						className: "report-feed-group-cards",
						children: e.rows.map((e) => {
							let t = te === `delete-${e.id}`;
							return /* @__PURE__ */ (0, f.jsxs)("div", {
								className: "report-feed-card-wrap",
								children: [/* @__PURE__ */ (0, f.jsxs)("button", {
									className: "report-feed-card is-topic",
									type: "button",
									"data-report-id": e.id,
									onClick: () => {
										e.id && (xe.current = e.id, es(e.id));
									},
									children: [
										/* @__PURE__ */ (0, f.jsx)("span", {
											className: "report-feed-card-meta",
											children: (e.engine || e.mode) && /* @__PURE__ */ (0, f.jsxs)("span", {
												className: "report-feed-badge",
												children: [e.engine || String(e.mode).toUpperCase(), pn(e.engine, e.engineDetail) && /* @__PURE__ */ (0, f.jsx)("em", { children: pn(e.engine, e.engineDetail) })]
											})
										}),
										/* @__PURE__ */ (0, f.jsx)("strong", { children: Jo(e) }),
										/* @__PURE__ */ (0, f.jsxs)("span", {
											className: "report-feed-card-foot",
											children: ["생성일 ", Xo(e.date || e.generatedAt)]
										})
									]
								}), /* @__PURE__ */ (0, f.jsx)("button", {
									type: "button",
									className: "report-feed-card-delete",
									disabled: t,
									onClick: () => void Fe(e),
									"aria-label": `${Jo(e)} 삭제`,
									"data-tooltip": "삭제",
									"data-tooltip-pos": "bottom",
									children: /* @__PURE__ */ (0, f.jsx)("svg", {
										width: "13",
										height: "13",
										viewBox: "0 0 16 16",
										fill: "none",
										stroke: "currentColor",
										strokeWidth: "1.4",
										strokeLinecap: "round",
										strokeLinejoin: "round",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, f.jsx)("path", { d: "M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" })
									})
								})]
							}, e.id || `${Jo(e)}-${e.date}`);
						})
					})]
				}, e.key)) : /* @__PURE__ */ (0, f.jsx)("div", {
					className: "report-feed-empty",
					"data-qa": "dr-report-list-empty",
					children: me ? "검색 결과가 없습니다." : "저장된 딥 리서치가 없습니다. 질문을 입력해 실행 계획을 미리보세요."
				})]
			})
		]
	});
}
//#endregion
//#region src/islands/MarketStateDashboard.tsx
var us = {
	high: "높음",
	medium: "보통",
	low: "낮음"
}, ds = [
	"overall",
	"us",
	"kr",
	"europe",
	"jp"
], fs = {
	overall: "종합",
	us: "US",
	kr: "KR",
	europe: "EU",
	jp: "JP"
};
function ps(e) {
	let t = [], n = 0;
	for (let r = 0; r < e.length; r += 1) {
		let i = e[r];
		if (i !== "." && i !== "!" && i !== "?" && i !== "。") continue;
		let a = e[r + 1];
		i !== "。" && (a && !/\s/.test(a) || /\d/.test(e[r - 1] || "") && /\d/.test(a || "")) || (t.push(e.slice(n, r + 1).trim()), n = r + 1);
	}
	let r = e.slice(n).trim();
	return r && t.push(r), t.filter(Boolean);
}
function ms(e) {
	let t = String(e || "").replace(/\s+/g, " ").trim(), n = ps(t);
	return {
		lead: n[0] || t,
		support: n.slice(1).join(" ")
	};
}
function hs(e) {
	if (!e) return "";
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? e : t.toLocaleString("ko-KR", {
		dateStyle: "medium",
		timeStyle: "short"
	});
}
function gs(e) {
	let t = String(e.directionLabel || "").trim();
	if (t === "중립") return "neutral";
	if (t === "혼재" || t === "변동성") return "warning";
	if (t === "도움" || t === "부담 완화") return "positive";
	if (t === "부담") return "negative";
	let n = `${e.directionLabel || ""} ${e.directionTone || ""}`.toLowerCase();
	return /neutral|중립/.test(n) ? "neutral" : /mixed|conflicted|혼재|변동성/.test(n) ? "warning" : /support|positive|완화|호재|긍정|지지|강화|도움/.test(n) ? "positive" : /risk|negative|부담|악화|위험|하방/.test(n) ? "negative" : "neutral";
}
function _s(e) {
	let t = String(e.directionLabel || "").trim();
	return !t || t === "도움" ? "긍정 요인" : t === "부담" ? "부담 가중" : t === "변동성" ? "변동성 증가" : t;
}
function vs(e) {
	let t = (e) => String(e || "").replace(/marketTape와 macroSnapshot가 비어 있어 가격 검증이 약하다\.?/g, "가격·거시 데이터가 아직 충분하지 않아 뉴스 흐름을 숫자로 검증하기 어렵습니다.").replace(/marketTape/g, "가격 데이터").replace(/macroSnapshot/g, "거시 데이터").trim();
	if (typeof e != "string") return {
		title: t(e.title || ""),
		summary: t(e.summary || ""),
		sourceRefs: e.sourceRefs || []
	};
	let n = t(e.trim()), r = n.match(/['"]title['"]:\s*['"]([^'"]+)['"]/)?.[1] || "", i = n.match(/['"]summary['"]:\s*['"]([^'"]+)['"]/)?.[1] || "", a = (n.match(/['"]sourceRefs['"]:\s*\[([^\]]*)\]/)?.[1] || "").split(",").map((e) => e.replace(/['"]/g, "").trim()).filter(Boolean);
	return r || i ? {
		title: r,
		summary: i,
		sourceRefs: a
	} : {
		title: "",
		summary: n,
		sourceRefs: []
	};
}
function ys({ items: e }) {
	return /* @__PURE__ */ (0, f.jsx)("ul", {
		className: "market-state-check-list",
		children: e.slice(0, 5).map((e, t) => {
			let n = vs(e);
			return /* @__PURE__ */ (0, f.jsxs)("li", {
				className: "market-state-check-item",
				children: [
					n.title && /* @__PURE__ */ (0, f.jsx)("strong", { children: n.title }),
					n.summary && /* @__PURE__ */ (0, f.jsx)("span", { children: n.summary }),
					n.sourceRefs.length ? /* @__PURE__ */ (0, f.jsx)("small", { children: n.sourceRefs.join(" · ") }) : null
				]
			}, `${n.title || n.summary}-${t}`);
		})
	});
}
function bs({ driver: e }) {
	let t = us[e.confidence] || e.confidence || "보통", n = e.interpretation, r = e.marketImpact || e.interpretation, i = e.evidenceSummary || e.whyItMatters || e.rationale, a = e.nextMemoryCheck || e.whatToWatch || e.nextCheckpoint, o = [
		i ? {
			label: "근거 요약",
			value: i
		} : null,
		r && r !== n && r !== i ? {
			label: "시장 영향",
			value: r
		} : null,
		a ? {
			label: "다음 확인",
			value: a
		} : null
	].filter(Boolean);
	return /* @__PURE__ */ (0, f.jsxs)("article", {
		className: `market-driver-card momentum-${e.momentum || "stable"}`,
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "market-driver-top",
				children: [/* @__PURE__ */ (0, f.jsx)("h3", { children: e.title }), /* @__PURE__ */ (0, f.jsx)("div", {
					className: "market-driver-chip-row",
					children: e.directionLabel && /* @__PURE__ */ (0, f.jsx)("span", {
						className: `market-direction-chip direction-${gs(e)}`,
						children: _s(e)
					})
				})]
			}),
			n && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "market-driver-summary",
				children: n
			}),
			o.length ? /* @__PURE__ */ (0, f.jsxs)("details", {
				className: "market-driver-details",
				children: [/* @__PURE__ */ (0, f.jsx)("summary", { children: "근거 보기" }), /* @__PURE__ */ (0, f.jsx)("dl", {
					className: "market-driver-detail-list",
					children: o.map((e) => /* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: e.label }), /* @__PURE__ */ (0, f.jsx)("dd", { children: e.value })] }, e.label))
				})]
			}) : null,
			/* @__PURE__ */ (0, f.jsxs)("footer", { children: [/* @__PURE__ */ (0, f.jsxs)("small", { children: [
				"확신도 ",
				t,
				e.confidencePct ? ` · ${e.confidencePct}%` : ""
			] }), /* @__PURE__ */ (0, f.jsx)("button", {
				type: "button",
				className: "btn btn--icon agent-action agent-ask-btn",
				"data-tooltip": "Agent에게 묻기",
				"aria-label": "Agent에게 묻기",
				onClick: () => nt({ message: e.askAgentPrompt }),
				children: /* @__PURE__ */ (0, f.jsx)("span", {
					className: "agent-logo-slot",
					"aria-hidden": "true"
				})
			})] })
		]
	});
}
var xs = {
	current: "현재",
	stale: "업데이트 필요",
	fallback: "참고용 대체 상태",
	empty: "상태 없음"
}, Ss = {
	snapshot: "Market State 스냅샷",
	state_fallback: "기존 중기 내러티브 참고값",
	none: "사용 가능한 상태 없음"
}, Cs = {
	within_window: "최신 자료 기준과 생성 시각이 유효 범위 안에 있습니다.",
	new_relevant_evidence: "스냅샷 이후 새 외부 자료가 들어왔습니다. 갱신 전 판단은 현재 투자 자세로 사용하지 않습니다.",
	age_exceeded: "생성 후 72시간이 지나 최신성이 만료됐습니다.",
	update_failed: "최근 업데이트가 실패해 현재 상태로 확정할 수 없습니다.",
	invalid_as_of: "기준 시각이 없거나 올바르지 않아 현재 상태로 사용할 수 없습니다.",
	future_as_of: "기준 시각이 현재보다 미래여서 검증이 필요합니다.",
	missing_input_watermark: "입력 자료 기준점이 없어 최신성을 확인할 수 없습니다.",
	state_fallback: "정식 스냅샷이 없어 기존 중기 내러티브를 참고용으로만 보여줍니다.",
	no_state: "아직 생성된 시장 상태가 없습니다."
};
function ws(e) {
	if (!e?.asOf || !e.resolvedAt) return "계산 불가";
	let t = new Date(e.asOf).getTime(), n = new Date(e.resolvedAt).getTime();
	if (!Number.isFinite(t) || !Number.isFinite(n) || n < t) return "계산 불가";
	let r = Math.floor((n - t) / 6e4);
	if (r < 60) return `${r}분`;
	let i = Math.floor(r / 60);
	return i < 48 ? `${i}시간` : `${Math.floor(i / 24)}일 ${i % 24}시간`;
}
function Ts({ stateRef: e }) {
	let t = e?.freshnessReason === "age_exceeded" ? "만료" : e ? xs[e.status] : "확인 불가";
	return /* @__PURE__ */ (0, f.jsxs)("dl", {
		className: "market-state-meta",
		"aria-label": "시장 상태 기준 정보",
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "상태" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: t })] }),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				"data-qa": "market-state-asof",
				children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "기준 시각" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: hs(e?.asOf || void 0) || "없음" })]
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "경과" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: ws(e) })] }),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				"data-qa": "market-state-source",
				children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "출처" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: e ? Ss[e.sourceKind] : "응답 검증 실패" })]
			}),
			e ? /* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("dt", { children: "범위" }), /* @__PURE__ */ (0, f.jsx)("dd", { children: e.scope })] }) : null
		]
	});
}
function Es({ stateRef: e }) {
	let t = e.freshnessReason === "age_exceeded", n = e.freshnessReason === "new_relevant_evidence" ? "새 외부 자료가 들어왔습니다." : Cs[e.freshnessReason] || "최신성을 다시 확인해야 합니다.", r = e.freshnessReason === "new_relevant_evidence" ? hs(e.relevantEvidenceWatermark || void 0) : "";
	return /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "market-state-stale-notice",
		"data-qa": "market-state-stale-notice",
		role: "status",
		"aria-live": "polite",
		children: [
			/* @__PURE__ */ (0, f.jsx)("strong", { children: t ? "최신성 만료" : "업데이트 필요" }),
			/* @__PURE__ */ (0, f.jsxs)("span", { children: [n, " 이전 스냅샷을 표시 중입니다."] }),
			r ? /* @__PURE__ */ (0, f.jsxs)("time", {
				dateTime: e.relevantEvidenceWatermark || void 0,
				children: ["새 자료 기준 ", r]
			}) : null
		]
	});
}
function Ds({ state: e, stateRef: t, error: n, drivers: r }) {
	let i = e === "fallback" ? "참고용 내러티브만 있습니다" : "아직 생성된 시장 상태가 없습니다", a = n ? `시장 상태 응답을 사용할 수 없습니다: ${n}` : Cs[t?.freshnessReason || ""] || "현재 상태를 검증할 수 없습니다. 업데이트 후 다시 확인하세요.";
	return /* @__PURE__ */ (0, f.jsxs)("section", {
		className: `market-state-gap state-${e}`,
		role: "status",
		children: [
			/* @__PURE__ */ (0, f.jsx)("span", { children: xs[e] }),
			/* @__PURE__ */ (0, f.jsx)("h3", { children: i }),
			/* @__PURE__ */ (0, f.jsx)("p", { children: a }),
			e === "fallback" && r.length ? /* @__PURE__ */ (0, f.jsxs)("p", { children: [
				"기존 내러티브 ",
				r.length,
				"건은 탐색 단서일 뿐, 현재 투자 판단으로 사용하지 마세요."
			] }) : null
		]
	});
}
function Os({ payload: e, selectedMarket: t = "overall", loading: n = !1, updating: r = !1, updateDisabled: i = !1, error: a = "", onSelectMarket: o, onUpdate: s, onReload: c }) {
	let l = yo(e), u = l?.status || "empty", d = e?.marketViews || {}, { isSelected: p } = hn(), m = ds.filter((e) => e === "overall" || !!d[e] && p(e)), h = m.includes(t) ? t : "overall", g = h === "overall" ? d.overall || e : d[h] || e, _ = g?.drivers ?? [], v = g?.plainConclusion || g?.summary || "", y = g?.reasonSummary || g?.sourceSummary || g?.stance || "", b = ms(y), x = u === "current" || u === "stale", S = g?.briefs?.length ? g.briefs : [
		{
			label: "현재 판단",
			value: v
		},
		{
			label: "시장 해석",
			value: y
		},
		{
			label: "행동 가이드",
			value: g?.actionGuide?.action || g?.stance || ""
		},
		{
			label: "다음 확인",
			value: g?.actionGuide?.timing || (g?.watchItems || []).slice(0, 3).join("; ")
		}
	].filter((e) => e.value);
	return /* @__PURE__ */ (0, f.jsxs)("section", {
		className: `market-state-surface market-state-surface-${u}`,
		"data-qa": `market-state-${u}`,
		children: [
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "market-state-head",
				children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("p", {
					className: "section-kicker",
					children: "Market State"
				}), /* @__PURE__ */ (0, f.jsx)("h2", { children: g?.title || e?.title || "현재 중기 시장 상황" })] }), /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "market-state-head-actions",
					children: [/* @__PURE__ */ (0, f.jsx)("button", {
						className: "btn btn--primary",
						type: "button",
						"data-qa": "market-state-update",
						onClick: s,
						disabled: !s || i || r || n,
						children: r ? "업데이트 중" : u === "current" ? "시장 메모리 업데이트" : "시장 상태 업데이트"
					}), /* @__PURE__ */ (0, f.jsx)("button", {
						className: "btn",
						type: "button",
						onClick: c,
						disabled: !c || n || r,
						children: n ? "불러오는 중…" : "새로고침"
					})]
				})]
			}),
			/* @__PURE__ */ (0, f.jsx)(Ts, { stateRef: l }),
			u === "stale" && l ? /* @__PURE__ */ (0, f.jsx)(Es, { stateRef: l }) : null,
			x && m.length > 1 ? /* @__PURE__ */ (0, f.jsx)("div", {
				className: "segment market-scope-tabs",
				role: "group",
				"aria-label": "시장 범위 선택",
				children: m.map((e) => /* @__PURE__ */ (0, f.jsx)("button", {
					type: "button",
					"aria-pressed": h === e,
					onClick: () => o?.(e),
					children: fs[e]
				}, e))
			}) : null,
			x ? /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [
				u === "current" ? /* @__PURE__ */ (0, f.jsx)("p", {
					className: "market-state-current-note",
					children: Cs[l?.freshnessReason || "within_window"]
				}) : null,
				/* @__PURE__ */ (0, f.jsxs)("div", {
					className: "market-state-overview",
					"data-qa": "market-state-posture",
					children: [y ? /* @__PURE__ */ (0, f.jsxs)("section", {
						className: "market-state-interpretation",
						children: [
							/* @__PURE__ */ (0, f.jsx)("span", { children: "시장 해석" }),
							/* @__PURE__ */ (0, f.jsx)("strong", { children: b.lead }),
							b.support ? /* @__PURE__ */ (0, f.jsx)("p", { children: b.support }) : null
						]
					}) : null, g?.actionGuide || g?.posture || v ? /* @__PURE__ */ (0, f.jsxs)("section", {
						className: `market-state-posture posture-${g?.posture?.tone || "watch"}`,
						children: [
							/* @__PURE__ */ (0, f.jsx)("span", { children: "판단 및 투자 행동" }),
							v && /* @__PURE__ */ (0, f.jsx)("p", {
								className: "market-state-summary",
								children: v
							}),
							g?.actionGuide ? /* @__PURE__ */ (0, f.jsxs)("div", {
								className: "market-state-action-body",
								children: [
									/* @__PURE__ */ (0, f.jsx)("strong", { children: g.actionGuide.headline }),
									/* @__PURE__ */ (0, f.jsx)("p", { children: g.actionGuide.action }),
									g.actionGuide.timing && /* @__PURE__ */ (0, f.jsx)("small", { children: g.actionGuide.timing })
								]
							}) : g?.posture ? /* @__PURE__ */ (0, f.jsxs)("div", {
								className: "market-state-action-body",
								children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: g.posture.label }), /* @__PURE__ */ (0, f.jsx)("p", { children: g.posture.summary })]
							}) : null,
							g?.watchItems?.length || S[3]?.value ? /* @__PURE__ */ (0, f.jsxs)("div", {
								className: "market-state-action-list",
								children: [/* @__PURE__ */ (0, f.jsx)("b", { children: "다음 확인" }), g?.watchItems?.length ? /* @__PURE__ */ (0, f.jsx)("ul", { children: g.watchItems.slice(0, 3).map((e) => /* @__PURE__ */ (0, f.jsx)("li", { children: e }, e)) }) : /* @__PURE__ */ (0, f.jsx)("p", { children: S[3]?.value })]
							}) : null
						]
					}) : null]
				}),
				/* @__PURE__ */ (0, f.jsx)("div", {
					className: "market-state-drivers",
					"data-qa": "market-state-drivers",
					children: _.map((e, t) => /* @__PURE__ */ (0, f.jsx)(bs, { driver: e }, e.id || t))
				}),
				g && ((g.counterEvidence?.length || 0) > 0 || (g.uncertainties?.length || 0) > 0) ? /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "market-state-checks",
					"aria-label": "반대 근거와 불확실성",
					children: [g.counterEvidence?.length ? /* @__PURE__ */ (0, f.jsxs)("section", {
						"data-qa": "market-state-counter-evidence",
						children: [/* @__PURE__ */ (0, f.jsx)("h3", { children: "반대 근거" }), /* @__PURE__ */ (0, f.jsx)(ys, { items: g.counterEvidence })]
					}) : null, g.uncertainties?.length ? /* @__PURE__ */ (0, f.jsxs)("section", {
						"data-qa": "market-state-uncertainties",
						children: [/* @__PURE__ */ (0, f.jsx)("h3", { children: "불확실성" }), /* @__PURE__ */ (0, f.jsx)(ys, { items: g.uncertainties })]
					}) : null]
				}) : null,
				g?.watchItems?.length || S[3]?.value ? /* @__PURE__ */ (0, f.jsxs)("section", {
					className: "market-state-next-checks",
					"data-qa": "market-state-next-checks",
					children: [/* @__PURE__ */ (0, f.jsx)("h3", { children: "다음 확인" }), /* @__PURE__ */ (0, f.jsx)("ul", { children: (g?.watchItems || [S[3]?.value]).filter(Boolean).slice(0, 5).map((e) => /* @__PURE__ */ (0, f.jsx)("li", { children: e }, e)) })]
				}) : null
			] }) : /* @__PURE__ */ (0, f.jsx)(Ds, {
				state: u,
				stateRef: l,
				error: a,
				drivers: _
			}),
			x && e?.sourceRefs?.length ? /* @__PURE__ */ (0, f.jsxs)("details", {
				className: "market-state-sources",
				children: [/* @__PURE__ */ (0, f.jsxs)("summary", { children: [
					"사용한 출처 ",
					e.sourceRefs.length,
					"개"
				] }), /* @__PURE__ */ (0, f.jsx)("ul", { children: e.sourceRefs.slice(0, 8).map((e, t) => /* @__PURE__ */ (0, f.jsxs)("li", { children: [e.url ? /* @__PURE__ */ (0, f.jsx)("a", {
					href: e.url,
					target: "_blank",
					rel: "noreferrer",
					children: e.title || e.source || e.url
				}) : /* @__PURE__ */ (0, f.jsx)("span", { children: e.title || e.source || e.id }), e.source && /* @__PURE__ */ (0, f.jsx)("small", { children: e.source })] }, e.id || t)) })]
			}) : null
		]
	});
}
function ks({ onUpdate: e, updating: t = !1, updateDisabled: n = !1, onContext: r } = {}) {
	let [i, a] = (0, d.useState)(null), [o, s] = (0, d.useState)("overall"), [c, l] = (0, d.useState)(""), [u, p] = (0, d.useState)(!1), m = (0, d.useCallback)(async () => {
		p(!0), l("");
		try {
			let e = await G("/api/memory/state-dashboard?limit=5");
			a(e);
			let t = bo(e);
			gn().updateAgentContext?.({
				surface: "market_state",
				viewId: "memory",
				reportKind: "",
				reportId: "",
				marketState: t
			}), r?.(t);
		} catch (e) {
			a(null), l(e instanceof Error ? e.message : String(e)), r?.(null);
		} finally {
			p(!1);
		}
	}, [r]);
	return (0, d.useEffect)(() => {
		m();
	}, [m]), (0, d.useEffect)(() => {
		gn().applyAgentBranding?.();
	}, [i]), /* @__PURE__ */ (0, f.jsx)(Os, {
		payload: i,
		selectedMarket: o,
		loading: u,
		updating: t,
		updateDisabled: n,
		error: c,
		onSelectMarket: s,
		onUpdate: e,
		onReload: m
	});
}
//#endregion
//#region src/app/marketMemoryJobResume.ts
var As = "folio.marketMemory.activeJob.v1", js = /^job_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/, Ms = /* @__PURE__ */ new Set([
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
]), Ns = "market_memory_update", Ps = "LLM CLI 시장 메모리 업데이트";
function Fs() {
	try {
		return typeof window > "u" ? null : window.localStorage;
	} catch {
		return null;
	}
}
function Is(e) {
	return typeof e == "string" && js.test(e);
}
function Ls(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e)) return !1;
	let n = e;
	return n.id === t && Ms.has(n.status);
}
function Rs(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) return !1;
	let t = e;
	return !Is(t.id) || !Ms.has(t.status) || !U(t.status) ? !1 : t.taskType === Ns || t.taskType === void 0 && t.label === Ps;
}
function zs(e = Fs()) {
	try {
		e?.removeItem(As);
	} catch {}
}
function Bs(e = Fs()) {
	let t = null;
	try {
		t = e?.getItem("folio.marketMemory.activeJob.v1") ?? null;
	} catch {
		return null;
	}
	return t ? Is(t) ? t : (zs(e), null) : null;
}
function Vs(e, t = Fs()) {
	if (!Is(e) || !t) return !1;
	try {
		return t.setItem(As, e), t.getItem(As) === e;
	} catch {
		return !1;
	}
}
async function Hs(e, t = Fs()) {
	let n = Bs(t);
	if (!n) return { kind: "none" };
	let r;
	try {
		r = await e(n);
	} catch {
		return {
			kind: "unavailable",
			id: n
		};
	}
	return Ls(r, n) ? U(r.status) ? {
		kind: "active",
		job: r
	} : (zs(t), {
		kind: "terminal",
		job: r
	}) : (zs(t), { kind: "invalid" });
}
async function Us(e, t = Fs()) {
	let n;
	try {
		n = await e();
	} catch {
		return { kind: "none" };
	}
	if (!Array.isArray(n)) return { kind: "invalid" };
	let r = n.find(Rs);
	return r ? (Vs(r.id, t), {
		kind: "active",
		job: r
	}) : { kind: "none" };
}
//#endregion
//#region src/app/MarketMemoryRoute.tsx
function Ws() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function Gs(e) {
	return e.snapshot?.headline ? e.message || `시장 상태 스냅샷을 저장했습니다: ${e.snapshot.headline}` : e.snapshotId || e.title ? e.message || `시장 상태 스냅샷을 저장했습니다${e.title ? `: ${e.title}` : ""}` : `${e.message || (e.ok ? "시장 내러티브를 정리했습니다." : "시장 내러티브 정리가 완료되었습니다.")}${Number.isFinite(Number(e.savedCount)) ? ` 저장 ${e.savedCount}건` : ""}${e.estimatedInputTokens ? ` · 입력 약 ${e.estimatedInputTokens} tokens` : ""}${e.rawEntryCount === void 0 ? "" : ` · 응답 ${e.rawEntryCount}건 · 제외 ${e.droppedCount || 0}건`}`;
}
function Ks(e) {
	let t = e;
	return !!(t?.id && t.status);
}
async function qs() {
	return K("/api/memory/update", { date: Ws() });
}
function Js() {
	let [e, t] = (0, d.useState)(0), n = un("marketMemory"), [r, i] = (0, d.useState)(!1), [a, o] = (0, d.useState)(""), [s, c] = (0, d.useState)(""), [l, u] = (0, d.useState)(() => {
		let e = Bs();
		return e ? {
			id: e,
			status: "running"
		} : null;
	}), p = (0, d.useRef)(null), m = (0, d.useCallback)((e) => {
		q("market-memory", {
			surface: "market_state",
			viewId: "memory",
			reportKind: "",
			reportId: "",
			marketState: e
		});
	}, []);
	function h(e) {
		if (e.ok === !1) throw Error(e.message || e.status || "시장 메모리 업데이트에 실패했습니다.");
		zs(), o(`시장 메모리를 업데이트했습니다. ${Gs(e)}`), u(null), t((e) => e + 1);
	}
	(0, d.useEffect)(() => {
		let e = !0;
		return (async () => {
			let t = await Hs((e) => G(`/api/jobs/${encodeURIComponent(e)}`));
			if (t.kind === "none" && (t = await Us(() => G("/api/jobs"))), e) if (t.kind === "active") {
				u(t.job), i(!0), o("이전에 시작한 서버 작업에 자동으로 다시 연결했습니다.");
				try {
					await g(t.job);
				} catch (t) {
					if (!e) return;
					t instanceof ot ? (zs(), u(null), c(t.message), o("")) : t instanceof DOMException && t.name === "AbortError" || (c(t instanceof Error ? t.message : "작업 상태 확인에 실패했습니다."), o(""));
				} finally {
					e && i(!1);
				}
			} else t.kind === "terminal" ? (u(null), t.job.status === "done" ? h(t.job.result || {}) : c(t.job.message || t.job.error || "이전 시장 메모리 작업이 종료되었습니다.")) : t.kind === "unavailable" ? (u({
				id: t.id,
				status: "running"
			}), o("저장된 시장 메모리 작업의 상태를 다시 확인해야 합니다.")) : t.kind === "invalid" && (u(null), c("저장된 시장 메모리 작업 정보를 확인할 수 없어 안전하게 제거했습니다."));
		})(), () => {
			e = !1, p.current?.abort();
		};
	}, []);
	async function g(e) {
		p.current?.abort();
		let t = new AbortController();
		p.current = t;
		try {
			h((await dt(e, { signal: t.signal })).result || {});
		} finally {
			p.current === t && (p.current = null);
		}
	}
	async function _() {
		i(!0), c(""), o("AI Agent가 단기 뉴스와 기존 중기 메모리를 업데이트하는 중입니다.");
		try {
			o("시장 메모리와 화면용 시장 상태를 함께 갱신하는 중입니다.");
			let e = await qs();
			Ks(e) ? (Vs(e.id), u(e), await g(e)) : h(e);
		} catch (e) {
			e instanceof ot ? (zs(), u(null), c(e.message), o("")) : e instanceof DOMException && e.name === "AbortError" || (c(e instanceof Error ? e.message : "시장 메모리 업데이트에 실패했습니다."), o(""));
		} finally {
			i(!1);
		}
	}
	async function v() {
		if (l) {
			i(!0), c(""), o("같은 시장 메모리 작업의 상태를 다시 확인하는 중입니다.");
			try {
				await g(l);
			} catch (e) {
				e instanceof ot ? (zs(), u(null), c(e.message), o("")) : e instanceof DOMException && e.name === "AbortError" || (c(e instanceof Error ? e.message : "작업 상태 확인에 실패했습니다."), o(""));
			} finally {
				i(!1);
			}
		}
	}
	return /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "react-market-memory-route",
		"data-market-memory-route": !0,
		children: [
			/* @__PURE__ */ (0, f.jsx)(qn, {
				eyebrow: "Market Memory",
				title: "시장 내러티브",
				description: "단기 뉴스 흐름을 중기 시장 상황으로 압축해 투자 판단의 배경으로 유지합니다."
			}),
			s && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-error",
				children: s
			}),
			a && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-warning",
				children: a
			}),
			l && !r ? /* @__PURE__ */ (0, f.jsxs)("div", {
				className: "react-dashboard-warning market-state-job-resume",
				"data-qa": "market-state-job-still-running",
				role: "status",
				children: [/* @__PURE__ */ (0, f.jsxs)("span", { children: [
					"작업 ",
					l.id,
					" · 서버에서 계속 실행 중"
				] }), /* @__PURE__ */ (0, f.jsx)("button", {
					className: "btn",
					type: "button",
					"data-qa": "market-state-job-resume",
					onClick: () => void v(),
					children: "같은 작업 다시 확인"
				})]
			}) : null,
			/* @__PURE__ */ (0, f.jsx)(sn, { mode: "market-memory" }),
			/* @__PURE__ */ (0, f.jsx)("section", {
				className: "market-state-dashboard react-market-memory-dashboard",
				"aria-label": "현재 중기 시장 상황",
				children: /* @__PURE__ */ (0, f.jsx)(ks, {
					onUpdate: _,
					updating: r,
					updateDisabled: !!l,
					onContext: m
				}, `${e}:${n}`)
			})
		]
	});
}
//#endregion
//#region src/app/portfolio/HoldingsTable.tsx
function Ys({ positions: e, onChange: t }) {
	let [n, r] = (0, d.useState)({});
	function i(n, r, i) {
		t(e.map((e, t) => t === n ? {
			...e,
			[r]: i
		} : e));
	}
	function a(n) {
		t(e.filter((e, t) => t !== n)), r((e) => {
			let t = {};
			for (let [r, i] of Object.entries(e)) {
				let e = Number(r);
				e < n ? t[e] = i : e > n && (t[e - 1] = i);
			}
			return t;
		});
	}
	async function o(n, i) {
		let a = i.trim();
		if (!a) {
			r((e) => ({
				...e,
				[n]: ""
			}));
			return;
		}
		try {
			let i = await G(`/api/company/resolve?q=${encodeURIComponent(a)}&limit=1`);
			if (i.status !== "confident" || !i.match) {
				r((e) => ({
					...e,
					[n]: ""
				}));
				return;
			}
			let o = i.match;
			r((e) => ({
				...e,
				[n]: o.name
			}));
			let s = {};
			o.ticker && o.ticker !== a && (s.ticker = o.ticker), o.market && !e[n]?.market && (s.market = o.market), Object.keys(s).length && t(e.map((e, t) => t === n ? {
				...e,
				...s
			} : e));
		} catch {
			r((e) => ({
				...e,
				[n]: ""
			}));
		}
	}
	return /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "portfolio-holdings-table-wrap",
		children: [/* @__PURE__ */ (0, f.jsxs)("table", {
			className: "portfolio-holdings-table",
			children: [/* @__PURE__ */ (0, f.jsx)("thead", { children: /* @__PURE__ */ (0, f.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, f.jsx)("th", { children: "종목" }),
				/* @__PURE__ */ (0, f.jsx)("th", { children: "수량" }),
				/* @__PURE__ */ (0, f.jsx)("th", { children: "평균단가" }),
				/* @__PURE__ */ (0, f.jsx)("th", { children: "시장" }),
				/* @__PURE__ */ (0, f.jsx)("th", { children: /* @__PURE__ */ (0, f.jsx)("span", {
					className: "sr-only",
					children: "삭제"
				}) })
			] }) }), /* @__PURE__ */ (0, f.jsx)("tbody", { children: e.map((e, t) => /* @__PURE__ */ (0, f.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, f.jsxs)("td", { children: [/* @__PURE__ */ (0, f.jsx)("input", {
					"aria-label": `${t + 1}번 종목`,
					value: e.ticker,
					onChange: (e) => i(t, "ticker", e.currentTarget.value.toUpperCase()),
					onBlur: (e) => void o(t, e.currentTarget.value),
					placeholder: "NVDA / 삼성전자"
				}), n[t] && /* @__PURE__ */ (0, f.jsx)("small", {
					className: "holdings-resolved",
					children: n[t]
				})] }),
				/* @__PURE__ */ (0, f.jsx)("td", { children: /* @__PURE__ */ (0, f.jsx)("input", {
					"aria-label": `${e.ticker || t + 1} 수량`,
					value: e.quantity,
					onChange: (e) => i(t, "quantity", e.currentTarget.value),
					inputMode: "decimal"
				}) }),
				/* @__PURE__ */ (0, f.jsx)("td", { children: /* @__PURE__ */ (0, f.jsx)("input", {
					"aria-label": `${e.ticker || t + 1} 평균단가`,
					value: e.averagePrice ?? "",
					onChange: (e) => i(t, "averagePrice", e.currentTarget.value),
					inputMode: "decimal"
				}) }),
				/* @__PURE__ */ (0, f.jsx)("td", { children: /* @__PURE__ */ (0, f.jsx)("input", {
					"aria-label": `${e.ticker || t + 1} 시장`,
					value: e.market || "",
					onChange: (e) => i(t, "market", e.currentTarget.value.toUpperCase()),
					placeholder: "US / KR / EUROPE / JP"
				}) }),
				/* @__PURE__ */ (0, f.jsx)("td", { children: /* @__PURE__ */ (0, f.jsx)("button", {
					type: "button",
					className: "btn",
					onClick: () => a(t),
					children: "삭제"
				}) })
			] }, t)) })]
		}), !e.length && /* @__PURE__ */ (0, f.jsx)("p", {
			className: "cockpit-empty",
			children: "등록된 보유 종목이 없습니다. 직접 추가하거나 증권사 화면에서 가져오세요."
		})]
	});
}
//#endregion
//#region src/app/agentWorkspace/openScopedThread.ts
function Xs(e) {
	window.dispatchEvent(new CustomEvent("folio:open-agent-thread", { detail: e })), nt({});
}
//#endregion
//#region src/app/portfolio/ConsultationEntry.tsx
function Zs({ tickers: e }) {
	return /* @__PURE__ */ (0, f.jsx)("button", {
		className: "btn btn--primary",
		type: "button",
		onClick: () => Xs({
			title: "포트폴리오 대화",
			scope: {
				kind: "portfolio",
				id: "current",
				tickers: e
			},
			initialMessage: "현재 Portfolio와 최근 뉴스·브리핑·시장 내러티브를 연결해 우선 확인할 변화와 반대 근거를 검토해줘."
		}),
		children: "포트폴리오 짚어보기"
	});
}
//#endregion
//#region src/app/PortfolioRoute.tsx
function Qs() {
	let [e, t] = (0, d.useState)(null), [n, r] = (0, d.useState)([]), [i, a] = (0, d.useState)(!1), [o, s] = (0, d.useState)(""), [c, l] = (0, d.useState)("");
	async function u() {
		let e = await G("/api/portfolio");
		t(e), r(e.positions || []);
	}
	(0, d.useEffect)(() => {
		u().catch((e) => l(e instanceof Error ? e.message : "Portfolio를 불러오지 못했습니다.")), q("portfolio", {
			surface: "portfolio",
			viewId: "portfolio",
			reportKind: "portfolio",
			reportId: "current"
		});
	}, []);
	async function p() {
		if (e) {
			a(!0), l(""), s("");
			try {
				let i = await K("/api/portfolio", {
					expectedRevision: e.revision,
					positions: n,
					cash: e.cash || []
				});
				t(i), r(i.positions || []), s(`revision ${i.revision}로 저장했습니다.`);
			} catch (e) {
				e instanceof H && e.status === 409 ? (await u(), l("다른 화면에서 Portfolio가 먼저 수정되어 최신본을 다시 불러왔습니다. 변경을 확인한 뒤 다시 저장하세요.")) : l(e instanceof Error ? e.message : "Portfolio 저장에 실패했습니다.");
			} finally {
				a(!1);
			}
		}
	}
	return /* @__PURE__ */ (0, f.jsxs)("main", {
		className: "portfolio-route",
		children: [/* @__PURE__ */ (0, f.jsx)(qn, {
			eyebrow: "Portfolio",
			title: "보유 종목과 리서치 연결",
			description: "입력 부담을 줄이고, 보유 포지션에서 시작해 뉴스·브리핑·시장 내러티브를 함께 검토합니다."
		}), /* @__PURE__ */ (0, f.jsxs)("div", {
			className: "portfolio-route-grid",
			children: [/* @__PURE__ */ (0, f.jsxs)("section", {
				className: "cockpit-panel portfolio-holdings",
				"aria-labelledby": "portfolio-holdings-title",
				children: [
					/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "cockpit-panel__head",
						children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "HOLDINGS" }), /* @__PURE__ */ (0, f.jsx)("h2", {
							id: "portfolio-holdings-title",
							children: "현재 보유 종목"
						})] }), /* @__PURE__ */ (0, f.jsxs)("b", { children: ["버전 ", e?.revision ?? 0] })]
					}),
					/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "portfolio-actions",
						children: [/* @__PURE__ */ (0, f.jsx)("button", {
							className: "btn",
							type: "button",
							onClick: () => r([...n, {
								ticker: "",
								quantity: "",
								averagePrice: ""
							}]),
							children: "종목 추가"
						}), /* @__PURE__ */ (0, f.jsx)("button", {
							className: "btn btn--primary",
							type: "button",
							disabled: i || !e,
							onClick: p,
							children: i ? "저장 중" : "Portfolio 저장"
						})]
					}),
					/* @__PURE__ */ (0, f.jsx)(Ys, {
						positions: n,
						onChange: r
					}),
					o && /* @__PURE__ */ (0, f.jsx)("p", {
						className: "react-reader-status",
						children: o
					}),
					c && /* @__PURE__ */ (0, f.jsx)("p", {
						className: "react-dashboard-error",
						role: "alert",
						children: c
					})
				]
			}), /* @__PURE__ */ (0, f.jsxs)("aside", {
				className: "cockpit-panel portfolio-research",
				"aria-labelledby": "portfolio-research-title",
				children: [
					/* @__PURE__ */ (0, f.jsx)("div", {
						className: "cockpit-panel__head",
						children: /* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "RESEARCH" }), /* @__PURE__ */ (0, f.jsx)("h2", {
							id: "portfolio-research-title",
							children: "Agent와 검토"
						})] })
					}),
					/* @__PURE__ */ (0, f.jsx)("p", { children: "현재 보유 종목을 기준으로 최근 뉴스, 브리핑, 시장 내러티브의 변화와 반대 근거를 함께 살펴봅니다." }),
					/* @__PURE__ */ (0, f.jsx)(Zs, { tickers: n.map((e) => e.ticker).filter(Boolean) }),
					/* @__PURE__ */ (0, f.jsx)("small", { children: "대화 내용은 보고서 근거로 사용되지 않습니다." })
				]
			})]
		})]
	});
}
//#endregion
//#region src/app/agentWorkspace/ThreadList.tsx
var $s = {
	watchlist: "관심 종목",
	portfolio: "포트폴리오",
	briefing: "브리핑",
	company_analysis: "기업 분석",
	topic_report: "딥 리서치",
	market_memory: "시장 내러티브",
	change: "변화"
};
function ec(e) {
	if (!e || e.kind === "general") return "";
	let t = $s[e.kind] || e.kind, n = e.tickers && e.tickers[0] || e.id || "";
	return n ? `${n}` : t;
}
function tc(e) {
	if (!e) return "";
	let t = Date.parse(e);
	if (Number.isNaN(t)) return "";
	let n = Math.floor((Date.now() - t) / 6e4);
	if (n < 1) return "방금";
	if (n < 60) return `${n}분 전`;
	let r = Math.floor(n / 60);
	if (r < 24) return `${r}시간 전`;
	let i = Math.floor(r / 24);
	return i < 7 ? `${i}일 전` : new Date(t).toLocaleDateString();
}
function nc({ activeId: e, refreshKey: t, onSelect: n, onDeleted: r }) {
	let [i, a] = (0, d.useState)([]), [o, s] = (0, d.useState)(""), [c, l] = (0, d.useState)(""), [u, p] = (0, d.useState)(""), [m, h] = (0, d.useState)(""), g = (0, d.useCallback)(async () => {
		try {
			let e = await G("/api/agent/threads?limit=60");
			a(e.items || []), s("");
		} catch (e) {
			s(e instanceof Error ? e.message : "대화 목록을 불러오지 못했습니다.");
		}
	}, []);
	(0, d.useEffect)(() => {
		g();
	}, [g, t]);
	async function _(e) {
		if (window.confirm(`"${e.title}" 대화를 삭제할까요? 삭제 후 복구할 수 없습니다.`)) {
			l(e.id);
			try {
				await se(`/api/agent/threads/${encodeURIComponent(e.id)}`, { confirm: !0 }), r(e.id), await g();
			} catch (e) {
				s(e instanceof Error ? e.message : "삭제하지 못했습니다.");
			} finally {
				l("");
			}
		}
	}
	async function v(e) {
		l(e.id);
		try {
			await K(`/api/agent/threads/${encodeURIComponent(e.id)}/archive`, {}), await g();
		} catch (e) {
			s(e instanceof Error ? e.message : "보관하지 못했습니다.");
		} finally {
			l("");
		}
	}
	async function y(e) {
		let t = m.trim();
		if (p(""), !(!t || t === e.title)) {
			l(e.id);
			try {
				await K(`/api/agent/threads/${encodeURIComponent(e.id)}`, { title: t }), await g();
			} catch (e) {
				s(e instanceof Error ? e.message : "제목을 바꾸지 못했습니다.");
			} finally {
				l("");
			}
		}
	}
	let b = i.filter((e) => e.status !== "archived"), x = i.length - b.length;
	return /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "agent-threads",
		"aria-label": "저장된 대화",
		children: [
			/* @__PURE__ */ (0, f.jsxs)("p", {
				className: "agent-threads__summary",
				children: [/* @__PURE__ */ (0, f.jsx)("span", { children: b.length ? `대화 ${b.length}개` : "저장된 대화 없음" }), x > 0 && /* @__PURE__ */ (0, f.jsxs)("span", { children: [
					"보관 ",
					x,
					"개"
				] })]
			}),
			o && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "agent-threads__error",
				children: o
			}),
			!b.length && !o && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "agent-threads__empty",
				children: "질문을 보내면 대화가 여기에 저장됩니다."
			}),
			/* @__PURE__ */ (0, f.jsx)("ul", { children: b.map((t) => {
				let r = [
					ec(t.scope),
					t.messageCount ? `${t.messageCount}개` : "",
					tc(t.updatedAt)
				].filter(Boolean).join(" · ");
				return /* @__PURE__ */ (0, f.jsxs)("li", {
					"data-active": t.id === e ? "true" : void 0,
					children: [u === t.id ? /* @__PURE__ */ (0, f.jsx)("form", {
						className: "agent-threads__rename",
						onSubmit: (e) => {
							e.preventDefault(), y(t);
						},
						children: /* @__PURE__ */ (0, f.jsx)("input", {
							value: m,
							autoFocus: !0,
							"aria-label": "대화 제목",
							onChange: (e) => h(e.currentTarget.value),
							onBlur: () => void y(t)
						})
					}) : /* @__PURE__ */ (0, f.jsxs)("button", {
						type: "button",
						className: "agent-threads__open",
						"aria-current": t.id === e ? "true" : void 0,
						onClick: () => n(t.id),
						children: [/* @__PURE__ */ (0, f.jsx)("span", {
							className: "agent-threads__title",
							children: t.title
						}), /* @__PURE__ */ (0, f.jsx)("span", {
							className: "agent-threads__meta",
							children: r || "비어 있음"
						})]
					}), /* @__PURE__ */ (0, f.jsxs)("span", {
						className: "agent-threads__actions",
						children: [
							/* @__PURE__ */ (0, f.jsx)("button", {
								type: "button",
								className: "btn btn--icon btn--sm",
								disabled: c === t.id,
								"aria-label": `${t.title} 제목 바꾸기`,
								"data-tooltip": "제목",
								onClick: () => {
									p(t.id), h(t.title);
								},
								children: /* @__PURE__ */ (0, f.jsx)("svg", {
									viewBox: "0 0 16 16",
									width: "15",
									height: "15",
									"aria-hidden": "true",
									fill: "none",
									stroke: "currentColor",
									strokeWidth: "1.4",
									children: /* @__PURE__ */ (0, f.jsx)("path", {
										d: "M11 2.5l2.5 2.5-8 8H3v-2.5z",
										strokeLinejoin: "round"
									})
								})
							}),
							/* @__PURE__ */ (0, f.jsx)("button", {
								type: "button",
								className: "btn btn--icon btn--sm",
								disabled: c === t.id,
								"aria-label": `${t.title} 보관하기`,
								"data-tooltip": "보관",
								onClick: () => void v(t),
								children: /* @__PURE__ */ (0, f.jsx)("svg", {
									viewBox: "0 0 16 16",
									width: "15",
									height: "15",
									"aria-hidden": "true",
									fill: "none",
									stroke: "currentColor",
									strokeWidth: "1.4",
									children: /* @__PURE__ */ (0, f.jsx)("path", {
										d: "M2 4.5h12M3.5 4.5v8h9v-8M6.5 7.5h3",
										strokeLinecap: "round"
									})
								})
							}),
							/* @__PURE__ */ (0, f.jsx)("button", {
								type: "button",
								className: "btn btn--icon btn--sm",
								disabled: c === t.id,
								"aria-label": `${t.title} 삭제하기`,
								"data-tooltip": "삭제",
								onClick: () => void _(t),
								children: /* @__PURE__ */ (0, f.jsx)("svg", {
									viewBox: "0 0 16 16",
									width: "15",
									height: "15",
									"aria-hidden": "true",
									fill: "none",
									stroke: "currentColor",
									strokeWidth: "1.4",
									children: /* @__PURE__ */ (0, f.jsx)("path", {
										d: "M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5",
										strokeLinecap: "round",
										strokeLinejoin: "round"
									})
								})
							})
						]
					})]
				}, t.id);
			}) })
		]
	});
}
//#endregion
//#region src/app/agentWorkspace/useDockThreads.ts
var rc = "folio.agentThreads.migrated.v1";
function ic(e, t) {
	return {
		id: e.id || `restored-${t}`,
		role: e.role === "assistant" ? "assistant" : "user",
		text: String(e.content || ""),
		createdAt: e.createdAt
	};
}
function ac(e) {
	let [t, n] = (0, d.useState)(""), [r, i] = (0, d.useState)(null), [a, o] = (0, d.useState)(0), [s, c] = (0, d.useState)(null), l = (0, d.useRef)(!1), u = (0, d.useCallback)(() => o((e) => e + 1), []), f = (0, d.useCallback)(async (e = {}) => {
		let t = await K("/api/agent/threads", {
			title: e.title || "새 대화",
			scope: e.scope || { kind: "general" }
		});
		return n(t.id), c(t.scope || null), i(null), u(), t;
	}, [u]), p = (0, d.useCallback)(async (t) => {
		let r = await G(`/api/agent/threads/${encodeURIComponent(t)}`);
		n(r.id), c(r.scope || null), i(null);
		let a = r.messages || [];
		return a.length ? a.map(ic) : [{
			...e,
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		}];
	}, [e]), m = (0, d.useCallback)(async () => {
		if (l.current || (l.current = !0, window.localStorage.getItem(rc))) return;
		let e = xt().filter((e) => e.text && !mt(e));
		if (!e.length) {
			window.localStorage.setItem(rc, (/* @__PURE__ */ new Date()).toISOString());
			return;
		}
		try {
			let t = await K("/api/agent/threads", {
				title: "이전 대화",
				scope: { kind: "general" },
				importMessages: e.map((e) => ({
					role: e.role,
					content: e.text,
					createdAt: e.createdAt
				}))
			});
			if ((t.messageCount || 0) < e.length) {
				await se(`/api/agent/threads/${encodeURIComponent(t.id)}`, { confirm: !0 }).catch(() => {}), l.current = !1;
				return;
			}
			window.localStorage.setItem(rc, (/* @__PURE__ */ new Date()).toISOString()), Ct(), window.localStorage.removeItem(ft), u();
		} catch {
			l.current = !1;
		}
	}, [u]), h = (0, d.useCallback)(async (e) => {
		try {
			let t = (await G(`/api/agent/threads/${encodeURIComponent(e)}`)).messages || [];
			for (let e = t.length - 1; e >= 0; --e) if (t[e].role === "assistant") return String(t[e].content || "");
		} catch {}
		return "";
	}, []);
	return (0, d.useEffect)(() => {
		m();
	}, [m]), {
		threadId: t,
		setThreadId: n,
		scope: s,
		setScope: c,
		pending: r,
		setPending: i,
		refreshKey: a,
		bumpList: u,
		createThread: f,
		openThread: p,
		latestReply: h
	};
}
//#endregion
//#region src/app/ReactAgentDock.tsx
var oc = /* @__PURE__ */ new Set([
	"codex",
	"claude",
	"antigravity"
]), sc = {
	id: "welcome",
	role: "assistant",
	text: "현재 화면에 대해 물어보세요. 보고서 수정이나 발전 요청은 작업으로 전환해 처리합니다.",
	variant: "welcome",
	createdAt: (/* @__PURE__ */ new Date()).toISOString()
}, cc = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19.503 0H4.496A4.496 4.496 0 000 4.496v15.007A4.496 4.496 0 004.496 24h15.007A4.496 4.496 0 0024 19.503V4.496A4.496 4.496 0 0019.503 0z\" fill=\"#fff\"></path><path d=\"M9.064 3.344a4.578 4.578 0 012.285-.312c1 .115 1.891.54 2.673 1.275.01.01.024.017.037.021a.09.09 0 00.043 0 4.55 4.55 0 013.046.275l.047.022.116.057a4.581 4.581 0 012.188 2.399c.209.51.313 1.041.315 1.595a4.24 4.24 0 01-.134 1.223.123.123 0 00.03.115c.594.607.988 1.33 1.183 2.17.289 1.425-.007 2.71-.887 3.854l-.136.166a4.548 4.548 0 01-2.201 1.388.123.123 0 00-.081.076c-.191.551-.383 1.023-.74 1.494-.9 1.187-2.222 1.846-3.711 1.838-1.187-.006-2.239-.44-3.157-1.302a.107.107 0 00-.105-.024c-.388.125-.78.143-1.204.138a4.441 4.441 0 01-1.945-.466 4.544 4.544 0 01-1.61-1.335c-.152-.202-.303-.392-.414-.617a5.81 5.81 0 01-.37-.961 4.582 4.582 0 01-.014-2.298.124.124 0 00.006-.056.085.085 0 00-.027-.048 4.467 4.467 0 01-1.034-1.651 3.896 3.896 0 01-.251-1.192 5.189 5.189 0 01.141-1.6c.337-1.112.982-1.985 1.933-2.618.212-.141.413-.251.601-.33.215-.089.43-.164.646-.227a.098.098 0 00.065-.066 4.51 4.51 0 01.829-1.615 4.535 4.535 0 011.837-1.388zm3.482 10.565a.637.637 0 000 1.272h3.636a.637.637 0 100-1.272h-3.636zM8.462 9.23a.637.637 0 00-1.106.631l1.272 2.224-1.266 2.136a.636.636 0 101.095.649l1.454-2.455a.636.636 0 00.005-.64L8.462 9.23z\" fill=\"url(#folio-react-codex-gradient)\"></path><defs><linearGradient gradientUnits=\"userSpaceOnUse\" id=\"folio-react-codex-gradient\" x1=\"12\" x2=\"12\" y1=\"3\" y2=\"21\"><stop stop-color=\"#B1A7FF\"></stop><stop offset=\".5\" stop-color=\"#7A9DFF\"></stop><stop offset=\"1\" stop-color=\"#3941FF\"></stop></linearGradient></defs></svg>", lc = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M9.064 3.344a4.578 4.578 0 012.285-.312c1 .115 1.891.54 2.673 1.275.01.01.024.017.037.021a.09.09 0 00.043 0 4.55 4.55 0 013.046.275l.047.022.116.057a4.581 4.581 0 012.188 2.399c.209.51.313 1.041.315 1.595a4.24 4.24 0 01-.134 1.223.123.123 0 00.03.115c.594.607.988 1.33 1.183 2.17.289 1.425-.007 2.71-.887 3.854l-.136.166a4.548 4.548 0 01-2.201 1.388.123.123 0 00-.081.076c-.191.551-.383 1.023-.74 1.494-.9 1.187-2.222 1.846-3.711 1.838-1.187-.006-2.239-.44-3.157-1.302a.107.107 0 00-.105-.024c-.388.125-.78.143-1.204.138a4.441 4.441 0 01-1.945-.466 4.544 4.544 0 01-1.61-1.335c-.152-.202-.303-.392-.414-.617a5.81 5.81 0 01-.37-.961 4.582 4.582 0 01-.014-2.298.124.124 0 00.006-.056.085.085 0 00-.027-.048 4.467 4.467 0 01-1.034-1.651 3.896 3.896 0 01-.251-1.192 5.189 5.189 0 01.141-1.6c.337-1.112.982-1.985 1.933-2.618.212-.141.413-.251.601-.33.215-.089.43-.164.646-.227a.098.098 0 00.065-.066 4.51 4.51 0 01.829-1.615 4.535 4.535 0 011.837-1.388zm3.482 10.565a.637.637 0 000 1.272h3.636a.637.637 0 100-1.272h-3.636zM8.462 9.23a.637.637 0 00-1.106.631l1.272 2.224-1.266 2.136a.636.636 0 101.095.649l1.454-2.455a.636.636 0 00.005-.64L8.462 9.23z\" fill=\"currentColor\"/></svg>", uc = "M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z", dc = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${uc}" fill="#D97757" fill-rule="nonzero"></path></svg>`, Q = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${uc}" fill="currentColor" fill-rule="nonzero"></path></svg>`, fc = "M21.751 22.607c1.34 1.005 3.35.335 1.508-1.508C17.73 15.74 18.904 1 12.037 1 5.17 1 6.342 15.74.815 21.1c-2.01 2.009.167 2.511 1.507 1.506 5.192-3.517 4.857-9.714 9.715-9.714 4.857 0 4.522 6.197 9.714 9.715z", pc = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${fc}" fill="url(#folio-react-antigravity-gradient)"></path><defs><linearGradient id="folio-react-antigravity-gradient" x1="5" x2="19" y1="22" y2="2" gradientUnits="userSpaceOnUse"><stop stop-color="#3186FF"></stop><stop offset=".42" stop-color="#34A853"></stop><stop offset=".72" stop-color="#FBBC04"></stop><stop offset="1" stop-color="#EA4335"></stop></linearGradient></defs></svg>`, mc = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${fc}" fill="currentColor"></path></svg>`, hc = "<svg viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M9 3c.4 3.9 3.1 6.6 7 7-3.9.4-6.6 3.1-7 7-.4-3.9-3.1-6.6-7-7 3.9-.4 6.6-3.1 7-7z\"/><path d=\"M17.8 13c.25 2.4 1.85 4 4.2 4.25-2.35.25-3.95 1.85-4.2 4.25-.25-2.4-1.85-4-4.2-4.25 2.35-.25 3.95-1.85 4.2-4.25z\" opacity=\".7\"/></svg>", gc = {
	codex: {
		label: "Codex",
		color: "#3941ff",
		logo: cc,
		monoLogo: lc
	},
	claude: {
		label: "Claude",
		color: "#d97757",
		logo: dc,
		monoLogo: Q
	},
	antigravity: {
		label: "Antigravity",
		color: "#3186ff",
		logo: pc,
		monoLogo: mc
	},
	default: {
		label: "Folio Agent",
		color: "#c79a45",
		logo: hc,
		monoLogo: hc
	}
};
function _c() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function vc(e) {
	return (e ? new Date(e) : /* @__PURE__ */ new Date()).toLocaleTimeString("ko-KR", {
		hour: "2-digit",
		minute: "2-digit"
	});
}
function yc(e) {
	return e === "high" ? "높음" : e === "low" ? "낮음" : "중간";
}
function bc(e) {
	return `${Math.max(1, Math.round((Date.now() - e) / 1e3))}초`;
}
var xc = [
	"surface",
	"viewId",
	"reportKind",
	"reportId",
	"marketScope",
	"selectedText",
	"visibleSection",
	"portfolioLinked"
];
function Sc(e) {
	if (!e) return {};
	let t = {};
	for (let n of xc) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
	return t;
}
function Cc(e) {
	if (!e) return {};
	let t = Object.prototype.hasOwnProperty.call(e, "collectionId"), n = Object.prototype.hasOwnProperty.call(e, "collectionRevision");
	if (!t || !n) return {};
	let r = e.collectionId, i = e.collectionRevision;
	return r === null && i === null ? {
		collectionId: null,
		collectionRevision: null
	} : typeof r == "string" && r.trim().length > 0 && typeof i == "number" && Number.isInteger(i) && i >= 1 ? {
		collectionId: r,
		collectionRevision: i
	} : {};
}
function wc(e) {
	let t = { ...e };
	return delete t.collectionId, delete t.collectionRevision, t;
}
function Tc(e, t) {
	return e.ownerSurface === t ? e : {
		ownerSurface: t,
		patch: {}
	};
}
function Ec(e, t, n) {
	return {
		ownerSurface: t,
		patch: {
			...Tc(e, t).patch,
			...n,
			surface: String(n.surface || t)
		}
	};
}
function Dc(e, t, n, r = {}) {
	let i = Tc(t, n);
	return {
		...Sc(e),
		...wc(i.patch),
		...wc(r),
		...Cc(e)
	};
}
function Oc(e) {
	let t = e?.provider && oc.has(e.provider) ? e.provider : e?.selectedAdapter || "";
	return e?.adapters?.find((e) => e.id === t) || null;
}
function kc(e) {
	return gc[e?.provider && oc.has(e.provider) ? e.provider : e?.selectedAdapter || ""] || gc.default;
}
function Ac(e) {
	return e?.modelChoices || [];
}
function jc(e) {
	let t = Ac(e);
	return t.length ? t.some((t) => t.value === e?.model) ? String(e?.model || "") : t[0].value : "";
}
function Mc({ surface: e, open: t, onOpen: n, onClose: r }) {
	let [i, a] = (0, d.useState)(null), [o, s] = (0, d.useState)(null), [c, l] = (0, d.useState)([sc]), [u, p] = (0, d.useState)(!1), m = ac(sc), h = ec(m.scope || void 0), [g, y] = (0, d.useState)(""), [b, x] = (0, d.useState)(""), [S, C] = (0, d.useState)("medium"), [w, T] = (0, d.useState)(!1), [E, D] = (0, d.useState)(""), O = (0, d.useRef)(null), k = (0, d.useRef)({
		ownerSurface: e,
		patch: {}
	}), A = (0, d.useRef)(/* @__PURE__ */ new Map());
	(0, d.useEffect)(() => () => {
		for (let e of A.current.values()) e.abort();
		A.current.clear();
	}, []);
	let j = (0, d.useCallback)((e, t = !1) => {
		let n = Oc(e);
		a(e), x((e) => {
			let r = jc(n);
			return t && Ac(n).some((t) => t.value === e) ? e : r;
		});
	}, []), M = (0, d.useCallback)(async (e = !1) => {
		let t = await G(`/api/agent-bridge/settings${e ? "?refresh=true" : ""}`);
		return j(t, !0), t;
	}, [j]), N = (0, d.useCallback)(async (e) => {
		try {
			let t = e?.provider && oc.has(e.provider) ? e.provider : "", n = t ? `?adapter=${encodeURIComponent(t)}` : "";
			s(await G(`/api/agent-bridge/preflight${n}`));
		} catch (e) {
			s({
				ok: !1,
				checks: [{
					id: "preflight",
					label: "Agent Preflight",
					ok: !1,
					severity: "error",
					message: e instanceof Error ? e.message : "Agent 준비 상태를 확인하지 못했습니다."
				}]
			});
		}
	}, []);
	(0, d.useEffect)(() => {
		let e = !0;
		return G("/api/agent-bridge/settings").then((t) => {
			e && (j(t), N(t));
		}).catch((t) => {
			e && D(t instanceof Error ? t.message : "Agent 설정을 불러오지 못했습니다.");
		}), () => {
			e = !1;
		};
	}, [j, N]), (0, d.useEffect)(() => {
		O.current && (O.current.scrollTop = O.current.scrollHeight);
	}, [c, t]), (0, d.useEffect)(() => {
		k.current = Tc(k.current, e);
	}, [e]), (0, d.useEffect)(() => {
		let e = (e) => {
			let t = e.detail;
			t ? (j(t), N(t)) : M().then((e) => N(e)).catch((e) => D(e instanceof Error ? e.message : "Agent 설정을 불러오지 못했습니다."));
		};
		return window.addEventListener("folio:agent-settings-updated", e), () => window.removeEventListener("folio:agent-settings-updated", e);
	}, [
		j,
		M,
		N
	]);
	let P = Oc(i), F = kc(i), I = Ac(P), L = (0, d.useMemo)(() => ({ "--react-agent-accent": F.color }), [F.color]), R = (o?.checks || []).filter((e) => !e.ok), z = (0, d.useCallback)(async (t, n = {}) => {
		let r = t.trim();
		if (!r || w) return;
		k.current = Tc(k.current, e);
		let i = Dc(window.FolioAgent?.currentContext, k.current, e, n), a = _c(), o = Date.now(), s = new Date(o).toISOString(), c = P?.label || F.label, u = b || P?.model || "model";
		l((e) => [
			...e,
			{
				id: _c(),
				role: "user",
				text: r,
				createdAt: s
			},
			{
				id: a,
				role: "assistant",
				text: "",
				pending: !0,
				runState: "pending",
				runTitle: `${c} 세션 시작`,
				runMeta: `${u} · ${yc(S)} · on-request`,
				createdAt: s
			}
		]), y(""), T(!0), D("");
		let d = null;
		try {
			let e = m.threadId || (await m.createThread({
				title: m.pending?.title || r.slice(0, 40),
				scope: m.pending?.scope
			})).id, t = await K(`/api/agent/threads/${encodeURIComponent(e)}/messages`, {
				message: r,
				operationId: _c(),
				context: i,
				options: {
					model: b,
					effort: S
				}
			});
			d = new AbortController(), st(A.current, a, d);
			let n = await ut(t.job, { signal: d.signal });
			ct(A.current, a, d);
			let s = {
				...n.result || {},
				reply: await m.latestReply(e)
			}, f = await Me(s);
			m.bumpList(), l((e) => e.map((e) => e.id === a ? {
				...e,
				text: s.reply || n.message || "Agent가 응답을 반환하지 않았습니다.",
				notice: [s.notice, f.notice].filter(Boolean).join(" "),
				proposal: f.proposal,
				proposalStatus: f.proposalStatus,
				pending: !1,
				runState: "done",
				runTitle: `${c} 응답`,
				runMeta: `${u} · ${yc(S)} · ${bc(o)}`
			} : e));
		} catch (e) {
			if (d && ct(A.current, a, d), e instanceof at) {
				l((t) => t.map((t) => t.id === a ? {
					...t,
					text: e.message,
					pending: !1,
					runState: "still-running",
					runTitle: `${c} 계속 실행 중`,
					runMeta: `${u} · ${yc(S)} · ${bc(o)}`,
					jobId: e.job.id
				} : t));
				return;
			}
			let t = e instanceof Error ? e.message : "Agent 요청에 실패했습니다.";
			D(t), l((e) => e.map((e) => e.id === a ? {
				...e,
				text: t,
				pending: !1,
				runState: "error",
				runTitle: `${c} 오류`,
				runMeta: `${u} · ${yc(S)}`
			} : e));
		} finally {
			T(!1);
		}
	}, [
		P?.label,
		P?.model,
		w,
		S,
		F.label,
		b,
		e
	]);
	async function B(e, t) {
		let n = new AbortController();
		st(A.current, e, n), l((t) => t.map((t) => t.id === e ? {
			...t,
			pending: !0,
			runState: "pending",
			runTitle: "Agent 상태 다시 확인 중"
		} : t));
		try {
			let r = await ut(await G(`/api/jobs/${encodeURIComponent(t)}`, { signal: n.signal }), { signal: n.signal }), i = r.result || {}, a = await Me(i);
			l((t) => t.map((t) => t.id === e ? {
				...t,
				text: i.reply || r.message || "Agent가 응답을 반환하지 않았습니다.",
				notice: [i.notice, a.notice].filter(Boolean).join(" "),
				proposal: a.proposal,
				proposalStatus: a.proposalStatus,
				pending: !1,
				runState: "done",
				runTitle: "Agent 응답",
				jobId: void 0
			} : t));
		} catch (t) {
			t instanceof at ? l((n) => n.map((n) => n.id === e ? {
				...n,
				text: t.message,
				pending: !1,
				runState: "still-running",
				runTitle: "Agent 계속 실행 중",
				jobId: t.job.id
			} : n)) : t instanceof DOMException && t.name === "AbortError" || l((n) => n.map((n) => n.id === e ? {
				...n,
				text: t instanceof Error ? t.message : "Agent 상태 확인에 실패했습니다.",
				pending: !1,
				runState: "error",
				runTitle: "Agent 오류"
			} : n));
		} finally {
			ct(A.current, e, n);
		}
	}
	(0, d.useEffect)(() => {
		let t = (t) => {
			let { message: n, prompt: r, autoSubmit: i, ...a } = t.detail || {};
			k.current = Ec(k.current, e, a);
			let o = String(n || r || "");
			o && (i ? z(o, a) : y(o));
		};
		return window.addEventListener("folio:react-agent-request", t), () => window.removeEventListener("folio:react-agent-request", t);
	}, [z, e]), (0, d.useEffect)(() => {
		async function e(e) {
			let t = e.detail || {};
			t.scope && (m.setThreadId(""), m.setPending({
				title: t.title,
				scope: t.scope
			}), l([{
				...sc,
				createdAt: (/* @__PURE__ */ new Date()).toISOString()
			}]), p(!1), t.initialMessage && y(t.initialMessage));
		}
		return window.addEventListener("folio:open-agent-thread", e), () => window.removeEventListener("folio:open-agent-thread", e);
	}, [m]);
	async function V(e) {
		e.preventDefault(), await z(g);
	}
	function ee() {
		l([{
			...sc,
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		}]), y(""), D(""), m.setThreadId(""), m.setPending(null), p(!1);
	}
	async function H(e) {
		D("");
		try {
			l(await m.openThread(e)), p(!1);
		} catch (e) {
			D(e instanceof Error ? e.message : "대화를 불러오지 못했습니다.");
		}
	}
	function U(e) {
		e === m.threadId && (m.setThreadId(""), m.setScope(null), l([{
			...sc,
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		}]));
	}
	async function W(e) {
		if (x(e), !(!P?.id || !e)) try {
			let t = Object.fromEntries((i?.adapters || []).map((e) => [e.id, e.model || ""]));
			t[P.id] = e;
			let n = await K("/api/agent-bridge/settings", {
				provider: P.id,
				models: t
			});
			j(n, !0), window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: n }));
		} catch (e) {
			D(e instanceof Error ? e.message : "모델 설정 저장에 실패했습니다.");
		}
	}
	async function te(e, t, n) {
		try {
			let r = await Le(t, n);
			l((t) => t.map((t) => t.id === e ? {
				...t,
				proposalStatus: r.status
			} : t)), Re(r);
		} catch (e) {
			D(e instanceof Error ? e.message : "제안 처리에 실패했습니다.");
		}
	}
	return t ? /* @__PURE__ */ (0, f.jsxs)("aside", {
		className: "react-agent-dock",
		style: L,
		"aria-label": "AI Agent",
		children: [
			/* @__PURE__ */ (0, f.jsxs)("header", {
				className: "react-agent-dock-header",
				children: [/* @__PURE__ */ (0, f.jsxs)("div", {
					className: "react-agent-dock-title",
					children: [/* @__PURE__ */ (0, f.jsx)("span", {
						className: "react-agent-logo",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, f.jsx)("span", {
							className: "react-agent-logo-mark",
							dangerouslySetInnerHTML: { __html: F.logo }
						})
					}), /* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("p", {
						className: "section-kicker",
						children: "Agent"
					}), /* @__PURE__ */ (0, f.jsx)("h2", { children: P?.label || F.label })] })]
				}), /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "react-agent-header-actions",
					children: [
						/* @__PURE__ */ (0, f.jsx)("button", {
							className: "react-agent-new-chat",
							type: "button",
							"aria-expanded": u,
							onClick: () => p((e) => !e),
							children: "대화 목록"
						}),
						/* @__PURE__ */ (0, f.jsx)("button", {
							className: "react-agent-new-chat",
							type: "button",
							onClick: ee,
							children: "새 대화"
						}),
						/* @__PURE__ */ (0, f.jsx)("button", {
							className: "icon-btn",
							type: "button",
							"aria-label": "AI Agent 닫기",
							"data-tooltip": "닫기",
							"data-tooltip-pos": "left",
							onClick: r,
							children: "×"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "react-agent-dock-chrome",
				children: [
					u && /* @__PURE__ */ (0, f.jsx)(nc, {
						activeId: m.threadId,
						refreshKey: m.refreshKey,
						onSelect: (e) => void H(e),
						onDeleted: U
					}),
					h && /* @__PURE__ */ (0, f.jsxs)("p", {
						className: "react-agent-scope",
						children: [/* @__PURE__ */ (0, f.jsx)("em", {
							className: "chip",
							children: h
						}), " 대화"]
					}),
					/* @__PURE__ */ (0, f.jsx)("p", {
						className: "react-agent-layer-note",
						children: "이 대화는 내 생각(가설)이며 보고서·Market Memory·근거 평가에 사용되지 않습니다."
					})
				]
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "react-agent-dock-body",
				ref: O,
				children: [
					/* @__PURE__ */ (0, f.jsx)("div", {
						className: "react-agent-watermark",
						"aria-hidden": "true",
						dangerouslySetInnerHTML: { __html: F.monoLogo }
					}),
					R.length > 0 && /* @__PURE__ */ (0, f.jsxs)("div", {
						className: "react-agent-preflight",
						role: "status",
						children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: "Agent 준비 상태 확인 필요" }), R.slice(0, 3).map((e) => /* @__PURE__ */ (0, f.jsx)("p", { children: e.message }, e.id))]
					}),
					/* @__PURE__ */ (0, f.jsx)("div", {
						className: "react-agent-messages",
						children: c.map((e) => /* @__PURE__ */ (0, f.jsxs)("article", {
							className: `react-agent-message ${e.role}${e.pending ? " pending" : ""}`,
							children: [
								e.role === "assistant" && /* @__PURE__ */ (0, f.jsxs)("div", {
									className: "react-agent-message-head",
									children: [
										/* @__PURE__ */ (0, f.jsx)("span", {
											className: "react-agent-mini-logo",
											"aria-hidden": "true",
											dangerouslySetInnerHTML: { __html: F.logo }
										}),
										/* @__PURE__ */ (0, f.jsx)("strong", { children: P?.label || F.label }),
										/* @__PURE__ */ (0, f.jsx)("time", { children: vc(e.createdAt) })
									]
								}),
								e.runTitle && /* @__PURE__ */ (0, f.jsx)(v, {
									state: e.runState === "still-running" ? "pending" : e.runState,
									title: e.runTitle,
									meta: e.runMeta
								}),
								e.runState === "still-running" && e.jobId && /* @__PURE__ */ (0, f.jsx)("div", {
									"data-qa": "agent-job-still-running",
									children: /* @__PURE__ */ (0, f.jsx)("button", {
										type: "button",
										"data-qa": "agent-job-resume",
										onClick: () => void B(e.id, e.jobId),
										children: "상태 다시 확인"
									})
								}),
								e.text && /* @__PURE__ */ (0, f.jsx)("div", {
									className: e.variant === "welcome" ? "react-agent-welcome-card" : "",
									children: /* @__PURE__ */ (0, f.jsx)(_, { text: e.text })
								}),
								e.notice && /* @__PURE__ */ (0, f.jsx)("p", {
									className: "react-agent-notice",
									children: e.notice
								}),
								e.proposal && /* @__PURE__ */ (0, f.jsxs)("div", {
									className: "agent-proposal",
									children: [
										/* @__PURE__ */ (0, f.jsxs)("div", {
											className: "agent-proposal-title",
											children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: e.proposal.artifactKind || "proposal" }), e.proposal.artifactId && /* @__PURE__ */ (0, f.jsx)("span", { children: e.proposal.artifactId })]
										}),
										e.proposalStatus === "pending" && e.proposal.summary && /* @__PURE__ */ (0, f.jsx)("p", {
											"data-qa": "proposal-summary",
											children: xe(e.proposal.summary)
										}),
										e.proposalStatus === "pending" && e.proposal.diff && /* @__PURE__ */ (0, f.jsxs)("details", {
											className: "agent-proposal-diff",
											children: [/* @__PURE__ */ (0, f.jsx)("summary", { children: "diff 보기" }), /* @__PURE__ */ (0, f.jsx)("pre", {
												"data-qa": "proposal-diff",
												children: Se(e.proposal.diff)
											})]
										}),
										e.proposalStatus === "pending" ? /* @__PURE__ */ (0, f.jsxs)("div", {
											className: "agent-actions",
											children: [/* @__PURE__ */ (0, f.jsx)("button", {
												type: "button",
												"data-qa": "proposal-approve",
												onClick: () => te(e.id, e.proposal.id, "approve"),
												children: "승인"
											}), /* @__PURE__ */ (0, f.jsx)("button", {
												type: "button",
												"data-qa": "proposal-reject",
												onClick: () => te(e.id, e.proposal.id, "reject"),
												children: "거절"
											})]
										}) : /* @__PURE__ */ (0, f.jsxs)("p", {
											className: "agent-proposal-status",
											"data-qa": e.proposalStatus === "applied" ? "wb-happy-applied" : e.proposalStatus === "rejected" ? "wb-f1-terminal-rejected" : e.proposalStatus === "stale" ? "wb-f1-terminal-stale" : "proposal-terminal",
											children: ["상태: ", e.proposalStatus]
										})
									]
								})
							]
						}, e.id))
					})
				]
			}),
			/* @__PURE__ */ (0, f.jsxs)("form", {
				className: "react-agent-form",
				onSubmit: V,
				children: [
					/* @__PURE__ */ (0, f.jsx)("textarea", {
						"data-qa": "agent-input",
						value: g,
						onChange: (e) => y(e.currentTarget.value),
						onKeyDown: (e) => {
							e.key === "Enter" && !e.shiftKey && (e.preventDefault(), e.currentTarget.form?.requestSubmit());
						},
						rows: 2,
						placeholder: "현재 화면에 대해 물어보세요"
					}),
					/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "react-agent-form-toolbar",
						children: [/* @__PURE__ */ (0, f.jsxs)("div", {
							className: "react-agent-tools",
							children: [/* @__PURE__ */ (0, f.jsx)("select", {
								value: b,
								onChange: (e) => W(e.currentTarget.value),
								"aria-label": "모델 버전",
								children: I.length ? I.map((e) => /* @__PURE__ */ (0, f.jsx)("option", {
									value: e.value,
									children: e.label
								}, e.value)) : /* @__PURE__ */ (0, f.jsx)("option", {
									value: "",
									children: "기본 버전"
								})
							}), /* @__PURE__ */ (0, f.jsxs)("select", {
								value: S,
								onChange: (e) => C(e.currentTarget.value),
								"aria-label": "노력 단계",
								children: [
									/* @__PURE__ */ (0, f.jsx)("option", {
										value: "low",
										children: "노력 낮음"
									}),
									/* @__PURE__ */ (0, f.jsx)("option", {
										value: "medium",
										children: "노력 중간"
									}),
									/* @__PURE__ */ (0, f.jsx)("option", {
										value: "high",
										children: "노력 높음"
									}),
									/* @__PURE__ */ (0, f.jsx)("option", {
										value: "max",
										children: "노력 최대"
									})
								]
							})]
						}), /* @__PURE__ */ (0, f.jsx)("button", {
							className: "btn btn--primary btn--sm",
							type: "submit",
							"data-qa": "agent-submit",
							disabled: w || !g.trim(),
							children: w ? "작업 중" : "보내기"
						})]
					}),
					E && /* @__PURE__ */ (0, f.jsx)("p", {
						className: "react-agent-error",
						children: E
					})
				]
			})
		]
	}) : /* @__PURE__ */ (0, f.jsx)("aside", {
		className: "react-agent-dock is-closed",
		style: L,
		"aria-label": "AI Agent 닫힘",
		children: /* @__PURE__ */ (0, f.jsxs)("button", {
			type: "button",
			onClick: n,
			"aria-label": "AI Agent 열기",
			"data-tooltip": "AI Agent 열기",
			"data-tooltip-pos": "left",
			children: [/* @__PURE__ */ (0, f.jsx)("span", {
				className: "react-agent-closed-dot",
				"aria-hidden": "true"
			}), /* @__PURE__ */ (0, f.jsx)("span", { children: "AI" })]
		})
	});
}
//#endregion
//#region src/app/RssRoute.tsx
var Nc = {
	start: "",
	end: "",
	source: "",
	market: "",
	country: "",
	language: ""
}, Pc = 20, Fc = [
	{
		value: "",
		label: "전체 시장"
	},
	{
		value: "US",
		label: "미국"
	},
	{
		value: "KR",
		label: "한국"
	},
	{
		value: "EUROPE",
		label: "유럽"
	},
	{
		value: "JP",
		label: "일본"
	},
	{
		value: "GLOBAL",
		label: "글로벌"
	}
], Ic = {
	GB: "영국",
	DE: "독일",
	FR: "프랑스",
	NL: "네덜란드",
	IT: "이탈리아",
	ES: "스페인",
	JP: "일본"
}, Lc = {
	en: "영어",
	de: "독일어",
	fr: "프랑스어",
	nl: "네덜란드어",
	it: "이탈리아어",
	es: "스페인어",
	ja: "일본어",
	ko: "한국어"
};
function Rc(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function zc(e) {
	let t = e.timestamp || e.date || "";
	if (!t) return "시간 정보 없음";
	let n = new Date(t);
	return Number.isNaN(n.getTime()) ? t : n.toLocaleString("ko-KR");
}
function Bc(e) {
	let t = [
		e.start ? `${e.start} 이후` : "",
		e.end ? `${e.end} 이전` : "",
		e.source ? e.source : "",
		e.market ? Fc.find((t) => t.value === e.market)?.label || e.market : "",
		e.country ? Ic[e.country] || e.country : "",
		e.language ? Lc[e.language] || e.language : ""
	].filter(Boolean);
	return t.length ? t.join(" · ") : "전체 RSS 피드";
}
function $(e, t) {
	let n = new URLSearchParams({
		offset: String((Math.max(1, e) - 1) * Pc),
		limit: String(Pc)
	});
	return t.start && n.set("start", t.start), t.end && n.set("end", t.end), t.source && n.set("source", t.source), t.market && n.set("market", t.market), t.country && n.set("country", t.country), t.language && n.set("language", t.language), n;
}
function Vc(e) {
	let t = e.markets, n = Array.isArray(t) ? t : typeof t == "string" ? t.split(",") : String(e.market || "").split(","), r = /* @__PURE__ */ new Set();
	return n.map((e) => String(e || "").trim()).filter(Boolean).filter((e) => !r.has(e) && (r.add(e), !0));
}
async function Hc(e) {
	let t = e;
	for (; U(t.status);) await Rc(1e3), t = await G(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "RSS 수집 작업에 실패했습니다.");
	return t;
}
function Uc(e, t) {
	return e.url || `${e.title || "rss"}-${e.timestamp || e.date || t}`;
}
function Wc(e) {
	return {
		title: e.title || e.headline || e.path || "검색 결과",
		url: e.url || e.sourceUrl || e.link || "",
		description: e.summary || e.snippet || e.text || e.content || "",
		media: e.media || e.source || e.collector || "",
		source: e.source || e.media || e.collector || "",
		markets: Vc({
			markets: e.markets,
			market: String(e.market || "")
		}),
		market: String(e.market || ""),
		timestamp: e.timestamp || e.date || e.publishedAt || e.published || "",
		date: e.date || e.publishedAt || e.published || e.timestamp || ""
	};
}
function Gc() {
	let { isSelected: e } = hn(), t = un("rss"), [n, r] = (0, d.useState)(null), [i, a] = (0, d.useState)(null), [o, s] = (0, d.useState)(1), [c, l] = (0, d.useState)(Nc), [u, p] = (0, d.useState)(Nc), [m, h] = (0, d.useState)(""), [g, _] = (0, d.useState)(!1), [v, y] = (0, d.useState)(!1), [b, x] = (0, d.useState)(!1), [S, C] = (0, d.useState)(""), [w, T] = (0, d.useState)(""), E = i?.items || [], D = i?.total ?? E.length, O = Math.max(1, Math.ceil(D / Pc)), k = (0, d.useMemo)(() => i?.sources || [], [i?.sources]), A = (0, d.useMemo)(() => i?.countries || [], [i?.countries]), j = (0, d.useMemo)(() => i?.languages || [], [i?.languages]), M = (0, d.useCallback)(async (e = o, t = c) => {
		_(!0), C("");
		try {
			let n = await G(`/api/rss/items?${$(e, t).toString()}`);
			a(n), s(e), l(t), p(t), q("rss", {
				surface: "rss",
				viewId: "rssfeed",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			C(e instanceof Error ? e.message : "RSS 피드를 불러오지 못했습니다.");
		} finally {
			_(!1);
		}
	}, [c, o]), N = (0, d.useCallback)(async () => {
		try {
			let e = await G("/api/dashboard"), t = e.index?.newsCount ?? e.index?.count;
			Number.isFinite(Number(t)) && r(Number(t));
		} catch {}
	}, []);
	(0, d.useEffect)(() => {
		M(1, c), N();
	}, []);
	let P = (0, d.useRef)(!0);
	(0, d.useEffect)(() => {
		if (P.current) {
			P.current = !1;
			return;
		}
		M(1, c), N();
	}, [t]);
	async function F(e) {
		let t = {
			...u,
			...e
		};
		if (p(t), t.start && t.end && t.start > t.end) {
			C("시작 시간은 종료 시간보다 앞서야 합니다.");
			return;
		}
		C(""), T(""), await M(1, t);
	}
	async function I() {
		T(""), h(""), p(Nc), await M(1, Nc);
	}
	async function L(e) {
		e?.preventDefault();
		let t = m.trim();
		if (!t) {
			C("검색어를 입력해 주세요.");
			return;
		}
		x(!0), C(""), T("");
		try {
			let e = await G(`/api/search?${new URLSearchParams({
				query: t,
				scope: "news",
				limit: "50"
			}).toString()}`), n = Array.isArray(e) ? e : e.items || [];
			a({
				items: n.map(Wc),
				total: n.length,
				offset: 0,
				limit: n.length,
				has_more: !1,
				sources: k
			}), s(1), T(`뉴스 검색 결과 ${n.length}개`), q("rss", {
				surface: "rss",
				viewId: "rssfeed",
				reportKind: "news_search",
				reportId: t
			});
		} catch (e) {
			C(e instanceof Error ? e.message : "뉴스 검색에 실패했습니다.");
		} finally {
			x(!1);
		}
	}
	async function R() {
		y(!0), C(""), T("RSS 수집 작업을 시작했습니다.");
		try {
			let e = await Hc(await K("/api/rssarchive/import", {})), t = Number.isFinite(Number(e.result?.added)) ? ` 신규 ${e.result?.added}개` : "";
			T(`RSS 수집 완료.${t}`), await M(1, c), await N();
		} catch (e) {
			C(e instanceof Error ? e.message : "RSS 수집에 실패했습니다."), T("");
		} finally {
			y(!1);
		}
	}
	let z = Math.min(Math.max(o, 1), O), B = Math.max(1, z - 2), V = Math.min(O, z + 2);
	return /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "react-rss-route",
		"data-rss-route": !0,
		children: [
			/* @__PURE__ */ (0, f.jsx)(qn, {
				eyebrow: "RSS Feed",
				title: "RSS 피드",
				description: "시장·국가·언어·기간·소스로 좁히거나 본문까지 검색합니다. 시간은 UTC+9 기준입니다.",
				actions: /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "react-rss-hero-actions",
					children: [
						/* @__PURE__ */ (0, f.jsxs)("span", {
							className: "react-rss-stat-pill",
							children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: "LOADED" }), D > 0 ? `${D}개 · ${z}/${O}` : "0개"]
						}),
						/* @__PURE__ */ (0, f.jsxs)("span", {
							className: "react-rss-stat-pill",
							children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: "INDEXED" }), n === null ? "…" : `${n}개 문서`]
						}),
						/* @__PURE__ */ (0, f.jsx)("button", {
							type: "button",
							onClick: R,
							disabled: v,
							children: v ? "수집 중" : "RSS 수집/가져오기"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, f.jsxs)("section", {
				className: "find-bar find-bar--stacked",
				"aria-label": "RSS 필터와 검색",
				children: [/* @__PURE__ */ (0, f.jsxs)("div", {
					className: "find-bar__row",
					children: [/* @__PURE__ */ (0, f.jsx)("input", {
						type: "search",
						"aria-label": "본문 검색어",
						value: m,
						placeholder: "기업, 티커, 섹터 또는 이슈",
						onChange: (e) => h(e.currentTarget.value),
						onKeyDown: (e) => {
							e.key === "Enter" && (e.preventDefault(), L());
						},
						className: "find-bar__search"
					}), /* @__PURE__ */ (0, f.jsx)("button", {
						className: "btn",
						type: "button",
						onClick: () => L(),
						disabled: b,
						children: b ? "검색 중" : "본문 검색"
					})]
				}), /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "find-bar__more",
					children: [
						/* @__PURE__ */ (0, f.jsxs)("label", {
							className: "find-bar__field",
							children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "시장" }), /* @__PURE__ */ (0, f.jsx)("select", {
								value: u.market,
								onChange: (e) => void F({ market: e.currentTarget.value }),
								children: Fc.filter((t) => !t.value || e(t.value)).map((e) => /* @__PURE__ */ (0, f.jsx)("option", {
									value: e.value,
									children: e.label
								}, e.value || "all-market"))
							})]
						}),
						/* @__PURE__ */ (0, f.jsxs)("label", {
							className: "find-bar__field",
							children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "소스" }), /* @__PURE__ */ (0, f.jsxs)("select", {
								value: u.source,
								onChange: (e) => void F({ source: e.currentTarget.value }),
								children: [/* @__PURE__ */ (0, f.jsx)("option", {
									value: "",
									children: "전체 소스"
								}), k.map((e) => /* @__PURE__ */ (0, f.jsx)("option", {
									value: e,
									children: e
								}, e))]
							})]
						}),
						/* @__PURE__ */ (0, f.jsxs)("label", {
							className: "find-bar__field",
							children: [
								/* @__PURE__ */ (0, f.jsx)("span", { children: "기간" }),
								/* @__PURE__ */ (0, f.jsx)("input", {
									type: "datetime-local",
									"aria-label": "시작",
									value: u.start,
									onChange: (e) => void F({ start: e.currentTarget.value })
								}),
								/* @__PURE__ */ (0, f.jsx)("input", {
									type: "datetime-local",
									"aria-label": "종료",
									value: u.end,
									onChange: (e) => void F({ end: e.currentTarget.value })
								})
							]
						}),
						/* @__PURE__ */ (0, f.jsxs)("details", {
							className: "find-bar__detail",
							children: [
								/* @__PURE__ */ (0, f.jsx)("summary", { children: "상세" }),
								/* @__PURE__ */ (0, f.jsxs)("label", {
									className: "find-bar__field",
									children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "국가" }), /* @__PURE__ */ (0, f.jsxs)("select", {
										value: u.country,
										onChange: (e) => void F({ country: e.currentTarget.value }),
										children: [/* @__PURE__ */ (0, f.jsx)("option", {
											value: "",
											children: "전체 국가"
										}), A.map((e) => /* @__PURE__ */ (0, f.jsx)("option", {
											value: e,
											children: Ic[e] || e
										}, e))]
									})]
								}),
								/* @__PURE__ */ (0, f.jsxs)("label", {
									className: "find-bar__field",
									children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "언어" }), /* @__PURE__ */ (0, f.jsxs)("select", {
										value: u.language,
										onChange: (e) => void F({ language: e.currentTarget.value }),
										children: [/* @__PURE__ */ (0, f.jsx)("option", {
											value: "",
											children: "전체 언어"
										}), j.map((e) => /* @__PURE__ */ (0, f.jsx)("option", {
											value: e,
											children: Lc[e] || e
										}, e))]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, f.jsx)("button", {
							className: "btn btn--text find-bar__reset",
							type: "button",
							onClick: I,
							disabled: g,
							children: "초기화"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "react-rss-summary",
				children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: Bc(c) }), /* @__PURE__ */ (0, f.jsx)("span", { children: D > 0 ? `${D}개 · ${z}/${O}` : "0개" })]
			}),
			S && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-error",
				children: S
			}),
			w && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-warning",
				children: w
			}),
			/* @__PURE__ */ (0, f.jsx)("section", {
				className: "react-rss-feed",
				"aria-label": "RSS feed items",
				children: E.length ? E.map((e, t) => {
					let n = Uc(e, t), r = String(e.description || "").trim(), i = Vc(e);
					return /* @__PURE__ */ (0, f.jsxs)("article", {
						className: "react-rss-card",
						children: [/* @__PURE__ */ (0, f.jsxs)("div", {
							className: "react-rss-card-main",
							children: [
								/* @__PURE__ */ (0, f.jsx)("h2", { children: e.url ? /* @__PURE__ */ (0, f.jsx)("a", {
									href: e.url,
									target: "_blank",
									rel: "noopener noreferrer",
									children: e.title || "제목 없음"
								}) : e.title || "제목 없음" }),
								/* @__PURE__ */ (0, f.jsxs)("div", {
									className: "react-rss-card-meta",
									children: [
										(e.media || e.source) && /* @__PURE__ */ (0, f.jsx)("span", {
											className: "pill",
											children: e.media || e.source
										}),
										i.length ? /* @__PURE__ */ (0, f.jsx)("span", {
											className: "pill",
											children: i.join(" · ")
										}) : null,
										/* @__PURE__ */ (0, f.jsx)("span", { children: zc(e) })
									]
								}),
								r && /* @__PURE__ */ (0, f.jsx)("p", { children: r })
							]
						}), /* @__PURE__ */ (0, f.jsx)("div", {
							className: "react-rss-card-actions",
							children: e.url && /* @__PURE__ */ (0, f.jsx)("a", {
								href: e.url,
								target: "_blank",
								rel: "noopener noreferrer",
								children: "기사 열기"
							})
						})]
					}, n);
				}) : /* @__PURE__ */ (0, f.jsxs)("article", {
					className: "react-dashboard-panel",
					children: [/* @__PURE__ */ (0, f.jsx)("h2", { children: g ? "불러오는 중" : "표시할 RSS 피드가 없습니다." }), /* @__PURE__ */ (0, f.jsx)("p", { children: g ? "수집된 항목을 확인하고 있습니다." : "RSS 수집을 실행하거나 필터를 초기화해 보세요." })]
				})
			}),
			O > 1 && /* @__PURE__ */ (0, f.jsxs)("nav", {
				className: "react-rss-pagination",
				"aria-label": "RSS pagination",
				children: [
					/* @__PURE__ */ (0, f.jsx)("button", {
						type: "button",
						disabled: z === 1 || g,
						onClick: () => M(z - 1, c),
						children: "이전"
					}),
					B > 1 && /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [/* @__PURE__ */ (0, f.jsx)("button", {
						type: "button",
						onClick: () => M(1, c),
						children: "1"
					}), B > 2 && /* @__PURE__ */ (0, f.jsx)("span", { children: "..." })] }),
					Array.from({ length: V - B + 1 }, (e, t) => B + t).map((e) => /* @__PURE__ */ (0, f.jsx)("button", {
						type: "button",
						"aria-current": e === z ? "page" : void 0,
						disabled: g,
						onClick: () => M(e, c),
						children: e
					}, e)),
					V < O && /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [V < O - 1 && /* @__PURE__ */ (0, f.jsx)("span", { children: "..." }), /* @__PURE__ */ (0, f.jsx)("button", {
						type: "button",
						onClick: () => M(O, c),
						children: O
					})] }),
					/* @__PURE__ */ (0, f.jsx)("button", {
						type: "button",
						disabled: z === O || g,
						onClick: () => M(z + 1, c),
						children: "다음"
					})
				]
			})
		]
	});
}
//#endregion
//#region src/app/homePreference.ts
var Kc = "folio.homePreference.v1", qc = "folio.agentCharacter.v1", Jc = "folio.motionPreference.v1", Yc = "folio:ui-preferences-updated", Xc = {
	home: {
		mode: "home",
		choiceSeen: !0
	},
	character: {
		preset: "classic",
		name: ""
	},
	motion: "system"
};
function Zc(e) {
	if (typeof window > "u") return "";
	try {
		return window.localStorage.getItem(e) || "";
	} catch {
		return "";
	}
}
function Qc(e) {
	if (!e) return {};
	try {
		let t = JSON.parse(e);
		return t && typeof t == "object" && !Array.isArray(t) ? t : {};
	} catch {
		return {};
	}
}
function $c() {
	let e = Qc(Zc(Kc)), t = Qc(Zc(qc)), n = Zc(Jc);
	return {
		home: {
			mode: e.mode === "home" ? "home" : "office",
			choiceSeen: e.choiceSeen === !0
		},
		character: {
			preset: t.preset === "student" ? "student" : "classic",
			name: typeof t.name == "string" ? t.name.trim().slice(0, 30) : ""
		},
		motion: n === "reduced" ? "reduced" : "system"
	};
}
function el(e, t) {
	if (!(typeof window > "u")) try {
		window.localStorage.setItem(e, typeof t == "string" ? t : JSON.stringify(t));
	} catch {}
}
function tl(e) {
	typeof window > "u" || window.dispatchEvent(new CustomEvent(Yc, { detail: e }));
}
function nl(e) {
	return el(Kc, e.home), el(qc, e.character), el(Jc, e.motion), tl(e), e;
}
function rl() {
	if (typeof window < "u") try {
		window.localStorage.removeItem(Kc), window.localStorage.removeItem(qc), window.localStorage.removeItem(Jc);
	} catch {}
	let e = structuredClone(Xc);
	return tl(e), e;
}
function il(e = $c()) {
	return "home";
}
function al() {
	let [e, t] = (0, d.useState)(() => $c());
	(0, d.useEffect)(() => {
		let e = (e) => {
			let n = e.detail;
			t(n || $c());
		}, n = () => t($c());
		return window.addEventListener(Yc, e), window.addEventListener("storage", n), () => {
			window.removeEventListener(Yc, e), window.removeEventListener("storage", n);
		};
	}, []);
	function n(e) {
		t(e), nl(e);
	}
	return {
		preferences: e,
		setHome(t, r = !0) {
			n({
				...e,
				home: {
					mode: t,
					choiceSeen: r
				}
			});
		},
		setCharacter(t, r = e.character.name) {
			n({
				...e,
				character: {
					preset: t,
					name: r.trim().slice(0, 30)
				}
			});
		},
		setMotion(t) {
			n({
				...e,
				motion: t
			});
		},
		reset() {
			let e = rl();
			t(e);
		}
	};
}
//#endregion
//#region src/app/themePreference.ts
function ol(e) {
	return e === "light" || e === "dark" || e === "system";
}
function sl(e) {
	return e === "light" || e === "dark";
}
function cl() {
	return {
		preference: ol(window.FolioTheme?.preference) ? window.FolioTheme.preference : "system",
		resolved: sl(window.FolioTheme?.resolved) ? window.FolioTheme.resolved : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
	};
}
function ll() {
	let [e, t] = (0, d.useState)(cl);
	return (0, d.useEffect)(() => {
		let e = (e) => {
			let n = e?.detail;
			if (n && ol(n.preference) && sl(n.resolved)) {
				t(n);
				return;
			}
			t(cl());
		};
		return window.addEventListener("folio:theme-changed", e), e(), () => window.removeEventListener("folio:theme-changed", e);
	}, []), {
		...e,
		setPreference(e) {
			let n = window.FolioTheme?.setPreference(e);
			t(n || {
				preference: e,
				resolved: e === "system" ? cl().resolved : e
			});
		}
	};
}
//#endregion
//#region src/app/WorkLogMigration.tsx
function ul(e) {
	return e instanceof H ? e.code || `http_${e.status}` : e instanceof Error && /^[a-z0-9_]+$/.test(e.message) ? e.message : "request_failed";
}
function dl(e) {
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? "시간 확인 불가" : new Intl.DateTimeFormat("ko-KR", {
		dateStyle: "short",
		timeStyle: "short"
	}).format(t);
}
function fl() {
	let [e, t] = (0, d.useState)(null), [n, r] = (0, d.useState)("migrate_keep_original"), [i, a] = (0, d.useState)(!1), [o, s] = (0, d.useState)(""), [c, l] = (0, d.useState)(""), u = (0, d.useRef)(!1), p = (0, d.useRef)(null), m = (0, d.useRef)(null);
	(0, d.useEffect)(() => {
		if (!e) return;
		p.current?.querySelector("button:not([disabled]), input:not([disabled])")?.focus();
		let t = (e) => {
			if (e.key === "Escape" && h(), e.key !== "Tab" || !p.current) return;
			let t = Array.from(p.current.querySelectorAll("button:not([disabled]), input:not([disabled])"));
			if (!t.length) return;
			let n = t[0], r = t[t.length - 1];
			e.shiftKey && document.activeElement === n ? (e.preventDefault(), r.focus()) : !e.shiftKey && document.activeElement === r && (e.preventDefault(), n.focus());
		};
		return document.addEventListener("keydown", t), () => document.removeEventListener("keydown", t);
	}, [e]);
	function h() {
		t(null), s(""), window.setTimeout(() => m.current?.focus(), 0);
	}
	async function g(e) {
		if (!u.current) {
			u.current = !0, m.current = e, a(!0), s(""), l("");
			try {
				let e = await K("/api/agent/work-log/migration-preview", {});
				t(e), r("migrate_keep_original");
			} catch (e) {
				s(ul(e));
			} finally {
				u.current = !1, a(!1);
			}
		}
	}
	async function _() {
		if (!(!e || u.current || e.collisions.length > 0)) {
			u.current = !0, a(!0), s("");
			try {
				let t = await K("/api/agent/work-log/migration-confirm", {
					previewToken: e.previewToken,
					action: n
				});
				l(`${t.migratedJobs}건을 가져왔습니다.`), h();
			} catch (e) {
				t(null), s(ul(e));
			} finally {
				u.current = !1, a(!1);
			}
		}
	}
	return /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "work-log-migration-control",
		children: [
			/* @__PURE__ */ (0, f.jsx)("div", {
				className: "filter-actions settings-actions",
				children: /* @__PURE__ */ (0, f.jsx)("button", {
					className: "btn",
					type: "button",
					"data-qa": "work-log-migration-preview",
					disabled: i,
					onClick: (e) => void g(e.currentTarget),
					children: i && !e ? "확인 중" : "이전 작업 기록 가져오기"
				})
			}),
			o && /* @__PURE__ */ (0, f.jsxs)("p", {
				className: "react-dashboard-error",
				"data-qa": "work-log-migration-error",
				"data-error-code": o,
				children: [
					"마이그레이션을 완료하지 못했습니다. 다시 미리보세요. (",
					o,
					")"
				]
			}),
			c && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-warning",
				"data-qa": "work-log-migration-success",
				role: "status",
				children: c
			}),
			e && /* @__PURE__ */ (0, f.jsx)("div", {
				className: "work-log-dialog-backdrop",
				children: /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "work-log-dialog",
					ref: p,
					role: "dialog",
					"aria-modal": "true",
					"aria-labelledby": "work-log-migration-title",
					"data-qa": "work-log-migration-dialog",
					children: [
						/* @__PURE__ */ (0, f.jsx)("h3", {
							id: "work-log-migration-title",
							children: "이전 작업 기록 가져오기"
						}),
						/* @__PURE__ */ (0, f.jsxs)("p", {
							"data-qa": "work-log-migration-summary",
							children: [
								"이전 ",
								e.legacyJobs,
								"건 · 가져올 수 있음 ",
								e.migratableJobs,
								"건 · ",
								dl(e.expiresAt),
								"까지"
							]
						}),
						e.collisions.length > 0 && /* @__PURE__ */ (0, f.jsxs)("p", {
							className: "react-dashboard-error",
							"data-qa": "work-log-migration-collisions",
							children: [
								"충돌 ",
								e.collisions.length,
								"건이 있어 진행할 수 없습니다."
							]
						}),
						/* @__PURE__ */ (0, f.jsxs)("label", { children: [/* @__PURE__ */ (0, f.jsx)("input", {
							type: "radio",
							name: "migration-action",
							"data-qa": "work-log-migration-keep",
							checked: n === "migrate_keep_original",
							onChange: () => r("migrate_keep_original")
						}), " 원본 유지"] }),
						/* @__PURE__ */ (0, f.jsxs)("label", { children: [/* @__PURE__ */ (0, f.jsx)("input", {
							type: "radio",
							name: "migration-action",
							"data-qa": "work-log-migration-delete-original",
							checked: n === "migrate_delete_original",
							onChange: () => r("migrate_delete_original")
						}), " 성공 후 이전 jobs 파일 삭제"] }),
						/* @__PURE__ */ (0, f.jsxs)("div", {
							className: "work-log-dialog-actions",
							children: [/* @__PURE__ */ (0, f.jsx)("button", {
								type: "button",
								"data-qa": "work-log-migration-confirm",
								disabled: i || e.collisions.length > 0,
								onClick: () => void _(),
								children: "가져오기 확인"
							}), /* @__PURE__ */ (0, f.jsx)("button", {
								type: "button",
								"data-qa": "work-log-migration-cancel",
								onClick: h,
								children: "취소"
							})]
						})
					]
				})
			})
		]
	});
}
//#endregion
//#region src/app/SettingsRoute.tsx
var pl = [
	"openai",
	"gemini",
	"claude"
], ml = {
	openai: {
		name: "OpenAI",
		key: "sk-...",
		model: "gpt-5.5"
	},
	gemini: {
		name: "Gemini",
		key: "AIza...",
		model: "gemini-3.5-flash"
	},
	claude: {
		name: "Claude",
		key: "sk-ant-...",
		model: "claude-sonnet-5"
	}
};
function hl(e) {
	return pl.includes(e) ? e : "openai";
}
function gl(e, t, n, r) {
	return e ? `${r} 저장됨: ${t || "저장됨"}` : n;
}
function _l(e) {
	return e.bridgeSupported === !1 ? "지원 안 됨" : e.installed ? e.authenticated || e.available ? "사용 가능" : "로그인 필요" : "미설치";
}
function vl(e) {
	return e.bridgeSupported === !1 ? "warn" : e.authenticated || e.available ? "ready" : e.installed ? "warn" : "";
}
function yl({ checked: e, onChange: t, label: n, ariaLabel: r, compact: i = !1 }) {
	return /* @__PURE__ */ (0, f.jsxs)("label", {
		className: `settings-switch${i ? " settings-switch-compact" : ""}${e ? " is-on" : ""}`,
		children: [
			/* @__PURE__ */ (0, f.jsx)("input", {
				"aria-label": r || n || "설정 전환",
				checked: e,
				onChange: (e) => t(e.currentTarget.checked),
				type: "checkbox"
			}),
			/* @__PURE__ */ (0, f.jsx)("span", {
				className: "settings-switch-track",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, f.jsx)("span", { className: "settings-switch-thumb" })
			}),
			n ? /* @__PURE__ */ (0, f.jsxs)("span", {
				className: "settings-switch-copy",
				children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: n }), /* @__PURE__ */ (0, f.jsx)("small", { children: e ? "ON" : "OFF" })]
			}) : /* @__PURE__ */ (0, f.jsx)("span", {
				className: "settings-switch-state",
				"aria-hidden": "true",
				children: e ? "ON" : "OFF"
			})
		]
	});
}
function bl(e) {
	return {
		rss: {
			enabled: !!e.rss?.enabled,
			intervalMinutes: e.rss?.intervalMinutes || 60,
			saveFullText: e.rss?.saveFullText !== !1
		},
		marketMemory: {
			enabled: !!e.marketMemory?.enabled,
			intervalMinutes: e.marketMemory?.intervalMinutes || 1440,
			runAfterRss: !!e.marketMemory?.runAfterRss
		},
		briefing: {
			enabled: !!e.briefing?.enabled,
			time: e.briefing?.time || "08:00",
			marketScope: e.briefing?.marketScope || "both",
			briefingType: e.briefing?.briefingType || "default",
			runPrerequisites: !!e.briefing?.runPrerequisites
		}
	};
}
var xl = {
	default: "기본",
	market_focused: "시황 중심",
	concise: "요약"
};
function Sl() {
	let [e, t] = (0, d.useState)(null), [n, r] = (0, d.useState)([]), [i, a] = (0, d.useState)(!1), [o, s] = (0, d.useState)("");
	if ((0, d.useEffect)(() => {
		let e = !1;
		return (async () => {
			try {
				let n = await G("/api/market-scope");
				if (e) return;
				t(n), r([...n.selected]);
			} catch {
				e || s("관심 시장 설정을 불러오지 못했습니다.");
			}
		})(), () => {
			e = !0;
		};
	}, []), !e) return null;
	let c = (t) => {
		r((n) => {
			let r = n.includes(t) ? n.filter((e) => e !== t) : [...n, t];
			return r.length ? e.markets.map((e) => e.id).filter((e) => r.includes(e)) : n;
		});
	}, l = JSON.stringify(n) !== JSON.stringify([...e.selected]), u = async () => {
		a(!0), s("");
		try {
			let e = await oe("/api/market-scope", { selected: n });
			t(e), r([...e.selected]);
			let i = e.newlyEnabled || [];
			s(i.length ? "저장했습니다. 방금 켠 시장의 자료 수집을 시작했습니다 — 꺼져 있던 기간의 기사는 피드가 아직 내어주는 범위까지만 들어옵니다." : "저장했습니다.");
		} catch (e) {
			s(e instanceof Error ? e.message : "저장하지 못했습니다.");
		} finally {
			a(!1);
		}
	};
	return /* @__PURE__ */ (0, f.jsxs)("section", {
		className: "settings-panel input-panel",
		"data-qa": "market-scope-panel",
		children: [
			/* @__PURE__ */ (0, f.jsx)("div", {
				className: "input-panel-header",
				children: /* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("h3", { children: "관심 시장" }), /* @__PURE__ */ (0, f.jsx)("p", { children: "여기서 끈 시장은 자료 수집이 멈추고 화면 전체(RSS·브리핑·캘린더·내러티브)에서 숨습니다. 유가·달러 같은 글로벌 자료는 항상 보입니다." })] })
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "field",
				children: [/* @__PURE__ */ (0, f.jsx)("span", {
					id: "marketScopeLabel",
					children: "수집·표시할 시장"
				}), /* @__PURE__ */ (0, f.jsx)("div", {
					className: "settings-theme-options",
					role: "group",
					"aria-labelledby": "marketScopeLabel",
					children: e.markets.map((e) => /* @__PURE__ */ (0, f.jsx)("button", {
						type: "button",
						"aria-pressed": n.includes(e.id),
						disabled: i,
						onClick: () => c(e.id),
						children: e.label
					}, e.id))
				})]
			}),
			/* @__PURE__ */ (0, f.jsx)("div", {
				className: "settings-actions",
				children: /* @__PURE__ */ (0, f.jsx)("button", {
					className: "btn btn--primary",
					type: "button",
					onClick: () => void u(),
					disabled: i || !l,
					children: i ? "저장 중" : "저장"
				})
			}),
			o && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-warning",
				role: "status",
				children: o
			})
		]
	});
}
function Cl() {
	let e = ll(), t = al(), [n, r] = (0, d.useState)("admin"), [i, a] = (0, d.useState)(null), [o, s] = (0, d.useState)(null), [c, l] = (0, d.useState)({}), [u, p] = (0, d.useState)({}), [m, h] = (0, d.useState)(null), [g, _] = (0, d.useState)("openai"), [v, y] = (0, d.useState)(""), [b, x] = (0, d.useState)(""), [S, C] = (0, d.useState)(!0), [w, T] = (0, d.useState)("cli"), [E, D] = (0, d.useState)("codex"), [O, k] = (0, d.useState)(""), [A, j] = (0, d.useState)({
		fred: "",
		bok: "",
		dart: ""
	}), [M, N] = (0, d.useState)({
		token: "",
		dbId: ""
	}), [P, F] = (0, d.useState)(""), [I, L] = (0, d.useState)({}), [R, z] = (0, d.useState)(""), [B, V] = (0, d.useState)(""), [ee, H] = (0, d.useState)(""), U = i?.llm?.providers || {}, W = U[g] || {}, te = ml[g], ne = W.modelChoices || [], re = o?.adapters || [], ie = (re.find((e) => e.id === E) || re[0])?.modelChoices || [], ae = (0, d.useCallback)(async (e = !1) => {
		H(""), V("load");
		try {
			let [t, n, r, i] = await Promise.all([
				G(`/api/settings${e ? "?refresh=true" : ""}`),
				G(`/api/agent-bridge/settings${e ? "?refresh=true" : ""}`),
				G("/api/automation/settings"),
				G("/api/obsidian/settings")
			]);
			a(t), C(t.agent?.enabled !== !1), T(t.agent?.mode === "api" ? "api" : "cli");
			let o = hl(t.llm?.provider);
			_(o);
			let c = t.llm?.providers?.[o] || {}, u = c.modelChoices || [];
			x(u.some((e) => e.value === c.model) ? String(c.model || "") : u[0]?.value || ""), N({
				token: "",
				dbId: t.notion?.dbId || ""
			}), s(n);
			let d = [
				"codex",
				"claude",
				"antigravity"
			].includes(n.provider || "") ? String(n.provider) : String(n.selectedAdapter || n.adapters?.[0]?.id || "codex"), f = n.adapters?.find((e) => e.id === d) || n.adapters?.[0];
			D(d);
			let m = f?.modelChoices || [];
			k(m.some((e) => e.value === f?.model) ? String(f?.model || "") : m[0]?.value || ""), window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: n })), l(bl(r)), p(i), F(i.vaultPath || ""), q("settings", {
				surface: "settings",
				viewId: "settings",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			H(e instanceof Error ? e.message : "설정을 불러오지 못했습니다.");
		} finally {
			V("");
		}
	}, []), oe = (0, d.useCallback)(async () => {
		V("cache"), H("");
		try {
			let e = await G("/api/cache/stats");
			h(e), z("캐시 상태를 불러왔습니다.");
		} catch (e) {
			H(e instanceof Error ? e.message : "캐시 상태를 불러오지 못했습니다.");
		} finally {
			V("");
		}
	}, []);
	async function se() {
		V("cache-cleanup"), H(""), z("오래된 기업 데이터 캐시를 정리하는 중입니다.");
		try {
			let e = await K("/api/cache/cleanup", {}), t = await G("/api/cache/stats");
			h(t), z(e.deleted ? `캐시 정리 완료: ${e.deleted}개 삭제, ${e.freed_mb || 0}MB 확보` : "정리할 오래된 캐시가 없습니다. 보관 기간이 지난 파일만 지웁니다.");
		} catch (e) {
			H(e instanceof Error ? e.message : "캐시 정리에 실패했습니다.");
		} finally {
			V("");
		}
	}
	(0, d.useEffect)(() => {
		ae();
	}, [ae]), (0, d.useEffect)(() => {
		let e = U[g] || {}, t = e.modelChoices || [];
		x((n) => t.some((e) => e.value === n) ? n : t.some((t) => t.value === e.model) ? String(e.model || "") : t[0]?.value || ""), y("");
	}, [g, U]), (0, d.useEffect)(() => {
		let e = re.find((e) => e.id === E) || re[0], t = e?.modelChoices || [];
		k((n) => t.some((e) => e.value === n) ? n : t.some((t) => t.value === e?.model) ? String(e?.model || "") : t[0]?.value || "");
	}, [E, re]);
	async function ce() {
		V("agent"), z("AI Agent 설정을 저장하는 중입니다.");
		try {
			let e = Object.fromEntries(re.map((e) => [e.id, e.model || ""]));
			e[E] = O;
			let [t, n] = await Promise.all([K("/api/agent-bridge/settings", {
				provider: E,
				models: e
			}), K("/api/settings", {
				agent: {
					enabled: S,
					mode: w
				},
				llm: {
					provider: g,
					providers: { [g]: {
						apiKey: v.trim(),
						model: b
					} }
				}
			})]);
			s(t), a(n), y(""), L((e) => {
				let t = { ...e };
				return delete t[g], t;
			}), window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: t })), z(S ? `AI Agent를 ${w === "cli" ? "LLM CLI" : "LLM API"} 모드로 저장했습니다.` : "AI Agent 생성을 비활성화했습니다.");
		} catch (e) {
			H(e instanceof Error ? e.message : "AI Agent 설정 저장에 실패했습니다.");
		} finally {
			V("");
		}
	}
	async function le(e) {
		L((t) => ({
			...t,
			[e]: { checking: !0 }
		}));
		try {
			let t = await K(`/api/settings/llm/test/${encodeURIComponent(e)}`, {});
			L((n) => ({
				...n,
				[e]: t
			}));
		} catch (t) {
			L((n) => ({
				...n,
				[e]: {
					status: "network_error",
					available: !1,
					message: t instanceof Error ? t.message : "연결 확인 실패"
				}
			}));
		}
	}
	async function ue() {
		V("api"), z("외부 데이터 API 설정을 저장하는 중입니다.");
		try {
			let e = await K("/api/settings", {
				fred: { apiKey: A.fred.trim() },
				bok: { apiKey: A.bok.trim() },
				dart: { apiKey: A.dart.trim() }
			});
			a(e), j({
				fred: "",
				bok: "",
				dart: ""
			}), z("외부 데이터 API 설정을 저장했습니다.");
		} catch (e) {
			H(e instanceof Error ? e.message : "API 설정 저장에 실패했습니다.");
		} finally {
			V("");
		}
	}
	async function de() {
		V("notion"), z("Notion 설정을 저장하는 중입니다.");
		try {
			let e = await K("/api/settings", { notion: {
				token: M.token.trim(),
				dbId: M.dbId.trim()
			} });
			a(e), N({
				token: "",
				dbId: e.notion?.dbId || ""
			}), z("Notion 설정을 저장했습니다.");
		} catch (e) {
			H(e instanceof Error ? e.message : "Notion 설정 저장에 실패했습니다.");
		} finally {
			V("");
		}
	}
	async function fe() {
		V("obsidian"), z("Obsidian 경로를 저장하는 중입니다.");
		try {
			let e = await K("/api/obsidian/settings", { vaultPath: P.trim() });
			p(e), F(e.vaultPath || P), z(e.vaultPath ? "Obsidian 경로를 저장했습니다." : "Vault 경로를 입력하세요.");
		} catch (e) {
			H(e instanceof Error ? e.message : "Obsidian 설정 저장에 실패했습니다.");
		} finally {
			V("");
		}
	}
	async function pe() {
		V("automation"), z("자동화 설정을 저장하는 중입니다.");
		try {
			let e = await K("/api/automation/settings", bl(c));
			l(bl(e)), z("자동화 설정을 저장했습니다.");
		} catch (e) {
			H(e instanceof Error ? e.message : "자동화 설정 저장에 실패했습니다.");
		} finally {
			V("");
		}
	}
	let me = (0, d.useMemo)(() => pl.map((e) => {
		let t = U[e] || {}, n = I[e], r = n?.checking;
		return {
			providerId: e,
			row: t,
			label: r ? "확인 중" : n?.available ? "사용 가능" : n ? "확인 실패" : t.hasApiKey ? "확인 필요" : "키 없음",
			className: n?.available ? "ready" : r || n ? "warn" : "",
			detail: n?.message || `${t.model || "모델 미설정"} · ${t.hasApiKey ? "저장된 키가 있습니다." : "API Key를 저장하세요."}`
		};
	}), [I, U]);
	return /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "react-settings-route",
		"data-settings-route": !0,
		children: [
			/* @__PURE__ */ (0, f.jsx)(qn, {
				eyebrow: "Settings",
				title: "설정",
				description: "화면, 관심 시장, 자동화와 LLM·외부 데이터·내보내기 연동을 관리합니다.",
				actions: /* @__PURE__ */ (0, f.jsx)("button", {
					className: "btn",
					type: "button",
					onClick: () => ae(!0),
					disabled: B === "load",
					children: B === "load" ? "불러오는 중" : "새로고침"
				})
			}),
			/* @__PURE__ */ (0, f.jsxs)("nav", {
				className: "sub-tabs",
				"aria-label": "설정 하위 탭",
				children: [/* @__PURE__ */ (0, f.jsx)("button", {
					"aria-current": n === "admin" ? "page" : void 0,
					type: "button",
					onClick: () => r("admin"),
					children: "관리"
				}), /* @__PURE__ */ (0, f.jsx)("button", {
					"aria-current": n === "integrations" ? "page" : void 0,
					type: "button",
					onClick: () => r("integrations"),
					children: "연동"
				})]
			}),
			ee && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-error",
				children: ee
			}),
			R && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-warning",
				children: R
			}),
			n === "integrations" ? /* @__PURE__ */ (0, f.jsxs)("div", {
				id: "settings-integrations",
				className: "sub-tab-panel active",
				children: [
					/* @__PURE__ */ (0, f.jsxs)("section", {
						className: "settings-panel input-panel",
						children: [
							/* @__PURE__ */ (0, f.jsx)("div", {
								className: "input-panel-header settings-agent-header",
								children: /* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("h3", { children: "AI Agent 설정" }), /* @__PURE__ */ (0, f.jsx)("p", { children: "보고서와 시장 내러티브 생성에 사용할 Agent 경로를 선택합니다. 비활성화하면 규칙 기반으로 생성합니다." })] })
							}),
							/* @__PURE__ */ (0, f.jsx)("div", {
								className: "settings-grid",
								children: /* @__PURE__ */ (0, f.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "실행 방식" }), /* @__PURE__ */ (0, f.jsxs)("div", {
										className: "settings-agent-mode-row",
										children: [/* @__PURE__ */ (0, f.jsx)(yl, {
											ariaLabel: "AI Agent 사용",
											checked: S,
											onChange: C,
											compact: !0
										}), /* @__PURE__ */ (0, f.jsxs)("div", {
											className: "settings-segmented",
											"aria-label": "AI Agent 실행 방식",
											"data-mode": w,
											children: [/* @__PURE__ */ (0, f.jsx)("button", {
												"aria-pressed": w === "cli",
												type: "button",
												onClick: () => T("cli"),
												children: "LLM CLI"
											}), /* @__PURE__ */ (0, f.jsx)("button", {
												"aria-pressed": w === "api",
												type: "button",
												onClick: () => T("api"),
												children: "LLM API"
											})]
										})]
									})]
								})
							}),
							/* @__PURE__ */ (0, f.jsx)("fieldset", {
								className: "settings-agent-controls",
								disabled: !S,
								children: w === "cli" ? /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [/* @__PURE__ */ (0, f.jsxs)("div", {
									className: "settings-grid",
									children: [/* @__PURE__ */ (0, f.jsxs)("label", {
										className: "field",
										children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "사용할 CLI" }), /* @__PURE__ */ (0, f.jsx)("select", {
											value: E,
											onChange: (e) => D(e.currentTarget.value),
											children: (re.length ? re : [
												{
													id: "codex",
													label: "Codex CLI"
												},
												{
													id: "claude",
													label: "Claude Code CLI"
												},
												{
													id: "antigravity",
													label: "Antigravity CLI"
												}
											]).map((e) => /* @__PURE__ */ (0, f.jsx)("option", {
												value: e.id,
												children: e.label || e.id
											}, e.id))
										})]
									}), /* @__PURE__ */ (0, f.jsxs)("label", {
										className: "field",
										children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "모델" }), /* @__PURE__ */ (0, f.jsx)("select", {
											value: O,
											onChange: (e) => k(e.currentTarget.value),
											children: ie.length ? ie.map((e) => /* @__PURE__ */ (0, f.jsx)("option", {
												value: e.value,
												children: e.label
											}, e.value)) : /* @__PURE__ */ (0, f.jsx)("option", {
												value: "",
												children: "모델 목록 없음"
											})
										})]
									})]
								}), /* @__PURE__ */ (0, f.jsx)("div", {
									className: "cli-provider-list",
									"aria-live": "polite",
									children: re.map((e) => /* @__PURE__ */ (0, f.jsxs)("div", {
										className: "cli-provider-row",
										children: [/* @__PURE__ */ (0, f.jsxs)("div", {
											className: "cli-provider-main",
											children: [/* @__PURE__ */ (0, f.jsxs)("div", {
												className: "cli-provider-head",
												children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: e.label || e.id }), /* @__PURE__ */ (0, f.jsx)("span", {
													className: `cli-chip status-chip ${vl(e)}`,
													children: _l(e)
												})]
											}), /* @__PURE__ */ (0, f.jsx)("div", {
												className: "cli-provider-meta",
												children: e.bridgeSupported === !1 ? e.error || "현재 환경에서 사용할 수 없습니다." : e.model || "모델 미설정"
											})]
										}), e.docsUrl && /* @__PURE__ */ (0, f.jsx)("a", {
											className: "btn",
											href: e.docsUrl,
											target: "_blank",
											rel: "noreferrer",
											children: "문서"
										})]
									}, e.id))
								})] }) : /* @__PURE__ */ (0, f.jsxs)(f.Fragment, { children: [
									/* @__PURE__ */ (0, f.jsxs)("label", {
										className: "field",
										children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "API 제공자" }), /* @__PURE__ */ (0, f.jsxs)("select", {
											value: g,
											onChange: (e) => _(hl(e.currentTarget.value)),
											children: [
												/* @__PURE__ */ (0, f.jsx)("option", {
													value: "openai",
													children: "GPT / OpenAI"
												}),
												/* @__PURE__ */ (0, f.jsx)("option", {
													value: "gemini",
													children: "Gemini / Google"
												}),
												/* @__PURE__ */ (0, f.jsx)("option", {
													value: "claude",
													children: "Claude / Anthropic"
												})
											]
										})]
									}),
									/* @__PURE__ */ (0, f.jsxs)("div", {
										className: "settings-grid",
										children: [/* @__PURE__ */ (0, f.jsxs)("label", {
											className: "field",
											children: [/* @__PURE__ */ (0, f.jsxs)("span", { children: [te.name, " API Key"] }), /* @__PURE__ */ (0, f.jsx)("input", {
												value: v,
												onChange: (e) => y(e.currentTarget.value),
												type: "password",
												autoComplete: "off",
												placeholder: W.hasApiKey ? `${W.apiKeyMasked} 저장됨` : te.key
											})]
										}), /* @__PURE__ */ (0, f.jsxs)("label", {
											className: "field",
											children: [/* @__PURE__ */ (0, f.jsxs)("span", { children: [te.name, " Model"] }), /* @__PURE__ */ (0, f.jsx)("select", {
												value: b,
												onChange: (e) => x(e.currentTarget.value),
												children: ne.length ? ne.map((e) => /* @__PURE__ */ (0, f.jsx)("option", {
													value: e.value,
													children: e.label
												}, e.value)) : /* @__PURE__ */ (0, f.jsx)("option", {
													value: "",
													children: "모델 목록 없음"
												})
											})]
										})]
									}),
									/* @__PURE__ */ (0, f.jsx)("div", {
										className: "cli-provider-list",
										"aria-live": "polite",
										children: me.map(({ providerId: e, row: t, label: n, className: r, detail: i }) => /* @__PURE__ */ (0, f.jsxs)("div", {
											className: "cli-provider-row",
											children: [/* @__PURE__ */ (0, f.jsxs)("div", {
												className: "cli-provider-main",
												children: [/* @__PURE__ */ (0, f.jsxs)("div", {
													className: "cli-provider-head",
													children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: t.label || ml[e].name }), /* @__PURE__ */ (0, f.jsx)("span", {
														className: `cli-chip status-chip ${r}`,
														children: n
													})]
												}), /* @__PURE__ */ (0, f.jsx)("div", {
													className: "cli-provider-meta",
													children: i
												})]
											}), /* @__PURE__ */ (0, f.jsxs)("div", {
												className: "cli-provider-actions",
												children: [/* @__PURE__ */ (0, f.jsx)("button", {
													className: "btn",
													type: "button",
													disabled: !t.hasApiKey || !!I[e]?.checking,
													onClick: () => le(e),
													children: "연결 확인"
												}), t.setupUrl && /* @__PURE__ */ (0, f.jsx)("a", {
													className: "btn",
													href: t.setupUrl,
													target: "_blank",
													rel: "noreferrer",
													children: "API Key 발급"
												})]
											})]
										}, e))
									})
								] })
							}),
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "filter-actions settings-actions",
								children: [/* @__PURE__ */ (0, f.jsx)("button", {
									className: "btn btn--primary",
									type: "button",
									onClick: ce,
									disabled: B === "agent",
									children: "AI Agent 설정 저장"
								}), /* @__PURE__ */ (0, f.jsx)("button", {
									className: "btn",
									type: "button",
									onClick: () => ae(!0),
									disabled: B === "load",
									children: "모델/상태 새로고침"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, f.jsxs)("section", {
						className: "settings-panel input-panel",
						children: [
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "input-panel-header",
								children: [/* @__PURE__ */ (0, f.jsx)("h3", { children: "API 연동" }), /* @__PURE__ */ (0, f.jsx)("p", { children: "외부 데이터 API 키를 설정합니다." })]
							}),
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, f.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "FRED API Key" }), /* @__PURE__ */ (0, f.jsx)("input", {
										value: A.fred,
										onChange: (e) => j({
											...A,
											fred: e.currentTarget.value
										}),
										type: "password",
										autoComplete: "off",
										placeholder: i?.fred?.hasApiKey ? `${i.fred.apiKeyMasked} 저장됨` : "FRED API 키"
									})]
								}), /* @__PURE__ */ (0, f.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "FRED 상태" }), /* @__PURE__ */ (0, f.jsx)("p", {
										className: "section-subtitle",
										children: gl(i?.fred?.hasApiKey, i?.fred?.apiKeyMasked, "딥 리서치 미국 경제지표용 FRED API 키가 없습니다.", "FRED API 키")
									})]
								})]
							}),
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, f.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "BOK API Key" }), /* @__PURE__ */ (0, f.jsx)("input", {
										value: A.bok,
										onChange: (e) => j({
											...A,
											bok: e.currentTarget.value
										}),
										type: "password",
										autoComplete: "off",
										placeholder: i?.bok?.hasApiKey ? `${i.bok.apiKeyMasked} 저장됨` : "BOK ECOS API 키"
									})]
								}), /* @__PURE__ */ (0, f.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "BOK 상태" }), /* @__PURE__ */ (0, f.jsx)("p", {
										className: "section-subtitle",
										children: gl(i?.bok?.hasApiKey, i?.bok?.apiKeyMasked, "딥 리서치 한국 경제지표용 BOK API 키가 없습니다.", "BOK API 키")
									})]
								})]
							}),
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, f.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "DART API Key" }), /* @__PURE__ */ (0, f.jsx)("input", {
										value: A.dart,
										onChange: (e) => j({
											...A,
											dart: e.currentTarget.value
										}),
										type: "password",
										autoComplete: "off",
										placeholder: i?.dart?.hasApiKey ? `${i.dart.apiKeyMasked} 저장됨` : "OpenDART API 키"
									})]
								}), /* @__PURE__ */ (0, f.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "DART 상태" }), /* @__PURE__ */ (0, f.jsx)("p", {
										className: "section-subtitle",
										children: gl(i?.dart?.hasApiKey, i?.dart?.apiKeyMasked, "국내 기업 분석용 DART API 키가 없습니다.", "DART API 키")
									})]
								})]
							}),
							/* @__PURE__ */ (0, f.jsx)("div", {
								className: "filter-actions settings-actions",
								children: /* @__PURE__ */ (0, f.jsx)("button", {
									className: "btn btn--primary",
									type: "button",
									onClick: ue,
									disabled: B === "api",
									children: "API 설정 저장"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, f.jsxs)("section", {
						className: "settings-panel input-panel",
						children: [
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "input-panel-header",
								children: [/* @__PURE__ */ (0, f.jsx)("h3", { children: "Notion 연동" }), /* @__PURE__ */ (0, f.jsx)("p", { children: "브리핑과 보고서를 Notion 데이터베이스로 내보냅니다." })]
							}),
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, f.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "Notion 통합 토큰" }), /* @__PURE__ */ (0, f.jsx)("input", {
										value: M.token,
										onChange: (e) => N({
											...M,
											token: e.currentTarget.value
										}),
										type: "password",
										autoComplete: "off",
										placeholder: i?.notion?.hasToken ? `${i.notion.tokenMasked} 저장됨` : "ntn_..."
									})]
								}), /* @__PURE__ */ (0, f.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "토큰 상태" }), /* @__PURE__ */ (0, f.jsx)("p", {
										className: "section-subtitle",
										children: i?.notion?.hasToken ? `토큰 저장됨: ${i.notion.tokenMasked}` : "Notion 통합 토큰이 없습니다."
									})]
								})]
							}),
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, f.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "데이터베이스 ID" }), /* @__PURE__ */ (0, f.jsx)("input", {
										value: M.dbId,
										onChange: (e) => N({
											...M,
											dbId: e.currentTarget.value
										}),
										placeholder: "32자리 Database ID"
									})]
								}), /* @__PURE__ */ (0, f.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "DB 상태" }), /* @__PURE__ */ (0, f.jsx)("p", {
										className: "section-subtitle",
										children: i?.notion?.hasDb ? `DB 저장됨: ${i.notion.dbIdMasked}` : "Notion 데이터베이스 ID가 없습니다."
									})]
								})]
							}),
							/* @__PURE__ */ (0, f.jsx)("div", {
								className: "filter-actions settings-actions",
								children: /* @__PURE__ */ (0, f.jsx)("button", {
									className: "btn btn--primary",
									type: "button",
									onClick: de,
									disabled: B === "notion",
									children: "Notion 설정 저장"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, f.jsxs)("section", {
						className: "settings-panel input-panel",
						children: [
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "input-panel-header",
								children: [/* @__PURE__ */ (0, f.jsx)("h3", { children: "Obsidian 연동" }), /* @__PURE__ */ (0, f.jsx)("p", { children: "원하면 Obsidian Vault로 보고서와 노트를 내보낼 수 있습니다." })]
							}),
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, f.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "Vault 폴더 경로" }), /* @__PURE__ */ (0, f.jsx)("input", {
										value: P,
										onChange: (e) => F(e.currentTarget.value),
										type: "text",
										placeholder: "C:\\Users\\username\\Documents\\MyVault"
									})]
								}), /* @__PURE__ */ (0, f.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "경로 상태" }), /* @__PURE__ */ (0, f.jsx)("p", {
										className: "section-subtitle",
										children: u.vaultPath ? `설정됨: ${u.vaultPath}` : "Vault 경로가 설정되지 않았습니다."
									})]
								})]
							}),
							/* @__PURE__ */ (0, f.jsx)("div", {
								className: "filter-actions settings-actions",
								children: /* @__PURE__ */ (0, f.jsx)("button", {
									className: "btn btn--primary",
									type: "button",
									onClick: fe,
									disabled: B === "obsidian",
									children: "Obsidian 설정 저장"
								})
							})
						]
					})
				]
			}) : /* @__PURE__ */ (0, f.jsxs)("div", {
				id: "settings-admin",
				className: "sub-tab-panel active",
				children: [
					/* @__PURE__ */ (0, f.jsxs)("section", {
						className: "settings-panel input-panel",
						"data-display-settings": !0,
						children: [
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "input-panel-header",
								children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("h3", { children: "화면" }), /* @__PURE__ */ (0, f.jsx)("p", { children: "이 브라우저의 색상 모드와 움직임 방식을 저장합니다." })] }), /* @__PURE__ */ (0, f.jsxs)("span", {
									className: "settings-theme-status",
									"aria-live": "polite",
									children: ["현재 ", e.resolved === "dark" ? "다크" : "라이트"]
								})]
							}),
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "field",
								children: [/* @__PURE__ */ (0, f.jsx)("span", {
									id: "themePreferenceLabel",
									children: "테마"
								}), /* @__PURE__ */ (0, f.jsx)("div", {
									className: "settings-theme-options",
									role: "group",
									"aria-labelledby": "themePreferenceLabel",
									children: [
										["light", "라이트"],
										["dark", "다크"],
										["system", "시스템"]
									].map(([t, n]) => /* @__PURE__ */ (0, f.jsx)("button", {
										type: "button",
										"aria-pressed": e.preference === t,
										onClick: () => e.setPreference(t),
										children: n
									}, t))
								})]
							}),
							/* @__PURE__ */ (0, f.jsx)("div", {
								className: "settings-grid",
								children: /* @__PURE__ */ (0, f.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "움직임" }), /* @__PURE__ */ (0, f.jsxs)("select", {
										value: t.preferences.motion,
										onChange: (e) => t.setMotion(e.currentTarget.value === "reduced" ? "reduced" : "system"),
										children: [/* @__PURE__ */ (0, f.jsx)("option", {
											value: "system",
											children: "시스템 설정 따르기"
										}), /* @__PURE__ */ (0, f.jsx)("option", {
											value: "reduced",
											children: "움직임 줄이기"
										})]
									})]
								})
							})
						]
					}),
					/* @__PURE__ */ (0, f.jsx)(Sl, {}),
					/* @__PURE__ */ (0, f.jsxs)("section", {
						className: "settings-panel input-panel",
						children: [
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "input-panel-header",
								children: [/* @__PURE__ */ (0, f.jsx)("h3", { children: "자동화" }), /* @__PURE__ */ (0, f.jsx)("p", { children: "수집, 중기 시장 정리, 브리핑 생성을 각각 독립 루틴으로 관리합니다." })]
							}),
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "automation-routines",
								children: [
									/* @__PURE__ */ (0, f.jsxs)("section", {
										className: "automation-card",
										children: [
											/* @__PURE__ */ (0, f.jsxs)("div", {
												className: "automation-card-head",
												children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [
													/* @__PURE__ */ (0, f.jsx)("span", { children: "RSS Collection" }),
													/* @__PURE__ */ (0, f.jsx)("strong", { children: "RSS 수집" }),
													/* @__PURE__ */ (0, f.jsx)("p", { children: "뉴스 피드를 정해진 간격으로 가져와 research inbox와 인덱스에 반영합니다." })
												] }), /* @__PURE__ */ (0, f.jsx)(yl, {
													ariaLabel: "RSS 자동 수집",
													checked: !!c.rss?.enabled,
													onChange: (e) => l({
														...c,
														rss: {
															...c.rss,
															enabled: e
														}
													}),
													compact: !0
												})]
											}),
											/* @__PURE__ */ (0, f.jsxs)("label", {
												className: "field",
												children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "수집 간격" }), /* @__PURE__ */ (0, f.jsxs)("select", {
													value: String(c.rss?.intervalMinutes || 60),
													onChange: (e) => l({
														...c,
														rss: {
															...c.rss,
															intervalMinutes: e.currentTarget.value
														}
													}),
													children: [
														/* @__PURE__ */ (0, f.jsx)("option", {
															value: "15",
															children: "15분마다"
														}),
														/* @__PURE__ */ (0, f.jsx)("option", {
															value: "30",
															children: "30분마다"
														}),
														/* @__PURE__ */ (0, f.jsx)("option", {
															value: "60",
															children: "1시간마다"
														}),
														/* @__PURE__ */ (0, f.jsx)("option", {
															value: "180",
															children: "3시간마다"
														})
													]
												})]
											}),
											/* @__PURE__ */ (0, f.jsxs)("div", {
												className: "automation-inline-switch",
												children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "기사 전문 저장 (무료 공개 본문만, 로컬 보관용)" }), /* @__PURE__ */ (0, f.jsx)(yl, {
													ariaLabel: "기사 전문 저장",
													checked: c.rss?.saveFullText !== !1,
													onChange: (e) => l({
														...c,
														rss: {
															...c.rss,
															saveFullText: e
														}
													}),
													compact: !0
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, f.jsxs)("section", {
										className: "automation-card",
										children: [
											/* @__PURE__ */ (0, f.jsxs)("div", {
												className: "automation-card-head",
												children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [
													/* @__PURE__ */ (0, f.jsx)("span", { children: "Market Memory" }),
													/* @__PURE__ */ (0, f.jsx)("strong", { children: "시장 메모리 업데이트" }),
													/* @__PURE__ */ (0, f.jsx)("p", { children: "최근 RSS와 시장 자료를 중기 시장 판단용 컨텍스트로 정리합니다." })
												] }), /* @__PURE__ */ (0, f.jsx)(yl, {
													ariaLabel: "Market Memory 자동 정리",
													checked: !!c.marketMemory?.enabled,
													onChange: (e) => l({
														...c,
														marketMemory: {
															...c.marketMemory,
															enabled: e
														}
													}),
													compact: !0
												})]
											}),
											/* @__PURE__ */ (0, f.jsxs)("label", {
												className: "field",
												children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "정리 간격" }), /* @__PURE__ */ (0, f.jsxs)("select", {
													value: String(c.marketMemory?.intervalMinutes || 1440),
													onChange: (e) => l({
														...c,
														marketMemory: {
															...c.marketMemory,
															intervalMinutes: e.currentTarget.value
														}
													}),
													children: [
														/* @__PURE__ */ (0, f.jsx)("option", {
															value: "720",
															children: "12시간마다"
														}),
														/* @__PURE__ */ (0, f.jsx)("option", {
															value: "1440",
															children: "하루마다"
														}),
														/* @__PURE__ */ (0, f.jsx)("option", {
															value: "2880",
															children: "이틀마다"
														}),
														/* @__PURE__ */ (0, f.jsx)("option", {
															value: "10080",
															children: "일주일마다"
														})
													]
												})]
											}),
											/* @__PURE__ */ (0, f.jsxs)("div", {
												className: "automation-inline-switch",
												children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "RSS 수집 직후에도 정리" }), /* @__PURE__ */ (0, f.jsx)(yl, {
													ariaLabel: "RSS 수집 직후 Market Memory 정리",
													checked: !!c.marketMemory?.runAfterRss,
													onChange: (e) => l({
														...c,
														marketMemory: {
															...c.marketMemory,
															runAfterRss: e
														}
													}),
													compact: !0
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, f.jsxs)("section", {
										className: "automation-card",
										children: [
											/* @__PURE__ */ (0, f.jsxs)("div", {
												className: "automation-card-head",
												children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [
													/* @__PURE__ */ (0, f.jsx)("span", { children: "Daily Briefing" }),
													/* @__PURE__ */ (0, f.jsx)("strong", { children: "브리핑 생성" }),
													/* @__PURE__ */ (0, f.jsx)("p", { children: "지정한 시각에 RSS와 Market Memory를 반영해 일일 브리핑을 생성합니다." })
												] }), /* @__PURE__ */ (0, f.jsx)(yl, {
													ariaLabel: "일일 브리핑 자동 생성",
													checked: !!c.briefing?.enabled,
													onChange: (e) => l({
														...c,
														briefing: {
															...c.briefing,
															enabled: e
														}
													}),
													compact: !0
												})]
											}),
											/* @__PURE__ */ (0, f.jsxs)("div", {
												className: "settings-grid compact",
												children: [
													/* @__PURE__ */ (0, f.jsxs)("label", {
														className: "field",
														children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "브리핑 시각" }), /* @__PURE__ */ (0, f.jsx)("input", {
															value: c.briefing?.time || "08:00",
															onChange: (e) => l({
																...c,
																briefing: {
																	...c.briefing,
																	time: e.currentTarget.value
																}
															}),
															type: "time"
														})]
													}),
													/* @__PURE__ */ (0, f.jsxs)("label", {
														className: "field",
														children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "시장 범위" }), /* @__PURE__ */ (0, f.jsxs)("select", {
															value: c.briefing?.marketScope || "both",
															onChange: (e) => l({
																...c,
																briefing: {
																	...c.briefing,
																	marketScope: e.currentTarget.value
																}
															}),
															children: [
																/* @__PURE__ */ (0, f.jsx)("option", {
																	value: "all",
																	children: "전체(미국+한국+유럽+일본)"
																}),
																/* @__PURE__ */ (0, f.jsx)("option", {
																	value: "both",
																	children: "미국+한국"
																}),
																/* @__PURE__ */ (0, f.jsx)("option", {
																	value: "us",
																	children: "미국"
																}),
																/* @__PURE__ */ (0, f.jsx)("option", {
																	value: "kr",
																	children: "한국"
																}),
																/* @__PURE__ */ (0, f.jsx)("option", {
																	value: "europe",
																	children: "유럽"
																}),
																/* @__PURE__ */ (0, f.jsx)("option", {
																	value: "jp",
																	children: "일본"
																})
															]
														})]
													}),
													/* @__PURE__ */ (0, f.jsxs)("label", {
														className: "field",
														children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "브리핑 유형" }), /* @__PURE__ */ (0, f.jsx)("select", {
															value: c.briefing?.briefingType || "default",
															onChange: (e) => l({
																...c,
																briefing: {
																	...c.briefing,
																	briefingType: e.currentTarget.value
																}
															}),
															children: Object.entries(xl).map(([e, t]) => /* @__PURE__ */ (0, f.jsx)("option", {
																value: e,
																children: t
															}, e))
														})]
													})
												]
											}),
											/* @__PURE__ */ (0, f.jsxs)("div", {
												className: "automation-inline-switch",
												children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "브리핑 전 RSS/Memory 실행" }), /* @__PURE__ */ (0, f.jsx)(yl, {
													ariaLabel: "브리핑 전 RSS와 Market Memory 실행",
													checked: !!c.briefing?.runPrerequisites,
													onChange: (e) => l({
														...c,
														briefing: {
															...c.briefing,
															runPrerequisites: e
														}
													}),
													compact: !0
												})]
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, f.jsx)("div", {
								className: "filter-actions settings-actions",
								children: /* @__PURE__ */ (0, f.jsx)("button", {
									className: "btn btn--primary",
									type: "button",
									onClick: pe,
									disabled: B === "automation",
									children: "자동화 저장"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, f.jsxs)("section", {
						className: "settings-panel input-panel",
						children: [
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "input-panel-header",
								children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("h3", { children: "캐시 관리" }), /* @__PURE__ */ (0, f.jsx)("p", { children: "기업 분석용 SEC/DART per-company 캐시 중 오래된 항목만 정리합니다. 공통 ticker/corpCode 목록은 삭제하지 않습니다." })] }), /* @__PURE__ */ (0, f.jsx)("button", {
									className: "btn",
									type: "button",
									onClick: oe,
									disabled: B === "cache",
									children: B === "cache" ? "확인 중" : "상태 확인"
								})]
							}),
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "cache-summary",
								children: [/* @__PURE__ */ (0, f.jsxs)("section", { children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "전체 캐시" }), /* @__PURE__ */ (0, f.jsx)("strong", { children: m ? `${m.total_mb || 0} MB` : "상태 미확인" })] }), /* @__PURE__ */ (0, f.jsxs)("section", { children: [/* @__PURE__ */ (0, f.jsx)("span", { children: "정리 대상" }), /* @__PURE__ */ (0, f.jsx)("strong", { children: m ? `${m.stale_mb || 0} MB` : "상태 미확인" })] })]
							}),
							m?.stats?.length ? /* @__PURE__ */ (0, f.jsx)("div", {
								className: "cache-list",
								children: m.stats.map((e) => /* @__PURE__ */ (0, f.jsxs)("div", {
									className: "cache-row",
									children: [
										/* @__PURE__ */ (0, f.jsx)("strong", { children: e.directory }),
										/* @__PURE__ */ (0, f.jsxs)("span", { children: [
											e.files || 0,
											"개 · ",
											e.total_mb || 0,
											"MB"
										] }),
										/* @__PURE__ */ (0, f.jsxs)("small", { children: [
											"오래된 항목 ",
											e.stale_files || 0,
											"개 · 보관 ",
											e.max_age_days || 0,
											"일"
										] })
									]
								}, e.directory || "cache"))
							}) : /* @__PURE__ */ (0, f.jsx)("p", {
								className: "section-subtitle",
								children: "상태 확인을 누르면 캐시 사용량을 확인합니다."
							}),
							/* @__PURE__ */ (0, f.jsx)("div", {
								className: "filter-actions settings-actions",
								children: /* @__PURE__ */ (0, f.jsx)("button", {
									className: "btn btn--primary",
									type: "button",
									onClick: se,
									disabled: B === "cache-cleanup",
									children: B === "cache-cleanup" ? "정리 중" : "오래된 캐시 정리"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, f.jsxs)("section", {
						className: "settings-panel input-panel",
						children: [/* @__PURE__ */ (0, f.jsx)("div", {
							className: "input-panel-header",
							children: /* @__PURE__ */ (0, f.jsxs)("div", { children: [/* @__PURE__ */ (0, f.jsx)("h3", { children: "이전 작업 기록" }), /* @__PURE__ */ (0, f.jsx)("p", { children: "예전 버전이 남긴 작업 기록 파일을 현재 저장소로 한 번만 옮깁니다. 보고서와 제안 파일은 건드리지 않습니다." })] })
						}), /* @__PURE__ */ (0, f.jsx)(fl, {})]
					})
				]
			})
		]
	});
}
//#endregion
//#region src/app/watchlist/ConsultationEntry.tsx
function wl({ item: e }) {
	return /* @__PURE__ */ (0, f.jsx)("button", {
		type: "button",
		className: "btn btn--primary",
		onClick: () => Xs({
			title: `${e} 대화`,
			scope: {
				kind: "watchlist",
				id: e,
				tickers: [e]
			},
			initialMessage: `${e}에 대해 지금 확인해야 할 변화와 장기 thesis 영향을 함께 검토해줘.`
		}),
		children: "짚어보기"
	});
}
//#endregion
//#region src/app/WatchlistRoute.tsx
function Tl(e) {
	let t = /* @__PURE__ */ new Set();
	return e.map((e) => String(e || "").trim()).filter(Boolean).filter((e) => {
		let n = e.toLowerCase();
		return !t.has(n) && (t.add(n), !0);
	});
}
function El(e) {
	return e.ticker || e.item || "";
}
function Dl(e) {
	return e.companyName || e.name || e.item || El(e);
}
function Ol(e, t = "") {
	return e?.company?.name || e?.item || t || "상세 보기";
}
function kl(e) {
	if (!e) return "상세 정보를 불러오는 중입니다.";
	let t = e.company || {};
	return [
		t.ticker || "",
		t.market || "",
		t.tradingViewSymbol || "",
		e.newsCount ? `${e.newsCount}개 뉴스` : ""
	].filter(Boolean).join(" · ") || "확인된 심볼 정보가 없습니다.";
}
function Al(e = []) {
	return [...e].sort((e, t) => String(t.date || "").localeCompare(String(e.date || "")));
}
function jl(e) {
	return e.title || e.url || e.path || "자료";
}
function Ml(e) {
	return [e.source, e.date].filter(Boolean).join(" · ");
}
function Nl(e) {
	window.location.hash = e ? `#/watchlist/${encodeURIComponent(e)}` : "#/watchlist";
}
function Pl() {
	let e = window.location.hash.match(/^#\/?watchlist\/(.+)$/);
	return e ? decodeURIComponent(e[1]) : "";
}
function Fl() {
	return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "watchlist";
}
function Il() {
	let { resolved: e } = ll(), [t, n] = (0, d.useState)([]), [r, i] = (0, d.useState)([]), [a, o] = (0, d.useState)(""), [s, c] = (0, d.useState)(() => Pl()), [l, u] = (0, d.useState)(null), [p, m] = (0, d.useState)(!1), [h, g] = (0, d.useState)(!1), [_, v] = (0, d.useState)(!1), [y, b] = (0, d.useState)(""), [x, S] = (0, d.useState)(""), C = (0, d.useRef)(null), w = (0, d.useCallback)(async (e) => {
		if (!e.length) {
			i([]);
			return;
		}
		let t = await G("/api/watchlist/overview");
		i(Array.isArray(t.items) ? t.items : []);
	}, []), T = (0, d.useCallback)(async () => {
		m(!0), b("");
		try {
			let e = await G("/api/watchlist"), t = Tl(Array.isArray(e) ? e : []);
			n(t), await w(t), q("watchlist", {
				surface: "watchlist",
				viewId: "watchlist",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			b(e instanceof Error ? e.message : "워치리스트를 불러오지 못했습니다.");
		} finally {
			m(!1);
		}
	}, [w]);
	(0, d.useEffect)(() => {
		T();
	}, [T]), (0, d.useEffect)(() => {
		let e = () => {
			Fl() && c(Pl());
		};
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []), (0, d.useEffect)(() => {
		let e = !0;
		async function t(t) {
			g(!0), b(""), u({ item: t }), q("watchlist", {
				surface: "watchlist_detail",
				viewId: "watchlist",
				reportKind: "watchlist",
				reportId: t,
				marketScope: ""
			});
			try {
				let n = await G(`/api/watchlist/detail?item=${encodeURIComponent(t)}&limit=12`);
				if (!e) return;
				u(n);
			} catch (t) {
				if (!e) return;
				b(t instanceof Error ? t.message : "상세 정보를 불러오지 못했습니다.");
			} finally {
				e && g(!1);
			}
		}
		return s ? t(s) : (u(null), q("watchlist", {
			surface: "watchlist",
			viewId: "watchlist",
			reportKind: "",
			reportId: ""
		})), () => {
			e = !1;
		};
	}, [s]), (0, d.useEffect)(() => {
		let e = C.current;
		if (!(!e || !l || h)) return window.FolioTradingViewWidgets?.cleanup?.(e), e.innerHTML = "<div class=\"tradingview-widget-unavailable\">TradingView 위젯을 준비하는 중입니다.</div>", window.FolioTradingViewWidgets?.renderWatchlistDetail?.(e, l), () => {
			window.FolioTradingViewWidgets?.cleanup?.(e);
		};
	}, [
		l,
		h,
		e
	]);
	async function E(e, t) {
		v(!0), b("");
		try {
			let r = await K("/api/watchlist", { items: e }), i = Tl(Array.isArray(r) ? r : []);
			n(i), await w(i), t && S(t);
		} catch (e) {
			b(e instanceof Error ? e.message : "워치리스트 저장에 실패했습니다.");
		} finally {
			v(!1);
		}
	}
	let { resolution: D, pending: O, picked: k, setPicked: A } = Fi(a, { preferHome: !0 }), j = a.trim() ? k ? `${k.name}로 추가합니다.` : O ? "확인 중…" : D?.status === "confident" && D.match ? `${D.match.name}로 추가합니다.` : D?.status === "ambiguous" && D.candidates.some((e) => e.strong) ? "여러 기업이 맞습니다. 고르거나, 이대로 주제 키워드로 추가합니다." : "주제 키워드로 추가합니다." : "종목은 이름이나 티커로, 관심 주제는 그대로 적으면 됩니다.";
	async function M(e) {
		try {
			return (await G(`/api/watchlist/resolve?keyword=${encodeURIComponent(e)}`)).keyword || e;
		} catch {
			return e;
		}
	}
	async function N() {
		let e = a.split(/[,;\n]/).map((e) => e.trim()).filter(Boolean);
		if (!e.length) return;
		let n = [...t];
		for (let t of e) {
			let e = await M(t);
			e && !n.some((t) => t.toLowerCase() === e.toLowerCase()) && n.push(e);
		}
		o(""), n.length !== t.length && await E(n, "워치리스트에 추가했습니다.");
	}
	async function P(e) {
		await E(t.filter((t) => t !== e), "워치리스트에서 삭제했습니다."), s === e && Nl();
	}
	let F = (0, d.useMemo)(() => Al(l?.news || []), [l]), I = Ol(l, s);
	return s ? /* @__PURE__ */ (0, f.jsx)("div", {
		className: "react-watchlist-route",
		"data-watchlist-route": !0,
		children: /* @__PURE__ */ (0, f.jsxs)("div", {
			className: "watchlist-detail-inline",
			children: [/* @__PURE__ */ (0, f.jsxs)("nav", {
				className: "reader-breadcrumb",
				"aria-label": "현재 위치",
				children: [
					/* @__PURE__ */ (0, f.jsx)("button", {
						type: "button",
						className: "reader-crumb-link",
						onClick: () => Nl(),
						children: "워치리스트"
					}),
					/* @__PURE__ */ (0, f.jsx)("span", {
						className: "reader-breadcrumb-sep",
						"aria-hidden": "true",
						children: "›"
					}),
					/* @__PURE__ */ (0, f.jsx)("span", {
						className: "reader-breadcrumb-leaf",
						children: I
					})
				]
			}), /* @__PURE__ */ (0, f.jsxs)("section", {
				className: "watchlist-detail-dialog",
				role: "region",
				"aria-labelledby": "watchlistDetailTitle",
				children: [
					/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "watchlist-detail-head",
						children: [/* @__PURE__ */ (0, f.jsxs)("div", { children: [
							/* @__PURE__ */ (0, f.jsx)("p", {
								className: "section-kicker",
								children: "WATCHLIST"
							}),
							/* @__PURE__ */ (0, f.jsx)("h2", {
								id: "watchlistDetailTitle",
								children: I
							}),
							/* @__PURE__ */ (0, f.jsx)("p", {
								className: "section-subtitle",
								children: kl(l)
							})
						] }), /* @__PURE__ */ (0, f.jsxs)("div", {
							className: "watchlist-detail-actions",
							children: [/* @__PURE__ */ (0, f.jsx)(wl, { item: s }), /* @__PURE__ */ (0, f.jsx)("button", {
								className: "icon-btn",
								type: "button",
								"aria-label": "닫기",
								"data-tooltip": "닫기",
								"data-tooltip-pos": "left",
								onClick: () => Nl(),
								children: "×"
							})]
						})]
					}),
					y && /* @__PURE__ */ (0, f.jsx)("p", {
						className: "react-dashboard-error",
						children: y
					}),
					/* @__PURE__ */ (0, f.jsx)("div", {
						ref: C,
						className: "watchlist-detail-widgets",
						children: /* @__PURE__ */ (0, f.jsx)("div", {
							className: "tradingview-widget-unavailable",
							children: "TradingView 위젯을 준비하는 중입니다."
						})
					}),
					/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "watchlist-detail-news",
						children: [/* @__PURE__ */ (0, f.jsx)("h3", { children: "수집한 뉴스" }), h ? /* @__PURE__ */ (0, f.jsx)("p", {
							className: "section-subtitle",
							children: "관련 뉴스를 불러오는 중입니다."
						}) : F.length ? /* @__PURE__ */ (0, f.jsx)("div", {
							className: "watchlist-detail-news-list",
							children: F.map((e, t) => /* @__PURE__ */ (0, f.jsxs)("article", {
								className: "compact-item",
								children: [
									/* @__PURE__ */ (0, f.jsx)("div", {
										className: "meta",
										children: Ml(e)
									}),
									/* @__PURE__ */ (0, f.jsx)("h4", { children: e.url ? /* @__PURE__ */ (0, f.jsx)("a", {
										href: e.url,
										target: "_blank",
										rel: "noopener noreferrer",
										children: jl(e)
									}) : /* @__PURE__ */ (0, f.jsx)("span", { children: jl(e) }) }),
									e.snippet && /* @__PURE__ */ (0, f.jsx)("p", { children: e.snippet })
								]
							}, `${jl(e)}-${t}`))
						}) : /* @__PURE__ */ (0, f.jsx)("p", {
							className: "section-subtitle",
							children: "수집된 관련 뉴스가 없습니다."
						})]
					})
				]
			})]
		})
	}) : /* @__PURE__ */ (0, f.jsxs)("div", {
		className: "react-watchlist-route",
		"data-watchlist-route": !0,
		children: [
			/* @__PURE__ */ (0, f.jsx)(qn, {
				eyebrow: "Watchlist",
				title: "워치리스트",
				description: "관심 기업, 섹터, 테마를 추적하고 관련 뉴스와 시장 반응을 확인합니다.",
				actions: /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "brief-controls",
					children: [/* @__PURE__ */ (0, f.jsx)("button", {
						className: "btn",
						type: "button",
						onClick: T,
						disabled: p,
						children: p ? "불러오는 중" : "다시 읽기"
					}), /* @__PURE__ */ (0, f.jsx)("button", {
						className: "btn btn--primary",
						type: "button",
						onClick: () => E(t, "워치리스트를 저장했습니다."),
						disabled: _,
						children: _ ? "저장 중" : "저장"
					})]
				})
			}),
			/* @__PURE__ */ (0, f.jsxs)("div", {
				className: "watchlist-editor input-panel",
				children: [
					/* @__PURE__ */ (0, f.jsxs)("div", {
						className: "input-panel-header",
						children: [/* @__PURE__ */ (0, f.jsx)("h3", { children: "키워드 추가" }), /* @__PURE__ */ (0, f.jsx)("p", { children: "관심 기업, 섹터, 테마를 하나씩 추가해 뉴스와 브리핑 추적 범위를 관리합니다." })]
					}),
					/* @__PURE__ */ (0, f.jsxs)("label", {
						className: "portfolio-ticker-field watchlist-add-field",
						children: [
							/* @__PURE__ */ (0, f.jsx)("span", {
								className: "sr-only",
								children: "추가할 종목 또는 키워드"
							}),
							/* @__PURE__ */ (0, f.jsx)("input", {
								value: a,
								onChange: (e) => o(e.currentTarget.value),
								onKeyDown: (e) => {
									e.key === "Enter" && (e.preventDefault(), N());
								},
								placeholder: "예: NVDA, 삼성전자, AI",
								"aria-describedby": "watchlist-resolution",
								autoComplete: "off"
							}),
							D?.status === "ambiguous" && D.candidates.some((e) => e.strong) && !k && /* @__PURE__ */ (0, f.jsx)("div", {
								className: "ticker-suggest",
								role: "listbox",
								"aria-label": "후보 기업",
								children: D.candidates.map((e) => /* @__PURE__ */ (0, f.jsxs)("button", {
									type: "button",
									role: "option",
									"aria-selected": !1,
									onClick: () => {
										A(e), o(e.name);
									},
									children: [/* @__PURE__ */ (0, f.jsx)("strong", { children: e.ticker }), /* @__PURE__ */ (0, f.jsx)("span", { children: e.name })]
								}, `${e.market}:${e.ticker}`))
							})
						]
					}),
					/* @__PURE__ */ (0, f.jsx)("button", {
						className: "btn",
						type: "button",
						onClick: N,
						disabled: _,
						children: "추가"
					})
				]
			}),
			/* @__PURE__ */ (0, f.jsx)("p", {
				className: "analysis-resolution",
				id: "watchlist-resolution",
				"data-status": a.trim() ? k ? "picked" : D?.status || "idle" : "idle",
				children: j
			}),
			y && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-error",
				children: y
			}),
			x && /* @__PURE__ */ (0, f.jsx)("p", {
				className: "react-dashboard-warning",
				children: x
			}),
			/* @__PURE__ */ (0, f.jsx)("div", {
				className: "watchlist-grid",
				children: r.length ? r.map((e) => {
					let t = e.item || Dl(e);
					return /* @__PURE__ */ (0, f.jsxs)("article", {
						className: "watchlist-card",
						"data-watchlist-detail-item": t,
						tabIndex: 0,
						role: "button",
						"aria-label": `${t} 상세 보기`,
						onClick: () => Nl(t),
						onKeyDown: (e) => {
							(e.key === "Enter" || e.key === " ") && (e.preventDefault(), Nl(t));
						},
						children: [
							/* @__PURE__ */ (0, f.jsx)("span", {
								className: "watchlist-card-accent",
								"aria-hidden": "true"
							}),
							/* @__PURE__ */ (0, f.jsx)("button", {
								className: "watchlist-card-delete",
								type: "button",
								"aria-label": `${t} 워치리스트에서 삭제`,
								"data-tooltip": "삭제",
								"data-tooltip-pos": "bottom",
								onClick: (e) => {
									e.stopPropagation(), P(t);
								},
								children: /* @__PURE__ */ (0, f.jsx)("svg", {
									width: "13",
									height: "13",
									viewBox: "0 0 16 16",
									fill: "none",
									stroke: "currentColor",
									strokeWidth: "1.4",
									strokeLinecap: "round",
									strokeLinejoin: "round",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, f.jsx)("path", { d: "M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" })
								})
							}),
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "watchlist-card-top",
								children: [/* @__PURE__ */ (0, f.jsx)("strong", {
									className: "watchlist-ticker",
									children: El(e)
								}), /* @__PURE__ */ (0, f.jsx)("h3", { children: Dl(e) })]
							}),
							/* @__PURE__ */ (0, f.jsxs)("div", {
								className: "watchlist-card-meta",
								children: [e.tags?.length ? /* @__PURE__ */ (0, f.jsx)("div", {
									className: "tags",
									children: e.tags.slice(0, 5).map((e) => /* @__PURE__ */ (0, f.jsx)("span", {
										className: "tag",
										children: e
									}, e))
								}) : null, /* @__PURE__ */ (0, f.jsxs)("span", {
									className: "watchlist-news-count",
									children: [e.count || 0, "건"]
								})]
							})
						]
					}, t);
				}) : /* @__PURE__ */ (0, f.jsx)("div", {
					className: "result",
					children: /* @__PURE__ */ (0, f.jsx)("p", { children: "워치리스트 항목을 저장하면 항목별 최신 뉴스 카드가 표시됩니다." })
				})
			})
		]
	});
}
//#endregion
//#region src/app/statusStore.ts
var Ll = {
	statusText: "",
	docCount: "",
	activeJobId: null
};
function Rl() {
	return Ll;
}
function zl() {
	let [e, t] = (0, d.useState)(() => Rl());
	return (0, d.useEffect)(() => {
		let e = () => t(Rl());
		e();
		let n = window.setInterval(e, 1e3);
		return () => window.clearInterval(n);
	}, []), e;
}
//#endregion
//#region src/app/AppShell.tsx
var Bl = [
	{
		id: "home",
		title: "홈",
		routes: ["home", "dashboard"]
	},
	{
		id: "portfolio",
		title: "투자",
		routes: ["watchlist", "portfolio"]
	},
	{
		id: "news",
		title: "뉴스",
		routes: [
			"briefing",
			"rss",
			"market-memory"
		]
	},
	{
		id: "research",
		title: "리서치",
		routes: ["analysis", "deep-research"]
	},
	{
		id: "system",
		title: "시스템",
		routes: ["settings"]
	}
], Vl = {
	home: /* @__PURE__ */ (0, f.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, f.jsx)("path", { d: "M3 10.5 12 3l9 7.5" }), /* @__PURE__ */ (0, f.jsx)("path", { d: "M5 9.5V21h5v-6h4v6h5V9.5" })]
	}),
	dashboard: /* @__PURE__ */ (0, f.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, f.jsx)("rect", {
				x: "3",
				y: "3",
				width: "7",
				height: "8",
				rx: "1.5"
			}),
			/* @__PURE__ */ (0, f.jsx)("rect", {
				x: "14",
				y: "3",
				width: "7",
				height: "5",
				rx: "1.5"
			}),
			/* @__PURE__ */ (0, f.jsx)("rect", {
				x: "14",
				y: "12",
				width: "7",
				height: "9",
				rx: "1.5"
			}),
			/* @__PURE__ */ (0, f.jsx)("rect", {
				x: "3",
				y: "15",
				width: "7",
				height: "6",
				rx: "1.5"
			})
		]
	}),
	briefing: /* @__PURE__ */ (0, f.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, f.jsx)("path", { d: "M4 5h12.5v14H5.5A1.5 1.5 0 0 1 4 17.5z" }),
			/* @__PURE__ */ (0, f.jsx)("path", { d: "M16.5 8H20v9a2 2 0 0 1-2 2h-1.5" }),
			/* @__PURE__ */ (0, f.jsx)("path", { d: "M7.5 9h6" }),
			/* @__PURE__ */ (0, f.jsx)("path", { d: "M7.5 13h6" }),
			/* @__PURE__ */ (0, f.jsx)("path", { d: "M7.5 16.5h3.5" })
		]
	}),
	rss: /* @__PURE__ */ (0, f.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, f.jsx)("path", {
				fill: "currentColor",
				stroke: "none",
				d: "M8 8H6v7c0 1.1.9 2 2 2h9v-2H8V8z"
			}),
			/* @__PURE__ */ (0, f.jsx)("path", {
				fill: "currentColor",
				stroke: "none",
				d: "M20 3h-8c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 8h-8V7h8v4z"
			}),
			/* @__PURE__ */ (0, f.jsx)("path", {
				fill: "currentColor",
				stroke: "none",
				d: "M4 12H2v7c0 1.1.9 2 2 2h9v-2H4v-7z"
			})
		]
	}),
	"market-memory": /* @__PURE__ */ (0, f.jsx)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, f.jsx)("path", { d: "M22 12h-4l-3 8-6-16-3 8H2" })
	}),
	analysis: /* @__PURE__ */ (0, f.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, f.jsx)("path", { d: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" }),
			/* @__PURE__ */ (0, f.jsx)("path", { d: "M14 3v6h6" }),
			/* @__PURE__ */ (0, f.jsx)("path", { d: "M8 17v-3" }),
			/* @__PURE__ */ (0, f.jsx)("path", { d: "M12 17v-6" }),
			/* @__PURE__ */ (0, f.jsx)("path", { d: "M16 17v-4" })
		]
	}),
	"deep-research": /* @__PURE__ */ (0, f.jsx)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, f.jsx)("path", { d: "M14 11H8m2 4H8m8-8H8m12 3.5V6.8c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311C17.72 2 16.88 2 15.2 2H8.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C4 4.28 4 5.12 4 6.8v10.4c0 1.68 0 2.52.327 3.162a3 3 0 0 0 1.311 1.311C6.28 22 7.12 22 8.8 22h2.7M22 22l-1.5-1.5m1-2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0" })
	}),
	watchlist: /* @__PURE__ */ (0, f.jsx)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, f.jsx)("path", { d: "M12 13V7m-3 3h6m4 11V7.8c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311C16.72 3 15.88 3 14.2 3H9.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C5 5.28 5 6.12 5 7.8V21l7-4z" })
	}),
	portfolio: /* @__PURE__ */ (0, f.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, f.jsx)("path", { d: "M3 7.5h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }),
			/* @__PURE__ */ (0, f.jsx)("path", { d: "M8 7.5V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2.5" }),
			/* @__PURE__ */ (0, f.jsx)("path", { d: "M3 12h18M10 12v2h4v-2" })
		]
	}),
	settings: /* @__PURE__ */ (0, f.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, f.jsx)("path", { d: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" }), /* @__PURE__ */ (0, f.jsx)("path", { d: "M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06A2 2 0 1 1 7.22 3.43l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.34.4.7.6 1a1.7 1.7 0 0 0 1.1.4H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.1.4c-.17.14-.31.28-.41.2Z" })]
	})
}, Hl = "(max-width: 1024px)";
function Ul() {
	return typeof window < "u" && window.matchMedia(Hl).matches;
}
function Wl() {
	let e = window.location.hash || Di(il());
	return /^#\/?office(?:\/|$)/.test(e) ? (window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#/home`), Di("home")) : e;
}
function Gl() {
	let [e, t] = (0, d.useState)(() => Wl());
	return (0, d.useEffect)(() => {
		let e = () => t(Wl());
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []), {
		hash: e,
		routeId: Ei(e)
	};
}
async function Kl(e) {
	await new Promise((e) => window.setTimeout(e, 1500));
	let t = Date.now() + 6e4;
	for (; Date.now() < t;) {
		try {
			if ((await fetch("/api/dashboard", { cache: "no-store" })).ok) {
				e("재시작 완료 · 새로고침 중"), window.location.reload();
				return;
			}
		} catch {}
		await new Promise((e) => window.setTimeout(e, 1e3));
	}
	e("재시작 확인 실패 · 수동 새로고침 필요");
}
function ql() {
	let { hash: e, routeId: t } = Gl(), n = Oi(t), r = il(al().preferences), i = zl(), [a, o] = (0, d.useState)(() => localStorage.getItem("folio.react.navCollapsed") === "1"), s = (0, d.useRef)(!1), [c, l] = (0, d.useState)(() => {
		let e = localStorage.getItem("folio.react.agentClosed"), t = e === null || e !== "1";
		return t && Ul() ? (s.current = !0, !1) : t;
	}), [u, p] = (0, d.useState)(() => /* @__PURE__ */ new Set([t])), [m, h] = (0, d.useState)(() => ({ [t]: Wl() })), [g, _] = (0, d.useState)(""), [v, y] = (0, d.useState)(!1), b = (0, d.useRef)(null), x = (0, d.useRef)(t), S = (0, d.useRef)(!1), C = (0, d.useRef)({}), w = n.id !== "home", T = w && c ? " is-agent-open" : " is-agent-closed";
	(0, d.useEffect)(() => {
		tt(n.id, {
			surface: `react_${n.id}`,
			viewId: n.id
		});
	}, [n.id]), (0, d.useEffect)(() => {
		localStorage.setItem("folio.react.navCollapsed", a ? "1" : "0");
	}, [a]), (0, d.useEffect)(() => {
		if (s.current) {
			s.current = !1;
			return;
		}
		localStorage.setItem("folio.react.agentClosed", c ? "0" : "1");
	}, [c]), (0, d.useEffect)(() => {
		let e = window.matchMedia(Hl), t = (e) => {
			e.matches && l((e) => e && (s.current = !0, !1));
		};
		return e.addEventListener("change", t), () => e.removeEventListener("change", t);
	}, []), (0, d.useEffect)(() => {
		p((e) => {
			if (e.has(t)) return e;
			let n = new Set(e);
			return n.add(t), n;
		});
	}, [t]), (0, d.useEffect)(() => {
		h((n) => n[t] === e ? n : {
			...n,
			[t]: e
		});
	}, [e, t]), (0, d.useEffect)(() => {
		if (!S.current) {
			S.current = !0, x.current = t;
			return;
		}
		let e = b.current, n = x.current;
		e && (C.current[n] = e.scrollTop, window.requestAnimationFrame(() => {
			e.scrollTop = C.current[t] || 0, e.focus({ preventScroll: !0 });
		})), x.current = t;
	}, [t]), (0, d.useEffect)(() => {
		let e = window.FolioBridge ?? {}, t = e.openAgentDock;
		return window.FolioBridge = {
			...e,
			openAgentDock(e = {}) {
				l(!0), window.dispatchEvent(new CustomEvent("folio:react-agent-request", { detail: e }));
			}
		}, () => {
			window.FolioBridge && (window.FolioBridge.openAgentDock = t);
		};
	}, []);
	async function E() {
		if (!v) {
			y(!0), _("재시작 요청 중");
			try {
				await fetch("/api/server/restart", {
					method: "POST",
					body: "{}"
				});
			} catch {}
			_("서버 재시작 중"), await Kl(_), y(!1);
		}
	}
	function D(e) {
		let t = m[e] || Di(e);
		window.location.hash !== t && (window.location.hash = t);
	}
	function O(e) {
		let t = Oi(e);
		return t.id === "home" ? /* @__PURE__ */ (0, f.jsx)(cn, {}) : t.id === "dashboard" ? /* @__PURE__ */ (0, f.jsx)(fo, {}) : t.id === "briefing" ? /* @__PURE__ */ (0, f.jsx)(Si, {}) : t.id === "rss" ? /* @__PURE__ */ (0, f.jsx)(Gc, {}) : t.id === "market-memory" ? /* @__PURE__ */ (0, f.jsx)(Js, {}) : t.id === "analysis" ? /* @__PURE__ */ (0, f.jsx)(Pa, {}) : t.id === "deep-research" ? /* @__PURE__ */ (0, f.jsx)(ls, {}) : t.id === "watchlist" ? /* @__PURE__ */ (0, f.jsx)(Il, {}) : t.id === "portfolio" ? /* @__PURE__ */ (0, f.jsx)(Qs, {}) : t.id === "settings" ? /* @__PURE__ */ (0, f.jsx)(Cl, {}) : null;
	}
	return /* @__PURE__ */ (0, f.jsxs)("div", {
		className: `react-shell${a ? " is-nav-collapsed" : ""}${T}${w ? "" : " is-agent-suppressed"}`,
		children: [
			/* @__PURE__ */ (0, f.jsx)("a", {
				className: "react-skip-link",
				href: "#folio-main-content",
				onClick: (e) => {
					e.preventDefault(), window.requestAnimationFrame(() => b.current?.focus({ preventScroll: !0 }));
				},
				children: "본문으로 건너뛰기"
			}),
			/* @__PURE__ */ (0, f.jsxs)("header", {
				className: "react-shell-topbar",
				children: [/* @__PURE__ */ (0, f.jsxs)("button", {
					type: "button",
					className: "react-shell-brand",
					onClick: () => {
						D(r);
					},
					"aria-label": "홈으로 이동",
					children: [/* @__PURE__ */ (0, f.jsx)(Zt, {}), /* @__PURE__ */ (0, f.jsx)("small", { children: "Investment Workspace" })]
				}), /* @__PURE__ */ (0, f.jsxs)("div", {
					className: "react-shell-status",
					"aria-live": "polite",
					children: [
						/* @__PURE__ */ (0, f.jsx)("span", { children: g || i.statusText || "준비됨" }),
						i.activeJobId && /* @__PURE__ */ (0, f.jsx)("span", { children: i.activeJobId }),
						/* @__PURE__ */ (0, f.jsx)("button", {
							className: "btn btn--sm",
							type: "button",
							onClick: E,
							disabled: v,
							children: v ? "재시작 중" : "재시작"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, f.jsxs)("aside", {
				className: "react-shell-nav",
				"aria-label": "주요 화면 탐색",
				children: [/* @__PURE__ */ (0, f.jsx)("button", {
					className: "react-shell-nav-toggle",
					type: "button",
					"aria-label": a ? "좌측 사이드바 펼치기" : "좌측 사이드바 접기",
					"aria-expanded": !a,
					onClick: () => o((e) => !e),
					children: /* @__PURE__ */ (0, f.jsx)("svg", {
						viewBox: "0 0 16 16",
						fill: "none",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, f.jsx)("path", { d: "M10 3.5 L5.5 8 L10 12.5" })
					})
				}), /* @__PURE__ */ (0, f.jsxs)("nav", {
					className: "react-left-nav",
					"aria-label": "Folio OS 화면",
					children: [/* @__PURE__ */ (0, f.jsx)("div", {
						className: "react-left-nav-title",
						children: "Navigate"
					}), Bl.map((e) => /* @__PURE__ */ (0, f.jsxs)("section", {
						className: "react-left-nav-group",
						"data-nav-group": e.id,
						children: [/* @__PURE__ */ (0, f.jsx)("h3", { children: e.title }), /* @__PURE__ */ (0, f.jsx)("div", {
							className: "react-left-nav-items",
							children: e.routes.map((t) => {
								let i = e.title === "Home" ? r : t, a = wi.find((e) => e.id === i);
								return a ? /* @__PURE__ */ (0, f.jsxs)("span", {
									className: "react-left-nav-entry",
									children: [e.id === "home" && a.id === "dashboard" && /* @__PURE__ */ (0, f.jsx)("span", {
										className: "react-left-nav-separator",
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, f.jsxs)("button", {
										type: "button",
										"data-tooltip": a.label,
										"data-qa": a.id === "deep-research" ? "nav-deep-research" : void 0,
										className: "react-left-nav-item",
										"aria-current": a.id === n.id ? "page" : void 0,
										onClick: () => {
											D(a.id);
										},
										children: [/* @__PURE__ */ (0, f.jsx)("span", {
											className: "react-left-nav-icon",
											"aria-hidden": "true",
											children: Vl[a.id]
										}), /* @__PURE__ */ (0, f.jsx)("span", {
											className: "react-left-nav-label",
											children: a.label
										})]
									})]
								}, a.id) : null;
							})
						})]
					}, e.id))]
				})]
			}),
			/* @__PURE__ */ (0, f.jsx)("main", {
				className: "react-shell-main",
				id: "folio-main-content",
				children: /* @__PURE__ */ (0, f.jsx)("section", {
					className: "react-route-host",
					"data-route": n.id,
					ref: b,
					tabIndex: -1,
					children: Ci.filter((e) => u.has(e.id)).map((e) => /* @__PURE__ */ (0, f.jsx)("div", {
						className: "react-route-pane",
						"data-route-pane": e.id,
						hidden: e.id !== n.id,
						children: O(e.id)
					}, e.id))
				})
			}),
			w && /* @__PURE__ */ (0, f.jsx)(Mc, {
				surface: `react_${n.id}`,
				open: c,
				onOpen: () => l(!0),
				onClose: () => l(!1)
			}),
			/* @__PURE__ */ (0, f.jsx)(Ni, {})
		]
	});
}
//#endregion
//#region src/app/App.tsx
function Jl() {
	return /* @__PURE__ */ (0, f.jsx)(ql, {});
}
//#endregion
//#region src/main.tsx
var Yl = { "market-state": () => /* @__PURE__ */ (0, f.jsx)(ks, {}) };
function Xl() {
	document.querySelectorAll("[data-react-island]").forEach((e) => {
		let t = Yl[e.dataset.reactIsland || ""];
		!t || e.dataset.reactMounted === "1" || (e.dataset.reactMounted = "1", (0, u.createRoot)(e).render(/* @__PURE__ */ (0, f.jsx)(d.StrictMode, { children: t() })));
	});
}
function Zl() {
	let e = document.getElementById("folioReactRoot");
	return e ? e.dataset.reactMounted === "1" || (e.dataset.reactMounted = "1", (0, u.createRoot)(e).render(/* @__PURE__ */ (0, f.jsx)(d.StrictMode, { children: /* @__PURE__ */ (0, f.jsx)(Jl, {}) })), !0) : !1;
}
function Ql() {
	Zl(), Xl();
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", Ql) : Ql();
//#endregion
