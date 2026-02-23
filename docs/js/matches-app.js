document.addEventListener('alpine:init', () => {
    Alpine.data('matchesApp', () => ({
        frcMatches: [],
        scoutEntries: {},
        filter: 'all',
        teamFilter: '',
        loading: true,
        errorMessage: '',

        async init() {
            try {
                this.frcMatches = await fetchFRCMatches();
                this.frcMatches.sort((a, b) => a.matchNumber - b.matchNumber);

                db.collection('scouting').onSnapshot(snapshot => {
                    this.scoutEntries = {};
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        if (data.matchNumber) {
                            if (!this.scoutEntries[data.matchNumber]) this.scoutEntries[data.matchNumber] = [];
                            this.scoutEntries[data.matchNumber].push(data);
                        }
                    });
                    this.loading = false;
                }, err => {
                    this.errorMessage = 'Firestore connection failed';
                    this.loading = false;
                });
            } catch (err) {
                this.errorMessage = 'Failed to load matches from API';
                this.loading = false;
            }
        },

        filteredMatches() {
            return this.frcMatches.filter(m => {
                // Alliance winner filter
                if (this.filter !== 'all') {
                    const rs = m.scoreRedFinal || 0;
                    const bs = m.scoreBlueFinal || 0;
                    if (this.filter === 'red-win' && rs <= bs) return false;
                    if (this.filter === 'blue-win' && bs <= rs) return false;
                }

                // Team number filter
                if (this.teamFilter) {
                    const hasTeam = m.teams.some(t => t.teamNumber.toString().includes(this.teamFilter));
                    if (!hasTeam) return false;
                }

                return true;
            });
        },

        isHighlighted(teamNumber) {
            if (!this.teamFilter) return false;
            return teamNumber.toString().includes(this.teamFilter);
        }
    }));
});
