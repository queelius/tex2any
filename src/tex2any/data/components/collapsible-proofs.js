// Collapsible Proofs Component JavaScript
// Toggle visibility of theorem proofs and derivations
(function() {
    'use strict';

    const STORAGE_KEY = 'tex2any-proofs-collapsed';
    let proofStates = {};
    let allProofs = [];
    const COLLAPSE_BY_DEFAULT = true; // Configurable

    function initCollapsibleProofs() {
        // Find all proof elements
        findProofs();

        if (allProofs.length === 0) {
            console.log('tex2any: No proofs found');
            return;
        }

        // Load saved states
        loadProofStates();

        // Add toggle buttons to each proof
        allProofs.forEach(function(proof) {
            addToggleButton(proof);
        });

        // Apply saved or default states
        applyProofStates();

        // Add toolbar
        addToolbar();

        // Add keyboard shortcuts
        addKeyboardShortcuts();

        // Show hint on first visit
        showHintOnFirstVisit();
    }

    function findProofs() {
        // Find LaTeX proof environments
        const ltxProofs = document.querySelectorAll('.ltx_proof');

        // Also look for generic proof classes
        const genericProofs = document.querySelectorAll('.proof');

        // Combine and deduplicate
        const proofsSet = new Set();

        ltxProofs.forEach(function(proof) {
            proofsSet.add(proof);
        });

        genericProofs.forEach(function(proof) {
            proofsSet.add(proof);
        });

        allProofs = Array.from(proofsSet);

        // Assign IDs to proofs without them
        allProofs.forEach(function(proof, index) {
            if (!proof.id) {
                proof.id = 'tex2any-proof-' + index;
            }
        });
    }

    function loadProofStates() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Only use saved states if they're for the current document
                const currentUrl = window.location.pathname;
                if (parsed.url === currentUrl) {
                    proofStates = parsed.states || {};
                }
            }
        } catch (e) {
            console.error('tex2any: Could not load proof states', e);
            proofStates = {};
        }
    }

    function saveProofStates() {
        try {
            const data = {
                url: window.location.pathname,
                states: proofStates,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('tex2any: Could not save proof states', e);
        }
    }

    function addToggleButton(proof) {
        // Check if toggle already exists
        if (proof.querySelector('.tex2any-proof-toggle')) {
            return;
        }

        const toggle = document.createElement('button');
        toggle.className = 'tex2any-proof-toggle';
        toggle.setAttribute('aria-label', 'Toggle proof visibility');

        // Arrow icon
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z');
        icon.appendChild(path);

        const text = document.createElement('span');
        text.textContent = 'Hide Proof';

        toggle.appendChild(icon);
        toggle.appendChild(text);

        // Click handler
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleProof(proof, toggle);
        });

        // Insert at beginning of proof
        if (proof.firstChild) {
            proof.insertBefore(toggle, proof.firstChild);
        } else {
            proof.appendChild(toggle);
        }

        // Wrap proof content (everything except toggle button)
        wrapProofContent(proof);

        // Add preview text for collapsed state
        addPreviewText(proof);
    }

    function wrapProofContent(proof) {
        // Skip if already wrapped
        if (proof.querySelector('.ltx_proof_content') || proof.querySelector('.proof-content')) {
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'ltx_proof_content';

        const toggle = proof.querySelector('.tex2any-proof-toggle');
        const children = Array.from(proof.childNodes);

        children.forEach(function(child) {
            if (child !== toggle && !child.classList || !child.classList.contains('tex2any-proof-preview')) {
                wrapper.appendChild(child);
            }
        });

        proof.appendChild(wrapper);
    }

    function addPreviewText(proof) {
        const preview = document.createElement('div');
        preview.className = 'tex2any-proof-preview';
        preview.textContent = 'Click to show proof...';
        proof.appendChild(preview);
    }

    function toggleProof(proof, toggle) {
        const isCollapsed = proof.classList.contains('tex2any-collapsed');
        const text = toggle.querySelector('span');
        const content = proof.querySelector('.ltx_proof_content, .proof-content');

        if (isCollapsed) {
            // Expand
            proof.classList.remove('tex2any-collapsed');
            toggle.classList.remove('collapsed');
            text.textContent = 'Hide Proof';

            // Animate expansion
            if (content) {
                const height = content.scrollHeight;
                proof.style.maxHeight = height + 100 + 'px';
            }

            proofStates[proof.id] = false;
        } else {
            // Collapse
            proof.classList.add('tex2any-collapsed');
            toggle.classList.add('collapsed');
            text.textContent = 'Show Proof';

            proofStates[proof.id] = true;
        }

        saveProofStates();
        updateToolbarCounter();
    }

    function applyProofStates() {
        allProofs.forEach(function(proof) {
            const toggle = proof.querySelector('.tex2any-proof-toggle');
            if (!toggle) return;

            // Check if we have a saved state for this proof
            const savedState = proofStates[proof.id];
            const shouldCollapse = savedState !== undefined ? savedState : COLLAPSE_BY_DEFAULT;

            if (shouldCollapse) {
                proof.classList.add('tex2any-collapsed');
                toggle.classList.add('collapsed');
                toggle.querySelector('span').textContent = 'Show Proof';
            } else {
                proof.classList.remove('tex2any-collapsed');
                toggle.classList.remove('collapsed');
                toggle.querySelector('span').textContent = 'Hide Proof';
            }

            // Set initial max-height for smooth animations
            const content = proof.querySelector('.ltx_proof_content, .proof-content');
            if (content && !shouldCollapse) {
                proof.style.maxHeight = content.scrollHeight + 100 + 'px';
            }
        });
    }

    function addToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'tex2any-proofs-toolbar';

        // Counter
        const counter = document.createElement('div');
        counter.className = 'tex2any-proof-counter';
        counter.textContent = allProofs.length + ' proof' + (allProofs.length !== 1 ? 's' : '');

        // Expand all button
        const expandAll = document.createElement('button');
        expandAll.setAttribute('aria-label', 'Expand all proofs');

        const expandIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        expandIcon.setAttribute('viewBox', '0 0 24 24');
        expandIcon.setAttribute('aria-hidden', 'true');
        const expandPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        expandPath.setAttribute('d', 'M12 5.83L15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9 12 5.83zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15 12 18.17z');
        expandIcon.appendChild(expandPath);

        const expandText = document.createElement('span');
        expandText.textContent = 'Expand All';

        expandAll.appendChild(expandIcon);
        expandAll.appendChild(expandText);

        expandAll.addEventListener('click', function() {
            expandAllProofs();
        });

        // Collapse all button
        const collapseAll = document.createElement('button');
        collapseAll.setAttribute('aria-label', 'Collapse all proofs');

        const collapseIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        collapseIcon.setAttribute('viewBox', '0 0 24 24');
        collapseIcon.setAttribute('aria-hidden', 'true');
        const collapsePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        collapsePath.setAttribute('d', 'M7.41 18.59L8.83 20 12 16.83 15.17 20l1.41-1.41L12 14l-4.59 4.59zm9.18-13.18L15.17 4 12 7.17 8.83 4 7.41 5.41 12 10l4.59-4.59z');
        collapseIcon.appendChild(collapsePath);

        const collapseText = document.createElement('span');
        collapseText.textContent = 'Collapse All';

        collapseAll.appendChild(collapseIcon);
        collapseAll.appendChild(collapseText);

        collapseAll.addEventListener('click', function() {
            collapseAllProofs();
        });

        toolbar.appendChild(counter);
        toolbar.appendChild(expandAll);
        toolbar.appendChild(collapseAll);

        document.body.appendChild(toolbar);

        updateToolbarCounter();
    }

    function expandAllProofs() {
        allProofs.forEach(function(proof) {
            if (proof.classList.contains('tex2any-collapsed')) {
                const toggle = proof.querySelector('.tex2any-proof-toggle');
                if (toggle) {
                    toggleProof(proof, toggle);
                }
            }
        });
    }

    function collapseAllProofs() {
        allProofs.forEach(function(proof) {
            if (!proof.classList.contains('tex2any-collapsed')) {
                const toggle = proof.querySelector('.tex2any-proof-toggle');
                if (toggle) {
                    toggleProof(proof, toggle);
                }
            }
        });
    }

    function updateToolbarCounter() {
        const counter = document.querySelector('.tex2any-proof-counter');
        if (!counter) return;

        const collapsed = allProofs.filter(function(p) {
            return p.classList.contains('tex2any-collapsed');
        }).length;

        const expanded = allProofs.length - collapsed;

        counter.textContent = allProofs.length + ' proof' + (allProofs.length !== 1 ? 's' : '') +
            ' (' + expanded + ' visible)';
    }

    function addKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + Shift + P - Toggle all proofs
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                toggleAllProofs();
            }
        });
    }

    function toggleAllProofs() {
        // Count collapsed vs expanded
        const collapsed = allProofs.filter(function(p) {
            return p.classList.contains('tex2any-collapsed');
        }).length;

        // If more than half are collapsed, expand all; otherwise collapse all
        if (collapsed > allProofs.length / 2) {
            expandAllProofs();
        } else {
            collapseAllProofs();
        }
    }

    function showHintOnFirstVisit() {
        // Check if hint has been shown before
        try {
            const hintShown = localStorage.getItem('tex2any-proofs-hint-shown');
            if (hintShown) return;

            // Show hint
            const hint = document.createElement('div');
            hint.className = 'tex2any-proofs-hint show';
            hint.innerHTML = 'Press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> to toggle all proofs';

            document.body.appendChild(hint);

            // Auto-hide after 5 seconds
            setTimeout(function() {
                hint.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(function() {
                    hint.remove();
                }, 300);
            }, 5000);

            // Mark as shown
            localStorage.setItem('tex2any-proofs-hint-shown', 'true');
        } catch (e) {
            // Ignore localStorage errors
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCollapsibleProofs);
    } else {
        initCollapsibleProofs();
    }
})();
