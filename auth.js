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

function isAdmin(user) {
  return user && user.email === "aress2608@gmail.com";
}

auth.onAuthStateChanged(user => {
  const publicPages = ["index.html", "register.html"];
  const current = location.pathname.split("/").pop();

  if (!user && !publicPages.includes(current)) {
    location.href = "index.html";
  }
});
