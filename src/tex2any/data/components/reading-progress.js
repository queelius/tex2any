// Reading Progress Component JavaScript
(function() {
    'use strict';

    function initReadingProgress() {
        // Create progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'tex2any-reading-progress';
        progressBar.setAttribute('role', 'progressbar');
        progressBar.setAttribute('aria-label', 'Reading progress');
        progressBar.setAttribute('aria-valuemin', '0');
        progressBar.setAttribute('aria-valuemax', '100');
        progressBar.setAttribute('aria-valuenow', '0');

        // Insert at the beginning of the content wrapper
        const wrapper = document.querySelector('.tex2any-content-wrapper');
        if (wrapper) {
            wrapper.insertBefore(progressBar, wrapper.firstChild);
        } else {
            document.body.insertBefore(progressBar, document.body.firstChild);
        }

        // Update progress on scroll
        function updateProgress() {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight - windowHeight;
            const scrolled = window.scrollY;
            const progress = (scrolled / documentHeight) * 100;
            const progressClamped = Math.min(100, Math.max(0, progress));

            progressBar.style.width = progressClamped + '%';
            progressBar.setAttribute('aria-valuenow', Math.round(progressClamped));
        }

        // Throttle scroll events for performance
        let ticking = false;
        function onScroll() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    updateProgress();
                    ticking = false;
                });
                ticking = true;
            }
        }

        // Initial update
        updateProgress();

        // Listen to scroll events
        window.addEventListener('scroll', onScroll, { passive: true });

        // Update on resize
        window.addEventListener('resize', updateProgress, { passive: true });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initReadingProgress);
    } else {
        initReadingProgress();
    }
})();