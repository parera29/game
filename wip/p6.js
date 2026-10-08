
/* =====================================================================
   NIVEL 1 · PRIMER PISO (Teddy)
   ===================================================================== */
function buildHouse() {
  const H = 2.7, sc = W.scene;
  W.bounds = { minX: 0, maxX: 16, minZ: 0, maxZ: 12 }; W.surface = 'wood'; W.rainExclude = [-0.1, -0.1, 16.1, 12.1]; W.boltSpot = V3(8, 0, 6);
  sc.background = new THREE.Color(0x000000);
  makeSky(sc);
  levelLights({ hemi: 0.05, moon: 0.08, moonDir: [-0.9, 0.55, -0.75], center: [8, 0, 6], extent: 16 });
  const lp = M.wallpaper, lp2 = M.wallpaper2, lp3 = M.wallpaper3, pl = M.plaster, sd = M.siding, tl = M.tiles;
  const door = (c, w = 0.95) => ({ c, w, y0: 0, y1: 2.15 }), win = (c, w = 1.3, y0 = 0.9, y1 = 2.15) => ({ c, w, y0, y1 });
  // muros exteriores
  wall('x', 0, 0, 7, H, sd, lp, [win(2.0)]); wall('x', 0, 7, 9, H, sd, lp2, [door(8, 1.0)]); wall('x', 0, 9, 16, H, sd, pl, [win(12.5)]);
  wall('x', 12, 0, 4, H, tl, sd, [win(2.0, 0.7, 1.4, 2.1)]); wall('x', 12, 4, 7, H, lp3, sd); wall('x', 12, 7, 9, H, lp2, sd); wall('x', 12, 9, 16, H, lp3, sd, [win(12.5)]);
  wall('z', 0, 0, 7, H, sd, lp, [win(5.2)]); wall('z', 0, 7, 12, H, sd, tl);
  wall('z', 16, 0, 6, H, pl, sd, [win(4.2)]); wall('z', 16, 6, 12, H, lp3, sd, [win(9.4)]);
  // muros interiores
  wall('z', 7, 0, 7, H, lp, lp2, [door(3.5)]); wall('z', 7, 7, 12, H, lp3, lp2);
  wall('z', 9, 0, 6, H, lp2, pl, [door(3.0)]); wall('z', 9, 6, 12, H, lp2, lp3, [door(9.0)]);
  wall('x', 6, 9, 16, H, pl, lp3);
  wall('x', 7, 0, 4, H, lp, tl, [door(2.0, 0.9)]);
  const secretWall = wall('x', 7, 4, 7, H, lp, lp3, [door(5.5, 1.0)]);
  wall('z', 4, 7, 12, H, tl, lp3);
  // suelos y techo
  floorPlane(0, 0, 7, 7, M.wood, 0, 2.2); floorPlane(7, 0, 9, 12, M.wood, 0, 2.2); floorPlane(9, 0, 16, 6, M.tiles, 0, 2.4); floorPlane(9, 6, 16, 12, M.wood, 0, 2.2);
  floorPlane(0, 7, 4, 12, M.tiles, 0, 2.4); floorPlane(4, 7, 7, 12, M.rug, 0.001, 3);
  floorPlane(-0.2, -0.2, 16.2, 12.2, M.plaster, H, 3, true);
  for (const [x0, z0, x1, z1] of [[0, 0, 7, 7], [9, 0, 16, 6], [9, 6, 16, 12]]) { box(x1 - x0, 0.1, 0.03, M.darkWood, (x0 + x1) / 2, 0, z0 + 0.1, { col: false, cast: false }); box(x1 - x0, 0.1, 0.03, M.darkWood, (x0 + x1) / 2, 0, z1 - 0.1, { col: false, cast: false }); }
  // exterior: césped, árboles, valla, farola, casas lejanas
  const gr = floorPlane(-60, -60, 76, 72, M.grass, -0.02, 4);
  const trees = []; for (let i = 0; i < 46; i++) { let x, z; do { x = rand(-40, 56); z = rand(-40, 52); } while (x > -4 && x < 20 && z > -4 && z < 16); trees.push({ x, z, h: rand(7, 13), r: rand(0.18, 0.32), type: Math.random() < 0.25 ? 'dead' : Math.random() < 0.4 ? 'pine' : 'leaf' }); }
  trees.push({ x: -5, z: 3, h: 9, r: 0.3, type: 'leaf' }, { x: 21, z: 8, h: 11, r: 0.3, type: 'dead' }, { x: 6, z: -7, h: 10, r: 0.28, type: 'leaf' });
  buildForest(trees, { leafCards: 140, pineCards: 60 });
  buildGrass(8, 6, 50, SETTINGS.quality >= 2 ? 26000 : 12000, (x, z) => x > -0.5 && x < 16.5 && z > -0.5 && z < 12.5);
  for (let x = -14; x <= 30; x += 2.2) { box(0.08, 1.1, 0.08, M.lightWood, x, 0, -14, { col: false }); box(0.1, 1.2, 0.08, M.lightWood, x, 0, 26, { col: false }); }
  box(44, 0.08, 0.04, M.lightWood, 8, 0.8, -14, { col: false }); box(44, 0.08, 0.04, M.lightWood, 8, 0.8, 26, { col: false });
  const pole = box(0.14, 6, 0.14, M.metalDark, 3, 0, -22, { col: false }); box(1.4, 0.08, 0.1, M.metalDark, 3.6, 5.9, -22, { col: false });
  const streetL = new THREE.PointLight(0xff9a40, 18, 26, 1.8); streetL.position.set(4.2, 5.7, -22); sc.add(streetL);
  const lampHead = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffb060 })); lampHead.position.copy(streetL.position); sc.add(lampHead); lampHead.userData.dynamic = true;
  W.updaters.push((dt, t) => { const f = Math.random() < 0.03 ? 0.1 : 1; streetL.intensity = 18 * f; lampHead.material.color.setScalar(f).multiply(new THREE.Color(0xffb060)); });
  for (const [x, z, w, h] of [[-26, -34, 9, 6], [28, -36, 10, 7], [40, 14, 8, 6]]) { box(w, h, 7, M.siding, x, 0, z, { col: false }); const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.75, 3, 4), M.darkWood); roof.position.set(x, h + 1.5, z); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.7; sc.add(roof); }
  const litWin = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), new THREE.MeshBasicMaterial({ color: 0x5a3a14 })); litWin.position.set(28, 4, -32.45); sc.add(litWin); litWin.userData.dynamic = true;
  // ventanas
  addWindow('x', 0, 2.0, 1.3, 0.9, 2.15, { outsideSign: -1 }); addWindow('x', 0, 12.5, 1.3, 0.9, 2.15, { outsideSign: -1, curtains: null });
  addWindow('x', 12, 2.0, 0.7, 1.4, 2.1, { outsideSign: 1, curtains: null }); addWindow('x', 12, 12.5, 1.3, 0.9, 2.15, { outsideSign: 1, curtains: 'velvetGreen' });
  addWindow('z', 0, 5.2, 1.3, 0.9, 2.15, { outsideSign: -1 }); addWindow('z', 16, 4.2, 1.3, 0.9, 2.15, { outsideSign: 1, curtains: null }); addWindow('z', 16, 9.4, 1.3, 0.9, 2.15, { outsideSign: 1, curtains: 'velvetGreen' });
  // puerta principal
  const fdoor = box(1.0, 2.15, 0.06, M.door, 8, 0, 0.0, { col: true, uvs: 0 }); fdoor.geometry.attributes.uv.needsUpdate = true; fdoor.userData.dynamic = true;
  addInteract(fdoor, 'Abrir puerta principal', () => { AUD.burst({ type: 'brown', f: 300, dur: 0.2, vol: 0.6 }); subtitle('Está cerrada con llave. No puedo irme sin sus recuerdos.'); });
  // --- SALÓN ---
  F.rug && 0;
  const rug = floorPlane(2.6, 1.6, 5.6, 4.0, M.rug, 0.006, 3); rug.receiveShadow = true;
  F.tv(4.6, 0.45, 0); W.tv = W.scene.children[W.scene.children.length - 1];
  W.tvObj = F_last_tv;
  F.sofa(4.0, 4.3, Math.PI); F.table(4.0, 2.75, 0, 1.1, 0.6, 0.42);
  const fp = F.fireplace(0.32, 2.4, Math.PI / 2); W.fireEm = fp.em;
  const fireL = new THREE.PointLight(0xff5a18, 1.2, 4, 2); fireL.position.set(0.8, 0.4, 2.4); sc.add(fireL);
  W.updaters.push((dt, t) => { const f = 0.75 + Math.sin(t * 7) * 0.12 + Math.sin(t * 13.3) * 0.08 + Math.random() * 0.08; fireL.intensity = 1.2 * f; fp.em.emissiveIntensity = 0.5 * f; });
  F.armchair(1.5, 4.0, Math.PI * 0.75);
  const shelf = F.bookshelf(5.5, 6.75, Math.PI, 1.2, 2.1); shelf.userData.dynamic = true;
  F.bookshelf(1.0, 6.75, Math.PI, 1.0, 2.0);
  const lamp = F.lamp(6.5, 6.4, 1.55, true); W.livingLamp = lamp;
  W.updaters.push((dt, t) => { if (!lamp.light) return; let f = 1; if (Math.random() < 0.02) f = rand(0, 0.4); if (W.flickerT > 0) f = Math.random() < 0.5 ? 0 : 0.6; lamp.light.intensity = 1.6 * f; lamp.shadeM.emissiveIntensity = 0.35 * f; });
  const rock = F.rockingChair(6.2, 1.2, -Math.PI * 0.8); W.rocker = rock;
  const clock = F.clock(6.9, 1.35, 1.0, -Math.PI / 2); W.updaters.push((dt, t) => { clock.pend.rotation.z = Math.sin(t * 2.6) * 0.25; });
  F.frame(0.1, 2.0, 0.9, Math.PI / 2, portrait(0)); F.frame(6.92, 2.1, 5.4, -Math.PI / 2, portrait(2), 0.42, 0.52, 0.06); F.frame(3.2, 2.05, 6.92, Math.PI, portrait(1), 0.7, 0.5);
  F.table(6.4, 3.0, 0, 0.45, 0.45, 0.62); const phone = new THREE.Group(); pbox(phone, 0.2, 0.06, 0.16, M.black, 0, 0, 0, 0); pbox(phone, 0.22, 0.04, 0.05, M.black, 0, 0.07, 0, 0); phone.position.set(6.4, 0.62, 3.0); sc.add(phone);
  const plant = new THREE.Group(); part(plant, new THREE.CylinderGeometry(0.18, 0.13, 0.35, 12), M.brick, 0, 0.175, 0); for (let i = 0; i < 6; i++) part(plant, new THREE.CylinderGeometry(0.006, 0.01, 0.7, 4), M.darkWood, rand(-0.08, 0.08), 0.6, rand(-0.08, 0.08), rand(-0.5, 0.5), 0, rand(-0.5, 0.5)); place(plant, 0.4, 0.4, 0, 0.36, 0.36, 0.5);
  F.cobweb(0.12, 2.5, 0.12, Math.PI / 4, 0.9); F.cobweb(6.85, 2.5, 6.85, -Math.PI * 0.75, 0.7);
  // --- PASILLO ---
  floorPlane(7.4, 0.4, 8.6, 11.0, M.rug, 0.006, 2);
  F.table(7.3, 5.5, Math.PI / 2, 1.0, 0.4, 0.85);
  const rack = new THREE.Group(); part(rack, new THREE.CylinderGeometry(0.02, 0.02, 1.8, 6), M.darkWood, 0, 0.9, 0); for (let i = 0; i < 4; i++) part(rack, new THREE.CylinderGeometry(0.01, 0.01, 0.25, 4), M.darkWood, Math.cos(i * 1.57) * 0.1, 1.7, Math.sin(i * 1.57) * 0.1, Math.sin(i * 1.57) * 0.8, 0, -Math.cos(i * 1.57) * 0.8); const coat = part(rack, lumpy(new THREE.CylinderGeometry(0.12, 0.25, 1.0, 10), 0.03), M.fabricBlue, 0.05, 1.15, 0); place(rack, 8.65, 0.5, 0, 0.4, 0.4, 1.8);
  for (let i = 0; i < 12; i++) { const z = 8.2 + i * 0.32, y = i * 0.22; box(1.0, 0.22, 0.32, M.wood, 8.4, y, z, { col: false }); }
  addCollider(7.9, 8.9, 8.0, 12, 0, 2.7, true);
  box(1.0, 2.7, 3.9, M.lightWood, 8.4, 0, 10.05, { col: false, uvs: 0.8 }).visible = false;
  F.boxes(8.4, 11.3, 3, 0.6); F.crate(8.2, 10.6, 0.6);
  for (const [a, b] of [[0.9, 0.3], [1.4, -0.35]]) { const plank = box(1.2, 0.12, 0.03, M.lightWood, 8.4, 2.2 + a * 0.1, 11.9, { col: false }); plank.rotation.z = b; }
  F.frame(7.08, 1.9, 2.1, Math.PI / 2, portrait(0), 0.36, 0.46, -0.08); F.frame(8.92, 1.85, 7.5, -Math.PI / 2, portrait(1), 0.4, 0.3);
  F.bulb(8.0, 2.7, 3.5); F.bulb(8.0, 2.7, 7.0);
  // cuadro eléctrico (puzle)
  const fuse = new THREE.Group(); pbox(fuse, 0.4, 0.55, 0.1, M.metalDark, 0, 0, 0, 0); pbox(fuse, 0.36, 0.5, 0.01, new THREE.MeshStandardMaterial({ color: 0x556055, roughness: 0.5, metalness: 0.5 }), 0, 0.025, 0.055, 0);
  const warn = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.1), new THREE.MeshBasicMaterial({ map: textTex(['⚡'], { w: 64, h: 64, bg: '#d8b020', fg: '#000', font: '48px sans-serif' }) })); warn.position.set(0, 0.42, 0.062); fuse.add(warn);
  fuse.position.set(8.92, 1.2, 5.0); fuse.rotation.y = -Math.PI / 2; sc.add(fuse); addInteract(fuse, 'Abrir cuadro eléctrico', () => openFuse());
  // --- COCINA ---
  F.counter(12.0, 0.31, 0, 3.0); F.sink(12.5, 0.32, 0); F.stove(14.0, 0.33, 0); F.counter(15.1, 0.31, 0, 1.4);
  F.upperCab(10.8, 1.55, 0.18, 0, 1.4); F.upperCab(14.8, 1.55, 0.18, 0, 2.0);
  F.fridge(15.55, 1.4, -Math.PI / 2);
  F.table(12.3, 3.6, 0, 1.4, 0.85, 0.78); F.chair(11.5, 3.6, Math.PI / 2); F.chair(13.1, 3.6, -Math.PI / 2); F.chair(12.3, 4.4, Math.PI); F.chair(12.0, 2.5, 0.4, true);
  F.frame(9.1, 1.8, 1.3, Math.PI / 2, paperDrawing(1), 0.3, 0.4, 0.05);
  const kLight = new THREE.PointLight(0x9ab0ff, 0.0, 3.5, 2); kLight.position.set(15.0, 1.0, 1.4); sc.add(kLight); W.fridgeLight = kLight;
  // --- DORMITORIO ---
  F.bed(14.6, 10.9, Math.PI); F.nightstand(13.5, 11.7, Math.PI); F.nightstand(15.65, 11.7, Math.PI);
  F.wardrobe(10.0, 6.45, 0); F.table(15.6, 7.6, Math.PI / 2, 1.1, 0.55, 0.76); F.chair(15.0, 7.6, -Math.PI / 2);
  floorPlane(11.0, 8.2, 13.6, 11.2, M.rug, 0.006, 3);
  const nl = F.candle(13.5, 0.6, 11.7, true, true);
  F.frame(10.5, 2.0, 11.9, Math.PI, portrait(2), 0.45, 0.6, 0.12);
  const horse = new THREE.Group(); pbox(horse, 0.6, 0.2, 0.15, M.lightWood, 0, 0.35, 0, 0); pbox(horse, 0.15, 0.3, 0.12, M.lightWood, 0.3, 0.5, 0, 0); pbox(horse, 0.04, 0.35, 0.04, M.lightWood, -0.2, 0.05, 0, 0); pbox(horse, 0.04, 0.35, 0.04, M.lightWood, 0.2, 0.05, 0, 0); pbox(horse, 0.7, 0.04, 0.12, M.darkWood, 0, 0.0, 0, 0); place(horse, 10.6, 10.5, 0.7, 0.7, 0.3, 0.7);
  // --- BAÑO ---
  F.tub(1.0, 11.5, 0); F.toilet(3.5, 11.6, Math.PI); F.counter(3.65, 8.0, -Math.PI / 2, 0.8, M.ceramic); F.mirror(3.9, 1.3, 8.0, -Math.PI / 2);
  const showerC = makeCurtain(1.6, 1.9, M.sheet); showerC.position.set(1.0, 0.25, 11.05); sc.add(showerC);
  F.cobweb(0.1, 2.5, 7.2, Math.PI / 4, 0.6);
  // --- ESTUDIO SECRETO ---
  F.table(5.5, 11.5, Math.PI, 1.6, 0.8, 0.78); F.chair(5.5, 10.8, Math.PI);
  const bench = F.table(4.5, 9.0, Math.PI / 2, 1.4, 0.7, 0.9, M.lightWood); F.headPile(6.4, 9.0, 2);
  const studyLamp = new THREE.PointLight(0x9dffb0, 0, 4, 2); studyLamp.position.set(5.0, 1.2, 11.4); sc.add(studyLamp); W.studyLamp = studyLamp;
  const bl = new THREE.Group(); part(bl, new THREE.CylinderGeometry(0.05, 0.08, 0.02, 10), M.chrome, 0, 0.01, 0); part(bl, new THREE.CylinderGeometry(0.01, 0.01, 0.3, 6), M.chrome, 0, 0.15, 0); const blShade = part(bl, new THREE.CylinderGeometry(0.06, 0.12, 0.1, 12, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x1a4a2a, emissive: 0x3aff6a, emissiveIntensity: 0, side: THREE.DoubleSide }), 0, 0.32, 0, Math.PI / 2, 0, 0); bl.position.set(5.0, 0.78, 11.6); sc.add(bl); W.studyShade = blShade;
  const blue = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshStandardMaterial({ map: textTex(['UNIDAD T-1', '— caja de música —', 'NO APAGAR'], { w: 256, h: 170, bg: '#1d3a6a', fg: '#cfe0ff', font: '20px "Special Elite"' }) })); blue.position.set(5.5, 1.7, 11.92); blue.rotation.y = Math.PI; sc.add(blue);
  W.secretSpecial = { pos: V3(5.8, 0.79, 11.45), name: 'Caja de música', key: 'musicbox' };
  addNote('f3', 5.2, 0.79, 11.35, 0.3);
  const goldTeddy = ITEM_MODELS['Osito de peluche'](); goldTeddy.traverse((o) => { if (o.isMesh) o.material = new THREE.MeshStandardMaterial({ color: 0xc8a030, metalness: 0.9, roughness: 0.3 }); }); goldTeddy.position.set(4.5, 0.9, 8.6); sc.add(goldTeddy);
  addInteract(goldTeddy, 'Tocar el osito dorado', () => { AUD.laugh(AUD.at(4.5, 1, 8.6), 0.4); flashHallucination('bear'); removeInteract(goldTeddy); SAVE.seen.includes('egg_gold') || SAVE.seen.push('egg_gold'); persist(); });
  placeSpecial();
  // notas
  addNote('f1', 15.35, 1.2, 1.79, -Math.PI / 2, false);
  addNote('f2', 15.6, 0.77, 7.8, 0.4);
  // puzle: orden de los fusibles
  const order = shuffle([1, 2, 3]); W.fuseOrder = order; W.fuseOrderText = order.map((n) => ['', 'primero', 'segundo', 'tercero'][n] && n).join(' → ');
  W.fuseOrderText = order.join(' → ');
  W.secret = { shelf, opened: false, collider: shelf.userData.col };
  W.onSecret = () => {
    if (W.secret.opened) return; W.secret.opened = true;
    AUD.grind(AUD.at(5.5, 1, 6.8), 2.4); studyLamp.intensity = 1.5; blShade.material.emissiveIntensity = 1.2;
    const from = shelf.position.x, to = 4.25; let t = 0;
    W.updaters.push((dt) => { if (t >= 1) return; t = Math.min(1, t + dt / 2.4); shelf.position.x = lerp(from, to, smooth(t)); const c = W.secret.collider; const w = 1.2; c.minX = shelf.position.x - w / 2; c.maxX = shelf.position.x + w / 2; if (t >= 1) W.nav.rebuild(); });
    notify('Algo se ha movido en el salón', '');
  };
  // objetos coleccionables
  const spots = [[4.0, 0.43, 2.75], [14.9, 0.92, 0.35], [12.4, 0.79, 3.5], [14.3, 0.66, 10.4], [15.65, 0.56, 11.7], [3.65, 0.92, 7.8], [1.0, 0.33, 11.5], [7.3, 0.86, 5.6], [3.4, 0.55, 4.25], [15.6, 0.77, 7.3], [0.32, 1.19, 2.6], [10.8, 0.01, 7.4], [6.4, 0.63, 3.1], [8.3, 0.01, 1.5], [12.0, 0.01, 10.6]];
  spawnItems(spots, LEVEL_ITEMS.floor, 5);
  // jugador / enemigo
  W.spawn = { pos: V3(2.0, 0, 1.4), yaw: Math.atan2(-1, -1) * -1 };
  W.spawn.yaw = Math.atan2(-(6 - 2.0), -(3 - 1.4));
  W.enemySpawn = V3(12.5, 0, 8.5);
  W.tool = 'flashlight'; W.drain = 0.35;
  W.ambience = () => { AUD.rain(0.55, 1); AUD.wind(0.18); AUD.drone(0.12, 44); };
  // eventos aleatorios
  const tv = F_last_tv;
  W.eventPool = [
    () => { tvOn(tv, 6); },
    () => { AUD.phoneRing(AUD.at(6.4, 0.8, 3.0), 3); subtitle('¿Quién llama a estas horas?', 3); },
    () => { rockChair(rock, 9); },
    () => { AUD.knock(AUD.at(8, 1.2, -0.5), 3, 0.9); },
    () => { windowRunner(); },
    () => { yardWatcher(); },
    () => { W.flickerT = 2.5; AUD.burst({ type: 'white', f: 4000, dur: 0.6, vol: 0.06 }); },
    () => { AUD.whisper(AUD.at(PLAYER.pos.x + rand(-3, 3), 1.6, PLAYER.pos.z + rand(-3, 3)), 0.25); },
    () => { AUD.laugh(AUD.at(rand(0, 16), 1, rand(0, 12)), 0.18); },
    () => { AUD.creak(AUD.at(8, 2.6, rand(1, 11)), 0.2, 1.4); },
    () => { W.fridgeLight.intensity = 1.2; AUD.tone({ f: 60, type: 'sawtooth', dur: 4, vol: 0.03, dest: AUD.at(15.5, 1, 1.4) }); later(4000, () => (W.fridgeLight.intensity = 0)); },
  ];
}
let F_last_tv = null;
const _origTV = F.tv; F.tv = function (...a) { const r = _origTV.apply(this, a); F_last_tv = r; return r; };

