document.addEventListener('alpine:init', () => {
    Alpine.data('teamsApp', () => ({
        teams: [],
        pitReports: {},
        expandedTeams: [],
        expandedPitReports: [],
        searchQuery: '',
        loading: true,

        async init() {
            this.loading = true;
            try {
                // 1. Discover all Turkish events from recent years
                const years = [2024, 2025, 2026];
                const turkishEvents = [];

                for (const year of years) {
                    const eventsUrl = `https://www.thebluealliance.com/api/v3/events/${year}`;
                    const res = await fetch(eventsUrl, { headers: { "X-TBA-Auth-Key": FRC_CONFIG.apiKey } });
                    if (res.ok) {
                        const allEvents = await res.json();
                        const yearEvents = allEvents.filter(e =>
                            e.country === "Turkey" ||
                            e.country === "Türkiye" ||
                            e.city?.includes("Istanbul") ||
                            e.city?.includes("Ankara") ||
                            e.city?.includes("Izmir")
                        );
                        turkishEvents.push(...yearEvents);
                    }
                }

                // 2. Fetch teams from all discovered events
                const teamMap = new Map();
                for (const event of turkishEvents) {
                    const eventTeams = await this.fetchEventTeams(event.key);
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
                    team.awards = allAwards.slice(0, 8); // Show more awards
                }

                // Load Events for 2024-2026
                const years = [2024, 2025, 2026];
                const allTeamEvents = [];
                for (const year of years) {
                    const eventsUrl = `https://www.thebluealliance.com/api/v3/team/frc${team.teamNumber}/events/${year}`;
                    const eventsRes = await fetch(eventsUrl, { headers: { "X-TBA-Auth-Key": FRC_CONFIG.apiKey } });
                    if (eventsRes.ok) {
                        const yrEvents = await eventsRes.json();
                        allTeamEvents.push(...yrEvents);
                    }
                }
                team.events = allTeamEvents.sort((a, b) => b.year - a.year || b.start_date.localeCompare(a.start_date));
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
