(function () {
    const theme = localStorage.getItem('theme') || 'dark';
    if (theme === 'light') {
        document.documentElement.classList.add('light');
    } else {
        document.documentElement.classList.remove('light');
    }
})();

function toggleTheme() {
    const isLight = document.documentElement.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// Alpine.js integration
document.addEventListener('alpine:init', () => {
    Alpine.store('theme', {
        isLight: document.documentElement.classList.contains('light'),
        toggle() {
            this.isLight = document.documentElement.classList.toggle('light');
            localStorage.setItem('theme', this.isLight ? 'light' : 'dark');
        }
    });
});
