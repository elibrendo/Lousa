// ===== Salvamento automático da partida (até a última rodada encerrada) =====
// Guarda no IndexedDB (cabe os desenhos em PNG); ao abrir, pergunta se quer continuar.
const SaveDB = (() => {
  let dbp = null;
  const db = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open("lousa", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = (mode, fn) => db().then(d => new Promise((res, rej) => {
    const t = d.transaction("kv", mode), req = fn(t.objectStore("kv"));
    t.oncomplete = () => res(req.result); t.onerror = () => rej(t.error);
  }));
  return { get: k => tx("readonly", s => s.get(k)), put: (k, v) => tx("readwrite", s => s.put(v, k)), del: k => tx("readwrite", s => s.delete(k)) };
})();
const SAVE_KEY = "partida";
const SAVE_FIELDS = ["teamMode", "playerGroup", "customGrouping", "durationSeconds", "roundsPerTeam", "points1", "points2", "points3", "points4", "points5",
  ...Array.from({length: 8}, (_, i) => "player" + (i + 1)), ...Array.from({length: 8}, (_, i) => "gender" + (i + 1))].filter(id => document.getElementById(id));
let persistReady = false; // só salva depois de decidir (na abertura) se continua a partida antiga
function saveSession() {
  if (!persistReady) return;
  try {
    if (turnNumber === 0 && !sessionOver) { SaveDB.del(SAVE_KEY).catch(() => {}); return; }
    const snap = {
      v: 1, savedAt: new Date(),
      fields: Object.fromEntries(SAVE_FIELDS.map(id => [id, document.getElementById(id).value])),
      themes: getSelectedThemes(), words: confirmedWordsCount, groupKey,
      appliedTeamMode, appliedSignature, appliedAllTimes, appliedCouples,
      teamNames, teamMembers, teamScores, individualScores: { ...individualScores }, stats,
      turnOrder, turnNumber, sessionOver, roleSchedule,
      gameLog, adjustLog, gameDrawings, sessionStartedAt
    };
    SaveDB.put(SAVE_KEY, typeof structuredClone === "function" ? structuredClone(snap) : snap).catch(() => {});
  } catch (e) {}
}
function restoreSession(s) {
  Object.entries(s.fields || {}).forEach(([id, v]) => { const el = document.getElementById(id); if (el) el.value = v; });
  groupKey = s.groupKey || groupKey;
  syncGroupModes(); document.getElementById("teamMode").value = s.fields.teamMode;
  document.getElementById("customTeamGroups").hidden = s.fields.teamMode !== "custom";
  COUPLES.forEach((_, i) => { document.getElementById("couple" + i).checked = s.appliedCouples.includes(i); });
  individualThemeCheckboxes.forEach(cb => { cb.checked = (s.themes || []).includes(cb.value); });
  updateThemeDisplay();
  wordsSelect.value = String(s.words); confirmedWordsCount = s.words; syncWordCountUI(); refreshWordsConfirm();
  ({ appliedTeamMode, appliedSignature, appliedAllTimes, appliedCouples, teamNames, teamMembers, teamScores, stats, turnOrder, turnNumber, sessionOver, roleSchedule } = s);
  individualScores = Object.assign(Object.create(null), s.individualScores);
  gameLog.splice(0, Infinity, ...s.gameLog); adjustLog.splice(0, Infinity, ...s.adjustLog); gameDrawings.splice(0, Infinity, ...s.gameDrawings);
  sessionStartedAt = s.sessionStartedAt;
  const names = Array.from({length: 8}, (_, i) => document.getElementById("player" + (i + 1)).value.trim());
  setPhotoIdx(names); setGenders(names, false);
  buildTeamCards();
  refreshIdleTimer(); refreshDrawControls(); updateGroupHint();
  renderTeams();
  if (sessionOver) { showFinal(); return; }
  const btn = document.getElementById("setWords");
  btn.innerHTML = ico("play") + " Iniciar jogo"; btn.classList.add("ready-to-play");
  showTurnAnnouncement();
}
function offerResume() {
  SaveDB.get(SAVE_KEY).then(s => {
    if (!s || s.v !== 1 || !(s.turnNumber > 0 || s.sessionOver)) { persistReady = true; return; }
    const total = s.turnNumber;
    const placar = s.teamNames.map((n, t) => ({ n, p: s.teamScores[t] }));
    const indiv = s.appliedTeamMode === "all" || s.appliedTeamMode === "one";
    const rows = indiv ? Object.entries(s.individualScores).map(([n, p]) => ({ n, p })) : placar;
    rows.sort((a, b) => b.p - a.p);
    document.getElementById("resumeInfo").innerHTML =
      "Salva em " + esc(s.savedAt.toLocaleString("pt-BR")) + "<br>" +
      (s.sessionOver ? "<b>Partida encerrada</b> — " : "") + "<b>" + total + "</b> rodada(s) já jogada(s)<br><br>" +
      rows.slice(0, 8).map(r => esc(r.n) + ": <b>" + r.p + "</b>").join("<br>");
    const ov = document.getElementById("resumeOverlay");
    ov.hidden = false;
    document.getElementById("resumeYes").onclick = () => { ov.hidden = true; persistReady = true; try { restoreSession(s); } catch (e) { console.error(e); alert("Não foi possível restaurar a partida salva."); } };
    document.getElementById("resumeNo").onclick = () => { ov.hidden = true; persistReady = true; SaveDB.del(SAVE_KEY).catch(() => {}); };
  }).catch(() => { persistReady = true; });
}
// Pede confirmação ao fechar/recarregar no meio de uma rodada (ela ainda não foi salva).
window.addEventListener("beforeunload", e => { if (timerStarted && !roundFinished) { e.preventDefault(); e.returnValue = ""; } });
