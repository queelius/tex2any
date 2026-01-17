"""Tests for the composer module."""

import pytest
import json
from pathlib import Path
from unittest.mock import patch, MagicMock

from tex2any.composer import HTMLInjector, HTMLComposer


class TestHTMLInjector:
    """Tests for HTMLInjector class."""

    class TestFindClosingTag:
        """Tests for _find_closing_tag method."""

        def test_finds_lowercase_closing_tag(self):
            """Should find lowercase closing tag."""
            html = "<html><head></head><body></body></html>"
            pos = HTMLInjector._find_closing_tag(html, 'head')
            assert pos is not None
            assert html[pos:pos+7] == '</head>'

        def test_finds_uppercase_closing_tag(self):
            """Should find uppercase closing tag (case-insensitive)."""
            html = "<html><HEAD></HEAD><body></body></html>"
            pos = HTMLInjector._find_closing_tag(html, 'head')
            assert pos is not None
            assert html[pos:pos+7].lower() == '</head>'

        def test_finds_mixed_case_closing_tag(self):
            """Should find mixed-case closing tag."""
            html = "<html><Head></Head><body></body></html>"
            pos = HTMLInjector._find_closing_tag(html, 'head')
            assert pos is not None

        def test_returns_none_when_not_found(self):
            """Should return None when tag not found."""
            html = "<html><body></body></html>"
            pos = HTMLInjector._find_closing_tag(html, 'head')
            assert pos is None

    class TestFindOpeningTagEnd:
        """Tests for _find_opening_tag_end method."""

        def test_finds_simple_opening_tag(self):
            """Should find position after simple opening tag."""
            html = "<html><body>content</body></html>"
            pos = HTMLInjector._find_opening_tag_end(html, 'body')
            assert pos is not None
            assert html[pos:pos+7] == 'content'

        def test_finds_opening_tag_with_attributes(self):
            """Should find position after opening tag with attributes."""
            html = '<html><body class="main" id="content">text</body></html>'
            pos = HTMLInjector._find_opening_tag_end(html, 'body')
            assert pos is not None
            assert html[pos:pos+4] == 'text'

        def test_case_insensitive(self):
            """Should be case-insensitive."""
            html = "<html><BODY>content</BODY></html>"
            pos = HTMLInjector._find_opening_tag_end(html, 'body')
            assert pos is not None

        def test_returns_none_when_not_found(self):
            """Should return None when tag not found."""
            html = "<html></html>"
            pos = HTMLInjector._find_opening_tag_end(html, 'body')
            assert pos is None

    class TestInjectIntoHead:
        """Tests for inject_into_head method."""

        def test_injects_before_closing_head(self):
            """Should inject content before </head>."""
            html = "<html><head><title>Test</title></head><body></body></html>"
            result = HTMLInjector.inject_into_head(html, '<style>body{}</style>')

            assert '<style>body{}</style>' in result
            assert result.index('<style>') < result.index('</head>')

        def test_injects_case_insensitive_head(self):
            """Should handle uppercase HEAD tag."""
            html = "<html><HEAD><title>Test</title></HEAD><body></body></html>"
            result = HTMLInjector.inject_into_head(html, '<style>body{}</style>')

            assert '<style>body{}</style>' in result
            # Verify injection happened before closing head
            assert result.lower().index('<style>') < result.lower().index('</head>')

        def test_fallback_to_after_body_open(self):
            """Should inject after <body> if no </head> found."""
            html = "<body>content</body>"
            result = HTMLInjector.inject_into_head(html, '<style>body{}</style>')

            assert '<style>body{}</style>' in result

        def test_fallback_to_prepend(self):
            """Should prepend if no head or body found."""
            html = "<div>content</div>"
            result = HTMLInjector.inject_into_head(html, '<style>body{}</style>')

            assert result.startswith('<style>body{}</style>')

    class TestInjectBeforeBodyClose:
        """Tests for inject_before_body_close method."""

        def test_injects_before_closing_body(self):
            """Should inject content before </body>."""
            html = "<html><body><p>content</p></body></html>"
            result = HTMLInjector.inject_before_body_close(html, '<script>alert(1)</script>')

            assert '<script>alert(1)</script>' in result
            assert result.index('<script>') < result.index('</body>')

        def test_injects_case_insensitive_body(self):
            """Should handle uppercase BODY tag."""
            html = "<html><BODY><p>content</p></BODY></html>"
            result = HTMLInjector.inject_before_body_close(html, '<script>alert(1)</script>')

            assert '<script>alert(1)</script>' in result

        def test_fallback_to_append(self):
            """Should append if no </body> found."""
            html = "<div>content</div>"
            result = HTMLInjector.inject_before_body_close(html, '<script>alert(1)</script>')

            assert result.endswith('<script>alert(1)</script>')

    class TestEscaping:
        """Tests for escaping methods."""

        def test_escape_for_attribute(self):
            """Should escape special characters for HTML attributes."""
            result = HTMLInjector.escape_for_attribute('value with "quotes" & <tags>')
            assert '&quot;' in result
            assert '&amp;' in result
            assert '&lt;' in result
            assert '&gt;' in result

        def test_escape_json_for_attribute(self):
            """Should escape JSON for use in HTML attributes."""
            data = {'key': 'value with "quotes"', 'nested': {'a': 1}}
            result = HTMLInjector.escape_json_for_attribute(data)

            # Should be valid when unescaped
            import html
            unescaped = html.unescape(result)
            parsed = json.loads(unescaped)
            assert parsed == data

        def test_escape_json_prevents_xss(self):
            """Should prevent XSS through JSON attribute injection."""
            data = {'key': '<script>alert("xss")</script>'}
            result = HTMLInjector.escape_json_for_attribute(data)

            # Should not contain raw script tags
            assert '<script>' not in result


