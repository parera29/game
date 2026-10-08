
/* =====================================================================
   MENÚ PRINCIPAL (escena 3D: el animatrónico espera en la puerta)
   ===================================================================== */
const MENU = { W: null, models: {}, cur: null, bulb: null, mx: 0, my: 0, clicks: 0, swapT: 0 };
function buildMenuScene() {
  W = newWorld(); MENU.W = W; const sc = W.scene;
  sc.background = new THREE.Color(0); sc.fog = new THREE.FogExp2(0x000000, 0.08);
  makeSky(sc);
  levelLights({ hemi: 0.03, moon: 0.03, moonDir: [-1, 0.5, 0.3], center: [0, 1, 0], extent: 8, lightningGain: 10 });
  const H = 2.7;
  // habitación del jugador (z 0..5) y pasillo oscuro detrás de la puerta (z -5..-2)
  wall('x', -2, -3, 3, H, M.wallpaper2, M.wallpaper, [{ c: 0, w: 1.15, y0: 0, y1: 2.25 }]);
  wall('z', -3, -2, 6, H, M.siding, M.wallpaper, [{ c: 1.6, w: 1.2, y0: 0.9, y1: 2.15 }]);
  wall('z', 3, -2, 6, H, M.wallpaper, M.siding);
  wall('z', -1.4, -6, -2, H, M.siding, M.wallpaper2); wall('z', 1.4, -6, -2, H, M.wallpaper2, M.siding); wall('x', -6, -1.4, 1.4, H, M.siding, M.wallpaper2);
  floorPlane(-3, -2, 3, 6, M.wood, 0, 2.2); floorPlane(-1.4, -6, 1.4, -2, M.wood, 0, 2.2); floorPlane(-3.2, -6.2, 3.2, 6.2, M.plaster, H, 3, true);
  floorPlane(-30, -30, 30, 30, M.grass, -0.02, 4);
  const trees = []; for (let i = 0; i < 18; i++) trees.push({ x: rand(-25, -6), z: rand(-15, 18), h: rand(7, 12), r: 0.25, type: pick(['leaf', 'dead', 'pine']) });
  buildForest(trees, { leafCards: 120, pineCards: 50 });
  addWindow('z', -3, 1.6, 1.2, 0.9, 2.15, { outsideSign: -1 });
  W.rain = makeRain(sc, 3000, 30, [-3, -6.2, 3.2, 6.2]);
  F.armchair(2.2, 3.2, -Math.PI * 0.7); F.table(2.3, 1.6, 0, 0.5, 0.5, 0.6); F.candle(2.3, 0.6, 1.6, true, true);
  F.frame(2.92, 2.0, 0.6, -Math.PI / 2, portrait(0), 0.4, 0.5, 0.05); F.frame(-2.0, 2.05, -1.9, 0, portrait(2), 0.4, 0.5, -0.07);
  F.frame(1.6, 1.95, -1.9, 0, portrait(1), 0.5, 0.4);
  F.cobweb(-2.9, 2.6, -1.9, Math.PI / 4, 0.9); F.cobweb(1.3, 2.6, -5.9, -Math.PI / 4, 0.7);
  F.boxes(-2.4, 4.6, 3, 0.6); F.bookshelf(-1.0, -5.75, 0, 1.2, 2.0); F.chair(-2.3, 0.0, 0.9, true);
  // bombilla que cuelga sobre el animatrónico
  const bulb = new THREE.Group(); bulb.position.set(0, H, -2.25); sc.add(bulb); bulb.userData.dynamic = true;
  part(bulb, new THREE.CylinderGeometry(0.004, 0.004, 0.6, 4), M.black, 0, -0.3, 0);
  const bm = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffc070, emissiveIntensity: 2 }); part(bulb, new THREE.SphereGeometry(0.05, 10, 8), bm, 0, -0.64, 0);
  const bl = new THREE.PointLight(0xffb060, 7, 7, 1.5); bl.position.y = -0.7; bl.castShadow = true; bl.shadow.mapSize.set(512, 512); bl.shadow.bias = -0.002; bulb.add(bl);
  MENU.bulb = { g: bulb, l: bl, m: bm, off: 0 };
  const fill = new THREE.PointLight(0x5a6a9a, 0.9, 8, 2); fill.position.set(0, 1.8, 3.5); sc.add(fill);
  const rim = new THREE.PointLight(0xff3020, 2.5, 5, 2); rim.position.set(0, 1.2, -5.2); sc.add(rim);
  for (const k of ['bear', 'rabbit', 'fox', 'chick']) { const A = buildAnimatronic(k); A.root.position.set(0, 0, -2.9); A.root.visible = false; sc.add(A.root); MENU.models[k] = A; }
  sc.add(camera);
  mergeStatic(sc);
  LIGHTNING.onStrike = null;
}
function selectLevel(i, silent = false) {
  G.menuSel = i; const lv = LEVELS[i];
  [...$('levelList').children].forEach((el, k) => el.classList.toggle('sel', k === i));
  const best = SAVE.best[lv.id];
  $('lvlInfo').innerHTML = `<b>${SPECS[lv.anim].name}</b> · ${SPECS[lv.anim].title}<br>Objetivo: ${lv.items} ${i === 3 ? 'dibujos' : 'objetos'} · Límite ${Math.floor(lv.time / 60)}:00<br>Mejor tiempo: ${best ? fmtTime(best) : '--:--'}`;
  $('animName').querySelector('.n').textContent = SPECS[lv.anim].name; $('animName').querySelector('.s').textContent = lv.name;
  if (!silent) { AUD.uiSelect(); staticFX(0.35, 220); AUD.staticNoise(0.2, 0.12); MENU.bulb.off = 0.35; MENU.swapT = 0.18; MENU.pending = lv.anim; $('title').classList.remove('glitch'); void $('title').offsetWidth; $('title').classList.add('glitch'); }
  else showMenuModel(lv.anim);
}
function showMenuModel(k) { Object.values(MENU.models).forEach((A) => (A.root.visible = false)); MENU.cur = MENU.models[k]; MENU.cur.root.visible = true; MENU.cur.root.rotation.y = 0; if (k === 'fox') MENU.cur.setEyes(0xffc22a); }
function updateMenu(dt) {
  W.updaters.forEach((f) => f(dt, U_TIME.value));
  if (MENU.swapT > 0) { MENU.swapT -= dt; if (MENU.swapT <= 0 && MENU.pending) { showMenuModel(MENU.pending); MENU.pending = null; } }
  const B = MENU.bulb; B.g.rotation.z = Math.sin(U_TIME.value * 0.7) * 0.06; B.g.rotation.x = Math.cos(U_TIME.value * 0.5) * 0.04;
  let f = 1; if (B.off > 0) { B.off -= dt; f = 0; } else if (Math.random() < dt * 0.4) B.off = rand(0.05, 0.2); else f = 0.9 + Math.random() * 0.1;
  B.l.intensity = 7 * f; B.m.emissiveIntensity = 2 * f;
  if (MENU.cur) {
    const A = MENU.cur; A.root.position.z = -2.9 + Math.sin(U_TIME.value * 0.3) * 0.03;
    animateModel(A, dt, { speed: 0, pose: 'idle', look: camera.position, eyeI: f > 0 ? 4 : 6, glow: f > 0 ? 0.6 : 1, servo: () => Math.random() < 0.3 && AUD.servo(null, 0.03, 0.4) });
  }
  const t = U_TIME.value;
  camera.position.set(Math.sin(t * 0.17) * 0.12 + MENU.mx * 0.25, 1.62 + Math.sin(t * 0.23) * 0.03 - MENU.my * 0.1, 3.4);
  camera.lookAt(MENU.mx * 0.6 + 0.4, 1.35 - MENU.my * 0.3, -2.9);
  if (W.rain) W.rain.material.uniforms.uC.value.set(-6, 1, 0);
  FX.aberr.value = 0.3; FX.vignette.value = 0.95; FX.grain.value = 0.085; FX.distort.value = MENU.swapT > 0 ? 0.6 : 0;
  AUD.setListener(camera);
}
function menuClick(event) {
  if (!MENU.cur) return; ray.setFromCamera({ x: (event.clientX / innerWidth) * 2 - 1, y: -(event.clientY / innerHeight) * 2 + 1 }, camera);
  if (ray.intersectObject(MENU.cur.root, true).length) {
    MENU.clicks++; AUD.servo(null, 0.08, 0.3);
    if (MENU.clicks >= 5) { MENU.clicks = 0; const A = MENU.cur; const z0 = A.root.position.z; AUD.scream(A.spec.scream); FX.redTint.value = 0.3; let t = 0; const id = setInterval(() => { t += 0.03; A.root.position.z = lerp(z0, 2.2, Math.min(1, t * 6)); animateModel(A, 0.03, { pose: 'scare', jaw: 1, shake: 1.5 }); if (t > 0.9) { clearInterval(id); A.root.position.z = z0; FX.redTint.value = 0; staticFX(0.8, 300); if (!SAVE.seen.includes('egg_menu')) { SAVE.seen.push('egg_menu'); persist(); } } }, 30); }
  }
}
function showMenu() {
  W = MENU.W; renderPass.scene = W.scene; W.scene.add(camera); camera.fov = 60; camera.updateProjectionMatrix();
  LIGHTNING.enabled = true; LIGHTNING.reset();
  HUD.classList.add('hidden'); $('menu').classList.remove('hidden');
  AUD.stopAllLoops(); AUD.rain(0.4, 1); AUD.musicBox(0.13); AUD.drone(0.07, 41);
  selectLevel(G.menuSel, true); G.state = 'menu';
  FX.redTint.value = 0; FX.blackout.value = 0; FX.flash.value = 0;
}
function hideMenu() { $('menu').classList.add('hidden'); AUD.stopLoop('musicbox'); }
async function toMenu() {
  G.state = 'loading'; fade(1); await sleep(600);
  if (document.pointerLockElement) { G.ignoreUnlock = true; document.exitPointerLock(); }
  if (W && W !== MENU.W) { disposeWorld(W); }
  ENEMY = null; showMenu(); fade(0);
}
/* --- lista de niveles --- */
function buildLevelList() {
  const L = $('levelList'); L.innerHTML = '';
  LEVELS.forEach((lv, i) => {
    const d = document.createElement('div'); d.className = 'lvl';
    d.innerHTML = `<span class="num">0${i + 1}</span><span>${lv.name}<br><span class="sub">${lv.en}</span></span><span class="chk">${SAVE.done[lv.id] ? '✓ ' + fmtTime(SAVE.best[lv.id] || 0) : ''}</span>`;
    d.onmouseenter = () => AUD.uiHover(); d.onclick = () => { if (G.menuSel !== i) selectLevel(i); };
    d.ondblclick = () => startLevel(i);
    L.appendChild(d);
  });
}
$('btnPlay').onclick = () => startLevel(G.menuSel);
document.querySelectorAll('.mbtn').forEach((b) => b.addEventListener('mouseenter', () => AUD.uiHover()));
function openPanel(id) { $(id).classList.remove('hidden'); if (G.state === 'menu') G.state = 'menuPanel'; AUD.uiSelect(); }
function closePanel(id) { $(id).classList.add('hidden'); if (G.state === 'menuPanel' && !document.querySelector('.panel:not(.hidden)')) G.state = 'menu'; }
document.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => closePanel(b.dataset.close)));
$('btnDocs').onclick = () => openPanel('spoiler');
$('spBack').onclick = () => closePanel('spoiler');
$('spGo').onclick = () => { $('spoiler').classList.add('hidden'); openPanel('docs'); docTab(0); };
$('btnExtras').onclick = () => { renderExtras(); openPanel('extras'); };
$('btnOpts').onclick = () => openPanel('opts');

