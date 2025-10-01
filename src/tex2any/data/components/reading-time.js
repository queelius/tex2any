// Reading Time Component JavaScript
(function() {
    'use strict';

    function initReadingTime() {
        // Calculate reading time
        const readingStats = calculateReadingTime();

        if (!readingStats.words || readingStats.words === 0) {
            return; // No content found
        }

        // Create reading time element
        const readingTime = document.createElement('div');
        readingTime.className = 'tex2any-reading-time';
        readingTime.setAttribute('role', 'status');
        readingTime.setAttribute('aria-label', 'Estimated reading time: ' + readingStats.minutes + ' minutes');
        readingTime.setAttribute('data-tooltip', readingStats.words + ' words');

        // Progress indicator
        const progressDot = document.createElement('span');
        progressDot.className = 'tex2any-reading-time-progress not-started';
        progressDot.setAttribute('aria-hidden', 'true');

        // Clock icon
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z');
        icon.appendChild(path);

        // Text
        const text = document.createElement('span');
        text.className = 'tex2any-reading-time-text';
        text.textContent = readingStats.minutes + ' min read';

        // Assemble
        readingTime.appendChild(progressDot);
        readingTime.appendChild(icon);
        readingTime.appendChild(text);

        // Insert into document
        insertReadingTime(readingTime);

        // Track reading progress
        trackReadingProgress(readingTime, progressDot, readingStats.words);
    }

    function calculateReadingTime() {
        // Average reading speed: 200 words per minute
        const wordsPerMinute = 200;

        // Get main content
        const contentSelectors = [
            '.ltx_document',
            'main',
            'article',
            '.tex2any-content-wrapper',
            'body'
        ];

        let contentElement = null;
        for (const selector of contentSelectors) {
            contentElement = document.querySelector(selector);
            if (contentElement) break;
        }

        if (!contentElement) {
            return { words: 0, minutes: 0 };
        }

        // Get text content, excluding certain elements
        const clonedContent = contentElement.cloneNode(true);

        // Remove elements that shouldn't be counted
        const excludeSelectors = [
            'script',
            'style',
            'nav',
            '.tex2any-reading-time',
            '.tex2any-toc',
            '.tex2any-floating-toc',
            '.tex2any-footer',
            '.tex2any-header',
            'code',  // Code is typically read slower
            '.ltx_biblist'  // Bibliography
        ];

        excludeSelectors.forEach(function(selector) {
            const elements = clonedContent.querySelectorAll(selector);
            elements.forEach(function(el) {
                el.remove();
            });
        });

        // Get text content
        const text = clonedContent.textContent || '';

        // Count words
        const words = text.trim().split(/\s+/).filter(function(word) {
            return word.length > 0;
        }).length;

        // Calculate reading time
        const minutes = Math.ceil(words / wordsPerMinute);

        return { words: words, minutes: minutes };
    }

    function insertReadingTime(readingTime) {
        // Try to insert after title
        const titleSelectors = [
            '.ltx_title',
            'h1.ltx_title',
            'article h1',
            'main h1',
            'h1'
        ];

        let titleElement = null;
        for (const selector of titleSelectors) {
            titleElement = document.querySelector(selector);
            if (titleElement) break;
        }

        if (titleElement) {
            // Insert after title
            titleElement.parentNode.insertBefore(readingTime, titleElement.nextSibling);
        } else {
            // Fallback: insert at beginning of content
            const contentWrapper = document.querySelector('.tex2any-content-wrapper') ||
                                 document.querySelector('.ltx_document') ||
                                 document.body;

            if (contentWrapper.firstChild) {
                contentWrapper.insertBefore(readingTime, contentWrapper.firstChild);
            } else {
                contentWrapper.appendChild(readingTime);
            }
        }
    }

    function trackReadingProgress(readingTimeElement, progressDot, totalWords) {
        let hasStarted = false;
        let hasCompleted = false;

        function updateProgress() {
            const scrolled = window.scrollY;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            // Calculate progress percentage
            const progress = scrolled / (documentHeight - windowHeight);

            if (progress < 0.1 && !hasStarted) {
                progressDot.className = 'tex2any-reading-time-progress not-started';
            } else if (progress >= 0.9 && !hasCompleted) {
                progressDot.className = 'tex2any-reading-time-progress completed';
                hasCompleted = true;
            } else if (progress >= 0.1) {
                if (!hasStarted) {
                    hasStarted = true;
                }
                progressDot.className = 'tex2any-reading-time-progress in-progress';
            }

            // Update tooltip with remaining time
            if (progress < 1) {
                const wordsRemaining = Math.ceil(totalWords * (1 - progress));
                const minutesRemaining = Math.ceil(wordsRemaining / 200);
                const tooltip = minutesRemaining > 0
                    ? minutesRemaining + ' min remaining'
                    : 'Almost done!';
                readingTimeElement.setAttribute('data-tooltip', tooltip);
            } else {
                readingTimeElement.setAttribute('data-tooltip', 'Reading complete!');
            }
        }

        // Throttle scroll events
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
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initReadingTime);
    } else {
        initReadingTime();
    }
})();