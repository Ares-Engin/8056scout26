/* ============================================================
   MATCHES PAGE
   - Fetches match results from FRC API / TBA
   - Listens to Firestore for scout submissions
   - Merges both into rich match cards
   ============================================================ */

const auth = firebase.auth();
const db = firebase.firestore();

let frcMatches = [];      // from API
let scoutEntries = {};    // keyed by matchNumber → array of scout docs
let currentUser = null;   // cached user (optional, no longer required)

/* ---------- ENTRY POINT ---------- */
auth.onAuthStateChanged(async user => {
  // 🔧 FIX: Do NOT force redirect if not logged in
  // Matches page should still work without auth
  currentUser = user || null;

  showLoading(true);

  // 1. Fetch match API (TBA or FRC)
  try {
    frcMatches = await fetchFRCMatches();
    frcMatches.sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));
  } catch (err) {
    console.error("FRC/TBA API fetch failed:", err);
    showError("Could not load match data. Check your API key or event code in frc-config.js.");
    showLoading(false);
    return;
  }

  // 2. Listen to Firestore scouting collection (real-time)
  db.collection("scouting")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      // Rebuild scout entries map safely
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

      showLoading(false);
      renderAll();
    }, err => {
      console.error("Firestore error:", err);
      showError("Firestore connection failed. Check rules or indexes.");
      showLoading(false);
    });
});

/* ---------- RENDER ---------- */
function renderAll() {
  const filter = document.getElementById("filterSelect")?.value || "all";
  const container = document.getElementById("matches");

  if (!container) return;

  container.innerHTML = "";

  if (!frcMatches || frcMatches.length === 0) {
    container.innerHTML = `<p style="text-align:center;color:#aaa;">No matches found.</p>`;
    return;
  }

  frcMatches.forEach(match => {
    // Apply filter
    if (filter !== "all") {
      const redWon = (match.scoreRedFinal ?? 0) > (match.scoreBlueFinal ?? 0);
      const blueWon = (match.scoreBlueFinal ?? 0) > (match.scoreRedFinal ?? 0);

      if (filter === "red-win" && !redWon) return;
      if (filter === "blue-win" && !blueWon) return;
    }

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

  const redTeams = teams.filter(t => t.station && t.station.startsWith("Red"));
  const blueTeams = teams.filter(t => t.station && t.station.startsWith("Blue"));

  const scouts = scoutEntries[match.matchNumber] || [];

  const card = document.createElement("div");
  card.className = "match-card";

  card.innerHTML = `
    <div class="match-header">
      <span class="match-title">${match.description || `Match ${match.matchNumber}`}</span>
      <span class="match-time">${formatTime(match.actualStartTime)}</span>
    </div>

    <div class="alliance-row">

      <!-- RED ALLIANCE -->
      <div class="alliance-col alliance-red">
        <div class="alliance-header">
          <span class="alliance-label">🔴 Red</span>
          <span class="alliance-score">${redScore}</span>
          ${redWon ? '<span class="badge-win">WIN</span>' : tied ? '<span class="badge-tie">TIE</span>' : '<span class="badge-loss">LOSS</span>'}
        </div>
        <div class="alliance-sub">
          Auto: <b>${match.scoreRedAuto ?? "—"}</b> &nbsp;|&nbsp; Foul: <b>${match.scoreRedFoul ?? "—"}</b>
        </div>
        <div class="alliance-teams">
          ${redTeams.map(t => teamBlock(t, scouts)).join("")}
        </div>
      </div>

      <!-- BLUE ALLIANCE -->
      <div class="alliance-col alliance-blue">
        <div class="alliance-header">
          <span class="alliance-label">🔵 Blue</span>
          <span class="alliance-score">${blueScore}</span>
          ${blueWon ? '<span class="badge-win">WIN</span>' : tied ? '<span class="badge-tie">TIE</span>' : '<span class="badge-loss">LOSS</span>'}
        </div>
        <div class="alliance-sub">
          Auto: <b>${match.scoreBlueAuto ?? "—"}</b> &nbsp;|&nbsp; Foul: <b>${match.scoreBlueFoul ?? "—"}</b>
        </div>
        <div class="alliance-teams">
          ${blueTeams.map(t => teamBlock(t, scouts)).join("")}
        </div>
      </div>

    </div>
  `;

  return card;
}

/* ---------- TEAM BLOCK (with optional scout data) ---------- */
function teamBlock(teamEntry, scouts) {
  const tn = teamEntry.teamNumber;
  const scout = scouts.find(s => s.teamNumber === tn);

  let scoutHTML = "";

  if (scout) {
    const auto = scout.auto || {};
    const teleop = scout.teleop || {};
    const eg = scout.endgame || {};
    const rat = scout.ratings || {};

    scoutHTML = `
      <div class="scout-entry">
        <div class="scout-row"><span>Auto Fuel ✓</span><b>${auto.fuelSuccess ?? 0}</b></div>
        <div class="scout-row"><span>Auto Fuel ✗</span><b>${auto.fuelFail ?? 0}</b></div>
        <div class="scout-row"><span>Taxi</span><b>${auto.taxi ? "Yes" : "No"}</b></div>
        <div class="scout-row"><span>Tele Fuel ✓</span><b>${teleop.fuelSuccess ?? 0}</b></div>
        <div class="scout-row"><span>Tele Fuel ✗</span><b>${teleop.fuelFail ?? 0}</b></div>
        <div class="scout-row"><span>Pickups</span><b>${teleop.pickups ?? 0}</b></div>
        <div class="scout-row"><span>Drops</span><b>${teleop.drops ?? 0}</b></div>
        <div class="scout-row"><span>Defense</span><b>${teleop.defense ?? 0}</b></div>
        <div class="scout-row"><span>Endgame</span><b>${eg.result ?? "—"}</b></div>
        ${eg.failed ? '<div class="scout-row warn"><span>Endgame Failed</span><b>⚠️</b></div>' : ""}
        <div class="scout-row"><span>Driver</span><b>${rat.driver ?? "—"}/5</b></div>
        <div class="scout-row"><span>Speed</span><b>${rat.speed ?? "—"}/5</b></div>
        <div class="scout-row"><span>Defense Rtg</span><b>${rat.defense ?? "—"}/5</b></div>
        <div class="scout-row"><span>Reliability</span><b>${rat.reliability ?? "—"}</b></div>
        <div class="scout-by">Scouted by ${scout.scoutEmail ?? "unknown"}</div>
      </div>
    `;
  } else {
    scoutHTML = `<div class="scout-empty">No scout data</div>`;
  }

  return `
    <div class="team-block ${teamEntry.dq ? "team-dq" : ""}">
      <div class="team-number">#${tn}${teamEntry.dq ? " <span class='dq-badge'>DQ</span>" : ""}</div>
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
