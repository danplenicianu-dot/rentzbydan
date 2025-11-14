// ================================
// CONSTANTE JOC
// ================================
const SUBGAMES = [
  "carouri",
  "dame",
  "popa_rosu",
  "zece_trefla",
  "whist",
  "totale",
  "rentz",
];

const SUBGAME_CONFIG = {
  carouri: { label: "Carouri", icon: "♦", hint: "Alege câte carouri a luat fiecare jucător (0–8)." },
  dame: { label: "Dame", icon: "👑", hint: "Alege câte dame a luat fiecare jucător (0–4)." },
  popa_rosu: { label: "Popa Roșu", icon: "♥K", hint: "Selectează jucătorul care a luat Popa Roșu." },
  zece_trefla: { label: "10 de trefla", icon: "♣10", hint: "Selectează jucătorul care a luat 10 de trefla." },
  whist: { label: "Whist", icon: "🃏", hint: "Alege câte levate a făcut fiecare jucător (0–8)." },
  totale: { label: "Totale", icon: "∑", hint: "Introdu manual punctajul pentru fiecare jucător." },
  rentz: { label: "Rentz", icon: "👑", hint: "Atribuie fiecărui jucător un loc unic (1–4)." },
};

// ================================
// STARE JOC
// ================================
let players = []; // { id, name, score, availableSubgames: [] }
let currentPlayerIndex = 0; // 0-3
let activeSubgameKey = null;
let rounds = []; // { chooserId, subgameKey, deltas: [] }

// ================================
// REFERINȚE DOM
// ================================
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const startForm = document.getElementById("startForm");

const scoreboardList = document.getElementById("scoreboardList");
const playersArea = document.getElementById("playersArea");

const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalHint = document.getElementById("modalHint");
const modalContent = document.getElementById("modalContent");
const modalCancel = document.getElementById("modalCancel");
const modalConfirm = document.getElementById("modalConfirm");

const endGameOverlay = document.getElementById("endGameOverlay");
const endGameContent = document.getElementById("endGameContent");
const newGameButton = document.getElementById("newGameButton");

const topNewGameButton = document.getElementById("topNewGameButton");

// ================================
// INITIALIZARE
// ================================
document.addEventListener("DOMContentLoaded", () => {
  // Evenimente
  startForm.addEventListener("submit", handleStartGame);
  modalCancel.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
  modalConfirm.addEventListener("click", handleModalConfirm);
  newGameButton.addEventListener("click", resetToStart);
  topNewGameButton.addEventListener("click", resetToStart);

  // Event delegation pentru butoanele de subjocuri
  playersArea.addEventListener("click", (event) => {
    const pill = event.target.closest(".subgame-pill");
    if (!pill) return;

    const subgameKey = pill.dataset.subgame;
    const playerIndex = parseInt(pill.dataset.playerIndex, 10);

    // doar jucătorul curent poate alege un subjoc
    if (playerIndex !== currentPlayerIndex) {
      return;
    }

    openSubgameModal(subgameKey);
  });

  // Event delegation pentru chip-urile din modal (numere & jucători)
  modalContent.addEventListener("click", (event) => {
    const chip = event.target.closest(".value-chip");
    if (!chip) return;
    const row = chip.closest(".modal-row");
    if (!row) return;
    row.querySelectorAll(".value-chip").forEach((c) =>
      c.classList.remove("selected")
    );
    chip.classList.add("selected");
  });
});

// ================================
// PORNIRE JOC
// ================================
function handleStartGame(event) {
  event.preventDefault();

  const p1 = document.getElementById("player1").value.trim() || "Jucător 1";
  const p2 = document.getElementById("player2").value.trim() || "Jucător 2";
  const p3 = document.getElementById("player3").value.trim() || "Jucător 3";
  const p4 = document.getElementById("player4").value.trim() || "Jucător 4";

  players = [
    { id: 0, name: p1, score: 0, availableSubgames: [...SUBGAMES] },
    { id: 1, name: p2, score: 0, availableSubgames: [...SUBGAMES] },
    { id: 2, name: p3, score: 0, availableSubgames: [...SUBGAMES] },
    { id: 3, name: p4, score: 0, availableSubgames: [...SUBGAMES] },
  ];

  currentPlayerIndex = 0;
  activeSubgameKey = null;
  rounds = [];

  // Afișare layout joc
  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  renderScoreboard();
  renderPlayersArea();
}

