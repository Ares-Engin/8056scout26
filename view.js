const db = firebase.firestore();
const list = document.getElementById("list");

function goBack() {
  window.location.href = "scout.html";
}

function formatDate(timestamp) {
  if (!timestamp) return "N/A";
  const date = timestamp.toDate();
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}

function deleteMatch(docId) {
  if (confirm("Are you sure you want to delete this match?")) {
    db.collection("scouting").doc(docId).delete()
      .then(() => {
        alert("Match deleted!");
        location.reload();
      })
      .catch(err => {
        console.error(err);
        alert("Error deleting match");
      });
  }
}

db.collection("scouting")
  .orderBy("createdAt", "desc")
  .get()
  .then(snapshot => {
    if (snapshot.empty) {
      list.innerHTML = "<p style='text-align: center; margin-top: 20px;'>No matches scouted yet</p>";
      return;
    }

    snapshot.forEach(doc => {
      const d = doc.data();
      const docId = doc.id;
      const div = document.createElement("div");
      div.className = "match-card";
      
      div.innerHTML = `
        <div class="match-header">
          <div class="match-title">
            <strong>Team ${d.teamNumber}</strong> | Match ${d.matchNumber}
          </div>
          <button onclick="deleteMatch('${docId}')" class="delete-btn">🗑 Delete</button>
        </div>
        
        <div class="match-info">
          <div class="info-row">
            <span class="label">Scout:</span>
            <span>${d.scout || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="label">Date & Time:</span>
            <span>${formatDate(d.createdAt)}</span>
          </div>
          <div class="info-row">
            <span class="label">Season Year:</span>
            <span>${d.seasonYear || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="label">Regional/Competition:</span>
            <span>${d.regionalCompetition || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="label">Alliance:</span>
            <span>${d.meta?.alliance || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="label">Match Type:</span>
            <span>${d.meta?.matchType || "N/A"}</span>
          </div>
        </div>
        
        <div class="match-stats">
          <div class="stat-group">
            <strong>Autonomous</strong>
            <div>High: ${d.numbers?.num1 || 0}</div>
            <div>Low: ${d.numbers?.num2 || 0}</div>
            <div>Leave: ${d.selects?.select1 === "yes" ? "Yes" : "No"}</div>
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
  })
  .catch(err => {
    console.error(err);
    list.innerHTML = "<p style='color: red;'>Error loading matches</p>";
  });
