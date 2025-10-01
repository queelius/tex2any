// Back to Top Component JavaScript
(function() {
    'use strict';

    function initBackToTop() {
        // Create button
        const button = document.createElement('button');
        button.className = 'tex2any-back-to-top';
        button.setAttribute('aria-label', 'Back to top');
        button.innerHTML = '<svg viewBox="0 0 24 24"><path d="M7 14l5-5 5 5z"/></svg>';

        // Add to body
        document.body.appendChild(button);

        // Show/hide based on scroll position
        function updateVisibility() {
            const scrolled = window.scrollY;
            const threshold = 300; // Show after scrolling 300px

            if (scrolled > threshold) {
                button.classList.add('visible');
            } else {
                button.classList.remove('visible');
            }
        }

        // Scroll to top when clicked
        button.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // Throttle scroll events for performance
        let ticking = false;
        function onScroll() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    updateVisibility();
                    ticking = false;
                });
                ticking = true;
            }
        }

        // Initial check
        updateVisibility();

        // Listen to scroll events
        window.addEventListener('scroll', onScroll, { passive: true });

        // Keyboard accessibility (Enter and Space)
        button.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                button.click();
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBackToTop);
    } else {
        initBackToTop();
    }
})();