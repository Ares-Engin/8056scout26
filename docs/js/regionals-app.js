document.addEventListener('alpine:init', () => {
    Alpine.data('regionalsApp', () => ({
        availableEvents: FRC_CONFIG.events,
        searchQuery: '',
        expandedRegionals: [],
        regionalData: {}, // Map eventKey -> { matches: [], rankings: [], awards: [], loading: false }
        pitReports: {}, // Map teamNumber -> [reports]
        expandedMatches: [],
        expandedReports: [],
        expandedTeams: [],
        expandedHistory: [],
        expandedPitReports: [],

        async init() {
            // Load Pit Reports globally for team expansion
            db.collection('pitScouting').onSnapshot(snapshot => {
                this.pitReports = {};
                snapshot.forEach(doc => {
                    const data = doc.data();
                    data.id = doc.id;
                    if (!this.pitReports[data.teamNumber]) {
                        this.pitReports[data.teamNumber] = [];
                    }
                    this.pitReports[data.teamNumber].push(data);
                });
            });
        },

        get filteredRegionals() {
            if (!this.searchQuery) return this.availableEvents.filter(e => e.season === 2026);
            const q = this.searchQuery.toLowerCase();
            return this.availableEvents.filter(e =>
                e.name.toLowerCase().includes(q) ||
                e.key.toLowerCase().includes(q)
            );
        },

        async toggleRegional(eventKey) {
            if (this.expandedRegionals.includes(eventKey)) {
                this.expandedRegionals = this.expandedRegionals.filter(k => k !== eventKey);
            } else {
                this.expandedRegionals.push(eventKey);
                if (!this.regionalData[eventKey]) {
                    await this.loadRegionalData(eventKey);
                }
            }
        },

        async loadRegionalData(eventKey) {
            this.regionalData[eventKey] = {
                matches: [],
                rankings: null,
                awards: [],
                loading: true,
                teams: [] // To store team info for expansion
            };

            try {
                const [matches, rankings, awards] = await Promise.all([
                    fetchFRCMatches(eventKey),
                    this.fetchTBARequest(`event/${eventKey}/rankings`),
                    this.fetchTBARequest(`event/${eventKey}/awards`)
                ]);

                // Post-process rankings to include team info
                if (rankings && rankings.rankings) {
                    const eventTeams = await this.fetchTBARequest(`event/${eventKey}/teams`);
                    this.regionalData[eventKey].teams = eventTeams.map(t => ({
                        teamNumber: t.team_number,
                        name: t.nickname || t.name,
                        city: t.city,
                        country: t.country,
                        awards: [],
                        events: [],
                        logoUrl: null,
                        loadingDetails: false
                    }));
                }

                this.regionalData[eventKey].matches = matches;
                this.regionalData[eventKey].rankings = rankings;
                this.regionalData[eventKey].awards = awards;
            } catch (err) {
                console.error("Failed to load regional data:", err);
            } finally {
                this.regionalData[eventKey].loading = false;
            }
        },

        async fetchTBARequest(endpoint) {
            const url = `https://www.thebluealliance.com/api/v3/${endpoint}`;
            const res = await fetch(url, {
                headers: { "X-TBA-Auth-Key": FRC_CONFIG.apiKey }
            });
            return res.ok ? await res.json() : null;
        },

        async toggleTeam(teamNumber, eventKey) {
            const teamKey = `${eventKey}_${teamNumber}`;
            if (this.expandedTeams.includes(teamKey)) {
                this.expandedTeams = this.expandedTeams.filter(tk => tk !== teamKey);
            } else {
                this.expandedTeams.push(teamKey);
                const team = this.regionalData[eventKey].teams.find(t => t.teamNumber === teamNumber);
                if (team && (!team.awards.length || !team.events.length)) {
                    await this.loadTeamDetail(team);
                }
            }
        },

        async loadTeamDetail(team) {
            team.loadingDetails = true;
            try {
                // Media
                const media = await this.fetchTBARequest(`team/frc${team.teamNumber}/media/2025`);
                const logo = media?.find(m => m.type === 'avatar' || m.type === 'image');
                if (logo) {
                    team.logoUrl = logo.direct_url || (logo.details?.base64_avatar ? `data:image/png;base64,${logo.details.base64_avatar}` : null);
                }

                // Awards
                const awards = await this.fetchTBARequest(`team/frc${team.teamNumber}/awards`);
                team.awards = awards?.slice(0, 10) || [];

                // Events
                const events = await this.fetchTBARequest(`team/frc${team.teamNumber}/events/2026`);
                team.events = events || [];
            } finally {
                team.loadingDetails = false;
            }
        },

        toggleMatch(key) {
            if (this.expandedMatches.includes(key)) {
                this.expandedMatches = this.expandedMatches.filter(k => k !== key);
            } else {
                this.expandedMatches.push(key);
            }
        },

        toggleReport(id) {
            this.expandedReports.includes(id)
                ? this.expandedReports = this.expandedReports.filter(i => i !== id)
                : this.expandedReports.push(id);
        },

        togglePitReport(id) {
            this.expandedPitReports.includes(id)
                ? this.expandedPitReports = this.expandedPitReports.filter(i => i !== id)
                : this.expandedPitReports.push(id);
        },

        formatDate(timestamp) {
            if (!timestamp) return 'Pending';
            const date = new Date(timestamp);
            return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        },

        isVerified(role) {
            return role && role !== 'new';
        }
    }));
});
