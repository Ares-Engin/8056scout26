document.addEventListener('alpine:init', () => {
    Alpine.data('registerApp', () => ({
        email: '',
        password: '',
        name: '',
        team: '',
        code: '',
        errorMessage: '',
        loading: false,

        async register() {
            this.loading = true;
            this.errorMessage = '';
            try {
                const cred = await auth.createUserWithEmailAndPassword(this.email, this.password);
                await db.collection('users').doc(cred.user.uid).set({
                    email: this.email,
                    name: this.name,
                    teamNumber: Number(this.team),
                    secretCode: this.code,
                    role: 'new'
                });
                location.href = 'dashboard.html';
            } catch (e) {
                this.errorMessage = e.message;
                this.loading = false;
            }
        }
    }));
});
