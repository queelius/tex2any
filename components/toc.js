// TOC Component - Floating table of contents with active section tracking
(function() {
    'use strict';

    function initFloatingTOC() {
        const toc = document.querySelector('.ltx_TOC');
        if (!toc) return;

        // Add floating-toc class and adjust body
        toc.classList.add('floating-toc');
        document.body.classList.add('has-floating-toc');
        document.documentElement.classList.add('has-floating-toc');

        // Track active sections
        setupActiveTracking();

        // Mobile toggle
        setupMobileToggle(toc);
    }

    function setupActiveTracking() {
        const tocLinks = document.querySelectorAll('.ltx_TOC a');
        if (tocLinks.length === 0) return;

        // Get all section headings
        const headings = Array.from(tocLinks).map(link => {
            const id = link.getAttribute('href').substring(1);
            return document.getElementById(id);
        }).filter(Boolean);

        if (headings.length === 0) return;

        // Update active link on scroll
        function updateActiveLink() {
            const scrollPos = window.scrollY + 100;

            let currentHeading = headings[0];
            for (const heading of headings) {
                if (heading.offsetTop <= scrollPos) {
                    currentHeading = heading;
                } else {
                    break;
                }
            }

            // Remove all active classes
            tocLinks.forEach(link => link.classList.remove('active'));

            // Add active class to current link
            if (currentHeading) {
                const activeLink = document.querySelector(`.ltx_TOC a[href="#${currentHeading.id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        }

        // Throttle scroll events
        let ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    updateActiveLink();
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Initial update
        updateActiveLink();
    }

    function setupMobileToggle(toc) {
        // Create mobile toggle button
        const toggle = document.createElement('button');
        toggle.className = 'toc-mobile-toggle';
        toggle.textContent = '📑 Contents';
        toggle.setAttribute('aria-label', 'Toggle table of contents');

        toggle.addEventListener('click', function() {
            toc.classList.toggle('mobile-open');
        });

        document.body.appendChild(toggle);

        // Close TOC when clicking a link on mobile
        const tocLinks = toc.querySelectorAll('a');
        tocLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 1200) {
                    toc.classList.remove('mobile-open');
                }
            });
        });

        // Close TOC when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 1200) {
                if (!toc.contains(e.target) && !toggle.contains(e.target)) {
                    toc.classList.remove('mobile-open');
                }
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFloatingTOC);
    } else {
        initFloatingTOC();
    }
})();