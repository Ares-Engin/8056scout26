document.addEventListener('alpine:init', () => {
    Alpine.data('scoutApp', () => ({
        selectedYear: FRC_CONFIG.defaultSeason,
        availableSeasons: FRC_CONFIG.seasons,
        regional: '',

        get filteredEvents() {
            return FRC_CONFIG.events.filter(e => e.season === Number(this.selectedYear));
        },

        init() {
            // Watch for year changes to reset regional
            this.$watch('selectedYear', (val) => {
                const firstEvent = this.filteredEvents[0];
                if (firstEvent) this.regional = firstEvent.key;
            });

            // Set initial regional if empty
            if (!this.regional) {
                const firstEvent = this.filteredEvents[0];
                if (firstEvent) this.regional = firstEvent.key;
            }
        },

        matchNumber: '',
        teamNumber: '',
        matchType: 'Qualification',
        alliance: '',
        auto: { fuelSuccess: 0, fuelFail: 0, taxi: false },
        teleop: { fuelSuccess: 0, fuelFail: 0, pickups: 0, drops: 0, defense: 0 },
        endgame: { result: 'none', failed: false },
        ratings: { driver: 3, speed: 3, defense: 3, reliability: 'none' },
        loading: false,

        increment(section, key) {
            this[section][key] = (this[section][key] || 0) + 1;
        },

        decrement(section, key) {
            this[section][key] = Math.max(0, (this[section][key] || 0) - 1);
        },

        async submit() {
            if (!this.matchNumber || !this.teamNumber) return alert('Match and Team numbers are required');
            this.loading = true;
            try {
                const data = {
                    regional: this.regional,
                    matchNumber: Number(this.matchNumber),
                    teamNumber: Number(this.teamNumber),
                    meta: {
                        matchType: this.matchType,
                        alliance: this.alliance,
                        scouterTeamNumber: Alpine.store('auth').profile?.teamNumber || 0
                    },
                    auto: { ...this.auto },
                    teleop: { ...this.teleop },
                    endgame: { ...this.endgame },
                    ratings: { ...this.ratings },
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    scoutEmail: auth.currentUser?.email,
                    scoutUID: auth.currentUser?.uid
                };
                await db.collection('scouting').add(data);
                alert('Success!');
                location.href = 'dashboard.html';
            } catch (e) {
                alert('Error: ' + e.message);
                this.loading = false;
            }
        }
    }));
});
