function fitWordInputs() {
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById("word" + i); if (!el || el.offsetWidth === 0) continue;
    el.style.fontSize = ""; el.title = el.value;
    let fs = parseFloat(getComputedStyle(el).fontSize) || 14; const base = fs;
    while (el.scrollWidth > el.clientWidth + 1 && fs > 8) { fs -= 0.5; el.style.fontSize = fs + "px"; }
    const row = el.closest(".word-row"); if (row) row.style.setProperty("--wfs", Math.max(8, Math.min(12, fs - 1)) + "px");
  }
}
window.addEventListener("resize", () => fitWordInputs());
document.addEventListener("input", e => { if (e.target && /^word[1-5]$/.test(e.target.id)) fitWordInputs(); });
function updateWordDisplay() {
  for (let i = 0; i < 5; i++) {
    const word = roundWords[i];
    const mask = document.getElementById("mask" + (i + 1));
    const button = document.querySelector('[data-solve="' + (i + 1) + '"]');
    { const rw = button && button.closest(".word-row"); if (rw) rw.dataset.mask = word ? ((phraseHint && isPhrase(word)) ? hintMask(word, false) : word.trim().replace(/\S/g, "*")) : "*****"; }
  const solvedRow = button && button.closest(".word-row"); if (solvedRow) solvedRow.classList.toggle("solved-row", !!solvedWords[i]);
    if (solvedWords[i]) {
      mask.textContent = (word || "Acertou!").toLocaleUpperCase("pt-BR");
      mask.className = "masked-word solved" + (mask.textContent.length > 14 ? " xlong" : mask.textContent.length > 9 ? " long" : "");
      button.classList.add("solved");
      button.disabled = true;
    } else {
      const reveal = timerStarted && timerRemaining <= 10 && word && ratioOk();
      const txt = (phraseHint && isPhrase(word)) ? (reveal ? hintMask(word, true) : hintMask(word, false)) : reveal ? maskWord(word) : (word && /\s/.test(word.trim()) ? word.trim().replace(/\S/g, "*") : "*****");
      mask.textContent = txt;
      mask.className = "masked-word" + (reveal ? " revealed" : "") + (txt.length > 14 ? " xlong" : txt.length > 9 ? " long" : "");
      button.classList.remove("solved");
      button.disabled = !timerStarted || roundFinished || !word;
    }
  }
  fitWordInputs();
}
function updateTimerDisplay() {
  const m = Math.floor(timerRemaining / 60);
  const sec = timerRemaining % 60;
  timerValue.textContent = m + ":" + String(sec).padStart(2, "0");
  timerValue.style.color = timerRemaining <= 10 ? "#ff4242" : "#ff4242";
  timerValue.classList.toggle("urgent", timerStarted && !roundFinished && timerRemaining > 0 && timerRemaining <= 10);
  timerValue.classList.toggle("paused", timerPaused);
  updateWordDisplay();
}
function startRoundTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerStarted = true;
  refreshDrawControls();
  roundFinished = false;
  roundStartRemaining = timerRemaining;
  updateTimerDisplay();
  timerPaused = false;
  setPauseIcon(false);
  document.getElementById("pauseTimer").title = "Pausar cronômetro";
  timerInterval = setInterval(() => {
    if (timerPaused) return;
    timerRemaining = Math.max(0, timerRemaining - 1);
    updateTimerDisplay();
    if (timerRemaining > 0 && timerRemaining <= 10) { SFX.tick(timerRemaining); if (timerRemaining === 10) setTimeout(() => SFX.reveal(), 120); }
    if (timerRemaining <= 0) { SFX.timeUp(); finishRound(); }
  }, 1000);
}
document.getElementById("pauseTimer").addEventListener("click", () => {
  if (!timerStarted || roundFinished) return;
  timerPaused = !timerPaused;
  SFX.pause(timerPaused);
  if (currentRound) {
    currentRound.pauseEvents = currentRound.pauseEvents || [];
    if (timerPaused) {
      pauseStartedAt = new Date();
      currentRound.pauseStartedAt = pauseStartedAt;
      currentRound.pauseEvents.push({ pausedAt: pauseStartedAt, resumedAt: null, durationMs: null });
    } else if (pauseStartedAt) {
      const resumedAt = new Date();
      const durationMs = resumedAt - pauseStartedAt;
      currentRound.pauseTotalMs = (currentRound.pauseTotalMs || 0) + durationMs;
      const last = currentRound.pauseEvents[currentRound.pauseEvents.length - 1];
      if (last && !last.resumedAt) { last.resumedAt = resumedAt; last.durationMs = durationMs; }
      currentRound.pauseStartedAt = null;
      pauseStartedAt = null;
    }
  }
  setPauseIcon(timerPaused);
  document.getElementById("pauseTimer").title = timerPaused ? "Retomar cronômetro" : "Pausar cronômetro";
  document.getElementById("pauseTimer").setAttribute("aria-label", timerPaused ? "Retomar cronômetro" : "Pausar cronômetro");
  timerValue.classList.toggle("paused", timerPaused);
});
// Cor da tinta automática: branca em fundo escuro, preta em fundo claro
function autoInk() {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(currentBoardColor());
  if (!m) return;
  const lum = 0.299 * parseInt(m[1], 16) + 0.587 * parseInt(m[2], 16) + 0.114 * parseInt(m[3], 16);
  const btn = document.querySelector('[data-color="' + (lum < 140 ? "#ffffff" : "#000000") + '"]');
  if (btn) btn.click();
}
function applyCanvasBackground() {
  const color = currentBoardColor();
  autoInk();
  document.querySelector(".canvas-wrap").style.background = color;
  document.querySelector("main").style.background = color;
  canvas.style.background = color;
  render();
}
document.getElementById("applyCanvasBg").addEventListener("click", applyCanvasBackground);
const drawButton = document.getElementById("drawWords");
const drawCount = document.getElementById("drawCount");
const themeOptions = document.getElementById("themeOptions");
const activeThemes = document.getElementById("activeThemes");
const themeCheckboxes = [...themeOptions.querySelectorAll('input[type="checkbox"]')];
const allThemesCheckbox = themeOptions.querySelector('input[value="todos"]');
const individualThemeCheckboxes = themeCheckboxes.filter(input => input.value !== "todos");
const regularThemeCheckboxes = individualThemeCheckboxes.filter(input => input.value !== "frases"); // "Todos os temas" não inclui as frases
function getSelectedThemes() {
  return individualThemeCheckboxes.filter(input => input.checked).map(input => input.value);
}
const themeLabels = {frases:"Frases aleatórias", frutas:"Frutas", esporte:"Esporte", casa:"Casa", objetos:"Objetos", animais:"Animais", comidas:"Comidas", filmes:"Filmes"};
function updateThemeDisplay(changedInput = null) {
  if (changedInput === allThemesCheckbox) {
    regularThemeCheckboxes.forEach(input => { input.checked = allThemesCheckbox.checked; });
  } else {
    allThemesCheckbox.checked = regularThemeCheckboxes.every(input => input.checked);
  }
  const themes = getSelectedThemes();
  activeThemes.textContent = themes.length === regularThemeCheckboxes.length && !themes.includes("frases") ? "Todos os temas" : themes.length ? themes.map(theme => themeLabels[theme]).join(" + ") : "Nenhum tema";
  drawButton.disabled = drawsRemaining <= 0 || timerStarted || roundFinished || themes.length === 0;
}
themeOptions.addEventListener("change", event => updateThemeDisplay(event.target));
updateThemeDisplay(allThemesCheckbox);
function refreshDrawControls() {
  drawCount.textContent = "Novas palavras disponíveis: " + drawsRemaining;
  drawButton.disabled = drawsRemaining <= 0 || timerStarted || roundFinished || getSelectedThemes().length === 0;
  document.querySelectorAll("[data-lock]").forEach((button, i) => {
    const hasWord = !!document.getElementById("word" + (i + 1)).value.trim();
    if (!hasWord) lockedWords[i] = false;
    button.disabled = timerStarted || roundFinished || !hasWord;
    button.classList.toggle("locked", lockedWords[i]);
    button.innerHTML = ico(lockedWords[i] ? "lock" : "unlock");
    button.setAttribute("aria-pressed", String(lockedWords[i]));
    button.title = lockedWords[i] ? "Desbloquear palavra para o próximo sorteio" : "Manter esta palavra no próximo sorteio";
    document.getElementById("word" + (i + 1)).classList.toggle("locked-word", lockedWords[i]);
  });
  if (typeof updateUsedInfo === "function") updateUsedInfo();
}
document.querySelectorAll("[data-lock]").forEach(button => button.addEventListener("click", () => {
  if (timerStarted || roundFinished) return;
  const i = Number(button.dataset.lock);
  if (!document.getElementById("word" + (i + 1)).value.trim()) { lockedWords[i] = false; refreshDrawControls(); return; }
  lockedWords[i] = !lockedWords[i];
  if (lockedWords[i]) markUsed([document.getElementById("word" + (i + 1)).value]);
  SFX.lock(lockedWords[i]);
  refreshDrawControls();
}));
["word1","word2","word3","word4","word5"].forEach((id, i) => document.getElementById(id).addEventListener("input", () => {
  if (!document.getElementById(id).value.trim()) lockedWords[i] = false;
  refreshDrawControls();
}));
let confirmedWordsCount = 3; // só muda ao clicar em "Confirmar quantidade"
function wordsCount() { return confirmedWordsCount; }
function syncWordCountUI() {
  const count = wordsCount();
  for (let i=1;i<=5;i++) {
    const input=document.getElementById("word"+i); if (!input) continue;
    const row=input.closest(".word-row"); if (row) row.hidden=i>count;
    if(i>count){input.value="";roundWords[i-1]="";lockedWords[i-1]=false;}
    const mask=document.getElementById("mask"+i); if(mask) mask.hidden=i>count;
  }
  updateWordDisplay();
}
const wordsSelect = document.getElementById("wordsPerRound");
const confirmWordsBtn = document.getElementById("confirmWords");
const wordsHint = document.getElementById("wordsHint");
function refreshWordsConfirm() {
  const pending = Number(wordsSelect.value) !== confirmedWordsCount;
  confirmWordsBtn.disabled = !pending;
  confirmWordsBtn.textContent = pending ? "✓ Confirmar " + wordsSelect.value + (Number(wordsSelect.value) === 1 ? " palavra" : " palavras") : "✓ Confirmar quantidade";
  wordsHint.textContent = "Em uso: " + confirmedWordsCount + (confirmedWordsCount === 1 ? " palavra" : " palavras") + " por rodada." + (pending ? " Clique em confirmar para aplicar." : "");
}
wordsSelect.addEventListener("change", refreshWordsConfirm);
confirmWordsBtn.addEventListener("click", () => {
  if (timerStarted && !roundFinished) { alert("Só dá para mudar a quantidade de palavras entre as rodadas."); wordsSelect.value = String(confirmedWordsCount); refreshWordsConfirm(); return; }
  confirmedWordsCount = Math.max(1, Math.min(5, Number(wordsSelect.value) || 3));
  syncWordCountUI();
  refreshWordsConfirm();
  refreshDrawControls();
});
syncWordCountUI();
refreshWordsConfirm();
applyCanvasBackground();
function drawWordsNow() {
  if (timerStarted || roundFinished) return;
  Array.from({length:wordsCount()}, (_,i)=>"word"+(i+1)).forEach((id, i) => { roundWords[i] = normalizedWord(document.getElementById(id).value); });
  const selectedThemes = getSelectedThemes();
  const bank = [...new Set(selectedThemes.flatMap(theme => wordBank[theme] || []))];
  if (!bank.length) { drawCount.textContent = "Selecione ao menos um tema."; return; }
  const lockedSet = new Set(roundWords.filter((word, i) => lockedWords[i] && word));
  const previousSet = new Set(roundWords.filter(Boolean));
  const unlockedIndices = Array.from({length:wordsCount()}, (_,i)=>i).filter(i => !lockedWords[i]);
  if (!unlockedIndices.length) {
    drawCount.textContent = "Desbloqueie ao menos uma palavra para sortear.";
    return;
  }
  previousSet.forEach(w => drawnSeen.add(wkey(w)));
  const okWord = word => !lockedSet.has(word) && !previousSet.has(word) && !drawnSeen.has(wkey(word));
  let available = bank.filter(word => okWord(word) && !usedWords.has(wkey(word)));
  if (available.length < unlockedIndices.length) { // acabaram as palavras novas desses temas: recomeça só esses temas
    bank.forEach(w => usedWords.delete(wkey(w))); saveUsed(); drawnSeen.clear(); previousSet.forEach(w => drawnSeen.add(wkey(w)));
    available = bank.filter(okWord);
  }
  const usedThisDraw = new Set(lockedSet);
  unlockedIndices.forEach(i => {
    const choices = available.filter(word => !usedThisDraw.has(word));
    if (!choices.length) return;
    const picked = choices[Math.floor(Math.random() * choices.length)];
    roundWords[i] = picked; drawnSeen.add(wkey(picked));
    document.getElementById("word" + (i + 1)).value = picked;
    usedThisDraw.add(picked);
  });
  pendingDraws.push(roundWords.filter(Boolean));
  SFX.dice();
  drawsRemaining--;
  refreshDrawControls();
}
drawButton.addEventListener("click", () => { if (drawsRemaining > 0) drawWordsNow(); });