/* --- DOCUMENTACIÓN --- */
const DOCS = [
  { t: 'General', h: `
    <h4>Controles</h4>
    <ul><li><span class="k">W A S D</span> moverse · <span class="k">SHIFT</span> correr (gasta resistencia) · <span class="k">C</span> agacharse</li>
    <li><span class="k">F</span> linterna / mechero · <span class="k">E</span> interactuar · <span class="k">Q</span> usar objeto especial · <span class="k">ESC</span> pausa</li></ul>
    <h4>Cómo se juega</h4>
    <p>Cada nivel tiene un objetivo: encontrar objetos (o dibujos en el Bosque) repartidos al azar por el mapa. Los objetos que buscas aparecen en la lista inferior izquierda y cambian en cada partida.</p>
    <p>Cada nivel tiene un <b>tiempo límite</b>. Si se agota no mueres, pero el animatrónico <b>empieza a cazarte</b>: sabe siempre dónde estás y es más rápido.</p>
    <p>La <b>resistencia</b> se agota al correr. Si llega a cero no podrás volver a correr hasta recuperar un tercio. Agacharte hace menos ruido y te hace menos visible.</p>
    <p>La batería de la linterna se agota. Si queda poca, parpadea. También parpadea cuando un animatrónico está muy cerca.</p>
    <h4>HUD</h4>
    <ul><li>Arriba a la izquierda: nivel y contador de objetos.</li><li>Arriba a la derecha: tiempo restante.</li><li>Abajo a la derecha: batería y objeto especial.</li><li>Abajo, en el centro: resistencia (solo aparece al gastarla).</li><li>Los bordes rojos y el latido indican que hay peligro cerca.</li></ul>
    <h4>Extras</h4><p>Cada nivel esconde notas de lore, una zona secreta con un <b>objeto especial</b> y algún easter egg.</p>` },
  { t: '1 · Primer piso', h: `
    <h4>TEDDY · El Anfitrión</h4>
    <p>Un oso quemado al que le falta la mitad de la cara. Patrulla la casa: salón, pasillo, cocina, dormitorio y baño.</p>
    <ul><li><b>Objetivo:</b> 5 objetos al azar entre 15 escondites posibles.</li>
    <li><b>Visión:</b> te ve en un cono frontal. Agacharte reduce mucho la distancia a la que te detecta.</li>
    <li><b>Linterna:</b> si le apuntas con ella <b>empieza a perseguirte de inmediato</b>. Úsala solo cuando no esté cerca.</li>
    <li><b>Oído:</b> si corres cerca de él, irá a mirar dónde estabas.</li>
    <li>Si te pierde de vista durante unos segundos, busca en tu última posición y luego vuelve a patrullar.</li>
    <li>Ojos blanco-azulados y pasos metálicos pesados. Gruñe al perseguirte.</li></ul>` },
  { t: '2 · Sótano', h: `
    <h4>HOPPER · El Sin Rostro</h4>
    <p>Un conejo sin placa facial: solo endoesqueleto y dos pupilas rojas.</p>
    <ul><li><b>Objetivo:</b> 5 piezas en un laberinto de hormigón.</li>
    <li><b>Mechero:</b> aquí no hay linterna. El mechero alumbra a tu alrededor, pero te hace <b>más visible</b>. El gas se gasta; hay latas de recambio repartidas por el sótano.</li>
    <li><b>Faroles rojos:</b> se confunden con sus ojos. Si las luces rojas se <b>balancean arriba y abajo</b>, es él caminando.</li>
    <li><b>Vapor:</b> las tuberías sueltan vapor a intervalos. El vapor <b>bloquea su visión</b> (y la tuya).</li>
    <li><b>Escucha:</b> a veces se queda quieto con los ojos apagados, escuchando. Es el momento más peligroso: no lo verás venir.</li></ul>` },
  { t: '3 · Ático', h: `
    <h4>REDTAIL · El Capitán</h4>
    <p>Un zorro esquelético con la mandíbula desencajada y un garfio.</p>
    <ul><li><b>Objetivo:</b> 5 objetos entre cajas, sábanas y vigas.</li>
    <li><b>Inicio:</b> aparece justo delante de ti, a oscuras. Si enciendes la linterna nada más empezar, lo aturdirás, pero <b>ya llevará una carga de ira</b>.</li>
    <li><b>Aturdir:</b> si lo mantienes en el haz de luz a menos de 11 m, se tapa la cara y queda aturdido unos 4 s.</li>
    <li><b>Ira:</b> cada aturdimiento suma ira. A la <b>tercera vez</b> sus ojos se vuelven rojos y corre a casi el doble de velocidad: prácticamente una muerte segura. La ira baja con el tiempo (un nivel cada 45 s).</li>
    <li>La linterna gasta mucha batería aquí. Hay pilas escondidas.</li></ul>` },
  { t: '4 · Bosque', h: `
    <h4>MAMÁ PEEP · La Que Espera</h4>
    <p>Una pollita gigante con varias filas de dientes y una magdalena que te observa.</p>
    <ul><li><b>Objetivo:</b> 10 dibujos clavados en los árboles. Límite de 5 minutos; después te caza sin descanso.</li>
    <li><b>Mirarla la congela:</b> mientras está en tu campo de visión no se mueve.</li>
    <li><b>Pero no la mires demasiado:</b> si la miras más de unos 2,5 s seguidos, chilla y <b>corre hacia ti</b>. Mírala en ráfagas cortas.</li>
    <li>A oscuras solo la "ves" de cerca. La linterna y los relámpagos amplían la distancia.</li>
    <li>Cada dibujo que recoges la hace un poco más rápida. Si te alejas demasiado, aparece detrás de ti.</li></ul>` },
  { t: 'Secretos', h: `
    <p class="secretHint">Haz clic sobre cada bloque para revelarlo.</p>
    <div class="secret"><h4>Primer piso · Estudio oculto</h4><p>En el dormitorio, una agenda indica el orden de los interruptores. Abre el cuadro eléctrico del pasillo y súbelos en ese orden: la estantería del salón se desliza y aparece el estudio del ingeniero. Dentro: <b>Caja de música</b> (Q: Teddy se queda quieto 8 s), la nota final y un <b>osito dorado</b>.</p></div>
    <div class="secret"><h4>Sótano · Cuarto de herramientas</h4><p>Hay cuatro números escritos con tiza (I, II, III, IV) en las paredes. Introduce el código en el teclado de la puerta metálica del oeste. Dentro: <b>Adrenalina</b> (Q: resistencia infinita y más velocidad durante 10 s) y un <b>conejito</b> muy raro.</p></div>
    <div class="secret"><h4>Ático · Hueco tras las velas</h4><p>Coge las cerillas junto a la ventana redonda del oeste y enciende las <b>3 velas</b> del ático. La pared del sureste se hunde. Dentro: <b>Bengala</b> (Q: aturde a Redtail 8 s sin sumar ira), la nota y un <b>zorrito</b>.</p></div>
    <div class="secret"><h4>Bosque · La cabaña</h4><p>La llave cuelga del brazo del <b>espantapájaros</b> (al noroeste). La cabaña está al sureste. Dentro: <b>Cámara Polaroid</b> (Q, 3 usos: deslumbra a Mamá Peep 6 s sin enfadarla) y el último diario.</p></div>
    <div class="secret"><h4>Easter eggs</h4><ul><li>Haz clic 5 veces sobre el animatrónico del menú…</li><li>La tele del salón se enciende sola, el teléfono suena, la mecedora se balancea.</li><li>Algo pasa corriendo por fuera de las ventanas durante los relámpagos. A veces alguien te mira desde la valla.</li><li>En el sótano, dos luces rojas aparecen al fondo del pasillo… y no siempre son faroles.</li><li>En el ático, la muñeca gira la cabeza cuando no la miras.</li><li>En el bosque, Teddy te observa a lo lejos entre la niebla, el columpio se mueve solo y del pozo sale una risa.</li></ul></div>` },
];
function docTab(i) {
  const T = $('docTabs'); T.innerHTML = '';
  DOCS.forEach((d, k) => { const b = document.createElement('button'); b.className = 'tab' + (k === i ? ' on' : ''); b.textContent = d.t; b.onclick = () => { AUD.uiHover(); docTab(k); }; T.appendChild(b); });
  $('docBody').innerHTML = DOCS[i].h; $('docBody').querySelectorAll('.secret').forEach((s) => (s.onclick = () => s.classList.add('rev')));
}
/* --- EXTRAS --- */
function renderExtras() {
  let h = '<h4>Mejores tiempos</h4>' + LEVELS.map((l) => `<p>${l.name} — ${SAVE.best[l.id] ? fmtTime(SAVE.best[l.id]) : '--:--'} ${SAVE.done[l.id] ? '✓' : ''}</p>`).join('');
  h += `<h4>Notas encontradas (${SAVE.lore.length}/${LORE.length})</h4>`;
  h += LORE.map((l) => SAVE.lore.includes(l.id) ? `<div class="lore-item" data-id="${l.id}">${LEVELS[l.lv].name} · ${l.title}</div>` : `<div class="lore-item locked">${LEVELS[l.lv].name} · ???</div>`).join('');
  h += '<h4>Animatrónicos</h4>' + Object.values(SPECS).map((s) => `<p><b style="color:#eee">${s.name}</b> — ${s.title}</p>`).join('');
  const eggs = SAVE.seen.filter((s) => s.startsWith('egg_')).length, sps = SAVE.seen.filter((s) => s.startsWith('sp_')).length;
  h += `<h4>Secretos</h4><p>Objetos especiales encontrados: ${sps} / 4 · Easter eggs: ${eggs}</p>`;
  $('extrasBody').innerHTML = h;
  $('extrasBody').querySelectorAll('.lore-item[data-id]').forEach((el) => (el.onclick = () => { const L = LORE.find((l) => l.id === el.dataset.id); G.inMenuNote = true; G.state = 'note'; $('paper').querySelector('h5').textContent = L.title; $('paper').querySelector('.txt').innerHTML = L.text.replace('{FUSE}', '· · ·'); $('note').classList.remove('hidden'); }));
}
/* --- OPCIONES --- */
function bindOptions() {
  const map = { oSens: 'sens', oVol: 'vol', oBright: 'bright', oFov: 'fov', oQual: 'quality', oDiff: 'diff', oInv: 'inv' };
  for (const [id, k] of Object.entries(map)) {
    const el = $(id); el.value = SETTINGS[k];
    el.oninput = el.onchange = () => {
      const v = parseFloat(el.value); const prevQ = SETTINGS.quality; SETTINGS[k] = v; persist();
      if (k === 'vol') AUD.setVolume(v); if (k === 'bright') renderer.toneMappingExposure = v; if (k === 'fov' && G.state !== 'menu' && G.state !== 'menuPanel') { camera.fov = v; camera.updateProjectionMatrix(); }
      if (k === 'quality' && v !== prevQ) { renderer.setPixelRatio(Math.min(devicePixelRatio, v >= 2 ? 1.5 : 1)); flashlight.shadow.mapSize.set(v >= 1 ? 1024 : 512, v >= 1 ? 1024 : 512); if (flashlight.shadow.map) { flashlight.shadow.map.dispose(); flashlight.shadow.map = null; } const sc = renderPass.scene; buildComposer(); renderPass.scene = sc; Object.assign(FX, finalPass.uniforms); }
    };
  }
  $('oReset').onclick = () => { const b = $('oReset'); if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = '¿Seguro? Pulsa otra vez'; setTimeout(() => { delete b.dataset.armed; b.textContent = 'Borrar'; }, 3000); return; } delete b.dataset.armed; b.textContent = 'Borrado'; SAVE.best = {}; SAVE.done = {}; SAVE.lore = []; SAVE.seen = []; persist(); buildLevelList(); selectLevel(G.menuSel, true); };
}

