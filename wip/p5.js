
/* =====================================================================
   MOBILIARIO Y PROPS
   ===================================================================== */
function addInteract(obj, prompt, onUse, range = 2.4) {
  obj.userData.interact = { prompt, onUse, range }; obj.userData.dynamic = true; W.interact.push(obj); return obj;
}
function removeInteract(obj) { const i = W.interact.indexOf(obj); if (i >= 0) W.interact.splice(i, 1); obj.userData.interact = null; }
const BOOK_MATS = [];
function bookMats() { if (!BOOK_MATS.length) [0x4a1612, 0x1b2a40, 0x24361e, 0x5a4a2a, 0x2a2a2a, 0x6b3a1a, 0x3a1a3a].forEach((c) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 }); m.userData.shared = true; BOOK_MATS.push(m); }); return BOOK_MATS; }
const F = {
  sofa(x, z, ry, fm = M.fabric) {
    const g = new THREE.Group();
    pbox(g, 2.0, 0.28, 0.9, M.darkWood, 0, 0.1, 0);
    for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(lumpy(new THREE.BoxGeometry(0.6, 0.16, 0.7, 3, 2, 3), 0.015, 9, i), fm); c.position.set((i - 1) * 0.62, 0.46, 0.06); c.rotation.z = rand(-0.03, 0.03); c.castShadow = c.receiveShadow = true; g.add(c); }
    const back = new THREE.Mesh(lumpy(new THREE.BoxGeometry(2.0, 0.55, 0.22, 4, 3, 2), 0.02, 6, 2), fm); back.position.set(0, 0.62, -0.34); back.rotation.x = -0.12; back.castShadow = back.receiveShadow = true; g.add(back);
    for (const s of [-1, 1]) { const a = new THREE.Mesh(lumpy(new THREE.BoxGeometry(0.2, 0.3, 0.9, 2, 2, 3), 0.015), fm); a.position.set(s * 0.95, 0.52, 0); a.castShadow = true; g.add(a); }
    for (const sx of [-0.9, 0.9]) for (const sz of [-0.38, 0.38]) pbox(g, 0.06, 0.1, 0.06, M.darkWood, sx, 0, sz);
    return place(g, x, z, ry, 2.1, 0.95, 0.9);
  },
  armchair(x, z, ry, fm = M.fabricGreen) {
    const g = new THREE.Group();
    pbox(g, 0.9, 0.3, 0.85, M.darkWood, 0, 0.1, 0);
    const c = new THREE.Mesh(lumpy(new THREE.BoxGeometry(0.6, 0.16, 0.7, 3, 2, 3), 0.015), fm); c.position.set(0, 0.47, 0.05); g.add(c);
    const b = new THREE.Mesh(lumpy(new THREE.BoxGeometry(0.9, 0.75, 0.2, 3, 3, 2), 0.02), fm); b.position.set(0, 0.75, -0.33); b.rotation.x = -0.15; g.add(b);
    for (const s of [-1, 1]) { const a = new THREE.Mesh(lumpy(new THREE.BoxGeometry(0.16, 0.32, 0.85, 2, 2, 3), 0.01), fm); a.position.set(s * 0.38, 0.52, 0); g.add(a); }
    g.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
    return place(g, x, z, ry, 0.95, 0.9, 1.0);
  },
  table(x, z, ry, w = 1.2, d = 0.7, h = 0.76, m = M.darkWood) {
    const g = new THREE.Group(); pbox(g, w, 0.05, d, m, 0, h - 0.05, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) pbox(g, 0.06, h - 0.05, 0.06, m, sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06));
    pbox(g, w - 0.15, 0.08, 0.03, m, 0, h - 0.13, d / 2 - 0.06); pbox(g, w - 0.15, 0.08, 0.03, m, 0, h - 0.13, -d / 2 + 0.06);
    return place(g, x, z, ry, w, d, h);
  },
  chair(x, z, ry, tipped = false, m = M.darkWood) {
    const g = new THREE.Group(); pbox(g, 0.44, 0.04, 0.44, m, 0, 0.44, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) pbox(g, 0.04, 0.44, 0.04, m, sx * 0.19, 0, sz * 0.19);
    for (const sx of [-1, 1]) pbox(g, 0.04, 0.5, 0.04, m, sx * 0.19, 0.48, -0.19);
    for (let i = 0; i < 3; i++) pbox(g, 0.36, 0.05, 0.02, m, 0, 0.62 + i * 0.13, -0.19);
    if (tipped) { const gg = new THREE.Group(); g.rotation.x = -Math.PI / 2; g.position.y = 0.21; g.position.z = 0.0; gg.add(g); return place(gg, x, z, ry, 0.5, 0.9, 0.5); }
    return place(g, x, z, ry, 0.45, 0.45, 0.9);
  },
  tv(x, z, ry) {
    const g = new THREE.Group(); pbox(g, 1.1, 0.5, 0.45, M.darkWood, 0, 0, 0);
    const body = new THREE.Mesh(lumpy(new THREE.BoxGeometry(0.7, 0.55, 0.5, 2, 2, 2), 0.004), new THREE.MeshStandardMaterial({ color: 0x24211d, roughness: 0.5 })); body.position.set(0, 0.78, -0.02); body.castShadow = true; g.add(body);
    const cv = makeCanvas(128, 96), tex = texFrom(cv, true);
    const sm = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0, roughness: 0.1, metalness: 0.3 });
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.4), sm); scr.position.set(-0.04, 0.78, 0.235); g.add(scr);
    for (let i = 0; i < 2; i++) { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 10), M.chrome); k.rotation.x = Math.PI / 2; k.position.set(0.28, 0.9 - i * 0.12, 0.24); g.add(k); }
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.5, 4), M.chrome); ant.position.set(0.1, 1.25, -0.05); ant.rotation.z = 0.6; g.add(ant);
    const ant2 = ant.clone(); ant2.rotation.z = -0.4; ant2.position.x = -0.1; g.add(ant2);
    place(g, x, z, ry, 1.1, 0.5, 1.0); g.userData.dynamic = true;
    return { g, scr, sm, cv, tex, ctx: cv.getContext('2d') };
  },
  bookshelf(x, z, ry, w = 1.2, h = 2.0, col = true) {
    const g = new THREE.Group(), m = M.darkWood, bm = bookMats();
    pbox(g, w, h, 0.04, m, 0, 0, -0.16); pbox(g, 0.04, h, 0.36, m, -w / 2, 0, 0); pbox(g, 0.04, h, 0.36, m, w / 2, 0, 0);
    const shelves = 5; for (let i = 0; i <= shelves; i++) pbox(g, w, 0.03, 0.36, m, 0, i * (h - 0.03) / shelves, 0);
    for (let i = 0; i < shelves; i++) { let bx = -w / 2 + 0.05; while (bx < w / 2 - 0.08) { const bw = rand(0.025, 0.06), bh = rand(0.2, 0.32); if (Math.random() < 0.12) { bx += 0.1; continue; } const b = pbox(g, bw, bh, rand(0.18, 0.26), pick(bm), bx + bw / 2, i * (h - 0.03) / shelves + 0.03, 0.02, 0); b.rotation.z = Math.random() < 0.1 ? 0.25 : 0; bx += bw + 0.003; } }
    return place(g, x, z, ry, col ? w : 0, col ? 0.38 : 0, h);
  },
  fireplace(x, z, ry) {
    const g = new THREE.Group();
    pbox(g, 1.6, 1.1, 0.5, M.brick, 0, 0, 0, 1); pbox(g, 1.9, 0.08, 0.6, M.darkWood, 0, 1.1, 0.03);
    const hole = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.42), M.black); hole.position.set(0, 0.35, 0.06); g.add(hole);
    const em = new THREE.MeshStandardMaterial({ color: 0x110500, emissive: 0xff3300, emissiveIntensity: 0.6, roughness: 1 });
    for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(lumpy(new THREE.CylinderGeometry(0.04, 0.05, 0.5, 6), 0.01), i < 3 ? M.black : em); l.rotation.set(Math.PI / 2, rand(-0.8, 0.8), Math.PI / 2); l.position.set(rand(-0.25, 0.25), 0.05 + (i % 3) * 0.05, 0.1); g.add(l); }
    pbox(g, 1.6, 1.6, 0.4, M.brick, 0, 1.18, -0.05, 1);
    place(g, x, z, ry, 1.6, 0.6, 1.2);
    return { g, em };
  },
  lamp(x, z, h = 1.6, on = true, color = 0xffb066) {
    const g = new THREE.Group();
    pbox(g, 0.28, 0.03, 0.28, M.darkWood, 0, 0, 0); part(g, new THREE.CylinderGeometry(0.015, 0.015, h, 6), M.chrome, 0, h / 2, 0);
    const shadeM = new THREE.MeshStandardMaterial({ color: 0x8a7a5a, emissive: color, emissiveIntensity: on ? 0.35 : 0, side: THREE.DoubleSide, roughness: 0.9 });
    const sh = part(g, new THREE.CylinderGeometry(0.16, 0.24, 0.3, 14, 1, true), shadeM, 0, h, 0);
    let light = null; if (on) { light = new THREE.PointLight(color, 1.6, 6, 2); light.position.set(0, h - 0.05, 0); g.add(light); }
    place(g, x, z, 0, 0.3, 0.3, h); g.userData.dynamic = true;
    return { g, light, shadeM, base: 1.6 };
  },
  rockingChair(x, z, ry) {
    const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner); const m = M.darkWood;
    pbox(inner, 0.5, 0.04, 0.5, m, 0, 0.42, 0);
    for (const sx of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.025, 6, 20, 0.95), m); r.rotation.set(0, Math.PI / 2, Math.PI * 1.5 - 0.47); r.position.set(sx * 0.22, 0.92, 0); inner.add(r); pbox(inner, 0.03, 0.4, 0.03, m, sx * 0.22, 0.04, 0.18); pbox(inner, 0.03, 1.0, 0.03, m, sx * 0.22, 0.04, -0.2); }
    for (let i = 0; i < 5; i++) pbox(inner, 0.03, 0.55, 0.02, m, -0.16 + i * 0.08, 0.48, -0.21);
    pbox(inner, 0.5, 0.06, 0.03, m, 0, 1.02, -0.21);
    inner.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    place(g, x, z, ry, 0.6, 0.8, 1.0); g.userData.dynamic = true; return { g, inner };
  },
  clock(x, y, z, ry) {
    const g = new THREE.Group();
    pbox(g, 0.36, 0.9, 0.14, M.darkWood, 0, 0, 0); const face = new THREE.Mesh(new THREE.CircleGeometry(0.13, 24), new THREE.MeshStandardMaterial({ map: textTex(['XII', '', 'VI'], { w: 128, h: 128, bg: '#c9bc9a', fg: '#222', font: '24px "Special Elite"' }), roughness: 0.6 })); face.position.set(0, 0.72, 0.075); g.add(face);
    const pend = new THREE.Group(); pend.position.set(0, 0.55, 0.06); g.add(pend);
    part(pend, new THREE.CylinderGeometry(0.004, 0.004, 0.36, 4), M.chrome, 0, -0.18, 0); part(pend, new THREE.CylinderGeometry(0.05, 0.05, 0.01, 16), new THREE.MeshStandardMaterial({ color: 0xa08030, metalness: 1, roughness: 0.3 }), 0, -0.38, 0, Math.PI / 2);
    g.position.set(x, y, z); g.rotation.y = ry; W.scene.add(g); g.userData.dynamic = true; return { g, pend };
  },
  frame(x, y, z, ry, tex, w = 0.5, h = 0.62, tilt = 0) {
    const g = new THREE.Group(); pbox(g, w + 0.08, h + 0.08, 0.04, M.darkWood, 0, -(h + 0.08) / 2, 0, 0);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })); p.position.set(0, 0, 0.022); g.add(p);
    g.position.set(x, y, z); g.rotation.set(0, ry, tilt); W.scene.add(g); return g;
  },
  counter(x, z, ry, len, top = M.tiles) {
    const g = new THREE.Group();
    pbox(g, len, 0.86, 0.6, M.lightWood, 0, 0.0, 0); pbox(g, len + 0.04, 0.04, 0.64, M.ceramic, 0, 0.86, 0.01);
    for (let i = 0; i < Math.floor(len / 0.5); i++) { pbox(g, 0.46, 0.7, 0.02, M.door, -len / 2 + 0.25 + i * 0.5, 0.08, 0.3, 0.6); part(g, new THREE.SphereGeometry(0.015, 6, 4), M.chrome, -len / 2 + 0.42 + i * 0.5, 0.7, 0.33); }
    return place(g, x, z, ry, len, 0.62, 0.9);
  },
  upperCab(x, y, z, ry, len) { const g = new THREE.Group(); pbox(g, len, 0.7, 0.34, M.lightWood, 0, 0, 0); for (let i = 0; i < Math.floor(len / 0.5); i++) pbox(g, 0.46, 0.64, 0.02, M.door, -len / 2 + 0.25 + i * 0.5, 0.03, 0.17, 0.6); g.position.set(x, y, z); g.rotation.y = ry; W.scene.add(g); return g; },
  fridge(x, z, ry) {
    const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0xc8c2b0, roughness: 0.35, map: TEX.plaster.map });
    const b = new THREE.Mesh(lumpy(new THREE.BoxGeometry(0.75, 1.75, 0.7, 2, 4, 2), 0.004), m); b.position.y = 0.875; b.castShadow = b.receiveShadow = true; g.add(b);
    pbox(g, 0.02, 0.5, 0.03, M.chrome, 0.3, 0.9, 0.36, 0); pbox(g, 0.02, 0.3, 0.03, M.chrome, 0.3, 1.35, 0.36, 0); pbox(g, 0.74, 0.01, 0.01, M.black, 0, 1.22, 0.355, 0);
    for (let i = 0; i < 3; i++) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.26), new THREE.MeshStandardMaterial({ map: paperDrawing(i + 5), roughness: 0.9 })); d.position.set(-0.18 + i * 0.16, 0.95 + (i % 2) * 0.3, 0.352); d.rotation.z = rand(-0.2, 0.2); g.add(d); }
    return place(g, x, z, ry, 0.75, 0.7, 1.75);
  },
  stove(x, z, ry) { const g = new THREE.Group(); pbox(g, 0.7, 0.88, 0.62, M.ceramic, 0, 0, 0, 0); pbox(g, 0.7, 0.02, 0.6, M.black, 0, 0.88, 0, 0); for (const sx of [-0.17, 0.17]) for (const sz of [-0.14, 0.14]) part(g, new THREE.TorusGeometry(0.08, 0.012, 6, 16), M.metalDark, sx, 0.9, sz, Math.PI / 2); pbox(g, 0.6, 0.45, 0.02, M.glassDark, 0, 0.2, 0.31, 0); const pot = part(g, new THREE.CylinderGeometry(0.11, 0.1, 0.16, 16), M.metalDark, 0.17, 0.98, 0.14); return place(g, x, z, ry, 0.7, 0.62, 0.95); },
  sink(x, z, ry) { const g = new THREE.Group(); pbox(g, 0.6, 0.12, 0.45, M.chrome, 0, 0.78, 0, 0); const fa = part(g, new THREE.TorusGeometry(0.1, 0.012, 6, 12, Math.PI), M.chrome, 0, 1.0, -0.18); return place(g, x, z, ry); },
  bed(x, z, ry, blanket = M.fabricBlue) {
    const g = new THREE.Group(), m = M.darkWood;
    pbox(g, 1.5, 0.3, 2.05, m, 0, 0.12, 0); pbox(g, 1.5, 1.1, 0.06, m, 0, 0, -1.02); pbox(g, 1.5, 0.6, 0.06, m, 0, 0, 1.02);
    const mat_ = new THREE.Mesh(lumpy(new THREE.BoxGeometry(1.4, 0.2, 1.95, 4, 2, 6), 0.012), M.sheet); mat_.position.y = 0.52; g.add(mat_);
    const bl = new THREE.Mesh(lumpy(new THREE.BoxGeometry(1.5, 0.06, 1.4, 8, 2, 8), 0.025, 5, 4), blanket); bl.position.set(0, 0.64, 0.32); bl.rotation.z = 0.02; g.add(bl);
    for (const s of [-0.35, 0.35]) { const p = new THREE.Mesh(lumpy(new THREE.SphereGeometry(0.28, 12, 8), 0.02), M.sheet); p.scale.set(1, 0.3, 0.6); p.position.set(s, 0.68, -0.8); g.add(p); }
    g.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    return place(g, x, z, ry, 1.5, 2.1, 0.7);
  },
  wardrobe(x, z, ry) { const g = new THREE.Group(); pbox(g, 1.2, 2.1, 0.6, M.darkWood, 0, 0, 0); pbox(g, 0.58, 1.9, 0.02, M.darkWood, -0.3, 0.1, 0.31); const door = pbox(g, 0.58, 1.9, 0.02, M.darkWood, 0.3, 0.1, 0.33); door.rotation.y = -0.25; door.position.x = 0.36; door.position.z = 0.4; return place(g, x, z, ry, 1.2, 0.6, 2.1); },
  nightstand(x, z, ry) { const g = new THREE.Group(); pbox(g, 0.45, 0.55, 0.4, M.darkWood, 0, 0, 0); pbox(g, 0.4, 0.18, 0.02, M.lightWood, 0, 0.3, 0.2); return place(g, x, z, ry, 0.45, 0.4, 0.6); },
  tub(x, z, ry) { const g = new THREE.Group(), m = M.ceramic; pbox(g, 1.7, 0.55, 0.06, m, 0, 0, 0.36, 0); pbox(g, 1.7, 0.55, 0.06, m, 0, 0, -0.36, 0); pbox(g, 0.06, 0.55, 0.78, m, 0.82, 0, 0, 0); pbox(g, 0.06, 0.55, 0.78, m, -0.82, 0, 0, 0); pbox(g, 1.6, 0.06, 0.7, m, 0, 0.0, 0, 0); const wat = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 0.66), new THREE.MeshStandardMaterial({ color: 0x1a1408, roughness: 0.05, metalness: 0.3 })); wat.rotation.x = -Math.PI / 2; wat.position.y = 0.3; g.add(wat); return place(g, x, z, ry, 1.7, 0.8, 0.6); },
  toilet(x, z, ry) { const g = new THREE.Group(), m = M.ceramic; part(g, new THREE.CylinderGeometry(0.2, 0.15, 0.4, 14), m, 0, 0.2, 0.08); part(g, new THREE.TorusGeometry(0.17, 0.035, 8, 16), m, 0, 0.42, 0.08, Math.PI / 2); pbox(g, 0.42, 0.4, 0.18, m, 0, 0.38, -0.2, 0); return place(g, x, z, ry, 0.45, 0.65, 0.8); },
  mirror(x, y, z, ry) { const g = new THREE.Group(); pbox(g, 0.6, 0.8, 0.03, M.darkWood, 0, 0, 0, 0); const mm = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.72), new THREE.MeshStandardMaterial({ color: 0x8a8f90, roughness: 0.08, metalness: 1 })); mm.position.set(0, 0.4, 0.02); g.add(mm); const crack = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.72), new THREE.MeshBasicMaterial({ map: TEX.web.map, transparent: true, opacity: 0.4 })); crack.position.set(0, 0.4, 0.022); g.add(crack); g.position.set(x, y, z); g.rotation.y = ry; W.scene.add(g); return g; },
  boxes(x, z, n = 3, size = 0.55, ry = 0) {
    const g = new THREE.Group(); let y = 0, hMax = 0;
    for (let i = 0; i < n; i++) { const s = size * rand(0.7, 1), h = s * rand(0.6, 0.9); const b = new THREE.Mesh(lumpy(new THREE.BoxGeometry(s, h, s * rand(0.8, 1.1), 2, 2, 2), 0.008), M.cardboard); b.position.set(rand(-0.06, 0.06), y + h / 2, rand(-0.06, 0.06)); b.rotation.y = rand(-0.3, 0.3); b.castShadow = b.receiveShadow = true; g.add(b); y += h; }
    hMax = y; return place(g, x, z, ry, size * 1.05, size * 1.05, hMax);
  },
  crate(x, z, s = 0.8, ry = 0) { const g = new THREE.Group(); pbox(g, s, s, s, M.lightWood, 0, 0, 0, 0.6); for (const sy of [0.05, s - 0.1]) { pbox(g, s + 0.02, 0.08, s + 0.02, M.darkWood, 0, sy, 0, 0.5); } pbox(g, 0.08, s, s + 0.02, M.darkWood, s / 2 - 0.03, 0, 0, 0.5); pbox(g, 0.08, s, s + 0.02, M.darkWood, -s / 2 + 0.03, 0, 0, 0.5); return place(g, x, z, ry, s, s, s); },
  barrel(x, z) { const g = new THREE.Group(); part(g, lumpy(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 16, 3), 0.01), M.rust, 0, 0.45, 0); for (const y of [0.15, 0.75]) part(g, new THREE.TorusGeometry(0.305, 0.015, 6, 20), M.metalDark, 0, y, 0, Math.PI / 2); return place(g, x, z, 0, 0.6, 0.6, 0.9); },
  candle(x, y, z, lit = true, light = false) {
    const g = new THREE.Group(); g.position.set(x, y, z); W.scene.add(g); g.userData.dynamic = true;
    part(g, new THREE.CylinderGeometry(0.03, 0.035, 0.18, 10), new THREE.MeshStandardMaterial({ color: 0xd8cfb0, roughness: 0.6 }), 0, 0.09, 0);
    const fm = new THREE.MeshBasicMaterial({ color: 0xffb040, transparent: true, opacity: 0.95 });
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.07, 8), fm); fl.position.y = 0.22; g.add(fl);
    const glow = eyeGlow(0xff9030, 0.35); glow.position.y = 0.22; g.add(glow);
    let pl = null; if (light) { pl = new THREE.PointLight(0xff9a40, lit ? 1.4 : 0, 5, 2); pl.position.y = 0.3; g.add(pl); }
    fl.visible = glow.visible = lit;
    const c = { g, fl, glow, pl, lit, set(v) { c.lit = v; fl.visible = glow.visible = v; if (pl) pl.intensity = v ? 1.4 : 0; } };
    W.updaters.push((dt, t) => { if (!c.lit) return; const f = 0.85 + Math.sin(t * 13 + x) * 0.08 + Math.random() * 0.1; fl.scale.set(1, f, 1); fl.rotation.z = Math.sin(t * 5 + z) * 0.1; if (pl) pl.intensity = 1.3 * f; });
    return c;
  },
  cobweb(x, y, z, ry, s = 0.8) { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), M.web); m.position.set(x, y, z); m.rotation.y = ry; m.userData.dynamic = true; W.scene.add(m); return m; },
  noteMesh(x, y, z, ry, flat = true) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.28), new THREE.MeshStandardMaterial({ map: textTex(['~~~~~', '~~~~', '~~~~~'], { w: 128, h: 160, bg: '#d9cfb6', fg: '#3a3026', font: '22px "Homemade Apple"' }), roughness: 0.9, side: THREE.DoubleSide })); if (flat) { m.rotation.x = -Math.PI / 2; m.rotation.z = ry; } else m.rotation.y = ry; m.position.set(x, y, z); W.scene.add(m); return m; },
  sheetCovered(x, z, w = 1.2, h = 1.1, d = 0.8, ry = 0) {
    const g = new THREE.Group(); const geo = lumpy(new THREE.BoxGeometry(w, h, d, 6, 5, 4), 0.05, 4, rand(0, 9)); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < -h / 2 + 0.05) { p.setX(i, p.getX(i) * 1.08); p.setZ(i, p.getZ(i) * 1.08); } geo.computeVertexNormals();
    const s = new THREE.Mesh(geo, M.sheet); s.position.y = h / 2; s.castShadow = s.receiveShadow = true; g.add(s); return place(g, x, z, ry, w, d, h);
  },
  pipe(x0, y0, z0, x1, y1, z1, r = 0.07) { const a = V3(x0, y0, z0), b = V3(x1, y1, z1), len = a.distanceTo(b); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), M.rust); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), b.clone().sub(a).normalize()); m.castShadow = true; m.receiveShadow = true; W.scene.add(m); return m; },
  bulb(x, y, z) { const g = new THREE.Group(); part(g, new THREE.CylinderGeometry(0.004, 0.004, 0.5, 4), M.black, 0, -0.25, 0); part(g, new THREE.SphereGeometry(0.05, 10, 8), M.bulbOff, 0, -0.55, 0); g.position.set(x, y, z); W.scene.add(g); g.userData.dynamic = true; W.updaters.push((dt, t) => { g.rotation.z = Math.sin(t * 0.8 + x) * 0.05; g.rotation.x = Math.cos(t * 0.6 + z) * 0.04; }); return g; },
  headPile(x, z, n = 4) {
    const g = new THREE.Group(); const fur = [furMaterial('furBear'), furMaterial('furRabbit'), furMaterial('furFox'), furMaterial('furChick')];
    for (let i = 0; i < n; i++) { const sp = n > 3 ? 0.4 : 0.18; const hm = new THREE.Mesh(lumpy(new THREE.SphereGeometry(0.22, 14, 10), 0.03, 7, i), fur[i % 4]); hm.position.set(rand(-sp, sp), 0.2 + (i > 2 ? 0.3 : 0), rand(-sp, sp)); hm.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3)); g.add(hm); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshStandardMaterial({ color: 0xbbb39a, roughness: 0.2 })); e.position.set(s * 0.08, 0.05, 0.19); hm.add(e); } }
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return place(g, x, z, 0, n > 3 ? 1.0 : 0.6, n > 3 ? 1.0 : 0.6, 0.8);
  },
};

