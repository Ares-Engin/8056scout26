document.addEventListener('alpine:init', () => {
    Alpine.data('scoutApp', () => ({
        loading: false,
        regional: '',
        matchNumber: '',
        teamNumber: '',
        matchType: 'Qualification',
        alliance: '',
        
        // FRC Fields
        auto: { level1: 'none', scored: '0', failed: '0', samples: 0, specimens: 0 },
        transitionShift: '0',
        teleopShiftA: '0',
        teleopShiftB: '0',
        endgameShift: '0',
        endgame: { level: 'none', ascent: 'none' },
        ratings: { driver: 3, speed: 3, comments: '' },

        ranges: {
            auto: ['0', '1-5', '5-10', '10-15', '15-20', '20-25', '25+'],
            transition: ['0', '1-5', '5-10', '10-20', '20-30', '30+'],
            teleop: ['0', '1-10', '10-20', '20-40', '40-60', '60-80', '80+']
        },

        init() {
            const appState = Alpine.store('appState');
            if (appState.availableEvents.length > 0) {
                this.regional = appState.availableEvents[0].key;
            }
        },

        async submit() {
            if (!this.matchNumber || !this.teamNumber || !this.alliance) {
                alert('Please fill match number, team number, and alliance.');
                return;
            }
            this.loading = true;
            try {
                const appState = Alpine.store('appState');
                const submission = {
                    regional: this.regional,
                    matchNumber: Number(this.matchNumber),
                    teamNumber: Number(this.teamNumber),
                    meta: {
                        matchType: this.matchType,
                        alliance: this.alliance,
                        scouterUID: auth.currentUser?.uid,
                        league: appState.league,
                        season: appState.season
                    },
                    data: (appState.league === 'frc') ? {
                        auto: { ...this.auto },
                        transitionShift: this.transitionShift,
                        teleopShiftA: this.teleopShiftA,
                        endgame: { ...this.endgame }
                    } : {
                        auto: { samples: this.auto.samples, specimens: this.auto.specimens },
                        endgame: { ascent: this.endgame.ascent }
                    },
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                const collection = appState.collectionName;
                await db.collection(collection).add(submission);
                alert('Submission successful!');
                location.href = appState.url('dashboard');
            } catch (e) {
                console.error(e);
                alert('Error submitting: ' + e.message);
                this.loading = false;
            }
        }
    }));
});
