// SEO Meta Component JavaScript
// Comprehensive SEO meta tags generation
(function() {
    'use strict';

    function initSEOMeta() {
        // Extract document metadata
        const metadata = extractMetadata();

        // Generate and inject meta tags
        injectMetaTags(metadata);

        // Add debug indicator (optional)
        if (window.location.search.includes('debug-seo')) {
            addDebugIndicator();
        }

        console.log('tex2any: SEO meta tags generated');
    }

    function extractMetadata() {
        const metadata = {
            title: '',
            description: '',
            keywords: [],
            authors: [],
            publishedDate: '',
            modifiedDate: new Date().toISOString(),
            canonicalUrl: window.location.href.split('?')[0],
            imageUrl: '',
            siteName: 'Academic Document'
        };

        // Extract title
        const titleElement = document.querySelector('.ltx_title, h1.ltx_title, article h1, h1, title');
        if (titleElement) {
            metadata.title = titleElement.textContent.trim();
        }

        // If no title found, use document title
        if (!metadata.title && document.title) {
            metadata.title = document.title;
        }

        // Extract authors
        const authorElements = document.querySelectorAll('.ltx_author, .ltx_authors .ltx_author, .ltx_personname');
        authorElements.forEach(function(author) {
            const authorName = author.textContent.trim();
            if (authorName && metadata.authors.indexOf(authorName) === -1) {
                metadata.authors.push(authorName);
            }
        });

        // Extract date
        const dateElement = document.querySelector('.ltx_date, .ltx_dates');
        if (dateElement) {
            metadata.publishedDate = dateElement.textContent.trim();
        }

        // Extract abstract as description
        const abstractElement = document.querySelector('.ltx_abstract, .abstract');
        if (abstractElement) {
            const abstractText = abstractElement.textContent.trim();
            // Remove "Abstract" prefix and truncate to 150 chars
            metadata.description = abstractText
                .replace(/^Abstract:?\s*/i, '')
                .substring(0, 150)
                .trim();

            // Add ellipsis if truncated
            if (abstractText.length > 150) {
                metadata.description += '...';
            }
        }

        // Fallback: Use first paragraph as description
        if (!metadata.description) {
            const firstPara = document.querySelector('p, .ltx_p');
            if (firstPara) {
                const text = firstPara.textContent.trim();
                metadata.description = text.substring(0, 150);
                if (text.length > 150) {
                    metadata.description += '...';
                }
            }
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

        // Extract or find first image for og:image
        const firstImage = document.querySelector('.ltx_figure img, figure img, img');
        if (firstImage) {
            let imgSrc = firstImage.getAttribute('src');
            // Convert relative URL to absolute
            if (imgSrc && !imgSrc.startsWith('http')) {
                const baseUrl = window.location.origin;
                imgSrc = new URL(imgSrc, baseUrl).href;
            }
            metadata.imageUrl = imgSrc || '';
        }

        return metadata;
    }

    function injectMetaTags(metadata) {
        const head = document.head || document.getElementsByTagName('head')[0];

        // Basic meta tags
        addMetaTag('description', metadata.description);

        if (metadata.keywords.length > 0) {
            addMetaTag('keywords', metadata.keywords.join(', '));
        }

        if (metadata.authors.length > 0) {
            addMetaTag('author', metadata.authors.join(', '));
        }

        // Open Graph meta tags
        addMetaTag('og:title', metadata.title, 'property');
        addMetaTag('og:description', metadata.description, 'property');
        addMetaTag('og:type', 'article', 'property');
        addMetaTag('og:url', metadata.canonicalUrl, 'property');

        if (metadata.imageUrl) {
            addMetaTag('og:image', metadata.imageUrl, 'property');
        }

        addMetaTag('og:site_name', metadata.siteName, 'property');

        // Twitter Card meta tags
        addMetaTag('twitter:card', 'summary_large_image', 'name');
        addMetaTag('twitter:title', metadata.title, 'name');
        addMetaTag('twitter:description', metadata.description, 'name');

        if (metadata.imageUrl) {
            addMetaTag('twitter:image', metadata.imageUrl, 'name');
        }

        // Canonical URL
        addLinkTag('canonical', metadata.canonicalUrl);

        // JSON-LD structured data
        injectJSONLD(metadata);

        // Additional meta tags
        addMetaTag('robots', 'index, follow');
        addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    }

    function addMetaTag(name, content, attributeName) {
        if (!content) return;

        attributeName = attributeName || 'name';

        // Check if tag already exists
        const existingTag = document.querySelector('meta[' + attributeName + '="' + name + '"]');
        if (existingTag) {
            existingTag.setAttribute('content', content);
            return;
        }

        const meta = document.createElement('meta');
        meta.setAttribute(attributeName, name);
        meta.setAttribute('content', content);

        const head = document.head || document.getElementsByTagName('head')[0];
        head.appendChild(meta);
    }

    function addLinkTag(rel, href) {
        if (!href) return;

        // Check if tag already exists
        const existingTag = document.querySelector('link[rel="' + rel + '"]');
        if (existingTag) {
            existingTag.setAttribute('href', href);
            return;
        }

        const link = document.createElement('link');
        link.setAttribute('rel', rel);
        link.setAttribute('href', href);

        const head = document.head || document.getElementsByTagName('head')[0];
        head.appendChild(link);
    }

    function injectJSONLD(metadata) {
        const structuredData = {
            '@context': 'https://schema.org',
            '@type': 'ScholarlyArticle',
            'headline': metadata.title,
            'description': metadata.description,
            'url': metadata.canonicalUrl,
            'datePublished': metadata.publishedDate || new Date().toISOString(),
            'dateModified': metadata.modifiedDate
        };

        if (metadata.authors.length > 0) {
            structuredData.author = metadata.authors.map(function(author) {
                return {
                    '@type': 'Person',
                    'name': author
                };
            });
        }

        if (metadata.imageUrl) {
            structuredData.image = metadata.imageUrl;
        }

        if (metadata.keywords.length > 0) {
            structuredData.keywords = metadata.keywords.join(', ');
        }

        // Check if JSON-LD already exists
        const existingScript = document.querySelector('script[type="application/ld+json"]');
        if (existingScript) {
            existingScript.textContent = JSON.stringify(structuredData, null, 2);
            return;
        }

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData, null, 2);

        const head = document.head || document.getElementsByTagName('head')[0];
        head.appendChild(script);
    }

    function addDebugIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'tex2any-seo-debug show';

        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z');
        icon.appendChild(path);

        const text = document.createElement('span');
        text.textContent = 'SEO OK';

        indicator.appendChild(icon);
        indicator.appendChild(text);

        document.body.appendChild(indicator);

        // Auto-hide after 3 seconds
        setTimeout(function() {
            indicator.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(function() {
                indicator.remove();
            }, 300);
        }, 3000);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSEOMeta);
    } else {
        initSEOMeta();
    }
})();
