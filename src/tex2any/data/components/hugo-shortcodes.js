// Hugo Shortcodes Component JavaScript
// Wraps LaTeX elements in Hugo shortcode data attributes
(function() {
    'use strict';

    function initHugoShortcodes() {
        // Process different element types
        processEquations();
        processCodeBlocks();
        processFigures();
        processTables();

        // Store shortcode count
        const count = countShortcodes();
        if (count > 0) {
            console.log('tex2any: Generated ' + count + ' Hugo shortcodes');
        }
    }

    function processEquations() {
        // Find equation elements
        const equations = document.querySelectorAll('.ltx_equation, .ltx_equationgroup, .ltx_Math');

        equations.forEach(function(eq, index) {
            // Skip if already processed
            if (eq.hasAttribute('data-hugo-shortcode')) return;

            // Generate shortcode
            const shortcode = 'equation';
            const id = eq.id || 'eq-' + (index + 1);

            // Add data attributes
            eq.setAttribute('data-hugo-shortcode', shortcode);
            eq.setAttribute('data-hugo-shortcode-id', id);
            eq.classList.add('tex2any-hugo-shortcode', 'tex2any-hugo-equation');

            // Extract equation content for parameters
            const mathml = eq.querySelector('math, .ltx_Math');
            if (mathml) {
                eq.setAttribute('data-hugo-shortcode-params', JSON.stringify({
                    id: id,
                    display: eq.classList.contains('ltx_equation') ? 'block' : 'inline'
                }));
            }

            // Add copy button
            addCopyButton(eq, shortcode, id);
        });
    }

    function processCodeBlocks() {
        // Find code elements
        const codeBlocks = document.querySelectorAll('.ltx_listing, .ltx_verbatim, pre code, pre');

        codeBlocks.forEach(function(code, index) {
            // Skip if already processed or if parent is already processed
            if (code.hasAttribute('data-hugo-shortcode')) return;
            if (code.parentElement && code.parentElement.hasAttribute('data-hugo-shortcode')) return;

            // Get the actual code element
            const codeElement = code.tagName === 'PRE' ? code.querySelector('code') || code : code;

            // Generate shortcode
            const shortcode = 'code';
            const id = code.id || 'code-' + (index + 1);

            // Detect language from class names
            let language = '';
            const classes = (codeElement.className || '').split(' ');
            classes.forEach(function(cls) {
                if (cls.startsWith('language-') || cls.startsWith('lang-')) {
                    language = cls.replace(/^(language-|lang-)/, '');
                }
            });

            // Add data attributes
            const target = code.tagName === 'PRE' ? code : code.parentElement;
            if (!target.hasAttribute('data-hugo-shortcode')) {
                target.setAttribute('data-hugo-shortcode', shortcode);
                target.setAttribute('data-hugo-shortcode-id', id);
                target.classList.add('tex2any-hugo-shortcode', 'tex2any-hugo-code');

                target.setAttribute('data-hugo-shortcode-params', JSON.stringify({
                    id: id,
                    language: language || 'text',
                    linenos: false
                }));

                // Add copy button
                addCopyButton(target, shortcode, id);
            }
        });
    }

    function processFigures() {
        // Find figure elements
        const figures = document.querySelectorAll('.ltx_figure, figure');

        figures.forEach(function(fig, index) {
            // Skip if already processed
            if (fig.hasAttribute('data-hugo-shortcode')) return;

            // Generate shortcode
            const shortcode = 'figure';
            const id = fig.id || 'fig-' + (index + 1);

            // Extract figure information
            const img = fig.querySelector('img');
            const caption = fig.querySelector('figcaption, .ltx_caption');

            const params = {
                id: id,
                src: img ? img.getAttribute('src') : '',
                alt: img ? img.getAttribute('alt') || '' : '',
                caption: caption ? caption.textContent.trim() : ''
            };

            // Add data attributes
            fig.setAttribute('data-hugo-shortcode', shortcode);
            fig.setAttribute('data-hugo-shortcode-id', id);
            fig.classList.add('tex2any-hugo-shortcode', 'tex2any-hugo-figure');
            fig.setAttribute('data-hugo-shortcode-params', JSON.stringify(params));

            // Add copy button
            addCopyButton(fig, shortcode, id);
        });
    }

    function processTables() {
        // Find table elements
        const tables = document.querySelectorAll('.ltx_table, table');

        tables.forEach(function(table, index) {
            // Skip if already processed
            if (table.hasAttribute('data-hugo-shortcode')) return;

            // If table is inside .ltx_table, process the wrapper
            let target = table;
            if (table.tagName === 'TABLE' && table.parentElement && table.parentElement.classList.contains('ltx_table')) {
                target = table.parentElement;
                if (target.hasAttribute('data-hugo-shortcode')) return;
            }

            // Generate shortcode
            const shortcode = 'table';
            const id = target.id || 'table-' + (index + 1);

            // Extract table information
            const caption = target.querySelector('caption, .ltx_caption');

            const params = {
                id: id,
                caption: caption ? caption.textContent.trim() : ''
            };

            // Add data attributes
            target.setAttribute('data-hugo-shortcode', shortcode);
            target.setAttribute('data-hugo-shortcode-id', id);
            target.classList.add('tex2any-hugo-shortcode', 'tex2any-hugo-table');
            target.setAttribute('data-hugo-shortcode-params', JSON.stringify(params));

            // Add copy button
            addCopyButton(target, shortcode, id);
        });
    }

    function addCopyButton(element, shortcode, id) {
        const button = document.createElement('button');
        button.className = 'tex2any-copy-shortcode';
        button.textContent = 'Copy Shortcode';
        button.setAttribute('aria-label', 'Copy Hugo shortcode syntax');
        button.setAttribute('title', 'Copy Hugo shortcode');

        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const syntax = generateShortcodeSyntax(shortcode, element);
            copyToClipboard(syntax, button);
        });

        element.style.position = 'relative';
        element.appendChild(button);
    }

    function generateShortcodeSyntax(shortcode, element) {
        const params = element.getAttribute('data-hugo-shortcode-params');
        const paramsObj = params ? JSON.parse(params) : {};

        let syntax = '{{< ' + shortcode;

        // Add parameters
        Object.keys(paramsObj).forEach(function(key) {
            const value = paramsObj[key];
            if (value && key !== 'id') { // Skip ID, it's implicit
                if (typeof value === 'string' && value.length > 0) {
                    syntax += ' ' + key + '="' + value.replace(/"/g, '\\"') + '"';
                } else if (typeof value === 'boolean') {
                    syntax += ' ' + key + '=' + value;
                }
            }
        });

        syntax += ' >}}';

        // For block shortcodes, add closing tag
        if (shortcode === 'code' || shortcode === 'equation') {
            syntax += '\n...\n{{< /' + shortcode + ' >}}';
        }

        return syntax;
    }

    function copyToClipboard(text, button) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                showCopySuccess(button);
            }).catch(function() {
                fallbackCopy(text, button);
            });
        } else {
            fallbackCopy(text, button);
        }
    }

    function fallbackCopy(text, button) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand('copy');
            showCopySuccess(button);
        } catch (err) {
            console.error('tex2any: Could not copy shortcode', err);
        }

        document.body.removeChild(textarea);
    }

    function showCopySuccess(button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = 'rgba(76, 175, 80, 0.95)';
        button.style.color = 'white';

        setTimeout(function() {
            button.textContent = originalText;
            button.style.background = '';
            button.style.color = '';
        }, 2000);
    }

    function countShortcodes() {
        return document.querySelectorAll('[data-hugo-shortcode]').length;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHugoShortcodes);
    } else {
        initHugoShortcodes();
    }
})();
