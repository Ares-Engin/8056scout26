const firebaseConfig = {
  apiKey: "AIzaSyDe-UDKwmW3pt9CWeHJW11GpgzKQIFLmN4",
  authDomain: "lfscout26.firebaseapp.com",
  projectId: "lfscout26"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// 🔹 LOGIN
window.login = function () {
  auth.signInWithEmailAndPassword(email.value, password.value)
    .then(() => location.href = "dashboard.html")
    .catch(e => error.innerText = e.message);
};

// 🔹 REGISTER
window.register = async function () {
  const cred = await auth.createUserWithEmailAndPassword(email.value, password.value);

  let role = "new";

  if (
    name.value === "Ares Engin" &&
    Number(teamNumber.value) === 8056 &&
    Number(birthMonth.value) === 4 &&
    Number(birthYear.value) === 2010
  ) {
    role = "admin";
  }

  await db.collection("users").doc(cred.user.uid).set({
    name: name.value,
    email: email.value,
    teamNumber: Number(teamNumber.value),
    birthMonth: Number(birthMonth.value),
    birthYear: Number(birthYear.value),
    role
  });

  location.href = "dashboard.html";
};