/* =====================================================================
   NIVEL 2 · SÓTANO (Hopper)
   ===================================================================== */
const BASEMENT_MAP = [
  '######################',
  '#P....#.....L....#..I#',
  '#.###.#.###.####.#.#.#',
  '#.#I#...#.....I#...#.#',
  '#.#.#####.#####.####.#',
  '#L#...S.....#......L.#',
  '#.###.#####.#.######.#',
  '#...#.#I..#.#.#....#.#',
  '###.#.#.#.#.#.#.##.#.#',
  '#I..#...#S#...#.#I...#',
  '#.#######.#####.#.####',
  '#...L...#...N...#..O.#',
  '#.#K###.#.#####.##.#.#',
  '#.#XX#...#I..S.#..#..#',
  '#.#XX#.L.#.#####B.I..#',
  '######################',
];
function gridLevel(map, cell, wallH, onCell) {
  const rows = map.length, cols = map[0].length;
  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      if (map[r][c] === '#') { let e = c; while (e + 1 < cols && map[r][e + 1] === '#') e++; onCell('#run', r, c, e); c = e + 1; }
      else { onCell(map[r][c], r, c); c++; }
    }
  }
}
function buildBasement() {
  const map = BASEMENT_MAP, C = 2.0, H = 2.6, sc = W.scene, rows = map.length, cols = map[0].length;
  W.bounds = { minX: 0, maxX: cols * C, minZ: 0, maxZ: rows * C }; W.surface = 'concrete'; W.boltSpot = null;
  sc.background = new THREE.Color(0x000000); sc.fog = new THREE.FogExp2(0x050403, 0.06);
  levelLights({ hemi: 0.035, moon: 0.0, center: [22, 0, 16], extent: 26 }); W.moon.castShadow = false;
  LIGHTNING.enabled = false;
  const cx = (c) => (c + 0.5) * C, cz = (r) => (r + 0.5) * C;
  const free = [], lanterns = [], steams = [], itemSpots = [], wallFaces = [];
  gridLevel(map, C, H, (ch, r, c, e) => {
    if (ch === '#run') { const x0 = c * C, x1 = (e + 1) * C; box(x1 - x0, H, C, M.concrete, (x0 + x1) / 2, 0, cz(r), { uvs: 2 }); return; }
    if (ch === 'O') { const g = new THREE.Group(); pbox(g, 1.6, 1.8, 1.4, M.rust, 0, 0, 0, 1); part(g, new THREE.CylinderGeometry(0.2, 0.2, 1.0, 10), M.rust, 0.3, 2.3, 0); const hatch = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), new THREE.MeshBasicMaterial({ color: 0xff4a10 })); hatch.position.set(0, 0.6, 0.71); g.add(hatch); place(g, cx(c), cz(r), 0, 1.7, 1.5, 1.8); const bl = new THREE.PointLight(0xff4a10, 3, 7, 2); bl.position.set(cx(c), 0.6, cz(r) + 1.1); sc.add(bl); W.updaters.push((dt, t) => (bl.intensity = 2.4 + Math.sin(t * 9) * 0.4 + Math.random() * 0.4)); return; }
    if (ch === 'X') { floorPlane(c * C, r * C, (c + 1) * C, (r + 1) * C, M.wood, 0.002, 2); return; }
    free.push([r, c]);
    if (ch === 'L') lanterns.push([r, c]);
    if (ch === 'S') steams.push([r, c]);
    if (ch === 'I') itemSpots.push([cx(c) + rand(-0.4, 0.4), 0.01, cz(r) + rand(-0.4, 0.4)]);
    if (ch === 'P') W.spawn = { pos: V3(cx(c), 0, cz(r)), yaw: -Math.PI / 2 };
    if (ch === 'B') W.enemySpawn = V3(cx(c), 0, cz(r));
    if (ch === 'N') addNote('b1', cx(c) + 0.6, 0.01, cz(r) + 0.5, 0.4);
    if (ch === 'K') W.keyCell = [r, c];
  });
  floorPlane(0, 0, cols * C, rows * C, M.concreteDark, 0, 3); floorPlane(0, 0, cols * C, rows * C, M.concrete, H, 3, true);
  // tuberías y bombillas en el techo
  const isFree = (r, c) => r >= 0 && c >= 0 && r < rows && c < cols && map[r][c] !== '#' && map[r][c] !== 'O';
  for (let r = 0; r < rows; r++) { let s = -1; for (let c = 0; c <= cols; c++) { const f = c < cols && isFree(r, c) && map[r][c] !== 'X'; if (f && s < 0) s = c; if (!f && s >= 0) { if (c - s >= 3 && Math.random() < 0.7) { const z = cz(r) + rand(-0.7, 0.7); F.pipe(s * C + 0.2, H - 0.15, z, c * C - 0.2, H - 0.15, z, rand(0.05, 0.09)); } s = -1; } } }
  for (let c = 0; c < cols; c++) { let s = -1; for (let r = 0; r <= rows; r++) { const f = r < rows && isFree(r, c) && map[r][c] !== 'X'; if (f && s < 0) s = r; if (!f && s >= 0) { if (r - s >= 3 && Math.random() < 0.6) { const x = cx(c) + rand(-0.7, 0.7); F.pipe(x, H - 0.3, s * C + 0.2, x, H - 0.3, r * C - 0.2, rand(0.04, 0.07)); } s = -1; } } }
  // props en los pasillos (pegados a muros)
  for (const [r, c] of free) {
    if (map[r][c] !== '.' || Math.random() > 0.28) continue;
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]].filter(([dr, dc]) => !isFree(r + dr, c + dc));
    if (!dirs.length) continue; const [dr, dc] = pick(dirs);
    const x = cx(c) + dc * 0.68, z = cz(r) + dr * 0.68, k = Math.random();
    if (k < 0.3) F.barrel(x, z); else if (k < 0.55) F.crate(x, z, 0.6, rand(-0.3, 0.3)); else if (k < 0.75) F.boxes(x, z, randi(1, 3), 0.5); else if (k < 0.85) F.headPile(x, z, 2); else { const sh = new THREE.Group(); for (let i = 0; i < 4; i++) pbox(sh, 1.0, 0.03, 0.4, M.metalDark, 0, i * 0.5 + 0.1, 0, 0.5); for (const sx of [-0.48, 0.48]) for (const sz of [-0.18, 0.18]) pbox(sh, 0.04, 1.8, 0.04, M.metalDark, sx, 0, sz, 0); for (let i = 0; i < 5; i++) pbox(sh, 0.18, 0.15, 0.2, M.cardboard, rand(-0.35, 0.35), randi(0, 3) * 0.5 + 0.13, 0, 0.5); place(sh, x, z, dc ? Math.PI / 2 : 0, dc ? 0.45 : 1.0, dc ? 1.0 : 0.45, 1.8); }
    if (Math.random() < 0.25) { const pud = new THREE.Mesh(new THREE.CircleGeometry(rand(0.4, 0.8), 16), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.02, metalness: 0.4 })); pud.rotation.x = -Math.PI / 2; pud.position.set(cx(c) + rand(-0.4, 0.4), 0.005, cz(r) + rand(-0.4, 0.4)); pud.scale.y = rand(0.6, 1); sc.add(pud); }
    if (Math.random() < 0.15) F.bulb(cx(c), H, cz(r));
  }
  // faroles rojos (se confunden con los ojos de Hopper)
  W.lanterns = [];
  for (const [r, c] of lanterns) {
    const g = new THREE.Group(); const glassM = new THREE.MeshStandardMaterial({ color: 0x300000, emissive: 0xff2a10, emissiveIntensity: 2.2, transparent: true, opacity: 0.85 });
    part(g, new THREE.CylinderGeometry(0.07, 0.07, 0.16, 10), glassM, 0, 0.12, 0); part(g, new THREE.CylinderGeometry(0.09, 0.09, 0.03, 10), M.metalDark, 0, 0.03, 0); part(g, new THREE.ConeGeometry(0.09, 0.06, 10), M.metalDark, 0, 0.23, 0); part(g, new THREE.TorusGeometry(0.05, 0.006, 4, 10, Math.PI), M.metalDark, 0, 0.28, 0);
    const gl = eyeGlow(0xff3010, 0.5); gl.position.y = 0.12; g.add(gl);
    const pl = new THREE.PointLight(0xff3a18, 2.2, 7, 2); pl.position.y = 0.3; g.add(pl);
    const hang = Math.random() < 0.5; g.position.set(cx(c) + rand(-0.5, 0.5), hang ? 1.55 : 0.0, cz(r) + rand(-0.5, 0.5)); sc.add(g); g.userData.dynamic = true;
    if (hang) { const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, H - 1.85, 4), M.black); ch.position.y = (H - 1.85) / 2 + 0.29; g.add(ch); }
    const L = { g, pl, gm: glassM, gl, base: 2.2, off: 0 }; W.lanterns.push(L);
    W.updaters.push((dt, t) => { if (L.off > 0) { L.off -= dt; pl.intensity = 0; glassM.emissiveIntensity = 0.1; gl.material.opacity = 0; return; } const f = 0.85 + Math.sin(t * 6 + c) * 0.08 + Math.random() * 0.1; pl.intensity = L.base * f; glassM.emissiveIntensity = 2.2 * f; gl.material.opacity = 0.7 * f; if (hang) g.rotation.z = Math.sin(t * 0.9 + r) * 0.06; });
  }
  // vapor
  W.steams = [];
  for (const [r, c] of steams) {
    const n = 70, geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pm = new THREE.PointsMaterial({ map: TEX.soft.map, size: 1.4, transparent: true, opacity: 0.0, depthWrite: false, color: 0x8a8a88 });
    const pts = new THREE.Points(geo, pm); pts.frustumCulled = false; pts.userData.dynamic = true; sc.add(pts);
    const x = cx(c), z = cz(r); F.pipe(x - 0.9, H - 0.25, z, x + 0.9, H - 0.25, z, 0.11); const valve = part(new THREE.Group(), new THREE.TorusGeometry(0.1, 0.015, 6, 12), new THREE.MeshStandardMaterial({ color: 0x6a0a0a }), 0, 0, 0); valve.parent.position.set(x, H - 0.25, z + 0.12); sc.add(valve.parent);
    const parts = []; for (let i = 0; i < n; i++) parts.push({ p: V3(x, H - 0.3, z), v: V3(), life: 0 });
    const S = { x, z, active: false, t: rand(2, 8), pts, pm, parts, k: 0 };
    W.steams.push(S);
    W.updaters.push((dt) => {
      S.t -= dt; if (S.t <= 0) { S.active = !S.active; S.t = S.active ? rand(3, 6) : rand(5, 12); if (S.active) AUD.steam(AUD.at(x, H - 0.3, z), S.t); }
      S.k = lerp(S.k, S.active ? 1 : 0, dt * 1.5); pm.opacity = 0.32 * S.k;
      for (let i = 0; i < n; i++) { const P = parts[i]; P.life -= dt; if (P.life <= 0) { P.p.set(x + rand(-0.3, 0.3), H - 0.3, z + rand(-0.2, 0.2)); P.v.set(rand(-0.6, 0.6), rand(-1.8, -0.8), rand(-0.6, 0.6)); P.life = rand(1, 2.4); } P.p.addScaledVector(P.v, dt); P.v.y *= 0.98; if (P.p.y < 0.2) P.v.y = Math.abs(P.v.y) * 0.3; pos[i * 3] = P.p.x; pos[i * 3 + 1] = P.p.y; pos[i * 3 + 2] = P.p.z; }
      geo.attributes.position.needsUpdate = true;
    });
  }
  W.sightExtra = (x, z) => W.steams.some((s) => s.k > 0.5 && (x - s.x) ** 2 + (z - s.z) ** 2 < 2.4);
  // números con tiza (código del teclado)
  const code = [randi(0, 9), randi(0, 9), randi(0, 9), randi(0, 9)]; W.code = code.join('');
  const cand = []; for (const [r, c] of free) for (const [dr, dc] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) if (map[r + dr] && map[r + dr][c + dc] === '#' && map[r][c] === '.') cand.push([r, c, dr, dc]);
  shuffle(cand);
  const used = []; let k = 0;
  for (const cd of cand) { if (k >= 4) break; if (used.some((u) => Math.abs(u[0] - cd[0]) + Math.abs(u[1] - cd[1]) < 6)) continue; used.push(cd); const [r, c, dr, dc] = cd;
    const t = textTex([['I', 'II', 'III', 'IV'][k] + ' = ' + code[k]], { w: 256, h: 128, fg: 'rgba(235,235,225,.85)', font: '54px "Homemade Apple"' });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 1 }));
    m.position.set(cx(c) + dc * 0.985, 1.3 + rand(-0.2, 0.2), cz(r) + dr * 0.985); m.lookAt(cx(c), m.position.y, cz(r)); m.rotation.z += rand(-0.1, 0.1); sc.add(m); k++; }
  // puerta con teclado
  const [kr, kc] = W.keyCell;
  const kdoor = box(C, H, 0.12, M.rust, cx(kc), 0, kr * C + C - 0.1, { uvs: 1 }); kdoor.userData.dynamic = true;
  const pad = new THREE.Group(); pbox(pad, 0.16, 0.24, 0.04, M.metalDark, 0, 0, 0, 0); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.04), new THREE.MeshBasicMaterial({ color: 0x113a11 })); scr.position.set(0, 0.19, 0.021); pad.add(scr);
  pad.position.set(cx(kc) + 0.7, 1.15, kr * C + C - 0.2); pad.rotation.y = Math.PI; sc.add(pad);
  W.keyDoor = kdoor; addInteract(pad, 'Usar teclado', () => openKeypad());
  W.onKeypad = () => { removeInteract(pad); scr.material.color.setHex(0x22ff44); AUD.grind(AUD.at(cx(kc), 1, kr * C + C), 2); let t = 0; W.updaters.push((dt) => { if (t >= 1) return; t = Math.min(1, t + dt / 2); kdoor.position.y = H / 2 + t * (H - 0.2); if (t >= 1) { kdoor.userData.col.on = false; W.nav.rebuild(); } }); };
  // habitación secreta
  const xs = cx(3) + 1, zs = cz(13) + 1;
  F.table(xs, zs + 0.3, 0, 1.4, 0.7, 0.8, M.lightWood); W.secretSpecial = { pos: V3(xs - 0.3, 0.81, zs + 0.3), name: 'Adrenalina', key: 'adrenaline' }; placeSpecial();
  addNote('b3', xs + 0.35, 0.81, zs + 0.25, -0.3);
  const goldRab = ITEM_MODELS['Osito de peluche'](); goldRab.traverse((o) => { if (o.isMesh) o.material = new THREE.MeshStandardMaterial({ color: 0x8a6ac0, metalness: 0.5, roughness: 0.3 }); }); goldRab.position.set(xs - 0.8, 0.01, zs - 0.6); sc.add(goldRab);
  addInteract(goldRab, 'Coger el conejito', () => { AUD.laugh(AUD.at(xs, 1, zs), 0.35); flashHallucination('rabbit'); removeInteract(goldRab); });
  const sl = new THREE.PointLight(0x80a0ff, 1.0, 5, 2); sl.position.set(xs, 2.2, zs); sc.add(sl);
  const n2 = free.filter(([r, c]) => map[r][c] === '.' && Math.hypot(r - 1, c - 1) > 5); const [nr, nc] = pick(n2); addNote('b2', cx(nc) + 0.5, 0.01, cz(nr) - 0.4, 1.2);
  // líquido del mechero
  for (let i = 0; i < 3; i++) { const [r, c] = pick(free.filter(([r, c]) => map[r][c] === '.')); const can = new THREE.Group(); pbox(can, 0.1, 0.16, 0.05, new THREE.MeshStandardMaterial({ color: 0x8a1a10, roughness: 0.4, metalness: 0.5 }), 0, 0, 0, 0); can.position.set(cx(c) + rand(-0.5, 0.5), 0.0, cz(r) + rand(-0.5, 0.5)); sc.add(can); addInteract(can, 'Coger gas de mechero', () => { PLAYER.battery = Math.min(100, PLAYER.battery + 45); AUD.pickup(); can.parent.remove(can); removeInteract(can); notify('Gas de mechero', '+45%'); }); }
  for (let i = 0; i < 4; i++) { const [r, c] = pick(free.filter(([r, c]) => map[r][c] === '.')); itemSpots.push([cx(c) + rand(-0.5, 0.5), 0.01, cz(r) + rand(-0.5, 0.5)]); }
  spawnItems(itemSpots, LEVEL_ITEMS.basement, 5);
  W.tool = 'lighter'; W.drain = 0.45;
  W.ambience = () => { AUD.drone(0.16, 38); AUD.rain(0.12, 1); };
  W.eventPool = [
    () => { AUD.clang(AUD.at(rand(0, 44), 2.4, rand(0, 32)), 0.5); },
    () => { AUD.knock(AUD.at(PLAYER.pos.x, 3.2, PLAYER.pos.z), 3, 0.7); subtitle('…tres golpes. Siempre tres.', 3); },
    () => { AUD.whisper(AUD.at(PLAYER.pos.x + rand(-2, 2), 1.5, PLAYER.pos.z + rand(-2, 2)), 0.3); },
    () => { AUD.laugh(AUD.at(rand(0, 44), 1, rand(0, 32)), 0.2); },
    () => { AUD.thunder(0.85); },
    () => { const L = pick(W.lanterns); L.off = rand(4, 9); AUD.burst({ type: 'white', f: 2000, dur: 0.1, vol: 0.2, dest: AUD.at(L.g.position.x, 1, L.g.position.z) }); },
    () => { fakeEyes(); },
    () => { for (let i = 0; i < 6; i++) setTimeout(() => AUD.footstep('wood', 0.5, AUD.at(PLAYER.pos.x + 2, 3.5, PLAYER.pos.z - 2 + i)), i * 500); },
    () => { AUD.drip(AUD.at(PLAYER.pos.x + rand(-2, 2), 2.5, PLAYER.pos.z + rand(-2, 2))); },
  ];
  W.updaters.push((dt, t) => { if (Math.random() < dt * 0.5) AUD.drip(AUD.at(rand(0, 44), 2.5, rand(0, 32))); });
}

