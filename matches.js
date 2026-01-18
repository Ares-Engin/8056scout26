auth.onAuthStateChanged(async user => {
  const userDoc = await db.collection("users").doc(user.uid).get();
  const userData = userDoc.data();

  let query = db.collection("scouting");

  if (!isAdmin(user) && userData.role !== "team8056") {
    query = query.where("scout", "==", user.email);
  }

  query.orderBy("createdAt", "desc").onSnapshot(snapshot => {
    matches.innerHTML = "";
    snapshot.forEach(doc => {
      const d = doc.data();
      matches.innerHTML += `
        <div class="match-card">
          <b>${d.scout}</b>
          <pre>${JSON.stringify(d.numbers, null, 2)}</pre>
        </div>
      `;
    });
  });
});
