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
