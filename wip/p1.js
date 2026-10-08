import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* =====================================================================
   UTILIDADES
   ===================================================================== */
const $ = (id) => document.getElementById(id);
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TAU = Math.PI * 2;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();

function hash(ix, iy, s) {
  let n = (ix * 374761393 + iy * 668265263 + s * 982451653) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n = n ^ (n >>> 16);
  return (n >>> 0) / 4294967295;
}
// ruido de valor periódico (tileable)
function vn(x, y, px, py, s) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const x0 = ((xi % px) + px) % px, x1 = (x0 + 1) % px;
  const y0 = ((yi % py) + py) % py, y1 = (y0 + 1) % py;
  const a = hash(x0, y0, s), b = hash(x1, y0, s), c = hash(x0, y1, s), d = hash(x1, y1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(u, v, px, py, s, oct = 4) {
  let a = 0.5, f = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) { sum += a * vn(u * px * f, v * py * f, px * f, py * f, s + i * 17); norm += a; a *= 0.5; f *= 2; }
  return sum / norm;
}
function ridged(u, v, px, py, s, oct = 4) {
  let a = 0.5, f = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) { const n = 1 - Math.abs(vn(u * px * f, v * py * f, px * f, py * f, s + i * 31) * 2 - 1); sum += a * n * n; norm += a; a *= 0.5; f *= 2; }
  return sum / norm;
}

/* =====================================================================
   TEXTURAS PROCEDURALES (PBR: color + normal + rugosidad)
   ===================================================================== */
const TEX = {};
let maxAniso = 8;
function makeCanvas(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function texFrom(canvas, srgb = true, rep = 1) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep, rep);
  t.anisotropy = maxAniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}
function normalFromHeight(H, size, strength) {
  const c = makeCanvas(size), ctx = c.getContext('2d'), img = ctx.createImageData(size, size), d = img.data;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const xl = (x - 1 + size) % size, xr = (x + 1) % size, yu = (y - 1 + size) % size, yd = (y + 1) % size;
    const dx = (H[y * size + xr] - H[y * size + xl]) * strength;
    const dy = (H[yd * size + x] - H[yu * size + x]) * strength;
    let nx = -dx, ny = dy, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const i = (y * size + x) * 4;
    d[i] = (nx * 0.5 + 0.5) * 255; d[i + 1] = (ny * 0.5 + 0.5) * 255; d[i + 2] = (nz * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0); return c;
}
/* fn(u,v,o,base) => o = [r,g,b,height,rough,alpha] (0..1) */
function pixelTex(size, fn, { base = null, normal = 3, alpha = false } = {}) {
  const c = makeCanvas(size), ctx = c.getContext('2d');
  let bd = null;
  if (base) { const bc = makeCanvas(size); const bctx = bc.getContext('2d'); base(bctx, size); bd = bctx.getImageData(0, 0, size, size).data; }
  const img = ctx.createImageData(size, size), d = img.data;
  const rc = makeCanvas(size), rctx = rc.getContext('2d'), rimg = rctx.createImageData(size, size), rd = rimg.data;
  const H = new Float32Array(size * size);
  const o = [0, 0, 0, 0.5, 0.8, 1], b = [0, 0, 0, 0];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    if (bd) { b[0] = bd[i] / 255; b[1] = bd[i + 1] / 255; b[2] = bd[i + 2] / 255; b[3] = bd[i + 3] / 255; }
    o[3] = 0.5; o[4] = 0.8; o[5] = 1;
    fn(x / size, y / size, o, b, x, y);
    d[i] = clamp(o[0], 0, 1) * 255; d[i + 1] = clamp(o[1], 0, 1) * 255; d[i + 2] = clamp(o[2], 0, 1) * 255; d[i + 3] = alpha ? clamp(o[5], 0, 1) * 255 : 255;
    H[y * size + x] = o[3];
    const r = clamp(o[4], 0, 1) * 255; rd[i] = r; rd[i + 1] = r; rd[i + 2] = r; rd[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0); rctx.putImageData(rimg, 0, 0);
  const res = { map: texFrom(c, true), roughnessMap: texFrom(rc, false), canvas: c };
  if (normal > 0) res.normalMap = texFrom(normalFromHeight(H, size, normal * size / 256), false);
  return res;
}
function mat(t, extra = {}) {
  const m = new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap || null, roughnessMap: t.roughnessMap || null, roughness: 1, metalness: 0, ...extra });
  return m;
}

