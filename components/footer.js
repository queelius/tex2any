// Footer Component - Document footer with metadata
(function() {
    'use strict';

    function addFooter() {
        // Check if footer already exists
        if (document.querySelector('.doc-footer')) return;

        // Get document metadata
        const title = document.querySelector('.ltx_title')?.textContent || 'Document';
        const authors = document.querySelector('.ltx_authors')?.textContent || '';
        const date = document.querySelector('.ltx_date')?.textContent || new Date().toLocaleDateString();

        // Create footer
        const footer = document.createElement('footer');
        footer.className = 'doc-footer';

        const content = document.createElement('div');
        content.className = 'doc-footer-content';

        const info = document.createElement('div');
        info.className = 'doc-footer-info';

        const generated = document.createElement('div');
        generated.className = 'doc-footer-generated';
        generated.innerHTML = `Generated with <a href="https://github.com/brucemiller/LaTeXML" target="_blank" rel="noopener">LaTeXML</a>`;

        info.appendChild(generated);
        content.appendChild(info);

        footer.appendChild(content);

        // Append to document
        const doc = document.querySelector('.ltx_document') || document.body;
        doc.appendChild(footer);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addFooter);
    } else {
        addFooter();
    }
})();