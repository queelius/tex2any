// Cross References Component JavaScript
// Enhanced equation/theorem/figure cross-references with previews
(function() {
    'use strict';

    let navigationHistory = [];
    let currentPreview = null;
    let previewTimeout = null;

    function initCrossReferences() {
        // Find all reference links
        const refs = findReferences();

        if (refs.length === 0) {
            return;
        }

        // Add event listeners to references
        refs.forEach(function(ref) {
            setupReference(ref);
        });

        // Add keyboard shortcuts
        addKeyboardShortcuts();

        console.log('tex2any: Enhanced ' + refs.length + ' cross-references');
    }

    function findReferences() {
        // Find LaTeX references
        const ltxRefs = Array.from(document.querySelectorAll('a.ltx_ref'));

        // Find internal anchor links
        const anchorLinks = Array.from(document.querySelectorAll('a[href^="#"]'));

        // Combine and deduplicate
        const allRefs = new Set();

        ltxRefs.forEach(function(ref) {
            allRefs.add(ref);
        });

        anchorLinks.forEach(function(ref) {
            // Exclude empty anchors and non-content links
            const href = ref.getAttribute('href');
            if (href && href.length > 1 && !ref.closest('nav, .tex2any-toc, .tex2any-floating-toc')) {
                allRefs.add(ref);
            }
        });

        return Array.from(allRefs);
    }

    function setupReference(ref) {
        // Add CSS class
        if (!ref.classList.contains('ltx_ref')) {
            ref.classList.add('tex2any-ref');
        }

        // Hover to show preview
        ref.addEventListener('mouseenter', function(e) {
            showPreview(ref, e);
        });

        ref.addEventListener('mouseleave', function() {
            hidePreview();
        });

        // Click to navigate with history
        ref.addEventListener('click', function(e) {
            e.preventDefault();
            navigateToReference(ref);
        });
    }

    function showPreview(ref, event) {
        // Clear any existing preview timeout
        clearTimeout(previewTimeout);

        // Delay preview slightly to avoid flickering
        previewTimeout = setTimeout(function() {
            const href = ref.getAttribute('href');
            if (!href || href === '#') return;

            const targetId = href.substring(1);
            const target = document.getElementById(targetId);

            if (!target) return;

            // Create preview
            if (currentPreview) {
                currentPreview.remove();
            }

            const preview = document.createElement('div');
            preview.className = 'tex2any-ref-preview show';

            // Determine reference type and create header
            const refType = getRefType(target);
            const header = document.createElement('div');
            header.className = 'tex2any-ref-preview-header';
            header.textContent = refType;

            // Get preview content
            const content = document.createElement('div');
            content.className = 'tex2any-ref-preview-content';
            content.innerHTML = getPreviewContent(target);

            preview.appendChild(header);
            preview.appendChild(content);

            // Position preview
            document.body.appendChild(preview);
            positionPreview(preview, ref);

            currentPreview = preview;

            // Allow hovering over preview
            preview.addEventListener('mouseenter', function() {
                clearTimeout(previewTimeout);
            });

            preview.addEventListener('mouseleave', function() {
                hidePreview();
            });
        }, 300);
    }

    function hidePreview() {
        clearTimeout(previewTimeout);

        if (currentPreview) {
            currentPreview.style.animation = 'fadeOut 0.2s ease-out';
            setTimeout(function() {
                if (currentPreview) {
                    currentPreview.remove();
                    currentPreview = null;
                }
            }, 200);
        }
    }

    function getRefType(target) {
        if (target.classList.contains('ltx_equation') || target.classList.contains('ltx_equationgroup')) {
            return 'Equation';
        } else if (target.classList.contains('ltx_figure') || target.tagName === 'FIGURE') {
            return 'Figure';
        } else if (target.classList.contains('ltx_table') || target.closest('.ltx_table')) {
            return 'Table';
        } else if (target.classList.contains('ltx_theorem')) {
            return 'Theorem';
        } else if (target.classList.contains('ltx_lemma')) {
            return 'Lemma';
        } else if (target.classList.contains('ltx_proposition')) {
            return 'Proposition';
        } else if (target.classList.contains('ltx_corollary')) {
            return 'Corollary';
        } else if (target.tagName.match(/^H[1-6]$/)) {
            return 'Section';
        } else {
            return 'Reference';
        }
    }

    function getPreviewContent(target) {
        // Clone the target to avoid modifying original
        const clone = target.cloneNode(true);

        // Remove certain elements from preview
        const removeSelectors = [
            '.tex2any-proof-toggle',
            '.tex2any-copy-shortcode',
            'script',
            'style'
        ];

        removeSelectors.forEach(function(selector) {
            const elements = clone.querySelectorAll(selector);
            elements.forEach(function(el) {
                el.remove();
            });
        });

        // Limit content length
        let html = clone.innerHTML;

        // Truncate if too long
        if (html.length > 1000) {
            html = html.substring(0, 1000) + '...';
        }

        return html;
    }

    function positionPreview(preview, ref) {
        const refRect = ref.getBoundingClientRect();
        const previewRect = preview.getBoundingClientRect();

        // Position below the reference by default
        let left = refRect.left;
        let top = refRect.bottom + 10;

        // Adjust if preview would go off right edge
        if (left + previewRect.width > window.innerWidth - 20) {
            left = window.innerWidth - previewRect.width - 20;
        }

        // Adjust if preview would go off bottom edge
        if (top + previewRect.height > window.innerHeight - 20) {
            top = refRect.top - previewRect.height - 10;
        }

        // Ensure not off left edge
        if (left < 20) {
            left = 20;
        }

        preview.style.left = left + 'px';
        preview.style.top = top + window.scrollY + 'px';
    }

    function navigateToReference(ref) {
        const href = ref.getAttribute('href');
        if (!href || href === '#') return;

        const targetId = href.substring(1);
        const target = document.getElementById(targetId);

        if (!target) return;

        // Save current position to history
        navigationHistory.push({
            scrollY: window.scrollY,
            targetId: targetId,
            timestamp: Date.now()
        });

        // Visual feedback on click
        ref.classList.add('tex2any-ref-clicked');
        setTimeout(function() {
            ref.classList.remove('tex2any-ref-clicked');
        }, 300);

        // Hide preview
        hidePreview();

        // Scroll to target
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight target
        highlightTarget(target);

        // Show back button
        showBackButton();
    }

    function highlightTarget(target) {
        target.classList.add('tex2any-ref-target-highlight');

        setTimeout(function() {
            target.classList.remove('tex2any-ref-target-highlight');
        }, 2000);
    }

    function showBackButton() {
        // Remove existing button
        let backBtn = document.querySelector('.tex2any-ref-back-btn');

        if (!backBtn) {
            backBtn = document.createElement('button');
            backBtn.className = 'tex2any-ref-back-btn';

            const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            icon.setAttribute('viewBox', '0 0 24 24');
            icon.setAttribute('aria-hidden', 'true');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z');
            icon.appendChild(path);

            const text = document.createElement('span');
            text.textContent = 'Go Back';

            const kbd = document.createElement('kbd');
            kbd.textContent = 'Alt+Left';

            backBtn.appendChild(icon);
            backBtn.appendChild(text);
            backBtn.appendChild(kbd);

            backBtn.addEventListener('click', goBack);

            document.body.appendChild(backBtn);
        }

        backBtn.classList.add('show');

        // Auto-hide after 5 seconds
        setTimeout(function() {
            if (backBtn.classList.contains('show')) {
                backBtn.classList.remove('show');
            }
        }, 5000);
    }

    function goBack() {
        if (navigationHistory.length === 0) return;

        const previous = navigationHistory.pop();

        // Scroll back to previous position
        window.scrollTo({
            top: previous.scrollY,
            behavior: 'smooth'
        });

        // Hide back button if history is empty
        const backBtn = document.querySelector('.tex2any-ref-back-btn');
        if (backBtn && navigationHistory.length === 0) {
            backBtn.classList.remove('show');
        }
    }

    function addKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Alt + Left Arrow - Go back
            if (e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                goBack();
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCrossReferences);
    } else {
        initCrossReferences();
    }
})();
