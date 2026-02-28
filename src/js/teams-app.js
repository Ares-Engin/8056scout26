document.addEventListener('alpine:init', () => {
    Alpine.data('teamsApp', () => ({
        teams: [],
        pitReports: {},
        expandedTeams: [],
        expandedPitReports: [],
        searchQuery: '',
        loading: true,

        // Targeted Regionals events for 2026
        targetEvents: ["2026tuhc", "2026tuis", "2026marm", "2026bask"],

        async init() {
            this.loading = true;
            try {
                // 1. Fetch teams from the target regionals
                const teamMap = new Map();
                for (const eventKey of this.targetEvents) {
                    const eventTeams = await this.fetchEventTeams(eventKey);
                    eventTeams.forEach(t => teamMap.set(t.team_number, t));
                }

                this.teams = Array.from(teamMap.values()).map(t => ({
                    teamNumber: t.team_number,
                    name: t.nickname || t.name,
                    city: t.city || 'Unknown',
                    country: t.country || 'Turkey',
                    awards: [],
                    events: []
                })).sort((a, b) => a.teamNumber - b.teamNumber);

                // 2. Fetch Pit Reports from Firestore
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

                this.loading = false;
            } catch (err) {
                console.error("Failed to load teams:", err);
                this.loading = false;
            }
        },

        async fetchEventTeams(eventKey) {
            const url = `https://www.thebluealliance.com/api/v3/event/${eventKey}/teams`;
            const res = await fetch(url, {
                headers: { "X-TBA-Auth-Key": FRC_CONFIG.apiKey }
            });
            return res.ok ? await res.json() : [];
        },

        async toggleTeam(teamNumber) {
            if (this.expandedTeams.includes(teamNumber)) {
                this.expandedTeams = this.expandedTeams.filter(t => t !== teamNumber);
            } else {
                this.expandedTeams.push(teamNumber);
                // Load deep data if not already loaded
                const team = this.teams.find(t => t.teamNumber === teamNumber);
                if (team && (!team.awards.length || !team.events.length)) {
                    await this.loadTeamDetail(team);
                }
            }
        },

        async loadTeamDetail(team) {
            try {
                // Load Awards (global history)
                const awardsUrl = `https://www.thebluealliance.com/api/v3/team/frc${team.teamNumber}/awards`;
                const awardsRes = await fetch(awardsUrl, { headers: { "X-TBA-Auth-Key": FRC_CONFIG.apiKey } });
                if (awardsRes.ok) {
                    const allAwards = await awardsRes.json();
                    // Just take recent or major awards to avoid clutter
                    team.awards = allAwards.slice(0, 5);
                }

                // Load 2026 Events
                const eventsUrl = `https://www.thebluealliance.com/api/v3/team/frc${team.teamNumber}/events/2026`;
                const eventsRes = await fetch(eventsUrl, { headers: { "X-TBA-Auth-Key": FRC_CONFIG.apiKey } });
                if (eventsRes.ok) {
                    team.events = await eventsRes.json();
                }
            } catch (e) {
                console.error("Detail load failed for " + team.teamNumber, e);
            }
        },

        togglePitReport(id) {
            if (this.expandedPitReports.includes(id)) {
                this.expandedPitReports = this.expandedPitReports.filter(i => i !== id);
            } else {
                this.expandedPitReports.push(id);
            }
        },

        get filteredTeams() {
            if (!this.searchQuery) return this.teams;
            const q = this.searchQuery.toLowerCase();
            return this.teams.filter(t =>
                t.teamNumber.toString().includes(q) ||
                t.name.toLowerCase().includes(q)
            );
        },

        isVerified(role) {
            return role && role !== 'new';
        },

        formatDate(timestamp) {
            if (!timestamp) return 'N/A';
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleString();
        }
    }));
});
