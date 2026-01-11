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
