// Copy Code Component
// Adds a copy-to-clipboard button to pre and LaTeXML code blocks.
(function () {
    'use strict';

    // SVG icon data
    var copyPath = 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z';
    var checkPath = 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z';

    function makeSvg(d) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        svg.appendChild(path);
        return svg;
    }

    function init() {
        var blocks = document.querySelectorAll('pre, .ltx_verbatim, .ltx_listing, .ltx_lstlisting');
        if (blocks.length === 0) return;

        blocks.forEach(function (block) {
            if (block.parentElement && block.parentElement.classList.contains('code-wrapper')) return;

            // Wrap
            var wrapper = document.createElement('div');
            wrapper.className = 'code-wrapper';
            block.parentNode.insertBefore(wrapper, block);
            wrapper.appendChild(block);

            // Button
            var btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.setAttribute('aria-label', 'Copy code');
            btn.appendChild(makeSvg(copyPath));
            var label = document.createElement('span');
            label.textContent = 'Copy';
            btn.appendChild(label);

            btn.addEventListener('click', function () {
                var code = block.querySelector('code');
                var text = (code || block).textContent.trim();

                function showFeedback(success) {
                    btn.classList.toggle('copied', success);
                    while (btn.firstChild) btn.removeChild(btn.firstChild);
                    btn.appendChild(makeSvg(success ? checkPath : copyPath));
                    var msg = document.createElement('span');
                    msg.textContent = success ? 'Copied!' : 'Failed';
                    btn.appendChild(msg);

                    setTimeout(function () {
                        btn.classList.remove('copied');
                        while (btn.firstChild) btn.removeChild(btn.firstChild);
                        btn.appendChild(makeSvg(copyPath));
                        var reset = document.createElement('span');
                        reset.textContent = 'Copy';
                        btn.appendChild(reset);
                    }, 2000);
                }

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(
                        function () { showFeedback(true); },
                        function () { showFeedback(false); }
                    );
                } else {
                    showFeedback(false);
                }
            });

            wrapper.appendChild(btn);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
