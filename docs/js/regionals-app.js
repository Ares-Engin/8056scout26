document.addEventListener('alpine:init', () => {
    Alpine.data('regionalsApp', () => ({
        searchQuery: '',
        availableEvents: FRC_CONFIG.events,

        get filteredRegionals() {
            const season = parseInt(Alpine.store('appState').season);
            if (!this.searchQuery) return this.availableEvents.filter(e => e.season === season);
            const q = this.searchQuery.toLowerCase();
            return this.availableEvents.filter(e =>
                e.season === season && (
                    e.name.toLowerCase().includes(q) ||
                    e.key.toLowerCase().includes(q)
                )
            );
        }
    }));
});
