// ===== Vídeo de reprodução (desde o começo, visível na lousa e na TV) e exportação do jogo em .zip =====
async function recordReplay(drawings, opt) {
  opt = opt || {};
  if (!canvas.captureStream || !window.MediaRecorder) throw new Error("Este navegador não oferece gravação de vídeo por canvas. Use uma versão recente do Chrome, Edge ou Safari.");
  const stream = canvas.captureStream(30);
  const mime = ["video/webm;codecs=vp9", "video/webm", "video/mp4;codecs=avc1", "video/mp4"].find(m => MediaRecorder.isTypeSupported(m)) || "";
  const ext = (!mime || mime.includes("mp4")) ? "mp4" : "webm";
  const chunks = [];
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise(r => rec.onstop = r);
  rec.start();
  const replay = [];
  try {
    for (let di = 0; di < drawings.length; di++) {
      if (opt.progress) opt.progress(di + 1, drawings.length);
      replay.length = 0;
      const list = drawings[di];
      let total = 0;
      list.forEach(c => { total += (c.type === "pen" || c.type === "eraser") ? Math.max(1, (c.points || []).length - 1) : ["line", "rect", "circle"].includes(c.type) ? 12 : 1; });
      const per = opt.budgetMs ? Math.max(1, Math.ceil(total / (opt.budgetMs / 33))) : 1;
      const ms = opt.budgetMs ? 33 : null;
      for (const command of list) {
        if (command.type === "pen" || command.type === "eraser") {
          const pts = command.points || [];
          if (pts.length < 2) { replay.push(command); renderReplay(replay); await sleep(ms || 30); continue; }
          for (let i = 1; i < pts.length; i += per) {
            const e = Math.min(pts.length - 1, i + per - 1);
            renderReplay(replay.concat({ ...command, points: pts.slice(0, e + 1) }));
            await sleep(ms || 6);
          }
          replay.push(command);
        } else if (["line", "rect", "circle"].includes(command.type)) {
          const a = command.a, b = command.b;
          const steps = Math.max(8, Math.min(35, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 12)));
          for (let i = 1; i <= steps; i += per) {
            const t = i / steps;
            renderReplay(replay.concat([{ ...command, b: { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t } }]));
            await sleep(ms || 7);
          }
          replay.push(command);
        } else { replay.push(command); renderReplay(replay); await sleep(ms ? 16 : 33); }
      }
      renderReplay(replay);
      await sleep(drawings.length > 1 ? 700 : 167);
    }
  } finally {
    if (rec.state !== "inactive") rec.stop();
    await stopped;
    stream.getTracks().forEach(t => t.stop());
    render();
  }
  return { blob: new Blob(chunks, { type: mime ? mime.split(";")[0] : "video/mp4" }), ext };
}
// Fecha as configurações para a reprodução aparecer na lousa (e na TV) e mostra o andamento
async function renderVideo(drawings, budgetMs, label) {
  const banner = document.getElementById("exportBanner");
  const wasOpen = !settingsOverlay.hidden;
  closeSettings();
  banner.hidden = false; banner.textContent = label + "…";
  const lock = ["exportVideo", "exportGame", "setWords", "drawOrder"].map(id => document.getElementById(id)).filter(Boolean);
  lock.forEach(b => b.disabled = true);
  try {
    return await recordReplay(drawings, { budgetMs, progress: (a, n) => { banner.textContent = label + " — desenho " + a + " de " + n + "…"; } });
  } finally {
    banner.hidden = true; lock.forEach(b => b.disabled = false);
    if (typeof renderTeams === "function") renderTeams();
    if (wasOpen) settingsOverlay.hidden = false;
  }
}
async function exportDrawingVideo() {
  if (exporting) return;
  if (!commands.length && !drawingArchive.length) { alert("Faça um desenho antes de exportar o vídeo."); return; }
  const drawings = drawingArchive.map(d => d.slice());
  if (commands.length) drawings.push(commands.slice());
  exporting = true;
  try {
    const res = await renderVideo(drawings, null, "Gerando vídeo do desenho");
    if (res) deliver(res.blob, "minha-lousa-replay." + res.ext);
  } catch (err) { alert("Não foi possível exportar o vídeo: " + err.message); }
  finally { exporting = false; }
}
function renderReplay(list) {
  const saved = commands;
  commands = list;
  selectedShape = null;
  render();
  commands = saved;
}
document.getElementById("exportVideo").addEventListener("click", exportDrawingVideo);
