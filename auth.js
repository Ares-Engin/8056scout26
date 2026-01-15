const firebaseConfig = {
  apiKey: "AIzaSyDe-UDKwmW3pt9CWeHJW11GpgzKQIFLmN4",
  authDomain: "lfscout26.firebaseapp.com",
  projectId: "lfscout26",
  storageBucket: "lfscout26.firebasestorage.app",
  messagingSenderId: "234755831598",
<<<<<<< HEAD
  appId: "1:234755831598:web:bb2f0846dc8f1539b0acbf",
  measurementId: "G-CHS156EKD4"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

function register() {
  const email = emailInput();
  const password = passwordInput();

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => window.location.href = "scout.html")
    .catch(e => showError(e));
}

function login() {
  const email = emailInput();
  const password = passwordInput();

  auth.signInWithEmailAndPassword(email, password)
    .then(() => window.location.href = "scout.html")
    .catch(e => showError(e));
}

function emailInput() {
  return document.getElementById("email").value;
}

function passwordInput() {
  return document.getElementById("password").value;
}

function showError(err) {
  document.getElementById("error").innerText = err.message;
=======
  appId: "1:234755831598:web:bb2f0846dc8f1539b0acbf"
};

// 🔹 INIT FIREBASE ONCE
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

function register() {
  auth.createUserWithEmailAndPassword(email.value, password.value)
    .then(() => location.href = "scout.html")
    .catch(e => error.innerText = e.message);
}

function login() {
  auth.signInWithEmailAndPassword(email.value, password.value)
    .then(() => location.href = "scout.html")
    .catch(e => error.innerText = e.message);
>>>>>>> 7246201 (New Version Fix)
}
