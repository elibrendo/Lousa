// Estado da rodada: confirmar palavras inicia o cronômetro.
const roundWords = ["", "", "", "", ""];
const solvedWords = [false, false, false, false, false];
const solvedAt = [null, null, null, null, null];
const solvedPoints = [0, 0, 0, 0, 0];
const lockedWords = [false, false, false, false, false];
let drawsRemaining = 3;
const wordBank = {
  frases: ["mula sem cabeça", "cavalo sem cabeça", "elefante de bicicleta", "galinha de óculos", "girafa no elevador", "tubarão de chinelo", "macaco de terno", "pinguim no deserto", "vaca no trampolim", "porco de paraquedas", "gato de botas", "cachorro dirigindo", "jacaré de gravata", "peixe fora d'água", "tartaruga de patins", "urso de pijama", "coelho na academia", "zebra de óculos escuros", "polvo tocando violão", "baleia de guarda-chuva", "pato no skate", "cobra de cachecol", "leão com dor de dente", "papagaio cantor", "camelo na piscina", "formiga carregando sofá", "sapo de capacete", "lobisomem de chinelo", "saci jogando futebol", "boneca de pano assombrada", "vampiro no sol", "fantasma com lençol", "bruxa de vassoura quebrada", "palhaço com medo", "robô dançando forró", "alienígena no ônibus", "dinossauro no mercado", "sereia na banheira", "pizza voadora", "hambúrguer com pernas", "banana de pijama", "melancia de óculos", "sorvete derretendo", "macarrão no cabelo", "ovo andando de patinete", "cenoura de capacete", "batata dançarina", "bolo de aniversário gigante", "cachorro-quente falante", "tomate de paraquedas", "bolo com bigode", "avião de papel", "carro sem rodas", "geladeira voadora", "sofá no telhado", "chuveiro de chocolate", "bicicleta de três rodas", "escada rolante quebrada", "guarda-chuva furado", "cadeira de balanço", "homem-aranha na padaria", "princesa de skate", "rei de chinelo", "pirata dormindo", "astronauta na praia", "noiva correndo", "vovó de moto", "papai noel no verão", "bebê chefe", "professor dançando", "médico sem jaleco", "goleiro de salto alto", "cachorro de óculos escuros", "gato de patins", "pato de gravata", "ovelha de óculos", "girafa de gravata borboleta", "rinoceronte de tutu", "hipopótamo de biquíni", "tucano de chapéu", "elefante de patins", "tartaruga no foguete", "coruja de pijama", "morcego de guarda-chuva", "caranguejo de terno", "cavalo de pijama", "jacaré de sunga", "galinha de tênis", "macaco de bicicleta", "cobra de chapéu", "leão de chinelo", "tigre de gravata", "urso de patinete", "coelho de capa", "pinguim de óculos", "foca de chapéu", "golfinho de gravata", "lagarto de capacete", "porco de bicicleta", "vaca de óculos", "burro de chapéu", "rato de gravata", "fantasma na geladeira", "vampiro de chinelo", "zumbi no ônibus", "bruxa de óculos", "palhaço de cabeça pra baixo", "robô de chinelo", "alienígena de sunga", "pirata de pijama", "ninja de chinelo", "cowboy de tênis", "rei na banheira", "rainha de skate", "princesa de patins", "super-herói de pijama", "mágico sem cartola", "sereia de óculos", "fada de capacete", "gigante de patins", "múmia de patinete", "dragão de chinelo", "pizza de chapéu", "banana de capacete", "abacaxi de óculos", "melancia de patins", "sorvete de cachecol", "hambúrguer de gravata", "ovo de óculos escuros", "pipoca pulando", "bolo de chinelo", "macarrão na cabeça", "queijo de capa", "maçã de chapéu", "cachorro-quente de tênis", "brigadeiro de gravata", "coxinha de óculos", "pão de queijo voador", "uva de pijama", "tomate de chinelo", "cenoura de patins", "limão de gravata", "banho com guarda-chuva", "dormindo de pé", "dentista com medo", "carro de pernas", "casa de cabeça pra baixo", "sol de óculos escuros", "lua de pijama", "nuvem chorando"],
  animais: ["cachorro","gato","cavalo","vaca","porco","galinha","pato","coelho","leão","elefante","girafa","macaco","zebra","tigre","urso","cobra","tartaruga","sapo","peixe","tubarão","baleia","golfinho","borboleta","abelha","aranha","formiga","coruja","pinguim","jacaré","canguru","ovelha","rato","tucano","caranguejo","polvo","camelo","panda","morcego","pavão","lagarta"],
  comidas: ["pizza","hambúrguer","pão","queijo","ovo","arroz","feijão","macarrão","batata frita","sorvete","bolo","chocolate","cachorro-quente","tomate","cenoura","pipoca","sanduíche","salada","sopa","coxinha","pastel","brigadeiro","leite","café","pudim","milho","brócolis","alface","cebola","lasanha","sushi","bacon","salsicha","panqueca","donut","biscoito","torrada","hot dog","espetinho","presunto"],
  filmes: ["Avatar","Barbie","Rambo","Rocky","Tarzan","Ratatouille","Encanto","Godzilla","Superman","Pocahontas","Transformers","Gladiador","Hulk","Thor","Aquaman","Titanic","Rei Leão","Frozen","Toy Story","Procurando Nemo","Shrek","Homem-Aranha","Batman","Harry Potter","Os Vingadores","Carros","Moana","Aladdin","Branca de Neve","Cinderela","Tubarão","Jurassic Park","Star Wars","Matrix","Minions","Divertida Mente","Enrolados","A Bela e a Fera","Kung Fu Panda","King Kong","E.T.","Madagascar","Up","Coco","Zootopia","Os Incríveis","Monstros S.A.","Pinóquio","Dumbo","Bambi","A Pequena Sereia","Mulan","Super Mario","Homem de Ferro","Coringa"],
  frutas: ["banana","maçã","laranja","uva","morango","melancia","abacaxi","pera","pêssego","limão","manga","mamão","melão","coco","kiwi","cereja","mexerica","tangerina","abacate","maracujá","goiaba","caqui","ameixa","figo"],
  esporte: ["bola","luva","chuteira","caneleira","raquete","meião","capacete","joelheira","cotoveleira","rede","gol","trave","apito","medalha","troféu","cronômetro","placar","uniforme","camisa","short","corrida","snorkel","touca","viseira","skate","prancha","patins","bicicleta","halter","anilha","corda","ringue","tatame","taco","beisebol","disco","dardo","badminton","peteca","basquete","futebol","vôlei","tênis","golfe","boliche","cesta","cone","colchonete","squeeze","bolsa","munhequeira","testeira","protetor","colete","bandeirinha","bomba","balé","kimono","judô","esgrima"] ,
  casa: ["cama","guarda-roupa","sofá","tapete","chuveiro","banheiro","privada","pia","torneira","geladeira","fogão","micro-ondas","mesa","cadeira","travesseiro","colchão","cobertor","lençol","abajur","luminária","cortina","espelho","toalha","cabide","sapato","tênis","chinelo","sapateira","cômoda","criado-mudo","poltrona","puff","estante","rack","televisão","ventilador","ar-condicionado","lavadora","tanque","varal","cesto","vassoura","rodo","balde","lixeira","desentupidor","esponja","panela","frigideira","prato","copo","caneca","talher","garfo","faca","colher","tábua","escorredor","liquidificador","cafeteira","torradeira","chaleira","ferro","bidê","aspirador","guarda-chuva","porta","janela","chave","campainha","antena","almofada","rede","mesinha","cabeceira","banheira","cortador","escova","pasta","sabonete","shampoo","rolo","capacho","lata","vaso","quadro","relógio","lustre","churrasqueira","mangueira","espreguiçadeira","balanço"],
  objetos: ["mochila","guarda-chuva","relógio","óculos","chave","carteira","celular","computador","teclado","mouse","fone","câmera","tripé","lanterna","martelo","parafusadeira","tesoura","régua","lápis","caneta","borracha","caderno","livro","garrafa","caneca","prato","talher","panela","frigideira","estojo","pente","secador","controle","carregador","durex","cadeado","binóculo","mala","capacete","bola","tablet","notebook","monitor","impressora","roteador","microfone","alto-falante","joystick","console","drone","cartão","pendrive","HD","SSD","bateria","pilha","extensão","adaptador","tomada","benjamim","RG","passaporte","moeda","cédula","calculadora","grampeador","furador","clipe","post-it","envelope","selo","pincel","tinta","giz","lousa","apagador","nível","trena","alicate","serrote","furadeira","parafuso","prego","porca","arruela","metro","isqueiro","vela","sacola","térmica","cantil","bússola","luneta","lente","grampo","saboneteira","guarda-sol","patinete","hoverboard","bicicleta","refletor","chaveiro","carimbo","corrente","interfone"]
};
// Cada palavra da rodada precisa ser um nome só (sem espaço; hífen pode).
for (const k of Object.keys(wordBank)) if (k !== "frases") wordBank[k] = [...new Set(wordBank[k].filter(w => /^\p{L}+(-\p{L}+)*$/u.test(w)))];

