document.addEventListener('alpine:init', () => {
    Alpine.data('pitScoutApp', () => ({
        selectedYear: FRC_CONFIG.defaultSeason,
        availableSeasons: FRC_CONFIG.seasons,
        regional: '',
        teamNumber: '',
        loading: false,

        data: {
            driveBase: 'Swerve',
            intake: '',
            shooter: '',
            ballCapacity: 0,
            autoStrategy: '',
            teleopStrategy: '',
            endgameGoal: ''
        },

        get filteredEvents() {
            return FRC_CONFIG.events.filter(e => e.season === Number(this.selectedYear));
        },

        init() {
            // Pre-fill team from URL if present
            const params = new URLSearchParams(window.location.search);
            if (params.has('team')) {
                this.teamNumber = params.get('team');
            }

            // Watch for year changes to reset regional
            this.$watch('selectedYear', (val) => {
                const firstEvent = this.filteredEvents[0];
                if (firstEvent) this.regional = firstEvent.key;
            });

            // Set initial regional
            const firstEvent = this.filteredEvents[0];
            if (firstEvent) this.regional = firstEvent.key;
        },

        async submit() {
            if (!this.teamNumber || !this.regional) return alert('Team and Regional are required');

            this.loading = true;
            try {
                const profile = Alpine.store('auth').profile || {};
                const report = {
                    year: Number(this.selectedYear),
                    regional: this.regional,
                    teamNumber: Number(this.teamNumber),
                    data: { ...this.data },
                    meta: {
                        scouterTeamNumber: profile.teamNumber || 0,
                        scouterRole: profile.role || 'new',
                        scouterEmail: auth.currentUser?.email || 'unknown',
                        isVerified: (profile.role && profile.role !== 'new')
                    },
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                await db.collection('pitScouting').add(report);
                alert('Pit Report Saved Successfully!');
                location.href = 'teams.html';
            } catch (err) {
                console.error("Submission failed:", err);
                alert('Error saving report: ' + err.message);
                this.loading = false;
            }
        }
    }));
});