/* =====================================================================
   OBJETOS COLECCIONABLES
   ===================================================================== */
const ITEM_MODELS = {
  'Osito de peluche': () => { const g = new THREE.Group(), m = solidFur('furBear'); part(g, new THREE.SphereGeometry(0.09, 10, 8), m, 0, 0.09, 0); part(g, new THREE.SphereGeometry(0.07, 10, 8), m, 0, 0.21, 0); for (const s of [-1, 1]) { part(g, new THREE.SphereGeometry(0.025, 6, 6), m, s * 0.05, 0.27, 0); part(g, new THREE.SphereGeometry(0.035, 6, 6), m, s * 0.08, 0.05, 0.05); } part(g, new THREE.SphereGeometry(0.012, 6, 6), M.black, -0.025, 0.23, 0.06); return g; },
  'Fotografía familiar': () => { const g = new THREE.Group(); pbox(g, 0.18, 0.24, 0.02, M.darkWood, 0, 0, 0, 0); const p = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.2), new THREE.MeshStandardMaterial({ map: portrait(0) })); p.position.set(0, 0.12, 0.011); g.add(p); g.rotation.x = -0.2; return g; },
  'Caja de música rota': () => { const g = new THREE.Group(); pbox(g, 0.18, 0.1, 0.12, M.darkWood, 0, 0, 0, 0); const lid = pbox(g, 0.18, 0.015, 0.12, M.darkWood, 0, 0.1, -0.06, 0); lid.rotation.x = -1.0; part(g, new THREE.CylinderGeometry(0.006, 0.006, 0.05, 4), M.chrome, 0.05, 0.12, 0.02); return g; },
  'Coche de juguete': () => { const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0x8a1410, roughness: 0.35, metalness: 0.4 }); pbox(g, 0.2, 0.05, 0.09, m, 0, 0.02, 0, 0); pbox(g, 0.1, 0.04, 0.08, m, -0.02, 0.07, 0, 0); for (const sx of [-0.06, 0.06]) for (const sz of [-0.05, 0.05]) part(g, new THREE.CylinderGeometry(0.022, 0.022, 0.015, 10), M.black, sx, 0.022, sz, Math.PI / 2); return g; },
  'Cámara antigua': () => { const g = new THREE.Group(); pbox(g, 0.16, 0.1, 0.08, M.black, 0, 0, 0, 0); part(g, new THREE.CylinderGeometry(0.035, 0.035, 0.05, 14), M.chrome, 0, 0.05, 0.06, Math.PI / 2); return g; },
  'Taza con nombre': () => { const g = new THREE.Group(); part(g, new THREE.CylinderGeometry(0.045, 0.04, 0.1, 14, 1, true), M.ceramic, 0, 0.05, 0).material.side = THREE.DoubleSide; part(g, new THREE.TorusGeometry(0.03, 0.008, 6, 10), M.ceramic, 0.05, 0.05, 0); return g; },
  'Reloj de bolsillo': () => { const g = new THREE.Group(), gold = new THREE.MeshStandardMaterial({ color: 0xb08a3a, metalness: 1, roughness: 0.3 }); part(g, new THREE.CylinderGeometry(0.045, 0.045, 0.015, 18), gold, 0, 0.008, 0); part(g, new THREE.TorusGeometry(0.012, 0.003, 4, 8), gold, 0, 0.008, -0.055, Math.PI / 2); return g; },
  'Radio de bolsillo': () => { const g = new THREE.Group(); pbox(g, 0.16, 0.1, 0.05, new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.5 }), 0, 0, 0, 0); part(g, new THREE.CircleGeometry(0.03, 12), M.chrome, -0.03, 0.05, 0.026); return g; },
  'Diario rojo': () => { const g = new THREE.Group(); pbox(g, 0.15, 0.03, 0.2, new THREE.MeshStandardMaterial({ color: 0x5a0e0a, roughness: 0.7 }), 0, 0, 0, 0); return g; },
  'Muñeca de trapo': () => { const g = new THREE.Group(); part(g, new THREE.ConeGeometry(0.07, 0.16, 10), M.fabricBlue, 0, 0.08, 0); part(g, new THREE.SphereGeometry(0.045, 10, 8), M.sheet, 0, 0.2, 0); part(g, new THREE.SphereGeometry(0.008, 4, 4), M.black, -0.015, 0.21, 0.04); part(g, new THREE.SphereGeometry(0.008, 4, 4), M.black, 0.015, 0.21, 0.04); return g; },
  'Llave inglesa': () => { const g = new THREE.Group(); pbox(g, 0.03, 0.012, 0.22, M.chrome, 0, 0, 0, 0); part(g, new THREE.TorusGeometry(0.03, 0.01, 6, 10, 4.5), M.chrome, 0, 0.006, 0.12, Math.PI / 2); return g; },
  'Engranaje': () => { const g = new THREE.Group(); part(g, new THREE.TorusGeometry(0.07, 0.025, 6, 16), M.rust, 0, 0.02, 0, Math.PI / 2); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; pbox(g, 0.025, 0.03, 0.025, M.rust, Math.cos(a) * 0.1, 0.005, Math.sin(a) * 0.1, 0); } return g; },
  'Cinta de casete': () => { const g = new THREE.Group(); pbox(g, 0.1, 0.015, 0.065, M.black, 0, 0, 0, 0); const l = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.03), new THREE.MeshStandardMaterial({ map: textTex(['NO ESCUCHAR'], { w: 128, h: 48, bg: '#ddd', fg: '#a00', font: '16px "Special Elite"' }) })); l.rotation.x = -Math.PI / 2; l.position.y = 0.016; g.add(l); return g; },
  'Fusible viejo': () => { const g = new THREE.Group(); part(g, new THREE.CylinderGeometry(0.02, 0.02, 0.08, 10), new THREE.MeshStandardMaterial({ color: 0xbfa070, roughness: 0.4 }), 0, 0.02, 0, 0, 0, Math.PI / 2); return g; },
  'Volante de válvula': () => { const g = new THREE.Group(); part(g, new THREE.TorusGeometry(0.08, 0.012, 6, 16), new THREE.MeshStandardMaterial({ color: 0x7a1010, roughness: 0.5 }), 0, 0.012, 0, Math.PI / 2); for (let i = 0; i < 3; i++) { const s = pbox(g, 0.16, 0.012, 0.012, M.rust, 0, 0.006, 0, 0); s.rotation.y = i * Math.PI / 3; } return g; },
  'Máscara de gas': () => { const g = new THREE.Group(); const f = part(g, lumpy(new THREE.SphereGeometry(0.08, 12, 10), 0.005), M.black, 0, 0.06, 0); f.scale.set(1, 1.2, 0.7); for (const s of [-1, 1]) part(g, new THREE.CircleGeometry(0.025, 12), M.glassDark, s * 0.03, 0.08, 0.057); part(g, new THREE.CylinderGeometry(0.03, 0.035, 0.05, 12), M.metalDark, 0, 0.02, 0.06, Math.PI / 2); return g; },
  'Ojo de cristal': () => { const g = new THREE.Group(); part(g, new THREE.SphereGeometry(0.035, 12, 10), new THREE.MeshStandardMaterial({ color: 0xddd8c8, roughness: 0.1 }), 0, 0.035, 0); part(g, new THREE.CircleGeometry(0.014, 12), new THREE.MeshStandardMaterial({ color: 0x2a5a8a }), 0, 0.04, 0.034); return g; },
  'Cabeza de muñeca': () => { const g = new THREE.Group(); part(g, new THREE.SphereGeometry(0.06, 12, 10), M.ceramic, 0, 0.06, 0); for (const s of [-1, 1]) part(g, new THREE.SphereGeometry(0.01, 6, 6), M.black, s * 0.02, 0.07, 0.054); return g; },
  'Armónica': () => { const g = new THREE.Group(); pbox(g, 0.12, 0.02, 0.03, M.chrome, 0, 0, 0, 0); return g; },
  'Marioneta': () => { const g = new THREE.Group(); part(g, new THREE.CylinderGeometry(0.03, 0.05, 0.16, 8), M.black, 0, 0.08, 0); const h = part(g, new THREE.SphereGeometry(0.045, 10, 8), M.ceramic, 0, 0.2, 0); for (const s of [-1, 1]) part(g, new THREE.SphereGeometry(0.008, 4, 4), M.black, s * 0.016, 0.21, 0.04); part(g, new THREE.TorusGeometry(0.01, 0.003, 4, 8), new THREE.MeshBasicMaterial({ color: 0xaa0000 }), 0, 0.18, 0.043); return g; },
  'Máscara de porcelana': () => { const g = new THREE.Group(); const f = part(g, new THREE.SphereGeometry(0.09, 14, 10, 0, Math.PI), M.ceramic, 0, 0.02, 0, -Math.PI / 2, 0, 0); f.scale.set(1, 1.2, 0.5); return g; },
  'Trofeo oxidado': () => { const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0x8a6a2a, metalness: 1, roughness: 0.45 }); part(g, new THREE.CylinderGeometry(0.04, 0.05, 0.04, 10), M.darkWood, 0, 0.02, 0); part(g, new THREE.CylinderGeometry(0.01, 0.01, 0.08, 6), m, 0, 0.08, 0); part(g, new THREE.CylinderGeometry(0.05, 0.02, 0.07, 12, 1, true), m, 0, 0.15, 0); return g; },
  'Caballito de madera': () => { const g = new THREE.Group(); pbox(g, 0.14, 0.06, 0.04, M.lightWood, 0, 0.06, 0, 0); pbox(g, 0.04, 0.08, 0.04, M.lightWood, 0.07, 0.1, 0, 0); for (const s of [-0.05, 0.05]) pbox(g, 0.015, 0.06, 0.015, M.lightWood, s, 0, 0, 0); return g; },
};
const LEVEL_ITEMS = {
  floor: ['Osito de peluche', 'Fotografía familiar', 'Caja de música rota', 'Coche de juguete', 'Cámara antigua', 'Taza con nombre', 'Reloj de bolsillo', 'Radio de bolsillo', 'Diario rojo', 'Muñeca de trapo'],
  basement: ['Llave inglesa', 'Engranaje', 'Cinta de casete', 'Fusible viejo', 'Volante de válvula', 'Máscara de gas', 'Ojo de cristal', 'Cabeza de muñeca'],
  attic: ['Muñeca de trapo', 'Armónica', 'Marioneta', 'Máscara de porcelana', 'Trofeo oxidado', 'Caballito de madera', 'Reloj de bolsillo', 'Fotografía familiar'],
};
function spawnItems(spots, names, count) {
  const chosenSpots = shuffle(spots.slice()).slice(0, count), chosenNames = shuffle(names.slice()).slice(0, count);
  chosenSpots.forEach((s, i) => {
    const name = chosenNames[i], g = ITEM_MODELS[name]();
    g.position.set(s[0], s[1], s[2]); g.rotation.y = rand(0, TAU); W.scene.add(g);
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
    const glint = eyeGlow(0xfff2d0, 0.18); glint.position.y = 0.12; g.add(glint);
    W.updaters.push((dt, t) => { glint.material.opacity = Math.max(0, Math.sin(t * 2.2 + i * 1.7)) ** 8 * 0.9; });
    const it = { name, g, got: false };
    addInteract(g, 'Recoger ' + name.toLowerCase(), () => collectItem(it));
    W.items.push(it);
  });
}

