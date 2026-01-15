// 🔹 Firebase (already initialized in auth.js)
const auth = firebase.auth();
const db = firebase.firestore();

// 🔹 ORIGINAL counters (UNCHANGED IDS)
const counters = {
  autoHigh: 0,   // num1
  autoLow: 0,    // num2
  teleHigh: 0,   // num3
  teleLow: 0     // num4
};

// 🔹 Button handler (WORKS WITH YOUR HTML)
function change(id, delta) {
  counters[id] = Math.max(0, counters[id] + delta);
  document.getElementById(id).innerText = counters[id];
}

// 🔹 Logout
function logout() {
  auth.signOut().then(() => window.location.href = "index.html");
}

// 🔹 Submit scouting data (SLOT-BASED, UI-SAFE)
function submitScout() {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in");
    return;
  }

  // 🔹 SLOT SYSTEM (internal, future-proof)
  const numbers = {
    num1: counters.autoHigh,
    num2: counters.autoLow,
    num3: counters.teleHigh,
    num4: counters.teleLow,

    // reserved slots for future seasons
    num5: null,
    num6: null,
    num7: null,
    num8: null,
    num9: null,
    num10: null
  };

  const data = {
    scout: user.email,
    season: "DECODE",

    matchNumber: Number(document.getElementById("matchNumber").value),
    teamNumber: Number(document.getElementById("teamNumber").value),

    seasonYear: Number(document.getElementById("seasonYear").value),
    regionalCompetition: document.getElementById("regionalCompetition").value,

    numbers,

    selects: {
      select1: document.getElementById("autoLeave").checked ? "yes" : null,
      select2: document.getElementById("endgame").value || null
    },

    meta: {
      matchType: document.querySelector("input[name='matchtype']:checked")?.value || null,
      alliance: document.querySelector("input[name='alliance']:checked")?.value || null
    },

    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  db.collection("scouting")
    .add(data)
    .then(() => alert("Match submitted!"))
    .catch(err => {
      console.error(err);
      alert("Error saving data");
    });
}
