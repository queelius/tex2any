// Header Component JavaScript
(function() {
    'use strict';

    function initHeader() {
        // Get document title and metadata
        const docTitle = document.querySelector('.ltx_title_document');
        const authors = document.querySelector('.ltx_authors');
        const date = document.querySelector('.ltx_date');

        if (!docTitle) return;

        // Create header
        const header = document.createElement('header');
        header.className = 'tex2any-header';

        const headerContent = document.createElement('div');
        headerContent.className = 'tex2any-header-content';

        // Title section
        const titleSection = document.createElement('div');
        titleSection.className = 'tex2any-header-title';

        const h1 = document.createElement('h1');
        h1.textContent = docTitle.textContent;
        titleSection.appendChild(h1);

        if (authors) {
            const subtitle = document.createElement('div');
            subtitle.className = 'tex2any-header-subtitle';
            subtitle.textContent = authors.textContent;
            titleSection.appendChild(subtitle);
        }

        headerContent.appendChild(titleSection);

        // Navigation section (if multiple sections exist)
        const sections = document.querySelectorAll('.ltx_section');
        if (sections.length > 1) {
            const nav = document.createElement('nav');
            nav.className = 'tex2any-header-nav';

            // Add link to first few sections
            sections.forEach((section, i) => {
                if (i >= 3) return; // Only show first 3
                const heading = section.querySelector('.ltx_title');
                if (!heading || !section.id) return;

                const a = document.createElement('a');
                a.href = '#' + section.id;
                a.textContent = heading.textContent.replace(/^\d+\s*/, '');
                nav.appendChild(a);
            });

            headerContent.appendChild(nav);
        }

        header.appendChild(headerContent);

        // Insert at the top of body
        document.body.insertBefore(header, document.body.firstChild);

        // Hide original title elements if desired
        if (docTitle) docTitle.style.display = 'none';
        if (authors) authors.style.display = 'none';
        if (date) date.style.display = 'none';
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeader);
    } else {
        initHeader();
    }
})();