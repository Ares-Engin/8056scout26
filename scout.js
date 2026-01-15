const auth = firebase.auth();
const db = firebase.firestore();

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

function logout() {
  auth.signOut().then(() => location.href = "index.html");
}

function submitScout() {
  const user = auth.currentUser;
  if (!user) return alert("Not logged in");

  const data = {
    scout: user.email,
    season: "DECODE",

    matchNumber: Number(matchNumber.value),
    teamNumber: Number(teamNumber.value),

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
      matchType: document.querySelector("input[name='matchtype']:checked")?.value || null,
      alliance: document.querySelector("input[name='alliance']:checked")?.value || null
    },

    // ✅ CURRENT DATE & TIME (SERVER-SIDE)
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  db.collection("scouting")
    .add(data)
    .then(() => alert("Match submitted"))
    .catch(err => {
      console.error(err);
      alert("Error saving match");
    });
}
