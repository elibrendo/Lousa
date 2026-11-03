// ===== Placar em PNG =====
function loadImg(src) { return new Promise(res => { if (!src) return res(null); const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }); }
function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
async function scoreboardPNG() {
  // Formato story (1080x1920). Conteúdo dentro da área segura das redes: ~250 px livres no topo e ~300 px embaixo.
  const lb = buildLeaderboard(), aw = computeAwards(), list = lb.leaderboard, indiv = lb.individualMode;
  const W = 1080, H = 1920, M = 60, F = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#3a3a92"); bg.addColorStop(0.5, "#1f1f48"); bg.addColorStop(1, "#111126");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W / 2, 560, 40, W / 2, 560, 640); glow.addColorStop(0, "rgba(255,211,77,.22)"); glow.addColorStop(1, "rgba(255,211,77,0)");
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(255,255,255,.05)"; [[110, 140, 90], [980, 330, 60], [90, 1720, 110], [1000, 1800, 70], [960, 1000, 40]].forEach(c => { g.beginPath(); g.arc(c[0], c[1], c[2], 0, 7); g.fill(); });
  g.textBaseline = "middle";
  const txt = (t, x, y, maxW, size, weight, color, align) => { let s = size; g.font = weight + " " + s + "px " + F; while (g.measureText(t).width > maxW && s > 14) { s -= 2; g.font = weight + " " + s + "px " + F; } g.fillStyle = color; g.textAlign = align || "center"; g.fillText(t, x, y); };
  const circleImg = (im, cx, cy, r, ring) => { g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fillStyle = "#3b3b78"; g.fill(); g.clip(); if (im) g.drawImage(im, cx - r, cy - r, r * 2, r * 2); g.restore(); if (ring) { g.beginPath(); g.arc(cx, cy, r, 0, 7); g.lineWidth = 7; g.strokeStyle = ring; g.stroke(); } };
  // cabeçalho
  txt(sessionOver ? "Classificação final" : "Classificação parcial", W / 2, 300, W - 2 * M, 76, "800", "#ffd34d");
  txt((indiv ? "Individual" : "Por equipe") + " · " + new Date().toLocaleDateString("pt-BR") + " · " + (turnNumber || 0) + " rodada(s)", W / 2, 366, W - 2 * M, 30, "600", "#9ff6e9");
  // fotos
  const dw = aw.drawWinners[0], gw = aw.guessWinners[0];
  const photoOf = e => indiv ? playerPhoto(e.name) : teamPhoto(e.team);
  const loaded = await Promise.all([...list.map(e => loadImg(photoOf(e))), loadImg(dw ? playerPhoto(dw.name) : null), loadImg(gw ? playerPhoto(gw.name) : null)]);
  const imgOf = new Map(list.map((e, i) => [e, loaded[i]])), dwImg = loaded[list.length], gwImg = loaded[list.length + 1];
  const top3 = list.filter(e => e.rank <= 3), others = list.filter(e => e.rank > 3);
  const order = [...top3.filter(e => e.rank === 2), ...top3.filter(e => e.rank === 1), ...top3.filter(e => e.rank === 3)];
  const baseY = others.length > 3 ? 940 : others.length ? 1000 : 1090;
  const stepH = { 1: 170, 2: 120, 3: 90 }, stepCol = { 1: ["#ffe27a", "#e0a21a"], 2: ["#eef2f8", "#a9b3c6"], 3: ["#f0b27c", "#b9723a"] };
  const colW = Math.min(330, (W - 2 * M) / Math.max(1, order.length)), x0 = (W - colW * order.length) / 2;
  order.forEach((e, i) => {
    const cx = x0 + colW * (i + 0.5), h = stepH[e.rank], sy = baseY - h, R = e.rank === 1 ? 100 : 76;
    const sg = g.createLinearGradient(0, sy, 0, baseY); sg.addColorStop(0, stepCol[e.rank][0]); sg.addColorStop(1, stepCol[e.rank][1]);
    g.fillStyle = sg; rrect(g, cx - colW / 2 + 8, sy, colW - 16, h, 18); g.fill();
    txt(e.rank + "º", cx, sy + h / 2, colW - 40, 62, "800", "#3d2852");
    txt(formatPoints(e.score) + (e.score === 1 ? " ponto" : " pontos"), cx, sy - 24, colW - 16, 38, "800", "#ffd34d");
    const lines = e.name.includes(" & ") ? e.name.split(" & ").map((t, k) => k ? "& " + t : t) : [e.name];
    lines.forEach((t, k) => txt(t, cx, sy - 72 - (lines.length - 1 - k) * 40, colW - 16, 34, "700", "#fff"));
    const nameTop = sy - 72 - (lines.length - 1) * 40 - 26, cy = nameTop - R - 8;
    circleImg(imgOf.get(e), cx, cy, R, stepCol[e.rank][0]);
    if (e.rank === 1) txt("👑", cx, cy - R - 26, 90, 60, "400", "#fff");
  });
  // demais participantes
  if (others.length) {
    let y = baseY + 56;
    txt("DEMAIS PARTICIPANTES", W / 2, y, W - 2 * M, 26, "800", "#c9cbff"); y += 26;
    const avail = 1300 - y, rowH = Math.min(68, avail / others.length), h = rowH - 8, ar = Math.min(22, h / 2 - 4);
    others.forEach((e, i) => {
      const ry = y + i * rowH;
      g.fillStyle = "rgba(255,255,255,.09)"; rrect(g, M, ry, W - 2 * M, h, 16); g.fill();
      txt(e.rank + "º", M + 44, ry + h / 2, 70, 30, "800", "#ffd34d");
      circleImg(imgOf.get(e), M + 112, ry + h / 2, ar, null);
      txt(e.name, M + 112 + ar + 18, ry + h / 2, 520, 30, "700", "#fff", "left");
      txt(formatPoints(e.score) + (e.score === 1 ? " pt" : " pts"), W - M - 28, ry + h / 2, 200, 30, "800", "#ffd34d", "right");
    });
  }
  // prêmios
  const ay = others.length ? 1330 : 1300, bw = (W - 2 * M - 24) / 2, ah = 250;
  const card = (x, title, w, im, detail) => {
    g.fillStyle = "rgba(255,255,255,.1)"; rrect(g, x, ay, bw, ah, 22); g.fill();
    txt(title, x + bw / 2, ay + 38, bw - 24, 28, "800", "#9ff6e9");
    if (!w) { txt("Ainda sem vencedor", x + bw / 2, ay + 140, bw - 24, 26, "600", "#ccd"); return; }
    circleImg(im, x + bw / 2, ay + 108, 42, "#ffd34d");
    txt(w.name, x + bw / 2, ay + 184, bw - 24, 44, "800", "#ffd34d");
    txt(detail, x + bw / 2, ay + 222, bw - 24, 22, "500", "#fff");
  };
  card(M, "🎨 Melhor desenhista", dw, dwImg, dw ? "Média de " + fmt1(dw.avg) + " pts por rodada" : "");
  card(M + bw + 24, "🎯 Quem mais acertou", gw, gwImg, gw ? gw.guessed + (gw.guessed === 1 ? " palavra descoberta" : " palavras descobertas") : "");
  txt("Minha Lousa", W / 2, 1618, W - 2 * M, 26, "700", "#8a8cc8");
  return cv.toDataURL("image/png");
}
document.getElementById("finalPng").addEventListener("click", async () => {
  try { const u = await scoreboardPNG(); deliver(new Blob([dataUrlToBytes(u)], { type: "image/png" }), (sessionOver ? "placar-final" : "placar-parcial") + ".png"); }
  catch (err) { alert("Não foi possível exportar o placar: " + err.message); }
});
const phraseHintEl = document.getElementById("phraseHint");
phraseHintEl.checked = phraseHint;
phraseHintEl.addEventListener("change", () => { phraseHint = phraseHintEl.checked; try { localStorage.setItem("phraseHint", phraseHint ? "1" : "0"); } catch (e) {} updateWordDisplay(); });