// ================================
// RENDER CLASAMENT
// ================================
function renderScoreboard() {
  // sortare fără a modifica array-ul original
  const sorted = [...players].sort((a, b) => b.score - a.score);
  scoreboardList.innerHTML = "";

  sorted.forEach((player, index) => {
    const li = document.createElement("li");
    li.className = "scoreboard-item" + (index === 0 ? " leader" : "");
    li.innerHTML = `
      <span class="scoreboard-rank">${index + 1}.</span>
      <span class="scoreboard-name">${escapeHtml(player.name)}</span>
      <span class="scoreboard-score">${player.score}</span>
    `;
    scoreboardList.appendChild(li);
  });
}

// Returnează locul curent în clasament al unui jucător după scor
function getPlayerRank(playerId) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const index = sorted.findIndex((p) => p.id === playerId);
  return index >= 0 ? index + 1 : null;
}

// ================================
// RENDER JUCĂTORI + SUBJOCURI
// ================================
function renderPlayersArea() {
  playersArea.innerHTML = "";

  players.forEach((player, idx) => {
    const card = document.createElement("article");
    card.className =
      "player-card player-" + idx + (idx === currentPlayerIndex ? " current-turn" : "");

    const isCurrent = idx === currentPlayerIndex;
    const rank = getPlayerRank(player.id);

    const subgamesHtml = player.availableSubgames
      .map((key) => {
        const cfg = SUBGAME_CONFIG[key];
        if (!cfg) return "";
        return `
          <button
            type="button"
            class="subgame-pill"
            data-subgame="${key}"
            data-player-index="${idx}"
          >
            <strong>${cfg.icon}</strong>
            <span>${cfg.label}</span>
          </button>
        `;
      })
      .join("");

    const subtitle =
      player.availableSubgames.length > 0
        ? "Subjocuri disponibile:"
        : "Toate subjocurile au fost jucate.";

    card.innerHTML = `
      <div class="player-header">
        <div>
          <div class="player-name">${escapeHtml(player.name)}</div>
          <div class="player-tagline">Scor curent: ${player.score}</div>
        </div>
        <div class="player-badge-row">
          ${
            rank
              ? `<span class="rank-badge">Locul ${rank}</span>`
              : ""
          }
          ${
            isCurrent
              ? '<div class="turn-indicator">Este rândul lui</div>'
              : ""
          }
        </div>
      </div>
      <div class="player-subtitle">${subtitle}</div>
      <div class="subgames-list">
        ${subgamesHtml}
      </div>
    `;

    playersArea.appendChild(card);
  });
}

// ================================
// MODAL SUBJOCURI
// ================================
function openSubgameModal(subgameKey) {
  activeSubgameKey = subgameKey;
  const currentPlayer = players[currentPlayerIndex];
  const cfg = SUBGAME_CONFIG[subgameKey];
  if (!cfg) return;

  modalTitle.textContent = `Rundă ${cfg.label} aleasă de ${currentPlayer.name}`;
  modalHint.textContent = cfg.hint || "";

  // conținut diferit în funcție de subjoc
  switch (subgameKey) {
    case "carouri":
      buildCarouriModal();
      break;
    case "dame":
      buildDameModal();
      break;
    case "whist":
      buildWhistModal();
      break;
    case "popa_rosu":
      buildPopaRosuModal();
      break;
    case "zece_trefla":
      buildZeceTreflaModal();
      break;
    case "totale":
      buildTotaleModal();
      break;
    case "rentz":
      buildRentzModal();
      break;
    default:
      break;
  }

  modalOverlay.classList.remove("hidden");
  // for smooth transition
  requestAnimationFrame(() => {
    modalOverlay.classList.add("active");
  });
}

