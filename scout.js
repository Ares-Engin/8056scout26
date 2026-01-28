const auth = firebase.auth();
const db = firebase.firestore();

/* ---------- COUNTERS ---------- */
const counters = {
  autoFuelSuccess: 0,
  autoFuelFail: 0,
  teleFuelSuccess: 0,
  teleFuelFail: 0,
  pickups: 0,
  drops: 0,
  defense: 0
};

function change(id, delta) {
  counters[id] = Math.max(0, counters[id] + delta);
  document.getElementById(id).innerText = counters[id];
}

/* ---------- SUBMIT ---------- */
function submitScout() {
  const user = auth.currentUser;
  if (!user) {
    alert("Not logged in");
    return;
  }

  const data = {
    scout: user.email,

    teamNumber: Number(teamNumber.value),
    matchNumber: Number(matchNumber.value),

    meta: {
      matchType: document.querySelector("input[name='matchtype']:checked")?.value || null,
      alliance: document.querySelector("input[name='alliance']:checked")?.value || null
    },

    auto: {
      fuelSuccess: counters.autoFuelSuccess,
      fuelFail: counters.autoFuelFail,
      taxi: autoLeave.checked
    },

    teleop: {
      fuelSuccess: counters.teleFuelSuccess,
      fuelFail: counters.teleFuelFail,
      pickups: counters.pickups,
      drops: counters.drops,
      defense: counters.defense
    },

    endgame: {
      result: endgame.value || "none",
      failed: endgameFail.checked
    },

    ratings: {
      driver: Number(driverRating.value),
      speed: Number(speedRating.value),
      defense: Number(defenseRating.value),
      reliability: reliability.value
    },

    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  db.collection("scouting")
    .add(data)
    .then(() => {
      alert("Match submitted");
      location.reload();
    })
    .catch(err => {
      console.error(err);
      alert("Failed to submit match");
    });
}
