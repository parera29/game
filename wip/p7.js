
/* =====================================================================
   DEFINICIÓN DE NIVELES
   ===================================================================== */
const LEVELS = [
  { id: 'floor', name: 'PRIMER PISO', en: 'FIRST FLOOR', anim: 'bear', items: 5, time: 240, build: buildHouse,
    intro: 'La casa de papá. Encuentra <b>5 recuerdos</b> antes de que TEDDY te encuentre a ti.<br>No le apuntes con la linterna.' },
  { id: 'basement', name: 'SÓTANO', en: 'BASEMENT', anim: 'rabbit', items: 5, time: 240, build: buildBasement,
    intro: 'Un laberinto de hormigón, vapor y faroles rojos. Encuentra <b>5 piezas</b>.<br>Si ves dos luces rojas que se balancean… corre.' },
  { id: 'attic', name: 'ÁTICO', en: 'ATTIC', anim: 'fox', items: 5, time: 240, build: buildAttic,
    intro: 'REDTAIL odia la luz, pero la recuerda. Encuentra <b>5 objetos</b>.<br>Cada vez que lo deslumbras se enfada más.' },
  { id: 'forest', name: 'BOSQUE', en: 'FOREST', anim: 'chick', items: 10, time: 300, build: buildForestLevel,
    intro: 'Recoge los <b>10 dibujos</b> clavados en los árboles.<br>Ella no se mueve si la miras. Pero no la mires demasiado.' },
];
let LV = null, LVI = 0, ENEMY = null;
const G = { state: 'loading', time: 0, hunt: false, freezeEnemies: 0, menuSel: 0 };

/* =====================================================================
   JUGADOR
   ===================================================================== */
const PLAYER = {
  pos: V3(), yaw: 0, pitch: 0, h: 1.65, crouch: false, stamina: 100, exhausted: false, battery: 100, lightOn: false, matches: 0, hasKey: false,
  special: null, specialUses: 0, adrenT: 0, stepAcc: 0, bob: 0, moving: false, sprinting: false, speedNow: 0, beamOn: 0, shake: 0,
  reset(spawn) { this.pos.copy(spawn.pos); this.yaw = spawn.yaw; this.pitch = 0; this.stamina = 100; this.exhausted = false; this.battery = 100; this.lightOn = false; this.matches = 0; this.hasKey = false; this.special = null; this.specialUses = 0; this.adrenT = 0; this.h = 1.65; this.crouch = false; this.shake = 0; },
  forward(v = V3()) { return camera.getWorldDirection(v); },
  sees(p, thresh = 0.85) {
    const c = camera.position; _v3.subVectors(p, c); const d = _v3.length(); _v3.divideScalar(d);
    if (_v3.dot(camera.getWorldDirection(_v2)) < thresh) return false;
    return losBetween(c, p);
  },
};
function losBetween(a, b) {
  if (W.nav) return W.nav.los(a, b, W.sightExtra || null);
  // bosque: troncos
  const dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz;
  for (const t of W.circles) {
    const tx = t.x - a.x, tz = t.z - a.z; const k = clamp((tx * dx + tz * dz) / L2, 0, 1); if (k < 0.02 || k > 0.98) continue;
    const ex = a.x + dx * k - t.x, ez = a.z + dz * k - t.z; if (ex * ex + ez * ez < t.r * t.r * 0.8) return false;
  }
  return true;
}
const flashlight = new THREE.SpotLight(0xfff1dc, 0, 24, 0.46, 0.6, 1.6);
flashlight.position.set(0.18, -0.12, 0.05); flashlight.castShadow = true; flashlight.shadow.mapSize.set(1024, 1024); flashlight.shadow.camera.near = 0.1; flashlight.shadow.camera.far = 26; flashlight.shadow.bias = -0.0004; flashlight.shadow.normalBias = 0.02;
flashlight.target.position.set(0.05, -0.05, -1); camera.add(flashlight); camera.add(flashlight.target);
const lighterLight = new THREE.PointLight(0xffa04a, 0, 7, 1.8); lighterLight.position.set(0.22, -0.18, -0.35); camera.add(lighterLight);
const lighterFlame = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.03, 8), new THREE.MeshBasicMaterial({ color: 0xff9a30, transparent: true, opacity: 0.85 })); lighterFlame.position.set(0.16, -0.14, -0.32); camera.add(lighterFlame); lighterFlame.visible = false;
const lighterBody = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.015), new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 1, roughness: 0.3 })); lighterBody.position.set(0.16, -0.18, -0.32); camera.add(lighterBody); lighterBody.visible = false;
const flareLight = new THREE.PointLight(0xff2a1a, 0, 14, 1.6); camera.add(flareLight); flareLight.position.set(0, -0.3, -0.4);

