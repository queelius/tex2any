// Annotations Component JavaScript
// Personal highlights and notes with localStorage
(function() {
    'use strict';

    const STORAGE_KEY = 'tex2any-annotations';
    let annotations = {};
    let currentColor = 'yellow';
    let selectedParagraph = null;

    function initAnnotations() {
        // Load annotations from localStorage
        loadAnnotations();

        // Make paragraphs highlightable
        makeHighlightable();

        // Apply existing highlights
        applyHighlights();

        // Add annotations button
        addAnnotationsButton();

        // Add keyboard shortcuts
        addKeyboardShortcuts();
    }

    function loadAnnotations() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                annotations = JSON.parse(saved);
            }
        } catch (e) {
            console.error('tex2any: Could not load annotations', e);
            annotations = {};
        }
    }

    function saveAnnotations() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations));
        } catch (e) {
            console.error('tex2any: Could not save annotations', e);
        }
    }

    function makeHighlightable() {
        // Find all paragraphs and highlightable elements
        const elements = document.querySelectorAll('p, .ltx_p, .ltx_para, li, blockquote');

        elements.forEach(function(elem, index) {
            // Generate unique ID if not present
            if (!elem.id) {
                elem.id = 'tex2any-p-' + index;
            }

            // Add click handler
            elem.addEventListener('click', function(e) {
                // Only handle if clicking directly on paragraph, not child elements
                if (e.target === elem || e.target.tagName === 'SPAN') {
                    handleParagraphClick(elem, e);
                }
            });

            // Add context menu handler for notes
            elem.addEventListener('contextmenu', function(e) {
                if (annotations[elem.id] && annotations[elem.id].highlighted) {
                    e.preventDefault();
                    showNoteDialog(elem);
                }
            });
        });
    }

    function handleParagraphClick(elem, e) {
        const id = elem.id;

        // Toggle highlight
        if (annotations[id] && annotations[id].highlighted) {
            // Already highlighted - show color picker to change or remove
            showColorPicker(elem, e);
        } else {
            // Not highlighted - highlight with current color
            annotations[id] = {
                highlighted: true,
                color: currentColor,
                text: elem.textContent.trim().substring(0, 200),
                note: '',
                timestamp: Date.now()
            };
            saveAnnotations();
            applyHighlight(elem, currentColor);
        }
    }

    function showColorPicker(elem, e) {
        // Remove existing picker
        const existingPicker = document.querySelector('.tex2any-color-picker');
        if (existingPicker) {
            existingPicker.remove();
        }

        const picker = document.createElement('div');
        picker.className = 'tex2any-color-picker show';
        picker.style.left = e.pageX + 'px';
        picker.style.top = e.pageY + 'px';

        const colors = ['yellow', 'green', 'pink', 'blue'];
        colors.forEach(function(color) {
            const option = document.createElement('div');
            option.className = 'tex2any-color-option ' + color;
            option.setAttribute('title', 'Highlight ' + color);
            option.addEventListener('click', function() {
                changeHighlightColor(elem, color);
                picker.remove();
            });
            picker.appendChild(option);
        });

        // Add remove option
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '✕';
        removeBtn.className = 'tex2any-annotation-btn delete';
        removeBtn.style.padding = '0.25rem 0.5rem';
        removeBtn.setAttribute('title', 'Remove highlight');
        removeBtn.addEventListener('click', function() {
            removeHighlight(elem);
            picker.remove();
        });
        picker.appendChild(removeBtn);

        document.body.appendChild(picker);

        // Close on outside click
        setTimeout(function() {
            document.addEventListener('click', function closePickerHandler(e) {
                if (!picker.contains(e.target)) {
                    picker.remove();
                    document.removeEventListener('click', closePickerHandler);
                }
            });
        }, 10);
    }

    function changeHighlightColor(elem, color) {
        const id = elem.id;
        if (annotations[id]) {
            annotations[id].color = color;
            annotations[id].timestamp = Date.now();
            saveAnnotations();
            applyHighlight(elem, color);
        }
    }

    function removeHighlight(elem) {
        const id = elem.id;
        delete annotations[id];
        saveAnnotations();

        // Remove highlight classes
        elem.classList.remove('tex2any-highlight', 'tex2any-highlight-yellow',
            'tex2any-highlight-green', 'tex2any-highlight-pink', 'tex2any-highlight-blue');

        // Remove note indicator
        const indicator = elem.querySelector('.tex2any-note-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    function applyHighlights() {
        Object.keys(annotations).forEach(function(id) {
            const elem = document.getElementById(id);
            if (elem && annotations[id].highlighted) {
                applyHighlight(elem, annotations[id].color);

                // Add note indicator if note exists
                if (annotations[id].note) {
                    addNoteIndicator(elem);
                }
            }
        });
    }

    function applyHighlight(elem, color) {
        elem.classList.remove('tex2any-highlight-yellow', 'tex2any-highlight-green',
            'tex2any-highlight-pink', 'tex2any-highlight-blue');
        elem.classList.add('tex2any-highlight', 'tex2any-highlight-' + color);
    }

    function showNoteDialog(elem) {
        const id = elem.id;
        const annotation = annotations[id];
        if (!annotation) return;

        const note = prompt('Add note to this highlight:', annotation.note || '');
        if (note !== null) {
            annotation.note = note;
            annotation.timestamp = Date.now();
            saveAnnotations();

            // Add or update note indicator
            if (note) {
                addNoteIndicator(elem);
            } else {
                const indicator = elem.querySelector('.tex2any-note-indicator');
                if (indicator) {
                    indicator.remove();
                }
            }
        }
    }

    function addNoteIndicator(elem) {
        // Remove existing indicator
        let indicator = elem.querySelector('.tex2any-note-indicator');
        if (indicator) {
            indicator.remove();
        }

        indicator = document.createElement('span');
        indicator.className = 'tex2any-note-indicator';
        indicator.textContent = '📝';
        indicator.setAttribute('title', 'Click to view/edit note');
        indicator.addEventListener('click', function(e) {
            e.stopPropagation();
            showNoteDialog(elem);
        });

        elem.appendChild(indicator);
    }

    function addAnnotationsButton() {
        const button = document.createElement('button');
        button.className = 'tex2any-annotations-btn';
        button.setAttribute('aria-label', 'View annotations');

        // Icon
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M17.75 7L14 3.25l-10 10V17h3.75l10-10zm2.96-2.96c.39-.39.39-1.02 0-1.41L18.37.29c-.39-.39-1.02-.39-1.41 0L15 2.25 18.75 6l1.96-1.96z');
        icon.appendChild(path);

        const text = document.createElement('span');
        text.textContent = 'Annotations';

        const count = document.createElement('span');
        count.className = 'count';
        count.textContent = Object.keys(annotations).length;

        button.appendChild(icon);
        button.appendChild(text);
        button.appendChild(count);

        button.addEventListener('click', function() {
            showAnnotationsPanel();
        });

        document.body.appendChild(button);
    }

    function showAnnotationsPanel() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'tex2any-annotations-overlay show';

        // Create panel
        const panel = document.createElement('div');
        panel.className = 'tex2any-annotations-panel show';

        // Header
        const header = document.createElement('div');
        header.className = 'tex2any-annotations-panel-header';

        const title = document.createElement('h3');
        title.textContent = 'Annotations (' + Object.keys(annotations).length + ')';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'tex2any-annotations-panel-close';
        closeBtn.textContent = '×';
        closeBtn.setAttribute('aria-label', 'Close annotations panel');

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Body
        const body = document.createElement('div');
        body.className = 'tex2any-annotations-panel-body';

        // Render annotations
        const sortedAnnotations = Object.keys(annotations).sort(function(a, b) {
            return annotations[b].timestamp - annotations[a].timestamp;
        });

        if (sortedAnnotations.length === 0) {
            body.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No annotations yet. Click any paragraph to highlight it.</p>';
        } else {
            sortedAnnotations.forEach(function(id) {
                const annotation = annotations[id];
                const item = createAnnotationItem(id, annotation);
                body.appendChild(item);
            });
        }

        // Footer
        const footer = document.createElement('div');
        footer.className = 'tex2any-annotations-panel-footer';

        const exportBtn = document.createElement('button');
        exportBtn.className = 'tex2any-annotations-export';
        exportBtn.textContent = 'Export JSON';
        exportBtn.addEventListener('click', exportAnnotations);

        const importBtn = document.createElement('button');
        importBtn.className = 'tex2any-annotations-import';
        importBtn.textContent = 'Import JSON';
        importBtn.addEventListener('click', importAnnotations);

        const clearBtn = document.createElement('button');
        clearBtn.className = 'tex2any-annotations-clear';
        clearBtn.textContent = 'Clear All';
        clearBtn.addEventListener('click', function() {
            if (confirm('Delete all annotations? This cannot be undone.')) {
                clearAllAnnotations();
                hidePanel();
            }
        });

        footer.appendChild(exportBtn);
        footer.appendChild(importBtn);
        footer.appendChild(clearBtn);

        // Assemble panel
        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);

        document.body.appendChild(overlay);
        document.body.appendChild(panel);

        // Close handlers
        function hidePanel() {
            panel.remove();
            overlay.remove();
        }

        closeBtn.addEventListener('click', hidePanel);
        overlay.addEventListener('click', hidePanel);

        // Escape key
        function handleEscape(e) {
            if (e.key === 'Escape') {
                hidePanel();
                document.removeEventListener('keydown', handleEscape);
            }
        }
        document.addEventListener('keydown', handleEscape);
    }

    function createAnnotationItem(id, annotation) {
        const item = document.createElement('div');
        item.className = 'tex2any-annotation-item';
        item.style.borderLeftColor = getColorHex(annotation.color);

        const text = document.createElement('div');
        text.className = 'tex2any-annotation-text';
        text.textContent = '"' + annotation.text + '"';

        item.appendChild(text);

        if (annotation.note) {
            const note = document.createElement('div');
            note.className = 'tex2any-annotation-note';
            note.textContent = annotation.note;
            item.appendChild(note);
        }

        const actions = document.createElement('div');
        actions.className = 'tex2any-annotation-actions';

        const jumpBtn = document.createElement('button');
        jumpBtn.className = 'tex2any-annotation-btn';
        jumpBtn.textContent = 'Jump to';
        jumpBtn.addEventListener('click', function() {
            const elem = document.getElementById(id);
            if (elem) {
                elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Flash effect
                elem.style.transition = 'opacity 0.3s';
                elem.style.opacity = '0.5';
                setTimeout(function() {
                    elem.style.opacity = '1';
                }, 300);
            }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'tex2any-annotation-btn delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', function() {
            const elem = document.getElementById(id);
            if (elem) {
                removeHighlight(elem);
            }
            item.remove();
        });

        actions.appendChild(jumpBtn);
        actions.appendChild(deleteBtn);
        item.appendChild(actions);

        return item;
    }

    function getColorHex(color) {
        const colors = {
            yellow: '#ffeb3b',
            green: '#4caf50',
            pink: '#e91e63',
            blue: '#2196f3'
        };
        return colors[color] || '#0066cc';
    }

    function exportAnnotations() {
        const json = JSON.stringify(annotations, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'annotations-' + Date.now() + '.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    function importAnnotations() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    try {
                        const imported = JSON.parse(event.target.result);
                        annotations = imported;
                        saveAnnotations();
                        alert('Annotations imported successfully!');
                        location.reload();
                    } catch (err) {
                        alert('Error importing annotations: ' + err.message);
                    }
                };
                reader.readAsText(file);
            }
        });
        input.click();
    }

    function clearAllAnnotations() {
        // Remove all highlights
        Object.keys(annotations).forEach(function(id) {
            const elem = document.getElementById(id);
            if (elem) {
                removeHighlight(elem);
            }
        });
        annotations = {};
        saveAnnotations();
    }

    function addKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + Shift + H - Toggle highlights visibility
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
                e.preventDefault();
                toggleHighlightsVisibility();
            }
        });
    }

    function toggleHighlightsVisibility() {
        const highlights = document.querySelectorAll('.tex2any-highlight');
        highlights.forEach(function(elem) {
            elem.style.opacity = elem.style.opacity === '0' ? '' : '0';
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnnotations);
    } else {
        initAnnotations();
    }
})();
