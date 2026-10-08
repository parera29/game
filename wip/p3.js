
/* =====================================================================
   AJUSTES Y PROGRESO
   ===================================================================== */
const SETTINGS = Object.assign({ sens: 1, vol: 0.85, bright: 1.0, fov: 75, quality: 2, diff: 0, inv: 0 }, (() => { try { return JSON.parse(localStorage.getItem('tjocs_settings') || '{}'); } catch (e) { return {}; } })());
const SAVE = Object.assign({ best: {}, done: {}, lore: [], seen: [] }, (() => { try { return JSON.parse(localStorage.getItem('tjocs_save') || '{}'); } catch (e) { return {}; } })());
function persist() { try { localStorage.setItem('tjocs_settings', JSON.stringify(SETTINGS)); localStorage.setItem('tjocs_save', JSON.stringify(SAVE)); } catch (e) { } }

/* =====================================================================
   RENDER + POSTPROCESADO
   ===================================================================== */
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, SETTINGS.quality >= 2 ? 1.5 : 1));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = SETTINGS.bright;
renderer.outputColorSpace = THREE.SRGBColorSpace;
maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

const camera = new THREE.PerspectiveCamera(SETTINGS.fov, innerWidth / innerHeight, 0.05, 400);
camera.rotation.order = 'YXZ';
const U_TIME = { value: 0 };
const U_LIGHTNING = { value: 0 };

