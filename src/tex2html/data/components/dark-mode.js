// Dark Mode Component
// Respects prefers-color-scheme, persists to localStorage.
// NOTE: The composer injects a small inline <script> in <head> that applies
// the theme BEFORE paint to prevent flash. This JS handles the toggle button.
(function () {
    'use strict';

    var STORAGE_KEY = 'tex2html-theme';

    function getPreferred() {
        var saved = null;
        try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
        if (saved === 'dark' || saved === 'light') return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function apply(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    // SVG icon paths (moon = switch to dark, sun = switch to light)
    var icons = {
        moon: 'M21.53 15.93c-.16-.27-.61-.69-1.73-.49a8.46 8.46 0 01-1.88.13 8.41 8.41 0 01-5.91-2.82 8.21 8.21 0 01-1.9-6.24c.16-1.13-.27-1.58-.54-1.73-.26-.15-.71-.31-1.62.24A10.07 10.07 0 003 14.24 9.9 9.9 0 009.56 21a10.07 10.07 0 007.51-2.67c.92-.75.75-1.23.46-1.4z',
        sun: 'M12 7a5 5 0 100 10 5 5 0 000-10zm0-3a1 1 0 01-1-1V1a1 1 0 112 0v2a1 1 0 01-1 1zm0 16a1 1 0 01-1-1v-2a1 1 0 112 0v2a1 1 0 01-1 1zm9-9h-2a1 1 0 110-2h2a1 1 0 110 2zM6 12a1 1 0 01-1 1H3a1 1 0 110-2h2a1 1 0 011 1zm12.36-5.64a1 1 0 01-.7-.3l-1.42-1.42a1 1 0 111.41-1.41l1.42 1.42a1 1 0 01-.7 1.71zM6.05 19.07a1 1 0 01-.7-.3l-1.42-1.42a1 1 0 111.41-1.41l1.42 1.42a1 1 0 01-.7 1.71zM19.07 19.07a1 1 0 01-.7-1.71l1.42-1.42a1 1 0 111.41 1.41l-1.42 1.42a1 1 0 01-.7.3zM6.05 6.06a1 1 0 01-.7-1.71l1.42-1.42a1 1 0 011.41 1.41L6.76 5.76a1 1 0 01-.7.3z'
    };

    function makeSvgIcon(pathData) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        svg.appendChild(path);
        return svg;
    }

    function setButtonIcon(btn, theme) {
        var iconKey = theme === 'light' ? 'moon' : 'sun';
        var label = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
        // Clear existing children
        while (btn.firstChild) btn.removeChild(btn.firstChild);
        btn.appendChild(makeSvgIcon(icons[iconKey]));
        btn.setAttribute('aria-label', label);
    }

    function createToggle(theme) {
        var btn = document.createElement('button');
        btn.className = 'dark-mode-toggle';
        setButtonIcon(btn, theme);

        btn.addEventListener('click', function () {
            var current = document.documentElement.getAttribute('data-theme') || 'light';
            var next = current === 'light' ? 'dark' : 'light';
            apply(next);
            setButtonIcon(btn, next);
            try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
        });

        document.body.appendChild(btn);
    }

    // Listen for system theme changes (only when user hasn't manually chosen)
    try {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            try {
                if (localStorage.getItem(STORAGE_KEY)) return;
            } catch (ex) {}
            var theme = e.matches ? 'dark' : 'light';
            apply(theme);
            var btn = document.querySelector('.dark-mode-toggle');
            if (btn) setButtonIcon(btn, theme);
        });
    } catch (e) {}

    function init() {
        var theme = getPreferred();
        apply(theme);
        createToggle(theme);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