/* =====================================================================
   LORE
   ===================================================================== */
const LORE = [
  { id: 'f1', lv: 0, title: 'Nota pegada en la nevera', text: 'Papá dice que no bajemos al sótano. Dice que "los está arreglando". Anoche oí algo andar por el pasillo y no eran sus pasos. Pesaba más. Arrastraba algo metálico.' },
  { id: 'f2', lv: 0, title: 'Agenda del dormitorio', text: 'El cuadro eléctrico del estudio sigue mal. Si quiero que la estantería se abra tengo que subir los interruptores en orden: <b>{FUSE}</b>. Si me equivoco salta todo y vuelta a empezar.<br><br>No dejar que el niño entre. NUNCA.' },
  { id: 'f3', lv: 0, title: 'Diario del ingeniero · Estudio secreto', text: 'Día 41. Cuando cerraron "El Palacio de la Fiesta de Bruno" me traje a los cuatro. Chatarra, decían. Teddy aún tiene la mitad de la cara quemada del incendio.<br><br>Le he puesto la vieja caja de música dentro. Cuando suena, se queda quieto. Escuchando. Como si recordara algo.' },
  { id: 'b1', lv: 1, title: 'Hoja de mantenimiento', text: 'Unidad HOPPER: placa facial perdida. Los sensores ópticos funcionan sin carcasa. NO responde a la luz como los demás. Se guía por el oído y por la vista. El vapor de las tuberías le ciega. Las linternas rojas del pasillo le confunden… o me confunden a mí.' },
  { id: 'b2', lv: 1, title: 'Nota arrugada', text: 'He escondido la adrenalina en el cuarto de herramientas detrás de la puerta con teclado. Los números están escritos con tiza en las paredes, por si se me olvida. Siempre se me olvida.' },
  { id: 'b3', lv: 1, title: 'Diario del ingeniero · Cuarto sellado', text: 'Día 63. Ya no los apago. No sé cómo se encienden solos. Hopper golpea la puerta del sótano cada noche a las 3:00. Golpea tres veces. Siempre tres.<br><br>Mi hijo dice que le hablan por las rejillas.' },
  { id: 'a1', lv: 2, title: 'Carta sin enviar', text: 'Redtail odia la luz. Cuando le apuntas se tapa la cara y se queda temblando. Pero RECUERDA. Cada vez que lo haces se enfada más. Si ves que sus ojos se vuelven rojos… ya no hay nada que hacer.' },
  { id: 'a2', lv: 2, title: 'Instrucciones a lápiz', text: 'Tres velas para tres niños que ya no están. Cuando las tres ardan, la pared se abrirá.<br><br>Las cerillas estaban junto a la ventana redonda.' },
  { id: 'a3', lv: 2, title: 'Diario del ingeniero · Hueco del ático', text: 'Día 88. Le di una bengala a mi hijo. "Si el zorro viene, enciéndela". La luz roja no le enfada: le asusta de verdad. Ahora la guardo yo aquí arriba, en el hueco detrás de las velas.' },
  { id: 'r1', lv: 3, title: 'Página arrancada', text: 'Mamá Peep no se mueve si la miras. Eso lo sabe todo el mundo. Lo que nadie dice es que tampoco le gusta que la mires demasiado tiempo.' },
  { id: 'r2', lv: 3, title: 'Lápida sin nombre', text: '"Aquí descansa lo que quedó de él. Lo demás se lo quedaron ellos."<br><br>Bajo las flores hay una llave atada a un hilo rojo… no, la llave está en el espantapájaros. Las flores solo esconden su nombre.' },
  { id: 'r3', lv: 3, title: 'Diario del ingeniero · Cabaña', text: 'Último día. Puse un trozo de mí en cada uno de ellos para que funcionaran. No fue suficiente. Si alguien lee esto: los dibujos de mi hijo son lo único que reconocen. Recógelos todos y quizá le dejen marchar.<br><br>La cámara de fotos les deslumbra sin enfadarlos. Úsala bien.' },
];
function addNote(id, x, y, z, ry = 0, flat = true) {
  const L = LORE.find((l) => l.id === id); const m = F.noteMesh(x, y, z, ry, flat);
  addInteract(m, 'Leer nota', () => { showNote(L); if (!SAVE.lore.includes(id)) { SAVE.lore.push(id); persist(); } }); return m;
}

