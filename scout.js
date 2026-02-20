// Make sure Firebase is already initialized in your HTML before this file loads
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let currentTeamNumber = null;

// SAFE DEFAULT COUNTERS (prevents crashes if counters.js isn't loaded)
window.counters = window.counters || {
  autoFuelSuccess: 0,
  autoFuelFail: 0,
  teleFuelSuccess: 0,
  teleFuelFail: 0,
  pickups: 0,
  drops: 0,
  defense: 0
};

/* ---------- LOAD USER + TEAM ON PAGE START ---------- */
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    alert("You are not logged in.");
    location.href = "index.html";
    return;
  }

  currentUser = user;

  try {
    const doc = await db.collection("users").doc(user.uid).get();

    if (doc.exists) {
      currentTeamNumber = doc.data().teamNumber || null;
      console.log("Loaded team:", currentTeamNumber);
    } else {
      console.warn("User document not found in Firestore");
    }
  } catch (error) {
    console.error("Failed to load user data:", error);
  }
});

/* ---------- SUBMIT MATCH ---------- */
async function submitScout() {
  console.log("Submit button clicked");

  if (!currentUser) {
    alert("User still loading. Please wait a second.");
    return;
  }

  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = "Submitting...";
  }

  try {
    const teamNumberEl = document.getElementById("teamNumber");
    const matchNumberEl = document.getElementById("matchNumber");
    const autoLeaveEl = document.getElementById("autoLeave");
    const endgameEl = document.getElementById("endgame");

    const driverRatingEl = document.getElementById("driverRating");
    const speedRatingEl = document.getElementById("speedRating");
    const defenseRatingEl = document.getElementById("defenseRating");
    const reliabilityEl = document.getElementById("reliability");
    const endgameFailEl = document.getElementById("endgameFail");

    if (!teamNumberEl?.value || !matchNumberEl?.value) {
      alert("Team number and match number are required");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "Submit";
      }
      return;
    }

    const data = {
      // Scout info
      scoutEmail: currentUser.email,
      scoutUID: currentUser.uid,
      scoutTeamNumber: currentTeamNumber,

      // Match info
      teamNumber: Number(teamNumberEl.value),
      matchNumber: Number(matchNumberEl.value),

      meta: {
        matchType:
          document.querySelector("input[name='matchtype']:checked")?.value || null,
        alliance:
          document.querySelector("input[name='alliance']:checked")?.value || null
      },

      auto: {
        fuelSuccess: window.counters.autoFuelSuccess || 0,
        fuelFail: window.counters.autoFuelFail || 0,
        taxi: autoLeaveEl?.checked || false
      },

      teleop: {
        fuelSuccess: window.counters.teleFuelSuccess || 0,
        fuelFail: window.counters.teleFuelFail || 0,
        pickups: window.counters.pickups || 0,
        drops: window.counters.drops || 0,
        defense: window.counters.defense || 0
      },

      endgame: {
        result: endgameEl?.value || "none",
        failed: endgameFailEl?.checked || false
      },

      ratings: {
        driver: Number(driverRatingEl?.value) || null,
        speed: Number(speedRatingEl?.value) || null,
        defense: Number(defenseRatingEl?.value) || null,
        reliability: reliabilityEl?.value || null
      },

      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    console.log("Uploading data:", data);

    await db.collection("scouting").add(data);

    alert("Match submitted successfully!");
    location.reload();

  } catch (err) {
    console.error("Firestore error:", err);
    alert("Failed to submit match. Check console (F12).");
  } finally {
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = "Submit";
    }
  }
}

/* ---------- IMPORTANT: MAKE FUNCTION GLOBAL (FIXES YOUR ERROR) ---------- */
window.submitScout = submitScout;
