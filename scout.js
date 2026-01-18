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

async function submitScout() {
  const user = auth.currentUser;
  if (!user) return alert("Not logged in");

  const userData = await getCurrentUserData();

  await db.collection("scouting").add({
    scoutUid: user.uid,
    scoutEmail: user.email,
    scoutTeam: userData.teamNumber,

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

    meta: {
      matchType: document.querySelector("input[name='matchtype']:checked")?.value || null,
      alliance: document.querySelector("input[name='alliance']:checked")?.value || null
    },

    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  alert("Match submitted!");
}
