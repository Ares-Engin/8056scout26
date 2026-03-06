// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDe-UDKwmW3pt9CWeHJW11GpgzKQIFLmN4",
  authDomain: "lfscout26.firebaseapp.com",
  projectId: "lfscout26",
  storageBucket: "lfscout26.firebasestorage.app",
  messagingSenderId: "234755831598",
  appId: "1:234755831598:web:bb2f0846dc8f1539b0acbf",
  measurementId: "G-CHS156EKD4"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

/**
 * Check if the user has admin role
 * @param {Object} user Firebase User object
 * @returns {Promise<boolean>}
 */
async function isAdmin(user) {
  if (!user) return false;
  try {
    const doc = await db.collection("users").doc(user.uid).get();
    if (doc.exists) {
      const role = doc.data().role;
      return role === "admin" || role === "team8056"; // Adjust based on your role naming
    }
  } catch (e) {
    console.error("Admin check failed", e);
  }
  return false;
}

// Global Auth State Helper for Alpine
document.addEventListener('alpine:init', () => {
  Alpine.store('auth', {
    user: null,
    profile: null,
    loading: true,
    async init() {
      auth.onAuthStateChanged(async (user) => {
        this.user = user;
        if (user) {
          try {
            const doc = await db.collection("users").doc(user.uid).get();
            if (doc.exists) {
              this.profile = doc.data();
            }
          } catch (e) {
            console.error("Failed to fetch profile", e);
          }
        } else {
          this.profile = null;
        }
        this.loading = false;
      });
    }
  });
});
