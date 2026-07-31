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
	function te(e) {
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
	function U(e) {
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
			case P: return t = e.displayName || null, t === null ? U(e.type) || "Memo" : t;
			case F:
				t = e._payload, e = e._init;
				try {
					return U(e(t));
				} catch {}
		}
		return null;
	}
	function ne(e) {
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
			case 16: return U(t);
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
	function W(e) {
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
	function G(e) {
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
	function ie(e) {
		e._valueTracker ||= G(e);
	}
	function ae(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = re(e) ? e.checked ? "true" : "false" : e.value), e = r, e === n ? !1 : (t.setValue(e), !0);
	}
	function oe(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	function K(e, t) {
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
		n = W(t.value == null ? n : t.value), e._wrapperState = {
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
		var n = W(t.value), r = t.type;
		if (n != null) r === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
		else if (r === "submit" || r === "reset") {
			e.removeAttribute("value");
			return;
		}
		t.hasOwnProperty("value") ? de(e, t.type, n) : t.hasOwnProperty("defaultValue") && de(e, t.type, W(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
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
		(t !== "number" || oe(e.ownerDocument) !== e) && (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
	}
	var fe = Array.isArray;
	function pe(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + W(n), t = null, i = 0; i < e.length; i++) {
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
		e._wrapperState = { initialValue: W(n) };
	}
	function ge(e, t) {
		var n = W(t.value), r = W(t.defaultValue);
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
				(r = !r.disabled) || (e = e.type, r = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !r;
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
	function $e(e) {
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
	function et(e) {
		if (e.tag === 13) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function tt(e) {
		if ($e(e) !== e) throw Error(a(188));
	}
	function nt(e) {
		var t = e.alternate;
		if (!t) {
			if (t = $e(e), t === null) throw Error(a(188));
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
					if (o === n) return tt(i), e;
					if (o === r) return tt(i), t;
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
	function rt(e) {
		return e = nt(e), e === null ? null : it(e);
	}
	function it(e) {
		if (e.tag === 5 || e.tag === 6) return e;
		for (e = e.child; e !== null;) {
			var t = it(e);
			if (t !== null) return t;
			e = e.sibling;
		}
		return null;
	}
	var at = r.unstable_scheduleCallback, ot = r.unstable_cancelCallback, st = r.unstable_shouldYield, ct = r.unstable_requestPaint, lt = r.unstable_now, ut = r.unstable_getCurrentPriorityLevel, dt = r.unstable_ImmediatePriority, ft = r.unstable_UserBlockingPriority, pt = r.unstable_NormalPriority, mt = r.unstable_LowPriority, ht = r.unstable_IdlePriority, gt = null, _t = null;
	function vt(e) {
		if (_t && typeof _t.onCommitFiberRoot == "function") try {
			_t.onCommitFiberRoot(gt, e, void 0, (e.current.flags & 128) == 128);
		} catch {}
	}
	var yt = Math.clz32 ? Math.clz32 : St, bt = Math.log, xt = Math.LN2;
	function St(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (bt(e) / xt | 0) | 0;
	}
	var Ct = 64, wt = 4194304;
	function Tt(e) {
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
	function Et(e, t) {
		var n = e.pendingLanes;
		if (n === 0) return 0;
		var r = 0, i = e.suspendedLanes, a = e.pingedLanes, o = n & 268435455;
		if (o !== 0) {
			var s = o & ~i;
			s === 0 ? (a &= o, a !== 0 && (r = Tt(a))) : r = Tt(s);
		} else o = n & ~i, o === 0 ? a !== 0 && (r = Tt(a)) : r = Tt(o);
		if (r === 0) return 0;
		if (t !== 0 && t !== r && (t & i) === 0 && (i = r & -r, a = t & -t, i >= a || i === 16 && a & 4194240)) return t;
		if (r & 4 && (r |= n & 16), t = e.entangledLanes, t !== 0) for (e = e.entanglements, t &= r; 0 < t;) n = 31 - yt(t), i = 1 << n, r |= e[n], t &= ~i;
		return r;
	}
	function Dt(e, t) {
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
	function Ot(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes; 0 < a;) {
			var o = 31 - yt(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = Dt(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
	}
	function kt(e) {
		return e = e.pendingLanes & -1073741825, e === 0 ? e & 1073741824 ? 1073741824 : 0 : e;
	}
	function At() {
		var e = Ct;
		return Ct <<= 1, !(Ct & 4194240) && (Ct = 64), e;
	}
	function jt(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function Mt(e, t, n) {
		e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - yt(t), e[t] = n;
	}
	function Nt(e, t) {
		var n = e.pendingLanes & ~t;
		e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
		var r = e.eventTimes;
		for (e = e.expirationTimes; 0 < n;) {
			var i = 31 - yt(n), a = 1 << i;
			t[i] = 0, r[i] = -1, e[i] = -1, n &= ~a;
		}
	}
	function Pt(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - yt(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	var q = 0;
	function Ft(e) {
		return e &= -e, 1 < e ? 4 < e ? e & 268435455 ? 16 : 536870912 : 4 : 1;
	}
	var It, Lt, Rt, zt, Bt, Vt = !1, Ht = [], Ut = null, Wt = null, Gt = null, Kt = /* @__PURE__ */ new Map(), qt = /* @__PURE__ */ new Map(), Jt = [], Yt = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
	function Xt(e, t) {
		switch (e) {
			case "focusin":
			case "focusout":
				Ut = null;
				break;
			case "dragenter":
			case "dragleave":
				Wt = null;
				break;
			case "mouseover":
			case "mouseout":
				Gt = null;
				break;
			case "pointerover":
			case "pointerout":
				Kt.delete(t.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": qt.delete(t.pointerId);
		}
	}
	function Zt(e, t, n, r, i, a) {
		return e === null || e.nativeEvent !== a ? (e = {
			blockedOn: t,
			domEventName: n,
			eventSystemFlags: r,
			nativeEvent: a,
			targetContainers: [i]
		}, t !== null && (t = Mi(t), t !== null && Lt(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
	}
	function Qt(e, t, n, r, i) {
		switch (t) {
			case "focusin": return Ut = Zt(Ut, e, t, n, r, i), !0;
			case "dragenter": return Wt = Zt(Wt, e, t, n, r, i), !0;
			case "mouseover": return Gt = Zt(Gt, e, t, n, r, i), !0;
			case "pointerover":
				var a = i.pointerId;
				return Kt.set(a, Zt(Kt.get(a) || null, e, t, n, r, i)), !0;
			case "gotpointercapture": return a = i.pointerId, qt.set(a, Zt(qt.get(a) || null, e, t, n, r, i)), !0;
		}
		return !1;
	}
	function $t(e) {
		var t = ji(e.target);
		if (t !== null) {
			var n = $e(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = et(n), t !== null) {
						e.blockedOn = t, Bt(e.priority, function() {
							Rt(n);
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
	function en(e) {
		if (e.blockedOn !== null) return !1;
		for (var t = e.targetContainers; 0 < t.length;) {
			var n = J(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
			if (n === null) {
				n = e.nativeEvent;
				var r = new n.constructor(n.type, n);
				Ae = r, n.target.dispatchEvent(r), Ae = null;
			} else return t = Mi(n), t !== null && Lt(t), e.blockedOn = n, !1;
			t.shift();
		}
		return !0;
	}
	function tn(e, t, n) {
		en(e) && n.delete(t);
	}
	function nn() {
		Vt = !1, Ut !== null && en(Ut) && (Ut = null), Wt !== null && en(Wt) && (Wt = null), Gt !== null && en(Gt) && (Gt = null), Kt.forEach(tn), qt.forEach(tn);
	}
	function rn(e, t) {
		e.blockedOn === t && (e.blockedOn = null, Vt || (Vt = !0, r.unstable_scheduleCallback(r.unstable_NormalPriority, nn)));
	}
	function an(e) {
		function t(t) {
			return rn(t, e);
		}
		if (0 < Ht.length) {
			rn(Ht[0], e);
			for (var n = 1; n < Ht.length; n++) {
				var r = Ht[n];
				r.blockedOn === e && (r.blockedOn = null);
			}
		}
		for (Ut !== null && rn(Ut, e), Wt !== null && rn(Wt, e), Gt !== null && rn(Gt, e), Kt.forEach(t), qt.forEach(t), n = 0; n < Jt.length; n++) r = Jt[n], r.blockedOn === e && (r.blockedOn = null);
		for (; 0 < Jt.length && (n = Jt[0], n.blockedOn === null);) $t(n), n.blockedOn === null && Jt.shift();
	}
	var on = C.ReactCurrentBatchConfig, sn = !0;
	function cn(e, t, n, r) {
		var i = q, a = on.transition;
		on.transition = null;
		try {
			q = 1, un(e, t, n, r);
		} finally {
			q = i, on.transition = a;
		}
	}
	function ln(e, t, n, r) {
		var i = q, a = on.transition;
		on.transition = null;
		try {
			q = 4, un(e, t, n, r);
		} finally {
			q = i, on.transition = a;
		}
	}
	function un(e, t, n, r) {
		if (sn) {
			var i = J(e, t, n, r);
			if (i === null) ri(e, t, r, dn, n), Xt(e, r);
			else if (Qt(i, e, t, n, r)) r.stopPropagation();
			else if (Xt(e, r), t & 4 && -1 < Yt.indexOf(e)) {
				for (; i !== null;) {
					var a = Mi(i);
					if (a !== null && It(a), a = J(e, t, n, r), a === null && ri(e, t, r, dn, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else ri(e, t, r, null, n);
		}
	}
	var dn = null;
	function J(e, t, n, r) {
		if (dn = null, e = je(r), e = ji(e), e !== null) if (t = $e(e), t === null) e = null;
		else if (n = t.tag, n === 13) {
			if (e = et(t), e !== null) return e;
			e = null;
		} else if (n === 3) {
			if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
			e = null;
		} else t !== e && (e = null);
		return dn = e, null;
	}
	function Y(e) {
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
			case "message": switch (ut()) {
				case dt: return 1;
				case ft: return 4;
				case pt:
				case mt: return 16;
				case ht: return 536870912;
				default: return 16;
			}
			default: return 16;
		}
	}
	var fn = null, pn = null, mn = null;
	function hn() {
		if (mn) return mn;
		var e, t = pn, n = t.length, r, i = "value" in fn ? fn.value : fn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return mn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function gn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function _n() {
		return !0;
	}
	function vn() {
		return !1;
	}
	function yn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? _n : vn, this.isPropagationStopped = vn, this;
		}
		return z(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = _n);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = _n);
			},
			persist: function() {},
			isPersistent: _n
		}), t;
	}
	var bn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, xn = yn(bn), Sn = z({}, bn, {
		view: 0,
		detail: 0
	}), Cn = yn(Sn), wn, Tn, En, Dn = z({}, Sn, {
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
		getModifierState: Rn,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== En && (En && e.type === "mousemove" ? (wn = e.screenX - En.screenX, Tn = e.screenY - En.screenY) : Tn = wn = 0, En = e), wn);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : Tn;
		}
	}), On = yn(Dn), kn = yn(z({}, Dn, { dataTransfer: 0 })), An = yn(z({}, Sn, { relatedTarget: 0 })), jn = yn(z({}, bn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Mn = yn(z({}, bn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), Nn = yn(z({}, bn, { data: 0 })), Pn = {
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
	}, Fn = {
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
	}, In = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function Ln(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = In[e]) ? !!t[e] : !1;
	}
	function Rn() {
		return Ln;
	}
	var zn = yn(z({}, Sn, {
		key: function(e) {
			if (e.key) {
				var t = Pn[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = gn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Fn[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: Rn,
		charCode: function(e) {
			return e.type === "keypress" ? gn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? gn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), Bn = yn(z({}, Dn, {
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
	})), Vn = yn(z({}, Sn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Rn
	})), Hn = yn(z({}, bn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Un = yn(z({}, Dn, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), Wn = [
		9,
		13,
		27,
		32
	], Gn = u && "CompositionEvent" in window, Kn = null;
	u && "documentMode" in document && (Kn = document.documentMode);
	var qn = u && "TextEvent" in window && !Kn, Jn = u && (!Gn || Kn && 8 < Kn && 11 >= Kn), Yn = " ", Xn = !1;
	function Zn(e, t) {
		switch (e) {
			case "keyup": return Wn.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function Qn(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var $n = !1;
	function er(e, t) {
		switch (e) {
			case "compositionend": return Qn(t);
			case "keypress": return t.which === 32 ? (Xn = !0, Yn) : null;
			case "textInput": return e = t.data, e === Yn && Xn ? null : e;
			default: return null;
		}
	}
	function tr(e, t) {
		if ($n) return e === "compositionend" || !Gn && Zn(e, t) ? (e = hn(), mn = pn = fn = null, $n = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return Jn && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var nr = {
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
	function rr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!nr[e.type] : t === "textarea";
	}
	function ir(e, t, n, r) {
		Ie(r), t = ai(t, "onChange"), 0 < t.length && (n = new xn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var ar = null, or = null;
	function sr(e) {
		Qr(e, 0);
	}
	function cr(e) {
		if (ae(Ni(e))) return e;
	}
	function lr(e, t) {
		if (e === "change") return t;
	}
	var ur = !1;
	if (u) {
		var dr;
		if (u) {
			var fr = "oninput" in document;
			if (!fr) {
				var pr = document.createElement("div");
				pr.setAttribute("oninput", "return;"), fr = typeof pr.oninput == "function";
			}
			dr = fr;
		} else dr = !1;
		ur = dr && (!document.documentMode || 9 < document.documentMode);
	}
	function mr() {
		ar && (ar.detachEvent("onpropertychange", hr), or = ar = null);
	}
	function hr(e) {
		if (e.propertyName === "value" && cr(or)) {
			var t = [];
			ir(t, or, e, je(e)), Ve(sr, t);
		}
	}
	function gr(e, t, n) {
		e === "focusin" ? (mr(), ar = t, or = n, ar.attachEvent("onpropertychange", hr)) : e === "focusout" && mr();
	}
	function _r(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return cr(or);
	}
	function vr(e, t) {
		if (e === "click") return cr(t);
	}
	function yr(e, t) {
		if (e === "input" || e === "change") return cr(t);
	}
	function br(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var xr = typeof Object.is == "function" ? Object.is : br;
	function Sr(e, t) {
		if (xr(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!d.call(t, i) || !xr(e[i], t[i])) return !1;
		}
		return !0;
	}
	function Cr(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function wr(e, t) {
		var n = Cr(e);
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
			n = Cr(n);
		}
	}
	function Tr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Tr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function Er() {
		for (var e = window, t = oe(); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = oe(e.document);
		}
		return t;
	}
	function Dr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	function Or(e) {
		var t = Er(), n = e.focusedElem, r = e.selectionRange;
		if (t !== n && n && n.ownerDocument && Tr(n.ownerDocument.documentElement, n)) {
			if (r !== null && Dr(n)) {
				if (t = r.start, e = r.end, e === void 0 && (e = t), "selectionStart" in n) n.selectionStart = t, n.selectionEnd = Math.min(e, n.value.length);
				else if (e = (t = n.ownerDocument || document) && t.defaultView || window, e.getSelection) {
					e = e.getSelection();
					var i = n.textContent.length, a = Math.min(r.start, i);
					r = r.end === void 0 ? a : Math.min(r.end, i), !e.extend && a > r && (i = r, r = a, a = i), i = wr(n, a);
					var o = wr(n, r);
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
	var kr = u && "documentMode" in document && 11 >= document.documentMode, Ar = null, jr = null, Mr = null, Nr = !1;
	function Pr(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		Nr || Ar == null || Ar !== oe(r) || (r = Ar, "selectionStart" in r && Dr(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), Mr && Sr(Mr, r) || (Mr = r, r = ai(jr, "onSelect"), 0 < r.length && (t = new xn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = Ar)));
	}
	function Fr(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var Ir = {
		animationend: Fr("Animation", "AnimationEnd"),
		animationiteration: Fr("Animation", "AnimationIteration"),
		animationstart: Fr("Animation", "AnimationStart"),
		transitionend: Fr("Transition", "TransitionEnd")
	}, Lr = {}, Rr = {};
	u && (Rr = document.createElement("div").style, "AnimationEvent" in window || (delete Ir.animationend.animation, delete Ir.animationiteration.animation, delete Ir.animationstart.animation), "TransitionEvent" in window || delete Ir.transitionend.transition);
	function zr(e) {
		if (Lr[e]) return Lr[e];
		if (!Ir[e]) return e;
		var t = Ir[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in Rr) return Lr[e] = t[n];
		return e;
	}
	var Br = zr("animationend"), Vr = zr("animationiteration"), Hr = zr("animationstart"), Ur = zr("transitionend"), Wr = /* @__PURE__ */ new Map(), Gr = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	function Kr(e, t) {
		Wr.set(e, t), c(t, [e]);
	}
	for (var qr = 0; qr < Gr.length; qr++) {
		var Jr = Gr[qr];
		Kr(Jr.toLowerCase(), "on" + (Jr[0].toUpperCase() + Jr.slice(1)));
	}
	Kr(Br, "onAnimationEnd"), Kr(Vr, "onAnimationIteration"), Kr(Hr, "onAnimationStart"), Kr("dblclick", "onDoubleClick"), Kr("focusin", "onFocus"), Kr("focusout", "onBlur"), Kr(Ur, "onTransitionEnd"), l("onMouseEnter", ["mouseout", "mouseover"]), l("onMouseLeave", ["mouseout", "mouseover"]), l("onPointerEnter", ["pointerout", "pointerover"]), l("onPointerLeave", ["pointerout", "pointerover"]), c("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), c("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), c("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), c("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), c("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), c("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
	var Yr = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Xr = new Set("cancel close invalid load scroll toggle".split(" ").concat(Yr));
	function Zr(e, t, n) {
		var r = e.type || "unknown-event";
		e.currentTarget = n, Qe(r, t, void 0, e), e.currentTarget = null;
	}
	function Qr(e, t) {
		t = (t & 4) != 0;
		for (var n = 0; n < e.length; n++) {
			var r = e[n], i = r.event;
			r = r.listeners;
			a: {
				var a = void 0;
				if (t) for (var o = r.length - 1; 0 <= o; o--) {
					var s = r[o], c = s.instance, l = s.currentTarget;
					if (s = s.listener, c !== a && i.isPropagationStopped()) break a;
					Zr(i, s, l), a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					Zr(i, s, l), a = c;
				}
			}
		}
		if (Je) throw e = Ye, Je = !1, Ye = null, e;
	}
	function X(e, t) {
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
				t !== "selectionchange" && (Xr.has(t) || $r(t, !1, e), $r(t, !0, e));
			});
			var t = e.nodeType === 9 ? e : e.ownerDocument;
			t === null || t[ei] || (t[ei] = !0, $r("selectionchange", !1, t));
		}
	}
	function ni(e, t, n, r) {
		switch (Y(t)) {
			case 1:
				var i = cn;
				break;
			case 4:
				i = ln;
				break;
			default: i = un;
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
				var s = Wr.get(e);
				if (s !== void 0) {
					var c = xn, l = e;
					switch (e) {
						case "keypress": if (gn(n) === 0) break a;
						case "keydown":
						case "keyup":
							c = zn;
							break;
						case "focusin":
							l = "focus", c = An;
							break;
						case "focusout":
							l = "blur", c = An;
							break;
						case "beforeblur":
						case "afterblur":
							c = An;
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
							c = On;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							c = kn;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							c = Vn;
							break;
						case Br:
						case Vr:
						case Hr:
							c = jn;
							break;
						case Ur:
							c = Hn;
							break;
						case "scroll":
							c = Cn;
							break;
						case "wheel":
							c = Un;
							break;
						case "copy":
						case "cut":
						case "paste":
							c = Mn;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup": c = Bn;
					}
					var u = (t & 4) != 0, d = !u && e === "scroll", f = u ? s === null ? null : s + "Capture" : s;
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
					if ((c || s) && (s = i.window === i ? i : (s = i.ownerDocument) ? s.defaultView || s.parentWindow : window, c ? (l = n.relatedTarget || n.toElement, c = r, l = l ? ji(l) : null, l !== null && (d = $e(l), l !== d || l.tag !== 5 && l.tag !== 6) && (l = null)) : (c = null, l = r), c !== l)) {
						if (u = On, h = "onMouseLeave", f = "onMouseEnter", p = "mouse", (e === "pointerout" || e === "pointerover") && (u = Bn, h = "onPointerLeave", f = "onPointerEnter", p = "pointer"), d = c == null ? s : Ni(c), m = l == null ? s : Ni(l), s = new u(h, p + "leave", c, n, i), s.target = d, s.relatedTarget = m, h = null, ji(i) === r && (u = new u(f, p + "enter", l, n, i), u.target = m, u.relatedTarget = d, h = u), d = h, c && l) b: {
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
					if (s = r ? Ni(r) : window, c = s.nodeName && s.nodeName.toLowerCase(), c === "select" || c === "input" && s.type === "file") var g = lr;
					else if (rr(s)) if (ur) g = yr;
					else {
						g = _r;
						var _ = gr;
					}
					else (c = s.nodeName) && c.toLowerCase() === "input" && (s.type === "checkbox" || s.type === "radio") && (g = vr);
					if (g &&= g(e, r)) {
						ir(o, g, n, i);
						break a;
					}
					_ && _(e, s, r), e === "focusout" && (_ = s._wrapperState) && _.controlled && s.type === "number" && de(s, "number", s.value);
				}
				switch (_ = r ? Ni(r) : window, e) {
					case "focusin":
						(rr(_) || _.contentEditable === "true") && (Ar = _, jr = r, Mr = null);
						break;
					case "focusout":
						Mr = jr = Ar = null;
						break;
					case "mousedown":
						Nr = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						Nr = !1, Pr(o, n, i);
						break;
					case "selectionchange": if (kr) break;
					case "keydown":
					case "keyup": Pr(o, n, i);
				}
				var v;
				if (Gn) b: {
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
				else $n ? Zn(e, n) && (y = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (y = "onCompositionStart");
				y && (Jn && n.locale !== "ko" && ($n || y !== "onCompositionStart" ? y === "onCompositionEnd" && $n && (v = hn()) : (fn = i, pn = "value" in fn ? fn.value : fn.textContent, $n = !0)), _ = ai(r, y), 0 < _.length && (y = new Nn(y, e, null, n, i), o.push({
					event: y,
					listeners: _
				}), v ? y.data = v : (v = Qn(n), v !== null && (y.data = v)))), (v = qn ? er(e, n) : tr(e, n)) && (r = ai(r, "onBeforeInput"), 0 < r.length && (i = new Nn("onBeforeInput", "beforeinput", null, n, i), o.push({
					event: i,
					listeners: r
				}), i.data = v));
			}
			Qr(o, t);
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
					e.removeChild(i), an(t);
					return;
				}
				r--;
			} else n !== "$" && n !== "$?" && n !== "$!" || r++;
			n = i;
		} while (n);
		an(t);
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
	function Ri(e) {
		0 > Ii || (e.current = Fi[Ii], Fi[Ii] = null, Ii--);
	}
	function Z(e, t) {
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
		Ri(Vi), Ri(Bi);
	}
	function Ki(e, t, n) {
		if (Bi.current !== zi) throw Error(a(168));
		Z(Bi, t), Z(Vi, n);
	}
	function qi(e, t, n) {
		var r = e.stateNode;
		if (t = t.childContextTypes, typeof r.getChildContext != "function") return n;
		for (var i in r = r.getChildContext(), r) if (!(i in t)) throw Error(a(108, ne(e) || "Unknown", i));
		return z({}, n, r);
	}
	function Ji(e) {
		return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || zi, Hi = Bi.current, Z(Bi, e), Z(Vi, Vi.current), !0;
	}
	function Yi(e, t, n) {
		var r = e.stateNode;
		if (!r) throw Error(a(169));
		n ? (e = qi(e, t, Hi), r.__reactInternalMemoizedMergedChildContext = e, Ri(Vi), Ri(Bi), Z(Bi, e)) : Ri(Vi), Z(Vi, n);
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
			var e = 0, t = q;
			try {
				var n = Xi;
				for (q = 1; e < n.length; e++) {
					var r = n[e];
					do
						r = r(!0);
					while (r !== null);
				}
				Xi = null, Zi = !1;
			} catch (t) {
				throw Xi !== null && (Xi = Xi.slice(e + 1)), at(dt, ta), t;
			} finally {
				q = t, Qi = !1;
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
		var i = 32 - yt(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - yt(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, la = 1 << 32 - yt(t) + i | n << i | r, ua = a + e;
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
				return t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t === null ? !1 : (e.stateNode = t, ha = e, ga = Si(t.firstChild), !0);
			case 6: return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t === null ? !1 : (e.stateNode = t, ha = e, ga = null, !0);
			case 13: return t = t.nodeType === 8 ? t : null, t === null ? !1 : (n = ca === null ? null : {
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
		return (e.mode & 1) != 0 && (e.flags & 128) == 0;
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
								} else t(e, l);
								l = l.sibling;
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
								else t(e, r);
								r = r.sibling;
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
		Ri(Fa), e._currentValue = t;
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
			r &= e.pendingLanes, n |= r, t.lanes = n, Pt(e, n);
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
		switch (Z(oo, t), Z(ao, e), Z(io, ro), e = t.nodeType, e) {
			case 9:
			case 11:
				t = (t = t.documentElement) ? t.namespaceURI : ye(null, "");
				break;
			default: e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = ye(t, e);
		}
		Ri(io), Z(io, t);
	}
	function lo() {
		Ri(io), Ri(ao), Ri(oo);
	}
	function uo(e) {
		so(oo.current);
		var t = so(io.current), n = ye(t, e.type);
		t !== n && (Z(ao, e), Z(io, n));
	}
	function fo(e) {
		ao.current === e && (Ri(io), Ri(ao));
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
		for (var n = 0; n < t.length && n < e.length; n++) if (!xr(e[n], t[n])) return !1;
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
			l === null ? s = r : l.next = c, xr(r, t.memoizedState) || (Ms = !0), t.memoizedState = r, t.baseState = s, t.baseQueue = l, n.lastRenderedState = r;
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
			xr(o, t.memoizedState) || (Ms = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function Io() {}
	function Lo(e, t) {
		var n = bo, r = Mo(), i = t(), o = !xr(r.memoizedState, i);
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
			return !xr(e, n);
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
		return yo & 21 ? (xr(n, t) || (n = At(), bo.lanes |= n, Jc |= n, e.baseState = !0), t) : (e.baseState && (e.baseState = !1, Ms = !0), e.memoizedState = n);
	}
	function is(e, t) {
		var n = q;
		q = n !== 0 && 4 > n ? n : 4, e(!0);
		var r = vo.transition;
		vo.transition = {};
		try {
			e(!1), t();
		} finally {
			q = n, vo.transition = r;
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
				if (i.hasEagerState = !0, i.eagerState = s, xr(s, o)) {
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
			r &= e.pendingLanes, n |= r, t.lanes = n, Pt(e, n);
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
				n = (r & ~(1 << 32 - yt(r) - 1)).toString(32) + n, t = ":" + t + "R" + n, n = To++, 0 < n && (t += "H" + n.toString(32)), t += ":";
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
			return (e = e._reactInternals) ? $e(e) === e : !1;
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
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Sr(n, r) || !Sr(i, a) : !0;
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
				n += te(r), r = r.return;
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
			if (n = n.compare, n = n === null ? Sr : n, n(o, r) && e.ref === t.ref) return ec(e, t, i);
		}
		return t.flags |= 1, e = Yl(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function Is(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Sr(a, r) && e.ref === t.ref) if (Ms = !1, t.pendingProps = r = a, (e.lanes & i) !== 0) e.flags & 131072 && (Ms = !0);
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
		}, Z(Gc, Wc), Wc |= n;
		else {
			if (!(n & 1073741824)) return e = a === null ? n : a.baseLanes | n, t.lanes = t.childLanes = 1073741824, t.memoizedState = {
				baseLanes: e,
				cachePool: null,
				transitions: null
			}, t.updateQueue = null, Z(Gc, Wc), Wc |= e, null;
			t.memoizedState = {
				baseLanes: 0,
				cachePool: null,
				transitions: null
			}, r = a === null ? n : a.baseLanes, Z(Gc, Wc), Wc |= r;
		}
		else a === null ? r = n : (r = a.baseLanes | n, t.memoizedState = null), Z(Gc, Wc), Wc |= r;
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
		var o = (t.flags & 128) != 0;
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
		var r = t.pendingProps, i = po.current, a = !1, o = (t.flags & 128) != 0, s;
		if ((s = o) || (s = e !== null && e.memoizedState === null ? !1 : (i & 2) != 0), s ? (a = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (i |= 1), Z(po, i & 1), e === null) return Sa(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? (t.mode & 1 ? e.data === "$!" ? t.lanes = 8 : t.lanes = 1073741824 : t.lanes = 1, null) : (o = r.children, e = r.fallback, a ? (r = t.mode, a = t.child, o = {
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
		if (Z(po, r), !(t.mode & 1)) t.memoizedState = null;
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
				Z(Fa, r._currentValue), r._currentValue = i;
				break;
			case 13:
				if (r = t.memoizedState, r !== null) return r.dehydrated === null ? (n & t.child.childLanes) === 0 ? (Z(po, po.current & 1), e = ec(e, t, n), e === null ? null : e.sibling) : Ks(e, t, n) : (Z(po, po.current & 1), t.flags |= 128, null);
				Z(po, po.current & 1);
				break;
			case 19:
				if (r = (n & t.childLanes) !== 0, e.flags & 128) {
					if (r) return Qs(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), Z(po, po.current), r) break;
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
					i = K(e, i), r = K(e, r), a = [];
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
				else u === "dangerouslySetInnerHTML" ? (l = l ? l.__html : void 0, c = c ? c.__html : void 0, l != null && c !== l && (a ||= []).push(u, l)) : u === "children" ? typeof l != "string" && typeof l != "number" || (a ||= []).push(u, "" + l) : u !== "suppressContentEditableWarning" && u !== "suppressHydrationWarning" && (s.hasOwnProperty(u) ? (l != null && u === "onScroll" && X("scroll", e), a || c === l || (a = [])) : (a ||= []).push(u, l));
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
			case 3: return r = t.stateNode, lo(), Ri(Vi), Ri(Bi), go(), r.pendingContext && (r.context = r.pendingContext, r.pendingContext = null), (e === null || e.child === null) && (wa(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, va !== null && (vl(va), va = null))), oc(t), null;
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
						switch (r[Ti] = t, r[Ei] = o, e = (t.mode & 1) != 0, n) {
							case "dialog":
								X("cancel", r), X("close", r);
								break;
							case "iframe":
							case "object":
							case "embed":
								X("load", r);
								break;
							case "video":
							case "audio":
								for (i = 0; i < Yr.length; i++) X(Yr[i], r);
								break;
							case "source":
								X("error", r);
								break;
							case "img":
							case "image":
							case "link":
								X("error", r), X("load", r);
								break;
							case "details":
								X("toggle", r);
								break;
							case "input":
								se(r, o), X("invalid", r);
								break;
							case "select":
								r._wrapperState = { wasMultiple: !!o.multiple }, X("invalid", r);
								break;
							case "textarea": he(r, o), X("invalid", r);
						}
						for (var c in Oe(n, o), i = null, o) if (o.hasOwnProperty(c)) {
							var l = o[c];
							c === "children" ? typeof l == "string" ? r.textContent !== l && (!0 !== o.suppressHydrationWarning && di(r.textContent, l, e), i = ["children", l]) : typeof l == "number" && r.textContent !== "" + l && (!0 !== o.suppressHydrationWarning && di(r.textContent, l, e), i = ["children", "" + l]) : s.hasOwnProperty(c) && l != null && c === "onScroll" && X("scroll", r);
						}
						switch (n) {
							case "input":
								ie(r), ue(r, o, !0);
								break;
							case "textarea":
								ie(r), _e(r);
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
									X("cancel", e), X("close", e), i = r;
									break;
								case "iframe":
								case "object":
								case "embed":
									X("load", e), i = r;
									break;
								case "video":
								case "audio":
									for (i = 0; i < Yr.length; i++) X(Yr[i], e);
									i = r;
									break;
								case "source":
									X("error", e), i = r;
									break;
								case "img":
								case "image":
								case "link":
									X("error", e), X("load", e), i = r;
									break;
								case "details":
									X("toggle", e), i = r;
									break;
								case "input":
									se(e, r), i = K(e, r), X("invalid", e);
									break;
								case "option":
									i = r;
									break;
								case "select":
									e._wrapperState = { wasMultiple: !!r.multiple }, i = z({}, r, { value: void 0 }), X("invalid", e);
									break;
								case "textarea":
									he(e, r), i = me(e, r), X("invalid", e);
									break;
								default: i = r;
							}
							for (o in Oe(n, i), l = i, l) if (l.hasOwnProperty(o)) {
								var u = l[o];
								o === "style" ? Ee(e, u) : o === "dangerouslySetInnerHTML" ? (u = u ? u.__html : void 0, u != null && xe(e, u)) : o === "children" ? typeof u == "string" ? (n !== "textarea" || u !== "") && Se(e, u) : typeof u == "number" && Se(e, "" + u) : o !== "suppressContentEditableWarning" && o !== "suppressHydrationWarning" && o !== "autoFocus" && (s.hasOwnProperty(o) ? u != null && o === "onScroll" && X("scroll", e) : u != null && S(e, o, u, c));
							}
							switch (n) {
								case "input":
									ie(e), ue(e, r, !1);
									break;
								case "textarea":
									ie(e), _e(e);
									break;
								case "option":
									r.value != null && e.setAttribute("value", "" + W(r.value));
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
								di(r.nodeValue, n, (e.mode & 1) != 0);
								break;
							case 5: !0 !== e.memoizedProps.suppressHydrationWarning && di(r.nodeValue, n, (e.mode & 1) != 0);
						}
						o && (t.flags |= 4);
					} else r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r), r[Ti] = t, t.stateNode = r;
				}
				return oc(t), null;
			case 13:
				if (Ri(po), r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
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
				if (Ri(po), o = t.memoizedState, o === null) return oc(t), null;
				if (r = (t.flags & 128) != 0, c = o.rendering, c === null) if (r) ac(o, !1);
				else {
					if (Kc !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
						if (c = mo(e), c !== null) {
							for (t.flags |= 128, ac(o, !1), r = c.updateQueue, r !== null && (t.updateQueue = r, t.flags |= 4), t.subtreeFlags = 0, r = n, n = t.child; n !== null;) o = n, e = r, o.flags &= 14680066, c = o.alternate, c === null ? (o.childLanes = 0, o.lanes = e, o.child = null, o.subtreeFlags = 0, o.memoizedProps = null, o.memoizedState = null, o.updateQueue = null, o.dependencies = null, o.stateNode = null) : (o.childLanes = c.childLanes, o.lanes = c.lanes, o.child = c.child, o.subtreeFlags = 0, o.deletions = null, o.memoizedProps = c.memoizedProps, o.memoizedState = c.memoizedState, o.updateQueue = c.updateQueue, o.type = c.type, e = c.dependencies, o.dependencies = e === null ? null : {
								lanes: e.lanes,
								firstContext: e.firstContext
							}), n = n.sibling;
							return Z(po, po.current & 1 | 2), t.child;
						}
						e = e.sibling;
					}
					o.tail !== null && lt() > el && (t.flags |= 128, r = !0, ac(o, !1), t.lanes = 4194304);
				}
				else {
					if (!r) if (e = mo(c), e !== null) {
						if (t.flags |= 128, r = !0, n = e.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), ac(o, !0), o.tail === null && o.tailMode === "hidden" && !c.alternate && !_a) return oc(t), null;
					} else 2 * lt() - o.renderingStartTime > el && n !== 1073741824 && (t.flags |= 128, r = !0, ac(o, !1), t.lanes = 4194304);
					o.isBackwards ? (c.sibling = t.child, t.child = c) : (n = o.last, n === null ? t.child = c : n.sibling = c, o.last = c);
				}
				return o.tail === null ? (oc(t), null) : (t = o.tail, o.rendering = t, o.tail = t.sibling, o.renderingStartTime = lt(), t.sibling = null, n = po.current, Z(po, r ? n & 1 | 2 : n & 1), t);
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
			case 3: return lo(), Ri(Vi), Ri(Bi), go(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 5: return fo(t), null;
			case 13:
				if (Ri(po), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(a(340));
					Ea();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return Ri(po), null;
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
		if (pi = sn, e = Er(), Dr(e)) {
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
		}, sn = !1, Q = t; Q !== null;) if (t = Q, e = t.child, t.subtreeFlags & 1028 && e !== null) e.return = t, Q = e;
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
		if (_t && typeof _t.onCommitFiberUnmount == "function") try {
			_t.onCommitFiberUnmount(gt, n);
		} catch {}
		switch (n.tag) {
			case 5: uc || fc(n, t);
			case 6:
				var r = wc, i = Tc;
				wc = null, Ec(e, t, n), wc = r, Tc = i, wc !== null && (Tc ? (e = wc, n = n.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n)) : wc.removeChild(n.stateNode));
				break;
			case 18:
				wc !== null && (Tc ? (e = wc, n = n.stateNode, e.nodeType === 8 ? xi(e.parentNode, n) : e.nodeType === 1 && xi(e, n), an(e)) : xi(wc, n.stateNode));
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
					an(t.containerInfo);
				} catch (t) {
					Rl(e, e.return, t);
				}
				break;
			case 4:
				kc(t, e), jc(e);
				break;
			case 13:
				kc(t, e), jc(e), i = e.child, i.flags & 8192 && (o = i.memoizedState !== null, i.stateNode.isHidden = o, !o || i.alternate !== null && i.alternate.memoizedState !== null || ($c = lt())), r & 4 && Oc(e);
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
										f !== null && an(f);
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
		return $ & 6 ? lt() : ul === -1 ? ul = lt() : ul;
	}
	function pl(e) {
		return e.mode & 1 ? $ & 2 && Uc !== 0 ? Uc & -Uc : Oa.transition === null ? (e = q, e === 0 ? (e = window.event, e = e === void 0 ? 16 : Y(e.type), e) : e) : (dl === 0 && (dl = At()), dl) : 1;
	}
	function ml(e, t, n, r) {
		if (50 < cl) throw cl = 0, ll = null, Error(a(185));
		Mt(e, n, r), (!($ & 2) || e !== Vc) && (e === Vc && (!($ & 2) && (Yc |= n), Kc === 4 && bl(e, Uc)), hl(e, r), n === 1 && $ === 0 && !(t.mode & 1) && (el = lt() + 500, Zi && ta()));
	}
	function hl(e, t) {
		var n = e.callbackNode;
		Ot(e, t);
		var r = Et(e, e === Vc ? Uc : 0);
		if (r === 0) n !== null && ot(n), e.callbackNode = null, e.callbackPriority = 0;
		else if (t = r & -r, e.callbackPriority !== t) {
			if (n != null && ot(n), t === 1) e.tag === 0 ? ea(xl.bind(null, e)) : $i(xl.bind(null, e)), yi(function() {
				!($ & 6) && ta();
			}), n = null;
			else {
				switch (Ft(r)) {
					case 1:
						n = dt;
						break;
					case 4:
						n = ft;
						break;
					case 16:
						n = pt;
						break;
					case 536870912:
						n = ht;
						break;
					default: n = pt;
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
		var r = Et(e, e === Vc ? Uc : 0);
		if (r === 0) return null;
		if (r & 30 || (r & e.expiredLanes) !== 0 || t) t = kl(e, r);
		else {
			t = r;
			var i = $;
			$ |= 2;
			var o = Dl();
			(Vc !== e || Uc !== t) && (tl = null, el = lt() + 500, Tl(e, t));
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
			if (t === 2 && (i = kt(e), i !== 0 && (r = i, t = _l(e, i))), t === 1) throw n = qc, Tl(e, 0), bl(e, r), hl(e, lt()), n;
			if (t === 6) bl(e, r);
			else {
				if (i = e.current.alternate, !(r & 30) && !yl(i) && (t = kl(e, r), t === 2 && (o = kt(e), o !== 0 && (r = o, t = _l(e, o))), t === 1)) throw n = qc, Tl(e, 0), bl(e, r), hl(e, lt()), n;
				switch (e.finishedWork = i, e.finishedLanes = r, t) {
					case 0:
					case 1: throw Error(a(345));
					case 2:
						Pl(e, Qc, tl);
						break;
					case 3:
						if (bl(e, r), (r & 130023424) === r && (t = $c + 500 - lt(), 10 < t)) {
							if (Et(e, 0) !== 0) break;
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
							var s = 31 - yt(r);
							o = 1 << s, s = t[s], s > i && (i = s), r &= ~o;
						}
						if (r = i, r = lt() - r, r = (120 > r ? 120 : 480 > r ? 480 : 1080 > r ? 1080 : 1920 > r ? 1920 : 3e3 > r ? 3e3 : 4320 > r ? 4320 : 1960 * Lc(r / 1960)) - r, 10 < r) {
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
		return hl(e, lt()), e.callbackNode === n ? gl.bind(null, e) : null;
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
						if (!xr(a(), i)) return !1;
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
			var n = 31 - yt(t), r = 1 << n;
			e[n] = -1, t &= ~r;
		}
	}
	function xl(e) {
		if ($ & 6) throw Error(a(327));
		Il();
		var t = Et(e, 0);
		if (!(t & 1)) return hl(e, lt()), null;
		var n = kl(e, t);
		if (e.tag !== 0 && n === 2) {
			var r = kt(e);
			r !== 0 && (t = r, n = _l(e, r));
		}
		if (n === 1) throw n = qc, Tl(e, 0), bl(e, t), hl(e, lt()), n;
		if (n === 6) throw Error(a(345));
		return e.finishedWork = e.current.alternate, e.finishedLanes = t, Pl(e, Qc, tl), hl(e, lt()), null;
	}
	function Sl(e, t) {
		var n = $;
		$ |= 1;
		try {
			return e(t);
		} finally {
			$ = n, $ === 0 && (el = lt() + 500, Zi && ta());
		}
	}
	function Cl(e) {
		ol !== null && ol.tag === 0 && !($ & 6) && Il();
		var t = $;
		$ |= 1;
		var n = Bc.transition, r = q;
		try {
			if (Bc.transition = null, q = 1, e) return e();
		} finally {
			q = r, Bc.transition = n, $ = t, !($ & 6) && ta();
		}
	}
	function wl() {
		Wc = Gc.current, Ri(Gc);
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
					lo(), Ri(Vi), Ri(Bi), go();
					break;
				case 5:
					fo(r);
					break;
				case 4:
					lo();
					break;
				case 13:
					Ri(po);
					break;
				case 19:
					Ri(po);
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
						} else {
							if (!(t & 1)) {
								Os(o, u, t), Ol();
								break a;
							}
							l = Error(a(426));
						}
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
		for (; Hc !== null && !st();) Ml(Hc);
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
		var r = q, i = Bc.transition;
		try {
			Bc.transition = null, q = 1, Fl(e, t, n, r);
		} finally {
			Bc.transition = i, q = r;
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
		if (Nt(e, o), e === Vc && (Hc = Vc = null, Uc = 0), !(n.subtreeFlags & 2064) && !(n.flags & 2064) || al || (al = !0, Wl(pt, function() {
			return Il(), null;
		})), o = (n.flags & 15990) != 0, n.subtreeFlags & 15990 || o) {
			o = Bc.transition, Bc.transition = null;
			var s = q;
			q = 1;
			var c = $;
			$ |= 4, zc.current = null, hc(e, n), Ac(n, e), Or(mi), sn = !!pi, mi = pi = null, e.current = n, Mc(n, e, i), ct(), $ = c, q = s, Bc.transition = o;
		} else e.current = n;
		if (al && (al = !1, ol = e, sl = i), o = e.pendingLanes, o === 0 && (il = null), vt(n.stateNode, r), hl(e, lt()), t !== null) for (r = e.onRecoverableError, n = 0; n < t.length; n++) i = t[n], r(i.value, {
			componentStack: i.stack,
			digest: i.digest
		});
		if (nl) throw nl = !1, e = rl, rl = null, e;
		return sl & 1 && e.tag !== 0 && Il(), o = e.pendingLanes, o & 1 ? e === ll ? cl++ : (cl = 0, ll = e) : cl = 0, ta(), null;
	}
	function Il() {
		if (ol !== null) {
			var e = Ft(sl), t = Bc.transition, n = q;
			try {
				if (Bc.transition = null, q = 16 > e ? 16 : e, ol === null) var r = !1;
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
					if ($ = i, ta(), _t && typeof _t.onPostCommitFiberRoot == "function") try {
						_t.onPostCommitFiberRoot(gt, e);
					} catch {}
					r = !0;
				}
				return r;
			} finally {
				q = n, Bc.transition = t;
			}
		}
		return !1;
	}
	function Ll(e, t, n) {
		t = Ss(n, t), t = Es(e, t, 1), e = Qa(e, t, 1), t = fl(), e !== null && (Mt(e, 1, t), hl(e, t));
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
					e = Ss(n, e), e = Ds(t, e, 1), t = Qa(t, e, 1), e = fl(), t !== null && (Mt(t, 1, e), hl(t, e));
					break;
				}
			}
			t = t.return;
		}
	}
	function zl(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), t = fl(), e.pingedLanes |= e.suspendedLanes & n, Vc === e && (Uc & n) === n && (Kc === 4 || Kc === 3 && (Uc & 130023424) === Uc && 500 > lt() - $c ? Tl(e, 0) : Xc |= n), hl(e, t);
	}
	function Bl(e, t) {
		t === 0 && (e.mode & 1 ? (t = wt, wt <<= 1, !(wt & 130023424) && (wt = 4194304)) : t = 1);
		var n = fl();
		e = qa(e, t), e !== null && (Mt(e, t, n), hl(e, n));
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
					if (r = t.type._context, i = t.pendingProps, o = t.memoizedProps, s = i.value, Z(Fa, r._currentValue), r._currentValue = s, o !== null) if (xr(o.value, s)) {
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
		return at(e, t);
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
		this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = jt(0), this.expirationTimes = jt(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = jt(0), this.identifierPrefix = r, this.onRecoverableError = i, this.mutableSourceEagerHydrationData = null;
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
			if ($e(e) !== e || e.tag !== 1) throw Error(a(170));
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
		return e = nu(n, r, !0, e, i, a, o, s, c), e.context = iu(null), n = e.current, r = fl(), i = pl(n), a = Za(r, i), a.callback = t ?? null, Qa(n, a, i), e.current.lanes = i, Mt(e, i, r), hl(e, r), e;
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
			var t = zt();
			e = {
				blockedOn: null,
				target: e,
				priority: t
			};
			for (var n = 0; n < Jt.length && t !== 0 && t < Jt[n].priority; n++);
			Jt.splice(n, 0, e), n === 0 && $t(e);
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
	It = function(e) {
		switch (e.tag) {
			case 3:
				var t = e.stateNode;
				if (t.current.memoizedState.isDehydrated) {
					var n = Tt(t.pendingLanes);
					n !== 0 && (Pt(t, n | 1), hl(t, lt()), !($ & 6) && (el = lt() + 500, ta()));
				}
				break;
			case 13: Cl(function() {
				var t = qa(e, 1);
				t !== null && ml(t, e, 1, fl());
			}), lu(e, 1);
		}
	}, Lt = function(e) {
		if (e.tag === 13) {
			var t = qa(e, 134217728);
			t !== null && ml(t, e, 134217728, fl()), lu(e, 134217728);
		}
	}, Rt = function(e) {
		if (e.tag === 13) {
			var t = pl(e), n = qa(e, t);
			n !== null && ml(n, e, t, fl()), lu(e, t);
		}
	}, zt = function() {
		return q;
	}, Bt = function(e, t) {
		var n = q;
		try {
			return q = e, t();
		} finally {
			q = n;
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
							ae(r), le(r, i);
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
			return e = rt(e), e === null ? null : e.stateNode;
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
			gt = Su.inject(xu), _t = Su;
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
		return e = rt(t), e = e === null ? null : e.stateNode, e;
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
})), c = n(), l = s(), u = "rules_on_engine_failure", d = /* @__PURE__ */ "id.jobId.category.kind.taskType.labelCode.status.progress.messageCode.createdAt.startedAt.updatedAt.finishedAt.errorCode.generationMode.adapter.requestedMode.mode.attemptedEngine.finalEngine.fallbackReason.artifactTypes.artifactCount.proposalId.proposalStatus.resultStatus".split("."), f = [
	"schemaVersion",
	"storeRevision",
	"jobsStoreRevision",
	"retention",
	"total",
	"entries"
], p = ["maxEntries", "maxDays"], m = /* @__PURE__ */ new Set(["companion", "task"]), h = /* @__PURE__ */ new Set([
	"index",
	"rss",
	"setup",
	"agent_bridge",
	"agent_cli_install",
	"briefing",
	"company_analysis",
	"topic_report",
	"market_state_snapshot"
]), g = /* @__PURE__ */ new Set([
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
]), _ = /* @__PURE__ */ new Set([
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
]), v = /* @__PURE__ */ new Set([
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
]), y = /* @__PURE__ */ new Set([
	"llm_api",
	"llm_cli",
	"rules",
	"none"
]), b = /* @__PURE__ */ new Set([
	"auto",
	"codex",
	"claude",
	"antigravity",
	"openai_api",
	"gemini_api",
	"claude_api",
	"rules",
	"none"
]), x = /* @__PURE__ */ new Set(["direct", "cli"]), S = /* @__PURE__ */ new Set([
	"collect",
	"index",
	"install",
	"answer",
	"generate",
	"revise",
	"fallback"
]), C = /* @__PURE__ */ new Set([
	"api",
	"cli",
	"rules",
	"none"
]), w = /* @__PURE__ */ new Set([
	"engine_unavailable",
	"engine_failed",
	"confirmed_zero_evidence"
]), T = /* @__PURE__ */ new Set([
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
]), E = /* @__PURE__ */ new Set([
	"pending",
	"applying",
	"applied",
	"rejected",
	"stale",
	"conflict",
	"failed_apply",
	"unavailable"
]), D = /* @__PURE__ */ new Set([
	"done",
	"cancelled",
	"failed"
]), O = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/;
function k(e, t) {
	if (!P(e)) return !1;
	let n = Object.keys(e).sort(), r = [...t].sort();
	return n.length === r.length && n.every((e, t) => e === r[t]);
}
function A(e) {
	if (!k(e, d)) return !1;
	let t = (e, t) => e === null || t.has(e), n = (e) => e === null || typeof e == "string" && O.test(e);
	return typeof e.id == "string" && /^wl_[0-9a-f]{24}$/.test(e.id) && typeof e.jobId == "string" && m.has(e.category) && h.has(e.kind) && g.has(e.taskType) && _.has(e.labelCode) && v.has(e.status) && Number.isInteger(e.progress) && e.progress >= 0 && e.progress <= 100 && v.has(e.messageCode) && typeof e.createdAt == "string" && O.test(e.createdAt) && typeof e.updatedAt == "string" && O.test(e.updatedAt) && n(e.startedAt) && n(e.finishedAt) && t(e.errorCode, T) && y.has(e.generationMode) && b.has(e.adapter) && t(e.requestedMode, x) && S.has(e.mode) && t(e.attemptedEngine, C) && t(e.finalEngine, C) && t(e.fallbackReason, w) && Array.isArray(e.artifactTypes) && e.artifactTypes.every((e) => typeof e == "string") && Number.isInteger(e.artifactCount) && e.artifactCount >= 0 && (e.proposalId === null || typeof e.proposalId == "string") && t(e.proposalStatus, E) && t(e.resultStatus, D);
}
function j(e) {
	if (!k(e, f) || e.schemaVersion !== 1 || !Number.isInteger(e.storeRevision) || !Number.isInteger(e.jobsStoreRevision) || !Number.isInteger(e.total) || !Array.isArray(e.entries) || !e.entries.every(A) || !k(e.retention, p) || e.retention.maxEntries !== 200 || e.retention.maxDays !== 30) throw Error("work_log_contract_invalid");
	return e;
}
var M = class extends Error {
	path;
	status;
	code;
	payload;
	name = "ApiRequestError";
	constructor(e, t, n, r) {
		super(`${e} failed: ${t}${n ? ` (${n})` : ""}`), this.path = e, this.status = t, this.code = n, this.payload = r;
	}
};
function N(e) {
	return e === "queued" || e === "running" || e === "cancel_requested" || e === "committing";
}
function P(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
async function F(e) {
	try {
		return await e.json();
	} catch {
		return null;
	}
}
async function I(e, t) {
	let n = await fetch(e, t), r = await F(n);
	if (!n.ok) {
		let t = P(r) ? r : null, i = t?.error, a = typeof i == "string" ? i : "request_failed";
		throw new M(e, n.status, a, t);
	}
	if (r === null) throw Error(`${e} returned an empty response`);
	return r;
}
async function L(e, t = {}) {
	return I(e, {
		headers: { "Content-Type": "application/json" },
		signal: t.signal
	});
}
async function R(e, t, n = {}) {
	return I(e, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(t),
		signal: n.signal
	});
}
async function z(e, t = {}) {
	return L(`/api/investment-notes/${encodeURIComponent(e)}/intelligence`, t);
}
async function B(e, t, n = {}) {
	return R(`/api/theses/${encodeURIComponent(e)}/review/checkpoints`, t, n);
}
async function V(e, t = {}) {
	return R(`/api/theses/${encodeURIComponent(e)}/delta`, { period: "90d" }, t);
}
async function ee(e, t, n = {}) {
	return I(e, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(t),
		signal: n.signal
	});
}
async function H(e, t, n = {}) {
	return I(e, {
		method: "DELETE",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(t),
		signal: n.signal
	});
}
//#endregion
//#region src/app/agentContext.ts
var te = /* @__PURE__ */ new Map(), U = "";
function ne(e) {
	let t = { ...e };
	return window.FolioAgent = {
		...window.FolioAgent || {},
		currentContext: t
	}, t;
}
function W(e, t = {}) {
	let n = { ...t };
	return te.set(e, n), U === e ? ne(n) : n;
}
function re(e, t = {}) {
	return W(e, {
		...te.get(e) || {},
		...t
	});
}
function G(e) {
	te.delete(e), U === e && ne({});
}
function ie(e, t = {}) {
	U = e, te.has(e) || te.set(e, { ...t });
	let n = { ...te.get(e) || {} };
	return delete n.selectedText, delete n.visibleSection, te.set(e, n), ne(n);
}
function ae(e = {}) {
	U ? re(U, e) : ne(e), window.FolioBridge?.openAgentDock?.(e);
}
//#endregion
//#region node_modules/react/cjs/react-jsx-runtime.production.min.js
var oe = /* @__PURE__ */ e(((e) => {
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
})), K = (/* @__PURE__ */ e(((e, t) => {
	t.exports = oe();
})))();
function se(e) {
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
function ce(e) {
	return se(e).map((e, t) => e.type === "strong" ? /* @__PURE__ */ (0, K.jsx)("strong", { children: e.value }, t) : e.type === "code" ? /* @__PURE__ */ (0, K.jsx)("code", { children: e.value }, t) : e.type === "link" ? /^https?:\/\//i.test(e.href) ? /* @__PURE__ */ (0, K.jsx)("a", {
		href: e.href,
		target: "_blank",
		rel: "noreferrer",
		children: e.label
	}, t) : /* @__PURE__ */ (0, K.jsx)("code", {
		title: e.href,
		children: e.label
	}, t) : /* @__PURE__ */ (0, K.jsx)("span", { children: e.value }, t));
}
function le(e, t) {
	e.length &&= (t.push(/* @__PURE__ */ (0, K.jsx)("p", { children: ce(e.join(" ")) }, `p-${t.length}`)), 0);
}
function ue({ text: e = "" }) {
	let t = [], n = [], r = [], i = "";
	function a() {
		if (!r.length) return;
		let e = r.map((e, t) => /* @__PURE__ */ (0, K.jsx)("li", { children: ce(e) }, t));
		t.push(i === "ol" ? /* @__PURE__ */ (0, K.jsx)("ol", { children: e }, `ol-${t.length}`) : /* @__PURE__ */ (0, K.jsx)("ul", { children: e }, `ul-${t.length}`)), r = [], i = "";
	}
	for (let o of e.replace(/\r\n/g, "\n").split("\n")) {
		let e = o.trim();
		if (!e) {
			le(n, t), a();
			continue;
		}
		let s = e.match(/^(#{2,4})\s+(.+)$/);
		if (s) {
			le(n, t), a(), t.push(/* @__PURE__ */ (0, K.jsx)("h4", { children: ce(s[2]) }, `h-${t.length}`));
			continue;
		}
		let c = e.match(/^\d+[.)]\s+(.+)$/);
		if (c) {
			le(n, t), i && i !== "ol" && a(), i = "ol", r.push(c[1]);
			continue;
		}
		let l = e.match(/^[-*•]\s+(.+)$/);
		if (l) {
			le(n, t), i && i !== "ul" && a(), i = "ul", r.push(l[1]);
			continue;
		}
		if (r.length) {
			r[r.length - 1] = `${r[r.length - 1]} ${e}`;
			continue;
		}
		n.push(e);
	}
	return le(n, t), a(), /* @__PURE__ */ (0, K.jsx)("div", {
		className: "agent-chat-markdown",
		children: t
	});
}
function de({ state: e = "pending", title: t, meta: n }) {
	return /* @__PURE__ */ (0, K.jsxs)("div", {
		className: `agent-run-card ${e}`,
		children: [/* @__PURE__ */ (0, K.jsx)("span", {
			className: "agent-run-icon",
			"aria-hidden": "true"
		}), /* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: t }), n && /* @__PURE__ */ (0, K.jsx)("span", { children: n })] })]
	});
}
//#endregion
//#region src/app/agentProposalLifecycle.ts
var fe = "folio:proposal-lifecycle", pe = 1e3, me = 12e3, he = "수정 제안을 불러오지 못했습니다. Agent 작업 기록에서 다시 확인해 주세요.", ge = /* @__PURE__ */ new Set([
	"applied",
	"rejected",
	"stale",
	"conflict",
	"failed_apply"
]), _e = /* @__PURE__ */ new Set([
	"pending",
	"applying",
	...ge
]), ve = /* @__PURE__ */ new Set([
	"briefing",
	"company_analysis",
	"topic_report"
]), ye = /* @__PURE__ */ new Set([
	"both",
	"us",
	"kr",
	"none"
]), be = [
	"marketScope",
	"proposalId",
	"reportId",
	"reportKind",
	"status",
	"targetRevision"
].sort(), xe = ["hash", "number"].sort(), Se = /^[0-9a-f]{64}$/, Ce = /^(?:[0-9a-f]{12}|[0-9a-f]{32})$/, we = {
	proposal: null,
	proposalStatus: "",
	notice: ""
};
function Te(e) {
	return String(e || "").slice(0, pe);
}
function Ee(e) {
	return String(e || "").slice(0, me);
}
function De() {
	throw Error("proposal_contract_invalid");
}
function Oe(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function ke(e, t) {
	if (!Oe(e)) return !1;
	let n = Object.keys(e).sort();
	return n.length === t.length && n.every((e, n) => e === t[n]);
}
function Ae(e) {
	return typeof e == "string" && e.trim().length > 0;
}
function je(e) {
	return typeof e == "string" && _e.has(e);
}
function Me(e) {
	return typeof e == "string" && ve.has(e);
}
function Ne(e) {
	return typeof e == "string" && ye.has(e);
}
function Pe() {
	return {
		proposal: null,
		proposalStatus: "",
		notice: he
	};
}
function Fe(e, t) {
	return (!Oe(e) || e.schemaVersion !== 2 || e.id !== t || !Ce.test(t) || e.status !== "pending" && e.status !== "applying" || !Me(e.reportKind) || !Ae(e.reportId) || !Ne(e.marketScope) || typeof e.summary != "string" || typeof e.diff != "string") && De(), {
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
async function Ie(e, t = { get: (e) => L(e) }) {
	if (!Oe(e) || !("proposalId" in e) || e.proposalId === null || e.proposalId === "") return we;
	if (typeof e.proposalId != "string" || !Ce.test(e.proposalId)) return Pe();
	let n = e.proposalId;
	try {
		return Fe(await t.get(`/api/agent/proposals/${encodeURIComponent(n)}`), n);
	} catch {
		return Pe();
	}
}
function Le(e) {
	return e === null ? null : ((!ke(e, xe) || typeof e.number != "number" || !Number.isInteger(e.number) || e.number < 1 || typeof e.hash != "string" || !Se.test(e.hash)) && De(), {
		number: e.number,
		hash: e.hash
	});
}
function Re(e, t) {
	(!Oe(e) || !je(e.status) || !Me(e.reportKind) || !Ne(e.marketScope)) && De();
	let n = Ae(e.proposalId) ? e.proposalId : t && Ae(e.id) ? e.id : De();
	return Ae(e.reportId) || De(), {
		proposalId: n,
		status: e.status,
		reportKind: e.reportKind,
		reportId: e.reportId,
		marketScope: e.marketScope,
		targetRevision: Le(e.targetRevision)
	};
}
function ze(e, t) {
	ke(e, be) || De();
	let n = Re(e, !1), r = t === "approve" ? "applied" : t === "reject" ? "rejected" : De();
	return n.status !== r && De(), n;
}
async function Be(e, t, n) {
	(!Ae(e) || t !== "approve" && t !== "reject") && De();
	let r = `/api/agent/proposals/${encodeURIComponent(e)}`;
	try {
		return ze(await n.post(r, { action: t }), t);
	} catch (e) {
		if (!(e instanceof M) || e.status >= 200 && e.status < 300) throw e;
		let t;
		try {
			t = Re(await n.get(r), !0);
		} catch {
			throw e;
		}
		if (!ge.has(t.status)) throw e;
		return t;
	}
}
function Ve(e, t) {
	return Be(e, t, {
		post: (e, t) => R(e, t),
		get: (e) => L(e)
	});
}
function He(e) {
	window.dispatchEvent(new CustomEvent(fe, { detail: e }));
}
function Ue(e, t) {
	return e.status !== "applied" || !t || t.reportKind !== e.reportKind || String(t.reportId || "") !== e.reportId ? !1 : e.reportKind !== "briefing" || String(t.marketScope || "") === e.marketScope;
}
//#endregion
//#region src/app/AgentWorkLog.tsx
function We(e) {
	return e instanceof M ? e.code || `http_${e.status}` : e instanceof Error && /^[a-z0-9_]+$/.test(e.message) ? e.message : "request_failed";
}
function Ge(e) {
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? "시간 확인 불가" : new Intl.DateTimeFormat("ko-KR", {
		dateStyle: "short",
		timeStyle: "short"
	}).format(t);
}
function Ke(e) {
	return e ? e.split("_").join(" · ") : "없음";
}
function qe({ surface: e, pageSize: t = 20, defaultFilter: n = "all", refreshKey: r = 0 }) {
	let [i, a] = (0, c.useState)(n), [o, s] = (0, c.useState)(0), [l, u] = (0, c.useState)(null), [d, f] = (0, c.useState)(!0), [p, m] = (0, c.useState)(""), [h, g] = (0, c.useState)(null), [_, v] = (0, c.useState)(null), [y, b] = (0, c.useState)(!1), [x, S] = (0, c.useState)(""), [C, w] = (0, c.useState)(""), [T, E] = (0, c.useState)(null), [D, O] = (0, c.useState)("migrate_keep_original"), [k, A] = (0, c.useState)(!1), [M, N] = (0, c.useState)(""), [P, F] = (0, c.useState)(""), [I, z] = (0, c.useState)(null), [B, V] = (0, c.useState)(""), [ee, te] = (0, c.useState)(""), U = (0, c.useRef)(0), ne = (0, c.useRef)(null), W = (0, c.useRef)(!1), re = (0, c.useRef)(!1), G = (0, c.useRef)(!1), ie = (0, c.useRef)(null), ae = (0, c.useRef)(null), oe = (0, c.useCallback)(async () => {
		let e = ++U.current;
		ne.current?.abort();
		let n = new AbortController();
		ne.current = n, f(!0), m("");
		try {
			let r = j(await L(`/api/agent/work-log?kind=${i}&limit=${t}&offset=${o}`, { signal: n.signal }));
			if (e !== U.current) return;
			u(r);
		} catch (t) {
			if (n.signal.aborted || e !== U.current) return;
			m(We(t));
		} finally {
			e === U.current && f(!1);
		}
	}, [
		i,
		o,
		t
	]);
	(0, c.useEffect)(() => (oe(), () => ne.current?.abort()), [oe, r]), (0, c.useEffect)(() => {
		let e = () => {
			z(null), oe();
		};
		return window.addEventListener(fe, e), () => window.removeEventListener(fe, e);
	}, [oe]), (0, c.useEffect)(() => {
		if (!h) return;
		ie.current?.querySelector("button:not([disabled]), input:not([disabled])")?.focus();
		let e = (e) => {
			if (e.key === "Escape" && se(), e.key !== "Tab" || !ie.current) return;
			let t = Array.from(ie.current.querySelectorAll("button:not([disabled]), input:not([disabled])"));
			if (!t.length) return;
			let n = t[0], r = t[t.length - 1];
			e.shiftKey && document.activeElement === n ? (e.preventDefault(), r.focus()) : !e.shiftKey && document.activeElement === r && (e.preventDefault(), n.focus());
		};
		return document.addEventListener("keydown", e), () => document.removeEventListener("keydown", e);
	}, [h]);
	function se() {
		g(null), v(null), E(null), S(""), N(""), window.setTimeout(() => ae.current?.focus(), 0);
	}
	function ce(e) {
		a(e), s(0), z(null), te("");
	}
	async function le(e) {
		if (!W.current) {
			W.current = !0, ae.current = e, b(!0), S(""), w("");
			try {
				let e = await R("/api/agent/work-log/clear-preview", { scope: i });
				v(e), g("clear");
			} catch (e) {
				S(We(e));
			} finally {
				W.current = !1, b(!1);
			}
		}
	}
	async function ue() {
		if (!(!_ || W.current)) {
			W.current = !0, b(!0), S("");
			try {
				let e = await H("/api/agent/work-log", {
					scope: _.scope,
					previewToken: _.previewToken
				});
				w(`${e.hiddenCount}건을 목록에서 숨겼습니다.`), se(), s(0), await oe();
			} catch (e) {
				v(null), S(We(e));
			} finally {
				W.current = !1, b(!1);
			}
		}
	}
	async function de(e) {
		if (!re.current) {
			re.current = !0, ae.current = e, A(!0), N(""), F("");
			try {
				let e = await R("/api/agent/work-log/migration-preview", {});
				E(e), O("migrate_keep_original"), g("migration");
			} catch (e) {
				N(We(e));
			} finally {
				re.current = !1, A(!1);
			}
		}
	}
	async function pe() {
		if (!(!T || re.current || T.collisions.length > 0)) {
			re.current = !0, A(!0), N("");
			try {
				let e = await R("/api/agent/work-log/migration-confirm", {
					previewToken: T.previewToken,
					action: D
				});
				F(`${e.migratedJobs}건을 마이그레이션했습니다.`), se(), s(0), await oe();
			} catch (e) {
				E(null), N(We(e));
			} finally {
				re.current = !1, A(!1);
			}
		}
	}
	async function me(e) {
		if (!(!e.proposalId || G.current)) {
			G.current = !0, V(e.proposalId), te(""), z(null);
			try {
				let t = await L(`/api/agent/proposals/${encodeURIComponent(e.proposalId)}`);
				if (t.id !== e.proposalId) throw Error("proposal_identity_mismatch");
				if (t.status !== "pending" && t.status !== "applying") throw Error("proposal_not_active");
				z(t);
			} catch (e) {
				te(We(e)), await oe();
			} finally {
				G.current = !1, V("");
			}
		}
	}
	let he = l?.entries || [], ge = !!(l && o + t < l.total);
	return /* @__PURE__ */ (0, K.jsxs)("section", {
		className: `work-log work-log-${e}`,
		"data-qa": "work-log",
		"aria-busy": d,
		children: [
			/* @__PURE__ */ (0, K.jsxs)("header", {
				className: "work-log-head",
				children: [/* @__PURE__ */ (0, K.jsxs)("div", { children: [
					/* @__PURE__ */ (0, K.jsx)("p", {
						className: "section-kicker",
						children: "Agent Work Log"
					}),
					/* @__PURE__ */ (0, K.jsx)("h2", { children: "Agent 작업 기록" }),
					/* @__PURE__ */ (0, K.jsx)("p", { children: "작업 본문이나 개인 컨텍스트 없이 안전한 상태 메타데이터만 표시합니다." })
				] }), /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "work-log-actions",
					children: [
						/* @__PURE__ */ (0, K.jsx)("button", {
							className: "filter-btn clear",
							type: "button",
							"data-qa": "work-log-refresh",
							disabled: d,
							onClick: () => void oe(),
							children: "새로고침"
						}),
						/* @__PURE__ */ (0, K.jsx)("button", {
							className: "filter-btn clear",
							type: "button",
							"data-qa": "work-log-clear-preview",
							disabled: y,
							onClick: (e) => void le(e.currentTarget),
							children: "기록 숨기기"
						}),
						/* @__PURE__ */ (0, K.jsx)("button", {
							className: "filter-btn clear",
							type: "button",
							"data-qa": "work-log-migration-preview",
							disabled: k,
							onClick: (e) => void de(e.currentTarget),
							children: "이전 기록 가져오기"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, K.jsx)("div", {
				className: "work-log-filters",
				"data-qa": "work-log-filter",
				"aria-label": "작업 범주",
				children: [
					"all",
					"companion",
					"task"
				].map((e) => /* @__PURE__ */ (0, K.jsx)("button", {
					type: "button",
					className: `filter-btn${i === e ? " active" : ""}`,
					"data-qa": `work-log-filter-${e}`,
					"aria-pressed": i === e,
					onClick: () => ce(e),
					children: e === "all" ? "전체" : e === "companion" ? "답변" : "작업"
				}, e))
			}),
			d && !l && /* @__PURE__ */ (0, K.jsx)("p", {
				"data-qa": "work-log-loading",
				role: "status",
				children: "작업 기록을 불러오는 중입니다."
			}),
			p && /* @__PURE__ */ (0, K.jsxs)("p", {
				className: "react-dashboard-error",
				"data-qa": "work-log-error",
				"data-error-code": p,
				role: "alert",
				children: [
					"작업 기록을 불러오지 못했습니다. (",
					p,
					")"
				]
			}),
			x && /* @__PURE__ */ (0, K.jsxs)("p", {
				className: "react-dashboard-error",
				"data-qa": "work-log-clear-error",
				"data-error-code": x,
				children: [
					"숨기기 미리보기가 만료되었거나 실패했습니다. 다시 미리보세요. (",
					x,
					")"
				]
			}),
			C && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-warning",
				"data-qa": "work-log-clear-success",
				role: "status",
				children: C
			}),
			M && /* @__PURE__ */ (0, K.jsxs)("p", {
				className: "react-dashboard-error",
				"data-qa": "work-log-migration-error",
				"data-error-code": M,
				children: [
					"마이그레이션을 완료하지 못했습니다. 다시 미리보세요. (",
					M,
					")"
				]
			}),
			P && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-warning",
				"data-qa": "work-log-migration-success",
				role: "status",
				children: P
			}),
			ee && /* @__PURE__ */ (0, K.jsxs)("p", {
				className: "react-dashboard-error",
				"data-qa": "work-log-proposal-error",
				"data-error-code": ee,
				children: [
					"제안이 만료되었거나 현재 열 수 없습니다. (",
					ee,
					")"
				]
			}),
			!d && !p && he.length === 0 && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "work-log-empty",
				"data-qa": "work-log-empty",
				children: "표시할 Agent 작업 기록이 없습니다."
			}),
			he.length > 0 && /* @__PURE__ */ (0, K.jsx)("div", {
				className: "work-log-list",
				"data-qa": "work-log-list",
				children: he.map((e) => /* @__PURE__ */ (0, K.jsxs)("article", {
					className: `work-log-item status-${e.status}`,
					"data-qa": "work-log-item",
					children: [/* @__PURE__ */ (0, K.jsxs)("div", {
						className: "work-log-item-main",
						children: [
							/* @__PURE__ */ (0, K.jsxs)("div", {
								className: "work-log-item-title",
								children: [/* @__PURE__ */ (0, K.jsx)("strong", {
									"data-qa": "work-log-task-type",
									children: Ke(e.taskType)
								}), /* @__PURE__ */ (0, K.jsxs)("span", { children: [
									Ke(e.category),
									" · ",
									Ke(e.labelCode)
								] })]
							}),
							/* @__PURE__ */ (0, K.jsxs)("span", {
								className: "work-log-status",
								"data-qa": "work-log-status",
								children: [
									Ke(e.status),
									" · ",
									e.progress,
									"%"
								]
							}),
							/* @__PURE__ */ (0, K.jsxs)("span", {
								"data-qa": "work-log-execution",
								children: [
									Ke(e.generationMode),
									" · ",
									Ke(e.adapter),
									" · ",
									Ke(e.attemptedEngine),
									" → ",
									Ke(e.finalEngine)
								]
							}),
							e.fallbackReason && /* @__PURE__ */ (0, K.jsxs)("span", {
								"data-qa": "work-log-fallback",
								children: ["fallback · ", Ke(e.fallbackReason)]
							}),
							/* @__PURE__ */ (0, K.jsxs)("span", {
								"data-qa": "work-log-artifacts",
								children: [
									"산출물 ",
									e.artifactCount,
									"건",
									e.artifactTypes.length ? ` · ${e.artifactTypes.join(", ")}` : ""
								]
							}),
							e.proposalStatus && /* @__PURE__ */ (0, K.jsxs)("span", {
								"data-qa": "work-log-proposal-status",
								children: ["제안 · ", Ke(e.proposalStatus)]
							}),
							e.errorCode && /* @__PURE__ */ (0, K.jsxs)("span", {
								className: "work-log-error-code",
								children: ["오류 · ", Ke(e.errorCode)]
							})
						]
					}), /* @__PURE__ */ (0, K.jsxs)("div", {
						className: "work-log-item-side",
						children: [/* @__PURE__ */ (0, K.jsx)("time", {
							"data-qa": "work-log-time",
							dateTime: e.updatedAt,
							children: Ge(e.finishedAt || e.updatedAt)
						}), e.proposalId && (e.proposalStatus === "pending" || e.proposalStatus === "applying") && /* @__PURE__ */ (0, K.jsx)("button", {
							type: "button",
							className: "filter-btn clear",
							"data-qa": "work-log-proposal-open",
							disabled: B === e.proposalId,
							onClick: () => void me(e),
							children: B === e.proposalId ? /* @__PURE__ */ (0, K.jsx)("span", {
								"data-qa": "work-log-proposal-loading",
								children: "불러오는 중"
							}) : "승인 검토"
						})]
					})]
				}, e.id))
			}),
			l && /* @__PURE__ */ (0, K.jsxs)("footer", {
				className: "work-log-footer",
				children: [/* @__PURE__ */ (0, K.jsxs)("p", {
					"data-qa": "work-log-retention",
					children: [
						"최근 ",
						l.retention.maxDays,
						"일, 최대 ",
						l.retention.maxEntries,
						"건을 표시합니다."
					]
				}), /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "work-log-pagination",
					children: [
						/* @__PURE__ */ (0, K.jsx)("span", {
							"data-qa": "work-log-page-summary",
							children: l.total ? `${o + 1}–${Math.min(o + t, l.total)} / ${l.total}` : "0 / 0"
						}),
						/* @__PURE__ */ (0, K.jsx)("button", {
							type: "button",
							"data-qa": "work-log-page-prev",
							disabled: o === 0 || d,
							onClick: () => s(Math.max(0, o - t)),
							children: "이전"
						}),
						/* @__PURE__ */ (0, K.jsx)("button", {
							type: "button",
							"data-qa": "work-log-page-next",
							disabled: !ge || d,
							onClick: () => s(o + t),
							children: "다음"
						})
					]
				})]
			}),
			h === "clear" && _ && /* @__PURE__ */ (0, K.jsx)("div", {
				className: "work-log-dialog-backdrop",
				children: /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "work-log-dialog",
					ref: ie,
					role: "dialog",
					"aria-modal": "true",
					"aria-labelledby": "work-log-clear-title",
					"data-qa": "work-log-clear-dialog",
					children: [
						/* @__PURE__ */ (0, K.jsx)("h3", {
							id: "work-log-clear-title",
							children: "작업 기록 숨기기"
						}),
						/* @__PURE__ */ (0, K.jsxs)("p", {
							"data-qa": "work-log-clear-count",
							children: [
								"현재 범위 ",
								_.count,
								"건"
							]
						}),
						/* @__PURE__ */ (0, K.jsx)("p", { children: "목록에서만 숨깁니다. 공유 작업, 보고서, 제안, 레거시 파일은 삭제하지 않습니다." }),
						/* @__PURE__ */ (0, K.jsxs)("div", {
							className: "work-log-dialog-actions",
							children: [/* @__PURE__ */ (0, K.jsx)("button", {
								type: "button",
								"data-qa": "work-log-clear-confirm",
								disabled: y,
								onClick: () => void ue(),
								children: "숨기기 확인"
							}), /* @__PURE__ */ (0, K.jsx)("button", {
								type: "button",
								"data-qa": "work-log-clear-cancel",
								onClick: se,
								children: "취소"
							})]
						})
					]
				})
			}),
			h === "migration" && T && /* @__PURE__ */ (0, K.jsx)("div", {
				className: "work-log-dialog-backdrop",
				children: /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "work-log-dialog",
					ref: ie,
					role: "dialog",
					"aria-modal": "true",
					"aria-labelledby": "work-log-migration-title",
					"data-qa": "work-log-migration-dialog",
					children: [
						/* @__PURE__ */ (0, K.jsx)("h3", {
							id: "work-log-migration-title",
							children: "이전 기록 가져오기"
						}),
						/* @__PURE__ */ (0, K.jsxs)("p", {
							"data-qa": "work-log-migration-summary",
							children: [
								"이전 ",
								T.legacyJobs,
								"건 · 가져올 수 있음 ",
								T.migratableJobs,
								"건 · ",
								Ge(T.expiresAt),
								"까지"
							]
						}),
						T.collisions.length > 0 && /* @__PURE__ */ (0, K.jsxs)("p", {
							className: "react-dashboard-error",
							"data-qa": "work-log-migration-collisions",
							children: [
								"충돌 ",
								T.collisions.length,
								"건이 있어 진행할 수 없습니다."
							]
						}),
						/* @__PURE__ */ (0, K.jsxs)("label", { children: [/* @__PURE__ */ (0, K.jsx)("input", {
							type: "radio",
							name: "migration-action",
							"data-qa": "work-log-migration-keep",
							checked: D === "migrate_keep_original",
							onChange: () => O("migrate_keep_original")
						}), " 원본 유지"] }),
						/* @__PURE__ */ (0, K.jsxs)("label", { children: [/* @__PURE__ */ (0, K.jsx)("input", {
							type: "radio",
							name: "migration-action",
							"data-qa": "work-log-migration-delete-original",
							checked: D === "migrate_delete_original",
							onChange: () => O("migrate_delete_original")
						}), " 성공 후 이전 jobs 파일 삭제"] }),
						/* @__PURE__ */ (0, K.jsxs)("div", {
							className: "work-log-dialog-actions",
							children: [/* @__PURE__ */ (0, K.jsx)("button", {
								type: "button",
								"data-qa": "work-log-migration-confirm",
								disabled: k || T.collisions.length > 0,
								onClick: () => void pe(),
								children: "마이그레이션 확인"
							}), /* @__PURE__ */ (0, K.jsx)("button", {
								type: "button",
								"data-qa": "work-log-migration-cancel",
								onClick: se,
								children: "취소"
							})]
						})
					]
				})
			}),
			I && /* @__PURE__ */ (0, K.jsxs)("aside", {
				className: "work-log-proposal-surface",
				"data-qa": "proposal-approval-surface",
				"aria-label": "활성 제안 승인 검토",
				children: [
					/* @__PURE__ */ (0, K.jsxs)("div", { children: [
						/* @__PURE__ */ (0, K.jsx)("p", {
							className: "section-kicker",
							children: "Approval required"
						}),
						/* @__PURE__ */ (0, K.jsx)("h3", { children: Te(I.summary) || "저장 변경 제안" }),
						/* @__PURE__ */ (0, K.jsx)("p", { children: "이 내용은 작업 기록이 아니라 요청 시 별도로 불러온 승인 제안입니다." })
					] }),
					I.diff && /* @__PURE__ */ (0, K.jsx)("pre", { children: Ee(I.diff) }),
					/* @__PURE__ */ (0, K.jsx)("button", {
						type: "button",
						className: "filter-btn clear",
						onClick: () => z(null),
						children: "닫기"
					})
				]
			})
		]
	});
}
//#endregion
//#region src/app/agentPolling.ts
var Je = 1e3, Ye = 12e4, Xe = class extends Error {
	job;
	name = "AgentPollTimeout";
	constructor(e) {
		super("작업이 아직 실행 중입니다. 서버 작업은 계속되며 나중에 상태를 다시 확인할 수 있습니다."), this.job = e;
	}
}, Ze = class extends Error {
	job;
	name = "AgentJobTerminalError";
	constructor(e) {
		super(e.message || e.error || `Agent 작업이 ${e.status} 상태로 종료되었습니다.`), this.job = e;
	}
};
function Qe(e, t, n) {
	let r = e.get(t);
	r !== n && r?.abort(), e.set(t, n);
}
function $e(e, t, n) {
	return e.get(t) === n ? (e.delete(t), !0) : !1;
}
function et(e, t) {
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
async function tt(e, t = {}) {
	let { signal: n, timeoutMs: r = Ye, intervalMs: i = Je } = t, a = Date.now() + r, o = e;
	for (; N(o.status);) {
		if (Date.now() >= a) throw new Xe(o);
		await et(i, n), o = await L(`/api/jobs/${encodeURIComponent(o.id)}`, { signal: n });
	}
	if (o.status !== "done") throw new Ze(o);
	return o;
}
//#endregion
//#region src/app/InvestmentContextCard.tsx
var nt = {
	layer: "hypothesis",
	reuseAsEvidence: !1
}, rt = {
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
function it(e) {
	return e === "both" ? "포트폴리오 · 워치리스트" : e === "portfolio" ? "포트폴리오" : "워치리스트";
}
function at(e, t, n) {
	return t === "collection" ? e.watchContexts.filter((e) => e.collections.some((e) => e.id === n)) : e.watchContexts;
}
function ot(e) {
	let t = e.marketDrivers.map((e) => e.label).slice(0, 2);
	return [
		it(e.source),
		...t,
		e.dueCheckpoints.length ? `확인 예정 ${e.dueCheckpoints.length}` : ""
	].filter(Boolean).join(" · ");
}
function st({ reply: e }) {
	return /* @__PURE__ */ (0, K.jsx)("div", {
		className: "investment-context-explanation-body",
		children: e.split(/\r?\n/).map((e) => e.trim()).filter(Boolean).map((e, t) => e.startsWith("### ") ? /* @__PURE__ */ (0, K.jsx)("h3", { children: e.slice(4) }, `${t}:${e}`) : e.startsWith("- ") ? /* @__PURE__ */ (0, K.jsx)("p", {
			className: "is-bullet",
			children: e.slice(2)
		}, `${t}:${e}`) : /* @__PURE__ */ (0, K.jsx)("p", { children: e }, `${t}:${e}`))
	});
}
function ct({ mode: e, summary: t, collectionId: n, dismissible: r = !1, onDismiss: i, onReference: a, onExplain: o, explainingTicker: s = "", explanation: l = null, explanationError: u = "", loading: d = !1, error: f = "" }) {
	let p = (0, c.useMemo)(() => t ? at(t, e, n).slice(0, e === "home" ? 4 : 3) : [], [
		n,
		e,
		t
	]), m = rt[e];
	if (!t) return e === "home" ? /* @__PURE__ */ (0, K.jsx)("aside", {
		className: "investment-context-card is-minimal",
		"data-qa": "investment-context-loading",
		"data-layer": nt.layer,
		children: /* @__PURE__ */ (0, K.jsx)("span", { children: d ? "개인 리서치 연결을 확인하는 중입니다." : f || "개인 맥락을 불러오지 못했습니다." })
	}) : null;
	if (!p.length) return e === "home" ? /* @__PURE__ */ (0, K.jsxs)("aside", {
		className: "investment-context-card is-empty",
		"data-qa": "investment-context-empty",
		"data-layer": nt.layer,
		"data-reuse-as-evidence": String(nt.reuseAsEvidence),
		children: [/* @__PURE__ */ (0, K.jsxs)("div", {
			className: "investment-context-head",
			children: [/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("p", { children: "PERSONAL CONTEXT · HYPOTHESIS" }), /* @__PURE__ */ (0, K.jsx)("h2", { children: "개인 리서치 연결이 아직 없습니다" })] }), r && i ? /* @__PURE__ */ (0, K.jsx)("button", {
				type: "button",
				className: "investment-context-dismiss",
				"aria-label": "개인 맥락 카드 닫기",
				onClick: i,
				children: "×"
			}) : null]
		}), /* @__PURE__ */ (0, K.jsx)("p", { children: "관심 종목이나 체크포인트를 기록하면 관련 리서치 화면에서 조용히 연결됩니다." })]
	}) : null;
	let h = p.reduce((e, t) => e + t.dueCheckpoints.length, 0);
	return /* @__PURE__ */ (0, K.jsxs)("aside", {
		className: `investment-context-card mode-${e}`,
		"data-qa": `investment-context-${e}`,
		"data-layer": nt.layer,
		"data-reuse-as-evidence": String(nt.reuseAsEvidence),
		children: [
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "investment-context-head",
				children: [/* @__PURE__ */ (0, K.jsxs)("div", { children: [
					/* @__PURE__ */ (0, K.jsx)("p", { children: "PERSONAL CONTEXT · HYPOTHESIS" }),
					/* @__PURE__ */ (0, K.jsx)("h2", { children: m.title }),
					/* @__PURE__ */ (0, K.jsx)("span", { children: m.description })
				] }), r && i ? /* @__PURE__ */ (0, K.jsx)("button", {
					type: "button",
					className: "investment-context-dismiss",
					"aria-label": "개인 맥락 카드 닫기",
					onClick: i,
					children: "×"
				}) : null]
			}),
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "investment-context-summary",
				"aria-label": "개인 맥락 요약",
				children: [/* @__PURE__ */ (0, K.jsxs)("span", { children: ["연결 ", p.length] }), /* @__PURE__ */ (0, K.jsxs)("span", { children: ["확인 예정 ", h] })]
			}),
			/* @__PURE__ */ (0, K.jsx)("ul", {
				className: "investment-context-ledger",
				children: p.map((t) => /* @__PURE__ */ (0, K.jsxs)("li", { children: [/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: t.ticker }), /* @__PURE__ */ (0, K.jsx)("small", { children: ot(t) })] }), /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "investment-context-row-actions",
					children: [e === "deep-research" && a ? /* @__PURE__ */ (0, K.jsx)("button", {
						type: "button",
						onClick: () => a(t),
						children: "질문에 참고"
					}) : /* @__PURE__ */ (0, K.jsx)("a", {
						href: t.source === "watchlist" || t.source === "both" ? "#/watchlist" : "#/market-memory",
						children: "연결 보기"
					}), o ? /* @__PURE__ */ (0, K.jsx)("button", {
						type: "button",
						disabled: !!s,
						onClick: () => o(t),
						children: s === t.ticker ? "설명 중…" : "Agent로 위험 설명"
					}) : null]
				})] }, t.ticker))
			}),
			l ? /* @__PURE__ */ (0, K.jsxs)("section", {
				className: "investment-context-explanation",
				"aria-live": "polite",
				children: [/* @__PURE__ */ (0, K.jsxs)("strong", { children: [l.ticker, " · Agent 설명"] }), /* @__PURE__ */ (0, K.jsx)(st, { reply: l.reply })]
			}) : null,
			u ? /* @__PURE__ */ (0, K.jsx)("p", {
				className: "investment-context-error",
				role: "status",
				children: u
			}) : null,
			e === "home" ? /* @__PURE__ */ (0, K.jsxs)("nav", {
				className: "investment-context-links",
				"aria-label": "연결된 리서치 화면",
				children: [/* @__PURE__ */ (0, K.jsx)("a", {
					href: "#/market-memory",
					children: "시장 내러티브"
				}), /* @__PURE__ */ (0, K.jsx)("a", {
					href: "#/deep-research",
					children: "딥 리서치"
				})]
			}) : null,
			/* @__PURE__ */ (0, K.jsx)("small", {
				className: "investment-context-boundary",
				children: "개인 가설 레이어 · 외부 evidence 및 Canonical 본문과 분리"
			})
		]
	});
}
function lt(e) {
	let [t, n] = (0, c.useState)(null), [r, i] = (0, c.useState)(!0), [a, o] = (0, c.useState)(""), [s, l] = (0, c.useState)(!1), [u, d] = (0, c.useState)(""), [f, p] = (0, c.useState)(null), [m, h] = (0, c.useState)(""), g = (0, c.useRef)(null);
	(0, c.useEffect)(() => {
		let e = new AbortController();
		return i(!0), o(""), L("/api/investment-context/summary", { signal: e.signal }).then(n).catch((e) => {
			e instanceof DOMException && e.name === "AbortError" || o(e instanceof Error ? e.message : "개인 맥락을 불러오지 못했습니다.");
		}).finally(() => {
			e.signal.aborted || i(!1);
		}), () => e.abort();
	}, []), (0, c.useEffect)(() => () => g.current?.abort(), []);
	async function _(e) {
		g.current?.abort();
		let t = new AbortController();
		g.current = t, d(e.ticker), p(null), h("");
		try {
			let n = (await tt(await R("/api/agent/investment-context/explain", { tickers: [e.ticker] }, { signal: t.signal }), { signal: t.signal })).result?.reply?.trim() || "";
			if (!n) throw Error("설명 결과가 비어 있습니다.");
			p({
				ticker: e.ticker,
				reply: n
			});
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError") return;
			h(e instanceof Error ? e.message : "Agent 설명을 완료하지 못했습니다.");
		} finally {
			g.current === t && (g.current = null, d(""));
		}
	}
	return s ? null : /* @__PURE__ */ (0, K.jsx)(ct, {
		...e,
		summary: t,
		loading: r,
		error: a,
		onDismiss: e.dismissible ? () => l(!0) : void 0,
		onExplain: _,
		explainingTicker: u,
		explanation: f,
		explanationError: m
	});
}
//#endregion
//#region src/app/AgentHome.tsx
var ut = 3, dt = 2e5, ft = 4e3, pt = /* @__PURE__ */ new Set([
	"codex",
	"claude",
	"antigravity"
]), mt = "folio.agentHome.thread.v1", ht = {
	id: "welcome",
	role: "assistant",
	text: "무엇을 조사하거나 정리할까요? 질문으로 시작해도 되고, 보고서 수정 작업을 지시해도 됩니다.",
	notice: "저장 변경은 proposal 승인 전에는 반영되지 않습니다."
};
function gt() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function _t(e) {
	return e === "high" ? "높음" : e === "low" ? "낮음" : "중간";
}
function vt(e) {
	return `${Math.max(1, Math.round((Date.now() - e) / 1e3))}초`;
}
function yt(e) {
	return e.filter((e) => e.id !== "welcome").map((e) => ({
		...e,
		pending: !1,
		text: e.pending ? `${e.text}\n\n이전 세션에서 완료 여부를 확인하지 못했습니다.` : e.text
	})).slice(-80);
}
function bt() {
	try {
		let e = window.localStorage.getItem(mt);
		if (!e) return [ht];
		let t = JSON.parse(e), n = Array.isArray(t?.messages) ? t.messages.filter((e) => e?.role === "user" || e?.role === "assistant") : [];
		return n.length ? [ht, ...n] : [ht];
	} catch {
		return [ht];
	}
}
function xt(e) {
	try {
		let t = yt(e);
		if (!t.length) {
			window.localStorage.removeItem(mt);
			return;
		}
		window.localStorage.setItem(mt, JSON.stringify({
			version: 1,
			updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
			messages: t
		}));
	} catch {}
}
async function St(e) {
	let t = e.type.startsWith("text/") || /\.(md|txt|csv|json)$/i.test(e.name) ? await e.text() : "";
	return {
		name: e.name.slice(0, 120),
		size: e.size,
		content: t.slice(0, ft)
	};
}
function Ct(e) {
	let t = e?.provider && pt.has(e.provider) ? e.provider : e?.selectedAdapter || "";
	return e?.adapters?.find((e) => e.id === t) || null;
}
function wt(e) {
	return e?.modelChoices || [];
}
function Tt(e) {
	let t = wt(e);
	return t.length ? t.some((t) => t.value === e?.model) ? String(e?.model || "") : t[0].value : "";
}
function Et(e) {
	let t = e;
	return !!(t?.id && N(t.status));
}
function Dt(e) {
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
function Ot(e, t) {
	return `${e.view || "report"}-${e.date || ""}-${e.title || t}`;
}
function kt() {
	let [e, t] = (0, c.useState)(() => bt()), [n, r] = (0, c.useState)(""), [i, a] = (0, c.useState)(""), [o, s] = (0, c.useState)(null), [l, u] = (0, c.useState)(""), [d, f] = (0, c.useState)("medium"), [p, m] = (0, c.useState)([]), [h, g] = (0, c.useState)([]), [_, v] = (0, c.useState)(0), [y, b] = (0, c.useState)(""), [x, S] = (0, c.useState)(""), [C, w] = (0, c.useState)(!1), [T, E] = (0, c.useState)(""), D = (0, c.useRef)(null), O = (0, c.useRef)(/* @__PURE__ */ new Map());
	(0, c.useEffect)(() => (W("home", {
		surface: "agent_home",
		viewId: "home"
	}), () => G("home")), []), (0, c.useEffect)(() => () => {
		for (let e of O.current.values()) e.abort();
		O.current.clear();
	}, []), (0, c.useEffect)(() => {
		xt(e);
	}, [e]);
	let k = (0, c.useCallback)((e, t = !1) => {
		let n = Ct(e);
		s(e), u(e.message || ""), a((e) => {
			let r = Tt(n);
			return t && wt(n).some((t) => t.value === e) ? e : r;
		});
	}, []), A = (0, c.useCallback)(async (e = !1) => {
		let t = await L(`/api/agent-bridge/settings${e ? "?refresh=true" : ""}`);
		k(t, !0);
	}, [k]);
	(0, c.useEffect)(() => {
		let e = !0;
		return L("/api/agent-bridge/settings").then((t) => {
			e && k(t);
		}).catch((t) => {
			e && u(t instanceof Error ? t.message : "Agent 설정을 불러오지 못했습니다.");
		}), () => {
			e = !1;
		};
	}, [k, A]), (0, c.useEffect)(() => {
		let e = (e) => {
			let t = e.detail;
			t ? k(t) : A().catch((e) => u(e instanceof Error ? e.message : "Agent 설정을 불러오지 못했습니다."));
		};
		return window.addEventListener("folio:agent-settings-updated", e), () => window.removeEventListener("folio:agent-settings-updated", e);
	}, [k, A]), (0, c.useEffect)(() => {
		let e = !0;
		return Promise.allSettled([L("/api/dashboard"), L("/api/investment-review")]).then((t) => {
			if (!e) return;
			let n = t[0].status === "fulfilled" ? t[0].value : null, r = [...(t[1].status === "fulfilled" ? t[1].value : null)?.recentReports || [], ...n?.briefings || []], i = /* @__PURE__ */ new Set();
			g(r.filter((e, t) => {
				let n = `${e.view || ""}:${e.date || ""}:${e.title || t}`;
				return i.has(n) ? !1 : (i.add(n), !0);
			}).slice(0, 3));
		}), () => {
			e = !1;
		};
	}, []);
	function j() {
		t([ht]), r(""), m([]), E(""), S("");
		try {
			window.localStorage.removeItem(mt);
		} catch {}
	}
	async function M(e) {
		e.preventDefault();
		let a = n.trim();
		if (!a || C) return;
		let s = {
			id: gt(),
			role: "user",
			text: a,
			attachments: p.map((e) => e.name),
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		}, c = gt(), l = Date.now(), u = Ct(o), f = u?.label || "Agent", h = i || u?.model || "model";
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
				runMeta: `${h} · ${_t(d)} · on-request`,
				createdAt: new Date(l).toISOString()
			}
		]), r(""), E(""), w(!0);
		let g = null;
		try {
			let e = await R("/api/agent/chat", {
				message: a,
				context: { surface: "agent_home" },
				options: {
					model: i,
					effort: d,
					attachments: p
				}
			});
			g = new AbortController(), Qe(O.current, c, g);
			let n = await tt(e, { signal: g.signal });
			$e(O.current, c, g);
			let r = n.result || {}, o = await Ie(r);
			v((e) => e + 1), t((e) => e.map((e) => e.id === c ? {
				...e,
				text: r.reply || n.message || "Agent가 응답을 반환하지 않았습니다.",
				notice: [r.notice, o.notice].filter(Boolean).join(" "),
				pending: !1,
				proposal: o.proposal,
				proposalStatus: o.proposalStatus,
				runState: "done",
				runTitle: `${f} 응답`,
				runMeta: `${h} · ${_t(d)} · ${vt(l)}`
			} : e)), m([]);
		} catch (e) {
			if (g && $e(O.current, c, g), e instanceof Xe) {
				t((t) => t.map((t) => t.id === c ? {
					...t,
					text: e.message,
					pending: !1,
					runState: "still-running",
					runTitle: `${f} 계속 실행 중`,
					runMeta: `${h} · ${_t(d)} · ${vt(l)}`,
					jobId: e.job.id
				} : t));
				return;
			}
			let n = e instanceof Error ? e.message : "Agent 요청에 실패했습니다.";
			E(n), t((e) => e.map((e) => e.id === c ? {
				...e,
				text: n,
				pending: !1,
				runState: "error",
				runTitle: `${f} 오류`,
				runMeta: `${h} · ${_t(d)}`
			} : e));
		} finally {
			w(!1);
		}
	}
	async function N(e, n) {
		let r = new AbortController();
		Qe(O.current, e, r), t((t) => t.map((t) => t.id === e ? {
			...t,
			pending: !0,
			runState: "pending",
			runTitle: "Agent 상태 다시 확인 중"
		} : t));
		try {
			let i = await tt(await L(`/api/jobs/${encodeURIComponent(n)}`, { signal: r.signal }), { signal: r.signal }), a = i.result || {}, o = await Ie(a);
			v((e) => e + 1), t((t) => t.map((t) => t.id === e ? {
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
		} catch (n) {
			n instanceof Xe ? t((t) => t.map((t) => t.id === e ? {
				...t,
				text: n.message,
				pending: !1,
				runState: "still-running",
				runTitle: "Agent 계속 실행 중",
				jobId: n.job.id
			} : t)) : n instanceof DOMException && n.name === "AbortError" || t((t) => t.map((t) => t.id === e ? {
				...t,
				text: n instanceof Error ? n.message : "Agent 상태 확인에 실패했습니다.",
				pending: !1,
				runState: "error",
				runTitle: "Agent 오류"
			} : t));
		} finally {
			$e(O.current, e, r);
		}
	}
	async function P(e) {
		if (E(""), S(""), e === "analysis" || e === "deep-research") {
			window.location.hash = e === "analysis" ? "#/analysis" : "#/deep-research";
			return;
		}
		b(e);
		try {
			if (e === "rss") {
				S("RSS 수집을 시작했습니다.");
				let e = await R("/api/rssarchive/import", {});
				Et(e) && await tt(e), v((e) => e + 1), S("RSS 수집이 끝났습니다."), window.location.hash = "#/rss";
				return;
			}
			S("오늘 브리핑을 생성하는 중입니다.");
			let t = await R("/api/briefings", {
				marketScope: "both",
				briefingType: "default"
			}), n = "";
			if (Et(t)) {
				let e = await tt(t);
				n = e.result?.date || e.result?.artifactId || "";
			} else n = t.date || "";
			v((e) => e + 1), S(n ? "오늘 브리핑을 생성했습니다." : "브리핑 생성이 끝났습니다."), window.location.hash = n ? `#/briefing/${n}/both` : "#/briefing";
		} catch (e) {
			let t = e instanceof Error ? e.message : "빠른 실행에 실패했습니다.";
			E(t), S(t);
		} finally {
			b("");
		}
	}
	async function F(e) {
		if (!e) return;
		E("");
		let t = [...p];
		for (let n of Array.from(e)) {
			if (t.length >= ut) {
				E(`첨부는 최대 ${ut}개까지 가능합니다.`);
				break;
			}
			if (n.size > dt) {
				E(`${n.name}은 200KB를 초과해 제외했습니다.`);
				continue;
			}
			t.push(await St(n));
		}
		m(t), D.current && (D.current.value = "");
	}
	async function I(e, n, r) {
		E("");
		try {
			let i = await Ve(n, r);
			t((t) => t.map((t) => t.id === e ? {
				...t,
				proposalStatus: i.status
			} : t)), He(i), v((e) => e + 1);
		} catch (e) {
			E(e instanceof Error ? e.message : "제안 처리에 실패했습니다.");
		}
	}
	let z = Ct(o), B = wt(z), V = e.some((e) => e.id !== "welcome");
	async function ee(e) {
		if (a(e), !(!z?.id || !e)) try {
			let t = Object.fromEntries((o?.adapters || []).map((e) => [e.id, e.model || ""]));
			t[z.id] = e;
			let n = await R("/api/agent-bridge/settings", {
				provider: z.id,
				models: t
			});
			k(n, !0), window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: n }));
		} catch (e) {
			E(e instanceof Error ? e.message : "모델 설정 저장에 실패했습니다.");
		}
	}
	return /* @__PURE__ */ (0, K.jsx)("div", {
		className: "react-home-route",
		"data-agent-home": !0,
		children: /* @__PURE__ */ (0, K.jsxs)("div", {
			className: `agent-home ${V ? "has-conversation" : "is-empty"}`,
			children: [
				/* @__PURE__ */ (0, K.jsxs)("div", {
					className: "agent-home-left",
					children: [
						/* @__PURE__ */ (0, K.jsxs)("header", {
							className: "home-hero agent-home-hero",
							children: [/* @__PURE__ */ (0, K.jsx)("p", {
								className: "eyebrow",
								children: "Local Investment Research Workspace"
							}), /* @__PURE__ */ (0, K.jsx)("h1", { children: "Folio OS" })]
						}),
						/* @__PURE__ */ (0, K.jsxs)("form", {
							className: "agent-home-prompt",
							onSubmit: M,
							children: [
								/* @__PURE__ */ (0, K.jsxs)("div", {
									className: "agent-home-prompt-shell",
									children: [/* @__PURE__ */ (0, K.jsx)("textarea", {
										value: n,
										onChange: (e) => r(e.target.value),
										onKeyDown: (e) => {
											e.key === "Enter" && !e.shiftKey && (e.preventDefault(), e.currentTarget.form?.requestSubmit());
										},
										placeholder: "Folio OS에서 무엇을 빌드할까요?",
										rows: 3
									}), /* @__PURE__ */ (0, K.jsxs)("div", {
										className: "agent-home-toolbar",
										children: [
											/* @__PURE__ */ (0, K.jsx)("input", {
												ref: D,
												type: "file",
												multiple: !0,
												hidden: !0,
												onChange: (e) => F(e.currentTarget.files)
											}),
											/* @__PURE__ */ (0, K.jsxs)("div", {
												className: "agent-home-toolbar-left",
												children: [/* @__PURE__ */ (0, K.jsx)("button", {
													type: "button",
													className: "agent-home-icon-btn",
													onClick: () => D.current?.click(),
													"aria-label": "파일 첨부",
													"data-tooltip": "파일 첨부",
													children: "+"
												}), /* @__PURE__ */ (0, K.jsx)("span", {
													className: "agent-home-provider",
													children: z?.label || z?.id || "Folio OS"
												})]
											}),
											/* @__PURE__ */ (0, K.jsxs)("div", {
												className: "agent-home-toolbar-right",
												children: [
													/* @__PURE__ */ (0, K.jsx)("select", {
														"aria-label": "모델",
														value: i,
														onChange: (e) => ee(e.target.value),
														children: B.length > 0 ? B.map((e) => /* @__PURE__ */ (0, K.jsx)("option", {
															value: e.value,
															children: e.label
														}, e.value)) : /* @__PURE__ */ (0, K.jsx)("option", {
															value: "",
															children: "모델 목록 없음"
														})
													}),
													/* @__PURE__ */ (0, K.jsxs)("select", {
														"aria-label": "노력 단계",
														value: d,
														onChange: (e) => f(e.target.value),
														children: [
															/* @__PURE__ */ (0, K.jsx)("option", {
																value: "low",
																children: "낮음"
															}),
															/* @__PURE__ */ (0, K.jsx)("option", {
																value: "medium",
																children: "중간"
															}),
															/* @__PURE__ */ (0, K.jsx)("option", {
																value: "high",
																children: "높음"
															}),
															/* @__PURE__ */ (0, K.jsx)("option", {
																value: "max",
																children: "최대"
															})
														]
													}),
													/* @__PURE__ */ (0, K.jsx)("button", {
														className: "agent-home-send",
														type: "submit",
														disabled: C || !n.trim(),
														"aria-label": "전송",
														"data-tooltip": "전송",
														children: C ? "..." : "↑"
													})
												]
											})
										]
									})]
								}),
								l && /* @__PURE__ */ (0, K.jsx)("p", {
									className: "agent-home-notice",
									children: l
								}),
								p.length > 0 && /* @__PURE__ */ (0, K.jsx)("div", {
									className: "agent-home-attachments",
									children: p.map((e) => /* @__PURE__ */ (0, K.jsxs)("span", { children: [e.name, /* @__PURE__ */ (0, K.jsx)("button", {
										type: "button",
										"aria-label": `${e.name} 첨부 제거`,
										onClick: () => m((t) => t.filter((t) => t.name !== e.name)),
										children: "×"
									})] }, e.name))
								}),
								x && /* @__PURE__ */ (0, K.jsx)("p", {
									className: "agent-home-notice",
									children: x
								}),
								T && /* @__PURE__ */ (0, K.jsx)("p", {
									className: "agent-home-error",
									children: T
								})
							]
						}),
						/* @__PURE__ */ (0, K.jsxs)("div", {
							className: "home-launcher agent-home-launcher",
							role: "group",
							"aria-label": "빠른 실행",
							children: [
								/* @__PURE__ */ (0, K.jsx)("button", {
									className: "launch-tile primary",
									type: "button",
									onClick: () => P("briefing"),
									disabled: y === "briefing",
									children: y === "briefing" ? "생성 중" : "오늘 브리핑 생성"
								}),
								/* @__PURE__ */ (0, K.jsx)("button", {
									className: "launch-tile",
									type: "button",
									onClick: () => P("rss"),
									disabled: y === "rss",
									children: y === "rss" ? "수집 중" : "RSS 수집"
								}),
								/* @__PURE__ */ (0, K.jsx)("button", {
									className: "launch-tile",
									type: "button",
									onClick: () => P("analysis"),
									children: "기업 분석"
								}),
								/* @__PURE__ */ (0, K.jsx)("button", {
									className: "launch-tile",
									"data-qa": "home-deep-research",
									type: "button",
									onClick: () => P("deep-research"),
									children: "딥 리서치"
								})
							]
						}),
						/* @__PURE__ */ (0, K.jsx)(lt, {
							mode: "home",
							dismissible: !0
						}),
						h.length > 0 && /* @__PURE__ */ (0, K.jsxs)("div", {
							className: "review-recent-wrap agent-home-recent",
							children: [/* @__PURE__ */ (0, K.jsx)("span", {
								className: "rv-recent-cap",
								children: "최근 보고서"
							}), /* @__PURE__ */ (0, K.jsx)("div", {
								className: "rv-recent",
								children: h.map((e, t) => /* @__PURE__ */ (0, K.jsxs)("button", {
									className: "rv-rc",
									type: "button",
									"data-tooltip": `${e.title || "보고서"}${e.date ? ` · ${e.date}` : ""}`,
									onClick: () => {
										window.location.hash = Dt(e);
									},
									children: [/* @__PURE__ */ (0, K.jsx)("span", {
										className: "rv-rc-k",
										children: String(e.type || e.view || "REPORT").toUpperCase()
									}), /* @__PURE__ */ (0, K.jsx)("span", {
										className: "rv-rc-t",
										children: e.title || "제목 없음"
									})]
								}, Ot(e, t)))
							})]
						})
					]
				}),
				V && /* @__PURE__ */ (0, K.jsxs)("section", {
					className: "agent-home-thread agent-home-right",
					"aria-label": "AI Agent 대화",
					children: [/* @__PURE__ */ (0, K.jsxs)("div", {
						className: "agent-home-section-head",
						children: [/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("p", {
							className: "section-kicker",
							children: "Agent Thread"
						}), /* @__PURE__ */ (0, K.jsx)("h2", { children: "현재 대화" })] }), /* @__PURE__ */ (0, K.jsx)("button", {
							type: "button",
							onClick: j,
							children: "새 대화"
						})]
					}), /* @__PURE__ */ (0, K.jsx)("div", {
						className: "agent-home-log",
						"aria-live": "polite",
						children: e.map((e) => /* @__PURE__ */ (0, K.jsxs)("article", {
							className: `agent-home-message ${e.role}${e.pending ? " pending" : ""}`,
							children: [/* @__PURE__ */ (0, K.jsxs)("div", {
								className: "agent-home-message-body",
								children: [
									e.runTitle && /* @__PURE__ */ (0, K.jsx)(de, {
										state: e.runState === "still-running" ? "pending" : e.runState,
										title: e.runTitle,
										meta: e.runMeta
									}),
									e.runState === "still-running" && e.jobId && /* @__PURE__ */ (0, K.jsx)("div", {
										"data-qa": "agent-job-still-running",
										children: /* @__PURE__ */ (0, K.jsx)("button", {
											type: "button",
											"data-qa": "agent-job-resume",
											onClick: () => void N(e.id, e.jobId),
											children: "상태 다시 확인"
										})
									}),
									e.text && /* @__PURE__ */ (0, K.jsx)(ue, { text: e.text }),
									e.notice && /* @__PURE__ */ (0, K.jsx)("p", {
										className: "agent-home-notice",
										children: e.notice
									}),
									(e.attachments || []).length > 0 && /* @__PURE__ */ (0, K.jsx)("div", {
										className: "agent-home-attachments",
										children: e.attachments?.map((e) => /* @__PURE__ */ (0, K.jsx)("span", { children: e }, e))
									})
								]
							}), e.proposal && /* @__PURE__ */ (0, K.jsxs)("div", {
								className: "agent-home-proposal",
								children: [
									/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: "수정 제안" }), /* @__PURE__ */ (0, K.jsxs)("span", { children: [
										e.proposal.artifactKind,
										" ",
										e.proposal.artifactId
									] })] }),
									e.proposalStatus === "pending" && e.proposal.summary && /* @__PURE__ */ (0, K.jsx)("p", {
										"data-qa": "proposal-summary",
										children: Te(e.proposal.summary)
									}),
									e.proposalStatus === "pending" && e.proposal.diff && /* @__PURE__ */ (0, K.jsxs)("details", { children: [/* @__PURE__ */ (0, K.jsx)("summary", { children: "diff 보기" }), /* @__PURE__ */ (0, K.jsx)("pre", {
										"data-qa": "proposal-diff",
										children: Ee(e.proposal.diff)
									})] }),
									e.proposalStatus === "pending" ? /* @__PURE__ */ (0, K.jsxs)("div", {
										className: "agent-home-proposal-actions",
										children: [/* @__PURE__ */ (0, K.jsx)("button", {
											type: "button",
											"data-qa": "proposal-approve",
											onClick: () => I(e.id, e.proposal.id, "approve"),
											children: "승인"
										}), /* @__PURE__ */ (0, K.jsx)("button", {
											type: "button",
											"data-qa": "proposal-reject",
											onClick: () => I(e.id, e.proposal.id, "reject"),
											children: "거절"
										})]
									}) : /* @__PURE__ */ (0, K.jsxs)("p", {
										className: "agent-home-notice",
										"data-qa": e.proposalStatus === "applied" ? "wb-happy-applied" : e.proposalStatus === "rejected" ? "wb-f1-terminal-rejected" : e.proposalStatus === "stale" ? "wb-f1-terminal-stale" : "proposal-terminal",
										children: ["상태: ", e.proposalStatus]
									})
								]
							})]
						}, e.id))
					})]
				}),
				/* @__PURE__ */ (0, K.jsx)(qe, {
					surface: "home",
					pageSize: 20,
					refreshKey: _
				})
			]
		})
	});
}
//#endregion
//#region src/app/legacyBridge.ts
function At() {
	return window.FolioBridge ?? {};
}
//#endregion
//#region src/app/reportReader/ReaderActions.tsx
function jt({ title: e, children: t }) {
	return /* @__PURE__ */ (0, K.jsxs)("section", {
		className: "report-reader-rail-group",
		"aria-label": e,
		children: [/* @__PURE__ */ (0, K.jsx)("p", {
			className: "section-kicker",
			children: e
		}), /* @__PURE__ */ (0, K.jsx)("div", {
			className: "report-reader-rail-actions",
			children: t
		})]
	});
}
function Mt({ icon: e, children: t, ...n }) {
	return /* @__PURE__ */ (0, K.jsxs)("button", {
		className: "report-action-btn",
		type: "button",
		...n,
		children: [/* @__PURE__ */ (0, K.jsx)(Nt, { name: e }), /* @__PURE__ */ (0, K.jsx)("span", { children: t })]
	});
}
function Nt({ name: e }) {
	return e === "agent" ? /* @__PURE__ */ (0, K.jsx)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, K.jsx)("path", { d: "m4 17 6-6-6-6m8 14h8" })
	}) : e === "link" ? /* @__PURE__ */ (0, K.jsxs)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, K.jsx)("path", {
				fill: "currentColor",
				stroke: "none",
				fillRule: "evenodd",
				clipRule: "evenodd",
				d: "M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h6.4a6 6 0 0 1 8.6-8.4V5a3 3 0 0 0-3-3H5Zm2 4a1 1 0 0 0 0 2h10a1 1 0 1 0 0-2H7Zm0 4a1 1 0 1 0 0 2h5a1 1 0 1 0 0-2H7Z"
			}),
			/* @__PURE__ */ (0, K.jsx)("path", { d: "M20.5 17.4a3 3 0 1 1-.9-2.1" }),
			/* @__PURE__ */ (0, K.jsx)("path", { d: "M20.9 14.1v2.3h-2.3" })
		]
	}) : e === "notion" ? /* @__PURE__ */ (0, K.jsx)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, K.jsx)("path", {
			fill: "currentColor",
			stroke: "none",
			d: "M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"
		})
	}) : e === "obsidian" ? /* @__PURE__ */ (0, K.jsx)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, K.jsx)("path", {
			fill: "currentColor",
			stroke: "none",
			d: "M19.355 18.538a68.967 68.959 0 0 0 1.858-2.954.81.81 0 0 0-.062-.9c-.516-.685-1.504-2.075-2.042-3.362-.553-1.321-.636-3.375-.64-4.377a1.707 1.707 0 0 0-.358-1.05l-3.198-4.064a3.744 3.744 0 0 1-.076.543c-.106.503-.307 1.004-.536 1.5-.134.29-.29.6-.446.914l-.31.626c-.516 1.068-.997 2.227-1.132 3.59-.124 1.26.046 2.73.815 4.481.128.011.257.025.386.044a6.363 6.363 0 0 1 3.326 1.505c.916.79 1.744 1.922 2.415 3.5zM8.199 22.569c.073.012.146.02.22.02.78.024 2.095.092 3.16.29.87.16 2.593.64 4.01 1.055 1.083.316 2.198-.548 2.355-1.664.114-.814.33-1.735.725-2.58l-.01.005c-.67-1.87-1.522-3.078-2.416-3.849a5.295 5.295 0 0 0-2.778-1.257c-1.54-.216-2.952.19-3.84.45.532 2.218.368 4.829-1.425 7.531zM5.533 9.938c-.023.1-.056.197-.098.29L2.82 16.059a1.602 1.602 0 0 0 .313 1.772l4.116 4.24c2.103-3.101 1.796-6.02.836-8.3-.728-1.73-1.832-3.081-2.55-3.831zM9.32 14.01c.615-.183 1.606-.465 2.745-.534-.683-1.725-.848-3.233-.716-4.577.154-1.552.7-2.847 1.235-3.95.113-.235.223-.454.328-.664.149-.297.288-.577.419-.86.217-.47.379-.885.46-1.27.08-.38.08-.72-.014-1.043-.095-.325-.297-.675-.68-1.06a1.6 1.6 0 0 0-1.475.36l-4.95 4.452a1.602 1.602 0 0 0-.513.952l-.427 2.83c.672.59 2.328 2.316 3.335 4.711.09.21.175.43.253.653z"
		})
	}) : /* @__PURE__ */ (0, K.jsxs)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, K.jsx)("path", { d: "m4 12 15-7-7 15-2-6z" }), /* @__PURE__ */ (0, K.jsx)("path", { d: "m10 14 4-4" })]
	});
}
//#endregion
//#region src/app/reportReader/MarkdownRenderer.tsx
function Pt(e) {
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
function q(e) {
	return Pt(e).map((e, t) => e.type === "strong" ? /* @__PURE__ */ (0, K.jsx)("strong", { children: e.value }, t) : e.type === "code" ? /* @__PURE__ */ (0, K.jsx)("code", { children: e.value }, t) : e.type === "link" ? /* @__PURE__ */ (0, K.jsx)("a", {
		href: e.href,
		target: "_blank",
		rel: "noreferrer",
		children: e.label
	}, t) : /* @__PURE__ */ (0, K.jsx)("span", { children: e.value }, t));
}
function Ft(e, t) {
	e.length &&= (t.push(/* @__PURE__ */ (0, K.jsx)("p", { children: q(e.join(" ")) }, `p-${t.length}`)), 0);
}
function It({ markdown: e = "" }) {
	let t = [], n = [], r = e.replace(/\r\n/g, "\n").split("\n"), i = [];
	function a() {
		i.length && (t.push(/* @__PURE__ */ (0, K.jsx)("ul", { children: i.map((e, t) => /* @__PURE__ */ (0, K.jsx)("li", { children: q(e) }, t)) }, `ul-${t.length}`)), i = []);
	}
	for (let e of r) {
		let r = e.trimEnd().trim();
		if (!r) {
			Ft(n, t), a();
			continue;
		}
		let o = r.match(/^(#{2,4})\s+(.+)$/);
		if (o) {
			Ft(n, t), a();
			let e = o[1].length, r = q(o[2]);
			e === 2 ? t.push(/* @__PURE__ */ (0, K.jsx)("h2", { children: r }, `h-${t.length}`)) : e === 3 ? t.push(/* @__PURE__ */ (0, K.jsx)("h3", { children: r }, `h-${t.length}`)) : t.push(/* @__PURE__ */ (0, K.jsx)("h4", { children: r }, `h-${t.length}`));
			continue;
		}
		let s = r.match(/^[-*]\s+(.+)$/);
		if (s) {
			Ft(n, t), i.push(s[1]);
			continue;
		}
		n.push(r);
	}
	return Ft(n, t), a(), /* @__PURE__ */ (0, K.jsx)("div", {
		className: "react-markdown markdown-brief report-body",
		children: t
	});
}
//#endregion
//#region src/app/reportReader/ReportBody.tsx
function Lt(e = "") {
	let t = e.replace(/\r\n/g, "\n"), n = /^#{1,3}\s*(?:참고\s*자료|참고자료|Sources Used|Sources)\s*$/gim.exec(t);
	return !n || n.index === void 0 ? e : t.slice(0, n.index).trim();
}
function Rt({ markdown: e = "", marketScope: t = "both", briefing: n, sourcePanelHtml: r = "" }) {
	let i = (0, c.useRef)(null), a = At(), o = Lt(e), s = a.renderMarkdown?.(o);
	return (0, c.useEffect)(() => {
		let e = i.current;
		if (!(!e || !n || !a.renderBriefingVisuals)) return a.renderBriefingVisuals(e, n), () => a.cleanupBriefingVisuals?.();
	}, [o, n]), s === void 0 ? /* @__PURE__ */ (0, K.jsx)(It, { markdown: o }) : /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [/* @__PURE__ */ (0, K.jsx)("article", {
		ref: i,
		className: "markdown-brief report-body",
		"data-market-scope": t,
		dangerouslySetInnerHTML: { __html: s }
	}), r && /* @__PURE__ */ (0, K.jsx)("div", { dangerouslySetInnerHTML: { __html: r } })] });
}
//#endregion
//#region src/app/reportReader/HypothesisReviewCard.tsx
var zt = {
	fresh: "최신",
	due: "검토 예정",
	stale: "검토 지연",
	unknown: "검토 이력 없음"
};
function Bt(e) {
	return e ? e.slice(0, 10) : "—";
}
function Vt(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function Ht(e) {
	return "id" in e && "status" in e;
}
async function Ut(e) {
	let t = e;
	for (; N(t.status);) await Vt(1e3), t = await L(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "가설 검토 작업에 실패했습니다.");
	return t;
}
function Wt({ identity: e, noteExists: t, refreshKey: n, agentAvailable: r = !0, onRequestAgent: i }) {
	let [a, o] = (0, c.useState)(null), [s, l] = (0, c.useState)(""), [u, d] = (0, c.useState)(!1);
	(0, c.useEffect)(() => {
		if (o(null), !t || !e.ticker) return;
		let n = new AbortController();
		return l("검토 상태를 불러오는 중..."), z(e.id, { signal: n.signal }).then((e) => {
			o(e), l("");
		}).catch((e) => {
			n.signal.aborted || l(e instanceof Error ? e.message : "검토 상태를 불러오지 못했습니다.");
		}), () => n.abort();
	}, [
		e.id,
		e.ticker,
		t,
		n
	]);
	let f = (0, c.useMemo)(() => a?.reviewState.checkpoints.find((e) => e.state === "due" || e.state === "open") || null, [a]);
	async function p(t) {
		if (!(!a || !e.ticker || u)) {
			d(!0), l("체크포인트를 확인하는 중...");
			try {
				let n = await B(e.ticker, {
					noteId: e.id,
					checkpointId: t.id,
					state: "checked",
					expectedRevision: a.reviewState.revision
				});
				o(n), l("체크포인트를 확인했습니다.");
			} catch (e) {
				l(e instanceof Error ? e.message : "체크포인트 확인에 실패했습니다.");
			} finally {
				d(!1);
			}
		}
	}
	async function m() {
		if (!(!a?.thesis || !e.ticker || u)) {
			d(!0), l("최신 외부 근거로 가설을 검토하는 중...");
			try {
				let t = await V(e.ticker);
				Ht(t) && await Ut(t);
				let n = await z(e.id);
				o(n), l("최신 근거 검토를 완료했습니다.");
			} catch (e) {
				l(e instanceof Error ? e.message : "최신 근거 검토에 실패했습니다.");
			} finally {
				d(!1);
			}
		}
	}
	let h = "";
	return t === null ? h = "노트 상태를 확인하는 중..." : t ? e.ticker || (h = "티커가 없어 Thesis와 연결할 수 없습니다.") : h = "아직 저장된 노트가 없습니다.", /* @__PURE__ */ (0, K.jsxs)("section", {
		className: "hypothesis-review-card",
		"aria-label": "가설 검토 상태",
		children: [
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "hypothesis-review-head",
				children: [/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("p", {
					className: "section-kicker",
					children: "Hypothesis Review"
				}), /* @__PURE__ */ (0, K.jsx)("strong", { children: "가설 검토 상태" })] }), a && /* @__PURE__ */ (0, K.jsx)("span", {
					className: `hypothesis-freshness is-${a.reviewState.freshness}`,
					children: zt[a.reviewState.freshness]
				})]
			}),
			h ? /* @__PURE__ */ (0, K.jsx)("p", {
				className: "hypothesis-review-empty",
				children: h
			}) : a ? /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [
				!a.thesis && /* @__PURE__ */ (0, K.jsx)("p", {
					className: "hypothesis-review-empty",
					children: "연결된 Thesis가 없습니다."
				}),
				!a.latestDelta && /* @__PURE__ */ (0, K.jsx)("p", {
					className: "hypothesis-review-empty",
					children: "최신 Delta가 없습니다. 최신 근거 검토를 명시적으로 실행하세요."
				}),
				/* @__PURE__ */ (0, K.jsxs)("dl", {
					className: "hypothesis-review-metrics",
					children: [
						/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "최근 검토" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: Bt(a.reviewState.lastReviewedAt) })] }),
						/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "다음 검토" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: Bt(a.reviewState.nextReviewAt) })] }),
						/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "반대 근거" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: a.latestDelta?.counterEvidenceCount ?? 0 })] }),
						/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "예정 체크" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: a.checkpointCounts.due + a.checkpointCounts.open })] })
					]
				}),
				/* @__PURE__ */ (0, K.jsxs)("div", {
					className: "hypothesis-review-actions",
					children: [
						/* @__PURE__ */ (0, K.jsx)("button", {
							type: "button",
							onClick: m,
							disabled: !a.thesis || u,
							children: u ? "검토 중..." : "최신 근거로 검토"
						}),
						/* @__PURE__ */ (0, K.jsx)("button", {
							type: "button",
							onClick: () => f && p(f),
							disabled: !f || u,
							children: u ? "확인 중..." : "체크포인트 확인"
						}),
						/* @__PURE__ */ (0, K.jsx)("button", {
							type: "button",
							onClick: i,
							disabled: !r,
							children: "Agent에게 설명 요청"
						})
					]
				}),
				!r && /* @__PURE__ */ (0, K.jsx)("p", {
					className: "hypothesis-review-empty",
					children: "Agent를 사용할 수 없습니다. 규칙 기반 상태는 계속 확인할 수 있습니다."
				})
			] }) : /* @__PURE__ */ (0, K.jsx)("p", {
				className: "hypothesis-review-empty",
				children: s || "검토 상태를 준비하고 있습니다."
			}),
			s && a && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "hypothesis-review-status",
				children: s
			}),
			/* @__PURE__ */ (0, K.jsx)("p", {
				className: "hypothesis-layer-notice",
				children: "사용자 노트는 hypothesis이며 evidence가 아닙니다. Canonical 보고서는 변경되지 않습니다."
			})
		]
	});
}
//#endregion
//#region src/app/reportReader/PersonalOverlayView.tsx
function Gt(e) {
	return e.length ? /* @__PURE__ */ (0, K.jsx)("ul", { children: e.map((e, t) => /* @__PURE__ */ (0, K.jsx)("li", { children: e }, `${e}-${t}`)) }) : /* @__PURE__ */ (0, K.jsx)("p", { children: "기록 없음" });
}
function Kt({ overlay: e, staleQa: t }) {
	return e ? /* @__PURE__ */ (0, K.jsxs)("div", {
		className: "react-personal-overlay",
		"data-personal-overlay-state": e.revisionState,
		children: [
			e.revisionState === "stale" && /* @__PURE__ */ (0, K.jsxs)("div", {
				className: "topicrpt-overlay-stale",
				"data-qa": t,
				role: "status",
				children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: "이 Overlay는 오래된 Canonical 기준입니다." }), /* @__PURE__ */ (0, K.jsx)("span", { children: "현재 보고서 revision과 생성 당시 revision이 다르므로 다시 연결해 확인하세요." })]
			}),
			e.revisionState === "legacy_unknown" && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "topicrpt-layer-note",
				children: "생성 기준 revision을 확인할 수 없는 레거시 Overlay입니다."
			}),
			e.markdown ? /* @__PURE__ */ (0, K.jsx)(Rt, { markdown: e.markdown }) : /* @__PURE__ */ (0, K.jsx)("p", {
				className: "report-note-empty",
				children: "저장된 개인 해석 본문이 없습니다."
			}),
			/* @__PURE__ */ (0, K.jsx)("h4", { children: "반대 근거와 충돌" }),
			Gt([...e.counterEvidence, ...e.contradictions]),
			/* @__PURE__ */ (0, K.jsx)("h4", { children: "불확실성과 다음 질문" }),
			Gt([...e.uncertainties, ...e.personalQuestions])
		]
	}) : /* @__PURE__ */ (0, K.jsx)("p", {
		className: "report-note-empty",
		children: "생성된 Personal Overlay가 없습니다."
	});
}
//#endregion
//#region src/app/reportReader/FolioNotePanel.tsx
var qt = [
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
].join("\n"), Jt = [
	"떠오르는 생각을 자유롭게 정리해보세요. 막연한 느낌이나 궁금증 한 줄만 작성해도 됩니다.",
	"",
	"예시: \"이 주식은 앞으로 받을 수혜가 커 보여서 관심 있음\"",
	"예시: \"가격이 너무 오른 것 같은데 그래도 들고 갈 만한가?\""
].join("\n"), Yt = "[대화]", Xt = "[투자 노트]";
function Zt(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
async function Qt(e) {
	let t = e;
	for (; N(t.status);) await Zt(1e3), t = await L(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "Agent 작업에 실패했습니다.");
	return t;
}
function $t(e) {
	let t = String(e || ""), n = t.indexOf(Xt), r = (e) => e.replace(/^\s*\[대화\]\s*/, "").trim();
	return n < 0 ? {
		message: r(t),
		note: ""
	} : {
		message: r(t.slice(0, n)),
		note: t.slice(n + 7).trim()
	};
}
function en(e, t) {
	let n = t.trim();
	if (!n) return e;
	let r = e[e.length - 1];
	return r?.role === "user" && r.body.trim() === n ? e : [...e, {
		role: "user",
		body: n,
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	}];
}
function tn(e, t, n = "") {
	return [...e, {
		role: "agent",
		body: t,
		summary: n || "Agent 답변",
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	}];
}
function nn(e, t, n, r, i = [], a = []) {
	let o = i.slice(-8).map((e, t) => `${t + 1}. ${e.body}`).join("\n"), s = a.slice(-8).map((e, t) => {
		let { message: n, note: r } = $t(e.body);
		return `${t + 1}. ${e.summary || "Agent"}: ${n || (r ? "(투자 노트 전체를 업데이트함)" : "")}`;
	}).join("\n\n");
	return [
		"현재 열린 보고서와 Folio OS Market Memory를 함께 참고해, 사용자와 대화하면서 투자 노트를 완성해줘.",
		"사용자가 적은 생각은 근거가 아니라 hypothesis다. 옹호하지 말고 검증 가능한 투자 노트로 다듬어줘.",
		"없는 사실은 지어내지 말고, 추가 확인 필요로 표시해줘.",
		"사용자 판단과 Agent가 제안하는 해석을 구분하고, 반대 근거와 다음 체크포인트를 포함해줘.",
		"사용자가 `>`로 인용한 문장이 있으면 그 문장에 대한 질문/첨삭 요청으로 이해하고 해당 부분을 중심으로 답해줘.",
		"응답 형식을 반드시 지켜줘:",
		`1) ${Yt} 아래에 사용자에게 하는 짧은 대화 답변(무엇을 반영/수정했는지, 확인하고 싶은 점)을 2~5문장으로 써줘.`,
		`2) 노트를 새로 만들거나 수정할 내용이 있으면 ${Xt} 아래에 투자 노트 전체 Markdown을 써줘. 단순 질문에 답만 하는 경우에는 ${Xt} 부분을 생략하고 기존 노트를 유지해줘.`,
		"기존 정리본이 있으면 전체를 갈아엎기보다 필요한 부분을 업데이트하고, 결정/업데이트 로그에 변경 이유를 남겨줘.",
		"투자 노트는 아래 큰 구조를 유지하되, 각 섹션은 초보 투자자가 바로 이해할 수 있게 짧고 명확하게 작성해줘.",
		qt,
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
function rn(e, t) {
	let n = String(t || e || "note"), r = 2166136261;
	for (let e = 0; e < n.length; e += 1) r ^= n.charCodeAt(e), r = Math.imul(r, 16777619) >>> 0;
	return `${e}-${r.toString(36)}`;
}
function an({ identity: e, linkedTitle: t, overlay: n = null }) {
	let [r, i] = (0, c.useState)(""), [a, o] = (0, c.useState)(""), [s, l] = (0, c.useState)(""), [u, d] = (0, c.useState)([]), [f, p] = (0, c.useState)([]), [m, h] = (0, c.useState)(""), [g, _] = (0, c.useState)("chat"), [v, y] = (0, c.useState)([]), [b, x] = (0, c.useState)(!1), [S, C] = (0, c.useState)([]), [w, T] = (0, c.useState)(null), [E, D] = (0, c.useState)(0), O = (0, c.useRef)(null), k = S.includes("agent_assisted"), A = (0, c.useMemo)(() => [...u, ...f].sort((e, t) => String(e.createdAt || "").localeCompare(String(t.createdAt || ""))), [u, f]);
	(0, c.useEffect)(() => {
		let t = !0;
		async function n() {
			h("불러오는 중..."), y([]), i(""), o(""), l(""), d([]), p([]), T(null);
			try {
				let n = await L(`/api/investment-notes/${encodeURIComponent(e.id)}`);
				if (!t) return;
				i(n.body || ""), d(n.rawThoughts || []), p(n.interactionLog || []), C(n.tags || []), T(!0), h(n.updatedAt ? `저장됨: ${n.updatedAt}` : "Folio 로컬 노트를 불러왔습니다.");
			} catch {
				if (!t) return;
				C([]), T(!1), h("생각 한 줄에서 시작하세요.");
			}
			try {
				let n = await L(`/api/investment-notes/linked?${new URLSearchParams({
					ticker: e.ticker || "",
					topic: e.topic || "",
					reportId: e.reportId || ""
				})}`);
				if (!t) return;
				y(n.notes || []);
			} catch {
				if (!t) return;
				y([]);
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
		let e = O.current;
		e && (e.scrollTop = e.scrollHeight);
	}, [A.length, g]);
	async function j(t, n, r, i = S) {
		let a = await R("/api/investment-notes", {
			...e,
			body: t,
			rawThoughts: n,
			interactionLog: r,
			tags: i
		});
		return C(a.tags || []), T(!0), D((e) => e + 1), a;
	}
	function M() {
		let e = a.trim(), t = s.trim();
		return t && e ? `> ${t}\n\n${e}` : t ? `> ${t}` : e;
	}
	function N() {
		let e = window.getSelection()?.toString().replace(/\s+/g, " ").trim() || "";
		e.length >= 2 && l(e.slice(0, 400));
	}
	async function P() {
		let e = M();
		if (e) {
			h("저장 중...");
			try {
				let t = en(u, e), n = await j(r, t, f);
				d(n.rawThoughts || t), p(n.interactionLog || f), o(""), l(""), h("생각을 기록했습니다. Agent 정리는 나중에 요청할 수 있습니다.");
			} catch (e) {
				h(e instanceof Error ? `저장 실패: ${e.message}` : "저장 실패");
			}
		}
	}
	async function F() {
		let n = M();
		if (!n || b) return;
		x(!0), h("Agent가 응답을 준비하는 중...");
		let a = en(u, n);
		d(a), o(""), l("");
		try {
			let o = await Qt(await R("/api/agent/chat", {
				message: nn(e, r, n, t, a, f),
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
			let { note: l } = $t(c), u = tn(f, c, s.notice || (l ? "투자 노트 업데이트" : "Agent 답변")), m = l || r, g = await j(m, a, u, l ? Array.from(/* @__PURE__ */ new Set([...S, "agent_assisted"])) : S);
			i(g.body || m), d(g.rawThoughts || a), p(g.interactionLog || u), h(l ? "Agent가 투자 노트를 업데이트했습니다. 완성본은 연결 자료 탭에서 확인하세요." : "Agent가 답변했습니다. 노트 본문은 그대로 유지했습니다.");
		} catch (e) {
			try {
				await j(r, a, f);
			} catch {}
			h(e instanceof Error ? `AI 정리 실패: ${e.message}` : "AI 정리 실패");
		} finally {
			x(!1);
		}
	}
	function I() {
		_("chat"), o("현재 freshness, 최신 verdict, 반대 근거, 체크포인트 상태가 무엇을 의미하는지 설명해줘."), h("설명 요청을 준비했습니다. 내용을 확인한 뒤 Agent 버튼을 눌러 실행하세요.");
	}
	return /* @__PURE__ */ (0, K.jsxs)("div", {
		className: "react-note-panel",
		"data-report-note-panel": !0,
		children: [
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "report-note-head react-note-panel-head",
				children: [/* @__PURE__ */ (0, K.jsx)("p", {
					className: "section-kicker",
					children: "투자 생각 정리"
				}), /* @__PURE__ */ (0, K.jsx)("div", {
					className: "report-note-tabs",
					role: "tablist",
					"aria-label": "투자 노트 모드",
					children: [["chat", "작성"], ["links", "연결 자료"]].map(([e, t]) => /* @__PURE__ */ (0, K.jsx)("button", {
						className: "report-note-tab",
						type: "button",
						"aria-pressed": g === e,
						onClick: () => _(e),
						children: t
					}, e))
				})]
			}),
			/* @__PURE__ */ (0, K.jsx)(Wt, {
				identity: e,
				noteExists: w,
				refreshKey: E,
				onRequestAgent: I
			}),
			g === "chat" && /* @__PURE__ */ (0, K.jsxs)("div", {
				className: "report-note-chat",
				children: [A.length === 0 ? /* @__PURE__ */ (0, K.jsx)("p", {
					className: "report-note-empty report-note-chat-empty",
					children: "먼저 떠오르는 생각 한 줄을 남겨보세요. Agent가 열린 보고서와 Market Memory를 참고해 투자 노트로 정리해줍니다."
				}) : /* @__PURE__ */ (0, K.jsx)("ol", {
					className: "report-note-chat-list",
					ref: O,
					onMouseUp: N,
					children: A.map((e, t) => {
						let n = e.role === "agent", { message: r, note: i } = n ? $t(e.body) : {
							message: e.body,
							note: ""
						};
						return /* @__PURE__ */ (0, K.jsxs)("li", {
							className: `report-note-chat-item ${n ? "is-agent" : "is-user"}`,
							children: [
								/* @__PURE__ */ (0, K.jsxs)("span", {
									className: "report-note-history-meta",
									children: [
										n ? "Agent" : "사용자",
										" ",
										e.createdAt || ""
									]
								}),
								r && /* @__PURE__ */ (0, K.jsx)("p", {
									className: "report-note-chat-text",
									children: r
								}),
								i && /* @__PURE__ */ (0, K.jsxs)("div", {
									className: "report-note-chat-note",
									children: [/* @__PURE__ */ (0, K.jsx)("span", {
										className: "report-note-chat-note-label",
										children: "완성된 투자 노트"
									}), /* @__PURE__ */ (0, K.jsx)(Rt, { markdown: i })]
								})
							]
						}, `${e.role}-${e.createdAt || t}-${t}`);
					})
				}), /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "report-note-composer",
					children: [
						s && /* @__PURE__ */ (0, K.jsxs)("div", {
							className: "report-note-quote-bar",
							children: [
								/* @__PURE__ */ (0, K.jsx)("span", {
									className: "report-note-quote-label",
									children: "인용"
								}),
								/* @__PURE__ */ (0, K.jsx)("p", { children: s }),
								/* @__PURE__ */ (0, K.jsx)("button", {
									type: "button",
									onClick: () => l(""),
									"aria-label": "인용 지우기",
									children: "×"
								})
							]
						}),
						/* @__PURE__ */ (0, K.jsx)("textarea", {
							className: "report-note-thought-editor",
							value: a,
							onChange: (e) => o(e.currentTarget.value),
							rows: 3,
							placeholder: Jt,
							"aria-label": `${e.title} 사용자의 생각`
						}),
						/* @__PURE__ */ (0, K.jsxs)("div", {
							className: "report-note-composer-actions",
							children: [/* @__PURE__ */ (0, K.jsx)("button", {
								className: "report-note-secondary-action",
								type: "button",
								onClick: P,
								disabled: b || !M(),
								children: "생각만 기록"
							}), /* @__PURE__ */ (0, K.jsx)("button", {
								className: "report-note-primary-action",
								type: "button",
								onClick: F,
								disabled: b || !M(),
								children: b ? "Agent가 정리 중" : "Agent와 투자 노트 정리하기"
							})]
						}),
						/* @__PURE__ */ (0, K.jsx)("p", {
							className: "report-note-composer-hint",
							children: "Agent 답변이나 완성본에서 문장을 드래그하면 인용해서 이어서 물어볼 수 있습니다."
						})
					]
				})]
			}),
			g === "links" && /* @__PURE__ */ (0, K.jsxs)("div", {
				className: "report-note-links",
				children: [
					/* @__PURE__ */ (0, K.jsxs)("div", {
						className: "report-note-final",
						children: [/* @__PURE__ */ (0, K.jsxs)("div", {
							className: "report-note-section-label",
							children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: "정리된 투자 노트" }), /* @__PURE__ */ (0, K.jsx)("span", { children: r.trim() ? `읽기 전용 완성본입니다. 수정은 작성 탭에서 Agent와 대화로 진행하세요.${k ? " (Agent 정리본)" : ""}` : "작성 탭에서 Agent와 정리하면 여기에 완성본이 표시됩니다." })]
						}), r.trim() ? /* @__PURE__ */ (0, K.jsx)("div", {
							className: "report-note-final-body",
							children: /* @__PURE__ */ (0, K.jsx)(Rt, { markdown: r })
						}) : /* @__PURE__ */ (0, K.jsx)("p", {
							className: "report-note-empty",
							children: "아직 완성된 투자 노트가 없습니다."
						})]
					}),
					/* @__PURE__ */ (0, K.jsxs)("p", {
						className: "report-note-link-head",
						children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: t || e.linkedReports?.[0] || e.title }), "에 연결된 Folio 노트와 참고 정보입니다."]
					}),
					v.length > 0 ? /* @__PURE__ */ (0, K.jsx)("ul", {
						className: "report-note-link-list",
						children: v.slice(0, 8).map((e) => /* @__PURE__ */ (0, K.jsxs)("li", { children: [/* @__PURE__ */ (0, K.jsx)("span", {
							className: "report-note-link-title",
							children: e.title || "투자 노트"
						}), /* @__PURE__ */ (0, K.jsx)("span", {
							className: "report-note-link-meta",
							children: e.ticker || e.noteType || "note"
						})] }, e.id || e.title))
					}) : /* @__PURE__ */ (0, K.jsx)("p", {
						className: "report-note-empty",
						children: "아직 연결된 노트가 없습니다."
					}),
					/* @__PURE__ */ (0, K.jsxs)("div", {
						className: "report-note-layer",
						children: [/* @__PURE__ */ (0, K.jsx)("p", {
							className: "section-kicker",
							children: "참고 해석"
						}), /* @__PURE__ */ (0, K.jsx)(Kt, { overlay: n })]
					})
				]
			}),
			/* @__PURE__ */ (0, K.jsx)("div", {
				className: "report-note-foot",
				children: m && /* @__PURE__ */ (0, K.jsx)("p", {
					className: "report-note-status",
					children: m
				})
			})
		]
	});
}
//#endregion
//#region src/app/reportReader/ReportReaderShell.tsx
function on({ eyebrow: e, title: t, breadcrumb: n, actionSlot: r, noteSlot: i, noteIdentity: a, noteLinkedTitle: o, noteOverlay: s, agentContext: l, onClose: u, children: d }) {
	let [f, p] = (0, c.useState)(!1), m = (0, c.useRef)(null), h = (0, c.useRef)(null), g = (0, c.useRef)(null), _ = (0, c.useRef)(null), v = (0, c.useId)(), y = i ?? (a ? /* @__PURE__ */ (0, K.jsx)(an, {
		identity: a,
		linkedTitle: o || t,
		overlay: s || null
	}) : null), b = l ? JSON.stringify(l) : "", x = [
		"report-reader-stage",
		!r && !y ? "no-side" : "",
		r ? "" : "no-rail",
		y ? "" : "no-note"
	].filter(Boolean).join(" ");
	(0, c.useEffect)(() => {
		if (!b || !l) return;
		let e = String(l.viewId || ""), t = e === "topicrpt" ? "deep-research" : e;
		t && W(t, l);
	}, [l, b]), (0, c.useEffect)(() => {
		m.current?.focus({ preventScroll: !0 });
	}, [t]);
	let S = (0, c.useCallback)(() => {
		p(!1), window.requestAnimationFrame(() => h.current?.focus({ preventScroll: !0 }));
	}, []);
	return (0, c.useEffect)(() => {
		if (!f) return;
		_.current?.focus({ preventScroll: !0 });
		let e = g.current, t = (t) => {
			if (t.key === "Escape") {
				t.preventDefault(), t.stopPropagation(), S();
				return;
			}
			if (t.key !== "Tab" || !e) return;
			let n = Array.from(e.querySelectorAll("button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex=\"-1\"])")).filter((e) => e.getClientRects().length > 0);
			if (!n.length) return;
			let r = n[0], i = n[n.length - 1];
			t.shiftKey && document.activeElement === r ? (t.preventDefault(), i.focus()) : !t.shiftKey && document.activeElement === i && (t.preventDefault(), r.focus());
		};
		return document.addEventListener("keydown", t, !0), () => document.removeEventListener("keydown", t, !0);
	}, [S, f]), (0, c.useEffect)(() => {
		let e = (e) => {
			e.key !== "Escape" || f || !u || (e.target instanceof Element ? e.target : null)?.closest("[role=\"dialog\"][aria-modal=\"true\"]") || (e.preventDefault(), u());
		};
		return document.addEventListener("keydown", e), () => document.removeEventListener("keydown", e);
	}, [f, u]), /* @__PURE__ */ (0, K.jsxs)("div", {
		className: "report-reader-shell report-reader-inline",
		"data-report-reader-shell": !0,
		children: [/* @__PURE__ */ (0, K.jsx)("div", {
			className: "reader-breadcrumb report-reader-breadcrumb",
			children: n
		}), /* @__PURE__ */ (0, K.jsxs)("div", {
			className: x,
			children: [
				/* @__PURE__ */ (0, K.jsxs)("section", {
					ref: m,
					className: "report-reader-dialog report-reader-main",
					"aria-labelledby": v,
					tabIndex: -1,
					children: [/* @__PURE__ */ (0, K.jsx)("div", {
						className: "report-reader-head",
						children: u && /* @__PURE__ */ (0, K.jsx)("button", {
							className: "icon-btn",
							type: "button",
							onClick: u,
							"aria-label": "리더 닫기",
							"data-qa": "dr-report-close",
							"data-tooltip": "닫기",
							"data-tooltip-pos": "left",
							children: "×"
						})
					}), /* @__PURE__ */ (0, K.jsxs)("div", {
						className: "report-reader-body",
						children: [/* @__PURE__ */ (0, K.jsxs)("section", {
							className: "report-hero react-report-hero",
							children: [e && /* @__PURE__ */ (0, K.jsx)("p", {
								className: "report-kicker",
								children: e
							}), /* @__PURE__ */ (0, K.jsx)("h1", {
								id: v,
								children: t
							})]
						}), /* @__PURE__ */ (0, K.jsx)("div", {
							className: "headline react-report-card",
							children: d
						})]
					})]
				}),
				r && /* @__PURE__ */ (0, K.jsx)("aside", {
					className: "report-reader-rail",
					"aria-label": "보고서 조작 패널",
					children: r
				}),
				y && /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [/* @__PURE__ */ (0, K.jsx)("button", {
					ref: h,
					className: f ? "report-note-grip is-open" : "report-note-grip",
					type: "button",
					"aria-label": "투자 노트 열기",
					"aria-controls": "report-reader-note-panel",
					"aria-expanded": f,
					"data-qa": "reader-note-open",
					onClick: () => p(!0)
				}), /* @__PURE__ */ (0, K.jsx)("aside", {
					ref: g,
					id: "report-reader-note-panel",
					className: f ? "report-note-panel is-open" : "report-note-panel",
					"aria-label": "투자 노트",
					role: f ? "dialog" : void 0,
					"aria-modal": f ? !0 : void 0,
					children: /* @__PURE__ */ (0, K.jsxs)("div", {
						className: "report-note-inner",
						children: [/* @__PURE__ */ (0, K.jsx)("button", {
							ref: _,
							className: "report-note-mobile-close",
							type: "button",
							"aria-label": "투자 노트 닫기",
							"data-qa": "reader-note-close",
							onClick: S,
							children: "×"
						}), y]
					})
				})] })
			]
		})]
	});
}
//#endregion
//#region src/app/RouteHero.tsx
function sn({ eyebrow: e, title: t, description: n, actions: r }) {
	return /* @__PURE__ */ (0, K.jsxs)("header", {
		className: "react-route-hero",
		children: [/* @__PURE__ */ (0, K.jsxs)("div", {
			className: "react-route-hero-copy",
			children: [
				/* @__PURE__ */ (0, K.jsx)("p", {
					className: "react-route-hero-eyebrow",
					children: e
				}),
				/* @__PURE__ */ (0, K.jsx)("h1", { children: t }),
				/* @__PURE__ */ (0, K.jsx)("p", {
					className: "react-route-hero-description",
					children: n
				})
			]
		}), r && /* @__PURE__ */ (0, K.jsx)("div", {
			className: "react-route-hero-actions",
			children: r
		})]
	});
}
//#endregion
//#region src/app/deepResearchPayload.ts
var cn = /^sc_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function ln(e) {
	return `#/deep-research/collections/${encodeURIComponent(e)}`;
}
function un(e) {
	return `#/deep-research/${encodeURIComponent(e)}`;
}
function dn(e) {
	let t = e.replace(/^#\/?/, "");
	if (t === "deep-research" || t === "deep-research/") return {
		kind: "list",
		id: "",
		malformed: !1
	};
	let n = t.match(/^deep-research\/collections\/(.+)$/);
	if (n) try {
		let e = decodeURIComponent(n[1]);
		return cn.test(e) ? {
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
function J(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function Y(e) {
	return typeof e == "string" ? e : "";
}
function fn(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function pn(e) {
	return Array.isArray(e) ? e.filter((e) => typeof e == "string") : [];
}
function mn(e) {
	if (typeof e != "string" || !e.trim()) return "";
	try {
		let t = new URL(e);
		return t.protocol === "http:" || t.protocol === "https:" ? t.href : "";
	} catch {
		return "";
	}
}
function hn(e) {
	return Y(e).trim().toLowerCase().replace(/[\s_-]+/g, "");
}
function gn(e) {
	if (!J(e)) return null;
	let t = fn(e.number), n = Y(e.hash);
	return t !== null || n ? {
		number: t,
		hash: n
	} : null;
}
function _n(e) {
	return J(e) ? Object.fromEntries(Object.entries(e).filter((e) => typeof e[1] == "number" && Number.isFinite(e[1]))) : {};
}
function vn(e, t = !1) {
	if (!J(e)) return {};
	let n = {};
	for (let [r, i] of Object.entries(e)) J(i) && (n[r] = {
		label: Y(i.label),
		question: t ? Y(i.question) : "",
		count: fn(i.count) ?? 0,
		level: Y(i.level)
	});
	return n;
}
function yn(e) {
	if (!J(e)) return null;
	let t = J(e.deepResearch) ? e.deepResearch : {}, n = Array.isArray(e.analysisAxes) ? e.analysisAxes.filter(J).map((e) => ({
		key: Y(e.key),
		label: Y(e.label),
		questions: pn(e.questions)
	})).filter((e) => e.key || e.label) : [];
	return {
		topic: Y(e.topic),
		reportType: Y(e.reportType),
		userIntent: Y(e.userIntent),
		researchQuestions: pn(e.researchQuestions),
		analysisAxes: n,
		searchQueries: pn(e.searchQueries),
		expectedSections: pn(e.expectedSections),
		dataGapsLikely: pn(e.dataGapsLikely),
		falsificationTriggers: pn(t.falsificationTriggers)
	};
}
function bn(e) {
	if (!J(e)) return null;
	let t = vn(e.axisCoverage), n = vn(e.questionCoverage, !0);
	return {
		totalDocs: fn(e.totalDocs) ?? 0,
		roleCounts: _n(e.roleCounts),
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
		dataGaps: pn(e.dataGaps),
		memoryCount: fn(e.memoryCount) ?? 0
	};
}
function xn(e) {
	return Array.isArray(e) ? e.filter(J).map((e) => ({
		id: Y(e.id),
		title: Y(e.title),
		source: Y(e.source),
		date: Y(e.date),
		role: Y(e.role),
		axis: Y(e.axis),
		confidence: Y(e.confidence),
		url: mn(e.url)
	})).filter((e) => !!(e.id && (e.title || e.source))) : [];
}
function Sn(e) {
	return Array.isArray(e) ? e.filter(J).filter((e) => {
		let t = Y(e.artifactType).toLowerCase(), n = Y(e.type).toLowerCase(), r = Y(e.evidenceRole).toLowerCase(), i = Y(e.sourceLayer ?? e.source_layer).toLowerCase(), a = hn(e.generatedBy ?? e.generated_by);
		return t !== "user_note" && n !== "user_note" && r !== "hypothesis" && i !== "hypothesis" && i !== "primary_processed" && a !== "folioos";
	}).map((e) => ({
		sourceId: Y(e.sourceId),
		title: Y(e.title),
		source: Y(e.source),
		date: Y(e.date),
		evidenceRole: Y(e.evidenceRole),
		reliability: Y(e.reliability),
		usedInSections: pn(e.usedInSections),
		url: mn(e.url),
		artifactType: Y(e.artifactType),
		artifactId: Y(e.artifactId),
		path: Y(e.path),
		axisKey: Y(e.axisKey),
		researchQuestionId: Y(e.researchQuestionId),
		researchRound: fn(e.researchRound)
	})).filter((e) => !!(e.sourceId && (e.title || e.source))) : [];
}
function Cn(e) {
	return Array.isArray(e) ? e.filter(J).map((e) => ({
		id: Y(e.id),
		severity: Y(e.severity),
		description: Y(e.description),
		suggestedAction: Y(e.suggestedAction),
		resolved: e.resolved === !0
	})).filter((e) => !!(e.id && e.description)) : [];
}
function wn(e) {
	return !J(e) || ![
		"score",
		"grade",
		"status",
		"warnings",
		"suggestedFixes"
	].some((t) => t in e) ? null : {
		score: fn(e.score),
		grade: Y(e.grade),
		status: Y(e.status),
		warnings: pn(e.warnings),
		suggestedFixes: pn(e.suggestedFixes)
	};
}
function Tn(e) {
	if (!J(e) || !J(e.resolution)) return null;
	let t = e.resolution, n = J(e.zeroEvidence) ? e.zeroEvidence : {}, r = J(t.providerGenerations) ? t.providerGenerations : {}, i = Array.isArray(t.unusableCandidates) ? t.unusableCandidates.filter(J).map((e) => ({
		candidateId: Y(e.candidateId),
		reason: Y(e.reason)
	})).filter((e) => e.candidateId) : [];
	return {
		schemaVersion: fn(t.schemaVersion),
		collectionId: Y(t.collectionId),
		collectionRevision: fn(t.collectionRevision),
		collectionDefinitionHash: Y(t.collectionDefinitionHash),
		eligibleTotal: fn(t.eligibleTotal),
		candidateCap: fn(t.candidateCap),
		resolvedCandidateIds: pn(t.resolvedCandidateIds),
		executionUniverseIds: pn(t.executionUniverseIds),
		selectedEvidenceIds: pn(t.selectedEvidenceIds),
		unusableCandidates: i,
		truncated: t.truncated === !0,
		resolvedAt: Y(e.resolvedAt),
		zeroEvidenceRequired: n.required === !0,
		zeroEvidenceReason: Y(n.reasonCode),
		resolutionFingerprint: Y(n.resolutionFingerprint),
		providerGenerations: {
			indexGeneration: typeof r.indexGeneration == "string" ? r.indexGeneration : null,
			rssGeneration: typeof r.rssGeneration == "string" ? r.rssGeneration : null
		},
		inputWatermark: typeof t.inputWatermark == "string" ? t.inputWatermark : null
	};
}
function En(e) {
	return e === null ? null : typeof e == "string" ? e : void 0;
}
function Dn(e) {
	if (!J(e) || typeof e.reason != "string" || typeof e.injected != "boolean") return;
	let t = {
		policy: Y(e.policy),
		requestedScope: Y(e.requestedScope),
		resolvedScope: Y(e.resolvedScope),
		injected: e.injected,
		reason: e.reason
	};
	if (!J(e.ref)) return e.injected ? void 0 : t;
	let n = e.ref, r = En(n.snapshotId), i = En(n.asOf), a = En(n.inputWatermark), o = En(n.relevantEvidenceWatermark);
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
function On(e) {
	return !J(e) || typeof e.approvalId != "string" || typeof e.executedAt != "string" ? null : {
		schemaVersion: fn(e.schemaVersion),
		approvalId: e.approvalId,
		planHash: Y(e.planHash),
		requestedMode: Y(e.requestedMode),
		attemptedEngine: Y(e.attemptedEngine),
		finalEngine: Y(e.finalEngine),
		fallbackReason: e.fallbackReason === null ? null : Y(e.fallbackReason),
		adapter: Y(e.adapter),
		executedAt: e.executedAt
	};
}
function kn(e, t) {
	if (!J(e)) return null;
	let n = gn(t);
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
	let r = gn(e.canonicalRevision), i = !!(n && r && (n.number !== null && r.number !== null && n.number !== r.number || n.hash && r.hash && n.hash !== r.hash)), a = Array.isArray(e.linkedNotes) ? e.linkedNotes.filter(J).map((e) => ({
		title: Y(e.title),
		type: Y(e.type),
		ticker: Y(e.ticker)
	})).filter((e) => e.title) : [], o = e.stale === !0 || e.staleReason === "canonical_revision_changed" || i;
	return {
		markdown: Y(e.markdown),
		stale: o,
		staleReason: Y(e.staleReason),
		canonicalRevision: r,
		linkedNotes: a,
		counterEvidence: pn(e.counterEvidence),
		contradictions: pn(e.contradictions),
		uncertainties: pn(e.uncertainties),
		personalQuestions: pn(e.personalQuestions),
		revisionState: o ? "stale" : r && n ? "current" : "legacy_unknown"
	};
}
function An(e, t, n) {
	return !(t in e) || e[t] === void 0 ? !1 : n === "array" ? !Array.isArray(e[t]) : !J(e[t]);
}
function jn(e) {
	if (!J(e) || typeof e.id != "string" || !e.id.trim() || typeof e.markdown != "string") throw Error("topic_report_contract_invalid");
	let t = [];
	for (let n of [
		"evidenceItems",
		"sourceLedger",
		"dataGaps",
		"checkpoints"
	]) An(e, n, "array") && t.push(n + "_invalid");
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
	]) An(e, n, "record") && t.push(n + "_invalid");
	let n = xn(e.evidenceItems), r = Sn(e.sourceLedger), i = Cn(e.dataGaps), a = yn(e.topicPlan), o = bn(e.evidencePackSummary), s = wn(e.quality), c = Tn(e.researchResolution), l = Dn(e.marketStateResolution), u = On(e.executionProvenance);
	Array.isArray(e.evidenceItems) && n.length < e.evidenceItems.length && t.push("evidenceItems_rows_invalid"), Array.isArray(e.sourceLedger) && r.length < e.sourceLedger.length && t.push("sourceLedger_rows_invalid"), Array.isArray(e.dataGaps) && i.length < e.dataGaps.length && t.push("dataGaps_rows_invalid"), e.marketStateResolution !== void 0 && !l && !t.includes("marketStateResolution_invalid") && t.push("marketStateResolution_invalid"), e.executionProvenance !== void 0 && !u && !t.includes("executionProvenance_invalid") && t.push("executionProvenance_invalid");
	let d = gn(e.canonicalRevision), f = kn(e.personalOverlay, d);
	for (let [n, r] of [
		["topicPlan", a],
		["evidencePackSummary", o],
		["quality", s],
		["researchResolution", c],
		["personalOverlay", f]
	]) n in e && e[n] !== void 0 && r === null && !t.includes(n + "_invalid") && t.push(n + "_invalid");
	let p = J(e.generation) ? {
		message: Y(e.generation.message),
		mode: Y(e.generation.mode),
		generatedAt: Y(e.generation.generatedAt)
	} : null, m = Array.isArray(e.sources) ? e.sources.filter(J).map((e) => ({
		source: Y(e.source),
		date: Y(e.date),
		title: Y(e.title),
		url: mn(e.url),
		path: Y(e.path)
	})).filter((e) => e.title || e.source || e.url || e.path) : [];
	return {
		id: e.id,
		topicKey: Y(e.topicKey),
		topicLabel: Y(e.topicLabel),
		date: Y(e.date),
		generatedAt: Y(e.generatedAt),
		mode: Y(e.mode),
		saved: e.saved === !0,
		markdown: e.markdown,
		docCount: fn(e.docCount) ?? 0,
		memoryCount: fn(e.memoryCount) ?? 0,
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
		qualityPreflight: J(e.qualityPreflight) ? e.qualityPreflight : null,
		executionProvenance: u,
		checkpoints: Array.isArray(e.checkpoints) ? e.checkpoints.filter(J) : [],
		marketTape: J(e.marketTape) ? e.marketTape : null,
		canonicalRevision: d,
		personalOverlay: f,
		contractWarnings: t
	};
}
function Mn(e) {
	return Array.isArray(e) ? e.filter(J).map((e) => ({
		id: Y(e.id),
		topicKey: Y(e.topicKey),
		topicLabel: Y(e.topicLabel),
		date: Y(e.date),
		generatedAt: Y(e.generatedAt),
		mode: Y(e.mode),
		saved: e.saved === !0
	})).filter((e) => !!e.id) : [];
}
//#endregion
//#region src/app/BriefingRoute.tsx
var Nn = {
	us: "미국",
	kr: "한국",
	both: "통합"
}, Pn = {
	us: "US",
	kr: "KR",
	both: "US/KR"
}, Fn = /* @__PURE__ */ new Set([
	"미국장",
	"한국장",
	"종합"
]), In = {
	default: "기본",
	market_focused: "시황 중심",
	concise: "요약"
}, Ln = 20;
function Rn(e) {
	return String(e || "").replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1.$2.$3");
}
function zn(e) {
	let t = String(e || "").match(/^(\d{4})-(\d{2})/);
	return t ? `${t[1]}.${t[2]}` : "월 미상";
}
function Bn() {
	let e = /* @__PURE__ */ new Date(), t = e.getTimezoneOffset() * 6e4;
	return new Date(e.getTime() - t).toISOString().slice(0, 10);
}
function Vn(e) {
	return String(e || "").replace(/\s+[—–-]\s+\d{4}[.-]\d{2}[.-]\d{2}\s*$/, "").trim();
}
function Hn(e) {
	let t = Yn(e), n = Xn(e), r = n === "us" ? "US Market Briefing" : n === "kr" ? "KR Market Briefing" : Vn(e.title || "Daily Market Briefing"), i = Rn(t);
	return {
		date: t,
		scope: n,
		title: i ? `${r} — ${i}` : r,
		chips: (e.tags || []).filter((e) => !Fn.has(String(e || "").trim())),
		foot: `${e.sessionDate ? `시장 기준일 ${e.sessionDate}` : "시장 기준일 미상"} · ${e.generatedAt ? new Date(e.generatedAt).toLocaleString("ko-KR") : "생성 시각 미상"}`
	};
}
function Un(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function Wn(e) {
	return e === "us" || e === "kr" || e === "both" ? e : "both";
}
function Gn() {
	let e = window.location.hash.match(/^#\/?briefing\/(\d{4}-\d{2}-\d{2})(?:\/(us|kr|both))?$/);
	return e ? {
		date: e[1],
		scope: Wn(e[2])
	} : null;
}
function Kn() {
	return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "briefing";
}
function qn(e, t = "both") {
	window.location.hash = e ? `#/briefing/${e}/${t}` : "#/briefing";
}
function Jn(e = "", t = "시장 브리핑") {
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
function Yn(e) {
	return e.reportDate || e.date || "";
}
function Xn(e) {
	return Wn(e.marketScope || e.scope);
}
function Zn(e) {
	return String(e || "").trim().toLowerCase();
}
function Qn(e, t) {
	let n = String(t || e || "note"), r = 2166136261;
	for (let e = 0; e < n.length; e += 1) r ^= n.charCodeAt(e), r = Math.imul(r, 16777619) >>> 0;
	return `${e}-${r.toString(36)}`;
}
function $n(e, t) {
	return {
		id: Qn("brief", `${e}:${t}`),
		noteType: "market_memo",
		title: e ? `브리핑 ${e} 투자 노트` : "브리핑 투자 노트",
		label: e ? `브리핑 ${e}` : "브리핑",
		topic: t,
		reportKind: "briefing",
		reportId: e,
		linkedReports: [e ? `Daily Market Briefing — ${e}` : ""].filter(Boolean)
	};
}
function er(e) {
	let t = e;
	return !!(t?.id && N(t.status));
}
async function tr(e) {
	let t = e;
	for (; N(t.status);) await Un(1e3), t = await L(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "브리핑 생성에 실패했습니다.");
	return t;
}
function nr() {
	let [e, t] = (0, c.useState)(null), [n, r] = (0, c.useState)(() => Gn()), [i, a] = (0, c.useState)(null), [o, s] = (0, c.useState)(!1), [l, u] = (0, c.useState)(!1), [d, f] = (0, c.useState)(""), [p, m] = (0, c.useState)(""), [h, g] = (0, c.useState)(""), [_, v] = (0, c.useState)("us"), [y, b] = (0, c.useState)("default"), [x, S] = (0, c.useState)(() => Bn()), [C, w] = (0, c.useState)(""), [T, E] = (0, c.useState)("all"), [D, O] = (0, c.useState)("all"), [k, A] = (0, c.useState)(""), [j, M] = (0, c.useState)(""), [N, P] = (0, c.useState)("recent"), [F, I] = (0, c.useState)(0), z = (0, c.useCallback)(async () => {
		s(!0), f("");
		try {
			let e = await L(`/api/briefings/index?${new URLSearchParams({
				offset: "0",
				limit: "100",
				q: C,
				marketScope: T,
				briefingType: D,
				dateFrom: k,
				dateTo: j
			})}`);
			t(e), W("briefing", {
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
		j,
		T,
		C,
		k,
		D
	]);
	(0, c.useEffect)(() => {
		z();
	}, [z]), (0, c.useEffect)(() => {
		let e = () => {
			Kn() && r(Gn());
		};
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []), (0, c.useEffect)(() => {
		let e = (e) => {
			let t = e.detail;
			Ue(t, window.FolioAgent?.currentContext) && I((e) => e + 1);
		};
		return window.addEventListener(fe, e), () => window.removeEventListener(fe, e);
	}, []), (0, c.useEffect)(() => {
		let e = !0;
		async function t(t, n) {
			s(!0), f("");
			try {
				let r = await L(`/api/briefings/${encodeURIComponent(t)}?includePersonal=true&marketScope=${encodeURIComponent(n)}`);
				if (!e) return;
				a(r), W("briefing", {
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
		return n ? t(n.date, n.scope) : (a(null), W("briefing", {
			surface: "briefing",
			viewId: "briefing",
			reportKind: "",
			reportId: ""
		})), () => {
			e = !1;
		};
	}, [n, F]);
	async function B(e) {
		let t = i?.date || n?.date || "", r = Wn(i?.marketScope || n?.scope);
		if (t) {
			g(e), m(e === "notion" ? "Notion에 내보내는 중..." : "Obsidian에 내보내는 중...");
			try {
				let n = e === "notion" ? await R(`/api/briefings/${encodeURIComponent(t)}/export-notion?marketScope=${encodeURIComponent(r)}`, { marketScope: r }) : await R(`/api/briefings/${encodeURIComponent(t)}/export-obsidian?marketScope=${encodeURIComponent(r)}`, { marketScope: r });
				m(e === "notion" ? n.notionUrl ? `Notion 내보냄: ${n.title || n.notionUrl}` : "Notion에 내보냈습니다." : `Obsidian 내보냄: ${n.filename || t}`);
			} catch (e) {
				m(e instanceof Error ? e.message : "내보내기에 실패했습니다.");
			} finally {
				g("");
			}
		}
	}
	async function V() {
		let e = i?.date || n?.date || "", t = Wn(i?.marketScope || n?.scope);
		if (e) {
			g("overlay"), m("개인 해석을 생성하는 중...");
			try {
				let n = await R(`/api/briefings/${encodeURIComponent(e)}/personal-overlay?marketScope=${encodeURIComponent(t)}`, { marketScope: t });
				er(n) && await tr(n);
				let r = await L(`/api/briefings/${encodeURIComponent(e)}?includePersonal=true&marketScope=${encodeURIComponent(t)}`);
				a(r), m("개인 해석을 생성했습니다.");
			} catch (e) {
				m(e instanceof Error ? e.message : "개인 해석 생성에 실패했습니다.");
			} finally {
				g("");
			}
		}
	}
	async function ee(e, t) {
		if (e && window.confirm(`${e} ${Nn[t]} 브리핑을 삭제할까요?`)) {
			g(`delete-${e}-${t}`);
			try {
				let n = t === "both" ? "" : `?market=${encodeURIComponent(t)}`;
				await fetch(`/api/briefings/${encodeURIComponent(e)}${n}`, { method: "DELETE" }), await z();
			} catch (e) {
				f(e instanceof Error ? e.message : "브리핑 삭제에 실패했습니다.");
			} finally {
				g("");
			}
		}
	}
	async function H(e) {
		u(!0), f("");
		try {
			let t = await R("/api/briefings", {
				date: e || void 0,
				strictDate: !!e,
				marketScope: _,
				briefingType: y
			});
			if (er(t)) {
				let n = await tr(t), r = n.result?.date || n.result?.artifactId || e || "";
				await z(), r && qn(r, _);
				return;
			}
			let n = t.date || e || "";
			await z(), n && qn(n, Wn(t.marketScope || _));
		} catch (e) {
			f(e instanceof Error ? e.message : "브리핑 생성에 실패했습니다.");
		} finally {
			u(!1);
		}
	}
	let te = e?.items || [], U = (0, c.useMemo)(() => {
		let e = Zn(C);
		return te.filter((t) => {
			let n = Yn(t), r = Xn(t), i = t.briefingType || "default";
			return T !== "all" && r !== T || D !== "all" && i !== D || k && n && n < k || j && n && n > j ? !1 : !e || Zn([
				t.title,
				n,
				t.sessionDate,
				t.generatedAt,
				i,
				...t.tags || []
			].filter(Boolean).join(" ")).includes(e);
		});
	}, [
		j,
		T,
		C,
		k,
		D,
		te
	]), ne = (0, c.useMemo)(() => {
		let e = [...U].sort((e, t) => String(Yn(t) || t.generatedAt || "").localeCompare(String(Yn(e) || e.generatedAt || "")));
		if (N === "recent") return e.length ? [{
			label: `최근 브리핑 ${Math.min(e.length, Ln)}건`,
			rows: e.slice(0, Ln)
		}] : [];
		if (N === "month") {
			let t = /* @__PURE__ */ new Map();
			for (let n of e) {
				let e = zn(Yn(n));
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
			label: `${Nn[t]} 시장`,
			rows: e.filter((e) => Xn(e) === t)
		})).filter((e) => e.rows.length > 0);
	}, [N, U]), re = (0, c.useMemo)(() => Jn(i?.markdown || "", i?.title || "시장 브리핑"), [i?.markdown, i?.title]);
	return n && i ? /* @__PURE__ */ (0, K.jsxs)("div", {
		className: "react-briefing-route",
		"data-briefing-route": !0,
		children: [d && /* @__PURE__ */ (0, K.jsx)("p", {
			className: "react-dashboard-error",
			children: d
		}), /* @__PURE__ */ (0, K.jsx)(on, {
			eyebrow: `DAILY BRIEFING · ${i.date || n.date}`,
			title: re.title,
			agentContext: {
				surface: "briefing_reader",
				viewId: "briefing",
				reportKind: "briefing",
				reportId: i.date || n.date,
				marketScope: Wn(i.marketScope || n.scope)
			},
			breadcrumb: /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [/* @__PURE__ */ (0, K.jsx)("button", {
				type: "button",
				onClick: () => qn(),
				children: "브리핑"
			}), /* @__PURE__ */ (0, K.jsx)("span", { children: re.title })] }),
			onClose: () => qn(),
			actionSlot: /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [
				/* @__PURE__ */ (0, K.jsx)(jt, {
					title: "AI",
					children: /* @__PURE__ */ (0, K.jsx)(Mt, {
						icon: "agent",
						onClick: () => ae({
							surface: "briefing_reader",
							reportKind: "briefing",
							reportId: i.date || n.date,
							marketScope: Wn(i.marketScope || n.scope),
							message: `${re.title}의 핵심과 투자 판단 체크포인트를 요약해줘.`,
							autoSubmit: !0
						}),
						children: "Agent에게 묻기"
					})
				}),
				/* @__PURE__ */ (0, K.jsx)(jt, {
					title: "노트",
					children: /* @__PURE__ */ (0, K.jsx)(Mt, {
						icon: "link",
						disabled: h === "overlay",
						onClick: V,
						children: h === "overlay" ? "생성 중" : "내 노트와 연결"
					})
				}),
				/* @__PURE__ */ (0, K.jsxs)(jt, {
					title: "내보내기",
					children: [/* @__PURE__ */ (0, K.jsx)(Mt, {
						icon: "notion",
						disabled: h === "notion",
						onClick: () => B("notion"),
						children: h === "notion" ? "내보내는 중" : "Notion으로 내보내기"
					}), /* @__PURE__ */ (0, K.jsx)(Mt, {
						icon: "obsidian",
						disabled: h === "obsidian",
						onClick: () => B("obsidian"),
						children: h === "obsidian" ? "내보내는 중" : "Obsidian으로 내보내기"
					})]
				}),
				p && /* @__PURE__ */ (0, K.jsx)("p", {
					className: "react-reader-status",
					children: p
				})
			] }),
			noteIdentity: $n(i.date || n.date, Wn(i.marketScope || n.scope)),
			noteLinkedTitle: re.title,
			noteOverlay: kn(i.personalOverlay, i.canonicalRevision),
			children: /* @__PURE__ */ (0, K.jsx)(Rt, {
				markdown: re.body || i.markdown || "",
				marketScope: Wn(i.marketScope || n.scope),
				briefing: i,
				sourcePanelHtml: At().briefingSourcePanelHtml?.(i) || ""
			})
		})]
	}) : /* @__PURE__ */ (0, K.jsxs)("div", {
		className: "react-briefing-route",
		"data-briefing-route": !0,
		children: [
			/* @__PURE__ */ (0, K.jsx)(sn, {
				eyebrow: "Briefing",
				title: "브리핑",
				description: "수집된 최신 뉴스와 시장 데이터를 바탕으로 미국장과 한국장 흐름을 요약합니다."
			}),
			/* @__PURE__ */ (0, K.jsx)("section", {
				className: "brief-gen-box input-panel react-briefing-generation",
				"aria-label": "브리핑 생성",
				children: /* @__PURE__ */ (0, K.jsxs)("section", {
					className: "brief-gen-panel brief-gen-settings",
					children: [
						/* @__PURE__ */ (0, K.jsx)("div", {
							className: "brief-gen-panel-head",
							children: /* @__PURE__ */ (0, K.jsx)("h3", { children: "브리핑 설정" })
						}),
						/* @__PURE__ */ (0, K.jsxs)("div", {
							className: "brief-gen-settings-row",
							children: [/* @__PURE__ */ (0, K.jsx)("div", {
								className: "brief-gen-field brief-gen-market-field",
								children: /* @__PURE__ */ (0, K.jsxs)("div", {
									className: "brief-market-segment",
									role: "radiogroup",
									"aria-label": "시장 범위",
									"data-scope": _,
									children: [/* @__PURE__ */ (0, K.jsx)("span", {
										className: "brief-market-segment-title",
										children: "시장"
									}), [
										["both", "종합"],
										["us", "미국장"],
										["kr", "한국장"]
									].map(([e, t]) => /* @__PURE__ */ (0, K.jsxs)("label", { children: [/* @__PURE__ */ (0, K.jsx)("input", {
										type: "radio",
										name: "reactBriefingMarketScope",
										value: e,
										checked: _ === e,
										onChange: () => v(e)
									}), /* @__PURE__ */ (0, K.jsx)("span", { children: t })] }, e))]
								})
							}), /* @__PURE__ */ (0, K.jsxs)("label", {
								className: "gen-option quality-option",
								children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "유형" }), /* @__PURE__ */ (0, K.jsx)("select", {
									value: y,
									onChange: (e) => b(e.currentTarget.value),
									children: Object.entries(In).map(([e, t]) => /* @__PURE__ */ (0, K.jsx)("option", {
										value: e,
										children: t
									}, e))
								})]
							})]
						}),
						/* @__PURE__ */ (0, K.jsxs)("div", {
							className: "brief-gen-actionbar",
							children: [
								/* @__PURE__ */ (0, K.jsx)("button", {
									className: "filter-btn clear icon-btn",
									type: "button",
									onClick: z,
									disabled: o,
									"aria-label": "새로고침",
									"data-tooltip": "새로고침",
									children: "↻"
								}),
								/* @__PURE__ */ (0, K.jsx)("button", {
									className: "filter-btn apply",
									type: "button",
									onClick: () => H(),
									disabled: l,
									children: l ? "생성 중" : "오늘 브리핑 생성"
								}),
								/* @__PURE__ */ (0, K.jsx)("span", {
									className: "brief-gen-actionbar-divider",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, K.jsx)("input", {
									type: "date",
									value: x,
									onChange: (e) => S(e.currentTarget.value),
									"aria-label": "생성할 브리핑 날짜"
								}),
								/* @__PURE__ */ (0, K.jsx)("button", {
									className: "filter-btn clear",
									type: "button",
									onClick: () => H(x),
									disabled: l || !x,
									children: "이 날짜로 생성"
								})
							]
						})
					]
				})
			}),
			d && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-error",
				children: d
			}),
			/* @__PURE__ */ (0, K.jsxs)("section", {
				className: "input-panel react-briefing-archive-panel report-feed-controls",
				"aria-label": "저장 브리핑 검색",
				children: [/* @__PURE__ */ (0, K.jsxs)("div", {
					className: "briefing-archive-filters",
					children: [
						/* @__PURE__ */ (0, K.jsxs)("label", { children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "검색" }), /* @__PURE__ */ (0, K.jsx)("input", {
							type: "search",
							value: C,
							onChange: (e) => w(e.currentTarget.value),
							placeholder: "제목·요약·본문 검색"
						})] }),
						/* @__PURE__ */ (0, K.jsxs)("label", { children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "시작일" }), /* @__PURE__ */ (0, K.jsx)("input", {
							type: "date",
							value: k,
							onChange: (e) => A(e.currentTarget.value)
						})] }),
						/* @__PURE__ */ (0, K.jsxs)("label", { children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "종료일" }), /* @__PURE__ */ (0, K.jsx)("input", {
							type: "date",
							value: j,
							onChange: (e) => M(e.currentTarget.value)
						})] }),
						/* @__PURE__ */ (0, K.jsx)("button", {
							className: "filter-btn clear",
							type: "button",
							onClick: () => {
								w(""), E("all"), O("all"), A(""), M(""), P("recent");
							},
							children: "초기화"
						})
					]
				}), /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "briefing-archive-summary",
					children: [/* @__PURE__ */ (0, K.jsxs)("span", { children: [U.length, "건"] }), /* @__PURE__ */ (0, K.jsx)("span", {
						"aria-live": "polite",
						children: o ? "불러오는 중..." : C ? "검색 결과" : ""
					})]
				})]
			}),
			/* @__PURE__ */ (0, K.jsx)("div", {
				className: "report-feed-outside-controls",
				"aria-label": "브리핑 표시 옵션",
				children: /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "report-feed-view-row",
					children: [
						/* @__PURE__ */ (0, K.jsx)("span", { children: "시장" }),
						/* @__PURE__ */ (0, K.jsx)("label", {
							className: "report-feed-view-pill",
							children: /* @__PURE__ */ (0, K.jsxs)("select", {
								"aria-label": "브리핑 시장",
								value: T,
								onChange: (e) => E(e.currentTarget.value),
								children: [
									/* @__PURE__ */ (0, K.jsx)("option", {
										value: "all",
										children: "전체"
									}),
									/* @__PURE__ */ (0, K.jsx)("option", {
										value: "us",
										children: "미국장"
									}),
									/* @__PURE__ */ (0, K.jsx)("option", {
										value: "kr",
										children: "한국장"
									}),
									/* @__PURE__ */ (0, K.jsx)("option", {
										value: "both",
										children: "종합 보고서"
									})
								]
							})
						}),
						/* @__PURE__ */ (0, K.jsx)("span", { children: "유형" }),
						/* @__PURE__ */ (0, K.jsx)("label", {
							className: "report-feed-view-pill",
							children: /* @__PURE__ */ (0, K.jsxs)("select", {
								"aria-label": "브리핑 유형",
								value: D,
								onChange: (e) => O(e.currentTarget.value),
								children: [/* @__PURE__ */ (0, K.jsx)("option", {
									value: "all",
									children: "전체"
								}), Object.entries(In).map(([e, t]) => /* @__PURE__ */ (0, K.jsx)("option", {
									value: e,
									children: t
								}, e))]
							})
						}),
						/* @__PURE__ */ (0, K.jsx)("span", { children: "보기" }),
						/* @__PURE__ */ (0, K.jsx)("label", {
							className: "report-feed-view-pill",
							children: /* @__PURE__ */ (0, K.jsxs)("select", {
								"aria-label": "브리핑 보기 방식",
								value: N,
								onChange: (e) => P(e.currentTarget.value),
								children: [
									/* @__PURE__ */ (0, K.jsx)("option", {
										value: "recent",
										children: "최근"
									}),
									/* @__PURE__ */ (0, K.jsx)("option", {
										value: "month",
										children: "월별"
									}),
									/* @__PURE__ */ (0, K.jsx)("option", {
										value: "market",
										children: "시장별"
									})
								]
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, K.jsx)("section", {
				className: "briefing-archive-feed",
				"aria-label": "저장 브리핑",
				children: ne.length ? ne.map((e) => /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "briefing-archive-date-group",
					children: [/* @__PURE__ */ (0, K.jsx)("h3", { children: e.label }), e.rows.map((e) => {
						let t = Hn(e), n = h === `delete-${t.date}-${t.scope}`;
						return /* @__PURE__ */ (0, K.jsxs)("div", {
							className: "briefing-archive-card-wrap",
							children: [/* @__PURE__ */ (0, K.jsxs)("button", {
								type: "button",
								className: `briefing-archive-card is-${t.scope}`,
								onClick: () => t.date && qn(t.date, t.scope),
								children: [
									/* @__PURE__ */ (0, K.jsxs)("span", {
										className: "briefing-archive-card-meta",
										children: [/* @__PURE__ */ (0, K.jsx)("span", {
											className: "briefing-archive-market",
											children: Pn[t.scope]
										}), t.chips.map((e) => /* @__PURE__ */ (0, K.jsx)("span", {
											className: "briefing-archive-chip",
											children: e
										}, e))]
									}),
									/* @__PURE__ */ (0, K.jsx)("strong", { children: t.title }),
									/* @__PURE__ */ (0, K.jsx)("span", {
										className: "briefing-archive-card-foot",
										children: t.foot
									})
								]
							}), /* @__PURE__ */ (0, K.jsx)("button", {
								type: "button",
								className: "briefing-archive-card-delete",
								disabled: n,
								onClick: () => ee(t.date, t.scope),
								"aria-label": `${t.date} 브리핑 삭제`,
								"data-tooltip": "삭제",
								children: /* @__PURE__ */ (0, K.jsx)("svg", {
									width: "14",
									height: "14",
									viewBox: "0 0 16 16",
									fill: "none",
									stroke: "currentColor",
									strokeWidth: "1.4",
									strokeLinecap: "round",
									strokeLinejoin: "round",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, K.jsx)("path", { d: "M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" })
								})
							})]
						}, e.id || `${t.date}-${t.scope}`);
					})]
				}, e.label)) : /* @__PURE__ */ (0, K.jsx)("div", {
					className: "briefing-archive-empty",
					children: "조건에 맞는 저장 브리핑이 없습니다."
				})
			})
		]
	});
}
//#endregion
//#region src/app/routes.ts
var rr = [
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
		id: "settings",
		label: "설정",
		group: "system"
	}
], ir = rr.filter((e) => e.visibleInNav !== !1), ar = "home";
function or(e) {
	let t = e.replace(/^#\/?/, "").split("/")[0];
	return rr.some((e) => e.id === t) ? t : ar;
}
function sr(e) {
	return `#/${e}`;
}
function cr(e) {
	return rr.find((t) => t.id === e) ?? rr[0];
}
//#endregion
//#region src/app/CommandPalette.tsx
function lr(e) {
	return e === "home" ? "Agent Home" : e === "dashboard" ? "위젯과 하단 대시보드" : e === "briefing" ? "저장 브리핑과 생성" : e === "rss" ? "RSS 수집 자료" : e === "market-memory" ? "중기 시장 내러티브" : e === "analysis" ? "기업 분석 보고서" : e === "deep-research" ? "딥 리서치 보고서" : e === "watchlist" ? "워치리스트" : "설정";
}
function ur(e) {
	return e === "us" || e === "kr" || e === "both" ? e : "both";
}
function dr(e) {
	return e.reportDate || e.date || "";
}
function fr() {
	let [e, t] = (0, c.useState)(!1), [n, r] = (0, c.useState)(""), [i, a] = (0, c.useState)(0), [o, s] = (0, c.useState)(null), l = (0, c.useRef)(null), u = (0, c.useRef)(null), d = (0, c.useRef)(null);
	(0, c.useEffect)(() => {
		if (!e || o) return;
		let t = !0;
		return L("/api/dashboard").then((e) => {
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
	let f = (0, c.useMemo)(() => {
		let e = ir.map((e) => ({
			id: `route:${e.id}`,
			title: e.label,
			subtitle: lr(e.id),
			type: "화면",
			qa: e.id === "deep-research" ? "command-deep-research" : void 0,
			run: () => {
				window.location.hash = sr(e.id);
			}
		})), t = (o?.briefings || []).slice(0, 12).map((e) => {
			let t = dr(e), n = ur(e.marketScope || e.scope);
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
				run: () => ae({ surface: "command_palette" })
			},
			...e,
			...t
		];
	}, [o?.briefings]), p = (0, c.useMemo)(() => {
		let e = n.trim().toLowerCase();
		return (e ? f.filter((t) => `${t.title} ${t.subtitle} ${t.type}`.toLowerCase().includes(e)) : f).slice(0, 40);
	}, [f, n]);
	(0, c.useEffect)(() => {
		a((e) => Math.min(e, Math.max(0, p.length - 1)));
	}, [p.length]);
	function m(e = !0) {
		t(!1), r(""), a(0);
		let n = d.current;
		d.current = null, e && n && window.requestAnimationFrame(() => n.focus({ preventScroll: !0 }));
	}
	function h(e = i) {
		let t = p[e];
		t && (t.run(), m(!1));
	}
	return (0, c.useEffect)(() => {
		let n = (n) => {
			let r = n.key || "";
			if ((n.ctrlKey || n.metaKey) && r.toLowerCase() === "k") {
				n.preventDefault(), e ? m() : (d.current = document.activeElement instanceof HTMLElement ? document.activeElement : null, t(!0));
				return;
			}
			if (e) {
				if (r === "Escape") {
					n.preventDefault(), m();
					return;
				}
				if (r === "ArrowDown") {
					n.preventDefault(), a((e) => Math.min(Math.max(0, p.length - 1), e + 1));
					return;
				}
				if (r === "ArrowUp") {
					n.preventDefault(), a((e) => Math.max(0, e - 1));
					return;
				}
				if (r === "Enter") {
					n.preventDefault(), h();
					return;
				}
				if (r === "Tab") {
					let e = u.current, t = e ? Array.from(e.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex=\"-1\"])")).filter((e) => !e.hidden && e.getAttribute("aria-hidden") !== "true") : [];
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
		p,
		e
	]), e ? /* @__PURE__ */ (0, K.jsxs)("div", {
		className: "command-palette react-command-palette",
		"data-react-command-palette": !0,
		children: [/* @__PURE__ */ (0, K.jsx)("button", {
			className: "command-backdrop",
			type: "button",
			"aria-label": "명령 팔레트 닫기",
			onClick: () => m()
		}), /* @__PURE__ */ (0, K.jsxs)("section", {
			ref: u,
			className: "command-dialog",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "reactCommandPaletteTitle",
			tabIndex: -1,
			children: [
				/* @__PURE__ */ (0, K.jsxs)("div", {
					className: "command-input-row",
					children: [/* @__PURE__ */ (0, K.jsx)("span", {
						className: "command-mark",
						"aria-hidden": "true",
						children: "⌘K"
					}), /* @__PURE__ */ (0, K.jsx)("input", {
						ref: l,
						value: n,
						onChange: (e) => {
							r(e.currentTarget.value), a(0);
						},
						placeholder: "화면, 보고서, 액션 검색",
						"aria-label": "명령 검색"
					})]
				}),
				/* @__PURE__ */ (0, K.jsx)("h2", {
					id: "reactCommandPaletteTitle",
					children: "명령 팔레트"
				}),
				/* @__PURE__ */ (0, K.jsx)("div", {
					className: "command-list",
					role: "listbox",
					"aria-label": "명령 목록",
					children: p.length ? p.map((e, t) => /* @__PURE__ */ (0, K.jsxs)("button", {
						className: `command-item${t === i ? " active" : ""}`,
						type: "button",
						"data-qa": e.qa,
						role: "option",
						"aria-selected": t === i,
						onMouseEnter: () => a(t),
						onClick: () => h(t),
						children: [/* @__PURE__ */ (0, K.jsxs)("span", { children: [/* @__PURE__ */ (0, K.jsx)("span", {
							className: "command-item-title",
							children: e.title
						}), /* @__PURE__ */ (0, K.jsx)("span", {
							className: "command-item-subtitle",
							children: e.subtitle
						})] }), /* @__PURE__ */ (0, K.jsx)("span", {
							className: "command-item-type",
							children: e.type
						})]
					}, e.id)) : /* @__PURE__ */ (0, K.jsx)("div", {
						className: "command-empty",
						children: "검색 결과가 없습니다."
					})
				}),
				/* @__PURE__ */ (0, K.jsx)("div", {
					className: "command-footer",
					children: "Ctrl/⌘ K로 열고, Enter로 실행합니다."
				})
			]
		})]
	}) : null;
}
//#endregion
//#region src/app/reportReader/AnalysisCharts.tsx
var pr = [
	"var(--folio-chart-1)",
	"var(--folio-chart-2)",
	"var(--folio-chart-3)",
	"var(--folio-chart-4)",
	"var(--folio-chart-5)"
], mr = {
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
function hr(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function gr(e) {
	return Array.isArray(e) ? e.map(hr) : [];
}
function _r(e) {
	let t = String(e || "USD").toUpperCase();
	return t === "KRW" || t === "KRX" ? "₩" : t === "JPY" ? "¥" : t === "EUR" ? "€" : t === "GBP" ? "£" : "$";
}
function vr(e, t = "plain", n) {
	if (e === null) return "-";
	if (t === "percent") return `${(e * 100).toFixed(1)}%`;
	if (t === "money") {
		let t = _r(n), r = Math.abs(e);
		return r >= 0xe8d4a51000 ? `${t}${(e / 0xe8d4a51000).toFixed(1)}T` : r >= 1e9 ? `${t}${(e / 1e9).toFixed(1)}B` : r >= 1e6 ? `${t}${(e / 1e6).toFixed(1)}M` : `${t}${e.toLocaleString(void 0, { maximumFractionDigits: 2 })}`;
	}
	return e.toFixed(Math.abs(e) >= 100 ? 0 : 1);
}
function yr(e) {
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
		label: mr[t] || t,
		values: gr(e[t]),
		kind: n
	})).filter((e) => e.values.some((e) => e !== null));
}
function br(e) {
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
function xr(e, t, n, r = 16, i = 150) {
	return r + (1 - (e - t) / (n - t)) * i;
}
function Sr({ chart: e, series: t, onPoint: n, onLeave: r }) {
	let i = Array.isArray(e.years) ? e.years : [], { min: a, max: o } = br(t.flatMap((e) => e.values)), s = 464 / Math.max(1, i.length), c = Math.max(5, Math.min(18, (s - 10) / Math.max(1, t.length))), l = xr(0, a, o, 18, 148);
	return /* @__PURE__ */ (0, K.jsxs)("svg", {
		className: "analysis-chart-svg",
		viewBox: "0 0 520 220",
		role: "img",
		"aria-label": e.title || "기업 분석 차트",
		children: [
			/* @__PURE__ */ (0, K.jsx)("line", {
				x1: 36,
				y1: l,
				x2: 508,
				y2: l,
				stroke: "var(--folio-border)",
				strokeWidth: "1"
			}),
			i.map((i, u) => /* @__PURE__ */ (0, K.jsxs)("g", { children: [t.map((t, d) => {
				let f = t.values[u];
				if (f === null) return null;
				let p = xr(f, a, o, 18, 148), m = Math.max(2, Math.abs(l - p)), h = 36 + u * s + 8 + d * c, g = {
					label: i,
					series: t.label,
					value: vr(f, t.kind, e.currency),
					x: h + c / 2,
					y: Math.min(p, l)
				};
				return /* @__PURE__ */ (0, K.jsx)("rect", {
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
					fill: pr[d % pr.length]
				}, `${t.key}-${i}`);
			}), /* @__PURE__ */ (0, K.jsx)("text", {
				x: 36 + u * s + s / 2,
				y: 202,
				textAnchor: "middle",
				children: i
			})] }, i)),
			/* @__PURE__ */ (0, K.jsx)("text", {
				x: 36,
				y: 14,
				children: vr(o, t[0]?.kind, e.currency)
			}),
			/* @__PURE__ */ (0, K.jsx)("text", {
				x: 36,
				y: 180,
				children: vr(a, t[0]?.kind, e.currency)
			})
		]
	});
}
function Cr({ chart: e, series: t, onPoint: n, onLeave: r }) {
	let i = Array.isArray(e.years) ? e.years : [], { min: a, max: o } = br(t.flatMap((e) => e.values)), s = 452 / Math.max(1, i.length - 1);
	return /* @__PURE__ */ (0, K.jsxs)("svg", {
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
				return /* @__PURE__ */ (0, K.jsx)("line", {
					x1: 36,
					y1: t,
					x2: 508,
					y2: t,
					stroke: "var(--folio-border)",
					strokeWidth: "1"
				}, e);
			}),
			t.map((t, c) => /* @__PURE__ */ (0, K.jsxs)("g", { children: [/* @__PURE__ */ (0, K.jsx)("polyline", {
				points: t.values.map((e, t) => e === null ? null : `${36 + t * s},${xr(e, a, o, 18, 148)}`).filter(Boolean).join(" "),
				fill: "none",
				stroke: pr[c % pr.length],
				strokeWidth: "3",
				strokeLinejoin: "round",
				strokeLinecap: "round"
			}), t.values.map((l, u) => {
				if (l === null) return null;
				let d = 36 + u * s, f = xr(l, a, o, 18, 148), p = i[u] || `${u + 1}`, m = {
					label: p,
					series: t.label,
					value: vr(l, t.kind, e.currency),
					x: d,
					y: f
				};
				return /* @__PURE__ */ (0, K.jsx)("circle", {
					"aria-label": `${p} ${t.label} ${m.value}`,
					cx: d,
					cy: f,
					fill: pr[c % pr.length],
					onBlur: r,
					onFocus: () => n(m),
					onMouseEnter: () => n(m),
					onMouseLeave: r,
					r: "5",
					tabIndex: 0
				}, `${t.key}-${p}`);
			})] }, t.key)),
			i.map((e, t) => /* @__PURE__ */ (0, K.jsx)("text", {
				x: 36 + t * s,
				y: 202,
				textAnchor: "middle",
				children: e
			}, e)),
			/* @__PURE__ */ (0, K.jsx)("text", {
				x: 36,
				y: 14,
				children: vr(o, t[0]?.kind || "percent", e.currency)
			}),
			/* @__PURE__ */ (0, K.jsx)("text", {
				x: 36,
				y: 180,
				children: vr(a, t[0]?.kind || "percent", e.currency)
			})
		]
	});
}
function wr({ chart: e, onPoint: t, onLeave: n }) {
	let r = Array.isArray(e.scenarios) ? e.scenarios : [], { max: i } = br(r.map((e) => hr(e.perShare ?? e.price))), a = hr(e.currentPrice);
	return /* @__PURE__ */ (0, K.jsxs)("div", {
		className: "analysis-scenario-bars",
		children: [r.map((r, a) => {
			let o = hr(r.perShare ?? r.price), s = o === null || i <= 0 ? 0 : Math.max(4, Math.min(100, o / i * 100)), c = String(r.name || r.label || `Scenario ${a + 1}`), l = vr(o, "money", e.currency);
			return /* @__PURE__ */ (0, K.jsxs)("div", {
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
					/* @__PURE__ */ (0, K.jsx)("span", { children: c }),
					/* @__PURE__ */ (0, K.jsx)("div", { children: /* @__PURE__ */ (0, K.jsx)("i", { style: {
						width: `${s}%`,
						background: pr[a % pr.length]
					} }) }),
					/* @__PURE__ */ (0, K.jsx)("strong", { children: l })
				]
			}, c);
		}), a !== null && /* @__PURE__ */ (0, K.jsxs)("p", {
			className: "analysis-chart-note",
			children: ["현재가: ", vr(a, "money", e.currency)]
		})]
	});
}
function Tr({ chart: e, onPoint: t, onLeave: n }) {
	let r = Array.isArray(e.labels) ? e.labels : [], i = Object.entries(e.series || {}).map(([e, t]) => ({
		key: e,
		label: e,
		values: Array.isArray(t) ? t.map((e) => typeof e == "number" ? e / 100 : null) : [],
		kind: "percent"
	}));
	return /* @__PURE__ */ (0, K.jsx)(Cr, {
		chart: {
			...e,
			years: r
		},
		series: i,
		onPoint: t,
		onLeave: n
	});
}
function Er(e) {
	return /* @__PURE__ */ (0, K.jsx)("div", {
		className: "analysis-chart-legend",
		children: e.map((e, t) => /* @__PURE__ */ (0, K.jsxs)("span", { children: [/* @__PURE__ */ (0, K.jsx)("i", { style: { background: pr[t % pr.length] } }), e.label] }, e.key))
	});
}
function Dr({ chart: e }) {
	let [t, n] = (0, c.useState)(null), r = yr(e), i = String(e.kind || e.id || ""), a = t?.x === void 0 ? void 0 : {
		left: `${Math.max(7, Math.min(93, t.x / 520 * 100))}%`,
		top: `${Math.max(10, t.y || 10)}px`
	};
	return /* @__PURE__ */ (0, K.jsxs)("article", {
		className: "analysis-chart-card",
		children: [
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "analysis-chart-title",
				children: [/* @__PURE__ */ (0, K.jsx)("h4", { children: e.title || "Analysis Chart" }), e.subtitle && /* @__PURE__ */ (0, K.jsx)("p", { children: e.subtitle })]
			}),
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "analysis-chart-plot",
				children: [
					i === "margins" && r.length ? /* @__PURE__ */ (0, K.jsx)(Cr, {
						chart: e,
						series: r,
						onPoint: n,
						onLeave: () => n(null)
					}) : null,
					(i === "performance" || i === "cashflow") && r.length ? /* @__PURE__ */ (0, K.jsx)(Sr, {
						chart: e,
						series: r,
						onPoint: n,
						onLeave: () => n(null)
					}) : null,
					i === "dcf" || i === "scenario_price" ? /* @__PURE__ */ (0, K.jsx)(wr, {
						chart: e,
						onPoint: n,
						onLeave: () => n(null)
					}) : null,
					i === "price_return" ? /* @__PURE__ */ (0, K.jsx)(Tr, {
						chart: e,
						onPoint: n,
						onLeave: () => n(null)
					}) : null,
					!r.length && ![
						"dcf",
						"scenario_price",
						"price_return"
					].includes(i) && /* @__PURE__ */ (0, K.jsx)("p", {
						className: "analysis-chart-warning",
						children: "이 차트에 표시할 수치가 충분하지 않습니다."
					}),
					t && /* @__PURE__ */ (0, K.jsxs)("div", {
						className: "analysis-chart-tooltip",
						style: a,
						children: [
							t.series && /* @__PURE__ */ (0, K.jsx)("span", { children: t.series }),
							/* @__PURE__ */ (0, K.jsx)("strong", { children: t.value }),
							/* @__PURE__ */ (0, K.jsx)("em", { children: t.label })
						]
					})
				]
			}),
			r.length > 0 && Er(r)
		]
	});
}
function Or({ payload: e, chartIds: t, heading: n = "기업 분석 시각화", intro: r = "저장된 공식 재무 데이터와 시장 데이터를 기반으로 생성된 참고 차트입니다.", compact: i = !1 }) {
	let a = t ? new Set(t) : null, o = (Array.isArray(e?.charts) ? e.charts : []).filter((e) => !a || a.has(String(e.id || e.kind || "")));
	return !e?.available || !o.length ? null : /* @__PURE__ */ (0, K.jsxs)("section", {
		className: `analysis-charts-panel analysis-charts-inline${i ? " compact" : ""}`,
		"aria-label": n,
		children: [/* @__PURE__ */ (0, K.jsx)("div", {
			className: "analysis-chart-head",
			children: /* @__PURE__ */ (0, K.jsxs)("div", { children: [
				/* @__PURE__ */ (0, K.jsx)("p", {
					className: "section-kicker",
					children: "Company Visuals"
				}),
				/* @__PURE__ */ (0, K.jsx)("h3", { children: n }),
				/* @__PURE__ */ (0, K.jsx)("p", { children: r })
			] })
		}), /* @__PURE__ */ (0, K.jsx)("div", {
			className: "analysis-chart-grid",
			children: o.map((e, t) => /* @__PURE__ */ (0, K.jsx)(Dr, { chart: e }, e.id || `${e.title || "chart"}-${t}`))
		})]
	});
}
//#endregion
//#region src/app/reportReader/CompanyAnalysisBody.tsx
var kr = [
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
function Ar(e = "") {
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
function jr(e) {
	return new Set((Array.isArray(e?.charts) ? e.charts : []).map((e) => String(e?.id || e?.kind || "")).filter(Boolean));
}
function Mr(e, t, n, r = /* @__PURE__ */ new Set()) {
	let i = jr(n), a = e.title, o = [];
	for (let e of kr) if (e.patterns.some((e) => e.test(a)) || e.fallbackIndex === t) for (let t of e.ids) i.has(t) && !r.has(t) && o.push(t);
	return o;
}
function Nr(e, t = /* @__PURE__ */ new Set()) {
	return Array.from(jr(e)).filter((e) => !t.has(e));
}
function Pr({ markdown: e, charts: t }) {
	let n = Ar(e), r = /* @__PURE__ */ new Set();
	return n.length ? /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [n.map((e, n) => {
		let i = Mr(e, n, t, r);
		return i.forEach((e) => r.add(e)), /* @__PURE__ */ (0, K.jsxs)("div", {
			className: "company-analysis-section",
			children: [/* @__PURE__ */ (0, K.jsx)(Rt, { markdown: e.markdown }), i.length > 0 && /* @__PURE__ */ (0, K.jsx)(Or, {
				payload: t,
				chartIds: i,
				heading: "관련 시각화",
				intro: "이 섹션의 판단을 확인할 때 함께 볼 수 있는 수치입니다.",
				compact: !0
			})]
		}, e.key);
	}), Nr(t, r).length > 0 && /* @__PURE__ */ (0, K.jsx)(Or, {
		payload: t,
		chartIds: Nr(t, r),
		heading: "추가 시각화",
		intro: "본문 섹션에 직접 매칭되지 않은 보조 차트입니다.",
		compact: !0
	})] }) : /* @__PURE__ */ (0, K.jsx)(Or, { payload: t });
}
//#endregion
//#region src/app/CompanyAnalysisRoute.tsx
var Fr = [{
	value: "beginner",
	label: "기본",
	description: "쉽게 설명"
}, {
	value: "advanced",
	label: "심화",
	description: "정밀 분석"
}], Ir = 20;
function Lr(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function Rr(e) {
	let t = e;
	return !!(t?.id && N(t.status));
}
async function zr(e) {
	let t = e;
	for (; N(t.status);) await Lr(1e3), t = await L(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "기업 분석 생성에 실패했습니다.");
	return t;
}
function Br(e = "", t = "기업 분석") {
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
function Vr(e) {
	return String(e.company?.ticker || e.query || e.company?.name || "").trim().toUpperCase();
}
function Hr(e) {
	return String(e.company?.name || e.query || Vr(e) || "").trim();
}
function Ur(e) {
	let t = Vr(e), n = Hr(e);
	return t && n && t !== n ? `${t} · ${n}` : n || t || "기업 분석";
}
function Wr(e) {
	return Br(String(e.markdown || ""), "").title.trim() || String(e.headline || "").trim() || Ur(e);
}
function Gr(e) {
	if (!e) return "미상";
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? e : t.toLocaleDateString("ko-KR");
}
function Kr(e) {
	return Fr.find((t) => t.value === e)?.label || "";
}
function qr(e) {
	return e === "high" ? "높음" : e === "medium" ? "중간" : e === "low" ? "낮음" : e || "확인 필요";
}
function Jr(e) {
	let t = e?.dataGaps;
	return t ? Array.isArray(t) ? t : Array.isArray(t.gaps) ? t.gaps : [] : [];
}
function Yr(e) {
	let t = /* @__PURE__ */ new Set();
	return e.filter((e) => {
		let n = [
			Qr(e.field),
			Qr(e.label),
			Qr(e.category),
			Qr(e.message || e.suggestedAction)
		].join("|");
		return t.has(n) ? !1 : (t.add(n), !0);
	});
}
function Xr(e) {
	let t = {
		high: 0,
		medium: 1,
		low: 2
	};
	return Yr(Jr(e).filter((e) => e.status !== "resolved").sort((e, n) => (t[e.severity || ""] ?? 9) - (t[n.severity || ""] ?? 9)));
}
function Zr(e) {
	if (!e) return "월 미상";
	let t = new Date(e);
	if (!Number.isNaN(t.getTime())) return `${t.getFullYear()}.${String(t.getMonth() + 1).padStart(2, "0")}`;
	let n = String(e).match(/^(\d{4})[-.](\d{1,2})/);
	return n ? `${n[1]}.${String(n[2]).padStart(2, "0")}` : "월 미상";
}
function Qr(e) {
	return String(e || "").trim().toLowerCase();
}
function X(e) {
	return [
		e.source,
		e.date,
		e.type
	].filter(Boolean).join(" · ");
}
function $r(e) {
	return e.title || e.url || e.path || "자료";
}
function ei(e) {
	let t = String(e.markdown || "");
	return e.generation?.webSearch ? t.trim() : t.split(/\n(?=#{1,3}\s*(?:8\.\s*)?(?:Sources Used|사용 자료)\b)/i)[0].trim();
}
function ti(e) {
	window.location.hash = e ? `#/analysis/${encodeURIComponent(e)}` : "#/analysis";
}
function ni() {
	let e = window.location.hash.match(/^#\/?analysis\/(.+)$/);
	return e ? decodeURIComponent(e[1]) : "";
}
function ri() {
	return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "analysis";
}
function ii() {
	let [e, t] = (0, c.useState)([]), [n, r] = (0, c.useState)(null), [i, a] = (0, c.useState)(() => ni()), [o, s] = (0, c.useState)(""), [l, u] = (0, c.useState)("beginner"), [d, f] = (0, c.useState)(""), [p, m] = (0, c.useState)("recent"), [h, g] = (0, c.useState)(!1), [_, v] = (0, c.useState)(!1), [y, b] = (0, c.useState)(""), [x, S] = (0, c.useState)(""), [C, w] = (0, c.useState)(""), [T, E] = (0, c.useState)(0), D = (0, c.useCallback)(async () => {
		g(!0), S("");
		try {
			let e = await L("/api/analysis-reports");
			t(Array.isArray(e) ? e : []), W("analysis", {
				surface: "analysis",
				viewId: "analysis",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			S(e instanceof Error ? e.message : "기업 분석 목록을 불러오지 못했습니다.");
		} finally {
			g(!1);
		}
	}, []);
	(0, c.useEffect)(() => {
		D();
	}, [D]), (0, c.useEffect)(() => {
		let e = () => {
			ri() && a(ni());
		};
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []), (0, c.useEffect)(() => {
		let e = (e) => {
			let t = e.detail;
			Ue(t, window.FolioAgent?.currentContext) && E((e) => e + 1);
		};
		return window.addEventListener(fe, e), () => window.removeEventListener(fe, e);
	}, []), (0, c.useEffect)(() => {
		let e = !0;
		async function t(t) {
			g(!0), S("");
			try {
				let n = await L(`/api/analysis-reports/${encodeURIComponent(t)}?includePersonal=true`);
				if (!e) return;
				r(n), W("analysis", {
					surface: "analysis_reader",
					viewId: "analysis",
					reportKind: "company_analysis",
					reportId: n.id || t,
					ticker: Vr(n)
				});
			} catch (t) {
				if (!e) return;
				r(null), S(t instanceof Error ? t.message : "저장된 기업 분석 보고서를 열지 못했습니다.");
			} finally {
				e && g(!1);
			}
		}
		return i ? t(i) : (r(null), W("analysis", {
			surface: "analysis",
			viewId: "analysis",
			reportKind: "",
			reportId: ""
		})), () => {
			e = !1;
		};
	}, [i, T]);
	async function O(e) {
		e.preventDefault();
		let t = o.trim();
		if (t) {
			v(!0), S(""), w("기업 자료를 읽고 분석 보고서를 생성하는 중입니다.");
			try {
				let e = await L(`/api/analyze?${new URLSearchParams({
					q: t,
					analysisStyle: l
				}).toString()}`), n;
				if (Rr(e)) {
					let t = await zr(e), r = t.result?.reportId || t.result?.artifactId || "";
					if (!r) throw Error("생성된 보고서 ID를 확인하지 못했습니다.");
					n = await L(`/api/analysis-reports/${encodeURIComponent(r)}?includePersonal=true`);
				} else n = e;
				await D(), w("기업 분석 보고서를 생성하고 자동 저장했습니다."), r(n), n.id && ti(n.id);
			} catch (e) {
				S(e instanceof Error ? e.message : "기업 분석 생성에 실패했습니다."), w("");
			} finally {
				v(!1);
			}
		}
	}
	async function k(e) {
		e && ti(e);
	}
	async function A(e) {
		if (e.id && window.confirm(`${Ur(e)} 보고서를 삭제할까요?`)) {
			b(`delete-${e.id}`), S("");
			try {
				let t = await fetch(`/api/analysis-reports/${encodeURIComponent(e.id)}`, { method: "DELETE" });
				if (!t.ok) throw Error(`삭제 실패: ${t.status}`);
				n?.id === e.id && ti(), await D(), w("저장된 기업 분석 보고서를 삭제했습니다.");
			} catch (e) {
				S(e instanceof Error ? e.message : "보고서 삭제에 실패했습니다.");
			} finally {
				b("");
			}
		}
	}
	async function j(e) {
		if (n) {
			b(e), w(e === "notion" ? "Notion으로 내보내는 중..." : "Obsidian으로 내보내는 중...");
			try {
				let t = e === "notion" ? await R("/api/export-notion/analysis", n) : await R("/api/export-obsidian/analysis", n);
				w(e === "notion" ? `Notion으로 내보냈습니다${t.title ? `: ${t.title}` : ""}` : `Obsidian으로 내보냈습니다${t.company || t.filename ? `: ${t.company || t.filename}` : ""}`);
			} catch (e) {
				w(e instanceof Error ? e.message : "내보내기에 실패했습니다.");
			} finally {
				b("");
			}
		}
	}
	async function M() {
		if (n?.id) {
			b("overlay"), w("내 노트와 연결하는 중...");
			try {
				let e = await R(`/api/analysis-reports/${encodeURIComponent(n.id)}/personal-overlay`, {});
				Rr(e) && await zr(e);
				let t = await L(`/api/analysis-reports/${encodeURIComponent(n.id)}?includePersonal=true`);
				r(t), w("내 노트와 연결했습니다.");
			} catch (e) {
				w(e instanceof Error ? e.message : "내 노트 연결에 실패했습니다.");
			} finally {
				b("");
			}
		}
	}
	let N = (0, c.useMemo)(() => {
		let t = Qr(d);
		return t ? e.filter((e) => Qr([
			Vr(e),
			Hr(e),
			Ur(e),
			e.headline,
			e.mode,
			e.generatedAt,
			Gr(e.generatedAt)
		].filter(Boolean).join(" ")).includes(t)) : e;
	}, [d, e]), P = (0, c.useMemo)(() => {
		let e = [...N].sort((e, t) => String(t.generatedAt || "").localeCompare(String(e.generatedAt || "")));
		if (p === "recent") return e.length ? [{
			key: "recent",
			label: `최근 보고서 ${Math.min(e.length, Ir)}건`,
			rows: e.slice(0, Ir)
		}] : [];
		if (p === "month") {
			let t = /* @__PURE__ */ new Map();
			for (let n of e) {
				let e = Zr(n.generatedAt);
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
			let e = Vr(n) || Wr(n);
			t.has(e) || t.set(e, []), t.get(e)?.push(n);
		}
		return Array.from(t.entries()).map(([e, t]) => ({
			key: e,
			label: Wr(t[0] || {}),
			rows: t.sort((e, t) => String(t.generatedAt || "").localeCompare(String(e.generatedAt || "")))
		})).sort((e, t) => String(t.rows[0]?.generatedAt || "").localeCompare(String(e.rows[0]?.generatedAt || "")));
	}, [N, p]), F = ei(n || {}), I = Br(F, n?.headline || Ur(n || {})), z = n?.sources || [], B = Xr(n);
	return n ? /* @__PURE__ */ (0, K.jsxs)("div", {
		className: "react-company-analysis-route",
		"data-company-analysis-route": !0,
		children: [x && /* @__PURE__ */ (0, K.jsx)("p", {
			className: "react-dashboard-error",
			children: x
		}), /* @__PURE__ */ (0, K.jsxs)(on, {
			eyebrow: `COMPANY ANALYSIS${Vr(n) ? ` · ${Vr(n)}` : ""}`,
			title: I.title,
			meta: [n.generatedAt ? `생성일 ${Gr(n.generatedAt)}` : "", Kr(n.analysisStyle)].filter(Boolean).join(" · "),
			agentContext: {
				surface: "analysis_reader",
				viewId: "analysis",
				reportKind: "company_analysis",
				reportId: n.id || "",
				ticker: Vr(n)
			},
			breadcrumb: /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [/* @__PURE__ */ (0, K.jsx)("button", {
				type: "button",
				onClick: () => ti(),
				children: "기업 분석"
			}), /* @__PURE__ */ (0, K.jsx)("span", { children: I.title })] }),
			onClose: () => ti(),
			actionSlot: /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [
				/* @__PURE__ */ (0, K.jsx)(jt, {
					title: "AI",
					children: /* @__PURE__ */ (0, K.jsx)(Mt, {
						icon: "agent",
						onClick: () => ae({
							surface: "analysis_reader",
							reportKind: "company_analysis",
							reportId: n.id || "",
							ticker: Vr(n),
							message: `${I.title}에서 투자 판단에 중요한 핵심, 리스크, 추가 확인 질문을 정리해줘.`,
							autoSubmit: !0
						}),
						children: "Agent에게 묻기"
					})
				}),
				/* @__PURE__ */ (0, K.jsx)(jt, {
					title: "노트",
					children: /* @__PURE__ */ (0, K.jsx)(Mt, {
						icon: "link",
						disabled: y === "overlay" || !n.id,
						onClick: M,
						children: y === "overlay" ? "연결 중" : "내 노트와 연결"
					})
				}),
				/* @__PURE__ */ (0, K.jsxs)(jt, {
					title: "내보내기",
					children: [/* @__PURE__ */ (0, K.jsx)(Mt, {
						icon: "notion",
						disabled: y === "notion",
						onClick: () => j("notion"),
						children: y === "notion" ? "내보내는 중" : "Notion으로 내보내기"
					}), /* @__PURE__ */ (0, K.jsx)(Mt, {
						icon: "obsidian",
						disabled: y === "obsidian",
						onClick: () => j("obsidian"),
						children: y === "obsidian" ? "내보내는 중" : "Obsidian으로 내보내기"
					})]
				}),
				B.length > 0 && /* @__PURE__ */ (0, K.jsx)(jt, {
					title: "자료 한계",
					children: /* @__PURE__ */ (0, K.jsx)("div", {
						className: "react-reader-gap-list",
						children: B.slice(0, 3).map((e, t) => /* @__PURE__ */ (0, K.jsxs)("div", {
							className: "react-reader-gap",
							children: [
								/* @__PURE__ */ (0, K.jsx)("span", { children: qr(e.severity) }),
								/* @__PURE__ */ (0, K.jsx)("strong", { children: e.label || e.category || "추가 확인 필요" }),
								/* @__PURE__ */ (0, K.jsx)("p", { children: e.message || e.suggestedAction || "보고서 해석 시 확인이 필요한 자료 한계입니다." })
							]
						}, `${e.field || e.category || "gap"}-${t}`))
					})
				}),
				n.generation?.message && /* @__PURE__ */ (0, K.jsx)("p", {
					className: "react-reader-status",
					children: n.generation.message
				}),
				C && /* @__PURE__ */ (0, K.jsx)("p", {
					className: "react-reader-status",
					children: C
				})
			] }),
			noteIdentity: {
				id: rn("company", Vr(n) || n.headline || "company"),
				noteType: "company_thesis",
				title: Vr(n) ? `${Vr(n)} 투자 노트` : "기업 투자 노트",
				ticker: Vr(n),
				company: n.company?.name || "",
				label: Vr(n),
				reportKind: "company_analysis",
				reportId: Vr(n),
				linkedReports: [I.title].filter(Boolean)
			},
			noteLinkedTitle: I.title,
			noteOverlay: kn(n.personalOverlay, n.canonicalRevision),
			children: [/* @__PURE__ */ (0, K.jsx)(Pr, {
				markdown: I.body || F,
				charts: n.analysisCharts
			}), z.length > 0 && /* @__PURE__ */ (0, K.jsxs)("section", {
				className: "source-panel react-analysis-sources",
				children: [/* @__PURE__ */ (0, K.jsx)("h4", { children: "참고자료" }), /* @__PURE__ */ (0, K.jsx)("div", {
					className: "sources",
					children: z.map((e, t) => /* @__PURE__ */ (0, K.jsxs)("div", {
						className: "meta",
						children: [/* @__PURE__ */ (0, K.jsx)("span", { children: X(e) }), e.url ? /* @__PURE__ */ (0, K.jsx)("a", {
							href: e.url,
							target: "_blank",
							rel: "noopener noreferrer",
							children: $r(e)
						}) : /* @__PURE__ */ (0, K.jsx)("span", { children: $r(e) })]
					}, `${$r(e)}-${t}`))
				})]
			})]
		})]
	}) : /* @__PURE__ */ (0, K.jsxs)("div", {
		className: "react-company-analysis-route",
		"data-company-analysis-route": !0,
		children: [
			/* @__PURE__ */ (0, K.jsx)(sn, {
				eyebrow: "Company Analysis",
				title: "기업 분석",
				description: "SEC, DART, 시장 데이터와 로컬 자료를 활용해 기업 분석 보고서를 생성합니다.",
				actions: /* @__PURE__ */ (0, K.jsx)("button", {
					type: "button",
					onClick: D,
					disabled: h,
					children: h ? "불러오는 중" : "새로고침"
				})
			}),
			/* @__PURE__ */ (0, K.jsxs)("form", {
				className: "react-analysis-form",
				onSubmit: O,
				children: [
					/* @__PURE__ */ (0, K.jsxs)("div", {
						className: "react-analysis-api-note",
						role: "note",
						children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: "API 연동 안내" }), /* @__PURE__ */ (0, K.jsx)("span", { children: "미국 기업은 SEC 자료를 우선 사용하고, 한국 기업은 DART API Key를 설정하면 공시 확인 정확도가 높아집니다." })]
					}),
					/* @__PURE__ */ (0, K.jsx)("div", {
						className: "react-analysis-query",
						children: /* @__PURE__ */ (0, K.jsxs)("label", { children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "분석 대상" }), /* @__PURE__ */ (0, K.jsx)("input", {
							value: o,
							onChange: (e) => s(e.currentTarget.value),
							placeholder: "예: NVDA, 삼성전자, SK하이닉스"
						})] })
					}),
					/* @__PURE__ */ (0, K.jsxs)("fieldset", {
						className: "react-analysis-style",
						"aria-label": "보고서 모드",
						children: [/* @__PURE__ */ (0, K.jsx)("legend", { children: "보고서 모드" }), /* @__PURE__ */ (0, K.jsx)("div", {
							className: "react-analysis-style-toggle",
							"data-style": l,
							children: Fr.map((e) => /* @__PURE__ */ (0, K.jsx)("button", {
								type: "button",
								className: l === e.value ? "active" : "",
								"aria-pressed": l === e.value,
								onClick: () => u(e.value),
								"data-tooltip": e.description,
								children: e.label
							}, e.value))
						})]
					}),
					/* @__PURE__ */ (0, K.jsx)("button", {
						type: "submit",
						disabled: _ || !o.trim(),
						children: _ ? "분석 중" : "분석"
					})
				]
			}),
			x && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-error",
				children: x
			}),
			C && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-warning",
				children: C
			}),
			/* @__PURE__ */ (0, K.jsxs)("section", {
				className: "input-panel react-analysis-feed-controls report-feed-controls",
				"aria-label": "저장 기업 분석 검색",
				children: [/* @__PURE__ */ (0, K.jsxs)("div", {
					className: "briefing-archive-filters",
					children: [/* @__PURE__ */ (0, K.jsxs)("label", { children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "검색" }), /* @__PURE__ */ (0, K.jsx)("input", {
						type: "search",
						value: d,
						onChange: (e) => f(e.currentTarget.value),
						placeholder: "티커·회사명·보고서 검색"
					})] }), /* @__PURE__ */ (0, K.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						onClick: () => {
							f(""), m("recent");
						},
						children: "초기화"
					})]
				}), /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "briefing-archive-summary",
					children: [/* @__PURE__ */ (0, K.jsxs)("span", { children: [N.length, "건"] }), /* @__PURE__ */ (0, K.jsx)("span", {
						"aria-live": "polite",
						children: h ? "불러오는 중..." : d ? "검색 결과" : ""
					})]
				})]
			}),
			/* @__PURE__ */ (0, K.jsx)("div", {
				className: "report-feed-outside-controls",
				"aria-label": "기업 분석 표시 옵션",
				children: /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "report-feed-view-row",
					children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "보기" }), /* @__PURE__ */ (0, K.jsx)("label", {
						className: "report-feed-view-pill",
						children: /* @__PURE__ */ (0, K.jsxs)("select", {
							"aria-label": "기업 분석 보기 방식",
							value: p,
							onChange: (e) => m(e.currentTarget.value),
							children: [
								/* @__PURE__ */ (0, K.jsx)("option", {
									value: "recent",
									children: "최근"
								}),
								/* @__PURE__ */ (0, K.jsx)("option", {
									value: "company",
									children: "기업별"
								}),
								/* @__PURE__ */ (0, K.jsx)("option", {
									value: "month",
									children: "월별"
								})
							]
						})
					})]
				})
			}),
			/* @__PURE__ */ (0, K.jsxs)("section", {
				className: "react-analysis-feed",
				"aria-label": "저장된 기업 분석",
				children: [/* @__PURE__ */ (0, K.jsxs)("div", {
					className: "react-section-heading",
					children: [/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("p", {
						className: "section-kicker",
						children: "Saved Reports"
					}), /* @__PURE__ */ (0, K.jsx)("h2", { children: "저장된 기업 분석" })] }), /* @__PURE__ */ (0, K.jsxs)("span", { children: [e.length, " reports"] })]
				}), P.length ? P.map((e) => /* @__PURE__ */ (0, K.jsxs)("section", {
					className: "report-feed-group",
					children: [/* @__PURE__ */ (0, K.jsxs)("div", {
						className: "report-feed-group-head",
						children: [/* @__PURE__ */ (0, K.jsx)("span", {
							className: "report-feed-group-name",
							children: e.label
						}), /* @__PURE__ */ (0, K.jsxs)("span", {
							className: "report-feed-group-meta",
							children: [
								e.rows.length,
								"건 · 최근 ",
								Gr(e.rows[0]?.generatedAt)
							]
						})]
					}), /* @__PURE__ */ (0, K.jsx)("div", {
						className: "report-feed-group-cards",
						children: e.rows.map((e) => {
							let t = y === `delete-${e.id}`;
							return /* @__PURE__ */ (0, K.jsxs)("div", {
								className: "report-feed-card-wrap",
								children: [/* @__PURE__ */ (0, K.jsxs)("button", {
									className: "report-feed-card is-analysis",
									type: "button",
									onClick: () => k(e.id),
									children: [
										/* @__PURE__ */ (0, K.jsxs)("span", {
											className: "report-feed-card-meta",
											children: [e.mode && /* @__PURE__ */ (0, K.jsx)("span", {
												className: "report-feed-badge",
												children: String(e.mode).toUpperCase()
											}), e.analysisStyle && /* @__PURE__ */ (0, K.jsx)("span", {
												className: "report-feed-badge",
												children: Kr(e.analysisStyle) || String(e.analysisStyle).toUpperCase()
											})]
										}),
										/* @__PURE__ */ (0, K.jsx)("strong", { children: Wr(e) }),
										/* @__PURE__ */ (0, K.jsxs)("span", {
											className: "report-feed-card-foot",
											children: ["생성일 ", Gr(e.generatedAt)]
										})
									]
								}), /* @__PURE__ */ (0, K.jsx)("button", {
									type: "button",
									className: "report-feed-card-delete",
									disabled: t,
									onClick: () => A(e),
									"aria-label": `${Ur(e)} 삭제`,
									"data-tooltip": "삭제",
									children: /* @__PURE__ */ (0, K.jsx)("svg", {
										width: "13",
										height: "13",
										viewBox: "0 0 16 16",
										fill: "none",
										stroke: "currentColor",
										strokeWidth: "1.4",
										strokeLinecap: "round",
										strokeLinejoin: "round",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, K.jsx)("path", { d: "M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" })
									})
								})]
							}, e.id || `${Wr(e)}-${e.generatedAt}`);
						})
					})]
				}, e.key)) : /* @__PURE__ */ (0, K.jsxs)("article", {
					className: "react-dashboard-panel",
					children: [/* @__PURE__ */ (0, K.jsx)("h2", { children: "저장된 기업 분석 보고서가 없습니다." }), /* @__PURE__ */ (0, K.jsx)("p", { children: "분석 대상을 입력해 첫 보고서를 생성하세요." })]
				})]
			})
		]
	});
}
//#endregion
//#region src/app/marketStateContext.ts
var ai = [
	"current",
	"stale",
	"empty",
	"fallback"
];
function oi(e) {
	return typeof e == "object" && e && !Array.isArray(e) ? e : null;
}
function si(e, t) {
	return Object.prototype.hasOwnProperty.call(e, t);
}
function ci(e) {
	return typeof e == "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(e) && Number.isFinite(new Date(e).getTime());
}
var li = /* @__PURE__ */ new Set([
	"invalid_as_of",
	"future_as_of",
	"missing_input_watermark",
	"age_exceeded",
	"new_relevant_evidence",
	"update_failed"
]);
function ui(e) {
	let t = oi(e), n = oi(t?.marketStateRef) || oi(oi(t?.marketStateResolution)?.ref) || oi(t?.ref);
	if (!n || !ai.includes(n.status) || [
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
	].some((e) => !si(n, e))) return null;
	let r = n.sourceKind, i = n.scope;
	if (![
		"snapshot",
		"state_fallback",
		"none"
	].includes(r) || ![
		"GLOBAL",
		"US",
		"KR"
	].includes(i) || n.layer !== "source-grounded" || !ci(n.resolvedAt) || !Number.isInteger(n.invalidWatermarkRows) || Number(n.invalidWatermarkRows) < 0 || n.inputWatermark !== null && typeof n.inputWatermark != "string" || n.relevantEvidenceWatermark !== null && typeof n.relevantEvidenceWatermark != "string" || n.relevantEvidenceWatermark !== null && !ci(n.relevantEvidenceWatermark)) return null;
	let a = n.status, o = n.freshnessReason;
	return typeof o != "string" || a === "current" && (r !== "snapshot" || typeof n.snapshotId != "string" || !n.snapshotId || !ci(n.asOf) || o !== "within_window") || a === "current" && n.inputWatermark !== null && !ci(n.inputWatermark) || a === "current" && n.inputWatermark === null != (n.relevantEvidenceWatermark === null) || a === "stale" && (r !== "snapshot" || typeof n.snapshotId != "string" || !n.snapshotId || !li.has(o)) || a === "stale" && o !== "invalid_as_of" && !ci(n.asOf) || a === "fallback" && (r !== "state_fallback" || n.snapshotId !== null || n.asOf !== null && !ci(n.asOf) || o !== "state_fallback" || n.inputWatermark !== null) || a === "empty" && (r !== "none" || n.snapshotId !== null || n.asOf !== null || o !== "no_state" || n.inputWatermark !== null || n.relevantEvidenceWatermark !== null) ? null : {
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
function di(e) {
	let t = ui(e);
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
//#region src/islands/MarketStateDashboard.tsx
var fi = {
	high: "높음",
	medium: "보통",
	low: "낮음"
}, pi = {
	overall: "종합",
	us: "미국장",
	kr: "한국장"
};
function mi(e) {
	let t = String(e || "").replace(/\s+/g, " ").trim(), n = t.match(/[^.!?。]+[.!?。]?/g)?.map((e) => e.trim()).filter(Boolean) || [];
	return {
		lead: n[0] || t,
		support: n.slice(1, 3).join(" ")
	};
}
function hi(e) {
	if (!e) return "";
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? e : t.toLocaleString("ko-KR", {
		dateStyle: "medium",
		timeStyle: "short"
	});
}
function gi(e) {
	let t = String(e.directionLabel || "").trim();
	if (t === "중립") return "neutral";
	if (t === "혼재" || t === "변동성") return "warning";
	if (t === "도움" || t === "부담 완화") return "positive";
	if (t === "부담") return "negative";
	let n = `${e.directionLabel || ""} ${e.directionTone || ""}`.toLowerCase();
	return /neutral|중립/.test(n) ? "neutral" : /mixed|conflicted|혼재|변동성/.test(n) ? "warning" : /support|positive|완화|호재|긍정|지지|강화|도움/.test(n) ? "positive" : /risk|negative|부담|악화|위험|하방/.test(n) ? "negative" : "neutral";
}
function _i(e) {
	let t = String(e.directionLabel || "").trim();
	return !t || t === "도움" ? "긍정 요인" : t === "부담" ? "부담 가중" : t === "변동성" ? "변동성 증가" : t;
}
function vi(e) {
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
function yi({ items: e }) {
	return /* @__PURE__ */ (0, K.jsx)("ul", {
		className: "market-state-check-list",
		children: e.slice(0, 5).map((e, t) => {
			let n = vi(e);
			return /* @__PURE__ */ (0, K.jsxs)("li", {
				className: "market-state-check-item",
				children: [
					n.title && /* @__PURE__ */ (0, K.jsx)("strong", { children: n.title }),
					n.summary && /* @__PURE__ */ (0, K.jsx)("span", { children: n.summary }),
					n.sourceRefs.length ? /* @__PURE__ */ (0, K.jsx)("small", { children: n.sourceRefs.join(" · ") }) : null
				]
			}, `${n.title || n.summary}-${t}`);
		})
	});
}
function bi({ driver: e }) {
	let t = fi[e.confidence] || e.confidence || "보통", n = e.interpretation, r = e.marketImpact || e.interpretation, i = e.evidenceSummary || e.whyItMatters || e.rationale, a = e.nextMemoryCheck || e.whatToWatch || e.nextCheckpoint, o = [
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
	return /* @__PURE__ */ (0, K.jsxs)("article", {
		className: `market-driver-card momentum-${e.momentum || "stable"}`,
		children: [
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "market-driver-top",
				children: [/* @__PURE__ */ (0, K.jsx)("h3", { children: e.title }), /* @__PURE__ */ (0, K.jsx)("div", {
					className: "market-driver-chip-row",
					children: e.directionLabel && /* @__PURE__ */ (0, K.jsx)("span", {
						className: `market-direction-chip direction-${gi(e)}`,
						children: _i(e)
					})
				})]
			}),
			n && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "market-driver-summary",
				children: n
			}),
			o.length ? /* @__PURE__ */ (0, K.jsxs)("details", {
				className: "market-driver-details",
				children: [/* @__PURE__ */ (0, K.jsx)("summary", { children: "근거 보기" }), /* @__PURE__ */ (0, K.jsx)("dl", {
					className: "market-driver-detail-list",
					children: o.map((e) => /* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: e.label }), /* @__PURE__ */ (0, K.jsx)("dd", { children: e.value })] }, e.label))
				})]
			}) : null,
			/* @__PURE__ */ (0, K.jsxs)("footer", { children: [/* @__PURE__ */ (0, K.jsxs)("small", { children: [
				"확신도 ",
				t,
				e.confidencePct ? ` · ${e.confidencePct}%` : ""
			] }), /* @__PURE__ */ (0, K.jsx)("button", {
				type: "button",
				className: "agent-action agent-ask-btn",
				"data-agent-prompt": e.askAgentPrompt,
				"data-tooltip": "Agent에게 묻기",
				"aria-label": "Agent에게 묻기",
				children: /* @__PURE__ */ (0, K.jsx)("span", {
					className: "agent-logo-slot",
					"aria-hidden": "true"
				})
			})] })
		]
	});
}
var xi = {
	current: "현재",
	stale: "업데이트 필요",
	fallback: "참고용 대체 상태",
	empty: "상태 없음"
}, Si = {
	snapshot: "Market State 스냅샷",
	state_fallback: "기존 중기 내러티브 참고값",
	none: "사용 가능한 상태 없음"
}, Ci = {
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
function wi(e) {
	if (!e?.asOf || !e.resolvedAt) return "계산 불가";
	let t = new Date(e.asOf).getTime(), n = new Date(e.resolvedAt).getTime();
	if (!Number.isFinite(t) || !Number.isFinite(n) || n < t) return "계산 불가";
	let r = Math.floor((n - t) / 6e4);
	if (r < 60) return `${r}분`;
	let i = Math.floor(r / 60);
	return i < 48 ? `${i}시간` : `${Math.floor(i / 24)}일 ${i % 24}시간`;
}
function Ti({ stateRef: e }) {
	return /* @__PURE__ */ (0, K.jsxs)("dl", {
		className: "market-state-meta",
		"aria-label": "시장 상태 기준 정보",
		children: [
			/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "상태" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: e ? xi[e.status] : "확인 불가" })] }),
			/* @__PURE__ */ (0, K.jsxs)("div", {
				"data-qa": "market-state-asof",
				children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "기준 시각" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: hi(e?.asOf || void 0) || "없음" })]
			}),
			/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "경과" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: wi(e) })] }),
			/* @__PURE__ */ (0, K.jsxs)("div", {
				"data-qa": "market-state-source",
				children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "출처" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: e ? Si[e.sourceKind] : "응답 검증 실패" })]
			}),
			e ? /* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "범위" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: e.scope })] }) : null
		]
	});
}
function Ei({ state: e, stateRef: t, error: n, drivers: r }) {
	let i = e === "stale" ? "최신 상태를 다시 만들어야 합니다" : e === "fallback" ? "참고용 내러티브만 있습니다" : "아직 생성된 시장 상태가 없습니다", a = n ? `시장 상태 응답을 사용할 수 없습니다: ${n}` : Ci[t?.freshnessReason || ""] || "현재 상태를 검증할 수 없습니다. 업데이트 후 다시 확인하세요.";
	return /* @__PURE__ */ (0, K.jsxs)("section", {
		className: `market-state-gap state-${e}`,
		role: e === "stale" ? "alert" : "status",
		children: [
			/* @__PURE__ */ (0, K.jsx)("span", { children: xi[e] }),
			/* @__PURE__ */ (0, K.jsx)("h3", { children: i }),
			/* @__PURE__ */ (0, K.jsx)("p", { children: a }),
			e === "stale" && t?.freshnessReason === "new_relevant_evidence" ? /* @__PURE__ */ (0, K.jsxs)("small", { children: ["새 외부 자료 기준 ", hi(t.relevantEvidenceWatermark || void 0) || "확인됨"] }) : null,
			e === "fallback" && r.length ? /* @__PURE__ */ (0, K.jsxs)("p", { children: [
				"기존 내러티브 ",
				r.length,
				"건은 탐색 단서일 뿐, 현재 투자 판단으로 사용하지 마세요."
			] }) : null
		]
	});
}
function Di({ payload: e, selectedMarket: t = "overall", loading: n = !1, updating: r = !1, updateDisabled: i = !1, error: a = "", onSelectMarket: o, onUpdate: s, onReload: c }) {
	let l = ui(e), u = l?.status || "empty", d = e?.marketViews || {}, f = [
		"overall",
		"us",
		"kr"
	].filter((e) => e === "overall" || !!d[e]), p = f.includes(t) ? t : "overall", m = p === "overall" ? d.overall || e : d[p] || e, h = m?.drivers ?? [], g = m?.plainConclusion || m?.summary || "", _ = m?.reasonSummary || m?.sourceSummary || m?.stance || "", v = mi(_), y = m?.briefs?.length ? m.briefs : [
		{
			label: "현재 판단",
			value: g
		},
		{
			label: "시장 해석",
			value: _
		},
		{
			label: "행동 가이드",
			value: m?.actionGuide?.action || m?.stance || ""
		},
		{
			label: "다음 확인",
			value: m?.actionGuide?.timing || (m?.watchItems || []).slice(0, 3).join("; ")
		}
	].filter((e) => e.value);
	return /* @__PURE__ */ (0, K.jsxs)("section", {
		className: `market-state-surface market-state-surface-${u}`,
		"data-qa": `market-state-${u}`,
		children: [
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "market-state-head",
				children: [/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("p", {
					className: "section-kicker",
					children: "Market State"
				}), /* @__PURE__ */ (0, K.jsx)("h2", { children: m?.title || e?.title || "현재 중기 시장 상황" })] }), /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "market-state-head-actions",
					children: [/* @__PURE__ */ (0, K.jsx)("button", {
						className: "filter-btn apply",
						type: "button",
						"data-qa": "market-state-update",
						onClick: s,
						disabled: !s || i || r || n,
						children: r ? "업데이트 중" : u === "current" ? "시장 메모리 업데이트" : "시장 상태 업데이트"
					}), /* @__PURE__ */ (0, K.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						onClick: c,
						disabled: !c || n || r,
						children: n ? "불러오는 중…" : "새로고침"
					})]
				})]
			}),
			/* @__PURE__ */ (0, K.jsx)(Ti, { stateRef: l }),
			u === "current" && f.length > 1 ? /* @__PURE__ */ (0, K.jsx)("div", {
				className: "market-scope-tabs",
				role: "tablist",
				"aria-label": "시장 범위 선택",
				"data-scope": p,
				"data-count": f.length,
				children: f.map((e) => /* @__PURE__ */ (0, K.jsx)("button", {
					type: "button",
					role: "tab",
					"aria-selected": p === e,
					className: p === e ? "active" : "",
					onClick: () => o?.(e),
					children: pi[e]
				}, e))
			}) : null,
			u === "current" ? /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [
				/* @__PURE__ */ (0, K.jsx)("p", {
					className: "market-state-current-note",
					children: Ci[l?.freshnessReason || "within_window"]
				}),
				/* @__PURE__ */ (0, K.jsxs)("div", {
					className: "market-state-overview",
					"data-qa": "market-state-posture",
					children: [_ ? /* @__PURE__ */ (0, K.jsxs)("section", {
						className: "market-state-interpretation",
						children: [
							/* @__PURE__ */ (0, K.jsx)("span", { children: "시장 해석" }),
							/* @__PURE__ */ (0, K.jsx)("strong", { children: v.lead }),
							v.support ? /* @__PURE__ */ (0, K.jsx)("p", { children: v.support }) : null
						]
					}) : null, m?.actionGuide || m?.posture || g ? /* @__PURE__ */ (0, K.jsxs)("section", {
						className: `market-state-posture posture-${m?.posture?.tone || "watch"}`,
						children: [
							/* @__PURE__ */ (0, K.jsx)("span", { children: "판단 및 투자 행동" }),
							g && /* @__PURE__ */ (0, K.jsx)("p", {
								className: "market-state-summary",
								children: g
							}),
							m?.actionGuide ? /* @__PURE__ */ (0, K.jsxs)("div", {
								className: "market-state-action-body",
								children: [
									/* @__PURE__ */ (0, K.jsx)("strong", { children: m.actionGuide.headline }),
									/* @__PURE__ */ (0, K.jsx)("p", { children: m.actionGuide.action }),
									m.actionGuide.timing && /* @__PURE__ */ (0, K.jsx)("small", { children: m.actionGuide.timing })
								]
							}) : m?.posture ? /* @__PURE__ */ (0, K.jsxs)("div", {
								className: "market-state-action-body",
								children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: m.posture.label }), /* @__PURE__ */ (0, K.jsx)("p", { children: m.posture.summary })]
							}) : null,
							m?.watchItems?.length || y[3]?.value ? /* @__PURE__ */ (0, K.jsxs)("div", {
								className: "market-state-action-list",
								children: [/* @__PURE__ */ (0, K.jsx)("b", { children: "다음 확인" }), m?.watchItems?.length ? /* @__PURE__ */ (0, K.jsx)("ul", { children: m.watchItems.slice(0, 3).map((e) => /* @__PURE__ */ (0, K.jsx)("li", { children: e }, e)) }) : /* @__PURE__ */ (0, K.jsx)("p", { children: y[3]?.value })]
							}) : null
						]
					}) : null]
				}),
				/* @__PURE__ */ (0, K.jsx)("div", {
					className: "market-state-drivers",
					"data-qa": "market-state-drivers",
					children: h.map((e, t) => /* @__PURE__ */ (0, K.jsx)(bi, { driver: e }, e.id || t))
				}),
				m && ((m.counterEvidence?.length || 0) > 0 || (m.uncertainties?.length || 0) > 0) ? /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "market-state-checks",
					"aria-label": "반대 근거와 불확실성",
					children: [m.counterEvidence?.length ? /* @__PURE__ */ (0, K.jsxs)("section", {
						"data-qa": "market-state-counter-evidence",
						children: [/* @__PURE__ */ (0, K.jsx)("h3", { children: "반대 근거" }), /* @__PURE__ */ (0, K.jsx)(yi, { items: m.counterEvidence })]
					}) : null, m.uncertainties?.length ? /* @__PURE__ */ (0, K.jsxs)("section", {
						"data-qa": "market-state-uncertainties",
						children: [/* @__PURE__ */ (0, K.jsx)("h3", { children: "불확실성" }), /* @__PURE__ */ (0, K.jsx)(yi, { items: m.uncertainties })]
					}) : null]
				}) : null,
				m?.watchItems?.length || y[3]?.value ? /* @__PURE__ */ (0, K.jsxs)("section", {
					className: "market-state-next-checks",
					"data-qa": "market-state-next-checks",
					children: [/* @__PURE__ */ (0, K.jsx)("h3", { children: "다음 확인" }), /* @__PURE__ */ (0, K.jsx)("ul", { children: (m?.watchItems || [y[3]?.value]).filter(Boolean).slice(0, 5).map((e) => /* @__PURE__ */ (0, K.jsx)("li", { children: e }, e)) })]
				}) : null
			] }) : /* @__PURE__ */ (0, K.jsx)(Ei, {
				state: u,
				stateRef: l,
				error: a,
				drivers: h
			}),
			u === "current" && e?.sourceRefs?.length ? /* @__PURE__ */ (0, K.jsxs)("details", {
				className: "market-state-sources",
				children: [/* @__PURE__ */ (0, K.jsxs)("summary", { children: [
					"사용한 출처 ",
					e.sourceRefs.length,
					"개"
				] }), /* @__PURE__ */ (0, K.jsx)("ul", { children: e.sourceRefs.slice(0, 8).map((e, t) => /* @__PURE__ */ (0, K.jsxs)("li", { children: [e.url ? /* @__PURE__ */ (0, K.jsx)("a", {
					href: e.url,
					target: "_blank",
					rel: "noreferrer",
					children: e.title || e.source || e.url
				}) : /* @__PURE__ */ (0, K.jsx)("span", { children: e.title || e.source || e.id }), e.source && /* @__PURE__ */ (0, K.jsx)("small", { children: e.source })] }, e.id || t)) })]
			}) : null
		]
	});
}
function Oi({ onUpdate: e, updating: t = !1, updateDisabled: n = !1, onContext: r } = {}) {
	let [i, a] = (0, c.useState)(null), [o, s] = (0, c.useState)("overall"), [l, u] = (0, c.useState)(""), [d, f] = (0, c.useState)(!1), p = (0, c.useCallback)(async () => {
		f(!0), u("");
		try {
			let e = await L("/api/memory/state-dashboard?limit=5");
			a(e);
			let t = di(e);
			At().updateAgentContext?.({
				surface: "market_state",
				viewId: "memory",
				reportKind: "",
				reportId: "",
				marketState: t
			}), r?.(t);
		} catch (e) {
			a(null), u(e instanceof Error ? e.message : String(e)), r?.(null);
		} finally {
			f(!1);
		}
	}, [r]);
	return (0, c.useEffect)(() => {
		p();
	}, [p]), (0, c.useEffect)(() => {
		At().applyAgentBranding?.();
	}, [i]), /* @__PURE__ */ (0, K.jsx)(Di, {
		payload: i,
		selectedMarket: o,
		loading: d,
		updating: t,
		updateDisabled: n,
		error: l,
		onSelectMarket: s,
		onUpdate: e,
		onReload: p
	});
}
//#endregion
//#region src/app/themePreference.ts
function ki(e) {
	return e === "light" || e === "dark" || e === "system";
}
function Ai(e) {
	return e === "light" || e === "dark";
}
function ji() {
	return {
		preference: ki(window.FolioTheme?.preference) ? window.FolioTheme.preference : "system",
		resolved: Ai(window.FolioTheme?.resolved) ? window.FolioTheme.resolved : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
	};
}
function Mi() {
	let [e, t] = (0, c.useState)(ji);
	return (0, c.useEffect)(() => {
		let e = (e) => {
			let n = e?.detail;
			if (n && ki(n.preference) && Ai(n.resolved)) {
				t(n);
				return;
			}
			t(ji());
		};
		return window.addEventListener("folio:theme-changed", e), e(), () => window.removeEventListener("folio:theme-changed", e);
	}, []), {
		...e,
		setPreference(e) {
			let n = window.FolioTheme?.setPreference(e);
			t(n || {
				preference: e,
				resolved: e === "system" ? ji().resolved : e
			});
		}
	};
}
//#endregion
//#region src/app/Dashboard.tsx
var Ni = {
	positive: "긍정",
	watch: "주의",
	negative: "부정",
	neutral: "중립"
};
function Pi(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function Fi(e) {
	let t = e;
	return !!(t?.id && t?.kind === "agent_bridge" && N(t.status));
}
async function Ii(e) {
	let t = e;
	for (; N(t.status);) await Pi(1e3), t = await L(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "투자 리뷰 생성에 실패했습니다.");
	return t;
}
function Li(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : 0;
}
function Ri(e, t) {
	for (let n of t) {
		let t = Li(e?.[n]);
		if (t) return t;
	}
	return 0;
}
function Z(e) {
	return e.name || e.ticker || "포지션";
}
function zi() {
	let { resolved: e } = Mi(), t = (0, c.useRef)(null), [n, r] = (0, c.useState)(null), [i, a] = (0, c.useState)(""), [o, s] = (0, c.useState)(""), [l, u] = (0, c.useState)(null), d = (0, c.useCallback)(async () => {
		try {
			let e = await L("/api/market-widgets/settings");
			r(e), a("");
		} catch (e) {
			a(e instanceof Error ? e.message : "시장 위젯 설정을 불러오지 못했습니다.");
		}
	}, []);
	(0, c.useEffect)(() => {
		let e = !0;
		return L("/api/market-widgets/settings").then((t) => {
			e && (r(t), a(""));
		}).catch((t) => {
			e && a(t instanceof Error ? t.message : "시장 위젯 설정을 불러오지 못했습니다.");
		}), () => {
			e = !1;
		};
	}, []), (0, c.useEffect)(() => {
		let e = (e) => {
			let t = e.detail;
			t ? (r(t), a("")) : d();
		};
		return document.addEventListener("folio:market-widgets-updated", e), () => document.removeEventListener("folio:market-widgets-updated", e);
	}, [d]), (0, c.useEffect)(() => {
		let e = t.current;
		if (e) {
			if (window.FolioTradingViewWidgets?.cleanup?.(e), !n) {
				e.innerHTML = "<div class=\"tradingview-widget-unavailable\">시장 위젯 설정을 불러오는 중입니다.</div>";
				return;
			}
			return window.FolioTradingViewWidgets?.renderDashboardBoard ? window.FolioTradingViewWidgets.renderDashboardBoard(e, n, { fallbackHtml: "<div class=\"tradingview-widget-unavailable\">시장 위젯을 표시할 수 없습니다.</div>" }) : e.innerHTML = "<div class=\"tradingview-widget-unavailable\">시장 위젯 렌더러를 찾을 수 없습니다.</div>", () => {
				window.FolioTradingViewWidgets?.cleanup?.(e);
			};
		}
	}, [e, n]);
	async function f(e) {
		let t = await R("/api/market-widgets/settings", e);
		return r(t), document.dispatchEvent(new CustomEvent("folio:market-widgets-updated", { detail: t })), t;
	}
	function p() {
		return n?.dashboard?.widgets ? [...n.dashboard.widgets] : [];
	}
	function m(e) {
		return {
			...n,
			dashboard: {
				...n?.dashboard || {},
				widgets: e
			},
			presetOverrides: n?.presetOverrides || {}
		};
	}
	async function h(e, t) {
		let n = p(), r = n.findIndex((t) => t.id === e);
		if (r < 0) return;
		let i = Math.max(0, Math.min(n.length - 1, t));
		if (r === i) return;
		let [o] = n.splice(r, 1);
		n.splice(i, 0, o);
		try {
			await f(m(n)), a("");
		} catch (e) {
			a(e instanceof Error ? e.message : "시장 위젯 위치 저장에 실패했습니다.");
		}
	}
	async function g(e, t, n) {
		let r = p(), i = r.findIndex((t) => t.id === e);
		if (i < 0) return;
		let o = Math.max(240, Math.min(1100, Math.round(t))), s = Math.max(3, Math.min(12, Math.round(n))), c = Math.round(Number(r[i].height || 0)), l = Math.round(Number(r[i].columns || 0));
		if (!(c === o && l === s)) {
			r[i] = {
				...r[i],
				height: o,
				columns: s
			};
			try {
				await f(m(r)), a("");
			} catch (e) {
				a(e instanceof Error ? e.message : "시장 위젯 크기 저장에 실패했습니다.");
			}
		}
	}
	async function _(e) {
		s(e);
		try {
			let t = p(), n = `${e}-${Date.now().toString(36)}`, r = e === "overview" ? {
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
			await f(m([...t, r])), a("");
		} catch (e) {
			a(e instanceof Error ? e.message : "시장 위젯 추가에 실패했습니다.");
		} finally {
			s("");
		}
	}
	async function v() {
		s("reset");
		try {
			await f({ dashboard: { widgets: [] } }), a("");
		} catch (e) {
			a(e instanceof Error ? e.message : "시장 위젯 기본값 복원에 실패했습니다.");
		} finally {
			s("");
		}
	}
	async function y(e) {
		u(null);
		let t = p(), n = t.findIndex((t) => t.id === e);
		if (n < 0) return;
		let r = t[n], i = window.prompt("위젯 제목", r.title || "");
		if (i === null) return;
		let o = r.symbol || "";
		if ([
			"advanced_chart",
			"symbol_overview",
			"ticker_tag",
			"single_ticker",
			"stock_heatmap"
		].includes(String(r.type || ""))) {
			let e = window.prompt("TradingView 심볼", o || "FOREXCOM:SPXUSD");
			if (e === null) return;
			o = e.trim().toUpperCase();
		}
		t[n] = {
			...r,
			title: String(i || r.title || "").trim(),
			symbol: o
		}, s("editor");
		try {
			await f(m(t)), a("");
		} catch (e) {
			a(e instanceof Error ? e.message : "시장 위젯 수정에 실패했습니다.");
		} finally {
			s("");
		}
	}
	async function b(e) {
		u(null);
		let t = p(), n = t.find((t) => t.id === e);
		if (!n) return;
		let r = n.title || n.symbol || n.type || "위젯";
		if (window.confirm(`${r} 위젯을 삭제할까요?`)) {
			s("delete");
			try {
				await f(m(t.filter((t) => t.id !== e))), a("");
			} catch (e) {
				a(e instanceof Error ? e.message : "시장 위젯 삭제에 실패했습니다.");
			} finally {
				s("");
			}
		}
	}
	return (0, c.useEffect)(() => {
		let e = t.current;
		if (!e) return;
		let n = (e) => {
			let t = e.target?.closest("[data-tv-widget-menu]");
			if (!t) return;
			e.preventDefault(), e.stopPropagation();
			let n = t.closest(".tv-widget-card")?.dataset.widgetId || "";
			if (!n) return;
			let r = t.getBoundingClientRect();
			u({
				widgetId: n,
				x: r.right,
				y: r.bottom + 6
			});
		};
		return e.addEventListener("click", n), () => e.removeEventListener("click", n);
	}, [n]), (0, c.useEffect)(() => {
		let e = t.current;
		if (!e || !n) return;
		let r = null, i = null, a = () => Array.from(e.querySelectorAll(".tv-widget-card[data-widget-id]")), o = (t) => {
			let n = e.getBoundingClientRect(), r = window.getComputedStyle(e), i = Number.parseFloat(r.columnGap || r.gap || "0") || 0, a = (n.width - i * 11) / 12;
			return !Number.isFinite(a) || a <= 0 ? 12 : Math.max(3, Math.min(12, Math.round((t + i) / (a + i))));
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
				r = null, g(e, i, a);
			}
			if (i) {
				let { widgetId: t, card: n } = i;
				n.classList.remove("tv-widget-dragging"), i = null, h(t, s(e.clientX, e.clientY));
			}
		};
		return e.addEventListener("pointerdown", c), window.addEventListener("pointermove", l), window.addEventListener("pointerup", u), () => {
			e.removeEventListener("pointerdown", c), window.removeEventListener("pointermove", l), window.removeEventListener("pointerup", u);
		};
	}, [n]), /* @__PURE__ */ (0, K.jsxs)("article", {
		className: "market-widget-panel react-dashboard-market-widget",
		"data-current-market": !0,
		children: [
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "market-widget-head",
				children: [/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("p", {
					className: "section-kicker",
					children: "Current Market"
				}), /* @__PURE__ */ (0, K.jsx)("h2", {
					id: "marketWidgetTitle",
					children: "Current Market"
				})] }), /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "market-widget-actions",
					children: [
						/* @__PURE__ */ (0, K.jsx)("button", {
							id: "editGlobalMarketsBtn",
							className: "filter-btn",
							type: "button",
							disabled: o === "overview",
							onClick: (e) => {
								e.stopPropagation(), _("overview");
							},
							children: o === "overview" ? "추가 중" : "위젯 추가"
						}),
						/* @__PURE__ */ (0, K.jsx)("button", {
							id: "addMarketChartBtn",
							className: "filter-btn",
							type: "button",
							disabled: o === "chart",
							onClick: (e) => {
								e.stopPropagation(), _("chart");
							},
							children: o === "chart" ? "추가 중" : "빠른 차트 추가"
						}),
						/* @__PURE__ */ (0, K.jsx)("button", {
							id: "resetMarketWidgetsBtn",
							className: "filter-btn clear",
							type: "button",
							disabled: o === "reset",
							onClick: (e) => {
								e.stopPropagation(), v();
							},
							children: o === "reset" ? "복원 중" : "기본값"
						})
					]
				})]
			}),
			i && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-error",
				children: i
			}),
			l && /* @__PURE__ */ (0, K.jsxs)("div", {
				className: "market-widget-context-menu is-open",
				style: {
					left: l.x,
					top: l.y
				},
				role: "menu",
				children: [/* @__PURE__ */ (0, K.jsx)("button", {
					type: "button",
					role: "menuitem",
					onClick: () => void y(l.widgetId),
					children: "수정"
				}), /* @__PURE__ */ (0, K.jsx)("button", {
					type: "button",
					role: "menuitem",
					"data-market-widget-action": "delete",
					onClick: () => void b(l.widgetId),
					children: "삭제"
				})]
			}),
			/* @__PURE__ */ (0, K.jsx)("div", {
				id: "marketWidgetBoard",
				ref: t,
				className: "market-widget-board",
				"data-fallback": "<div class=\"tradingview-widget-unavailable\">시장 위젯을 표시할 수 없습니다.</div>"
			})
		]
	});
}
function Bi() {
	let [e, t] = (0, c.useState)({
		dashboard: null,
		review: null
	}), [n, r] = (0, c.useState)(!1), [i, a] = (0, c.useState)(!1), [o, s] = (0, c.useState)(""), l = (0, c.useCallback)(async () => {
		r(!0), s("");
		try {
			let [e, n] = await Promise.all([L("/api/dashboard"), L("/api/investment-review")]);
			t({
				dashboard: e,
				review: n
			}), W("dashboard", {
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
			let e = await R("/api/investment-review/generate", { forceRefresh: !0 }), n;
			if (Fi(e)) {
				let t = await Ii(e), r = t.result?.date || t.result?.artifactId || "";
				n = r ? await L(`/api/investment-review/${encodeURIComponent(r)}`) : await L("/api/investment-review");
			} else n = e;
			let r = await L("/api/dashboard");
			t({
				dashboard: r,
				review: n
			}), W("dashboard", {
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
			detail: `${Ri(d, ["positive", "positiveImpacts"])} positive`
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
	return /* @__PURE__ */ (0, K.jsxs)("div", {
		className: "react-dashboard",
		"data-react-dashboard": !0,
		children: [
			/* @__PURE__ */ (0, K.jsx)(sn, {
				eyebrow: "Investment Review",
				title: "대시보드",
				description: "시장 상태와 투자 체크포인트를 한 화면에서 점검합니다.",
				actions: /* @__PURE__ */ (0, K.jsx)("button", {
					type: "button",
					onClick: l,
					disabled: n,
					children: n ? "불러오는 중" : "새로고침"
				})
			}),
			o && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-error",
				children: o
			}),
			e.review?.stale && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-warning",
				children: "저장된 최신 투자 리뷰를 표시 중입니다."
			}),
			/* @__PURE__ */ (0, K.jsx)("section", {
				className: "react-dashboard-stats",
				"aria-label": "Dashboard summary",
				children: f.map((e) => /* @__PURE__ */ (0, K.jsxs)("article", { children: [
					/* @__PURE__ */ (0, K.jsx)("span", { children: e.label }),
					/* @__PURE__ */ (0, K.jsx)("strong", { children: e.value }),
					/* @__PURE__ */ (0, K.jsx)("small", { children: e.detail })
				] }, e.label))
			}),
			/* @__PURE__ */ (0, K.jsxs)("section", {
				className: "react-dashboard-grid",
				children: [
					/* @__PURE__ */ (0, K.jsx)(zi, {}),
					/* @__PURE__ */ (0, K.jsxs)("article", {
						className: "react-dashboard-panel wide",
						children: [
							/* @__PURE__ */ (0, K.jsxs)("div", {
								className: "react-dashboard-panel-head",
								children: [/* @__PURE__ */ (0, K.jsx)("p", {
									className: "section-kicker",
									children: "Investment Review"
								}), /* @__PURE__ */ (0, K.jsx)("span", { children: e.review?.generatedAt || "not generated" })]
							}),
							/* @__PURE__ */ (0, K.jsx)("h2", { children: "투자 리뷰 요약" }),
							/* @__PURE__ */ (0, K.jsx)("p", { children: e.review?.summary || "아직 표시할 투자 리뷰 요약이 없습니다." }),
							/* @__PURE__ */ (0, K.jsx)("div", {
								className: "react-dashboard-actions",
								children: /* @__PURE__ */ (0, K.jsx)("button", {
									type: "button",
									onClick: u,
									disabled: i,
									children: i ? "리뷰 생성 중" : "투자 리뷰 갱신"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, K.jsxs)("article", {
						className: "react-dashboard-panel",
						children: [
							/* @__PURE__ */ (0, K.jsxs)("div", {
								className: "react-dashboard-panel-head",
								children: [/* @__PURE__ */ (0, K.jsx)("p", {
									className: "section-kicker",
									children: "Reports"
								}), /* @__PURE__ */ (0, K.jsx)("span", { children: h.length })]
							}),
							/* @__PURE__ */ (0, K.jsx)("h2", { children: "최근 보고서" }),
							/* @__PURE__ */ (0, K.jsx)("ul", { children: h.length ? h.map((e, t) => /* @__PURE__ */ (0, K.jsxs)("li", { children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: e.title || "제목 없음" }), /* @__PURE__ */ (0, K.jsx)("span", { children: e.type || e.date || "" })] }, `${e.title || "report"}-${t}`)) : /* @__PURE__ */ (0, K.jsx)("li", { children: "최근 보고서가 없습니다." }) })
						]
					}),
					/* @__PURE__ */ (0, K.jsxs)("article", {
						className: "react-dashboard-panel",
						children: [
							/* @__PURE__ */ (0, K.jsxs)("div", {
								className: "react-dashboard-panel-head",
								children: [/* @__PURE__ */ (0, K.jsx)("p", {
									className: "section-kicker",
									children: "Checkpoints"
								}), /* @__PURE__ */ (0, K.jsx)("span", { children: p.length })]
							}),
							/* @__PURE__ */ (0, K.jsx)("h2", { children: "이번 주 체크포인트" }),
							/* @__PURE__ */ (0, K.jsx)("ul", { children: p.length ? p.map((e, t) => /* @__PURE__ */ (0, K.jsx)("li", { children: typeof e == "string" ? e : e.checkpoint || "체크포인트" }, t)) : /* @__PURE__ */ (0, K.jsx)("li", { children: "체크포인트가 없습니다." }) })
						]
					}),
					/* @__PURE__ */ (0, K.jsxs)("article", {
						className: "react-dashboard-panel",
						children: [
							/* @__PURE__ */ (0, K.jsxs)("div", {
								className: "react-dashboard-panel-head",
								children: [/* @__PURE__ */ (0, K.jsx)("p", {
									className: "section-kicker",
									children: "Portfolio"
								}), /* @__PURE__ */ (0, K.jsx)("span", { children: m.length })]
							}),
							/* @__PURE__ */ (0, K.jsx)("h2", { children: "포트폴리오 영향" }),
							/* @__PURE__ */ (0, K.jsx)("ul", { children: m.length ? m.map((e, t) => /* @__PURE__ */ (0, K.jsxs)("li", { children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: Z(e) }), /* @__PURE__ */ (0, K.jsx)("span", { children: Ni[e.impact || ""] || e.impact || "중립" })] }, `${Z(e)}-${t}`)) : /* @__PURE__ */ (0, K.jsx)("li", { children: "포트폴리오 영향 항목이 없습니다." }) })
						]
					}),
					/* @__PURE__ */ (0, K.jsx)("article", {
						className: "react-dashboard-panel wide",
						children: /* @__PURE__ */ (0, K.jsx)(Oi, {})
					})
				]
			})
		]
	});
}
//#endregion
//#region src/app/SmartCollectionEditor.tsx
var Vi = {
	name: "",
	query: "",
	market: "ALL",
	sources: "",
	tickers: "",
	tags: ""
};
function Hi(e, t = !1) {
	let n = e.split(",").map((e) => e.normalize("NFKC").trim()).filter(Boolean).map((e) => t ? e.toUpperCase() : e.toLowerCase());
	return Array.from(new Set(n)).sort();
}
function Ui(e) {
	return {
		name: e.name.normalize("NFKC").trim(),
		query: e.query.normalize("NFKC").trim(),
		market: e.market,
		sources: Hi(e.sources),
		tickers: Hi(e.tickers, !0),
		tags: Hi(e.tags)
	};
}
function Wi(e) {
	return {
		name: e.name,
		query: e.query,
		market: e.market,
		sources: e.sources.join(", "),
		tickers: e.tickers.join(", "),
		tags: e.tags.join(", ")
	};
}
function Gi({ mode: e, revision: t, draft: n, busy: r, onChange: i, onCancel: a, onSave: o }) {
	return /* @__PURE__ */ (0, K.jsxs)("div", {
		className: "topicrpt-collection-editor",
		children: [
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "topicrpt-collection-subhead",
				children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: e === "create" ? "새 검색 규칙" : "검색 규칙 편집" }), /* @__PURE__ */ (0, K.jsx)("span", { children: t ? `revision ${t}` : "새 정의" })]
			}),
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "topicrpt-collection-form-grid",
				children: [
					/* @__PURE__ */ (0, K.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "이름" }), /* @__PURE__ */ (0, K.jsx)("input", {
							"data-qa": "collection-name",
							value: n.name,
							maxLength: 80,
							onChange: (e) => i("name", e.currentTarget.value)
						})]
					}),
					/* @__PURE__ */ (0, K.jsxs)("label", {
						className: "field topicrpt-collection-query",
						children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "검색어" }), /* @__PURE__ */ (0, K.jsx)("textarea", {
							"data-qa": "collection-query",
							value: n.query,
							maxLength: 500,
							rows: 2,
							onChange: (e) => i("query", e.currentTarget.value)
						})]
					}),
					/* @__PURE__ */ (0, K.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "시장" }), /* @__PURE__ */ (0, K.jsxs)("select", {
							"data-qa": "collection-market",
							value: n.market,
							onChange: (e) => i("market", e.currentTarget.value),
							children: [
								/* @__PURE__ */ (0, K.jsx)("option", {
									value: "ALL",
									children: "전체"
								}),
								/* @__PURE__ */ (0, K.jsx)("option", {
									value: "US",
									children: "미국"
								}),
								/* @__PURE__ */ (0, K.jsx)("option", {
									value: "KR",
									children: "한국"
								}),
								/* @__PURE__ */ (0, K.jsx)("option", {
									value: "GLOBAL",
									children: "글로벌"
								}),
								/* @__PURE__ */ (0, K.jsx)("option", {
									value: "UNKNOWN",
									children: "미분류"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, K.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "출처 · 쉼표 구분" }), /* @__PURE__ */ (0, K.jsx)("input", {
							"data-qa": "collection-sources",
							value: n.sources,
							onChange: (e) => i("sources", e.currentTarget.value)
						})]
					}),
					/* @__PURE__ */ (0, K.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "티커 · 쉼표 구분" }), /* @__PURE__ */ (0, K.jsx)("input", {
							"data-qa": "collection-tickers",
							value: n.tickers,
							onChange: (e) => i("tickers", e.currentTarget.value)
						})]
					}),
					/* @__PURE__ */ (0, K.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "태그 · 쉼표 구분" }), /* @__PURE__ */ (0, K.jsx)("input", {
							"data-qa": "collection-tags",
							value: n.tags,
							onChange: (e) => i("tags", e.currentTarget.value)
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "topicrpt-collections-actions",
				children: [/* @__PURE__ */ (0, K.jsx)("button", {
					className: "filter-btn clear",
					type: "button",
					"data-qa": "collection-cancel",
					disabled: r,
					onClick: a,
					children: "취소"
				}), /* @__PURE__ */ (0, K.jsx)("button", {
					className: "filter-btn apply",
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
function Ki(e) {
	return [
		e.query && `query: ${e.query}`,
		e.market !== "ALL" && `market: ${e.market}`,
		e.sources.length && `sources: ${e.sources.join(", ")}`,
		e.tickers.length && `tickers: ${e.tickers.join(", ")}`,
		e.tags.length && `tags: ${e.tags.join(", ")}`
	].filter(Boolean).join(" · ") || "필터 없음";
}
function qi(e) {
	return e instanceof M ? e.code === "validation_error" ? "필터 형식을 확인하세요. 이름과 하나 이상의 검색 조건이 필요하며 각 목록은 최대 20개입니다." : e.code === "collection_store_unavailable" ? "저장된 컬렉션을 읽을 수 없습니다. 저장소 상태를 확인한 뒤 다시 불러오세요." : e.code === "collection_snapshot_unavailable" ? "최근 새로고침 기록을 읽을 수 없습니다. 저장 상태를 확인한 뒤 다시 시도하세요." : e.code === "collection_source_unavailable" ? "현재 외부 자료 인덱스를 읽을 수 없습니다. 자료 상태를 확인한 뒤 다시 시도하세요." : e.code === "collection_not_found" ? "컬렉션이 더 이상 존재하지 않습니다. 목록으로 돌아가세요." : `컬렉션 요청을 완료하지 못했습니다 (${e.code || "request_failed"}).` : "컬렉션 요청을 완료하지 못했습니다. 연결을 확인하고 다시 시도하세요.";
}
function Ji(e) {
	let t = e.payload?.currentRevision;
	return typeof t == "number" && Number.isInteger(t) && t >= 1 ? t : null;
}
function Yi(e) {
	if (!e) return "아직 새로고침하지 않음";
	let t = e.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
	return t ? `${t[1]} ${t[2]} UTC` : e;
}
function Xi(e) {
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
function Zi({ selectedRef: e, onSelectedRef: t, onBusyChange: n, onOpenDetail: r, disabled: i }) {
	let [a, o] = (0, c.useState)([]), [s, l] = (0, c.useState)(0), [u, d] = (0, c.useState)(!0), [f, p] = (0, c.useState)(null), [m, h] = (0, c.useState)(""), [g, _] = (0, c.useState)(null), [v, y] = (0, c.useState)(Vi), [b, x] = (0, c.useState)(null), [S, C] = (0, c.useState)(!1), [w, T] = (0, c.useState)(!1), [E, D] = (0, c.useState)(""), [O, k] = (0, c.useState)(null), A = (0, c.useRef)(0), j = (0, c.useRef)(0), N = (0, c.useRef)(null), P = (0, c.useRef)(null);
	function F(e, t) {
		y((n) => ({
			...n,
			[e]: t
		}));
	}
	let I = (0, c.useMemo)(() => e && a.find((t) => t.id === e.id && t.revision === e.revision) || null, [a, e]);
	(0, c.useEffect)(() => {
		n(u || S || w);
	}, [
		w,
		u,
		n,
		S
	]);
	let z = (0, c.useCallback)(async (n = !1) => {
		N.current?.abort();
		let r = new AbortController();
		N.current = r;
		let i = A.current + 1;
		A.current = i, d(!0), D("");
		try {
			let a = await L("/api/smart-collections?limit=100&offset=0", { signal: r.signal });
			if (r.signal.aborted || i !== A.current) return;
			if (o(a.items), l(a.total), e) {
				let n = a.items.find((t) => t.id === e.id);
				(!n || n.revision !== e.revision) && (t(null), x(null), n && k({
					code: "revision_conflict",
					currentRevision: n.revision
				}));
			}
			if (n && m) {
				let e = a.items.find((e) => e.id === m);
				e && (_(e.revision), k(null));
			}
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError" || i !== A.current) return;
			D(qi(e));
		} finally {
			!r.signal.aborted && i === A.current && d(!1);
		}
	}, [
		m,
		t,
		e
	]), B = (0, c.useCallback)(async (e) => {
		P.current?.abort();
		let n = new AbortController();
		P.current = n;
		let r = j.current + 1;
		j.current = r, C(!0), x(null), t(null), D(""), k(null);
		let i = {
			expectedRevision: e.revision,
			limit: 10
		};
		try {
			let a = await R(`/api/smart-collections/${encodeURIComponent(e.id)}/preview`, i, { signal: n.signal });
			if (n.signal.aborted || r !== j.current) return;
			x(a), t({
				id: e.id,
				revision: e.revision
			});
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError" || r !== j.current) return;
			e instanceof M && e.status === 409 && (e.code === "revision_conflict" || e.code === "duplicate_name") ? (k({
				code: e.code,
				currentRevision: Ji(e)
			}), t(null)) : D(qi(e));
		} finally {
			!n.signal.aborted && r === j.current && C(!1);
		}
	}, [t]);
	(0, c.useEffect)(() => (z(), () => {
		N.current?.abort(), P.current?.abort();
	}), []);
	let V = () => {
		p("create"), h(""), _(null), y(Vi), k(null), D("");
	}, te = () => {
		I && (p("edit"), h(I.id), _(I.revision), y(Wi(I)), k(null), D(""));
	}, U = async () => {
		let e = Ui(v);
		if (!e.name || !e.query && e.market === "ALL" && !e.sources.length && !e.tickers.length && !e.tags.length || e.sources.length > 20 || e.tickers.length > 20 || e.tags.length > 20) {
			D("이름과 하나 이상의 검색 조건을 입력하세요. 쉼표 목록은 각각 최대 20개입니다.");
			return;
		}
		T(!0), D(""), k(null);
		try {
			let t;
			if (f === "edit" && m && g) {
				let n = {
					...e,
					expectedRevision: g
				};
				t = await ee(`/api/smart-collections/${encodeURIComponent(m)}`, n);
			} else t = await R("/api/smart-collections", e);
			o((e) => [t.collection, ...e.filter((e) => e.id !== t.collection.id)]), l((e) => f === "create" ? e + 1 : e), p(null), h(""), _(null), await B(t.collection);
		} catch (e) {
			e instanceof M && e.status === 409 && (e.code === "revision_conflict" || e.code === "duplicate_name") ? (k({
				code: e.code,
				currentRevision: Ji(e)
			}), e.code === "revision_conflict" && t(null)) : D(qi(e));
		} finally {
			T(!1);
		}
	}, ne = async () => {
		if (!I || !window.confirm(`“${I.name}” 컬렉션을 삭제할까요?`)) return;
		T(!0), D(""), k(null);
		let e = { expectedRevision: I.revision };
		try {
			await H(`/api/smart-collections/${encodeURIComponent(I.id)}`, e), o((e) => e.filter((e) => e.id !== I.id)), l((e) => Math.max(0, e - 1)), x(null), t(null);
		} catch (e) {
			e instanceof M && e.status === 409 && (e.code === "revision_conflict" || e.code === "duplicate_name") ? (k({
				code: e.code,
				currentRevision: Ji(e)
			}), t(null)) : D(qi(e));
		} finally {
			T(!1);
		}
	};
	return /* @__PURE__ */ (0, K.jsxs)("section", {
		className: "topicrpt-collections-panel",
		"data-qa": "collection-panel",
		"aria-labelledby": "collection-heading",
		children: [
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "topicrpt-collections-head",
				children: [/* @__PURE__ */ (0, K.jsxs)("div", { children: [
					/* @__PURE__ */ (0, K.jsx)("span", {
						className: "section-kicker",
						children: "SMART COLLECTIONS"
					}),
					/* @__PURE__ */ (0, K.jsx)("h3", {
						id: "collection-heading",
						children: "외부 근거 필터"
					}),
					/* @__PURE__ */ (0, K.jsx)("p", { children: "저장된 검색 규칙이며 근거 자체나 사용자 가설이 아닙니다. 서버가 계획 시점에 일치 자료를 다시 확인합니다." })
				] }), /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "topicrpt-collections-actions",
					children: [/* @__PURE__ */ (0, K.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						"data-qa": "collection-reload",
						disabled: u || w || i,
						onClick: () => void z(),
						children: u ? "불러오는 중" : "다시 불러오기"
					}), /* @__PURE__ */ (0, K.jsx)("button", {
						className: "filter-btn apply",
						type: "button",
						"data-qa": "collection-new",
						disabled: w || i,
						onClick: V,
						children: "새 컬렉션"
					})]
				})]
			}),
			E && /* @__PURE__ */ (0, K.jsxs)("div", {
				className: "react-dashboard-error topicrpt-collection-alert",
				"data-qa": "collection-error",
				role: "alert",
				children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: "컬렉션을 확인하세요" }), /* @__PURE__ */ (0, K.jsx)("span", { children: E })]
			}),
			O && /* @__PURE__ */ (0, K.jsxs)("div", {
				className: "react-dashboard-warning topicrpt-collection-alert",
				"data-qa": "collection-conflict",
				role: "alert",
				children: [
					/* @__PURE__ */ (0, K.jsx)("strong", { children: O.code === "duplicate_name" ? "같은 이름이 이미 있습니다" : "다른 탭에서 정의가 변경되었습니다" }),
					/* @__PURE__ */ (0, K.jsxs)("span", { children: [O.currentRevision ? `현재 revision ${O.currentRevision}. ` : "", "입력 내용은 유지했습니다. 최신 revision을 불러온 뒤 다시 저장하세요."] }),
					O.code === "duplicate_name" ? /* @__PURE__ */ (0, K.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						onClick: () => k(null),
						children: "이름 수정"
					}) : /* @__PURE__ */ (0, K.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						onClick: () => void z(!0),
						children: "최신 revision 불러오기"
					})
				]
			}),
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "topicrpt-collections-grid",
				children: [/* @__PURE__ */ (0, K.jsxs)("div", {
					className: "topicrpt-collection-browser",
					children: [
						/* @__PURE__ */ (0, K.jsxs)("div", {
							className: "topicrpt-collection-subhead",
							children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: "저장된 규칙" }), /* @__PURE__ */ (0, K.jsxs)("span", { children: [s, "개"] })]
						}),
						/* @__PURE__ */ (0, K.jsxs)("div", {
							className: "topicrpt-collection-list",
							"data-qa": "collection-list",
							"aria-busy": u,
							children: [!u && !E && !a.length && /* @__PURE__ */ (0, K.jsx)("div", {
								className: "topicrpt-collection-empty",
								"data-qa": "collection-empty",
								"data-empty-kind": "list",
								role: "status",
								children: "저장된 외부 근거 필터가 없습니다. 새 컬렉션을 만들어 반복할 검색 범위를 저장하세요."
							}), a.map((t) => {
								let n = e?.id === t.id && e.revision === t.revision;
								return /* @__PURE__ */ (0, K.jsxs)("button", {
									className: `topicrpt-collection-item${n ? " is-selected" : ""}`,
									type: "button",
									"data-qa": "collection-item",
									"data-collection-id": t.id,
									"data-revision": t.revision,
									"aria-pressed": n,
									disabled: w || i,
									onClick: () => void B(t),
									children: [/* @__PURE__ */ (0, K.jsxs)("span", { children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: t.name }), /* @__PURE__ */ (0, K.jsxs)("small", { children: ["revision ", t.revision] })] }), /* @__PURE__ */ (0, K.jsx)("small", { children: Ki(t) })]
								}, t.id);
							})]
						}),
						s > a.length && /* @__PURE__ */ (0, K.jsxs)("p", {
							className: "topicrpt-collection-disclosure",
							children: [
								"처음 ",
								a.length,
								"개를 표시합니다. 전체 ",
								s,
								"개 중 나머지는 API 페이지에서 확인할 수 있습니다."
							]
						}),
						I && /* @__PURE__ */ (0, K.jsxs)("div", {
							className: "topicrpt-collections-actions topicrpt-selection-actions",
							children: [
								/* @__PURE__ */ (0, K.jsx)("button", {
									className: "filter-btn apply",
									type: "button",
									"data-qa": "collection-open-workspace",
									disabled: w || i,
									onClick: () => r(I.id),
									children: "상세 워크스페이스"
								}),
								/* @__PURE__ */ (0, K.jsx)("button", {
									className: "filter-btn clear",
									type: "button",
									"data-qa": "collection-edit",
									disabled: w || i,
									onClick: te,
									children: "선택 규칙 편집"
								}),
								/* @__PURE__ */ (0, K.jsx)("button", {
									className: "filter-btn clear",
									type: "button",
									"data-qa": "collection-delete",
									disabled: w || i,
									onClick: () => void ne(),
									children: "삭제"
								}),
								/* @__PURE__ */ (0, K.jsx)("button", {
									className: "filter-btn clear",
									type: "button",
									"data-qa": "collection-clear-selection",
									onClick: () => {
										P.current?.abort(), x(null), t(null);
									},
									children: "선택 해제"
								})
							]
						})
					]
				}), /* @__PURE__ */ (0, K.jsxs)("section", {
					className: "topicrpt-collection-results",
					"data-qa": "collection-results",
					"aria-busy": S,
					"aria-live": "polite",
					children: [
						/* @__PURE__ */ (0, K.jsxs)("div", {
							className: "topicrpt-collection-subhead",
							children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: "Live match" }), /* @__PURE__ */ (0, K.jsx)("span", { children: S ? "확인 중" : b ? `${b.total}건` : "규칙 선택 전" })]
						}),
						b && b.total === 0 && /* @__PURE__ */ (0, K.jsx)("div", {
							className: "topicrpt-collection-empty",
							"data-qa": "collection-empty",
							"data-empty-kind": "matches",
							role: "status",
							children: "현재 일치 자료가 0건입니다. 계획은 근거 부족 확인을 거쳐야 하며, 이 컬렉션 자체가 근거로 사용되지는 않습니다."
						}),
						b && b.items.length > 0 && /* @__PURE__ */ (0, K.jsx)("ul", {
							className: "topicrpt-collection-samples",
							children: b.items.map((e) => /* @__PURE__ */ (0, K.jsxs)("li", { children: [
								/* @__PURE__ */ (0, K.jsxs)("span", { children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: e.title || "제목 없음" }), /* @__PURE__ */ (0, K.jsx)("em", {
									className: e.usability === "indexed" ? "is-indexed" : "is-unindexed",
									children: e.usability === "indexed" ? "사용 가능" : "인덱싱 필요"
								})] }),
								/* @__PURE__ */ (0, K.jsx)("small", { children: [e.source, e.publishedAt].filter(Boolean).join(" · ") || "출처 정보 없음" }),
								e.snippet && /* @__PURE__ */ (0, K.jsx)("p", { children: e.snippet })
							] }, e.id))
						}),
						!b && !S && /* @__PURE__ */ (0, K.jsx)("p", {
							className: "topicrpt-empty-value",
							children: "규칙을 선택하면 서버가 현재 자료의 개수와 표본을 확인합니다."
						}),
						b && b.total > b.items.length && /* @__PURE__ */ (0, K.jsxs)("p", {
							className: "topicrpt-collection-disclosure",
							children: [
								"상위 ",
								b.items.length,
								"건만 미리 표시합니다. 계획 실행 시 서버가 전체 범위를 다시 해석합니다."
							]
						})
					]
				})]
			}),
			f && /* @__PURE__ */ (0, K.jsx)(Gi, {
				mode: f,
				revision: g,
				draft: v,
				busy: w,
				onChange: F,
				onCancel: () => {
					p(null), k(null), D("");
				},
				onSave: () => void U()
			})
		]
	});
}
function Qi({ collectionId: e, onBack: t, onStartResearch: n }) {
	let [r, i] = (0, c.useState)(null), [a, o] = (0, c.useState)(null), [s, l] = (0, c.useState)(!0), [u, d] = (0, c.useState)(!1), [f, p] = (0, c.useState)(null), [m, h] = (0, c.useState)(""), g = (0, c.useRef)(null), _ = (0, c.useCallback)(async ({ preserveMessage: t = !1 } = {}) => {
		g.current?.abort();
		let n = new AbortController();
		g.current = n, l(!0), p(null), t || h("");
		try {
			let t = encodeURIComponent(e), [r, a] = await Promise.all([L(`/api/smart-collections/${t}/workspace`, { signal: n.signal }), L(`/api/smart-collections/${t}/changes`, { signal: n.signal })]);
			if (n.signal.aborted) return;
			i(r), o(a);
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError") return;
			e instanceof M && e.code === "collection_not_found" ? p("deleted") : e instanceof M && e.code === "collection_source_unavailable" ? p("source") : p("other"), h(qi(e));
		} finally {
			n.signal.aborted || l(!1);
		}
	}, [e]);
	(0, c.useEffect)(() => (_(), () => g.current?.abort()), [_]);
	let v = async () => {
		if (!r) return;
		d(!0), h("");
		let t = { expectedRevision: r.collection.revision };
		try {
			await R(`/api/smart-collections/${encodeURIComponent(e)}/refresh`, t), await _();
		} catch (e) {
			e instanceof M && e.status === 409 ? (h("다른 탭에서 정의가 변경되었습니다. 최신 revision을 다시 불러왔습니다."), await _({ preserveMessage: !0 })) : e instanceof M && e.code === "collection_not_found" ? (p("deleted"), h(qi(e))) : (e instanceof M && e.code === "collection_source_unavailable" && p("source"), h(qi(e)));
		} finally {
			d(!1);
		}
	}, y = () => {
		r && ae({
			surface: "smart_collection_workspace",
			viewId: "topicrpt",
			collectionId: r.collection.id,
			collectionRevision: r.collection.revision,
			message: "이 Smart Collection의 현재 스냅샷과 이전 스냅샷을 비교해 무엇이 바뀌었는지 설명해줘. 추가·제외된 외부 근거와 불확실성을 함께 정리해줘.",
			autoSubmit: !0
		});
	};
	if (s && !r) return /* @__PURE__ */ (0, K.jsx)("section", {
		className: "topicrpt-collection-workspace",
		"data-qa": "collection-workspace",
		"aria-busy": "true",
		children: /* @__PURE__ */ (0, K.jsx)("p", {
			className: "react-dashboard-warning",
			children: "컬렉션과 현재 외부 자료를 확인하는 중입니다."
		})
	});
	if (f === "deleted") return /* @__PURE__ */ (0, K.jsxs)("section", {
		className: "topicrpt-collection-workspace",
		"data-qa": "collection-workspace",
		children: [/* @__PURE__ */ (0, K.jsx)("button", {
			className: "filter-btn clear",
			type: "button",
			"data-qa": "collection-workspace-back",
			onClick: t,
			children: "딥 리서치로 돌아가기"
		}), /* @__PURE__ */ (0, K.jsxs)("div", {
			className: "react-dashboard-warning",
			"data-qa": "collection-workspace-deleted",
			role: "status",
			children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: "이 컬렉션은 삭제되었습니다" }), /* @__PURE__ */ (0, K.jsx)("p", { children: "열려 있던 주소는 유지되지만 더 이상 새로고침하거나 리서치 범위로 사용할 수 없습니다." })]
		})]
	});
	if (f === "source") return /* @__PURE__ */ (0, K.jsxs)("section", {
		className: "topicrpt-collection-workspace",
		"data-qa": "collection-workspace",
		children: [/* @__PURE__ */ (0, K.jsx)("button", {
			className: "filter-btn clear",
			type: "button",
			"data-qa": "collection-workspace-back",
			onClick: t,
			children: "딥 리서치로 돌아가기"
		}), /* @__PURE__ */ (0, K.jsxs)("div", {
			className: "react-dashboard-error",
			"data-qa": "collection-workspace-source-unavailable",
			role: "alert",
			children: [
				/* @__PURE__ */ (0, K.jsx)("strong", { children: "현재 외부 자료를 읽을 수 없습니다" }),
				/* @__PURE__ */ (0, K.jsx)("p", { children: m }),
				/* @__PURE__ */ (0, K.jsx)("button", {
					className: "filter-btn clear",
					type: "button",
					onClick: () => void _(),
					children: "다시 확인"
				})
			]
		})]
	});
	if (!r) return /* @__PURE__ */ (0, K.jsxs)("section", {
		className: "topicrpt-collection-workspace",
		"data-qa": "collection-workspace",
		children: [/* @__PURE__ */ (0, K.jsx)("button", {
			className: "filter-btn clear",
			type: "button",
			"data-qa": "collection-workspace-back",
			onClick: t,
			children: "딥 리서치로 돌아가기"
		}), /* @__PURE__ */ (0, K.jsxs)("div", {
			className: "react-dashboard-error",
			role: "alert",
			children: [
				/* @__PURE__ */ (0, K.jsx)("strong", { children: "컬렉션을 열지 못했습니다" }),
				/* @__PURE__ */ (0, K.jsx)("p", { children: m }),
				/* @__PURE__ */ (0, K.jsx)("button", {
					className: "filter-btn clear",
					type: "button",
					onClick: () => void _(),
					children: "다시 확인"
				})
			]
		})]
	});
	let b = r.health;
	return /* @__PURE__ */ (0, K.jsxs)("section", {
		className: "topicrpt-collection-workspace",
		"data-qa": "collection-workspace",
		"data-health": b,
		children: [
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "topicrpt-collection-workspace-head",
				children: [/* @__PURE__ */ (0, K.jsx)("button", {
					className: "filter-btn clear",
					type: "button",
					"data-qa": "collection-workspace-back",
					onClick: t,
					children: "← 딥 리서치"
				}), /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "topicrpt-collections-actions",
					children: [
						/* @__PURE__ */ (0, K.jsx)("button", {
							className: "filter-btn clear",
							type: "button",
							"data-qa": "collection-workspace-refresh",
							disabled: u,
							onClick: () => void v(),
							children: u ? "새로고침 중" : "현재 자료 새로고침"
						}),
						/* @__PURE__ */ (0, K.jsx)("button", {
							className: "filter-btn clear",
							type: "button",
							"data-qa": "collection-workspace-ask-change",
							onClick: y,
							children: "Agent에게 변화 묻기"
						}),
						/* @__PURE__ */ (0, K.jsx)("button", {
							className: "filter-btn apply",
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
			/* @__PURE__ */ (0, K.jsxs)("header", {
				className: "topicrpt-collection-workspace-title",
				children: [
					/* @__PURE__ */ (0, K.jsx)("p", {
						className: "section-kicker",
						children: "SAVED FILTER · SOURCE-GROUNDED INTAKE"
					}),
					/* @__PURE__ */ (0, K.jsx)("h1", { children: r.collection.name }),
					/* @__PURE__ */ (0, K.jsx)("p", { children: "저장된 검색 규칙이며 외부 근거 자체가 아닙니다. 새 리서치를 시작하면 서버가 이 ID와 revision으로 자료를 다시 확인합니다." }),
					/* @__PURE__ */ (0, K.jsxs)("small", { children: [
						Ki(r.collection),
						" · revision ",
						r.collection.revision
					] })
				]
			}),
			m && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-warning",
				role: "status",
				children: m
			}),
			b === "empty" && /* @__PURE__ */ (0, K.jsx)("div", {
				className: "topicrpt-collection-empty",
				"data-qa": "collection-workspace-empty",
				role: "status",
				children: "현재 일치하는 외부 자료가 없습니다. 범위를 조정하거나 자료 인덱스를 갱신하세요."
			}),
			b === "stale" && /* @__PURE__ */ (0, K.jsx)("div", {
				className: "react-dashboard-warning",
				"data-qa": "collection-workspace-stale",
				role: "status",
				children: "최근 입력 상태가 오래되었거나 제공자 상태를 다시 확인해야 합니다."
			}),
			b === "noisy" && /* @__PURE__ */ (0, K.jsx)("div", {
				className: "react-dashboard-warning",
				"data-qa": "collection-workspace-noisy",
				role: "status",
				children: "자료 교체 또는 사용 불가 비율이 높습니다. 변경 내역을 확인한 뒤 리서치를 시작하세요."
			}),
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "topicrpt-collection-health-rail",
				"data-qa": "collection-workspace-health",
				children: [
					/* @__PURE__ */ (0, K.jsxs)("div", { children: [
						/* @__PURE__ */ (0, K.jsx)("span", { children: "상태" }),
						/* @__PURE__ */ (0, K.jsx)("strong", { children: b }),
						/* @__PURE__ */ (0, K.jsx)("small", { children: r.healthReasonCodes.map(Xi).join(" · ") })
					] }),
					/* @__PURE__ */ (0, K.jsxs)("div", { children: [
						/* @__PURE__ */ (0, K.jsx)("span", { children: "마지막 새로고침" }),
						/* @__PURE__ */ (0, K.jsx)("strong", { children: Yi(r.lastRefresh) }),
						/* @__PURE__ */ (0, K.jsx)("small", { children: r.current.truncated ? "표시 상한 적용" : "현재 범위 확인" })
					] }),
					/* @__PURE__ */ (0, K.jsxs)("div", { children: [
						/* @__PURE__ */ (0, K.jsx)("span", { children: "변경" }),
						/* @__PURE__ */ (0, K.jsxs)("strong", { children: [
							"+",
							r.changeCounts.added,
							" / −",
							r.changeCounts.removed
						] }),
						/* @__PURE__ */ (0, K.jsxs)("small", { children: [
							"유지 ",
							r.changeCounts.unchanged,
							"건"
						] })
					] }),
					/* @__PURE__ */ (0, K.jsxs)("div", { children: [
						/* @__PURE__ */ (0, K.jsx)("span", { children: "현재 자료" }),
						/* @__PURE__ */ (0, K.jsxs)("strong", { children: [r.current.resolvedCount, "건"] }),
						/* @__PURE__ */ (0, K.jsxs)("small", { children: [
							"사용 제외 ",
							r.current.unusableCount,
							"건"
						] })
					] })
				]
			}),
			/* @__PURE__ */ (0, K.jsx)(lt, {
				mode: "collection",
				collectionId: r.collection.id
			}),
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "topicrpt-collection-workspace-grid",
				children: [/* @__PURE__ */ (0, K.jsxs)("section", {
					className: "topicrpt-collection-results",
					"data-qa": "collection-workspace-evidence",
					"aria-labelledby": "collection-current-evidence",
					children: [/* @__PURE__ */ (0, K.jsxs)("div", {
						className: "topicrpt-collection-subhead",
						children: [/* @__PURE__ */ (0, K.jsx)("strong", {
							id: "collection-current-evidence",
							children: "현재 외부 자료"
						}), /* @__PURE__ */ (0, K.jsxs)("span", { children: [r.current.eligibleCount, "건 일치"] })]
					}), r.recentEvidence.length ? /* @__PURE__ */ (0, K.jsx)("ul", {
						className: "topicrpt-collection-samples",
						children: r.recentEvidence.map((e) => /* @__PURE__ */ (0, K.jsxs)("li", { children: [
							/* @__PURE__ */ (0, K.jsxs)("span", { children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: e.title || "제목 없음" }), /* @__PURE__ */ (0, K.jsx)("em", {
								className: e.usability === "indexed" ? "is-indexed" : "is-unindexed",
								children: e.usability === "indexed" ? "사용 가능" : "인덱싱 필요"
							})] }),
							/* @__PURE__ */ (0, K.jsx)("small", { children: [e.source, e.publishedAt].filter(Boolean).join(" · ") || "출처 정보 없음" }),
							e.snippet && /* @__PURE__ */ (0, K.jsx)("p", { children: e.snippet }),
							e.url && /* @__PURE__ */ (0, K.jsx)("a", {
								href: e.url,
								target: "_blank",
								rel: "noopener noreferrer",
								children: "원문 열기"
							})
						] }, e.id))
					}) : /* @__PURE__ */ (0, K.jsx)("p", {
						className: "topicrpt-empty-value",
						children: "표시할 현재 외부 자료가 없습니다."
					})]
				}), /* @__PURE__ */ (0, K.jsxs)("aside", {
					className: "topicrpt-collection-change-ledger",
					"aria-labelledby": "collection-change-heading",
					children: [
						/* @__PURE__ */ (0, K.jsxs)("div", {
							className: "topicrpt-collection-subhead",
							children: [/* @__PURE__ */ (0, K.jsx)("strong", {
								id: "collection-change-heading",
								children: "스냅샷 변경"
							}), /* @__PURE__ */ (0, K.jsx)("span", { children: a?.observedAt ? Yi(a.observedAt) : "확인 전" })]
						}),
						/* @__PURE__ */ (0, K.jsxs)("dl", { children: [
							/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "추가" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: a?.counts.added ?? r.changeCounts.added })] }),
							/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "제외" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: a?.counts.removed ?? r.changeCounts.removed })] }),
							/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "유지" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: a?.counts.unchanged ?? r.changeCounts.unchanged })] }),
							/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "사용 불가" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: a?.counts.unusable ?? r.current.unusableCount })] })
						] }),
						a?.removedIds.length ? /* @__PURE__ */ (0, K.jsxs)("details", { children: [/* @__PURE__ */ (0, K.jsxs)("summary", { children: [
							"제외된 identity ",
							a.removedIds.length,
							"건"
						] }), /* @__PURE__ */ (0, K.jsx)("ul", { children: a.removedIds.map((e) => /* @__PURE__ */ (0, K.jsx)("li", { children: e }, e)) })] }) : null,
						/* @__PURE__ */ (0, K.jsx)("p", { children: "Collection 정의는 저장된 필터 메타데이터입니다. 위 자료 카드만 현재 외부 evidence 후보입니다." })
					]
				})]
			})
		]
	});
}
//#endregion
//#region src/app/DeepResearchRoute.tsx
function $i({ children: e = "저장된 구조화 정보가 없습니다." }) {
	return /* @__PURE__ */ (0, K.jsx)("p", {
		className: "topicrpt-provenance-empty",
		children: e
	});
}
function ea({ report: e }) {
	let t = e.topicPlan, n = e.evidencePackSummary, r = e.researchResolution, i = kn(e.personalOverlay, e.canonicalRevision), a = typeof e.userContext == "string" ? e.userContext.trim() : e.userContext ? "생성 요청에 사용자 컨텍스트가 포함되었습니다." : "";
	return /* @__PURE__ */ (0, K.jsxs)("section", {
		className: "topicrpt-provenance",
		"aria-labelledby": "dr-provenance-heading",
		children: [
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "topicrpt-provenance-heading",
				children: [
					/* @__PURE__ */ (0, K.jsx)("p", {
						className: "section-kicker",
						children: "PROVENANCE"
					}),
					/* @__PURE__ */ (0, K.jsx)("h2", {
						id: "dr-provenance-heading",
						children: "리서치 근거 추적"
					}),
					/* @__PURE__ */ (0, K.jsx)("p", { children: "승인 계획, 외부 근거, 자료 공백과 개인 가설을 서로 다른 레이어로 확인합니다." })
				]
			}),
			e.contractWarnings.length > 0 && /* @__PURE__ */ (0, K.jsx)("div", {
				className: "topicrpt-contract-warning",
				role: "status",
				children: "일부 구조화 필드가 올바르지 않아 안전한 빈 상태로 표시했습니다."
			}),
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "topicrpt-provenance-grid",
				children: [
					/* @__PURE__ */ (0, K.jsxs)("section", {
						className: "topicrpt-provenance-panel",
						"data-qa": "dr-approved-plan",
						"aria-labelledby": "dr-approved-plan-heading",
						children: [/* @__PURE__ */ (0, K.jsx)("h3", {
							id: "dr-approved-plan-heading",
							children: "승인된 계획"
						}), t ? /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [
							/* @__PURE__ */ (0, K.jsxs)("dl", {
								className: "topicrpt-provenance-facts",
								children: [
									/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "주제" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: t.topic || "미기록" })] }),
									/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "보고서 유형" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: t.reportType || "미기록" })] }),
									/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "사용자 의도" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: t.userIntent || "미기록" })] })
								]
							}),
							/* @__PURE__ */ (0, K.jsx)("h4", { children: "리서치 질문" }),
							xa(t.researchQuestions),
							/* @__PURE__ */ (0, K.jsx)("h4", { children: "반증 조건" }),
							xa(t.falsificationTriggers)
						] }) : /* @__PURE__ */ (0, K.jsx)($i, {})]
					}),
					/* @__PURE__ */ (0, K.jsxs)("section", {
						className: "topicrpt-provenance-panel",
						"data-qa": "dr-evidence-coverage",
						"aria-labelledby": "dr-evidence-coverage-heading",
						children: [/* @__PURE__ */ (0, K.jsx)("h3", {
							id: "dr-evidence-coverage-heading",
							children: "근거 커버리지"
						}), n ? /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [
							/* @__PURE__ */ (0, K.jsxs)("dl", {
								className: "topicrpt-provenance-facts",
								children: [/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "외부 문서" }), /* @__PURE__ */ (0, K.jsxs)("dd", { children: [n.totalDocs, "건"] })] }), /* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "메모리 참조" }), /* @__PURE__ */ (0, K.jsxs)("dd", { children: [n.memoryCount, "건"] })] })]
							}),
							Object.keys(n.roleCounts).length > 0 && /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [/* @__PURE__ */ (0, K.jsx)("h4", { children: "근거 역할" }), /* @__PURE__ */ (0, K.jsx)("ul", {
								className: "topicrpt-provenance-list",
								children: Object.entries(n.roleCounts).map(([e, t]) => /* @__PURE__ */ (0, K.jsxs)("li", { children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: e }), /* @__PURE__ */ (0, K.jsxs)("span", { children: [t, "건"] })] }, e))
							})] }),
							Object.keys(n.axisCoverage).length ? /* @__PURE__ */ (0, K.jsx)("ul", {
								className: "topicrpt-provenance-list",
								children: Object.entries(n.axisCoverage).map(([e, t]) => /* @__PURE__ */ (0, K.jsxs)("li", { children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: t.label || e }), /* @__PURE__ */ (0, K.jsxs)("span", { children: [
									t.count,
									"건 · ",
									t.level || "수준 미상"
								] })] }, e))
							}) : /* @__PURE__ */ (0, K.jsx)($i, { children: "분석 축별 커버리지가 없습니다." }),
							Object.keys(n.questionCoverage).length > 0 && /* @__PURE__ */ (0, K.jsxs)("details", { children: [/* @__PURE__ */ (0, K.jsx)("summary", { children: "리서치 질문 커버리지" }), /* @__PURE__ */ (0, K.jsx)("ul", {
								className: "topicrpt-provenance-list",
								children: Object.entries(n.questionCoverage).map(([e, t]) => /* @__PURE__ */ (0, K.jsxs)("li", { children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: t.question || e }), /* @__PURE__ */ (0, K.jsxs)("span", { children: [
									t.count,
									"건 · ",
									t.level || "수준 미상"
								] })] }, e))
							})] }),
							e.evidenceItems.length > 0 && /* @__PURE__ */ (0, K.jsxs)("details", { children: [/* @__PURE__ */ (0, K.jsxs)("summary", { children: [
								"선별된 근거 ",
								e.evidenceItems.length,
								"건"
							] }), /* @__PURE__ */ (0, K.jsx)("ul", {
								className: "topicrpt-provenance-list",
								children: e.evidenceItems.map((e) => /* @__PURE__ */ (0, K.jsxs)("li", { children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: e.title }), /* @__PURE__ */ (0, K.jsx)("span", { children: [
									e.source,
									e.role,
									e.confidence
								].filter(Boolean).join(" · ") })] }, e.id))
							})] })
						] }) : /* @__PURE__ */ (0, K.jsx)($i, {})]
					}),
					/* @__PURE__ */ (0, K.jsxs)("section", {
						className: "topicrpt-provenance-panel topicrpt-provenance-wide",
						"data-qa": "dr-source-ledger",
						"aria-labelledby": "dr-source-ledger-heading",
						children: [
							/* @__PURE__ */ (0, K.jsx)("h3", {
								id: "dr-source-ledger-heading",
								children: "외부 근거 원장"
							}),
							/* @__PURE__ */ (0, K.jsx)("p", {
								className: "topicrpt-layer-note",
								children: "이 목록만 보고서의 권위 있는 외부 출처 원장입니다."
							}),
							e.sourceLedger.length ? /* @__PURE__ */ (0, K.jsx)("ol", {
								className: "topicrpt-source-ledger",
								children: e.sourceLedger.map((e) => /* @__PURE__ */ (0, K.jsxs)("li", { children: [
									/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: e.title || "제목 미상" }), /* @__PURE__ */ (0, K.jsx)("span", { children: [
										e.source,
										e.date,
										e.evidenceRole,
										e.reliability,
										e.artifactType
									].filter(Boolean).join(" · ") })] }),
									e.usedInSections.length > 0 && /* @__PURE__ */ (0, K.jsxs)("small", { children: ["사용 섹션: ", e.usedInSections.join(", ")] }),
									(e.axisKey || e.researchQuestionId || e.researchRound !== null) && /* @__PURE__ */ (0, K.jsxs)("small", { children: ["추적: ", [
										e.axisKey,
										e.researchQuestionId,
										e.researchRound === null ? "" : `round ${e.researchRound}`
									].filter(Boolean).join(" · ")] }),
									e.url && /* @__PURE__ */ (0, K.jsx)("a", {
										href: e.url,
										target: "_blank",
										rel: "noopener noreferrer",
										children: "원문 열기"
									})
								] }, e.sourceId))
							}) : /* @__PURE__ */ (0, K.jsx)($i, { children: "확인 가능한 외부 근거 원장이 없습니다." })
						]
					}),
					/* @__PURE__ */ (0, K.jsxs)("section", {
						className: "topicrpt-provenance-panel",
						"data-qa": "dr-data-gaps",
						"aria-labelledby": "dr-data-gaps-heading",
						children: [/* @__PURE__ */ (0, K.jsx)("h3", {
							id: "dr-data-gaps-heading",
							children: "자료 공백"
						}), e.dataGaps.length ? /* @__PURE__ */ (0, K.jsx)("ul", {
							className: "topicrpt-provenance-list",
							children: e.dataGaps.map((e) => /* @__PURE__ */ (0, K.jsxs)("li", {
								"data-severity": e.severity,
								children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: e.description }), /* @__PURE__ */ (0, K.jsx)("span", { children: e.resolved ? "해결됨" : e.suggestedAction || "추가 확인 필요" })]
							}, e.id))
						}) : /* @__PURE__ */ (0, K.jsx)($i, { children: "기록된 자료 공백이 없습니다." })]
					}),
					/* @__PURE__ */ (0, K.jsxs)("section", {
						className: "topicrpt-provenance-panel",
						"data-qa": "dr-quality",
						"aria-labelledby": "dr-quality-heading",
						children: [/* @__PURE__ */ (0, K.jsx)("h3", {
							id: "dr-quality-heading",
							children: "품질과 경고"
						}), e.quality ? /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [
							/* @__PURE__ */ (0, K.jsxs)("dl", {
								className: "topicrpt-provenance-facts",
								children: [/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "평가" }), /* @__PURE__ */ (0, K.jsxs)("dd", { children: [
									e.quality.score ?? "—",
									"점 · ",
									e.quality.grade || "등급 미상"
								] })] }), /* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "상태" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: e.quality.status || "미기록" })] })]
							}),
							/* @__PURE__ */ (0, K.jsx)("h4", { children: "경고" }),
							xa(e.quality.warnings, "경고 없음"),
							/* @__PURE__ */ (0, K.jsx)("h4", { children: "보완 제안" }),
							xa(e.quality.suggestedFixes, "제안 없음")
						] }) : /* @__PURE__ */ (0, K.jsx)($i, {})]
					}),
					/* @__PURE__ */ (0, K.jsxs)("section", {
						className: "topicrpt-provenance-panel topicrpt-provenance-wide",
						"data-qa": "dr-collection-resolution",
						"aria-labelledby": "dr-collection-resolution-heading",
						children: [/* @__PURE__ */ (0, K.jsx)("h3", {
							id: "dr-collection-resolution-heading",
							children: "Collection 실행 스냅샷"
						}), r ? /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [
							/* @__PURE__ */ (0, K.jsxs)("dl", {
								className: "topicrpt-provenance-facts topicrpt-provenance-facts-wide",
								children: [
									/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "Collection" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: r.collectionId || "직접 범위" })] }),
									/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "Revision" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: r.collectionRevision ?? "—" })] }),
									/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "후보" }), /* @__PURE__ */ (0, K.jsxs)("dd", { children: [r.eligibleTotal ?? "—", "건"] })] }),
									/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "선택 근거" }), /* @__PURE__ */ (0, K.jsxs)("dd", { children: [r.selectedEvidenceIds.length, "건"] })] }),
									/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "후보 상한" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: r.candidateCap ?? "—" })] }),
									/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "해결 / 실행" }), /* @__PURE__ */ (0, K.jsxs)("dd", { children: [
										r.resolvedCandidateIds.length,
										" / ",
										r.executionUniverseIds.length,
										"건"
									] })] })
								]
							}),
							/* @__PURE__ */ (0, K.jsxs)("details", { children: [/* @__PURE__ */ (0, K.jsx)("summary", { children: "재현성 세부 정보" }), /* @__PURE__ */ (0, K.jsxs)("dl", {
								className: "topicrpt-provenance-facts topicrpt-provenance-facts-wide",
								children: [
									/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "Definition hash" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: r.collectionDefinitionHash || "—" })] }),
									/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "Input watermark" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: r.inputWatermark || "—" })] }),
									/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "Index generation" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: r.providerGenerations.indexGeneration || "—" })] }),
									/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "RSS generation" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: r.providerGenerations.rssGeneration || "—" })] }),
									/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "Fingerprint" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: r.resolutionFingerprint || "—" })] }),
									/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "Resolved at" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: r.resolvedAt || "—" })] })
								]
							})] }),
							r.unusableCandidates.length > 0 && /* @__PURE__ */ (0, K.jsxs)("p", {
								className: "topicrpt-layer-note",
								children: [
									"사용 제외 ",
									r.unusableCandidates.length,
									"건 · ",
									r.unusableCandidates.map((e) => e.reason).join(", ")
								]
							}),
							r.zeroEvidenceRequired && /* @__PURE__ */ (0, K.jsxs)("p", {
								className: "topicrpt-contract-warning",
								children: ["근거 부족 확인: ", r.zeroEvidenceReason || "사유 미기록"]
							})
						] }) : /* @__PURE__ */ (0, K.jsx)($i, {})]
					}),
					/* @__PURE__ */ (0, K.jsxs)("aside", {
						className: "topicrpt-hypothesis-panel",
						"data-qa": "dr-user-context-hypothesis",
						"aria-labelledby": "dr-user-context-heading",
						children: [
							/* @__PURE__ */ (0, K.jsx)("p", {
								className: "section-kicker",
								children: "HYPOTHESIS · 근거 아님"
							}),
							/* @__PURE__ */ (0, K.jsx)("h3", {
								id: "dr-user-context-heading",
								children: "사용자 컨텍스트"
							}),
							/* @__PURE__ */ (0, K.jsx)("p", { children: a || "이 보고서에는 사용자 컨텍스트가 기록되지 않았습니다." })
						]
					}),
					/* @__PURE__ */ (0, K.jsxs)("aside", {
						className: "topicrpt-hypothesis-panel topicrpt-provenance-wide",
						"data-qa": "dr-overlay-hypothesis",
						"aria-labelledby": "dr-overlay-heading",
						children: [
							/* @__PURE__ */ (0, K.jsx)("p", {
								className: "section-kicker",
								children: "PERSONAL OVERLAY · HYPOTHESIS"
							}),
							/* @__PURE__ */ (0, K.jsx)("h3", {
								id: "dr-overlay-heading",
								children: "개인 해석"
							}),
							/* @__PURE__ */ (0, K.jsx)(Kt, {
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
function ta({ resolution: e }) {
	if (!e) return null;
	let t = ui(e), n = typeof e.reason == "string" ? e.reason : "", r = e.injected === !0, i = t?.status || (n === "policy_excluded" ? "excluded" : "unknown"), a = i === "current" && r ? "생성 시점의 현재 상태를 별도 시장 배경으로 포함했습니다." : i === "stale" ? "최신성이 만료되어 보고서 판단에는 주입하지 않았습니다." : i === "fallback" ? "참고용 대체 상태이며 현재 투자 자세로 사용하지 않았습니다." : i === "empty" ? "사용 가능한 시장 상태가 없어 보고서 판단에 포함하지 않았습니다." : i === "excluded" ? "요청 정책에 따라 시장 상태를 제외했습니다." : "시장 상태 참조를 확인할 수 없습니다.";
	return /* @__PURE__ */ (0, K.jsxs)("aside", {
		className: `topicrpt-market-state-context state-${i}`,
		"data-qa": "dr-market-state-context",
		"data-status": i,
		"aria-label": "별도 Market State 컨텍스트",
		children: [
			/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "Market State · source-grounded context" }), /* @__PURE__ */ (0, K.jsx)("strong", { children: i })] }),
			/* @__PURE__ */ (0, K.jsx)("p", { children: a }),
			t ? /* @__PURE__ */ (0, K.jsxs)("dl", { children: [
				/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "기준 시각" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: t.asOf || "없음" })] }),
				/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "최신성" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: t.freshnessReason })] }),
				/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "출처" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: t.sourceKind })] }),
				/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("dt", { children: "범위" }), /* @__PURE__ */ (0, K.jsx)("dd", { children: t.scope })] })
			] }) : null,
			/* @__PURE__ */ (0, K.jsx)("small", { children: "이 컨텍스트는 외부 근거 목록·인용·가설에 포함되지 않습니다." })
		]
	});
}
var na = [{
	key: "custom",
	label: "질문 중심"
}], ra = { custom: "질문 중심" }, ia = [
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
function aa(e, t) {
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
function oa(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function sa(e) {
	return typeof e == "string" && ia.includes(e);
}
function ca(e) {
	return oa(e) ? typeof e.id == "string" && sa(e.status) : !1;
}
function la(e) {
	return oa(e) ? ca(e.job) : !1;
}
var ua = class extends Error {
	job;
	name = "JobTerminalError";
	constructor(e) {
		super(e.message || e.error || `딥 리서치 작업이 ${e.status} 상태로 종료되었습니다.`), this.job = e;
	}
};
async function da(e, t) {
	let n = e, r = Date.now() + 12e4;
	for (; N(n.status);) {
		if (Date.now() >= r) throw Error("작업이 아직 실행 중입니다. 잠시 후 작업 목록에서 다시 확인하세요.");
		await aa(1e3, t), n = await L(`/api/jobs/${encodeURIComponent(n.id)}`, { signal: t });
	}
	if (n.status !== "done") throw new ua(n);
	return n;
}
function fa(e = "", t = "딥 리서치") {
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
function pa(e) {
	return e.topicLabel || e.topicKey || "딥 리서치";
}
function ma(e) {
	let t = String(e.topicKey || "").trim();
	return ra[t] || t || "기타";
}
function ha(e) {
	return e ? e.slice(0, 10) || e : "날짜 미상";
}
function ga(e) {
	window.location.hash = e ? un(e) : "#/deep-research";
}
function _a() {
	return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "deep-research";
}
function va(e) {
	return e instanceof M ? e.code : e instanceof ua ? e.job.errorCode || e.job.status : e instanceof Error ? e.name : "request_failed";
}
function ya(e, t) {
	let n = va(t);
	return e === "validation" ? "투자 질문을 1~500자로 입력하세요." : n === "evidence_confirmation_required" || n === "resolution_changed" ? "자료 상태가 계획 미리보기와 달라졌습니다. 최신 계획을 다시 미리보고 확인하세요." : n === "no_index" || n === "index_unavailable" ? "연구 인덱스를 아직 읽을 수 없습니다. RSS 자료를 수집하고 인덱스를 만든 뒤 다시 시도하세요." : n === "rss_unavailable" ? "RSS 자료를 읽을 수 없습니다. RSS 수집 상태를 확인한 뒤 다시 시도하세요." : n === "cli_unavailable" ? "선택한 CLI 어댑터를 사용할 수 없습니다. 자동 어댑터를 선택하거나 설정을 확인하세요." : e === "degraded" ? "근거가 없는 규칙 기반 보고서를 실행하려면 근거 부족 확인이 필요합니다." : e === "generation" ? "생성 작업에 실패했습니다. 입력과 승인 계획은 유지되므로 다시 실행할 수 있습니다." : e === "report" ? "저장된 보고서를 열지 못했습니다. 목록으로 돌아가 다시 시도하세요." : t instanceof Error && t.message ? t.message : "요청을 처리하지 못했습니다. 입력을 확인하고 다시 시도하세요.";
}
function ba(e) {
	return {
		id: e.approval.id,
		token: e.approval.token
	};
}
function xa(e, t = "없음") {
	return e.length ? /* @__PURE__ */ (0, K.jsx)("ul", {
		className: "topicrpt-inline-list",
		children: e.map((e) => /* @__PURE__ */ (0, K.jsx)("li", { children: e }, e))
	}) : /* @__PURE__ */ (0, K.jsx)("span", {
		className: "topicrpt-empty-value",
		children: t
	});
}
function Sa({ envelope: e, executionMode: t, cliAdapter: n, onExecutionMode: r, onCliAdapter: i, onContinue: a, onEdit: o, degradedConfirming: s, onConfirmDegraded: c, onCancelDegraded: l }) {
	let { approvedRequest: u, preview: d } = e, f = u.topicPlan, p = d.zeroEvidence, m = p.reasonCode;
	return /* @__PURE__ */ (0, K.jsxs)("section", {
		className: "input-panel topicrpt-plan-panel",
		"data-qa": "dr-plan",
		"aria-labelledby": "dr-plan-heading",
		children: [
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "input-panel-header",
				children: [
					/* @__PURE__ */ (0, K.jsx)("span", {
						className: "section-kicker",
						children: "PLAN REVIEW"
					}),
					/* @__PURE__ */ (0, K.jsx)("h2", {
						id: "dr-plan-heading",
						children: "실행 전에 리서치 계획을 확인하세요"
					}),
					/* @__PURE__ */ (0, K.jsx)("p", { children: "계획의 범위와 자료 상태를 확인한 뒤에만 생성 작업을 시작합니다. 이 계획은 승인된 요청의 일부로 기록됩니다." })
				]
			}),
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "topicrpt-plan-grid",
				children: [
					/* @__PURE__ */ (0, K.jsxs)("div", {
						className: "topicrpt-plan-card",
						children: [
							/* @__PURE__ */ (0, K.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "보고서 유형"
							}),
							/* @__PURE__ */ (0, K.jsx)("strong", { children: f.reportType }),
							/* @__PURE__ */ (0, K.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "분석 축"
							}),
							f.analysisAxes.length ? /* @__PURE__ */ (0, K.jsx)("ul", {
								className: "topicrpt-axis-list",
								children: f.analysisAxes.map((e) => /* @__PURE__ */ (0, K.jsxs)("li", { children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: e.label }), xa(e.questions)] }, e.key))
							}) : /* @__PURE__ */ (0, K.jsx)("span", {
								className: "topicrpt-empty-value",
								children: "분석 축 없음"
							})
						]
					}),
					/* @__PURE__ */ (0, K.jsxs)("div", {
						className: "topicrpt-plan-card",
						children: [
							/* @__PURE__ */ (0, K.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "검색 질의"
							}),
							xa(f.searchQueries),
							/* @__PURE__ */ (0, K.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "심층 범위"
							}),
							/* @__PURE__ */ (0, K.jsxs)("p", { children: [
								"최대 ",
								f.deepResearch.maxRounds,
								"라운드 · 하위 질문 ",
								f.deepResearch.subQuestions.length,
								"개"
							] }),
							/* @__PURE__ */ (0, K.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "예상 공백"
							}),
							xa(f.dataGapsLikely)
						]
					}),
					/* @__PURE__ */ (0, K.jsxs)("div", {
						className: "topicrpt-plan-card",
						children: [
							/* @__PURE__ */ (0, K.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "Collection 스냅샷"
							}),
							u.collectionRef ? /* @__PURE__ */ (0, K.jsxs)("p", { children: [
								"저장된 외부 근거 필터 · ",
								u.collectionRef.id,
								" · revision ",
								u.collectionRef.revision,
								/* @__PURE__ */ (0, K.jsx)("br", {}),
								"eligible ",
								d.resolution.eligibleTotal ?? 0,
								" · selected ",
								d.resolution.selectedEvidenceIds.length,
								/* @__PURE__ */ (0, K.jsx)("br", {}),
								/* @__PURE__ */ (0, K.jsx)("small", { children: "컬렉션은 근거가 아니며 서버가 일치 자료를 해석합니다." })
							] }) : /* @__PURE__ */ (0, K.jsx)("p", { children: "저장 필터 없이 전체 허용 자료에서 확인합니다." }),
							p.required && /* @__PURE__ */ (0, K.jsxs)("p", {
								className: "topicrpt-zero-evidence",
								"data-qa": `dr-readiness-${m === "no_index" ? "no-index" : m || "zero-evidence"}`,
								"data-reason-code": m || void 0,
								children: [m === "no_index" ? "인덱스 없음" : m === "filtered_empty" ? "필터 결과 없음" : "일치 자료 없음", " · 실행 전 확인 필요"]
							}),
							/* @__PURE__ */ (0, K.jsx)("span", {
								className: "topicrpt-plan-label",
								children: "Market State"
							}),
							/* @__PURE__ */ (0, K.jsxs)("p", { children: [
								u.marketStatePolicy,
								" · scope ",
								u.marketStateScope,
								/* @__PURE__ */ (0, K.jsx)("br", {}),
								/* @__PURE__ */ (0, K.jsx)("small", { children: "실행 시 status · as-of · freshness · source를 별도 컨텍스트로 기록합니다." })
							] })
						]
					})
				]
			}),
			p.required && m && p.resolutionFingerprint && /* @__PURE__ */ (0, K.jsxs)("div", {
				className: "topicrpt-degraded-panel",
				"data-qa": `dr-degraded-${m === "no_index" ? "no-index" : m}`,
				"data-reason-code": m,
				role: "alert",
				children: [
					/* @__PURE__ */ (0, K.jsx)("strong", { children: "근거 부족 상태를 확인해야 합니다" }),
					/* @__PURE__ */ (0, K.jsx)("p", { children: "현재 선택된 외부 근거가 0건입니다. 확인하면 규칙 기반 결과로 진행하며, 보고서에 근거 공백과 반대 근거를 표시합니다." }),
					s ? /* @__PURE__ */ (0, K.jsxs)("div", {
						className: "topicrpt-degraded-actions",
						children: [/* @__PURE__ */ (0, K.jsx)("button", {
							className: "filter-btn apply",
							type: "button",
							"data-qa": "dr-degraded-confirm",
							onClick: c,
							children: "근거 부족을 확인하고 계속"
						}), /* @__PURE__ */ (0, K.jsx)("button", {
							className: "filter-btn clear",
							type: "button",
							onClick: l,
							children: "취소"
						})]
					}) : /* @__PURE__ */ (0, K.jsx)("p", { children: "계속하기를 누르면 확인 단계가 열립니다." })
				]
			}),
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "topicrpt-action-row",
				children: [
					/* @__PURE__ */ (0, K.jsxs)("label", {
						className: "field topicrpt-execution-field",
						children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "실행 경로" }), /* @__PURE__ */ (0, K.jsxs)("select", {
							value: t,
							onChange: (e) => r(e.currentTarget.value),
							children: [/* @__PURE__ */ (0, K.jsx)("option", {
								value: "direct",
								children: "Direct API"
							}), /* @__PURE__ */ (0, K.jsx)("option", {
								value: "cli",
								children: "CLI"
							})]
						})]
					}),
					t === "cli" && /* @__PURE__ */ (0, K.jsxs)("label", {
						className: "field topicrpt-execution-field",
						children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "CLI 어댑터" }), /* @__PURE__ */ (0, K.jsxs)("select", {
							value: n,
							onChange: (e) => i(e.currentTarget.value),
							children: [
								/* @__PURE__ */ (0, K.jsx)("option", {
									value: "auto",
									children: "자동 선택"
								}),
								/* @__PURE__ */ (0, K.jsx)("option", {
									value: "codex",
									children: "Codex"
								}),
								/* @__PURE__ */ (0, K.jsx)("option", {
									value: "claude",
									children: "Claude"
								}),
								/* @__PURE__ */ (0, K.jsx)("option", {
									value: "antigravity",
									children: "Antigravity"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, K.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						onClick: o,
						children: "질문 수정"
					}),
					/* @__PURE__ */ (0, K.jsx)("button", {
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
function Ca() {
	let [e, t] = (0, c.useState)(0), [n, r] = (0, c.useState)([]), [i, a] = (0, c.useState)(null), o = (0, c.useMemo)(() => dn(window.location.hash), []), [s, l] = (0, c.useState)(o.kind === "report" ? o.id : ""), [d, f] = (0, c.useState)(o.kind === "collection" ? o.id : ""), [p, m] = (0, c.useState)(o.malformed), [h, g] = (0, c.useState)(""), [_, v] = (0, c.useState)(""), [y, b] = (0, c.useState)("include_current"), [x, S] = (0, c.useState)("AUTO"), [C, w] = (0, c.useState)(null), [T, E] = (0, c.useState)(!1), [D, O] = (0, c.useState)("readiness"), [k, A] = (0, c.useState)(null), [j, N] = (0, c.useState)("direct"), [P, F] = (0, c.useState)("auto"), [I, z] = (0, c.useState)(!1), [B, V] = (0, c.useState)(!1), [ee, H] = (0, c.useState)(""), [te, U] = (0, c.useState)(null), [ne, G] = (0, c.useState)(""), [ie, oe] = (0, c.useState)(null), [se, ce] = (0, c.useState)(""), [le, ue] = (0, c.useState)(""), [de, pe] = (0, c.useState)(0), me = (0, c.useRef)(0), he = (0, c.useRef)(null), ge = (0, c.useRef)(null), _e = (0, c.useRef)(""), ve = (0, c.useRef)(!1), ye = na[0].key, be = h, xe = (0, c.useCallback)(() => {
		he.current?.abort();
		let e = new AbortController();
		return he.current = e, me.current += 1, {
			id: me.current,
			signal: e.signal
		};
	}, []), Se = (0, c.useCallback)((e) => e === me.current, []), Ce = (0, c.useCallback)(async (e) => {
		V(!0);
		try {
			let t = await L("/api/topic-reports", { signal: e });
			r(Mn(t)), oe(null), O((e) => e === "readiness" ? "draft" : e), W("deep-research", {
				surface: "topic_report",
				viewId: "topicrpt",
				reportKind: "",
				reportId: "",
				collectionId: null,
				collectionRevision: null
			});
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError") return;
			H(ya("readiness", e)), U("readiness"), G(va(e));
			let t = va(e);
			oe(t === "no_index" || t === "index_unavailable" ? "no-index" : t === "rss_unavailable" ? "rss" : "api"), O("recoverable-error");
		} finally {
			V(!1);
		}
	}, []);
	(0, c.useEffect)(() => {
		let e = new AbortController();
		return Ce(e.signal), () => e.abort();
	}, [Ce]), (0, c.useEffect)(() => {
		let e = {
			collectionId: C?.id || null,
			collectionRevision: C?.revision || null
		};
		return re("deep-research", e), () => {
			let t = window.FolioAgent?.currentContext;
			t?.collectionId === e.collectionId && t.collectionRevision === e.collectionRevision && re("deep-research", {
				collectionId: null,
				collectionRevision: null
			});
		};
	}, [C]), (0, c.useEffect)(() => {
		let e = () => {
			if (!_a()) return;
			let e = dn(window.location.hash);
			m(e.malformed), l(e.kind === "report" ? e.id : ""), f(e.kind === "collection" ? e.id : ""), e.malformed && (a(null), H(e.kind === "collection" ? "컬렉션 주소 형식이 올바르지 않습니다. 목록으로 돌아가 다시 여세요." : "보고서 주소 형식이 올바르지 않습니다. 목록으로 돌아가 다시 여세요."), U("report"), G(e.kind === "collection" ? "malformed_collection_id" : "malformed_report_id"), O("recoverable-error"));
		};
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []);
	let we = (0, c.useCallback)(() => {
		ve.current = !0, a(null), m(!1), H(""), U(null), G(""), ga();
	}, []);
	(0, c.useEffect)(() => {
		s || p || !ve.current || (ve.current = !1, window.requestAnimationFrame(() => {
			let e = _e.current.replace(/["\\]/g, "");
			((e ? document.querySelector("[data-report-id=\"" + e + "\"]") : null) || ge.current)?.focus({ preventScroll: !0 });
		}));
	}, [
		s,
		p,
		D
	]), (0, c.useEffect)(() => {
		let e = (e) => {
			let n = e.detail;
			Ue(n, window.FolioAgent?.currentContext) && (pe((e) => e + 1), t((e) => e + 1));
		};
		return window.addEventListener(fe, e), () => window.removeEventListener(fe, e);
	}, []), (0, c.useEffect)(() => {
		let e = new AbortController();
		he.current?.abort();
		let t = me.current + 1;
		me.current = t;
		async function n(n) {
			V(!0), H(""), U(null), G("");
			try {
				let r = await L(`/api/topic-reports/${encodeURIComponent(n)}?includePersonal=true`, { signal: e.signal });
				if (e.signal.aborted || me.current !== t) return;
				let i = jn(r);
				a(i), O("report"), W("deep-research", {
					surface: "topic_report_reader",
					viewId: "topicrpt",
					reportKind: "topic_report",
					reportId: i.id || n,
					collectionId: C?.id || null,
					collectionRevision: C?.revision || null
				});
			} catch (n) {
				if (n instanceof DOMException && n.name === "AbortError" || e.signal.aborted || me.current !== t) return;
				a(null), H(ya("report", n)), U("report"), G(va(n)), O("recoverable-error");
			} finally {
				!e.signal.aborted && me.current === t && V(!1);
			}
		}
		return s && !p ? n(s) : !p && !d && (a(null), O((e) => e === "report" ? "draft" : e), W("deep-research", {
			surface: "topic_report",
			viewId: "topicrpt",
			reportKind: "",
			reportId: "",
			collectionId: C?.id || null,
			collectionRevision: C?.revision || null
		}), V(!1)), () => e.abort();
	}, [
		d,
		s,
		p,
		de
	]);
	let Te = async (e) => {
		e.preventDefault();
		let t = h.normalize("NFKC").trim();
		if (!t || t.length > 500) {
			H(ya("validation", /* @__PURE__ */ Error("question_invalid"))), U("validation"), G("question_invalid"), O("recoverable-error");
			return;
		}
		let n = xe();
		O("plan-loading"), A(null), z(!1), H(""), U(null), G(""), ce("질문을 실행 계획으로 바꾸는 중입니다.");
		let r = {
			question: t,
			userContext: _.normalize("NFKC").trim(),
			deepResearch: !0,
			customTickers: {},
			marketStatePolicy: y,
			marketStateScope: x,
			collectionRef: C
		};
		try {
			let e = await R("/api/topic-reports/plan", r, { signal: n.signal });
			if (!Se(n.id)) return;
			A(e), O("plan-review"), ce("실행 계획을 확인하세요.");
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError" || !Se(n.id)) return;
			H(ya("plan", e)), U("plan"), G(va(e)), oe(va(e) === "no_index" || va(e) === "index_unavailable" ? "no-index" : va(e) === "rss_unavailable" ? "rss" : null), O("recoverable-error"), ce("");
		}
	}, Ee = async (e) => {
		let n = xe();
		O("generation"), H(""), U(null), G(""), ce("승인된 계획으로 리서치를 생성하는 중입니다.");
		let i = {
			mode: j,
			adapter: j === "direct" ? "auto" : P,
			fallbackPolicy: u
		}, o = {
			approvedRequest: e.approvedRequest,
			approval: ba(e),
			execution: i
		};
		try {
			let e = await R("/api/topic-reports", o, { signal: n.signal }), i = la(e) ? e.job : ca(e) ? e : null;
			if (!i) throw Error("생성 작업 ID를 확인하지 못했습니다.");
			let s = await da(i, n.signal);
			if (t((e) => e + 1), !Se(n.id)) return;
			let c = s.result?.reportId || s.result?.artifactId || "";
			if (!c) throw Error("생성된 보고서 ID를 확인하지 못했습니다.");
			let l = jn(await L(`/api/topic-reports/${encodeURIComponent(c)}?includePersonal=true`, { signal: n.signal }));
			if (!Se(n.id)) return;
			r((e) => [l, ...e.filter((e) => e.id !== l.id)]), a(l), O("report"), ce("딥 리서치를 생성하고 자동 저장했습니다."), ga(l.id), W("deep-research", {
				surface: "topic_report_reader",
				viewId: "topicrpt",
				reportKind: "topic_report",
				reportId: l.id || "",
				collectionId: C?.id || null,
				collectionRevision: C?.revision || null
			});
		} catch (e) {
			if (t((e) => e + 1), e instanceof DOMException && e.name === "AbortError" || !Se(n.id)) return;
			H(ya("generation", e)), U(e instanceof M && (e.code === "evidence_confirmation_required" || e.code === "resolution_changed") ? "degraded" : "generation"), G(va(e)), O("recoverable-error"), ce("");
		}
	}, De = () => {
		if (k) {
			if (k.preview.zeroEvidence.required) {
				if (!k.preview.zeroEvidence.reasonCode || !k.preview.zeroEvidence.resolutionFingerprint) {
					H("근거 부족 확인 정보가 없어 실행을 중단했습니다. 계획을 다시 미리보세요."), U("degraded"), G("invalid_zero_evidence"), O("recoverable-error");
					return;
				}
				z(!0), ce("근거 부족 확인을 검토하세요.");
				return;
			}
			Ee(k);
		}
	}, Oe = async () => {
		if (!k) return;
		let e = k.preview.zeroEvidence;
		if (!e.required || !e.reasonCode || !e.resolutionFingerprint) return;
		let t = xe();
		H(""), U(null), G(""), ce("근거 부족 확인을 저장하는 중입니다.");
		let n = {
			approvedRequest: k.approvedRequest,
			approval: ba(k),
			reasonCode: e.reasonCode,
			resolutionFingerprint: e.resolutionFingerprint,
			confirmed: !0
		};
		try {
			let e = await R("/api/topic-reports/confirm-degraded", n, { signal: t.signal });
			if (!Se(t.id)) return;
			A(e), z(!1), await Ee(e);
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError" || !Se(t.id)) return;
			H(ya("degraded", e)), U("degraded"), G(va(e)), O("recoverable-error"), ce("");
		}
	};
	async function ke(e) {
		if (!(!e.id || !window.confirm(`${pa(e)} 보고서를 삭제할까요?`))) {
			ue(`delete-${e.id}`), H("");
			try {
				let t = await fetch(`/api/topic-reports/${encodeURIComponent(e.id)}`, { method: "DELETE" });
				if (!t.ok) throw Error(`삭제 실패: ${t.status}`);
				i?.id === e.id && ga(), r((t) => t.filter((t) => t.id !== e.id)), ce("저장된 딥 리서치를 삭제했습니다.");
			} catch (e) {
				H(e instanceof Error ? e.message : "보고서 삭제에 실패했습니다."), U("report"), G(va(e));
			} finally {
				ue("");
			}
		}
	}
	async function Ae(e) {
		if (i) {
			ue(e), ce(e === "notion" ? "Notion으로 내보내는 중..." : "Obsidian으로 내보내는 중...");
			try {
				let t = e === "notion" ? await R("/api/export-notion/topic-report", i) : await R("/api/export-obsidian/topic-report", i);
				ce(e === "notion" ? `Notion으로 내보냈습니다${t.title ? `: ${t.title}` : ""}` : `Obsidian으로 내보냈습니다${t.topic || t.filename ? `: ${t.topic || t.filename}` : ""}`);
			} catch (e) {
				ce(e instanceof Error ? e.message : "내보내기에 실패했습니다.");
			} finally {
				ue("");
			}
		}
	}
	async function je() {
		if (i?.id) {
			ue("overlay"), ce("내 노트와 연결하는 중...");
			try {
				let e = await R(`/api/topic-reports/${encodeURIComponent(i.id)}/personal-overlay`, {});
				ca(e) && await da(e, new AbortController().signal);
				let t = jn(await L(`/api/topic-reports/${encodeURIComponent(i.id)}?includePersonal=true`));
				a(t), ce("내 노트와 연결했습니다.");
			} catch (e) {
				ce(e instanceof Error ? e.message : "내 노트 연결에 실패했습니다.");
			} finally {
				ue("");
			}
		}
	}
	let Me = (0, c.useMemo)(() => {
		let e = /* @__PURE__ */ new Map();
		for (let t of n) {
			let n = ma(t);
			e.has(n) || e.set(n, []), e.get(n)?.push(t);
		}
		return Array.from(e.entries()).map(([e, t]) => ({
			key: e,
			rows: t.sort((e, t) => String(t.generatedAt || t.date || "").localeCompare(String(e.generatedAt || e.date || "")))
		})).sort((e, t) => String(t.rows[0]?.generatedAt || t.rows[0]?.date || "").localeCompare(String(e.rows[0]?.generatedAt || e.rows[0]?.date || "")));
	}, [n]), Ne = fa(i?.markdown || "", i ? pa(i) : "딥 리서치"), Pe = di(i?.marketStateResolution), Fe = (0, c.useCallback)((e) => {
		let t = e.source === "both" ? "포트폴리오·워치리스트" : e.source === "portfolio" ? "포트폴리오" : "워치리스트", n = `개인 맥락(hypothesis): ${e.ticker} · ${t}`;
		v((e) => {
			let t = e.split("\n").map((e) => e.trim()).filter(Boolean);
			return t.includes(n) ? e : [...t, n].join("\n").slice(0, 4e3);
		});
	}, []);
	if (d && !p) return /* @__PURE__ */ (0, K.jsx)("div", {
		className: "react-deep-research-route",
		"data-deep-research-route": !0,
		children: /* @__PURE__ */ (0, K.jsx)(Qi, {
			collectionId: d,
			onBack: () => ga(),
			onStartResearch: (e) => {
				w(e), ga();
			}
		})
	});
	if (s && !i && !(D === "recoverable-error" && te === "report")) return /* @__PURE__ */ (0, K.jsx)("div", {
		className: "react-deep-research-route",
		"data-deep-research-route": !0,
		children: /* @__PURE__ */ (0, K.jsxs)("section", {
			className: "topicrpt-report-state",
			"data-qa": "dr-report-loading",
			role: "status",
			"aria-live": "polite",
			"aria-busy": "true",
			children: [
				/* @__PURE__ */ (0, K.jsx)("p", {
					className: "section-kicker",
					children: "DEEP RESEARCH"
				}),
				/* @__PURE__ */ (0, K.jsx)("h1", {
					tabIndex: -1,
					children: "저장된 리포트를 여는 중입니다"
				}),
				/* @__PURE__ */ (0, K.jsx)("p", { children: "Canonical 보고서와 구조화된 근거 원장을 함께 확인하고 있습니다." })
			]
		})
	});
	if ((s || p) && !i && (p || D === "recoverable-error" && te === "report")) {
		let e = ne === "topic_report_not_found" || ne === "not_found";
		return /* @__PURE__ */ (0, K.jsx)("div", {
			className: "react-deep-research-route",
			"data-deep-research-route": !0,
			children: /* @__PURE__ */ (0, K.jsxs)("section", {
				className: "topicrpt-report-state is-error",
				"data-qa": e ? "dr-report-not-found" : "dr-report-error",
				role: "alert",
				"aria-live": "assertive",
				children: [
					/* @__PURE__ */ (0, K.jsx)("p", {
						className: "section-kicker",
						children: "DEEP RESEARCH"
					}),
					/* @__PURE__ */ (0, K.jsx)("h1", { children: e ? "저장된 리포트를 찾을 수 없습니다" : "리포트를 열 수 없습니다" }),
					/* @__PURE__ */ (0, K.jsx)("p", {
						"data-qa": e ? "dr-not-found" : void 0,
						children: ee || "보고서 주소나 저장 데이터를 확인한 뒤 목록에서 다시 여세요."
					}),
					/* @__PURE__ */ (0, K.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						"data-qa": "dr-report-return",
						onClick: we,
						children: "딥 리서치 목록으로 돌아가기"
					})
				]
			})
		});
	}
	if (i && D === "report") return /* @__PURE__ */ (0, K.jsxs)("div", {
		className: "react-deep-research-route",
		"data-deep-research-route": !0,
		"data-qa": "dr-report",
		children: [
			ee && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-error",
				"data-qa": "dr-error-report",
				children: ee
			}),
			(i.mode === "fallback" || i.generation?.mode === "rules") && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-warning",
				"data-qa": "dr-degraded-rules",
				role: "status",
				children: "근거 부족을 확인한 규칙 기반 보고서입니다. 자료 공백과 반대 근거를 함께 확인하세요."
			}),
			/* @__PURE__ */ (0, K.jsxs)(on, {
				eyebrow: `DEEP RESEARCH${i.date ? ` · ${i.date}` : ""}`,
				title: Ne.title,
				meta: `${pa(i)} · 뉴스 ${i.docCount || 0}건 · 내러티브 ${i.memoryCount || 0}건`,
				agentContext: {
					surface: "topic_report_reader",
					viewId: "topicrpt",
					reportKind: "topic_report",
					reportId: i.id || "",
					topic: pa(i),
					marketState: Pe
				},
				breadcrumb: /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [/* @__PURE__ */ (0, K.jsx)("button", {
					type: "button",
					"data-qa": "dr-report-return",
					onClick: we,
					children: "딥 리서치"
				}), /* @__PURE__ */ (0, K.jsx)("span", { children: Ne.title })] }),
				onClose: we,
				actionSlot: /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [
					/* @__PURE__ */ (0, K.jsx)(jt, {
						title: "AI",
						children: /* @__PURE__ */ (0, K.jsx)(Mt, {
							icon: "agent",
							onClick: () => ae({
								surface: "topic_report_reader",
								reportKind: "topic_report",
								reportId: i.id || "",
								topic: pa(i),
								message: `${Ne.title}의 핵심 결론, 반대 근거, 더 발전시킬 분석 방향을 정리해줘.`,
								autoSubmit: !0
							}),
							children: "Agent에게 묻기"
						})
					}),
					/* @__PURE__ */ (0, K.jsx)(jt, {
						title: "노트",
						children: /* @__PURE__ */ (0, K.jsx)(Mt, {
							icon: "link",
							"data-qa": "dr-overlay-generate",
							disabled: le === "overlay" || !i.id,
							onClick: je,
							children: le === "overlay" ? "연결 중" : "내 노트와 연결"
						})
					}),
					/* @__PURE__ */ (0, K.jsxs)(jt, {
						title: "내보내기",
						children: [/* @__PURE__ */ (0, K.jsx)(Mt, {
							icon: "notion",
							disabled: le === "notion",
							onClick: () => Ae("notion"),
							children: le === "notion" ? "내보내는 중" : "Notion으로 내보내기"
						}), /* @__PURE__ */ (0, K.jsx)(Mt, {
							icon: "obsidian",
							disabled: le === "obsidian",
							onClick: () => Ae("obsidian"),
							children: le === "obsidian" ? "내보내는 중" : "Obsidian으로 내보내기"
						})]
					}),
					i.generation?.message && /* @__PURE__ */ (0, K.jsx)("p", {
						className: "react-reader-status",
						children: i.generation.message
					}),
					se && /* @__PURE__ */ (0, K.jsx)("p", {
						className: "react-reader-status",
						children: se
					})
				] }),
				noteIdentity: {
					id: rn("topic", pa(i)),
					noteType: "topic_review",
					title: pa(i) ? `${pa(i)} 리서치 노트` : "딥 리서치 노트",
					topic: pa(i),
					label: pa(i),
					reportKind: "topic_report",
					reportId: pa(i),
					linkedReports: [Ne.title].filter(Boolean)
				},
				noteLinkedTitle: Ne.title,
				noteOverlay: kn(i.personalOverlay, i.canonicalRevision),
				children: [
					/* @__PURE__ */ (0, K.jsx)(ta, { resolution: i.marketStateResolution }),
					/* @__PURE__ */ (0, K.jsx)(Rt, { markdown: Ne.body || i.markdown || "" }),
					/* @__PURE__ */ (0, K.jsx)(ea, { report: i })
				]
			})
		]
	});
	let Ie = D === "plan-loading" || D === "generation" || B || T, Le = D === "recoverable-error" && ee;
	return /* @__PURE__ */ (0, K.jsxs)("div", {
		className: "react-deep-research-route",
		"data-deep-research-route": !0,
		children: [
			/* @__PURE__ */ (0, K.jsx)(sn, {
				eyebrow: "Deep Research",
				title: "딥 리서치",
				description: "투자 질문을 먼저 실행 계획으로 정리한 뒤, 외부 근거와 시장 상태를 구분해 bounded research를 생성합니다.",
				actions: /* @__PURE__ */ (0, K.jsx)("button", {
					className: "filter-btn clear",
					type: "button",
					onClick: () => void Ce(),
					disabled: B,
					children: B ? "불러오는 중" : "다시 읽기"
				})
			}),
			D === "readiness" && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-warning",
				"data-qa": "dr-readiness-loading",
				role: "status",
				children: "저장된 리포트와 자료 상태를 확인하는 중입니다."
			}),
			ie && D === "recoverable-error" && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-error",
				"data-qa": `dr-readiness-${ie}`,
				children: ee
			}),
			Le && /* @__PURE__ */ (0, K.jsxs)("div", {
				className: "react-dashboard-error topicrpt-recoverable-error",
				"data-qa": `dr-error-${te || "request"}`,
				role: "alert",
				children: [
					/* @__PURE__ */ (0, K.jsx)("strong", { children: "다시 시도할 수 있습니다" }),
					/* @__PURE__ */ (0, K.jsx)("span", {
						"data-qa": `dr-error-${(ne || "request").replace(/_/g, "-")}`,
						"data-error-code": ne || "request",
						children: ee
					}),
					/* @__PURE__ */ (0, K.jsx)("p", { children: "입력한 질문과 컨텍스트, 마지막 계획은 유지됩니다." }),
					/* @__PURE__ */ (0, K.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						onClick: () => {
							H(""), U(null), G(""), O(k ? "plan-review" : "draft");
						},
						children: "돌아가서 수정"
					})
				]
			}),
			D !== "plan-review" && D !== "generation" && /* @__PURE__ */ (0, K.jsxs)("form", {
				className: "input-panel topicrpt-form",
				onSubmit: Te,
				noValidate: !0,
				children: [
					/* @__PURE__ */ (0, K.jsxs)("div", {
						className: "input-panel-header",
						children: [
							/* @__PURE__ */ (0, K.jsx)("span", {
								className: "section-kicker",
								children: "QUESTION FIRST"
							}),
							/* @__PURE__ */ (0, K.jsx)("h2", { children: "무엇을 투자 판단으로 확인하고 싶나요?" }),
							/* @__PURE__ */ (0, K.jsx)("p", { children: "질문은 1~500자로 입력하세요. 컨텍스트는 가설로만 전달되며 외부 근거로 승격되지 않습니다." })
						]
					}),
					/* @__PURE__ */ (0, K.jsx)("div", {
						className: "topicrpt-topic-row",
						children: /* @__PURE__ */ (0, K.jsx)("div", {
							className: "topicrpt-preset-btns",
							"aria-label": "리서치 모드",
							children: na.map((e) => /* @__PURE__ */ (0, K.jsx)("span", {
								className: "filter-btn topicrpt-preset active",
								"data-topic": e.key,
								children: e.label
							}, e.key))
						})
					}),
					/* @__PURE__ */ (0, K.jsxs)("label", {
						className: "field topicrpt-question-field",
						children: [
							/* @__PURE__ */ (0, K.jsx)("span", { children: "투자 질문" }),
							/* @__PURE__ */ (0, K.jsx)("textarea", {
								"data-qa": "dr-question",
								value: h,
								onChange: (e) => g(e.currentTarget.value),
								maxLength: 500,
								rows: 4,
								placeholder: "예: 미국 전력 수요 증가가 12개월 내 반도체 공급망과 관련 기업에 어떤 영향을 줄까?",
								required: !0,
								"aria-describedby": "dr-question-help"
							}),
							/* @__PURE__ */ (0, K.jsxs)("small", {
								id: "dr-question-help",
								children: [h.length, "/500"]
							})
						]
					}),
					/* @__PURE__ */ (0, K.jsxs)("label", {
						className: "field topicrpt-context-field",
						children: [/* @__PURE__ */ (0, K.jsxs)("span", { children: ["추가 컨텍스트 ", /* @__PURE__ */ (0, K.jsx)("em", { children: "(선택)" })] }), /* @__PURE__ */ (0, K.jsx)("textarea", {
							"data-qa": "dr-context",
							value: _,
							onChange: (e) => v(e.currentTarget.value),
							maxLength: 4e3,
							rows: 4,
							placeholder: "예: 보유 종목, 관심 지역, 확인할 기간 등. 이 내용은 hypothesis로 표시됩니다."
						})]
					}),
					/* @__PURE__ */ (0, K.jsx)(lt, {
						mode: "deep-research",
						onReference: Fe
					}),
					/* @__PURE__ */ (0, K.jsx)(Zi, {
						selectedRef: C,
						onSelectedRef: w,
						onBusyChange: E,
						onOpenDetail: (e) => {
							window.location.hash = ln(e);
						},
						disabled: D === "plan-loading" || B
					}),
					/* @__PURE__ */ (0, K.jsxs)("div", {
						className: "topicrpt-action-row",
						children: [
							/* @__PURE__ */ (0, K.jsxs)("label", {
								className: "field topicrpt-policy-field",
								children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "Market State 정책" }), /* @__PURE__ */ (0, K.jsxs)("select", {
									value: y,
									onChange: (e) => b(e.currentTarget.value),
									children: [/* @__PURE__ */ (0, K.jsx)("option", {
										value: "include_current",
										children: "현재 상태 포함"
									}), /* @__PURE__ */ (0, K.jsx)("option", {
										value: "exclude",
										children: "제외"
									})]
								})]
							}),
							/* @__PURE__ */ (0, K.jsxs)("label", {
								className: "field topicrpt-policy-field",
								children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "Market State 범위" }), /* @__PURE__ */ (0, K.jsxs)("select", {
									value: x,
									onChange: (e) => S(e.currentTarget.value),
									children: [
										/* @__PURE__ */ (0, K.jsx)("option", {
											value: "AUTO",
											children: "자동"
										}),
										/* @__PURE__ */ (0, K.jsx)("option", {
											value: "GLOBAL",
											children: "글로벌"
										}),
										/* @__PURE__ */ (0, K.jsx)("option", {
											value: "US",
											children: "미국"
										}),
										/* @__PURE__ */ (0, K.jsx)("option", {
											value: "KR",
											children: "한국"
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, K.jsx)("span", {
								className: "topicrpt-policy-note",
								children: "Deep research · 최대 2라운드"
							}),
							/* @__PURE__ */ (0, K.jsx)("button", {
								className: "filter-btn apply",
								type: "submit",
								"data-qa": "dr-preview",
								disabled: Ie,
								children: D === "plan-loading" ? "계획 준비 중" : "계획 미리보기"
							})
						]
					}),
					/* @__PURE__ */ (0, K.jsx)("input", {
						type: "hidden",
						value: be,
						"data-legacy-topic": ye,
						readOnly: !0,
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ (0, K.jsx)("input", {
						type: "hidden",
						value: "true",
						readOnly: !0,
						"aria-hidden": "true"
					})
				]
			}),
			D === "plan-review" && k && /* @__PURE__ */ (0, K.jsx)(Sa, {
				envelope: k,
				executionMode: j,
				cliAdapter: P,
				onExecutionMode: N,
				onCliAdapter: F,
				onContinue: De,
				onEdit: () => {
					O("draft"), ce("");
				},
				degradedConfirming: I,
				onConfirmDegraded: () => void Oe(),
				onCancelDegraded: () => z(!1)
			}),
			D === "generation" && /* @__PURE__ */ (0, K.jsxs)("section", {
				className: "input-panel topicrpt-generation-panel",
				"data-qa": "dr-generation",
				"aria-live": "polite",
				children: [
					/* @__PURE__ */ (0, K.jsx)("span", {
						className: "section-kicker",
						children: "GENERATING"
					}),
					/* @__PURE__ */ (0, K.jsx)("h2", { children: "승인된 계획을 실행하는 중입니다" }),
					/* @__PURE__ */ (0, K.jsx)("p", {
						"data-qa": "dr-generation-status",
						children: se || "작업 상태를 확인하는 중입니다."
					})
				]
			}),
			se && D !== "generation" && D !== "report" && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-warning",
				"data-qa": "dr-status",
				role: "status",
				children: se
			}),
			/* @__PURE__ */ (0, K.jsx)("div", {
				className: "section-head compact analysis-archive-head topicrpt-saved-panel",
				children: /* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("h2", {
					ref: ge,
					className: "section-title",
					tabIndex: -1,
					children: "저장된 리포트"
				}), /* @__PURE__ */ (0, K.jsx)("p", {
					className: "section-subtitle",
					children: "카드를 누르면 원문·근거·개인 레이어를 확인할 수 있습니다."
				})] })
			}),
			/* @__PURE__ */ (0, K.jsx)("div", {
				className: "report-feed",
				children: Me.length ? Me.map((e) => /* @__PURE__ */ (0, K.jsxs)("section", {
					className: "report-feed-group",
					children: [/* @__PURE__ */ (0, K.jsxs)("div", {
						className: "report-feed-group-head",
						children: [/* @__PURE__ */ (0, K.jsx)("span", {
							className: "report-feed-group-name",
							children: e.key
						}), /* @__PURE__ */ (0, K.jsxs)("span", {
							className: "report-feed-group-meta",
							children: [
								e.rows.length,
								"건 · 최근 ",
								ha(e.rows[0]?.generatedAt || e.rows[0]?.date)
							]
						})]
					}), /* @__PURE__ */ (0, K.jsx)("div", {
						className: "report-feed-group-cards",
						children: e.rows.map((e) => {
							let t = le === `delete-${e.id}`;
							return /* @__PURE__ */ (0, K.jsxs)("div", {
								className: "report-feed-card-wrap",
								children: [/* @__PURE__ */ (0, K.jsxs)("button", {
									className: "report-feed-card is-topic",
									type: "button",
									"data-report-id": e.id,
									onClick: () => {
										e.id && (_e.current = e.id, ga(e.id));
									},
									children: [
										/* @__PURE__ */ (0, K.jsx)("span", {
											className: "report-feed-card-meta",
											children: e.mode && /* @__PURE__ */ (0, K.jsx)("span", {
												className: "report-feed-badge",
												children: String(e.mode).toUpperCase()
											})
										}),
										/* @__PURE__ */ (0, K.jsx)("strong", { children: pa(e) }),
										/* @__PURE__ */ (0, K.jsx)("span", {
											className: "report-feed-card-foot",
											children: ha(e.date || e.generatedAt)
										})
									]
								}), /* @__PURE__ */ (0, K.jsx)("button", {
									type: "button",
									className: "report-feed-card-delete",
									disabled: t,
									onClick: () => void ke(e),
									"aria-label": `${pa(e)} 삭제`,
									"data-tooltip": "삭제",
									children: /* @__PURE__ */ (0, K.jsx)("svg", {
										width: "13",
										height: "13",
										viewBox: "0 0 16 16",
										fill: "none",
										stroke: "currentColor",
										strokeWidth: "1.4",
										strokeLinecap: "round",
										strokeLinejoin: "round",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, K.jsx)("path", { d: "M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" })
									})
								})]
							}, e.id || `${pa(e)}-${e.date}`);
						})
					})]
				}, e.key)) : /* @__PURE__ */ (0, K.jsx)("div", {
					className: "report-feed-empty",
					"data-qa": "dr-report-list-empty",
					children: "저장된 딥 리서치가 없습니다. 질문을 입력해 실행 계획을 미리보세요."
				})
			}),
			/* @__PURE__ */ (0, K.jsx)(qe, {
				surface: "deep-research",
				pageSize: 20,
				defaultFilter: "task",
				refreshKey: e
			})
		]
	});
}
//#endregion
//#region src/app/marketMemoryJobResume.ts
var wa = "folio.marketMemory.activeJob.v1", Ta = /^job_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/, Ea = /* @__PURE__ */ new Set([
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
]);
function Da() {
	try {
		return typeof window > "u" ? null : window.localStorage;
	} catch {
		return null;
	}
}
function Oa(e) {
	return typeof e == "string" && Ta.test(e);
}
function ka(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e)) return !1;
	let n = e;
	return n.id === t && Ea.has(n.status);
}
function Aa(e = Da()) {
	try {
		e?.removeItem(wa);
	} catch {}
}
function ja(e = Da()) {
	let t = null;
	try {
		t = e?.getItem("folio.marketMemory.activeJob.v1") ?? null;
	} catch {
		return null;
	}
	return t ? Oa(t) ? t : (Aa(e), null) : null;
}
function Ma(e, t = Da()) {
	if (!Oa(e) || !t) return !1;
	try {
		return t.setItem(wa, e), t.getItem(wa) === e;
	} catch {
		return !1;
	}
}
async function Na(e, t = Da()) {
	let n = ja(t);
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
	return ka(r, n) ? N(r.status) ? {
		kind: "active",
		job: r
	} : (Aa(t), {
		kind: "terminal",
		job: r
	}) : (Aa(t), { kind: "invalid" });
}
//#endregion
//#region src/app/MarketMemoryRoute.tsx
function Pa() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function Fa(e) {
	return e.snapshot?.headline ? e.message || `시장 상태 스냅샷을 저장했습니다: ${e.snapshot.headline}` : e.snapshotId || e.title ? e.message || `시장 상태 스냅샷을 저장했습니다${e.title ? `: ${e.title}` : ""}` : `${e.message || (e.ok ? "시장 내러티브를 정리했습니다." : "시장 내러티브 정리가 완료되었습니다.")}${Number.isFinite(Number(e.savedCount)) ? ` 저장 ${e.savedCount}건` : ""}${e.estimatedInputTokens ? ` · 입력 약 ${e.estimatedInputTokens} tokens` : ""}${e.rawEntryCount === void 0 ? "" : ` · 응답 ${e.rawEntryCount}건 · 제외 ${e.droppedCount || 0}건`}`;
}
function Ia(e) {
	let t = e;
	return !!(t?.id && t.status);
}
async function La() {
	return R("/api/memory/update", { date: Pa() });
}
function Ra() {
	let [e, t] = (0, c.useState)(0), [n, r] = (0, c.useState)(!1), [i, a] = (0, c.useState)(""), [o, s] = (0, c.useState)(""), [l, u] = (0, c.useState)(() => {
		let e = ja();
		return e ? {
			id: e,
			status: "running"
		} : null;
	}), d = (0, c.useRef)(null), f = (0, c.useCallback)((e) => {
		W("market-memory", {
			surface: "market_state",
			viewId: "memory",
			reportKind: "",
			reportId: "",
			marketState: e
		});
	}, []);
	function p(e) {
		if (e.ok === !1) throw Error(e.message || e.status || "시장 메모리 업데이트에 실패했습니다.");
		Aa(), a(`시장 메모리를 업데이트했습니다. ${Fa(e)}`), u(null), t((e) => e + 1);
	}
	(0, c.useEffect)(() => {
		let e = !0;
		return Na((e) => L(`/api/jobs/${encodeURIComponent(e)}`)).then((t) => {
			e && (t.kind === "active" ? (u(t.job), a("이전에 시작한 서버 작업이 계속되고 있습니다. 같은 작업의 상태를 다시 확인할 수 있습니다.")) : t.kind === "terminal" ? (u(null), t.job.status === "done" ? p(t.job.result || {}) : s(t.job.message || t.job.error || "이전 시장 메모리 작업이 종료되었습니다.")) : t.kind === "unavailable" ? (u({
				id: t.id,
				status: "running"
			}), a("저장된 시장 메모리 작업의 상태를 다시 확인해야 합니다.")) : t.kind === "invalid" && (u(null), s("저장된 시장 메모리 작업 정보를 확인할 수 없어 안전하게 제거했습니다.")));
		}), () => {
			e = !1, d.current?.abort();
		};
	}, []);
	async function m(e) {
		d.current?.abort();
		let t = new AbortController();
		d.current = t;
		try {
			p((await tt(e, { signal: t.signal })).result || {});
		} finally {
			d.current === t && (d.current = null);
		}
	}
	async function h() {
		r(!0), s(""), a("AI Agent가 단기 뉴스와 기존 중기 메모리를 업데이트하는 중입니다.");
		try {
			a("시장 메모리와 화면용 시장 상태를 함께 갱신하는 중입니다.");
			let e = await La();
			Ia(e) ? (Ma(e.id), u(e), await m(e)) : p(e);
		} catch (e) {
			e instanceof Xe ? (Ma(e.job.id), u(e.job), a("서버 작업은 계속되고 있습니다. 같은 작업의 상태를 다시 확인할 수 있습니다.")) : e instanceof Ze ? (Aa(), u(null), s(e.message), a("")) : e instanceof DOMException && e.name === "AbortError" || (s(e instanceof Error ? e.message : "시장 메모리 업데이트에 실패했습니다."), a(""));
		} finally {
			r(!1);
		}
	}
	async function g() {
		if (l) {
			r(!0), s(""), a("같은 시장 메모리 작업의 상태를 다시 확인하는 중입니다.");
			try {
				await m(l);
			} catch (e) {
				e instanceof Xe ? (Ma(e.job.id), u(e.job), a("서버 작업은 계속되고 있습니다. 잠시 후 같은 작업을 다시 확인하세요.")) : e instanceof Ze ? (Aa(), u(null), s(e.message), a("")) : e instanceof DOMException && e.name === "AbortError" || (s(e instanceof Error ? e.message : "작업 상태 확인에 실패했습니다."), a(""));
			} finally {
				r(!1);
			}
		}
	}
	return /* @__PURE__ */ (0, K.jsxs)("div", {
		className: "react-market-memory-route",
		"data-market-memory-route": !0,
		children: [
			/* @__PURE__ */ (0, K.jsx)(sn, {
				eyebrow: "Market Memory",
				title: "시장 내러티브",
				description: "단기 뉴스 흐름을 중기 시장 상황으로 압축해 투자 판단의 배경으로 유지합니다."
			}),
			o && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-error",
				children: o
			}),
			i && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-warning",
				children: i
			}),
			l && !n ? /* @__PURE__ */ (0, K.jsxs)("div", {
				className: "react-dashboard-warning market-state-job-resume",
				"data-qa": "market-state-job-still-running",
				role: "status",
				children: [/* @__PURE__ */ (0, K.jsxs)("span", { children: [
					"작업 ",
					l.id,
					" · 서버에서 계속 실행 중"
				] }), /* @__PURE__ */ (0, K.jsx)("button", {
					className: "filter-btn clear",
					type: "button",
					"data-qa": "market-state-job-resume",
					onClick: () => void g(),
					children: "같은 작업 다시 확인"
				})]
			}) : null,
			/* @__PURE__ */ (0, K.jsx)(lt, { mode: "market-memory" }),
			/* @__PURE__ */ (0, K.jsx)("section", {
				className: "market-state-dashboard react-market-memory-dashboard",
				"aria-label": "현재 중기 시장 상황",
				children: /* @__PURE__ */ (0, K.jsx)(Oi, {
					onUpdate: h,
					updating: n,
					updateDisabled: !!l,
					onContext: f
				}, e)
			})
		]
	});
}
//#endregion
//#region src/app/ReactAgentDock.tsx
var za = /* @__PURE__ */ new Set([
	"codex",
	"claude",
	"antigravity"
]), Ba = {
	id: "welcome",
	role: "assistant",
	text: "현재 화면에 대해 물어보세요. 보고서 수정이나 발전 요청은 작업으로 전환해 처리합니다.",
	variant: "welcome",
	createdAt: (/* @__PURE__ */ new Date()).toISOString()
}, Va = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19.503 0H4.496A4.496 4.496 0 000 4.496v15.007A4.496 4.496 0 004.496 24h15.007A4.496 4.496 0 0024 19.503V4.496A4.496 4.496 0 0019.503 0z\" fill=\"#fff\"></path><path d=\"M9.064 3.344a4.578 4.578 0 012.285-.312c1 .115 1.891.54 2.673 1.275.01.01.024.017.037.021a.09.09 0 00.043 0 4.55 4.55 0 013.046.275l.047.022.116.057a4.581 4.581 0 012.188 2.399c.209.51.313 1.041.315 1.595a4.24 4.24 0 01-.134 1.223.123.123 0 00.03.115c.594.607.988 1.33 1.183 2.17.289 1.425-.007 2.71-.887 3.854l-.136.166a4.548 4.548 0 01-2.201 1.388.123.123 0 00-.081.076c-.191.551-.383 1.023-.74 1.494-.9 1.187-2.222 1.846-3.711 1.838-1.187-.006-2.239-.44-3.157-1.302a.107.107 0 00-.105-.024c-.388.125-.78.143-1.204.138a4.441 4.441 0 01-1.945-.466 4.544 4.544 0 01-1.61-1.335c-.152-.202-.303-.392-.414-.617a5.81 5.81 0 01-.37-.961 4.582 4.582 0 01-.014-2.298.124.124 0 00.006-.056.085.085 0 00-.027-.048 4.467 4.467 0 01-1.034-1.651 3.896 3.896 0 01-.251-1.192 5.189 5.189 0 01.141-1.6c.337-1.112.982-1.985 1.933-2.618.212-.141.413-.251.601-.33.215-.089.43-.164.646-.227a.098.098 0 00.065-.066 4.51 4.51 0 01.829-1.615 4.535 4.535 0 011.837-1.388zm3.482 10.565a.637.637 0 000 1.272h3.636a.637.637 0 100-1.272h-3.636zM8.462 9.23a.637.637 0 00-1.106.631l1.272 2.224-1.266 2.136a.636.636 0 101.095.649l1.454-2.455a.636.636 0 00.005-.64L8.462 9.23z\" fill=\"url(#folio-react-codex-gradient)\"></path><defs><linearGradient gradientUnits=\"userSpaceOnUse\" id=\"folio-react-codex-gradient\" x1=\"12\" x2=\"12\" y1=\"3\" y2=\"21\"><stop stop-color=\"#B1A7FF\"></stop><stop offset=\".5\" stop-color=\"#7A9DFF\"></stop><stop offset=\"1\" stop-color=\"#3941FF\"></stop></linearGradient></defs></svg>", Ha = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M9.064 3.344a4.578 4.578 0 012.285-.312c1 .115 1.891.54 2.673 1.275.01.01.024.017.037.021a.09.09 0 00.043 0 4.55 4.55 0 013.046.275l.047.022.116.057a4.581 4.581 0 012.188 2.399c.209.51.313 1.041.315 1.595a4.24 4.24 0 01-.134 1.223.123.123 0 00.03.115c.594.607.988 1.33 1.183 2.17.289 1.425-.007 2.71-.887 3.854l-.136.166a4.548 4.548 0 01-2.201 1.388.123.123 0 00-.081.076c-.191.551-.383 1.023-.74 1.494-.9 1.187-2.222 1.846-3.711 1.838-1.187-.006-2.239-.44-3.157-1.302a.107.107 0 00-.105-.024c-.388.125-.78.143-1.204.138a4.441 4.441 0 01-1.945-.466 4.544 4.544 0 01-1.61-1.335c-.152-.202-.303-.392-.414-.617a5.81 5.81 0 01-.37-.961 4.582 4.582 0 01-.014-2.298.124.124 0 00.006-.056.085.085 0 00-.027-.048 4.467 4.467 0 01-1.034-1.651 3.896 3.896 0 01-.251-1.192 5.189 5.189 0 01.141-1.6c.337-1.112.982-1.985 1.933-2.618.212-.141.413-.251.601-.33.215-.089.43-.164.646-.227a.098.098 0 00.065-.066 4.51 4.51 0 01.829-1.615 4.535 4.535 0 011.837-1.388zm3.482 10.565a.637.637 0 000 1.272h3.636a.637.637 0 100-1.272h-3.636zM8.462 9.23a.637.637 0 00-1.106.631l1.272 2.224-1.266 2.136a.636.636 0 101.095.649l1.454-2.455a.636.636 0 00.005-.64L8.462 9.23z\" fill=\"currentColor\"/></svg>", Ua = "M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z", Wa = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${Ua}" fill="#D97757" fill-rule="nonzero"></path></svg>`, Ga = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${Ua}" fill="currentColor" fill-rule="nonzero"></path></svg>`, Ka = "M21.751 22.607c1.34 1.005 3.35.335 1.508-1.508C17.73 15.74 18.904 1 12.037 1 5.17 1 6.342 15.74.815 21.1c-2.01 2.009.167 2.511 1.507 1.506 5.192-3.517 4.857-9.714 9.715-9.714 4.857 0 4.522 6.197 9.714 9.715z", qa = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${Ka}" fill="url(#folio-react-antigravity-gradient)"></path><defs><linearGradient id="folio-react-antigravity-gradient" x1="5" x2="19" y1="22" y2="2" gradientUnits="userSpaceOnUse"><stop stop-color="#3186FF"></stop><stop offset=".42" stop-color="#34A853"></stop><stop offset=".72" stop-color="#FBBC04"></stop><stop offset="1" stop-color="#EA4335"></stop></linearGradient></defs></svg>`, Ja = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${Ka}" fill="currentColor"></path></svg>`, Ya = "<svg viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M9 3c.4 3.9 3.1 6.6 7 7-3.9.4-6.6 3.1-7 7-.4-3.9-3.1-6.6-7-7 3.9-.4 6.6-3.1 7-7z\"/><path d=\"M17.8 13c.25 2.4 1.85 4 4.2 4.25-2.35.25-3.95 1.85-4.2 4.25-.25-2.4-1.85-4-4.2-4.25 2.35-.25 3.95-1.85 4.2-4.25z\" opacity=\".7\"/></svg>", Xa = {
	codex: {
		label: "Codex",
		color: "#3941ff",
		logo: Va,
		monoLogo: Ha
	},
	claude: {
		label: "Claude",
		color: "#d97757",
		logo: Wa,
		monoLogo: Ga
	},
	antigravity: {
		label: "Antigravity",
		color: "#3186ff",
		logo: qa,
		monoLogo: Ja
	},
	default: {
		label: "Folio Agent",
		color: "#c79a45",
		logo: Ya,
		monoLogo: Ya
	}
};
function Za() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function Qa(e) {
	return (e ? new Date(e) : /* @__PURE__ */ new Date()).toLocaleTimeString("ko-KR", {
		hour: "2-digit",
		minute: "2-digit"
	});
}
function $a(e) {
	return e === "high" ? "높음" : e === "low" ? "낮음" : "중간";
}
function eo(e) {
	return `${Math.max(1, Math.round((Date.now() - e) / 1e3))}초`;
}
var to = [
	"surface",
	"viewId",
	"reportKind",
	"reportId",
	"marketScope",
	"selectedText",
	"visibleSection",
	"portfolioLinked"
];
function no(e) {
	if (!e) return {};
	let t = {};
	for (let n of to) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
	return t;
}
function ro(e) {
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
function io(e) {
	let t = { ...e };
	return delete t.collectionId, delete t.collectionRevision, t;
}
function ao(e, t) {
	return e.ownerSurface === t ? e : {
		ownerSurface: t,
		patch: {}
	};
}
function oo(e, t, n) {
	return {
		ownerSurface: t,
		patch: {
			...ao(e, t).patch,
			...n,
			surface: String(n.surface || t)
		}
	};
}
function so(e, t, n, r = {}) {
	let i = ao(t, n);
	return {
		...no(e),
		...io(i.patch),
		...io(r),
		...ro(e)
	};
}
function co(e) {
	let t = e?.provider && za.has(e.provider) ? e.provider : e?.selectedAdapter || "";
	return e?.adapters?.find((e) => e.id === t) || null;
}
function lo(e) {
	return Xa[e?.provider && za.has(e.provider) ? e.provider : e?.selectedAdapter || ""] || Xa.default;
}
function uo(e) {
	return e?.modelChoices || [];
}
function fo(e) {
	let t = uo(e);
	return t.length ? t.some((t) => t.value === e?.model) ? String(e?.model || "") : t[0].value : "";
}
function po({ surface: e, open: t, onOpen: n, onClose: r }) {
	let [i, a] = (0, c.useState)(null), [o, s] = (0, c.useState)(null), [l, u] = (0, c.useState)([Ba]), [d, f] = (0, c.useState)(""), [p, m] = (0, c.useState)(""), [h, g] = (0, c.useState)("medium"), [_, v] = (0, c.useState)(!1), [y, b] = (0, c.useState)(""), x = (0, c.useRef)(null), S = (0, c.useRef)({
		ownerSurface: e,
		patch: {}
	}), C = (0, c.useRef)(/* @__PURE__ */ new Map());
	(0, c.useEffect)(() => () => {
		for (let e of C.current.values()) e.abort();
		C.current.clear();
	}, []);
	let w = (0, c.useCallback)((e, t = !1) => {
		let n = co(e);
		a(e), m((e) => {
			let r = fo(n);
			return t && uo(n).some((t) => t.value === e) ? e : r;
		});
	}, []), T = (0, c.useCallback)(async (e = !1) => {
		let t = await L(`/api/agent-bridge/settings${e ? "?refresh=true" : ""}`);
		return w(t, !0), t;
	}, [w]), E = (0, c.useCallback)(async (e) => {
		try {
			let t = e?.provider && za.has(e.provider) ? e.provider : "", n = t ? `?adapter=${encodeURIComponent(t)}` : "";
			s(await L(`/api/agent-bridge/preflight${n}`));
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
		return L("/api/agent-bridge/settings").then((t) => {
			e && (w(t), E(t));
		}).catch((t) => {
			e && b(t instanceof Error ? t.message : "Agent 설정을 불러오지 못했습니다.");
		}), () => {
			e = !1;
		};
	}, [w, E]), (0, c.useEffect)(() => {
		x.current && (x.current.scrollTop = x.current.scrollHeight);
	}, [l, t]), (0, c.useEffect)(() => {
		S.current = ao(S.current, e);
	}, [e]), (0, c.useEffect)(() => {
		let e = (e) => {
			let t = e.detail;
			t ? (w(t), E(t)) : T().then((e) => E(e)).catch((e) => b(e instanceof Error ? e.message : "Agent 설정을 불러오지 못했습니다."));
		};
		return window.addEventListener("folio:agent-settings-updated", e), () => window.removeEventListener("folio:agent-settings-updated", e);
	}, [
		w,
		T,
		E
	]);
	let D = co(i), O = lo(i), k = uo(D), A = (0, c.useMemo)(() => ({ "--react-agent-accent": O.color }), [O.color]), j = (o?.checks || []).filter((e) => !e.ok), M = (0, c.useCallback)(async (t, n = {}) => {
		let r = t.trim();
		if (!r || _) return;
		S.current = ao(S.current, e);
		let i = so(window.FolioAgent?.currentContext, S.current, e, n), a = Za(), o = Date.now(), s = new Date(o).toISOString(), c = D?.label || O.label, l = p || D?.model || "model";
		u((e) => [
			...e,
			{
				id: Za(),
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
				runMeta: `${l} · ${$a(h)} · on-request`,
				createdAt: s
			}
		]), f(""), v(!0), b("");
		let d = null;
		try {
			let e = await R("/api/agent/chat", {
				message: r,
				context: i,
				options: {
					model: p,
					effort: h
				}
			});
			d = new AbortController(), Qe(C.current, a, d);
			let t = await tt(e, { signal: d.signal });
			$e(C.current, a, d);
			let n = t.result || {}, s = await Ie(n);
			u((e) => e.map((e) => e.id === a ? {
				...e,
				text: n.reply || t.message || "Agent가 응답을 반환하지 않았습니다.",
				notice: [n.notice, s.notice].filter(Boolean).join(" "),
				proposal: s.proposal,
				proposalStatus: s.proposalStatus,
				pending: !1,
				runState: "done",
				runTitle: `${c} 응답`,
				runMeta: `${l} · ${$a(h)} · ${eo(o)}`
			} : e));
		} catch (e) {
			if (d && $e(C.current, a, d), e instanceof Xe) {
				u((t) => t.map((t) => t.id === a ? {
					...t,
					text: e.message,
					pending: !1,
					runState: "still-running",
					runTitle: `${c} 계속 실행 중`,
					runMeta: `${l} · ${$a(h)} · ${eo(o)}`,
					jobId: e.job.id
				} : t));
				return;
			}
			let t = e instanceof Error ? e.message : "Agent 요청에 실패했습니다.";
			b(t), u((e) => e.map((e) => e.id === a ? {
				...e,
				text: t,
				pending: !1,
				runState: "error",
				runTitle: `${c} 오류`,
				runMeta: `${l} · ${$a(h)}`
			} : e));
		} finally {
			v(!1);
		}
	}, [
		D?.label,
		D?.model,
		_,
		h,
		O.label,
		p,
		e
	]);
	async function N(e, t) {
		let n = new AbortController();
		Qe(C.current, e, n), u((t) => t.map((t) => t.id === e ? {
			...t,
			pending: !0,
			runState: "pending",
			runTitle: "Agent 상태 다시 확인 중"
		} : t));
		try {
			let r = await tt(await L(`/api/jobs/${encodeURIComponent(t)}`, { signal: n.signal }), { signal: n.signal }), i = r.result || {}, a = await Ie(i);
			u((t) => t.map((t) => t.id === e ? {
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
			t instanceof Xe ? u((n) => n.map((n) => n.id === e ? {
				...n,
				text: t.message,
				pending: !1,
				runState: "still-running",
				runTitle: "Agent 계속 실행 중",
				jobId: t.job.id
			} : n)) : t instanceof DOMException && t.name === "AbortError" || u((n) => n.map((n) => n.id === e ? {
				...n,
				text: t instanceof Error ? t.message : "Agent 상태 확인에 실패했습니다.",
				pending: !1,
				runState: "error",
				runTitle: "Agent 오류"
			} : n));
		} finally {
			$e(C.current, e, n);
		}
	}
	(0, c.useEffect)(() => {
		let t = (t) => {
			let { message: n, prompt: r, autoSubmit: i, ...a } = t.detail || {};
			S.current = oo(S.current, e, a);
			let o = String(n || r || "");
			o && (i ? M(o, a) : f(o));
		};
		return window.addEventListener("folio:react-agent-request", t), () => window.removeEventListener("folio:react-agent-request", t);
	}, [M, e]);
	async function P(e) {
		e.preventDefault(), await M(d);
	}
	function F() {
		u([{
			...Ba,
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		}]), f(""), b("");
	}
	async function I(e) {
		if (m(e), !(!D?.id || !e)) try {
			let t = Object.fromEntries((i?.adapters || []).map((e) => [e.id, e.model || ""]));
			t[D.id] = e;
			let n = await R("/api/agent-bridge/settings", {
				provider: D.id,
				models: t
			});
			w(n, !0), window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: n }));
		} catch (e) {
			b(e instanceof Error ? e.message : "모델 설정 저장에 실패했습니다.");
		}
	}
	async function z(e, t, n) {
		try {
			let r = await Ve(t, n);
			u((t) => t.map((t) => t.id === e ? {
				...t,
				proposalStatus: r.status
			} : t)), He(r);
		} catch (e) {
			b(e instanceof Error ? e.message : "제안 처리에 실패했습니다.");
		}
	}
	return t ? /* @__PURE__ */ (0, K.jsxs)("aside", {
		className: "react-agent-dock",
		style: A,
		"aria-label": "AI Agent",
		children: [
			/* @__PURE__ */ (0, K.jsxs)("header", {
				className: "react-agent-dock-header",
				children: [/* @__PURE__ */ (0, K.jsxs)("div", {
					className: "react-agent-dock-title",
					children: [/* @__PURE__ */ (0, K.jsx)("span", {
						className: "react-agent-logo",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, K.jsx)("span", {
							className: "react-agent-logo-mark",
							dangerouslySetInnerHTML: { __html: O.logo }
						})
					}), /* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("p", {
						className: "section-kicker",
						children: "Agent"
					}), /* @__PURE__ */ (0, K.jsx)("h2", { children: D?.label || O.label })] })]
				}), /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "react-agent-header-actions",
					children: [/* @__PURE__ */ (0, K.jsx)("button", {
						className: "react-agent-new-chat",
						type: "button",
						onClick: F,
						children: "새 채팅"
					}), /* @__PURE__ */ (0, K.jsx)("button", {
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
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "react-agent-dock-body",
				ref: x,
				children: [
					/* @__PURE__ */ (0, K.jsx)("div", {
						className: "react-agent-watermark",
						"aria-hidden": "true",
						dangerouslySetInnerHTML: { __html: O.monoLogo }
					}),
					j.length > 0 && /* @__PURE__ */ (0, K.jsxs)("div", {
						className: "react-agent-preflight",
						role: "status",
						children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: "Agent 준비 상태 확인 필요" }), j.slice(0, 3).map((e) => /* @__PURE__ */ (0, K.jsx)("p", { children: e.message }, e.id))]
					}),
					/* @__PURE__ */ (0, K.jsx)("div", {
						className: "react-agent-messages",
						children: l.map((e) => /* @__PURE__ */ (0, K.jsxs)("article", {
							className: `react-agent-message ${e.role}${e.pending ? " pending" : ""}`,
							children: [
								e.role === "assistant" && /* @__PURE__ */ (0, K.jsxs)("div", {
									className: "react-agent-message-head",
									children: [
										/* @__PURE__ */ (0, K.jsx)("span", {
											className: "react-agent-mini-logo",
											"aria-hidden": "true",
											dangerouslySetInnerHTML: { __html: O.logo }
										}),
										/* @__PURE__ */ (0, K.jsx)("strong", { children: D?.label || O.label }),
										/* @__PURE__ */ (0, K.jsx)("time", { children: Qa(e.createdAt) })
									]
								}),
								e.runTitle && /* @__PURE__ */ (0, K.jsx)(de, {
									state: e.runState === "still-running" ? "pending" : e.runState,
									title: e.runTitle,
									meta: e.runMeta
								}),
								e.runState === "still-running" && e.jobId && /* @__PURE__ */ (0, K.jsx)("div", {
									"data-qa": "agent-job-still-running",
									children: /* @__PURE__ */ (0, K.jsx)("button", {
										type: "button",
										"data-qa": "agent-job-resume",
										onClick: () => void N(e.id, e.jobId),
										children: "상태 다시 확인"
									})
								}),
								e.text && /* @__PURE__ */ (0, K.jsx)("div", {
									className: e.variant === "welcome" ? "react-agent-welcome-card" : "",
									children: /* @__PURE__ */ (0, K.jsx)(ue, { text: e.text })
								}),
								e.notice && /* @__PURE__ */ (0, K.jsx)("p", {
									className: "react-agent-notice",
									children: e.notice
								}),
								e.proposal && /* @__PURE__ */ (0, K.jsxs)("div", {
									className: "agent-proposal",
									children: [
										/* @__PURE__ */ (0, K.jsxs)("div", {
											className: "agent-proposal-title",
											children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: e.proposal.artifactKind || "proposal" }), e.proposal.artifactId && /* @__PURE__ */ (0, K.jsx)("span", { children: e.proposal.artifactId })]
										}),
										e.proposalStatus === "pending" && e.proposal.summary && /* @__PURE__ */ (0, K.jsx)("p", {
											"data-qa": "proposal-summary",
											children: Te(e.proposal.summary)
										}),
										e.proposalStatus === "pending" && e.proposal.diff && /* @__PURE__ */ (0, K.jsxs)("details", {
											className: "agent-proposal-diff",
											children: [/* @__PURE__ */ (0, K.jsx)("summary", { children: "diff 보기" }), /* @__PURE__ */ (0, K.jsx)("pre", {
												"data-qa": "proposal-diff",
												children: Ee(e.proposal.diff)
											})]
										}),
										e.proposalStatus === "pending" ? /* @__PURE__ */ (0, K.jsxs)("div", {
											className: "agent-actions",
											children: [/* @__PURE__ */ (0, K.jsx)("button", {
												type: "button",
												"data-qa": "proposal-approve",
												onClick: () => z(e.id, e.proposal.id, "approve"),
												children: "승인"
											}), /* @__PURE__ */ (0, K.jsx)("button", {
												type: "button",
												"data-qa": "proposal-reject",
												onClick: () => z(e.id, e.proposal.id, "reject"),
												children: "거절"
											})]
										}) : /* @__PURE__ */ (0, K.jsxs)("p", {
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
			/* @__PURE__ */ (0, K.jsxs)("form", {
				className: "react-agent-form",
				onSubmit: P,
				children: [
					/* @__PURE__ */ (0, K.jsx)("textarea", {
						"data-qa": "agent-input",
						value: d,
						onChange: (e) => f(e.currentTarget.value),
						onKeyDown: (e) => {
							e.key === "Enter" && !e.shiftKey && (e.preventDefault(), e.currentTarget.form?.requestSubmit());
						},
						rows: 2,
						placeholder: "현재 화면에 대해 물어보세요"
					}),
					/* @__PURE__ */ (0, K.jsxs)("div", {
						className: "react-agent-form-toolbar",
						children: [/* @__PURE__ */ (0, K.jsxs)("div", {
							className: "react-agent-tools",
							children: [/* @__PURE__ */ (0, K.jsx)("select", {
								value: p,
								onChange: (e) => I(e.currentTarget.value),
								"aria-label": "모델 버전",
								children: k.length ? k.map((e) => /* @__PURE__ */ (0, K.jsx)("option", {
									value: e.value,
									children: e.label
								}, e.value)) : /* @__PURE__ */ (0, K.jsx)("option", {
									value: "",
									children: "기본 버전"
								})
							}), /* @__PURE__ */ (0, K.jsxs)("select", {
								value: h,
								onChange: (e) => g(e.currentTarget.value),
								"aria-label": "노력 단계",
								children: [
									/* @__PURE__ */ (0, K.jsx)("option", {
										value: "low",
										children: "노력 낮음"
									}),
									/* @__PURE__ */ (0, K.jsx)("option", {
										value: "medium",
										children: "노력 중간"
									}),
									/* @__PURE__ */ (0, K.jsx)("option", {
										value: "high",
										children: "노력 높음"
									}),
									/* @__PURE__ */ (0, K.jsx)("option", {
										value: "max",
										children: "노력 최대"
									})
								]
							})]
						}), /* @__PURE__ */ (0, K.jsx)("button", {
							type: "submit",
							"data-qa": "agent-submit",
							disabled: _ || !d.trim(),
							children: _ ? "작업 중" : "보내기"
						})]
					}),
					y && /* @__PURE__ */ (0, K.jsx)("p", {
						className: "react-agent-error",
						children: y
					})
				]
			})
		]
	}) : /* @__PURE__ */ (0, K.jsx)("aside", {
		className: "react-agent-dock is-closed",
		style: A,
		"aria-label": "AI Agent 닫힘",
		children: /* @__PURE__ */ (0, K.jsxs)("button", {
			type: "button",
			onClick: n,
			"aria-label": "AI Agent 열기",
			"data-tooltip": "AI Agent 열기",
			"data-tooltip-pos": "left",
			children: [/* @__PURE__ */ (0, K.jsx)("span", {
				className: "react-agent-closed-dot",
				"aria-hidden": "true"
			}), /* @__PURE__ */ (0, K.jsx)("span", { children: "AI" })]
		})
	});
}
//#endregion
//#region src/app/RssRoute.tsx
var mo = {
	start: "",
	end: "",
	source: "",
	market: ""
}, ho = 20, go = [
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
function _o(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function vo(e) {
	let t = e.timestamp || e.date || "";
	if (!t) return "시간 정보 없음";
	let n = new Date(t);
	return Number.isNaN(n.getTime()) ? t : n.toLocaleString("ko-KR");
}
function yo(e) {
	let t = [
		e.start ? `${e.start} 이후` : "",
		e.end ? `${e.end} 이전` : "",
		e.source ? e.source : "",
		e.market ? go.find((t) => t.value === e.market)?.label || e.market : ""
	].filter(Boolean);
	return t.length ? t.join(" · ") : "전체 RSS 피드";
}
function bo(e, t) {
	let n = new URLSearchParams({
		offset: String((Math.max(1, e) - 1) * ho),
		limit: String(ho)
	});
	return t.start && n.set("start", t.start), t.end && n.set("end", t.end), t.source && n.set("source", t.source), t.market && n.set("market", t.market), n;
}
function xo(e) {
	let t = e.markets, n = Array.isArray(t) ? t : typeof t == "string" ? t.split(",") : String(e.market || "").split(","), r = /* @__PURE__ */ new Set();
	return n.map((e) => String(e || "").trim()).filter(Boolean).filter((e) => r.has(e) ? !1 : (r.add(e), !0));
}
async function So(e) {
	let t = e;
	for (; N(t.status);) await _o(1e3), t = await L(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "RSS 수집 작업에 실패했습니다.");
	return t;
}
function Co(e, t) {
	return e.url || `${e.title || "rss"}-${e.timestamp || e.date || t}`;
}
function wo(e) {
	return {
		title: e.title || e.headline || e.path || "검색 결과",
		url: e.url || e.sourceUrl || e.link || "",
		description: e.summary || e.snippet || e.text || e.content || "",
		media: e.media || e.source || e.collector || "",
		source: e.source || e.media || e.collector || "",
		markets: xo({
			markets: e.markets,
			market: String(e.market || "")
		}),
		market: String(e.market || ""),
		timestamp: e.timestamp || e.date || e.publishedAt || e.published || "",
		date: e.date || e.publishedAt || e.published || e.timestamp || ""
	};
}
function To() {
	let [e, t] = (0, c.useState)(null), [n, r] = (0, c.useState)(null), [i, a] = (0, c.useState)(1), [o, s] = (0, c.useState)(mo), [l, u] = (0, c.useState)(mo), [d, f] = (0, c.useState)(""), [p, m] = (0, c.useState)(!1), [h, g] = (0, c.useState)(!1), [_, v] = (0, c.useState)(!1), [y, b] = (0, c.useState)(""), [x, S] = (0, c.useState)(""), C = n?.items || [], w = n?.total ?? C.length, T = Math.max(1, Math.ceil(w / ho)), E = (0, c.useMemo)(() => n?.sources || [], [n?.sources]), D = (0, c.useCallback)(async (e = i, t = o) => {
		m(!0), b("");
		try {
			let n = await L(`/api/rss/items?${bo(e, t).toString()}`);
			r(n), a(e), s(t), u(t), W("rss", {
				surface: "rss",
				viewId: "rssfeed",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			b(e instanceof Error ? e.message : "RSS 피드를 불러오지 못했습니다.");
		} finally {
			m(!1);
		}
	}, [o, i]), O = (0, c.useCallback)(async () => {
		try {
			let e = await L("/api/dashboard"), n = e.index?.newsCount ?? e.index?.count;
			Number.isFinite(Number(n)) && t(Number(n));
		} catch {}
	}, []);
	(0, c.useEffect)(() => {
		D(1, o), O();
	}, []);
	async function k(e) {
		if (e.preventDefault(), l.start && l.end && l.start > l.end) {
			b("시작 시간은 종료 시간보다 앞서야 합니다.");
			return;
		}
		S(""), await D(1, l);
	}
	async function A(e) {
		S(""), await D(1, {
			...o,
			market: e
		});
	}
	async function j() {
		S(""), f(""), u(mo), await D(1, mo);
	}
	async function M(e) {
		e.preventDefault();
		let t = d.trim();
		if (!t) {
			b("검색어를 입력해 주세요.");
			return;
		}
		v(!0), b(""), S("");
		try {
			let e = await L(`/api/search?${new URLSearchParams({
				query: t,
				scope: "news",
				limit: "50"
			}).toString()}`), n = Array.isArray(e) ? e : e.items || [];
			r({
				items: n.map(wo),
				total: n.length,
				offset: 0,
				limit: n.length,
				has_more: !1,
				sources: E
			}), a(1), S(`뉴스 검색 결과 ${n.length}개`), W("rss", {
				surface: "rss",
				viewId: "rssfeed",
				reportKind: "news_search",
				reportId: t
			});
		} catch (e) {
			b(e instanceof Error ? e.message : "뉴스 검색에 실패했습니다.");
		} finally {
			v(!1);
		}
	}
	async function N() {
		g(!0), b(""), S("RSS 수집 작업을 시작했습니다.");
		try {
			let e = await So(await R("/api/rssarchive/import", {})), t = Number.isFinite(Number(e.result?.added)) ? ` 신규 ${e.result?.added}개` : "";
			S(`RSS 수집 완료.${t}`), await D(1, o), await O();
		} catch (e) {
			b(e instanceof Error ? e.message : "RSS 수집에 실패했습니다."), S("");
		} finally {
			g(!1);
		}
	}
	let P = Math.min(Math.max(i, 1), T), F = Math.max(1, P - 2), I = Math.min(T, P + 2);
	return /* @__PURE__ */ (0, K.jsxs)("div", {
		className: "react-rss-route",
		"data-rss-route": !0,
		children: [
			/* @__PURE__ */ (0, K.jsx)(sn, {
				eyebrow: "RSS Feed",
				title: "RSS 피드",
				description: "수집한 기사와 원천 자료를 시간, 출처, 키워드로 빠르게 훑습니다.",
				actions: /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "react-rss-hero-actions",
					children: [
						/* @__PURE__ */ (0, K.jsxs)("span", {
							className: "react-rss-stat-pill",
							children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: "LOADED" }), w > 0 ? `${w}개 · ${P}/${T}` : "0개"]
						}),
						/* @__PURE__ */ (0, K.jsxs)("span", {
							className: "react-rss-stat-pill",
							children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: "INDEXED" }), e === null ? "…" : `${e}개 문서`]
						}),
						/* @__PURE__ */ (0, K.jsx)("button", {
							type: "button",
							onClick: N,
							disabled: h,
							children: h ? "수집 중" : "RSS 수집/가져오기"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, K.jsxs)("section", {
				className: "react-rss-control-panel react-rss-filter-panel",
				"aria-label": "RSS 필터",
				children: [/* @__PURE__ */ (0, K.jsxs)("div", {
					className: "react-rss-panel-head",
					children: [/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("h2", { children: "피드 필터" }), /* @__PURE__ */ (0, K.jsx)("p", { children: "시간 범위와 소스를 선택해 RSS 피드를 필터링합니다. 시간은 UTC+9 기준입니다." })] }), /* @__PURE__ */ (0, K.jsx)("button", {
						className: "react-rss-period-action",
						type: "button",
						onClick: j,
						disabled: p,
						children: "전체 기간"
					})]
				}), /* @__PURE__ */ (0, K.jsxs)("form", {
					className: "react-rss-filter-grid",
					onSubmit: k,
					children: [
						/* @__PURE__ */ (0, K.jsxs)("label", { children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "시작" }), /* @__PURE__ */ (0, K.jsx)("input", {
							type: "datetime-local",
							value: l.start,
							onChange: (e) => u((t) => ({
								...t,
								start: e.currentTarget.value
							}))
						})] }),
						/* @__PURE__ */ (0, K.jsxs)("label", { children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "종료" }), /* @__PURE__ */ (0, K.jsx)("input", {
							type: "datetime-local",
							value: l.end,
							onChange: (e) => u((t) => ({
								...t,
								end: e.currentTarget.value
							}))
						})] }),
						/* @__PURE__ */ (0, K.jsxs)("label", { children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "소스" }), /* @__PURE__ */ (0, K.jsxs)("select", {
							value: l.source,
							onChange: (e) => u((t) => ({
								...t,
								source: e.currentTarget.value
							})),
							children: [/* @__PURE__ */ (0, K.jsx)("option", {
								value: "",
								children: "전체 소스"
							}), E.map((e) => /* @__PURE__ */ (0, K.jsx)("option", {
								value: e,
								children: e
							}, e))]
						})] }),
						/* @__PURE__ */ (0, K.jsxs)("div", {
							className: "react-rss-filter-actions",
							children: [/* @__PURE__ */ (0, K.jsx)("button", {
								className: "react-rss-primary-action",
								type: "submit",
								disabled: p,
								children: "필터 적용"
							}), /* @__PURE__ */ (0, K.jsx)("button", {
								className: "react-rss-secondary-action",
								type: "button",
								onClick: j,
								disabled: p,
								children: "초기화"
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, K.jsxs)("section", {
				className: "react-rss-control-panel react-rss-search-panel",
				"aria-label": "뉴스 검색",
				children: [/* @__PURE__ */ (0, K.jsx)("div", {
					className: "react-rss-panel-head",
					children: /* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("h2", { children: "뉴스 검색" }), /* @__PURE__ */ (0, K.jsx)("p", { children: "기업, 티커, 섹터, 시장 이슈 기준으로 RSS와 수동 저장 기사를 검색합니다." })] })
				}), /* @__PURE__ */ (0, K.jsxs)("form", {
					className: "react-rss-search-form",
					onSubmit: M,
					children: [/* @__PURE__ */ (0, K.jsx)("input", {
						type: "search",
						value: d,
						placeholder: "기업, 티커, 섹터 또는 이슈",
						onChange: (e) => f(e.currentTarget.value)
					}), /* @__PURE__ */ (0, K.jsx)("button", {
						className: "react-rss-primary-action",
						type: "submit",
						disabled: _,
						children: _ ? "검색 중" : "검색"
					})]
				})]
			}),
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "react-rss-summary",
				children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: yo(o) }), /* @__PURE__ */ (0, K.jsx)("span", { children: w > 0 ? `${w}개 · ${P}/${T}` : "0개" })]
			}),
			y && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-error",
				children: y
			}),
			x && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-warning",
				children: x
			}),
			/* @__PURE__ */ (0, K.jsx)("div", {
				className: "report-feed-outside-controls react-rss-market-controls",
				"aria-label": "RSS 표시 옵션",
				children: /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "report-feed-view-row",
					children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "시장" }), /* @__PURE__ */ (0, K.jsx)("label", {
						className: "report-feed-view-pill",
						children: /* @__PURE__ */ (0, K.jsx)("select", {
							"aria-label": "RSS 시장",
							value: o.market,
							onChange: (e) => A(e.currentTarget.value),
							disabled: p,
							children: go.map((e) => /* @__PURE__ */ (0, K.jsx)("option", {
								value: e.value,
								children: e.label
							}, e.value || "all-market"))
						})
					})]
				})
			}),
			/* @__PURE__ */ (0, K.jsx)("section", {
				className: "react-rss-feed",
				"aria-label": "RSS feed items",
				children: C.length ? C.map((e, t) => {
					let n = Co(e, t), r = String(e.description || "").trim(), i = xo(e);
					return /* @__PURE__ */ (0, K.jsxs)("article", {
						className: "react-rss-card",
						children: [/* @__PURE__ */ (0, K.jsxs)("div", {
							className: "react-rss-card-main",
							children: [
								/* @__PURE__ */ (0, K.jsx)("h2", { children: e.url ? /* @__PURE__ */ (0, K.jsx)("a", {
									href: e.url,
									target: "_blank",
									rel: "noopener noreferrer",
									children: e.title || "제목 없음"
								}) : e.title || "제목 없음" }),
								/* @__PURE__ */ (0, K.jsxs)("div", {
									className: "react-rss-card-meta",
									children: [
										(e.media || e.source) && /* @__PURE__ */ (0, K.jsx)("span", {
											className: "pill",
											children: e.media || e.source
										}),
										i.length ? /* @__PURE__ */ (0, K.jsx)("span", {
											className: "pill",
											children: i.join(" · ")
										}) : null,
										/* @__PURE__ */ (0, K.jsx)("span", { children: vo(e) })
									]
								}),
								r && /* @__PURE__ */ (0, K.jsx)("p", { children: r })
							]
						}), /* @__PURE__ */ (0, K.jsx)("div", {
							className: "react-rss-card-actions",
							children: e.url && /* @__PURE__ */ (0, K.jsx)("a", {
								href: e.url,
								target: "_blank",
								rel: "noopener noreferrer",
								children: "기사 열기"
							})
						})]
					}, n);
				}) : /* @__PURE__ */ (0, K.jsxs)("article", {
					className: "react-dashboard-panel",
					children: [/* @__PURE__ */ (0, K.jsx)("h2", { children: p ? "불러오는 중" : "표시할 RSS 피드가 없습니다." }), /* @__PURE__ */ (0, K.jsx)("p", { children: p ? "수집된 항목을 확인하고 있습니다." : "RSS 수집을 실행하거나 필터를 초기화해 보세요." })]
				})
			}),
			T > 1 && /* @__PURE__ */ (0, K.jsxs)("nav", {
				className: "react-rss-pagination",
				"aria-label": "RSS pagination",
				children: [
					/* @__PURE__ */ (0, K.jsx)("button", {
						type: "button",
						disabled: P === 1 || p,
						onClick: () => D(P - 1, o),
						children: "이전"
					}),
					F > 1 && /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [/* @__PURE__ */ (0, K.jsx)("button", {
						type: "button",
						onClick: () => D(1, o),
						children: "1"
					}), F > 2 && /* @__PURE__ */ (0, K.jsx)("span", { children: "..." })] }),
					Array.from({ length: I - F + 1 }, (e, t) => F + t).map((e) => /* @__PURE__ */ (0, K.jsx)("button", {
						type: "button",
						className: e === P ? "active" : "",
						disabled: p,
						onClick: () => D(e, o),
						children: e
					}, e)),
					I < T && /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [I < T - 1 && /* @__PURE__ */ (0, K.jsx)("span", { children: "..." }), /* @__PURE__ */ (0, K.jsx)("button", {
						type: "button",
						onClick: () => D(T, o),
						children: T
					})] }),
					/* @__PURE__ */ (0, K.jsx)("button", {
						type: "button",
						disabled: P === T || p,
						onClick: () => D(P + 1, o),
						children: "다음"
					})
				]
			})
		]
	});
}
//#endregion
//#region src/app/SettingsRoute.tsx
var Eo = [
	"openai",
	"gemini",
	"claude"
], Do = {
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
function Oo(e) {
	return Eo.includes(e) ? e : "openai";
}
function ko(e, t, n, r) {
	return e ? `${r} 저장됨: ${t || "저장됨"}` : n;
}
function Ao(e) {
	return e.bridgeSupported === !1 ? "지원 안 됨" : e.installed ? e.authenticated || e.available ? "사용 가능" : "로그인 필요" : "미설치";
}
function jo(e) {
	return e.bridgeSupported === !1 ? "warn" : e.authenticated || e.available ? "ready" : e.installed ? "warn" : "";
}
function Mo({ checked: e, onChange: t, label: n, ariaLabel: r, compact: i = !1 }) {
	return /* @__PURE__ */ (0, K.jsxs)("label", {
		className: `settings-switch${i ? " settings-switch-compact" : ""}${e ? " is-on" : ""}`,
		children: [
			/* @__PURE__ */ (0, K.jsx)("input", {
				"aria-label": r || n || "설정 전환",
				checked: e,
				onChange: (e) => t(e.currentTarget.checked),
				type: "checkbox"
			}),
			/* @__PURE__ */ (0, K.jsx)("span", {
				className: "settings-switch-track",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, K.jsx)("span", { className: "settings-switch-thumb" })
			}),
			n ? /* @__PURE__ */ (0, K.jsxs)("span", {
				className: "settings-switch-copy",
				children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: n }), /* @__PURE__ */ (0, K.jsx)("small", { children: e ? "ON" : "OFF" })]
			}) : /* @__PURE__ */ (0, K.jsx)("span", {
				className: "settings-switch-state",
				"aria-hidden": "true",
				children: e ? "ON" : "OFF"
			})
		]
	});
}
function No(e) {
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
function Po() {
	let e = Mi(), [t, n] = (0, c.useState)("integrations"), [r, i] = (0, c.useState)(null), [a, o] = (0, c.useState)(null), [s, l] = (0, c.useState)({}), [u, d] = (0, c.useState)({}), [f, p] = (0, c.useState)(null), [m, h] = (0, c.useState)("openai"), [g, _] = (0, c.useState)(""), [v, y] = (0, c.useState)(""), [b, x] = (0, c.useState)(!0), [S, C] = (0, c.useState)("cli"), [w, T] = (0, c.useState)("codex"), [E, D] = (0, c.useState)(""), [O, k] = (0, c.useState)({
		fred: "",
		bok: "",
		dart: ""
	}), [A, j] = (0, c.useState)({
		token: "",
		dbId: ""
	}), [M, N] = (0, c.useState)(""), [P, F] = (0, c.useState)({}), [I, z] = (0, c.useState)(""), [B, V] = (0, c.useState)(""), [ee, H] = (0, c.useState)(""), te = r?.llm?.providers || {}, U = te[m] || {}, ne = Do[m], re = U.modelChoices || [], G = a?.adapters || [], ie = (G.find((e) => e.id === w) || G[0])?.modelChoices || [], ae = (0, c.useCallback)(async (e = !1) => {
		H(""), V("load");
		try {
			let [t, n, r, a] = await Promise.all([
				L(`/api/settings${e ? "?refresh=true" : ""}`),
				L(`/api/agent-bridge/settings${e ? "?refresh=true" : ""}`),
				L("/api/automation/settings"),
				L("/api/obsidian/settings")
			]);
			i(t), x(t.agent?.enabled !== !1), C(t.agent?.mode === "api" ? "api" : "cli");
			let s = Oo(t.llm?.provider);
			h(s);
			let c = t.llm?.providers?.[s] || {}, u = c.modelChoices || [];
			y(u.some((e) => e.value === c.model) ? String(c.model || "") : u[0]?.value || ""), j({
				token: "",
				dbId: t.notion?.dbId || ""
			}), o(n);
			let f = [
				"codex",
				"claude",
				"antigravity"
			].includes(n.provider || "") ? String(n.provider) : String(n.selectedAdapter || n.adapters?.[0]?.id || "codex"), p = n.adapters?.find((e) => e.id === f) || n.adapters?.[0];
			T(f);
			let m = p?.modelChoices || [];
			D(m.some((e) => e.value === p?.model) ? String(p?.model || "") : m[0]?.value || ""), window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: n })), l(No(r)), d(a), N(a.vaultPath || ""), W("settings", {
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
	}, []), oe = (0, c.useCallback)(async () => {
		V("cache"), H("");
		try {
			let e = await L("/api/cache/stats");
			p(e), z("캐시 상태를 불러왔습니다.");
		} catch (e) {
			H(e instanceof Error ? e.message : "캐시 상태를 불러오지 못했습니다.");
		} finally {
			V("");
		}
	}, []);
	async function se() {
		V("cache-cleanup"), H(""), z("오래된 기업 데이터 캐시를 정리하는 중입니다.");
		try {
			let e = await R("/api/cache/cleanup", {}), t = await L("/api/cache/stats");
			p(t), z(`캐시 정리 완료: ${e.deleted || 0}개 삭제, ${e.freed_mb || 0}MB 확보`);
		} catch (e) {
			H(e instanceof Error ? e.message : "캐시 정리에 실패했습니다.");
		} finally {
			V("");
		}
	}
	(0, c.useEffect)(() => {
		ae();
	}, [ae]), (0, c.useEffect)(() => {
		let e = te[m] || {}, t = e.modelChoices || [];
		y((n) => t.some((e) => e.value === n) ? n : t.some((t) => t.value === e.model) ? String(e.model || "") : t[0]?.value || ""), _("");
	}, [m, te]), (0, c.useEffect)(() => {
		let e = G.find((e) => e.id === w) || G[0], t = e?.modelChoices || [];
		D((n) => t.some((e) => e.value === n) ? n : t.some((t) => t.value === e?.model) ? String(e?.model || "") : t[0]?.value || "");
	}, [w, G]);
	async function ce() {
		V("agent"), z("AI Agent 설정을 저장하는 중입니다.");
		try {
			let e = Object.fromEntries(G.map((e) => [e.id, e.model || ""]));
			e[w] = E;
			let [t, n] = await Promise.all([R("/api/agent-bridge/settings", {
				provider: w,
				models: e
			}), R("/api/settings", {
				agent: {
					enabled: b,
					mode: S
				},
				llm: {
					provider: m,
					providers: { [m]: {
						apiKey: g.trim(),
						model: v
					} }
				}
			})]);
			o(t), i(n), _(""), F((e) => {
				let t = { ...e };
				return delete t[m], t;
			}), window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: t })), z(b ? `AI Agent를 ${S === "cli" ? "LLM CLI" : "LLM API"} 모드로 저장했습니다.` : "AI Agent 생성을 비활성화했습니다.");
		} catch (e) {
			H(e instanceof Error ? e.message : "AI Agent 설정 저장에 실패했습니다.");
		} finally {
			V("");
		}
	}
	async function le(e) {
		F((t) => ({
			...t,
			[e]: { checking: !0 }
		}));
		try {
			let t = await R(`/api/settings/llm/test/${encodeURIComponent(e)}`, {});
			F((n) => ({
				...n,
				[e]: t
			}));
		} catch (t) {
			F((n) => ({
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
			let e = await R("/api/settings", {
				fred: { apiKey: O.fred.trim() },
				bok: { apiKey: O.bok.trim() },
				dart: { apiKey: O.dart.trim() }
			});
			i(e), k({
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
			let e = await R("/api/settings", { notion: {
				token: A.token.trim(),
				dbId: A.dbId.trim()
			} });
			i(e), j({
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
			let e = await R("/api/obsidian/settings", { vaultPath: M.trim() });
			d(e), N(e.vaultPath || M), z(e.vaultPath ? "Obsidian 경로를 저장했습니다." : "Vault 경로를 입력하세요.");
		} catch (e) {
			H(e instanceof Error ? e.message : "Obsidian 설정 저장에 실패했습니다.");
		} finally {
			V("");
		}
	}
	async function pe() {
		V("automation"), z("자동화 설정을 저장하는 중입니다.");
		try {
			let e = await R("/api/automation/settings", No(s));
			l(No(e)), z("자동화 설정을 저장했습니다.");
		} catch (e) {
			H(e instanceof Error ? e.message : "자동화 설정 저장에 실패했습니다.");
		} finally {
			V("");
		}
	}
	let me = (0, c.useMemo)(() => Eo.map((e) => {
		let t = te[e] || {}, n = P[e], r = n?.checking;
		return {
			providerId: e,
			row: t,
			label: r ? "확인 중" : n?.available ? "사용 가능" : n ? "확인 실패" : t.hasApiKey ? "확인 필요" : "키 없음",
			className: n?.available ? "ready" : r || n ? "warn" : "",
			detail: n?.message || `${t.model || "모델 미설정"} · ${t.hasApiKey ? "저장된 키가 있습니다." : "API Key를 저장하세요."}`
		};
	}), [P, te]);
	return /* @__PURE__ */ (0, K.jsxs)("div", {
		className: "react-settings-route",
		"data-settings-route": !0,
		children: [
			/* @__PURE__ */ (0, K.jsx)(sn, {
				eyebrow: "Settings",
				title: "설정",
				description: "LLM, 외부 데이터, 내보내기, 자동화 설정을 관리합니다.",
				actions: /* @__PURE__ */ (0, K.jsx)("button", {
					className: "filter-btn clear",
					type: "button",
					onClick: () => ae(!0),
					disabled: B === "load",
					children: B === "load" ? "불러오는 중" : "새로고침"
				})
			}),
			/* @__PURE__ */ (0, K.jsxs)("nav", {
				className: "sub-tabs",
				"aria-label": "설정 하위 탭",
				children: [/* @__PURE__ */ (0, K.jsx)("button", {
					className: t === "integrations" ? "active" : "",
					type: "button",
					onClick: () => n("integrations"),
					children: "연동"
				}), /* @__PURE__ */ (0, K.jsx)("button", {
					className: t === "admin" ? "active" : "",
					type: "button",
					onClick: () => n("admin"),
					children: "관리"
				})]
			}),
			ee && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-error",
				children: ee
			}),
			I && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-warning",
				children: I
			}),
			t === "integrations" ? /* @__PURE__ */ (0, K.jsxs)("div", {
				id: "settings-integrations",
				className: "sub-tab-panel active",
				children: [
					/* @__PURE__ */ (0, K.jsxs)("section", {
						className: "settings-panel input-panel",
						"data-display-settings": !0,
						children: [/* @__PURE__ */ (0, K.jsxs)("div", {
							className: "input-panel-header",
							children: [/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("h3", { children: "화면" }), /* @__PURE__ */ (0, K.jsx)("p", { children: "이 브라우저의 색상 모드를 선택합니다. 시스템 모드는 운영체제 설정 변경을 자동으로 반영합니다." })] }), /* @__PURE__ */ (0, K.jsxs)("span", {
								className: "settings-theme-status",
								"aria-live": "polite",
								children: ["현재 ", e.resolved === "dark" ? "다크" : "라이트"]
							})]
						}), /* @__PURE__ */ (0, K.jsxs)("div", {
							className: "field",
							children: [/* @__PURE__ */ (0, K.jsx)("span", {
								id: "themePreferenceLabel",
								children: "테마"
							}), /* @__PURE__ */ (0, K.jsx)("div", {
								className: "settings-theme-options",
								role: "group",
								"aria-labelledby": "themePreferenceLabel",
								children: [
									["light", "라이트"],
									["dark", "다크"],
									["system", "시스템"]
								].map(([t, n]) => /* @__PURE__ */ (0, K.jsx)("button", {
									type: "button",
									className: e.preference === t ? "active" : "",
									"aria-pressed": e.preference === t,
									onClick: () => e.setPreference(t),
									children: n
								}, t))
							})]
						})]
					}),
					/* @__PURE__ */ (0, K.jsxs)("section", {
						className: "settings-panel input-panel",
						children: [
							/* @__PURE__ */ (0, K.jsx)("div", {
								className: "input-panel-header settings-agent-header",
								children: /* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("h3", { children: "AI Agent 설정" }), /* @__PURE__ */ (0, K.jsx)("p", { children: "보고서와 시장 내러티브 생성에 사용할 Agent 경로를 선택합니다. 비활성화하면 규칙 기반으로 생성합니다." })] })
							}),
							/* @__PURE__ */ (0, K.jsx)("div", {
								className: "settings-grid",
								children: /* @__PURE__ */ (0, K.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "실행 방식" }), /* @__PURE__ */ (0, K.jsxs)("div", {
										className: "settings-agent-mode-row",
										children: [/* @__PURE__ */ (0, K.jsx)(Mo, {
											ariaLabel: "AI Agent 사용",
											checked: b,
											onChange: x,
											compact: !0
										}), /* @__PURE__ */ (0, K.jsxs)("div", {
											className: "settings-segmented",
											"aria-label": "AI Agent 실행 방식",
											"data-mode": S,
											children: [/* @__PURE__ */ (0, K.jsx)("button", {
												className: S === "cli" ? "active" : "",
												type: "button",
												onClick: () => C("cli"),
												children: "LLM CLI"
											}), /* @__PURE__ */ (0, K.jsx)("button", {
												className: S === "api" ? "active" : "",
												type: "button",
												onClick: () => C("api"),
												children: "LLM API"
											})]
										})]
									})]
								})
							}),
							/* @__PURE__ */ (0, K.jsx)("fieldset", {
								className: "settings-agent-controls",
								disabled: !b,
								children: S === "cli" ? /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [/* @__PURE__ */ (0, K.jsxs)("div", {
									className: "settings-grid",
									children: [/* @__PURE__ */ (0, K.jsxs)("label", {
										className: "field",
										children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "사용할 CLI" }), /* @__PURE__ */ (0, K.jsx)("select", {
											value: w,
											onChange: (e) => T(e.currentTarget.value),
											children: (G.length ? G : [
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
											]).map((e) => /* @__PURE__ */ (0, K.jsx)("option", {
												value: e.id,
												children: e.label || e.id
											}, e.id))
										})]
									}), /* @__PURE__ */ (0, K.jsxs)("label", {
										className: "field",
										children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "모델" }), /* @__PURE__ */ (0, K.jsx)("select", {
											value: E,
											onChange: (e) => D(e.currentTarget.value),
											children: ie.length ? ie.map((e) => /* @__PURE__ */ (0, K.jsx)("option", {
												value: e.value,
												children: e.label
											}, e.value)) : /* @__PURE__ */ (0, K.jsx)("option", {
												value: "",
												children: "모델 목록 없음"
											})
										})]
									})]
								}), /* @__PURE__ */ (0, K.jsx)("div", {
									className: "cli-provider-list",
									"aria-live": "polite",
									children: G.map((e) => /* @__PURE__ */ (0, K.jsxs)("div", {
										className: "cli-provider-row",
										children: [/* @__PURE__ */ (0, K.jsxs)("div", {
											className: "cli-provider-main",
											children: [/* @__PURE__ */ (0, K.jsxs)("div", {
												className: "cli-provider-head",
												children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: e.label || e.id }), /* @__PURE__ */ (0, K.jsx)("span", {
													className: `cli-status-chip ${jo(e)}`,
													children: Ao(e)
												})]
											}), /* @__PURE__ */ (0, K.jsx)("div", {
												className: "cli-provider-meta",
												children: e.bridgeSupported === !1 ? e.error || "현재 환경에서 사용할 수 없습니다." : e.model || "모델 미설정"
											})]
										}), e.docsUrl && /* @__PURE__ */ (0, K.jsx)("a", {
											className: "filter-btn",
											href: e.docsUrl,
											target: "_blank",
											rel: "noreferrer",
											children: "문서"
										})]
									}, e.id))
								})] }) : /* @__PURE__ */ (0, K.jsxs)(K.Fragment, { children: [
									/* @__PURE__ */ (0, K.jsxs)("label", {
										className: "field",
										children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "API 제공자" }), /* @__PURE__ */ (0, K.jsxs)("select", {
											value: m,
											onChange: (e) => h(Oo(e.currentTarget.value)),
											children: [
												/* @__PURE__ */ (0, K.jsx)("option", {
													value: "openai",
													children: "GPT / OpenAI"
												}),
												/* @__PURE__ */ (0, K.jsx)("option", {
													value: "gemini",
													children: "Gemini / Google"
												}),
												/* @__PURE__ */ (0, K.jsx)("option", {
													value: "claude",
													children: "Claude / Anthropic"
												})
											]
										})]
									}),
									/* @__PURE__ */ (0, K.jsxs)("div", {
										className: "settings-grid",
										children: [/* @__PURE__ */ (0, K.jsxs)("label", {
											className: "field",
											children: [/* @__PURE__ */ (0, K.jsxs)("span", { children: [ne.name, " API Key"] }), /* @__PURE__ */ (0, K.jsx)("input", {
												value: g,
												onChange: (e) => _(e.currentTarget.value),
												type: "password",
												autoComplete: "off",
												placeholder: U.hasApiKey ? `${U.apiKeyMasked} 저장됨` : ne.key
											})]
										}), /* @__PURE__ */ (0, K.jsxs)("label", {
											className: "field",
											children: [/* @__PURE__ */ (0, K.jsxs)("span", { children: [ne.name, " Model"] }), /* @__PURE__ */ (0, K.jsx)("select", {
												value: v,
												onChange: (e) => y(e.currentTarget.value),
												children: re.length ? re.map((e) => /* @__PURE__ */ (0, K.jsx)("option", {
													value: e.value,
													children: e.label
												}, e.value)) : /* @__PURE__ */ (0, K.jsx)("option", {
													value: "",
													children: "모델 목록 없음"
												})
											})]
										})]
									}),
									/* @__PURE__ */ (0, K.jsx)("div", {
										className: "cli-provider-list",
										"aria-live": "polite",
										children: me.map(({ providerId: e, row: t, label: n, className: r, detail: i }) => /* @__PURE__ */ (0, K.jsxs)("div", {
											className: "cli-provider-row",
											children: [/* @__PURE__ */ (0, K.jsxs)("div", {
												className: "cli-provider-main",
												children: [/* @__PURE__ */ (0, K.jsxs)("div", {
													className: "cli-provider-head",
													children: [/* @__PURE__ */ (0, K.jsx)("strong", { children: t.label || Do[e].name }), /* @__PURE__ */ (0, K.jsx)("span", {
														className: `cli-status-chip ${r}`,
														children: n
													})]
												}), /* @__PURE__ */ (0, K.jsx)("div", {
													className: "cli-provider-meta",
													children: i
												})]
											}), /* @__PURE__ */ (0, K.jsxs)("div", {
												className: "cli-provider-actions",
												children: [/* @__PURE__ */ (0, K.jsx)("button", {
													className: "filter-btn",
													type: "button",
													disabled: !t.hasApiKey || !!P[e]?.checking,
													onClick: () => le(e),
													children: "연결 확인"
												}), t.setupUrl && /* @__PURE__ */ (0, K.jsx)("a", {
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
							/* @__PURE__ */ (0, K.jsxs)("div", {
								className: "filter-actions settings-actions",
								children: [/* @__PURE__ */ (0, K.jsx)("button", {
									className: "filter-btn apply",
									type: "button",
									onClick: ce,
									disabled: B === "agent",
									children: "AI Agent 설정 저장"
								}), /* @__PURE__ */ (0, K.jsx)("button", {
									className: "filter-btn clear",
									type: "button",
									onClick: () => ae(!0),
									disabled: B === "load",
									children: "모델/상태 새로고침"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, K.jsxs)("section", {
						className: "settings-panel input-panel",
						children: [
							/* @__PURE__ */ (0, K.jsxs)("div", {
								className: "input-panel-header",
								children: [/* @__PURE__ */ (0, K.jsx)("h3", { children: "API 연동" }), /* @__PURE__ */ (0, K.jsx)("p", { children: "외부 데이터 API 키를 설정합니다." })]
							}),
							/* @__PURE__ */ (0, K.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, K.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "FRED API Key" }), /* @__PURE__ */ (0, K.jsx)("input", {
										value: O.fred,
										onChange: (e) => k({
											...O,
											fred: e.currentTarget.value
										}),
										type: "password",
										autoComplete: "off",
										placeholder: r?.fred?.hasApiKey ? `${r.fred.apiKeyMasked} 저장됨` : "FRED API 키"
									})]
								}), /* @__PURE__ */ (0, K.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "FRED 상태" }), /* @__PURE__ */ (0, K.jsx)("p", {
										className: "section-subtitle",
										children: ko(r?.fred?.hasApiKey, r?.fred?.apiKeyMasked, "딥 리서치 미국 경제지표용 FRED API 키가 없습니다.", "FRED API 키")
									})]
								})]
							}),
							/* @__PURE__ */ (0, K.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, K.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "BOK API Key" }), /* @__PURE__ */ (0, K.jsx)("input", {
										value: O.bok,
										onChange: (e) => k({
											...O,
											bok: e.currentTarget.value
										}),
										type: "password",
										autoComplete: "off",
										placeholder: r?.bok?.hasApiKey ? `${r.bok.apiKeyMasked} 저장됨` : "BOK ECOS API 키"
									})]
								}), /* @__PURE__ */ (0, K.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "BOK 상태" }), /* @__PURE__ */ (0, K.jsx)("p", {
										className: "section-subtitle",
										children: ko(r?.bok?.hasApiKey, r?.bok?.apiKeyMasked, "딥 리서치 한국 경제지표용 BOK API 키가 없습니다.", "BOK API 키")
									})]
								})]
							}),
							/* @__PURE__ */ (0, K.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, K.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "DART API Key" }), /* @__PURE__ */ (0, K.jsx)("input", {
										value: O.dart,
										onChange: (e) => k({
											...O,
											dart: e.currentTarget.value
										}),
										type: "password",
										autoComplete: "off",
										placeholder: r?.dart?.hasApiKey ? `${r.dart.apiKeyMasked} 저장됨` : "OpenDART API 키"
									})]
								}), /* @__PURE__ */ (0, K.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "DART 상태" }), /* @__PURE__ */ (0, K.jsx)("p", {
										className: "section-subtitle",
										children: ko(r?.dart?.hasApiKey, r?.dart?.apiKeyMasked, "국내 기업 분석용 DART API 키가 없습니다.", "DART API 키")
									})]
								})]
							}),
							/* @__PURE__ */ (0, K.jsx)("div", {
								className: "filter-actions settings-actions",
								children: /* @__PURE__ */ (0, K.jsx)("button", {
									className: "filter-btn apply",
									type: "button",
									onClick: ue,
									disabled: B === "api",
									children: "API 설정 저장"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, K.jsxs)("section", {
						className: "settings-panel input-panel",
						children: [
							/* @__PURE__ */ (0, K.jsxs)("div", {
								className: "input-panel-header",
								children: [/* @__PURE__ */ (0, K.jsx)("h3", { children: "Notion 연동" }), /* @__PURE__ */ (0, K.jsx)("p", { children: "브리핑과 보고서를 Notion 데이터베이스로 내보냅니다." })]
							}),
							/* @__PURE__ */ (0, K.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, K.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "Notion 통합 토큰" }), /* @__PURE__ */ (0, K.jsx)("input", {
										value: A.token,
										onChange: (e) => j({
											...A,
											token: e.currentTarget.value
										}),
										type: "password",
										autoComplete: "off",
										placeholder: r?.notion?.hasToken ? `${r.notion.tokenMasked} 저장됨` : "ntn_..."
									})]
								}), /* @__PURE__ */ (0, K.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "토큰 상태" }), /* @__PURE__ */ (0, K.jsx)("p", {
										className: "section-subtitle",
										children: r?.notion?.hasToken ? `토큰 저장됨: ${r.notion.tokenMasked}` : "Notion 통합 토큰이 없습니다."
									})]
								})]
							}),
							/* @__PURE__ */ (0, K.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, K.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "데이터베이스 ID" }), /* @__PURE__ */ (0, K.jsx)("input", {
										value: A.dbId,
										onChange: (e) => j({
											...A,
											dbId: e.currentTarget.value
										}),
										placeholder: "32자리 Database ID"
									})]
								}), /* @__PURE__ */ (0, K.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "DB 상태" }), /* @__PURE__ */ (0, K.jsx)("p", {
										className: "section-subtitle",
										children: r?.notion?.hasDb ? `DB 저장됨: ${r.notion.dbIdMasked}` : "Notion 데이터베이스 ID가 없습니다."
									})]
								})]
							}),
							/* @__PURE__ */ (0, K.jsx)("div", {
								className: "filter-actions settings-actions",
								children: /* @__PURE__ */ (0, K.jsx)("button", {
									className: "filter-btn apply",
									type: "button",
									onClick: de,
									disabled: B === "notion",
									children: "Notion 설정 저장"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, K.jsxs)("section", {
						className: "settings-panel input-panel",
						children: [
							/* @__PURE__ */ (0, K.jsxs)("div", {
								className: "input-panel-header",
								children: [/* @__PURE__ */ (0, K.jsx)("h3", { children: "Obsidian 연동" }), /* @__PURE__ */ (0, K.jsx)("p", { children: "원하면 Obsidian Vault로 보고서와 노트를 내보낼 수 있습니다." })]
							}),
							/* @__PURE__ */ (0, K.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, K.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "Vault 폴더 경로" }), /* @__PURE__ */ (0, K.jsx)("input", {
										value: M,
										onChange: (e) => N(e.currentTarget.value),
										type: "text",
										placeholder: "C:\\Users\\username\\Documents\\MyVault"
									})]
								}), /* @__PURE__ */ (0, K.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "경로 상태" }), /* @__PURE__ */ (0, K.jsx)("p", {
										className: "section-subtitle",
										children: u.vaultPath ? `설정됨: ${u.vaultPath}` : "Vault 경로가 설정되지 않았습니다."
									})]
								})]
							}),
							/* @__PURE__ */ (0, K.jsx)("div", {
								className: "filter-actions settings-actions",
								children: /* @__PURE__ */ (0, K.jsx)("button", {
									className: "filter-btn apply",
									type: "button",
									onClick: fe,
									disabled: B === "obsidian",
									children: "Obsidian 설정 저장"
								})
							})
						]
					})
				]
			}) : /* @__PURE__ */ (0, K.jsxs)("div", {
				id: "settings-admin",
				className: "sub-tab-panel active",
				children: [/* @__PURE__ */ (0, K.jsxs)("section", {
					className: "settings-panel input-panel",
					children: [
						/* @__PURE__ */ (0, K.jsxs)("div", {
							className: "input-panel-header",
							children: [/* @__PURE__ */ (0, K.jsx)("h3", { children: "자동화" }), /* @__PURE__ */ (0, K.jsx)("p", { children: "수집, 중기 시장 정리, 브리핑 생성을 각각 독립 루틴으로 관리합니다." })]
						}),
						/* @__PURE__ */ (0, K.jsxs)("div", {
							className: "automation-routines",
							children: [
								/* @__PURE__ */ (0, K.jsxs)("section", {
									className: "automation-card",
									children: [
										/* @__PURE__ */ (0, K.jsxs)("div", {
											className: "automation-card-head",
											children: [/* @__PURE__ */ (0, K.jsxs)("div", { children: [
												/* @__PURE__ */ (0, K.jsx)("span", { children: "RSS Collection" }),
												/* @__PURE__ */ (0, K.jsx)("strong", { children: "RSS 수집" }),
												/* @__PURE__ */ (0, K.jsx)("p", { children: "뉴스 피드를 정해진 간격으로 가져와 research inbox와 인덱스에 반영합니다." })
											] }), /* @__PURE__ */ (0, K.jsx)(Mo, {
												ariaLabel: "RSS 자동 수집",
												checked: !!s.rss?.enabled,
												onChange: (e) => l({
													...s,
													rss: {
														...s.rss,
														enabled: e
													}
												}),
												compact: !0
											})]
										}),
										/* @__PURE__ */ (0, K.jsxs)("label", {
											className: "field",
											children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "수집 간격" }), /* @__PURE__ */ (0, K.jsxs)("select", {
												value: String(s.rss?.intervalMinutes || 60),
												onChange: (e) => l({
													...s,
													rss: {
														...s.rss,
														intervalMinutes: e.currentTarget.value
													}
												}),
												children: [
													/* @__PURE__ */ (0, K.jsx)("option", {
														value: "15",
														children: "15분마다"
													}),
													/* @__PURE__ */ (0, K.jsx)("option", {
														value: "30",
														children: "30분마다"
													}),
													/* @__PURE__ */ (0, K.jsx)("option", {
														value: "60",
														children: "1시간마다"
													}),
													/* @__PURE__ */ (0, K.jsx)("option", {
														value: "180",
														children: "3시간마다"
													})
												]
											})]
										}),
										/* @__PURE__ */ (0, K.jsxs)("div", {
											className: "automation-inline-switch",
											children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "기사 전문 저장 (무료 공개 본문만, 로컬 보관용)" }), /* @__PURE__ */ (0, K.jsx)(Mo, {
												ariaLabel: "기사 전문 저장",
												checked: s.rss?.saveFullText !== !1,
												onChange: (e) => l({
													...s,
													rss: {
														...s.rss,
														saveFullText: e
													}
												}),
												compact: !0
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, K.jsxs)("section", {
									className: "automation-card",
									children: [
										/* @__PURE__ */ (0, K.jsxs)("div", {
											className: "automation-card-head",
											children: [/* @__PURE__ */ (0, K.jsxs)("div", { children: [
												/* @__PURE__ */ (0, K.jsx)("span", { children: "Market Memory" }),
												/* @__PURE__ */ (0, K.jsx)("strong", { children: "시장 메모리 업데이트" }),
												/* @__PURE__ */ (0, K.jsx)("p", { children: "최근 RSS와 시장 자료를 중기 시장 판단용 컨텍스트로 정리합니다." })
											] }), /* @__PURE__ */ (0, K.jsx)(Mo, {
												ariaLabel: "Market Memory 자동 정리",
												checked: !!s.marketMemory?.enabled,
												onChange: (e) => l({
													...s,
													marketMemory: {
														...s.marketMemory,
														enabled: e
													}
												}),
												compact: !0
											})]
										}),
										/* @__PURE__ */ (0, K.jsxs)("label", {
											className: "field",
											children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "정리 간격" }), /* @__PURE__ */ (0, K.jsxs)("select", {
												value: String(s.marketMemory?.intervalMinutes || 1440),
												onChange: (e) => l({
													...s,
													marketMemory: {
														...s.marketMemory,
														intervalMinutes: e.currentTarget.value
													}
												}),
												children: [
													/* @__PURE__ */ (0, K.jsx)("option", {
														value: "720",
														children: "12시간마다"
													}),
													/* @__PURE__ */ (0, K.jsx)("option", {
														value: "1440",
														children: "하루마다"
													}),
													/* @__PURE__ */ (0, K.jsx)("option", {
														value: "2880",
														children: "이틀마다"
													}),
													/* @__PURE__ */ (0, K.jsx)("option", {
														value: "10080",
														children: "일주일마다"
													})
												]
											})]
										}),
										/* @__PURE__ */ (0, K.jsxs)("div", {
											className: "automation-inline-switch",
											children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "RSS 수집 직후에도 정리" }), /* @__PURE__ */ (0, K.jsx)(Mo, {
												ariaLabel: "RSS 수집 직후 Market Memory 정리",
												checked: !!s.marketMemory?.runAfterRss,
												onChange: (e) => l({
													...s,
													marketMemory: {
														...s.marketMemory,
														runAfterRss: e
													}
												}),
												compact: !0
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, K.jsxs)("section", {
									className: "automation-card",
									children: [
										/* @__PURE__ */ (0, K.jsxs)("div", {
											className: "automation-card-head",
											children: [/* @__PURE__ */ (0, K.jsxs)("div", { children: [
												/* @__PURE__ */ (0, K.jsx)("span", { children: "Daily Briefing" }),
												/* @__PURE__ */ (0, K.jsx)("strong", { children: "브리핑 생성" }),
												/* @__PURE__ */ (0, K.jsx)("p", { children: "지정한 시각에 RSS와 Market Memory를 반영해 일일 브리핑을 생성합니다." })
											] }), /* @__PURE__ */ (0, K.jsx)(Mo, {
												ariaLabel: "일일 브리핑 자동 생성",
												checked: !!s.briefing?.enabled,
												onChange: (e) => l({
													...s,
													briefing: {
														...s.briefing,
														enabled: e
													}
												}),
												compact: !0
											})]
										}),
										/* @__PURE__ */ (0, K.jsxs)("div", {
											className: "settings-grid compact",
											children: [/* @__PURE__ */ (0, K.jsxs)("label", {
												className: "field",
												children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "브리핑 시각" }), /* @__PURE__ */ (0, K.jsx)("input", {
													value: s.briefing?.time || "08:00",
													onChange: (e) => l({
														...s,
														briefing: {
															...s.briefing,
															time: e.currentTarget.value
														}
													}),
													type: "time"
												})]
											}), /* @__PURE__ */ (0, K.jsxs)("label", {
												className: "field",
												children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "시장 범위" }), /* @__PURE__ */ (0, K.jsxs)("select", {
													value: s.briefing?.marketScope || "both",
													onChange: (e) => l({
														...s,
														briefing: {
															...s.briefing,
															marketScope: e.currentTarget.value
														}
													}),
													children: [
														/* @__PURE__ */ (0, K.jsx)("option", {
															value: "both",
															children: "미국+한국"
														}),
														/* @__PURE__ */ (0, K.jsx)("option", {
															value: "us",
															children: "미국"
														}),
														/* @__PURE__ */ (0, K.jsx)("option", {
															value: "kr",
															children: "한국"
														})
													]
												})]
											})]
										}),
										/* @__PURE__ */ (0, K.jsxs)("div", {
											className: "automation-inline-switch",
											children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "브리핑 전 RSS/Memory 실행" }), /* @__PURE__ */ (0, K.jsx)(Mo, {
												ariaLabel: "브리핑 전 RSS와 Market Memory 실행",
												checked: !!s.briefing?.runPrerequisites,
												onChange: (e) => l({
													...s,
													briefing: {
														...s.briefing,
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
						/* @__PURE__ */ (0, K.jsx)("div", {
							className: "filter-actions settings-actions",
							children: /* @__PURE__ */ (0, K.jsx)("button", {
								className: "filter-btn apply",
								type: "button",
								onClick: pe,
								disabled: B === "automation",
								children: "자동화 저장"
							})
						})
					]
				}), /* @__PURE__ */ (0, K.jsxs)("section", {
					className: "settings-panel input-panel",
					children: [
						/* @__PURE__ */ (0, K.jsxs)("div", {
							className: "input-panel-header",
							children: [/* @__PURE__ */ (0, K.jsxs)("div", { children: [/* @__PURE__ */ (0, K.jsx)("h3", { children: "캐시 관리" }), /* @__PURE__ */ (0, K.jsx)("p", { children: "기업 분석용 SEC/DART per-company 캐시 중 오래된 항목만 정리합니다. 공통 ticker/corpCode 목록은 삭제하지 않습니다." })] }), /* @__PURE__ */ (0, K.jsx)("button", {
								className: "filter-btn clear",
								type: "button",
								onClick: oe,
								disabled: B === "cache",
								children: B === "cache" ? "확인 중" : "상태 확인"
							})]
						}),
						/* @__PURE__ */ (0, K.jsxs)("div", {
							className: "cache-summary",
							children: [/* @__PURE__ */ (0, K.jsxs)("section", { children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "전체 캐시" }), /* @__PURE__ */ (0, K.jsx)("strong", { children: f ? `${f.total_mb || 0} MB` : "상태 미확인" })] }), /* @__PURE__ */ (0, K.jsxs)("section", { children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "정리 대상" }), /* @__PURE__ */ (0, K.jsx)("strong", { children: f ? `${f.stale_mb || 0} MB` : "상태 미확인" })] })]
						}),
						f?.stats?.length ? /* @__PURE__ */ (0, K.jsx)("div", {
							className: "cache-list",
							children: f.stats.map((e) => /* @__PURE__ */ (0, K.jsxs)("div", {
								className: "cache-row",
								children: [
									/* @__PURE__ */ (0, K.jsx)("strong", { children: e.directory }),
									/* @__PURE__ */ (0, K.jsxs)("span", { children: [
										e.files || 0,
										"개 · ",
										e.total_mb || 0,
										"MB"
									] }),
									/* @__PURE__ */ (0, K.jsxs)("small", { children: [
										"오래된 항목 ",
										e.stale_files || 0,
										"개 · 보관 ",
										e.max_age_days || 0,
										"일"
									] })
								]
							}, e.directory || "cache"))
						}) : /* @__PURE__ */ (0, K.jsx)("p", {
							className: "section-subtitle",
							children: "상태 확인을 누르면 캐시 사용량을 확인합니다."
						}),
						/* @__PURE__ */ (0, K.jsx)("div", {
							className: "filter-actions settings-actions",
							children: /* @__PURE__ */ (0, K.jsx)("button", {
								className: "filter-btn apply",
								type: "button",
								onClick: se,
								disabled: B === "cache-cleanup",
								children: B === "cache-cleanup" ? "정리 중" : "오래된 캐시 정리"
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
function Fo(e) {
	let t = /* @__PURE__ */ new Set();
	return e.map((e) => String(e || "").trim()).filter(Boolean).filter((e) => {
		let n = e.toLowerCase();
		return t.has(n) ? !1 : (t.add(n), !0);
	});
}
function Io(e) {
	return e.ticker || e.item || "";
}
function Lo(e) {
	return e.companyName || e.name || e.item || Io(e);
}
function Ro(e, t = "") {
	return e?.company?.name || e?.item || t || "상세 보기";
}
function zo(e) {
	if (!e) return "상세 정보를 불러오는 중입니다.";
	let t = e.company || {};
	return [
		t.ticker || "",
		t.market || "",
		t.tradingViewSymbol || "",
		e.newsCount ? `${e.newsCount}개 뉴스` : ""
	].filter(Boolean).join(" · ") || "확인된 심볼 정보가 없습니다.";
}
function Bo(e = []) {
	return [...e].sort((e, t) => String(t.date || "").localeCompare(String(e.date || "")));
}
function Vo(e) {
	return e.title || e.url || e.path || "자료";
}
function Ho(e) {
	return [e.source, e.date].filter(Boolean).join(" · ");
}
function Uo(e) {
	window.location.hash = e ? `#/watchlist/${encodeURIComponent(e)}` : "#/watchlist";
}
function Wo() {
	let e = window.location.hash.match(/^#\/?watchlist\/(.+)$/);
	return e ? decodeURIComponent(e[1]) : "";
}
function Go() {
	return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "watchlist";
}
function Ko() {
	let { resolved: e } = Mi(), [t, n] = (0, c.useState)([]), [r, i] = (0, c.useState)([]), [a, o] = (0, c.useState)(""), [s, l] = (0, c.useState)(() => Wo()), [u, d] = (0, c.useState)(null), [f, p] = (0, c.useState)(!1), [m, h] = (0, c.useState)(!1), [g, _] = (0, c.useState)(!1), [v, y] = (0, c.useState)(""), [b, x] = (0, c.useState)(""), S = (0, c.useRef)(null), C = (0, c.useCallback)(async (e) => {
		if (!e.length) {
			i([]);
			return;
		}
		let t = await L("/api/watchlist/overview");
		i(Array.isArray(t.items) ? t.items : []);
	}, []), w = (0, c.useCallback)(async () => {
		p(!0), y("");
		try {
			let e = await L("/api/watchlist"), t = Fo(Array.isArray(e) ? e : []);
			n(t), await C(t), W("watchlist", {
				surface: "watchlist",
				viewId: "watchlist",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			y(e instanceof Error ? e.message : "워치리스트를 불러오지 못했습니다.");
		} finally {
			p(!1);
		}
	}, [C]);
	(0, c.useEffect)(() => {
		w();
	}, [w]), (0, c.useEffect)(() => {
		let e = () => {
			Go() && l(Wo());
		};
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []), (0, c.useEffect)(() => {
		let e = !0;
		async function t(t) {
			h(!0), y(""), d({ item: t }), W("watchlist", {
				surface: "watchlist_detail",
				viewId: "watchlist",
				reportKind: "watchlist",
				reportId: t,
				marketScope: ""
			});
			try {
				let n = await L(`/api/watchlist/detail?item=${encodeURIComponent(t)}&limit=12`);
				if (!e) return;
				d(n);
			} catch (t) {
				if (!e) return;
				y(t instanceof Error ? t.message : "상세 정보를 불러오지 못했습니다.");
			} finally {
				e && h(!1);
			}
		}
		return s ? t(s) : (d(null), W("watchlist", {
			surface: "watchlist",
			viewId: "watchlist",
			reportKind: "",
			reportId: ""
		})), () => {
			e = !1;
		};
	}, [s]), (0, c.useEffect)(() => {
		let e = S.current;
		if (!(!e || !u || m)) return window.FolioTradingViewWidgets?.cleanup?.(e), e.innerHTML = "<div class=\"tradingview-widget-unavailable\">TradingView 위젯을 준비하는 중입니다.</div>", window.FolioTradingViewWidgets?.renderWatchlistDetail?.(e, u), () => {
			window.FolioTradingViewWidgets?.cleanup?.(e);
		};
	}, [
		u,
		m,
		e
	]);
	async function T(e, t) {
		_(!0), y("");
		try {
			let r = await R("/api/watchlist", { items: e }), i = Fo(Array.isArray(r) ? r : []);
			n(i), await C(i), t && x(t);
		} catch (e) {
			y(e instanceof Error ? e.message : "워치리스트 저장에 실패했습니다.");
		} finally {
			_(!1);
		}
	}
	async function E(e) {
		try {
			return (await L(`/api/watchlist/resolve?keyword=${encodeURIComponent(e)}`)).keyword || e;
		} catch {
			return e;
		}
	}
	async function D() {
		let e = a.split(/[,;\n]/).map((e) => e.trim()).filter(Boolean);
		if (!e.length) return;
		let n = [...t];
		for (let t of e) {
			let e = await E(t);
			e && !n.some((t) => t.toLowerCase() === e.toLowerCase()) && n.push(e);
		}
		o(""), n.length !== t.length && await T(n, "워치리스트에 추가했습니다.");
	}
	async function O(e) {
		await T(t.filter((t) => t !== e), "워치리스트에서 삭제했습니다."), s === e && Uo();
	}
	let k = (0, c.useMemo)(() => Bo(u?.news || []), [u]), A = Ro(u, s);
	return s ? /* @__PURE__ */ (0, K.jsx)("div", {
		className: "react-watchlist-route",
		"data-watchlist-route": !0,
		children: /* @__PURE__ */ (0, K.jsxs)("div", {
			className: "watchlist-detail-inline",
			children: [/* @__PURE__ */ (0, K.jsxs)("nav", {
				className: "reader-breadcrumb",
				"aria-label": "현재 위치",
				children: [
					/* @__PURE__ */ (0, K.jsx)("button", {
						type: "button",
						className: "reader-crumb-link",
						onClick: () => Uo(),
						children: "워치리스트"
					}),
					/* @__PURE__ */ (0, K.jsx)("span", {
						className: "reader-breadcrumb-sep",
						"aria-hidden": "true",
						children: "›"
					}),
					/* @__PURE__ */ (0, K.jsx)("span", {
						className: "reader-breadcrumb-leaf",
						children: A
					})
				]
			}), /* @__PURE__ */ (0, K.jsxs)("section", {
				className: "watchlist-detail-dialog",
				role: "region",
				"aria-labelledby": "watchlistDetailTitle",
				children: [
					/* @__PURE__ */ (0, K.jsxs)("div", {
						className: "watchlist-detail-head",
						children: [/* @__PURE__ */ (0, K.jsxs)("div", { children: [
							/* @__PURE__ */ (0, K.jsx)("p", {
								className: "section-kicker",
								children: "WATCHLIST"
							}),
							/* @__PURE__ */ (0, K.jsx)("h2", {
								id: "watchlistDetailTitle",
								children: A
							}),
							/* @__PURE__ */ (0, K.jsx)("p", {
								className: "section-subtitle",
								children: zo(u)
							})
						] }), /* @__PURE__ */ (0, K.jsxs)("div", {
							className: "watchlist-detail-actions",
							children: [/* @__PURE__ */ (0, K.jsx)("button", {
								type: "button",
								className: "filter-btn clear",
								onClick: () => ae({
									surface: "watchlist_detail",
									reportKind: "watchlist",
									reportId: s
								}),
								children: "Agent에게 묻기"
							}), /* @__PURE__ */ (0, K.jsx)("button", {
								className: "icon-btn",
								type: "button",
								"aria-label": "닫기",
								"data-tooltip": "닫기",
								"data-tooltip-pos": "left",
								onClick: () => Uo(),
								children: "×"
							})]
						})]
					}),
					v && /* @__PURE__ */ (0, K.jsx)("p", {
						className: "react-dashboard-error",
						children: v
					}),
					/* @__PURE__ */ (0, K.jsx)("div", {
						ref: S,
						className: "watchlist-detail-widgets",
						children: /* @__PURE__ */ (0, K.jsx)("div", {
							className: "tradingview-widget-unavailable",
							children: "TradingView 위젯을 준비하는 중입니다."
						})
					}),
					/* @__PURE__ */ (0, K.jsxs)("div", {
						className: "watchlist-detail-news",
						children: [/* @__PURE__ */ (0, K.jsx)("h3", { children: "수집한 뉴스" }), m ? /* @__PURE__ */ (0, K.jsx)("p", {
							className: "section-subtitle",
							children: "관련 뉴스를 불러오는 중입니다."
						}) : k.length ? /* @__PURE__ */ (0, K.jsx)("div", {
							className: "watchlist-detail-news-list",
							children: k.map((e, t) => /* @__PURE__ */ (0, K.jsxs)("article", {
								className: "compact-item",
								children: [
									/* @__PURE__ */ (0, K.jsx)("div", {
										className: "meta",
										children: Ho(e)
									}),
									/* @__PURE__ */ (0, K.jsx)("h4", { children: e.url ? /* @__PURE__ */ (0, K.jsx)("a", {
										href: e.url,
										target: "_blank",
										rel: "noopener noreferrer",
										children: Vo(e)
									}) : /* @__PURE__ */ (0, K.jsx)("span", { children: Vo(e) }) }),
									e.snippet && /* @__PURE__ */ (0, K.jsx)("p", { children: e.snippet })
								]
							}, `${Vo(e)}-${t}`))
						}) : /* @__PURE__ */ (0, K.jsx)("p", {
							className: "section-subtitle",
							children: "수집된 관련 뉴스가 없습니다."
						})]
					})
				]
			})]
		})
	}) : /* @__PURE__ */ (0, K.jsxs)("div", {
		className: "react-watchlist-route",
		"data-watchlist-route": !0,
		children: [
			/* @__PURE__ */ (0, K.jsx)(sn, {
				eyebrow: "Watchlist",
				title: "워치리스트",
				description: "관심 기업, 섹터, 테마를 추적하고 관련 뉴스와 시장 반응을 확인합니다.",
				actions: /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "brief-controls",
					children: [/* @__PURE__ */ (0, K.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						onClick: w,
						disabled: f,
						children: f ? "불러오는 중" : "다시 읽기"
					}), /* @__PURE__ */ (0, K.jsx)("button", {
						className: "filter-btn apply",
						type: "button",
						onClick: () => T(t, "워치리스트를 저장했습니다."),
						disabled: g,
						children: g ? "저장 중" : "저장"
					})]
				})
			}),
			/* @__PURE__ */ (0, K.jsxs)("div", {
				className: "watchlist-editor input-panel",
				children: [
					/* @__PURE__ */ (0, K.jsxs)("div", {
						className: "input-panel-header",
						children: [/* @__PURE__ */ (0, K.jsx)("h3", { children: "키워드 추가" }), /* @__PURE__ */ (0, K.jsx)("p", { children: "관심 기업, 섹터, 테마를 하나씩 추가해 뉴스와 브리핑 추적 범위를 관리합니다." })]
					}),
					/* @__PURE__ */ (0, K.jsx)("input", {
						value: a,
						onChange: (e) => o(e.currentTarget.value),
						onKeyDown: (e) => {
							e.key === "Enter" && (e.preventDefault(), D());
						},
						placeholder: "예: NVDA, 삼성전자, AI"
					}),
					/* @__PURE__ */ (0, K.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						onClick: D,
						disabled: g,
						children: "추가"
					})
				]
			}),
			v && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-error",
				children: v
			}),
			b && /* @__PURE__ */ (0, K.jsx)("p", {
				className: "react-dashboard-warning",
				children: b
			}),
			/* @__PURE__ */ (0, K.jsx)("div", {
				className: "watchlist-grid",
				children: r.length ? r.map((e) => {
					let t = e.item || Lo(e);
					return /* @__PURE__ */ (0, K.jsxs)("article", {
						className: "watchlist-card",
						"data-watchlist-detail-item": t,
						tabIndex: 0,
						role: "button",
						"aria-label": `${t} 상세 보기`,
						onClick: () => Uo(t),
						onKeyDown: (e) => {
							(e.key === "Enter" || e.key === " ") && (e.preventDefault(), Uo(t));
						},
						children: [
							/* @__PURE__ */ (0, K.jsx)("span", {
								className: "watchlist-card-accent",
								"aria-hidden": "true"
							}),
							/* @__PURE__ */ (0, K.jsx)("button", {
								className: "watchlist-card-delete",
								type: "button",
								"aria-label": `${t} 워치리스트에서 삭제`,
								"data-tooltip": "삭제",
								onClick: (e) => {
									e.stopPropagation(), O(t);
								},
								children: /* @__PURE__ */ (0, K.jsx)("svg", {
									width: "13",
									height: "13",
									viewBox: "0 0 16 16",
									fill: "none",
									stroke: "currentColor",
									strokeWidth: "1.4",
									strokeLinecap: "round",
									strokeLinejoin: "round",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, K.jsx)("path", { d: "M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" })
								})
							}),
							/* @__PURE__ */ (0, K.jsxs)("div", {
								className: "watchlist-card-top",
								children: [/* @__PURE__ */ (0, K.jsx)("strong", {
									className: "watchlist-ticker",
									children: Io(e)
								}), /* @__PURE__ */ (0, K.jsx)("h3", { children: Lo(e) })]
							}),
							/* @__PURE__ */ (0, K.jsxs)("div", {
								className: "watchlist-card-meta",
								children: [e.tags?.length ? /* @__PURE__ */ (0, K.jsx)("div", {
									className: "tags",
									children: e.tags.slice(0, 5).map((e) => /* @__PURE__ */ (0, K.jsx)("span", {
										className: "tag",
										children: e
									}, e))
								}) : null, /* @__PURE__ */ (0, K.jsxs)("span", {
									className: "watchlist-news-count",
									children: [e.count || 0, "건"]
								})]
							})
						]
					}, t);
				}) : /* @__PURE__ */ (0, K.jsx)("div", {
					className: "result",
					children: /* @__PURE__ */ (0, K.jsx)("p", { children: "워치리스트 항목을 저장하면 항목별 최신 뉴스 카드가 표시됩니다." })
				})
			})
		]
	});
}
//#endregion
//#region src/app/statusStore.ts
var qo = {
	statusText: "",
	docCount: "",
	activeJobId: null
};
function Jo() {
	return qo;
}
function Yo() {
	let [e, t] = (0, c.useState)(() => Jo());
	return (0, c.useEffect)(() => {
		let e = () => t(Jo());
		e();
		let n = window.setInterval(e, 1e3);
		return () => window.clearInterval(n);
	}, []), e;
}
//#endregion
//#region src/app/AppShell.tsx
var Xo = [
	{
		id: "home",
		title: "홈",
		routes: [
			"home",
			"dashboard",
			"watchlist"
		]
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
], Zo = {
	home: /* @__PURE__ */ (0, K.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, K.jsx)("path", { d: "M3 10.5 12 3l9 7.5" }), /* @__PURE__ */ (0, K.jsx)("path", { d: "M5 9.5V21h5v-6h4v6h5V9.5" })]
	}),
	dashboard: /* @__PURE__ */ (0, K.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, K.jsx)("rect", {
				x: "3",
				y: "3",
				width: "7",
				height: "8",
				rx: "1.5"
			}),
			/* @__PURE__ */ (0, K.jsx)("rect", {
				x: "14",
				y: "3",
				width: "7",
				height: "5",
				rx: "1.5"
			}),
			/* @__PURE__ */ (0, K.jsx)("rect", {
				x: "14",
				y: "12",
				width: "7",
				height: "9",
				rx: "1.5"
			}),
			/* @__PURE__ */ (0, K.jsx)("rect", {
				x: "3",
				y: "15",
				width: "7",
				height: "6",
				rx: "1.5"
			})
		]
	}),
	briefing: /* @__PURE__ */ (0, K.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, K.jsx)("path", { d: "M4 5h12.5v14H5.5A1.5 1.5 0 0 1 4 17.5z" }),
			/* @__PURE__ */ (0, K.jsx)("path", { d: "M16.5 8H20v9a2 2 0 0 1-2 2h-1.5" }),
			/* @__PURE__ */ (0, K.jsx)("path", { d: "M7.5 9h6" }),
			/* @__PURE__ */ (0, K.jsx)("path", { d: "M7.5 13h6" }),
			/* @__PURE__ */ (0, K.jsx)("path", { d: "M7.5 16.5h3.5" })
		]
	}),
	rss: /* @__PURE__ */ (0, K.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, K.jsx)("path", {
				fill: "currentColor",
				stroke: "none",
				d: "M8 8H6v7c0 1.1.9 2 2 2h9v-2H8V8z"
			}),
			/* @__PURE__ */ (0, K.jsx)("path", {
				fill: "currentColor",
				stroke: "none",
				d: "M20 3h-8c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 8h-8V7h8v4z"
			}),
			/* @__PURE__ */ (0, K.jsx)("path", {
				fill: "currentColor",
				stroke: "none",
				d: "M4 12H2v7c0 1.1.9 2 2 2h9v-2H4v-7z"
			})
		]
	}),
	"market-memory": /* @__PURE__ */ (0, K.jsx)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, K.jsx)("path", { d: "M22 12h-4l-3 8-6-16-3 8H2" })
	}),
	analysis: /* @__PURE__ */ (0, K.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, K.jsx)("path", { d: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" }),
			/* @__PURE__ */ (0, K.jsx)("path", { d: "M14 3v6h6" }),
			/* @__PURE__ */ (0, K.jsx)("path", { d: "M8 17v-3" }),
			/* @__PURE__ */ (0, K.jsx)("path", { d: "M12 17v-6" }),
			/* @__PURE__ */ (0, K.jsx)("path", { d: "M16 17v-4" })
		]
	}),
	"deep-research": /* @__PURE__ */ (0, K.jsx)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, K.jsx)("path", { d: "M14 11H8m2 4H8m8-8H8m12 3.5V6.8c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311C17.72 2 16.88 2 15.2 2H8.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C4 4.28 4 5.12 4 6.8v10.4c0 1.68 0 2.52.327 3.162a3 3 0 0 0 1.311 1.311C6.28 22 7.12 22 8.8 22h2.7M22 22l-1.5-1.5m1-2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0" })
	}),
	watchlist: /* @__PURE__ */ (0, K.jsx)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, K.jsx)("path", { d: "M12 13V7m-3 3h6m4 11V7.8c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311C16.72 3 15.88 3 14.2 3H9.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C5 5.28 5 6.12 5 7.8V21l7-4z" })
	}),
	settings: /* @__PURE__ */ (0, K.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, K.jsx)("path", { d: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" }), /* @__PURE__ */ (0, K.jsx)("path", { d: "M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06A2 2 0 1 1 7.22 3.43l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.34.4.7.6 1a1.7 1.7 0 0 0 1.1.4H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.1.4c-.17.14-.31.28-.41.2Z" })]
	})
};
function Qo() {
	let e = window.location.hash || sr("home");
	return /^#\/?office(?:\/|$)/.test(e) ? (window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#/home`), sr("home")) : e;
}
function $o() {
	let [e, t] = (0, c.useState)(() => Qo());
	return (0, c.useEffect)(() => {
		let e = () => t(Qo());
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []), {
		hash: e,
		routeId: or(e)
	};
}
async function es(e) {
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
function ts() {
	let { hash: e, routeId: t } = $o(), n = cr(t), r = Yo(), [i, a] = (0, c.useState)(() => localStorage.getItem("folio.react.navCollapsed") === "1"), [o, s] = (0, c.useState)(() => {
		let e = localStorage.getItem("folio.react.agentClosed");
		return e === null ? !window.matchMedia("(max-width: 1024px)").matches : e !== "1";
	}), [l, u] = (0, c.useState)(() => /* @__PURE__ */ new Set([t])), [d, f] = (0, c.useState)(() => ({ [t]: Qo() })), [p, m] = (0, c.useState)(""), [h, g] = (0, c.useState)(!1), _ = (0, c.useRef)(null), v = (0, c.useRef)(t), y = (0, c.useRef)(!1), b = (0, c.useRef)({}), x = n.id !== "home", S = x && o ? " is-agent-open" : " is-agent-closed";
	(0, c.useEffect)(() => {
		ie(n.id, {
			surface: `react_${n.id}`,
			viewId: n.id
		});
	}, [n.id]), (0, c.useEffect)(() => {
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
		if (!y.current) {
			y.current = !0, v.current = t;
			return;
		}
		let e = _.current, n = v.current;
		e && (b.current[n] = e.scrollTop, window.requestAnimationFrame(() => {
			e.scrollTop = b.current[t] || 0, e.focus({ preventScroll: !0 });
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
			m("서버 재시작 중"), await es(m), g(!1);
		}
	}
	function w(e) {
		let t = d[e] || sr(e);
		window.location.hash !== t && (window.location.hash = t);
	}
	function T(e) {
		let t = cr(e);
		return t.id === "home" ? /* @__PURE__ */ (0, K.jsx)(kt, {}) : t.id === "dashboard" ? /* @__PURE__ */ (0, K.jsx)(Bi, {}) : t.id === "briefing" ? /* @__PURE__ */ (0, K.jsx)(nr, {}) : t.id === "rss" ? /* @__PURE__ */ (0, K.jsx)(To, {}) : t.id === "market-memory" ? /* @__PURE__ */ (0, K.jsx)(Ra, {}) : t.id === "analysis" ? /* @__PURE__ */ (0, K.jsx)(ii, {}) : t.id === "deep-research" ? /* @__PURE__ */ (0, K.jsx)(Ca, {}) : t.id === "watchlist" ? /* @__PURE__ */ (0, K.jsx)(Ko, {}) : t.id === "settings" ? /* @__PURE__ */ (0, K.jsx)(Po, {}) : null;
	}
	return /* @__PURE__ */ (0, K.jsxs)("div", {
		className: `react-shell${i ? " is-nav-collapsed" : ""}${S}${x ? "" : " is-agent-suppressed"}`,
		children: [
			/* @__PURE__ */ (0, K.jsx)("a", {
				className: "react-skip-link",
				href: "#folio-main-content",
				onClick: () => window.requestAnimationFrame(() => _.current?.focus({ preventScroll: !0 })),
				children: "본문으로 건너뛰기"
			}),
			/* @__PURE__ */ (0, K.jsxs)("header", {
				className: "react-shell-topbar",
				children: [/* @__PURE__ */ (0, K.jsxs)("button", {
					type: "button",
					className: "react-shell-brand",
					onClick: () => {
						w("home");
					},
					"aria-label": "홈으로 이동",
					children: [/* @__PURE__ */ (0, K.jsx)("span", { children: "Folio OS" }), /* @__PURE__ */ (0, K.jsx)("small", { children: "Investment Workspace" })]
				}), /* @__PURE__ */ (0, K.jsxs)("div", {
					className: "react-shell-status",
					"aria-live": "polite",
					children: [
						/* @__PURE__ */ (0, K.jsx)("span", { children: p || r.statusText || "준비됨" }),
						r.activeJobId && /* @__PURE__ */ (0, K.jsx)("span", { children: r.activeJobId }),
						/* @__PURE__ */ (0, K.jsx)("button", {
							type: "button",
							onClick: C,
							disabled: h,
							children: h ? "재시작 중" : "재시작"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, K.jsxs)("aside", {
				className: "react-shell-nav",
				"aria-label": "주요 화면 탐색",
				children: [/* @__PURE__ */ (0, K.jsx)("button", {
					className: "react-shell-nav-toggle",
					type: "button",
					"aria-label": i ? "좌측 사이드바 펼치기" : "좌측 사이드바 접기",
					"aria-expanded": !i,
					onClick: () => a((e) => !e),
					children: /* @__PURE__ */ (0, K.jsx)("svg", {
						viewBox: "0 0 16 16",
						fill: "none",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, K.jsx)("path", { d: "M10 3.5 L5.5 8 L10 12.5" })
					})
				}), /* @__PURE__ */ (0, K.jsxs)("nav", {
					className: "react-left-nav",
					"aria-label": "Folio OS 화면",
					children: [/* @__PURE__ */ (0, K.jsx)("div", {
						className: "react-left-nav-title",
						children: "Navigate"
					}), Xo.map((e) => /* @__PURE__ */ (0, K.jsxs)("section", {
						className: "react-left-nav-group",
						"data-nav-group": e.id,
						children: [/* @__PURE__ */ (0, K.jsx)("h3", { children: e.title }), /* @__PURE__ */ (0, K.jsx)("div", {
							className: "react-left-nav-items",
							children: e.routes.map((t) => {
								let r = ir.find((e) => e.id === t);
								return r ? /* @__PURE__ */ (0, K.jsxs)("span", {
									className: "react-left-nav-entry",
									children: [e.id === "home" && r.id === "dashboard" && /* @__PURE__ */ (0, K.jsx)("span", {
										className: "react-left-nav-separator",
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, K.jsxs)("button", {
										type: "button",
										"data-tooltip": r.label,
										"data-qa": r.id === "deep-research" ? "nav-deep-research" : void 0,
										className: `react-left-nav-item${r.id === n.id ? " active" : ""}`,
										onClick: () => {
											w(r.id);
										},
										children: [/* @__PURE__ */ (0, K.jsx)("span", {
											className: "react-left-nav-icon",
											"aria-hidden": "true",
											children: Zo[r.id]
										}), /* @__PURE__ */ (0, K.jsx)("span", {
											className: "react-left-nav-label",
											children: r.label
										})]
									})]
								}, r.id) : null;
							})
						})]
					}, e.id))]
				})]
			}),
			/* @__PURE__ */ (0, K.jsx)("main", {
				className: "react-shell-main",
				id: "folio-main-content",
				children: /* @__PURE__ */ (0, K.jsx)("section", {
					className: "react-route-host",
					"data-route": n.id,
					ref: _,
					tabIndex: -1,
					children: rr.filter((e) => l.has(e.id)).map((e) => /* @__PURE__ */ (0, K.jsx)("div", {
						className: "react-route-pane",
						"data-route-pane": e.id,
						hidden: e.id !== n.id,
						children: T(e.id)
					}, e.id))
				})
			}),
			x && /* @__PURE__ */ (0, K.jsx)(po, {
				surface: `react_${n.id}`,
				open: o,
				onOpen: () => s(!0),
				onClose: () => s(!1)
			}),
			/* @__PURE__ */ (0, K.jsx)(fr, {})
		]
	});
}
//#endregion
//#region src/app/App.tsx
function ns() {
	return /* @__PURE__ */ (0, K.jsx)(ts, {});
}
//#endregion
//#region src/main.tsx
var rs = { "market-state": () => /* @__PURE__ */ (0, K.jsx)(Oi, {}) };
function is() {
	document.querySelectorAll("[data-react-island]").forEach((e) => {
		let t = rs[e.dataset.reactIsland || ""];
		!t || e.dataset.reactMounted === "1" || (e.dataset.reactMounted = "1", (0, l.createRoot)(e).render(/* @__PURE__ */ (0, K.jsx)(c.StrictMode, { children: t() })));
	});
}
function as() {
	let e = document.getElementById("folioReactRoot");
	return e ? e.dataset.reactMounted === "1" ? !0 : (e.dataset.reactMounted = "1", (0, l.createRoot)(e).render(/* @__PURE__ */ (0, K.jsx)(c.StrictMode, { children: /* @__PURE__ */ (0, K.jsx)(ns, {}) })), !0) : !1;
}
function os() {
	as(), is();
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", os) : os();
//#endregion
