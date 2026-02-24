document.addEventListener('alpine:init', () => {
    Alpine.data('matchesApp', () => ({
        frcMatches: [],
        scoutEntries: {},
        availableSeasons: FRC_CONFIG.seasons,
        availableEvents: FRC_CONFIG.events,
        selectedSeasons: [FRC_CONFIG.defaultSeason],
        selectedEvents: [FRC_CONFIG.events.find(e => e.season === FRC_CONFIG.defaultSeason)?.key].filter(Boolean),
        selectedTypes: ['Qualification'],
        searchQuery: '',
        loading: true,
        errorMessage: '',

        async init() {
            try {
                this.loading = true;
                // Fetch matches for all selected events
                const allMatches = await Promise.all(
                    this.selectedEvents.map(key => fetchFRCMatches(key))
                );
                // Flatten and add event key to each match for filtering
                this.frcMatches = allMatches.flatMap((matches, i) =>
                    matches.map(m => ({ ...m, eventKey: this.selectedEvents[i] }))
                );
                this.frcMatches.sort((a, b) => a.matchNumber - b.matchNumber);

                db.collection('scouting').onSnapshot(snapshot => {
                    this.scoutEntries = {};
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        if (data.matchNumber) {
                            const key = `${data.regional}_${data.matchNumber}`;
                            if (!this.scoutEntries[key]) this.scoutEntries[key] = [];
                            this.scoutEntries[key].push(data);
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
                // Event Filter
                if (this.selectedEvents.length > 0 && !this.selectedEvents.includes(m.eventKey)) return false;

                // Match Type Filter (Mapping TBA description to our types)
                const type = m.description.includes('Qual') ? 'Qualification' :
                    m.description.includes('Practice') ? 'Practice' : 'Finals';
                if (this.selectedTypes.length > 0 && !this.selectedTypes.includes(type)) return false;

                // Search Filter (Team Number or Match Number)
                if (this.searchQuery) {
                    const matchNumMatch = m.matchNumber.toString() === this.searchQuery;
                    const teamMatch = m.teams.some(t => t.teamNumber.toString().includes(this.searchQuery));
                    if (!matchNumMatch && !teamMatch) return false;
                }

                return true;
            });
        },

        isHighlighted(teamNumber) {
            if (!this.searchQuery) return false;
            return teamNumber.toString().includes(this.searchQuery);
        }
    }));
});
