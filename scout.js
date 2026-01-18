const auth = firebase.auth();
const db = firebase.firestore();

const counters = {
  autoHigh: 0,
  autoLow: 0,
  teleHigh: 0,
  teleLow: 0
};

window.change = function(id, delta) {
  counters[id] = Math.max(0, counters[id] + delta);
  document.getElementById(id).innerText = counters[id];
};

function logout() {
  auth.signOut().then(() => location.href = "index.html");
}

async function submitScout() {
  const user = auth.currentUser;
  if (!user) return alert("Not logged in");

  const userDoc = await db.collection("users").doc(user.uid).get();
  const userData = userDoc.data();

  const data = {
    scout: user.email,
    scoutName: userData.name,
    scoutTeam: userData.teamNumber,

    matchNumber: Number(matchNumber.value),
    teamNumber: Number(teamNumber.value),

    season: "DECODE",
    seasonYear: Number(seasonYear.value),
    regionalCompetition: regionalCompetition.value,

    numbers: {
      num1: counters.autoHigh,
      num2: counters.autoLow,
      num3: counters.teleHigh,
      num4: counters.teleLow
    },

    selects: {
      select1: autoLeave.checked ? "yes" : null,
      select2: endgame.value || null
    },

    meta: {
      matchType: document.querySelector("input[name='matchtype']:checked")?.value,
      alliance: document.querySelector("input[name='alliance']:checked")?.value
    },

    owner: user.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  await db.collection("scouting").add(data);

  if (userData.role !== "team8056" && userData.role !== "admin") {
    alert("Match saved. Copy data from table below.");
    showCopyTable(data);
  } else {
    alert("Match submitted!");
  }
}

function showCopyTable(d) {
  const table = document.createElement("table");
  table.innerHTML = `
    <tr><td>Team</td><td>${d.teamNumber}</td></tr>
    <tr><td>Match</td><td>${d.matchNumber}</td></tr>
    <tr><td>Auto High</td><td>${d.numbers.num1}</td></tr>
    <tr><td>Auto Low</td><td>${d.numbers.num2}</td></tr>
    <tr><td>Tele High</td><td>${d.numbers.num3}</td></tr>
    <tr><td>Tele Low</td><td>${d.numbers.num4}</td></tr>
  `;
  document.body.appendChild(table);
}
