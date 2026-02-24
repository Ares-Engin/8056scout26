document.addEventListener('alpine:init', () => {
    Alpine.data('scoutApp', () => ({
        matchNumber: '',
        teamNumber: '',
        matchType: 'Qualification',
        alliance: '',
        auto: { fuelSuccess: 0, fuelFail: 0, taxi: false },
        teleop: { fuelSuccess: 0, fuelFail: 0, pickups: 0, drops: 0, defense: 0 },
        endgame: { result: '', failed: false },
        ratings: { driver: 3, speed: 3, defense: 3, reliability: '' },
        loading: false,

        async submit() {
            if (!this.matchNumber || !this.teamNumber) return alert('Match and Team numbers are required');
            this.loading = true;
            try {
                const data = {
                    matchNumber: Number(this.matchNumber),
                    teamNumber: Number(this.teamNumber),
                    meta: { matchType: this.matchType, alliance: this.alliance },
                    auto: this.auto,
                    teleop: this.teleop,
                    endgame: this.endgame,
                    ratings: this.ratings,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    scoutEmail: auth.currentUser?.email,
                    scoutUID: auth.currentUser?.uid
                };
                await db.collection('scouting').add(data);
                alert('Success!');
                location.href = 'dashboard.html';
            } catch (e) {
                alert('Error: ' + e.message);
                this.loading = false;
            }
        }
    }));
});