/* =====================================================================
   NIVEL 3 · ÁTICO (Redtail)
   ===================================================================== */
const ATTIC_MAP = [
  '####################',
  '#P..b...I..S...b..I#',
  '#...b.bb...p..b....#',
  '#.F.....S....bb.c.e#',
  '#bb.pbb..I..p....bb#',
  'w....m.b..N.bb.p...w',
  '#..S..bb.p...I..S..#',
  '#.bb..R...bb..c..bb#',
  '#I..p...M...p...HXX#',
  '#..bbb.c..D...bbHXX#',
  '#e....I...b..k..HXX#',
  '####################',
];
function buildAttic() {
  const map = ATTIC_MAP, C = 1.6, sc = W.scene, rows = map.length, cols = map[0].length;
  const X = cols * C, Z = rows * C, EDGE = 2.0, RIDGE = 4.2;
  W.bounds = { minX: 0, maxX: X, minZ: 0, maxZ: Z }; W.surface = 'wood'; W.rainExclude = [-0.2, -0.2, X + 0.2, Z + 0.2]; W.boltSpot = V3(X / 2, 0, Z / 2);
  sc.background = new THREE.Color(0); makeSky(sc);
  levelLights({ hemi: 0.03, moon: 0.05, moonDir: [-1, 0.35, 0.15], center: [X / 2, 1, Z / 2], extent: 22, lightningGain: 14 });
  const cx = (c) => (c + 0.5) * C, cz = (r) => (r + 0.5) * C;
  const roofY = (z) => EDGE + (RIDGE - EDGE) * (1 - Math.abs(z - Z / 2) / (Z / 2));
  const free = [], itemSpots = [], candles = [], hidden = [];
  gridLevel(map, C, 3, (ch, r, c, e) => {
    if (ch === '#run') { if (r === 0 || r === rows - 1) { const x0 = c * C, x1 = (e + 1) * C; box(x1 - x0, EDGE, C, M.attic, (x0 + x1) / 2, 0, cz(r), { uvs: 1.5 }); } else for (let k = c; k <= e; k++) gableBlock(r, k); return; }
    if (ch === 'w') { gableBlock(r, c, true); return; }
    if (ch === 'X') { free.push([r, c]); return; }
    if (ch === 'H') { const hb = box(0.2, roofY(cz(r)), C, M.attic, c * C + C - 0.1, 0, cz(r), { uvs: 1.5 }); hb.userData.dynamic = true; hidden.push(hb); return; }
    if (ch === 'b') { const n = randi(2, 4); if (Math.random() < 0.6) F.boxes(cx(c), cz(r), n, 0.85); else { F.crate(cx(c), cz(r), 0.9, rand(-0.2, 0.2)); } const bc = W.colliders[W.colliders.length - 1]; bc.minX = cx(c) - 0.7; bc.maxX = cx(c) + 0.7; bc.minZ = cz(r) - 0.7; bc.maxZ = cz(r) + 0.7; bc.maxY = Math.max(bc.maxY, 1.8); bc.sight = true; if (Math.random() < 0.6) F.boxes(cx(c) + 0.35, cz(r) - 0.3, 2, 0.5); return; }
    free.push([r, c]);
    if (ch === 'p') { box(0.22, roofY(cz(r)), 0.22, M.lightWood, cx(c), 0, cz(r), { sight: false, uvs: 0.8 }); F.cobweb(cx(c) + 0.12, roofY(cz(r)) - 0.5, cz(r), Math.PI / 4, 0.6); }
    if (ch === 'S') F.sheetCovered(cx(c), cz(r), rand(1.0, 1.3), rand(0.9, 1.3), rand(0.7, 1.0), rand(-0.3, 0.3));
    if (ch === 'M') { const mq = new THREE.Group(); part(mq, new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6), M.darkWood, 0, 0.45, 0); const torso = part(mq, lumpy(new THREE.CylinderGeometry(0.2, 0.15, 0.7, 14), 0.01), M.sheet, 0, 1.25, 0); part(mq, new THREE.SphereGeometry(0.12, 12, 10), M.sheet, 0, 1.75, 0); place(mq, cx(c), cz(r), rand(0, 6), 0.45, 0.45, 1.8); W.mannequin = mq; }
    if (ch === 'R') { const h = new THREE.Group(), inner = new THREE.Group(); h.add(inner); pbox(inner, 0.7, 0.25, 0.18, M.lightWood, 0, 0.45, 0, 0); pbox(inner, 0.18, 0.4, 0.14, M.lightWood, 0.35, 0.6, 0, 0); for (const s of [-1, 1]) { const rk = part(inner, new THREE.TorusGeometry(0.7, 0.02, 4, 14, 0.9), M.darkWood, 0, 0.72, s * 0.12, 0, 0, Math.PI * 1.5 - 0.45); pbox(inner, 0.03, 0.4, 0.03, M.lightWood, -0.25, 0.05, s * 0.08, 0); pbox(inner, 0.03, 0.4, 0.03, M.lightWood, 0.25, 0.05, s * 0.08, 0); } place(h, cx(c), cz(r), 0.6, 0.8, 0.4, 0.9); h.userData.dynamic = true; W.horse = inner; }
    if (ch === 'c') { const st = new THREE.Group(); pbox(st, 0.35, 0.7, 0.35, M.darkWood, 0, 0, 0, 0.5); place(st, cx(c), cz(r), 0, 0.35, 0.35, 0.7); const cd = F.candle(cx(c), 0.7, cz(r), false, true); candles.push(cd); addInteract(cd.g, 'Encender vela', () => lightCandle(cd)); }
    if (ch === 'k') { const st = new THREE.Group(); pbox(st, 0.35, 0.5, 0.35, M.darkWood, 0, 0, 0, 0.5); place(st, cx(c), cz(r), 0, 0.35, 0.35, 0.5); F.candle(cx(c), 0.5, cz(r), true, true); F.candle(cx(c) + 0.1, 0.5, cz(r) + 0.08, true, false); }
    if (ch === 'm') { const mb = new THREE.Group(); pbox(mb, 0.1, 0.03, 0.06, new THREE.MeshStandardMaterial({ color: 0x9a2a10 }), 0, 0, 0, 0); mb.position.set(cx(c), 0.0, cz(r)); sc.add(mb); addInteract(mb, 'Coger cerillas', () => { PLAYER.matches += 4; AUD.pickup(); mb.parent.remove(mb); removeInteract(mb); notify('Cerillas', '×4'); }); }
    if (ch === 'e') { const bt = new THREE.Group(); part(bt, new THREE.CylinderGeometry(0.02, 0.02, 0.09, 10), new THREE.MeshStandardMaterial({ color: 0x2a6a2a, metalness: 0.6, roughness: 0.3 }), 0, 0.02, 0, 0, 0, Math.PI / 2); part(bt, new THREE.CylinderGeometry(0.02, 0.02, 0.09, 10), new THREE.MeshStandardMaterial({ color: 0x2a6a2a, metalness: 0.6, roughness: 0.3 }), 0, 0.02, 0.05, 0, 0, Math.PI / 2); bt.position.set(cx(c), 0, cz(r)); sc.add(bt); addInteract(bt, 'Coger pilas', () => { PLAYER.battery = Math.min(100, PLAYER.battery + 45); AUD.pickup(); bt.parent.remove(bt); removeInteract(bt); notify('Pilas', '+45%'); }); }
    if (ch === 'I') itemSpots.push([cx(c) + rand(-0.3, 0.3), 0.01, cz(r) + rand(-0.3, 0.3)]);
    if (ch === 'P') W.spawn = { pos: V3(cx(c), 0, cz(r)), yaw: Math.atan2(-(cx(2) - cx(c)), -(cz(3) - cz(r))) };
    if (ch === 'F') W.enemySpawn = V3(cx(c), 0, cz(r));
    if (ch === 'N') addNote('a1', cx(c), 0.01, cz(r), 0.6);
    if (ch === 'D') { const st = new THREE.Group(); pbox(st, 0.5, 0.6, 0.5, M.cardboard, 0, 0, 0, 0.5); place(st, cx(c), cz(r), 0, 0.5, 0.5, 0.6); const doll = ITEM_MODELS['Cabeza de muñeca'](); doll.scale.setScalar(2.2); doll.position.set(cx(c), 0.6, cz(r)); sc.add(doll); doll.userData.dynamic = true; W.updaters.push((dt) => { const want = Math.atan2(PLAYER.pos.x - doll.position.x, PLAYER.pos.z - doll.position.z); let d = want - doll.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); if (!PLAYER.sees(doll.position, 0.95)) doll.rotation.y += d * Math.min(1, dt * 3); }); }
  });
  function gableBlock(r, c, window = false) {
    const x0 = c === 0 ? 0 : X - 0.3, z = cz(r), h = roofY(z);
    if (!window) { box(0.3, h, C, M.attic, x0 + 0.15, 0, z, { uvs: 1.5 }); return; }
    const y0 = 1.3, y1 = 2.2; box(0.3, y0, C, M.attic, x0 + 0.15, 0, z, { uvs: 1.5 }); box(0.3, h - y1, C, M.attic, x0 + 0.15, y1, z, { uvs: 1.5 }); box(0.3, y1 - y0, 0.4, M.attic, x0 + 0.15, y0, z - 0.6, { uvs: 1.5 }); box(0.3, y1 - y0, 0.4, M.attic, x0 + 0.15, y0, z + 0.6, { uvs: 1.5 });
    addWindow('z', x0 + 0.15, z, 0.8, y0, y1, { outsideSign: c === 0 ? -1 : 1, curtains: null });
  }
  // suelo, tejado, vigas
  const roofMat = M.attic.clone(); roofMat.side = THREE.DoubleSide;
  floorPlane(0, 0, X, Z, M.attic, 0, 2.5);
  for (const s of [-1, 1]) {
    const half = Z / 2, len = Math.hypot(half, RIDGE - EDGE), ang = Math.atan2(RIDGE - EDGE, half);
    const g = new THREE.PlaneGeometry(X, len); worldUV(g, 2.0);
    const roof = new THREE.Mesh(g, roofMat); roof.rotation.x = s < 0 ? Math.PI / 2 - ang : -(Math.PI / 2 - ang);
    roof.position.set(X / 2, (EDGE + RIDGE) / 2, s < 0 ? half / 2 : Z - half / 2);
    roof.castShadow = true; roof.receiveShadow = true; sc.add(roof);
    for (let x = 0.4; x < X; x += 1.6) { const raf = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, len), M.lightWood); raf.position.set(x, (EDGE + RIDGE) / 2 - 0.1, s < 0 ? half / 2 : Z - half / 2); raf.rotation.x = s < 0 ? -ang : ang; raf.castShadow = true; sc.add(raf); }
  }
  box(X, 0.2, 0.2, M.lightWood, X / 2, RIDGE - 0.25, Z / 2, { col: false });
  for (let x = 0.4; x < X; x += 3.2) box(0.1, 0.12, Z * 0.6, M.lightWood, x, 2.9, Z / 2, { col: false });
  for (let x = 2; x < X; x += 5) F.bulb(x, RIDGE - 0.2, Z / 2 + rand(-1, 1));
  for (let i = 0; i < 10; i++) F.cobweb(rand(1, X - 1), 2.6, rand(3, Z - 3), rand(0, 6), rand(0.6, 1.2));
  // polvo en el aire
  const dn = 600, dg = new THREE.BufferGeometry(), dp = new Float32Array(dn * 3); for (let i = 0; i < dn; i++) { dp[i * 3] = rand(0, X); dp[i * 3 + 1] = rand(0, 3.5); dp[i * 3 + 2] = rand(0, Z); } dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dm = new THREE.PointsMaterial({ map: TEX.soft.map, size: 0.035, transparent: true, opacity: 0.55, depthWrite: false, color: 0xbfb7a0 });
  const dust = new THREE.Points(dg, dm); dust.userData.dynamic = true; sc.add(dust);
  W.updaters.push((dt, t) => { for (let i = 0; i < dn; i++) { dp[i * 3 + 1] -= dt * 0.03; dp[i * 3] += Math.sin(t * 0.3 + i) * dt * 0.02; if (dp[i * 3 + 1] < 0) dp[i * 3 + 1] = 3.5; } dg.attributes.position.needsUpdate = true; dm.opacity = PLAYER.lightOn ? 0.6 : 0.15; });
  // puzle de velas
  W.candles = candles;
  W.onCandlesDone = () => {
    AUD.grind(AUD.at(cx(16), 1, cz(9)), 3); notify('Una pared se ha abierto', '');
    let t = 0; W.updaters.push((dt) => { if (t >= 1) return; t = Math.min(1, t + dt / 3); hidden.forEach((h) => { h.position.y = roofY(h.position.z) / 2 - t * (roofY(h.position.z) + 0.1); }); if (t >= 1) { hidden.forEach((h) => (h.userData.col.on = false)); W.nav.rebuild(); } });
  };
  W.secretSpecial = { pos: V3(cx(18), 0.71, cz(9)), name: 'Bengala', key: 'flare' };
  { const st = new THREE.Group(); pbox(st, 0.6, 0.7, 0.5, M.darkWood, 0, 0, 0, 0.5); place(st, cx(18), cz(9), 0, 0.6, 0.5, 0.7); placeSpecial(); addNote('a3', cx(17), 0.01, cz(9), 0.2); F.candle(cx(18) + 0.2, 0.7, cz(9) + 0.15, true, true); const goldFox = ITEM_MODELS['Osito de peluche'](); goldFox.traverse((o) => { if (o.isMesh) o.material = new THREE.MeshStandardMaterial({ color: 0xa83a10, metalness: 0.4, roughness: 0.4 }); }); goldFox.position.set(cx(17), 0.0, cz(10)); sc.add(goldFox); addInteract(goldFox, 'Mirar al zorrito', () => { AUD.laugh(AUD.at(cx(17), 1, cz(10)), 0.35); flashHallucination('fox'); removeInteract(goldFox); }); }
  addNote('a2', cx(5) + 0.4, 0.01, cz(5) + 0.4, 1.0);
  for (let i = 0; i < 4; i++) { const [r, c] = pick(free.filter(([r, c]) => map[r][c] === '.' && Math.hypot(r - 1, c - 1) > 4)); itemSpots.push([cx(c) + rand(-0.4, 0.4), 0.01, cz(r) + rand(-0.4, 0.4)]); }
  spawnItems(itemSpots, LEVEL_ITEMS.attic, 5);
  W.tool = 'flashlight'; W.drain = 0.6;
  W.ambience = () => { AUD.rain(0.75, 0); AUD.wind(0.25); AUD.drone(0.13, 41); };
  W.eventPool = [
    () => { if (W.horse) { let t = 0; AUD.creak(AUD.at(W.horse.parent.position.x, 0.5, W.horse.parent.position.z), 0.25, 3); W.updaters.push((dt) => { if (t > 7) return; t += dt; W.horse.rotation.z = Math.sin(t * 4) * 0.18 * (1 - t / 7); }); } },
    () => { const ball = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), new THREE.MeshStandardMaterial({ color: 0xa02020, roughness: 0.4 })); const a = rand(0, TAU); ball.position.set(PLAYER.pos.x + Math.cos(a) * 4, 0.1, PLAYER.pos.z + Math.sin(a) * 4); sc.add(ball); const v = V3(-Math.cos(a), 0, -Math.sin(a)).multiplyScalar(1.4); let t = 0; W.updaters.push((dt) => { if (t > 4) return; t += dt; ball.position.addScaledVector(v, dt * (1 - t / 4)); collidePoint(ball.position, 0.1); ball.rotation.x += dt * 8; }); AUD.burst({ type: 'brown', f: 200, dur: 2.5, vol: 0.2, dest: AUD.at(ball.position.x, 0, ball.position.z) }); },
    () => { AUD.musicBox(0.05); later(9000, () => AUD.stopLoop('musicbox', 2)); },
    () => { for (let i = 0; i < 8; i++) setTimeout(() => AUD.burst({ type: 'white', f: 3000, q: 4, dur: 0.05, vol: 0.2, dest: AUD.at(PLAYER.pos.x + rand(-2, 2), 4, PLAYER.pos.z + rand(-2, 2)) }), i * 120); subtitle('Algo está arañando el tejado.', 3); },
    () => { AUD.whisper(AUD.at(PLAYER.pos.x - 1, 1.6, PLAYER.pos.z - 1), 0.3); },
    () => { if (W.mannequin) { W.mannequin.rotation.y = Math.atan2(PLAYER.pos.x - W.mannequin.position.x, PLAYER.pos.z - W.mannequin.position.z); AUD.creak(AUD.at(W.mannequin.position.x, 1, W.mannequin.position.z), 0.15, 0.5); } },
    () => { LIGHTNING.strike(); },
    () => { AUD.laugh(AUD.at(rand(0, X), 1, rand(0, Z)), 0.2); },
  ];
}
function lightCandle(cd) {
  if (cd.lit) return;
  if (PLAYER.matches <= 0) { subtitle('Necesito algo para encenderla.', 2.5); return; }
  PLAYER.matches--; AUD.match(); cd.set(true); removeInteract(cd.g);
  const n = W.candles.filter((c) => c.lit).length; notify('Vela encendida', n + ' / 3');
  if (n === 3) later(1200, () => W.onCandlesDone());
}

