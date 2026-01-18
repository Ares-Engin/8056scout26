const counters = {
  autoHigh: 0,
  autoLow: 0,
  teleHigh: 0,
  teleLow: 0
};

function change(id, delta) {
  counters[id] = Math.max(0, counters[id] + delta);
  document.getElementById(id).innerText = counters[id];
}

function submitScout() {
  const user = auth.currentUser;
  if (!user) return alert("Not logged in");

  db.collection("scouting").add({
    scout: user.email,
    numbers: counters,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => alert("Match submitted"))
  .catch(err => alert(err.message));
}
