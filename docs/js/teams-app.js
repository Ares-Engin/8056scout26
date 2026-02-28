document.addEventListener('alpine:init', () => {
    Alpine.data('teamsApp', () => ({
        teams: [],
        scoutEntries: {},
        searchQuery: '',
        loading: true,
        onlyScouted: false,
        selectedTeam: null,
        manualTeams: {},

        async init() {
            try {
                this.loading = true;
                this.manualTeams = await loadManualTeams();

                // 1. Fetch scouting data
                const matchSnapshot = await db.collection('scouting').get();
                matchSnapshot.forEach(doc => {
                    const data = doc.data();
                    data.id = doc.id;
                    if (data.teamNumber) {
                        const tNum = data.teamNumber.toString();
                        if (!this.scoutEntries[tNum]) this.scoutEntries[tNum] = [];
                        this.scoutEntries[tNum].push(data);
                    }
                });

                // 2. Fetch pit scouting data
                const pitEntries = {};
                const pitSnapshot = await db.collection('pit-scouting').get();
                pitSnapshot.forEach(doc => {
                    const data = doc.data();
                    data.id = doc.id;
                    if (data.teamNumber) {
                        pitEntries[data.teamNumber.toString()] = data;
                    }
                });

                // 3. Build Team List
                const allEventKeys = FRC_CONFIG.events.map(e => e.key);
                const teamsMap = new Map();

                // (Manual teams and TBA teams follow - simplified for brevity of chunk)
                // We'll reuse the map building logic but integrate pitEntries

                // Process Manual Teams First
                for (const tNum in this.manualTeams) {
                    teamsMap.set(tNum, {
                        ...this.manualTeams[tNum],
                        number: tNum,
                        scoutCount: 0,
                        avgScore: 0,
                        reports: []
                    });
                }

                // Fetch TBA Teams for events (this might be slow if many events)
                // Better approach: fetch teams for the default/selected event
                const eventKey = FRC_CONFIG.events.find(e => e.season === FRC_CONFIG.defaultSeason)?.key;
                if (eventKey) {
                    const tbaTeams = await this.fetchEventTeams(eventKey);
                    tbaTeams.forEach(t => {
                        const tNum = t.team_number.toString();
                        if (!teamsMap.has(tNum)) {
                            teamsMap.set(tNum, {
                                number: tNum,
                                name: t.nickname || t.name,
                                location: `${t.city}, ${t.state_prov}`,
                                rookieYear: t.rookie_year,
                                logo: null,
                                scoutCount: 0,
                                avgScore: 0,
                                reports: []
                            });
                        } else {
                            // Merge missing info into manual entry
                            const existing = teamsMap.get(tNum);
                            existing.location = existing.location || `${t.city}, ${t.state_prov}`;
                            existing.rookieYear = existing.rookieYear || t.rookie_year;
                        }
                    });
                }

                // 3. Integrate Scout Reports, Pit Data & Logos
                for (const [tNum, team] of teamsMap) {
                    const reports = this.scoutEntries[tNum] || [];
                    team.reports = reports;
                    team.scoutCount = reports.length;

                    // Merge Pit Data
                    team.pitData = pitEntries[tNum] || null;

                    if (reports.length > 0) {
                        const totalScore = reports.reduce((acc, r) => acc + this.calculateEntryScore(r).total, 0);
                        team.avgScore = totalScore / reports.length;
                    }

                    // Try fetching logo for scouted teams if not manual
                    // Also use pit images as backup logos if available
                    if (!team.logo) {
                        if (team.pitData?.images?.length > 0) {
                            team.logo = team.pitData.images[0];
                        } else if (team.scoutCount > 0 || tNum === '8056') {
                            const media = await fetchFRCTeamMedia(tNum);
                            const logo = media.find(m => m.type === 'avatar' || m.type === 'image');
                            if (logo && logo.direct_url) team.logo = logo.direct_url;
                            else if (logo && logo.base64Image) team.logo = `data:image/png;base64,${logo.base64Image}`;
                        }
                    }
                }

                this.teams = Array.from(teamsMap.values()).sort((a, b) => Number(a.number) - Number(b.number));
                this.loading = false;
            } catch (e) {
                console.error("Teams Init Error:", e);
                this.loading = false;
            }
        },

        async fetchEventTeams(eventKey) {
            const url = `https://www.thebluealliance.com/api/v3/event/${eventKey}/teams`;
            try {
                const res = await fetch(url, {
                    headers: { "X-TBA-Auth-Key": FRC_CONFIG.apiKey }
                });
                return await res.json();
            } catch (e) {
                console.error("Error fetching event teams:", e);
                return [];
            }
        },

        get filteredTeams() {
            return this.teams.filter(t => {
                const matchesSearch = t.number.toString().includes(this.searchQuery) ||
                    t.name.toLowerCase().includes(this.searchQuery.toLowerCase());
                const matchesFilter = this.onlyScouted ? t.scoutCount > 0 : true;
                return matchesSearch && matchesFilter;
            });
        },

        openTeamDetails(team) {
            this.selectedTeam = team;
        },

        calculateEntryScore(entry) {
            const rules = FRC_CONFIG.scoring[entry.meta?.season] || FRC_CONFIG.scoring[FRC_CONFIG.defaultSeason];
            const fuelValue = rules.fuelValue || 1;

            const parseFuel = (val) => {
                if (!val || typeof val !== 'string') return 0;
                return parseInt(val.split('-')[0]) || 0;
            };

            let autoFuel = parseFuel(entry.auto?.fuel);
            let auto = (entry.auto?.level1 === 'success' ? rules.autoLevel1 : 0) + (autoFuel * fuelValue);

            let teleopFuel = parseFuel(entry.transitionShift) +
                parseFuel(entry.teleopShiftA) +
                parseFuel(entry.teleopShiftB);
            let teleop = teleopFuel * fuelValue;

            let endgame = 0;
            if (entry.endgame?.level === 'level1') endgame = rules.endgameLevel1;
            else if (entry.endgame?.level === 'level2') endgame = rules.endgameLevel2;
            else if (entry.endgame?.level === 'level3') endgame = rules.endgameLevel3;

            return { auto, teleop, endgame, total: auto + teleop + endgame };
        },

        formatDate(timestamp) {
            if (!timestamp) return 'N/A';
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleString();
        }
    }));
});
