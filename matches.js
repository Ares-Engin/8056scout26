/* ============================================================
   FINAL MATCHES PAGE (WORKS WITH TBA + FIRESTORE + GITHUB PAGES)
   - Shows API matches even if DB empty
   - Merges Firestore scouting correctly
   - Fixes blank page bug
   ============================================================ */

const auth = firebase.auth();
const db = firebase.firestore();

let frcMatches = [];
let scoutEntries = {};

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  initMatchesPage();
});

async function initMatchesPage() {
  showLoading(true);
  console.log("🚀 Matches page initializing...");

  try {
    // 1. Load API matches (TBA)
    frcMatches = await fetchFRCMatches();
    console.log("✅ API Matches Loaded:", frcMatches.length);

    frcMatches.sort((a, b) => a.matchNumber - b.matchNumber);

    // 2. Listen to Firestore scouting (REAL DB)
    db.collection("scouting")
      .onSnapshot(snapshot => {
        console.log("📡 Firestore snapshot received:", snapshot.size);

        scoutEntries = {};

        snapshot.forEach(doc => {
          const data = doc.data();
          const mn = data.matchNumber;

          if (mn == null) return;

          if (!scoutEntries[mn]) {
            scoutEntries[mn] = [];
          }

          scoutEntries[mn].push(data);
        });

        renderAllMatches();
        showLoading(false);
      }, err => {
        console.error("❌ Firestore Error:", err);
        showError("Firestore connection failed.");
        showLoading(false);
      });

  } catch (err) {
    console.error("❌ API ERROR:", err);
    showError("Failed to load matches from API.");
    showLoading(false);
  }
}

/* ================= RENDER ALL ================= */
function renderAllMatches() {
  const container = document.getElementById("matches");
  const filter = document.getElementById("filterSelect")?.value || "all";

  if (!container) {
    console.error("❌ matches div not found!");
    return;
  }

  container.innerHTML = "";

  if (!frcMatches || frcMatches.length === 0) {
    container.innerHTML = "<p style='text-align:center;'>No matches from API.</p>";
    return;
  }

  frcMatches.forEach(match => {
    const redScore = match.scoreRedFinal ?? 0;
    const blueScore = match.scoreBlueFinal ?? 0;

    // Filter logic
    if (filter === "red-win" && redScore <= blueScore) return;
    if (filter === "blue-win" && blueScore <= redScore) return;

    const card = buildMatchCard(match);
    container.appendChild(card);
  });
}

/* ================= BUILD MATCH CARD ================= */
function buildMatchCard(match) {
  const card = document.createElement("div");
  card.className = "match-card";

  const scouts = scoutEntries[match.matchNumber] || [];

  const redTeams = match.teams.filter(t => t.station.startsWith("Red"));
  const blueTeams = match.teams.filter(t => t.station.startsWith("Blue"));

  card.innerHTML = `
    <div class="match-header">
      <h3>${match.description}</h3>
      <span>${formatTime(match.actualStartTime)}</span>
    </div>

    <div class="alliances">

      <div class="alliance red">
        <h4>🔴 Red (${match.scoreRedFinal ?? 0})</h4>
        ${redTeams.map(t => teamBlock(t, scouts)).join("")}
      </div>

      <div class="alliance blue">
        <h4>🔵 Blue (${match.scoreBlueFinal ?? 0})</h4>
        ${blueTeams.map(t => teamBlock(t, scouts)).join("")}
      </div>

    </div>
  `;

  return card;
}

/* ================= TEAM BLOCK ================= */
function teamBlock(team, scouts) {
  const scout = scouts.find(s => s.teamNumber === team.teamNumber);

  if (!scout) {
    return `
      <div class="team-block">
        <b>#${team.teamNumber}</b>
        <div class="scout-empty">No scout data</div>
      </div>
    `;
  }

  return `
    <div class="team-block">
      <b>#${team.teamNumber}</b>
      <div class="scout-data">
        Auto ✓: ${scout.auto?.fuelSuccess ?? 0} |
        Tele ✓: ${scout.teleop?.fuelSuccess ?? 0} |
        Endgame: ${scout.endgame?.result ?? "—"}
      </div>
      <div class="scout-by">Scouted by: ${scout.scoutEmail ?? "unknown"}</div>
    </div>
  `;
}

/* ================= HELPERS ================= */
function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function showLoading(show) {
  const el = document.getElementById("loadingMsg");
  if (el) el.style.display = show ? "block" : "none";
}

function showError(msg) {
  const el = document.getElementById("errorMsg");
  if (el) {
    el.textContent = msg;
    el.style.display = "block";
  }
}

/* ================= FILTER LISTENER ================= */
document.addEventListener("change", (e) => {
  if (e.target.id === "filterSelect") {
    renderAllMatches();
  }
});
