document.addEventListener('alpine:init', () => {
    Alpine.data('pitScoutApp', () => ({
        form: {
            teamNumber: '',
            teamName: '',
            images: [],
            comments: ''
        },
        submitting: false,
        showSuccess: false,
        user: null,

        async init() {
            auth.onAuthStateChanged(user => {
                if (user) {
                    this.user = user;
                } else {
                    window.location.href = 'index.html';
                }
            });
        },

        async handleImageUpload(e) {
            const file = e.target.files[0];
            if (!file) return;

            // Simple Base64 conversion for development purposes
            const reader = new FileReader();
            reader.onload = (event) => {
                this.form.images.push(event.target.result);
            };
            reader.readAsDataURL(file);
        },

        removeImage(index) {
            this.form.images.splice(index, 1);
        },

        async submitPitReport() {
            if (!this.form.teamNumber) return;

            this.submitting = true;
            try {
                // Get user role for scouter info
                const userDoc = await db.collection('users').doc(this.user.uid).get();
                const userData = userDoc.data();

                const report = {
                    teamNumber: Number(this.form.teamNumber),
                    teamName: this.form.teamName,
                    images: this.form.images,
                    comments: this.form.comments,
                    meta: {
                        scouterName: userData?.name || 'Unknown',
                        scouterTeam: userData?.teamNumber || '',
                        scoutDate: firebase.firestore.FieldValue.serverTimestamp(),
                        season: FRC_CONFIG.defaultSeason,
                        isPit: true
                    }
                };

                await db.collection('pit-scouting').add(report);

                this.showSuccess = true;
                setTimeout(() => {
                    this.showSuccess = false;
                    this.resetForm();
                    window.location.href = 'teams.html';
                }, 2000);
            } catch (e) {
                console.error("Pit Submit Error:", e);
                alert("Failed to save report.");
            } finally {
                this.submitting = false;
            }
        },

        resetForm() {
            this.form = {
                teamNumber: '',
                teamName: '',
                images: [],
                comments: ''
            };
        }
    }));
});
