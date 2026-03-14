"""Tests for the theme system."""

import pytest
from pathlib import Path

from tex2html.themes import Theme, THEMES, THEMES_DIR, get_theme, _parse_description


class TestTheme:
    """Tests for Theme class."""

    def test_get_css_returns_string(self):
        theme = get_theme('academic')
        css = theme.get_css()
        assert isinstance(css, str)
        assert len(css) > 0

    def test_get_css_contains_css_structure(self):
        theme = get_theme('academic')
        css = theme.get_css()
        assert ':root' in css or 'body' in css

    def test_all_registered_themes_load_css(self):
        for name, theme in THEMES.items():
            css = theme.get_css()
            assert isinstance(css, str), f"Theme {name} failed to load CSS"
            assert len(css) > 0, f"Theme {name} has empty CSS"


class TestThemeRegistry:
    """Tests for theme registry."""

    def test_get_theme_valid(self):
        theme = get_theme('academic')
        assert isinstance(theme, Theme)
        assert theme.name == 'academic'

    def test_get_theme_invalid(self):
        with pytest.raises(ValueError, match="Unknown theme"):
            get_theme('nonexistent-theme')

    def test_known_themes_exist(self):
        expected = ['academic', 'clean', 'dark', 'minimal', 'serif', 'modern']
        for name in expected:
            assert name in THEMES, f"Expected theme '{name}' not found"

    def test_auto_discovers_all_css_files(self):
        """Every .css file in THEMES_DIR should appear in THEMES."""
        css_files = sorted(p.stem for p in THEMES_DIR.glob("*.css"))
        assert sorted(THEMES.keys()) == css_files


class TestParseDescription:
    """Tests for description extraction from CSS comments."""

    def test_extracts_from_standard_comment(self, tmp_path):
        css = tmp_path / "test.css"
        css.write_text("/* My Theme - a nice description */\n:root {}")
        assert _parse_description(css) == "My Theme - a nice description"

    def test_falls_back_to_stem_without_comment(self, tmp_path):
        css = tmp_path / "test.css"
        css.write_text(":root {}")
        assert _parse_description(css) == "test"

    def test_all_builtin_themes_have_descriptions(self):
        """Every built-in theme should have a parsed description, not just its stem."""
        for name, theme in THEMES.items():
            assert theme.description != name, (
                f"Theme '{name}' has no CSS comment description"
            )