const KEYS = {};
addEventListener('keydown', (e) => {
  KEYS[e.code] = true;
  if (G.state === 'play') {
    if (e.code === 'KeyF') toggleLight();
    if (e.code === 'KeyE') interact();
    if (e.code === 'KeyQ') useSpecial();
    if (e.code === 'KeyC' || e.code === 'ControlLeft') PLAYER.crouch = !PLAYER.crouch;
    if (e.code === 'Escape' || e.code === 'KeyP') pauseGame();
  } else if (G.state === 'note' && (e.code === 'KeyE' || e.code === 'Escape')) closeNote();
  else if (G.state === 'pause' && e.code === 'KeyP') resumeGame();
  else if (G.state === 'menu') {
    if (e.code === 'ArrowDown' || e.code === 'KeyS') selectLevel((G.menuSel + 1) % 4);
    if (e.code === 'ArrowUp' || e.code === 'KeyW') selectLevel((G.menuSel + 3) % 4);
    if (e.code === 'Enter') startLevel(G.menuSel);
  }
});
addEventListener('keyup', (e) => { KEYS[e.code] = false; });
function lockPointer() { try { const r = canvas.requestPointerLock && canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { } }
addEventListener('mousemove', (e) => {
  if (G.state === 'play' && (document.pointerLockElement === canvas || (e.buttons & 1))) {
    const s = 0.0021 * SETTINGS.sens; PLAYER.yaw -= e.movementX * s; PLAYER.pitch -= e.movementY * s * (SETTINGS.inv ? -1 : 1); PLAYER.pitch = clamp(PLAYER.pitch, -1.45, 1.45);
  }
  if (G.state === 'menu') { MENU.mx = e.clientX / innerWidth - 0.5; MENU.my = e.clientY / innerHeight - 0.5; }
});
canvas.addEventListener('click', (e) => {
  if (G.state === 'play' && document.pointerLockElement !== canvas) lockPointer();
  if (G.state === 'menu') menuClick(e);
});
document.addEventListener('pointerlockchange', () => { if (document.pointerLockElement !== canvas && G.state === 'play' && !G.ignoreUnlock) pauseGame(); G.ignoreUnlock = false; });

function toggleLight() {
  if (PLAYER.battery <= 0) { AUD.click(); subtitle(W.tool === 'lighter' ? 'Ya no queda gas.' : 'Sin pilas.', 2); return; }
  PLAYER.lightOn = !PLAYER.lightOn;
  if (W.tool === 'lighter') { AUD.burst({ type: 'white', f: 3000, q: 2, dur: 0.05, vol: 0.4 }); if (PLAYER.lightOn) setTimeout(() => AUD.burst({ type: 'pink', f: 700, dur: 0.3, vol: 0.15 }), 60); }
  else AUD.click();
}
function useSpecial() {
  if (!PLAYER.special || PLAYER.specialUses <= 0) return;
  const k = PLAYER.special; PLAYER.specialUses--;
  if (k === 'musicbox') { AUD.musicBox(0.3); setTimeout(() => AUD.stopLoop('musicbox', 2), 8000); if (ENEMY) { ENEMY.freezeT = 8; } notify('La caja de música suena…', 'Teddy escucha'); }
  if (k === 'adrenaline') { PLAYER.adrenT = 10; PLAYER.stamina = 100; PLAYER.exhausted = false; AUD.breath(0.4); AUD.heartbeat(0.7); notify('Adrenalina', '10 segundos'); }
  if (k === 'flare') { flareLight.intensity = 6; G.flareT = 20; AUD.burst({ type: 'white', f: 2500, dur: 1.5, vol: 0.4 }); if (ENEMY && ENEMY.pos.distanceTo(PLAYER.pos) < 15) { ENEMY.stun(8, false); } notify('Bengala encendida', ''); }
  if (k === 'camera') { AUD.camFlash(); setTimeout(() => { FX.flash.value = 1; G.camFlashT = 0.4; if (ENEMY && ENEMY.pos.distanceTo(PLAYER.pos) < 28 && PLAYER.sees(_v1.copy(ENEMY.pos).setY(1.5), 0.55)) ENEMY.stun(6, false); }, 600); }
  updateHUD(true);
}
function updatePlayer(dt) {
  const P = PLAYER;
  const fw = (KEYS.KeyW || KEYS.ArrowUp ? 1 : 0) - (KEYS.KeyS || KEYS.ArrowDown ? 1 : 0), st = (KEYS.KeyD || KEYS.ArrowRight ? 1 : 0) - (KEYS.KeyA || KEYS.ArrowLeft ? 1 : 0);
  const moving = fw !== 0 || st !== 0;
  let wantSprint = (KEYS.ShiftLeft || KEYS.ShiftRight) && moving && fw >= 0 && !P.crouch;
  if (P.exhausted) wantSprint = false;
  if (P.adrenT > 0) { P.adrenT -= dt; P.stamina = 100; }
  if (wantSprint) { P.stamina -= dt * (SETTINGS.diff ? 24 : 19); if (P.stamina <= 0) { P.stamina = 0; P.exhausted = true; AUD.breath(0.35); } }
  else { P.stamina = Math.min(100, P.stamina + dt * (moving ? 10 : 16)); if (P.exhausted && P.stamina > 35) P.exhausted = false; }
  const speed = P.crouch ? 1.3 : wantSprint ? (P.adrenT > 0 ? 6.2 : 4.7) : 2.5;
  P.sprinting = wantSprint; P.moving = moving;
  const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
  let mx = -sy * fw + cy * st, mz = -cy * fw - sy * st; const ml = Math.hypot(mx, mz); if (ml > 0) { mx /= ml; mz /= ml; }
  const old = _v1.copy(P.pos);
  P.pos.x += mx * speed * dt; P.pos.z += mz * speed * dt;
  collidePoint(P.pos, 0.3);
  const moved = Math.hypot(P.pos.x - old.x, P.pos.z - old.z); P.speedNow = moved / Math.max(dt, 1e-4);
  P.h = lerp(P.h, P.crouch ? 1.0 : 1.65, dt * 8);
  P.stepAcc += moved; const stride = wantSprint ? 0.95 : P.crouch ? 0.55 : 0.72;
  if (P.stepAcc > stride) { P.stepAcc = 0; const surf = W.surfaceAt ? W.surfaceAt(P.pos.x, P.pos.z) : W.surface; AUD.footstep(surf, P.crouch ? 0.15 : wantSprint ? 0.55 : 0.32); }
  P.bob += moved * (wantSprint ? 7.5 : 9);
  const bobA = (P.crouch ? 0.02 : wantSprint ? 0.055 : 0.035) * clamp(P.speedNow / 2.5, 0, 1.3);
  P.shake = Math.max(0, P.shake - dt * 2);
  const sh = P.shake * 0.04;
  camera.position.set(P.pos.x + Math.cos(P.bob * 0.5) * bobA * 0.5, P.h + Math.abs(Math.sin(P.bob * 0.5)) * bobA - bobA * 0.5, P.pos.z);
  camera.rotation.set(P.pitch + rand(-sh, sh), P.yaw + rand(-sh, sh), Math.cos(P.bob * 0.5) * bobA * 0.15);
  // fuente de luz
  const drain = (W.drain || 0.4) * (SETTINGS.diff ? 1.3 : 1);
  if (P.lightOn) { P.battery = Math.max(0, P.battery - dt * drain); if (P.battery <= 0) { P.lightOn = false; AUD.click(); subtitle(W.tool === 'lighter' ? 'Se acabó el gas…' : 'La linterna ha muerto.', 2.5); } }
  const near = ENEMY ? ENEMY.pos.distanceTo(P.pos) : 99;
  let flick = 1; if (P.battery < 15 && Math.random() < 0.08) flick = rand(0, 0.5); if (near < 6 && Math.random() < 0.06 * (6 - near)) flick = rand(0, 0.3);
  if (W.tool === 'lighter') {
    flashlight.intensity = 0; lighterFlame.visible = lighterBody.visible = P.lightOn;
    lighterLight.intensity = P.lightOn ? (1.6 + Math.sin(G.time * 17) * 0.15 + Math.random() * 0.2) * flick : 0; lighterFlame.scale.y = 0.8 + Math.random() * 0.4;
  } else { lighterLight.intensity = 0; lighterFlame.visible = lighterBody.visible = false; flashlight.intensity = P.lightOn ? 16 * (0.55 + 0.45 * Math.min(1, P.battery / 30)) * flick : 0; }
  if (G.flareT > 0) { G.flareT -= dt; flareLight.intensity = 5 + Math.random() * 1.5; if (G.flareT <= 0) flareLight.intensity = 0; }
}
function beamHits(p, maxD = 14, cosA = 0.93) {
  if (!PLAYER.lightOn || W.tool === 'lighter') return false;
  const c = camera.position; _v3.subVectors(p, c); const d = _v3.length(); if (d > maxD) return false; _v3.divideScalar(d);
  if (_v3.dot(camera.getWorldDirection(_v2)) < cosA) return false;
  return losBetween(c, p);
}

/* =====================================================================
   ANIMATRÓNICO (IA)
   ===================================================================== */
const ECFG = {
  bear: { walk: 1.45, chase: 3.35, sight: 15, fov: 0.35, hear: 9, lose: 5 },
  rabbit: { walk: 1.55, chase: 3.55, sight: 12, fov: 0.4, hear: 11, lose: 4 },
  fox: { walk: 2.0, chase: 4.25, sight: 13, fov: 0.3, hear: 8, lose: 4 },
  chick: { walk: 1.25, chase: 7.4, sight: 40, fov: 0, hear: 0, lose: 0 },
};
class Enemy {
  constructor(kind, pos) {
    this.kind = kind; this.A = buildAnimatronic(kind); this.cfg = ECFG[kind]; W.scene.add(this.A.root);
    this.pos = pos.clone(); this.yaw = 0; this.state = 'patrol'; this.path = null; this.repath = 0; this.lost = 0; this.last = V3(); this.speed = 0;
    this.stunT = 0; this.stunCD = 0; this.beamT = 0; this.anger = 0; this.angerDecay = 0; this.freezeT = 0; this.listenT = 0; this.searchT = 0; this.grace = 3.5;
    this.dormant = kind === 'fox' ? 5 : 0; this.observedT = 0; this.rageT = 0; this.tpCD = 10; this.stepD = 0; this.growlT = rand(4, 9);
    this.panner = AUD.ready ? AUD.panner(pos.x, 1.5, pos.z, 2.5, 1.2) : null;
    this.yaw = Math.atan2(PLAYER.pos.x - pos.x, PLAYER.pos.z - pos.z);
    if (kind === 'fox') { this.yaw = Math.atan2(PLAYER.pos.x - pos.x, PLAYER.pos.z - pos.z); }
    this.diff = SETTINGS.diff ? 1.15 : 1;
    this.sync(0);
  }
  get eye() { return _v1.set(this.pos.x, 1.7, this.pos.z); }
  chest() { return V3(this.pos.x, 1.4, this.pos.z); }
  canSee() {
    const P = PLAYER, dx = P.pos.x - this.pos.x, dz = P.pos.z - this.pos.z, d = Math.hypot(dx, dz);
    let range = this.cfg.sight * (P.crouch ? 0.6 : 1) * (P.lightOn ? (W.tool === 'lighter' ? 1.5 : 1.3) : 1) * (this.anger >= 3 ? 1.8 : 1);
    if (d > range) return false;
    const fd = (dx * Math.sin(this.yaw) + dz * Math.cos(this.yaw)) / Math.max(d, 1e-3);
    if (fd < this.cfg.fov && d > 2.2) return false;
    return losBetween(V3(this.pos.x, 1.6, this.pos.z), V3(P.pos.x, P.h, P.pos.z));
  }
  stun(t, anger = true) {
    this.stunT = t; this.state = 'stun'; this.dormant = 0; this.rageT = 0; this.observedT = 0;
    if (anger && this.kind === 'fox') { this.anger++; this.angerDecay = 45; if (this.anger >= 3) { this.A.setEyes(0xff1500, 6); AUD.growl(this.panner, 0.7, 1.6, 1.3); subtitle('Sus ojos… se han vuelto rojos.', 3); } }
    if (this.panner) { AUD.servo(this.panner, 0.3, 0.8); AUD.burst({ type: 'white', f: 4000, q: 3, dur: 0.6, vol: 0.4, dest: this.panner }); }
  }
  moveTo(target, speed, dt) {
    this.repath -= dt;
    if (!this.path || this.repath <= 0 || !this.path.length) { this.path = W.nav.path(this.pos, target) || []; this.repath = this.state === 'chase' ? 0.35 : 3; }
    if (!this.path.length) { this.speed = 0; return true; }
    const n = this.path[0], dx = n.x - this.pos.x, dz = n.z - this.pos.z, d = Math.hypot(dx, dz);
    if (d < 0.25) { this.path.shift(); return this.path.length === 0; }
    const step = Math.min(d, speed * dt); this.pos.x += dx / d * step; this.pos.z += dz / d * step;
    const want = Math.atan2(dx, dz); let dy = want - this.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); this.yaw += dy * Math.min(1, dt * 7);
    this.speed = speed; return false;
  }
  footsteps(dt) {
    this.stepD += this.speed * dt; const stride = this.kind === 'fox' ? 0.7 : 0.9;
    if (this.stepD > stride) { this.stepD = 0; if (this.panner) AUD.metalStep(this.panner, this.kind === 'bear' ? 1.2 : this.kind === 'fox' ? 0.7 : 1); }
  }
  update(dt) {
    if (this.panner) { this.panner.positionX.value = this.pos.x; this.panner.positionY.value = 1.6; this.panner.positionZ.value = this.pos.z; }
    if (this.kind === 'chick') return this.updateChick(dt);
    const P = PLAYER, d = Math.hypot(P.pos.x - this.pos.x, P.pos.z - this.pos.z);
    this.grace -= dt; this.stunCD -= dt;
    let pose = 'walk', st = {};
    if (this.kind === 'fox' && this.anger > 0 && this.anger < 3) { this.angerDecay -= dt; if (this.angerDecay <= 0) { this.anger--; this.angerDecay = 45; } }
    // luz sobre el animatrónico
    const hit = beamHits(V3(this.pos.x, 1.5, this.pos.z), this.kind === 'fox' ? 11 : 16, 0.94);
    if (this.kind === 'fox') {
      if (hit && this.stunT <= 0 && this.stunCD <= 0) { this.beamT += dt; if (this.beamT > 0.22) { this.beamT = 0; this.stun(4); this.stunCD = 6; } } else this.beamT = 0;
    } else if (this.kind === 'bear' && hit && this.state !== 'chase' && this.freezeT <= 0 && this.grace <= 0) {
      this.state = 'chase'; this.lost = 0; AUD.growl(this.panner, 0.6, 1.4, 1); AUD.stinger(0.3);
    }
    if (this.freezeT > 0) { this.freezeT -= dt; this.speed = 0; pose = 'idle'; st.look = camera.position; st.tilt = 0.3; }
    else if (this.dormant > 0) { this.dormant -= dt; this.speed = 0; pose = 'idle'; st.look = camera.position; st.eyeI = 1.2; st.glow = 0.4; if (P.moving && d < 3) this.dormant -= dt; if (this.dormant <= 0) { AUD.servo(this.panner, 0.3, 0.6); this.state = 'chase'; } }
    else if (this.state === 'stun') { this.stunT -= dt; this.speed = 0; pose = 'stun'; if (this.stunT <= 0) { this.state = this.anger >= 3 ? 'chase' : 'patrol'; this.path = null; } }
    else {
      const sees = this.grace <= 0 && this.canSee();
      if (G.hunt && this.grace <= 0) { this.state = 'chase'; this.lost = 0; }
      if (sees) { this.last.copy(P.pos); this.lost = 0; if (this.state !== 'chase') { this.state = 'chase'; this.path = null; AUD.stinger(0.35); if (this.kind === 'rabbit') AUD.growl(this.panner, 0.5, 1, 1.3); } }
      else if (this.grace <= 0 && P.sprinting && d < this.cfg.hear && this.state !== 'chase') { this.state = 'search'; this.last.copy(P.pos); this.path = null; this.searchT = 0; }
      if (this.state === 'patrol') {
        if (this.kind === 'rabbit') { this.listenT -= dt; if (this.listenT < -rand(8, 16)) this.listenT = rand(3, 5); }
        if (this.listenT > 0) { this.speed = 0; pose = 'idle'; st.eyesOff = true; }
        else { if (!this.goal || this.moveTo(this.goal, this.cfg.walk * this.diff, dt)) { this.goal = W.nav.randomPoint(); this.path = null; } }
      } else if (this.state === 'chase') {
        if (!sees && !G.hunt) { this.lost += dt; if (this.lost > this.cfg.lose) { this.state = 'search'; this.path = null; this.searchT = 0; } }
        const target = sees || G.hunt ? P.pos : this.last;
        const sp = (this.anger >= 3 ? 8.6 : this.cfg.chase) * this.diff * (G.hunt ? 1.1 : 1);
        this.moveTo(target, sp, dt); pose = sp > 3 ? 'run' : 'walk';
        this.growlT -= dt; if (this.growlT <= 0) { this.growlT = rand(3, 6); AUD.growl(this.panner, 0.35, 1, this.kind === 'fox' ? 1.4 : 1); }
      } else if (this.state === 'search') {
        if (this.moveTo(this.last, this.cfg.walk * 1.4 * this.diff, dt)) { this.speed = 0; pose = 'idle'; this.searchT += dt; this.yaw += Math.sin(this.searchT * 2) * dt; if (this.searchT > 3.5) { this.state = 'patrol'; this.goal = null; } }
      }
      st.look = d < 12 && this.state === 'chase' ? camera.position : null;
    }
    this.footsteps(dt);
    if (this.kind === 'fox' && this.anger >= 3) { st.eyeI = 7; }
    st.speed = this.speed; st.pose = pose; st.servo = () => this.panner && Math.random() < 0.5 && AUD.servo(this.panner, 0.08, rand(0.2, 0.5));
    if (this.kind === 'rabbit' && this.speed > 0.1) st.tilt = Math.sin(this.A.phase) * 0.15;
    animateModel(this.A, dt, st);
    this.sync(dt);
    if (d < 1.0 && this.state !== 'stun' && this.freezeT <= 0 && this.dormant <= 0 && losBetween(V3(this.pos.x, 1.5, this.pos.z), V3(P.pos.x, 1.5, P.pos.z))) startJumpscare(this);
  }
  updateChick(dt) {
    const P = PLAYER, d = Math.hypot(P.pos.x - this.pos.x, P.pos.z - this.pos.z);
    this.grace -= dt; this.tpCD -= dt;
    const c = V3(this.pos.x, 1.4, this.pos.z);
    const lit = beamHits(c, 30, 0.9) || LIGHTNING.value > 0.3;
    const observed = this.grace <= 0 && d < (lit ? 34 : 18) && PLAYER.sees(c, 0.8);
    let pose = 'walk', st = { look: camera.position };
    if (this.stunT > 0) { this.stunT -= dt; this.speed = 0; pose = 'stun'; }
    else if (this.rageT > 0) { this.rageT -= dt; this.steer(dt, this.cfg.chase * this.diff); pose = 'run'; st.jaw = 0.7; }
    else if (observed) { this.speed = 0; pose = 'freeze'; this.observedT += dt; if (this.observedT > (SETTINGS.diff ? 1.9 : 2.5)) { this.rageT = 2.6; this.observedT = 0; AUD.growl(this.panner, 0.8, 1.2, 1.6); AUD.stinger(0.4); } }
    else {
      this.observedT = Math.max(0, this.observedT - dt * 0.5);
      if (this.grace <= 0) { const base = (this.cfg.walk + W.found * 0.13) * this.diff * (G.hunt ? 1.5 : 1); this.steer(dt, base); }
      if (d > 36 && this.tpCD <= 0) this.teleport();
    }
    this.footsteps(dt);
    st.speed = this.speed; st.pose = pose; st.servo = () => this.panner && AUD.servo(this.panner, 0.06, 0.3);
    animateModel(this.A, dt, st); this.sync(dt);
    if (d < 1.1 && this.stunT <= 0) startJumpscare(this);
  }
  steer(dt, speed) {
    const P = PLAYER; let dx = P.pos.x - this.pos.x, dz = P.pos.z - this.pos.z; const d = Math.hypot(dx, dz); dx /= d; dz /= d;
    for (const t of W.circles) { const ox = this.pos.x - t.x, oz = this.pos.z - t.z, od = Math.hypot(ox, oz); if (od < t.r + 1.4) { const k = (t.r + 1.4 - od) / 1.4; dx += ox / od * k * 1.2; dz += oz / od * k * 1.2; } }
    const l = Math.hypot(dx, dz); dx /= l; dz /= l;
    this.pos.x += dx * speed * dt; this.pos.z += dz * speed * dt; collidePoint(this.pos, 0.35);
    const want = Math.atan2(dx, dz); let dy = want - this.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); this.yaw += dy * Math.min(1, dt * 6); this.speed = speed;
  }
  teleport() {
    const back = PLAYER.yaw; for (let i = 0; i < 20; i++) {
      const a = back + rand(-0.9, 0.9), r = rand(20, 26), x = PLAYER.pos.x - Math.sin(a) * -r, z = PLAYER.pos.z - Math.cos(a) * -r;
      if (Math.abs(x) > 64 || Math.abs(z) > 64) continue; if (W.circles.some((t) => (t.x - x) ** 2 + (t.z - z) ** 2 < (t.r + 0.6) ** 2)) continue;
      const p = V3(x, 1.4, z); if (PLAYER.sees(p, 0.5)) continue;
      this.pos.set(x, 0, z); this.tpCD = rand(10, 16); return;
    }
  }
  sync() { this.A.root.position.set(this.pos.x, 0, this.pos.z); this.A.root.rotation.y = this.yaw; }
}

