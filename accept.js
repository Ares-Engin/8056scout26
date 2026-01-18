auth.onAuthStateChanged(async user => {
  if (!isAdmin(user)) {
    location.href = "dashboard.html";
    return;
  }

  db.collection("users").where("role", "==", "new")
    .onSnapshot(snapshot => {
      list.innerHTML = "";
      snapshot.forEach(doc => {
        const u = doc.data();
        list.innerHTML += `
          <div class="match-card">
            <b>${u.name}</b><br>
            Team: ${u.team}<br>
            Code: ${u.code}<br><br>
            <button onclick="setRole('${doc.id}','normal')">Normal</button>
            <button onclick="setRole('${doc.id}','team8056')">8056</button>
          </div>
        `;
      });
    });
});

function setRole(id, role) {
  db.collection("users").doc(id).update({ role });
}
