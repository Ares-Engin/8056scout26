// 🔹 Firebase config (YOUR REAL VALUES)
const firebaseConfig = {
  apiKey: "AIzaSyDe-UDKwmW3pt9CWeHJW11GpgzKQIFLmN4",
  authDomain: "lfscout26.firebaseapp.com",
  projectId: "lfscout26",
  storageBucket: "lfscout26.firebasestorage.app",
  messagingSenderId: "234755831598",
  appId: "1:234755831598:web:bb2f0846dc8f1539b0acbf",
  measurementId: "G-CHS156EKD4"
};

// 🔹 Init Firebase (v8 style)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 🔹 Counters
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
  auth.signOut().then(() => window.location.href = "index.html");
}

// 🔹 Submit scouting data
function submitScout() {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in");
    return;
  }

  const data = {
    scout: user.email,
    matchNumber: document.getElementById("matchNumber").value,
    teamNumber: document.getElementById("teamNumber").value,
    auto: {
      high: counters.autoHigh,
      low: counters.autoLow,
      leave: document.getElementById("autoLeave").checked
    },
    teleop: {
      high: counters.teleHigh,
      low: counters.teleLow
    },
    endgame: document.getElementById("endgame").value,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  db.collection("scouting").add(data)
    .then(() => alert("Match submitted!"))
    .catch(err => {
      console.error(err);
      alert("Error saving data");
    });
}
