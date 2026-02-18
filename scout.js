const auth = firebase.auth();
const db = firebase.firestore();

/* ---------- SUBMIT MATCH ---------- */
function submitScout() {

  // Wait for Firebase to confirm auth state
  auth.onAuthStateChanged(function (user) {

    if (!user) {
      alert("Not logged in");
      return;
    }

    const teamNumberEl = document.getElementById("teamNumber");
    const matchNumberEl = document.getElementById("matchNumber");
    const autoLeaveEl = document.getElementById("autoLeave");
    const endgameEl = document.getElementById("endgame");

    const driverRatingEl = document.getElementById("driverRating");
    const speedRatingEl = document.getElementById("speedRating");
    const defenseRatingEl = document.getElementById("defenseRating");
    const reliabilityEl = document.getElementById("reliability");
    const endgameFailEl = document.getElementById("endgameFail");

    if (!teamNumberEl.value || !matchNumberEl.value) {
      alert("Team number and match number are required");
      return;
    }

    const data = {
      scout: user.email,

      teamNumber: Number(teamNumberEl.value),
      matchNumber: Number(matchNumberEl.value),

      meta: {
        matchType: document.querySelector("input[name='matchtype']:checked")?.value || null,
        alliance: document.querySelector("input[name='alliance']:checked")?.value || null
      },

      auto: {
        fuelSuccess: counters.autoFuelSuccess || 0,
        fuelFail: counters.autoFuelFail || 0,
        taxi: autoLeaveEl.checked
      },

      teleop: {
        fuelSuccess: counters.teleFuelSuccess || 0,
        fuelFail: counters.teleFuelFail || 0,
        pickups: counters.pickups || 0,
        drops: counters.drops || 0,
        defense: counters.defense || 0
      },

      endgame: {
        result: endgameEl.value || "none",
        failed: endgameFailEl.checked
      },

      ratings: {
        driver: Number(driverRatingEl.value) || null,
        speed: Number(speedRatingEl.value) || null,
        defense: Number(defenseRatingEl.value) || null,
        reliability: reliabilityEl.value || null
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
        console.error("Firestore error:", err);
        alert("Failed to submit match");
      });

  });

}
