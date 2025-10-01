// Header Component - Sticky document header
(function() {
    'use strict';

    function addHeader() {
        // Check if header already exists
        if (document.querySelector('.doc-header')) return;

        // Get document info
        const title = document.querySelector('.ltx_title')?.textContent || 'Document';
        const shortTitle = title.length > 40 ? title.substring(0, 40) + '...' : title;

        // Create header
        const header = document.createElement('header');
        header.className = 'doc-header';

        const content = document.createElement('div');
        content.className = 'doc-header-content';

        const headerTitle = document.createElement('a');
        headerTitle.className = 'doc-header-title';
        headerTitle.href = '#';
        headerTitle.textContent = shortTitle;
        headerTitle.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        const nav = document.createElement('nav');
        nav.className = 'doc-header-nav';

        // Add navigation links if sections exist
        const toc = document.querySelector('.ltx_TOC');
        if (toc) {
            const tocLink = document.createElement('a');
            tocLink.href = '#' + toc.id;
            tocLink.textContent = 'Contents';
            nav.appendChild(tocLink);
        }

        content.appendChild(headerTitle);
        content.appendChild(nav);
        header.appendChild(content);

        // Insert at top of document
        const doc = document.querySelector('.ltx_document') || document.body;
        doc.insertBefore(header, doc.firstChild);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addHeader);
    } else {
        addHeader();
    }
})();