const FinalShader = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, grain: { value: 0.07 }, vignette: { value: 0.75 }, aberr: { value: 0.2 }, distort: { value: 0 }, flash: { value: 0 }, blackout: { value: 0 }, scan: { value: 0.05 }, desat: { value: 0.18 }, redTint: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time,grain,vignette,aberr,distort,flash,blackout,scan,desat,redTint; varying vec2 vUv;
    float rnd(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec2 uv=vUv; vec2 c=uv-0.5;
      float line=floor(uv.y*120.0);
      uv.x += distort*(rnd(vec2(line,floor(time*30.0)))-0.5)*0.06*step(0.6,rnd(vec2(floor(time*20.0),line*0.1)));
      uv += distort*0.01*vec2(sin(uv.y*50.0+time*40.0),0.0);
      uv = 0.5 + c*(1.0-0.035*dot(c,c)) + (uv-vUv);
      float a = aberr*(0.0015+0.012*dot(c,c)*4.0);
      vec3 col;
      col.r=texture2D(tDiffuse, uv + c*a).r;
      col.g=texture2D(tDiffuse, uv).g;
      col.b=texture2D(tDiffuse, uv - c*a).b;
      float l=dot(col,vec3(0.299,0.587,0.114));
      col=mix(col, vec3(l), desat);
      col*=vec3(1.0,0.985,0.95);
      col = mix(col, col*vec3(1.4,0.5,0.45), redTint);
      col *= 1.0 - vignette*smoothstep(0.25,0.9,length(c*vec2(1.25,1.0))*1.25);
      float n = rnd(uv*vec2(1731.0,977.0)+fract(time*7.31));
      col += (n-0.5)*grain*(0.6+0.8*(1.0-l));
      col *= 1.0 - scan*(0.5+0.5*sin(uv.y*900.0+time*3.0));
      col = mix(col, vec3(1.0,0.98,0.95), flash);
      col *= 1.0-blackout;
      gl_FragColor=vec4(col,1.0);
    }`,
};
let composer, renderPass, bloomPass, finalPass;
function buildComposer() {
  const rt = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: SETTINGS.quality >= 1 ? 4 : 0 });
  composer = new EffectComposer(renderer, rt);
  renderPass = new RenderPass(new THREE.Scene(), camera);
  bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.45, 0.5, 0.9);
  finalPass = new ShaderPass(FinalShader);
  composer.addPass(renderPass); if (SETTINGS.quality >= 1) composer.addPass(bloomPass); composer.addPass(new OutputPass()); composer.addPass(finalPass);
  composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(innerWidth, innerHeight);
}
buildComposer();
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
const FX = finalPass.uniforms;

/* =====================================================================
   MUNDO: contenedor del nivel actual
   ===================================================================== */
let W = null;
function newWorld() {
  return { scene: new THREE.Scene(), colliders: [], circles: [], interact: [], updaters: [], items: [], lights: [], dyn: [], events: [], timers: [], windows: [], bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 }, rainExclude: [-1e5, -1e5, -1e4, -1e4], surface: 'wood', sightBlockers: [] };
}
function disposeWorld(w) {
  if (!w) return;
  w.scene.traverse((o) => {
    if (o.isMesh || o.isPoints || o.isLine || o.isLineSegments) {
      if (o.userData.keep) return;
      o.geometry && o.geometry.dispose && o.geometry.dispose();
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      ms.forEach((m) => { if (m && !m.userData.shared) m.dispose(); });
    }
  });
  w.timers.forEach((t) => clearTimeout(t));
}
function later(ms, fn) { const w = W; const id = setTimeout(() => { if (W === w) fn(); }, ms); W.timers.push(id); return id; }

/* --- materiales compartidos (se crean tras generar texturas) --- */
const M = {};
function sharedMat(name, m) { m.userData.shared = true; M[name] = m; return m; }
function buildMaterials() {
  sharedMat('wood', mat(TEX.wood));
  sharedMat('wallpaper', mat(TEX.wallpaper)); sharedMat('wallpaper2', mat(TEX.wallpaper2)); sharedMat('wallpaper3', mat(TEX.wallpaper3));
  sharedMat('plaster', mat(TEX.plaster)); sharedMat('tiles', mat(TEX.tiles)); sharedMat('concrete', mat(TEX.concrete)); sharedMat('concreteDark', mat(TEX.concreteDark));
  sharedMat('brick', mat(TEX.brick)); sharedMat('rust', mat(TEX.rust, { metalness: 0.6 })); sharedMat('endo', mat(TEX.endo, { metalness: 0.75 }));
  sharedMat('darkWood', mat(TEX.darkWood)); sharedMat('lightWood', mat(TEX.lightWood)); sharedMat('fabric', mat(TEX.fabric)); sharedMat('fabricGreen', mat(TEX.fabricGreen)); sharedMat('fabricBlue', mat(TEX.fabricBlue));
  sharedMat('rug', mat(TEX.rug)); sharedMat('attic', mat(TEX.attic)); sharedMat('cardboard', mat(TEX.cardboard)); sharedMat('bark', mat(TEX.bark));
  sharedMat('ground', mat(TEX.ground)); sharedMat('grass', mat(TEX.grass)); sharedMat('siding', mat(TEX.siding)); sharedMat('door', mat(TEX.door));
  sharedMat('velvet', mat(TEX.velvet, { side: THREE.DoubleSide })); sharedMat('velvetGreen', mat(TEX.velvetGreen, { side: THREE.DoubleSide }));
  sharedMat('black', new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.6 }));
  sharedMat('ceramic', new THREE.MeshStandardMaterial({ color: 0xd8d4c8, roughness: 0.18, metalness: 0 }));
  sharedMat('chrome', new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.25, metalness: 1 }));
  sharedMat('metalDark', mat(TEX.rust, { metalness: 0.8, color: 0x666666 }));
  sharedMat('paper', new THREE.MeshStandardMaterial({ color: 0xd9cfb6, roughness: 0.95 }));
  sharedMat('glassDark', new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.05, metalness: 0.9 }));
  sharedMat('sheet', mat(TEX.fabric, { color: 0xbab3a6 }));
  sharedMat('book', new THREE.MeshStandardMaterial({ roughness: 0.8, vertexColors: true }));
  sharedMat('web', new THREE.MeshBasicMaterial({ map: TEX.web.map, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  sharedMat('bulbOff', new THREE.MeshStandardMaterial({ color: 0x777766, roughness: 0.1, emissive: 0x000000 }));
}

/* --- geometría con UV en coordenadas de mundo --- */
function worldUV(geo, s = 1, ox = 0, oy = 0, oz = 0) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + ox, y = p.getY(i) + oy, z = p.getZ(i) + oz, ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v; if (ax >= ay && ax >= az) { u = z; v = y; } else if (ay >= az) { u = x; v = z; } else { u = x; v = y; }
    uv.setXY(i, u / s, v / s);
  }
  uv.needsUpdate = true; return geo;
}
function addCollider(minX, maxX, minZ, maxZ, minY = 0, maxY = 2.5, sight = null, ref = null) {
  const c = { minX, maxX, minZ, maxZ, minY, maxY, sight: sight === null ? maxY > 1.6 && minY < 1.2 : sight, ref, on: true };
  W.colliders.push(c); return c;
}
/* caja con base en y; UV de mundo; colisión opcional */
function box(w, h, d, material, x, y, z, { col = true, sight = null, cast = true, recv = true, uvs = 1, parent = null, ry = 0 } = {}) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (uvs) worldUV(g, uvs, x, y + h / 2, z);
  const m = new THREE.Mesh(g, material); m.position.set(x, y + h / 2, z); m.rotation.y = ry; m.castShadow = cast; m.receiveShadow = recv;
  (parent || W.scene).add(m);
  if (col) { const sw = Math.abs(Math.round(Math.sin(ry))) ? d : w, sd = Math.abs(Math.round(Math.sin(ry))) ? w : d; m.userData.col = addCollider(x - sw / 2, x + sw / 2, z - sd / 2, z + sd / 2, y, y + h, sight, m); }
  m.userData.static = !parent;
  return m;
}
/* pieza local para muebles (sin colisión) */
function part(group, geo, material, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; group.add(m); return m;
}
function pbox(group, w, h, d, material, x, y, z, uvs = 0.5) { const g = new THREE.BoxGeometry(w, h, d); if (uvs) worldUV(g, uvs); return part(group, g, material, x, y + h / 2, z); }
function place(group, x, z, ry = 0, colW = 0, colD = 0, colH = 1, y = 0) {
  group.position.set(x, y, z); group.rotation.y = ry; W.scene.add(group); group.userData.static = true;
  if (colW > 0) { const sw = Math.abs(Math.round(Math.sin(ry))) ? colD : colW, sd = Math.abs(Math.round(Math.sin(ry))) ? colW : colD; group.userData.col = addCollider(x - sw / 2, x + sw / 2, z - sd / 2, z + sd / 2, y, y + colH); }
  return group;
}

/* --- pared con huecos (puertas/ventanas) ---
   eje 'x' (pared a lo largo de X, en z fijo) o 'z'. openings: [{c, w, y0, y1}] */
function wall(axis, fixed, a0, a1, h, matA, matB, openings = [], t = 0.16, y = 0) {
  openings = openings.slice().sort((p, q) => p.c - q.c);
  const pieces = []; let cur = a0;
  const seg = (s0, s1, yy0, yy1) => { if (s1 - s0 < 0.01 || yy1 - yy0 < 0.01) return; pieces.push([s0, s1, yy0, yy1]); };
  for (const o of openings) { const s0 = o.c - o.w / 2, s1 = o.c + o.w / 2; seg(cur, s0, y, y + h); seg(s0, s1, y, y + o.y0); seg(s0, s1, y + o.y1, y + h); cur = s1; }
  seg(cur, a1, y, y + h);
  const meshes = [];
  for (const [s0, s1, yy0, yy1] of pieces) {
    const len = s1 - s0, mid = (s0 + s1) / 2, hh = yy1 - yy0;
    const g = axis === 'x' ? new THREE.BoxGeometry(len, hh, t) : new THREE.BoxGeometry(t, hh, len);
    const cx = axis === 'x' ? mid : fixed, cz = axis === 'x' ? fixed : mid;
    worldUV(g, 1.6, cx, yy0 + hh / 2, cz);
    // materiales: caras +X,-X,+Y,-Y,+Z,-Z
    const mats = axis === 'x' ? [matA, matA, matA, matA, matB, matA] : [matB, matA, matA, matA, matA, matA];
    const m = new THREE.Mesh(g, mats); m.position.set(cx, yy0 + hh / 2, cz); m.castShadow = true; m.receiveShadow = true; W.scene.add(m);
    if (axis === 'x') addCollider(s0, s1, fixed - t / 2, fixed + t / 2, yy0, yy1, hh > 1.5 && yy0 < 1.2); else addCollider(fixed - t / 2, fixed + t / 2, s0, s1, yy0, yy1, hh > 1.5 && yy0 < 1.2);
    meshes.push(m);
  }
  // marcos de puertas/ventanas
  for (const o of openings) {
    const fm = M.door, ft = 0.06, depth = t + 0.04;
    const s0 = o.c - o.w / 2, s1 = o.c + o.w / 2;
    const add = (w, hh, d, x, yy, z) => box(w, hh, d, fm, x, yy, z, { col: false, uvs: 0.5 });
    if (axis === 'x') { add(ft, o.y1 - o.y0, depth, s0 - ft / 2, y + o.y0, fixed); add(ft, o.y1 - o.y0, depth, s1 + ft / 2, y + o.y0, fixed); add(o.w + ft * 2, ft, depth, o.c, y + o.y1, fixed); if (o.y0 > 0.1) add(o.w + 0.16, 0.05, depth + 0.1, o.c, y + o.y0 - 0.05, fixed); }
    else { add(depth, o.y1 - o.y0, ft, fixed, y + o.y0, s0 - ft / 2); add(depth, o.y1 - o.y0, ft, fixed, y + o.y0, s1 + ft / 2); add(depth, ft, o.w + ft * 2, fixed, y + o.y1, o.c); if (o.y0 > 0.1) add(depth + 0.1, 0.05, o.w + 0.16, fixed, y + o.y0 - 0.05, o.c); }
  }
  return meshes;
}
function floorPlane(x0, z0, x1, z1, material, y = 0, uvs = 2, ceiling = false) {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(ceiling ? Math.PI / 2 : -Math.PI / 2);
  const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + (x0 + x1) / 2) / uvs, (p.getZ(i) + (z0 + z1) / 2) / uvs);
  const m = new THREE.Mesh(g, material); m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.receiveShadow = true; m.castShadow = ceiling; W.scene.add(m); m.userData.static = true; return m;
}

/* --- fusionar geometría estática por material (rendimiento) --- */
function mergeStatic(scene) {
  const groups = new Map(), victims = [];
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material) || o.userData.dynamic || o.userData.interact || o.isInstancedMesh || o.isSkinnedMesh) return;
    let p = o, ok = true; while (p && p !== scene) { if (p.userData.dynamic || p.userData.interact) { ok = false; break; } p = p.parent; }
    if (!ok || o.material.transparent || o.material.isShaderMaterial || o.material.userData.noMerge) return;
    const k = o.material.uuid + (o.castShadow ? 'c' : 'n');
    if (!groups.has(k)) groups.set(k, []); groups.get(k).push(o);
  });
  for (const [, list] of groups) {
    if (list.length < 2) continue;
    const geos = list.map((o) => { let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); return g; });
    if (geos.some((g) => !g.attributes.uv || !g.attributes.normal)) continue;
    const merged = mergeGeometries(geos, false); geos.forEach((g) => g.dispose()); if (!merged) continue;
    const m = new THREE.Mesh(merged, list[0].material); m.castShadow = list[0].castShadow; m.receiveShadow = true; scene.add(m);
    list.forEach((o) => victims.push(o));
  }
  victims.forEach((o) => { o.parent && o.parent.remove(o); o.geometry.dispose(); });
}

/* =====================================================================
   COLISIONES Y NAVEGACIÓN
   ===================================================================== */
function collidePoint(pos, r, yMin = 0.25, yMax = 1.7) {
  for (let it = 0; it < 3; it++) {
    for (const c of W.colliders) {
      if (!c.on || c.maxY < yMin || c.minY > yMax) continue;
      const cx = clamp(pos.x, c.minX, c.maxX), cz = clamp(pos.z, c.minZ, c.maxZ);
      const dx = pos.x - cx, dz = pos.z - cz, d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (r - d) / d; pos.x += dx * k; pos.z += dz * k; }
        else { const l = pos.x - c.minX, rr = c.maxX - pos.x, t = pos.z - c.minZ, b = c.maxZ - pos.z, m = Math.min(l, rr, t, b); if (m === l) pos.x = c.minX - r; else if (m === rr) pos.x = c.maxX + r; else if (m === t) pos.z = c.minZ - r; else pos.z = c.maxZ + r; }
      }
    }
    for (const c of W.circles) {
      const dx = pos.x - c.x, dz = pos.z - c.z, d2 = dx * dx + dz * dz, rr = r + c.r;
      if (d2 < rr * rr && d2 > 1e-8) { const d = Math.sqrt(d2), k = (rr - d) / d; pos.x += dx * k; pos.z += dz * k; }
    }
  }
  const b = W.bounds; pos.x = clamp(pos.x, b.minX + r, b.maxX - r); pos.z = clamp(pos.z, b.minZ + r, b.maxZ - r);
}
class NavGrid {
  constructor(bounds, cell = 0.4, agentR = 0.36) {
    this.b = bounds; this.cell = cell; this.nx = Math.ceil((bounds.maxX - bounds.minX) / cell); this.nz = Math.ceil((bounds.maxZ - bounds.minZ) / cell);
    this.agentR = agentR; this.rebuild();
  }
  rebuild() {
    const { nx, nz, cell, b, agentR } = this; this.walk = new Uint8Array(nx * nz).fill(1); this.sight = new Uint8Array(nx * nz);
    for (const c of W.colliders) {
      if (!c.on) continue;
      if (c.minY < 1.0 && c.maxY > 0.2) this.mark(this.walk, c.minX - agentR, c.maxX + agentR, c.minZ - agentR, c.maxZ + agentR, 0);
      if (c.sight) this.mark(this.sight, c.minX, c.maxX, c.minZ, c.maxZ, 1);
    }
    for (const c of W.circles) this.mark(this.walk, c.x - c.r - agentR, c.x + c.r + agentR, c.z - c.r - agentR, c.z + c.r + agentR, 0);
    this.walkable = []; for (let i = 0; i < nx * nz; i++) if (this.walk[i]) this.walkable.push(i);
  }
  mark(arr, x0, x1, z0, z1, v) {
    const i0 = Math.max(0, Math.floor((x0 - this.b.minX) / this.cell)), i1 = Math.min(this.nx - 1, Math.floor((x1 - this.b.minX) / this.cell));
    const j0 = Math.max(0, Math.floor((z0 - this.b.minZ) / this.cell)), j1 = Math.min(this.nz - 1, Math.floor((z1 - this.b.minZ) / this.cell));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const cx = this.b.minX + (i + 0.5) * this.cell, cz = this.b.minZ + (j + 0.5) * this.cell;
      const sl = v === 1 ? this.cell * 0.5 : 0;
      if (cx < x0 - sl || cx > x1 + sl || cz < z0 - sl || cz > z1 + sl) continue;
      arr[j * this.nx + i] = v;
    }
  }
  idx(x, z) { const i = Math.floor((x - this.b.minX) / this.cell), j = Math.floor((z - this.b.minZ) / this.cell); if (i < 0 || j < 0 || i >= this.nx || j >= this.nz) return -1; return j * this.nx + i; }
  center(id) { const i = id % this.nx, j = Math.floor(id / this.nx); return V3(this.b.minX + (i + 0.5) * this.cell, 0, this.b.minZ + (j + 0.5) * this.cell); }
  nearestWalkable(id) {
    if (id >= 0 && this.walk[id]) return id; const i0 = id % this.nx, j0 = Math.floor(id / this.nx);
    for (let r = 1; r < 20; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { if (Math.abs(di) !== r && Math.abs(dj) !== r) continue; const i = i0 + di, j = j0 + dj; if (i < 0 || j < 0 || i >= this.nx || j >= this.nz) continue; const k = j * this.nx + i; if (this.walk[k]) return k; }
    return -1;
  }
  randomPoint() { const id = pick(this.walkable); return this.center(id); }
  los(a, b, extra = null) {
    const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), steps = Math.ceil(d / (this.cell * 0.5));
    for (let s = 1; s < steps; s++) {
      const x = a.x + dx * s / steps, z = a.z + dz * s / steps, id = this.idx(x, z);
      if (id < 0 || this.sight[id]) return false;
      if (extra && extra(x, z)) return false;
    }
    return true;
  }
  walkLine(a, b) {
    const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), steps = Math.ceil(d / (this.cell * 0.4));
    for (let s = 1; s <= steps; s++) { const id = this.idx(a.x + dx * s / steps, a.z + dz * s / steps); if (id < 0 || !this.walk[id]) return false; }
    return true;
  }
  path(from, to) {
    const { nx, nz } = this, N = nx * nz;
    let s = this.nearestWalkable(this.idx(from.x, from.z)), t = this.nearestWalkable(this.idx(to.x, to.z));
    if (s < 0 || t < 0) return null; if (s === t) return [to.clone()];
    const g = new Float32Array(N).fill(1e9), par = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const heap = [], push = (id, f) => { heap.push([f, id]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    const ti = t % nx, tj = Math.floor(t / nx), hfn = (id) => { const i = id % nx, j = Math.floor(id / nx), dx = Math.abs(i - ti), dz = Math.abs(j - tj); return (dx + dz) + (1.414 - 2) * Math.min(dx, dz); };
    g[s] = 0; push(s, hfn(s)); let found = false, iter = 0;
    while (heap.length && iter++ < 40000) {
      const [, cur] = pop(); if (closed[cur]) continue; closed[cur] = 1; if (cur === t) { found = true; break; }
      const ci = cur % nx, cj = Math.floor(cur / nx);
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue; const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
        const n = j * nx + i; if (!this.walk[n] || closed[n]) continue;
        if (di && dj && (!this.walk[cj * nx + i] || !this.walk[j * nx + ci])) continue;
        const ng = g[cur] + (di && dj ? 1.414 : 1); if (ng < g[n]) { g[n] = ng; par[n] = cur; push(n, ng + hfn(n)); }
      }
    }
    if (!found) return null;
    const pts = []; for (let c = t; c !== -1; c = par[c]) pts.push(this.center(c)); pts.reverse();
    pts[pts.length - 1] = to.clone(); pts[pts.length - 1].y = 0;
    // suavizado (string pulling)
    const out = [pts[0]]; let k = 0;
    while (k < pts.length - 1) { let far = k + 1; for (let m = pts.length - 1; m > k + 1; m--) { if (this.walkLine(pts[k], pts[m])) { far = m; break; } } out.push(pts[far]); k = far; }
    out.shift(); return out;
  }
}

/* =====================================================================
   ENTORNO: cielo, lluvia, relámpagos, ventanas, cortinas, árboles
   ===================================================================== */
const GLSL_NOISE = `
  float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
  float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<5;i++){ s+=a*vnoise(p); p*=2.03; a*=0.5; } return s; }
