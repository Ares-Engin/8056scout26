const auth = firebase.auth();
const db = firebase.firestore();

const counters = {
  autoHigh: 0,
  autoLow: 0,
  teleHigh: 0,
  teleLow: 0
};

window.change = function (id, delta) {
  counters[id] = Math.max(0, counters[id] + delta);
  document.getElementById(id).innerText = counters[id];
};

window.submitScout = async function () {
  const user = auth.currentUser;
  if (!user) return alert("Not logged in");

  const u = await db.collection("users").doc(user.uid).get();
  const userData = u.data();

  await db.collection("scouting").add({
    scout: userData.name,
    scoutTeam: userData.teamNumber,
    owner: user.uid,

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

    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  alert("Match saved!");
};
