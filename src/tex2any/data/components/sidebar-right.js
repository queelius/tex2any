// Right Sidebar Component JavaScript
(function() {
    'use strict';

    function initSidebarRight() {
        const sidebar = document.querySelector('.tex2any-sidebar-right');
        if (!sidebar) return;

        // Create toggle button for mobile
        const toggle = document.createElement('button');
        toggle.className = 'tex2any-sidebar-toggle';
        toggle.innerHTML = 'ℹ️';
        toggle.setAttribute('aria-label', 'Toggle sidebar');
        document.body.appendChild(toggle);

        // Toggle functionality
        toggle.addEventListener('click', function() {
            const isShowing = sidebar.classList.contains('show');
            sidebar.classList.toggle('show', !isShowing);
            toggle.innerHTML = isShowing ? 'ℹ️' : '✕';
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 1024 &&
                sidebar.classList.contains('show') &&
                !sidebar.contains(e.target) &&
                !toggle.contains(e.target)) {
                sidebar.classList.remove('show');
                toggle.innerHTML = 'ℹ️';
            }
        });

        // Auto-populate quick links from document structure
        populateQuickLinks();
        populateMetadata();
    }

    function populateQuickLinks() {
        const container = document.querySelector('.tex2any-quick-links');
        if (!container) return;

        // Find important elements
        const abstract = document.querySelector('.ltx_abstract');
        const bibliography = document.querySelector('.ltx_bibliography');
        const appendix = document.querySelector('.ltx_appendix');

        const links = [];
        if (abstract) links.push({ text: 'Abstract', href: '#' + abstract.id });
        if (bibliography) links.push({ text: 'Bibliography', href: '#' + bibliography.id });
        if (appendix) links.push({ text: 'Appendix', href: '#' + appendix.id });

        links.forEach(link => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = link.href;
            a.textContent = link.text;
            li.appendChild(a);
            container.appendChild(li);
        });
    }

    function populateMetadata() {
        const container = document.querySelector('.tex2any-metadata');
        if (!container) return;

        // Extract metadata from document
        const title = document.querySelector('.ltx_title');
        const authors = document.querySelector('.ltx_authors');
        const date = document.querySelector('.ltx_date');

        // Count sections, figures, tables
        const sections = document.querySelectorAll('.ltx_section');
        const figures = document.querySelectorAll('.ltx_figure');
        const tables = document.querySelectorAll('.ltx_table');
        const equations = document.querySelectorAll('.ltx_equation');

        const metadata = [];
        if (sections.length) metadata.push({ label: 'Sections', value: sections.length });
        if (figures.length) metadata.push({ label: 'Figures', value: figures.length });
        if (tables.length) metadata.push({ label: 'Tables', value: tables.length });
        if (equations.length) metadata.push({ label: 'Equations', value: equations.length });

        // Estimate reading time (assuming 200 words per minute)
        const wordCount = document.body.textContent.split(/\s+/).length;
        const readTime = Math.ceil(wordCount / 200);
        metadata.push({ label: 'Reading time', value: `~${readTime} min` });

        metadata.forEach(item => {
            const dt = document.createElement('dt');
            dt.textContent = item.label;
            const dd = document.createElement('dd');
            dd.textContent = item.value;
            container.appendChild(dt);
            container.appendChild(dd);
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebarRight);
    } else {
        initSidebarRight();
    }
})();