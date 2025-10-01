// Document Stats Component JavaScript
(function() {
    'use strict';

    function initDocumentStats() {
        // Calculate statistics
        const stats = calculateDocumentStats();

        if (!stats.words || stats.words === 0) {
            return; // No content found
        }

        // Create stats element
        const statsElement = createStatsElement(stats);

        // Insert into document
        insertStats(statsElement);
    }

    function calculateDocumentStats() {
        const stats = {
            words: 0,
            sections: 0,
            figures: 0,
            tables: 0,
            equations: 0,
            references: 0,
            characters: 0,
            readingTime: 0
        };

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
            return stats;
        }

        // Clone content to avoid counting excluded elements
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
            '.tex2any-document-stats',
            '.ltx_biblist'
        ];

        excludeSelectors.forEach(function(selector) {
            const elements = clonedContent.querySelectorAll(selector);
            elements.forEach(function(el) {
                el.remove();
            });
        });

        // Count words and characters
        const text = clonedContent.textContent || '';
        stats.characters = text.length;

        const words = text.trim().split(/\s+/).filter(function(word) {
            return word.length > 0;
        });
        stats.words = words.length;

        // Calculate reading time (200 words per minute)
        stats.readingTime = Math.ceil(stats.words / 200);

        // Count sections (LaTeXML uses .ltx_section, .ltx_subsection, etc.)
        stats.sections = contentElement.querySelectorAll(
            '.ltx_section, .ltx_subsection, .ltx_subsubsection, ' +
            'h1.ltx_title_section, h2.ltx_title_subsection, h3.ltx_title_subsubsection, ' +
            'section, h2, h3'
        ).length;

        // Count figures
        stats.figures = contentElement.querySelectorAll(
            '.ltx_figure, figure, .ltx_graphics'
        ).length;

        // Count tables
        stats.tables = contentElement.querySelectorAll(
            '.ltx_table, table'
        ).length;

        // Count equations
        stats.equations = contentElement.querySelectorAll(
            '.ltx_equation, .ltx_equationgroup, .ltx_Math'
        ).length;

        // Count references/citations
        stats.references = contentElement.querySelectorAll(
            '.ltx_bibitem, .ltx_cite, .ltx_ref'
        ).length;

        return stats;
    }

    function createStatsElement(stats) {
        const container = document.createElement('div');
        container.className = 'tex2any-document-stats';
        container.setAttribute('role', 'complementary');
        container.setAttribute('aria-label', 'Document statistics');

        const innerContainer = document.createElement('div');
        innerContainer.className = 'tex2any-document-stats-container';

        // Title
        const title = document.createElement('div');
        title.className = 'tex2any-document-stats-title';
        title.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
            Document Statistics
        `;

        // Grid of stats
        const grid = document.createElement('div');
        grid.className = 'tex2any-document-stats-grid';

        // Define which stats to show
        const statsToShow = [
            {
                key: 'words',
                label: 'Words',
                description: 'Total word count'
            },
            {
                key: 'sections',
                label: 'Sections',
                description: 'Number of sections'
            }
        ];

        // Add optional stats if they exist
        if (stats.equations > 0) {
            statsToShow.push({
                key: 'equations',
                label: 'Equations',
                description: 'Mathematical equations'
            });
        }

        if (stats.figures > 0) {
            statsToShow.push({
                key: 'figures',
                label: 'Figures',
                description: 'Images and graphics'
            });
        }

        if (stats.tables > 0) {
            statsToShow.push({
                key: 'tables',
                label: 'Tables',
                description: 'Data tables'
            });
        }

        if (stats.references > 0) {
            statsToShow.push({
                key: 'references',
                label: 'References',
                description: 'Citations and refs'
            });
        }

        // Create stat items
        statsToShow.forEach(function(statDef) {
            const value = stats[statDef.key];
            if (value === undefined) return;

            const item = document.createElement('div');
            item.className = 'tex2any-stat-item';

            const valueElement = document.createElement('div');
            valueElement.className = 'tex2any-stat-value';
            valueElement.textContent = formatNumber(value);

            const labelElement = document.createElement('div');
            labelElement.className = 'tex2any-stat-label';
            labelElement.textContent = statDef.label;

            if (statDef.description) {
                const descElement = document.createElement('div');
                descElement.className = 'tex2any-stat-description';
                descElement.textContent = statDef.description;
                item.appendChild(valueElement);
                item.appendChild(labelElement);
                item.appendChild(descElement);
            } else {
                item.appendChild(valueElement);
                item.appendChild(labelElement);
            }

            grid.appendChild(item);
        });

        innerContainer.appendChild(title);
        innerContainer.appendChild(grid);
        container.appendChild(innerContainer);

        return container;
    }

    function formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }
        return num.toString();
    }

    function insertStats(statsElement) {
        // Try to insert at the end of main content, before footer
        const footerSelectors = [
            '.tex2any-footer',
            'footer',
            '.ltx_bibliography'
        ];

        let footerElement = null;
        for (const selector of footerSelectors) {
            footerElement = document.querySelector(selector);
            if (footerElement) break;
        }

        if (footerElement) {
            // Insert before footer
            footerElement.parentNode.insertBefore(statsElement, footerElement);
        } else {
            // Fallback: append to end of content
            const contentWrapper = document.querySelector('.tex2any-content-wrapper') ||
                                 document.querySelector('.ltx_document') ||
                                 document.body;

            contentWrapper.appendChild(statsElement);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDocumentStats);
    } else {
        initDocumentStats();
    }
})();