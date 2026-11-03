// ---------- Histórico e exportação do jogo ----------
const fmtMS = sec => { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"); };
const fmtClock = d => d ? d.toLocaleTimeString("pt-BR") : "—";
function allRounds() {
  const list = gameLog.slice();
  if (currentRound && !roundFinished) {
    list.push({ ...currentRound, live: true, result: { points: totalScore, timeLeft: timerRemaining, words: roundWordsInfo() } });
  }
  return list;
}
function drawsText(r) { const hid = r.live && !ratioOk(); return r.draws.length ? r.draws.map((d, k) => (k + 1) + "º sorteio: " + (hid ? d.map(() => "*****") : d).join(", ")).join("  →  ") : "palavras digitadas manualmente"; }
function wordLine(w) {
  return (w.guessedBy ? "[" + w.guessedBy + "] " : "") + (w.solved ? "ACERTOU aos " + fmtMS(w.elapsed) + " de jogo (restavam " + fmtMS(w.remaining) + ") · +" + w.points + " pt" + (w.points === 1 ? "" : "s") : "não acertou");
}
const historyOverlay = document.getElementById("historyOverlay");
function closeHistory() { historyOverlay.hidden = true; }
function renderHistory() {
  const body = document.getElementById("historyBody");
  body.replaceChildren();
  const rounds = allRounds().reverse();
  if (pendingDraws.length) {
    const box = document.createElement("div"); box.className = "hist-round";
    const h = document.createElement("h3"); h.textContent = "Sorteadas para a próxima rodada";
    const p = document.createElement("div"); p.textContent = pendingDraws.map((d, k) => (k + 1) + "º sorteio: " + d.map(hideIfBad).join(", ")).join("  →  ");
    box.append(h, p); body.appendChild(box);
  }
  if (!rounds.length && !pendingDraws.length) {
    const e = document.createElement("div"); e.className = "hist-empty"; e.textContent = "Nenhuma palavra sorteada ainda.";
    body.appendChild(e); return;
  }
  rounds.forEach(r => {
    const box = document.createElement("div"); box.className = "hist-round";
    const h = document.createElement("h3");
    h.textContent = (isIndivMode() ? "Rodada " + r.turn + "/" + totalTurns() : "Rodada " + r.round + "/" + roundsPerTeam()) + " — " + teamNames[r.team] + (r.live ? " (em andamento)" : "");
    const who = document.createElement("div"); who.className = "dim";
    who.innerHTML = ico("pen") + " " + esc(teamMembers[r.team][r.drawer]) + " desenhou · " + ico("search") + " " + (isOneMode() ? "todos adivinharam" : esc(teamMembers[r.team][r.guesser]) + " adivinhou");
    const dr = document.createElement("div"); dr.textContent = drawsText(r);
    box.append(h, who, dr);
    const pauses = r.pauseEvents || [];
    const pauseLine = document.createElement("div"); pauseLine.className = "dim";
    const totalPausedMs = (r.pauseTotalMs || 0) + (r.pauseStartedAt ? Date.now() - new Date(r.pauseStartedAt).getTime() : 0);
    pauseLine.textContent = pauses.length ? "⏸ Cronômetro pausado " + pauses.length + " vez(es), por " + formatElapsed(Math.round(totalPausedMs / 1000)) + ": " + pauses.map((ev, i) => "pausa " + (i+1) + " às " + fmtClock(ev.pausedAt) + (ev.resumedAt ? ", retomada às " + fmtClock(ev.resumedAt) + " (" + formatElapsed(Math.round((ev.durationMs || 0)/1000)) + ")" : ", ainda pausado")).join("; ") : "⏸ Cronômetro não foi pausado";
    const clears = r.clearEvents || [];
    const clearLine = document.createElement("div"); clearLine.className = "dim";
    clearLine.textContent = clears.length ? "🧹 Tela limpa manualmente " + clears.length + " vez(es): " + clears.map((ev, i) => (i+1) + "ª às " + fmtClock(ev.at)).join("; ") : "🧹 Tela não foi limpa manualmente";
    box.append(pauseLine, clearLine);
    r.result.words.forEach(w => {
      const line = document.createElement("div"); line.className = "hist-word " + (w.solved ? "ok" : "no");
      line.textContent = (w.solved ? "✔ " : "✖ ") + ((r.live && !w.solved) ? hideIfBad(w.word) : w.word) + " — " + wordLine(w);
      box.appendChild(line);
    });
    const tot = document.createElement("div"); tot.className = "dim";
    tot.textContent = "Pontos da rodada: " + r.result.points + (r.live ? "" : " · Encerrou por " + r.endReason);
    box.appendChild(tot); body.appendChild(box);
  });
}
document.getElementById("openHistory").addEventListener("click", () => { renderHistory(); historyOverlay.hidden = false; });
document.getElementById("closeHistory").addEventListener("click", closeHistory);
historyOverlay.addEventListener("click", e => { if (e.target === historyOverlay) closeHistory(); });
function computeAwards() {
  // Soma por jogador (no "todos contra todos" cada um aparece em várias rodadas).
  const by = new Map();
  teamMembers.forEach((m, t) => m.forEach((name, p) => {
    const st = stats[t][p]; let a = by.get(name);
    if (!a) { a = { t, name, drawRounds: 0, drawPoints: 0, guessed: 0, guessSecs: 0, guessHits: 0, drawSecs: 0, drawWords: 0 }; by.set(name, a); }
    ["drawRounds","drawPoints","guessed","guessSecs","guessHits","drawSecs","drawWords"].forEach(k => { a[k] += st[k]; });
  }));
  const players = [...by.values()];
  const gAvg = p => p.guessHits ? p.guessSecs / p.guessHits : Infinity, dAvg = p => p.drawWords ? p.drawSecs / p.drawWords : Infinity;
  const cn = (x, y) => (x === y || Math.abs(x - y) < 1e-9) ? 0 : (x < y ? -1 : 1);
  const nm = (a, b) => a.name.localeCompare(b.name, "pt-BR");
  // Quem mais acertou: mais palavras; empate -> menor tempo médio para acertar.
  const gl = players.filter(p => p.guessed > 0).sort((a, b) => (b.guessed - a.guessed) || cn(gAvg(a), gAvg(b)) || cn(dAvg(a), dAvg(b)) || nm(a, b));
  // Melhor desenhista: maior média de pontos por rodada; empate -> menor tempo médio até acertarem o desenho.
  const dl = players.filter(p => p.drawRounds > 0 && p.drawPoints > 0).map(p => ({ ...p, avg: p.drawPoints / p.drawRounds }))
    .sort((a, b) => cn(b.avg, a.avg) || cn(dAvg(a), dAvg(b)) || cn(gAvg(a), gAvg(b)) || nm(a, b));
  const guessWinners = gl.length ? [{ ...gl[0], gAvg: gAvg(gl[0]), tie: gl.length > 1 && gl[1].guessed === gl[0].guessed }] : [];
  const drawWinners = dl.length ? [{ ...dl[0], dAvg: dAvg(dl[0]), tie: dl.length > 1 && cn(dl[1].avg, dl[0].avg) === 0 }] : [];
  return { players, guessWinners, drawWinners };
}
function buildGameText() {
  const L = [];
  const now = new Date();
  const line = "=".repeat(60);
  L.push("MINHA LOUSA — REGISTRO DO JOGO", "Exportado em: " + now.toLocaleString("pt-BR"), "Sessão iniciada em: " + sessionStartedAt.toLocaleString("pt-BR"), "");
  L.push("CONFIGURAÇÃO", line);
  L.push("Duplas: " + teamNames.map((n, i) => (i + 1) + ") " + n).join(" | "));
  L.push("Ordem sorteada: " + (turnOrder.length ? turnOrder.map((t, i) => (i + 1) + "º " + teamNames[t]).join(" → ") : "ainda não sorteada"));
  L.push("Modo: " + (isOneMode() ? "1 contra todos (placar individual)" : isAllMode() ? "todos contra todos (placar individual)" : "por equipe") + " | Cada jogador desenha " + (isIndivMode() ? appliedAllTimes : timesPlaying()) + "x e adivinha " + (isIndivMode() ? appliedAllTimes : timesPlaying()) + "x | Rodadas por equipe: " + roundsPerTeam() + " (total de " + totalTurns() + " rodadas)");
  L.push("Duração da rodada: " + configuredDuration() + " s");
  L.push("Pontuação por tempo restante: 2:00–1:50 = " + document.getElementById("points5").value + " | 1:49–1:00 = " + document.getElementById("points4").value + " | 0:59–0:45 = " + document.getElementById("points3").value + " | 0:44–0:11 = " + document.getElementById("points2").value + " | 0:10–0:00 = " + document.getElementById("points1").value);
  L.push("Temas: " + (getSelectedThemes().map(t => themeLabels[t]).join(", ") || "nenhum"));
  L.push("Situação: " + (sessionOver ? "sessão encerrada" : turnOrder.length ? "em andamento (" + turnNumber + " de " + totalTurns() + " rodadas concluídas)" : "não iniciada"), "");
  L.push("RODADAS", line);
  const rounds = allRounds();
  if (!rounds.length) L.push("Nenhuma rodada jogada.", "");
  rounds.forEach(r => {
    L.push((isIndivMode() ? "Rodada " + r.turn : "Rodada " + r.round + "/" + roundsPerTeam()) + " (rodada geral " + r.turn + "/" + totalTurns() + ") — " + teamNames[r.team] + (r.live ? "  [EM ANDAMENTO]" : ""));
    L.push("  Desenhou: " + teamMembers[r.team][r.drawer] + " | Adivinhou: " + (isOneMode() ? "todos (veja quem acertou em cada palavra)" : teamMembers[r.team][r.guesser]));
    L.push("  Início: " + fmtClock(r.startedAt) + " | Fim: " + fmtClock(r.endedAt) + " | Duração configurada: " + r.duration + " s" + (r.live ? "" : " | Encerrou por: " + r.endReason));
    const totalPausedMs = (r.pauseTotalMs || 0) + (r.pauseStartedAt ? Date.now() - new Date(r.pauseStartedAt).getTime() : 0);
    L.push("  Pausas: " + ((r.pauseEvents || []).length ? (r.pauseEvents.length + " vez(es), tempo total " + formatElapsed(Math.round(totalPausedMs / 1000)) + " — " + r.pauseEvents.map((ev,i) => "pausa " + (i+1) + " às " + fmtClock(ev.pausedAt) + (ev.resumedAt ? ", retomada às " + fmtClock(ev.resumedAt) + " (" + formatElapsed(Math.round((ev.durationMs || 0)/1000)) + ")" : ", ainda pausado")).join("; ")) : "não pausado"));
    L.push("  Limpeza manual da tela: " + ((r.clearEvents || []).length ? r.clearEvents.length + " vez(es) — " + r.clearEvents.map((ev,i) => (i+1) + "ª às " + fmtClock(ev.at)).join("; ") : "não ocorreu"));
    L.push("  Palavras sorteadas: " + drawsText(r));
    L.push("  Palavras da rodada:");
    r.result.words.forEach((w, i) => L.push("    " + (i + 1) + ". " + w.word + " — " + wordLine(w)));
    const hits = r.result.words.filter(w => w.solved).length;
    L.push("  Acertos: " + hits + "/" + r.result.words.length + " | Pontos da rodada: " + r.result.points + (r.teamTotal != null ? " | Total da dupla após a rodada: " + r.teamTotal : ""));
    L.push("");
  });
  if (pendingDraws.length) L.push("Palavras sorteadas para a próxima rodada (ainda não usadas): " + pendingDraws.map((d, k) => (k + 1) + "º sorteio: " + d.join(", ")).join("  →  "), "");
  L.push("AJUSTES MANUAIS DE PONTOS", line);
  if (!adjustLog.length) L.push("Nenhum ajuste.");
  adjustLog.forEach(a => L.push(fmtClock(a.time) + " — " + teamNames[a.team] + ": " + (a.delta > 0 ? "+" : "") + a.delta + " (total " + a.total + ")"));
  L.push("", "PLACAR " + (sessionOver ? "FINAL" : "ATUAL"), line);
  const lb = buildLeaderboard();
  lb.leaderboard.forEach(e => {
    if (lb.individualMode) { L.push(e.rank + "º — " + e.name + ": " + e.score + " pontos (placar individual)"); return; }
    const bt = bestInTeam(e.team);
    const t = e.team, pos = turnOrder.indexOf(t);
    const played = pos >= 0 ? Math.min(roundsPerTeam(), Math.max(0, Math.floor((turnNumber - pos + teamNames.length - 1) / teamNames.length))) : 0;
    L.push(e.rank + "º — " + e.name + ": " + e.score + " pontos (rodadas jogadas: " + played + "/" + roundsPerTeam() + ")");
    if (bt) L.push("     " + bt.text);
  });
  if (lb.notes.length) {
    L.push("", "DESEMPATES (1º média de tempo para acertar; 2º média de desenho — menor é melhor)");
    lb.notes.forEach(n => { L.push("Empate em " + n.score + " pontos:"); n.lines.forEach(x => L.push("  - " + x)); });
  }
  const aw = computeAwards();
  L.push("", "PRÊMIOS INDIVIDUAIS" + (sessionOver ? "" : " (parcial)"), line);
  L.push("Melhor desenhista: " + (aw.drawWinners.length ? aw.drawWinners.map(w => w.name + " (média de " + fmt1(w.avg) + " pts por rodada desenhada)").join("; ") : "—"));
  L.push("Quem mais acertou: " + (aw.guessWinners.length ? aw.guessWinners.map(w => w.name + " (" + w.guessed + " palavras)").join("; ") : "—"));
  L.push("", "ESTATÍSTICAS POR JOGADOR", line);
  aw.players.forEach(p => L.push(p.name + (isIndivMode() ? "" : " (" + teamNames[p.t] + ")") + ": desenhou " + p.drawRounds + " rodada(s), " + p.drawPoints + " pts gerados; acertou " + p.guessed + " palavra(s)"));
  return L.join("\n");
}
document.getElementById("exportGame").addEventListener("click", async () => {
  if (exporting) return;
  exporting = true;
  const btn = document.getElementById("exportGame"), hint = document.getElementById("exportHint");
  try {
    const enc = new TextEncoder(), files = [];
    files.push({ name: "log-do-jogo.txt", data: enc.encode("﻿" + buildGameText()) });
    gameDrawings.forEach((d, i) => { if (d.png) files.push({ name: "desenhos/" + drawFileName(d, i) + ".png", data: dataUrlToBytes(d.png) }); });
    try { files.push({ name: sessionOver ? "placar-final.png" : "placar-parcial.png", data: dataUrlToBytes(await scoreboardPNG()) }); } catch (e) {}
    let note = "";
    const wantVideo = document.getElementById("exportVideoInZip").checked;
    if (wantVideo && gameDrawings.length) {
      if (timerStarted && !roundFinished) note = " (vídeo não incluído: há uma rodada em andamento)";
      else {
        const res = await renderVideo(gameDrawings.map(d => d.cmds), 3000, "Gerando vídeo do jogo");
        if (res) files.push({ name: "video-do-jogo." + res.ext, data: new Uint8Array(await res.blob.arrayBuffer()) });
      }
    }
    const d = new Date();
    const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + "-" + String(d.getHours()).padStart(2, "0") + String(d.getMinutes()).padStart(2, "0");
    deliver(makeZip(files), "minha-lousa-jogo-" + stamp + ".zip");
    if (hint) hint.textContent = "Exportado: log + " + gameDrawings.length + " desenho(s) em PNG" + (files.some(f => f.name.startsWith("video")) ? " + vídeo" : "") + "." + note;
  } catch (err) { alert("Não foi possível exportar o jogo: " + err.message); }
  finally { exporting = false; }
});

refreshDrawControls();
updateThemeDisplay();
updateTimerDisplay();
renderTeams();
