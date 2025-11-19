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
  carouri: {
    label: "Carouri",
    icon: "♦",
    hint: "Alege câte carouri a luat fiecare jucător (0–8).",
  },
  dame: {
    label: "Dame",
    icon: "👑",
    hint: "Alege câte dame a luat fiecare jucător (0–4).",
  },
  popa_rosu: {
    label: "Popa Roșu",
    icon: "♥K",
    hint: "Selectează jucătorul care a luat Popa Roșu.",
  },
  zece_trefla: {
    label: "10 de trefla",
    icon: "♣10",
    hint: "Selectează jucătorul care a luat 10 de trefla.",
  },
  whist: {
    label: "Whist",
    icon: "🃏",
    hint: "Alege câte levate a făcut fiecare jucător (0–8).",
  },
  totale: {
    label: "Totale",
    icon: "∑",
    hint: "Introdu manual punctajul pentru fiecare jucător.",
  },
  rentz: {
    label: "Rentz",
    icon: "👑",
    hint: "Atribuie fiecărui jucător un loc unic (1–4).",
  },
};

let players = [];
let currentPlayerIndex = 0;
let activeSubgameKey = null;
let rounds = [];

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

document.addEventListener("DOMContentLoaded", () => {
  startForm.addEventListener("submit", handleStartGame);
  modalCancel.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  modalConfirm.addEventListener("click", handleModalConfirm);
  newGameButton.addEventListener("click", resetToStart);
  topNewGameButton.addEventListener("click", resetToStart);

  playersArea.addEventListener("click", (event) => {
    const pill = event.target.closest(".subgame-pill");
    if (!pill) return;
    const subgameKey = pill.dataset.subgame;
    const playerIndex = parseInt(pill.dataset.playerIndex, 10);
    if (playerIndex !== currentPlayerIndex) return;
    openSubgameModal(subgameKey);
  });

  modalContent.addEventListener("click", (event) => {
    const chip = event.target.closest(".value-chip");
    if (!chip) return;
    const row = chip.closest(".modal-row") || modalContent;
    row.querySelectorAll(".value-chip").forEach((c) =>
      c.classList.remove("selected")
    );
    chip.classList.add("selected");
  });
});

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

  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  renderScoreboard();
  renderPlayersArea();
}

function renderScoreboard() {
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

function getPlayerRank(playerId) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const index = sorted.findIndex((p) => p.id === playerId);
  return index >= 0 ? index + 1 : null;
}