const TEXGEN = {
  woodFloor() {
    return pixelTex(512, (u, v, o) => {
      const rows = 6, r = Math.floor(v * rows), pv = (v * rows) % 1;
      const off = hash(r, 1, 3), pu = u * 2 + off, pl = Math.floor(pu), fu = pu - pl;
      const tint = hash(pl, r, 5);
      const g = fbm(u, v, 3, 40, r * 7 + pl, 4);
      const rings = 0.5 + 0.5 * Math.sin(g * 38 + tint * 10);
      const dirt = fbm(u, v, 4, 4, 99, 4);
      let k = (0.62 + tint * 0.45) * (0.78 + rings * 0.28) * (0.8 + dirt * 0.35);
      o[0] = 0.36 * k; o[1] = 0.22 * k; o[2] = 0.13 * k;
      o[3] = 0.6 + rings * 0.06; o[4] = 0.42 + dirt * 0.35;
      const scratch = vn(u * 120, v * 6, 120, 6, 77 + r);
      if (scratch > 0.93) { o[0] *= 1.25; o[1] *= 1.2; o[2] *= 1.15; o[4] = 0.8; }
      if (pv < 0.025 || pv > 0.975 || fu < 0.006 || fu > 0.994) { o[0] *= 0.25; o[1] *= 0.25; o[2] *= 0.25; o[3] = 0.1; o[4] = 0.95; }
    }, { normal: 3 });
  },
  wallpaper(col = [0.42, 0.45, 0.36], acc = [0.30, 0.33, 0.25]) {
    return pixelTex(512, (u, v, o, b) => {
      const stain = fbm(u, v, 3, 3, 21, 5), peel = ridged(u, v, 5, 5, 41, 4);
      let r = b[0], g = b[1], bb = b[2];
      const w = fbm(u, v, 16, 16, 9, 3) * 0.15 + 0.92;
      r *= w; g *= w; bb *= w;
      if (stain > 0.6) { const s = smooth(clamp((stain - 0.6) * 4, 0, 1)); r = lerp(r, r * 0.72 + 0.08, s); g = lerp(g, g * 0.66 + 0.05, s); bb = lerp(bb, bb * 0.5, s); }
      if (stain > 0.6 && stain < 0.62) { r *= 0.7; g *= 0.65; bb *= 0.55; }
      const mold = fbm(u, v, 24, 24, 63, 3);
      if (mold > 0.72) { r *= 0.55; g *= 0.6; bb *= 0.5; }
      o[3] = 0.5; o[4] = 0.88;
      if (peel > 0.86) { r = 0.68; g = 0.64; bb = 0.56; o[3] = 0.35; o[4] = 0.95; }
      o[0] = r; o[1] = g; o[2] = bb;
    }, {
      base: (ctx, s) => {
        ctx.fillStyle = `rgb(${col.map((c) => c * 255).join(',')})`; ctx.fillRect(0, 0, s, s);
        ctx.strokeStyle = `rgba(${acc.map((c) => c * 255).join(',')},0.9)`; ctx.fillStyle = `rgba(${acc.map((c) => c * 255).join(',')},0.85)`;
        for (let i = 0; i < 8; i++) { ctx.fillRect(i * s / 8, 0, 3, s); }
        for (let gx = 0; gx < 4; gx++) for (let gy = 0; gy < 4; gy++) {
          const cx = (gx + 0.5) * s / 4 + (gy % 2) * s / 8, cy = (gy + 0.5) * s / 4;
          ctx.save(); ctx.translate(cx, cy);
          ctx.lineWidth = 2.2;
          for (let k = 0; k < 2; k++) {
            ctx.save(); ctx.scale(k ? -1 : 1, 1);
            ctx.beginPath(); ctx.moveTo(0, -42); ctx.bezierCurveTo(26, -34, 30, -6, 8, 4); ctx.bezierCurveTo(22, 14, 18, 36, 0, 44); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(14, -16, 6, 11, 0.5, 0, TAU); ctx.fill();
            ctx.beginPath(); ctx.ellipse(12, 22, 5, 9, -0.5, 0, TAU); ctx.fill();
            ctx.restore();
          }
          ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(4, -50); ctx.lineTo(0, -46); ctx.lineTo(-4, -50); ctx.fill();
          ctx.restore();
        }
      }, normal: 1.2,
    });
  },
  plaster(c = [0.62, 0.6, 0.55]) {
    return pixelTex(512, (u, v, o) => {
      const n = fbm(u, v, 8, 8, 5, 5), cr = ridged(u, v, 3, 3, 15, 5), st = fbm(u, v, 2, 2, 25, 4);
      let k = 0.88 + n * 0.18;
      o[0] = c[0] * k; o[1] = c[1] * k; o[2] = c[2] * k; o[3] = n * 0.6; o[4] = 0.92;
      if (st > 0.58) { const s = clamp((st - 0.58) * 5, 0, 1); o[0] -= 0.12 * s; o[1] -= 0.15 * s; o[2] -= 0.2 * s; }
      if (cr > 0.9) { o[0] *= 0.45; o[1] *= 0.45; o[2] *= 0.45; o[3] = 0.1; }
    }, { normal: 2 });
  },
  tiles() {
    return pixelTex(512, (u, v, o) => {
      const n = 8, tu = u * n, tv = v * n, ix = Math.floor(tu), iy = Math.floor(tv), fu = tu - ix, fv = tv - iy;
      const dark = (ix + iy) % 2 === 0, vr = hash(ix, iy, 8) * 0.08;
      const dirt = fbm(u, v, 6, 6, 81, 4);
      let c = dark ? 0.08 + vr : 0.72 + vr; c *= 0.82 + dirt * 0.25;
      o[0] = c; o[1] = c * 0.98; o[2] = c * 0.92; o[3] = 0.7; o[4] = 0.18 + dirt * 0.35;
      const crack = ridged(u, v, 4, 4, 17 + ix, 3);
      if (crack > 0.93 && hash(ix, iy, 2) > 0.7) { o[0] *= 0.4; o[1] *= 0.4; o[2] *= 0.4; o[3] = 0.4; }
      const gw = 0.035;
      if (fu < gw || fv < gw || fu > 1 - gw || fv > 1 - gw) { const g = 0.25 + dirt * 0.12; o[0] = g; o[1] = g * 0.95; o[2] = g * 0.85; o[3] = 0.2; o[4] = 0.95; }
    }, { normal: 2 });
  },
  concrete(c = [0.42, 0.41, 0.39]) {
    return pixelTex(512, (u, v, o) => {
      const n = fbm(u, v, 6, 6, 3, 6), p = hash(Math.floor(u * 512), Math.floor(v * 512), 4), drip = fbm(u, v, 14, 1.5, 33, 4), wet = fbm(u, v, 2, 2, 71, 4);
      let k = 0.75 + n * 0.45; if (p > 0.985) k *= 0.6;
      o[0] = c[0] * k; o[1] = c[1] * k; o[2] = c[2] * k; o[3] = n * 0.8 + (p > 0.985 ? -0.3 : 0); o[4] = 0.9;
      if (drip > 0.62) { const s = clamp((drip - 0.62) * 4, 0, 1); o[0] -= 0.1 * s; o[1] -= 0.09 * s; o[2] -= 0.06 * s; }
      if (wet > 0.6) { const s = clamp((wet - 0.6) * 5, 0, 1); o[0] *= 1 - 0.35 * s; o[1] *= 1 - 0.35 * s; o[2] *= 1 - 0.3 * s; o[4] = lerp(0.9, 0.25, s); }
      const cr = ridged(u, v, 3, 3, 91, 5); if (cr > 0.92) { o[0] *= 0.5; o[1] *= 0.5; o[2] *= 0.5; o[3] -= 0.4; }
    }, { normal: 3 });
  },
  brick() {
    return pixelTex(512, (u, v, o) => {
      const rows = 16, r = Math.floor(v * rows), fv = v * rows - r, bu = u * 4 + (r % 2) * 0.5, bi = Math.floor(bu), fu = bu - bi;
      const t = hash(bi, r, 6), n = fbm(u, v, 16, 16, 12, 4), soot = fbm(u, v, 2, 2, 55, 4);
      let k = (0.7 + n * 0.4);
      o[0] = (0.42 + t * 0.12) * k; o[1] = (0.18 + t * 0.06) * k; o[2] = (0.12 + t * 0.04) * k; o[3] = 0.7 + n * 0.2; o[4] = 0.85;
      if (soot > 0.55) { const s = clamp((soot - 0.55) * 3, 0, 0.85); o[0] *= 1 - s; o[1] *= 1 - s; o[2] *= 1 - s; }
      if (fv < 0.08 || fu < 0.03) { o[0] = 0.32; o[1] = 0.3; o[2] = 0.27; o[3] = 0.2; o[4] = 0.98; }
    }, { normal: 3 });
  },
  rust() {
    return pixelTex(512, (u, v, o) => {
      const n = fbm(u, v, 5, 5, 44, 6), m = fbm(u, v, 30, 30, 2, 3);
      const rusty = smooth(clamp((n - 0.45) * 4, 0, 1));
      o[0] = lerp(0.42, 0.38 + m * 0.15, rusty); o[1] = lerp(0.42, 0.17 + m * 0.06, rusty); o[2] = lerp(0.43, 0.08, rusty);
      o[3] = 0.5 + rusty * m * 0.4; o[4] = lerp(0.38, 0.95, rusty);
      const sc = vn(u * 200, v * 8, 200, 8, 3); if (sc > 0.94 && rusty < 0.5) { o[0] += 0.2; o[1] += 0.2; o[2] += 0.2; o[4] = 0.25; }
    }, { normal: 2 });
  },
  endo() {
    return pixelTex(512, (u, v, o) => {
      const n = fbm(u, v, 6, 6, 404, 5), g = fbm(u, v, 3, 3, 405, 4), sc = vn(u * 260, v * 10, 260, 10, 406);
      let c = 0.28 + n * 0.12;
      o[0] = c; o[1] = c * 0.98; o[2] = c * 1.0; o[3] = 0.5; o[4] = 0.35 + n * 0.2;
      if (g > 0.58) { const s = clamp((g - 0.58) * 4, 0, 1); o[0] = lerp(o[0], 0.12, s); o[1] = lerp(o[1], 0.09, s); o[2] = lerp(o[2], 0.06, s); o[4] = lerp(o[4], 0.9, s); }
      if (n > 0.66) { o[0] = 0.33; o[1] = 0.15; o[2] = 0.06; o[4] = 0.95; o[3] = 0.6; }
      if (sc > 0.95) { o[0] += 0.18; o[1] += 0.18; o[2] += 0.18; o[4] = 0.2; o[3] = 0.4; }
    }, { normal: 2 });
  },
  darkWood(c = [0.22, 0.12, 0.07]) {
    return pixelTex(512, (u, v, o) => {
      const g = fbm(u, v, 2, 26, 61, 5), rings = 0.5 + 0.5 * Math.sin(g * 30), w = fbm(u, v, 4, 4, 62, 4);
      const k = 0.75 + rings * 0.3 + w * 0.15;
      o[0] = c[0] * k; o[1] = c[1] * k; o[2] = c[2] * k; o[3] = rings * 0.3; o[4] = 0.45 + w * 0.3;
      if (w > 0.66) { o[0] *= 1.35; o[1] *= 1.3; o[2] *= 1.25; o[4] = 0.9; }
    }, { normal: 1.5 });
  },
  fabric(c = [0.32, 0.08, 0.07]) {
    return pixelTex(256, (u, v, o, b, x, y) => {
      const wv = (Math.sin(x * 1.6) * Math.sin(y * 1.6)) * 0.5 + 0.5, wear = fbm(u, v, 3, 3, 71, 4), dirt = fbm(u, v, 8, 8, 72, 3);
      let k = 0.7 + wv * 0.25;
      const fade = smooth(clamp((wear - 0.55) * 4, 0, 1));
      o[0] = lerp(c[0], c[0] * 1.6 + 0.12, fade) * k * (0.85 + dirt * 0.25); o[1] = lerp(c[1], c[1] * 1.6 + 0.1, fade) * k * (0.85 + dirt * 0.25); o[2] = lerp(c[2], c[2] * 1.5 + 0.08, fade) * k * (0.85 + dirt * 0.25);
      o[3] = wv * 0.5; o[4] = 0.95;
    }, { normal: 1.5 });
  },
  rug() {
    return pixelTex(512, (u, v, o, b) => {
      const wear = fbm(u, v, 5, 5, 801, 5), thread = (Math.sin(u * 1400) * 0.5 + 0.5) * 0.12;
      const f = smooth(clamp((wear - 0.6) * 4, 0, 1));
      o[0] = lerp(b[0], 0.5, f) * (0.9 + thread); o[1] = lerp(b[1], 0.42, f) * (0.9 + thread); o[2] = lerp(b[2], 0.32, f) * (0.9 + thread);
      const dirt = fbm(u, v, 3, 3, 802, 4); o[0] *= 0.75 + dirt * 0.3; o[1] *= 0.75 + dirt * 0.3; o[2] *= 0.75 + dirt * 0.3;
      o[3] = 0.5 + thread; o[4] = 0.98;
    }, {
      base: (ctx, s) => {
        ctx.fillStyle = '#5a1512'; ctx.fillRect(0, 0, s, s);
        const band = (m, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.strokeRect(m, m, s - 2 * m, s - 2 * m); };
        band(14, '#1d2340', 20); band(34, '#c9a66b', 5); band(46, '#1d2340', 10); band(60, '#c9a66b', 3);
        for (let i = 0; i < 24; i++) { const p = 70 + i * (s - 140) / 23; ctx.fillStyle = '#c9a66b'; ctx.beginPath(); ctx.arc(p, 24, 4, 0, TAU); ctx.arc(p, s - 24, 4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(24, p, 4, 0, TAU); ctx.arc(s - 24, p, 4, 0, TAU); ctx.fill(); }
        ctx.save(); ctx.translate(s / 2, s / 2);
        const dia = (r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.8, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.8, 0); ctx.fill(); };
        dia(170, '#1d2340'); dia(150, '#c9a66b'); dia(138, '#7a1c16'); dia(90, '#1d2340'); dia(60, '#d8c29a'); dia(30, '#5a1512');
        for (let k = 0; k < 8; k++) { ctx.rotate(TAU / 8); ctx.fillStyle = '#d8c29a'; ctx.beginPath(); ctx.ellipse(0, -110, 6, 16, 0, 0, TAU); ctx.fill(); }
        ctx.restore();
      }, normal: 1,
    });
  },
  atticBoards() {
    return pixelTex(512, (u, v, o) => {
      let acc = 0, bi = 0; const widths = [0.13, 0.11, 0.15, 0.12, 0.14, 0.1, 0.13, 0.12];
      for (bi = 0; bi < widths.length; bi++) { if (u < acc + widths[bi]) break; acc += widths[bi]; }
      const fu = (u - acc) / (widths[bi] || 0.12);
      const t = hash(bi, 0, 91), g = fbm(u, v, 3, 30, 92 + bi, 5), rings = 0.5 + 0.5 * Math.sin(g * 26 + t * 6), dust = fbm(u, v, 4, 4, 93, 4);
      let k = (0.6 + t * 0.35) * (0.8 + rings * 0.3);
      o[0] = 0.38 * k; o[1] = 0.27 * k; o[2] = 0.17 * k; o[3] = 0.5 + rings * 0.15; o[4] = 0.85;
      const kx = (u - acc - widths[bi] * 0.5) * 7, ky = ((v + t) % 0.33 - 0.16) * 6; const kd = Math.hypot(kx, ky);
      if (hash(bi, 3, 3) > 0.5 && kd < 0.12) { o[0] *= 0.35; o[1] *= 0.3; o[2] *= 0.28; o[3] = 0.3; }
      if (dust > 0.55) { const s = clamp((dust - 0.55) * 2, 0, 0.55); o[0] = lerp(o[0], 0.42, s); o[1] = lerp(o[1], 0.4, s); o[2] = lerp(o[2], 0.37, s); }
      if (fu < 0.03 || fu > 0.97) { o[0] *= 0.2; o[1] *= 0.2; o[2] *= 0.2; o[3] = 0.05; }
    }, { normal: 3 });
  },
  cardboard() {
    return pixelTex(256, (u, v, o) => {
      const n = fbm(u, v, 6, 6, 141, 4), corr = 0.5 + 0.5 * Math.sin(u * 160), st = fbm(u, v, 2, 2, 142, 4);
      o[0] = (0.5 + n * 0.12) * (0.95 + corr * 0.05); o[1] = (0.36 + n * 0.08) * (0.95 + corr * 0.05); o[2] = (0.2 + n * 0.05); o[3] = corr * 0.15 + n * 0.2; o[4] = 0.95;
      if (st > 0.62) { o[0] *= 0.7; o[1] *= 0.66; o[2] *= 0.6; }
      if (v > 0.45 && v < 0.55) { o[0] = 0.62; o[1] = 0.55; o[2] = 0.38; o[4] = 0.45; }
    }, { normal: 1 });
  },
  bark() {
    return pixelTex(512, (u, v, o) => {
      const r = ridged(u, v, 8, 2, 151, 5), n = fbm(u, v, 10, 10, 152, 4), moss = fbm(u, v, 3, 3, 153, 4);
      let k = 0.45 + r * 0.6;
      o[0] = 0.24 * k * (0.8 + n * 0.4); o[1] = 0.2 * k * (0.8 + n * 0.4); o[2] = 0.16 * k * (0.8 + n * 0.4); o[3] = r; o[4] = 0.95;
      if (moss > 0.6 && r < 0.5) { const s = clamp((moss - 0.6) * 4, 0, 0.8); o[0] = lerp(o[0], 0.14, s); o[1] = lerp(o[1], 0.2, s); o[2] = lerp(o[2], 0.08, s); }
    }, { normal: 5 });
  },
  ground() {
    return pixelTex(512, (u, v, o, b) => {
      const n = fbm(u, v, 6, 6, 161, 5), wet = fbm(u, v, 2, 2, 162, 4), pebble = hash(Math.floor(u * 128), Math.floor(v * 128), 163);
      let r = 0.17 + n * 0.08, g = 0.13 + n * 0.06, bl = 0.09 + n * 0.04, h = n * 0.5, ro = 0.92;
      if (b[3] > 0.1) { r = lerp(r, b[0], b[3]); g = lerp(g, b[1], b[3]); bl = lerp(bl, b[2], b[3]); h += 0.25 * b[3]; }
      if (pebble > 0.985) { r = 0.3; g = 0.29; bl = 0.27; h = 0.9; }
      if (wet > 0.62) { const s = clamp((wet - 0.62) * 5, 0, 1); r *= 1 - 0.45 * s; g *= 1 - 0.45 * s; bl *= 1 - 0.4 * s; ro = lerp(ro, 0.08, s); h = lerp(h, 0.2, s); }
      o[0] = r; o[1] = g; o[2] = bl; o[3] = h; o[4] = ro;
    }, {
      base: (ctx, s) => {
        ctx.clearRect(0, 0, s, s);
        const cols = ['#4a2c14', '#5e3a17', '#3a2814', '#6b4a1c', '#2e2a14', '#523018'];
        for (let i = 0; i < 520; i++) {
          const x = Math.random() * s, y = Math.random() * s, r = rand(4, 11);
          ctx.save(); ctx.translate(x, y); ctx.rotate(rand(0, TAU)); ctx.fillStyle = pick(cols); ctx.globalAlpha = rand(0.5, 0.95);
          ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.6, 0, 0, r); ctx.quadraticCurveTo(-r * 0.6, 0, 0, -r); ctx.fill(); ctx.restore();
        }
        ctx.strokeStyle = '#3d2a12'; ctx.lineWidth = 1;
        for (let i = 0; i < 300; i++) { const x = Math.random() * s, y = Math.random() * s, a = rand(0, TAU), l = rand(5, 12); ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }, normal: 3,
    });
  },
  grassGround() {
    return pixelTex(512, (u, v, o) => {
      const n = fbm(u, v, 8, 8, 171, 5), m = fbm(u, v, 2, 2, 172, 4), bl = vn(u * 180, v * 180, 180, 180, 173);
      const mud = smooth(clamp((m - 0.5) * 3, 0, 1));
      o[0] = lerp(0.1 + bl * 0.05, 0.17, mud) * (0.8 + n * 0.4); o[1] = lerp(0.14 + bl * 0.08, 0.12, mud) * (0.8 + n * 0.4); o[2] = lerp(0.06, 0.08, mud) * (0.8 + n * 0.4);
      o[3] = bl * (1 - mud) * 0.6 + n * 0.3; o[4] = lerp(0.9, 0.3, mud * mud);
    }, { normal: 2 });
  },
  siding() {
    return pixelTex(512, (u, v, o) => {
      const rows = 10, fv = (v * rows) % 1, n = fbm(u, v, 4, 4, 181, 5), dirt = fbm(u, v, 2, 6, 182, 4);
      let k = 0.75 + n * 0.25 - fv * 0.15;
      o[0] = 0.48 * k; o[1] = 0.5 * k; o[2] = 0.47 * k; o[3] = 1 - fv; o[4] = 0.8;
      if (dirt > 0.55) { const s = clamp((dirt - 0.55) * 2, 0, 0.6); o[0] *= 1 - s; o[1] *= 1 - s; o[2] *= 1 - s * 1.1; }
      if (fv > 0.93) { o[0] *= 0.35; o[1] *= 0.35; o[2] *= 0.35; o[3] = 0; }
    }, { normal: 3 });
  },
  door() {
    return pixelTex(512, (u, v, o) => {
      const n = fbm(u, v, 3, 3, 191, 5), chip = fbm(u, v, 10, 10, 192, 4), g = fbm(u, v, 2, 24, 193, 4);
      let pan = 0;
      const inR = (x0, y0, x1, y1) => u > x0 && u < x1 && v > y0 && v < y1;
      if (inR(0.15, 0.08, 0.85, 0.42) || inR(0.15, 0.55, 0.85, 0.92)) pan = 1;
      const edge = (inR(0.13, 0.06, 0.87, 0.44) && !inR(0.17, 0.1, 0.83, 0.4)) || (inR(0.13, 0.53, 0.87, 0.94) && !inR(0.17, 0.57, 0.83, 0.9));
      let k = 0.86 + n * 0.12;
      o[0] = 0.72 * k; o[1] = 0.7 * k; o[2] = 0.64 * k; o[3] = pan ? 0.4 : 0.6; o[4] = 0.55;
      if (edge) { o[3] = 0.5; o[0] *= 0.85; o[1] *= 0.85; o[2] *= 0.85; }
      if (chip > 0.68) { const r = 0.5 + 0.5 * Math.sin(g * 30); o[0] = 0.32 * (0.7 + r * 0.3); o[1] = 0.2 * (0.7 + r * 0.3); o[2] = 0.11; o[3] = 0.3; o[4] = 0.8; }
      const grime = fbm(u, v, 2, 2, 194, 3); if (grime > 0.6) { o[0] *= 0.75; o[1] *= 0.72; o[2] *= 0.68; }
    }, { normal: 2 });
  },
  velvet(c = [0.28, 0.04, 0.05]) {
    return pixelTex(256, (u, v, o) => {
      const f = 0.5 + 0.5 * Math.sin(u * TAU * 6 + fbm(u, v, 4, 4, 201, 3) * 3), d = fbm(u, v, 3, 6, 202, 4);
      const k = 0.55 + f * 0.6;
      o[0] = c[0] * k * (0.8 + d * 0.4); o[1] = c[1] * k * (0.8 + d * 0.4); o[2] = c[2] * k * (0.8 + d * 0.4); o[3] = f; o[4] = 0.9;
      if (v > 0.9) { const s = (v - 0.9) * 8; o[0] = lerp(o[0], 0.25, s * 0.5); o[1] = lerp(o[1], 0.2, s * 0.5); o[2] = lerp(o[2], 0.15, s * 0.5); }
    }, { normal: 2 });
  },
  fur(col, holes = 0.6, seed = 1, burn = 0.5) {
    const alpha = pixelTex(512, (u, v, o) => {
      const n = fbm(u, v, 5, 5, 300 + seed, 5) + (vn(u * 64, v * 64, 64, 64, 310 + seed) - 0.5) * 0.12;
      o[0] = o[1] = o[2] = n > holes ? 0 : 1; o[4] = 1; o[3] = 0;
    }, { normal: 0 });
    const t = pixelTex(512, (u, v, o) => {
      const strands = fbm(u, v, 48, 6, 320 + seed, 3), clump = fbm(u, v, 10, 10, 330 + seed, 4), dirt = fbm(u, v, 3, 3, 340 + seed, 5), hole = fbm(u, v, 5, 5, 300 + seed, 5);
      let k = 0.65 + strands * 0.45 + clump * 0.15;
      let r = col[0] * k, g = col[1] * k, b = col[2] * k;
      if (dirt > 0.5) { const s = clamp((dirt - 0.5) * 2.5, 0, 0.75); r = lerp(r, 0.06, s); g = lerp(g, 0.045, s); b = lerp(b, 0.03, s); }
      const bn = fbm(u, v, 4, 4, 350 + seed, 4);
      if (bn > 1 - burn * 0.45) { const s = clamp((bn - (1 - burn * 0.45)) * 6, 0, 1); r = lerp(r, 0.02, s); g = lerp(g, 0.018, s); b = lerp(b, 0.015, s); }
      const edge = clamp(1 - Math.abs(hole - holes) * 14, 0, 1);
      if (edge > 0) { r = lerp(r, col[0] * 0.5 + 0.25, edge * 0.7); g = lerp(g, col[1] * 0.5 + 0.22, edge * 0.7); b = lerp(b, col[2] * 0.5 + 0.18, edge * 0.7); }
      const oil = fbm(u, v, 6, 2, 360 + seed, 3); if (oil > 0.68) { r *= 0.4; g *= 0.38; b *= 0.36; }
      o[0] = r; o[1] = g; o[2] = b; o[3] = strands * 0.7 + clump * 0.3; o[4] = 0.97 - (oil > 0.68 ? 0.4 : 0);
    }, { normal: 4 });
    t.alphaMap = alpha.map; alpha.map.colorSpace = THREE.NoColorSpace;
    return t;
  },
  leafCard() {
    const c = makeCanvas(256), ctx = c.getContext('2d');
    const cols = ['#24301a', '#2f3b1c', '#3a3a1a', '#1e2914', '#45401c', '#2a2412', '#3c2f15'];
    ctx.strokeStyle = '#2a1d10'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(128, 250); ctx.quadraticCurveTo(120, 140, 130, 20); ctx.stroke();
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 9; i++) { const y = 230 - i * 24; ctx.beginPath(); ctx.moveTo(126, y); ctx.lineTo(126 + (i % 2 ? 60 : -60), y - 40); ctx.stroke(); }
    for (let i = 0; i < 46; i++) {
      const a = rand(0, TAU), d = rand(10, 105), x = 128 + Math.cos(a) * d * 0.9, y = 128 + Math.sin(a) * d, r = rand(12, 22);
      ctx.save(); ctx.translate(x, y); ctx.rotate(rand(0, TAU)); ctx.fillStyle = pick(cols);
      ctx.beginPath(); ctx.moveTo(0, -r); ctx.bezierCurveTo(r * 0.7, -r * 0.4, r * 0.5, r * 0.6, 0, r); ctx.bezierCurveTo(-r * 0.5, r * 0.6, -r * 0.7, -r * 0.4, 0, -r); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke();
      ctx.restore();
    }
    return { map: texFrom(c, true) };
  },
  pineCard() {
    const c = makeCanvas(256), ctx = c.getContext('2d');
    ctx.strokeStyle = '#2b1f12'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(10, 128); ctx.lineTo(250, 128); ctx.stroke();
    for (let i = 0; i < 90; i++) {
      const x = rand(15, 245), side = Math.random() < 0.5 ? -1 : 1, len = rand(18, 50) * (1 - x / 400);
      ctx.strokeStyle = pick(['#14210f', '#1b2a13', '#223217', '#101a0c']); ctx.lineWidth = rand(1.5, 3);
      ctx.beginPath(); ctx.moveTo(x, 128); ctx.lineTo(x + len * 0.6, 128 + side * len); ctx.stroke();
    }
    return { map: texFrom(c, true) };
  },
  cobweb() {
    const c = makeCanvas(256), ctx = c.getContext('2d');
    ctx.strokeStyle = 'rgba(220,220,215,0.55)'; ctx.lineWidth = 1;
    const spokes = 11;
    for (let i = 0; i < spokes; i++) { const a = i / spokes * Math.PI * 0.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 256, Math.sin(a) * 256); ctx.stroke(); }
    for (let r = 14; r < 250; r += rand(10, 20)) { ctx.beginPath(); for (let i = 0; i <= spokes; i++) { const a = i / spokes * Math.PI * 0.5, rr = r + rand(-4, 4); const x = Math.cos(a) * rr, y = Math.sin(a) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
    return { map: texFrom(c, true) };
  },
  soft() {
    const c = makeCanvas(64), ctx = c.getContext('2d'), g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64); return { map: texFrom(c, true) };
  },
  cookie() {
    const s = 256, c = makeCanvas(s), ctx = c.getContext('2d'), img = ctx.createImageData(s, s), d = img.data;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const dx = (x - s / 2) / (s / 2), dy = (y - s / 2) / (s / 2), r = Math.hypot(dx, dy);
      let v = Math.exp(-r * r * 4.5) * 0.85 + 0.25 * Math.exp(-Math.pow((r - 0.62) * 9, 2)) + 0.12 * (1 - r);
      v *= 0.88 + 0.12 * fbm(x / s, y / s, 4, 4, 900, 3);
      v += 0.08 * Math.exp(-Math.pow((r - 0.35) * 14, 2));
      const k = clamp(v, 0, 1) * 255; const i = (y * s + x) * 4;
      d[i] = k; d[i + 1] = k * 0.97; d[i + 2] = k * 0.88; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0); const t = texFrom(c, true); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return { map: t };
  },
};

