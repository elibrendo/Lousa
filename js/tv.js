// ===== Tela da TV: segunda janela (sem as palavras), sincronizada ao vivo com este notebook =====
const TV_CSS = '\nbody.tv{background:#1d1d3f;display:flex}\nbody.tv button{display:none!important}\nbody.tv main{flex:1;min-width:0;min-height:0;display:flex;background:#1d1d3f}\nbody.tv .canvas-wrap{grid-template-columns:minmax(0,1fr)!important;grid-template-areas:"top" "turn" "board" "teams"!important;margin:10px;flex:1}\nbody.tv canvas{grid-area:board;display:block;width:100%;height:100%;cursor:none}\n#tvOv .results-overlay{position:fixed!important;inset:0;z-index:50}\n#tvOv .who-card{width:min(460px,90%)!important}\n#tvOv #whoList{grid-template-columns:1fr!important}\n#tvPaused{position:fixed;top:14px;right:18px;z-index:60;background:#ffd34d;color:#3d2852;font-weight:900;font-size:24px;padding:8px 18px;border-radius:14px;box-shadow:0 4px 0 #bb7028}\n#tvLost{position:fixed;inset:0;z-index:90;background:#1d1d3ff2;color:#fff;font:800 26px ui-rounded,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:30px}\n[hidden]{display:none!important}\n';
const tvClientSrc = null;
let tvReady = false, tvTick = -1, tvBusy = false, tvDirtyTeams = true, tvLast = {}, tvAssets = new Map(), tvNew = [];

function tvClient() {
  const $ = id => document.getElementById(id);
  const cv = $("tvCanvas"), top = $("tvTop"), turn = $("tvTurn"), bot = $("tvBottom"), ov = $("tvOv");
  let bm = null, bg = "#ffffff"; const urls = [];
  function fit() { document.documentElement.style.setProperty("--ui", Math.max(0.68, Math.min(1.8, innerWidth / 1366, innerHeight / 760)).toFixed(3)); }
  function mk(u) {
    const i = u.indexOf(","), head = u.slice(5, i), body = u.slice(i + 1), mime = head.split(";")[0];
    let bytes;
    if (/;base64/.test(head)) { const bin = atob(body); bytes = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k); }
    else bytes = new TextEncoder().encode(decodeURIComponent(body));
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  }
  const un = h => h.replace(/src="@@(\d+)"/g, (m, i) => 'src="' + (urls[i] || "") + '"');
  function paint() {
    const d = window.devicePixelRatio || 1, w = Math.round(cv.clientWidth * d), h = Math.round(cv.clientHeight * d);
    if (!w || !h) return;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    const g = cv.getContext("2d");
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    if (bm) { const s = Math.min(w / bm.width, h / bm.height), dw = bm.width * s, dh = bm.height * s; g.drawImage(bm, (w - dw) / 2, (h - dh) / 2, dw, dh); }
  }
  function syncAttrs(o, n) {
    const keepScale = o.classList.contains("results-card") && o.style.scale;
    [...o.attributes].forEach(a => { if (!n.hasAttribute(a.name) && !(a.name === "style" && keepScale)) o.removeAttribute(a.name); });
    [...n.attributes].forEach(a => { if (o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value); });
  }
  function morph(a, b) {
    const bc = b.childNodes;
    for (let i = 0; i < bc.length; i++) {
      const n = bc[i], o = a.childNodes[i];
      if (!o) { a.appendChild(n.cloneNode(true)); continue; }
      if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName) { a.replaceChild(n.cloneNode(true), o); continue; }
      if (n.nodeType === 3) { if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue; continue; }
      if (n.nodeType === 1) { syncAttrs(o, n); morph(o, n); }
    }
    while (a.childNodes.length > bc.length) a.removeChild(a.lastChild);
  }
  function setHtml(el, html) { const t = document.createElement("template"); t.innerHTML = html; morph(el, t.content); }
  function fitCards() {
    const ui = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ui")) || 1;
    ov.querySelectorAll(".results-card").forEach(el => {
      const h = el.offsetHeight || 1, w = el.offsetWidth || 1;
      const scale = Math.min(ui, (innerHeight * 0.94) / h, (innerWidth * 0.96) / w).toFixed(3);
      if (el.style.scale !== scale) el.style.scale = scale;
    });
  }
  new ResizeObserver(paint).observe(cv);
  addEventListener("resize", () => { fit(); paint(); fitCards(); }); fit();
  addEventListener("message", e => {
    if (e.source !== opener) return;
    const d = e.data || {};
    if (d.t === "frame") { if (bm && bm.close) bm.close(); bm = d.bm; bg = d.bg || bg; cv.style.background = bg; cv.parentElement.style.background = bg; paint(); }
    else if (d.t === "state") {
      (d.assets || []).forEach(a => { urls[a[0]] = mk(a[1]); });
      if (d.top != null) setHtml(top, un(d.top));
      if (d.turn != null) setHtml(turn, un(d.turn));
      if (d.bottom != null) {
        setHtml(bot, un(d.bottom));
        const cur = bot.querySelector(".team-card.playing");
        if (cur) bot.scrollTo({ left: Math.max(0, cur.offsetLeft - (bot.clientWidth - cur.offsetWidth) / 2) });
      }
      if (d.ov != null) { setHtml(ov, un(d.ov.join(""))); fitCards(); requestAnimationFrame(fitCards); }
      if (d.paused != null) $("tvPaused").hidden = !d.paused;
    }
  });
  document.addEventListener("dblclick", () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); });
  setInterval(() => { $("tvLost").hidden = !!(window.opener && !window.opener.closed); }, 1000);
  try { opener.postMessage({ t: "ready" }, "*"); } catch (e) {}
}

