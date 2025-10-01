// Equation Numbers Component JavaScript
(function() {
    'use strict';

    function initEquationNumbers() {
        // Find all equations (LaTeXML uses .ltx_equation)
        const equations = document.querySelectorAll('.ltx_equation, .ltx_equationgroup .ltx_equation');

        if (equations.length === 0) {
            return; // No equations found
        }

        let equationCounter = 1;
        const equationMap = new Map();

        // Number all equations
        equations.forEach(function(equation) {
            // Skip if already numbered or if it's marked as unnumbered
            if (equation.hasAttribute('data-equation-number') ||
                equation.classList.contains('ltx_equation_unnumbered')) {
                return;
            }

            const equationNumber = equationCounter++;
            equation.setAttribute('data-equation-number', equationNumber);

            // Store equation ID for reference linking
            const equationId = equation.id || 'eq-' + equationNumber;
            if (!equation.id) {
                equation.id = equationId;
            }
            equationMap.set(equationId, equationNumber);

            // Make equation clickable for copying reference
            equation.style.cursor = 'pointer';
            equation.setAttribute('title', 'Click to copy equation reference');

            equation.addEventListener('click', function() {
                copyEquationReference(equationId, equationNumber);
            });
        });

        // Handle equation references in text
        processEquationReferences(equationMap);

        // Handle URL hash for direct equation navigation
        if (window.location.hash) {
            highlightEquationFromHash();
        }

        // Listen for hash changes
        window.addEventListener('hashchange', highlightEquationFromHash);
    }

    function processEquationReferences(equationMap) {
        // Find all potential equation references (links to equations)
        const links = document.querySelectorAll('a[href^="#eq-"], a[href^="#E"]');

        links.forEach(function(link) {
            const targetId = link.getAttribute('href').substring(1);
            const equationNumber = equationMap.get(targetId);

            if (equationNumber) {
                link.classList.add('tex2any-equation-ref');

                // Add click handler to highlight equation
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    highlightEquation(targetId);

                    // Update URL hash
                    history.pushState(null, null, '#' + targetId);

                    // Scroll to equation
                    const targetEquation = document.getElementById(targetId);
                    if (targetEquation) {
                        targetEquation.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
            }
        });
    }

    function highlightEquation(equationId) {
        // Remove previous highlights
        document.querySelectorAll('.ltx_equation.highlighted').forEach(function(eq) {
            eq.classList.remove('highlighted');
        });

        // Highlight target equation
        const targetEquation = document.getElementById(equationId);
        if (targetEquation) {
            targetEquation.classList.add('highlighted');

            // Remove highlight after 2 seconds
            setTimeout(function() {
                targetEquation.classList.remove('highlighted');
            }, 2000);
        }
    }

    function highlightEquationFromHash() {
        const hash = window.location.hash.substring(1);
        if (hash && hash.match(/^(eq-|E)/)) {
            highlightEquation(hash);
        }
    }

    function copyEquationReference(equationId, equationNumber) {
        // Create reference text
        const refText = 'Equation (' + equationNumber + ')';

        // Try to copy to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(refText).then(function() {
                showCopyNotification('Equation reference copied!');
            }).catch(function() {
                // Fallback
                fallbackCopy(refText);
            });
        } else {
            fallbackCopy(refText);
        }
    }

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand('copy');
            showCopyNotification('Equation reference copied!');
        } catch (err) {
            console.error('Failed to copy equation reference:', err);
        }

        document.body.removeChild(textarea);
    }

    function showCopyNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText =
            'position: fixed; bottom: 80px; right: 20px; ' +
            'background: rgba(0,0,0,0.8); color: white; ' +
            'padding: 0.75rem 1rem; border-radius: 4px; ' +
            'font-size: 0.9rem; z-index: 10000; ' +
            'animation: fadeInOut 2s ease-in-out;';

        document.body.appendChild(notification);

        setTimeout(function() {
            document.body.removeChild(notification);
        }, 2000);
    }

    // Add CSS animation for notification
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0%, 100% { opacity: 0; transform: translateY(10px); }
            10%, 90% { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEquationNumbers);
    } else {
        initEquationNumbers();
    }
})();