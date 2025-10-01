// Hugo Front Matter Component JavaScript
// Extracts LaTeX metadata and generates YAML front matter
(function() {
    'use strict';

    function initHugoFrontMatter() {
        // Extract metadata from document
        const metadata = extractMetadata();

        if (!metadata.title) {
            console.log('tex2any: No title found, skipping Hugo front matter generation');
            return;
        }

        // Generate YAML front matter
        const yaml = generateYAML(metadata);

        // Inject as HTML comment at top of body
        injectFrontMatter(yaml);

        // Add copy button
        addCopyButton(yaml);
    }

    function extractMetadata() {
        const metadata = {
            title: '',
            date: '',
            authors: [],
            description: '',
            tags: [],
            keywords: [],
            draft: false
        };

        // Extract title
        const titleElement = document.querySelector('.ltx_title, h1.ltx_title, article h1, h1');
        if (titleElement) {
            metadata.title = titleElement.textContent.trim();
        }

        // Extract authors
        const authorElements = document.querySelectorAll('.ltx_author, .ltx_authors .ltx_author, .ltx_personname');
        if (authorElements.length > 0) {
            authorElements.forEach(function(author) {
                const authorName = author.textContent.trim();
                if (authorName && metadata.authors.indexOf(authorName) === -1) {
                    metadata.authors.push(authorName);
                }
            });
        }

        // Extract date
        const dateElement = document.querySelector('.ltx_date, .ltx_dates');
        if (dateElement) {
            metadata.date = dateElement.textContent.trim();
        } else {
            // Use current date if not found
            metadata.date = new Date().toISOString().split('T')[0];
        }

        // Extract abstract as description
        const abstractElement = document.querySelector('.ltx_abstract, .abstract');
        if (abstractElement) {
            const abstractText = abstractElement.textContent.trim();
            // Remove "Abstract" prefix if present
            metadata.description = abstractText.replace(/^Abstract:?\s*/i, '').substring(0, 200);
        }

        // Extract keywords
        const keywordsElement = document.querySelector('.ltx_keywords, .keywords');
        if (keywordsElement) {
            const keywordsText = keywordsElement.textContent.trim();
            metadata.keywords = keywordsText
                .replace(/^Keywords:?\s*/i, '')
                .split(/[,;]/)
                .map(function(k) { return k.trim(); })
                .filter(function(k) { return k.length > 0; });
        }

        // Extract tags from section headings (first-level only)
        const sections = document.querySelectorAll('h2, .ltx_section .ltx_title');
        const maxTags = 5;
        let tagCount = 0;
        sections.forEach(function(section) {
            if (tagCount >= maxTags) return;
            const text = section.textContent.trim();
            if (text && text.length < 30) { // Only short section names
                metadata.tags.push(text.toLowerCase().replace(/[^\w\s-]/g, ''));
                tagCount++;
            }
        });

        // Merge keywords into tags
        metadata.keywords.forEach(function(keyword) {
            if (metadata.tags.indexOf(keyword.toLowerCase()) === -1) {
                metadata.tags.push(keyword.toLowerCase());
            }
        });

        return metadata;
    }

    function generateYAML(metadata) {
        const lines = [];
        lines.push('---');

        // Title
        lines.push('title: "' + escapeYAML(metadata.title) + '"');

        // Date
        lines.push('date: ' + metadata.date);

        // Authors (as array)
        if (metadata.authors.length > 0) {
            lines.push('authors:');
            metadata.authors.forEach(function(author) {
                lines.push('  - "' + escapeYAML(author) + '"');
            });
        }

        // Description
        if (metadata.description) {
            lines.push('description: "' + escapeYAML(metadata.description) + '"');
        }

        // Tags
        if (metadata.tags.length > 0) {
            lines.push('tags:');
            metadata.tags.forEach(function(tag) {
                lines.push('  - "' + escapeYAML(tag) + '"');
            });
        }

        // Draft status
        lines.push('draft: false');

        // Additional Hugo-specific fields
        lines.push('type: "post"');
        lines.push('markup: "html"');

        lines.push('---');

        return lines.join('\n');
    }

    function escapeYAML(text) {
        return text.replace(/"/g, '\\"').replace(/\n/g, ' ');
    }

    function injectFrontMatter(yaml) {
        // Create HTML comment with front matter
        const comment = document.createComment('\n' + yaml + '\n');

        // Insert at very top of body
        const body = document.body;
        if (body.firstChild) {
            body.insertBefore(comment, body.firstChild);
        } else {
            body.appendChild(comment);
        }

        // Store in localStorage for copy functionality
        try {
            localStorage.setItem('tex2any-hugo-frontmatter', yaml);
        } catch (e) {
            console.warn('tex2any: Could not save front matter to localStorage', e);
        }
    }

    function addCopyButton(yaml) {
        // Create copy button
        const button = document.createElement('button');
        button.className = 'tex2any-copy-frontmatter-btn';
        button.setAttribute('aria-label', 'Copy Hugo front matter to clipboard');
        button.setAttribute('title', 'Copy Hugo front matter');

        // Hugo icon
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z');
        icon.appendChild(path);

        const text = document.createElement('span');
        text.textContent = 'Copy Front Matter';

        button.appendChild(icon);
        button.appendChild(text);

        // Click handler
        button.addEventListener('click', function() {
            copyToClipboard(yaml, button);
        });

        // Add to document
        document.body.appendChild(button);
    }

    function copyToClipboard(text, button) {
        // Try modern clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                showCopySuccess(button);
            }).catch(function(err) {
                console.error('tex2any: Could not copy front matter', err);
                fallbackCopy(text, button);
            });
        } else {
            fallbackCopy(text, button);
        }
    }

    function fallbackCopy(text, button) {
        // Fallback for older browsers
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
            console.error('tex2any: Could not copy front matter', err);
        }

        document.body.removeChild(textarea);
    }

    function showCopySuccess(button) {
        const originalText = button.querySelector('span').textContent;
        button.querySelector('span').textContent = 'Copied!';
        button.style.background = 'rgba(76, 175, 80, 0.95)';

        setTimeout(function() {
            button.querySelector('span').textContent = originalText;
            button.style.background = '';
        }, 2000);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHugoFrontMatter);
    } else {
        initHugoFrontMatter();
    }
})();
