// Classificação e prêmios
const fmt1 = n => n.toFixed(1).replace(".", ",");

// ---------- Desempate ----------
// 1º pontos · 2º menor média de tempo para acertar · 3º menor média de desenho (tempo até acertarem o desenho)
const secText = v => fmt1(v) + " s";
// Melhor jogador dentro da equipe: mais palavras acertadas; depois menor média de tempo para acertar; depois menor média de desenho.
function bestInTeam(t) {
  const same = (x, y) => x === y || Math.abs(x - y) < 1e-9;
  const rows = (stats[t] || []).map((st, p) => ({ name: teamMembers[t][p], guessed: st.guessed, guessAvg: st.guessHits ? st.guessSecs / st.guessHits : Infinity, drawAvg: st.drawWords ? st.drawSecs / st.drawWords : Infinity }));
  if (!rows.length || !rows.some(r => r.guessed > 0 || r.drawAvg < Infinity)) return null;
  const cmp = (x, y) => { if (x.guessed !== y.guessed) return y.guessed - x.guessed; if (!same(x.guessAvg, y.guessAvg)) return x.guessAvg < y.guessAvg ? -1 : 1; if (!same(x.drawAvg, y.drawAvg)) return x.drawAvg < y.drawAvg ? -1 : 1; return 0; };
  rows.sort(cmp);
  const top = rows.filter(r => cmp(r, rows[0]) === 0);
  if (top.length === rows.length) return { equal: true, text: "⭐ Desempenho igual entre os jogadores" };
  const r0 = top[0];
  return { equal: false, short: "⭐ " + top.map(r => r.name).join(" e "), text: "⭐ Destaque: " + top.map(r => r.name).join(" e ") + " — acertou " + r0.guessed + (r0.guessed === 1 ? " palavra" : " palavras") + (r0.guessAvg < Infinity ? " (média de " + secText(r0.guessAvg) + " para acertar)" : "") };
}
function buildLeaderboard() {
  const individualMode = isIndivMode();
  const metricsOf = entry => {
    let gs = 0, gh = 0, ds = 0, dw = 0;
    const add = st => { gs += st.guessSecs; gh += st.guessHits; ds += st.drawSecs; dw += st.drawWords; };
    if (individualMode) teamMembers.forEach((m, t) => m.forEach((n, p) => { if (n === entry.name) add(stats[t][p]); }));
    else (stats[entry.team] || []).forEach(add);
    return { guessAvg: gh ? gs / gh : Infinity, drawAvg: dw ? ds / dw : Infinity };
  };
  let entries;
  if (individualMode) entries = [...new Set(teamMembers.flat())].map(name => ({ name, score: individualScores[name] || 0, id: name }));
  else entries = teamNames.map((name, i) => ({ name, score: teamScores[i], id: i, team: i }));
  entries.forEach(e => Object.assign(e, metricsOf(e)));
  const same = (x, y) => x === y || Math.abs(x - y) < 1e-9;
  const cmp = (x, y) => {
    if (x.score !== y.score) return y.score - x.score;
    if (!same(x.guessAvg, y.guessAvg)) return x.guessAvg < y.guessAvg ? -1 : 1;
    if (!same(x.drawAvg, y.drawAvg)) return x.drawAvg < y.drawAvg ? -1 : 1;
    return 0;
  };
  entries.sort((x, y) => cmp(x, y) || x.name.localeCompare(y.name, "pt-BR"));
  entries.forEach(e => { e.rank = 1 + entries.filter(o => cmp(o, e) < 0).length; });
  const notes = [];
  const groups = new Map();
  entries.forEach(e => { if (!groups.has(e.score)) groups.set(e.score, []); groups.get(e.score).push(e); });
  groups.forEach((g, score) => {
    if (g.length < 2) return;
    if (g.every(e => e.guessAvg === Infinity && e.drawAvg === Infinity)) return;
    const lines = [];
    for (let i = 0; i < g.length - 1; i++) {
      const x = g[i], y = g[i + 1];
      if (!same(x.guessAvg, y.guessAvg)) {
        lines.push(x.name + " ficou à frente de " + y.name + " porque a média de tempo para acertar foi melhor (" + secText(x.guessAvg) + (y.guessAvg === Infinity ? "; " + y.name + " ainda não acertou nenhuma palavra" : " contra " + secText(y.guessAvg)) + "). Quanto menor, melhor.");
      } else if (!same(x.drawAvg, y.drawAvg)) {
        lines.push(x.name + " e " + y.name + " empataram na média de acerto, então " + x.name + " desempatou pela média de desenho, que foi melhor (" + secText(x.drawAvg) + (y.drawAvg === Infinity ? "; " + y.name + " ainda não desenhou" : " contra " + secText(y.drawAvg)) + "). Quanto menor, melhor.");
      } else {
        lines.push(x.name + " e " + y.name + " seguem empatados em tudo: pontos, média de acerto e média de desenho.");
      }
    }
    notes.push({ score, lines });
  });
  return { leaderboard: entries, individualMode, notes };
}
function renderTiebreakNotes(notes) {
  const box = document.getElementById("tiebreak");
  if (!box) return;
  box.replaceChildren();
  box.hidden = !notes.length;
  if (!notes.length) return;
  const h = document.createElement("h3"); h.textContent = "⚖️ Desempate"; box.appendChild(h);
  const MAX = 5; let shown = 0, total = 0; notes.forEach(n => total += n.lines.length);
  notes.forEach(n => {
    if (shown >= MAX) return;
    const head = document.createElement("div"); head.className = "tb-head"; head.textContent = "Empate em " + n.score + (n.score === 1 ? " ponto" : " pontos"); box.appendChild(head);
    n.lines.forEach(t => { if (shown >= MAX) return; shown++; const l = document.createElement("div"); l.className = "tb-line"; l.textContent = "• " + t; box.appendChild(l); });
  });
  const foot = document.createElement("div"); foot.className = "tb-foot";
  foot.textContent = (total > shown ? "+ " + (total - shown) + " desempate(s) no log exportado. " : "") + "Critérios: 1) menor tempo médio para acertar; 2) menor tempo médio de desenho.";
  box.appendChild(foot);
}
function showFinal() {
  document.getElementById("finalTitle").innerHTML = ico("trophy") + (sessionOver ? " Classificação final" : " Classificação parcial") + (isIndivMode() ? " · individual" : " · por equipe");
  const lb = buildLeaderboard();
  const individualMode = lb.individualMode;
  const leaderboard = lb.leaderboard;
  renderTiebreakNotes(lb.notes);
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  const top = leaderboard.filter(e => e.rank <= 3);
  const others = leaderboard.filter(e => e.rank > 3);
  // 2º, 1º, 3º (empates ficam lado a lado — ninguém some do pódio)
  const displayOrder = [...top.filter(e=>e.rank===2), ...top.filter(e=>e.rank===1), ...top.filter(e=>e.rank===3)];
  const podium = document.getElementById("podium");
  podium.replaceChildren();
  displayOrder.forEach((entry) => {
    const r = entry.rank;
    const col = document.createElement("div"); col.className = "podium-col s" + r;
    const medal = document.createElement("div"); medal.className = "podium-medal"; medal.textContent = medals[r];
    if (true) { const img=document.createElement("img"); img.src=individualMode ? playerPhoto(entry.name) : teamPhoto(entry.team); img.alt=entry.name; img.hidden=!img.src; col.appendChild(medal); col.appendChild(img); }
    else col.appendChild(medal);
    const label = document.createElement("div"); label.className = "podium-name"; label.textContent = "TOP " + r + " · " + entry.name;
    const score = document.createElement("div"); score.className = "podium-score"; score.textContent = entry.score + (entry.score === 1 ? " ponto" : " pontos");
    const step = document.createElement("div"); step.className = "podium-step rank" + r; step.textContent = r + "º";
    col.append(label, score);
    if (!individualMode) { const b = bestInTeam(entry.team); if (b) { const mvp = document.createElement("div"); mvp.className = "podium-mvp"; mvp.textContent = b.text; col.appendChild(mvp); } }
    col.appendChild(step); podium.appendChild(col);
  });
  // Demais participantes: lista compacta, sem destaque
  const rest = document.getElementById("podiumRest");
  rest.replaceChildren();
  rest.hidden = !others.length;
  if (others.length) {
    const t = document.createElement("div"); t.className = "podium-rest-title"; t.textContent = "DEMAIS PARTICIPANTES";
    const list = document.createElement("div"); list.className = "podium-rest-list";
    others.forEach((e, i) => {
      const item = document.createElement("div"); item.className = "podium-rest-item"; item.style.animationDelay = (1 + i * 0.05) + "s";
      const pos = document.createElement("b"); pos.textContent = e.rank + "º";
      const nm = document.createElement("span"); nm.className = "n"; nm.textContent = e.name;
      if (!individualMode) { const b = bestInTeam(e.team); if (b && !b.equal) { const sm = document.createElement("small"); sm.textContent = b.short; nm.appendChild(sm); } }
      const sc = document.createElement("em"); sc.textContent = e.score + (e.score === 1 ? " pt" : " pts");
      item.append(pos, nm, sc); list.appendChild(item);
    });
    rest.append(t, list);
  }
  const aw = computeAwards();
  const guessWinners = aw.guessWinners, drawWinners = aw.drawWinners;
  const awards = document.getElementById("awards");
  awards.replaceChildren();
  function award(icon, title, winners, detail, explain) {
    const box = document.createElement("div"); box.className = "award";
    const i = document.createElement("div"); i.className = "award-icon"; i.innerHTML = ico(icon);
    const ti = document.createElement("div"); ti.className = "award-title"; ti.textContent = title;
    box.append(i, ti);
    if (!winners.length) {
      const none = document.createElement("div"); none.className = "award-detail"; none.textContent = "Ainda sem vencedor";
      box.appendChild(none);
    }
    winners.forEach(w => {
      const row = document.createElement("div"); row.className = "award-winner";
      const img = document.createElement("img"); img.src = playerPhoto(w.name); img.alt = "";
      const nm = document.createElement("span"); nm.textContent = w.name;
      row.append(img, nm);
      box.appendChild(row);
      const d = document.createElement("div"); d.className = "award-detail"; d.textContent = detail(w);
      box.appendChild(d);
    });
    const ex = document.createElement("div"); ex.className = "award-detail"; ex.textContent = explain;
    box.appendChild(ex);
    awards.appendChild(box);
  }
  award("palette", "Melhor desenhista", drawWinners, w => "Média de " + fmt1(w.avg) + " pts por rodada desenhada" + (w.tie ? " · desempate: o desenho dele(a) foi acertado em média em " + secText(w.dAvg) : ""), "Maior média de pontos por rodada desenhada; no empate, vence o melhor tempo médio até acertarem o desenho");
  award("target", "Quem mais acertou", guessWinners, w => w.guessed + (w.guessed === 1 ? " palavra descoberta" : " palavras descobertas") + (w.tie ? " · desempate: média de " + secText(w.gAvg) + " para acertar" : ""), "Mais palavras descobertas; no empate, vence quem acertou mais rápido em média");
  document.getElementById("finalOverlay").hidden = false;
  SFX.podium();
  requestAnimationFrame(() => { fitFinal(); requestAnimationFrame(fitFinal); setTimeout(fitFinal, 120); });
}
document.getElementById("showFinal").addEventListener("click", showFinal);
document.getElementById("finalClose").addEventListener("click", () => { document.getElementById("finalOverlay").hidden = true; });
document.getElementById("finalNew").addEventListener("click", () => { document.getElementById("finalOverlay").hidden = true; resetSession(); });
function finishRound() {
  if (roundFinished) return;
  roundFinished = true;
  clearTimeout(hideTimer); hideTimer = null;
  if (timerPaused && pauseStartedAt && currentRound) {
    const resumedAt = new Date(), durationMs = resumedAt - pauseStartedAt;
    currentRound.pauseTotalMs = (currentRound.pauseTotalMs || 0) + durationMs;
    const lastPause = (currentRound.pauseEvents || []).at(-1);
    if (lastPause && !lastPause.resumedAt) { lastPause.resumedAt = resumedAt; lastPause.durationMs = durationMs; }
    currentRound.pauseStartedAt = null; pauseStartedAt = null; timerPaused = false;
  }
  clearBoard(true, drawInfo("nao-acertou", roundWords.slice(0, wordsCount()).filter((w, k) => w && !solvedWords[k]).join(" ")));
  const playedTeam = currentTeam();
  const playedRoles = currentRoles();
  let nextTeam = null, nextRoles = null;
  if (playedTeam !== null && playedRoles) {
    const solvedCount = solvedWords.filter(Boolean).length;
    stats[playedTeam][playedRoles.drawer].drawRounds++;
    stats[playedTeam][playedRoles.drawer].drawPoints += totalScore;
    if (!isOneMode()) stats[playedTeam][playedRoles.guesser].guessed += solvedCount;
    // tempos para o desempate: acerto (só palavras acertadas) e desenho (palavra não acertada conta a rodada inteira)
    for (let i = 0; i < wordsCount(); i++) {
      if (!roundWords[i]) continue;
      const secs = solvedWords[i] ? (solvedAt[i] || 0) : roundStartRemaining;
      stats[playedTeam][playedRoles.drawer].drawSecs += secs;
      stats[playedTeam][playedRoles.drawer].drawWords++;
      if (solvedWords[i] && !isOneMode()) { stats[playedTeam][playedRoles.guesser].guessSecs += solvedAt[i] || 0; stats[playedTeam][playedRoles.guesser].guessHits++; }
    }
    if (isAllMode()) {
      // quem desenha e quem adivinha ganham os mesmos pontos
      (teamMembers[playedTeam] || []).forEach(name => { individualScores[name] = (individualScores[name] || 0) + totalScore; });
    }
    teamScores[playedTeam] += totalScore;
    if (currentRound) {
      currentRound.endedAt = new Date();
      currentRound.endReason = timerRemaining <= 0 ? "tempo esgotado" : "todas as palavras acertadas";
      currentRound.teamTotal = teamScores[playedTeam];
      currentRound.result = { points: totalScore, timeLeft: timerRemaining, words: roundWordsInfo() };
      gameLog.push(currentRound);
      lastLoggedRound = currentRound;
      currentRound = null;
    }
    turnNumber++;
    if (turnNumber >= totalTurns()) sessionOver = true;
    nextTeam = currentTeam();
    nextRoles = currentRoles();
    renderTeams();
    saveSession();
  }
  document.getElementById("resultsTitle").textContent = playedTeam !== null ? "Rodada encerrada — " + teamNames[playedTeam] + (playedRoles ? (isAllMode() ? " (" + turnNumber + "/" + totalTurns() + ")" : " (" + playedRoles.round + "/" + roundsPerTeam() + ")") : "") : "Rodada encerrada";
  refreshDrawControls();
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  const list = document.getElementById("resultsList");
  list.replaceChildren();
  document.getElementById("resultsScore").textContent = "Pontuação final: " + totalScore + (totalScore === 1 ? " ponto" : " pontos");
  roundWords.slice(0, wordsCount()).forEach((word, i) => {
    const row = document.createElement("div");
    row.dataset.wi = i;
    if (solvedWords[i]) row.textContent = "Palavra " + (i + 1) + " (" + (word || "sem nome") + "): acertada em " + formatElapsed(solvedAt[i]);
    else row.textContent = "Palavra " + (i + 1) + " (" + (word || "sem nome") + "): não descoberta";
    list.appendChild(row);
  });
  if (playedTeam !== null && playedRoles) {
    const who = document.createElement("div");
    who.innerHTML = ico("pen") + " " + esc(teamMembers[playedTeam][playedRoles.drawer]) + " desenhou · " + ico("search") + " " + (isOneMode() ? "todos adivinharam" : esc(teamMembers[playedTeam][playedRoles.guesser]) + " adivinhou");
    list.insertBefore(who, list.firstChild);
    const info = document.createElement("div");
    info.style.cssText = "border-top:1px solid #555;padding-top:9px;color:#ffd34d";
    if (isOneMode()) info.textContent = "Cada ponto vale para quem acertou e para " + teamMembers[playedTeam][0] + " (quem desenhou). " + (sessionOver ? "Fim da sessão! Feche para ver a classificação." : "Próximo a desenhar: " + teamMembers[nextTeam][0] + ".");
    else info.textContent = "+" + totalScore + " para " + teamNames[playedTeam] + " (total: " + teamScores[playedTeam] + "). " +
      (sessionOver ? "Fim da sessão! Feche para ver a classificação." :
        "Próxima dupla: " + teamNames[nextTeam] + (nextRoles ? " (✏️ " + teamMembers[nextTeam][nextRoles.drawer] + " desenha, 🔍 " + teamMembers[nextTeam][nextRoles.guesser] + " adivinha)" : ""));
    list.appendChild(info);
  }
  if (isOneMode() && playedTeam !== null && playedRoles && solvedWords.slice(0, wordsCount()).some(Boolean)) openWho(playedTeam, lastLoggedRound);
  else document.getElementById("resultsOverlay").hidden = false;
  if (roundWords.slice(0, wordsCount()).every((w, k) => !w || solvedWords[k])) setTimeout(() => SFX.win(), 350);
  else setTimeout(() => SFX.roundEnd(), timerRemaining <= 0 ? 650 : 0);
}