/* =====================================================================
   JUMPSCARE
   ===================================================================== */
let JS = null;
function startJumpscare(E) {
  if (G.state !== 'play') return;
  G.state = 'jumpscare'; HUD.style.opacity = 0;
  const A = E.A, fwd = V3(-Math.sin(PLAYER.yaw), 0, -Math.cos(PLAYER.yaw));
  JS = { A, kind: E.kind, t: 0, fwd, base: V3(PLAYER.pos.x, 0, PLAYER.pos.z), yOff: null, side: V3(fwd.z, 0, -fwd.x) };
  A.root.rotation.y = Math.atan2(-fwd.x, -fwd.z);
  W.jsLight.intensity = 0; AUD.stopLoop('drone', 0.1); AUD.stopLoop('musicbox', 0.1);
  PLAYER.lightOn = false; flashlight.intensity = 0; lighterLight.intensity = 0;
  if (JS.kind !== 'chick') AUD.scream(SPECS[JS.kind].scream);
  camera.rotation.z = 0;
}
function updateJumpscare(dt) {
  const J = JS, A = J.A; J.t += dt; const t = J.t;
  const delay = J.kind === 'chick' ? 0.55 : 0;
  if (J.kind === 'chick' && t >= delay && !J.screamed) { J.screamed = true; AUD.scream('chick'); }
  const lt = clamp((t - delay) / (J.kind === 'fox' ? 0.08 : 0.12), 0, 1), e = 1 - Math.pow(1 - lt, 3);
  let dist = lerp(J.kind === 'chick' ? 1.25 : 1.7, 0.68, e), lat = 0, yAdd = 0, tilt = 0;
  if (J.kind === 'fox') lat = (1 - e) * 1.4;
  if (J.kind === 'rabbit') { yAdd = (1 - e) * 0.7; tilt = 0.6; }
  if (J.kind === 'chick') tilt = t < delay ? smooth(t / delay) * 0.7 : 0.5;
  if (J.kind === 'bear') yAdd = -(1 - e) * 0.5;
  animateModel(A, dt, { glow: 0.12, eyeI: 6, pose: t < delay ? 'freeze' : 'scare', jaw: t < delay ? 0.25 : 0.85 + Math.sin(t * 38) * 0.25, shake: t < delay ? 0 : 1.4, tilt, look: camera.position });
  if (J.yOff === null) { A.root.position.set(J.base.x + J.fwd.x * 1.5, 0, J.base.z + J.fwd.z * 1.5); A.root.updateMatrixWorld(true); const hw = A.headWorld(V3()); J.yOff = PLAYER.h + 0.02 - hw.y; }
  A.root.position.set(J.base.x + J.fwd.x * dist + J.side.x * lat, J.yOff + yAdd, J.base.z + J.fwd.z * dist + J.side.z * lat);
  A.root.updateMatrixWorld(true);
  // mantener la CARA a la distancia deseada (el cuerpo se inclina hacia delante)
  const face = A.j.head.localToWorld(V3(0, 0, A.spec.headR * 0.9));
  const along = (face.x - J.base.x) * J.fwd.x + (face.z - J.base.z) * J.fwd.z;
  A.root.position.x += J.fwd.x * (dist - along); A.root.position.z += J.fwd.z * (dist - along);
  A.root.updateMatrixWorld(true);
  const head = A.j.head.localToWorld(V3(0, A.spec.headR * 0.1, A.spec.headR * 0.6));
  camera.position.set(J.base.x, PLAYER.h, J.base.z);
  camera.lookAt(head);
  const k = t > delay ? 1 : 0.15;
  camera.rotation.x += rand(-1, 1) * 0.03 * k; camera.rotation.y += rand(-1, 1) * 0.03 * k; camera.rotation.z = rand(-1, 1) * 0.04 * k;
  camera.fov = SETTINGS.fov - (t > delay ? 14 + Math.sin(t * 50) * 4 : 0); camera.updateProjectionMatrix();
  W.jsLight.position.set(J.base.x + J.fwd.x * 0.15, PLAYER.h + 0.35, J.base.z + J.fwd.z * 0.15);
  W.jsLight.intensity = t > delay ? (Math.random() < 0.2 ? 0.3 : 3.2) : 1.0;
  FX.aberr.value = t > delay ? 1.4 : 0.6; FX.distort.value = t > delay && Math.random() < 0.3 ? 0.35 : 0.04; FX.flash.value = t > delay && t < delay + 0.05 ? 0.7 : 0; FX.redTint.value = t > delay ? 0.25 : 0;
  FX.blackout.value = t > delay + 0.9 && Math.random() < 0.35 ? 1 : 0;
  if (t > delay + 1.35) showDeath();
}
function showDeath() {
  G.state = 'dead'; FX.blackout.value = 0; FX.distort.value = 0; FX.redTint.value = 0; W.jsLight.intensity = 0;
  camera.fov = SETTINGS.fov; camera.updateProjectionMatrix();
  if (document.pointerLockElement) { G.ignoreUnlock = true; document.exitPointerLock(); }
  AUD.stopAllLoops(); AUD.staticNoise(1.6, 0.35);
  staticFX(1, 700); setTimeout(() => { if (G.state === 'dead') staticFX(0.18, 1e9); }, 700);
  $('death').querySelector('.d2').textContent = SPECS[LV.anim].name + ' · ' + LV.name;
  $('death').querySelector('.d1').textContent = pick(['TE ENCONTRÓ', 'DEMASIADO TARDE', 'NO HAY SALIDA', 'TE ATRAPÓ']);
  $('death').classList.remove('hidden');
}

