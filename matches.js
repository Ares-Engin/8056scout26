/* ============================================================
   MATCHES PAGE (FIXED – GitHub Pages + Empty DB Safe)
   - Always renders API matches even if Firestore is empty
   - Firebase timing safe
   - Real-time scout merge still works
   ============================================================ */

const auth = firebase.auth();
const db = firebase.firestore();

let frcMatches = [];
let scoutEntries = {};
let currentUser = null;
let apiLoaded = false;
let firestoreLoaded = false;

/* ---------- SAFE START ---------- */
window.addEventListener("load", () => {
  startMatchesPage();
});

async function startMatchesPage() {
  showLoading(true);

  // Auth (optional, do NOT block page)
  auth.onAuthStateChanged(user => {
    currentUser = user || null;
  });

  // 1️⃣ Fetch API FIRST and render immediately
  try {
    frcMatches = await fetchFRCMatches();
    frcMatches.sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));
    apiLoaded = true;
    renderAll(); // 🔥 THIS is what fixes empty page
  } catch (err) {
    console.error("FRC/TBA API fetch failed:", err);
    showError("Could not load match data. Check frc-config.js API key or event code.");
  }

  // 2️⃣ Firestore listener (will enhance cards later)
  db.collection("scouting")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      scoutEntries = {};

      snapshot.forEach(doc => {
        const d = doc.data();
        const mn = d.matchNumber;
        if (mn == null) return;

        if (!scoutEntries[mn]) {
          scoutEntries[mn] = [];
        }

        scoutEntries[mn].push({ id: doc.id, ...d });
      });

      firestoreLoaded = true;
      renderAll(); // 🔥 Re-render WITH scout data
      showLoading(false);
    }, err => {
      console.error("Firestore error:", err);
      showError("Firestore connection failed. Check rules or indexes.");
      showLoading(false);
    });
}

/* ---------- RENDER ---------- */
function renderAll() {
  const container = document.getElementById("matches");
  if (!container) return;

  // If API still not loaded, don't wipe UI
  if (!apiLoaded) return;

  container.innerHTML = "";

  if (!frcMatches || frcMatches.length === 0) {
    container.innerHTML = `<p style="text-align:center;color:#aaa;">No matches found from API.</p>`;
    return;
  }

  frcMatches.forEach(match => {
    const card = buildMatchCard(match);
    container.appendChild(card);
  });
}

/* ---------- BUILD MATCH CARD ---------- */
function buildMatchCard(match) {
  const redScore = match.scoreRedFinal ?? 0;
  const blueScore = match.scoreBlueFinal ?? 0;

  const redWon = redScore > blueScore;
  const blueWon = blueScore > redScore;
  const tied = redScore === blueScore;

  const teams = match.teams || [];
  const redTeams = teams.filter(t => t.station?.startsWith("Red"));
  const blueTeams = teams.filter(t => t.station?.startsWith("Blue"));

  const scouts = scoutEntries[match.matchNumber] || [];

  const card = document.createElement("div");
  card.className = "match-card";

  card.innerHTML = `
    <div class="match-header">
      <span class="match-title">${match.description || `Match ${match.matchNumber}`}</span>
      <span class="match-time">${formatTime(match.actualStartTime)}</span>
    </div>

    <div class="alliance-row">

      <div class="alliance-col alliance-red">
        <div class="alliance-header">
          <span class="alliance-label">🔴 Red</span>
          <span class="alliance-score">${redScore}</span>
          ${redWon ? '<span class="badge-win">WIN</span>' : tied ? '<span class="badge-tie">TIE</span>' : '<span class="badge-loss">LOSS</span>'}
        </div>
        <div class="alliance-teams">
          ${redTeams.map(t => teamBlock(t, scouts)).join("")}
        </div>
      </div>

      <div class="alliance-col alliance-blue">
        <div class="alliance-header">
          <span class="alliance-label">🔵 Blue</span>
          <span class="alliance-score">${blueScore}</span>
          ${blueWon ? '<span class="badge-win">WIN</span>' : tied ? '<span class="badge-tie">TIE</span>' : '<span class="badge-loss">LOSS</span>'}
        </div>
        <div class="alliance-teams">
          ${blueTeams.map(t => teamBlock(t, scouts)).join("")}
        </div>
      </div>

    </div>
  `;

  return card;
}

/* ---------- TEAM BLOCK ---------- */
function teamBlock(teamEntry, scouts) {
  const tn = teamEntry.teamNumber;
  const scout = scouts.find(s => s.teamNumber === tn);

  if (!scout) {
    return `
      <div class="team-block">
        <div class="team-number">#${tn}</div>
        <div class="scout-empty">No scout data</div>
      </div>
    `;
  }

  return `
    <div class="team-block">
      <div class="team-number">#${tn}</div>
      <div class="scout-entry">
        <div>Auto ✓: ${scout.auto?.fuelSuccess ?? 0}</div>
        <div>Tele ✓: ${scout.teleop?.fuelSuccess ?? 0}</div>
        <div>Driver: ${scout.ratings?.driver ?? "—"}/5</div>
        <div class="scout-by">By ${scout.scoutEmail ?? "unknown"}</div>
      </div>
    </div>
  `;
}

/* ---------- HELPERS ---------- */
function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function showLoading(on) {
  const el = document.getElementById("loadingMsg");
  if (el) el.style.display = on ? "block" : "none";
}

function showError(msg) {
  const el = document.getElementById("errorMsg");
  if (el) {
    el.textContent = msg;
    el.style.display = "block";
  }
}
