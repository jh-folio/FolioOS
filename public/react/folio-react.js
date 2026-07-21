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
		(i === null ? r || !(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N" : i.type !== 0) && (_(t, n, i, r) && (n = null), r || i === null ? h(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : i.mustUseProperty ? e[i.propertyName] = n === null ? i.type === 3 ? !1 : "" : n : (t = i.attributeName, r = i.attributeNamespace, n === null ? e.removeAttribute(t) : (i = i.type, n = i === 3 || i === 4 && !0 === n ? "" : "" + n, r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
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
	var H = !1;
	function U(e, t) {
		if (!e || H) return "";
		H = !0;
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
			H = !1, Error.prepareStackTrace = n;
		}
		return (e = e ? e.displayName || e.name : "") ? V(e) : "";
	}
	function W(e) {
		switch (e.tag) {
			case 5: return V(e.type);
			case 16: return V("Lazy");
			case 13: return V("Suspense");
			case 19: return V("SuspenseList");
			case 0:
			case 2:
			case 15: return e = U(e.type, !1), e;
			case 11: return e = U(e.type.render, !1), e;
			case 1: return e = U(e.type, !0), e;
			default: return "";
		}
	}
	function ee(e) {
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
			case P: return t = e.displayName || null, t === null ? ee(e.type) || "Memo" : t;
			case F:
				t = e._payload, e = e._init;
				try {
					return ee(e(t));
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
			case 16: return ee(t);
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
	function re(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function ie(e) {
		var t = re(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), r = "" + e[t];
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
	function ae(e) {
		e._valueTracker ||= ie(e);
	}
	function oe(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = re(e) ? e.checked ? "true" : "false" : e.value), e = r, e === n ? !1 : (t.setValue(e), !0);
	}
	function se(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	function ce(e, t) {
		var n = t.checked;
		return z({}, t, {
			defaultChecked: void 0,
			defaultValue: void 0,
			value: void 0,
			checked: n ?? e._wrapperState.initialChecked
		});
	}
	function le(e, t) {
		var n = t.defaultValue == null ? "" : t.defaultValue, r = t.checked == null ? t.defaultChecked : t.checked;
		n = ne(t.value == null ? n : t.value), e._wrapperState = {
			initialChecked: r,
			initialValue: n,
			controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null
		};
	}
	function ue(e, t) {
		t = t.checked, t != null && S(e, "checked", t, !1);
	}
	function de(e, t) {
		ue(e, t);
		var n = ne(t.value), r = t.type;
		if (n != null) r === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
		else if (r === "submit" || r === "reset") {
			e.removeAttribute("value");
			return;
		}
		t.hasOwnProperty("value") ? pe(e, t.type, n) : t.hasOwnProperty("defaultValue") && pe(e, t.type, ne(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
	}
	function fe(e, t, n) {
		if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
			var r = t.type;
			if (!(r !== "submit" && r !== "reset" || t.value !== void 0 && t.value !== null)) return;
			t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
		}
		n = e.name, n !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
	}
	function pe(e, t, n) {
		(t !== "number" || se(e.ownerDocument) !== e) && (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
	}
	var me = Array.isArray;
	function he(e, t, n, r) {
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
	function ge(e, t) {
		if (t.dangerouslySetInnerHTML != null) throw Error(a(91));
		return z({}, t, {
			value: void 0,
			defaultValue: void 0,
			children: "" + e._wrapperState.initialValue
		});
	}
	function _e(e, t) {
		var n = t.value;
		if (n == null) {
			if (n = t.children, t = t.defaultValue, n != null) {
				if (t != null) throw Error(a(92));
				if (me(n)) {
					if (1 < n.length) throw Error(a(93));
					n = n[0];
				}
				t = n;
			}
			t ??= "", n = t;
		}
		e._wrapperState = { initialValue: ne(n) };
	}
	function ve(e, t) {
		var n = ne(t.value), r = ne(t.defaultValue);
		n != null && (n = "" + n, n !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), r != null && (e.defaultValue = "" + r);
	}
	function ye(e) {
		var t = e.textContent;
		t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
	}
	function be(e) {
		switch (e) {
			case "svg": return "http://www.w3.org/2000/svg";
			case "math": return "http://www.w3.org/1998/Math/MathML";
			default: return "http://www.w3.org/1999/xhtml";
		}
	}
	function xe(e, t) {
		return e == null || e === "http://www.w3.org/1999/xhtml" ? be(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
	}
	var Se, Ce = function(e) {
		return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, r, i) {
			MSApp.execUnsafeLocalFunction(function() {
				return e(t, n, r, i);
			});
		} : e;
	}(function(e, t) {
		if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e) e.innerHTML = t;
		else {
			for (Se ||= document.createElement("div"), Se.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = Se.firstChild; e.firstChild;) e.removeChild(e.firstChild);
			for (; t.firstChild;) e.appendChild(t.firstChild);
		}
	});
	function we(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var Te = {
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
	}, Ee = [
		"Webkit",
		"ms",
		"Moz",
		"O"
	];
	Object.keys(Te).forEach(function(e) {
		Ee.forEach(function(t) {
			t = t + e.charAt(0).toUpperCase() + e.substring(1), Te[t] = Te[e];
		});
	});
	function De(e, t, n) {
		return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || Te.hasOwnProperty(e) && Te[e] ? ("" + t).trim() : t + "px";
	}
	function Oe(e, t) {
		for (var n in e = e.style, t) if (t.hasOwnProperty(n)) {
			var r = n.indexOf("--") === 0, i = De(n, t[n], r);
			n === "float" && (n = "cssFloat"), r ? e.setProperty(n, i) : e[n] = i;
		}
	}
	var ke = z({ menuitem: !0 }, {
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
	function Ae(e, t) {
		if (t) {
			if (ke[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(a(137, e));
			if (t.dangerouslySetInnerHTML != null) {
				if (t.children != null) throw Error(a(60));
				if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(a(61));
			}
			if (t.style != null && typeof t.style != "object") throw Error(a(62));
		}
	}
	function je(e, t) {
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
	var Me = null;
	function Ne(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var Pe = null, Fe = null, Ie = null;
	function Le(e) {
		if (e = Ii(e)) {
			if (typeof Pe != "function") throw Error(a(280));
			var t = e.stateNode;
			t && (t = Ri(t), Pe(e.stateNode, e.type, t));
		}
	}
	function Re(e) {
		Fe ? Ie ? Ie.push(e) : Ie = [e] : Fe = e;
	}
	function ze() {
		if (Fe) {
			var e = Fe, t = Ie;
			if (Ie = Fe = null, Le(e), t) for (e = 0; e < t.length; e++) Le(t[e]);
		}
	}
	function Be(e, t) {
		return e(t);
	}
	function Ve() {}
	var He = !1;
	function Ue(e, t, n) {
		if (He) return e(t, n);
		He = !0;
		try {
			return Be(e, t, n);
		} finally {
			He = !1, (Fe !== null || Ie !== null) && (Ve(), ze());
		}
	}
	function We(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = Ri(n);
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
				(r = !r.disabled) || (e = e.type, r = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !r;
				break a;
			default: e = !1;
		}
		if (e) return null;
		if (n && typeof n != "function") throw Error(a(231, t, typeof n));
		return n;
	}
	var Ge = !1;
	if (u) try {
		var Ke = {};
		Object.defineProperty(Ke, "passive", { get: function() {
			Ge = !0;
		} }), window.addEventListener("test", Ke, Ke), window.removeEventListener("test", Ke, Ke);
	} catch {
		Ge = !1;
	}
	function qe(e, t, n, r, i, a, o, s, c) {
		var l = Array.prototype.slice.call(arguments, 3);
		try {
			t.apply(n, l);
		} catch (e) {
			this.onError(e);
		}
	}
	var Je = !1, Ye = null, Xe = !1, Ze = null, Qe = { onError: function(e) {
		Je = !0, Ye = e;
	} };
	function $e(e, t, n, r, i, a, o, s, c) {
		Je = !1, Ye = null, qe.apply(Qe, arguments);
	}
	function et(e, t, n, r, i, o, s, c, l) {
		if ($e.apply(this, arguments), Je) {
			if (Je) {
				var u = Ye;
				Je = !1, Ye = null;
			} else throw Error(a(198));
			Xe || (Xe = !0, Ze = u);
		}
	}
	function tt(e) {
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
	function nt(e) {
		if (e.tag === 13) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function rt(e) {
		if (tt(e) !== e) throw Error(a(188));
	}
	function it(e) {
		var t = e.alternate;
		if (!t) {
			if (t = tt(e), t === null) throw Error(a(188));
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
					if (o === n) return rt(i), e;
					if (o === r) return rt(i), t;
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
	function at(e) {
		return e = it(e), e === null ? null : ot(e);
	}
	function ot(e) {
		if (e.tag === 5 || e.tag === 6) return e;
		for (e = e.child; e !== null;) {
			var t = ot(e);
			if (t !== null) return t;
			e = e.sibling;
		}
		return null;
	}
	var st = r.unstable_scheduleCallback, ct = r.unstable_cancelCallback, lt = r.unstable_shouldYield, ut = r.unstable_requestPaint, dt = r.unstable_now, ft = r.unstable_getCurrentPriorityLevel, pt = r.unstable_ImmediatePriority, mt = r.unstable_UserBlockingPriority, ht = r.unstable_NormalPriority, gt = r.unstable_LowPriority, _t = r.unstable_IdlePriority, vt = null, yt = null;
	function bt(e) {
		if (yt && typeof yt.onCommitFiberRoot == "function") try {
			yt.onCommitFiberRoot(vt, e, void 0, (e.current.flags & 128) == 128);
		} catch {}
	}
	var xt = Math.clz32 ? Math.clz32 : wt, St = Math.log, Ct = Math.LN2;
	function wt(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (St(e) / Ct | 0) | 0;
	}
	var Tt = 64, Et = 4194304;
	function Dt(e) {
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
	function Ot(e, t) {
		var n = e.pendingLanes;
		if (n === 0) return 0;
		var r = 0, i = e.suspendedLanes, a = e.pingedLanes, o = n & 268435455;
		if (o !== 0) {
			var s = o & ~i;
			s === 0 ? (a &= o, a !== 0 && (r = Dt(a))) : r = Dt(s);
		} else o = n & ~i, o === 0 ? a !== 0 && (r = Dt(a)) : r = Dt(o);
		if (r === 0) return 0;
		if (t !== 0 && t !== r && (t & i) === 0 && (i = r & -r, a = t & -t, i >= a || i === 16 && a & 4194240)) return t;
		if (r & 4 && (r |= n & 16), t = e.entangledLanes, t !== 0) for (e = e.entanglements, t &= r; 0 < t;) n = 31 - xt(t), i = 1 << n, r |= e[n], t &= ~i;
		return r;
	}
	function kt(e, t) {
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
	function At(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes; 0 < a;) {
			var o = 31 - xt(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = kt(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
	}
	function jt(e) {
		return e = e.pendingLanes & -1073741825, e === 0 ? e & 1073741824 ? 1073741824 : 0 : e;
	}
	function Mt() {
		var e = Tt;
		return Tt <<= 1, !(Tt & 4194240) && (Tt = 64), e;
	}
	function Nt(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function Pt(e, t, n) {
		e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - xt(t), e[t] = n;
	}
	function Ft(e, t) {
		var n = e.pendingLanes & ~t;
		e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
		var r = e.eventTimes;
		for (e = e.expirationTimes; 0 < n;) {
			var i = 31 - xt(n), a = 1 << i;
			t[i] = 0, r[i] = -1, e[i] = -1, n &= ~a;
		}
	}
	function It(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - xt(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	var G = 0;
	function Lt(e) {
		return e &= -e, 1 < e ? 4 < e ? e & 268435455 ? 16 : 536870912 : 4 : 1;
	}
	var Rt, zt, Bt, Vt, Ht, Ut = !1, Wt = [], Gt = null, Kt = null, qt = null, Jt = /* @__PURE__ */ new Map(), Yt = /* @__PURE__ */ new Map(), Xt = [], Zt = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
	function Qt(e, t) {
		switch (e) {
			case "focusin":
			case "focusout":
				Gt = null;
				break;
			case "dragenter":
			case "dragleave":
				Kt = null;
				break;
			case "mouseover":
			case "mouseout":
				qt = null;
				break;
			case "pointerover":
			case "pointerout":
				Jt.delete(t.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": Yt.delete(t.pointerId);
		}
	}
	function $t(e, t, n, r, i, a) {
		return e === null || e.nativeEvent !== a ? (e = {
			blockedOn: t,
			domEventName: n,
			eventSystemFlags: r,
			nativeEvent: a,
			targetContainers: [i]
		}, t !== null && (t = Ii(t), t !== null && zt(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
	}
	function en(e, t, n, r, i) {
		switch (t) {
			case "focusin": return Gt = $t(Gt, e, t, n, r, i), !0;
			case "dragenter": return Kt = $t(Kt, e, t, n, r, i), !0;
			case "mouseover": return qt = $t(qt, e, t, n, r, i), !0;
			case "pointerover":
				var a = i.pointerId;
				return Jt.set(a, $t(Jt.get(a) || null, e, t, n, r, i)), !0;
			case "gotpointercapture": return a = i.pointerId, Yt.set(a, $t(Yt.get(a) || null, e, t, n, r, i)), !0;
		}
		return !1;
	}
	function tn(e) {
		var t = Fi(e.target);
		if (t !== null) {
			var n = tt(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = nt(n), t !== null) {
						e.blockedOn = t, Ht(e.priority, function() {
							Bt(n);
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
	function nn(e) {
		if (e.blockedOn !== null) return !1;
		for (var t = e.targetContainers; 0 < t.length;) {
			var n = mn(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
			if (n === null) {
				n = e.nativeEvent;
				var r = new n.constructor(n.type, n);
				Me = r, n.target.dispatchEvent(r), Me = null;
			} else return t = Ii(n), t !== null && zt(t), e.blockedOn = n, !1;
			t.shift();
		}
		return !0;
	}
	function rn(e, t, n) {
		nn(e) && n.delete(t);
	}
	function an() {
		Ut = !1, Gt !== null && nn(Gt) && (Gt = null), Kt !== null && nn(Kt) && (Kt = null), qt !== null && nn(qt) && (qt = null), Jt.forEach(rn), Yt.forEach(rn);
	}
	function on(e, t) {
		e.blockedOn === t && (e.blockedOn = null, Ut || (Ut = !0, r.unstable_scheduleCallback(r.unstable_NormalPriority, an)));
	}
	function sn(e) {
		function t(t) {
			return on(t, e);
		}
		if (0 < Wt.length) {
			on(Wt[0], e);
			for (var n = 1; n < Wt.length; n++) {
				var r = Wt[n];
				r.blockedOn === e && (r.blockedOn = null);
			}
		}
		for (Gt !== null && on(Gt, e), Kt !== null && on(Kt, e), qt !== null && on(qt, e), Jt.forEach(t), Yt.forEach(t), n = 0; n < Xt.length; n++) r = Xt[n], r.blockedOn === e && (r.blockedOn = null);
		for (; 0 < Xt.length && (n = Xt[0], n.blockedOn === null);) tn(n), n.blockedOn === null && Xt.shift();
	}
	var cn = C.ReactCurrentBatchConfig, ln = !0;
	function un(e, t, n, r) {
		var i = G, a = cn.transition;
		cn.transition = null;
		try {
			G = 1, fn(e, t, n, r);
		} finally {
			G = i, cn.transition = a;
		}
	}
	function dn(e, t, n, r) {
		var i = G, a = cn.transition;
		cn.transition = null;
		try {
			G = 4, fn(e, t, n, r);
		} finally {
			G = i, cn.transition = a;
		}
	}
	function fn(e, t, n, r) {
		if (ln) {
			var i = mn(e, t, n, r);
			if (i === null) si(e, t, r, pn, n), Qt(e, r);
			else if (en(i, e, t, n, r)) r.stopPropagation();
			else if (Qt(e, r), t & 4 && -1 < Zt.indexOf(e)) {
				for (; i !== null;) {
					var a = Ii(i);
					if (a !== null && Rt(a), a = mn(e, t, n, r), a === null && si(e, t, r, pn, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else si(e, t, r, null, n);
		}
	}
	var pn = null;
	function mn(e, t, n, r) {
		if (pn = null, e = Ne(r), e = Fi(e), e !== null) if (t = tt(e), t === null) e = null;
		else if (n = t.tag, n === 13) {
			if (e = nt(t), e !== null) return e;
			e = null;
		} else if (n === 3) {
			if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
			e = null;
		} else t !== e && (e = null);
		return pn = e, null;
	}
	function hn(e) {
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
			case "message": switch (ft()) {
				case pt: return 1;
				case mt: return 4;
				case ht:
				case gt: return 16;
				case _t: return 536870912;
				default: return 16;
			}
			default: return 16;
		}
	}
	var gn = null, _n = null, vn = null;
	function yn() {
		if (vn) return vn;
		var e, t = _n, n = t.length, r, i = "value" in gn ? gn.value : gn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return vn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function bn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function xn() {
		return !0;
	}
	function Sn() {
		return !1;
	}
	function Cn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? xn : Sn, this.isPropagationStopped = Sn, this;
		}
		return z(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = xn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = xn);
			},
			persist: function() {},
			isPersistent: xn
		}), t;
	}
	var wn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, Tn = Cn(wn), En = z({}, wn, {
		view: 0,
		detail: 0
	}), Dn = Cn(En), On, kn, An, jn = z({}, En, {
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
		getModifierState: Hn,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== An && (An && e.type === "mousemove" ? (On = e.screenX - An.screenX, kn = e.screenY - An.screenY) : kn = On = 0, An = e), On);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : kn;
		}
	}), Mn = Cn(jn), Nn = Cn(z({}, jn, { dataTransfer: 0 })), Pn = Cn(z({}, En, { relatedTarget: 0 })), Fn = Cn(z({}, wn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), In = Cn(z({}, wn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), Ln = Cn(z({}, wn, { data: 0 })), Rn = {
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
	}, zn = {
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
	}, Bn = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function Vn(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = Bn[e]) ? !!t[e] : !1;
	}
	function Hn() {
		return Vn;
	}
	var Un = Cn(z({}, En, {
		key: function(e) {
			if (e.key) {
				var t = Rn[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = bn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? zn[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: Hn,
		charCode: function(e) {
			return e.type === "keypress" ? bn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? bn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), Wn = Cn(z({}, jn, {
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
	})), Gn = Cn(z({}, En, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Hn
	})), Kn = Cn(z({}, wn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), qn = Cn(z({}, jn, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), Jn = [
		9,
		13,
		27,
		32
	], Yn = u && "CompositionEvent" in window, Xn = null;
	u && "documentMode" in document && (Xn = document.documentMode);
	var Zn = u && "TextEvent" in window && !Xn, Qn = u && (!Yn || Xn && 8 < Xn && 11 >= Xn), $n = " ", er = !1;
	function tr(e, t) {
		switch (e) {
			case "keyup": return Jn.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function nr(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var rr = !1;
	function ir(e, t) {
		switch (e) {
			case "compositionend": return nr(t);
			case "keypress": return t.which === 32 ? (er = !0, $n) : null;
			case "textInput": return e = t.data, e === $n && er ? null : e;
			default: return null;
		}
	}
	function ar(e, t) {
		if (rr) return e === "compositionend" || !Yn && tr(e, t) ? (e = yn(), vn = _n = gn = null, rr = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return Qn && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var or = {
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
	function sr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!or[e.type] : t === "textarea";
	}
	function cr(e, t, n, r) {
		Re(r), t = li(t, "onChange"), 0 < t.length && (n = new Tn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var lr = null, ur = null;
	function dr(e) {
		ni(e, 0);
	}
	function fr(e) {
		if (oe(Li(e))) return e;
	}
	function pr(e, t) {
		if (e === "change") return t;
	}
	var mr = !1;
	if (u) {
		var hr;
		if (u) {
			var gr = "oninput" in document;
			if (!gr) {
				var _r = document.createElement("div");
				_r.setAttribute("oninput", "return;"), gr = typeof _r.oninput == "function";
			}
			hr = gr;
		} else hr = !1;
		mr = hr && (!document.documentMode || 9 < document.documentMode);
	}
	function vr() {
		lr && (lr.detachEvent("onpropertychange", yr), ur = lr = null);
	}
	function yr(e) {
		if (e.propertyName === "value" && fr(ur)) {
			var t = [];
			cr(t, ur, e, Ne(e)), Ue(dr, t);
		}
	}
	function br(e, t, n) {
		e === "focusin" ? (vr(), lr = t, ur = n, lr.attachEvent("onpropertychange", yr)) : e === "focusout" && vr();
	}
	function xr(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return fr(ur);
	}
	function Sr(e, t) {
		if (e === "click") return fr(t);
	}
	function Cr(e, t) {
		if (e === "input" || e === "change") return fr(t);
	}
	function wr(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var Tr = typeof Object.is == "function" ? Object.is : wr;
	function Er(e, t) {
		if (Tr(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!d.call(t, i) || !Tr(e[i], t[i])) return !1;
		}
		return !0;
	}
	function Dr(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function Or(e, t) {
		var n = Dr(e);
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
			n = Dr(n);
		}
	}
	function kr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? kr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function Ar() {
		for (var e = window, t = se(); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = se(e.document);
		}
		return t;
	}
	function jr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	function Mr(e) {
		var t = Ar(), n = e.focusedElem, r = e.selectionRange;
		if (t !== n && n && n.ownerDocument && kr(n.ownerDocument.documentElement, n)) {
			if (r !== null && jr(n)) {
				if (t = r.start, e = r.end, e === void 0 && (e = t), "selectionStart" in n) n.selectionStart = t, n.selectionEnd = Math.min(e, n.value.length);
				else if (e = (t = n.ownerDocument || document) && t.defaultView || window, e.getSelection) {
					e = e.getSelection();
					var i = n.textContent.length, a = Math.min(r.start, i);
					r = r.end === void 0 ? a : Math.min(r.end, i), !e.extend && a > r && (i = r, r = a, a = i), i = Or(n, a);
					var o = Or(n, r);
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
	var Nr = u && "documentMode" in document && 11 >= document.documentMode, Pr = null, Fr = null, Ir = null, Lr = !1;
	function Rr(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		Lr || Pr == null || Pr !== se(r) || (r = Pr, "selectionStart" in r && jr(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), Ir && Er(Ir, r) || (Ir = r, r = li(Fr, "onSelect"), 0 < r.length && (t = new Tn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = Pr)));
	}
	function zr(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var Br = {
		animationend: zr("Animation", "AnimationEnd"),
		animationiteration: zr("Animation", "AnimationIteration"),
		animationstart: zr("Animation", "AnimationStart"),
		transitionend: zr("Transition", "TransitionEnd")
	}, Vr = {}, Hr = {};
	u && (Hr = document.createElement("div").style, "AnimationEvent" in window || (delete Br.animationend.animation, delete Br.animationiteration.animation, delete Br.animationstart.animation), "TransitionEvent" in window || delete Br.transitionend.transition);
	function Ur(e) {
		if (Vr[e]) return Vr[e];
		if (!Br[e]) return e;
		var t = Br[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in Hr) return Vr[e] = t[n];
		return e;
	}
	var Wr = Ur("animationend"), Gr = Ur("animationiteration"), Kr = Ur("animationstart"), qr = Ur("transitionend"), Jr = /* @__PURE__ */ new Map(), Yr = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	function Xr(e, t) {
		Jr.set(e, t), c(t, [e]);
	}
	for (var Zr = 0; Zr < Yr.length; Zr++) {
		var Qr = Yr[Zr];
		Xr(Qr.toLowerCase(), "on" + (Qr[0].toUpperCase() + Qr.slice(1)));
	}
	Xr(Wr, "onAnimationEnd"), Xr(Gr, "onAnimationIteration"), Xr(Kr, "onAnimationStart"), Xr("dblclick", "onDoubleClick"), Xr("focusin", "onFocus"), Xr("focusout", "onBlur"), Xr(qr, "onTransitionEnd"), l("onMouseEnter", ["mouseout", "mouseover"]), l("onMouseLeave", ["mouseout", "mouseover"]), l("onPointerEnter", ["pointerout", "pointerover"]), l("onPointerLeave", ["pointerout", "pointerover"]), c("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), c("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), c("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), c("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), c("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), c("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
	var $r = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), ei = new Set("cancel close invalid load scroll toggle".split(" ").concat($r));
	function ti(e, t, n) {
		var r = e.type || "unknown-event";
		e.currentTarget = n, et(r, t, void 0, e), e.currentTarget = null;
	}
	function ni(e, t) {
		t = (t & 4) != 0;
		for (var n = 0; n < e.length; n++) {
			var r = e[n], i = r.event;
			r = r.listeners;
			a: {
				var a = void 0;
				if (t) for (var o = r.length - 1; 0 <= o; o--) {
					var s = r[o], c = s.instance, l = s.currentTarget;
					if (s = s.listener, c !== a && i.isPropagationStopped()) break a;
					ti(i, s, l), a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					ti(i, s, l), a = c;
				}
			}
		}
		if (Xe) throw e = Ze, Xe = !1, Ze = null, e;
	}
	function K(e, t) {
		var n = t[Mi];
		n === void 0 && (n = t[Mi] = /* @__PURE__ */ new Set());
		var r = e + "__bubble";
		n.has(r) || (oi(t, e, 2, !1), n.add(r));
	}
	function ri(e, t, n) {
		var r = 0;
		t && (r |= 4), oi(n, e, r, t);
	}
	var ii = "_reactListening" + Math.random().toString(36).slice(2);
	function ai(e) {
		if (!e[ii]) {
			e[ii] = !0, o.forEach(function(t) {
				t !== "selectionchange" && (ei.has(t) || ri(t, !1, e), ri(t, !0, e));
			});
			var t = e.nodeType === 9 ? e : e.ownerDocument;
			t === null || t[ii] || (t[ii] = !0, ri("selectionchange", !1, t));
		}
	}
	function oi(e, t, n, r) {
		switch (hn(t)) {
			case 1:
				var i = un;
				break;
			case 4:
				i = dn;
				break;
			default: i = fn;
		}
		n = i.bind(null, t, n, e), i = void 0, !Ge || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
			capture: !0,
			passive: i
		}) : i === void 0 ? e.addEventListener(t, n, !1) : e.addEventListener(t, n, { passive: i });
	}
	function si(e, t, n, r, i) {
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
					if (o = Fi(s), o === null) return;
					if (c = o.tag, c === 5 || c === 6) {
						r = a = o;
						continue a;
					}
					s = s.parentNode;
				}
			}
			r = r.return;
		}
		Ue(function() {
			var r = a, i = Ne(n), o = [];
			a: {
				var s = Jr.get(e);
				if (s !== void 0) {
					var c = Tn, l = e;
					switch (e) {
						case "keypress": if (bn(n) === 0) break a;
						case "keydown":
						case "keyup":
							c = Un;
							break;
						case "focusin":
							l = "focus", c = Pn;
							break;
						case "focusout":
							l = "blur", c = Pn;
							break;
						case "beforeblur":
						case "afterblur":
							c = Pn;
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
							c = Mn;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							c = Nn;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							c = Gn;
							break;
						case Wr:
						case Gr:
						case Kr:
							c = Fn;
							break;
						case qr:
							c = Kn;
							break;
						case "scroll":
							c = Dn;
							break;
						case "wheel":
							c = qn;
							break;
						case "copy":
						case "cut":
						case "paste":
							c = In;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup": c = Wn;
					}
					var u = (t & 4) != 0, d = !u && e === "scroll", f = u ? s === null ? null : s + "Capture" : s;
					u = [];
					for (var p = r, m; p !== null;) {
						m = p;
						var h = m.stateNode;
						if (m.tag === 5 && h !== null && (m = h, f !== null && (h = We(p, f), h != null && u.push(ci(p, h, m)))), d) break;
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
					if (s = e === "mouseover" || e === "pointerover", c = e === "mouseout" || e === "pointerout", s && n !== Me && (l = n.relatedTarget || n.fromElement) && (Fi(l) || l[ji])) break a;
					if ((c || s) && (s = i.window === i ? i : (s = i.ownerDocument) ? s.defaultView || s.parentWindow : window, c ? (l = n.relatedTarget || n.toElement, c = r, l = l ? Fi(l) : null, l !== null && (d = tt(l), l !== d || l.tag !== 5 && l.tag !== 6) && (l = null)) : (c = null, l = r), c !== l)) {
						if (u = Mn, h = "onMouseLeave", f = "onMouseEnter", p = "mouse", (e === "pointerout" || e === "pointerover") && (u = Wn, h = "onPointerLeave", f = "onPointerEnter", p = "pointer"), d = c == null ? s : Li(c), m = l == null ? s : Li(l), s = new u(h, p + "leave", c, n, i), s.target = d, s.relatedTarget = m, h = null, Fi(i) === r && (u = new u(f, p + "enter", l, n, i), u.target = m, u.relatedTarget = d, h = u), d = h, c && l) b: {
							for (u = c, f = l, p = 0, m = u; m; m = ui(m)) p++;
							for (m = 0, h = f; h; h = ui(h)) m++;
							for (; 0 < p - m;) u = ui(u), p--;
							for (; 0 < m - p;) f = ui(f), m--;
							for (; p--;) {
								if (u === f || f !== null && u === f.alternate) break b;
								u = ui(u), f = ui(f);
							}
							u = null;
						}
						else u = null;
						c !== null && di(o, s, c, u, !1), l !== null && d !== null && di(o, d, l, u, !0);
					}
				}
				a: {
					if (s = r ? Li(r) : window, c = s.nodeName && s.nodeName.toLowerCase(), c === "select" || c === "input" && s.type === "file") var g = pr;
					else if (sr(s)) if (mr) g = Cr;
					else {
						g = xr;
						var _ = br;
					}
					else (c = s.nodeName) && c.toLowerCase() === "input" && (s.type === "checkbox" || s.type === "radio") && (g = Sr);
					if (g &&= g(e, r)) {
						cr(o, g, n, i);
						break a;
					}
					_ && _(e, s, r), e === "focusout" && (_ = s._wrapperState) && _.controlled && s.type === "number" && pe(s, "number", s.value);
				}
				switch (_ = r ? Li(r) : window, e) {
					case "focusin":
						(sr(_) || _.contentEditable === "true") && (Pr = _, Fr = r, Ir = null);
						break;
					case "focusout":
						Ir = Fr = Pr = null;
						break;
					case "mousedown":
						Lr = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						Lr = !1, Rr(o, n, i);
						break;
					case "selectionchange": if (Nr) break;
					case "keydown":
					case "keyup": Rr(o, n, i);
				}
				var v;
				if (Yn) b: {
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
				else rr ? tr(e, n) && (y = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (y = "onCompositionStart");
				y && (Qn && n.locale !== "ko" && (rr || y !== "onCompositionStart" ? y === "onCompositionEnd" && rr && (v = yn()) : (gn = i, _n = "value" in gn ? gn.value : gn.textContent, rr = !0)), _ = li(r, y), 0 < _.length && (y = new Ln(y, e, null, n, i), o.push({
					event: y,
					listeners: _
				}), v ? y.data = v : (v = nr(n), v !== null && (y.data = v)))), (v = Zn ? ir(e, n) : ar(e, n)) && (r = li(r, "onBeforeInput"), 0 < r.length && (i = new Ln("onBeforeInput", "beforeinput", null, n, i), o.push({
					event: i,
					listeners: r
				}), i.data = v));
			}
			ni(o, t);
		});
	}
	function ci(e, t, n) {
		return {
			instance: e,
			listener: t,
			currentTarget: n
		};
	}
	function li(e, t) {
		for (var n = t + "Capture", r = []; e !== null;) {
			var i = e, a = i.stateNode;
			i.tag === 5 && a !== null && (i = a, a = We(e, n), a != null && r.unshift(ci(e, a, i)), a = We(e, t), a != null && r.push(ci(e, a, i))), e = e.return;
		}
		return r;
	}
	function ui(e) {
		if (e === null) return null;
		do
			e = e.return;
		while (e && e.tag !== 5);
		return e || null;
	}
	function di(e, t, n, r, i) {
		for (var a = t._reactName, o = []; n !== null && n !== r;) {
			var s = n, c = s.alternate, l = s.stateNode;
			if (c !== null && c === r) break;
			s.tag === 5 && l !== null && (s = l, i ? (c = We(n, a), c != null && o.unshift(ci(n, c, s))) : i || (c = We(n, a), c != null && o.push(ci(n, c, s)))), n = n.return;
		}
		o.length !== 0 && e.push({
			event: t,
			listeners: o
		});
	}
	var fi = /\r\n?/g, pi = /\u0000|\uFFFD/g;
	function mi(e) {
		return (typeof e == "string" ? e : "" + e).replace(fi, "\n").replace(pi, "");
	}
	function hi(e, t, n) {
		if (t = mi(t), mi(e) !== t && n) throw Error(a(425));
	}
	function gi() {}
	var _i = null, vi = null;
	function yi(e, t) {
		return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
	}
	var bi = typeof setTimeout == "function" ? setTimeout : void 0, xi = typeof clearTimeout == "function" ? clearTimeout : void 0, Si = typeof Promise == "function" ? Promise : void 0, Ci = typeof queueMicrotask == "function" ? queueMicrotask : Si === void 0 ? bi : function(e) {
		return Si.resolve(null).then(e).catch(wi);
	};
	function wi(e) {
		setTimeout(function() {
			throw e;
		});
	}
	function Ti(e, t) {
		var n = t, r = 0;
		do {
			var i = n.nextSibling;
			if (e.removeChild(n), i && i.nodeType === 8) if (n = i.data, n === "/$") {
				if (r === 0) {
					e.removeChild(i), sn(t);
					return;
				}
				r--;
			} else n !== "$" && n !== "$?" && n !== "$!" || r++;
			n = i;
		} while (n);
		sn(t);
	}
	function Ei(e) {
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
	function Di(e) {
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
	var Oi = Math.random().toString(36).slice(2), ki = "__reactFiber$" + Oi, Ai = "__reactProps$" + Oi, ji = "__reactContainer$" + Oi, Mi = "__reactEvents$" + Oi, Ni = "__reactListeners$" + Oi, Pi = "__reactHandles$" + Oi;
	function Fi(e) {
		var t = e[ki];
		if (t) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[ji] || n[ki]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = Di(e); e !== null;) {
					if (n = e[ki]) return n;
					e = Di(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function Ii(e) {
		return e = e[ki] || e[ji], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
	}
	function Li(e) {
		if (e.tag === 5 || e.tag === 6) return e.stateNode;
		throw Error(a(33));
	}
	function Ri(e) {
		return e[Ai] || null;
	}
	var zi = [], Bi = -1;
	function Vi(e) {
		return { current: e };
	}
	function q(e) {
		0 > Bi || (e.current = zi[Bi], zi[Bi] = null, Bi--);
	}
	function J(e, t) {
		Bi++, zi[Bi] = e.current, e.current = t;
	}
	var Hi = {}, Ui = Vi(Hi), Wi = Vi(!1), Gi = Hi;
	function Ki(e, t) {
		var n = e.type.contextTypes;
		if (!n) return Hi;
		var r = e.stateNode;
		if (r && r.__reactInternalMemoizedUnmaskedChildContext === t) return r.__reactInternalMemoizedMaskedChildContext;
		var i = {}, a;
		for (a in n) i[a] = t[a];
		return r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = i), i;
	}
	function qi(e) {
		return e = e.childContextTypes, e != null;
	}
	function Ji() {
		q(Wi), q(Ui);
	}
	function Yi(e, t, n) {
		if (Ui.current !== Hi) throw Error(a(168));
		J(Ui, t), J(Wi, n);
	}
	function Xi(e, t, n) {
		var r = e.stateNode;
		if (t = t.childContextTypes, typeof r.getChildContext != "function") return n;
		for (var i in r = r.getChildContext(), r) if (!(i in t)) throw Error(a(108, te(e) || "Unknown", i));
		return z({}, n, r);
	}
	function Zi(e) {
		return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || Hi, Gi = Ui.current, J(Ui, e), J(Wi, Wi.current), !0;
	}
	function Qi(e, t, n) {
		var r = e.stateNode;
		if (!r) throw Error(a(169));
		n ? (e = Xi(e, t, Gi), r.__reactInternalMemoizedMergedChildContext = e, q(Wi), q(Ui), J(Ui, e)) : q(Wi), J(Wi, n);
	}
	var $i = null, ea = !1, ta = !1;
	function na(e) {
		$i === null ? $i = [e] : $i.push(e);
	}
	function ra(e) {
		ea = !0, na(e);
	}
	function ia() {
		if (!ta && $i !== null) {
			ta = !0;
			var e = 0, t = G;
			try {
				var n = $i;
				for (G = 1; e < n.length; e++) {
					var r = n[e];
					do
						r = r(!0);
					while (r !== null);
				}
				$i = null, ea = !1;
			} catch (t) {
				throw $i !== null && ($i = $i.slice(e + 1)), st(pt, ia), t;
			} finally {
				G = t, ta = !1;
			}
		}
		return null;
	}
	var aa = [], oa = 0, sa = null, ca = 0, la = [], ua = 0, da = null, fa = 1, pa = "";
	function ma(e, t) {
		aa[oa++] = ca, aa[oa++] = sa, sa = e, ca = t;
	}
	function ha(e, t, n) {
		la[ua++] = fa, la[ua++] = pa, la[ua++] = da, da = e;
		var r = fa;
		e = pa;
		var i = 32 - xt(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - xt(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, fa = 1 << 32 - xt(t) + i | n << i | r, pa = a + e;
		} else fa = 1 << a | n << i | r, pa = e;
	}
	function ga(e) {
		e.return !== null && (ma(e, 1), ha(e, 1, 0));
	}
	function _a(e) {
		for (; e === sa;) sa = aa[--oa], aa[oa] = null, ca = aa[--oa], aa[oa] = null;
		for (; e === da;) da = la[--ua], la[ua] = null, pa = la[--ua], la[ua] = null, fa = la[--ua], la[ua] = null;
	}
	var va = null, ya = null, Y = !1, ba = null;
	function xa(e, t) {
		var n = Kl(5, null, null, 0);
		n.elementType = "DELETED", n.stateNode = t, n.return = e, t = e.deletions, t === null ? (e.deletions = [n], e.flags |= 16) : t.push(n);
	}
	function Sa(e, t) {
		switch (e.tag) {
			case 5:
				var n = e.type;
				return t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t === null ? !1 : (e.stateNode = t, va = e, ya = Ei(t.firstChild), !0);
			case 6: return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t === null ? !1 : (e.stateNode = t, va = e, ya = null, !0);
			case 13: return t = t.nodeType === 8 ? t : null, t === null ? !1 : (n = da === null ? null : {
				id: fa,
				overflow: pa
			}, e.memoizedState = {
				dehydrated: t,
				treeContext: n,
				retryLane: 1073741824
			}, n = Kl(18, null, null, 0), n.stateNode = t, n.return = e, e.child = n, va = e, ya = null, !0);
			default: return !1;
		}
	}
	function Ca(e) {
		return (e.mode & 1) != 0 && (e.flags & 128) == 0;
	}
	function wa(e) {
		if (Y) {
			var t = ya;
			if (t) {
				var n = t;
				if (!Sa(e, t)) {
					if (Ca(e)) throw Error(a(418));
					t = Ei(n.nextSibling);
					var r = va;
					t && Sa(e, t) ? xa(r, n) : (e.flags = e.flags & -4097 | 2, Y = !1, va = e);
				}
			} else {
				if (Ca(e)) throw Error(a(418));
				e.flags = e.flags & -4097 | 2, Y = !1, va = e;
			}
		}
	}
	function Ta(e) {
		for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13;) e = e.return;
		va = e;
	}
	function Ea(e) {
		if (e !== va) return !1;
		if (!Y) return Ta(e), Y = !0, !1;
		var t;
		if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !yi(e.type, e.memoizedProps)), t &&= ya) {
			if (Ca(e)) throw Da(), Error(a(418));
			for (; t;) xa(e, t), t = Ei(t.nextSibling);
		}
		if (Ta(e), e.tag === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(a(317));
			a: {
				for (e = e.nextSibling, t = 0; e;) {
					if (e.nodeType === 8) {
						var n = e.data;
						if (n === "/$") {
							if (t === 0) {
								ya = Ei(e.nextSibling);
								break a;
							}
							t--;
						} else n !== "$" && n !== "$!" && n !== "$?" || t++;
					}
					e = e.nextSibling;
				}
				ya = null;
			}
		} else ya = va ? Ei(e.stateNode.nextSibling) : null;
		return !0;
	}
	function Da() {
		for (var e = ya; e;) e = Ei(e.nextSibling);
	}
	function Oa() {
		ya = va = null, Y = !1;
	}
	function ka(e) {
		ba === null ? ba = [e] : ba.push(e);
	}
	var Aa = C.ReactCurrentBatchConfig;
	function ja(e, t, n) {
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
	function Ma(e, t) {
		throw e = Object.prototype.toString.call(t), Error(a(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
	}
	function Na(e) {
		var t = e._init;
		return t(e._payload);
	}
	function Pa(e) {
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
			return a === E ? d(e, t, n.props.children, r, n.key) : t !== null && (t.elementType === a || typeof a == "object" && a && a.$$typeof === F && Na(a) === t.type) ? (r = i(t, n.props), r.ref = ja(e, t, n), r.return = e, r) : (r = Xl(n.type, n.key, n.props, null, e.mode, r), r.ref = ja(e, t, n), r.return = e, r);
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
					case w: return n = Xl(t.type, t.key, t.props, null, e.mode, n), n.ref = ja(e, null, t), n.return = e, n;
					case T: return t = eu(t, e.mode, n), t.return = e, t;
					case F:
						var r = t._init;
						return f(e, r(t._payload), n);
				}
				if (me(t) || R(t)) return t = Zl(t, e.mode, n, null), t.return = e, t;
				Ma(e, t);
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
				if (me(n) || R(n)) return i === null ? d(e, t, n, r, null) : null;
				Ma(e, n);
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
				if (me(r) || R(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				Ma(t, r);
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
			if (h === s.length) return n(i, d), Y && ma(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
				return Y && ma(i, h), l;
			}
			for (d = r(i, d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && g.alternate !== null && d.delete(g.key === null ? h : g.key), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), Y && ma(i, h), l;
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
			if (v.done) return n(i, h), Y && ma(i, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(i, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
				return Y && ma(i, g), u;
			}
			for (h = r(i, h); !v.done; g++, v = c.next()) v = m(h, i, g, v.value, l), v !== null && (e && v.alternate !== null && h.delete(v.key === null ? g : v.key), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(i, e);
			}), Y && ma(i, g), u;
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
									} else if (l.elementType === c || typeof c == "object" && c && c.$$typeof === F && Na(c) === l.type) {
										n(e, l.sibling), r = i(l, a.props), r.ref = ja(e, l, a), r.return = e, e = r;
										break a;
									}
									n(e, l);
									break;
								} else t(e, l);
								l = l.sibling;
							}
							a.type === E ? (r = Zl(a.props.children, e.mode, o, a.key), r.return = e, e = r) : (o = Xl(a.type, a.key, a.props, null, e.mode, o), o.ref = ja(e, r, a), o.return = e, e = o);
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
								else t(e, r);
								r = r.sibling;
							}
							r = eu(a, e.mode, o), r.return = e, e = r;
						}
						return s(e);
					case F: return l = a._init, _(e, r, l(a._payload), o);
				}
				if (me(a)) return h(e, r, a, o);
				if (R(a)) return g(e, r, a, o);
				Ma(e, a);
			}
			return typeof a == "string" && a !== "" || typeof a == "number" ? (a = "" + a, r !== null && r.tag === 6 ? (n(e, r.sibling), r = i(r, a), r.return = e, e = r) : (n(e, r), r = $l(a, e.mode, o), r.return = e, e = r), s(e)) : n(e, r);
		}
		return _;
	}
	var Fa = Pa(!0), Ia = Pa(!1), La = Vi(null), Ra = null, za = null, Ba = null;
	function Va() {
		Ba = za = Ra = null;
	}
	function Ha(e) {
		var t = La.current;
		q(La), e._currentValue = t;
	}
	function Ua(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function Wa(e, t) {
		Ra = e, Ba = za = null, e = e.dependencies, e !== null && e.firstContext !== null && ((e.lanes & t) !== 0 && (Ms = !0), e.firstContext = null);
	}
	function Ga(e) {
		var t = e._currentValue;
		if (Ba !== e) if (e = {
			context: e,
			memoizedValue: t,
			next: null
		}, za === null) {
			if (Ra === null) throw Error(a(308));
			za = e, Ra.dependencies = {
				lanes: 0,
				firstContext: e
			};
		} else za = za.next = e;
		return t;
	}
	var Ka = null;
	function qa(e) {
		Ka === null ? Ka = [e] : Ka.push(e);
	}
	function Ja(e, t, n, r) {
		var i = t.interleaved;
		return i === null ? (n.next = n, qa(t)) : (n.next = i.next, i.next = n), t.interleaved = n, Ya(e, r);
	}
	function Ya(e, t) {
		e.lanes |= t;
		var n = e.alternate;
		for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null;) e.childLanes |= t, n = e.alternate, n !== null && (n.childLanes |= t), n = e, e = e.return;
		return n.tag === 3 ? n.stateNode : null;
	}
	var Xa = !1;
	function Za(e) {
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
	function Qa(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			effects: e.effects
		});
	}
	function $a(e, t) {
		return {
			eventTime: e,
			lane: t,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function eo(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, $ & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, Ya(e, n);
		}
		return i = r.interleaved, i === null ? (t.next = t, qa(r)) : (t.next = i.next, i.next = t), r.interleaved = t, Ya(e, n);
	}
	function to(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194240)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, It(e, n);
		}
	}
	function no(e, t) {
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
	function ro(e, t, n, r) {
		var i = e.updateQueue;
		Xa = !1;
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
							case 2: Xa = !0;
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
	function io(e, t, n) {
		if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
			var r = e[t], i = r.callback;
			if (i !== null) {
				if (r.callback = null, r = n, typeof i != "function") throw Error(a(191, i));
				i.call(r);
			}
		}
	}
	var ao = {}, oo = Vi(ao), so = Vi(ao), co = Vi(ao);
	function lo(e) {
		if (e === ao) throw Error(a(174));
		return e;
	}
	function uo(e, t) {
		switch (J(co, t), J(so, e), J(oo, ao), e = t.nodeType, e) {
			case 9:
			case 11:
				t = (t = t.documentElement) ? t.namespaceURI : xe(null, "");
				break;
			default: e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = xe(t, e);
		}
		q(oo), J(oo, t);
	}
	function fo() {
		q(oo), q(so), q(co);
	}
	function po(e) {
		lo(co.current);
		var t = lo(oo.current), n = xe(t, e.type);
		t !== n && (J(so, e), J(oo, n));
	}
	function mo(e) {
		so.current === e && (q(oo), q(so));
	}
	var X = Vi(0);
	function ho(e) {
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
	var go = [];
	function _o() {
		for (var e = 0; e < go.length; e++) go[e]._workInProgressVersionPrimary = null;
		go.length = 0;
	}
	var vo = C.ReactCurrentDispatcher, yo = C.ReactCurrentBatchConfig, bo = 0, Z = null, xo = null, So = null, Co = !1, wo = !1, To = 0, Eo = 0;
	function Do() {
		throw Error(a(321));
	}
	function Oo(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!Tr(e[n], t[n])) return !1;
		return !0;
	}
	function ko(e, t, n, r, i, o) {
		if (bo = o, Z = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, vo.current = e === null || e.memoizedState === null ? fs : ps, e = n(r, i), wo) {
			o = 0;
			do {
				if (wo = !1, To = 0, 25 <= o) throw Error(a(301));
				o += 1, So = xo = null, t.updateQueue = null, vo.current = ms, e = n(r, i);
			} while (wo);
		}
		if (vo.current = ds, t = xo !== null && xo.next !== null, bo = 0, So = xo = Z = null, Co = !1, t) throw Error(a(300));
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
		return So === null ? Z.memoizedState = So = e : So = So.next = e, So;
	}
	function Mo() {
		if (xo === null) {
			var e = Z.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = xo.next;
		var t = So === null ? Z.memoizedState : So.next;
		if (t !== null) So = t, xo = e;
		else {
			if (e === null) throw Error(a(310));
			xo = e, e = {
				memoizedState: xo.memoizedState,
				baseState: xo.baseState,
				baseQueue: xo.baseQueue,
				queue: xo.queue,
				next: null
			}, So === null ? Z.memoizedState = So = e : So = So.next = e;
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
				if ((bo & d) === d) l !== null && (l = l.next = {
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
					l === null ? (c = l = f, s = r) : l = l.next = f, Z.lanes |= d, Jc |= d;
				}
				u = u.next;
			} while (u !== null && u !== o);
			l === null ? s = r : l.next = c, Tr(r, t.memoizedState) || (Ms = !0), t.memoizedState = r, t.baseState = s, t.baseQueue = l, n.lastRenderedState = r;
		}
		if (e = n.interleaved, e !== null) {
			i = e;
			do
				o = i.lane, Z.lanes |= o, Jc |= o, i = i.next;
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
			Tr(o, t.memoizedState) || (Ms = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function Io() {}
	function Lo(e, t) {
		var n = Z, r = Mo(), i = t(), o = !Tr(r.memoizedState, i);
		if (o && (r.memoizedState = i, Ms = !0), r = r.queue, Yo(Bo.bind(null, n, r, e), [e]), r.getSnapshot !== t || o || So !== null && So.memoizedState.tag & 1) {
			if (n.flags |= 2048, Wo(9, zo.bind(null, n, r, i, t), void 0, null), Vc === null) throw Error(a(349));
			bo & 30 || Ro(n, t, i);
		}
		return i;
	}
	function Ro(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = Z.updateQueue, t === null ? (t = {
			lastEffect: null,
			stores: null
		}, Z.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
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
			return !Tr(e, n);
		} catch {
			return !0;
		}
	}
	function Ho(e) {
		var t = Ya(e, 1);
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
		}, t.queue = e, e = e.dispatch = ss.bind(null, Z, e), [t.memoizedState, e];
	}
	function Wo(e, t, n, r) {
		return e = {
			tag: e,
			create: t,
			destroy: n,
			deps: r,
			next: null
		}, t = Z.updateQueue, t === null ? (t = {
			lastEffect: null,
			stores: null
		}, Z.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e)), e;
	}
	function Go() {
		return Mo().memoizedState;
	}
	function Ko(e, t, n, r) {
		var i = jo();
		Z.flags |= e, i.memoizedState = Wo(1 | t, n, void 0, r === void 0 ? null : r);
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
		Z.flags |= e, i.memoizedState = Wo(1 | t, n, a, r);
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
		return bo & 21 ? (Tr(n, t) || (n = Mt(), Z.lanes |= n, Jc |= n, e.baseState = !0), t) : (e.baseState && (e.baseState = !1, Ms = !0), e.memoizedState = n);
	}
	function is(e, t) {
		var n = G;
		G = n !== 0 && 4 > n ? n : 4, e(!0);
		var r = yo.transition;
		yo.transition = {};
		try {
			e(!1), t();
		} finally {
			G = n, yo.transition = r;
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
		else if (n = Ja(e, t, n, r), n !== null) {
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
				if (i.hasEagerState = !0, i.eagerState = s, Tr(s, o)) {
					var c = t.interleaved;
					c === null ? (i.next = i, qa(t)) : (i.next = c.next, c.next = i), t.interleaved = i;
					return;
				}
			} catch {}
			n = Ja(e, t, i, r), n !== null && (i = fl(), ml(n, e, r, i), us(n, t, r));
		}
	}
	function cs(e) {
		var t = e.alternate;
		return e === Z || t !== null && t === Z;
	}
	function ls(e, t) {
		wo = Co = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function us(e, t, n) {
		if (n & 4194240) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, It(e, n);
		}
	}
	var ds = {
		readContext: Ga,
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
		readContext: Ga,
		useCallback: function(e, t) {
			return jo().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: Ga,
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
			}, r.queue = e, e = e.dispatch = os.bind(null, Z, e), [r.memoizedState, e];
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
			var r = Z, i = jo();
			if (Y) {
				if (n === void 0) throw Error(a(407));
				n = n();
			} else {
				if (n = t(), Vc === null) throw Error(a(349));
				bo & 30 || Ro(r, t, n);
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
			if (Y) {
				var n = pa, r = fa;
				n = (r & ~(1 << 32 - xt(r) - 1)).toString(32) + n, t = ":" + t + "R" + n, n = To++, 0 < n && (t += "H" + n.toString(32)), t += ":";
			} else n = Eo++, t = ":" + t + "r" + n.toString(32) + ":";
			return e.memoizedState = t;
		},
		unstable_isNewReconciler: !1
	}, ps = {
		readContext: Ga,
		useCallback: ts,
		useContext: Ga,
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
		readContext: Ga,
		useCallback: ts,
		useContext: Ga,
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
			return (e = e._reactInternals) ? tt(e) === e : !1;
		},
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = fl(), i = pl(e), a = $a(r, i);
			a.payload = t, n != null && (a.callback = n), t = eo(e, a, i), t !== null && (ml(t, e, i, r), to(t, e, i));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = fl(), i = pl(e), a = $a(r, i);
			a.tag = 1, a.payload = t, n != null && (a.callback = n), t = eo(e, a, i), t !== null && (ml(t, e, i, r), to(t, e, i));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = fl(), r = pl(e), i = $a(n, r);
			i.tag = 2, t != null && (i.callback = t), t = eo(e, i, r), t !== null && (ml(t, e, r, n), to(t, e, r));
		}
	};
	function vs(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Er(n, r) || !Er(i, a) : !0;
	}
	function ys(e, t, n) {
		var r = !1, i = Hi, a = t.contextType;
		return typeof a == "object" && a ? a = Ga(a) : (i = qi(t) ? Gi : Ui.current, r = t.contextTypes, a = (r = r != null) ? Ki(e, i) : Hi), t = new t(n, a), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = _s, e.stateNode = t, t._reactInternals = e, r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = i, e.__reactInternalMemoizedMaskedChildContext = a), t;
	}
	function bs(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && _s.enqueueReplaceState(t, t.state, null);
	}
	function xs(e, t, n, r) {
		var i = e.stateNode;
		i.props = n, i.state = e.memoizedState, i.refs = {}, Za(e);
		var a = t.contextType;
		typeof a == "object" && a ? i.context = Ga(a) : (a = qi(t) ? Gi : Ui.current, i.context = Ki(e, a)), i.state = e.memoizedState, a = t.getDerivedStateFromProps, typeof a == "function" && (gs(e, t, a, n), i.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof i.getSnapshotBeforeUpdate == "function" || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (t = i.state, typeof i.componentWillMount == "function" && i.componentWillMount(), typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount(), t !== i.state && _s.enqueueReplaceState(i, i.state, null), ro(e, n, i, r), i.state = e.memoizedState), typeof i.componentDidMount == "function" && (e.flags |= 4194308);
	}
	function Ss(e, t) {
		try {
			var n = "", r = t;
			do
				n += W(r), r = r.return;
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
		n = $a(-1, n), n.tag = 3, n.payload = { element: null };
		var r = t.value;
		return n.callback = function() {
			nl || (nl = !0, rl = r), ws(e, t);
		}, n;
	}
	function Ds(e, t, n) {
		n = $a(-1, n), n.tag = 3;
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
			if ((t = e.tag === 13) && (t = e.memoizedState, t = t === null ? !0 : t.dehydrated !== null), t) return e;
			e = e.return;
		} while (e !== null);
		return null;
	}
	function As(e, t, n, r, i) {
		return e.mode & 1 ? (e.flags |= 65536, e.lanes = i, e) : (e === t ? e.flags |= 65536 : (e.flags |= 128, n.flags |= 131072, n.flags &= -52805, n.tag === 1 && (n.alternate === null ? n.tag = 17 : (t = $a(-1, 1), t.tag = 2, eo(n, t, 1))), n.lanes |= 1), e);
	}
	var js = C.ReactCurrentOwner, Ms = !1;
	function Ns(e, t, n, r) {
		t.child = e === null ? Ia(t, null, n, r) : Fa(t, e.child, n, r);
	}
	function Ps(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		return Wa(t, i), r = ko(e, t, n, r, a, i), n = Ao(), e !== null && !Ms ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~i, ec(e, t, i)) : (Y && n && ga(t), t.flags |= 1, Ns(e, t, r, i), t.child);
	}
	function Fs(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !ql(a) && a.defaultProps === void 0 && n.compare === null && n.defaultProps === void 0 ? (t.tag = 15, t.type = a, Is(e, t, a, r, i)) : (e = Xl(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, (e.lanes & i) === 0) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? Er : n, n(o, r) && e.ref === t.ref) return ec(e, t, i);
		}
		return t.flags |= 1, e = Yl(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function Is(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Er(a, r) && e.ref === t.ref) if (Ms = !1, t.pendingProps = r = a, (e.lanes & i) !== 0) e.flags & 131072 && (Ms = !0);
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
		}, J(Gc, Wc), Wc |= n;
		else {
			if (!(n & 1073741824)) return e = a === null ? n : a.baseLanes | n, t.lanes = t.childLanes = 1073741824, t.memoizedState = {
				baseLanes: e,
				cachePool: null,
				transitions: null
			}, t.updateQueue = null, J(Gc, Wc), Wc |= e, null;
			t.memoizedState = {
				baseLanes: 0,
				cachePool: null,
				transitions: null
			}, r = a === null ? n : a.baseLanes, J(Gc, Wc), Wc |= r;
		}
		else a === null ? r = n : (r = a.baseLanes | n, t.memoizedState = null), J(Gc, Wc), Wc |= r;
		return Ns(e, t, i, n), t.child;
	}
	function Rs(e, t) {
		var n = t.ref;
		(e === null && n !== null || e !== null && e.ref !== n) && (t.flags |= 512, t.flags |= 2097152);
	}
	function zs(e, t, n, r, i) {
		var a = qi(n) ? Gi : Ui.current;
		return a = Ki(t, a), Wa(t, i), n = ko(e, t, n, r, a, i), r = Ao(), e !== null && !Ms ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~i, ec(e, t, i)) : (Y && r && ga(t), t.flags |= 1, Ns(e, t, n, i), t.child);
	}
	function Bs(e, t, n, r, i) {
		if (qi(n)) {
			var a = !0;
			Zi(t);
		} else a = !1;
		if (Wa(t, i), t.stateNode === null) $s(e, t), ys(t, n, r), xs(t, n, r, i), r = !0;
		else if (e === null) {
			var o = t.stateNode, s = t.memoizedProps;
			o.props = s;
			var c = o.context, l = n.contextType;
			typeof l == "object" && l ? l = Ga(l) : (l = qi(n) ? Gi : Ui.current, l = Ki(t, l));
			var u = n.getDerivedStateFromProps, d = typeof u == "function" || typeof o.getSnapshotBeforeUpdate == "function";
			d || typeof o.UNSAFE_componentWillReceiveProps != "function" && typeof o.componentWillReceiveProps != "function" || (s !== r || c !== l) && bs(t, o, r, l), Xa = !1;
			var f = t.memoizedState;
			o.state = f, ro(t, r, o, i), c = t.memoizedState, s !== r || f !== c || Wi.current || Xa ? (typeof u == "function" && (gs(t, n, u, r), c = t.memoizedState), (s = Xa || vs(t, n, s, r, f, c, l)) ? (d || typeof o.UNSAFE_componentWillMount != "function" && typeof o.componentWillMount != "function" || (typeof o.componentWillMount == "function" && o.componentWillMount(), typeof o.UNSAFE_componentWillMount == "function" && o.UNSAFE_componentWillMount()), typeof o.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof o.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = c), o.props = r, o.state = c, o.context = l, r = s) : (typeof o.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			o = t.stateNode, Qa(e, t), s = t.memoizedProps, l = t.type === t.elementType ? s : hs(t.type, s), o.props = l, d = t.pendingProps, f = o.context, c = n.contextType, typeof c == "object" && c ? c = Ga(c) : (c = qi(n) ? Gi : Ui.current, c = Ki(t, c));
			var p = n.getDerivedStateFromProps;
			(u = typeof p == "function" || typeof o.getSnapshotBeforeUpdate == "function") || typeof o.UNSAFE_componentWillReceiveProps != "function" && typeof o.componentWillReceiveProps != "function" || (s !== d || f !== c) && bs(t, o, r, c), Xa = !1, f = t.memoizedState, o.state = f, ro(t, r, o, i);
			var m = t.memoizedState;
			s !== d || f !== m || Wi.current || Xa ? (typeof p == "function" && (gs(t, n, p, r), m = t.memoizedState), (l = Xa || vs(t, n, l, r, f, m, c) || !1) ? (u || typeof o.UNSAFE_componentWillUpdate != "function" && typeof o.componentWillUpdate != "function" || (typeof o.componentWillUpdate == "function" && o.componentWillUpdate(r, m, c), typeof o.UNSAFE_componentWillUpdate == "function" && o.UNSAFE_componentWillUpdate(r, m, c)), typeof o.componentDidUpdate == "function" && (t.flags |= 4), typeof o.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof o.componentDidUpdate != "function" || s === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof o.getSnapshotBeforeUpdate != "function" || s === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = m), o.props = r, o.state = m, o.context = c, r = l) : (typeof o.componentDidUpdate != "function" || s === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof o.getSnapshotBeforeUpdate != "function" || s === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return Vs(e, t, n, r, a, i);
	}
	function Vs(e, t, n, r, i, a) {
		Rs(e, t);
		var o = (t.flags & 128) != 0;
		if (!r && !o) return i && Qi(t, n, !1), ec(e, t, a);
		r = t.stateNode, js.current = t;
		var s = o && typeof n.getDerivedStateFromError != "function" ? null : r.render();
		return t.flags |= 1, e !== null && o ? (t.child = Fa(t, e.child, null, a), t.child = Fa(t, null, s, a)) : Ns(e, t, s, a), t.memoizedState = r.state, i && Qi(t, n, !0), t.child;
	}
	function Hs(e) {
		var t = e.stateNode;
		t.pendingContext ? Yi(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Yi(e, t.context, !1), uo(e, t.containerInfo);
	}
	function Us(e, t, n, r, i) {
		return Oa(), ka(i), t.flags |= 256, Ns(e, t, n, r), t.child;
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
		var r = t.pendingProps, i = X.current, a = !1, o = (t.flags & 128) != 0, s;
		if ((s = o) || (s = e !== null && e.memoizedState === null ? !1 : (i & 2) != 0), s ? (a = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (i |= 1), J(X, i & 1), e === null) return wa(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? (t.mode & 1 ? e.data === "$!" ? t.lanes = 8 : t.lanes = 1073741824 : t.lanes = 1, null) : (o = r.children, e = r.fallback, a ? (r = t.mode, a = t.child, o = {
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
		return r !== null && ka(r), Fa(t, e.child, null, n), e = qs(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function Ys(e, t, n, r, i, o, s) {
		if (n) return t.flags & 256 ? (t.flags &= -257, r = Cs(Error(a(422))), Js(e, t, s, r)) : t.memoizedState === null ? (o = r.fallback, i = t.mode, r = Ql({
			mode: "visible",
			children: r.children
		}, i, 0, null), o = Zl(o, i, s, null), o.flags |= 2, r.return = t, o.return = t, r.sibling = o, t.child = r, t.mode & 1 && Fa(t, e.child, null, s), t.child.memoizedState = Gs(s), t.memoizedState = Ws, o) : (t.child = e.child, t.flags |= 128, null);
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
				i = (i & (r.suspendedLanes | s)) === 0 ? i : 0, i !== 0 && i !== o.retryLane && (o.retryLane = i, Ya(e, i), ml(r, e, i, -1));
			}
			return Ol(), r = Cs(Error(a(421))), Js(e, t, s, r);
		}
		return i.data === "$?" ? (t.flags |= 128, t.child = e.child, t = Vl.bind(null, e), i._reactRetry = t, null) : (e = o.treeContext, ya = Ei(i.nextSibling), va = t, Y = !0, ba = null, e !== null && (la[ua++] = fa, la[ua++] = pa, la[ua++] = da, fa = e.id, pa = e.overflow, da = t), t = qs(t, r.children), t.flags |= 4096, t);
	}
	function Xs(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), Ua(e.return, t, n);
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
		if (Ns(e, t, r.children, n), r = X.current, r & 2) r = r & 1 | 2, t.flags |= 128;
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
		if (J(X, r), !(t.mode & 1)) t.memoizedState = null;
		else switch (i) {
			case "forwards":
				for (n = t.child, i = null; n !== null;) e = n.alternate, e !== null && ho(e) === null && (i = n), n = n.sibling;
				n = i, n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), Zs(t, !1, i, n, a);
				break;
			case "backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && ho(e) === null) {
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
				Hs(t), Oa();
				break;
			case 5:
				po(t);
				break;
			case 1:
				qi(t.type) && Zi(t);
				break;
			case 4:
				uo(t, t.stateNode.containerInfo);
				break;
			case 10:
				var r = t.type._context, i = t.memoizedProps.value;
				J(La, r._currentValue), r._currentValue = i;
				break;
			case 13:
				if (r = t.memoizedState, r !== null) return r.dehydrated === null ? (n & t.child.childLanes) === 0 ? (J(X, X.current & 1), e = ec(e, t, n), e === null ? null : e.sibling) : Ks(e, t, n) : (J(X, X.current & 1), t.flags |= 128, null);
				J(X, X.current & 1);
				break;
			case 19:
				if (r = (n & t.childLanes) !== 0, e.flags & 128) {
					if (r) return Qs(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), J(X, X.current), r) break;
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
			e = t.stateNode, lo(oo.current);
			var a = null;
			switch (n) {
				case "input":
					i = ce(e, i), r = ce(e, r), a = [];
					break;
				case "select":
					i = z({}, i, { value: void 0 }), r = z({}, r, { value: void 0 }), a = [];
					break;
				case "textarea":
					i = ge(e, i), r = ge(e, r), a = [];
					break;
				default: typeof i.onClick != "function" && typeof r.onClick == "function" && (e.onclick = gi);
			}
			Ae(n, r);
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
				else u === "dangerouslySetInnerHTML" ? (l = l ? l.__html : void 0, c = c ? c.__html : void 0, l != null && c !== l && (a ||= []).push(u, l)) : u === "children" ? typeof l != "string" && typeof l != "number" || (a ||= []).push(u, "" + l) : u !== "suppressContentEditableWarning" && u !== "suppressHydrationWarning" && (s.hasOwnProperty(u) ? (l != null && u === "onScroll" && K("scroll", e), a || c === l || (a = [])) : (a ||= []).push(u, l));
			}
			n && (a ||= []).push("style", n);
			var u = a;
			(t.updateQueue = u) && (t.flags |= 4);
		}
	}, ic = function(e, t, n, r) {
		n !== r && (t.flags |= 4);
	};
	function ac(e, t) {
		if (!Y) switch (e.tailMode) {
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
		switch (_a(t), t.tag) {
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
			case 1: return qi(t.type) && Ji(), oc(t), null;
			case 3: return r = t.stateNode, fo(), q(Wi), q(Ui), _o(), r.pendingContext && (r.context = r.pendingContext, r.pendingContext = null), (e === null || e.child === null) && (Ea(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, ba !== null && (vl(ba), ba = null))), oc(t), null;
			case 5:
				mo(t);
				var i = lo(co.current);
				if (n = t.type, e !== null && t.stateNode != null) rc(e, t, n, r, i), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(a(166));
						return oc(t), null;
					}
					if (e = lo(oo.current), Ea(t)) {
						r = t.stateNode, n = t.type;
						var o = t.memoizedProps;
						switch (r[ki] = t, r[Ai] = o, e = (t.mode & 1) != 0, n) {
							case "dialog":
								K("cancel", r), K("close", r);
								break;
							case "iframe":
							case "object":
							case "embed":
								K("load", r);
								break;
							case "video":
							case "audio":
								for (i = 0; i < $r.length; i++) K($r[i], r);
								break;
							case "source":
								K("error", r);
								break;
							case "img":
							case "image":
							case "link":
								K("error", r), K("load", r);
								break;
							case "details":
								K("toggle", r);
								break;
							case "input":
								le(r, o), K("invalid", r);
								break;
							case "select":
								r._wrapperState = { wasMultiple: !!o.multiple }, K("invalid", r);
								break;
							case "textarea": _e(r, o), K("invalid", r);
						}
						for (var c in Ae(n, o), i = null, o) if (o.hasOwnProperty(c)) {
							var l = o[c];
							c === "children" ? typeof l == "string" ? r.textContent !== l && (!0 !== o.suppressHydrationWarning && hi(r.textContent, l, e), i = ["children", l]) : typeof l == "number" && r.textContent !== "" + l && (!0 !== o.suppressHydrationWarning && hi(r.textContent, l, e), i = ["children", "" + l]) : s.hasOwnProperty(c) && l != null && c === "onScroll" && K("scroll", r);
						}
						switch (n) {
							case "input":
								ae(r), fe(r, o, !0);
								break;
							case "textarea":
								ae(r), ye(r);
								break;
							case "select":
							case "option": break;
							default: typeof o.onClick == "function" && (r.onclick = gi);
						}
						r = i, t.updateQueue = r, r !== null && (t.flags |= 4);
					} else {
						c = i.nodeType === 9 ? i : i.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = be(n)), e === "http://www.w3.org/1999/xhtml" ? n === "script" ? (e = c.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof r.is == "string" ? e = c.createElement(n, { is: r.is }) : (e = c.createElement(n), n === "select" && (c = e, r.multiple ? c.multiple = !0 : r.size && (c.size = r.size))) : e = c.createElementNS(e, n), e[ki] = t, e[Ai] = r, nc(e, t, !1, !1), t.stateNode = e;
						a: {
							switch (c = je(n, r), n) {
								case "dialog":
									K("cancel", e), K("close", e), i = r;
									break;
								case "iframe":
								case "object":
								case "embed":
									K("load", e), i = r;
									break;
								case "video":
								case "audio":
									for (i = 0; i < $r.length; i++) K($r[i], e);
									i = r;
									break;
								case "source":
									K("error", e), i = r;
									break;
								case "img":
								case "image":
								case "link":
									K("error", e), K("load", e), i = r;
									break;
								case "details":
									K("toggle", e), i = r;
									break;
								case "input":
									le(e, r), i = ce(e, r), K("invalid", e);
									break;
								case "option":
									i = r;
									break;
								case "select":
									e._wrapperState = { wasMultiple: !!r.multiple }, i = z({}, r, { value: void 0 }), K("invalid", e);
									break;
								case "textarea":
									_e(e, r), i = ge(e, r), K("invalid", e);
									break;
								default: i = r;
							}
							for (o in Ae(n, i), l = i, l) if (l.hasOwnProperty(o)) {
								var u = l[o];
								o === "style" ? Oe(e, u) : o === "dangerouslySetInnerHTML" ? (u = u ? u.__html : void 0, u != null && Ce(e, u)) : o === "children" ? typeof u == "string" ? (n !== "textarea" || u !== "") && we(e, u) : typeof u == "number" && we(e, "" + u) : o !== "suppressContentEditableWarning" && o !== "suppressHydrationWarning" && o !== "autoFocus" && (s.hasOwnProperty(o) ? u != null && o === "onScroll" && K("scroll", e) : u != null && S(e, o, u, c));
							}
							switch (n) {
								case "input":
									ae(e), fe(e, r, !1);
									break;
								case "textarea":
									ae(e), ye(e);
									break;
								case "option":
									r.value != null && e.setAttribute("value", "" + ne(r.value));
									break;
								case "select":
									e.multiple = !!r.multiple, o = r.value, o == null ? r.defaultValue != null && he(e, !!r.multiple, r.defaultValue, !0) : he(e, !!r.multiple, o, !1);
									break;
								default: typeof i.onClick == "function" && (e.onclick = gi);
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
					if (n = lo(co.current), lo(oo.current), Ea(t)) {
						if (r = t.stateNode, n = t.memoizedProps, r[ki] = t, (o = r.nodeValue !== n) && (e = va, e !== null)) switch (e.tag) {
							case 3:
								hi(r.nodeValue, n, (e.mode & 1) != 0);
								break;
							case 5: !0 !== e.memoizedProps.suppressHydrationWarning && hi(r.nodeValue, n, (e.mode & 1) != 0);
						}
						o && (t.flags |= 4);
					} else r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r), r[ki] = t, t.stateNode = r;
				}
				return oc(t), null;
			case 13:
				if (q(X), r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (Y && ya !== null && t.mode & 1 && !(t.flags & 128)) Da(), Oa(), t.flags |= 98560, o = !1;
					else if (o = Ea(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!o) throw Error(a(318));
							if (o = t.memoizedState, o = o === null ? null : o.dehydrated, !o) throw Error(a(317));
							o[ki] = t;
						} else Oa(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						oc(t), o = !1;
					} else ba !== null && (vl(ba), ba = null), o = !0;
					if (!o) return t.flags & 65536 ? t : null;
				}
				return t.flags & 128 ? (t.lanes = n, t) : (r = r !== null, r !== (e !== null && e.memoizedState !== null) && r && (t.child.flags |= 8192, t.mode & 1 && (e === null || X.current & 1 ? Kc === 0 && (Kc = 3) : Ol())), t.updateQueue !== null && (t.flags |= 4), oc(t), null);
			case 4: return fo(), e === null && ai(t.stateNode.containerInfo), oc(t), null;
			case 10: return Ha(t.type._context), oc(t), null;
			case 17: return qi(t.type) && Ji(), oc(t), null;
			case 19:
				if (q(X), o = t.memoizedState, o === null) return oc(t), null;
				if (r = (t.flags & 128) != 0, c = o.rendering, c === null) if (r) ac(o, !1);
				else {
					if (Kc !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
						if (c = ho(e), c !== null) {
							for (t.flags |= 128, ac(o, !1), r = c.updateQueue, r !== null && (t.updateQueue = r, t.flags |= 4), t.subtreeFlags = 0, r = n, n = t.child; n !== null;) o = n, e = r, o.flags &= 14680066, c = o.alternate, c === null ? (o.childLanes = 0, o.lanes = e, o.child = null, o.subtreeFlags = 0, o.memoizedProps = null, o.memoizedState = null, o.updateQueue = null, o.dependencies = null, o.stateNode = null) : (o.childLanes = c.childLanes, o.lanes = c.lanes, o.child = c.child, o.subtreeFlags = 0, o.deletions = null, o.memoizedProps = c.memoizedProps, o.memoizedState = c.memoizedState, o.updateQueue = c.updateQueue, o.type = c.type, e = c.dependencies, o.dependencies = e === null ? null : {
								lanes: e.lanes,
								firstContext: e.firstContext
							}), n = n.sibling;
							return J(X, X.current & 1 | 2), t.child;
						}
						e = e.sibling;
					}
					o.tail !== null && dt() > el && (t.flags |= 128, r = !0, ac(o, !1), t.lanes = 4194304);
				}
				else {
					if (!r) if (e = ho(c), e !== null) {
						if (t.flags |= 128, r = !0, n = e.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), ac(o, !0), o.tail === null && o.tailMode === "hidden" && !c.alternate && !Y) return oc(t), null;
					} else 2 * dt() - o.renderingStartTime > el && n !== 1073741824 && (t.flags |= 128, r = !0, ac(o, !1), t.lanes = 4194304);
					o.isBackwards ? (c.sibling = t.child, t.child = c) : (n = o.last, n === null ? t.child = c : n.sibling = c, o.last = c);
				}
				return o.tail === null ? (oc(t), null) : (t = o.tail, o.rendering = t, o.tail = t.sibling, o.renderingStartTime = dt(), t.sibling = null, n = X.current, J(X, r ? n & 1 | 2 : n & 1), t);
			case 22:
			case 23: return wl(), r = t.memoizedState !== null, e !== null && e.memoizedState !== null !== r && (t.flags |= 8192), r && t.mode & 1 ? Wc & 1073741824 && (oc(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : oc(t), null;
			case 24: return null;
			case 25: return null;
		}
		throw Error(a(156, t.tag));
	}
	function cc(e, t) {
		switch (_a(t), t.tag) {
			case 1: return qi(t.type) && Ji(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return fo(), q(Wi), q(Ui), _o(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 5: return mo(t), null;
			case 13:
				if (q(X), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(a(340));
					Oa();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return q(X), null;
			case 4: return fo(), null;
			case 10: return Ha(t.type._context), null;
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
		if (_i = ln, e = Ar(), jr(e)) {
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
		for (vi = {
			focusedElem: e,
			selectionRange: n
		}, ln = !1, Q = t; Q !== null;) if (t = Q, e = t.child, t.subtreeFlags & 1028 && e !== null) e.return = t, Q = e;
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
		t !== null && (e.alternate = null, yc(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[ki], delete t[Ai], delete t[Mi], delete t[Ni], delete t[Pi])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
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
		if (r === 5 || r === 6) e = e.stateNode, t ? n.nodeType === 8 ? n.parentNode.insertBefore(e, t) : n.insertBefore(e, t) : (n.nodeType === 8 ? (t = n.parentNode, t.insertBefore(e, n)) : (t = n, t.appendChild(e)), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = gi));
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
		if (yt && typeof yt.onCommitFiberUnmount == "function") try {
			yt.onCommitFiberUnmount(vt, n);
		} catch {}
		switch (n.tag) {
			case 5: uc || fc(n, t);
			case 6:
				var r = wc, i = Tc;
				wc = null, Ec(e, t, n), wc = r, Tc = i, wc !== null && (Tc ? (e = wc, n = n.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n)) : wc.removeChild(n.stateNode));
				break;
			case 18:
				wc !== null && (Tc ? (e = wc, n = n.stateNode, e.nodeType === 8 ? Ti(e.parentNode, n) : e.nodeType === 1 && Ti(e, n), sn(e)) : Ti(wc, n.stateNode));
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
						we(i, "");
					} catch (t) {
						Rl(e, e.return, t);
					}
				}
				if (r & 4 && (i = e.stateNode, i != null)) {
					var o = e.memoizedProps, s = n === null ? o : n.memoizedProps, c = e.type, l = e.updateQueue;
					if (e.updateQueue = null, l !== null) try {
						c === "input" && o.type === "radio" && o.name != null && ue(i, o), je(c, s);
						var u = je(c, o);
						for (s = 0; s < l.length; s += 2) {
							var d = l[s], f = l[s + 1];
							d === "style" ? Oe(i, f) : d === "dangerouslySetInnerHTML" ? Ce(i, f) : d === "children" ? we(i, f) : S(i, d, f, u);
						}
						switch (c) {
							case "input":
								de(i, o);
								break;
							case "textarea":
								ve(i, o);
								break;
							case "select":
								var p = i._wrapperState.wasMultiple;
								i._wrapperState.wasMultiple = !!o.multiple;
								var m = o.value;
								m == null ? p !== !!o.multiple && (o.defaultValue == null ? he(i, !!o.multiple, o.multiple ? [] : "", !1) : he(i, !!o.multiple, o.defaultValue, !0)) : he(i, !!o.multiple, m, !1);
						}
						i[Ai] = o;
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
					sn(t.containerInfo);
				} catch (t) {
					Rl(e, e.return, t);
				}
				break;
			case 4:
				kc(t, e), jc(e);
				break;
			case 13:
				kc(t, e), jc(e), i = e.child, i.flags & 8192 && (o = i.memoizedState !== null, i.stateNode.isHidden = o, !o || i.alternate !== null && i.alternate.memoizedState !== null || ($c = dt())), r & 4 && Oc(e);
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
									i = f.stateNode, u ? (o = i.style, typeof o.setProperty == "function" ? o.setProperty("display", "none", "important") : o.display = "none") : (c = f.stateNode, l = f.memoizedProps.style, s = l != null && l.hasOwnProperty("display") ? l.display : null, c.style.display = De("display", s));
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
						r.flags & 32 && (we(i, ""), r.flags &= -33), Cc(e, xc(e), i);
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
		for (var r = (e.mode & 1) != 0; Q !== null;) {
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
							o !== null && io(t, o, r);
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
								io(t, s, n);
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
										f !== null && sn(f);
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
	var Lc = Math.ceil, Rc = C.ReactCurrentDispatcher, zc = C.ReactCurrentOwner, Bc = C.ReactCurrentBatchConfig, $ = 0, Vc = null, Hc = null, Uc = 0, Wc = 0, Gc = Vi(0), Kc = 0, qc = null, Jc = 0, Yc = 0, Xc = 0, Zc = null, Qc = null, $c = 0, el = Infinity, tl = null, nl = !1, rl = null, il = null, al = !1, ol = null, sl = 0, cl = 0, ll = null, ul = -1, dl = 0;
	function fl() {
		return $ & 6 ? dt() : ul === -1 ? ul = dt() : ul;
	}
	function pl(e) {
		return e.mode & 1 ? $ & 2 && Uc !== 0 ? Uc & -Uc : Aa.transition === null ? (e = G, e === 0 ? (e = window.event, e = e === void 0 ? 16 : hn(e.type), e) : e) : (dl === 0 && (dl = Mt()), dl) : 1;
	}
	function ml(e, t, n, r) {
		if (50 < cl) throw cl = 0, ll = null, Error(a(185));
		Pt(e, n, r), (!($ & 2) || e !== Vc) && (e === Vc && (!($ & 2) && (Yc |= n), Kc === 4 && bl(e, Uc)), hl(e, r), n === 1 && $ === 0 && !(t.mode & 1) && (el = dt() + 500, ea && ia()));
	}
	function hl(e, t) {
		var n = e.callbackNode;
		At(e, t);
		var r = Ot(e, e === Vc ? Uc : 0);
		if (r === 0) n !== null && ct(n), e.callbackNode = null, e.callbackPriority = 0;
		else if (t = r & -r, e.callbackPriority !== t) {
			if (n != null && ct(n), t === 1) e.tag === 0 ? ra(xl.bind(null, e)) : na(xl.bind(null, e)), Ci(function() {
				!($ & 6) && ia();
			}), n = null;
			else {
				switch (Lt(r)) {
					case 1:
						n = pt;
						break;
					case 4:
						n = mt;
						break;
					case 16:
						n = ht;
						break;
					case 536870912:
						n = _t;
						break;
					default: n = ht;
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
		var r = Ot(e, e === Vc ? Uc : 0);
		if (r === 0) return null;
		if (r & 30 || (r & e.expiredLanes) !== 0 || t) t = kl(e, r);
		else {
			t = r;
			var i = $;
			$ |= 2;
			var o = Dl();
			(Vc !== e || Uc !== t) && (tl = null, el = dt() + 500, Tl(e, t));
			do
				try {
					jl();
					break;
				} catch (t) {
					El(e, t);
				}
			while (1);
			Va(), Rc.current = o, $ = i, Hc === null ? (Vc = null, Uc = 0, t = Kc) : t = 0;
		}
		if (t !== 0) {
			if (t === 2 && (i = jt(e), i !== 0 && (r = i, t = _l(e, i))), t === 1) throw n = qc, Tl(e, 0), bl(e, r), hl(e, dt()), n;
			if (t === 6) bl(e, r);
			else {
				if (i = e.current.alternate, !(r & 30) && !yl(i) && (t = kl(e, r), t === 2 && (o = jt(e), o !== 0 && (r = o, t = _l(e, o))), t === 1)) throw n = qc, Tl(e, 0), bl(e, r), hl(e, dt()), n;
				switch (e.finishedWork = i, e.finishedLanes = r, t) {
					case 0:
					case 1: throw Error(a(345));
					case 2:
						Pl(e, Qc, tl);
						break;
					case 3:
						if (bl(e, r), (r & 130023424) === r && (t = $c + 500 - dt(), 10 < t)) {
							if (Ot(e, 0) !== 0) break;
							if (i = e.suspendedLanes, (i & r) !== r) {
								fl(), e.pingedLanes |= e.suspendedLanes & i;
								break;
							}
							e.timeoutHandle = bi(Pl.bind(null, e, Qc, tl), t);
							break;
						}
						Pl(e, Qc, tl);
						break;
					case 4:
						if (bl(e, r), (r & 4194240) === r) break;
						for (t = e.eventTimes, i = -1; 0 < r;) {
							var s = 31 - xt(r);
							o = 1 << s, s = t[s], s > i && (i = s), r &= ~o;
						}
						if (r = i, r = dt() - r, r = (120 > r ? 120 : 480 > r ? 480 : 1080 > r ? 1080 : 1920 > r ? 1920 : 3e3 > r ? 3e3 : 4320 > r ? 4320 : 1960 * Lc(r / 1960)) - r, 10 < r) {
							e.timeoutHandle = bi(Pl.bind(null, e, Qc, tl), r);
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
		return hl(e, dt()), e.callbackNode === n ? gl.bind(null, e) : null;
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
						if (!Tr(a(), i)) return !1;
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
			var n = 31 - xt(t), r = 1 << n;
			e[n] = -1, t &= ~r;
		}
	}
	function xl(e) {
		if ($ & 6) throw Error(a(327));
		Il();
		var t = Ot(e, 0);
		if (!(t & 1)) return hl(e, dt()), null;
		var n = kl(e, t);
		if (e.tag !== 0 && n === 2) {
			var r = jt(e);
			r !== 0 && (t = r, n = _l(e, r));
		}
		if (n === 1) throw n = qc, Tl(e, 0), bl(e, t), hl(e, dt()), n;
		if (n === 6) throw Error(a(345));
		return e.finishedWork = e.current.alternate, e.finishedLanes = t, Pl(e, Qc, tl), hl(e, dt()), null;
	}
	function Sl(e, t) {
		var n = $;
		$ |= 1;
		try {
			return e(t);
		} finally {
			$ = n, $ === 0 && (el = dt() + 500, ea && ia());
		}
	}
	function Cl(e) {
		ol !== null && ol.tag === 0 && !($ & 6) && Il();
		var t = $;
		$ |= 1;
		var n = Bc.transition, r = G;
		try {
			if (Bc.transition = null, G = 1, e) return e();
		} finally {
			G = r, Bc.transition = n, $ = t, !($ & 6) && ia();
		}
	}
	function wl() {
		Wc = Gc.current, q(Gc);
	}
	function Tl(e, t) {
		e.finishedWork = null, e.finishedLanes = 0;
		var n = e.timeoutHandle;
		if (n !== -1 && (e.timeoutHandle = -1, xi(n)), Hc !== null) for (n = Hc.return; n !== null;) {
			var r = n;
			switch (_a(r), r.tag) {
				case 1:
					r = r.type.childContextTypes, r != null && Ji();
					break;
				case 3:
					fo(), q(Wi), q(Ui), _o();
					break;
				case 5:
					mo(r);
					break;
				case 4:
					fo();
					break;
				case 13:
					q(X);
					break;
				case 19:
					q(X);
					break;
				case 10:
					Ha(r.type._context);
					break;
				case 22:
				case 23: wl();
			}
			n = n.return;
		}
		if (Vc = e, Hc = e = Yl(e.current, null), Uc = Wc = t, Kc = 0, qc = null, Xc = Yc = Jc = 0, Qc = Zc = null, Ka !== null) {
			for (t = 0; t < Ka.length; t++) if (n = Ka[t], r = n.interleaved, r !== null) {
				n.interleaved = null;
				var i = r.next, a = n.pending;
				if (a !== null) {
					var o = a.next;
					a.next = i, r.next = o;
				}
				n.pending = r;
			}
			Ka = null;
		}
		return e;
	}
	function El(e, t) {
		do {
			var n = Hc;
			try {
				if (Va(), vo.current = ds, Co) {
					for (var r = Z.memoizedState; r !== null;) {
						var i = r.queue;
						i !== null && (i.pending = null), r = r.next;
					}
					Co = !1;
				}
				if (bo = 0, So = xo = Z = null, wo = !1, To = 0, zc.current = null, n === null || n.return === null) {
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
						} else {
							if (!(t & 1)) {
								Os(o, u, t), Ol();
								break a;
							}
							l = Error(a(426));
						}
					} else if (Y && c.mode & 1) {
						var _ = ks(s);
						if (_ !== null) {
							!(_.flags & 65536) && (_.flags |= 256), As(_, s, c, o, t), ka(Ss(l, c));
							break a;
						}
					}
					o = l = Ss(l, c), Kc !== 4 && (Kc = 2), Zc === null ? Zc = [o] : Zc.push(o), o = s;
					do {
						switch (o.tag) {
							case 3:
								o.flags |= 65536, t &= -t, o.lanes |= t;
								var v = Es(o, l, t);
								no(o, v);
								break a;
							case 1:
								c = l;
								var y = o.type, b = o.stateNode;
								if (!(o.flags & 128) && (typeof y.getDerivedStateFromError == "function" || b !== null && typeof b.componentDidCatch == "function" && (il === null || !il.has(b)))) {
									o.flags |= 65536, t &= -t, o.lanes |= t;
									var x = Ds(o, c, t);
									no(o, x);
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
		if (Va(), $ = n, Rc.current = r, Hc !== null) throw Error(a(261));
		return Vc = null, Uc = 0, Kc;
	}
	function Al() {
		for (; Hc !== null;) Ml(Hc);
	}
	function jl() {
		for (; Hc !== null && !lt();) Ml(Hc);
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
		var r = G, i = Bc.transition;
		try {
			Bc.transition = null, G = 1, Fl(e, t, n, r);
		} finally {
			Bc.transition = i, G = r;
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
		if (Ft(e, o), e === Vc && (Hc = Vc = null, Uc = 0), !(n.subtreeFlags & 2064) && !(n.flags & 2064) || al || (al = !0, Wl(ht, function() {
			return Il(), null;
		})), o = (n.flags & 15990) != 0, n.subtreeFlags & 15990 || o) {
			o = Bc.transition, Bc.transition = null;
			var s = G;
			G = 1;
			var c = $;
			$ |= 4, zc.current = null, hc(e, n), Ac(n, e), Mr(vi), ln = !!_i, vi = _i = null, e.current = n, Mc(n, e, i), ut(), $ = c, G = s, Bc.transition = o;
		} else e.current = n;
		if (al && (al = !1, ol = e, sl = i), o = e.pendingLanes, o === 0 && (il = null), bt(n.stateNode, r), hl(e, dt()), t !== null) for (r = e.onRecoverableError, n = 0; n < t.length; n++) i = t[n], r(i.value, {
			componentStack: i.stack,
			digest: i.digest
		});
		if (nl) throw nl = !1, e = rl, rl = null, e;
		return sl & 1 && e.tag !== 0 && Il(), o = e.pendingLanes, o & 1 ? e === ll ? cl++ : (cl = 0, ll = e) : cl = 0, ia(), null;
	}
	function Il() {
		if (ol !== null) {
			var e = Lt(sl), t = Bc.transition, n = G;
			try {
				if (Bc.transition = null, G = 16 > e ? 16 : e, ol === null) var r = !1;
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
					if ($ = i, ia(), yt && typeof yt.onPostCommitFiberRoot == "function") try {
						yt.onPostCommitFiberRoot(vt, e);
					} catch {}
					r = !0;
				}
				return r;
			} finally {
				G = n, Bc.transition = t;
			}
		}
		return !1;
	}
	function Ll(e, t, n) {
		t = Ss(n, t), t = Es(e, t, 1), e = eo(e, t, 1), t = fl(), e !== null && (Pt(e, 1, t), hl(e, t));
	}
	function Rl(e, t, n) {
		if (e.tag === 3) Ll(e, e, n);
		else for (; t !== null;) {
			if (t.tag === 3) {
				Ll(t, e, n);
				break;
			} else if (t.tag === 1) {
				var r = t.stateNode;
				if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (il === null || !il.has(r))) {
					e = Ss(n, e), e = Ds(t, e, 1), t = eo(t, e, 1), e = fl(), t !== null && (Pt(t, 1, e), hl(t, e));
					break;
				}
			}
			t = t.return;
		}
	}
	function zl(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), t = fl(), e.pingedLanes |= e.suspendedLanes & n, Vc === e && (Uc & n) === n && (Kc === 4 || Kc === 3 && (Uc & 130023424) === Uc && 500 > dt() - $c ? Tl(e, 0) : Xc |= n), hl(e, t);
	}
	function Bl(e, t) {
		t === 0 && (e.mode & 1 ? (t = Et, Et <<= 1, !(Et & 130023424) && (Et = 4194304)) : t = 1);
		var n = fl();
		e = Ya(e, t), e !== null && (Pt(e, t, n), hl(e, n));
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
		if (e !== null) if (e.memoizedProps !== t.pendingProps || Wi.current) Ms = !0;
		else {
			if ((e.lanes & n) === 0 && !(t.flags & 128)) return Ms = !1, tc(e, t, n);
			Ms = !!(e.flags & 131072);
		}
		else Ms = !1, Y && t.flags & 1048576 && ha(t, ca, t.index);
		switch (t.lanes = 0, t.tag) {
			case 2:
				var r = t.type;
				$s(e, t), e = t.pendingProps;
				var i = Ki(t, Ui.current);
				Wa(t, n), i = ko(null, t, r, e, i, n);
				var o = Ao();
				return t.flags |= 1, typeof i == "object" && i && typeof i.render == "function" && i.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, qi(r) ? (o = !0, Zi(t)) : o = !1, t.memoizedState = i.state !== null && i.state !== void 0 ? i.state : null, Za(t), i.updater = _s, t.stateNode = i, i._reactInternals = t, xs(t, r, e, n), t = Vs(null, t, r, !0, o, n)) : (t.tag = 0, Y && o && ga(t), Ns(null, t, i, n), t = t.child), t;
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
					r = t.pendingProps, o = t.memoizedState, i = o.element, Qa(e, t), ro(t, r, null, n);
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
					} else for (ya = Ei(t.stateNode.containerInfo.firstChild), va = t, Y = !0, ba = null, n = Ia(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 4096, n = n.sibling;
					else {
						if (Oa(), r === i) {
							t = ec(e, t, n);
							break a;
						}
						Ns(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 5: return po(t), e === null && wa(t), r = t.type, i = t.pendingProps, o = e === null ? null : e.memoizedProps, s = i.children, yi(r, i) ? s = null : o !== null && yi(r, o) && (t.flags |= 32), Rs(e, t), Ns(e, t, s, n), t.child;
			case 6: return e === null && wa(t), null;
			case 13: return Ks(e, t, n);
			case 4: return uo(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Fa(t, null, r, n) : Ns(e, t, r, n), t.child;
			case 11: return r = t.type, i = t.pendingProps, i = t.elementType === r ? i : hs(r, i), Ps(e, t, r, i, n);
			case 7: return Ns(e, t, t.pendingProps, n), t.child;
			case 8: return Ns(e, t, t.pendingProps.children, n), t.child;
			case 12: return Ns(e, t, t.pendingProps.children, n), t.child;
			case 10:
				a: {
					if (r = t.type._context, i = t.pendingProps, o = t.memoizedProps, s = i.value, J(La, r._currentValue), r._currentValue = s, o !== null) if (Tr(o.value, s)) {
						if (o.children === i.children && !Wi.current) {
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
										l = $a(-1, n & -n), l.tag = 2;
										var u = o.updateQueue;
										if (u !== null) {
											u = u.shared;
											var d = u.pending;
											d === null ? l.next = l : (l.next = d.next, d.next = l), u.pending = l;
										}
									}
									o.lanes |= n, l = o.alternate, l !== null && (l.lanes |= n), Ua(o.return, n, t), c.lanes |= n;
									break;
								}
								l = l.next;
							}
						} else if (o.tag === 10) s = o.type === t.type ? null : o.child;
						else if (o.tag === 18) {
							if (s = o.return, s === null) throw Error(a(341));
							s.lanes |= n, c = s.alternate, c !== null && (c.lanes |= n), Ua(s, n, t), s = o.sibling;
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
			case 9: return i = t.type, r = t.pendingProps.children, Wa(t, n), i = Ga(i), r = r(i), t.flags |= 1, Ns(e, t, r, n), t.child;
			case 14: return r = t.type, i = hs(r, t.pendingProps), i = hs(r.type, i), Fs(e, t, r, i, n);
			case 15: return Is(e, t, t.type, t.pendingProps, n);
			case 17: return r = t.type, i = t.pendingProps, i = t.elementType === r ? i : hs(r, i), $s(e, t), t.tag = 1, qi(r) ? (e = !0, Zi(t)) : e = !1, Wa(t, n), ys(t, r, i), xs(t, r, i, n), Vs(null, t, r, !0, e, n);
			case 19: return Qs(e, t, n);
			case 22: return Ls(e, t, n);
		}
		throw Error(a(156, t.tag));
	};
	function Wl(e, t) {
		return st(e, t);
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
		this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = Nt(0), this.expirationTimes = Nt(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Nt(0), this.identifierPrefix = r, this.onRecoverableError = i, this.mutableSourceEagerHydrationData = null;
	}
	function nu(e, t, n, r, i, a, o, s, c) {
		return e = new tu(e, t, n, s, c), t === 1 ? (t = 1, !0 === a && (t |= 8)) : t = 0, a = Kl(3, null, null, t), e.current = a, a.stateNode = e, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: null,
			transitions: null,
			pendingSuspenseBoundaries: null
		}, Za(a), e;
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
		if (!e) return Hi;
		e = e._reactInternals;
		a: {
			if (tt(e) !== e || e.tag !== 1) throw Error(a(170));
			var t = e;
			do {
				switch (t.tag) {
					case 3:
						t = t.stateNode.context;
						break a;
					case 1: if (qi(t.type)) {
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
			if (qi(n)) return Xi(e, n, t);
		}
		return t;
	}
	function au(e, t, n, r, i, a, o, s, c) {
		return e = nu(n, r, !0, e, i, a, o, s, c), e.context = iu(null), n = e.current, r = fl(), i = pl(n), a = $a(r, i), a.callback = t ?? null, eo(n, a, i), e.current.lanes = i, Pt(e, i, r), hl(e, r), e;
	}
	function ou(e, t, n, r) {
		var i = t.current, a = fl(), o = pl(i);
		return n = iu(n), t.context === null ? t.context = n : t.pendingContext = n, t = $a(a, o), t.payload = { element: e }, r = r === void 0 ? null : r, r !== null && (t.callback = r), e = eo(i, t, o), e !== null && (ml(e, i, o, a), to(e, i, o)), o;
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
			}), t[ji] = null;
		}
	};
	function pu(e) {
		this._internalRoot = e;
	}
	pu.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = Vt();
			e = {
				blockedOn: null,
				target: e,
				priority: t
			};
			for (var n = 0; n < Xt.length && t !== 0 && t < Xt[n].priority; n++);
			Xt.splice(n, 0, e), n === 0 && tn(e);
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
			return e._reactRootContainer = o, e[ji] = o.current, ai(e.nodeType === 8 ? e.parentNode : e), Cl(), o;
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
		return e._reactRootContainer = c, e[ji] = c.current, ai(e.nodeType === 8 ? e.parentNode : e), Cl(function() {
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
	Rt = function(e) {
		switch (e.tag) {
			case 3:
				var t = e.stateNode;
				if (t.current.memoizedState.isDehydrated) {
					var n = Dt(t.pendingLanes);
					n !== 0 && (It(t, n | 1), hl(t, dt()), !($ & 6) && (el = dt() + 500, ia()));
				}
				break;
			case 13: Cl(function() {
				var t = Ya(e, 1);
				t !== null && ml(t, e, 1, fl());
			}), lu(e, 1);
		}
	}, zt = function(e) {
		if (e.tag === 13) {
			var t = Ya(e, 134217728);
			t !== null && ml(t, e, 134217728, fl()), lu(e, 134217728);
		}
	}, Bt = function(e) {
		if (e.tag === 13) {
			var t = pl(e), n = Ya(e, t);
			n !== null && ml(n, e, t, fl()), lu(e, t);
		}
	}, Vt = function() {
		return G;
	}, Ht = function(e, t) {
		var n = G;
		try {
			return G = e, t();
		} finally {
			G = n;
		}
	}, Pe = function(e, t, n) {
		switch (t) {
			case "input":
				if (de(e, n), t = n.name, n.type === "radio" && t != null) {
					for (n = e; n.parentNode;) n = n.parentNode;
					for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + "][type=\"radio\"]"), t = 0; t < n.length; t++) {
						var r = n[t];
						if (r !== e && r.form === e.form) {
							var i = Ri(r);
							if (!i) throw Error(a(90));
							oe(r), de(r, i);
						}
					}
				}
				break;
			case "textarea":
				ve(e, n);
				break;
			case "select": t = n.value, t != null && he(e, !!n.multiple, t, !1);
		}
	}, Be = Sl, Ve = Cl;
	var yu = {
		usingClientEntryPoint: !1,
		Events: [
			Ii,
			Li,
			Ri,
			Re,
			ze,
			Sl
		]
	}, bu = {
		findFiberByHostInstance: Fi,
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
			return e = at(e), e === null ? null : e.stateNode;
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
			vt = Su.inject(xu), yt = Su;
		} catch {}
	}
	e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = yu, e.createPortal = function(e, t) {
		var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
		if (!mu(t)) throw Error(a(200));
		return ru(e, t, null, n);
	}, e.createRoot = function(e, t) {
		if (!mu(e)) throw Error(a(299));
		var n = !1, r = "", i = du;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onRecoverableError !== void 0 && (i = t.onRecoverableError)), t = nu(e, 1, !1, null, null, n, !1, r, i), e[ji] = t.current, ai(e.nodeType === 8 ? e.parentNode : e), new fu(t);
	}, e.findDOMNode = function(e) {
		if (e == null) return null;
		if (e.nodeType === 1) return e;
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(a(188)) : (e = Object.keys(e).join(","), Error(a(268, e)));
		return e = at(t), e = e === null ? null : e.stateNode, e;
	}, e.flushSync = function(e) {
		return Cl(e);
	}, e.hydrate = function(e, t, n) {
		if (!hu(t)) throw Error(a(200));
		return vu(null, e, t, !0, n);
	}, e.hydrateRoot = function(e, t, n) {
		if (!mu(e)) throw Error(a(405));
		var r = n != null && n.hydratedSources || null, i = !1, o = "", s = du;
		if (n != null && (!0 === n.unstable_strictMode && (i = !0), n.identifierPrefix !== void 0 && (o = n.identifierPrefix), n.onRecoverableError !== void 0 && (s = n.onRecoverableError)), t = au(t, null, e, 1, n ?? null, i, !1, o, s), e[ji] = t.current, ai(e), r) for (e = 0; e < r.length; e++) n = r[e], i = n._getVersion, i = i(n._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [n, i] : t.mutableSourceEagerHydrationData.push(n, i);
		return new pu(t);
	}, e.render = function(e, t, n) {
		if (!hu(t)) throw Error(a(200));
		return vu(null, e, t, !1, n);
	}, e.unmountComponentAtNode = function(e) {
		if (!hu(e)) throw Error(a(40));
		return e._reactRootContainer ? (Cl(function() {
			vu(null, null, e, !1, function() {
				e._reactRootContainer = null, e[ji] = null;
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
})), c = n(), l = s(), u = "rules_on_engine_failure", d = class extends Error {
	path;
	status;
	code;
	payload;
	name = "ApiRequestError";
	constructor(e, t, n, r) {
		super(`${e} failed: ${t}${n ? ` (${n})` : ""}`), this.path = e, this.status = t, this.code = n, this.payload = r;
	}
};
function f(e) {
	return e === "queued" || e === "running" || e === "cancel_requested" || e === "committing";
}
function p(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
async function m(e) {
	try {
		return await e.json();
	} catch {
		return null;
	}
}
async function h(e, t) {
	let n = await fetch(e, t), r = await m(n);
	if (!n.ok) {
		let t = p(r) ? r : null, i = t?.error, a = typeof i == "string" ? i : "request_failed";
		throw new d(e, n.status, a, t);
	}
	if (r === null) throw Error(`${e} returned an empty response`);
	return r;
}
async function g(e, t = {}) {
	return h(e, {
		headers: { "Content-Type": "application/json" },
		signal: t.signal
	});
}
async function _(e, t, n = {}) {
	return h(e, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(t),
		signal: n.signal
	});
}
//#endregion
//#region src/app/agentContext.ts
function v(e = {}) {
	let t = {
		...window.FolioAgent?.currentContext || {},
		...e
	};
	return window.FolioAgent = {
		...window.FolioAgent || {},
		currentContext: t
	}, t;
}
function y(e = {}) {
	v(e), window.FolioBridge?.openAgentDock?.(e);
}
//#endregion
//#region node_modules/react/cjs/react-jsx-runtime.production.min.js
var b = /* @__PURE__ */ e(((e) => {
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
})), x = (/* @__PURE__ */ e(((e, t) => {
	t.exports = b();
})))();
function S(e) {
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
function C(e) {
	return S(e).map((e, t) => e.type === "strong" ? /* @__PURE__ */ (0, x.jsx)("strong", { children: e.value }, t) : e.type === "code" ? /* @__PURE__ */ (0, x.jsx)("code", { children: e.value }, t) : e.type === "link" ? /^https?:\/\//i.test(e.href) ? /* @__PURE__ */ (0, x.jsx)("a", {
		href: e.href,
		target: "_blank",
		rel: "noreferrer",
		children: e.label
	}, t) : /* @__PURE__ */ (0, x.jsx)("code", {
		title: e.href,
		children: e.label
	}, t) : /* @__PURE__ */ (0, x.jsx)("span", { children: e.value }, t));
}
function w(e, t) {
	e.length &&= (t.push(/* @__PURE__ */ (0, x.jsx)("p", { children: C(e.join(" ")) }, `p-${t.length}`)), 0);
}
function T({ text: e = "" }) {
	let t = [], n = [], r = [], i = "";
	function a() {
		if (!r.length) return;
		let e = r.map((e, t) => /* @__PURE__ */ (0, x.jsx)("li", { children: C(e) }, t));
		t.push(i === "ol" ? /* @__PURE__ */ (0, x.jsx)("ol", { children: e }, `ol-${t.length}`) : /* @__PURE__ */ (0, x.jsx)("ul", { children: e }, `ul-${t.length}`)), r = [], i = "";
	}
	for (let o of e.replace(/\r\n/g, "\n").split("\n")) {
		let e = o.trim();
		if (!e) {
			w(n, t), a();
			continue;
		}
		let s = e.match(/^(#{2,4})\s+(.+)$/);
		if (s) {
			w(n, t), a(), t.push(/* @__PURE__ */ (0, x.jsx)("h4", { children: C(s[2]) }, `h-${t.length}`));
			continue;
		}
		let c = e.match(/^\d+[.)]\s+(.+)$/);
		if (c) {
			w(n, t), i && i !== "ol" && a(), i = "ol", r.push(c[1]);
			continue;
		}
		let l = e.match(/^[-*•]\s+(.+)$/);
		if (l) {
			w(n, t), i && i !== "ul" && a(), i = "ul", r.push(l[1]);
			continue;
		}
		if (r.length) {
			r[r.length - 1] = `${r[r.length - 1]} ${e}`;
			continue;
		}
		n.push(e);
	}
	return w(n, t), a(), /* @__PURE__ */ (0, x.jsx)("div", {
		className: "agent-chat-markdown",
		children: t
	});
}
function E({ state: e = "pending", title: t, meta: n }) {
	return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: `agent-run-card ${e}`,
		children: [/* @__PURE__ */ (0, x.jsx)("span", {
			className: "agent-run-icon",
			"aria-hidden": "true"
		}), /* @__PURE__ */ (0, x.jsxs)("div", { children: [/* @__PURE__ */ (0, x.jsx)("strong", { children: t }), n && /* @__PURE__ */ (0, x.jsx)("span", { children: n })] })]
	});
}
//#endregion
//#region src/app/AgentHome.tsx
var D = 3, O = 2e5, k = 4e3, A = /* @__PURE__ */ new Set([
	"codex",
	"claude",
	"antigravity"
]), j = "folio.agentHome.thread.v1", M = /* @__PURE__ */ new Set(["agent_bridge", "rss"]), N = {
	id: "welcome",
	role: "assistant",
	text: "무엇을 조사하거나 정리할까요? 질문으로 시작해도 되고, 보고서 수정 작업을 지시해도 됩니다.",
	notice: "저장 변경은 proposal 승인 전에는 반영되지 않습니다."
};
function P(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function F() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function I(e) {
	return e === "high" ? "높음" : e === "low" ? "낮음" : "중간";
}
function L(e) {
	return `${Math.max(1, Math.round((Date.now() - e) / 1e3))}초`;
}
function R(e) {
	return e.filter((e) => e.id !== "welcome").map((e) => ({
		...e,
		pending: !1,
		text: e.pending ? `${e.text}\n\n이전 세션에서 완료 여부를 확인하지 못했습니다.` : e.text
	})).slice(-80);
}
function z() {
	try {
		let e = window.localStorage.getItem(j);
		if (!e) return [N];
		let t = JSON.parse(e), n = Array.isArray(t?.messages) ? t.messages.filter((e) => e?.role === "user" || e?.role === "assistant") : [];
		return n.length ? [N, ...n] : [N];
	} catch {
		return [N];
	}
}
function B(e) {
	try {
		let t = R(e);
		if (!t.length) {
			window.localStorage.removeItem(j);
			return;
		}
		window.localStorage.setItem(j, JSON.stringify({
			version: 1,
			updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
			messages: t
		}));
	} catch {}
}
function V(e) {
	let t = `${e.label || ""} ${e.message || ""}`;
	return M.has(String(e.kind || "")) || /^LLM CLI|Agent/.test(t);
}
function H(e) {
	let t = e.finishedAt || e.updatedAt || e.createdAt || "";
	if (!t) return "";
	try {
		return new Intl.DateTimeFormat("ko-KR", {
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit"
		}).format(new Date(t));
	} catch {
		return t.slice(0, 16);
	}
}
function U(e) {
	let t = e.result || {}, n = t.artifactType || "", r = t.artifactId || t.reportId || "", i = t.date || "";
	return n === "briefing" && i ? `#/briefing/${i}/both` : n === "company_analysis" && r ? `#/analysis/${encodeURIComponent(r)}` : n === "topic_report" && r ? `#/deep-research/${encodeURIComponent(r)}` : String(e.label || "").includes("RSS") ? "#/rss" : "";
}
async function W(e) {
	let t = e;
	for (; f(t.status);) await P(1e3), t = await g(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "Agent 작업에 실패했습니다.");
	return t;
}
async function ee(e) {
	let t = e.type.startsWith("text/") || /\.(md|txt|csv|json)$/i.test(e.name) ? await e.text() : "";
	return {
		name: e.name.slice(0, 120),
		size: e.size,
		content: t.slice(0, k)
	};
}
function te(e) {
	let t = e?.provider && A.has(e.provider) ? e.provider : e?.selectedAdapter || "";
	return e?.adapters?.find((e) => e.id === t) || null;
}
function ne(e) {
	return e?.modelChoices || [];
}
function re(e) {
	let t = ne(e);
	return t.length ? t.some((t) => t.value === e?.model) ? String(e?.model || "") : t[0].value : "";
}
function ie(e) {
	let t = e;
	return !!(t?.id && f(t.status));
}
function ae(e) {
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
function oe(e, t) {
	return `${e.view || "report"}-${e.date || ""}-${e.title || t}`;
}
function se() {
	let [e, t] = (0, c.useState)(() => z()), [n, r] = (0, c.useState)(""), [i, a] = (0, c.useState)(""), [o, s] = (0, c.useState)(null), [l, u] = (0, c.useState)(""), [d, f] = (0, c.useState)("medium"), [p, m] = (0, c.useState)([]), [h, y] = (0, c.useState)([]), [b, S] = (0, c.useState)([]), [C, w] = (0, c.useState)(!1), [k, A] = (0, c.useState)(!1), [M, P] = (0, c.useState)(""), [R, se] = (0, c.useState)(""), [ce, le] = (0, c.useState)(!1), [ue, de] = (0, c.useState)(""), fe = (0, c.useRef)(null);
	(0, c.useEffect)(() => {
		v({ surface: "agent_home" });
	}, []), (0, c.useEffect)(() => {
		B(e);
	}, [e]);
	let pe = (0, c.useCallback)((e, t = !1) => {
		let n = te(e);
		s(e), u(e.message || ""), a((e) => {
			let r = re(n);
			return t && ne(n).some((t) => t.value === e) ? e : r;
		});
	}, []), me = (0, c.useCallback)(async (e = !1) => {
		let t = await g(`/api/agent-bridge/settings${e ? "?refresh=true" : ""}`);
		pe(t, !0);
	}, [pe]);
	(0, c.useEffect)(() => {
		let e = !0;
		return g("/api/agent-bridge/settings").then((t) => {
			e && pe(t);
		}).catch((t) => {
			e && u(t instanceof Error ? t.message : "Agent 설정을 불러오지 못했습니다.");
		}), () => {
			e = !1;
		};
	}, [pe, me]), (0, c.useEffect)(() => {
		let e = (e) => {
			let t = e.detail;
			t ? pe(t) : me().catch((e) => u(e instanceof Error ? e.message : "Agent 설정을 불러오지 못했습니다."));
		};
		return window.addEventListener("folio:agent-settings-updated", e), () => window.removeEventListener("folio:agent-settings-updated", e);
	}, [pe, me]), (0, c.useEffect)(() => {
		let e = !0;
		return Promise.allSettled([g("/api/dashboard"), g("/api/investment-review")]).then((t) => {
			if (!e) return;
			let n = t[0].status === "fulfilled" ? t[0].value : null, r = [...(t[1].status === "fulfilled" ? t[1].value : null)?.recentReports || [], ...n?.briefings || []], i = /* @__PURE__ */ new Set();
			y(r.filter((e, t) => {
				let n = `${e.view || ""}:${e.date || ""}:${e.title || t}`;
				return i.has(n) ? !1 : (i.add(n), !0);
			}).slice(0, 3));
		}), () => {
			e = !1;
		};
	}, []);
	let he = (0, c.useCallback)(async () => {
		w(!0);
		try {
			let e = await g("/api/jobs");
			S((Array.isArray(e) ? e : []).filter(V).slice(0, 4));
		} finally {
			w(!1);
		}
	}, []);
	(0, c.useEffect)(() => {
		he().catch(() => void 0);
	}, [he]);
	function ge() {
		t([N]), r(""), m([]), de(""), se("");
		try {
			window.localStorage.removeItem(j);
		} catch {}
	}
	async function _e(e) {
		e.preventDefault();
		let a = n.trim();
		if (!a || ce) return;
		let s = {
			id: F(),
			role: "user",
			text: a,
			attachments: p.map((e) => e.name),
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		}, c = F(), l = Date.now(), u = te(o), f = u?.label || "Agent", h = i || u?.model || "model";
		t((e) => [
			...e,
			s,
			{
				id: c,
				role: "assistant",
				text: "",
				pending: !0,
				runState: "pending",
				runTitle: `${f} 세션 시작`,
				runMeta: `${h} · ${I(d)} · on-request`,
				createdAt: new Date(l).toISOString()
			}
		]), r(""), de(""), le(!0);
		try {
			let e = await W(await _("/api/agent/chat", {
				message: a,
				context: { surface: "agent_home" },
				options: {
					model: i,
					effort: d,
					attachments: p
				}
			})), n = e.result || {};
			he().catch(() => void 0), t((t) => t.map((t) => t.id === c ? {
				...t,
				text: n.reply || e.message || "Agent가 응답을 반환하지 않았습니다.",
				notice: n.notice,
				pending: !1,
				proposal: n.proposal || null,
				proposalStatus: n.proposal ? "pending" : "",
				runState: "done",
				runTitle: `${f} 응답`,
				runMeta: `${h} · ${I(d)} · ${L(l)}`
			} : t)), m([]);
		} catch (e) {
			let n = e instanceof Error ? e.message : "Agent 요청에 실패했습니다.";
			de(n), t((e) => e.map((e) => e.id === c ? {
				...e,
				text: n,
				pending: !1,
				runState: "error",
				runTitle: `${f} 오류`,
				runMeta: `${h} · ${I(d)}`
			} : e));
		} finally {
			le(!1);
		}
	}
	async function ve(e) {
		if (de(""), se(""), e === "analysis") {
			window.location.hash = "#/analysis";
			return;
		}
		P(e);
		try {
			if (e === "rss") {
				se("RSS 수집을 시작했습니다.");
				let e = await _("/api/rssarchive/import", {});
				ie(e) && await W(e), he().catch(() => void 0), se("RSS 수집이 끝났습니다."), window.location.hash = "#/rss";
				return;
			}
			se("오늘 브리핑을 생성하는 중입니다.");
			let t = await _("/api/briefings", {
				marketScope: "both",
				briefingType: "default"
			}), n = "";
			if (ie(t)) {
				let e = await W(t);
				n = e.result?.date || e.result?.artifactId || "";
			} else n = t.date || "";
			he().catch(() => void 0), se(n ? "오늘 브리핑을 생성했습니다." : "브리핑 생성이 끝났습니다."), window.location.hash = n ? `#/briefing/${n}/both` : "#/briefing";
		} catch (e) {
			let t = e instanceof Error ? e.message : "빠른 실행에 실패했습니다.";
			de(t), se(t);
		} finally {
			P("");
		}
	}
	async function ye(e) {
		if (!e) return;
		de("");
		let t = [...p];
		for (let n of Array.from(e)) {
			if (t.length >= D) {
				de(`첨부는 최대 ${D}개까지 가능합니다.`);
				break;
			}
			if (n.size > O) {
				de(`${n.name}은 200KB를 초과해 제외했습니다.`);
				continue;
			}
			t.push(await ee(n));
		}
		m(t), fe.current && (fe.current.value = "");
	}
	async function be(e, n, r) {
		de("");
		try {
			let i = await _(`/api/agent/proposals/${encodeURIComponent(n)}`, { action: r });
			t((t) => t.map((t) => t.id === e ? {
				...t,
				proposalStatus: i.status || r
			} : t));
		} catch (e) {
			de(e instanceof Error ? e.message : "제안 처리에 실패했습니다.");
		}
	}
	let xe = te(o), Se = ne(xe), Ce = e.some((e) => e.id !== "welcome");
	async function we(e) {
		if (a(e), !(!xe?.id || !e)) try {
			let t = Object.fromEntries((o?.adapters || []).map((e) => [e.id, e.model || ""]));
			t[xe.id] = e;
			let n = await _("/api/agent-bridge/settings", {
				provider: xe.id,
				models: t
			});
			pe(n, !0), window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: n }));
		} catch (e) {
			de(e instanceof Error ? e.message : "모델 설정 저장에 실패했습니다.");
		}
	}
	return /* @__PURE__ */ (0, x.jsx)("div", {
		className: "react-home-route",
		"data-agent-home": !0,
		children: /* @__PURE__ */ (0, x.jsxs)("div", {
			className: `agent-home ${Ce ? "has-conversation" : "is-empty"}`,
			children: [
				/* @__PURE__ */ (0, x.jsxs)("div", {
					className: "agent-home-left",
					children: [
						/* @__PURE__ */ (0, x.jsxs)("header", {
							className: "home-hero agent-home-hero",
							children: [/* @__PURE__ */ (0, x.jsx)("p", {
								className: "eyebrow",
								children: "Local Investment Research Workspace"
							}), /* @__PURE__ */ (0, x.jsx)("h1", { children: "Folio OS" })]
						}),
						/* @__PURE__ */ (0, x.jsxs)("form", {
							className: "agent-home-prompt",
							onSubmit: _e,
							children: [
								/* @__PURE__ */ (0, x.jsxs)("div", {
									className: "agent-home-prompt-shell",
									children: [/* @__PURE__ */ (0, x.jsx)("textarea", {
										value: n,
										onChange: (e) => r(e.target.value),
										onKeyDown: (e) => {
											e.key === "Enter" && !e.shiftKey && (e.preventDefault(), e.currentTarget.form?.requestSubmit());
										},
										placeholder: "Folio OS에서 무엇을 빌드할까요?",
										rows: 3
									}), /* @__PURE__ */ (0, x.jsxs)("div", {
										className: "agent-home-toolbar",
										children: [
											/* @__PURE__ */ (0, x.jsx)("input", {
												ref: fe,
												type: "file",
												multiple: !0,
												hidden: !0,
												onChange: (e) => ye(e.currentTarget.files)
											}),
											/* @__PURE__ */ (0, x.jsxs)("div", {
												className: "agent-home-toolbar-left",
												children: [/* @__PURE__ */ (0, x.jsx)("button", {
													type: "button",
													className: "agent-home-icon-btn",
													onClick: () => fe.current?.click(),
													"aria-label": "파일 첨부",
													"data-tooltip": "파일 첨부",
													children: "+"
												}), /* @__PURE__ */ (0, x.jsx)("span", {
													className: "agent-home-provider",
													children: xe?.label || xe?.id || "Folio OS"
												})]
											}),
											/* @__PURE__ */ (0, x.jsxs)("div", {
												className: "agent-home-toolbar-right",
												children: [
													/* @__PURE__ */ (0, x.jsx)("select", {
														"aria-label": "모델",
														value: i,
														onChange: (e) => we(e.target.value),
														children: Se.length > 0 ? Se.map((e) => /* @__PURE__ */ (0, x.jsx)("option", {
															value: e.value,
															children: e.label
														}, e.value)) : /* @__PURE__ */ (0, x.jsx)("option", {
															value: "",
															children: "모델 목록 없음"
														})
													}),
													/* @__PURE__ */ (0, x.jsxs)("select", {
														"aria-label": "노력 단계",
														value: d,
														onChange: (e) => f(e.target.value),
														children: [
															/* @__PURE__ */ (0, x.jsx)("option", {
																value: "low",
																children: "낮음"
															}),
															/* @__PURE__ */ (0, x.jsx)("option", {
																value: "medium",
																children: "중간"
															}),
															/* @__PURE__ */ (0, x.jsx)("option", {
																value: "high",
																children: "높음"
															}),
															/* @__PURE__ */ (0, x.jsx)("option", {
																value: "max",
																children: "최대"
															})
														]
													}),
													/* @__PURE__ */ (0, x.jsx)("button", {
														className: "agent-home-send",
														type: "submit",
														disabled: ce || !n.trim(),
														"aria-label": "전송",
														"data-tooltip": "전송",
														children: ce ? "..." : "↑"
													})
												]
											})
										]
									})]
								}),
								l && /* @__PURE__ */ (0, x.jsx)("p", {
									className: "agent-home-notice",
									children: l
								}),
								p.length > 0 && /* @__PURE__ */ (0, x.jsx)("div", {
									className: "agent-home-attachments",
									children: p.map((e) => /* @__PURE__ */ (0, x.jsxs)("span", { children: [e.name, /* @__PURE__ */ (0, x.jsx)("button", {
										type: "button",
										"aria-label": `${e.name} 첨부 제거`,
										onClick: () => m((t) => t.filter((t) => t.name !== e.name)),
										children: "×"
									})] }, e.name))
								}),
								R && /* @__PURE__ */ (0, x.jsx)("p", {
									className: "agent-home-notice",
									children: R
								}),
								ue && /* @__PURE__ */ (0, x.jsx)("p", {
									className: "agent-home-error",
									children: ue
								})
							]
						}),
						/* @__PURE__ */ (0, x.jsxs)("div", {
							className: "home-launcher agent-home-launcher",
							role: "group",
							"aria-label": "빠른 실행",
							children: [
								/* @__PURE__ */ (0, x.jsx)("button", {
									className: "launch-tile primary",
									type: "button",
									onClick: () => ve("briefing"),
									disabled: M === "briefing",
									children: M === "briefing" ? "생성 중" : "오늘 브리핑 생성"
								}),
								/* @__PURE__ */ (0, x.jsx)("button", {
									className: "launch-tile",
									type: "button",
									onClick: () => ve("rss"),
									disabled: M === "rss",
									children: M === "rss" ? "수집 중" : "RSS 수집"
								}),
								/* @__PURE__ */ (0, x.jsx)("button", {
									className: "launch-tile",
									type: "button",
									onClick: () => ve("analysis"),
									children: "기업 분석"
								})
							]
						}),
						h.length > 0 && /* @__PURE__ */ (0, x.jsxs)("div", {
							className: "review-recent-wrap agent-home-recent",
							children: [/* @__PURE__ */ (0, x.jsx)("span", {
								className: "rv-recent-cap",
								children: "최근 보고서"
							}), /* @__PURE__ */ (0, x.jsx)("div", {
								className: "rv-recent",
								children: h.map((e, t) => /* @__PURE__ */ (0, x.jsxs)("button", {
									className: "rv-rc",
									type: "button",
									"data-tooltip": `${e.title || "보고서"}${e.date ? ` · ${e.date}` : ""}`,
									onClick: () => {
										window.location.hash = ae(e);
									},
									children: [/* @__PURE__ */ (0, x.jsx)("span", {
										className: "rv-rc-k",
										children: String(e.type || e.view || "REPORT").toUpperCase()
									}), /* @__PURE__ */ (0, x.jsx)("span", {
										className: "rv-rc-t",
										children: e.title || "제목 없음"
									})]
								}, oe(e, t)))
							})]
						})
					]
				}),
				Ce && /* @__PURE__ */ (0, x.jsxs)("section", {
					className: "agent-home-thread agent-home-right",
					"aria-label": "AI Agent 대화",
					children: [/* @__PURE__ */ (0, x.jsxs)("div", {
						className: "agent-home-section-head",
						children: [/* @__PURE__ */ (0, x.jsxs)("div", { children: [/* @__PURE__ */ (0, x.jsx)("p", {
							className: "section-kicker",
							children: "Agent Thread"
						}), /* @__PURE__ */ (0, x.jsx)("h2", { children: "현재 대화" })] }), /* @__PURE__ */ (0, x.jsx)("button", {
							type: "button",
							onClick: ge,
							children: "새 대화"
						})]
					}), /* @__PURE__ */ (0, x.jsx)("div", {
						className: "agent-home-log",
						"aria-live": "polite",
						children: e.map((e) => /* @__PURE__ */ (0, x.jsxs)("article", {
							className: `agent-home-message ${e.role}${e.pending ? " pending" : ""}`,
							children: [/* @__PURE__ */ (0, x.jsxs)("div", {
								className: "agent-home-message-body",
								children: [
									e.runTitle && /* @__PURE__ */ (0, x.jsx)(E, {
										state: e.runState,
										title: e.runTitle,
										meta: e.runMeta
									}),
									e.text && /* @__PURE__ */ (0, x.jsx)(T, { text: e.text }),
									e.notice && /* @__PURE__ */ (0, x.jsx)("p", {
										className: "agent-home-notice",
										children: e.notice
									}),
									(e.attachments || []).length > 0 && /* @__PURE__ */ (0, x.jsx)("div", {
										className: "agent-home-attachments",
										children: e.attachments?.map((e) => /* @__PURE__ */ (0, x.jsx)("span", { children: e }, e))
									})
								]
							}), e.proposal && /* @__PURE__ */ (0, x.jsxs)("div", {
								className: "agent-home-proposal",
								children: [
									/* @__PURE__ */ (0, x.jsxs)("div", { children: [/* @__PURE__ */ (0, x.jsx)("strong", { children: "수정 제안" }), /* @__PURE__ */ (0, x.jsxs)("span", { children: [
										e.proposal.artifactKind,
										" ",
										e.proposal.artifactId
									] })] }),
									e.proposal.summary && /* @__PURE__ */ (0, x.jsx)("p", { children: e.proposal.summary }),
									e.proposal.diff && /* @__PURE__ */ (0, x.jsxs)("details", { children: [/* @__PURE__ */ (0, x.jsx)("summary", { children: "diff 보기" }), /* @__PURE__ */ (0, x.jsx)("pre", { children: e.proposal.diff })] }),
									e.proposalStatus === "pending" ? /* @__PURE__ */ (0, x.jsxs)("div", {
										className: "agent-home-proposal-actions",
										children: [/* @__PURE__ */ (0, x.jsx)("button", {
											type: "button",
											onClick: () => be(e.id, e.proposal.id, "approve"),
											children: "승인"
										}), /* @__PURE__ */ (0, x.jsx)("button", {
											type: "button",
											onClick: () => be(e.id, e.proposal.id, "reject"),
											children: "거절"
										})]
									}) : /* @__PURE__ */ (0, x.jsxs)("p", {
										className: "agent-home-notice",
										children: ["상태: ", e.proposalStatus]
									})
								]
							})]
						}, e.id))
					})]
				}),
				/* @__PURE__ */ (0, x.jsxs)("section", {
					className: `agent-home-jobs${k ? " open" : ""}`,
					"aria-label": "AI Agent 작업",
					children: [/* @__PURE__ */ (0, x.jsxs)("div", {
						className: "agent-home-section-head",
						children: [/* @__PURE__ */ (0, x.jsxs)("div", { children: [/* @__PURE__ */ (0, x.jsx)("p", {
							className: "section-kicker",
							children: "Agent Work"
						}), /* @__PURE__ */ (0, x.jsx)("h2", { children: "최근 작업" })] }), /* @__PURE__ */ (0, x.jsxs)("div", {
							className: "agent-home-jobs-actions",
							children: [k && /* @__PURE__ */ (0, x.jsx)("button", {
								type: "button",
								onClick: () => he().catch(() => void 0),
								disabled: C,
								children: C ? "확인 중" : "새로고침"
							}), /* @__PURE__ */ (0, x.jsx)("button", {
								type: "button",
								onClick: () => A((e) => !e),
								"aria-expanded": k,
								children: k ? "접기 ▲" : "펼치기 ▼"
							})]
						})]
					}), k ? b.length > 0 ? /* @__PURE__ */ (0, x.jsx)("div", {
						className: "agent-home-job-list",
						children: b.map((e) => {
							let t = U(e);
							return /* @__PURE__ */ (0, x.jsxs)("article", {
								className: `agent-home-job ${e.status}`,
								children: [/* @__PURE__ */ (0, x.jsxs)("div", { children: [
									/* @__PURE__ */ (0, x.jsx)("strong", { children: e.label || e.kind || "작업" }),
									/* @__PURE__ */ (0, x.jsx)("p", { children: e.message || e.error || "상태 메시지가 없습니다." }),
									/* @__PURE__ */ (0, x.jsxs)("span", {
										className: "agent-home-job-meta",
										children: [
											e.status,
											typeof e.progress == "number" ? ` · ${e.progress}%` : "",
											H(e) ? ` · ${H(e)}` : ""
										]
									})
								] }), t && /* @__PURE__ */ (0, x.jsx)("button", {
									type: "button",
									onClick: () => {
										window.location.hash = t;
									},
									children: "열기"
								})]
							}, e.id);
						})
					}) : /* @__PURE__ */ (0, x.jsx)("p", {
						className: "agent-home-empty",
						children: "아직 표시할 Agent 작업이 없습니다. Home에서 질문하거나 브리핑/RSS 빠른 실행을 사용하면 여기에 남습니다."
					}) : null]
				})
			]
		})
	});
}
//#endregion
//#region src/app/legacyBridge.ts
function ce() {
	return window.FolioBridge ?? {};
}
//#endregion
//#region src/app/reportReader/ReaderActions.tsx
function le({ title: e, children: t }) {
	return /* @__PURE__ */ (0, x.jsxs)("section", {
		className: "report-reader-rail-group",
		"aria-label": e,
		children: [/* @__PURE__ */ (0, x.jsx)("p", {
			className: "section-kicker",
			children: e
		}), /* @__PURE__ */ (0, x.jsx)("div", {
			className: "report-reader-rail-actions",
			children: t
		})]
	});
}
function ue({ icon: e, children: t, ...n }) {
	return /* @__PURE__ */ (0, x.jsxs)("button", {
		className: "report-action-btn",
		type: "button",
		...n,
		children: [/* @__PURE__ */ (0, x.jsx)(de, { name: e }), /* @__PURE__ */ (0, x.jsx)("span", { children: t })]
	});
}
function de({ name: e }) {
	return e === "agent" ? /* @__PURE__ */ (0, x.jsx)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, x.jsx)("path", { d: "m4 17 6-6-6-6m8 14h8" })
	}) : e === "link" ? /* @__PURE__ */ (0, x.jsxs)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, x.jsx)("path", {
				fill: "currentColor",
				stroke: "none",
				fillRule: "evenodd",
				clipRule: "evenodd",
				d: "M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h6.4a6 6 0 0 1 8.6-8.4V5a3 3 0 0 0-3-3H5Zm2 4a1 1 0 0 0 0 2h10a1 1 0 1 0 0-2H7Zm0 4a1 1 0 1 0 0 2h5a1 1 0 1 0 0-2H7Z"
			}),
			/* @__PURE__ */ (0, x.jsx)("path", { d: "M20.5 17.4a3 3 0 1 1-.9-2.1" }),
			/* @__PURE__ */ (0, x.jsx)("path", { d: "M20.9 14.1v2.3h-2.3" })
		]
	}) : e === "notion" ? /* @__PURE__ */ (0, x.jsx)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, x.jsx)("path", {
			fill: "currentColor",
			stroke: "none",
			d: "M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"
		})
	}) : e === "obsidian" ? /* @__PURE__ */ (0, x.jsx)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, x.jsx)("path", {
			fill: "currentColor",
			stroke: "none",
			d: "M19.355 18.538a68.967 68.959 0 0 0 1.858-2.954.81.81 0 0 0-.062-.9c-.516-.685-1.504-2.075-2.042-3.362-.553-1.321-.636-3.375-.64-4.377a1.707 1.707 0 0 0-.358-1.05l-3.198-4.064a3.744 3.744 0 0 1-.076.543c-.106.503-.307 1.004-.536 1.5-.134.29-.29.6-.446.914l-.31.626c-.516 1.068-.997 2.227-1.132 3.59-.124 1.26.046 2.73.815 4.481.128.011.257.025.386.044a6.363 6.363 0 0 1 3.326 1.505c.916.79 1.744 1.922 2.415 3.5zM8.199 22.569c.073.012.146.02.22.02.78.024 2.095.092 3.16.29.87.16 2.593.64 4.01 1.055 1.083.316 2.198-.548 2.355-1.664.114-.814.33-1.735.725-2.58l-.01.005c-.67-1.87-1.522-3.078-2.416-3.849a5.295 5.295 0 0 0-2.778-1.257c-1.54-.216-2.952.19-3.84.45.532 2.218.368 4.829-1.425 7.531zM5.533 9.938c-.023.1-.056.197-.098.29L2.82 16.059a1.602 1.602 0 0 0 .313 1.772l4.116 4.24c2.103-3.101 1.796-6.02.836-8.3-.728-1.73-1.832-3.081-2.55-3.831zM9.32 14.01c.615-.183 1.606-.465 2.745-.534-.683-1.725-.848-3.233-.716-4.577.154-1.552.7-2.847 1.235-3.95.113-.235.223-.454.328-.664.149-.297.288-.577.419-.86.217-.47.379-.885.46-1.27.08-.38.08-.72-.014-1.043-.095-.325-.297-.675-.68-1.06a1.6 1.6 0 0 0-1.475.36l-4.95 4.452a1.602 1.602 0 0 0-.513.952l-.427 2.83c.672.59 2.328 2.316 3.335 4.711.09.21.175.43.253.653z"
		})
	}) : /* @__PURE__ */ (0, x.jsxs)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, x.jsx)("path", { d: "m4 12 15-7-7 15-2-6z" }), /* @__PURE__ */ (0, x.jsx)("path", { d: "m10 14 4-4" })]
	});
}
//#endregion
//#region src/app/reportReader/MarkdownRenderer.tsx
function fe(e) {
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
function pe(e) {
	return fe(e).map((e, t) => e.type === "strong" ? /* @__PURE__ */ (0, x.jsx)("strong", { children: e.value }, t) : e.type === "code" ? /* @__PURE__ */ (0, x.jsx)("code", { children: e.value }, t) : e.type === "link" ? /* @__PURE__ */ (0, x.jsx)("a", {
		href: e.href,
		target: "_blank",
		rel: "noreferrer",
		children: e.label
	}, t) : /* @__PURE__ */ (0, x.jsx)("span", { children: e.value }, t));
}
function me(e, t) {
	e.length &&= (t.push(/* @__PURE__ */ (0, x.jsx)("p", { children: pe(e.join(" ")) }, `p-${t.length}`)), 0);
}
function he({ markdown: e = "" }) {
	let t = [], n = [], r = e.replace(/\r\n/g, "\n").split("\n"), i = [];
	function a() {
		i.length && (t.push(/* @__PURE__ */ (0, x.jsx)("ul", { children: i.map((e, t) => /* @__PURE__ */ (0, x.jsx)("li", { children: pe(e) }, t)) }, `ul-${t.length}`)), i = []);
	}
	for (let e of r) {
		let r = e.trimEnd().trim();
		if (!r) {
			me(n, t), a();
			continue;
		}
		let o = r.match(/^(#{2,4})\s+(.+)$/);
		if (o) {
			me(n, t), a();
			let e = o[1].length, r = pe(o[2]);
			e === 2 ? t.push(/* @__PURE__ */ (0, x.jsx)("h2", { children: r }, `h-${t.length}`)) : e === 3 ? t.push(/* @__PURE__ */ (0, x.jsx)("h3", { children: r }, `h-${t.length}`)) : t.push(/* @__PURE__ */ (0, x.jsx)("h4", { children: r }, `h-${t.length}`));
			continue;
		}
		let s = r.match(/^[-*]\s+(.+)$/);
		if (s) {
			me(n, t), i.push(s[1]);
			continue;
		}
		n.push(r);
	}
	return me(n, t), a(), /* @__PURE__ */ (0, x.jsx)("div", {
		className: "react-markdown markdown-brief report-body",
		children: t
	});
}
//#endregion
//#region src/app/reportReader/ReportBody.tsx
function ge(e = "") {
	let t = e.replace(/\r\n/g, "\n"), n = /^#{1,3}\s*(?:참고\s*자료|참고자료|Sources Used|Sources)\s*$/gim.exec(t);
	return !n || n.index === void 0 ? e : t.slice(0, n.index).trim();
}
function _e({ markdown: e = "", marketScope: t = "both", briefing: n, sourcePanelHtml: r = "" }) {
	let i = (0, c.useRef)(null), a = ce(), o = ge(e), s = a.renderMarkdown?.(o);
	return (0, c.useEffect)(() => {
		let e = i.current;
		if (!(!e || !n || !a.renderBriefingVisuals)) return a.renderBriefingVisuals(e, n), () => a.cleanupBriefingVisuals?.();
	}, [o, n]), s === void 0 ? /* @__PURE__ */ (0, x.jsx)(he, { markdown: o }) : /* @__PURE__ */ (0, x.jsxs)(x.Fragment, { children: [/* @__PURE__ */ (0, x.jsx)("article", {
		ref: i,
		className: "markdown-brief report-body",
		"data-market-scope": t,
		dangerouslySetInnerHTML: { __html: s }
	}), r && /* @__PURE__ */ (0, x.jsx)("div", { dangerouslySetInnerHTML: { __html: r } })] });
}
//#endregion
//#region src/app/reportReader/FolioNotePanel.tsx
var ve = [
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
].join("\n"), ye = [
	"떠오르는 생각을 자유롭게 정리해보세요. 막연한 느낌이나 궁금증 한 줄만 작성해도 됩니다.",
	"",
	"예시: \"이 주식은 앞으로 받을 수혜가 커 보여서 관심 있음\"",
	"예시: \"가격이 너무 오른 것 같은데 그래도 들고 갈 만한가?\""
].join("\n"), be = "[대화]", xe = "[투자 노트]";
function Se(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
async function Ce(e) {
	let t = e;
	for (; f(t.status);) await Se(1e3), t = await g(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "Agent 작업에 실패했습니다.");
	return t;
}
function we(e) {
	let t = String(e || ""), n = t.indexOf(xe), r = (e) => e.replace(/^\s*\[대화\]\s*/, "").trim();
	return n < 0 ? {
		message: r(t),
		note: ""
	} : {
		message: r(t.slice(0, n)),
		note: t.slice(n + 7).trim()
	};
}
function Te(e, t) {
	let n = t.trim();
	if (!n) return e;
	let r = e[e.length - 1];
	return r?.role === "user" && r.body.trim() === n ? e : [...e, {
		role: "user",
		body: n,
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	}];
}
function Ee(e, t, n = "") {
	return [...e, {
		role: "agent",
		body: t,
		summary: n || "Agent 답변",
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	}];
}
function De(e, t, n, r, i = [], a = []) {
	let o = i.slice(-8).map((e, t) => `${t + 1}. ${e.body}`).join("\n"), s = a.slice(-8).map((e, t) => {
		let { message: n, note: r } = we(e.body);
		return `${t + 1}. ${e.summary || "Agent"}: ${n || (r ? "(투자 노트 전체를 업데이트함)" : "")}`;
	}).join("\n\n");
	return [
		"현재 열린 보고서와 Folio OS Market Memory를 함께 참고해, 사용자와 대화하면서 투자 노트를 완성해줘.",
		"사용자가 적은 생각은 근거가 아니라 hypothesis다. 옹호하지 말고 검증 가능한 투자 노트로 다듬어줘.",
		"없는 사실은 지어내지 말고, 추가 확인 필요로 표시해줘.",
		"사용자 판단과 Agent가 제안하는 해석을 구분하고, 반대 근거와 다음 체크포인트를 포함해줘.",
		"사용자가 `>`로 인용한 문장이 있으면 그 문장에 대한 질문/첨삭 요청으로 이해하고 해당 부분을 중심으로 답해줘.",
		"응답 형식을 반드시 지켜줘:",
		`1) ${be} 아래에 사용자에게 하는 짧은 대화 답변(무엇을 반영/수정했는지, 확인하고 싶은 점)을 2~5문장으로 써줘.`,
		`2) 노트를 새로 만들거나 수정할 내용이 있으면 ${xe} 아래에 투자 노트 전체 Markdown을 써줘. 단순 질문에 답만 하는 경우에는 ${xe} 부분을 생략하고 기존 노트를 유지해줘.`,
		"기존 정리본이 있으면 전체를 갈아엎기보다 필요한 부분을 업데이트하고, 결정/업데이트 로그에 변경 이유를 남겨줘.",
		"투자 노트는 아래 큰 구조를 유지하되, 각 섹션은 초보 투자자가 바로 이해할 수 있게 짧고 명확하게 작성해줘.",
		ve,
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
function Oe(e, t) {
	let n = String(t || e || "note"), r = 2166136261;
	for (let e = 0; e < n.length; e += 1) r ^= n.charCodeAt(e), r = Math.imul(r, 16777619) >>> 0;
	return `${e}-${r.toString(36)}`;
}
function ke({ identity: e, linkedTitle: t, overlayMarkdown: n = "" }) {
	let [r, i] = (0, c.useState)(""), [a, o] = (0, c.useState)(""), [s, l] = (0, c.useState)(""), [u, d] = (0, c.useState)([]), [f, p] = (0, c.useState)([]), [m, h] = (0, c.useState)(""), [v, y] = (0, c.useState)("chat"), [b, S] = (0, c.useState)([]), [C, w] = (0, c.useState)(!1), [T, E] = (0, c.useState)([]), D = (0, c.useRef)(null), O = T.includes("agent_assisted"), k = (0, c.useMemo)(() => [...u, ...f].sort((e, t) => String(e.createdAt || "").localeCompare(String(t.createdAt || ""))), [u, f]);
	(0, c.useEffect)(() => {
		let t = !0;
		async function n() {
			h("불러오는 중..."), S([]), i(""), o(""), l(""), d([]), p([]);
			try {
				let n = await g(`/api/investment-notes/${encodeURIComponent(e.id)}`);
				if (!t) return;
				i(n.body || ""), d(n.rawThoughts || []), p(n.interactionLog || []), E(n.tags || []), h(n.updatedAt ? `저장됨: ${n.updatedAt}` : "Folio 로컬 노트를 불러왔습니다.");
			} catch {
				if (!t) return;
				E([]), h("생각 한 줄에서 시작하세요.");
			}
			try {
				let n = await g(`/api/investment-notes/linked?${new URLSearchParams({
					ticker: e.ticker || "",
					topic: e.topic || "",
					reportId: e.reportId || ""
				})}`);
				if (!t) return;
				S(n.notes || []);
			} catch {
				if (!t) return;
				S([]);
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
	]), (0, c.useEffect)(() => {
		let e = D.current;
		e && (e.scrollTop = e.scrollHeight);
	}, [k.length, v]);
	async function A(t, n, r, i = T) {
		let a = await _("/api/investment-notes", {
			...e,
			body: t,
			rawThoughts: n,
			interactionLog: r,
			tags: i
		});
		return E(a.tags || []), a;
	}
	function j() {
		let e = a.trim(), t = s.trim();
		return t && e ? `> ${t}\n\n${e}` : t ? `> ${t}` : e;
	}
	function M() {
		let e = window.getSelection()?.toString().replace(/\s+/g, " ").trim() || "";
		e.length >= 2 && l(e.slice(0, 400));
	}
	async function N() {
		let e = j();
		if (e) {
			h("저장 중...");
			try {
				let t = Te(u, e), n = await A(r, t, f);
				d(n.rawThoughts || t), p(n.interactionLog || f), o(""), l(""), h("생각을 기록했습니다. Agent 정리는 나중에 요청할 수 있습니다.");
			} catch (e) {
				h(e instanceof Error ? `저장 실패: ${e.message}` : "저장 실패");
			}
		}
	}
	async function P() {
		let n = j();
		if (!n || C) return;
		w(!0), h("Agent가 응답을 준비하는 중...");
		let a = Te(u, n);
		d(a), o(""), l("");
		try {
			let o = await Ce(await _("/api/agent/chat", {
				message: De(e, r, n, t, a, f),
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
			let { note: l } = we(c), u = Ee(f, c, s.notice || (l ? "투자 노트 업데이트" : "Agent 답변")), m = l || r, g = await A(m, a, u, l ? Array.from(/* @__PURE__ */ new Set([...T, "agent_assisted"])) : T);
			i(g.body || m), d(g.rawThoughts || a), p(g.interactionLog || u), h(l ? "Agent가 투자 노트를 업데이트했습니다. 완성본은 연결 자료 탭에서 확인하세요." : "Agent가 답변했습니다. 노트 본문은 그대로 유지했습니다.");
		} catch (e) {
			try {
				await A(r, a, f);
			} catch {}
			h(e instanceof Error ? `AI 정리 실패: ${e.message}` : "AI 정리 실패");
		} finally {
			w(!1);
		}
	}
	return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "react-note-panel",
		"data-report-note-panel": !0,
		children: [
			/* @__PURE__ */ (0, x.jsxs)("div", {
				className: "report-note-head react-note-panel-head",
				children: [/* @__PURE__ */ (0, x.jsx)("p", {
					className: "section-kicker",
					children: "투자 생각 정리"
				}), /* @__PURE__ */ (0, x.jsx)("div", {
					className: "report-note-tabs",
					role: "tablist",
					"aria-label": "투자 노트 모드",
					children: [["chat", "작성"], ["links", "연결 자료"]].map(([e, t]) => /* @__PURE__ */ (0, x.jsx)("button", {
						className: "report-note-tab",
						type: "button",
						"aria-pressed": v === e,
						onClick: () => y(e),
						children: t
					}, e))
				})]
			}),
			v === "chat" && /* @__PURE__ */ (0, x.jsxs)("div", {
				className: "report-note-chat",
				children: [k.length === 0 ? /* @__PURE__ */ (0, x.jsx)("p", {
					className: "report-note-empty report-note-chat-empty",
					children: "먼저 떠오르는 생각 한 줄을 남겨보세요. Agent가 열린 보고서와 Market Memory를 참고해 투자 노트로 정리해줍니다."
				}) : /* @__PURE__ */ (0, x.jsx)("ol", {
					className: "report-note-chat-list",
					ref: D,
					onMouseUp: M,
					children: k.map((e, t) => {
						let n = e.role === "agent", { message: r, note: i } = n ? we(e.body) : {
							message: e.body,
							note: ""
						};
						return /* @__PURE__ */ (0, x.jsxs)("li", {
							className: `report-note-chat-item ${n ? "is-agent" : "is-user"}`,
							children: [
								/* @__PURE__ */ (0, x.jsxs)("span", {
									className: "report-note-history-meta",
									children: [
										n ? "Agent" : "사용자",
										" ",
										e.createdAt || ""
									]
								}),
								r && /* @__PURE__ */ (0, x.jsx)("p", {
									className: "report-note-chat-text",
									children: r
								}),
								i && /* @__PURE__ */ (0, x.jsxs)("div", {
									className: "report-note-chat-note",
									children: [/* @__PURE__ */ (0, x.jsx)("span", {
										className: "report-note-chat-note-label",
										children: "완성된 투자 노트"
									}), /* @__PURE__ */ (0, x.jsx)(_e, { markdown: i })]
								})
							]
						}, `${e.role}-${e.createdAt || t}-${t}`);
					})
				}), /* @__PURE__ */ (0, x.jsxs)("div", {
					className: "report-note-composer",
					children: [
						s && /* @__PURE__ */ (0, x.jsxs)("div", {
							className: "report-note-quote-bar",
							children: [
								/* @__PURE__ */ (0, x.jsx)("span", {
									className: "report-note-quote-label",
									children: "인용"
								}),
								/* @__PURE__ */ (0, x.jsx)("p", { children: s }),
								/* @__PURE__ */ (0, x.jsx)("button", {
									type: "button",
									onClick: () => l(""),
									"aria-label": "인용 지우기",
									children: "×"
								})
							]
						}),
						/* @__PURE__ */ (0, x.jsx)("textarea", {
							className: "report-note-thought-editor",
							value: a,
							onChange: (e) => o(e.currentTarget.value),
							rows: 3,
							placeholder: ye,
							"aria-label": `${e.title} 사용자의 생각`
						}),
						/* @__PURE__ */ (0, x.jsxs)("div", {
							className: "report-note-composer-actions",
							children: [/* @__PURE__ */ (0, x.jsx)("button", {
								className: "report-note-secondary-action",
								type: "button",
								onClick: N,
								disabled: C || !j(),
								children: "생각만 기록"
							}), /* @__PURE__ */ (0, x.jsx)("button", {
								className: "report-note-primary-action",
								type: "button",
								onClick: P,
								disabled: C || !j(),
								children: C ? "Agent가 정리 중" : "Agent와 투자 노트 정리하기"
							})]
						}),
						/* @__PURE__ */ (0, x.jsx)("p", {
							className: "report-note-composer-hint",
							children: "Agent 답변이나 완성본에서 문장을 드래그하면 인용해서 이어서 물어볼 수 있습니다."
						})
					]
				})]
			}),
			v === "links" && /* @__PURE__ */ (0, x.jsxs)("div", {
				className: "report-note-links",
				children: [
					/* @__PURE__ */ (0, x.jsxs)("div", {
						className: "report-note-final",
						children: [/* @__PURE__ */ (0, x.jsxs)("div", {
							className: "report-note-section-label",
							children: [/* @__PURE__ */ (0, x.jsx)("strong", { children: "정리된 투자 노트" }), /* @__PURE__ */ (0, x.jsx)("span", { children: r.trim() ? `읽기 전용 완성본입니다. 수정은 작성 탭에서 Agent와 대화로 진행하세요.${O ? " (Agent 정리본)" : ""}` : "작성 탭에서 Agent와 정리하면 여기에 완성본이 표시됩니다." })]
						}), r.trim() ? /* @__PURE__ */ (0, x.jsx)("div", {
							className: "report-note-final-body",
							children: /* @__PURE__ */ (0, x.jsx)(_e, { markdown: r })
						}) : /* @__PURE__ */ (0, x.jsx)("p", {
							className: "report-note-empty",
							children: "아직 완성된 투자 노트가 없습니다."
						})]
					}),
					/* @__PURE__ */ (0, x.jsxs)("p", {
						className: "report-note-link-head",
						children: [/* @__PURE__ */ (0, x.jsx)("strong", { children: t || e.linkedReports?.[0] || e.title }), "에 연결된 Folio 노트와 참고 정보입니다."]
					}),
					b.length > 0 ? /* @__PURE__ */ (0, x.jsx)("ul", {
						className: "report-note-link-list",
						children: b.slice(0, 8).map((e) => /* @__PURE__ */ (0, x.jsxs)("li", { children: [/* @__PURE__ */ (0, x.jsx)("span", {
							className: "report-note-link-title",
							children: e.title || "투자 노트"
						}), /* @__PURE__ */ (0, x.jsx)("span", {
							className: "report-note-link-meta",
							children: e.ticker || e.noteType || "note"
						})] }, e.id || e.title))
					}) : /* @__PURE__ */ (0, x.jsx)("p", {
						className: "report-note-empty",
						children: "아직 연결된 노트가 없습니다."
					}),
					n && /* @__PURE__ */ (0, x.jsxs)("div", {
						className: "report-note-layer react-personal-overlay",
						children: [/* @__PURE__ */ (0, x.jsx)("p", {
							className: "section-kicker",
							children: "참고 해석"
						}), /* @__PURE__ */ (0, x.jsx)(_e, { markdown: n })]
					})
				]
			}),
			/* @__PURE__ */ (0, x.jsx)("div", {
				className: "report-note-foot",
				children: m && /* @__PURE__ */ (0, x.jsx)("p", {
					className: "report-note-status",
					children: m
				})
			})
		]
	});
}
//#endregion
//#region src/app/reportReader/ReportReaderShell.tsx
function Ae({ eyebrow: e, title: t, breadcrumb: n, actionSlot: r, noteSlot: i, noteIdentity: a, noteLinkedTitle: o, noteOverlayMarkdown: s, agentContext: l, onClose: u, children: d }) {
	let [f, p] = (0, c.useState)(!1), m = i ?? (a ? /* @__PURE__ */ (0, x.jsx)(ke, {
		identity: a,
		linkedTitle: o || t,
		overlayMarkdown: s || ""
	}) : null), h = l ? JSON.stringify(l) : "", g = [
		"report-reader-stage",
		!r && !m ? "no-side" : "",
		r ? "" : "no-rail",
		m ? "" : "no-note"
	].filter(Boolean).join(" ");
	return (0, c.useEffect)(() => {
		h && v(l || {});
	}, [l, h]), /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "report-reader-shell report-reader-inline",
		"data-report-reader-shell": !0,
		children: [/* @__PURE__ */ (0, x.jsx)("div", {
			className: "reader-breadcrumb report-reader-breadcrumb",
			children: n
		}), /* @__PURE__ */ (0, x.jsxs)("div", {
			className: g,
			children: [
				/* @__PURE__ */ (0, x.jsxs)("main", {
					className: "report-reader-dialog report-reader-main",
					"aria-label": "보고서 리더",
					children: [/* @__PURE__ */ (0, x.jsx)("div", {
						className: "report-reader-head",
						children: u && /* @__PURE__ */ (0, x.jsx)("button", {
							className: "icon-btn",
							type: "button",
							onClick: u,
							"aria-label": "리더 닫기",
							"data-tooltip": "닫기",
							"data-tooltip-pos": "left",
							children: "×"
						})
					}), /* @__PURE__ */ (0, x.jsxs)("div", {
						className: "report-reader-body",
						children: [/* @__PURE__ */ (0, x.jsxs)("section", {
							className: "report-hero react-report-hero",
							children: [e && /* @__PURE__ */ (0, x.jsx)("p", {
								className: "report-kicker",
								children: e
							}), /* @__PURE__ */ (0, x.jsx)("h1", { children: t })]
						}), /* @__PURE__ */ (0, x.jsx)("article", {
							className: "headline react-report-card",
							children: d
						})]
					})]
				}),
				r && /* @__PURE__ */ (0, x.jsx)("aside", {
					className: "report-reader-rail",
					"aria-label": "보고서 조작 패널",
					children: r
				}),
				m && /* @__PURE__ */ (0, x.jsxs)(x.Fragment, { children: [/* @__PURE__ */ (0, x.jsx)("button", {
					className: f ? "report-note-grip is-open" : "report-note-grip",
					type: "button",
					"aria-label": "투자 노트 열기",
					"aria-controls": "report-reader-note-panel",
					"aria-expanded": f,
					onClick: () => p(!0)
				}), /* @__PURE__ */ (0, x.jsx)("aside", {
					id: "report-reader-note-panel",
					className: f ? "report-note-panel is-open" : "report-note-panel",
					"aria-label": "투자 노트",
					children: /* @__PURE__ */ (0, x.jsxs)("div", {
						className: "report-note-inner",
						children: [/* @__PURE__ */ (0, x.jsx)("button", {
							className: "report-note-mobile-close",
							type: "button",
							"aria-label": "투자 노트 닫기",
							onClick: () => p(!1),
							children: "×"
						}), m]
					})
				})] })
			]
		})]
	});
}
//#endregion
//#region src/app/RouteHero.tsx
function je({ eyebrow: e, title: t, description: n, actions: r }) {
	return /* @__PURE__ */ (0, x.jsxs)("header", {
		className: "react-route-hero",
		children: [/* @__PURE__ */ (0, x.jsxs)("div", {
			className: "react-route-hero-copy",
			children: [
				/* @__PURE__ */ (0, x.jsx)("p", {
					className: "react-route-hero-eyebrow",
					children: e
				}),
				/* @__PURE__ */ (0, x.jsx)("h1", { children: t }),
				/* @__PURE__ */ (0, x.jsx)("p", {
					className: "react-route-hero-description",
					children: n
				})
			]
		}), r && /* @__PURE__ */ (0, x.jsx)("div", {
			className: "react-route-hero-actions",
			children: r
		})]
	});
}
//#endregion
//#region src/app/BriefingRoute.tsx
var Me = {
	us: "미국",
	kr: "한국",
	both: "통합"
}, Ne = {
	us: "US",
	kr: "KR",
	both: "US/KR"
}, Pe = /* @__PURE__ */ new Set([
	"미국장",
	"한국장",
	"종합"
]), Fe = {
	default: "기본",
	market_focused: "시황 중심",
	concise: "요약"
}, Ie = 20;
function Le(e) {
	return String(e || "").replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1.$2.$3");
}
function Re(e) {
	let t = String(e || "").match(/^(\d{4})-(\d{2})/);
	return t ? `${t[1]}.${t[2]}` : "월 미상";
}
function ze() {
	let e = /* @__PURE__ */ new Date(), t = e.getTimezoneOffset() * 6e4;
	return new Date(e.getTime() - t).toISOString().slice(0, 10);
}
function Be(e) {
	return String(e || "").replace(/\s+[—–-]\s+\d{4}[.-]\d{2}[.-]\d{2}\s*$/, "").trim();
}
function Ve(e) {
	let t = Je(e), n = Ye(e), r = n === "us" ? "US Market Briefing" : n === "kr" ? "KR Market Briefing" : Be(e.title || "Daily Market Briefing"), i = Le(t);
	return {
		date: t,
		scope: n,
		title: i ? `${r} — ${i}` : r,
		chips: (e.tags || []).filter((e) => !Pe.has(String(e || "").trim())),
		foot: `${e.sessionDate ? `시장 기준일 ${e.sessionDate}` : "시장 기준일 미상"} · ${e.generatedAt ? new Date(e.generatedAt).toLocaleString("ko-KR") : "생성 시각 미상"}`
	};
}
function He(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function Ue(e) {
	return e === "us" || e === "kr" || e === "both" ? e : "both";
}
function We() {
	let e = window.location.hash.match(/^#\/?briefing\/(\d{4}-\d{2}-\d{2})(?:\/(us|kr|both))?$/);
	return e ? {
		date: e[1],
		scope: Ue(e[2])
	} : null;
}
function Ge() {
	return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "briefing";
}
function Ke(e, t = "both") {
	window.location.hash = e ? `#/briefing/${e}/${t}` : "#/briefing";
}
function qe(e = "", t = "시장 브리핑") {
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
function Je(e) {
	return e.reportDate || e.date || "";
}
function Ye(e) {
	return Ue(e.marketScope || e.scope);
}
function Xe(e) {
	return String(e || "").trim().toLowerCase();
}
function Ze(e, t) {
	let n = String(t || e || "note"), r = 2166136261;
	for (let e = 0; e < n.length; e += 1) r ^= n.charCodeAt(e), r = Math.imul(r, 16777619) >>> 0;
	return `${e}-${r.toString(36)}`;
}
function Qe(e, t) {
	return {
		id: Ze("brief", `${e}:${t}`),
		noteType: "market_memo",
		title: e ? `브리핑 ${e} 투자 노트` : "브리핑 투자 노트",
		label: e ? `브리핑 ${e}` : "브리핑",
		topic: t,
		reportKind: "briefing",
		reportId: e,
		linkedReports: [e ? `Daily Market Briefing — ${e}` : ""].filter(Boolean)
	};
}
function $e(e) {
	let t = e;
	return !!(t?.id && f(t.status));
}
async function et(e) {
	let t = e;
	for (; f(t.status);) await He(1e3), t = await g(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "브리핑 생성에 실패했습니다.");
	return t;
}
function tt() {
	let [e, t] = (0, c.useState)(null), [n, r] = (0, c.useState)(() => We()), [i, a] = (0, c.useState)(null), [o, s] = (0, c.useState)(!1), [l, u] = (0, c.useState)(!1), [d, f] = (0, c.useState)(""), [p, m] = (0, c.useState)(""), [h, b] = (0, c.useState)(""), [S, C] = (0, c.useState)("us"), [w, T] = (0, c.useState)("default"), [E, D] = (0, c.useState)(() => ze()), [O, k] = (0, c.useState)(""), [A, j] = (0, c.useState)("all"), [M, N] = (0, c.useState)("all"), [P, F] = (0, c.useState)(""), [I, L] = (0, c.useState)(""), [R, z] = (0, c.useState)("recent"), B = (0, c.useCallback)(async () => {
		s(!0), f("");
		try {
			let e = await g(`/api/briefings/index?${new URLSearchParams({
				offset: "0",
				limit: "100",
				q: O,
				marketScope: A,
				briefingType: M,
				dateFrom: P,
				dateTo: I
			})}`);
			t(e), v({
				surface: "briefing",
				viewId: "briefing",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			f(e instanceof Error ? e.message : "브리핑 목록을 불러오지 못했습니다.");
		} finally {
			s(!1);
		}
	}, [
		I,
		A,
		O,
		P,
		M
	]);
	(0, c.useEffect)(() => {
		B();
	}, [B]), (0, c.useEffect)(() => {
		let e = () => {
			Ge() && r(We());
		};
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []), (0, c.useEffect)(() => {
		let e = !0;
		async function t(t, n) {
			s(!0), f("");
			try {
				let r = await g(`/api/briefings/${encodeURIComponent(t)}?includePersonal=true&marketScope=${encodeURIComponent(n)}`);
				if (!e) return;
				a(r), v({
					surface: "briefing_reader",
					viewId: "briefing",
					reportKind: "briefing",
					reportId: t,
					marketScope: n
				});
			} catch (t) {
				if (!e) return;
				a(null), f(t instanceof Error ? t.message : "브리핑을 불러오지 못했습니다.");
			} finally {
				e && s(!1);
			}
		}
		return n ? t(n.date, n.scope) : (a(null), v({
			surface: "briefing",
			viewId: "briefing",
			reportKind: "",
			reportId: ""
		})), () => {
			e = !1;
		};
	}, [n]);
	async function V(e) {
		let t = i?.date || n?.date || "", r = Ue(i?.marketScope || n?.scope);
		if (t) {
			b(e), m(e === "notion" ? "Notion에 내보내는 중..." : "Obsidian에 내보내는 중...");
			try {
				let n = e === "notion" ? await _(`/api/briefings/${encodeURIComponent(t)}/export-notion?marketScope=${encodeURIComponent(r)}`, { marketScope: r }) : await _(`/api/briefings/${encodeURIComponent(t)}/export-obsidian?marketScope=${encodeURIComponent(r)}`, { marketScope: r });
				m(e === "notion" ? n.notionUrl ? `Notion 내보냄: ${n.title || n.notionUrl}` : "Notion에 내보냈습니다." : `Obsidian 내보냄: ${n.filename || t}`);
			} catch (e) {
				m(e instanceof Error ? e.message : "내보내기에 실패했습니다.");
			} finally {
				b("");
			}
		}
	}
	async function H() {
		let e = i?.date || n?.date || "", t = Ue(i?.marketScope || n?.scope);
		if (e) {
			b("overlay"), m("개인 해석을 생성하는 중...");
			try {
				let n = await _(`/api/briefings/${encodeURIComponent(e)}/personal-overlay?marketScope=${encodeURIComponent(t)}`, { marketScope: t });
				$e(n) && await et(n);
				let r = await g(`/api/briefings/${encodeURIComponent(e)}?includePersonal=true&marketScope=${encodeURIComponent(t)}`);
				a(r), m("개인 해석을 생성했습니다.");
			} catch (e) {
				m(e instanceof Error ? e.message : "개인 해석 생성에 실패했습니다.");
			} finally {
				b("");
			}
		}
	}
	async function U(e, t) {
		if (e && window.confirm(`${e} ${Me[t]} 브리핑을 삭제할까요?`)) {
			b(`delete-${e}-${t}`);
			try {
				let n = t === "both" ? "" : `?market=${encodeURIComponent(t)}`;
				await fetch(`/api/briefings/${encodeURIComponent(e)}${n}`, { method: "DELETE" }), await B();
			} catch (e) {
				f(e instanceof Error ? e.message : "브리핑 삭제에 실패했습니다.");
			} finally {
				b("");
			}
		}
	}
	async function W(e) {
		u(!0), f("");
		try {
			let t = await _("/api/briefings", {
				date: e || void 0,
				strictDate: !!e,
				marketScope: S,
				briefingType: w
			});
			if ($e(t)) {
				let n = await et(t), r = n.result?.date || n.result?.artifactId || e || "";
				await B(), r && Ke(r, S);
				return;
			}
			let n = t.date || e || "";
			await B(), n && Ke(n, Ue(t.marketScope || S));
		} catch (e) {
			f(e instanceof Error ? e.message : "브리핑 생성에 실패했습니다.");
		} finally {
			u(!1);
		}
	}
	let ee = e?.items || [], te = (0, c.useMemo)(() => {
		let e = Xe(O);
		return ee.filter((t) => {
			let n = Je(t), r = Ye(t), i = t.briefingType || "default";
			return A !== "all" && r !== A || M !== "all" && i !== M || P && n && n < P || I && n && n > I ? !1 : e ? Xe([
				t.title,
				n,
				t.sessionDate,
				t.generatedAt,
				i,
				...t.tags || []
			].filter(Boolean).join(" ")).includes(e) : !0;
		});
	}, [
		I,
		A,
		O,
		P,
		M,
		ee
	]), ne = (0, c.useMemo)(() => {
		let e = [...te].sort((e, t) => String(Je(t) || t.generatedAt || "").localeCompare(String(Je(e) || e.generatedAt || "")));
		if (R === "recent") return e.length ? [{
			label: `최근 브리핑 ${Math.min(e.length, Ie)}건`,
			rows: e.slice(0, Ie)
		}] : [];
		if (R === "month") {
			let t = /* @__PURE__ */ new Map();
			for (let n of e) {
				let e = Re(Je(n));
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
			"both"
		].map((t) => ({
			label: `${Me[t]} 시장`,
			rows: e.filter((e) => Ye(e) === t)
		})).filter((e) => e.rows.length > 0);
	}, [R, te]), re = (0, c.useMemo)(() => qe(i?.markdown || "", i?.title || "시장 브리핑"), [i?.markdown, i?.title]);
	return n && i ? /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "react-briefing-route",
		"data-briefing-route": !0,
		children: [d && /* @__PURE__ */ (0, x.jsx)("p", {
			className: "react-dashboard-error",
			children: d
		}), /* @__PURE__ */ (0, x.jsx)(Ae, {
			eyebrow: `DAILY BRIEFING · ${i.date || n.date}`,
			title: re.title,
			agentContext: {
				surface: "briefing_reader",
				viewId: "briefing",
				reportKind: "briefing",
				reportId: i.date || n.date,
				marketScope: Ue(i.marketScope || n.scope)
			},
			breadcrumb: /* @__PURE__ */ (0, x.jsxs)(x.Fragment, { children: [/* @__PURE__ */ (0, x.jsx)("button", {
				type: "button",
				onClick: () => Ke(),
				children: "브리핑"
			}), /* @__PURE__ */ (0, x.jsx)("span", { children: re.title })] }),
			onClose: () => Ke(),
			actionSlot: /* @__PURE__ */ (0, x.jsxs)(x.Fragment, { children: [
				/* @__PURE__ */ (0, x.jsx)(le, {
					title: "AI",
					children: /* @__PURE__ */ (0, x.jsx)(ue, {
						icon: "agent",
						onClick: () => y({
							surface: "briefing_reader",
							reportKind: "briefing",
							reportId: i.date || n.date,
							marketScope: Ue(i.marketScope || n.scope),
							message: `${re.title}의 핵심과 투자 판단 체크포인트를 요약해줘.`,
							autoSubmit: !0
						}),
						children: "Agent에게 묻기"
					})
				}),
				/* @__PURE__ */ (0, x.jsx)(le, {
					title: "노트",
					children: /* @__PURE__ */ (0, x.jsx)(ue, {
						icon: "link",
						disabled: h === "overlay",
						onClick: H,
						children: h === "overlay" ? "생성 중" : "내 노트와 연결"
					})
				}),
				/* @__PURE__ */ (0, x.jsxs)(le, {
					title: "내보내기",
					children: [/* @__PURE__ */ (0, x.jsx)(ue, {
						icon: "notion",
						disabled: h === "notion",
						onClick: () => V("notion"),
						children: h === "notion" ? "내보내는 중" : "Notion으로 내보내기"
					}), /* @__PURE__ */ (0, x.jsx)(ue, {
						icon: "obsidian",
						disabled: h === "obsidian",
						onClick: () => V("obsidian"),
						children: h === "obsidian" ? "내보내는 중" : "Obsidian으로 내보내기"
					})]
				}),
				p && /* @__PURE__ */ (0, x.jsx)("p", {
					className: "react-reader-status",
					children: p
				})
			] }),
			noteIdentity: Qe(i.date || n.date, Ue(i.marketScope || n.scope)),
			noteLinkedTitle: re.title,
			noteOverlayMarkdown: i.personalOverlay?.markdown || "",
			children: /* @__PURE__ */ (0, x.jsx)(_e, {
				markdown: re.body || i.markdown || "",
				marketScope: Ue(i.marketScope || n.scope),
				briefing: i,
				sourcePanelHtml: ce().briefingSourcePanelHtml?.(i) || ""
			})
		})]
	}) : /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "react-briefing-route",
		"data-briefing-route": !0,
		children: [
			/* @__PURE__ */ (0, x.jsx)(je, {
				eyebrow: "Briefing",
				title: "브리핑",
				description: "수집된 최신 뉴스와 시장 데이터를 바탕으로 미국장과 한국장 흐름을 요약합니다."
			}),
			/* @__PURE__ */ (0, x.jsx)("section", {
				className: "brief-gen-box input-panel react-briefing-generation",
				"aria-label": "브리핑 생성",
				children: /* @__PURE__ */ (0, x.jsxs)("section", {
					className: "brief-gen-panel brief-gen-settings",
					children: [
						/* @__PURE__ */ (0, x.jsx)("div", {
							className: "brief-gen-panel-head",
							children: /* @__PURE__ */ (0, x.jsx)("h3", { children: "브리핑 설정" })
						}),
						/* @__PURE__ */ (0, x.jsxs)("div", {
							className: "brief-gen-settings-row",
							children: [/* @__PURE__ */ (0, x.jsx)("div", {
								className: "brief-gen-field brief-gen-market-field",
								children: /* @__PURE__ */ (0, x.jsxs)("div", {
									className: "brief-market-segment",
									role: "radiogroup",
									"aria-label": "시장 범위",
									"data-scope": S,
									children: [/* @__PURE__ */ (0, x.jsx)("span", {
										className: "brief-market-segment-title",
										children: "시장"
									}), [
										["both", "종합"],
										["us", "미국장"],
										["kr", "한국장"]
									].map(([e, t]) => /* @__PURE__ */ (0, x.jsxs)("label", { children: [/* @__PURE__ */ (0, x.jsx)("input", {
										type: "radio",
										name: "reactBriefingMarketScope",
										value: e,
										checked: S === e,
										onChange: () => C(e)
									}), /* @__PURE__ */ (0, x.jsx)("span", { children: t })] }, e))]
								})
							}), /* @__PURE__ */ (0, x.jsxs)("label", {
								className: "gen-option quality-option",
								children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "유형" }), /* @__PURE__ */ (0, x.jsx)("select", {
									value: w,
									onChange: (e) => T(e.currentTarget.value),
									children: Object.entries(Fe).map(([e, t]) => /* @__PURE__ */ (0, x.jsx)("option", {
										value: e,
										children: t
									}, e))
								})]
							})]
						}),
						/* @__PURE__ */ (0, x.jsxs)("div", {
							className: "brief-gen-actionbar",
							children: [
								/* @__PURE__ */ (0, x.jsx)("button", {
									className: "filter-btn clear icon-btn",
									type: "button",
									onClick: B,
									disabled: o,
									"aria-label": "새로고침",
									"data-tooltip": "새로고침",
									children: "↻"
								}),
								/* @__PURE__ */ (0, x.jsx)("button", {
									className: "filter-btn apply",
									type: "button",
									onClick: () => W(),
									disabled: l,
									children: l ? "생성 중" : "오늘 브리핑 생성"
								}),
								/* @__PURE__ */ (0, x.jsx)("span", {
									className: "brief-gen-actionbar-divider",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, x.jsx)("input", {
									type: "date",
									value: E,
									onChange: (e) => D(e.currentTarget.value),
									"aria-label": "생성할 브리핑 날짜"
								}),
								/* @__PURE__ */ (0, x.jsx)("button", {
									className: "filter-btn clear",
									type: "button",
									onClick: () => W(E),
									disabled: l || !E,
									children: "이 날짜로 생성"
								})
							]
						})
					]
				})
			}),
			d && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "react-dashboard-error",
				children: d
			}),
			/* @__PURE__ */ (0, x.jsxs)("section", {
				className: "input-panel react-briefing-archive-panel report-feed-controls",
				"aria-label": "저장 브리핑 검색",
				children: [/* @__PURE__ */ (0, x.jsxs)("div", {
					className: "briefing-archive-filters",
					children: [
						/* @__PURE__ */ (0, x.jsxs)("label", { children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "검색" }), /* @__PURE__ */ (0, x.jsx)("input", {
							type: "search",
							value: O,
							onChange: (e) => k(e.currentTarget.value),
							placeholder: "제목·요약·본문 검색"
						})] }),
						/* @__PURE__ */ (0, x.jsxs)("label", { children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "시작일" }), /* @__PURE__ */ (0, x.jsx)("input", {
							type: "date",
							value: P,
							onChange: (e) => F(e.currentTarget.value)
						})] }),
						/* @__PURE__ */ (0, x.jsxs)("label", { children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "종료일" }), /* @__PURE__ */ (0, x.jsx)("input", {
							type: "date",
							value: I,
							onChange: (e) => L(e.currentTarget.value)
						})] }),
						/* @__PURE__ */ (0, x.jsx)("button", {
							className: "filter-btn clear",
							type: "button",
							onClick: () => {
								k(""), j("all"), N("all"), F(""), L(""), z("recent");
							},
							children: "초기화"
						})
					]
				}), /* @__PURE__ */ (0, x.jsxs)("div", {
					className: "briefing-archive-summary",
					children: [/* @__PURE__ */ (0, x.jsxs)("span", { children: [te.length, "건"] }), /* @__PURE__ */ (0, x.jsx)("span", {
						"aria-live": "polite",
						children: o ? "불러오는 중..." : O ? "검색 결과" : ""
					})]
				})]
			}),
			/* @__PURE__ */ (0, x.jsx)("div", {
				className: "report-feed-outside-controls",
				"aria-label": "브리핑 표시 옵션",
				children: /* @__PURE__ */ (0, x.jsxs)("div", {
					className: "report-feed-view-row",
					children: [
						/* @__PURE__ */ (0, x.jsx)("span", { children: "시장" }),
						/* @__PURE__ */ (0, x.jsx)("label", {
							className: "report-feed-view-pill",
							children: /* @__PURE__ */ (0, x.jsxs)("select", {
								value: A,
								onChange: (e) => j(e.currentTarget.value),
								children: [
									/* @__PURE__ */ (0, x.jsx)("option", {
										value: "all",
										children: "전체"
									}),
									/* @__PURE__ */ (0, x.jsx)("option", {
										value: "us",
										children: "미국장"
									}),
									/* @__PURE__ */ (0, x.jsx)("option", {
										value: "kr",
										children: "한국장"
									}),
									/* @__PURE__ */ (0, x.jsx)("option", {
										value: "both",
										children: "종합 보고서"
									})
								]
							})
						}),
						/* @__PURE__ */ (0, x.jsx)("span", { children: "유형" }),
						/* @__PURE__ */ (0, x.jsx)("label", {
							className: "report-feed-view-pill",
							children: /* @__PURE__ */ (0, x.jsxs)("select", {
								value: M,
								onChange: (e) => N(e.currentTarget.value),
								children: [/* @__PURE__ */ (0, x.jsx)("option", {
									value: "all",
									children: "전체"
								}), Object.entries(Fe).map(([e, t]) => /* @__PURE__ */ (0, x.jsx)("option", {
									value: e,
									children: t
								}, e))]
							})
						}),
						/* @__PURE__ */ (0, x.jsx)("span", { children: "보기" }),
						/* @__PURE__ */ (0, x.jsx)("label", {
							className: "report-feed-view-pill",
							children: /* @__PURE__ */ (0, x.jsxs)("select", {
								value: R,
								onChange: (e) => z(e.currentTarget.value),
								children: [
									/* @__PURE__ */ (0, x.jsx)("option", {
										value: "recent",
										children: "최근"
									}),
									/* @__PURE__ */ (0, x.jsx)("option", {
										value: "month",
										children: "월별"
									}),
									/* @__PURE__ */ (0, x.jsx)("option", {
										value: "market",
										children: "시장별"
									})
								]
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, x.jsx)("section", {
				className: "briefing-archive-feed",
				"aria-label": "저장 브리핑",
				children: ne.length ? ne.map((e) => /* @__PURE__ */ (0, x.jsxs)("div", {
					className: "briefing-archive-date-group",
					children: [/* @__PURE__ */ (0, x.jsx)("h3", { children: e.label }), e.rows.map((e) => {
						let t = Ve(e), n = h === `delete-${t.date}-${t.scope}`;
						return /* @__PURE__ */ (0, x.jsxs)("div", {
							className: "briefing-archive-card-wrap",
							children: [/* @__PURE__ */ (0, x.jsxs)("button", {
								type: "button",
								className: `briefing-archive-card is-${t.scope}`,
								onClick: () => t.date && Ke(t.date, t.scope),
								children: [
									/* @__PURE__ */ (0, x.jsxs)("span", {
										className: "briefing-archive-card-meta",
										children: [/* @__PURE__ */ (0, x.jsx)("span", {
											className: "briefing-archive-market",
											children: Ne[t.scope]
										}), t.chips.map((e) => /* @__PURE__ */ (0, x.jsx)("span", {
											className: "briefing-archive-chip",
											children: e
										}, e))]
									}),
									/* @__PURE__ */ (0, x.jsx)("strong", { children: t.title }),
									/* @__PURE__ */ (0, x.jsx)("span", {
										className: "briefing-archive-card-foot",
										children: t.foot
									})
								]
							}), /* @__PURE__ */ (0, x.jsx)("button", {
								type: "button",
								className: "briefing-archive-card-delete",
								disabled: n,
								onClick: () => U(t.date, t.scope),
								"aria-label": `${t.date} 브리핑 삭제`,
								"data-tooltip": "삭제",
								children: /* @__PURE__ */ (0, x.jsx)("svg", {
									width: "14",
									height: "14",
									viewBox: "0 0 16 16",
									fill: "none",
									stroke: "currentColor",
									strokeWidth: "1.4",
									strokeLinecap: "round",
									strokeLinejoin: "round",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, x.jsx)("path", { d: "M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" })
								})
							})]
						}, e.id || `${t.date}-${t.scope}`);
					})]
				}, e.label)) : /* @__PURE__ */ (0, x.jsx)("div", {
					className: "briefing-archive-empty",
					children: "조건에 맞는 저장 브리핑이 없습니다."
				})
			})
		]
	});
}
//#endregion
//#region src/app/routes.ts
var nt = [
	{
		id: "home",
		label: "홈",
		group: "home"
	},
	{
		id: "dashboard",
		label: "대시보드",
		group: "home",
		visibleInNav: !1
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
		group: "research",
		visibleInNav: !1
	},
	{
		id: "watchlist",
		label: "워치리스트",
		group: "home",
		visibleInNav: !1
	},
	{
		id: "settings",
		label: "설정",
		group: "system"
	}
], rt = nt.filter((e) => e.visibleInNav !== !1), it = "home";
function at(e) {
	let t = e.replace(/^#\/?/, "").split("/")[0];
	return nt.some((e) => e.id === t) ? t : it;
}
function ot(e) {
	return `#/${e}`;
}
function st(e) {
	return nt.find((t) => t.id === e) ?? nt[0];
}
//#endregion
//#region src/app/CommandPalette.tsx
function ct(e) {
	return e === "home" ? "Agent Home" : e === "dashboard" ? "위젯과 하단 대시보드" : e === "briefing" ? "저장 브리핑과 생성" : e === "rss" ? "RSS 수집 자료" : e === "market-memory" ? "중기 시장 내러티브" : e === "analysis" ? "기업 분석 보고서" : e === "deep-research" ? "딥 리서치 보고서" : e === "watchlist" ? "워치리스트" : "설정";
}
function lt(e) {
	return e === "us" || e === "kr" || e === "both" ? e : "both";
}
function ut(e) {
	return e.reportDate || e.date || "";
}
function dt() {
	let [e, t] = (0, c.useState)(!1), [n, r] = (0, c.useState)(""), [i, a] = (0, c.useState)(0), [o, s] = (0, c.useState)(null), l = (0, c.useRef)(null);
	(0, c.useEffect)(() => {
		if (!e || o) return;
		let t = !0;
		return g("/api/dashboard").then((e) => {
			t && s(e);
		}).catch(() => {
			t && s({ briefings: [] });
		}), () => {
			t = !1;
		};
	}, [o, e]), (0, c.useEffect)(() => {
		if (document.body.classList.toggle("command-palette-open", e), !e) return;
		let t = window.requestAnimationFrame(() => l.current?.focus());
		return () => {
			window.cancelAnimationFrame(t), document.body.classList.remove("command-palette-open");
		};
	}, [e]);
	let u = (0, c.useMemo)(() => {
		let e = rt.map((e) => ({
			id: `route:${e.id}`,
			title: e.label,
			subtitle: ct(e.id),
			type: "화면",
			run: () => {
				window.location.hash = ot(e.id);
			}
		})), t = (o?.briefings || []).slice(0, 12).map((e) => {
			let t = ut(e), n = lt(e.marketScope || e.scope);
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
				run: () => y({ surface: "command_palette" })
			},
			...e,
			...t
		];
	}, [o?.briefings]), d = (0, c.useMemo)(() => {
		let e = n.trim().toLowerCase();
		return (e ? u.filter((t) => `${t.title} ${t.subtitle} ${t.type}`.toLowerCase().includes(e)) : u).slice(0, 40);
	}, [u, n]);
	(0, c.useEffect)(() => {
		a((e) => Math.min(e, Math.max(0, d.length - 1)));
	}, [d.length]);
	function f() {
		t(!1), r(""), a(0);
	}
	function p(e = i) {
		let t = d[e];
		t && (t.run(), f());
	}
	return (0, c.useEffect)(() => {
		let n = (n) => {
			let r = n.key || "";
			if ((n.ctrlKey || n.metaKey) && r.toLowerCase() === "k") {
				n.preventDefault(), t((e) => !e);
				return;
			}
			if (e) {
				if (r === "Escape") {
					n.preventDefault(), f();
					return;
				}
				if (r === "ArrowDown") {
					n.preventDefault(), a((e) => Math.min(Math.max(0, d.length - 1), e + 1));
					return;
				}
				if (r === "ArrowUp") {
					n.preventDefault(), a((e) => Math.max(0, e - 1));
					return;
				}
				r === "Enter" && (n.preventDefault(), p());
			}
		};
		return document.addEventListener("keydown", n), () => document.removeEventListener("keydown", n);
	}, [
		i,
		d,
		e
	]), e ? /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "command-palette react-command-palette",
		"data-react-command-palette": !0,
		children: [/* @__PURE__ */ (0, x.jsx)("button", {
			className: "command-backdrop",
			type: "button",
			"aria-label": "명령 팔레트 닫기",
			onClick: f
		}), /* @__PURE__ */ (0, x.jsxs)("section", {
			className: "command-dialog",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "reactCommandPaletteTitle",
			children: [
				/* @__PURE__ */ (0, x.jsxs)("div", {
					className: "command-input-row",
					children: [/* @__PURE__ */ (0, x.jsx)("span", {
						className: "command-mark",
						"aria-hidden": "true",
						children: "⌘K"
					}), /* @__PURE__ */ (0, x.jsx)("input", {
						ref: l,
						value: n,
						onChange: (e) => {
							r(e.currentTarget.value), a(0);
						},
						placeholder: "화면, 보고서, 액션 검색",
						"aria-label": "명령 검색"
					})]
				}),
				/* @__PURE__ */ (0, x.jsx)("h2", {
					id: "reactCommandPaletteTitle",
					children: "명령 팔레트"
				}),
				/* @__PURE__ */ (0, x.jsx)("div", {
					className: "command-list",
					role: "listbox",
					"aria-label": "명령 목록",
					children: d.length ? d.map((e, t) => /* @__PURE__ */ (0, x.jsxs)("button", {
						className: `command-item${t === i ? " active" : ""}`,
						type: "button",
						role: "option",
						"aria-selected": t === i,
						onMouseEnter: () => a(t),
						onClick: () => p(t),
						children: [/* @__PURE__ */ (0, x.jsxs)("span", { children: [/* @__PURE__ */ (0, x.jsx)("span", {
							className: "command-item-title",
							children: e.title
						}), /* @__PURE__ */ (0, x.jsx)("span", {
							className: "command-item-subtitle",
							children: e.subtitle
						})] }), /* @__PURE__ */ (0, x.jsx)("span", {
							className: "command-item-type",
							children: e.type
						})]
					}, e.id)) : /* @__PURE__ */ (0, x.jsx)("div", {
						className: "command-empty",
						children: "검색 결과가 없습니다."
					})
				}),
				/* @__PURE__ */ (0, x.jsx)("div", {
					className: "command-footer",
					children: "Ctrl/⌘ K로 열고, Enter로 실행합니다."
				})
			]
		})]
	}) : null;
}
//#endregion
//#region src/app/reportReader/AnalysisCharts.tsx
var ft = [
	"#0f172a",
	"#2f6f9f",
	"#3d8f64",
	"#c99a33",
	"#9a5b72"
], pt = {
	revenue: "Revenue",
	grossProfit: "Gross Profit",
	operatingIncome: "Operating Income",
	netIncome: "Net Income",
	operatingCashFlow: "Operating CF",
	capitalExpenditure: "Capex",
	freeCashFlow: "Free CF",
	grossMargin: "Gross Margin",
	operatingMargin: "Operating Margin",
	netMargin: "Net Margin",
	fcfMargin: "FCF Margin"
};
function mt(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function ht(e) {
	return Array.isArray(e) ? e.map(mt) : [];
}
function gt(e) {
	let t = String(e || "USD").toUpperCase();
	return t === "KRW" || t === "KRX" ? "₩" : t === "JPY" ? "¥" : t === "EUR" ? "€" : t === "GBP" ? "£" : "$";
}
function _t(e, t = "plain", n) {
	if (e === null) return "-";
	if (t === "percent") return `${(e * 100).toFixed(1)}%`;
	if (t === "money") {
		let t = gt(n), r = Math.abs(e);
		return r >= 0xe8d4a51000 ? `${t}${(e / 0xe8d4a51000).toFixed(1)}T` : r >= 1e9 ? `${t}${(e / 1e9).toFixed(1)}B` : r >= 1e6 ? `${t}${(e / 1e6).toFixed(1)}M` : `${t}${e.toLocaleString(void 0, { maximumFractionDigits: 2 })}`;
	}
	return e.toFixed(Math.abs(e) >= 100 ? 0 : 1);
}
function vt(e) {
	return ({
		performance: [
			["revenue", "money"],
			["operatingIncome", "money"],
			["netIncome", "money"]
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
		label: pt[t] || t,
		values: ht(e[t]),
		kind: n
	})).filter((e) => e.values.some((e) => e !== null));
}
function yt(e) {
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
function bt(e, t, n, r = 16, i = 150) {
	return r + (1 - (e - t) / (n - t)) * i;
}
function xt({ chart: e, series: t, onPoint: n, onLeave: r }) {
	let i = Array.isArray(e.years) ? e.years : [], { min: a, max: o } = yt(t.flatMap((e) => e.values)), s = 464 / Math.max(1, i.length), c = Math.max(5, Math.min(18, (s - 10) / Math.max(1, t.length))), l = bt(0, a, o, 18, 148);
	return /* @__PURE__ */ (0, x.jsxs)("svg", {
		className: "analysis-chart-svg",
		viewBox: "0 0 520 220",
		role: "img",
		"aria-label": e.title || "기업 분석 차트",
		children: [
			/* @__PURE__ */ (0, x.jsx)("line", {
				x1: 36,
				y1: l,
				x2: 508,
				y2: l,
				stroke: "#d8dee8",
				strokeWidth: "1"
			}),
			i.map((i, u) => /* @__PURE__ */ (0, x.jsxs)("g", { children: [t.map((t, d) => {
				let f = t.values[u];
				if (f === null) return null;
				let p = bt(f, a, o, 18, 148), m = Math.max(2, Math.abs(l - p)), h = 36 + u * s + 8 + d * c, g = {
					label: i,
					series: t.label,
					value: _t(f, t.kind, e.currency),
					x: h + c / 2,
					y: Math.min(p, l)
				};
				return /* @__PURE__ */ (0, x.jsx)("rect", {
					"aria-label": `${i} ${t.label} ${g.value}`,
					onBlur: r,
					onFocus: () => n(g),
					onMouseEnter: () => n(g),
					onMouseLeave: r,
					tabIndex: 0,
					x: h,
					y: Math.min(p, l),
					width: c - 2,
					height: m,
					rx: "2",
					fill: ft[d % ft.length]
				}, `${t.key}-${i}`);
			}), /* @__PURE__ */ (0, x.jsx)("text", {
				x: 36 + u * s + s / 2,
				y: 202,
				textAnchor: "middle",
				children: i
			})] }, i)),
			/* @__PURE__ */ (0, x.jsx)("text", {
				x: 36,
				y: 14,
				children: _t(o, t[0]?.kind, e.currency)
			}),
			/* @__PURE__ */ (0, x.jsx)("text", {
				x: 36,
				y: 180,
				children: _t(a, t[0]?.kind, e.currency)
			})
		]
	});
}
function St({ chart: e, series: t, onPoint: n, onLeave: r }) {
	let i = Array.isArray(e.years) ? e.years : [], { min: a, max: o } = yt(t.flatMap((e) => e.values)), s = 452 / Math.max(1, i.length - 1);
	return /* @__PURE__ */ (0, x.jsxs)("svg", {
		className: "analysis-chart-svg",
		viewBox: "0 0 520 220",
		role: "img",
		"aria-label": e.title || "기업 분석 차트",
		children: [
			[
				0,
				.5,
				1
			].map((e) => {
				let t = 18 + e * 148;
				return /* @__PURE__ */ (0, x.jsx)("line", {
					x1: 36,
					y1: t,
					x2: 508,
					y2: t,
					stroke: "#eef2f7",
					strokeWidth: "1"
				}, e);
			}),
			t.map((t, c) => /* @__PURE__ */ (0, x.jsxs)("g", { children: [/* @__PURE__ */ (0, x.jsx)("polyline", {
				points: t.values.map((e, t) => e === null ? null : `${36 + t * s},${bt(e, a, o, 18, 148)}`).filter(Boolean).join(" "),
				fill: "none",
				stroke: ft[c % ft.length],
				strokeWidth: "3",
				strokeLinejoin: "round",
				strokeLinecap: "round"
			}), t.values.map((l, u) => {
				if (l === null) return null;
				let d = 36 + u * s, f = bt(l, a, o, 18, 148), p = i[u] || `${u + 1}`, m = {
					label: p,
					series: t.label,
					value: _t(l, t.kind, e.currency),
					x: d,
					y: f
				};
				return /* @__PURE__ */ (0, x.jsx)("circle", {
					"aria-label": `${p} ${t.label} ${m.value}`,
					cx: d,
					cy: f,
					fill: ft[c % ft.length],
					onBlur: r,
					onFocus: () => n(m),
					onMouseEnter: () => n(m),
					onMouseLeave: r,
					r: "5",
					tabIndex: 0
				}, `${t.key}-${p}`);
			})] }, t.key)),
			i.map((e, t) => /* @__PURE__ */ (0, x.jsx)("text", {
				x: 36 + t * s,
				y: 202,
				textAnchor: "middle",
				children: e
			}, e)),
			/* @__PURE__ */ (0, x.jsx)("text", {
				x: 36,
				y: 14,
				children: _t(o, t[0]?.kind || "percent", e.currency)
			}),
			/* @__PURE__ */ (0, x.jsx)("text", {
				x: 36,
				y: 180,
				children: _t(a, t[0]?.kind || "percent", e.currency)
			})
		]
	});
}
function Ct({ chart: e, onPoint: t, onLeave: n }) {
	let r = Array.isArray(e.scenarios) ? e.scenarios : [], { max: i } = yt(r.map((e) => mt(e.perShare ?? e.price))), a = mt(e.currentPrice);
	return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "analysis-scenario-bars",
		children: [r.map((r, a) => {
			let o = mt(r.perShare ?? r.price), s = o === null || i <= 0 ? 0 : Math.max(4, Math.min(100, o / i * 100)), c = String(r.name || r.label || `Scenario ${a + 1}`), l = _t(o, "money", e.currency);
			return /* @__PURE__ */ (0, x.jsxs)("div", {
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
					/* @__PURE__ */ (0, x.jsx)("span", { children: c }),
					/* @__PURE__ */ (0, x.jsx)("div", { children: /* @__PURE__ */ (0, x.jsx)("i", { style: {
						width: `${s}%`,
						background: ft[a % ft.length]
					} }) }),
					/* @__PURE__ */ (0, x.jsx)("strong", { children: l })
				]
			}, c);
		}), a !== null && /* @__PURE__ */ (0, x.jsxs)("p", {
			className: "analysis-chart-note",
			children: ["현재가: ", _t(a, "money", e.currency)]
		})]
	});
}
function wt({ chart: e, onPoint: t, onLeave: n }) {
	let r = Array.isArray(e.labels) ? e.labels : [], i = Object.entries(e.series || {}).map(([e, t]) => ({
		key: e,
		label: e,
		values: Array.isArray(t) ? t.map((e) => typeof e == "number" ? e / 100 : null) : [],
		kind: "percent"
	}));
	return /* @__PURE__ */ (0, x.jsx)(St, {
		chart: {
			...e,
			years: r
		},
		series: i,
		onPoint: t,
		onLeave: n
	});
}
function Tt(e) {
	return /* @__PURE__ */ (0, x.jsx)("div", {
		className: "analysis-chart-legend",
		children: e.map((e, t) => /* @__PURE__ */ (0, x.jsxs)("span", { children: [/* @__PURE__ */ (0, x.jsx)("i", { style: { background: ft[t % ft.length] } }), e.label] }, e.key))
	});
}
function Et({ chart: e }) {
	let [t, n] = (0, c.useState)(null), r = vt(e), i = String(e.kind || e.id || ""), a = t?.x === void 0 ? void 0 : {
		left: `${Math.max(7, Math.min(93, t.x / 520 * 100))}%`,
		top: `${Math.max(10, t.y || 10)}px`
	};
	return /* @__PURE__ */ (0, x.jsxs)("article", {
		className: "analysis-chart-card",
		children: [
			/* @__PURE__ */ (0, x.jsxs)("div", {
				className: "analysis-chart-title",
				children: [/* @__PURE__ */ (0, x.jsx)("h4", { children: e.title || "Analysis Chart" }), e.subtitle && /* @__PURE__ */ (0, x.jsx)("p", { children: e.subtitle })]
			}),
			/* @__PURE__ */ (0, x.jsxs)("div", {
				className: "analysis-chart-plot",
				children: [
					i === "margins" && r.length ? /* @__PURE__ */ (0, x.jsx)(St, {
						chart: e,
						series: r,
						onPoint: n,
						onLeave: () => n(null)
					}) : null,
					(i === "performance" || i === "cashflow") && r.length ? /* @__PURE__ */ (0, x.jsx)(xt, {
						chart: e,
						series: r,
						onPoint: n,
						onLeave: () => n(null)
					}) : null,
					i === "dcf" || i === "scenario_price" ? /* @__PURE__ */ (0, x.jsx)(Ct, {
						chart: e,
						onPoint: n,
						onLeave: () => n(null)
					}) : null,
					i === "price_return" ? /* @__PURE__ */ (0, x.jsx)(wt, {
						chart: e,
						onPoint: n,
						onLeave: () => n(null)
					}) : null,
					!r.length && ![
						"dcf",
						"scenario_price",
						"price_return"
					].includes(i) && /* @__PURE__ */ (0, x.jsx)("p", {
						className: "analysis-chart-warning",
						children: "이 차트에 표시할 수치가 충분하지 않습니다."
					}),
					t && /* @__PURE__ */ (0, x.jsxs)("div", {
						className: "analysis-chart-tooltip",
						style: a,
						children: [
							t.series && /* @__PURE__ */ (0, x.jsx)("span", { children: t.series }),
							/* @__PURE__ */ (0, x.jsx)("strong", { children: t.value }),
							/* @__PURE__ */ (0, x.jsx)("em", { children: t.label })
						]
					})
				]
			}),
			r.length > 0 && Tt(r)
		]
	});
}
function Dt({ payload: e, chartIds: t, heading: n = "기업 분석 시각화", intro: r = "저장된 공식 재무 데이터와 시장 데이터를 기반으로 생성된 참고 차트입니다.", compact: i = !1 }) {
	let a = t ? new Set(t) : null, o = (Array.isArray(e?.charts) ? e.charts : []).filter((e) => !a || a.has(String(e.id || e.kind || "")));
	return !e?.available || !o.length ? null : /* @__PURE__ */ (0, x.jsxs)("section", {
		className: `analysis-charts-panel analysis-charts-inline${i ? " compact" : ""}`,
		"aria-label": n,
		children: [/* @__PURE__ */ (0, x.jsx)("div", {
			className: "analysis-chart-head",
			children: /* @__PURE__ */ (0, x.jsxs)("div", { children: [
				/* @__PURE__ */ (0, x.jsx)("p", {
					className: "section-kicker",
					children: "Company Visuals"
				}),
				/* @__PURE__ */ (0, x.jsx)("h3", { children: n }),
				/* @__PURE__ */ (0, x.jsx)("p", { children: r })
			] })
		}), /* @__PURE__ */ (0, x.jsx)("div", {
			className: "analysis-chart-grid",
			children: o.map((e, t) => /* @__PURE__ */ (0, x.jsx)(Et, { chart: e }, e.id || `${e.title || "chart"}-${t}`))
		})]
	});
}
//#endregion
//#region src/app/reportReader/CompanyAnalysisBody.tsx
var Ot = [
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
function kt(e = "") {
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
function At(e) {
	return new Set((Array.isArray(e?.charts) ? e.charts : []).map((e) => String(e?.id || e?.kind || "")).filter(Boolean));
}
function jt(e, t, n, r = /* @__PURE__ */ new Set()) {
	let i = At(n), a = e.title, o = [];
	for (let e of Ot) if (e.patterns.some((e) => e.test(a)) || e.fallbackIndex === t) for (let t of e.ids) i.has(t) && !r.has(t) && o.push(t);
	return o;
}
function Mt(e, t = /* @__PURE__ */ new Set()) {
	return Array.from(At(e)).filter((e) => !t.has(e));
}
function Nt({ markdown: e, charts: t }) {
	let n = kt(e), r = /* @__PURE__ */ new Set();
	return n.length ? /* @__PURE__ */ (0, x.jsxs)(x.Fragment, { children: [n.map((e, n) => {
		let i = jt(e, n, t, r);
		return i.forEach((e) => r.add(e)), /* @__PURE__ */ (0, x.jsxs)("div", {
			className: "company-analysis-section",
			children: [/* @__PURE__ */ (0, x.jsx)(_e, { markdown: e.markdown }), i.length > 0 && /* @__PURE__ */ (0, x.jsx)(Dt, {
				payload: t,
				chartIds: i,
				heading: "관련 시각화",
				intro: "이 섹션의 판단을 확인할 때 함께 볼 수 있는 수치입니다.",
				compact: !0
			})]
		}, e.key);
	}), Mt(t, r).length > 0 && /* @__PURE__ */ (0, x.jsx)(Dt, {
		payload: t,
		chartIds: Mt(t, r),
		heading: "추가 시각화",
		intro: "본문 섹션에 직접 매칭되지 않은 보조 차트입니다.",
		compact: !0
	})] }) : /* @__PURE__ */ (0, x.jsx)(Dt, { payload: t });
}
//#endregion
//#region src/app/CompanyAnalysisRoute.tsx
var Pt = [{
	value: "beginner",
	label: "기본",
	description: "쉽게 설명"
}, {
	value: "advanced",
	label: "심화",
	description: "정밀 분석"
}], Ft = 20;
function It(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function G(e) {
	let t = e;
	return !!(t?.id && f(t.status));
}
async function Lt(e) {
	let t = e;
	for (; f(t.status);) await It(1e3), t = await g(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "기업 분석 생성에 실패했습니다.");
	return t;
}
function Rt(e = "", t = "기업 분석") {
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
function zt(e) {
	return String(e.company?.ticker || e.query || e.company?.name || "").trim().toUpperCase();
}
function Bt(e) {
	return String(e.company?.name || e.query || zt(e) || "").trim();
}
function Vt(e) {
	let t = zt(e), n = Bt(e);
	return t && n && t !== n ? `${t} · ${n}` : n || t || "기업 분석";
}
function Ht(e) {
	return Rt(String(e.markdown || ""), "").title.trim() || String(e.headline || "").trim() || Vt(e);
}
function Ut(e) {
	if (!e) return "미상";
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? e : t.toLocaleDateString("ko-KR");
}
function Wt(e) {
	return Pt.find((t) => t.value === e)?.label || "";
}
function Gt(e) {
	return e === "high" ? "높음" : e === "medium" ? "중간" : e === "low" ? "낮음" : e || "확인 필요";
}
function Kt(e) {
	let t = e?.dataGaps;
	return t ? Array.isArray(t) ? t : Array.isArray(t.gaps) ? t.gaps : [] : [];
}
function qt(e) {
	let t = /* @__PURE__ */ new Set();
	return e.filter((e) => {
		let n = [
			Xt(e.field),
			Xt(e.label),
			Xt(e.category),
			Xt(e.message || e.suggestedAction)
		].join("|");
		return t.has(n) ? !1 : (t.add(n), !0);
	});
}
function Jt(e) {
	let t = {
		high: 0,
		medium: 1,
		low: 2
	};
	return qt(Kt(e).filter((e) => e.status !== "resolved").sort((e, n) => (t[e.severity || ""] ?? 9) - (t[n.severity || ""] ?? 9)));
}
function Yt(e) {
	if (!e) return "월 미상";
	let t = new Date(e);
	if (!Number.isNaN(t.getTime())) return `${t.getFullYear()}.${String(t.getMonth() + 1).padStart(2, "0")}`;
	let n = String(e).match(/^(\d{4})[-.](\d{1,2})/);
	return n ? `${n[1]}.${String(n[2]).padStart(2, "0")}` : "월 미상";
}
function Xt(e) {
	return String(e || "").trim().toLowerCase();
}
function Zt(e) {
	return [
		e.source,
		e.date,
		e.type
	].filter(Boolean).join(" · ");
}
function Qt(e) {
	return e.title || e.url || e.path || "자료";
}
function $t(e) {
	let t = String(e.markdown || "");
	return e.generation?.webSearch ? t.trim() : t.split(/\n(?=#{1,3}\s*(?:8\.\s*)?(?:Sources Used|사용 자료)\b)/i)[0].trim();
}
function en(e) {
	window.location.hash = e ? `#/analysis/${encodeURIComponent(e)}` : "#/analysis";
}
function tn() {
	let e = window.location.hash.match(/^#\/?analysis\/(.+)$/);
	return e ? decodeURIComponent(e[1]) : "";
}
function nn() {
	return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "analysis";
}
function rn() {
	let [e, t] = (0, c.useState)([]), [n, r] = (0, c.useState)(null), [i, a] = (0, c.useState)(() => tn()), [o, s] = (0, c.useState)(""), [l, u] = (0, c.useState)("beginner"), [d, f] = (0, c.useState)(""), [p, m] = (0, c.useState)("recent"), [h, b] = (0, c.useState)(!1), [S, C] = (0, c.useState)(!1), [w, T] = (0, c.useState)(""), [E, D] = (0, c.useState)(""), [O, k] = (0, c.useState)(""), A = (0, c.useCallback)(async () => {
		b(!0), D("");
		try {
			let e = await g("/api/analysis-reports");
			t(Array.isArray(e) ? e : []), v({
				surface: "analysis",
				viewId: "analysis",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			D(e instanceof Error ? e.message : "기업 분석 목록을 불러오지 못했습니다.");
		} finally {
			b(!1);
		}
	}, []);
	(0, c.useEffect)(() => {
		A();
	}, [A]), (0, c.useEffect)(() => {
		let e = () => {
			nn() && a(tn());
		};
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []), (0, c.useEffect)(() => {
		let e = !0;
		async function t(t) {
			b(!0), D("");
			try {
				let n = await g(`/api/analysis-reports/${encodeURIComponent(t)}?includePersonal=true`);
				if (!e) return;
				r(n), v({
					surface: "analysis_reader",
					viewId: "analysis",
					reportKind: "company_analysis",
					reportId: n.id || t,
					ticker: zt(n)
				});
			} catch (t) {
				if (!e) return;
				r(null), D(t instanceof Error ? t.message : "저장된 기업 분석 보고서를 열지 못했습니다.");
			} finally {
				e && b(!1);
			}
		}
		return i ? t(i) : (r(null), v({
			surface: "analysis",
			viewId: "analysis",
			reportKind: "",
			reportId: ""
		})), () => {
			e = !1;
		};
	}, [i]);
	async function j(e) {
		e.preventDefault();
		let t = o.trim();
		if (t) {
			C(!0), D(""), k("기업 자료를 읽고 분석 보고서를 생성하는 중입니다.");
			try {
				let e = await g(`/api/analyze?${new URLSearchParams({
					q: t,
					analysisStyle: l
				}).toString()}`), n;
				if (G(e)) {
					let t = await Lt(e), r = t.result?.reportId || t.result?.artifactId || "";
					if (!r) throw Error("생성된 보고서 ID를 확인하지 못했습니다.");
					n = await g(`/api/analysis-reports/${encodeURIComponent(r)}?includePersonal=true`);
				} else n = e;
				await A(), k("기업 분석 보고서를 생성하고 자동 저장했습니다."), r(n), n.id && en(n.id);
			} catch (e) {
				D(e instanceof Error ? e.message : "기업 분석 생성에 실패했습니다."), k("");
			} finally {
				C(!1);
			}
		}
	}
	async function M(e) {
		e && en(e);
	}
	async function N(e) {
		if (e.id && window.confirm(`${Vt(e)} 보고서를 삭제할까요?`)) {
			T(`delete-${e.id}`), D("");
			try {
				let t = await fetch(`/api/analysis-reports/${encodeURIComponent(e.id)}`, { method: "DELETE" });
				if (!t.ok) throw Error(`삭제 실패: ${t.status}`);
				n?.id === e.id && en(), await A(), k("저장된 기업 분석 보고서를 삭제했습니다.");
			} catch (e) {
				D(e instanceof Error ? e.message : "보고서 삭제에 실패했습니다.");
			} finally {
				T("");
			}
		}
	}
	async function P(e) {
		if (n) {
			T(e), k(e === "notion" ? "Notion으로 내보내는 중..." : "Obsidian으로 내보내는 중...");
			try {
				let t = e === "notion" ? await _("/api/export-notion/analysis", n) : await _("/api/export-obsidian/analysis", n);
				k(e === "notion" ? `Notion으로 내보냈습니다${t.title ? `: ${t.title}` : ""}` : `Obsidian으로 내보냈습니다${t.company || t.filename ? `: ${t.company || t.filename}` : ""}`);
			} catch (e) {
				k(e instanceof Error ? e.message : "내보내기에 실패했습니다.");
			} finally {
				T("");
			}
		}
	}
	async function F() {
		if (n?.id) {
			T("overlay"), k("내 노트와 연결하는 중...");
			try {
				let e = await _(`/api/analysis-reports/${encodeURIComponent(n.id)}/personal-overlay`, {});
				G(e) && await Lt(e);
				let t = await g(`/api/analysis-reports/${encodeURIComponent(n.id)}?includePersonal=true`);
				r(t), k("내 노트와 연결했습니다.");
			} catch (e) {
				k(e instanceof Error ? e.message : "내 노트 연결에 실패했습니다.");
			} finally {
				T("");
			}
		}
	}
	let I = (0, c.useMemo)(() => {
		let t = Xt(d);
		return t ? e.filter((e) => Xt([
			zt(e),
			Bt(e),
			Vt(e),
			e.headline,
			e.mode,
			e.generatedAt,
			Ut(e.generatedAt)
		].filter(Boolean).join(" ")).includes(t)) : e;
	}, [d, e]), L = (0, c.useMemo)(() => {
		let e = [...I].sort((e, t) => String(t.generatedAt || "").localeCompare(String(e.generatedAt || "")));
		if (p === "recent") return e.length ? [{
			key: "recent",
			label: `최근 보고서 ${Math.min(e.length, Ft)}건`,
			rows: e.slice(0, Ft)
		}] : [];
		if (p === "month") {
			let t = /* @__PURE__ */ new Map();
			for (let n of e) {
				let e = Yt(n.generatedAt);
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
			let e = zt(n) || Ht(n);
			t.has(e) || t.set(e, []), t.get(e)?.push(n);
		}
		return Array.from(t.entries()).map(([e, t]) => ({
			key: e,
			label: Ht(t[0] || {}),
			rows: t.sort((e, t) => String(t.generatedAt || "").localeCompare(String(e.generatedAt || "")))
		})).sort((e, t) => String(t.rows[0]?.generatedAt || "").localeCompare(String(e.rows[0]?.generatedAt || "")));
	}, [I, p]), R = $t(n || {}), z = Rt(R, n?.headline || Vt(n || {})), B = n?.sources || [], V = Jt(n);
	return n ? /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "react-company-analysis-route",
		"data-company-analysis-route": !0,
		children: [E && /* @__PURE__ */ (0, x.jsx)("p", {
			className: "react-dashboard-error",
			children: E
		}), /* @__PURE__ */ (0, x.jsxs)(Ae, {
			eyebrow: `COMPANY ANALYSIS${zt(n) ? ` · ${zt(n)}` : ""}`,
			title: z.title,
			meta: [n.generatedAt ? `생성일 ${Ut(n.generatedAt)}` : "", Wt(n.analysisStyle)].filter(Boolean).join(" · "),
			agentContext: {
				surface: "analysis_reader",
				viewId: "analysis",
				reportKind: "company_analysis",
				reportId: n.id || "",
				ticker: zt(n)
			},
			breadcrumb: /* @__PURE__ */ (0, x.jsxs)(x.Fragment, { children: [/* @__PURE__ */ (0, x.jsx)("button", {
				type: "button",
				onClick: () => en(),
				children: "기업 분석"
			}), /* @__PURE__ */ (0, x.jsx)("span", { children: z.title })] }),
			onClose: () => en(),
			actionSlot: /* @__PURE__ */ (0, x.jsxs)(x.Fragment, { children: [
				/* @__PURE__ */ (0, x.jsx)(le, {
					title: "AI",
					children: /* @__PURE__ */ (0, x.jsx)(ue, {
						icon: "agent",
						onClick: () => y({
							surface: "analysis_reader",
							reportKind: "company_analysis",
							reportId: n.id || "",
							ticker: zt(n),
							message: `${z.title}에서 투자 판단에 중요한 핵심, 리스크, 추가 확인 질문을 정리해줘.`,
							autoSubmit: !0
						}),
						children: "Agent에게 묻기"
					})
				}),
				/* @__PURE__ */ (0, x.jsx)(le, {
					title: "노트",
					children: /* @__PURE__ */ (0, x.jsx)(ue, {
						icon: "link",
						disabled: w === "overlay" || !n.id,
						onClick: F,
						children: w === "overlay" ? "연결 중" : "내 노트와 연결"
					})
				}),
				/* @__PURE__ */ (0, x.jsxs)(le, {
					title: "내보내기",
					children: [/* @__PURE__ */ (0, x.jsx)(ue, {
						icon: "notion",
						disabled: w === "notion",
						onClick: () => P("notion"),
						children: w === "notion" ? "내보내는 중" : "Notion으로 내보내기"
					}), /* @__PURE__ */ (0, x.jsx)(ue, {
						icon: "obsidian",
						disabled: w === "obsidian",
						onClick: () => P("obsidian"),
						children: w === "obsidian" ? "내보내는 중" : "Obsidian으로 내보내기"
					})]
				}),
				V.length > 0 && /* @__PURE__ */ (0, x.jsx)(le, {
					title: "자료 한계",
					children: /* @__PURE__ */ (0, x.jsx)("div", {
						className: "react-reader-gap-list",
						children: V.slice(0, 3).map((e, t) => /* @__PURE__ */ (0, x.jsxs)("div", {
							className: "react-reader-gap",
							children: [
								/* @__PURE__ */ (0, x.jsx)("span", { children: Gt(e.severity) }),
								/* @__PURE__ */ (0, x.jsx)("strong", { children: e.label || e.category || "추가 확인 필요" }),
								/* @__PURE__ */ (0, x.jsx)("p", { children: e.message || e.suggestedAction || "보고서 해석 시 확인이 필요한 자료 한계입니다." })
							]
						}, `${e.field || e.category || "gap"}-${t}`))
					})
				}),
				n.generation?.message && /* @__PURE__ */ (0, x.jsx)("p", {
					className: "react-reader-status",
					children: n.generation.message
				}),
				O && /* @__PURE__ */ (0, x.jsx)("p", {
					className: "react-reader-status",
					children: O
				})
			] }),
			noteIdentity: {
				id: Oe("company", zt(n) || n.headline || "company"),
				noteType: "company_thesis",
				title: zt(n) ? `${zt(n)} 투자 노트` : "기업 투자 노트",
				ticker: zt(n),
				company: n.company?.name || "",
				label: zt(n),
				reportKind: "company_analysis",
				reportId: zt(n),
				linkedReports: [z.title].filter(Boolean)
			},
			noteLinkedTitle: z.title,
			noteOverlayMarkdown: n.personalOverlay?.markdown || "",
			children: [/* @__PURE__ */ (0, x.jsx)(Nt, {
				markdown: z.body || R,
				charts: n.analysisCharts
			}), B.length > 0 && /* @__PURE__ */ (0, x.jsxs)("section", {
				className: "source-panel react-analysis-sources",
				children: [/* @__PURE__ */ (0, x.jsx)("h4", { children: "참고자료" }), /* @__PURE__ */ (0, x.jsx)("div", {
					className: "sources",
					children: B.map((e, t) => /* @__PURE__ */ (0, x.jsxs)("div", {
						className: "meta",
						children: [/* @__PURE__ */ (0, x.jsx)("span", { children: Zt(e) }), e.url ? /* @__PURE__ */ (0, x.jsx)("a", {
							href: e.url,
							target: "_blank",
							rel: "noopener noreferrer",
							children: Qt(e)
						}) : /* @__PURE__ */ (0, x.jsx)("span", { children: Qt(e) })]
					}, `${Qt(e)}-${t}`))
				})]
			})]
		})]
	}) : /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "react-company-analysis-route",
		"data-company-analysis-route": !0,
		children: [
			/* @__PURE__ */ (0, x.jsx)(je, {
				eyebrow: "Company Analysis",
				title: "기업 분석",
				description: "SEC, DART, 시장 데이터와 로컬 자료를 활용해 기업 분석 보고서를 생성합니다.",
				actions: /* @__PURE__ */ (0, x.jsx)("button", {
					type: "button",
					onClick: A,
					disabled: h,
					children: h ? "불러오는 중" : "새로고침"
				})
			}),
			/* @__PURE__ */ (0, x.jsxs)("form", {
				className: "react-analysis-form",
				onSubmit: j,
				children: [
					/* @__PURE__ */ (0, x.jsxs)("div", {
						className: "react-analysis-api-note",
						role: "note",
						children: [/* @__PURE__ */ (0, x.jsx)("strong", { children: "API 연동 안내" }), /* @__PURE__ */ (0, x.jsx)("span", { children: "미국 기업은 SEC 자료를 우선 사용하고, 한국 기업은 DART API Key를 설정하면 공시 확인 정확도가 높아집니다." })]
					}),
					/* @__PURE__ */ (0, x.jsx)("div", {
						className: "react-analysis-query",
						children: /* @__PURE__ */ (0, x.jsxs)("label", { children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "분석 대상" }), /* @__PURE__ */ (0, x.jsx)("input", {
							value: o,
							onChange: (e) => s(e.currentTarget.value),
							placeholder: "예: NVDA, 삼성전자, SK하이닉스"
						})] })
					}),
					/* @__PURE__ */ (0, x.jsxs)("fieldset", {
						className: "react-analysis-style",
						"aria-label": "보고서 모드",
						children: [/* @__PURE__ */ (0, x.jsx)("legend", { children: "보고서 모드" }), /* @__PURE__ */ (0, x.jsx)("div", {
							className: "react-analysis-style-toggle",
							"data-style": l,
							children: Pt.map((e) => /* @__PURE__ */ (0, x.jsx)("button", {
								type: "button",
								className: l === e.value ? "active" : "",
								"aria-pressed": l === e.value,
								onClick: () => u(e.value),
								"data-tooltip": e.description,
								children: e.label
							}, e.value))
						})]
					}),
					/* @__PURE__ */ (0, x.jsx)("button", {
						type: "submit",
						disabled: S || !o.trim(),
						children: S ? "분석 중" : "분석"
					})
				]
			}),
			E && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "react-dashboard-error",
				children: E
			}),
			O && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "react-dashboard-warning",
				children: O
			}),
			/* @__PURE__ */ (0, x.jsxs)("section", {
				className: "input-panel react-analysis-feed-controls report-feed-controls",
				"aria-label": "저장 기업 분석 검색",
				children: [/* @__PURE__ */ (0, x.jsxs)("div", {
					className: "briefing-archive-filters",
					children: [/* @__PURE__ */ (0, x.jsxs)("label", { children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "검색" }), /* @__PURE__ */ (0, x.jsx)("input", {
						type: "search",
						value: d,
						onChange: (e) => f(e.currentTarget.value),
						placeholder: "티커·회사명·보고서 검색"
					})] }), /* @__PURE__ */ (0, x.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						onClick: () => {
							f(""), m("recent");
						},
						children: "초기화"
					})]
				}), /* @__PURE__ */ (0, x.jsxs)("div", {
					className: "briefing-archive-summary",
					children: [/* @__PURE__ */ (0, x.jsxs)("span", { children: [I.length, "건"] }), /* @__PURE__ */ (0, x.jsx)("span", {
						"aria-live": "polite",
						children: h ? "불러오는 중..." : d ? "검색 결과" : ""
					})]
				})]
			}),
			/* @__PURE__ */ (0, x.jsx)("div", {
				className: "report-feed-outside-controls",
				"aria-label": "기업 분석 표시 옵션",
				children: /* @__PURE__ */ (0, x.jsxs)("div", {
					className: "report-feed-view-row",
					children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "보기" }), /* @__PURE__ */ (0, x.jsx)("label", {
						className: "report-feed-view-pill",
						children: /* @__PURE__ */ (0, x.jsxs)("select", {
							value: p,
							onChange: (e) => m(e.currentTarget.value),
							children: [
								/* @__PURE__ */ (0, x.jsx)("option", {
									value: "recent",
									children: "최근"
								}),
								/* @__PURE__ */ (0, x.jsx)("option", {
									value: "company",
									children: "기업별"
								}),
								/* @__PURE__ */ (0, x.jsx)("option", {
									value: "month",
									children: "월별"
								})
							]
						})
					})]
				})
			}),
			/* @__PURE__ */ (0, x.jsxs)("section", {
				className: "react-analysis-feed",
				"aria-label": "저장된 기업 분석",
				children: [/* @__PURE__ */ (0, x.jsxs)("div", {
					className: "react-section-heading",
					children: [/* @__PURE__ */ (0, x.jsxs)("div", { children: [/* @__PURE__ */ (0, x.jsx)("p", {
						className: "section-kicker",
						children: "Saved Reports"
					}), /* @__PURE__ */ (0, x.jsx)("h2", { children: "저장된 기업 분석" })] }), /* @__PURE__ */ (0, x.jsxs)("span", { children: [e.length, " reports"] })]
				}), L.length ? L.map((e) => /* @__PURE__ */ (0, x.jsxs)("section", {
					className: "report-feed-group",
					children: [/* @__PURE__ */ (0, x.jsxs)("div", {
						className: "report-feed-group-head",
						children: [/* @__PURE__ */ (0, x.jsx)("span", {
							className: "report-feed-group-name",
							children: e.label
						}), /* @__PURE__ */ (0, x.jsxs)("span", {
							className: "report-feed-group-meta",
							children: [
								e.rows.length,
								"건 · 최근 ",
								Ut(e.rows[0]?.generatedAt)
							]
						})]
					}), /* @__PURE__ */ (0, x.jsx)("div", {
						className: "report-feed-group-cards",
						children: e.rows.map((e) => {
							let t = w === `delete-${e.id}`;
							return /* @__PURE__ */ (0, x.jsxs)("div", {
								className: "report-feed-card-wrap",
								children: [/* @__PURE__ */ (0, x.jsxs)("button", {
									className: "report-feed-card is-analysis",
									type: "button",
									onClick: () => M(e.id),
									children: [
										/* @__PURE__ */ (0, x.jsxs)("span", {
											className: "report-feed-card-meta",
											children: [e.mode && /* @__PURE__ */ (0, x.jsx)("span", {
												className: "report-feed-badge",
												children: String(e.mode).toUpperCase()
											}), e.analysisStyle && /* @__PURE__ */ (0, x.jsx)("span", {
												className: "report-feed-badge",
												children: Wt(e.analysisStyle) || String(e.analysisStyle).toUpperCase()
											})]
										}),
										/* @__PURE__ */ (0, x.jsx)("strong", { children: Ht(e) }),
										/* @__PURE__ */ (0, x.jsxs)("span", {
											className: "report-feed-card-foot",
											children: ["생성일 ", Ut(e.generatedAt)]
										})
									]
								}), /* @__PURE__ */ (0, x.jsx)("button", {
									type: "button",
									className: "report-feed-card-delete",
									disabled: t,
									onClick: () => N(e),
									"aria-label": `${Vt(e)} 삭제`,
									"data-tooltip": "삭제",
									children: /* @__PURE__ */ (0, x.jsx)("svg", {
										width: "13",
										height: "13",
										viewBox: "0 0 16 16",
										fill: "none",
										stroke: "currentColor",
										strokeWidth: "1.4",
										strokeLinecap: "round",
										strokeLinejoin: "round",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, x.jsx)("path", { d: "M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" })
									})
								})]
							}, e.id || `${Ht(e)}-${e.generatedAt}`);
						})
					})]
				}, e.key)) : /* @__PURE__ */ (0, x.jsxs)("article", {
					className: "react-dashboard-panel",
					children: [/* @__PURE__ */ (0, x.jsx)("h2", { children: "저장된 기업 분석 보고서가 없습니다." }), /* @__PURE__ */ (0, x.jsx)("p", { children: "분석 대상을 입력해 첫 보고서를 생성하세요." })]
				})]
			})
		]
	});
}
//#endregion
//#region src/islands/MarketStateDashboard.tsx
var an = {
	high: "높음",
	medium: "보통",
	low: "낮음"
}, on = {
	overall: "종합",
	us: "미국장",
	kr: "한국장"
};
function sn(e) {
	let t = String(e || "").replace(/\s+/g, " ").trim(), n = t.match(/[^.!?。]+[.!?。]?/g)?.map((e) => e.trim()).filter(Boolean) || [];
	return {
		lead: n[0] || t,
		support: n.slice(1, 3).join(" ")
	};
}
function cn(e) {
	if (!e) return "";
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? e : t.toLocaleString("ko-KR", {
		dateStyle: "medium",
		timeStyle: "short"
	});
}
function ln(e) {
	let t = String(e.directionLabel || "").trim();
	if (t === "중립") return "neutral";
	if (t === "혼재" || t === "변동성") return "warning";
	if (t === "도움" || t === "부담 완화") return "positive";
	if (t === "부담") return "negative";
	let n = `${e.directionLabel || ""} ${e.directionTone || ""}`.toLowerCase();
	return /neutral|중립/.test(n) ? "neutral" : /mixed|conflicted|혼재|변동성/.test(n) ? "warning" : /support|positive|완화|호재|긍정|지지|강화|도움/.test(n) ? "positive" : /risk|negative|부담|악화|위험|하방/.test(n) ? "negative" : "neutral";
}
function un(e) {
	let t = String(e.directionLabel || "").trim();
	return !t || t === "도움" ? "긍정 요인" : t === "부담" ? "부담 가중" : t === "변동성" ? "변동성 증가" : t;
}
function dn(e) {
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
function fn({ items: e }) {
	return /* @__PURE__ */ (0, x.jsx)("ul", {
		className: "market-state-check-list",
		children: e.slice(0, 5).map((e, t) => {
			let n = dn(e);
			return /* @__PURE__ */ (0, x.jsxs)("li", {
				className: "market-state-check-item",
				children: [
					n.title && /* @__PURE__ */ (0, x.jsx)("strong", { children: n.title }),
					n.summary && /* @__PURE__ */ (0, x.jsx)("span", { children: n.summary }),
					n.sourceRefs.length ? /* @__PURE__ */ (0, x.jsx)("small", { children: n.sourceRefs.join(" · ") }) : null
				]
			}, `${n.title || n.summary}-${t}`);
		})
	});
}
function pn({ driver: e }) {
	let t = an[e.confidence] || e.confidence || "보통", n = e.interpretation, r = e.marketImpact || e.interpretation, i = e.evidenceSummary || e.whyItMatters || e.rationale, a = e.nextMemoryCheck || e.whatToWatch || e.nextCheckpoint, o = [
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
	return /* @__PURE__ */ (0, x.jsxs)("article", {
		className: `market-driver-card momentum-${e.momentum || "stable"}`,
		children: [
			/* @__PURE__ */ (0, x.jsxs)("div", {
				className: "market-driver-top",
				children: [/* @__PURE__ */ (0, x.jsx)("h3", { children: e.title }), /* @__PURE__ */ (0, x.jsx)("div", {
					className: "market-driver-chip-row",
					children: e.directionLabel && /* @__PURE__ */ (0, x.jsx)("span", {
						className: `market-direction-chip direction-${ln(e)}`,
						children: un(e)
					})
				})]
			}),
			n && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "market-driver-summary",
				children: n
			}),
			o.length ? /* @__PURE__ */ (0, x.jsxs)("details", {
				className: "market-driver-details",
				children: [/* @__PURE__ */ (0, x.jsx)("summary", { children: "근거 보기" }), /* @__PURE__ */ (0, x.jsx)("dl", {
					className: "market-driver-detail-list",
					children: o.map((e) => /* @__PURE__ */ (0, x.jsxs)("div", { children: [/* @__PURE__ */ (0, x.jsx)("dt", { children: e.label }), /* @__PURE__ */ (0, x.jsx)("dd", { children: e.value })] }, e.label))
				})]
			}) : null,
			/* @__PURE__ */ (0, x.jsxs)("footer", { children: [/* @__PURE__ */ (0, x.jsxs)("small", { children: [
				"확신도 ",
				t,
				e.confidencePct ? ` · ${e.confidencePct}%` : ""
			] }), /* @__PURE__ */ (0, x.jsx)("button", {
				type: "button",
				className: "agent-action agent-ask-btn",
				"data-agent-prompt": e.askAgentPrompt,
				"data-tooltip": "Agent에게 묻기",
				"aria-label": "Agent에게 묻기",
				children: /* @__PURE__ */ (0, x.jsx)("span", {
					className: "agent-logo-slot",
					"aria-hidden": "true"
				})
			})] })
		]
	});
}
function mn({ onUpdate: e, updating: t = !1 } = {}) {
	let [n, r] = (0, c.useState)(null), [i, a] = (0, c.useState)("overall"), [o, s] = (0, c.useState)(""), [l, u] = (0, c.useState)(!1), d = (0, c.useCallback)(async () => {
		u(!0), s("");
		try {
			let e = await g("/api/memory/state-dashboard?limit=5");
			r(e), ce().updateAgentContext?.({
				surface: "market_state",
				viewId: "memory",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			s(e instanceof Error ? e.message : String(e));
		} finally {
			u(!1);
		}
	}, []);
	(0, c.useEffect)(() => {
		d();
	}, [d]), (0, c.useEffect)(() => {
		ce().applyAgentBranding?.();
	}, [n]);
	let f = n?.marketViews || {}, p = [
		"overall",
		"us",
		"kr"
	], m = p.includes(i) ? i : "overall", h = m === "overall" ? f.overall || n : f[m] || n, _ = h?.drivers ?? [], v = h?.plainConclusion || h?.summary || "", y = h?.reasonSummary || h?.sourceSummary || h?.stance || "", b = sn(y), S = cn(h?.snapshot?.asOf), C = cn(n?.freshness?.latestMemoryAt), w = !!n?.freshness?.stale, T = h?.briefs?.length ? h.briefs : [
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
			value: h?.actionGuide?.action || h?.stance || ""
		},
		{
			label: "다음 확인",
			value: h?.actionGuide?.timing || (h?.watchItems || []).slice(0, 3).join("; ")
		}
	].filter((e) => e.value);
	return /* @__PURE__ */ (0, x.jsxs)(x.Fragment, { children: [
		/* @__PURE__ */ (0, x.jsxs)("div", {
			className: "market-state-head",
			children: [/* @__PURE__ */ (0, x.jsxs)("div", { children: [/* @__PURE__ */ (0, x.jsx)("p", {
				className: "section-kicker",
				children: "Market State"
			}), /* @__PURE__ */ (0, x.jsx)("h2", { children: h?.title || n?.title || "현재 중기 시장 상황" })] }), /* @__PURE__ */ (0, x.jsxs)("div", {
				className: "market-state-head-actions",
				children: [
					S ? /* @__PURE__ */ (0, x.jsxs)("span", {
						className: `market-state-asof${w ? " stale" : ""}`,
						children: [
							"생성 ",
							S,
							w ? " · 최신 메모리 반영 전" : ""
						]
					}) : null,
					e ? /* @__PURE__ */ (0, x.jsx)("button", {
						className: "filter-btn apply",
						type: "button",
						onClick: e,
						disabled: t || l,
						children: t ? "업데이트 중" : "시장 메모리 업데이트"
					}) : null,
					/* @__PURE__ */ (0, x.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						onClick: d,
						disabled: l || t,
						children: l ? "불러오는 중…" : "새로고침"
					})
				]
			})]
		}),
		p.length > 1 ? /* @__PURE__ */ (0, x.jsx)("div", {
			className: "market-scope-tabs",
			role: "tablist",
			"aria-label": "시장 범위 선택",
			"data-scope": m,
			"data-count": p.length,
			children: p.map((e) => /* @__PURE__ */ (0, x.jsx)("button", {
				type: "button",
				role: "tab",
				"aria-selected": m === e,
				className: m === e ? "active" : "",
				onClick: () => a(e),
				children: on[e]
			}, e))
		}) : null,
		w ? /* @__PURE__ */ (0, x.jsxs)("p", {
			className: "market-state-stale-note",
			children: [
				"최신 시장 메모리",
				C ? `(${C})` : "",
				"가 저장됐지만, 화면용 시장 상태 스냅샷은 아직 다시 생성되지 않았습니다. 시장 메모리 업데이트를 다시 실행하면 화면 판단을 갱신합니다."
			]
		}) : null,
		o ? /* @__PURE__ */ (0, x.jsxs)("p", {
			className: "market-state-summary",
			children: ["시장 상황을 불러오지 못했습니다: ", o]
		}) : /* @__PURE__ */ (0, x.jsxs)("div", {
			className: "market-state-overview",
			children: [y ? /* @__PURE__ */ (0, x.jsxs)("section", {
				className: "market-state-interpretation",
				children: [
					/* @__PURE__ */ (0, x.jsx)("span", { children: "시장 해석" }),
					/* @__PURE__ */ (0, x.jsx)("strong", { children: b.lead }),
					b.support ? /* @__PURE__ */ (0, x.jsx)("p", { children: b.support }) : null
				]
			}) : null, h?.actionGuide || h?.posture || v ? /* @__PURE__ */ (0, x.jsxs)("section", {
				className: `market-state-posture posture-${h?.posture?.tone || "watch"}`,
				children: [
					/* @__PURE__ */ (0, x.jsx)("span", { children: "판단 및 투자 행동" }),
					v && /* @__PURE__ */ (0, x.jsx)("p", {
						className: "market-state-summary",
						children: v
					}),
					h?.actionGuide ? /* @__PURE__ */ (0, x.jsxs)("div", {
						className: "market-state-action-body",
						children: [
							/* @__PURE__ */ (0, x.jsx)("strong", { children: h.actionGuide.headline }),
							/* @__PURE__ */ (0, x.jsx)("p", { children: h.actionGuide.action }),
							h.actionGuide.timing && /* @__PURE__ */ (0, x.jsx)("small", { children: h.actionGuide.timing })
						]
					}) : h?.posture ? /* @__PURE__ */ (0, x.jsxs)("div", {
						className: "market-state-action-body",
						children: [/* @__PURE__ */ (0, x.jsx)("strong", { children: h.posture.label }), /* @__PURE__ */ (0, x.jsx)("p", { children: h.posture.summary })]
					}) : null,
					h?.watchItems?.length || T[3]?.value ? /* @__PURE__ */ (0, x.jsxs)("div", {
						className: "market-state-action-list",
						children: [/* @__PURE__ */ (0, x.jsx)("b", { children: "다음 확인" }), h?.watchItems?.length ? /* @__PURE__ */ (0, x.jsx)("ul", { children: h.watchItems.slice(0, 3).map((e) => /* @__PURE__ */ (0, x.jsx)("li", { children: e }, e)) }) : /* @__PURE__ */ (0, x.jsx)("p", { children: T[3]?.value })]
					}) : null
				]
			}) : null]
		}),
		/* @__PURE__ */ (0, x.jsx)("div", {
			className: "market-state-drivers",
			children: _.map((e, t) => /* @__PURE__ */ (0, x.jsx)(pn, { driver: e }, e.id || t))
		}),
		h && ((h.counterEvidence?.length || 0) > 0 || (h.uncertainties?.length || 0) > 0) ? /* @__PURE__ */ (0, x.jsxs)("div", {
			className: "market-state-checks",
			"aria-label": "반대 근거와 불확실성",
			children: [h.counterEvidence?.length ? /* @__PURE__ */ (0, x.jsxs)("section", { children: [/* @__PURE__ */ (0, x.jsx)("h3", { children: "반대 근거" }), /* @__PURE__ */ (0, x.jsx)(fn, { items: h.counterEvidence })] }) : null, h.uncertainties?.length ? /* @__PURE__ */ (0, x.jsxs)("section", { children: [/* @__PURE__ */ (0, x.jsx)("h3", { children: "불확실성" }), /* @__PURE__ */ (0, x.jsx)(fn, { items: h.uncertainties })] }) : null]
		}) : null,
		n?.sourceRefs?.length ? /* @__PURE__ */ (0, x.jsxs)("details", {
			className: "market-state-sources",
			children: [/* @__PURE__ */ (0, x.jsxs)("summary", { children: [
				"사용한 출처 ",
				n.sourceRefs.length,
				"개"
			] }), /* @__PURE__ */ (0, x.jsx)("ul", { children: n.sourceRefs.slice(0, 8).map((e, t) => /* @__PURE__ */ (0, x.jsxs)("li", { children: [e.url ? /* @__PURE__ */ (0, x.jsx)("a", {
				href: e.url,
				target: "_blank",
				rel: "noreferrer",
				children: e.title || e.source || e.url
			}) : /* @__PURE__ */ (0, x.jsx)("span", { children: e.title || e.source || e.id }), e.source && /* @__PURE__ */ (0, x.jsx)("small", { children: e.source })] }, e.id || t)) })]
		}) : null
	] });
}
//#endregion
//#region src/app/Dashboard.tsx
var hn = {
	positive: "긍정",
	watch: "주의",
	negative: "부정",
	neutral: "중립"
};
function gn(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function _n(e) {
	let t = e;
	return !!(t?.id && t?.kind === "agent_bridge" && f(t.status));
}
async function vn(e) {
	let t = e;
	for (; f(t.status);) await gn(1e3), t = await g(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "투자 리뷰 생성에 실패했습니다.");
	return t;
}
function yn(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : 0;
}
function bn(e, t) {
	for (let n of t) {
		let t = yn(e?.[n]);
		if (t) return t;
	}
	return 0;
}
function xn(e) {
	return e.name || e.ticker || "포지션";
}
function Sn() {
	let e = (0, c.useRef)(null), [t, n] = (0, c.useState)(null), [r, i] = (0, c.useState)(""), [a, o] = (0, c.useState)(""), [s, l] = (0, c.useState)(null), u = (0, c.useCallback)(async () => {
		try {
			let e = await g("/api/market-widgets/settings");
			n(e), i("");
		} catch (e) {
			i(e instanceof Error ? e.message : "시장 위젯 설정을 불러오지 못했습니다.");
		}
	}, []);
	(0, c.useEffect)(() => {
		let e = !0;
		return g("/api/market-widgets/settings").then((t) => {
			e && (n(t), i(""));
		}).catch((t) => {
			e && i(t instanceof Error ? t.message : "시장 위젯 설정을 불러오지 못했습니다.");
		}), () => {
			e = !1;
		};
	}, []), (0, c.useEffect)(() => {
		let e = (e) => {
			let t = e.detail;
			t ? (n(t), i("")) : u();
		};
		return document.addEventListener("folio:market-widgets-updated", e), () => document.removeEventListener("folio:market-widgets-updated", e);
	}, [u]), (0, c.useEffect)(() => {
		let n = e.current;
		if (n) {
			if (window.FolioTradingViewWidgets?.cleanup?.(n), !t) {
				n.innerHTML = "<div class=\"tradingview-widget-unavailable\">시장 위젯 설정을 불러오는 중입니다.</div>";
				return;
			}
			return window.FolioTradingViewWidgets?.renderDashboardBoard ? window.FolioTradingViewWidgets.renderDashboardBoard(n, t, { fallbackHtml: "<div class=\"tradingview-widget-unavailable\">시장 위젯을 표시할 수 없습니다.</div>" }) : n.innerHTML = "<div class=\"tradingview-widget-unavailable\">시장 위젯 렌더러를 찾을 수 없습니다.</div>", () => {
				window.FolioTradingViewWidgets?.cleanup?.(n);
			};
		}
	}, [t]);
	async function d(e) {
		let t = await _("/api/market-widgets/settings", e);
		return n(t), document.dispatchEvent(new CustomEvent("folio:market-widgets-updated", { detail: t })), t;
	}
	function f() {
		return t?.dashboard?.widgets ? [...t.dashboard.widgets] : [];
	}
	function p(e) {
		return {
			...t,
			dashboard: {
				...t?.dashboard || {},
				widgets: e
			},
			presetOverrides: t?.presetOverrides || {}
		};
	}
	async function m(e, t) {
		let n = f(), r = n.findIndex((t) => t.id === e);
		if (r < 0) return;
		let a = Math.max(0, Math.min(n.length - 1, t));
		if (r === a) return;
		let [o] = n.splice(r, 1);
		n.splice(a, 0, o);
		try {
			await d(p(n)), i("");
		} catch (e) {
			i(e instanceof Error ? e.message : "시장 위젯 위치 저장에 실패했습니다.");
		}
	}
	async function h(e, t, n) {
		let r = f(), a = r.findIndex((t) => t.id === e);
		if (a < 0) return;
		let o = Math.max(240, Math.min(1100, Math.round(t))), s = Math.max(3, Math.min(12, Math.round(n))), c = Math.round(Number(r[a].height || 0)), l = Math.round(Number(r[a].columns || 0));
		if (!(c === o && l === s)) {
			r[a] = {
				...r[a],
				height: o,
				columns: s
			};
			try {
				await d(p(r)), i("");
			} catch (e) {
				i(e instanceof Error ? e.message : "시장 위젯 크기 저장에 실패했습니다.");
			}
		}
	}
	async function v(e) {
		o(e);
		try {
			let t = f(), n = `${e}-${Date.now().toString(36)}`, r = e === "overview" ? {
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
			await d(p([...t, r])), i("");
		} catch (e) {
			i(e instanceof Error ? e.message : "시장 위젯 추가에 실패했습니다.");
		} finally {
			o("");
		}
	}
	async function y() {
		o("reset");
		try {
			await d({ dashboard: { widgets: [] } }), i("");
		} catch (e) {
			i(e instanceof Error ? e.message : "시장 위젯 기본값 복원에 실패했습니다.");
		} finally {
			o("");
		}
	}
	async function b(e) {
		l(null);
		let t = f(), n = t.findIndex((t) => t.id === e);
		if (n < 0) return;
		let r = t[n], a = window.prompt("위젯 제목", r.title || "");
		if (a === null) return;
		let s = r.symbol || "";
		if ([
			"advanced_chart",
			"symbol_overview",
			"ticker_tag",
			"single_ticker",
			"stock_heatmap"
		].includes(String(r.type || ""))) {
			let e = window.prompt("TradingView 심볼", s || "FOREXCOM:SPXUSD");
			if (e === null) return;
			s = e.trim().toUpperCase();
		}
		t[n] = {
			...r,
			title: String(a || r.title || "").trim(),
			symbol: s
		}, o("editor");
		try {
			await d(p(t)), i("");
		} catch (e) {
			i(e instanceof Error ? e.message : "시장 위젯 수정에 실패했습니다.");
		} finally {
			o("");
		}
	}
	async function S(e) {
		l(null);
		let t = f(), n = t.find((t) => t.id === e);
		if (!n) return;
		let r = n.title || n.symbol || n.type || "위젯";
		if (window.confirm(`${r} 위젯을 삭제할까요?`)) {
			o("delete");
			try {
				await d(p(t.filter((t) => t.id !== e))), i("");
			} catch (e) {
				i(e instanceof Error ? e.message : "시장 위젯 삭제에 실패했습니다.");
			} finally {
				o("");
			}
		}
	}
	return (0, c.useEffect)(() => {
		let t = e.current;
		if (!t) return;
		let n = (e) => {
			let t = e.target?.closest("[data-tv-widget-menu]");
			if (!t) return;
			e.preventDefault(), e.stopPropagation();
			let n = t.closest(".tv-widget-card")?.dataset.widgetId || "";
			if (!n) return;
			let r = t.getBoundingClientRect();
			l({
				widgetId: n,
				x: r.right,
				y: r.bottom + 6
			});
		};
		return t.addEventListener("click", n), () => t.removeEventListener("click", n);
	}, [t]), (0, c.useEffect)(() => {
		let n = e.current;
		if (!n || !t) return;
		let r = null, i = null, a = () => Array.from(n.querySelectorAll(".tv-widget-card[data-widget-id]")), o = (e) => {
			let t = n.getBoundingClientRect(), r = window.getComputedStyle(n), i = Number.parseFloat(r.columnGap || r.gap || "0") || 0, a = (t.width - i * 11) / 12;
			return !Number.isFinite(a) || a <= 0 ? 12 : Math.max(3, Math.min(12, Math.round((e + i) / (a + i))));
		}, s = (e, t) => {
			let n = a().map((e, t) => ({
				index: t,
				rect: e.getBoundingClientRect()
			})).filter(({ rect: e }) => e.width > 0 && e.height > 0).sort((e, t) => e.rect.top - t.rect.top || e.rect.left - t.rect.left);
			if (!n.length) return 0;
			let r = n[0], i = Infinity;
			for (let a of n) {
				let n = a.rect.left + a.rect.width / 2, o = a.rect.top + a.rect.height / 2, s = Math.hypot(e - n, t - o);
				s < i && (r = a, i = s);
			}
			return t < r.rect.top + r.rect.height / 2 || t <= r.rect.bottom && e < r.rect.left + r.rect.width / 2 ? r.index : Math.min(r.index + 1, n.length - 1);
		}, c = (e) => {
			let t = e.target, n = t?.closest("[data-tv-widget-resize]"), a = t?.closest("[data-tv-widget-drag-handle]"), s = t?.closest(".tv-widget-card[data-widget-id]"), c = s?.dataset.widgetId || "";
			if (!(!s || !c)) {
				if (n) {
					e.preventDefault();
					let t = s.getBoundingClientRect();
					r = {
						widgetId: c,
						startX: e.clientX,
						startY: e.clientY,
						startWidth: t.width,
						startHeight: t.height,
						startColumns: Math.max(3, Math.min(12, Number(s.dataset.widgetColumns || o(t.width)) || 6)),
						card: s
					}, s.classList.add("tv-widget-resizing");
					return;
				}
				a && !t?.closest("[data-tv-widget-menu]") && (e.preventDefault(), i = {
					widgetId: c,
					card: s
				}, s.classList.add("tv-widget-dragging"));
			}
		}, l = (e) => {
			if (!r) return;
			let t = Math.max(240, Math.min(1100, r.startHeight + e.clientY - r.startY)), n = o(r.startWidth + e.clientX - r.startX);
			r.card.style.height = `${t}px`, r.card.style.minHeight = `${t}px`, r.card.style.gridColumn = `span ${n}`, r.card.dataset.widgetColumns = String(n);
		}, u = (e) => {
			if (r) {
				let { widgetId: e, card: t, startColumns: n } = r;
				t.classList.remove("tv-widget-resizing");
				let i = t.getBoundingClientRect().height, a = Number(t.dataset.widgetColumns || n) || n;
				r = null, h(e, i, a);
			}
			if (i) {
				let { widgetId: t, card: n } = i;
				n.classList.remove("tv-widget-dragging"), i = null, m(t, s(e.clientX, e.clientY));
			}
		};
		return n.addEventListener("pointerdown", c), window.addEventListener("pointermove", l), window.addEventListener("pointerup", u), () => {
			n.removeEventListener("pointerdown", c), window.removeEventListener("pointermove", l), window.removeEventListener("pointerup", u);
		};
	}, [t]), /* @__PURE__ */ (0, x.jsxs)("article", {
		className: "market-widget-panel react-dashboard-market-widget",
		"data-current-market": !0,
		children: [
			/* @__PURE__ */ (0, x.jsxs)("div", {
				className: "market-widget-head",
				children: [/* @__PURE__ */ (0, x.jsxs)("div", { children: [/* @__PURE__ */ (0, x.jsx)("p", {
					className: "section-kicker",
					children: "Current Market"
				}), /* @__PURE__ */ (0, x.jsx)("h2", {
					id: "marketWidgetTitle",
					children: "Current Market"
				})] }), /* @__PURE__ */ (0, x.jsxs)("div", {
					className: "market-widget-actions",
					children: [
						/* @__PURE__ */ (0, x.jsx)("button", {
							id: "editGlobalMarketsBtn",
							className: "filter-btn",
							type: "button",
							disabled: a === "overview",
							onClick: (e) => {
								e.stopPropagation(), v("overview");
							},
							children: a === "overview" ? "추가 중" : "위젯 추가"
						}),
						/* @__PURE__ */ (0, x.jsx)("button", {
							id: "addMarketChartBtn",
							className: "filter-btn",
							type: "button",
							disabled: a === "chart",
							onClick: (e) => {
								e.stopPropagation(), v("chart");
							},
							children: a === "chart" ? "추가 중" : "빠른 차트 추가"
						}),
						/* @__PURE__ */ (0, x.jsx)("button", {
							id: "resetMarketWidgetsBtn",
							className: "filter-btn clear",
							type: "button",
							disabled: a === "reset",
							onClick: (e) => {
								e.stopPropagation(), y();
							},
							children: a === "reset" ? "복원 중" : "기본값"
						})
					]
				})]
			}),
			r && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "react-dashboard-error",
				children: r
			}),
			s && /* @__PURE__ */ (0, x.jsxs)("div", {
				className: "market-widget-context-menu is-open",
				style: {
					left: s.x,
					top: s.y
				},
				role: "menu",
				children: [/* @__PURE__ */ (0, x.jsx)("button", {
					type: "button",
					role: "menuitem",
					onClick: () => void b(s.widgetId),
					children: "수정"
				}), /* @__PURE__ */ (0, x.jsx)("button", {
					type: "button",
					role: "menuitem",
					"data-market-widget-action": "delete",
					onClick: () => void S(s.widgetId),
					children: "삭제"
				})]
			}),
			/* @__PURE__ */ (0, x.jsx)("div", {
				id: "marketWidgetBoard",
				ref: e,
				className: "market-widget-board",
				"data-fallback": "<div class=\"tradingview-widget-unavailable\">시장 위젯을 표시할 수 없습니다.</div>"
			})
		]
	});
}
function Cn() {
	let [e, t] = (0, c.useState)({
		dashboard: null,
		review: null
	}), [n, r] = (0, c.useState)(!1), [i, a] = (0, c.useState)(!1), [o, s] = (0, c.useState)(""), l = (0, c.useCallback)(async () => {
		r(!0), s("");
		try {
			let [e, n] = await Promise.all([g("/api/dashboard"), g("/api/investment-review")]);
			t({
				dashboard: e,
				review: n
			}), v({
				surface: "dashboard",
				viewId: "dashboard",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			s(e instanceof Error ? e.message : "대시보드를 불러오지 못했습니다.");
		} finally {
			r(!1);
		}
	}, []);
	(0, c.useEffect)(() => {
		l();
	}, [l]);
	async function u() {
		a(!0), s("");
		try {
			let e = await _("/api/investment-review/generate", { forceRefresh: !0 }), n;
			if (_n(e)) {
				let t = await vn(e), r = t.result?.date || t.result?.artifactId || "";
				n = r ? await g(`/api/investment-review/${encodeURIComponent(r)}`) : await g("/api/investment-review");
			} else n = e;
			let r = await g("/api/dashboard");
			t({
				dashboard: r,
				review: n
			}), v({
				surface: "dashboard",
				viewId: "dashboard",
				reportKind: "investment_review",
				reportId: n.date || ""
			});
		} catch (e) {
			s(e instanceof Error ? e.message : "투자 리뷰를 갱신하지 못했습니다.");
		} finally {
			a(!1);
		}
	}
	let d = e.review?.stats || {}, f = (0, c.useMemo)(() => [
		{
			label: "Indexed",
			value: e.dashboard?.index?.count ?? 0,
			detail: `${e.dashboard?.index?.newsCount ?? 0} news`
		},
		{
			label: "브리핑",
			value: e.dashboard?.briefings?.length ?? 0,
			detail: "최근 저장본"
		},
		{
			label: "체크포인트",
			value: e.review?.keyCheckpoints?.length ?? 0,
			detail: e.review?.date || ""
		},
		{
			label: "포지션 영향",
			value: e.review?.portfolioImpacts?.length ?? 0,
			detail: `${bn(d, ["positive", "positiveImpacts"])} positive`
		}
	], [
		e.dashboard?.briefings?.length,
		e.dashboard?.index?.count,
		e.dashboard?.index?.newsCount,
		e.review?.date,
		e.review?.keyCheckpoints?.length,
		e.review?.portfolioImpacts?.length,
		d
	]), p = (e.review?.keyCheckpoints || []).slice(0, 5), m = (e.review?.portfolioImpacts || []).slice(0, 5), h = (e.review?.recentReports || e.dashboard?.briefings || []).slice(0, 5);
	return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "react-dashboard",
		"data-react-dashboard": !0,
		children: [
			/* @__PURE__ */ (0, x.jsx)(je, {
				eyebrow: "Investment Review",
				title: "대시보드",
				description: "시장 상태와 투자 체크포인트를 한 화면에서 점검합니다.",
				actions: /* @__PURE__ */ (0, x.jsx)("button", {
					type: "button",
					onClick: l,
					disabled: n,
					children: n ? "불러오는 중" : "새로고침"
				})
			}),
			o && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "react-dashboard-error",
				children: o
			}),
			e.review?.stale && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "react-dashboard-warning",
				children: "저장된 최신 투자 리뷰를 표시 중입니다."
			}),
			/* @__PURE__ */ (0, x.jsx)("section", {
				className: "react-dashboard-stats",
				"aria-label": "Dashboard summary",
				children: f.map((e) => /* @__PURE__ */ (0, x.jsxs)("article", { children: [
					/* @__PURE__ */ (0, x.jsx)("span", { children: e.label }),
					/* @__PURE__ */ (0, x.jsx)("strong", { children: e.value }),
					/* @__PURE__ */ (0, x.jsx)("small", { children: e.detail })
				] }, e.label))
			}),
			/* @__PURE__ */ (0, x.jsxs)("section", {
				className: "react-dashboard-grid",
				children: [
					/* @__PURE__ */ (0, x.jsx)(Sn, {}),
					/* @__PURE__ */ (0, x.jsxs)("article", {
						className: "react-dashboard-panel wide",
						children: [
							/* @__PURE__ */ (0, x.jsxs)("div", {
								className: "react-dashboard-panel-head",
								children: [/* @__PURE__ */ (0, x.jsx)("p", {
									className: "section-kicker",
									children: "Investment Review"
								}), /* @__PURE__ */ (0, x.jsx)("span", { children: e.review?.generatedAt || "not generated" })]
							}),
							/* @__PURE__ */ (0, x.jsx)("h2", { children: "투자 리뷰 요약" }),
							/* @__PURE__ */ (0, x.jsx)("p", { children: e.review?.summary || "아직 표시할 투자 리뷰 요약이 없습니다." }),
							/* @__PURE__ */ (0, x.jsx)("div", {
								className: "react-dashboard-actions",
								children: /* @__PURE__ */ (0, x.jsx)("button", {
									type: "button",
									onClick: u,
									disabled: i,
									children: i ? "리뷰 생성 중" : "투자 리뷰 갱신"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, x.jsxs)("article", {
						className: "react-dashboard-panel",
						children: [
							/* @__PURE__ */ (0, x.jsxs)("div", {
								className: "react-dashboard-panel-head",
								children: [/* @__PURE__ */ (0, x.jsx)("p", {
									className: "section-kicker",
									children: "Reports"
								}), /* @__PURE__ */ (0, x.jsx)("span", { children: h.length })]
							}),
							/* @__PURE__ */ (0, x.jsx)("h2", { children: "최근 보고서" }),
							/* @__PURE__ */ (0, x.jsx)("ul", { children: h.length ? h.map((e, t) => /* @__PURE__ */ (0, x.jsxs)("li", { children: [/* @__PURE__ */ (0, x.jsx)("strong", { children: e.title || "제목 없음" }), /* @__PURE__ */ (0, x.jsx)("span", { children: e.type || e.date || "" })] }, `${e.title || "report"}-${t}`)) : /* @__PURE__ */ (0, x.jsx)("li", { children: "최근 보고서가 없습니다." }) })
						]
					}),
					/* @__PURE__ */ (0, x.jsxs)("article", {
						className: "react-dashboard-panel",
						children: [
							/* @__PURE__ */ (0, x.jsxs)("div", {
								className: "react-dashboard-panel-head",
								children: [/* @__PURE__ */ (0, x.jsx)("p", {
									className: "section-kicker",
									children: "Checkpoints"
								}), /* @__PURE__ */ (0, x.jsx)("span", { children: p.length })]
							}),
							/* @__PURE__ */ (0, x.jsx)("h2", { children: "이번 주 체크포인트" }),
							/* @__PURE__ */ (0, x.jsx)("ul", { children: p.length ? p.map((e, t) => /* @__PURE__ */ (0, x.jsx)("li", { children: typeof e == "string" ? e : e.checkpoint || "체크포인트" }, t)) : /* @__PURE__ */ (0, x.jsx)("li", { children: "체크포인트가 없습니다." }) })
						]
					}),
					/* @__PURE__ */ (0, x.jsxs)("article", {
						className: "react-dashboard-panel",
						children: [
							/* @__PURE__ */ (0, x.jsxs)("div", {
								className: "react-dashboard-panel-head",
								children: [/* @__PURE__ */ (0, x.jsx)("p", {
									className: "section-kicker",
									children: "Portfolio"
								}), /* @__PURE__ */ (0, x.jsx)("span", { children: m.length })]
							}),
							/* @__PURE__ */ (0, x.jsx)("h2", { children: "포트폴리오 영향" }),
							/* @__PURE__ */ (0, x.jsx)("ul", { children: m.length ? m.map((e, t) => /* @__PURE__ */ (0, x.jsxs)("li", { children: [/* @__PURE__ */ (0, x.jsx)("strong", { children: xn(e) }), /* @__PURE__ */ (0, x.jsx)("span", { children: hn[e.impact || ""] || e.impact || "중립" })] }, `${xn(e)}-${t}`)) : /* @__PURE__ */ (0, x.jsx)("li", { children: "포트폴리오 영향 항목이 없습니다." }) })
						]
					}),
					/* @__PURE__ */ (0, x.jsx)("article", {
						className: "react-dashboard-panel wide",
						children: /* @__PURE__ */ (0, x.jsx)(mn, {})
					})
				]
			})
		]
	});
}
//#endregion
//#region src/app/DeepResearchRoute.tsx
var wn = [{
	key: "custom",
	label: "질문 중심"
}], Tn = { custom: "질문 중심" }, En = [
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
function Dn(e, t) {
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
function On(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function kn(e) {
	return typeof e == "string" && En.includes(e);
}
function An(e) {
	return On(e) ? typeof e.id == "string" && kn(e.status) : !1;
}
function jn(e) {
	return On(e) ? An(e.job) : !1;
}
var Mn = class extends Error {
	job;
	name = "JobTerminalError";
	constructor(e) {
		super(e.message || e.error || `딥 리서치 작업이 ${e.status} 상태로 종료되었습니다.`), this.job = e;
	}
};
async function Nn(e, t) {
	let n = e, r = Date.now() + 12e4;
	for (; f(n.status);) {
		if (Date.now() >= r) throw Error("작업이 아직 실행 중입니다. 잠시 후 작업 목록에서 다시 확인하세요.");
		await Dn(1e3, t), n = await g(`/api/jobs/${encodeURIComponent(n.id)}`, { signal: t });
	}
	if (n.status !== "done") throw new Mn(n);
	return n;
}
function Pn(e = "", t = "딥 리서치") {
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
function Fn(e) {
	return e.topicLabel || e.topicKey || "딥 리서치";
}
function In(e) {
	let t = String(e.topicKey || "").trim();
	return Tn[t] || t || "기타";
}
function Ln(e) {
	return e ? e.slice(0, 10) || e : "날짜 미상";
}
function Rn(e) {
	return [e.source, e.date].filter(Boolean).join(" · ");
}
function zn(e) {
	return e.title || e.url || e.path || "자료";
}
function Bn(e) {
	window.location.hash = e ? `#/deep-research/${encodeURIComponent(e)}` : "#/deep-research";
}
function Vn() {
	let e = window.location.hash.match(/^#\/?deep-research\/(.+)$/);
	return e ? decodeURIComponent(e[1]) : "";
}
function Hn() {
	return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "deep-research";
}
function Un(e) {
	return e instanceof d ? e.code : e instanceof Mn ? e.job.errorCode || e.job.status : e instanceof Error ? e.name : "request_failed";
}
function Wn(e, t) {
	let n = Un(t);
	return e === "validation" ? "투자 질문을 1~500자로 입력하세요." : n === "evidence_confirmation_required" || n === "resolution_changed" ? "자료 상태가 계획 미리보기와 달라졌습니다. 최신 계획을 다시 미리보고 확인하세요." : n === "no_index" || n === "index_unavailable" ? "연구 인덱스를 아직 읽을 수 없습니다. RSS 자료를 수집하고 인덱스를 만든 뒤 다시 시도하세요." : n === "rss_unavailable" ? "RSS 자료를 읽을 수 없습니다. RSS 수집 상태를 확인한 뒤 다시 시도하세요." : n === "cli_unavailable" ? "선택한 CLI 어댑터를 사용할 수 없습니다. 자동 어댑터를 선택하거나 설정을 확인하세요." : e === "degraded" ? "근거가 없는 규칙 기반 보고서를 실행하려면 근거 부족 확인이 필요합니다." : e === "generation" ? "생성 작업에 실패했습니다. 입력과 승인 계획은 유지되므로 다시 실행할 수 있습니다." : e === "report" ? "저장된 보고서를 열지 못했습니다. 목록으로 돌아가 다시 시도하세요." : t instanceof Error && t.message ? t.message : "요청을 처리하지 못했습니다. 입력을 확인하고 다시 시도하세요.";
}
function Gn(e) {
	return {
		id: e.approval.id,
		token: e.approval.token
	};
}
function Kn(e, t = "없음") {
	return e.length ? /* @__PURE__ */ (0, x.jsx)("ul", {
		className: "topicrpt-inline-list",
		children: e.map((e) => /* @__PURE__ */ (0, x.jsx)("li", { children: e }, e))
	}) : /* @__PURE__ */ (0, x.jsx)("span", {
		className: "topicrpt-empty-value",
		children: t
	});
}
function qn({ envelope: e, executionMode: t, cliAdapter: n, onExecutionMode: r, onCliAdapter: i, onContinue: a, onEdit: o, degradedConfirming: s, onConfirmDegraded: c, onCancelDegraded: l }) {
	let { approvedRequest: u, preview: d } = e, f = u.topicPlan, p = d.zeroEvidence, m = p.reasonCode;
	return /* @__PURE__ */ (0, x.jsxs)("section", {
		className: "input-panel topicrpt-plan-panel",
		"data-qa": "dr-plan",
		"aria-labelledby": "dr-plan-heading",
		children: [
			/* @__PURE__ */ (0, x.jsxs)("div", {
				className: "input-panel-header",
				children: [
					/* @__PURE__ */ (0, x.jsx)("span", {
						className: "section-kicker",
						children: "PLAN REVIEW"
					}),
					/* @__PURE__ */ (0, x.jsx)("h2", {
						id: "dr-plan-heading",
						children: "실행 전에 리서치 계획을 확인하세요"
					}),
					/* @__PURE__ */ (0, x.jsx)("p", { children: "계획의 범위와 자료 상태를 확인한 뒤에만 생성 작업을 시작합니다. 이 계획은 승인된 요청의 일부로 기록됩니다." })
				]
			}),
			/* @__PURE__ */ (0, x.jsxs)("div", {
				className: "topicrpt-plan-grid",
				children: [
					/* @__PURE__ */ (0, x.jsxs)("div", {
						className: "topicrpt-plan-card",
						children: [
							/* @__PURE__ */ (0, x.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "보고서 유형"
							}),
							/* @__PURE__ */ (0, x.jsx)("strong", { children: f.reportType }),
							/* @__PURE__ */ (0, x.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "분석 축"
							}),
							f.analysisAxes.length ? /* @__PURE__ */ (0, x.jsx)("ul", {
								className: "topicrpt-axis-list",
								children: f.analysisAxes.map((e) => /* @__PURE__ */ (0, x.jsxs)("li", { children: [/* @__PURE__ */ (0, x.jsx)("strong", { children: e.label }), Kn(e.questions)] }, e.key))
							}) : /* @__PURE__ */ (0, x.jsx)("span", {
								className: "topicrpt-empty-value",
								children: "분석 축 없음"
							})
						]
					}),
					/* @__PURE__ */ (0, x.jsxs)("div", {
						className: "topicrpt-plan-card",
						children: [
							/* @__PURE__ */ (0, x.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "검색 질의"
							}),
							Kn(f.searchQueries),
							/* @__PURE__ */ (0, x.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "심층 범위"
							}),
							/* @__PURE__ */ (0, x.jsxs)("p", { children: [
								"최대 ",
								f.deepResearch.maxRounds,
								"라운드 · 하위 질문 ",
								f.deepResearch.subQuestions.length,
								"개"
							] }),
							/* @__PURE__ */ (0, x.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "예상 공백"
							}),
							Kn(f.dataGapsLikely)
						]
					}),
					/* @__PURE__ */ (0, x.jsxs)("div", {
						className: "topicrpt-plan-card",
						children: [
							/* @__PURE__ */ (0, x.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "Collection 스냅샷"
							}),
							u.collectionRef ? /* @__PURE__ */ (0, x.jsxs)("p", { children: [
								u.collectionRef.id,
								" · revision ",
								u.collectionRef.revision,
								/* @__PURE__ */ (0, x.jsx)("br", {}),
								"eligible ",
								d.resolution.eligibleTotal ?? 0,
								" · selected ",
								d.resolution.selectedEvidenceIds.length
							] }) : /* @__PURE__ */ (0, x.jsx)("p", { children: "저장 필터 없이 전체 허용 자료에서 확인합니다." }),
							p.required && /* @__PURE__ */ (0, x.jsxs)("p", {
								className: "topicrpt-zero-evidence",
								"data-qa": `dr-readiness-${m === "no_index" ? "no-index" : m || "zero-evidence"}`,
								"data-reason-code": m || void 0,
								children: [m === "no_index" ? "인덱스 없음" : m === "filtered_empty" ? "필터 결과 없음" : "일치 자료 없음", " · 실행 전 확인 필요"]
							}),
							/* @__PURE__ */ (0, x.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "Market State"
							}),
							/* @__PURE__ */ (0, x.jsxs)("p", { children: [
								u.marketStatePolicy,
								" · scope ",
								u.marketStateScope
							] })
						]
					})
				]
			}),
			p.required && m && p.resolutionFingerprint && /* @__PURE__ */ (0, x.jsxs)("div", {
				className: "topicrpt-degraded-panel",
				"data-qa": `dr-degraded-${m === "no_index" ? "no-index" : m}`,
				"data-reason-code": m,
				role: "alert",
				children: [
					/* @__PURE__ */ (0, x.jsx)("strong", { children: "근거 부족 상태를 확인해야 합니다" }),
					/* @__PURE__ */ (0, x.jsx)("p", { children: "현재 선택된 외부 근거가 0건입니다. 확인하면 규칙 기반 결과로 진행하며, 보고서에 근거 공백과 반대 근거를 표시합니다." }),
					s ? /* @__PURE__ */ (0, x.jsxs)("div", {
						className: "topicrpt-degraded-actions",
						children: [/* @__PURE__ */ (0, x.jsx)("button", {
							className: "filter-btn apply",
							type: "button",
							"data-qa": "dr-degraded-confirm",
							onClick: c,
							children: "근거 부족을 확인하고 계속"
						}), /* @__PURE__ */ (0, x.jsx)("button", {
							className: "filter-btn clear",
							type: "button",
							onClick: l,
							children: "취소"
						})]
					}) : /* @__PURE__ */ (0, x.jsx)("p", { children: "계속하기를 누르면 확인 단계가 열립니다." })
				]
			}),
			/* @__PURE__ */ (0, x.jsxs)("div", {
				className: "topicrpt-action-row",
				children: [
					/* @__PURE__ */ (0, x.jsxs)("label", {
						className: "field topicrpt-execution-field",
						children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "실행 경로" }), /* @__PURE__ */ (0, x.jsxs)("select", {
							value: t,
							onChange: (e) => r(e.currentTarget.value),
							children: [/* @__PURE__ */ (0, x.jsx)("option", {
								value: "direct",
								children: "Direct API"
							}), /* @__PURE__ */ (0, x.jsx)("option", {
								value: "cli",
								children: "CLI"
							})]
						})]
					}),
					t === "cli" && /* @__PURE__ */ (0, x.jsxs)("label", {
						className: "field topicrpt-execution-field",
						children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "CLI 어댑터" }), /* @__PURE__ */ (0, x.jsxs)("select", {
							value: n,
							onChange: (e) => i(e.currentTarget.value),
							children: [
								/* @__PURE__ */ (0, x.jsx)("option", {
									value: "auto",
									children: "자동 선택"
								}),
								/* @__PURE__ */ (0, x.jsx)("option", {
									value: "codex",
									children: "Codex"
								}),
								/* @__PURE__ */ (0, x.jsx)("option", {
									value: "claude",
									children: "Claude"
								}),
								/* @__PURE__ */ (0, x.jsx)("option", {
									value: "antigravity",
									children: "Antigravity"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, x.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						onClick: o,
						children: "질문 수정"
					}),
					/* @__PURE__ */ (0, x.jsx)("button", {
						className: "filter-btn apply",
						type: "button",
						"data-qa": "dr-continue",
						onClick: a,
						children: p.required ? "계속하기" : "이 계획으로 생성"
					})
				]
			})
		]
	});
}
function Jn() {
	let [e, t] = (0, c.useState)([]), [n, r] = (0, c.useState)(null), [i, a] = (0, c.useState)(() => Vn()), [o, s] = (0, c.useState)(""), [l, f] = (0, c.useState)(""), [p, m] = (0, c.useState)("include_current"), [h, b] = (0, c.useState)("AUTO"), [S, C] = (0, c.useState)("readiness"), [w, T] = (0, c.useState)(null), [E, D] = (0, c.useState)("direct"), [O, k] = (0, c.useState)("auto"), [A, j] = (0, c.useState)(!1), [M, N] = (0, c.useState)(!1), [P, F] = (0, c.useState)(""), [I, L] = (0, c.useState)(null), [R, z] = (0, c.useState)(""), [B, V] = (0, c.useState)(null), [H, U] = (0, c.useState)(""), [W, ee] = (0, c.useState)(""), te = (0, c.useRef)(0), ne = (0, c.useRef)(null), re = wn[0].key, ie = o, ae = (0, c.useCallback)(() => {
		ne.current?.abort();
		let e = new AbortController();
		return ne.current = e, te.current += 1, {
			id: te.current,
			signal: e.signal
		};
	}, []), oe = (0, c.useCallback)((e) => e === te.current, []), se = (0, c.useCallback)(async (e) => {
		N(!0);
		try {
			let n = await g("/api/topic-reports", { signal: e });
			t(Array.isArray(n) ? n : []), V(null), C((e) => e === "readiness" ? "draft" : e), v({
				surface: "topic_report",
				viewId: "topicrpt",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError") return;
			F(Wn("readiness", e)), L("readiness"), z(Un(e));
			let t = Un(e);
			V(t === "no_index" || t === "index_unavailable" ? "no-index" : t === "rss_unavailable" ? "rss" : "api"), C("recoverable-error");
		} finally {
			N(!1);
		}
	}, []);
	(0, c.useEffect)(() => {
		let e = new AbortController();
		return se(e.signal), () => e.abort();
	}, [se]), (0, c.useEffect)(() => {
		let e = () => {
			Hn() && a(Vn());
		};
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []), (0, c.useEffect)(() => {
		let e = new AbortController();
		ne.current?.abort();
		let t = te.current + 1;
		te.current = t;
		async function n(n) {
			N(!0);
			try {
				let i = await g(`/api/topic-reports/${encodeURIComponent(n)}?includePersonal=true`, { signal: e.signal });
				if (e.signal.aborted || te.current !== t) return;
				r(i), C("report"), v({
					surface: "topic_report_reader",
					viewId: "topicrpt",
					reportKind: "topic_report",
					reportId: i.id || n
				});
			} catch (n) {
				if (n instanceof DOMException && n.name === "AbortError" || e.signal.aborted || te.current !== t) return;
				r(null), F(Wn("report", n)), L("report"), z(Un(n)), C("recoverable-error");
			} finally {
				!e.signal.aborted && te.current === t && N(!1);
			}
		}
		return i ? n(i) : (r(null), C((e) => e === "report" ? "draft" : e), v({
			surface: "topic_report",
			viewId: "topicrpt",
			reportKind: "",
			reportId: ""
		}), N(!1)), () => e.abort();
	}, [i]);
	let ce = async (e) => {
		e.preventDefault();
		let t = o.normalize("NFKC").trim();
		if (!t || t.length > 500) {
			F(Wn("validation", /* @__PURE__ */ Error("question_invalid"))), L("validation"), z("question_invalid"), C("recoverable-error");
			return;
		}
		let n = ae();
		C("plan-loading"), T(null), j(!1), F(""), L(null), z(""), U("질문을 실행 계획으로 바꾸는 중입니다.");
		let r = {
			question: t,
			userContext: l.normalize("NFKC").trim(),
			deepResearch: !0,
			customTickers: {},
			marketStatePolicy: p,
			marketStateScope: h,
			collectionRef: null
		};
		try {
			let e = await _("/api/topic-reports/plan", r, { signal: n.signal });
			if (!oe(n.id)) return;
			T(e), C("plan-review"), U("실행 계획을 확인하세요.");
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError" || !oe(n.id)) return;
			F(Wn("plan", e)), L("plan"), z(Un(e)), V(Un(e) === "no_index" || Un(e) === "index_unavailable" ? "no-index" : Un(e) === "rss_unavailable" ? "rss" : null), C("recoverable-error"), U("");
		}
	}, de = async (e) => {
		let n = ae();
		C("generation"), F(""), L(null), z(""), U("승인된 계획으로 리서치를 생성하는 중입니다.");
		let i = {
			mode: E,
			adapter: E === "direct" ? "auto" : O,
			fallbackPolicy: u
		}, a = {
			approvedRequest: e.approvedRequest,
			approval: Gn(e),
			execution: i
		};
		try {
			let e = await _("/api/topic-reports", a, { signal: n.signal }), i = jn(e) ? e.job : An(e) ? e : null;
			if (!i) throw Error("생성 작업 ID를 확인하지 못했습니다.");
			let o = await Nn(i, n.signal);
			if (!oe(n.id)) return;
			let s = o.result?.reportId || o.result?.artifactId || "";
			if (!s) throw Error("생성된 보고서 ID를 확인하지 못했습니다.");
			let c = await g(`/api/topic-reports/${encodeURIComponent(s)}?includePersonal=true`, { signal: n.signal });
			if (!oe(n.id)) return;
			t((e) => [c, ...e.filter((e) => e.id !== c.id)]), r(c), C("report"), U("딥 리서치를 생성하고 자동 저장했습니다."), Bn(c.id), v({
				surface: "topic_report_reader",
				viewId: "topicrpt",
				reportKind: "topic_report",
				reportId: c.id || ""
			});
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError" || !oe(n.id)) return;
			F(Wn("generation", e)), L(e instanceof d && (e.code === "evidence_confirmation_required" || e.code === "resolution_changed") ? "degraded" : "generation"), z(Un(e)), C("recoverable-error"), U("");
		}
	}, fe = () => {
		if (w) {
			if (w.preview.zeroEvidence.required) {
				if (!w.preview.zeroEvidence.reasonCode || !w.preview.zeroEvidence.resolutionFingerprint) {
					F("근거 부족 확인 정보가 없어 실행을 중단했습니다. 계획을 다시 미리보세요."), L("degraded"), z("invalid_zero_evidence"), C("recoverable-error");
					return;
				}
				j(!0), U("근거 부족 확인을 검토하세요.");
				return;
			}
			de(w);
		}
	}, pe = async () => {
		if (!w) return;
		let e = w.preview.zeroEvidence;
		if (!e.required || !e.reasonCode || !e.resolutionFingerprint) return;
		let t = ae();
		F(""), L(null), z(""), U("근거 부족 확인을 저장하는 중입니다.");
		let n = {
			approvedRequest: w.approvedRequest,
			approval: Gn(w),
			reasonCode: e.reasonCode,
			resolutionFingerprint: e.resolutionFingerprint,
			confirmed: !0
		};
		try {
			let e = await _("/api/topic-reports/confirm-degraded", n, { signal: t.signal });
			if (!oe(t.id)) return;
			T(e), j(!1), await de(e);
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError" || !oe(t.id)) return;
			F(Wn("degraded", e)), L("degraded"), z(Un(e)), C("recoverable-error"), U("");
		}
	};
	async function me(e) {
		if (!(!e.id || !window.confirm(`${Fn(e)} 보고서를 삭제할까요?`))) {
			ee(`delete-${e.id}`), F("");
			try {
				let r = await fetch(`/api/topic-reports/${encodeURIComponent(e.id)}`, { method: "DELETE" });
				if (!r.ok) throw Error(`삭제 실패: ${r.status}`);
				n?.id === e.id && Bn(), t((t) => t.filter((t) => t.id !== e.id)), U("저장된 딥 리서치를 삭제했습니다.");
			} catch (e) {
				F(e instanceof Error ? e.message : "보고서 삭제에 실패했습니다."), L("report"), z(Un(e));
			} finally {
				ee("");
			}
		}
	}
	async function he(e) {
		if (n) {
			ee(e), U(e === "notion" ? "Notion으로 내보내는 중..." : "Obsidian으로 내보내는 중...");
			try {
				let t = e === "notion" ? await _("/api/export-notion/topic-report", n) : await _("/api/export-obsidian/topic-report", n);
				U(e === "notion" ? `Notion으로 내보냈습니다${t.title ? `: ${t.title}` : ""}` : `Obsidian으로 내보냈습니다${t.topic || t.filename ? `: ${t.topic || t.filename}` : ""}`);
			} catch (e) {
				U(e instanceof Error ? e.message : "내보내기에 실패했습니다.");
			} finally {
				ee("");
			}
		}
	}
	async function ge() {
		if (n?.id) {
			ee("overlay"), U("내 노트와 연결하는 중...");
			try {
				let e = await _(`/api/topic-reports/${encodeURIComponent(n.id)}/personal-overlay`, {});
				An(e) && await Nn(e, new AbortController().signal);
				let t = await g(`/api/topic-reports/${encodeURIComponent(n.id)}?includePersonal=true`);
				r(t), U("내 노트와 연결했습니다.");
			} catch (e) {
				U(e instanceof Error ? e.message : "내 노트 연결에 실패했습니다.");
			} finally {
				ee("");
			}
		}
	}
	let ve = (0, c.useMemo)(() => {
		let t = /* @__PURE__ */ new Map();
		for (let n of e) {
			let e = In(n);
			t.has(e) || t.set(e, []), t.get(e)?.push(n);
		}
		return Array.from(t.entries()).map(([e, t]) => ({
			key: e,
			rows: t.sort((e, t) => String(t.generatedAt || t.date || "").localeCompare(String(e.generatedAt || e.date || "")))
		})).sort((e, t) => String(t.rows[0]?.generatedAt || t.rows[0]?.date || "").localeCompare(String(e.rows[0]?.generatedAt || e.rows[0]?.date || "")));
	}, [e]), ye = Pn(n?.markdown || "", Fn(n || {})), be = n?.sources || [];
	if (n && S === "report") return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "react-deep-research-route",
		"data-deep-research-route": !0,
		"data-qa": "dr-report",
		children: [
			P && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "react-dashboard-error",
				"data-qa": "dr-error-report",
				children: P
			}),
			(n.mode === "fallback" || n.generation?.mode === "rules") && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "react-dashboard-warning",
				"data-qa": "dr-degraded-rules",
				role: "status",
				children: "근거 부족을 확인한 규칙 기반 보고서입니다. 자료 공백과 반대 근거를 함께 확인하세요."
			}),
			/* @__PURE__ */ (0, x.jsxs)(Ae, {
				eyebrow: `DEEP RESEARCH${n.date ? ` · ${n.date}` : ""}`,
				title: ye.title,
				meta: `${Fn(n)} · 뉴스 ${n.docCount || 0}건 · 내러티브 ${n.memoryCount || 0}건`,
				agentContext: {
					surface: "topic_report_reader",
					viewId: "topicrpt",
					reportKind: "topic_report",
					reportId: n.id || "",
					topic: Fn(n)
				},
				breadcrumb: /* @__PURE__ */ (0, x.jsxs)(x.Fragment, { children: [/* @__PURE__ */ (0, x.jsx)("button", {
					type: "button",
					onClick: () => Bn(),
					children: "딥 리서치"
				}), /* @__PURE__ */ (0, x.jsx)("span", { children: ye.title })] }),
				onClose: () => Bn(),
				actionSlot: /* @__PURE__ */ (0, x.jsxs)(x.Fragment, { children: [
					/* @__PURE__ */ (0, x.jsx)(le, {
						title: "AI",
						children: /* @__PURE__ */ (0, x.jsx)(ue, {
							icon: "agent",
							onClick: () => y({
								surface: "topic_report_reader",
								reportKind: "topic_report",
								reportId: n.id || "",
								topic: Fn(n),
								message: `${ye.title}의 핵심 결론, 반대 근거, 더 발전시킬 분석 방향을 정리해줘.`,
								autoSubmit: !0
							}),
							children: "Agent에게 묻기"
						})
					}),
					/* @__PURE__ */ (0, x.jsx)(le, {
						title: "노트",
						children: /* @__PURE__ */ (0, x.jsx)(ue, {
							icon: "link",
							disabled: W === "overlay" || !n.id,
							onClick: ge,
							children: W === "overlay" ? "연결 중" : "내 노트와 연결"
						})
					}),
					/* @__PURE__ */ (0, x.jsxs)(le, {
						title: "내보내기",
						children: [/* @__PURE__ */ (0, x.jsx)(ue, {
							icon: "notion",
							disabled: W === "notion",
							onClick: () => he("notion"),
							children: W === "notion" ? "내보내는 중" : "Notion으로 내보내기"
						}), /* @__PURE__ */ (0, x.jsx)(ue, {
							icon: "obsidian",
							disabled: W === "obsidian",
							onClick: () => he("obsidian"),
							children: W === "obsidian" ? "내보내는 중" : "Obsidian으로 내보내기"
						})]
					}),
					n.generation?.message && /* @__PURE__ */ (0, x.jsx)("p", {
						className: "react-reader-status",
						children: n.generation.message
					}),
					H && /* @__PURE__ */ (0, x.jsx)("p", {
						className: "react-reader-status",
						children: H
					})
				] }),
				noteIdentity: {
					id: Oe("topic", Fn(n)),
					noteType: "topic_review",
					title: Fn(n) ? `${Fn(n)} 리서치 노트` : "딥 리서치 노트",
					topic: Fn(n),
					label: Fn(n),
					reportKind: "topic_report",
					reportId: Fn(n),
					linkedReports: [ye.title].filter(Boolean)
				},
				noteLinkedTitle: ye.title,
				noteOverlayMarkdown: n.personalOverlay?.markdown || "",
				children: [/* @__PURE__ */ (0, x.jsx)(_e, { markdown: ye.body || n.markdown || "" }), be.length > 0 && /* @__PURE__ */ (0, x.jsxs)("section", {
					className: "source-panel react-topic-sources",
					children: [/* @__PURE__ */ (0, x.jsx)("h4", { children: "참고자료" }), /* @__PURE__ */ (0, x.jsx)("div", {
						className: "sources",
						children: be.map((e) => /* @__PURE__ */ (0, x.jsxs)("div", {
							className: "meta",
							children: [/* @__PURE__ */ (0, x.jsx)("span", { children: Rn(e) }), e.url ? /* @__PURE__ */ (0, x.jsx)("a", {
								href: e.url,
								target: "_blank",
								rel: "noopener noreferrer",
								children: zn(e)
							}) : /* @__PURE__ */ (0, x.jsx)("span", { children: zn(e) })]
						}, `${zn(e)}-${e.url || e.path || e.date || e.source || "source"}`))
					})]
				})]
			})
		]
	});
	let xe = S === "plan-loading" || S === "generation" || M, Se = S === "recoverable-error" && P;
	return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "react-deep-research-route",
		"data-deep-research-route": !0,
		children: [
			/* @__PURE__ */ (0, x.jsx)(je, {
				eyebrow: "Deep Research",
				title: "딥 리서치",
				description: "투자 질문을 먼저 실행 계획으로 정리한 뒤, 외부 근거와 시장 상태를 구분해 bounded research를 생성합니다.",
				actions: /* @__PURE__ */ (0, x.jsx)("button", {
					className: "filter-btn clear",
					type: "button",
					onClick: () => void se(),
					disabled: M,
					children: M ? "불러오는 중" : "다시 읽기"
				})
			}),
			S === "readiness" && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "react-dashboard-warning",
				"data-qa": "dr-readiness-loading",
				role: "status",
				children: "저장된 리포트와 자료 상태를 확인하는 중입니다."
			}),
			B && S === "recoverable-error" && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "react-dashboard-error",
				"data-qa": `dr-readiness-${B}`,
				children: P
			}),
			Se && /* @__PURE__ */ (0, x.jsxs)("div", {
				className: "react-dashboard-error topicrpt-recoverable-error",
				"data-qa": `dr-error-${I || "request"}`,
				role: "alert",
				children: [
					/* @__PURE__ */ (0, x.jsx)("strong", { children: "다시 시도할 수 있습니다" }),
					/* @__PURE__ */ (0, x.jsx)("span", {
						"data-qa": `dr-error-${(R || "request").replace(/_/g, "-")}`,
						"data-error-code": R || "request",
						children: P
					}),
					/* @__PURE__ */ (0, x.jsx)("p", { children: "입력한 질문과 컨텍스트, 마지막 계획은 유지됩니다." }),
					/* @__PURE__ */ (0, x.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						onClick: () => {
							F(""), L(null), z(""), C(w ? "plan-review" : "draft");
						},
						children: "돌아가서 수정"
					})
				]
			}),
			S !== "plan-review" && S !== "generation" && /* @__PURE__ */ (0, x.jsxs)("form", {
				className: "input-panel topicrpt-form",
				onSubmit: ce,
				noValidate: !0,
				children: [
					/* @__PURE__ */ (0, x.jsxs)("div", {
						className: "input-panel-header",
						children: [
							/* @__PURE__ */ (0, x.jsx)("span", {
								className: "section-kicker",
								children: "QUESTION FIRST"
							}),
							/* @__PURE__ */ (0, x.jsx)("h2", { children: "무엇을 투자 판단으로 확인하고 싶나요?" }),
							/* @__PURE__ */ (0, x.jsx)("p", { children: "질문은 1~500자로 입력하세요. 컨텍스트는 가설로만 전달되며 외부 근거로 승격되지 않습니다." })
						]
					}),
					/* @__PURE__ */ (0, x.jsx)("div", {
						className: "topicrpt-topic-row",
						children: /* @__PURE__ */ (0, x.jsx)("div", {
							className: "topicrpt-preset-btns",
							"aria-label": "리서치 모드",
							children: wn.map((e) => /* @__PURE__ */ (0, x.jsx)("span", {
								className: "filter-btn topicrpt-preset active",
								"data-topic": e.key,
								children: e.label
							}, e.key))
						})
					}),
					/* @__PURE__ */ (0, x.jsxs)("label", {
						className: "field topicrpt-question-field",
						children: [
							/* @__PURE__ */ (0, x.jsx)("span", { children: "투자 질문" }),
							/* @__PURE__ */ (0, x.jsx)("textarea", {
								"data-qa": "dr-question",
								value: o,
								onChange: (e) => s(e.currentTarget.value),
								maxLength: 500,
								rows: 4,
								placeholder: "예: 미국 전력 수요 증가가 12개월 내 반도체 공급망과 관련 기업에 어떤 영향을 줄까?",
								required: !0,
								"aria-describedby": "dr-question-help"
							}),
							/* @__PURE__ */ (0, x.jsxs)("small", {
								id: "dr-question-help",
								children: [o.length, "/500"]
							})
						]
					}),
					/* @__PURE__ */ (0, x.jsxs)("label", {
						className: "field topicrpt-context-field",
						children: [/* @__PURE__ */ (0, x.jsxs)("span", { children: ["추가 컨텍스트 ", /* @__PURE__ */ (0, x.jsx)("em", { children: "(선택)" })] }), /* @__PURE__ */ (0, x.jsx)("textarea", {
							"data-qa": "dr-context",
							value: l,
							onChange: (e) => f(e.currentTarget.value),
							maxLength: 4e3,
							rows: 4,
							placeholder: "예: 보유 종목, 관심 지역, 확인할 기간 등. 이 내용은 hypothesis로 표시됩니다."
						})]
					}),
					/* @__PURE__ */ (0, x.jsxs)("div", {
						className: "topicrpt-action-row",
						children: [
							/* @__PURE__ */ (0, x.jsxs)("label", {
								className: "field topicrpt-policy-field",
								children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "Market State 정책" }), /* @__PURE__ */ (0, x.jsxs)("select", {
									value: p,
									onChange: (e) => m(e.currentTarget.value),
									children: [/* @__PURE__ */ (0, x.jsx)("option", {
										value: "include_current",
										children: "현재 상태 포함"
									}), /* @__PURE__ */ (0, x.jsx)("option", {
										value: "exclude",
										children: "제외"
									})]
								})]
							}),
							/* @__PURE__ */ (0, x.jsxs)("label", {
								className: "field topicrpt-policy-field",
								children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "Market State 범위" }), /* @__PURE__ */ (0, x.jsxs)("select", {
									value: h,
									onChange: (e) => b(e.currentTarget.value),
									children: [
										/* @__PURE__ */ (0, x.jsx)("option", {
											value: "AUTO",
											children: "자동"
										}),
										/* @__PURE__ */ (0, x.jsx)("option", {
											value: "GLOBAL",
											children: "글로벌"
										}),
										/* @__PURE__ */ (0, x.jsx)("option", {
											value: "US",
											children: "미국"
										}),
										/* @__PURE__ */ (0, x.jsx)("option", {
											value: "KR",
											children: "한국"
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, x.jsx)("span", {
								className: "topicrpt-policy-note",
								children: "Deep research · 최대 2라운드"
							}),
							/* @__PURE__ */ (0, x.jsx)("button", {
								className: "filter-btn apply",
								type: "submit",
								"data-qa": "dr-preview",
								disabled: xe,
								children: S === "plan-loading" ? "계획 준비 중" : "계획 미리보기"
							})
						]
					}),
					/* @__PURE__ */ (0, x.jsx)("input", {
						type: "hidden",
						value: ie,
						"data-legacy-topic": re,
						readOnly: !0,
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ (0, x.jsx)("input", {
						type: "hidden",
						value: "true",
						readOnly: !0,
						"aria-hidden": "true"
					})
				]
			}),
			S === "plan-review" && w && /* @__PURE__ */ (0, x.jsx)(qn, {
				envelope: w,
				executionMode: E,
				cliAdapter: O,
				onExecutionMode: D,
				onCliAdapter: k,
				onContinue: fe,
				onEdit: () => {
					C("draft"), U("");
				},
				degradedConfirming: A,
				onConfirmDegraded: () => void pe(),
				onCancelDegraded: () => j(!1)
			}),
			S === "generation" && /* @__PURE__ */ (0, x.jsxs)("section", {
				className: "input-panel topicrpt-generation-panel",
				"data-qa": "dr-generation",
				"aria-live": "polite",
				children: [
					/* @__PURE__ */ (0, x.jsx)("span", {
						className: "section-kicker",
						children: "GENERATING"
					}),
					/* @__PURE__ */ (0, x.jsx)("h2", { children: "승인된 계획을 실행하는 중입니다" }),
					/* @__PURE__ */ (0, x.jsx)("p", {
						"data-qa": "dr-generation-status",
						children: H || "작업 상태를 확인하는 중입니다."
					})
				]
			}),
			H && S !== "generation" && S !== "report" && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "react-dashboard-warning",
				"data-qa": "dr-status",
				role: "status",
				children: H
			}),
			/* @__PURE__ */ (0, x.jsx)("div", {
				className: "section-head compact analysis-archive-head topicrpt-saved-panel",
				children: /* @__PURE__ */ (0, x.jsxs)("div", { children: [/* @__PURE__ */ (0, x.jsx)("h2", {
					className: "section-title",
					children: "저장된 리포트"
				}), /* @__PURE__ */ (0, x.jsx)("p", {
					className: "section-subtitle",
					children: "카드를 누르면 원문·근거·개인 레이어를 확인할 수 있습니다."
				})] })
			}),
			/* @__PURE__ */ (0, x.jsx)("div", {
				className: "report-feed",
				children: ve.length ? ve.map((e) => /* @__PURE__ */ (0, x.jsxs)("section", {
					className: "report-feed-group",
					children: [/* @__PURE__ */ (0, x.jsxs)("div", {
						className: "report-feed-group-head",
						children: [/* @__PURE__ */ (0, x.jsx)("span", {
							className: "report-feed-group-name",
							children: e.key
						}), /* @__PURE__ */ (0, x.jsxs)("span", {
							className: "report-feed-group-meta",
							children: [
								e.rows.length,
								"건 · 최근 ",
								Ln(e.rows[0]?.generatedAt || e.rows[0]?.date)
							]
						})]
					}), /* @__PURE__ */ (0, x.jsx)("div", {
						className: "report-feed-group-cards",
						children: e.rows.map((e) => {
							let t = W === `delete-${e.id}`;
							return /* @__PURE__ */ (0, x.jsxs)("div", {
								className: "report-feed-card-wrap",
								children: [/* @__PURE__ */ (0, x.jsxs)("button", {
									className: "report-feed-card is-topic",
									type: "button",
									onClick: () => e.id && Bn(e.id),
									children: [
										/* @__PURE__ */ (0, x.jsx)("span", {
											className: "report-feed-card-meta",
											children: e.mode && /* @__PURE__ */ (0, x.jsx)("span", {
												className: "report-feed-badge",
												children: String(e.mode).toUpperCase()
											})
										}),
										/* @__PURE__ */ (0, x.jsx)("strong", { children: Fn(e) }),
										/* @__PURE__ */ (0, x.jsx)("span", {
											className: "report-feed-card-foot",
											children: Ln(e.date || e.generatedAt)
										})
									]
								}), /* @__PURE__ */ (0, x.jsx)("button", {
									type: "button",
									className: "report-feed-card-delete",
									disabled: t,
									onClick: () => void me(e),
									"aria-label": `${Fn(e)} 삭제`,
									"data-tooltip": "삭제",
									children: /* @__PURE__ */ (0, x.jsx)("svg", {
										width: "13",
										height: "13",
										viewBox: "0 0 16 16",
										fill: "none",
										stroke: "currentColor",
										strokeWidth: "1.4",
										strokeLinecap: "round",
										strokeLinejoin: "round",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, x.jsx)("path", { d: "M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" })
									})
								})]
							}, e.id || `${Fn(e)}-${e.date}`);
						})
					})]
				}, e.key)) : /* @__PURE__ */ (0, x.jsx)("div", {
					className: "report-feed-empty",
					children: "저장된 딥 리서치가 없습니다. 질문을 입력해 실행 계획을 미리보세요."
				})
			})
		]
	});
}
//#endregion
//#region src/app/MarketMemoryRoute.tsx
function Yn(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function Xn() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function Zn(e) {
	return e.snapshot?.headline ? e.message || `시장 상태 스냅샷을 저장했습니다: ${e.snapshot.headline}` : e.snapshotId || e.title ? e.message || `시장 상태 스냅샷을 저장했습니다${e.title ? `: ${e.title}` : ""}` : `${e.message || (e.ok ? "시장 내러티브를 정리했습니다." : "시장 내러티브 정리가 완료되었습니다.")}${Number.isFinite(Number(e.savedCount)) ? ` 저장 ${e.savedCount}건` : ""}${e.estimatedInputTokens ? ` · 입력 약 ${e.estimatedInputTokens} tokens` : ""}${e.rawEntryCount === void 0 ? "" : ` · 응답 ${e.rawEntryCount}건 · 제외 ${e.droppedCount || 0}건`}`;
}
function Qn(e) {
	let t = e;
	return !!(t?.id && f(t.status));
}
async function $n(e) {
	let t = e;
	for (; f(t.status);) await Yn(1e3), t = await fetch(`/api/jobs/${encodeURIComponent(t.id)}`).then((e) => {
		if (!e.ok) throw Error(`/api/jobs/${encodeURIComponent(t.id)} failed: ${e.status}`);
		return e.json();
	});
	if (t.status !== "done") throw Error(t.message || t.error || "시장 내러티브 정리에 실패했습니다.");
	return t;
}
async function er() {
	let e = await _("/api/memory/update", { date: Xn() });
	return Qn(e) ? (await $n(e)).result || {} : e;
}
function tr() {
	let [e, t] = (0, c.useState)(0), [n, r] = (0, c.useState)(!1), [i, a] = (0, c.useState)(""), [o, s] = (0, c.useState)("");
	async function l() {
		r(!0), s(""), a("AI Agent가 단기 뉴스와 기존 중기 메모리를 업데이트하는 중입니다.");
		try {
			a("시장 메모리와 화면용 시장 상태를 함께 갱신하는 중입니다.");
			let e = await er();
			if (e.ok === !1) throw Error(e.message || e.status || "시장 메모리 업데이트에 실패했습니다.");
			a(`시장 메모리를 업데이트했습니다. ${Zn(e)}`), t((e) => e + 1);
		} catch (e) {
			s(e instanceof Error ? e.message : "시장 메모리 업데이트에 실패했습니다."), a("");
		} finally {
			r(!1);
		}
	}
	return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "react-market-memory-route",
		"data-market-memory-route": !0,
		children: [
			/* @__PURE__ */ (0, x.jsx)(je, {
				eyebrow: "Market Memory",
				title: "시장 내러티브",
				description: "단기 뉴스 흐름을 중기 시장 상황으로 압축해 투자 판단의 배경으로 유지합니다."
			}),
			o && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "react-dashboard-error",
				children: o
			}),
			i && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "react-dashboard-warning",
				children: i
			}),
			/* @__PURE__ */ (0, x.jsx)("section", {
				className: "market-state-dashboard react-market-memory-dashboard",
				"aria-label": "현재 중기 시장 상황",
				children: /* @__PURE__ */ (0, x.jsx)(mn, {
					onUpdate: l,
					updating: n
				}, e)
			})
		]
	});
}
//#endregion
//#region src/app/ReactAgentDock.tsx
var nr = /* @__PURE__ */ new Set([
	"codex",
	"claude",
	"antigravity"
]), rr = {
	id: "welcome",
	role: "assistant",
	text: "현재 화면에 대해 물어보세요. 보고서 수정이나 발전 요청은 작업으로 전환해 처리합니다.",
	variant: "welcome",
	createdAt: (/* @__PURE__ */ new Date()).toISOString()
}, ir = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19.503 0H4.496A4.496 4.496 0 000 4.496v15.007A4.496 4.496 0 004.496 24h15.007A4.496 4.496 0 0024 19.503V4.496A4.496 4.496 0 0019.503 0z\" fill=\"#fff\"></path><path d=\"M9.064 3.344a4.578 4.578 0 012.285-.312c1 .115 1.891.54 2.673 1.275.01.01.024.017.037.021a.09.09 0 00.043 0 4.55 4.55 0 013.046.275l.047.022.116.057a4.581 4.581 0 012.188 2.399c.209.51.313 1.041.315 1.595a4.24 4.24 0 01-.134 1.223.123.123 0 00.03.115c.594.607.988 1.33 1.183 2.17.289 1.425-.007 2.71-.887 3.854l-.136.166a4.548 4.548 0 01-2.201 1.388.123.123 0 00-.081.076c-.191.551-.383 1.023-.74 1.494-.9 1.187-2.222 1.846-3.711 1.838-1.187-.006-2.239-.44-3.157-1.302a.107.107 0 00-.105-.024c-.388.125-.78.143-1.204.138a4.441 4.441 0 01-1.945-.466 4.544 4.544 0 01-1.61-1.335c-.152-.202-.303-.392-.414-.617a5.81 5.81 0 01-.37-.961 4.582 4.582 0 01-.014-2.298.124.124 0 00.006-.056.085.085 0 00-.027-.048 4.467 4.467 0 01-1.034-1.651 3.896 3.896 0 01-.251-1.192 5.189 5.189 0 01.141-1.6c.337-1.112.982-1.985 1.933-2.618.212-.141.413-.251.601-.33.215-.089.43-.164.646-.227a.098.098 0 00.065-.066 4.51 4.51 0 01.829-1.615 4.535 4.535 0 011.837-1.388zm3.482 10.565a.637.637 0 000 1.272h3.636a.637.637 0 100-1.272h-3.636zM8.462 9.23a.637.637 0 00-1.106.631l1.272 2.224-1.266 2.136a.636.636 0 101.095.649l1.454-2.455a.636.636 0 00.005-.64L8.462 9.23z\" fill=\"url(#folio-react-codex-gradient)\"></path><defs><linearGradient gradientUnits=\"userSpaceOnUse\" id=\"folio-react-codex-gradient\" x1=\"12\" x2=\"12\" y1=\"3\" y2=\"21\"><stop stop-color=\"#B1A7FF\"></stop><stop offset=\".5\" stop-color=\"#7A9DFF\"></stop><stop offset=\"1\" stop-color=\"#3941FF\"></stop></linearGradient></defs></svg>", ar = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M9.064 3.344a4.578 4.578 0 012.285-.312c1 .115 1.891.54 2.673 1.275.01.01.024.017.037.021a.09.09 0 00.043 0 4.55 4.55 0 013.046.275l.047.022.116.057a4.581 4.581 0 012.188 2.399c.209.51.313 1.041.315 1.595a4.24 4.24 0 01-.134 1.223.123.123 0 00.03.115c.594.607.988 1.33 1.183 2.17.289 1.425-.007 2.71-.887 3.854l-.136.166a4.548 4.548 0 01-2.201 1.388.123.123 0 00-.081.076c-.191.551-.383 1.023-.74 1.494-.9 1.187-2.222 1.846-3.711 1.838-1.187-.006-2.239-.44-3.157-1.302a.107.107 0 00-.105-.024c-.388.125-.78.143-1.204.138a4.441 4.441 0 01-1.945-.466 4.544 4.544 0 01-1.61-1.335c-.152-.202-.303-.392-.414-.617a5.81 5.81 0 01-.37-.961 4.582 4.582 0 01-.014-2.298.124.124 0 00.006-.056.085.085 0 00-.027-.048 4.467 4.467 0 01-1.034-1.651 3.896 3.896 0 01-.251-1.192 5.189 5.189 0 01.141-1.6c.337-1.112.982-1.985 1.933-2.618.212-.141.413-.251.601-.33.215-.089.43-.164.646-.227a.098.098 0 00.065-.066 4.51 4.51 0 01.829-1.615 4.535 4.535 0 011.837-1.388zm3.482 10.565a.637.637 0 000 1.272h3.636a.637.637 0 100-1.272h-3.636zM8.462 9.23a.637.637 0 00-1.106.631l1.272 2.224-1.266 2.136a.636.636 0 101.095.649l1.454-2.455a.636.636 0 00.005-.64L8.462 9.23z\" fill=\"currentColor\"/></svg>", or = "M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z", sr = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${or}" fill="#D97757" fill-rule="nonzero"></path></svg>`, cr = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${or}" fill="currentColor" fill-rule="nonzero"></path></svg>`, lr = "M21.751 22.607c1.34 1.005 3.35.335 1.508-1.508C17.73 15.74 18.904 1 12.037 1 5.17 1 6.342 15.74.815 21.1c-2.01 2.009.167 2.511 1.507 1.506 5.192-3.517 4.857-9.714 9.715-9.714 4.857 0 4.522 6.197 9.714 9.715z", ur = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${lr}" fill="url(#folio-react-antigravity-gradient)"></path><defs><linearGradient id="folio-react-antigravity-gradient" x1="5" x2="19" y1="22" y2="2" gradientUnits="userSpaceOnUse"><stop stop-color="#3186FF"></stop><stop offset=".42" stop-color="#34A853"></stop><stop offset=".72" stop-color="#FBBC04"></stop><stop offset="1" stop-color="#EA4335"></stop></linearGradient></defs></svg>`, dr = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${lr}" fill="currentColor"></path></svg>`, fr = "<svg viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M9 3c.4 3.9 3.1 6.6 7 7-3.9.4-6.6 3.1-7 7-.4-3.9-3.1-6.6-7-7 3.9-.4 6.6-3.1 7-7z\"/><path d=\"M17.8 13c.25 2.4 1.85 4 4.2 4.25-2.35.25-3.95 1.85-4.2 4.25-.25-2.4-1.85-4-4.2-4.25 2.35-.25 3.95-1.85 4.2-4.25z\" opacity=\".7\"/></svg>", pr = {
	codex: {
		label: "Codex",
		color: "#3941ff",
		logo: ir,
		monoLogo: ar
	},
	claude: {
		label: "Claude",
		color: "#d97757",
		logo: sr,
		monoLogo: cr
	},
	antigravity: {
		label: "Antigravity",
		color: "#3186ff",
		logo: ur,
		monoLogo: dr
	},
	default: {
		label: "Folio Agent",
		color: "#c79a45",
		logo: fr,
		monoLogo: fr
	}
};
function mr(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function hr() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function gr(e) {
	return (e ? new Date(e) : /* @__PURE__ */ new Date()).toLocaleTimeString("ko-KR", {
		hour: "2-digit",
		minute: "2-digit"
	});
}
function _r(e) {
	return e === "high" ? "높음" : e === "low" ? "낮음" : "중간";
}
function vr(e) {
	return `${Math.max(1, Math.round((Date.now() - e) / 1e3))}초`;
}
function yr(e) {
	let t = e?.provider && nr.has(e.provider) ? e.provider : e?.selectedAdapter || "";
	return e?.adapters?.find((e) => e.id === t) || null;
}
function br(e) {
	return pr[e?.provider && nr.has(e.provider) ? e.provider : e?.selectedAdapter || ""] || pr.default;
}
function xr(e) {
	return e?.modelChoices || [];
}
function Sr(e) {
	let t = xr(e);
	return t.length ? t.some((t) => t.value === e?.model) ? String(e?.model || "") : t[0].value : "";
}
async function Cr(e) {
	let t = e;
	for (; f(t.status);) await mr(1e3), t = await g(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "Agent 작업에 실패했습니다.");
	return t;
}
function wr({ surface: e, open: t, onOpen: n, onClose: r }) {
	let [i, a] = (0, c.useState)(null), [o, s] = (0, c.useState)(null), [l, u] = (0, c.useState)([rr]), [d, f] = (0, c.useState)(""), [p, m] = (0, c.useState)(""), [h, v] = (0, c.useState)("medium"), [y, b] = (0, c.useState)(!1), [S, C] = (0, c.useState)(""), w = (0, c.useRef)(null), D = (0, c.useRef)({ surface: e }), O = (0, c.useCallback)((e, t = !1) => {
		let n = yr(e);
		a(e), m((e) => {
			let r = Sr(n);
			return t && xr(n).some((t) => t.value === e) ? e : r;
		});
	}, []), k = (0, c.useCallback)(async (e = !1) => {
		let t = await g(`/api/agent-bridge/settings${e ? "?refresh=true" : ""}`);
		return O(t, !0), t;
	}, [O]), A = (0, c.useCallback)(async (e) => {
		try {
			let t = e?.provider && nr.has(e.provider) ? e.provider : "", n = t ? `?adapter=${encodeURIComponent(t)}` : "";
			s(await g(`/api/agent-bridge/preflight${n}`));
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
	(0, c.useEffect)(() => {
		let e = !0;
		return g("/api/agent-bridge/settings").then((t) => {
			e && (O(t), A(t));
		}).catch((t) => {
			e && C(t instanceof Error ? t.message : "Agent 설정을 불러오지 못했습니다.");
		}), () => {
			e = !1;
		};
	}, [O, A]), (0, c.useEffect)(() => {
		w.current && (w.current.scrollTop = w.current.scrollHeight);
	}, [l, t]), (0, c.useEffect)(() => {
		D.current = {
			...D.current,
			surface: e
		};
	}, [e]), (0, c.useEffect)(() => {
		let e = (e) => {
			let t = e.detail;
			t ? (O(t), A(t)) : k().then((e) => A(e)).catch((e) => C(e instanceof Error ? e.message : "Agent 설정을 불러오지 못했습니다."));
		};
		return window.addEventListener("folio:agent-settings-updated", e), () => window.removeEventListener("folio:agent-settings-updated", e);
	}, [
		O,
		k,
		A
	]);
	let j = yr(i), M = br(i), N = xr(j), P = (0, c.useMemo)(() => ({ "--react-agent-accent": M.color }), [M.color]), F = (o?.checks || []).filter((e) => !e.ok), I = (0, c.useCallback)(async (e, t = {}) => {
		let n = e.trim();
		if (!n || y) return;
		let r = {
			...D.current,
			...t
		};
		D.current = r;
		let i = hr(), a = Date.now(), o = new Date(a).toISOString(), s = j?.label || M.label, c = p || j?.model || "model";
		u((e) => [
			...e,
			{
				id: hr(),
				role: "user",
				text: n,
				createdAt: o
			},
			{
				id: i,
				role: "assistant",
				text: "",
				pending: !0,
				runState: "pending",
				runTitle: `${s} 세션 시작`,
				runMeta: `${c} · ${_r(h)} · on-request`,
				createdAt: o
			}
		]), f(""), b(!0), C("");
		try {
			let e = await Cr(await _("/api/agent/chat", {
				message: n,
				context: r,
				options: {
					model: p,
					effort: h
				}
			})), t = e.result || {};
			u((n) => n.map((n) => n.id === i ? {
				...n,
				text: t.reply || e.message || "Agent가 응답을 반환하지 않았습니다.",
				notice: t.notice,
				proposal: t.proposal || null,
				proposalStatus: t.proposal ? "pending" : "",
				pending: !1,
				runState: "done",
				runTitle: `${s} 응답`,
				runMeta: `${c} · ${_r(h)} · ${vr(a)}`
			} : n));
		} catch (e) {
			let t = e instanceof Error ? e.message : "Agent 요청에 실패했습니다.";
			C(t), u((e) => e.map((e) => e.id === i ? {
				...e,
				text: t,
				pending: !1,
				runState: "error",
				runTitle: `${s} 오류`,
				runMeta: `${c} · ${_r(h)}`
			} : e));
		} finally {
			b(!1);
		}
	}, [
		j?.label,
		j?.model,
		y,
		h,
		M.label,
		p
	]);
	(0, c.useEffect)(() => {
		let t = (t) => {
			let { message: n, prompt: r, autoSubmit: i, ...a } = t.detail || {};
			D.current = {
				...D.current,
				...a,
				surface: String(a.surface || e)
			};
			let o = String(n || r || "");
			o && (i ? I(o, a) : f(o));
		};
		return window.addEventListener("folio:react-agent-request", t), () => window.removeEventListener("folio:react-agent-request", t);
	}, [I, e]);
	async function L(e) {
		e.preventDefault(), await I(d);
	}
	function R() {
		u([{
			...rr,
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		}]), f(""), C("");
	}
	async function z(e) {
		if (m(e), !(!j?.id || !e)) try {
			let t = Object.fromEntries((i?.adapters || []).map((e) => [e.id, e.model || ""]));
			t[j.id] = e;
			let n = await _("/api/agent-bridge/settings", {
				provider: j.id,
				models: t
			});
			O(n, !0), window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: n }));
		} catch (e) {
			C(e instanceof Error ? e.message : "모델 설정 저장에 실패했습니다.");
		}
	}
	async function B(e, t, n) {
		try {
			let r = await _(`/api/agent/proposals/${encodeURIComponent(t)}`, { action: n });
			u((t) => t.map((t) => t.id === e ? {
				...t,
				proposalStatus: r.status || n
			} : t));
		} catch (e) {
			C(e instanceof Error ? e.message : "제안 처리에 실패했습니다.");
		}
	}
	return t ? /* @__PURE__ */ (0, x.jsxs)("aside", {
		className: "react-agent-dock",
		style: P,
		"aria-label": "AI Agent",
		children: [
			/* @__PURE__ */ (0, x.jsxs)("header", {
				className: "react-agent-dock-header",
				children: [/* @__PURE__ */ (0, x.jsxs)("div", {
					className: "react-agent-dock-title",
					children: [/* @__PURE__ */ (0, x.jsx)("span", {
						className: "react-agent-logo",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, x.jsx)("span", {
							className: "react-agent-logo-mark",
							dangerouslySetInnerHTML: { __html: M.logo }
						})
					}), /* @__PURE__ */ (0, x.jsxs)("div", { children: [/* @__PURE__ */ (0, x.jsx)("p", {
						className: "section-kicker",
						children: "Agent"
					}), /* @__PURE__ */ (0, x.jsx)("h2", { children: j?.label || M.label })] })]
				}), /* @__PURE__ */ (0, x.jsxs)("div", {
					className: "react-agent-header-actions",
					children: [/* @__PURE__ */ (0, x.jsx)("button", {
						className: "react-agent-new-chat",
						type: "button",
						onClick: R,
						children: "새 채팅"
					}), /* @__PURE__ */ (0, x.jsx)("button", {
						className: "icon-btn",
						type: "button",
						"aria-label": "AI Agent 닫기",
						"data-tooltip": "닫기",
						"data-tooltip-pos": "left",
						onClick: r,
						children: "×"
					})]
				})]
			}),
			/* @__PURE__ */ (0, x.jsxs)("div", {
				className: "react-agent-dock-body",
				ref: w,
				children: [
					/* @__PURE__ */ (0, x.jsx)("div", {
						className: "react-agent-watermark",
						"aria-hidden": "true",
						dangerouslySetInnerHTML: { __html: M.monoLogo }
					}),
					F.length > 0 && /* @__PURE__ */ (0, x.jsxs)("div", {
						className: "react-agent-preflight",
						role: "status",
						children: [/* @__PURE__ */ (0, x.jsx)("strong", { children: "Agent 준비 상태 확인 필요" }), F.slice(0, 3).map((e) => /* @__PURE__ */ (0, x.jsx)("p", { children: e.message }, e.id))]
					}),
					/* @__PURE__ */ (0, x.jsx)("div", {
						className: "react-agent-messages",
						children: l.map((e) => /* @__PURE__ */ (0, x.jsxs)("article", {
							className: `react-agent-message ${e.role}${e.pending ? " pending" : ""}`,
							children: [
								e.role === "assistant" && /* @__PURE__ */ (0, x.jsxs)("div", {
									className: "react-agent-message-head",
									children: [
										/* @__PURE__ */ (0, x.jsx)("span", {
											className: "react-agent-mini-logo",
											"aria-hidden": "true",
											dangerouslySetInnerHTML: { __html: M.logo }
										}),
										/* @__PURE__ */ (0, x.jsx)("strong", { children: j?.label || M.label }),
										/* @__PURE__ */ (0, x.jsx)("time", { children: gr(e.createdAt) })
									]
								}),
								e.runTitle && /* @__PURE__ */ (0, x.jsx)(E, {
									state: e.runState,
									title: e.runTitle,
									meta: e.runMeta
								}),
								e.text && /* @__PURE__ */ (0, x.jsx)("div", {
									className: e.variant === "welcome" ? "react-agent-welcome-card" : "",
									children: /* @__PURE__ */ (0, x.jsx)(T, { text: e.text })
								}),
								e.notice && /* @__PURE__ */ (0, x.jsx)("p", {
									className: "react-agent-notice",
									children: e.notice
								}),
								e.proposal && /* @__PURE__ */ (0, x.jsxs)("div", {
									className: "agent-proposal",
									children: [
										/* @__PURE__ */ (0, x.jsxs)("div", {
											className: "agent-proposal-title",
											children: [/* @__PURE__ */ (0, x.jsx)("strong", { children: e.proposal.artifactKind || "proposal" }), e.proposal.artifactId && /* @__PURE__ */ (0, x.jsx)("span", { children: e.proposal.artifactId })]
										}),
										e.proposal.summary && /* @__PURE__ */ (0, x.jsx)("p", { children: e.proposal.summary }),
										e.proposal.diff && /* @__PURE__ */ (0, x.jsxs)("details", {
											className: "agent-proposal-diff",
											children: [/* @__PURE__ */ (0, x.jsx)("summary", { children: "diff 보기" }), /* @__PURE__ */ (0, x.jsx)("pre", { children: e.proposal.diff })]
										}),
										e.proposalStatus === "pending" ? /* @__PURE__ */ (0, x.jsxs)("div", {
											className: "agent-actions",
											children: [/* @__PURE__ */ (0, x.jsx)("button", {
												type: "button",
												onClick: () => B(e.id, e.proposal.id, "approve"),
												children: "승인"
											}), /* @__PURE__ */ (0, x.jsx)("button", {
												type: "button",
												onClick: () => B(e.id, e.proposal.id, "reject"),
												children: "거절"
											})]
										}) : /* @__PURE__ */ (0, x.jsxs)("p", {
											className: "agent-proposal-status",
											children: ["상태: ", e.proposalStatus]
										})
									]
								})
							]
						}, e.id))
					})
				]
			}),
			/* @__PURE__ */ (0, x.jsxs)("form", {
				className: "react-agent-form",
				onSubmit: L,
				children: [
					/* @__PURE__ */ (0, x.jsx)("textarea", {
						value: d,
						onChange: (e) => f(e.currentTarget.value),
						onKeyDown: (e) => {
							e.key === "Enter" && !e.shiftKey && (e.preventDefault(), e.currentTarget.form?.requestSubmit());
						},
						rows: 2,
						placeholder: "현재 화면에 대해 물어보세요"
					}),
					/* @__PURE__ */ (0, x.jsxs)("div", {
						className: "react-agent-form-toolbar",
						children: [/* @__PURE__ */ (0, x.jsxs)("div", {
							className: "react-agent-tools",
							children: [/* @__PURE__ */ (0, x.jsx)("select", {
								value: p,
								onChange: (e) => z(e.currentTarget.value),
								"aria-label": "모델 버전",
								children: N.length ? N.map((e) => /* @__PURE__ */ (0, x.jsx)("option", {
									value: e.value,
									children: e.label
								}, e.value)) : /* @__PURE__ */ (0, x.jsx)("option", {
									value: "",
									children: "기본 버전"
								})
							}), /* @__PURE__ */ (0, x.jsxs)("select", {
								value: h,
								onChange: (e) => v(e.currentTarget.value),
								"aria-label": "노력 단계",
								children: [
									/* @__PURE__ */ (0, x.jsx)("option", {
										value: "low",
										children: "노력 낮음"
									}),
									/* @__PURE__ */ (0, x.jsx)("option", {
										value: "medium",
										children: "노력 중간"
									}),
									/* @__PURE__ */ (0, x.jsx)("option", {
										value: "high",
										children: "노력 높음"
									}),
									/* @__PURE__ */ (0, x.jsx)("option", {
										value: "max",
										children: "노력 최대"
									})
								]
							})]
						}), /* @__PURE__ */ (0, x.jsx)("button", {
							type: "submit",
							disabled: y || !d.trim(),
							children: y ? "작업 중" : "보내기"
						})]
					}),
					S && /* @__PURE__ */ (0, x.jsx)("p", {
						className: "react-agent-error",
						children: S
					})
				]
			})
		]
	}) : /* @__PURE__ */ (0, x.jsx)("aside", {
		className: "react-agent-dock is-closed",
		style: P,
		"aria-label": "AI Agent 닫힘",
		children: /* @__PURE__ */ (0, x.jsxs)("button", {
			type: "button",
			onClick: n,
			"aria-label": "AI Agent 열기",
			"data-tooltip": "AI Agent 열기",
			"data-tooltip-pos": "left",
			children: [/* @__PURE__ */ (0, x.jsx)("span", {
				className: "react-agent-closed-dot",
				"aria-hidden": "true"
			}), /* @__PURE__ */ (0, x.jsx)("span", { children: "AI" })]
		})
	});
}
//#endregion
//#region src/app/RssRoute.tsx
var Tr = {
	start: "",
	end: "",
	source: "",
	market: ""
}, Er = 20, Dr = [
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
		value: "GLOBAL",
		label: "글로벌"
	}
];
function Or(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function kr(e) {
	let t = e.timestamp || e.date || "";
	if (!t) return "시간 정보 없음";
	let n = new Date(t);
	return Number.isNaN(n.getTime()) ? t : n.toLocaleString("ko-KR");
}
function Ar(e) {
	let t = [
		e.start ? `${e.start} 이후` : "",
		e.end ? `${e.end} 이전` : "",
		e.source ? e.source : "",
		e.market ? Dr.find((t) => t.value === e.market)?.label || e.market : ""
	].filter(Boolean);
	return t.length ? t.join(" · ") : "전체 RSS 피드";
}
function jr(e, t) {
	let n = new URLSearchParams({
		offset: String((Math.max(1, e) - 1) * Er),
		limit: String(Er)
	});
	return t.start && n.set("start", t.start), t.end && n.set("end", t.end), t.source && n.set("source", t.source), t.market && n.set("market", t.market), n;
}
function Mr(e) {
	let t = e.markets, n = Array.isArray(t) ? t : typeof t == "string" ? t.split(",") : String(e.market || "").split(","), r = /* @__PURE__ */ new Set();
	return n.map((e) => String(e || "").trim()).filter(Boolean).filter((e) => r.has(e) ? !1 : (r.add(e), !0));
}
async function Nr(e) {
	let t = e;
	for (; f(t.status);) await Or(1e3), t = await g(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "RSS 수집 작업에 실패했습니다.");
	return t;
}
function Pr(e, t) {
	return e.url || `${e.title || "rss"}-${e.timestamp || e.date || t}`;
}
function Fr(e) {
	return {
		title: e.title || e.headline || e.path || "검색 결과",
		url: e.url || e.sourceUrl || e.link || "",
		description: e.summary || e.snippet || e.text || e.content || "",
		media: e.media || e.source || e.collector || "",
		source: e.source || e.media || e.collector || "",
		markets: Mr({
			markets: e.markets,
			market: String(e.market || "")
		}),
		market: String(e.market || ""),
		timestamp: e.timestamp || e.date || e.publishedAt || e.published || "",
		date: e.date || e.publishedAt || e.published || e.timestamp || ""
	};
}
function Ir() {
	let [e, t] = (0, c.useState)(null), [n, r] = (0, c.useState)(null), [i, a] = (0, c.useState)(1), [o, s] = (0, c.useState)(Tr), [l, u] = (0, c.useState)(Tr), [d, f] = (0, c.useState)(""), [p, m] = (0, c.useState)(!1), [h, y] = (0, c.useState)(!1), [b, S] = (0, c.useState)(!1), [C, w] = (0, c.useState)(""), [T, E] = (0, c.useState)(""), D = n?.items || [], O = n?.total ?? D.length, k = Math.max(1, Math.ceil(O / Er)), A = (0, c.useMemo)(() => n?.sources || [], [n?.sources]), j = (0, c.useCallback)(async (e = i, t = o) => {
		m(!0), w("");
		try {
			let n = await g(`/api/rss/items?${jr(e, t).toString()}`);
			r(n), a(e), s(t), u(t), v({
				surface: "rss",
				viewId: "rssfeed",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			w(e instanceof Error ? e.message : "RSS 피드를 불러오지 못했습니다.");
		} finally {
			m(!1);
		}
	}, [o, i]), M = (0, c.useCallback)(async () => {
		try {
			let e = await g("/api/dashboard"), n = e.index?.newsCount ?? e.index?.count;
			Number.isFinite(Number(n)) && t(Number(n));
		} catch {}
	}, []);
	(0, c.useEffect)(() => {
		j(1, o), M();
	}, []);
	async function N(e) {
		if (e.preventDefault(), l.start && l.end && l.start > l.end) {
			w("시작 시간은 종료 시간보다 앞서야 합니다.");
			return;
		}
		E(""), await j(1, l);
	}
	async function P(e) {
		E(""), await j(1, {
			...o,
			market: e
		});
	}
	async function F() {
		E(""), f(""), u(Tr), await j(1, Tr);
	}
	async function I(e) {
		e.preventDefault();
		let t = d.trim();
		if (!t) {
			w("검색어를 입력해 주세요.");
			return;
		}
		S(!0), w(""), E("");
		try {
			let e = await g(`/api/search?${new URLSearchParams({
				query: t,
				scope: "news",
				limit: "50"
			}).toString()}`), n = Array.isArray(e) ? e : e.items || [];
			r({
				items: n.map(Fr),
				total: n.length,
				offset: 0,
				limit: n.length,
				has_more: !1,
				sources: A
			}), a(1), E(`뉴스 검색 결과 ${n.length}개`), v({
				surface: "rss",
				viewId: "rssfeed",
				reportKind: "news_search",
				reportId: t
			});
		} catch (e) {
			w(e instanceof Error ? e.message : "뉴스 검색에 실패했습니다.");
		} finally {
			S(!1);
		}
	}
	async function L() {
		y(!0), w(""), E("RSS 수집 작업을 시작했습니다.");
		try {
			let e = await Nr(await _("/api/rssarchive/import", {})), t = Number.isFinite(Number(e.result?.added)) ? ` 신규 ${e.result?.added}개` : "";
			E(`RSS 수집 완료.${t}`), await j(1, o), await M();
		} catch (e) {
			w(e instanceof Error ? e.message : "RSS 수집에 실패했습니다."), E("");
		} finally {
			y(!1);
		}
	}
	let R = Math.min(Math.max(i, 1), k), z = Math.max(1, R - 2), B = Math.min(k, R + 2);
	return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "react-rss-route",
		"data-rss-route": !0,
		children: [
			/* @__PURE__ */ (0, x.jsx)(je, {
				eyebrow: "RSS Feed",
				title: "RSS 피드",
				description: "수집한 기사와 원천 자료를 시간, 출처, 키워드로 빠르게 훑습니다.",
				actions: /* @__PURE__ */ (0, x.jsxs)("div", {
					className: "react-rss-hero-actions",
					children: [
						/* @__PURE__ */ (0, x.jsxs)("span", {
							className: "react-rss-stat-pill",
							children: [/* @__PURE__ */ (0, x.jsx)("strong", { children: "LOADED" }), O > 0 ? `${O}개 · ${R}/${k}` : "0개"]
						}),
						/* @__PURE__ */ (0, x.jsxs)("span", {
							className: "react-rss-stat-pill",
							children: [/* @__PURE__ */ (0, x.jsx)("strong", { children: "INDEXED" }), e === null ? "…" : `${e}개 문서`]
						}),
						/* @__PURE__ */ (0, x.jsx)("button", {
							type: "button",
							onClick: L,
							disabled: h,
							children: h ? "수집 중" : "RSS 수집/가져오기"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, x.jsxs)("section", {
				className: "react-rss-control-panel react-rss-filter-panel",
				"aria-label": "RSS 필터",
				children: [/* @__PURE__ */ (0, x.jsxs)("div", {
					className: "react-rss-panel-head",
					children: [/* @__PURE__ */ (0, x.jsxs)("div", { children: [/* @__PURE__ */ (0, x.jsx)("h2", { children: "피드 필터" }), /* @__PURE__ */ (0, x.jsx)("p", { children: "시간 범위와 소스를 선택해 RSS 피드를 필터링합니다. 시간은 UTC+9 기준입니다." })] }), /* @__PURE__ */ (0, x.jsx)("button", {
						className: "react-rss-period-action",
						type: "button",
						onClick: F,
						disabled: p,
						children: "전체 기간"
					})]
				}), /* @__PURE__ */ (0, x.jsxs)("form", {
					className: "react-rss-filter-grid",
					onSubmit: N,
					children: [
						/* @__PURE__ */ (0, x.jsxs)("label", { children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "시작" }), /* @__PURE__ */ (0, x.jsx)("input", {
							type: "datetime-local",
							value: l.start,
							onChange: (e) => u((t) => ({
								...t,
								start: e.currentTarget.value
							}))
						})] }),
						/* @__PURE__ */ (0, x.jsxs)("label", { children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "종료" }), /* @__PURE__ */ (0, x.jsx)("input", {
							type: "datetime-local",
							value: l.end,
							onChange: (e) => u((t) => ({
								...t,
								end: e.currentTarget.value
							}))
						})] }),
						/* @__PURE__ */ (0, x.jsxs)("label", { children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "소스" }), /* @__PURE__ */ (0, x.jsxs)("select", {
							value: l.source,
							onChange: (e) => u((t) => ({
								...t,
								source: e.currentTarget.value
							})),
							children: [/* @__PURE__ */ (0, x.jsx)("option", {
								value: "",
								children: "전체 소스"
							}), A.map((e) => /* @__PURE__ */ (0, x.jsx)("option", {
								value: e,
								children: e
							}, e))]
						})] }),
						/* @__PURE__ */ (0, x.jsxs)("div", {
							className: "react-rss-filter-actions",
							children: [/* @__PURE__ */ (0, x.jsx)("button", {
								className: "react-rss-primary-action",
								type: "submit",
								disabled: p,
								children: "필터 적용"
							}), /* @__PURE__ */ (0, x.jsx)("button", {
								className: "react-rss-secondary-action",
								type: "button",
								onClick: F,
								disabled: p,
								children: "초기화"
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, x.jsxs)("section", {
				className: "react-rss-control-panel react-rss-search-panel",
				"aria-label": "뉴스 검색",
				children: [/* @__PURE__ */ (0, x.jsx)("div", {
					className: "react-rss-panel-head",
					children: /* @__PURE__ */ (0, x.jsxs)("div", { children: [/* @__PURE__ */ (0, x.jsx)("h2", { children: "뉴스 검색" }), /* @__PURE__ */ (0, x.jsx)("p", { children: "기업, 티커, 섹터, 시장 이슈 기준으로 RSS와 수동 저장 기사를 검색합니다." })] })
				}), /* @__PURE__ */ (0, x.jsxs)("form", {
					className: "react-rss-search-form",
					onSubmit: I,
					children: [/* @__PURE__ */ (0, x.jsx)("input", {
						type: "search",
						value: d,
						placeholder: "기업, 티커, 섹터 또는 이슈",
						onChange: (e) => f(e.currentTarget.value)
					}), /* @__PURE__ */ (0, x.jsx)("button", {
						className: "react-rss-primary-action",
						type: "submit",
						disabled: b,
						children: b ? "검색 중" : "검색"
					})]
				})]
			}),
			/* @__PURE__ */ (0, x.jsxs)("div", {
				className: "react-rss-summary",
				children: [/* @__PURE__ */ (0, x.jsx)("strong", { children: Ar(o) }), /* @__PURE__ */ (0, x.jsx)("span", { children: O > 0 ? `${O}개 · ${R}/${k}` : "0개" })]
			}),
			C && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "react-dashboard-error",
				children: C
			}),
			T && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "react-dashboard-warning",
				children: T
			}),
			/* @__PURE__ */ (0, x.jsx)("div", {
				className: "report-feed-outside-controls react-rss-market-controls",
				"aria-label": "RSS 표시 옵션",
				children: /* @__PURE__ */ (0, x.jsxs)("div", {
					className: "report-feed-view-row",
					children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "시장" }), /* @__PURE__ */ (0, x.jsx)("label", {
						className: "report-feed-view-pill",
						children: /* @__PURE__ */ (0, x.jsx)("select", {
							value: o.market,
							onChange: (e) => P(e.currentTarget.value),
							disabled: p,
							children: Dr.map((e) => /* @__PURE__ */ (0, x.jsx)("option", {
								value: e.value,
								children: e.label
							}, e.value || "all-market"))
						})
					})]
				})
			}),
			/* @__PURE__ */ (0, x.jsx)("section", {
				className: "react-rss-feed",
				"aria-label": "RSS feed items",
				children: D.length ? D.map((e, t) => {
					let n = Pr(e, t), r = String(e.description || "").trim(), i = Mr(e);
					return /* @__PURE__ */ (0, x.jsxs)("article", {
						className: "react-rss-card",
						children: [/* @__PURE__ */ (0, x.jsxs)("div", {
							className: "react-rss-card-main",
							children: [
								/* @__PURE__ */ (0, x.jsx)("h2", { children: e.url ? /* @__PURE__ */ (0, x.jsx)("a", {
									href: e.url,
									target: "_blank",
									rel: "noopener noreferrer",
									children: e.title || "제목 없음"
								}) : e.title || "제목 없음" }),
								/* @__PURE__ */ (0, x.jsxs)("div", {
									className: "react-rss-card-meta",
									children: [
										(e.media || e.source) && /* @__PURE__ */ (0, x.jsx)("span", {
											className: "pill",
											children: e.media || e.source
										}),
										i.length ? /* @__PURE__ */ (0, x.jsx)("span", {
											className: "pill",
											children: i.join(" · ")
										}) : null,
										/* @__PURE__ */ (0, x.jsx)("span", { children: kr(e) })
									]
								}),
								r && /* @__PURE__ */ (0, x.jsx)("p", { children: r })
							]
						}), /* @__PURE__ */ (0, x.jsx)("div", {
							className: "react-rss-card-actions",
							children: e.url && /* @__PURE__ */ (0, x.jsx)("a", {
								href: e.url,
								target: "_blank",
								rel: "noopener noreferrer",
								children: "기사 열기"
							})
						})]
					}, n);
				}) : /* @__PURE__ */ (0, x.jsxs)("article", {
					className: "react-dashboard-panel",
					children: [/* @__PURE__ */ (0, x.jsx)("h2", { children: p ? "불러오는 중" : "표시할 RSS 피드가 없습니다." }), /* @__PURE__ */ (0, x.jsx)("p", { children: p ? "수집된 항목을 확인하고 있습니다." : "RSS 수집을 실행하거나 필터를 초기화해 보세요." })]
				})
			}),
			k > 1 && /* @__PURE__ */ (0, x.jsxs)("nav", {
				className: "react-rss-pagination",
				"aria-label": "RSS pagination",
				children: [
					/* @__PURE__ */ (0, x.jsx)("button", {
						type: "button",
						disabled: R === 1 || p,
						onClick: () => j(R - 1, o),
						children: "이전"
					}),
					z > 1 && /* @__PURE__ */ (0, x.jsxs)(x.Fragment, { children: [/* @__PURE__ */ (0, x.jsx)("button", {
						type: "button",
						onClick: () => j(1, o),
						children: "1"
					}), z > 2 && /* @__PURE__ */ (0, x.jsx)("span", { children: "..." })] }),
					Array.from({ length: B - z + 1 }, (e, t) => z + t).map((e) => /* @__PURE__ */ (0, x.jsx)("button", {
						type: "button",
						className: e === R ? "active" : "",
						disabled: p,
						onClick: () => j(e, o),
						children: e
					}, e)),
					B < k && /* @__PURE__ */ (0, x.jsxs)(x.Fragment, { children: [B < k - 1 && /* @__PURE__ */ (0, x.jsx)("span", { children: "..." }), /* @__PURE__ */ (0, x.jsx)("button", {
						type: "button",
						onClick: () => j(k, o),
						children: k
					})] }),
					/* @__PURE__ */ (0, x.jsx)("button", {
						type: "button",
						disabled: R === k || p,
						onClick: () => j(R + 1, o),
						children: "다음"
					})
				]
			})
		]
	});
}
//#endregion
//#region src/app/SettingsRoute.tsx
var Lr = [
	"openai",
	"gemini",
	"claude"
], Rr = {
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
function zr(e) {
	return Lr.includes(e) ? e : "openai";
}
function Br(e, t, n, r) {
	return e ? `${r} 저장됨: ${t || "저장됨"}` : n;
}
function Vr(e) {
	return e.bridgeSupported === !1 ? "지원 안 됨" : e.installed ? e.authenticated || e.available ? "사용 가능" : "로그인 필요" : "미설치";
}
function Hr(e) {
	return e.bridgeSupported === !1 ? "warn" : e.authenticated || e.available ? "ready" : e.installed ? "warn" : "";
}
function Ur({ checked: e, onChange: t, label: n, compact: r = !1 }) {
	return /* @__PURE__ */ (0, x.jsxs)("label", {
		className: `settings-switch${r ? " settings-switch-compact" : ""}${e ? " is-on" : ""}`,
		children: [
			/* @__PURE__ */ (0, x.jsx)("input", {
				checked: e,
				onChange: (e) => t(e.currentTarget.checked),
				type: "checkbox"
			}),
			/* @__PURE__ */ (0, x.jsx)("span", {
				className: "settings-switch-track",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, x.jsx)("span", { className: "settings-switch-thumb" })
			}),
			n ? /* @__PURE__ */ (0, x.jsxs)("span", {
				className: "settings-switch-copy",
				children: [/* @__PURE__ */ (0, x.jsx)("strong", { children: n }), /* @__PURE__ */ (0, x.jsx)("small", { children: e ? "ON" : "OFF" })]
			}) : /* @__PURE__ */ (0, x.jsx)("span", {
				className: "settings-switch-state",
				"aria-hidden": "true",
				children: e ? "ON" : "OFF"
			})
		]
	});
}
function Wr(e) {
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
			runPrerequisites: !!e.briefing?.runPrerequisites
		}
	};
}
function Gr() {
	let [e, t] = (0, c.useState)("integrations"), [n, r] = (0, c.useState)(null), [i, a] = (0, c.useState)(null), [o, s] = (0, c.useState)({}), [l, u] = (0, c.useState)({}), [d, f] = (0, c.useState)(null), [p, m] = (0, c.useState)("openai"), [h, y] = (0, c.useState)(""), [b, S] = (0, c.useState)(""), [C, w] = (0, c.useState)(!0), [T, E] = (0, c.useState)("cli"), [D, O] = (0, c.useState)("codex"), [k, A] = (0, c.useState)(""), [j, M] = (0, c.useState)({
		fred: "",
		bok: "",
		dart: ""
	}), [N, P] = (0, c.useState)({
		token: "",
		dbId: ""
	}), [F, I] = (0, c.useState)(""), [L, R] = (0, c.useState)({}), [z, B] = (0, c.useState)(""), [V, H] = (0, c.useState)(""), [U, W] = (0, c.useState)(""), ee = n?.llm?.providers || {}, te = ee[p] || {}, ne = Rr[p], re = te.modelChoices || [], ie = i?.adapters || [], ae = (ie.find((e) => e.id === D) || ie[0])?.modelChoices || [], oe = (0, c.useCallback)(async (e = !1) => {
		W(""), H("load");
		try {
			let [t, n, i, o] = await Promise.all([
				g(`/api/settings${e ? "?refresh=true" : ""}`),
				g(`/api/agent-bridge/settings${e ? "?refresh=true" : ""}`),
				g("/api/automation/settings"),
				g("/api/obsidian/settings")
			]);
			r(t), w(t.agent?.enabled !== !1), E(t.agent?.mode === "api" ? "api" : "cli");
			let c = zr(t.llm?.provider);
			m(c);
			let l = t.llm?.providers?.[c] || {}, d = l.modelChoices || [];
			S(d.some((e) => e.value === l.model) ? String(l.model || "") : d[0]?.value || ""), P({
				token: "",
				dbId: t.notion?.dbId || ""
			}), a(n);
			let f = [
				"codex",
				"claude",
				"antigravity"
			].includes(n.provider || "") ? String(n.provider) : String(n.selectedAdapter || n.adapters?.[0]?.id || "codex"), p = n.adapters?.find((e) => e.id === f) || n.adapters?.[0];
			O(f);
			let h = p?.modelChoices || [];
			A(h.some((e) => e.value === p?.model) ? String(p?.model || "") : h[0]?.value || ""), window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: n })), s(Wr(i)), u(o), I(o.vaultPath || ""), v({
				surface: "settings",
				viewId: "settings",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			W(e instanceof Error ? e.message : "설정을 불러오지 못했습니다.");
		} finally {
			H("");
		}
	}, []), se = (0, c.useCallback)(async () => {
		H("cache"), W("");
		try {
			let e = await g("/api/cache/stats");
			f(e), B("캐시 상태를 불러왔습니다.");
		} catch (e) {
			W(e instanceof Error ? e.message : "캐시 상태를 불러오지 못했습니다.");
		} finally {
			H("");
		}
	}, []);
	async function ce() {
		H("cache-cleanup"), W(""), B("오래된 기업 데이터 캐시를 정리하는 중입니다.");
		try {
			let e = await _("/api/cache/cleanup", {}), t = await g("/api/cache/stats");
			f(t), B(`캐시 정리 완료: ${e.deleted || 0}개 삭제, ${e.freed_mb || 0}MB 확보`);
		} catch (e) {
			W(e instanceof Error ? e.message : "캐시 정리에 실패했습니다.");
		} finally {
			H("");
		}
	}
	(0, c.useEffect)(() => {
		oe();
	}, [oe]), (0, c.useEffect)(() => {
		let e = ee[p] || {}, t = e.modelChoices || [];
		S((n) => t.some((e) => e.value === n) ? n : t.some((t) => t.value === e.model) ? String(e.model || "") : t[0]?.value || ""), y("");
	}, [p, ee]), (0, c.useEffect)(() => {
		let e = ie.find((e) => e.id === D) || ie[0], t = e?.modelChoices || [];
		A((n) => t.some((e) => e.value === n) ? n : t.some((t) => t.value === e?.model) ? String(e?.model || "") : t[0]?.value || "");
	}, [D, ie]);
	async function le() {
		H("agent"), B("AI Agent 설정을 저장하는 중입니다.");
		try {
			let e = Object.fromEntries(ie.map((e) => [e.id, e.model || ""]));
			e[D] = k;
			let [t, n] = await Promise.all([_("/api/agent-bridge/settings", {
				provider: D,
				models: e
			}), _("/api/settings", {
				agent: {
					enabled: C,
					mode: T
				},
				llm: {
					provider: p,
					providers: { [p]: {
						apiKey: h.trim(),
						model: b
					} }
				}
			})]);
			a(t), r(n), y(""), R((e) => {
				let t = { ...e };
				return delete t[p], t;
			}), window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: t })), B(C ? `AI Agent를 ${T === "cli" ? "LLM CLI" : "LLM API"} 모드로 저장했습니다.` : "AI Agent 생성을 비활성화했습니다.");
		} catch (e) {
			W(e instanceof Error ? e.message : "AI Agent 설정 저장에 실패했습니다.");
		} finally {
			H("");
		}
	}
	async function ue(e) {
		R((t) => ({
			...t,
			[e]: { checking: !0 }
		}));
		try {
			let t = await _(`/api/settings/llm/test/${encodeURIComponent(e)}`, {});
			R((n) => ({
				...n,
				[e]: t
			}));
		} catch (t) {
			R((n) => ({
				...n,
				[e]: {
					status: "network_error",
					available: !1,
					message: t instanceof Error ? t.message : "연결 확인 실패"
				}
			}));
		}
	}
	async function de() {
		H("api"), B("외부 데이터 API 설정을 저장하는 중입니다.");
		try {
			let e = await _("/api/settings", {
				fred: { apiKey: j.fred.trim() },
				bok: { apiKey: j.bok.trim() },
				dart: { apiKey: j.dart.trim() }
			});
			r(e), M({
				fred: "",
				bok: "",
				dart: ""
			}), B("외부 데이터 API 설정을 저장했습니다.");
		} catch (e) {
			W(e instanceof Error ? e.message : "API 설정 저장에 실패했습니다.");
		} finally {
			H("");
		}
	}
	async function fe() {
		H("notion"), B("Notion 설정을 저장하는 중입니다.");
		try {
			let e = await _("/api/settings", { notion: {
				token: N.token.trim(),
				dbId: N.dbId.trim()
			} });
			r(e), P({
				token: "",
				dbId: e.notion?.dbId || ""
			}), B("Notion 설정을 저장했습니다.");
		} catch (e) {
			W(e instanceof Error ? e.message : "Notion 설정 저장에 실패했습니다.");
		} finally {
			H("");
		}
	}
	async function pe() {
		H("obsidian"), B("Obsidian 경로를 저장하는 중입니다.");
		try {
			let e = await _("/api/obsidian/settings", { vaultPath: F.trim() });
			u(e), I(e.vaultPath || F), B(e.vaultPath ? "Obsidian 경로를 저장했습니다." : "Vault 경로를 입력하세요.");
		} catch (e) {
			W(e instanceof Error ? e.message : "Obsidian 설정 저장에 실패했습니다.");
		} finally {
			H("");
		}
	}
	async function me() {
		H("automation"), B("자동화 설정을 저장하는 중입니다.");
		try {
			let e = await _("/api/automation/settings", Wr(o));
			s(Wr(e)), B("자동화 설정을 저장했습니다.");
		} catch (e) {
			W(e instanceof Error ? e.message : "자동화 설정 저장에 실패했습니다.");
		} finally {
			H("");
		}
	}
	let he = (0, c.useMemo)(() => Lr.map((e) => {
		let t = ee[e] || {}, n = L[e], r = n?.checking;
		return {
			providerId: e,
			row: t,
			label: r ? "확인 중" : n?.available ? "사용 가능" : n ? "확인 실패" : t.hasApiKey ? "확인 필요" : "키 없음",
			className: n?.available ? "ready" : r || n ? "warn" : "",
			detail: n?.message || `${t.model || "모델 미설정"} · ${t.hasApiKey ? "저장된 키가 있습니다." : "API Key를 저장하세요."}`
		};
	}), [L, ee]);
	return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "react-settings-route",
		"data-settings-route": !0,
		children: [
			/* @__PURE__ */ (0, x.jsx)(je, {
				eyebrow: "Settings",
				title: "설정",
				description: "LLM, 외부 데이터, 내보내기, 자동화 설정을 관리합니다.",
				actions: /* @__PURE__ */ (0, x.jsx)("button", {
					className: "filter-btn clear",
					type: "button",
					onClick: () => oe(!0),
					disabled: V === "load",
					children: V === "load" ? "불러오는 중" : "새로고침"
				})
			}),
			/* @__PURE__ */ (0, x.jsxs)("nav", {
				className: "sub-tabs",
				"aria-label": "설정 하위 탭",
				children: [/* @__PURE__ */ (0, x.jsx)("button", {
					className: e === "integrations" ? "active" : "",
					type: "button",
					onClick: () => t("integrations"),
					children: "연동"
				}), /* @__PURE__ */ (0, x.jsx)("button", {
					className: e === "admin" ? "active" : "",
					type: "button",
					onClick: () => t("admin"),
					children: "관리"
				})]
			}),
			U && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "react-dashboard-error",
				children: U
			}),
			z && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "react-dashboard-warning",
				children: z
			}),
			e === "integrations" ? /* @__PURE__ */ (0, x.jsxs)("div", {
				id: "settings-integrations",
				className: "sub-tab-panel active",
				children: [
					/* @__PURE__ */ (0, x.jsxs)("section", {
						className: "settings-panel input-panel",
						children: [
							/* @__PURE__ */ (0, x.jsx)("div", {
								className: "input-panel-header settings-agent-header",
								children: /* @__PURE__ */ (0, x.jsxs)("div", { children: [/* @__PURE__ */ (0, x.jsx)("h3", { children: "AI Agent 설정" }), /* @__PURE__ */ (0, x.jsx)("p", { children: "보고서와 시장 내러티브 생성에 사용할 Agent 경로를 선택합니다. 비활성화하면 규칙 기반으로 생성합니다." })] })
							}),
							/* @__PURE__ */ (0, x.jsx)("div", {
								className: "settings-grid",
								children: /* @__PURE__ */ (0, x.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "실행 방식" }), /* @__PURE__ */ (0, x.jsxs)("div", {
										className: "settings-agent-mode-row",
										children: [/* @__PURE__ */ (0, x.jsx)(Ur, {
											checked: C,
											onChange: w,
											compact: !0
										}), /* @__PURE__ */ (0, x.jsxs)("div", {
											className: "settings-segmented",
											"aria-label": "AI Agent 실행 방식",
											"data-mode": T,
											children: [/* @__PURE__ */ (0, x.jsx)("button", {
												className: T === "cli" ? "active" : "",
												type: "button",
												onClick: () => E("cli"),
												children: "LLM CLI"
											}), /* @__PURE__ */ (0, x.jsx)("button", {
												className: T === "api" ? "active" : "",
												type: "button",
												onClick: () => E("api"),
												children: "LLM API"
											})]
										})]
									})]
								})
							}),
							/* @__PURE__ */ (0, x.jsx)("fieldset", {
								className: "settings-agent-controls",
								disabled: !C,
								children: T === "cli" ? /* @__PURE__ */ (0, x.jsxs)(x.Fragment, { children: [/* @__PURE__ */ (0, x.jsxs)("div", {
									className: "settings-grid",
									children: [/* @__PURE__ */ (0, x.jsxs)("label", {
										className: "field",
										children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "사용할 CLI" }), /* @__PURE__ */ (0, x.jsx)("select", {
											value: D,
											onChange: (e) => O(e.currentTarget.value),
											children: (ie.length ? ie : [
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
											]).map((e) => /* @__PURE__ */ (0, x.jsx)("option", {
												value: e.id,
												children: e.label || e.id
											}, e.id))
										})]
									}), /* @__PURE__ */ (0, x.jsxs)("label", {
										className: "field",
										children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "모델" }), /* @__PURE__ */ (0, x.jsx)("select", {
											value: k,
											onChange: (e) => A(e.currentTarget.value),
											children: ae.length ? ae.map((e) => /* @__PURE__ */ (0, x.jsx)("option", {
												value: e.value,
												children: e.label
											}, e.value)) : /* @__PURE__ */ (0, x.jsx)("option", {
												value: "",
												children: "모델 목록 없음"
											})
										})]
									})]
								}), /* @__PURE__ */ (0, x.jsx)("div", {
									className: "cli-provider-list",
									"aria-live": "polite",
									children: ie.map((e) => /* @__PURE__ */ (0, x.jsxs)("div", {
										className: "cli-provider-row",
										children: [/* @__PURE__ */ (0, x.jsxs)("div", {
											className: "cli-provider-main",
											children: [/* @__PURE__ */ (0, x.jsxs)("div", {
												className: "cli-provider-head",
												children: [/* @__PURE__ */ (0, x.jsx)("strong", { children: e.label || e.id }), /* @__PURE__ */ (0, x.jsx)("span", {
													className: `cli-status-chip ${Hr(e)}`,
													children: Vr(e)
												})]
											}), /* @__PURE__ */ (0, x.jsx)("div", {
												className: "cli-provider-meta",
												children: e.bridgeSupported === !1 ? e.error || "현재 환경에서 사용할 수 없습니다." : e.model || "모델 미설정"
											})]
										}), e.docsUrl && /* @__PURE__ */ (0, x.jsx)("a", {
											className: "filter-btn",
											href: e.docsUrl,
											target: "_blank",
											rel: "noreferrer",
											children: "문서"
										})]
									}, e.id))
								})] }) : /* @__PURE__ */ (0, x.jsxs)(x.Fragment, { children: [
									/* @__PURE__ */ (0, x.jsxs)("label", {
										className: "field",
										children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "API 제공자" }), /* @__PURE__ */ (0, x.jsxs)("select", {
											value: p,
											onChange: (e) => m(zr(e.currentTarget.value)),
											children: [
												/* @__PURE__ */ (0, x.jsx)("option", {
													value: "openai",
													children: "GPT / OpenAI"
												}),
												/* @__PURE__ */ (0, x.jsx)("option", {
													value: "gemini",
													children: "Gemini / Google"
												}),
												/* @__PURE__ */ (0, x.jsx)("option", {
													value: "claude",
													children: "Claude / Anthropic"
												})
											]
										})]
									}),
									/* @__PURE__ */ (0, x.jsxs)("div", {
										className: "settings-grid",
										children: [/* @__PURE__ */ (0, x.jsxs)("label", {
											className: "field",
											children: [/* @__PURE__ */ (0, x.jsxs)("span", { children: [ne.name, " API Key"] }), /* @__PURE__ */ (0, x.jsx)("input", {
												value: h,
												onChange: (e) => y(e.currentTarget.value),
												type: "password",
												autoComplete: "off",
												placeholder: te.hasApiKey ? `${te.apiKeyMasked} 저장됨` : ne.key
											})]
										}), /* @__PURE__ */ (0, x.jsxs)("label", {
											className: "field",
											children: [/* @__PURE__ */ (0, x.jsxs)("span", { children: [ne.name, " Model"] }), /* @__PURE__ */ (0, x.jsx)("select", {
												value: b,
												onChange: (e) => S(e.currentTarget.value),
												children: re.length ? re.map((e) => /* @__PURE__ */ (0, x.jsx)("option", {
													value: e.value,
													children: e.label
												}, e.value)) : /* @__PURE__ */ (0, x.jsx)("option", {
													value: "",
													children: "모델 목록 없음"
												})
											})]
										})]
									}),
									/* @__PURE__ */ (0, x.jsx)("div", {
										className: "cli-provider-list",
										"aria-live": "polite",
										children: he.map(({ providerId: e, row: t, label: n, className: r, detail: i }) => /* @__PURE__ */ (0, x.jsxs)("div", {
											className: "cli-provider-row",
											children: [/* @__PURE__ */ (0, x.jsxs)("div", {
												className: "cli-provider-main",
												children: [/* @__PURE__ */ (0, x.jsxs)("div", {
													className: "cli-provider-head",
													children: [/* @__PURE__ */ (0, x.jsx)("strong", { children: t.label || Rr[e].name }), /* @__PURE__ */ (0, x.jsx)("span", {
														className: `cli-status-chip ${r}`,
														children: n
													})]
												}), /* @__PURE__ */ (0, x.jsx)("div", {
													className: "cli-provider-meta",
													children: i
												})]
											}), /* @__PURE__ */ (0, x.jsxs)("div", {
												className: "cli-provider-actions",
												children: [/* @__PURE__ */ (0, x.jsx)("button", {
													className: "filter-btn",
													type: "button",
													disabled: !t.hasApiKey || !!L[e]?.checking,
													onClick: () => ue(e),
													children: "연결 확인"
												}), t.setupUrl && /* @__PURE__ */ (0, x.jsx)("a", {
													className: "filter-btn",
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
							/* @__PURE__ */ (0, x.jsxs)("div", {
								className: "filter-actions settings-actions",
								children: [/* @__PURE__ */ (0, x.jsx)("button", {
									className: "filter-btn apply",
									type: "button",
									onClick: le,
									disabled: V === "agent",
									children: "AI Agent 설정 저장"
								}), /* @__PURE__ */ (0, x.jsx)("button", {
									className: "filter-btn clear",
									type: "button",
									onClick: () => oe(!0),
									disabled: V === "load",
									children: "모델/상태 새로고침"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, x.jsxs)("section", {
						className: "settings-panel input-panel",
						children: [
							/* @__PURE__ */ (0, x.jsxs)("div", {
								className: "input-panel-header",
								children: [/* @__PURE__ */ (0, x.jsx)("h3", { children: "API 연동" }), /* @__PURE__ */ (0, x.jsx)("p", { children: "외부 데이터 API 키를 설정합니다." })]
							}),
							/* @__PURE__ */ (0, x.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, x.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "FRED API Key" }), /* @__PURE__ */ (0, x.jsx)("input", {
										value: j.fred,
										onChange: (e) => M({
											...j,
											fred: e.currentTarget.value
										}),
										type: "password",
										autoComplete: "off",
										placeholder: n?.fred?.hasApiKey ? `${n.fred.apiKeyMasked} 저장됨` : "FRED API 키"
									})]
								}), /* @__PURE__ */ (0, x.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "FRED 상태" }), /* @__PURE__ */ (0, x.jsx)("p", {
										className: "section-subtitle",
										children: Br(n?.fred?.hasApiKey, n?.fred?.apiKeyMasked, "딥 리서치 미국 경제지표용 FRED API 키가 없습니다.", "FRED API 키")
									})]
								})]
							}),
							/* @__PURE__ */ (0, x.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, x.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "BOK API Key" }), /* @__PURE__ */ (0, x.jsx)("input", {
										value: j.bok,
										onChange: (e) => M({
											...j,
											bok: e.currentTarget.value
										}),
										type: "password",
										autoComplete: "off",
										placeholder: n?.bok?.hasApiKey ? `${n.bok.apiKeyMasked} 저장됨` : "BOK ECOS API 키"
									})]
								}), /* @__PURE__ */ (0, x.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "BOK 상태" }), /* @__PURE__ */ (0, x.jsx)("p", {
										className: "section-subtitle",
										children: Br(n?.bok?.hasApiKey, n?.bok?.apiKeyMasked, "딥 리서치 한국 경제지표용 BOK API 키가 없습니다.", "BOK API 키")
									})]
								})]
							}),
							/* @__PURE__ */ (0, x.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, x.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "DART API Key" }), /* @__PURE__ */ (0, x.jsx)("input", {
										value: j.dart,
										onChange: (e) => M({
											...j,
											dart: e.currentTarget.value
										}),
										type: "password",
										autoComplete: "off",
										placeholder: n?.dart?.hasApiKey ? `${n.dart.apiKeyMasked} 저장됨` : "OpenDART API 키"
									})]
								}), /* @__PURE__ */ (0, x.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "DART 상태" }), /* @__PURE__ */ (0, x.jsx)("p", {
										className: "section-subtitle",
										children: Br(n?.dart?.hasApiKey, n?.dart?.apiKeyMasked, "국내 기업 분석용 DART API 키가 없습니다.", "DART API 키")
									})]
								})]
							}),
							/* @__PURE__ */ (0, x.jsx)("div", {
								className: "filter-actions settings-actions",
								children: /* @__PURE__ */ (0, x.jsx)("button", {
									className: "filter-btn apply",
									type: "button",
									onClick: de,
									disabled: V === "api",
									children: "API 설정 저장"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, x.jsxs)("section", {
						className: "settings-panel input-panel",
						children: [
							/* @__PURE__ */ (0, x.jsxs)("div", {
								className: "input-panel-header",
								children: [/* @__PURE__ */ (0, x.jsx)("h3", { children: "Notion 연동" }), /* @__PURE__ */ (0, x.jsx)("p", { children: "브리핑과 보고서를 Notion 데이터베이스로 내보냅니다." })]
							}),
							/* @__PURE__ */ (0, x.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, x.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "Notion 통합 토큰" }), /* @__PURE__ */ (0, x.jsx)("input", {
										value: N.token,
										onChange: (e) => P({
											...N,
											token: e.currentTarget.value
										}),
										type: "password",
										autoComplete: "off",
										placeholder: n?.notion?.hasToken ? `${n.notion.tokenMasked} 저장됨` : "ntn_..."
									})]
								}), /* @__PURE__ */ (0, x.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "토큰 상태" }), /* @__PURE__ */ (0, x.jsx)("p", {
										className: "section-subtitle",
										children: n?.notion?.hasToken ? `토큰 저장됨: ${n.notion.tokenMasked}` : "Notion 통합 토큰이 없습니다."
									})]
								})]
							}),
							/* @__PURE__ */ (0, x.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, x.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "데이터베이스 ID" }), /* @__PURE__ */ (0, x.jsx)("input", {
										value: N.dbId,
										onChange: (e) => P({
											...N,
											dbId: e.currentTarget.value
										}),
										placeholder: "32자리 Database ID"
									})]
								}), /* @__PURE__ */ (0, x.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "DB 상태" }), /* @__PURE__ */ (0, x.jsx)("p", {
										className: "section-subtitle",
										children: n?.notion?.hasDb ? `DB 저장됨: ${n.notion.dbIdMasked}` : "Notion 데이터베이스 ID가 없습니다."
									})]
								})]
							}),
							/* @__PURE__ */ (0, x.jsx)("div", {
								className: "filter-actions settings-actions",
								children: /* @__PURE__ */ (0, x.jsx)("button", {
									className: "filter-btn apply",
									type: "button",
									onClick: fe,
									disabled: V === "notion",
									children: "Notion 설정 저장"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, x.jsxs)("section", {
						className: "settings-panel input-panel",
						children: [
							/* @__PURE__ */ (0, x.jsxs)("div", {
								className: "input-panel-header",
								children: [/* @__PURE__ */ (0, x.jsx)("h3", { children: "Obsidian 연동" }), /* @__PURE__ */ (0, x.jsx)("p", { children: "원하면 Obsidian Vault로 보고서와 노트를 내보낼 수 있습니다." })]
							}),
							/* @__PURE__ */ (0, x.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, x.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "Vault 폴더 경로" }), /* @__PURE__ */ (0, x.jsx)("input", {
										value: F,
										onChange: (e) => I(e.currentTarget.value),
										type: "text",
										placeholder: "C:\\Users\\username\\Documents\\MyVault"
									})]
								}), /* @__PURE__ */ (0, x.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "경로 상태" }), /* @__PURE__ */ (0, x.jsx)("p", {
										className: "section-subtitle",
										children: l.vaultPath ? `설정됨: ${l.vaultPath}` : "Vault 경로가 설정되지 않았습니다."
									})]
								})]
							}),
							/* @__PURE__ */ (0, x.jsx)("div", {
								className: "filter-actions settings-actions",
								children: /* @__PURE__ */ (0, x.jsx)("button", {
									className: "filter-btn apply",
									type: "button",
									onClick: pe,
									disabled: V === "obsidian",
									children: "Obsidian 설정 저장"
								})
							})
						]
					})
				]
			}) : /* @__PURE__ */ (0, x.jsxs)("div", {
				id: "settings-admin",
				className: "sub-tab-panel active",
				children: [/* @__PURE__ */ (0, x.jsxs)("section", {
					className: "settings-panel input-panel",
					children: [
						/* @__PURE__ */ (0, x.jsxs)("div", {
							className: "input-panel-header",
							children: [/* @__PURE__ */ (0, x.jsx)("h3", { children: "자동화" }), /* @__PURE__ */ (0, x.jsx)("p", { children: "수집, 중기 시장 정리, 브리핑 생성을 각각 독립 루틴으로 관리합니다." })]
						}),
						/* @__PURE__ */ (0, x.jsxs)("div", {
							className: "automation-routines",
							children: [
								/* @__PURE__ */ (0, x.jsxs)("section", {
									className: "automation-card",
									children: [
										/* @__PURE__ */ (0, x.jsxs)("div", {
											className: "automation-card-head",
											children: [/* @__PURE__ */ (0, x.jsxs)("div", { children: [
												/* @__PURE__ */ (0, x.jsx)("span", { children: "RSS Collection" }),
												/* @__PURE__ */ (0, x.jsx)("strong", { children: "RSS 수집" }),
												/* @__PURE__ */ (0, x.jsx)("p", { children: "뉴스 피드를 정해진 간격으로 가져와 research inbox와 인덱스에 반영합니다." })
											] }), /* @__PURE__ */ (0, x.jsx)(Ur, {
												checked: !!o.rss?.enabled,
												onChange: (e) => s({
													...o,
													rss: {
														...o.rss,
														enabled: e
													}
												}),
												compact: !0
											})]
										}),
										/* @__PURE__ */ (0, x.jsxs)("label", {
											className: "field",
											children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "수집 간격" }), /* @__PURE__ */ (0, x.jsxs)("select", {
												value: String(o.rss?.intervalMinutes || 60),
												onChange: (e) => s({
													...o,
													rss: {
														...o.rss,
														intervalMinutes: e.currentTarget.value
													}
												}),
												children: [
													/* @__PURE__ */ (0, x.jsx)("option", {
														value: "15",
														children: "15분마다"
													}),
													/* @__PURE__ */ (0, x.jsx)("option", {
														value: "30",
														children: "30분마다"
													}),
													/* @__PURE__ */ (0, x.jsx)("option", {
														value: "60",
														children: "1시간마다"
													}),
													/* @__PURE__ */ (0, x.jsx)("option", {
														value: "180",
														children: "3시간마다"
													})
												]
											})]
										}),
										/* @__PURE__ */ (0, x.jsxs)("div", {
											className: "automation-inline-switch",
											children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "기사 전문 저장 (무료 공개 본문만, 로컬 보관용)" }), /* @__PURE__ */ (0, x.jsx)(Ur, {
												checked: o.rss?.saveFullText !== !1,
												onChange: (e) => s({
													...o,
													rss: {
														...o.rss,
														saveFullText: e
													}
												}),
												compact: !0
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, x.jsxs)("section", {
									className: "automation-card",
									children: [
										/* @__PURE__ */ (0, x.jsxs)("div", {
											className: "automation-card-head",
											children: [/* @__PURE__ */ (0, x.jsxs)("div", { children: [
												/* @__PURE__ */ (0, x.jsx)("span", { children: "Market Memory" }),
												/* @__PURE__ */ (0, x.jsx)("strong", { children: "시장 메모리 업데이트" }),
												/* @__PURE__ */ (0, x.jsx)("p", { children: "최근 RSS와 시장 자료를 중기 시장 판단용 컨텍스트로 정리합니다." })
											] }), /* @__PURE__ */ (0, x.jsx)(Ur, {
												checked: !!o.marketMemory?.enabled,
												onChange: (e) => s({
													...o,
													marketMemory: {
														...o.marketMemory,
														enabled: e
													}
												}),
												compact: !0
											})]
										}),
										/* @__PURE__ */ (0, x.jsxs)("label", {
											className: "field",
											children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "정리 간격" }), /* @__PURE__ */ (0, x.jsxs)("select", {
												value: String(o.marketMemory?.intervalMinutes || 1440),
												onChange: (e) => s({
													...o,
													marketMemory: {
														...o.marketMemory,
														intervalMinutes: e.currentTarget.value
													}
												}),
												children: [
													/* @__PURE__ */ (0, x.jsx)("option", {
														value: "720",
														children: "12시간마다"
													}),
													/* @__PURE__ */ (0, x.jsx)("option", {
														value: "1440",
														children: "하루마다"
													}),
													/* @__PURE__ */ (0, x.jsx)("option", {
														value: "2880",
														children: "이틀마다"
													}),
													/* @__PURE__ */ (0, x.jsx)("option", {
														value: "10080",
														children: "일주일마다"
													})
												]
											})]
										}),
										/* @__PURE__ */ (0, x.jsxs)("div", {
											className: "automation-inline-switch",
											children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "RSS 수집 직후에도 정리" }), /* @__PURE__ */ (0, x.jsx)(Ur, {
												checked: !!o.marketMemory?.runAfterRss,
												onChange: (e) => s({
													...o,
													marketMemory: {
														...o.marketMemory,
														runAfterRss: e
													}
												}),
												compact: !0
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, x.jsxs)("section", {
									className: "automation-card",
									children: [
										/* @__PURE__ */ (0, x.jsxs)("div", {
											className: "automation-card-head",
											children: [/* @__PURE__ */ (0, x.jsxs)("div", { children: [
												/* @__PURE__ */ (0, x.jsx)("span", { children: "Daily Briefing" }),
												/* @__PURE__ */ (0, x.jsx)("strong", { children: "브리핑 생성" }),
												/* @__PURE__ */ (0, x.jsx)("p", { children: "지정한 시각에 RSS와 Market Memory를 반영해 일일 브리핑을 생성합니다." })
											] }), /* @__PURE__ */ (0, x.jsx)(Ur, {
												checked: !!o.briefing?.enabled,
												onChange: (e) => s({
													...o,
													briefing: {
														...o.briefing,
														enabled: e
													}
												}),
												compact: !0
											})]
										}),
										/* @__PURE__ */ (0, x.jsxs)("div", {
											className: "settings-grid compact",
											children: [/* @__PURE__ */ (0, x.jsxs)("label", {
												className: "field",
												children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "브리핑 시각" }), /* @__PURE__ */ (0, x.jsx)("input", {
													value: o.briefing?.time || "08:00",
													onChange: (e) => s({
														...o,
														briefing: {
															...o.briefing,
															time: e.currentTarget.value
														}
													}),
													type: "time"
												})]
											}), /* @__PURE__ */ (0, x.jsxs)("label", {
												className: "field",
												children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "시장 범위" }), /* @__PURE__ */ (0, x.jsxs)("select", {
													value: o.briefing?.marketScope || "both",
													onChange: (e) => s({
														...o,
														briefing: {
															...o.briefing,
															marketScope: e.currentTarget.value
														}
													}),
													children: [
														/* @__PURE__ */ (0, x.jsx)("option", {
															value: "both",
															children: "미국+한국"
														}),
														/* @__PURE__ */ (0, x.jsx)("option", {
															value: "us",
															children: "미국"
														}),
														/* @__PURE__ */ (0, x.jsx)("option", {
															value: "kr",
															children: "한국"
														})
													]
												})]
											})]
										}),
										/* @__PURE__ */ (0, x.jsxs)("div", {
											className: "automation-inline-switch",
											children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "브리핑 전 RSS/Memory 실행" }), /* @__PURE__ */ (0, x.jsx)(Ur, {
												checked: !!o.briefing?.runPrerequisites,
												onChange: (e) => s({
													...o,
													briefing: {
														...o.briefing,
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
						/* @__PURE__ */ (0, x.jsx)("div", {
							className: "filter-actions settings-actions",
							children: /* @__PURE__ */ (0, x.jsx)("button", {
								className: "filter-btn apply",
								type: "button",
								onClick: me,
								disabled: V === "automation",
								children: "자동화 저장"
							})
						})
					]
				}), /* @__PURE__ */ (0, x.jsxs)("section", {
					className: "settings-panel input-panel",
					children: [
						/* @__PURE__ */ (0, x.jsxs)("div", {
							className: "input-panel-header",
							children: [/* @__PURE__ */ (0, x.jsxs)("div", { children: [/* @__PURE__ */ (0, x.jsx)("h3", { children: "캐시 관리" }), /* @__PURE__ */ (0, x.jsx)("p", { children: "기업 분석용 SEC/DART per-company 캐시 중 오래된 항목만 정리합니다. 공통 ticker/corpCode 목록은 삭제하지 않습니다." })] }), /* @__PURE__ */ (0, x.jsx)("button", {
								className: "filter-btn clear",
								type: "button",
								onClick: se,
								disabled: V === "cache",
								children: V === "cache" ? "확인 중" : "상태 확인"
							})]
						}),
						/* @__PURE__ */ (0, x.jsxs)("div", {
							className: "cache-summary",
							children: [/* @__PURE__ */ (0, x.jsxs)("section", { children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "전체 캐시" }), /* @__PURE__ */ (0, x.jsx)("strong", { children: d ? `${d.total_mb || 0} MB` : "상태 미확인" })] }), /* @__PURE__ */ (0, x.jsxs)("section", { children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "정리 대상" }), /* @__PURE__ */ (0, x.jsx)("strong", { children: d ? `${d.stale_mb || 0} MB` : "상태 미확인" })] })]
						}),
						d?.stats?.length ? /* @__PURE__ */ (0, x.jsx)("div", {
							className: "cache-list",
							children: d.stats.map((e) => /* @__PURE__ */ (0, x.jsxs)("div", {
								className: "cache-row",
								children: [
									/* @__PURE__ */ (0, x.jsx)("strong", { children: e.directory }),
									/* @__PURE__ */ (0, x.jsxs)("span", { children: [
										e.files || 0,
										"개 · ",
										e.total_mb || 0,
										"MB"
									] }),
									/* @__PURE__ */ (0, x.jsxs)("small", { children: [
										"오래된 항목 ",
										e.stale_files || 0,
										"개 · 보관 ",
										e.max_age_days || 0,
										"일"
									] })
								]
							}, e.directory || "cache"))
						}) : /* @__PURE__ */ (0, x.jsx)("p", {
							className: "section-subtitle",
							children: "상태 확인을 누르면 캐시 사용량을 확인합니다."
						}),
						/* @__PURE__ */ (0, x.jsx)("div", {
							className: "filter-actions settings-actions",
							children: /* @__PURE__ */ (0, x.jsx)("button", {
								className: "filter-btn apply",
								type: "button",
								onClick: ce,
								disabled: V === "cache-cleanup",
								children: V === "cache-cleanup" ? "정리 중" : "오래된 캐시 정리"
							})
						})
					]
				})]
			})
		]
	});
}
//#endregion
//#region src/app/WatchlistRoute.tsx
function Kr(e) {
	let t = /* @__PURE__ */ new Set();
	return e.map((e) => String(e || "").trim()).filter(Boolean).filter((e) => {
		let n = e.toLowerCase();
		return t.has(n) ? !1 : (t.add(n), !0);
	});
}
function qr(e) {
	return e.ticker || e.item || "";
}
function Jr(e) {
	return e.companyName || e.name || e.item || qr(e);
}
function Yr(e, t = "") {
	return e?.company?.name || e?.item || t || "상세 보기";
}
function Xr(e) {
	if (!e) return "상세 정보를 불러오는 중입니다.";
	let t = e.company || {};
	return [
		t.ticker || "",
		t.market || "",
		t.tradingViewSymbol || "",
		e.newsCount ? `${e.newsCount}개 뉴스` : ""
	].filter(Boolean).join(" · ") || "확인된 심볼 정보가 없습니다.";
}
function Zr(e = []) {
	return [...e].sort((e, t) => String(t.date || "").localeCompare(String(e.date || "")));
}
function Qr(e) {
	return e.title || e.url || e.path || "자료";
}
function $r(e) {
	return [e.source, e.date].filter(Boolean).join(" · ");
}
function ei(e) {
	window.location.hash = e ? `#/watchlist/${encodeURIComponent(e)}` : "#/watchlist";
}
function ti() {
	let e = window.location.hash.match(/^#\/?watchlist\/(.+)$/);
	return e ? decodeURIComponent(e[1]) : "";
}
function ni() {
	return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "watchlist";
}
function K() {
	let [e, t] = (0, c.useState)([]), [n, r] = (0, c.useState)([]), [i, a] = (0, c.useState)(""), [o, s] = (0, c.useState)(() => ti()), [l, u] = (0, c.useState)(null), [d, f] = (0, c.useState)(!1), [p, m] = (0, c.useState)(!1), [h, b] = (0, c.useState)(!1), [S, C] = (0, c.useState)(""), [w, T] = (0, c.useState)(""), E = (0, c.useRef)(null), D = (0, c.useCallback)(async (e) => {
		if (!e.length) {
			r([]);
			return;
		}
		let t = await g("/api/watchlist/overview");
		r(Array.isArray(t.items) ? t.items : []);
	}, []), O = (0, c.useCallback)(async () => {
		f(!0), C("");
		try {
			let e = await g("/api/watchlist"), n = Kr(Array.isArray(e) ? e : []);
			t(n), await D(n), v({
				surface: "watchlist",
				viewId: "watchlist",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			C(e instanceof Error ? e.message : "워치리스트를 불러오지 못했습니다.");
		} finally {
			f(!1);
		}
	}, [D]);
	(0, c.useEffect)(() => {
		O();
	}, [O]), (0, c.useEffect)(() => {
		let e = () => {
			ni() && s(ti());
		};
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []), (0, c.useEffect)(() => {
		let e = !0;
		async function t(t) {
			m(!0), C(""), u({ item: t }), v({
				surface: "watchlist_detail",
				viewId: "watchlist",
				reportKind: "watchlist",
				reportId: t,
				marketScope: ""
			});
			try {
				let n = await g(`/api/watchlist/detail?item=${encodeURIComponent(t)}&limit=12`);
				if (!e) return;
				u(n);
			} catch (t) {
				if (!e) return;
				C(t instanceof Error ? t.message : "상세 정보를 불러오지 못했습니다.");
			} finally {
				e && m(!1);
			}
		}
		return o ? t(o) : (u(null), v({
			surface: "watchlist",
			viewId: "watchlist",
			reportKind: "",
			reportId: ""
		})), () => {
			e = !1;
		};
	}, [o]), (0, c.useEffect)(() => {
		let e = E.current;
		if (!(!e || !l || p)) return window.FolioTradingViewWidgets?.cleanup?.(e), e.innerHTML = "<div class=\"tradingview-widget-unavailable\">TradingView 위젯을 준비하는 중입니다.</div>", window.FolioTradingViewWidgets?.renderWatchlistDetail?.(e, l), () => {
			window.FolioTradingViewWidgets?.cleanup?.(e);
		};
	}, [l, p]);
	async function k(e, n) {
		b(!0), C("");
		try {
			let r = await _("/api/watchlist", { items: e }), i = Kr(Array.isArray(r) ? r : []);
			t(i), await D(i), n && T(n);
		} catch (e) {
			C(e instanceof Error ? e.message : "워치리스트 저장에 실패했습니다.");
		} finally {
			b(!1);
		}
	}
	async function A(e) {
		try {
			return (await g(`/api/watchlist/resolve?keyword=${encodeURIComponent(e)}`)).keyword || e;
		} catch {
			return e;
		}
	}
	async function j() {
		let t = i.split(/[,;\n]/).map((e) => e.trim()).filter(Boolean);
		if (!t.length) return;
		let n = [...e];
		for (let e of t) {
			let t = await A(e);
			t && !n.some((e) => e.toLowerCase() === t.toLowerCase()) && n.push(t);
		}
		a(""), n.length !== e.length && await k(n, "워치리스트에 추가했습니다.");
	}
	async function M(t) {
		await k(e.filter((e) => e !== t), "워치리스트에서 삭제했습니다."), o === t && ei();
	}
	let N = (0, c.useMemo)(() => Zr(l?.news || []), [l]), P = Yr(l, o);
	return o ? /* @__PURE__ */ (0, x.jsx)("div", {
		className: "react-watchlist-route",
		"data-watchlist-route": !0,
		children: /* @__PURE__ */ (0, x.jsxs)("div", {
			className: "watchlist-detail-inline",
			children: [/* @__PURE__ */ (0, x.jsxs)("nav", {
				className: "reader-breadcrumb",
				"aria-label": "현재 위치",
				children: [
					/* @__PURE__ */ (0, x.jsx)("button", {
						type: "button",
						className: "reader-crumb-link",
						onClick: () => ei(),
						children: "워치리스트"
					}),
					/* @__PURE__ */ (0, x.jsx)("span", {
						className: "reader-breadcrumb-sep",
						"aria-hidden": "true",
						children: "›"
					}),
					/* @__PURE__ */ (0, x.jsx)("span", {
						className: "reader-breadcrumb-leaf",
						children: P
					})
				]
			}), /* @__PURE__ */ (0, x.jsxs)("section", {
				className: "watchlist-detail-dialog",
				role: "region",
				"aria-labelledby": "watchlistDetailTitle",
				children: [
					/* @__PURE__ */ (0, x.jsxs)("div", {
						className: "watchlist-detail-head",
						children: [/* @__PURE__ */ (0, x.jsxs)("div", { children: [
							/* @__PURE__ */ (0, x.jsx)("p", {
								className: "section-kicker",
								children: "WATCHLIST"
							}),
							/* @__PURE__ */ (0, x.jsx)("h2", {
								id: "watchlistDetailTitle",
								children: P
							}),
							/* @__PURE__ */ (0, x.jsx)("p", {
								className: "section-subtitle",
								children: Xr(l)
							})
						] }), /* @__PURE__ */ (0, x.jsxs)("div", {
							className: "watchlist-detail-actions",
							children: [/* @__PURE__ */ (0, x.jsx)("button", {
								type: "button",
								className: "filter-btn clear",
								onClick: () => y({
									surface: "watchlist_detail",
									reportKind: "watchlist",
									reportId: o
								}),
								children: "Agent에게 묻기"
							}), /* @__PURE__ */ (0, x.jsx)("button", {
								className: "icon-btn",
								type: "button",
								"aria-label": "닫기",
								"data-tooltip": "닫기",
								"data-tooltip-pos": "left",
								onClick: () => ei(),
								children: "×"
							})]
						})]
					}),
					S && /* @__PURE__ */ (0, x.jsx)("p", {
						className: "react-dashboard-error",
						children: S
					}),
					/* @__PURE__ */ (0, x.jsx)("div", {
						ref: E,
						className: "watchlist-detail-widgets",
						children: /* @__PURE__ */ (0, x.jsx)("div", {
							className: "tradingview-widget-unavailable",
							children: "TradingView 위젯을 준비하는 중입니다."
						})
					}),
					/* @__PURE__ */ (0, x.jsxs)("div", {
						className: "watchlist-detail-news",
						children: [/* @__PURE__ */ (0, x.jsx)("h3", { children: "수집한 뉴스" }), p ? /* @__PURE__ */ (0, x.jsx)("p", {
							className: "section-subtitle",
							children: "관련 뉴스를 불러오는 중입니다."
						}) : N.length ? /* @__PURE__ */ (0, x.jsx)("div", {
							className: "watchlist-detail-news-list",
							children: N.map((e, t) => /* @__PURE__ */ (0, x.jsxs)("article", {
								className: "compact-item",
								children: [
									/* @__PURE__ */ (0, x.jsx)("div", {
										className: "meta",
										children: $r(e)
									}),
									/* @__PURE__ */ (0, x.jsx)("h4", { children: e.url ? /* @__PURE__ */ (0, x.jsx)("a", {
										href: e.url,
										target: "_blank",
										rel: "noopener noreferrer",
										children: Qr(e)
									}) : /* @__PURE__ */ (0, x.jsx)("span", { children: Qr(e) }) }),
									e.snippet && /* @__PURE__ */ (0, x.jsx)("p", { children: e.snippet })
								]
							}, `${Qr(e)}-${t}`))
						}) : /* @__PURE__ */ (0, x.jsx)("p", {
							className: "section-subtitle",
							children: "수집된 관련 뉴스가 없습니다."
						})]
					})
				]
			})]
		})
	}) : /* @__PURE__ */ (0, x.jsxs)("div", {
		className: "react-watchlist-route",
		"data-watchlist-route": !0,
		children: [
			/* @__PURE__ */ (0, x.jsx)(je, {
				eyebrow: "Watchlist",
				title: "워치리스트",
				description: "관심 기업, 섹터, 테마를 추적하고 관련 뉴스와 시장 반응을 확인합니다.",
				actions: /* @__PURE__ */ (0, x.jsxs)("div", {
					className: "brief-controls",
					children: [/* @__PURE__ */ (0, x.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						onClick: O,
						disabled: d,
						children: d ? "불러오는 중" : "다시 읽기"
					}), /* @__PURE__ */ (0, x.jsx)("button", {
						className: "filter-btn apply",
						type: "button",
						onClick: () => k(e, "워치리스트를 저장했습니다."),
						disabled: h,
						children: h ? "저장 중" : "저장"
					})]
				})
			}),
			/* @__PURE__ */ (0, x.jsxs)("div", {
				className: "watchlist-editor input-panel",
				children: [
					/* @__PURE__ */ (0, x.jsxs)("div", {
						className: "input-panel-header",
						children: [/* @__PURE__ */ (0, x.jsx)("h3", { children: "키워드 추가" }), /* @__PURE__ */ (0, x.jsx)("p", { children: "관심 기업, 섹터, 테마를 하나씩 추가해 뉴스와 브리핑 추적 범위를 관리합니다." })]
					}),
					/* @__PURE__ */ (0, x.jsx)("input", {
						value: i,
						onChange: (e) => a(e.currentTarget.value),
						onKeyDown: (e) => {
							e.key === "Enter" && (e.preventDefault(), j());
						},
						placeholder: "예: NVDA, 삼성전자, AI"
					}),
					/* @__PURE__ */ (0, x.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						onClick: j,
						disabled: h,
						children: "추가"
					})
				]
			}),
			S && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "react-dashboard-error",
				children: S
			}),
			w && /* @__PURE__ */ (0, x.jsx)("p", {
				className: "react-dashboard-warning",
				children: w
			}),
			/* @__PURE__ */ (0, x.jsx)("div", {
				className: "watchlist-grid",
				children: n.length ? n.map((e) => {
					let t = e.item || Jr(e);
					return /* @__PURE__ */ (0, x.jsxs)("article", {
						className: "watchlist-card",
						"data-watchlist-detail-item": t,
						tabIndex: 0,
						role: "button",
						"aria-label": `${t} 상세 보기`,
						onClick: () => ei(t),
						onKeyDown: (e) => {
							(e.key === "Enter" || e.key === " ") && (e.preventDefault(), ei(t));
						},
						children: [
							/* @__PURE__ */ (0, x.jsx)("span", {
								className: "watchlist-card-accent",
								"aria-hidden": "true"
							}),
							/* @__PURE__ */ (0, x.jsx)("button", {
								className: "watchlist-card-delete",
								type: "button",
								"aria-label": `${t} 워치리스트에서 삭제`,
								"data-tooltip": "삭제",
								onClick: (e) => {
									e.stopPropagation(), M(t);
								},
								children: /* @__PURE__ */ (0, x.jsx)("svg", {
									width: "13",
									height: "13",
									viewBox: "0 0 16 16",
									fill: "none",
									stroke: "currentColor",
									strokeWidth: "1.4",
									strokeLinecap: "round",
									strokeLinejoin: "round",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, x.jsx)("path", { d: "M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" })
								})
							}),
							/* @__PURE__ */ (0, x.jsxs)("div", {
								className: "watchlist-card-top",
								children: [/* @__PURE__ */ (0, x.jsx)("strong", {
									className: "watchlist-ticker",
									children: qr(e)
								}), /* @__PURE__ */ (0, x.jsx)("h3", { children: Jr(e) })]
							}),
							/* @__PURE__ */ (0, x.jsxs)("div", {
								className: "watchlist-card-meta",
								children: [e.tags?.length ? /* @__PURE__ */ (0, x.jsx)("div", {
									className: "tags",
									children: e.tags.slice(0, 5).map((e) => /* @__PURE__ */ (0, x.jsx)("span", {
										className: "tag",
										children: e
									}, e))
								}) : null, /* @__PURE__ */ (0, x.jsxs)("span", {
									className: "watchlist-news-count",
									children: [e.count || 0, "건"]
								})]
							})
						]
					}, t);
				}) : /* @__PURE__ */ (0, x.jsx)("div", {
					className: "result",
					children: /* @__PURE__ */ (0, x.jsx)("p", { children: "워치리스트 항목을 저장하면 항목별 최신 뉴스 카드가 표시됩니다." })
				})
			})
		]
	});
}
//#endregion
//#region src/app/statusStore.ts
var ri = {
	statusText: "",
	docCount: "",
	activeJobId: null
};
function ii() {
	return ri;
}
function ai() {
	let [e, t] = (0, c.useState)(() => ii());
	return (0, c.useEffect)(() => {
		let e = () => t(ii());
		e();
		let n = window.setInterval(e, 1e3);
		return () => window.clearInterval(n);
	}, []), e;
}
//#endregion
//#region src/app/AppShell.tsx
var oi = [
	{
		title: "Home",
		routes: ["home"]
	},
	{
		title: "News",
		routes: [
			"briefing",
			"rss",
			"market-memory"
		]
	},
	{
		title: "Research",
		routes: ["analysis"]
	},
	{
		title: "System",
		routes: ["settings"]
	}
], si = {
	home: /* @__PURE__ */ (0, x.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, x.jsx)("path", { d: "M3 10.5 12 3l9 7.5" }), /* @__PURE__ */ (0, x.jsx)("path", { d: "M5 9.5V21h5v-6h4v6h5V9.5" })]
	}),
	dashboard: /* @__PURE__ */ (0, x.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, x.jsx)("rect", {
				x: "3",
				y: "3",
				width: "7",
				height: "8",
				rx: "1.5"
			}),
			/* @__PURE__ */ (0, x.jsx)("rect", {
				x: "14",
				y: "3",
				width: "7",
				height: "5",
				rx: "1.5"
			}),
			/* @__PURE__ */ (0, x.jsx)("rect", {
				x: "14",
				y: "12",
				width: "7",
				height: "9",
				rx: "1.5"
			}),
			/* @__PURE__ */ (0, x.jsx)("rect", {
				x: "3",
				y: "15",
				width: "7",
				height: "6",
				rx: "1.5"
			})
		]
	}),
	briefing: /* @__PURE__ */ (0, x.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, x.jsx)("path", { d: "M4 5h12.5v14H5.5A1.5 1.5 0 0 1 4 17.5z" }),
			/* @__PURE__ */ (0, x.jsx)("path", { d: "M16.5 8H20v9a2 2 0 0 1-2 2h-1.5" }),
			/* @__PURE__ */ (0, x.jsx)("path", { d: "M7.5 9h6" }),
			/* @__PURE__ */ (0, x.jsx)("path", { d: "M7.5 13h6" }),
			/* @__PURE__ */ (0, x.jsx)("path", { d: "M7.5 16.5h3.5" })
		]
	}),
	rss: /* @__PURE__ */ (0, x.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, x.jsx)("path", {
				fill: "currentColor",
				stroke: "none",
				d: "M8 8H6v7c0 1.1.9 2 2 2h9v-2H8V8z"
			}),
			/* @__PURE__ */ (0, x.jsx)("path", {
				fill: "currentColor",
				stroke: "none",
				d: "M20 3h-8c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 8h-8V7h8v4z"
			}),
			/* @__PURE__ */ (0, x.jsx)("path", {
				fill: "currentColor",
				stroke: "none",
				d: "M4 12H2v7c0 1.1.9 2 2 2h9v-2H4v-7z"
			})
		]
	}),
	"market-memory": /* @__PURE__ */ (0, x.jsx)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, x.jsx)("path", { d: "M22 12h-4l-3 8-6-16-3 8H2" })
	}),
	analysis: /* @__PURE__ */ (0, x.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, x.jsx)("path", { d: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" }),
			/* @__PURE__ */ (0, x.jsx)("path", { d: "M14 3v6h6" }),
			/* @__PURE__ */ (0, x.jsx)("path", { d: "M8 17v-3" }),
			/* @__PURE__ */ (0, x.jsx)("path", { d: "M12 17v-6" }),
			/* @__PURE__ */ (0, x.jsx)("path", { d: "M16 17v-4" })
		]
	}),
	"deep-research": /* @__PURE__ */ (0, x.jsx)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, x.jsx)("path", { d: "M14 11H8m2 4H8m8-8H8m12 3.5V6.8c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311C17.72 2 16.88 2 15.2 2H8.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C4 4.28 4 5.12 4 6.8v10.4c0 1.68 0 2.52.327 3.162a3 3 0 0 0 1.311 1.311C6.28 22 7.12 22 8.8 22h2.7M22 22l-1.5-1.5m1-2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0" })
	}),
	watchlist: /* @__PURE__ */ (0, x.jsx)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, x.jsx)("path", { d: "M12 13V7m-3 3h6m4 11V7.8c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311C16.72 3 15.88 3 14.2 3H9.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C5 5.28 5 6.12 5 7.8V21l7-4z" })
	}),
	settings: /* @__PURE__ */ (0, x.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, x.jsx)("path", { d: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" }), /* @__PURE__ */ (0, x.jsx)("path", { d: "M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06A2 2 0 1 1 7.22 3.43l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.34.4.7.6 1a1.7 1.7 0 0 0 1.1.4H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.1.4c-.17.14-.31.28-.41.2Z" })]
	})
};
function ci() {
	return window.location.hash || ot("home");
}
function li() {
	let [e, t] = (0, c.useState)(() => ci());
	return (0, c.useEffect)(() => {
		let e = () => t(ci());
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []), {
		hash: e,
		routeId: at(e)
	};
}
async function ui(e) {
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
function di() {
	let { hash: e, routeId: t } = li(), n = st(t), r = ai(), [i, a] = (0, c.useState)(() => localStorage.getItem("folio.react.navCollapsed") === "1"), [o, s] = (0, c.useState)(() => localStorage.getItem("folio.react.agentClosed") !== "1"), [l, u] = (0, c.useState)(() => /* @__PURE__ */ new Set([t])), [d, f] = (0, c.useState)(() => ({ [t]: ci() })), [p, m] = (0, c.useState)(""), [h, g] = (0, c.useState)(!1), _ = (0, c.useRef)(null), v = (0, c.useRef)(t), y = (0, c.useRef)({}), b = n.id !== "home", S = b && o ? " is-agent-open" : " is-agent-closed";
	(0, c.useEffect)(() => {
		localStorage.setItem("folio.react.navCollapsed", i ? "1" : "0");
	}, [i]), (0, c.useEffect)(() => {
		localStorage.setItem("folio.react.agentClosed", o ? "0" : "1");
	}, [o]), (0, c.useEffect)(() => {
		u((e) => {
			if (e.has(t)) return e;
			let n = new Set(e);
			return n.add(t), n;
		});
	}, [t]), (0, c.useEffect)(() => {
		f((n) => n[t] === e ? n : {
			...n,
			[t]: e
		});
	}, [e, t]), (0, c.useEffect)(() => {
		let e = _.current, n = v.current;
		e && (y.current[n] = e.scrollTop, window.requestAnimationFrame(() => {
			e.scrollTop = y.current[t] || 0;
		})), v.current = t;
	}, [t]), (0, c.useEffect)(() => {
		let e = window.FolioBridge ?? {}, t = e.openAgentDock;
		return window.FolioBridge = {
			...e,
			openAgentDock(e = {}) {
				s(!0), window.dispatchEvent(new CustomEvent("folio:react-agent-request", { detail: e }));
			}
		}, () => {
			window.FolioBridge && (window.FolioBridge.openAgentDock = t);
		};
	}, []);
	async function C() {
		if (!h) {
			g(!0), m("재시작 요청 중");
			try {
				await fetch("/api/server/restart", {
					method: "POST",
					body: "{}"
				});
			} catch {}
			m("서버 재시작 중"), await ui(m), g(!1);
		}
	}
	function w(e) {
		let t = d[e] || ot(e);
		window.location.hash !== t && (window.location.hash = t);
	}
	function T(e) {
		let t = st(e);
		return t.id === "home" ? /* @__PURE__ */ (0, x.jsx)(se, {}) : t.id === "dashboard" ? /* @__PURE__ */ (0, x.jsx)(Cn, {}) : t.id === "briefing" ? /* @__PURE__ */ (0, x.jsx)(tt, {}) : t.id === "rss" ? /* @__PURE__ */ (0, x.jsx)(Ir, {}) : t.id === "market-memory" ? /* @__PURE__ */ (0, x.jsx)(tr, {}) : t.id === "analysis" ? /* @__PURE__ */ (0, x.jsx)(rn, {}) : t.id === "deep-research" ? /* @__PURE__ */ (0, x.jsx)(Jn, {}) : t.id === "watchlist" ? /* @__PURE__ */ (0, x.jsx)(K, {}) : t.id === "settings" ? /* @__PURE__ */ (0, x.jsx)(Gr, {}) : null;
	}
	return /* @__PURE__ */ (0, x.jsxs)("div", {
		className: `react-shell${i ? " is-nav-collapsed" : ""}${S}${b ? "" : " is-agent-suppressed"}`,
		children: [
			/* @__PURE__ */ (0, x.jsxs)("header", {
				className: "react-shell-topbar",
				children: [/* @__PURE__ */ (0, x.jsxs)("button", {
					type: "button",
					className: "react-shell-brand",
					onClick: () => {
						w("home");
					},
					"aria-label": "홈으로 이동",
					children: [/* @__PURE__ */ (0, x.jsx)("span", { children: "Folio OS" }), /* @__PURE__ */ (0, x.jsx)("small", { children: "Investment Workspace" })]
				}), /* @__PURE__ */ (0, x.jsxs)("div", {
					className: "react-shell-status",
					"aria-live": "polite",
					children: [
						/* @__PURE__ */ (0, x.jsx)("span", { children: p || r.statusText || "준비됨" }),
						r.activeJobId && /* @__PURE__ */ (0, x.jsx)("span", { children: r.activeJobId }),
						/* @__PURE__ */ (0, x.jsx)("button", {
							type: "button",
							onClick: C,
							disabled: h,
							children: h ? "재시작 중" : "재시작"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, x.jsxs)("aside", {
				className: "react-shell-nav",
				"aria-label": "주요 화면 탐색",
				children: [/* @__PURE__ */ (0, x.jsx)("button", {
					className: "react-shell-nav-toggle",
					type: "button",
					"aria-label": i ? "좌측 사이드바 펼치기" : "좌측 사이드바 접기",
					"aria-expanded": !i,
					onClick: () => a((e) => !e),
					children: /* @__PURE__ */ (0, x.jsx)("svg", {
						viewBox: "0 0 16 16",
						fill: "none",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, x.jsx)("path", { d: "M10 3.5 L5.5 8 L10 12.5" })
					})
				}), /* @__PURE__ */ (0, x.jsxs)("nav", {
					className: "react-left-nav",
					"aria-label": "Folio OS 화면",
					children: [/* @__PURE__ */ (0, x.jsx)("div", {
						className: "react-left-nav-title",
						children: "Navigate"
					}), oi.map((e) => /* @__PURE__ */ (0, x.jsxs)("section", {
						className: "react-left-nav-group",
						"data-nav-group": e.title,
						children: [/* @__PURE__ */ (0, x.jsx)("h3", { children: e.title }), /* @__PURE__ */ (0, x.jsx)("div", {
							className: "react-left-nav-items",
							children: e.routes.map((t) => {
								let r = rt.find((e) => e.id === t);
								return r ? /* @__PURE__ */ (0, x.jsxs)("span", {
									className: "react-left-nav-entry",
									children: [e.title === "Home" && r.id === "dashboard" && /* @__PURE__ */ (0, x.jsx)("span", {
										className: "react-left-nav-separator",
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, x.jsxs)("button", {
										type: "button",
										"data-tooltip": r.label,
										className: `react-left-nav-item${r.id === n.id ? " active" : ""}`,
										onClick: () => {
											w(r.id);
										},
										children: [/* @__PURE__ */ (0, x.jsx)("span", {
											className: "react-left-nav-icon",
											"aria-hidden": "true",
											children: si[r.id]
										}), /* @__PURE__ */ (0, x.jsx)("span", {
											className: "react-left-nav-label",
											children: r.label
										})]
									})]
								}, r.id) : null;
							})
						})]
					}, e.title))]
				})]
			}),
			/* @__PURE__ */ (0, x.jsx)("main", {
				className: "react-shell-main",
				children: /* @__PURE__ */ (0, x.jsx)("section", {
					className: "react-route-host",
					"data-route": n.id,
					ref: _,
					children: nt.filter((e) => l.has(e.id)).map((e) => /* @__PURE__ */ (0, x.jsx)("div", {
						className: "react-route-pane",
						"data-route-pane": e.id,
						hidden: e.id !== n.id,
						children: T(e.id)
					}, e.id))
				})
			}),
			b && /* @__PURE__ */ (0, x.jsx)(wr, {
				surface: `react_${n.id}`,
				open: o,
				onOpen: () => s(!0),
				onClose: () => s(!1)
			}),
			/* @__PURE__ */ (0, x.jsx)(dt, {})
		]
	});
}
//#endregion
//#region src/app/App.tsx
function fi() {
	return /* @__PURE__ */ (0, x.jsx)(di, {});
}
//#endregion
//#region src/main.tsx
var pi = { "market-state": () => /* @__PURE__ */ (0, x.jsx)(mn, {}) };
function mi() {
	document.querySelectorAll("[data-react-island]").forEach((e) => {
		let t = pi[e.dataset.reactIsland || ""];
		!t || e.dataset.reactMounted === "1" || (e.dataset.reactMounted = "1", (0, l.createRoot)(e).render(/* @__PURE__ */ (0, x.jsx)(c.StrictMode, { children: t() })));
	});
}
function hi() {
	let e = document.getElementById("folioReactRoot");
	return e ? e.dataset.reactMounted === "1" ? !0 : (e.dataset.reactMounted = "1", (0, l.createRoot)(e).render(/* @__PURE__ */ (0, x.jsx)(c.StrictMode, { children: /* @__PURE__ */ (0, x.jsx)(fi, {}) })), !0) : !1;
}
function gi() {
	hi(), mi();
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", gi) : gi();
//#endregion
