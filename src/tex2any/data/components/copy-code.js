// Copy Code Component JavaScript
(function() {
    'use strict';

    function initCopyCode() {
        // Find all code blocks (LaTeXML uses various classes)
        const codeBlocks = document.querySelectorAll(
            'pre, .ltx_verbatim, .ltx_listing, .ltx_lstlisting'
        );

        if (codeBlocks.length === 0) {
            return; // No code blocks found
        }

        // SVG icons
        const copyIcon = '<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
        const checkIcon = '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';

        codeBlocks.forEach(function(codeBlock, index) {
            // Skip if already wrapped
            if (codeBlock.parentElement.classList.contains('tex2any-code-wrapper')) {
                return;
            }

            // Create wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'tex2any-code-wrapper';
            codeBlock.parentNode.insertBefore(wrapper, codeBlock);
            wrapper.appendChild(codeBlock);

            // Detect language (if specified)
            const language = detectLanguage(codeBlock);
            if (language) {
                const langLabel = document.createElement('div');
                langLabel.className = 'tex2any-code-language';
                langLabel.textContent = language;
                wrapper.appendChild(langLabel);
            }

            // Create copy button
            const button = document.createElement('button');
            button.className = 'tex2any-copy-button';
            button.setAttribute('aria-label', 'Copy code to clipboard');
            button.setAttribute('data-tooltip', 'Copy');
            button.innerHTML = copyIcon + '<span>Copy</span>';

            // Add click handler
            button.addEventListener('click', function() {
                copyCodeToClipboard(codeBlock, button, copyIcon, checkIcon);
            });

            // Keyboard accessibility
            button.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    button.click();
                }
            });

            wrapper.appendChild(button);
        });
    }

    function detectLanguage(codeBlock) {
        // Try to detect language from class names
        const classNames = codeBlock.className;

        // Common language class patterns
        const patterns = [
            /language-(\w+)/,
            /lang-(\w+)/,
            /\blang:(\w+)/,
            /ltx_listing_language_(\w+)/
        ];

        for (const pattern of patterns) {
            const match = classNames.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        // Check data attributes
        if (codeBlock.hasAttribute('data-language')) {
            return codeBlock.getAttribute('data-language');
        }

        // Try to detect from parent
        const parent = codeBlock.parentElement;
        if (parent && parent.classList.contains('ltx_listing')) {
            const caption = parent.querySelector('.ltx_caption');
            if (caption) {
                const captionText = caption.textContent.toLowerCase();
                // Common language keywords in captions
                const languages = ['python', 'javascript', 'java', 'c++', 'c', 'ruby', 'go', 'rust', 'php', 'typescript', 'html', 'css', 'bash', 'shell', 'latex', 'tex'];
                for (const lang of languages) {
                    if (captionText.includes(lang)) {
                        return lang;
                    }
                }
            }
        }

        return null; // No language detected
    }

    function copyCodeToClipboard(codeBlock, button, copyIcon, checkIcon) {
        // Get code text
        let codeText = getCodeText(codeBlock);

        // Clean up code text
        codeText = codeText.trim();

        // Try to copy to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(codeText)
                .then(function() {
                    showCopySuccess(button, copyIcon, checkIcon);
                })
                .catch(function(err) {
                    console.error('Failed to copy code:', err);
                    fallbackCopy(codeText, button, copyIcon, checkIcon);
                });
        } else {
            fallbackCopy(codeText, button, copyIcon, checkIcon);
        }
    }

    function getCodeText(codeBlock) {
        // Try to get text content, preserving line breaks
        let text = '';

        // Check if it's a pre element with code inside
        if (codeBlock.tagName === 'PRE') {
            const codeElement = codeBlock.querySelector('code');
            text = codeElement ? codeElement.textContent : codeBlock.textContent;
        } else {
            text = codeBlock.textContent;
        }

        return text;
    }

    function fallbackCopy(text, button, copyIcon, checkIcon) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            const success = document.execCommand('copy');
            if (success) {
                showCopySuccess(button, copyIcon, checkIcon);
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }

        document.body.removeChild(textarea);
    }

    function showCopySuccess(button, copyIcon, checkIcon) {
        // Update button appearance
        button.classList.add('copied');
        button.innerHTML = checkIcon + '<span>Copied!</span>';
        button.setAttribute('data-tooltip', 'Copied!');

        // Reset after 2 seconds
        setTimeout(function() {
            button.classList.remove('copied');
            button.innerHTML = copyIcon + '<span>Copy</span>';
            button.setAttribute('data-tooltip', 'Copy');
        }, 2000);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCopyCode);
    } else {
        initCopyCode();
    }
})();