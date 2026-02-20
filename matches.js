/* ============================================================
   MATCHES PAGE – FINAL STABLE VERSION (FRC API + FIRESTORE)
   ============================================================ */

const auth = firebase.auth();
const db = firebase.firestore();

let frcMatches = [];
let scoutEntries = {};
let currentUser = null;

/* ---------- ENTRY POINT ---------- */
auth.onAuthStateChanged(async (user) => {
  currentUser = user || null;

  showLoading(true);

  // 🔥 STEP 1: Fetch API matches FIRST (always render them)
  try {
    console.log("Fetching FRC matches...");
    const apiData = await fetchFRCMatches();

    console.log("Raw API Data:", apiData);

    // FRC API returns array directly OR inside Matches depending on wrapper
    frcMatches = Array.isArray(apiData) ? apiData : (apiData || []);

    frcMatches.sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));

    console.log("Parsed Matches:", frcMatches.length);

    // Render immediately (DO NOT wait for Firestore)
    renderAll();

  } catch (err) {
    console.error("FRC API failed:", err);
    showError("Failed to load matches from FRC API. Check frc-config.js credentials & event code.");
    showLoading(false);
    return;
  }

  // 🔥 STEP 2: Attach Firestore listener (optional overlay)
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

      console.log("Scout entries loaded:", scoutEntries);

      // Re-render with scout data overlay
      renderAll();
      showLoading(false);

    }, err => {
      console.error("Firestore error:", err);
      showLoading(false);
    });
});

/* ---------- RENDER ---------- */
function renderAll() {
  const container = document.getElementById("matches");
  const filter = document.getElementById("filterSelect")?.value || "all";

  if (!container) {
    console.error("Matches container not found");
    return;
  }

  container.innerHTML = "";

  if (!frcMatches || frcMatches.length === 0) {
    container.innerHTML = `<p style="text-align:center;color:#aaa;">No matches received from API.</p>`;
    return;
  }

  frcMatches.forEach(match => {
    if (!match) return;

    const redScore = match.scoreRedFinal ?? 0;
    const blueScore = match.scoreBlueFinal ?? 0;

    const redWon = redScore > blueScore;
    const blueWon = blueScore > redScore;

    // Filter logic
    if (filter === "red-win" && !redWon) return;
    if (filter === "blue-win" && !blueWon) return;

    const card = buildMatchCard(match);
    container.appendChild(card);
  });
}

/* ---------- BUILD MATCH CARD (FRC API SAFE) ---------- */
function buildMatchCard(match) {
  const teamsArray = match.teams || [];
  const scouts = scoutEntries[match.matchNumber] || [];

  // FRC API stations: "Red1", "Blue2", etc.
  const redTeams = teamsArray.filter(t => t.station && t.station.includes("Red"));
  const blueTeams = teamsArray.filter(t => t.station && t.station.includes("Blue"));

  const card = document.createElement("div");
  card.className = "match-card";

  card.innerHTML = `
    <div class="match-header">
      <span class="match-title">
        ${match.description || `Match ${match.matchNumber}`}
      </span>
      <span class="match-time">
        ${formatTime(match.actualStartTime)}
      </span>
    </div>

    <div class="alliance-row">

      <div class="alliance-col alliance-red">
        <div class="alliance-header">
          <span>🔴 Red</span>
          <span>${match.scoreRedFinal ?? "—"}</span>
        </div>
        <div class="alliance-teams">
          ${redTeams.map(t => teamBlock(t, scouts)).join("")}
        </div>
      </div>

      <div class="alliance-col alliance-blue">
        <div class="alliance-header">
          <span>🔵 Blue</span>
          <span>${match.scoreBlueFinal ?? "—"}</span>
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

  let scoutHTML = `<div class="scout-empty">No scout data</div>`;

  if (scout) {
    scoutHTML = `
      <div class="scout-entry">
        <div class="scout-row"><span>Auto Fuel ✓</span><b>${scout.auto?.fuelSuccess ?? 0}</b></div>
        <div class="scout-row"><span>Tele Fuel ✓</span><b>${scout.teleop?.fuelSuccess ?? 0}</b></div>
        <div class="scout-row"><span>Defense</span><b>${scout.teleop?.defense ?? 0}</b></div>
        <div class="scout-by">Scouted by ${scout.scoutEmail ?? "unknown"}</div>
      </div>
    `;
  }

  return `
    <div class="team-block">
      <div class="team-number">#${tn}</div>
      ${scoutHTML}
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