function closeModal() {
  modalOverlay.classList.remove("active");
  setTimeout(() => {
    modalOverlay.classList.add("hidden");
    modalContent.innerHTML = "";
    modalHint.textContent = "";
    activeSubgameKey = null;
  }, 180);
}

// Helper pentru generare chip-uri numerice 0..max
function numberChipsHtml(max) {
  let html = '<div class="value-chip-row">';
  for (let i = 0; i <= max; i++) {
    html += `<button type="button" class="value-chip${
      i === 0 ? " selected" : ""
    }" data-value="${i}">${i}</button>`;
  }
  html += "</div>";
  return html;
}

// Helper pentru Rentz 1..4 cu clase speciale
function rentzChipsHtml() {
  let html = '<div class="value-chip-row">';
  for (let i = 1; i <= 4; i++) {
    html += `<button type="button" class="value-chip place-${i}" data-value="${i}">${i}</button>`;
  }
  html += "</div>";
  return html;
}

// ================================
// BUILD MODAL CONTENT
// ================================
function buildCarouriModal() {
  modalContent.innerHTML = players
    .map(
      (p) => `
      <div class="modal-row" data-player-index="${p.id}">
        <div class="modal-player-name">${escapeHtml(p.name)}</div>
        <div class="modal-input-container">
          ${numberChipsHtml(8)}
        </div>
      </div>
    `
    )
    .join("");
}

function buildDameModal() {
  modalContent.innerHTML = players
    .map(
      (p) => `
      <div class="modal-row" data-player-index="${p.id}">
        <div class="modal-player-name">${escapeHtml(p.name)}</div>
        <div class="modal-input-container">
          ${numberChipsHtml(4)}
        </div>
      </div>
    `
    )
    .join("");
}

function buildWhistModal() {
  modalContent.innerHTML = players
    .map(
      (p) => `
      <div class="modal-row" data-player-index="${p.id}">
        <div class="modal-player-name">${escapeHtml(p.name)}</div>
        <div class="modal-input-container">
          ${numberChipsHtml(8)}
        </div>
      </div>
    `
    )
    .join("");
}

// Popa roșu & 10 trefla: badge-uri cu numele jucătorilor
function buildPopaRosuModal() {
  const chips = players
    .map(
      (p) =>
        `<button type="button" class="value-chip player-chip" data-player-id="${p.id}">${escapeHtml(
          p.name
        )}</button>`
    )
    .join("");

  modalContent.innerHTML = `
    <div class="modal-row">
      <div class="modal-player-name">Alege jucătorul</div>
      <div class="modal-input-container">
        <div class="value-chip-row">
          ${chips}
        </div>
      </div>
    </div>
  `;
}

function buildZeceTreflaModal() {
  const chips = players
    .map(
      (p) =>
        `<button type="button" class="value-chip player-chip" data-player-id="${p.id}">${escapeHtml(
          p.name
        )}</button>`
    )
    .join("");

  modalContent.innerHTML = `
    <div class="modal-row">
      <div class="modal-player-name">Alege jucătorul</div>
      <div class="modal-input-container">
        <div class="value-chip-row">
          ${chips}
        </div>
      </div>
    </div>
  `;
}

function buildTotaleModal() {
  modalContent.innerHTML = players
    .map(
      (p) => `
      <div class="modal-row" data-player-index="${p.id}">
        <div class="modal-player-name">${escapeHtml(p.name)}</div>
        <div class="modal-input-container">
          <input
            type="number"
            class="modal-input"
            step="1"
            value="0"
          />
          <span>puncte</span>
        </div>
      </div>
    `
    )
    .join("");
}

function buildRentzModal() {
  modalContent.innerHTML = players
    .map(
      (p) => `
      <div class="modal-row" data-player-index="${p.id}">
        <div class="modal-player-name">${escapeHtml(p.name)}</div>
        <div class="modal-input-container">
          ${rentzChipsHtml()}
        </div>
      </div>
    `
    )
    .join("");
}

