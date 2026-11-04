// Janela de configurações
const settingsOverlay = document.getElementById("settingsOverlay");
const wordsSheet = document.getElementById("wordsSheet");
const openWordsBtn = document.getElementById("openWords");
function openWords() { wordsSheet.classList.add("open"); openWordsBtn.classList.add("active"); }
function closeWords() { wordsSheet.classList.remove("open"); openWordsBtn.classList.remove("active"); }
openWordsBtn.addEventListener("click", () => wordsSheet.classList.contains("open") ? closeWords() : openWords());
document.getElementById("closeWords").addEventListener("click", closeWords);
function openSettings() { settingsOverlay.hidden = false; SFX.open(); }
function closeSettings() { settingsOverlay.hidden = true; }
document.getElementById("openSettings").addEventListener("click", openSettings);
document.getElementById("closeSettings").addEventListener("click", closeSettings);
settingsOverlay.addEventListener("click", e => { if (e.target === settingsOverlay) closeSettings(); });
// Anúncio grande da vez
const turnOverlay = document.getElementById("turnOverlay");
function showTurnAnnouncement() {
  const r = currentRoles();
  if (!r) return;
  SFX.turn();
  document.getElementById("bigRound").textContent = roundLabel(r.round, turnNumber + 1);
  const bp = document.getElementById("bigPhoto"); bp.src = teamPhoto(r.team); bp.hidden = !bp.getAttribute("src");
  document.getElementById("bigTeam").textContent = teamNames[r.team];
  document.getElementById("bigDrawer").textContent = teamMembers[r.team][r.drawer];
  document.getElementById("bigGuesser").textContent = isOneMode() ? "Todos os outros" : teamMembers[r.team][r.guesser];
  turnOverlay.hidden = false;
}
document.getElementById("turnOk").addEventListener("click", () => {
  turnOverlay.hidden = true;
  if (pendingStart) { pendingStart = false; beginRound(); }
  else if (!timerStarted || roundFinished) openWords();
});
turnInfo.addEventListener("click", showTurnAnnouncement);
document.addEventListener("keydown", e => { if (e.key === "Escape") { closeSettings(); closeHistory(); turnOverlay.hidden = true; pendingStart = false; } });
function prepareNextRound() {
  if (!roundFinished) return;
  drawnSeen.clear();
  timerStarted = false; roundFinished = false;
  solvedWords.fill(false); solvedAt.fill(null); solvedPoints.fill(0);
  solvedOrder.length = 0; hasDrawnWords = false;
  lockedWords.fill(false); roundWords.fill("");
  ["word1", "word2", "word3", "word4", "word5"].forEach(id => { document.getElementById(id).value = ""; });
  applyPrivacy(false);
  drawsRemaining = 3;
  totalScore = 0; scoreValue.textContent = "0";
  timerRemaining = configuredDuration();
  updateTimerDisplay();
  refreshDrawControls();
  updateThemeDisplay();
}
function sortOrder() {
  turnOrder = isOneMode() ? Array.from({length:teamNames.length},(_,i)=>i) : shuffle(Array.from({length:teamNames.length},(_,i)=>i));
  turnNumber = 0; sessionOver = false;
  buildRoleSchedule();
  renderTeams();
}
function resetSession() {
  const mainStartButton = document.getElementById("setWords");
  if (mainStartButton) { mainStartButton.innerHTML = ico("dice") + " Sortear início"; mainStartButton.classList.remove("ready-to-play"); }
  gameDrawings.length = 0; gameLog.length = 0; adjustLog.length = 0; pendingDraws.length = 0; currentRound = null;
  sessionStartedAt = new Date();
  teamScores = teamNames.map(()=>0);
  individualScores = Object.create(null); teamMembers.flat().forEach(name => { individualScores[name] = 0; });
  stats = freshStats();
  turnOrder = []; turnNumber = 0; sessionOver = false; roleSchedule = [];
  prepareNextRound();
  renderTeams();
  saveSession();
}
function disarmOrder() { orderArmed = false; clearTimeout(orderArmTimer); drawOrderButton.innerHTML = ico("dice") + " Sortear início"; }
drawOrderButton.addEventListener("click", () => {
  if (timerStarted && !roundFinished) return;
  if (turnNumber > 0 && !sessionOver && !orderArmed) {
    orderArmed = true;
    drawOrderButton.textContent = "⚠️ Clique de novo: reinicia tudo";
    orderArmTimer = setTimeout(disarmOrder, 4000);
    return;
  }
  disarmOrder();
  if (turnNumber > 0 || sessionOver) resetSession();
  sortOrder();
  closeSettings();
  SFX.dice();
  const countdown = document.createElement("div");
  countdown.className = "results-overlay turn-overlay";
  countdown.style.zIndex = "40";
  countdown.innerHTML = '<div class="count-wrap"><div class="count-ring"></div><div class="count-num" id="countdownNumber">3</div></div>';
  document.body.appendChild(countdown);
  let n = 3;
  setTimeout(() => SFX.count(3), 650);
  const countEl = countdown.querySelector("#countdownNumber");
  const ringEl = countdown.querySelector(".count-ring");
  const countdownTimer = setInterval(() => {
    n--;
    if (n > 0) { SFX.count(n); countEl.textContent = n; restartAnim(countEl); restartAnim(ringEl); }
    else {
      clearInterval(countdownTimer);
      SFX.go();
      countdown.remove();
      showTurnAnnouncement();
      const mainStartButton = document.getElementById("setWords");
      mainStartButton.innerHTML = ico("play") + " Iniciar jogo";
      mainStartButton.classList.add("ready-to-play");
    }
  }, 1000);
});
roundsInput.addEventListener("change", () => {
  roundsInput.value = timesPlaying();
  if (turnOrder.length && turnNumber === 0) { buildRoleSchedule(); }
  renderTeams();
});
// Ajuste manual de pontos
function adjustScore(sign) {
  const t = Number(document.getElementById("adjTeam").value);
  const amount = Math.floor(Math.abs(Number(document.getElementById("adjValue").value))) || 0;
  const before = teamScores[t];
  teamScores[t] = Math.max(0, before + sign * amount);
  if (teamScores[t] !== before) adjustLog.push({ time: new Date(), team: t, delta: teamScores[t] - before, total: teamScores[t] });
  if (isAllMode() && teamScores[t] !== before) { const d = teamScores[t] - before; (teamMembers[t] || []).forEach(n => { individualScores[n] = Math.max(0, (individualScores[n] || 0) + d); }); }
  renderTeams();
  saveSession();
}
document.getElementById("adjPlus").addEventListener("click", () => adjustScore(1));
document.getElementById("adjMinus").addEventListener("click", () => adjustScore(-1));
