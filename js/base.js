const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ico = n => '<svg class="ic" aria-hidden="true"><use href="#i-' + n + '"/></svg>';
// Fotos por posição do jogador (1 a 8).
const DEFAULT_NAMES = ["Eliezer","Duda","Amanda","Ezequiel","Felipe","M. Antonia","Patrick","Priscila"];
const PHOTO_IMGS = PHOTO_SRC.map(s => { const i = new Image(); i.src = s; return i; });
const DEFAULT_IMG = new Image(); DEFAULT_IMG.src = DEFAULT_AVATAR;
let photoIdx = Object.create(null);
// A foto vai com o nome (quem ainda não tem foto usa o avatar padrão). Para novas fotos: acrescente o nome aqui e a imagem em PHOTO_SRC.
const PHOTO_BY_NAME = { "Eliezer": 0, "Duda": 1, "Amanda": 2, "Ezequiel": 3, "Felipe": 4, "M. Antonia": 5, "Patrick": 6, "Priscila": 7 };
function setPhotoIdx(names) { photoIdx = Object.create(null); names.forEach(n => { if (n) photoIdx[n] = (n in PHOTO_BY_NAME) ? PHOTO_BY_NAME[n] : -1; }); }
setPhotoIdx(DEFAULT_NAMES);
function playerPhoto(n) { const i = photoIdx[n]; return i >= 0 ? PHOTO_SRC[i] : DEFAULT_AVATAR; }
function playerImg(n) { const i = photoIdx[n]; return i >= 0 ? PHOTO_IMGS[i] : DEFAULT_IMG; }
const avatarCache = Object.create(null);
// Avatar de equipe: rosto de cada jogador dividido dentro de um círculo.
function compositeAvatar(members) {
  members = members || [];
  if (!members.length) return DEFAULT_AVATAR;
  if (members.length === 1) return playerPhoto(members[0]);
  const key = members.map(n => photoIdx[n] >= 0 ? photoIdx[n] : "d").join(",");
  if (avatarCache[key]) return avatarCache[key];
  const N = 160, h = N / 2, c = document.createElement("canvas"); c.width = c.height = N;
  const g = c.getContext("2d"), imgs = members.slice(0, 4).map(playerImg);
  const R = imgs.length <= 2 ? [[0,0,h,N],[h,0,h,N]] : imgs.length === 3 ? [[0,0,h,N],[h,0,h,h],[h,h,h,h]] : [[0,0,h,h],[h,0,h,h],[0,h,h,h],[h,h,h,h]];
  let ready = true;
  g.save(); g.beginPath(); g.arc(h, h, h - 1, 0, Math.PI * 2); g.clip();
  g.fillStyle = "#3a3b70"; g.fillRect(0, 0, N, N);
  imgs.forEach((im, i) => {
    const [x, y, w, ht] = R[i];
    if (!(im.complete && im.naturalWidth)) { ready = false; return; }
    g.save(); g.beginPath(); g.rect(x, y, w, ht); g.clip();
    const s = Math.max(w, ht); g.drawImage(im, x + w / 2 - s / 2, y + ht / 2 - s / 2, s, s); g.restore();
  });
  g.strokeStyle = "#fff"; g.lineWidth = 4; g.beginPath();
  g.moveTo(h, 0); g.lineTo(h, N);
  if (imgs.length === 3) { g.moveTo(h, h); g.lineTo(N, h); } else if (imgs.length >= 4) { g.moveTo(0, h); g.lineTo(N, h); }
  g.stroke(); g.restore();
  g.beginPath(); g.arc(h, h, h - 2, 0, Math.PI * 2); g.lineWidth = 4; g.stroke();
  const url = c.toDataURL("image/png"); if (ready) avatarCache[key] = url; return url;
}
let phraseHint = false;
try { phraseHint = localStorage.getItem("phraseHint") === "1"; } catch (e) {}
const isPhrase = w => !!w && /\s/.test(String(w).trim());
const hintMask = (w, ends) => String(w).trim().split(/\s+/).map(t => { const a = [...t]; if (a.length < 2) return t; return a[0] + "*".repeat(Math.max(0, a.length - (ends ? 2 : 1))) + (ends ? a[a.length - 1] : ""); }).join(" ");
function maskWord(w) { w = String(w).trim(); return w.charAt(0).toLocaleUpperCase("pt-BR") + w.slice(1).replace(/\S/g, "*"); }
function setPauseIcon(p) { document.getElementById("pauseTimer").innerHTML = ico(p ? "play" : "pause"); }

// ===== Proteção para transmissão na TV: fora da proporção 16:9, palavras não acertadas ficam ocultas =====
let tvRatio = 16 / 9;
try { const v = parseFloat(localStorage.getItem("tvRatio")); if (v > 1 && v < 4) tvRatio = v; } catch (e) {}
const RATIO_TOL = 0.03;
const ratioOk = () => true; // proteção por proporção 16:9 desativada (a tela da TV cuida disso)
const hideIfBad = w => ratioOk() ? w : "*****";
let wantHidden = false;
function refreshRatioGuard() {
  const ok = ratioOk();
  const warn = document.getElementById("ratioWarn"); if (warn) warn.hidden = ok;
  const st = document.getElementById("ratioStatus");
  if (st) st.textContent = tvOpen() ? "Tela da TV aberta: as palavras só aparecem neste notebook, então a proteção de proporção fica desligada." : "Proporção atual da janela: " + (innerWidth / innerHeight).toFixed(2) + ":1 · Proporção da TV: " + tvRatio.toFixed(2) + ":1 · " + (ok ? "OK, palavras liberadas." : "FORA — palavras ocultas.");
  applyPrivacy(wantHidden);
  updateWordDisplay();
  if (typeof updateTvUI === "function") updateTvUI();
  if (typeof historyOverlay !== "undefined" && !historyOverlay.hidden) renderHistory();
}
let tvWin = null, renderTick = 0;
const tvOpen = () => !!(tvWin && !tvWin.closed);
let hideTimer = null;
// Palavras ficam visíveis por 5 s (início da rodada e a cada acerto) e depois voltam a ser ocultadas.
function showWordsFor(ms) { applyPrivacy(false); clearTimeout(hideTimer); hideTimer = null; } // palavras ficam sempre visíveis (sem ocultar automático)
