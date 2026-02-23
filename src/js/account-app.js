document.addEventListener('alpine:init', () => {
    Alpine.data('accountApp', () => ({
        user: null,

        init() {
            auth.onAuthStateChanged(user => {
                if (!user) location.href = 'index.html';
                this.user = user;
            });
        },

        resetPassword() {
            if (!this.user) return;
            auth.sendPasswordResetEmail(this.user.email)
                .then(() => alert('Reset email sent!'))
                .catch(e => alert(e.message));
        },

        deleteAccount() {
            if (!this.user) return;
            if (confirm('Permanently delete account?')) {
                this.user.delete()
                    .then(() => location.href = 'index.html')
                    .catch(e => alert(e.message));
            }
        }
    }));
});