/* =====================================================================
   EVENTOS Y EASTER EGGS
   ===================================================================== */
function extraModel(kind) {
  W.extra = W.extra || {}; if (W.extra[kind]) return W.extra[kind];
  const A = buildAnimatronic(kind); A.root.visible = false; W.scene.add(A.root); W.extra[kind] = A; return A;
}
function tvOn(tv, secs) {
  if (!tv) return; let t = 0, face = false; tv.sm.emissiveIntensity = 1.6; AUD.staticNoise(secs, 0.12, AUD.at(4.6, 0.8, 0.5));
  const L = new THREE.PointLight(0xb0c0ff, 1.2, 4, 2); L.position.set(4.6, 0.9, 1.0); W.scene.add(L);
  const id = setInterval(() => {
    t += 0.06; const c = tv.ctx, img = c.createImageData(128, 96);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    c.putImageData(img, 0, 0);
    if (t > secs * 0.5 && t < secs * 0.5 + 0.25) { c.fillStyle = '#000'; c.fillRect(30, 10, 68, 76); c.fillStyle = '#ddd'; c.beginPath(); c.arc(52, 40, 6, 0, TAU); c.arc(76, 40, 6, 0, TAU); c.fill(); c.fillRect(46, 62, 36, 4); if (!face) { face = true; AUD.burst({ type: 'white', f: 1200, dur: 0.25, vol: 0.4 }); } }
    tv.tex.needsUpdate = true; L.intensity = 0.8 + Math.random() * 0.6;
    if (t >= secs || !W || G.state === 'menu') { clearInterval(id); tv.sm.emissiveIntensity = 0; L.intensity = 0; }
  }, 60);
}
function rockChair(rock, secs) { let t = 0; AUD.creak(AUD.at(rock.g.position.x, 0.5, rock.g.position.z), 0.2, secs); W.updaters.push((dt) => { if (t > secs) return; t += dt; rock.inner.rotation.x = Math.sin(t * 3.2) * 0.14 * (1 - t / secs); }); }
function windowRunner() {
  const A = extraModel('rabbit'); A.root.visible = true; LIGHTNING.strike();
  const west = Math.random() < 0.5, p0 = west ? V3(-3.2, 0, -6) : V3(-6, 0, -3.2), p1 = west ? V3(-3.2, 0, 18) : V3(22, 0, -3.2);
  let t = 0; const dur = 2.6;
  W.updaters.push((dt) => { if (t > dur) { A.root.visible = false; return; } t += dt; A.root.position.lerpVectors(p0, p1, t / dur); A.root.rotation.y = Math.atan2(p1.x - p0.x, p1.z - p0.z); animateModel(A, dt, { speed: 7, pose: 'run' }); if (Math.random() < dt * 6) AUD.footstep('leaves', 0.5, AUD.at(A.root.position.x, 0, A.root.position.z)); });
}
function yardWatcher() {
  const A = extraModel(pick(['rabbit', 'fox'])); A.root.visible = true;
  const spots = [V3(-11, 0, 5), V3(4, 0, -11), V3(27, 0, 4), V3(12, 0, 22)]; const p = pick(spots); A.root.position.copy(p); A.root.rotation.y = Math.atan2(8 - p.x, 6 - p.z);
  let t = 0; W.updaters.push((dt) => { if (!A.root.visible) return; t += dt; animateModel(A, dt, { speed: 0, pose: 'freeze', look: camera.position, eyeI: 5 }); if (t > 18 || (t > 2 && LIGHTNING.value > 0.6 && !PLAYER.sees(_v1.copy(p).setY(1.5), 0.8))) A.root.visible = false; });
}
function forestWatcher() {
  const A = extraModel('bear');
  for (let i = 0; i < 15; i++) { const a = rand(0, TAU), x = PLAYER.pos.x + Math.sin(a) * 38, z = PLAYER.pos.z + Math.cos(a) * 38; if (Math.abs(x) > 60 || Math.abs(z) > 60 || W.circles.some((t) => (t.x - x) ** 2 + (t.z - z) ** 2 < 1.2)) continue; A.root.position.set(x, 0, z); A.root.visible = true; break; }
  let t = 0; W.updaters.push((dt) => { if (!A.root.visible) return; t += dt; A.root.rotation.y = Math.atan2(PLAYER.pos.x - A.root.position.x, PLAYER.pos.z - A.root.position.z); animateModel(A, dt, { pose: 'freeze', look: camera.position, eyeI: 6 }); const d = A.root.position.distanceTo(PLAYER.pos); if (t > 25 || d < 22 || (LIGHTNING.value > 0.7 && t > 3)) { A.root.visible = false; if (d < 22) AUD.staticNoise(0.3, 0.2); } });
}
function forestRunner() {
  const A = extraModel('rabbit'); const f = PLAYER.forward(V3()); f.y = 0; f.normalize(); const side = V3(f.z, 0, -f.x);
  const c = PLAYER.pos.clone().addScaledVector(f, 30), p0 = c.clone().addScaledVector(side, -25), p1 = c.clone().addScaledVector(side, 25);
  A.root.visible = true; let t = 0; const dur = 3.2;
  W.updaters.push((dt) => { if (t > dur) { A.root.visible = false; return; } t += dt; A.root.position.lerpVectors(p0, p1, t / dur); A.root.rotation.y = Math.atan2(p1.x - p0.x, p1.z - p0.z); animateModel(A, dt, { speed: 8, pose: 'run' }); if (Math.random() < dt * 5) AUD.footstep('leaves', 0.6, AUD.at(A.root.position.x, 0, A.root.position.z)); });
}
function fakeEyes() {
  const f = PLAYER.forward(V3()); f.y = 0; f.normalize(); let p = null;
  for (let d = 12; d > 5; d -= 1) { const q = PLAYER.pos.clone().addScaledVector(f, d); const id = W.nav.idx(q.x, q.z); if (id >= 0 && W.nav.walk[id] && losBetween(camera.position, V3(q.x, 1.7, q.z))) { p = q; break; } }
  if (!p) return;
  const g = new THREE.Group(); for (const s of [-1, 1]) { const e = eyeGlow(0xff1a08, 0.22); e.position.set(s * 0.09, 0, 0); g.add(e); } g.position.set(p.x, 1.85, p.z); W.scene.add(g);
  let t = 0; W.updaters.push((dt) => { if (!g.parent) return; t += dt; g.position.y = 1.85 + Math.sin(t * 6) * 0.04; g.lookAt(camera.position); if (t > 2.4) { g.parent.remove(g); AUD.servo(AUD.at(p.x, 1.7, p.z), 0.15, 0.5); } });
}
function flashHallucination(kind) {
  const A = extraModel(kind); const f = PLAYER.forward(V3()); f.y = 0; f.normalize();
  A.root.visible = true; A.root.position.set(PLAYER.pos.x + f.x * 0.8, 0, PLAYER.pos.z + f.z * 0.8); A.root.rotation.y = Math.atan2(-f.x, -f.z); A.root.updateMatrixWorld(true);
  const hy = A.headWorld(V3()).y; A.root.position.y = PLAYER.h - hy + A.root.position.y;
  animateModel(A, 0.1, { pose: 'scare', jaw: 1 }); AUD.scream(SPECS[kind].scream); FX.aberr.value = 2; FX.redTint.value = 0.3;
  setTimeout(() => { A.root.visible = false; FX.redTint.value = 0; }, 220);
  if (!SAVE.seen.includes('egg_' + kind)) { SAVE.seen.push('egg_' + kind); persist(); }
}

