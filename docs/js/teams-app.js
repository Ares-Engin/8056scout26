document.addEventListener('alpine:init', () => {
    Alpine.data('teamsApp', () => ({
        loading: true,
        teams: [],
        availableEvents: FRC_CONFIG.events,
        searchQuery: '',
        errorMessage: '',

        async init() {
            try {
                const appState = Alpine.store('appState');
                if (appState.regional) {
                    await this.fetchTeams(appState.regional);
                }
                this.loading = false;
            } catch (e) {
                console.error(e);
                this.errorMessage = 'Failed to load teams';
                this.loading = false;
            }
        },

        async fetchTeams(eventKey) {
            this.loading = true;
            try {
                 const response = await fetch(`${FRC_CONFIG.tbaProxyUrl}/event/${eventKey}/teams/simple`, {
                    headers: { 'X-TBA-Auth-Key': FRC_CONFIG.tbaKey }
                });
                const raw = await response.json();
                this.teams = raw.map(t => ({
                    teamNumber: t.team_number,
                    name: t.nickname || t.name,
                    city: t.city || 'Unknown'
                })).sort((a,b) => a.teamNumber - b.teamNumber);
            } catch (e) {
                this.errorMessage = 'TBA Sync Error';
            } finally {
                this.loading = false;
            }
        },

        get filteredTeams() {
            if (!this.searchQuery) return this.teams;
            const q = this.searchQuery.toLowerCase();
            return this.teams.filter(t => 
                t.teamNumber.toString().includes(q) || 
                t.name.toLowerCase().includes(q)
            );
        }
    }));
});
