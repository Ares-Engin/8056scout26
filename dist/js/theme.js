(function () {
    // Initial theme setting is removed as dark mode is enforced continuously.
    // The immediate dark mode enforcement is handled below.
})();

// Alpine.js integration
document.addEventListener('alpine:init', () => {
    Alpine.store('theme', {
        isLight: false, // Always false, indicating dark mode

        init() {
            document.documentElement.classList.add('dark'); // Enforce dark mode when Alpine initializes
            document.documentElement.classList.remove('light'); // Ensure light mode is removed
            localStorage.setItem('theme', 'dark'); // Persist dark mode preference
        },

        toggle() {
            // Feature removed. Always dark.
        }
    });

    Alpine.store('display', {
        mode: localStorage.getItem('displayMode') || 'mobile',
        init() {
            if (this.mode === 'desktop') {
                document.body.classList.add('desktop-mode');
            }
        },
        toggle() {
            this.mode = this.mode === 'mobile' ? 'desktop' : 'mobile';
            localStorage.setItem('displayMode', this.mode);
            if (this.mode === 'desktop') {
                document.body.classList.add('desktop-mode');
            } else {
                document.body.classList.remove('desktop-mode');
            }
        }
    });

    // Run this immediately rather than waiting for Alpine to init so flash is minimized
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    localStorage.setItem('theme', 'dark');

    // Immediate display mode check
    if (localStorage.getItem('displayMode') === 'desktop') {
        document.body.classList.add('desktop-mode');
    }

    // Dynamic Header/Filter Shrinking Logic for Desktop
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            document.body.classList.add('header-scrolled');
        } else {
            document.body.classList.remove('header-scrolled');
        }
    });
});
