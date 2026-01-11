<<<<<<< HEAD
const firebaseConfig = {
  apiKey: "AIzaSyDe-UDKwmW3pt9CWeHJW11GpgzKQIFLmN4",
  authDomain: "lfscout26.firebaseapp.com",
  projectId: "lfscout26",
  storageBucket: "lfscout26.firebasestorage.app",
  messagingSenderId: "234755831598",
  appId: "1:234755831598:web:bb2f0846dc8f1539b0acbf",
  measurementId: "G-CHS156EKD4"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

auth.onAuthStateChanged(user => {
  if (!user) window.location.href = "index.html";
});

function submitData() {
  const data = {
    scout: scoutName(),
    match: matchNumber(),
    team: teamNumber(),
    autoCoral: autoCoral(),
    teleopCoral: teleopCoral(),
    comment: comment(),
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  db.collection("matches").add(data)
    .then(() => status("Saved ✔"))
    .catch(e => status(e.message));
}

function logout() {
  auth.signOut().then(() => window.location.href = "index.html");
}

/* helpers */
const v = id => document.getElementById(id).value;
const scoutName = () => v("scoutName");
const matchNumber = () => v("matchNumber");
const teamNumber = () => v("teamNumber");
const autoCoral = () => v("autoCoral");
const teleopCoral = () => v("teleopCoral");
const comment = () => v("comment");
const status = t => document.getElementById("status").innerText = t;
=======
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { addDoc, collection, serverTimestamp } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

onAuthStateChanged(auth, user => {
  if (!user) window.location.href = "index.html";
});

document.getElementById("scoutForm").addEventListener("submit", async e => {
  e.preventDefault();

  await addDoc(collection(db, "scouting"), {
    scout: auth.currentUser.email,
    matchNumber: matchNumber.value,
    teamNumber: teamNumber.value,
    autoCoral: autoCoral.value,
    teleopCoral: teleopCoral.value,
    endgame: endgame.value,
    driverSkill: driver.value,
    comment: comment.value,
    time: serverTimestamp()
  });

  status.innerText = "✅ Match submitted!";
  e.target.reset();
});
>>>>>>> 93e86b19b715aef053c8530644d305ded61b89c5
