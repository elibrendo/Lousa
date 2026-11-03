// ===== v0.18: palavras sem repetição, pesquisa, gênero, exportação =====
const MQ_MOBILE = "(max-width:820px), (max-height:520px) and (orientation:landscape)";
const isMobileLayout = () => matchMedia(MQ_MOBILE).matches;
async function saveBlob(blob, filename) {
  try {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); return; }
  } catch (err) { if (err && err.name === "AbortError") return; }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
const wkey = w => String(w).trim().toLocaleLowerCase("pt-BR");
const USED_KEY = "lousaPalavrasUsadas";
let usedWords = new Set();
try { JSON.parse(localStorage.getItem(USED_KEY) || "[]").forEach(w => usedWords.add(w)); } catch (e) {}
const saveUsed = () => { try { localStorage.setItem(USED_KEY, JSON.stringify([...usedWords])); } catch (e) {} };
function markUsed(words) { words.filter(Boolean).forEach(w => usedWords.add(wkey(w))); saveUsed(); }
const drawnSeen = new Set();
const gameDrawings = [];
let exporting = false;
const DEFAULT_GENDERS = ["m", "f", "f", "m", "m", "f"];
let genderOf = Object.create(null);
function setGenders(names, useDefault) {
  genderOf = Object.create(null);
  names.forEach((n, i) => { if (!n) return; const sel = document.getElementById("gender" + (i + 1)); genderOf[n] = useDefault ? (DEFAULT_GENDERS[i] || "m") : ((sel && sel.value) || "m"); });
}
setGenders(["Eliezer","Duda","Amanda","Ezequiel","Felipe","M. Antonia"], true);
const teamIsFem = t => { const m = teamMembers[t] || []; return m.length > 0 && m.every(n => genderOf[n] === "f"); };
const lblNext = t => "👀 " + (teamIsFem(t) ? "Próximas" : "Próximos") + " a jogar";
const lblDone = t => "✅ Já concluíram";
function drawInfo(kind, word, secs, pts) {
  const r = (typeof currentRoles === "function") ? currentRoles() : null;
  return { kind, word, secs, pts, turn: turnNumber + 1, round: r ? r.round : null, team: r ? teamNames[r.team] : "", drawer: r ? teamMembers[r.team][r.drawer] : "", guesser: r && !isOneMode() ? teamMembers[r.team][r.guesser] : "", wi: -1 };
}
const safeName = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
function drawFileName(d, i) {
  const tag = d.kind === "acertou" ? "acertou" + (d.secs != null ? "-" + d.secs + "s" : "") : "nao-acertou";
  return String(i + 1).padStart(3, "0") + "_rodada" + String(d.turn).padStart(2, "0") + "_" + safeName(d.drawer || "desenho") + "-desenhou_" + safeName(d.word || "palavra") + "_" + tag;
}
function dataUrlToBytes(u) { const b = atob(u.split(",")[1]), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
// ZIP simples (sem compressão): suficiente para PNG/vídeo/texto
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function makeZip(files) {
  const enc = new TextEncoder(), now = new Date();
  const dt = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
  const dd = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;
  const parts = [], central = []; let offset = 0;
  files.forEach(f => {
    const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, dt, true); lh.setUint16(12, dd, true); lh.setUint32(14, crc, true); lh.setUint32(18, size, true); lh.setUint32(22, size, true);
    lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), name, f.data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
    ch.setUint16(12, dt, true); ch.setUint16(14, dd, true); ch.setUint32(16, crc, true); ch.setUint32(20, size, true); ch.setUint32(24, size, true);
    ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + size;
  });
  let cdSize = 0; central.forEach(p => cdSize += p.length);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: "application/zip" });
}
function deliver(blob, name) {
  if (typeof saveBlob === "function" && matchMedia("(pointer:coarse)").matches) return saveBlob(blob, name);
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
// Classificação sem rolagem: encolhe o cartão até caber inteiro na tela
function fitFinal() {
  const ov = document.getElementById("finalOverlay"), el = ov && ov.querySelector(".final-card");
  if (!el || ov.hidden) return;
  el.style.scale = "";
  const h = el.offsetHeight, w = el.offsetWidth;
  const k = Math.min(1, (innerHeight - 24) / h, (innerWidth - 16) / w);
  el.style.scale = k < 0.999 ? k.toFixed(3) : "";
}
window.addEventListener("resize", () => fitFinal());
