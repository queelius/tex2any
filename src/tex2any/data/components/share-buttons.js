// Share Buttons Component JavaScript
(function() {
    'use strict';

    function initShareButtons() {
        // Get document metadata
        const pageTitle = document.title || 'Document';
        const pageUrl = window.location.href;
        const pageDescription = getMetaContent('description') ||
                               getMetaContent('og:description') ||
                               'Check out this document';

        // Create share container
        const container = document.createElement('div');
        container.className = 'tex2any-share-container';

        // Create main share button
        const shareButton = document.createElement('button');
        shareButton.className = 'tex2any-share-button';
        shareButton.setAttribute('aria-label', 'Share this page');
        shareButton.setAttribute('aria-expanded', 'false');
        shareButton.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
        `;

        // Create share menu
        const menu = document.createElement('div');
        menu.className = 'tex2any-share-menu';
        menu.setAttribute('role', 'menu');

        // Share options
        const shareOptions = [
            {
                name: 'twitter',
                label: 'Share on Twitter',
                icon: '<svg viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>',
                action: function() {
                    const twitterUrl = 'https://twitter.com/intent/tweet?text=' +
                        encodeURIComponent(pageTitle) + '&url=' + encodeURIComponent(pageUrl);
                    window.open(twitterUrl, '_blank', 'width=550,height=420');
                }
            },
            {
                name: 'linkedin',
                label: 'Share on LinkedIn',
                icon: '<svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
                action: function() {
                    const linkedinUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' +
                        encodeURIComponent(pageUrl);
                    window.open(linkedinUrl, '_blank', 'width=550,height=420');
                }
            },
            {
                name: 'email',
                label: 'Share via Email',
                icon: '<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
                action: function() {
                    const emailUrl = 'mailto:?subject=' + encodeURIComponent(pageTitle) +
                        '&body=' + encodeURIComponent(pageDescription + '\n\n' + pageUrl);
                    window.location.href = emailUrl;
                }
            },
            {
                name: 'copy-link',
                label: 'Copy Link',
                icon: '<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>',
                action: function() {
                    copyToClipboard(pageUrl);
                    showNotification('Link copied to clipboard!');
                    closeMenu();
                }
            }
        ];

        // Create menu items
        shareOptions.forEach(function(option) {
            const item = document.createElement('button');
            item.className = 'tex2any-share-item ' + option.name;
            item.setAttribute('role', 'menuitem');
            item.innerHTML = option.icon + '<span>' + option.label + '</span>';

            item.addEventListener('click', function(e) {
                e.stopPropagation();
                option.action();
                if (option.name !== 'copy-link') {
                    closeMenu();
                }
            });

            menu.appendChild(item);
        });

        // Assemble components
        container.appendChild(shareButton);
        container.appendChild(menu);
        document.body.appendChild(container);

        // Toggle menu
        let isOpen = false;
        shareButton.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMenu();
        });

        function toggleMenu() {
            isOpen = !isOpen;
            menu.classList.toggle('open', isOpen);
            shareButton.setAttribute('aria-expanded', isOpen);
        }

        function closeMenu() {
            isOpen = false;
            menu.classList.remove('open');
            shareButton.setAttribute('aria-expanded', 'false');
        }

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (isOpen && !container.contains(e.target)) {
                closeMenu();
            }
        });

        // Close menu on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isOpen) {
                closeMenu();
                shareButton.focus();
            }
        });

        // Keyboard navigation
        shareButton.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMenu();
                if (isOpen) {
                    // Focus first menu item
                    const firstItem = menu.querySelector('.tex2any-share-item');
                    if (firstItem) {
                        firstItem.focus();
                    }
                }
            }
        });

        // Arrow key navigation in menu
        menu.addEventListener('keydown', function(e) {
            const items = Array.from(menu.querySelectorAll('.tex2any-share-item'));
            const currentIndex = items.indexOf(document.activeElement);

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % items.length;
                items[nextIndex].focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + items.length) % items.length;
                items[prevIndex].focus();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                if (e.shiftKey) {
                    const prevIndex = (currentIndex - 1 + items.length) % items.length;
                    items[prevIndex].focus();
                } else {
                    const nextIndex = (currentIndex + 1) % items.length;
                    items[nextIndex].focus();
                }
            }
        });
    }

    function getMetaContent(name) {
        const meta = document.querySelector('meta[name="' + name + '"], meta[property="' + name + '"]');
        return meta ? meta.getAttribute('content') : null;
    }

    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(function(err) {
                console.error('Failed to copy:', err);
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }

        document.body.removeChild(textarea);
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'tex2any-share-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(function() {
            notification.classList.add('show');
        }, 10);

        // Remove after 2 seconds
        setTimeout(function() {
            notification.classList.remove('show');
            setTimeout(function() {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initShareButtons);
    } else {
        initShareButtons();
    }
})();