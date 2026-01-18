auth.onAuthStateChanged(async user => {
  const u = await db.collection("users").doc(user.uid).get();
  const role = u.data().role;
  const team = u.data().teamNumber;

  let query = db.collection("scouting").orderBy("createdAt", "desc");

  if (role === "user") {
    query = query.where("scoutTeam", "==", team);
  }

  const snap = await query.get();
  snap.forEach(doc => {
    const d = doc.data();
    const div = document.createElement("div");
    div.className = "match-card";
    div.innerHTML = `
      <strong>Team ${d.teamNumber} | Match ${d.matchNumber}</strong><br>
      ${d.scout}<br>
      ${d.createdAt?.toDate().toLocaleString()}
    `;
    document.getElementById("list").appendChild(div);
  });
});
