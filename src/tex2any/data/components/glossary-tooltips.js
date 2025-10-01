// Glossary Tooltips Component JavaScript
// Hover tooltips for technical terms with definitions
(function() {
    'use strict';

    let glossary = {};
    let currentTooltip = null;
    let tooltipTimeout = null;

    // Built-in glossary for common terms
    const BUILTIN_GLOSSARY = {
        // Math terms
        'theorem': 'A mathematical statement that has been proven to be true based on previously established statements and axioms.',
        'lemma': 'A proven statement used as a stepping stone to prove a larger theorem.',
        'corollary': 'A statement that follows readily from a previously proven statement.',
        'proposition': 'A mathematical statement whose truth can be verified.',
        'proof': 'A logical argument demonstrating the truth of a mathematical statement.',
        'axiom': 'A statement accepted as true without proof, serving as a starting point for further reasoning.',
        'conjecture': 'A mathematical statement that is proposed as true but has not yet been proven.',
        'manifold': 'A topological space that locally resembles Euclidean space near each point.',
        'homeomorphism': 'A continuous function between topological spaces with a continuous inverse.',
        'isomorphism': 'A structure-preserving bijection between two mathematical structures.',
        'bijection': 'A function that is both injective (one-to-one) and surjective (onto).',
        'topology': 'The mathematical study of properties preserved through continuous deformations.',
        'hilbert space': 'A complete inner product space, generalizing Euclidean space to infinite dimensions.',

        // CS terms
        'algorithm': 'A step-by-step procedure for solving a problem or performing a computation.',
        'complexity': 'A measure of the resources required to run an algorithm, typically time or space.',
        'polynomial time': 'An algorithm that runs in time bounded by a polynomial function of the input size.',
        'NP-complete': 'A class of decision problems for which no known polynomial-time solution exists.',
        'recursion': 'A method where a function calls itself to solve smaller instances of the same problem.',
        'dynamic programming': 'An optimization technique that solves complex problems by breaking them into simpler subproblems.',
        'greedy algorithm': 'An algorithm that makes locally optimal choices at each step.',
        'hash table': 'A data structure that maps keys to values using a hash function for fast lookup.',
        'binary tree': 'A tree data structure where each node has at most two children.',
        'graph': 'A collection of nodes (vertices) connected by edges.',
        'API': 'Application Programming Interface - a set of protocols for building software.',
        'REST': 'Representational State Transfer - an architectural style for web services.',
        'JSON': 'JavaScript Object Notation - a lightweight data interchange format.'
    };

    function initGlossaryTooltips() {
        // Load built-in glossary
        glossary = Object.assign({}, BUILTIN_GLOSSARY);

        // Extract custom glossary from document
        extractCustomGlossary();

        // Find and mark glossary terms
        findAndMarkTerms();

        // Add glossary toggle button
        addGlossaryToggle();

        // Add keyboard shortcuts
        addKeyboardShortcuts();

        console.log('tex2any: Initialized glossary with ' + Object.keys(glossary).length + ' terms');
    }

    function extractCustomGlossary() {
        // Look for custom glossary definitions
        // Format: \gls{term}{definition} or custom markers

        // Try to find glossary section
        const glossarySection = document.querySelector('.ltx_glossary, #glossary, .glossary');
        if (glossarySection) {
            const items = glossarySection.querySelectorAll('dt, .glossary-term');
            items.forEach(function(item) {
                const term = item.textContent.trim().toLowerCase();
                const definition = item.nextElementSibling;
                if (definition && (definition.tagName === 'DD' || definition.classList.contains('glossary-definition'))) {
                    glossary[term] = definition.textContent.trim();
                }
            });
        }
    }

    function findAndMarkTerms() {
        // Find text nodes and mark glossary terms
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip script, style, and already processed elements
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;

                    const tagName = parent.tagName.toLowerCase();
                    if (['script', 'style', 'noscript', 'iframe'].indexOf(tagName) !== -1) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    if (parent.classList.contains('tex2any-glossary-term')) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        // Process text nodes
        textNodes.forEach(function(textNode) {
            markTermsInTextNode(textNode);
        });
    }

    function markTermsInTextNode(textNode) {
        const text = textNode.textContent;
        const parent = textNode.parentElement;

        // Find glossary terms in text (case-insensitive)
        const terms = Object.keys(glossary);
        let matches = [];

        terms.forEach(function(term) {
            const regex = new RegExp('\\b' + escapeRegex(term) + '\\b', 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    term: term,
                    start: match.index,
                    end: match.index + match[0].length,
                    matchedText: match[0]
                });
            }
        });

        if (matches.length === 0) return;

        // Sort matches by position
        matches.sort(function(a, b) {
            return a.start - b.start;
        });

        // Remove overlapping matches
        matches = removeOverlaps(matches);

        if (matches.length === 0) return;

        // Build new HTML with marked terms
        let html = '';
        let lastIndex = 0;

        matches.forEach(function(match) {
            // Add text before match
            html += escapeHtml(text.substring(lastIndex, match.start));

            // Add marked term
            html += '<span class="tex2any-glossary-term" data-term="' +
                escapeHtml(match.term) + '" data-definition="' +
                escapeHtml(glossary[match.term]) + '">' +
                escapeHtml(match.matchedText) + '</span>';

            lastIndex = match.end;
        });

        // Add remaining text
        html += escapeHtml(text.substring(lastIndex));

        // Replace text node with new HTML
        const wrapper = document.createElement('span');
        wrapper.innerHTML = html;

        // Add event listeners to glossary terms
        const terms_elements = wrapper.querySelectorAll('.tex2any-glossary-term');
        terms_elements.forEach(function(term) {
            setupGlossaryTerm(term);
        });

        parent.replaceChild(wrapper, textNode);
    }

    function removeOverlaps(matches) {
        const result = [];
        let lastEnd = -1;

        matches.forEach(function(match) {
            if (match.start >= lastEnd) {
                result.push(match);
                lastEnd = match.end;
            }
        });

        return result;
    }

    function setupGlossaryTerm(term) {
        term.addEventListener('mouseenter', function(e) {
            showTooltip(term, e);
        });

        term.addEventListener('mouseleave', function() {
            hideTooltip();
        });

        term.addEventListener('click', function(e) {
            e.preventDefault();
            const termText = term.getAttribute('data-term');
            showGlossaryPanel(termText);
        });
    }

    function showTooltip(term, event) {
        clearTimeout(tooltipTimeout);

        tooltipTimeout = setTimeout(function() {
            const definition = term.getAttribute('data-definition');
            if (!definition) return;

            // Remove existing tooltip
            if (currentTooltip) {
                currentTooltip.remove();
            }

            // Create tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'tex2any-glossary-tooltip show';
            tooltip.textContent = definition;

            document.body.appendChild(tooltip);

            // Position tooltip
            const rect = term.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();

            let left = rect.left;
            let top = rect.bottom + 10;

            // Adjust if would go off screen
            if (left + tooltipRect.width > window.innerWidth - 20) {
                left = window.innerWidth - tooltipRect.width - 20;
            }

            if (left < 20) {
                left = 20;
            }

            tooltip.style.left = left + 'px';
            tooltip.style.top = top + window.scrollY + 'px';

            currentTooltip = tooltip;
        }, 200);
    }

    function hideTooltip() {
        clearTimeout(tooltipTimeout);

        if (currentTooltip) {
            currentTooltip.style.opacity = '0';
            setTimeout(function() {
                if (currentTooltip) {
                    currentTooltip.remove();
                    currentTooltip = null;
                }
            }, 200);
        }
    }

    function addGlossaryToggle() {
        const button = document.createElement('button');
        button.className = 'tex2any-glossary-toggle';
        button.setAttribute('aria-label', 'Open glossary');

        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z');
        icon.appendChild(path);

        const text = document.createElement('span');
        text.textContent = 'Glossary';

        const count = document.createElement('span');
        count.className = 'count';
        count.textContent = Object.keys(glossary).length;

        button.appendChild(icon);
        button.appendChild(text);
        button.appendChild(count);

        button.addEventListener('click', function() {
            showGlossaryPanel();
        });

        document.body.appendChild(button);
    }

    function showGlossaryPanel(highlightTerm) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'tex2any-glossary-overlay show';

        // Create panel
        const panel = document.createElement('div');
        panel.className = 'tex2any-glossary-panel show';

        // Header
        const header = document.createElement('div');
        header.className = 'tex2any-glossary-panel-header';

        const title = document.createElement('h3');
        title.textContent = 'Glossary';

        const search = document.createElement('input');
        search.type = 'text';
        search.className = 'tex2any-glossary-search';
        search.placeholder = 'Search terms...';
        search.setAttribute('aria-label', 'Search glossary');

        const closeBtn = document.createElement('button');
        closeBtn.className = 'tex2any-glossary-panel-close';
        closeBtn.textContent = '×';
        closeBtn.setAttribute('aria-label', 'Close glossary');

        header.appendChild(title);
        header.appendChild(closeBtn);
        header.appendChild(search);

        // Body
        const body = document.createElement('div');
        body.className = 'tex2any-glossary-panel-body';

        // Render glossary items
        renderGlossaryItems(body, highlightTerm);

        // Search functionality
        search.addEventListener('input', function() {
            const query = search.value.toLowerCase();
            renderGlossaryItems(body, null, query);
        });

        // Assemble panel
        panel.appendChild(header);
        panel.appendChild(body);

        document.body.appendChild(overlay);
        document.body.appendChild(panel);

        // Focus search
        search.focus();

        // Close handlers
        function hidePanel() {
            panel.classList.remove('show');
            overlay.classList.remove('show');
            setTimeout(function() {
                panel.remove();
                overlay.remove();
            }, 300);
        }

        closeBtn.addEventListener('click', hidePanel);
        overlay.addEventListener('click', hidePanel);

        // Escape key
        function handleEscape(e) {
            if (e.key === 'Escape') {
                hidePanel();
                document.removeEventListener('keydown', handleEscape);
            }
        }
        document.addEventListener('keydown', handleEscape);
    }

    function renderGlossaryItems(container, highlightTerm, searchQuery) {
        container.innerHTML = '';

        // Filter and sort terms
        const terms = Object.keys(glossary).filter(function(term) {
            if (searchQuery && term.indexOf(searchQuery) === -1 &&
                glossary[term].toLowerCase().indexOf(searchQuery) === -1) {
                return false;
            }
            return true;
        }).sort();

        if (terms.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'tex2any-glossary-empty';
            empty.textContent = searchQuery ? 'No terms found' : 'No glossary terms available';
            container.appendChild(empty);
            return;
        }

        terms.forEach(function(term) {
            const item = document.createElement('div');
            item.className = 'tex2any-glossary-item';

            if (highlightTerm && term.toLowerCase() === highlightTerm.toLowerCase()) {
                item.style.background = 'rgba(255, 235, 59, 0.2)';
            }

            const termEl = document.createElement('div');
            termEl.className = 'tex2any-glossary-item-term';
            termEl.textContent = term.charAt(0).toUpperCase() + term.slice(1);

            const defEl = document.createElement('div');
            defEl.className = 'tex2any-glossary-item-definition';
            defEl.textContent = glossary[term];

            item.appendChild(termEl);
            item.appendChild(defEl);
            container.appendChild(item);
        });
    }

    function addKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + G - Open glossary
            if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
                e.preventDefault();
                showGlossaryPanel();
            }
        });
    }

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGlossaryTooltips);
    } else {
        initGlossaryTooltips();
    }
})();
