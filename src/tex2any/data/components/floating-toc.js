// Floating TOC Component JavaScript
(function() {
    'use strict';

    function initFloatingTOC() {
        // Build TOC from document structure
        const sections = document.querySelectorAll('.ltx_section, .ltx_subsection, .ltx_subsubsection');
        if (sections.length === 0) return;

        // Create wrapper
        const wrapper = document.createElement('nav');
        wrapper.className = 'tex2any-floating-toc';
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
                li.style.paddingLeft = '1rem';
            } else if (section.classList.contains('ltx_subsubsection')) {
                li.style.paddingLeft = '2rem';
            }

            tocList.appendChild(li);
        });

        wrapper.appendChild(tocList);
        document.body.insertBefore(wrapper, document.body.firstChild);

        // Create toggle button
        const toggle = document.createElement('button');
        toggle.className = 'tex2any-floating-toc-toggle';
        toggle.setAttribute('aria-label', 'Toggle Table of Contents');
        toggle.innerHTML = '☰';
        document.body.appendChild(toggle);

        // Add body class
        document.body.classList.add('has-floating-toc');

        // Start with TOC hidden
        let collapsed = true;
        wrapper.classList.add('collapsed');

        // Toggle functionality
        toggle.addEventListener('click', function() {
            collapsed = !collapsed;
            wrapper.classList.toggle('collapsed', collapsed);
            toggle.innerHTML = collapsed ? '☰' : '✕';
        });

        // Highlight current section
        const headings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
        const tocLinks = wrapper.querySelectorAll('a[href^="#"]');

        function updateActiveTOC() {
            let currentSection = null;
            const scrollPos = window.scrollY + 100;

            headings.forEach(heading => {
                if (heading.offsetTop <= scrollPos) {
                    currentSection = heading;
                }
            });

            tocLinks.forEach(link => {
                link.classList.remove('active');
                if (currentSection && link.getAttribute('href') === '#' + currentSection.id) {
                    link.classList.add('active');
                }
            });
        }

        // Update on scroll
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(updateActiveTOC, 50);
        });

        // Initial update
        updateActiveTOC();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFloatingTOC);
    } else {
        initFloatingTOC();
    }
})();