// ===== Vídeo do placar (story 1080x1920): pódio animado + 2 desenhos acertados dos vencedores =====
const clamp01 = t => Math.max(0, Math.min(1, t));
const easeOut = t => 1 - Math.pow(1 - clamp01(t), 3);
const easeInOut = t => { t = clamp01(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
const easeBack = t => { t = clamp01(t); const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const VF = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
function vText(g, t, x, y, maxW, size, weight, color, align, alpha) {
  let s = size; g.font = weight + " " + s + "px " + VF;
  while (g.measureText(t).width > maxW && s > 14) { s -= 2; g.font = weight + " " + s + "px " + VF; }
  g.globalAlpha = alpha == null ? 1 : clamp01(alpha); g.fillStyle = color; g.textAlign = align || "center"; g.textBaseline = "middle"; g.fillText(t, x, y); g.globalAlpha = 1;
}
function vCircle(g, im, cx, cy, r, ring, alpha) {
  if (r <= 0) return; g.save(); g.globalAlpha = alpha == null ? 1 : clamp01(alpha);
  g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fillStyle = "#3b3b78"; g.fill(); g.clip(); if (im) g.drawImage(im, cx - r, cy - r, r * 2, r * 2); g.restore();
  if (ring) { g.save(); g.globalAlpha = alpha == null ? 1 : clamp01(alpha); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.lineWidth = 7; g.strokeStyle = ring; g.stroke(); g.restore(); }
}
function makeVideoBase(W, H) {
  const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#3a3a92"); bg.addColorStop(0.5, "#1f1f48"); bg.addColorStop(1, "#111126");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W / 2, 640, 40, W / 2, 640, 700); glow.addColorStop(0, "rgba(255,211,77,.2)"); glow.addColorStop(1, "rgba(255,211,77,0)");
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(255,255,255,.05)"; [[110, 140, 90], [980, 330, 60], [90, 1720, 110], [1000, 1800, 70]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], p[2], 0, 7); g.fill(); });
  return c;
}
// Trecho do desenho (0..1) como lista de comandos, para "desenhar bem rápido"
function partialCmds(list, p) {
  const units = c => (c.type === "pen" || c.type === "eraser") ? Math.max(1, (c.points || []).length - 1) : ["line", "rect", "circle"].includes(c.type) ? 12 : 1;
  let total = 0; list.forEach(c => total += units(c));
  let u = p * total; const out = [];
  for (const c of list) {
    const n = units(c);
    if (u >= n) { out.push(c); u -= n; continue; }
    if (c.type === "pen" || c.type === "eraser") { const pts = c.points || []; if (u >= 1 && pts.length > 1) out.push({ ...c, points: pts.slice(0, Math.floor(u) + 2) }); }
    else if (["line", "rect", "circle"].includes(c.type)) { const t = u / n; out.push({ ...c, b: { x: c.a.x + (c.b.x - c.a.x) * t, y: c.a.y + (c.b.y - c.a.y) * t } }); }
    break;
  }
  return out;
}
function cmdBBox(list) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const add = p => { if (p && isFinite(p.x) && isFinite(p.y)) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); } };
  list.forEach(c => { if (c.points) c.points.forEach(add); if (c.a) add(c.a); if (c.b) add(c.b); });
  const cw = canvas.width / dpr, ch = canvas.height / dpr;
  if (x1 < x0) return { x: 0, y: 0, w: cw, h: ch };
  const pad = 50; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
  let w = Math.max(360, x1 - x0), h = Math.max(270, y1 - y0);
  const A = 4 / 3; if (w / h < A) w = h * A; else h = w / A;
  if (w > cw) { w = cw; } if (h > ch) { h = ch; }
  let x = (x0 + x1) / 2 - w / 2, y = (y0 + y1) / 2 - h / 2;
  x = Math.max(0, Math.min(cw - w, x)); y = Math.max(0, Math.min(ch - h, y));
  return { x, y, w, h };
}
function pickWinnerDrawings(entry, indiv) {
  const ok = gameDrawings.filter(d => d.kind === "acertou" && d.cmds && d.cmds.length);
  const fast = arr => arr.slice().sort((a, b) => (b.pts - a.pts) || ((a.secs == null ? 999 : a.secs) - (b.secs == null ? 999 : b.secs)));
  let out = [];
  if (indiv) out = fast(ok.filter(d => d.drawer === entry.name)).slice(0, 2);
  else {
    const mine = ok.filter(d => d.team === teamNames[entry.team]);
    (teamMembers[entry.team] || []).forEach(m => { const b = fast(mine.filter(d => d.drawer === m))[0]; if (b) out.push(b); });
    fast(mine).forEach(d => { if (out.length < 2 && !out.includes(d)) out.push(d); });
  }
  return out.slice(0, 2);
}
async function scoreboardVideo(onProgress) {
  if (!canvas.captureStream || !window.MediaRecorder) throw new Error("Este navegador não oferece gravação de vídeo por canvas. Use uma versão recente do Chrome, Edge ou Safari.");
  const W = 1080, H = 1920, M = 60;
  const lb = buildLeaderboard(), list = lb.leaderboard, indiv = lb.individualMode;
  const top3 = list.filter(e => e.rank <= 3), others = list.filter(e => e.rank > 3);
  const order = [...top3.filter(e => e.rank === 2), ...top3.filter(e => e.rank === 1), ...top3.filter(e => e.rank === 3)];
  const winners = list.filter(e => e.rank === 1), win = winners[0];
  const maxScore = Math.max(0, ...list.map(e => e.score));
  const photoOf = e => indiv ? playerPhoto(e.name) : teamPhoto(e.team);
  const imgOf = new Map(); await Promise.all(list.map(async e => imgOf.set(e, await loadImg(photoOf(e)))));
  const scenes = [];
  for (const d of (win ? pickWinnerDrawings(win, indiv) : [])) {
    scenes.push({ d, box: cmdBBox(d.cmds), imD: await loadImg(playerPhoto(d.drawer)), imG: await loadImg(playerPhoto(d.guesser)) });
  }
  const segs = [{ k: "A", dur: 9 }, ...scenes.map(s => ({ k: "B", dur: 6.4, s })), { k: "C", dur: 3 }];
  const total = segs.reduce((a, s) => a + s.dur, 0);
  const base = makeVideoBase(W, H);
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  cv.style.cssText = "position:fixed;left:-99999px;top:0;width:270px;height:480px"; document.body.appendChild(cv);
  const g = cv.getContext("2d");
  const dateStr = new Date().toLocaleDateString("pt-BR");
  const stepCol = { 1: ["#ffe27a", "#e0a21a"], 2: ["#eef2f8", "#a9b3c6"], 3: ["#f0b27c", "#b9723a"] };
  const rankTimes = [...new Set(order.map(e => e.rank))].sort((a, b) => b - a);
  const header = (t, sub) => { vText(g, t, W / 2, 300, W - 2 * M, 72, "800", "#ffd34d", "center"); vText(g, sub, W / 2, 364, W - 2 * M, 30, "600", "#9ff6e9", "center"); };
  function frameA(t) {
    header(sessionOver ? "Classificação final" : "Classificação parcial", (indiv ? "Individual" : "Por equipe") + " · " + dateStr + " · " + (turnNumber || 0) + " rodada(s)");
    const baseY = others.length ? 1110 : 1260;
    const colW = Math.min(330, (W - 2 * M) / Math.max(1, order.length)), x0 = (W - colW * order.length) / 2;
    g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(M, baseY, W - 2 * M, 4);
    order.forEach((e, i) => {
      const rt = 0.7 + rankTimes.indexOf(e.rank) * 1.5, k = easeOut((t - rt) / 1.3), pop = easeBack((t - rt) / 0.9);
      if (t < rt) return;
      const cx = x0 + colW * (i + 0.5), full = 90 + 190 * (maxScore > 0 ? e.score / maxScore : 0.5), h = full * k, sy = baseY - h, R = (e.rank === 1 ? 100 : 76) * Math.max(0, pop);
      const sg = g.createLinearGradient(0, sy, 0, baseY); sg.addColorStop(0, stepCol[e.rank][0]); sg.addColorStop(1, stepCol[e.rank][1]);
      g.fillStyle = sg; rrect(g, cx - colW / 2 + 8, sy, colW - 16, Math.max(2, h), 18); g.fill();
      if (k > 0.55) vText(g, e.rank + "º", cx, sy + Math.min(h, full) / 2, colW - 40, 60, "800", "#3d2852", "center", (k - 0.55) / 0.3);
      const pts = Math.round(e.score * k); vText(g, pts + (pts === 1 ? " ponto" : " pontos"), cx, sy - 24, colW - 16, 38, "800", "#ffd34d", "center", k * 3);
      const lines = e.name.includes(" & ") ? e.name.split(" & ").map((s, j) => j ? "& " + s : s) : [e.name];
      lines.forEach((s, j) => vText(g, s, cx, sy - 72 - (lines.length - 1 - j) * 40, colW - 16, 34, "700", "#fff", "center", k * 3));
      const nameTop = sy - 72 - (lines.length - 1) * 40 - 26, cy = nameTop - R - 8;
      vCircle(g, imgOf.get(e), cx, cy, R, stepCol[e.rank][0], pop);
      if (e.rank === 1) vText(g, "👑", cx, cy - R - 26 - (1 - k) * 30, 90, 60, "400", "#fff", "center", (k - 0.6) / 0.3);
    });
    if (others.length) {
      let y = baseY + 62; const st = 5.4;
      vText(g, "DEMAIS PARTICIPANTES", W / 2, y, W - 2 * M, 26, "800", "#c9cbff", "center", (t - st) / 0.5); y += 26;
      const rowH = Math.min(68, (1600 - y) / others.length), h = rowH - 8, ar = Math.min(22, h / 2 - 4);
      others.forEach((e, i) => {
        const a = easeOut((t - st - i * 0.25) / 0.5); if (a <= 0) return;
        const ry = y + i * rowH, dx = (1 - a) * 120;
        g.globalAlpha = a; g.fillStyle = "rgba(255,255,255,.09)"; rrect(g, M + dx, ry, W - 2 * M, h, 16); g.fill(); g.globalAlpha = 1;
        vText(g, e.rank + "º", M + 44 + dx, ry + h / 2, 70, 30, "800", "#ffd34d", "center", a);
        vCircle(g, imgOf.get(e), M + 112 + dx, ry + h / 2, ar, null, a);
        vText(g, e.name, M + 112 + ar + 18 + dx, ry + h / 2, 520, 30, "700", "#fff", "left", a);
        vText(g, e.score + (e.score === 1 ? " pt" : " pts"), W - M - 28 + dx, ry + h / 2, 200, 30, "800", "#ffd34d", "right", a);
      });
    }
  }
  function frameB(t, s, n, cnt) {
    const d = s.d;
    header("Desenho acertado" + (cnt > 1 ? " " + (n + 1) + "/" + cnt : ""), "Rodada " + d.turn + (d.team ? " · " + d.team : ""));
    const fx = M, fy = 450, fw = W - 2 * M, fh = 720, sc = easeBack(t / 0.5);
    g.save(); g.translate(W / 2, fy + fh / 2); g.scale(Math.max(0.01, sc), Math.max(0.01, sc)); g.translate(-W / 2, -(fy + fh / 2));
    g.fillStyle = "rgba(0,0,0,.35)"; rrect(g, fx + 6, fy + 12, fw, fh, 26); g.fill();
    g.fillStyle = currentBoardColor(); rrect(g, fx, fy, fw, fh, 26); g.fill();
    g.save(); rrect(g, fx, fy, fw, fh, 26); g.clip();
    const p = easeInOut((t - 0.7) / 2.6);
    renderReplay(partialCmds(d.cmds, p));
    const b = s.box, scl = Math.min(fw / b.w, fh / b.h), dw = b.w * scl, dh = b.h * scl;
    g.drawImage(canvas, b.x * dpr, b.y * dpr, b.w * dpr, b.h * dpr, fx + (fw - dw) / 2, fy + (fh - dh) / 2, dw, dh);
    g.restore(); g.lineWidth = 8; g.strokeStyle = "#ffd34d"; rrect(g, fx, fy, fw, fh, 26); g.stroke(); g.restore();
    const a1 = easeOut((t - 0.5) / 0.5), a2 = easeOut((t - 3.4) / 0.5);
    vCircle(g, s.imD, 300, 1290, 52 * Math.max(0.01, easeBack((t - 0.5) / 0.6)), "#9ff6e9", a1);
    vText(g, d.drawer || "", 300, 1372, 440, 34, "700", "#fff", "center", a1); vText(g, "desenhou", 300, 1412, 440, 24, "600", "#9ff6e9", "center", a1);
    vCircle(g, s.imG, 780, 1290, 52 * Math.max(0.01, easeBack((t - 3.4) / 0.6)), "#ffd34d", a2);
    vText(g, d.guesser || "", 780, 1372, 440, 34, "700", "#fff", "center", a2); vText(g, "acertou" + (d.secs != null ? " em " + d.secs + " s" : "") + " · +" + d.pts + " pt" + (d.pts === 1 ? "" : "s"), 780, 1412, 440, 24, "600", "#ffd34d", "center", a2);
    const pw = easeBack((t - 3.6) / 0.6);
    if (t > 3.6) { g.save(); g.translate(W / 2, 1530); g.scale(Math.max(0.01, pw), Math.max(0.01, pw)); vText(g, "Era: " + String(d.word || "").toLocaleUpperCase("pt-BR"), 0, 0, W - 2 * M, 66, "800", "#ffd34d", "center"); g.restore(); }
  }
  function frameC(t) {
    const names = winners.map(e => e.name).join(" & ");
    vText(g, sessionOver ? "Campeões!" : "Na liderança", W / 2, 330, W - 2 * M, 80, "800", "#ffd34d", "center", t / 0.5);
    const k = easeBack(t / 0.7), im = win ? imgOf.get(win) : null;
    vCircle(g, im, W / 2, 820, 190 * Math.max(0.01, k), "#ffd34d", 1);
    if (win) { vText(g, "👑", W / 2, 590 - (1 - clamp01(k)) * 40, 120, 100, "400", "#fff", "center", t / 0.5);
      vText(g, names, W / 2, 1100, W - 2 * M, 64, "800", "#fff", "center", (t - 0.4) / 0.5);
      vText(g, win.score + (win.score === 1 ? " ponto" : " pontos"), W / 2, 1190, W - 2 * M, 54, "800", "#ffd34d", "center", (t - 0.6) / 0.5); }
    for (let i = 0; i < 24; i++) { const ph = (i * 0.37) % 1, x = (i * 97 + t * 40) % W, y = 250 + ((t * 260 + i * 140) % 1400); g.fillStyle = ["#ffd34d", "#9ff6e9", "#ff7ab8", "#7aa8ff"][i % 4]; g.globalAlpha = 0.85; g.fillRect(x, y, 14, 14 + ph * 10); g.globalAlpha = 1; }
    vText(g, "Minha Lousa", W / 2, 1618, W - 2 * M, 26, "700", "#8a8cc8", "center");
  }
  // efeitos sonoros na linha do tempo
  const events = []; const at = (t, fn) => events.push({ t, fn });
  { let acc = 0;
    rankTimes.forEach((rk, i) => { const rt = 0.7 + i * 1.5; at(rt, () => SFX.sweep()); for (let k = 0; k < 11; k++) at(rt + 0.1 + k * 0.11, () => SFX.tick(5)); at(rt + 1.3, () => SFX.reveal()); });
    at(0.7 + (rankTimes.length - 1) * 1.5 + 1.35, () => SFX.podium());
    others.forEach((e, i) => at(5.4 + i * 0.25 + 0.1, () => SFX.open()));
    acc = segs[0].dur;
    segs.forEach(sg => { if (sg.k === "B") { const b0 = acc; at(b0 + 0.05, () => SFX.open()); for (let k = 0; k < 10; k++) at(b0 + 0.8 + k * 0.26, () => SFX.tool()); at(b0 + 3.4, () => SFX.solve()); at(b0 + 3.65, () => SFX.reveal()); } else if (sg.k === "C") { at(acc + 0.05, () => SFX.win()); at(acc + 1.2, () => SFX.teams()); } acc += sg.dur; });
    events.sort((a, b) => a.t - b.t);
  }
  // gravação
  const stream = cv.captureStream(30);
  const tapNode = SFX.tap();
  if (tapNode) tapNode.stream.getAudioTracks().forEach(tr => stream.addTrack(tr));
  const mime = ["video/webm;codecs=vp9", "video/webm", "video/mp4;codecs=avc1", "video/mp4"].find(m => MediaRecorder.isTypeSupported(m)) || "";
  const ext = (!mime || mime.includes("mp4")) ? "mp4" : "webm", chunks = [];
  const rec = new MediaRecorder(stream, Object.assign(mime ? { mimeType: mime } : {}, { videoBitsPerSecond: 6000000 }));
  rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise(r => rec.onstop = r);
  rec.start();
  const nextFrame = () => new Promise(r => { let done = false; const f = () => { if (!done) { done = true; r(); } }; requestAnimationFrame(f); setTimeout(f, 60); });
  try {
    const t0 = performance.now();
    for (;;) {
      const t = (performance.now() - t0) / 1000;
      if (t >= total) break;
      let acc = 0, seg = segs[segs.length - 1], lt = 0, bi = 0;
      for (let i = 0; i < segs.length; i++) { if (t < acc + segs[i].dur) { seg = segs[i]; lt = t - acc; break; } acc += segs[i].dur; }
      if (seg.k === "B") bi = scenes.indexOf(seg.s);
      g.globalAlpha = 1; g.drawImage(base, 0, 0);
      if (seg.k === "A") frameA(lt); else if (seg.k === "B") frameB(lt, seg.s, bi, scenes.length); else frameC(lt);
      const fade = Math.min(1, lt / 0.3, (seg.dur - lt) / 0.3), isEdge = !(seg.k === "A" && lt < 0.3) ;
      if (fade < 1 && isEdge) { g.fillStyle = "rgba(17,17,38," + (1 - fade).toFixed(3) + ")"; g.fillRect(0, 0, W, H); }
      while (events.length && events[0].t <= t) { try { events.shift().fn(); } catch (e) {} }
      if (onProgress) onProgress(Math.min(1, t / total));
      await nextFrame();
    }
    await new Promise(r => setTimeout(r, 250));
  } finally {
    if (rec.state !== "inactive") rec.stop();
    await stopped;
    if (tapNode) SFX.untap(tapNode);
    stream.getTracks().forEach(tr => tr.stop()); cv.remove(); render();
  }
  return { blob: new Blob(chunks, { type: mime ? mime.split(";")[0] : "video/mp4" }), ext, scenes: scenes.length, seconds: total };
}
document.getElementById("finalVideo").addEventListener("click", async () => {
  if (exporting) return;
  exporting = true;
  const banner = document.getElementById("exportBanner"), btns = ["finalVideo", "finalPng", "finalNew", "finalClose"].map(id => document.getElementById(id));
  btns.forEach(b => b.disabled = true); banner.hidden = false; banner.textContent = "Gerando vídeo do placar… mantenha esta aba aberta";
  try {
    const res = await scoreboardVideo(p => { banner.textContent = "Gerando vídeo do placar… " + Math.round(p * 100) + "% (mantenha esta aba aberta)"; });
    deliver(res.blob, (sessionOver ? "placar-final" : "placar-parcial") + "-story." + res.ext);
  } catch (err) { alert("Não foi possível exportar o vídeo do placar: " + err.message); }
  finally { banner.hidden = true; btns.forEach(b => b.disabled = false); exporting = false; }
});