/* --- dibujos y textos ---------------------------------------------- */
function paperDrawing(idx) {
  const c = makeCanvas(256, 340), ctx = c.getContext('2d');
  ctx.fillStyle = '#e4dcc6'; ctx.fillRect(0, 0, 256, 340);
  for (let i = 0; i < 6; i++) { const g = ctx.createRadialGradient(rand(0, 256), rand(0, 340), 0, rand(0, 256), rand(0, 340), rand(30, 120)); g.addColorStop(0, 'rgba(120,80,30,.25)'); g.addColorStop(1, 'rgba(120,80,30,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 340); }
  ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.beginPath(); ctx.moveTo(0, 170); ctx.lineTo(256, 170); ctx.stroke();
  const crayon = (col, w, pts) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; for (let k = 0; k < 3; k++) { ctx.globalAlpha = 0.55; ctx.beginPath(); pts.forEach((p, i) => { const x = p[0] + rand(-1.5, 1.5), y = p[1] + rand(-1.5, 1.5); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); } ctx.globalAlpha = 1; };
  const circ = (x, y, r, n = 18) => { const p = []; for (let i = 0; i <= n; i++) p.push([x + Math.cos(i / n * TAU) * r, y + Math.sin(i / n * TAU) * r]); return p; };
  const stick = (x, y, col, s = 1) => { crayon(col, 3, circ(x, y, 10 * s)); crayon(col, 3, [[x, y + 10 * s], [x, y + 45 * s]]); crayon(col, 3, [[x - 18 * s, y + 22 * s], [x + 18 * s, y + 22 * s]]); crayon(col, 3, [[x - 14 * s, y + 70 * s], [x, y + 45 * s], [x + 14 * s, y + 70 * s]]); };
  const monster = (x, y, col, ears) => {
    crayon(col, 4, circ(x, y, 26)); crayon(col, 4, [[x - 22, y + 24], [x - 30, y + 110], [x + 30, y + 110], [x + 22, y + 24]]);
    if (ears === 'bear') { crayon(col, 4, circ(x - 22, y - 24, 8)); crayon(col, 4, circ(x + 22, y - 24, 8)); }
    if (ears === 'rabbit') { crayon(col, 4, [[x - 10, y - 24], [x - 16, y - 80], [x - 2, y - 26]]); crayon(col, 4, [[x + 10, y - 24], [x + 22, y - 50]]); }
    if (ears === 'fox') { crayon(col, 4, [[x - 20, y - 18], [x - 26, y - 50], [x - 6, y - 26]]); crayon(col, 4, [[x + 20, y - 18], [x + 26, y - 50], [x + 6, y - 26]]); }
    if (ears === 'bird') { crayon('#d08a10', 4, [[x - 12, y + 6], [x, y + 18], [x + 12, y + 6]]); }
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x - 9, y - 4, 5, 0, TAU); ctx.arc(x + 9, y - 4, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 9, y - 4, 1.4, 0, TAU); ctx.arc(x + 9, y - 4, 1.4, 0, TAU); ctx.fill();
    crayon('#7a0000', 2, [[x - 12, y + 12], [x - 6, y + 16], [x, y + 12], [x + 6, y + 16], [x + 12, y + 12]]);
  };
  const scenes = [
    () => { monster(80, 150, '#5a3a1c', 'bear'); stick(185, 160, '#2b4aa0'); crayon('#000', 2, circ(200, 50, 22)); },
    () => { crayon('#5b3a8a', 3, [[30, 300], [30, 200], [130, 120], [230, 200], [230, 300], [30, 300]]); crayon('#000', 3, [[110, 300], [110, 240], [150, 240], [150, 300]]); monster(190, 70, '#4a4a6a', 'rabbit'); },
    () => { monster(128, 130, '#8a2a14', 'fox'); crayon('#555', 3, [[160, 170], [190, 150], [195, 175]]); crayon('#000', 2, [[20, 300], [236, 300]]); },
    () => { monster(128, 120, '#c9a10f', 'bird'); crayon('#c03', 3, circ(70, 280, 14)); crayon('#c03', 3, circ(186, 280, 14)); },
    () => { for (let i = 0; i < 7; i++) crayon('#1c3a12', 4, [[20 + i * 36, 320], [26 + i * 36, 120], [10 + i * 36, 160]]); crayon('#c9a10f', 3, circ(200, 200, 6, 8)); crayon('#c9a10f', 3, circ(214, 200, 6, 8)); },
    () => { stick(70, 140, '#2b4aa0'); stick(130, 140, '#a02b2b', 0.8); stick(190, 140, '#2ba04a', 1.2); crayon('#000', 6, [[110, 120], [150, 160]]); crayon('#000', 6, [[150, 120], [110, 160]]); },
    () => { ctx.fillStyle = '#111'; ctx.fillRect(40, 60, 176, 220); ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.arc(100, 140, 6, 0, TAU); ctx.arc(156, 140, 6, 0, TAU); ctx.fill(); },
    () => { crayon('#5a3a1c', 3, [[30, 230], [226, 230]]); for (let i = 0; i < 4; i++) monster(50 + i * 52, 160, ['#5a3a1c', '#4a4a6a', '#8a2a14', '#c9a10f'][i], ['bear', 'rabbit', 'fox', 'bird'][i]); },
    () => { stick(128, 150, '#2b4aa0', 1.3); crayon('#c00', 3, [[60, 60], [200, 60]]); crayon('#c00', 3, [[60, 280], [200, 280]]); },
    () => { crayon('#000', 3, circ(128, 160, 80, 30)); crayon('#c9a10f', 4, circ(100, 140, 10)); crayon('#c9a10f', 4, circ(156, 140, 10)); },
  ];
  const texts = ['MI PAPÁ Y TEDDY', 'HOPPER EN LA VENTANA', 'NO LE ALUMBRES', 'MAMÁ PEEP TIENE HAMBRE', 'ELLA ESPERA EN EL BOSQUE', 'NO MIRES MUCHO RATO', 'ME VE EN LA OSCURIDAD', 'NUESTRA FAMILIA', 'NO ME DEJES', 'SIGUE CONTANDO'];
  scenes[idx % scenes.length]();
  ctx.font = '20px "Homemade Apple", cursive'; ctx.fillStyle = 'rgba(30,20,10,.85)'; ctx.textAlign = 'center';
  ctx.fillText(texts[idx % texts.length], 128, 30);
  ctx.font = '16px "Homemade Apple", cursive'; ctx.fillText(String(idx + 1), 230, 330);
  const t = texFrom(c, true); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
function portrait(kind) {
  const c = makeCanvas(256, 320), ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 320); g.addColorStop(0, '#2c2418'); g.addColorStop(1, '#0f0b07'); ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 320);
  if (kind === 0) {
    const people = [[70, 150, 1], [128, 140, 1.15], [186, 160, 0.8]];
    people.forEach(([x, y, s], i) => {
      ctx.fillStyle = '#3a2c1e'; ctx.beginPath(); ctx.ellipse(x, y + 90 * s, 40 * s, 70 * s, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#9a8268'; ctx.beginPath(); ctx.ellipse(x, y, 22 * s, 28 * s, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2; for (let k = 0; k < 14; k++) { ctx.beginPath(); ctx.moveTo(x + rand(-22, 22) * s, y + rand(-26, 26) * s); ctx.lineTo(x + rand(-22, 22) * s, y + rand(-26, 26) * s); ctx.stroke(); }
    });
  } else if (kind === 1) {
    ctx.fillStyle = '#2e3a2a'; ctx.fillRect(0, 200, 256, 120);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = '#121a10'; ctx.beginPath(); const x = i * 32 + rand(-8, 8); ctx.moveTo(x, 220); ctx.lineTo(x + 16, 60 + rand(0, 50)); ctx.lineTo(x + 32, 220); ctx.fill(); }
    ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.arc(200, 60, 18, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c9a10f'; ctx.fillRect(126, 170, 3, 3); ctx.fillRect(134, 170, 3, 3);
  } else {
    ctx.fillStyle = '#5a3a1c'; ctx.beginPath(); ctx.arc(128, 150, 70, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(70, 90, 26, 0, TAU); ctx.arc(186, 90, 26, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c8b090'; ctx.beginPath(); ctx.ellipse(128, 185, 36, 26, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.arc(102, 135, 12, 0, TAU); ctx.arc(154, 135, 12, 0, TAU); ctx.fill();
    ctx.fillStyle = '#eee'; ctx.beginPath(); ctx.arc(102, 135, 3, 0, TAU); ctx.arc(154, 135, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(98, 30, 60, 50); ctx.fillRect(84, 74, 88, 8);
    ctx.font = '22px "Special Elite"'; ctx.fillStyle = '#d6c79a'; ctx.textAlign = 'center'; ctx.fillText('TEDDY', 128, 290);
  }
  const n = ctx.getImageData(0, 0, 256, 320); for (let i = 0; i < n.data.length; i += 4) { const k = rand(-14, 14); n.data[i] += k; n.data[i + 1] += k; n.data[i + 2] += k; } ctx.putImageData(n, 0, 0);
  const t = texFrom(c, true); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
function textTex(lines, { w = 256, h = 128, bg = null, fg = '#ddd', font = '40px "Special Elite"', glow = null } = {}) {
  const c = makeCanvas(w, h), ctx = c.getContext('2d');
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
  ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = fg;
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 12; }
  lines.forEach((l, i) => ctx.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * parseInt(font) * 1.15));
  const t = texFrom(c, true); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}

async function generateTextures(progress) {
  const jobs = [
    ['wood', () => TEXGEN.woodFloor()], ['wallpaper', () => TEXGEN.wallpaper()], ['wallpaper2', () => TEXGEN.wallpaper([0.48, 0.38, 0.30], [0.36, 0.27, 0.2])],
    ['wallpaper3', () => TEXGEN.wallpaper([0.35, 0.40, 0.45], [0.25, 0.29, 0.33])],
    ['plaster', () => TEXGEN.plaster()], ['tiles', () => TEXGEN.tiles()], ['concrete', () => TEXGEN.concrete()], ['concreteDark', () => TEXGEN.concrete([0.3, 0.3, 0.29])],
    ['brick', () => TEXGEN.brick()], ['rust', () => TEXGEN.rust()], ['endo', () => TEXGEN.endo()], ['darkWood', () => TEXGEN.darkWood()],
    ['lightWood', () => TEXGEN.darkWood([0.45, 0.3, 0.18])], ['fabric', () => TEXGEN.fabric()], ['fabricGreen', () => TEXGEN.fabric([0.12, 0.18, 0.1])], ['fabricBlue', () => TEXGEN.fabric([0.14, 0.16, 0.26])],
    ['rug', () => TEXGEN.rug()], ['attic', () => TEXGEN.atticBoards()], ['cardboard', () => TEXGEN.cardboard()], ['bark', () => TEXGEN.bark()],
    ['ground', () => TEXGEN.ground()], ['grass', () => TEXGEN.grassGround()], ['siding', () => TEXGEN.siding()], ['door', () => TEXGEN.door()],
    ['velvet', () => TEXGEN.velvet()], ['velvetGreen', () => TEXGEN.velvet([0.06, 0.14, 0.08])],
    ['furBear', () => TEXGEN.fur([0.33, 0.2, 0.11], 0.62, 1, 0.8)], ['furRabbit', () => TEXGEN.fur([0.32, 0.3, 0.42], 0.58, 2, 0.4)],
    ['furFox', () => TEXGEN.fur([0.52, 0.17, 0.08], 0.55, 3, 0.5)], ['furChick', () => TEXGEN.fur([0.72, 0.56, 0.12], 0.63, 4, 0.55)],
    ['furBelly', () => TEXGEN.fur([0.6, 0.5, 0.38], 0.6, 5, 0.4)],
    ['leaf', () => TEXGEN.leafCard()], ['pine', () => TEXGEN.pineCard()], ['web', () => TEXGEN.cobweb()], ['soft', () => TEXGEN.soft()], ['cookie', () => TEXGEN.cookie()],
  ];
  for (let i = 0; i < jobs.length; i++) {
    TEX[jobs[i][0]] = jobs[i][1]();
    progress((i + 1) / jobs.length, jobs[i][0]);
    await sleep(0);
  }
}
