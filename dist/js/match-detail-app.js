document.addEventListener('alpine:init', () => {
    Alpine.data('matchDetailApp', () => ({
        loading: true,
        match: null,
        scoutEntries: [],
        teamDataMap: {},
        errorMessage: '',

        async init() {
            try {
                // 1. Sync State from URL
                const params = new URLSearchParams(window.location.search);
                const league = params.get('league') || 'frc';
                const season = params.get('season') || '2026';
                const regional = params.get('regional');
                const matchNum = params.get('match');

                if (!regional || !matchNum) {
                    this.errorMessage = 'Missing match identifiers in URL';
                    this.loading = false;
                    return;
                }

                // 2. Fetch Match Data from TBA
                const matchKey = `${regional}_qm${matchNum}`; // Assuming Quals for now, logic can be expanded
                this.match = await this.fetchTbaMatch(matchKey);

                // 3. Fetch Scout Reports from Firestore
                this.listenToScoutReports(regional, matchNum);

                // 4. Fetch Team Names
                if (this.match && this.match.teams) {
                    await this.prefetchTeamNames(this.match.teams.map(t => t.teamNumber));
                }

                this.loading = false;
            } catch (e) {
                console.error(e);
                this.errorMessage = 'Error loading match data: ' + e.message;
                this.loading = false;
            }
        },

        async fetchTbaMatch(matchKey) {
             const response = await fetch(`${FRC_CONFIG.tbaProxyUrl}/match/${matchKey}`, {
                headers: { 'X-TBA-Auth-Key': FRC_CONFIG.tbaKey }
            });
            const raw = await response.json();
            
            // Transform to our internal format
            return {
                matchNumber: raw.match_number,
                type: raw.comp_level === 'qm' ? 'Qualification' : 'Playoffs',
                eventKey: raw.event_key,
                eventShort: raw.event_key.substring(4).toUpperCase(),
                scoreRedFinal: raw.alliances.red.score,
                scoreBlueFinal: raw.alliances.blue.score,
                teams: [
                    ...raw.alliances.red.team_keys.map(k => ({ teamNumber: parseInt(k.substring(3)), station: 'Red' })),
                    ...raw.alliances.blue.team_keys.map(k => ({ teamNumber: parseInt(k.substring(3)), station: 'Blue' }))
                ],
                rawScoreBreakdown: raw.score_breakdown,
                videos: raw.videos
            };
        },

        listenToScoutReports(regional, matchNum) {
            const col = Alpine.store('appState').collectionName;
            db.collection(col)
                .where('regional', '==', regional)
                .where('matchNumber', '==', parseInt(matchNum))
                .onSnapshot(snapshot => {
                    this.scoutEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                });
        },

        async prefetchTeamNames(teamNumbers) {
            for (const num of teamNumbers) {
                if (!this.teamDataMap[num]) {
                     const response = await fetch(`${FRC_CONFIG.tbaProxyUrl}/team/frc${num}/simple`, {
                        headers: { 'X-TBA-Auth-Key': FRC_CONFIG.tbaKey }
                    });
                    this.teamDataMap[num] = await response.json();
                }
            }
        },

        getTeamData(teamNumber) {
            return this.teamDataMap[teamNumber] || { nickname: 'Loading...' };
        },

        get redTeams() {
            return this.match ? this.match.teams.filter(t => t.station === 'Red') : [];
        },

        get blueTeams() {
            return this.match ? this.match.teams.filter(t => t.station === 'Blue') : [];
        },

        getBreakdownItems(alliance) {
            if (!this.match || !this.match.rawScoreBreakdown) return [];
            const b = this.match.rawScoreBreakdown[alliance];
            return [
                { label: 'Auto Pts', val: b.totalAutoPoints },
                { label: 'Teleop Pts', val: b.totalTeleopPoints },
                { label: 'Endgame Pts', val: b.totalTowerPoints },
                { label: 'Foul Pts', val: b.foulPoints },
                { label: 'Total Pts', val: b.totalPoints },
                { label: 'RP Earned', val: b.rp }
            ];
        },

        isVerified(role) {
            return role === 'admin' || role === 'team8056';
        },

        get isAdmin() {
            const profile = Alpine.store('auth').profile;
            return profile && profile.role === 'admin';
        },

        async deleteReport(id) {
            if (!confirm('Are you sure?')) return;
            try {
                const col = Alpine.store('appState').collectionName;
                await db.collection(col).doc(id).delete();
                alert('Deleted');
            } catch (e) {
                alert(e.message);
            }
        }
    }));
});