function renderPlayersArea() {
  playersArea.innerHTML = "";
  players.forEach((player, idx) => {
    const card = document.createElement("article");
    card.className =
      "player-card" + (idx === currentPlayerIndex ? " current-turn" : "");
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
          ${rank ? `<span class="rank-badge">Locul ${rank}</span>` : ""}
          ${
            isCurrent
              ? '<span class="turn-indicator">Este rândul lui</span>'
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

function openSubgameModal(subgameKey) {
  activeSubgameKey = subgameKey;
  const currentPlayer = players[currentPlayerIndex];
  const cfg = SUBGAME_CONFIG[subgameKey];
  if (!cfg) return;
  modalTitle.textContent = `Rundă ${cfg.label} aleasă de ${currentPlayer.name}`;
  modalHint.textContent = cfg.hint || "";

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
  }

  modalOverlay.classList.remove("hidden");
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  modalContent.innerHTML = "";
  modalHint.textContent = "";
  activeSubgameKey = null;
}

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

function rentzChipsHtml() {
  let html = '<div class="value-chip-row">';
  for (let i = 1; i <= 4; i++) {
    html += `<button type="button" class="value-chip place-${i}" data-value="${i}">${i}</button>`;
  }
  html += "</div>";
  return html;
}

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

function buildPopaRosuModal() {
  const chips = players
    .map(
      (p) =>
        `<button type="button" class="value-chip player-chip" data-player-index="${p.id}">${escapeHtml(
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
        `<button type="button" class="value-chip player-chip" data-player-index="${p.id}">${escapeHtml(
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
          <input type="number" class="modal-input" />
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
  }

  if (!valid) return;

  rounds.push({
    chooserId: currentPlayerIndex,
    subgameKey: activeSubgameKey,
    deltas: deltas.slice(),
  });

  players.forEach((p, idx) => {
    p.score += deltas[idx];
  });

  const currentPlayer = players[currentPlayerIndex];
  currentPlayer.availableSubgames = currentPlayer.availableSubgames.filter(
    (key) => key !== activeSubgameKey
  );

  closeModal();
  renderScoreboard();
  renderPlayersArea();

  if (isGameFinished()) {
    showEndGameScreen();
  } else {
    advanceTurn();
  }
}

function applyCarouriDeltas(deltas) {
  const rows = modalContent.querySelectorAll(".modal-row");
  rows.forEach((row) => {
    const idx = parseInt(row.dataset.playerIndex, 10);
    const sel = row.querySelector(".value-chip.selected");
    const value = sel ? parseInt(sel.dataset.value || "0", 10) : 0;
    deltas[idx] = value * -20;
  });
  return true;
}

function applyDameDeltas(deltas) {
  const rows = modalContent.querySelectorAll(".modal-row");
  rows.forEach((row) => {
    const idx = parseInt(row.dataset.playerIndex, 10);
    const sel = row.querySelector(".value-chip.selected");
    const value = sel ? parseInt(sel.dataset.value || "0", 10) : 0;
    deltas[idx] = value * -30;
  });
  return true;
}

function applyWhistDeltas(deltas) {
  const rows = modalContent.querySelectorAll(".modal-row");
  rows.forEach((row) => {
    const idx = parseInt(row.dataset.playerIndex, 10);
    const sel = row.querySelector(".value-chip.selected");
    const value = sel ? parseInt(sel.dataset.value || "0", 10) : 0;
    deltas[idx] = value * 20;
  });
  return true;
}

function applyPopaRosuDeltas(deltas) {
  const chip = modalContent.querySelector(".player-chip.selected");
  if (!chip) {
    alert("Selectează jucătorul care a luat Popa Roșu.");
    return false;
  }
  const idx = parseInt(chip.dataset.playerIndex, 10);
  deltas[idx] = -100;
  return true;
}

function applyZeceTreflaDeltas(deltas) {
  const chip = modalContent.querySelector(".player-chip.selected");
  if (!chip) {
    alert("Selectează jucătorul care a luat 10 de trefla.");
    return false;
  }
  const idx = parseInt(chip.dataset.playerIndex, 10);
  deltas[idx] = 100;
  return true;
}

function applyTotaleDeltas(deltas) {
  const rows = modalContent.querySelectorAll(".modal-row");
  rows.forEach((row) => {
    const idx = parseInt(row.dataset.playerIndex, 10);
    const input = row.querySelector(".modal-input");
    const raw = parseInt(input.value, 10);
    if (isNaN(raw)) {
      deltas[idx] = 0;
    } else {
      // Totale acceptă doar puncte negative: orice valoare pozitivă este inversată automat
      const negativeValue = raw > 0 ? -raw : raw;
      deltas[idx] = negativeValue;
    }
  });
  return true;
}

function applyRentzDeltas(deltas) {
  const rows = modalContent.querySelectorAll(".modal-row");
  const places = [];
  const used = new Set();

  rows.forEach((row, rowIndex) => {
    const sel = row.querySelector(".value-chip.selected");
    if (!sel) {
      places[rowIndex] = null;
    } else {
      const place = parseInt(sel.dataset.value || "0", 10);
      places[rowIndex] = place;
      if (used.has(place)) {
        used.add("dup");
      } else {
        used.add(place);
      }
    }
  });

  if (
    places.length !== 4 ||
    !places.every((p) => typeof p === "number" && p >= 1 && p <= 4)
  ) {
    alert("Atribuie fiecărui jucător un loc unic de la 1 la 4.");
    return false;
  }

  if (used.has("dup") || used.size !== 4) {
    alert("Fiecare loc (1, 2, 3, 4) poate fi folosit o singură dată.");
    return false;
  }

  const pointsByPlace = { 1: 400, 2: 300, 3: 200, 4: 100 };
  rows.forEach((row, rowIndex) => {
    const idx = parseInt(row.dataset.playerIndex, 10);
    const place = places[rowIndex];
    deltas[idx] = pointsByPlace[place] || 0;
  });
  return true;
}

function advanceTurn() {
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  renderPlayersArea();
}

function isGameFinished() {
  return players.every((p) => p.availableSubgames.length === 0);
}

function showEndGameScreen() {
  const sorted = [...players].sort((a, b) => b.score - a.score);

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

  
let reportHtml = `
    <div>
      <div class="endgame-toggle">
        <button class="endgame-toggle-btn active" data-report="choices">Raport pe alegeri</button>
        <button class="endgame-toggle-btn" data-report="subgames">Raport pe sub-jocuri</button>
      </div>
      <div id="report-choices">
        <div class="endgame-section-title">Raport final pe alegeri</div>
        ${players
          .map((p, pIndex) => {
            const lines = players
              .map((chooser, chooserIndex) => {
                let total = 0;
                rounds.forEach((r) => {
                  if (r.chooserId === chooserIndex) {
                    total += r.deltas[pIndex] || 0;
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
      <div id="report-subgames" class="hidden">
        <div class="endgame-section-title">Raport final pe sub-jocuri</div>
        ${players
          .map((p, pIndex) => {
            const lines = Object.keys(SUBGAME_CONFIG)
              .map((key) => {
                let total = 0;
                rounds.forEach((r) => {
                  if (r.subgameKey === key) {
                    total += r.deltas[pIndex] || 0;
                  }
                });
                const label = SUBGAME_CONFIG[key].label;
                return `<li>La ${label}: ${total} puncte</li>`;
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
    </div>
  `;

  endGameContent.innerHTML = rankingHtml + reportHtml;
  const toggleButtons = endGameContent.querySelectorAll(".endgame-toggle-btn");
  const choicesSection = endGameContent.querySelector("#report-choices");
  const subgamesSection = endGameContent.querySelector("#report-subgames");
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const mode = btn.dataset.report;
      if (mode === "choices") {
        choicesSection.classList.remove("hidden");
        subgamesSection.classList.add("hidden");
      } else {
        choicesSection.classList.add("hidden");
        subgamesSection.classList.remove("hidden");
      }
    });
  });
  endGameOverlay.classList.remove("hidden");
}

function resetToStart() {
  endGameOverlay.classList.add("hidden");
  gameScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  players = [];
  rounds = [];
  currentPlayerIndex = 0;
  activeSubgameKey = null;
  scoreboardList.innerHTML = "";
  playersArea.innerHTML = "";
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