class TestHTMLComposer:
    """Tests for HTMLComposer class."""

    class TestInit:
        """Tests for HTMLComposer initialization."""

        def test_init_with_valid_file(self, tmp_path):
            """Should accept a valid HTML file."""
            html_file = tmp_path / "test.html"
            html_file.write_text("<html><body></body></html>")

            composer = HTMLComposer(html_file)
            assert composer.html_path == html_file

        def test_init_with_missing_file(self, tmp_path):
            """Should raise FileNotFoundError for missing file."""
            with pytest.raises(FileNotFoundError, match="HTML file not found"):
                HTMLComposer(tmp_path / "nonexistent.html")

    class TestWrapInContainer:
        """Tests for _wrap_in_container method."""

        @pytest.fixture
        def composer(self, tmp_path):
            """Create a composer with a test HTML file."""
            html_file = tmp_path / "test.html"
            html_file.write_text("<html><head></head><body><p>content</p></body></html>")
            return HTMLComposer(html_file)

        def test_wraps_body_content(self, composer):
            """Should wrap body content in container div."""
            html = "<html><head></head><body><p>content</p></body></html>"
            result = composer._wrap_in_container(html)

            assert 'class="tex2any-content-wrapper"' in result
            assert '<p>content</p>' in result

        def test_adds_container_css(self, composer):
            """Should add CSS for the container."""
            html = "<html><head></head><body><p>content</p></body></html>"
            result = composer._wrap_in_container(html)

            assert '.tex2any-content-wrapper' in result
            assert 'position: relative' in result

        def test_handles_uppercase_body_tag(self, composer):
            """Should handle uppercase BODY tag."""
            html = "<html><head></head><BODY><p>content</p></BODY></html>"
            result = composer._wrap_in_container(html)

            assert 'class="tex2any-content-wrapper"' in result

        def test_returns_unchanged_if_no_body(self, composer):
            """Should return unchanged HTML if no body tag found."""
            html = "<div>content</div>"
            result = composer._wrap_in_container(html)

            assert result == html

    class TestInjectFooterConfig:
        """Tests for _inject_footer_config method."""

        @pytest.fixture
        def composer(self, tmp_path):
            """Create a composer with a test HTML file."""
            html_file = tmp_path / "test.html"
            html_file.write_text("<html><head></head><body></body></html>")
            return HTMLComposer(html_file)

        def test_injects_meta_tag_with_config(self, composer):
            """Should inject meta tag with footer configuration."""
            html = "<html><head></head><body></body></html>"

            with patch('tex2any.composer.get_config') as mock_config:
                mock_config.return_value.get_footer_data.return_value = {
                    'author_name': 'Test Author',
                    'copyright_year': '2025'
                }
                result = composer._inject_footer_config(html)

            assert 'name="tex2any-footer-config"' in result
            assert 'content="' in result
            # JSON should be in the content (quotes escaped as &quot;)
            assert '&quot;author_name&quot;' in result

        def test_escapes_json_properly(self, composer):
            """Should properly escape JSON in the meta tag."""
            html = "<html><head></head><body></body></html>"

            with patch('tex2any.composer.get_config') as mock_config:
                mock_config.return_value.get_footer_data.return_value = {
                    'custom_text': 'Text with "quotes" and <tags>'
                }
                result = composer._inject_footer_config(html)

            # Should not contain raw quotes or angle brackets in attribute
            assert 'content="' in result
            # The HTML-escaped JSON should be in the content
            assert '&quot;' in result or '&#' in result

    class TestWrapForSidebarRight:
        """Tests for _wrap_for_sidebar_right method."""

        @pytest.fixture
        def composer(self, tmp_path):
            """Create a composer with a test HTML file."""
            html_file = tmp_path / "test.html"
            html_file.write_text("<html><head></head><body><p>content</p></body></html>")
            return HTMLComposer(html_file)

        def test_wraps_content_in_sidebar_layout(self, composer):
            """Should wrap content in sidebar layout structure."""
            html = "<html><head></head><body><p>content</p></body></html>"
            result = composer._wrap_for_sidebar_right(html)

            assert 'class="tex2any-layout-with-sidebar-right"' in result
            assert 'class="tex2any-main-content"' in result
            assert 'class="tex2any-sidebar-right"' in result
            assert '<p>content</p>' in result

        def test_handles_uppercase_body_tag(self, composer):
            """Should handle uppercase BODY tag."""
            html = "<html><head></head><BODY><p>content</p></BODY></html>"
            result = composer._wrap_for_sidebar_right(html)

            assert 'class="tex2any-layout-with-sidebar-right"' in result

        def test_returns_unchanged_if_no_body(self, composer):
            """Should return unchanged HTML if no body tag found."""
            html = "<div>content</div>"
            result = composer._wrap_for_sidebar_right(html)

            assert result == html


class TestHTMLComposerIntegration:
    """Integration tests for HTMLComposer."""

    def test_apply_theme_and_components(self, tmp_path):
        """Should apply theme and components to HTML file."""
        html_file = tmp_path / "test.html"
        html_file.write_text("""<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body><p>content</p></body>
</html>""")

        composer = HTMLComposer(html_file)
        composer.apply_theme_and_components(
            theme_name='academic',
            component_names=['toc']
        )

        result = html_file.read_text()

        # Should have theme CSS
        assert '/* Theme: academic */' in result
        # Should have component CSS
        assert '/* Component: toc */' in result
        # Should have wrapper
        assert 'tex2any-content-wrapper' in result

    def test_inject_html_elements_with_sidebar(self, tmp_path):
        """Should inject sidebar HTML elements."""
        html_file = tmp_path / "test.html"
        html_file.write_text("""<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body><p>content</p></body>
</html>""")

        composer = HTMLComposer(html_file)
        composer.inject_html_elements(['sidebar-right'])

        result = html_file.read_text()
        assert 'tex2any-layout-with-sidebar-right' in result
