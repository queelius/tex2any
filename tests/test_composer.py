"""Tests for the composer module."""

import pytest
from pathlib import Path

from tex2html.composer import (
    inject_into_head,
    inject_before_body_close,
    compose,
)


class TestInjectIntoHead:
    """Tests for inject_into_head."""

    def test_injects_before_closing_head(self):
        html = "<html><head><title>Test</title></head><body></body></html>"
        result = inject_into_head(html, '<style>body{}</style>')
        assert '<style>body{}</style>' in result
        assert result.index('<style>') < result.index('</head>')

    def test_case_insensitive_head(self):
        html = "<html><HEAD><title>Test</title></HEAD><body></body></html>"
        result = inject_into_head(html, '<style>body{}</style>')
        assert '<style>body{}</style>' in result
        assert result.lower().index('<style>') < result.lower().index('</head>')

    def test_fallback_to_after_body_open(self):
        html = "<body>content</body>"
        result = inject_into_head(html, '<style>body{}</style>')
        assert '<style>body{}</style>' in result

    def test_fallback_to_prepend(self):
        html = "<div>content</div>"
        result = inject_into_head(html, '<style>body{}</style>')
        assert result.startswith('<style>body{}</style>')


class TestInjectBeforeBodyClose:
    """Tests for inject_before_body_close."""

    def test_injects_before_closing_body(self):
        html = "<html><body><p>content</p></body></html>"
        result = inject_before_body_close(html, '<script>x=1</script>')
        assert '<script>x=1</script>' in result
        assert result.index('<script>') < result.index('</body>')

    def test_case_insensitive_body(self):
        html = "<html><BODY><p>content</p></BODY></html>"
        result = inject_before_body_close(html, '<script>x=1</script>')
        assert '<script>x=1</script>' in result

    def test_fallback_to_append(self):
        html = "<div>content</div>"
        result = inject_before_body_close(html, '<script>x=1</script>')
        assert result.endswith('<script>x=1</script>')


class TestCompose:
    """Tests for the compose function."""

    def test_injects_theme_css(self, tmp_path):
        html_file = tmp_path / "test.html"
        html_file.write_text("<html><head></head><body></body></html>")

        compose(html_file, theme_name="academic")
        result = html_file.read_text()

        assert "/* Theme: academic */" in result
        assert "<style>" in result

    def test_injects_component_css_and_js(self, tmp_path):
        html_file = tmp_path / "test.html"
        html_file.write_text("<html><head></head><body></body></html>")

        compose(html_file, component_names=["back-to-top"])
        result = html_file.read_text()

        assert "/* Component: back-to-top */" in result
        assert "<style>" in result
        assert "<script>" in result

    def test_injects_multiple_components(self, tmp_path):
        html_file = tmp_path / "test.html"
        html_file.write_text("<html><head></head><body></body></html>")

        compose(html_file, component_names=["back-to-top", "copy-code"])
        result = html_file.read_text()

        assert "/* Component: back-to-top */" in result
        assert "/* Component: copy-code */" in result

    def test_dark_mode_early_script(self, tmp_path):
        html_file = tmp_path / "test.html"
        html_file.write_text("<html><head></head><body></body></html>")

        compose(html_file, component_names=["dark-mode"])
        result = html_file.read_text()

        # Should have early script for flash prevention
        assert 'tex2html-theme' in result
        assert 'prefers-color-scheme' in result
        # Early script should be before the <style> block
        early_pos = result.index('tex2html-theme')
        style_pos = result.index('<style>')
        assert early_pos < style_pos

    def test_no_early_script_without_dark_mode(self, tmp_path):
        html_file = tmp_path / "test.html"
        html_file.write_text("<html><head></head><body></body></html>")

        compose(html_file, component_names=["back-to-top"])
        result = html_file.read_text()

        assert 'tex2html-theme' not in result

    def test_theme_and_components_together(self, tmp_path):
        html_file = tmp_path / "test.html"
        html_file.write_text("<html><head></head><body></body></html>")

        compose(html_file, theme_name="academic", component_names=["dark-mode", "floating-toc"])
        result = html_file.read_text()

        assert "/* Theme: academic */" in result
        assert "/* Component: dark-mode */" in result
        assert "/* Component: floating-toc */" in result

    def test_custom_components_dir(self, tmp_path):
        html_file = tmp_path / "test.html"
        html_file.write_text("<html><head></head><body></body></html>")

        comp_dir = tmp_path / "components"
        comp_dir.mkdir()
        (comp_dir / "custom.css").write_text(".custom { color: red; }")

        compose(html_file, component_names=["custom"], components_dir=comp_dir)
        result = html_file.read_text()

        assert "/* Component: custom */" in result
        assert ".custom { color: red; }" in result

    def test_no_theme_no_components_is_noop(self, tmp_path):
        html_file = tmp_path / "test.html"
        original = "<html><head></head><body></body></html>"
        html_file.write_text(original)

        compose(html_file)
        result = html_file.read_text()

        assert result == original

    def test_css_only_component_no_script(self, tmp_path):
        html_file = tmp_path / "test.html"
        html_file.write_text("<html><head></head><body></body></html>")

        comp_dir = tmp_path / "components"
        comp_dir.mkdir()
        (comp_dir / "styles-only.css").write_text("body { margin: 0; }")

        compose(html_file, component_names=["styles-only"], components_dir=comp_dir)
        result = html_file.read_text()

        assert "<style>" in result
        assert "<script>" not in result