let timerRemaining = 120;
let timerInterval = null;
let timerStarted = false;
let timerPaused = false;
let roundFinished = false;
let roundStartRemaining = 120;
const timerValue = document.getElementById("timerValue");
const durationInput = document.getElementById("durationSeconds");
function configuredDuration() {
  const value = Math.floor(Number(durationInput.value));
  return Number.isFinite(value) && value >= 1 ? Math.min(3600, value) : 120;
}
let totalScore = 0;
const scoreValue = document.getElementById("scoreValue");
const scorePop = document.getElementById("scorePop");
function pointsForRemainingTime(seconds) {
  const tiers = [
    { min: 110, max: Infinity, id: "points5" },
    { min: 60, max: 109, id: "points4" },
    { min: 45, max: 59, id: "points3" },
    { min: 11, max: 44, id: "points2" },
    { min: 0, max: 10, id: "points1" }
  ];
  const tier = tiers.find(t => seconds >= t.min && seconds <= t.max);
  return tier ? Math.max(0, Number(document.getElementById(tier.id).value) || 0) : 0;
}
function addRoundPoints(points) {
  totalScore += points;
  scoreValue.textContent = totalScore;
  scorePop.textContent = "+" + points + " pts";
  scorePop.classList.remove("show");
  void scorePop.offsetWidth;
  scorePop.classList.add("show");
  setTimeout(() => scorePop.classList.remove("show"), 1250);
}
function normalizedWord(word) { return word.trim(); }
function formatElapsed(seconds) {
  if (seconds < 60) return seconds + (seconds === 1 ? " segundo" : " segundos");
  const mins = Math.floor(seconds / 60), secs = seconds % 60;
  return secs ? mins + (mins === 1 ? " minuto e " : " minutos e ") + secs + (secs === 1 ? " segundo" : " segundos") : mins + (mins === 1 ? " minuto" : " minutos");
}
let teamNames = ["Eliezer & Duda", "Amanda & Ezequiel", "Felipe & M. Antonia", "Patrick & Priscila"];
let teamMembers = [["Eliezer", "Duda"], ["Amanda", "Ezequiel"], ["Felipe", "M. Antonia"]];
let teamScores = [0, 0, 0];
let individualScores = Object.create(null);
const freshStats = () => teamMembers.map(m => m.map(() => ({ drawRounds: 0, drawPoints: 0, guessed: 0, guessSecs: 0, guessHits: 0, drawSecs: 0, drawWords: 0 })));
let stats = freshStats();
let turnOrder = [];
let turnNumber = 0;
let lastLoggedRound = null;
let sessionOver = false;
let roleSchedule = [];
let orderArmed = false, orderArmTimer = null;
function restartAnim(el) { if (!el) return; el.style.animation = "none"; void el.offsetWidth; el.style.animation = ""; }
const gameLog = [];
const adjustLog = [];
const pendingDraws = [];
let currentRound = null;
let pauseStartedAt = null;
let pendingStart = false;
let sessionStartedAt = new Date();
const roundsInput = document.getElementById("roundsPerTeam");
const drawOrderButton = document.getElementById("drawOrder");
// Modo que está valendo de verdade (o menu pode estar só "selecionado", sem aplicar).
let appliedTeamMode = "couples", appliedSignature = "couples", appliedAllTimes = 0;
// Casais fixos do grupo Padrão (a ordem casa com as fotos dos cards em #teamCards). Cada um pode ser desativado.
const COUPLES = [['Eliezer','Duda'],['Amanda','Ezequiel'],['Felipe','M. Antonia'],['Patrick','Priscila']];
let appliedCouples = COUPLES.map((_, i) => i);
(function buildCoupleToggles() {
  let off = [];
  try { off = JSON.parse(localStorage.getItem('couplesOff') || '[]'); } catch (e) {}
  if (COUPLES.length - COUPLES.filter((_, i) => off.includes(i)).length < 2) off = [];
  const box = document.getElementById('coupleToggles');
  COUPLES.forEach((c, i) => {
    const lab = document.createElement('label'), cb = document.createElement('input');
    cb.type = 'checkbox'; cb.id = 'couple' + i; cb.checked = !off.includes(i);
    cb.addEventListener('change', () => {
      if (activeCouples().length < 2) { cb.checked = true; alert('Deixe pelo menos 2 casais ativos.'); return; }
      try { localStorage.setItem('couplesOff', JSON.stringify(COUPLES.map((_, k) => k).filter(k => !document.getElementById('couple' + k).checked))); } catch (e) {}
      updateRoundsHint();
    });
    lab.append(cb, ' ' + c.join(' & ')); box.appendChild(lab);
  });
})();
function activeCouples() { return COUPLES.map((_, i) => i).filter(i => document.getElementById('couple' + i).checked); }
const isAllMode = () => appliedTeamMode === "all";
const isOneMode = () => appliedTeamMode === "one";
const isIndivMode = () => appliedTeamMode === "all" || appliedTeamMode === "one";
function filledPlayerNames() { return Array.from({length:8},(_,i)=>document.getElementById('player'+(i+1)).value.trim()).filter(Boolean); }
function currentSignature() {
  const mode = document.getElementById('teamMode').value;
  const names = filledPlayerNames().join('|');
  if (mode === 'couples') return 'couples#' + activeCouples().join(',');
  if (mode === 'pairs') return 'pairs#' + names;
  if (mode === 'all') return 'all#' + names;
  if (mode === 'one') return 'one#' + timesPlaying() + '#' + names;
  return 'custom#' + document.getElementById('customGrouping').value + '#' + names;
}
// "Todos com todos": cada jogador desenha N vezes (para N pessoas diferentes) e adivinha N vezes.
// Cada rodada é uma "equipe" de 2 (quem desenha, quem adivinha) com 1 rodada só.
function allModeTeams(players, times) {
  const order = shuffle(players), out = [];
  for (let k = 1; k <= times; k++) for (let i = 0; i < order.length; i++) out.push([order[i], order[(i + k) % order.length]]);
  return out;
}
// "1 contra todos": cada rodada é uma "equipe" = [quem desenha, ...todos os outros]. Cada jogador desenha N vezes.
function oneModeRounds(players, times) {
  const out = []; let prev = null;
  for (let k = 0; k < times; k++) {
    let order = shuffle(players);
    if (prev !== null && order.length > 1 && order[0] === prev) order.push(order.shift());
    order.forEach(p => out.push([p, ...players.filter(x => x !== p)]));
    prev = order[order.length - 1];
  }
  return out;
}
function applyTeamMode(silent) {
  if (timerStarted && !roundFinished) { alert('Encerre a rodada antes de alterar as equipes.'); return; }
  const mode=document.getElementById('teamMode').value;
  const fields=document.getElementById('playerNameFields'); fields.hidden=false; document.getElementById('customTeamGroups').hidden=mode!=='custom';
  const names=Array.from({length:8},(_,i)=>document.getElementById('player'+(i+1)).value.trim());
  setPhotoIdx(names); setGenders(names, false);
  if(mode==='couples') {
    const act=activeCouples(); if(act.length<2){alert('Deixe pelo menos 2 casais ativos.');return;}
    appliedCouples=act; teamMembers=act.map(i=>COUPLES[i].slice());
  }
  else if(mode==='pairs') {
    const players=names.filter(Boolean);
    if(players.length<2||players.length%2){alert('O modo duplas precisa de um número par de jogadores (2, 4, 6 ou 8). Agora há '+players.length+'.');return;}
    const sh=shuffle(players); teamMembers=[]; for(let i=0;i<sh.length;i+=2) teamMembers.push([sh[i],sh[i+1]]);
  }
  else if(mode==='all') {
    const players=names.filter(Boolean); if(players.length<2){alert('Informe pelo menos dois jogadores.');return;}
    appliedAllTimes=players.length-1; // todos contra todos: 1 vez com cada outra pessoa
    teamMembers=allModeTeams(players,appliedAllTimes);
  } else if(mode==='one') {
    const players=names.filter(Boolean); if(players.length<2){alert('Informe pelo menos dois jogadores.');return;}
    appliedAllTimes=timesPlaying();
    teamMembers=oneModeRounds(players,appliedAllTimes);
  } else {
    const grouping=document.getElementById('customGrouping').value.split('-').map(Number);
    const needed=grouping.reduce((a,b)=>a+b,0);const players=names.filter(Boolean);
    if(players.length!==needed){alert('A divisão '+grouping.join(' × ')+' exige exatamente '+needed+' nomes preenchidos.');return;}
    teamMembers=[];let offset=0;grouping.forEach(size=>{teamMembers.push(players.slice(offset,offset+size));offset+=size;});
  }
  appliedTeamMode=mode;appliedSignature=currentSignature();if(silent!==true)SFX.teams();
  teamNames=mode==='one'?teamMembers.map((m,i)=>m[0]+(appliedAllTimes>1?' ('+(Math.floor(i/Math.max(1,teamMembers.length/appliedAllTimes))+1)+'ª vez)':'')):teamMembers.map(m=>m.join(' & '));teamScores=teamNames.map(()=>0);individualScores=Object.create(null);teamMembers.flat().forEach(name=>{individualScores[name]=0;});stats=freshStats();turnOrder=[];turnNumber=0;sessionOver=false;roleSchedule=[];
  buildTeamCards();
  renderTeams();
  saveSession();
}
function buildTeamCards() {
  const mode=appliedTeamMode;
  delete document.getElementById('turnPhoto').dataset.team;
  teamCardsBox.replaceChildren();
  teamNames.forEach((name,t)=>{const card=document.createElement('div');card.className='team-card';card.dataset.team=t;card.innerHTML='<span class="team-badge" id="teamBadge'+t+'">'+(t+1)+'</span><div class="team-info"><div class="team-name"></div><div class="team-score" id="teamScore'+t+'">0</div><div class="team-rounds" id="teamRounds'+t+'"></div></div><div class="team-status wait" id="teamStatus'+t+'"></div>';card.querySelector('.team-name').textContent=name;{const src=mode==='couples'?couplePhotoSources[appliedCouples[t]]:mode==='one'?playerPhoto(teamMembers[t][0]):compositeAvatar(teamMembers[t]);if(src){const photo=document.createElement('img');photo.src=src;photo.alt=name;card.insertBefore(photo,card.querySelector('.team-info'));}}teamCardsBox.appendChild(card);});
  const select=document.getElementById('adjTeam');select.replaceChildren();teamNames.forEach((name,t)=>{const o=document.createElement('option');o.value=t;o.textContent=name;select.appendChild(o);});
}
let savedTimes = null, durAuto = false, savedDur = null;
// "Todos contra todos": quantidade de rodadas é fixa (todo mundo joga contra todo mundo), então o campo fica travado.
function syncRoundsForTeamMode() {
  const all = document.getElementById('teamMode').value === 'all';
  const lab = document.querySelector('label[for="roundsPerTeam"]');
  if (all && savedTimes === null) savedTimes = roundsInput.value;
  if (!all && savedTimes !== null) { roundsInput.value = savedTimes; savedTimes = null; }
  if (all) roundsInput.value = 1;
  if (lab && lab.firstChild) lab.firstChild.textContent = all ? 'Vezes com cada pessoa' : 'Quantas vezes eu desenho';
  roundsInput.disabled = all || (turnNumber > 0 && !sessionOver);
}
function refreshIdleTimer() { if (!timerStarted) { timerRemaining = configuredDuration(); updateTimerDisplay(); } }
// Ao escolher "Todos contra todos" o tempo vai para 1:30 (volta ao anterior se não foi mexido manualmente).
function autoDuration() {
  const all = document.getElementById('teamMode').value === 'all';
  if (all && !durAuto) { savedDur = durationInput.value; durationInput.value = 90; durAuto = true; refreshIdleTimer(); }
  else if (!all && durAuto) { durationInput.value = savedDur || 120; durAuto = false; refreshIdleTimer(); }
}
durationInput.addEventListener('input', () => { durAuto = false; refreshIdleTimer(); });
// "1 contra todos": o padrão são 5 palavras por rodada (volta ao que era ao sair do modo)
let savedWords = null;
function autoWords() {
  if (timerStarted && !roundFinished) return;
  const one = document.getElementById('teamMode').value === 'one';
  if (one && savedWords === null) { savedWords = confirmedWordsCount; wordsSelect.value = '5'; refreshWordsConfirm(); confirmWordsBtn.click(); }
  else if (!one && savedWords !== null) { wordsSelect.value = String(savedWords); savedWords = null; refreshWordsConfirm(); confirmWordsBtn.click(); }
}
document.getElementById('teamMode').addEventListener('change',()=>{
  const mode=document.getElementById('teamMode').value;
  document.getElementById('playerNameFields').hidden=false;
  document.getElementById('customTeamGroups').hidden=mode!=='custom';
  syncRoundsForTeamMode(); autoDuration(); autoWords();
  if(mode==='pairs') applyTeamMode();
});
document.getElementById('applyTeams').addEventListener('click',()=>applyTeamMode());
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// "Quantas vezes eu desenho" (N): cada jogador desenha N vezes e adivinha N vezes.
//  • Casais/personalizado: cada equipe joga N × (nº de integrantes) rodadas → sessão = N × jogadores.
//  • Todos com todos: N vezes para pessoas diferentes (máx. jogadores − 1) → sessão = jogadores × N.
function timesPlaying() {
  const v = Math.floor(Number(roundsInput.value));
  return Number.isFinite(v) && v >= 1 ? Math.min(10, v) : 2;
}
function roundsPerTeam() {
  if (isIndivMode()) return 1;
  const size = (teamMembers[0] || []).length || 2;
  return timesPlaying() * size;
}
function updateRoundsHint() {
  const el = document.getElementById('roundsHint'); if (!el) return;
  const mode = document.getElementById('teamMode').value, n = timesPlaying();
  const vz = k => k === 1 ? ' vez' : ' vezes';
  const names = filledPlayerNames();
  let text;
  document.getElementById('coupleToggles').hidden = mode !== 'couples';
  if (mode === 'couples') {
    text = 'Cada jogador desenha ' + n + vz(n) + ' e adivinha ' + n + vz(n) + '. Cada casal joga ' + (2 * n) + ' rodadas; a sessão tem ' + (2 * activeCouples().length * n) + ' rodadas no total.';
  } else if (mode === 'pairs') {
    if (names.length < 2 || names.length % 2) text = 'Duplas precisam de um número par de jogadores (agora há ' + names.length + ').';
    else text = 'Duplas sorteadas: cada jogador desenha ' + n + vz(n) + ' e adivinha ' + n + vz(n) + '. Cada dupla joga ' + (2 * n) + ' rodadas; a sessão tem ' + (names.length * n) + ' rodadas no total.';
  } else if (mode === 'one') {
    if (names.length < 2) text = 'Informe pelo menos 2 jogadores.';
    else text = 'Um desenha e todos os outros adivinham. Cada jogador desenha ' + n + vz(n) + ' (' + names.length + ' × ' + n + ' = ' + (names.length * n) + ' rodadas). Quem desenha marca os acertos e, no fim, diz quem acertou cada palavra; quem desenha ganha os mesmos pontos de quem acertou.';
  } else if (mode === 'all') {
    if (names.length < 2) text = 'Informe pelo menos 2 jogadores.';
    else {
      const k = names.length - 1;
      text = 'Todos contra todos: você desenha 1 vez para cada um dos outros ' + k + ' jogadores e adivinha 1 vez com cada um. Ou seja, desenha ' + k + ' e adivinha ' + k + ' (' + (2 * k) + ' rodadas para cada jogador). A sessão tem ' + (names.length * k) + ' rodadas no total.';
    }
  } else {
    const grouping = document.getElementById('customGrouping').value.split('-').map(Number);
    const players = grouping.reduce((a, b) => a + b, 0);
    const porEquipe = grouping.map(sz => sz * n);
    const uniforme = porEquipe.every(x => x === porEquipe[0]);
    text = 'Cada jogador desenha ' + n + vz(n) + ' e adivinha ' + n + vz(n) + '. ' + (uniforme ? 'Cada equipe joga ' + porEquipe[0] + ' rodadas' : 'As equipes jogam ' + porEquipe.join(', ') + ' rodadas') + '; a sessão tem ' + (players * n) + ' rodadas no total.';
  }
  if (currentSignature() !== appliedSignature) text += ' Toque em “Aplicar equipes” para valer.';
  el.textContent = text;
}
roundsInput.addEventListener('input', updateRoundsHint);
['teamMode', 'customGrouping'].forEach(id => document.getElementById(id).addEventListener('change', updateRoundsHint));
for (let i = 1; i <= 8; i++) document.getElementById('player' + i).addEventListener('input', updateRoundsHint);
function roundLabel(round, turn) { return isIndivMode() ? 'Rodada ' + turn + ' de ' + totalTurns() : 'Rodada ' + round + ' de ' + roundsPerTeam(); }
function totalTurns() { return roundsPerTeam() * teamNames.length; }
function currentTeam() { return turnOrder.length && !sessionOver ? turnOrder[turnNumber % teamNames.length] : null; }
function currentRoles() {
  const t = currentTeam();
  if (t === null || !roleSchedule[t]) return null;
  const r = Math.floor(turnNumber / teamNames.length);
  const drawer = roleSchedule[t][r];
  return { team: t, round: r + 1, drawer, guesser: (drawer + 1) % teamMembers[t].length };
}
// Sorteia quem desenha em cada rodada de cada dupla (equilibrado: cada um desenha metade das vezes).
function buildRoleSchedule() {
  const n = roundsPerTeam();
  roleSchedule = teamNames.map((_, teamIndex) => {
    const size=teamMembers[teamIndex].length;
    if (isIndivMode()) return [0];
    const first = Math.floor(Math.random()*size);
    const arr = [];
    for (let i = 0; i < n; i++) arr.push((first+i)%size);
    return arr;
  });
}
function teamPhoto(t) {
  if (appliedTeamMode === 'couples') { const img = document.querySelector('.team-card[data-team="' + t + '"] img'); return img ? img.src : ""; }
  if (appliedTeamMode === 'one') return playerPhoto((teamMembers[t] || [])[0]);
  return compositeAvatar(teamMembers[t] || []);
}
const teamCardsBox = document.getElementById("teamCards");
const couplePhotoSources = Array.from(document.querySelectorAll('#teamCards .team-card img')).map(img => img.src);
const turnInfo = document.getElementById("turnInfo");
function renderTeams() {
  const running = timerStarted && !roundFinished;
  const roles = currentRoles();
  const cur = currentTeam();
  const count = teamNames.length;
  const sorted = turnOrder.length ? turnOrder.slice() : Array.from({length:count},(_,i)=>i); // em sequência de jogo
  sorted.forEach(t => { const card=document.querySelector('.team-card[data-team="'+t+'"]'); if(card) teamCardsBox.appendChild(card); });
  for (let t=0;t<count;t++) {
    const card=document.querySelector('.team-card[data-team="'+t+'"]'); if(!card) continue;
    document.getElementById('teamScore'+t).textContent=teamScores[t];
    const posBadge=turnOrder.indexOf(t);
    const badge=document.getElementById('teamBadge'+t);badge.textContent=posBadge>=0?(posBadge+1)+'º':'';badge.title='Ordem de jogo';
    card.classList.toggle('playing',cur===t);
    const posT=turnOrder.indexOf(t), n=roundsPerTeam();
    const played=posT>=0?Math.min(n,Math.max(0,Math.floor((turnNumber-posT+count-1)/count))):0;
    document.getElementById('teamRounds'+t).textContent=(isMobileLayout()?'Rod. ':'Rodadas jogadas: ')+played+'/'+n;
    let label='😴 Aguardando',cls='wait';
    if(!turnOrder.length) label='Início não sorteado';
    else if(sessionOver){label='🏁 Sessão encerrada';cls='done';}
    else {const posNow=turnNumber%count;if(posT===posNow){label=running?'🎨 Jogando agora':lblNext(t);cls=running?'now':'next';}else if(running&&posT===(posNow+1)%count&&turnNumber+1<totalTurns()){label=lblNext(t);cls='next';}else if(played>=n){label=lblDone(t);cls='done';}}
    const st=document.getElementById('teamStatus'+t);st.textContent=label;st.className='team-status '+cls;
  }
  document.getElementById('setWords').disabled=running;
  if(roles){turnInfo.hidden=false;const photo=document.getElementById('turnPhoto');if(photo.dataset.team!==String(roles.team)){photo.src=teamPhoto(roles.team);photo.dataset.team=String(roles.team);}document.getElementById('turnTeam').textContent=teamNames[roles.team];document.getElementById('turnRoles').innerHTML=isOneMode()?ico('pen')+' '+esc(teamMembers[roles.team][0])+' desenha · '+ico('search')+' todos adivinham':ico('pen')+' '+esc(teamMembers[roles.team][roles.drawer])+' desenha · '+ico('search')+' '+esc(teamMembers[roles.team][roles.guesser])+' adivinha';}else turnInfo.hidden=true;
  syncRoundsForTeamMode();
  const chip=document.getElementById('roundChip');
  if(!turnOrder.length) chip.hidden=true;
  else {chip.hidden=false;chip.textContent=sessionOver?'🏁 Sessão encerrada':(roles?roundLabel(roles.round,turnNumber+1):'');}
  updateRoundsHint();
  const curCard=cur!==null?document.querySelector('.team-card[data-team="'+cur+'"]'):null;
  if(curCard){const bar=teamCardsBox.scrollWidth>teamCardsBox.clientWidth+2?teamCardsBox:document.querySelector('.bottom-bar');bar.scrollTo({left:Math.max(0,curCard.offsetLeft-(bar.clientWidth-curCard.offsetWidth)/2),behavior:'smooth'});}
}
