// Math Preview Component JavaScript
// Hover preview tooltips for equation references
(function() {
    'use strict';

    var currentPreview = null;
    var previewTimeout = null;
    var hideTimeout = null;
    var SHOW_DELAY = 250; // ms before showing preview
    var HIDE_DELAY = 100; // ms before hiding preview

    function initMathPreview() {
        // Find all equation reference links
        var refs = findEquationRefs();

        if (refs.length === 0) {
            return;
        }

        // Set up event listeners on each reference
        refs.forEach(function(ref) {
            setupEquationRef(ref);
        });

        console.log('tex2any: Math preview enabled for ' + refs.length + ' equation references');
    }

    function findEquationRefs() {
        // Selectors for equation references
        var selectors = [
            'a[href^="#eq-"]',     // Standard equation refs
            'a[href^="#E"]',        // Numbered equations (LaTeXML pattern)
            'a.ltx_ref[href*="eq"]', // LaTeXML equation refs
            'a.ltx_ref[href*="eqn"]' // Alternative pattern
        ];

        var refs = [];
        var seen = new Set();

        selectors.forEach(function(selector) {
            var elements = document.querySelectorAll(selector);
            elements.forEach(function(el) {
                // Skip duplicates and non-equation refs
                if (seen.has(el)) return;

                var href = el.getAttribute('href');
                if (!href || href === '#') return;

                // Verify it points to an equation
                var targetId = href.substring(1);
                var target = document.getElementById(targetId);
                if (target && isEquationElement(target)) {
                    refs.push(el);
                    seen.add(el);
                }
            });
        });

        return refs;
    }

    function isEquationElement(element) {
        // Check if element is an equation or contains one
        if (element.classList.contains('ltx_equation') ||
            element.classList.contains('ltx_equationgroup') ||
            element.classList.contains('ltx_Math')) {
            return true;
        }

        // Check for nested equation
        var nested = element.querySelector('.ltx_equation, .ltx_equationgroup, .ltx_Math');
        return !!nested;
    }

    function setupEquationRef(ref) {
        // Add class for styling
        ref.classList.add('tex2any-equation-ref');

        // Mouse enter - show preview after delay
        ref.addEventListener('mouseenter', function(e) {
            clearTimeout(hideTimeout);
            clearTimeout(previewTimeout);

            previewTimeout = setTimeout(function() {
                showPreview(ref);
            }, SHOW_DELAY);
        });

        // Mouse leave - hide preview after delay
        ref.addEventListener('mouseleave', function() {
            clearTimeout(previewTimeout);

            hideTimeout = setTimeout(function() {
                hidePreview();
            }, HIDE_DELAY);
        });
    }

    function showPreview(ref) {
        var href = ref.getAttribute('href');
        if (!href || href === '#') return;

        var targetId = href.substring(1);
        var target = document.getElementById(targetId);

        if (!target) return;

        // Remove existing preview
        if (currentPreview) {
            currentPreview.remove();
            currentPreview = null;
        }

        // Create preview element
        var preview = document.createElement('div');
        preview.className = 'tex2any-math-preview';

        // Create header
        var header = document.createElement('div');
        header.className = 'tex2any-math-preview-header';
        header.textContent = getEquationLabel(target, ref);

        // Create content with cloned equation
        var content = document.createElement('div');
        content.className = 'tex2any-math-preview-content';
        content.innerHTML = getEquationContent(target);

        preview.appendChild(header);
        preview.appendChild(content);

        // Add to document
        document.body.appendChild(preview);

        // Position preview
        positionPreview(preview, ref);

        // Show with animation
        requestAnimationFrame(function() {
            preview.classList.add('show');
        });

        currentPreview = preview;

        // Allow hovering over preview to keep it open
        preview.addEventListener('mouseenter', function() {
            clearTimeout(hideTimeout);
        });

        preview.addEventListener('mouseleave', function() {
            hideTimeout = setTimeout(function() {
                hidePreview();
            }, HIDE_DELAY);
        });
    }

    function hidePreview() {
        clearTimeout(previewTimeout);
        clearTimeout(hideTimeout);

        if (currentPreview) {
            currentPreview.classList.remove('show');
            var preview = currentPreview;
            setTimeout(function() {
                if (preview && preview.parentNode) {
                    preview.remove();
                }
            }, 200);
            currentPreview = null;
        }
    }

    function getEquationLabel(target, ref) {
        // Try to get equation number from target
        var tag = target.querySelector('.ltx_tag, .ltx_tag_equation');
        if (tag) {
            return 'Equation ' + tag.textContent.trim();
        }

        // Try to get from data attribute
        var eqNum = target.getAttribute('data-equation-number');
        if (eqNum) {
            return 'Equation (' + eqNum + ')';
        }

        // Fall back to ref text
        var refText = ref.textContent.trim();
        if (refText) {
            return refText;
        }

        return 'Equation';
    }

    function getEquationContent(target) {
        // Find the actual equation content
        var equation = target;

        // If target is a wrapper, find the equation inside
        if (!target.classList.contains('ltx_equation') &&
            !target.classList.contains('ltx_equationgroup')) {
            var nested = target.querySelector('.ltx_equation, .ltx_equationgroup, .ltx_Math');
            if (nested) {
                equation = nested;
            }
        }

        // Clone the equation
        var clone = equation.cloneNode(true);

        // Remove elements that shouldn't be in preview
        var removeSelectors = [
            'script',
            'style',
            '.ltx_tag',
            '.ltx_tag_equation',
            '.tex2any-copy-shortcode'
        ];

        removeSelectors.forEach(function(selector) {
            var elements = clone.querySelectorAll(selector);
            elements.forEach(function(el) {
                el.remove();
            });
        });

        // Clean up IDs to avoid duplicates
        clone.removeAttribute('id');
        var children = clone.querySelectorAll('[id]');
        children.forEach(function(el) {
            el.removeAttribute('id');
        });

        return clone.outerHTML;
    }

    function positionPreview(preview, ref) {
        var refRect = ref.getBoundingClientRect();
        var previewRect = preview.getBoundingClientRect();

        var scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        var scrollY = window.pageYOffset || document.documentElement.scrollTop;

        var viewportWidth = window.innerWidth;
        var viewportHeight = window.innerHeight;

        // Calculate horizontal position (center on ref, then clamp)
        var left = refRect.left + scrollX + (refRect.width / 2) - (previewRect.width / 2);

        // Clamp to viewport
        var padding = 20;
        if (left < padding) {
            left = padding;
        } else if (left + previewRect.width > viewportWidth - padding) {
            left = viewportWidth - previewRect.width - padding;
        }

        // Calculate vertical position
        // Prefer above the link
        var top;
        var spaceAbove = refRect.top;
        var spaceBelow = viewportHeight - refRect.bottom;
        var previewHeight = previewRect.height;
        var arrowOffset = 10; // Space for arrow

        if (spaceAbove >= previewHeight + arrowOffset || spaceAbove > spaceBelow) {
            // Position above
            top = refRect.top + scrollY - previewHeight - arrowOffset;
            preview.classList.remove('below');
        } else {
            // Position below
            top = refRect.bottom + scrollY + arrowOffset;
            preview.classList.add('below');
        }

        // Ensure not off top of page
        if (top < scrollY + padding) {
            top = scrollY + padding;
        }

        // Position the arrow to point at the reference
        var arrowLeft = refRect.left + scrollX + (refRect.width / 2) - left - 8; // 8 = half arrow width
        arrowLeft = Math.max(15, Math.min(arrowLeft, previewRect.width - 30));

        preview.style.left = left + 'px';
        preview.style.top = top + 'px';
        preview.style.setProperty('--arrow-left', arrowLeft + 'px');

        // Update arrow position via pseudo-element positioning
        // (CSS handles this, but we can fine-tune if needed)
        var styleId = 'tex2any-math-preview-arrow-style';
        var existingStyle = document.getElementById(styleId);
        if (existingStyle) {
            existingStyle.remove();
        }

        var style = document.createElement('style');
        style.id = styleId;
        style.textContent = '.tex2any-math-preview::before, .tex2any-math-preview::after { left: ' + arrowLeft + 'px !important; }';
        document.head.appendChild(style);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMathPreview);
    } else {
        initMathPreview();
    }
})();
