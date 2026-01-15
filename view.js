const db = firebase.firestore();
const list = document.getElementById("list");

function goBack() {
  location.href = "scout.html";
}

function formatDate(ts) {
  if (!ts) return "N/A";
  const d = ts.toDate();
  return d.toLocaleDateString() + " " + d.toLocaleTimeString();
}

function deleteMatch(id) {
  if (!confirm("Delete this match?")) return;
  db.collection("scouting").doc(id).delete().then(() => location.reload());
}

db.collection("scouting")
  .orderBy("createdAt", "desc")
  .get()
  .then(snapshot => {
    if (snapshot.empty) {
      list.innerHTML = "<p>No matches yet</p>";
      return;
    }

    snapshot.forEach(doc => {
      const d = doc.data();

      const div = document.createElement("div");
      div.className = "match-card";

      div.innerHTML = `
        <div class="match-header">
          <div class="match-title">
            Team ${d.teamNumber} | Match ${d.matchNumber}
          </div>
          <button class="delete-btn" onclick="deleteMatch('${doc.id}')">🗑</button>
        </div>

        <div class="match-info">
          <div class="info-row">
            <span class="label">Scout</span>
            <span>${d.scout}</span>
          </div>
          <div class="info-row">
            <span class="label">Scouted At</span>
            <span>${formatDate(d.createdAt)}</span>
          </div>
          <div class="info-row">
            <span class="label">Season Year</span>
            <span>${d.seasonYear}</span>
          </div>
          <div class="info-row">
            <span class="label">Regional</span>
            <span>${d.regionalCompetition}</span>
          </div>
          <div class="info-row">
            <span class="label">Alliance</span>
            <span>${d.meta?.alliance || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="label">Match Type</span>
            <span>${d.meta?.matchType || "N/A"}</span>
          </div>
        </div>

        <div class="match-stats">
          <div class="stat-group">
            <strong>Auto</strong>
            <div>High: ${d.numbers?.num1 || 0}</div>
            <div>Low: ${d.numbers?.num2 || 0}</div>
          </div>
          <div class="stat-group">
            <strong>TeleOp</strong>
            <div>High: ${d.numbers?.num3 || 0}</div>
            <div>Low: ${d.numbers?.num4 || 0}</div>
          </div>
          <div class="stat-group">
            <strong>Endgame</strong>
            <div>${d.selects?.select2 || "N/A"}</div>
          </div>
        </div>
      `;

      list.appendChild(div);
    });
  });