/* =====================================================================
   HUD / INTERFAZ EN JUEGO
   ===================================================================== */
const HUD = $('hud');
let lastHUD = '';
function fmtTime(t) { const m = Math.floor(t / 60), s = t % 60; return String(m).padStart(2, '0') + ':' + s.toFixed(1).padStart(4, '0'); }
function updateHUD(force = false) {
  const P = PLAYER, need = LV.items;
  $('hudObj').innerHTML = (LVI === 3 ? 'DIBUJOS ' : 'OBJETOS ') + '<b>' + W.found + '</b> / ' + need;
  const remain = LV.time - G.time; $('hudTime').textContent = G.hunt ? fmtTime(G.time) : fmtTime(Math.max(0, remain));
  $('hudTime').classList.toggle('hunt', G.hunt); $('hudHunt').classList.toggle('hidden', !G.hunt);
  const bars = Math.ceil(P.battery / 20); const bi = $('batIcon').children; for (let i = 0; i < 5; i++) bi[i].className = i < bars ? '' : 'off'; $('batIcon').classList.toggle('low', P.battery < 20);
  $('stamina').style.opacity = P.stamina < 99 ? 1 : 0; $('stamina').firstElementChild.style.width = P.stamina + '%'; $('stamina').classList.toggle('tired', P.exhausted);
  const sig = (P.special || '') + P.specialUses + '|' + P.matches + '|' + W.found + '|' + P.hasKey;
  if (force || sig !== lastHUD) {
    lastHUD = sig; let s = '';
    if (P.special) s += '<span class="k">Q</span>' + SPECIALS[P.special].name.toUpperCase() + (SPECIALS[P.special].uses > 1 || P.specialUses === 0 ? ' ×' + P.specialUses : '');
    if (P.matches > 0) s += (s ? '<br>' : '') + 'CERILLAS ×' + P.matches;
    if (P.hasKey) s += (s ? '<br>' : '') + 'LLAVE OXIDADA';
    $('special').innerHTML = s; $('special').classList.toggle('hidden', !s);
    if (LVI < 3) $('hudList').innerHTML = W.items.map((it) => `<div class="it ${it.got ? 'got' : ''}"><span class="bx"></span>${it.name}</div>`).join('');
    else $('hudList').innerHTML = '';
  }
}
let notifyT = null;
function notify(text, sub = '') { const n = $('notify'); n.innerHTML = text + (sub ? '<small>' + sub + '</small>' : ''); n.style.opacity = 1; clearTimeout(notifyT); notifyT = setTimeout(() => (n.style.opacity = 0), 3200); }
let subT = null;
function subtitle(text, secs = 3) { const s = $('subtitle'); s.textContent = text; s.style.opacity = 1; clearTimeout(subT); subT = setTimeout(() => (s.style.opacity = 0), secs * 1000); }
let interactTarget = null;
const ray = new THREE.Raycaster();
function updateInteract() {
  ray.setFromCamera({ x: 0, y: 0 }, camera); ray.far = 3;
  const hits = ray.intersectObjects(W.interact, true); interactTarget = null;
  for (const h of hits) { let o = h.object; while (o && !o.userData.interact) o = o.parent; if (o && o.userData.interact && h.distance <= o.userData.interact.range) { interactTarget = o; break; } if (h.object.isMesh && !h.object.isSprite) break; }
  const pr = $('prompt');
  if (interactTarget) { pr.innerHTML = '<span class="k">E</span>' + interactTarget.userData.interact.prompt.toUpperCase(); pr.classList.remove('hidden'); $('cross').classList.add('on'); }
  else { pr.classList.add('hidden'); $('cross').classList.remove('on'); }
}
function interact() { if (interactTarget && interactTarget.userData.interact) interactTarget.userData.interact.onUse(); }
function collectItem(it) {
  if (it.got) return; it.got = true; removeInteract(it.g); it.g.parent && it.g.parent.remove(it.g);
  W.found++; AUD.pickup(); notify(it.name, (LVI === 3 ? 'Dibujos ' : 'Objetos ') + W.found + ' / ' + LV.items); updateHUD(true);
  if (LVI === 3) { AUD.stinger(0.15 + W.found * 0.02); if (ENEMY && W.found === 1) ENEMY.grace = Math.min(ENEMY.grace, 2); }
  if (W.found >= LV.items) winLevel();
}
function showNote(L) {
  G.prevState = G.state; G.state = 'note'; if (document.pointerLockElement) { G.ignoreUnlock = true; document.exitPointerLock(); }
  $('paper').querySelector('h5').textContent = L.title; $('paper').querySelector('.txt').innerHTML = L.text.replace('{FUSE}', W && W.fuseOrderText ? W.fuseOrderText : '1 → 2 → 3');
  $('note').classList.remove('hidden'); AUD.burst({ type: 'pink', f: 2000, dur: 0.35, vol: 0.25 });
}
function closeNote() { $('note').classList.add('hidden'); if (G.inMenuNote) { G.inMenuNote = false; G.state = 'menu'; return; } G.state = 'play'; lockPointer(); }
$('note').addEventListener('click', closeNote);
/* --- cuadro eléctrico --- */
let fuseSeq = [];
function openFuse() {
  if (W.secret && W.secret.opened) { subtitle('Ya está funcionando.', 2); return; }
  G.state = 'fuse'; if (document.pointerLockElement) { G.ignoreUnlock = true; document.exitPointerLock(); }
  fuseSeq = []; const row = $('fuseRow'); row.innerHTML = '';
  for (let i = 1; i <= 3; i++) { const b = document.createElement('div'); b.className = 'fsw'; b.innerHTML = '<i></i><span>' + i + '</span>'; b.onclick = () => fuseFlip(i, b); row.appendChild(b); }
  $('fuseMsg').textContent = 'Sube los interruptores en el orden correcto.'; $('fuse').classList.remove('hidden');
}
function fuseFlip(i, el) {
  if (el.classList.contains('on')) return; el.classList.add('on'); AUD.click(); AUD.burst({ type: 'brown', f: 200, dur: 0.1, vol: 0.4 }); fuseSeq.push(i);
  if (fuseSeq[fuseSeq.length - 1] !== W.fuseOrder[fuseSeq.length - 1]) { $('fuseMsg').textContent = '¡CHISPAS! Todo salta.'; AUD.burst({ type: 'white', f: 3000, dur: 0.5, vol: 0.6 }); FX.flash.value = 0.3; setTimeout(() => { fuseSeq = []; [...$('fuseRow').children].forEach((c) => c.classList.remove('on')); $('fuseMsg').textContent = 'Inténtalo otra vez.'; }, 700); return; }
  if (fuseSeq.length === 3) { $('fuseMsg').textContent = 'Algo zumba detrás de la pared…'; AUD.tone({ f: 60, type: 'sawtooth', dur: 1.5, vol: 0.1 }); setTimeout(() => { closeFuse(); W.onSecret(); }, 900); }
}
function closeFuse() { $('fuse').classList.add('hidden'); G.state = 'play'; lockPointer(); }
$('fuseClose').onclick = closeFuse;
/* --- teclado --- */
let kpEntry = '';
function openKeypad() {
  G.state = 'keypad'; if (document.pointerLockElement) { G.ignoreUnlock = true; document.exitPointerLock(); }
  kpEntry = ''; $('kpscreen').textContent = '____'; $('keypad').classList.remove('hidden');
}
(() => { const g = $('kpgrid'); ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].forEach((k) => { const b = document.createElement('button'); b.textContent = k; b.onclick = () => kpPress(k); g.appendChild(b); }); })();
function kpPress(k) {
  AUD.tone({ f: 1200 + Math.random() * 200, type: 'square', dur: 0.06, vol: 0.06 });
  if (k === 'C') kpEntry = ''; else if (k === 'OK') {
    if (kpEntry === W.code) { $('kpscreen').textContent = 'OPEN'; AUD.pickup(); setTimeout(() => { closeKeypad(); W.onKeypad(); }, 600); return; }
    $('kpscreen').textContent = 'ERR'; AUD.tone({ f: 180, type: 'square', dur: 0.4, vol: 0.12 }); kpEntry = ''; setTimeout(() => ($('kpscreen').textContent = '____'), 700); return;
  } else if (kpEntry.length < 4) kpEntry += k;
  $('kpscreen').textContent = (kpEntry + '____').slice(0, 4);
}
function closeKeypad() { $('keypad').classList.add('hidden'); G.state = 'play'; lockPointer(); }
$('kpclose').onclick = closeKeypad;
addEventListener('keydown', (e) => { if (G.state === 'keypad') { if (/^Digit\d$/.test(e.code)) kpPress(e.code.slice(5)); if (e.code === 'Enter') kpPress('OK'); if (e.code === 'Backspace') kpPress('C'); if (e.code === 'Escape') closeKeypad(); } if (G.state === 'fuse' && e.code === 'Escape') closeFuse(); });

