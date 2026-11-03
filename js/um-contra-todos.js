// ===== "1 contra todos": quem desenhou diz quem acertou cada palavra =====
const NOBODY = "\u0000ninguem";
// "Ninguém acertou": a palavra volta a contar como não descoberta e os pontos dela saem da rodada.
function unsolveWho(team, logged, turnNo, i, pts) {
  teamScores[team] = Math.max(0, teamScores[team] - pts);
  const st = stats[team][0]; st.drawPoints -= pts; st.drawSecs += roundStartRemaining - (solvedAt[i] || 0);
  if (logged && logged.result) {
    logged.result.points -= pts; logged.teamTotal = teamScores[team];
    const w = logged.result.words[i]; if (w) { w.solved = false; w.points = 0; w.elapsed = null; w.remaining = null; }
  }
  gameDrawings.forEach(d => { if (d.kind === "acertou" && d.turn === turnNo && d.wi === i) { d.kind = "nao-acertou"; d.pts = 0; d.secs = null; } });
  const rowEl = document.querySelector('#resultsList [data-wi="' + i + '"]'); if (rowEl) rowEl.textContent = "Palavra " + (i + 1) + " (" + roundWords[i] + "): ninguém acertou";
  const total = logged && logged.result ? logged.result.points : 0;
  document.getElementById("resultsScore").textContent = "Pontuação final: " + total + (total === 1 ? " ponto" : " pontos");
}
function openWho(team, logged) {
  const members = teamMembers[team] || [], drawer = members[0], guessers = members.slice(1);
  const turnNo = turnNumber; // turnNumber já avançou: a rodada que acabou é a de número turnNo
  const ov = document.getElementById("whoOverlay"), list = document.getElementById("whoList"), ok = document.getElementById("whoOk");
  document.getElementById("whoHint").textContent = drawer + ", toque em quem acertou cada palavra. Esses jogadores e você ganham os mesmos pontos.";
  list.replaceChildren(); const pick = {};
  const solved = []; for (let i = 0; i < wordsCount(); i++) if (solvedWords[i] && roundWords[i]) solved.push(i);
  const refresh = () => { ok.disabled = !solved.every(i => pick[i]); };
  solved.forEach(i => {
    const row = document.createElement("div"); row.className = "who-row";
    const w = document.createElement("div"); w.className = "who-word"; w.textContent = roundWords[i]; const sm = document.createElement("small"); sm.textContent = "+" + solvedPoints[i] + " pt" + (solvedPoints[i] === 1 ? "" : "s"); w.appendChild(sm);
    const chips = document.createElement("div"); chips.className = "who-chips";
    [...guessers, NOBODY].forEach(g => { const b = document.createElement("button"); b.type = "button"; b.className = "who-chip" + (g === NOBODY ? " none" : ""); b.textContent = g === NOBODY ? "🚫 Ninguém acertou" : g; b.addEventListener("click", () => { pick[i] = g; [...chips.children].forEach(c => c.classList.toggle("on", c === b)); refresh(); }); chips.appendChild(b); });
    row.append(w, chips); list.appendChild(row);
  });
  refresh(); ov.hidden = false;
  ok.onclick = () => {
    ok.onclick = null; ov.hidden = true;
    solved.forEach(i => {
      const g = pick[i], pts = solvedPoints[i] || 0, gi = members.indexOf(g);
      if (g === NOBODY) { unsolveWho(team, logged, turnNo, i, pts); return; }
      individualScores[g] = (individualScores[g] || 0) + pts;
      individualScores[drawer] = (individualScores[drawer] || 0) + pts;
      if (gi >= 0) { stats[team][gi].guessed++; stats[team][gi].guessSecs += solvedAt[i] || 0; stats[team][gi].guessHits++; }
      if (logged && logged.result && logged.result.words[i]) logged.result.words[i].guessedBy = g;
      gameDrawings.forEach(d => { if (d.kind === "acertou" && d.turn === turnNo && d.wi === i) d.guesser = g; });
      const rowEl = document.querySelector('#resultsList [data-wi="' + i + '"]'); if (rowEl) rowEl.textContent += " — quem acertou: " + g;
    });
    renderTeams();
    saveSession();
    document.getElementById("resultsOverlay").hidden = false;
  };
}
