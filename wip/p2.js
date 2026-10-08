
/* =====================================================================
   AUDIO PROCEDURAL (Web Audio)
   ===================================================================== */
const AUD = {
  ctx: null, master: null, sfx: null, amb: null, music: null, verb: null, comp: null,
  buffers: {}, loops: {}, ready: false,
  init() {
    if (this.ctx) return;
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    this.comp = ctx.createDynamicsCompressor(); this.comp.threshold.value = -10; this.comp.ratio.value = 4;
    this.master = ctx.createGain(); this.master.gain.value = SETTINGS.vol;
    this.master.connect(this.comp); this.comp.connect(ctx.destination);
    this.sfx = ctx.createGain(); this.sfx.connect(this.master);
    this.amb = ctx.createGain(); this.amb.connect(this.master);
    this.music = ctx.createGain(); this.music.connect(this.master);
    this.verb = ctx.createConvolver(); this.verb.buffer = this.impulse(2.8, 2.2);
    this.verbGain = ctx.createGain(); this.verbGain.gain.value = 0.35; this.verb.connect(this.verbGain); this.verbGain.connect(this.master);
    const sr = ctx.sampleRate;
    const white = ctx.createBuffer(1, sr * 3, sr), w = white.getChannelData(0); for (let i = 0; i < w.length; i++) w[i] = Math.random() * 2 - 1;
    const brown = ctx.createBuffer(1, sr * 4, sr), b = brown.getChannelData(0); let last = 0; for (let i = 0; i < b.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; b[i] = last * 3.5; }
    const pink = ctx.createBuffer(1, sr * 3, sr), p = pink.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < p.length; i++) { const wv = Math.random() * 2 - 1; b0 = 0.99886 * b0 + wv * 0.0555179; b1 = 0.99332 * b1 + wv * 0.0750759; b2 = 0.969 * b2 + wv * 0.153852; b3 = 0.8665 * b3 + wv * 0.3104856; b4 = 0.55 * b4 + wv * 0.5329522; b5 = -0.7616 * b5 - wv * 0.016898; p[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + wv * 0.5362) * 0.11; b6 = wv * 0.115926; }
    this.buffers = { white, brown, pink };
    this.dist = ctx.createWaveShaper(); this.dist.curve = this.distCurve(80);
    this.ready = true;
  },
  impulse(sec, decay) {
    const ctx = this.ctx, len = ctx.sampleRate * sec, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return buf;
  },
  distCurve(k) { const n = 2048, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; c[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x)); } return c; },
  get t() { return this.ctx.currentTime; },
  setVolume(v) { if (this.master) this.master.gain.setTargetAtTime(v, this.t, 0.05); },
  noise(type = 'white', loop = false) { const s = this.ctx.createBufferSource(); s.buffer = this.buffers[type]; s.loop = loop; if (!loop) s.loopStart = 0; return s; },
  env(g, t0, a, peak, d, end = 0.0001) { g.gain.cancelScheduledValues(t0); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + a); g.gain.exponentialRampToValueAtTime(end, t0 + a + d); },
  out(dest) { return dest || this.sfx; },
  /* --- sonidos básicos --- */
  burst({ type = 'white', f = 1000, q = 1, ft = 'bandpass', dur = 0.2, vol = 0.5, a = 0.005, dest = null, verb = 0, rate = 1, f2 = null } = {}) {
    if (!this.ready) return; const t = this.t;
    const s = this.noise(type); s.playbackRate.value = rate;
    const fl = this.ctx.createBiquadFilter(); fl.type = ft; fl.frequency.setValueAtTime(f, t); fl.Q.value = q; if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = this.ctx.createGain(); this.env(g, t, a, vol, dur);
    s.connect(fl); fl.connect(g); g.connect(this.out(dest)); if (verb) { const vg = this.ctx.createGain(); vg.gain.value = verb; g.connect(vg); vg.connect(this.verb); }
    s.start(t, Math.random() * 1.5); s.stop(t + a + dur + 0.05);
  },
  tone({ f = 440, type = 'sine', dur = 0.3, vol = 0.3, a = 0.005, dest = null, f2 = null, verb = 0, delay = 0, detune = 0 } = {}) {
    if (!this.ready) return; const t = this.t + delay;
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune; if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = this.ctx.createGain(); this.env(g, t, a, vol, dur);
    o.connect(g); g.connect(this.out(dest)); if (verb) { const vg = this.ctx.createGain(); vg.gain.value = verb; g.connect(vg); vg.connect(this.verb); }
    o.start(t); o.stop(t + a + dur + 0.05);
  },
  panner(x = 0, y = 0, z = 0, ref = 2, roll = 1.4) {
    const p = this.ctx.createPanner(); p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = ref; p.rolloffFactor = roll; p.maxDistance = 80;
    p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; p.connect(this.sfx);
    const v = this.ctx.createGain(); v.gain.value = 0.25; p.connect(v); v.connect(this.verb);
    return p;
  },
  at(x, y, z, ref = 2) { const p = this.panner(x, y, z, ref); setTimeout(() => { try { p.disconnect(); } catch (e) { } }, 8000); return p; },
  setListener(cam) {
    if (!this.ready) return; const L = this.ctx.listener, p = cam.getWorldPosition(_v1), f = cam.getWorldDirection(_v2);
    if (L.positionX) { L.positionX.value = p.x; L.positionY.value = p.y; L.positionZ.value = p.z; L.forwardX.value = f.x; L.forwardY.value = f.y; L.forwardZ.value = f.z; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0; }
    else { L.setPosition(p.x, p.y, p.z); L.setOrientation(f.x, f.y, f.z, 0, 1, 0); }
  },
  /* --- ambientes en bucle --- */
  startLoop(name, build) { this.stopLoop(name); this.loops[name] = build(); },
  stopLoop(name, fade = 0.6) {
    const l = this.loops[name]; if (!l) return; delete this.loops[name];
    try { l.g.gain.setTargetAtTime(0.0001, this.t, fade / 3); setTimeout(() => l.nodes.forEach((n) => { try { n.stop ? n.stop() : 0; n.disconnect(); } catch (e) { } }), fade * 1000 + 200); } catch (e) { }
  },
  stopAllLoops() { Object.keys(this.loops).forEach((k) => this.stopLoop(k, 0.3)); },
  rain(vol = 0.5, muffled = 0) {
    this.startLoop('rain', () => {
      const ctx = this.ctx, g = ctx.createGain(); g.gain.value = 0.0001; g.gain.setTargetAtTime(vol, this.t, 1);
      const s1 = this.noise('pink', true), f1 = ctx.createBiquadFilter(); f1.type = 'lowpass'; f1.frequency.value = muffled ? 900 : 5200;
      const f1b = ctx.createBiquadFilter(); f1b.type = 'highpass'; f1b.frequency.value = 180;
      const s2 = this.noise('white', true), f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = muffled ? 1500 : 3800; f2.Q.value = 0.6;
      const g2 = ctx.createGain(); g2.gain.value = muffled ? 0.05 : 0.18;
      s1.connect(f1); f1.connect(f1b); f1b.connect(g); s2.connect(f2); f2.connect(g2); g2.connect(g); g.connect(this.amb);
      s1.start(); s2.start(); return { g, nodes: [s1, s2, f1, f1b, f2, g2, g] };
    });
  },
  wind(vol = 0.3) {
    this.startLoop('wind', () => {
      const ctx = this.ctx, g = ctx.createGain(); g.gain.value = 0.0001; g.gain.setTargetAtTime(vol, this.t, 1.5);
      const s = this.noise('brown', true), f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 400; f.Q.value = 0.8;
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 260; lfo.connect(lg); lg.connect(f.frequency);
      const lfo2 = ctx.createOscillator(), lg2 = ctx.createGain(); lfo2.frequency.value = 0.13; lg2.gain.value = vol * 0.6; lfo2.connect(lg2); lg2.connect(g.gain);
      s.connect(f); f.connect(g); g.connect(this.amb); s.start(); lfo.start(); lfo2.start();
      return { g, nodes: [s, f, lfo, lg, lfo2, lg2, g] };
    });
  },
  drone(vol = 0.18, base = 46) {
    this.startLoop('drone', () => {
      const ctx = this.ctx, g = ctx.createGain(); g.gain.value = 0.0001; g.gain.setTargetAtTime(vol, this.t, 2);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220; f.Q.value = 3;
      const nodes = [g, f];
      [base, base * 1.007, base * 1.5 * 0.995, base * 2.02].forEach((fr, i) => { const o = ctx.createOscillator(); o.type = i % 2 ? 'sawtooth' : 'triangle'; o.frequency.value = fr; const og = ctx.createGain(); og.gain.value = i === 3 ? 0.15 : 0.35; o.connect(og); og.connect(f); o.start(); nodes.push(o, og); });
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.05; lg.gain.value = 120; lfo.connect(lg); lg.connect(f.frequency); lfo.start(); nodes.push(lfo, lg);
      f.connect(g); g.connect(this.music); this.droneGain = g; this.droneFilter = f;
      return { g, nodes };
    });
  },
  setFear(x) { if (this.droneFilter) { this.droneFilter.frequency.setTargetAtTime(220 + x * 900, this.t, 0.3); } },
  musicBox(vol = 0.16) {
    this.startLoop('musicbox', () => {
      const ctx = this.ctx, g = ctx.createGain(); g.gain.value = 0.0001; g.gain.setTargetAtTime(vol, this.t, 1);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 3800; f.connect(g); g.connect(this.music);
      const vg = ctx.createGain(); vg.gain.value = 0.6; g.connect(vg); vg.connect(this.verb);
      const mel = [76, 74, 72, 71, 72, 74, 71, 67, 69, 72, 71, 69, 68, 69, 71, 64, 76, 74, 72, 71, 72, 74, 76, 79, 77, 76, 74, 72, 71, 72, 69, 69];
      const bass = [45, 45, 52, 52, 41, 41, 40, 40];
      let step = 0, alive = true;
      const tick = () => {
        if (!alive) return;
        const t = this.t + 0.02, wob = 1 + Math.sin(step * 0.37) * 0.006 + (Math.random() - 0.5) * 0.004;
        const n = mel[step % mel.length], fr = 440 * Math.pow(2, (n - 69) / 12) * wob;
        [1, 2.01, 3.98].forEach((h, i) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = fr * h; const og = ctx.createGain(); og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime([0.5, 0.18, 0.06][i], t + 0.004); og.gain.exponentialRampToValueAtTime(0.0001, t + 1.6 / (i + 1)); o.connect(og); og.connect(f); o.start(t); o.stop(t + 1.8); });
        if (step % 4 === 0) { const bn = bass[(step / 4) % bass.length], bf = 440 * Math.pow(2, (bn - 69) / 12) * wob; const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = bf; const og = ctx.createGain(); og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.25, t + 0.01); og.gain.exponentialRampToValueAtTime(0.0001, t + 2.4); o.connect(og); og.connect(f); o.start(t); o.stop(t + 2.5); }
        step++;
        const slow = step % mel.length === 0 ? 1.6 : 0;
        this._mbT = setTimeout(tick, (420 + Math.random() * 40 + slow * 1000) * (1 + Math.max(0, Math.sin(step * 0.1)) * 0.15));
      };
      tick();
      return { g, nodes: [{ stop: () => { alive = false; clearTimeout(this._mbT); } }, f, g, vg] };
    });
  },
  /* --- efectos --- */
  thunder(dist = 0.5) {
    if (!this.ready) return; const ctx = this.ctx, t = this.t;
    const s = this.noise('brown'); s.playbackRate.value = 0.5 + Math.random() * 0.3;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(dist < 0.3 ? 2400 : 900, t); f.frequency.exponentialRampToValueAtTime(90, t + 5);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1.6 * (1.1 - dist), t + 0.08 + dist * 0.4);
    for (let i = 1; i < 6; i++) g.gain.setTargetAtTime(rand(0.3, 1.2) * (1.1 - dist), t + i * rand(0.3, 0.7), 0.2);
    g.gain.setTargetAtTime(0.0001, t + 3.5, 1.2);
    s.connect(f); f.connect(g); g.connect(this.amb); const vg = ctx.createGain(); vg.gain.value = 0.6; g.connect(vg); vg.connect(this.verb);
    s.start(t); s.stop(t + 8);
    if (dist < 0.3) this.burst({ type: 'white', f: 3000, ft: 'highpass', dur: 0.4, vol: 0.5, dest: this.amb });
  },
  footstep(surface = 'wood', vol = 0.5, dest = null) {
    const r = rand(0.85, 1.15);
    if (surface === 'wood') { this.burst({ type: 'brown', f: 180 * r, q: 1.5, dur: 0.12, vol: vol * 1.4, dest }); this.burst({ type: 'white', f: 1400 * r, q: 2, dur: 0.05, vol: vol * 0.25, dest }); if (Math.random() < 0.12) this.tone({ f: rand(300, 500), f2: rand(200, 300), type: 'sawtooth', dur: 0.25, vol: vol * 0.03, a: 0.05, dest }); }
    else if (surface === 'concrete') { this.burst({ type: 'white', f: 900 * r, q: 1.2, dur: 0.07, vol: vol * 0.5, dest, verb: 0.4 }); this.burst({ type: 'brown', f: 120, q: 1, dur: 0.08, vol: vol, dest }); }
    else if (surface === 'leaves') { this.burst({ type: 'white', f: 2600 * r, q: 0.6, dur: 0.18, vol: vol * 0.4, dest, a: 0.02 }); this.burst({ type: 'brown', f: 150, q: 1, dur: 0.1, vol: vol * 0.7, dest }); }
    else if (surface === 'tile') { this.burst({ type: 'white', f: 2200 * r, q: 3, dur: 0.05, vol: vol * 0.45, dest, verb: 0.2 }); this.burst({ type: 'brown', f: 160, q: 1, dur: 0.07, vol: vol * 0.8, dest }); }
  },
  metalStep(dest, vol = 1) {
    this.burst({ type: 'brown', f: 90, q: 1.2, dur: 0.22, vol: vol * 1.6, dest });
    this.burst({ type: 'white', f: rand(1800, 2600), q: 12, dur: 0.18, vol: vol * 0.3, dest });
    if (Math.random() < 0.5) this.tone({ f: rand(600, 1400), type: 'triangle', dur: 0.25, vol: vol * 0.05, dest });
  },
  servo(dest, vol = 0.12, dur = 0.5) {
    if (!this.ready) return; const ctx = this.ctx, t = this.t, o = ctx.createOscillator(); o.type = 'sawtooth';
    const f0 = rand(260, 420); o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 * rand(1.2, 1.6), t + dur * 0.5); o.frequency.linearRampToValueAtTime(f0 * 0.9, t + dur);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = 4;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.04); g.gain.setValueAtTime(vol, t + dur - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(bp); bp.connect(g); g.connect(dest || this.sfx); o.start(t); o.stop(t + dur + 0.05);
  },
  growl(dest, vol = 0.4, dur = 1.2, pitch = 1) {
    if (!this.ready) return; const ctx = this.ctx, t = this.t;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70 * pitch, t); o.frequency.linearRampToValueAtTime(52 * pitch, t + dur);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 23; lg.gain.value = 18; lfo.connect(lg); lg.connect(o.frequency);
    const s = this.noise('brown'); const sf = ctx.createBiquadFilter(); sf.type = 'bandpass'; sf.frequency.value = 500 * pitch; sf.Q.value = 2;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
    const g = ctx.createGain(); this.env(g, t, 0.15, vol, dur);
    const ws = ctx.createWaveShaper(); ws.curve = this.distCurve(40);
    o.connect(ws); s.connect(sf); sf.connect(ws); ws.connect(f); f.connect(g); g.connect(dest || this.sfx);
    o.start(t); lfo.start(t); s.start(t); o.stop(t + dur + 0.2); lfo.stop(t + dur + 0.2); s.stop(t + dur + 0.2);
  },
  scream(kind = 'bear') {
    if (!this.ready) return; const ctx = this.ctx, t = this.t;
    const P = { bear: [140, 0.9], rabbit: [190, 1.15], fox: [230, 1.3], chick: [300, 1.5] }[kind] || [160, 1];
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(2.2, t + 0.012); g.gain.setTargetAtTime(1.6, t + 0.3, 0.3); g.gain.setTargetAtTime(0.0001, t + 1.35, 0.12);
    const ws = ctx.createWaveShaper(); ws.curve = this.distCurve(400); ws.oversample = '2x';
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 60;
    ws.connect(hp); hp.connect(g); g.connect(this.master);
    const vg = ctx.createGain(); vg.gain.value = 0.4; g.connect(vg); vg.connect(this.verb);
    for (let i = 0; i < 6; i++) {
      const o = ctx.createOscillator(); o.type = i % 2 ? 'sawtooth' : 'square';
      const f0 = P[0] * (1 + i * 0.47) * rand(0.97, 1.03);
      o.frequency.setValueAtTime(f0 * 0.6, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.6, t + 0.06); o.frequency.exponentialRampToValueAtTime(f0 * 0.75, t + 1.4);
      const vib = ctx.createOscillator(), vgn = ctx.createGain(); vib.frequency.value = rand(28, 45); vgn.gain.value = f0 * 0.12; vib.connect(vgn); vgn.connect(o.frequency);
      const og = ctx.createGain(); og.gain.value = 0.22; o.connect(og); og.connect(ws); o.start(t); vib.start(t); o.stop(t + 1.6); vib.stop(t + 1.6);
    }
    const s = this.noise('white'), sf = ctx.createBiquadFilter(); sf.type = 'bandpass'; sf.frequency.setValueAtTime(2500 * P[1], t); sf.frequency.exponentialRampToValueAtTime(900, t + 1.4); sf.Q.value = 0.7;
    const sg = ctx.createGain(); sg.gain.value = 0.9; s.connect(sf); sf.connect(sg); sg.connect(ws); s.start(t); s.stop(t + 1.6);
    const b = ctx.createOscillator(); b.type = 'sine'; b.frequency.setValueAtTime(110, t); b.frequency.exponentialRampToValueAtTime(30, t + 0.6);
    const bg = ctx.createGain(); this.env(bg, t, 0.005, 1.8, 0.8); b.connect(bg); bg.connect(this.master); b.start(t); b.stop(t + 1);
    this.burst({ type: 'white', f: 6000, ft: 'highpass', dur: 0.15, vol: 1.2, dest: this.master });
  },
  stinger(vol = 0.5) {
    if (!this.ready) return; const ctx = this.ctx, t = this.t;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
    g.connect(this.music); const vg = ctx.createGain(); vg.gain.value = 0.8; g.connect(vg); vg.connect(this.verb);
    [55, 58.3, 82.4, 116.5, 233, 246.9, 349].forEach((f) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = rand(-20, 20); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3000, t); lp.frequency.exponentialRampToValueAtTime(200, t + 3); const og = ctx.createGain(); og.gain.value = 0.12; o.connect(lp); lp.connect(og); og.connect(g); o.start(t); o.stop(t + 3.1); });
    this.burst({ type: 'white', f: 4000, ft: 'highpass', dur: 0.5, vol: vol * 0.6, dest: this.music });
  },
  heartbeat(vol = 0.5) { this.tone({ f: 58, f2: 38, dur: 0.14, vol, a: 0.01, dest: this.sfx }); this.tone({ f: 54, f2: 36, dur: 0.16, vol: vol * 0.8, a: 0.01, delay: 0.22, dest: this.sfx }); },
  pickup() { [880, 1320, 1760].forEach((f, i) => this.tone({ f, type: 'sine', dur: 1.2, vol: 0.12 / (i + 1), delay: i * 0.06, verb: 0.6 })); this.burst({ type: 'white', f: 3000, q: 1, dur: 0.12, vol: 0.12 }); },
  click() { this.burst({ type: 'white', f: 3200, q: 4, dur: 0.02, vol: 0.4 }); this.burst({ type: 'brown', f: 300, q: 2, dur: 0.03, vol: 0.3 }); },
  uiHover() { this.tone({ f: 1800, type: 'sine', dur: 0.04, vol: 0.03 }); },
  uiSelect() { this.burst({ type: 'white', f: 1200, q: 3, dur: 0.06, vol: 0.18 }); this.tone({ f: 120, type: 'sine', dur: 0.15, vol: 0.25 }); },
  staticNoise(dur = 0.4, vol = 0.35, dest = null) { this.burst({ type: 'white', f: 3500, q: 0.3, dur, vol, a: 0.005, dest: dest || this.sfx }); },
  whisper(dest, vol = 0.3) {
    if (!this.ready) return; const ctx = this.ctx, t = this.t, dur = rand(1.2, 2.4);
    const s = this.noise('white'); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    for (let i = 0; i < 8; i++) { const tt = t + (i / 8) * dur; g.gain.linearRampToValueAtTime(vol * rand(0.2, 1), tt + 0.06); g.gain.linearRampToValueAtTime(vol * 0.05, tt + dur / 8); }
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.1);
    [[700, 1100], [1200, 2300], [2600, 3200]].forEach(([a, b]) => { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 8; f.frequency.setValueAtTime(a, t); for (let i = 1; i < 8; i++) f.frequency.linearRampToValueAtTime(rand(a, b), t + i * dur / 8); s.connect(f); f.connect(g); });
    g.connect(dest || this.sfx); s.start(t); s.stop(t + dur + 0.2);
  },
  knock(dest, n = 3, vol = 0.8) { for (let i = 0; i < n; i++) setTimeout(() => { this.burst({ type: 'brown', f: 220, q: 3, dur: 0.12, vol, dest, verb: 0.4 }); this.burst({ type: 'white', f: 900, q: 2, dur: 0.03, vol: vol * 0.3, dest }); }, i * rand(230, 320)); },
  creak(dest, vol = 0.15, dur = 1.0) {
    if (!this.ready) return; const ctx = this.ctx, t = this.t, o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(rand(60, 110), t); o.frequency.linearRampToValueAtTime(rand(120, 220), t + dur);
    const am = ctx.createOscillator(), ag = ctx.createGain(); am.type = 'square'; am.frequency.value = rand(18, 40); ag.gain.value = 0.5; am.connect(ag);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 5;
    const g = ctx.createGain(); this.env(g, t, 0.08, vol, dur); ag.connect(g.gain);
    o.connect(bp); bp.connect(g); g.connect(dest || this.sfx); o.start(t); am.start(t); o.stop(t + dur + 0.2); am.stop(t + dur + 0.2);
  },
  laugh(dest, vol = 0.25) {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const f = rand(520, 700) * (1 - i * 0.04);
        this.tone({ f, f2: f * 0.8, type: 'triangle', dur: 0.13, vol, a: 0.01, dest, verb: 0.6 });
        this.burst({ type: 'white', f: 2400, q: 3, dur: 0.1, vol: vol * 0.3, dest });
      }, i * 170);
    }
  },
  clang(dest, vol = 0.6) { [1, 2.76, 5.4, 8.9].forEach((h, i) => this.tone({ f: 180 * h * rand(0.98, 1.02), type: 'sine', dur: 2.2 / (i + 1), vol: vol / (i + 1.5), dest, verb: 0.7 })); this.burst({ type: 'white', f: 3000, q: 1, dur: 0.06, vol: vol * 0.5, dest }); },
  phoneRing(dest, rings = 3) { for (let r = 0; r < rings; r++) for (let k = 0; k < 2; k++) for (let i = 0; i < 12; i++) setTimeout(() => this.tone({ f: i % 2 ? 1300 : 1100, type: 'square', dur: 0.04, vol: 0.06, a: 0.002, dest }), r * 3000 + k * 450 + i * 34); },
  drip(dest) { const f = rand(900, 1800); this.tone({ f, f2: f * 1.8, type: 'sine', dur: 0.08, vol: 0.12, a: 0.002, dest, verb: 0.8 }); },
  steam(dest, dur = 2) { this.burst({ type: 'white', f: 3000, ft: 'highpass', q: 0.5, dur, vol: 0.35, a: 0.05, dest }); },
  snap(dest) { this.burst({ type: 'white', f: 1800, q: 1.5, dur: 0.06, vol: 0.7, dest, verb: 0.5 }); this.burst({ type: 'brown', f: 300, q: 1, dur: 0.1, vol: 0.5, dest }); },
  owl(dest) { [0, 0.5, 0.75].forEach((d) => this.tone({ f: 420, f2: 380, type: 'sine', dur: 0.35, vol: 0.1, a: 0.08, delay: d, dest, verb: 0.9 })); },
  match() { this.burst({ type: 'white', f: 2500, q: 0.8, dur: 0.35, vol: 0.4, f2: 900 }); setTimeout(() => this.burst({ type: 'brown', f: 300, q: 0.5, dur: 0.6, vol: 0.2 }), 150); },
  grind(dest, dur = 2) { this.burst({ type: 'brown', f: 140, q: 2, dur, vol: 0.8, a: 0.1, dest, verb: 0.4 }); this.creak(dest, 0.2, dur); },
  breath(vol = 0.2) { this.burst({ type: 'pink', f: 900, q: 0.8, dur: 0.5, vol, a: 0.15 }); setTimeout(() => this.burst({ type: 'pink', f: 600, q: 0.8, dur: 0.6, vol: vol * 0.8, a: 0.1 }), 650); },
  camFlash() { this.tone({ f: 3000, f2: 9000, type: 'sine', dur: 0.6, vol: 0.06, a: 0.3 }); setTimeout(() => { this.burst({ type: 'white', f: 4000, ft: 'highpass', dur: 0.15, vol: 0.5 }); this.click(); }, 600); },
};
