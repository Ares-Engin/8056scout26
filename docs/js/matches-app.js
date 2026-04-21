document.addEventListener('alpine:init', () => {
    Alpine.data('matchesApp', () => ({
        loading: true,
        matches: [],
        availableEvents: FRC_CONFIG.events,
        searchQuery: '',
        errorMessage: '',

        async init() {
            try {
                const appState = Alpine.store('appState');
                if (appState.regional) {
                    await this.fetchMatches(appState.regional);
                }
                this.loading = false;
            } catch (e) {
                console.error(e);
                this.errorMessage = 'Failed to load matches';
                this.loading = false;
            }
        },

        async fetchMatches(eventKey) {
            this.loading = true;
            try {
                 const response = await fetch(`${FRC_CONFIG.tbaProxyUrl}/event/${eventKey}/matches/simple`, {
                    headers: { 'X-TBA-Auth-Key': FRC_CONFIG.tbaKey }
                });
                const raw = await response.json();
                this.matches = raw.map(m => ({
                    ...m,
                    type: m.comp_level === 'qm' ? 'Quals' : 'Playoffs',
                    key: m.key
                })).sort((a,b) => a.match_number - b.match_number);
            } catch (e) {
                this.errorMessage = 'TBA Sync Error';
            } finally {
                this.loading = false;
            }
        },

        get filteredMatches() {
            if (!this.searchQuery) return this.matches;
            const q = this.searchQuery.toLowerCase();
            return this.matches.filter(m => {
                const teams = [...m.alliances.red.team_keys, ...m.alliances.blue.team_keys];
                return teams.some(tk => tk.includes(q)) || m.match_number.toString().includes(q);
            });
        }
    }));
});
