document.addEventListener('alpine:init', () => {
    Alpine.data('regionalDetailApp', () => ({
        loading: true,
        tab: 'matches',
        eventKey: '',
        eventInfo: null,
        matches: [],
        rankings: [],
        teamMap: {},
        searchQuery: '',

        async init() {
            try {
                const params = new URLSearchParams(window.location.search);
                this.eventKey = params.get('regional') || Alpine.store('appState').regional;

                if (!this.eventKey) {
                    location.href = Alpine.store('appState').url('regionals');
                    return;
                }

                // Parallel fetch
                const [info, matches, ranks, teams] = await Promise.all([
                    this.fetchTba(`/event/${this.eventKey}/simple`),
                    this.fetchTba(`/event/${this.eventKey}/matches/simple`),
                    this.fetchTba(`/event/${this.eventKey}/rankings`),
                    this.fetchTba(`/event/${this.eventKey}/teams/simple`)
                ]);

                this.eventInfo = info;
                this.matches = matches.sort((a,b) => a.match_number - b.match_number);
                this.rankings = ranks ? ranks.rankings : [];
                
                // Build team map
                teams.forEach(t => {
                    this.teamMap[t.key] = t;
                });

                this.loading = false;
            } catch (e) {
                console.error(e);
                this.loading = false;
            }
        },

        async fetchTba(endpoint) {
             const response = await fetch(`${FRC_CONFIG.tbaProxyUrl}${endpoint}`, {
                headers: { 'X-TBA-Auth-Key': FRC_CONFIG.tbaKey }
            });
            return await response.json();
        },

        get filteredMatches() {
            if (!this.searchQuery) return this.matches;
            const q = this.searchQuery.toLowerCase();
            return this.matches.filter(m => {
                const teams = [...m.alliances.red.team_keys, ...m.alliances.blue.team_keys];
                return teams.some(tk => tk.includes(q)) || m.match_number.toString().includes(q);
            });
        },

        get filteredRankings() {
            if (!this.searchQuery) return this.rankings;
            const q = this.searchQuery.toLowerCase();
            return this.rankings.filter(r => r.team_key.includes(q));
        },

        getRankValue(rank, label) {
            const item = rank.extra_stats?.find(s => s.name === label) || rank.sort_orders?.find((val, idx) => label === 'Ranking Score');
             // This is a simplification, TBA ranking formats vary by game
            if (label === 'Ranking Points') return rank.sort_orders[0];
            if (label === 'Ranking Score') return rank.sort_orders[0];
            return rank.sort_orders[1] || 0;
        }
    }));
});
