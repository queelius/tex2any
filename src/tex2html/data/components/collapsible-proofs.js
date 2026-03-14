// Collapsible Proofs Component
// Adds show/hide toggle to .ltx_proof elements. Stateless — no persistence.
(function () {
    'use strict';

    function init() {
        var proofs = document.querySelectorAll('.ltx_proof');
        if (proofs.length === 0) return;

        proofs.forEach(function (proof) {
            // Wrap existing content (skip the title if present)
            var body = document.createElement('div');
            body.className = 'proof-body';

            var title = proof.querySelector('.ltx_title');
            var children = Array.from(proof.childNodes);
            children.forEach(function (child) {
                if (child !== title) body.appendChild(child);
            });
            proof.appendChild(body);

            // Measure natural height for animation
            body.style.maxHeight = body.scrollHeight + 'px';

            // Create toggle button
            var btn = document.createElement('button');
            btn.className = 'proof-toggle';
            btn.setAttribute('aria-label', 'Toggle proof');

            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('aria-hidden', 'true');
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z');
            svg.appendChild(path);

            var label = document.createElement('span');
            label.textContent = 'Hide proof';

            btn.appendChild(svg);
            btn.appendChild(label);

            // Insert toggle after title, or at start
            if (title) {
                proof.insertBefore(btn, title.nextSibling);
            } else {
                proof.insertBefore(btn, body);
            }

            // Click handler
            btn.addEventListener('click', function () {
                var isCollapsed = proof.classList.contains('collapsed');
                if (isCollapsed) {
                    // Expand
                    proof.classList.remove('collapsed');
                    btn.classList.remove('collapsed');
                    body.style.maxHeight = body.scrollHeight + 'px';
                    label.textContent = 'Hide proof';
                } else {
                    // Collapse
                    proof.classList.add('collapsed');
                    btn.classList.add('collapsed');
                    label.textContent = 'Show proof';
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
