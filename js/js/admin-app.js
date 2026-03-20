document.addEventListener('alpine:init', () => {
    Alpine.data('adminApp', () => ({
        pendingUsers: [],

        init() {
            auth.onAuthStateChanged(user => {
                if (!isAdmin(user)) return location.href = 'dashboard.html';

                db.collection('users').where('role', '==', 'new')
                    .onSnapshot(snapshot => {
                        this.pendingUsers = [];
                        snapshot.forEach(doc => {
                            this.pendingUsers.push({ id: doc.id, ...doc.data() });
                        });
                    });
            });
        },

        setRole(id, role) {
            db.collection('users').doc(id).update({ role });
        }
    }));
});
