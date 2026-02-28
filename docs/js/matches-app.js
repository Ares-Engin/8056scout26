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
        expandedReports: [],
        teamDataCache: {},
        manualTeams: {},

        async init() {
            try {
                this.manualTeams = await loadManualTeams();
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
                        data.id = doc.id; // Store Firestore ID
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
                console.error(err);
                this.errorMessage = 'Failed to initialize matches';
                this.loading = false;
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
            if (this.expandedReports.includes(id)) {
                this.expandedReports = this.expandedReports.filter(i => i !== id);
            } else {
                this.expandedReports.push(id);
                this.loadScouterTeamData(id);
            }
        },

        filteredMatches() {
            const scoutedKeys = Object.keys(this.scoutEntries);

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
                        teams: [],
                        isManual: true,
                        scoutedTeams: entries.map(e => e.teamNumber)
                    });
                }
            });

            return list.filter(m => {
                if (this.selectedEvents.length > 0 && !this.selectedEvents.includes(m.eventKey)) return false;
                if (this.selectedTypes.length > 0 && !this.selectedTypes.includes(m.type)) return false;
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
        },

        getScoringRules(year) {
            return FRC_CONFIG.scoring[year] || FRC_CONFIG.scoring[FRC_CONFIG.defaultSeason];
        },

        parseFuel(val) {
            if (!val || typeof val !== 'string') return 0;
            const part = val.split('-')[0];
            return parseInt(part) || 0;
        },

        calculateScores(entry, year) {
            const rules = this.getScoringRules(year);
            const fuelValue = rules.fuelValue || 1;

            let autoFuel = this.parseFuel(entry.auto?.fuel);
            let auto = (entry.auto?.level1 === 'success' ? rules.autoLevel1 : 0) + (autoFuel * fuelValue);

            let teleopFuel = this.parseFuel(entry.transitionShift) +
                this.parseFuel(entry.teleopShiftA) +
                this.parseFuel(entry.teleopShiftB);
            let teleop = teleopFuel * fuelValue;

            let endgame = 0;
            if (entry.endgame?.level === 'level1') endgame = rules.endgameLevel1;
            else if (entry.endgame?.level === 'level2') endgame = rules.endgameLevel2;
            else if (entry.endgame?.level === 'level3') endgame = rules.endgameLevel3;

            return {
                auto,
                teleop,
                endgame,
                totalFuel: teleopFuel + autoFuel,
                total: auto + teleop + endgame
            };
        },

        isVerified(role) {
            return role && role !== 'new';
        },

        formatDate(timestamp) {
            if (!timestamp) return 'N/A';
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleString();
        },

        async loadScouterTeamData(id) {
            const scout = this.findScoutById(id);
            if (!scout || !scout.meta || !scout.meta.scouterTeam) return;

            const tNum = scout.meta.scouterTeam;

            if (this.teamDataCache[tNum]) {
                scout.meta.scouterTeamData = this.teamDataCache[tNum];
                return;
            }

            if (this.manualTeams[tNum]) {
                this.teamDataCache[tNum] = this.manualTeams[tNum];
                scout.meta.scouterTeamData = this.manualTeams[tNum];
                return;
            }

            const info = await fetchFRCTeamInfo(tNum);
            if (info) {
                const data = {
                    name: info.nickname || info.name,
                    logo: null
                };

                const media = await fetchFRCTeamMedia(tNum, 2025);
                const logo = media.find(m => m.type === 'avatar' || m.type === 'image');
                if (logo && logo.direct_url) {
                    data.logo = logo.direct_url;
                } else if (logo && logo.base64Image) {
                    data.logo = `data:image/png;base64,${logo.base64Image}`;
                }

                this.teamDataCache[tNum] = data;
                scout.meta.scouterTeamData = data;
            }
        },

        findScoutById(id) {
            for (const key in this.scoutEntries) {
                const s = this.scoutEntries[key].find(sc => sc.id === id);
                if (s) return s;
            }
            return null;
        }
    }));
});