// ================================
// CONFIRMARE RUNDĂ
// ================================
function handleModalConfirm() {
  if (!activeSubgameKey) return;

  let deltas = new Array(players.length).fill(0);
  let valid = true;

  switch (activeSubgameKey) {
    case "carouri":
      valid = applyCarouriDeltas(deltas);
      break;
    case "dame":
      valid = applyDameDeltas(deltas);
      break;
    case "whist":
      valid = applyWhistDeltas(deltas);
      break;
    case "popa_rosu":
      valid = applyPopaRosuDeltas(deltas);
      break;
    case "zece_trefla":
      valid = applyZeceTreflaDeltas(deltas);
      break;
    case "totale":
      valid = applyTotaleDeltas(deltas);
      break;
    case "rentz":
      valid = applyRentzDeltas(deltas);
      break;
    default:
      break;
  }

  if (!valid) {
    return;
  }

  // Salvează runda pentru raportul final
  rounds.push({
    chooserId: players[currentPlayerIndex].id,
    subgameKey: activeSubgameKey,
    deltas: deltas.slice(),
  });

  // Aplică scorurile
  players.forEach((p, idx) => {
    p.score += deltas[idx];
  });

  // Marcați subjocul ca jucat pentru jucătorul curent
  const currentPlayer = players[currentPlayerIndex];
  currentPlayer.availableSubgames = currentPlayer.availableSubgames.filter(
    (key) => key !== activeSubgameKey
  );

  closeModal();

  // Actualizări UI
  renderScoreboard();
  renderPlayersArea();

  // Verifică sfârșitul jocului
  if (isGameFinished()) {
    showEndGameScreen();
  } else {
    // Trecem la jucătorul următor
    advanceTurn();
  }
}

// ----- Aplicație deltas pentru fiecare subjoc -----
function applyCarouriDeltas(deltas) {
  const rows = modalContent.querySelectorAll(".modal-row");
  rows.forEach((row) => {
    const playerIndex = parseInt(row.dataset.playerIndex, 10);
    const selected = row.querySelector(".value-chip.selected");
    const value = selected ? parseInt(selected.dataset.value || "0", 10) : 0;
    deltas[playerIndex] = value * -20;
  });
  return true;
}

function applyDameDeltas(deltas) {
  const rows = modalContent.querySelectorAll(".modal-row");
  rows.forEach((row) => {
    const playerIndex = parseInt(row.dataset.playerIndex, 10);
    const selected = row.querySelector(".value-chip.selected");
    const value = selected ? parseInt(selected.dataset.value || "0", 10) : 0;
    deltas[playerIndex] = value * -30;
  });
  return true;
}

function applyWhistDeltas(deltas) {
  const rows = modalContent.querySelectorAll(".modal-row");
  rows.forEach((row) => {
    const playerIndex = parseInt(row.dataset.playerIndex, 10);
    const selected = row.querySelector(".value-chip.selected");
    const value = selected ? parseInt(selected.dataset.value || "0", 10) : 0;
    deltas[playerIndex] = value * 20;
  });
  return true;
}

function applyPopaRosuDeltas(deltas) {
  const chip = modalContent.querySelector(".player-chip.selected");
  if (!chip) {
    alert("Selectează jucătorul care a luat Popa Roșu.");
    return false;
  }
  const playerIndex = parseInt(chip.dataset.playerId, 10);
  deltas[playerIndex] = -100;
  return true;
}

function applyZeceTreflaDeltas(deltas) {
  const chip = modalContent.querySelector(".player-chip.selected");
  if (!chip) {
    alert("Selectează jucătorul care a luat 10 de trefla.");
    return false;
  }
  const playerIndex = parseInt(chip.dataset.playerId, 10);
  deltas[playerIndex] = 100;
  return true;
}