/* =====================================================================
   NIVEL 4 · BOSQUE (Mamá Peep)
   ===================================================================== */
function buildForestLevel() {
  const sc = W.scene, R = 68;
  W.bounds = { minX: -R, maxX: R, minZ: -R, maxZ: R }; W.surface = 'leaves'; W.rainExclude = null; W.boltSpot = V3(0, 0, 0); W.outdoor = true;
  sc.background = new THREE.Color(0x020304); sc.fog = new THREE.FogExp2(0x05070a, 0.055);
  makeSky(sc);
  levelLights({ hemi: 0.09, moon: 0.12, moonDir: [-0.6, 0.9, -0.5], center: [0, 0, 0], extent: 30, lightningGain: 7, moonColor: 0x9aaad0 });
  floorPlane(-R - 30, -R - 30, R + 30, R + 30, M.ground, 0, 3);
  const landmarks = [{ x: 0, z: 0, r: 7 }, { x: 38, z: -30, r: 7 }, { x: -30, z: 25, r: 4 }, { x: -40, z: -35, r: 5 }, { x: 20, z: 30, r: 4 }, { x: -10, z: -45, r: 4 }, { x: 45, z: 40, r: 4 }, { x: -45, z: 5, r: 4 }];
  const trees = [];
  for (let i = 0; i < 2600 && trees.length < 380; i++) {
    const x = rand(-R - 12, R + 12), z = rand(-R - 12, R + 12); const edge = Math.max(Math.abs(x), Math.abs(z)) > R - 2;
    if (landmarks.some((l) => Math.hypot(x - l.x, z - l.z) < l.r + 1.5)) continue;
    const minD = edge ? 1.6 : 3.6; if (trees.some((t) => (t.x - x) ** 2 + (t.z - z) ** 2 < minD * minD)) continue;
    const r = rand(0.18, 0.4); trees.push({ x, z, r, h: rand(9, 18), type: Math.random() < 0.45 ? 'pine' : Math.random() < 0.5 ? 'dead' : 'leaf' });
  }
  buildForest(trees, { leafCards: 120, pineCards: 60 });
  trees.forEach((t) => W.circles.push({ x: t.x, z: t.z, r: t.r + 0.1 }));
  W.trees = trees;
  buildGrass(0, 0, 120, SETTINGS.quality >= 2 ? 50000 : 22000);
  // rocas, troncos caídos, arbustos
  for (let i = 0; i < 60; i++) { const x = rand(-R, R), z = rand(-R, R); if (landmarks.some((l) => Math.hypot(x - l.x, z - l.z) < l.r)) continue; const s = rand(0.3, 1.1); const rk = new THREE.Mesh(lumpy(new THREE.DodecahedronGeometry(s, 1), s * 0.15, 3, i), M.concrete); rk.position.set(x, s * 0.3, z); rk.rotation.set(rand(0, 3), rand(0, 3), 0); rk.scale.y = 0.6; rk.castShadow = rk.receiveShadow = true; sc.add(rk); if (s > 0.6) W.circles.push({ x, z, r: s * 0.9 }); }
  for (let i = 0; i < 14; i++) { const x = rand(-R, R), z = rand(-R, R); if (landmarks.some((l) => Math.hypot(x - l.x, z - l.z) < l.r)) continue; const lg = new THREE.Mesh(lumpy(new THREE.CylinderGeometry(0.25, 0.3, rand(3, 6), 10), 0.03), M.bark); lg.rotation.set(0, rand(0, 3), Math.PI / 2); lg.position.set(x, 0.25, z); lg.castShadow = lg.receiveShadow = true; sc.add(lg); }
  // claro inicial: hoguera
  const fire = new THREE.Group(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; part(fire, lumpy(new THREE.DodecahedronGeometry(0.18, 0), 0.02), M.concrete, Math.cos(a) * 0.6, 0.1, Math.sin(a) * 0.6); } for (let i = 0; i < 5; i++) part(fire, new THREE.CylinderGeometry(0.05, 0.06, 0.8, 6), M.black, rand(-0.2, 0.2), 0.08, rand(-0.2, 0.2), Math.PI / 2, rand(0, 3), 0); place(fire, 0, 0, 0, 1.2, 1.2, 0.3);
  const ember = new THREE.PointLight(0xff4010, 0.8, 3, 2); ember.position.set(0, 0.3, 0); sc.add(ember); W.updaters.push((dt, t) => (ember.intensity = 0.5 + Math.random() * 0.4));
  for (const a of [0.3, 2.4, 4.4]) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 1.8, 10), M.bark); lg.rotation.set(0, a, Math.PI / 2); lg.position.set(Math.cos(a) * 2.2, 0.2, Math.sin(a) * 2.2); lg.castShadow = true; sc.add(lg); }
  addNote('r1', 1.5, 0.02, -1.0, 0.3);
  // cabaña (cerrada con llave)
  const cbx = 38, cbz = -30, cw = 5, cd = 4, ch = 2.6;
  const plank = M.lightWood;
  wall('x', cbz - cd / 2, cbx - cw / 2, cbx + cw / 2, ch, plank, plank, [{ c: cbx, w: 1.0, y0: 0, y1: 2.0 }]);
  wall('x', cbz + cd / 2, cbx - cw / 2, cbx + cw / 2, ch, plank, plank, [{ c: cbx + 1.2, w: 0.8, y0: 1.0, y1: 1.8 }]);
  wall('z', cbx - cw / 2, cbz - cd / 2, cbz + cd / 2, ch, plank, plank); wall('z', cbx + cw / 2, cbz - cd / 2, cbz + cd / 2, ch, plank, plank);
  floorPlane(cbx - cw / 2, cbz - cd / 2, cbx + cw / 2, cbz + cd / 2, M.wood, 0.01, 2);
  for (const s of [-1, 1]) { const rf = new THREE.Mesh(new THREE.BoxGeometry(cw + 0.8, 0.08, cd / 2 + 0.7), M.darkWood); rf.position.set(cbx, ch + 0.55, cbz + s * (cd / 4 + 0.15)); rf.rotation.x = s * 0.45; rf.castShadow = true; sc.add(rf); }
  box(cw, 0.6, 0.15, plank, cbx, ch, cbz - cd / 2, { col: false }); box(cw, 0.6, 0.15, plank, cbx, ch, cbz + cd / 2, { col: false });
  addWindow('x', cbz + cd / 2, cbx + 1.2, 0.8, 1.0, 1.8, { outsideSign: 1, curtains: null });
  const cdoor = box(1.0, 2.0, 0.06, M.door, cbx, 0, cbz - cd / 2, { uvs: 0 }); cdoor.userData.dynamic = true;
  addInteract(cdoor, 'Abrir la cabaña', () => {
    if (!PLAYER.hasKey) { AUD.burst({ type: 'brown', f: 300, dur: 0.2, vol: 0.6 }); subtitle('Un candado oxidado. Necesito una llave.', 3); return; }
    removeInteract(cdoor); AUD.creak(AUD.at(cbx, 1, cbz - cd / 2), 0.3, 1.5); let t = 0; const pivot = cbx - 0.5;
    W.updaters.push((dt) => { if (t >= 1) return; t = Math.min(1, t + dt / 1.5); const a = -smooth(t) * 1.6; cdoor.rotation.y = a; cdoor.position.x = pivot + Math.cos(a) * 0.5; cdoor.position.z = cbz - cd / 2 - Math.sin(-a) * 0.5; if (t >= 1) { cdoor.userData.col.on = false; } });
  });
  F.table(cbx - 1.2, cbz + 1.2, 0, 1.2, 0.7, 0.78); F.chair(cbx - 1.2, cbz + 0.5, 0); F.bed(cbx + 1.4, cbz + 0.6, Math.PI / 2, M.fabricGreen);
  F.candle(cbx - 1.6, 0.79, cbz + 1.35, true, true);
  W.secretSpecial = { pos: V3(cbx - 1.0, 0.79, cbz + 1.2), name: 'Cámara Polaroid', key: 'camera' }; placeSpecial();
  addNote('r3', cbx - 1.3, 0.79, cbz + 1.0, -0.4);
  // espantapájaros con la llave
  const scx = -30, scz = 25, scare = new THREE.Group();
  part(scare, new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), M.darkWood, 0, 1.2, 0); part(scare, new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), M.darkWood, 0, 1.8, 0, 0, 0, Math.PI / 2);
  part(scare, lumpy(new THREE.CylinderGeometry(0.25, 0.32, 0.8, 10), 0.04), M.fabricBlue, 0, 1.6, 0); const sh = part(scare, lumpy(new THREE.SphereGeometry(0.22, 12, 10), 0.03), M.cardboard, 0, 2.25, 0);
  part(scare, new THREE.ConeGeometry(0.35, 0.4, 10), M.cardboard, 0, 2.55, 0);
  const smile = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), new THREE.MeshBasicMaterial({ map: textTex(['ò  ó', '\\___/'], { w: 128, h: 96, fg: '#111', font: '30px monospace' }), transparent: true })); smile.position.set(0, 2.25, 0.21); scare.add(smile);
  const key = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 12), new THREE.MeshStandardMaterial({ color: 0xb08a3a, metalness: 1, roughness: 0.4 })); key.position.set(0.5, 1.7, 0.08); scare.add(key);
  place(scare, scx, scz, 0.4, 0.4, 0.4, 2.4); addInteract(key, 'Coger llave', () => { PLAYER.hasKey = true; AUD.pickup(); key.visible = false; removeInteract(key); notify('Llave oxidada', 'Abre algo en el bosque'); scare.rotation.y += Math.PI; AUD.creak(AUD.at(scx, 2, scz), 0.2, 0.6); });
  // coche abandonado
  const car = new THREE.Group(), cm = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.6, metalness: 0.5, map: TEX.rust.map });
  pbox(car, 1.8, 0.7, 4.2, cm, 0, 0.35, 0, 0); pbox(car, 1.6, 0.6, 2.0, cm, 0, 1.05, -0.3, 0); pbox(car, 1.62, 0.5, 1.9, M.glassDark, 0, 1.08, -0.3, 0);
  for (const sx of [-0.9, 0.9]) for (const sz of [-1.3, 1.3]) part(car, new THREE.CylinderGeometry(0.35, 0.35, 0.25, 14), M.black, sx, 0.3, sz, 0, 0, Math.PI / 2);
  const hlm = new THREE.MeshBasicMaterial({ color: 0xfff0c0 }); for (const sx of [-0.6, 0.6]) part(car, new THREE.CircleGeometry(0.12, 12), hlm, sx, 0.65, 2.11);
  place(car, -40, -35, 0.7, 1.9, 4.3, 1.4); car.rotation.z = 0.06;
  const head = new THREE.SpotLight(0xfff0c0, 25, 30, 0.5, 0.6, 1.5); head.position.set(-40 + Math.sin(0.7) * 2.2, 0.7, -35 + Math.cos(0.7) * 2.2); head.target.position.set(-40 + Math.sin(0.7) * 12, 0, -35 + Math.cos(0.7) * 12); sc.add(head, head.target);
  W.updaters.push((dt, t) => { const f = Math.random() < 0.06 ? 0 : Math.random() < 0.1 ? 0.3 : 1; head.intensity = 25 * f; hlm.color.setScalar(0.2 + f * 0.8); });
  W.carPos = V3(-40, 1, -35);
  // columpio
  const swing = new THREE.Group(); swing.position.set(20, 4.2, 30); sc.add(swing); swing.userData.dynamic = true;
  for (const s of [-0.25, 0.25]) part(swing, new THREE.CylinderGeometry(0.008, 0.008, 3.6, 4), M.cardboard, s, -1.8, 0);
  pbox(swing, 0.6, 0.04, 0.22, M.lightWood, 0, -3.62, 0, 0);
  const bough = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 4, 8), M.bark); bough.rotation.z = Math.PI / 2; bough.position.set(20.5, 4.25, 30); sc.add(bough);
  const sTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 9, 9), M.bark); sTrunk.position.set(22.6, 4.3, 30); sc.add(sTrunk); W.circles.push({ x: 22.6, z: 30, r: 0.4 });
  W.swingAmp = 0.05; W.updaters.push((dt, t) => { W.swingAmp = Math.max(0.05, W.swingAmp - dt * 0.03); swing.rotation.x = Math.sin(t * 1.6) * W.swingAmp; });
  // montón de cabezas, tumba, pozo, postes
  F.headPile(-10, -45, 7);
  const grave = new THREE.Group(); pbox(grave, 0.7, 1.0, 0.18, M.concrete, 0, 0, 0, 0.6); part(grave, new THREE.CylinderGeometry(0.35, 0.35, 0.18, 16, 1, false, 0, Math.PI), M.concrete, 0, 1.0, 0, Math.PI / 2, 0, Math.PI / 2); pbox(grave, 0.8, 0.12, 1.8, M.ground, 0, 0, 1.0, 1);
  for (let i = 0; i < 6; i++) part(grave, new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshStandardMaterial({ color: pick([0x8a1a2a, 0xd8d0b0, 0x6a2a6a]) }), rand(-0.3, 0.3), 0.15, 0.5 + rand(-0.2, 0.3));
  place(grave, 45, 40, Math.PI * 1.2, 0.8, 0.3, 1.2); addNote('r2', 45 + rand(-0.4, 0.4), 0.13, 40 + 0.9, 0.5);
  const well = new THREE.Group(); part(well, lumpy(new THREE.CylinderGeometry(1.0, 1.05, 0.9, 16, 1, true), 0.04), M.brick, 0, 0.45, 0).material = M.brick; part(well, new THREE.CircleGeometry(0.95, 16), M.black, 0, 0.6, 0, -Math.PI / 2); for (const s of [-1, 1]) part(well, new THREE.CylinderGeometry(0.06, 0.06, 1.8, 6), M.darkWood, s * 0.9, 1.2, 0); part(well, new THREE.CylinderGeometry(0.05, 0.05, 1.9, 6), M.darkWood, 0, 2.0, 0, 0, 0, Math.PI / 2); place(well, -45, 5, 0, 2.1, 2.1, 1.0);
  W.wellPos = V3(-45, 0.5, 5);
  for (let i = 0; i < 8; i++) { const x = -60 + i * 17, z = 55 - i * 3; const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 9, 8), M.darkWood); p.position.set(x, 4.5, z); p.castShadow = true; sc.add(p); const cr = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.1), M.darkWood); cr.position.set(x, 8.4, z); sc.add(cr); W.circles.push({ x, z, r: 0.2 }); }
  // dibujos en árboles
  const cands = shuffle(trees.filter((t) => t.type !== 'pine' && Math.max(Math.abs(t.x), Math.abs(t.z)) < R - 8 && Math.hypot(t.x, t.z) > 8));
  const chosen = []; for (const t of cands) { if (chosen.length >= 10) break; if (chosen.every((c) => Math.hypot(c.x - t.x, c.z - t.z) > 16)) chosen.push(t); }
  for (const t of cands) { if (chosen.length >= 10) break; if (!chosen.includes(t) && chosen.every((c) => Math.hypot(c.x - t.x, c.z - t.z) > 8)) chosen.push(t); }
  chosen.forEach((t, i) => {
    const a = Math.atan2(-t.x, -t.z) + rand(-0.8, 0.8), rr = t.r * 1.3 + 0.12;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.56), new THREE.MeshStandardMaterial({ map: paperDrawing(i), roughness: 0.95, side: THREE.DoubleSide }));
    m.position.set(t.x + Math.sin(a) * rr, 1.55, t.z + Math.cos(a) * rr); m.rotation.y = a; m.rotation.z = rand(-0.12, 0.12); sc.add(m);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 4), new THREE.MeshStandardMaterial({ color: 0xaa1010 })); pin.position.set(0, 0.24, 0.01); m.add(pin);
    const it = { name: 'Dibujo ' + (i + 1), g: m, got: false };
    addInteract(m, 'Coger dibujo', () => collectItem(it), 2.6); W.items.push(it);
  });
  W.itemNames = null;
  W.spawn = { pos: V3(0, 0, 3.5), yaw: 0 };
  W.enemySpawn = V3(rand(-1, 1) > 0 ? 40 : -40, 0, -40);
  W.tool = 'flashlight'; W.drain = 0.3;
  W.ambience = () => { AUD.rain(0.65, 0); AUD.wind(0.35); AUD.drone(0.1, 49); };
  W.eventPool = [
    () => { AUD.owl(AUD.at(PLAYER.pos.x + rand(-20, 20), 8, PLAYER.pos.z + rand(-20, 20))); },
    () => { const a = PLAYER.yaw + Math.PI + rand(-0.5, 0.5); AUD.snap(AUD.at(PLAYER.pos.x - Math.sin(a) * -4, 0.2, PLAYER.pos.z - Math.cos(a) * -4)); },
    () => { W.swingAmp = 0.7; AUD.creak(AUD.at(20, 3, 30), 0.25, 4); },
    () => { forestWatcher(); },
    () => { forestRunner(); },
    () => { AUD.whisper(AUD.at(PLAYER.pos.x + rand(-3, 3), 1.6, PLAYER.pos.z + rand(-3, 3)), 0.28); },
    () => { AUD.tone({ f: 400, type: 'square', dur: 0.9, vol: 0.08, dest: AUD.at(W.carPos.x, 1, W.carPos.z, 8) }); },
    () => { AUD.laugh(AUD.at(W.wellPos.x, 0, W.wellPos.z), 0.3); },
    () => { AUD.growl(AUD.at(PLAYER.pos.x + rand(-30, 30), 1, PLAYER.pos.z + rand(-30, 30)), 0.4, 2, 0.7); },
  ];
}