`;
function makeSky(scene, moon = true) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: U_TIME, uL: U_LIGHTNING, uMoon: { value: moon ? 1 : 0 } }, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position.z=gl_Position.w; }',
    fragmentShader: GLSL_NOISE + `
      uniform float uTime,uL,uMoon; varying vec3 vP;
      void main(){
        float y=max(vP.y,0.0);
        vec3 col=mix(vec3(0.018,0.02,0.028), vec3(0.004,0.005,0.009), pow(y,0.5));
        vec2 uv=vP.xz/(vP.y+0.25)*1.4 + vec2(uTime*0.012, uTime*0.004);
        float c=fbm(uv*1.3); c=smoothstep(0.35,0.85,c);
        vec3 md=normalize(vec3(-0.5,0.45,-0.75)); float mdot=max(dot(vP,md),0.0);
        float moonGlow=pow(mdot,60.0)*0.25*uMoon + pow(mdot,900.0)*2.5*uMoon;
        col += vec3(0.5,0.55,0.65)*moonGlow*(1.0-c*0.85);
        col = mix(col, vec3(0.03,0.032,0.04)+vec3(0.1,0.1,0.12)*pow(mdot,8.0)*uMoon, c*0.85);
        col += vec3(0.55,0.58,0.75)*uL*(0.25+c*0.9)*(0.4+y);
        col = mix(col, vec3(0.02,0.022,0.028)+vec3(0.35)*uL, smoothstep(0.08,-0.05,vP.y));
        gl_FragColor=vec4(col,1.0);
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), mat); m.renderOrder = -10; m.frustumCulled = false; scene.add(m); return m;
}
function makeRain(scene, count = 6000, area = 40, exclude = null) {
  const g = new THREE.BufferGeometry(), pos = new Float32Array(count * 6), seed = new Float32Array(count * 2 * 3);
  for (let i = 0; i < count; i++) { const x = Math.random(), z = Math.random(), p = Math.random(); for (let k = 0; k < 2; k++) { seed[(i * 2 + k) * 3] = x; seed[(i * 2 + k) * 3 + 1] = z; seed[(i * 2 + k) * 3 + 2] = p; pos[(i * 2 + k) * 3 + 1] = k; } }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(seed, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: U_TIME, uL: U_LIGHTNING, uC: { value: V3() }, uArea: { value: area }, uEx: { value: new THREE.Vector4(...(exclude || [-1e5, -1e5, -1e4, -1e4])) } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute vec3 seed; uniform float uTime,uArea; uniform vec3 uC; uniform vec4 uEx; varying float vA; varying float vK;
      void main(){
        float H=14.0; vec3 p; p.x=uC.x+(fract(seed.x - uC.x/uArea)-0.5)*uArea; p.z=uC.z+(fract(seed.y - uC.z/uArea)-0.5)*uArea;
        float y=mod(seed.z*H - uTime*(9.0+seed.z*3.0), H); p.y = uC.y-3.0+y + position.y*0.45; p.x += position.y*0.06; vK=position.y;
        vA = (p.x>uEx.x && p.x<uEx.z && p.z>uEx.y && p.z<uEx.w) ? 0.0 : 1.0;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
      }`,
    fragmentShader: 'uniform float uL; varying float vA; varying float vK; void main(){ if(vA<0.5) discard; gl_FragColor=vec4(vec3(0.55,0.6,0.7)*(0.16+uL*0.8)*(0.3+vK), 1.0); }',
  });
  const m = new THREE.LineSegments(g, mat); m.frustumCulled = false; scene.add(m); m.userData.dynamic = true; return m;
}
/* vidrio con gotas de lluvia procedurales */
function rainGlassMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: U_TIME, uL: U_LIGHTNING }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv=uv; vW=(modelMatrix*vec4(position,1.0)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.0);} ',
    fragmentShader: `uniform float uTime,uL; varying vec2 vUv; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float drops(vec2 uv, float sc, float t){
        vec2 g=uv*sc; vec2 id=floor(g); vec2 f=fract(g)-0.5; float n=h(id);
        vec2 o=vec2(h(id+3.1),h(id+7.7))-0.5; float r=0.06+0.16*n; float d=length((f-o*0.6)*vec2(1.0,0.85));
        return smoothstep(r,r*0.55,d)*step(0.35,n);
      }
      float runs(vec2 uv, float t){
        float cols=14.0; float c=floor(uv.x*cols); float hh=h(vec2(c,1.0));
        float x=fract(uv.x*cols)-0.5 + sin(uv.y*18.0+hh*6.0)*0.08;
        float sp=0.12+hh*0.3; float y=fract(uv.y*0.8 + t*sp + hh);
        float head=smoothstep(0.12,0.04,length(vec2(x*1.2,(y-0.95)*4.0)));
        float trail=smoothstep(0.07,0.0,abs(x))*smoothstep(0.95,0.3,y)*0.35*step(0.5,hh);
        return (head+trail)*step(0.25,hh);
      }
      void main(){
        vec2 uv=vUv*vec2(1.6,2.2);
        float d=drops(uv,22.0,uTime)+drops(uv+3.3,37.0,uTime)*0.7+runs(uv,uTime);
        float a=0.08 + d*0.55;
        vec3 col=mix(vec3(0.05,0.06,0.075), vec3(0.6,0.65,0.75), d*0.6);
        col += vec3(0.7,0.75,0.95)*uL*(0.4+d*1.5);
        gl_FragColor=vec4(col, a + uL*0.25);
      }`,
  });
}
function addWindow(axis, fixed, c, w, y0, y1, { curtains = 'velvet', outsideSign = 1, cross = true } = {}) {
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, y1 - y0), rainGlassMaterial());
  if (axis === 'x') glass.position.set(c, (y0 + y1) / 2, fixed); else { glass.position.set(fixed, (y0 + y1) / 2, c); glass.rotation.y = Math.PI / 2; }
  glass.userData.dynamic = true; W.scene.add(glass);
  const fm = M.door;
  if (cross) {
    if (axis === 'x') { box(0.05, y1 - y0, 0.06, fm, c, y0, fixed, { col: false }); box(w, 0.05, 0.06, fm, c, (y0 + y1) / 2, fixed, { col: false }); }
    else { box(0.06, y1 - y0, 0.05, fm, fixed, y0, c, { col: false }); box(0.06, 0.05, w, fm, fixed, (y0 + y1) / 2, c, { col: false }); }
  }
  if (curtains) {
    for (const side of [-1, 1]) {
      const cw = w * 0.42, ch = y1 - y0 + 0.5, cm = makeCurtain(cw, ch, M[curtains]);
      const off = side * (w / 2 - cw * 0.3) , inset = -outsideSign * 0.16;
      if (axis === 'x') cm.position.set(c + off, y0 - 0.25, fixed + inset); else { cm.position.set(fixed + inset, y0 - 0.25, c + off); cm.rotation.y = Math.PI / 2; }
      W.scene.add(cm);
    }
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, w + 0.5, 8), M.chrome); rod.rotation.z = Math.PI / 2;
    if (axis === 'x') rod.position.set(c, y1 + 0.22, fixed - outsideSign * 0.16); else { rod.position.set(fixed - outsideSign * 0.16, y1 + 0.22, c); rod.rotation.set(Math.PI / 2, 0, 0); rod.rotation.x = 0; rod.rotation.z = 0; rod.rotation.x = Math.PI / 2; }
    W.scene.add(rod);
  }
  W.windows.push({ axis, fixed, c, w, y0, y1, outsideSign, glass });
  return glass;
}
function makeCurtain(w, h, material) {
  const g = new THREE.PlaneGeometry(w, h, 22, 26); g.translate(0, h / 2, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.sin(x / w * Math.PI * 7) * 0.045 + (1 - y / h) * Math.sin(x * 9) * 0.02); }
  g.computeVertexNormals();
  const m = material.clone(); m.side = THREE.DoubleSide; m.userData.noMerge = true;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U_TIME;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float hf = 1.0 - clamp(position.y / ${h.toFixed(2)}, 0.0, 1.0);
      vec4 wp = modelMatrix*vec4(position,1.0);
      transformed.z += hf*hf*(sin(uTime*1.3 + wp.x*2.0 + wp.z*2.0)*0.06 + sin(uTime*2.7 + position.x*6.0)*0.025);
      transformed.x += hf*hf*sin(uTime*0.9 + wp.z)*0.03;`);
  };
  const mesh = new THREE.Mesh(g, m); mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.dynamic = true; return mesh;
}
/* --- viento para vegetación instanciada --- */
function windify(material, amp = 0.12, freq = 1.6) {
  material.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U_TIME;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec3 ip = vec3(0.0);
      #ifdef USE_INSTANCING
        ip = instanceMatrix[3].xyz;
      #endif
      vec4 wpp = modelMatrix*vec4(ip,1.0);
      float ph = wpp.x*0.35 + wpp.z*0.27;
      float sway = sin(uTime*${freq.toFixed(2)} + ph)*0.6 + sin(uTime*${(freq * 2.3).toFixed(2)} + ph*1.7)*0.3 + sin(uTime*7.0 + position.x*4.0 + ph)*0.15;
      float hk = clamp(position.y+0.5, 0.0, 1.5);
      transformed.x += sway*${amp.toFixed(3)}*hk; transformed.z += cos(uTime*${(freq * 0.8).toFixed(2)}+ph)*${(amp * 0.6).toFixed(3)}*hk;`);
  };
  material.userData.noMerge = true;
  return material;
}
/* árboles: tronco + ramas + tarjetas de hojas (instanciado) */
function buildForest(trees, { leafCards = 160, pineCards = 70, castShadow = true } = {}) {
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.32, 1, 9, 6, true); trunkGeo.translate(0, 0.5, 0);
  { const p = trunkGeo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) + Math.sin(y * 7) * 0.03); p.setZ(i, p.getZ(i) + Math.cos(y * 5) * 0.03); } trunkGeo.computeVertexNormals(); const uv = trunkGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2, uv.getY(i) * 4); }
  const branchGeo = new THREE.CylinderGeometry(0.03, 0.08, 1, 6); branchGeo.translate(0, 0.5, 0);
  const cardGeo = new THREE.PlaneGeometry(1.4, 1.4); cardGeo.translate(0, 0.3, 0);
  const pineGeo = new THREE.PlaneGeometry(2.2, 1.2); pineGeo.translate(1.1, 0, 0);
  const trunkMat = M.bark;
  const leafMat = windify(new THREE.MeshStandardMaterial({ map: TEX.leaf.map, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.85, color: 0x9a9a8a }), 0.12, 1.4);
  const pineMat = windify(new THREE.MeshStandardMaterial({ map: TEX.pine.map, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9, color: 0x8a948a }), 0.08, 1.1);
  const nT = trees.length;
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, nT);
  let nb = 0, nl = 0, np = 0; trees.forEach((t) => { nb += t.type === 'pine' ? 0 : t.type === 'dead' ? 9 : 6; nl += t.type === 'leaf' ? leafCards : 0; np += t.type === 'pine' ? pineCards : 0; });
  const branches = new THREE.InstancedMesh(branchGeo, trunkMat, Math.max(1, nb));
  const leaves = new THREE.InstancedMesh(cardGeo, leafMat, Math.max(1, nl));
  const pines = new THREE.InstancedMesh(pineGeo, pineMat, Math.max(1, np));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = V3(), p = V3();
  let bi = 0, li = 0, pi = 0;
  trees.forEach((t, i) => {
    const H = t.h; e.set(rand(-0.04, 0.04), rand(0, TAU), rand(-0.04, 0.04)); q.setFromEuler(e); s.set(t.r * 2.6, H, t.r * 2.6); p.set(t.x, -0.2, t.z);
    m4.compose(p, q, s); trunks.setMatrixAt(i, m4);
    if (t.type === 'pine') {
      for (let k = 0; k < pineCards; k++) {
        const hy = rand(H * 0.25, H * 0.98), lenK = (1 - (hy / H)) * 1.4 + 0.25;
        e.set(rand(-0.3, 0.1), rand(0, TAU), rand(-0.45, -0.1)); q.setFromEuler(e); s.set(lenK * rand(0.8, 1.2), rand(0.8, 1.2), 1); p.set(t.x, hy, t.z);
        m4.compose(p, q, s); pines.setMatrixAt(pi++, m4);
      }
    } else {
      const nbr = t.type === 'dead' ? 9 : 6;
      const ends = [];
      for (let k = 0; k < nbr; k++) {
        const hy = rand(H * 0.45, H * 0.92), a = rand(0, TAU), tilt = rand(0.5, 1.1), len = rand(1.2, 2.6) * (t.type === 'dead' ? 1.2 : 1);
        e.set(0, a, tilt); q.setFromEuler(e); s.set(1, len, 1); p.set(t.x, hy, t.z); m4.compose(p, q, s); branches.setMatrixAt(bi++, m4);
        const dir = V3(0, 1, 0).applyQuaternion(q); ends.push(V3(t.x, hy, t.z).addScaledVector(dir, len));
      }
      if (t.type === 'leaf') {
        ends.push(V3(t.x, H * 1.02, t.z));
        for (let k = 0; k < leafCards; k++) {
          const c = ends[k % ends.length], r = rand(0.2, 1.6);
          e.set(rand(-1, 1), rand(0, TAU), rand(-1, 1)); q.setFromEuler(e); const sc = rand(0.8, 1.4); s.set(sc, sc, sc);
          p.set(c.x + rand(-r, r), c.y + rand(-r * 0.6, r * 0.6), c.z + rand(-r, r)); m4.compose(p, q, s); leaves.setMatrixAt(li++, m4);
        }
      }
    }
  });
  trunks.count = nT; branches.count = bi; leaves.count = li; pines.count = pi;
  [trunks, branches, leaves, pines].forEach((im) => { im.castShadow = castShadow; im.receiveShadow = true; im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.userData.dynamic = true; W.scene.add(im); });
  return { trunks, branches, leaves, pines };
}
function buildGrass(cx, cz, size, count, avoid = null) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array([-0.03, 0, 0, 0.03, 0, 0, -0.02, 0.25, 0, 0.02, 0.25, 0, 0, 0.5, 0]);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]); g.computeVertexNormals();
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 0.5, 1, 0.5, 0.5, 1]), 2));
  const m = windify(new THREE.MeshStandardMaterial({ color: 0x3b4524, roughness: 0.95, side: THREE.DoubleSide }), 0.1, 2.2);
  const im = new THREE.InstancedMesh(g, m, count), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = V3(), p = V3(), col = new THREE.Color();
  let n = 0;
  for (let i = 0; i < count; i++) {
    const x = cx + rand(-size / 2, size / 2), z = cz + rand(-size / 2, size / 2);
    if (avoid && avoid(x, z)) continue;
    e.set(rand(-0.3, 0.3), rand(0, TAU), rand(-0.3, 0.3)); q.setFromEuler(e); const sc = rand(0.5, 1.6); s.set(sc, sc * rand(0.7, 1.4), sc); p.set(x, 0, z);
    m4.compose(p, q, s); im.setMatrixAt(n, m4); col.setHSL(rand(0.13, 0.22), rand(0.25, 0.45), rand(0.12, 0.25)); im.setColorAt(n, col); n++;
  }
  im.count = n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.receiveShadow = true; im.userData.dynamic = true; W.scene.add(im); return im;
}

/* --- sistema de relámpagos --- */
const LIGHTNING = {
  next: 6, seq: null, t: 0, value: 0, bolt: null, enabled: true, onStrike: null,
  reset() { this.next = rand(4, 10); this.seq = null; this.value = 0; },
  strike(force = false) {
    const pat = pick([[1, 0.1, 0.8, 0, 0.6, 0.15, 1, 0.3], [0.9, 0.2, 1, 0.5, 0.2], [0.4, 0, 1, 0.7, 0.4, 0.1]]);
    this.seq = { pat, t: 0, step: 0.06 }; const dist = rand(0.05, 0.9);
    setTimeout(() => AUD.thunder(dist), 300 + dist * 3500);
    if (W && W.boltSpot && Math.random() < 0.7) this.showBolt();
    this.onStrike && this.onStrike();
  },
  showBolt() {
    if (!W) return; const sc = W.scene;
    if (this.bolt) { this.bolt.parent && this.bolt.parent.remove(this.bolt); this.bolt.geometry.dispose(); }
    const pts = []; const a = rand(0, TAU), r = rand(80, 150), x = (W.boltSpot ? W.boltSpot.x : 0) + Math.cos(a) * r, z = (W.boltSpot ? W.boltSpot.z : 0) + Math.sin(a) * r;
    let px = x, pz = z; for (let y = 110; y > 0; y -= rand(4, 10)) { pts.push(V3(px, y, pz)); px += rand(-5, 5); pz += rand(-5, 5); }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    this.bolt = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xdde4ff, fog: false })); this.bolt.userData.dynamic = true; sc.add(this.bolt);
    setTimeout(() => { if (this.bolt) { this.bolt.parent && this.bolt.parent.remove(this.bolt); } }, 260);
  },
  update(dt) {
    if (!this.enabled) { this.value = 0; U_LIGHTNING.value = 0; return; }
    this.next -= dt; if (this.next <= 0 && !this.seq) { this.strike(); this.next = rand(9, 24); }
    let v = 0;
    if (this.seq) { this.seq.t += dt; const i = Math.floor(this.seq.t / this.seq.step); if (i >= this.seq.pat.length) { this.seq = null; } else v = this.seq.pat[i]; }
    this.value = Math.max(v, this.value - dt * 4); U_LIGHTNING.value = this.value;
  },
};