/* =====================================================================
   ESTÁTICA / TRANSICIONES
   ===================================================================== */
const SCV = $('staticCv'), SCX = SCV.getContext('2d'); let staticUntil = 0, staticAlpha = 0;
function staticFX(alpha = 0.6, ms = 300) { staticAlpha = alpha; staticUntil = performance.now() + ms; }
function drawStatic() {
  const on = performance.now() < staticUntil; SCV.style.opacity = on ? staticAlpha : 0; if (!on) return;
  const img = SCX.createImageData(320, 180), d = img.data; for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 200; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  SCX.putImageData(img, 0, 0); SCX.fillStyle = 'rgba(0,0,0,.35)'; for (let y = 0; y < 180; y += 3) SCX.fillRect(0, y, 320, 1);
}
const fade = (v) => ($('fade').style.opacity = v);

/* =====================================================================
   FLUJO DE NIVEL
   ===================================================================== */
async function startLevel(idx) {
  if (G.state === 'loading') return;
  G.state = 'loading'; AUD.uiSelect(); staticFX(0.7, 500); fade(1); await sleep(700);
  hideMenu(); AUD.stopAllLoops();
  if (W && W !== MENU.W) disposeWorld(W);
  LVI = idx; LV = LEVELS[idx]; W = newWorld(); LIGHTNING.enabled = true; LIGHTNING.reset(); LIGHTNING.onStrike = null;
  G.time = 0; G.hunt = false; G.flareT = 0; W.found = 0; W.flickerT = 0;
  W.scene.add(camera);
  PLAYER.reset({ pos: V3(), yaw: 0 });
  LV.build();
  mergeStatic(W.scene);
  W.nav = idx < 3 ? new NavGrid(W.bounds, idx === 0 ? 0.25 : idx === 1 ? 0.5 : 0.4, idx === 0 ? 0.24 : 0.34) : null;
  if (idx !== 1) W.rain = makeRain(W.scene, SETTINGS.quality >= 2 ? 7000 : 3500, 40, W.rainExclude);
  PLAYER.reset(W.spawn);
  camera.position.set(PLAYER.pos.x, PLAYER.h, PLAYER.pos.z); camera.rotation.set(0, PLAYER.yaw, 0); camera.fov = SETTINGS.fov; camera.updateProjectionMatrix();
  ENEMY = new Enemy(LV.anim, W.enemySpawn);
  if (idx === 3) ENEMY.grace = 12;
  flareLight.intensity = 0;
  renderPass.scene = W.scene;
  try { renderer.compile(W.scene, camera); } catch (e) { }
  W.nextEvent = rand(14, 24);
  updateHUD(true);
  $('hudLevel').textContent = LV.name; $('batLbl').textContent = W.tool === 'lighter' ? 'MECHERO' : 'LINTERNA';
  $('intro').querySelector('.l1').textContent = 'NIVEL ' + (idx + 1) + ' · ' + LV.en;
  $('intro').querySelector('.l2').textContent = LV.name;
  $('intro').querySelector('.l3').innerHTML = LV.intro + '<br><br><span style="color:#5d574e;font-size:14px">WASD mover · SHIFT correr · C agacharse · F ' + (W.tool === 'lighter' ? 'mechero' : 'linterna') + ' · E interactuar · Q objeto especial</span>';
  $('intro').classList.remove('hidden'); fade(0);
  G.state = 'intro';
}
$('intro').addEventListener('click', () => {
  if (G.state !== 'intro') return;
  $('intro').classList.add('hidden'); HUD.classList.remove('hidden'); HUD.style.opacity = 1;
  W.ambience && W.ambience(); G.state = 'play'; staticFX(0.5, 250);
  lockPointer();
  if (LVI === 2) setTimeout(() => subtitle('Hay algo justo delante de mí…', 3), 800);
  if (LVI === 3) setTimeout(() => subtitle('Tengo que encontrar sus dibujos.', 3), 800);
});
function winLevel() {
  if (G.state !== 'play') return; G.state = 'win';
  if (document.pointerLockElement) { G.ignoreUnlock = true; document.exitPointerLock(); }
  const t = G.time; const best = SAVE.best[LV.id]; const nb = !best || t < best; if (nb) SAVE.best[LV.id] = t; SAVE.done[LV.id] = true; persist();
  AUD.stopAllLoops(); AUD.stinger(0.25); fade(1);
  setTimeout(() => {
    HUD.classList.add('hidden');
    $('win').querySelector('.w2').textContent = 'TIEMPO ' + fmtTime(t) + (nb ? '  ·  ¡NUEVO RÉCORD!' : '');
    const lore = LORE.filter((l) => l.lv === LVI); const got = lore.filter((l) => SAVE.lore.includes(l.id)).length;
    $('win').querySelector('.w3').innerHTML = LV.name + ' COMPLETADO<br>NOTAS ENCONTRADAS ' + got + ' / ' + lore.length + (PLAYER.special ? '<br>OBJETO ESPECIAL: ' + SPECIALS[PLAYER.special].name.toUpperCase() : '');
    $('wNext').classList.toggle('hidden', LVI >= 3);
    $('win').querySelector('.w1').textContent = LVI >= 3 ? 'POR FIN ERES LIBRE' : 'SOBREVIVISTE';
    $('win').classList.remove('hidden'); fade(0); G.state = 'won';
  }, 1300);
}
function pauseGame() { if (G.state !== 'play') return; G.state = 'pause'; $('pause').classList.remove('hidden'); if (document.pointerLockElement) { G.ignoreUnlock = true; document.exitPointerLock(); } if (AUD.ctx) AUD.ctx.suspend(); }
function resumeGame() { $('pause').classList.add('hidden'); G.state = 'play'; if (AUD.ctx) AUD.ctx.resume(); lockPointer(); }
$('pResume').onclick = resumeGame;
$('pRestart').onclick = () => { $('pause').classList.add('hidden'); AUD.ctx && AUD.ctx.resume(); G.state = 'idle'; startLevel(LVI); };
$('pMenu').onclick = () => { $('pause').classList.add('hidden'); AUD.ctx && AUD.ctx.resume(); toMenu(); };
$('pOpts').onclick = () => openPanel('opts');
$('dRetry').onclick = () => { $('death').classList.add('hidden'); staticUntil = 0; G.state = 'idle'; startLevel(LVI); };
$('dMenu').onclick = () => { $('death').classList.add('hidden'); staticUntil = 0; toMenu(); };
$('wNext').onclick = () => { $('win').classList.add('hidden'); G.state = 'idle'; startLevel(LVI + 1); };
$('wMenu').onclick = () => { $('win').classList.add('hidden'); toMenu(); };