function roundWordsInfo() {
  return Array.from({length:wordsCount()}, (_,i)=>i).filter(i => roundWords[i]).map(i => ({
    word: roundWords[i], solved: solvedWords[i], elapsed: solvedAt[i],
    remaining: solvedAt[i] != null ? roundStartRemaining - solvedAt[i] : null,
    points: solvedWords[i] ? solvedPoints[i] : 0
  }));
}
function startRound() {
  Array.from({length:wordsCount()}, (_,i)=>"word"+(i+1)).forEach((id, i) => { roundWords[i] = normalizedWord(document.getElementById(id).value); });
  if (roundWords.every(w => !w)) return false;
  solvedWords.fill(false);
  solvedAt.fill(null);
  solvedPoints.fill(0);
  lockedWords.fill(false);
  drawnSeen.clear();
  markUsed(roundWords.slice(0, wordsCount()));
  drawsRemaining = 3;
  totalScore = 0;
  scoreValue.textContent = "0";
  scorePop.textContent = "";
  scorePop.classList.remove("show");
  document.querySelectorAll(".guess-button").forEach(b => { b.disabled = false; b.classList.remove("solved"); });
  drawingArchive.length = 0;
  lastDrawingPNG = null;
  turnOverlay.hidden = true;
  document.getElementById("resultsOverlay").hidden = true;
  timerRemaining = configuredDuration();
  timerStarted = false;
  timerPaused = false; pauseStartedAt = null;
  setPauseIcon(false);
  roundFinished = false;
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  updateTimerDisplay();
  startRoundTimer();
  showWordsFor(5000);
  const roles = currentRoles();
  currentRound = roles ? {
    turn: turnNumber + 1, round: roles.round, team: roles.team, drawer: roles.drawer, guesser: roles.guesser,
    draws: pendingDraws.map(d => d.slice()), words: roundWords.slice(), duration: configuredDuration(),
    startedAt: new Date(), endedAt: null, endReason: null, teamTotal: null, result: null, pauseEvents: [], pauseTotalMs: 0, pauseStartedAt: null, clearEvents: []
  } : null;
  pendingDraws.length = 0;
  renderTeams();
  return true;
}
// Iniciar jogo mostra apenas “Preparar…” e “Já!”, sem repetir o anúncio da dupla.
function startFlow() {
  if (timerStarted && !roundFinished) return;
  if (sessionOver) resetSession();
  if (!turnOrder.length) { drawOrderButton.click(); return; }
  closeSettings();
  turnOverlay.hidden = true;
  const overlay = document.createElement("div");
  overlay.className = "results-overlay turn-overlay";
  overlay.style.zIndex = "50";
  overlay.innerHTML = '<div class="count-wrap"><div class="count-ring"></div><div class="count-num cue" id="startCue">Preparar…</div></div>';
  document.body.appendChild(overlay);
  SFX.ready();
  setTimeout(() => {
    const cue = overlay.querySelector("#startCue");
    if (!cue) return;
    cue.textContent = "Já!"; SFX.go();
    cue.classList.add("go"); restartAnim(cue); restartAnim(overlay.querySelector(".count-ring"));
    setTimeout(() => {
      overlay.remove();
      beginRound();
    }, 700);
  }, 1000);
}
function beginRound() {
  if (Array.from({length:wordsCount()},(_,i)=>"word"+(i+1)).every(id => !document.getElementById(id).value.trim())) drawWordsNow();
  if (!startRound()) {
    drawCount.textContent = "Selecione ao menos um tema.";
    openSettings();
  }
}
document.getElementById("setWords").addEventListener("click", startFlow);
document.querySelectorAll("[data-solve]").forEach(button => button.addEventListener("click", () => {
  const i = Number(button.dataset.solve) - 1;
  if (!roundWords[i] || solvedWords[i] || !timerStarted || roundFinished || timerRemaining <= 0) return;
  solvedWords[i] = true;
  solvedAt[i] = Math.max(0, roundStartRemaining - timerRemaining);
  const earned = pointsForRemainingTime(timerRemaining);
  solvedPoints[i] = earned;
  addRoundPoints(earned);
  updateWordDisplay();
  { const di = drawInfo("acertou", roundWords[i], solvedAt[i], earned); di.wi = i; clearBoard(true, di); }
  showWordsFor(5000);
  SFX.solve();
  if (roundWords.slice(0, wordsCount()).every((word, index) => !word || solvedWords[index])) finishRound();
}));
document.getElementById("closeResults").addEventListener("click", () => {
  document.getElementById("resultsOverlay").hidden = true;
  if (sessionOver) showFinal();
  else { prepareNextRound(); showTurnAnnouncement(); }
});
const privacyToggle = document.getElementById("privacyToggle");
const roundWordsPrivacy = document.getElementById("roundWordsPrivacy");
const roundWordsHeading = document.querySelector(".round-words-heading .section-title");
function applyPrivacy(hidden) {
  wantHidden = hidden;
  hidden = hidden || !ratioOk();
  roundWordsPrivacy.classList.toggle("blurred", hidden);
  privacyToggle.textContent = hidden ? "Mostrar" : "Ocultar";
  privacyToggle.setAttribute("aria-pressed", String(hidden));
  privacyToggle.title = hidden ? "Mostrar as palavras novamente" : "Ocultar as palavras com asteriscos";
}
privacyToggle.addEventListener("click", () => applyPrivacy(!roundWordsPrivacy.classList.contains("blurred")));