function applyTotaleDeltas(deltas) {
  const rows = modalContent.querySelectorAll(".modal-row");
  rows.forEach((row) => {
    const playerIndex = parseInt(row.dataset.playerIndex, 10);
    const input = row.querySelector(".modal-input");
    const value = parseInt(input.value || "0", 10);
    deltas[playerIndex] = isNaN(value) ? 0 : value;
  });
  return true;
}

function applyRentzDeltas(deltas) {
  const rows = modalContent.querySelectorAll(".modal-row");
  const places = [];
  const usedPlaces = new Set();

  rows.forEach((row, idx) => {
    const selected = row.querySelector(".value-chip.selected");
    if (!selected) {
      places[idx] = null;
    } else {
      const placeNumber = parseInt(selected.dataset.value || "0", 10);
      places[idx] = placeNumber;
      if (usedPlaces.has(placeNumber)) {
        usedPlaces.add("duplicate");
      } else {
        usedPlaces.add(placeNumber);
      }
    }
  });

  // verificare: trebuie să avem exact locurile 1-4 o singură dată
  if (
    places.length !== 4 ||
    !places.every((p) => typeof p === "number" && p >= 1 && p <= 4)
  ) {
    alert("Atribuie fiecărui jucător un loc unic de la 1 la 4.");
    return false;
  }

  if (usedPlaces.has("duplicate") || usedPlaces.size !== 4) {
    alert("Fiecare loc (1, 2, 3, 4) poate fi folosit o singură dată.");
    return false;
  }

  const pointsByPlace = {
    1: 400,
    2: 300,
    3: 200,
    4: 100,
  };

  rows.forEach((row, idx) => {
    const playerIndex = parseInt(row.dataset.playerIndex, 10);
    const place = places[idx];
    deltas[playerIndex] = pointsByPlace[place] || 0;
  });

  return true;
}

// ================================
// RULAREA JOCULUI
// ================================
function advanceTurn() {
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  renderPlayersArea();
}

function isGameFinished() {
  return players.every((p) => p.availableSubgames.length === 0);
}

function showEndGameScreen() {
  // sortare descrescătoare după scor
  const sorted = [...players].sort((a, b) => b.score - a.score);

  // clasament final
  let rankingHtml = `
    <div>
      <div class="endgame-section-title">Clasament final</div>
      ${sorted
        .map((p, index) => {
          const isWinner = index === 0;
          return `
            <div class="endgame-item ${isWinner ? "winner" : ""}">
              <span class="endgame-name">
                ${escapeHtml(p.name)}
                ${
                  isWinner
                    ? '<span class="winner-badge">Campion 🏆</span>'
                    : ""
                }
              </span>
              <span class="endgame-score">${p.score}</span>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  // raport final pe alegeri
  let reportHtml = `
    <div>
      <div class="endgame-section-title">Raport final pe alegeri</div>
      ${players
        .map((p) => {
          const lines = players
            .map((chooser) => {
              let total = 0;
              rounds.forEach((r) => {
                if (r.chooserId === chooser.id) {
                  total += r.deltas[p.id] || 0;
                }
              });
              return `<li>Pe alegerile lui ${escapeHtml(
                chooser.name
              )} a luat: ${total} puncte</li>`;
            })
            .join("");
          return `
            <div class="final-report-card">
              <div class="final-report-name">${escapeHtml(p.name)}</div>
              <ul class="final-report-list">
                ${lines}
              </ul>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  endGameContent.innerHTML = rankingHtml + reportHtml;

  endGameOverlay.classList.remove("hidden");
  requestAnimationFrame(() => {
    endGameOverlay.classList.add("active");
  });
}

function resetToStart() {
  endGameOverlay.classList.remove("active");
  setTimeout(() => {
    endGameOverlay.classList.add("hidden");
  }, 180);

  // reset stare
  players = [];
  currentPlayerIndex = 0;
  activeSubgameKey = null;
  rounds = [];

  // reset UI
  gameScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
}

// ================================
// UTILITARE
// ================================
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
