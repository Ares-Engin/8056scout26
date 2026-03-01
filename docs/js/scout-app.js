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
        auto: { level1: 'none' }, // Removed taxi & fuel
        transitionShift: 0,
        teleopShiftA: 0,
        teleopShiftB: 0,
        endgame: { level: 'none', climbTime: null },
        ratings: { driver: 3, speed: 3, defense: 3, stability: 3, comments: '' },
        loading: false,

        // Timer State
        timerActive: false,
        timerSeconds: 0,
        timerInterval: null,
        recordedClimbTime: null,

        startTimer() {
            if (this.timerActive) return;
            this.timerActive = true;
            this.timerInterval = setInterval(() => {
                this.timerSeconds += 0.1;
            }, 100);
        },

        stopTimer() {
            clearInterval(this.timerInterval);
            this.timerActive = false;
        },

        resetTimer() {
            this.stopTimer();
            this.timerSeconds = 0;
            this.recordedClimbTime = null;
            this.endgame.climbTime = null;
        },

        recordClimb() {
            this.stopTimer();
            this.recordedClimbTime = this.timerSeconds.toFixed(1);
            this.endgame.climbTime = Number(this.recordedClimbTime);
        },

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
                        scouterEmail: auth.currentUser?.email,
                        scouterUID: auth.currentUser?.uid
                    },
                    data: {
                        auto: { ...this.auto },
                        transitionShift: this.transitionShift,
                        teleopShiftA: this.teleopShiftA,
                        teleopShiftB: this.teleopShiftB,
                        endgame: { ...this.endgame },
                        ratings: { ...this.ratings },
                    },
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
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
