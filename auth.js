const firebaseConfig = {
  apiKey: "AIzaSyDe-UDKwmW3pt9CWeHJW11GpgzKQIFLmN4",
  authDomain: "lfscout26.firebaseapp.com",
  projectId: "lfscout26",
  storageBucket: "lfscout26.firebasestorage.app",
  messagingSenderId: "234755831598",
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
}
