// Citation Generator Component JavaScript
(function() {
    'use strict';

    function initCitationGenerator() {
        // Extract document metadata
        const metadata = extractMetadata();

        if (!metadata.title) {
            // No title found, don't show citation button
            return;
        }

        // Create citation button
        const container = document.createElement('div');
        container.className = 'tex2any-citation-container';

        const button = document.createElement('button');
        button.className = 'tex2any-citation-button';
        button.setAttribute('aria-label', 'Generate citation');
        button.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
            </svg>
        `;

        container.appendChild(button);
        document.body.appendChild(container);

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'tex2any-citation-overlay';
        document.body.appendChild(overlay);

        // Create modal
        const modal = createModal(metadata);
        document.body.appendChild(modal);

        // Event listeners
        button.addEventListener('click', function() {
            openModal();
        });

        overlay.addEventListener('click', function() {
            closeModal();
        });

        // Close button in modal
        const closeButton = modal.querySelector('.tex2any-citation-close');
        closeButton.addEventListener('click', function() {
            closeModal();
        });

        // Escape key to close
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('open')) {
                closeModal();
            }
        });

        function openModal() {
            overlay.classList.add('open');
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';

            // Focus first tab
            const firstTab = modal.querySelector('.tex2any-citation-tab');
            if (firstTab) {
                firstTab.focus();
            }
        }

        function closeModal() {
            overlay.classList.remove('open');
            modal.classList.remove('open');
            document.body.style.overflow = '';
            button.focus();
        }
    }

    function extractMetadata() {
        const metadata = {
            title: null,
            authors: [],
            year: null,
            url: window.location.href,
            accessDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        };

        // Extract title
        metadata.title = document.title ||
                        getMetaContent('og:title') ||
                        getMetaContent('citation_title') ||
                        document.querySelector('h1.ltx_title')?.textContent ||
                        document.querySelector('.ltx_title')?.textContent;

        // Extract authors
        const authorMeta = getMetaContent('citation_author') ||
                          getMetaContent('author');
        if (authorMeta) {
            metadata.authors = [authorMeta];
        } else {
            // Try to extract from LaTeXML author elements
            const authorElements = document.querySelectorAll('.ltx_author, .ltx_personname');
            metadata.authors = Array.from(authorElements).map(function(el) {
                return el.textContent.trim();
            });
        }

        // Extract year
        const dateMeta = getMetaContent('citation_publication_date') ||
                        getMetaContent('date') ||
                        getMetaContent('og:published_time');
        if (dateMeta) {
            const yearMatch = dateMeta.match(/\d{4}/);
            metadata.year = yearMatch ? yearMatch[0] : new Date().getFullYear();
        } else {
            // Try to extract from date element
            const dateElement = document.querySelector('.ltx_date');
            if (dateElement) {
                const yearMatch = dateElement.textContent.match(/\d{4}/);
                metadata.year = yearMatch ? yearMatch[0] : new Date().getFullYear();
            } else {
                metadata.year = new Date().getFullYear();
            }
        }

        return metadata;
    }

    function getMetaContent(name) {
        const meta = document.querySelector('meta[name="' + name + '"], meta[property="' + name + '"]');
        return meta ? meta.getAttribute('content') : null;
    }

    function createModal(metadata) {
        const modal = document.createElement('div');
        modal.className = 'tex2any-citation-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'citation-title');

        // Generate citations
        const citations = {
            bibtex: generateBibTeX(metadata),
            apa: generateAPA(metadata),
            mla: generateMLA(metadata),
            chicago: generateChicago(metadata)
        };

        modal.innerHTML = `
            <div class="tex2any-citation-header">
                <h3 id="citation-title">Cite This Document</h3>
                <button class="tex2any-citation-close" aria-label="Close">&times;</button>
            </div>
            <div class="tex2any-citation-tabs">
                <button class="tex2any-citation-tab active" data-format="bibtex">BibTeX</button>
                <button class="tex2any-citation-tab" data-format="apa">APA</button>
                <button class="tex2any-citation-tab" data-format="mla">MLA</button>
                <button class="tex2any-citation-tab" data-format="chicago">Chicago</button>
            </div>
            <div class="tex2any-citation-content active" data-format="bibtex">
                <div class="tex2any-citation-text">${escapeHtml(citations.bibtex)}</div>
                <button class="tex2any-citation-copy" data-format="bibtex">
                    <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    <span>Copy BibTeX</span>
                </button>
            </div>
            <div class="tex2any-citation-content" data-format="apa">
                <div class="tex2any-citation-text">${escapeHtml(citations.apa)}</div>
                <button class="tex2any-citation-copy" data-format="apa">
                    <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    <span>Copy APA</span>
                </button>
            </div>
            <div class="tex2any-citation-content" data-format="mla">
                <div class="tex2any-citation-text">${escapeHtml(citations.mla)}</div>
                <button class="tex2any-citation-copy" data-format="mla">
                    <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    <span>Copy MLA</span>
                </button>
            </div>
            <div class="tex2any-citation-content" data-format="chicago">
                <div class="tex2any-citation-text">${escapeHtml(citations.chicago)}</div>
                <button class="tex2any-citation-copy" data-format="chicago">
                    <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    <span>Copy Chicago</span>
                </button>
            </div>
        `;

        // Setup tab switching
        const tabs = modal.querySelectorAll('.tex2any-citation-tab');
        const contents = modal.querySelectorAll('.tex2any-citation-content');

        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                const format = tab.getAttribute('data-format');

                // Update tabs
                tabs.forEach(function(t) { t.classList.remove('active'); });
                tab.classList.add('active');

                // Update content
                contents.forEach(function(c) { c.classList.remove('active'); });
                const targetContent = modal.querySelector('.tex2any-citation-content[data-format="' + format + '"]');
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });

        // Setup copy buttons
        const copyButtons = modal.querySelectorAll('.tex2any-citation-copy');
        copyButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                const format = button.getAttribute('data-format');
                const citation = citations[format];
                copyCitation(citation, button);
            });
        });

        return modal;
    }

    function generateBibTeX(metadata) {
        const authors = metadata.authors.length > 0
            ? metadata.authors.join(' and ')
            : 'Anonymous';

        const citeKey = generateCiteKey(metadata);

        return `@misc{${citeKey},
  author = {${authors}},
  title = {${metadata.title}},
  year = {${metadata.year}},
  url = {${metadata.url}},
  note = {Accessed: ${metadata.accessDate}}
}`;
    }

    function generateAPA(metadata) {
        let citation = '';

        if (metadata.authors.length > 0) {
            citation += formatAuthorsAPA(metadata.authors) + ' ';
        }

        citation += `(${metadata.year}). `;
        citation += `${metadata.title}. `;
        citation += `Retrieved from ${metadata.url}`;

        return citation;
    }

    function generateMLA(metadata) {
        let citation = '';

        if (metadata.authors.length > 0) {
            citation += formatAuthorsMLA(metadata.authors) + ' ';
        }

        citation += `"${metadata.title}." `;
        citation += `Web. ${metadata.accessDate}. `;
        citation += `<${metadata.url}>`;

        return citation;
    }

    function generateChicago(metadata) {
        let citation = '';

        if (metadata.authors.length > 0) {
            citation += formatAuthorsChicago(metadata.authors) + ' ';
        }

        citation += `"${metadata.title}." `;
        citation += `Accessed ${metadata.accessDate}. `;
        citation += `${metadata.url}.`;

        return citation;
    }

    function formatAuthorsAPA(authors) {
        if (authors.length === 0) return 'Anonymous';
        if (authors.length === 1) return formatAuthorAPA(authors[0]);
        if (authors.length === 2) return formatAuthorAPA(authors[0]) + ', & ' + formatAuthorAPA(authors[1]);

        return authors.slice(0, -1).map(formatAuthorAPA).join(', ') + ', & ' + formatAuthorAPA(authors[authors.length - 1]);
    }

    function formatAuthorAPA(author) {
        const parts = author.trim().split(/\s+/);
        if (parts.length === 1) return parts[0];

        const lastName = parts[parts.length - 1];
        const initials = parts.slice(0, -1).map(function(p) { return p.charAt(0) + '.'; }).join(' ');
        return lastName + ', ' + initials;
    }

    function formatAuthorsMLA(authors) {
        if (authors.length === 0) return 'Anonymous';
        if (authors.length === 1) return formatAuthorMLA(authors[0]);

        return formatAuthorMLA(authors[0]) + ', et al.';
    }

    function formatAuthorMLA(author) {
        const parts = author.trim().split(/\s+/);
        if (parts.length === 1) return parts[0];

        const lastName = parts[parts.length - 1];
        const firstName = parts.slice(0, -1).join(' ');
        return lastName + ', ' + firstName;
    }

    function formatAuthorsChicago(authors) {
        if (authors.length === 0) return 'Anonymous';
        return authors.join(', ');
    }

    function generateCiteKey(metadata) {
        let key = '';

        if (metadata.authors.length > 0) {
            const firstAuthor = metadata.authors[0].trim().split(/\s+/);
            key = firstAuthor[firstAuthor.length - 1].toLowerCase();
        } else {
            key = 'anonymous';
        }

        key += metadata.year;

        // Remove special characters
        key = key.replace(/[^a-z0-9]/g, '');

        return key;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function copyCitation(citation, button) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(citation)
                .then(function() {
                    showCopySuccess(button);
                })
                .catch(function() {
                    fallbackCopy(citation, button);
                });
        } else {
            fallbackCopy(citation, button);
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
            console.error('Failed to copy citation:', err);
        }

        document.body.removeChild(textarea);
    }

    function showCopySuccess(button) {
        const originalHTML = button.innerHTML;
        const originalClass = button.className;

        button.classList.add('copied');
        button.innerHTML = `
            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span>Copied!</span>
        `;

        setTimeout(function() {
            button.className = originalClass;
            button.innerHTML = originalHTML;
        }, 2000);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCitationGenerator);
    } else {
        initCitationGenerator();
    }
})();