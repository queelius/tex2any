// Theme Toggle Component JavaScript
(function() {
    'use strict';

    function initThemeToggle() {
        // Check for saved theme preference or default to light mode
        const savedTheme = localStorage.getItem('tex2any-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.body.setAttribute('data-theme', savedTheme);

        // Create toggle button
        const button = document.createElement('button');
        button.className = 'tex2any-theme-toggle';
        button.setAttribute('aria-label', savedTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');

        updateButtonContent(button, savedTheme);

        button.addEventListener('click', function() {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            document.documentElement.setAttribute('data-theme', newTheme);
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('tex2any-theme', newTheme);

            updateButtonContent(button, newTheme);
            button.setAttribute('aria-label', newTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
        });

        document.body.appendChild(button);
    }

    function updateButtonContent(button, theme) {
        button.innerHTML = theme === 'light' ? '🌙' : '☀️';
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeToggle);
    } else {
        initThemeToggle();
    }
})();