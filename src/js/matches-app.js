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
        expandedMatches: [],

        toggleMatch(key) {
            if (this.expandedMatches.includes(key)) {
                this.expandedMatches = this.expandedMatches.filter(k => k !== key);
            } else {
                this.expandedMatches.push(key);
            }
        },

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
            // Get all unique match keys from scoutEntries
            const scoutedKeys = Object.keys(this.scoutEntries);

            // Start with API matches
            let list = this.frcMatches.map(m => {
                const type = m.description.includes('Qual') ? 'Qualification' :
                    m.description.includes('Practice') ? 'Practice' : 'Playoffs';
                const eventShort = this.availableEvents.find(e => e.key === m.eventKey)?.name.split(' ')[0] || m.eventKey;
                const year = this.availableEvents.find(e => e.key === m.eventKey)?.season || '';

                return {
                    ...m,
                    type,
                    eventShort,
                    year,
                    isManual: false
                };
            });

            // Add scouted matches that are NOT in the API list
            scoutedKeys.forEach(key => {
                const [regional, matchNum] = key.split('_');
                const alreadyInList = list.some(m => m.eventKey === regional && m.matchNumber.toString() === matchNum);

                if (!alreadyInList) {
                    const entries = this.scoutEntries[key];
                    const firstEntry = entries[0];
                    const eventObj = this.availableEvents.find(e => e.key === regional);

                    list.push({
                        matchNumber: Number(matchNum),
                        eventKey: regional,
                        eventShort: eventObj?.name.split(' ')[0] || regional,
                        year: eventObj?.season || '',
                        type: firstEntry.meta?.matchType || 'Scouted',
                        description: `${firstEntry.meta?.matchType || 'Match'} ${matchNum}`,
                        teams: [], // We don't have the full alliance from API, but we'll highlight the scouted teams
                        isManual: true,
                        scoutedTeams: entries.map(e => e.teamNumber)
                    });
                }
            });

            return list.filter(m => {
                // Event Filter
                if (this.selectedEvents.length > 0 && !this.selectedEvents.includes(m.eventKey)) return false;

                // Match Type Filter
                if (this.selectedTypes.length > 0 && !this.selectedTypes.includes(m.type)) return false;

                // Search Filter (Team Number or Match Number)
                if (this.searchQuery) {
                    const matchNumMatch = m.matchNumber.toString() === this.searchQuery;
                    const teamMatch = m.teams?.some(t => t.teamNumber.toString().includes(this.searchQuery)) ||
                        m.scoutedTeams?.some(t => t.toString().includes(this.searchQuery));
                    if (!matchNumMatch && !teamMatch) return false;
                }

                return true;
            }).sort((a, b) => b.year - a.year || a.matchNumber - b.matchNumber);
        },

        isHighlighted(teamNumber) {
            if (!this.searchQuery) return false;
            return teamNumber.toString().includes(this.searchQuery);
        }
    }));
});
