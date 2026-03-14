// Back to Top Component
// Shows a scroll-to-top button after 300px of scrolling.
(function () {
    'use strict';

    function init() {
        var btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.setAttribute('aria-label', 'Back to top');

        // Up-arrow SVG
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M7 14l5-5 5 5z');
        svg.appendChild(path);
        btn.appendChild(svg);

        document.body.appendChild(btn);

        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Show/hide on scroll with rAF throttle
        var ticking = false;
        window.addEventListener('scroll', function () {
            if (!ticking) {
                requestAnimationFrame(function () {
                    btn.classList.toggle('visible', window.scrollY > 300);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
