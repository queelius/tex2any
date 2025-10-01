// Sidenotes Component JavaScript
(function() {
    'use strict';

    function initSidenotes() {
        // Find all footnotes/notes in the document
        const notes = document.querySelectorAll('.ltx_note, .ltx_note_outer');

        if (notes.length === 0) {
            return; // No notes to convert
        }

        // Add body class
        document.body.classList.add('has-sidenotes');

        let noteCounter = 0;

        notes.forEach(function(note) {
            noteCounter++;

            // Find the note reference (usually a superscript link)
            const refLink = note.querySelector('a[href^="#"]');
            if (!refLink) return;

            // Get the note content
            const noteContent = note.querySelector('.ltx_note_content, .ltx_note_mark + *');
            if (!noteContent) return;

            // Create sidenote reference in text
            const sidenoteRef = document.createElement('span');
            sidenoteRef.className = 'tex2any-sidenote-ref';
            sidenoteRef.textContent = noteCounter;
            sidenoteRef.setAttribute('data-sidenote', noteCounter);
            sidenoteRef.setAttribute('role', 'button');
            sidenoteRef.setAttribute('aria-label', 'Toggle sidenote ' + noteCounter);
            sidenoteRef.setAttribute('tabindex', '0');

            // Create the sidenote element
            const sidenote = document.createElement('span');
            sidenote.className = 'tex2any-sidenote';
            sidenote.setAttribute('id', 'sidenote-' + noteCounter);
            sidenote.innerHTML =
                '<span class="tex2any-sidenote-number">' + noteCounter + '</span>' +
                noteContent.innerHTML;

            // Insert reference and sidenote
            const insertionPoint = findInsertionPoint(note);
            if (insertionPoint) {
                // Insert reference inline
                insertionPoint.parentNode.insertBefore(sidenoteRef, insertionPoint.nextSibling);

                // Insert sidenote as positioned element
                // Find the containing paragraph or section
                let container = insertionPoint.closest('p, .ltx_para, .ltx_theorem, .ltx_proof, section');
                if (!container) {
                    container = insertionPoint.parentElement;
                }

                if (container) {
                    // Make container position: relative for absolute positioning
                    const computedStyle = window.getComputedStyle(container);
                    if (computedStyle.position === 'static') {
                        container.style.position = 'relative';
                    }
                    container.appendChild(sidenote);
                }
            }

            // Add click handler for mobile
            sidenoteRef.addEventListener('click', function() {
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    sidenote.classList.toggle('collapsed');
                    sidenoteRef.classList.toggle('active');
                }
            });

            // Keyboard accessibility
            sidenoteRef.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    sidenoteRef.click();
                }
            });
        });

        // Position sidenotes to avoid overlap
        positionSidenotes();
        window.addEventListener('resize', debounce(positionSidenotes, 250));
    }

    function findInsertionPoint(note) {
        // Try to find the footnote marker in the text
        const noteId = note.id;
        if (noteId) {
            const ref = document.querySelector('a[href="#' + noteId + '"]');
            if (ref) {
                return ref;
            }
        }

        // Fallback: insert before the note element itself
        return note.previousElementSibling;
    }

    function positionSidenotes() {
        if (window.innerWidth <= 1280) {
            return; // Don't position on small screens
        }

        const sidenotes = document.querySelectorAll('.tex2any-sidenote');
        const positions = [];

        sidenotes.forEach(function(note, index) {
            const ref = document.querySelector('[data-sidenote="' + (index + 1) + '"]');
            if (!ref) return;

            // Get reference position
            const refRect = ref.getBoundingClientRect();
            const containerRect = note.parentElement.getBoundingClientRect();

            // Calculate ideal position
            let top = refRect.top - containerRect.top;

            // Avoid overlapping with previous sidenotes
            for (let i = 0; i < positions.length; i++) {
                const prevPos = positions[i];
                const prevBottom = prevPos.top + prevPos.height + 20; // 20px gap

                if (top < prevBottom) {
                    top = prevBottom;
                }
            }

            note.style.top = top + 'px';

            positions.push({
                top: top,
                height: note.offsetHeight
            });
        });
    }

    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidenotes);
    } else {
        initSidenotes();
    }
})();