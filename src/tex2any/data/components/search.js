// Search Component JavaScript
(function() {
    'use strict';

    function initSearch() {
        // Create search container
        const container = document.createElement('div');
        container.className = 'tex2any-search-container';
        container.innerHTML = `
            <div class="tex2any-search-box">
                <input
                    type="search"
                    class="tex2any-search-input"
                    placeholder="Search document..."
                    aria-label="Search document"
                    autocomplete="off"
                />
                <span class="tex2any-search-hint" aria-hidden="true">Ctrl+K</span>
                <button class="tex2any-search-clear" aria-label="Clear search">✕</button>
                <span class="tex2any-search-icon" aria-hidden="true">🔍</span>
            </div>
            <div class="tex2any-search-results" role="status" aria-live="polite"></div>
        `;

        // Insert at the top of the document
        const mainContent = document.querySelector('.ltx_document') || document.body;
        mainContent.insertBefore(container, mainContent.firstChild);

        const input = container.querySelector('.tex2any-search-input');
        const clearBtn = container.querySelector('.tex2any-search-clear');
        const resultsDiv = container.querySelector('.tex2any-search-results');

        // Index searchable content
        const searchableElements = Array.from(document.querySelectorAll(
            '.ltx_section, .ltx_subsection, .ltx_para, .ltx_theorem, .ltx_proof, .ltx_abstract'
        ));

        let currentMatches = [];
        let currentIndex = 0;

        // Search function
        function performSearch(query) {
            // Clear previous highlights
            document.body.classList.remove('searching');
            searchableElements.forEach(el => {
                el.classList.remove('search-match');
                const highlights = el.querySelectorAll('mark.search-highlight');
                highlights.forEach(mark => {
                    const text = mark.textContent;
                    mark.replaceWith(document.createTextNode(text));
                });
            });

            if (!query || query.length < 2) {
                resultsDiv.textContent = '';
                currentMatches = [];
                return;
            }

            // Search and highlight
            document.body.classList.add('searching');
            currentMatches = [];
            const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

            searchableElements.forEach(el => {
                const text = el.textContent;
                if (regex.test(text)) {
                    el.classList.add('search-match');
                    currentMatches.push(el);

                    // Highlight matches
                    highlightMatches(el, regex);
                }
            });

            // Update results
            const count = currentMatches.length;
            if (count === 0) {
                resultsDiv.textContent = 'No results found';
            } else {
                resultsDiv.textContent = `Found ${count} ${count === 1 ? 'result' : 'results'}`;
                // Scroll to first result
                if (currentMatches[0]) {
                    currentMatches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    currentIndex = 0;
                }
            }
        }

        // Highlight matches in element
        function highlightMatches(element, regex) {
            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            const nodesToReplace = [];
            let node;
            while (node = walker.nextNode()) {
                if (regex.test(node.textContent)) {
                    nodesToReplace.push(node);
                }
            }

            nodesToReplace.forEach(node => {
                const span = document.createElement('span');
                span.innerHTML = node.textContent.replace(regex, '<mark class="search-highlight">$&</mark>');
                node.parentNode.replaceChild(span, node);
            });
        }

        // Event listeners
        let searchTimeout;
        input.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => performSearch(e.target.value), 300);
        });

        clearBtn.addEventListener('click', function() {
            input.value = '';
            performSearch('');
            input.focus();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Ctrl+K or Cmd+K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                input.focus();
                input.select();
            }

            // Escape to clear search
            if (e.key === 'Escape' && document.activeElement === input) {
                input.value = '';
                performSearch('');
                input.blur();
            }

            // Navigate results with arrow keys
            if (currentMatches.length > 0 && document.activeElement === input) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    currentIndex = (currentIndex + 1) % currentMatches.length;
                    currentMatches[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    currentIndex = (currentIndex - 1 + currentMatches.length) % currentMatches.length;
                    currentMatches[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearch);
    } else {
        initSearch();
    }
})();