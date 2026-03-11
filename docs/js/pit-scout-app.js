document.addEventListener('alpine:init', () => {
    Alpine.data('pitScoutApp', () => ({
        selectedYear: FRC_CONFIG.defaultSeason,
        availableSeasons: FRC_CONFIG.seasons,
        regional: '',
        teamNumber: '',
        images: [], // Selected files
        imagePreviews: [], // URLs for UI previews
        imageUrls: [], // Final uploaded URLs
        loading: false,

        handleImageSelect(event) {
            const files = Array.from(event.target.files);
            if (this.images.length + files.length > 5) {
                alert('Maximum 5 images allowed');
                return;
            }

            files.forEach(file => {
                this.images.push(file);
                const reader = new FileReader();
                reader.onload = (e) => this.imagePreviews.push(e.target.result);
                reader.readAsDataURL(file);
            });
        },

        removeImage(index) {
            this.images.splice(index, 1);
            this.imagePreviews.splice(index, 1);
        },

        data: {
            driveBase: 'Swerve',
            intake: '',
            shooter: '',
            ballCapacity: 0,
            autoStrategy: '',
            teleopInactive: '',
            teleopActive: '',
            endgameGoal: '',
            generalComments: '',
            comments: ''
        },

        get filteredEvents() {
            return FRC_CONFIG.events.filter(e => e.season === Number(this.selectedYear));
        },

        init() {
            // Pre-fill team from URL if present
            const params = new URLSearchParams(window.location.search);
            if (params.has('team')) {
                this.teamNumber = params.get('team');
            }

            // Watch for year changes to reset regional
            this.$watch('selectedYear', (val) => {
                const firstEvent = this.filteredEvents[0];
                if (firstEvent) this.regional = firstEvent.key;
            });

            // Set initial regional if empty
            if (!this.regional) {
                const firstEvent = this.filteredEvents[0];
                if (firstEvent) this.regional = firstEvent.key;
            }
        },

        async uploadImages() {
            const storage = firebase.storage();
            const uploadedUrls = [];

            for (const file of this.images) {
                const storageRef = storage.ref(`pit-scouting/${this.teamNumber}/${Date.now()}-${file.name}`);
                const snapshot = await storageRef.put(file);
                const url = await snapshot.ref.getDownloadURL();
                uploadedUrls.push(url);
            }
            return uploadedUrls;
        },

        async submit() {
            if (!this.teamNumber || !this.regional) return alert('Team and Regional are required');

            this.loading = true;
            try {
                // 1. Upload Images first if any
                if (this.images.length > 0) {
                    this.imageUrls = await this.uploadImages();
                }

                const profile = Alpine.store('auth').profile || {};
                const report = {
                    year: Number(this.selectedYear),
                    regional: this.regional,
                    teamNumber: Number(this.teamNumber),
                    data: {
                        ...this.data,
                        images: this.imageUrls // ADDED: include image URLs in data
                    },
                    meta: {
                        scouterTeam: profile.teamNumber || 0,
                        scouterRole: profile.role || 'new',
                        scouterEmail: auth.currentUser?.email || 'unknown',
                        isVerified: !!(profile && profile.role && profile.role !== 'new')
                    },
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                await db.collection('pitScouting').add(report);
                alert('Pit Report Saved Successfully!');
                location.href = 'teams.html';
            } catch (err) {
                console.error("Submission failed:", err);
                alert('Error saving report: ' + err.message);
                this.loading = false;
            }
        }
    }));
});
