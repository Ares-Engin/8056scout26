const db = firebase.firestore();
const auth = firebase.auth();
const list = document.getElementById("list");

auth.onAuthStateChanged(async user => {
  if (!user) return location.href = "index.html";

  const u = await db.collection("users").doc(user.uid).get();
  const role = u.data().role;

  if (role !== "team8056" && role !== "admin") {
    list.innerHTML = "<p>Access denied</p>";
    return;
  }

  db.collection("scouting")
    .orderBy("createdAt", "desc")
    .get()
    .then(snap => {
      snap.forEach(doc => {
        const d = doc.data();
        const div = document.createElement("div");
        div.className = "match-card";
        div.innerHTML = `
          <strong>Team ${d.teamNumber} | Match ${d.matchNumber}</strong><br>
          ${d.scout}<br>
          ${d.createdAt?.toDate().toLocaleString()}<br>
          <button class="delete-btn" onclick="db.collection('scouting').doc('${doc.id}').delete().then(()=>location.reload())">Delete</button>
        `;
        list.appendChild(div);
      });
    });
});
