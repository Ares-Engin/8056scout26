document.addEventListener('alpine:init', () => {
    Alpine.data('scoutApp', () => ({
        selectedYear: 2025,
        regional: '',
        matchNumber: '',
        teamNumber: '',
        matchType: 'Qualification',
        alliance: 'Red',
        
        auto: { samples: 0, specimens: 0, park: 'none' },
        teleop: { efficiency: 3, highBasket: 0, chamber: 0 },
        endgame: { ascent: 'none' },
        comments: '',
        loading: false,

        get filteredEvents() {
            return FRC_CONFIG.events.filter(e => e.season === 2025);
        },

        init() {
            const params = new URLSearchParams(window.location.search);
            if (params.get('regional')) this.regional = params.get('regional');
            if (params.get('match')) this.matchNumber = params.get('match');
            if (params.get('team')) this.teamNumber = params.get('team');

            if (!this.regional && this.filteredEvents.length > 0) {
                this.regional = this.filteredEvents[0].key;
            }
        },

        async submit() {
            if (!this.matchNumber || !this.teamNumber) return alert('Missing info');
            this.loading = true;
            try {
                const appState = Alpine.store('appState');
                const data = {
                    regional: this.regional,
                    matchNumber: Number(this.matchNumber),
                    teamNumber: Number(this.teamNumber),
                    meta: {
                        matchType: this.matchType,
                        alliance: this.alliance,
                        scouterEmail: auth.currentUser?.email,
                        scouterUID: auth.currentUser?.uid,
                        league: 'ftc',
                        season: 2025
                    },
                    data: {
                        auto: { ...this.auto },
                        teleop: { ...this.teleop },
                        endgame: { ...this.endgame },
                    },
                    comments: this.comments,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                const col = `reports_ftc_2025`; // Specific collection
                await db.collection(col).add(data);
                alert('FTC Data Submitted!');
                location.href = '/' + appState.league + '/' + appState.season + '/dashboard';
            } catch (e) {
                alert(e.message);
                this.loading = false;
            }
        }
    }));
});
