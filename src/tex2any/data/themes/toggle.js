// Theme toggle functionality
(function() {
    'use strict';

    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Create and inject toggle button
    function createToggleButton() {
        const button = document.createElement('button');
        button.className = 'theme-toggle';
        button.setAttribute('aria-label', 'Toggle theme');

        updateButtonText(button, savedTheme);

        button.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateButtonText(button, newTheme);
        });

        document.body.appendChild(button);
    }

    function updateButtonText(button, theme) {
        button.textContent = theme === 'light' ? '🌙 Dark' : '☀️ Light';
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createToggleButton);
    } else {
        createToggleButton();
    }
})();