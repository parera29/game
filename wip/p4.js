
/* =====================================================================
   ANIMATRÓNICOS "SCRAPPED" (modelos procedurales + animación)
   ===================================================================== */
const SPECS = {
  bear: { name: 'TEDDY', title: 'El Anfitrión', fur: 'furBear', eye: 0xcfe2ff, hip: 0.98, thigh: 0.46, shin: 0.46, torsoW: 0.5, torsoH: 0.78, shoulder: 0.46, arm: 0.42, fore: 0.42, headR: 0.3, hunch: 0.12, jawRest: 0.22, scream: 'bear', limbR: 0.12 },
  rabbit: { name: 'HOPPER', title: 'El Sin Rostro', fur: 'furRabbit', eye: 0xff2010, hip: 1.04, thigh: 0.5, shin: 0.5, torsoW: 0.38, torsoH: 0.8, shoulder: 0.38, arm: 0.46, fore: 0.46, headR: 0.25, hunch: 0.35, jawRest: 0.3, scream: 'rabbit', limbR: 0.085 },
  fox: { name: 'REDTAIL', title: 'El Capitán', fur: 'furFox', eye: 0xffc22a, hip: 1.0, thigh: 0.5, shin: 0.5, torsoW: 0.34, torsoH: 0.72, shoulder: 0.36, arm: 0.46, fore: 0.48, headR: 0.24, hunch: 0.25, jawRest: 0.55, scream: 'fox', limbR: 0.08 },
  chick: { name: 'MAMÁ PEEP', title: 'La Que Espera', fur: 'furChick', eye: 0xffd6f0, hip: 0.9, thigh: 0.42, shin: 0.44, torsoW: 0.52, torsoH: 0.82, shoulder: 0.44, arm: 0.42, fore: 0.42, headR: 0.29, hunch: 0.1, jawRest: 0.18, scream: 'chick', limbR: 0.1 },
};
function furMaterial(key) {
  if (M['fm_' + key]) return M['fm_' + key];
  const t = TEX[key];
  return sharedMat('fm_' + key, new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap, roughnessMap: t.roughnessMap, alphaMap: t.alphaMap, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }));
}
function solidFur(key) {
  if (M['sf_' + key]) return M['sf_' + key];
  const t = TEX[key];
  return sharedMat('sf_' + key, new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap, roughnessMap: t.roughnessMap, roughness: 1 }));
}
function lumpy(geo, amp = 0.02, freq = 6, seed = 1) {
  geo.computeVertexNormals();
  const p = geo.attributes.position, n = geo.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const d = (Math.sin(x * freq + seed) * Math.cos(y * freq * 1.3 + seed * 2) + Math.sin(z * freq * 0.9 + y * 2 + seed) * 0.6 + Math.sin((x + z) * freq * 2.7) * 0.25) * amp;
    p.setXYZ(i, x + n.getX(i) * d, y + n.getY(i) * d, z + n.getZ(i) * d);
  }
  geo.computeVertexNormals(); return geo;
}
let _eyeGlowTex = null;
function eyeGlow(color, size = 0.35) {
  if (!_eyeGlowTex) _eyeGlowTex = TEX.soft.map;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: _eyeGlowTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9 }));
  s.scale.set(size, size, size); return s;
}
function wireBundle(group, origin, count = 5, len = 0.5, spread = 0.12) {
  const cols = [0x8a1010, 0x111111, 0xb08a10, 0x14306a, 0x2a2a2a];
  for (let i = 0; i < count; i++) {
    const a = rand(0, TAU), pts = [];
    const sx = Math.cos(a) * spread, sz = Math.sin(a) * spread, L = len * rand(0.5, 1.3);
    for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push(V3(origin.x + sx * t * 1.5 + Math.sin(t * 7 + i) * 0.02, origin.y - t * L - Math.sin(t * Math.PI) * 0.04, origin.z + sz * t * 1.5 + Math.cos(t * 5 + i) * 0.02)); }
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, rand(0.005, 0.01), 5, false);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: pick(cols), roughness: 0.5 })); m.castShadow = true; group.add(m);
    if (Math.random() < 0.4) { const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03, 4), M.chrome); tip.position.copy(pts[5]); group.add(tip); }
  }
}
function teethRow(group, n, width, depth, size, y, z, down = true, sharp = false, mat = null) {
  const tm = mat || new THREE.MeshStandardMaterial({ color: 0xcfc4a0, roughness: 0.35 });
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1), a = (t - 0.5) * Math.PI * 0.9;
    const x = Math.sin(a) * width, zz = z + Math.cos(a) * depth - depth;
    const s = size * rand(0.75, 1.25) * (1 - Math.abs(t - 0.5) * 0.6);
    let g;
    if (sharp) { g = new THREE.ConeGeometry(s * 0.45, s * 2.2, 5); if (!down) g.rotateX(Math.PI); }
    else { g = new THREE.BoxGeometry(s * 0.8, s * 1.2, s * 0.5); }
    const m = new THREE.Mesh(g, tm); m.position.set(x, y + (down ? -s * 0.6 : s * 0.6) * (sharp ? 1 : 1), zz); m.rotation.y = a; m.rotation.z = rand(-0.15, 0.15); m.castShadow = true; group.add(m);
    if (Math.random() < 0.12) m.visible = false;
  }
}
function limb(r, len, material, endo = true, shell = true) {
  const g = new THREE.Group();
  if (endo) { const rod = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.28, r * 0.28, len, 8), M.endo); rod.position.y = -len / 2; rod.castShadow = true; g.add(rod); const p2 = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.16, r * 0.16, len * 0.7, 6), M.chrome); p2.position.set(r * 0.32, -len / 2, 0); g.add(p2); }
  if (shell) { const cg = lumpy(new THREE.CapsuleGeometry(r, len * 0.75, 4, 12), r * 0.12, 9, rand(0, 9)); const c = new THREE.Mesh(cg, material); c.position.y = -len / 2; c.castShadow = true; g.add(c); }
  const joint = new THREE.Mesh(new THREE.SphereGeometry(r * 0.45, 10, 8), M.endo); joint.castShadow = true; g.add(joint);
  return g;
}
function hand(material, r, endoOnly = false) {
  const g = new THREE.Group();
  const palm = new THREE.Mesh(endoOnly ? new THREE.BoxGeometry(r * 1.2, r * 1.2, r * 0.5) : lumpy(new THREE.SphereGeometry(r * 0.9, 10, 8), r * 0.1), endoOnly ? M.endo : material); palm.scale.set(1, 1.15, 0.7); palm.position.y = -r * 0.8; palm.castShadow = true; g.add(palm);
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Group(); f.position.set((i - 1.5) * r * 0.45, -r * 1.6, 0); f.rotation.x = -0.3 - i * 0.05;
    const L = r * (1.1 + (i === 1 || i === 2 ? 0.25 : 0));
    const s1 = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.1, r * 0.12, L, 5), M.endo); s1.position.y = -L / 2; f.add(s1);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(r * 0.1, r * 0.5, 5), M.endo); tip.position.y = -L - r * 0.2; tip.rotation.x = Math.PI; f.add(tip);
    g.add(f);
  }
  return g;
}
function buildAnimatronic(kind) {
  const S = SPECS[kind], fur = furMaterial(S.fur), belly = furMaterial('furBelly');
  const root = new THREE.Group(); root.userData.dynamic = true; root.name = kind;
  const J = {}; const A = { kind, spec: S, root, j: J, t: rand(0, 10), phase: 0, twitch: { t: 2, rx: 0, ry: 0, rz: 0, cur: V3() }, eyes: [], glows: [], jaw: S.jawRest, look: 0, lookP: 0 };
  const hips = (J.hips = new THREE.Group()); hips.position.y = S.hip; root.add(hips);
  const pel = new THREE.Mesh(lumpy(new THREE.SphereGeometry(S.torsoW * 0.75, 14, 10), 0.02), fur); pel.scale.set(1, 0.55, 0.8); hips.add(pel);
  const pelE = new THREE.Mesh(new THREE.BoxGeometry(S.torsoW * 0.9, 0.08, 0.16), M.endo); hips.add(pelE);
  // piernas
  for (const sd of [-1, 1]) {
    const L = new THREE.Group(); L.position.set(sd * S.torsoW * 0.42, -0.05, 0); hips.add(L);
    const thighShell = !(kind === 'fox' && sd === 1);
    L.add(limb(S.limbR * 1.15, S.thigh, fur, true, thighShell));
    const K = new THREE.Group(); K.position.y = -S.thigh; L.add(K);
    K.add(limb(S.limbR, S.shin, fur, true, kind !== 'fox'));
    const F = new THREE.Group(); F.position.y = -S.shin; K.add(F);
    const foot = new THREE.Mesh(kind === 'fox' ? new THREE.BoxGeometry(0.1, 0.06, 0.26) : lumpy(new THREE.SphereGeometry(S.limbR * 1.3, 10, 8), 0.01), kind === 'fox' ? M.endo : fur);
    if (kind !== 'fox') foot.scale.set(1, 0.5, 1.8); foot.position.set(0, -0.04, 0.08); foot.castShadow = true; F.add(foot);
    if (kind === 'chick') for (let t = -1; t <= 1; t++) { const toe = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.16, 5), M.endo); toe.rotation.x = Math.PI / 2; toe.position.set(t * 0.06, -0.06, 0.25); F.add(toe); }
    J[sd < 0 ? 'legR' : 'legL'] = L; J[sd < 0 ? 'kneeR' : 'kneeL'] = K;
  }
  // torso
  const spine = (J.spine = new THREE.Group()); spine.position.y = 0.05; spine.rotation.x = S.hunch; hips.add(spine);
  const tw = S.torsoW, th = S.torsoH;
  const prof = kind === 'chick'
    ? [[0.02, 0], [tw * 0.7, 0.04], [tw * 1.05, th * 0.3], [tw * 1.0, th * 0.55], [tw * 0.78, th * 0.8], [tw * 0.4, th * 0.98], [0.06, th]]
    : [[0.02, 0], [tw * 0.6, 0.03], [tw * 0.82, th * 0.3], [tw * 0.92, th * 0.62], [tw * 0.85, th * 0.85], [tw * 0.5, th * 0.98], [0.06, th]];
  const lg = lumpy(new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p[0], p[1])), 20), 0.025, 7, kind.length);
  const torso = new THREE.Mesh(lg, fur); torso.scale.z = 0.78; torso.castShadow = true; spine.add(torso);
  if (kind !== 'rabbit') { const bl = lumpy(new THREE.SphereGeometry(tw * 0.62, 14, 10, -0.9, 1.8, 0.5, 2.2), 0.015); const b = new THREE.Mesh(bl, belly); b.position.set(0, th * 0.45, tw * 0.22); b.scale.set(1, 1.05, 0.75); spine.add(b); }
  // endo interior (columna + costillas)
  const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, th, 8), M.endo); sp.position.y = th / 2; sp.position.z = -0.04; spine.add(sp);
  for (let i = 0; i < 4; i++) { const rib = new THREE.Mesh(new THREE.TorusGeometry(tw * (0.55 + Math.sin(i / 3 * Math.PI) * 0.15), 0.014, 5, 16), M.endo); rib.rotation.x = Math.PI / 2; rib.position.y = th * (0.3 + i * 0.15); rib.scale.y = 0.75; spine.add(rib); }
  wireBundle(spine, V3(tw * 0.4, th * 0.4, tw * 0.3), 4, 0.35);
  wireBundle(spine, V3(-tw * 0.3, th * 0.2, tw * 0.35), 3, 0.3);
  const chest = (J.chest = new THREE.Group()); chest.position.y = th * 0.92; spine.add(chest);
  // brazos
  for (const sd of [-1, 1]) {
    const Sh = new THREE.Group(); Sh.position.set(sd * S.shoulder, -0.06, 0); chest.add(Sh);
    const shell = !(kind === 'rabbit' && sd === 1);
    Sh.add(limb(S.limbR * 1.0, S.arm, fur, true, true));
    const E = new THREE.Group(); E.position.y = -S.arm; Sh.add(E);
    E.add(limb(S.limbR * 0.9, S.fore, fur, true, shell));
    const H = new THREE.Group(); H.position.y = -S.fore; E.add(H);
    if (kind === 'fox' && sd === -1) {
      const hk = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.014, 8, 18, Math.PI * 1.35), M.chrome); hk.position.set(0, -0.14, 0.04); hk.rotation.set(0, Math.PI / 2, -0.4); H.add(hk);
      const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.1, 10), M.endo); hb.position.y = -0.03; H.add(hb);
    } else H.add(hand(fur, S.limbR * 0.9, !shell));
    if (!shell) wireBundle(E, V3(0, 0, 0), 4, 0.25, 0.04);
    J[sd < 0 ? 'armR' : 'armL'] = Sh; J[sd < 0 ? 'elbowR' : 'elbowL'] = E; J[sd < 0 ? 'handR' : 'handL'] = H;
  }
  // cuello y cabeza
  const neck = (J.neck = new THREE.Group()); neck.position.y = 0.02; chest.add(neck);
  const nk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.2, 8), M.endo); nk.position.y = 0.08; neck.add(nk);
  wireBundle(neck, V3(0, 0.12, 0.03), 3, 0.18, 0.06);
  const head = (J.head = new THREE.Group()); head.position.y = 0.18; neck.add(head);
  const hr = S.headR;
  const eyeM = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: S.eye, emissiveIntensity: 3.5, roughness: 0.2 });
  A.eyeMat = eyeM;
  const eyeball = new THREE.MeshStandardMaterial({ color: 0xbdb7a0, roughness: 0.25 });
  const addEye = (parent, x, y, z, r = 0.055, socket = true) => {
    if (socket) { const so = new THREE.Mesh(new THREE.SphereGeometry(r * 1.25, 10, 8), M.black); so.position.set(x, y, z - r * 0.25); so.scale.z = 0.6; parent.add(so); }
    const eb = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), eyeball); eb.position.set(x, y, z); parent.add(eb);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(r * 0.32, 8, 6), eyeM); pu.position.set(x, y, z + r * 0.82); parent.add(pu);
    const gl = eyeGlow(S.eye, r * 6); gl.position.set(x, y, z + r * 1.1); parent.add(gl);
    A.eyes.push(pu); A.glows.push(gl); return eb;
  };
  const jaw = (J.jaw = new THREE.Group());
  const endoSkull = (front = 0.0) => {
    const g = new THREE.Group();
    const sk = new THREE.Mesh(lumpy(new THREE.BoxGeometry(hr * 1.3, hr * 1.0, hr * 1.2, 3, 3, 3), 0.01), M.endo); sk.position.set(0, hr * 0.15, front); g.add(sk);
    const br = new THREE.Mesh(new THREE.BoxGeometry(hr * 1.4, 0.03, hr * 0.5), M.endo); br.position.set(0, hr * 0.42, front + hr * 0.4); g.add(br);
    return g;
  };
  if (kind === 'bear') {
    const sh = lumpy(new THREE.SphereGeometry(hr, 22, 16, 0.0, Math.PI * 1.62), 0.02, 8, 3);
    const hs = new THREE.Mesh(sh, fur); hs.rotation.y = Math.PI * 0.06; hs.scale.set(1.08, 0.95, 1); head.add(hs);
    head.add(endoSkull(0.02));
    const muz = new THREE.Mesh(lumpy(new THREE.SphereGeometry(hr * 0.55, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), 0.01), belly); muz.position.set(0.02, -hr * 0.15, hr * 0.68); muz.rotation.x = 0.9; head.add(muz);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.13, 10, 8), M.black); nose.position.set(0.02, -hr * 0.02, hr * 1.02); nose.scale.set(1.3, 0.8, 1); head.add(nose);
    addEye(head, -hr * 0.36, hr * 0.22, hr * 0.78, 0.06);
    addEye(head, hr * 0.33, hr * 0.2, hr * 0.62, 0.05, false);
    const ear = new THREE.Mesh(lumpy(new THREE.SphereGeometry(hr * 0.32, 12, 10), 0.01), fur); ear.scale.z = 0.45; ear.position.set(-hr * 0.72, hr * 0.78, 0); head.add(ear);
    const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.12, 6), M.endo); stub.position.set(hr * 0.68, hr * 0.85, 0); stub.rotation.z = -0.5; head.add(stub);
    wireBundle(head, V3(hr * 0.72, hr * 0.92, 0), 3, 0.12, 0.05);
    const hat = new THREE.Group(); hat.position.set(-0.04, hr * 0.92, -0.02); hat.rotation.set(-0.15, 0, 0.32); head.add(hat);
    const hm = new THREE.MeshStandardMaterial({ color: 0x0b0a09, roughness: 0.7 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(hr * 0.5, hr * 0.5, 0.015, 18, 1, false, 0, Math.PI * 1.7), hm); hat.add(brim);
    const top = new THREE.Mesh(lumpy(new THREE.CylinderGeometry(hr * 0.3, hr * 0.32, hr * 0.62, 14, 3, true, 0, Math.PI * 1.75), 0.02), hm); top.position.y = hr * 0.31; top.material = hm.clone(); top.material.side = THREE.DoubleSide; hat.add(top);
    // pajarita
    const bt = new THREE.MeshStandardMaterial({ color: 0x1a0b0b, roughness: 0.6 });
    for (const sd of [-1, 1]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 8), bt); c.rotation.z = sd * Math.PI / 2; c.position.set(sd * 0.06, 0.04, 0.24); chest.add(c); }
    jaw.position.set(0.02, -hr * 0.28, hr * 0.15); head.add(jaw);
    const lj = new THREE.Mesh(lumpy(new THREE.SphereGeometry(hr * 0.55, 14, 10, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), 0.015), belly); lj.scale.set(1, 0.6, 1.1); lj.position.set(0, 0, hr * 0.48); jaw.add(lj);
    const jm = new THREE.Mesh(new THREE.BoxGeometry(hr * 0.9, 0.03, hr * 0.8), M.endo); jm.position.set(0, -0.01, hr * 0.42); jaw.add(jm);
    teethRow(head, 9, hr * 0.42, hr * 0.12, 0.034, -hr * 0.25, hr * 0.92, true);
    teethRow(jaw, 9, hr * 0.4, hr * 0.12, 0.032, 0.0, hr * 0.78, false);
  } else if (kind === 'rabbit') {
    const sh = lumpy(new THREE.SphereGeometry(hr, 20, 16, Math.PI * 0.85, Math.PI * 1.3), 0.02, 8, 7);
    const hs = new THREE.Mesh(sh, fur); hs.scale.set(1, 1.15, 1.1); head.add(hs);
    const sk = endoSkull(0.06); head.add(sk);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(hr * 1.1, hr * 0.5, 0.02), M.endo); plate.position.set(0, -hr * 0.05, hr * 0.72); head.add(plate);
    addEye(head, -hr * 0.3, hr * 0.25, hr * 0.68, 0.05, true);
    addEye(head, hr * 0.3, hr * 0.25, hr * 0.68, 0.05, true);
    for (const sd of [-1, 1]) {
      const eg = new THREE.Group(); eg.position.set(sd * hr * 0.45, hr * 0.9, -0.03); eg.rotation.z = -sd * 0.15; head.add(eg);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.1, 6), M.endo); base.position.y = 0.05; eg.add(base);
      if (sd < 0) {
        const e1 = new THREE.Mesh(lumpy(new THREE.CapsuleGeometry(0.07, 0.36, 4, 10), 0.01), fur); e1.scale.z = 0.35; e1.position.y = 0.28; eg.add(e1);
        const e2g = new THREE.Group(); e2g.position.y = 0.48; e2g.rotation.z = 0.9; eg.add(e2g);
        const e2 = new THREE.Mesh(lumpy(new THREE.CapsuleGeometry(0.065, 0.28, 4, 10), 0.01), fur); e2.scale.z = 0.35; e2.position.y = 0.17; e2g.add(e2);
        J.ear = eg;
      } else { wireBundle(eg, V3(0, 0.1, 0), 5, 0.22, 0.05); const torn = new THREE.Mesh(lumpy(new THREE.CapsuleGeometry(0.065, 0.08, 4, 10), 0.015), fur); torn.scale.z = 0.35; torn.position.y = 0.16; eg.add(torn); }
    }
    jaw.position.set(0, -hr * 0.3, hr * 0.15); head.add(jaw);
    const lj = new THREE.Mesh(new THREE.BoxGeometry(hr * 1.0, 0.04, hr * 0.75), M.endo); lj.position.set(0, -0.02, hr * 0.32); jaw.add(lj);
    teethRow(head, 10, hr * 0.42, hr * 0.1, 0.03, -hr * 0.22, hr * 0.72, true, false, M.chrome);
    teethRow(jaw, 10, hr * 0.4, hr * 0.1, 0.03, 0.0, hr * 0.6, false, false, M.chrome);
    const bt = new THREE.MeshStandardMaterial({ color: 0x5a0a0a, roughness: 0.6 });
    for (const sd of [-1, 1]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 8), bt); c.rotation.z = sd * Math.PI / 2; c.position.set(sd * 0.05, 0.03, 0.19); chest.add(c); }
  } else if (kind === 'fox') {
    const sh = lumpy(new THREE.SphereGeometry(hr, 20, 16), 0.025, 9, 11);
    const hs = new THREE.Mesh(sh, fur); hs.scale.set(1, 0.95, 1.05); head.add(hs);
    head.add(endoSkull(0.05));
    const snout = new THREE.Mesh(lumpy(new THREE.CylinderGeometry(hr * 0.28, hr * 0.5, hr * 1.2, 12, 3, false), 0.015), fur); snout.rotation.x = Math.PI / 2; snout.position.set(0, -hr * 0.05, hr * 0.95); head.add(snout);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.14, 10, 8), M.black); nose.position.set(0, 0.0, hr * 1.55); head.add(nose);
    addEye(head, -hr * 0.38, hr * 0.28, hr * 0.72, 0.055);
    addEye(head, hr * 0.38, hr * 0.28, hr * 0.72, 0.055);
    const patch = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.02), M.black); patch.position.set(hr * 0.38, hr * 0.5, hr * 0.84); patch.rotation.set(-0.5, 0, 0.6); head.add(patch);
    for (const sd of [-1, 1]) { const ear = new THREE.Mesh(lumpy(new THREE.ConeGeometry(hr * 0.32, hr * (sd < 0 ? 0.95 : 0.5), 4), 0.01), fur); ear.scale.z = 0.45; ear.position.set(sd * hr * 0.5, hr * (sd < 0 ? 1.15 : 0.95), -0.02); ear.rotation.z = -sd * 0.25; head.add(ear); }
    wireBundle(head, V3(hr * 0.5, hr * 1.15, 0), 3, 0.12, 0.04);
    jaw.position.set(0, -hr * 0.3, hr * 0.3); head.add(jaw);
    const lj = new THREE.Mesh(lumpy(new THREE.BoxGeometry(hr * 0.75, 0.06, hr * 1.35), 0.01), fur); lj.position.set(0, -0.02, hr * 0.62); jaw.add(lj);
    const lje = new THREE.Mesh(new THREE.BoxGeometry(hr * 0.5, 0.03, hr * 1.3), M.endo); lje.position.set(0, 0.02, hr * 0.6); jaw.add(lje);
    for (let i = 0; i < 7; i++) for (const sd of [-1, 1]) { const tt = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.065, 5), M.ceramic); tt.position.set(sd * hr * 0.24, 0.05, hr * (0.2 + i * 0.17)); jaw.add(tt); const tu = tt.clone(); tu.rotation.x = Math.PI; tu.position.set(sd * hr * 0.22, -hr * 0.3, hr * (0.55 + i * 0.13)); head.add(tu); }
    // cola
    const tail = new THREE.Group(); tail.position.set(0, 0.0, -0.22); hips.add(tail); J.tail = tail;
    let prev = tail; for (let i = 0; i < 4; i++) { const seg = new THREE.Group(); seg.position.y = i ? -0.14 : 0; seg.rotation.x = i ? 0.25 : -2.2; prev.add(seg); const sm = new THREE.Mesh(i % 2 ? new THREE.CylinderGeometry(0.015, 0.015, 0.14, 5) : lumpy(new THREE.CapsuleGeometry(0.05 - i * 0.008, 0.08, 3, 8), 0.01), i % 2 ? M.endo : fur); sm.position.y = -0.07; seg.add(sm); prev = seg; }
  } else if (kind === 'chick') {
    const sh = lumpy(new THREE.SphereGeometry(hr, 22, 16), 0.02, 7, 13);
    const hs = new THREE.Mesh(sh, fur); hs.scale.set(1.05, 1.0, 0.95); head.add(hs);
    addEye(head, -hr * 0.42, hr * 0.2, hr * 0.68, 0.085);
    addEye(head, hr * 0.42, hr * 0.2, hr * 0.68, 0.085);
    const bm = new THREE.MeshStandardMaterial({ color: 0xb8620e, roughness: 0.55 }); bm.map = TEX.rust.map;
    const beakU = new THREE.Mesh(lumpy(new THREE.ConeGeometry(hr * 0.42, hr * 0.85, 12, 1, true, 0, Math.PI), 0.01), bm); beakU.material.side = THREE.DoubleSide; beakU.rotation.set(Math.PI / 2, 0, Math.PI); beakU.position.set(0, -hr * 0.12, hr * 1.1); beakU.scale.set(1.25, 1, 0.55); head.add(beakU);
    for (let k = 0; k < 3; k++) teethRow(head, 11, hr * (0.36 - k * 0.07), hr * 0.15, 0.03, -hr * 0.18, hr * (1.05 - k * 0.1), true, true, M.ceramic);
    for (let i = 0; i < 3; i++) { const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.2, 5), fur); tuft.position.set((i - 1) * 0.05, hr * 1.02, 0.02); tuft.rotation.z = (i - 1) * 0.5; head.add(tuft); }
    jaw.position.set(0, -hr * 0.24, hr * 0.6); head.add(jaw);
    const beakL = new THREE.Mesh(lumpy(new THREE.ConeGeometry(hr * 0.38, hr * 0.75, 12, 1, true, 0, Math.PI), 0.01), bm); beakL.rotation.set(Math.PI / 2, 0, 0); beakL.position.set(0, -0.02, hr * 0.45); beakL.scale.set(1.2, 1, 0.45); jaw.add(beakL);
    for (let k = 0; k < 2; k++) teethRow(jaw, 10, hr * (0.32 - k * 0.07), hr * 0.14, 0.028, 0.0, hr * (0.42 - k * 0.1), false, true, M.ceramic);
    // babero
    const bib = new THREE.Mesh(new THREE.CylinderGeometry(tw * 0.88, tw * 0.95, 0.3, 20, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: textTex(['¡A COMER!'], { w: 512, h: 128, bg: '#cfc7b4', fg: '#7b1c14', font: '58px "Special Elite"' }), roughness: 0.9, side: THREE.DoubleSide, alphaMap: TEX.furBelly.alphaMap, alphaTest: 0.5 }));
    bib.position.set(0, -0.12, 0.0); bib.scale.z = 0.85; chest.add(bib);
    // cupcake
    const cup = new THREE.Group(); cup.position.set(0.0, -0.22, 0.1); J.handL.add(cup);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.02, 16), M.ceramic); cup.add(plate);
    const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.07, 12), new THREE.MeshStandardMaterial({ color: 0x6a1a40, roughness: 0.6 })); cb.position.y = 0.045; cup.add(cb);
    const ct = new THREE.Mesh(lumpy(new THREE.SphereGeometry(0.065, 12, 8), 0.01), new THREE.MeshStandardMaterial({ color: 0xb06a8a, roughness: 0.5 })); ct.position.y = 0.1; ct.scale.y = 0.8; cup.add(ct);
    for (const sd of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), eyeM); e.position.set(sd * 0.025, 0.11, 0.055); cup.add(e); }
    const cdl = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.06, 5), M.ceramic); cdl.position.y = 0.17; cup.add(cdl);
  }
  head.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  A.setEyes = (color, intensity = 3.5, glow = 0.9) => { if (color !== null) { eyeM.emissive.setHex(color); A.glows.forEach((g) => g.material.color.setHex(color)); } eyeM.emissiveIntensity = intensity; A.glows.forEach((g) => (g.material.opacity = glow)); };
  A.headWorld = (v = V3()) => J.head.getWorldPosition(v);
  return A;
}
/* animación procedural */
function animateModel(A, dt, st = {}) {
  const J = A.j, S = A.spec; A.t += dt;
  const sp = st.speed || 0, pose = st.pose || (sp > 0.05 ? 'walk' : 'idle');
  if (pose !== 'freeze') A.phase += dt * (sp > 0.05 ? 2.4 + sp * 1.5 : 0);
  const amp = clamp(sp / 3.2, 0, 1.15), ph = A.phase;
  const tw = A.twitch; tw.t -= dt;
  if (tw.t <= 0) { const big = Math.random() < 0.35; tw.rx = rand(-0.3, 0.3) * (big ? 1.6 : 0.6); tw.ry = rand(-0.4, 0.4) * (big ? 1.4 : 0.5); tw.rz = rand(-0.5, 0.5) * (big ? 1.5 : 0.5); tw.t = big ? rand(0.15, 0.5) : rand(0.6, 2.5); tw.hold = rand(0.08, 0.3); if (big && st.servo) st.servo(); }
  const tk = pose === 'freeze' ? 25 : 14;
  tw.cur.x = lerp(tw.cur.x, tw.rx, Math.min(1, dt * tk)); tw.cur.y = lerp(tw.cur.y, tw.ry, Math.min(1, dt * tk)); tw.cur.z = lerp(tw.cur.z, tw.rz, Math.min(1, dt * tk));
  const k = Math.min(1, dt * 10);
  const idle = Math.sin(A.t * 1.3) * 0.03;
  if (pose === 'walk' || pose === 'run' || pose === 'idle' || pose === 'freeze') {
    if (pose !== 'freeze') {
      const run = pose === 'run' ? 1.3 : 1;
      J.legL.rotation.x = lerp(J.legL.rotation.x, -Math.sin(ph) * 0.55 * amp * run, k); J.legR.rotation.x = lerp(J.legR.rotation.x, Math.sin(ph) * 0.55 * amp * run, k);
      J.kneeL.rotation.x = lerp(J.kneeL.rotation.x, (0.08 + Math.max(0, Math.cos(ph)) * 0.9 * amp * run), k); J.kneeR.rotation.x = lerp(J.kneeR.rotation.x, (0.08 + Math.max(0, -Math.cos(ph)) * 0.9 * amp * run), k);
      J.armL.rotation.x = lerp(J.armL.rotation.x, Math.sin(ph) * 0.45 * amp + idle + (pose === 'run' ? -0.4 : 0), k); J.armR.rotation.x = lerp(J.armR.rotation.x, -Math.sin(ph) * 0.45 * amp - idle + (pose === 'run' ? -0.4 : 0), k);
      J.armL.rotation.z = lerp(J.armL.rotation.z, 0.12, k); J.armR.rotation.z = lerp(J.armR.rotation.z, -0.12, k);
      J.elbowL.rotation.x = lerp(J.elbowL.rotation.x, -0.25 - amp * 0.3, k); J.elbowR.rotation.x = lerp(J.elbowR.rotation.x, -0.25 - amp * 0.3, k);
      J.hips.position.y = lerp(J.hips.position.y, S.hip - 0.03 * amp + Math.abs(Math.sin(ph)) * 0.06 * amp, k);
      J.spine.rotation.x = lerp(J.spine.rotation.x, S.hunch + amp * 0.12 + idle * 0.5, k); J.spine.rotation.z = lerp(J.spine.rotation.z, Math.sin(ph) * 0.07 * amp, k);
      J.hips.rotation.y = Math.sin(ph) * 0.08 * amp;
    }
    // mirada
    let yaw = 0, pitch = 0;
    if (st.look) { _v1.copy(st.look); A.root.worldToLocal(_v1); yaw = clamp(Math.atan2(_v1.x, _v1.z), -1.1, 1.1); const hy = J.hips.position.y + S.torsoH; pitch = clamp(-Math.atan2(_v1.y - hy, Math.hypot(_v1.x, _v1.z)), -0.6, 0.6); }
    A.look = lerp(A.look, yaw, Math.min(1, dt * 5)); A.lookP = lerp(A.lookP, pitch, Math.min(1, dt * 5));
    J.neck.rotation.y = A.look + tw.cur.y * 0.4; J.head.rotation.x = A.lookP - S.hunch * 0.8 + tw.cur.x * 0.5; J.head.rotation.z = tw.cur.z * 0.5 + (st.tilt || 0);
  } else if (pose === 'stun') {
    const sh = Math.sin(A.t * 40) * 0.08;
    J.armL.rotation.x = lerp(J.armL.rotation.x, -2.3 + sh, k); J.armR.rotation.x = lerp(J.armR.rotation.x, -2.1 - sh, k);
    J.armL.rotation.z = lerp(J.armL.rotation.z, -0.5, k); J.armR.rotation.z = lerp(J.armR.rotation.z, 0.5, k);
    J.elbowL.rotation.x = lerp(J.elbowL.rotation.x, -1.6, k); J.elbowR.rotation.x = lerp(J.elbowR.rotation.x, -1.7, k);
    J.head.rotation.x = lerp(J.head.rotation.x, 0.5 + sh, k); J.head.rotation.z = Math.sin(A.t * 23) * 0.2; J.neck.rotation.y = Math.sin(A.t * 17) * 0.3;
    J.spine.rotation.x = lerp(J.spine.rotation.x, S.hunch + 0.3, k);
    J.legL.rotation.x = lerp(J.legL.rotation.x, -0.2, k); J.legR.rotation.x = lerp(J.legR.rotation.x, 0.3, k);
  } else if (pose === 'scare') {
    const s = st.shake || 1, n = (f) => Math.sin(A.t * f) * Math.sin(A.t * f * 0.37);
    J.armL.rotation.x = lerp(J.armL.rotation.x, -1.55 + n(31) * 0.2 * s, k * 2); J.armR.rotation.x = lerp(J.armR.rotation.x, -1.45 + n(27) * 0.2 * s, k * 2);
    J.armL.rotation.z = lerp(J.armL.rotation.z, 0.35, k); J.armR.rotation.z = lerp(J.armR.rotation.z, -0.35, k);
    J.elbowL.rotation.x = lerp(J.elbowL.rotation.x, -0.5, k); J.elbowR.rotation.x = lerp(J.elbowR.rotation.x, -0.6, k);
    J.head.rotation.x = -0.15 + n(43) * 0.12 * s; J.head.rotation.z = (st.tilt || 0) + n(37) * 0.18 * s; J.neck.rotation.y = n(29) * 0.15 * s;
    J.spine.rotation.x = lerp(J.spine.rotation.x, 0.3, k);
  }
  // mandíbula
  const jt = st.jaw !== undefined ? st.jaw : S.jawRest + (Math.random() < 0.02 ? 0.25 : 0) + Math.max(0, Math.sin(A.t * 0.7)) * 0.08;
  A.jaw = lerp(A.jaw, jt, Math.min(1, dt * (st.jaw !== undefined ? 30 : 8)));
  J.jaw.rotation.x = A.jaw;
  if (J.tail) { J.tail.rotation.z = Math.sin(A.t * 3) * 0.3; }
  if (J.ear) { J.ear.rotation.x = Math.sin(A.t * 1.7) * 0.1; }
  // parpadeo/flicker de ojos
  if (st.eyesOff) { A.eyeMat.emissiveIntensity = 0; A.glows.forEach((g) => (g.material.opacity = 0)); }
  else { const fl = Math.random() < 0.03 ? 0.15 : 1; A.eyeMat.emissiveIntensity = (st.eyeI || 3.5) * fl; A.glows.forEach((g) => (g.material.opacity = (st.glow !== undefined ? st.glow : 0.8) * fl)); }
}
