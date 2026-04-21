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

  // Global App State for League and Season selection
  Alpine.store('appState', {
    league: 'frc',
    season: '2026',
    regional: '',

    init() {
        const params = new URLSearchParams(window.location.search);
        
        // 1. Priority: URL Params (for deep linking)
        const urlLeague = params.get('league');
        const urlSeason = params.get('season');
        const urlRegional = params.get('regional');

        if (urlLeague) this.league = urlLeague;
        else this.league = localStorage.getItem('app_league') || 'frc';

        if (urlSeason) this.season = urlSeason;
        else this.season = localStorage.getItem('app_season') || '2026';

        if (urlRegional) this.regional = urlRegional;

        // 2. Persist initial state
        localStorage.setItem('app_league', this.league);
        localStorage.setItem('app_season', this.season);
    },
    
    setLeague(l) {
        this.league = l;
        // Automatic Season Shift
        if (l === 'ftc') this.season = '2025';
        else if (l === 'frc') this.season = '2026';
        
        localStorage.setItem('app_league', this.league);
        localStorage.setItem('app_season', this.season);
        window.dispatchEvent(new Event('app-state-changed'));
    },
    
    setSeason(s) {
        this.season = s;
        localStorage.setItem('app_season', s);
        window.dispatchEvent(new Event('app-state-changed'));
    },
    
    get basePath() {
        const path = window.location.pathname;
        // Specifically handle the 8056scout26 repo prefix for GitHub Pages
        if (path.includes('/8056scout26/')) return '/8056scout26';
        return '';
    },

    /**
     * Generates a parametric URL including base path
     * @param {string} page The page name (e.g. 'dashboard')
     * @param {string} regional Optional regional key
     * @param {string} subId Optional sub-id (match # or team #)
     */
    url(page, regional = '', subId = '') {
        const base = this.basePath;
        const reg = regional || this.regional;
        let path = `${base}/${this.league}/${this.season}`;
        
        if (reg) {
            path += `/${reg}`;
        }
        
        path += `/${page}`;
        
        if (subId) {
            path += `/${subId}`;
        }
        
        return path;
    },

    get collectionName() {
        return `scouting_${this.league}_${this.season}`;
    },

    get pitCollectionName() {
        return `pit-scouting_${this.league}_${this.season}`;
    }
  });
});
