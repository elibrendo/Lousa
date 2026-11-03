// ===== Seleção de equipe (grupos de jogadores) =====
const GROUPS = {
  padrao: { names: ["Eliezer", "Duda", "Amanda", "Ezequiel", "Felipe", "M. Antonia", "Patrick", "Priscila"], genders: ["m", "f", "f", "m", "m", "f", "m", "f"] },
  g2: { names: ["Eliezer", "Rafael", "Igor", "Fabricio"], genders: ["m", "m", "m", "m"] }
};
const groupSel = document.getElementById("playerGroup");
let groupKey = "padrao";
function fillGroup(key) {
  const g = GROUPS[key]; if (!g) return;
  for (let i = 0; i < 8; i++) {
    const inp = document.getElementById("player" + (i + 1)), sel = document.getElementById("gender" + (i + 1));
    inp.value = g.names[i] || ""; if (sel) sel.value = g.genders[i] || "m";
  }
  groupKey = key; groupSel.value = key; syncGroupModes(); updateGroupHint(); updateRoundsHint();
}
function syncGroupModes() {
  const isDef = groupSel.value === 'padrao', tm = document.getElementById('teamMode');
  [...tm.options].forEach(o => { o.hidden = o.disabled = false; });
  if (isDef && tm.value === 'pairs') tm.value = 'couples';
  if (!isDef && tm.value === 'couples') tm.value = 'pairs';
  [...tm.options].forEach(o => { if (o.value === 'couples') o.hidden = o.disabled = !isDef; if (o.value === 'pairs') o.hidden = o.disabled = isDef; });
}
function updateGroupHint() { document.getElementById("groupHint").textContent = "Jogadores: " + filledPlayerNames().join(", ") + " (" + filledPlayerNames().length + ")."; }
groupSel.addEventListener("change", () => {
  const k = groupSel.value; if (k === "custom") return;
  if (timerStarted && !roundFinished) { alert("Encerre a rodada antes de trocar o grupo."); groupSel.value = groupKey; return; }
  if (turnNumber > 0 && !sessionOver && !confirm("Trocar o grupo recomeça o jogo atual. Continuar?")) { groupSel.value = groupKey; return; }
  const prev = groupKey; fillGroup(k); applyTeamMode();
  if (appliedSignature !== currentSignature()) { fillGroup(prev); }
});
for (let i = 1; i <= 8; i++) document.getElementById("player" + i).addEventListener("input", () => { groupSel.value = "custom"; syncGroupModes(); updateGroupHint(); if (document.getElementById("teamMode").value === "pairs") updateRoundsHint(); });
document.getElementById("redrawPairs").addEventListener("click", () => {
  if (document.getElementById("teamMode").value !== "pairs") { alert("O sorteio de duplas vale para os grupos que não são o Padrão (no Padrão os casais são fixos)."); return; }
  if (timerStarted && !roundFinished) { alert("Encerre a rodada antes de sortear as duplas."); return; }
  if (turnNumber > 0 && !sessionOver && !confirm("Sortear as duplas de novo recomeça o jogo atual. Continuar?")) return;
  applyTeamMode();
});
