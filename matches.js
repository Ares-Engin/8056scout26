auth.onAuthStateChanged(async user => {
  if (!user) return location.href = "index.html";

  const userData = await getCurrentUserData();
  let query = db.collection("scouting").orderBy("createdAt", "desc");

  if (userData.role !== "team8056" && userData.role !== "admin") {
    query = query.where("scoutTeam", "==", userData.teamNumber);
  }

  const snap = await query.get();
  snap.forEach(doc => {
    const d = doc.data();
    const div = document.createElement("div");
    div.className = "match-card";
    div.innerHTML = `
      <b>Team ${d.teamNumber}</b> | Match ${d.matchNumber}<br>
      ${d.scoutEmail}<br>
      ${d.createdAt?.toDate().toLocaleString()}
      ${
        userData.role === "admin" || userData.role === "team8056"
        ? `<button onclick="deleteMatch('${doc.id}')">Delete</button>`
        : ""
      }
    `;
    list.appendChild(div);
  });
});

function deleteMatch(id) {
  if (confirm("Delete match?")) {
    db.collection("scouting").doc(id).delete().then(() => location.reload());
  }
}
