import { t as e } from "./rolldown-runtime-3b4jIN3o.js";
import { a as t, i as n, n as r, o as i, r as a, s as o, t as s } from "./PixelOfficeScene-ChUqFsWX.js";
//#region node_modules/scheduler/cjs/scheduler.production.min.js
var c = /* @__PURE__ */ e(((e) => {
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
			t !== null && ee(b, t.startTime - e);
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
				g !== null && ee(b, g.startTime - i), u = !1;
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
	function ee(t, n) {
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
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (_(w), w = -1) : h = !0, ee(b, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, M(x))), r;
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
})), l = /* @__PURE__ */ e(((e, t) => {
	t.exports = c();
})), u = /* @__PURE__ */ e(((e) => {
	var t = o(), n = l();
	function r(e) {
		for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	var i = /* @__PURE__ */ new Set(), a = {};
	function s(e, t) {
		c(e, t), c(e + "Capture", t);
	}
	function c(e, t) {
		for (a[e] = t, e = 0; e < t.length; e++) i.add(t[e]);
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
	var C = t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, w = Symbol.for("react.element"), T = Symbol.for("react.portal"), E = Symbol.for("react.fragment"), D = Symbol.for("react.strict_mode"), O = Symbol.for("react.profiler"), k = Symbol.for("react.provider"), A = Symbol.for("react.context"), j = Symbol.for("react.forward_ref"), M = Symbol.for("react.suspense"), ee = Symbol.for("react.suspense_list"), N = Symbol.for("react.memo"), P = Symbol.for("react.lazy"), F = Symbol.for("react.offscreen"), I = Symbol.iterator;
	function L(e) {
		return typeof e != "object" || !e ? null : (e = I && e[I] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var R = Object.assign, z;
	function B(e) {
		if (z === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			z = t && t[1] || "";
		}
		return "\n" + z + e;
	}
	var V = !1;
	function H(e, t) {
		if (!e || V) return "";
		V = !0;
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
			V = !1, Error.prepareStackTrace = n;
		}
		return (e = e ? e.displayName || e.name : "") ? B(e) : "";
	}
	function te(e) {
		switch (e.tag) {
			case 5: return B(e.type);
			case 16: return B("Lazy");
			case 13: return B("Suspense");
			case 19: return B("SuspenseList");
			case 0:
			case 2:
			case 15: return e = H(e.type, !1), e;
			case 11: return e = H(e.type.render, !1), e;
			case 1: return e = H(e.type, !0), e;
			default: return "";
		}
	}
	function ne(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case E: return "Fragment";
			case T: return "Portal";
			case O: return "Profiler";
			case D: return "StrictMode";
			case M: return "Suspense";
			case ee: return "SuspenseList";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case A: return (e.displayName || "Context") + ".Consumer";
			case k: return (e._context.displayName || "Context") + ".Provider";
			case j:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case N: return t = e.displayName || null, t === null ? ne(e.type) || "Memo" : t;
			case P:
				t = e._payload, e = e._init;
				try {
					return ne(e(t));
				} catch {}
		}
		return null;
	}
	function re(e) {
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
			case 16: return ne(t);
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
	function ie(e) {
		switch (typeof e) {
			case "boolean":
			case "number":
			case "string":
			case "undefined": return e;
			case "object": return e;
			default: return "";
		}
	}
	function ae(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function oe(e) {
		var t = ae(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), r = "" + e[t];
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
	function se(e) {
		e._valueTracker ||= oe(e);
	}
	function ce(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = ae(e) ? e.checked ? "true" : "false" : e.value), e = r, e === n ? !1 : (t.setValue(e), !0);
	}
	function le(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	function ue(e, t) {
		var n = t.checked;
		return R({}, t, {
			defaultChecked: void 0,
			defaultValue: void 0,
			value: void 0,
			checked: n ?? e._wrapperState.initialChecked
		});
	}
	function de(e, t) {
		var n = t.defaultValue == null ? "" : t.defaultValue, r = t.checked == null ? t.defaultChecked : t.checked;
		n = ie(t.value == null ? n : t.value), e._wrapperState = {
			initialChecked: r,
			initialValue: n,
			controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null
		};
	}
	function fe(e, t) {
		t = t.checked, t != null && S(e, "checked", t, !1);
	}
	function pe(e, t) {
		fe(e, t);
		var n = ie(t.value), r = t.type;
		if (n != null) r === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
		else if (r === "submit" || r === "reset") {
			e.removeAttribute("value");
			return;
		}
		t.hasOwnProperty("value") ? he(e, t.type, n) : t.hasOwnProperty("defaultValue") && he(e, t.type, ie(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
	}
	function me(e, t, n) {
		if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
			var r = t.type;
			if (!(r !== "submit" && r !== "reset" || t.value !== void 0 && t.value !== null)) return;
			t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
		}
		n = e.name, n !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
	}
	function he(e, t, n) {
		(t !== "number" || le(e.ownerDocument) !== e) && (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
	}
	var ge = Array.isArray;
	function _e(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + ie(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function ve(e, t) {
		if (t.dangerouslySetInnerHTML != null) throw Error(r(91));
		return R({}, t, {
			value: void 0,
			defaultValue: void 0,
			children: "" + e._wrapperState.initialValue
		});
	}
	function ye(e, t) {
		var n = t.value;
		if (n == null) {
			if (n = t.children, t = t.defaultValue, n != null) {
				if (t != null) throw Error(r(92));
				if (ge(n)) {
					if (1 < n.length) throw Error(r(93));
					n = n[0];
				}
				t = n;
			}
			t ??= "", n = t;
		}
		e._wrapperState = { initialValue: ie(n) };
	}
	function be(e, t) {
		var n = ie(t.value), r = ie(t.defaultValue);
		n != null && (n = "" + n, n !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), r != null && (e.defaultValue = "" + r);
	}
	function xe(e) {
		var t = e.textContent;
		t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
	}
	function Se(e) {
		switch (e) {
			case "svg": return "http://www.w3.org/2000/svg";
			case "math": return "http://www.w3.org/1998/Math/MathML";
			default: return "http://www.w3.org/1999/xhtml";
		}
	}
	function Ce(e, t) {
		return e == null || e === "http://www.w3.org/1999/xhtml" ? Se(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
	}
	var we, Te = function(e) {
		return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, r, i) {
			MSApp.execUnsafeLocalFunction(function() {
				return e(t, n, r, i);
			});
		} : e;
	}(function(e, t) {
		if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e) e.innerHTML = t;
		else {
			for (we ||= document.createElement("div"), we.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = we.firstChild; e.firstChild;) e.removeChild(e.firstChild);
			for (; t.firstChild;) e.appendChild(t.firstChild);
		}
	});
	function Ee(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var De = {
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
	}, Oe = [
		"Webkit",
		"ms",
		"Moz",
		"O"
	];
	Object.keys(De).forEach(function(e) {
		Oe.forEach(function(t) {
			t = t + e.charAt(0).toUpperCase() + e.substring(1), De[t] = De[e];
		});
	});
	function ke(e, t, n) {
		return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || De.hasOwnProperty(e) && De[e] ? ("" + t).trim() : t + "px";
	}
	function Ae(e, t) {
		for (var n in e = e.style, t) if (t.hasOwnProperty(n)) {
			var r = n.indexOf("--") === 0, i = ke(n, t[n], r);
			n === "float" && (n = "cssFloat"), r ? e.setProperty(n, i) : e[n] = i;
		}
	}
	var je = R({ menuitem: !0 }, {
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
	function Me(e, t) {
		if (t) {
			if (je[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(r(137, e));
			if (t.dangerouslySetInnerHTML != null) {
				if (t.children != null) throw Error(r(60));
				if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(r(61));
			}
			if (t.style != null && typeof t.style != "object") throw Error(r(62));
		}
	}
	function Ne(e, t) {
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
	var Pe = null;
	function Fe(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var Ie = null, Le = null, Re = null;
	function ze(e) {
		if (e = Li(e)) {
			if (typeof Ie != "function") throw Error(r(280));
			var t = e.stateNode;
			t && (t = zi(t), Ie(e.stateNode, e.type, t));
		}
	}
	function Be(e) {
		Le ? Re ? Re.push(e) : Re = [e] : Le = e;
	}
	function Ve() {
		if (Le) {
			var e = Le, t = Re;
			if (Re = Le = null, ze(e), t) for (e = 0; e < t.length; e++) ze(t[e]);
		}
	}
	function He(e, t) {
		return e(t);
	}
	function Ue() {}
	var We = !1;
	function Ge(e, t, n) {
		if (We) return e(t, n);
		We = !0;
		try {
			return He(e, t, n);
		} finally {
			We = !1, (Le !== null || Re !== null) && (Ue(), Ve());
		}
	}
	function Ke(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var i = zi(n);
		if (i === null) return null;
		n = i[t];
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
				(i = !i.disabled) || (e = e.type, i = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !i;
				break a;
			default: e = !1;
		}
		if (e) return null;
		if (n && typeof n != "function") throw Error(r(231, t, typeof n));
		return n;
	}
	var qe = !1;
	if (u) try {
		var Je = {};
		Object.defineProperty(Je, "passive", { get: function() {
			qe = !0;
		} }), window.addEventListener("test", Je, Je), window.removeEventListener("test", Je, Je);
	} catch {
		qe = !1;
	}
	function Ye(e, t, n, r, i, a, o, s, c) {
		var l = Array.prototype.slice.call(arguments, 3);
		try {
			t.apply(n, l);
		} catch (e) {
			this.onError(e);
		}
	}
	var Xe = !1, Ze = null, Qe = !1, $e = null, et = { onError: function(e) {
		Xe = !0, Ze = e;
	} };
	function tt(e, t, n, r, i, a, o, s, c) {
		Xe = !1, Ze = null, Ye.apply(et, arguments);
	}
	function nt(e, t, n, i, a, o, s, c, l) {
		if (tt.apply(this, arguments), Xe) {
			if (Xe) {
				var u = Ze;
				Xe = !1, Ze = null;
			} else throw Error(r(198));
			Qe || (Qe = !0, $e = u);
		}
	}
	function rt(e) {
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
	function it(e) {
		if (e.tag === 13) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function at(e) {
		if (rt(e) !== e) throw Error(r(188));
	}
	function ot(e) {
		var t = e.alternate;
		if (!t) {
			if (t = rt(e), t === null) throw Error(r(188));
			return t === e ? e : null;
		}
		for (var n = e, i = t;;) {
			var a = n.return;
			if (a === null) break;
			var o = a.alternate;
			if (o === null) {
				if (i = a.return, i !== null) {
					n = i;
					continue;
				}
				break;
			}
			if (a.child === o.child) {
				for (o = a.child; o;) {
					if (o === n) return at(a), e;
					if (o === i) return at(a), t;
					o = o.sibling;
				}
				throw Error(r(188));
			}
			if (n.return !== i.return) n = a, i = o;
			else {
				for (var s = !1, c = a.child; c;) {
					if (c === n) {
						s = !0, n = a, i = o;
						break;
					}
					if (c === i) {
						s = !0, i = a, n = o;
						break;
					}
					c = c.sibling;
				}
				if (!s) {
					for (c = o.child; c;) {
						if (c === n) {
							s = !0, n = o, i = a;
							break;
						}
						if (c === i) {
							s = !0, i = o, n = a;
							break;
						}
						c = c.sibling;
					}
					if (!s) throw Error(r(189));
				}
			}
			if (n.alternate !== i) throw Error(r(190));
		}
		if (n.tag !== 3) throw Error(r(188));
		return n.stateNode.current === n ? e : t;
	}
	function st(e) {
		return e = ot(e), e === null ? null : ct(e);
	}
	function ct(e) {
		if (e.tag === 5 || e.tag === 6) return e;
		for (e = e.child; e !== null;) {
			var t = ct(e);
			if (t !== null) return t;
			e = e.sibling;
		}
		return null;
	}
	var lt = n.unstable_scheduleCallback, ut = n.unstable_cancelCallback, dt = n.unstable_shouldYield, ft = n.unstable_requestPaint, U = n.unstable_now, pt = n.unstable_getCurrentPriorityLevel, mt = n.unstable_ImmediatePriority, ht = n.unstable_UserBlockingPriority, gt = n.unstable_NormalPriority, _t = n.unstable_LowPriority, vt = n.unstable_IdlePriority, yt = null, bt = null;
	function xt(e) {
		if (bt && typeof bt.onCommitFiberRoot == "function") try {
			bt.onCommitFiberRoot(yt, e, void 0, (e.current.flags & 128) == 128);
		} catch {}
	}
	var St = Math.clz32 ? Math.clz32 : Tt, Ct = Math.log, wt = Math.LN2;
	function Tt(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (Ct(e) / wt | 0) | 0;
	}
	var Et = 64, Dt = 4194304;
	function Ot(e) {
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
	function kt(e, t) {
		var n = e.pendingLanes;
		if (n === 0) return 0;
		var r = 0, i = e.suspendedLanes, a = e.pingedLanes, o = n & 268435455;
		if (o !== 0) {
			var s = o & ~i;
			s === 0 ? (a &= o, a !== 0 && (r = Ot(a))) : r = Ot(s);
		} else o = n & ~i, o === 0 ? a !== 0 && (r = Ot(a)) : r = Ot(o);
		if (r === 0) return 0;
		if (t !== 0 && t !== r && (t & i) === 0 && (i = r & -r, a = t & -t, i >= a || i === 16 && a & 4194240)) return t;
		if (r & 4 && (r |= n & 16), t = e.entangledLanes, t !== 0) for (e = e.entanglements, t &= r; 0 < t;) n = 31 - St(t), i = 1 << n, r |= e[n], t &= ~i;
		return r;
	}
	function At(e, t) {
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
	function jt(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes; 0 < a;) {
			var o = 31 - St(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = At(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
	}
	function Mt(e) {
		return e = e.pendingLanes & -1073741825, e === 0 ? e & 1073741824 ? 1073741824 : 0 : e;
	}
	function Nt() {
		var e = Et;
		return Et <<= 1, !(Et & 4194240) && (Et = 64), e;
	}
	function Pt(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function Ft(e, t, n) {
		e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - St(t), e[t] = n;
	}
	function It(e, t) {
		var n = e.pendingLanes & ~t;
		e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
		var r = e.eventTimes;
		for (e = e.expirationTimes; 0 < n;) {
			var i = 31 - St(n), a = 1 << i;
			t[i] = 0, r[i] = -1, e[i] = -1, n &= ~a;
		}
	}
	function Lt(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - St(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	var W = 0;
	function Rt(e) {
		return e &= -e, 1 < e ? 4 < e ? e & 268435455 ? 16 : 536870912 : 4 : 1;
	}
	var zt, Bt, Vt, Ht, Ut, Wt = !1, Gt = [], Kt = null, qt = null, Jt = null, Yt = /* @__PURE__ */ new Map(), Xt = /* @__PURE__ */ new Map(), Zt = [], Qt = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
	function $t(e, t) {
		switch (e) {
			case "focusin":
			case "focusout":
				Kt = null;
				break;
			case "dragenter":
			case "dragleave":
				qt = null;
				break;
			case "mouseover":
			case "mouseout":
				Jt = null;
				break;
			case "pointerover":
			case "pointerout":
				Yt.delete(t.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": Xt.delete(t.pointerId);
		}
	}
	function en(e, t, n, r, i, a) {
		return e === null || e.nativeEvent !== a ? (e = {
			blockedOn: t,
			domEventName: n,
			eventSystemFlags: r,
			nativeEvent: a,
			targetContainers: [i]
		}, t !== null && (t = Li(t), t !== null && Bt(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
	}
	function tn(e, t, n, r, i) {
		switch (t) {
			case "focusin": return Kt = en(Kt, e, t, n, r, i), !0;
			case "dragenter": return qt = en(qt, e, t, n, r, i), !0;
			case "mouseover": return Jt = en(Jt, e, t, n, r, i), !0;
			case "pointerover":
				var a = i.pointerId;
				return Yt.set(a, en(Yt.get(a) || null, e, t, n, r, i)), !0;
			case "gotpointercapture": return a = i.pointerId, Xt.set(a, en(Xt.get(a) || null, e, t, n, r, i)), !0;
		}
		return !1;
	}
	function nn(e) {
		var t = Ii(e.target);
		if (t !== null) {
			var n = rt(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = it(n), t !== null) {
						e.blockedOn = t, Ut(e.priority, function() {
							Vt(n);
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
	function rn(e) {
		if (e.blockedOn !== null) return !1;
		for (var t = e.targetContainers; 0 < t.length;) {
			var n = hn(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
			if (n === null) {
				n = e.nativeEvent;
				var r = new n.constructor(n.type, n);
				Pe = r, n.target.dispatchEvent(r), Pe = null;
			} else return t = Li(n), t !== null && Bt(t), e.blockedOn = n, !1;
			t.shift();
		}
		return !0;
	}
	function an(e, t, n) {
		rn(e) && n.delete(t);
	}
	function on() {
		Wt = !1, Kt !== null && rn(Kt) && (Kt = null), qt !== null && rn(qt) && (qt = null), Jt !== null && rn(Jt) && (Jt = null), Yt.forEach(an), Xt.forEach(an);
	}
	function sn(e, t) {
		e.blockedOn === t && (e.blockedOn = null, Wt || (Wt = !0, n.unstable_scheduleCallback(n.unstable_NormalPriority, on)));
	}
	function cn(e) {
		function t(t) {
			return sn(t, e);
		}
		if (0 < Gt.length) {
			sn(Gt[0], e);
			for (var n = 1; n < Gt.length; n++) {
				var r = Gt[n];
				r.blockedOn === e && (r.blockedOn = null);
			}
		}
		for (Kt !== null && sn(Kt, e), qt !== null && sn(qt, e), Jt !== null && sn(Jt, e), Yt.forEach(t), Xt.forEach(t), n = 0; n < Zt.length; n++) r = Zt[n], r.blockedOn === e && (r.blockedOn = null);
		for (; 0 < Zt.length && (n = Zt[0], n.blockedOn === null);) nn(n), n.blockedOn === null && Zt.shift();
	}
	var ln = C.ReactCurrentBatchConfig, un = !0;
	function dn(e, t, n, r) {
		var i = W, a = ln.transition;
		ln.transition = null;
		try {
			W = 1, pn(e, t, n, r);
		} finally {
			W = i, ln.transition = a;
		}
	}
	function fn(e, t, n, r) {
		var i = W, a = ln.transition;
		ln.transition = null;
		try {
			W = 4, pn(e, t, n, r);
		} finally {
			W = i, ln.transition = a;
		}
	}
	function pn(e, t, n, r) {
		if (un) {
			var i = hn(e, t, n, r);
			if (i === null) ci(e, t, r, mn, n), $t(e, r);
			else if (tn(i, e, t, n, r)) r.stopPropagation();
			else if ($t(e, r), t & 4 && -1 < Qt.indexOf(e)) {
				for (; i !== null;) {
					var a = Li(i);
					if (a !== null && zt(a), a = hn(e, t, n, r), a === null && ci(e, t, r, mn, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else ci(e, t, r, null, n);
		}
	}
	var mn = null;
	function hn(e, t, n, r) {
		if (mn = null, e = Fe(r), e = Ii(e), e !== null) if (t = rt(e), t === null) e = null;
		else if (n = t.tag, n === 13) {
			if (e = it(t), e !== null) return e;
			e = null;
		} else if (n === 3) {
			if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
			e = null;
		} else t !== e && (e = null);
		return mn = e, null;
	}
	function gn(e) {
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
			case "message": switch (pt()) {
				case mt: return 1;
				case ht: return 4;
				case gt:
				case _t: return 16;
				case vt: return 536870912;
				default: return 16;
			}
			default: return 16;
		}
	}
	var _n = null, vn = null, yn = null;
	function bn() {
		if (yn) return yn;
		var e, t = vn, n = t.length, r, i = "value" in _n ? _n.value : _n.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return yn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function xn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function Sn() {
		return !0;
	}
	function Cn() {
		return !1;
	}
	function wn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? Sn : Cn, this.isPropagationStopped = Cn, this;
		}
		return R(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = Sn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = Sn);
			},
			persist: function() {},
			isPersistent: Sn
		}), t;
	}
	var Tn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, En = wn(Tn), Dn = R({}, Tn, {
		view: 0,
		detail: 0
	}), On = wn(Dn), kn, An, jn, Mn = R({}, Dn, {
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
		getModifierState: Un,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== jn && (jn && e.type === "mousemove" ? (kn = e.screenX - jn.screenX, An = e.screenY - jn.screenY) : An = kn = 0, jn = e), kn);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : An;
		}
	}), Nn = wn(Mn), Pn = wn(R({}, Mn, { dataTransfer: 0 })), Fn = wn(R({}, Dn, { relatedTarget: 0 })), In = wn(R({}, Tn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Ln = wn(R({}, Tn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), Rn = wn(R({}, Tn, { data: 0 })), zn = {
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
	}, Bn = {
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
	}, Vn = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function Hn(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = Vn[e]) ? !!t[e] : !1;
	}
	function Un() {
		return Hn;
	}
	var Wn = wn(R({}, Dn, {
		key: function(e) {
			if (e.key) {
				var t = zn[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = xn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Bn[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: Un,
		charCode: function(e) {
			return e.type === "keypress" ? xn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? xn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), Gn = wn(R({}, Mn, {
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
	})), Kn = wn(R({}, Dn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Un
	})), qn = wn(R({}, Tn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Jn = wn(R({}, Mn, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), Yn = [
		9,
		13,
		27,
		32
	], Xn = u && "CompositionEvent" in window, Zn = null;
	u && "documentMode" in document && (Zn = document.documentMode);
	var Qn = u && "TextEvent" in window && !Zn, $n = u && (!Xn || Zn && 8 < Zn && 11 >= Zn), er = " ", tr = !1;
	function nr(e, t) {
		switch (e) {
			case "keyup": return Yn.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function rr(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var ir = !1;
	function ar(e, t) {
		switch (e) {
			case "compositionend": return rr(t);
			case "keypress": return t.which === 32 ? (tr = !0, er) : null;
			case "textInput": return e = t.data, e === er && tr ? null : e;
			default: return null;
		}
	}
	function or(e, t) {
		if (ir) return e === "compositionend" || !Xn && nr(e, t) ? (e = bn(), yn = vn = _n = null, ir = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return $n && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var sr = {
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
	function cr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!sr[e.type] : t === "textarea";
	}
	function lr(e, t, n, r) {
		Be(r), t = ui(t, "onChange"), 0 < t.length && (n = new En("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var ur = null, dr = null;
	function fr(e) {
		ri(e, 0);
	}
	function pr(e) {
		if (ce(Ri(e))) return e;
	}
	function mr(e, t) {
		if (e === "change") return t;
	}
	var hr = !1;
	if (u) {
		var gr;
		if (u) {
			var _r = "oninput" in document;
			if (!_r) {
				var vr = document.createElement("div");
				vr.setAttribute("oninput", "return;"), _r = typeof vr.oninput == "function";
			}
			gr = _r;
		} else gr = !1;
		hr = gr && (!document.documentMode || 9 < document.documentMode);
	}
	function yr() {
		ur && (ur.detachEvent("onpropertychange", br), dr = ur = null);
	}
	function br(e) {
		if (e.propertyName === "value" && pr(dr)) {
			var t = [];
			lr(t, dr, e, Fe(e)), Ge(fr, t);
		}
	}
	function xr(e, t, n) {
		e === "focusin" ? (yr(), ur = t, dr = n, ur.attachEvent("onpropertychange", br)) : e === "focusout" && yr();
	}
	function Sr(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return pr(dr);
	}
	function Cr(e, t) {
		if (e === "click") return pr(t);
	}
	function wr(e, t) {
		if (e === "input" || e === "change") return pr(t);
	}
	function Tr(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var Er = typeof Object.is == "function" ? Object.is : Tr;
	function Dr(e, t) {
		if (Er(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!d.call(t, i) || !Er(e[i], t[i])) return !1;
		}
		return !0;
	}
	function Or(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function kr(e, t) {
		var n = Or(e);
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
			n = Or(n);
		}
	}
	function Ar(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Ar(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function jr() {
		for (var e = window, t = le(); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = le(e.document);
		}
		return t;
	}
	function Mr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	function Nr(e) {
		var t = jr(), n = e.focusedElem, r = e.selectionRange;
		if (t !== n && n && n.ownerDocument && Ar(n.ownerDocument.documentElement, n)) {
			if (r !== null && Mr(n)) {
				if (t = r.start, e = r.end, e === void 0 && (e = t), "selectionStart" in n) n.selectionStart = t, n.selectionEnd = Math.min(e, n.value.length);
				else if (e = (t = n.ownerDocument || document) && t.defaultView || window, e.getSelection) {
					e = e.getSelection();
					var i = n.textContent.length, a = Math.min(r.start, i);
					r = r.end === void 0 ? a : Math.min(r.end, i), !e.extend && a > r && (i = r, r = a, a = i), i = kr(n, a);
					var o = kr(n, r);
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
	var Pr = u && "documentMode" in document && 11 >= document.documentMode, Fr = null, Ir = null, Lr = null, Rr = !1;
	function zr(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		Rr || Fr == null || Fr !== le(r) || (r = Fr, "selectionStart" in r && Mr(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), Lr && Dr(Lr, r) || (Lr = r, r = ui(Ir, "onSelect"), 0 < r.length && (t = new En("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = Fr)));
	}
	function Br(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var Vr = {
		animationend: Br("Animation", "AnimationEnd"),
		animationiteration: Br("Animation", "AnimationIteration"),
		animationstart: Br("Animation", "AnimationStart"),
		transitionend: Br("Transition", "TransitionEnd")
	}, Hr = {}, Ur = {};
	u && (Ur = document.createElement("div").style, "AnimationEvent" in window || (delete Vr.animationend.animation, delete Vr.animationiteration.animation, delete Vr.animationstart.animation), "TransitionEvent" in window || delete Vr.transitionend.transition);
	function Wr(e) {
		if (Hr[e]) return Hr[e];
		if (!Vr[e]) return e;
		var t = Vr[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in Ur) return Hr[e] = t[n];
		return e;
	}
	var Gr = Wr("animationend"), Kr = Wr("animationiteration"), qr = Wr("animationstart"), Jr = Wr("transitionend"), Yr = /* @__PURE__ */ new Map(), Xr = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	function Zr(e, t) {
		Yr.set(e, t), s(t, [e]);
	}
	for (var Qr = 0; Qr < Xr.length; Qr++) {
		var $r = Xr[Qr];
		Zr($r.toLowerCase(), "on" + ($r[0].toUpperCase() + $r.slice(1)));
	}
	Zr(Gr, "onAnimationEnd"), Zr(Kr, "onAnimationIteration"), Zr(qr, "onAnimationStart"), Zr("dblclick", "onDoubleClick"), Zr("focusin", "onFocus"), Zr("focusout", "onBlur"), Zr(Jr, "onTransitionEnd"), c("onMouseEnter", ["mouseout", "mouseover"]), c("onMouseLeave", ["mouseout", "mouseover"]), c("onPointerEnter", ["pointerout", "pointerover"]), c("onPointerLeave", ["pointerout", "pointerover"]), s("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), s("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), s("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), s("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), s("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), s("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
	var ei = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), ti = new Set("cancel close invalid load scroll toggle".split(" ").concat(ei));
	function ni(e, t, n) {
		var r = e.type || "unknown-event";
		e.currentTarget = n, nt(r, t, void 0, e), e.currentTarget = null;
	}
	function ri(e, t) {
		t = (t & 4) != 0;
		for (var n = 0; n < e.length; n++) {
			var r = e[n], i = r.event;
			r = r.listeners;
			a: {
				var a = void 0;
				if (t) for (var o = r.length - 1; 0 <= o; o--) {
					var s = r[o], c = s.instance, l = s.currentTarget;
					if (s = s.listener, c !== a && i.isPropagationStopped()) break a;
					ni(i, s, l), a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					ni(i, s, l), a = c;
				}
			}
		}
		if (Qe) throw e = $e, Qe = !1, $e = null, e;
	}
	function G(e, t) {
		var n = t[Ni];
		n === void 0 && (n = t[Ni] = /* @__PURE__ */ new Set());
		var r = e + "__bubble";
		n.has(r) || (si(t, e, 2, !1), n.add(r));
	}
	function ii(e, t, n) {
		var r = 0;
		t && (r |= 4), si(n, e, r, t);
	}
	var ai = "_reactListening" + Math.random().toString(36).slice(2);
	function oi(e) {
		if (!e[ai]) {
			e[ai] = !0, i.forEach(function(t) {
				t !== "selectionchange" && (ti.has(t) || ii(t, !1, e), ii(t, !0, e));
			});
			var t = e.nodeType === 9 ? e : e.ownerDocument;
			t === null || t[ai] || (t[ai] = !0, ii("selectionchange", !1, t));
		}
	}
	function si(e, t, n, r) {
		switch (gn(t)) {
			case 1:
				var i = dn;
				break;
			case 4:
				i = fn;
				break;
			default: i = pn;
		}
		n = i.bind(null, t, n, e), i = void 0, !qe || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
			capture: !0,
			passive: i
		}) : i === void 0 ? e.addEventListener(t, n, !1) : e.addEventListener(t, n, { passive: i });
	}
	function ci(e, t, n, r, i) {
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
					if (o = Ii(s), o === null) return;
					if (c = o.tag, c === 5 || c === 6) {
						r = a = o;
						continue a;
					}
					s = s.parentNode;
				}
			}
			r = r.return;
		}
		Ge(function() {
			var r = a, i = Fe(n), o = [];
			a: {
				var s = Yr.get(e);
				if (s !== void 0) {
					var c = En, l = e;
					switch (e) {
						case "keypress": if (xn(n) === 0) break a;
						case "keydown":
						case "keyup":
							c = Wn;
							break;
						case "focusin":
							l = "focus", c = Fn;
							break;
						case "focusout":
							l = "blur", c = Fn;
							break;
						case "beforeblur":
						case "afterblur":
							c = Fn;
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
							c = Nn;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							c = Pn;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							c = Kn;
							break;
						case Gr:
						case Kr:
						case qr:
							c = In;
							break;
						case Jr:
							c = qn;
							break;
						case "scroll":
							c = On;
							break;
						case "wheel":
							c = Jn;
							break;
						case "copy":
						case "cut":
						case "paste":
							c = Ln;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup": c = Gn;
					}
					var u = (t & 4) != 0, d = !u && e === "scroll", f = u ? s === null ? null : s + "Capture" : s;
					u = [];
					for (var p = r, m; p !== null;) {
						m = p;
						var h = m.stateNode;
						if (m.tag === 5 && h !== null && (m = h, f !== null && (h = Ke(p, f), h != null && u.push(li(p, h, m)))), d) break;
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
					if (s = e === "mouseover" || e === "pointerover", c = e === "mouseout" || e === "pointerout", s && n !== Pe && (l = n.relatedTarget || n.fromElement) && (Ii(l) || l[Mi])) break a;
					if ((c || s) && (s = i.window === i ? i : (s = i.ownerDocument) ? s.defaultView || s.parentWindow : window, c ? (l = n.relatedTarget || n.toElement, c = r, l = l ? Ii(l) : null, l !== null && (d = rt(l), l !== d || l.tag !== 5 && l.tag !== 6) && (l = null)) : (c = null, l = r), c !== l)) {
						if (u = Nn, h = "onMouseLeave", f = "onMouseEnter", p = "mouse", (e === "pointerout" || e === "pointerover") && (u = Gn, h = "onPointerLeave", f = "onPointerEnter", p = "pointer"), d = c == null ? s : Ri(c), m = l == null ? s : Ri(l), s = new u(h, p + "leave", c, n, i), s.target = d, s.relatedTarget = m, h = null, Ii(i) === r && (u = new u(f, p + "enter", l, n, i), u.target = m, u.relatedTarget = d, h = u), d = h, c && l) b: {
							for (u = c, f = l, p = 0, m = u; m; m = di(m)) p++;
							for (m = 0, h = f; h; h = di(h)) m++;
							for (; 0 < p - m;) u = di(u), p--;
							for (; 0 < m - p;) f = di(f), m--;
							for (; p--;) {
								if (u === f || f !== null && u === f.alternate) break b;
								u = di(u), f = di(f);
							}
							u = null;
						}
						else u = null;
						c !== null && fi(o, s, c, u, !1), l !== null && d !== null && fi(o, d, l, u, !0);
					}
				}
				a: {
					if (s = r ? Ri(r) : window, c = s.nodeName && s.nodeName.toLowerCase(), c === "select" || c === "input" && s.type === "file") var g = mr;
					else if (cr(s)) if (hr) g = wr;
					else {
						g = Sr;
						var _ = xr;
					}
					else (c = s.nodeName) && c.toLowerCase() === "input" && (s.type === "checkbox" || s.type === "radio") && (g = Cr);
					if (g &&= g(e, r)) {
						lr(o, g, n, i);
						break a;
					}
					_ && _(e, s, r), e === "focusout" && (_ = s._wrapperState) && _.controlled && s.type === "number" && he(s, "number", s.value);
				}
				switch (_ = r ? Ri(r) : window, e) {
					case "focusin":
						(cr(_) || _.contentEditable === "true") && (Fr = _, Ir = r, Lr = null);
						break;
					case "focusout":
						Lr = Ir = Fr = null;
						break;
					case "mousedown":
						Rr = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						Rr = !1, zr(o, n, i);
						break;
					case "selectionchange": if (Pr) break;
					case "keydown":
					case "keyup": zr(o, n, i);
				}
				var v;
				if (Xn) b: {
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
				else ir ? nr(e, n) && (y = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (y = "onCompositionStart");
				y && ($n && n.locale !== "ko" && (ir || y !== "onCompositionStart" ? y === "onCompositionEnd" && ir && (v = bn()) : (_n = i, vn = "value" in _n ? _n.value : _n.textContent, ir = !0)), _ = ui(r, y), 0 < _.length && (y = new Rn(y, e, null, n, i), o.push({
					event: y,
					listeners: _
				}), v ? y.data = v : (v = rr(n), v !== null && (y.data = v)))), (v = Qn ? ar(e, n) : or(e, n)) && (r = ui(r, "onBeforeInput"), 0 < r.length && (i = new Rn("onBeforeInput", "beforeinput", null, n, i), o.push({
					event: i,
					listeners: r
				}), i.data = v));
			}
			ri(o, t);
		});
	}
	function li(e, t, n) {
		return {
			instance: e,
			listener: t,
			currentTarget: n
		};
	}
	function ui(e, t) {
		for (var n = t + "Capture", r = []; e !== null;) {
			var i = e, a = i.stateNode;
			i.tag === 5 && a !== null && (i = a, a = Ke(e, n), a != null && r.unshift(li(e, a, i)), a = Ke(e, t), a != null && r.push(li(e, a, i))), e = e.return;
		}
		return r;
	}
	function di(e) {
		if (e === null) return null;
		do
			e = e.return;
		while (e && e.tag !== 5);
		return e || null;
	}
	function fi(e, t, n, r, i) {
		for (var a = t._reactName, o = []; n !== null && n !== r;) {
			var s = n, c = s.alternate, l = s.stateNode;
			if (c !== null && c === r) break;
			s.tag === 5 && l !== null && (s = l, i ? (c = Ke(n, a), c != null && o.unshift(li(n, c, s))) : i || (c = Ke(n, a), c != null && o.push(li(n, c, s)))), n = n.return;
		}
		o.length !== 0 && e.push({
			event: t,
			listeners: o
		});
	}
	var pi = /\r\n?/g, mi = /\u0000|\uFFFD/g;
	function hi(e) {
		return (typeof e == "string" ? e : "" + e).replace(pi, "\n").replace(mi, "");
	}
	function gi(e, t, n) {
		if (t = hi(t), hi(e) !== t && n) throw Error(r(425));
	}
	function _i() {}
	var vi = null, yi = null;
	function bi(e, t) {
		return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
	}
	var xi = typeof setTimeout == "function" ? setTimeout : void 0, Si = typeof clearTimeout == "function" ? clearTimeout : void 0, Ci = typeof Promise == "function" ? Promise : void 0, wi = typeof queueMicrotask == "function" ? queueMicrotask : Ci === void 0 ? xi : function(e) {
		return Ci.resolve(null).then(e).catch(Ti);
	};
	function Ti(e) {
		setTimeout(function() {
			throw e;
		});
	}
	function Ei(e, t) {
		var n = t, r = 0;
		do {
			var i = n.nextSibling;
			if (e.removeChild(n), i && i.nodeType === 8) if (n = i.data, n === "/$") {
				if (r === 0) {
					e.removeChild(i), cn(t);
					return;
				}
				r--;
			} else n !== "$" && n !== "$?" && n !== "$!" || r++;
			n = i;
		} while (n);
		cn(t);
	}
	function Di(e) {
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
	function Oi(e) {
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
	var ki = Math.random().toString(36).slice(2), Ai = "__reactFiber$" + ki, ji = "__reactProps$" + ki, Mi = "__reactContainer$" + ki, Ni = "__reactEvents$" + ki, Pi = "__reactListeners$" + ki, Fi = "__reactHandles$" + ki;
	function Ii(e) {
		var t = e[Ai];
		if (t) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[Mi] || n[Ai]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = Oi(e); e !== null;) {
					if (n = e[Ai]) return n;
					e = Oi(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function Li(e) {
		return e = e[Ai] || e[Mi], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
	}
	function Ri(e) {
		if (e.tag === 5 || e.tag === 6) return e.stateNode;
		throw Error(r(33));
	}
	function zi(e) {
		return e[ji] || null;
	}
	var Bi = [], Vi = -1;
	function Hi(e) {
		return { current: e };
	}
	function K(e) {
		0 > Vi || (e.current = Bi[Vi], Bi[Vi] = null, Vi--);
	}
	function q(e, t) {
		Vi++, Bi[Vi] = e.current, e.current = t;
	}
	var Ui = {}, Wi = Hi(Ui), Gi = Hi(!1), Ki = Ui;
	function qi(e, t) {
		var n = e.type.contextTypes;
		if (!n) return Ui;
		var r = e.stateNode;
		if (r && r.__reactInternalMemoizedUnmaskedChildContext === t) return r.__reactInternalMemoizedMaskedChildContext;
		var i = {}, a;
		for (a in n) i[a] = t[a];
		return r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = i), i;
	}
	function Ji(e) {
		return e = e.childContextTypes, e != null;
	}
	function Yi() {
		K(Gi), K(Wi);
	}
	function Xi(e, t, n) {
		if (Wi.current !== Ui) throw Error(r(168));
		q(Wi, t), q(Gi, n);
	}
	function Zi(e, t, n) {
		var i = e.stateNode;
		if (t = t.childContextTypes, typeof i.getChildContext != "function") return n;
		for (var a in i = i.getChildContext(), i) if (!(a in t)) throw Error(r(108, re(e) || "Unknown", a));
		return R({}, n, i);
	}
	function Qi(e) {
		return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || Ui, Ki = Wi.current, q(Wi, e), q(Gi, Gi.current), !0;
	}
	function $i(e, t, n) {
		var i = e.stateNode;
		if (!i) throw Error(r(169));
		n ? (e = Zi(e, t, Ki), i.__reactInternalMemoizedMergedChildContext = e, K(Gi), K(Wi), q(Wi, e)) : K(Gi), q(Gi, n);
	}
	var ea = null, ta = !1, na = !1;
	function ra(e) {
		ea === null ? ea = [e] : ea.push(e);
	}
	function ia(e) {
		ta = !0, ra(e);
	}
	function aa() {
		if (!na && ea !== null) {
			na = !0;
			var e = 0, t = W;
			try {
				var n = ea;
				for (W = 1; e < n.length; e++) {
					var r = n[e];
					do
						r = r(!0);
					while (r !== null);
				}
				ea = null, ta = !1;
			} catch (t) {
				throw ea !== null && (ea = ea.slice(e + 1)), lt(mt, aa), t;
			} finally {
				W = t, na = !1;
			}
		}
		return null;
	}
	var oa = [], sa = 0, ca = null, la = 0, ua = [], da = 0, fa = null, pa = 1, ma = "";
	function ha(e, t) {
		oa[sa++] = la, oa[sa++] = ca, ca = e, la = t;
	}
	function ga(e, t, n) {
		ua[da++] = pa, ua[da++] = ma, ua[da++] = fa, fa = e;
		var r = pa;
		e = ma;
		var i = 32 - St(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - St(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, pa = 1 << 32 - St(t) + i | n << i | r, ma = a + e;
		} else pa = 1 << a | n << i | r, ma = e;
	}
	function _a(e) {
		e.return !== null && (ha(e, 1), ga(e, 1, 0));
	}
	function va(e) {
		for (; e === ca;) ca = oa[--sa], oa[sa] = null, la = oa[--sa], oa[sa] = null;
		for (; e === fa;) fa = ua[--da], ua[da] = null, ma = ua[--da], ua[da] = null, pa = ua[--da], ua[da] = null;
	}
	var ya = null, ba = null, J = !1, xa = null;
	function Sa(e, t) {
		var n = Kl(5, null, null, 0);
		n.elementType = "DELETED", n.stateNode = t, n.return = e, t = e.deletions, t === null ? (e.deletions = [n], e.flags |= 16) : t.push(n);
	}
	function Ca(e, t) {
		switch (e.tag) {
			case 5:
				var n = e.type;
				return t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t === null ? !1 : (e.stateNode = t, ya = e, ba = Di(t.firstChild), !0);
			case 6: return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t === null ? !1 : (e.stateNode = t, ya = e, ba = null, !0);
			case 13: return t = t.nodeType === 8 ? t : null, t === null ? !1 : (n = fa === null ? null : {
				id: pa,
				overflow: ma
			}, e.memoizedState = {
				dehydrated: t,
				treeContext: n,
				retryLane: 1073741824
			}, n = Kl(18, null, null, 0), n.stateNode = t, n.return = e, e.child = n, ya = e, ba = null, !0);
			default: return !1;
		}
	}
	function wa(e) {
		return (e.mode & 1) != 0 && (e.flags & 128) == 0;
	}
	function Ta(e) {
		if (J) {
			var t = ba;
			if (t) {
				var n = t;
				if (!Ca(e, t)) {
					if (wa(e)) throw Error(r(418));
					t = Di(n.nextSibling);
					var i = ya;
					t && Ca(e, t) ? Sa(i, n) : (e.flags = e.flags & -4097 | 2, J = !1, ya = e);
				}
			} else {
				if (wa(e)) throw Error(r(418));
				e.flags = e.flags & -4097 | 2, J = !1, ya = e;
			}
		}
	}
	function Ea(e) {
		for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13;) e = e.return;
		ya = e;
	}
	function Da(e) {
		if (e !== ya) return !1;
		if (!J) return Ea(e), J = !0, !1;
		var t;
		if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !bi(e.type, e.memoizedProps)), t &&= ba) {
			if (wa(e)) throw Oa(), Error(r(418));
			for (; t;) Sa(e, t), t = Di(t.nextSibling);
		}
		if (Ea(e), e.tag === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(r(317));
			a: {
				for (e = e.nextSibling, t = 0; e;) {
					if (e.nodeType === 8) {
						var n = e.data;
						if (n === "/$") {
							if (t === 0) {
								ba = Di(e.nextSibling);
								break a;
							}
							t--;
						} else n !== "$" && n !== "$!" && n !== "$?" || t++;
					}
					e = e.nextSibling;
				}
				ba = null;
			}
		} else ba = ya ? Di(e.stateNode.nextSibling) : null;
		return !0;
	}
	function Oa() {
		for (var e = ba; e;) e = Di(e.nextSibling);
	}
	function ka() {
		ba = ya = null, J = !1;
	}
	function Aa(e) {
		xa === null ? xa = [e] : xa.push(e);
	}
	var ja = C.ReactCurrentBatchConfig;
	function Ma(e, t, n) {
		if (e = n.ref, e !== null && typeof e != "function" && typeof e != "object") {
			if (n._owner) {
				if (n = n._owner, n) {
					if (n.tag !== 1) throw Error(r(309));
					var i = n.stateNode;
				}
				if (!i) throw Error(r(147, e));
				var a = i, o = "" + e;
				return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === o ? t.ref : (t = function(e) {
					var t = a.refs;
					e === null ? delete t[o] : t[o] = e;
				}, t._stringRef = o, t);
			}
			if (typeof e != "string") throw Error(r(284));
			if (!n._owner) throw Error(r(290, e));
		}
		return e;
	}
	function Na(e, t) {
		throw e = Object.prototype.toString.call(t), Error(r(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
	}
	function Pa(e) {
		var t = e._init;
		return t(e._payload);
	}
	function Fa(e) {
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
		function i(e, t) {
			for (e = /* @__PURE__ */ new Map(); t !== null;) t.key === null ? e.set(t.index, t) : e.set(t.key, t), t = t.sibling;
			return e;
		}
		function a(e, t) {
			return e = Yl(e, t), e.index = 0, e.sibling = null, e;
		}
		function o(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 2, n) : (r = r.index, r < n ? (t.flags |= 2, n) : r)) : (t.flags |= 1048576, n);
		}
		function s(t) {
			return e && t.alternate === null && (t.flags |= 2), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = $l(n, e.mode, r), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var i = n.type;
			return i === E ? d(e, t, n.props.children, r, n.key) : t !== null && (t.elementType === i || typeof i == "object" && i && i.$$typeof === P && Pa(i) === t.type) ? (r = a(t, n.props), r.ref = Ma(e, t, n), r.return = e, r) : (r = Xl(n.type, n.key, n.props, null, e.mode, r), r.ref = Ma(e, t, n), r.return = e, r);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = eu(n, e.mode, r), t.return = e, t) : (t = a(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, i) {
			return t === null || t.tag !== 7 ? (t = Zl(n, e.mode, r, i), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number") return t = $l("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case w: return n = Xl(t.type, t.key, t.props, null, e.mode, n), n.ref = Ma(e, null, t), n.return = e, n;
					case T: return t = eu(t, e.mode, n), t.return = e, t;
					case P:
						var r = t._init;
						return f(e, r(t._payload), n);
				}
				if (ge(t) || L(t)) return t = Zl(t, e.mode, n, null), t.return = e, t;
				Na(e, t);
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
					case P: return i = n._init, p(e, t, i(n._payload), r);
				}
				if (ge(n) || L(n)) return i === null ? d(e, t, n, r, null) : null;
				Na(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case w: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case T: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case P:
						var a = r._init;
						return m(e, t, n, a(r._payload), i);
				}
				if (ge(r) || L(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				Na(t, r);
			}
			return null;
		}
		function h(r, a, s, c) {
			for (var l = null, u = null, d = a, h = a = 0, g = null; d !== null && h < s.length; h++) {
				d.index > h ? (g = d, d = null) : g = d.sibling;
				var _ = p(r, d, s[h], c);
				if (_ === null) {
					d === null && (d = g);
					break;
				}
				e && d && _.alternate === null && t(r, d), a = o(_, a, h), u === null ? l = _ : u.sibling = _, u = _, d = g;
			}
			if (h === s.length) return n(r, d), J && ha(r, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(r, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
				return J && ha(r, h), l;
			}
			for (d = i(r, d); h < s.length; h++) g = m(d, r, h, s[h], c), g !== null && (e && g.alternate !== null && d.delete(g.key === null ? h : g.key), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(r, e);
			}), J && ha(r, h), l;
		}
		function g(a, s, c, l) {
			var u = L(c);
			if (typeof u != "function") throw Error(r(150));
			if (c = u.call(c), c == null) throw Error(r(151));
			for (var d = u = null, h = s, g = s = 0, _ = null, v = c.next(); h !== null && !v.done; g++, v = c.next()) {
				h.index > g ? (_ = h, h = null) : _ = h.sibling;
				var y = p(a, h, v.value, l);
				if (y === null) {
					h === null && (h = _);
					break;
				}
				e && h && y.alternate === null && t(a, h), s = o(y, s, g), d === null ? u = y : d.sibling = y, d = y, h = _;
			}
			if (v.done) return n(a, h), J && ha(a, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
				return J && ha(a, g), u;
			}
			for (h = i(a, h); !v.done; g++, v = c.next()) v = m(h, a, g, v.value, l), v !== null && (e && v.alternate !== null && h.delete(v.key === null ? g : v.key), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(a, e);
			}), J && ha(a, g), u;
		}
		function _(e, r, i, o) {
			if (typeof i == "object" && i && i.type === E && i.key === null && (i = i.props.children), typeof i == "object" && i) {
				switch (i.$$typeof) {
					case w:
						a: {
							for (var c = i.key, l = r; l !== null;) {
								if (l.key === c) {
									if (c = i.type, c === E) {
										if (l.tag === 7) {
											n(e, l.sibling), r = a(l, i.props.children), r.return = e, e = r;
											break a;
										}
									} else if (l.elementType === c || typeof c == "object" && c && c.$$typeof === P && Pa(c) === l.type) {
										n(e, l.sibling), r = a(l, i.props), r.ref = Ma(e, l, i), r.return = e, e = r;
										break a;
									}
									n(e, l);
									break;
								} else t(e, l);
								l = l.sibling;
							}
							i.type === E ? (r = Zl(i.props.children, e.mode, o, i.key), r.return = e, e = r) : (o = Xl(i.type, i.key, i.props, null, e.mode, o), o.ref = Ma(e, r, i), o.return = e, e = o);
						}
						return s(e);
					case T:
						a: {
							for (l = i.key; r !== null;) {
								if (r.key === l) if (r.tag === 4 && r.stateNode.containerInfo === i.containerInfo && r.stateNode.implementation === i.implementation) {
									n(e, r.sibling), r = a(r, i.children || []), r.return = e, e = r;
									break a;
								} else {
									n(e, r);
									break;
								}
								else t(e, r);
								r = r.sibling;
							}
							r = eu(i, e.mode, o), r.return = e, e = r;
						}
						return s(e);
					case P: return l = i._init, _(e, r, l(i._payload), o);
				}
				if (ge(i)) return h(e, r, i, o);
				if (L(i)) return g(e, r, i, o);
				Na(e, i);
			}
			return typeof i == "string" && i !== "" || typeof i == "number" ? (i = "" + i, r !== null && r.tag === 6 ? (n(e, r.sibling), r = a(r, i), r.return = e, e = r) : (n(e, r), r = $l(i, e.mode, o), r.return = e, e = r), s(e)) : n(e, r);
		}
		return _;
	}
	var Ia = Fa(!0), La = Fa(!1), Ra = Hi(null), za = null, Ba = null, Va = null;
	function Ha() {
		Va = Ba = za = null;
	}
	function Ua(e) {
		var t = Ra.current;
		K(Ra), e._currentValue = t;
	}
	function Wa(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function Ga(e, t) {
		za = e, Va = Ba = null, e = e.dependencies, e !== null && e.firstContext !== null && ((e.lanes & t) !== 0 && (Ns = !0), e.firstContext = null);
	}
	function Ka(e) {
		var t = e._currentValue;
		if (Va !== e) if (e = {
			context: e,
			memoizedValue: t,
			next: null
		}, Ba === null) {
			if (za === null) throw Error(r(308));
			Ba = e, za.dependencies = {
				lanes: 0,
				firstContext: e
			};
		} else Ba = Ba.next = e;
		return t;
	}
	var qa = null;
	function Ja(e) {
		qa === null ? qa = [e] : qa.push(e);
	}
	function Ya(e, t, n, r) {
		var i = t.interleaved;
		return i === null ? (n.next = n, Ja(t)) : (n.next = i.next, i.next = n), t.interleaved = n, Xa(e, r);
	}
	function Xa(e, t) {
		e.lanes |= t;
		var n = e.alternate;
		for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null;) e.childLanes |= t, n = e.alternate, n !== null && (n.childLanes |= t), n = e, e = e.return;
		return n.tag === 3 ? n.stateNode : null;
	}
	var Za = !1;
	function Qa(e) {
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
	function $a(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			effects: e.effects
		});
	}
	function eo(e, t) {
		return {
			eventTime: e,
			lane: t,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function to(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, Q & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, Xa(e, n);
		}
		return i = r.interleaved, i === null ? (t.next = t, Ja(r)) : (t.next = i.next, i.next = t), r.interleaved = t, Xa(e, n);
	}
	function no(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194240)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, Lt(e, n);
		}
	}
	function ro(e, t) {
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
	function io(e, t, n, r) {
		var i = e.updateQueue;
		Za = !1;
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
								d = R({}, d, f);
								break a;
							case 2: Za = !0;
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
			Yc |= o, e.lanes = o, e.memoizedState = d;
		}
	}
	function ao(e, t, n) {
		if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
			var i = e[t], a = i.callback;
			if (a !== null) {
				if (i.callback = null, i = n, typeof a != "function") throw Error(r(191, a));
				a.call(i);
			}
		}
	}
	var oo = {}, so = Hi(oo), co = Hi(oo), lo = Hi(oo);
	function uo(e) {
		if (e === oo) throw Error(r(174));
		return e;
	}
	function fo(e, t) {
		switch (q(lo, t), q(co, e), q(so, oo), e = t.nodeType, e) {
			case 9:
			case 11:
				t = (t = t.documentElement) ? t.namespaceURI : Ce(null, "");
				break;
			default: e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = Ce(t, e);
		}
		K(so), q(so, t);
	}
	function po() {
		K(so), K(co), K(lo);
	}
	function mo(e) {
		uo(lo.current);
		var t = uo(so.current), n = Ce(t, e.type);
		t !== n && (q(co, e), q(so, n));
	}
	function ho(e) {
		co.current === e && (K(so), K(co));
	}
	var Y = Hi(0);
	function go(e) {
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
	var _o = [];
	function vo() {
		for (var e = 0; e < _o.length; e++) _o[e]._workInProgressVersionPrimary = null;
		_o.length = 0;
	}
	var yo = C.ReactCurrentDispatcher, bo = C.ReactCurrentBatchConfig, xo = 0, X = null, So = null, Co = null, wo = !1, To = !1, Eo = 0, Do = 0;
	function Oo() {
		throw Error(r(321));
	}
	function ko(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!Er(e[n], t[n])) return !1;
		return !0;
	}
	function Ao(e, t, n, i, a, o) {
		if (xo = o, X = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, yo.current = e === null || e.memoizedState === null ? ps : ms, e = n(i, a), To) {
			o = 0;
			do {
				if (To = !1, Eo = 0, 25 <= o) throw Error(r(301));
				o += 1, Co = So = null, t.updateQueue = null, yo.current = hs, e = n(i, a);
			} while (To);
		}
		if (yo.current = fs, t = So !== null && So.next !== null, xo = 0, Co = So = X = null, wo = !1, t) throw Error(r(300));
		return e;
	}
	function jo() {
		var e = Eo !== 0;
		return Eo = 0, e;
	}
	function Mo() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return Co === null ? X.memoizedState = Co = e : Co = Co.next = e, Co;
	}
	function No() {
		if (So === null) {
			var e = X.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = So.next;
		var t = Co === null ? X.memoizedState : Co.next;
		if (t !== null) Co = t, So = e;
		else {
			if (e === null) throw Error(r(310));
			So = e, e = {
				memoizedState: So.memoizedState,
				baseState: So.baseState,
				baseQueue: So.baseQueue,
				queue: So.queue,
				next: null
			}, Co === null ? X.memoizedState = Co = e : Co = Co.next = e;
		}
		return Co;
	}
	function Po(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function Fo(e) {
		var t = No(), n = t.queue;
		if (n === null) throw Error(r(311));
		n.lastRenderedReducer = e;
		var i = So, a = i.baseQueue, o = n.pending;
		if (o !== null) {
			if (a !== null) {
				var s = a.next;
				a.next = o.next, o.next = s;
			}
			i.baseQueue = a = o, n.pending = null;
		}
		if (a !== null) {
			o = a.next, i = i.baseState;
			var c = s = null, l = null, u = o;
			do {
				var d = u.lane;
				if ((xo & d) === d) l !== null && (l = l.next = {
					lane: 0,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}), i = u.hasEagerState ? u.eagerState : e(i, u.action);
				else {
					var f = {
						lane: d,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					};
					l === null ? (c = l = f, s = i) : l = l.next = f, X.lanes |= d, Yc |= d;
				}
				u = u.next;
			} while (u !== null && u !== o);
			l === null ? s = i : l.next = c, Er(i, t.memoizedState) || (Ns = !0), t.memoizedState = i, t.baseState = s, t.baseQueue = l, n.lastRenderedState = i;
		}
		if (e = n.interleaved, e !== null) {
			a = e;
			do
				o = a.lane, X.lanes |= o, Yc |= o, a = a.next;
			while (a !== e);
		} else a === null && (n.lanes = 0);
		return [t.memoizedState, n.dispatch];
	}
	function Io(e) {
		var t = No(), n = t.queue;
		if (n === null) throw Error(r(311));
		n.lastRenderedReducer = e;
		var i = n.dispatch, a = n.pending, o = t.memoizedState;
		if (a !== null) {
			n.pending = null;
			var s = a = a.next;
			do
				o = e(o, s.action), s = s.next;
			while (s !== a);
			Er(o, t.memoizedState) || (Ns = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, i];
	}
	function Lo() {}
	function Ro(e, t) {
		var n = X, i = No(), a = t(), o = !Er(i.memoizedState, a);
		if (o && (i.memoizedState = a, Ns = !0), i = i.queue, Xo(Vo.bind(null, n, i, e), [e]), i.getSnapshot !== t || o || Co !== null && Co.memoizedState.tag & 1) {
			if (n.flags |= 2048, Go(9, Bo.bind(null, n, i, a, t), void 0, null), Hc === null) throw Error(r(349));
			xo & 30 || zo(n, t, a);
		}
		return a;
	}
	function zo(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = X.updateQueue, t === null ? (t = {
			lastEffect: null,
			stores: null
		}, X.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function Bo(e, t, n, r) {
		t.value = n, t.getSnapshot = r, Ho(t) && Uo(e);
	}
	function Vo(e, t, n) {
		return n(function() {
			Ho(t) && Uo(e);
		});
	}
	function Ho(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !Er(e, n);
		} catch {
			return !0;
		}
	}
	function Uo(e) {
		var t = Xa(e, 1);
		t !== null && hl(t, e, 1, -1);
	}
	function Wo(e) {
		var t = Mo();
		return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = {
			pending: null,
			interleaved: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: Po,
			lastRenderedState: e
		}, t.queue = e, e = e.dispatch = cs.bind(null, X, e), [t.memoizedState, e];
	}
	function Go(e, t, n, r) {
		return e = {
			tag: e,
			create: t,
			destroy: n,
			deps: r,
			next: null
		}, t = X.updateQueue, t === null ? (t = {
			lastEffect: null,
			stores: null
		}, X.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e)), e;
	}
	function Ko() {
		return No().memoizedState;
	}
	function qo(e, t, n, r) {
		var i = Mo();
		X.flags |= e, i.memoizedState = Go(1 | t, n, void 0, r === void 0 ? null : r);
	}
	function Jo(e, t, n, r) {
		var i = No();
		r = r === void 0 ? null : r;
		var a = void 0;
		if (So !== null) {
			var o = So.memoizedState;
			if (a = o.destroy, r !== null && ko(r, o.deps)) {
				i.memoizedState = Go(t, n, a, r);
				return;
			}
		}
		X.flags |= e, i.memoizedState = Go(1 | t, n, a, r);
	}
	function Yo(e, t) {
		return qo(8390656, 8, e, t);
	}
	function Xo(e, t) {
		return Jo(2048, 8, e, t);
	}
	function Zo(e, t) {
		return Jo(4, 2, e, t);
	}
	function Qo(e, t) {
		return Jo(4, 4, e, t);
	}
	function $o(e, t) {
		if (typeof t == "function") return e = e(), t(e), function() {
			t(null);
		};
		if (t != null) return e = e(), t.current = e, function() {
			t.current = null;
		};
	}
	function es(e, t, n) {
		return n = n == null ? null : n.concat([e]), Jo(4, 4, $o.bind(null, t, e), n);
	}
	function ts() {}
	function ns(e, t) {
		var n = No();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return r !== null && t !== null && ko(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function rs(e, t) {
		var n = No();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return r !== null && t !== null && ko(t, r[1]) ? r[0] : (e = e(), n.memoizedState = [e, t], e);
	}
	function is(e, t, n) {
		return xo & 21 ? (Er(n, t) || (n = Nt(), X.lanes |= n, Yc |= n, e.baseState = !0), t) : (e.baseState && (e.baseState = !1, Ns = !0), e.memoizedState = n);
	}
	function as(e, t) {
		var n = W;
		W = n !== 0 && 4 > n ? n : 4, e(!0);
		var r = bo.transition;
		bo.transition = {};
		try {
			e(!1), t();
		} finally {
			W = n, bo.transition = r;
		}
	}
	function os() {
		return No().memoizedState;
	}
	function ss(e, t, n) {
		var r = ml(e);
		if (n = {
			lane: r,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, ls(e)) us(t, n);
		else if (n = Ya(e, t, n, r), n !== null) {
			var i = pl();
			hl(n, e, r, i), ds(n, t, r);
		}
	}
	function cs(e, t, n) {
		var r = ml(e), i = {
			lane: r,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (ls(e)) us(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, Er(s, o)) {
					var c = t.interleaved;
					c === null ? (i.next = i, Ja(t)) : (i.next = c.next, c.next = i), t.interleaved = i;
					return;
				}
			} catch {}
			n = Ya(e, t, i, r), n !== null && (i = pl(), hl(n, e, r, i), ds(n, t, r));
		}
	}
	function ls(e) {
		var t = e.alternate;
		return e === X || t !== null && t === X;
	}
	function us(e, t) {
		To = wo = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function ds(e, t, n) {
		if (n & 4194240) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, Lt(e, n);
		}
	}
	var fs = {
		readContext: Ka,
		useCallback: Oo,
		useContext: Oo,
		useEffect: Oo,
		useImperativeHandle: Oo,
		useInsertionEffect: Oo,
		useLayoutEffect: Oo,
		useMemo: Oo,
		useReducer: Oo,
		useRef: Oo,
		useState: Oo,
		useDebugValue: Oo,
		useDeferredValue: Oo,
		useTransition: Oo,
		useMutableSource: Oo,
		useSyncExternalStore: Oo,
		useId: Oo,
		unstable_isNewReconciler: !1
	}, ps = {
		readContext: Ka,
		useCallback: function(e, t) {
			return Mo().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: Ka,
		useEffect: Yo,
		useImperativeHandle: function(e, t, n) {
			return n = n == null ? null : n.concat([e]), qo(4194308, 4, $o.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return qo(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			return qo(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = Mo();
			return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
		},
		useReducer: function(e, t, n) {
			var r = Mo();
			return t = n === void 0 ? t : n(t), r.memoizedState = r.baseState = t, e = {
				pending: null,
				interleaved: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: t
			}, r.queue = e, e = e.dispatch = ss.bind(null, X, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = Mo();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: Wo,
		useDebugValue: ts,
		useDeferredValue: function(e) {
			return Mo().memoizedState = e;
		},
		useTransition: function() {
			var e = Wo(!1), t = e[0];
			return e = as.bind(null, e[1]), Mo().memoizedState = e, [t, e];
		},
		useMutableSource: function() {},
		useSyncExternalStore: function(e, t, n) {
			var i = X, a = Mo();
			if (J) {
				if (n === void 0) throw Error(r(407));
				n = n();
			} else {
				if (n = t(), Hc === null) throw Error(r(349));
				xo & 30 || zo(i, t, n);
			}
			a.memoizedState = n;
			var o = {
				value: n,
				getSnapshot: t
			};
			return a.queue = o, Yo(Vo.bind(null, i, o, e), [e]), i.flags |= 2048, Go(9, Bo.bind(null, i, o, n, t), void 0, null), n;
		},
		useId: function() {
			var e = Mo(), t = Hc.identifierPrefix;
			if (J) {
				var n = ma, r = pa;
				n = (r & ~(1 << 32 - St(r) - 1)).toString(32) + n, t = ":" + t + "R" + n, n = Eo++, 0 < n && (t += "H" + n.toString(32)), t += ":";
			} else n = Do++, t = ":" + t + "r" + n.toString(32) + ":";
			return e.memoizedState = t;
		},
		unstable_isNewReconciler: !1
	}, ms = {
		readContext: Ka,
		useCallback: ns,
		useContext: Ka,
		useEffect: Xo,
		useImperativeHandle: es,
		useInsertionEffect: Zo,
		useLayoutEffect: Qo,
		useMemo: rs,
		useReducer: Fo,
		useRef: Ko,
		useState: function() {
			return Fo(Po);
		},
		useDebugValue: ts,
		useDeferredValue: function(e) {
			return is(No(), So.memoizedState, e);
		},
		useTransition: function() {
			return [Fo(Po)[0], No().memoizedState];
		},
		useMutableSource: Lo,
		useSyncExternalStore: Ro,
		useId: os,
		unstable_isNewReconciler: !1
	}, hs = {
		readContext: Ka,
		useCallback: ns,
		useContext: Ka,
		useEffect: Xo,
		useImperativeHandle: es,
		useInsertionEffect: Zo,
		useLayoutEffect: Qo,
		useMemo: rs,
		useReducer: Io,
		useRef: Ko,
		useState: function() {
			return Io(Po);
		},
		useDebugValue: ts,
		useDeferredValue: function(e) {
			var t = No();
			return So === null ? t.memoizedState = e : is(t, So.memoizedState, e);
		},
		useTransition: function() {
			return [Io(Po)[0], No().memoizedState];
		},
		useMutableSource: Lo,
		useSyncExternalStore: Ro,
		useId: os,
		unstable_isNewReconciler: !1
	};
	function gs(e, t) {
		if (e && e.defaultProps) {
			for (var n in t = R({}, t), e = e.defaultProps, e) t[n] === void 0 && (t[n] = e[n]);
			return t;
		}
		return t;
	}
	function _s(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : R({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var vs = {
		isMounted: function(e) {
			return (e = e._reactInternals) ? rt(e) === e : !1;
		},
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = pl(), i = ml(e), a = eo(r, i);
			a.payload = t, n != null && (a.callback = n), t = to(e, a, i), t !== null && (hl(t, e, i, r), no(t, e, i));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = pl(), i = ml(e), a = eo(r, i);
			a.tag = 1, a.payload = t, n != null && (a.callback = n), t = to(e, a, i), t !== null && (hl(t, e, i, r), no(t, e, i));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = pl(), r = ml(e), i = eo(n, r);
			i.tag = 2, t != null && (i.callback = t), t = to(e, i, r), t !== null && (hl(t, e, r, n), no(t, e, r));
		}
	};
	function ys(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Dr(n, r) || !Dr(i, a) : !0;
	}
	function bs(e, t, n) {
		var r = !1, i = Ui, a = t.contextType;
		return typeof a == "object" && a ? a = Ka(a) : (i = Ji(t) ? Ki : Wi.current, r = t.contextTypes, a = (r = r != null) ? qi(e, i) : Ui), t = new t(n, a), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = vs, e.stateNode = t, t._reactInternals = e, r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = i, e.__reactInternalMemoizedMaskedChildContext = a), t;
	}
	function xs(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && vs.enqueueReplaceState(t, t.state, null);
	}
	function Ss(e, t, n, r) {
		var i = e.stateNode;
		i.props = n, i.state = e.memoizedState, i.refs = {}, Qa(e);
		var a = t.contextType;
		typeof a == "object" && a ? i.context = Ka(a) : (a = Ji(t) ? Ki : Wi.current, i.context = qi(e, a)), i.state = e.memoizedState, a = t.getDerivedStateFromProps, typeof a == "function" && (_s(e, t, a, n), i.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof i.getSnapshotBeforeUpdate == "function" || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (t = i.state, typeof i.componentWillMount == "function" && i.componentWillMount(), typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount(), t !== i.state && vs.enqueueReplaceState(i, i.state, null), io(e, n, i, r), i.state = e.memoizedState), typeof i.componentDidMount == "function" && (e.flags |= 4194308);
	}
	function Cs(e, t) {
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
	function ws(e, t, n) {
		return {
			value: e,
			source: null,
			stack: n ?? null,
			digest: t ?? null
		};
	}
	function Ts(e, t) {
		try {
			console.error(t.value);
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	var Es = typeof WeakMap == "function" ? WeakMap : Map;
	function Ds(e, t, n) {
		n = eo(-1, n), n.tag = 3, n.payload = { element: null };
		var r = t.value;
		return n.callback = function() {
			rl || (rl = !0, il = r), Ts(e, t);
		}, n;
	}
	function Os(e, t, n) {
		n = eo(-1, n), n.tag = 3;
		var r = e.type.getDerivedStateFromError;
		if (typeof r == "function") {
			var i = t.value;
			n.payload = function() {
				return r(i);
			}, n.callback = function() {
				Ts(e, t);
			};
		}
		var a = e.stateNode;
		return a !== null && typeof a.componentDidCatch == "function" && (n.callback = function() {
			Ts(e, t), typeof r != "function" && (al === null ? al = /* @__PURE__ */ new Set([this]) : al.add(this));
			var n = t.stack;
			this.componentDidCatch(t.value, { componentStack: n === null ? "" : n });
		}), n;
	}
	function ks(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new Es();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (i.add(n), e = zl.bind(null, e, t, n), t.then(e, e));
	}
	function As(e) {
		do {
			var t;
			if ((t = e.tag === 13) && (t = e.memoizedState, t = t === null ? !0 : t.dehydrated !== null), t) return e;
			e = e.return;
		} while (e !== null);
		return null;
	}
	function js(e, t, n, r, i) {
		return e.mode & 1 ? (e.flags |= 65536, e.lanes = i, e) : (e === t ? e.flags |= 65536 : (e.flags |= 128, n.flags |= 131072, n.flags &= -52805, n.tag === 1 && (n.alternate === null ? n.tag = 17 : (t = eo(-1, 1), t.tag = 2, to(n, t, 1))), n.lanes |= 1), e);
	}
	var Ms = C.ReactCurrentOwner, Ns = !1;
	function Ps(e, t, n, r) {
		t.child = e === null ? La(t, null, n, r) : Ia(t, e.child, n, r);
	}
	function Fs(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		return Ga(t, i), r = Ao(e, t, n, r, a, i), n = jo(), e !== null && !Ns ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~i, tc(e, t, i)) : (J && n && _a(t), t.flags |= 1, Ps(e, t, r, i), t.child);
	}
	function Is(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !ql(a) && a.defaultProps === void 0 && n.compare === null && n.defaultProps === void 0 ? (t.tag = 15, t.type = a, Ls(e, t, a, r, i)) : (e = Xl(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, (e.lanes & i) === 0) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? Dr : n, n(o, r) && e.ref === t.ref) return tc(e, t, i);
		}
		return t.flags |= 1, e = Yl(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function Ls(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Dr(a, r) && e.ref === t.ref) if (Ns = !1, t.pendingProps = r = a, (e.lanes & i) !== 0) e.flags & 131072 && (Ns = !0);
			else return t.lanes = e.lanes, tc(e, t, i);
		}
		return Bs(e, t, n, r, i);
	}
	function Rs(e, t, n) {
		var r = t.pendingProps, i = r.children, a = e === null ? null : e.memoizedState;
		if (r.mode === "hidden") if (!(t.mode & 1)) t.memoizedState = {
			baseLanes: 0,
			cachePool: null,
			transitions: null
		}, q(Kc, Gc), Gc |= n;
		else {
			if (!(n & 1073741824)) return e = a === null ? n : a.baseLanes | n, t.lanes = t.childLanes = 1073741824, t.memoizedState = {
				baseLanes: e,
				cachePool: null,
				transitions: null
			}, t.updateQueue = null, q(Kc, Gc), Gc |= e, null;
			t.memoizedState = {
				baseLanes: 0,
				cachePool: null,
				transitions: null
			}, r = a === null ? n : a.baseLanes, q(Kc, Gc), Gc |= r;
		}
		else a === null ? r = n : (r = a.baseLanes | n, t.memoizedState = null), q(Kc, Gc), Gc |= r;
		return Ps(e, t, i, n), t.child;
	}
	function zs(e, t) {
		var n = t.ref;
		(e === null && n !== null || e !== null && e.ref !== n) && (t.flags |= 512, t.flags |= 2097152);
	}
	function Bs(e, t, n, r, i) {
		var a = Ji(n) ? Ki : Wi.current;
		return a = qi(t, a), Ga(t, i), n = Ao(e, t, n, r, a, i), r = jo(), e !== null && !Ns ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~i, tc(e, t, i)) : (J && r && _a(t), t.flags |= 1, Ps(e, t, n, i), t.child);
	}
	function Vs(e, t, n, r, i) {
		if (Ji(n)) {
			var a = !0;
			Qi(t);
		} else a = !1;
		if (Ga(t, i), t.stateNode === null) ec(e, t), bs(t, n, r), Ss(t, n, r, i), r = !0;
		else if (e === null) {
			var o = t.stateNode, s = t.memoizedProps;
			o.props = s;
			var c = o.context, l = n.contextType;
			typeof l == "object" && l ? l = Ka(l) : (l = Ji(n) ? Ki : Wi.current, l = qi(t, l));
			var u = n.getDerivedStateFromProps, d = typeof u == "function" || typeof o.getSnapshotBeforeUpdate == "function";
			d || typeof o.UNSAFE_componentWillReceiveProps != "function" && typeof o.componentWillReceiveProps != "function" || (s !== r || c !== l) && xs(t, o, r, l), Za = !1;
			var f = t.memoizedState;
			o.state = f, io(t, r, o, i), c = t.memoizedState, s !== r || f !== c || Gi.current || Za ? (typeof u == "function" && (_s(t, n, u, r), c = t.memoizedState), (s = Za || ys(t, n, s, r, f, c, l)) ? (d || typeof o.UNSAFE_componentWillMount != "function" && typeof o.componentWillMount != "function" || (typeof o.componentWillMount == "function" && o.componentWillMount(), typeof o.UNSAFE_componentWillMount == "function" && o.UNSAFE_componentWillMount()), typeof o.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof o.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = c), o.props = r, o.state = c, o.context = l, r = s) : (typeof o.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			o = t.stateNode, $a(e, t), s = t.memoizedProps, l = t.type === t.elementType ? s : gs(t.type, s), o.props = l, d = t.pendingProps, f = o.context, c = n.contextType, typeof c == "object" && c ? c = Ka(c) : (c = Ji(n) ? Ki : Wi.current, c = qi(t, c));
			var p = n.getDerivedStateFromProps;
			(u = typeof p == "function" || typeof o.getSnapshotBeforeUpdate == "function") || typeof o.UNSAFE_componentWillReceiveProps != "function" && typeof o.componentWillReceiveProps != "function" || (s !== d || f !== c) && xs(t, o, r, c), Za = !1, f = t.memoizedState, o.state = f, io(t, r, o, i);
			var m = t.memoizedState;
			s !== d || f !== m || Gi.current || Za ? (typeof p == "function" && (_s(t, n, p, r), m = t.memoizedState), (l = Za || ys(t, n, l, r, f, m, c) || !1) ? (u || typeof o.UNSAFE_componentWillUpdate != "function" && typeof o.componentWillUpdate != "function" || (typeof o.componentWillUpdate == "function" && o.componentWillUpdate(r, m, c), typeof o.UNSAFE_componentWillUpdate == "function" && o.UNSAFE_componentWillUpdate(r, m, c)), typeof o.componentDidUpdate == "function" && (t.flags |= 4), typeof o.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof o.componentDidUpdate != "function" || s === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof o.getSnapshotBeforeUpdate != "function" || s === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = m), o.props = r, o.state = m, o.context = c, r = l) : (typeof o.componentDidUpdate != "function" || s === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof o.getSnapshotBeforeUpdate != "function" || s === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return Hs(e, t, n, r, a, i);
	}
	function Hs(e, t, n, r, i, a) {
		zs(e, t);
		var o = (t.flags & 128) != 0;
		if (!r && !o) return i && $i(t, n, !1), tc(e, t, a);
		r = t.stateNode, Ms.current = t;
		var s = o && typeof n.getDerivedStateFromError != "function" ? null : r.render();
		return t.flags |= 1, e !== null && o ? (t.child = Ia(t, e.child, null, a), t.child = Ia(t, null, s, a)) : Ps(e, t, s, a), t.memoizedState = r.state, i && $i(t, n, !0), t.child;
	}
	function Us(e) {
		var t = e.stateNode;
		t.pendingContext ? Xi(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Xi(e, t.context, !1), fo(e, t.containerInfo);
	}
	function Ws(e, t, n, r, i) {
		return ka(), Aa(i), t.flags |= 256, Ps(e, t, n, r), t.child;
	}
	var Gs = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0
	};
	function Ks(e) {
		return {
			baseLanes: e,
			cachePool: null,
			transitions: null
		};
	}
	function qs(e, t, n) {
		var r = t.pendingProps, i = Y.current, a = !1, o = (t.flags & 128) != 0, s;
		if ((s = o) || (s = e !== null && e.memoizedState === null ? !1 : (i & 2) != 0), s ? (a = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (i |= 1), q(Y, i & 1), e === null) return Ta(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? (t.mode & 1 ? e.data === "$!" ? t.lanes = 8 : t.lanes = 1073741824 : t.lanes = 1, null) : (o = r.children, e = r.fallback, a ? (r = t.mode, a = t.child, o = {
			mode: "hidden",
			children: o
		}, !(r & 1) && a !== null ? (a.childLanes = 0, a.pendingProps = o) : a = Ql(o, r, 0, null), e = Zl(e, r, n, null), a.return = t, e.return = t, a.sibling = e, t.child = a, t.child.memoizedState = Ks(n), t.memoizedState = Gs, e) : Js(t, o));
		if (i = e.memoizedState, i !== null && (s = i.dehydrated, s !== null)) return Xs(e, t, o, r, s, i, n);
		if (a) {
			a = r.fallback, o = t.mode, i = e.child, s = i.sibling;
			var c = {
				mode: "hidden",
				children: r.children
			};
			return !(o & 1) && t.child !== i ? (r = t.child, r.childLanes = 0, r.pendingProps = c, t.deletions = null) : (r = Yl(i, c), r.subtreeFlags = i.subtreeFlags & 14680064), s === null ? (a = Zl(a, o, n, null), a.flags |= 2) : a = Yl(s, a), a.return = t, r.return = t, r.sibling = a, t.child = r, r = a, a = t.child, o = e.child.memoizedState, o = o === null ? Ks(n) : {
				baseLanes: o.baseLanes | n,
				cachePool: null,
				transitions: o.transitions
			}, a.memoizedState = o, a.childLanes = e.childLanes & ~n, t.memoizedState = Gs, r;
		}
		return a = e.child, e = a.sibling, r = Yl(a, {
			mode: "visible",
			children: r.children
		}), !(t.mode & 1) && (r.lanes = n), r.return = t, r.sibling = null, e !== null && (n = t.deletions, n === null ? (t.deletions = [e], t.flags |= 16) : n.push(e)), t.child = r, t.memoizedState = null, r;
	}
	function Js(e, t) {
		return t = Ql({
			mode: "visible",
			children: t
		}, e.mode, 0, null), t.return = e, e.child = t;
	}
	function Ys(e, t, n, r) {
		return r !== null && Aa(r), Ia(t, e.child, null, n), e = Js(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function Xs(e, t, n, i, a, o, s) {
		if (n) return t.flags & 256 ? (t.flags &= -257, i = ws(Error(r(422))), Ys(e, t, s, i)) : t.memoizedState === null ? (o = i.fallback, a = t.mode, i = Ql({
			mode: "visible",
			children: i.children
		}, a, 0, null), o = Zl(o, a, s, null), o.flags |= 2, i.return = t, o.return = t, i.sibling = o, t.child = i, t.mode & 1 && Ia(t, e.child, null, s), t.child.memoizedState = Ks(s), t.memoizedState = Gs, o) : (t.child = e.child, t.flags |= 128, null);
		if (!(t.mode & 1)) return Ys(e, t, s, null);
		if (a.data === "$!") {
			if (i = a.nextSibling && a.nextSibling.dataset, i) var c = i.dgst;
			return i = c, o = Error(r(419)), i = ws(o, i, void 0), Ys(e, t, s, i);
		}
		if (c = (s & e.childLanes) !== 0, Ns || c) {
			if (i = Hc, i !== null) {
				switch (s & -s) {
					case 4:
						a = 2;
						break;
					case 16:
						a = 8;
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
						a = 32;
						break;
					case 536870912:
						a = 268435456;
						break;
					default: a = 0;
				}
				a = (a & (i.suspendedLanes | s)) === 0 ? a : 0, a !== 0 && a !== o.retryLane && (o.retryLane = a, Xa(e, a), hl(i, e, a, -1));
			}
			return kl(), i = ws(Error(r(421))), Ys(e, t, s, i);
		}
		return a.data === "$?" ? (t.flags |= 128, t.child = e.child, t = Vl.bind(null, e), a._reactRetry = t, null) : (e = o.treeContext, ba = Di(a.nextSibling), ya = t, J = !0, xa = null, e !== null && (ua[da++] = pa, ua[da++] = ma, ua[da++] = fa, pa = e.id, ma = e.overflow, fa = t), t = Js(t, i.children), t.flags |= 4096, t);
	}
	function Zs(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), Wa(e.return, t, n);
	}
	function Qs(e, t, n, r, i) {
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
	function $s(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		if (Ps(e, t, r.children, n), r = Y.current, r & 2) r = r & 1 | 2, t.flags |= 128;
		else {
			if (e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
				if (e.tag === 13) e.memoizedState !== null && Zs(e, n, t);
				else if (e.tag === 19) Zs(e, n, t);
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
		if (q(Y, r), !(t.mode & 1)) t.memoizedState = null;
		else switch (i) {
			case "forwards":
				for (n = t.child, i = null; n !== null;) e = n.alternate, e !== null && go(e) === null && (i = n), n = n.sibling;
				n = i, n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), Qs(t, !1, i, n, a);
				break;
			case "backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && go(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				Qs(t, !0, n, null, a);
				break;
			case "together":
				Qs(t, !1, null, null, void 0);
				break;
			default: t.memoizedState = null;
		}
		return t.child;
	}
	function ec(e, t) {
		!(t.mode & 1) && e !== null && (e.alternate = null, t.alternate = null, t.flags |= 2);
	}
	function tc(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), Yc |= t.lanes, (n & t.childLanes) === 0) return null;
		if (e !== null && t.child !== e.child) throw Error(r(153));
		if (t.child !== null) {
			for (e = t.child, n = Yl(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = Yl(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function nc(e, t, n) {
		switch (t.tag) {
			case 3:
				Us(t), ka();
				break;
			case 5:
				mo(t);
				break;
			case 1:
				Ji(t.type) && Qi(t);
				break;
			case 4:
				fo(t, t.stateNode.containerInfo);
				break;
			case 10:
				var r = t.type._context, i = t.memoizedProps.value;
				q(Ra, r._currentValue), r._currentValue = i;
				break;
			case 13:
				if (r = t.memoizedState, r !== null) return r.dehydrated === null ? (n & t.child.childLanes) === 0 ? (q(Y, Y.current & 1), e = tc(e, t, n), e === null ? null : e.sibling) : qs(e, t, n) : (q(Y, Y.current & 1), t.flags |= 128, null);
				q(Y, Y.current & 1);
				break;
			case 19:
				if (r = (n & t.childLanes) !== 0, e.flags & 128) {
					if (r) return $s(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), q(Y, Y.current), r) break;
				return null;
			case 22:
			case 23: return t.lanes = 0, Rs(e, t, n);
		}
		return tc(e, t, n);
	}
	var rc = function(e, t) {
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
	}, ic = function(e, t, n, r) {
		var i = e.memoizedProps;
		if (i !== r) {
			e = t.stateNode, uo(so.current);
			var o = null;
			switch (n) {
				case "input":
					i = ue(e, i), r = ue(e, r), o = [];
					break;
				case "select":
					i = R({}, i, { value: void 0 }), r = R({}, r, { value: void 0 }), o = [];
					break;
				case "textarea":
					i = ve(e, i), r = ve(e, r), o = [];
					break;
				default: typeof i.onClick != "function" && typeof r.onClick == "function" && (e.onclick = _i);
			}
			Me(n, r);
			var s;
			for (u in n = null, i) if (!r.hasOwnProperty(u) && i.hasOwnProperty(u) && i[u] != null) if (u === "style") {
				var c = i[u];
				for (s in c) c.hasOwnProperty(s) && (n ||= {}, n[s] = "");
			} else u !== "dangerouslySetInnerHTML" && u !== "children" && u !== "suppressContentEditableWarning" && u !== "suppressHydrationWarning" && u !== "autoFocus" && (a.hasOwnProperty(u) ? o ||= [] : (o ||= []).push(u, null));
			for (u in r) {
				var l = r[u];
				if (c = i?.[u], r.hasOwnProperty(u) && l !== c && (l != null || c != null)) if (u === "style") if (c) {
					for (s in c) !c.hasOwnProperty(s) || l && l.hasOwnProperty(s) || (n ||= {}, n[s] = "");
					for (s in l) l.hasOwnProperty(s) && c[s] !== l[s] && (n ||= {}, n[s] = l[s]);
				} else n || (o ||= [], o.push(u, n)), n = l;
				else u === "dangerouslySetInnerHTML" ? (l = l ? l.__html : void 0, c = c ? c.__html : void 0, l != null && c !== l && (o ||= []).push(u, l)) : u === "children" ? typeof l != "string" && typeof l != "number" || (o ||= []).push(u, "" + l) : u !== "suppressContentEditableWarning" && u !== "suppressHydrationWarning" && (a.hasOwnProperty(u) ? (l != null && u === "onScroll" && G("scroll", e), o || c === l || (o = [])) : (o ||= []).push(u, l));
			}
			n && (o ||= []).push("style", n);
			var u = o;
			(t.updateQueue = u) && (t.flags |= 4);
		}
	}, ac = function(e, t, n, r) {
		n !== r && (t.flags |= 4);
	};
	function oc(e, t) {
		if (!J) switch (e.tailMode) {
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
	function sc(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 14680064, r |= i.flags & 14680064, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function cc(e, t, n) {
		var i = t.pendingProps;
		switch (va(t), t.tag) {
			case 2:
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return sc(t), null;
			case 1: return Ji(t.type) && Yi(), sc(t), null;
			case 3: return i = t.stateNode, po(), K(Gi), K(Wi), vo(), i.pendingContext && (i.context = i.pendingContext, i.pendingContext = null), (e === null || e.child === null) && (Da(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, xa !== null && (yl(xa), xa = null))), sc(t), null;
			case 5:
				ho(t);
				var o = uo(lo.current);
				if (n = t.type, e !== null && t.stateNode != null) ic(e, t, n, i, o), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
				else {
					if (!i) {
						if (t.stateNode === null) throw Error(r(166));
						return sc(t), null;
					}
					if (e = uo(so.current), Da(t)) {
						i = t.stateNode, n = t.type;
						var s = t.memoizedProps;
						switch (i[Ai] = t, i[ji] = s, e = (t.mode & 1) != 0, n) {
							case "dialog":
								G("cancel", i), G("close", i);
								break;
							case "iframe":
							case "object":
							case "embed":
								G("load", i);
								break;
							case "video":
							case "audio":
								for (o = 0; o < ei.length; o++) G(ei[o], i);
								break;
							case "source":
								G("error", i);
								break;
							case "img":
							case "image":
							case "link":
								G("error", i), G("load", i);
								break;
							case "details":
								G("toggle", i);
								break;
							case "input":
								de(i, s), G("invalid", i);
								break;
							case "select":
								i._wrapperState = { wasMultiple: !!s.multiple }, G("invalid", i);
								break;
							case "textarea": ye(i, s), G("invalid", i);
						}
						for (var c in Me(n, s), o = null, s) if (s.hasOwnProperty(c)) {
							var l = s[c];
							c === "children" ? typeof l == "string" ? i.textContent !== l && (!0 !== s.suppressHydrationWarning && gi(i.textContent, l, e), o = ["children", l]) : typeof l == "number" && i.textContent !== "" + l && (!0 !== s.suppressHydrationWarning && gi(i.textContent, l, e), o = ["children", "" + l]) : a.hasOwnProperty(c) && l != null && c === "onScroll" && G("scroll", i);
						}
						switch (n) {
							case "input":
								se(i), me(i, s, !0);
								break;
							case "textarea":
								se(i), xe(i);
								break;
							case "select":
							case "option": break;
							default: typeof s.onClick == "function" && (i.onclick = _i);
						}
						i = o, t.updateQueue = i, i !== null && (t.flags |= 4);
					} else {
						c = o.nodeType === 9 ? o : o.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = Se(n)), e === "http://www.w3.org/1999/xhtml" ? n === "script" ? (e = c.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof i.is == "string" ? e = c.createElement(n, { is: i.is }) : (e = c.createElement(n), n === "select" && (c = e, i.multiple ? c.multiple = !0 : i.size && (c.size = i.size))) : e = c.createElementNS(e, n), e[Ai] = t, e[ji] = i, rc(e, t, !1, !1), t.stateNode = e;
						a: {
							switch (c = Ne(n, i), n) {
								case "dialog":
									G("cancel", e), G("close", e), o = i;
									break;
								case "iframe":
								case "object":
								case "embed":
									G("load", e), o = i;
									break;
								case "video":
								case "audio":
									for (o = 0; o < ei.length; o++) G(ei[o], e);
									o = i;
									break;
								case "source":
									G("error", e), o = i;
									break;
								case "img":
								case "image":
								case "link":
									G("error", e), G("load", e), o = i;
									break;
								case "details":
									G("toggle", e), o = i;
									break;
								case "input":
									de(e, i), o = ue(e, i), G("invalid", e);
									break;
								case "option":
									o = i;
									break;
								case "select":
									e._wrapperState = { wasMultiple: !!i.multiple }, o = R({}, i, { value: void 0 }), G("invalid", e);
									break;
								case "textarea":
									ye(e, i), o = ve(e, i), G("invalid", e);
									break;
								default: o = i;
							}
							for (s in Me(n, o), l = o, l) if (l.hasOwnProperty(s)) {
								var u = l[s];
								s === "style" ? Ae(e, u) : s === "dangerouslySetInnerHTML" ? (u = u ? u.__html : void 0, u != null && Te(e, u)) : s === "children" ? typeof u == "string" ? (n !== "textarea" || u !== "") && Ee(e, u) : typeof u == "number" && Ee(e, "" + u) : s !== "suppressContentEditableWarning" && s !== "suppressHydrationWarning" && s !== "autoFocus" && (a.hasOwnProperty(s) ? u != null && s === "onScroll" && G("scroll", e) : u != null && S(e, s, u, c));
							}
							switch (n) {
								case "input":
									se(e), me(e, i, !1);
									break;
								case "textarea":
									se(e), xe(e);
									break;
								case "option":
									i.value != null && e.setAttribute("value", "" + ie(i.value));
									break;
								case "select":
									e.multiple = !!i.multiple, s = i.value, s == null ? i.defaultValue != null && _e(e, !!i.multiple, i.defaultValue, !0) : _e(e, !!i.multiple, s, !1);
									break;
								default: typeof o.onClick == "function" && (e.onclick = _i);
							}
							switch (n) {
								case "button":
								case "input":
								case "select":
								case "textarea":
									i = !!i.autoFocus;
									break a;
								case "img":
									i = !0;
									break a;
								default: i = !1;
							}
						}
						i && (t.flags |= 4);
					}
					t.ref !== null && (t.flags |= 512, t.flags |= 2097152);
				}
				return sc(t), null;
			case 6:
				if (e && t.stateNode != null) ac(e, t, e.memoizedProps, i);
				else {
					if (typeof i != "string" && t.stateNode === null) throw Error(r(166));
					if (n = uo(lo.current), uo(so.current), Da(t)) {
						if (i = t.stateNode, n = t.memoizedProps, i[Ai] = t, (s = i.nodeValue !== n) && (e = ya, e !== null)) switch (e.tag) {
							case 3:
								gi(i.nodeValue, n, (e.mode & 1) != 0);
								break;
							case 5: !0 !== e.memoizedProps.suppressHydrationWarning && gi(i.nodeValue, n, (e.mode & 1) != 0);
						}
						s && (t.flags |= 4);
					} else i = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(i), i[Ai] = t, t.stateNode = i;
				}
				return sc(t), null;
			case 13:
				if (K(Y), i = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (J && ba !== null && t.mode & 1 && !(t.flags & 128)) Oa(), ka(), t.flags |= 98560, s = !1;
					else if (s = Da(t), i !== null && i.dehydrated !== null) {
						if (e === null) {
							if (!s) throw Error(r(318));
							if (s = t.memoizedState, s = s === null ? null : s.dehydrated, !s) throw Error(r(317));
							s[Ai] = t;
						} else ka(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						sc(t), s = !1;
					} else xa !== null && (yl(xa), xa = null), s = !0;
					if (!s) return t.flags & 65536 ? t : null;
				}
				return t.flags & 128 ? (t.lanes = n, t) : (i = i !== null, i !== (e !== null && e.memoizedState !== null) && i && (t.child.flags |= 8192, t.mode & 1 && (e === null || Y.current & 1 ? qc === 0 && (qc = 3) : kl())), t.updateQueue !== null && (t.flags |= 4), sc(t), null);
			case 4: return po(), e === null && oi(t.stateNode.containerInfo), sc(t), null;
			case 10: return Ua(t.type._context), sc(t), null;
			case 17: return Ji(t.type) && Yi(), sc(t), null;
			case 19:
				if (K(Y), s = t.memoizedState, s === null) return sc(t), null;
				if (i = (t.flags & 128) != 0, c = s.rendering, c === null) if (i) oc(s, !1);
				else {
					if (qc !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
						if (c = go(e), c !== null) {
							for (t.flags |= 128, oc(s, !1), i = c.updateQueue, i !== null && (t.updateQueue = i, t.flags |= 4), t.subtreeFlags = 0, i = n, n = t.child; n !== null;) s = n, e = i, s.flags &= 14680066, c = s.alternate, c === null ? (s.childLanes = 0, s.lanes = e, s.child = null, s.subtreeFlags = 0, s.memoizedProps = null, s.memoizedState = null, s.updateQueue = null, s.dependencies = null, s.stateNode = null) : (s.childLanes = c.childLanes, s.lanes = c.lanes, s.child = c.child, s.subtreeFlags = 0, s.deletions = null, s.memoizedProps = c.memoizedProps, s.memoizedState = c.memoizedState, s.updateQueue = c.updateQueue, s.type = c.type, e = c.dependencies, s.dependencies = e === null ? null : {
								lanes: e.lanes,
								firstContext: e.firstContext
							}), n = n.sibling;
							return q(Y, Y.current & 1 | 2), t.child;
						}
						e = e.sibling;
					}
					s.tail !== null && U() > tl && (t.flags |= 128, i = !0, oc(s, !1), t.lanes = 4194304);
				}
				else {
					if (!i) if (e = go(c), e !== null) {
						if (t.flags |= 128, i = !0, n = e.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), oc(s, !0), s.tail === null && s.tailMode === "hidden" && !c.alternate && !J) return sc(t), null;
					} else 2 * U() - s.renderingStartTime > tl && n !== 1073741824 && (t.flags |= 128, i = !0, oc(s, !1), t.lanes = 4194304);
					s.isBackwards ? (c.sibling = t.child, t.child = c) : (n = s.last, n === null ? t.child = c : n.sibling = c, s.last = c);
				}
				return s.tail === null ? (sc(t), null) : (t = s.tail, s.rendering = t, s.tail = t.sibling, s.renderingStartTime = U(), t.sibling = null, n = Y.current, q(Y, i ? n & 1 | 2 : n & 1), t);
			case 22:
			case 23: return Tl(), i = t.memoizedState !== null, e !== null && e.memoizedState !== null !== i && (t.flags |= 8192), i && t.mode & 1 ? Gc & 1073741824 && (sc(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : sc(t), null;
			case 24: return null;
			case 25: return null;
		}
		throw Error(r(156, t.tag));
	}
	function lc(e, t) {
		switch (va(t), t.tag) {
			case 1: return Ji(t.type) && Yi(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return po(), K(Gi), K(Wi), vo(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 5: return ho(t), null;
			case 13:
				if (K(Y), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(r(340));
					ka();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return K(Y), null;
			case 4: return po(), null;
			case 10: return Ua(t.type._context), null;
			case 22:
			case 23: return Tl(), null;
			case 24: return null;
			default: return null;
		}
	}
	var uc = !1, dc = !1, fc = typeof WeakSet == "function" ? WeakSet : Set, Z = null;
	function pc(e, t) {
		var n = e.ref;
		if (n !== null) if (typeof n == "function") try {
			n(null);
		} catch (n) {
			$(e, t, n);
		}
		else n.current = null;
	}
	function mc(e, t, n) {
		try {
			n();
		} catch (n) {
			$(e, t, n);
		}
	}
	var hc = !1;
	function gc(e, t) {
		if (vi = un, e = jr(), Mr(e)) {
			if ("selectionStart" in e) var n = {
				start: e.selectionStart,
				end: e.selectionEnd
			};
			else a: {
				n = (n = e.ownerDocument) && n.defaultView || window;
				var i = n.getSelection && n.getSelection();
				if (i && i.rangeCount !== 0) {
					n = i.anchorNode;
					var a = i.anchorOffset, o = i.focusNode;
					i = i.focusOffset;
					try {
						n.nodeType, o.nodeType;
					} catch {
						n = null;
						break a;
					}
					var s = 0, c = -1, l = -1, u = 0, d = 0, f = e, p = null;
					b: for (;;) {
						for (var m; f !== n || a !== 0 && f.nodeType !== 3 || (c = s + a), f !== o || i !== 0 && f.nodeType !== 3 || (l = s + i), f.nodeType === 3 && (s += f.nodeValue.length), (m = f.firstChild) !== null;) p = f, f = m;
						for (;;) {
							if (f === e) break b;
							if (p === n && ++u === a && (c = s), p === o && ++d === i && (l = s), (m = f.nextSibling) !== null) break;
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
		for (yi = {
			focusedElem: e,
			selectionRange: n
		}, un = !1, Z = t; Z !== null;) if (t = Z, e = t.child, t.subtreeFlags & 1028 && e !== null) e.return = t, Z = e;
		else for (; Z !== null;) {
			t = Z;
			try {
				var h = t.alternate;
				if (t.flags & 1024) switch (t.tag) {
					case 0:
					case 11:
					case 15: break;
					case 1:
						if (h !== null) {
							var g = h.memoizedProps, _ = h.memoizedState, v = t.stateNode;
							v.__reactInternalSnapshotBeforeUpdate = v.getSnapshotBeforeUpdate(t.elementType === t.type ? g : gs(t.type, g), _);
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
					default: throw Error(r(163));
				}
			} catch (e) {
				$(t, t.return, e);
			}
			if (e = t.sibling, e !== null) {
				e.return = t.return, Z = e;
				break;
			}
			Z = t.return;
		}
		return h = hc, hc = !1, h;
	}
	function _c(e, t, n) {
		var r = t.updateQueue;
		if (r = r === null ? null : r.lastEffect, r !== null) {
			var i = r = r.next;
			do {
				if ((i.tag & e) === e) {
					var a = i.destroy;
					i.destroy = void 0, a !== void 0 && mc(t, n, a);
				}
				i = i.next;
			} while (i !== r);
		}
	}
	function vc(e, t) {
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
	function yc(e) {
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
	function bc(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, bc(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[Ai], delete t[ji], delete t[Ni], delete t[Pi], delete t[Fi])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	function xc(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 4;
	}
	function Sc(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || xc(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function Cc(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? n.nodeType === 8 ? n.parentNode.insertBefore(e, t) : n.insertBefore(e, t) : (n.nodeType === 8 ? (t = n.parentNode, t.insertBefore(e, n)) : (t = n, t.appendChild(e)), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = _i));
		else if (r !== 4 && (e = e.child, e !== null)) for (Cc(e, t, n), e = e.sibling; e !== null;) Cc(e, t, n), e = e.sibling;
	}
	function wc(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
		else if (r !== 4 && (e = e.child, e !== null)) for (wc(e, t, n), e = e.sibling; e !== null;) wc(e, t, n), e = e.sibling;
	}
	var Tc = null, Ec = !1;
	function Dc(e, t, n) {
		for (n = n.child; n !== null;) Oc(e, t, n), n = n.sibling;
	}
	function Oc(e, t, n) {
		if (bt && typeof bt.onCommitFiberUnmount == "function") try {
			bt.onCommitFiberUnmount(yt, n);
		} catch {}
		switch (n.tag) {
			case 5: dc || pc(n, t);
			case 6:
				var r = Tc, i = Ec;
				Tc = null, Dc(e, t, n), Tc = r, Ec = i, Tc !== null && (Ec ? (e = Tc, n = n.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n)) : Tc.removeChild(n.stateNode));
				break;
			case 18:
				Tc !== null && (Ec ? (e = Tc, n = n.stateNode, e.nodeType === 8 ? Ei(e.parentNode, n) : e.nodeType === 1 && Ei(e, n), cn(e)) : Ei(Tc, n.stateNode));
				break;
			case 4:
				r = Tc, i = Ec, Tc = n.stateNode.containerInfo, Ec = !0, Dc(e, t, n), Tc = r, Ec = i;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				if (!dc && (r = n.updateQueue, r !== null && (r = r.lastEffect, r !== null))) {
					i = r = r.next;
					do {
						var a = i, o = a.destroy;
						a = a.tag, o !== void 0 && (a & 2 || a & 4) && mc(n, t, o), i = i.next;
					} while (i !== r);
				}
				Dc(e, t, n);
				break;
			case 1:
				if (!dc && (pc(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function")) try {
					r.props = n.memoizedProps, r.state = n.memoizedState, r.componentWillUnmount();
				} catch (e) {
					$(n, t, e);
				}
				Dc(e, t, n);
				break;
			case 21:
				Dc(e, t, n);
				break;
			case 22:
				n.mode & 1 ? (dc = (r = dc) || n.memoizedState !== null, Dc(e, t, n), dc = r) : Dc(e, t, n);
				break;
			default: Dc(e, t, n);
		}
	}
	function kc(e) {
		var t = e.updateQueue;
		if (t !== null) {
			e.updateQueue = null;
			var n = e.stateNode;
			n === null && (n = e.stateNode = new fc()), t.forEach(function(t) {
				var r = Hl.bind(null, e, t);
				n.has(t) || (n.add(t), t.then(r, r));
			});
		}
	}
	function Ac(e, t) {
		var n = t.deletions;
		if (n !== null) for (var i = 0; i < n.length; i++) {
			var a = n[i];
			try {
				var o = e, s = t, c = s;
				a: for (; c !== null;) {
					switch (c.tag) {
						case 5:
							Tc = c.stateNode, Ec = !1;
							break a;
						case 3:
							Tc = c.stateNode.containerInfo, Ec = !0;
							break a;
						case 4:
							Tc = c.stateNode.containerInfo, Ec = !0;
							break a;
					}
					c = c.return;
				}
				if (Tc === null) throw Error(r(160));
				Oc(o, s, a), Tc = null, Ec = !1;
				var l = a.alternate;
				l !== null && (l.return = null), a.return = null;
			} catch (e) {
				$(a, t, e);
			}
		}
		if (t.subtreeFlags & 12854) for (t = t.child; t !== null;) jc(t, e), t = t.sibling;
	}
	function jc(e, t) {
		var n = e.alternate, i = e.flags;
		switch (e.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				if (Ac(t, e), Mc(e), i & 4) {
					try {
						_c(3, e, e.return), vc(3, e);
					} catch (t) {
						$(e, e.return, t);
					}
					try {
						_c(5, e, e.return);
					} catch (t) {
						$(e, e.return, t);
					}
				}
				break;
			case 1:
				Ac(t, e), Mc(e), i & 512 && n !== null && pc(n, n.return);
				break;
			case 5:
				if (Ac(t, e), Mc(e), i & 512 && n !== null && pc(n, n.return), e.flags & 32) {
					var a = e.stateNode;
					try {
						Ee(a, "");
					} catch (t) {
						$(e, e.return, t);
					}
				}
				if (i & 4 && (a = e.stateNode, a != null)) {
					var o = e.memoizedProps, s = n === null ? o : n.memoizedProps, c = e.type, l = e.updateQueue;
					if (e.updateQueue = null, l !== null) try {
						c === "input" && o.type === "radio" && o.name != null && fe(a, o), Ne(c, s);
						var u = Ne(c, o);
						for (s = 0; s < l.length; s += 2) {
							var d = l[s], f = l[s + 1];
							d === "style" ? Ae(a, f) : d === "dangerouslySetInnerHTML" ? Te(a, f) : d === "children" ? Ee(a, f) : S(a, d, f, u);
						}
						switch (c) {
							case "input":
								pe(a, o);
								break;
							case "textarea":
								be(a, o);
								break;
							case "select":
								var p = a._wrapperState.wasMultiple;
								a._wrapperState.wasMultiple = !!o.multiple;
								var m = o.value;
								m == null ? p !== !!o.multiple && (o.defaultValue == null ? _e(a, !!o.multiple, o.multiple ? [] : "", !1) : _e(a, !!o.multiple, o.defaultValue, !0)) : _e(a, !!o.multiple, m, !1);
						}
						a[ji] = o;
					} catch (t) {
						$(e, e.return, t);
					}
				}
				break;
			case 6:
				if (Ac(t, e), Mc(e), i & 4) {
					if (e.stateNode === null) throw Error(r(162));
					a = e.stateNode, o = e.memoizedProps;
					try {
						a.nodeValue = o;
					} catch (t) {
						$(e, e.return, t);
					}
				}
				break;
			case 3:
				if (Ac(t, e), Mc(e), i & 4 && n !== null && n.memoizedState.isDehydrated) try {
					cn(t.containerInfo);
				} catch (t) {
					$(e, e.return, t);
				}
				break;
			case 4:
				Ac(t, e), Mc(e);
				break;
			case 13:
				Ac(t, e), Mc(e), a = e.child, a.flags & 8192 && (o = a.memoizedState !== null, a.stateNode.isHidden = o, !o || a.alternate !== null && a.alternate.memoizedState !== null || (el = U())), i & 4 && kc(e);
				break;
			case 22:
				if (d = n !== null && n.memoizedState !== null, e.mode & 1 ? (dc = (u = dc) || d, Ac(t, e), dc = u) : Ac(t, e), Mc(e), i & 8192) {
					if (u = e.memoizedState !== null, (e.stateNode.isHidden = u) && !d && e.mode & 1) for (Z = e, d = e.child; d !== null;) {
						for (f = Z = d; Z !== null;) {
							switch (p = Z, m = p.child, p.tag) {
								case 0:
								case 11:
								case 14:
								case 15:
									_c(4, p, p.return);
									break;
								case 1:
									pc(p, p.return);
									var h = p.stateNode;
									if (typeof h.componentWillUnmount == "function") {
										i = p, n = p.return;
										try {
											t = i, h.props = t.memoizedProps, h.state = t.memoizedState, h.componentWillUnmount();
										} catch (e) {
											$(i, n, e);
										}
									}
									break;
								case 5:
									pc(p, p.return);
									break;
								case 22: if (p.memoizedState !== null) {
									Ic(f);
									continue;
								}
							}
							m === null ? Ic(f) : (m.return = p, Z = m);
						}
						d = d.sibling;
					}
					a: for (d = null, f = e;;) {
						if (f.tag === 5) {
							if (d === null) {
								d = f;
								try {
									a = f.stateNode, u ? (o = a.style, typeof o.setProperty == "function" ? o.setProperty("display", "none", "important") : o.display = "none") : (c = f.stateNode, l = f.memoizedProps.style, s = l != null && l.hasOwnProperty("display") ? l.display : null, c.style.display = ke("display", s));
								} catch (t) {
									$(e, e.return, t);
								}
							}
						} else if (f.tag === 6) {
							if (d === null) try {
								f.stateNode.nodeValue = u ? "" : f.memoizedProps;
							} catch (t) {
								$(e, e.return, t);
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
				Ac(t, e), Mc(e), i & 4 && kc(e);
				break;
			case 21: break;
			default: Ac(t, e), Mc(e);
		}
	}
	function Mc(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				a: {
					for (var n = e.return; n !== null;) {
						if (xc(n)) {
							var i = n;
							break a;
						}
						n = n.return;
					}
					throw Error(r(160));
				}
				switch (i.tag) {
					case 5:
						var a = i.stateNode;
						i.flags & 32 && (Ee(a, ""), i.flags &= -33), wc(e, Sc(e), a);
						break;
					case 3:
					case 4:
						var o = i.stateNode.containerInfo;
						Cc(e, Sc(e), o);
						break;
					default: throw Error(r(161));
				}
			} catch (t) {
				$(e, e.return, t);
			}
			e.flags &= -3;
		}
		t & 4096 && (e.flags &= -4097);
	}
	function Nc(e, t, n) {
		Z = e, Pc(e, t, n);
	}
	function Pc(e, t, n) {
		for (var r = (e.mode & 1) != 0; Z !== null;) {
			var i = Z, a = i.child;
			if (i.tag === 22 && r) {
				var o = i.memoizedState !== null || uc;
				if (!o) {
					var s = i.alternate, c = s !== null && s.memoizedState !== null || dc;
					s = uc;
					var l = dc;
					if (uc = o, (dc = c) && !l) for (Z = i; Z !== null;) o = Z, c = o.child, o.tag === 22 && o.memoizedState !== null || c === null ? Lc(i) : (c.return = o, Z = c);
					for (; a !== null;) Z = a, Pc(a, t, n), a = a.sibling;
					Z = i, uc = s, dc = l;
				}
				Fc(e, t, n);
			} else i.subtreeFlags & 8772 && a !== null ? (a.return = i, Z = a) : Fc(e, t, n);
		}
	}
	function Fc(e) {
		for (; Z !== null;) {
			var t = Z;
			if (t.flags & 8772) {
				var n = t.alternate;
				try {
					if (t.flags & 8772) switch (t.tag) {
						case 0:
						case 11:
						case 15:
							dc || vc(5, t);
							break;
						case 1:
							var i = t.stateNode;
							if (t.flags & 4 && !dc) if (n === null) i.componentDidMount();
							else {
								var a = t.elementType === t.type ? n.memoizedProps : gs(t.type, n.memoizedProps);
								i.componentDidUpdate(a, n.memoizedState, i.__reactInternalSnapshotBeforeUpdate);
							}
							var o = t.updateQueue;
							o !== null && ao(t, o, i);
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
								ao(t, s, n);
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
										f !== null && cn(f);
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
						default: throw Error(r(163));
					}
					dc || t.flags & 512 && yc(t);
				} catch (e) {
					$(t, t.return, e);
				}
			}
			if (t === e) {
				Z = null;
				break;
			}
			if (n = t.sibling, n !== null) {
				n.return = t.return, Z = n;
				break;
			}
			Z = t.return;
		}
	}
	function Ic(e) {
		for (; Z !== null;) {
			var t = Z;
			if (t === e) {
				Z = null;
				break;
			}
			var n = t.sibling;
			if (n !== null) {
				n.return = t.return, Z = n;
				break;
			}
			Z = t.return;
		}
	}
	function Lc(e) {
		for (; Z !== null;) {
			var t = Z;
			try {
				switch (t.tag) {
					case 0:
					case 11:
					case 15:
						var n = t.return;
						try {
							vc(4, t);
						} catch (e) {
							$(t, n, e);
						}
						break;
					case 1:
						var r = t.stateNode;
						if (typeof r.componentDidMount == "function") {
							var i = t.return;
							try {
								r.componentDidMount();
							} catch (e) {
								$(t, i, e);
							}
						}
						var a = t.return;
						try {
							yc(t);
						} catch (e) {
							$(t, a, e);
						}
						break;
					case 5:
						var o = t.return;
						try {
							yc(t);
						} catch (e) {
							$(t, o, e);
						}
				}
			} catch (e) {
				$(t, t.return, e);
			}
			if (t === e) {
				Z = null;
				break;
			}
			var s = t.sibling;
			if (s !== null) {
				s.return = t.return, Z = s;
				break;
			}
			Z = t.return;
		}
	}
	var Rc = Math.ceil, zc = C.ReactCurrentDispatcher, Bc = C.ReactCurrentOwner, Vc = C.ReactCurrentBatchConfig, Q = 0, Hc = null, Uc = null, Wc = 0, Gc = 0, Kc = Hi(0), qc = 0, Jc = null, Yc = 0, Xc = 0, Zc = 0, Qc = null, $c = null, el = 0, tl = Infinity, nl = null, rl = !1, il = null, al = null, ol = !1, sl = null, cl = 0, ll = 0, ul = null, dl = -1, fl = 0;
	function pl() {
		return Q & 6 ? U() : dl === -1 ? dl = U() : dl;
	}
	function ml(e) {
		return e.mode & 1 ? Q & 2 && Wc !== 0 ? Wc & -Wc : ja.transition === null ? (e = W, e === 0 ? (e = window.event, e = e === void 0 ? 16 : gn(e.type), e) : e) : (fl === 0 && (fl = Nt()), fl) : 1;
	}
	function hl(e, t, n, i) {
		if (50 < ll) throw ll = 0, ul = null, Error(r(185));
		Ft(e, n, i), (!(Q & 2) || e !== Hc) && (e === Hc && (!(Q & 2) && (Xc |= n), qc === 4 && xl(e, Wc)), gl(e, i), n === 1 && Q === 0 && !(t.mode & 1) && (tl = U() + 500, ta && aa()));
	}
	function gl(e, t) {
		var n = e.callbackNode;
		jt(e, t);
		var r = kt(e, e === Hc ? Wc : 0);
		if (r === 0) n !== null && ut(n), e.callbackNode = null, e.callbackPriority = 0;
		else if (t = r & -r, e.callbackPriority !== t) {
			if (n != null && ut(n), t === 1) e.tag === 0 ? ia(Sl.bind(null, e)) : ra(Sl.bind(null, e)), wi(function() {
				!(Q & 6) && aa();
			}), n = null;
			else {
				switch (Rt(r)) {
					case 1:
						n = mt;
						break;
					case 4:
						n = ht;
						break;
					case 16:
						n = gt;
						break;
					case 536870912:
						n = vt;
						break;
					default: n = gt;
				}
				n = Wl(n, _l.bind(null, e));
			}
			e.callbackPriority = t, e.callbackNode = n;
		}
	}
	function _l(e, t) {
		if (dl = -1, fl = 0, Q & 6) throw Error(r(327));
		var n = e.callbackNode;
		if (Ll() && e.callbackNode !== n) return null;
		var i = kt(e, e === Hc ? Wc : 0);
		if (i === 0) return null;
		if (i & 30 || (i & e.expiredLanes) !== 0 || t) t = Al(e, i);
		else {
			t = i;
			var a = Q;
			Q |= 2;
			var o = Ol();
			(Hc !== e || Wc !== t) && (nl = null, tl = U() + 500, El(e, t));
			do
				try {
					Ml();
					break;
				} catch (t) {
					Dl(e, t);
				}
			while (1);
			Ha(), zc.current = o, Q = a, Uc === null ? (Hc = null, Wc = 0, t = qc) : t = 0;
		}
		if (t !== 0) {
			if (t === 2 && (a = Mt(e), a !== 0 && (i = a, t = vl(e, a))), t === 1) throw n = Jc, El(e, 0), xl(e, i), gl(e, U()), n;
			if (t === 6) xl(e, i);
			else {
				if (a = e.current.alternate, !(i & 30) && !bl(a) && (t = Al(e, i), t === 2 && (o = Mt(e), o !== 0 && (i = o, t = vl(e, o))), t === 1)) throw n = Jc, El(e, 0), xl(e, i), gl(e, U()), n;
				switch (e.finishedWork = a, e.finishedLanes = i, t) {
					case 0:
					case 1: throw Error(r(345));
					case 2:
						Fl(e, $c, nl);
						break;
					case 3:
						if (xl(e, i), (i & 130023424) === i && (t = el + 500 - U(), 10 < t)) {
							if (kt(e, 0) !== 0) break;
							if (a = e.suspendedLanes, (a & i) !== i) {
								pl(), e.pingedLanes |= e.suspendedLanes & a;
								break;
							}
							e.timeoutHandle = xi(Fl.bind(null, e, $c, nl), t);
							break;
						}
						Fl(e, $c, nl);
						break;
					case 4:
						if (xl(e, i), (i & 4194240) === i) break;
						for (t = e.eventTimes, a = -1; 0 < i;) {
							var s = 31 - St(i);
							o = 1 << s, s = t[s], s > a && (a = s), i &= ~o;
						}
						if (i = a, i = U() - i, i = (120 > i ? 120 : 480 > i ? 480 : 1080 > i ? 1080 : 1920 > i ? 1920 : 3e3 > i ? 3e3 : 4320 > i ? 4320 : 1960 * Rc(i / 1960)) - i, 10 < i) {
							e.timeoutHandle = xi(Fl.bind(null, e, $c, nl), i);
							break;
						}
						Fl(e, $c, nl);
						break;
					case 5:
						Fl(e, $c, nl);
						break;
					default: throw Error(r(329));
				}
			}
		}
		return gl(e, U()), e.callbackNode === n ? _l.bind(null, e) : null;
	}
	function vl(e, t) {
		var n = Qc;
		return e.current.memoizedState.isDehydrated && (El(e, t).flags |= 256), e = Al(e, t), e !== 2 && (t = $c, $c = n, t !== null && yl(t)), e;
	}
	function yl(e) {
		$c === null ? $c = e : $c.push.apply($c, e);
	}
	function bl(e) {
		for (var t = e;;) {
			if (t.flags & 16384) {
				var n = t.updateQueue;
				if (n !== null && (n = n.stores, n !== null)) for (var r = 0; r < n.length; r++) {
					var i = n[r], a = i.getSnapshot;
					i = i.value;
					try {
						if (!Er(a(), i)) return !1;
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
	function xl(e, t) {
		for (t &= ~Zc, t &= ~Xc, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t;) {
			var n = 31 - St(t), r = 1 << n;
			e[n] = -1, t &= ~r;
		}
	}
	function Sl(e) {
		if (Q & 6) throw Error(r(327));
		Ll();
		var t = kt(e, 0);
		if (!(t & 1)) return gl(e, U()), null;
		var n = Al(e, t);
		if (e.tag !== 0 && n === 2) {
			var i = Mt(e);
			i !== 0 && (t = i, n = vl(e, i));
		}
		if (n === 1) throw n = Jc, El(e, 0), xl(e, t), gl(e, U()), n;
		if (n === 6) throw Error(r(345));
		return e.finishedWork = e.current.alternate, e.finishedLanes = t, Fl(e, $c, nl), gl(e, U()), null;
	}
	function Cl(e, t) {
		var n = Q;
		Q |= 1;
		try {
			return e(t);
		} finally {
			Q = n, Q === 0 && (tl = U() + 500, ta && aa());
		}
	}
	function wl(e) {
		sl !== null && sl.tag === 0 && !(Q & 6) && Ll();
		var t = Q;
		Q |= 1;
		var n = Vc.transition, r = W;
		try {
			if (Vc.transition = null, W = 1, e) return e();
		} finally {
			W = r, Vc.transition = n, Q = t, !(Q & 6) && aa();
		}
	}
	function Tl() {
		Gc = Kc.current, K(Kc);
	}
	function El(e, t) {
		e.finishedWork = null, e.finishedLanes = 0;
		var n = e.timeoutHandle;
		if (n !== -1 && (e.timeoutHandle = -1, Si(n)), Uc !== null) for (n = Uc.return; n !== null;) {
			var r = n;
			switch (va(r), r.tag) {
				case 1:
					r = r.type.childContextTypes, r != null && Yi();
					break;
				case 3:
					po(), K(Gi), K(Wi), vo();
					break;
				case 5:
					ho(r);
					break;
				case 4:
					po();
					break;
				case 13:
					K(Y);
					break;
				case 19:
					K(Y);
					break;
				case 10:
					Ua(r.type._context);
					break;
				case 22:
				case 23: Tl();
			}
			n = n.return;
		}
		if (Hc = e, Uc = e = Yl(e.current, null), Wc = Gc = t, qc = 0, Jc = null, Zc = Xc = Yc = 0, $c = Qc = null, qa !== null) {
			for (t = 0; t < qa.length; t++) if (n = qa[t], r = n.interleaved, r !== null) {
				n.interleaved = null;
				var i = r.next, a = n.pending;
				if (a !== null) {
					var o = a.next;
					a.next = i, r.next = o;
				}
				n.pending = r;
			}
			qa = null;
		}
		return e;
	}
	function Dl(e, t) {
		do {
			var n = Uc;
			try {
				if (Ha(), yo.current = fs, wo) {
					for (var i = X.memoizedState; i !== null;) {
						var a = i.queue;
						a !== null && (a.pending = null), i = i.next;
					}
					wo = !1;
				}
				if (xo = 0, Co = So = X = null, To = !1, Eo = 0, Bc.current = null, n === null || n.return === null) {
					qc = 1, Jc = t, Uc = null;
					break;
				}
				a: {
					var o = e, s = n.return, c = n, l = t;
					if (t = Wc, c.flags |= 32768, typeof l == "object" && l && typeof l.then == "function") {
						var u = l, d = c, f = d.tag;
						if (!(d.mode & 1) && (f === 0 || f === 11 || f === 15)) {
							var p = d.alternate;
							p ? (d.updateQueue = p.updateQueue, d.memoizedState = p.memoizedState, d.lanes = p.lanes) : (d.updateQueue = null, d.memoizedState = null);
						}
						var m = As(s);
						if (m !== null) {
							m.flags &= -257, js(m, s, c, o, t), m.mode & 1 && ks(o, u, t), t = m, l = u;
							var h = t.updateQueue;
							if (h === null) {
								var g = /* @__PURE__ */ new Set();
								g.add(l), t.updateQueue = g;
							} else h.add(l);
							break a;
						} else {
							if (!(t & 1)) {
								ks(o, u, t), kl();
								break a;
							}
							l = Error(r(426));
						}
					} else if (J && c.mode & 1) {
						var _ = As(s);
						if (_ !== null) {
							!(_.flags & 65536) && (_.flags |= 256), js(_, s, c, o, t), Aa(Cs(l, c));
							break a;
						}
					}
					o = l = Cs(l, c), qc !== 4 && (qc = 2), Qc === null ? Qc = [o] : Qc.push(o), o = s;
					do {
						switch (o.tag) {
							case 3:
								o.flags |= 65536, t &= -t, o.lanes |= t;
								var v = Ds(o, l, t);
								ro(o, v);
								break a;
							case 1:
								c = l;
								var y = o.type, b = o.stateNode;
								if (!(o.flags & 128) && (typeof y.getDerivedStateFromError == "function" || b !== null && typeof b.componentDidCatch == "function" && (al === null || !al.has(b)))) {
									o.flags |= 65536, t &= -t, o.lanes |= t;
									var x = Os(o, c, t);
									ro(o, x);
									break a;
								}
						}
						o = o.return;
					} while (o !== null);
				}
				Pl(n);
			} catch (e) {
				t = e, Uc === n && n !== null && (Uc = n = n.return);
				continue;
			}
			break;
		} while (1);
	}
	function Ol() {
		var e = zc.current;
		return zc.current = fs, e === null ? fs : e;
	}
	function kl() {
		(qc === 0 || qc === 3 || qc === 2) && (qc = 4), Hc === null || !(Yc & 268435455) && !(Xc & 268435455) || xl(Hc, Wc);
	}
	function Al(e, t) {
		var n = Q;
		Q |= 2;
		var i = Ol();
		(Hc !== e || Wc !== t) && (nl = null, El(e, t));
		do
			try {
				jl();
				break;
			} catch (t) {
				Dl(e, t);
			}
		while (1);
		if (Ha(), Q = n, zc.current = i, Uc !== null) throw Error(r(261));
		return Hc = null, Wc = 0, qc;
	}
	function jl() {
		for (; Uc !== null;) Nl(Uc);
	}
	function Ml() {
		for (; Uc !== null && !dt();) Nl(Uc);
	}
	function Nl(e) {
		var t = Ul(e.alternate, e, Gc);
		e.memoizedProps = e.pendingProps, t === null ? Pl(e) : Uc = t, Bc.current = null;
	}
	function Pl(e) {
		var t = e;
		do {
			var n = t.alternate;
			if (e = t.return, t.flags & 32768) {
				if (n = lc(n, t), n !== null) {
					n.flags &= 32767, Uc = n;
					return;
				}
				if (e !== null) e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null;
				else {
					qc = 6, Uc = null;
					return;
				}
			} else if (n = cc(n, t, Gc), n !== null) {
				Uc = n;
				return;
			}
			if (t = t.sibling, t !== null) {
				Uc = t;
				return;
			}
			Uc = t = e;
		} while (t !== null);
		qc === 0 && (qc = 5);
	}
	function Fl(e, t, n) {
		var r = W, i = Vc.transition;
		try {
			Vc.transition = null, W = 1, Il(e, t, n, r);
		} finally {
			Vc.transition = i, W = r;
		}
		return null;
	}
	function Il(e, t, n, i) {
		do
			Ll();
		while (sl !== null);
		if (Q & 6) throw Error(r(327));
		n = e.finishedWork;
		var a = e.finishedLanes;
		if (n === null) return null;
		if (e.finishedWork = null, e.finishedLanes = 0, n === e.current) throw Error(r(177));
		e.callbackNode = null, e.callbackPriority = 0;
		var o = n.lanes | n.childLanes;
		if (It(e, o), e === Hc && (Uc = Hc = null, Wc = 0), !(n.subtreeFlags & 2064) && !(n.flags & 2064) || ol || (ol = !0, Wl(gt, function() {
			return Ll(), null;
		})), o = (n.flags & 15990) != 0, n.subtreeFlags & 15990 || o) {
			o = Vc.transition, Vc.transition = null;
			var s = W;
			W = 1;
			var c = Q;
			Q |= 4, Bc.current = null, gc(e, n), jc(n, e), Nr(yi), un = !!vi, yi = vi = null, e.current = n, Nc(n, e, a), ft(), Q = c, W = s, Vc.transition = o;
		} else e.current = n;
		if (ol && (ol = !1, sl = e, cl = a), o = e.pendingLanes, o === 0 && (al = null), xt(n.stateNode, i), gl(e, U()), t !== null) for (i = e.onRecoverableError, n = 0; n < t.length; n++) a = t[n], i(a.value, {
			componentStack: a.stack,
			digest: a.digest
		});
		if (rl) throw rl = !1, e = il, il = null, e;
		return cl & 1 && e.tag !== 0 && Ll(), o = e.pendingLanes, o & 1 ? e === ul ? ll++ : (ll = 0, ul = e) : ll = 0, aa(), null;
	}
	function Ll() {
		if (sl !== null) {
			var e = Rt(cl), t = Vc.transition, n = W;
			try {
				if (Vc.transition = null, W = 16 > e ? 16 : e, sl === null) var i = !1;
				else {
					if (e = sl, sl = null, cl = 0, Q & 6) throw Error(r(331));
					var a = Q;
					for (Q |= 4, Z = e.current; Z !== null;) {
						var o = Z, s = o.child;
						if (Z.flags & 16) {
							var c = o.deletions;
							if (c !== null) {
								for (var l = 0; l < c.length; l++) {
									var u = c[l];
									for (Z = u; Z !== null;) {
										var d = Z;
										switch (d.tag) {
											case 0:
											case 11:
											case 15: _c(8, d, o);
										}
										var f = d.child;
										if (f !== null) f.return = d, Z = f;
										else for (; Z !== null;) {
											d = Z;
											var p = d.sibling, m = d.return;
											if (bc(d), d === u) {
												Z = null;
												break;
											}
											if (p !== null) {
												p.return = m, Z = p;
												break;
											}
											Z = m;
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
								Z = o;
							}
						}
						if (o.subtreeFlags & 2064 && s !== null) s.return = o, Z = s;
						else b: for (; Z !== null;) {
							if (o = Z, o.flags & 2048) switch (o.tag) {
								case 0:
								case 11:
								case 15: _c(9, o, o.return);
							}
							var v = o.sibling;
							if (v !== null) {
								v.return = o.return, Z = v;
								break b;
							}
							Z = o.return;
						}
					}
					var y = e.current;
					for (Z = y; Z !== null;) {
						s = Z;
						var b = s.child;
						if (s.subtreeFlags & 2064 && b !== null) b.return = s, Z = b;
						else b: for (s = y; Z !== null;) {
							if (c = Z, c.flags & 2048) try {
								switch (c.tag) {
									case 0:
									case 11:
									case 15: vc(9, c);
								}
							} catch (e) {
								$(c, c.return, e);
							}
							if (c === s) {
								Z = null;
								break b;
							}
							var x = c.sibling;
							if (x !== null) {
								x.return = c.return, Z = x;
								break b;
							}
							Z = c.return;
						}
					}
					if (Q = a, aa(), bt && typeof bt.onPostCommitFiberRoot == "function") try {
						bt.onPostCommitFiberRoot(yt, e);
					} catch {}
					i = !0;
				}
				return i;
			} finally {
				W = n, Vc.transition = t;
			}
		}
		return !1;
	}
	function Rl(e, t, n) {
		t = Cs(n, t), t = Ds(e, t, 1), e = to(e, t, 1), t = pl(), e !== null && (Ft(e, 1, t), gl(e, t));
	}
	function $(e, t, n) {
		if (e.tag === 3) Rl(e, e, n);
		else for (; t !== null;) {
			if (t.tag === 3) {
				Rl(t, e, n);
				break;
			} else if (t.tag === 1) {
				var r = t.stateNode;
				if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (al === null || !al.has(r))) {
					e = Cs(n, e), e = Os(t, e, 1), t = to(t, e, 1), e = pl(), t !== null && (Ft(t, 1, e), gl(t, e));
					break;
				}
			}
			t = t.return;
		}
	}
	function zl(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), t = pl(), e.pingedLanes |= e.suspendedLanes & n, Hc === e && (Wc & n) === n && (qc === 4 || qc === 3 && (Wc & 130023424) === Wc && 500 > U() - el ? El(e, 0) : Zc |= n), gl(e, t);
	}
	function Bl(e, t) {
		t === 0 && (e.mode & 1 ? (t = Dt, Dt <<= 1, !(Dt & 130023424) && (Dt = 4194304)) : t = 1);
		var n = pl();
		e = Xa(e, t), e !== null && (Ft(e, t, n), gl(e, n));
	}
	function Vl(e) {
		var t = e.memoizedState, n = 0;
		t !== null && (n = t.retryLane), Bl(e, n);
	}
	function Hl(e, t) {
		var n = 0;
		switch (e.tag) {
			case 13:
				var i = e.stateNode, a = e.memoizedState;
				a !== null && (n = a.retryLane);
				break;
			case 19:
				i = e.stateNode;
				break;
			default: throw Error(r(314));
		}
		i !== null && i.delete(t), Bl(e, n);
	}
	var Ul = function(e, t, n) {
		if (e !== null) if (e.memoizedProps !== t.pendingProps || Gi.current) Ns = !0;
		else {
			if ((e.lanes & n) === 0 && !(t.flags & 128)) return Ns = !1, nc(e, t, n);
			Ns = !!(e.flags & 131072);
		}
		else Ns = !1, J && t.flags & 1048576 && ga(t, la, t.index);
		switch (t.lanes = 0, t.tag) {
			case 2:
				var i = t.type;
				ec(e, t), e = t.pendingProps;
				var a = qi(t, Wi.current);
				Ga(t, n), a = Ao(null, t, i, e, a, n);
				var o = jo();
				return t.flags |= 1, typeof a == "object" && a && typeof a.render == "function" && a.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, Ji(i) ? (o = !0, Qi(t)) : o = !1, t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, Qa(t), a.updater = vs, t.stateNode = a, a._reactInternals = t, Ss(t, i, e, n), t = Hs(null, t, i, !0, o, n)) : (t.tag = 0, J && o && _a(t), Ps(null, t, a, n), t = t.child), t;
			case 16:
				i = t.elementType;
				a: {
					switch (ec(e, t), e = t.pendingProps, a = i._init, i = a(i._payload), t.type = i, a = t.tag = Jl(i), e = gs(i, e), a) {
						case 0:
							t = Bs(null, t, i, e, n);
							break a;
						case 1:
							t = Vs(null, t, i, e, n);
							break a;
						case 11:
							t = Fs(null, t, i, e, n);
							break a;
						case 14:
							t = Is(null, t, i, gs(i.type, e), n);
							break a;
					}
					throw Error(r(306, i, ""));
				}
				return t;
			case 0: return i = t.type, a = t.pendingProps, a = t.elementType === i ? a : gs(i, a), Bs(e, t, i, a, n);
			case 1: return i = t.type, a = t.pendingProps, a = t.elementType === i ? a : gs(i, a), Vs(e, t, i, a, n);
			case 3:
				a: {
					if (Us(t), e === null) throw Error(r(387));
					i = t.pendingProps, o = t.memoizedState, a = o.element, $a(e, t), io(t, i, null, n);
					var s = t.memoizedState;
					if (i = s.element, o.isDehydrated) if (o = {
						element: i,
						isDehydrated: !1,
						cache: s.cache,
						pendingSuspenseBoundaries: s.pendingSuspenseBoundaries,
						transitions: s.transitions
					}, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
						a = Cs(Error(r(423)), t), t = Ws(e, t, i, n, a);
						break a;
					} else if (i !== a) {
						a = Cs(Error(r(424)), t), t = Ws(e, t, i, n, a);
						break a;
					} else for (ba = Di(t.stateNode.containerInfo.firstChild), ya = t, J = !0, xa = null, n = La(t, null, i, n), t.child = n; n;) n.flags = n.flags & -3 | 4096, n = n.sibling;
					else {
						if (ka(), i === a) {
							t = tc(e, t, n);
							break a;
						}
						Ps(e, t, i, n);
					}
					t = t.child;
				}
				return t;
			case 5: return mo(t), e === null && Ta(t), i = t.type, a = t.pendingProps, o = e === null ? null : e.memoizedProps, s = a.children, bi(i, a) ? s = null : o !== null && bi(i, o) && (t.flags |= 32), zs(e, t), Ps(e, t, s, n), t.child;
			case 6: return e === null && Ta(t), null;
			case 13: return qs(e, t, n);
			case 4: return fo(t, t.stateNode.containerInfo), i = t.pendingProps, e === null ? t.child = Ia(t, null, i, n) : Ps(e, t, i, n), t.child;
			case 11: return i = t.type, a = t.pendingProps, a = t.elementType === i ? a : gs(i, a), Fs(e, t, i, a, n);
			case 7: return Ps(e, t, t.pendingProps, n), t.child;
			case 8: return Ps(e, t, t.pendingProps.children, n), t.child;
			case 12: return Ps(e, t, t.pendingProps.children, n), t.child;
			case 10:
				a: {
					if (i = t.type._context, a = t.pendingProps, o = t.memoizedProps, s = a.value, q(Ra, i._currentValue), i._currentValue = s, o !== null) if (Er(o.value, s)) {
						if (o.children === a.children && !Gi.current) {
							t = tc(e, t, n);
							break a;
						}
					} else for (o = t.child, o !== null && (o.return = t); o !== null;) {
						var c = o.dependencies;
						if (c !== null) {
							s = o.child;
							for (var l = c.firstContext; l !== null;) {
								if (l.context === i) {
									if (o.tag === 1) {
										l = eo(-1, n & -n), l.tag = 2;
										var u = o.updateQueue;
										if (u !== null) {
											u = u.shared;
											var d = u.pending;
											d === null ? l.next = l : (l.next = d.next, d.next = l), u.pending = l;
										}
									}
									o.lanes |= n, l = o.alternate, l !== null && (l.lanes |= n), Wa(o.return, n, t), c.lanes |= n;
									break;
								}
								l = l.next;
							}
						} else if (o.tag === 10) s = o.type === t.type ? null : o.child;
						else if (o.tag === 18) {
							if (s = o.return, s === null) throw Error(r(341));
							s.lanes |= n, c = s.alternate, c !== null && (c.lanes |= n), Wa(s, n, t), s = o.sibling;
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
					Ps(e, t, a.children, n), t = t.child;
				}
				return t;
			case 9: return a = t.type, i = t.pendingProps.children, Ga(t, n), a = Ka(a), i = i(a), t.flags |= 1, Ps(e, t, i, n), t.child;
			case 14: return i = t.type, a = gs(i, t.pendingProps), a = gs(i.type, a), Is(e, t, i, a, n);
			case 15: return Ls(e, t, t.type, t.pendingProps, n);
			case 17: return i = t.type, a = t.pendingProps, a = t.elementType === i ? a : gs(i, a), ec(e, t), t.tag = 1, Ji(i) ? (e = !0, Qi(t)) : e = !1, Ga(t, n), bs(t, i, a), Ss(t, i, a, n), Hs(null, t, i, !0, e, n);
			case 19: return $s(e, t, n);
			case 22: return Rs(e, t, n);
		}
		throw Error(r(156, t.tag));
	};
	function Wl(e, t) {
		return lt(e, t);
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
			if (e === N) return 14;
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
	function Xl(e, t, n, i, a, o) {
		var s = 2;
		if (i = e, typeof e == "function") ql(e) && (s = 1);
		else if (typeof e == "string") s = 5;
		else a: switch (e) {
			case E: return Zl(n.children, a, o, t);
			case D:
				s = 8, a |= 8;
				break;
			case O: return e = Kl(12, n, t, a | 2), e.elementType = O, e.lanes = o, e;
			case M: return e = Kl(13, n, t, a), e.elementType = M, e.lanes = o, e;
			case ee: return e = Kl(19, n, t, a), e.elementType = ee, e.lanes = o, e;
			case F: return Ql(n, a, o, t);
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
					case N:
						s = 14;
						break a;
					case P:
						s = 16, i = null;
						break a;
				}
				throw Error(r(130, e == null ? e : typeof e, ""));
		}
		return t = Kl(s, n, t, a), t.elementType = e, t.type = i, t.lanes = o, t;
	}
	function Zl(e, t, n, r) {
		return e = Kl(7, e, r, t), e.lanes = n, e;
	}
	function Ql(e, t, n, r) {
		return e = Kl(22, e, r, t), e.elementType = F, e.lanes = n, e.stateNode = { isHidden: !1 }, e;
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
		this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = Pt(0), this.expirationTimes = Pt(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Pt(0), this.identifierPrefix = r, this.onRecoverableError = i, this.mutableSourceEagerHydrationData = null;
	}
	function nu(e, t, n, r, i, a, o, s, c) {
		return e = new tu(e, t, n, s, c), t === 1 ? (t = 1, !0 === a && (t |= 8)) : t = 0, a = Kl(3, null, null, t), e.current = a, a.stateNode = e, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: null,
			transitions: null,
			pendingSuspenseBoundaries: null
		}, Qa(a), e;
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
		if (!e) return Ui;
		e = e._reactInternals;
		a: {
			if (rt(e) !== e || e.tag !== 1) throw Error(r(170));
			var t = e;
			do {
				switch (t.tag) {
					case 3:
						t = t.stateNode.context;
						break a;
					case 1: if (Ji(t.type)) {
						t = t.stateNode.__reactInternalMemoizedMergedChildContext;
						break a;
					}
				}
				t = t.return;
			} while (t !== null);
			throw Error(r(171));
		}
		if (e.tag === 1) {
			var n = e.type;
			if (Ji(n)) return Zi(e, n, t);
		}
		return t;
	}
	function au(e, t, n, r, i, a, o, s, c) {
		return e = nu(n, r, !0, e, i, a, o, s, c), e.context = iu(null), n = e.current, r = pl(), i = ml(n), a = eo(r, i), a.callback = t ?? null, to(n, a, i), e.current.lanes = i, Ft(e, i, r), gl(e, r), e;
	}
	function ou(e, t, n, r) {
		var i = t.current, a = pl(), o = ml(i);
		return n = iu(n), t.context === null ? t.context = n : t.pendingContext = n, t = eo(a, o), t.payload = { element: e }, r = r === void 0 ? null : r, r !== null && (t.callback = r), e = to(i, t, o), e !== null && (hl(e, i, o, a), no(e, i, o)), o;
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
		if (t === null) throw Error(r(409));
		ou(e, t, null, null);
	}, pu.prototype.unmount = fu.prototype.unmount = function() {
		var e = this._internalRoot;
		if (e !== null) {
			this._internalRoot = null;
			var t = e.containerInfo;
			wl(function() {
				ou(null, e, null, null);
			}), t[Mi] = null;
		}
	};
	function pu(e) {
		this._internalRoot = e;
	}
	pu.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = Ht();
			e = {
				blockedOn: null,
				target: e,
				priority: t
			};
			for (var n = 0; n < Zt.length && t !== 0 && t < Zt[n].priority; n++);
			Zt.splice(n, 0, e), n === 0 && nn(e);
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
			return e._reactRootContainer = o, e[Mi] = o.current, oi(e.nodeType === 8 ? e.parentNode : e), wl(), o;
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
		return e._reactRootContainer = c, e[Mi] = c.current, oi(e.nodeType === 8 ? e.parentNode : e), wl(function() {
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
	zt = function(e) {
		switch (e.tag) {
			case 3:
				var t = e.stateNode;
				if (t.current.memoizedState.isDehydrated) {
					var n = Ot(t.pendingLanes);
					n !== 0 && (Lt(t, n | 1), gl(t, U()), !(Q & 6) && (tl = U() + 500, aa()));
				}
				break;
			case 13: wl(function() {
				var t = Xa(e, 1);
				t !== null && hl(t, e, 1, pl());
			}), lu(e, 1);
		}
	}, Bt = function(e) {
		if (e.tag === 13) {
			var t = Xa(e, 134217728);
			t !== null && hl(t, e, 134217728, pl()), lu(e, 134217728);
		}
	}, Vt = function(e) {
		if (e.tag === 13) {
			var t = ml(e), n = Xa(e, t);
			n !== null && hl(n, e, t, pl()), lu(e, t);
		}
	}, Ht = function() {
		return W;
	}, Ut = function(e, t) {
		var n = W;
		try {
			return W = e, t();
		} finally {
			W = n;
		}
	}, Ie = function(e, t, n) {
		switch (t) {
			case "input":
				if (pe(e, n), t = n.name, n.type === "radio" && t != null) {
					for (n = e; n.parentNode;) n = n.parentNode;
					for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + "][type=\"radio\"]"), t = 0; t < n.length; t++) {
						var i = n[t];
						if (i !== e && i.form === e.form) {
							var a = zi(i);
							if (!a) throw Error(r(90));
							ce(i), pe(i, a);
						}
					}
				}
				break;
			case "textarea":
				be(e, n);
				break;
			case "select": t = n.value, t != null && _e(e, !!n.multiple, t, !1);
		}
	}, He = Cl, Ue = wl;
	var yu = {
		usingClientEntryPoint: !1,
		Events: [
			Li,
			Ri,
			zi,
			Be,
			Ve,
			Cl
		]
	}, bu = {
		findFiberByHostInstance: Ii,
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
			return e = st(e), e === null ? null : e.stateNode;
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
			yt = Su.inject(xu), bt = Su;
		} catch {}
	}
	e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = yu, e.createPortal = function(e, t) {
		var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
		if (!mu(t)) throw Error(r(200));
		return ru(e, t, null, n);
	}, e.createRoot = function(e, t) {
		if (!mu(e)) throw Error(r(299));
		var n = !1, i = "", a = du;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (i = t.identifierPrefix), t.onRecoverableError !== void 0 && (a = t.onRecoverableError)), t = nu(e, 1, !1, null, null, n, !1, i, a), e[Mi] = t.current, oi(e.nodeType === 8 ? e.parentNode : e), new fu(t);
	}, e.findDOMNode = function(e) {
		if (e == null) return null;
		if (e.nodeType === 1) return e;
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(r(188)) : (e = Object.keys(e).join(","), Error(r(268, e)));
		return e = st(t), e = e === null ? null : e.stateNode, e;
	}, e.flushSync = function(e) {
		return wl(e);
	}, e.hydrate = function(e, t, n) {
		if (!hu(t)) throw Error(r(200));
		return vu(null, e, t, !0, n);
	}, e.hydrateRoot = function(e, t, n) {
		if (!mu(e)) throw Error(r(405));
		var i = n != null && n.hydratedSources || null, a = !1, o = "", s = du;
		if (n != null && (!0 === n.unstable_strictMode && (a = !0), n.identifierPrefix !== void 0 && (o = n.identifierPrefix), n.onRecoverableError !== void 0 && (s = n.onRecoverableError)), t = au(t, null, e, 1, n ?? null, a, !1, o, s), e[Mi] = t.current, oi(e), i) for (e = 0; e < i.length; e++) n = i[e], a = n._getVersion, a = a(n._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [n, a] : t.mutableSourceEagerHydrationData.push(n, a);
		return new pu(t);
	}, e.render = function(e, t, n) {
		if (!hu(t)) throw Error(r(200));
		return vu(null, e, t, !1, n);
	}, e.unmountComponentAtNode = function(e) {
		if (!hu(e)) throw Error(r(40));
		return e._reactRootContainer ? (wl(function() {
			vu(null, null, e, !1, function() {
				e._reactRootContainer = null, e[Mi] = null;
			});
		}), !0) : !1;
	}, e.unstable_batchedUpdates = Cl, e.unstable_renderSubtreeIntoContainer = function(e, t, n, i) {
		if (!hu(n)) throw Error(r(200));
		if (e == null || e._reactInternals === void 0) throw Error(r(38));
		return vu(e, t, n, !1, i);
	}, e.version = "18.3.1-next-f1338f8080-20240426";
})), d = /* @__PURE__ */ e(((e, t) => {
	function n() {
		if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = u();
})), f = (/* @__PURE__ */ e(((e) => {
	var t = d();
	e.createRoot = t.createRoot, e.hydrateRoot = t.hydrateRoot;
})))(), p = o(), m = i();
function h({ workspace: e }) {
	let t = (0, p.useRef)(null);
	return /* @__PURE__ */ (0, m.jsxs)("form", {
		className: "agent-home-prompt",
		onSubmit: e.handleSubmit,
		children: [
			/* @__PURE__ */ (0, m.jsxs)("div", {
				className: "agent-home-prompt-shell",
				children: [/* @__PURE__ */ (0, m.jsx)("textarea", {
					value: e.input,
					onChange: (t) => e.setInput(t.target.value),
					onKeyDown: (e) => {
						e.key === "Enter" && !e.shiftKey && (e.preventDefault(), e.currentTarget.form?.requestSubmit());
					},
					placeholder: "Folio OS에서 무엇을 빌드할까요?",
					rows: 3
				}), /* @__PURE__ */ (0, m.jsxs)("div", {
					className: "agent-home-toolbar",
					children: [
						/* @__PURE__ */ (0, m.jsx)("input", {
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
						/* @__PURE__ */ (0, m.jsxs)("div", {
							className: "agent-home-toolbar-left",
							children: [/* @__PURE__ */ (0, m.jsx)("button", {
								type: "button",
								className: "agent-home-icon-btn",
								onClick: () => t.current?.click(),
								"aria-label": "파일 첨부",
								"data-tooltip": "파일 첨부",
								children: "+"
							}), /* @__PURE__ */ (0, m.jsx)("span", {
								className: "agent-home-provider",
								children: e.adapter?.label || e.adapter?.id || "Folio OS"
							})]
						}),
						/* @__PURE__ */ (0, m.jsxs)("div", {
							className: "agent-home-toolbar-right",
							children: [
								/* @__PURE__ */ (0, m.jsx)("select", {
									"aria-label": "모델",
									value: e.model,
									onChange: (t) => e.persistModel(t.target.value),
									children: e.modelChoices.length > 0 ? e.modelChoices.map((e) => /* @__PURE__ */ (0, m.jsx)("option", {
										value: e.value,
										children: e.label
									}, e.value)) : /* @__PURE__ */ (0, m.jsx)("option", {
										value: "",
										children: "모델 목록 없음"
									})
								}),
								/* @__PURE__ */ (0, m.jsxs)("select", {
									"aria-label": "노력 단계",
									value: e.effort,
									onChange: (t) => e.setEffort(t.target.value),
									children: [
										/* @__PURE__ */ (0, m.jsx)("option", {
											value: "low",
											children: "낮음"
										}),
										/* @__PURE__ */ (0, m.jsx)("option", {
											value: "medium",
											children: "중간"
										}),
										/* @__PURE__ */ (0, m.jsx)("option", {
											value: "high",
											children: "높음"
										}),
										/* @__PURE__ */ (0, m.jsx)("option", {
											value: "max",
											children: "최대"
										})
									]
								}),
								/* @__PURE__ */ (0, m.jsx)("button", {
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
			e.settingsMessage && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "agent-home-notice",
				children: e.settingsMessage
			}),
			e.attachments.length > 0 && /* @__PURE__ */ (0, m.jsx)("div", {
				className: "agent-home-attachments",
				children: e.attachments.map((t) => /* @__PURE__ */ (0, m.jsxs)("span", { children: [t.name, /* @__PURE__ */ (0, m.jsx)("button", {
					type: "button",
					"aria-label": `${t.name} 첨부 제거`,
					onClick: () => e.setAttachments((e) => e.filter((e) => e.name !== t.name)),
					children: "×"
				})] }, t.name))
			}),
			e.quickStatus && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "agent-home-notice",
				children: e.quickStatus
			}),
			e.error && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "agent-home-error",
				children: e.error
			})
		]
	});
}
//#endregion
//#region src/app/agentWorkspace/presenters.ts
var g = /* @__PURE__ */ new Set([
	"codex",
	"claude",
	"antigravity"
]), _ = /* @__PURE__ */ new Set(["agent_bridge", "rss"]);
function v(e) {
	return e === "high" ? "높음" : e === "low" ? "낮음" : e === "max" ? "최대" : "중간";
}
function y(e) {
	return `${Math.max(1, Math.round((Date.now() - e) / 1e3))}초`;
}
function b(e) {
	let t = `${e.label || ""} ${e.message || ""}`;
	return _.has(String(e.kind || "")) || /^LLM CLI|Agent/.test(t);
}
function x(e) {
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
function S(e) {
	let t = e.result || {}, n = t.artifactType || "", r = t.artifactId || t.reportId || "", i = t.date || "";
	return n === "briefing" && i ? `#/briefing/${i}/both` : n === "company_analysis" && r ? `#/analysis/${encodeURIComponent(r)}` : n === "topic_report" && r ? `#/deep-research/${encodeURIComponent(r)}` : String(e.label || "").includes("RSS") ? "#/rss" : "";
}
function C(e) {
	let t = e?.provider && g.has(e.provider) ? e.provider : e?.selectedAdapter || "";
	return e?.adapters?.find((e) => e.id === t) || null;
}
function w(e) {
	return e?.modelChoices || [];
}
function T(e) {
	let t = w(e);
	return t.length ? t.some((t) => t.value === e?.model) ? String(e?.model || "") : t[0].value : "";
}
function E(e) {
	let t = e;
	return !!(t?.id && ["queued", "running"].includes(t.status));
}
function D(e) {
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
function O(e, t) {
	return `${e.view || "report"}-${e.date || ""}-${e.title || t}`;
}
//#endregion
//#region src/app/agentWorkspace/AgentJobsPanel.tsx
function k({ workspace: e }) {
	return /* @__PURE__ */ (0, m.jsxs)("section", {
		className: `agent-home-jobs${e.jobsOpen ? " open" : ""}`,
		"aria-label": "AI Agent 작업",
		children: [/* @__PURE__ */ (0, m.jsxs)("div", {
			className: "agent-home-section-head",
			children: [/* @__PURE__ */ (0, m.jsxs)("div", { children: [/* @__PURE__ */ (0, m.jsx)("p", {
				className: "section-kicker",
				children: "Agent Work"
			}), /* @__PURE__ */ (0, m.jsx)("h2", { children: "최근 작업" })] }), /* @__PURE__ */ (0, m.jsxs)("div", {
				className: "agent-home-jobs-actions",
				children: [e.jobsOpen && /* @__PURE__ */ (0, m.jsx)("button", {
					type: "button",
					onClick: () => e.loadRecentJobs().catch(() => void 0),
					disabled: e.jobsLoading,
					children: e.jobsLoading ? "확인 중" : "새로고침"
				}), /* @__PURE__ */ (0, m.jsx)("button", {
					type: "button",
					onClick: () => e.setJobsOpen((e) => !e),
					"aria-expanded": e.jobsOpen,
					children: e.jobsOpen ? "접기 ▲" : "펼치기 ▼"
				})]
			})]
		}), e.jobsOpen ? e.recentJobs.length > 0 ? /* @__PURE__ */ (0, m.jsx)("div", {
			className: "agent-home-job-list",
			children: e.recentJobs.map((e) => {
				let t = S(e);
				return /* @__PURE__ */ (0, m.jsxs)("article", {
					className: `agent-home-job ${e.status}`,
					children: [/* @__PURE__ */ (0, m.jsxs)("div", { children: [
						/* @__PURE__ */ (0, m.jsx)("strong", { children: e.label || e.kind || "작업" }),
						/* @__PURE__ */ (0, m.jsx)("p", { children: e.message || e.error || "상태 메시지가 없습니다." }),
						/* @__PURE__ */ (0, m.jsxs)("span", {
							className: "agent-home-job-meta",
							children: [
								e.status,
								typeof e.progress == "number" ? ` · ${e.progress}%` : "",
								x(e) ? ` · ${x(e)}` : ""
							]
						})
					] }), t && /* @__PURE__ */ (0, m.jsx)("button", {
						type: "button",
						onClick: () => {
							window.location.hash = t;
						},
						children: "열기"
					})]
				}, e.id);
			})
		}) : /* @__PURE__ */ (0, m.jsx)("p", {
			className: "agent-home-empty",
			children: "아직 표시할 Agent 작업이 없습니다. Home에서 질문하거나 브리핑/RSS 빠른 실행을 사용하면 여기에 남습니다."
		}) : null]
	});
}
//#endregion
//#region src/app/AgentMessageContent.tsx
function A(e) {
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
function j(e) {
	return A(e).map((e, t) => e.type === "strong" ? /* @__PURE__ */ (0, m.jsx)("strong", { children: e.value }, t) : e.type === "code" ? /* @__PURE__ */ (0, m.jsx)("code", { children: e.value }, t) : e.type === "link" ? /^https?:\/\//i.test(e.href) ? /* @__PURE__ */ (0, m.jsx)("a", {
		href: e.href,
		target: "_blank",
		rel: "noreferrer",
		children: e.label
	}, t) : /* @__PURE__ */ (0, m.jsx)("code", {
		title: e.href,
		children: e.label
	}, t) : /* @__PURE__ */ (0, m.jsx)("span", { children: e.value }, t));
}
function M(e, t) {
	e.length &&= (t.push(/* @__PURE__ */ (0, m.jsx)("p", { children: j(e.join(" ")) }, `p-${t.length}`)), 0);
}
function ee({ text: e = "" }) {
	let t = [], n = [], r = [], i = "";
	function a() {
		if (!r.length) return;
		let e = r.map((e, t) => /* @__PURE__ */ (0, m.jsx)("li", { children: j(e) }, t));
		t.push(i === "ol" ? /* @__PURE__ */ (0, m.jsx)("ol", { children: e }, `ol-${t.length}`) : /* @__PURE__ */ (0, m.jsx)("ul", { children: e }, `ul-${t.length}`)), r = [], i = "";
	}
	for (let o of e.replace(/\r\n/g, "\n").split("\n")) {
		let e = o.trim();
		if (!e) {
			M(n, t), a();
			continue;
		}
		let s = e.match(/^(#{2,4})\s+(.+)$/);
		if (s) {
			M(n, t), a(), t.push(/* @__PURE__ */ (0, m.jsx)("h4", { children: j(s[2]) }, `h-${t.length}`));
			continue;
		}
		let c = e.match(/^\d+[.)]\s+(.+)$/);
		if (c) {
			M(n, t), i && i !== "ol" && a(), i = "ol", r.push(c[1]);
			continue;
		}
		let l = e.match(/^[-*•]\s+(.+)$/);
		if (l) {
			M(n, t), i && i !== "ul" && a(), i = "ul", r.push(l[1]);
			continue;
		}
		if (r.length) {
			r[r.length - 1] = `${r[r.length - 1]} ${e}`;
			continue;
		}
		n.push(e);
	}
	return M(n, t), a(), /* @__PURE__ */ (0, m.jsx)("div", {
		className: "agent-chat-markdown",
		children: t
	});
}
function N({ state: e = "pending", title: t, meta: n }) {
	return /* @__PURE__ */ (0, m.jsxs)("div", {
		className: `agent-run-card ${e}`,
		children: [/* @__PURE__ */ (0, m.jsx)("span", {
			className: "agent-run-icon",
			"aria-hidden": "true"
		}), /* @__PURE__ */ (0, m.jsxs)("div", { children: [/* @__PURE__ */ (0, m.jsx)("strong", { children: t }), n && /* @__PURE__ */ (0, m.jsx)("span", { children: n })] })]
	});
}
//#endregion
//#region src/app/agentWorkspace/AgentThread.tsx
function P({ workspace: e }) {
	return e.hasConversation ? /* @__PURE__ */ (0, m.jsxs)("section", {
		className: "agent-home-thread agent-home-right",
		"aria-label": "AI Agent 대화",
		children: [/* @__PURE__ */ (0, m.jsxs)("div", {
			className: "agent-home-section-head",
			children: [/* @__PURE__ */ (0, m.jsxs)("div", { children: [/* @__PURE__ */ (0, m.jsx)("p", {
				className: "section-kicker",
				children: "Agent Thread"
			}), /* @__PURE__ */ (0, m.jsx)("h2", { children: "현재 대화" })] }), /* @__PURE__ */ (0, m.jsx)("button", {
				type: "button",
				onClick: e.startNewConversation,
				children: "새 대화"
			})]
		}), /* @__PURE__ */ (0, m.jsx)("div", {
			className: "agent-home-log",
			"aria-live": "polite",
			children: e.messages.map((t) => /* @__PURE__ */ (0, m.jsxs)("article", {
				className: `agent-home-message ${t.role}${t.pending ? " pending" : ""}`,
				children: [/* @__PURE__ */ (0, m.jsxs)("div", {
					className: "agent-home-message-body",
					children: [
						t.runTitle && /* @__PURE__ */ (0, m.jsx)(N, {
							state: t.runState,
							title: t.runTitle,
							meta: t.runMeta
						}),
						t.text && /* @__PURE__ */ (0, m.jsx)(ee, { text: t.text }),
						t.notice && /* @__PURE__ */ (0, m.jsx)("p", {
							className: "agent-home-notice",
							children: t.notice
						}),
						(t.attachments || []).length > 0 && /* @__PURE__ */ (0, m.jsx)("div", {
							className: "agent-home-attachments",
							children: t.attachments?.map((e) => /* @__PURE__ */ (0, m.jsx)("span", { children: e }, e))
						})
					]
				}), t.proposal && /* @__PURE__ */ (0, m.jsxs)("div", {
					className: "agent-home-proposal",
					children: [
						/* @__PURE__ */ (0, m.jsxs)("div", { children: [/* @__PURE__ */ (0, m.jsx)("strong", { children: "수정 제안" }), /* @__PURE__ */ (0, m.jsxs)("span", { children: [
							t.proposal.artifactKind,
							" ",
							t.proposal.artifactId
						] })] }),
						t.proposal.summary && /* @__PURE__ */ (0, m.jsx)("p", { children: t.proposal.summary }),
						t.proposal.diff && /* @__PURE__ */ (0, m.jsxs)("details", { children: [/* @__PURE__ */ (0, m.jsx)("summary", { children: "diff 보기" }), /* @__PURE__ */ (0, m.jsx)("pre", { children: t.proposal.diff })] }),
						t.proposalStatus === "pending" ? /* @__PURE__ */ (0, m.jsxs)("div", {
							className: "agent-home-proposal-actions",
							children: [/* @__PURE__ */ (0, m.jsx)("button", {
								type: "button",
								onClick: () => e.handleProposalAction(t.id, t.proposal.id, "approve"),
								children: "승인"
							}), /* @__PURE__ */ (0, m.jsx)("button", {
								type: "button",
								onClick: () => e.handleProposalAction(t.id, t.proposal.id, "reject"),
								children: "거절"
							})]
						}) : /* @__PURE__ */ (0, m.jsxs)("p", {
							className: "agent-home-notice",
							children: ["상태: ", t.proposalStatus]
						})
					]
				})]
			}, t.id))
		})]
	}) : null;
}
//#endregion
//#region src/api.ts
async function F(e) {
	let t = await fetch(e, { headers: { "Content-Type": "application/json" } });
	if (!t.ok) throw Error(`${e} failed: ${t.status}`);
	return await t.json();
}
async function I(e, t) {
	let n = await fetch(e, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(t)
	});
	if (!n.ok) throw Error(`${e} failed: ${n.status}`);
	return await n.json();
}
//#endregion
//#region src/app/agentContext.ts
function L(e = {}) {
	let t = {
		...window.FolioAgent?.currentContext || {},
		...e
	};
	return window.FolioAgent = {
		...window.FolioAgent || {},
		currentContext: t
	}, t;
}
function R(e = {}) {
	L(e), window.FolioBridge?.openAgentDock?.(e);
}
//#endregion
//#region src/app/agentWorkspace/storage.ts
var z = "folio.agentHome.thread.v1", B = {
	id: "welcome",
	role: "assistant",
	text: "무엇을 조사하거나 정리할까요? 질문으로 시작해도 되고, 보고서 수정 작업을 지시해도 됩니다.",
	notice: "저장 변경은 proposal 승인 전에는 반영되지 않습니다."
};
function V(e) {
	return e.filter((e) => e.id !== "welcome").map((e) => ({
		...e,
		pending: !1,
		text: e.pending ? `${e.text}\n\n이전 세션에서 완료 여부를 확인하지 못했습니다.` : e.text
	})).slice(-80);
}
function H() {
	if (typeof window > "u") return [B];
	try {
		let e = window.localStorage.getItem(z);
		if (!e) return [B];
		let t = JSON.parse(e), n = Array.isArray(t?.messages) ? t.messages.filter((e) => e?.role === "user" || e?.role === "assistant") : [];
		return n.length ? [B, ...n] : [B];
	} catch {
		return [B];
	}
}
var te = H(), ne = JSON.stringify(V(te)), re = /* @__PURE__ */ new Set();
function ie() {
	let e = [...te];
	re.forEach((t) => t(e));
}
function ae() {
	return [...te];
}
function oe(e) {
	let t = V(e), n = JSON.stringify(t);
	if (n !== ne) {
		if (te = e.length ? [...e] : [B], ne = n, typeof window < "u") try {
			t.length ? window.localStorage.setItem(z, JSON.stringify({
				version: 1,
				updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
				messages: t
			})) : window.localStorage.removeItem(z);
		} catch {}
		ie();
	}
}
function se() {
	if (te = [B], ne = "[]", typeof window < "u") try {
		window.localStorage.removeItem(z);
	} catch {}
	ie();
}
function ce(e) {
	return re.add(e), () => {
		re.delete(e);
	};
}
typeof window < "u" && window.addEventListener("storage", (e) => {
	e.key === "folio.agentHome.thread.v1" && (te = H(), ne = JSON.stringify(V(te)), ie());
});
//#endregion
//#region src/app/agentWorkspace/useAgentWorkspace.ts
var le = 3, ue = 2e5, de = 4e3;
function fe(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function pe() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
async function me(e) {
	let t = e;
	for (; ["queued", "running"].includes(t.status);) await fe(1e3), t = await F(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "Agent 작업에 실패했습니다.");
	return t;
}
async function he(e) {
	let t = e.type.startsWith("text/") || /\.(md|txt|csv|json)$/i.test(e.name) ? await e.text() : "";
	return {
		name: e.name.slice(0, 120),
		size: e.size,
		content: t.slice(0, de)
	};
}
function ge(e = "agent_home") {
	let [t, n] = (0, p.useState)(() => ae()), [r, i] = (0, p.useState)(""), [a, o] = (0, p.useState)(""), [s, c] = (0, p.useState)(null), [l, u] = (0, p.useState)(""), [d, f] = (0, p.useState)("medium"), [m, h] = (0, p.useState)([]), [g, _] = (0, p.useState)([]), [x, S] = (0, p.useState)([]), [D, O] = (0, p.useState)(!1), [k, A] = (0, p.useState)(!1), [j, M] = (0, p.useState)(""), [ee, N] = (0, p.useState)(""), [P, R] = (0, p.useState)(!1), [z, B] = (0, p.useState)("");
	(0, p.useEffect)(() => {
		L({ surface: e });
	}, [e]), (0, p.useEffect)(() => ce(n), []), (0, p.useEffect)(() => {
		oe(t);
	}, [t]);
	let V = (0, p.useCallback)((e, t = !1) => {
		let n = C(e);
		c(e), u(e.message || ""), o((e) => {
			let r = T(n);
			return t && w(n).some((t) => t.value === e) ? e : r;
		});
	}, []), H = (0, p.useCallback)(async (e = !1) => {
		let t = await F(`/api/agent-bridge/settings${e ? "?refresh=true" : ""}`);
		V(t, !0);
	}, [V]);
	(0, p.useEffect)(() => {
		let e = !0;
		return F("/api/agent-bridge/settings").then((t) => {
			e && V(t);
		}).catch((t) => {
			e && u(t instanceof Error ? t.message : "Agent 설정을 불러오지 못했습니다.");
		}), () => {
			e = !1;
		};
	}, [V]), (0, p.useEffect)(() => {
		let e = (e) => {
			let t = e.detail;
			t ? V(t) : H().catch((e) => {
				u(e instanceof Error ? e.message : "Agent 설정을 불러오지 못했습니다.");
			});
		};
		return window.addEventListener("folio:agent-settings-updated", e), () => window.removeEventListener("folio:agent-settings-updated", e);
	}, [V, H]), (0, p.useEffect)(() => {
		let e = !0;
		return Promise.allSettled([F("/api/dashboard"), F("/api/investment-review")]).then((t) => {
			if (!e) return;
			let n = t[0].status === "fulfilled" ? t[0].value : null, r = [...(t[1].status === "fulfilled" ? t[1].value : null)?.recentReports || [], ...n?.briefings || []], i = /* @__PURE__ */ new Set();
			_(r.filter((e, t) => {
				let n = `${e.view || ""}:${e.date || ""}:${e.title || t}`;
				return i.has(n) ? !1 : (i.add(n), !0);
			}).slice(0, 3));
		}), () => {
			e = !1;
		};
	}, []);
	let te = (0, p.useCallback)(async () => {
		O(!0);
		try {
			let e = await F("/api/jobs");
			S((Array.isArray(e) ? e : []).filter(b).slice(0, 4));
		} finally {
			O(!1);
		}
	}, []);
	(0, p.useEffect)(() => {
		te().catch(() => void 0);
	}, [te]);
	function ne() {
		se(), n(ae()), i(""), h([]), B(""), N("");
	}
	async function re(t) {
		t.preventDefault();
		let o = r.trim();
		if (!o || P) return;
		let c = {
			id: pe(),
			role: "user",
			text: o,
			attachments: m.map((e) => e.name),
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		}, l = pe(), u = Date.now(), f = C(s), p = f?.label || "Agent", g = a || f?.model || "model";
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
				runMeta: `${g} · ${v(d)} · on-request`,
				createdAt: new Date(u).toISOString()
			}
		]), i(""), B(""), R(!0);
		try {
			let t = await me(await I("/api/agent/chat", {
				message: o,
				context: { surface: e },
				options: {
					model: a,
					effort: d,
					attachments: m
				}
			})), r = t.result || {};
			te().catch(() => void 0), n((e) => e.map((e) => e.id === l ? {
				...e,
				text: r.reply || t.message || "Agent가 응답을 반환하지 않았습니다.",
				notice: r.notice,
				pending: !1,
				proposal: r.proposal || null,
				proposalStatus: r.proposal ? "pending" : "",
				runState: "done",
				runTitle: `${p} 응답`,
				runMeta: `${g} · ${v(d)} · ${y(u)}`
			} : e)), h([]);
		} catch (e) {
			let t = e instanceof Error ? e.message : "Agent 요청에 실패했습니다.";
			B(t), n((e) => e.map((e) => e.id === l ? {
				...e,
				text: t,
				pending: !1,
				runState: "error",
				runTitle: `${p} 오류`,
				runMeta: `${g} · ${v(d)}`
			} : e));
		} finally {
			R(!1);
		}
	}
	async function ie(e) {
		if (B(""), N(""), e === "analysis") {
			window.location.hash = "#/analysis";
			return;
		}
		M(e);
		try {
			if (e === "rss") {
				N("RSS 수집을 시작했습니다.");
				let e = await I("/api/rssarchive/import", {});
				E(e) && await me(e), te().catch(() => void 0), N("RSS 수집이 끝났습니다."), window.location.hash = "#/rss";
				return;
			}
			N("오늘 브리핑을 생성하는 중입니다.");
			let t = await I("/api/briefings", {
				marketScope: "both",
				briefingType: "default"
			}), n = "";
			if (E(t)) {
				let e = await me(t);
				n = e.result?.date || e.result?.artifactId || "";
			} else n = t.date || "";
			te().catch(() => void 0), N(n ? "오늘 브리핑을 생성했습니다." : "브리핑 생성이 끝났습니다."), window.location.hash = n ? `#/briefing/${n}/both` : "#/briefing";
		} catch (e) {
			let t = e instanceof Error ? e.message : "빠른 실행에 실패했습니다.";
			B(t), N(t);
		} finally {
			M("");
		}
	}
	async function de(e) {
		if (!e) return;
		B("");
		let t = [...m];
		for (let n of Array.from(e)) {
			if (t.length >= le) {
				B(`첨부는 최대 ${le}개까지 가능합니다.`);
				break;
			}
			if (n.size > ue) {
				B(`${n.name}은 200KB를 초과해 제외했습니다.`);
				continue;
			}
			t.push(await he(n));
		}
		h(t);
	}
	async function fe(e, t, r) {
		B("");
		try {
			let i = await I(`/api/agent/proposals/${encodeURIComponent(t)}`, { action: r });
			n((t) => t.map((t) => t.id === e ? {
				...t,
				proposalStatus: i.status || r
			} : t));
		} catch (e) {
			B(e instanceof Error ? e.message : "제안 처리에 실패했습니다.");
		}
	}
	let ge = C(s), _e = w(ge), ve = t.some((e) => e.id !== "welcome");
	async function ye(e) {
		if (o(e), !(!ge?.id || !e)) try {
			let t = Object.fromEntries((s?.adapters || []).map((e) => [e.id, e.model || ""]));
			t[ge.id] = e;
			let n = await I("/api/agent-bridge/settings", {
				provider: ge.id,
				models: t
			});
			V(n, !0), window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: n }));
		} catch (e) {
			B(e instanceof Error ? e.message : "모델 설정 저장에 실패했습니다.");
		}
	}
	return {
		messages: t,
		input: r,
		setInput: i,
		model: a,
		effort: d,
		setEffort: f,
		attachments: m,
		setAttachments: h,
		recentReports: g || [],
		recentJobs: x,
		jobsLoading: D,
		jobsOpen: k,
		setJobsOpen: A,
		quickBusy: j,
		quickStatus: ee,
		busy: P,
		error: z,
		settingsMessage: l,
		adapter: ge,
		modelChoices: _e,
		hasConversation: ve,
		handleSubmit: re,
		handleFiles: de,
		handleProposalAction: fe,
		loadRecentJobs: te,
		persistModel: ye,
		runQuickAction: ie,
		startNewConversation: ne
	};
}
//#endregion
//#region src/app/HomeModeSwitch.tsx
function _e({ current: e }) {
	let t = e === "office" ? "home" : "office";
	return /* @__PURE__ */ (0, m.jsx)("button", {
		type: "button",
		className: "home-mode-switch",
		onClick: () => {
			window.location.hash = `#/${t}`;
		},
		"aria-label": t === "office" ? "Pixel Office로 전환" : "Agent Home으로 전환",
		children: t === "office" ? "Pixel Office" : "Agent Home"
	});
}
//#endregion
//#region src/app/AgentHome.tsx
function ve() {
	let e = ge("agent_home");
	return /* @__PURE__ */ (0, m.jsx)("div", {
		className: "react-home-route",
		"data-agent-home": !0,
		children: /* @__PURE__ */ (0, m.jsxs)("div", {
			className: `agent-home ${e.hasConversation ? "has-conversation" : "is-empty"}`,
			children: [
				/* @__PURE__ */ (0, m.jsxs)("div", {
					className: "agent-home-left",
					children: [
						/* @__PURE__ */ (0, m.jsxs)("header", {
							className: "home-hero agent-home-hero",
							children: [
								/* @__PURE__ */ (0, m.jsx)("p", {
									className: "eyebrow",
									children: "Local Investment Research Workspace"
								}),
								/* @__PURE__ */ (0, m.jsx)("h1", { children: "Folio OS" }),
								/* @__PURE__ */ (0, m.jsx)(_e, { current: "home" })
							]
						}),
						/* @__PURE__ */ (0, m.jsx)(h, { workspace: e }),
						/* @__PURE__ */ (0, m.jsxs)("div", {
							className: "home-launcher agent-home-launcher",
							role: "group",
							"aria-label": "빠른 실행",
							children: [
								/* @__PURE__ */ (0, m.jsx)("button", {
									className: "launch-tile primary",
									type: "button",
									onClick: () => e.runQuickAction("briefing"),
									disabled: e.quickBusy === "briefing",
									children: e.quickBusy === "briefing" ? "생성 중" : "오늘 브리핑 생성"
								}),
								/* @__PURE__ */ (0, m.jsx)("button", {
									className: "launch-tile",
									type: "button",
									onClick: () => e.runQuickAction("rss"),
									disabled: e.quickBusy === "rss",
									children: e.quickBusy === "rss" ? "수집 중" : "RSS 수집"
								}),
								/* @__PURE__ */ (0, m.jsx)("button", {
									className: "launch-tile",
									type: "button",
									onClick: () => e.runQuickAction("analysis"),
									children: "기업 분석"
								})
							]
						}),
						e.recentReports.length > 0 && /* @__PURE__ */ (0, m.jsxs)("div", {
							className: "review-recent-wrap agent-home-recent",
							children: [/* @__PURE__ */ (0, m.jsx)("span", {
								className: "rv-recent-cap",
								children: "최근 보고서"
							}), /* @__PURE__ */ (0, m.jsx)("div", {
								className: "rv-recent",
								children: e.recentReports.map((e, t) => /* @__PURE__ */ (0, m.jsxs)("button", {
									className: "rv-rc",
									type: "button",
									"data-tooltip": `${e.title || "보고서"}${e.date ? ` · ${e.date}` : ""}`,
									onClick: () => {
										window.location.hash = D(e);
									},
									children: [/* @__PURE__ */ (0, m.jsx)("span", {
										className: "rv-rc-k",
										children: String(e.type || e.view || "REPORT").toUpperCase()
									}), /* @__PURE__ */ (0, m.jsx)("span", {
										className: "rv-rc-t",
										children: e.title || "제목 없음"
									})]
								}, O(e, t)))
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, m.jsx)(P, { workspace: e }),
				/* @__PURE__ */ (0, m.jsx)(k, { workspace: e })
			]
		})
	});
}
//#endregion
//#region src/app/legacyBridge.ts
function ye() {
	return window.FolioBridge ?? {};
}
//#endregion
//#region src/app/reportReader/ReaderActions.tsx
function be({ title: e, children: t }) {
	return /* @__PURE__ */ (0, m.jsxs)("section", {
		className: "report-reader-rail-group",
		"aria-label": e,
		children: [/* @__PURE__ */ (0, m.jsx)("p", {
			className: "section-kicker",
			children: e
		}), /* @__PURE__ */ (0, m.jsx)("div", {
			className: "report-reader-rail-actions",
			children: t
		})]
	});
}
function xe({ icon: e, children: t, ...n }) {
	return /* @__PURE__ */ (0, m.jsxs)("button", {
		className: "report-action-btn",
		type: "button",
		...n,
		children: [/* @__PURE__ */ (0, m.jsx)(Se, { name: e }), /* @__PURE__ */ (0, m.jsx)("span", { children: t })]
	});
}
function Se({ name: e }) {
	return e === "agent" ? /* @__PURE__ */ (0, m.jsx)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, m.jsx)("path", { d: "m4 17 6-6-6-6m8 14h8" })
	}) : e === "link" ? /* @__PURE__ */ (0, m.jsxs)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, m.jsx)("path", {
				fill: "currentColor",
				stroke: "none",
				fillRule: "evenodd",
				clipRule: "evenodd",
				d: "M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h6.4a6 6 0 0 1 8.6-8.4V5a3 3 0 0 0-3-3H5Zm2 4a1 1 0 0 0 0 2h10a1 1 0 1 0 0-2H7Zm0 4a1 1 0 1 0 0 2h5a1 1 0 1 0 0-2H7Z"
			}),
			/* @__PURE__ */ (0, m.jsx)("path", { d: "M20.5 17.4a3 3 0 1 1-.9-2.1" }),
			/* @__PURE__ */ (0, m.jsx)("path", { d: "M20.9 14.1v2.3h-2.3" })
		]
	}) : e === "notion" ? /* @__PURE__ */ (0, m.jsx)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, m.jsx)("path", {
			fill: "currentColor",
			stroke: "none",
			d: "M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"
		})
	}) : e === "obsidian" ? /* @__PURE__ */ (0, m.jsx)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, m.jsx)("path", {
			fill: "currentColor",
			stroke: "none",
			d: "M19.355 18.538a68.967 68.959 0 0 0 1.858-2.954.81.81 0 0 0-.062-.9c-.516-.685-1.504-2.075-2.042-3.362-.553-1.321-.636-3.375-.64-4.377a1.707 1.707 0 0 0-.358-1.05l-3.198-4.064a3.744 3.744 0 0 1-.076.543c-.106.503-.307 1.004-.536 1.5-.134.29-.29.6-.446.914l-.31.626c-.516 1.068-.997 2.227-1.132 3.59-.124 1.26.046 2.73.815 4.481.128.011.257.025.386.044a6.363 6.363 0 0 1 3.326 1.505c.916.79 1.744 1.922 2.415 3.5zM8.199 22.569c.073.012.146.02.22.02.78.024 2.095.092 3.16.29.87.16 2.593.64 4.01 1.055 1.083.316 2.198-.548 2.355-1.664.114-.814.33-1.735.725-2.58l-.01.005c-.67-1.87-1.522-3.078-2.416-3.849a5.295 5.295 0 0 0-2.778-1.257c-1.54-.216-2.952.19-3.84.45.532 2.218.368 4.829-1.425 7.531zM5.533 9.938c-.023.1-.056.197-.098.29L2.82 16.059a1.602 1.602 0 0 0 .313 1.772l4.116 4.24c2.103-3.101 1.796-6.02.836-8.3-.728-1.73-1.832-3.081-2.55-3.831zM9.32 14.01c.615-.183 1.606-.465 2.745-.534-.683-1.725-.848-3.233-.716-4.577.154-1.552.7-2.847 1.235-3.95.113-.235.223-.454.328-.664.149-.297.288-.577.419-.86.217-.47.379-.885.46-1.27.08-.38.08-.72-.014-1.043-.095-.325-.297-.675-.68-1.06a1.6 1.6 0 0 0-1.475.36l-4.95 4.452a1.602 1.602 0 0 0-.513.952l-.427 2.83c.672.59 2.328 2.316 3.335 4.711.09.21.175.43.253.653z"
		})
	}) : /* @__PURE__ */ (0, m.jsxs)("svg", {
		className: "report-action-icon",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, m.jsx)("path", { d: "m4 12 15-7-7 15-2-6z" }), /* @__PURE__ */ (0, m.jsx)("path", { d: "m10 14 4-4" })]
	});
}
//#endregion
//#region src/app/reportReader/MarkdownRenderer.tsx
function Ce(e) {
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
function we(e) {
	return Ce(e).map((e, t) => e.type === "strong" ? /* @__PURE__ */ (0, m.jsx)("strong", { children: e.value }, t) : e.type === "code" ? /* @__PURE__ */ (0, m.jsx)("code", { children: e.value }, t) : e.type === "link" ? /* @__PURE__ */ (0, m.jsx)("a", {
		href: e.href,
		target: "_blank",
		rel: "noreferrer",
		children: e.label
	}, t) : /* @__PURE__ */ (0, m.jsx)("span", { children: e.value }, t));
}
function Te(e, t) {
	e.length &&= (t.push(/* @__PURE__ */ (0, m.jsx)("p", { children: we(e.join(" ")) }, `p-${t.length}`)), 0);
}
function Ee({ markdown: e = "" }) {
	let t = [], n = [], r = e.replace(/\r\n/g, "\n").split("\n"), i = [];
	function a() {
		i.length && (t.push(/* @__PURE__ */ (0, m.jsx)("ul", { children: i.map((e, t) => /* @__PURE__ */ (0, m.jsx)("li", { children: we(e) }, t)) }, `ul-${t.length}`)), i = []);
	}
	for (let e of r) {
		let r = e.trimEnd().trim();
		if (!r) {
			Te(n, t), a();
			continue;
		}
		let o = r.match(/^(#{2,4})\s+(.+)$/);
		if (o) {
			Te(n, t), a();
			let e = o[1].length, r = we(o[2]);
			e === 2 ? t.push(/* @__PURE__ */ (0, m.jsx)("h2", { children: r }, `h-${t.length}`)) : e === 3 ? t.push(/* @__PURE__ */ (0, m.jsx)("h3", { children: r }, `h-${t.length}`)) : t.push(/* @__PURE__ */ (0, m.jsx)("h4", { children: r }, `h-${t.length}`));
			continue;
		}
		let s = r.match(/^[-*]\s+(.+)$/);
		if (s) {
			Te(n, t), i.push(s[1]);
			continue;
		}
		n.push(r);
	}
	return Te(n, t), a(), /* @__PURE__ */ (0, m.jsx)("div", {
		className: "react-markdown markdown-brief report-body",
		children: t
	});
}
//#endregion
//#region src/app/reportReader/ReportBody.tsx
function De(e = "") {
	let t = e.replace(/\r\n/g, "\n"), n = /^#{1,3}\s*(?:참고\s*자료|참고자료|Sources Used|Sources)\s*$/gim.exec(t);
	return !n || n.index === void 0 ? e : t.slice(0, n.index).trim();
}
function Oe({ markdown: e = "", marketScope: t = "both", briefing: n, sourcePanelHtml: r = "" }) {
	let i = (0, p.useRef)(null), a = ye(), o = De(e), s = a.renderMarkdown?.(o);
	return (0, p.useEffect)(() => {
		let e = i.current;
		if (!(!e || !n || !a.renderBriefingVisuals)) return a.renderBriefingVisuals(e, n), () => a.cleanupBriefingVisuals?.();
	}, [o, n]), s === void 0 ? /* @__PURE__ */ (0, m.jsx)(Ee, { markdown: o }) : /* @__PURE__ */ (0, m.jsxs)(m.Fragment, { children: [/* @__PURE__ */ (0, m.jsx)("article", {
		ref: i,
		className: "markdown-brief report-body",
		"data-market-scope": t,
		dangerouslySetInnerHTML: { __html: s }
	}), r && /* @__PURE__ */ (0, m.jsx)("div", { dangerouslySetInnerHTML: { __html: r } })] });
}
//#endregion
//#region src/app/reportReader/FolioNotePanel.tsx
var ke = [
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
].join("\n"), Ae = [
	"떠오르는 생각을 자유롭게 정리해보세요. 막연한 느낌이나 궁금증 한 줄만 작성해도 됩니다.",
	"",
	"예시: \"이 주식은 앞으로 받을 수혜가 커 보여서 관심 있음\"",
	"예시: \"가격이 너무 오른 것 같은데 그래도 들고 갈 만한가?\""
].join("\n"), je = "[대화]", Me = "[투자 노트]";
function Ne(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
async function Pe(e) {
	let t = e;
	for (; ["queued", "running"].includes(t.status);) await Ne(1e3), t = await F(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "Agent 작업에 실패했습니다.");
	return t;
}
function Fe(e) {
	let t = String(e || ""), n = t.indexOf(Me), r = (e) => e.replace(/^\s*\[대화\]\s*/, "").trim();
	return n < 0 ? {
		message: r(t),
		note: ""
	} : {
		message: r(t.slice(0, n)),
		note: t.slice(n + 7).trim()
	};
}
function Ie(e, t) {
	let n = t.trim();
	if (!n) return e;
	let r = e[e.length - 1];
	return r?.role === "user" && r.body.trim() === n ? e : [...e, {
		role: "user",
		body: n,
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	}];
}
function Le(e, t, n = "") {
	return [...e, {
		role: "agent",
		body: t,
		summary: n || "Agent 답변",
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	}];
}
function Re(e, t, n, r, i = [], a = []) {
	let o = i.slice(-8).map((e, t) => `${t + 1}. ${e.body}`).join("\n"), s = a.slice(-8).map((e, t) => {
		let { message: n, note: r } = Fe(e.body);
		return `${t + 1}. ${e.summary || "Agent"}: ${n || (r ? "(투자 노트 전체를 업데이트함)" : "")}`;
	}).join("\n\n");
	return [
		"현재 열린 보고서와 Folio OS Market Memory를 함께 참고해, 사용자와 대화하면서 투자 노트를 완성해줘.",
		"사용자가 적은 생각은 근거가 아니라 hypothesis다. 옹호하지 말고 검증 가능한 투자 노트로 다듬어줘.",
		"없는 사실은 지어내지 말고, 추가 확인 필요로 표시해줘.",
		"사용자 판단과 Agent가 제안하는 해석을 구분하고, 반대 근거와 다음 체크포인트를 포함해줘.",
		"사용자가 `>`로 인용한 문장이 있으면 그 문장에 대한 질문/첨삭 요청으로 이해하고 해당 부분을 중심으로 답해줘.",
		"응답 형식을 반드시 지켜줘:",
		`1) ${je} 아래에 사용자에게 하는 짧은 대화 답변(무엇을 반영/수정했는지, 확인하고 싶은 점)을 2~5문장으로 써줘.`,
		`2) 노트를 새로 만들거나 수정할 내용이 있으면 ${Me} 아래에 투자 노트 전체 Markdown을 써줘. 단순 질문에 답만 하는 경우에는 ${Me} 부분을 생략하고 기존 노트를 유지해줘.`,
		"기존 정리본이 있으면 전체를 갈아엎기보다 필요한 부분을 업데이트하고, 결정/업데이트 로그에 변경 이유를 남겨줘.",
		"투자 노트는 아래 큰 구조를 유지하되, 각 섹션은 초보 투자자가 바로 이해할 수 있게 짧고 명확하게 작성해줘.",
		ke,
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
function ze(e, t) {
	let n = String(t || e || "note"), r = 2166136261;
	for (let e = 0; e < n.length; e += 1) r ^= n.charCodeAt(e), r = Math.imul(r, 16777619) >>> 0;
	return `${e}-${r.toString(36)}`;
}
function Be({ identity: e, linkedTitle: t, overlayMarkdown: n = "" }) {
	let [r, i] = (0, p.useState)(""), [a, o] = (0, p.useState)(""), [s, c] = (0, p.useState)(""), [l, u] = (0, p.useState)([]), [d, f] = (0, p.useState)([]), [h, g] = (0, p.useState)(""), [_, v] = (0, p.useState)("chat"), [y, b] = (0, p.useState)([]), [x, S] = (0, p.useState)(!1), [C, w] = (0, p.useState)([]), T = (0, p.useRef)(null), E = C.includes("agent_assisted"), D = (0, p.useMemo)(() => [...l, ...d].sort((e, t) => String(e.createdAt || "").localeCompare(String(t.createdAt || ""))), [l, d]);
	(0, p.useEffect)(() => {
		let t = !0;
		async function n() {
			g("불러오는 중..."), b([]), i(""), o(""), c(""), u([]), f([]);
			try {
				let n = await F(`/api/investment-notes/${encodeURIComponent(e.id)}`);
				if (!t) return;
				i(n.body || ""), u(n.rawThoughts || []), f(n.interactionLog || []), w(n.tags || []), g(n.updatedAt ? `저장됨: ${n.updatedAt}` : "Folio 로컬 노트를 불러왔습니다.");
			} catch {
				if (!t) return;
				w([]), g("생각 한 줄에서 시작하세요.");
			}
			try {
				let n = await F(`/api/investment-notes/linked?${new URLSearchParams({
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
	]), (0, p.useEffect)(() => {
		let e = T.current;
		e && (e.scrollTop = e.scrollHeight);
	}, [D.length, _]);
	async function O(t, n, r, i = C) {
		let a = await I("/api/investment-notes", {
			...e,
			body: t,
			rawThoughts: n,
			interactionLog: r,
			tags: i
		});
		return w(a.tags || []), a;
	}
	function k() {
		let e = a.trim(), t = s.trim();
		return t && e ? `> ${t}\n\n${e}` : t ? `> ${t}` : e;
	}
	function A() {
		let e = window.getSelection()?.toString().replace(/\s+/g, " ").trim() || "";
		e.length >= 2 && c(e.slice(0, 400));
	}
	async function j() {
		let e = k();
		if (e) {
			g("저장 중...");
			try {
				let t = Ie(l, e), n = await O(r, t, d);
				u(n.rawThoughts || t), f(n.interactionLog || d), o(""), c(""), g("생각을 기록했습니다. Agent 정리는 나중에 요청할 수 있습니다.");
			} catch (e) {
				g(e instanceof Error ? `저장 실패: ${e.message}` : "저장 실패");
			}
		}
	}
	async function M() {
		let n = k();
		if (!n || x) return;
		S(!0), g("Agent가 응답을 준비하는 중...");
		let a = Ie(l, n);
		u(a), o(""), c("");
		try {
			let o = await Pe(await I("/api/agent/chat", {
				message: Re(e, r, n, t, a, d),
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
			let { note: l } = Fe(c), p = Le(d, c, s.notice || (l ? "투자 노트 업데이트" : "Agent 답변")), m = l || r, h = await O(m, a, p, l ? Array.from(/* @__PURE__ */ new Set([...C, "agent_assisted"])) : C);
			i(h.body || m), u(h.rawThoughts || a), f(h.interactionLog || p), g(l ? "Agent가 투자 노트를 업데이트했습니다. 완성본은 연결 자료 탭에서 확인하세요." : "Agent가 답변했습니다. 노트 본문은 그대로 유지했습니다.");
		} catch (e) {
			try {
				await O(r, a, d);
			} catch {}
			g(e instanceof Error ? `AI 정리 실패: ${e.message}` : "AI 정리 실패");
		} finally {
			S(!1);
		}
	}
	return /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "react-note-panel",
		"data-report-note-panel": !0,
		children: [
			/* @__PURE__ */ (0, m.jsxs)("div", {
				className: "report-note-head react-note-panel-head",
				children: [/* @__PURE__ */ (0, m.jsx)("p", {
					className: "section-kicker",
					children: "투자 생각 정리"
				}), /* @__PURE__ */ (0, m.jsx)("div", {
					className: "report-note-tabs",
					role: "tablist",
					"aria-label": "투자 노트 모드",
					children: [["chat", "작성"], ["links", "연결 자료"]].map(([e, t]) => /* @__PURE__ */ (0, m.jsx)("button", {
						className: "report-note-tab",
						type: "button",
						"aria-pressed": _ === e,
						onClick: () => v(e),
						children: t
					}, e))
				})]
			}),
			_ === "chat" && /* @__PURE__ */ (0, m.jsxs)("div", {
				className: "report-note-chat",
				children: [D.length === 0 ? /* @__PURE__ */ (0, m.jsx)("p", {
					className: "report-note-empty report-note-chat-empty",
					children: "먼저 떠오르는 생각 한 줄을 남겨보세요. Agent가 열린 보고서와 Market Memory를 참고해 투자 노트로 정리해줍니다."
				}) : /* @__PURE__ */ (0, m.jsx)("ol", {
					className: "report-note-chat-list",
					ref: T,
					onMouseUp: A,
					children: D.map((e, t) => {
						let n = e.role === "agent", { message: r, note: i } = n ? Fe(e.body) : {
							message: e.body,
							note: ""
						};
						return /* @__PURE__ */ (0, m.jsxs)("li", {
							className: `report-note-chat-item ${n ? "is-agent" : "is-user"}`,
							children: [
								/* @__PURE__ */ (0, m.jsxs)("span", {
									className: "report-note-history-meta",
									children: [
										n ? "Agent" : "사용자",
										" ",
										e.createdAt || ""
									]
								}),
								r && /* @__PURE__ */ (0, m.jsx)("p", {
									className: "report-note-chat-text",
									children: r
								}),
								i && /* @__PURE__ */ (0, m.jsxs)("div", {
									className: "report-note-chat-note",
									children: [/* @__PURE__ */ (0, m.jsx)("span", {
										className: "report-note-chat-note-label",
										children: "완성된 투자 노트"
									}), /* @__PURE__ */ (0, m.jsx)(Oe, { markdown: i })]
								})
							]
						}, `${e.role}-${e.createdAt || t}-${t}`);
					})
				}), /* @__PURE__ */ (0, m.jsxs)("div", {
					className: "report-note-composer",
					children: [
						s && /* @__PURE__ */ (0, m.jsxs)("div", {
							className: "report-note-quote-bar",
							children: [
								/* @__PURE__ */ (0, m.jsx)("span", {
									className: "report-note-quote-label",
									children: "인용"
								}),
								/* @__PURE__ */ (0, m.jsx)("p", { children: s }),
								/* @__PURE__ */ (0, m.jsx)("button", {
									type: "button",
									onClick: () => c(""),
									"aria-label": "인용 지우기",
									children: "×"
								})
							]
						}),
						/* @__PURE__ */ (0, m.jsx)("textarea", {
							className: "report-note-thought-editor",
							value: a,
							onChange: (e) => o(e.currentTarget.value),
							rows: 3,
							placeholder: Ae,
							"aria-label": `${e.title} 사용자의 생각`
						}),
						/* @__PURE__ */ (0, m.jsxs)("div", {
							className: "report-note-composer-actions",
							children: [/* @__PURE__ */ (0, m.jsx)("button", {
								className: "report-note-secondary-action",
								type: "button",
								onClick: j,
								disabled: x || !k(),
								children: "생각만 기록"
							}), /* @__PURE__ */ (0, m.jsx)("button", {
								className: "report-note-primary-action",
								type: "button",
								onClick: M,
								disabled: x || !k(),
								children: x ? "Agent가 정리 중" : "Agent와 투자 노트 정리하기"
							})]
						}),
						/* @__PURE__ */ (0, m.jsx)("p", {
							className: "report-note-composer-hint",
							children: "Agent 답변이나 완성본에서 문장을 드래그하면 인용해서 이어서 물어볼 수 있습니다."
						})
					]
				})]
			}),
			_ === "links" && /* @__PURE__ */ (0, m.jsxs)("div", {
				className: "report-note-links",
				children: [
					/* @__PURE__ */ (0, m.jsxs)("div", {
						className: "report-note-final",
						children: [/* @__PURE__ */ (0, m.jsxs)("div", {
							className: "report-note-section-label",
							children: [/* @__PURE__ */ (0, m.jsx)("strong", { children: "정리된 투자 노트" }), /* @__PURE__ */ (0, m.jsx)("span", { children: r.trim() ? `읽기 전용 완성본입니다. 수정은 작성 탭에서 Agent와 대화로 진행하세요.${E ? " (Agent 정리본)" : ""}` : "작성 탭에서 Agent와 정리하면 여기에 완성본이 표시됩니다." })]
						}), r.trim() ? /* @__PURE__ */ (0, m.jsx)("div", {
							className: "report-note-final-body",
							children: /* @__PURE__ */ (0, m.jsx)(Oe, { markdown: r })
						}) : /* @__PURE__ */ (0, m.jsx)("p", {
							className: "report-note-empty",
							children: "아직 완성된 투자 노트가 없습니다."
						})]
					}),
					/* @__PURE__ */ (0, m.jsxs)("p", {
						className: "report-note-link-head",
						children: [/* @__PURE__ */ (0, m.jsx)("strong", { children: t || e.linkedReports?.[0] || e.title }), "에 연결된 Folio 노트와 참고 정보입니다."]
					}),
					y.length > 0 ? /* @__PURE__ */ (0, m.jsx)("ul", {
						className: "report-note-link-list",
						children: y.slice(0, 8).map((e) => /* @__PURE__ */ (0, m.jsxs)("li", { children: [/* @__PURE__ */ (0, m.jsx)("span", {
							className: "report-note-link-title",
							children: e.title || "투자 노트"
						}), /* @__PURE__ */ (0, m.jsx)("span", {
							className: "report-note-link-meta",
							children: e.ticker || e.noteType || "note"
						})] }, e.id || e.title))
					}) : /* @__PURE__ */ (0, m.jsx)("p", {
						className: "report-note-empty",
						children: "아직 연결된 노트가 없습니다."
					}),
					n && /* @__PURE__ */ (0, m.jsxs)("div", {
						className: "report-note-layer react-personal-overlay",
						children: [/* @__PURE__ */ (0, m.jsx)("p", {
							className: "section-kicker",
							children: "참고 해석"
						}), /* @__PURE__ */ (0, m.jsx)(Oe, { markdown: n })]
					})
				]
			}),
			/* @__PURE__ */ (0, m.jsx)("div", {
				className: "report-note-foot",
				children: h && /* @__PURE__ */ (0, m.jsx)("p", {
					className: "report-note-status",
					children: h
				})
			})
		]
	});
}
//#endregion
//#region src/app/reportReader/ReportReaderShell.tsx
function Ve({ eyebrow: e, title: t, breadcrumb: n, actionSlot: r, noteSlot: i, noteIdentity: a, noteLinkedTitle: o, noteOverlayMarkdown: s, agentContext: c, onClose: l, children: u }) {
	let d = i ?? (a ? /* @__PURE__ */ (0, m.jsx)(Be, {
		identity: a,
		linkedTitle: o || t,
		overlayMarkdown: s || ""
	}) : null), f = c ? JSON.stringify(c) : "", h = [
		"report-reader-stage",
		!r && !d ? "no-side" : "",
		r ? "" : "no-rail",
		d ? "" : "no-note"
	].filter(Boolean).join(" ");
	return (0, p.useEffect)(() => {
		f && L(c || {});
	}, [c, f]), /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "report-reader-shell report-reader-inline",
		"data-report-reader-shell": !0,
		children: [/* @__PURE__ */ (0, m.jsx)("div", {
			className: "reader-breadcrumb report-reader-breadcrumb",
			children: n
		}), /* @__PURE__ */ (0, m.jsxs)("div", {
			className: h,
			children: [
				/* @__PURE__ */ (0, m.jsxs)("main", {
					className: "report-reader-dialog report-reader-main",
					"aria-label": "보고서 리더",
					children: [/* @__PURE__ */ (0, m.jsx)("div", {
						className: "report-reader-head",
						children: l && /* @__PURE__ */ (0, m.jsx)("button", {
							className: "icon-btn",
							type: "button",
							onClick: l,
							"aria-label": "리더 닫기",
							"data-tooltip": "닫기",
							"data-tooltip-pos": "left",
							children: "×"
						})
					}), /* @__PURE__ */ (0, m.jsxs)("div", {
						className: "report-reader-body",
						children: [/* @__PURE__ */ (0, m.jsxs)("section", {
							className: "report-hero react-report-hero",
							children: [e && /* @__PURE__ */ (0, m.jsx)("p", {
								className: "report-kicker",
								children: e
							}), /* @__PURE__ */ (0, m.jsx)("h1", { children: t })]
						}), /* @__PURE__ */ (0, m.jsx)("article", {
							className: "headline react-report-card",
							children: u
						})]
					})]
				}),
				r && /* @__PURE__ */ (0, m.jsx)("aside", {
					className: "report-reader-rail",
					"aria-label": "보고서 조작 패널",
					children: r
				}),
				d && /* @__PURE__ */ (0, m.jsx)("aside", {
					className: "report-note-panel is-open",
					"aria-label": "투자 노트",
					children: /* @__PURE__ */ (0, m.jsx)("div", {
						className: "report-note-inner",
						children: d
					})
				})
			]
		})]
	});
}
//#endregion
//#region src/app/RouteHero.tsx
function He({ eyebrow: e, title: t, description: n, actions: r }) {
	return /* @__PURE__ */ (0, m.jsxs)("header", {
		className: "react-route-hero",
		children: [/* @__PURE__ */ (0, m.jsxs)("div", {
			className: "react-route-hero-copy",
			children: [
				/* @__PURE__ */ (0, m.jsx)("p", {
					className: "react-route-hero-eyebrow",
					children: e
				}),
				/* @__PURE__ */ (0, m.jsx)("h1", { children: t }),
				/* @__PURE__ */ (0, m.jsx)("p", {
					className: "react-route-hero-description",
					children: n
				})
			]
		}), r && /* @__PURE__ */ (0, m.jsx)("div", {
			className: "react-route-hero-actions",
			children: r
		})]
	});
}
//#endregion
//#region src/app/BriefingRoute.tsx
var Ue = {
	us: "미국",
	kr: "한국",
	both: "통합"
}, We = {
	us: "US",
	kr: "KR",
	both: "US/KR"
}, Ge = /* @__PURE__ */ new Set([
	"미국장",
	"한국장",
	"종합"
]), Ke = {
	default: "기본",
	market_focused: "시황 중심",
	concise: "요약"
}, qe = 20;
function Je(e) {
	return String(e || "").replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1.$2.$3");
}
function Ye(e) {
	let t = String(e || "").match(/^(\d{4})-(\d{2})/);
	return t ? `${t[1]}.${t[2]}` : "월 미상";
}
function Xe() {
	let e = /* @__PURE__ */ new Date(), t = e.getTimezoneOffset() * 6e4;
	return new Date(e.getTime() - t).toISOString().slice(0, 10);
}
function Ze(e) {
	return String(e || "").replace(/\s+[—–-]\s+\d{4}[.-]\d{2}[.-]\d{2}\s*$/, "").trim();
}
function Qe(e) {
	let t = at(e), n = ot(e), r = n === "us" ? "US Market Briefing" : n === "kr" ? "KR Market Briefing" : Ze(e.title || "Daily Market Briefing"), i = Je(t);
	return {
		date: t,
		scope: n,
		title: i ? `${r} — ${i}` : r,
		chips: (e.tags || []).filter((e) => !Ge.has(String(e || "").trim())),
		foot: `${e.sessionDate ? `시장 기준일 ${e.sessionDate}` : "시장 기준일 미상"} · ${e.generatedAt ? new Date(e.generatedAt).toLocaleString("ko-KR") : "생성 시각 미상"}`
	};
}
function $e(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function et(e) {
	return e === "us" || e === "kr" || e === "both" ? e : "both";
}
function tt() {
	let e = window.location.hash.match(/^#\/?briefing\/(\d{4}-\d{2}-\d{2})(?:\/(us|kr|both))?$/);
	return e ? {
		date: e[1],
		scope: et(e[2])
	} : null;
}
function nt() {
	return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "briefing";
}
function rt(e, t = "both") {
	window.location.hash = e ? `#/briefing/${e}/${t}` : "#/briefing";
}
function it(e = "", t = "시장 브리핑") {
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
function at(e) {
	return e.reportDate || e.date || "";
}
function ot(e) {
	return et(e.marketScope || e.scope);
}
function st(e) {
	return String(e || "").trim().toLowerCase();
}
function ct(e, t) {
	let n = String(t || e || "note"), r = 2166136261;
	for (let e = 0; e < n.length; e += 1) r ^= n.charCodeAt(e), r = Math.imul(r, 16777619) >>> 0;
	return `${e}-${r.toString(36)}`;
}
function lt(e, t) {
	return {
		id: ct("brief", `${e}:${t}`),
		noteType: "market_memo",
		title: e ? `브리핑 ${e} 투자 노트` : "브리핑 투자 노트",
		label: e ? `브리핑 ${e}` : "브리핑",
		topic: t,
		reportKind: "briefing",
		reportId: e,
		linkedReports: [e ? `Daily Market Briefing — ${e}` : ""].filter(Boolean)
	};
}
function ut(e) {
	let t = e;
	return !!(t?.id && ["queued", "running"].includes(t.status));
}
async function dt(e) {
	let t = e;
	for (; ["queued", "running"].includes(t.status);) await $e(1e3), t = await F(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "브리핑 생성에 실패했습니다.");
	return t;
}
function ft() {
	let [e, t] = (0, p.useState)(null), [n, r] = (0, p.useState)(() => tt()), [i, a] = (0, p.useState)(null), [o, s] = (0, p.useState)(!1), [c, l] = (0, p.useState)(!1), [u, d] = (0, p.useState)(""), [f, h] = (0, p.useState)(""), [g, _] = (0, p.useState)(""), [v, y] = (0, p.useState)("us"), [b, x] = (0, p.useState)("default"), [S, C] = (0, p.useState)(() => Xe()), [w, T] = (0, p.useState)(""), [E, D] = (0, p.useState)("all"), [O, k] = (0, p.useState)("all"), [A, j] = (0, p.useState)(""), [M, ee] = (0, p.useState)(""), [N, P] = (0, p.useState)("recent"), z = (0, p.useCallback)(async () => {
		s(!0), d("");
		try {
			let e = await F(`/api/briefings/index?${new URLSearchParams({
				offset: "0",
				limit: "100",
				q: w,
				marketScope: E,
				briefingType: O,
				dateFrom: A,
				dateTo: M
			})}`);
			t(e), L({
				surface: "briefing",
				viewId: "briefing",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			d(e instanceof Error ? e.message : "브리핑 목록을 불러오지 못했습니다.");
		} finally {
			s(!1);
		}
	}, [
		M,
		E,
		w,
		A,
		O
	]);
	(0, p.useEffect)(() => {
		z();
	}, [z]), (0, p.useEffect)(() => {
		let e = () => {
			nt() && r(tt());
		};
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []), (0, p.useEffect)(() => {
		let e = !0;
		async function t(t, n) {
			s(!0), d("");
			try {
				let r = await F(`/api/briefings/${encodeURIComponent(t)}?includePersonal=true&marketScope=${encodeURIComponent(n)}`);
				if (!e) return;
				a(r), L({
					surface: "briefing_reader",
					viewId: "briefing",
					reportKind: "briefing",
					reportId: t,
					marketScope: n
				});
			} catch (t) {
				if (!e) return;
				a(null), d(t instanceof Error ? t.message : "브리핑을 불러오지 못했습니다.");
			} finally {
				e && s(!1);
			}
		}
		return n ? t(n.date, n.scope) : (a(null), L({
			surface: "briefing",
			viewId: "briefing",
			reportKind: "",
			reportId: ""
		})), () => {
			e = !1;
		};
	}, [n]);
	async function B(e) {
		let t = i?.date || n?.date || "", r = et(i?.marketScope || n?.scope);
		if (t) {
			_(e), h(e === "notion" ? "Notion에 내보내는 중..." : "Obsidian에 내보내는 중...");
			try {
				let n = e === "notion" ? await I(`/api/briefings/${encodeURIComponent(t)}/export-notion?marketScope=${encodeURIComponent(r)}`, { marketScope: r }) : await I(`/api/briefings/${encodeURIComponent(t)}/export-obsidian?marketScope=${encodeURIComponent(r)}`, { marketScope: r });
				h(e === "notion" ? n.notionUrl ? `Notion 내보냄: ${n.title || n.notionUrl}` : "Notion에 내보냈습니다." : `Obsidian 내보냄: ${n.filename || t}`);
			} catch (e) {
				h(e instanceof Error ? e.message : "내보내기에 실패했습니다.");
			} finally {
				_("");
			}
		}
	}
	async function V() {
		let e = i?.date || n?.date || "", t = et(i?.marketScope || n?.scope);
		if (e) {
			_("overlay"), h("개인 해석을 생성하는 중...");
			try {
				let n = await I(`/api/briefings/${encodeURIComponent(e)}/personal-overlay?marketScope=${encodeURIComponent(t)}`, { marketScope: t });
				ut(n) && await dt(n);
				let r = await F(`/api/briefings/${encodeURIComponent(e)}?includePersonal=true&marketScope=${encodeURIComponent(t)}`);
				a(r), h("개인 해석을 생성했습니다.");
			} catch (e) {
				h(e instanceof Error ? e.message : "개인 해석 생성에 실패했습니다.");
			} finally {
				_("");
			}
		}
	}
	async function H(e, t) {
		if (e && window.confirm(`${e} ${Ue[t]} 브리핑을 삭제할까요?`)) {
			_(`delete-${e}-${t}`);
			try {
				let n = t === "both" ? "" : `?market=${encodeURIComponent(t)}`;
				await fetch(`/api/briefings/${encodeURIComponent(e)}${n}`, { method: "DELETE" }), await z();
			} catch (e) {
				d(e instanceof Error ? e.message : "브리핑 삭제에 실패했습니다.");
			} finally {
				_("");
			}
		}
	}
	async function te(e) {
		l(!0), d("");
		try {
			let t = await I("/api/briefings", {
				date: e || void 0,
				strictDate: !!e,
				marketScope: v,
				briefingType: b
			});
			if (ut(t)) {
				let n = await dt(t), r = n.result?.date || n.result?.artifactId || e || "";
				await z(), r && rt(r, v);
				return;
			}
			let n = t.date || e || "";
			await z(), n && rt(n, et(t.marketScope || v));
		} catch (e) {
			d(e instanceof Error ? e.message : "브리핑 생성에 실패했습니다.");
		} finally {
			l(!1);
		}
	}
	let ne = e?.items || [], re = (0, p.useMemo)(() => {
		let e = st(w);
		return ne.filter((t) => {
			let n = at(t), r = ot(t), i = t.briefingType || "default";
			return E !== "all" && r !== E || O !== "all" && i !== O || A && n && n < A || M && n && n > M ? !1 : e ? st([
				t.title,
				n,
				t.sessionDate,
				t.generatedAt,
				i,
				...t.tags || []
			].filter(Boolean).join(" ")).includes(e) : !0;
		});
	}, [
		M,
		E,
		w,
		A,
		O,
		ne
	]), ie = (0, p.useMemo)(() => {
		let e = [...re].sort((e, t) => String(at(t) || t.generatedAt || "").localeCompare(String(at(e) || e.generatedAt || "")));
		if (N === "recent") return e.length ? [{
			label: `최근 브리핑 ${Math.min(e.length, qe)}건`,
			rows: e.slice(0, qe)
		}] : [];
		if (N === "month") {
			let t = /* @__PURE__ */ new Map();
			for (let n of e) {
				let e = Ye(at(n));
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
			label: `${Ue[t]} 시장`,
			rows: e.filter((e) => ot(e) === t)
		})).filter((e) => e.rows.length > 0);
	}, [N, re]), ae = (0, p.useMemo)(() => it(i?.markdown || "", i?.title || "시장 브리핑"), [i?.markdown, i?.title]);
	return n && i ? /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "react-briefing-route",
		"data-briefing-route": !0,
		children: [u && /* @__PURE__ */ (0, m.jsx)("p", {
			className: "react-dashboard-error",
			children: u
		}), /* @__PURE__ */ (0, m.jsx)(Ve, {
			eyebrow: `DAILY BRIEFING · ${i.date || n.date}`,
			title: ae.title,
			agentContext: {
				surface: "briefing_reader",
				viewId: "briefing",
				reportKind: "briefing",
				reportId: i.date || n.date,
				marketScope: et(i.marketScope || n.scope)
			},
			breadcrumb: /* @__PURE__ */ (0, m.jsxs)(m.Fragment, { children: [/* @__PURE__ */ (0, m.jsx)("button", {
				type: "button",
				onClick: () => rt(),
				children: "브리핑"
			}), /* @__PURE__ */ (0, m.jsx)("span", { children: ae.title })] }),
			onClose: () => rt(),
			actionSlot: /* @__PURE__ */ (0, m.jsxs)(m.Fragment, { children: [
				/* @__PURE__ */ (0, m.jsx)(be, {
					title: "AI",
					children: /* @__PURE__ */ (0, m.jsx)(xe, {
						icon: "agent",
						onClick: () => R({
							surface: "briefing_reader",
							reportKind: "briefing",
							reportId: i.date || n.date,
							marketScope: et(i.marketScope || n.scope),
							message: `${ae.title}의 핵심과 투자 판단 체크포인트를 요약해줘.`,
							autoSubmit: !0
						}),
						children: "Agent에게 묻기"
					})
				}),
				/* @__PURE__ */ (0, m.jsx)(be, {
					title: "노트",
					children: /* @__PURE__ */ (0, m.jsx)(xe, {
						icon: "link",
						disabled: g === "overlay",
						onClick: V,
						children: g === "overlay" ? "생성 중" : "내 노트와 연결"
					})
				}),
				/* @__PURE__ */ (0, m.jsxs)(be, {
					title: "내보내기",
					children: [/* @__PURE__ */ (0, m.jsx)(xe, {
						icon: "notion",
						disabled: g === "notion",
						onClick: () => B("notion"),
						children: g === "notion" ? "내보내는 중" : "Notion으로 내보내기"
					}), /* @__PURE__ */ (0, m.jsx)(xe, {
						icon: "obsidian",
						disabled: g === "obsidian",
						onClick: () => B("obsidian"),
						children: g === "obsidian" ? "내보내는 중" : "Obsidian으로 내보내기"
					})]
				}),
				f && /* @__PURE__ */ (0, m.jsx)("p", {
					className: "react-reader-status",
					children: f
				})
			] }),
			noteIdentity: lt(i.date || n.date, et(i.marketScope || n.scope)),
			noteLinkedTitle: ae.title,
			noteOverlayMarkdown: i.personalOverlay?.markdown || "",
			children: /* @__PURE__ */ (0, m.jsx)(Oe, {
				markdown: ae.body || i.markdown || "",
				marketScope: et(i.marketScope || n.scope),
				briefing: i,
				sourcePanelHtml: ye().briefingSourcePanelHtml?.(i) || ""
			})
		})]
	}) : /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "react-briefing-route",
		"data-briefing-route": !0,
		children: [
			/* @__PURE__ */ (0, m.jsx)(He, {
				eyebrow: "Briefing",
				title: "브리핑",
				description: "수집된 최신 뉴스와 시장 데이터를 바탕으로 미국장과 한국장 흐름을 요약합니다."
			}),
			/* @__PURE__ */ (0, m.jsx)("section", {
				className: "brief-gen-box input-panel react-briefing-generation",
				"aria-label": "브리핑 생성",
				children: /* @__PURE__ */ (0, m.jsxs)("section", {
					className: "brief-gen-panel brief-gen-settings",
					children: [
						/* @__PURE__ */ (0, m.jsx)("div", {
							className: "brief-gen-panel-head",
							children: /* @__PURE__ */ (0, m.jsx)("h3", { children: "브리핑 설정" })
						}),
						/* @__PURE__ */ (0, m.jsxs)("div", {
							className: "brief-gen-settings-row",
							children: [/* @__PURE__ */ (0, m.jsx)("div", {
								className: "brief-gen-field brief-gen-market-field",
								children: /* @__PURE__ */ (0, m.jsxs)("div", {
									className: "brief-market-segment",
									role: "radiogroup",
									"aria-label": "시장 범위",
									"data-scope": v,
									children: [/* @__PURE__ */ (0, m.jsx)("span", {
										className: "brief-market-segment-title",
										children: "시장"
									}), [
										["both", "종합"],
										["us", "미국장"],
										["kr", "한국장"]
									].map(([e, t]) => /* @__PURE__ */ (0, m.jsxs)("label", { children: [/* @__PURE__ */ (0, m.jsx)("input", {
										type: "radio",
										name: "reactBriefingMarketScope",
										value: e,
										checked: v === e,
										onChange: () => y(e)
									}), /* @__PURE__ */ (0, m.jsx)("span", { children: t })] }, e))]
								})
							}), /* @__PURE__ */ (0, m.jsxs)("label", {
								className: "gen-option quality-option",
								children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "유형" }), /* @__PURE__ */ (0, m.jsx)("select", {
									value: b,
									onChange: (e) => x(e.currentTarget.value),
									children: Object.entries(Ke).map(([e, t]) => /* @__PURE__ */ (0, m.jsx)("option", {
										value: e,
										children: t
									}, e))
								})]
							})]
						}),
						/* @__PURE__ */ (0, m.jsxs)("div", {
							className: "brief-gen-actionbar",
							children: [
								/* @__PURE__ */ (0, m.jsx)("button", {
									className: "filter-btn clear icon-btn",
									type: "button",
									onClick: z,
									disabled: o,
									"aria-label": "새로고침",
									"data-tooltip": "새로고침",
									children: "↻"
								}),
								/* @__PURE__ */ (0, m.jsx)("button", {
									className: "filter-btn apply",
									type: "button",
									onClick: () => te(),
									disabled: c,
									children: c ? "생성 중" : "오늘 브리핑 생성"
								}),
								/* @__PURE__ */ (0, m.jsx)("span", {
									className: "brief-gen-actionbar-divider",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, m.jsx)("input", {
									type: "date",
									value: S,
									onChange: (e) => C(e.currentTarget.value),
									"aria-label": "생성할 브리핑 날짜"
								}),
								/* @__PURE__ */ (0, m.jsx)("button", {
									className: "filter-btn clear",
									type: "button",
									onClick: () => te(S),
									disabled: c || !S,
									children: "이 날짜로 생성"
								})
							]
						})
					]
				})
			}),
			u && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "react-dashboard-error",
				children: u
			}),
			/* @__PURE__ */ (0, m.jsxs)("section", {
				className: "input-panel react-briefing-archive-panel report-feed-controls",
				"aria-label": "저장 브리핑 검색",
				children: [/* @__PURE__ */ (0, m.jsxs)("div", {
					className: "briefing-archive-filters",
					children: [
						/* @__PURE__ */ (0, m.jsxs)("label", { children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "검색" }), /* @__PURE__ */ (0, m.jsx)("input", {
							type: "search",
							value: w,
							onChange: (e) => T(e.currentTarget.value),
							placeholder: "제목·요약·본문 검색"
						})] }),
						/* @__PURE__ */ (0, m.jsxs)("label", { children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "시작일" }), /* @__PURE__ */ (0, m.jsx)("input", {
							type: "date",
							value: A,
							onChange: (e) => j(e.currentTarget.value)
						})] }),
						/* @__PURE__ */ (0, m.jsxs)("label", { children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "종료일" }), /* @__PURE__ */ (0, m.jsx)("input", {
							type: "date",
							value: M,
							onChange: (e) => ee(e.currentTarget.value)
						})] }),
						/* @__PURE__ */ (0, m.jsx)("button", {
							className: "filter-btn clear",
							type: "button",
							onClick: () => {
								T(""), D("all"), k("all"), j(""), ee(""), P("recent");
							},
							children: "초기화"
						})
					]
				}), /* @__PURE__ */ (0, m.jsxs)("div", {
					className: "briefing-archive-summary",
					children: [/* @__PURE__ */ (0, m.jsxs)("span", { children: [re.length, "건"] }), /* @__PURE__ */ (0, m.jsx)("span", {
						"aria-live": "polite",
						children: o ? "불러오는 중..." : w ? "검색 결과" : ""
					})]
				})]
			}),
			/* @__PURE__ */ (0, m.jsx)("div", {
				className: "report-feed-outside-controls",
				"aria-label": "브리핑 표시 옵션",
				children: /* @__PURE__ */ (0, m.jsxs)("div", {
					className: "report-feed-view-row",
					children: [
						/* @__PURE__ */ (0, m.jsx)("span", { children: "시장" }),
						/* @__PURE__ */ (0, m.jsx)("label", {
							className: "report-feed-view-pill",
							children: /* @__PURE__ */ (0, m.jsxs)("select", {
								value: E,
								onChange: (e) => D(e.currentTarget.value),
								children: [
									/* @__PURE__ */ (0, m.jsx)("option", {
										value: "all",
										children: "전체"
									}),
									/* @__PURE__ */ (0, m.jsx)("option", {
										value: "us",
										children: "미국장"
									}),
									/* @__PURE__ */ (0, m.jsx)("option", {
										value: "kr",
										children: "한국장"
									}),
									/* @__PURE__ */ (0, m.jsx)("option", {
										value: "both",
										children: "종합 보고서"
									})
								]
							})
						}),
						/* @__PURE__ */ (0, m.jsx)("span", { children: "유형" }),
						/* @__PURE__ */ (0, m.jsx)("label", {
							className: "report-feed-view-pill",
							children: /* @__PURE__ */ (0, m.jsxs)("select", {
								value: O,
								onChange: (e) => k(e.currentTarget.value),
								children: [/* @__PURE__ */ (0, m.jsx)("option", {
									value: "all",
									children: "전체"
								}), Object.entries(Ke).map(([e, t]) => /* @__PURE__ */ (0, m.jsx)("option", {
									value: e,
									children: t
								}, e))]
							})
						}),
						/* @__PURE__ */ (0, m.jsx)("span", { children: "보기" }),
						/* @__PURE__ */ (0, m.jsx)("label", {
							className: "report-feed-view-pill",
							children: /* @__PURE__ */ (0, m.jsxs)("select", {
								value: N,
								onChange: (e) => P(e.currentTarget.value),
								children: [
									/* @__PURE__ */ (0, m.jsx)("option", {
										value: "recent",
										children: "최근"
									}),
									/* @__PURE__ */ (0, m.jsx)("option", {
										value: "month",
										children: "월별"
									}),
									/* @__PURE__ */ (0, m.jsx)("option", {
										value: "market",
										children: "시장별"
									})
								]
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, m.jsx)("section", {
				className: "briefing-archive-feed",
				"aria-label": "저장 브리핑",
				children: ie.length ? ie.map((e) => /* @__PURE__ */ (0, m.jsxs)("div", {
					className: "briefing-archive-date-group",
					children: [/* @__PURE__ */ (0, m.jsx)("h3", { children: e.label }), e.rows.map((e) => {
						let t = Qe(e), n = g === `delete-${t.date}-${t.scope}`;
						return /* @__PURE__ */ (0, m.jsxs)("div", {
							className: "briefing-archive-card-wrap",
							children: [/* @__PURE__ */ (0, m.jsxs)("button", {
								type: "button",
								className: `briefing-archive-card is-${t.scope}`,
								onClick: () => t.date && rt(t.date, t.scope),
								children: [
									/* @__PURE__ */ (0, m.jsxs)("span", {
										className: "briefing-archive-card-meta",
										children: [/* @__PURE__ */ (0, m.jsx)("span", {
											className: "briefing-archive-market",
											children: We[t.scope]
										}), t.chips.map((e) => /* @__PURE__ */ (0, m.jsx)("span", {
											className: "briefing-archive-chip",
											children: e
										}, e))]
									}),
									/* @__PURE__ */ (0, m.jsx)("strong", { children: t.title }),
									/* @__PURE__ */ (0, m.jsx)("span", {
										className: "briefing-archive-card-foot",
										children: t.foot
									})
								]
							}), /* @__PURE__ */ (0, m.jsx)("button", {
								type: "button",
								className: "briefing-archive-card-delete",
								disabled: n,
								onClick: () => H(t.date, t.scope),
								"aria-label": `${t.date} 브리핑 삭제`,
								"data-tooltip": "삭제",
								children: /* @__PURE__ */ (0, m.jsx)("svg", {
									width: "14",
									height: "14",
									viewBox: "0 0 16 16",
									fill: "none",
									stroke: "currentColor",
									strokeWidth: "1.4",
									strokeLinecap: "round",
									strokeLinejoin: "round",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, m.jsx)("path", { d: "M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" })
								})
							})]
						}, e.id || `${t.date}-${t.scope}`);
					})]
				}, e.label)) : /* @__PURE__ */ (0, m.jsx)("div", {
					className: "briefing-archive-empty",
					children: "조건에 맞는 저장 브리핑이 없습니다."
				})
			})
		]
	});
}
//#endregion
//#region src/app/routes.ts
var U = [
	{
		id: "office",
		label: "Pixel Office",
		group: "home"
	},
	{
		id: "home",
		label: "Agent Home",
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
], pt = U.filter((e) => e.visibleInNav !== !1), mt = "office";
function ht(e) {
	let t = e.replace(/^#\/?/, "").split("/")[0];
	return U.some((e) => e.id === t) ? t : mt;
}
function gt(e) {
	return `#/${e}`;
}
function _t(e) {
	return U.find((t) => t.id === e) ?? U[0];
}
//#endregion
//#region src/app/CommandPalette.tsx
function vt(e) {
	return e === "home" ? "Agent Home" : e === "dashboard" ? "위젯과 하단 대시보드" : e === "briefing" ? "저장 브리핑과 생성" : e === "rss" ? "RSS 수집 자료" : e === "market-memory" ? "중기 시장 내러티브" : e === "analysis" ? "기업 분석 보고서" : e === "deep-research" ? "딥 리서치 보고서" : e === "watchlist" ? "워치리스트" : "설정";
}
function yt(e) {
	return e === "us" || e === "kr" || e === "both" ? e : "both";
}
function bt(e) {
	return e.reportDate || e.date || "";
}
function xt() {
	let [e, t] = (0, p.useState)(!1), [n, r] = (0, p.useState)(""), [i, a] = (0, p.useState)(0), [o, s] = (0, p.useState)(null), c = (0, p.useRef)(null);
	(0, p.useEffect)(() => {
		if (!e || o) return;
		let t = !0;
		return F("/api/dashboard").then((e) => {
			t && s(e);
		}).catch(() => {
			t && s({ briefings: [] });
		}), () => {
			t = !1;
		};
	}, [o, e]), (0, p.useEffect)(() => {
		if (document.body.classList.toggle("command-palette-open", e), !e) return;
		let t = window.requestAnimationFrame(() => c.current?.focus());
		return () => {
			window.cancelAnimationFrame(t), document.body.classList.remove("command-palette-open");
		};
	}, [e]);
	let l = (0, p.useMemo)(() => {
		let e = pt.map((e) => ({
			id: `route:${e.id}`,
			title: e.label,
			subtitle: vt(e.id),
			type: "화면",
			run: () => {
				window.location.hash = gt(e.id);
			}
		})), t = (o?.briefings || []).slice(0, 12).map((e) => {
			let t = bt(e), n = yt(e.marketScope || e.scope);
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
				run: () => R({ surface: "command_palette" })
			},
			...e,
			...t
		];
	}, [o?.briefings]), u = (0, p.useMemo)(() => {
		let e = n.trim().toLowerCase();
		return (e ? l.filter((t) => `${t.title} ${t.subtitle} ${t.type}`.toLowerCase().includes(e)) : l).slice(0, 40);
	}, [l, n]);
	(0, p.useEffect)(() => {
		a((e) => Math.min(e, Math.max(0, u.length - 1)));
	}, [u.length]);
	function d() {
		t(!1), r(""), a(0);
	}
	function f(e = i) {
		let t = u[e];
		t && (t.run(), d());
	}
	return (0, p.useEffect)(() => {
		let n = (n) => {
			let r = n.key || "";
			if ((n.ctrlKey || n.metaKey) && r.toLowerCase() === "k") {
				n.preventDefault(), t((e) => !e);
				return;
			}
			if (e) {
				if (r === "Escape") {
					n.preventDefault(), d();
					return;
				}
				if (r === "ArrowDown") {
					n.preventDefault(), a((e) => Math.min(Math.max(0, u.length - 1), e + 1));
					return;
				}
				if (r === "ArrowUp") {
					n.preventDefault(), a((e) => Math.max(0, e - 1));
					return;
				}
				r === "Enter" && (n.preventDefault(), f());
			}
		};
		return document.addEventListener("keydown", n), () => document.removeEventListener("keydown", n);
	}, [
		i,
		u,
		e
	]), e ? /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "command-palette react-command-palette",
		"data-react-command-palette": !0,
		children: [/* @__PURE__ */ (0, m.jsx)("button", {
			className: "command-backdrop",
			type: "button",
			"aria-label": "명령 팔레트 닫기",
			onClick: d
		}), /* @__PURE__ */ (0, m.jsxs)("section", {
			className: "command-dialog",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "reactCommandPaletteTitle",
			children: [
				/* @__PURE__ */ (0, m.jsxs)("div", {
					className: "command-input-row",
					children: [/* @__PURE__ */ (0, m.jsx)("span", {
						className: "command-mark",
						"aria-hidden": "true",
						children: "⌘K"
					}), /* @__PURE__ */ (0, m.jsx)("input", {
						ref: c,
						value: n,
						onChange: (e) => {
							r(e.currentTarget.value), a(0);
						},
						placeholder: "화면, 보고서, 액션 검색",
						"aria-label": "명령 검색"
					})]
				}),
				/* @__PURE__ */ (0, m.jsx)("h2", {
					id: "reactCommandPaletteTitle",
					children: "명령 팔레트"
				}),
				/* @__PURE__ */ (0, m.jsx)("div", {
					className: "command-list",
					role: "listbox",
					"aria-label": "명령 목록",
					children: u.length ? u.map((e, t) => /* @__PURE__ */ (0, m.jsxs)("button", {
						className: `command-item${t === i ? " active" : ""}`,
						type: "button",
						role: "option",
						"aria-selected": t === i,
						onMouseEnter: () => a(t),
						onClick: () => f(t),
						children: [/* @__PURE__ */ (0, m.jsxs)("span", { children: [/* @__PURE__ */ (0, m.jsx)("span", {
							className: "command-item-title",
							children: e.title
						}), /* @__PURE__ */ (0, m.jsx)("span", {
							className: "command-item-subtitle",
							children: e.subtitle
						})] }), /* @__PURE__ */ (0, m.jsx)("span", {
							className: "command-item-type",
							children: e.type
						})]
					}, e.id)) : /* @__PURE__ */ (0, m.jsx)("div", {
						className: "command-empty",
						children: "검색 결과가 없습니다."
					})
				}),
				/* @__PURE__ */ (0, m.jsx)("div", {
					className: "command-footer",
					children: "Ctrl/⌘ K로 열고, Enter로 실행합니다."
				})
			]
		})]
	}) : null;
}
//#endregion
//#region src/app/reportReader/AnalysisCharts.tsx
var St = [
	"#0f172a",
	"#2f6f9f",
	"#3d8f64",
	"#c99a33",
	"#9a5b72"
], Ct = {
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
function wt(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function Tt(e) {
	return Array.isArray(e) ? e.map(wt) : [];
}
function Et(e) {
	let t = String(e || "USD").toUpperCase();
	return t === "KRW" || t === "KRX" ? "₩" : t === "JPY" ? "¥" : t === "EUR" ? "€" : t === "GBP" ? "£" : "$";
}
function Dt(e, t = "plain", n) {
	if (e === null) return "-";
	if (t === "percent") return `${(e * 100).toFixed(1)}%`;
	if (t === "money") {
		let t = Et(n), r = Math.abs(e);
		return r >= 0xe8d4a51000 ? `${t}${(e / 0xe8d4a51000).toFixed(1)}T` : r >= 1e9 ? `${t}${(e / 1e9).toFixed(1)}B` : r >= 1e6 ? `${t}${(e / 1e6).toFixed(1)}M` : `${t}${e.toLocaleString(void 0, { maximumFractionDigits: 2 })}`;
	}
	return e.toFixed(Math.abs(e) >= 100 ? 0 : 1);
}
function Ot(e) {
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
		label: Ct[t] || t,
		values: Tt(e[t]),
		kind: n
	})).filter((e) => e.values.some((e) => e !== null));
}
function kt(e) {
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
function At(e, t, n, r = 16, i = 150) {
	return r + (1 - (e - t) / (n - t)) * i;
}
function jt({ chart: e, series: t, onPoint: n, onLeave: r }) {
	let i = Array.isArray(e.years) ? e.years : [], { min: a, max: o } = kt(t.flatMap((e) => e.values)), s = 464 / Math.max(1, i.length), c = Math.max(5, Math.min(18, (s - 10) / Math.max(1, t.length))), l = At(0, a, o, 18, 148);
	return /* @__PURE__ */ (0, m.jsxs)("svg", {
		className: "analysis-chart-svg",
		viewBox: "0 0 520 220",
		role: "img",
		"aria-label": e.title || "기업 분석 차트",
		children: [
			/* @__PURE__ */ (0, m.jsx)("line", {
				x1: 36,
				y1: l,
				x2: 508,
				y2: l,
				stroke: "#d8dee8",
				strokeWidth: "1"
			}),
			i.map((i, u) => /* @__PURE__ */ (0, m.jsxs)("g", { children: [t.map((t, d) => {
				let f = t.values[u];
				if (f === null) return null;
				let p = At(f, a, o, 18, 148), h = Math.max(2, Math.abs(l - p)), g = 36 + u * s + 8 + d * c, _ = {
					label: i,
					series: t.label,
					value: Dt(f, t.kind, e.currency),
					x: g + c / 2,
					y: Math.min(p, l)
				};
				return /* @__PURE__ */ (0, m.jsx)("rect", {
					"aria-label": `${i} ${t.label} ${_.value}`,
					onBlur: r,
					onFocus: () => n(_),
					onMouseEnter: () => n(_),
					onMouseLeave: r,
					tabIndex: 0,
					x: g,
					y: Math.min(p, l),
					width: c - 2,
					height: h,
					rx: "2",
					fill: St[d % St.length]
				}, `${t.key}-${i}`);
			}), /* @__PURE__ */ (0, m.jsx)("text", {
				x: 36 + u * s + s / 2,
				y: 202,
				textAnchor: "middle",
				children: i
			})] }, i)),
			/* @__PURE__ */ (0, m.jsx)("text", {
				x: 36,
				y: 14,
				children: Dt(o, t[0]?.kind, e.currency)
			}),
			/* @__PURE__ */ (0, m.jsx)("text", {
				x: 36,
				y: 180,
				children: Dt(a, t[0]?.kind, e.currency)
			})
		]
	});
}
function Mt({ chart: e, series: t, onPoint: n, onLeave: r }) {
	let i = Array.isArray(e.years) ? e.years : [], { min: a, max: o } = kt(t.flatMap((e) => e.values)), s = 452 / Math.max(1, i.length - 1);
	return /* @__PURE__ */ (0, m.jsxs)("svg", {
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
				return /* @__PURE__ */ (0, m.jsx)("line", {
					x1: 36,
					y1: t,
					x2: 508,
					y2: t,
					stroke: "#eef2f7",
					strokeWidth: "1"
				}, e);
			}),
			t.map((t, c) => /* @__PURE__ */ (0, m.jsxs)("g", { children: [/* @__PURE__ */ (0, m.jsx)("polyline", {
				points: t.values.map((e, t) => e === null ? null : `${36 + t * s},${At(e, a, o, 18, 148)}`).filter(Boolean).join(" "),
				fill: "none",
				stroke: St[c % St.length],
				strokeWidth: "3",
				strokeLinejoin: "round",
				strokeLinecap: "round"
			}), t.values.map((l, u) => {
				if (l === null) return null;
				let d = 36 + u * s, f = At(l, a, o, 18, 148), p = i[u] || `${u + 1}`, h = {
					label: p,
					series: t.label,
					value: Dt(l, t.kind, e.currency),
					x: d,
					y: f
				};
				return /* @__PURE__ */ (0, m.jsx)("circle", {
					"aria-label": `${p} ${t.label} ${h.value}`,
					cx: d,
					cy: f,
					fill: St[c % St.length],
					onBlur: r,
					onFocus: () => n(h),
					onMouseEnter: () => n(h),
					onMouseLeave: r,
					r: "5",
					tabIndex: 0
				}, `${t.key}-${p}`);
			})] }, t.key)),
			i.map((e, t) => /* @__PURE__ */ (0, m.jsx)("text", {
				x: 36 + t * s,
				y: 202,
				textAnchor: "middle",
				children: e
			}, e)),
			/* @__PURE__ */ (0, m.jsx)("text", {
				x: 36,
				y: 14,
				children: Dt(o, t[0]?.kind || "percent", e.currency)
			}),
			/* @__PURE__ */ (0, m.jsx)("text", {
				x: 36,
				y: 180,
				children: Dt(a, t[0]?.kind || "percent", e.currency)
			})
		]
	});
}
function Nt({ chart: e, onPoint: t, onLeave: n }) {
	let r = Array.isArray(e.scenarios) ? e.scenarios : [], { max: i } = kt(r.map((e) => wt(e.perShare ?? e.price))), a = wt(e.currentPrice);
	return /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "analysis-scenario-bars",
		children: [r.map((r, a) => {
			let o = wt(r.perShare ?? r.price), s = o === null || i <= 0 ? 0 : Math.max(4, Math.min(100, o / i * 100)), c = String(r.name || r.label || `Scenario ${a + 1}`), l = Dt(o, "money", e.currency);
			return /* @__PURE__ */ (0, m.jsxs)("div", {
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
					/* @__PURE__ */ (0, m.jsx)("span", { children: c }),
					/* @__PURE__ */ (0, m.jsx)("div", { children: /* @__PURE__ */ (0, m.jsx)("i", { style: {
						width: `${s}%`,
						background: St[a % St.length]
					} }) }),
					/* @__PURE__ */ (0, m.jsx)("strong", { children: l })
				]
			}, c);
		}), a !== null && /* @__PURE__ */ (0, m.jsxs)("p", {
			className: "analysis-chart-note",
			children: ["현재가: ", Dt(a, "money", e.currency)]
		})]
	});
}
function Pt({ chart: e, onPoint: t, onLeave: n }) {
	let r = Array.isArray(e.labels) ? e.labels : [], i = Object.entries(e.series || {}).map(([e, t]) => ({
		key: e,
		label: e,
		values: Array.isArray(t) ? t.map((e) => typeof e == "number" ? e / 100 : null) : [],
		kind: "percent"
	}));
	return /* @__PURE__ */ (0, m.jsx)(Mt, {
		chart: {
			...e,
			years: r
		},
		series: i,
		onPoint: t,
		onLeave: n
	});
}
function Ft(e) {
	return /* @__PURE__ */ (0, m.jsx)("div", {
		className: "analysis-chart-legend",
		children: e.map((e, t) => /* @__PURE__ */ (0, m.jsxs)("span", { children: [/* @__PURE__ */ (0, m.jsx)("i", { style: { background: St[t % St.length] } }), e.label] }, e.key))
	});
}
function It({ chart: e }) {
	let [t, n] = (0, p.useState)(null), r = Ot(e), i = String(e.kind || e.id || ""), a = t?.x === void 0 ? void 0 : {
		left: `${Math.max(7, Math.min(93, t.x / 520 * 100))}%`,
		top: `${Math.max(10, t.y || 10)}px`
	};
	return /* @__PURE__ */ (0, m.jsxs)("article", {
		className: "analysis-chart-card",
		children: [
			/* @__PURE__ */ (0, m.jsxs)("div", {
				className: "analysis-chart-title",
				children: [/* @__PURE__ */ (0, m.jsx)("h4", { children: e.title || "Analysis Chart" }), e.subtitle && /* @__PURE__ */ (0, m.jsx)("p", { children: e.subtitle })]
			}),
			/* @__PURE__ */ (0, m.jsxs)("div", {
				className: "analysis-chart-plot",
				children: [
					i === "margins" && r.length ? /* @__PURE__ */ (0, m.jsx)(Mt, {
						chart: e,
						series: r,
						onPoint: n,
						onLeave: () => n(null)
					}) : null,
					(i === "performance" || i === "cashflow") && r.length ? /* @__PURE__ */ (0, m.jsx)(jt, {
						chart: e,
						series: r,
						onPoint: n,
						onLeave: () => n(null)
					}) : null,
					i === "dcf" || i === "scenario_price" ? /* @__PURE__ */ (0, m.jsx)(Nt, {
						chart: e,
						onPoint: n,
						onLeave: () => n(null)
					}) : null,
					i === "price_return" ? /* @__PURE__ */ (0, m.jsx)(Pt, {
						chart: e,
						onPoint: n,
						onLeave: () => n(null)
					}) : null,
					!r.length && ![
						"dcf",
						"scenario_price",
						"price_return"
					].includes(i) && /* @__PURE__ */ (0, m.jsx)("p", {
						className: "analysis-chart-warning",
						children: "이 차트에 표시할 수치가 충분하지 않습니다."
					}),
					t && /* @__PURE__ */ (0, m.jsxs)("div", {
						className: "analysis-chart-tooltip",
						style: a,
						children: [
							t.series && /* @__PURE__ */ (0, m.jsx)("span", { children: t.series }),
							/* @__PURE__ */ (0, m.jsx)("strong", { children: t.value }),
							/* @__PURE__ */ (0, m.jsx)("em", { children: t.label })
						]
					})
				]
			}),
			r.length > 0 && Ft(r)
		]
	});
}
function Lt({ payload: e, chartIds: t, heading: n = "기업 분석 시각화", intro: r = "저장된 공식 재무 데이터와 시장 데이터를 기반으로 생성된 참고 차트입니다.", compact: i = !1 }) {
	let a = t ? new Set(t) : null, o = (Array.isArray(e?.charts) ? e.charts : []).filter((e) => !a || a.has(String(e.id || e.kind || "")));
	return !e?.available || !o.length ? null : /* @__PURE__ */ (0, m.jsxs)("section", {
		className: `analysis-charts-panel analysis-charts-inline${i ? " compact" : ""}`,
		"aria-label": n,
		children: [/* @__PURE__ */ (0, m.jsx)("div", {
			className: "analysis-chart-head",
			children: /* @__PURE__ */ (0, m.jsxs)("div", { children: [
				/* @__PURE__ */ (0, m.jsx)("p", {
					className: "section-kicker",
					children: "Company Visuals"
				}),
				/* @__PURE__ */ (0, m.jsx)("h3", { children: n }),
				/* @__PURE__ */ (0, m.jsx)("p", { children: r })
			] })
		}), /* @__PURE__ */ (0, m.jsx)("div", {
			className: "analysis-chart-grid",
			children: o.map((e, t) => /* @__PURE__ */ (0, m.jsx)(It, { chart: e }, e.id || `${e.title || "chart"}-${t}`))
		})]
	});
}
//#endregion
//#region src/app/reportReader/CompanyAnalysisBody.tsx
var W = [
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
function Rt(e = "") {
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
function zt(e) {
	return new Set((Array.isArray(e?.charts) ? e.charts : []).map((e) => String(e?.id || e?.kind || "")).filter(Boolean));
}
function Bt(e, t, n, r = /* @__PURE__ */ new Set()) {
	let i = zt(n), a = e.title, o = [];
	for (let e of W) if (e.patterns.some((e) => e.test(a)) || e.fallbackIndex === t) for (let t of e.ids) i.has(t) && !r.has(t) && o.push(t);
	return o;
}
function Vt(e, t = /* @__PURE__ */ new Set()) {
	return Array.from(zt(e)).filter((e) => !t.has(e));
}
function Ht({ markdown: e, charts: t }) {
	let n = Rt(e), r = /* @__PURE__ */ new Set();
	return n.length ? /* @__PURE__ */ (0, m.jsxs)(m.Fragment, { children: [n.map((e, n) => {
		let i = Bt(e, n, t, r);
		return i.forEach((e) => r.add(e)), /* @__PURE__ */ (0, m.jsxs)("div", {
			className: "company-analysis-section",
			children: [/* @__PURE__ */ (0, m.jsx)(Oe, { markdown: e.markdown }), i.length > 0 && /* @__PURE__ */ (0, m.jsx)(Lt, {
				payload: t,
				chartIds: i,
				heading: "관련 시각화",
				intro: "이 섹션의 판단을 확인할 때 함께 볼 수 있는 수치입니다.",
				compact: !0
			})]
		}, e.key);
	}), Vt(t, r).length > 0 && /* @__PURE__ */ (0, m.jsx)(Lt, {
		payload: t,
		chartIds: Vt(t, r),
		heading: "추가 시각화",
		intro: "본문 섹션에 직접 매칭되지 않은 보조 차트입니다.",
		compact: !0
	})] }) : /* @__PURE__ */ (0, m.jsx)(Lt, { payload: t });
}
//#endregion
//#region src/app/CompanyAnalysisRoute.tsx
var Ut = [{
	value: "beginner",
	label: "기본",
	description: "쉽게 설명"
}, {
	value: "advanced",
	label: "심화",
	description: "정밀 분석"
}], Wt = 20;
function Gt(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function Kt(e) {
	let t = e;
	return !!(t?.id && ["queued", "running"].includes(t.status));
}
async function qt(e) {
	let t = e;
	for (; ["queued", "running"].includes(t.status);) await Gt(1e3), t = await F(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "기업 분석 생성에 실패했습니다.");
	return t;
}
function Jt(e = "", t = "기업 분석") {
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
function Yt(e) {
	return String(e.company?.ticker || e.query || e.company?.name || "").trim().toUpperCase();
}
function Xt(e) {
	return String(e.company?.name || e.query || Yt(e) || "").trim();
}
function Zt(e) {
	let t = Yt(e), n = Xt(e);
	return t && n && t !== n ? `${t} · ${n}` : n || t || "기업 분석";
}
function Qt(e) {
	return Jt(String(e.markdown || ""), "").title.trim() || String(e.headline || "").trim() || Zt(e);
}
function $t(e) {
	if (!e) return "미상";
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? e : t.toLocaleDateString("ko-KR");
}
function en(e) {
	return Ut.find((t) => t.value === e)?.label || "";
}
function tn(e) {
	return e === "high" ? "높음" : e === "medium" ? "중간" : e === "low" ? "낮음" : e || "확인 필요";
}
function nn(e) {
	let t = e?.dataGaps;
	return t ? Array.isArray(t) ? t : Array.isArray(t.gaps) ? t.gaps : [] : [];
}
function rn(e) {
	let t = /* @__PURE__ */ new Set();
	return e.filter((e) => {
		let n = [
			sn(e.field),
			sn(e.label),
			sn(e.category),
			sn(e.message || e.suggestedAction)
		].join("|");
		return t.has(n) ? !1 : (t.add(n), !0);
	});
}
function an(e) {
	let t = {
		high: 0,
		medium: 1,
		low: 2
	};
	return rn(nn(e).filter((e) => e.status !== "resolved").sort((e, n) => (t[e.severity || ""] ?? 9) - (t[n.severity || ""] ?? 9)));
}
function on(e) {
	if (!e) return "월 미상";
	let t = new Date(e);
	if (!Number.isNaN(t.getTime())) return `${t.getFullYear()}.${String(t.getMonth() + 1).padStart(2, "0")}`;
	let n = String(e).match(/^(\d{4})[-.](\d{1,2})/);
	return n ? `${n[1]}.${String(n[2]).padStart(2, "0")}` : "월 미상";
}
function sn(e) {
	return String(e || "").trim().toLowerCase();
}
function cn(e) {
	return [
		e.source,
		e.date,
		e.type
	].filter(Boolean).join(" · ");
}
function ln(e) {
	return e.title || e.url || e.path || "자료";
}
function un(e) {
	let t = String(e.markdown || "");
	return e.generation?.webSearch ? t.trim() : t.split(/\n(?=#{1,3}\s*(?:8\.\s*)?(?:Sources Used|사용 자료)\b)/i)[0].trim();
}
function dn(e) {
	window.location.hash = e ? `#/analysis/${encodeURIComponent(e)}` : "#/analysis";
}
function fn() {
	let e = window.location.hash.match(/^#\/?analysis\/(.+)$/);
	return e ? decodeURIComponent(e[1]) : "";
}
function pn() {
	return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "analysis";
}
function mn() {
	let [e, t] = (0, p.useState)([]), [n, r] = (0, p.useState)(null), [i, a] = (0, p.useState)(() => fn()), [o, s] = (0, p.useState)(""), [c, l] = (0, p.useState)("beginner"), [u, d] = (0, p.useState)(""), [f, h] = (0, p.useState)("recent"), [g, _] = (0, p.useState)(!1), [v, y] = (0, p.useState)(!1), [b, x] = (0, p.useState)(""), [S, C] = (0, p.useState)(""), [w, T] = (0, p.useState)(""), E = (0, p.useCallback)(async () => {
		_(!0), C("");
		try {
			let e = await F("/api/analysis-reports");
			t(Array.isArray(e) ? e : []), L({
				surface: "analysis",
				viewId: "analysis",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			C(e instanceof Error ? e.message : "기업 분석 목록을 불러오지 못했습니다.");
		} finally {
			_(!1);
		}
	}, []);
	(0, p.useEffect)(() => {
		E();
	}, [E]), (0, p.useEffect)(() => {
		let e = () => {
			pn() && a(fn());
		};
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []), (0, p.useEffect)(() => {
		let e = !0;
		async function t(t) {
			_(!0), C("");
			try {
				let n = await F(`/api/analysis-reports/${encodeURIComponent(t)}?includePersonal=true`);
				if (!e) return;
				r(n), L({
					surface: "analysis_reader",
					viewId: "analysis",
					reportKind: "company_analysis",
					reportId: n.id || t,
					ticker: Yt(n)
				});
			} catch (t) {
				if (!e) return;
				r(null), C(t instanceof Error ? t.message : "저장된 기업 분석 보고서를 열지 못했습니다.");
			} finally {
				e && _(!1);
			}
		}
		return i ? t(i) : (r(null), L({
			surface: "analysis",
			viewId: "analysis",
			reportKind: "",
			reportId: ""
		})), () => {
			e = !1;
		};
	}, [i]);
	async function D(e) {
		e.preventDefault();
		let t = o.trim();
		if (t) {
			y(!0), C(""), T("기업 자료를 읽고 분석 보고서를 생성하는 중입니다.");
			try {
				let e = await F(`/api/analyze?${new URLSearchParams({
					q: t,
					analysisStyle: c
				}).toString()}`), n;
				if (Kt(e)) {
					let t = await qt(e), r = t.result?.reportId || t.result?.artifactId || "";
					if (!r) throw Error("생성된 보고서 ID를 확인하지 못했습니다.");
					n = await F(`/api/analysis-reports/${encodeURIComponent(r)}?includePersonal=true`);
				} else n = e;
				await E(), T("기업 분석 보고서를 생성하고 자동 저장했습니다."), r(n), n.id && dn(n.id);
			} catch (e) {
				C(e instanceof Error ? e.message : "기업 분석 생성에 실패했습니다."), T("");
			} finally {
				y(!1);
			}
		}
	}
	async function O(e) {
		e && dn(e);
	}
	async function k(e) {
		if (e.id && window.confirm(`${Zt(e)} 보고서를 삭제할까요?`)) {
			x(`delete-${e.id}`), C("");
			try {
				let t = await fetch(`/api/analysis-reports/${encodeURIComponent(e.id)}`, { method: "DELETE" });
				if (!t.ok) throw Error(`삭제 실패: ${t.status}`);
				n?.id === e.id && dn(), await E(), T("저장된 기업 분석 보고서를 삭제했습니다.");
			} catch (e) {
				C(e instanceof Error ? e.message : "보고서 삭제에 실패했습니다.");
			} finally {
				x("");
			}
		}
	}
	async function A(e) {
		if (n) {
			x(e), T(e === "notion" ? "Notion으로 내보내는 중..." : "Obsidian으로 내보내는 중...");
			try {
				let t = e === "notion" ? await I("/api/export-notion/analysis", n) : await I("/api/export-obsidian/analysis", n);
				T(e === "notion" ? `Notion으로 내보냈습니다${t.title ? `: ${t.title}` : ""}` : `Obsidian으로 내보냈습니다${t.company || t.filename ? `: ${t.company || t.filename}` : ""}`);
			} catch (e) {
				T(e instanceof Error ? e.message : "내보내기에 실패했습니다.");
			} finally {
				x("");
			}
		}
	}
	async function j() {
		if (n?.id) {
			x("overlay"), T("내 노트와 연결하는 중...");
			try {
				let e = await I(`/api/analysis-reports/${encodeURIComponent(n.id)}/personal-overlay`, {});
				Kt(e) && await qt(e);
				let t = await F(`/api/analysis-reports/${encodeURIComponent(n.id)}?includePersonal=true`);
				r(t), T("내 노트와 연결했습니다.");
			} catch (e) {
				T(e instanceof Error ? e.message : "내 노트 연결에 실패했습니다.");
			} finally {
				x("");
			}
		}
	}
	let M = (0, p.useMemo)(() => {
		let t = sn(u);
		return t ? e.filter((e) => sn([
			Yt(e),
			Xt(e),
			Zt(e),
			e.headline,
			e.mode,
			e.generatedAt,
			$t(e.generatedAt)
		].filter(Boolean).join(" ")).includes(t)) : e;
	}, [u, e]), ee = (0, p.useMemo)(() => {
		let e = [...M].sort((e, t) => String(t.generatedAt || "").localeCompare(String(e.generatedAt || "")));
		if (f === "recent") return e.length ? [{
			key: "recent",
			label: `최근 보고서 ${Math.min(e.length, Wt)}건`,
			rows: e.slice(0, Wt)
		}] : [];
		if (f === "month") {
			let t = /* @__PURE__ */ new Map();
			for (let n of e) {
				let e = on(n.generatedAt);
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
			let e = Yt(n) || Qt(n);
			t.has(e) || t.set(e, []), t.get(e)?.push(n);
		}
		return Array.from(t.entries()).map(([e, t]) => ({
			key: e,
			label: Qt(t[0] || {}),
			rows: t.sort((e, t) => String(t.generatedAt || "").localeCompare(String(e.generatedAt || "")))
		})).sort((e, t) => String(t.rows[0]?.generatedAt || "").localeCompare(String(e.rows[0]?.generatedAt || "")));
	}, [M, f]), N = un(n || {}), P = Jt(N, n?.headline || Zt(n || {})), z = n?.sources || [], B = an(n);
	return n ? /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "react-company-analysis-route",
		"data-company-analysis-route": !0,
		children: [S && /* @__PURE__ */ (0, m.jsx)("p", {
			className: "react-dashboard-error",
			children: S
		}), /* @__PURE__ */ (0, m.jsxs)(Ve, {
			eyebrow: `COMPANY ANALYSIS${Yt(n) ? ` · ${Yt(n)}` : ""}`,
			title: P.title,
			meta: [n.generatedAt ? `생성일 ${$t(n.generatedAt)}` : "", en(n.analysisStyle)].filter(Boolean).join(" · "),
			agentContext: {
				surface: "analysis_reader",
				viewId: "analysis",
				reportKind: "company_analysis",
				reportId: n.id || "",
				ticker: Yt(n)
			},
			breadcrumb: /* @__PURE__ */ (0, m.jsxs)(m.Fragment, { children: [/* @__PURE__ */ (0, m.jsx)("button", {
				type: "button",
				onClick: () => dn(),
				children: "기업 분석"
			}), /* @__PURE__ */ (0, m.jsx)("span", { children: P.title })] }),
			onClose: () => dn(),
			actionSlot: /* @__PURE__ */ (0, m.jsxs)(m.Fragment, { children: [
				/* @__PURE__ */ (0, m.jsx)(be, {
					title: "AI",
					children: /* @__PURE__ */ (0, m.jsx)(xe, {
						icon: "agent",
						onClick: () => R({
							surface: "analysis_reader",
							reportKind: "company_analysis",
							reportId: n.id || "",
							ticker: Yt(n),
							message: `${P.title}에서 투자 판단에 중요한 핵심, 리스크, 추가 확인 질문을 정리해줘.`,
							autoSubmit: !0
						}),
						children: "Agent에게 묻기"
					})
				}),
				/* @__PURE__ */ (0, m.jsx)(be, {
					title: "노트",
					children: /* @__PURE__ */ (0, m.jsx)(xe, {
						icon: "link",
						disabled: b === "overlay" || !n.id,
						onClick: j,
						children: b === "overlay" ? "연결 중" : "내 노트와 연결"
					})
				}),
				/* @__PURE__ */ (0, m.jsxs)(be, {
					title: "내보내기",
					children: [/* @__PURE__ */ (0, m.jsx)(xe, {
						icon: "notion",
						disabled: b === "notion",
						onClick: () => A("notion"),
						children: b === "notion" ? "내보내는 중" : "Notion으로 내보내기"
					}), /* @__PURE__ */ (0, m.jsx)(xe, {
						icon: "obsidian",
						disabled: b === "obsidian",
						onClick: () => A("obsidian"),
						children: b === "obsidian" ? "내보내는 중" : "Obsidian으로 내보내기"
					})]
				}),
				B.length > 0 && /* @__PURE__ */ (0, m.jsx)(be, {
					title: "자료 한계",
					children: /* @__PURE__ */ (0, m.jsx)("div", {
						className: "react-reader-gap-list",
						children: B.slice(0, 3).map((e, t) => /* @__PURE__ */ (0, m.jsxs)("div", {
							className: "react-reader-gap",
							children: [
								/* @__PURE__ */ (0, m.jsx)("span", { children: tn(e.severity) }),
								/* @__PURE__ */ (0, m.jsx)("strong", { children: e.label || e.category || "추가 확인 필요" }),
								/* @__PURE__ */ (0, m.jsx)("p", { children: e.message || e.suggestedAction || "보고서 해석 시 확인이 필요한 자료 한계입니다." })
							]
						}, `${e.field || e.category || "gap"}-${t}`))
					})
				}),
				n.generation?.message && /* @__PURE__ */ (0, m.jsx)("p", {
					className: "react-reader-status",
					children: n.generation.message
				}),
				w && /* @__PURE__ */ (0, m.jsx)("p", {
					className: "react-reader-status",
					children: w
				})
			] }),
			noteIdentity: {
				id: ze("company", Yt(n) || n.headline || "company"),
				noteType: "company_thesis",
				title: Yt(n) ? `${Yt(n)} 투자 노트` : "기업 투자 노트",
				ticker: Yt(n),
				company: n.company?.name || "",
				label: Yt(n),
				reportKind: "company_analysis",
				reportId: Yt(n),
				linkedReports: [P.title].filter(Boolean)
			},
			noteLinkedTitle: P.title,
			noteOverlayMarkdown: n.personalOverlay?.markdown || "",
			children: [/* @__PURE__ */ (0, m.jsx)(Ht, {
				markdown: P.body || N,
				charts: n.analysisCharts
			}), z.length > 0 && /* @__PURE__ */ (0, m.jsxs)("section", {
				className: "source-panel react-analysis-sources",
				children: [/* @__PURE__ */ (0, m.jsx)("h4", { children: "참고자료" }), /* @__PURE__ */ (0, m.jsx)("div", {
					className: "sources",
					children: z.map((e, t) => /* @__PURE__ */ (0, m.jsxs)("div", {
						className: "meta",
						children: [/* @__PURE__ */ (0, m.jsx)("span", { children: cn(e) }), e.url ? /* @__PURE__ */ (0, m.jsx)("a", {
							href: e.url,
							target: "_blank",
							rel: "noopener noreferrer",
							children: ln(e)
						}) : /* @__PURE__ */ (0, m.jsx)("span", { children: ln(e) })]
					}, `${ln(e)}-${t}`))
				})]
			})]
		})]
	}) : /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "react-company-analysis-route",
		"data-company-analysis-route": !0,
		children: [
			/* @__PURE__ */ (0, m.jsx)(He, {
				eyebrow: "Company Analysis",
				title: "기업 분석",
				description: "SEC, DART, 시장 데이터와 로컬 자료를 활용해 기업 분석 보고서를 생성합니다.",
				actions: /* @__PURE__ */ (0, m.jsx)("button", {
					type: "button",
					onClick: E,
					disabled: g,
					children: g ? "불러오는 중" : "새로고침"
				})
			}),
			/* @__PURE__ */ (0, m.jsxs)("form", {
				className: "react-analysis-form",
				onSubmit: D,
				children: [
					/* @__PURE__ */ (0, m.jsxs)("div", {
						className: "react-analysis-api-note",
						role: "note",
						children: [/* @__PURE__ */ (0, m.jsx)("strong", { children: "API 연동 안내" }), /* @__PURE__ */ (0, m.jsx)("span", { children: "미국 기업은 SEC 자료를 우선 사용하고, 한국 기업은 DART API Key를 설정하면 공시 확인 정확도가 높아집니다." })]
					}),
					/* @__PURE__ */ (0, m.jsx)("div", {
						className: "react-analysis-query",
						children: /* @__PURE__ */ (0, m.jsxs)("label", { children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "분석 대상" }), /* @__PURE__ */ (0, m.jsx)("input", {
							value: o,
							onChange: (e) => s(e.currentTarget.value),
							placeholder: "예: NVDA, 삼성전자, SK하이닉스"
						})] })
					}),
					/* @__PURE__ */ (0, m.jsxs)("fieldset", {
						className: "react-analysis-style",
						"aria-label": "보고서 모드",
						children: [/* @__PURE__ */ (0, m.jsx)("legend", { children: "보고서 모드" }), /* @__PURE__ */ (0, m.jsx)("div", {
							className: "react-analysis-style-toggle",
							"data-style": c,
							children: Ut.map((e) => /* @__PURE__ */ (0, m.jsx)("button", {
								type: "button",
								className: c === e.value ? "active" : "",
								"aria-pressed": c === e.value,
								onClick: () => l(e.value),
								"data-tooltip": e.description,
								children: e.label
							}, e.value))
						})]
					}),
					/* @__PURE__ */ (0, m.jsx)("button", {
						type: "submit",
						disabled: v || !o.trim(),
						children: v ? "분석 중" : "분석"
					})
				]
			}),
			S && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "react-dashboard-error",
				children: S
			}),
			w && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "react-dashboard-warning",
				children: w
			}),
			/* @__PURE__ */ (0, m.jsxs)("section", {
				className: "input-panel react-analysis-feed-controls report-feed-controls",
				"aria-label": "저장 기업 분석 검색",
				children: [/* @__PURE__ */ (0, m.jsxs)("div", {
					className: "briefing-archive-filters",
					children: [/* @__PURE__ */ (0, m.jsxs)("label", { children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "검색" }), /* @__PURE__ */ (0, m.jsx)("input", {
						type: "search",
						value: u,
						onChange: (e) => d(e.currentTarget.value),
						placeholder: "티커·회사명·보고서 검색"
					})] }), /* @__PURE__ */ (0, m.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						onClick: () => {
							d(""), h("recent");
						},
						children: "초기화"
					})]
				}), /* @__PURE__ */ (0, m.jsxs)("div", {
					className: "briefing-archive-summary",
					children: [/* @__PURE__ */ (0, m.jsxs)("span", { children: [M.length, "건"] }), /* @__PURE__ */ (0, m.jsx)("span", {
						"aria-live": "polite",
						children: g ? "불러오는 중..." : u ? "검색 결과" : ""
					})]
				})]
			}),
			/* @__PURE__ */ (0, m.jsx)("div", {
				className: "report-feed-outside-controls",
				"aria-label": "기업 분석 표시 옵션",
				children: /* @__PURE__ */ (0, m.jsxs)("div", {
					className: "report-feed-view-row",
					children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "보기" }), /* @__PURE__ */ (0, m.jsx)("label", {
						className: "report-feed-view-pill",
						children: /* @__PURE__ */ (0, m.jsxs)("select", {
							value: f,
							onChange: (e) => h(e.currentTarget.value),
							children: [
								/* @__PURE__ */ (0, m.jsx)("option", {
									value: "recent",
									children: "최근"
								}),
								/* @__PURE__ */ (0, m.jsx)("option", {
									value: "company",
									children: "기업별"
								}),
								/* @__PURE__ */ (0, m.jsx)("option", {
									value: "month",
									children: "월별"
								})
							]
						})
					})]
				})
			}),
			/* @__PURE__ */ (0, m.jsxs)("section", {
				className: "react-analysis-feed",
				"aria-label": "저장된 기업 분석",
				children: [/* @__PURE__ */ (0, m.jsxs)("div", {
					className: "react-section-heading",
					children: [/* @__PURE__ */ (0, m.jsxs)("div", { children: [/* @__PURE__ */ (0, m.jsx)("p", {
						className: "section-kicker",
						children: "Saved Reports"
					}), /* @__PURE__ */ (0, m.jsx)("h2", { children: "저장된 기업 분석" })] }), /* @__PURE__ */ (0, m.jsxs)("span", { children: [e.length, " reports"] })]
				}), ee.length ? ee.map((e) => /* @__PURE__ */ (0, m.jsxs)("section", {
					className: "report-feed-group",
					children: [/* @__PURE__ */ (0, m.jsxs)("div", {
						className: "report-feed-group-head",
						children: [/* @__PURE__ */ (0, m.jsx)("span", {
							className: "report-feed-group-name",
							children: e.label
						}), /* @__PURE__ */ (0, m.jsxs)("span", {
							className: "report-feed-group-meta",
							children: [
								e.rows.length,
								"건 · 최근 ",
								$t(e.rows[0]?.generatedAt)
							]
						})]
					}), /* @__PURE__ */ (0, m.jsx)("div", {
						className: "report-feed-group-cards",
						children: e.rows.map((e) => {
							let t = b === `delete-${e.id}`;
							return /* @__PURE__ */ (0, m.jsxs)("div", {
								className: "report-feed-card-wrap",
								children: [/* @__PURE__ */ (0, m.jsxs)("button", {
									className: "report-feed-card is-analysis",
									type: "button",
									onClick: () => O(e.id),
									children: [
										/* @__PURE__ */ (0, m.jsxs)("span", {
											className: "report-feed-card-meta",
											children: [e.mode && /* @__PURE__ */ (0, m.jsx)("span", {
												className: "report-feed-badge",
												children: String(e.mode).toUpperCase()
											}), e.analysisStyle && /* @__PURE__ */ (0, m.jsx)("span", {
												className: "report-feed-badge",
												children: en(e.analysisStyle) || String(e.analysisStyle).toUpperCase()
											})]
										}),
										/* @__PURE__ */ (0, m.jsx)("strong", { children: Qt(e) }),
										/* @__PURE__ */ (0, m.jsxs)("span", {
											className: "report-feed-card-foot",
											children: ["생성일 ", $t(e.generatedAt)]
										})
									]
								}), /* @__PURE__ */ (0, m.jsx)("button", {
									type: "button",
									className: "report-feed-card-delete",
									disabled: t,
									onClick: () => k(e),
									"aria-label": `${Zt(e)} 삭제`,
									"data-tooltip": "삭제",
									children: /* @__PURE__ */ (0, m.jsx)("svg", {
										width: "13",
										height: "13",
										viewBox: "0 0 16 16",
										fill: "none",
										stroke: "currentColor",
										strokeWidth: "1.4",
										strokeLinecap: "round",
										strokeLinejoin: "round",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, m.jsx)("path", { d: "M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" })
									})
								})]
							}, e.id || `${Qt(e)}-${e.generatedAt}`);
						})
					})]
				}, e.key)) : /* @__PURE__ */ (0, m.jsxs)("article", {
					className: "react-dashboard-panel",
					children: [/* @__PURE__ */ (0, m.jsx)("h2", { children: "저장된 기업 분석 보고서가 없습니다." }), /* @__PURE__ */ (0, m.jsx)("p", { children: "분석 대상을 입력해 첫 보고서를 생성하세요." })]
				})]
			})
		]
	});
}
//#endregion
//#region src/islands/MarketStateDashboard.tsx
var hn = {
	high: "높음",
	medium: "보통",
	low: "낮음"
}, gn = {
	overall: "종합",
	us: "미국장",
	kr: "한국장"
};
function _n(e) {
	let t = String(e || "").replace(/\s+/g, " ").trim(), n = t.match(/[^.!?。]+[.!?。]?/g)?.map((e) => e.trim()).filter(Boolean) || [];
	return {
		lead: n[0] || t,
		support: n.slice(1, 3).join(" ")
	};
}
function vn(e) {
	if (!e) return "";
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? e : t.toLocaleString("ko-KR", {
		dateStyle: "medium",
		timeStyle: "short"
	});
}
function yn(e) {
	let t = String(e.directionLabel || "").trim();
	if (t === "중립") return "neutral";
	if (t === "혼재" || t === "변동성") return "warning";
	if (t === "도움" || t === "부담 완화") return "positive";
	if (t === "부담") return "negative";
	let n = `${e.directionLabel || ""} ${e.directionTone || ""}`.toLowerCase();
	return /neutral|중립/.test(n) ? "neutral" : /mixed|conflicted|혼재|변동성/.test(n) ? "warning" : /support|positive|완화|호재|긍정|지지|강화|도움/.test(n) ? "positive" : /risk|negative|부담|악화|위험|하방/.test(n) ? "negative" : "neutral";
}
function bn(e) {
	let t = String(e.directionLabel || "").trim();
	return !t || t === "도움" ? "긍정 요인" : t === "부담" ? "부담 가중" : t === "변동성" ? "변동성 증가" : t;
}
function xn(e) {
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
function Sn({ items: e }) {
	return /* @__PURE__ */ (0, m.jsx)("ul", {
		className: "market-state-check-list",
		children: e.slice(0, 5).map((e, t) => {
			let n = xn(e);
			return /* @__PURE__ */ (0, m.jsxs)("li", {
				className: "market-state-check-item",
				children: [
					n.title && /* @__PURE__ */ (0, m.jsx)("strong", { children: n.title }),
					n.summary && /* @__PURE__ */ (0, m.jsx)("span", { children: n.summary }),
					n.sourceRefs.length ? /* @__PURE__ */ (0, m.jsx)("small", { children: n.sourceRefs.join(" · ") }) : null
				]
			}, `${n.title || n.summary}-${t}`);
		})
	});
}
function Cn({ driver: e }) {
	let t = hn[e.confidence] || e.confidence || "보통", n = e.interpretation, r = e.marketImpact || e.interpretation, i = e.evidenceSummary || e.whyItMatters || e.rationale, a = e.nextMemoryCheck || e.whatToWatch || e.nextCheckpoint, o = [
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
	return /* @__PURE__ */ (0, m.jsxs)("article", {
		className: `market-driver-card momentum-${e.momentum || "stable"}`,
		children: [
			/* @__PURE__ */ (0, m.jsxs)("div", {
				className: "market-driver-top",
				children: [/* @__PURE__ */ (0, m.jsx)("h3", { children: e.title }), /* @__PURE__ */ (0, m.jsx)("div", {
					className: "market-driver-chip-row",
					children: e.directionLabel && /* @__PURE__ */ (0, m.jsx)("span", {
						className: `market-direction-chip direction-${yn(e)}`,
						children: bn(e)
					})
				})]
			}),
			n && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "market-driver-summary",
				children: n
			}),
			o.length ? /* @__PURE__ */ (0, m.jsxs)("details", {
				className: "market-driver-details",
				children: [/* @__PURE__ */ (0, m.jsx)("summary", { children: "근거 보기" }), /* @__PURE__ */ (0, m.jsx)("dl", {
					className: "market-driver-detail-list",
					children: o.map((e) => /* @__PURE__ */ (0, m.jsxs)("div", { children: [/* @__PURE__ */ (0, m.jsx)("dt", { children: e.label }), /* @__PURE__ */ (0, m.jsx)("dd", { children: e.value })] }, e.label))
				})]
			}) : null,
			/* @__PURE__ */ (0, m.jsxs)("footer", { children: [/* @__PURE__ */ (0, m.jsxs)("small", { children: [
				"확신도 ",
				t,
				e.confidencePct ? ` · ${e.confidencePct}%` : ""
			] }), /* @__PURE__ */ (0, m.jsx)("button", {
				type: "button",
				className: "agent-action agent-ask-btn",
				"data-agent-prompt": e.askAgentPrompt,
				"data-tooltip": "Agent에게 묻기",
				"aria-label": "Agent에게 묻기",
				children: /* @__PURE__ */ (0, m.jsx)("span", {
					className: "agent-logo-slot",
					"aria-hidden": "true"
				})
			})] })
		]
	});
}
function wn({ onUpdate: e, updating: t = !1 } = {}) {
	let [n, r] = (0, p.useState)(null), [i, a] = (0, p.useState)("overall"), [o, s] = (0, p.useState)(""), [c, l] = (0, p.useState)(!1), u = (0, p.useCallback)(async () => {
		l(!0), s("");
		try {
			let e = await F("/api/memory/state-dashboard?limit=5");
			r(e), ye().updateAgentContext?.({
				surface: "market_state",
				viewId: "memory",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			s(e instanceof Error ? e.message : String(e));
		} finally {
			l(!1);
		}
	}, []);
	(0, p.useEffect)(() => {
		u();
	}, [u]), (0, p.useEffect)(() => {
		ye().applyAgentBranding?.();
	}, [n]);
	let d = n?.marketViews || {}, f = [
		"overall",
		"us",
		"kr"
	], h = f.includes(i) ? i : "overall", g = h === "overall" ? d.overall || n : d[h] || n, _ = g?.drivers ?? [], v = g?.plainConclusion || g?.summary || "", y = g?.reasonSummary || g?.sourceSummary || g?.stance || "", b = _n(y), x = vn(g?.snapshot?.asOf), S = vn(n?.freshness?.latestMemoryAt), C = !!n?.freshness?.stale, w = g?.briefs?.length ? g.briefs : [
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
	return /* @__PURE__ */ (0, m.jsxs)(m.Fragment, { children: [
		/* @__PURE__ */ (0, m.jsxs)("div", {
			className: "market-state-head",
			children: [/* @__PURE__ */ (0, m.jsxs)("div", { children: [/* @__PURE__ */ (0, m.jsx)("p", {
				className: "section-kicker",
				children: "Market State"
			}), /* @__PURE__ */ (0, m.jsx)("h2", { children: g?.title || n?.title || "현재 중기 시장 상황" })] }), /* @__PURE__ */ (0, m.jsxs)("div", {
				className: "market-state-head-actions",
				children: [
					x ? /* @__PURE__ */ (0, m.jsxs)("span", {
						className: `market-state-asof${C ? " stale" : ""}`,
						children: [
							"생성 ",
							x,
							C ? " · 최신 메모리 반영 전" : ""
						]
					}) : null,
					e ? /* @__PURE__ */ (0, m.jsx)("button", {
						className: "filter-btn apply",
						type: "button",
						onClick: e,
						disabled: t || c,
						children: t ? "업데이트 중" : "시장 메모리 업데이트"
					}) : null,
					/* @__PURE__ */ (0, m.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						onClick: u,
						disabled: c || t,
						children: c ? "불러오는 중…" : "새로고침"
					})
				]
			})]
		}),
		f.length > 1 ? /* @__PURE__ */ (0, m.jsx)("div", {
			className: "market-scope-tabs",
			role: "tablist",
			"aria-label": "시장 범위 선택",
			"data-scope": h,
			"data-count": f.length,
			children: f.map((e) => /* @__PURE__ */ (0, m.jsx)("button", {
				type: "button",
				role: "tab",
				"aria-selected": h === e,
				className: h === e ? "active" : "",
				onClick: () => a(e),
				children: gn[e]
			}, e))
		}) : null,
		C ? /* @__PURE__ */ (0, m.jsxs)("p", {
			className: "market-state-stale-note",
			children: [
				"최신 시장 메모리",
				S ? `(${S})` : "",
				"가 저장됐지만, 화면용 시장 상태 스냅샷은 아직 다시 생성되지 않았습니다. 시장 메모리 업데이트를 다시 실행하면 화면 판단을 갱신합니다."
			]
		}) : null,
		o ? /* @__PURE__ */ (0, m.jsxs)("p", {
			className: "market-state-summary",
			children: ["시장 상황을 불러오지 못했습니다: ", o]
		}) : /* @__PURE__ */ (0, m.jsxs)("div", {
			className: "market-state-overview",
			children: [y ? /* @__PURE__ */ (0, m.jsxs)("section", {
				className: "market-state-interpretation",
				children: [
					/* @__PURE__ */ (0, m.jsx)("span", { children: "시장 해석" }),
					/* @__PURE__ */ (0, m.jsx)("strong", { children: b.lead }),
					b.support ? /* @__PURE__ */ (0, m.jsx)("p", { children: b.support }) : null
				]
			}) : null, g?.actionGuide || g?.posture || v ? /* @__PURE__ */ (0, m.jsxs)("section", {
				className: `market-state-posture posture-${g?.posture?.tone || "watch"}`,
				children: [
					/* @__PURE__ */ (0, m.jsx)("span", { children: "판단 및 투자 행동" }),
					v && /* @__PURE__ */ (0, m.jsx)("p", {
						className: "market-state-summary",
						children: v
					}),
					g?.actionGuide ? /* @__PURE__ */ (0, m.jsxs)("div", {
						className: "market-state-action-body",
						children: [
							/* @__PURE__ */ (0, m.jsx)("strong", { children: g.actionGuide.headline }),
							/* @__PURE__ */ (0, m.jsx)("p", { children: g.actionGuide.action }),
							g.actionGuide.timing && /* @__PURE__ */ (0, m.jsx)("small", { children: g.actionGuide.timing })
						]
					}) : g?.posture ? /* @__PURE__ */ (0, m.jsxs)("div", {
						className: "market-state-action-body",
						children: [/* @__PURE__ */ (0, m.jsx)("strong", { children: g.posture.label }), /* @__PURE__ */ (0, m.jsx)("p", { children: g.posture.summary })]
					}) : null,
					g?.watchItems?.length || w[3]?.value ? /* @__PURE__ */ (0, m.jsxs)("div", {
						className: "market-state-action-list",
						children: [/* @__PURE__ */ (0, m.jsx)("b", { children: "다음 확인" }), g?.watchItems?.length ? /* @__PURE__ */ (0, m.jsx)("ul", { children: g.watchItems.slice(0, 3).map((e) => /* @__PURE__ */ (0, m.jsx)("li", { children: e }, e)) }) : /* @__PURE__ */ (0, m.jsx)("p", { children: w[3]?.value })]
					}) : null
				]
			}) : null]
		}),
		/* @__PURE__ */ (0, m.jsx)("div", {
			className: "market-state-drivers",
			children: _.map((e, t) => /* @__PURE__ */ (0, m.jsx)(Cn, { driver: e }, e.id || t))
		}),
		g && ((g.counterEvidence?.length || 0) > 0 || (g.uncertainties?.length || 0) > 0) ? /* @__PURE__ */ (0, m.jsxs)("div", {
			className: "market-state-checks",
			"aria-label": "반대 근거와 불확실성",
			children: [g.counterEvidence?.length ? /* @__PURE__ */ (0, m.jsxs)("section", { children: [/* @__PURE__ */ (0, m.jsx)("h3", { children: "반대 근거" }), /* @__PURE__ */ (0, m.jsx)(Sn, { items: g.counterEvidence })] }) : null, g.uncertainties?.length ? /* @__PURE__ */ (0, m.jsxs)("section", { children: [/* @__PURE__ */ (0, m.jsx)("h3", { children: "불확실성" }), /* @__PURE__ */ (0, m.jsx)(Sn, { items: g.uncertainties })] }) : null]
		}) : null,
		n?.sourceRefs?.length ? /* @__PURE__ */ (0, m.jsxs)("details", {
			className: "market-state-sources",
			children: [/* @__PURE__ */ (0, m.jsxs)("summary", { children: [
				"사용한 출처 ",
				n.sourceRefs.length,
				"개"
			] }), /* @__PURE__ */ (0, m.jsx)("ul", { children: n.sourceRefs.slice(0, 8).map((e, t) => /* @__PURE__ */ (0, m.jsxs)("li", { children: [e.url ? /* @__PURE__ */ (0, m.jsx)("a", {
				href: e.url,
				target: "_blank",
				rel: "noreferrer",
				children: e.title || e.source || e.url
			}) : /* @__PURE__ */ (0, m.jsx)("span", { children: e.title || e.source || e.id }), e.source && /* @__PURE__ */ (0, m.jsx)("small", { children: e.source })] }, e.id || t)) })]
		}) : null
	] });
}
//#endregion
//#region src/app/Dashboard.tsx
var Tn = {
	positive: "긍정",
	watch: "주의",
	negative: "부정",
	neutral: "중립"
};
function En(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function Dn(e) {
	let t = e;
	return !!(t?.id && t?.kind === "agent_bridge" && ["queued", "running"].includes(t.status));
}
async function On(e) {
	let t = e;
	for (; ["queued", "running"].includes(t.status);) await En(1e3), t = await F(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "투자 리뷰 생성에 실패했습니다.");
	return t;
}
function kn(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : 0;
}
function An(e, t) {
	for (let n of t) {
		let t = kn(e?.[n]);
		if (t) return t;
	}
	return 0;
}
function jn(e) {
	return e.name || e.ticker || "포지션";
}
function Mn() {
	let e = (0, p.useRef)(null), [t, n] = (0, p.useState)(null), [r, i] = (0, p.useState)(""), [a, o] = (0, p.useState)(""), [s, c] = (0, p.useState)(null), l = (0, p.useCallback)(async () => {
		try {
			let e = await F("/api/market-widgets/settings");
			n(e), i("");
		} catch (e) {
			i(e instanceof Error ? e.message : "시장 위젯 설정을 불러오지 못했습니다.");
		}
	}, []);
	(0, p.useEffect)(() => {
		let e = !0;
		return F("/api/market-widgets/settings").then((t) => {
			e && (n(t), i(""));
		}).catch((t) => {
			e && i(t instanceof Error ? t.message : "시장 위젯 설정을 불러오지 못했습니다.");
		}), () => {
			e = !1;
		};
	}, []), (0, p.useEffect)(() => {
		let e = (e) => {
			let t = e.detail;
			t ? (n(t), i("")) : l();
		};
		return document.addEventListener("folio:market-widgets-updated", e), () => document.removeEventListener("folio:market-widgets-updated", e);
	}, [l]), (0, p.useEffect)(() => {
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
	async function u(e) {
		let t = await I("/api/market-widgets/settings", e);
		return n(t), document.dispatchEvent(new CustomEvent("folio:market-widgets-updated", { detail: t })), t;
	}
	function d() {
		return t?.dashboard?.widgets ? [...t.dashboard.widgets] : [];
	}
	function f(e) {
		return {
			...t,
			dashboard: {
				...t?.dashboard || {},
				widgets: e
			},
			presetOverrides: t?.presetOverrides || {}
		};
	}
	async function h(e, t) {
		let n = d(), r = n.findIndex((t) => t.id === e);
		if (r < 0) return;
		let a = Math.max(0, Math.min(n.length - 1, t));
		if (r === a) return;
		let [o] = n.splice(r, 1);
		n.splice(a, 0, o);
		try {
			await u(f(n)), i("");
		} catch (e) {
			i(e instanceof Error ? e.message : "시장 위젯 위치 저장에 실패했습니다.");
		}
	}
	async function g(e, t, n) {
		let r = d(), a = r.findIndex((t) => t.id === e);
		if (a < 0) return;
		let o = Math.max(240, Math.min(1100, Math.round(t))), s = Math.max(3, Math.min(12, Math.round(n))), c = Math.round(Number(r[a].height || 0)), l = Math.round(Number(r[a].columns || 0));
		if (!(c === o && l === s)) {
			r[a] = {
				...r[a],
				height: o,
				columns: s
			};
			try {
				await u(f(r)), i("");
			} catch (e) {
				i(e instanceof Error ? e.message : "시장 위젯 크기 저장에 실패했습니다.");
			}
		}
	}
	async function _(e) {
		o(e);
		try {
			let t = d(), n = `${e}-${Date.now().toString(36)}`, r = e === "overview" ? {
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
			await u(f([...t, r])), i("");
		} catch (e) {
			i(e instanceof Error ? e.message : "시장 위젯 추가에 실패했습니다.");
		} finally {
			o("");
		}
	}
	async function v() {
		o("reset");
		try {
			await u({ dashboard: { widgets: [] } }), i("");
		} catch (e) {
			i(e instanceof Error ? e.message : "시장 위젯 기본값 복원에 실패했습니다.");
		} finally {
			o("");
		}
	}
	async function y(e) {
		c(null);
		let t = d(), n = t.findIndex((t) => t.id === e);
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
			await u(f(t)), i("");
		} catch (e) {
			i(e instanceof Error ? e.message : "시장 위젯 수정에 실패했습니다.");
		} finally {
			o("");
		}
	}
	async function b(e) {
		c(null);
		let t = d(), n = t.find((t) => t.id === e);
		if (!n) return;
		let r = n.title || n.symbol || n.type || "위젯";
		if (window.confirm(`${r} 위젯을 삭제할까요?`)) {
			o("delete");
			try {
				await u(f(t.filter((t) => t.id !== e))), i("");
			} catch (e) {
				i(e instanceof Error ? e.message : "시장 위젯 삭제에 실패했습니다.");
			} finally {
				o("");
			}
		}
	}
	return (0, p.useEffect)(() => {
		let t = e.current;
		if (!t) return;
		let n = (e) => {
			let t = e.target?.closest("[data-tv-widget-menu]");
			if (!t) return;
			e.preventDefault(), e.stopPropagation();
			let n = t.closest(".tv-widget-card")?.dataset.widgetId || "";
			if (!n) return;
			let r = t.getBoundingClientRect();
			c({
				widgetId: n,
				x: r.right,
				y: r.bottom + 6
			});
		};
		return t.addEventListener("click", n), () => t.removeEventListener("click", n);
	}, [t]), (0, p.useEffect)(() => {
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
				r = null, g(e, i, a);
			}
			if (i) {
				let { widgetId: t, card: n } = i;
				n.classList.remove("tv-widget-dragging"), i = null, h(t, s(e.clientX, e.clientY));
			}
		};
		return n.addEventListener("pointerdown", c), window.addEventListener("pointermove", l), window.addEventListener("pointerup", u), () => {
			n.removeEventListener("pointerdown", c), window.removeEventListener("pointermove", l), window.removeEventListener("pointerup", u);
		};
	}, [t]), /* @__PURE__ */ (0, m.jsxs)("article", {
		className: "market-widget-panel react-dashboard-market-widget",
		"data-current-market": !0,
		children: [
			/* @__PURE__ */ (0, m.jsxs)("div", {
				className: "market-widget-head",
				children: [/* @__PURE__ */ (0, m.jsxs)("div", { children: [/* @__PURE__ */ (0, m.jsx)("p", {
					className: "section-kicker",
					children: "Current Market"
				}), /* @__PURE__ */ (0, m.jsx)("h2", {
					id: "marketWidgetTitle",
					children: "Current Market"
				})] }), /* @__PURE__ */ (0, m.jsxs)("div", {
					className: "market-widget-actions",
					children: [
						/* @__PURE__ */ (0, m.jsx)("button", {
							id: "editGlobalMarketsBtn",
							className: "filter-btn",
							type: "button",
							disabled: a === "overview",
							onClick: (e) => {
								e.stopPropagation(), _("overview");
							},
							children: a === "overview" ? "추가 중" : "위젯 추가"
						}),
						/* @__PURE__ */ (0, m.jsx)("button", {
							id: "addMarketChartBtn",
							className: "filter-btn",
							type: "button",
							disabled: a === "chart",
							onClick: (e) => {
								e.stopPropagation(), _("chart");
							},
							children: a === "chart" ? "추가 중" : "빠른 차트 추가"
						}),
						/* @__PURE__ */ (0, m.jsx)("button", {
							id: "resetMarketWidgetsBtn",
							className: "filter-btn clear",
							type: "button",
							disabled: a === "reset",
							onClick: (e) => {
								e.stopPropagation(), v();
							},
							children: a === "reset" ? "복원 중" : "기본값"
						})
					]
				})]
			}),
			r && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "react-dashboard-error",
				children: r
			}),
			s && /* @__PURE__ */ (0, m.jsxs)("div", {
				className: "market-widget-context-menu is-open",
				style: {
					left: s.x,
					top: s.y
				},
				role: "menu",
				children: [/* @__PURE__ */ (0, m.jsx)("button", {
					type: "button",
					role: "menuitem",
					onClick: () => void y(s.widgetId),
					children: "수정"
				}), /* @__PURE__ */ (0, m.jsx)("button", {
					type: "button",
					role: "menuitem",
					"data-market-widget-action": "delete",
					onClick: () => void b(s.widgetId),
					children: "삭제"
				})]
			}),
			/* @__PURE__ */ (0, m.jsx)("div", {
				id: "marketWidgetBoard",
				ref: e,
				className: "market-widget-board",
				"data-fallback": "<div class=\"tradingview-widget-unavailable\">시장 위젯을 표시할 수 없습니다.</div>"
			})
		]
	});
}
function Nn() {
	let [e, t] = (0, p.useState)({
		dashboard: null,
		review: null
	}), [n, r] = (0, p.useState)(!1), [i, a] = (0, p.useState)(!1), [o, s] = (0, p.useState)(""), c = (0, p.useCallback)(async () => {
		r(!0), s("");
		try {
			let [e, n] = await Promise.all([F("/api/dashboard"), F("/api/investment-review")]);
			t({
				dashboard: e,
				review: n
			}), L({
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
	(0, p.useEffect)(() => {
		c();
	}, [c]);
	async function l() {
		a(!0), s("");
		try {
			let e = await I("/api/investment-review/generate", { forceRefresh: !0 }), n;
			if (Dn(e)) {
				let t = await On(e), r = t.result?.date || t.result?.artifactId || "";
				n = r ? await F(`/api/investment-review/${encodeURIComponent(r)}`) : await F("/api/investment-review");
			} else n = e;
			let r = await F("/api/dashboard");
			t({
				dashboard: r,
				review: n
			}), L({
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
	let u = e.review?.stats || {}, d = (0, p.useMemo)(() => [
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
			detail: `${An(u, ["positive", "positiveImpacts"])} positive`
		}
	], [
		e.dashboard?.briefings?.length,
		e.dashboard?.index?.count,
		e.dashboard?.index?.newsCount,
		e.review?.date,
		e.review?.keyCheckpoints?.length,
		e.review?.portfolioImpacts?.length,
		u
	]), f = (e.review?.keyCheckpoints || []).slice(0, 5), h = (e.review?.portfolioImpacts || []).slice(0, 5), g = (e.review?.recentReports || e.dashboard?.briefings || []).slice(0, 5);
	return /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "react-dashboard",
		"data-react-dashboard": !0,
		children: [
			/* @__PURE__ */ (0, m.jsx)(He, {
				eyebrow: "Investment Review",
				title: "대시보드",
				description: "시장 상태와 투자 체크포인트를 한 화면에서 점검합니다.",
				actions: /* @__PURE__ */ (0, m.jsx)("button", {
					type: "button",
					onClick: c,
					disabled: n,
					children: n ? "불러오는 중" : "새로고침"
				})
			}),
			o && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "react-dashboard-error",
				children: o
			}),
			e.review?.stale && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "react-dashboard-warning",
				children: "저장된 최신 투자 리뷰를 표시 중입니다."
			}),
			/* @__PURE__ */ (0, m.jsx)("section", {
				className: "react-dashboard-stats",
				"aria-label": "Dashboard summary",
				children: d.map((e) => /* @__PURE__ */ (0, m.jsxs)("article", { children: [
					/* @__PURE__ */ (0, m.jsx)("span", { children: e.label }),
					/* @__PURE__ */ (0, m.jsx)("strong", { children: e.value }),
					/* @__PURE__ */ (0, m.jsx)("small", { children: e.detail })
				] }, e.label))
			}),
			/* @__PURE__ */ (0, m.jsxs)("section", {
				className: "react-dashboard-grid",
				children: [
					/* @__PURE__ */ (0, m.jsx)(Mn, {}),
					/* @__PURE__ */ (0, m.jsxs)("article", {
						className: "react-dashboard-panel wide",
						children: [
							/* @__PURE__ */ (0, m.jsxs)("div", {
								className: "react-dashboard-panel-head",
								children: [/* @__PURE__ */ (0, m.jsx)("p", {
									className: "section-kicker",
									children: "Investment Review"
								}), /* @__PURE__ */ (0, m.jsx)("span", { children: e.review?.generatedAt || "not generated" })]
							}),
							/* @__PURE__ */ (0, m.jsx)("h2", { children: "투자 리뷰 요약" }),
							/* @__PURE__ */ (0, m.jsx)("p", { children: e.review?.summary || "아직 표시할 투자 리뷰 요약이 없습니다." }),
							/* @__PURE__ */ (0, m.jsx)("div", {
								className: "react-dashboard-actions",
								children: /* @__PURE__ */ (0, m.jsx)("button", {
									type: "button",
									onClick: l,
									disabled: i,
									children: i ? "리뷰 생성 중" : "투자 리뷰 갱신"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, m.jsxs)("article", {
						className: "react-dashboard-panel",
						children: [
							/* @__PURE__ */ (0, m.jsxs)("div", {
								className: "react-dashboard-panel-head",
								children: [/* @__PURE__ */ (0, m.jsx)("p", {
									className: "section-kicker",
									children: "Reports"
								}), /* @__PURE__ */ (0, m.jsx)("span", { children: g.length })]
							}),
							/* @__PURE__ */ (0, m.jsx)("h2", { children: "최근 보고서" }),
							/* @__PURE__ */ (0, m.jsx)("ul", { children: g.length ? g.map((e, t) => /* @__PURE__ */ (0, m.jsxs)("li", { children: [/* @__PURE__ */ (0, m.jsx)("strong", { children: e.title || "제목 없음" }), /* @__PURE__ */ (0, m.jsx)("span", { children: e.type || e.date || "" })] }, `${e.title || "report"}-${t}`)) : /* @__PURE__ */ (0, m.jsx)("li", { children: "최근 보고서가 없습니다." }) })
						]
					}),
					/* @__PURE__ */ (0, m.jsxs)("article", {
						className: "react-dashboard-panel",
						children: [
							/* @__PURE__ */ (0, m.jsxs)("div", {
								className: "react-dashboard-panel-head",
								children: [/* @__PURE__ */ (0, m.jsx)("p", {
									className: "section-kicker",
									children: "Checkpoints"
								}), /* @__PURE__ */ (0, m.jsx)("span", { children: f.length })]
							}),
							/* @__PURE__ */ (0, m.jsx)("h2", { children: "이번 주 체크포인트" }),
							/* @__PURE__ */ (0, m.jsx)("ul", { children: f.length ? f.map((e, t) => /* @__PURE__ */ (0, m.jsx)("li", { children: typeof e == "string" ? e : e.checkpoint || "체크포인트" }, t)) : /* @__PURE__ */ (0, m.jsx)("li", { children: "체크포인트가 없습니다." }) })
						]
					}),
					/* @__PURE__ */ (0, m.jsxs)("article", {
						className: "react-dashboard-panel",
						children: [
							/* @__PURE__ */ (0, m.jsxs)("div", {
								className: "react-dashboard-panel-head",
								children: [/* @__PURE__ */ (0, m.jsx)("p", {
									className: "section-kicker",
									children: "Portfolio"
								}), /* @__PURE__ */ (0, m.jsx)("span", { children: h.length })]
							}),
							/* @__PURE__ */ (0, m.jsx)("h2", { children: "포트폴리오 영향" }),
							/* @__PURE__ */ (0, m.jsx)("ul", { children: h.length ? h.map((e, t) => /* @__PURE__ */ (0, m.jsxs)("li", { children: [/* @__PURE__ */ (0, m.jsx)("strong", { children: jn(e) }), /* @__PURE__ */ (0, m.jsx)("span", { children: Tn[e.impact || ""] || e.impact || "중립" })] }, `${jn(e)}-${t}`)) : /* @__PURE__ */ (0, m.jsx)("li", { children: "포트폴리오 영향 항목이 없습니다." }) })
						]
					}),
					/* @__PURE__ */ (0, m.jsx)("article", {
						className: "react-dashboard-panel wide",
						children: /* @__PURE__ */ (0, m.jsx)(wn, {})
					})
				]
			})
		]
	});
}
//#endregion
//#region src/app/DeepResearchRoute.tsx
var Pn = [
	{
		key: "exchange_rate",
		label: "환율"
	},
	{
		key: "interest_rate",
		label: "금리"
	},
	{
		key: "earnings",
		label: "기업실적"
	},
	{
		key: "weekly_market",
		label: "주간 시황"
	},
	{
		key: "industry_trend",
		label: "산업 동향"
	},
	{
		key: "custom",
		label: "직접입력"
	}
], Fn = Object.fromEntries(Pn.map((e) => [e.key, e.label]));
function In(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function Ln(e) {
	let t = e;
	return !!(t?.id && ["queued", "running"].includes(t.status));
}
async function Rn(e) {
	let t = e;
	for (; ["queued", "running"].includes(t.status);) await In(1e3), t = await F(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "딥 리서치 생성에 실패했습니다.");
	return t;
}
function zn(e = "", t = "딥 리서치") {
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
function Bn(e) {
	return e.topicLabel || e.topicKey || "딥 리서치";
}
function Vn(e) {
	let t = String(e.topicKey || "").trim();
	return Fn[t] || t || "기타";
}
function Hn(e) {
	return e ? e.slice(0, 10) || e : "날짜 미상";
}
function Un(e) {
	return [e.source, e.date].filter(Boolean).join(" · ");
}
function Wn(e) {
	return e.title || e.url || e.path || "자료";
}
function Gn(e) {
	window.location.hash = e ? `#/deep-research/${encodeURIComponent(e)}` : "#/deep-research";
}
function Kn() {
	let e = window.location.hash.match(/^#\/?deep-research\/(.+)$/);
	return e ? decodeURIComponent(e[1]) : "";
}
function qn() {
	return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "deep-research";
}
function Jn() {
	let [e, t] = (0, p.useState)([]), [n, r] = (0, p.useState)(null), [i, a] = (0, p.useState)(() => Kn()), [o, s] = (0, p.useState)("exchange_rate"), [c, l] = (0, p.useState)(""), [u, d] = (0, p.useState)(""), [f, h] = (0, p.useState)(!1), [g, _] = (0, p.useState)(!1), [v, y] = (0, p.useState)(!1), [b, x] = (0, p.useState)(""), [S, C] = (0, p.useState)(""), [w, T] = (0, p.useState)(""), E = (0, p.useCallback)(async () => {
		_(!0), C("");
		try {
			let e = await F("/api/topic-reports");
			t(Array.isArray(e) ? e : []), L({
				surface: "topic_report",
				viewId: "topicrpt",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			C(e instanceof Error ? e.message : "딥 리서치 목록을 불러오지 못했습니다.");
		} finally {
			_(!1);
		}
	}, []);
	(0, p.useEffect)(() => {
		E();
	}, [E]), (0, p.useEffect)(() => {
		let e = () => {
			qn() && a(Kn());
		};
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []), (0, p.useEffect)(() => {
		let e = !0;
		async function t(t) {
			_(!0), C("");
			try {
				let n = await F(`/api/topic-reports/${encodeURIComponent(t)}?includePersonal=true`);
				if (!e) return;
				r(n), L({
					surface: "topic_report_reader",
					viewId: "topicrpt",
					reportKind: "topic_report",
					reportId: n.id || t
				});
			} catch (t) {
				if (!e) return;
				r(null), C(t instanceof Error ? t.message : "저장된 딥 리서치를 열지 못했습니다.");
			} finally {
				e && _(!1);
			}
		}
		return i ? t(i) : (r(null), L({
			surface: "topic_report",
			viewId: "topicrpt",
			reportKind: "",
			reportId: ""
		})), () => {
			e = !1;
		};
	}, [i]);
	async function D(e) {
		if (e.preventDefault(), o === "custom" && !c.trim()) {
			C("직접입력 모드에서는 주제 이름을 입력하세요.");
			return;
		}
		y(!0), C(""), T("딥 리서치를 생성하는 중입니다.");
		try {
			let e = await I("/api/topic-reports", {
				topicKey: o,
				customLabel: c.trim(),
				userContext: u.trim(),
				deepResearch: f
			}), t;
			if (Ln(e)) {
				let n = await Rn(e), r = n.result?.reportId || n.result?.artifactId || "";
				if (!r) throw Error("생성된 보고서 ID를 확인하지 못했습니다.");
				t = await F(`/api/topic-reports/${encodeURIComponent(r)}?includePersonal=true`);
			} else t = e;
			await E(), T("딥 리서치를 생성하고 자동 저장했습니다."), r(t), t.id && Gn(t.id);
		} catch (e) {
			C(e instanceof Error ? e.message : "딥 리서치 생성에 실패했습니다."), T("");
		} finally {
			y(!1);
		}
	}
	async function O(e) {
		if (e.id && window.confirm(`${Bn(e)} 보고서를 삭제할까요?`)) {
			x(`delete-${e.id}`), C("");
			try {
				let t = await fetch(`/api/topic-reports/${encodeURIComponent(e.id)}`, { method: "DELETE" });
				if (!t.ok) throw Error(`삭제 실패: ${t.status}`);
				n?.id === e.id && Gn(), await E(), T("저장된 딥 리서치를 삭제했습니다.");
			} catch (e) {
				C(e instanceof Error ? e.message : "보고서 삭제에 실패했습니다.");
			} finally {
				x("");
			}
		}
	}
	async function k(e) {
		if (n) {
			x(e), T(e === "notion" ? "Notion으로 내보내는 중..." : "Obsidian으로 내보내는 중...");
			try {
				let t = e === "notion" ? await I("/api/export-notion/topic-report", n) : await I("/api/export-obsidian/topic-report", n);
				T(e === "notion" ? `Notion으로 내보냈습니다${t.title ? `: ${t.title}` : ""}` : `Obsidian으로 내보냈습니다${t.topic || t.filename ? `: ${t.topic || t.filename}` : ""}`);
			} catch (e) {
				T(e instanceof Error ? e.message : "내보내기에 실패했습니다.");
			} finally {
				x("");
			}
		}
	}
	async function A() {
		if (n?.id) {
			x("overlay"), T("내 노트와 연결하는 중...");
			try {
				let e = await I(`/api/topic-reports/${encodeURIComponent(n.id)}/personal-overlay`, {});
				Ln(e) && await Rn(e);
				let t = await F(`/api/topic-reports/${encodeURIComponent(n.id)}?includePersonal=true`);
				r(t), T("내 노트와 연결했습니다.");
			} catch (e) {
				T(e instanceof Error ? e.message : "내 노트 연결에 실패했습니다.");
			} finally {
				x("");
			}
		}
	}
	let j = (0, p.useMemo)(() => {
		let t = /* @__PURE__ */ new Map();
		for (let n of e) {
			let e = Vn(n);
			t.has(e) || t.set(e, []), t.get(e)?.push(n);
		}
		return Array.from(t.entries()).map(([e, t]) => ({
			key: e,
			rows: t.sort((e, t) => String(t.generatedAt || t.date || "").localeCompare(String(e.generatedAt || e.date || "")))
		})).sort((e, t) => String(t.rows[0]?.generatedAt || t.rows[0]?.date || "").localeCompare(String(e.rows[0]?.generatedAt || e.rows[0]?.date || "")));
	}, [e]), M = zn(n?.markdown || "", Bn(n || {})), ee = n?.sources || [];
	return n ? /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "react-deep-research-route",
		"data-deep-research-route": !0,
		children: [S && /* @__PURE__ */ (0, m.jsx)("p", {
			className: "react-dashboard-error",
			children: S
		}), /* @__PURE__ */ (0, m.jsxs)(Ve, {
			eyebrow: `DEEP RESEARCH${n.date ? ` · ${n.date}` : ""}`,
			title: M.title,
			meta: `${Bn(n)} · 뉴스 ${n.docCount || 0}건 · 내러티브 ${n.memoryCount || 0}건`,
			agentContext: {
				surface: "topic_report_reader",
				viewId: "topicrpt",
				reportKind: "topic_report",
				reportId: n.id || "",
				topic: Bn(n)
			},
			breadcrumb: /* @__PURE__ */ (0, m.jsxs)(m.Fragment, { children: [/* @__PURE__ */ (0, m.jsx)("button", {
				type: "button",
				onClick: () => Gn(),
				children: "딥 리서치"
			}), /* @__PURE__ */ (0, m.jsx)("span", { children: M.title })] }),
			onClose: () => Gn(),
			actionSlot: /* @__PURE__ */ (0, m.jsxs)(m.Fragment, { children: [
				/* @__PURE__ */ (0, m.jsx)(be, {
					title: "AI",
					children: /* @__PURE__ */ (0, m.jsx)(xe, {
						icon: "agent",
						onClick: () => R({
							surface: "topic_report_reader",
							reportKind: "topic_report",
							reportId: n.id || "",
							topic: Bn(n),
							message: `${M.title}의 핵심 결론, 반대 근거, 더 발전시킬 분석 방향을 정리해줘.`,
							autoSubmit: !0
						}),
						children: "Agent에게 묻기"
					})
				}),
				/* @__PURE__ */ (0, m.jsx)(be, {
					title: "노트",
					children: /* @__PURE__ */ (0, m.jsx)(xe, {
						icon: "link",
						disabled: b === "overlay" || !n.id,
						onClick: A,
						children: b === "overlay" ? "연결 중" : "내 노트와 연결"
					})
				}),
				/* @__PURE__ */ (0, m.jsxs)(be, {
					title: "내보내기",
					children: [/* @__PURE__ */ (0, m.jsx)(xe, {
						icon: "notion",
						disabled: b === "notion",
						onClick: () => k("notion"),
						children: b === "notion" ? "내보내는 중" : "Notion으로 내보내기"
					}), /* @__PURE__ */ (0, m.jsx)(xe, {
						icon: "obsidian",
						disabled: b === "obsidian",
						onClick: () => k("obsidian"),
						children: b === "obsidian" ? "내보내는 중" : "Obsidian으로 내보내기"
					})]
				}),
				n.generation?.message && /* @__PURE__ */ (0, m.jsx)("p", {
					className: "react-reader-status",
					children: n.generation.message
				}),
				w && /* @__PURE__ */ (0, m.jsx)("p", {
					className: "react-reader-status",
					children: w
				})
			] }),
			noteIdentity: {
				id: ze("topic", Bn(n)),
				noteType: "topic_review",
				title: Bn(n) ? `${Bn(n)} 리서치 노트` : "딥 리서치 노트",
				topic: Bn(n),
				label: Bn(n),
				reportKind: "topic_report",
				reportId: Bn(n),
				linkedReports: [M.title].filter(Boolean)
			},
			noteLinkedTitle: M.title,
			noteOverlayMarkdown: n.personalOverlay?.markdown || "",
			children: [/* @__PURE__ */ (0, m.jsx)(Oe, { markdown: M.body || n.markdown || "" }), ee.length > 0 && /* @__PURE__ */ (0, m.jsxs)("section", {
				className: "source-panel react-topic-sources",
				children: [/* @__PURE__ */ (0, m.jsx)("h4", { children: "참고자료" }), /* @__PURE__ */ (0, m.jsx)("div", {
					className: "sources",
					children: ee.map((e, t) => /* @__PURE__ */ (0, m.jsxs)("div", {
						className: "meta",
						children: [/* @__PURE__ */ (0, m.jsx)("span", { children: Un(e) }), e.url ? /* @__PURE__ */ (0, m.jsx)("a", {
							href: e.url,
							target: "_blank",
							rel: "noopener noreferrer",
							children: Wn(e)
						}) : /* @__PURE__ */ (0, m.jsx)("span", { children: Wn(e) })]
					}, `${Wn(e)}-${t}`))
				})]
			})]
		})]
	}) : /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "react-deep-research-route",
		"data-deep-research-route": !0,
		children: [
			/* @__PURE__ */ (0, m.jsx)(He, {
				eyebrow: "Deep Research",
				title: "딥 리서치",
				description: "환율, 금리, 기업실적, 주간 시황 등 특정 투자 질문을 근거 중심으로 분석합니다.",
				actions: /* @__PURE__ */ (0, m.jsx)("button", {
					className: "filter-btn clear",
					type: "button",
					onClick: E,
					disabled: g,
					children: g ? "불러오는 중" : "다시 읽기"
				})
			}),
			/* @__PURE__ */ (0, m.jsxs)("form", {
				className: "input-panel topicrpt-form",
				onSubmit: D,
				children: [
					/* @__PURE__ */ (0, m.jsxs)("div", {
						className: "input-panel-header",
						children: [/* @__PURE__ */ (0, m.jsx)("h3", { children: "리서치 주제 선택" }), /* @__PURE__ */ (0, m.jsx)("p", { children: "프리셋 주제를 선택하거나 직접 입력하세요. 추가 컨텍스트를 입력하면 리서치 품질이 크게 향상됩니다." })]
					}),
					/* @__PURE__ */ (0, m.jsx)("div", {
						className: "topicrpt-topic-row",
						children: /* @__PURE__ */ (0, m.jsxs)("div", {
							className: "topicrpt-preset-btns",
							children: [
								Pn.slice(0, -1).map((e) => /* @__PURE__ */ (0, m.jsx)("button", {
									className: `filter-btn topicrpt-preset${o === e.key ? " active" : ""}`,
									type: "button",
									"data-topic": e.key,
									onClick: () => s(e.key),
									children: e.label
								}, e.key)),
								/* @__PURE__ */ (0, m.jsx)("span", {
									className: "topicrpt-preset-sep",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, m.jsx)("button", {
									className: `filter-btn topicrpt-preset${o === "custom" ? " active" : ""}`,
									type: "button",
									"data-topic": "custom",
									onClick: () => s("custom"),
									children: "직접입력"
								})
							]
						})
					}),
					o === "custom" && /* @__PURE__ */ (0, m.jsx)("div", {
						className: "topicrpt-custom-row",
						children: /* @__PURE__ */ (0, m.jsxs)("label", {
							className: "field",
							children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "주제 이름" }), /* @__PURE__ */ (0, m.jsx)("input", {
								value: c,
								onChange: (e) => l(e.currentTarget.value),
								placeholder: "예: 반도체 섹터, 유가 전망, BOK 정책"
							})]
						})
					}),
					/* @__PURE__ */ (0, m.jsx)("div", {
						className: "topicrpt-context-row",
						children: /* @__PURE__ */ (0, m.jsxs)("label", {
							className: "field topicrpt-context-field",
							children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "추가 컨텍스트" }), /* @__PURE__ */ (0, m.jsx)("textarea", {
								value: u,
								onChange: (e) => d(e.currentTarget.value),
								rows: 4,
								placeholder: "예: BOK 기준금리 동결\n미국 고용지표 변화\nFed 점도표 수정"
							})]
						})
					}),
					/* @__PURE__ */ (0, m.jsxs)("div", {
						className: "topicrpt-action-row",
						children: [/* @__PURE__ */ (0, m.jsxs)("label", {
							className: "gen-option quality-option",
							children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "심층 모드" }), /* @__PURE__ */ (0, m.jsx)("input", {
								checked: f,
								onChange: (e) => h(e.currentTarget.checked),
								type: "checkbox"
							})]
						}), /* @__PURE__ */ (0, m.jsx)("button", {
							className: "filter-btn apply",
							type: "submit",
							disabled: v,
							children: v ? "생성 중" : "리서치 생성"
						})]
					})
				]
			}),
			S && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "react-dashboard-error",
				children: S
			}),
			w && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "react-dashboard-warning",
				children: w
			}),
			/* @__PURE__ */ (0, m.jsx)("div", {
				className: "section-head compact analysis-archive-head topicrpt-saved-panel",
				children: /* @__PURE__ */ (0, m.jsxs)("div", { children: [/* @__PURE__ */ (0, m.jsx)("h2", {
					className: "section-title",
					children: "저장된 리포트"
				}), /* @__PURE__ */ (0, m.jsx)("p", {
					className: "section-subtitle",
					children: "카드를 누르면 Notion식 리더 화면으로 열립니다."
				})] })
			}),
			/* @__PURE__ */ (0, m.jsx)("div", {
				className: "report-feed",
				children: j.length ? j.map((e) => /* @__PURE__ */ (0, m.jsxs)("section", {
					className: "report-feed-group",
					children: [/* @__PURE__ */ (0, m.jsxs)("div", {
						className: "report-feed-group-head",
						children: [/* @__PURE__ */ (0, m.jsx)("span", {
							className: "report-feed-group-name",
							children: e.key
						}), /* @__PURE__ */ (0, m.jsxs)("span", {
							className: "report-feed-group-meta",
							children: [
								e.rows.length,
								"건 · 최근 ",
								Hn(e.rows[0]?.generatedAt || e.rows[0]?.date)
							]
						})]
					}), /* @__PURE__ */ (0, m.jsx)("div", {
						className: "report-feed-group-cards",
						children: e.rows.map((e) => {
							let t = b === `delete-${e.id}`;
							return /* @__PURE__ */ (0, m.jsxs)("div", {
								className: "report-feed-card-wrap",
								children: [/* @__PURE__ */ (0, m.jsxs)("button", {
									className: "report-feed-card is-topic",
									type: "button",
									onClick: () => e.id && Gn(e.id),
									children: [
										/* @__PURE__ */ (0, m.jsx)("span", {
											className: "report-feed-card-meta",
											children: e.mode && /* @__PURE__ */ (0, m.jsx)("span", {
												className: "report-feed-badge",
												children: String(e.mode).toUpperCase()
											})
										}),
										/* @__PURE__ */ (0, m.jsx)("strong", { children: Bn(e) }),
										/* @__PURE__ */ (0, m.jsx)("span", {
											className: "report-feed-card-foot",
											children: Hn(e.date || e.generatedAt)
										})
									]
								}), /* @__PURE__ */ (0, m.jsx)("button", {
									type: "button",
									className: "report-feed-card-delete",
									disabled: t,
									onClick: () => O(e),
									"aria-label": `${Bn(e)} 삭제`,
									"data-tooltip": "삭제",
									children: /* @__PURE__ */ (0, m.jsx)("svg", {
										width: "13",
										height: "13",
										viewBox: "0 0 16 16",
										fill: "none",
										stroke: "currentColor",
										strokeWidth: "1.4",
										strokeLinecap: "round",
										strokeLinejoin: "round",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, m.jsx)("path", { d: "M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" })
									})
								})]
							}, e.id || `${Bn(e)}-${e.date}`);
						})
					})]
				}, e.key)) : /* @__PURE__ */ (0, m.jsx)("div", {
					className: "report-feed-empty",
					children: "저장된 딥 리서치가 없습니다. 위에서 리서치를 생성하세요."
				})
			})
		]
	});
}
//#endregion
//#region src/app/HomeModeChooser.tsx
function Yn({ onChoose: e }) {
	return /* @__PURE__ */ (0, m.jsx)("div", {
		className: "home-mode-chooser-backdrop",
		children: /* @__PURE__ */ (0, m.jsxs)("section", {
			className: "home-mode-chooser",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "home-mode-chooser-title",
			"aria-describedby": "home-mode-chooser-description",
			children: [
				/* @__PURE__ */ (0, m.jsx)("p", {
					className: "section-kicker",
					children: "Choose your Home"
				}),
				/* @__PURE__ */ (0, m.jsx)("h2", {
					id: "home-mode-chooser-title",
					children: "어떤 방식으로 시작할까요?"
				}),
				/* @__PURE__ */ (0, m.jsx)("p", {
					id: "home-mode-chooser-description",
					children: "두 화면은 같은 Agent 대화와 리서치 데이터를 사용합니다. 설정에서 언제든 바꿀 수 있습니다."
				}),
				/* @__PURE__ */ (0, m.jsxs)("div", {
					className: "home-mode-chooser-options",
					children: [/* @__PURE__ */ (0, m.jsxs)("button", {
						type: "button",
						className: "home-mode-option is-recommended",
						onClick: () => e("office"),
						children: [
							/* @__PURE__ */ (0, m.jsx)("span", { children: "기본 선택" }),
							/* @__PURE__ */ (0, m.jsx)("strong", { children: "Pixel Office" }),
							/* @__PURE__ */ (0, m.jsx)("small", { children: "자료, 보고서, Agent 작업 상태를 한 장면에서 확인합니다." })
						]
					}), /* @__PURE__ */ (0, m.jsxs)("button", {
						type: "button",
						className: "home-mode-option",
						onClick: () => e("home"),
						children: [
							/* @__PURE__ */ (0, m.jsx)("span", { children: "Text workspace" }),
							/* @__PURE__ */ (0, m.jsx)("strong", { children: "Agent Home" }),
							/* @__PURE__ */ (0, m.jsx)("small", { children: "질문과 대화, 빠른 실행에 집중한 기존 화면입니다." })
						]
					})]
				})
			]
		})
	});
}
//#endregion
//#region src/app/MarketMemoryRoute.tsx
function Xn(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function Zn() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function Qn(e) {
	return e.snapshot?.headline ? e.message || `시장 상태 스냅샷을 저장했습니다: ${e.snapshot.headline}` : e.snapshotId || e.title ? e.message || `시장 상태 스냅샷을 저장했습니다${e.title ? `: ${e.title}` : ""}` : `${e.message || (e.ok ? "시장 내러티브를 정리했습니다." : "시장 내러티브 정리가 완료되었습니다.")}${Number.isFinite(Number(e.savedCount)) ? ` 저장 ${e.savedCount}건` : ""}${e.estimatedInputTokens ? ` · 입력 약 ${e.estimatedInputTokens} tokens` : ""}${e.rawEntryCount === void 0 ? "" : ` · 응답 ${e.rawEntryCount}건 · 제외 ${e.droppedCount || 0}건`}`;
}
function $n(e) {
	let t = e;
	return !!(t?.id && ["queued", "running"].includes(t.status));
}
async function er(e) {
	let t = e;
	for (; ["queued", "running"].includes(t.status);) await Xn(1e3), t = await fetch(`/api/jobs/${encodeURIComponent(t.id)}`).then((e) => {
		if (!e.ok) throw Error(`/api/jobs/${encodeURIComponent(t.id)} failed: ${e.status}`);
		return e.json();
	});
	if (t.status !== "done") throw Error(t.message || t.error || "시장 내러티브 정리에 실패했습니다.");
	return t;
}
async function tr() {
	let e = await I("/api/memory/update", { date: Zn() });
	return $n(e) ? (await er(e)).result || {} : e;
}
function nr() {
	let [e, t] = (0, p.useState)(0), [n, r] = (0, p.useState)(!1), [i, a] = (0, p.useState)(""), [o, s] = (0, p.useState)("");
	async function c() {
		r(!0), s(""), a("AI Agent가 단기 뉴스와 기존 중기 메모리를 업데이트하는 중입니다.");
		try {
			a("시장 메모리와 화면용 시장 상태를 함께 갱신하는 중입니다.");
			let e = await tr();
			if (e.ok === !1) throw Error(e.message || e.status || "시장 메모리 업데이트에 실패했습니다.");
			a(`시장 메모리를 업데이트했습니다. ${Qn(e)}`), t((e) => e + 1);
		} catch (e) {
			s(e instanceof Error ? e.message : "시장 메모리 업데이트에 실패했습니다."), a("");
		} finally {
			r(!1);
		}
	}
	return /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "react-market-memory-route",
		"data-market-memory-route": !0,
		children: [
			/* @__PURE__ */ (0, m.jsx)(He, {
				eyebrow: "Market Memory",
				title: "시장 내러티브",
				description: "단기 뉴스 흐름을 중기 시장 상황으로 압축해 투자 판단의 배경으로 유지합니다."
			}),
			o && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "react-dashboard-error",
				children: o
			}),
			i && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "react-dashboard-warning",
				children: i
			}),
			/* @__PURE__ */ (0, m.jsx)("section", {
				className: "market-state-dashboard react-market-memory-dashboard",
				"aria-label": "현재 중기 시장 상황",
				children: /* @__PURE__ */ (0, m.jsx)(wn, {
					onUpdate: c,
					updating: n
				}, e)
			})
		]
	});
}
//#endregion
//#region src/app/homePreference.ts
var rr = "folio.homePreference.v1", ir = "folio.agentCharacter.v1", ar = "folio.motionPreference.v1", or = "folio:ui-preferences-updated", sr = {
	home: {
		mode: "office",
		choiceSeen: !1
	},
	character: {
		preset: "classic",
		name: ""
	},
	motion: "system"
};
function cr(e) {
	if (typeof window > "u") return "";
	try {
		return window.localStorage.getItem(e) || "";
	} catch {
		return "";
	}
}
function lr(e) {
	if (!e) return {};
	try {
		let t = JSON.parse(e);
		return t && typeof t == "object" && !Array.isArray(t) ? t : {};
	} catch {
		return {};
	}
}
function ur() {
	let e = lr(cr(rr)), t = lr(cr(ir)), n = cr(ar);
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
function dr(e, t) {
	if (!(typeof window > "u")) try {
		window.localStorage.setItem(e, typeof t == "string" ? t : JSON.stringify(t));
	} catch {}
}
function fr(e) {
	typeof window > "u" || window.dispatchEvent(new CustomEvent(or, { detail: e }));
}
function pr(e) {
	return dr(rr, e.home), dr(ir, e.character), dr(ar, e.motion), fr(e), e;
}
function mr() {
	if (typeof window < "u") try {
		window.localStorage.removeItem(rr), window.localStorage.removeItem(ir), window.localStorage.removeItem(ar);
	} catch {}
	let e = structuredClone(sr);
	return fr(e), e;
}
function hr(e = ur()) {
	return e.home.mode;
}
function gr() {
	let [e, t] = (0, p.useState)(() => ur());
	(0, p.useEffect)(() => {
		let e = (e) => {
			let n = e.detail;
			t(n || ur());
		}, n = () => t(ur());
		return window.addEventListener(or, e), window.addEventListener("storage", n), () => {
			window.removeEventListener(or, e), window.removeEventListener("storage", n);
		};
	}, []);
	function n(e) {
		t(e), pr(e);
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
			let e = mr();
			t(e);
		}
	};
}
//#endregion
//#region src/app/pixelOffice/MobileAgentScene.tsx
function _r({ character: e, status: t }) {
	return /* @__PURE__ */ (0, m.jsxs)("section", {
		className: "mobile-agent-scene",
		"aria-label": `현재 Agent 상태: ${t}`,
		children: [/* @__PURE__ */ (0, m.jsx)("div", { children: e }), /* @__PURE__ */ (0, m.jsxs)("span", { children: [/* @__PURE__ */ (0, m.jsx)("small", { children: "Agent status" }), /* @__PURE__ */ (0, m.jsx)("strong", { children: t })] })]
	});
}
//#endregion
//#region src/app/pixelOffice/MobileOfficeCards.tsx
function vr({ objects: e, onSelect: t }) {
	let n = new Map(e.map((e) => [e.id, e]));
	return /* @__PURE__ */ (0, m.jsx)("section", {
		className: "mobile-office-cards",
		"aria-label": "Office 상태 목록",
		children: r.map((e) => {
			let r = n.get(e.id);
			return /* @__PURE__ */ (0, m.jsxs)("button", {
				type: "button",
				"data-state": r.state,
				onClick: () => t(e.id),
				children: [
					/* @__PURE__ */ (0, m.jsx)("span", {
						className: "mobile-office-card-symbol",
						"aria-hidden": "true",
						children: e.symbol
					}),
					/* @__PURE__ */ (0, m.jsxs)("span", { children: [
						/* @__PURE__ */ (0, m.jsx)("small", { children: e.shortLabel }),
						/* @__PURE__ */ (0, m.jsx)("strong", { children: e.label }),
						/* @__PURE__ */ (0, m.jsx)("span", { children: r.summary })
					] }),
					/* @__PURE__ */ (0, m.jsx)("i", {
						"aria-hidden": "true",
						children: "›"
					})
				]
			}, e.id);
		})
	});
}
//#endregion
//#region src/app/pixelOffice/AgentAttentionBar.tsx
function yr({ items: e, onAcknowledge: t, onAcknowledgeAll: n, onOpenAgent: r }) {
	return e.length ? /* @__PURE__ */ (0, m.jsxs)("section", {
		className: "office-attention",
		"aria-label": "확인이 필요한 Agent 알림",
		"aria-live": "polite",
		children: [/* @__PURE__ */ (0, m.jsxs)("header", { children: [/* @__PURE__ */ (0, m.jsxs)("strong", { children: [
			"확인할 항목 ",
			e.length,
			"건"
		] }), /* @__PURE__ */ (0, m.jsx)("button", {
			type: "button",
			onClick: n,
			children: "모두 확인"
		})] }), e.slice(0, 3).map((e) => /* @__PURE__ */ (0, m.jsxs)("div", {
			"data-tone": e.tone,
			children: [/* @__PURE__ */ (0, m.jsx)("button", {
				type: "button",
				onClick: r,
				children: e.label
			}), /* @__PURE__ */ (0, m.jsx)("button", {
				type: "button",
				onClick: () => t(e.id),
				"aria-label": `${e.label} 확인 처리`,
				children: "×"
			})]
		}, e.id))]
	}) : null;
}
//#endregion
//#region src/app/pixelOffice/characterPresets.ts
var br = [{
	id: "classic",
	label: "클래식 애널리스트",
	asset: "/pixel-office/characters/classic/neutral-front-v3.png?v=sd-classic-3",
	fallbackAsset: "/pixel-office/characters/classic.png?v=pdf-faithful-2",
	layout: "single",
	alt: "네이비 스리피스 수트 차림의 금발 클래식 애널리스트"
}, {
	id: "student",
	label: "경제 탐구생",
	asset: "/pixel-office/characters/student.png?v=pdf-faithful-2",
	layout: "sheet",
	alt: "네이비 아카데미 복장으로 의자에 앉은 경제 탐구생"
}];
function xr(e) {
	return br.find((t) => t.id === e) || br[0];
}
//#endregion
//#region src/app/pixelOffice/AgentCharacter.tsx
function Sr({ presetId: e, name: t, activity: n, motion: r }) {
	let i = xr(e), [a, o] = (0, p.useState)(!1);
	if ((0, p.useEffect)(() => o(!1), [i.asset]), a) return /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "agent-character-fallback",
		"data-preset": i.id,
		role: "img",
		"aria-label": `${t || i.label}: ${n.label}`,
		children: [/* @__PURE__ */ (0, m.jsx)("span", {}), /* @__PURE__ */ (0, m.jsx)("strong", { children: t || i.label })]
	});
	let s = r === "reduced" && n.kind === "ambient" ? 0 : n.frame, c = s % 4, l = Math.floor(s / 4), u = i.layout === "single";
	return /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "agent-character",
		role: "img",
		"aria-label": `${t || i.alt}: ${n.label}`,
		children: [
			/* @__PURE__ */ (0, m.jsx)("img", {
				src: i.asset,
				alt: "",
				onError: () => o(!0),
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, m.jsx)("span", {
				className: `agent-character-sprite${u ? " is-single-frame" : ""}`,
				style: {
					backgroundImage: `url("${i.asset}")`,
					backgroundPosition: u ? "center bottom" : `${c * 33.3333}% ${l * 100}%`,
					backgroundSize: u ? "contain" : "400% 200%"
				},
				"data-frame": s,
				"data-activity": n.kind,
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, m.jsx)("strong", { children: t || i.label }),
			/* @__PURE__ */ (0, m.jsx)("small", { children: n.label })
		]
	});
}
//#endregion
//#region src/app/pixelOffice/AgentWorkspacePanel.tsx
function Cr({ workspace: e }) {
	return /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "office-agent-workspace",
		children: [
			/* @__PURE__ */ (0, m.jsx)("p", {
				className: "office-agent-note",
				children: "Agent Home과 같은 대화·모델·첨부·proposal 상태를 사용합니다."
			}),
			/* @__PURE__ */ (0, m.jsx)(h, { workspace: e }),
			/* @__PURE__ */ (0, m.jsx)(P, { workspace: e }),
			/* @__PURE__ */ (0, m.jsx)(k, { workspace: e })
		]
	});
}
//#endregion
//#region src/app/pixelOffice/ObjectStatusPanel.tsx
function wr(e) {
	if (!e) return "기준 시각 없음";
	try {
		return new Intl.DateTimeFormat("ko-KR", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit"
		}).format(new Date(e));
	} catch {
		return e.slice(0, 19);
	}
}
function Tr({ definition: e, status: t, workspace: n }) {
	return /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "office-panel-body",
		children: [
			/* @__PURE__ */ (0, m.jsxs)("section", {
				className: "office-panel-summary",
				children: [
					/* @__PURE__ */ (0, m.jsx)("span", {
						"data-state": t.state,
						children: t.state
					}),
					/* @__PURE__ */ (0, m.jsx)("strong", { children: t.summary }),
					t.notice && /* @__PURE__ */ (0, m.jsx)("p", { children: t.notice })
				]
			}),
			/* @__PURE__ */ (0, m.jsxs)("dl", {
				className: "office-panel-facts",
				children: [
					/* @__PURE__ */ (0, m.jsxs)("div", { children: [/* @__PURE__ */ (0, m.jsx)("dt", { children: "Source" }), /* @__PURE__ */ (0, m.jsx)("dd", { children: e.source })] }),
					/* @__PURE__ */ (0, m.jsxs)("div", { children: [/* @__PURE__ */ (0, m.jsx)("dt", { children: "As of" }), /* @__PURE__ */ (0, m.jsx)("dd", { children: wr(t.asOf) })] }),
					/* @__PURE__ */ (0, m.jsxs)("div", { children: [/* @__PURE__ */ (0, m.jsx)("dt", { children: "Count" }), /* @__PURE__ */ (0, m.jsx)("dd", { children: t.count.toLocaleString("ko-KR") })] }),
					/* @__PURE__ */ (0, m.jsxs)("div", { children: [/* @__PURE__ */ (0, m.jsx)("dt", { children: "Freshness" }), /* @__PURE__ */ (0, m.jsx)("dd", { children: t.stale ? "업데이트 필요" : "현재 상태" })] })
				]
			}),
			/* @__PURE__ */ (0, m.jsxs)("div", {
				className: "office-panel-actions",
				children: [
					e.id === "news_desk" && /* @__PURE__ */ (0, m.jsx)("button", {
						type: "button",
						onClick: () => n.runQuickAction("rss"),
						children: "RSS 수집 실행"
					}),
					e.id === "research_desk" && /* @__PURE__ */ (0, m.jsx)("button", {
						type: "button",
						onClick: () => n.runQuickAction("analysis"),
						children: "기업 분석 열기"
					}),
					e.id === "report_shelf" && /* @__PURE__ */ (0, m.jsx)("button", {
						type: "button",
						onClick: () => n.runQuickAction("briefing"),
						children: "오늘 브리핑 생성"
					}),
					/* @__PURE__ */ (0, m.jsx)("button", {
						type: "button",
						onClick: () => {
							window.location.hash = e.route;
						},
						children: "자세히 보기"
					})
				]
			})
		]
	});
}
//#endregion
//#region src/app/pixelOffice/ReportShelfPanel.tsx
function Er({ definition: e, status: t, workspace: n }) {
	return /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "office-panel-body",
		children: [
			/* @__PURE__ */ (0, m.jsxs)("section", {
				className: "office-panel-summary",
				children: [
					/* @__PURE__ */ (0, m.jsx)("span", {
						"data-state": t.state,
						children: t.state
					}),
					/* @__PURE__ */ (0, m.jsx)("strong", { children: t.summary }),
					/* @__PURE__ */ (0, m.jsxs)("p", { children: [
						e.source,
						" · ",
						t.asOf ? `최근 생성 ${t.asOf.slice(0, 10)}` : "생성 시각 없음"
					] })
				]
			}),
			n.recentReports.length > 0 ? /* @__PURE__ */ (0, m.jsx)("div", {
				className: "office-report-list",
				children: n.recentReports.map((e, t) => /* @__PURE__ */ (0, m.jsxs)("button", {
					type: "button",
					onClick: () => {
						window.location.hash = D(e);
					},
					children: [
						/* @__PURE__ */ (0, m.jsx)("small", { children: String(e.type || e.view || "REPORT").toUpperCase() }),
						/* @__PURE__ */ (0, m.jsx)("strong", { children: e.title || "제목 없음" }),
						/* @__PURE__ */ (0, m.jsx)("span", { children: e.date || "날짜 없음" })
					]
				}, O(e, t)))
			}) : /* @__PURE__ */ (0, m.jsx)("p", {
				className: "office-panel-empty",
				children: "최근 보고서가 없습니다. 브리핑이나 기업 분석을 생성하면 이곳에서 다시 열 수 있습니다."
			}),
			/* @__PURE__ */ (0, m.jsxs)("div", {
				className: "office-panel-actions",
				children: [/* @__PURE__ */ (0, m.jsx)("button", {
					type: "button",
					onClick: () => n.runQuickAction("briefing"),
					children: "오늘 브리핑 생성"
				}), /* @__PURE__ */ (0, m.jsx)("button", {
					type: "button",
					onClick: () => {
						window.location.hash = "#/briefing";
					},
					children: "보고서 목록"
				})]
			})
		]
	});
}
//#endregion
//#region src/app/pixelOffice/OfficeDetailPanel.tsx
var Dr = [
	"button:not([disabled])",
	"a[href]",
	"input:not([disabled])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	"[tabindex]:not([tabindex='-1'])"
].join(",");
function Or({ selectedId: e, status: n, workspace: r, onClose: i }) {
	let a = (0, p.useRef)(null), o = (0, p.useRef)(null);
	if ((0, p.useEffect)(() => {
		if (!e) return;
		o.current = document.activeElement instanceof HTMLElement ? document.activeElement : null, window.requestAnimationFrame(() => {
			a.current?.querySelector(Dr)?.focus();
		});
		let t = (e) => {
			if (e.key === "Escape") {
				e.preventDefault(), i();
				return;
			}
			if (e.key !== "Tab" || !a.current) return;
			let t = [...a.current.querySelectorAll(Dr)];
			if (!t.length) return;
			let n = t[0], r = t[t.length - 1];
			e.shiftKey && document.activeElement === n ? (e.preventDefault(), r.focus()) : !e.shiftKey && document.activeElement === r && (e.preventDefault(), n.focus());
		};
		return document.addEventListener("keydown", t), () => {
			document.removeEventListener("keydown", t), window.requestAnimationFrame(() => o.current?.focus());
		};
	}, [i, e]), !e || !n) return null;
	let s = t(e);
	return /* @__PURE__ */ (0, m.jsxs)("aside", {
		ref: a,
		className: "office-detail-panel",
		role: "dialog",
		"aria-modal": "true",
		"aria-labelledby": "office-detail-title",
		"data-panel-kind": s.panel,
		children: [/* @__PURE__ */ (0, m.jsxs)("header", {
			className: "office-detail-head",
			children: [/* @__PURE__ */ (0, m.jsxs)("div", { children: [
				/* @__PURE__ */ (0, m.jsx)("p", { children: s.shortLabel }),
				/* @__PURE__ */ (0, m.jsx)("h2", {
					id: "office-detail-title",
					children: s.label
				}),
				/* @__PURE__ */ (0, m.jsx)("span", { children: s.description })
			] }), /* @__PURE__ */ (0, m.jsx)("button", {
				type: "button",
				onClick: i,
				"aria-label": `${s.label} 상세 닫기`,
				children: "×"
			})]
		}), s.panel === "agent" ? /* @__PURE__ */ (0, m.jsx)(Cr, { workspace: r }) : s.panel === "reports" ? /* @__PURE__ */ (0, m.jsx)(Er, {
			definition: s,
			status: n,
			workspace: r
		}) : /* @__PURE__ */ (0, m.jsx)(Tr, {
			definition: s,
			status: n,
			workspace: r
		})]
	});
}
//#endregion
//#region src/app/pixelOffice/game/PixelOfficeSceneBoundary.tsx
var kr = class extends p.Component {
	state = { failed: !1 };
	static getDerivedStateFromError() {
		return { failed: !0 };
	}
	componentDidCatch(e, t) {
		console.error("Pixel Office scene failed; using CSS fallback.", e, t);
	}
	render() {
		return this.state.failed ? this.props.fallback : this.props.children;
	}
}, Ar = [
	{
		kind: "ambient",
		label: "경제 노트를 읽는 중",
		anchor: "agent_seat",
		frame: 1,
		working: !1,
		jobId: ""
	},
	{
		kind: "ambient",
		label: "시장 자료를 정리하는 중",
		anchor: "agent_seat",
		frame: 3,
		working: !1,
		jobId: ""
	},
	{
		kind: "ambient",
		label: "다음 질문을 기다리는 중",
		anchor: "agent_seat",
		frame: 0,
		working: !1,
		jobId: ""
	}
];
function jr(e) {
	return `${e.kind} ${e.label}`.toLowerCase().replace(/-/g, "_");
}
function Mr(e) {
	let t = jr(e);
	return /rss|index|evidence|intake/.test(t) ? {
		kind: "collecting",
		label: "새 자료를 수집하는 중",
		anchor: "news_desk",
		frame: 1,
		working: !0,
		jobId: e.id
	} : /topic|research|company|analysis|analy/.test(t) ? {
		kind: "analyzing",
		label: "리서치 근거를 분석하는 중",
		anchor: "research_desk",
		frame: 2,
		working: !0,
		jobId: e.id
	} : /briefing|report|proposal|write/.test(t) ? {
		kind: "writing",
		label: "보고서를 작성하는 중",
		anchor: "report_shelf",
		frame: 4,
		working: !0,
		jobId: e.id
	} : /agent|chat|companion/.test(t) ? {
		kind: "listening",
		label: "질문을 검토하고 답변하는 중",
		anchor: "agent_seat",
		frame: 4,
		working: !0,
		jobId: e.id
	} : {
		kind: "generic_work",
		label: "작업을 처리하는 중",
		anchor: "agent_seat",
		frame: 4,
		working: !0,
		jobId: e.id
	};
}
function Nr(e) {
	return Date.parse(e.finishedAt || e.updatedAt || e.createdAt || "") || 0;
}
function Pr(e, t = 0, n = 0, r = Date.now()) {
	let i = [...e].sort((e, t) => Nr(t) - Nr(e)), a = i.find((e) => e.status === "failed" && r - Nr(e) < 720 * 60 * 1e3);
	if (a || t > 0) return {
		kind: "error",
		label: a?.message || "확인이 필요한 작업이 있습니다.",
		anchor: "agent_seat",
		frame: 7,
		working: !1,
		jobId: a?.id || ""
	};
	let o = i.find((e) => e.status === "running");
	if (o) return Mr(o);
	let s = i.find((e) => e.status === "queued");
	if (s) return {
		...Mr(s),
		label: "다음 작업을 준비하는 중"
	};
	let c = i.find((e) => e.status === "done" && r - Nr(e) < 600 * 1e3);
	return c ? {
		kind: "complete",
		label: "작업을 완료했습니다.",
		anchor: "agent_seat",
		frame: 6,
		working: !1,
		jobId: c.id
	} : Ar[Math.abs(n) % Ar.length];
}
//#endregion
//#region src/app/pixelOffice/useAgentActivity.ts
function Fr(e, t, n) {
	let [r, i] = (0, p.useState)(0);
	return (0, p.useEffect)(() => {
		if (n === "reduced" || document.visibilityState === "hidden") return;
		let e = window.setInterval(() => {
			document.visibilityState !== "hidden" && i((e) => e + 1);
		}, 12e3);
		return () => window.clearInterval(e);
	}, [n]), (0, p.useMemo)(() => Pr(e, t, r), [
		r,
		t,
		e
	]);
}
//#endregion
//#region src/app/pixelOffice/useAgentAttention.ts
var Ir = "folio.pixelOffice.attention.v1";
function Lr() {
	try {
		let e = JSON.parse(window.localStorage.getItem(Ir) || "{}");
		return new Set(Array.isArray(e.ids) ? e.ids.filter((e) => typeof e == "string").slice(-100) : []);
	} catch {
		return /* @__PURE__ */ new Set();
	}
}
function Rr(e) {
	return Date.parse(e.finishedAt || e.updatedAt || e.createdAt || "") || 0;
}
function zr(e, t) {
	let [n, r] = (0, p.useState)(() => Lr()), i = (0, p.useMemo)(() => {
		let r = Date.now() - 720 * 60 * 1e3, i = e.filter((e) => ["done", "failed"].includes(e.status) && Rr(e) >= r).map((e) => ({
			id: `job:${e.id}`,
			kind: "job",
			tone: e.status === "failed" ? "error" : "success",
			label: e.status === "failed" ? `${e.label || "Agent 작업"} 실패 — 다시 확인해 주세요.` : `${e.label || "Agent 작업"} 완료`
		}));
		return [...t.filter((e) => e.proposal && e.proposalStatus === "pending").map((e) => ({
			id: `proposal:${e.proposal.id}`,
			kind: "proposal",
			tone: "approval",
			label: e.proposal?.summary || "검토할 수정 제안이 있습니다."
		})), ...i].filter((e) => !n.has(e.id));
	}, [
		n,
		e,
		t
	]);
	function a(e) {
		r(e);
		try {
			window.localStorage.setItem(Ir, JSON.stringify({
				version: 1,
				ids: [...e].slice(-100),
				updatedAt: (/* @__PURE__ */ new Date()).toISOString()
			}));
		} catch {}
	}
	return {
		items: i,
		acknowledge(e) {
			a(/* @__PURE__ */ new Set([...n, e]));
		},
		acknowledgeAll() {
			a(/* @__PURE__ */ new Set([...n, ...i.map((e) => e.id)]));
		}
	};
}
//#endregion
//#region src/app/pixelOffice/usePixelOffice.ts
function Br(e) {
	return Array.isArray(e) ? e.filter((e) => e && typeof e == "object").slice(0, 20).map((e) => {
		let t = e, n = String(t.status || ""), r = [
			"queued",
			"running",
			"done",
			"failed",
			"cancelled"
		].includes(n) ? n : "cancelled";
		return {
			id: String(t.id || "").slice(0, 80),
			kind: String(t.kind || "").slice(0, 80),
			label: String(t.label || "").slice(0, 120),
			status: r,
			progress: typeof t.progress == "number" ? Math.max(0, Math.min(100, t.progress)) : void 0,
			message: String(t.message || "").slice(0, 180),
			createdAt: String(t.createdAt || ""),
			updatedAt: String(t.updatedAt || ""),
			finishedAt: String(t.finishedAt || "")
		};
	}) : [];
}
function Vr(e) {
	let t = new Map((Array.isArray(e?.objects) ? e.objects : []).map((e) => [e.id, e])), n = a.map((e) => t.get(e)).filter(Boolean);
	if (e?.version !== 1 || n.length !== a.length) throw Error("Pixel Office 응답 형식이 올바르지 않습니다.");
	return {
		...e,
		objects: n
	};
}
function Hr() {
	let [e, t] = (0, p.useState)(null), [r, i] = (0, p.useState)([]), [a, o] = (0, p.useState)(!0), [s, c] = (0, p.useState)(""), [l, u] = (0, p.useState)(() => document.visibilityState !== "hidden"), d = (0, p.useRef)(""), f = (0, p.useCallback)(async () => {
		c("");
		try {
			let e = Vr(await F("/api/pixel-office"));
			t(e);
		} catch (e) {
			c(e instanceof Error ? e.message : "Office 상태를 불러오지 못했습니다.");
		} finally {
			o(!1);
		}
	}, []), m = (0, p.useCallback)(async () => {
		try {
			let e = Br(await F("/api/jobs"));
			i(e);
			let t = e.filter((e) => [
				"done",
				"failed",
				"cancelled"
			].includes(e.status)).slice(0, 4).map((e) => `${e.id}:${e.status}:${e.finishedAt}`).join("|");
			d.current && t !== d.current && f().catch(() => void 0), d.current = t;
		} catch {}
	}, [f]);
	(0, p.useEffect)(() => {
		f(), m();
	}, [f, m]), (0, p.useEffect)(() => {
		let e = () => u(document.visibilityState !== "hidden");
		return document.addEventListener("visibilitychange", e), () => document.removeEventListener("visibilitychange", e);
	}, []);
	let h = r.some((e) => e.status === "queued" || e.status === "running");
	return (0, p.useEffect)(() => {
		if (!l) return;
		let e = window.setInterval(m, h ? 2500 : 15e3);
		return () => window.clearInterval(e);
	}, [
		h,
		m,
		l
	]), (0, p.useEffect)(() => {
		if (!l) return;
		let e = window.setInterval(f, 6e4);
		return () => window.clearInterval(e);
	}, [f, l]), {
		payload: e,
		objects: e?.objects || n(a ? "loading" : "unavailable"),
		jobs: r,
		loading: a,
		error: s,
		refresh: f
	};
}
//#endregion
//#region src/app/PixelOfficeRoute.tsx
var Ur = (0, p.lazy)(() => import("./PixelOfficeGameScene-BD3lU_9s.js").then((e) => ({ default: e.PixelOfficeGameScene })));
function Wr() {
	let e = Hr(), t = ge("pixel_office"), n = gr(), [r, i] = (0, p.useState)(null), [a, o] = (0, p.useState)(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? !1);
	(0, p.useEffect)(() => {
		let e = window.matchMedia?.("(prefers-reduced-motion: reduce)");
		if (!e) return;
		let t = () => o(e.matches);
		return e.addEventListener("change", t), () => e.removeEventListener("change", t);
	}, []);
	let c = n.preferences.motion === "reduced" || a ? "reduced" : "system", l = zr(e.jobs, t.messages), u = +!!l.items.some((e) => e.tone !== "success"), d = Fr(e.jobs, u, c), f = (0, p.useCallback)(() => i(null), []), h = e.objects.find((e) => e.id === r) || null, g = n.preferences.character.name || (n.preferences.character.preset === "student" ? "경제 탐구생" : "클래식 애널리스트"), _ = /* @__PURE__ */ (0, m.jsx)(Sr, {
		presetId: n.preferences.character.preset,
		name: g,
		activity: d,
		motion: c
	}), v = /* @__PURE__ */ (0, m.jsx)(s, {
		objects: e.objects,
		selectedId: r,
		onSelect: i,
		character: _,
		characterAnchor: d.anchor
	});
	return /* @__PURE__ */ (0, m.jsxs)("div", {
		className: `pixel-office-route${r ? " has-panel" : ""}`,
		"data-pixel-office-route": !0,
		"data-motion": c,
		children: [
			/* @__PURE__ */ (0, m.jsxs)("header", {
				className: "pixel-office-intro",
				children: [/* @__PURE__ */ (0, m.jsxs)("div", { children: [
					/* @__PURE__ */ (0, m.jsx)("p", {
						className: "section-kicker",
						children: "Pixel Office"
					}),
					/* @__PURE__ */ (0, m.jsx)("h1", { children: "리서치 오피스" }),
					/* @__PURE__ */ (0, m.jsx)("p", { children: "자료의 freshness와 Agent 작업을 한 장면에서 확인합니다." })
				] }), /* @__PURE__ */ (0, m.jsxs)("div", {
					className: "pixel-office-intro-actions",
					children: [/* @__PURE__ */ (0, m.jsx)("button", {
						type: "button",
						onClick: () => e.refresh(),
						disabled: e.loading,
						children: e.loading ? "확인 중" : "상태 새로고침"
					}), /* @__PURE__ */ (0, m.jsx)(_e, { current: "office" })]
				})]
			}),
			e.error && /* @__PURE__ */ (0, m.jsxs)("div", {
				className: "pixel-office-error",
				role: "status",
				children: [/* @__PURE__ */ (0, m.jsx)("span", { children: e.error }), /* @__PURE__ */ (0, m.jsx)("button", {
					type: "button",
					onClick: () => e.refresh(),
					children: "다시 시도"
				})]
			}),
			/* @__PURE__ */ (0, m.jsx)(yr, {
				items: l.items,
				onAcknowledge: l.acknowledge,
				onAcknowledgeAll: l.acknowledgeAll,
				onOpenAgent: () => i("agent_seat")
			}),
			/* @__PURE__ */ (0, m.jsxs)("div", {
				className: "pixel-office-workspace",
				children: [/* @__PURE__ */ (0, m.jsxs)("div", {
					className: "pixel-office-primary",
					children: [
						/* @__PURE__ */ (0, m.jsx)(_r, {
							character: _,
							status: d.label
						}),
						/* @__PURE__ */ (0, m.jsx)(kr, {
							fallback: v,
							children: /* @__PURE__ */ (0, m.jsx)(p.Suspense, {
								fallback: v,
								children: /* @__PURE__ */ (0, m.jsx)(Ur, {
									objects: e.objects,
									selectedId: r,
									onSelect: i,
									activity: d,
									reducedMotion: c === "reduced",
									fallbackCharacter: _
								})
							})
						}),
						/* @__PURE__ */ (0, m.jsx)(vr, {
							objects: e.objects,
							onSelect: i
						})
					]
				}), /* @__PURE__ */ (0, m.jsx)(Or, {
					selectedId: r,
					status: h,
					workspace: t,
					onClose: f
				})]
			})
		]
	});
}
//#endregion
//#region src/app/ReactAgentDock.tsx
var Gr = /* @__PURE__ */ new Set([
	"codex",
	"claude",
	"antigravity"
]), Kr = {
	id: "welcome",
	role: "assistant",
	text: "현재 화면에 대해 물어보세요. 보고서 수정이나 발전 요청은 작업으로 전환해 처리합니다.",
	variant: "welcome",
	createdAt: (/* @__PURE__ */ new Date()).toISOString()
}, qr = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19.503 0H4.496A4.496 4.496 0 000 4.496v15.007A4.496 4.496 0 004.496 24h15.007A4.496 4.496 0 0024 19.503V4.496A4.496 4.496 0 0019.503 0z\" fill=\"#fff\"></path><path d=\"M9.064 3.344a4.578 4.578 0 012.285-.312c1 .115 1.891.54 2.673 1.275.01.01.024.017.037.021a.09.09 0 00.043 0 4.55 4.55 0 013.046.275l.047.022.116.057a4.581 4.581 0 012.188 2.399c.209.51.313 1.041.315 1.595a4.24 4.24 0 01-.134 1.223.123.123 0 00.03.115c.594.607.988 1.33 1.183 2.17.289 1.425-.007 2.71-.887 3.854l-.136.166a4.548 4.548 0 01-2.201 1.388.123.123 0 00-.081.076c-.191.551-.383 1.023-.74 1.494-.9 1.187-2.222 1.846-3.711 1.838-1.187-.006-2.239-.44-3.157-1.302a.107.107 0 00-.105-.024c-.388.125-.78.143-1.204.138a4.441 4.441 0 01-1.945-.466 4.544 4.544 0 01-1.61-1.335c-.152-.202-.303-.392-.414-.617a5.81 5.81 0 01-.37-.961 4.582 4.582 0 01-.014-2.298.124.124 0 00.006-.056.085.085 0 00-.027-.048 4.467 4.467 0 01-1.034-1.651 3.896 3.896 0 01-.251-1.192 5.189 5.189 0 01.141-1.6c.337-1.112.982-1.985 1.933-2.618.212-.141.413-.251.601-.33.215-.089.43-.164.646-.227a.098.098 0 00.065-.066 4.51 4.51 0 01.829-1.615 4.535 4.535 0 011.837-1.388zm3.482 10.565a.637.637 0 000 1.272h3.636a.637.637 0 100-1.272h-3.636zM8.462 9.23a.637.637 0 00-1.106.631l1.272 2.224-1.266 2.136a.636.636 0 101.095.649l1.454-2.455a.636.636 0 00.005-.64L8.462 9.23z\" fill=\"url(#folio-react-codex-gradient)\"></path><defs><linearGradient gradientUnits=\"userSpaceOnUse\" id=\"folio-react-codex-gradient\" x1=\"12\" x2=\"12\" y1=\"3\" y2=\"21\"><stop stop-color=\"#B1A7FF\"></stop><stop offset=\".5\" stop-color=\"#7A9DFF\"></stop><stop offset=\"1\" stop-color=\"#3941FF\"></stop></linearGradient></defs></svg>", Jr = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M9.064 3.344a4.578 4.578 0 012.285-.312c1 .115 1.891.54 2.673 1.275.01.01.024.017.037.021a.09.09 0 00.043 0 4.55 4.55 0 013.046.275l.047.022.116.057a4.581 4.581 0 012.188 2.399c.209.51.313 1.041.315 1.595a4.24 4.24 0 01-.134 1.223.123.123 0 00.03.115c.594.607.988 1.33 1.183 2.17.289 1.425-.007 2.71-.887 3.854l-.136.166a4.548 4.548 0 01-2.201 1.388.123.123 0 00-.081.076c-.191.551-.383 1.023-.74 1.494-.9 1.187-2.222 1.846-3.711 1.838-1.187-.006-2.239-.44-3.157-1.302a.107.107 0 00-.105-.024c-.388.125-.78.143-1.204.138a4.441 4.441 0 01-1.945-.466 4.544 4.544 0 01-1.61-1.335c-.152-.202-.303-.392-.414-.617a5.81 5.81 0 01-.37-.961 4.582 4.582 0 01-.014-2.298.124.124 0 00.006-.056.085.085 0 00-.027-.048 4.467 4.467 0 01-1.034-1.651 3.896 3.896 0 01-.251-1.192 5.189 5.189 0 01.141-1.6c.337-1.112.982-1.985 1.933-2.618.212-.141.413-.251.601-.33.215-.089.43-.164.646-.227a.098.098 0 00.065-.066 4.51 4.51 0 01.829-1.615 4.535 4.535 0 011.837-1.388zm3.482 10.565a.637.637 0 000 1.272h3.636a.637.637 0 100-1.272h-3.636zM8.462 9.23a.637.637 0 00-1.106.631l1.272 2.224-1.266 2.136a.636.636 0 101.095.649l1.454-2.455a.636.636 0 00.005-.64L8.462 9.23z\" fill=\"currentColor\"/></svg>", Yr = "M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z", Xr = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${Yr}" fill="#D97757" fill-rule="nonzero"></path></svg>`, Zr = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${Yr}" fill="currentColor" fill-rule="nonzero"></path></svg>`, Qr = "M21.751 22.607c1.34 1.005 3.35.335 1.508-1.508C17.73 15.74 18.904 1 12.037 1 5.17 1 6.342 15.74.815 21.1c-2.01 2.009.167 2.511 1.507 1.506 5.192-3.517 4.857-9.714 9.715-9.714 4.857 0 4.522 6.197 9.714 9.715z", $r = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${Qr}" fill="url(#folio-react-antigravity-gradient)"></path><defs><linearGradient id="folio-react-antigravity-gradient" x1="5" x2="19" y1="22" y2="2" gradientUnits="userSpaceOnUse"><stop stop-color="#3186FF"></stop><stop offset=".42" stop-color="#34A853"></stop><stop offset=".72" stop-color="#FBBC04"></stop><stop offset="1" stop-color="#EA4335"></stop></linearGradient></defs></svg>`, ei = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${Qr}" fill="currentColor"></path></svg>`, ti = "<svg viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M9 3c.4 3.9 3.1 6.6 7 7-3.9.4-6.6 3.1-7 7-.4-3.9-3.1-6.6-7-7 3.9-.4 6.6-3.1 7-7z\"/><path d=\"M17.8 13c.25 2.4 1.85 4 4.2 4.25-2.35.25-3.95 1.85-4.2 4.25-.25-2.4-1.85-4-4.2-4.25 2.35-.25 3.95-1.85 4.2-4.25z\" opacity=\".7\"/></svg>", ni = {
	codex: {
		label: "Codex",
		color: "#3941ff",
		logo: qr,
		monoLogo: Jr
	},
	claude: {
		label: "Claude",
		color: "#d97757",
		logo: Xr,
		monoLogo: Zr
	},
	antigravity: {
		label: "Antigravity",
		color: "#3186ff",
		logo: $r,
		monoLogo: ei
	},
	default: {
		label: "Folio Agent",
		color: "#c79a45",
		logo: ti,
		monoLogo: ti
	}
};
function ri(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function G() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function ii(e) {
	return (e ? new Date(e) : /* @__PURE__ */ new Date()).toLocaleTimeString("ko-KR", {
		hour: "2-digit",
		minute: "2-digit"
	});
}
function ai(e) {
	return e === "high" ? "높음" : e === "low" ? "낮음" : "중간";
}
function oi(e) {
	return `${Math.max(1, Math.round((Date.now() - e) / 1e3))}초`;
}
function si(e) {
	let t = e?.provider && Gr.has(e.provider) ? e.provider : e?.selectedAdapter || "";
	return e?.adapters?.find((e) => e.id === t) || null;
}
function ci(e) {
	return ni[e?.provider && Gr.has(e.provider) ? e.provider : e?.selectedAdapter || ""] || ni.default;
}
function li(e) {
	return e?.modelChoices || [];
}
function ui(e) {
	let t = li(e);
	return t.length ? t.some((t) => t.value === e?.model) ? String(e?.model || "") : t[0].value : "";
}
async function di(e) {
	let t = e;
	for (; ["queued", "running"].includes(t.status);) await ri(1e3), t = await F(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "Agent 작업에 실패했습니다.");
	return t;
}
function fi({ surface: e, open: t, onOpen: n, onClose: r }) {
	let [i, a] = (0, p.useState)(null), [o, s] = (0, p.useState)(null), [c, l] = (0, p.useState)([Kr]), [u, d] = (0, p.useState)(""), [f, h] = (0, p.useState)(""), [g, _] = (0, p.useState)("medium"), [v, y] = (0, p.useState)(!1), [b, x] = (0, p.useState)(""), S = (0, p.useRef)(null), C = (0, p.useRef)({ surface: e }), w = (0, p.useCallback)((e, t = !1) => {
		let n = si(e);
		a(e), h((e) => {
			let r = ui(n);
			return t && li(n).some((t) => t.value === e) ? e : r;
		});
	}, []), T = (0, p.useCallback)(async (e = !1) => {
		let t = await F(`/api/agent-bridge/settings${e ? "?refresh=true" : ""}`);
		return w(t, !0), t;
	}, [w]), E = (0, p.useCallback)(async (e) => {
		try {
			let t = e?.provider && Gr.has(e.provider) ? e.provider : "", n = t ? `?adapter=${encodeURIComponent(t)}` : "";
			s(await F(`/api/agent-bridge/preflight${n}`));
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
	(0, p.useEffect)(() => {
		let e = !0;
		return F("/api/agent-bridge/settings").then((t) => {
			e && (w(t), E(t));
		}).catch((t) => {
			e && x(t instanceof Error ? t.message : "Agent 설정을 불러오지 못했습니다.");
		}), () => {
			e = !1;
		};
	}, [w, E]), (0, p.useEffect)(() => {
		S.current && (S.current.scrollTop = S.current.scrollHeight);
	}, [c, t]), (0, p.useEffect)(() => {
		C.current = {
			...C.current,
			surface: e
		};
	}, [e]), (0, p.useEffect)(() => {
		let e = (e) => {
			let t = e.detail;
			t ? (w(t), E(t)) : T().then((e) => E(e)).catch((e) => x(e instanceof Error ? e.message : "Agent 설정을 불러오지 못했습니다."));
		};
		return window.addEventListener("folio:agent-settings-updated", e), () => window.removeEventListener("folio:agent-settings-updated", e);
	}, [
		w,
		T,
		E
	]);
	let D = si(i), O = ci(i), k = li(D), A = (0, p.useMemo)(() => ({ "--react-agent-accent": O.color }), [O.color]), j = (o?.checks || []).filter((e) => !e.ok), M = (0, p.useCallback)(async (e, t = {}) => {
		let n = e.trim();
		if (!n || v) return;
		let r = {
			...C.current,
			...t
		};
		C.current = r;
		let i = G(), a = Date.now(), o = new Date(a).toISOString(), s = D?.label || O.label, c = f || D?.model || "model";
		l((e) => [
			...e,
			{
				id: G(),
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
				runMeta: `${c} · ${ai(g)} · on-request`,
				createdAt: o
			}
		]), d(""), y(!0), x("");
		try {
			let e = await di(await I("/api/agent/chat", {
				message: n,
				context: r,
				options: {
					model: f,
					effort: g
				}
			})), t = e.result || {};
			l((n) => n.map((n) => n.id === i ? {
				...n,
				text: t.reply || e.message || "Agent가 응답을 반환하지 않았습니다.",
				notice: t.notice,
				proposal: t.proposal || null,
				proposalStatus: t.proposal ? "pending" : "",
				pending: !1,
				runState: "done",
				runTitle: `${s} 응답`,
				runMeta: `${c} · ${ai(g)} · ${oi(a)}`
			} : n));
		} catch (e) {
			let t = e instanceof Error ? e.message : "Agent 요청에 실패했습니다.";
			x(t), l((e) => e.map((e) => e.id === i ? {
				...e,
				text: t,
				pending: !1,
				runState: "error",
				runTitle: `${s} 오류`,
				runMeta: `${c} · ${ai(g)}`
			} : e));
		} finally {
			y(!1);
		}
	}, [
		D?.label,
		D?.model,
		v,
		g,
		O.label,
		f
	]);
	(0, p.useEffect)(() => {
		let t = (t) => {
			let { message: n, prompt: r, autoSubmit: i, ...a } = t.detail || {};
			C.current = {
				...C.current,
				...a,
				surface: String(a.surface || e)
			};
			let o = String(n || r || "");
			o && (i ? M(o, a) : d(o));
		};
		return window.addEventListener("folio:react-agent-request", t), () => window.removeEventListener("folio:react-agent-request", t);
	}, [M, e]);
	async function P(e) {
		e.preventDefault(), await M(u);
	}
	function L() {
		l([{
			...Kr,
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		}]), d(""), x("");
	}
	async function R(e) {
		if (h(e), !(!D?.id || !e)) try {
			let t = Object.fromEntries((i?.adapters || []).map((e) => [e.id, e.model || ""]));
			t[D.id] = e;
			let n = await I("/api/agent-bridge/settings", {
				provider: D.id,
				models: t
			});
			w(n, !0), window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: n }));
		} catch (e) {
			x(e instanceof Error ? e.message : "모델 설정 저장에 실패했습니다.");
		}
	}
	async function z(e, t, n) {
		try {
			let r = await I(`/api/agent/proposals/${encodeURIComponent(t)}`, { action: n });
			l((t) => t.map((t) => t.id === e ? {
				...t,
				proposalStatus: r.status || n
			} : t));
		} catch (e) {
			x(e instanceof Error ? e.message : "제안 처리에 실패했습니다.");
		}
	}
	return t ? /* @__PURE__ */ (0, m.jsxs)("aside", {
		className: "react-agent-dock",
		style: A,
		"aria-label": "AI Agent",
		children: [
			/* @__PURE__ */ (0, m.jsxs)("header", {
				className: "react-agent-dock-header",
				children: [/* @__PURE__ */ (0, m.jsxs)("div", {
					className: "react-agent-dock-title",
					children: [/* @__PURE__ */ (0, m.jsx)("span", {
						className: "react-agent-logo",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, m.jsx)("span", {
							className: "react-agent-logo-mark",
							dangerouslySetInnerHTML: { __html: O.logo }
						})
					}), /* @__PURE__ */ (0, m.jsxs)("div", { children: [/* @__PURE__ */ (0, m.jsx)("p", {
						className: "section-kicker",
						children: "Agent"
					}), /* @__PURE__ */ (0, m.jsx)("h2", { children: D?.label || O.label })] })]
				}), /* @__PURE__ */ (0, m.jsxs)("div", {
					className: "react-agent-header-actions",
					children: [/* @__PURE__ */ (0, m.jsx)("button", {
						className: "react-agent-new-chat",
						type: "button",
						onClick: L,
						children: "새 채팅"
					}), /* @__PURE__ */ (0, m.jsx)("button", {
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
			/* @__PURE__ */ (0, m.jsxs)("div", {
				className: "react-agent-dock-body",
				ref: S,
				children: [
					/* @__PURE__ */ (0, m.jsx)("div", {
						className: "react-agent-watermark",
						"aria-hidden": "true",
						dangerouslySetInnerHTML: { __html: O.monoLogo }
					}),
					j.length > 0 && /* @__PURE__ */ (0, m.jsxs)("div", {
						className: "react-agent-preflight",
						role: "status",
						children: [/* @__PURE__ */ (0, m.jsx)("strong", { children: "Agent 준비 상태 확인 필요" }), j.slice(0, 3).map((e) => /* @__PURE__ */ (0, m.jsx)("p", { children: e.message }, e.id))]
					}),
					/* @__PURE__ */ (0, m.jsx)("div", {
						className: "react-agent-messages",
						children: c.map((e) => /* @__PURE__ */ (0, m.jsxs)("article", {
							className: `react-agent-message ${e.role}${e.pending ? " pending" : ""}`,
							children: [
								e.role === "assistant" && /* @__PURE__ */ (0, m.jsxs)("div", {
									className: "react-agent-message-head",
									children: [
										/* @__PURE__ */ (0, m.jsx)("span", {
											className: "react-agent-mini-logo",
											"aria-hidden": "true",
											dangerouslySetInnerHTML: { __html: O.logo }
										}),
										/* @__PURE__ */ (0, m.jsx)("strong", { children: D?.label || O.label }),
										/* @__PURE__ */ (0, m.jsx)("time", { children: ii(e.createdAt) })
									]
								}),
								e.runTitle && /* @__PURE__ */ (0, m.jsx)(N, {
									state: e.runState,
									title: e.runTitle,
									meta: e.runMeta
								}),
								e.text && /* @__PURE__ */ (0, m.jsx)("div", {
									className: e.variant === "welcome" ? "react-agent-welcome-card" : "",
									children: /* @__PURE__ */ (0, m.jsx)(ee, { text: e.text })
								}),
								e.notice && /* @__PURE__ */ (0, m.jsx)("p", {
									className: "react-agent-notice",
									children: e.notice
								}),
								e.proposal && /* @__PURE__ */ (0, m.jsxs)("div", {
									className: "agent-proposal",
									children: [
										/* @__PURE__ */ (0, m.jsxs)("div", {
											className: "agent-proposal-title",
											children: [/* @__PURE__ */ (0, m.jsx)("strong", { children: e.proposal.artifactKind || "proposal" }), e.proposal.artifactId && /* @__PURE__ */ (0, m.jsx)("span", { children: e.proposal.artifactId })]
										}),
										e.proposal.summary && /* @__PURE__ */ (0, m.jsx)("p", { children: e.proposal.summary }),
										e.proposal.diff && /* @__PURE__ */ (0, m.jsxs)("details", {
											className: "agent-proposal-diff",
											children: [/* @__PURE__ */ (0, m.jsx)("summary", { children: "diff 보기" }), /* @__PURE__ */ (0, m.jsx)("pre", { children: e.proposal.diff })]
										}),
										e.proposalStatus === "pending" ? /* @__PURE__ */ (0, m.jsxs)("div", {
											className: "agent-actions",
											children: [/* @__PURE__ */ (0, m.jsx)("button", {
												type: "button",
												onClick: () => z(e.id, e.proposal.id, "approve"),
												children: "승인"
											}), /* @__PURE__ */ (0, m.jsx)("button", {
												type: "button",
												onClick: () => z(e.id, e.proposal.id, "reject"),
												children: "거절"
											})]
										}) : /* @__PURE__ */ (0, m.jsxs)("p", {
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
			/* @__PURE__ */ (0, m.jsxs)("form", {
				className: "react-agent-form",
				onSubmit: P,
				children: [
					/* @__PURE__ */ (0, m.jsx)("textarea", {
						value: u,
						onChange: (e) => d(e.currentTarget.value),
						onKeyDown: (e) => {
							e.key === "Enter" && !e.shiftKey && (e.preventDefault(), e.currentTarget.form?.requestSubmit());
						},
						rows: 2,
						placeholder: "현재 화면에 대해 물어보세요"
					}),
					/* @__PURE__ */ (0, m.jsxs)("div", {
						className: "react-agent-form-toolbar",
						children: [/* @__PURE__ */ (0, m.jsxs)("div", {
							className: "react-agent-tools",
							children: [/* @__PURE__ */ (0, m.jsx)("select", {
								value: f,
								onChange: (e) => R(e.currentTarget.value),
								"aria-label": "모델 버전",
								children: k.length ? k.map((e) => /* @__PURE__ */ (0, m.jsx)("option", {
									value: e.value,
									children: e.label
								}, e.value)) : /* @__PURE__ */ (0, m.jsx)("option", {
									value: "",
									children: "기본 버전"
								})
							}), /* @__PURE__ */ (0, m.jsxs)("select", {
								value: g,
								onChange: (e) => _(e.currentTarget.value),
								"aria-label": "노력 단계",
								children: [
									/* @__PURE__ */ (0, m.jsx)("option", {
										value: "low",
										children: "노력 낮음"
									}),
									/* @__PURE__ */ (0, m.jsx)("option", {
										value: "medium",
										children: "노력 중간"
									}),
									/* @__PURE__ */ (0, m.jsx)("option", {
										value: "high",
										children: "노력 높음"
									}),
									/* @__PURE__ */ (0, m.jsx)("option", {
										value: "max",
										children: "노력 최대"
									})
								]
							})]
						}), /* @__PURE__ */ (0, m.jsx)("button", {
							type: "submit",
							disabled: v || !u.trim(),
							children: v ? "작업 중" : "보내기"
						})]
					}),
					b && /* @__PURE__ */ (0, m.jsx)("p", {
						className: "react-agent-error",
						children: b
					})
				]
			})
		]
	}) : /* @__PURE__ */ (0, m.jsx)("aside", {
		className: "react-agent-dock is-closed",
		style: A,
		"aria-label": "AI Agent 닫힘",
		children: /* @__PURE__ */ (0, m.jsxs)("button", {
			type: "button",
			onClick: n,
			"aria-label": "AI Agent 열기",
			"data-tooltip": "AI Agent 열기",
			"data-tooltip-pos": "left",
			children: [/* @__PURE__ */ (0, m.jsx)("span", {
				className: "react-agent-closed-dot",
				"aria-hidden": "true"
			}), /* @__PURE__ */ (0, m.jsx)("span", { children: "AI" })]
		})
	});
}
//#endregion
//#region src/app/RssRoute.tsx
var pi = {
	start: "",
	end: "",
	source: "",
	market: ""
}, mi = 20, hi = [
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
function gi(e) {
	return new Promise((t) => window.setTimeout(t, e));
}
function _i(e) {
	let t = e.timestamp || e.date || "";
	if (!t) return "시간 정보 없음";
	let n = new Date(t);
	return Number.isNaN(n.getTime()) ? t : n.toLocaleString("ko-KR");
}
function vi(e) {
	let t = [
		e.start ? `${e.start} 이후` : "",
		e.end ? `${e.end} 이전` : "",
		e.source ? e.source : "",
		e.market ? hi.find((t) => t.value === e.market)?.label || e.market : ""
	].filter(Boolean);
	return t.length ? t.join(" · ") : "전체 RSS 피드";
}
function yi(e, t) {
	let n = new URLSearchParams({
		offset: String((Math.max(1, e) - 1) * mi),
		limit: String(mi)
	});
	return t.start && n.set("start", t.start), t.end && n.set("end", t.end), t.source && n.set("source", t.source), t.market && n.set("market", t.market), n;
}
function bi(e) {
	let t = e.markets, n = Array.isArray(t) ? t : typeof t == "string" ? t.split(",") : String(e.market || "").split(","), r = /* @__PURE__ */ new Set();
	return n.map((e) => String(e || "").trim()).filter(Boolean).filter((e) => r.has(e) ? !1 : (r.add(e), !0));
}
async function xi(e) {
	let t = e;
	for (; ["queued", "running"].includes(t.status);) await gi(1e3), t = await F(`/api/jobs/${encodeURIComponent(t.id)}`);
	if (t.status !== "done") throw Error(t.message || t.error || "RSS 수집 작업에 실패했습니다.");
	return t;
}
function Si(e, t) {
	return e.url || `${e.title || "rss"}-${e.timestamp || e.date || t}`;
}
function Ci(e) {
	return {
		title: e.title || e.headline || e.path || "검색 결과",
		url: e.url || e.sourceUrl || e.link || "",
		description: e.summary || e.snippet || e.text || e.content || "",
		media: e.media || e.source || e.collector || "",
		source: e.source || e.media || e.collector || "",
		markets: bi({
			markets: e.markets,
			market: String(e.market || "")
		}),
		market: String(e.market || ""),
		timestamp: e.timestamp || e.date || e.publishedAt || e.published || "",
		date: e.date || e.publishedAt || e.published || e.timestamp || ""
	};
}
function wi() {
	let [e, t] = (0, p.useState)(null), [n, r] = (0, p.useState)(null), [i, a] = (0, p.useState)(1), [o, s] = (0, p.useState)(pi), [c, l] = (0, p.useState)(pi), [u, d] = (0, p.useState)(""), [f, h] = (0, p.useState)(!1), [g, _] = (0, p.useState)(!1), [v, y] = (0, p.useState)(!1), [b, x] = (0, p.useState)(""), [S, C] = (0, p.useState)(""), w = n?.items || [], T = n?.total ?? w.length, E = Math.max(1, Math.ceil(T / mi)), D = (0, p.useMemo)(() => n?.sources || [], [n?.sources]), O = (0, p.useCallback)(async (e = i, t = o) => {
		h(!0), x("");
		try {
			let n = await F(`/api/rss/items?${yi(e, t).toString()}`);
			r(n), a(e), s(t), l(t), L({
				surface: "rss",
				viewId: "rssfeed",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			x(e instanceof Error ? e.message : "RSS 피드를 불러오지 못했습니다.");
		} finally {
			h(!1);
		}
	}, [o, i]), k = (0, p.useCallback)(async () => {
		try {
			let e = await F("/api/dashboard"), n = e.index?.newsCount ?? e.index?.count;
			Number.isFinite(Number(n)) && t(Number(n));
		} catch {}
	}, []);
	(0, p.useEffect)(() => {
		O(1, o), k();
	}, []);
	async function A(e) {
		if (e.preventDefault(), c.start && c.end && c.start > c.end) {
			x("시작 시간은 종료 시간보다 앞서야 합니다.");
			return;
		}
		C(""), await O(1, c);
	}
	async function j(e) {
		C(""), await O(1, {
			...o,
			market: e
		});
	}
	async function M() {
		C(""), d(""), l(pi), await O(1, pi);
	}
	async function ee(e) {
		e.preventDefault();
		let t = u.trim();
		if (!t) {
			x("검색어를 입력해 주세요.");
			return;
		}
		y(!0), x(""), C("");
		try {
			let e = await F(`/api/search?${new URLSearchParams({
				query: t,
				scope: "news",
				limit: "50"
			}).toString()}`), n = Array.isArray(e) ? e : e.items || [];
			r({
				items: n.map(Ci),
				total: n.length,
				offset: 0,
				limit: n.length,
				has_more: !1,
				sources: D
			}), a(1), C(`뉴스 검색 결과 ${n.length}개`), L({
				surface: "rss",
				viewId: "rssfeed",
				reportKind: "news_search",
				reportId: t
			});
		} catch (e) {
			x(e instanceof Error ? e.message : "뉴스 검색에 실패했습니다.");
		} finally {
			y(!1);
		}
	}
	async function N() {
		_(!0), x(""), C("RSS 수집 작업을 시작했습니다.");
		try {
			let e = await xi(await I("/api/rssarchive/import", {})), t = Number.isFinite(Number(e.result?.added)) ? ` 신규 ${e.result?.added}개` : "";
			C(`RSS 수집 완료.${t}`), await O(1, o), await k();
		} catch (e) {
			x(e instanceof Error ? e.message : "RSS 수집에 실패했습니다."), C("");
		} finally {
			_(!1);
		}
	}
	let P = Math.min(Math.max(i, 1), E), R = Math.max(1, P - 2), z = Math.min(E, P + 2);
	return /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "react-rss-route",
		"data-rss-route": !0,
		children: [
			/* @__PURE__ */ (0, m.jsx)(He, {
				eyebrow: "RSS Feed",
				title: "RSS 피드",
				description: "수집한 기사와 원천 자료를 시간, 출처, 키워드로 빠르게 훑습니다.",
				actions: /* @__PURE__ */ (0, m.jsxs)("div", {
					className: "react-rss-hero-actions",
					children: [
						/* @__PURE__ */ (0, m.jsxs)("span", {
							className: "react-rss-stat-pill",
							children: [/* @__PURE__ */ (0, m.jsx)("strong", { children: "LOADED" }), T > 0 ? `${T}개 · ${P}/${E}` : "0개"]
						}),
						/* @__PURE__ */ (0, m.jsxs)("span", {
							className: "react-rss-stat-pill",
							children: [/* @__PURE__ */ (0, m.jsx)("strong", { children: "INDEXED" }), e === null ? "…" : `${e}개 문서`]
						}),
						/* @__PURE__ */ (0, m.jsx)("button", {
							type: "button",
							onClick: N,
							disabled: g,
							children: g ? "수집 중" : "RSS 수집/가져오기"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, m.jsxs)("section", {
				className: "react-rss-control-panel react-rss-filter-panel",
				"aria-label": "RSS 필터",
				children: [/* @__PURE__ */ (0, m.jsxs)("div", {
					className: "react-rss-panel-head",
					children: [/* @__PURE__ */ (0, m.jsxs)("div", { children: [/* @__PURE__ */ (0, m.jsx)("h2", { children: "피드 필터" }), /* @__PURE__ */ (0, m.jsx)("p", { children: "시간 범위와 소스를 선택해 RSS 피드를 필터링합니다. 시간은 UTC+9 기준입니다." })] }), /* @__PURE__ */ (0, m.jsx)("button", {
						className: "react-rss-period-action",
						type: "button",
						onClick: M,
						disabled: f,
						children: "전체 기간"
					})]
				}), /* @__PURE__ */ (0, m.jsxs)("form", {
					className: "react-rss-filter-grid",
					onSubmit: A,
					children: [
						/* @__PURE__ */ (0, m.jsxs)("label", { children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "시작" }), /* @__PURE__ */ (0, m.jsx)("input", {
							type: "datetime-local",
							value: c.start,
							onChange: (e) => l((t) => ({
								...t,
								start: e.currentTarget.value
							}))
						})] }),
						/* @__PURE__ */ (0, m.jsxs)("label", { children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "종료" }), /* @__PURE__ */ (0, m.jsx)("input", {
							type: "datetime-local",
							value: c.end,
							onChange: (e) => l((t) => ({
								...t,
								end: e.currentTarget.value
							}))
						})] }),
						/* @__PURE__ */ (0, m.jsxs)("label", { children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "소스" }), /* @__PURE__ */ (0, m.jsxs)("select", {
							value: c.source,
							onChange: (e) => l((t) => ({
								...t,
								source: e.currentTarget.value
							})),
							children: [/* @__PURE__ */ (0, m.jsx)("option", {
								value: "",
								children: "전체 소스"
							}), D.map((e) => /* @__PURE__ */ (0, m.jsx)("option", {
								value: e,
								children: e
							}, e))]
						})] }),
						/* @__PURE__ */ (0, m.jsxs)("div", {
							className: "react-rss-filter-actions",
							children: [/* @__PURE__ */ (0, m.jsx)("button", {
								className: "react-rss-primary-action",
								type: "submit",
								disabled: f,
								children: "필터 적용"
							}), /* @__PURE__ */ (0, m.jsx)("button", {
								className: "react-rss-secondary-action",
								type: "button",
								onClick: M,
								disabled: f,
								children: "초기화"
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, m.jsxs)("section", {
				className: "react-rss-control-panel react-rss-search-panel",
				"aria-label": "뉴스 검색",
				children: [/* @__PURE__ */ (0, m.jsx)("div", {
					className: "react-rss-panel-head",
					children: /* @__PURE__ */ (0, m.jsxs)("div", { children: [/* @__PURE__ */ (0, m.jsx)("h2", { children: "뉴스 검색" }), /* @__PURE__ */ (0, m.jsx)("p", { children: "기업, 티커, 섹터, 시장 이슈 기준으로 RSS와 수동 저장 기사를 검색합니다." })] })
				}), /* @__PURE__ */ (0, m.jsxs)("form", {
					className: "react-rss-search-form",
					onSubmit: ee,
					children: [/* @__PURE__ */ (0, m.jsx)("input", {
						type: "search",
						value: u,
						placeholder: "기업, 티커, 섹터 또는 이슈",
						onChange: (e) => d(e.currentTarget.value)
					}), /* @__PURE__ */ (0, m.jsx)("button", {
						className: "react-rss-primary-action",
						type: "submit",
						disabled: v,
						children: v ? "검색 중" : "검색"
					})]
				})]
			}),
			/* @__PURE__ */ (0, m.jsxs)("div", {
				className: "react-rss-summary",
				children: [/* @__PURE__ */ (0, m.jsx)("strong", { children: vi(o) }), /* @__PURE__ */ (0, m.jsx)("span", { children: T > 0 ? `${T}개 · ${P}/${E}` : "0개" })]
			}),
			b && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "react-dashboard-error",
				children: b
			}),
			S && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "react-dashboard-warning",
				children: S
			}),
			/* @__PURE__ */ (0, m.jsx)("div", {
				className: "report-feed-outside-controls react-rss-market-controls",
				"aria-label": "RSS 표시 옵션",
				children: /* @__PURE__ */ (0, m.jsxs)("div", {
					className: "report-feed-view-row",
					children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "시장" }), /* @__PURE__ */ (0, m.jsx)("label", {
						className: "report-feed-view-pill",
						children: /* @__PURE__ */ (0, m.jsx)("select", {
							value: o.market,
							onChange: (e) => j(e.currentTarget.value),
							disabled: f,
							children: hi.map((e) => /* @__PURE__ */ (0, m.jsx)("option", {
								value: e.value,
								children: e.label
							}, e.value || "all-market"))
						})
					})]
				})
			}),
			/* @__PURE__ */ (0, m.jsx)("section", {
				className: "react-rss-feed",
				"aria-label": "RSS feed items",
				children: w.length ? w.map((e, t) => {
					let n = Si(e, t), r = String(e.description || "").trim(), i = bi(e);
					return /* @__PURE__ */ (0, m.jsxs)("article", {
						className: "react-rss-card",
						children: [/* @__PURE__ */ (0, m.jsxs)("div", {
							className: "react-rss-card-main",
							children: [
								/* @__PURE__ */ (0, m.jsx)("h2", { children: e.url ? /* @__PURE__ */ (0, m.jsx)("a", {
									href: e.url,
									target: "_blank",
									rel: "noopener noreferrer",
									children: e.title || "제목 없음"
								}) : e.title || "제목 없음" }),
								/* @__PURE__ */ (0, m.jsxs)("div", {
									className: "react-rss-card-meta",
									children: [
										(e.media || e.source) && /* @__PURE__ */ (0, m.jsx)("span", {
											className: "pill",
											children: e.media || e.source
										}),
										i.length ? /* @__PURE__ */ (0, m.jsx)("span", {
											className: "pill",
											children: i.join(" · ")
										}) : null,
										/* @__PURE__ */ (0, m.jsx)("span", { children: _i(e) })
									]
								}),
								r && /* @__PURE__ */ (0, m.jsx)("p", { children: r })
							]
						}), /* @__PURE__ */ (0, m.jsx)("div", {
							className: "react-rss-card-actions",
							children: e.url && /* @__PURE__ */ (0, m.jsx)("a", {
								href: e.url,
								target: "_blank",
								rel: "noopener noreferrer",
								children: "기사 열기"
							})
						})]
					}, n);
				}) : /* @__PURE__ */ (0, m.jsxs)("article", {
					className: "react-dashboard-panel",
					children: [/* @__PURE__ */ (0, m.jsx)("h2", { children: f ? "불러오는 중" : "표시할 RSS 피드가 없습니다." }), /* @__PURE__ */ (0, m.jsx)("p", { children: f ? "수집된 항목을 확인하고 있습니다." : "RSS 수집을 실행하거나 필터를 초기화해 보세요." })]
				})
			}),
			E > 1 && /* @__PURE__ */ (0, m.jsxs)("nav", {
				className: "react-rss-pagination",
				"aria-label": "RSS pagination",
				children: [
					/* @__PURE__ */ (0, m.jsx)("button", {
						type: "button",
						disabled: P === 1 || f,
						onClick: () => O(P - 1, o),
						children: "이전"
					}),
					R > 1 && /* @__PURE__ */ (0, m.jsxs)(m.Fragment, { children: [/* @__PURE__ */ (0, m.jsx)("button", {
						type: "button",
						onClick: () => O(1, o),
						children: "1"
					}), R > 2 && /* @__PURE__ */ (0, m.jsx)("span", { children: "..." })] }),
					Array.from({ length: z - R + 1 }, (e, t) => R + t).map((e) => /* @__PURE__ */ (0, m.jsx)("button", {
						type: "button",
						className: e === P ? "active" : "",
						disabled: f,
						onClick: () => O(e, o),
						children: e
					}, e)),
					z < E && /* @__PURE__ */ (0, m.jsxs)(m.Fragment, { children: [z < E - 1 && /* @__PURE__ */ (0, m.jsx)("span", { children: "..." }), /* @__PURE__ */ (0, m.jsx)("button", {
						type: "button",
						onClick: () => O(E, o),
						children: E
					})] }),
					/* @__PURE__ */ (0, m.jsx)("button", {
						type: "button",
						disabled: P === E || f,
						onClick: () => O(P + 1, o),
						children: "다음"
					})
				]
			})
		]
	});
}
//#endregion
//#region src/app/SettingsRoute.tsx
var Ti = [
	"openai",
	"gemini",
	"claude"
], Ei = {
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
function Di(e) {
	return Ti.includes(e) ? e : "openai";
}
function Oi(e, t, n, r) {
	return e ? `${r} 저장됨: ${t || "저장됨"}` : n;
}
function ki(e) {
	return e.bridgeSupported === !1 ? "지원 안 됨" : e.installed ? e.authenticated || e.available ? "사용 가능" : "로그인 필요" : "미설치";
}
function Ai(e) {
	return e.bridgeSupported === !1 ? "warn" : e.authenticated || e.available ? "ready" : e.installed ? "warn" : "";
}
function ji({ checked: e, onChange: t, label: n, compact: r = !1 }) {
	return /* @__PURE__ */ (0, m.jsxs)("label", {
		className: `settings-switch${r ? " settings-switch-compact" : ""}${e ? " is-on" : ""}`,
		children: [
			/* @__PURE__ */ (0, m.jsx)("input", {
				checked: e,
				onChange: (e) => t(e.currentTarget.checked),
				type: "checkbox"
			}),
			/* @__PURE__ */ (0, m.jsx)("span", {
				className: "settings-switch-track",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, m.jsx)("span", { className: "settings-switch-thumb" })
			}),
			n ? /* @__PURE__ */ (0, m.jsxs)("span", {
				className: "settings-switch-copy",
				children: [/* @__PURE__ */ (0, m.jsx)("strong", { children: n }), /* @__PURE__ */ (0, m.jsx)("small", { children: e ? "ON" : "OFF" })]
			}) : /* @__PURE__ */ (0, m.jsx)("span", {
				className: "settings-switch-state",
				"aria-hidden": "true",
				children: e ? "ON" : "OFF"
			})
		]
	});
}
function Mi(e) {
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
function Ni() {
	let e = gr(), [t, n] = (0, p.useState)("integrations"), [r, i] = (0, p.useState)(null), [a, o] = (0, p.useState)(null), [s, c] = (0, p.useState)({}), [l, u] = (0, p.useState)({}), [d, f] = (0, p.useState)(null), [h, g] = (0, p.useState)("openai"), [_, v] = (0, p.useState)(""), [y, b] = (0, p.useState)(""), [x, S] = (0, p.useState)(!0), [C, w] = (0, p.useState)("cli"), [T, E] = (0, p.useState)("codex"), [D, O] = (0, p.useState)(""), [k, A] = (0, p.useState)({
		fred: "",
		bok: "",
		dart: ""
	}), [j, M] = (0, p.useState)({
		token: "",
		dbId: ""
	}), [ee, N] = (0, p.useState)(""), [P, R] = (0, p.useState)({}), [z, B] = (0, p.useState)(""), [V, H] = (0, p.useState)(""), [te, ne] = (0, p.useState)(""), re = r?.llm?.providers || {}, ie = re[h] || {}, ae = Ei[h], oe = ie.modelChoices || [], se = a?.adapters || [], ce = (se.find((e) => e.id === T) || se[0])?.modelChoices || [], le = (0, p.useCallback)(async (e = !1) => {
		ne(""), H("load");
		try {
			let [t, n, r, a] = await Promise.all([
				F(`/api/settings${e ? "?refresh=true" : ""}`),
				F(`/api/agent-bridge/settings${e ? "?refresh=true" : ""}`),
				F("/api/automation/settings"),
				F("/api/obsidian/settings")
			]);
			i(t), S(t.agent?.enabled !== !1), w(t.agent?.mode === "api" ? "api" : "cli");
			let s = Di(t.llm?.provider);
			g(s);
			let l = t.llm?.providers?.[s] || {}, d = l.modelChoices || [];
			b(d.some((e) => e.value === l.model) ? String(l.model || "") : d[0]?.value || ""), M({
				token: "",
				dbId: t.notion?.dbId || ""
			}), o(n);
			let f = [
				"codex",
				"claude",
				"antigravity"
			].includes(n.provider || "") ? String(n.provider) : String(n.selectedAdapter || n.adapters?.[0]?.id || "codex"), p = n.adapters?.find((e) => e.id === f) || n.adapters?.[0];
			E(f);
			let m = p?.modelChoices || [];
			O(m.some((e) => e.value === p?.model) ? String(p?.model || "") : m[0]?.value || ""), window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: n })), c(Mi(r)), u(a), N(a.vaultPath || ""), L({
				surface: "settings",
				viewId: "settings",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			ne(e instanceof Error ? e.message : "설정을 불러오지 못했습니다.");
		} finally {
			H("");
		}
	}, []), ue = (0, p.useCallback)(async () => {
		H("cache"), ne("");
		try {
			let e = await F("/api/cache/stats");
			f(e), B("캐시 상태를 불러왔습니다.");
		} catch (e) {
			ne(e instanceof Error ? e.message : "캐시 상태를 불러오지 못했습니다.");
		} finally {
			H("");
		}
	}, []);
	async function de() {
		H("cache-cleanup"), ne(""), B("오래된 기업 데이터 캐시를 정리하는 중입니다.");
		try {
			let e = await I("/api/cache/cleanup", {}), t = await F("/api/cache/stats");
			f(t), B(`캐시 정리 완료: ${e.deleted || 0}개 삭제, ${e.freed_mb || 0}MB 확보`);
		} catch (e) {
			ne(e instanceof Error ? e.message : "캐시 정리에 실패했습니다.");
		} finally {
			H("");
		}
	}
	(0, p.useEffect)(() => {
		le();
	}, [le]), (0, p.useEffect)(() => {
		let e = re[h] || {}, t = e.modelChoices || [];
		b((n) => t.some((e) => e.value === n) ? n : t.some((t) => t.value === e.model) ? String(e.model || "") : t[0]?.value || ""), v("");
	}, [h, re]), (0, p.useEffect)(() => {
		let e = se.find((e) => e.id === T) || se[0], t = e?.modelChoices || [];
		O((n) => t.some((e) => e.value === n) ? n : t.some((t) => t.value === e?.model) ? String(e?.model || "") : t[0]?.value || "");
	}, [T, se]);
	async function fe() {
		H("agent"), B("AI Agent 설정을 저장하는 중입니다.");
		try {
			let e = Object.fromEntries(se.map((e) => [e.id, e.model || ""]));
			e[T] = D;
			let [t, n] = await Promise.all([I("/api/agent-bridge/settings", {
				provider: T,
				models: e
			}), I("/api/settings", {
				agent: {
					enabled: x,
					mode: C
				},
				llm: {
					provider: h,
					providers: { [h]: {
						apiKey: _.trim(),
						model: y
					} }
				}
			})]);
			o(t), i(n), v(""), R((e) => {
				let t = { ...e };
				return delete t[h], t;
			}), window.dispatchEvent(new CustomEvent("folio:agent-settings-updated", { detail: t })), B(x ? `AI Agent를 ${C === "cli" ? "LLM CLI" : "LLM API"} 모드로 저장했습니다.` : "AI Agent 생성을 비활성화했습니다.");
		} catch (e) {
			ne(e instanceof Error ? e.message : "AI Agent 설정 저장에 실패했습니다.");
		} finally {
			H("");
		}
	}
	async function pe(e) {
		R((t) => ({
			...t,
			[e]: { checking: !0 }
		}));
		try {
			let t = await I(`/api/settings/llm/test/${encodeURIComponent(e)}`, {});
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
	async function me() {
		H("api"), B("외부 데이터 API 설정을 저장하는 중입니다.");
		try {
			let e = await I("/api/settings", {
				fred: { apiKey: k.fred.trim() },
				bok: { apiKey: k.bok.trim() },
				dart: { apiKey: k.dart.trim() }
			});
			i(e), A({
				fred: "",
				bok: "",
				dart: ""
			}), B("외부 데이터 API 설정을 저장했습니다.");
		} catch (e) {
			ne(e instanceof Error ? e.message : "API 설정 저장에 실패했습니다.");
		} finally {
			H("");
		}
	}
	async function he() {
		H("notion"), B("Notion 설정을 저장하는 중입니다.");
		try {
			let e = await I("/api/settings", { notion: {
				token: j.token.trim(),
				dbId: j.dbId.trim()
			} });
			i(e), M({
				token: "",
				dbId: e.notion?.dbId || ""
			}), B("Notion 설정을 저장했습니다.");
		} catch (e) {
			ne(e instanceof Error ? e.message : "Notion 설정 저장에 실패했습니다.");
		} finally {
			H("");
		}
	}
	async function ge() {
		H("obsidian"), B("Obsidian 경로를 저장하는 중입니다.");
		try {
			let e = await I("/api/obsidian/settings", { vaultPath: ee.trim() });
			u(e), N(e.vaultPath || ee), B(e.vaultPath ? "Obsidian 경로를 저장했습니다." : "Vault 경로를 입력하세요.");
		} catch (e) {
			ne(e instanceof Error ? e.message : "Obsidian 설정 저장에 실패했습니다.");
		} finally {
			H("");
		}
	}
	async function _e() {
		H("automation"), B("자동화 설정을 저장하는 중입니다.");
		try {
			let e = await I("/api/automation/settings", Mi(s));
			c(Mi(e)), B("자동화 설정을 저장했습니다.");
		} catch (e) {
			ne(e instanceof Error ? e.message : "자동화 설정 저장에 실패했습니다.");
		} finally {
			H("");
		}
	}
	let ve = (0, p.useMemo)(() => Ti.map((e) => {
		let t = re[e] || {}, n = P[e], r = n?.checking;
		return {
			providerId: e,
			row: t,
			label: r ? "확인 중" : n?.available ? "사용 가능" : n ? "확인 실패" : t.hasApiKey ? "확인 필요" : "키 없음",
			className: n?.available ? "ready" : r || n ? "warn" : "",
			detail: n?.message || `${t.model || "모델 미설정"} · ${t.hasApiKey ? "저장된 키가 있습니다." : "API Key를 저장하세요."}`
		};
	}), [P, re]);
	return /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "react-settings-route",
		"data-settings-route": !0,
		children: [
			/* @__PURE__ */ (0, m.jsx)(He, {
				eyebrow: "Settings",
				title: "설정",
				description: "LLM, 외부 데이터, 내보내기, 자동화 설정을 관리합니다.",
				actions: /* @__PURE__ */ (0, m.jsx)("button", {
					className: "filter-btn clear",
					type: "button",
					onClick: () => le(!0),
					disabled: V === "load",
					children: V === "load" ? "불러오는 중" : "새로고침"
				})
			}),
			/* @__PURE__ */ (0, m.jsxs)("nav", {
				className: "sub-tabs",
				"aria-label": "설정 하위 탭",
				children: [/* @__PURE__ */ (0, m.jsx)("button", {
					className: t === "integrations" ? "active" : "",
					type: "button",
					onClick: () => n("integrations"),
					children: "연동"
				}), /* @__PURE__ */ (0, m.jsx)("button", {
					className: t === "admin" ? "active" : "",
					type: "button",
					onClick: () => n("admin"),
					children: "관리"
				})]
			}),
			te && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "react-dashboard-error",
				children: te
			}),
			z && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "react-dashboard-warning",
				children: z
			}),
			t === "integrations" ? /* @__PURE__ */ (0, m.jsxs)("div", {
				id: "settings-integrations",
				className: "sub-tab-panel active",
				children: [
					/* @__PURE__ */ (0, m.jsxs)("section", {
						className: "settings-panel input-panel",
						"data-display-settings": !0,
						children: [
							/* @__PURE__ */ (0, m.jsx)("div", {
								className: "input-panel-header",
								children: /* @__PURE__ */ (0, m.jsxs)("div", { children: [/* @__PURE__ */ (0, m.jsx)("h3", { children: "화면" }), /* @__PURE__ */ (0, m.jsx)("p", { children: "기본 Home, Agent 캐릭터와 움직임 방식을 이 브라우저에 저장합니다." })] })
							}),
							/* @__PURE__ */ (0, m.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, m.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "기본 Home" }), /* @__PURE__ */ (0, m.jsxs)("select", {
										value: e.preferences.home.mode,
										onChange: (t) => e.setHome(t.currentTarget.value === "home" ? "home" : "office", !0),
										children: [/* @__PURE__ */ (0, m.jsx)("option", {
											value: "office",
											children: "Pixel Office"
										}), /* @__PURE__ */ (0, m.jsx)("option", {
											value: "home",
											children: "Agent Home"
										})]
									})]
								}), /* @__PURE__ */ (0, m.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "움직임" }), /* @__PURE__ */ (0, m.jsxs)("select", {
										value: e.preferences.motion,
										onChange: (t) => e.setMotion(t.currentTarget.value === "reduced" ? "reduced" : "system"),
										children: [/* @__PURE__ */ (0, m.jsx)("option", {
											value: "system",
											children: "시스템 설정 따르기"
										}), /* @__PURE__ */ (0, m.jsx)("option", {
											value: "reduced",
											children: "움직임 줄이기"
										})]
									})]
								})]
							}),
							/* @__PURE__ */ (0, m.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, m.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "캐릭터" }), /* @__PURE__ */ (0, m.jsxs)("div", {
										className: "settings-segmented",
										"aria-label": "Agent 캐릭터",
										children: [/* @__PURE__ */ (0, m.jsx)("button", {
											className: e.preferences.character.preset === "classic" ? "active" : "",
											type: "button",
											onClick: () => e.setCharacter("classic"),
											children: "클래식 애널리스트"
										}), /* @__PURE__ */ (0, m.jsx)("button", {
											className: e.preferences.character.preset === "student" ? "active" : "",
											type: "button",
											onClick: () => e.setCharacter("student"),
											children: "경제 탐구생"
										})]
									})]
								}), /* @__PURE__ */ (0, m.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "캐릭터 이름" }), /* @__PURE__ */ (0, m.jsx)("input", {
										type: "text",
										maxLength: 30,
										value: e.preferences.character.name,
										placeholder: "선택 사항",
										onChange: (t) => e.setCharacter(e.preferences.character.preset, t.currentTarget.value)
									})]
								})]
							}),
							/* @__PURE__ */ (0, m.jsx)("div", {
								className: "filter-actions settings-actions",
								children: /* @__PURE__ */ (0, m.jsx)("button", {
									className: "filter-btn clear",
									type: "button",
									onClick: e.reset,
									children: "Home 선택과 화면 설정 초기화"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, m.jsxs)("section", {
						className: "settings-panel input-panel",
						children: [
							/* @__PURE__ */ (0, m.jsx)("div", {
								className: "input-panel-header settings-agent-header",
								children: /* @__PURE__ */ (0, m.jsxs)("div", { children: [/* @__PURE__ */ (0, m.jsx)("h3", { children: "AI Agent 설정" }), /* @__PURE__ */ (0, m.jsx)("p", { children: "보고서와 시장 내러티브 생성에 사용할 Agent 경로를 선택합니다. 비활성화하면 규칙 기반으로 생성합니다." })] })
							}),
							/* @__PURE__ */ (0, m.jsx)("div", {
								className: "settings-grid",
								children: /* @__PURE__ */ (0, m.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "실행 방식" }), /* @__PURE__ */ (0, m.jsxs)("div", {
										className: "settings-agent-mode-row",
										children: [/* @__PURE__ */ (0, m.jsx)(ji, {
											checked: x,
											onChange: S,
											compact: !0
										}), /* @__PURE__ */ (0, m.jsxs)("div", {
											className: "settings-segmented",
											"aria-label": "AI Agent 실행 방식",
											"data-mode": C,
											children: [/* @__PURE__ */ (0, m.jsx)("button", {
												className: C === "cli" ? "active" : "",
												type: "button",
												onClick: () => w("cli"),
												children: "LLM CLI"
											}), /* @__PURE__ */ (0, m.jsx)("button", {
												className: C === "api" ? "active" : "",
												type: "button",
												onClick: () => w("api"),
												children: "LLM API"
											})]
										})]
									})]
								})
							}),
							/* @__PURE__ */ (0, m.jsx)("fieldset", {
								className: "settings-agent-controls",
								disabled: !x,
								children: C === "cli" ? /* @__PURE__ */ (0, m.jsxs)(m.Fragment, { children: [/* @__PURE__ */ (0, m.jsxs)("div", {
									className: "settings-grid",
									children: [/* @__PURE__ */ (0, m.jsxs)("label", {
										className: "field",
										children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "사용할 CLI" }), /* @__PURE__ */ (0, m.jsx)("select", {
											value: T,
											onChange: (e) => E(e.currentTarget.value),
											children: (se.length ? se : [
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
											]).map((e) => /* @__PURE__ */ (0, m.jsx)("option", {
												value: e.id,
												children: e.label || e.id
											}, e.id))
										})]
									}), /* @__PURE__ */ (0, m.jsxs)("label", {
										className: "field",
										children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "모델" }), /* @__PURE__ */ (0, m.jsx)("select", {
											value: D,
											onChange: (e) => O(e.currentTarget.value),
											children: ce.length ? ce.map((e) => /* @__PURE__ */ (0, m.jsx)("option", {
												value: e.value,
												children: e.label
											}, e.value)) : /* @__PURE__ */ (0, m.jsx)("option", {
												value: "",
												children: "모델 목록 없음"
											})
										})]
									})]
								}), /* @__PURE__ */ (0, m.jsx)("div", {
									className: "cli-provider-list",
									"aria-live": "polite",
									children: se.map((e) => /* @__PURE__ */ (0, m.jsxs)("div", {
										className: "cli-provider-row",
										children: [/* @__PURE__ */ (0, m.jsxs)("div", {
											className: "cli-provider-main",
											children: [/* @__PURE__ */ (0, m.jsxs)("div", {
												className: "cli-provider-head",
												children: [/* @__PURE__ */ (0, m.jsx)("strong", { children: e.label || e.id }), /* @__PURE__ */ (0, m.jsx)("span", {
													className: `cli-status-chip ${Ai(e)}`,
													children: ki(e)
												})]
											}), /* @__PURE__ */ (0, m.jsx)("div", {
												className: "cli-provider-meta",
												children: e.bridgeSupported === !1 ? e.error || "현재 환경에서 사용할 수 없습니다." : e.model || "모델 미설정"
											})]
										}), e.docsUrl && /* @__PURE__ */ (0, m.jsx)("a", {
											className: "filter-btn",
											href: e.docsUrl,
											target: "_blank",
											rel: "noreferrer",
											children: "문서"
										})]
									}, e.id))
								})] }) : /* @__PURE__ */ (0, m.jsxs)(m.Fragment, { children: [
									/* @__PURE__ */ (0, m.jsxs)("label", {
										className: "field",
										children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "API 제공자" }), /* @__PURE__ */ (0, m.jsxs)("select", {
											value: h,
											onChange: (e) => g(Di(e.currentTarget.value)),
											children: [
												/* @__PURE__ */ (0, m.jsx)("option", {
													value: "openai",
													children: "GPT / OpenAI"
												}),
												/* @__PURE__ */ (0, m.jsx)("option", {
													value: "gemini",
													children: "Gemini / Google"
												}),
												/* @__PURE__ */ (0, m.jsx)("option", {
													value: "claude",
													children: "Claude / Anthropic"
												})
											]
										})]
									}),
									/* @__PURE__ */ (0, m.jsxs)("div", {
										className: "settings-grid",
										children: [/* @__PURE__ */ (0, m.jsxs)("label", {
											className: "field",
											children: [/* @__PURE__ */ (0, m.jsxs)("span", { children: [ae.name, " API Key"] }), /* @__PURE__ */ (0, m.jsx)("input", {
												value: _,
												onChange: (e) => v(e.currentTarget.value),
												type: "password",
												autoComplete: "off",
												placeholder: ie.hasApiKey ? `${ie.apiKeyMasked} 저장됨` : ae.key
											})]
										}), /* @__PURE__ */ (0, m.jsxs)("label", {
											className: "field",
											children: [/* @__PURE__ */ (0, m.jsxs)("span", { children: [ae.name, " Model"] }), /* @__PURE__ */ (0, m.jsx)("select", {
												value: y,
												onChange: (e) => b(e.currentTarget.value),
												children: oe.length ? oe.map((e) => /* @__PURE__ */ (0, m.jsx)("option", {
													value: e.value,
													children: e.label
												}, e.value)) : /* @__PURE__ */ (0, m.jsx)("option", {
													value: "",
													children: "모델 목록 없음"
												})
											})]
										})]
									}),
									/* @__PURE__ */ (0, m.jsx)("div", {
										className: "cli-provider-list",
										"aria-live": "polite",
										children: ve.map(({ providerId: e, row: t, label: n, className: r, detail: i }) => /* @__PURE__ */ (0, m.jsxs)("div", {
											className: "cli-provider-row",
											children: [/* @__PURE__ */ (0, m.jsxs)("div", {
												className: "cli-provider-main",
												children: [/* @__PURE__ */ (0, m.jsxs)("div", {
													className: "cli-provider-head",
													children: [/* @__PURE__ */ (0, m.jsx)("strong", { children: t.label || Ei[e].name }), /* @__PURE__ */ (0, m.jsx)("span", {
														className: `cli-status-chip ${r}`,
														children: n
													})]
												}), /* @__PURE__ */ (0, m.jsx)("div", {
													className: "cli-provider-meta",
													children: i
												})]
											}), /* @__PURE__ */ (0, m.jsxs)("div", {
												className: "cli-provider-actions",
												children: [/* @__PURE__ */ (0, m.jsx)("button", {
													className: "filter-btn",
													type: "button",
													disabled: !t.hasApiKey || !!P[e]?.checking,
													onClick: () => pe(e),
													children: "연결 확인"
												}), t.setupUrl && /* @__PURE__ */ (0, m.jsx)("a", {
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
							/* @__PURE__ */ (0, m.jsxs)("div", {
								className: "filter-actions settings-actions",
								children: [/* @__PURE__ */ (0, m.jsx)("button", {
									className: "filter-btn apply",
									type: "button",
									onClick: fe,
									disabled: V === "agent",
									children: "AI Agent 설정 저장"
								}), /* @__PURE__ */ (0, m.jsx)("button", {
									className: "filter-btn clear",
									type: "button",
									onClick: () => le(!0),
									disabled: V === "load",
									children: "모델/상태 새로고침"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, m.jsxs)("section", {
						className: "settings-panel input-panel",
						children: [
							/* @__PURE__ */ (0, m.jsxs)("div", {
								className: "input-panel-header",
								children: [/* @__PURE__ */ (0, m.jsx)("h3", { children: "API 연동" }), /* @__PURE__ */ (0, m.jsx)("p", { children: "외부 데이터 API 키를 설정합니다." })]
							}),
							/* @__PURE__ */ (0, m.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, m.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "FRED API Key" }), /* @__PURE__ */ (0, m.jsx)("input", {
										value: k.fred,
										onChange: (e) => A({
											...k,
											fred: e.currentTarget.value
										}),
										type: "password",
										autoComplete: "off",
										placeholder: r?.fred?.hasApiKey ? `${r.fred.apiKeyMasked} 저장됨` : "FRED API 키"
									})]
								}), /* @__PURE__ */ (0, m.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "FRED 상태" }), /* @__PURE__ */ (0, m.jsx)("p", {
										className: "section-subtitle",
										children: Oi(r?.fred?.hasApiKey, r?.fred?.apiKeyMasked, "딥 리서치 미국 경제지표용 FRED API 키가 없습니다.", "FRED API 키")
									})]
								})]
							}),
							/* @__PURE__ */ (0, m.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, m.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "BOK API Key" }), /* @__PURE__ */ (0, m.jsx)("input", {
										value: k.bok,
										onChange: (e) => A({
											...k,
											bok: e.currentTarget.value
										}),
										type: "password",
										autoComplete: "off",
										placeholder: r?.bok?.hasApiKey ? `${r.bok.apiKeyMasked} 저장됨` : "BOK ECOS API 키"
									})]
								}), /* @__PURE__ */ (0, m.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "BOK 상태" }), /* @__PURE__ */ (0, m.jsx)("p", {
										className: "section-subtitle",
										children: Oi(r?.bok?.hasApiKey, r?.bok?.apiKeyMasked, "딥 리서치 한국 경제지표용 BOK API 키가 없습니다.", "BOK API 키")
									})]
								})]
							}),
							/* @__PURE__ */ (0, m.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, m.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "DART API Key" }), /* @__PURE__ */ (0, m.jsx)("input", {
										value: k.dart,
										onChange: (e) => A({
											...k,
											dart: e.currentTarget.value
										}),
										type: "password",
										autoComplete: "off",
										placeholder: r?.dart?.hasApiKey ? `${r.dart.apiKeyMasked} 저장됨` : "OpenDART API 키"
									})]
								}), /* @__PURE__ */ (0, m.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "DART 상태" }), /* @__PURE__ */ (0, m.jsx)("p", {
										className: "section-subtitle",
										children: Oi(r?.dart?.hasApiKey, r?.dart?.apiKeyMasked, "국내 기업 분석용 DART API 키가 없습니다.", "DART API 키")
									})]
								})]
							}),
							/* @__PURE__ */ (0, m.jsx)("div", {
								className: "filter-actions settings-actions",
								children: /* @__PURE__ */ (0, m.jsx)("button", {
									className: "filter-btn apply",
									type: "button",
									onClick: me,
									disabled: V === "api",
									children: "API 설정 저장"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, m.jsxs)("section", {
						className: "settings-panel input-panel",
						children: [
							/* @__PURE__ */ (0, m.jsxs)("div", {
								className: "input-panel-header",
								children: [/* @__PURE__ */ (0, m.jsx)("h3", { children: "Notion 연동" }), /* @__PURE__ */ (0, m.jsx)("p", { children: "브리핑과 보고서를 Notion 데이터베이스로 내보냅니다." })]
							}),
							/* @__PURE__ */ (0, m.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, m.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "Notion 통합 토큰" }), /* @__PURE__ */ (0, m.jsx)("input", {
										value: j.token,
										onChange: (e) => M({
											...j,
											token: e.currentTarget.value
										}),
										type: "password",
										autoComplete: "off",
										placeholder: r?.notion?.hasToken ? `${r.notion.tokenMasked} 저장됨` : "ntn_..."
									})]
								}), /* @__PURE__ */ (0, m.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "토큰 상태" }), /* @__PURE__ */ (0, m.jsx)("p", {
										className: "section-subtitle",
										children: r?.notion?.hasToken ? `토큰 저장됨: ${r.notion.tokenMasked}` : "Notion 통합 토큰이 없습니다."
									})]
								})]
							}),
							/* @__PURE__ */ (0, m.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, m.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "데이터베이스 ID" }), /* @__PURE__ */ (0, m.jsx)("input", {
										value: j.dbId,
										onChange: (e) => M({
											...j,
											dbId: e.currentTarget.value
										}),
										placeholder: "32자리 Database ID"
									})]
								}), /* @__PURE__ */ (0, m.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "DB 상태" }), /* @__PURE__ */ (0, m.jsx)("p", {
										className: "section-subtitle",
										children: r?.notion?.hasDb ? `DB 저장됨: ${r.notion.dbIdMasked}` : "Notion 데이터베이스 ID가 없습니다."
									})]
								})]
							}),
							/* @__PURE__ */ (0, m.jsx)("div", {
								className: "filter-actions settings-actions",
								children: /* @__PURE__ */ (0, m.jsx)("button", {
									className: "filter-btn apply",
									type: "button",
									onClick: he,
									disabled: V === "notion",
									children: "Notion 설정 저장"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, m.jsxs)("section", {
						className: "settings-panel input-panel",
						children: [
							/* @__PURE__ */ (0, m.jsxs)("div", {
								className: "input-panel-header",
								children: [/* @__PURE__ */ (0, m.jsx)("h3", { children: "Obsidian 연동" }), /* @__PURE__ */ (0, m.jsx)("p", { children: "원하면 Obsidian Vault로 보고서와 노트를 내보낼 수 있습니다." })]
							}),
							/* @__PURE__ */ (0, m.jsxs)("div", {
								className: "settings-grid",
								children: [/* @__PURE__ */ (0, m.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "Vault 폴더 경로" }), /* @__PURE__ */ (0, m.jsx)("input", {
										value: ee,
										onChange: (e) => N(e.currentTarget.value),
										type: "text",
										placeholder: "C:\\Users\\username\\Documents\\MyVault"
									})]
								}), /* @__PURE__ */ (0, m.jsxs)("div", {
									className: "field",
									children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "경로 상태" }), /* @__PURE__ */ (0, m.jsx)("p", {
										className: "section-subtitle",
										children: l.vaultPath ? `설정됨: ${l.vaultPath}` : "Vault 경로가 설정되지 않았습니다."
									})]
								})]
							}),
							/* @__PURE__ */ (0, m.jsx)("div", {
								className: "filter-actions settings-actions",
								children: /* @__PURE__ */ (0, m.jsx)("button", {
									className: "filter-btn apply",
									type: "button",
									onClick: ge,
									disabled: V === "obsidian",
									children: "Obsidian 설정 저장"
								})
							})
						]
					})
				]
			}) : /* @__PURE__ */ (0, m.jsxs)("div", {
				id: "settings-admin",
				className: "sub-tab-panel active",
				children: [/* @__PURE__ */ (0, m.jsxs)("section", {
					className: "settings-panel input-panel",
					children: [
						/* @__PURE__ */ (0, m.jsxs)("div", {
							className: "input-panel-header",
							children: [/* @__PURE__ */ (0, m.jsx)("h3", { children: "자동화" }), /* @__PURE__ */ (0, m.jsx)("p", { children: "수집, 중기 시장 정리, 브리핑 생성을 각각 독립 루틴으로 관리합니다." })]
						}),
						/* @__PURE__ */ (0, m.jsxs)("div", {
							className: "automation-routines",
							children: [
								/* @__PURE__ */ (0, m.jsxs)("section", {
									className: "automation-card",
									children: [
										/* @__PURE__ */ (0, m.jsxs)("div", {
											className: "automation-card-head",
											children: [/* @__PURE__ */ (0, m.jsxs)("div", { children: [
												/* @__PURE__ */ (0, m.jsx)("span", { children: "RSS Collection" }),
												/* @__PURE__ */ (0, m.jsx)("strong", { children: "RSS 수집" }),
												/* @__PURE__ */ (0, m.jsx)("p", { children: "뉴스 피드를 정해진 간격으로 가져와 research inbox와 인덱스에 반영합니다." })
											] }), /* @__PURE__ */ (0, m.jsx)(ji, {
												checked: !!s.rss?.enabled,
												onChange: (e) => c({
													...s,
													rss: {
														...s.rss,
														enabled: e
													}
												}),
												compact: !0
											})]
										}),
										/* @__PURE__ */ (0, m.jsxs)("label", {
											className: "field",
											children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "수집 간격" }), /* @__PURE__ */ (0, m.jsxs)("select", {
												value: String(s.rss?.intervalMinutes || 60),
												onChange: (e) => c({
													...s,
													rss: {
														...s.rss,
														intervalMinutes: e.currentTarget.value
													}
												}),
												children: [
													/* @__PURE__ */ (0, m.jsx)("option", {
														value: "15",
														children: "15분마다"
													}),
													/* @__PURE__ */ (0, m.jsx)("option", {
														value: "30",
														children: "30분마다"
													}),
													/* @__PURE__ */ (0, m.jsx)("option", {
														value: "60",
														children: "1시간마다"
													}),
													/* @__PURE__ */ (0, m.jsx)("option", {
														value: "180",
														children: "3시간마다"
													})
												]
											})]
										}),
										/* @__PURE__ */ (0, m.jsxs)("div", {
											className: "automation-inline-switch",
											children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "기사 전문 저장 (무료 공개 본문만, 로컬 보관용)" }), /* @__PURE__ */ (0, m.jsx)(ji, {
												checked: s.rss?.saveFullText !== !1,
												onChange: (e) => c({
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
								/* @__PURE__ */ (0, m.jsxs)("section", {
									className: "automation-card",
									children: [
										/* @__PURE__ */ (0, m.jsxs)("div", {
											className: "automation-card-head",
											children: [/* @__PURE__ */ (0, m.jsxs)("div", { children: [
												/* @__PURE__ */ (0, m.jsx)("span", { children: "Market Memory" }),
												/* @__PURE__ */ (0, m.jsx)("strong", { children: "시장 메모리 업데이트" }),
												/* @__PURE__ */ (0, m.jsx)("p", { children: "최근 RSS와 시장 자료를 중기 시장 판단용 컨텍스트로 정리합니다." })
											] }), /* @__PURE__ */ (0, m.jsx)(ji, {
												checked: !!s.marketMemory?.enabled,
												onChange: (e) => c({
													...s,
													marketMemory: {
														...s.marketMemory,
														enabled: e
													}
												}),
												compact: !0
											})]
										}),
										/* @__PURE__ */ (0, m.jsxs)("label", {
											className: "field",
											children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "정리 간격" }), /* @__PURE__ */ (0, m.jsxs)("select", {
												value: String(s.marketMemory?.intervalMinutes || 1440),
												onChange: (e) => c({
													...s,
													marketMemory: {
														...s.marketMemory,
														intervalMinutes: e.currentTarget.value
													}
												}),
												children: [
													/* @__PURE__ */ (0, m.jsx)("option", {
														value: "720",
														children: "12시간마다"
													}),
													/* @__PURE__ */ (0, m.jsx)("option", {
														value: "1440",
														children: "하루마다"
													}),
													/* @__PURE__ */ (0, m.jsx)("option", {
														value: "2880",
														children: "이틀마다"
													}),
													/* @__PURE__ */ (0, m.jsx)("option", {
														value: "10080",
														children: "일주일마다"
													})
												]
											})]
										}),
										/* @__PURE__ */ (0, m.jsxs)("div", {
											className: "automation-inline-switch",
											children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "RSS 수집 직후에도 정리" }), /* @__PURE__ */ (0, m.jsx)(ji, {
												checked: !!s.marketMemory?.runAfterRss,
												onChange: (e) => c({
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
								/* @__PURE__ */ (0, m.jsxs)("section", {
									className: "automation-card",
									children: [
										/* @__PURE__ */ (0, m.jsxs)("div", {
											className: "automation-card-head",
											children: [/* @__PURE__ */ (0, m.jsxs)("div", { children: [
												/* @__PURE__ */ (0, m.jsx)("span", { children: "Daily Briefing" }),
												/* @__PURE__ */ (0, m.jsx)("strong", { children: "브리핑 생성" }),
												/* @__PURE__ */ (0, m.jsx)("p", { children: "지정한 시각에 RSS와 Market Memory를 반영해 일일 브리핑을 생성합니다." })
											] }), /* @__PURE__ */ (0, m.jsx)(ji, {
												checked: !!s.briefing?.enabled,
												onChange: (e) => c({
													...s,
													briefing: {
														...s.briefing,
														enabled: e
													}
												}),
												compact: !0
											})]
										}),
										/* @__PURE__ */ (0, m.jsxs)("div", {
											className: "settings-grid compact",
											children: [/* @__PURE__ */ (0, m.jsxs)("label", {
												className: "field",
												children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "브리핑 시각" }), /* @__PURE__ */ (0, m.jsx)("input", {
													value: s.briefing?.time || "08:00",
													onChange: (e) => c({
														...s,
														briefing: {
															...s.briefing,
															time: e.currentTarget.value
														}
													}),
													type: "time"
												})]
											}), /* @__PURE__ */ (0, m.jsxs)("label", {
												className: "field",
												children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "시장 범위" }), /* @__PURE__ */ (0, m.jsxs)("select", {
													value: s.briefing?.marketScope || "both",
													onChange: (e) => c({
														...s,
														briefing: {
															...s.briefing,
															marketScope: e.currentTarget.value
														}
													}),
													children: [
														/* @__PURE__ */ (0, m.jsx)("option", {
															value: "both",
															children: "미국+한국"
														}),
														/* @__PURE__ */ (0, m.jsx)("option", {
															value: "us",
															children: "미국"
														}),
														/* @__PURE__ */ (0, m.jsx)("option", {
															value: "kr",
															children: "한국"
														})
													]
												})]
											})]
										}),
										/* @__PURE__ */ (0, m.jsxs)("div", {
											className: "automation-inline-switch",
											children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "브리핑 전 RSS/Memory 실행" }), /* @__PURE__ */ (0, m.jsx)(ji, {
												checked: !!s.briefing?.runPrerequisites,
												onChange: (e) => c({
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
						/* @__PURE__ */ (0, m.jsx)("div", {
							className: "filter-actions settings-actions",
							children: /* @__PURE__ */ (0, m.jsx)("button", {
								className: "filter-btn apply",
								type: "button",
								onClick: _e,
								disabled: V === "automation",
								children: "자동화 저장"
							})
						})
					]
				}), /* @__PURE__ */ (0, m.jsxs)("section", {
					className: "settings-panel input-panel",
					children: [
						/* @__PURE__ */ (0, m.jsxs)("div", {
							className: "input-panel-header",
							children: [/* @__PURE__ */ (0, m.jsxs)("div", { children: [/* @__PURE__ */ (0, m.jsx)("h3", { children: "캐시 관리" }), /* @__PURE__ */ (0, m.jsx)("p", { children: "기업 분석용 SEC/DART per-company 캐시 중 오래된 항목만 정리합니다. 공통 ticker/corpCode 목록은 삭제하지 않습니다." })] }), /* @__PURE__ */ (0, m.jsx)("button", {
								className: "filter-btn clear",
								type: "button",
								onClick: ue,
								disabled: V === "cache",
								children: V === "cache" ? "확인 중" : "상태 확인"
							})]
						}),
						/* @__PURE__ */ (0, m.jsxs)("div", {
							className: "cache-summary",
							children: [/* @__PURE__ */ (0, m.jsxs)("section", { children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "전체 캐시" }), /* @__PURE__ */ (0, m.jsx)("strong", { children: d ? `${d.total_mb || 0} MB` : "상태 미확인" })] }), /* @__PURE__ */ (0, m.jsxs)("section", { children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "정리 대상" }), /* @__PURE__ */ (0, m.jsx)("strong", { children: d ? `${d.stale_mb || 0} MB` : "상태 미확인" })] })]
						}),
						d?.stats?.length ? /* @__PURE__ */ (0, m.jsx)("div", {
							className: "cache-list",
							children: d.stats.map((e) => /* @__PURE__ */ (0, m.jsxs)("div", {
								className: "cache-row",
								children: [
									/* @__PURE__ */ (0, m.jsx)("strong", { children: e.directory }),
									/* @__PURE__ */ (0, m.jsxs)("span", { children: [
										e.files || 0,
										"개 · ",
										e.total_mb || 0,
										"MB"
									] }),
									/* @__PURE__ */ (0, m.jsxs)("small", { children: [
										"오래된 항목 ",
										e.stale_files || 0,
										"개 · 보관 ",
										e.max_age_days || 0,
										"일"
									] })
								]
							}, e.directory || "cache"))
						}) : /* @__PURE__ */ (0, m.jsx)("p", {
							className: "section-subtitle",
							children: "상태 확인을 누르면 캐시 사용량을 확인합니다."
						}),
						/* @__PURE__ */ (0, m.jsx)("div", {
							className: "filter-actions settings-actions",
							children: /* @__PURE__ */ (0, m.jsx)("button", {
								className: "filter-btn apply",
								type: "button",
								onClick: de,
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
function Pi(e) {
	let t = /* @__PURE__ */ new Set();
	return e.map((e) => String(e || "").trim()).filter(Boolean).filter((e) => {
		let n = e.toLowerCase();
		return t.has(n) ? !1 : (t.add(n), !0);
	});
}
function Fi(e) {
	return e.ticker || e.item || "";
}
function Ii(e) {
	return e.companyName || e.name || e.item || Fi(e);
}
function Li(e, t = "") {
	return e?.company?.name || e?.item || t || "상세 보기";
}
function Ri(e) {
	if (!e) return "상세 정보를 불러오는 중입니다.";
	let t = e.company || {};
	return [
		t.ticker || "",
		t.market || "",
		t.tradingViewSymbol || "",
		e.newsCount ? `${e.newsCount}개 뉴스` : ""
	].filter(Boolean).join(" · ") || "확인된 심볼 정보가 없습니다.";
}
function zi(e = []) {
	return [...e].sort((e, t) => String(t.date || "").localeCompare(String(e.date || "")));
}
function Bi(e) {
	return e.title || e.url || e.path || "자료";
}
function Vi(e) {
	return [e.source, e.date].filter(Boolean).join(" · ");
}
function Hi(e) {
	window.location.hash = e ? `#/watchlist/${encodeURIComponent(e)}` : "#/watchlist";
}
function K() {
	let e = window.location.hash.match(/^#\/?watchlist\/(.+)$/);
	return e ? decodeURIComponent(e[1]) : "";
}
function q() {
	return window.location.hash.replace(/^#\/?/, "").split("/")[0] === "watchlist";
}
function Ui() {
	let [e, t] = (0, p.useState)([]), [n, r] = (0, p.useState)([]), [i, a] = (0, p.useState)(""), [o, s] = (0, p.useState)(() => K()), [c, l] = (0, p.useState)(null), [u, d] = (0, p.useState)(!1), [f, h] = (0, p.useState)(!1), [g, _] = (0, p.useState)(!1), [v, y] = (0, p.useState)(""), [b, x] = (0, p.useState)(""), S = (0, p.useRef)(null), C = (0, p.useCallback)(async (e) => {
		if (!e.length) {
			r([]);
			return;
		}
		let t = await F("/api/watchlist/overview");
		r(Array.isArray(t.items) ? t.items : []);
	}, []), w = (0, p.useCallback)(async () => {
		d(!0), y("");
		try {
			let e = await F("/api/watchlist"), n = Pi(Array.isArray(e) ? e : []);
			t(n), await C(n), L({
				surface: "watchlist",
				viewId: "watchlist",
				reportKind: "",
				reportId: ""
			});
		} catch (e) {
			y(e instanceof Error ? e.message : "워치리스트를 불러오지 못했습니다.");
		} finally {
			d(!1);
		}
	}, [C]);
	(0, p.useEffect)(() => {
		w();
	}, [w]), (0, p.useEffect)(() => {
		let e = () => {
			q() && s(K());
		};
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []), (0, p.useEffect)(() => {
		let e = !0;
		async function t(t) {
			h(!0), y(""), l({ item: t }), L({
				surface: "watchlist_detail",
				viewId: "watchlist",
				reportKind: "watchlist",
				reportId: t,
				marketScope: ""
			});
			try {
				let n = await F(`/api/watchlist/detail?item=${encodeURIComponent(t)}&limit=12`);
				if (!e) return;
				l(n);
			} catch (t) {
				if (!e) return;
				y(t instanceof Error ? t.message : "상세 정보를 불러오지 못했습니다.");
			} finally {
				e && h(!1);
			}
		}
		return o ? t(o) : (l(null), L({
			surface: "watchlist",
			viewId: "watchlist",
			reportKind: "",
			reportId: ""
		})), () => {
			e = !1;
		};
	}, [o]), (0, p.useEffect)(() => {
		let e = S.current;
		if (!(!e || !c || f)) return window.FolioTradingViewWidgets?.cleanup?.(e), e.innerHTML = "<div class=\"tradingview-widget-unavailable\">TradingView 위젯을 준비하는 중입니다.</div>", window.FolioTradingViewWidgets?.renderWatchlistDetail?.(e, c), () => {
			window.FolioTradingViewWidgets?.cleanup?.(e);
		};
	}, [c, f]);
	async function T(e, n) {
		_(!0), y("");
		try {
			let r = await I("/api/watchlist", { items: e }), i = Pi(Array.isArray(r) ? r : []);
			t(i), await C(i), n && x(n);
		} catch (e) {
			y(e instanceof Error ? e.message : "워치리스트 저장에 실패했습니다.");
		} finally {
			_(!1);
		}
	}
	async function E(e) {
		try {
			return (await F(`/api/watchlist/resolve?keyword=${encodeURIComponent(e)}`)).keyword || e;
		} catch {
			return e;
		}
	}
	async function D() {
		let t = i.split(/[,;\n]/).map((e) => e.trim()).filter(Boolean);
		if (!t.length) return;
		let n = [...e];
		for (let e of t) {
			let t = await E(e);
			t && !n.some((e) => e.toLowerCase() === t.toLowerCase()) && n.push(t);
		}
		a(""), n.length !== e.length && await T(n, "워치리스트에 추가했습니다.");
	}
	async function O(t) {
		await T(e.filter((e) => e !== t), "워치리스트에서 삭제했습니다."), o === t && Hi();
	}
	let k = (0, p.useMemo)(() => zi(c?.news || []), [c]), A = Li(c, o);
	return o ? /* @__PURE__ */ (0, m.jsx)("div", {
		className: "react-watchlist-route",
		"data-watchlist-route": !0,
		children: /* @__PURE__ */ (0, m.jsxs)("div", {
			className: "watchlist-detail-inline",
			children: [/* @__PURE__ */ (0, m.jsxs)("nav", {
				className: "reader-breadcrumb",
				"aria-label": "현재 위치",
				children: [
					/* @__PURE__ */ (0, m.jsx)("button", {
						type: "button",
						className: "reader-crumb-link",
						onClick: () => Hi(),
						children: "워치리스트"
					}),
					/* @__PURE__ */ (0, m.jsx)("span", {
						className: "reader-breadcrumb-sep",
						"aria-hidden": "true",
						children: "›"
					}),
					/* @__PURE__ */ (0, m.jsx)("span", {
						className: "reader-breadcrumb-leaf",
						children: A
					})
				]
			}), /* @__PURE__ */ (0, m.jsxs)("section", {
				className: "watchlist-detail-dialog",
				role: "region",
				"aria-labelledby": "watchlistDetailTitle",
				children: [
					/* @__PURE__ */ (0, m.jsxs)("div", {
						className: "watchlist-detail-head",
						children: [/* @__PURE__ */ (0, m.jsxs)("div", { children: [
							/* @__PURE__ */ (0, m.jsx)("p", {
								className: "section-kicker",
								children: "WATCHLIST"
							}),
							/* @__PURE__ */ (0, m.jsx)("h2", {
								id: "watchlistDetailTitle",
								children: A
							}),
							/* @__PURE__ */ (0, m.jsx)("p", {
								className: "section-subtitle",
								children: Ri(c)
							})
						] }), /* @__PURE__ */ (0, m.jsxs)("div", {
							className: "watchlist-detail-actions",
							children: [/* @__PURE__ */ (0, m.jsx)("button", {
								type: "button",
								className: "filter-btn clear",
								onClick: () => R({
									surface: "watchlist_detail",
									reportKind: "watchlist",
									reportId: o
								}),
								children: "Agent에게 묻기"
							}), /* @__PURE__ */ (0, m.jsx)("button", {
								className: "icon-btn",
								type: "button",
								"aria-label": "닫기",
								"data-tooltip": "닫기",
								"data-tooltip-pos": "left",
								onClick: () => Hi(),
								children: "×"
							})]
						})]
					}),
					v && /* @__PURE__ */ (0, m.jsx)("p", {
						className: "react-dashboard-error",
						children: v
					}),
					/* @__PURE__ */ (0, m.jsx)("div", {
						ref: S,
						className: "watchlist-detail-widgets",
						children: /* @__PURE__ */ (0, m.jsx)("div", {
							className: "tradingview-widget-unavailable",
							children: "TradingView 위젯을 준비하는 중입니다."
						})
					}),
					/* @__PURE__ */ (0, m.jsxs)("div", {
						className: "watchlist-detail-news",
						children: [/* @__PURE__ */ (0, m.jsx)("h3", { children: "수집한 뉴스" }), f ? /* @__PURE__ */ (0, m.jsx)("p", {
							className: "section-subtitle",
							children: "관련 뉴스를 불러오는 중입니다."
						}) : k.length ? /* @__PURE__ */ (0, m.jsx)("div", {
							className: "watchlist-detail-news-list",
							children: k.map((e, t) => /* @__PURE__ */ (0, m.jsxs)("article", {
								className: "compact-item",
								children: [
									/* @__PURE__ */ (0, m.jsx)("div", {
										className: "meta",
										children: Vi(e)
									}),
									/* @__PURE__ */ (0, m.jsx)("h4", { children: e.url ? /* @__PURE__ */ (0, m.jsx)("a", {
										href: e.url,
										target: "_blank",
										rel: "noopener noreferrer",
										children: Bi(e)
									}) : /* @__PURE__ */ (0, m.jsx)("span", { children: Bi(e) }) }),
									e.snippet && /* @__PURE__ */ (0, m.jsx)("p", { children: e.snippet })
								]
							}, `${Bi(e)}-${t}`))
						}) : /* @__PURE__ */ (0, m.jsx)("p", {
							className: "section-subtitle",
							children: "수집된 관련 뉴스가 없습니다."
						})]
					})
				]
			})]
		})
	}) : /* @__PURE__ */ (0, m.jsxs)("div", {
		className: "react-watchlist-route",
		"data-watchlist-route": !0,
		children: [
			/* @__PURE__ */ (0, m.jsx)(He, {
				eyebrow: "Watchlist",
				title: "워치리스트",
				description: "관심 기업, 섹터, 테마를 추적하고 관련 뉴스와 시장 반응을 확인합니다.",
				actions: /* @__PURE__ */ (0, m.jsxs)("div", {
					className: "brief-controls",
					children: [/* @__PURE__ */ (0, m.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						onClick: w,
						disabled: u,
						children: u ? "불러오는 중" : "다시 읽기"
					}), /* @__PURE__ */ (0, m.jsx)("button", {
						className: "filter-btn apply",
						type: "button",
						onClick: () => T(e, "워치리스트를 저장했습니다."),
						disabled: g,
						children: g ? "저장 중" : "저장"
					})]
				})
			}),
			/* @__PURE__ */ (0, m.jsxs)("div", {
				className: "watchlist-editor input-panel",
				children: [
					/* @__PURE__ */ (0, m.jsxs)("div", {
						className: "input-panel-header",
						children: [/* @__PURE__ */ (0, m.jsx)("h3", { children: "키워드 추가" }), /* @__PURE__ */ (0, m.jsx)("p", { children: "관심 기업, 섹터, 테마를 하나씩 추가해 뉴스와 브리핑 추적 범위를 관리합니다." })]
					}),
					/* @__PURE__ */ (0, m.jsx)("input", {
						value: i,
						onChange: (e) => a(e.currentTarget.value),
						onKeyDown: (e) => {
							e.key === "Enter" && (e.preventDefault(), D());
						},
						placeholder: "예: NVDA, 삼성전자, AI"
					}),
					/* @__PURE__ */ (0, m.jsx)("button", {
						className: "filter-btn clear",
						type: "button",
						onClick: D,
						disabled: g,
						children: "추가"
					})
				]
			}),
			v && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "react-dashboard-error",
				children: v
			}),
			b && /* @__PURE__ */ (0, m.jsx)("p", {
				className: "react-dashboard-warning",
				children: b
			}),
			/* @__PURE__ */ (0, m.jsx)("div", {
				className: "watchlist-grid",
				children: n.length ? n.map((e) => {
					let t = e.item || Ii(e);
					return /* @__PURE__ */ (0, m.jsxs)("article", {
						className: "watchlist-card",
						"data-watchlist-detail-item": t,
						tabIndex: 0,
						role: "button",
						"aria-label": `${t} 상세 보기`,
						onClick: () => Hi(t),
						onKeyDown: (e) => {
							(e.key === "Enter" || e.key === " ") && (e.preventDefault(), Hi(t));
						},
						children: [
							/* @__PURE__ */ (0, m.jsx)("span", {
								className: "watchlist-card-accent",
								"aria-hidden": "true"
							}),
							/* @__PURE__ */ (0, m.jsx)("button", {
								className: "watchlist-card-delete",
								type: "button",
								"aria-label": `${t} 워치리스트에서 삭제`,
								"data-tooltip": "삭제",
								onClick: (e) => {
									e.stopPropagation(), O(t);
								},
								children: /* @__PURE__ */ (0, m.jsx)("svg", {
									width: "13",
									height: "13",
									viewBox: "0 0 16 16",
									fill: "none",
									stroke: "currentColor",
									strokeWidth: "1.4",
									strokeLinecap: "round",
									strokeLinejoin: "round",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, m.jsx)("path", { d: "M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5L11 4" })
								})
							}),
							/* @__PURE__ */ (0, m.jsxs)("div", {
								className: "watchlist-card-top",
								children: [/* @__PURE__ */ (0, m.jsx)("strong", {
									className: "watchlist-ticker",
									children: Fi(e)
								}), /* @__PURE__ */ (0, m.jsx)("h3", { children: Ii(e) })]
							}),
							/* @__PURE__ */ (0, m.jsxs)("div", {
								className: "watchlist-card-meta",
								children: [e.tags?.length ? /* @__PURE__ */ (0, m.jsx)("div", {
									className: "tags",
									children: e.tags.slice(0, 5).map((e) => /* @__PURE__ */ (0, m.jsx)("span", {
										className: "tag",
										children: e
									}, e))
								}) : null, /* @__PURE__ */ (0, m.jsxs)("span", {
									className: "watchlist-news-count",
									children: [e.count || 0, "건"]
								})]
							})
						]
					}, t);
				}) : /* @__PURE__ */ (0, m.jsx)("div", {
					className: "result",
					children: /* @__PURE__ */ (0, m.jsx)("p", { children: "워치리스트 항목을 저장하면 항목별 최신 뉴스 카드가 표시됩니다." })
				})
			})
		]
	});
}
//#endregion
//#region src/app/statusStore.ts
var Wi = {
	statusText: "",
	docCount: "",
	activeJobId: null
};
function Gi() {
	return Wi;
}
function Ki() {
	let [e, t] = (0, p.useState)(() => Gi());
	return (0, p.useEffect)(() => {
		let e = () => t(Gi());
		e();
		let n = window.setInterval(e, 1e3);
		return () => window.clearInterval(n);
	}, []), e;
}
//#endregion
//#region src/app/AppShell.tsx
var qi = [
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
], Ji = {
	office: /* @__PURE__ */ (0, m.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, m.jsx)("path", { d: "M3 20V8l9-5 9 5v12" }), /* @__PURE__ */ (0, m.jsx)("path", { d: "M7 20v-7h10v7M9 9h.01M12 9h.01M15 9h.01" })]
	}),
	home: /* @__PURE__ */ (0, m.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, m.jsx)("path", { d: "M3 10.5 12 3l9 7.5" }), /* @__PURE__ */ (0, m.jsx)("path", { d: "M5 9.5V21h5v-6h4v6h5V9.5" })]
	}),
	dashboard: /* @__PURE__ */ (0, m.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, m.jsx)("rect", {
				x: "3",
				y: "3",
				width: "7",
				height: "8",
				rx: "1.5"
			}),
			/* @__PURE__ */ (0, m.jsx)("rect", {
				x: "14",
				y: "3",
				width: "7",
				height: "5",
				rx: "1.5"
			}),
			/* @__PURE__ */ (0, m.jsx)("rect", {
				x: "14",
				y: "12",
				width: "7",
				height: "9",
				rx: "1.5"
			}),
			/* @__PURE__ */ (0, m.jsx)("rect", {
				x: "3",
				y: "15",
				width: "7",
				height: "6",
				rx: "1.5"
			})
		]
	}),
	briefing: /* @__PURE__ */ (0, m.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, m.jsx)("path", { d: "M4 5h12.5v14H5.5A1.5 1.5 0 0 1 4 17.5z" }),
			/* @__PURE__ */ (0, m.jsx)("path", { d: "M16.5 8H20v9a2 2 0 0 1-2 2h-1.5" }),
			/* @__PURE__ */ (0, m.jsx)("path", { d: "M7.5 9h6" }),
			/* @__PURE__ */ (0, m.jsx)("path", { d: "M7.5 13h6" }),
			/* @__PURE__ */ (0, m.jsx)("path", { d: "M7.5 16.5h3.5" })
		]
	}),
	rss: /* @__PURE__ */ (0, m.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, m.jsx)("path", {
				fill: "currentColor",
				stroke: "none",
				d: "M8 8H6v7c0 1.1.9 2 2 2h9v-2H8V8z"
			}),
			/* @__PURE__ */ (0, m.jsx)("path", {
				fill: "currentColor",
				stroke: "none",
				d: "M20 3h-8c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 8h-8V7h8v4z"
			}),
			/* @__PURE__ */ (0, m.jsx)("path", {
				fill: "currentColor",
				stroke: "none",
				d: "M4 12H2v7c0 1.1.9 2 2 2h9v-2H4v-7z"
			})
		]
	}),
	"market-memory": /* @__PURE__ */ (0, m.jsx)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, m.jsx)("path", { d: "M22 12h-4l-3 8-6-16-3 8H2" })
	}),
	analysis: /* @__PURE__ */ (0, m.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, m.jsx)("path", { d: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" }),
			/* @__PURE__ */ (0, m.jsx)("path", { d: "M14 3v6h6" }),
			/* @__PURE__ */ (0, m.jsx)("path", { d: "M8 17v-3" }),
			/* @__PURE__ */ (0, m.jsx)("path", { d: "M12 17v-6" }),
			/* @__PURE__ */ (0, m.jsx)("path", { d: "M16 17v-4" })
		]
	}),
	"deep-research": /* @__PURE__ */ (0, m.jsx)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, m.jsx)("path", { d: "M14 11H8m2 4H8m8-8H8m12 3.5V6.8c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311C17.72 2 16.88 2 15.2 2H8.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C4 4.28 4 5.12 4 6.8v10.4c0 1.68 0 2.52.327 3.162a3 3 0 0 0 1.311 1.311C6.28 22 7.12 22 8.8 22h2.7M22 22l-1.5-1.5m1-2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0" })
	}),
	watchlist: /* @__PURE__ */ (0, m.jsx)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, m.jsx)("path", { d: "M12 13V7m-3 3h6m4 11V7.8c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311C16.72 3 15.88 3 14.2 3H9.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C5 5.28 5 6.12 5 7.8V21l7-4z" })
	}),
	settings: /* @__PURE__ */ (0, m.jsxs)("svg", {
		className: "react-left-nav-svg",
		viewBox: "0 0 24 24",
		fill: "none",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, m.jsx)("path", { d: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" }), /* @__PURE__ */ (0, m.jsx)("path", { d: "M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06A2 2 0 1 1 7.22 3.43l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.34.4.7.6 1a1.7 1.7 0 0 0 1.1.4H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.1.4c-.17.14-.31.28-.41.2Z" })]
	})
};
function Yi() {
	return window.location.hash || gt(hr());
}
function Xi() {
	let [e, t] = (0, p.useState)(() => Yi());
	return (0, p.useEffect)(() => {
		let e = () => t(Yi());
		return window.addEventListener("hashchange", e), e(), () => window.removeEventListener("hashchange", e);
	}, []), {
		hash: e,
		routeId: ht(e)
	};
}
async function Zi(e) {
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
function Qi() {
	let { hash: e, routeId: t } = Xi(), n = _t(t), r = gr(), i = hr(r.preferences), a = Ki(), [o, s] = (0, p.useState)(() => localStorage.getItem("folio.react.navCollapsed") === "1"), [c, l] = (0, p.useState)(() => localStorage.getItem("folio.react.agentClosed") !== "1"), [u, d] = (0, p.useState)(() => /* @__PURE__ */ new Set([t])), [f, h] = (0, p.useState)(() => ({ [t]: Yi() })), [g, _] = (0, p.useState)(""), [v, y] = (0, p.useState)(!1), b = (0, p.useRef)(null), x = (0, p.useRef)(t), S = (0, p.useRef)({}), C = n.id !== "home" && n.id !== "office", w = (n.id === "home" || n.id === "office") && !r.preferences.home.choiceSeen, T = C && c ? " is-agent-open" : " is-agent-closed";
	(0, p.useEffect)(() => {
		localStorage.setItem("folio.react.navCollapsed", o ? "1" : "0");
	}, [o]), (0, p.useEffect)(() => {
		localStorage.setItem("folio.react.agentClosed", c ? "0" : "1");
	}, [c]), (0, p.useEffect)(() => {
		d((e) => {
			if (e.has(t)) return e;
			let n = new Set(e);
			return n.add(t), n;
		});
	}, [t]), (0, p.useEffect)(() => {
		h((n) => n[t] === e ? n : {
			...n,
			[t]: e
		});
	}, [e, t]), (0, p.useEffect)(() => {
		let e = b.current, n = x.current;
		e && (S.current[n] = e.scrollTop, window.requestAnimationFrame(() => {
			e.scrollTop = S.current[t] || 0;
		})), x.current = t;
	}, [t]), (0, p.useEffect)(() => {
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
			_("서버 재시작 중"), await Zi(_), y(!1);
		}
	}
	function D(e) {
		let t = f[e] || gt(e);
		window.location.hash !== t && (window.location.hash = t);
	}
	function O(e) {
		let t = _t(e);
		return t.id === "office" ? /* @__PURE__ */ (0, m.jsx)(Wr, {}) : t.id === "home" ? /* @__PURE__ */ (0, m.jsx)(ve, {}) : t.id === "dashboard" ? /* @__PURE__ */ (0, m.jsx)(Nn, {}) : t.id === "briefing" ? /* @__PURE__ */ (0, m.jsx)(ft, {}) : t.id === "rss" ? /* @__PURE__ */ (0, m.jsx)(wi, {}) : t.id === "market-memory" ? /* @__PURE__ */ (0, m.jsx)(nr, {}) : t.id === "analysis" ? /* @__PURE__ */ (0, m.jsx)(mn, {}) : t.id === "deep-research" ? /* @__PURE__ */ (0, m.jsx)(Jn, {}) : t.id === "watchlist" ? /* @__PURE__ */ (0, m.jsx)(Ui, {}) : t.id === "settings" ? /* @__PURE__ */ (0, m.jsx)(Ni, {}) : null;
	}
	return /* @__PURE__ */ (0, m.jsxs)("div", {
		className: `react-shell${o ? " is-nav-collapsed" : ""}${T}${C ? "" : " is-agent-suppressed"}`,
		children: [
			/* @__PURE__ */ (0, m.jsxs)("header", {
				className: "react-shell-topbar",
				children: [/* @__PURE__ */ (0, m.jsxs)("button", {
					type: "button",
					className: "react-shell-brand",
					onClick: () => {
						D(i);
					},
					"aria-label": "홈으로 이동",
					children: [/* @__PURE__ */ (0, m.jsx)("span", { children: "Folio OS" }), /* @__PURE__ */ (0, m.jsx)("small", { children: "Investment Workspace" })]
				}), /* @__PURE__ */ (0, m.jsxs)("div", {
					className: "react-shell-status",
					"aria-live": "polite",
					children: [
						/* @__PURE__ */ (0, m.jsx)("span", { children: g || a.statusText || "준비됨" }),
						a.activeJobId && /* @__PURE__ */ (0, m.jsx)("span", { children: a.activeJobId }),
						/* @__PURE__ */ (0, m.jsx)("button", {
							type: "button",
							onClick: E,
							disabled: v,
							children: v ? "재시작 중" : "재시작"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, m.jsxs)("aside", {
				className: "react-shell-nav",
				"aria-label": "주요 화면 탐색",
				children: [/* @__PURE__ */ (0, m.jsx)("button", {
					className: "react-shell-nav-toggle",
					type: "button",
					"aria-label": o ? "좌측 사이드바 펼치기" : "좌측 사이드바 접기",
					"aria-expanded": !o,
					onClick: () => s((e) => !e),
					children: /* @__PURE__ */ (0, m.jsx)("svg", {
						viewBox: "0 0 16 16",
						fill: "none",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, m.jsx)("path", { d: "M10 3.5 L5.5 8 L10 12.5" })
					})
				}), /* @__PURE__ */ (0, m.jsxs)("nav", {
					className: "react-left-nav",
					"aria-label": "Folio OS 화면",
					children: [/* @__PURE__ */ (0, m.jsx)("div", {
						className: "react-left-nav-title",
						children: "Navigate"
					}), qi.map((e) => /* @__PURE__ */ (0, m.jsxs)("section", {
						className: "react-left-nav-group",
						"data-nav-group": e.title,
						children: [/* @__PURE__ */ (0, m.jsx)("h3", { children: e.title }), /* @__PURE__ */ (0, m.jsx)("div", {
							className: "react-left-nav-items",
							children: e.routes.map((t) => {
								let r = e.title === "Home" ? i : t, a = pt.find((e) => e.id === r);
								return a ? /* @__PURE__ */ (0, m.jsxs)("span", {
									className: "react-left-nav-entry",
									children: [e.title === "Home" && a.id === "dashboard" && /* @__PURE__ */ (0, m.jsx)("span", {
										className: "react-left-nav-separator",
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, m.jsxs)("button", {
										type: "button",
										"data-tooltip": a.label,
										className: `react-left-nav-item${a.id === n.id ? " active" : ""}`,
										onClick: () => {
											D(a.id);
										},
										children: [/* @__PURE__ */ (0, m.jsx)("span", {
											className: "react-left-nav-icon",
											"aria-hidden": "true",
											children: Ji[a.id]
										}), /* @__PURE__ */ (0, m.jsx)("span", {
											className: "react-left-nav-label",
											children: a.label
										})]
									})]
								}, a.id) : null;
							})
						})]
					}, e.title))]
				})]
			}),
			/* @__PURE__ */ (0, m.jsx)("main", {
				className: "react-shell-main",
				children: /* @__PURE__ */ (0, m.jsx)("section", {
					className: "react-route-host",
					"data-route": n.id,
					ref: b,
					children: U.filter((e) => u.has(e.id)).map((e) => /* @__PURE__ */ (0, m.jsx)("div", {
						className: "react-route-pane",
						"data-route-pane": e.id,
						hidden: e.id !== n.id,
						children: O(e.id)
					}, e.id))
				})
			}),
			C && /* @__PURE__ */ (0, m.jsx)(fi, {
				surface: `react_${n.id}`,
				open: c,
				onOpen: () => l(!0),
				onClose: () => l(!1)
			}),
			w && /* @__PURE__ */ (0, m.jsx)(Yn, { onChoose: (e) => {
				r.setHome(e, !0), window.location.hash = gt(e);
			} }),
			/* @__PURE__ */ (0, m.jsx)(xt, {})
		]
	});
}
//#endregion
//#region src/app/App.tsx
function $i() {
	return /* @__PURE__ */ (0, m.jsx)(Qi, {});
}
//#endregion
//#region src/main.tsx
var ea = { "market-state": () => /* @__PURE__ */ (0, m.jsx)(wn, {}) };
function ta() {
	document.querySelectorAll("[data-react-island]").forEach((e) => {
		let t = ea[e.dataset.reactIsland || ""];
		!t || e.dataset.reactMounted === "1" || (e.dataset.reactMounted = "1", (0, f.createRoot)(e).render(/* @__PURE__ */ (0, m.jsx)(p.StrictMode, { children: t() })));
	});
}
function na() {
	let e = document.getElementById("folioReactRoot");
	return e ? e.dataset.reactMounted === "1" ? !0 : (e.dataset.reactMounted = "1", (0, f.createRoot)(e).render(/* @__PURE__ */ (0, m.jsx)(p.StrictMode, { children: /* @__PURE__ */ (0, m.jsx)($i, {}) })), !0) : !1;
}
function ra() {
	na(), ta();
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", ra) : ra();
//#endregion