/* =====================================================================
   OBJETO ESPECIAL (zona secreta)
   ===================================================================== */
const SPECIALS = {
  musicbox: { name: 'Caja de música', uses: 1, desc: 'Teddy se queda quieto escuchando durante 8 s.' },
  adrenaline: { name: 'Adrenalina', uses: 1, desc: 'Resistencia infinita y más velocidad durante 10 s.' },
  flare: { name: 'Bengala', uses: 1, desc: 'Aturde a Redtail 8 s sin aumentar su ira.' },
  camera: { name: 'Cámara Polaroid', uses: 3, desc: 'Deslumbra a Mamá Peep 6 s sin enfurecerla.' },
};
function placeSpecial() {
  const S = W.secretSpecial; const g = new THREE.Group();
  if (S.key === 'musicbox') { pbox(g, 0.22, 0.12, 0.16, new THREE.MeshStandardMaterial({ color: 0x6a1a3a, roughness: 0.4 }), 0, 0, 0, 0); const b = part(g, new THREE.SphereGeometry(0.05, 10, 8), solidFur('furBear'), 0, 0.17, 0); }
  if (S.key === 'adrenaline') { part(g, new THREE.CylinderGeometry(0.015, 0.015, 0.16, 8), new THREE.MeshStandardMaterial({ color: 0xccddee, transparent: true, opacity: 0.7, roughness: 0.1 }), 0, 0.02, 0, 0, 0, Math.PI / 2); part(g, new THREE.CylinderGeometry(0.002, 0.002, 0.06, 4), M.chrome, 0.11, 0.02, 0, 0, 0, Math.PI / 2); }
  if (S.key === 'flare') { part(g, new THREE.CylinderGeometry(0.025, 0.025, 0.25, 10), new THREE.MeshStandardMaterial({ color: 0xc01010, roughness: 0.5 }), 0, 0.025, 0, 0, 0, Math.PI / 2); }
  if (S.key === 'camera') { pbox(g, 0.16, 0.12, 0.12, new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.5 }), 0, 0, 0, 0); part(g, new THREE.CylinderGeometry(0.04, 0.04, 0.03, 14), M.black, 0, 0.06, 0.07, Math.PI / 2); }
  g.position.copy(S.pos); W.scene.add(g); g.traverse((o) => o.isMesh && (o.castShadow = true));
  const glint = eyeGlow(0xffe08a, 0.3); glint.position.y = 0.12; g.add(glint);
  addInteract(g, 'Coger ' + S.name.toLowerCase(), () => { PLAYER.special = S.key; PLAYER.specialUses = SPECIALS[S.key].uses; AUD.pickup(); AUD.stinger(0.2); g.parent.remove(g); removeInteract(g); notify('Objeto especial: ' + S.name, SPECIALS[S.key].desc + ' [Q]'); updateHUD(true); if (!SAVE.seen.includes('sp_' + S.key)) { SAVE.seen.push('sp_' + S.key); persist(); } });
}
