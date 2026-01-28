const auth = firebase.auth();
const db = firebase.firestore();

/* ---------- COUNTERS ---------- */
const counters = {};

/* ---------- SAFE COUNTER HANDLER ---------- */
function change(id, delta) {
  // If counter not initialized, read from DOM
  if (counters[id] === undefined) {
    const currentText = document.getElementById(id)?.innerText || "0";
    counters[id] = parseInt(currentText, 10) || 0;
  }

  counters[id] = Math.max(0, counters[id] + delta);
  document.getElementById(id).innerText = counters[id];
}

/* ---------- SUBMIT MATCH ---------- */
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
      fuelSuccess: counters.autoFuelSuccess || 0,
      fuelFail: counters.autoFuelFail || 0,
      taxi: autoLeave.checked
    },

    teleop: {
      fuelSuccess: counters.teleFuelSuccess || 0,
      fuelFail: counters.teleFuelFail || 0,
      pickups: counters.pickups || 0,
      drops: counters.drops || 0,
      defense: counters.defense || 0
    },

    endgame: {
      result: endgame.value || "none",
      failed: endgameFail.checked
    },

    ratings: {
      driver: Number(driverRating.value) || null,
      speed: Number(speedRating.value) || null,
      defense: Number(defenseRating.value) || null,
      reliability: reliability.value || null
    },

    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  db.collection("scouting")
    .add(data)
    .then(() => {
      alert("Match submitted successfully");
      location.reload();
    })
    .catch(err => {
      console.error(err);
      alert("Failed to submit match");
    });
}
