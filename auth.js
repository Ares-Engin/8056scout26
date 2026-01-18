const firebaseConfig = {
  apiKey: "AIzaSyDe-UDKwmW3pt9CWeHJW11GpgzKQIFLmN4",
  authDomain: "lfscout26.firebaseapp.com",
  projectId: "lfscout26"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

const ADMIN_EMAIL = "YOUREMAIL@EMAIL.COM"; // ← CHANGE ONLY THIS

function login() {
  auth.signInWithEmailAndPassword(email.value, password.value)
    .then(() => location.href = "scout.html")
    .catch(e => error.innerText = e.message);
}

function register() {
  auth.createUserWithEmailAndPassword(email.value, password.value)
    .then(cred => {
      return db.collection("users").doc(cred.user.uid).set({
        name: name.value,
        email: email.value,
        teamNumber: Number(teamNumber.value),
        birthMonth: Number(birthMonth.value), 
        birthYear: Number(birthYear.value),
        role: email.value === ADMIN_EMAIL ? "admin" : "user"
      });
    })
    .then(() => location.href = "scout.html")
    .catch(e => error.innerText = e.message);
}
