document.addEventListener('alpine:init', () => {
    Alpine.data('teamDetailApp', () => ({
        loading: true,
        team: null,
        pitReport: null,
        teamMatches: [],
        errorMessage: '',

        async init() {
            try {
                const params = new URLSearchParams(window.location.search);
                const regional = params.get('regional') || Alpine.store('appState').regional;
                const teamNum = params.get('team');

                if (!teamNum) {
                    this.errorMessage = 'No team number provided in URL';
                    this.loading = false;
                    return;
                }

                // 1. Fetch Team Simple Data
                this.team = await this.fetchTbaTeam(teamNum);

                // 2. Fetch Pit Report from Firestore
                this.listenToPitReport(regional, teamNum);

                // 3. Fetch Team Matches for the current event
                if (regional) {
                    this.teamMatches = await this.fetchTeamMatches(regional, teamNum);
                }

                this.loading = false;
            } catch (e) {
                console.error(e);
                this.errorMessage = 'Error loading team profile: ' + e.message;
                this.loading = false;
            }
        },

        async fetchTbaTeam(teamNum) {
            const response = await fetch(`${FRC_CONFIG.tbaProxyUrl}/team/frc${teamNum}`, {
                headers: { 'X-TBA-Auth-Key': FRC_CONFIG.tbaKey }
            });
            return await response.json();
        },

        listenToPitReport(regional, teamNum) {
            const col = Alpine.store('appState').pitCollectionName;
            db.collection(col)
                .where('teamNumber', '==', parseInt(teamNum))
                .limit(1)
                .onSnapshot(snapshot => {
                    if (!snapshot.empty) {
                        this.pitReport = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
                    }
                });
        },

        async fetchTeamMatches(regional, teamNum) {
             const response = await fetch(`${FRC_CONFIG.tbaProxyUrl}/team/frc${teamNum}/event/${regional}/matches/simple`, {
                headers: { 'X-TBA-Auth-Key': FRC_CONFIG.tbaKey }
            });
            const matches = await response.json();
            return matches.sort((a, b) => a.match_number - b.match_number);
        }
    }));
});
