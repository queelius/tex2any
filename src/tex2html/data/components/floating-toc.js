// Floating TOC Component
// Builds sidebar TOC from LaTeXML section structure, highlights on scroll.
(function () {
    'use strict';

    function init() {
        // Map LaTeXML classes to depth levels
        var depthMap = {
            'ltx_section': 1,
            'ltx_subsection': 2,
            'ltx_subsubsection': 3
        };

        var sections = document.querySelectorAll('.ltx_section, .ltx_subsection, .ltx_subsubsection');
        if (sections.length === 0) return;

        // Build entries: { id, text, depth }
        var entries = [];
        sections.forEach(function (el) {
            var heading = el.querySelector('.ltx_title');
            if (!heading || !el.id) return;

            // Get text without the section number tag
            var text = '';
            heading.childNodes.forEach(function (node) {
                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent;
                } else if (!node.classList || !node.classList.contains('ltx_tag')) {
                    text += node.textContent;
                }
            });
            text = text.trim();
            if (!text) return;

            var depth = 1;
            for (var cls in depthMap) {
                if (el.classList.contains(cls)) { depth = depthMap[cls]; break; }
            }

            entries.push({ id: el.id, text: text, depth: depth });
        });

        if (entries.length === 0) return;

        // Create nav
        var nav = document.createElement('nav');
        nav.className = 'floating-toc';
        nav.setAttribute('aria-label', 'Table of Contents');

        var title = document.createElement('div');
        title.className = 'floating-toc-title';
        title.textContent = 'Contents';
        nav.appendChild(title);

        var ul = document.createElement('ul');
        var links = [];

        entries.forEach(function (entry) {
            var li = document.createElement('li');
            li.setAttribute('data-depth', entry.depth);
            var a = document.createElement('a');
            a.href = '#' + entry.id;
            a.textContent = entry.text;
            li.appendChild(a);
            ul.appendChild(li);
            links.push({ el: a, id: entry.id });
        });

        nav.appendChild(ul);
        document.body.appendChild(nav);

        // Create toggle button
        var toggle = document.createElement('button');
        toggle.className = 'floating-toc-toggle';
        toggle.setAttribute('aria-label', 'Toggle table of contents');
        toggle.setAttribute('aria-expanded', 'false');

        var hamburger = 'M3 6h18M3 12h18M3 18h18';
        var close = 'M6 6l12 12M6 18L18 6';

        function setToggleIcon(pathData) {
            while (toggle.firstChild) toggle.removeChild(toggle.firstChild);
            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('stroke', 'currentColor');
            svg.setAttribute('stroke-width', '2');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke-linecap', 'round');
            pathData.split('M').filter(Boolean).forEach(function (seg) {
                var line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                line.setAttribute('d', 'M' + seg);
                svg.appendChild(line);
            });
            toggle.appendChild(svg);
        }

        setToggleIcon(hamburger);
        document.body.appendChild(toggle);

        var isOpen = false;

        toggle.addEventListener('click', function () {
            isOpen = !isOpen;
            nav.classList.toggle('open', isOpen);
            toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            setToggleIcon(isOpen ? close : hamburger);
        });

        // Close on click outside
        document.addEventListener('click', function (e) {
            if (isOpen && !nav.contains(e.target) && !toggle.contains(e.target)) {
                isOpen = false;
                nav.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
                setToggleIcon(hamburger);
            }
        });

        // Close on link click (navigate, then close)
        nav.addEventListener('click', function (e) {
            if (e.target.tagName === 'A') {
                isOpen = false;
                nav.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
                setToggleIcon(hamburger);
            }
        });

        // Scroll highlight
        var ticking = false;

        function updateActive() {
            var scrollPos = window.scrollY + 120;
            var activeId = null;

            for (var i = links.length - 1; i >= 0; i--) {
                var target = document.getElementById(links[i].id);
                if (target && target.offsetTop <= scrollPos) {
                    activeId = links[i].id;
                    break;
                }
            }

            links.forEach(function (link) {
                link.el.classList.toggle('active', link.id === activeId);
            });
        }

        window.addEventListener('scroll', function () {
            if (!ticking) {
                requestAnimationFrame(function () {
                    updateActive();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        updateActive();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