/* =====================================================================
   ARRANQUE
   ===================================================================== */
async function boot() {
  const fill = $('loadfill'), txt = $('loadtxt');
  try { await Promise.race([document.fonts.ready, sleep(2500)]); } catch (e) { }
  await generateTextures((p, n) => { fill.style.width = (p * 85).toFixed(0) + '%'; txt.textContent = 'GENERANDO TEXTURAS · ' + n.toUpperCase(); });
  buildMaterials();
  txt.textContent = 'CONSTRUYENDO ESCENARIO…'; await sleep(20);
  buildMenuScene(); renderPass.scene = W.scene;
  fill.style.width = '95%'; txt.textContent = 'COMPILANDO SHADERS…'; await sleep(20);
  showMenuModel('bear'); try { renderer.compile(W.scene, camera); } catch (e) { }
  fill.style.width = '100%'; txt.textContent = 'LISTO';
  buildLevelList(); bindOptions();
  $('clickstart').classList.remove('hidden');
  G.state = 'menuWait';
  requestAnimationFrame(frame);
  const go = () => {
    $('loading').removeEventListener('click', go);
    AUD.init(); AUD.setVolume(SETTINGS.vol);
    $('loading').style.transition = 'opacity 1.2s'; $('loading').style.opacity = 0; setTimeout(() => $('loading').classList.add('hidden'), 1250);
    fade(0); showMenu(); staticFX(0.6, 400); AUD.staticNoise(0.4, 0.2);
  };
  $('loading').addEventListener('click', go);
}
window.__TJOC = { G, PLAYER, startLevel, get W() { return W; }, get ENEMY() { return ENEMY; }, LEVELS, collectItem, startJumpscare };
boot().catch((e) => { console.error(e); $('loadtxt').textContent = 'ERROR: ' + e.message; });
</script>
</body>
</html>
