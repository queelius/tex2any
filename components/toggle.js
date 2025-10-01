// Theme toggle component - Dark/light mode switcher
(function() {
    'use strict';

    // Check for saved theme preference, system preference, or default to light
    function getInitialTheme() {
        const saved = localStorage.getItem('theme');
        if (saved) return saved;

        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    }

    const initialTheme = getInitialTheme();
    document.documentElement.setAttribute('data-theme', initialTheme);

    // Create and inject toggle button
    function createToggleButton() {
        const button = document.createElement('button');
        button.className = 'theme-toggle';
        button.setAttribute('aria-label', 'Toggle dark/light mode');
        button.setAttribute('title', 'Toggle dark/light mode');

        updateButtonContent(button, initialTheme);

        button.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateButtonContent(button, newTheme);
        });

        document.body.appendChild(button);
    }

    function updateButtonContent(button, theme) {
        button.textContent = theme === 'light' ? '🌙 Dark' : '☀️ Light';
    }

    // Listen to system theme changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
            // Only update if user hasn't manually set a preference
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createToggleButton);
    } else {
        createToggleButton();
    }
})();