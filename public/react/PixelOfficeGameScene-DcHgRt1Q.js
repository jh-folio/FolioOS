import { n as e, o as t, s as n, t as r } from "./PixelOfficeScene-Cgnwsh-n.js";
import { A as i, B as a, C as o, E as s, L as c, M as l, N as u, O as d, R as f, S as p, T as m, _ as h, a as g, f as _, i as v, k as y, l as b, m as x, n as S, o as C, p as w, r as T, s as E, t as ee, u as te, v as D, y as ne, z as O } from "./Geometry-DGpI5VLa.js";
import { a as re, c as ie, f as ae, i as oe, n as k, o as se, r as A, s as ce } from "./Filter-DdWkiyJx.js";
import { a as le, i as j, n as ue, o as M, r as de, s as N, t as fe } from "./init-ZyUwQRPo.js";
import { n as P, t as F } from "./Cache-Cgzvv_Ys.js";
import { n as pe, r as I, t as L } from "./canvasUtils-BZeDVeMM.js";
import { t as R } from "./CanvasPool-DULmAjYM.js";
import { a as me, c as he, i as ge, l as _e, n as ve, o as ye, r as be, s as xe, t as z, u as Se } from "./GraphicsContext-DNsdLGQX.js";
import { a as Ce, c as we, d as Te, f as Ee, i as De, l as Oe, m as ke, n as Ae, o as B, p as je, r as Me, t as Ne, u as Pe } from "./RenderTargetSystem-DxXuAFdm.js";
import { a as Fe, c as Ie, d as Le, f as Re, i as ze, l as Be, m as Ve, o as He, p as V, r as Ue, s as We, t as H, u as Ge } from "./GCManagedHash-DosM8O0d.js";
import { t as Ke } from "./getTextureBatchBindGroup-0U455dfl.js";
import { a as qe, c as Je, d as Ye, f as Xe, i as Ze, l as Qe, n as $e, o as et, p as tt, r as nt, s as rt, t as it, u as at } from "./BufferResource-B_glgPai.js";
//#region node_modules/pixi.js/lib/scene/graphics/canvas/CanvasGraphicsAdaptor.mjs
var U = n(), ot = "#808080", st = new u(), ct = new u(), lt = new u(), ut = new u();
function dt(e, t, n) {
	e.beginPath();
	for (let r = 0; r < n.length; r += 3) {
		let i = n[r] * 2, a = n[r + 1] * 2, o = n[r + 2] * 2;
		e.moveTo(t[i], t[i + 1]), e.lineTo(t[a], t[a + 1]), e.lineTo(t[o], t[o + 1]), e.closePath();
	}
	e.fill();
}
function ft(e) {
	return `#${(e & 16777215).toString(16).padStart(6, "0")}`;
}
function pt(e, t, n, r, i, a) {
	a = Math.max(0, Math.min(a, Math.min(r, i) / 2)), e.moveTo(t + a, n), e.lineTo(t + r - a, n), e.quadraticCurveTo(t + r, n, t + r, n + a), e.lineTo(t + r, n + i - a), e.quadraticCurveTo(t + r, n + i, t + r - a, n + i), e.lineTo(t + a, n + i), e.quadraticCurveTo(t, n + i, t, n + i - a), e.lineTo(t, n + a), e.quadraticCurveTo(t, n, t + a, n);
}
function mt(e, t) {
	switch (t.type) {
		case "rectangle": {
			let n = t;
			e.rect(n.x, n.y, n.width, n.height);
			break;
		}
		case "roundedRectangle": {
			let n = t;
			pt(e, n.x, n.y, n.width, n.height, n.radius);
			break;
		}
		case "circle": {
			let n = t;
			e.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
			break;
		}
		case "ellipse": {
			let n = t;
			e.ellipse ? e.ellipse(n.x, n.y, n.halfWidth, n.halfHeight, 0, 0, Math.PI * 2) : (e.save(), e.translate(n.x, n.y), e.scale(n.halfWidth, n.halfHeight), e.arc(0, 0, 1, 0, Math.PI * 2), e.restore());
			break;
		}
		case "triangle": {
			let n = t;
			e.moveTo(n.x, n.y), e.lineTo(n.x2, n.y2), e.lineTo(n.x3, n.y3), e.closePath();
			break;
		}
		default: {
			let n = t, r = n.points;
			if (!r?.length) break;
			e.moveTo(r[0], r[1]);
			for (let t = 2; t < r.length; t += 2) e.lineTo(r[t], r[t + 1]);
			n.closePath && e.closePath();
			break;
		}
	}
}
function ht(e, t) {
	if (!t?.length) return !1;
	for (let n = 0; n < t.length; n++) {
		let r = t[n];
		if (!r?.shape) continue;
		let i = r.transform, a = i && !i.isIdentity();
		a && (e.save(), e.transform(i.a, i.b, i.c, i.d, i.tx, i.ty)), mt(e, r.shape), a && e.restore();
	}
	return !0;
}
function gt(e, t, n, r) {
	let i = e.fill;
	if (i instanceof _e) {
		i.buildGradient();
		let a = i.texture;
		if (a) {
			let o = L.getTintedPattern(a, t), s = n ? ut.copyFrom(n).scale(a.source.pixelWidth, a.source.pixelHeight) : ut.copyFrom(i.transform);
			return r && !e.textureSpace && s.append(r), L.applyPatternTransform(o, s), o;
		}
	}
	if (i instanceof he) {
		let e = L.getTintedPattern(i.texture, t);
		return L.applyPatternTransform(e, i.transform, !1), e;
	}
	let a = e.texture;
	if (a && a !== x.WHITE) {
		if (!a.source.resource) return ot;
		let r = L.getTintedPattern(a, t), i = n ? ut.copyFrom(n).scale(a.source.pixelWidth, a.source.pixelHeight) : e.matrix;
		return L.applyPatternTransform(r, i), r;
	}
	return ft(t);
}
var _t = class {
	constructor() {
		this.shader = null;
	}
	contextChange(e) {}
	execute(e, t) {
		let n = e.renderer, r = n.canvasContext, i = r.activeContext, a = t.groupTransform, s = n.globalUniforms.globalUniformData?.worldColor ?? 4294967295, c = t.groupColorAlpha, l = (s >>> 24 & 255) / 255, u = (c >>> 24 & 255) / 255, d = n.filter?.alphaMultiplier ?? 1, f = l * u * d;
		if (f <= 0) return;
		let p = s & 16777215, m = c & 16777215, g = ae(o(m, p)), _ = n._roundPixels | t._roundPixels;
		i.save(), r.setContextTransform(a, _ === 1), r.setBlendMode(t.groupBlendMode);
		let v = t.context.instructions;
		for (let e = 0; e < v.length; e++) {
			let t = v[e];
			if (t.action === "texture") {
				let e = t.data, n = e.image, s = n ? L.getCanvasSource(n) : null;
				if (!s) continue;
				let c = e.alpha * f;
				if (c <= 0) continue;
				let l = o(e.style, g);
				i.globalAlpha = c;
				let u = s;
				l !== 16777215 && (u = L.getTintedCanvas({ texture: n }, l));
				let d = n.frame, p = n.source._resolution ?? n.source.resolution ?? 1, m = d.x * p, v = d.y * p, y = d.width * p, b = d.height * p;
				u !== s && (m = 0, v = 0);
				let x = e.transform, S = x && !x.isIdentity(), C = n.rotate;
				S || C ? (st.copyFrom(a), S && st.append(x), C && h.matrixAppendRotationInv(st, C, e.dx, e.dy, e.dw, e.dh), r.setContextTransform(st, _ === 1)) : r.setContextTransform(a, _ === 1), i.drawImage(u, m, v, u === s ? y : u.width, u === s ? b : u.height, C ? 0 : e.dx, C ? 0 : e.dy, e.dw, e.dh), (S || C) && r.setContextTransform(a, _ === 1);
				continue;
			}
			let n = t.data, s = n?.path?.shapePath;
			if (!s?.shapePrimitives?.length) continue;
			let c = n.style, l = o(c.color, g), u = c.alpha * f;
			if (u <= 0) continue;
			let d = t.action === "stroke";
			if (i.globalAlpha = u, d) {
				let e = c;
				i.lineWidth = e.width, i.lineCap = e.cap, i.lineJoin = e.join, i.miterLimit = e.miterLimit;
			}
			let p = s.shapePrimitives;
			if (!d && n.hole?.shapePath?.shapePrimitives?.length) {
				let e = p[p.length - 1];
				e.holes = n.hole.shapePath.shapePrimitives;
			}
			for (let e = 0; e < p.length; e++) {
				let t = p[e];
				if (!t?.shape) continue;
				let n = t.transform, r = n && !n.isIdentity(), o = c.texture && c.texture !== x.WHITE, s = c.textureSpace === "global" ? n : null, u = gt(c, l, o ? ye(ct, c, t.shape, s) : null, r ? lt.copyFrom(a).append(n) : a);
				if (r && (i.save(), i.transform(n.a, n.b, n.c, n.d, n.tx, n.ty)), d) {
					let e = c;
					if (e.alignment !== .5 && !e.pixelLine) {
						let n = [], r = [], a = [];
						if (me[t.shape.type]?.build(t.shape, n)) {
							let o = t.shape.closePath ?? !0;
							Se(n, e, !1, o, r, a), i.fillStyle = u, dt(i, r, a);
						} else i.strokeStyle = u, i.beginPath(), mt(i, t.shape), i.stroke();
					} else i.strokeStyle = u, i.beginPath(), mt(i, t.shape), i.stroke();
				} else i.fillStyle = u, i.beginPath(), mt(i, t.shape), ht(i, t.holes) ? i.fill("evenodd") : i.fill();
				r && i.restore();
			}
		}
		i.restore();
	}
	destroy() {
		this.shader = null;
	}
};
_t.extension = {
	type: [O.CanvasPipesAdaptor],
	name: "graphics"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/batcher/canvas/CanvasBatchAdaptor.mjs
var vt = class e {
	static _getPatternRepeat(e, t) {
		let n = e && e !== "clamp-to-edge", r = t && t !== "clamp-to-edge";
		return n && r ? "repeat" : n ? "repeat-x" : r ? "repeat-y" : "no-repeat";
	}
	start(e, t, n) {}
	execute(t, n) {
		let r = n.elements;
		if (!r || !r.length) return;
		let i = t.renderer, a = i.canvasContext, s = a.activeContext;
		for (let t = 0; t < r.length; t++) {
			let c = r[t];
			if (!c.packAsQuad) continue;
			let l = c, u = l.texture, d = u ? L.getCanvasSource(u) : null;
			if (!d) continue;
			let f = u.source.style, p = a.smoothProperty, m = f.scaleMode !== "nearest";
			s[p] !== m && (s[p] = m), a.setBlendMode(n.blendMode);
			let g = i.globalUniforms.globalUniformData?.worldColor ?? 4294967295, _ = l.color, v = (g >>> 24 & 255) / 255, y = (_ >>> 24 & 255) / 255, b = i.filter?.alphaMultiplier ?? 1, x = v * y * b;
			if (x <= 0) continue;
			s.globalAlpha = x;
			let S = g & 16777215, C = _ & 16777215, w = ae(o(C, S)), T = u.frame, E = f.addressModeU ?? f.addressMode, ee = f.addressModeV ?? f.addressMode, te = e._getPatternRepeat(E, ee), D = u.source._resolution ?? u.source.resolution ?? 1, ne = l.renderable?.renderGroup?.isCachedAsTexture, O = T.x * D, re = T.y * D, ie = T.width * D, oe = T.height * D, k = l.bounds, se = i.renderTarget.renderTarget.isRoot, A = k.minX, ce = k.minY, le = k.maxX - k.minX, j = k.maxY - k.minY, ue = u.rotate, M = u.uvs, de = Math.min(M.x0, M.x1, M.x2, M.x3, M.y0, M.y1, M.y2, M.y3), N = Math.max(M.x0, M.x1, M.x2, M.x3, M.y0, M.y1, M.y2, M.y3), fe = te !== "no-repeat" && (de < 0 || N > 1), P = ue && !(!fe && (w !== 16777215 || ue));
			P ? (e._tempPatternMatrix.copyFrom(l.transform), h.matrixAppendRotationInv(e._tempPatternMatrix, ue, A, ce, le, j), a.setContextTransform(e._tempPatternMatrix, l.roundPixels === 1, void 0, ne && se)) : a.setContextTransform(l.transform, l.roundPixels === 1, void 0, ne && se);
			let F = le, pe = j, I = P ? 0 : A, R = P ? 0 : ce;
			if (!P && l.roundPixels === 1 && (I |= 0, R |= 0), fe) {
				let t = d, n = w !== 16777215 && !ue, r = T.width <= u.source.width && T.height <= u.source.height;
				n && r && (t = L.getTintedCanvas({ texture: u }, w));
				let i = s.createPattern(t, te);
				if (!i) continue;
				let a = F, o = pe;
				if (a === 0 || o === 0) continue;
				let c = 1 / a, l = 1 / o, f = (M.x1 - M.x0) * c, p = (M.y1 - M.y0) * c, m = (M.x3 - M.x0) * l, h = (M.y3 - M.y0) * l, g = M.x0 - f * I - m * R, _ = M.y0 - p * I - h * R, v = u.source.pixelWidth, y = u.source.pixelHeight;
				e._tempPatternMatrix.set(f * v, p * y, m * v, h * y, g * v, _ * y), L.applyPatternTransform(i, e._tempPatternMatrix), s.fillStyle = i, s.fillRect(I, R, F, pe);
			} else {
				let e = w !== 16777215 || ue ? L.getTintedCanvas({ texture: u }, w) : d, t = e !== d;
				s.drawImage(e, t ? 0 : O, t ? 0 : re, t ? e.width : ie, t ? e.height : oe, I, R, F, pe);
			}
		}
	}
};
vt._tempPatternMatrix = new u(), vt.extension = {
	type: [O.CanvasPipesAdaptor],
	name: "batch"
};
var yt = vt, bt = class {
	constructor(e) {
		this._colorStack = [], this._colorStackIndex = 0, this._currentColor = 0, this._renderer = e;
	}
	buildStart() {
		this._colorStack[0] = 15, this._colorStackIndex = 1, this._currentColor = 15;
	}
	push(e, t, n) {
		this._renderer.renderPipes.batch.break(n);
		let r = this._colorStack;
		r[this._colorStackIndex] = r[this._colorStackIndex - 1] & e.mask;
		let i = this._colorStack[this._colorStackIndex];
		i !== this._currentColor && (this._currentColor = i, n.add({
			renderPipeId: "colorMask",
			colorMask: i,
			canBundle: !1
		})), this._colorStackIndex++;
	}
	pop(e, t, n) {
		this._renderer.renderPipes.batch.break(n);
		let r = this._colorStack;
		this._colorStackIndex--;
		let i = r[this._colorStackIndex - 1];
		i !== this._currentColor && (this._currentColor = i, n.add({
			renderPipeId: "colorMask",
			colorMask: i,
			canBundle: !1
		}));
	}
	execute(e) {}
	destroy() {
		this._renderer = null, this._colorStack = null;
	}
};
bt.extension = {
	type: [O.CanvasPipes],
	name: "colorMask"
};
//#endregion
//#region node_modules/pixi.js/lib/scene/graphics/canvas/CanvasGraphicsContextSystem.mjs
var xt = class {
	constructor() {
		this.isBatchable = !1;
	}
	reset() {
		this.isBatchable = !1, this.context = null, this.graphicsData &&= (this.graphicsData.destroy(), null);
	}
	destroy() {
		this.reset();
	}
}, St = class {
	constructor() {
		this.instructions = new p();
	}
	init() {
		this.instructions.reset();
	}
	destroy() {
		this.instructions.destroy(), this.instructions = null;
	}
}, Ct = class e {
	constructor(e) {
		this._renderer = e, this._managedContexts = new H({
			renderer: e,
			type: "resource",
			name: "graphicsContext"
		});
	}
	init(t) {
		e.defaultOptions.bezierSmoothness = t?.bezierSmoothness ?? e.defaultOptions.bezierSmoothness;
	}
	getContextRenderData(e) {
		return this.getGpuContext(e).graphicsData || this._initContextRenderData(e);
	}
	updateGpuContext(e) {
		let t = e._gpuData, n = !!t[this._renderer.uid], r = t[this._renderer.uid] || this._initContext(e);
		return (e.dirty || !n) && (n && r.reset(), r.isBatchable = !1, e.dirty = !1), r;
	}
	getGpuContext(e) {
		return e._gpuData[this._renderer.uid] || this._initContext(e);
	}
	_initContextRenderData(e) {
		let t = new St(), n = this.getGpuContext(e);
		return n.graphicsData = t, t.init(), t;
	}
	_initContext(e) {
		let t = new xt();
		return t.context = e, e._gpuData[this._renderer.uid] = t, this._managedContexts.add(e), t;
	}
	destroy() {
		this._managedContexts.destroy(), this._renderer = null;
	}
};
Ct.extension = {
	type: [O.CanvasSystem],
	name: "graphicsContext"
}, Ct.defaultOptions = { bezierSmoothness: .5 };
var wt = Ct, Tt = class {
	constructor(e, t) {
		this.state = k.for2d(), this.renderer = e, this._adaptor = t, this.renderer.runners.contextChange.add(this), this._managedGraphics = new H({
			renderer: e,
			type: "renderable",
			priority: -1,
			name: "graphics"
		});
	}
	contextChange() {
		this._adaptor.contextChange(this.renderer);
	}
	validateRenderable(e) {
		return !1;
	}
	addRenderable(e, t) {
		this._managedGraphics.add(e), this.renderer.renderPipes.batch.break(t), t.add(e);
	}
	updateRenderable(e) {}
	execute(e) {
		e.isRenderable && this._adaptor.execute(this, e);
	}
	destroy() {
		this._managedGraphics.destroy(), this.renderer = null, this._adaptor.destroy(), this._adaptor = null;
	}
};
Tt.extension = {
	type: [O.CanvasPipes],
	name: "graphics"
};
//#endregion
//#region node_modules/pixi.js/lib/scene/graphics/shared/GraphicsPipe.mjs
var Et = class {
	constructor() {
		this.batches = [], this.batched = !1;
	}
	destroy() {
		this.batches.forEach((e) => {
			s.return(e);
		}), this.batches.length = 0;
	}
}, Dt = class {
	constructor(e, t) {
		this.state = k.for2d(), this.renderer = e, this._adaptor = t, this.renderer.runners.contextChange.add(this), this._managedGraphics = new H({
			renderer: e,
			type: "renderable",
			priority: -1,
			name: "graphics"
		});
	}
	contextChange() {
		this._adaptor.contextChange(this.renderer);
	}
	validateRenderable(e) {
		let t = e.context, n = !!e._gpuData, r = this.renderer.graphicsContext.updateGpuContext(t);
		return !!(r.isBatchable || n !== r.isBatchable);
	}
	addRenderable(e, t) {
		let n = this.renderer.graphicsContext.updateGpuContext(e.context);
		e.didViewUpdate && this._rebuild(e), n.isBatchable ? this._addToBatcher(e, t) : (this.renderer.renderPipes.batch.break(t), t.add(e));
	}
	updateRenderable(e) {
		let t = this._getGpuDataForRenderable(e).batches;
		for (let e = 0; e < t.length; e++) {
			let n = t[e];
			n._batcher.updateElement(n);
		}
	}
	execute(e) {
		if (!e.isRenderable) return;
		let t = this.renderer, n = e.context;
		if (!t.graphicsContext.getGpuContext(n).batches.length) return;
		let r = n.customShader || this._adaptor.shader;
		this.state.blendMode = e.groupBlendMode;
		let i = r.resources.localUniforms.uniforms;
		i.uTransformMatrix = e.groupTransform, i.uRound = t._roundPixels | e._roundPixels, Oe(e.groupColorAlpha, i.uColor, 0), this._adaptor.execute(this, e);
	}
	_rebuild(e) {
		let t = this._getGpuDataForRenderable(e), n = this.renderer.graphicsContext.updateGpuContext(e.context);
		t.destroy(), n.isBatchable && this._updateBatchesForRenderable(e, t);
	}
	_addToBatcher(e, t) {
		let n = this.renderer.renderPipes.batch, r = this._getGpuDataForRenderable(e).batches;
		for (let e = 0; e < r.length; e++) {
			let i = r[e];
			n.addToBatch(i, t);
		}
	}
	_getGpuDataForRenderable(e) {
		return e._gpuData[this.renderer.uid] || this._initGpuDataForRenderable(e);
	}
	_initGpuDataForRenderable(e) {
		let t = new Et();
		return e._gpuData[this.renderer.uid] = t, this._managedGraphics.add(e), t;
	}
	_updateBatchesForRenderable(e, t) {
		let n = e.context, r = this.renderer.graphicsContext.getGpuContext(n), i = this.renderer._roundPixels | e._roundPixels;
		t.batches = r.batches.map((t) => {
			let n = s.get(xe);
			return t.copyTo(n), n.renderable = e, n.roundPixels = i, n;
		});
	}
	destroy() {
		this._managedGraphics.destroy(), this.renderer = null, this._adaptor.destroy(), this._adaptor = null, this.state = null;
	}
};
Dt.extension = {
	type: [O.WebGLPipes, O.WebGPUPipes],
	name: "graphics"
}, a.add(Tt), a.add(Dt), a.add(wt), a.add(ge);
//#endregion
//#region node_modules/pixi.js/lib/scene/graphics/shared/Graphics.mjs
var Ot = class e extends re {
	constructor(e) {
		e instanceof z && (e = { context: e });
		let { context: t, roundPixels: n, ...r } = e || {};
		super({
			label: "Graphics",
			...r
		}), this.renderPipeId = "graphics", t ? this.context = t : (this.context = this._ownedContext = new z(), this.context.autoGarbageCollect = this.autoGarbageCollect), this.didViewUpdate = !0, this.allowChildren = !1, this.roundPixels = n ?? !1;
	}
	set context(e) {
		e !== this._context && (this._context && (this._context.off("update", this.onViewUpdate, this), this._context.off("unload", this.unload, this)), this._context = e, this._context.on("update", this.onViewUpdate, this), this._context.on("unload", this.unload, this), this.onViewUpdate());
	}
	get context() {
		return this._context;
	}
	get bounds() {
		return this._context.bounds;
	}
	updateBounds() {}
	containsPoint(e) {
		return this._context.containsPoint(e);
	}
	destroy(e) {
		this._ownedContext && !e ? this._ownedContext.destroy(e) : (e === !0 || e?.context === !0) && this._context.destroy(e), this._ownedContext = null, this._context = null, super.destroy(e);
	}
	_onTouch(e) {
		this._gcLastUsed = e, this._context._gcLastUsed = e;
	}
	_callContextMethod(e, t) {
		return this.context[e](...t), this;
	}
	setFillStyle(...e) {
		return this._callContextMethod("setFillStyle", e);
	}
	setStrokeStyle(...e) {
		return this._callContextMethod("setStrokeStyle", e);
	}
	fill(...e) {
		return this._callContextMethod("fill", e);
	}
	stroke(...e) {
		return this._callContextMethod("stroke", e);
	}
	texture(...e) {
		return this._callContextMethod("texture", e);
	}
	beginPath() {
		return this._callContextMethod("beginPath", []);
	}
	cut() {
		return this._callContextMethod("cut", []);
	}
	arc(...e) {
		return this._callContextMethod("arc", e);
	}
	arcTo(...e) {
		return this._callContextMethod("arcTo", e);
	}
	arcToSvg(...e) {
		return this._callContextMethod("arcToSvg", e);
	}
	bezierCurveTo(...e) {
		return this._callContextMethod("bezierCurveTo", e);
	}
	closePath() {
		return this._callContextMethod("closePath", []);
	}
	ellipse(...e) {
		return this._callContextMethod("ellipse", e);
	}
	circle(...e) {
		return this._callContextMethod("circle", e);
	}
	path(...e) {
		return this._callContextMethod("path", e);
	}
	lineTo(...e) {
		return this._callContextMethod("lineTo", e);
	}
	moveTo(...e) {
		return this._callContextMethod("moveTo", e);
	}
	quadraticCurveTo(...e) {
		return this._callContextMethod("quadraticCurveTo", e);
	}
	rect(...e) {
		return this._callContextMethod("rect", e);
	}
	roundRect(...e) {
		return this._callContextMethod("roundRect", e);
	}
	poly(...e) {
		return this._callContextMethod("poly", e);
	}
	regularPoly(...e) {
		return this._callContextMethod("regularPoly", e);
	}
	roundPoly(...e) {
		return this._callContextMethod("roundPoly", e);
	}
	roundShape(...e) {
		return this._callContextMethod("roundShape", e);
	}
	filletRect(...e) {
		return this._callContextMethod("filletRect", e);
	}
	chamferRect(...e) {
		return this._callContextMethod("chamferRect", e);
	}
	star(...e) {
		return this._callContextMethod("star", e);
	}
	svg(...e) {
		return this._callContextMethod("svg", e);
	}
	restore(...e) {
		return this._callContextMethod("restore", e);
	}
	save() {
		return this._callContextMethod("save", []);
	}
	getTransform() {
		return this.context.getTransform();
	}
	resetTransform() {
		return this._callContextMethod("resetTransform", []);
	}
	rotateTransform(...e) {
		return this._callContextMethod("rotate", e);
	}
	scaleTransform(...e) {
		return this._callContextMethod("scale", e);
	}
	setTransform(...e) {
		return this._callContextMethod("setTransform", e);
	}
	transform(...e) {
		return this._callContextMethod("transform", e);
	}
	translateTransform(...e) {
		return this._callContextMethod("translate", e);
	}
	clear() {
		return this._callContextMethod("clear", []);
	}
	get fillStyle() {
		return this._context.fillStyle;
	}
	set fillStyle(e) {
		this._context.fillStyle = e;
	}
	get strokeStyle() {
		return this._context.strokeStyle;
	}
	set strokeStyle(e) {
		this._context.strokeStyle = e;
	}
	clone(t = !1) {
		return t ? new e(this._context.clone()) : (this._ownedContext = null, new e(this._context));
	}
	lineStyle(e, t, n) {
		y(i, "Graphics#lineStyle is no longer needed. Use Graphics#setStrokeStyle to set the stroke style.");
		let r = {};
		return e && (r.width = e), t && (r.color = t), n && (r.alpha = n), this.context.strokeStyle = r, this;
	}
	beginFill(e, t) {
		y(i, "Graphics#beginFill is no longer needed. Use Graphics#fill to fill the shape with the desired style.");
		let n = {};
		return e !== void 0 && (n.color = e), t !== void 0 && (n.alpha = t), this.context.fillStyle = n, this;
	}
	endFill() {
		y(i, "Graphics#endFill is no longer needed. Use Graphics#fill to fill the shape with the desired style."), this.context.fill();
		let e = this.context.strokeStyle;
		return (e.width !== z.defaultStrokeStyle.width || e.color !== z.defaultStrokeStyle.color || e.alpha !== z.defaultStrokeStyle.alpha) && this.context.stroke(), this;
	}
	drawCircle(...e) {
		return y(i, "Graphics#drawCircle has been renamed to Graphics#circle"), this._callContextMethod("circle", e);
	}
	drawEllipse(...e) {
		return y(i, "Graphics#drawEllipse has been renamed to Graphics#ellipse"), this._callContextMethod("ellipse", e);
	}
	drawPolygon(...e) {
		return y(i, "Graphics#drawPolygon has been renamed to Graphics#poly"), this._callContextMethod("poly", e);
	}
	drawRect(...e) {
		return y(i, "Graphics#drawRect has been renamed to Graphics#rect"), this._callContextMethod("rect", e);
	}
	drawRoundedRect(...e) {
		return y(i, "Graphics#drawRoundedRect has been renamed to Graphics#roundRect"), this._callContextMethod("roundRect", e);
	}
	drawStar(...e) {
		return y(i, "Graphics#drawStar has been renamed to Graphics#star"), this._callContextMethod("star", e);
	}
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/mask/stencil/CanvasStencilMaskPipe.mjs
function kt(e, t, n, r, i, a) {
	a = Math.max(0, Math.min(a, Math.min(r, i) / 2)), e.moveTo(t + a, n), e.lineTo(t + r - a, n), e.quadraticCurveTo(t + r, n, t + r, n + a), e.lineTo(t + r, n + i - a), e.quadraticCurveTo(t + r, n + i, t + r - a, n + i), e.lineTo(t + a, n + i), e.quadraticCurveTo(t, n + i, t, n + i - a), e.lineTo(t, n + a), e.quadraticCurveTo(t, n, t + a, n);
}
function At(e, t) {
	switch (t.type) {
		case "rectangle": {
			let n = t;
			e.rect(n.x, n.y, n.width, n.height);
			break;
		}
		case "roundedRectangle": {
			let n = t;
			kt(e, n.x, n.y, n.width, n.height, n.radius);
			break;
		}
		case "circle": {
			let n = t;
			e.moveTo(n.x + n.radius, n.y), e.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
			break;
		}
		case "ellipse": {
			let n = t;
			e.ellipse ? (e.moveTo(n.x + n.halfWidth, n.y), e.ellipse(n.x, n.y, n.halfWidth, n.halfHeight, 0, 0, Math.PI * 2)) : (e.save(), e.translate(n.x, n.y), e.scale(n.halfWidth, n.halfHeight), e.moveTo(1, 0), e.arc(0, 0, 1, 0, Math.PI * 2), e.restore());
			break;
		}
		case "triangle": {
			let n = t;
			e.moveTo(n.x, n.y), e.lineTo(n.x2, n.y2), e.lineTo(n.x3, n.y3), e.closePath();
			break;
		}
		default: {
			let n = t, r = n.points;
			if (!r?.length) break;
			e.moveTo(r[0], r[1]);
			for (let t = 2; t < r.length; t += 2) e.lineTo(r[t], r[t + 1]);
			n.closePath && e.closePath();
			break;
		}
	}
}
function jt(e, t, n) {
	let r = [], i = [], a = [];
	if (!me[t.type]?.build(t, r)) return !1;
	let o = t.closePath ?? !0;
	Se(r, n, !1, o, i, a);
	for (let t = 0; t < a.length; t += 3) {
		let n = a[t] * 2, r = a[t + 1] * 2, o = a[t + 2] * 2;
		e.moveTo(i[n], i[n + 1]), e.lineTo(i[r], i[r + 1]), e.lineTo(i[o], i[o + 1]), e.closePath();
	}
	return !0;
}
function Mt(e, t) {
	if (!t?.length) return !1;
	for (let n = 0; n < t.length; n++) {
		let r = t[n];
		if (!r?.shape) continue;
		let i = r.transform, a = i && !i.isIdentity();
		a && (e.save(), e.transform(i.a, i.b, i.c, i.d, i.tx, i.ty)), At(e, r.shape), a && e.restore();
	}
	return !0;
}
var Nt = class {
	constructor(e) {
		this._warnedMaskTypes = /* @__PURE__ */ new Set(), this._canvasMaskStack = [], this._renderer = e;
	}
	push(e, t, n) {
		this._renderer.renderPipes.batch.break(n), n.add({
			renderPipeId: "stencilMask",
			action: "pushMaskBegin",
			mask: e,
			inverse: t._maskOptions.inverse,
			canBundle: !1
		});
	}
	pop(e, t, n) {
		this._renderer.renderPipes.batch.break(n), n.add({
			renderPipeId: "stencilMask",
			action: "popMaskEnd",
			mask: e,
			inverse: t._maskOptions.inverse,
			canBundle: !1
		});
	}
	execute(e) {
		if (e.action !== "pushMaskBegin" && e.action !== "popMaskEnd") return;
		let t = this._renderer, n = t.canvasContext, r = n?.activeContext;
		if (!r) return;
		if (e.action === "popMaskEnd") {
			this._canvasMaskStack.pop() && r.restore();
			return;
		}
		e.inverse && this._warnOnce("inverse", "CanvasRenderer: inverse masks are not supported on Canvas2D; ignoring inverse flag.");
		let i = e.mask.mask;
		if (!(i instanceof Ot)) {
			this._warnOnce("nonGraphics", "CanvasRenderer: only Graphics masks are supported in Canvas2D; skipping mask."), this._canvasMaskStack.push(!1);
			return;
		}
		let a = i, o = a.context?.instructions;
		if (!o?.length) {
			this._canvasMaskStack.push(!1);
			return;
		}
		r.save(), n.setContextTransform(a.groupTransform, (t._roundPixels | a._roundPixels) === 1), r.beginPath();
		let s = !1, c = !1;
		for (let e = 0; e < o.length; e++) {
			let t = o[e], n = t.action;
			if (n !== "fill" && n !== "stroke") continue;
			let i = t.data, a = i?.path?.shapePath;
			if (!a?.shapePrimitives?.length) continue;
			let l = n === "stroke", u = a.shapePrimitives;
			for (let e = 0; e < u.length; e++) {
				let t = u[e];
				if (!t?.shape) continue;
				let n = t.transform, a = n && !n.isIdentity();
				a && (r.save(), r.transform(n.a, n.b, n.c, n.d, n.tx, n.ty)), l && i.style ? s = jt(r, t.shape, i.style) || s : (At(r, t.shape), c = Mt(r, t.holes) || c, s = !0), a && r.restore();
			}
		}
		if (!s) {
			r.restore(), this._canvasMaskStack.push(!1);
			return;
		}
		c ? r.clip("evenodd") : r.clip(), this._canvasMaskStack.push(!0);
	}
	destroy() {
		this._renderer = null, this._warnedMaskTypes = null, this._canvasMaskStack = null;
	}
	_warnOnce(e, t) {
		this._warnedMaskTypes.has(e) || (this._warnedMaskTypes.add(e), d(t));
	}
};
Nt.extension = {
	type: [O.CanvasPipes],
	name: "stencilMask"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/canvas/utils/mapCanvasBlendModesToPixi.mjs
var W = "source-over";
function Pt() {
	let e = pe(), t = /* @__PURE__ */ Object.create(null);
	return t.inherit = W, t.none = W, t.normal = "source-over", t.add = "lighter", t.multiply = e ? "multiply" : W, t.screen = e ? "screen" : W, t.overlay = e ? "overlay" : W, t.darken = e ? "darken" : W, t.lighten = e ? "lighten" : W, t["color-dodge"] = e ? "color-dodge" : W, t["color-burn"] = e ? "color-burn" : W, t["hard-light"] = e ? "hard-light" : W, t["soft-light"] = e ? "soft-light" : W, t.difference = e ? "difference" : W, t.exclusion = e ? "exclusion" : W, t.saturation = e ? "saturation" : W, t.color = e ? "color" : W, t.luminosity = e ? "luminosity" : W, t["linear-burn"] = e ? "color-burn" : W, t["linear-dodge"] = e ? "color-dodge" : W, t["linear-light"] = e ? "hard-light" : W, t["pin-light"] = e ? "hard-light" : W, t["vivid-light"] = e ? "hard-light" : W, t["hard-mix"] = W, t.negation = e ? "difference" : W, t["normal-npm"] = t.normal, t["add-npm"] = t.add, t["screen-npm"] = t.screen, t.erase = "destination-out", t.subtract = W, t.divide = W, t.min = W, t.max = W, t;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/canvas/CanvasContextSystem.mjs
var Ft = new u(), It = class {
	constructor(e) {
		this.activeResolution = 1, this.smoothProperty = "imageSmoothingEnabled", this.blendModes = Pt(), this._activeBlendMode = "normal", this._projTransform = null, this._outerBlend = !1, this._warnedBlendModes = /* @__PURE__ */ new Set(), this._renderer = e;
	}
	resolutionChange(e) {
		this.activeResolution = e;
	}
	init() {
		let e = this._renderer.background.alpha < 1;
		if (this.rootContext = this._renderer.canvas.getContext("2d", { alpha: e }), this.activeContext = this.rootContext, this.activeResolution = this._renderer.resolution, !this.rootContext.imageSmoothingEnabled) {
			let e = this.rootContext;
			e.webkitImageSmoothingEnabled ? this.smoothProperty = "webkitImageSmoothingEnabled" : e.mozImageSmoothingEnabled ? this.smoothProperty = "mozImageSmoothingEnabled" : e.oImageSmoothingEnabled ? this.smoothProperty = "oImageSmoothingEnabled" : e.msImageSmoothingEnabled && (this.smoothProperty = "msImageSmoothingEnabled");
		}
	}
	setContextTransform(e, t, n, r) {
		let i = r ? u.IDENTITY : this._renderer.globalUniforms.globalUniformData?.worldTransformMatrix || u.IDENTITY, a = Ft;
		a.copyFrom(i), a.append(e);
		let o = this._projTransform, s = this.activeResolution;
		if (n ||= s, o) {
			let e = u.shared;
			e.copyFrom(a), e.prepend(o), a = e;
		}
		t ? this.activeContext.setTransform(a.a * n, a.b * n, a.c * n, a.d * n, a.tx * s | 0, a.ty * s | 0) : this.activeContext.setTransform(a.a * n, a.b * n, a.c * n, a.d * n, a.tx * s, a.ty * s);
	}
	clear(e, t) {
		let n = this.activeContext, r = this._renderer;
		if (n.clearRect(0, 0, r.width, r.height), e) {
			let i = c.shared.setValue(e);
			n.globalAlpha = t ?? i.alpha, n.fillStyle = i.toHex(), n.fillRect(0, 0, r.width, r.height), n.globalAlpha = 1;
		}
	}
	setBlendMode(e) {
		if (this._activeBlendMode === e) return;
		this._activeBlendMode = e, this._outerBlend = !1;
		let t = this.blendModes[e];
		if (!t) {
			this._warnedBlendModes.has(e) || (console.warn(`CanvasRenderer: blend mode "${e}" is not supported in Canvas2D; falling back to "source-over".`), this._warnedBlendModes.add(e)), this.activeContext.globalCompositeOperation = "source-over";
			return;
		}
		this.activeContext.globalCompositeOperation = t;
	}
	destroy() {
		this.rootContext = null, this.activeContext = null, this._warnedBlendModes.clear();
	}
};
It.extension = {
	type: [O.CanvasSystem],
	name: "canvasContext"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/canvas/CanvasLimitsSystem.mjs
var Lt = class {
	constructor() {
		this.maxTextures = 16, this.maxBatchableTextures = 16, this.maxUniformBindings = 0;
	}
	init() {}
};
Lt.extension = {
	type: [O.CanvasSystem],
	name: "limits"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/canvas/renderTarget/CanvasRenderTargetAdaptor.mjs
var Rt = class {
	init(e, t) {
		this._renderer = e, this._renderTargetSystem = t;
	}
	initGpuRenderTarget(e) {
		let t = e.colorTexture, { canvas: n, context: r } = this._ensureCanvas(t);
		return {
			canvas: n,
			context: r,
			width: n.width,
			height: n.height
		};
	}
	resizeGpuRenderTarget(e) {
		let t = e.colorTexture, { canvas: n } = this._ensureCanvas(t);
		n.width = e.pixelWidth, n.height = e.pixelHeight;
	}
	startRenderPass(e, t, n, r) {
		let i = this._renderTargetSystem.getGpuRenderTarget(e);
		this._renderer.canvasContext.activeContext = i.context, this._renderer.canvasContext.activeResolution = e.resolution, t && this.clear(e, t, n, r);
	}
	clear(e, t, n, r) {
		let i = this._renderTargetSystem.getGpuRenderTarget(e).context, a = r || {
			x: 0,
			y: 0,
			width: e.pixelWidth,
			height: e.pixelHeight
		};
		if (i.setTransform(1, 0, 0, 1, 0, 0), i.clearRect(a.x, a.y, a.width, a.height), n) {
			let e = c.shared.setValue(n);
			e.alpha > 0 && (i.globalAlpha = e.alpha, i.fillStyle = e.toHex(), i.fillRect(a.x, a.y, a.width, a.height), i.globalAlpha = 1);
		}
	}
	finishRenderPass() {}
	copyToTexture(e, t, n, r, i) {
		let a = this._renderTargetSystem.getGpuRenderTarget(e).canvas, o = t.source, { context: s } = this._ensureCanvas(o), c = i?.x ?? 0, l = i?.y ?? 0;
		return s.drawImage(a, n.x, n.y, r.width, r.height, c, l, r.width, r.height), o.update(), t;
	}
	destroyGpuRenderTarget(e) {}
	_ensureCanvas(e) {
		let t = e.resource;
		(!t || !A.test(t)) && (t = w.get().createCanvas(e.pixelWidth, e.pixelHeight), e.resource = t), (t.width !== e.pixelWidth || t.height !== e.pixelHeight) && (t.width = e.pixelWidth, t.height = e.pixelHeight);
		let n = t.getContext("2d");
		return {
			canvas: t,
			context: n
		};
	}
}, zt = class extends Ne {
	constructor(e) {
		super(e), this.adaptor = new Rt(), this.adaptor.init(e, this);
	}
};
zt.extension = {
	type: [O.CanvasSystem],
	name: "renderTarget"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/canvas/texture/CanvasTextureSystem.mjs
var Bt = class {
	constructor(e) {}
	init() {}
	initSource(e) {}
	generateCanvas(e) {
		let t = w.get().createCanvas(), n = t.getContext("2d"), r = L.getCanvasSource(e);
		if (!r) return t;
		let i = e.frame, a = e.source._resolution ?? e.source.resolution ?? 1, o = i.x * a, s = i.y * a, c = i.width * a, l = i.height * a;
		return t.width = Math.ceil(c), t.height = Math.ceil(l), n.drawImage(r, o, s, c, l, 0, 0, c, l), t;
	}
	getPixels(e) {
		let t = this.generateCanvas(e);
		return {
			pixels: t.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, t.width, t.height).data,
			width: t.width,
			height: t.height
		};
	}
	destroy() {}
};
Bt.extension = {
	type: [O.CanvasSystem],
	name: "texture"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/canvas/CanvasRenderer.mjs
var Vt = [
	...Me,
	It,
	Lt,
	Bt,
	zt
], Ht = [
	we,
	Te,
	Ee,
	je,
	Pe,
	Nt,
	bt,
	ke
], Ut = [yt, _t], Wt = [], Gt = [], Kt = [];
a.handleByNamedList(O.CanvasSystem, Wt), a.handleByNamedList(O.CanvasPipes, Gt), a.handleByNamedList(O.CanvasPipesAdaptor, Kt), a.add(...Vt, ...Ht, ...Ut);
var qt = class extends Ce {
	constructor() {
		let e = {
			name: "canvas",
			type: C.CANVAS,
			systems: Wt,
			renderPipes: Gt,
			renderPipeAdaptors: Kt
		};
		super(e);
	}
}, Jt = class {
	contextChange(e) {
		let t = new g({
			uColor: {
				value: new Float32Array([
					1,
					1,
					1,
					1
				]),
				type: "vec4<f32>"
			},
			uTransformMatrix: {
				value: new u(),
				type: "mat3x3<f32>"
			},
			uRound: {
				value: 0,
				type: "f32"
			}
		}), n = e.limits.maxBatchableTextures, r = Ge({
			name: "graphics",
			bits: [
				Be,
				We(n),
				Xe,
				Fe
			]
		});
		this.shader = new v({
			glProgram: r,
			resources: {
				localUniforms: t,
				batchSamplers: Ue(n)
			}
		});
	}
	execute(e, t) {
		let n = t.context, r = n.customShader || this.shader, i = e.renderer, { batcher: a, instructions: o } = i.graphicsContext.getContextRenderData(n);
		r.groups[0] = i.globalUniforms.bindGroup, i.state.set(e.state), i.shader.bind(r), i.geometry.bind(a.geometry, r.glProgram);
		let s = o.instructions;
		for (let e = 0; e < o.instructionSize; e++) {
			let t = s[e];
			if (t.size) {
				for (let e = 0; e < t.textures.count; e++) i.texture.bind(t.textures.textures[e], e);
				i.geometry.draw(t.topology, t.size, t.start);
			}
		}
	}
	destroy() {
		this.shader.destroy(!0), this.shader = null;
	}
};
Jt.extension = {
	type: [O.WebGLPipesAdaptor],
	name: "graphics"
};
//#endregion
//#region node_modules/pixi.js/lib/scene/mesh/gl/GlMeshAdaptor.mjs
var Yt = class {
	init() {
		let e = Ge({
			name: "mesh",
			bits: [
				Xe,
				at,
				Fe
			]
		});
		this._shader = new v({
			glProgram: e,
			resources: {
				uTexture: x.EMPTY.source,
				textureUniforms: { uTextureMatrix: {
					type: "mat3x3<f32>",
					value: new u()
				} }
			}
		});
	}
	execute(e, t) {
		let n = e.renderer, r = t._shader;
		if (!r) {
			r = this._shader;
			let e = t.texture, n = e.source;
			r.resources.uTexture = n, r.resources.uSampler = n.style, r.resources.textureUniforms.uniforms.uTextureMatrix = e.textureMatrix.mapCoord;
		} else if (!r.glProgram) {
			d("Mesh shader has no glProgram", t.shader);
			return;
		}
		r.groups[100] = n.globalUniforms.bindGroup, r.groups[101] = e.localUniformsBindGroup, n.encoder.draw({
			geometry: t._geometry,
			shader: r,
			state: t.state
		});
	}
	destroy() {
		this._shader.destroy(!0), this._shader = null;
	}
};
Yt.extension = {
	type: [O.WebGLPipesAdaptor],
	name: "mesh"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/batcher/gl/GlBatchAdaptor.mjs
var Xt = class {
	constructor() {
		this._tempState = k.for2d(), this._didUploadHash = {};
	}
	init(e) {
		e.renderer.runners.contextChange.add(this);
	}
	contextChange() {
		this._didUploadHash = {};
	}
	start(e, t, n) {
		let r = e.renderer, i = this._didUploadHash[n.uid];
		r.shader.bind(n, i), i || (this._didUploadHash[n.uid] = !0), r.shader.updateUniformGroup(r.globalUniforms.uniformGroup), r.geometry.bind(t, n.glProgram);
	}
	execute(e, t) {
		let n = e.renderer;
		this._tempState.blendMode = t.blendMode, n.state.set(this._tempState);
		let r = t.textures.textures;
		for (let e = 0; e < t.textures.count; e++) n.texture.bind(r[e], e);
		n.geometry.draw(t.topology, t.size, t.start);
	}
};
Xt.extension = {
	type: [O.WebGLPipesAdaptor],
	name: "batch"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/buffer/const.mjs
var Zt = /* @__PURE__ */ ((e) => (e[e.ELEMENT_ARRAY_BUFFER = 34963] = "ELEMENT_ARRAY_BUFFER", e[e.ARRAY_BUFFER = 34962] = "ARRAY_BUFFER", e[e.UNIFORM_BUFFER = 35345] = "UNIFORM_BUFFER", e))(Zt || {}), Qt = class {
	constructor(e, t) {
		this._lastBindBaseLocation = -1, this._lastBindCallId = -1, this.buffer = e || null, this.updateID = -1, this.byteLength = -1, this.type = t;
	}
	destroy() {
		this.buffer = null, this.updateID = -1, this.byteLength = -1, this.type = -1, this._lastBindBaseLocation = -1, this._lastBindCallId = -1;
	}
}, $t = class {
	constructor(e) {
		this._boundBufferBases = /* @__PURE__ */ Object.create(null), this._minBaseLocation = 0, this._nextBindBaseIndex = this._minBaseLocation, this._bindCallId = 0, this._renderer = e, this._managedBuffers = new H({
			renderer: e,
			type: "resource",
			onUnload: this.onBufferUnload.bind(this),
			name: "glBuffer"
		});
	}
	destroy() {
		this._managedBuffers.destroy(), this._renderer = null, this._gl = null, this._boundBufferBases = {};
	}
	contextChange() {
		this._gl = this._renderer.gl, this.destroyAll(!0), this._maxBindings = this._renderer.limits.maxUniformBindings;
	}
	getGlBuffer(e) {
		return e._gcLastUsed = this._renderer.gc.now, e._gpuData[this._renderer.uid] || this.createGLBuffer(e);
	}
	bind(e) {
		let { _gl: t } = this, n = this.getGlBuffer(e);
		t.bindBuffer(n.type, n.buffer);
	}
	bindBufferBase(e, t) {
		let { _gl: n } = this;
		this._boundBufferBases[t] !== e && (this._boundBufferBases[t] = e, e._lastBindBaseLocation = t, n.bindBufferBase(n.UNIFORM_BUFFER, t, e.buffer));
	}
	nextBindBase(e) {
		this._bindCallId++, this._minBaseLocation = 0, e && (this._boundBufferBases[0] = null, this._minBaseLocation = 1, this._nextBindBaseIndex < 1 && (this._nextBindBaseIndex = 1));
	}
	freeLocationForBufferBase(e) {
		let t = this.getLastBindBaseLocation(e);
		if (t >= this._minBaseLocation) return e._lastBindCallId = this._bindCallId, t;
		let n = 0, r = this._nextBindBaseIndex;
		for (; n < 2;) {
			r >= this._maxBindings && (r = this._minBaseLocation, n++);
			let e = this._boundBufferBases[r];
			if (e && e._lastBindCallId === this._bindCallId) {
				r++;
				continue;
			}
			break;
		}
		return t = r, this._nextBindBaseIndex = r + 1, n >= 2 ? -1 : (e._lastBindCallId = this._bindCallId, this._boundBufferBases[t] = null, t);
	}
	getLastBindBaseLocation(e) {
		let t = e._lastBindBaseLocation;
		return this._boundBufferBases[t] === e ? t : -1;
	}
	bindBufferRange(e, t, n, r) {
		let { _gl: i } = this;
		n ||= 0, t ||= 0, this._boundBufferBases[t] = null, i.bindBufferRange(i.UNIFORM_BUFFER, t || 0, e.buffer, n * 256, r || 256);
	}
	updateBuffer(e) {
		let { _gl: t } = this, n = this.getGlBuffer(e);
		if (e._updateID === n.updateID) return n;
		n.updateID = e._updateID, t.bindBuffer(n.type, n.buffer);
		let r = e.data, i = e.descriptor.usage & T.STATIC ? t.STATIC_DRAW : t.DYNAMIC_DRAW;
		return r ? n.byteLength >= r.byteLength ? t.bufferSubData(n.type, 0, r, 0, e._updateSize / r.BYTES_PER_ELEMENT) : (n.byteLength = r.byteLength, t.bufferData(n.type, r, i)) : (n.byteLength = e.descriptor.size, t.bufferData(n.type, n.byteLength, i)), n;
	}
	destroyAll(e = !1) {
		this._managedBuffers.removeAll(e);
	}
	onBufferUnload(e, t = !1) {
		let n = e._gpuData[this._renderer.uid];
		n && (t || this._gl.deleteBuffer(n.buffer));
	}
	createGLBuffer(e) {
		let { _gl: t } = this, n = Zt.ARRAY_BUFFER;
		e.descriptor.usage & T.INDEX ? n = Zt.ELEMENT_ARRAY_BUFFER : e.descriptor.usage & T.UNIFORM && (n = Zt.UNIFORM_BUFFER);
		let r = new Qt(t.createBuffer(), n);
		return e._gpuData[this._renderer.uid] = r, this._managedBuffers.add(e), r;
	}
	resetState() {
		this._boundBufferBases = /* @__PURE__ */ Object.create(null);
	}
};
$t.extension = {
	type: [O.WebGLSystem],
	name: "buffer"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/context/GlContextSystem.mjs
var en = class e {
	constructor(e) {
		this.supports = {
			uint32Indices: !0,
			uniformBufferObject: !0,
			vertexArrayObject: !0,
			srgbTextures: !0,
			nonPowOf2wrapping: !0,
			msaa: !0,
			nonPowOf2mipmaps: !0
		}, this._renderer = e, this.extensions = /* @__PURE__ */ Object.create(null), this.handleContextLost = this.handleContextLost.bind(this), this.handleContextRestored = this.handleContextRestored.bind(this);
	}
	get isLost() {
		return !this.gl || this.gl.isContextLost();
	}
	contextChange(e) {
		this.gl = e, this._renderer.gl = e;
	}
	init(t) {
		t = {
			...e.defaultOptions,
			...t
		};
		let n = this.multiView = t.multiView;
		if (t.context && n && (d("Renderer created with both a context and multiview enabled. Disabling multiView as both cannot work together."), n = !1), this.canvas = n ? w.get().createCanvas(this._renderer.canvas.width, this._renderer.canvas.height) : this._renderer.view.canvas, t.context) this.initFromContext(t.context);
		else {
			let e = this._renderer.background.alpha < 1, n = t.premultipliedAlpha ?? !0, r = t.antialias && !this._renderer.backBuffer.useBackBuffer;
			this.createContext(t.preferWebGLVersion, {
				alpha: e,
				premultipliedAlpha: n,
				antialias: r,
				stencil: !0,
				preserveDrawingBuffer: t.preserveDrawingBuffer,
				powerPreference: t.powerPreference ?? "default"
			});
		}
	}
	ensureCanvasSize(e) {
		if (!this.multiView) {
			e !== this.canvas && d("multiView is disabled, but targetCanvas is not the main canvas");
			return;
		}
		let { canvas: t } = this;
		(t.width < e.width || t.height < e.height) && (t.width = Math.max(e.width, e.width), t.height = Math.max(e.height, e.height));
	}
	initFromContext(e) {
		this.gl = e, this.webGLVersion = e instanceof w.get().getWebGLRenderingContext() ? 1 : 2, this.getExtensions(), this.validateContext(e), this._renderer.runners.contextChange.emit(e);
		let t = this._renderer.view.canvas;
		t.addEventListener("webglcontextlost", this.handleContextLost, !1), t.addEventListener("webglcontextrestored", this.handleContextRestored, !1);
	}
	createContext(e, t) {
		let n, r = this.canvas;
		if (e === 2 && (n = r.getContext("webgl2", t)), !n && (n = r.getContext("webgl", t), !n)) throw Error("This browser does not support WebGL. Try using the canvas renderer");
		this.gl = n, this.initFromContext(this.gl);
	}
	getExtensions() {
		let { gl: e } = this, t = {
			anisotropicFiltering: e.getExtension("EXT_texture_filter_anisotropic"),
			floatTextureLinear: e.getExtension("OES_texture_float_linear"),
			s3tc: e.getExtension("WEBGL_compressed_texture_s3tc"),
			s3tc_sRGB: e.getExtension("WEBGL_compressed_texture_s3tc_srgb"),
			etc: e.getExtension("WEBGL_compressed_texture_etc"),
			etc1: e.getExtension("WEBGL_compressed_texture_etc1"),
			pvrtc: e.getExtension("WEBGL_compressed_texture_pvrtc") || e.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc"),
			atc: e.getExtension("WEBGL_compressed_texture_atc"),
			astc: e.getExtension("WEBGL_compressed_texture_astc"),
			bptc: e.getExtension("EXT_texture_compression_bptc"),
			rgtc: e.getExtension("EXT_texture_compression_rgtc"),
			loseContext: e.getExtension("WEBGL_lose_context")
		};
		if (this.webGLVersion === 1) this.extensions = {
			...t,
			drawBuffers: e.getExtension("WEBGL_draw_buffers"),
			depthTexture: e.getExtension("WEBGL_depth_texture"),
			vertexArrayObject: e.getExtension("OES_vertex_array_object") || e.getExtension("MOZ_OES_vertex_array_object") || e.getExtension("WEBKIT_OES_vertex_array_object"),
			uint32ElementIndex: e.getExtension("OES_element_index_uint"),
			floatTexture: e.getExtension("OES_texture_float"),
			floatTextureLinear: e.getExtension("OES_texture_float_linear"),
			textureHalfFloat: e.getExtension("OES_texture_half_float"),
			textureHalfFloatLinear: e.getExtension("OES_texture_half_float_linear"),
			vertexAttribDivisorANGLE: e.getExtension("ANGLE_instanced_arrays"),
			srgb: e.getExtension("EXT_sRGB")
		};
		else {
			this.extensions = {
				...t,
				colorBufferFloat: e.getExtension("EXT_color_buffer_float")
			};
			let n = e.getExtension("WEBGL_provoking_vertex");
			n && n.provokingVertexWEBGL(n.FIRST_VERTEX_CONVENTION_WEBGL);
		}
	}
	handleContextLost(e) {
		e.preventDefault(), this._contextLossForced && (this._contextLossForced = !1, setTimeout(() => {
			this.gl.isContextLost() && this.extensions.loseContext?.restoreContext();
		}, 0));
	}
	handleContextRestored() {
		this.getExtensions(), this._renderer.runners.contextChange.emit(this.gl);
	}
	destroy() {
		let e = this._renderer.view.canvas;
		this._renderer = null, e.removeEventListener("webglcontextlost", this.handleContextLost), e.removeEventListener("webglcontextrestored", this.handleContextRestored), this.gl.useProgram(null), this.extensions.loseContext?.loseContext();
	}
	forceContextLoss() {
		this.extensions.loseContext?.loseContext(), this._contextLossForced = !0;
	}
	validateContext(e) {
		let t = e.getContextAttributes();
		t && !t.stencil && d("Provided WebGL context does not have a stencil buffer, masks may not render correctly");
		let n = this.supports, r = this.webGLVersion === 2, i = this.extensions;
		n.uint32Indices = r || !!i.uint32ElementIndex, n.uniformBufferObject = r, n.vertexArrayObject = r || !!i.vertexArrayObject, n.srgbTextures = r || !!i.srgb, n.nonPowOf2wrapping = r, n.nonPowOf2mipmaps = r, n.msaa = r, n.uint32Indices || d("Provided WebGL context does not support 32 index buffer, large scenes may not render correctly");
	}
};
en.extension = {
	type: [O.WebGLSystem],
	name: "context"
}, en.defaultOptions = {
	context: null,
	premultipliedAlpha: !0,
	preserveDrawingBuffer: !1,
	powerPreference: void 0,
	preferWebGLVersion: 2,
	multiView: !1
};
var tn = en, nn = /* @__PURE__ */ ((e) => (e[e.RGBA = 6408] = "RGBA", e[e.RGB = 6407] = "RGB", e[e.RG = 33319] = "RG", e[e.RED = 6403] = "RED", e[e.RGBA_INTEGER = 36249] = "RGBA_INTEGER", e[e.RGB_INTEGER = 36248] = "RGB_INTEGER", e[e.RG_INTEGER = 33320] = "RG_INTEGER", e[e.RED_INTEGER = 36244] = "RED_INTEGER", e[e.ALPHA = 6406] = "ALPHA", e[e.LUMINANCE = 6409] = "LUMINANCE", e[e.LUMINANCE_ALPHA = 6410] = "LUMINANCE_ALPHA", e[e.DEPTH_COMPONENT = 6402] = "DEPTH_COMPONENT", e[e.DEPTH_STENCIL = 34041] = "DEPTH_STENCIL", e))(nn || {}), rn = /* @__PURE__ */ ((e) => (e[e.TEXTURE_2D = 3553] = "TEXTURE_2D", e[e.TEXTURE_CUBE_MAP = 34067] = "TEXTURE_CUBE_MAP", e[e.TEXTURE_2D_ARRAY = 35866] = "TEXTURE_2D_ARRAY", e[e.TEXTURE_CUBE_MAP_POSITIVE_X = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X", e[e.TEXTURE_CUBE_MAP_NEGATIVE_X = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X", e[e.TEXTURE_CUBE_MAP_POSITIVE_Y = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y", e[e.TEXTURE_CUBE_MAP_NEGATIVE_Y = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y", e[e.TEXTURE_CUBE_MAP_POSITIVE_Z = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z", e[e.TEXTURE_CUBE_MAP_NEGATIVE_Z = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z", e))(rn || {}), G = /* @__PURE__ */ ((e) => (e[e.UNSIGNED_BYTE = 5121] = "UNSIGNED_BYTE", e[e.UNSIGNED_SHORT = 5123] = "UNSIGNED_SHORT", e[e.UNSIGNED_SHORT_5_6_5 = 33635] = "UNSIGNED_SHORT_5_6_5", e[e.UNSIGNED_SHORT_4_4_4_4 = 32819] = "UNSIGNED_SHORT_4_4_4_4", e[e.UNSIGNED_SHORT_5_5_5_1 = 32820] = "UNSIGNED_SHORT_5_5_5_1", e[e.UNSIGNED_INT = 5125] = "UNSIGNED_INT", e[e.UNSIGNED_INT_10F_11F_11F_REV = 35899] = "UNSIGNED_INT_10F_11F_11F_REV", e[e.UNSIGNED_INT_2_10_10_10_REV = 33640] = "UNSIGNED_INT_2_10_10_10_REV", e[e.UNSIGNED_INT_24_8 = 34042] = "UNSIGNED_INT_24_8", e[e.UNSIGNED_INT_5_9_9_9_REV = 35902] = "UNSIGNED_INT_5_9_9_9_REV", e[e.BYTE = 5120] = "BYTE", e[e.SHORT = 5122] = "SHORT", e[e.INT = 5124] = "INT", e[e.FLOAT = 5126] = "FLOAT", e[e.FLOAT_32_UNSIGNED_INT_24_8_REV = 36269] = "FLOAT_32_UNSIGNED_INT_24_8_REV", e[e.HALF_FLOAT = 36193] = "HALF_FLOAT", e))(G || {}), an = {
	uint8x2: G.UNSIGNED_BYTE,
	uint8x4: G.UNSIGNED_BYTE,
	sint8x2: G.BYTE,
	sint8x4: G.BYTE,
	unorm8x2: G.UNSIGNED_BYTE,
	unorm8x4: G.UNSIGNED_BYTE,
	snorm8x2: G.BYTE,
	snorm8x4: G.BYTE,
	uint16x2: G.UNSIGNED_SHORT,
	uint16x4: G.UNSIGNED_SHORT,
	sint16x2: G.SHORT,
	sint16x4: G.SHORT,
	unorm16x2: G.UNSIGNED_SHORT,
	unorm16x4: G.UNSIGNED_SHORT,
	snorm16x2: G.SHORT,
	snorm16x4: G.SHORT,
	float16x2: G.HALF_FLOAT,
	float16x4: G.HALF_FLOAT,
	float32: G.FLOAT,
	float32x2: G.FLOAT,
	float32x3: G.FLOAT,
	float32x4: G.FLOAT,
	uint32: G.UNSIGNED_INT,
	uint32x2: G.UNSIGNED_INT,
	uint32x3: G.UNSIGNED_INT,
	uint32x4: G.UNSIGNED_INT,
	sint32: G.INT,
	sint32x2: G.INT,
	sint32x3: G.INT,
	sint32x4: G.INT
};
function on(e) {
	return an[e] ?? an.float32;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/geometry/GlGeometrySystem.mjs
var sn = {
	"point-list": 0,
	"line-list": 1,
	"line-strip": 3,
	"triangle-list": 4,
	"triangle-strip": 5
}, cn = class {
	constructor() {
		this.vaoCache = /* @__PURE__ */ Object.create(null);
	}
	destroy() {
		this.vaoCache = /* @__PURE__ */ Object.create(null);
	}
}, ln = class {
	constructor(e) {
		this._renderer = e, this._activeGeometry = null, this._activeVao = null, this.hasVao = !0, this.hasInstance = !0, this._managedGeometries = new H({
			renderer: e,
			type: "resource",
			onUnload: this.onGeometryUnload.bind(this),
			name: "glGeometry"
		});
	}
	contextChange() {
		let e = this.gl = this._renderer.gl;
		if (!this._renderer.context.supports.vertexArrayObject) throw Error("[PixiJS] Vertex Array Objects are not supported on this device");
		this.destroyAll(!0);
		let t = this._renderer.context.extensions.vertexArrayObject;
		t && (e.createVertexArray = () => t.createVertexArrayOES(), e.bindVertexArray = (e) => t.bindVertexArrayOES(e), e.deleteVertexArray = (e) => t.deleteVertexArrayOES(e));
		let n = this._renderer.context.extensions.vertexAttribDivisorANGLE;
		n && (e.drawArraysInstanced = (e, t, r, i) => {
			n.drawArraysInstancedANGLE(e, t, r, i);
		}, e.drawElementsInstanced = (e, t, r, i, a) => {
			n.drawElementsInstancedANGLE(e, t, r, i, a);
		}, e.vertexAttribDivisor = (e, t) => n.vertexAttribDivisorANGLE(e, t)), this._activeGeometry = null, this._activeVao = null;
	}
	bind(e, t) {
		let n = this.gl;
		this._activeGeometry = e;
		let r = this.getVao(e, t);
		this._activeVao !== r && (this._activeVao = r, n.bindVertexArray(r)), this.updateBuffers();
	}
	resetState() {
		this.unbind();
	}
	updateBuffers() {
		let e = this._activeGeometry, t = this._renderer.buffer;
		for (let n = 0; n < e.buffers.length; n++) {
			let r = e.buffers[n];
			t.updateBuffer(r);
		}
		e._gcLastUsed = this._renderer.gc.now;
	}
	checkCompatibility(e, t) {
		let n = e.attributes, r = t._attributeData;
		for (let e in r) if (!n[e]) throw Error(`shader and geometry incompatible, geometry missing the "${e}" attribute`);
	}
	getSignature(e, t) {
		let n = e.attributes, r = t._attributeData, i = ["g", e.uid];
		for (let e in n) r[e] && i.push(e, r[e].location);
		return i.join("-");
	}
	getVao(e, t) {
		return e._gpuData[this._renderer.uid]?.vaoCache[t._key] || this.initGeometryVao(e, t);
	}
	initGeometryVao(e, t, n = !0) {
		let r = this._renderer.gl, i = this._renderer.buffer;
		this._renderer.shader._getProgramData(t), this.checkCompatibility(e, t);
		let a = this.getSignature(e, t), o = e._gpuData[this._renderer.uid];
		o || (o = new cn(), e._gpuData[this._renderer.uid] = o, this._managedGeometries.add(e));
		let s = o.vaoCache, c = s[a];
		if (c) return s[t._key] = c, c;
		Je(e, t._attributeData);
		let l = e.buffers;
		c = r.createVertexArray(), r.bindVertexArray(c);
		for (let e = 0; e < l.length; e++) {
			let t = l[e];
			i.bind(t);
		}
		return this.activateVao(e, t), s[t._key] = c, s[a] = c, r.bindVertexArray(null), c;
	}
	onGeometryUnload(e, t = !1) {
		let n = e._gpuData[this._renderer.uid];
		if (!n) return;
		let r = n.vaoCache;
		if (!t) for (let e in r) this._activeVao !== r[e] && this.resetState(), this.gl.deleteVertexArray(r[e]);
	}
	destroyAll(e = !1) {
		this._managedGeometries.removeAll(e);
	}
	activateVao(e, t) {
		let n = this._renderer.gl, r = this._renderer.buffer, i = e.attributes;
		e.indexBuffer && r.bind(e.indexBuffer);
		let a = null;
		for (let e in i) {
			let o = i[e], s = o.buffer, c = r.getGlBuffer(s), l = t._attributeData[e];
			if (l) {
				a !== c && (r.bind(s), a = c);
				let e = l.location;
				n.enableVertexAttribArray(e);
				let t = b(o.format), i = on(o.format);
				if (l.format?.substring(1, 4) === "int" ? n.vertexAttribIPointer(e, t.size, i, o.stride, o.offset) : n.vertexAttribPointer(e, t.size, i, t.normalised, o.stride, o.offset), o.instance) if (this.hasInstance) {
					let t = o.divisor ?? 1;
					n.vertexAttribDivisor(e, t);
				} else throw Error("geometry error, GPU Instancing is not supported on this device");
			}
		}
	}
	draw(e, t, n, r) {
		let { gl: i } = this._renderer, a = this._activeGeometry, o = sn[e || a.topology];
		if (r ??= a.instanceCount, a.indexBuffer) {
			let e = a.indexBuffer.data.BYTES_PER_ELEMENT, s = e === 2 ? i.UNSIGNED_SHORT : i.UNSIGNED_INT;
			r === 1 ? i.drawElements(o, t || a.indexBuffer.data.length, s, (n || 0) * e) : i.drawElementsInstanced(o, t || a.indexBuffer.data.length, s, (n || 0) * e, r);
		} else r === 1 ? i.drawArrays(o, n || 0, t || a.getSize()) : i.drawArraysInstanced(o, n || 0, t || a.getSize(), r);
		return this;
	}
	unbind() {
		this.gl.bindVertexArray(null), this._activeVao = null, this._activeGeometry = null;
	}
	destroy() {
		this._managedGeometries.destroy(), this._renderer = null, this.gl = null, this._activeVao = null, this._activeGeometry = null;
	}
};
ln.extension = {
	type: [O.WebGLSystem],
	name: "geometry"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/GlBackBufferSystem.mjs
var un = new ee({ attributes: { aPosition: [
	-1,
	-1,
	3,
	-1,
	-1,
	3
] } }), dn = class e {
	constructor(e) {
		this.useBackBuffer = !1, this._useBackBufferThisRender = !1, this._renderer = e;
	}
	init(t = {}) {
		let { useBackBuffer: n, antialias: r } = {
			...e.defaultOptions,
			...t
		};
		this.useBackBuffer = n, this._antialias = r, this._renderer.context.supports.msaa || (d("antialiasing, is not supported on when using the back buffer"), this._antialias = !1), this._state = k.for2d();
		let i = new te({
			vertex: "\n                attribute vec2 aPosition;\n                out vec2 vUv;\n\n                void main() {\n                    gl_Position = vec4(aPosition, 0.0, 1.0);\n\n                    vUv = (aPosition + 1.0) / 2.0;\n\n                    // flip dem UVs\n                    vUv.y = 1.0 - vUv.y;\n                }",
			fragment: "\n                in vec2 vUv;\n                out vec4 finalColor;\n\n                uniform sampler2D uTexture;\n\n                void main() {\n                    finalColor = texture(uTexture, vUv);\n                }",
			name: "big-triangle"
		});
		this._bigTriangleShader = new v({
			glProgram: i,
			resources: { uTexture: x.WHITE.source }
		});
	}
	renderStart(e) {
		let t = this._renderer.renderTarget.getRenderTarget(e.target);
		if (this._useBackBufferThisRender = this.useBackBuffer && !!t.isRoot, this._useBackBufferThisRender) {
			let t = this._renderer.renderTarget.getRenderTarget(e.target);
			this._targetTexture = t.colorTexture, e.target = this._getBackBufferTexture(t.colorTexture);
		}
	}
	renderEnd() {
		this._presentBackBuffer();
	}
	_presentBackBuffer() {
		let e = this._renderer;
		e.renderTarget.finishRenderPass(), this._useBackBufferThisRender && (e.renderTarget.bind(this._targetTexture, !1), this._bigTriangleShader.resources.uTexture = this._backBufferTexture.source, e.encoder.draw({
			geometry: un,
			shader: this._bigTriangleShader,
			state: this._state
		}));
	}
	_getBackBufferTexture(e) {
		return this._backBufferTexture = this._backBufferTexture || new x({ source: new D({
			width: e.width,
			height: e.height,
			resolution: e._resolution,
			antialias: this._antialias
		}) }), this._backBufferTexture.source.resize(e.width, e.height, e._resolution), this._backBufferTexture;
	}
	destroy() {
		this._backBufferTexture &&= (this._backBufferTexture.destroy(), null);
	}
};
dn.extension = {
	type: [O.WebGLSystem],
	name: "backBuffer",
	priority: 1
}, dn.defaultOptions = { useBackBuffer: !1 };
var fn = dn, pn = class {
	constructor(e) {
		this._colorMaskCache = 15, this._renderer = e;
	}
	setMask(e) {
		this._colorMaskCache !== e && (this._colorMaskCache = e, this._renderer.gl.colorMask(!!(e & 8), !!(e & 4), !!(e & 2), !!(e & 1)));
	}
};
pn.extension = {
	type: [O.WebGLSystem],
	name: "colorMask"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/GlEncoderSystem.mjs
var mn = class {
	constructor(e) {
		this.commandFinished = Promise.resolve(), this._renderer = e;
	}
	setGeometry(e, t) {
		this._renderer.geometry.bind(e, t.glProgram);
	}
	finishRenderPass() {}
	draw(e) {
		let t = this._renderer, { geometry: n, shader: r, state: i, skipSync: a, topology: o, size: s, start: c, instanceCount: l } = e;
		t.shader.bind(r, a), t.geometry.bind(n, t.shader._activeProgram), i && t.state.set(i), t.geometry.draw(o, s, c, l ?? n.instanceCount);
	}
	destroy() {
		this._renderer = null;
	}
};
mn.extension = {
	type: [O.WebGLSystem],
	name: "encoder"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/GlLimitsSystem.mjs
var hn = class {
	constructor(e) {
		this._renderer = e;
	}
	contextChange() {
		let e = this._renderer.gl;
		this.maxTextures = e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS), this.maxBatchableTextures = Re(this.maxTextures, e);
		let t = this._renderer.context.webGLVersion === 2;
		this.maxUniformBindings = t ? e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS) : 0;
	}
	destroy() {}
};
hn.extension = {
	type: [O.WebGLSystem],
	name: "limits"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/GlStencilSystem.mjs
var gn = class {
	constructor(e) {
		this._stencilCache = {
			enabled: !1,
			stencilReference: 0,
			stencilMode: V.NONE
		}, this._renderTargetStencilState = /* @__PURE__ */ Object.create(null), e.renderTarget.onRenderTargetChange.add(this);
	}
	contextChange(e) {
		this._gl = e, this._comparisonFuncMapping = {
			always: e.ALWAYS,
			never: e.NEVER,
			equal: e.EQUAL,
			"not-equal": e.NOTEQUAL,
			less: e.LESS,
			"less-equal": e.LEQUAL,
			greater: e.GREATER,
			"greater-equal": e.GEQUAL
		}, this._stencilOpsMapping = {
			keep: e.KEEP,
			zero: e.ZERO,
			replace: e.REPLACE,
			invert: e.INVERT,
			"increment-clamp": e.INCR,
			"decrement-clamp": e.DECR,
			"increment-wrap": e.INCR_WRAP,
			"decrement-wrap": e.DECR_WRAP
		}, this.resetState();
	}
	onRenderTargetChange(e) {
		if (this._activeRenderTarget === e) return;
		this._activeRenderTarget = e;
		let t = this._renderTargetStencilState[e.uid];
		t ||= this._renderTargetStencilState[e.uid] = {
			stencilMode: V.DISABLED,
			stencilReference: 0
		}, this.setStencilMode(t.stencilMode, t.stencilReference);
	}
	resetState() {
		this._stencilCache.enabled = !1, this._stencilCache.stencilMode = V.NONE, this._stencilCache.stencilReference = 0;
	}
	setStencilMode(e, t) {
		let n = this._renderTargetStencilState[this._activeRenderTarget.uid], r = this._gl, i = rt[e], a = this._stencilCache;
		if (n.stencilMode = e, n.stencilReference = t, e === V.DISABLED) {
			this._stencilCache.enabled && (this._stencilCache.enabled = !1, r.disable(r.STENCIL_TEST));
			return;
		}
		this._stencilCache.enabled || (this._stencilCache.enabled = !0, r.enable(r.STENCIL_TEST)), (e !== a.stencilMode || a.stencilReference !== t) && (a.stencilMode = e, a.stencilReference = t, r.stencilFunc(this._comparisonFuncMapping[i.stencilBack.compare], t, 255), r.stencilOp(r.KEEP, r.KEEP, this._stencilOpsMapping[i.stencilBack.passOp]));
	}
};
gn.extension = {
	type: [O.WebGLSystem],
	name: "stencil"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/createUboElementsSTD40.mjs
var _n = {
	f32: 4,
	i32: 4,
	"vec2<f32>": 8,
	"vec3<f32>": 12,
	"vec4<f32>": 16,
	"vec2<i32>": 8,
	"vec3<i32>": 12,
	"vec4<i32>": 16,
	"mat2x2<f32>": 32,
	"mat3x3<f32>": 48,
	"mat4x4<f32>": 64
};
function vn(e) {
	let t = e.map((e) => ({
		data: e,
		offset: 0,
		size: 0
	})), n = 0, r = 0;
	for (let e = 0; e < t.length; e++) {
		let i = t[e];
		if (n = _n[i.data.type], !n) throw Error(`Unknown type ${i.data.type}`);
		i.data.size > 1 && (n = Math.max(n, 16) * i.data.size);
		let a = n === 12 ? 16 : n;
		i.size = n;
		let o = r % 16;
		o > 0 && 16 - o < a ? r += (16 - o) % 16 : r += (n - o % n) % n, i.offset = r, r += n;
	}
	return r = Math.ceil(r / 16) * 16, {
		uboElements: t,
		size: r
	};
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/generateArraySyncSTD40.mjs
function yn(e, t) {
	let n = Math.max(_n[e.data.type] / 16, 1), r = e.data.value.length / e.data.size, i = (4 - r % 4) % 4, a = e.data.type.indexOf("i32") >= 0 ? "dataInt32" : "data";
	return `
        v = uv.${e.data.name};
        offset += ${t};

        arrayOffset = offset;

        t = 0;

        for(var i=0; i < ${e.data.size * n}; i++)
        {
            for(var j = 0; j < ${r}; j++)
            {
                ${a}[arrayOffset++] = v[t++];
            }
            ${i === 0 ? "" : `arrayOffset += ${i};`}
        }
    `;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/createUboSyncSTD40.mjs
function bn(e) {
	return Ze(e, "uboStd40", yn, $e);
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/GlUboSystem.mjs
var xn = class extends et {
	constructor() {
		super({
			createUboElements: vn,
			generateUboSync: bn
		});
	}
};
xn.extension = {
	type: [O.WebGLSystem],
	name: "ubo"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/GlRenderTarget.mjs
var Sn = class {
	constructor() {
		this.width = -1, this.height = -1, this.msaa = !1, this._attachedMipLevel = 0, this._attachedLayer = 0, this.msaaRenderBuffer = [];
	}
}, Cn = class {
	constructor() {
		this._clearColorCache = [
			0,
			0,
			0,
			0
		], this._viewPortCache = new m();
	}
	init(e, t) {
		this._renderer = e, this._renderTargetSystem = t, e.runners.contextChange.add(this);
	}
	contextChange() {
		this._clearColorCache = [
			0,
			0,
			0,
			0
		], this._viewPortCache = new m();
		let e = this._renderer.gl;
		this._drawBuffersCache = [];
		for (let t = 1; t <= 16; t++) this._drawBuffersCache[t] = Array.from({ length: t }, (t, n) => e.COLOR_ATTACHMENT0 + n);
	}
	copyToTexture(e, t, n, r, i) {
		let a = this._renderTargetSystem, o = this._renderer, s = a.getGpuRenderTarget(e), c = o.gl;
		return this.finishRenderPass(e), c.bindFramebuffer(c.FRAMEBUFFER, s.resolveTargetFramebuffer), o.texture.bind(t, 0), c.copyTexSubImage2D(c.TEXTURE_2D, 0, i.x, i.y, n.x, n.y, r.width, r.height), t;
	}
	startRenderPass(e, t = !0, n, r, i = 0, a = 0) {
		let o = this._renderTargetSystem, s = e.colorTexture, c = o.getGpuRenderTarget(e);
		if (a !== 0 && this._renderer.context.webGLVersion < 2) throw Error("[RenderTargetSystem] Rendering to array layers requires WebGL2.");
		if (i > 0) {
			if (c.msaa) throw Error("[RenderTargetSystem] Rendering to mip levels is not supported with MSAA render targets.");
			if (this._renderer.context.webGLVersion < 2) throw Error("[RenderTargetSystem] Rendering to mip levels requires WebGL2.");
		}
		let l = r.y;
		e.isRoot && (l = s.pixelHeight - r.height - r.y), e.colorTextures.forEach((e) => {
			this._renderer.texture.unbind(e);
		});
		let u = this._renderer.gl;
		u.bindFramebuffer(u.FRAMEBUFFER, c.framebuffer), !e.isRoot && (c._attachedMipLevel !== i || c._attachedLayer !== a) && (e.colorTextures.forEach((e, t) => {
			let n = this._renderer.texture.getGlSource(e);
			if (n.target === u.TEXTURE_2D) {
				if (a !== 0) throw Error("[RenderTargetSystem] layer must be 0 when rendering to 2D textures in WebGL.");
				u.framebufferTexture2D(u.FRAMEBUFFER, u.COLOR_ATTACHMENT0 + t, u.TEXTURE_2D, n.texture, i);
			} else if (n.target === u.TEXTURE_2D_ARRAY) {
				if (this._renderer.context.webGLVersion < 2) throw Error("[RenderTargetSystem] Rendering to 2D array textures requires WebGL2.");
				u.framebufferTextureLayer(u.FRAMEBUFFER, u.COLOR_ATTACHMENT0 + t, n.texture, i, a);
			} else if (n.target === u.TEXTURE_CUBE_MAP) {
				if (a < 0 || a > 5) throw Error("[RenderTargetSystem] Cube map layer must be between 0 and 5.");
				u.framebufferTexture2D(u.FRAMEBUFFER, u.COLOR_ATTACHMENT0 + t, u.TEXTURE_CUBE_MAP_POSITIVE_X + a, n.texture, i);
			} else throw Error("[RenderTargetSystem] Unsupported texture target for render-to-layer in WebGL.");
		}), c._attachedMipLevel = i, c._attachedLayer = a), e.colorTextures.length > 1 && this._setDrawBuffers(e, u);
		let d = this._viewPortCache;
		(d.x !== r.x || d.y !== l || d.width !== r.width || d.height !== r.height) && (d.x = r.x, d.y = l, d.width = r.width, d.height = r.height, u.viewport(r.x, l, r.width, r.height)), !c.depthStencilRenderBuffer && (e.stencil || e.depth) && this._initStencil(c), this.clear(e, t, n);
	}
	finishRenderPass(e) {
		let t = this._renderTargetSystem.getGpuRenderTarget(e);
		if (!t.msaa) return;
		let n = this._renderer.gl;
		n.bindFramebuffer(n.FRAMEBUFFER, t.resolveTargetFramebuffer), n.bindFramebuffer(n.READ_FRAMEBUFFER, t.framebuffer), n.blitFramebuffer(0, 0, t.width, t.height, 0, 0, t.width, t.height, n.COLOR_BUFFER_BIT, n.NEAREST), n.bindFramebuffer(n.FRAMEBUFFER, t.framebuffer);
	}
	initGpuRenderTarget(e) {
		let t = this._renderer.gl, n = new Sn();
		return n._attachedMipLevel = 0, n._attachedLayer = 0, e.colorTexture instanceof A ? (this._renderer.context.ensureCanvasSize(e.colorTexture.resource), n.framebuffer = null, n) : (this._initColor(e, n), t.bindFramebuffer(t.FRAMEBUFFER, null), n);
	}
	destroyGpuRenderTarget(e) {
		let t = this._renderer.gl;
		e.framebuffer &&= (t.deleteFramebuffer(e.framebuffer), null), e.resolveTargetFramebuffer &&= (t.deleteFramebuffer(e.resolveTargetFramebuffer), null), e.depthStencilRenderBuffer &&= (t.deleteRenderbuffer(e.depthStencilRenderBuffer), null), e.msaaRenderBuffer.forEach((e) => {
			t.deleteRenderbuffer(e);
		}), e.msaaRenderBuffer = null;
	}
	clear(e, t, n, r, i = 0, a = 0) {
		if (!t) return;
		if (a !== 0) throw Error("[RenderTargetSystem] Clearing array layers is not supported in WebGL renderer.");
		let o = this._renderTargetSystem;
		typeof t == "boolean" && (t = t ? B.ALL : B.NONE);
		let s = this._renderer.gl;
		if (t & B.COLOR) {
			n ??= o.defaultClearColor;
			let e = this._clearColorCache, t = n;
			(e[0] !== t[0] || e[1] !== t[1] || e[2] !== t[2] || e[3] !== t[3]) && (e[0] = t[0], e[1] = t[1], e[2] = t[2], e[3] = t[3], s.clearColor(t[0], t[1], t[2], t[3]));
		}
		s.clear(t);
	}
	resizeGpuRenderTarget(e) {
		if (e.isRoot) return;
		let t = this._renderTargetSystem.getGpuRenderTarget(e);
		this._resizeColor(e, t), (e.stencil || e.depth) && this._resizeStencil(t);
	}
	_initColor(e, t) {
		let n = this._renderer, r = n.gl, i = r.createFramebuffer();
		if (t.resolveTargetFramebuffer = i, r.bindFramebuffer(r.FRAMEBUFFER, i), t.width = e.colorTexture.source.pixelWidth, t.height = e.colorTexture.source.pixelHeight, e.colorTextures.forEach((e, i) => {
			let a = e.source;
			a.antialias && (n.context.supports.msaa ? t.msaa = !0 : d("[RenderTexture] Antialiasing on textures is not supported in WebGL1")), n.texture.bindSource(a, 0);
			let o = n.texture.getGlSource(a), s = o.texture;
			if (o.target === r.TEXTURE_2D) r.framebufferTexture2D(r.FRAMEBUFFER, r.COLOR_ATTACHMENT0 + i, r.TEXTURE_2D, s, 0);
			else if (o.target === r.TEXTURE_2D_ARRAY) {
				if (n.context.webGLVersion < 2) throw Error("[RenderTargetSystem] TEXTURE_2D_ARRAY requires WebGL2.");
				r.framebufferTextureLayer(r.FRAMEBUFFER, r.COLOR_ATTACHMENT0 + i, s, 0, 0);
			} else if (o.target === r.TEXTURE_CUBE_MAP) r.framebufferTexture2D(r.FRAMEBUFFER, r.COLOR_ATTACHMENT0 + i, r.TEXTURE_CUBE_MAP_POSITIVE_X, s, 0);
			else throw Error("[RenderTargetSystem] Unsupported texture target for framebuffer attachment.");
		}), t.msaa) {
			let n = r.createFramebuffer();
			t.framebuffer = n, r.bindFramebuffer(r.FRAMEBUFFER, n), e.colorTextures.forEach((e, n) => {
				let i = r.createRenderbuffer();
				t.msaaRenderBuffer[n] = i;
			});
		} else t.framebuffer = i;
		this._resizeColor(e, t);
	}
	_resizeColor(e, t) {
		let n = e.colorTexture.source;
		if (t.width = n.pixelWidth, t.height = n.pixelHeight, t._attachedMipLevel = 0, t._attachedLayer = 0, e.colorTextures.forEach((e, t) => {
			t !== 0 && e.source.resize(n.width, n.height, n._resolution);
		}), t.msaa) {
			let n = this._renderer, r = n.gl, i = t.framebuffer;
			r.bindFramebuffer(r.FRAMEBUFFER, i), e.colorTextures.forEach((e, i) => {
				let a = e.source;
				n.texture.bindSource(a, 0);
				let o = n.texture.getGlSource(a).internalFormat, s = t.msaaRenderBuffer[i];
				r.bindRenderbuffer(r.RENDERBUFFER, s), r.renderbufferStorageMultisample(r.RENDERBUFFER, 4, o, a.pixelWidth, a.pixelHeight), r.framebufferRenderbuffer(r.FRAMEBUFFER, r.COLOR_ATTACHMENT0 + i, r.RENDERBUFFER, s);
			});
		}
	}
	_initStencil(e) {
		if (e.framebuffer === null) return;
		let t = this._renderer.gl, n = t.createRenderbuffer();
		e.depthStencilRenderBuffer = n, t.bindRenderbuffer(t.RENDERBUFFER, n), t.framebufferRenderbuffer(t.FRAMEBUFFER, t.DEPTH_STENCIL_ATTACHMENT, t.RENDERBUFFER, n), this._resizeStencil(e);
	}
	_resizeStencil(e) {
		let t = this._renderer.gl;
		t.bindRenderbuffer(t.RENDERBUFFER, e.depthStencilRenderBuffer), e.msaa ? t.renderbufferStorageMultisample(t.RENDERBUFFER, 4, t.DEPTH24_STENCIL8, e.width, e.height) : t.renderbufferStorage(t.RENDERBUFFER, this._renderer.context.webGLVersion === 2 ? t.DEPTH24_STENCIL8 : t.DEPTH_STENCIL, e.width, e.height);
	}
	prerender(e) {
		let t = e.colorTexture.resource;
		this._renderer.context.multiView && A.test(t) && this._renderer.context.ensureCanvasSize(t);
	}
	postrender(e) {
		if (this._renderer.context.multiView && A.test(e.colorTexture.resource)) {
			let t = this._renderer.context.canvas, n = e.colorTexture;
			n.context2D.drawImage(t, 0, n.pixelHeight - t.height);
		}
	}
	_setDrawBuffers(e, t) {
		let n = e.colorTextures.length, r = this._drawBuffersCache[n];
		if (this._renderer.context.webGLVersion === 1) {
			let e = this._renderer.context.extensions.drawBuffers;
			e ? e.drawBuffersWEBGL(r) : d("[RenderTexture] This WebGL1 context does not support rendering to multiple targets");
		} else t.drawBuffers(r);
	}
}, wn = class extends Ne {
	constructor(e) {
		super(e), this.adaptor = new Cn(), this.adaptor.init(e, this);
	}
};
wn.extension = {
	type: [O.WebGLSystem],
	name: "renderTarget"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/GenerateShaderSyncCode.mjs
function Tn(e, t) {
	let n = [], r = ["\n        var g = s.groups;\n        var sS = r.shader;\n        var p = s.glProgram;\n        var ugS = r.uniformGroup;\n        var resources;\n    "], i = !1, a = 0, o = t._getProgramData(e.glProgram);
	for (let s in e.groups) {
		let c = e.groups[s];
		n.push(`
            resources = g[${s}].resources;
        `);
		for (let l in c.resources) {
			let u = c.resources[l];
			if (u instanceof g) if (u.ubo) {
				let t = e._uniformBindMap[s][Number(l)];
				n.push(`
                        sS.bindUniformBlock(
                            resources[${l}],
                            '${t}',
                            ${e.glProgram._uniformBlockData[t].index}
                        );
                    `);
			} else n.push(`
                        ugS.updateUniformGroup(resources[${l}], p, sD);
                    `);
			else if (u instanceof it) {
				let t = e._uniformBindMap[s][Number(l)];
				n.push(`
                    sS.bindUniformBlock(
                        resources[${l}],
                        '${t}',
                        ${e.glProgram._uniformBlockData[t].index}
                    );
                `);
			} else if (u instanceof D) {
				let c = e._uniformBindMap[s][l], u = o.uniformData[c];
				u && (i || (i = !0, r.push("\n                        var tS = r.texture;\n                        ")), t._gl.uniform1i(u.location, a), n.push(`
                        tS.bind(resources[${l}], ${a});
                    `), a++);
			}
		}
	}
	let s = [...r, ...n].join("\n");
	return Function("r", "s", "sD", s);
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlProgramData.mjs
var En = class {
	constructor(e, t) {
		this.program = e, this.uniformData = t, this.uniformGroups = {}, this.uniformDirtyGroups = {}, this.uniformBlockBindings = {};
	}
	destroy() {
		this.uniformData = null, this.uniformGroups = null, this.uniformDirtyGroups = null, this.uniformBlockBindings = null, this.program = null;
	}
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/compileShader.mjs
function Dn(e, t, n) {
	let r = e.createShader(t);
	return e.shaderSource(r, n), e.compileShader(r), r;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/defaultValue.mjs
function On(e) {
	let t = Array(e);
	for (let e = 0; e < t.length; e++) t[e] = !1;
	return t;
}
function kn(e, t) {
	switch (e) {
		case "float": return 0;
		case "vec2": return new Float32Array(2 * t);
		case "vec3": return new Float32Array(3 * t);
		case "vec4": return new Float32Array(4 * t);
		case "int":
		case "uint":
		case "sampler2D":
		case "sampler2DArray": return 0;
		case "ivec2": return new Int32Array(2 * t);
		case "ivec3": return new Int32Array(3 * t);
		case "ivec4": return new Int32Array(4 * t);
		case "uvec2": return new Uint32Array(2 * t);
		case "uvec3": return new Uint32Array(3 * t);
		case "uvec4": return new Uint32Array(4 * t);
		case "bool": return !1;
		case "bvec2": return On(2 * t);
		case "bvec3": return On(3 * t);
		case "bvec4": return On(4 * t);
		case "mat2": return new Float32Array([
			1,
			0,
			0,
			1
		]);
		case "mat3": return new Float32Array([
			1,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			1
		]);
		case "mat4": return new Float32Array([
			1,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			1
		]);
	}
	return null;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/mapType.mjs
var An = null, jn = {
	FLOAT: "float",
	FLOAT_VEC2: "vec2",
	FLOAT_VEC3: "vec3",
	FLOAT_VEC4: "vec4",
	INT: "int",
	INT_VEC2: "ivec2",
	INT_VEC3: "ivec3",
	INT_VEC4: "ivec4",
	UNSIGNED_INT: "uint",
	UNSIGNED_INT_VEC2: "uvec2",
	UNSIGNED_INT_VEC3: "uvec3",
	UNSIGNED_INT_VEC4: "uvec4",
	BOOL: "bool",
	BOOL_VEC2: "bvec2",
	BOOL_VEC3: "bvec3",
	BOOL_VEC4: "bvec4",
	FLOAT_MAT2: "mat2",
	FLOAT_MAT3: "mat3",
	FLOAT_MAT4: "mat4",
	SAMPLER_2D: "sampler2D",
	INT_SAMPLER_2D: "sampler2D",
	UNSIGNED_INT_SAMPLER_2D: "sampler2D",
	SAMPLER_CUBE: "samplerCube",
	INT_SAMPLER_CUBE: "samplerCube",
	UNSIGNED_INT_SAMPLER_CUBE: "samplerCube",
	SAMPLER_2D_ARRAY: "sampler2DArray",
	INT_SAMPLER_2D_ARRAY: "sampler2DArray",
	UNSIGNED_INT_SAMPLER_2D_ARRAY: "sampler2DArray"
}, Mn = {
	float: "float32",
	vec2: "float32x2",
	vec3: "float32x3",
	vec4: "float32x4",
	int: "sint32",
	ivec2: "sint32x2",
	ivec3: "sint32x3",
	ivec4: "sint32x4",
	uint: "uint32",
	uvec2: "uint32x2",
	uvec3: "uint32x3",
	uvec4: "uint32x4",
	bool: "uint32",
	bvec2: "uint32x2",
	bvec3: "uint32x3",
	bvec4: "uint32x4"
};
function Nn(e, t) {
	if (!An) {
		let t = Object.keys(jn);
		An = {};
		for (let n = 0; n < t.length; ++n) {
			let r = t[n];
			An[e[r]] = jn[r];
		}
	}
	return An[t];
}
function Pn(e, t) {
	return Mn[Nn(e, t)] || "float32";
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/extractAttributesFromGlProgram.mjs
function Fn(e, t, n = !1) {
	let r = {}, i = t.getProgramParameter(e, t.ACTIVE_ATTRIBUTES);
	for (let n = 0; n < i; n++) {
		let i = t.getActiveAttrib(e, n);
		if (i.name.startsWith("gl_")) continue;
		let a = Pn(t, i.type);
		r[i.name] = {
			location: 0,
			format: a,
			stride: b(a).stride,
			offset: 0,
			instance: !1,
			start: 0
		};
	}
	let a = Object.keys(r);
	if (n) {
		a.sort((e, t) => e > t ? 1 : -1);
		for (let n = 0; n < a.length; n++) r[a[n]].location = n, t.bindAttribLocation(e, n, a[n]);
		t.linkProgram(e);
	} else for (let n = 0; n < a.length; n++) r[a[n]].location = t.getAttribLocation(e, a[n]);
	return r;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/getUboData.mjs
function In(e, t) {
	if (!t.ACTIVE_UNIFORM_BLOCKS) return {};
	let n = {}, r = t.getProgramParameter(e, t.ACTIVE_UNIFORM_BLOCKS);
	for (let i = 0; i < r; i++) {
		let r = t.getActiveUniformBlockName(e, i);
		n[r] = {
			name: r,
			index: t.getUniformBlockIndex(e, r),
			size: t.getActiveUniformBlockParameter(e, i, t.UNIFORM_BLOCK_DATA_SIZE)
		};
	}
	return n;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/getUniformData.mjs
function Ln(e, t) {
	let n = {}, r = t.getProgramParameter(e, t.ACTIVE_UNIFORMS);
	for (let i = 0; i < r; i++) {
		let r = t.getActiveUniform(e, i), a = r.name.replace(/\[.*?\]$/, ""), o = !!r.name.match(/\[.*?\]$/), s = Nn(t, r.type);
		n[a] = {
			name: a,
			index: i,
			type: s,
			size: r.size,
			isArray: o,
			value: kn(s, r.size)
		};
	}
	return n;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/logProgramError.mjs
function Rn(e, t) {
	let n = e.getShaderSource(t);
	if (n === null) {
		console.error("PixiJS Error: Could not retrieve shader source (WebGL context may be lost).");
		return;
	}
	let r = n.split("\n").map((e, t) => `${t}: ${e}`), i = e.getShaderInfoLog(t) ?? "", a = i.split("\n"), o = {}, s = a.map((e) => parseFloat(e.replace(/^ERROR\: 0\:([\d]+)\:.*$/, "$1"))).filter((e) => e && !o[e] ? (o[e] = !0, !0) : !1), c = [""];
	s.forEach((e) => {
		r[e - 1] = `%c${r[e - 1]}%c`, c.push("background: #FF0000; color:#FFFFFF; font-size: 10px", "font-size: 10px");
	}), c[0] = r.join("\n"), console.error(i), console.groupCollapsed("click to view full shader code"), console.warn(...c), console.groupEnd();
}
function zn(e, t, n, r) {
	e.getProgramParameter(t, e.LINK_STATUS) || (e.getShaderParameter(n, e.COMPILE_STATUS) || Rn(e, n), e.getShaderParameter(r, e.COMPILE_STATUS) || Rn(e, r), console.error("PixiJS Error: Could not initialize shader."), e.getProgramInfoLog(t) !== "" && console.warn("PixiJS Warning: gl.getProgramInfoLog()", e.getProgramInfoLog(t)));
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/generateProgram.mjs
function Bn(e, t) {
	let n = Dn(e, e.VERTEX_SHADER, t.vertex), r = Dn(e, e.FRAGMENT_SHADER, t.fragment), i = e.createProgram();
	e.attachShader(i, n), e.attachShader(i, r);
	let a = t.transformFeedbackVaryings;
	a && (typeof e.transformFeedbackVaryings == "function" ? e.transformFeedbackVaryings(i, a.names, a.bufferMode === "separate" ? e.SEPARATE_ATTRIBS : e.INTERLEAVED_ATTRIBS) : d("TransformFeedback is not supported but TransformFeedbackVaryings are given.")), e.linkProgram(i), e.getProgramParameter(i, e.LINK_STATUS) || zn(e, i, n, r), t._attributeData = Fn(i, e, !/^[ \t]*#[ \t]*version[ \t]+300[ \t]+es[ \t]*$/m.test(t.vertex)), t._uniformData = Ln(i, e), t._uniformBlockData = In(i, e), e.deleteShader(n), e.deleteShader(r);
	let o = {};
	for (let n in t._uniformData) {
		let r = t._uniformData[n];
		o[n] = {
			location: e.getUniformLocation(i, n),
			value: kn(r.type, r.size)
		};
	}
	return new En(i, o);
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlShaderSystem.mjs
var Vn = {
	textureCount: 0,
	blockIndex: 0
}, Hn = class {
	constructor(e) {
		this._activeProgram = null, this._programDataHash = /* @__PURE__ */ Object.create(null), this._shaderSyncFunctions = /* @__PURE__ */ Object.create(null), this._renderer = e;
	}
	contextChange(e) {
		this._gl = e, this._programDataHash = /* @__PURE__ */ Object.create(null), this._shaderSyncFunctions = /* @__PURE__ */ Object.create(null), this._activeProgram = null;
	}
	bind(e, t) {
		if (this._setProgram(e.glProgram), t) return;
		Vn.textureCount = 0, Vn.blockIndex = 0;
		let n = this._shaderSyncFunctions[e.glProgram._key];
		n ||= this._shaderSyncFunctions[e.glProgram._key] = this._generateShaderSync(e, this), this._renderer.buffer.nextBindBase(!!e.glProgram.transformFeedbackVaryings), n(this._renderer, e, Vn);
	}
	updateUniformGroup(e) {
		this._renderer.uniformGroup.updateUniformGroup(e, this._activeProgram, Vn);
	}
	bindUniformBlock(e, t, n = 0) {
		let r = this._renderer.buffer, i = this._getProgramData(this._activeProgram), a = e._bufferResource;
		a || this._renderer.ubo.updateUniformGroup(e);
		let o = e.buffer, s = r.updateBuffer(o), c = r.freeLocationForBufferBase(s);
		if (a) {
			let { offset: t, size: n } = e;
			t === 0 && n === o.data.byteLength ? r.bindBufferBase(s, c) : r.bindBufferRange(s, c, t);
		} else r.getLastBindBaseLocation(s) !== c && r.bindBufferBase(s, c);
		let l = this._activeProgram._uniformBlockData[t].index;
		i.uniformBlockBindings[n] !== c && (i.uniformBlockBindings[n] = c, this._renderer.gl.uniformBlockBinding(i.program, l, c));
	}
	_setProgram(e) {
		if (this._activeProgram === e) return;
		this._activeProgram = e;
		let t = this._getProgramData(e);
		this._gl.useProgram(t.program);
	}
	_getProgramData(e) {
		return this._programDataHash[e._key] || this._createProgramData(e);
	}
	_createProgramData(e) {
		let t = e._key;
		return this._programDataHash[t] = Bn(this._gl, e), this._programDataHash[t];
	}
	destroy() {
		for (let e of Object.keys(this._programDataHash)) this._programDataHash[e].destroy();
		this._programDataHash = null, this._shaderSyncFunctions = null, this._activeProgram = null, this._renderer = null, this._gl = null;
	}
	_generateShaderSync(e, t) {
		return Tn(e, t);
	}
	resetState() {
		this._activeProgram = null;
	}
};
Hn.extension = {
	type: [O.WebGLSystem],
	name: "shader"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/generateUniformsSyncTypes.mjs
var Un = {
	f32: "if (cv !== v) {\n            cu.value = v;\n            gl.uniform1f(location, v);\n        }",
	"vec2<f32>": "if (cv[0] !== v[0] || cv[1] !== v[1]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            gl.uniform2f(location, v[0], v[1]);\n        }",
	"vec3<f32>": "if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            cv[2] = v[2];\n            gl.uniform3f(location, v[0], v[1], v[2]);\n        }",
	"vec4<f32>": "if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            cv[2] = v[2];\n            cv[3] = v[3];\n            gl.uniform4f(location, v[0], v[1], v[2], v[3]);\n        }",
	i32: "if (cv !== v) {\n            cu.value = v;\n            gl.uniform1i(location, v);\n        }",
	"vec2<i32>": "if (cv[0] !== v[0] || cv[1] !== v[1]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            gl.uniform2i(location, v[0], v[1]);\n        }",
	"vec3<i32>": "if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            cv[2] = v[2];\n            gl.uniform3i(location, v[0], v[1], v[2]);\n        }",
	"vec4<i32>": "if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            cv[2] = v[2];\n            cv[3] = v[3];\n            gl.uniform4i(location, v[0], v[1], v[2], v[3]);\n        }",
	u32: "if (cv !== v) {\n            cu.value = v;\n            gl.uniform1ui(location, v);\n        }",
	"vec2<u32>": "if (cv[0] !== v[0] || cv[1] !== v[1]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            gl.uniform2ui(location, v[0], v[1]);\n        }",
	"vec3<u32>": "if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            cv[2] = v[2];\n            gl.uniform3ui(location, v[0], v[1], v[2]);\n        }",
	"vec4<u32>": "if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            cv[2] = v[2];\n            cv[3] = v[3];\n            gl.uniform4ui(location, v[0], v[1], v[2], v[3]);\n        }",
	bool: "if (cv !== v) {\n            cu.value = v;\n            gl.uniform1i(location, v);\n        }",
	"vec2<bool>": "if (cv[0] !== v[0] || cv[1] !== v[1]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            gl.uniform2i(location, v[0], v[1]);\n        }",
	"vec3<bool>": "if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            cv[2] = v[2];\n            gl.uniform3i(location, v[0], v[1], v[2]);\n        }",
	"vec4<bool>": "if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {\n            cv[0] = v[0];\n            cv[1] = v[1];\n            cv[2] = v[2];\n            cv[3] = v[3];\n            gl.uniform4i(location, v[0], v[1], v[2], v[3]);\n        }",
	"mat2x2<f32>": "gl.uniformMatrix2fv(location, false, v);",
	"mat3x3<f32>": "gl.uniformMatrix3fv(location, false, v);",
	"mat4x4<f32>": "gl.uniformMatrix4fv(location, false, v);"
}, Wn = {
	f32: "gl.uniform1fv(location, v);",
	"vec2<f32>": "gl.uniform2fv(location, v);",
	"vec3<f32>": "gl.uniform3fv(location, v);",
	"vec4<f32>": "gl.uniform4fv(location, v);",
	"mat2x2<f32>": "gl.uniformMatrix2fv(location, false, v);",
	"mat3x3<f32>": "gl.uniformMatrix3fv(location, false, v);",
	"mat4x4<f32>": "gl.uniformMatrix4fv(location, false, v);",
	i32: "gl.uniform1iv(location, v);",
	"vec2<i32>": "gl.uniform2iv(location, v);",
	"vec3<i32>": "gl.uniform3iv(location, v);",
	"vec4<i32>": "gl.uniform4iv(location, v);",
	u32: "gl.uniform1iv(location, v);",
	"vec2<u32>": "gl.uniform2iv(location, v);",
	"vec3<u32>": "gl.uniform3iv(location, v);",
	"vec4<u32>": "gl.uniform4iv(location, v);",
	bool: "gl.uniform1iv(location, v);",
	"vec2<bool>": "gl.uniform2iv(location, v);",
	"vec3<bool>": "gl.uniform3iv(location, v);",
	"vec4<bool>": "gl.uniform4iv(location, v);"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/generateUniformsSync.mjs
function Gn(e, t) {
	let n = ["\n        var v = null;\n        var cv = null;\n        var cu = null;\n        var t = 0;\n        var gl = renderer.gl;\n        var name = null;\n    "];
	for (let r in e.uniforms) {
		if (!t[r]) {
			e.uniforms[r] instanceof g ? e.uniforms[r].ubo ? n.push(`
                        renderer.shader.bindUniformBlock(uv.${r}, "${r}");
                    `) : n.push(`
                        renderer.shader.updateUniformGroup(uv.${r});
                    `) : e.uniforms[r] instanceof it && n.push(`
                        renderer.shader.bindBufferResource(uv.${r}, "${r}");
                    `);
			continue;
		}
		let i = e.uniformStructures[r], a = !1;
		for (let e = 0; e < qe.length; e++) {
			let t = qe[e];
			if (i.type === t.type && t.test(i)) {
				n.push(`name = "${r}";`, qe[e].uniform), a = !0;
				break;
			}
		}
		if (!a) {
			let e = (i.size === 1 ? Un : Wn)[i.type].replace("location", `ud["${r}"].location`);
			n.push(`
            cu = ud["${r}"];
            cv = cu.value;
            v = uv["${r}"];
            ${e};`);
		}
	}
	return Function("ud", "uv", "renderer", "syncData", n.join("\n"));
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlUniformGroupSystem.mjs
var Kn = class {
	constructor(e) {
		this._cache = {}, this._uniformGroupSyncHash = {}, this._renderer = e, this.gl = null, this._cache = {};
	}
	contextChange(e) {
		this.gl = e;
	}
	updateUniformGroup(e, t, n) {
		let r = this._renderer.shader._getProgramData(t);
		(!e.isStatic || e._dirtyId !== r.uniformDirtyGroups[e.uid]) && (r.uniformDirtyGroups[e.uid] = e._dirtyId, this._getUniformSyncFunction(e, t)(r.uniformData, e.uniforms, this._renderer, n));
	}
	_getUniformSyncFunction(e, t) {
		return this._uniformGroupSyncHash[e._signature]?.[t._key] || this._createUniformSyncFunction(e, t);
	}
	_createUniformSyncFunction(e, t) {
		let n = this._uniformGroupSyncHash[e._signature] || (this._uniformGroupSyncHash[e._signature] = {}), r = this._getSignature(e, t._uniformData, "u");
		return this._cache[r] || (this._cache[r] = this._generateUniformsSync(e, t._uniformData)), n[t._key] = this._cache[r], n[t._key];
	}
	_generateUniformsSync(e, t) {
		return Gn(e, t);
	}
	_getSignature(e, t, n) {
		let r = e.uniforms, i = [`${n}-`];
		for (let e in r) i.push(e), t[e] && i.push(t[e].type);
		return i.join("-");
	}
	destroy() {
		this._renderer = null, this._cache = null;
	}
};
Kn.extension = {
	type: [O.WebGLSystem],
	name: "uniformGroup"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/state/mapWebGLBlendModesToPixi.mjs
function qn(e) {
	let t = {};
	if (t.normal = [e.ONE, e.ONE_MINUS_SRC_ALPHA], t.add = [e.ONE, e.ONE], t.multiply = [
		e.DST_COLOR,
		e.ONE_MINUS_SRC_ALPHA,
		e.ONE,
		e.ONE_MINUS_SRC_ALPHA
	], t.screen = [
		e.ONE,
		e.ONE_MINUS_SRC_COLOR,
		e.ONE,
		e.ONE_MINUS_SRC_ALPHA
	], t.none = [0, 0], t["normal-npm"] = [
		e.SRC_ALPHA,
		e.ONE_MINUS_SRC_ALPHA,
		e.ONE,
		e.ONE_MINUS_SRC_ALPHA
	], t["add-npm"] = [
		e.SRC_ALPHA,
		e.ONE,
		e.ONE,
		e.ONE
	], t["screen-npm"] = [
		e.SRC_ALPHA,
		e.ONE_MINUS_SRC_COLOR,
		e.ONE,
		e.ONE_MINUS_SRC_ALPHA
	], t.erase = [e.ZERO, e.ONE_MINUS_SRC_ALPHA], !(e instanceof w.get().getWebGLRenderingContext())) t.min = [
		e.ONE,
		e.ONE,
		e.ONE,
		e.ONE,
		e.MIN,
		e.MIN
	], t.max = [
		e.ONE,
		e.ONE,
		e.ONE,
		e.ONE,
		e.MAX,
		e.MAX
	];
	else {
		let n = e.getExtension("EXT_blend_minmax");
		n && (t.min = [
			e.ONE,
			e.ONE,
			e.ONE,
			e.ONE,
			n.MIN_EXT,
			n.MIN_EXT
		], t.max = [
			e.ONE,
			e.ONE,
			e.ONE,
			e.ONE,
			n.MAX_EXT,
			n.MAX_EXT
		]);
	}
	return t;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/state/GlStateSystem.mjs
var Jn = 0, Yn = 1, Xn = 2, Zn = 3, Qn = 4, $n = 5, er = class e {
	constructor(e) {
		this._invertFrontFace = !1, this.gl = null, this.stateId = 0, this.polygonOffset = 0, this.blendMode = "none", this._blendEq = !1, this.map = [], this.map[Jn] = this.setBlend, this.map[Yn] = this.setOffset, this.map[Xn] = this.setCullFace, this.map[Zn] = this.setDepthTest, this.map[Qn] = this.setFrontFace, this.map[$n] = this.setDepthMask, this.checks = [], this.defaultState = k.for2d(), e.renderTarget.onRenderTargetChange.add(this);
	}
	onRenderTargetChange(e) {
		this._invertFrontFace = !e.isRoot, this._cullFace ? this.setFrontFace(this._frontFace) : this._frontFaceDirty = !0;
	}
	contextChange(e) {
		this.gl = e, this.blendModesMap = qn(e), this.resetState();
	}
	set(e) {
		if (e ||= this.defaultState, this.stateId !== e.data) {
			let t = this.stateId ^ e.data, n = 0;
			for (; t;) t & 1 && this.map[n].call(this, !!(e.data & 1 << n)), t >>= 1, n++;
			this.stateId = e.data;
		}
		for (let t = 0; t < this.checks.length; t++) this.checks[t](this, e);
	}
	forceState(e) {
		e ||= this.defaultState;
		for (let t = 0; t < this.map.length; t++) this.map[t].call(this, !!(e.data & 1 << t));
		for (let t = 0; t < this.checks.length; t++) this.checks[t](this, e);
		this.stateId = e.data;
	}
	setBlend(t) {
		this._updateCheck(e._checkBlendMode, t), this.gl[t ? "enable" : "disable"](this.gl.BLEND);
	}
	setOffset(t) {
		this._updateCheck(e._checkPolygonOffset, t), this.gl[t ? "enable" : "disable"](this.gl.POLYGON_OFFSET_FILL);
	}
	setDepthTest(e) {
		this.gl[e ? "enable" : "disable"](this.gl.DEPTH_TEST);
	}
	setDepthMask(e) {
		this.gl.depthMask(e);
	}
	setCullFace(e) {
		this._cullFace = e, this.gl[e ? "enable" : "disable"](this.gl.CULL_FACE), this._cullFace && this._frontFaceDirty && this.setFrontFace(this._frontFace);
	}
	setFrontFace(e) {
		this._frontFace = e, this._frontFaceDirty = !1;
		let t = this._invertFrontFace ? !e : e;
		this._glFrontFace !== t && (this._glFrontFace = t, this.gl.frontFace(this.gl[t ? "CW" : "CCW"]));
	}
	setBlendMode(e) {
		if (this.blendModesMap[e] || (e = "normal"), e === this.blendMode) return;
		this.blendMode = e;
		let t = this.blendModesMap[e], n = this.gl;
		t.length === 2 ? n.blendFunc(t[0], t[1]) : n.blendFuncSeparate(t[0], t[1], t[2], t[3]), t.length === 6 ? (this._blendEq = !0, n.blendEquationSeparate(t[4], t[5])) : this._blendEq && (this._blendEq = !1, n.blendEquationSeparate(n.FUNC_ADD, n.FUNC_ADD));
	}
	setPolygonOffset(e, t) {
		this.gl.polygonOffset(e, t);
	}
	resetState() {
		this._glFrontFace = !1, this._frontFace = !1, this._cullFace = !1, this._frontFaceDirty = !1, this._invertFrontFace = !1, this.gl.frontFace(this.gl.CCW), this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, !1), this.forceState(this.defaultState), this._blendEq = !0, this.blendMode = "", this.setBlendMode("normal");
	}
	_updateCheck(e, t) {
		let n = this.checks.indexOf(e);
		t && n === -1 ? this.checks.push(e) : !t && n !== -1 && this.checks.splice(n, 1);
	}
	static _checkBlendMode(e, t) {
		e.setBlendMode(t.blendMode);
	}
	static _checkPolygonOffset(e, t) {
		e.setPolygonOffset(1, t.polygonOffset);
	}
	destroy() {
		this.gl = null, this.checks.length = 0;
	}
};
er.extension = {
	type: [O.WebGLSystem],
	name: "state"
};
var tr = er, nr = class {
	constructor(e) {
		this.target = rn.TEXTURE_2D, this._layerInitMask = 0, this.texture = e, this.width = -1, this.height = -1, this.type = G.UNSIGNED_BYTE, this.internalFormat = nn.RGBA, this.format = nn.RGBA, this.samplerType = 0;
	}
	destroy() {}
}, rr = {
	id: "buffer",
	upload(e, t, n, r, i, a = !1) {
		let o = i || t.target;
		!a && t.width === e.width && t.height === e.height ? n.texSubImage2D(o, 0, 0, 0, e.width, e.height, t.format, t.type, e.resource) : n.texImage2D(o, 0, t.internalFormat, e.width, e.height, 0, t.format, t.type, e.resource), t.width = e.width, t.height = e.height;
	}
}, ir = {
	"bc1-rgba-unorm": !0,
	"bc1-rgba-unorm-srgb": !0,
	"bc2-rgba-unorm": !0,
	"bc2-rgba-unorm-srgb": !0,
	"bc3-rgba-unorm": !0,
	"bc3-rgba-unorm-srgb": !0,
	"bc4-r-unorm": !0,
	"bc4-r-snorm": !0,
	"bc5-rg-unorm": !0,
	"bc5-rg-snorm": !0,
	"bc6h-rgb-ufloat": !0,
	"bc6h-rgb-float": !0,
	"bc7-rgba-unorm": !0,
	"bc7-rgba-unorm-srgb": !0,
	"etc2-rgb8unorm": !0,
	"etc2-rgb8unorm-srgb": !0,
	"etc2-rgb8a1unorm": !0,
	"etc2-rgb8a1unorm-srgb": !0,
	"etc2-rgba8unorm": !0,
	"etc2-rgba8unorm-srgb": !0,
	"eac-r11unorm": !0,
	"eac-r11snorm": !0,
	"eac-rg11unorm": !0,
	"eac-rg11snorm": !0,
	"astc-4x4-unorm": !0,
	"astc-4x4-unorm-srgb": !0,
	"astc-5x4-unorm": !0,
	"astc-5x4-unorm-srgb": !0,
	"astc-5x5-unorm": !0,
	"astc-5x5-unorm-srgb": !0,
	"astc-6x5-unorm": !0,
	"astc-6x5-unorm-srgb": !0,
	"astc-6x6-unorm": !0,
	"astc-6x6-unorm-srgb": !0,
	"astc-8x5-unorm": !0,
	"astc-8x5-unorm-srgb": !0,
	"astc-8x6-unorm": !0,
	"astc-8x6-unorm-srgb": !0,
	"astc-8x8-unorm": !0,
	"astc-8x8-unorm-srgb": !0,
	"astc-10x5-unorm": !0,
	"astc-10x5-unorm-srgb": !0,
	"astc-10x6-unorm": !0,
	"astc-10x6-unorm-srgb": !0,
	"astc-10x8-unorm": !0,
	"astc-10x8-unorm-srgb": !0,
	"astc-10x10-unorm": !0,
	"astc-10x10-unorm-srgb": !0,
	"astc-12x10-unorm": !0,
	"astc-12x10-unorm-srgb": !0,
	"astc-12x12-unorm": !0,
	"astc-12x12-unorm-srgb": !0
}, ar = {
	id: "compressed",
	upload(e, t, n, r, i, a) {
		let o = i ?? t.target;
		n.pixelStorei(n.UNPACK_ALIGNMENT, 4);
		let s = e.pixelWidth, c = e.pixelHeight, l = !!ir[e.format];
		for (let r = 0; r < e.resource.length; r++) {
			let i = e.resource[r];
			l ? n.compressedTexImage2D(o, r, t.internalFormat, s, c, 0, i) : n.texImage2D(o, r, t.internalFormat, s, c, 0, t.format, t.type, i), s = Math.max(s >> 1, 1), c = Math.max(c >> 1, 1);
		}
	}
}, or = [
	"right",
	"left",
	"top",
	"bottom",
	"front",
	"back"
];
function sr(e) {
	return {
		id: "cube",
		upload(t, n, r, i) {
			let a = t.faces;
			for (let t = 0; t < or.length; t++) {
				let o = a[or[t]];
				(e[o.uploadMethodId] || e.image).upload(o, n, r, i, rn.TEXTURE_CUBE_MAP_POSITIVE_X + t, !(n._layerInitMask & 1 << t)), n._layerInitMask |= 1 << t;
			}
			n.width = t.pixelWidth, n.height = t.pixelHeight;
		}
	};
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadImageResource.mjs
var cr = {
	id: "image",
	upload(e, t, n, r, i, a = !1) {
		let o = i || t.target, s = e.pixelWidth, c = e.pixelHeight, l = e.resourceWidth, u = e.resourceHeight, d = r === 2, f = a || t.width !== s || t.height !== c, p = l >= s && u >= c, m = e.resource;
		(d ? lr : ur)(n, o, t, s, c, l, u, m, f, p), t.width = s, t.height = c;
	}
};
function lr(e, t, n, r, i, a, o, s, c, l) {
	if (!l) {
		c && e.texImage2D(t, 0, n.internalFormat, r, i, 0, n.format, n.type, null), e.texSubImage2D(t, 0, 0, 0, a, o, n.format, n.type, s);
		return;
	}
	if (!c) {
		e.texSubImage2D(t, 0, 0, 0, n.format, n.type, s);
		return;
	}
	e.texImage2D(t, 0, n.internalFormat, r, i, 0, n.format, n.type, s);
}
function ur(e, t, n, r, i, a, o, s, c, l) {
	if (!l) {
		c && e.texImage2D(t, 0, n.internalFormat, r, i, 0, n.format, n.type, null), e.texSubImage2D(t, 0, 0, 0, n.format, n.type, s);
		return;
	}
	if (!c) {
		e.texSubImage2D(t, 0, 0, 0, n.format, n.type, s);
		return;
	}
	e.texImage2D(t, 0, n.internalFormat, n.format, n.type, s);
}
//#endregion
//#region node_modules/pixi.js/lib/utils/browser/isSafari.mjs
function dr() {
	let { userAgent: e } = w.get().getNavigator();
	return /^((?!chrome|android).)*safari/i.test(e);
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadVideoResource.mjs
var fr = dr(), pr = {
	id: "video",
	upload(e, t, n, r, i, a = fr) {
		if (!e.isValid) {
			let e = i ?? t.target;
			n.texImage2D(e, 0, t.internalFormat, 1, 1, 0, t.format, t.type, null);
			return;
		}
		cr.upload(e, t, n, r, i, a);
	}
}, mr = {
	linear: 9729,
	nearest: 9728
}, hr = {
	linear: {
		linear: 9987,
		nearest: 9985
	},
	nearest: {
		linear: 9986,
		nearest: 9984
	}
}, gr = {
	"clamp-to-edge": 33071,
	repeat: 10497,
	"mirror-repeat": 33648
}, _r = {
	never: 512,
	less: 513,
	equal: 514,
	"less-equal": 515,
	greater: 516,
	"not-equal": 517,
	"greater-equal": 518,
	always: 519
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/applyStyleParams.mjs
function vr(e, t, n, r, i, a, o, s) {
	let c = a;
	if (!s || e.addressModeU !== "repeat" || e.addressModeV !== "repeat" || e.addressModeW !== "repeat") {
		let n = gr[o ? "clamp-to-edge" : e.addressModeU], r = gr[o ? "clamp-to-edge" : e.addressModeV], a = gr[o ? "clamp-to-edge" : e.addressModeW];
		t[i](c, t.TEXTURE_WRAP_S, n), t[i](c, t.TEXTURE_WRAP_T, r), t.TEXTURE_WRAP_R && t[i](c, t.TEXTURE_WRAP_R, a);
	}
	if ((!s || e.magFilter !== "linear") && t[i](c, t.TEXTURE_MAG_FILTER, mr[e.magFilter]), n) {
		if (!s || e.mipmapFilter !== "linear") {
			let n = hr[e.minFilter][e.mipmapFilter];
			t[i](c, t.TEXTURE_MIN_FILTER, n);
		}
	} else t[i](c, t.TEXTURE_MIN_FILTER, mr[e.minFilter]);
	if (r && e.maxAnisotropy > 1) {
		let n = Math.min(e.maxAnisotropy, t.getParameter(r.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
		t[i](c, r.TEXTURE_MAX_ANISOTROPY_EXT, n);
	}
	e.compare && t[i](c, t.TEXTURE_COMPARE_FUNC, _r[e.compare]);
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapFormatToGlFormat.mjs
function yr(e) {
	return {
		r8unorm: e.RED,
		r8snorm: e.RED,
		r8uint: e.RED,
		r8sint: e.RED,
		r16uint: e.RED,
		r16sint: e.RED,
		r16float: e.RED,
		rg8unorm: e.RG,
		rg8snorm: e.RG,
		rg8uint: e.RG,
		rg8sint: e.RG,
		r32uint: e.RED,
		r32sint: e.RED,
		r32float: e.RED,
		rg16uint: e.RG,
		rg16sint: e.RG,
		rg16float: e.RG,
		rgba8unorm: e.RGBA,
		"rgba8unorm-srgb": e.RGBA,
		rgba8snorm: e.RGBA,
		rgba8uint: e.RGBA,
		rgba8sint: e.RGBA,
		bgra8unorm: e.RGBA,
		"bgra8unorm-srgb": e.RGBA,
		rgb9e5ufloat: e.RGB,
		rgb10a2unorm: e.RGBA,
		rg11b10ufloat: e.RGB,
		rg32uint: e.RG,
		rg32sint: e.RG,
		rg32float: e.RG,
		rgba16uint: e.RGBA,
		rgba16sint: e.RGBA,
		rgba16float: e.RGBA,
		rgba32uint: e.RGBA,
		rgba32sint: e.RGBA,
		rgba32float: e.RGBA,
		stencil8: e.STENCIL_INDEX8,
		depth16unorm: e.DEPTH_COMPONENT,
		depth24plus: e.DEPTH_COMPONENT,
		"depth24plus-stencil8": e.DEPTH_STENCIL,
		depth32float: e.DEPTH_COMPONENT,
		"depth32float-stencil8": e.DEPTH_STENCIL
	};
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapFormatToGlInternalFormat.mjs
function br(e, t) {
	let n = {}, r = e.RGBA;
	return e instanceof w.get().getWebGLRenderingContext() ? t.srgb && (n = {
		"rgba8unorm-srgb": t.srgb.SRGB8_ALPHA8_EXT,
		"bgra8unorm-srgb": t.srgb.SRGB8_ALPHA8_EXT
	}) : (n = {
		"rgba8unorm-srgb": e.SRGB8_ALPHA8,
		"bgra8unorm-srgb": e.SRGB8_ALPHA8
	}, r = e.RGBA8), {
		r8unorm: e.R8,
		r8snorm: e.R8_SNORM,
		r8uint: e.R8UI,
		r8sint: e.R8I,
		r16uint: e.R16UI,
		r16sint: e.R16I,
		r16float: e.R16F,
		rg8unorm: e.RG8,
		rg8snorm: e.RG8_SNORM,
		rg8uint: e.RG8UI,
		rg8sint: e.RG8I,
		r32uint: e.R32UI,
		r32sint: e.R32I,
		r32float: e.R32F,
		rg16uint: e.RG16UI,
		rg16sint: e.RG16I,
		rg16float: e.RG16F,
		rgba8unorm: e.RGBA,
		...n,
		rgba8snorm: e.RGBA8_SNORM,
		rgba8uint: e.RGBA8UI,
		rgba8sint: e.RGBA8I,
		bgra8unorm: r,
		rgb9e5ufloat: e.RGB9_E5,
		rgb10a2unorm: e.RGB10_A2,
		rg11b10ufloat: e.R11F_G11F_B10F,
		rg32uint: e.RG32UI,
		rg32sint: e.RG32I,
		rg32float: e.RG32F,
		rgba16uint: e.RGBA16UI,
		rgba16sint: e.RGBA16I,
		rgba16float: e.RGBA16F,
		rgba32uint: e.RGBA32UI,
		rgba32sint: e.RGBA32I,
		rgba32float: e.RGBA32F,
		stencil8: e.STENCIL_INDEX8,
		depth16unorm: e.DEPTH_COMPONENT16,
		depth24plus: e.DEPTH_COMPONENT24,
		"depth24plus-stencil8": e.DEPTH24_STENCIL8,
		depth32float: e.DEPTH_COMPONENT32F,
		"depth32float-stencil8": e.DEPTH32F_STENCIL8,
		...t.s3tc ? {
			"bc1-rgba-unorm": t.s3tc.COMPRESSED_RGBA_S3TC_DXT1_EXT,
			"bc2-rgba-unorm": t.s3tc.COMPRESSED_RGBA_S3TC_DXT3_EXT,
			"bc3-rgba-unorm": t.s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT
		} : {},
		...t.s3tc_sRGB ? {
			"bc1-rgba-unorm-srgb": t.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT,
			"bc2-rgba-unorm-srgb": t.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT,
			"bc3-rgba-unorm-srgb": t.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT
		} : {},
		...t.rgtc ? {
			"bc4-r-unorm": t.rgtc.COMPRESSED_RED_RGTC1_EXT,
			"bc4-r-snorm": t.rgtc.COMPRESSED_SIGNED_RED_RGTC1_EXT,
			"bc5-rg-unorm": t.rgtc.COMPRESSED_RED_GREEN_RGTC2_EXT,
			"bc5-rg-snorm": t.rgtc.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT
		} : {},
		...t.bptc ? {
			"bc6h-rgb-float": t.bptc.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT,
			"bc6h-rgb-ufloat": t.bptc.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT,
			"bc7-rgba-unorm": t.bptc.COMPRESSED_RGBA_BPTC_UNORM_EXT,
			"bc7-rgba-unorm-srgb": t.bptc.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT
		} : {},
		...t.etc ? {
			"etc2-rgb8unorm": t.etc.COMPRESSED_RGB8_ETC2,
			"etc2-rgb8unorm-srgb": t.etc.COMPRESSED_SRGB8_ETC2,
			"etc2-rgb8a1unorm": t.etc.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2,
			"etc2-rgb8a1unorm-srgb": t.etc.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2,
			"etc2-rgba8unorm": t.etc.COMPRESSED_RGBA8_ETC2_EAC,
			"etc2-rgba8unorm-srgb": t.etc.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC,
			"eac-r11unorm": t.etc.COMPRESSED_R11_EAC,
			"eac-rg11unorm": t.etc.COMPRESSED_SIGNED_RG11_EAC
		} : {},
		...t.astc ? {
			"astc-4x4-unorm": t.astc.COMPRESSED_RGBA_ASTC_4x4_KHR,
			"astc-4x4-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR,
			"astc-5x4-unorm": t.astc.COMPRESSED_RGBA_ASTC_5x4_KHR,
			"astc-5x4-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR,
			"astc-5x5-unorm": t.astc.COMPRESSED_RGBA_ASTC_5x5_KHR,
			"astc-5x5-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR,
			"astc-6x5-unorm": t.astc.COMPRESSED_RGBA_ASTC_6x5_KHR,
			"astc-6x5-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR,
			"astc-6x6-unorm": t.astc.COMPRESSED_RGBA_ASTC_6x6_KHR,
			"astc-6x6-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR,
			"astc-8x5-unorm": t.astc.COMPRESSED_RGBA_ASTC_8x5_KHR,
			"astc-8x5-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR,
			"astc-8x6-unorm": t.astc.COMPRESSED_RGBA_ASTC_8x6_KHR,
			"astc-8x6-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR,
			"astc-8x8-unorm": t.astc.COMPRESSED_RGBA_ASTC_8x8_KHR,
			"astc-8x8-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR,
			"astc-10x5-unorm": t.astc.COMPRESSED_RGBA_ASTC_10x5_KHR,
			"astc-10x5-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR,
			"astc-10x6-unorm": t.astc.COMPRESSED_RGBA_ASTC_10x6_KHR,
			"astc-10x6-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR,
			"astc-10x8-unorm": t.astc.COMPRESSED_RGBA_ASTC_10x8_KHR,
			"astc-10x8-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR,
			"astc-10x10-unorm": t.astc.COMPRESSED_RGBA_ASTC_10x10_KHR,
			"astc-10x10-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR,
			"astc-12x10-unorm": t.astc.COMPRESSED_RGBA_ASTC_12x10_KHR,
			"astc-12x10-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR,
			"astc-12x12-unorm": t.astc.COMPRESSED_RGBA_ASTC_12x12_KHR,
			"astc-12x12-unorm-srgb": t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR
		} : {}
	};
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapFormatToGlType.mjs
function xr(e) {
	return {
		r8unorm: e.UNSIGNED_BYTE,
		r8snorm: e.BYTE,
		r8uint: e.UNSIGNED_BYTE,
		r8sint: e.BYTE,
		r16uint: e.UNSIGNED_SHORT,
		r16sint: e.SHORT,
		r16float: e.HALF_FLOAT,
		rg8unorm: e.UNSIGNED_BYTE,
		rg8snorm: e.BYTE,
		rg8uint: e.UNSIGNED_BYTE,
		rg8sint: e.BYTE,
		r32uint: e.UNSIGNED_INT,
		r32sint: e.INT,
		r32float: e.FLOAT,
		rg16uint: e.UNSIGNED_SHORT,
		rg16sint: e.SHORT,
		rg16float: e.HALF_FLOAT,
		rgba8unorm: e.UNSIGNED_BYTE,
		"rgba8unorm-srgb": e.UNSIGNED_BYTE,
		rgba8snorm: e.BYTE,
		rgba8uint: e.UNSIGNED_BYTE,
		rgba8sint: e.BYTE,
		bgra8unorm: e.UNSIGNED_BYTE,
		"bgra8unorm-srgb": e.UNSIGNED_BYTE,
		rgb9e5ufloat: e.UNSIGNED_INT_5_9_9_9_REV,
		rgb10a2unorm: e.UNSIGNED_INT_2_10_10_10_REV,
		rg11b10ufloat: e.UNSIGNED_INT_10F_11F_11F_REV,
		rg32uint: e.UNSIGNED_INT,
		rg32sint: e.INT,
		rg32float: e.FLOAT,
		rgba16uint: e.UNSIGNED_SHORT,
		rgba16sint: e.SHORT,
		rgba16float: e.HALF_FLOAT,
		rgba32uint: e.UNSIGNED_INT,
		rgba32sint: e.INT,
		rgba32float: e.FLOAT,
		stencil8: e.UNSIGNED_BYTE,
		depth16unorm: e.UNSIGNED_SHORT,
		depth24plus: e.UNSIGNED_INT,
		"depth24plus-stencil8": e.UNSIGNED_INT_24_8,
		depth32float: e.FLOAT,
		"depth32float-stencil8": e.FLOAT_32_UNSIGNED_INT_24_8_REV
	};
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapViewDimensionToGlTarget.mjs
function Sr(e) {
	return {
		"2d": e.TEXTURE_2D,
		cube: e.TEXTURE_CUBE_MAP,
		"1d": null,
		"3d": e?.TEXTURE_3D || null,
		"2d-array": e?.TEXTURE_2D_ARRAY || null,
		"cube-array": e?.TEXTURE_CUBE_MAP_ARRAY || null
	};
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/texture/GlTextureSystem.mjs
var Cr = 4, wr = class e {
	constructor(t) {
		this._glSamplers = /* @__PURE__ */ Object.create(null), this._boundTextures = [], this._activeTextureLocation = -1, this._boundSamplers = /* @__PURE__ */ Object.create(null), this._premultiplyAlpha = !1, this._useSeparateSamplers = !1, this._renderer = t, this._managedTextures = new H({
			renderer: t,
			type: "resource",
			onUnload: this.onSourceUnload.bind(this),
			name: "glTexture"
		});
		let n = {
			image: cr,
			buffer: rr,
			video: pr,
			compressed: ar,
			...e.uploadExtensions
		};
		this._uploads = {
			...n,
			cube: sr(n)
		};
	}
	get managedTextures() {
		return Object.values(this._managedTextures.items);
	}
	contextChange(e) {
		this._gl = e, this._mapFormatToInternalFormat || (this._mapFormatToInternalFormat = br(e, this._renderer.context.extensions), this._mapFormatToType = xr(e), this._mapFormatToFormat = yr(e), this._mapViewDimensionToGlTarget = Sr(e)), this._managedTextures.removeAll(!0), this._glSamplers = /* @__PURE__ */ Object.create(null), this._boundSamplers = /* @__PURE__ */ Object.create(null), this._premultiplyAlpha = !1;
		for (let e = 0; e < 16; e++) this.bind(x.EMPTY, e);
	}
	initSource(e) {
		this.bind(e);
	}
	bind(e, t = 0) {
		let n = e.source;
		e ? (this.bindSource(n, t), this._useSeparateSamplers && this._bindSampler(n.style, t)) : (this.bindSource(null, t), this._useSeparateSamplers && this._bindSampler(null, t));
	}
	bindSource(e, t = 0) {
		let n = this._gl;
		if (e._gcLastUsed = this._renderer.gc.now, this._boundTextures[t] !== e) {
			this._boundTextures[t] = e, this._activateLocation(t), e ||= x.EMPTY.source;
			let r = this.getGlSource(e);
			n.bindTexture(r.target, r.texture);
		}
	}
	_bindSampler(e, t = 0) {
		let n = this._gl;
		if (!e) {
			this._boundSamplers[t] = null, n.bindSampler(t, null);
			return;
		}
		let r = this._getGlSampler(e);
		this._boundSamplers[t] !== r && (this._boundSamplers[t] = r, n.bindSampler(t, r));
	}
	unbind(e) {
		let t = e.source, n = this._boundTextures, r = this._gl;
		for (let e = 0; e < n.length; e++) if (n[e] === t) {
			this._activateLocation(e);
			let i = this.getGlSource(t);
			r.bindTexture(i.target, null), n[e] = null;
		}
	}
	_activateLocation(e) {
		this._activeTextureLocation !== e && (this._activeTextureLocation = e, this._gl.activeTexture(this._gl.TEXTURE0 + e));
	}
	_initSource(e) {
		let t = this._gl, n = new nr(t.createTexture());
		if (n.type = this._mapFormatToType[e.format], n.internalFormat = this._mapFormatToInternalFormat[e.format], n.format = this._mapFormatToFormat[e.format], n.target = this._mapViewDimensionToGlTarget[e.viewDimension], n.target === null) throw Error(`Unsupported view dimension: ${e.viewDimension} with this webgl version: ${this._renderer.context.webGLVersion}`);
		if (e.uploadMethodId === "cube" && (n.target = t.TEXTURE_CUBE_MAP), e.autoGenerateMipmaps && (this._renderer.context.supports.nonPowOf2mipmaps || e.isPowerOfTwo)) {
			let t = Math.max(e.width, e.height);
			e.mipLevelCount = Math.floor(Math.log2(t)) + 1;
		}
		return e._gpuData[this._renderer.uid] = n, this._managedTextures.add(e) && (e.on("update", this.onSourceUpdate, this), e.on("resize", this.onSourceUpdate, this), e.on("styleChange", this.onStyleChange, this), e.on("updateMipmaps", this.onUpdateMipmaps, this)), this.onSourceUpdate(e), this.updateStyle(e, !1), n;
	}
	onStyleChange(e) {
		this.updateStyle(e, !1);
	}
	updateStyle(e, t) {
		let n = this._gl, r = this.getGlSource(e);
		n.bindTexture(r.target, r.texture), this._boundTextures[this._activeTextureLocation] = e, vr(e.style, n, e.mipLevelCount > 1, this._renderer.context.extensions.anisotropicFiltering, "texParameteri", r.target, !this._renderer.context.supports.nonPowOf2wrapping && !e.isPowerOfTwo, t);
	}
	onSourceUnload(e, t = !1) {
		let n = e._gpuData[this._renderer.uid];
		n && (t || (this.unbind(e), this._gl.deleteTexture(n.texture)), e.off("update", this.onSourceUpdate, this), e.off("resize", this.onSourceUpdate, this), e.off("styleChange", this.onStyleChange, this), e.off("updateMipmaps", this.onUpdateMipmaps, this));
	}
	onSourceUpdate(e) {
		let t = this._gl, n = this.getGlSource(e);
		t.bindTexture(n.target, n.texture), this._boundTextures[this._activeTextureLocation] = e;
		let r = e.alphaMode === "premultiply-alpha-on-upload";
		if (this._premultiplyAlpha !== r && (this._premultiplyAlpha = r, t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL, r)), this._uploads[e.uploadMethodId]) this._uploads[e.uploadMethodId].upload(e, n, t, this._renderer.context.webGLVersion);
		else if (n.target === t.TEXTURE_2D) this._initEmptyTexture2D(n, e);
		else if (n.target === t.TEXTURE_2D_ARRAY) this._initEmptyTexture2DArray(n, e);
		else if (n.target === t.TEXTURE_CUBE_MAP) this._initEmptyTextureCube(n, e);
		else throw Error("[GlTextureSystem] Unsupported texture target for empty allocation.");
		this._applyMipRange(n, e), e.autoGenerateMipmaps && e.mipLevelCount > 1 && this.onUpdateMipmaps(e, !1);
	}
	onUpdateMipmaps(e, t = !0) {
		t && this.bindSource(e, 0);
		let n = this.getGlSource(e);
		this._gl.generateMipmap(n.target);
	}
	_initEmptyTexture2D(e, t) {
		let n = this._gl;
		n.texImage2D(n.TEXTURE_2D, 0, e.internalFormat, t.pixelWidth, t.pixelHeight, 0, e.format, e.type, null);
		let r = Math.max(t.pixelWidth >> 1, 1), i = Math.max(t.pixelHeight >> 1, 1);
		for (let a = 1; a < t.mipLevelCount; a++) n.texImage2D(n.TEXTURE_2D, a, e.internalFormat, r, i, 0, e.format, e.type, null), r = Math.max(r >> 1, 1), i = Math.max(i >> 1, 1);
	}
	_initEmptyTexture2DArray(e, t) {
		if (this._renderer.context.webGLVersion !== 2) throw Error("[GlTextureSystem] TEXTURE_2D_ARRAY requires WebGL2.");
		let n = this._gl, r = Math.max(t.arrayLayerCount | 0, 1);
		n.texImage3D(n.TEXTURE_2D_ARRAY, 0, e.internalFormat, t.pixelWidth, t.pixelHeight, r, 0, e.format, e.type, null);
		let i = Math.max(t.pixelWidth >> 1, 1), a = Math.max(t.pixelHeight >> 1, 1);
		for (let o = 1; o < t.mipLevelCount; o++) n.texImage3D(n.TEXTURE_2D_ARRAY, o, e.internalFormat, i, a, r, 0, e.format, e.type, null), i = Math.max(i >> 1, 1), a = Math.max(a >> 1, 1);
	}
	_initEmptyTextureCube(e, t) {
		let n = this._gl;
		for (let r = 0; r < 6; r++) n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X + r, 0, e.internalFormat, t.pixelWidth, t.pixelHeight, 0, e.format, e.type, null);
		let r = Math.max(t.pixelWidth >> 1, 1), i = Math.max(t.pixelHeight >> 1, 1);
		for (let a = 1; a < t.mipLevelCount; a++) {
			for (let t = 0; t < 6; t++) n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X + t, a, e.internalFormat, r, i, 0, e.format, e.type, null);
			r = Math.max(r >> 1, 1), i = Math.max(i >> 1, 1);
		}
	}
	_applyMipRange(e, t) {
		if (this._renderer.context.webGLVersion !== 2 || t.mipLevelCount <= 1) return;
		let n = this._gl, r = Math.max((t.mipLevelCount | 0) - 1, 0);
		n.texParameteri(e.target, n.TEXTURE_BASE_LEVEL, 0), n.texParameteri(e.target, n.TEXTURE_MAX_LEVEL, r);
	}
	_initSampler(e) {
		let t = this._gl, n = this._gl.createSampler();
		return this._glSamplers[e._resourceId] = n, vr(e, t, this._boundTextures[this._activeTextureLocation].mipLevelCount > 1, this._renderer.context.extensions.anisotropicFiltering, "samplerParameteri", n, !1, !0), this._glSamplers[e._resourceId];
	}
	_getGlSampler(e) {
		return this._glSamplers[e._resourceId] || this._initSampler(e);
	}
	getGlSource(e) {
		return e._gcLastUsed = this._renderer.gc.now, e._gpuData[this._renderer.uid] || this._initSource(e);
	}
	generateCanvas(e) {
		let { pixels: t, width: n, height: r } = this.getPixels(e), i = w.get().createCanvas();
		i.width = n, i.height = r;
		let a = i.getContext("2d");
		if (a) {
			let e = a.createImageData(n, r);
			e.data.set(t), a.putImageData(e, 0, 0);
		}
		return i;
	}
	getPixels(e) {
		let t = e.source.resolution, n = e.frame, r = Math.max(Math.round(n.width * t), 1), i = Math.max(Math.round(n.height * t), 1), a = new Uint8Array(Cr * r * i), o = this._renderer, s = o.renderTarget.getRenderTarget(e), c = o.renderTarget.getGpuRenderTarget(s), l = o.gl;
		return l.bindFramebuffer(l.FRAMEBUFFER, c.resolveTargetFramebuffer), l.readPixels(Math.round(n.x * t), Math.round(n.y * t), r, i, l.RGBA, l.UNSIGNED_BYTE, a), {
			pixels: new Uint8ClampedArray(a.buffer),
			width: r,
			height: i
		};
	}
	destroy() {
		this._managedTextures.destroy(), this._glSamplers = null, this._boundTextures = null, this._boundSamplers = null, this._mapFormatToInternalFormat = null, this._mapFormatToType = null, this._mapFormatToFormat = null, this._uploads = null, this._renderer = null;
	}
	resetState() {
		this._activeTextureLocation = -1, this._boundTextures.fill(x.EMPTY.source), this._boundSamplers = /* @__PURE__ */ Object.create(null);
		let e = this._gl;
		this._premultiplyAlpha = !1, e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this._premultiplyAlpha);
	}
};
wr.extension = {
	type: [O.WebGLSystem],
	name: "texture"
}, wr.uploadExtensions = /* @__PURE__ */ Object.create(null);
var Tr = wr;
a.handleByMap(O.TextureUploaderWebGL, Tr.uploadExtensions);
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gl/WebGLRenderer.mjs
var Er = [
	...Me,
	xn,
	fn,
	tn,
	hn,
	$t,
	Tr,
	wn,
	ln,
	Kn,
	Hn,
	mn,
	tr,
	gn,
	pn
], Dr = [...Ae], Or = [
	Xt,
	Yt,
	Jt
], kr = [], Ar = [], jr = [];
a.handleByNamedList(O.WebGLSystem, kr), a.handleByNamedList(O.WebGLPipes, Ar), a.handleByNamedList(O.WebGLPipesAdaptor, jr), a.add(...Er, ...Dr, ...Or);
var Mr = class extends Ce {
	constructor() {
		let e = {
			name: "webgl",
			type: C.WEBGL,
			systems: kr,
			renderPipes: Ar,
			renderPipeAdaptors: jr
		};
		super(e);
	}
}, Nr = class {
	constructor() {
		this._maxTextures = 0;
	}
	contextChange(e) {
		let t = new g({
			uTransformMatrix: {
				value: new u(),
				type: "mat3x3<f32>"
			},
			uColor: {
				value: new Float32Array([
					1,
					1,
					1,
					1
				]),
				type: "vec4<f32>"
			},
			uRound: {
				value: 0,
				type: "f32"
			}
		});
		this._maxTextures = e.limits.maxBatchableTextures;
		let n = Le({
			name: "graphics",
			bits: [
				Ie,
				He(this._maxTextures),
				tt,
				ze
			]
		});
		this.shader = new v({
			gpuProgram: n,
			resources: { localUniforms: t }
		});
	}
	execute(e, t) {
		let n = t.context, r = n.customShader || this.shader, i = e.renderer, { batcher: a, instructions: o } = i.graphicsContext.getContextRenderData(n), s = i.encoder;
		s.setGeometry(a.geometry, r.gpuProgram);
		let c = i.globalUniforms.bindGroup;
		s.setBindGroup(0, c, r.gpuProgram);
		let l = i.renderPipes.uniformBatch.getUniformBindGroup(r.resources.localUniforms, !0);
		s.setBindGroup(2, l, r.gpuProgram);
		let u = o.instructions, d = null;
		for (let t = 0; t < o.instructionSize; t++) {
			let n = u[t];
			if (n.topology !== d && (d = n.topology, s.setPipelineFromGeometryProgramAndState(a.geometry, r.gpuProgram, e.state, n.topology)), r.groups[1] = n.bindGroup, !n.gpuBindGroup) {
				let e = n.textures;
				n.bindGroup = Ke(e.textures, e.count, this._maxTextures), n.gpuBindGroup = i.bindGroup.getBindGroup(n.bindGroup, r.gpuProgram, 1);
			}
			s.setBindGroup(1, n.bindGroup, r.gpuProgram), s.renderPassEncoder.drawIndexed(n.size, 1, n.start);
		}
	}
	destroy() {
		this.shader.destroy(!0), this.shader = null;
	}
};
Nr.extension = {
	type: [O.WebGPUPipesAdaptor],
	name: "graphics"
};
//#endregion
//#region node_modules/pixi.js/lib/scene/mesh/gpu/GpuMeshAdapter.mjs
var Pr = class {
	init() {
		let e = Le({
			name: "mesh",
			bits: [
				Ye,
				Qe,
				ze
			]
		});
		this._shader = new v({
			gpuProgram: e,
			resources: {
				uTexture: x.EMPTY._source,
				uSampler: x.EMPTY._source.style,
				textureUniforms: { uTextureMatrix: {
					type: "mat3x3<f32>",
					value: new u()
				} }
			}
		});
	}
	execute(e, t) {
		let n = e.renderer, r = t._shader;
		if (!r) r = this._shader, r.groups[2] = n.texture.getTextureBindGroup(t.texture);
		else if (!r.gpuProgram) {
			d("Mesh shader has no gpuProgram", t.shader);
			return;
		}
		let i = r.gpuProgram;
		if (i.autoAssignGlobalUniforms && (r.groups[0] = n.globalUniforms.bindGroup), i.autoAssignLocalUniforms) {
			let t = e.localUniforms;
			r.groups[1] = n.renderPipes.uniformBatch.getUniformBindGroup(t, !0);
		}
		n.encoder.draw({
			geometry: t._geometry,
			shader: r,
			state: t.state
		});
	}
	destroy() {
		this._shader.destroy(!0), this._shader = null;
	}
};
Pr.extension = {
	type: [O.WebGPUPipesAdaptor],
	name: "mesh"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/batcher/gpu/GpuBatchAdaptor.mjs
var Fr = k.for2d(), Ir = class {
	start(e, t, n) {
		let r = e.renderer, i = r.encoder, a = n.gpuProgram;
		this._shader = n, this._geometry = t, i.setGeometry(t, a), Fr.blendMode = "normal", r.pipeline.getPipeline(t, a, Fr);
		let o = r.globalUniforms.bindGroup;
		i.resetBindGroup(1), i.setBindGroup(0, o, a);
	}
	execute(e, t) {
		let n = this._shader.gpuProgram, r = e.renderer, i = r.encoder;
		if (!t.bindGroup) {
			let e = t.textures;
			t.bindGroup = Ke(e.textures, e.count, r.limits.maxBatchableTextures);
		}
		Fr.blendMode = t.blendMode;
		let a = r.bindGroup.getBindGroup(t.bindGroup, n, 1), o = r.pipeline.getPipeline(this._geometry, n, Fr, t.topology);
		t.bindGroup._touch(r.gc.now, r.tick), i.setPipeline(o), i.renderPassEncoder.setBindGroup(1, a), i.renderPassEncoder.drawIndexed(t.size, 1, t.start);
	}
};
Ir.extension = {
	type: [O.WebGPUPipesAdaptor],
	name: "batch"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/BindGroupSystem.mjs
var Lr = class {
	constructor(e) {
		this._hash = /* @__PURE__ */ Object.create(null), this._renderer = e;
	}
	contextChange(e) {
		this._gpu = e;
	}
	getBindGroup(e, t, n) {
		return e._updateKey(), this._hash[e._key] || this._createBindGroup(e, t, n);
	}
	_createBindGroup(e, t, n) {
		let r = this._gpu.device, i = t.layout[n], a = [], o = this._renderer;
		for (let t in i) {
			let n = e.resources[t] ?? e.resources[i[t]], r;
			if (n._resourceType === "uniformGroup") {
				let e = n;
				o.ubo.updateUniformGroup(e);
				let t = e.buffer;
				r = {
					buffer: o.buffer.getGPUBuffer(t),
					offset: 0,
					size: t.descriptor.size
				};
			} else if (n._resourceType === "buffer") {
				let e = n;
				r = {
					buffer: o.buffer.getGPUBuffer(e),
					offset: 0,
					size: e.descriptor.size
				};
			} else if (n._resourceType === "bufferResource") {
				let e = n;
				r = {
					buffer: o.buffer.getGPUBuffer(e.buffer),
					offset: e.offset,
					size: e.size
				};
			} else if (n._resourceType === "textureSampler") {
				let e = n;
				r = o.texture.getGpuSampler(e);
			} else if (n._resourceType === "textureSource") {
				let e = n;
				r = o.texture.getTextureView(e);
			}
			a.push({
				binding: i[t],
				resource: r
			});
		}
		let s = o.shader.getProgramData(t).bindGroups[n], c = r.createBindGroup({
			layout: s,
			entries: a
		});
		return this._hash[e._key] = c, c;
	}
	destroy() {
		this._hash = null, this._renderer = null;
	}
};
Lr.extension = {
	type: [O.WebGPUSystem],
	name: "bindGroup"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/buffer/GpuBufferSystem.mjs
var Rr = class {
	constructor(e) {
		this.gpuBuffer = e;
	}
	destroy() {
		this.gpuBuffer.destroy(), this.gpuBuffer = null;
	}
}, zr = class {
	constructor(e) {
		this._renderer = e, this._managedBuffers = new H({
			renderer: e,
			type: "resource",
			onUnload: this.onBufferUnload.bind(this),
			name: "gpuBuffer"
		});
	}
	contextChange(e) {
		this._gpu = e;
	}
	getGPUBuffer(e) {
		return e._gcLastUsed = this._renderer.gc.now, e._gpuData[this._renderer.uid]?.gpuBuffer || this.createGPUBuffer(e);
	}
	updateBuffer(e) {
		let t = this.getGPUBuffer(e), n = e.data;
		return e._updateID && n && (e._updateID = 0, this._gpu.device.queue.writeBuffer(t, 0, n.buffer, 0, (e._updateSize || n.byteLength) + 3 & -4)), t;
	}
	destroyAll() {
		this._managedBuffers.removeAll();
	}
	onBufferUnload(e) {
		e.off("update", this.updateBuffer, this), e.off("change", this.onBufferChange, this);
	}
	createGPUBuffer(e) {
		let t = this._gpu.device.createBuffer(e.descriptor);
		return e._updateID = 0, e._resourceId = l("resource"), e.data && (Ve(e.data.buffer, t.getMappedRange(), e.data.byteOffset, e.data.byteLength), t.unmap()), e._gpuData[this._renderer.uid] = new Rr(t), this._managedBuffers.add(e) && (e.on("update", this.updateBuffer, this), e.on("change", this.onBufferChange, this)), t;
	}
	onBufferChange(e) {
		this._managedBuffers.remove(e), e._updateID = 0, this.createGPUBuffer(e);
	}
	destroy() {
		this._managedBuffers.destroy(), this._renderer = null, this._gpu = null;
	}
};
zr.extension = {
	type: [O.WebGPUSystem],
	name: "buffer"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/GpuColorMaskSystem.mjs
var Br = class {
	constructor(e) {
		this._colorMaskCache = 15, this._renderer = e;
	}
	setMask(e) {
		this._colorMaskCache !== e && (this._colorMaskCache = e, this._renderer.pipeline.setColorMask(e));
	}
	destroy() {
		this._renderer = null, this._colorMaskCache = null;
	}
};
Br.extension = {
	type: [O.WebGPUSystem],
	name: "colorMask"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/GpuDeviceSystem.mjs
var Vr = class {
	constructor(e) {
		this._renderer = e;
	}
	async init(e) {
		return this._initPromise ||= (e.gpu ? Promise.resolve(e.gpu) : this._createDeviceAndAdaptor(e)).then((e) => {
			this.gpu = e, this.extensions = { transientAttachment: typeof GPUTextureUsage.TRANSIENT_ATTACHMENT == "number" }, this._renderer.runners.contextChange.emit(this.gpu);
		}), this._initPromise;
	}
	contextChange(e) {
		this._renderer.gpu = e;
	}
	async _createDeviceAndAdaptor(e) {
		let t = await w.get().getNavigator().gpu.requestAdapter({
			powerPreference: e.powerPreference,
			forceFallbackAdapter: e.forceFallbackAdapter
		}), n = [
			"texture-compression-bc",
			"texture-compression-astc",
			"texture-compression-etc2"
		].filter((e) => t.features.has(e));
		return {
			adapter: t,
			device: await t.requestDevice({ requiredFeatures: n })
		};
	}
	destroy() {
		this.gpu = null, this.extensions = null, this._renderer = null;
	}
};
Vr.extension = {
	type: [O.WebGPUSystem],
	name: "device"
}, Vr.defaultOptions = {
	powerPreference: void 0,
	forceFallbackAdapter: !1
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/GpuEncoderSystem.mjs
var Hr = class {
	constructor(e) {
		this._boundBindGroup = /* @__PURE__ */ Object.create(null), this._boundVertexBuffer = /* @__PURE__ */ Object.create(null), this._renderer = e;
	}
	renderStart() {
		this.commandFinished = new Promise((e) => {
			this._resolveCommandFinished = e;
		}), this.commandEncoder = this._renderer.gpu.device.createCommandEncoder();
	}
	beginRenderPass(e) {
		this.endRenderPass(), this._clearCache(), this.renderPassEncoder = this.commandEncoder.beginRenderPass(e.descriptor);
	}
	endRenderPass() {
		this.renderPassEncoder && this.renderPassEncoder.end(), this.renderPassEncoder = null;
	}
	setViewport(e) {
		this.renderPassEncoder.setViewport(e.x, e.y, e.width, e.height, 0, 1);
	}
	setPipelineFromGeometryProgramAndState(e, t, n, r) {
		let i = this._renderer.pipeline.getPipeline(e, t, n, r);
		this.setPipeline(i);
	}
	setPipeline(e) {
		this._boundPipeline !== e && (this._boundPipeline = e, this.renderPassEncoder.setPipeline(e));
	}
	_setVertexBuffer(e, t) {
		this._boundVertexBuffer[e] !== t && (this._boundVertexBuffer[e] = t, this.renderPassEncoder.setVertexBuffer(e, this._renderer.buffer.updateBuffer(t)));
	}
	_setIndexBuffer(e) {
		if (this._boundIndexBuffer === e) return;
		this._boundIndexBuffer = e;
		let t = e.data.BYTES_PER_ELEMENT === 2 ? "uint16" : "uint32";
		this.renderPassEncoder.setIndexBuffer(this._renderer.buffer.updateBuffer(e), t);
	}
	resetBindGroup(e) {
		this._boundBindGroup[e] = null;
	}
	setBindGroup(e, t, n) {
		if (this._boundBindGroup[e] === t) return;
		this._boundBindGroup[e] = t, t._touch(this._renderer.gc.now, this._renderer.tick);
		let r = this._renderer.bindGroup.getBindGroup(t, n, e);
		this.renderPassEncoder.setBindGroup(e, r);
	}
	setGeometry(e, t) {
		let n = this._renderer.pipeline.getBufferNamesToBind(e, t);
		for (let t in n) this._setVertexBuffer(parseInt(t, 10), e.attributes[n[t]].buffer);
		e.indexBuffer && this._setIndexBuffer(e.indexBuffer);
	}
	_setShaderBindGroups(e, t) {
		for (let n in e.groups) {
			let r = e.groups[n];
			t || this._syncBindGroup(r), this.setBindGroup(n, r, e.gpuProgram);
		}
	}
	_syncBindGroup(e) {
		for (let t in e.resources) {
			let n = e.resources[t];
			n.isUniformGroup && this._renderer.ubo.updateUniformGroup(n);
		}
	}
	draw(e) {
		let { geometry: t, shader: n, state: r, topology: i, size: a, start: o, instanceCount: s, skipSync: c } = e;
		this.setPipelineFromGeometryProgramAndState(t, n.gpuProgram, r, i), this.setGeometry(t, n.gpuProgram), this._setShaderBindGroups(n, c), t.indexBuffer ? this.renderPassEncoder.drawIndexed(a || t.indexBuffer.data.length, s ?? t.instanceCount, o || 0) : this.renderPassEncoder.draw(a || t.getSize(), s ?? t.instanceCount, o || 0);
	}
	finishRenderPass() {
		this.renderPassEncoder &&= (this.renderPassEncoder.end(), null);
	}
	postrender() {
		this.finishRenderPass(), this._gpu.device.queue.submit([this.commandEncoder.finish()]), this._resolveCommandFinished(), this.commandEncoder = null;
	}
	restoreRenderPass() {
		let e = this._renderer.renderTarget.adaptor.getDescriptor(this._renderer.renderTarget.renderTarget, !1, [
			0,
			0,
			0,
			1
		], this._renderer.renderTarget.mipLevel, this._renderer.renderTarget.layer);
		this.renderPassEncoder = this.commandEncoder.beginRenderPass(e);
		let t = this._boundPipeline, n = { ...this._boundVertexBuffer }, r = this._boundIndexBuffer, i = { ...this._boundBindGroup };
		this._clearCache();
		let a = this._renderer.renderTarget.viewport;
		this.renderPassEncoder.setViewport(a.x, a.y, a.width, a.height, 0, 1), this.setPipeline(t);
		for (let e in n) this._setVertexBuffer(e, n[e]);
		for (let e in i) this.setBindGroup(e, i[e], null);
		this._setIndexBuffer(r);
	}
	_clearCache() {
		for (let e = 0; e < 16; e++) this._boundBindGroup[e] = null, this._boundVertexBuffer[e] = null;
		this._boundIndexBuffer = null, this._boundPipeline = null;
	}
	destroy() {
		this._renderer = null, this._gpu = null, this._boundBindGroup = null, this._boundVertexBuffer = null, this._boundIndexBuffer = null, this._boundPipeline = null;
	}
	contextChange(e) {
		this._gpu = e;
	}
};
Hr.extension = {
	type: [O.WebGPUSystem],
	name: "encoder",
	priority: 1
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/GpuLimitsSystem.mjs
var Ur = class {
	constructor(e) {
		this._renderer = e;
	}
	contextChange() {
		this.maxTextures = this._renderer.device.gpu.device.limits.maxSampledTexturesPerShaderStage, this.maxBatchableTextures = this.maxTextures;
	}
	destroy() {}
};
Ur.extension = {
	type: [O.WebGPUSystem],
	name: "limits"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/GpuStencilSystem.mjs
var Wr = class {
	constructor(e) {
		this._renderTargetStencilState = /* @__PURE__ */ Object.create(null), this._renderer = e, e.renderTarget.onRenderTargetChange.add(this);
	}
	onRenderTargetChange(e) {
		let t = this._renderTargetStencilState[e.uid];
		t ||= this._renderTargetStencilState[e.uid] = {
			stencilMode: V.DISABLED,
			stencilReference: 0
		}, this._activeRenderTarget = e, this.setStencilMode(t.stencilMode, t.stencilReference);
	}
	setStencilMode(e, t) {
		let n = this._renderTargetStencilState[this._activeRenderTarget.uid];
		n.stencilMode = e, n.stencilReference = t;
		let r = this._renderer;
		r.pipeline.setStencilMode(e), r.encoder.renderPassEncoder.setStencilReference(t);
	}
	destroy() {
		this._renderer.renderTarget.onRenderTargetChange.remove(this), this._renderer = null, this._activeRenderTarget = null, this._renderTargetStencilState = null;
	}
};
Wr.extension = {
	type: [O.WebGPUSystem],
	name: "stencil"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/createUboElementsWGSL.mjs
var Gr = {
	i32: {
		align: 4,
		size: 4
	},
	u32: {
		align: 4,
		size: 4
	},
	f32: {
		align: 4,
		size: 4
	},
	f16: {
		align: 2,
		size: 2
	},
	"vec2<i32>": {
		align: 8,
		size: 8
	},
	"vec2<u32>": {
		align: 8,
		size: 8
	},
	"vec2<f32>": {
		align: 8,
		size: 8
	},
	"vec2<f16>": {
		align: 4,
		size: 4
	},
	"vec3<i32>": {
		align: 16,
		size: 12
	},
	"vec3<u32>": {
		align: 16,
		size: 12
	},
	"vec3<f32>": {
		align: 16,
		size: 12
	},
	"vec3<f16>": {
		align: 8,
		size: 6
	},
	"vec4<i32>": {
		align: 16,
		size: 16
	},
	"vec4<u32>": {
		align: 16,
		size: 16
	},
	"vec4<f32>": {
		align: 16,
		size: 16
	},
	"vec4<f16>": {
		align: 8,
		size: 8
	},
	"mat2x2<f32>": {
		align: 8,
		size: 16
	},
	"mat2x2<f16>": {
		align: 4,
		size: 8
	},
	"mat3x2<f32>": {
		align: 8,
		size: 24
	},
	"mat3x2<f16>": {
		align: 4,
		size: 12
	},
	"mat4x2<f32>": {
		align: 8,
		size: 32
	},
	"mat4x2<f16>": {
		align: 4,
		size: 16
	},
	"mat2x3<f32>": {
		align: 16,
		size: 32
	},
	"mat2x3<f16>": {
		align: 8,
		size: 16
	},
	"mat3x3<f32>": {
		align: 16,
		size: 48
	},
	"mat3x3<f16>": {
		align: 8,
		size: 24
	},
	"mat4x3<f32>": {
		align: 16,
		size: 64
	},
	"mat4x3<f16>": {
		align: 8,
		size: 32
	},
	"mat2x4<f32>": {
		align: 16,
		size: 32
	},
	"mat2x4<f16>": {
		align: 8,
		size: 16
	},
	"mat3x4<f32>": {
		align: 16,
		size: 48
	},
	"mat3x4<f16>": {
		align: 8,
		size: 24
	},
	"mat4x4<f32>": {
		align: 16,
		size: 64
	},
	"mat4x4<f16>": {
		align: 8,
		size: 32
	}
};
function Kr(e) {
	let t = e.map((e) => ({
		data: e,
		offset: 0,
		size: 0
	})), n = 0;
	for (let e = 0; e < t.length; e++) {
		let r = t[e], i = Gr[r.data.type].size, a = Gr[r.data.type].align;
		if (!Gr[r.data.type]) throw Error(`[Pixi.js] WebGPU UniformBuffer: Unknown type ${r.data.type}`);
		r.data.size > 1 && (i = Math.max(i, a) * r.data.size), n = Math.ceil(n / a) * a, r.size = i, r.offset = n, n += i;
	}
	return n = Math.ceil(n / 16) * 16, {
		uboElements: t,
		size: n
	};
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/generateArraySyncWGSL.mjs
function qr(e, t) {
	let { size: n, align: r } = Gr[e.data.type], i = (r - n) / 4, a = e.data.type.indexOf("i32") >= 0 ? "dataInt32" : "data";
	return `
         v = uv.${e.data.name};
         ${t === 0 ? "" : `offset += ${t};`}

         arrayOffset = offset;

         t = 0;

         for(var i=0; i < ${e.data.size * (n / 4)}; i++)
         {
             for(var j = 0; j < ${n / 4}; j++)
             {
                 ${a}[arrayOffset++] = v[t++];
             }
             ${i === 0 ? "" : `arrayOffset += ${i};`}
         }
     `;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/createUboSyncFunctionWGSL.mjs
function Jr(e) {
	return Ze(e, "uboWgsl", qr, nt);
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/GpuUboSystem.mjs
var Yr = class extends et {
	constructor() {
		super({
			createUboElements: Kr,
			generateUboSync: Jr
		});
	}
};
Yr.extension = {
	type: [O.WebGPUSystem],
	name: "ubo"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/buffer/UboBatch.mjs
var Xr = class {
	constructor({ minUniformOffsetAlignment: e }) {
		this._minUniformOffsetAlignment = 256, this.byteIndex = 0, this._minUniformOffsetAlignment = e, this.data = /* @__PURE__ */ new Float32Array(65535);
	}
	clear() {
		this.byteIndex = 0;
	}
	addEmptyGroup(e) {
		if (e > this._minUniformOffsetAlignment / 4) throw Error(`UniformBufferBatch: array is too large: ${e * 4}`);
		let t = this.byteIndex, n = t + e * 4;
		if (n = Math.ceil(n / this._minUniformOffsetAlignment) * this._minUniformOffsetAlignment, n > this.data.length * 4) throw Error("UniformBufferBatch: ubo batch got too big");
		return this.byteIndex = n, t;
	}
	addGroup(e) {
		let t = this.addEmptyGroup(e.length);
		for (let n = 0; n < e.length; n++) this.data[t / 4 + n] = e[n];
		return t;
	}
	destroy() {
		this.data = null;
	}
}, K = 128, Zr = class {
	constructor(e) {
		this._bindGroupHash = /* @__PURE__ */ Object.create(null), this._buffers = [], this._bindGroups = [], this._bufferResources = [], this._renderer = e, this._batchBuffer = new Xr({ minUniformOffsetAlignment: K });
		let t = 256 / K;
		for (let e = 0; e < t; e++) {
			let t = T.UNIFORM | T.COPY_DST;
			e === 0 && (t |= T.COPY_SRC), this._buffers.push(new S({
				data: this._batchBuffer.data,
				usage: t
			}));
		}
	}
	renderEnd() {
		this._uploadBindGroups(), this._resetBindGroups();
	}
	_resetBindGroups() {
		this._bindGroupHash = /* @__PURE__ */ Object.create(null), this._batchBuffer.clear();
	}
	getUniformBindGroup(e, t) {
		if (!t && this._bindGroupHash[e.uid]) return this._bindGroupHash[e.uid];
		this._renderer.ubo.ensureUniformGroup(e);
		let n = e.buffer.data, r = this._batchBuffer.addEmptyGroup(n.length);
		return this._renderer.ubo.syncUniformGroup(e, this._batchBuffer.data, r / 4), this._bindGroupHash[e.uid] = this._getBindGroup(r / K), this._bindGroupHash[e.uid];
	}
	getUboResource(e) {
		this._renderer.ubo.updateUniformGroup(e);
		let t = e.buffer.data, n = this._batchBuffer.addGroup(t);
		return this._getBufferResource(n / K);
	}
	getArrayBindGroup(e) {
		let t = this._batchBuffer.addGroup(e);
		return this._getBindGroup(t / K);
	}
	getArrayBufferResource(e) {
		let t = this._batchBuffer.addGroup(e) / K;
		return this._getBufferResource(t);
	}
	_getBufferResource(e) {
		if (!this._bufferResources[e]) {
			let t = this._buffers[e % 2];
			this._bufferResources[e] = new it({
				buffer: t,
				offset: (e / 2 | 0) * 256,
				size: K
			});
		}
		return this._bufferResources[e];
	}
	_getBindGroup(e) {
		if (!this._bindGroups[e]) {
			let t = new E({ 0: this._getBufferResource(e) });
			this._bindGroups[e] = t;
		}
		return this._bindGroups[e];
	}
	_uploadBindGroups() {
		let e = this._renderer.buffer, t = this._buffers[0];
		t.update(this._batchBuffer.byteIndex), e.updateBuffer(t);
		let n = this._renderer.gpu.device.createCommandEncoder();
		for (let r = 1; r < this._buffers.length; r++) {
			let i = this._buffers[r];
			n.copyBufferToBuffer(e.getGPUBuffer(t), K, e.getGPUBuffer(i), 0, this._batchBuffer.byteIndex);
		}
		this._renderer.gpu.device.queue.submit([n.finish()]);
	}
	destroy() {
		for (let e = 0; e < this._bindGroups.length; e++) this._bindGroups[e]?.destroy();
		this._bindGroups = null, this._bindGroupHash = null;
		for (let e = 0; e < this._buffers.length; e++) this._buffers[e].destroy();
		this._buffers = null;
		for (let e = 0; e < this._bufferResources.length; e++) this._bufferResources[e].destroy();
		this._bufferResources = null, this._batchBuffer.destroy(), this._renderer = null;
	}
};
Zr.extension = {
	type: [O.WebGPUPipes],
	name: "uniformBatch"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/pipeline/PipelineSystem.mjs
var Qr = {
	"point-list": 0,
	"line-list": 1,
	"line-strip": 2,
	"triangle-list": 3,
	"triangle-strip": 4
};
function $r(e, t, n, r, i) {
	return e << 24 | t << 16 | n << 10 | r << 5 | i;
}
function ei(e, t, n, r, i) {
	return n << 8 | e << 5 | r << 3 | i << 1 | t;
}
var ti = class {
	constructor(e) {
		this._moduleCache = /* @__PURE__ */ Object.create(null), this._bufferLayoutsCache = /* @__PURE__ */ Object.create(null), this._bindingNamesCache = /* @__PURE__ */ Object.create(null), this._pipeCache = /* @__PURE__ */ Object.create(null), this._pipeStateCaches = /* @__PURE__ */ Object.create(null), this._colorMask = 15, this._multisampleCount = 1, this._colorTargetCount = 1, this._renderer = e;
	}
	contextChange(e) {
		this._gpu = e, this.setStencilMode(V.DISABLED), this._updatePipeHash();
	}
	setMultisampleCount(e) {
		this._multisampleCount !== e && (this._multisampleCount = e, this._updatePipeHash());
	}
	setRenderTarget(e) {
		this._multisampleCount = e.msaaSamples, this._depthStencilAttachment = +!!e.descriptor.depthStencilAttachment, this._colorTargetCount = e.colorTargetCount, this._updatePipeHash();
	}
	setColorMask(e) {
		this._colorMask !== e && (this._colorMask = e, this._updatePipeHash());
	}
	setStencilMode(e) {
		this._stencilMode !== e && (this._stencilMode = e, this._stencilState = rt[e], this._updatePipeHash());
	}
	setPipeline(e, t, n, r) {
		let i = this.getPipeline(e, t, n);
		r.setPipeline(i);
	}
	getPipeline(e, t, n, r) {
		e._layoutKey || (Je(e, t.attributeData), this._generateBufferKey(e)), r ||= e.topology;
		let i = $r(e._layoutKey, t._layoutKey, n.data, n._blendModeId, Qr[r]);
		return this._pipeCache[i] || (this._pipeCache[i] = this._createPipeline(e, t, n, r)), this._pipeCache[i];
	}
	_createPipeline(e, t, n, r) {
		let i = this._gpu.device, a = this._createVertexBufferLayouts(e, t), o = this._renderer.state.getColorTargets(n, this._colorTargetCount), s = this._stencilMode === V.RENDERING_MASK_ADD ? 0 : this._colorMask;
		for (let e = 0; e < o.length; e++) o[e].writeMask = s;
		let c = this._renderer.shader.getProgramData(t).pipeline, l = {
			vertex: {
				module: this._getModule(t.vertex.source),
				entryPoint: t.vertex.entryPoint,
				buffers: a
			},
			fragment: {
				module: this._getModule(t.fragment.source),
				entryPoint: t.fragment.entryPoint,
				targets: o
			},
			primitive: {
				topology: r,
				cullMode: n.cullMode
			},
			layout: c,
			multisample: { count: this._multisampleCount },
			label: "PIXI Pipeline"
		};
		return this._depthStencilAttachment && (l.depthStencil = {
			...this._stencilState,
			format: "depth24plus-stencil8",
			depthWriteEnabled: n.depthTest,
			depthCompare: n.depthTest ? "less" : "always"
		}), i.createRenderPipeline(l);
	}
	_getModule(e) {
		return this._moduleCache[e] || this._createModule(e);
	}
	_createModule(e) {
		let t = this._gpu.device;
		return this._moduleCache[e] = t.createShaderModule({ code: e }), this._moduleCache[e];
	}
	_generateBufferKey(e) {
		let t = [], n = 0, r = Object.keys(e.attributes).sort();
		for (let i = 0; i < r.length; i++) {
			let a = e.attributes[r[i]];
			t[n++] = a.offset, t[n++] = a.format, t[n++] = a.stride, t[n++] = a.instance;
		}
		let i = t.join("|");
		return e._layoutKey = _(i, "geometry"), e._layoutKey;
	}
	_generateAttributeLocationsKey(e) {
		let t = [], n = 0, r = Object.keys(e.attributeData).sort();
		for (let i = 0; i < r.length; i++) {
			let a = e.attributeData[r[i]];
			t[n++] = a.location;
		}
		let i = t.join("|");
		return e._attributeLocationsKey = _(i, "programAttributes"), e._attributeLocationsKey;
	}
	getBufferNamesToBind(e, t) {
		let n = e._layoutKey << 16 | t._attributeLocationsKey;
		if (this._bindingNamesCache[n]) return this._bindingNamesCache[n];
		let r = this._createVertexBufferLayouts(e, t), i = /* @__PURE__ */ Object.create(null), a = t.attributeData;
		for (let e = 0; e < r.length; e++) {
			let t = Object.values(r[e].attributes)[0].shaderLocation;
			for (let n in a) if (a[n].location === t) {
				i[e] = n;
				break;
			}
		}
		return this._bindingNamesCache[n] = i, i;
	}
	_createVertexBufferLayouts(e, t) {
		t._attributeLocationsKey || this._generateAttributeLocationsKey(t);
		let n = e._layoutKey << 16 | t._attributeLocationsKey;
		if (this._bufferLayoutsCache[n]) return this._bufferLayoutsCache[n];
		let r = [];
		return e.buffers.forEach((n) => {
			let i = {
				arrayStride: 0,
				stepMode: "vertex",
				attributes: []
			}, a = i.attributes;
			for (let r in t.attributeData) {
				let o = e.attributes[r];
				(o.divisor ?? 1) !== 1 && d(`Attribute ${r} has an invalid divisor value of '${o.divisor}'. WebGPU only supports a divisor value of 1`), o.buffer === n && (i.arrayStride = o.stride, i.stepMode = o.instance ? "instance" : "vertex", a.push({
					shaderLocation: t.attributeData[r].location,
					offset: o.offset,
					format: o.format
				}));
			}
			a.length && r.push(i);
		}), this._bufferLayoutsCache[n] = r, r;
	}
	_updatePipeHash() {
		let e = ei(this._stencilMode, this._multisampleCount, this._colorMask, this._depthStencilAttachment, this._colorTargetCount);
		this._pipeStateCaches[e] || (this._pipeStateCaches[e] = /* @__PURE__ */ Object.create(null)), this._pipeCache = this._pipeStateCaches[e];
	}
	destroy() {
		this._renderer = null, this._bufferLayoutsCache = null;
	}
};
ti.extension = {
	type: [O.WebGPUSystem],
	name: "pipeline"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/renderTarget/GpuRenderTarget.mjs
var ni = class {
	constructor() {
		this.contexts = [], this.msaaTextures = [], this.msaaSamples = 1;
	}
}, ri = class {
	init(e, t) {
		this._renderer = e, this._renderTargetSystem = t;
	}
	copyToTexture(e, t, n, r, i) {
		let a = this._renderer, o = this._getGpuColorTexture(e), s = a.texture.getGpuSource(t.source);
		return a.encoder.commandEncoder.copyTextureToTexture({
			texture: o,
			origin: n
		}, {
			texture: s,
			origin: i
		}, r), t;
	}
	startRenderPass(e, t = !0, n, r, i = 0, a = 0) {
		let o = this._renderTargetSystem.getGpuRenderTarget(e);
		if (a !== 0 && o.msaaTextures?.length) throw Error("[RenderTargetSystem] Rendering to array layers is not supported with MSAA render targets.");
		if (i > 0 && o.msaaTextures?.length) throw Error("[RenderTargetSystem] Rendering to mip levels is not supported with MSAA render targets.");
		o.descriptor = this.getDescriptor(e, t, n, i, a), this._renderer.pipeline.setRenderTarget(o), this._renderer.encoder.beginRenderPass(o), this._renderer.encoder.setViewport(r);
	}
	finishRenderPass() {
		this._renderer.encoder.endRenderPass();
	}
	_getGpuColorTexture(e) {
		let t = this._renderTargetSystem.getGpuRenderTarget(e);
		return t.contexts[0] ? t.contexts[0].getCurrentTexture() : this._renderer.texture.getGpuSource(e.colorTextures[0].source);
	}
	getDescriptor(e, t, n, r = 0, i = 0) {
		typeof t == "boolean" && (t = t ? B.ALL : B.NONE);
		let a = this._renderTargetSystem, o = a.getGpuRenderTarget(e), s = e.colorTextures.map((e, s) => {
			let c = o.contexts[s], l, u;
			if (c) {
				if (i !== 0) throw Error("[RenderTargetSystem] Rendering to array layers is not supported for canvas targets.");
				l = c.getCurrentTexture().createView();
			} else l = this._renderer.texture.getGpuSource(e).createView({
				dimension: "2d",
				baseMipLevel: r,
				mipLevelCount: 1,
				baseArrayLayer: i,
				arrayLayerCount: 1
			});
			let d = !1;
			o.msaaTextures[s] && (u = l, l = this._renderer.texture.getTextureView(o.msaaTextures[s]), d = o.msaaTextures[s].transient);
			let f = t & B.COLOR ? "clear" : "load";
			return n ??= a.defaultClearColor, {
				view: l,
				resolveTarget: u,
				clearValue: n,
				storeOp: d ? "discard" : "store",
				loadOp: f
			};
		}), c;
		if ((e.stencil || e.depth) && !e.depthStencilTexture && (e.ensureDepthStencilTexture(), e.depthStencilTexture.source.sampleCount = o.msaa ? 4 : 1, e.depthStencilTexture.source.transient = !!o.msaaTextures[0]?.transient), e.depthStencilTexture) {
			let n = t & B.STENCIL ? "clear" : "load", a = t & B.DEPTH ? "clear" : "load", o = e.depthStencilTexture.source.transient ? "discard" : "store";
			c = {
				view: this._renderer.texture.getGpuSource(e.depthStencilTexture.source).createView({
					dimension: "2d",
					baseMipLevel: r,
					mipLevelCount: 1,
					baseArrayLayer: i,
					arrayLayerCount: 1
				}),
				stencilStoreOp: o,
				stencilLoadOp: n,
				depthClearValue: 1,
				depthLoadOp: a,
				depthStoreOp: o
			};
		}
		return {
			colorAttachments: s,
			depthStencilAttachment: c
		};
	}
	clear(e, t = !0, n, r, i = 0, a = 0) {
		if (!t) return;
		let { gpu: o, encoder: s } = this._renderer, c = o.device;
		if (s.commandEncoder === null) {
			let o = c.createCommandEncoder(), s = this.getDescriptor(e, t, n, i, a), l = o.beginRenderPass(s);
			l.setViewport(r.x, r.y, r.width, r.height, 0, 1), l.end();
			let u = o.finish();
			c.queue.submit([u]);
		} else this.startRenderPass(e, t, n, r, i, a);
	}
	initGpuRenderTarget(e) {
		e.isRoot = !0;
		let t = new ni();
		return t.colorTargetCount = e.colorTextures.length, e.colorTextures.forEach((e, n) => {
			if (e instanceof A) {
				let r = e.resource.getContext("webgpu"), i = e.transparent ? "premultiplied" : "opaque";
				try {
					r.configure({
						device: this._renderer.gpu.device,
						usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
						format: "bgra8unorm",
						alphaMode: i
					});
				} catch (e) {
					console.error(e);
				}
				t.contexts[n] = r;
			}
			if (t.msaa = e.source.antialias, e.source.antialias) {
				let r = new D({
					width: 0,
					height: 0,
					sampleCount: 4,
					transient: e.source.transient,
					arrayLayerCount: e.source.arrayLayerCount
				});
				t.msaaTextures[n] = r;
			}
		}), t.msaa && (t.msaaSamples = 4, e.depthStencilTexture && (e.depthStencilTexture.source.sampleCount = 4, e.depthStencilTexture.source.transient = !!t.msaaTextures[0]?.transient)), t;
	}
	destroyGpuRenderTarget(e) {
		e.contexts.forEach((e) => {
			e.unconfigure();
		}), e.msaaTextures.forEach((e) => {
			e.destroy();
		}), e.msaaTextures.length = 0, e.contexts.length = 0;
	}
	ensureDepthStencilTexture(e) {
		let t = this._renderTargetSystem.getGpuRenderTarget(e);
		e.depthStencilTexture && t.msaa && (e.depthStencilTexture.source.sampleCount = 4);
	}
	resizeGpuRenderTarget(e) {
		let t = this._renderTargetSystem.getGpuRenderTarget(e);
		t.width = e.width, t.height = e.height, t.msaa && e.colorTextures.forEach((e, n) => {
			t.msaaTextures[n]?.resize(e.source.width, e.source.height, e.source._resolution);
		});
	}
}, ii = class extends Ne {
	constructor(e) {
		super(e), this.adaptor = new ri(), this.adaptor.init(e, this);
	}
};
ii.extension = {
	type: [O.WebGPUSystem],
	name: "renderTarget"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/shader/GpuShaderSystem.mjs
var ai = class {
	constructor() {
		this._gpuProgramData = /* @__PURE__ */ Object.create(null);
	}
	contextChange(e) {
		this._gpu = e;
	}
	getProgramData(e) {
		return this._gpuProgramData[e._layoutKey] || this._createGPUProgramData(e);
	}
	_createGPUProgramData(e) {
		let t = this._gpu.device, n = e.gpuLayout.map((e) => t.createBindGroupLayout({ entries: e })), r = { bindGroupLayouts: n };
		return this._gpuProgramData[e._layoutKey] = {
			bindGroups: n,
			pipeline: t.createPipelineLayout(r)
		}, this._gpuProgramData[e._layoutKey];
	}
	destroy() {
		this._gpu = null, this._gpuProgramData = null;
	}
};
ai.extension = {
	type: [O.WebGPUSystem],
	name: "shader"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/state/GpuBlendModesToPixi.mjs
var q = {};
q.normal = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	},
	color: {
		srcFactor: "one",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	}
}, q.add = {
	alpha: {
		srcFactor: "src-alpha",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	},
	color: {
		srcFactor: "one",
		dstFactor: "one",
		operation: "add"
	}
}, q.multiply = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	},
	color: {
		srcFactor: "dst",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	}
}, q.screen = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	},
	color: {
		srcFactor: "one",
		dstFactor: "one-minus-src",
		operation: "add"
	}
}, q.overlay = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	},
	color: {
		srcFactor: "one",
		dstFactor: "one-minus-src",
		operation: "add"
	}
}, q.none = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	},
	color: {
		srcFactor: "zero",
		dstFactor: "zero",
		operation: "add"
	}
}, q["normal-npm"] = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	},
	color: {
		srcFactor: "src-alpha",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	}
}, q["add-npm"] = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one",
		operation: "add"
	},
	color: {
		srcFactor: "src-alpha",
		dstFactor: "one",
		operation: "add"
	}
}, q["screen-npm"] = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	},
	color: {
		srcFactor: "src-alpha",
		dstFactor: "one-minus-src",
		operation: "add"
	}
}, q.erase = {
	alpha: {
		srcFactor: "zero",
		dstFactor: "one-minus-src-alpha",
		operation: "add"
	},
	color: {
		srcFactor: "zero",
		dstFactor: "one-minus-src",
		operation: "add"
	}
}, q.min = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one",
		operation: "min"
	},
	color: {
		srcFactor: "one",
		dstFactor: "one",
		operation: "min"
	}
}, q.max = {
	alpha: {
		srcFactor: "one",
		dstFactor: "one",
		operation: "max"
	},
	color: {
		srcFactor: "one",
		dstFactor: "one",
		operation: "max"
	}
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/state/GpuStateSystem.mjs
var oi = class {
	constructor() {
		this.defaultState = new k(), this.defaultState.blend = !0;
	}
	contextChange(e) {
		this.gpu = e;
	}
	getColorTargets(e, t) {
		let n = q[e.blendMode] || q.normal, r = [], i = {
			format: "bgra8unorm",
			writeMask: 0,
			blend: n
		};
		for (let e = 0; e < t; e++) r[e] = i;
		return r;
	}
	destroy() {
		this.gpu = null;
	}
};
oi.extension = {
	type: [O.WebGPUSystem],
	name: "state"
};
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadBufferImageResource.mjs
var si = {
	type: "image",
	upload(e, t, n, r = 0) {
		let i = e.resource, a = (e.pixelWidth | 0) * (e.pixelHeight | 0), o = i.byteLength / a;
		n.device.queue.writeTexture({
			texture: t,
			origin: {
				x: 0,
				y: 0,
				z: r
			}
		}, i, {
			offset: 0,
			rowsPerImage: e.pixelHeight,
			bytesPerRow: e.pixelWidth * o
		}, {
			width: e.pixelWidth,
			height: e.pixelHeight,
			depthOrArrayLayers: 1
		});
	}
}, ci = {
	"bc1-rgba-unorm": {
		blockBytes: 8,
		blockWidth: 4,
		blockHeight: 4
	},
	"bc2-rgba-unorm": {
		blockBytes: 16,
		blockWidth: 4,
		blockHeight: 4
	},
	"bc3-rgba-unorm": {
		blockBytes: 16,
		blockWidth: 4,
		blockHeight: 4
	},
	"bc7-rgba-unorm": {
		blockBytes: 16,
		blockWidth: 4,
		blockHeight: 4
	},
	"etc1-rgb-unorm": {
		blockBytes: 8,
		blockWidth: 4,
		blockHeight: 4
	},
	"etc2-rgba8unorm": {
		blockBytes: 16,
		blockWidth: 4,
		blockHeight: 4
	},
	"astc-4x4-unorm": {
		blockBytes: 16,
		blockWidth: 4,
		blockHeight: 4
	}
}, li = {
	blockBytes: 4,
	blockWidth: 1,
	blockHeight: 1
}, ui = {
	type: "compressed",
	upload(e, t, n, r = 0) {
		let i = e.pixelWidth, a = e.pixelHeight, o = ci[e.format] || li;
		for (let s = 0; s < e.resource.length; s++) {
			let c = e.resource[s], l = Math.ceil(i / o.blockWidth) * o.blockBytes;
			n.device.queue.writeTexture({
				texture: t,
				mipLevel: s,
				origin: {
					x: 0,
					y: 0,
					z: r
				}
			}, c, {
				offset: 0,
				bytesPerRow: l
			}, {
				width: Math.ceil(i / o.blockWidth) * o.blockWidth,
				height: Math.ceil(a / o.blockHeight) * o.blockHeight,
				depthOrArrayLayers: 1
			}), i = Math.max(i >> 1, 1), a = Math.max(a >> 1, 1);
		}
	}
}, di = [
	"right",
	"left",
	"top",
	"bottom",
	"front",
	"back"
];
function fi(e) {
	return {
		type: "cube",
		upload(t, n, r) {
			let i = t.faces;
			for (let t = 0; t < di.length; t++) {
				let a = i[di[t]];
				(e[a.uploadMethodId] || e.image).upload(a, n, r, t);
			}
		}
	};
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadImageSource.mjs
var pi = {
	type: "image",
	upload(e, t, n, r = 0) {
		let i = e.resource;
		if (!i) return;
		if (globalThis.HTMLImageElement && i instanceof HTMLImageElement) {
			let t = w.get().createCanvas(i.width, i.height);
			t.getContext("2d").drawImage(i, 0, 0, i.width, i.height), e.resource = t, d("ImageSource: Image element passed, converting to canvas and replacing resource.");
		}
		let a = Math.min(t.width, e.resourceWidth || e.pixelWidth), o = Math.min(t.height, e.resourceHeight || e.pixelHeight), s = e.alphaMode === "premultiply-alpha-on-upload";
		n.device.queue.copyExternalImageToTexture({ source: i }, {
			texture: t,
			origin: {
				x: 0,
				y: 0,
				z: r
			},
			premultipliedAlpha: s
		}, {
			width: a,
			height: o
		});
	}
}, mi = {
	type: "video",
	upload(e, t, n, r) {
		pi.upload(e, t, n, r);
	}
}, hi = class {
	constructor(e) {
		this.device = e, this.sampler = e.createSampler({ minFilter: "linear" }), this.pipelines = {};
	}
	_getMipmapPipeline(e) {
		let t = this.pipelines[e];
		return t || (this.mipmapShaderModule ||= this.device.createShaderModule({ code: "\n                        var<private> pos : array<vec2<f32>, 3> = array<vec2<f32>, 3>(\n                        vec2<f32>(-1.0, -1.0), vec2<f32>(-1.0, 3.0), vec2<f32>(3.0, -1.0));\n\n                        struct VertexOutput {\n                        @builtin(position) position : vec4<f32>,\n                        @location(0) texCoord : vec2<f32>,\n                        };\n\n                        @vertex\n                        fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {\n                        var output : VertexOutput;\n                        output.texCoord = pos[vertexIndex] * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5);\n                        output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);\n                        return output;\n                        }\n\n                        @group(0) @binding(0) var imgSampler : sampler;\n                        @group(0) @binding(1) var img : texture_2d<f32>;\n\n                        @fragment\n                        fn fragmentMain(@location(0) texCoord : vec2<f32>) -> @location(0) vec4<f32> {\n                        return textureSample(img, imgSampler, texCoord);\n                        }\n                    " }), t = this.device.createRenderPipeline({
			layout: "auto",
			vertex: {
				module: this.mipmapShaderModule,
				entryPoint: "vertexMain"
			},
			fragment: {
				module: this.mipmapShaderModule,
				entryPoint: "fragmentMain",
				targets: [{ format: e }]
			}
		}), this.pipelines[e] = t), t;
	}
	generateMipmap(e) {
		let t = this._getMipmapPipeline(e.format);
		if (e.dimension === "3d" || e.dimension === "1d") throw Error("Generating mipmaps for non-2d textures is currently unsupported!");
		let n = e, r = e.depthOrArrayLayers || 1, i = e.usage & GPUTextureUsage.RENDER_ATTACHMENT;
		if (!i) {
			let t = {
				size: {
					width: Math.ceil(e.width / 2),
					height: Math.ceil(e.height / 2),
					depthOrArrayLayers: r
				},
				format: e.format,
				usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
				mipLevelCount: e.mipLevelCount - 1
			};
			n = this.device.createTexture(t);
		}
		let a = this.device.createCommandEncoder({}), o = t.getBindGroupLayout(0);
		for (let s = 0; s < r; ++s) {
			let r = e.createView({
				baseMipLevel: 0,
				mipLevelCount: 1,
				dimension: "2d",
				baseArrayLayer: s,
				arrayLayerCount: 1
			}), c = +!!i;
			for (let i = 1; i < e.mipLevelCount; ++i) {
				let e = n.createView({
					baseMipLevel: c++,
					mipLevelCount: 1,
					dimension: "2d",
					baseArrayLayer: s,
					arrayLayerCount: 1
				}), i = a.beginRenderPass({ colorAttachments: [{
					view: e,
					storeOp: "store",
					loadOp: "clear",
					clearValue: {
						r: 0,
						g: 0,
						b: 0,
						a: 0
					}
				}] }), l = this.device.createBindGroup({
					layout: o,
					entries: [{
						binding: 0,
						resource: this.sampler
					}, {
						binding: 1,
						resource: r
					}]
				});
				i.setPipeline(t), i.setBindGroup(0, l), i.draw(3, 1, 0, 0), i.end(), r = e;
			}
		}
		if (!i) {
			let t = {
				width: Math.ceil(e.width / 2),
				height: Math.ceil(e.height / 2),
				depthOrArrayLayers: r
			};
			for (let r = 1; r < e.mipLevelCount; ++r) a.copyTextureToTexture({
				texture: n,
				mipLevel: r - 1
			}, {
				texture: e,
				mipLevel: r
			}, t), t.width = Math.ceil(t.width / 2), t.height = Math.ceil(t.height / 2);
		}
		return this.device.queue.submit([a.finish()]), i || n.destroy(), e;
	}
}, gi = class {
	constructor(e) {
		this.textureView = null, this.gpuTexture = e;
	}
	destroy() {
		this.gpuTexture.destroy(), this.textureView = null, this.gpuTexture = null;
	}
}, _i = class e {
	constructor(t) {
		this._gpuSamplers = /* @__PURE__ */ Object.create(null), this._bindGroupHash = /* @__PURE__ */ Object.create(null), this._renderer = t, t.gc.addCollection(this, "_bindGroupHash", "hash"), this._managedTextures = new H({
			renderer: t,
			type: "resource",
			onUnload: this.onSourceUnload.bind(this),
			name: "gpuTextureSource"
		});
		let n = {
			image: pi,
			buffer: si,
			video: mi,
			compressed: ui,
			...e.uploadExtensions
		};
		this._uploads = {
			...n,
			cube: fi(n)
		};
	}
	get managedTextures() {
		return Object.values(this._managedTextures.items);
	}
	contextChange(e) {
		this._gpu = e;
	}
	initSource(e) {
		return e._gpuData[this._renderer.uid]?.gpuTexture || this._initSource(e);
	}
	_initSource(e) {
		if (e.autoGenerateMipmaps) {
			let t = Math.max(e.pixelWidth, e.pixelHeight);
			e.mipLevelCount = Math.floor(Math.log2(t)) + 1;
		}
		let t;
		e.sampleCount > 1 ? (t = GPUTextureUsage.RENDER_ATTACHMENT, e.transient && this._renderer.device.extensions.transientAttachment && (t |= GPUTextureUsage.TRANSIENT_ATTACHMENT)) : (t = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST, e.uploadMethodId !== "compressed" && (t |= GPUTextureUsage.RENDER_ATTACHMENT, t |= GPUTextureUsage.COPY_SRC));
		let n = ci[e.format] || {
			blockBytes: 4,
			blockWidth: 1,
			blockHeight: 1
		}, r = Math.ceil(e.pixelWidth / n.blockWidth) * n.blockWidth, i = Math.ceil(e.pixelHeight / n.blockHeight) * n.blockHeight, a = {
			label: e.label,
			size: {
				width: r,
				height: i,
				depthOrArrayLayers: e.arrayLayerCount
			},
			format: e.format,
			sampleCount: e.sampleCount,
			mipLevelCount: e.mipLevelCount,
			dimension: e.dimension,
			usage: t
		}, o = this._gpu.device.createTexture(a);
		return e._gpuData[this._renderer.uid] = new gi(o), this._managedTextures.add(e) && (e.on("update", this.onSourceUpdate, this), e.on("resize", this.onSourceResize, this), e.on("updateMipmaps", this.onUpdateMipmaps, this)), this.onSourceUpdate(e), o;
	}
	onSourceUpdate(e) {
		let t = this.getGpuSource(e);
		t && (this._uploads[e.uploadMethodId] && this._uploads[e.uploadMethodId].upload(e, t, this._gpu), e.autoGenerateMipmaps && e.mipLevelCount > 1 && this.onUpdateMipmaps(e));
	}
	onUpdateMipmaps(e) {
		this._mipmapGenerator ||= new hi(this._gpu.device);
		let t = this.getGpuSource(e);
		this._mipmapGenerator.generateMipmap(t);
	}
	onSourceUnload(e) {
		e.off("update", this.onSourceUpdate, this), e.off("resize", this.onSourceResize, this), e.off("updateMipmaps", this.onUpdateMipmaps, this);
	}
	onSourceResize(e) {
		e._gcLastUsed = this._renderer.gc.now;
		let t = e._gpuData[this._renderer.uid], n = t?.gpuTexture;
		n ? (n.width !== e.pixelWidth || n.height !== e.pixelHeight) && (t.destroy(), this._bindGroupHash[e.uid] = null, e._gpuData[this._renderer.uid] = null, this.initSource(e)) : this.initSource(e);
	}
	_initSampler(e) {
		return this._gpuSamplers[e._resourceId] = this._gpu.device.createSampler(e), this._gpuSamplers[e._resourceId];
	}
	getGpuSampler(e) {
		return this._gpuSamplers[e._resourceId] || this._initSampler(e);
	}
	getGpuSource(e) {
		return e._gcLastUsed = this._renderer.gc.now, e._gpuData[this._renderer.uid]?.gpuTexture || this.initSource(e);
	}
	getTextureBindGroup(e) {
		return this._bindGroupHash[e.uid] || this._createTextureBindGroup(e);
	}
	_createTextureBindGroup(e) {
		let t = e.source;
		return this._bindGroupHash[e.uid] = new E({
			0: t,
			1: t.style,
			2: new g({ uTextureMatrix: {
				type: "mat3x3<f32>",
				value: e.textureMatrix.mapCoord
			} })
		}), this._bindGroupHash[e.uid];
	}
	getTextureView(e) {
		let t = e.source;
		t._gcLastUsed = this._renderer.gc.now;
		let n = t._gpuData[this._renderer.uid];
		return n ||= (this.initSource(t), t._gpuData[this._renderer.uid]), n.textureView || (n.textureView = n.gpuTexture.createView({ dimension: t.viewDimension })), n.textureView;
	}
	generateCanvas(e) {
		let t = this._renderer, n = t.gpu.device.createCommandEncoder(), r = w.get().createCanvas();
		r.width = e.source.pixelWidth, r.height = e.source.pixelHeight;
		let i = r.getContext("webgpu");
		return i.configure({
			device: t.gpu.device,
			usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC,
			format: w.get().getNavigator().gpu.getPreferredCanvasFormat(),
			alphaMode: "premultiplied"
		}), n.copyTextureToTexture({
			texture: t.texture.getGpuSource(e.source),
			origin: {
				x: 0,
				y: 0
			}
		}, { texture: i.getCurrentTexture() }, {
			width: r.width,
			height: r.height
		}), t.gpu.device.queue.submit([n.finish()]), r;
	}
	getPixels(e) {
		let t = this.generateCanvas(e), n = R.getOptimalCanvasAndContext(t.width, t.height), r = n.context;
		r.drawImage(t, 0, 0);
		let { width: i, height: a } = t, o = r.getImageData(0, 0, i, a), s = new Uint8ClampedArray(o.data.buffer);
		return R.returnCanvasAndContext(n), {
			pixels: s,
			width: i,
			height: a
		};
	}
	destroy() {
		this._managedTextures.destroy();
		for (let e of Object.keys(this._bindGroupHash)) {
			let t = Number(e);
			this._bindGroupHash[t]?.destroy();
		}
		this._renderer = null, this._gpu = null, this._mipmapGenerator = null, this._gpuSamplers = null, this._bindGroupHash = null;
	}
};
_i.extension = {
	type: [O.WebGPUSystem],
	name: "texture"
}, _i.uploadExtensions = /* @__PURE__ */ Object.create(null);
var vi = _i;
a.handleByMap(O.TextureUploaderWebGPU, vi.uploadExtensions);
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/gpu/WebGPURenderer.mjs
var yi = [
	...Me,
	Yr,
	Hr,
	Vr,
	Ur,
	zr,
	vi,
	ii,
	ai,
	oi,
	ti,
	Br,
	Wr,
	Lr
], bi = [...Ae, Zr], xi = [
	Ir,
	Pr,
	Nr
], Si = [], Ci = [], wi = [];
a.handleByNamedList(O.WebGPUSystem, Si), a.handleByNamedList(O.WebGPUPipes, Ci), a.handleByNamedList(O.WebGPUPipesAdaptor, wi), a.add(...yi, ...bi, ...xi);
var Ti = class extends Ce {
	constructor() {
		let e = {
			name: "webgpu",
			type: C.WEBGPU,
			systems: Si,
			renderPipes: Ci,
			renderPipeAdaptors: wi
		};
		super(e);
	}
}, Ei = class extends f {
	constructor() {
		super(...arguments), this.chars = /* @__PURE__ */ Object.create(null), this.lineHeight = 0, this.fontFamily = "", this.fontMetrics = {
			fontSize: 0,
			ascent: 0,
			descent: 0
		}, this.baseLineOffset = 0, this.distanceField = {
			type: "none",
			range: 0
		}, this.pages = [], this.applyFillAsTint = !0, this.baseMeasurementFontSize = 100, this.baseRenderedFontSize = 100;
	}
	get font() {
		return y(i, "BitmapFont.font is deprecated, please use BitmapFont.fontFamily instead."), this.fontFamily;
	}
	get pageTextures() {
		return y(i, "BitmapFont.pageTextures is deprecated, please use BitmapFont.pages instead."), this.pages;
	}
	get size() {
		return y(i, "BitmapFont.size is deprecated, please use BitmapFont.fontMetrics.fontSize instead."), this.fontMetrics.fontSize;
	}
	get distanceFieldRange() {
		return y(i, "BitmapFont.distanceFieldRange is deprecated, please use BitmapFont.distanceField.range instead."), this.distanceField.range;
	}
	get distanceFieldType() {
		return y(i, "BitmapFont.distanceFieldType is deprecated, please use BitmapFont.distanceField.type instead."), this.distanceField.type;
	}
	destroy(e = !1) {
		this.emit("destroy", this), this.removeAllListeners();
		for (let e in this.chars) this.chars[e].texture?.destroy();
		this.chars = null, e && (this.pages.forEach((e) => e.texture.destroy(!0)), this.pages = null);
	}
}, Di = class {
	constructor(e = 0, t = 0, n = !1) {
		this.first = null, this.items = Object.create(null), this.last = null, this.max = e, this.resetTtl = n, this.size = 0, this.ttl = t;
	}
	clear() {
		return this.first = null, this.items = Object.create(null), this.last = null, this.size = 0, this;
	}
	delete(e) {
		if (this.has(e)) {
			let t = this.items[e];
			delete this.items[e], this.size--, t.prev !== null && (t.prev.next = t.next), t.next !== null && (t.next.prev = t.prev), this.first === t && (this.first = t.next), this.last === t && (this.last = t.prev);
		}
		return this;
	}
	entries(e = this.keys()) {
		let t = Array(e.length);
		for (let n = 0; n < e.length; n++) {
			let r = e[n];
			t[n] = [r, this.get(r)];
		}
		return t;
	}
	evict(e = !1) {
		if (e || this.size > 0) {
			let e = this.first;
			delete this.items[e.key], --this.size === 0 ? (this.first = null, this.last = null) : (this.first = e.next, this.first.prev = null);
		}
		return this;
	}
	expiresAt(e) {
		let t;
		return this.has(e) && (t = this.items[e].expiry), t;
	}
	get(e) {
		let t = this.items[e];
		if (t !== void 0) {
			if (this.ttl > 0 && t.expiry <= Date.now()) {
				this.delete(e);
				return;
			}
			return this.moveToEnd(t), t.value;
		}
	}
	has(e) {
		return e in this.items;
	}
	moveToEnd(e) {
		this.last !== e && (e.prev !== null && (e.prev.next = e.next), e.next !== null && (e.next.prev = e.prev), this.first === e && (this.first = e.next), e.prev = this.last, e.next = null, this.last !== null && (this.last.next = e), this.last = e, this.first === null && (this.first = e));
	}
	keys() {
		let e = Array(this.size), t = this.first, n = 0;
		for (; t !== null;) e[n++] = t.key, t = t.next;
		return e;
	}
	setWithEvicted(e, t, n = this.resetTtl) {
		let r = null;
		if (this.has(e)) this.set(e, t, !0, n);
		else {
			this.max > 0 && this.size === this.max && (r = { ...this.first }, this.evict(!0));
			let n = this.items[e] = {
				expiry: this.ttl > 0 ? Date.now() + this.ttl : this.ttl,
				key: e,
				prev: this.last,
				next: null,
				value: t
			};
			++this.size === 1 ? this.first = n : this.last.next = n, this.last = n;
		}
		return r;
	}
	set(e, t, n = !1, r = this.resetTtl) {
		let i = this.items[e];
		return n || i !== void 0 ? (i.value = t, n === !1 && r && (i.expiry = this.ttl > 0 ? Date.now() + this.ttl : this.ttl), this.moveToEnd(i)) : (this.max > 0 && this.size === this.max && this.evict(!0), i = this.items[e] = {
			expiry: this.ttl > 0 ? Date.now() + this.ttl : this.ttl,
			key: e,
			prev: this.last,
			next: null,
			value: t
		}, ++this.size === 1 ? this.first = i : this.last.next = i, this.last = i), this;
	}
	values(e = this.keys()) {
		let t = Array(e.length);
		for (let n = 0; n < e.length; n++) t[n] = this.get(e[n]);
		return t;
	}
};
function Oi(e = 1e3, t = 0, n = !1) {
	if (isNaN(e) || e < 0) throw TypeError("Invalid max value");
	if (isNaN(t) || t < 0) throw TypeError("Invalid ttl value");
	if (typeof n != "boolean") throw TypeError("Invalid resetTtl value");
	return new Di(e, t, n);
}
//#endregion
//#region node_modules/pixi.js/lib/scene/text/canvas/utils/parseTaggedText.mjs
function ki(e) {
	return !!e.tagStyles && Object.keys(e.tagStyles).length > 0;
}
function Ai(e) {
	return e.includes("<");
}
function ji(e, t) {
	return e.clone().assign(t);
}
function Mi(e, t) {
	let n = [], r = t.tagStyles;
	if (!ki(t) || !Ai(e)) return n.push({
		text: e,
		style: t
	}), n;
	let i = [t], a = [], o = "", s = 0;
	for (; s < e.length;) {
		let t = e[s];
		if (t === "<") {
			let c = e.indexOf(">", s);
			if (c === -1) {
				o += t, s++;
				continue;
			}
			let l = e.indexOf("<", s + 1);
			if (l !== -1 && l < c) {
				o += t, s++;
				continue;
			}
			let u = e.slice(s + 1, c);
			if (u.startsWith("/")) {
				let t = u.slice(1).trim();
				if (a.length > 0 && a[a.length - 1] === t) {
					o.length > 0 && (n.push({
						text: o,
						style: i[i.length - 1]
					}), o = ""), i.pop(), a.pop(), s = c + 1;
					continue;
				}
				o += e.slice(s, c + 1), s = c + 1;
				continue;
			}
			{
				let t = u.trim();
				if (r[t]) {
					o.length > 0 && (n.push({
						text: o,
						style: i[i.length - 1]
					}), o = "");
					let e = i[i.length - 1], l = ji(e, r[t]);
					i.push(l), a.push(t), s = c + 1;
					continue;
				}
				o += e.slice(s, c + 1), s = c + 1;
				continue;
			}
		}
		o += t, s++;
	}
	return o.length > 0 && n.push({
		text: o,
		style: i[i.length - 1]
	}), n;
}
var Ni = /* @__PURE__ */ new Set([10, 13]), Pi = /* @__PURE__ */ new Set([
	9,
	32,
	8192,
	8193,
	8194,
	8195,
	8196,
	8197,
	8198,
	8200,
	8201,
	8202,
	8287,
	12288
]), Fi = /* @__PURE__ */ new Set([9, 32]), Ii = /* @__PURE__ */ new Set([
	45,
	8208,
	8211,
	8212,
	173
]), Li = /(\r\n|\r|\n)/, Ri = /(?:\r\n|\r|\n)/;
function zi(e) {
	return typeof e == "string" && Ni.has(e.charCodeAt(0));
}
function J(e, t) {
	return typeof e == "string" && Pi.has(e.charCodeAt(0));
}
function Bi(e) {
	return typeof e == "string" && Fi.has(e.charCodeAt(0));
}
function Vi(e) {
	return typeof e == "string" && Ii.has(e.charCodeAt(0));
}
function Hi(e) {
	return e === "normal" || e === "pre-line";
}
function Ui(e) {
	return e === "normal";
}
function Y(e) {
	if (typeof e != "string") return "";
	let t = e.length - 1;
	for (; t >= 0 && J(e[t]);) t--;
	return t < e.length - 1 ? e.slice(0, t + 1) : e;
}
function Wi(e) {
	let t = [], n = [];
	if (typeof e != "string") return t;
	for (let r = 0; r < e.length; r++) {
		let i = e[r], a = e[r + 1];
		if (J(i, a) || zi(i)) {
			n.length > 0 && (t.push(n.join("")), n.length = 0), i === "\r" && a === "\n" ? (t.push("\r\n"), r++) : t.push(i);
			continue;
		}
		n.push(i), Vi(i) && a && !J(a) && !zi(a) && (t.push(n.join("")), n.length = 0);
	}
	return n.length > 0 && t.push(n.join("")), t;
}
function Gi(e, t, n, r) {
	let i = n(e), a = [];
	for (let n = 0; n < i.length; n++) {
		let o = i[n], s = o, c = 1;
		for (; i[n + c];) {
			let a = i[n + c];
			if (!r(s, a, e, n, t)) o += a, s = a, c++;
			else break;
		}
		n += c - 1, a.push(o);
	}
	return a;
}
//#endregion
//#region node_modules/pixi.js/lib/scene/text/canvas/utils/measureTaggedText.mjs
var Ki = /\r\n|\r|\n/g;
function qi(e, t, n, r, i, a, o, s, c) {
	let l = Mi(e, t);
	if (Ui(t.whiteSpace)) for (let e = 0; e < l.length; e++) {
		let t = l[e];
		l[e] = {
			text: t.text.replace(Ki, " "),
			style: t.style
		};
	}
	let u = [], d = [];
	for (let e of l) {
		let t = e.text.split(Li);
		for (let n = 0; n < t.length; n++) {
			let r = t[n];
			r === "\r\n" || r === "\r" || r === "\n" ? (u.push(d), d = []) : r.length > 0 && d.push({
				text: r,
				style: e.style
			});
		}
	}
	(d.length > 0 || u.length === 0) && u.push(d);
	let f = n ? Ji(u, t, r, a, s, c) : u, p = [], m = [], h = [], g = [], _ = [], v = 0, y = t._fontString, b = o(y);
	b.fontSize === 0 && (b.fontSize = t.fontSize, b.ascent = t.fontSize);
	let x = "", S = !!t.dropShadow, C = t._stroke?.width || 0;
	for (let e of f) {
		let n = 0, a = b.ascent, s = b.descent, c = "";
		for (let t of e) {
			let e = t.style._fontString, l = o(e);
			e !== x && (r.font = e, x = e);
			let u = i(t.text, t.style.letterSpacing, r);
			n += u, a = Math.max(a, l.ascent), s = Math.max(s, l.descent), c += t.text;
			let d = t.style._stroke?.width || 0;
			d > C && (C = d), !S && t.style.dropShadow && (S = !0);
		}
		e.length === 0 && (a = b.ascent, s = b.descent), p.push(n), m.push(a), h.push(s), _.push(c);
		let l = t.lineHeight || a + s;
		g.push(l + t.leading), v = Math.max(v, n);
	}
	let w = C, T = v + w + (t.dropShadow ? t.dropShadow.distance : 0), E = 0;
	for (let e = 0; e < g.length; e++) E += g[e];
	return E = Math.max(E, g[0] + w), {
		width: T,
		height: E + (t.dropShadow ? t.dropShadow.distance : 0),
		lines: _,
		lineWidths: p,
		lineHeight: (t.lineHeight || b.fontSize) + t.leading,
		maxLineWidth: v,
		fontProperties: b,
		runsByLine: f,
		lineAscents: m,
		lineDescents: h,
		lineHeights: g,
		hasDropShadow: S
	};
}
function Ji(e, t, n, r, i, a) {
	let { letterSpacing: o, whiteSpace: s, wordWrapWidth: c, breakWords: l } = t, u = Hi(s), d = c + o, f = {}, p = "", m = (e, t) => {
		let i = `${e}|${t.styleKey}`, a = f[i];
		if (a === void 0) {
			let o = t._fontString;
			o !== p && (n.font = o, p = o), a = r(e, t.letterSpacing, n) + t.letterSpacing, f[i] = a;
		}
		return a;
	}, h = [];
	for (let t of e) {
		let e = Yi(t), n = h.length, r = (t) => {
			let n = 0, r = t;
			do {
				let { token: t, style: i } = e[r];
				n += m(t, i), r++;
			} while (r < e.length && e[r].continuesFromPrevious);
			return n;
		}, o = (t) => {
			let n = [], r = t;
			do
				n.push({
					token: e[r].token,
					style: e[r].style
				}), r++;
			while (r < e.length && e[r].continuesFromPrevious);
			return n;
		}, s = [], c = 0, f = !u, p = null, g = () => {
			p && p.text.length > 0 && s.push(p), p = null;
		}, _ = () => {
			if (g(), s.length > 0) {
				let e = s[s.length - 1];
				e.text = Y(e.text), e.text.length === 0 && s.pop();
			}
			h.push(s), s = [], c = 0, f = !1;
		};
		for (let t = 0; t < e.length; t++) {
			let { token: n, style: v, continuesFromPrevious: y } = e[t], b = m(n, v);
			if (u) {
				let e = J(n), t = p?.text[p.text.length - 1] ?? s[s.length - 1]?.text.slice(-1) ?? "", r = t ? J(t) : !1;
				if (e && r) continue;
			}
			let x = !y, S = x ? r(t) : b;
			if (S > d && x) if (c > 0 && _(), l) {
				let e = o(t);
				for (let t = 0; t < e.length; t++) {
					let n = e[t].token, r = e[t].style, o = Gi(n, l, a, i);
					for (let e of o) {
						let t = m(e, r);
						t + c > d && _(), !p || p.style !== r ? (g(), p = {
							text: e,
							style: r
						}) : p.text += e, c += t;
					}
				}
				t += e.length - 1;
			} else {
				let e = o(t);
				g(), h.push(e.map((e) => ({
					text: e.token,
					style: e.style
				}))), f = !1, t += e.length - 1;
			}
			else if (S + c > d && x) {
				if (J(n)) {
					f = !1;
					continue;
				}
				_(), p = {
					text: n,
					style: v
				}, c = b;
			} else if (y && !l) !p || p.style !== v ? (g(), p = {
				text: n,
				style: v
			}) : p.text += n, c += b;
			else {
				let e = J(n);
				if (c === 0 && e && !f) continue;
				!p || p.style !== v ? (g(), p = {
					text: n,
					style: v
				}) : p.text += n, c += b;
			}
		}
		if (g(), s.length > 0) {
			let e = s[s.length - 1];
			e.text = Y(e.text), e.text.length === 0 && s.pop();
		}
		(s.length > 0 || h.length === n) && h.push(s);
	}
	return h;
}
function Yi(e) {
	let t = [], n = !1;
	for (let r of e) {
		let e = Wi(r.text), i = !0;
		for (let a of e) {
			let e = J(a) || zi(a), o = i && n && !e;
			t.push({
				token: a,
				style: r.style,
				continuesFromPrevious: o
			}), n = !e, i = !1;
		}
	}
	return t;
}
//#endregion
//#region node_modules/pixi.js/lib/scene/text/canvas/utils/wordWrap.mjs
var Xi = { willReadFrequently: !0 };
function Zi(e, t, n, r, i) {
	let a = n[e];
	return typeof a != "number" && (a = i(e, t, r) + t, n[e] = a), a;
}
function Qi(e, t, n, r, i, a, o) {
	let s = n.getContext("2d", Xi);
	s.font = t._fontString;
	let c = 0, l = "", u = [], d = /* @__PURE__ */ Object.create(null), { letterSpacing: f, whiteSpace: p } = t, m = Hi(p), h = Ui(p), g = !m, _ = t.wordWrapWidth + f, v = Wi(e);
	for (let e = 0; e < v.length; e++) {
		let n = v[e];
		if (zi(n)) {
			if (!h) {
				u.push(Y(l)), g = !m, l = "", c = 0;
				continue;
			}
			n = " ";
		}
		if (m) {
			let e = J(n), t = J(l[l.length - 1]);
			if (e && t) continue;
		}
		let p = Zi(n, f, d, s, r);
		if (p > _) if (l !== "" && (u.push(Y(l)), l = "", c = 0), i(n, t.breakWords)) {
			let e = Gi(n, t.breakWords, o, a);
			for (let t of e) {
				let e = Zi(t, f, d, s, r);
				e + c > _ && (u.push(Y(l)), g = !1, l = "", c = 0), l += t, c += e;
			}
		} else l.length > 0 && (u.push(Y(l)), l = "", c = 0), u.push(Y(n)), g = !1, l = "", c = 0;
		else p + c > _ && (g = !1, u.push(Y(l)), l = "", c = 0), (l.length > 0 || !J(n) || g) && (l += n, c += p);
	}
	let y = Y(l);
	return y.length > 0 && u.push(y), u.join("\n");
}
//#endregion
//#region node_modules/pixi.js/lib/scene/text/canvas/CanvasTextMetrics.mjs
var $i = { willReadFrequently: !0 }, X = class e {
	static get experimentalLetterSpacingSupported() {
		let t = e._experimentalLetterSpacingSupported;
		if (t === void 0) {
			let n = w.get().getCanvasRenderingContext2D().prototype;
			t = e._experimentalLetterSpacingSupported = "letterSpacing" in n || "textLetterSpacing" in n;
		}
		return t;
	}
	constructor(e, t, n, r, i, a, o, s, c, l) {
		this.text = e, this.style = t, this.width = n, this.height = r, this.lines = i, this.lineWidths = a, this.lineHeight = o, this.maxLineWidth = s, this.fontProperties = c, l && (this.runsByLine = l.runsByLine, this.lineAscents = l.lineAscents, this.lineDescents = l.lineDescents, this.lineHeights = l.lineHeights, this.hasDropShadow = l.hasDropShadow);
	}
	static measureText(t = " ", n, r = e._canvas, i = n.wordWrap) {
		let a = `${t}-${n.styleKey}-wordWrap-${i}`;
		if (e._measurementCache.has(a)) return e._measurementCache.get(a);
		if (ki(n) && Ai(t)) {
			let r = qi(t, n, i, e._context, e._measureText, e._measureTextAdvance, e.measureFont, e.canBreakChars, e.wordWrapSplit), o = new e(t, n, r.width, r.height, r.lines, r.lineWidths, r.lineHeight, r.maxLineWidth, r.fontProperties, {
				runsByLine: r.runsByLine,
				lineAscents: r.lineAscents,
				lineDescents: r.lineDescents,
				lineHeights: r.lineHeights,
				hasDropShadow: r.hasDropShadow
			});
			return e._measurementCache.set(a, o), o;
		}
		let o = n._fontString, s = e.measureFont(o);
		s.fontSize === 0 && (s.fontSize = n.fontSize, s.ascent = n.fontSize, s.descent = 0);
		let c = e._context;
		c.font = o;
		let l = (i ? e._wordWrap(t, n, r) : t).split(Ri), u = Array(l.length), d = 0;
		for (let t = 0; t < l.length; t++) {
			let r = e._measureText(l[t], n.letterSpacing, c);
			u[t] = r, d = Math.max(d, r);
		}
		let f = n._stroke?.width ?? 0, p = n.lineHeight || s.fontSize, m = e._adjustWidthForStyle(d, n), h = Math.max(p, s.fontSize + f) + (l.length - 1) * (p + n.leading), g = e._adjustHeightForStyle(h, n), _ = new e(t, n, m, g, l, u, p + n.leading, d, s);
		return e._measurementCache.set(a, _), _;
	}
	static _adjustWidthForStyle(e, t) {
		let n = e + (t._stroke?.width || 0);
		return t.dropShadow && (n += t.dropShadow.distance), n;
	}
	static _adjustHeightForStyle(e, t) {
		let n = e;
		return t.dropShadow && (n += t.dropShadow.distance), n;
	}
	static _measureText(t, n, r) {
		let { metricWidth: i, metrics: a, letterSpacingVal: o } = e._measureTextCore(t, n, r), s = -(a.actualBoundingBoxLeft ?? 0), c = (a.actualBoundingBoxRight ?? 0) - s;
		return a.width > 0 && (c += o), Math.max(i, c);
	}
	static _measureTextAdvance(t, n, r) {
		return e._measureTextCore(t, n, r).metricWidth;
	}
	static _measureTextCore(t, n, r) {
		let i = !1;
		e.experimentalLetterSpacingSupported && (e.experimentalLetterSpacing ? (r.letterSpacing = `${n}px`, r.textLetterSpacing = `${n}px`, i = !0) : (r.letterSpacing = "0px", r.textLetterSpacing = "0px"));
		let a = r.measureText(t), o = a.width, s = 0;
		return o > 0 && (s = i ? -n : (e.graphemeSegmenter(t).length - 1) * n, o += s), {
			metricWidth: o,
			metrics: a,
			letterSpacingVal: s
		};
	}
	static _wordWrap(t, n, r = e._canvas) {
		return Qi(t, n, r, e._measureTextAdvance, e.canBreakWords, e.canBreakChars, e.wordWrapSplit);
	}
	static isBreakingSpace(e, t) {
		return J(e, t);
	}
	static canBreakWords(e, t) {
		return t;
	}
	static canBreakChars(e, t, n, r, i) {
		return !0;
	}
	static wordWrapSplit(t) {
		return e.graphemeSegmenter(t);
	}
	static measureFont(t) {
		if (e._fonts[t]) return e._fonts[t];
		let n = e._context;
		n.font = t;
		let r = n.measureText(e.METRICS_STRING + e.BASELINE_SYMBOL), i = r.actualBoundingBoxAscent ?? 0, a = r.actualBoundingBoxDescent ?? 0, o = {
			ascent: i,
			descent: a,
			fontSize: i + a
		};
		return e._fonts[t] = o, o;
	}
	static clearMetrics(t = "") {
		t ? delete e._fonts[t] : e._fonts = {};
	}
	static get _canvas() {
		if (!e.__canvas) {
			let t;
			try {
				let n = new OffscreenCanvas(0, 0);
				if (n.getContext("2d", $i)?.measureText) return e.__canvas = n, n;
				t = w.get().createCanvas();
			} catch {
				t = w.get().createCanvas();
			}
			t.width = t.height = 10, e.__canvas = t;
		}
		return e.__canvas;
	}
	static get _context() {
		return e.__context ||= e._canvas.getContext("2d", $i), e.__context;
	}
};
X.METRICS_STRING = "|ÉqÅ", X.BASELINE_SYMBOL = "M", X.BASELINE_MULTIPLIER = 1.4, X.HEIGHT_MULTIPLIER = 2, X.graphemeSegmenter = (() => {
	if (typeof Intl?.Segmenter == "function") {
		let e = new Intl.Segmenter();
		return (t) => {
			let n = e.segment(t), r = [], i = 0;
			for (let e of n) r[i++] = e.segment;
			return r;
		};
	}
	return (e) => [...e];
})(), X.experimentalLetterSpacing = !1, X._fonts = {}, X._measurementCache = Oi(1e3);
var ea = X, ta = [
	"serif",
	"sans-serif",
	"monospace",
	"cursive",
	"fantasy",
	"system-ui"
];
function na(e) {
	let t = typeof e.fontSize == "number" ? `${e.fontSize}px` : e.fontSize, n = e.fontFamily;
	Array.isArray(e.fontFamily) || (n = e.fontFamily.split(","));
	for (let e = n.length - 1; e >= 0; e--) {
		let t = n[e].trim();
		!/([\"\'])[^\'\"]+\1/.test(t) && !ta.includes(t) && (t = `"${t}"`), n[e] = t;
	}
	return `${e.fontStyle} ${e.fontVariant} ${e.fontWeight} ${t} ${n.join(",")}`;
}
//#endregion
//#region node_modules/pixi.js/lib/scene/text/TextStyle.mjs
var ra = class e extends f {
	constructor(t = {}) {
		super(), this.uid = l("textStyle"), this._tick = 0, this._cachedFontString = null, aa(t), t instanceof e && (t = t._toObject());
		let n = {
			...e.defaultTextStyle,
			...t
		};
		for (let e in n) {
			let t = e;
			this[t] = n[e];
		}
		this._tagStyles = t.tagStyles ?? void 0, this.update(), this._tick = 0;
	}
	get align() {
		return this._align;
	}
	set align(e) {
		this._align !== e && (this._align = e, this.update());
	}
	get breakWords() {
		return this._breakWords;
	}
	set breakWords(e) {
		this._breakWords !== e && (this._breakWords = e, this.update());
	}
	get dropShadow() {
		return this._dropShadow;
	}
	set dropShadow(t) {
		this._dropShadow !== t && (this._dropShadow = typeof t == "object" && t ? this._createProxy({
			...e.defaultDropShadow,
			...t
		}) : t ? this._createProxy({ ...e.defaultDropShadow }) : null, this.update());
	}
	get fontFamily() {
		return this._fontFamily;
	}
	set fontFamily(e) {
		this._fontFamily !== e && (this._fontFamily = e, this.update());
	}
	get fontSize() {
		return this._fontSize;
	}
	set fontSize(e) {
		this._fontSize !== e && (this._fontSize = typeof e == "string" ? parseInt(e, 10) : e, this.update());
	}
	get fontStyle() {
		return this._fontStyle;
	}
	set fontStyle(e) {
		this._fontStyle !== e && (this._fontStyle = e.toLowerCase(), this.update());
	}
	get fontVariant() {
		return this._fontVariant;
	}
	set fontVariant(e) {
		this._fontVariant !== e && (this._fontVariant = e, this.update());
	}
	get fontWeight() {
		return this._fontWeight;
	}
	set fontWeight(e) {
		this._fontWeight !== e && (this._fontWeight = e, this.update());
	}
	get leading() {
		return this._leading;
	}
	set leading(e) {
		this._leading !== e && (this._leading = e, this.update());
	}
	get letterSpacing() {
		return this._letterSpacing;
	}
	set letterSpacing(e) {
		this._letterSpacing !== e && (this._letterSpacing = e, this.update());
	}
	get lineHeight() {
		return this._lineHeight;
	}
	set lineHeight(e) {
		this._lineHeight !== e && (this._lineHeight = e, this.update());
	}
	get padding() {
		return this._padding;
	}
	set padding(e) {
		this._padding !== e && (this._padding = e, this.update());
	}
	get filters() {
		return this._filters;
	}
	set filters(e) {
		this._filters !== e && (this._filters = Object.freeze(e), this.update());
	}
	get trim() {
		return this._trim;
	}
	set trim(e) {
		this._trim !== e && (this._trim = e, this.update());
	}
	get textBaseline() {
		return this._textBaseline;
	}
	set textBaseline(e) {
		this._textBaseline !== e && (this._textBaseline = e, this.update());
	}
	get whiteSpace() {
		return this._whiteSpace;
	}
	set whiteSpace(e) {
		this._whiteSpace !== e && (this._whiteSpace = e, this.update());
	}
	get wordWrap() {
		return this._wordWrap;
	}
	set wordWrap(e) {
		this._wordWrap !== e && (this._wordWrap = e, this.update());
	}
	get wordWrapWidth() {
		return this._wordWrapWidth;
	}
	set wordWrapWidth(e) {
		this._wordWrapWidth !== e && (this._wordWrapWidth = e, this.update());
	}
	get fill() {
		return this._originalFill;
	}
	set fill(e) {
		e !== this._originalFill && (this._originalFill = e, this._isFillStyle(e) && (this._originalFill = this._createProxy({
			...z.defaultFillStyle,
			...e
		}, () => {
			this._fill = ve({ ...this._originalFill }, z.defaultFillStyle);
		})), this._fill = ve(e === 0 ? "black" : e, z.defaultFillStyle), this.update());
	}
	get stroke() {
		return this._originalStroke;
	}
	set stroke(e) {
		e !== this._originalStroke && (this._originalStroke = e, this._isFillStyle(e) && (this._originalStroke = this._createProxy({
			...z.defaultStrokeStyle,
			...e
		}, () => {
			this._stroke = be({ ...this._originalStroke }, z.defaultStrokeStyle);
		})), this._stroke = be(e, z.defaultStrokeStyle), this.update());
	}
	get tagStyles() {
		return this._tagStyles;
	}
	set tagStyles(e) {
		this._tagStyles !== e && (this._tagStyles = e ?? void 0, this.update());
	}
	update() {
		this._tick++, this._cachedFontString = null, this.emit("update", this);
	}
	reset() {
		let t = e.defaultTextStyle;
		for (let e in t) this[e] = t[e];
	}
	assign(e) {
		for (let t in e) {
			let n = t;
			this[n] = e[t];
		}
		return this;
	}
	get styleKey() {
		return `${this.uid}-${this._tick}`;
	}
	get _fontString() {
		return this._cachedFontString === null && (this._cachedFontString = na(this)), this._cachedFontString;
	}
	_toObject() {
		return {
			align: this.align,
			breakWords: this.breakWords,
			dropShadow: this._dropShadow ? { ...this._dropShadow } : null,
			fill: this._fill ? { ...this._fill } : void 0,
			fontFamily: this.fontFamily,
			fontSize: this.fontSize,
			fontStyle: this.fontStyle,
			fontVariant: this.fontVariant,
			fontWeight: this.fontWeight,
			leading: this.leading,
			letterSpacing: this.letterSpacing,
			lineHeight: this.lineHeight,
			padding: this.padding,
			stroke: this._stroke ? { ...this._stroke } : void 0,
			textBaseline: this.textBaseline,
			trim: this.trim,
			whiteSpace: this.whiteSpace,
			wordWrap: this.wordWrap,
			wordWrapWidth: this.wordWrapWidth,
			filters: this._filters ? [...this._filters] : void 0,
			tagStyles: this._tagStyles ? { ...this._tagStyles } : void 0
		};
	}
	clone() {
		return new e(this._toObject());
	}
	_getFinalPadding() {
		let e = 0;
		if (this._filters) for (let t = 0; t < this._filters.length; t++) e += this._filters[t].padding;
		return Math.max(this._padding, e);
	}
	destroy(e = !1) {
		if (this.removeAllListeners(), typeof e == "boolean" ? e : e?.texture) {
			let t = typeof e == "boolean" ? e : e?.textureSource;
			this._fill?.texture && this._fill.texture.destroy(t), this._originalFill?.texture && this._originalFill.texture.destroy(t), this._stroke?.texture && this._stroke.texture.destroy(t), this._originalStroke?.texture && this._originalStroke.texture.destroy(t);
		}
		this._fill = null, this._stroke = null, this.dropShadow = null, this._originalStroke = null, this._originalFill = null;
	}
	_createProxy(e, t) {
		return new Proxy(e, { set: (e, n, r) => e[n] === r || (e[n] = r, t?.(n, r), this.update(), !0) });
	}
	_isFillStyle(e) {
		return (e ?? null) !== null && !(c.isColorLike(e) || e instanceof _e || e instanceof he);
	}
};
ra.defaultDropShadow = {
	alpha: 1,
	angle: Math.PI / 6,
	blur: 0,
	color: "black",
	distance: 5
}, ra.defaultTextStyle = {
	align: "left",
	breakWords: !1,
	dropShadow: null,
	fill: "black",
	fontFamily: "Arial",
	fontSize: 26,
	fontStyle: "normal",
	fontVariant: "normal",
	fontWeight: "normal",
	leading: 0,
	letterSpacing: 0,
	lineHeight: 0,
	padding: 0,
	stroke: null,
	textBaseline: "alphabetic",
	trim: !1,
	whiteSpace: "pre",
	wordWrap: !1,
	wordWrapWidth: 100
};
var ia = ra;
function aa(e) {
	let t = e;
	if (typeof t.dropShadow == "boolean" && t.dropShadow) {
		let n = ia.defaultDropShadow;
		e.dropShadow = {
			alpha: t.dropShadowAlpha ?? n.alpha,
			angle: t.dropShadowAngle ?? n.angle,
			blur: t.dropShadowBlur ?? n.blur,
			color: t.dropShadowColor ?? n.color,
			distance: t.dropShadowDistance ?? n.distance
		};
	}
	if (t.strokeThickness !== void 0) {
		y(i, "strokeThickness is now a part of stroke");
		let n = t.stroke, r = {};
		if (c.isColorLike(n)) r.color = n;
		else if (n instanceof _e || n instanceof he) r.fill = n;
		else if (Object.hasOwnProperty.call(n, "color") || Object.hasOwnProperty.call(n, "fill")) r = n;
		else throw Error("Invalid stroke value.");
		e.stroke = {
			...r,
			width: t.strokeThickness
		};
	}
	if (Array.isArray(t.fillGradientStops)) {
		if (y(i, "gradient fill is now a fill pattern: `new FillGradient(...)`"), !Array.isArray(t.fill) || t.fill.length === 0) throw Error("Invalid fill value. Expected an array of colors for gradient fill.");
		t.fill.length !== t.fillGradientStops.length && d("The number of fill colors must match the number of fill gradient stops.");
		let n = new _e({
			start: {
				x: 0,
				y: 0
			},
			end: {
				x: 0,
				y: 1
			},
			textureSpace: "local"
		}), r = t.fillGradientStops.slice(), a = t.fill.map((e) => c.shared.setValue(e).toNumber());
		r.forEach((e, t) => {
			n.addColorStop(e, a[t]);
		}), e.fill = { fill: n };
	}
}
//#endregion
//#region node_modules/pixi.js/lib/scene/text/canvas/utils/getCanvasFillStyle.mjs
var oa = 1e5;
function sa(e, t, n, r = 0, i = 0, a = 0) {
	if (e.texture === x.WHITE && !e.fill) return c.shared.setValue(e.color).setAlpha(e.alpha ?? 1).toHexa();
	if (!e.fill) {
		let n = t.createPattern(e.texture.source.resource, "repeat"), r = e.matrix.copyTo(u.shared);
		return r.scale(e.texture.source.pixelWidth, e.texture.source.pixelHeight), n.setTransform(r), n;
	}
	if (e.fill instanceof he) {
		let n = e.fill, r = t.createPattern(n.texture.source.resource, "repeat");
		return L.applyPatternTransform(r, n.transform, !1), r;
	}
	if (e.fill instanceof _e) {
		let o = e.fill, s = o.type === "linear", l = o.textureSpace === "local", u = 1, d = 1;
		l && n && (u = n.width + r, d = n.height + r);
		let f, p = !1;
		if (s) {
			let { start: e, end: n } = o;
			f = t.createLinearGradient(e.x * u + i, e.y * d + a, n.x * u + i, n.y * d + a), p = Math.abs(n.x - e.x) < Math.abs((n.y - e.y) * .1);
		} else {
			let { center: e, innerRadius: n, outerCenter: r, outerRadius: s } = o;
			f = t.createRadialGradient(e.x * u + i, e.y * d + a, n * u, r.x * u + i, r.y * d + a, s * u);
		}
		if (p && l && n) {
			let e = n.lineHeight / d;
			for (let t = 0; t < n.lines.length; t++) {
				let i = (t * n.lineHeight + r / 2) / d;
				o.colorStops.forEach((t) => {
					let n = i + t.offset * e;
					n = Math.max(0, Math.min(1, n)), f.addColorStop(Math.floor(n * oa) / oa, c.shared.setValue(t.color).toHex());
				});
			}
		} else o.colorStops.forEach((e) => {
			f.addColorStop(e.offset, c.shared.setValue(e.color).toHex());
		});
		return f;
	}
	return d("FillStyle not recognised", e), "red";
}
//#endregion
//#region node_modules/pixi.js/lib/scene/text-bitmap/DynamicBitmapFont.mjs
var ca = class e extends Ei {
	constructor(t) {
		super(), this.resolution = 1, this.pages = [], this._padding = 0, this._measureCache = /* @__PURE__ */ Object.create(null), this._currentChars = [], this._currentX = 0, this._currentY = 0, this._currentMaxCharHeight = 0, this._currentPageIndex = -1, this._skipKerning = !1;
		let n = {
			...e.defaultOptions,
			...t
		};
		this._textureSize = n.textureSize, this._mipmap = n.mipmap;
		let r = n.style.clone();
		n.overrideFill && (r._fill.color = 16777215, r._fill.alpha = 1, r._fill.texture = x.WHITE, r._fill.fill = null), this.applyFillAsTint = n.overrideFill;
		let i = r.fontSize;
		r.fontSize = this.baseMeasurementFontSize;
		let a = na(r);
		n.overrideSize ? (r._stroke && (r._stroke.width *= this.baseRenderedFontSize / i), r.dropShadow && (r.dropShadow.blur *= this.baseRenderedFontSize / i, r.dropShadow.distance *= this.baseRenderedFontSize / i)) : r.fontSize = this.baseRenderedFontSize = i, this._style = r, this._skipKerning = n.skipKerning ?? !1, this.resolution = n.resolution ?? 1, this._padding = n.padding ?? 4, n.textureStyle && (this._textureStyle = n.textureStyle instanceof ne ? n.textureStyle : new ne(n.textureStyle)), this.fontMetrics = ea.measureFont(a), this.lineHeight = r.lineHeight || this.fontMetrics.fontSize || r.fontSize;
	}
	ensureCharacters(e) {
		let t = ea.graphemeSegmenter(e).filter((e) => !this._currentChars.includes(e)).filter((e, t, n) => n.indexOf(e) === t);
		if (!t.length) return;
		this._currentChars = [...this._currentChars, ...t];
		let n;
		n = this._currentPageIndex === -1 ? this._nextPage() : this.pages[this._currentPageIndex];
		let { canvas: r, context: i } = n.canvasAndContext, a = n.texture.source, o = this._style, s = this._currentX, c = this._currentY, l = this._currentMaxCharHeight, u = this.baseRenderedFontSize / this.baseMeasurementFontSize, d = (o.dropShadow?.distance ?? 0) + (o._stroke?.width ?? 0), f = this._padding + d, p = !1, h = r.width / this.resolution, g = r.height / this.resolution;
		for (let e = 0; e < t.length; e++) {
			let n = t[e], d = ea.measureText(n, o, r, !1);
			d.lineHeight = d.height;
			let _ = d.width * u, v = Math.ceil((o.fontStyle === "italic" ? 2 : 1) * _), y = d.height * u, b = v + f * 2, S = y + f * 2;
			if (p = !1, n !== "\n" && n !== "\r" && n !== "	" && n !== " " && (p = !0, l = Math.ceil(Math.max(S, l))), s + b > h && (c += l, l = S, s = 0, c + l > g)) {
				a.update();
				let e = this._nextPage();
				r = e.canvasAndContext.canvas, i = e.canvasAndContext.context, a = e.texture.source, s = 0, c = 0, l = 0;
			}
			let C = i.measureText(n).width / u;
			if (this.chars[n] = {
				id: n.codePointAt(0),
				xOffset: -(f / u),
				yOffset: -(f / u),
				xAdvance: C,
				kerning: {}
			}, p) {
				this._drawGlyph(i, d, s + f, c + f, u, o);
				let e = a.width * u, t = a.height * u, r = new m(s / e * a.width, c / t * a.height, b / e * a.width, S / t * a.height);
				this.chars[n].texture = new x({
					source: a,
					frame: r
				}), s += Math.ceil(b);
			}
		}
		a.update(), this._currentX = s, this._currentY = c, this._currentMaxCharHeight = l, this._skipKerning || this._applyKerning(t, i, u);
	}
	get pageTextures() {
		return y(i, "BitmapFont.pageTextures is deprecated, please use BitmapFont.pages instead."), this.pages;
	}
	_applyKerning(e, t, n) {
		let r = this._measureCache;
		for (let i = 0; i < e.length; i++) {
			let a = e[i];
			for (let e = 0; e < this._currentChars.length; e++) {
				let i = this._currentChars[e], o = r[a];
				o ||= r[a] = t.measureText(a).width;
				let s = r[i];
				s ||= r[i] = t.measureText(i).width;
				let c = t.measureText(a + i).width, l = c - (o + s);
				l && this.chars[a] && (this.chars[a].kerning[i] = l / n), c = t.measureText(a + i).width, l = c - (o + s), l && this.chars[i] && (this.chars[i].kerning[a] = l / n);
			}
		}
	}
	_nextPage() {
		this._currentPageIndex++;
		let e = this.resolution, t = R.getOptimalCanvasAndContext(this._textureSize, this._textureSize, e);
		this._setupContext(t.context, this._style, e);
		let n = e * (this.baseRenderedFontSize / this.baseMeasurementFontSize), r = new x({ source: new I({
			resource: t.canvas,
			resolution: n,
			alphaMode: "premultiply-alpha-on-upload",
			autoGenerateMipmaps: this._mipmap
		}) });
		this._textureStyle && (r.source.style = this._textureStyle);
		let i = {
			canvasAndContext: t,
			texture: r
		};
		return this.pages[this._currentPageIndex] = i, i;
	}
	_setupContext(e, t, n) {
		t.fontSize = this.baseRenderedFontSize, e.scale(n, n), e.font = na(t), t.fontSize = this.baseMeasurementFontSize, e.textBaseline = t.textBaseline;
		let r = t._stroke, i = r?.width ?? 0;
		if (r && (e.lineWidth = i, e.lineJoin = r.join, e.miterLimit = r.miterLimit, e.strokeStyle = sa(r, e)), t._fill && (e.fillStyle = sa(t._fill, e)), t.dropShadow) {
			let r = t.dropShadow, i = c.shared.setValue(r.color).toArray(), a = r.blur * n, o = r.distance * n;
			e.shadowColor = `rgba(${i[0] * 255},${i[1] * 255},${i[2] * 255},${r.alpha})`, e.shadowBlur = a, e.shadowOffsetX = Math.cos(r.angle) * o, e.shadowOffsetY = Math.sin(r.angle) * o;
		} else e.shadowColor = "black", e.shadowBlur = 0, e.shadowOffsetX = 0, e.shadowOffsetY = 0;
	}
	_drawGlyph(e, t, n, r, i, a) {
		let o = t.text, s = t.fontProperties, c = (a._stroke?.width ?? 0) * i, l = n + c / 2, u = r - c / 2, d = s.descent * i, f = t.lineHeight * i, p = !1;
		a.stroke && c && (p = !0, e.strokeText(o, l, u + f - d));
		let { shadowBlur: m, shadowOffsetX: h, shadowOffsetY: g } = e;
		a._fill && (p && (e.shadowBlur = 0, e.shadowOffsetX = 0, e.shadowOffsetY = 0), e.fillText(o, l, u + f - d)), p && (e.shadowBlur = m, e.shadowOffsetX = h, e.shadowOffsetY = g);
	}
	destroy() {
		super.destroy();
		for (let e = 0; e < this.pages.length; e++) {
			let { canvasAndContext: t, texture: n } = this.pages[e];
			R.returnCanvasAndContext(t), n.destroy(!0);
		}
		this.pages = null;
	}
};
ca.defaultOptions = {
	textureSize: 512,
	style: new ia(),
	mipmap: !0
};
var la = ca;
//#endregion
//#region node_modules/pixi.js/lib/scene/text-bitmap/utils/getBitmapTextLayout.mjs
function ua(e, t, n, r) {
	let i = {
		width: 0,
		height: 0,
		offsetY: 0,
		scale: t.fontSize / n.baseMeasurementFontSize,
		lines: [{
			width: 0,
			charPositions: [],
			spaceWidth: 0,
			spacesIndex: [],
			chars: []
		}]
	};
	i.offsetY = n.baseLineOffset;
	let a = i.lines[0], o = null, s = !0, c = {
		spaceWord: !1,
		width: 0,
		start: 0,
		index: 0,
		positions: [],
		chars: []
	}, l = n.baseMeasurementFontSize / t.fontSize, u = t.letterSpacing * l, d = t.wordWrapWidth * l, f = t.lineHeight ? t.lineHeight * l : n.lineHeight, p = t.wordWrap && t.breakWords, m = Hi(t.whiteSpace), h = Ui(t.whiteSpace);
	if (m || h) {
		let t = [], n = m;
		for (let r = 0; r < e.length; r++) {
			let i = e[r];
			if (i === "\r" || i === "\n") if (h) i === "\r" && e[r + 1] === "\n" && r++, i = " ";
			else {
				m && (n = !0), t.push(i);
				continue;
			}
			if (J(i)) if (m && Bi(i)) {
				if (n) continue;
				n = !0, t.push(" ");
			} else n = !1, t.push(i);
			else n = !1, t.push(i);
		}
		e = t;
	}
	let g = (e) => {
		let t = a.width;
		for (let n = 0; n < c.index; n++) {
			let r = e.positions[n];
			a.chars.push(e.chars[n]), a.charPositions.push(r + t);
		}
		a.width += e.width, (c.index > 0 || !m) && (s = !1), c.width = 0, c.index = 0, c.chars.length = 0;
	}, _ = () => {
		let e = a.chars.length - 1;
		if (r) {
			let t = a.chars[e];
			for (; Bi(t);) a.width -= n.chars[t].xAdvance, a.spacesIndex.pop(), t = a.chars[--e];
		}
		i.width = Math.max(i.width, a.width), a = {
			width: 0,
			charPositions: [],
			chars: [],
			spaceWidth: 0,
			spacesIndex: []
		}, s = !0, i.lines.push(a), i.height += f;
	}, v = (e) => e - u > d;
	for (let r = 0; r < e.length + 1; r++) {
		let i, l = r === e.length;
		l || (i = e[r]);
		let d = n.chars[i];
		if (/(?:\s)/.test(i) || i === "\r" || i === "\n" || l) {
			if (!s && t.wordWrap && v(a.width + c.width) ? (_(), g(c), !l && d && a.charPositions.push(0)) : (c.start = a.width, g(c), !l && d && a.charPositions.push(0)), i === "\r" || i === "\n") _();
			else if (!l && d) {
				let e = d.xAdvance + (d.kerning?.[o] || 0) + u;
				a.width += e, a.spaceWidth = e, a.spacesIndex.push(a.charPositions.length), a.chars.push(i);
			}
		} else if (d) {
			let e = d.kerning?.[o] || 0, n = d.xAdvance + e + u;
			p && v(c.width + n) && (s || _(), g(c), _()), c.positions[c.index++] = c.width + e, c.chars.push(i), c.width += n, Vi(i) && (!s && t.wordWrap && v(a.width + c.width) && _(), g(c));
		}
		o = i;
	}
	return _(), t.align === "center" ? da(i) : t.align === "right" ? fa(i) : t.align === "justify" && pa(i), i;
}
function da(e) {
	for (let t = 0; t < e.lines.length; t++) {
		let n = e.lines[t], r = e.width / 2 - n.width / 2;
		for (let e = 0; e < n.charPositions.length; e++) n.charPositions[e] += r;
	}
}
function fa(e) {
	for (let t = 0; t < e.lines.length; t++) {
		let n = e.lines[t], r = e.width - n.width;
		for (let e = 0; e < n.charPositions.length; e++) n.charPositions[e] += r;
	}
}
function pa(e) {
	let t = e.width;
	for (let n = 0; n < e.lines.length - 2; n++) {
		let r = e.lines[n], i = 0, a = r.spacesIndex[i++], o = 0, s = r.spacesIndex.length, c = (t - r.width) / s;
		for (let e = 0; e < r.charPositions.length; e++) e === a && (a = r.spacesIndex[i++], o += c), r.charPositions[e] += o;
	}
}
//#endregion
//#region node_modules/pixi.js/lib/scene/text-bitmap/utils/resolveCharacters.mjs
function ma(e) {
	if (e === "") return [];
	typeof e == "string" && (e = [e]);
	let t = [];
	for (let n = 0, r = e.length; n < r; n++) {
		let r = e[n];
		if (Array.isArray(r)) {
			if (r.length !== 2) throw Error(`[BitmapFont]: Invalid character range length, expecting 2 got ${r.length}.`);
			if (r[0].length === 0 || r[1].length === 0) throw Error("[BitmapFont]: Invalid character delimiter.");
			let e = r[0].charCodeAt(0), n = r[1].charCodeAt(0);
			if (n < e) throw Error("[BitmapFont]: Invalid character range.");
			for (let r = e, i = n; r <= i; r++) t.push(String.fromCharCode(r));
		} else t.push(...Array.from(r));
	}
	if (t.length === 0) throw Error("[BitmapFont]: Empty set when resolving characters.");
	return t;
}
//#endregion
//#region node_modules/pixi.js/lib/scene/text-bitmap/BitmapFontManager.mjs
var ha = 0, ga = new class {
	constructor() {
		this.ALPHA = [
			["a", "z"],
			["A", "Z"],
			" "
		], this.NUMERIC = [["0", "9"]], this.ALPHANUMERIC = [
			["a", "z"],
			["A", "Z"],
			["0", "9"],
			" "
		], this.ASCII = [[" ", "~"]], this.defaultOptions = {
			chars: this.ALPHANUMERIC,
			resolution: 1,
			padding: 4,
			skipKerning: !1,
			textureStyle: null
		}, this.measureCache = Oi(1e3);
	}
	getFont(e, t) {
		let n = `${t.fontFamily}-bitmap`, r = !0;
		if (F.has(n)) {
			let t = F.get(n);
			return t.ensureCharacters?.(e), t;
		}
		if (t._fill.fill && !t._stroke ? (n += t._fill.fill.styleKey, r = !1) : (t._stroke || t.dropShadow) && (n = `${t.styleKey}-bitmap`, r = !1), n += `-${t.fontStyle}`, n += `-${t.fontVariant}`, n += `-${t.fontWeight}`, !F.has(n)) {
			let e = Object.create(t);
			e._lineHeight = 0;
			let i = new la({
				style: e,
				overrideFill: r,
				overrideSize: !0,
				...this.defaultOptions
			});
			ha++, ha > 50 && d("BitmapText", `You have dynamically created ${ha} bitmap fonts, this can be inefficient. Try pre installing your font styles using \`BitmapFont.install({name:"style1", style})\``), i.once("destroy", () => {
				ha--, F.remove(n);
			}), F.set(n, i);
		}
		let i = F.get(n);
		return i.ensureCharacters?.(e), i;
	}
	getLayout(e, t, n = !0) {
		let r = this.getFont(e, t), i = `${e}-${t.styleKey}-${n}`;
		if (this.measureCache.has(i)) return this.measureCache.get(i);
		let a = ua(ea.graphemeSegmenter(e), t, r, n);
		return this.measureCache.set(i, a), a;
	}
	measureText(e, t, n = !0) {
		return this.getLayout(e, t, n);
	}
	install(...e) {
		let t = e[0];
		typeof t == "string" && (t = {
			name: t,
			style: e[1],
			chars: e[2]?.chars,
			resolution: e[2]?.resolution,
			padding: e[2]?.padding,
			skipKerning: e[2]?.skipKerning
		}, y(i, "BitmapFontManager.install(name, style, options) is deprecated, use BitmapFontManager.install({name, style, ...options})"));
		let n = t?.name;
		if (!n) throw Error("[BitmapFontManager] Property `name` is required.");
		t = {
			...this.defaultOptions,
			...t
		};
		let r = t.style, a = r instanceof ia ? r : new ia(r), o = new la({
			style: a,
			overrideFill: t.dynamicFill ?? this._canUseTintForStyle(a),
			skipKerning: t.skipKerning,
			padding: t.padding,
			resolution: t.resolution,
			overrideSize: !1,
			textureStyle: t.textureStyle
		}), s = ma(t.chars);
		return o.ensureCharacters(s.join("")), F.set(`${n}-bitmap`, o), o.once("destroy", () => F.remove(`${n}-bitmap`)), o;
	}
	uninstall(e) {
		let t = `${e}-bitmap`, n = F.get(t);
		n && n.destroy();
	}
	_canUseTintForStyle(e) {
		return !e._stroke && (!e.dropShadow || e.dropShadow.color === 0) && !e._fill.fill && e._fill.color === 16777215;
	}
}(), _a = class extends Ei {
	constructor(e, t) {
		super();
		let { textures: n, data: r } = e;
		Object.keys(r.pages).forEach((e) => {
			let t = r.pages[parseInt(e, 10)], i = n[t.id];
			this.pages.push({ texture: i });
		}), Object.keys(r.chars).forEach((e) => {
			let t = r.chars[e], { frame: i, source: a, rotate: o } = n[t.page], s = h.transformRectCoords(t, i, o, new m()), c = new x({
				frame: s,
				orig: new m(0, 0, t.width, t.height),
				source: a,
				rotate: o
			});
			this.chars[e] = {
				id: e.codePointAt(0),
				xOffset: t.xOffset,
				yOffset: t.yOffset,
				xAdvance: t.xAdvance,
				kerning: t.kerning ?? {},
				texture: c
			};
		}), this.baseRenderedFontSize = r.fontSize, this.baseMeasurementFontSize = r.fontSize, this.fontMetrics = {
			ascent: 0,
			descent: 0,
			fontSize: r.fontSize
		}, this.baseLineOffset = r.baseLineOffset, this.lineHeight = r.lineHeight, this.fontFamily = r.fontFamily, this.distanceField = r.distanceField ?? {
			type: "none",
			range: 0
		}, this.url = t;
	}
	destroy() {
		super.destroy();
		for (let e = 0; e < this.pages.length; e++) {
			let { texture: t } = this.pages[e];
			t.destroy(!0);
		}
		this.pages = null;
	}
	static install(e) {
		ga.install(e);
	}
	static uninstall(e) {
		ga.uninstall(e);
	}
};
//#endregion
//#region src/app/pixelOffice/game/activityIntent.ts
function va(e) {
	let t = "idle";
	return e.kind === "error" ? t = "error" : e.kind === "complete" ? t = "complete" : e.working && (t = e.kind === "generic_work" ? "waiting" : "working"), {
		destination: e.anchor,
		arrivalPhase: t,
		label: e.label,
		jobId: e.jobId
	};
}
//#endregion
//#region src/app/pixelOffice/game/classicScene.ts
var ya = {
	version: 1,
	sceneId: "classic_analyst",
	logicalSize: {
		width: 560,
		height: 315
	},
	tileSize: 16,
	spawnNode: "agent_seat",
	routeNodes: {
		news_desk: {
			x: 230,
			y: 224
		},
		market_board: {
			x: 408,
			y: 130
		},
		research_desk: {
			x: 340,
			y: 172
		},
		report_shelf: {
			x: 494,
			y: 149
		},
		memo_board: {
			x: 48,
			y: 235
		},
		portfolio_monitor: {
			x: 216,
			y: 247
		},
		agent_seat: {
			x: 428,
			y: 258
		},
		room_hub: {
			x: 224,
			y: 236
		},
		north_hub: {
			x: 344,
			y: 152
		},
		south_hub: {
			x: 332,
			y: 236
		}
	},
	routeEdges: [
		["room_hub", "south_hub"],
		["south_hub", "north_hub"],
		["research_desk", "north_hub"],
		["agent_seat", "south_hub"],
		["news_desk", "room_hub"],
		["memo_board", "room_hub"],
		["report_shelf", "north_hub"],
		["market_board", "north_hub"],
		["portfolio_monitor", "room_hub"]
	],
	anchors: [
		{
			id: "news_desk",
			position: {
				x: 230,
				y: 224
			},
			hitArea: {
				x: 176,
				y: 84,
				width: 109,
				height: 128
			},
			collisionBounds: {
				x: 176,
				y: 154,
				width: 109,
				height: 58
			},
			occlusionBounds: {
				x: 176,
				y: 84,
				width: 109,
				height: 128
			},
			labelPlacement: "below"
		},
		{
			id: "market_board",
			position: {
				x: 408,
				y: 130
			},
			hitArea: {
				x: 330,
				y: 8,
				width: 158,
				height: 110
			},
			collisionBounds: {
				x: 330,
				y: 110,
				width: 158,
				height: 8
			},
			occlusionBounds: {
				x: 330,
				y: 8,
				width: 158,
				height: 110
			},
			labelPlacement: "below"
		},
		{
			id: "research_desk",
			position: {
				x: 340,
				y: 172
			},
			hitArea: {
				x: 352,
				y: 92,
				width: 144,
				height: 146
			},
			collisionBounds: {
				x: 352,
				y: 172,
				width: 144,
				height: 66
			},
			occlusionBounds: {
				x: 352,
				y: 92,
				width: 144,
				height: 146
			},
			labelPlacement: "above"
		},
		{
			id: "report_shelf",
			position: {
				x: 494,
				y: 149
			},
			hitArea: {
				x: 506,
				y: 58,
				width: 48,
				height: 167
			},
			collisionBounds: {
				x: 506,
				y: 149,
				width: 48,
				height: 76
			},
			occlusionBounds: {
				x: 506,
				y: 58,
				width: 48,
				height: 167
			},
			labelPlacement: "above"
		},
		{
			id: "memo_board",
			position: {
				x: 48,
				y: 235
			},
			hitArea: {
				x: 18,
				y: 118,
				width: 65,
				height: 105
			},
			collisionBounds: {
				x: 18,
				y: 215,
				width: 65,
				height: 8
			},
			occlusionBounds: {
				x: 18,
				y: 118,
				width: 65,
				height: 105
			},
			labelPlacement: "below"
		},
		{
			id: "portfolio_monitor",
			position: {
				x: 216,
				y: 247
			},
			hitArea: {
				x: 16,
				y: 168,
				width: 188,
				height: 145
			},
			collisionBounds: {
				x: 16,
				y: 247,
				width: 188,
				height: 66
			},
			occlusionBounds: {
				x: 16,
				y: 168,
				width: 188,
				height: 145
			},
			labelPlacement: "above"
		},
		{
			id: "agent_seat",
			position: {
				x: 428,
				y: 258
			},
			hitArea: {
				x: 372,
				y: 210,
				width: 184,
				height: 95
			},
			collisionBounds: {
				x: 440,
				y: 210,
				width: 100,
				height: 92
			},
			occlusionBounds: {
				x: 372,
				y: 210,
				width: 184,
				height: 95
			},
			labelPlacement: "above"
		}
	]
}, ba = {
	extension: {
		type: O.Environment,
		name: "browser",
		priority: -1
	},
	test: () => !0,
	load: async () => {
		await import("./browserAll-DvwFVJPo.js");
	}
}, xa = {
	extension: {
		type: O.Environment,
		name: "webworker",
		priority: 0
	},
	test: () => typeof self < "u" && self.WorkerGlobalScope !== void 0,
	load: async () => {
		await import("./webworkerAll-mI4eaArJ.js");
	}
}, Sa;
function Ca(e) {
	return Sa === void 0 && (Sa = (() => {
		let t = {
			stencil: !0,
			failIfMajorPerformanceCaveat: e ?? Ce.defaultOptions.failIfMajorPerformanceCaveat
		};
		try {
			if (!w.get().getWebGLRenderingContext()) return !1;
			let e = w.get().createCanvas().getContext("webgl", t), n = !!e?.getContextAttributes()?.stencil;
			if (e) {
				let t = e.getExtension("WEBGL_lose_context");
				t && t.loseContext();
			}
			return e = null, n;
		} catch {
			return !1;
		}
	})()), Sa;
}
//#endregion
//#region node_modules/pixi.js/lib/utils/browser/isWebGPUSupported.mjs
var wa;
async function Ta(e = {}) {
	return wa === void 0 && (wa = await (async () => {
		let t = w.get().getNavigator().gpu;
		if (!t) return !1;
		try {
			return await (await t.requestAdapter(e)).requestDevice(), !0;
		} catch {
			return !1;
		}
	})()), wa;
}
//#endregion
//#region node_modules/pixi.js/lib/rendering/renderers/autoDetectRenderer.mjs
var Ea = [
	"webgl",
	"webgpu",
	"canvas"
];
async function Da(e) {
	let t = [];
	e.preference ? Array.isArray(e.preference) ? t = e.preference.slice() : (t.push(e.preference), Ea.forEach((n) => {
		n !== e.preference && t.push(n);
	})) : t = Ea.slice();
	let n, r = {};
	for (let i = 0; i < t.length; i++) {
		let a = t[i];
		if (a === "webgpu" && await Ta()) {
			let { WebGPURenderer: t } = await import("./WebGPURenderer-CygEuuls.js");
			n = t, r = {
				...e,
				...e.webgpu
			};
			break;
		}
		if (a === "webgl" && Ca(e.failIfMajorPerformanceCaveat ?? Ce.defaultOptions.failIfMajorPerformanceCaveat)) {
			let { WebGLRenderer: t } = await import("./WebGLRenderer-DSjaLUFa.js");
			n = t, r = {
				...e,
				...e.webgl
			};
			break;
		}
		if (a === "canvas") {
			let { CanvasRenderer: t } = await import("./CanvasRenderer-BAjnNApT.js");
			n = t, r = {
				...e,
				...e.canvasOptions
			};
			break;
		}
	}
	if (delete r.webgpu, delete r.webgl, delete r.canvasOptions, !n) throw Error("No available renderer for the current environment");
	let i = new n();
	return await i.init(r), i;
}
//#endregion
//#region node_modules/pixi.js/lib/app/ResizePlugin.mjs
var Oa = class {
	static init(e) {
		Object.defineProperty(this, "resizeTo", {
			configurable: !0,
			set(e) {
				globalThis.removeEventListener("resize", this.queueResize), this._resizeTo = e, e && (globalThis.addEventListener("resize", this.queueResize), this.resize());
			},
			get() {
				return this._resizeTo;
			}
		}), this.queueResize = () => {
			this._resizeTo && (this._cancelResize(), this._resizeId = requestAnimationFrame(() => this.resize()));
		}, this._cancelResize = () => {
			this._resizeId &&= (cancelAnimationFrame(this._resizeId), null);
		}, this.resize = () => {
			if (!this._resizeTo) return;
			this._cancelResize();
			let e, t;
			if (this._resizeTo === globalThis.window) e = globalThis.innerWidth, t = globalThis.innerHeight;
			else {
				let { clientWidth: n, clientHeight: r } = this._resizeTo;
				e = n, t = r;
			}
			this.renderer.resize(e, t), this.render();
		}, this._resizeId = null, this._resizeTo = null, this.resizeTo = e.resizeTo || null;
	}
	static destroy() {
		globalThis.removeEventListener("resize", this.queueResize), this._cancelResize(), this._cancelResize = null, this.queueResize = null, this.resizeTo = null, this.resize = null;
	}
};
Oa.extension = O.Application;
//#endregion
//#region node_modules/pixi.js/lib/app/TickerPlugin.mjs
var ka = class {
	static init(e) {
		e = Object.assign({
			autoStart: !0,
			sharedTicker: !1
		}, e), Object.defineProperty(this, "ticker", {
			configurable: !0,
			set(e) {
				this._ticker && this._ticker.remove(this.render, this), this._ticker = e, e && e.add(this.render, this, ce.LOW);
			},
			get() {
				return this._ticker;
			}
		}), this.stop = () => {
			this._ticker.stop();
		}, this.start = () => {
			this._ticker.start();
		}, this._ticker = null, this.ticker = e.sharedTicker ? se.shared : new se(), e.autoStart && this.start();
	}
	static destroy() {
		if (this._ticker) {
			let e = this._ticker;
			this.ticker = null, e.destroy();
		}
	}
};
ka.extension = O.Application, a.add(Oa), a.add(ka);
//#endregion
//#region node_modules/pixi.js/lib/app/Application.mjs
var Aa = class e {
	constructor(...e) {
		this.stage = new ie(), e[0] !== void 0 && y(i, "Application constructor options are deprecated, please use Application.init() instead.");
	}
	async init(t) {
		t = { ...t }, this.stage ||= new ie(), this.renderer = await Da(t), e._plugins.forEach((e) => {
			e.init.call(this, t);
		});
	}
	render() {
		this.renderer.render({ container: this.stage });
	}
	get canvas() {
		return this.renderer.canvas;
	}
	get view() {
		return y(i, "Application.view is deprecated, please use Application.canvas instead."), this.renderer.canvas;
	}
	get screen() {
		return this.renderer.screen;
	}
	get domContainerRoot() {
		return this.renderer.renderPipes.dom?._domElement;
	}
	destroy(t = !1, n = !1) {
		let r = e._plugins.slice(0);
		r.reverse(), r.forEach((e) => {
			e.destroy.call(this);
		}), this.stage.destroy(n), this.stage = null, this.renderer.destroy(t), this.renderer = null;
	}
};
Aa._plugins = [];
var ja = Aa;
a.handleByList(O.Application, ja._plugins), a.add(De);
//#endregion
//#region node_modules/pixi.js/lib/scene/text-bitmap/asset/bitmapFontTextParser.mjs
var Ma = {
	test(e) {
		return typeof e == "string" && e.startsWith("info face=");
	},
	parse(e) {
		let t = e.match(/^[a-z]+\s+.+$/gm), n = {
			info: [],
			common: [],
			page: [],
			char: [],
			chars: [],
			kerning: [],
			kernings: [],
			distanceField: []
		};
		for (let e in t) {
			let r = t[e].match(/^[a-z]+/gm)[0], i = t[e].match(/[a-zA-Z]+=([^\s"']+|"([^"]*)")/gm), a = {};
			for (let e in i) {
				let t = i[e].split("="), n = t[0], r = t[1].replace(/"/gm, ""), o = parseFloat(r);
				a[n] = isNaN(o) ? r : o;
			}
			n[r].push(a);
		}
		let r = {
			chars: {},
			pages: [],
			lineHeight: 0,
			fontSize: 0,
			fontFamily: "",
			distanceField: null,
			baseLineOffset: 0
		}, [i] = n.info, [a] = n.common, [o] = n.distanceField ?? [];
		o && (r.distanceField = {
			range: parseInt(o.distanceRange, 10),
			type: o.fieldType
		}), r.fontSize = parseInt(i.size, 10), r.fontFamily = i.face, r.lineHeight = parseInt(a.lineHeight, 10);
		let s = n.page;
		for (let e = 0; e < s.length; e++) r.pages.push({
			id: parseInt(s[e].id, 10) || 0,
			file: s[e].file
		});
		let c = {};
		r.baseLineOffset = r.lineHeight - parseInt(a.base, 10);
		let l = n.char;
		for (let e = 0; e < l.length; e++) {
			let t = l[e], n = parseInt(t.id, 10), i = t.letter ?? t.char ?? String.fromCharCode(n);
			i === "space" && (i = " "), c[n] = i, r.chars[i] = {
				id: n,
				page: parseInt(t.page, 10) || 0,
				x: parseInt(t.x, 10),
				y: parseInt(t.y, 10),
				width: parseInt(t.width, 10),
				height: parseInt(t.height, 10),
				xOffset: parseInt(t.xoffset, 10),
				yOffset: parseInt(t.yoffset, 10),
				xAdvance: parseInt(t.xadvance, 10),
				kerning: {}
			};
		}
		let u = n.kerning || [];
		for (let e = 0; e < u.length; e++) {
			let t = parseInt(u[e].first, 10), n = parseInt(u[e].second, 10), i = parseInt(u[e].amount, 10);
			r.chars[c[n]] && (r.chars[c[n]].kerning[c[t]] = i);
		}
		return r;
	}
}, Na = {
	test(e) {
		let t = e;
		return typeof t != "string" && "getElementsByTagName" in t && t.getElementsByTagName("page").length && t.getElementsByTagName("info")[0].getAttribute("face") !== null;
	},
	parse(e) {
		let t = {
			chars: {},
			pages: [],
			lineHeight: 0,
			fontSize: 0,
			fontFamily: "",
			distanceField: null,
			baseLineOffset: 0
		}, n = e.getElementsByTagName("info")[0], r = e.getElementsByTagName("common")[0], i = e.getElementsByTagName("distanceField")[0];
		i && (t.distanceField = {
			type: i.getAttribute("fieldType"),
			range: parseInt(i.getAttribute("distanceRange"), 10)
		});
		let a = e.getElementsByTagName("page"), o = e.getElementsByTagName("char"), s = e.getElementsByTagName("kerning");
		t.fontSize = parseInt(n.getAttribute("size"), 10), t.fontFamily = n.getAttribute("face"), t.lineHeight = parseInt(r.getAttribute("lineHeight"), 10);
		for (let e = 0; e < a.length; e++) t.pages.push({
			id: parseInt(a[e].getAttribute("id"), 10) || 0,
			file: a[e].getAttribute("file")
		});
		let c = {};
		t.baseLineOffset = t.lineHeight - parseInt(r.getAttribute("base"), 10);
		for (let e = 0; e < o.length; e++) {
			let n = o[e], r = parseInt(n.getAttribute("id"), 10), i = n.getAttribute("letter") ?? n.getAttribute("char") ?? String.fromCharCode(r);
			i === "space" && (i = " "), c[r] = i, t.chars[i] = {
				id: r,
				page: parseInt(n.getAttribute("page"), 10) || 0,
				x: parseInt(n.getAttribute("x"), 10),
				y: parseInt(n.getAttribute("y"), 10),
				width: parseInt(n.getAttribute("width"), 10),
				height: parseInt(n.getAttribute("height"), 10),
				xOffset: parseInt(n.getAttribute("xoffset"), 10),
				yOffset: parseInt(n.getAttribute("yoffset"), 10),
				xAdvance: parseInt(n.getAttribute("xadvance"), 10),
				kerning: {}
			};
		}
		for (let e = 0; e < s.length; e++) {
			let n = parseInt(s[e].getAttribute("first"), 10), r = parseInt(s[e].getAttribute("second"), 10), i = parseInt(s[e].getAttribute("amount"), 10);
			t.chars[c[r]] && (t.chars[c[r]].kerning[c[n]] = i);
		}
		return t;
	}
}, Pa = {
	test(e) {
		return typeof e == "string" && e.match(/<font(\s|>)/) ? Na.test(w.get().parseXML(e)) : !1;
	},
	parse(e) {
		return Na.parse(w.get().parseXML(e));
	}
}, Fa = [".xml", ".fnt"], Ia = {
	extension: {
		type: O.CacheParser,
		name: "cacheBitmapFont"
	},
	test: (e) => !!e?.pages && !!e?.chars && typeof e?.fontFamily == "string" && e.fontFamily !== "",
	getCacheableAssets(e, t) {
		let n = {};
		return e.forEach((e) => {
			n[e] = t, n[`${e}-bitmap`] = t;
		}), n[`${t.fontFamily}-bitmap`] = t, n;
	}
}, La = {
	extension: {
		type: O.LoadParser,
		priority: N.Normal
	},
	name: "loadBitmapFont",
	id: "bitmap-font",
	test(e) {
		return Fa.includes(M.extname(e).toLowerCase());
	},
	async testParse(e) {
		return Ma.test(e) || Pa.test(e);
	},
	async parse(e, t, n) {
		let r = Ma.test(e) ? Ma.parse(e) : Pa.parse(e), { src: i } = t, { pages: a } = r, o = [], s = r.distanceField ? {
			scaleMode: "linear",
			alphaMode: "premultiply-alpha-on-upload",
			autoGenerateMipmaps: !1,
			resolution: 1
		} : {};
		for (let e = 0; e < a.length; ++e) {
			let t = a[e].file, n = M.join(M.dirname(i), t);
			n = de(n, i), o.push({
				src: n,
				data: s
			});
		}
		let [c, { BitmapFont: l }] = await Promise.all([n.load(o), import("./BitmapFont-D6mONmgS.js")]);
		return new l({
			data: r,
			textures: o.map((e) => c[e.src])
		}, i);
	},
	async load(e, t) {
		return await (await w.get().fetch(e)).text();
	},
	async unload(e, t, n) {
		await Promise.all(e.pages.map((e) => n.unload(e.texture.source._sourceOrigin))), e.destroy();
	}
}, Ra = class {
	constructor(e, t = !1) {
		this._loader = e, this._assetList = [], this._isLoading = !1, this._maxConcurrent = 1, this.verbose = t;
	}
	add(e) {
		e.forEach((e) => {
			this._assetList.push(e);
		}), this.verbose && console.log("[BackgroundLoader] assets: ", this._assetList), this._isActive && !this._isLoading && this._next();
	}
	async _next() {
		if (this._assetList.length && this._isActive) {
			this._isLoading = !0;
			let e = [], t = Math.min(this._assetList.length, this._maxConcurrent);
			for (let n = 0; n < t; n++) e.push(this._assetList.pop());
			await this._loader.load(e), this._isLoading = !1, this._next();
		}
	}
	get active() {
		return this._isActive;
	}
	set active(e) {
		this._isActive !== e && (this._isActive = e, e && !this._isLoading && this._next());
	}
}, za = {
	extension: {
		type: O.CacheParser,
		name: "cacheTextureArray"
	},
	test: (e) => Array.isArray(e) && e.every((e) => e instanceof x),
	getCacheableAssets: (e, t) => {
		let n = {};
		return e.forEach((e) => {
			t.forEach((t, r) => {
				n[e + (r === 0 ? "" : r + 1)] = t;
			});
		}), n;
	}
};
//#endregion
//#region node_modules/pixi.js/lib/assets/detections/utils/testImageFormat.mjs
async function Ba(e) {
	if ("Image" in globalThis) return new Promise((t) => {
		let n = new Image();
		n.onload = () => {
			t(!0);
		}, n.onerror = () => {
			t(!1);
		}, n.src = e;
	});
	if ("createImageBitmap" in globalThis && "fetch" in globalThis) {
		try {
			let t = await (await fetch(e)).blob();
			await createImageBitmap(t);
		} catch {
			return !1;
		}
		return !0;
	}
	return !1;
}
//#endregion
//#region node_modules/pixi.js/lib/assets/detections/parsers/detectAvif.mjs
var Va = {
	extension: {
		type: O.DetectionParser,
		priority: 1
	},
	test: async () => Ba("data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A="),
	add: async (e) => [...e, "avif"],
	remove: async (e) => e.filter((e) => e !== "avif")
}, Ha = [
	"png",
	"jpg",
	"jpeg"
], Ua = {
	extension: {
		type: O.DetectionParser,
		priority: -1
	},
	test: () => Promise.resolve(!0),
	add: async (e) => [...e, ...Ha],
	remove: async (e) => e.filter((e) => !Ha.includes(e))
}, Wa = "WorkerGlobalScope" in globalThis && globalThis instanceof globalThis.WorkerGlobalScope;
function Ga(e) {
	return !Wa && document.createElement("video").canPlayType(e) !== "";
}
//#endregion
//#region node_modules/pixi.js/lib/assets/detections/parsers/detectMp4.mjs
var Ka = {
	extension: {
		type: O.DetectionParser,
		priority: 0
	},
	test: async () => Ga("video/mp4"),
	add: async (e) => [
		...e,
		"mp4",
		"m4v"
	],
	remove: async (e) => e.filter((e) => e !== "mp4" && e !== "m4v")
}, qa = {
	extension: {
		type: O.DetectionParser,
		priority: 0
	},
	test: async () => Ga("video/ogg"),
	add: async (e) => [...e, "ogv"],
	remove: async (e) => e.filter((e) => e !== "ogv")
}, Ja = {
	extension: {
		type: O.DetectionParser,
		priority: 0
	},
	test: async () => Ga("video/webm"),
	add: async (e) => [...e, "webm"],
	remove: async (e) => e.filter((e) => e !== "webm")
}, Ya = {
	extension: {
		type: O.DetectionParser,
		priority: 0
	},
	test: async () => Ba("data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA="),
	add: async (e) => [...e, "webp"],
	remove: async (e) => e.filter((e) => e !== "webp")
}, Xa = class e {
	constructor() {
		this.loadOptions = { ...e.defaultOptions }, this._parsers = [], this._parsersValidated = !1, this.parsers = new Proxy(this._parsers, { set: (e, t, n) => (this._parsersValidated = !1, e[t] = n, !0) }), this.promiseCache = {};
	}
	reset() {
		this._parsersValidated = !1, this.promiseCache = {};
	}
	_getLoadPromiseAndParser(e, t) {
		let n = {
			promise: null,
			parser: null
		};
		return n.promise = (async () => {
			let r = null, i = null;
			if ((t.parser || t.loadParser) && (i = this._parserHash[t.parser || t.loadParser], t.loadParser && d(`[Assets] "loadParser" is deprecated, use "parser" instead for ${e}`), i || d(`[Assets] specified load parser "${t.parser || t.loadParser}" not found while loading ${e}`)), !i) {
				for (let n = 0; n < this.parsers.length; n++) {
					let r = this.parsers[n];
					if (r.load && r.test?.(e, t, this)) {
						i = r;
						break;
					}
				}
				if (!i) return d(`[Assets] ${e} could not be loaded as we don't know how to parse it, ensure the correct parser has been added`), null;
			}
			r = await i.load(e, t, this), n.parser = i;
			for (let e = 0; e < this.parsers.length; e++) {
				let i = this.parsers[e];
				i.parse && i.parse && await i.testParse?.(r, t, this) && (r = await i.parse(r, t, this) || r, n.parser = i);
			}
			return r;
		})(), n;
	}
	async load(t, n) {
		this._parsersValidated || this._validateParsers();
		let { onProgress: r, onError: i, strategy: a, retryCount: o, retryDelay: s } = typeof n == "function" ? {
			...e.defaultOptions,
			...this.loadOptions,
			onProgress: n
		} : {
			...e.defaultOptions,
			...this.loadOptions,
			...n || {}
		}, c = 0, l = {}, u = le(t), d = P(t, (e) => ({
			alias: [e],
			src: e,
			data: {}
		})), f = d.reduce((e, t) => e + (t.progressSize || 1), 0), p = d.map(async (e) => {
			let t = M.toAbsolute(e.src);
			l[e.src] || (await this._loadAssetWithRetry(t, e, {
				onProgress: r,
				onError: i,
				strategy: a,
				retryCount: o,
				retryDelay: s
			}, l), c += e.progressSize || 1, r && r(c / f));
		});
		return await Promise.all(p), u ? l[d[0].src] : l;
	}
	async unload(e) {
		let t = P(e, (e) => ({
			alias: [e],
			src: e
		})).map(async (e) => {
			let t = M.toAbsolute(e.src), n = this.promiseCache[t];
			if (n) {
				let r = await n.promise;
				delete this.promiseCache[t], await n.parser?.unload?.(r, e, this);
			}
		});
		await Promise.all(t);
	}
	_validateParsers() {
		this._parsersValidated = !0, this._parserHash = this._parsers.filter((e) => e.name || e.id).reduce((e, t) => (!t.name && !t.id ? d("[Assets] parser should have an id") : (e[t.name] || e[t.id]) && d(`[Assets] parser id conflict "${t.id}"`), e[t.name] = t, t.id && (e[t.id] = t), e), {});
	}
	async _loadAssetWithRetry(e, t, n, r) {
		let i = 0, { onError: a, strategy: o, retryCount: s, retryDelay: c } = n, l = (e) => new Promise((t) => setTimeout(t, e));
		for (;;) try {
			this.promiseCache[e] || (this.promiseCache[e] = this._getLoadPromiseAndParser(e, t)), r[t.src] = await this.promiseCache[e].promise;
			return;
		} catch (n) {
			if (delete this.promiseCache[e], delete r[t.src], i++, o === "retry" && !(o !== "retry" || i > s)) {
				a && a(n, t), await l(c);
				continue;
			}
			if (o === "skip") {
				a && a(n, t);
				return;
			}
			a && a(n, t);
			let u = /* @__PURE__ */ Error(`[Loader.load] Failed to load ${e}.
${n}`);
			throw n instanceof Error && n.stack && (u.stack = n.stack), u;
		}
	}
};
Xa.defaultOptions = {
	onProgress: void 0,
	onError: void 0,
	strategy: "throw",
	retryCount: 3,
	retryDelay: 250
};
var Za = Xa;
//#endregion
//#region node_modules/pixi.js/lib/assets/utils/checkDataUrl.mjs
function Qa(e, t) {
	if (Array.isArray(t)) {
		for (let n of t) if (e.startsWith(`data:${n}`)) return !0;
		return !1;
	}
	return e.startsWith(`data:${t}`);
}
//#endregion
//#region node_modules/pixi.js/lib/assets/utils/checkExtension.mjs
function $a(e, t) {
	let n = e.split("?")[0], r = M.extname(n).toLowerCase();
	return Array.isArray(t) ? t.includes(r) : r === t;
}
//#endregion
//#region node_modules/pixi.js/lib/assets/loader/parsers/loadJson.mjs
var eo = ".json", to = "application/json", no = {
	extension: {
		type: O.LoadParser,
		priority: N.Low
	},
	name: "loadJson",
	id: "json",
	test(e) {
		return Qa(e, to) || $a(e, eo);
	},
	async load(e) {
		return await (await w.get().fetch(e)).json();
	}
}, ro = ".txt", io = "text/plain", ao = {
	name: "loadTxt",
	id: "text",
	extension: {
		type: O.LoadParser,
		priority: N.Low,
		name: "loadTxt"
	},
	test(e) {
		return Qa(e, io) || $a(e, ro);
	},
	async load(e) {
		return await (await w.get().fetch(e)).text();
	}
}, oo = [
	"normal",
	"bold",
	"100",
	"200",
	"300",
	"400",
	"500",
	"600",
	"700",
	"800",
	"900"
], so = [
	".ttf",
	".otf",
	".woff",
	".woff2"
], co = [
	"font/ttf",
	"font/otf",
	"font/woff",
	"font/woff2"
], lo = /^(--|-?[A-Z_])[0-9A-Z_-]*$/i;
function uo(e) {
	let t = M.extname(e), n = M.basename(e, t).replace(/(-|_)/g, " ").toLowerCase().split(" ").map((e) => e.charAt(0).toUpperCase() + e.slice(1)), r = n.length > 0;
	for (let e of n) if (!e.match(lo)) {
		r = !1;
		break;
	}
	let i = n.join(" ");
	return r || (i = `"${i.replace(/[\\"]/g, "\\$&")}"`), i;
}
var fo = /^[0-9A-Za-z%:/?#\[\]@!\$&'()\*\+,;=\-._~]*$/;
function po(e) {
	return fo.test(e) ? e : encodeURI(e);
}
var mo = {
	extension: {
		type: O.LoadParser,
		priority: N.Low
	},
	name: "loadWebFont",
	id: "web-font",
	test(e) {
		return Qa(e, co) || $a(e, so);
	},
	async load(e, t) {
		let n = w.get().getFontFaceSet();
		if (n) {
			let r = [], i = t.data?.family ?? uo(e), a = t.data?.weights?.filter((e) => oo.includes(e)) ?? ["normal"], o = t.data ?? {};
			for (let t = 0; t < a.length; t++) {
				let s = a[t], c = new FontFace(i, `url('${po(e)}')`, {
					...o,
					weight: s
				});
				await c.load(), n.add(c), r.push(c);
			}
			return F.has(`${i}-and-url`) ? F.get(`${i}-and-url`).entries.push({
				url: e,
				faces: r
			}) : F.set(`${i}-and-url`, { entries: [{
				url: e,
				faces: r
			}] }), r.length === 1 ? r[0] : r;
		}
		return d("[loadWebFont] FontFace API is not supported. Skipping loading font"), null;
	},
	unload(e) {
		let t = Array.isArray(e) ? e : [e], n = t[0].family, r = F.get(`${n}-and-url`), i = r.entries.find((e) => e.faces.some((e) => t.indexOf(e) !== -1));
		i.faces = i.faces.filter((e) => t.indexOf(e) === -1), i.faces.length === 0 && (r.entries = r.entries.filter((e) => e !== i)), t.forEach((e) => {
			w.get().getFontFaceSet().delete(e);
		}), r.entries.length === 0 && F.remove(`${n}-and-url`);
	}
};
//#endregion
//#region node_modules/pixi.js/lib/utils/network/getResolutionOfUrl.mjs
function ho(e, t = 1) {
	let n = j.RETINA_PREFIX?.exec(e);
	return n ? parseFloat(n[1]) : t;
}
//#endregion
//#region node_modules/pixi.js/lib/assets/loader/parsers/textures/utils/createTexture.mjs
function go(e, t, n) {
	e.label = n, e._sourceOrigin = n;
	let r = new x({
		source: e,
		label: n
	}), i = () => {
		delete t.promiseCache[n], F.has(n) && F.remove(n);
	};
	return r.source.once("destroy", () => {
		t.promiseCache[n] && (d("[Assets] A TextureSource managed by Assets was destroyed instead of unloaded! Use Assets.unload() instead of destroying the TextureSource."), i());
	}), r.once("destroy", () => {
		e.destroyed || (d("[Assets] A Texture managed by Assets was destroyed instead of unloaded! Use Assets.unload() instead of destroying the Texture."), i());
	}), r;
}
//#endregion
//#region node_modules/pixi.js/lib/assets/loader/parsers/textures/loadSVG.mjs
var _o = ".svg", vo = "image/svg+xml", yo = {
	extension: {
		type: O.LoadParser,
		priority: N.Low,
		name: "loadSVG"
	},
	name: "loadSVG",
	id: "svg",
	config: {
		crossOrigin: "anonymous",
		parseAsGraphicsContext: !1
	},
	test(e) {
		return Qa(e, vo) || $a(e, _o);
	},
	async load(e, t, n) {
		return t.data?.parseAsGraphicsContext ?? this.config.parseAsGraphicsContext ? xo(e) : bo(e, t, n, this.config.crossOrigin);
	},
	unload(e) {
		e.destroy(!0);
	}
};
async function bo(e, t, n, r) {
	let i = await w.get().fetch(e), a = w.get().createImage();
	a.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(await i.text())}`, a.crossOrigin = r, await a.decode();
	let o = t.data?.width ?? a.width, s = t.data?.height ?? a.height, c = t.data?.resolution || ho(e), l = Math.ceil(o * c), u = Math.ceil(s * c), d = w.get().createCanvas(l, u), f = d.getContext("2d");
	f.imageSmoothingEnabled = !0, f.imageSmoothingQuality = "high", f.drawImage(a, 0, 0, o * c, s * c);
	let { parseAsGraphicsContext: p, ...m } = t.data ?? {};
	return go(new I({
		resource: d,
		alphaMode: "premultiply-alpha-on-upload",
		resolution: c,
		...m
	}), n, e);
}
async function xo(e) {
	let t = await (await w.get().fetch(e)).text(), n = new z();
	return n.svg(t), n;
}
//#endregion
//#region node_modules/pixi.js/lib/_virtual/checkImageBitmap.worker.mjs
var So = "(function () {\n    'use strict';\n\n    const WHITE_PNG = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=\";\n    async function checkImageBitmap() {\n      try {\n        if (typeof createImageBitmap !== \"function\") return false;\n        const response = await fetch(WHITE_PNG);\n        const imageBlob = await response.blob();\n        const imageBitmap = await createImageBitmap(imageBlob);\n        return imageBitmap.width === 1 && imageBitmap.height === 1;\n      } catch (_e) {\n        return false;\n      }\n    }\n    void checkImageBitmap().then((result) => {\n      self.postMessage(result);\n    });\n\n})();\n", Co = null, wo = class {
	constructor() {
		Co ||= URL.createObjectURL(new Blob([So], { type: "application/javascript" })), this.worker = new Worker(Co);
	}
};
wo.revokeObjectURL = function() {
	Co &&= (URL.revokeObjectURL(Co), null);
};
//#endregion
//#region node_modules/pixi.js/lib/_virtual/loadImageBitmap.worker.mjs
var To = "(function () {\n    'use strict';\n\n    async function loadImageBitmap(url, alphaMode) {\n      const response = await fetch(url);\n      if (!response.ok) {\n        throw new Error(`[WorkerManager.loadImageBitmap] Failed to fetch ${url}: ${response.status} ${response.statusText}`);\n      }\n      const imageBlob = await response.blob();\n      return alphaMode === \"premultiplied-alpha\" ? createImageBitmap(imageBlob, { premultiplyAlpha: \"none\" }) : createImageBitmap(imageBlob);\n    }\n    self.onmessage = async (event) => {\n      try {\n        const imageBitmap = await loadImageBitmap(event.data.data[0], event.data.data[1]);\n        self.postMessage({\n          data: imageBitmap,\n          uuid: event.data.uuid,\n          id: event.data.id\n        }, [imageBitmap]);\n      } catch (e) {\n        self.postMessage({\n          error: e,\n          uuid: event.data.uuid,\n          id: event.data.id\n        });\n      }\n    };\n\n})();\n", Eo = null, Do = class {
	constructor() {
		Eo ||= URL.createObjectURL(new Blob([To], { type: "application/javascript" })), this.worker = new Worker(Eo);
	}
};
Do.revokeObjectURL = function() {
	Eo &&= (URL.revokeObjectURL(Eo), null);
};
//#endregion
//#region node_modules/pixi.js/lib/assets/loader/workers/WorkerManager.mjs
var Oo = 0, ko, Ao = new class {
	constructor() {
		this._initialized = !1, this._createdWorkers = 0, this._workerPool = [], this._queue = [], this._resolveHash = {};
	}
	isImageBitmapSupported() {
		return this._isImageBitmapSupported === void 0 && (this._isImageBitmapSupported = new Promise((e) => {
			let { worker: t } = new wo();
			t.addEventListener("message", (n) => {
				t.terminate(), wo.revokeObjectURL(), e(n.data);
			});
		})), this._isImageBitmapSupported;
	}
	loadImageBitmap(e, t) {
		return this._run("loadImageBitmap", [e, t?.data?.alphaMode]);
	}
	async _initWorkers() {
		this._initialized ||= !0;
	}
	_getWorker() {
		ko === void 0 && (ko = navigator.hardwareConcurrency || 4);
		let e = this._workerPool.pop();
		return !e && this._createdWorkers < ko && (this._createdWorkers++, e = new Do().worker, e.addEventListener("message", (e) => {
			this._complete(e.data), this._returnWorker(e.target), this._next();
		})), e;
	}
	_returnWorker(e) {
		this._workerPool.push(e);
	}
	_complete(e) {
		this._resolveHash[e.uuid] && (e.error === void 0 ? this._resolveHash[e.uuid].resolve(e.data) : this._resolveHash[e.uuid].reject(e.error), delete this._resolveHash[e.uuid]);
	}
	async _run(e, t) {
		await this._initWorkers();
		let n = new Promise((n, r) => {
			this._queue.push({
				id: e,
				arguments: t,
				resolve: n,
				reject: r
			});
		});
		return this._next(), n;
	}
	_next() {
		if (!this._queue.length) return;
		let e = this._getWorker();
		if (!e) return;
		let t = this._queue.pop(), n = t.id;
		this._resolveHash[Oo] = {
			resolve: t.resolve,
			reject: t.reject
		}, e.postMessage({
			data: t.arguments,
			uuid: Oo++,
			id: n
		});
	}
	reset() {
		this._workerPool.forEach((e) => e.terminate()), this._workerPool.length = 0, Object.values(this._resolveHash).forEach(({ reject: e }) => {
			e?.(/* @__PURE__ */ Error("WorkerManager has been reset before completion"));
		}), this._resolveHash = {}, this._queue.length = 0, this._initialized = !1, this._createdWorkers = 0;
	}
}(), jo = [
	".jpeg",
	".jpg",
	".png",
	".webp",
	".avif"
], Mo = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/avif"
];
async function No(e, t) {
	let n = await w.get().fetch(e);
	if (!n.ok) throw Error(`[loadImageBitmap] Failed to fetch ${e}: ${n.status} ${n.statusText}`);
	let r = await n.blob();
	return t?.data?.alphaMode === "premultiplied-alpha" ? createImageBitmap(r, { premultiplyAlpha: "none" }) : createImageBitmap(r);
}
var Po = {
	name: "loadTextures",
	id: "texture",
	extension: {
		type: O.LoadParser,
		priority: N.High,
		name: "loadTextures"
	},
	config: {
		preferWorkers: !0,
		preferCreateImageBitmap: !0,
		crossOrigin: "anonymous"
	},
	test(e) {
		return Qa(e, Mo) || $a(e, jo);
	},
	async load(e, t, n) {
		let r = null;
		return r = globalThis.createImageBitmap && this.config.preferCreateImageBitmap ? this.config.preferWorkers && await Ao.isImageBitmapSupported() ? await Ao.loadImageBitmap(e, t) : await No(e, t) : await new Promise((t, n) => {
			r = w.get().createImage(), r.crossOrigin = this.config.crossOrigin, r.src = e, r.complete ? t(r) : (r.onload = () => {
				t(r);
			}, r.onerror = n);
		}), go(new I({
			resource: r,
			alphaMode: "premultiply-alpha-on-upload",
			resolution: t.data?.resolution || ho(e),
			...t.data
		}), n, e);
	},
	unload(e) {
		e.destroy(!0);
	}
}, Fo = [
	".mp4",
	".m4v",
	".webm",
	".ogg",
	".ogv",
	".h264",
	".avi",
	".mov"
], Io, Lo;
function Ro(e, t, n) {
	n === void 0 && !t.startsWith("data:") ? e.crossOrigin = Bo(t) : n !== !1 && (e.crossOrigin = typeof n == "string" ? n : "anonymous");
}
function zo(e) {
	return new Promise((t, n) => {
		e.addEventListener("canplaythrough", r), e.addEventListener("error", i), e.load();
		function r() {
			a(), t();
		}
		function i(e) {
			a(), n(e);
		}
		function a() {
			e.removeEventListener("canplaythrough", r), e.removeEventListener("error", i);
		}
	});
}
function Bo(e, t = globalThis.location) {
	if (e.startsWith("data:")) return "";
	t ||= globalThis.location;
	let n = new URL(e, document.baseURI);
	return n.hostname !== t.hostname || n.port !== t.port || n.protocol !== t.protocol ? "anonymous" : "";
}
function Vo() {
	let e = [], t = [];
	for (let n of Fo) {
		let r = fe.MIME_TYPES[n.substring(1)] || `video/${n.substring(1)}`;
		Ga(r) && (e.push(n), t.includes(r) || t.push(r));
	}
	return {
		validVideoExtensions: e,
		validVideoMime: t
	};
}
var Ho = {
	name: "loadVideo",
	id: "video",
	extension: {
		type: O.LoadParser,
		name: "loadVideo"
	},
	test(e) {
		if (!Io || !Lo) {
			let { validVideoExtensions: e, validVideoMime: t } = Vo();
			Io = e, Lo = t;
		}
		let t = Qa(e, Lo), n = $a(e, Io);
		return t || n;
	},
	async load(e, t, n) {
		let r = {
			...fe.defaultOptions,
			resolution: t.data?.resolution || ho(e),
			alphaMode: t.data?.alphaMode || await ue(),
			...t.data
		}, i = document.createElement("video"), a = {
			preload: r.autoLoad === !1 ? void 0 : "auto",
			"webkit-playsinline": r.playsinline === !1 ? void 0 : "",
			playsinline: r.playsinline === !1 ? void 0 : "",
			muted: r.muted === !0 ? "" : void 0,
			loop: r.loop === !0 ? "" : void 0,
			autoplay: r.autoPlay === !1 ? void 0 : ""
		};
		Object.keys(a).forEach((e) => {
			let t = a[e];
			t !== void 0 && i.setAttribute(e, t);
		}), r.muted === !0 && (i.muted = !0), Ro(i, e, r.crossorigin);
		let o = document.createElement("source"), s;
		if (r.mime) s = r.mime;
		else if (e.startsWith("data:")) s = e.slice(5, e.indexOf(";"));
		else if (!e.startsWith("blob:")) {
			let t = e.split("?")[0].slice(e.lastIndexOf(".") + 1).toLowerCase();
			s = fe.MIME_TYPES[t] || `video/${t}`;
		}
		return o.src = e, s && (o.type = s), new Promise((a, s) => {
			r.preload && !r.autoPlay && i.load(), i.addEventListener("canplay", c), i.addEventListener("error", l), o.addEventListener("error", l), i.appendChild(o);
			async function c() {
				let o = new fe({
					...r,
					resource: i
				});
				u(), t.data.preload && await zo(i), a(go(o, n, e));
			}
			function l(e) {
				u(), s(e);
			}
			function u() {
				i.removeEventListener("canplay", c), i.removeEventListener("error", l), o.removeEventListener("error", l);
			}
		});
	},
	unload(e) {
		e.destroy(!0);
	}
}, Uo = {
	extension: {
		type: O.ResolveParser,
		name: "resolveTexture"
	},
	test: Po.test,
	parse: (e) => ({
		resolution: parseFloat(j.RETINA_PREFIX.exec(e)?.[1] ?? "1"),
		format: e.split(".").pop(),
		src: e
	})
}, Wo = {
	extension: {
		type: O.ResolveParser,
		priority: -2,
		name: "resolveJson"
	},
	test: (e) => j.RETINA_PREFIX.test(e) && e.endsWith(".json"),
	parse: Uo.parse
}, Go = new class {
	constructor() {
		this._detections = [], this._initialized = !1, this.resolver = new j(), this.loader = new Za(), this.cache = F, this._backgroundLoader = new Ra(this.loader), this._backgroundLoader.active = !0, this.reset();
	}
	async init(e = {}) {
		if (this._initialized) {
			d("[Assets]AssetManager already initialized, did you load before calling this Assets.init()?");
			return;
		}
		if (this._initialized = !0, e.defaultSearchParams && this.resolver.setDefaultSearchParams(e.defaultSearchParams), e.basePath && (this.resolver.basePath = e.basePath), e.bundleIdentifier && this.resolver.setBundleIdentifier(e.bundleIdentifier), e.manifest) {
			let t = e.manifest;
			typeof t == "string" && (t = await this.load(t)), this.resolver.addManifest(t);
		}
		let t = e.texturePreference?.resolution ?? 1, n = typeof t == "number" ? [t] : t, r = await this._detectFormats({
			preferredFormats: e.texturePreference?.format,
			skipDetections: e.skipDetections,
			detections: this._detections
		});
		this.resolver.prefer({ params: {
			format: r,
			resolution: n
		} }), e.preferences && this.setPreferences(e.preferences), e.loadOptions && (this.loader.loadOptions = {
			...this.loader.loadOptions,
			...e.loadOptions
		});
	}
	add(e) {
		this.resolver.add(e);
	}
	async load(e, t) {
		this._initialized || await this.init();
		let n = le(e), r = P(e).map((e) => {
			if (typeof e != "string") {
				let t = this.resolver.getAlias(e);
				return t.some((e) => !this.resolver.hasKey(e)) && this.add(e), Array.isArray(t) ? t[0] : t;
			}
			return this.resolver.hasKey(e) || this.add({
				alias: e,
				src: e
			}), e;
		}), i = this.resolver.resolve(r), a = await this._mapLoadToResolve(i, t);
		return n ? a[r[0]] : a;
	}
	addBundle(e, t) {
		this.resolver.addBundle(e, t);
	}
	async loadBundle(e, t) {
		this._initialized || await this.init();
		let n = !1;
		typeof e == "string" && (n = !0, e = [e]);
		let r = this.resolver.resolveBundle(e), i = {}, a = Object.keys(r), o = 0, s = [], c = () => {
			t?.(s.reduce((e, t) => e + t, 0) / o);
		}, l = a.map((e, t) => {
			let n = r[e], a = Object.values(n), l = [...new Set(a.flat())].reduce((e, t) => e + (t.progressSize || 1), 0);
			return s.push(0), o += l, this._mapLoadToResolve(n, (e) => {
				s[t] = e * l, c();
			}).then((t) => {
				i[e] = t;
			});
		});
		return await Promise.all(l), n ? i[e[0]] : i;
	}
	async backgroundLoad(e) {
		this._initialized || await this.init(), typeof e == "string" && (e = [e]);
		let t = this.resolver.resolve(e);
		this._backgroundLoader.add(Object.values(t));
	}
	async backgroundLoadBundle(e) {
		this._initialized || await this.init(), typeof e == "string" && (e = [e]);
		let t = this.resolver.resolveBundle(e);
		Object.values(t).forEach((e) => {
			this._backgroundLoader.add(Object.values(e));
		});
	}
	reset() {
		this.resolver.reset(), this.loader.reset(), this.cache.reset(), this._initialized = !1;
	}
	get(e) {
		if (typeof e == "string") return F.get(e);
		let t = {};
		for (let n = 0; n < e.length; n++) t[n] = F.get(e[n]);
		return t;
	}
	async _mapLoadToResolve(e, t) {
		let n = [...new Set(Object.values(e))];
		this._backgroundLoader.active = !1;
		let r = await this.loader.load(n, t);
		this._backgroundLoader.active = !0;
		let i = {};
		return n.forEach((e) => {
			let t = r[e.src], n = [e.src];
			e.alias && n.push(...e.alias), n.forEach((e) => {
				i[e] = t;
			}), F.set(n, t);
		}), i;
	}
	async unload(e) {
		this._initialized || await this.init();
		let t = P(e).map((e) => typeof e == "string" ? e : e.src), n = this.resolver.resolve(t);
		await this._unloadFromResolved(n);
	}
	async unloadBundle(e) {
		this._initialized || await this.init(), e = P(e);
		let t = this.resolver.resolveBundle(e), n = Object.keys(t).map((e) => this._unloadFromResolved(t[e]));
		await Promise.all(n);
	}
	async _unloadFromResolved(e) {
		let t = Object.values(e);
		t.forEach((e) => {
			F.remove(e.src);
		}), await this.loader.unload(t);
	}
	async _detectFormats(e) {
		let t = [];
		e.preferredFormats && (t = Array.isArray(e.preferredFormats) ? e.preferredFormats : [e.preferredFormats]);
		for (let n of e.detections) e.skipDetections || await n.test() ? t = await n.add(t) : e.skipDetections || (t = await n.remove(t));
		return t = t.filter((e, n) => t.indexOf(e) === n), t;
	}
	get detections() {
		return this._detections;
	}
	setPreferences(e) {
		this.loader.parsers.forEach((t) => {
			t.config && Object.keys(t.config).filter((t) => t in e).forEach((n) => {
				t.config[n] = e[n];
			});
		});
	}
}();
a.handleByList(O.LoadParser, Go.loader.parsers).handleByList(O.ResolveParser, Go.resolver.parsers).handleByList(O.CacheParser, Go.cache.parsers).handleByList(O.DetectionParser, Go.detections), a.add(za, Ua, Va, Ya, Ka, qa, Ja, no, ao, mo, yo, Po, Ho, La, Ia, Uo, Wo);
var Ko = {
	loader: O.LoadParser,
	resolver: O.ResolveParser,
	cache: O.CacheParser,
	detection: O.DetectionParser
};
//#endregion
//#region node_modules/pixi.js/lib/index.mjs
a.handle(O.Asset, (e) => {
	let t = e.ref;
	Object.entries(Ko).filter(([e]) => !!t[e]).forEach(([e, n]) => a.add(Object.assign(t[e], { extension: t[e].extension ?? n })));
}, (e) => {
	let t = e.ref;
	Object.keys(Ko).filter((e) => !!t[e]).forEach((e) => a.remove(t[e]));
}), a.add(ba, xa);
//#endregion
//#region src/app/pixelOffice/game/sceneTypes.ts
var qo = [
	"news_desk",
	"market_board",
	"research_desk",
	"report_shelf",
	"memo_board",
	"portfolio_monitor",
	"agent_seat"
], Jo = {
	version: 1,
	sceneId: "classic_analyst",
	assets: [
		{
			id: "classic_room_base",
			role: "room_base",
			src: "/pixel-office/scenes/classic/room-shell-modern-v2.png",
			width: 560,
			height: 315,
			depth: 0
		},
		{
			id: "classic_agent_seat_rug_object",
			role: "scene_object",
			src: "/pixel-office/scenes/classic/object-agent-seat-rug-v2.png",
			width: 560,
			height: 315,
			depth: 200,
			objectId: "agent_seat"
		},
		{
			id: "classic_market_board_object",
			role: "scene_object",
			src: "/pixel-office/scenes/classic/object-market-board-v2.png",
			width: 560,
			height: 315,
			depth: 11800,
			objectId: "market_board"
		},
		{
			id: "classic_news_desk_workstation_object",
			role: "scene_object",
			src: "/pixel-office/scenes/classic/object-news-desk-v2.png",
			width: 560,
			height: 315,
			depth: 15900,
			objectId: "news_desk"
		},
		{
			id: "classic_research_desk_workstation_object",
			role: "scene_object",
			src: "/pixel-office/scenes/classic/object-research-desk-v2.png",
			width: 560,
			height: 315,
			depth: 19100,
			objectId: "research_desk"
		},
		{
			id: "classic_news_desk_chair_object",
			role: "scene_object",
			src: "/pixel-office/scenes/classic/object-news-desk-chair-v2.png",
			width: 560,
			height: 315,
			depth: 21200,
			objectId: "news_desk"
		},
		{
			id: "classic_memo_board_object",
			role: "scene_object",
			src: "/pixel-office/scenes/classic/object-memo-board-v2.png",
			width: 560,
			height: 315,
			depth: 22300,
			objectId: "memo_board"
		},
		{
			id: "classic_report_shelf_object",
			role: "scene_object",
			src: "/pixel-office/scenes/classic/object-report-shelf-v2.png",
			width: 560,
			height: 315,
			depth: 22500,
			objectId: "report_shelf"
		},
		{
			id: "classic_research_desk_chair_object",
			role: "scene_object",
			src: "/pixel-office/scenes/classic/object-research-desk-chair-v2.png",
			width: 560,
			height: 315,
			depth: 23800,
			objectId: "research_desk"
		},
		{
			id: "classic_agent_seat_chair_object",
			role: "scene_object",
			src: "/pixel-office/scenes/classic/object-agent-seat-chair-v2.png",
			width: 560,
			height: 315,
			depth: 27800,
			objectId: "agent_seat"
		},
		{
			id: "classic_agent_seat_side_table_object",
			role: "scene_object",
			src: "/pixel-office/scenes/classic/object-agent-seat-side-table-v2.png",
			width: 560,
			height: 315,
			depth: 27900,
			objectId: "agent_seat"
		},
		{
			id: "classic_portfolio_workstation_object",
			role: "scene_object",
			src: "/pixel-office/scenes/classic/object-portfolio-monitor-v2.png",
			width: 560,
			height: 315,
			depth: 28700,
			objectId: "portfolio_monitor"
		},
		{
			id: "classic_agent_seat_coffee_table_object",
			role: "scene_object",
			src: "/pixel-office/scenes/classic/object-agent-seat-coffee-table-v2.png",
			width: 560,
			height: 315,
			depth: 30200,
			objectId: "agent_seat"
		},
		{
			id: "classic_portfolio_chair_object",
			role: "scene_object",
			src: "/pixel-office/scenes/classic/object-portfolio-chair-v2.png",
			width: 560,
			height: 315,
			depth: 31300,
			objectId: "portfolio_monitor"
		},
		{
			id: "classic_neutral_front",
			role: "character_idle",
			src: "/pixel-office/characters/classic/neutral-front-v3.png",
			width: 64,
			height: 96
		},
		{
			id: "classic_character_atlas",
			role: "character_atlas",
			src: "/pixel-office/characters/classic/sprite-sheet-alpha.png",
			width: 256,
			height: 576
		},
		{
			id: "classic_portrait",
			role: "portrait",
			src: "/pixel-office/characters/classic/portrait.png",
			width: 234,
			height: 290
		}
	]
}, Yo = "/pixel-office/characters/classic/manifest.json", Xo = class extends Error {
	constructor(e) {
		super(e), this.name = "AssetManifestError";
	}
};
function Zo(e) {
	let t = [], n = /* @__PURE__ */ new Set(), r = 0, i = 0, a = 0, o = /* @__PURE__ */ new Set();
	for (let s of e.assets) (!s.id || n.has(s.id)) && t.push(`asset id ${s.id || "<empty>"} must be unique`), n.add(s.id), (!s.src.startsWith("/pixel-office/") || !s.src.endsWith(".png")) && t.push(`asset ${s.id} must use a project-bound PNG path`), (!Number.isInteger(s.width) || s.width <= 0 || !Number.isInteger(s.height) || s.height <= 0) && t.push(`asset ${s.id} dimensions must be positive integers`), s.role === "room_base" && (r += 1), s.role === "character_idle" && (i += 1), s.role === "character_atlas" && (a += 1), s.role === "scene_object" && (!s.objectId || !qo.includes(s.objectId) ? t.push(`scene object ${s.id} requires a known objectId`) : o.add(s.objectId), Number.isFinite(s.depth) || t.push(`scene object ${s.id} requires a finite depth`));
	r !== 1 && t.push("asset manifest requires exactly one room_base"), i !== 1 && t.push("asset manifest requires exactly one character_idle"), a !== 1 && t.push("asset manifest requires exactly one character_atlas");
	for (let e of qo) o.has(e) || t.push(`scene object ${e} requires at least one asset`);
	if (t.length) throw new Xo(t.join("; "));
	return e;
}
//#endregion
//#region src/app/pixelOffice/game/characterAnimation.ts
var Qo = [
	"down_idle",
	"down_walk",
	"side_idle",
	"side_walk",
	"up_idle",
	"up_walk"
], $o = class extends Error {
	constructor(e) {
		super(e), this.name = "CharacterAnimationManifestError";
	}
};
function Z(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function Q(e) {
	return Number.isInteger(e) && Number(e) > 0;
}
function es(e) {
	let t = [];
	if (!Z(e)) throw new $o("character animation manifest must be an object");
	(typeof e.characterId != "string" || !e.characterId) && t.push("characterId must be a non-empty string"), e.game_input !== "sprite-sheet-alpha.png" && t.push("game_input must point to sprite-sheet-alpha.png"), e.degraded_static_fallback !== !1 && t.push("degraded_static_fallback must be false");
	let n = Z(e.animation) ? e.animation : null, r = Z(e.frame_layout) ? e.frame_layout : null;
	n || t.push("animation must be an object"), r || t.push("frame_layout must be an object");
	let i = n && Z(n.rows) ? n.rows : null, a = r && Z(r.rows) ? r.rows : null;
	i || t.push("animation.rows must be an object"), a || t.push("frame_layout.rows must be an object");
	let o = r?.sheetWidth, s = r?.sheetHeight, c = r?.cellWidth, l = r?.cellHeight;
	(!Q(o) || !Q(s)) && t.push("frame_layout sheet dimensions must be positive integers"), (!Q(c) || !Q(l)) && t.push("frame_layout cell dimensions must be positive integers"), n && (n.cellWidth !== c || n.cellHeight !== l) && t.push("animation and frame_layout cell dimensions must match");
	for (let e of Qo) {
		let n = i && Z(i[e]) ? i[e] : null, r = a?.[e];
		if (!n) {
			t.push(`animation row ${e} is required`);
			continue;
		}
		if (!Array.isArray(r) || r.length === 0) {
			t.push(`frame_layout row ${e} must contain frames`);
			continue;
		}
		(!Q(n.frames) || n.frames !== r.length) && t.push(`animation row ${e} frame count must match frame_layout`), (!Q(n.fps) || n.loop !== !0) && t.push(`animation row ${e} requires a positive fps and loop=true`), (!Array.isArray(n.durations_ms) || n.durations_ms.length !== r.length || n.durations_ms.some((e) => typeof e != "number" || e <= 0)) && t.push(`animation row ${e} requires one positive duration per frame`), r.forEach((n, r) => {
			if (!Z(n) || !Number.isInteger(n.x) || !Number.isInteger(n.y) || !Q(n.w) || !Q(n.h)) {
				t.push(`frame_layout ${e}[${r}] must be an integer rectangle`);
				return;
			}
			typeof o == "number" && typeof s == "number" && (Number(n.x) < 0 || Number(n.y) < 0 || Number(n.x) + Number(n.w) > o || Number(n.y) + Number(n.h) > s) && t.push(`frame_layout ${e}[${r}] exceeds the sprite sheet`);
		});
	}
	if (t.length) throw new $o(t.join("; "));
	return e;
}
function ts(e, t, n = !1) {
	let r = t && !n ? "walk" : "idle";
	return e === "north" ? `up_${r}` : e === "east" || e === "west" ? `side_${r}` : `down_${r}`;
}
function ns(e, t, n) {
	let r = e.animation.rows[t].durations_ms, i = r.reduce((e, t) => e + t, 0), a = Math.max(0, n) % i;
	for (let e = 0; e < r.length; e += 1) {
		if (a < r[e]) return e;
		a -= r[e];
	}
	return r.length - 1;
}
function rs(e, t, n) {
	let r = /* @__PURE__ */ new Map(), i = {};
	for (let e of Qo) i[e] = n.frame_layout.rows[e].map((i) => {
		let a = `${i.x}:${i.y}:${i.w}:${i.h}`, o = r.get(a);
		if (o) return o;
		let s = new x({
			source: t.source,
			frame: new m(i.x, i.y, i.w, i.h),
			label: `${n.characterId}:${e}:${a}`
		});
		return r.set(a, s), s;
	});
	let a = "down_idle";
	return e.texture = i[a][0], {
		sprite: e,
		manifest: n,
		textures: i,
		activeRow: a,
		elapsedMs: 0,
		destroy: () => {
			for (let e of r.values()) e.destroy(!1);
			r.clear();
		}
	};
}
function is(e, t, n, r, i = !1) {
	let a = ts(t, n, i);
	a === e.activeRow ? e.elapsedMs += Math.max(0, r) : (e.activeRow = a, e.elapsedMs = 0);
	let o = ns(e.manifest, a, e.elapsedMs);
	e.sprite.texture = e.textures[a][o];
}
//#endregion
//#region src/app/pixelOffice/game/assetLoader.ts
async function as() {
	let e = Zo(Jo).assets.filter((e) => e.role !== "portrait"), [t, n] = await Promise.all([Promise.all(e.map(async (e) => ({
		definition: e,
		texture: await Go.load(e.src)
	}))), fetch(Yo)]);
	if (!n.ok) throw Error(`Classic character animation manifest failed to load (${n.status})`);
	let r = es(await n.json()), i = t.find((e) => e.definition.role === "room_base"), a = t.find((e) => e.definition.role === "character_idle"), o = t.find((e) => e.definition.role === "character_atlas");
	if (!i || !a || !o) throw Error("Classic room asset roles are incomplete");
	if (r.frame_layout.sheetWidth !== o.definition.width || r.frame_layout.sheetHeight !== o.definition.height) throw Error("Classic character atlas dimensions do not match its animation manifest");
	return {
		roomBase: i,
		characterIdle: a,
		characterAtlas: o,
		characterAnimation: r,
		sceneObjects: t.filter((e) => e.definition.role === "scene_object")
	};
}
//#endregion
//#region src/app/pixelOffice/game/depthSort.ts
function os(e, t = 0) {
	if (!Number.isFinite(e) || !Number.isFinite(t)) throw Error("Depth inputs must be finite");
	return Math.round(e * 100) + t;
}
//#endregion
//#region src/app/pixelOffice/game/classicRoomRenderer.ts
var ss = 1121069;
function cs(e) {
	return e === "error" || e === "unavailable" ? 14052446 : e === "attention" || e === "stale" ? 15781493 : e === "busy" || e === "loading" ? 6727876 : e === "empty" ? 9146265 : 6534539;
}
function ls(e, t) {
	for (let [n, r] of e) r.clear(), r.circle(0, 0, 4).fill(cs(t[n])).stroke({
		color: ss,
		width: 1
	});
}
function us(e, t, n) {
	let r = new ie();
	r.sortableChildren = !0;
	let i = new oe(n.roomBase.texture);
	i.width = e.logicalSize.width, i.height = e.logicalSize.height, i.zIndex = n.roomBase.definition.depth || 0, r.addChild(i);
	let a = /* @__PURE__ */ new Map();
	for (let t of e.anchors) {
		let e = new Ot();
		e.x = t.hitArea.x + t.hitArea.width - 9, e.y = t.hitArea.y + 9, e.zIndex = os(t.occlusionBounds.y + t.occlusionBounds.height, 40), a.set(t.id, e), r.addChild(e);
	}
	ls(a, t);
	let o = new ie(), s = new oe(n.characterIdle.texture);
	s.anchor.set(.5, 1);
	let c = rs(s, n.characterAtlas.texture, n.characterAnimation);
	o.addChild(s);
	let l = e.routeNodes[e.spawnNode];
	o.x = l.x, o.y = l.y, o.zIndex = os(l.y, 10), r.addChild(o);
	let u = /* @__PURE__ */ new Map();
	for (let t of n.sceneObjects) {
		let n = t.definition.objectId;
		if (!n) continue;
		let i = new oe(t.texture);
		i.width = e.logicalSize.width, i.height = e.logicalSize.height, i.zIndex = t.definition.depth || 0;
		let a = u.get(n) || [];
		a.push(i), u.set(n, a), r.addChild(i);
	}
	return {
		world: r,
		agent: o,
		characterAnimator: c,
		objectSprites: u,
		statusIndicators: a
	};
}
//#endregion
//#region src/app/pixelOffice/game/routeGraph.ts
function ds(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of Object.keys(e.routeNodes)) t.set(n, []);
	for (let [n, r] of e.routeEdges) t.get(n)?.push(r), t.get(r)?.push(n);
	return t;
}
function fs(e, t, n) {
	if (!e.routeNodes[t] || !e.routeNodes[n]) throw Error(`Unknown route node: ${t} -> ${n}`);
	if (t === n) return {
		nodes: [t],
		points: [e.routeNodes[t]]
	};
	let r = ds(e), i = [t], a = /* @__PURE__ */ new Map([[t, null]]);
	for (; i.length;) {
		let e = i.shift();
		for (let t of r.get(e) || []) if (!a.has(t)) {
			if (a.set(t, e), t === n) {
				i.length = 0;
				break;
			}
			i.push(t);
		}
	}
	if (!a.has(n)) throw Error(`No authored route: ${t} -> ${n}`);
	let o = [], s = n;
	for (; s;) o.unshift(s), s = a.get(s) ?? null;
	return {
		nodes: o,
		points: o.map((t) => e.routeNodes[t])
	};
}
//#endregion
//#region src/app/pixelOffice/game/movementMachine.ts
function ps(e, t = e.spawnNode) {
	return {
		phase: "idle",
		position: e.routeNodes[t],
		facing: "south",
		currentNode: t,
		targetNode: t,
		requestedNode: null,
		arrivalPhase: "idle",
		route: [e.routeNodes[t]],
		routeNodes: [t],
		segmentIndex: 0
	};
}
function ms(e, t, n) {
	return e.phase === "walking" || e.phase === "arriving" || e.phase === "route_pending" ? e.targetNode === t ? {
		...e,
		arrivalPhase: n
	} : {
		...e,
		requestedNode: t,
		arrivalPhase: n
	} : e.currentNode === t ? {
		...e,
		phase: n,
		targetNode: t,
		requestedNode: null,
		arrivalPhase: n
	} : {
		...e,
		phase: "route_pending",
		targetNode: t,
		requestedNode: null,
		arrivalPhase: n
	};
}
function hs(e, t, n) {
	return Math.abs(e) > Math.abs(t) ? e >= 0 ? "east" : "west" : Math.abs(t) > 0 ? t >= 0 ? "south" : "north" : n;
}
function gs(e, t) {
	let n = fs(t, e.currentNode, e.targetNode);
	if (n.points.length < 2) return {
		...e,
		phase: "arriving"
	};
	let r = n.points[1];
	return {
		...e,
		phase: "walking",
		route: n.points,
		routeNodes: n.nodes,
		segmentIndex: 1,
		facing: hs(r.x - e.position.x, r.y - e.position.y, e.facing)
	};
}
function _s(e, t, n, r = 72) {
	if (e.phase === "route_pending") return gs(e, t);
	if (e.phase === "arriving") {
		let n = {
			...e,
			phase: e.arrivalPhase,
			position: t.routeNodes[e.targetNode],
			currentNode: e.targetNode,
			route: [t.routeNodes[e.targetNode]],
			routeNodes: [e.targetNode],
			segmentIndex: 0
		};
		return !e.requestedNode || e.requestedNode === e.targetNode ? {
			...n,
			requestedNode: null
		} : {
			...n,
			phase: "route_pending",
			targetNode: e.requestedNode,
			requestedNode: null
		};
	}
	if (e.phase !== "walking" || n <= 0) return e;
	let i = Math.max(0, r * n), a = e.position, o = e.segmentIndex, s = e.facing;
	for (; i > 0 && o < e.route.length;) {
		let t = e.route[o], n = t.x - a.x, r = t.y - a.y, c = Math.hypot(n, r);
		if (s = hs(n, r, s), c <= i || c < .001) {
			a = t, i -= c, o += 1;
			continue;
		}
		a = {
			x: a.x + n / c * i,
			y: a.y + r / c * i
		}, i = 0;
	}
	return o >= e.route.length ? {
		...e,
		phase: "arriving",
		position: a,
		segmentIndex: o,
		facing: s
	} : {
		...e,
		position: a,
		segmentIndex: o,
		facing: s
	};
}
//#endregion
//#region src/app/pixelOffice/game/sceneManifest.ts
var vs = class extends Error {
	constructor(e) {
		super(e), this.name = "SceneManifestError";
	}
};
function ys(e) {
	return Number.isFinite(e.x) && Number.isFinite(e.y);
}
function bs(e) {
	return ys(e) && e.width > 0 && e.height > 0;
}
function xs(e, t, n) {
	return e.x >= 0 && e.x <= t && e.y >= 0 && e.y <= n;
}
function Ss(e, t, n) {
	return e.x >= 0 && e.y >= 0 && e.x + e.width <= t && e.y + e.height <= n;
}
function Cs(e, t, n) {
	return (t.y - e.y) * (n.x - t.x) - (t.x - e.x) * (n.y - t.y);
}
function ws(e, t, n) {
	return t.x <= Math.max(e.x, n.x) && t.x >= Math.min(e.x, n.x) && t.y <= Math.max(e.y, n.y) && t.y >= Math.min(e.y, n.y);
}
function Ts(e, t, n, r) {
	let i = Cs(e, t, n), a = Cs(e, t, r), o = Cs(n, r, e), s = Cs(n, r, t);
	return !!(i > 0 != a > 0 && o > 0 != s > 0 || i === 0 && ws(e, n, t) || a === 0 && ws(e, r, t) || o === 0 && ws(n, e, r) || s === 0 && ws(n, t, r));
}
function Es(e, t, n) {
	let r = (e) => e.x >= n.x && e.x <= n.x + n.width && e.y >= n.y && e.y <= n.y + n.height;
	if (r(e) || r(t)) return !0;
	let i = {
		x: n.x,
		y: n.y
	}, a = {
		x: n.x + n.width,
		y: n.y
	}, o = {
		x: n.x + n.width,
		y: n.y + n.height
	}, s = {
		x: n.x,
		y: n.y + n.height
	};
	return Ts(e, t, i, a) || Ts(e, t, a, o) || Ts(e, t, o, s) || Ts(e, t, s, i);
}
function Ds(e) {
	let t = [], { width: n, height: r } = e.logicalSize;
	e.version !== 1 && t.push("version must be 1"), e.sceneId !== "classic_analyst" && t.push("sceneId must be classic_analyst"), (n !== 560 || r !== 315) && t.push("logicalSize must remain 560x315"), e.tileSize !== 16 && t.push("tileSize must remain 16");
	let i = e.anchors.map((e) => e.id);
	for (let e of qo) i.filter((t) => t === e).length !== 1 && t.push(`anchor ${e} must occur exactly once`);
	i.length !== qo.length && t.push("manifest must contain only the seven semantic anchors");
	for (let i of e.anchors) {
		xs(i.position, n, r) || t.push(`anchor ${i.id} position is outside the scene`), (!bs(i.hitArea) || !Ss(i.hitArea, n, r)) && t.push(`anchor ${i.id} hitArea is invalid`), (!bs(i.collisionBounds) || !Ss(i.collisionBounds, n, r)) && t.push(`anchor ${i.id} collisionBounds is invalid`), (!bs(i.occlusionBounds) || !Ss(i.occlusionBounds, n, r)) && t.push(`anchor ${i.id} occlusionBounds is invalid`);
		let a = e.routeNodes[i.id];
		(!a || a.x !== i.position.x || a.y !== i.position.y) && t.push(`anchor ${i.id} must match its route node`);
	}
	let a = new Set(Object.keys(e.routeNodes)), o = /* @__PURE__ */ new Set();
	a.has(e.spawnNode) || t.push("spawnNode must exist in routeNodes");
	for (let [n, r] of e.routeEdges) {
		n === r && t.push(`route edge ${n} cannot loop to itself`), (!a.has(n) || !a.has(r)) && t.push(`route edge ${n}-${r} references a missing node`);
		let i = [n, r].sort().join("::");
		o.has(i) && t.push(`route edge ${n}-${r} is duplicated`), o.add(i);
		let s = e.routeNodes[n], c = e.routeNodes[r];
		if (s && c) for (let i of e.anchors) Es(s, c, i.collisionBounds) && t.push(`route edge ${n}-${r} intersects ${i.id} collisionBounds`);
	}
	for (let [i, a] of Object.entries(e.routeNodes)) (!ys(a) || !xs(a, n, r)) && t.push(`route node ${i} is outside the scene`);
	if (t.length) throw new vs(t.join("; "));
	return e;
}
//#endregion
//#region src/app/pixelOffice/game/PixelOfficeCanvas.tsx
var $ = t();
function Os({ manifest: e, statuses: t, intent: n, reducedMotion: r, onReady: i, onFailure: a, onPhaseChange: o }) {
	let s = (0, U.useRef)(null), c = (0, U.useRef)(null), l = (0, U.useRef)(t), u = (0, U.useRef)(n), d = (0, U.useRef)(r), f = (0, U.useRef)({
		onReady: i,
		onFailure: a,
		onPhaseChange: o
	});
	return (0, U.useEffect)(() => {
		l.current = t, c.current && ls(c.current.statusIndicators, t);
	}, [t]), (0, U.useEffect)(() => {
		u.current = n;
	}, [n]), (0, U.useEffect)(() => {
		d.current = r;
	}, [r]), (0, U.useEffect)(() => {
		f.current = {
			onReady: i,
			onFailure: a,
			onPhaseChange: o
		};
	}, [
		i,
		a,
		o
	]), (0, U.useEffect)(() => {
		let t = s.current;
		if (!t) return;
		let n = !1, r = null, i = null, a = ps(e), o = "", p = a.phase, m = () => {
			r && (document.visibilityState === "hidden" ? r.stop() : r.start());
		};
		return (async () => {
			try {
				if (Ds(e), ne.defaultOptions.scaleMode = "nearest", r = new ja(), await r.init({
					width: e.logicalSize.width,
					height: e.logicalSize.height,
					antialias: !1,
					autoDensity: !1,
					resolution: 1,
					backgroundColor: 1121069,
					preference: "webgl",
					powerPreference: "high-performance"
				}), n) {
					r.destroy({ removeView: !0 }, { children: !0 });
					return;
				}
				r.canvas.className = "pixel-office-canvas", r.canvas.setAttribute("aria-hidden", "true"), t.replaceChildren(r.canvas);
				let s = await as();
				if (n) {
					r.destroy({ removeView: !0 }, { children: !0 });
					return;
				}
				i = us(e, l.current, s), c.current = i, r.stage.addChild(i.world), r.ticker.add((t) => {
					if (!i) return;
					let n = u.current, r = `${n.destination}:${n.arrivalPhase}:${n.jobId}`;
					r !== o && (a = ms(a, n.destination, n.arrivalPhase), o = r);
					let s = Math.min(t.deltaMS / 1e3, .05);
					a = _s(a, e, s, d.current ? 168 : 76), i.agent.x = Math.round(a.position.x), i.agent.y = Math.round(a.position.y), i.agent.zIndex = os(a.position.y, 10);
					let c = a.phase === "walking";
					is(i.characterAnimator, a.facing, c, t.deltaMS, d.current), i.agent.scale.x = a.facing === "west" ? -1 : 1, a.phase !== p && (p = a.phase, f.current.onPhaseChange(a.phase));
				}), document.addEventListener("visibilitychange", m), m(), f.current.onReady();
			} catch (e) {
				let t = e instanceof Error ? e.message : "Pixel Office renderer initialization failed";
				f.current.onFailure(t), r && r.destroy({ removeView: !0 }, { children: !0 }), r = null;
			}
		})(), () => {
			n = !0, document.removeEventListener("visibilitychange", m), c.current = null, i?.characterAnimator.destroy(), r &&= (r.destroy({ removeView: !0 }, { children: !0 }), null), t.replaceChildren();
		};
	}, [e]), /* @__PURE__ */ (0, $.jsx)("div", {
		ref: s,
		className: "pixel-office-canvas-mount",
		"data-pixi-canvas": !0
	});
}
//#endregion
//#region src/app/pixelOffice/game/PixelOfficeSemanticOverlay.tsx
function ks({ manifest: t, objects: n, selectedId: r, onSelect: i }) {
	let a = new Map(n.map((e) => [e.id, e])), o = new Map(e.map((e) => [e.id, e]));
	return /* @__PURE__ */ (0, $.jsx)("div", {
		className: "pixel-office-semantic-layer",
		"aria-label": "Pixel Office 업무 공간",
		children: t.anchors.map((e) => {
			let n = a.get(e.id), s = o.get(e.id);
			return !n || !s ? null : /* @__PURE__ */ (0, $.jsxs)("button", {
				type: "button",
				className: `pixel-office-hotspot state-${n.state}${r === e.id ? " is-selected" : ""}`,
				style: {
					left: `${e.hitArea.x / t.logicalSize.width * 100}%`,
					top: `${e.hitArea.y / t.logicalSize.height * 100}%`,
					width: `${e.hitArea.width / t.logicalSize.width * 100}%`,
					height: `${e.hitArea.height / t.logicalSize.height * 100}%`
				},
				"aria-label": `${s.label}: ${n.summary}`,
				"aria-pressed": r === e.id,
				"data-office-object": e.id,
				"data-label-placement": e.labelPlacement,
				onClick: () => i(e.id),
				children: [/* @__PURE__ */ (0, $.jsx)("span", {
					className: "pixel-office-hotspot-dot",
					"aria-hidden": "true"
				}), /* @__PURE__ */ (0, $.jsx)("span", {
					className: "pixel-office-hotspot-label",
					"aria-hidden": "true",
					children: s.shortLabel
				})]
			}, e.id);
		})
	});
}
//#endregion
//#region src/app/pixelOffice/game/PixelOfficeGameScene.tsx
var As = {
	idle: "대기 중",
	route_pending: "이동 경로 확인 중",
	walking: "업무 위치로 이동 중",
	arriving: "업무 위치에 도착",
	working: "작업 중",
	waiting: "작업 준비 중",
	complete: "작업 완료",
	error: "확인 필요"
};
function js({ objects: e, selectedId: t, onSelect: n, activity: i, reducedMotion: a, fallbackCharacter: o }) {
	let [s, c] = (0, U.useState)(!1), [l, u] = (0, U.useState)(""), [d, f] = (0, U.useState)("idle"), p = (0, U.useMemo)(() => va(i), [i]), m = (0, U.useMemo)(() => {
		let t = {};
		for (let n of e) t[n.id] = n.state;
		return t;
	}, [e]), h = (0, U.useCallback)((e) => u(e), []);
	return l ? /* @__PURE__ */ (0, $.jsxs)("div", {
		className: "pixel-office-renderer-fallback",
		"data-renderer": "css",
		"data-renderer-error": l,
		children: [/* @__PURE__ */ (0, $.jsx)(r, {
			objects: e,
			selectedId: t,
			onSelect: n,
			character: o,
			characterAnchor: i.anchor
		}), /* @__PURE__ */ (0, $.jsx)("p", {
			className: "pixel-office-fallback-note",
			role: "status",
			children: "호환 모드로 장면을 표시하고 있습니다."
		})]
	}) : /* @__PURE__ */ (0, $.jsx)("section", {
		className: "pixel-office-game-frame",
		"aria-label": "Pixel Office 업무 공간",
		"data-renderer": "pixi",
		"data-ready": s ? "true" : "false",
		children: /* @__PURE__ */ (0, $.jsxs)("div", {
			className: "pixel-office-game-viewport",
			children: [
				/* @__PURE__ */ (0, $.jsx)(Os, {
					manifest: ya,
					statuses: m,
					intent: p,
					reducedMotion: a,
					onReady: () => c(!0),
					onFailure: h,
					onPhaseChange: f
				}),
				/* @__PURE__ */ (0, $.jsx)(ks, {
					manifest: ya,
					objects: e,
					selectedId: t,
					onSelect: n
				}),
				!s && /* @__PURE__ */ (0, $.jsx)("div", {
					className: "pixel-office-canvas-loading",
					children: "오피스 불러오는 중"
				}),
				/* @__PURE__ */ (0, $.jsxs)("div", {
					className: "pixel-office-agent-caption",
					"aria-live": "polite",
					children: [/* @__PURE__ */ (0, $.jsx)("span", { children: As[d] }), /* @__PURE__ */ (0, $.jsx)("strong", { children: i.label })]
				})
			]
		})
	});
}
//#endregion
export { js as PixelOfficeGameScene, qt as i, Ti as n, Mr as r, _a as t };
