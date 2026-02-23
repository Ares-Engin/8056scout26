document.addEventListener('alpine:init', () => {
    Alpine.data('loginApp', () => ({
        email: '',
        password: '',
        errorMessage: '',
        loading: false,

        async login() {
            this.loading = true;
            this.errorMessage = '';
            try {
                await auth.signInWithEmailAndPassword(this.email, this.password);
                location.href = 'dashboard.html';
            } catch (e) {
                this.errorMessage = e.message;
                this.loading = false;
            }
        }
    }));
});