/* =====================================================================
   BUCLE DE JUEGO
   ===================================================================== */
let heartT = 0;
function updatePlay(dt) {
  G.time += dt;
  if (!G.hunt && G.time > LV.time) { G.hunt = true; AUD.stinger(0.5); notify('SE ACABÓ EL TIEMPO', SPECS[LV.anim].name + ' sabe dónde estás'); }
  updatePlayer(dt);
  if (ENEMY) ENEMY.update(dt);
  if (G.state !== 'play') return;
  W.updaters.forEach((f) => f(dt, U_TIME.value));
  W.flickerT = Math.max(0, (W.flickerT || 0) - dt);
  // eventos aleatorios
  W.nextEvent -= dt; if (W.nextEvent <= 0 && W.eventPool) { W.nextEvent = rand(16, 34); try { pick(W.eventPool)(); } catch (e) { console.warn(e); } }
  // miedo
  const d = ENEMY ? ENEMY.pos.distanceTo(PLAYER.pos) : 99, chasing = ENEMY && (ENEMY.state === 'chase' || ENEMY.rageT > 0);
  const fear = clamp(1 - d / 13, 0, 1) * (chasing ? 1 : 0.6) + (chasing ? 0.25 : 0);
  G.fear = lerp(G.fear || 0, clamp(fear, 0, 1), dt * 2);
  FX.aberr.value = 0.2 + G.fear * 1.1; FX.vignette.value = 0.75 + G.fear * 0.35; FX.grain.value = 0.07 + G.fear * 0.05; FX.distort.value = G.fear > 0.8 ? 0.06 : 0;
  $('hurt').style.boxShadow = `inset 0 0 220px rgba(120,0,0,${(G.fear * 0.45).toFixed(2)})`;
  AUD.setFear(G.fear);
  heartT -= dt; if (G.fear > 0.25 && heartT <= 0) { AUD.heartbeat(0.25 + G.fear * 0.5); heartT = lerp(1.1, 0.42, G.fear); }
  if (G.camFlashT > 0) { G.camFlashT -= dt; FX.flash.value = Math.max(0, G.camFlashT * 2.5); } else if (FX.flash.value > 0) FX.flash.value = Math.max(0, FX.flash.value - dt * 3);
  if (W.rain) { W.rain.material.uniforms.uC.value.copy(camera.position); }
  updateInteract(); updateHUD();
  AUD.setListener(camera);
}
function applyLightning() {
  if (!W || !W.moon) return; const L = LIGHTNING.value;
  W.moon.intensity = W.moonBase + L * W.lightningGain; W.hemi.intensity = W.hemiBase + L * 0.35;
  if (L > 0.02 && W.moon.castShadow) {
    if (W.outdoor && !W._lt) { const c = camera.position; W.moon.target.position.set(c.x, 0, c.z); W.moon.position.set(c.x - 18, 30, c.z - 15); W.moon.target.updateMatrixWorld(); }
    W.moon.shadow.needsUpdate = true; W._lt = true;
  } else W._lt = false;
}
let lastT = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  if (G.state === 'pause' || G.state === 'note' || G.state === 'keypad' || G.state === 'fuse') { drawStatic(); composer.render(); return; }
  U_TIME.value += dt; FX.time.value = U_TIME.value;
  LIGHTNING.update(dt); applyLightning();
  if (G.state === 'play') updatePlay(dt);
  else if (G.state === 'jumpscare') { updateJumpscare(dt); W.updaters.forEach((f) => f(dt, U_TIME.value)); }
  else if (G.state === 'menu' || G.state === 'menuPanel') updateMenu(dt);
  else if (G.state === 'dead') { FX.distort.value = 0.3; }
  drawStatic();
  if (G.state !== 'loading' || renderPass.scene.children.length) composer.render();
}
