const firebaseConfig = {
  apiKey: "AIzaSyDe-UDKwmW3pt9CWeHJW11GpgzKQIFLmN4",
  authDomain: "lfscout26.firebaseapp.com",
  projectId: "lfscout26",
  storageBucket: "lfscout26.firebasestorage.app",
  messagingSenderId: "234755831598",
  appId: "1:234755831598:web:bb2f0846dc8f1539b0acbf"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

function register() {
  auth.createUserWithEmailAndPassword(email.value, password.value)
    .then(cred => {
      const user = cred.user;

      const userData = {
        email: user.email,
        role: "new",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (typeof scoutname !== "undefined" && scoutname.value)
        userData.fullName = scoutname.value;

      if (typeof teamno !== "undefined" && teamno.value)
        userData.teamNumber = Number(teamno.value);

      if (typeof birthMonth !== "undefined" && birthMonth.value)
        userData.birthMonth = birthMonth.value;

      if (typeof birthYear !== "undefined" && birthYear.value)
        userData.birthYear = Number(birthYear.value);

      return db.collection("users").doc(user.uid).set(userData);
    })
    .then(() => location.href = "dashboard.html")
    .catch(e => {
      console.error(e);
      error.innerText = e.message;
    });
}

function login() {
  auth.signInWithEmailAndPassword(email.value, password.value)
    .then(() => location.href = "dashboard.html")
    .catch(e => error.innerText = e.message);
}

function logout() {
  auth.signOut().then(() => location.href = "index.html");
}
