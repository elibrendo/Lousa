// ===== Efeitos sonoros (Web Audio, tudo sintetizado: sem arquivos externos) =====
const SFX = (() => {
  let ac = null, master = null, nbuf = null, on = true, vol = 0.6, n = 0, forced = false;
  try { on = localStorage.getItem("sfxOn") !== "0"; const v = parseFloat(localStorage.getItem("sfxVol")); if (v >= 0 && v <= 1) vol = v; } catch (e) {}
  function get() {
    if (!on && !forced) return null;
    if (!ac) {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
      try { ac = new C(); } catch (e) { return null; }
      master = ac.createGain(); master.gain.value = vol; master.connect(ac.destination);
      nbuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state !== "running" && ac.resume) ac.resume().catch(() => {});
    return ac;
  }
  function tone(f, at, d, o = {}) {
    const a = get(); if (!a) return; n++;
    const t = a.currentTime + at, os = a.createOscillator(), g = a.createGain(), v = o.g == null ? 0.25 : o.g;
    os.type = o.type || "sine"; os.frequency.setValueAtTime(f, t);
    if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + Math.min(0.012, d / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    os.connect(g); g.connect(master); os.start(t); os.stop(t + d + 0.03);
  }
  function noise(at, d, o = {}) {
    const a = get(); if (!a) return; n++;
    const t = a.currentTime + at, src = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
    src.buffer = nbuf; fl.type = "bandpass"; fl.Q.value = 1.2; fl.frequency.setValueAtTime(o.f || 1500, t);
    if (o.to) fl.frequency.exponentialRampToValueAtTime(o.to, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.g == null ? 0.2 : o.g, t + Math.min(0.02, d / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(fl); fl.connect(g); g.connect(master); src.start(t); src.stop(t + d + 0.03);
  }
  const S = {
    click() { tone(700, 0, 0.05, { type: "triangle", g: 0.1 }); },
    tool() { tone(520, 0, 0.06, { type: "triangle", g: 0.14 }); tone(780, 0.035, 0.07, { type: "triangle", g: 0.12 }); },
    solve() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.24, { type: "triangle", g: 0.28 })); tone(1568, 0.3, 0.4, { g: 0.16 }); noise(0.25, 0.3, { f: 6000, to: 9000, g: 0.08 }); },
    tick(s) { if (s <= 3) { tone(1320, 0, 0.1, { type: "square", g: 0.15 }); } else { tone(880, 0, 0.06, { type: "square", g: 0.09 }); } },
    reveal() { tone(660, 0, 0.1, { type: "triangle", g: 0.22 }); tone(990, 0.1, 0.2, { type: "triangle", g: 0.22 }); },
    timeUp() { tone(320, 0, 0.55, { type: "sawtooth", to: 110, g: 0.28 }); tone(160, 0, 0.55, { type: "square", to: 70, g: 0.12 }); },
    roundEnd() { [392, 330, 262].forEach((f, i) => tone(f, i * 0.14, 0.3, { type: "triangle", g: 0.24 })); },
    win() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.3, { type: "triangle", g: 0.26 })); [523, 659, 784].forEach(f => tone(f, 0.5, 0.7, { g: 0.14 })); },
    dice() { for (let i = 0; i < 8; i++) { tone(300 + Math.random() * 500, i * 0.06, 0.045, { type: "square", g: 0.08 }); noise(i * 0.06, 0.04, { f: 2200, g: 0.14 }); } tone(880, 0.55, 0.18, { type: "triangle", g: 0.22 }); tone(1175, 0.65, 0.3, { type: "triangle", g: 0.2 }); },
    count(k) { tone(k >= 3 ? 440 : k === 2 ? 523 : 659, 0, 0.2, { type: "triangle", g: 0.3 }); },
    ready() { tone(330, 0, 0.16, { type: "triangle", g: 0.26 }); tone(440, 0.16, 0.24, { type: "triangle", g: 0.26 }); },
    go() { tone(784, 0, 0.12, { type: "triangle", g: 0.28 }); tone(1047, 0.1, 0.45, { type: "triangle", g: 0.3 }); tone(1568, 0.1, 0.35, { g: 0.12 }); },
    turn() { noise(0, 0.28, { f: 500, to: 3200, g: 0.2 }); tone(784, 0.22, 0.3, { type: "triangle", g: 0.26 }); tone(1175, 0.32, 0.5, { type: "triangle", g: 0.22 }); },
    lock(on) { if (on) { tone(500, 0, 0.05, { type: "square", g: 0.1 }); tone(380, 0.05, 0.09, { type: "square", g: 0.1 }); } else { tone(380, 0, 0.05, { type: "square", g: 0.1 }); tone(520, 0.05, 0.09, { type: "square", g: 0.1 }); } },
    pause(p) { p ? tone(520, 0, 0.12, { type: "triangle", to: 300, g: 0.24 }) : tone(300, 0, 0.12, { type: "triangle", to: 520, g: 0.24 }); },
    hide() { noise(0, 0.2, { f: 3200, to: 500, g: 0.12 }); },
    teams() { tone(523, 0, 0.1, { type: "triangle" }); tone(659, 0.09, 0.1, { type: "triangle" }); tone(784, 0.18, 0.3, { type: "triangle" }); },
    podium() { [392, 392, 392, 523].forEach((f, i) => tone(f, i * 0.16, i === 3 ? 0.5 : 0.14, { type: "triangle", g: 0.28 })); [523, 659, 784, 1047].forEach(f => tone(f, 0.7, 0.9, { g: 0.13 })); noise(0.7, 0.7, { f: 5000, to: 9000, g: 0.07 }); },
    open() { tone(600, 0, 0.08, { type: "triangle", to: 900, g: 0.18 }); },
    close() { tone(900, 0, 0.08, { type: "triangle", to: 600, g: 0.18 }); },
    sweep() { noise(0, 0.28, { f: 2400, to: 500, g: 0.2 }); },
    undo() { tone(620, 0, 0.07, { type: "triangle", to: 400, g: 0.16 }); },
    redo() { tone(400, 0, 0.07, { type: "triangle", to: 620, g: 0.16 }); },
    ok() { tone(660, 0, 0.1, { type: "triangle", g: 0.2 }); tone(880, 0.09, 0.18, { type: "triangle", g: 0.2 }); },
    unlock() { get(); },
    // grava os efeitos no vídeo exportado (funciona mesmo com o som do jogo desligado)
    tap() { forced = true; const a = get(); if (!a) { forced = false; return null; } const d = a.createMediaStreamDestination(); master.connect(d); return d; },
    untap(d) { try { master.disconnect(d); } catch (e) {} forced = false; },
    setOn(v) { on = !!v; try { localStorage.setItem("sfxOn", on ? "1" : "0"); } catch (e) {} if (on) get(); },
    setVol(v) { vol = Math.max(0, Math.min(1, v)); if (master) master.gain.value = vol; try { localStorage.setItem("sfxVol", String(vol)); } catch (e) {} },
    get on() { return on; }, get vol() { return vol; }, get count_() { return n; }
  };
  return S;
})();
