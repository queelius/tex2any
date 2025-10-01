// Bookmark Progress Component JavaScript
// Remembers reading position with localStorage
(function() {
    'use strict';

    const STORAGE_KEY = 'tex2any-bookmark';
    const SAVE_INTERVAL = 5000; // 5 seconds
    let saveTimer = null;
    let currentSection = null;
    let bookmark = null;

    function initBookmarkProgress() {
        // Load bookmark
        loadBookmark();

        // Check if there's a saved bookmark
        if (bookmark && bookmark.scrollPosition > 100) {
            showResumeToast();
        }

        // Track scroll position
        startTrackingProgress();

        // Add progress indicator
        addProgressIndicator();

        // Track current section
        trackCurrentSection();
    }

    function loadBookmark() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                bookmark = JSON.parse(saved);

                // Check if bookmark is for current document
                const currentUrl = window.location.pathname;
                if (bookmark.url !== currentUrl) {
                    bookmark = null;
                }
            }
        } catch (e) {
            console.error('tex2any: Could not load bookmark', e);
            bookmark = null;
        }
    }

    function saveBookmark() {
        const scrollPosition = window.scrollY;
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        const progress = scrollPosition / (documentHeight - windowHeight);

        // Don't save if at very beginning or very end
        if (progress < 0.02 || progress > 0.95) {
            return;
        }

        bookmark = {
            url: window.location.pathname,
            scrollPosition: scrollPosition,
            progress: progress,
            section: currentSection || '',
            timestamp: Date.now()
        };

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmark));
            showBookmarkSavedNotification();
        } catch (e) {
            console.error('tex2any: Could not save bookmark', e);
        }
    }

    function clearBookmark() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            bookmark = null;
        } catch (e) {
            console.error('tex2any: Could not clear bookmark', e);
        }
    }

    function showResumeToast() {
        const toast = document.createElement('div');
        toast.className = 'tex2any-resume-toast show';

        const header = document.createElement('div');
        header.className = 'tex2any-resume-toast-header';

        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z');
        icon.appendChild(path);

        const headerText = document.createElement('span');
        headerText.textContent = 'Continue Reading?';

        header.appendChild(icon);
        header.appendChild(headerText);

        const body = document.createElement('div');
        body.className = 'tex2any-resume-toast-body';

        const progressPercent = Math.round(bookmark.progress * 100);
        const timeAgo = getTimeAgo(bookmark.timestamp);

        body.innerHTML = 'You were ' + progressPercent + '% through this document';
        if (bookmark.section) {
            body.innerHTML += ' at <strong>' + bookmark.section + '</strong>';
        }
        body.innerHTML += '<br><small style="opacity: 0.8;">' + timeAgo + '</small>';

        const actions = document.createElement('div');
        actions.className = 'tex2any-resume-toast-actions';

        const resumeBtn = document.createElement('button');
        resumeBtn.className = 'tex2any-resume-btn';
        resumeBtn.textContent = 'Resume';
        resumeBtn.addEventListener('click', function() {
            resumeReading();
            toast.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(function() {
                toast.remove();
            }, 300);
        });

        const dismissBtn = document.createElement('button');
        dismissBtn.className = 'tex2any-dismiss-btn';
        dismissBtn.textContent = 'Start Over';
        dismissBtn.addEventListener('click', function() {
            clearBookmark();
            toast.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(function() {
                toast.remove();
            }, 300);
        });

        actions.appendChild(resumeBtn);
        actions.appendChild(dismissBtn);

        toast.appendChild(header);
        toast.appendChild(body);
        toast.appendChild(actions);

        document.body.appendChild(toast);

        // Auto-dismiss after 10 seconds
        setTimeout(function() {
            if (toast.parentNode) {
                toast.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(function() {
                    toast.remove();
                }, 300);
            }
        }, 10000);
    }

    function resumeReading() {
        if (bookmark && bookmark.scrollPosition) {
            window.scrollTo({
                top: bookmark.scrollPosition,
                behavior: 'smooth'
            });
        }
    }

    function getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) {
            return days + ' day' + (days > 1 ? 's' : '') + ' ago';
        } else if (hours > 0) {
            return hours + ' hour' + (hours > 1 ? 's' : '') + ' ago';
        } else if (minutes > 0) {
            return minutes + ' minute' + (minutes > 1 ? 's' : '') + ' ago';
        } else {
            return 'Just now';
        }
    }

    function startTrackingProgress() {
        function scheduleNextSave() {
            clearTimeout(saveTimer);
            saveTimer = setTimeout(function() {
                saveBookmark();
            }, SAVE_INTERVAL);
        }

        // Save on scroll
        let scrolling = false;
        window.addEventListener('scroll', function() {
            if (!scrolling) {
                scrolling = true;
                requestAnimationFrame(function() {
                    updateProgressIndicator();
                    scheduleNextSave();
                    scrolling = false;
                });
            }
        }, { passive: true });

        // Save on beforeunload
        window.addEventListener('beforeunload', function() {
            saveBookmark();
        });

        // Check if reached end
        window.addEventListener('scroll', function() {
            checkIfReachedEnd();
        }, { passive: true });
    }

    function checkIfReachedEnd() {
        const scrollPosition = window.scrollY;
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        const progress = scrollPosition / (documentHeight - windowHeight);

        if (progress > 0.95) {
            clearBookmark();
        }
    }

    function addProgressIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'tex2any-reading-progress-indicator';
        indicator.setAttribute('aria-label', 'Reading progress');
        indicator.setAttribute('title', 'Click to save bookmark');

        // SVG circle for progress ring
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'tex2any-progress-ring');
        svg.setAttribute('viewBox', '0 0 60 60');

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'tex2any-progress-ring-circle');
        circle.setAttribute('cx', '30');
        circle.setAttribute('cy', '30');
        circle.setAttribute('r', '25');

        svg.appendChild(circle);
        indicator.appendChild(svg);

        // Percentage text
        const percentage = document.createElement('div');
        percentage.className = 'percentage';
        percentage.textContent = '0%';

        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = 'Read';

        indicator.appendChild(percentage);
        indicator.appendChild(label);

        // Click to save
        indicator.addEventListener('click', function() {
            saveBookmark();
        });

        document.body.appendChild(indicator);

        // Initial update
        updateProgressIndicator();
    }

    function updateProgressIndicator() {
        const indicator = document.querySelector('.tex2any-reading-progress-indicator');
        if (!indicator) return;

        const scrollPosition = window.scrollY;
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        const progress = Math.min(scrollPosition / (documentHeight - windowHeight), 1);
        const percentage = Math.round(progress * 100);

        // Update text
        const percentageEl = indicator.querySelector('.percentage');
        if (percentageEl) {
            percentageEl.textContent = percentage + '%';
        }

        // Update circle
        const circle = indicator.querySelector('.tex2any-progress-ring-circle');
        if (circle) {
            const circumference = 2 * Math.PI * 25;
            const offset = circumference - (progress * circumference);
            circle.style.strokeDashoffset = offset;
        }

        // Update integration with reading-time component if present
        const readingTime = document.querySelector('.tex2any-reading-time');
        if (readingTime && readingTime.hasAttribute('data-total-words')) {
            const totalWords = parseInt(readingTime.getAttribute('data-total-words'));
            const wordsRead = Math.round(totalWords * progress);
            const minutesRemaining = Math.ceil((totalWords - wordsRead) / 200);

            if (minutesRemaining > 0) {
                readingTime.setAttribute('data-tooltip', minutesRemaining + ' min remaining');
            } else {
                readingTime.setAttribute('data-tooltip', 'Reading complete!');
            }
        }
    }

    function showBookmarkSavedNotification() {
        // Don't show notification too frequently
        const now = Date.now();
        const lastShown = parseInt(sessionStorage.getItem('tex2any-last-bookmark-notification') || '0');
        if (now - lastShown < 30000) { // 30 seconds
            return;
        }

        sessionStorage.setItem('tex2any-last-bookmark-notification', now.toString());

        const notification = document.createElement('div');
        notification.className = 'tex2any-bookmark-saved show';

        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z');
        icon.appendChild(path);

        const text = document.createElement('span');
        text.textContent = 'Position saved';

        notification.appendChild(icon);
        notification.appendChild(text);

        document.body.appendChild(notification);

        setTimeout(function() {
            notification.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(function() {
                notification.remove();
            }, 300);
        }, 2000);
    }

    function trackCurrentSection() {
        const sections = document.querySelectorAll('h2, h3, .ltx_section .ltx_title');
        if (sections.length === 0) return;

        function updateCurrentSection() {
            let current = null;
            const scrollPosition = window.scrollY + 100; // Offset for header

            sections.forEach(function(section) {
                const rect = section.getBoundingClientRect();
                const absoluteTop = rect.top + window.scrollY;

                if (absoluteTop <= scrollPosition) {
                    current = section.textContent.trim();
                }
            });

            if (current && current !== currentSection) {
                currentSection = current;
            }
        }

        // Update on scroll
        let ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(function() {
                    updateCurrentSection();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        // Initial update
        updateCurrentSection();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBookmarkProgress);
    } else {
        initBookmarkProgress();
    }
})();