function tvDoc() {
  const cssHref = new URL("css/style.css", location.href).href;
  const sprite = document.querySelector("body > svg").outerHTML;
  return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Minha Lousa — TV</title><link rel="stylesheet" href="' + cssHref + '"><style>' + TV_CSS + '</style><\/head><body class="tv">' + sprite +
    '<main><div class="canvas-wrap"><canvas id="tvCanvas"></canvas><section class="game-topbar" id="tvTop"></section><div id="tvTurn" style="display:contents"></div><section class="bottom-bar" id="tvBottom"></section></div></main>' +
    '<div id="tvOv"></div><div id="tvPaused" hidden>⏸ PAUSADO</div><div id="tvLost" hidden>Conexão com o notebook perdida.<br>Clique em “Tela da TV” no jogo para reconectar.</div>' +
    '<script>(' + tvClient.toString() + ')()<\/script><\/body><\/html>';
}
function updateTvUI() {
  const o = tvOpen();
  document.querySelectorAll(".tv-open-btn").forEach(b => b.classList.toggle("active", o));
  const st = document.getElementById("tvStatus");
  if (st) st.textContent = o ? "Tela da TV: aberta e sincronizada." : "Tela da TV: fechada.";
}
function openTV() {
  if (tvOpen()) { tvWin.focus(); updateTvUI(); return; }
  const w = window.open("", "minhaLousaTV", "popup=yes,width=1280,height=720");
  if (!w) { alert("O navegador bloqueou a janela da TV. Permita pop-ups para este arquivo e tente de novo."); return; }
  tvWin = w; tvReady = false;
  try { w.document.open(); w.document.write(tvDoc()); w.document.close(); } catch (e) { alert("Não foi possível abrir a tela da TV: " + e.message); return; }
  try { w.focus(); } catch (e) {}
  if (timerStarted && !roundFinished) applyPrivacy(false);
  refreshRatioGuard(); updateTvUI();
}
const tvPack = h => h.replace(/src="(data:[^"]+)"/g, (m, u) => { let id = tvAssets.get(u); if (id == null) { id = tvAssets.size; tvAssets.set(u, id); tvNew.push([id, u]); } return 'src="@@' + id + '"'; });
function tvSend() {
  if (!tvOpen() || !tvReady) return;
  const msg = { t: "state" };
  const put = (k, v) => { if (tvLast[k] !== v) { tvLast[k] = v; msg[k] = v; } };
  put("top", tvPack(document.querySelector(".game-topbar").innerHTML));
  put("turn", turnInfo.hidden ? "" : tvPack(turnInfo.outerHTML));
  const ovs = [...document.querySelectorAll(".results-overlay")].filter(el => !el.hidden && !el.classList.contains("settings-overlay")).map(el => tvPack(el.outerHTML));
  const ovKey = JSON.stringify(ovs); if (tvLast.ov !== ovKey) { tvLast.ov = ovKey; msg.ov = ovs; }
  put("paused", !!timerPaused && timerStarted && !roundFinished);
  if (tvDirtyTeams) { tvDirtyTeams = false; put("bottom", tvPack(document.querySelector(".bottom-bar").innerHTML)); }
  if (Object.keys(msg).length > 1 || tvNew.length) { if (tvNew.length) { msg.assets = tvNew; tvNew = []; } try { tvWin.postMessage(msg, "*"); } catch (e) {} }
}
window.addEventListener("message", e => {
  if (tvWin && e.source === tvWin && e.data && e.data.t === "ready") { tvReady = true; tvLast = {}; tvAssets = new Map(); tvNew = []; tvDirtyTeams = true; tvTick = -1; tvSend(); updateTvUI(); }
});
const _renderTeamsOrig = renderTeams;
renderTeams = function () { _renderTeamsOrig.apply(this, arguments); tvDirtyTeams = true; };
setInterval(tvSend, 120);
// desenho ao vivo: envia a lousa sempre que ela muda
setInterval(() => {
  if (!tvOpen() || !tvReady || tvBusy || renderTick === tvTick) return;
  tvTick = renderTick; tvBusy = true;
  createImageBitmap(canvas).then(bm => { try { tvWin.postMessage({ t: "frame", bm, bg: currentBoardColor() }, "*", [bm]); } catch (e) {} tvBusy = false; }).catch(() => { tvBusy = false; });
}, 33);
let tvWasOpen = false;
setInterval(() => {
  const o = tvOpen();
  if (tvWasOpen && !o) { tvReady = false; if (timerStarted && !roundFinished) applyPrivacy(true); refreshRatioGuard(); updateTvUI(); }
  tvWasOpen = o;
}, 500);
window.addEventListener("pagehide", () => { try { if (tvOpen()) tvWin.close(); } catch (e) {} });
document.querySelectorAll(".tv-open-btn").forEach(b => b.addEventListener("click", openTV));
updateTvUI();

// ----- palavras já usadas -----
function updateUsedInfo() {
  const el = document.getElementById("usedInfo"); if (!el) return;
  const bank = [...new Set(getSelectedThemes().flatMap(t => wordBank[t] || []))];
  el.textContent = "Já jogadas: " + bank.filter(w => usedWords.has(wkey(w))).length + " de " + bank.length + " palavras dos temas selecionados. Elas não voltam a ser sorteadas.";
}
document.getElementById("resetUsed").addEventListener("click", () => { usedWords.clear(); saveUsed(); updateUsedInfo(); });
updateUsedInfo();