/* =====================================================================
   ILUMINACIÓN COMÚN DE NIVEL
   ===================================================================== */
function levelLights({ hemi = 0.06, moon = 0.06, moonDir = [-1, 1.1, -0.7], center = [8, 0, 6], extent = 16, lightningGain = 9, moonColor = 0x8ea0c8 } = {}) {
  const sc = W.scene;
  const h = new THREE.HemisphereLight(0x8090b0, 0x201810, hemi); sc.add(h);
  const d = new THREE.DirectionalLight(moonColor, moon);
  d.position.set(center[0] + moonDir[0] * 30, center[1] + moonDir[1] * 30, center[2] + moonDir[2] * 30); d.target.position.set(...center); sc.add(d.target);
  d.castShadow = true; d.shadow.mapSize.set(2048, 2048); const s = d.shadow.camera; s.left = -extent; s.right = extent; s.top = extent; s.bottom = -extent; s.near = 1; s.far = 120; d.shadow.bias = -0.0006; d.shadow.normalBias = 0.03;
  d.shadow.autoUpdate = false; d.shadow.needsUpdate = true;
  sc.add(d);
  W.moon = d; W.hemi = h; W.moonBase = moon; W.hemiBase = hemi; W.lightningGain = lightningGain;
  const js = new THREE.PointLight(0xd8e0ff, 0, 4, 2); sc.add(js); W.jsLight = js;
}
