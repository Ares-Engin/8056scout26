const firebaseConfig = {
  apiKey: "AIzaSyDe-UDKwmW3pt9CWeHJW11GpgzKQIFLmN4",
  authDomain: "lfscout26.firebaseapp.com",
  projectId: "lfscout26",
  storageBucket: "lfscout26.firebasestorage.app",
  messagingSenderId: "234755831598",
  appId: "1:234755831598:web:bb2f0846dc8f1539b0acbf"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

/* 🔐 ROLE HELPERS */
async function getCurrentUserData() {
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await db.collection("users").doc(user.uid).get();
  return snap.exists ? snap.data() : null;
}

/* 🔐 LOGIN */
function login() {
  auth.signInWithEmailAndPassword(email.value, password.value)
    .then(() => location.href = "dashboard.html")
    .catch(e => error.innerText = e.message);
}

/* 🔐 REGISTER */
function register() {
  auth.createUserWithEmailAndPassword(email.value, password.value)
    .then(async cred => {
      let role = "new";

      // 👑 ADMIN CHECK (YOU)
      if (
        email.value === "aress2608@gmail.com" &&
        Number(teamNumber.value) === 8056 &&
        Number(birthMonth.value) === 4 &&
        Number(birthYear.value) === 2010
      ) {
        role = "admin";
      }

      await db.collection("users").doc(cred.user.uid).set({
        email: email.value,
        fullName: fullName.value,
        teamNumber: Number(teamNumber.value),
        birthMonth: Number(birthMonth.value),
        birthYear: Number(birthYear.value),
        role
      });

      location.href = "dashboard.html";
    })
    .catch(e => error.innerText = e.message);
}

/* 🔓 LOGOUT */
function logout() {
  auth.signOut().then(() => location.href = "index.html");
}
