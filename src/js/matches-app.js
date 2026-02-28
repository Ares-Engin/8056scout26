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

                this.$watch('selectedEvents', async () => {
                    await this.fetchMatches();
                });

                await this.fetchMatches();

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
                console.error("Init Error:", err);
                this.errorMessage = 'Failed to initialize matches: ' + err.message;
                this.loading = false;
            }
        },

        async fetchMatches() {
            this.loading = true;
            this.errorMessage = '';
            try {
                // Fetch matches for all selected events
                const allMatches = await Promise.all(
                    this.selectedEvents.map(key => fetchFRCMatches(key))
                );
                // Flatten and add event key to each match for filtering
                this.frcMatches = allMatches.flatMap((matches, i) =>
                    matches.map(m => ({ ...m, eventKey: this.selectedEvents[i] }))
                );
                this.frcMatches.sort((a, b) => {
                    const weights = { 'p': 0, 'qm': 1, 'qf': 2, 'sf': 3, 'f': 4 };
                    const wA = weights[a.compLevel] || 1;
                    const wB = weights[b.compLevel] || 1;
                    if (wA !== wB) return wA - wB;
                    return a.matchNumber - b.matchNumber;
                });
            } catch (e) {
                console.error("Error fetching matches:", e);
                this.errorMessage = 'Failed to fetch matches updates from API';
            } finally {
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
                const type = m.compLevel === 'qm' ? 'Qualification' :
                    m.compLevel === 'p' ? 'Practice' : 'Playoffs';
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

                // We must also infer if the scouted match belongs to Playoffs or Quals based on its meta
                const entries = this.scoutEntries[key];
                const firstEntry = entries[0];
                const scoutType = firstEntry.meta?.matchType || 'Qualification';

                if (!alreadyInList) {
                    const eventObj = this.availableEvents.find(e => e.key === regional);

                    list.push({
                        matchNumber: Number(matchNum),
                        eventKey: regional,
                        eventShort: eventObj?.name.split(' ')[0] || regional,
                        year: eventObj?.season || '',
                        type: scoutType,
                        description: `${scoutType} ${matchNum}`,
                        compLevel: scoutType === 'Qualification' ? 'qm' : scoutType === 'Practice' ? 'p' : 'sf',
                        teams: [],
                        isManual: true,
                        scoutedTeams: entries.map(e => e.teamNumber)
                    });
                } else {
                    // Update type of existing match if it only exists in scout data with different type assumption (unlikely for API matches but good practice)
                    const mInfo = list.find(m => m.eventKey === regional && m.matchNumber.toString() === matchNum);
                    if (mInfo && mInfo.isManual) {
                        mInfo.type = scoutType;
                    }
                }
            });

            return list.filter(m => {
                // Event Filter
                if (this.selectedEvents.length > 0 && !this.selectedEvents.includes(m.eventKey)) return false;

                // Type Filter
                const isPractice = m.compLevel === 'p' || m.type === 'Practice';
                const isQual = m.compLevel === 'qm' || m.type === 'Qualification';
                const isPlayoff = ['qf', 'sf', 'f'].includes(m.compLevel) || m.type === 'Playoffs';

                let typeMatch = false;
                if (this.selectedTypes.includes('Practice') && isPractice) typeMatch = true;
                if (this.selectedTypes.includes('Qualification') && isQual) typeMatch = true;
                if (this.selectedTypes.includes('Playoffs') && isPlayoff) typeMatch = true;

                if (!typeMatch) return false;

                // Search Query Filter
                if (this.searchQuery) {
                    const matchNumMatch = m.matchNumber.toString() === this.searchQuery;
                    const teamMatch = m.teams?.some(t => t.teamNumber.toString().includes(this.searchQuery)) ||
                        m.scoutedTeams?.some(t => t.toString().includes(this.searchQuery));
                    if (!matchNumMatch && !teamMatch) return false;
                }
                return true;
            }).sort((a, b) => {
                if (b.year !== a.year) return b.year - a.year;
                const weights = { 'p': 0, 'qm': 1, 'qf': 2, 'sf': 3, 'f': 4 };
                const wA = weights[a.compLevel] || 1;
                const wB = weights[b.compLevel] || 1;
                if (wA !== wB) return wA - wB;
                return a.matchNumber - b.matchNumber;
            });
        },

        isHighlighted(teamNumber) {
            if (!this.searchQuery) return false;
            return teamNumber.toString().includes(this.searchQuery);
        },

        getScoringRules(year) {
            return FRC_CONFIG.scoring[year] || FRC_CONFIG.scoring[FRC_CONFIG.defaultSeason];
        },

        // Parses "5-10" or "10" into a numeric average or value
        parseFuel(val) {
            if (!val) return 0;
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                if (val.includes('-')) {
                    const parts = val.split('-').map(p => parseInt(p));
                    return (parts[0] + parts[1]) / 2; // Use average for score estimation
                }
                return parseInt(val) || 0;
            }
            return 0;
        },

        calculateScores(entry, year) {
            const rules = this.getScoringRules(year);
            const fuelValue = rules.fuelValue || 1;

            // Auto Fuel (if any) + Auto Level 1
            let autoFuel = this.parseFuel(entry.auto?.fuel);
            let autoPoints = (entry.auto?.level1 === 'success' ? rules.autoLevel1 : 0) + (autoFuel * fuelValue);

            // Teleop Fuel (Sum of shifts)
            let fuelShifts = [
                entry.transitionShift,
                entry.teleopShiftA,
                entry.teleopShiftB
            ];
            let totalFuel = fuelShifts.reduce((acc, val) => acc + this.parseFuel(val), 0);
            let teleopPoints = totalFuel * fuelValue;

            // Endgame
            let endgamePoints = 0;
            const level = entry.endgame?.level?.toLowerCase();
            if (level === 'level1') endgamePoints = rules.endgameLevel1;
            else if (level === 'level2') endgamePoints = rules.endgameLevel2;
            else if (level === 'level3') endgamePoints = rules.endgameLevel3;

            return {
                auto: autoPoints,
                teleop: teleopPoints,
                endgame: endgamePoints,
                totalFuel: totalFuel,
                total: autoPoints + teleopPoints + endgamePoints
            };
        },

        isVerified(role) {
            return role && role !== 'new';
        },

        formatDate(timestamp) {
            if (!timestamp) return 'N/A';
            // Handle Firestore Timestamp vs Date
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        async loadScouterTeamData(id) {
            // Optional: Fetch team logo/name for scouter team if needed
        }
    }));
});
