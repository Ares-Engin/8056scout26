/* ============================================================
   MATCHES PAGE SCRIPT (GitHub Pages + FRC API Compatible)
   Fixes:
   - Blank matches page
   - Silent API failures
   - No rendering issue
   - Works even if database is empty
   ============================================================ */

const FRC_CONFIG = {
  season: 2025,
  eventKey: "2025tuhc",   // Format: YEAR + event code (lowercase)
  apiKey: "kIarej54aLEjhvDFU7w4ky7cm3vsrhfi3zGZHU4Kbb0qgBV23gnlZ5coU6bz3ptJ", // ← PUT YOUR TBA KEY HERE
  level: "qm" // qm = qualification matches
};

/* ================= AUTH ================= */
function frcAuthHeader() {
  return "Basic " + btoa(FRC_CONFIG.username + ":" + FRC_CONFIG.token);
}

/* ================= FETCH FRC MATCHES ================= */
async function fetchFRCMatches() {
  try {
    const url = `https://frc-api.firstinspires.org/v3.0/${FRC_CONFIG.season}/matches/${FRC_CONFIG.eventCode}?tournamentLevel=${FRC_CONFIG.level}`;

    const res = await fetch(url, {
      headers: {
        "Authorization": frcAuthHeader(),
        "If-Modified-Since": ""
      }
    });

    if (!res.ok) {
      console.error("FRC API Status:", res.status);
      return [];
    }

    const data = await res.json();
    console.log("FRC API Matches:", data);

    return data.Matches || [];
  } catch (err) {
    console.error("FRC API Fetch Error:", err);
    return [];
  }
}

/* ================= FETCH SELF SCOUTED DATA ================= */
async function fetchLocalScouting() {
  try {
    const res = await fetch("https://frc-scouting-default-rtdb.firebaseio.com/scouting.json");
    if (!res.ok) return [];

    const data = await res.json();
    if (!data) return [];

    return Object.values(data);
  } catch (err) {
    console.error("Local scouting fetch error:", err);
    return [];
  }
}

/* ================= RENDER MATCHES ================= */
function renderMatches(matches) {
  const container = document.getElementById("matchesContainer");

  if (!container) {
    console.error("matchesContainer div not found in HTML");
    return;
  }

  container.innerHTML = "";

  if (!matches || matches.length === 0) {
    container.innerHTML = "<p>No matches found.</p>";
    return;
  }

  matches.forEach(match => {
    const div = document.createElement("div");
    div.className = "match-card";

    const matchNum = match.matchNumber ?? match.match ?? "N/A";

    const redTeams = match.teams
      ? match.teams.filter(t => t.alliance === "Red").map(t => t.teamNumber)
      : (match.redTeams || []);

    const blueTeams = match.teams
      ? match.teams.filter(t => t.alliance === "Blue").map(t => t.teamNumber)
      : (match.blueTeams || []);

    div.innerHTML = `
            <h3>Match ${matchNum}</h3>
            <p><strong>Red:</strong> ${redTeams.join(", ") || "N/A"}</p>
            <p><strong>Blue:</strong> ${blueTeams.join(", ") || "N/A"}</p>
        `;

    container.appendChild(div);
  });
}

/* ================= INIT PAGE ================= */
async function loadMatchesPage() {
  console.log("Loading matches page...");

  const frcMatches = await fetchFRCMatches();
  const localMatches = await fetchLocalScouting();

  console.log("FRC Matches Count:", frcMatches.length);
  console.log("Local Matches Count:", localMatches.length);

  // Always prioritize API matches
  const allMatches = frcMatches.length > 0 ? frcMatches : localMatches;

  renderMatches(allMatches);
}

/* ================= RUN ON PAGE LOAD ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadMatchesPage();
});
