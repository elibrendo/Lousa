// ===== "1 contra todos": quem desenhou escolhe quem acertou cada palavra =====
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
  document.getElementById("whoHint").textContent = drawer + ", selecione quem acertou cada palavra. Você ganha todos os pontos; se dividir, cada ganhador recebe uma parte igual.";
  list.replaceChildren(); const pick = {};
  const solved = []; for (let i = 0; i < wordsCount(); i++) if (solvedWords[i] && roundWords[i]) solved.push(i);
  const refresh = () => { ok.disabled = !solved.every(i => pick[i] && pick[i].selected.length); };
  solved.forEach(i => {
    const row = document.createElement("div"); row.className = "who-row";
    const w = document.createElement("div"); w.className = "who-word"; w.textContent = roundWords[i]; const sm = document.createElement("small"); sm.textContent = "+" + solvedPoints[i] + " pt" + (solvedPoints[i] === 1 ? "" : "s"); w.appendChild(sm);
    const selection = pick[i] = { selected: [], split: false };
    const split = document.createElement("button"); split.type = "button"; split.className = "who-split"; split.textContent = "Dividir pontos"; split.setAttribute("aria-pressed", "false");
    const chips = document.createElement("div"); chips.className = "who-chips";
    const options = [...guessers, NOBODY];
    const status = document.createElement("div"); status.className = "who-selection"; status.setAttribute("aria-live", "polite");
    const updateSelection = () => {
      [...chips.children].forEach((button, index) => button.classList.toggle("on", selection.selected.includes(options[index])));
      split.classList.toggle("on", selection.split);
      split.setAttribute("aria-pressed", String(selection.split));
      const selectedNames = selection.selected[0] === NOBODY ? ["ninguém"] : selection.selected;
      status.textContent = selectedNames.length
        ? (selection.split && selection.selected[0] !== NOBODY ? "Ganhador(es): " + selectedNames.join(" e ") + (selectedNames.length > 1 ? " — pontos divididos igualmente" : " — divisão ativada; selecione mais pessoas para dividir") : "Ganhador(es): " + selectedNames.join(" e "))
        : "Nenhum ganhador selecionado";
      refresh();
    };
    split.addEventListener("click", () => {
      selection.split = !selection.split;
      if (!selection.split && selection.selected.length > 1) selection.selected.splice(1);
      updateSelection();
    });
    options.forEach(g => {
      const b = document.createElement("button"); b.type = "button"; b.className = "who-chip" + (g === NOBODY ? " none" : ""); b.textContent = g === NOBODY ? "🚫 Ninguém acertou" : g;
      b.addEventListener("click", () => {
        if (g === NOBODY || !selection.split) selection.selected = [g];
        else if (selection.selected.includes(g)) selection.selected = selection.selected.filter(name => name !== g);
        else selection.selected = [...selection.selected.filter(name => name !== NOBODY), g];
        updateSelection();
      });
      chips.appendChild(b);
    });
    row.append(w, split, chips, status); list.appendChild(row);
  });
  refresh(); ov.hidden = false;
  ok.onclick = () => {
    ok.onclick = null; ov.hidden = true;
    solved.forEach(i => {
      const { selected, split } = pick[i], pts = solvedPoints[i] || 0;
      if (selected[0] === NOBODY) { unsolveWho(team, logged, turnNo, i, pts); return; }
      const share = pts / selected.length;
      selected.forEach(g => {
        const gi = members.indexOf(g);
        individualScores[g] = (individualScores[g] || 0) + share;
        if (gi >= 0) { stats[team][gi].guessed++; stats[team][gi].guessSecs += solvedAt[i] || 0; stats[team][gi].guessHits++; }
      });
      individualScores[drawer] = (individualScores[drawer] || 0) + pts;
      const winners = selected.join(" e ");
      if (logged && logged.result && logged.result.words[i]) logged.result.words[i].guessedBy = winners;
      gameDrawings.forEach(d => { if (d.kind === "acertou" && d.turn === turnNo && d.wi === i) d.guesser = winners; });
      const rowEl = document.querySelector('#resultsList [data-wi="' + i + '"]');
      if (rowEl) rowEl.textContent += " — quem acertou: " + winners + (split && selected.length > 1 ? " (dividiram " + pts + " pontos)" : "");
    });
    renderTeams();
    saveSession();
    document.getElementById("resultsOverlay").hidden = false;
  };
}
