// Inline TOC Component JavaScript
(function() {
    'use strict';

    function initInlineTOC() {
        // Build TOC from document structure
        const sections = document.querySelectorAll('.ltx_section, .ltx_subsection, .ltx_subsubsection');
        if (sections.length === 0) return;

        // Find a good place to insert TOC (after title/abstract, before first section)
        const firstSection = document.querySelector('.ltx_section');
        if (!firstSection) return;

        // Create TOC wrapper
        const wrapper = document.createElement('nav');
        wrapper.className = 'tex2any-toc';
        wrapper.setAttribute('aria-label', 'Table of Contents');

        // Create title
        const title = document.createElement('div');
        title.className = 'tex2any-toc-title';
        title.textContent = 'Contents';
        wrapper.appendChild(title);

        // Build TOC list
        const tocList = document.createElement('ul');
        sections.forEach(section => {
            const heading = section.querySelector('.ltx_title');
            if (!heading || !section.id) return;

            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#' + section.id;

            // Get section text (remove numbering)
            const textNode = Array.from(heading.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE || !node.classList.contains('ltx_tag'))
                .map(node => node.textContent)
                .join('');

            a.textContent = textNode.trim();
            li.appendChild(a);

            // Add appropriate class for nesting
            if (section.classList.contains('ltx_subsection')) {
                li.style.paddingLeft = '1.5rem';
            } else if (section.classList.contains('ltx_subsubsection')) {
                li.style.paddingLeft = '3rem';
            }

            tocList.appendChild(li);
        });

        wrapper.appendChild(tocList);

        // Insert before first section
        firstSection.parentNode.insertBefore(wrapper, firstSection);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInlineTOC);
    } else {
        initInlineTOC();
    }
})();